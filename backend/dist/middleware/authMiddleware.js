"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../utils/prisma");
const validation_1 = require("../utils/validation");
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, status: true, firstName: true, lastName: true, phone: true, serviceTypes: true },
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User account no longer exists.' });
        }
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ success: false, message: 'Your account is deactivated or pending verification.' });
        }
        const parsedServiceTypes = (0, validation_1.safeParseJsonArray)(user.serviceTypes);
        req.user = {
            userId: user.id,
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            serviceTypes: parsedServiceTypes,
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
            });
        }
        next();
    };
}
function requirePermission(permissionCode) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        // Super Admin bypasses all individual permission checks
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }
        const hasPerm = await prisma_1.prisma.rolePermission.findFirst({
            where: {
                role: req.user.role,
                permission: permissionCode,
            },
        });
        if (!hasPerm) {
            return res.status(403).json({
                success: false,
                message: `Forbidden. Missing permission '${permissionCode}'.`,
            });
        }
        next();
    };
}
