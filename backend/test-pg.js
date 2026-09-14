const { Client } = require('pg');

async function test(url, label) {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('>>> SUCCESS:', label, '<<<');
    const res = await client.query('SELECT current_user, current_database()');
    console.log('DB Result:', res.rows[0]);
    await client.end();
    return true;
  } catch (e) {
    console.log('FAIL:', label, e.message);
    return false;
  }
}

async function run() {
  const pass = '7893220502%40Gopi';
  const proj = 'wthrxtouwlhjwcfnhkgo';

  console.log('Testing connection variants...');
  await test(`postgresql://postgres.${proj}:${pass}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`, 'Pooler 6543 %40');
  await test(`postgresql://postgres.${proj}:${pass}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`, 'Pooler 5432 %40');
  await test(`postgresql://postgres.${proj}:7893220502@Gopi@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`, 'Pooler 6543 raw @');
  await test(`postgresql://postgres:${pass}@db.${proj}.supabase.co:5432/postgres`, 'Direct 5432');
}

run();
