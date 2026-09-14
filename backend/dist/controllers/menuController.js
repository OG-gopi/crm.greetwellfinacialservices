"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMenus = getAllMenus;
exports.createMenu = createMenu;
exports.updateMenu = updateMenu;
exports.deleteMenu = deleteMenu;
exports.toggleMenuStatus = toggleMenuStatus;
exports.updateRoleMenuPermissions = updateRoleMenuPermissions;
exports.getMyMenus = getMyMenus;
exports.checkMenuAccess = checkMenuAccess;
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
const ALL_ROLES = ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT', 'CUSTOMER'];
// 1. Get All Menus with Role Permissions (For Superadmin Menu Items Management Page)
async function getAllMenus(req, res) {
    try {
        const menus = await prisma_1.prisma.menu.findMany({
            include: {
                parent: true,
                children: {
                    orderBy: { displayOrder: 'asc' },
                },
                rolePermissions: true,
            },
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        });
        return res.json({ success: true, data: menus });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// 2. Create Menu Item
async function createMenu(req, res) {
    try {
        const { name, parentId, url, icon, displayOrder, isActive, description, rolePermissions } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Menu Name is required.' });
        }
        if (!url || !url.trim()) {
            return res.status(400).json({ success: false, message: 'Menu URL is required.' });
        }
        // Unique URL Check
        const existingUrl = await prisma_1.prisma.menu.findUnique({ where: { url } });
        if (existingUrl) {
            return res.status(400).json({ success: false, message: `Menu URL '${url}' already exists. URLs must be unique.` });
        }
        // Parent self check
        if (parentId && parentId.trim()) {
            const parentMenu = await prisma_1.prisma.menu.findUnique({ where: { id: parentId } });
            if (!parentMenu) {
                return res.status(400).json({ success: false, message: 'Selected Parent Menu does not exist.' });
            }
        }
        const newMenu = await prisma_1.prisma.menu.create({
            data: {
                name,
                parentId: parentId || null,
                url,
                icon: icon || 'FileText',
                displayOrder: Number(displayOrder) || 0,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
                description: description || null,
            },
        });
        // Populate Role Menu Permissions
        const rolesInput = rolePermissions || {};
        for (const r of ALL_ROLES) {
            const canView = rolesInput[r] !== undefined ? Boolean(rolesInput[r]) : r === 'SUPER_ADMIN';
            await prisma_1.prisma.roleMenuPermission.create({
                data: {
                    role: r,
                    menuId: newMenu.id,
                    canView,
                },
            });
        }
        // Audit Log & Superadmin Notification
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'ADD_MENU_PERMISSION',
            entityType: 'MENU_PERMISSION',
            entityId: newMenu.id,
            description: `Added new menu permission for '${newMenu.name}' (${newMenu.url}) with role access: ${Object.entries(rolesInput).map(([r, v]) => `${r}:${v ? 'ALLOWED' : 'DENIED'}`).join(', ')}.`,
            ipAddress: req.ip,
        });
        // Notify Superadmins
        const superAdmins = await prisma_1.prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
        for (const admin of superAdmins) {
            await prisma_1.prisma.notification.create({
                data: {
                    recipientUserId: admin.id,
                    type: 'MENU_CREATED',
                    title: 'New Menu Item Created',
                    message: `Menu '${newMenu.name}' was created by ${req.user?.firstName || 'Admin'}.`,
                    relatedEntity: 'MENU',
                    relatedEntityId: newMenu.id,
                },
            });
        }
        const createdWithPerms = await prisma_1.prisma.menu.findUnique({
            where: { id: newMenu.id },
            include: { parent: true, rolePermissions: true },
        });
        return res.status(201).json({ success: true, message: 'Menu item created successfully.', data: createdWithPerms });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// 3. Update Menu Item
async function updateMenu(req, res) {
    try {
        const { id } = req.params;
        const { name, parentId, url, icon, displayOrder, isActive, description, rolePermissions } = req.body;
        const existing = await prisma_1.prisma.menu.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }
        if (parentId && parentId === id) {
            return res.status(400).json({ success: false, message: 'Parent Menu cannot be the same menu.' });
        }
        if (url && url !== existing.url) {
            const existingUrl = await prisma_1.prisma.menu.findUnique({ where: { url } });
            if (existingUrl) {
                return res.status(400).json({ success: false, message: `Menu URL '${url}' already exists. URLs must be unique.` });
            }
        }
        const updatedMenu = await prisma_1.prisma.menu.update({
            where: { id },
            data: {
                name: name || existing.name,
                parentId: parentId !== undefined ? (parentId || null) : existing.parentId,
                url: url || existing.url,
                icon: icon !== undefined ? icon : existing.icon,
                displayOrder: displayOrder !== undefined ? Number(displayOrder) : existing.displayOrder,
                isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
                description: description !== undefined ? description : existing.description,
            },
        });
        // Update Role Menu Permissions if provided
        if (rolePermissions && typeof rolePermissions === 'object') {
            for (const r of ALL_ROLES) {
                if (rolePermissions[r] !== undefined) {
                    await prisma_1.prisma.roleMenuPermission.upsert({
                        where: { role_menuId: { role: r, menuId: id } },
                        create: { role: r, menuId: id, canView: Boolean(rolePermissions[r]) },
                        update: { canView: Boolean(rolePermissions[r]) },
                    });
                }
            }
        }
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'UPDATE_MENU_PERMISSION',
            entityType: 'MENU_PERMISSION',
            entityId: id,
            description: `Updated menu permission settings for '${updatedMenu.name}' (${updatedMenu.url}). Permissions updated across roles.`,
            ipAddress: req.ip,
        });
        const fullMenu = await prisma_1.prisma.menu.findUnique({
            where: { id },
            include: { parent: true, children: true, rolePermissions: true },
        });
        return res.json({ success: true, message: 'Menu item updated successfully.', data: fullMenu });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// 4. Delete Menu Item
