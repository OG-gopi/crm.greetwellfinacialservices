import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { createAuditLog } from '../services/auditService';
import { AuthRequest } from '../middleware/authMiddleware';

const ALL_ROLES = ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT', 'CUSTOMER'];

// 1. Get All Method Permissions with Role Allow Toggles
export async function getAllMethodPermissions(req: AuthRequest, res: Response) {
  try {
    const methodPerms = await prisma.methodPermissionDef.findMany({
      include: {
        rolePermissions: true,
      },
      orderBy: [{ methodName: 'asc' }],
    });

    return res.json({ success: true, data: methodPerms });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 2. Create Method Permission
export async function createMethodPermission(req: AuthRequest, res: Response) {
  try {
    const { methodName, endpoint, httpMethod, permissionType, isActive, description, rolePermissions } = req.body;

    if (!methodName || !methodName.trim()) {
      return res.status(400).json({ success: false, message: 'Method Name is mandatory.' });
    }

    const newDef = await prisma.methodPermissionDef.create({
      data: {
        methodName,
        endpoint: endpoint || '',
        httpMethod: httpMethod || 'GET',
        permissionType: permissionType || 'Read',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        description: description || null,
      },
    });

    // Populate role method permissions
    const rolesInput = rolePermissions || {};
    for (const r of ALL_ROLES) {
      const isAllowed = rolesInput[r] !== undefined ? Boolean(rolesInput[r]) : r === 'SUPER_ADMIN';
      await prisma.roleMethodPermission.create({
        data: {
          role: r,
          methodPermissionId: newDef.id,
          isAllowed,
        },
      });
    }

    await createAuditLog({
      userId: req.user?.id,
      userRole: req.user?.role,
      action: 'ADD_METHOD_PERMISSION',
      entityType: 'METHOD_PERMISSION',
      entityId: newDef.id,
      description: `Added method permission '${newDef.methodName}' [${newDef.httpMethod} ${newDef.endpoint}] with initial permissions: ${Object.entries(rolesInput).map(([r, v]) => `${r}:${v ? 'ALLOWED' : 'DENIED'}`).join(', ')}.`,
      ipAddress: req.ip,
    });

    const fullDef = await prisma.methodPermissionDef.findUnique({
      where: { id: newDef.id },
      include: { rolePermissions: true },
    });

    return res.status(201).json({ success: true, message: 'Method permission created.', data: fullDef });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 3. Update Method Permission
export async function updateMethodPermission(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { methodName, endpoint, httpMethod, permissionType, isActive, description, rolePermissions } = req.body;

    const existing = await prisma.methodPermissionDef.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Method permission not found.' });
    }

    const updated = await prisma.methodPermissionDef.update({
      where: { id },
      data: {
        methodName: methodName || existing.methodName,
        endpoint: endpoint !== undefined ? endpoint : existing.endpoint,
        httpMethod: httpMethod || existing.httpMethod,
        permissionType: permissionType || existing.permissionType,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        description: description !== undefined ? description : existing.description,
      },
    });

    if (rolePermissions && typeof rolePermissions === 'object') {
      for (const r of ALL_ROLES) {
        if (rolePermissions[r] !== undefined) {
          await prisma.roleMethodPermission.upsert({
            where: { role_methodPermissionId: { role: r, methodPermissionId: id } },
            create: { role: r, methodPermissionId: id, isAllowed: Boolean(rolePermissions[r]) },
            update: { isAllowed: Boolean(rolePermissions[r]) },
          });
        }
      }
    }

    await createAuditLog({
      userId: req.user?.id,
      userRole: req.user?.role,
      action: 'UPDATE_METHOD_PERMISSION',
      entityType: 'METHOD_PERMISSION',
      entityId: id,
      description: `Updated method permission '${updated.methodName}' [${updated.httpMethod} ${updated.endpoint}] definition and role permissions.`,
      ipAddress: req.ip,
    });

    const fullDef = await prisma.methodPermissionDef.findUnique({
      where: { id },
      include: { rolePermissions: true },
    });

    return res.json({ success: true, message: 'Method permission updated.', data: fullDef });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 4. Delete Method Permission
export async function deleteMethodPermission(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.methodPermissionDef.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Method permission not found.' });
    }

    await prisma.methodPermissionDef.delete({ where: { id } });

    await createAuditLog({
      userId: req.user?.id,
      userRole: req.user?.role,
      action: 'REMOVE_METHOD_PERMISSION',
      entityType: 'METHOD_PERMISSION',
      entityId: id,
      description: `Removed method permission '${existing.methodName}' [${existing.httpMethod} ${existing.endpoint}].`,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Method permission deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 5. Toggle Method Permission Status
export async function toggleMethodPermissionStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existing = await prisma.methodPermissionDef.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Method permission not found.' });
    }

    const updated = await prisma.methodPermissionDef.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      include: { rolePermissions: true },
    });

    await createAuditLog({
      userId: req.user?.id,
      userRole: req.user?.role,
      action: isActive ? 'ENABLE_METHOD_PERMISSION' : 'DISABLE_METHOD_PERMISSION',
      entityType: 'METHOD_PERMISSION',
      entityId: id,
      description: `Changed active status of method permission '${existing.methodName}' [${existing.httpMethod} ${existing.endpoint}] to ${isActive ? 'ENABLED (Active)' : 'DISABLED (Inactive)'}.`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Method permission '${updated.methodName}' is now ${updated.isActive ? 'Active' : 'Inactive'}.`,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
