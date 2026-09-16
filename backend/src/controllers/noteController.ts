import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { createAuditLog } from '../services/auditService';
import { createNotification } from '../services/notificationService';
import { emailService } from '../services/emailService';
import { AuthRequest } from '../middleware/authMiddleware';

export async function createNote(req: AuthRequest, res: Response) {
  try {
    const { applicationId, content, isCustomerVisible = false } = req.body;
    const user = req.user!;

    if (!applicationId || !content) {
      return res.status(400).json({ success: false, message: 'Application ID and note content are required.' });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { customer: true },
    });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const note = await prisma.note.create({
      data: {
        applicationId,
        authorUserId: user.id,
        content,
        isCustomerVisible: Boolean(isCustomerVisible),
      },
      include: {
        authorUser: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'ADD_NOTE',
      entityType: 'NOTE',
      entityId: note.id,
      description: `Added ${isCustomerVisible ? 'customer-visible' : 'internal'} note on application ${applicationId}.`,
      ipAddress: req.ip,
    });

    if (isCustomerVisible && user.role !== 'CUSTOMER') {
      await createNotification({
        recipientUserId: application.customerId,
        type: 'NEW_NOTE',
        title: `Message on Application ${applicationId}`,
        message: `New note from ${user.firstName} ${user.lastName}: "${content.substring(0, 80)}..."`,
        relatedEntity: 'APPLICATION',
        relatedEntityId: applicationId,
      });

      if (application.customer?.email) {
        emailService.sendApplicationCommentNotification({
          recipientEmail: application.customer.email,
          recipientName: `${application.customer.firstName} ${application.customer.lastName || ''}`.trim(),
          applicationId: application.id,
          authorName: `${user.firstName} ${user.lastName || ''}`.trim(),
          commentText: content,
        }).catch((err) => console.error('Async application comment email error:', err));
      }
    }

    return res.status(201).json({ success: true, message: 'Note added.', data: note });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getNotes(req: AuthRequest, res: Response) {
  try {
    const { applicationId } = req.params;
    const user = req.user!;

    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const where: any = { applicationId };
    if (user.role === 'CUSTOMER') {
      where.isCustomerVisible = true;
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        authorUser: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: notes });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
