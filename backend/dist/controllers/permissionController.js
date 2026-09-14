"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoles = getRoles;
exports.createRole = createRole;
exports.getMenuPermissions = getMenuPermissions;
exports.createMenuPermission = createMenuPermission;
exports.getMethodPermissions = getMethodPermissions;
exports.createMethodPermission = createMethodPermission;
exports.getPermissionGroups = getPermissionGroups;
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
// Roles
async function getRoles(req, res) {
    try {
        const roles = await prisma_1.prisma.customRole.findMany({ orderBy: { name: 'asc' } });
        return res.json({ success: true, data: roles });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createRole(req, res) {
    try {
        const { name, code, description } = req.body;
        const role = await prisma_1.prisma.customRole.create({
            data: { name, code, description },
        });
        return res.status(201).json({ success: true, message: 'Role created.', data: role });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// Menu Permissions
async function getMenuPermissions(req, res) {
    try {
        const menuPerms = await prisma_1.prisma.roleMenuPermission.findMany({ include: { menu: true } });
        return res.json({ success: true, data: menuPerms });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createMenuPermission(req, res) {
    try {
        const { menuId, role, canView } = req.body;
        const perm = await prisma_1.prisma.roleMenuPermission.create({
            data: { menuId, role, canView: canView ?? true },
        });
        return res.status(201).json({ success: true, message: 'Menu permission created.', data: perm });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// Method Permissions
async function getMethodPermissions(req, res) {
    try {
        const methodPerms = await prisma_1.prisma.methodPermissionDef.findMany();
        return res.json({ success: true, data: methodPerms });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createMethodPermission(req, res) {
    try {
        const { methodName, endpoint, httpMethod, permissionType, description } = req.body;
        const perm = await prisma_1.prisma.methodPermissionDef.create({
            data: { methodName, endpoint, httpMethod, permissionType, description },
        });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'CREATE_METHOD_PERMISSION',
            entityType: 'METHOD_PERMISSION',
            entityId: perm.id,
            description: `Created method permission ${perm.httpMethod} ${perm.endpoint} (${perm.methodName}).`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: 'Method permission created.', data: perm });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// Permission Groups
async function getPermissionGroups(req, res) {
    try {
        const groups = await prisma_1.prisma.permissionGroup.findMany();
        return res.json({ success: true, data: groups });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
