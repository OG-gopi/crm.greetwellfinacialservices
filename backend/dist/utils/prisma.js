"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.getPrisma = getPrisma;
const client_1 = require("@prisma/client");
let prismaInstance = null;
function getPrisma() {
    if (!prismaInstance) {
        const fallbackSupabaseUrl = 'postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40Gopi@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';
        const activeUrl = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '' && !process.env.DATABASE_URL.includes('localhost'))
            ? process.env.DATABASE_URL
            : fallbackSupabaseUrl;
        process.env.DATABASE_URL = activeUrl;
        process.env.DIRECT_URL = activeUrl;
        prismaInstance = new client_1.PrismaClient({
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
exports.prisma = new Proxy({}, {
    get(target, prop) {
        const client = getPrisma();
        const value = client[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});
