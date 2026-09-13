const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../backend/prisma/schema.prisma');
const possiblePrismaPaths = [
  path.resolve(__dirname, '../node_modules/prisma/build/index.js'),
  path.resolve(__dirname, '../backend/node_modules/prisma/build/index.js'),
  path.resolve(__dirname, '../../node_modules/prisma/build/index.js'),
];

const prismaScript = possiblePrismaPaths.find(p => fs.existsSync(p));

try {
  if (prismaScript) {
    console.log(`[Prisma Generator] Executing Prisma CLI via direct JS: ${prismaScript}`);
    execSync(`node "${prismaScript}" generate --schema="${schemaPath}"`, { stdio: 'inherit' });
  } else {
    console.log('[Prisma Generator] Direct JS path not found, executing via npx...');
    execSync(`npx prisma generate --schema="${schemaPath}"`, { stdio: 'inherit' });
  }
  console.log('[Prisma Generator] ✅ Prisma Client generated successfully!');
} catch (err) {
  console.error('[Prisma Generator] ❌ Error generating Prisma Client:', err.message);
  process.exit(1);
}
