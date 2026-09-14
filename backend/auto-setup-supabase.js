const { Client } = require('pg');
const { execSync } = require('child_process');

async function checkAndSeed() {
  console.log("Checking Supabase DB connection...");
  const connectionString = 'postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40Gopi@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("SUCCESS: Supabase database is ACTIVE and CONNECTED!");
    await client.end();

    console.log("Pushing Prisma schema to Supabase...");
    process.env.DATABASE_URL = "postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40Gopi@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
    process.env.DIRECT_URL = "postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40Gopi@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres";
    
    execSync('npx prisma db push', { stdio: 'inherit', cwd: __dirname });
    console.log("Prisma schema pushed successfully!");

    console.log("Seeding Super Admin user...");
    execSync('node scripts/create-user.js', { stdio: 'inherit', cwd: __dirname });
    console.log("Seeding complete!");
  } catch (err) {
    console.error("SUPABASE STATUS:", err.message);
  }
}

checkAndSeed();
