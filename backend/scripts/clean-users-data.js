require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Starting Database User Cleanup ===');

  const preservedEmails = [
    'beesugopikrishna@gmail.com',
    'admin@greetwell.com',
    'gfsgreetwell@gmail.com',
    'gopikrishnabeesu@gmail.com',
  ].map((e) => e.toLowerCase());

  // 1. Identify users to delete
  const usersToDelete = await prisma.user.findMany({
    where: {
      email: {
        notIn: preservedEmails,
      },
    },
    select: { id: true, email: true, role: true },
  });

  const deleteUserIds = usersToDelete.map((u) => u.id);
  console.log(`Found ${usersToDelete.length} non-preserved users to delete:`, usersToDelete.map((u) => `${u.email} (${u.role})`));

  if (deleteUserIds.length > 0) {
    // Clean dependent records
    console.log('Cleaning dependent documents, requirements, tasks, notes, notifications, enquiries, invitations...');
    
    // Delete documents
    await prisma.document.deleteMany({});
    
    // Delete requirements
    await prisma.applicationRequirement.deleteMany({});

    // Delete tasks
    await prisma.task.deleteMany({});

    // Delete notes
    await prisma.note.deleteMany({});

    // Delete whatsapp logs
    await prisma.whatsAppLog.deleteMany({});

    // Delete enquiries & messages
    await prisma.enquiryMessage.deleteMany({});
    await prisma.enquiryHistory.deleteMany({});
    await prisma.enquiry.deleteMany({});

    // Delete applications
    await prisma.application.deleteMany({});

    // Delete audit logs
    await prisma.auditLog.deleteMany({});

    // Delete notifications
    await prisma.notification.deleteMany({});

    // Delete invitations
    await prisma.invitation.deleteMany({});

    // Finally delete non-preserved users
    const deletedCount = await prisma.user.deleteMany({
      where: {
        id: { in: deleteUserIds },
      },
    });

    console.log(`✅ Successfully deleted ${deletedCount.count} users and cleaned all old operational data.`);
  } else {
    console.log('No users to delete.');
  }

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true, superAdminIdCode: true },
  });
  console.log('=== Remaining Preserved Users in Database ===');
  console.table(remainingUsers);
}

main()
  .catch((e) => console.error('Cleanup error:', e))
  .finally(() => prisma.$disconnect());
