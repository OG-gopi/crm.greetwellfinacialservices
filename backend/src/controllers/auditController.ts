import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const {
      role,
      action,
      entityType,
      category,
      search,
      startDate,
      endDate,
      page = '1',
      limit = '15',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const allowedEntityTypes = [
      'MENU',
      'MENU_PERMISSION',
      'ROLE_MENU_PERMISSION',
      'METHOD_PERMISSION',
      'ROLE_METHOD_PERMISSION',
    ];

    const where: any = {};

    if (category === 'MENU') {
      where.OR = [
        { entityType: { in: ['MENU', 'MENU_PERMISSION', 'ROLE_MENU_PERMISSION'] } },
        { action: { contains: 'MENU' } },
      ];
    } else if (category === 'METHOD') {
      where.OR = [
        { entityType: { in: ['METHOD_PERMISSION', 'ROLE_METHOD_PERMISSION'] } },
        { action: { contains: 'METHOD' } },
      ];
    } else {
      where.OR = [
        { entityType: { in: allowedEntityTypes } },
        { action: { contains: 'MENU' } },
        { action: { contains: 'METHOD' } },
      ];
    }

    if (role) where.userRole = role;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    if (search) {
      const q = (search as string).toLowerCase();
      where.AND = [
        {
          OR: [
            { description: { contains: q } },
            { action: { contains: q } },
            { userRole: { contains: q } },
            { entityType: { contains: q } },
            { entityId: { contains: q } },
            { user: { email: { contains: q } } },
          ],
        },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const formattedLogs = logs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));

    return res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

