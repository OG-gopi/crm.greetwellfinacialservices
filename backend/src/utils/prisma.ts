import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    const directSupabaseUrl = 'postgresql://postgres:7893220502%40Gopi@db.wthrxtouwlhjwcfnhkgo.supabase.co:5432/postgres?sslmode=require&connect_timeout=15';
    const activeUrl = (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('pooler.supabase.com') && !process.env.DATABASE_URL.includes('localhost'))
      ? process.env.DATABASE_URL
      : directSupabaseUrl;

    process.env.DATABASE_URL = activeUrl;
    process.env.DIRECT_URL = activeUrl;

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: activeUrl,
        },
      },
      log: ['error'],
    });
  }
  return prismaInstance;
}

// Proxy wrapper prevents top-level instantiation crashes during serverless module loading
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrisma();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
