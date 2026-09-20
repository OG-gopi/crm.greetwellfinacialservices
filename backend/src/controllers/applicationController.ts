import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateApplicationId } from '../utils/appId';
import { createAuditLog } from '../services/auditService';
import { createNotification, notifySuperAdmins } from '../services/notificationService';
import { emailService } from '../services/emailService';
import { whatsAppService } from '../services/whatsappService';
import { eventNotificationService } from '../services/eventNotificationService';
import { validateIndianMobile, safeParseJsonArray } from '../utils/validation';
import { AuthRequest } from '../middleware/authMiddleware';

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['PENDING_ASSIGNMENT', 'ASSIGNED', 'UNDER_REVIEW', 'REJECTED'],
  PENDING_ASSIGNMENT: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['UNDER_REVIEW', 'INFORMATION_REQUIRED', 'DOCUMENTS_REQUIRED', 'REJECTED'],
  UNDER_REVIEW: ['INFORMATION_REQUIRED', 'DOCUMENTS_REQUIRED', 'VERIFICATION', 'APPROVED', 'REJECTED'],
  INFORMATION_REQUIRED: ['UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'REJECTED'],
  DOCUMENTS_REQUIRED: ['UNDER_REVIEW', 'VERIFICATION', 'REJECTED'],
  VERIFICATION: ['APPROVED', 'REJECTED', 'INFORMATION_REQUIRED'],
  APPROVED: ['COMPLETED'],
  REJECTED: ['DRAFT', 'UNDER_REVIEW'],
  COMPLETED: [],
};

