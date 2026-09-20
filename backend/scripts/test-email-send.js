require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const { emailService } = require('../dist/services/emailService');
  
  console.log('Testing email service dispatch...');
  const res = await emailService.sendMail({
    to: 'beesugopikrishna@gmail.com',
    recipientName: 'Gopi Krishna Beesu',
    subject: '[GFS Test] Application Created Notification Test',
    html: '<h3>Test Email</h3><p>Your application APP-LOAN-202600001 has been received.</p>',
    emailType: 'APPLICATION_CREATED',
    emailCategory: 'APPLICATION',
    applicationId: 'APP-LOAN-202600001',
  });

  console.log('Result of sendMail:', res);

  const logs = await prisma.emailDeliveryLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  console.log('\nLatest Email Delivery Logs in Database:');
  console.table(logs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
