process.env.DATABASE_URL = "postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40gfs@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";
process.env.DIRECT_URL = "postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40gfs@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

require('ts-node').register({
  transpileOnly: true
});

require('./prisma/seed.ts');
