import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { emailService } from '../services/emailService';
import { AuthRequest } from '../middleware/authMiddleware';

export async function getEmailLogs(req: AuthRequest, res: Response) {
  try {
    const { status, category, emailType, search, recipient, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (category && category !== 'ALL') {
      where.emailCategory = category;
    }

    if (emailType && emailType !== 'ALL') {
      where.emailType = emailType;
    }

    if (recipient) {
      where.recipientEmail = { contains: (recipient as string).toLowerCase() };
    }

    if (search) {
      const q = (search as string).trim().toLowerCase();
      where.OR = [
        { recipientEmail: { contains: q } },
        { recipientName: { contains: q } },
        { subject: { contains: q } },
        { failureReason: { contains: q } },
        { applicationId: { contains: q } },
        { relatedEntityId: { contains: q } },
      ];
    }

    const [logs, total, totalSent, totalFailed, totalPending] = await Promise.all([
      prisma.emailDeliveryLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.emailDeliveryLog.count({ where }),
      prisma.emailDeliveryLog.count({ where: { status: 'SENT' } }),
      prisma.emailDeliveryLog.count({ where: { status: 'FAILED' } }),
      prisma.emailDeliveryLog.count({ where: { status: 'PENDING' } }),
    ]);

    return res.json({
      success: true,
      data: logs,
      metrics: {
        total,
        sent: totalSent,
        failed: totalFailed,
        pending: totalPending,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('Error fetching email logs:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function retryEmail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const log = await prisma.emailDeliveryLog.findUnique({ where: { id } });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Email delivery log record not found.' });
    }

    const isSuccess = await emailService.retryFailedEmail(id);

    if (isSuccess) {
      return res.json({
        success: true,
        message: `Email retry to ${log.recipientEmail} dispatched successfully.`,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `Email retry to ${log.recipientEmail} failed. Please check SMTP settings or error details.`,
      });
    }
  } catch (err: any) {
    console.error('Error retrying email:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
