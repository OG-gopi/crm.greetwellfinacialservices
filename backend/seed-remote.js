const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const dbUrl = 'postgresql://postgres:7893220502%40Gopi@db.wthrxtouwlhjwcfnhkgo.supabase.co:5432/postgres';
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function seed() {
  console.log('Seeding users to Supabase DB...');
  const passwordHash = await bcrypt.hash('Data@1234', 10);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'beesugopikrishna@gmail.com' },
    update: {
      passwordHash,
      firstName: 'Gopikrishna',
      lastName: 'Beesu',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
    },
    create: {
      email: 'beesugopikrishna@gmail.com',
      passwordHash,
      firstName: 'Gopikrishna',
      lastName: 'Beesu',
      phone: '+91 9876543210',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
    },
  });
  console.log('✅ SUCCESS: Seeded user 1:', user1.email, user1.role);

  const user2 = await prisma.user.upsert({
    where: { email: 'gopikrishnabeesu@gmail.com' },
    update: {
      passwordHash,
      firstName: 'Gopikrishna',
      lastName: 'Beesu',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
    },
    create: {
      email: 'gopikrishnabeesu@gmail.com',
      passwordHash,
      firstName: 'Gopikrishna',
      lastName: 'Beesu',
      phone: '+91 9876543211',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
    },
  });
  console.log('✅ SUCCESS: Seeded user 2:', user2.email, user2.role);
  
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('SEED ERROR:', err);
  process.exit(1);
});
