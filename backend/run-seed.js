process.env.DATABASE_URL = "postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40gfs@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";
process.env.DIRECT_URL = "postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40gfs@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

require('ts-node').register({
  transpileOnly: true
});

require('./prisma/seed.ts');
