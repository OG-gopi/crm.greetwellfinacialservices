"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceMethodPermission = enforceMethodPermission;
const prisma_1 = require("../utils/prisma");
function enforceMethodPermission(permissionType, methodName) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Authentication required.' });
            }
            // Super Admin bypass
            if (user.role === 'SUPER_ADMIN') {
                return next();
            }
            // 1. Look up method permission definition matching methodName or endpoint + httpMethod
            let methodDef = null;
            if (methodName) {
                methodDef = await prisma_1.prisma.methodPermissionDef.findFirst({
                    where: { methodName },
                    include: { rolePermissions: true },
                });
            }
            if (!methodDef) {
                const cleanPath = req.baseUrl + req.path;
                methodDef = await prisma_1.prisma.methodPermissionDef.findFirst({
                    where: {
                        endpoint: { contains: req.baseUrl },
                        httpMethod: req.method,
                    },
                    include: { rolePermissions: true },
                });
            }
            // If no explicit method permission rule exists, allow execution
            if (!methodDef) {
                return next();
            }
            // If the method permission is inactive
            if (!methodDef.isActive) {
                return res.status(403).json({
                    success: false,
                    message: `Operation '${methodDef.methodName}' is currently unavailable (inactive).`,
                });
            }
            // Check role method permission
            const rolePerm = methodDef.rolePermissions.find(rp => rp.role === user.role);
            const isAllowed = rolePerm ? rolePerm.isAllowed : false;
            if (!isAllowed) {
                return res.status(403).json({
                    success: false,
                    message: `Access Denied: Your role '${user.role}' is not permitted to perform operation '${methodDef.methodName}'.`,
                });
            }
            return next();
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    };
}
