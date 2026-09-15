import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for Greetwell Financial Services...');

  // Clean existing data in reverse relation order
  await prisma.roleMethodPermission.deleteMany();
  await prisma.methodPermissionDef.deleteMany();
  await prisma.roleMenuPermission.deleteMany();
  await prisma.menu.deleteMany();

  await prisma.websiteChangeHistory.deleteMany();
  await prisma.websiteMedia.deleteMany();
  await prisma.socialMediaAcc.deleteMany();
  await prisma.contactInfo.deleteMany();
  await prisma.websiteContent.deleteMany();

  await prisma.backupHistory.deleteMany();
  await prisma.report.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.releaseNote.deleteMany();
  await prisma.complaintCategory.deleteMany();
  await prisma.enquiryMessage.deleteMany();
  await prisma.enquiryHistory.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.permissionGroup.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.applicationRequirement.deleteMany();
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();

  await prisma.loanProduct.deleteMany();
  await prisma.insuranceProduct.deleteMany();
  await prisma.investmentProduct.deleteMany();
  await prisma.documentType.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.fAQItem.deleteMany();

  const newSuperAdminPasswordHash = await bcrypt.hash('Data@1234', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const agentPasswordHash = await bcrypt.hash('Agent@123456', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@123456', 10);

  // 1. Create Super Admin & Core Seed Users
  const superAdminPrimary = await prisma.user.create({
    data: {
      email: 'beesugopikrishna@gmail.com',
      passwordHash: newSuperAdminPasswordHash,
      firstName: 'Gopikrishna',
      lastName: 'Beesu',
      phone: '+91 9876543210',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
      emailVerified: true,
    },
  });

  const superAdminAlias1 = await prisma.user.create({
    data: {
      email: 'gopikrishnabeesu@gmail.com',
      passwordHash: newSuperAdminPasswordHash,
      firstName: 'Gopi Krishna',
      lastName: 'Beesu',
      phone: '+91 9876543211',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
      emailVerified: true,
    },
  });

  const superAdminAlias2 = await prisma.user.create({
    data: {
      email: 'gopikrishna@gmail.com',
      passwordHash: newSuperAdminPasswordHash,
      firstName: 'Gopi Krishna',
      lastName: 'Beesu',
      phone: '+91 9876543212',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INSURANCE', 'INVESTMENT']),
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@greetwell.com',
      passwordHash: adminPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1 (555) 019-2831',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'loan.agent@greetwell.com',
      passwordHash: agentPasswordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      phone: '+1 (555) 012-3456',
      role: 'LOAN_AGENT',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'insurance.agent@greetwell.com',
      passwordHash: agentPasswordHash,
      firstName: 'Marcus',
      lastName: 'Vance',
      phone: '+1 (555) 012-7890',
      role: 'INSURANCE_AGENT',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'investment.agent@greetwell.com',
      passwordHash: agentPasswordHash,
      firstName: 'Elena',
      lastName: 'Rostova',
      phone: '+1 (555) 012-4321',
      role: 'INVESTMENT_AGENT',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      passwordHash: customerPasswordHash,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 (555) 014-9988',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      serviceTypes: JSON.stringify(['LOANS', 'INVESTMENT']),
      emailVerified: true,
    },
  });

  console.log('✅ Created core users');

  // 2. Custom Roles
  await prisma.customRole.createMany({
    data: [
      { name: 'Super Admin', code: 'SUPER_ADMIN', description: 'Highest executive portal administrator with full system capabilities.' },
      { name: 'Loan Agent', code: 'LOAN_AGENT', description: 'Specialized agent processing loan applications & borrower requirements.' },
      { name: 'Insurance Agent', code: 'INSURANCE_AGENT', description: 'Specialized agent managing insurance policies & claims underwriting.' },
      { name: 'Investment Agent', code: 'INVESTMENT_AGENT', description: 'Specialized agent overseeing wealth portfolios & investment funds.' },
      { name: 'Customer', code: 'CUSTOMER', description: 'Portal client submitting applications and uploading document verifications.' },
    ],
  });

  // 3. Seed Menus & Role Menu Permissions
  const ALL_ROLES = ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT', 'CUSTOMER'];

  const menusToCreate = [
    // --- SUPERADMIN MENUS ---
    { name: 'Dashboard', url: '/superadmin/dashboard', icon: 'LayoutDashboard', displayOrder: 1, roles: ['SUPER_ADMIN'] },
    { name: 'Users Management', url: '/superadmin/users-parent', icon: 'Users', displayOrder: 2, roles: ['SUPER_ADMIN'] },
    { name: 'All Portal Users', parentUrl: '/superadmin/users-parent', url: '/superadmin/users', icon: 'Users', displayOrder: 1, roles: ['SUPER_ADMIN'] },
    { name: 'Create / Invite User', parentUrl: '/superadmin/users-parent', url: '/superadmin/users/create', icon: 'UserPlus', displayOrder: 2, roles: ['SUPER_ADMIN'] },
    { name: 'Manage & Invite Agents', parentUrl: '/superadmin/users-parent', url: '/superadmin/agents/manage', icon: 'UserCheck', displayOrder: 3, roles: ['SUPER_ADMIN'] },
    { name: 'Customers', parentUrl: '/superadmin/users-parent', url: '/superadmin/customers', icon: 'User', displayOrder: 4, roles: ['SUPER_ADMIN'] },

    { name: 'Applications', url: '/superadmin/applications-parent', icon: 'FileText', displayOrder: 3, roles: ['SUPER_ADMIN'] },
    { name: 'All Applications', parentUrl: '/superadmin/applications-parent', url: '/superadmin/applications/all', icon: 'List', displayOrder: 1, roles: ['SUPER_ADMIN'] },
    { name: 'Loan Applications', parentUrl: '/superadmin/applications-parent', url: '/superadmin/applications/loans', icon: 'DollarSign', displayOrder: 2, roles: ['SUPER_ADMIN'] },
    { name: 'Insurance Applications', parentUrl: '/superadmin/applications-parent', url: '/superadmin/applications/insurance', icon: 'Shield', displayOrder: 3, roles: ['SUPER_ADMIN'] },
    { name: 'Investment Applications', parentUrl: '/superadmin/applications-parent', url: '/superadmin/applications/investments', icon: 'TrendingUp', displayOrder: 4, roles: ['SUPER_ADMIN'] },

    { name: 'Documents', url: '/superadmin/documents', icon: 'FolderOpen', displayOrder: 4, roles: ['SUPER_ADMIN'] },
    { name: 'Products & Services', url: '/superadmin/products-parent', icon: 'Package', displayOrder: 5, roles: ['SUPER_ADMIN'] },
    { name: 'Catalog CMS', parentUrl: '/superadmin/products-parent', url: '/superadmin/products/catalog', icon: 'Package', displayOrder: 1, roles: ['SUPER_ADMIN'] },

    { name: 'Roles & Permissions', url: '/superadmin/permissions-parent', icon: 'ShieldCheck', displayOrder: 6, roles: ['SUPER_ADMIN'] },
    { name: 'Menu Items', parentUrl: '/superadmin/permissions-parent', url: '/superadmin/permissions/menu-items', icon: 'Menu', displayOrder: 1, roles: ['SUPER_ADMIN'] },
    { name: 'Method Permissions', parentUrl: '/superadmin/permissions-parent', url: '/superadmin/permissions/method-permissions', icon: 'Key', displayOrder: 2, roles: ['SUPER_ADMIN'] },

    { name: 'System Management', url: '/superadmin/system-parent', icon: 'Settings', displayOrder: 7, roles: ['SUPER_ADMIN'] },
    { name: 'Global Configurations', parentUrl: '/superadmin/system-parent', url: '/superadmin/system/configurations', icon: 'Sliders', displayOrder: 1, roles: ['SUPER_ADMIN'] },

    { name: 'Website & Portal Management', url: '/superadmin/website-management', icon: 'Globe', displayOrder: 8, roles: ['SUPER_ADMIN'] },
    { name: 'Website Content', parentUrl: '/superadmin/website-management', url: '/superadmin/website-management/content', icon: 'Globe', displayOrder: 1, roles: ['SUPER_ADMIN'] },
    { name: 'Contact Information', parentUrl: '/superadmin/website-management', url: '/superadmin/website-management/contact', icon: 'Globe', displayOrder: 2, roles: ['SUPER_ADMIN'] },
    { name: 'Social Media', parentUrl: '/superadmin/website-management', url: '/superadmin/website-management/social', icon: 'Globe', displayOrder: 3, roles: ['SUPER_ADMIN'] },
    { name: 'Images & Media', parentUrl: '/superadmin/website-management', url: '/superadmin/website-management/media', icon: 'Globe', displayOrder: 4, roles: ['SUPER_ADMIN'] },
    { name: 'Preview Changes', parentUrl: '/superadmin/website-management', url: '/superadmin/website-management/preview', icon: 'Globe', displayOrder: 5, roles: ['SUPER_ADMIN'] },
    { name: 'Change History', parentUrl: '/superadmin/website-management', url: '/superadmin/website-management/history', icon: 'Globe', displayOrder: 6, roles: ['SUPER_ADMIN'] },

    { name: 'Updates & Versions', url: '/superadmin/updates', icon: 'RefreshCw', displayOrder: 9, roles: ['SUPER_ADMIN'] },
    { name: 'Notifications', url: '/superadmin/notifications', icon: 'Bell', displayOrder: 10, roles: ['SUPER_ADMIN'] },
    { name: 'Enquiries / Complaints', url: '/superadmin/enquiries', icon: 'MessageSquare', displayOrder: 11, roles: ['SUPER_ADMIN'] },
    { name: 'Reports', url: '/superadmin/reports', icon: 'BarChart3', displayOrder: 12, roles: ['SUPER_ADMIN'] },
    { name: 'Audit Logs', url: '/superadmin/audit-logs', icon: 'History', displayOrder: 13, roles: ['SUPER_ADMIN'] },
    { name: 'Settings', url: '/superadmin/settings', icon: 'Settings', displayOrder: 14, roles: ['SUPER_ADMIN'] },

    // --- LOAN AGENT MENUS ---
    { name: 'Dashboard', url: '/agent/dashboard', icon: 'LayoutDashboard', displayOrder: 1, roles: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
    { name: 'My Profile', url: '/agent/profile', icon: 'UserCheck', displayOrder: 2, roles: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
    { name: 'My Customers', url: '/agent/customers', icon: 'Users', displayOrder: 3, roles: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
    { name: 'Loan Applications', url: '/agent/loan-applications', icon: 'FileText', displayOrder: 4, roles: ['LOAN_AGENT'] },
    { name: 'Create Loan Application', url: '/agent/loan-applications/create', icon: 'PlusCircle', displayOrder: 5, roles: ['LOAN_AGENT'] },
    { name: 'Assigned Loan Applications', url: '/agent/loan-applications/assigned', icon: 'UserCheck', displayOrder: 6, roles: ['LOAN_AGENT'] },
    { name: 'Loan Documents', url: '/agent/documents', icon: 'FolderOpen', displayOrder: 7, roles: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
    { name: 'Loan Products', url: '/agent/loan-products', icon: 'Package', displayOrder: 8, roles: ['LOAN_AGENT'] },
    { name: 'Application Status', url: '/agent/application-status', icon: 'Activity', displayOrder: 9, roles: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
    { name: 'Notifications', url: '/agent/notifications', icon: 'Bell', displayOrder: 10, roles: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
    { name: 'Updates & Versions', url: '/agent/updates', icon: 'RefreshCw', displayOrder: 11, roles: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
    { name: 'Enquiries / Complaints', url: '/agent/enquiries', icon: 'MessageSquare', displayOrder: 12, roles: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
    { name: 'Settings', url: '/agent/settings', icon: 'Settings', displayOrder: 13, roles: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },

    // --- INSURANCE AGENT MENUS ---
    { name: 'Insurance Applications', url: '/agent/insurance-applications', icon: 'Shield', displayOrder: 4, roles: ['INSURANCE_AGENT'] },
    { name: 'Create Insurance Application', url: '/agent/insurance-applications/create', icon: 'PlusCircle', displayOrder: 5, roles: ['INSURANCE_AGENT'] },
    { name: 'Assigned Insurance Applications', url: '/agent/insurance-applications/assigned', icon: 'UserCheck', displayOrder: 6, roles: ['INSURANCE_AGENT'] },
    { name: 'Insurance Products', url: '/agent/insurance-products', icon: 'Package', displayOrder: 8, roles: ['INSURANCE_AGENT'] },

    // --- INVESTMENT AGENT MENUS ---
    { name: 'Investment Applications', url: '/agent/investment-applications', icon: 'TrendingUp', displayOrder: 4, roles: ['INVESTMENT_AGENT'] },
    { name: 'Create Investment Application', url: '/agent/investment-applications/create', icon: 'PlusCircle', displayOrder: 5, roles: ['INVESTMENT_AGENT'] },
    { name: 'Assigned Investment Applications', url: '/agent/investment-applications/assigned', icon: 'UserCheck', displayOrder: 6, roles: ['INVESTMENT_AGENT'] },
    { name: 'Investment Products', url: '/agent/investment-products', icon: 'Package', displayOrder: 8, roles: ['INVESTMENT_AGENT'] },

    // --- CUSTOMER MENUS ---
    { name: 'Dashboard', url: '/customer/dashboard', icon: 'LayoutDashboard', displayOrder: 1, roles: ['CUSTOMER'] },
    { name: 'My Profile', url: '/customer/profile', icon: 'UserCheck', displayOrder: 2, roles: ['CUSTOMER'] },
    { name: 'My Applications', url: '/customer/applications', icon: 'FileText', displayOrder: 3, roles: ['CUSTOMER'] },
    { name: 'Create Application', url: '/customer/applications/create', icon: 'PlusCircle', displayOrder: 4, roles: ['CUSTOMER'] },
    { name: 'My Documents', url: '/customer/documents', icon: 'FolderOpen', displayOrder: 5, roles: ['CUSTOMER'] },
    { name: 'Loan Services', url: '/customer/loan-services', icon: 'DollarSign', displayOrder: 6, roles: ['CUSTOMER'] },
    { name: 'Insurance Services', url: '/customer/insurance-services', icon: 'Shield', displayOrder: 7, roles: ['CUSTOMER'] },
    { name: 'Investment Services', url: '/customer/investment-services', icon: 'TrendingUp', displayOrder: 8, roles: ['CUSTOMER'] },
    { name: 'Application Status', url: '/customer/application-status', icon: 'Activity', displayOrder: 9, roles: ['CUSTOMER'] },
    { name: 'Notifications', url: '/customer/notifications', icon: 'Bell', displayOrder: 10, roles: ['CUSTOMER'] },
    { name: 'Updates & Versions', url: '/customer/updates', icon: 'RefreshCw', displayOrder: 11, roles: ['CUSTOMER'] },
    { name: 'Enquiries / Complaints', url: '/customer/enquiries', icon: 'MessageSquare', displayOrder: 12, roles: ['CUSTOMER'] },
    { name: 'Settings', url: '/customer/settings', icon: 'Settings', displayOrder: 13, roles: ['CUSTOMER'] },
  ];

  const urlToMenuIdMap = new Map<string, string>();

  // Standalone / Parent Menus
  for (const m of menusToCreate.filter(item => !item.parentUrl)) {
    const menu = await prisma.menu.create({
      data: {
        name: m.name,
        url: m.url,
        icon: m.icon,
        displayOrder: m.displayOrder,
        isActive: true,
      },
    });
    urlToMenuIdMap.set(m.url, menu.id);

    for (const r of ALL_ROLES) {
      await prisma.roleMenuPermission.create({
        data: {
          role: r,
          menuId: menu.id,
          canView: m.roles.includes(r),
        },
      });
    }
  }

  // Child Menus
  for (const m of menusToCreate.filter(item => item.parentUrl)) {
    const parentId = urlToMenuIdMap.get(m.parentUrl!);
    const menu = await prisma.menu.create({
      data: {
        name: m.name,
        parentId: parentId || null,
        url: m.url,
        icon: m.icon,
        displayOrder: m.displayOrder,
        isActive: true,
      },
    });
    urlToMenuIdMap.set(m.url, menu.id);

    for (const r of ALL_ROLES) {
      await prisma.roleMenuPermission.create({
        data: {
          role: r,
          menuId: menu.id,
          canView: m.roles.includes(r),
        },
      });
    }
  }

  console.log('✅ Seeded menus & role menu permissions');

  // 4. Seed Method Permissions & Role Method Permissions
  const methodPermissionsToSeed = [
    { methodName: 'GetUsersList', endpoint: '/api/users', httpMethod: 'GET', permissionType: 'Read', description: 'View all users in portal', allowedRoles: ['SUPER_ADMIN'] },
    { methodName: 'CreateUserAccount', endpoint: '/api/users', httpMethod: 'POST', permissionType: 'Create', description: 'Create user or agent account', allowedRoles: ['SUPER_ADMIN'] },
    { methodName: 'GetLoanApplications', endpoint: '/api/loan-applications', httpMethod: 'GET', permissionType: 'Read', description: 'Fetch loan application records', allowedRoles: ['SUPER_ADMIN', 'LOAN_AGENT', 'CUSTOMER'] },
    { methodName: 'CreateLoanApplication', endpoint: '/api/loan-applications', httpMethod: 'POST', permissionType: 'Create', description: 'Submit new loan application', allowedRoles: ['SUPER_ADMIN', 'LOAN_AGENT', 'CUSTOMER'] },
    { methodName: 'GetInsuranceApplications', endpoint: '/api/insurance-applications', httpMethod: 'GET', permissionType: 'Read', description: 'Fetch insurance application records', allowedRoles: ['SUPER_ADMIN', 'INSURANCE_AGENT', 'CUSTOMER'] },
    { methodName: 'CreateInsuranceApplication', endpoint: '/api/insurance-applications', httpMethod: 'POST', permissionType: 'Create', description: 'Submit new insurance application', allowedRoles: ['SUPER_ADMIN', 'INSURANCE_AGENT', 'CUSTOMER'] },
    { methodName: 'GetInvestmentApplications', endpoint: '/api/investment-applications', httpMethod: 'GET', permissionType: 'Read', description: 'Fetch investment application records', allowedRoles: ['SUPER_ADMIN', 'INVESTMENT_AGENT', 'CUSTOMER'] },
    { methodName: 'CreateInvestmentApplication', endpoint: '/api/investment-applications', httpMethod: 'POST', permissionType: 'Create', description: 'Submit new investment application', allowedRoles: ['SUPER_ADMIN', 'INVESTMENT_AGENT', 'CUSTOMER'] },
    { methodName: 'AssignApplicationAgent', endpoint: '/api/applications/assign', httpMethod: 'PUT', permissionType: 'Assign', description: 'Assign application to specialized agent', allowedRoles: ['SUPER_ADMIN'] },
    { methodName: 'ApproveApplicationStatus', endpoint: '/api/applications/approve', httpMethod: 'PUT', permissionType: 'Approve', description: 'Approve application status', allowedRoles: ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
    { methodName: 'DeleteApplicationRecord', endpoint: '/api/applications', httpMethod: 'DELETE', permissionType: 'Delete', description: 'Delete application record', allowedRoles: ['SUPER_ADMIN'] },
    { methodName: 'UploadDocumentFile', endpoint: '/api/documents/upload', httpMethod: 'POST', permissionType: 'Upload', description: 'Upload document file to application', allowedRoles: ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT', 'CUSTOMER'] },
    { methodName: 'DownloadDocumentFile', endpoint: '/api/documents/download', httpMethod: 'GET', permissionType: 'Download', description: 'Download uploaded document', allowedRoles: ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT', 'CUSTOMER'] },
    { methodName: 'ExportReports', endpoint: '/api/reports/export', httpMethod: 'GET', permissionType: 'Export', description: 'Export analytics reports', allowedRoles: ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] },
  ];

  for (const mp of methodPermissionsToSeed) {
    const methodDef = await prisma.methodPermissionDef.create({
      data: {
        methodName: mp.methodName,
        endpoint: mp.endpoint,
        httpMethod: mp.httpMethod,
        permissionType: mp.permissionType,
        description: mp.description,
        isActive: true,
      },
    });

    for (const r of ALL_ROLES) {
      await prisma.roleMethodPermission.create({
        data: {
          role: r,
          methodPermissionId: methodDef.id,
          isAllowed: mp.allowedRoles.includes(r),
        },
      });
    }
  }

  console.log('✅ Seeded method permissions');

  // 5. Role Permissions
  await prisma.rolePermission.createMany({
    data: [
      { role: 'CUSTOMER', permission: 'applications.create' },
      { role: 'CUSTOMER', permission: 'applications.view' },
      { role: 'CUSTOMER', permission: 'documents.upload' },
      { role: 'CUSTOMER', permission: 'documents.view' },
      { role: 'CUSTOMER', permission: 'enquiries.create' },
      { role: 'CUSTOMER', permission: 'enquiries.view' },

      { role: 'LOAN_AGENT', permission: 'applications.view' },
      { role: 'LOAN_AGENT', permission: 'applications.edit' },
      { role: 'LOAN_AGENT', permission: 'documents.view' },
      { role: 'LOAN_AGENT', permission: 'documents.verify' },
      { role: 'LOAN_AGENT', permission: 'customers.view' },

      { role: 'INSURANCE_AGENT', permission: 'applications.view' },
      { role: 'INSURANCE_AGENT', permission: 'applications.edit' },
      { role: 'INSURANCE_AGENT', permission: 'documents.view' },
      { role: 'INSURANCE_AGENT', permission: 'documents.verify' },
      { role: 'INSURANCE_AGENT', permission: 'customers.view' },

      { role: 'INVESTMENT_AGENT', permission: 'applications.view' },
      { role: 'INVESTMENT_AGENT', permission: 'applications.edit' },
      { role: 'INVESTMENT_AGENT', permission: 'documents.view' },
      { role: 'INVESTMENT_AGENT', permission: 'documents.verify' },
      { role: 'INVESTMENT_AGENT', permission: 'customers.view' },

      { role: 'SUPER_ADMIN', permission: 'users.view' },
      { role: 'SUPER_ADMIN', permission: 'users.create' },
      { role: 'SUPER_ADMIN', permission: 'users.edit' },
      { role: 'SUPER_ADMIN', permission: 'users.delete' },
      { role: 'SUPER_ADMIN', permission: 'applications.view' },
      { role: 'SUPER_ADMIN', permission: 'applications.create' },
      { role: 'SUPER_ADMIN', permission: 'applications.edit' },
      { role: 'SUPER_ADMIN', permission: 'applications.assign' },
      { role: 'SUPER_ADMIN', permission: 'applications.verify' },
      { role: 'SUPER_ADMIN', permission: 'documents.view' },
      { role: 'SUPER_ADMIN', permission: 'documents.verify' },
      { role: 'SUPER_ADMIN', permission: 'audit.view' },
      { role: 'SUPER_ADMIN', permission: 'settings.edit' },
    ],
  });

  // 6. System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'PORTAL_NAME', value: 'Greetwell Financial Services Portal', category: 'GENERAL' },
      { key: 'VERSION', value: '1.0.0', category: 'SYSTEM' },
      { key: 'COMPANY_NAME', value: 'Greetwell Financial Services', category: 'BRANDING' },
      { key: 'TAGLINE', value: 'EMPOWERING DREAMS, SECURING FUTURES', category: 'BRANDING' },
    ],
  });

  // 7. Seed Products Catalog (Loans, Insurance, Investments)
  await prisma.loanProduct.createMany({
    data: [
      { name: 'Home Loan Prime', code: 'HL-001', category: 'Home Loan', interestRate: 8.5, minAmount: 500000, maxAmount: 10000000, description: 'Affordable home financing solutions with flexible tenure up to 30 years.' },
      { name: 'Personal Loan Express', code: 'PL-001', category: 'Personal Loan', interestRate: 11.5, minAmount: 50000, maxAmount: 1500000, description: 'Quick personal loans with minimal documentation and instant disbursal.' },
      { name: 'Business Growth Loan', code: 'BL-001', category: 'Business Loan', interestRate: 12.0, minAmount: 200000, maxAmount: 5000000, description: 'Collateral-free working capital and expansion loans for SMEs.' },
      { name: 'Loan Against Property', code: 'ML-001', category: 'Mortgage Loan', interestRate: 9.2, minAmount: 1000000, maxAmount: 20000000, description: 'High-value loans against residential or commercial properties.' },
    ]
  });

  await prisma.insuranceProduct.createMany({
    data: [
      { name: 'Term Life Shield', code: 'INS-LIFE-01', type: 'Life Insurance', coverageAmount: 10000000, premiumAmount: 12000, description: 'Pure protection term insurance with critical illness add-on options.' },
      { name: 'Health Care Plus', code: 'INS-HLTH-01', type: 'Health Insurance', coverageAmount: 500000, premiumAmount: 8500, description: 'Cashless hospital coverage across 10,000+ top hospitals nationwide.' },
      { name: 'Comprehensive Motor Shield', code: 'INS-AUTO-01', type: 'General Insurance', coverageAmount: 300000, premiumAmount: 4500, description: 'Zero depreciation motor insurance with roadside assistance.' },
    ]
  });

  await prisma.investmentProduct.createMany({
    data: [
      { name: 'Growth Equity Mutual Fund', code: 'INV-MF-01', riskLevel: 'High', expectedReturnRate: 14.5, minInvestment: 1000, description: 'Diversified equity portfolio curated for maximum long-term capital growth.' },
      { name: 'Fixed Deposit Ultra Yield', code: 'INV-FD-01', riskLevel: 'Low', expectedReturnRate: 7.8, minInvestment: 10000, description: 'Guaranteed high-yield returns backed by top financial institution partners.' },
      { name: 'Wealth Builder SIP', code: 'INV-SIP-01', riskLevel: 'Moderate', expectedReturnRate: 15.0, minInvestment: 500, description: 'Disciplined monthly systematic investment plan for long-term goal creation.' },
    ]
  });

  console.log('✅ Seeded product catalog (Loans, Insurance, Investments)');

  // 8. Seed Document Types & Service Categories
  await prisma.documentType.createMany({
    data: [
      { name: 'Aadhaar Card', code: 'AADHAAR', category: 'IDENTITY', isRequiredDefault: true, description: 'Government issued unique identity card' },
      { name: 'PAN Card', code: 'PAN', category: 'IDENTITY', isRequiredDefault: true, description: 'Permanent Account Number Card' },
      { name: 'Bank Statement (6 Months)', code: 'BANK_STMT', category: 'FINANCIAL', isRequiredDefault: false, description: 'Last 6 months bank statement showing regular income' },
      { name: 'Salary Slip / IT Returns', code: 'INCOME_PROOF', category: 'FINANCIAL', isRequiredDefault: false, description: 'Salary slip of last 3 months or ITR document' },
      { name: 'Property Documents', code: 'PROPERTY_DOCS', category: 'PROPERTY', isRequiredDefault: false, description: 'Property deed and tax receipts for mortgage' },
    ]
  });

  await prisma.serviceCategory.createMany({
    data: [
      { name: 'Loans & Credit', code: 'LOANS', description: 'Personal, Home, Business and Mortgage Loan services' },
      { name: 'Insurance Coverage', code: 'INSURANCE', description: 'Life, Health, and General Insurance policies' },
      { name: 'Investments & Wealth', code: 'INVESTMENT', description: 'Mutual funds, FDs, and SIP wealth management' },
    ]
  });

  // 9. Seed FAQ Items
  await prisma.fAQItem.createMany({
    data: [
      { question: 'How do I apply for a loan on the portal?', answer: 'Log into your customer dashboard, select Create Application, choose your preferred loan product, and fill in the details.', category: 'Loans', order: 1 },
      { question: 'What documents are required for home loans?', answer: 'You need Aadhaar card, PAN card, last 6 months bank statement, salary slips/ITR, and property document copies.', category: 'Loans', order: 2 },
      { question: 'How long does loan approval take?', answer: 'Application verification typically completes within 24 to 48 hours after all required documents are uploaded.', category: 'Loans', order: 3 },
      { question: 'How do I claim health insurance?', answer: 'Present your Greetwell health card at any cashless network hospital or submit claim documents under My Documents.', category: 'Insurance', order: 4 },
      { question: 'Can I track my investment growth live?', answer: 'Yes, your Investment Dashboard provides real-time tracking of portfolio performance, returns, and NAV values.', category: 'Investment', order: 5 },
    ]
  });

  console.log('✅ Seeded document types, service categories & FAQ items');

  // 10. Seed Website Content, Contact Info & Social Media Accounts
  await prisma.websiteContent.createMany({
    data: [
      { section: 'HERO', key: 'hero_title', label: 'Hero Title', draftValue: 'Empowering Your Financial Growth with Trust & Integrity', publishedValue: 'Empowering Your Financial Growth with Trust & Integrity' },
      { section: 'HERO', key: 'hero_subtitle', label: 'Hero Subtitle', draftValue: 'Your one-stop destination for Loans, Insurance, and Smart Investment Solutions.', publishedValue: 'Your one-stop destination for Loans, Insurance, and Smart Investment Solutions.' },
      { section: 'HERO', key: 'hero_cta', label: 'Hero Button Text', draftValue: 'Get Started Now', publishedValue: 'Get Started Now' },
      { section: 'SERVICES', key: 'loan_desc', label: 'Loan Services Description', draftValue: 'Flexible personal, home, and commercial loans with competitive interest rates.', publishedValue: 'Flexible personal, home, and commercial loans with competitive interest rates.' },
      { section: 'SERVICES', key: 'insurance_desc', label: 'Insurance Services Description', draftValue: 'Comprehensive life, health, property, and business coverage to protect what matters.', publishedValue: 'Comprehensive life, health, property, and business coverage to protect what matters.' },
      { section: 'SERVICES', key: 'investment_desc', label: 'Investment Services Description', draftValue: 'High-yield mutual funds, fixed deposits, and wealth management solutions.', publishedValue: 'High-yield mutual funds, fixed deposits, and wealth management solutions.' },
      { section: 'ABOUT', key: 'about_title', label: 'About Us Title', draftValue: 'About Greetwell Financial Services', publishedValue: 'About Greetwell Financial Services' },
      { section: 'ABOUT', key: 'about_body', label: 'About Us Story', draftValue: 'Greetwell Financial Services is a trusted leader in providing tailored financial products. We bring together loans, insurance, and investments under one secure digital portal.', publishedValue: 'Greetwell Financial Services is a trusted leader in providing tailored financial products. We bring together loans, insurance, and investments under one secure digital portal.' },
      { section: 'ABOUT', key: 'about_mission', label: 'Our Mission', draftValue: 'To empower individuals and businesses with accessible, transparent, and innovative financial services.', publishedValue: 'To empower individuals and businesses with accessible, transparent, and innovative financial services.' },
      { section: 'ABOUT', key: 'about_vision', label: 'Our Vision', draftValue: "To be India's most client-centric and technologically advanced financial service portal.", publishedValue: "To be India's most client-centric and technologically advanced financial service portal." },
      { section: 'FOOTER', key: 'footer_copyright', label: 'Footer Copyright Text', draftValue: '© 2026 Greetwell Financial Services. All rights reserved.', publishedValue: '© 2026 Greetwell Financial Services. All rights reserved.' },
      { section: 'FOOTER', key: 'footer_disclaimer', label: 'Footer Disclaimer Text', draftValue: 'Greetwell Financial Services is a licensed distributor of loans, insurance, and investment products. All financial investments are subject to market risks.', publishedValue: 'Greetwell Financial Services is a licensed distributor of loans, insurance, and investment products. All financial investments are subject to market risks.' }
    ]
  });

  await prisma.contactInfo.createMany({
    data: [
      { key: 'primary_phone', title: 'Primary Phone', draftValue: '+91 91211 47777', publishedValue: '+91 91211 47777', isActive: true, displayOrder: 1 },
      { key: 'secondary_phone', title: 'Secondary Phone', draftValue: '+91 91211 47777', publishedValue: '+91 91211 47777', isActive: true, displayOrder: 2 },
      { key: 'toll_free', title: 'Toll-Free Number', draftValue: '+91 91211 47777', publishedValue: '+91 91211 47777', isActive: true, displayOrder: 3 },
      { key: 'whatsapp', title: 'WhatsApp Number', draftValue: '+91 91211 47777', publishedValue: '+91 91211 47777', isActive: true, displayOrder: 4 },
      { key: 'email_general', title: 'General Enquiries Email', draftValue: 'gfsgreetwell@gmail.com', publishedValue: 'gfsgreetwell@gmail.com', isActive: true, displayOrder: 5 },
      { key: 'email_support', title: 'Customer Support Email', draftValue: 'gfsgreetwell@gmail.com', publishedValue: 'gfsgreetwell@gmail.com', isActive: true, displayOrder: 6 },
      { key: 'email_complaints', title: 'Complaints Email', draftValue: 'gfsgreetwell@gmail.com', publishedValue: 'gfsgreetwell@gmail.com', isActive: true, displayOrder: 7 },
      { key: 'office_address', title: 'Corporate Headquarters', draftValue: 'PNO 71, Hno 1-36/1/2/6/A/P-71, Road No 6, Jawahar Colony, Chandanagar, Near Yelamma Temple, 500050', publishedValue: 'PNO 71, Hno 1-36/1/2/6/A/P-71, Road No 6, Jawahar Colony, Chandanagar, Near Yelamma Temple, 500050', isActive: true, displayOrder: 8 },
      { key: 'business_hours', title: 'Business Operating Hours', draftValue: 'Mon - Sat: 9:30 AM - 6:30 PM (Sun Closed)', publishedValue: 'Mon - Sat: 9:30 AM - 6:30 PM (Sun Closed)', isActive: true, displayOrder: 9 }
    ]
  });

  await prisma.socialMediaAcc.createMany({
    data: [
      { platform: 'Facebook', url: 'https://facebook.com/greetwellfs', draftUrl: 'https://facebook.com/greetwellfs', isActive: true, draftIsActive: true, displayOrder: 1, icon: 'Facebook' },
      { platform: 'Instagram', url: 'https://instagram.com/greetwellfs', draftUrl: 'https://instagram.com/greetwellfs', isActive: true, draftIsActive: true, displayOrder: 2, icon: 'Instagram' },
      { platform: 'LinkedIn', url: 'https://linkedin.com/company/greetwellfinancial', draftUrl: 'https://linkedin.com/company/greetwellfinancial', isActive: true, draftIsActive: true, displayOrder: 3, icon: 'Linkedin' },
      { platform: 'X/Twitter', url: 'https://x.com/greetwellfin', draftUrl: 'https://x.com/greetwellfin', isActive: true, draftIsActive: true, displayOrder: 4, icon: 'Twitter' },
      { platform: 'YouTube', url: 'https://youtube.com/@greetwellfs', draftUrl: 'https://youtube.com/@greetwellfs', isActive: true, draftIsActive: true, displayOrder: 5, icon: 'Youtube' },
      { platform: 'WhatsApp', url: 'https://wa.me/919121147777', draftUrl: 'https://wa.me/919121147777', isActive: true, draftIsActive: true, displayOrder: 6, icon: 'MessageCircle' },
      { platform: 'Telegram', url: 'https://t.me/greetwellfinancial', draftUrl: 'https://t.me/greetwellfinancial', isActive: true, draftIsActive: true, displayOrder: 7, icon: 'Send' }
    ]
  });

  console.log('✅ Seeded website content, contact details & social links');

  // 11. Seed Website Media Images & Assets
  await prisma.websiteMedia.createMany({
    data: [
      {
        key: 'website_logo',
        title: 'Website Main Logo',
        description: 'Official Greetwell Financial Services Brand Logo for Header',
        section: 'Company Logo',
        category: 'LOGOS',
        displayType: 'BANNER',
        draftUrl: '/uploads/media/logo.png',
        publishedUrl: '/uploads/media/logo.png',
        altText: 'Greetwell Financial Services Logo',
        draftAltText: 'Greetwell Financial Services Logo',
        displayOrder: 1,
        status: 'PUBLISHED'
      },
      {
        key: 'footer_logo',
        title: 'Footer Brand Logo',
        description: 'Official Greetwell Financial Services Logo for Footer & Dark Mode',
        section: 'Footer',
        category: 'LOGOS',
        displayType: 'BANNER',
        draftUrl: '/uploads/media/gfs-logo.png',
        publishedUrl: '/uploads/media/gfs-logo.png',
        altText: 'GFS Footer Logo',
        draftAltText: 'GFS Footer Logo',
        displayOrder: 2,
        status: 'PUBLISHED'
      },
      {
        key: 'hero_banner',
        title: 'Hero Section Banner Image',
        description: 'Primary Landing Page Hero Banner Image',
        section: 'Hero Banner',
        category: 'HERO',
        displayType: 'BANNER',
        draftUrl: '/uploads/media/hero_donation_1.jpg',
        publishedUrl: '/uploads/media/hero_donation_1.jpg',
        altText: 'Empowering Financial Growth Hero Banner',
        draftAltText: 'Empowering Financial Growth Hero Banner',
        displayOrder: 3,
        status: 'PUBLISHED'
      },
      {
        key: 'hero_banner_2',
        title: 'Community Empowerment Banner',
        description: 'Secondary Hero Slide - Community Financial Growth',
        section: 'Hero Banner',
        category: 'HERO',
        displayType: 'BANNER',
        draftUrl: '/uploads/media/hero_donation_2.jpg',
        publishedUrl: '/uploads/media/hero_donation_2.jpg',
        altText: 'Community Empowerment',
        draftAltText: 'Community Empowerment',
        displayOrder: 4,
        status: 'PUBLISHED'
      },
      {
        key: 'hero_banner_3',
        title: 'Financial Literacy Workshop',
        description: 'Tertiary Hero Slide - Empowering Clients with Financial Advice',
        section: 'Hero Banner',
        category: 'HERO',
        displayType: 'BANNER',
        draftUrl: '/uploads/media/hero_donation_3.jpg',
        publishedUrl: '/uploads/media/hero_donation_3.jpg',
        altText: 'Financial Literacy Workshop',
        draftAltText: 'Financial Literacy Workshop',
        displayOrder: 5,
        status: 'PUBLISHED'
      },
      {
        key: 'hero_banner_4',
        title: 'Client Advisory Group Session',
        description: 'Quaternary Hero Slide - Professional Wealth Consulting',
        section: 'Hero Banner',
        category: 'HERO',
        displayType: 'BANNER',
        draftUrl: '/uploads/media/hero_donation_4.jpg',
        publishedUrl: '/uploads/media/hero_donation_4.jpg',
        altText: 'Client Advisory Session',
        draftAltText: 'Client Advisory Session',
        displayOrder: 6,
        status: 'PUBLISHED'
      },
      {
        key: 'about_banner',
        title: 'About Us Section Image',
        description: 'Greetwell Corporate Team & Executive Collaboration',
        section: 'About Us',
        category: 'ABOUT',
        displayType: 'BANNER',
        draftUrl: '/uploads/media/careers_team.png',
        publishedUrl: '/uploads/media/careers_team.png',
        altText: 'Greetwell Team Collaborating',
        draftAltText: 'Greetwell Team Collaborating',
        displayOrder: 7,
        status: 'PUBLISHED'
      },
      {
        key: 'loan_banner',
        title: 'Loans Service Card Banner',
        description: 'Flexible Personal, Home, and Commercial Loan Solutions Banner',
        section: 'Loans',
        category: 'SERVICES',
        displayType: 'CARD',
        draftUrl: '/uploads/media/slider-1.png',
        publishedUrl: '/uploads/media/slider-1.png',
        altText: 'Loans Service Banner',
        draftAltText: 'Loans Service Banner',
        displayOrder: 8,
        status: 'PUBLISHED'
      },
      {
        key: 'insurance_banner',
        title: 'Insurance Service Card Banner',
        description: 'Comprehensive Health, Life, and General Insurance Coverage',
        section: 'Insurance',
        category: 'SERVICES',
        displayType: 'CARD',
        draftUrl: '/uploads/media/slider-2.png',
        publishedUrl: '/uploads/media/slider-2.png',
        altText: 'Insurance Service Banner',
        draftAltText: 'Insurance Service Banner',
        displayOrder: 9,
        status: 'PUBLISHED'
      },
      {
        key: 'investment_banner',
        title: 'Investment Service Card Banner',
        description: 'High-Yield Mutual Funds & Wealth Management Solutions',
        section: 'Investment',
        category: 'SERVICES',
        displayType: 'CARD',
        draftUrl: '/uploads/media/slider-3.png',
        publishedUrl: '/uploads/media/slider-3.png',
        altText: 'Investment Service Banner',
        draftAltText: 'Investment Service Banner',
        displayOrder: 10,
        status: 'PUBLISHED'
      },
      {
        key: 'gallery_1',
        title: 'Corporate HQ Client Lounge',
        description: 'Modern financial advice and consultation lounge',
        section: 'Gallery',
        category: 'GALLERY',
        displayType: 'CARD',
        draftUrl: '/uploads/media/gallery_gfs_1.png',
        publishedUrl: '/uploads/media/gallery_gfs_1.png',
        altText: 'Client Lounge',
        draftAltText: 'Client Lounge',
        displayOrder: 11,
        status: 'PUBLISHED'
      },
      {
        key: 'gallery_2',
        title: 'Financial Planning Seminar',
        description: 'Educational financial guidance event for clients',
        section: 'Gallery',
        category: 'GALLERY',
        displayType: 'CARD',
        draftUrl: '/uploads/media/gallery_gfs_2.jpg',
        publishedUrl: '/uploads/media/gallery_gfs_2.jpg',
        altText: 'Financial Seminar',
        draftAltText: 'Financial Seminar',
        displayOrder: 12,
        status: 'PUBLISHED'
      }
    ]
  });

  console.log('✅ Seeded website media gallery & brand images');

  // 12. Seed Permission Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdminPrimary.id,
        userRole: 'SUPER_ADMIN',
        action: 'ADD_MENU_PERMISSION',
        entityType: 'MENU_PERMISSION',
        entityId: 'menu-users-parent',
        description: "Added new menu permission for 'Users Management' (/superadmin/users) with role access: SUPER_ADMIN:ALLOWED, LOAN_AGENT:DENIED, CUSTOMER:DENIED.",
        ipAddress: '127.0.0.1',
      },
      {
        userId: superAdminPrimary.id,
        userRole: 'SUPER_ADMIN',
        action: 'CHANGE_ROLE_MENU_PERMISSION',
        entityType: 'MENU_PERMISSION',
        entityId: 'menu-applications',
        description: "Changed role menu permission for role 'LOAN_AGENT' on menu 'Loan Applications': set view access to ALLOWED.",
        ipAddress: '127.0.0.1',
      },
      {
        userId: superAdminPrimary.id,
        userRole: 'SUPER_ADMIN',
        action: 'ADD_METHOD_PERMISSION',
        entityType: 'METHOD_PERMISSION',
        entityId: 'method-create-app',
        description: "Added method permission 'Create Application' [POST /api/applications] with initial permissions: SUPER_ADMIN:ALLOWED, LOAN_AGENT:ALLOWED, CUSTOMER:ALLOWED.",
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('🏁 Complete database seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
