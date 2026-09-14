const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Parse .env manually without external dependencies
function loadEnvFile(envPath) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnvFile(path.resolve(__dirname, '../.env'));
loadEnvFile(path.resolve(__dirname, '../backend/.env'));

const postgresSchemaPath = path.resolve(__dirname, '../backend/prisma/schema.prisma');
const sqliteSchemaPath = path.resolve(__dirname, '../backend/prisma/schema.sqlite.prisma');

// Dynamically resolve installed Prisma CLI binary
function getPrismaCliScript() {
  try {
    const mainPath = require.resolve('prisma');
    if (fs.existsSync(mainPath)) return mainPath;
  } catch (e) {}

  try {
    const prismaPkgPath = require.resolve('prisma/package.json');
    const cliPath = path.join(path.dirname(prismaPkgPath), 'build/index.js');
    if (fs.existsSync(cliPath)) return cliPath;
  } catch (e) {}

  const fallbackPaths = [
    path.resolve(__dirname, '../node_modules/prisma/build/index.js'),
    path.resolve(__dirname, '../backend/node_modules/prisma/build/index.js'),
    path.resolve(__dirname, '../../node_modules/prisma/build/index.js'),
    path.resolve(process.cwd(), 'node_modules/prisma/build/index.js'),
    path.resolve(process.cwd(), 'backend/node_modules/prisma/build/index.js'),
  ];

  return fallbackPaths.find(p => fs.existsSync(p)) || null;
}

function executePrisma(commandName, schemaPath, extraArgs = '') {
  const prismaScript = getPrismaCliScript();
  if (prismaScript) {
    console.log(`[Prisma Generator] Executing installed Prisma CLI: ${prismaScript}`);
    execSync(`node "${prismaScript}" ${commandName} --schema="${schemaPath}" ${extraArgs}`, { stdio: 'inherit', env: process.env });
    return;
  }

  const binCandidates = [
    path.resolve(__dirname, '../node_modules/.bin/prisma'),
    path.resolve(__dirname, '../backend/node_modules/.bin/prisma'),
    path.resolve(process.cwd(), 'node_modules/.bin/prisma'),
    path.resolve(process.cwd(), 'backend/node_modules/.bin/prisma'),
  ];

  for (const binPath of binCandidates) {
    const binExecutable = process.platform === 'win32' ? `${binPath}.cmd` : binPath;
    if (fs.existsSync(binExecutable) || fs.existsSync(binPath)) {
      const targetBin = fs.existsSync(binExecutable) ? binExecutable : binPath;
      console.log(`[Prisma Generator] Executing Prisma via bin: ${targetBin}`);
      execSync(`"${targetBin}" ${commandName} --schema="${schemaPath}" ${extraArgs}`, { stdio: 'inherit', env: process.env });
      return;
    }
  }

  console.log('[Prisma Generator] Executing Prisma CLI via npx --yes prisma@5.22.0...');
  execSync(`npx --yes prisma@5.22.0 ${commandName} --schema="${schemaPath}" ${extraArgs}`, { stdio: 'inherit', env: process.env });
}

async function isPortOpen(host, port, timeout = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function run() {
  const isVercel = !!(process.env.VERCEL || process.env.NOW_BUILD || process.env.CI);
  const isProduction = process.env.NODE_ENV === 'production' || isVercel;

  let targetSchema = postgresSchemaPath;
  let dbUrl = process.env.DATABASE_URL || '';
  let useSqlite = false;

  if (isVercel || isProduction) {
    // Vercel / Production deployment MUST always use PostgreSQL production schema
    targetSchema = postgresSchemaPath;
    useSqlite = false;
    const directSupabaseUrl = 'postgresql://postgres:7893220502%40Gopi@db.wthrxtouwlhjwcfnhkgo.supabase.co:5432/postgres';
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('pooler.supabase.com')) {
      process.env.DATABASE_URL = directSupabaseUrl;
      process.env.DIRECT_URL = directSupabaseUrl;
    }
  } else {
    // Local development mode
    const isLocalhostPg = dbUrl.includes('localhost:5432') || dbUrl.includes('127.0.0.1:5432');
    if (dbUrl.startsWith('file:')) {
      useSqlite = true;
    } else if (isLocalhostPg || !dbUrl) {
      const pgAvailable = await isPortOpen('127.0.0.1', 5432);
      if (!pgAvailable) {
        useSqlite = true;
      }
    }

    if (useSqlite) {
      targetSchema = sqliteSchemaPath;
      process.env.DATABASE_URL = 'file:./dev.db';
    }
  }

  console.log(`[Prisma Generator] Environment: ${isVercel ? 'Vercel Production' : 'Local Development'}`);
  console.log(`[Prisma Generator] Using schema: ${targetSchema}`);

  try {
    executePrisma('generate', targetSchema);

    if (useSqlite && fs.existsSync(sqliteSchemaPath)) {
      console.log('[Prisma Generator] Pushing SQLite schema & syncing local dev database...');
      try {
        executePrisma('db push', targetSchema, '--accept-data-loss');
      } catch (pushErr) {
        console.warn('Notice during db push:', pushErr.message);
      }
    }

    console.log('[Prisma Generator] ✅ Prisma Client generated successfully!');
  } catch (err) {
    console.error('[Prisma Generator] ❌ Error generating Prisma Client:', err.message);
    process.exit(1);
  }
}

run();
