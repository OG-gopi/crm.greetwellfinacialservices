import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { safeParseJsonArray } from '../utils/validation';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const userId = user.id;
    const userRole = user.role;

    const {
      module,
      source,
      readStatus,
      actionStatus,
      search,
      page = '1',
      limit = '20',
      startDate,
      endDate,
    } = req.query;

    // 1. Build Base Role-Scoped Where Clause
    let roleWhereClause: any = {};

    if (userRole === 'SUPER_ADMIN') {
      // Super Admin can view all notifications
      roleWhereClause = {};
    } else if (userRole === 'LOAN_AGENT') {
      const assignedApps = await prisma.application.findMany({
        where: { assignedAgentId: userId, type: 'LOAN' },
        select: { id: true, customerId: true },
      });
      const assignedAppIds = assignedApps.map((a) => a.id);
      const assignedCustomerIds = assignedApps.map((a) => a.customerId);

      roleWhereClause = {
        AND: [
          {
            OR: [
              { recipientUserId: userId },
              { agentId: userId },
              { applicationId: { in: assignedAppIds } },
              { customerId: { in: assignedCustomerIds } },
            ],
          },
          { module: { notIn: ['INSURANCE', 'INVESTMENTS', 'INVESTMENT'] } },
        ],
      };
    } else if (userRole === 'INSURANCE_AGENT') {
      const assignedApps = await prisma.application.findMany({
        where: { assignedAgentId: userId, type: 'INSURANCE' },
        select: { id: true, customerId: true },
      });
      const assignedAppIds = assignedApps.map((a) => a.id);
      const assignedCustomerIds = assignedApps.map((a) => a.customerId);

      roleWhereClause = {
        AND: [
          {
            OR: [
              { recipientUserId: userId },
              { agentId: userId },
              { applicationId: { in: assignedAppIds } },
              { customerId: { in: assignedCustomerIds } },
            ],
          },
          { module: { notIn: ['LOANS', 'LOAN', 'INVESTMENTS', 'INVESTMENT'] } },
        ],
      };
    } else if (userRole === 'INVESTMENT_AGENT') {
      const assignedApps = await prisma.application.findMany({
        where: { assignedAgentId: userId, type: 'INVESTMENT' },
        select: { id: true, customerId: true },
      });
      const assignedAppIds = assignedApps.map((a) => a.id);
      const assignedCustomerIds = assignedApps.map((a) => a.customerId);

      roleWhereClause = {
        AND: [
          {
            OR: [
              { recipientUserId: userId },
              { agentId: userId },
              { applicationId: { in: assignedAppIds } },
              { customerId: { in: assignedCustomerIds } },
            ],
          },
          { module: { notIn: ['LOANS', 'LOAN', 'INSURANCE'] } },
        ],
      };
    } else if (userRole === 'CUSTOMER') {
      // Customer can only view notifications for themselves or their applications for enabled services
      const customerRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { serviceTypes: true },
      });
      const enabledServices: string[] = safeParseJsonArray(customerRecord?.serviceTypes).map((s: string) => s.toUpperCase());

      const allowedModules = ['GENERAL', 'SYSTEM', 'CUSTOMERS', 'APPLICATIONS', 'DOCUMENTS', 'COMMENTS'];
      if (enabledServices.includes('LOAN') || enabledServices.includes('LOANS')) {
        allowedModules.push('LOANS', 'LOAN');
      }
      if (enabledServices.includes('INSURANCE')) {
        allowedModules.push('INSURANCE');
      }
      if (enabledServices.includes('INVESTMENT') || enabledServices.includes('INVESTMENTS')) {
        allowedModules.push('INVESTMENTS', 'INVESTMENT');
      }

      const customerApps = await prisma.application.findMany({
        where: { customerId: userId },
        select: { id: true },
      });
      const customerAppIds = customerApps.map((a) => a.id);

      roleWhereClause = {
        AND: [
          {
            OR: [
              { recipientUserId: userId },
              { customerId: userId },
              { applicationId: { in: customerAppIds } },
            ],
          },
          { module: { in: allowedModules } },
        ],
      };
    }

    // 2. Build Filter Conditions
    const AND_conditions: any[] = [roleWhereClause];

    if (module && module !== 'ALL') {
      AND_conditions.push({ module: (module as string).toUpperCase() });
    }

    if (source && source !== 'ALL') {
      AND_conditions.push({ source: (source as string).toUpperCase() });
    }

    if (readStatus === 'UNREAD') {
      AND_conditions.push({ isRead: false });
    } else if (readStatus === 'READ') {
      AND_conditions.push({ isRead: true });
    }

    if (actionStatus && actionStatus !== 'ALL') {
      AND_conditions.push({ actionStatus: (actionStatus as string).toUpperCase() });
    }

    if (search && (search as string).trim() !== '') {
      const searchTerm = (search as string).trim();
      AND_conditions.push({
        OR: [
          { title: { contains: searchTerm } },
          { message: { contains: searchTerm } },
          { applicationId: { contains: searchTerm } },
          { relatedEntityId: { contains: searchTerm } },
        ],
      });
    }

    if (startDate) {
      AND_conditions.push({ createdAt: { gte: new Date(startDate as string) } });
    }

    if (endDate) {
      AND_conditions.push({ createdAt: { lte: new Date(endDate as string) } });
    }

    const finalWhere = { AND: AND_conditions };

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // 3. Query Notifications & Aggregated Counts
    const [notifications, totalCount, unreadCount, actionRequiredCount, actionTakenCount, notRequiredCount] =
      await Promise.all([
        prisma.notification.findMany({
          where: finalWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.notification.count({ where: finalWhere }),
        prisma.notification.count({
          where: { AND: [...AND_conditions, { isRead: false }] },
        }),
        prisma.notification.count({
          where: { AND: [...AND_conditions, { actionStatus: 'ACTION_REQUIRED' }] },
        }),
        prisma.notification.count({
          where: { AND: [...AND_conditions, { actionStatus: 'ACTION_TAKEN' }] },
        }),
        prisma.notification.count({
          where: { AND: [...AND_conditions, { actionStatus: 'NOT_REQUIRED' }] },
        }),
      ]);

    return res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
        },
        counts: {
          total: totalCount,
          unread: unreadCount,
          actionRequired: actionRequiredCount,
          actionTaken: actionTakenCount,
          notRequired: notRequiredCount,
        },
      },
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateNotificationStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { isRead, actionStatus } = req.body;
    const user = req.user!;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    // Role-based authorization check
    if (user.role === 'CUSTOMER') {
      // Customers can ONLY mark read/unread. Cannot change actionStatus!
      if (actionStatus && actionStatus !== notification.actionStatus) {
        return res.status(403).json({
          success: false,
          message: 'Customers are not permitted to change action status directly from Notification History. Please navigate to your application to complete required actions.',
        });
      }
      // Check customer ownership
      if (notification.recipientUserId !== user.id && notification.customerId !== user.id) {
        return res.status(403).json({ success: false, message: 'Access denied to this notification.' });
      }
    } else if (user.role !== 'SUPER_ADMIN') {
      // Agents can only update notifications assigned to them or their applications
      if (
        notification.recipientUserId !== user.id &&
        notification.agentId !== user.id
      ) {
        // Verify if agent is assigned to the related application
        if (notification.applicationId) {
          const app = await prisma.application.findUnique({
            where: { id: notification.applicationId },
            select: { assignedAgentId: true },
          });
          if (app?.assignedAgentId !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied to this notification.' });
          }
        } else {
          return res.status(403).json({ success: false, message: 'Access denied to this notification.' });
        }
      }
    }

    const updateData: any = {};
    if (typeof isRead === 'boolean') updateData.isRead = isRead;
    if (actionStatus) updateData.actionStatus = actionStatus;

    const updated = await prisma.notification.update({
      where: { id },
      data: updateData,
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function markNotificationAsRead(req: AuthRequest, res: Response) {
  return updateNotificationStatus(req, res);
}

export async function markAllNotificationsAsRead(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;

    if (user.role === 'SUPER_ADMIN') {
      await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { recipientUserId: user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
