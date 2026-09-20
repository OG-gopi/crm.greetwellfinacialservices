require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: ['beesugopikrishna@gmail.com', 'admin@greetwell.com', 'gfsgreetwell@gmail.com', 'gopikrishnabeesu@gmail.com'],
      },
    },
    data: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Updated Super Admin accounts:', result);

  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, status: true } });
  console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
