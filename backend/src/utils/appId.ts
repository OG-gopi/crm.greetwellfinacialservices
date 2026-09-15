import { prisma } from './prisma';

export async function generateApplicationId(type: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  let prefix = 'APP';
  if (type === 'LOAN') prefix = 'LOAN';
  else if (type === 'INSURANCE') prefix = 'INS';
  else if (type === 'INVESTMENT') prefix = 'INV';

  const yearPrefix = `${prefix}-${currentYear}-`;
  const apps = await prisma.application.findMany({
    where: {
      id: {
        startsWith: yearPrefix,
      },
    },
    select: { id: true },
  });

  let maxSeq = 0;
  for (const app of apps) {
    const parts = app.id.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(6, '0');
  return `${yearPrefix}${nextSeq}`;
}

export async function generateCustomerId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `CUS-${currentYear}-`;

  const [users, invitations] = await Promise.all([
    prisma.user.findMany({
      where: {
        customerIdCode: {
          startsWith: yearPrefix,
        },
      },
      select: { customerIdCode: true },
    }),
    prisma.invitation.findMany({
      where: {
        customerIdCode: {
          startsWith: yearPrefix,
        },
      },
      select: { customerIdCode: true },
    }),
  ]);

  let maxSeq = 0;
  const extractSeq = (code: string | null) => {
    if (!code) return;
    const parts = code.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  };

  users.forEach((u) => extractSeq(u.customerIdCode));
  invitations.forEach((i) => extractSeq(i.customerIdCode));

  const nextSeq = (maxSeq + 1).toString().padStart(6, '0');
  return `${yearPrefix}${nextSeq}`;
}

export async function generateAgentId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `AGT-${currentYear}-`;

  const [users, invitations] = await Promise.all([
    prisma.user.findMany({
      where: {
        agentIdCode: {
          startsWith: yearPrefix,
        },
      },
      select: { agentIdCode: true },
    }),
    prisma.invitation.findMany({
      where: {
        agentIdCode: {
          startsWith: yearPrefix,
        },
      },
      select: { agentIdCode: true },
    }),
  ]);

  let maxSeq = 0;
  const extractSeq = (code: string | null) => {
    if (!code) return;
    const parts = code.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  };

  users.forEach((u) => extractSeq(u.agentIdCode));
  invitations.forEach((i) => extractSeq(i.agentIdCode));

  const nextSeq = (maxSeq + 1).toString().padStart(6, '0');
  return `${yearPrefix}${nextSeq}`;
}

export async function generateAdminId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `ADM-${currentYear}-`;

  const users = await prisma.user.findMany({
    where: {
      adminIdCode: {
        startsWith: yearPrefix,
      },
    },
    select: { adminIdCode: true },
  });

  let maxSeq = 0;
  for (const u of users) {
    if (!u.adminIdCode) continue;
    const parts = u.adminIdCode.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(6, '0');
  return `${yearPrefix}${nextSeq}`;
}

export async function generateSuperAdminId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `SAD-${currentYear}-`;

  const users = await prisma.user.findMany({
    where: {
      superAdminIdCode: {
        startsWith: yearPrefix,
      },
    },
    select: { superAdminIdCode: true },
  });

  let maxSeq = 0;
  for (const u of users) {
    if (!u.superAdminIdCode) continue;
    const parts = u.superAdminIdCode.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(6, '0');
  return `${yearPrefix}${nextSeq}`;
}

export async function generateUserIdByRole(role: string): Promise<{
  customerIdCode?: string;
  agentIdCode?: string;
  adminIdCode?: string;
  superAdminIdCode?: string;
}> {
  if (role === 'CUSTOMER') {
    return { customerIdCode: await generateCustomerId() };
  } else if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(role)) {
    return { agentIdCode: await generateAgentId() };
  } else if (role === 'ADMIN') {
    return { adminIdCode: await generateAdminId() };
  } else if (role === 'SUPER_ADMIN') {
    return { superAdminIdCode: await generateSuperAdminId() };
  }
  return {};
}

