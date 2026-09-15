const { Client } = require('pg');

const connectionString = "postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40gfs@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL via port 5432 (Session mode)...');

  try {
    console.log('Adding adminIdCode column...');
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminIdCode" TEXT;`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "User_adminIdCode_key" ON "User"("adminIdCode");`);

    console.log('Adding superAdminIdCode column...');
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "superAdminIdCode" TEXT;`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "User_superAdminIdCode_key" ON "User"("superAdminIdCode");`);

    console.log('Adding createdById column to Application table...');
    await client.query(`ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "createdById" TEXT;`);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Application_createdById_fkey'
        ) THEN
          ALTER TABLE "Application" ADD CONSTRAINT "Application_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('✅ DDL executed successfully!');
  } catch (err) {
    console.error('DDL error:', err);
  } finally {
    await client.end();
  }
}

main();
