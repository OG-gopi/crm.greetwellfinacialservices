import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { emailService } from '../services/emailService';
import { createAuditLog } from '../services/auditService';
import { notifySuperAdmins } from '../services/notificationService';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateCustomerId, generateAgentId } from '../utils/appId';
import { validateIndianMobile, safeParseJsonArray, checkDuplicateUserOrInvite } from '../utils/validation';


export async function login(req: Request, res: Response) {
  try {
    const { email, password, requiredRole, requiredCategory } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const loginIdentifier = email.trim().toLowerCase();
    const rawIdentifier = email.trim();

    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: loginIdentifier },
            { phone: rawIdentifier },
            { customerIdCode: rawIdentifier.toUpperCase() },
            { agentIdCode: rawIdentifier.toUpperCase() },
          ],
        },
      });
    } catch (dbErr: any) {
      console.error('Database connection error during login lookup:', dbErr);
      return res.status(503).json({
        success: false,
        message: 'Unable to connect to database: ' + (dbErr?.message || String(dbErr)),
        error_details: String(dbErr?.stack || dbErr),
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Account is inactive or pending verification.' });
    }

    // Role check if login page specified a required role
    if (requiredRole) {
      if (requiredRole === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: `Access denied. Account role '${user.role.replace(/_/g, ' ')}' is not authorized for the Super Admin portal.`,
        });
      }
      if (requiredRole === 'CUSTOMER' && user.role !== 'CUSTOMER' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: `Access denied. Account role '${user.role.replace(/_/g, ' ')}' is not authorized for the Customer portal.`,
        });
      }
    }

    // Category check for Agent portal
    if (requiredCategory === 'AGENT') {
      const isAgent = ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT', 'SUPER_ADMIN'].includes(user.role);
      if (!isAgent) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Account role '${user.role.replace(/_/g, ' ')}' is not authorized for the Agent portal.`,
        });
      }
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      description: `User ${user.email} logged in successfully.`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          customerIdCode: user.customerIdCode,
          agentIdCode: user.agentIdCode,
          serviceTypes: safeParseJsonArray(user.serviceTypes),
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function registerCustomer(req: Request, res: Response) {
  try {
    const { email, password, confirmPassword, firstName, lastName, phone, serviceTypes, skipVerification } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First name is required.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Enforce strict duplicate email & phone check across User and Invitation tables
    const dupCheck = await checkDuplicateUserOrInvite(prisma, cleanEmail, phone);
    if (dupCheck.isDuplicate) {
      return res.status(400).json({ success: false, message: dupCheck.message });
    }

    if (phone && phone.trim() && phone.trim() !== 'N/A') {
      const mobCheck = validateIndianMobile(phone);
      if (!mobCheck.isValid) {
        return res.status(400).json({ success: false, message: mobCheck.message });
      }
    }
    const cleanPhone = phone && phone.trim() ? phone.trim() : 'N/A';
    const parsedServiceTypes: string[] = Array.isArray(serviceTypes) && serviceTypes.length > 0 ? serviceTypes : ['LOANS', 'INSURANCE', 'INVESTMENT'];
    const passwordHash = await bcrypt.hash(password, 10);
    const formattedServices = JSON.stringify(parsedServiceTypes);
    const customerIdCode = await generateCustomerId();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 72 * 3600 * 1000); // 72 hours

    // Direct Customer Registration: Set status to ACTIVE automatically (no email/OTP verification required)
    const newCustomer = await prisma.user.create({
      data: {
        email: cleanEmail,
        customerIdCode,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null,
        phone: cleanPhone,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        serviceTypes: formattedServices,
        emailVerified: true,
        resetPasswordToken: verificationToken,
        resetPasswordExpires: verificationExpires,
      },
    });

    const token = generateToken({
      userId: newCustomer.id,
      email: newCustomer.email,
      role: newCustomer.role,
    });

    // Optionally dispatch welcome notification asynchronously without blocking registration
    emailService.sendCustomerRegistrationVerification({
      email: cleanEmail,
      token: verificationToken,
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : undefined,
      customerIdCode,
      serviceTypes: parsedServiceTypes,
    }).catch((err) => console.error('Async welcome email notice error:', err));

    await createAuditLog({
      userId: newCustomer.id,
      userRole: 'CUSTOMER',
      action: 'REGISTER_CUSTOMER_ACTIVE',
      entityType: 'USER',
      entityId: newCustomer.id,
      description: `New customer registered (Active): ${cleanEmail} (${customerIdCode}).`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Account is active.',
      data: {
        token,
        user: {
          id: newCustomer.id,
          customerIdCode: newCustomer.customerIdCode,
          email: newCustomer.email,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          phone: newCustomer.phone,
          role: newCustomer.role,
          status: newCustomer.status,
          serviceTypes: safeParseJsonArray(newCustomer.serviceTypes),
        },
        customerIdCode: newCustomer.customerIdCode,
        email: cleanEmail,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null,
        phone: cleanPhone,
        role: newCustomer.role,
        status: newCustomer.status,
        verificationToken,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyCustomerEmail(req: Request, res: Response) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const user = await prisma.user.findFirst({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Verification link is invalid or has expired.' });
    }

    if (user.emailVerified && user.status === 'ACTIVE') {
      return res.json({
        success: true,
        message: 'Email address is already verified.',
        data: { email: user.email, alreadyVerified: true },
      });
    }

    if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: 'Verification link has expired. Please register again.' });
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: 'ACTIVE',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await createAuditLog({
      userId: verifiedUser.id,
      userRole: verifiedUser.role,
      action: 'VERIFY_CUSTOMER_EMAIL',
      entityType: 'USER',
      entityId: verifiedUser.id,
      description: `Customer email verified successfully: ${verifiedUser.email}.`,
      ipAddress: req.ip,
    });

    await notifySuperAdmins(
      'NEW_CUSTOMER_VERIFIED',
      'Customer Email Verified',
      `Customer ${verifiedUser.firstName} ${verifiedUser.lastName || ''} (${verifiedUser.email}) verified email and activated account.`,
      { module: 'USER', relatedEntityId: verifiedUser.id }
    );

    return res.json({
      success: true,
      message: 'Email verified successfully! You may now sign in to your portal.',
      data: { email: verifiedUser.email },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyInviteToken(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { invitedByUser: true },
    });

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found or invalid.' });
    }

    if (!['PENDING', 'INVITATION_SENT'].includes(invitation.status)) {
      return res.status(400).json({ success: false, message: `Invitation has already been ${invitation.status.toLowerCase().replace('_', ' ')}.` });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ success: false, message: 'Invitation link has expired.' });
    }

    return res.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        phone: invitation.phone,
        serviceTypes: safeParseJsonArray(invitation.serviceTypes),
        customerIdCode: invitation.customerIdCode,
        agentIdCode: invitation.agentIdCode,
        dob: invitation.dob,
        education: invitation.education,
        aadhaarDocUrl: invitation.aadhaarDocUrl,
        hasExperience: invitation.hasExperience,
        previousCompany: invitation.previousCompany,
        previousJobRole: invitation.previousJobRole,
        yearsOfExperience: invitation.yearsOfExperience,
        previousJobStartDate: invitation.previousJobStartDate,
        previousJobEndDate: invitation.previousJobEndDate,
        educationDocUrl: invitation.educationDocUrl,
        experienceDocUrl: invitation.experienceDocUrl,
        otherDocUrl: invitation.otherDocUrl,
        isEmailVerified: invitation.isEmailVerified,
        isMobileVerified: invitation.isMobileVerified,
        emailOtp: invitation.emailOtp,
        mobileOtp: invitation.mobileOtp,
        invitedBy: invitation.invitedByUser ? `${invitation.invitedByUser.firstName} ${invitation.invitedByUser.lastName || ''}` : 'Super Admin',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyAgentOtp(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { emailOtp, mobileOtp } = req.body;

    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation || !['PENDING', 'INVITATION_SENT'].includes(invitation.status)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation token.' });
    }

    if (invitation.otpExpiresAt && new Date() > invitation.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'OTP verification code has expired. Please request a new invitation.' });
    }

    // Verify OTP values (allow verify if exact match or if bypass code used in testing)
    const isEmailValid = invitation.emailOtp ? (emailOtp && emailOtp.trim() === invitation.emailOtp) : true;
    const isMobileValid = invitation.mobileOtp ? (mobileOtp && mobileOtp.trim() === invitation.mobileOtp) : true;

    if (!isEmailValid || !isMobileValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Verification OTP entered. Please check Email and Mobile OTP codes.',
      });
    }

    const updated = await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        isEmailVerified: true,
        isMobileVerified: true,
      },
    });

    return res.json({
      success: true,
      message: 'OTP verification successful! You can now set your account password.',
      data: {
        isEmailVerified: updated.isEmailVerified,
        isMobileVerified: updated.isMobileVerified,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function acceptInviteSetupPassword(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { password, confirmPassword, firstName, lastName, phone } = req.body;

    if (!password || password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match or are empty.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation || !['PENDING', 'INVITATION_SENT'].includes(invitation.status)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation token.' });
    }

    // For Agent roles, enforce completion of OTP verification
    const isAgentRole = ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(invitation.role);
    if (isAgentRole && (!invitation.isEmailVerified || !invitation.isMobileVerified)) {
      return res.status(400).json({
        success: false,
        message: 'Please complete Email & Mobile OTP verification before setting up your password.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const finalFirstName = firstName || invitation.firstName || 'User';
    const finalLastName = lastName !== undefined ? lastName : (invitation.lastName || null);
    const finalPhone = phone || invitation.phone || null;

    let user = await prisma.user.findUnique({ where: { email: invitation.email } });
    if (user) {
      // Update existing user with password, agent details & active status
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          firstName: finalFirstName,
          lastName: finalLastName,
          phone: finalPhone,
          role: invitation.role, // Pre-assigned role enforced!
          serviceTypes: invitation.serviceTypes || user.serviceTypes,
          customerIdCode: invitation.customerIdCode || user.customerIdCode,
          agentIdCode: invitation.agentIdCode || user.agentIdCode,
          dob: invitation.dob || user.dob,
          education: invitation.education || user.education,
          hasExperience: invitation.hasExperience ?? user.hasExperience,
          previousCompany: invitation.previousCompany || user.previousCompany,
          previousJobRole: invitation.previousJobRole || user.previousJobRole,
          yearsOfExperience: invitation.yearsOfExperience || user.yearsOfExperience,
          previousJobStartDate: invitation.previousJobStartDate || user.previousJobStartDate,
          previousJobEndDate: invitation.previousJobEndDate || user.previousJobEndDate,
          aadhaarDocUrl: invitation.aadhaarDocUrl || user.aadhaarDocUrl,
          educationDocUrl: invitation.educationDocUrl || user.educationDocUrl,
          experienceDocUrl: invitation.experienceDocUrl || user.experienceDocUrl,
          otherDocUrl: invitation.otherDocUrl || user.otherDocUrl,
          status: 'ACTIVE',
          emailVerified: true,
        },
      });
    } else {
      // Create new user with assigned role, agent ID code & details
      let finalCustomerIdCode = invitation.customerIdCode;
      if (invitation.role === 'CUSTOMER') {
        if (!finalCustomerIdCode || (await prisma.user.findFirst({ where: { customerIdCode: finalCustomerIdCode } }))) {
          finalCustomerIdCode = await generateCustomerId();
        }
      }

      let finalAgentIdCode = invitation.agentIdCode;
      if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(invitation.role)) {
        if (!finalAgentIdCode || (await prisma.user.findFirst({ where: { agentIdCode: finalAgentIdCode } }))) {
          finalAgentIdCode = await generateAgentId();
        }
      }

      user = await prisma.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          firstName: finalFirstName,
          lastName: finalLastName,
          phone: finalPhone,
          role: invitation.role, // Pre-assigned role enforced!
          serviceTypes: invitation.serviceTypes || null,
          customerIdCode: finalCustomerIdCode || null,
          agentIdCode: finalAgentIdCode || null,
          dob: invitation.dob || null,
          education: invitation.education || null,
          hasExperience: invitation.hasExperience ?? null,
          previousCompany: invitation.previousCompany || null,
          previousJobRole: invitation.previousJobRole || null,
          yearsOfExperience: invitation.yearsOfExperience || null,
          previousJobStartDate: invitation.previousJobStartDate || null,
          previousJobEndDate: invitation.previousJobEndDate || null,
          aadhaarDocUrl: invitation.aadhaarDocUrl || null,
          educationDocUrl: invitation.educationDocUrl || null,
          experienceDocUrl: invitation.experienceDocUrl || null,
          otherDocUrl: invitation.otherDocUrl || null,
          status: 'ACTIVE',
          emailVerified: true,
        },
      });
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    emailService.sendInvitationAcceptedNotification({
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName || ''}`.trim(),
      userRole: user.role,
    }).catch((err) => console.error('Async invitation accepted email error:', err));

    const authToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'ACCEPT_INVITATION',
      entityType: 'USER',
      entityId: user.id,
      description: `User ${user.email} accepted invitation and activated role ${user.role} with ID ${user.agentIdCode || user.customerIdCode || user.id}.`,
      ipAddress: req.ip,
    });

    await notifySuperAdmins(
      'INVITATION_ACCEPTED',
      'Invitation Accepted',
      `${user.firstName} ${user.lastName || ''} accepted invitation for role ${user.role}.`,
      { module: 'USER', relatedEntityId: user.id }
    );

    return res.json({
      success: true,
      message: 'Password created successfully. Account is now active.',
      data: {
        token: authToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          customerIdCode: user.customerIdCode,
          agentIdCode: user.agentIdCode,
          serviceTypes: safeParseJsonArray(user.serviceTypes),
        },
      },
    });
  } catch (err: any) {
    console.error('acceptInviteSetupPassword error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Do not reveal email existence
      return res.json({ success: true, message: 'If account exists, password reset email has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    emailService.sendForgotPassword({
      email: user.email,
      token: resetToken,
      firstName: user.firstName,
    }).catch((err) => console.error('Async forgot password email error:', err));

    return res.json({ success: true, message: 'If account exists, password reset email has been sent.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    emailService.sendPasswordChanged({
      email: user.email,
      firstName: user.firstName,
    }).catch((err) => console.error('Async password changed email error:', err));

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'RESET_PASSWORD',
      entityType: 'USER',
      entityId: user.id,
      description: `User ${user.email} reset password successfully.`,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        serviceTypes: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    return res.json({
      success: true,
      data: {
        ...user,
        serviceTypes: safeParseJsonArray(user.serviceTypes),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    return res.json({ success: true, message: 'Profile updated successfully.', data: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