export async function getApplications(req: AuthRequest, res: Response) {
  try {
    const { type, status, search, assigned, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const user = req.user!;
    const where: any = {};

    // 1. Role-based scoping
    if (user.role === 'CUSTOMER') {
      where.customerId = user.id;

      const userServices: string[] = Array.isArray(user.serviceTypes)
        ? user.serviceTypes.map((s) => s.toUpperCase())
        : ['LOANS'];
      
      const enabledTypes: string[] = [];
      if (userServices.includes('LOAN') || userServices.includes('LOANS')) enabledTypes.push('LOAN');
      if (userServices.includes('INSURANCE')) enabledTypes.push('INSURANCE');
      if (userServices.includes('INVESTMENT') || userServices.includes('INVESTMENTS')) enabledTypes.push('INVESTMENT');

      if (type) {
        if (!enabledTypes.includes((type as string).toUpperCase())) {
          where.type = 'UNAUTHORIZED_SERVICE';
        } else {
          where.type = type;
        }
      } else {
        where.type = { in: enabledTypes };
      }
    } else if (user.role === 'LOAN_AGENT') {
      where.type = 'LOAN';
      where.assignedAgentId = user.id;
    } else if (user.role === 'INSURANCE_AGENT') {
      where.type = 'INSURANCE';
      where.assignedAgentId = user.id;
    } else if (user.role === 'INVESTMENT_AGENT') {
      where.type = 'INVESTMENT';
      where.assignedAgentId = user.id;
    }

    // 2. Filters
    if (type && user.role !== 'CUSTOMER') where.type = type;
    if (status) where.status = status;
    if (assigned === 'unassigned' && user.role === 'SUPER_ADMIN') {
      where.assignedAgentId = null;
    }

    if (search) {
      const q = (search as string).toLowerCase();
      where.OR = [
        { id: { contains: q } },
        { purpose: { contains: q } },
        { customer: { firstName: { contains: q } } },
        { customer: { lastName: { contains: q } } },
        { customer: { email: { contains: q } } },
        { customer: { customerIdCode: { contains: q } } },
        { createdBy: { firstName: { contains: q } } },
        { createdBy: { lastName: { contains: q } } },
        { createdBy: { email: { contains: q } } },
        { createdBy: { agentIdCode: { contains: q } } },
        { createdBy: { customerIdCode: { contains: q } } },
        { assignedAgent: { firstName: { contains: q } } },
        { assignedAgent: { lastName: { contains: q } } },
        { assignedAgent: { agentIdCode: { contains: q } } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, customerIdCode: true, serviceTypes: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true, customerIdCode: true, agentIdCode: true, adminIdCode: true, superAdminIdCode: true } },
          assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true, role: true, agentIdCode: true } },
          _count: { select: { documents: true, notes: true, tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.application.count({ where }),
    ]);

    return res.json({
      success: true,
      data: applications,
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

export async function getApplicationById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user!;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, customerIdCode: true, serviceTypes: true, dob: true, education: true, hasExperience: true, previousCompany: true, previousJobRole: true, yearsOfExperience: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true, customerIdCode: true, agentIdCode: true, adminIdCode: true, superAdminIdCode: true } },
        assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true, role: true, agentIdCode: true } },
        documents: {
          include: {
            documentType: true,
            uploadedByUser: { select: { firstName: true, lastName: true } },
            verifiedByUser: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        requirements: { orderBy: { createdAt: 'desc' } },
        tasks: {
          include: { assignedToUser: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          include: { authorUser: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Enforce access control
    if (user.role === 'CUSTOMER') {
      if (application.customerId !== user.id) {
        return res.status(403).json({ success: false, message: 'Access denied to this application.' });
      }

      const userServices: string[] = Array.isArray(user.serviceTypes)
        ? user.serviceTypes.map((s) => s.toUpperCase())
        : ['LOANS'];
      
      const enabledTypes: string[] = [];
      if (userServices.includes('LOAN') || userServices.includes('LOANS')) enabledTypes.push('LOAN');
      if (userServices.includes('INSURANCE')) enabledTypes.push('INSURANCE');
      if (userServices.includes('INVESTMENT') || userServices.includes('INVESTMENTS')) enabledTypes.push('INVESTMENT');

      if (!enabledTypes.includes(application.type)) {
        return res.status(403).json({ success: false, message: 'Access denied to this application service.' });
      }
    }

    if (
      (user.role === 'LOAN_AGENT' && (application.type !== 'LOAN' || application.assignedAgentId !== user.id)) ||
      (user.role === 'INSURANCE_AGENT' && (application.type !== 'INSURANCE' || application.assignedAgentId !== user.id)) ||
      (user.role === 'INVESTMENT_AGENT' && (application.type !== 'INVESTMENT' || application.assignedAgentId !== user.id))
    ) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this application.' });
    }

    // Filter notes for customers (customers must NOT see internal agent notes)
    if (user.role === 'CUSTOMER') {
      application.notes = application.notes.filter((n) => n.isCustomerVisible);
    }

    return res.json({ success: true, data: application });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createApplication(req: AuthRequest, res: Response) {
  try {
    const { type, amount, term, purpose, formData, documents, priority = 'MEDIUM', customerId } = req.body;
    const user = req.user!;

    if (!['LOAN', 'INSURANCE', 'INVESTMENT'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid Application Type.' });
    }

    // Customer Service Permission Verification
    if (user.role === 'CUSTOMER') {
      const customerRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { serviceTypes: true },
      });
      const customerServices: string[] = safeParseJsonArray(customerRecord?.serviceTypes).map((s: string) => s.toUpperCase());

      const categoryMap: Record<string, string[]> = {
        LOAN: ['LOAN', 'LOANS'],
        INSURANCE: ['INSURANCE'],
        INVESTMENT: ['INVESTMENT', 'INVESTMENTS'],
      };

      const allowedKeys = categoryMap[type] || [type];
      const isServiceEnabled = allowedKeys.some((k) => customerServices.includes(k));
      if (!isServiceEnabled) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Service '${type}' is not enabled for your customer account. Please request service activation from Super Admin.`,
        });
      }
    }

    // Determine target customer ID for application
    let targetCustomerId = user.id;

    if (['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(user.role)) {
      if (!customerId || typeof customerId !== 'string' || customerId.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'A valid Customer must be selected to create an application. Applications cannot be created without a target customer.',
        });
      }

      const trimmedCus = customerId.trim();
      const targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: trimmedCus },
            { customerIdCode: trimmedCus },
            { email: trimmedCus },
          ],
        },
      });

      if (!targetUser) {
        return res.status(400).json({ success: false, message: `Specified Customer '${customerId}' was not found in portal database.` });
      }

      if (targetUser.role !== 'CUSTOMER') {
        return res.status(400).json({ success: false, message: `Selected user '${targetUser.email}' is not a valid Customer.` });
      }

      if (targetUser.status !== 'ACTIVE') {
        return res.status(400).json({ success: false, message: `Selected Customer account '${targetUser.email}' is not active.` });
      }

      // Check agent role service authorization
      if (user.role === 'LOAN_AGENT' && type !== 'LOAN') {
        return res.status(403).json({ success: false, message: 'Loan Agents can only create LOAN applications.' });
      }
      if (user.role === 'INSURANCE_AGENT' && type !== 'INSURANCE') {
        return res.status(403).json({ success: false, message: 'Insurance Agents can only create INSURANCE applications.' });
      }
      if (user.role === 'INVESTMENT_AGENT' && type !== 'INVESTMENT') {
        return res.status(403).json({ success: false, message: 'Investment Agents can only create INVESTMENT applications.' });
      }

      targetCustomerId = targetUser.id;
    }

    // Validate mobile number if supplied in formData or user profile
    const mobileToValidate = formData?.mobile || formData?.phone;
    if (mobileToValidate) {
      const mobCheck = validateIndianMobile(mobileToValidate);
      if (!mobCheck.isValid) {
        return res.status(400).json({ success: false, message: mobCheck.message });
      }
    }

    const appId = await generateApplicationId(type);

    const isAgentUser = ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(user.role);

    const newApp = await prisma.application.create({
      data: {
        id: appId,
        customerId: targetCustomerId,
        createdById: user.id,
        assignedAgentId: isAgentUser ? user.id : null,
        type,
        status: 'SUBMITTED',
        priority,
        amount: amount ? parseFloat(amount) : null,
        term: term || null,
        purpose: purpose || `${type} Application Submission`,
        formData: formData ? JSON.stringify(formData) : null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true, customerIdCode: true } },
        createdBy: { select: { firstName: true, lastName: true, email: true, role: true, customerIdCode: true, agentIdCode: true, superAdminIdCode: true } },
        assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true, role: true, agentIdCode: true } },
      },
    });

    // Create Document records if customer attached documents during application creation
    if (Array.isArray(documents) && documents.length > 0) {
      await Promise.all(
        documents.map(async (doc: any) => {
          if (!doc) return;
          const title = doc.type || doc.title || doc.name || 'Application Document';
          const fileName = doc.name || doc.fileName || `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          const fileUrl = doc.fileUrl || `/uploads/${fileName}`;
          const fileSize = typeof doc.size === 'number' ? doc.size : parseInt(doc.size, 10) || 1024;
          return prisma.document.create({
            data: {
              applicationId: newApp.id,
              title,
              fileName,
              fileUrl,
              fileSize,
              mimeType: doc.mimeType || 'application/pdf',
              uploadedByUserId: user.id,
              status: 'PENDING',
            },
          });
        })
      );
    }

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE_APPLICATION',
      entityType: 'APPLICATION',
      entityId: newApp.id,
      description: `Customer ${user.email} submitted ${type} application ${newApp.id}.`,
      ipAddress: req.ip,
    });

    // Central Business Event Notification Trigger (Super Admins + Customer + WhatsApp Mock)
    eventNotificationService.triggerBusinessEvent({
      eventType: 'APPLICATION_CREATED',
      actorUserId: user.id,
      actorName: `${user.firstName} ${user.lastName || ''}`.trim(),
      actorRole: user.role,
      customerId: newApp.customerId,
      customerName: `${newApp.customer?.firstName || user.firstName} ${newApp.customer?.lastName || user.lastName || ''}`.trim(),
      customerEmail: newApp.customer?.email || user.email,
      customerPhone: formData?.mobile || formData?.phone || newApp.customer?.phone,
      applicationId: newApp.id,
      applicationType: type,
      amount: newApp.amount ? Number(newApp.amount) : undefined,
      newStatus: 'SUBMITTED',
    }).catch((err) => console.error('Event trigger error:', err));

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data: newApp,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function assignApplication(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent || agent.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Agent not found or inactive.' });
    }

    // Role compatibility check: DO NOT ALLOW WRONG AGENT ROLE ASSIGNMENT!
    const roleMapping: Record<string, string> = {
      LOAN: 'LOAN_AGENT',
      INSURANCE: 'INSURANCE_AGENT',
      INVESTMENT: 'INVESTMENT_AGENT',
    };

    const requiredRole = roleMapping[application.type];
    if (agent.role !== requiredRole) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign a ${application.type} application to a ${agent.role.replace('_', ' ')}. Required role: ${requiredRole.replace('_', ' ')}.`,
      });
    }

    const updatedApp = await prisma.application.update({
      where: { id },
      data: {
        assignedAgentId: agent.id,
        status: application.status === 'SUBMITTED' || application.status === 'PENDING_ASSIGNMENT' ? 'ASSIGNED' : application.status,
      },
      include: {
        customer: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        assignedAgent: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      userRole: req.user?.role,
      action: 'ASSIGN_APPLICATION',
      entityType: 'APPLICATION',
      entityId: application.id,
      description: `Assigned application ${application.id} to Agent ${agent.firstName} ${agent.lastName}.`,
      ipAddress: req.ip,
    });

    await createNotification({
      recipientUserId: agent.id,
      recipientRole: agent.role,
      type: 'APPLICATION_ASSIGNED',
      title: 'New Application Assigned',
      message: `You have been assigned to ${application.type} Application ${application.id}.`,
      module: application.type === 'LOAN' ? 'LOANS' : application.type === 'INSURANCE' ? 'INSURANCE' : 'INVESTMENTS',
      source: 'SUPER_ADMIN',
      actionStatus: 'ACTION_REQUIRED',
      agentId: agent.id,
      customerId: application.customerId,
      applicationId: application.id,
      relatedEntity: 'APPLICATION',
      relatedEntityId: application.id,
    });

    // Central Event Notification Trigger
    eventNotificationService.triggerBusinessEvent({
      eventType: 'APPLICATION_ASSIGNED',
      actorUserId: req.user?.id,
      actorName: req.user ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'Super Admin',
      actorRole: req.user?.role || 'SUPER_ADMIN',
      customerId: updatedApp.customerId,
      customerName: updatedApp.customer ? `${updatedApp.customer.firstName} ${updatedApp.customer.lastName || ''}`.trim() : undefined,
      customerEmail: updatedApp.customer?.email,
      customerPhone: updatedApp.customer?.phone,
      agentId: agent.id,
      agentName: `${agent.firstName} ${agent.lastName || ''}`.trim(),
      agentEmail: agent.email,
      agentPhone: agent.phone,
      applicationId: application.id,
      applicationType: application.type,
    }).catch((err) => console.error('Event trigger error:', err));

    return res.json({
      success: true,
      message: `Application assigned to Agent ${agent.firstName} ${agent.lastName} successfully.`,
      data: updatedApp,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateApplicationStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const user = req.user!;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { customer: true, assignedAgent: true },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Role permission & assignment verification
    if (user.role !== 'SUPER_ADMIN') {
      if (application.assignedAgentId !== user.id) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this application.' });
      }
    }

    // Transition validation
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[application.status] || [];
    if (!allowedTransitions.includes(status) && user.role !== 'SUPER_ADMIN') {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${application.status}' to '${status}'. Permitted: [${allowedTransitions.join(', ')}]`,
      });
    }

    const updatedApp = await prisma.application.update({
      where: { id },
      data: { status },
    });

    if (note) {
      await prisma.note.create({
        data: {
          applicationId: id,
          authorUserId: user.id,
          content: `Status changed to ${status}: ${note}`,
          isCustomerVisible: true,
        },
      });
    }

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'UPDATE_APPLICATION_STATUS',
      entityType: 'APPLICATION',
      entityId: application.id,
      description: `Updated status of ${application.id} from ${application.status} to ${status}.`,
      ipAddress: req.ip,
    });

    // Central Event Notification Trigger
    const eventType = status === 'APPROVED' ? 'APPLICATION_APPROVED' : status === 'REJECTED' ? 'APPLICATION_REJECTED' : 'APPLICATION_STATUS_CHANGED';
    eventNotificationService.triggerBusinessEvent({
      eventType,
      actorUserId: user.id,
      actorName: `${user.firstName} ${user.lastName || ''}`.trim(),
      actorRole: user.role,
      customerId: application.customerId,
      customerName: application.customer ? `${application.customer.firstName} ${application.customer.lastName || ''}`.trim() : undefined,
      customerEmail: application.customer?.email,
      customerPhone: application.customer?.phone,
      agentId: application.assignedAgentId || undefined,
      agentName: application.assignedAgent ? `${application.assignedAgent.firstName} ${application.assignedAgent.lastName || ''}`.trim() : undefined,
      agentEmail: application.assignedAgent?.email,
      agentPhone: application.assignedAgent?.phone,
      applicationId: application.id,
      applicationType: application.type,
      oldStatus: application.status,
      newStatus: status,
      rejectionReason: status === 'REJECTED' ? (note || 'Requirements not met') : undefined,
      details: note,
    }).catch((err) => console.error('Event trigger error:', err));

    return res.json({
      success: true,
      message: `Status updated to ${status}.`,
      data: updatedApp,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyApplicationData(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'VERIFY' | 'REJECT' | 'REQUEST_CHANGES'
    const user = req.user!;

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    let newVerificationStatus = 'PENDING';
    let newAppStatus = application.status;

    if (action === 'VERIFY') {
      newVerificationStatus = 'VERIFIED';
      newAppStatus = 'APPROVED';
    } else if (action === 'REJECT') {
      newVerificationStatus = 'REJECTED';
      newAppStatus = 'REJECTED';
    } else if (action === 'REQUEST_CHANGES') {
      newVerificationStatus = 'PENDING';
      newAppStatus = 'INFORMATION_REQUIRED';
    }

    const updatedApp = await prisma.application.update({
      where: { id },
      data: {
        verificationStatus: newVerificationStatus,
        verificationComment: comment,
        verifiedByUserId: user.id,
        verifiedAt: new Date(),
        status: newAppStatus,
      },
    });

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: `VERIFY_APPLICATION_${action}`,
      entityType: 'APPLICATION',
      entityId: application.id,
      description: `${user.role} performed verification action '${action}' on application ${application.id}. Comment: ${comment || 'N/A'}`,
      ipAddress: req.ip,
    });

    await createNotification({
      recipientUserId: application.customerId,
      type: 'VERIFICATION_UPDATE',
      title: `Verification Result for ${application.id}`,
      message: `Your application verification result: ${action}. ${comment ? 'Comment: ' + comment : ''}`,
      relatedEntity: 'APPLICATION',
      relatedEntityId: application.id,
    });

    return res.json({
      success: true,
      message: `Application verification marked as ${action}.`,
      data: updatedApp,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createApplicationRequest(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, isRequired = true, dueDate } = req.body;
    const user = req.user!;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Request title is required.' });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { customer: true, assignedAgent: true },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (user.role !== 'SUPER_ADMIN' && application.assignedAgentId !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to create requests for this application.' });
    }

    const requirement = await prisma.applicationRequirement.create({
      data: {
        applicationId: id,
        title: title.trim(),
        description: description ? description.trim() : null,
        isRequired: Boolean(isRequired),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'OPEN',
      },
    });

    const targetStatus = title.toLowerCase().includes('document') ? 'DOCUMENTS_REQUIRED' : 'INFORMATION_REQUIRED';
    await prisma.application.update({
      where: { id },
      data: { status: targetStatus },
    });

    // Send targeted email notification to application customer owner
    if (application.customer?.email) {
      const customerName = `${application.customer.firstName} ${application.customer.lastName || ''}`.trim();
      await emailService.sendDocumentRequestedEmail({
        customerEmail: application.customer.email,
        customerName,
        applicationId: id,
        requestedDocumentNames: [title],
        reason: description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      }).catch((err) => console.error('Document requested email error:', err));
    }

    await createNotification({
      recipientUserId: application.customerId,
      recipientRole: 'CUSTOMER',
      type: 'INFORMATION_REQUIRED',
      title: `Action Required for Application ${id}`,
      message: `Request from ${user.firstName}: ${title}`,
      module: application.type === 'LOAN' ? 'LOANS' : application.type === 'INSURANCE' ? 'INSURANCE' : 'INVESTMENTS',
      source: user.role,
      actionStatus: 'ACTION_REQUIRED',
      customerId: application.customerId,
      applicationId: id,
      relatedEntity: 'APPLICATION',
      relatedEntityId: id,
    });

    if (application.customer.phone) {
      const mobCheck = validateIndianMobile(application.customer.phone);
      if (mobCheck.isValid && mobCheck.cleanPhone) {
        await whatsAppService.notifyDocumentRequest(
          mobCheck.cleanPhone,
          application.customer.firstName,
          id,
          title,
          description
        );
      }
    }

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE_APPLICATION_REQUEST',
      entityType: 'APPLICATION',
      entityId: id,
      description: `${user.role} created request '${title}' for application ${id}.`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Request created successfully.',
      data: requirement,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function replyToApplicationRequest(req: AuthRequest, res: Response) {
  try {
    const { requestId } = req.params;
    const { customerReply, replyDocUrl } = req.body;
    const user = req.user!;

    const requirement = await prisma.applicationRequirement.findUnique({
      where: { id: requestId },
      include: {
        application: {
          include: { customer: true, assignedAgent: true },
        },
      },
    });

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Request item not found.' });
    }

    if (user.role === 'CUSTOMER' && requirement.application.customerId !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to reply to this request.' });
    }

    const updatedRequirement = await prisma.applicationRequirement.update({
      where: { id: requestId },
      data: {
        customerReply: customerReply ? customerReply.trim() : 'Replied with requested details/documents.',
        replyDocUrl: replyDocUrl || null,
        status: 'CUSTOMER_REPLIED',
      },
    });

    if (replyDocUrl) {
      const fileName = replyDocUrl.split('/').pop() || requirement.title;
      await prisma.document.create({
        data: {
          applicationId: requirement.applicationId,
          title: requirement.title,
          fileName: fileName,
          fileUrl: replyDocUrl,
          fileSize: 1024 * 100,
          mimeType: replyDocUrl.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          uploadedByUserId: user.id,
          status: 'PENDING',
        },
      }).catch((err) => console.error('Auto document record creation notice:', err?.message));

      const customerName = `${user.firstName} ${user.lastName || ''}`.trim();
      const targetAgentEmail = requirement.application.assignedAgent?.email;

      if (targetAgentEmail) {
        await emailService.sendDocumentUploadedNotification({
          recipientEmail: targetAgentEmail,
          recipientName: `${requirement.application.assignedAgent!.firstName} ${requirement.application.assignedAgent!.lastName || ''}`.trim(),
          customerName,
          applicationId: requirement.applicationId,
          documentTitle: requirement.title,
          fileName,
        }).catch((err) => console.error('Document uploaded email error:', err));
      } else {
        // If no assigned agent, notify SuperAdmins
        await emailService.notifySuperAdmins({
          subject: `Document Uploaded by ${customerName} (${requirement.applicationId})`,
          titleHeader: 'NEW DOCUMENT UPLOADED',
          mainParagraphs: [
            `Customer <strong>${customerName}</strong> uploaded document <strong>"${requirement.title}"</strong> for Application <strong>${requirement.applicationId}</strong>.`,
          ],
          detailsCard: [
            { label: 'Application ID', value: requirement.applicationId },
            { label: 'Document Title', value: requirement.title },
            { label: 'File Name', value: fileName },
          ],
          applicationId: requirement.applicationId,
        });
      }
    }

    if (requirement.application.assignedAgentId) {
      await createNotification({
        recipientUserId: requirement.application.assignedAgentId,
        recipientRole: requirement.application.assignedAgent?.role || 'LOAN_AGENT',
        type: 'CUSTOMER_REPLIED',
        title: `Customer Replied to Request - ${requirement.applicationId}`,
        message: `Customer ${user.firstName} replied to '${requirement.title}'.`,
        module: requirement.application.type === 'LOAN' ? 'LOANS' : requirement.application.type === 'INSURANCE' ? 'INSURANCE' : 'INVESTMENTS',
        source: 'CUSTOMER',
        actionStatus: 'ACTION_REQUIRED',
        agentId: requirement.application.assignedAgentId,
        customerId: user.id,
        applicationId: requirement.applicationId,
        relatedEntity: 'APPLICATION',
        relatedEntityId: requirement.applicationId,
      });

      if (requirement.application.assignedAgent?.phone) {
        const mobCheck = validateIndianMobile(requirement.application.assignedAgent.phone);
        if (mobCheck.isValid && mobCheck.cleanPhone) {
          await whatsAppService.notifyCustomerReply(
            mobCheck.cleanPhone,
            requirement.application.assignedAgent.firstName,
            requirement.applicationId,
            requirement.title
          );
        }
      }
    }

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'REPLY_APPLICATION_REQUEST',
      entityType: 'APPLICATION',
      entityId: requirement.applicationId,
      description: `Customer ${user.email} replied to request '${requirement.title}'.`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Reply submitted successfully.',
      data: updatedRequirement,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateRequestStatus(req: AuthRequest, res: Response) {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'CUSTOMER_REPLIED', 'UNDER_REVIEW', 'COMPLETED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid request status.' });
    }

    const requirement = await prisma.applicationRequirement.update({
      where: { id: requestId },
      data: { status },
    });

    return res.json({
      success: true,
      message: `Request status updated to ${status}.`,
      data: requirement,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
