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

const possiblePrismaPaths = [
  path.resolve(__dirname, '../node_modules/prisma/build/index.js'),
  path.resolve(__dirname, '../backend/node_modules/prisma/build/index.js'),
  path.resolve(__dirname, '../../node_modules/prisma/build/index.js'),
];

const prismaScript = possiblePrismaPaths.find(p => fs.existsSync(p));

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
  let targetSchema = postgresSchemaPath;
  let dbUrl = process.env.DATABASE_URL || '';

  const isLocalhostPg = dbUrl.includes('localhost:5432') || dbUrl.includes('127.0.0.1:5432');
  let useSqlite = dbUrl.startsWith('file:') || false;

  if (isLocalhostPg) {
    const pgAvailable = await isPortOpen('127.0.0.1', 5432);
    if (!pgAvailable) {
      console.log('ℹ️ [Prisma Generator] Local PostgreSQL (5432) not active. Using SQLite schema & dev.db fallback for local dev.');
      useSqlite = true;
    }
  }

  if (useSqlite || (!dbUrl && process.env.NODE_ENV !== 'production')) {
    targetSchema = sqliteSchemaPath;
    process.env.DATABASE_URL = 'file:./dev.db';
  }

  console.log(`[Prisma Generator] Using schema: ${targetSchema}`);

  try {
    if (prismaScript) {
      console.log(`[Prisma Generator] Executing Prisma CLI via direct JS: ${prismaScript}`);
      execSync(`node "${prismaScript}" generate --schema="${targetSchema}"`, { stdio: 'inherit', env: process.env });
    } else {
      console.log('[Prisma Generator] Direct JS path not found, executing via npx...');
      execSync(`npx prisma generate --schema="${targetSchema}"`, { stdio: 'inherit', env: process.env });
    }

    if (useSqlite && fs.existsSync(sqliteSchemaPath)) {
      console.log('[Prisma Generator] Pushing SQLite schema & syncing local dev database...');
      try {
        if (prismaScript) {
          execSync(`node "${prismaScript}" db push --schema="${targetSchema}" --accept-data-loss`, { stdio: 'inherit', env: process.env });
        } else {
          execSync(`npx prisma db push --schema="${targetSchema}" --accept-data-loss`, { stdio: 'inherit', env: process.env });
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
