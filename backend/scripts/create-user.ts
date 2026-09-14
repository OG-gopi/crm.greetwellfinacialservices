import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'beesugopikrishna@gmail.com';
  const password = 'Data@1234';
  const firstName = 'Gopikrishna';
  const lastName = 'Beesu';
  const role = 'SUPER_ADMIN';

  console.log(`Creating/Updating Super Admin user: ${email}...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      firstName,
      lastName,
      role,
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone: '+91 9876543210',
      role,
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
    },
  });

  console.log('✅ Super Admin User successfully created/updated:');
  console.log({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
  });

  // Also create/update gopikrishnabeesu@gmail.com as secondary Super Admin
  const email2 = 'gopikrishnabeesu@gmail.com';
  await prisma.user.upsert({
    where: { email: email2 },
    update: {
      passwordHash,
      firstName,
      lastName,
      role,
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
    },
    create: {
      email: email2,
      passwordHash,
      firstName,
      lastName,
      phone: '+91 9876543211',
      role,
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
    },
  });
  console.log(`✅ Secondary Super Admin User (${email2}) also created/updated.`);
}

main()
  .catch((e) => {
    console.error('Error creating user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
