import { prisma } from '../src/utils/prisma';
import { generateCustomerId, generateAgentId, generateAdminId, generateSuperAdminId } from '../src/utils/appId';

async function main() {
  console.log('--- Starting Backfill of Unique IDs and Application Ownership ---');

  // 1. Backfill Users missing ID codes
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${users.length} total users to check...`);

  for (const u of users) {
    let updateData: any = {};
    if (u.role === 'CUSTOMER' && !u.customerIdCode) {
      updateData.customerIdCode = await generateCustomerId();
      console.log(`Assigning ${updateData.customerIdCode} to Customer ${u.email}`);
    } else if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(u.role) && !u.agentIdCode) {
      updateData.agentIdCode = await generateAgentId();
      console.log(`Assigning ${updateData.agentIdCode} to Agent ${u.email}`);
    } else if (u.role === 'ADMIN' && !u.adminIdCode) {
      updateData.adminIdCode = await generateAdminId();
      console.log(`Assigning ${updateData.adminIdCode} to Admin ${u.email}`);
    } else if (u.role === 'SUPER_ADMIN' && !u.superAdminIdCode) {
      updateData.superAdminIdCode = await generateSuperAdminId();
      console.log(`Assigning ${updateData.superAdminIdCode} to Super Admin ${u.email}`);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: u.id },
        data: updateData,
      });
    }
  }

  // 2. Backfill Applications missing createdById
  const apps = await prisma.application.findMany({
    where: { createdById: null },
  });

  console.log(`Found ${apps.length} applications missing createdById...`);

  for (const app of apps) {
    // Default createdById to customerId if missing
    await prisma.application.update({
      where: { id: app.id },
      data: { createdById: app.customerId },
    });
    console.log(`Set createdById = ${app.customerId} on Application ${app.id}`);
  }

  console.log('--- Backfill Complete! ---');
}

main()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
