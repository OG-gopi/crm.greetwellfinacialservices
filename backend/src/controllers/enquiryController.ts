import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { createAuditLog } from '../services/auditService';
import { createNotification, notifySuperAdmins } from '../services/notificationService';
import { emailService } from '../services/emailService';
import { validateIndianMobile } from '../utils/validation';
import { AuthRequest } from '../middleware/authMiddleware';

// Valid categories list
export const ALL_ENQUIRY_CATEGORIES = [
  'Loan',
  'Insurance',
  'Investment',
  'Account & Registration',
  'Technical Support',
  'Documents',
  'Payments',
  'Other',
];

export async function getEnquiries(req: AuthRequest, res: Response) {
  try {
    const { status, category, priority, search, page = '1', limit = '50' } = req.query;
    const user = req.user!;

    const where: any = {};

    // 1. Role-based scoping
    if (user.role === 'CUSTOMER') {
      where.raisedByUserId = user.id;
    } else if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(user.role)) {
      where.raisedByUserId = user.id;
    }

    // 2. Filters
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    if (search) {
      const q = (search as string).toLowerCase();
      where.OR = [
        { id: { contains: q } },
        { subject: { contains: q } },
        { description: { contains: q } },
        { relatedApplicationId: { contains: q } },
        { raisedByUser: { firstName: { contains: q } } },
        { raisedByUser: { lastName: { contains: q } } },
        { raisedByUser: { email: { contains: q } } },
      ];
    }

    // Calculate metric counters
    const baseWhere = user.role === 'SUPER_ADMIN' ? {} : { raisedByUserId: user.id };
    const [allTickets, total, open, inProgress, resolved] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        include: {
          raisedByUser: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true } },
          assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enquiry.count({ where: baseWhere }),
      prisma.enquiry.count({ where: { ...baseWhere, status: 'OPEN' } }),
      prisma.enquiry.count({ where: { ...baseWhere, status: { in: ['IN_PROGRESS', 'AWAITING_INFORMATION'] } } }),
      prisma.enquiry.count({ where: { ...baseWhere, status: { in: ['RESOLVED', 'CLOSED'] } } }),
    ]);

    return res.json({
      success: true,
      data: allTickets,
      metrics: {
        total,
        open,
        inProgress,
        resolved,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getEnquiryById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user!;

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        raisedByUser: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true } },
        assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        messages: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        history: {
          include: {
            performedByUser: { select: { firstName: true, lastName: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry ticket not found.' });
    }

    // RBAC Security Guard: Non-admin users can ONLY view their own tickets
    if (user.role !== 'SUPER_ADMIN' && enquiry.raisedByUserId !== user.id && enquiry.assignedAgentId !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this enquiry.' });
    }

    return res.json({ success: true, data: enquiry });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getUserApplications(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const where: any = {};
    if (user.role === 'CUSTOMER') {
      where.customerId = user.id;
    } else if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(user.role)) {
      where.assignedAgentId = user.id;
    }

    const applications = await prisma.application.findMany({
      where,
      select: { id: true, type: true, status: true, purpose: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: applications });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createEnquiry(req: AuthRequest, res: Response) {
  try {
    const { subject, category, description, priority = 'MEDIUM', relatedApplicationId, attachmentUrl, contactPhone } = req.body;
    const user = req.user!;

    if (!subject || !category || !description) {
      return res.status(400).json({ success: false, message: 'Subject, Category, and Description are required.' });
    }

    // Indian Mobile Validation if mobile provided or auto-filled
    const phoneToValidate = contactPhone || user.phone;
    if (phoneToValidate) {
      const mobileValid = validateIndianMobile(phoneToValidate);
      if (!mobileValid.isValid) {
        return res.status(400).json({ success: false, message: mobileValid.message });
      }
    }

    // Validate Category Access based on User Role & Service Types
    const userServices: string[] = Array.isArray(user.serviceTypes)
      ? user.serviceTypes.map((s) => s.toUpperCase())
      : user.role === 'LOAN_AGENT' ? ['LOANS'] : user.role === 'INSURANCE_AGENT' ? ['INSURANCE'] : user.role === 'INVESTMENT_AGENT' ? ['INVESTMENT'] : ['LOANS'];
    
    if (user.role !== 'SUPER_ADMIN') {
      if (category === 'Loan' && !userServices.includes('LOANS') && !userServices.includes('LOAN') && user.role !== 'LOAN_AGENT') {
        return res.status(403).json({ success: false, message: 'You are not permitted to submit Loan enquiries.' });
      }
      if (category === 'Insurance' && !userServices.includes('INSURANCE') && user.role !== 'INSURANCE_AGENT') {
        return res.status(403).json({ success: false, message: 'You are not permitted to submit Insurance enquiries.' });
      }
      if (category === 'Investment' && !userServices.includes('INVESTMENT') && !userServices.includes('INVESTMENTS') && user.role !== 'INVESTMENT_AGENT') {
        return res.status(403).json({ success: false, message: 'You are not permitted to submit Investment enquiries.' });
      }
    }

    // Generate unique ID: ENQ-2026-XXXXXX
    const year = new Date().getFullYear();
    const count = await prisma.enquiry.count();
    const enquiryId = `ENQ-${year}-${(count + 1).toString().padStart(6, '0')}`;

    const enquiry = await prisma.enquiry.create({
      data: {
        id: enquiryId,
        raisedByUserId: user.id,
        userRole: user.role,
        subject,
        category,
        relatedApplicationId: relatedApplicationId || null,
        description,
        priority,
        status: 'OPEN',
        attachmentUrl: attachmentUrl || null,
        contactEmail: user.email,
        contactPhone: phoneToValidate || null,
      },
    });

    // Create initial conversation message
    await prisma.enquiryMessage.create({
      data: {
        enquiryId: enquiry.id,
        senderId: user.id,
        senderRole: user.role,
        message: description,
        attachmentUrl: attachmentUrl || null,
      },
    });

    // Create audit history entry
    await prisma.enquiryHistory.create({
      data: {
        enquiryId: enquiry.id,
        performedByUserId: user.id,
        action: 'ENQUIRY_CREATED',
        details: `Enquiry ticket ${enquiry.id} created by ${user.firstName} ${user.lastName || ''} (${user.role}).`,
      },
    });

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE_ENQUIRY',
      entityType: 'ENQUIRY',
      entityId: enquiry.id,
      description: `User ${user.email} created enquiry ${enquiry.id}: "${subject}".`,
      ipAddress: req.ip,
    });

    await notifySuperAdmins(
      'NEW_ENQUIRY',
      `New Enquiry Ticket (${enquiry.id})`,
      `New enquiry ticket ${enquiry.id} (${category}) submitted by ${user.firstName} ${user.lastName || ''}.`,
      { module: 'ENQUIRY', relatedEntityId: enquiry.id }
    );

    // Send email acknowledgement
    await emailService.sendEnquiryCreatedNotification({
      email: user.email,
      userName: `${user.firstName} ${user.lastName || ''}`,
      enquiryId: enquiry.id,
      subject: enquiry.subject,
      category: enquiry.category,
      relatedApplicationId: enquiry.relatedApplicationId || undefined,
    }).catch((err) => console.error('Failed to send enquiry email acknowledgement:', err));

    return res.status(201).json({
      success: true,
      message: `Enquiry ${enquiry.id} submitted successfully.`,
      data: enquiry,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function addEnquiryMessage(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { message, attachmentUrl } = req.body;
    const user = req.user!;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: { raisedByUser: true },
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry ticket not found.' });
    }

    // RBAC Security Check
    if (user.role !== 'SUPER_ADMIN' && enquiry.raisedByUserId !== user.id && enquiry.assignedAgentId !== user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to reply to this enquiry.' });
    }

    if (enquiry.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Cannot reply to a closed enquiry. Reopen the ticket first.' });
    }

    // Post message
    const newMessage = await prisma.enquiryMessage.create({
      data: {
        enquiryId: enquiry.id,
        senderId: user.id,
        senderRole: user.role,
        message,
        attachmentUrl: attachmentUrl || null,
      },
    });

    // Auto status update: if AWAITING_INFORMATION and raisedByUser replies -> change to IN_PROGRESS
    let updatedStatus = enquiry.status;
    if (enquiry.status === 'AWAITING_INFORMATION' && user.id === enquiry.raisedByUserId) {
      updatedStatus = 'IN_PROGRESS';
      await prisma.enquiry.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Record history entry
    await prisma.enquiryHistory.create({
      data: {
        enquiryId: enquiry.id,
        performedByUserId: user.id,
        action: 'MESSAGE_ADDED',
        details: `Message posted by ${user.firstName} (${user.role}).`,
      },
    });

    // Send notifications
    const recipientId = user.id === enquiry.raisedByUserId
      ? (enquiry.assignedAgentId || null)
      : enquiry.raisedByUserId;

    if (recipientId) {
      await createNotification({
        recipientUserId: recipientId,
        type: 'ENQUIRY_REPLY_RECEIVED',
        title: `New Response on Ticket ${enquiry.id}`,
        message: `${user.firstName} replied: "${message.substring(0, 80)}..."`,
        relatedEntity: 'ENQUIRY',
        relatedEntityId: enquiry.id,
      });
    }

    // Send email notification to owner if replied by Admin/Agent
    if (user.id !== enquiry.raisedByUserId && enquiry.raisedByUser?.email) {
      await emailService.sendEnquiryReplyNotification({
        email: enquiry.raisedByUser.email,
        userName: `${enquiry.raisedByUser.firstName} ${enquiry.raisedByUser.lastName || ''}`,
        enquiryId: enquiry.id,
        subject: enquiry.subject,
        senderName: `${user.firstName} ${user.lastName || ''} (${user.role.replace('_', ' ')})`,
        message,
        status: updatedStatus,
      }).catch((err) => console.error('Failed to send enquiry reply email:', err));
    }

    return res.status(201).json({
      success: true,
      message: 'Reply posted successfully.',
      data: newMessage,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateEnquiryStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, priority, assignedAgentId, resolutionComment, internalNotes } = req.body;
    const user = req.user!;

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: { raisedByUser: true },
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry ticket not found.' });
    }

    // Security Check: Owners can close or reopen tickets. Super Admin can perform full updates.
    const isOwner = user.id === enquiry.raisedByUserId;
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this enquiry.' });
    }

    const updateData: any = {};
    let historyDetails = [];

    if (status) {
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'AWAITING_INFORMATION', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid enquiry status.' });
      }

      // Non-admin owners can only transition to CLOSED or REOPEN (OPEN/IN_PROGRESS)
      if (!isSuperAdmin && !['CLOSED', 'OPEN', 'IN_PROGRESS'].includes(status)) {
        return res.status(403).json({ success: false, message: 'Owners can only close or reopen tickets.' });
      }

      updateData.status = status;
      historyDetails.push(`Status changed from ${enquiry.status} to ${status}`);
    }

    if (priority && isSuperAdmin) {
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
        return res.status(400).json({ success: false, message: 'Invalid priority level.' });
      }
      updateData.priority = priority;
      historyDetails.push(`Priority changed to ${priority}`);
    }

    if (assignedAgentId !== undefined && isSuperAdmin) {
      updateData.assignedAgentId = assignedAgentId || null;
      historyDetails.push(assignedAgentId ? `Assigned agent updated` : `Unassigned agent`);
    }

    if (resolutionComment) updateData.resolutionComment = resolutionComment;
    if (internalNotes && isSuperAdmin) updateData.internalNotes = internalNotes;

    const updated = await prisma.enquiry.update({
      where: { id },
      data: updateData,
    });

    // Record audit history
    if (historyDetails.length > 0) {
      await prisma.enquiryHistory.create({
        data: {
          enquiryId: enquiry.id,
          performedByUserId: user.id,
          action: 'STATUS_CHANGED',
          details: `${historyDetails.join(', ')} by ${user.firstName} (${user.role}).`,
        },
      });

      await createAuditLog({
        userId: user.id,
        userRole: user.role,
        action: 'UPDATE_ENQUIRY',
        entityType: 'ENQUIRY',
        entityId: enquiry.id,
        description: `Updated enquiry ${enquiry.id}: ${historyDetails.join(', ')}.`,
        ipAddress: req.ip,
      });
    }

    // Handle Status Specific Email & In-App Notifications
    if (status && status !== enquiry.status && enquiry.raisedByUser?.email) {
      const ownerEmail = enquiry.raisedByUser.email;
      const ownerName = `${enquiry.raisedByUser.firstName} ${enquiry.raisedByUser.lastName || ''}`;

      await createNotification({
        recipientUserId: enquiry.raisedByUserId,
        type: 'ENQUIRY_STATUS_CHANGED',
        title: `Enquiry ${enquiry.id} ${status}`,
        message: `Your enquiry status is now ${status}. ${resolutionComment ? 'Notes: ' + resolutionComment : ''}`,
        relatedEntity: 'ENQUIRY',
        relatedEntityId: enquiry.id,
      });

      if (status === 'AWAITING_INFORMATION') {
        await emailService.sendEnquiryInfoRequestedNotification({
          email: ownerEmail,
          userName: ownerName,
          enquiryId: enquiry.id,
          subject: enquiry.subject,
          message: resolutionComment || 'Additional details or documents requested by support.',
        }).catch((err) => console.error('Failed to send info request email:', err));
      } else if (status === 'RESOLVED') {
        await emailService.sendEnquiryResolvedNotification({
          email: ownerEmail,
          userName: ownerName,
          enquiryId: enquiry.id,
          subject: enquiry.subject,
          resolutionMessage: resolutionComment || 'Your ticket has been marked as resolved.',
        }).catch((err) => console.error('Failed to send resolution email:', err));
      } else if (status === 'CLOSED') {
        await emailService.sendEnquiryClosedNotification({
          email: ownerEmail,
          userName: ownerName,
          enquiryId: enquiry.id,
          subject: enquiry.subject,
        }).catch((err) => console.error('Failed to send closure email:', err));
      }
    }

    return res.json({
      success: true,
      message: `Enquiry ${enquiry.id} updated successfully.`,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getComplaintCategories(req: AuthRequest, res: Response) {
  try {
    const categories = await prisma.complaintCategory.findMany({ orderBy: { name: 'asc' } });
    return res.json({ success: true, data: categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