async function deleteMenu(req, res) {
    try {
        const { id } = req.params;
        const existing = await prisma_1.prisma.menu.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }
        await prisma_1.prisma.menu.delete({ where: { id } });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'REMOVE_MENU_PERMISSION',
            entityType: 'MENU_PERMISSION',
            entityId: id,
            description: `Removed menu permission and deleted menu '${existing.name}'.`,
            ipAddress: req.ip,
        });
        return res.json({ success: true, message: 'Menu item deleted successfully.' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// 5. Toggle Active/Inactive Status
async function toggleMenuStatus(req, res) {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const existing = await prisma_1.prisma.menu.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }
        const updated = await prisma_1.prisma.menu.update({
            where: { id },
            data: { isActive: Boolean(isActive) },
            include: { rolePermissions: true },
        });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: isActive ? 'ENABLE_MENU_PERMISSION' : 'DISABLE_MENU_PERMISSION',
            entityType: 'MENU_PERMISSION',
            entityId: id,
            description: `Changed active status of menu permission '${existing.name}' to ${isActive ? 'ENABLED (Active)' : 'DISABLED (Inactive)'}.`,
            ipAddress: req.ip,
        });
        return res.json({
            success: true,
            message: `Menu '${updated.name}' is now ${updated.isActive ? 'Active' : 'Inactive'}.`,
            data: updated,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// 6. Update Role Permissions for a Menu
async function updateRoleMenuPermissions(req, res) {
    try {
        const { menuId, role, canView } = req.body;
        if (!menuId || !role) {
            return res.status(400).json({ success: false, message: 'menuId and role are required.' });
        }
        const perm = await prisma_1.prisma.roleMenuPermission.upsert({
            where: { role_menuId: { role, menuId } },
            create: { role, menuId, canView: Boolean(canView) },
            update: { canView: Boolean(canView) },
        });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'CHANGE_ROLE_MENU_PERMISSION',
            entityType: 'MENU_PERMISSION',
            entityId: perm.id,
            description: `Changed role menu permission for role '${role}' on menu '${menuId}': set view access to ${canView ? 'ALLOWED' : 'DENIED'}.`,
            ipAddress: req.ip,
        });
        return res.json({ success: true, message: 'Role permission updated.', data: perm });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// 7. Get My Permitted Menus (For Sidebar & Dynamic Navigation)
async function getMyMenus(req, res) {
    try {
        const userRole = req.user?.role || 'CUSTOMER';
        // Fetch all ACTIVE menus
        const activeMenus = await prisma_1.prisma.menu.findMany({
            where: { isActive: true },
            include: {
                rolePermissions: true,
                children: {
                    where: { isActive: true },
                    include: { rolePermissions: true },
                    orderBy: { displayOrder: 'asc' },
                },
            },
            orderBy: { displayOrder: 'asc' },
        });
        // Filter menus based on user role's canView permission
        const allowedMenus = activeMenus
            .filter(m => !m.parentId) // Parent / Top-level menus
            .map(m => {
            const parentRolePerm = m.rolePermissions.find(rp => rp.role === userRole);
            const parentCanView = parentRolePerm ? parentRolePerm.canView : (userRole === 'SUPER_ADMIN');
            // Filter active children that this role can view
            const allowedChildren = m.children.filter(child => {
                const childRolePerm = child.rolePermissions.find(rp => rp.role === userRole);
                return childRolePerm ? childRolePerm.canView : (userRole === 'SUPER_ADMIN');
            });
            // Parent menu is included ONLY IF parentCanView is true AND (either it has no children OR it has at least 1 active allowed child)
            if (!parentCanView)
                return null;
            // If parent has children, only keep parent if at least one child is allowed
            if (m.children.length > 0 && allowedChildren.length === 0) {
                return null;
            }
            return {
                id: m.id,
                name: m.name,
                url: m.url,
                icon: m.icon,
                displayOrder: m.displayOrder,
                children: allowedChildren.map(c => ({
                    id: c.id,
                    name: c.name,
                    url: c.url,
                    icon: c.icon,
                    displayOrder: c.displayOrder,
                })),
            };
        })
            .filter(Boolean);
        return res.json({ success: true, data: allowedMenus });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// 8. Check Direct URL Access Permission & Active Status
async function checkMenuAccess(req, res) {
    try {
        const { url } = req.query;
        const userRole = req.user?.role;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ success: false, message: 'URL parameter is required.' });
        }
        // Find matching menu item in DB by URL
        const menu = await prisma_1.prisma.menu.findFirst({
            where: { url },
            include: { rolePermissions: true },
        });
        if (!menu) {
            // Unmapped URL, allow or handled by router
            return res.json({ success: true, allowed: true });
        }
        if (!menu.isActive) {
            return res.status(403).json({
                success: false,
                allowed: false,
                message: 'This menu is currently unavailable.',
            });
        }
        const rolePerm = menu.rolePermissions.find(rp => rp.role === userRole);
        const canView = rolePerm ? rolePerm.canView : (userRole === 'SUPER_ADMIN');
        if (!canView) {
            return res.status(403).json({
                success: false,
                allowed: false,
                message: 'Access Denied: You do not have permission to view this menu.',
            });
        }
        return res.json({ success: true, allowed: true, message: 'Access granted.' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
