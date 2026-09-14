const { PrismaClient } = require('../node_modules/@prisma/client');

async function testConn(url, label) {
  console.log(`Testing ${label}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    await prisma.$connect();
    console.log(`SUCCESS [${label}] connected!`);
    await prisma.$disconnect();
  } catch (err) {
    console.log(`FAIL [${label}]:`, err.message);
  }
}

async function run() {
  await testConn('postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40Gopi@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true', 'Pooler 6543 %40');
  await testConn('postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40Gopi@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres', 'Pooler 5432 %40');
  await testConn('postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502@Gopi@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres', 'Pooler 5432 raw @');
}

run();
