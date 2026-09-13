const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Ensure SQLite or Postgres environment URL is set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const prisma = new PrismaClient();

const ALL_ROLES = ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT', 'CUSTOMER'];

async function run() {
  console.log('=====================================================');
  console.log('🔍 INVESTIGATING & RESETTING SUPERADMIN PERMISSIONS');
  console.log('=====================================================\n');

  // 1. Inspect existing CustomRoles
  const roles = await prisma.customRole.findMany();
  console.log('📋 Existing Custom Roles:', roles.map(r => r.code).join(', '));

  // 2. Check and activate all Menus
  const menus = await prisma.menu.findMany();
  console.log(`\n📌 Total Menus in DB: ${menus.length}`);

  let inactiveMenusCount = 0;
  for (const menu of menus) {
    if (!menu.isActive) {
      inactiveMenusCount++;
      console.log(`  - Reactivating inactive menu: "${menu.name}" (${menu.url})`);
      await prisma.menu.update({
        where: { id: menu.id },
        data: { isActive: true },
      });
    }
  }
  if (inactiveMenusCount === 0) {
    console.log('  ✅ All menus are already active.');
  }

  // 3. Ensure every Menu has RoleMenuPermission for SUPER_ADMIN with canView = true
  let updatedRoleMenuPerms = 0;
  let createdRoleMenuPerms = 0;

  for (const menu of menus) {
    for (const role of ALL_ROLES) {
      const existing = await prisma.roleMenuPermission.findUnique({
        where: { role_menuId: { role, menuId: menu.id } },
      });

      if (role === 'SUPER_ADMIN') {
        if (!existing) {
          await prisma.roleMenuPermission.create({
            data: { role: 'SUPER_ADMIN', menuId: menu.id, canView: true },
          });
          createdRoleMenuPerms++;
        } else if (!existing.canView) {
          await prisma.roleMenuPermission.update({
            where: { id: existing.id },
            data: { canView: true },
          });
          updatedRoleMenuPerms++;
        }
      } else {
        // Ensure roleMenuPermission entry exists for non-admin roles (preserve existing canView value)
        if (!existing) {
          await prisma.roleMenuPermission.create({
            data: { role, menuId: menu.id, canView: false },
          });
        }
      }
    }
  }

  console.log(`  ✅ Superadmin Menu Permissions: Created ${createdRoleMenuPerms}, Restored ${updatedRoleMenuPerms} to full access.`);

  // 4. Check and activate Method Permissions
  const methodDefs = await prisma.methodPermissionDef.findMany();
  console.log(`\n📌 Total Method Permission Definitions in DB: ${methodDefs.length}`);

  let inactiveMethodsCount = 0;
  for (const methodDef of methodDefs) {
    if (!methodDef.isActive) {
      inactiveMethodsCount++;
      console.log(`  - Reactivating inactive method definition: "${methodDef.methodName}"`);
      await prisma.methodPermissionDef.update({
        where: { id: methodDef.id },
        data: { isActive: true },
      });
    }
  }
  if (inactiveMethodsCount === 0) {
    console.log('  ✅ All method definitions are active.');
  }

  // 5. Ensure every Method Permission has RoleMethodPermission for SUPER_ADMIN with isAllowed = true
  let updatedRoleMethodPerms = 0;
  let createdRoleMethodPerms = 0;

  for (const methodDef of methodDefs) {
    for (const role of ALL_ROLES) {
      const existing = await prisma.roleMethodPermission.findUnique({
        where: { role_methodPermissionId: { role, methodPermissionId: methodDef.id } },
      });

      if (role === 'SUPER_ADMIN') {
        if (!existing) {
          await prisma.roleMethodPermission.create({
            data: { role: 'SUPER_ADMIN', methodPermissionId: methodDef.id, isAllowed: true },
          });
          createdRoleMethodPerms++;
        } else if (!existing.isAllowed) {
          await prisma.roleMethodPermission.update({
            where: { id: existing.id },
            data: { isAllowed: true },
          });
          updatedRoleMethodPerms++;
        }
      } else {
        if (!existing) {
          await prisma.roleMethodPermission.create({
            data: { role, methodPermissionId: methodDef.id, isAllowed: false },
          });
        }
      }
    }
  }

  console.log(`  ✅ Superadmin Method Permissions: Created ${createdRoleMethodPerms}, Restored ${updatedRoleMethodPerms} to full access.`);

  // 6. Superadmin RolePermissions check
  const superAdminRolePerms = [
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'applications.view', 'applications.create', 'applications.edit', 'applications.assign', 'applications.verify',
    'documents.view', 'documents.verify',
    'audit.view', 'settings.edit', 'reports.view', 'enquiries.view'
  ];

  let addedRolePerms = 0;
  for (const perm of superAdminRolePerms) {
    const existing = await prisma.rolePermission.findUnique({
      where: { role_permission: { role: 'SUPER_ADMIN', permission: perm } },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: { role: 'SUPER_ADMIN', permission: perm },
      });
      addedRolePerms++;
    }
  }

  console.log(`  ✅ Superadmin Role Permissions: Added ${addedRolePerms} missing permissions.`);

  console.log('\n=====================================================');
  console.log('🎉 SUPERADMIN PERMISSIONS SUCCESSFULLY RESTORED TO FULL ACCESS');
  console.log('=====================================================\n');
}

run()
  .catch(e => {
    console.error('❌ Error resetting permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
