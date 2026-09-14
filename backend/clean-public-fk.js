const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:7893220502%40Gopi@db.wthrxtouwlhjwcfnhkgo.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const query = `
    SELECT table_name, constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'
  `;
  
  const res = await client.query(query);
  console.log('Foreign keys found in public:', res.rows.length);

  for (const row of res.rows) {
    try {
      await client.query(`ALTER TABLE public."${row.table_name}" DROP CONSTRAINT "${row.constraint_name}" CASCADE`);
      console.log('Dropped FK:', row.table_name, row.constraint_name);
    } catch (e) {
      console.log('Could not drop FK:', row.table_name, e.message);
    }
  }

  await client.end();
}

run();
