import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { safeParseJsonArray } from '../utils/validation';

export interface AuthRequest extends Request {
  user?: JwtPayload & {
    id: string;
    firstName: string;
    lastName: string | null;
    status: string;
    phone?: string | null;
    serviceTypes?: string[];
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true, firstName: true, lastName: true, phone: true, serviceTypes: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account no longer exists.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated or pending verification.' });
    }

    const parsedServiceTypes: string[] = safeParseJsonArray(user.serviceTypes);

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
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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

export function requirePermission(permissionCode: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Super Admin bypasses all individual permission checks
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const hasPerm = await prisma.rolePermission.findFirst({
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
