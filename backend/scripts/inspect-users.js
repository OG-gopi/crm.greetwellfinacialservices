require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, phone: true, customerIdCode: true, agentIdCode: true, superAdminIdCode: true },
  });
  console.log('--- Current Users in Database ---');
  console.table(users);
}

main().finally(() => prisma.$disconnect());
