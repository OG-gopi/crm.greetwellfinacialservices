import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost:5432') || !process.env.DATABASE_URL.startsWith('postgresql://postgres.')) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with Role Menu & Method Permissions...');

  // Clean existing data
  await prisma.roleMethodPermission.deleteMany();
  await prisma.methodPermissionDef.deleteMany();
  await prisma.roleMenuPermission.deleteMany();
  await prisma.menu.deleteMany();

  await prisma.backupHistory.deleteMany();
  await prisma.report.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.releaseNote.deleteMany();
  await prisma.complaintCategory.deleteMany();
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

  // 1. Create Fresh Super Admin Accounts & Seed Users
  const superAdminPrimary = await prisma.user.create({
    data: {
      email: 'gopikrishnabeesu@gmail.com',
      passwordHash: newSuperAdminPasswordHash,
      firstName: 'Gopi Krishna',
      lastName: 'Beesu',
      phone: '+91 9876543210',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const superAdminAlias = await prisma.user.create({
    data: {
      email: 'gopikrishna@gmail.com',
      passwordHash: newSuperAdminPasswordHash,
      firstName: 'Gopi Krishna',
      lastName: 'Beesu',
      phone: '+91 9876543211',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const superAdminLegacy = await prisma.user.create({
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

  const loanAgent = await prisma.user.create({
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

  const insuranceAgent = await prisma.user.create({
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

  const investmentAgent = await prisma.user.create({
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

  const customer1 = await prisma.user.create({
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

  // First pass: Create parent / standalone menus
  const urlToMenuIdMap = new Map<string, string>();

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

    // Create Role Menu Permissions
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

  // Second pass: Create child menus with parentId
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

    // Create Role Menu Permissions
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

  console.log('✅ Seeded menus & role permissions');

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
      // CUSTOMER
      { role: 'CUSTOMER', permission: 'applications.create' },
      { role: 'CUSTOMER', permission: 'applications.view' },
      { role: 'CUSTOMER', permission: 'documents.upload' },
      { role: 'CUSTOMER', permission: 'documents.view' },
      { role: 'CUSTOMER', permission: 'enquiries.create' },
      { role: 'CUSTOMER', permission: 'enquiries.view' },

      // LOAN_AGENT
      { role: 'LOAN_AGENT', permission: 'applications.view' },
      { role: 'LOAN_AGENT', permission: 'applications.edit' },
      { role: 'LOAN_AGENT', permission: 'documents.view' },
      { role: 'LOAN_AGENT', permission: 'documents.verify' },
      { role: 'LOAN_AGENT', permission: 'customers.view' },

      // INSURANCE_AGENT
      { role: 'INSURANCE_AGENT', permission: 'applications.view' },
      { role: 'INSURANCE_AGENT', permission: 'applications.edit' },
      { role: 'INSURANCE_AGENT', permission: 'documents.view' },
      { role: 'INSURANCE_AGENT', permission: 'documents.verify' },
      { role: 'INSURANCE_AGENT', permission: 'customers.view' },

      // INVESTMENT_AGENT
      { role: 'INVESTMENT_AGENT', permission: 'applications.view' },
      { role: 'INVESTMENT_AGENT', permission: 'applications.edit' },
      { role: 'INVESTMENT_AGENT', permission: 'documents.view' },
      { role: 'INVESTMENT_AGENT', permission: 'documents.verify' },
      { role: 'INVESTMENT_AGENT', permission: 'customers.view' },

      // SUPER_ADMIN
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

  // 7. Seed Permission Audit Logs
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
      {
        userId: superAdminPrimary.id,
        userRole: 'SUPER_ADMIN',
        action: 'UPDATE_METHOD_PERMISSION',
        entityType: 'METHOD_PERMISSION',
        entityId: 'method-delete-user',
        description: "Updated method permission 'Delete User' [DELETE /api/users/:id] definition: restricted access strictly to SUPER_ADMIN.",
        ipAddress: '127.0.0.1',
      },
      {
        userId: superAdminPrimary.id,
        userRole: 'SUPER_ADMIN',
        action: 'ENABLE_MENU_PERMISSION',
        entityType: 'MENU_PERMISSION',
        entityId: 'menu-reports',
        description: "Changed active status of menu permission 'Reports & Analytics' to ENABLED (Active).",
        ipAddress: '127.0.0.1',
      },
      {
        userId: superAdminPrimary.id,
        userRole: 'SUPER_ADMIN',
        action: 'REMOVE_METHOD_PERMISSION',
        entityType: 'METHOD_PERMISSION',
        entityId: 'method-deprecated-export',
        description: "Removed deprecated method permission 'Legacy Export Data' [GET /api/v1/export].",
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('🏁 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
