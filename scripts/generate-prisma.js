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
    const prismaPkgPath = require.resolve('prisma/package.json');
    const cliPath = path.join(path.dirname(prismaPkgPath), 'build/index.js');
    if (fs.existsSync(cliPath)) {
      return cliPath;
    }
  } catch (e) {
    // Ignore resolution errors and check fallback paths
  }

  const fallbackPaths = [
    path.resolve(__dirname, '../node_modules/prisma/build/index.js'),
    path.resolve(__dirname, '../backend/node_modules/prisma/build/index.js'),
    path.resolve(__dirname, '../../node_modules/prisma/build/index.js'),
  ];

  return fallbackPaths.find(p => fs.existsSync(p)) || null;
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
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/greetwell_crm?schema=public';
    }
    if (!process.env.DIRECT_URL) {
      process.env.DIRECT_URL = process.env.DATABASE_URL;
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

  const prismaScript = getPrismaCliScript();

  try {
    if (prismaScript) {
      console.log(`[Prisma Generator] Executing installed Prisma CLI: ${prismaScript}`);
      execSync(`node "${prismaScript}" generate --schema="${targetSchema}"`, { stdio: 'inherit', env: process.env });
    } else {
      console.log('[Prisma Generator] Executing Prisma CLI via npx --no-install...');
      execSync(`npx --no-install prisma generate --schema="${targetSchema}"`, { stdio: 'inherit', env: process.env });
    }

    if (useSqlite && fs.existsSync(sqliteSchemaPath)) {
      console.log('[Prisma Generator] Pushing SQLite schema & syncing local dev database...');
      try {
        if (prismaScript) {
          execSync(`node "${prismaScript}" db push --schema="${targetSchema}" --accept-data-loss`, { stdio: 'inherit', env: process.env });
        } else {
          execSync(`npx --no-install prisma db push --schema="${targetSchema}" --accept-data-loss`, { stdio: 'inherit', env: process.env });
        }
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
