import { PrismaClient } from '@prisma/client';

const directSupabaseUrl = 'postgresql://postgres:7893220502%40Gopi@db.wthrxtouwlhjwcfnhkgo.supabase.co:5432/postgres';

const activeUrl = (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('pooler.supabase.com') && !process.env.DATABASE_URL.includes('localhost'))
  ? process.env.DATABASE_URL
  : directSupabaseUrl;

process.env.DATABASE_URL = activeUrl;
process.env.DIRECT_URL = activeUrl;

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = (globalThis as any).prismaGlobal || new PrismaClient({
  datasources: {
    db: {
      url: activeUrl,
    },
  },
  log: ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).prismaGlobal = prisma;
}
