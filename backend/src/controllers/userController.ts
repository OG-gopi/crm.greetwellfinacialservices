import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { emailService } from '../services/emailService';
import { createAuditLog } from '../services/auditService';
import { createNotification, notifySuperAdmins } from '../services/notificationService';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateCustomerId, generateAgentId } from '../utils/appId';
import { validateIndianMobile, safeParseJsonArray } from '../utils/validation';
import { whatsAppService } from '../services/whatsappService';

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const { role, status, search, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const currentUser = req.user!;
    const where: any = {};

    // 1. Role-based user scoping for Customers & Agents
    if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(currentUser.role)) {
      const assignedApps = await prisma.application.findMany({
        where: { assignedAgentId: currentUser.id },
        select: { customerId: true },
      });
      const assignedCustomerIds = Array.from(new Set(assignedApps.map((a) => a.customerId)));
      where.id = { in: assignedCustomerIds };
      where.role = 'CUSTOMER';
    } else if (currentUser.role === 'CUSTOMER') {
      where.id = currentUser.id;
    } else if (role === 'AGENTS') {
      where.role = { in: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] };
    } else if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      const q = (search as string).toLowerCase();
      where.OR = [
        { email: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
        { customerIdCode: { contains: q } },
        { agentIdCode: { contains: q } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          customerIdCode: true,
          agentIdCode: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          serviceTypes: true,
          dob: true,
          education: true,
          hasExperience: true,
          previousCompany: true,
          previousJobRole: true,
          yearsOfExperience: true,
          previousJobStartDate: true,
          previousJobEndDate: true,
          aadhaarDocUrl: true,
          educationDocUrl: true,
          experienceDocUrl: true,
          otherDocUrl: true,
          createdAt: true,
          _count: {
            select: {
              assignedApplications: true,
              customerApplications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map((u) => ({
      ...u,
      serviceTypes: safeParseJsonArray(u.serviceTypes),
    }));

    return res.json({
      success: true,
      data: formattedUsers,
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

export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { id } = req.params;

    // Authorization checks
    if (currentUser.role === 'CUSTOMER' && id !== currentUser.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own user profile.' });
    }

    if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(currentUser.role) && id !== currentUser.id) {
      const isAssignedCustomer = await prisma.application.findFirst({
        where: { customerId: id, assignedAgentId: currentUser.id },
      });
      if (!isAssignedCustomer) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This customer is not associated with your assigned applications.',
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedApplications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        customerApplications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;

    return res.json({
      success: true,
      data: {
        ...safeUser,
        serviceTypes: safeParseJsonArray(safeUser.serviceTypes),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createAgentInvitation(req: AuthRequest, res: Response) {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      agentType,
      dob,
      education,
      aadhaarDocUrl,
      hasExperience,
      previousCompany,
      previousJobRole,
      yearsOfExperience,
      previousJobStartDate,
      previousJobEndDate,
      educationDocUrl,
      experienceDocUrl,
      otherDocUrl,
    } = req.body;
    const adminUserId = req.user?.id;

    // 1. Mandatory Form Validations (First Name, DOB, Education, Email, Mobile, Agent Role, Aadhaar)
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Agent Email Address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid Agent Email Address format.' });
    }

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First Name is required.' });
    }

    if (!dob) {
      return res.status(400).json({ success: false, message: 'Date of Birth is required.' });
    }

    if (!education || !education.trim()) {
      return res.status(400).json({ success: false, message: 'Highest Education is required.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile Phone Number is required.' });
    }

    const mobCheck = validateIndianMobile(phone);
    if (!mobCheck.isValid) {
      return res.status(400).json({ success: false, message: mobCheck.message });
    }

    if (!agentType || !['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(agentType)) {
      return res.status(400).json({ success: false, message: 'Please select a valid Agent Role (Loan, Insurance, or Investment).' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Existing User Check
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: `A user with email '${cleanEmail}' already exists in the system.` });
    }

    // 3. Generate Agent ID Code (e.g. AGT-2026-000001)
    const agentIdCode = await generateAgentId();

    // 4. Generate 6-Digit Verification OTPs
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000); // 72 Hours

    // 5. Save Invitation Record
    const invitation = await prisma.invitation.create({
      data: {
        email: cleanEmail,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null, // Optional!
        phone: phone.trim(),
        agentIdCode,
        role: agentType,
        token,
        status: 'INVITATION_SENT',
        dob: new Date(dob),
        education: education.trim(),
        aadhaarDocUrl: aadhaarDocUrl.trim(),
        hasExperience: Boolean(hasExperience),
        previousCompany: previousCompany ? previousCompany.trim() : null,
        previousJobRole: previousJobRole ? previousJobRole.trim() : null,
        yearsOfExperience: yearsOfExperience ? String(yearsOfExperience) : null,
        previousJobStartDate: previousJobStartDate ? new Date(previousJobStartDate) : null,
        previousJobEndDate: previousJobEndDate ? new Date(previousJobEndDate) : null,
        educationDocUrl: educationDocUrl ? educationDocUrl.trim() : null,
        experienceDocUrl: experienceDocUrl ? experienceDocUrl.trim() : null,
        otherDocUrl: otherDocUrl ? otherDocUrl.trim() : null,
        emailOtp,
        mobileOtp,
        otpExpiresAt,
        isEmailVerified: false,
        isMobileVerified: false,
        deliveryStatus: 'PENDING',
        invitedByUserId: adminUserId,
        expiresAt,
      },
    });

    // 6. Send Branded GFS Email
    const emailSent = await emailService.sendAgentInvitation({
      email: cleanEmail,
      role: agentType,
      token,
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : undefined,
      agentIdCode,
      emailOtp,
      mobileOtp,
    });

    if (!emailSent) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'FAILED', deliveryStatus: 'FAILED' },
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to deliver invitation email to recipient. Please verify SMTP configuration.',
      });
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { deliveryStatus: 'SENT' },
    });

    // 7. Audit Log
    await createAuditLog({
      userId: adminUserId,
      userRole: req.user?.role,
      action: 'INVITE_AGENT',
      entityType: 'INVITATION',
      entityId: invitation.id,
      description: `Super Admin invited ${firstName} ${lastName || ''} (${cleanEmail}) as ${agentType} with Agent ID ${agentIdCode}.`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: `Agent invitation successfully dispatched to ${cleanEmail}.`,
      data: {
        invitationId: invitation.id,
        agentIdCode,
        email: cleanEmail,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null,
        role: agentType,
        token: invitation.token,
        emailOtp,
        mobileOtp,
        deliveryStatus: 'SENT',
      },
    });
  } catch (err: any) {
    console.error('Error in createAgentInvitation:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function inviteCustomer(req: AuthRequest, res: Response) {
  try {
    const { firstName, lastName, email, phone, serviceTypes } = req.body;
    const inviter = req.user!;

    // 1. Mandatory Form Validation
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First Name is required.' });
    }

    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ success: false, message: 'Last Name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email Address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid Email Address format.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile Phone Number is required.' });
    }

    const mobCheck = validateIndianMobile(phone);
    if (!mobCheck.isValid) {
      return res.status(400).json({ success: false, message: mobCheck.message });
    }

    if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one Customer Service (Loans, Insurance, or Investments).' });
    }

    const validServices = ['LOANS', 'INSURANCE', 'INVESTMENT'];
    const invalidServices = serviceTypes.filter((s) => !validServices.includes(s));
    if (invalidServices.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid customer service selection: ${invalidServices.join(', ')}` });
    }

    // 2. Role-based Service Selection Permission Enforcement
    if (inviter.role === 'LOAN_AGENT') {
      if (serviceTypes.some((s) => s !== 'LOANS')) {
        return res.status(403).json({
          success: false,
          message: 'Loan Agents are authorized to invite customers for Loans service only.',
        });
      }
    } else if (inviter.role === 'INSURANCE_AGENT') {
      if (serviceTypes.some((s) => s !== 'INSURANCE')) {
        return res.status(403).json({
          success: false,
          message: 'Insurance Agents are authorized to invite customers for Insurance service only.',
        });
      }
    } else if (inviter.role === 'INVESTMENT_AGENT') {
      if (serviceTypes.some((s) => s !== 'INVESTMENT')) {
        return res.status(403).json({
          success: false,
          message: 'Investment Agents are authorized to invite customers for Investments service only.',
        });
      }
    }

    // 3. Duplicate User / Invitation Check
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `A user with email '${cleanEmail}' is already registered in the system.`,
      });
    }

    // 4. Generate Unique Customer ID Code (CUS-2026-000001)
    const customerIdCode = await generateCustomerId();

    // 5. Generate Secure Invitation Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000); // 72 Hours

    // 6. Save Invitation Record
    const invitation = await prisma.invitation.create({
      data: {
        email: cleanEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        serviceTypes: JSON.stringify(serviceTypes),
        customerIdCode,
        role: 'CUSTOMER',
        token,
        status: 'INVITATION_SENT',
        invitedByUserId: inviter.id,
        expiresAt,
      },
    });

    // 7. Send GFS Branded Verification Email
    const inviterName = `${inviter.firstName} ${inviter.lastName} (${inviter.role.replace(/_/g, ' ')})`;
    const emailSent = await emailService.sendCustomerInvitation({
      email: cleanEmail,
      token,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      customerIdCode,
      serviceTypes,
      inviterName,
    });

    if (!emailSent) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'FAILED' },
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to deliver invitation email. Please verify SMTP server settings.',
      });
    }

    // 8. Create Audit Log & System Notification
    await createAuditLog({
      userId: inviter.id,
      userRole: inviter.role,
      action: 'INVITE_CUSTOMER',
      entityType: 'INVITATION',
      entityId: invitation.id,
      description: `${inviter.role} invited customer ${firstName} ${lastName} (${cleanEmail}) with Customer ID ${customerIdCode} for ${serviceTypes.join(', ')}.`,
      ipAddress: req.ip,
    });

    if (inviter.role !== 'SUPER_ADMIN') {
      await notifySuperAdmins(
        'CUSTOMER_INVITED',
        'New Customer Invited',
        `Agent ${inviter.firstName} ${inviter.lastName} invited customer ${firstName} ${lastName} (${customerIdCode}) for ${serviceTypes.join(', ')}.`,
        {
          module: 'CUSTOMERS',
          source: 'AGENT',
          actionStatus: 'NONE',
          agentId: inviter.id,
          relatedEntity: 'USER',
          relatedEntityId: invitation.id,
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: `Customer invitation successfully sent to ${cleanEmail}.`,
      data: {
        invitationId: invitation.id,
        customerIdCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        serviceTypes,
        status: 'INVITATION_SENT',
        token,
      },
    });
  } catch (err: any) {
    console.error('Error inviting customer:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateUserStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be ACTIVE or INACTIVE.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });

    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function editUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      role,
      status,
      dob,
      education,
      hasExperience,
      previousCompany,
      previousJobRole,
      yearsOfExperience,
      previousJobStartDate,
      previousJobEndDate,
      aadhaarDocUrl,
      educationDocUrl,
      experienceDocUrl,
      otherDocUrl,
    } = req.body;

    const dataToUpdate: any = {};
    if (firstName !== undefined) dataToUpdate.firstName = firstName.trim();
    if (lastName !== undefined) dataToUpdate.lastName = lastName ? lastName.trim() : null;
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
    if (role !== undefined) dataToUpdate.role = role;
    if (status !== undefined) dataToUpdate.status = status;
    if (dob !== undefined) dataToUpdate.dob = dob ? new Date(dob) : null;
    if (education !== undefined) dataToUpdate.education = education;
    if (hasExperience !== undefined) dataToUpdate.hasExperience = Boolean(hasExperience);
    if (previousCompany !== undefined) dataToUpdate.previousCompany = previousCompany ? previousCompany.trim() : null;
    if (previousJobRole !== undefined) dataToUpdate.previousJobRole = previousJobRole ? previousJobRole.trim() : null;
    if (yearsOfExperience !== undefined) dataToUpdate.yearsOfExperience = yearsOfExperience ? String(yearsOfExperience) : null;
    if (previousJobStartDate !== undefined) dataToUpdate.previousJobStartDate = previousJobStartDate ? new Date(previousJobStartDate) : null;
    if (previousJobEndDate !== undefined) dataToUpdate.previousJobEndDate = previousJobEndDate ? new Date(previousJobEndDate) : null;
    if (aadhaarDocUrl !== undefined) dataToUpdate.aadhaarDocUrl = aadhaarDocUrl;
    if (educationDocUrl !== undefined) dataToUpdate.educationDocUrl = educationDocUrl;
    if (experienceDocUrl !== undefined) dataToUpdate.experienceDocUrl = experienceDocUrl;
    if (otherDocUrl !== undefined) dataToUpdate.otherDocUrl = otherDocUrl;

    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json({ success: true, message: 'Agent details updated successfully.', data: user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function resendAgentInvitation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation record not found.' });
    }

    if (invitation.status === 'VERIFIED') {
      return res.status(400).json({ success: false, message: 'This invitation has already been verified and activated.' });
    }

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000);

    const updatedInvitation = await prisma.invitation.update({
      where: { id },
      data: {
        emailOtp,
        mobileOtp,
        otpExpiresAt,
        expiresAt,
        status: 'INVITATION_SENT',
        deliveryStatus: 'PENDING',
      },
    });

    const emailSent = await emailService.sendAgentInvitation({
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      firstName: invitation.firstName || 'Agent',
      lastName: invitation.lastName || undefined,
      agentIdCode: invitation.agentIdCode || 'AGT-PENDING',
      emailOtp,
      mobileOtp,
    });

    if (!emailSent) {
      await prisma.invitation.update({
        where: { id },
        data: { status: 'FAILED', deliveryStatus: 'FAILED' },
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to resend invitation email. Please check server email settings.',
      });
    }

    await prisma.invitation.update({
      where: { id },
      data: { deliveryStatus: 'SENT' },
    });

    await createAuditLog({
      userId: req.user?.id,
      userRole: req.user?.role,
      action: 'RESEND_AGENT_INVITATION',
      entityType: 'INVITATION',
      entityId: invitation.id,
      description: `Resent agent invitation email & OTPs to ${invitation.email}.`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Invitation email successfully resent to ${invitation.email}.`,
      data: updatedInvitation,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getInvitations(req: AuthRequest, res: Response) {
  try {
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        invitedByUser: {
          select: { firstName: true, lastName: true, role: true, email: true },
        },
      },
    });

    const formatted = invitations.map((inv) => ({
      ...inv,
      serviceTypes: safeParseJsonArray(inv.serviceTypes),
    }));

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateCustomerServices(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { serviceTypes } = req.body;

    if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one valid financial service.' });
    }

    const validServices = ['LOANS', 'INSURANCE', 'INVESTMENT'];
    const uppercaseServices = serviceTypes.map((s: string) => s.toUpperCase());
    const invalid = uppercaseServices.filter((s: string) => !validServices.includes(s));
    if (invalid.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid service type(s): ${invalid.join(', ')}` });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        serviceTypes: JSON.stringify(uppercaseServices),
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      userRole: req.user?.role,
      action: 'UPDATE_CUSTOMER_SERVICES',
      entityType: 'USER',
      entityId: id,
      description: `Super Admin updated service access for ${targetUser.email} to: ${uppercaseServices.join(', ')}.`,
      ipAddress: req.ip,
    });

    await createNotification({
      recipientUserId: id,
      recipientRole: 'CUSTOMER',
      type: 'SERVICE_ACCESS_UPDATED',
      title: 'Service Access Updated',
      message: `Your financial service permissions have been updated. Enabled services: ${uppercaseServices.join(', ')}.`,
      module: 'SYSTEM',
      source: 'SUPER_ADMIN',
      actionStatus: 'NONE',
      customerId: id,
    });

    return res.json({
      success: true,
      message: `Customer financial services updated to: ${uppercaseServices.join(', ')}.`,
      data: {
        ...updatedUser,
        serviceTypes: uppercaseServices,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function requestServiceAccess(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const { requestedService, reason } = req.body;

    if (!requestedService) {
      return res.status(400).json({ success: false, message: 'Requested financial service is required.' });
    }

    const serviceCode = requestedService.toUpperCase();
    const validServices = ['LOANS', 'INSURANCE', 'INVESTMENT'];
    if (!validServices.includes(serviceCode)) {
      return res.status(400).json({ success: false, message: 'Invalid financial service requested.' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const existingServices: string[] = safeParseJsonArray(currentUser.serviceTypes);
    if (existingServices.includes(serviceCode)) {
      return res.status(400).json({ success: false, message: `Service '${serviceCode}' is already enabled for your account.` });
    }

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'REQUEST_SERVICE_ACCESS',
      entityType: 'USER',
      entityId: user.id,
      description: `Customer ${user.email} requested activation of financial service: ${serviceCode}.`,
      ipAddress: req.ip,
    });

    await notifySuperAdmins(
      'SERVICE_ACCESS_REQUEST',
      'New Service Access Request',
      `Customer ${user.firstName} ${user.lastName || ''} (${currentUser.customerIdCode || user.email}) requested access for service: ${serviceCode}.${reason ? ' Reason: ' + reason : ''}`,
      { module: 'USER', relatedEntityId: user.id }
    );

    return res.json({
      success: true,
      message: `Your request for ${serviceCode} service access has been submitted to Super Admin for approval.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createUserAccount(req: AuthRequest, res: Response) {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      password,
      role,
      status,
      serviceTypes,
    } = req.body;
    const adminUserId = req.user?.id;

    // 1. Mandatory Validations
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First Name is required.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile Phone Number is required.' });
    }

    const mobCheck = validateIndianMobile(phone);
    if (!mobCheck.isValid) {
      return res.status(400).json({ success: false, message: mobCheck.message });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password is required and must be at least 6 characters long.' });
    }

    const validRoles = ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT', 'CUSTOMER'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Please select a valid user role.' });
    }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION'];
    const userStatus = status && validStatuses.includes(status) ? status : 'ACTIVE';

    const cleanEmail = email.trim().toLowerCase();

    // 2. Duplicate Check
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: `A user with email '${cleanEmail}' already exists.` });
    }

    // 3. Password Hash
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Generate ID codes according to role
    let customerIdCode: string | null = null;
    let agentIdCode: string | null = null;

    if (role === 'CUSTOMER') {
      customerIdCode = await generateCustomerId();
    } else if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(role)) {
      agentIdCode = await generateAgentId();
    }

    // 5. Save User
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null,
        phone: phone.trim(),
        role,
        status: userStatus,
        customerIdCode,
        agentIdCode,
        serviceTypes: serviceTypes && Array.isArray(serviceTypes) ? JSON.stringify(serviceTypes) : null,
      },
    });

    // 6. Audit Log
    await createAuditLog({
      userId: adminUserId,
      userRole: req.user?.role,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: newUser.id,
      description: `Super Admin created new user ${newUser.firstName} ${newUser.lastName || ''} (${cleanEmail}) with role ${role} and status ${userStatus}.`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: `${role === 'SUPER_ADMIN' ? 'Super Admin' : 'User'} created successfully.`,
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        customerIdCode: newUser.customerIdCode,
        agentIdCode: newUser.agentIdCode,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Error in createUserAccount:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createSuperAdminInvitation(req: AuthRequest, res: Response) {
  try {
    const { email, firstName, lastName, phone, notes } = req.body;
    const adminUserId = req.user?.id;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First Name is required.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile Phone Number is required.' });
    }

    const mobCheck = validateIndianMobile(phone);
    if (!mobCheck.isValid) {
      return res.status(400).json({ success: false, message: mobCheck.message });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Existing User Check
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: `A user with email '${cleanEmail}' already exists in the system.` });
    }

    // 2. Pending Invitation Check
    const pendingInvitation = await prisma.invitation.findFirst({
      where: {
        email: cleanEmail,
        status: { in: ['PENDING', 'INVITATION_SENT'] },
      },
    });
    if (pendingInvitation) {
      return res.status(400).json({ success: false, message: `An active invitation has already been sent to '${cleanEmail}'.` });
    }

    // 3. Generate Security Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000); // 72 Hours

    const inviterName = req.user ? `${req.user.email}` : 'Super Admin';

    // 4. Save Invitation Record
    const invitation = await prisma.invitation.create({
      data: {
        email: cleanEmail,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null,
        phone: phone.trim(),
        role: 'SUPER_ADMIN',
        token,
        status: 'INVITATION_SENT',
        deliveryStatus: 'PENDING',
        invitedByUserId: adminUserId,
        expiresAt,
      },
    });

    // 5. Send Branded Super Admin Invitation Email
    const emailSent = await emailService.sendSuperAdminInvitation({
      email: cleanEmail,
      token,
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : undefined,
      inviterName,
      notes: notes ? notes.trim() : undefined,
    });

    if (!emailSent) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'FAILED', deliveryStatus: 'FAILED' },
      });

      await createAuditLog({
        userId: adminUserId,
        userRole: req.user?.role,
        action: 'INVITE_SUPER_ADMIN_FAILED',
        entityType: 'INVITATION',
        entityId: invitation.id,
        description: `Failed to deliver Super Admin invitation email to ${cleanEmail}.`,
        ipAddress: req.ip,
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to deliver invitation email to recipient. Please check SMTP configuration.',
      });
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { deliveryStatus: 'SENT' },
    });

    // 6. Audit Log
    await createAuditLog({
      userId: adminUserId,
      userRole: req.user?.role,
      action: 'INVITE_SUPER_ADMIN',
      entityType: 'INVITATION',
      entityId: invitation.id,
      description: `Super Admin invited ${firstName} ${lastName || ''} (${cleanEmail}) as Super Admin.`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: `Super Admin invitation successfully dispatched to ${cleanEmail}.`,
      data: {
        invitationId: invitation.id,
        email: cleanEmail,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null,
        role: 'SUPER_ADMIN',
        token: invitation.token,
        deliveryStatus: 'SENT',
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (err: any) {
    console.error('Error in createSuperAdminInvitation:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function cancelInvitation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const adminUserId = req.user?.id;

    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    await prisma.invitation.delete({ where: { id } });

    await createAuditLog({
      userId: adminUserId,
      userRole: req.user?.role,
      action: 'CANCEL_INVITATION',
      entityType: 'INVITATION',
      entityId: id,
      description: `Canceled invitation for ${invitation.email} (${invitation.role}).`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Invitation for ${invitation.email} has been canceled.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}


