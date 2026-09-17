import nodemailer from 'nodemailer';
import { CONFIG } from '../config';
import { prisma } from '../utils/prisma';

export interface SendEmailOptions {
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
  emailType: string;
  emailCategory?: 'TRANSACTIONAL' | 'AUTH' | 'APPLICATION' | 'DOCUMENT' | 'ENQUIRY' | 'SYSTEM';
  relatedEntity?: string;
  relatedEntityId?: string;
  applicationId?: string;
  actionUrl?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (CONFIG.SMTP.USER) {
      try {
        const isSecure = CONFIG.SMTP.PORT === 465;
        this.transporter = nodemailer.createTransport({
          host: CONFIG.SMTP.HOST || 'smtp.gmail.com',
          port: CONFIG.SMTP.PORT || 465,
          secure: isSecure,
          auth: {
            user: CONFIG.SMTP.USER,
            pass: CONFIG.SMTP.PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        console.log(`✉️ Gmail SMTP Transporter initialized for ${CONFIG.SMTP.USER}`);
      } catch (err) {
        console.error('❌ Failed to initialize Gmail SMTP transporter:', err);
      }
    }
  }

  private getTransporter(): nodemailer.Transporter | null {
    const user = process.env.GMAIL_USER || process.env.SMTP_USER || CONFIG.SMTP.USER || 'greetwell.notify@gmail.com';
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || CONFIG.SMTP.PASS || '';
    const host = process.env.SMTP_HOST || CONFIG.SMTP.HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || String(CONFIG.SMTP.PORT || 465), 10);
    const isSecure = port === 465;

    if (user && pass) {
      try {
        return nodemailer.createTransport({
          host,
          port,
          secure: isSecure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });
      } catch (err) {
        console.error('❌ Failed to create SMTP transporter:', err);
      }
    }
    return this.transporter;
  }

  /**
   * Primary transactional email dispatcher with automated Database Logging (`EmailDeliveryLog`).
   * Returns boolean status and handles errors cleanly.
   */
  async sendMail(options: SendEmailOptions): Promise<boolean> {
    const {
      to,
      recipientName,
      subject,
      html,
      emailType,
      emailCategory = 'TRANSACTIONAL',
      relatedEntity,
      relatedEntityId,
      applicationId,
      actionUrl,
    } = options;

    if (!to || !to.trim()) {
      console.warn('⚠️ sendMail invoked with empty recipient email address.');
      return false;
    }

    const cleanTo = to.trim().toLowerCase();
    const senderEmail = CONFIG.SMTP.USER || 'greetwell.notify@gmail.com';

    // 1. Create PENDING delivery log record in DB
    let logRecord: any = null;
    try {
      logRecord = await prisma.emailDeliveryLog.create({
        data: {
          recipientEmail: cleanTo,
          recipientName: recipientName || null,
          senderEmail,
          subject,
          emailType,
          emailCategory,
          relatedEntity: relatedEntity || null,
          relatedEntityId: relatedEntityId || null,
          applicationId: applicationId || null,
          actionUrl: actionUrl || null,
          status: 'PENDING',
        },
      });
    } catch (dbErr: any) {
      console.error('⚠️ Could not record initial EmailDeliveryLog in DB:', dbErr?.message || dbErr);
    }

    // 2. Dispatch email via Nodemailer or Log Fallback in Development
    let isSuccess = false;
    let failureReason: string | null = null;
    const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || CONFIG.SMTP.PASS;
    const activeTransporter = this.getTransporter();

    if (!smtpPass && process.env.NODE_ENV === 'production') {
      failureReason = 'Gmail App Password is not set (GMAIL_APP_PASSWORD / SMTP_PASSWORD environment variable is missing in Vercel settings).';
      console.warn(`⚠️ [SMTP CONFIG WARNING] ${failureReason}`);
    } else if (activeTransporter && process.env.NODE_ENV !== 'test') {
      try {
        await activeTransporter.sendMail({
          from: CONFIG.SMTP.FROM,
          to: cleanTo,
          subject,
          html,
        });
        isSuccess = true;
        console.log(`✉️ [SENT via Gmail SMTP] To: ${cleanTo} | Subject: "${subject}" | Type: ${emailType}`);
      } catch (err: any) {
        failureReason = err?.message || String(err);
        console.error(`❌ [SMTP ERROR] To: ${cleanTo} | Subject: "${subject}" | Error:`, failureReason);
      }
    } else {
      // Local development console fallback log
      console.log(`\n==================================================`);
      console.log(`📧 [DEV GMAIL SMTP FALLBACK DISPATCH]`);
      console.log(`To: ${cleanTo} (${recipientName || 'User'})`);
      console.log(`Subject: ${subject}`);
      console.log(`Type: ${emailType} | Category: ${emailCategory}`);
      if (applicationId) console.log(`Application ID: ${applicationId}`);
      if (actionUrl) console.log(`CTA Action URL: ${actionUrl}`);
      console.log(`==================================================\n`);
      isSuccess = true;
    }

    // 3. Update EmailDeliveryLog in Database
    if (logRecord) {
      try {
        await prisma.emailDeliveryLog.update({
          where: { id: logRecord.id },
          data: {
            status: isSuccess ? 'SENT' : 'FAILED',
            failedReason: failureReason,
            sentAt: new Date(),
          },
        });
      } catch (logUpdateErr: any) {
        console.error('⚠️ Could not update EmailDeliveryLog record status:', logUpdateErr?.message || logUpdateErr);
      }
    }

    return isSuccess;
  }

  /**
   * Retry sending a previously failed email record from EmailDeliveryLog
   */
  async retryFailedEmail(logId: string): Promise<{ success: boolean; message: string }> {
    try {
      const log = await prisma.emailDeliveryLog.findUnique({
        where: { id: logId },
      });

      if (!log) {
        return { success: false, message: 'Email delivery log record not found.' };
      }

      if (!this.transporter) {
        return { success: false, message: 'Gmail SMTP transporter is not configured on server.' };
      }

      try {
        await this.transporter.sendMail({
          from: CONFIG.SMTP.FROM,
          to: log.recipientEmail,
          subject: log.subject,
          html: this.renderGenericBody(log.subject, `This is a retried notification email regarding your portal account.`, log.actionUrl || `${CONFIG.APP_URL}/login`),
        });

        await prisma.emailDeliveryLog.update({
          where: { id: logId },
          data: {
            status: 'RETRIED',
            retryCount: { increment: 1 },
            failedReason: null,
            sentAt: new Date(),
          },
        });

        return { success: true, message: `Email successfully re-sent to ${log.recipientEmail}` };
      } catch (err: any) {
        await prisma.emailDeliveryLog.update({
          where: { id: logId },
          data: {
            retryCount: { increment: 1 },
            failedReason: `Retry failed: ${err?.message || String(err)}`,
          },
        });
        return { success: false, message: `SMTP Retry Error: ${err?.message || String(err)}` };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) };
    }
  }

  // =========================================================================
  // BRANDED HTML EMAIL TEMPLATE GENERATOR
  // =========================================================================

  private renderBrandTemplate(options: {
    titleHeader: string;
    recipientName: string;
    mainParagraphs: string[];
    detailsCard?: { label: string; value: string; color?: string }[];
    alertBox?: { text: string; type?: 'info' | 'success' | 'warning' | 'error' };
    ctaButton?: { label: string; url: string; color?: string };
    footerText?: string;
  }): string {
    const { titleHeader, recipientName, mainParagraphs, detailsCard, alertBox, ctaButton, footerText } = options;

    const alertBg = alertBox?.type === 'error' ? '#fef2f2' : alertBox?.type === 'warning' ? '#fffbebfb' : alertBox?.type === 'success' ? '#f0fdf4' : '#eff6ff';
    const alertBorder = alertBox?.type === 'error' ? '#f87171' : alertBox?.type === 'warning' ? '#f59e0b' : alertBox?.type === 'success' ? '#16a34a' : '#2563eb';
    const alertTextColor = alertBox?.type === 'error' ? '#991b1b' : alertBox?.type === 'warning' ? '#78350f' : alertBox?.type === 'success' ? '#166534' : '#1e3a8a';

    const btnBg = ctaButton?.color || '#1d63ed';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Greetwell Financial Services</title>
      </head>
      <body style="margin: 0; padding: 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 10px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                
                <!-- BRAND HEADER -->
                <tr>
                  <td style="background-color: #0b1320; padding: 12px 16px; text-align: center; border-bottom: 2px solid #C99A3E;">
                    <img src="${CONFIG.FRONTEND_URL}/logo.png" alt="Greetwell Financial Services" style="max-height: 48px; width: auto; display: block; margin: 0 auto;" />
                    <div style="color: #94a3b8; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; margin-top: 4px; text-transform: uppercase;">
                      LOANS &nbsp;•&nbsp; INSURANCE &nbsp;•&nbsp; INVESTMENTS
                    </div>
                    <div style="color: #E8C877; font-size: 10.5px; font-weight: 700; letter-spacing: 1px; margin-top: 4px; text-transform: uppercase;">
                      ${titleHeader}
                    </div>
                  </td>
                </tr>

                <!-- BODY CONTENT -->
                <tr>
                  <td style="padding: 14px 20px; background-color: #ffffff;">
                    <h2 style="color: #0f172a; font-size: 15px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">
                      Hello ${recipientName},
                    </h2>

                    ${mainParagraphs.map(p => `<p style="font-size: 12.5px; line-height: 1.45; color: #334155; margin: 4px 0 8px 0;">${p}</p>`).join('')}

                    ${detailsCard && detailsCard.length > 0 ? `
                      <div style="background-color: #f8fafc; border-radius: 6px; padding: 8px 12px; border: 1px solid #e2e8f0; margin: 8px 0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          ${detailsCard.map((item, idx) => `
                            <tr>
                              <td style="padding: 3px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; font-family: monospace; width: 40%; ${idx < detailsCard.length - 1 ? 'border-bottom: 1px solid #f1f5f9;' : ''}">
                                ${item.label}:
                              </td>
                              <td style="padding: 3px 0; font-size: 12px; font-weight: 700; color: ${item.color || '#0f172a'}; ${idx < detailsCard.length - 1 ? 'border-bottom: 1px solid #f1f5f9;' : ''}">
                                ${item.value}
                              </td>
                            </tr>
                          `).join('')}
                        </table>
                      </div>
                    ` : ''}

                    ${alertBox ? `
                      <div style="background-color: ${alertBg}; border-left: 3px solid ${alertBorder}; padding: 8px 12px; border-radius: 6px; margin: 8px 0;">
                        <p style="font-size: 12px; color: ${alertTextColor}; margin: 0; line-height: 1.45; font-weight: 600;">
                          ${alertBox.text}
                        </p>
                      </div>
                    ` : ''}

                    ${ctaButton ? `
                      <div style="text-align: center; margin: 12px 0 4px 0;">
                        <a href="${ctaButton.url}" style="background-color: ${btnBg}; color: #ffffff; padding: 10px 24px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 6px; display: inline-block;">
                          ${ctaButton.label}
                        </a>
                      </div>
                      <p style="font-size: 11px; color: #94a3b8; line-height: 1.4; text-align: center; margin: 6px 0 0 0;">
                        If the button above does not work, copy and paste this link into your browser:<br/>
                        <a href="${ctaButton.url}" style="color: #1d63ed; word-break: break-all;">${ctaButton.url}</a>
                      </p>
                    ` : ''}
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 8px 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #64748b;">
                    <p style="font-weight: 700; color: #0f172a; margin: 0 0 2px 0;">Greetwell Financial Services (GFS)</p>
                    <p style="margin: 0 0 4px 0; color: #64748b;">Loans • Insurance • Investment Services</p>
                    ${footerText ? `<p style="margin: 2px 0; color: #475569; font-weight: 600;">${footerText}</p>` : ''}
                    <p style="margin: 2px 0 0 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} Greetwell Financial Services</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private renderGenericBody(title: string, message: string, url: string): string {
    return this.renderBrandTemplate({
      titleHeader: title,
      recipientName: 'Valued Customer',
      mainParagraphs: [message],
      ctaButton: { label: 'Go to Portal →', url },
    });
  }

  // =========================================================================
  // 6. AUTHENTICATION EMAILS
  // =========================================================================

  async sendCustomerRegistrationVerification(options: {
    email: string;
    token: string;
    firstName: string;
    lastName?: string;
    customerIdCode: string;
    serviceTypes: string[];
    otp?: string;
  }): Promise<boolean> {
    const { email, token, firstName, lastName, customerIdCode, serviceTypes, otp } = options;
    const verifyUrl = `${CONFIG.APP_URL}/verify-email/${token}`;
    const formattedServices = serviceTypes.join(' | ');
    const customerName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : 'Valued Customer';

    const subject = `Verify Your Email Address – Greetwell Financial Services (${customerIdCode})`;
    const html = this.renderBrandTemplate({
      titleHeader: 'ACCOUNT EMAIL VERIFICATION',
      recipientName: customerName,
      mainParagraphs: [
        `Thank you for registering your account with <strong>Greetwell Financial Services (GFS)</strong> for <strong>${formattedServices}</strong>.`,
        `Please click the button below or enter your verification code to verify your email address and activate your portal access.`,
      ],
      detailsCard: [
        { label: 'Assigned Customer ID', value: customerIdCode, color: '#1d63ed' },
        { label: 'Registered Email', value: email },
        { label: 'Selected Services', value: formattedServices },
      ],
      alertBox: otp ? { text: `Your Email Security Verification Code (OTP) is: <strong style="font-size: 18px; font-family: monospace;">${otp}</strong> (Valid for 15 minutes).`, type: 'info' } : undefined,
      ctaButton: { label: 'Verify Email & Activate Account →', url: verifyUrl },
    });

    return this.sendMail({
      to: email,
      recipientName: customerName,
      subject,
      html,
      emailType: 'CUSTOMER_REGISTRATION_VERIFICATION',
      emailCategory: 'AUTH',
      relatedEntity: 'USER',
      actionUrl: verifyUrl,
    });
  }

  async sendAgentRegistrationVerification(options: {
    email: string;
    token: string;
    firstName: string;
    lastName?: string;
    agentIdCode: string;
    serviceRole: string;
    otp?: string;
  }): Promise<boolean> {
    const { email, token, firstName, lastName, agentIdCode, serviceRole, otp } = options;
    const verifyUrl = `${CONFIG.APP_URL}/invite/${token}`;
    const agentName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : 'Agent';
    const roleTitle = serviceRole.replace(/_/g, ' ');

    const subject = `Agent Portal Email Verification (${agentIdCode}) - GFS`;
    const html = `
      ${this.renderBrandTemplate({
        titleHeader: 'AGENT EMAIL VERIFICATION',
        recipientName: agentName,
        mainParagraphs: [
          `Welcome to Greetwell Financial Services as an official <strong>${roleTitle}</strong>.`,
          `Please verify your registered email address to complete agent verification and log in.`,
        ],
        detailsCard: [
          { label: 'Assigned Agent ID', value: agentIdCode, color: '#0c5837' },
          { label: 'Designated Role', value: roleTitle },
          { label: 'Agent Email', value: email },
        ],
        alertBox: otp ? { text: `Your Verification Security OTP: <strong style="font-size: 18px; font-family: monospace;">${otp}</strong>`, type: 'info' } : undefined,
        ctaButton: { label: 'Verify Agent Account →', url: verifyUrl },
      })}
    `;

    return this.sendMail({
      to: email,
      recipientName: agentName,
      subject,
      html,
      emailType: 'AGENT_REGISTRATION_VERIFICATION',
      emailCategory: 'AUTH',
      relatedEntity: 'USER',
      actionUrl: verifyUrl,
    });
  }

  async sendForgotPassword(options: {
    email: string;
    token: string;
    firstName?: string;
    otp?: string;
  }): Promise<boolean> {
    const { email, token, firstName, otp } = options;
    const resetUrl = `${CONFIG.APP_URL}/forgot-password?token=${token}`;
    const recipientName = firstName || 'Valued User';

    const subject = `Password Reset Request - Greetwell Financial Services`;
    const html = this.renderBrandTemplate({
      titleHeader: 'SECURE PASSWORD RESET',
      recipientName,
      mainParagraphs: [
        `We received a request to reset the password for your Greetwell Financial Services account.`,
        `Click the button below to set a new password. This link is secure and will expire in 2 hours.`,
      ],
      alertBox: {
        text: otp
          ? `Your Password Reset Security OTP is: <strong style="font-size: 18px; font-family: monospace;">${otp}</strong>`
          : `SECURITY WARNING: If you did not request a password reset, please ignore this email or contact support immediately. Your account password remains unchanged.`,
        type: 'warning',
      },
      ctaButton: { label: 'Reset My Password Now →', url: resetUrl, color: '#dc2626' },
    });

    return this.sendMail({
      to: email,
      recipientName,
      subject,
      html,
      emailType: 'FORGOT_PASSWORD',
      emailCategory: 'AUTH',
      relatedEntity: 'USER',
      actionUrl: resetUrl,
    });
  }

  async sendPasswordChanged(options: {
    email: string;
    firstName?: string;
    timestamp?: Date;
  }): Promise<boolean> {
    const { email, firstName, timestamp = new Date() } = options;
    const recipientName = firstName || 'Valued User';
    const formattedDate = timestamp.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const subject = `Security Alert: Your Password Was Changed - GFS`;
    const html = this.renderBrandTemplate({
      titleHeader: 'PASSWORD CHANGED CONFIRMATION',
      recipientName,
      mainParagraphs: [
        `This email confirms that the password for your Greetwell Financial Services account was successfully changed on <strong>${formattedDate}</strong>.`,
      ],
      alertBox: {
        text: `CRITICAL SECURITY NOTICE: If you did NOT initiate this password change, please contact GFS Support immediately at support@greetwellfinancialservices.com to secure your account.`,
        type: 'error',
      },
      ctaButton: { label: 'Log In to Portal →', url: `${CONFIG.APP_URL}/login` },
    });

    return this.sendMail({
      to: email,
      recipientName,
      subject,
      html,
      emailType: 'PASSWORD_CHANGED',
      emailCategory: 'AUTH',
      relatedEntity: 'USER',
      actionUrl: `${CONFIG.APP_URL}/login`,
    });
  }

  // =========================================================================
  // 7. INVITATION EMAILS
  // =========================================================================

  async sendCustomerInvitation(options: {
    email: string;
    token: string;
    firstName?: string;
    lastName?: string;
    customerIdCode: string;
    serviceTypes: string[];
    inviterName: string;
  }): Promise<boolean> {
    const { email, token, firstName, customerIdCode, serviceTypes, inviterName } = options;
    const inviteUrl = `${CONFIG.APP_URL}/invite/${token}`;
    const formattedServices = serviceTypes.join(' | ');
    const customerName = firstName ? `${firstName}` : 'Customer';

    const subject = `Official Invitation to Join GFS Portal (${customerIdCode})`;
    const html = this.renderBrandTemplate({
      titleHeader: 'CUSTOMER PORTAL INVITATION',
      recipientName: customerName,
      mainParagraphs: [
        `You have been officially invited by <strong>${inviterName}</strong> to join <strong>Greetwell Financial Services (GFS)</strong> for <strong>${formattedServices}</strong>.`,
        `Please accept your invitation and set up your secure password to access your customer dashboard.`,
      ],
      detailsCard: [
        { label: 'Assigned Customer ID', value: customerIdCode, color: '#1d63ed' },
        { label: 'Selected Services', value: formattedServices },
        { label: 'Invited By', value: inviterName },
      ],
      ctaButton: { label: 'Accept Invitation & Set Password →', url: inviteUrl },
    });

    return this.sendMail({
      to: email,
      recipientName: customerName,
      subject,
      html,
      emailType: 'CUSTOMER_INVITATION',
      emailCategory: 'TRANSACTIONAL',
      relatedEntity: 'INVITATION',
      actionUrl: inviteUrl,
    });
  }

  async sendAgentInvitation(options: {
    email: string;
    role: string;
    token: string;
    firstName: string;
    lastName?: string;
    agentIdCode: string;
    emailOtp: string;
    mobileOtp?: string;
  }): Promise<boolean> {
    const { email, role, token, firstName, lastName, agentIdCode, emailOtp, mobileOtp } = options;
    const inviteUrl = `${CONFIG.APP_URL}/invite/${token}`;
    const roleTitle = role.replace(/_/g, ' ');
    const agentName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : 'Agent';

    const subject = `Welcome to GFS – Official Agent Invitation (${agentIdCode})`;
    const html = this.renderBrandTemplate({
      titleHeader: 'AGENT ONBOARDING INVITATION',
      recipientName: agentName,
      mainParagraphs: [
        `You have been officially invited by Super Admin to join Greetwell Financial Services as a <strong>${roleTitle}</strong>.`,
        `To activate your agent workspace, click the button below and enter your verification OTP code.`,
      ],
      detailsCard: [
        { label: 'Assigned Agent ID', value: agentIdCode, color: '#0c5837' },
        { label: 'Designated Role', value: roleTitle },
        { label: 'Email Security OTP', value: emailOtp, color: '#16a34a' },
      ],
      alertBox: mobileOtp ? { text: `Mobile Verification OTP: <strong style="font-size: 16px; font-family: monospace;">${mobileOtp}</strong>`, type: 'info' } : undefined,
      ctaButton: { label: 'Verify OTP & Activate Agent Account →', url: inviteUrl, color: '#0c5837' },
    });

    return this.sendMail({
      to: email,
      recipientName: agentName,
      subject,
      html,
      emailType: 'AGENT_INVITATION',
      emailCategory: 'TRANSACTIONAL',
      relatedEntity: 'INVITATION',
      actionUrl: inviteUrl,
    });
  }

  async sendSuperAdminInvitation(options: {
    email: string;
    token: string;
    firstName: string;
    lastName?: string;
    inviterName?: string;
    notes?: string;
  }): Promise<boolean> {
    const { email, token, firstName, lastName, inviterName, notes } = options;
    const inviteUrl = `${CONFIG.APP_URL}/invite/${token}`;
    const superAdminName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : 'Super Admin';

    const subject = `GFS Super Admin Executive Invitation`;
    const html = this.renderBrandTemplate({
      titleHeader: 'SUPER ADMIN EXECUTIVE INVITATION',
      recipientName: superAdminName,
      mainParagraphs: [
        `You have been officially invited to join <strong>Greetwell Financial Services (GFS)</strong> as a <strong>Super Admin Executive</strong>.`,
        `Please set up your account password to activate your executive access.`,
      ],
      detailsCard: [
        { label: 'Executive Role', value: 'SUPER ADMIN (FULL ACCESS)', color: '#0284c7' },
        { label: 'Invited By', value: inviterName || 'Executive Admin' },
      ],
      alertBox: notes ? { text: `Note: "${notes}"`, type: 'info' } : undefined,
      ctaButton: { label: 'Accept & Activate Super Admin Account →', url: inviteUrl, color: '#0284c7' },
    });

    return this.sendMail({
      to: email,
      recipientName: superAdminName,
      subject,
      html,
      emailType: 'SUPER_ADMIN_INVITATION',
      emailCategory: 'TRANSACTIONAL',
      relatedEntity: 'INVITATION',
      actionUrl: inviteUrl,
    });
  }

  async sendInvitationAcceptedNotification(options: {
    userEmail: string;
    userName: string;
    userRole: string;
    inviterEmail?: string;
    inviterName?: string;
  }): Promise<boolean> {
    const { userEmail, userName, userRole, inviterEmail, inviterName } = options;
    const roleTitle = userRole.replace(/_/g, ' ');

    // 1. Send welcome notice to the user who accepted
    const userSubject = `Account Activated - Welcome to Greetwell Financial Services`;
    const userHtml = this.renderBrandTemplate({
      titleHeader: 'ACCOUNT ACTIVATED SUCCESSFULLY',
      recipientName: userName,
      mainParagraphs: [
        `Your invitation has been successfully accepted, and your <strong>${roleTitle}</strong> account is now active.`,
        `You can log into your portal dashboard to access all services and features.`,
      ],
      ctaButton: { label: 'Log In to Portal →', url: `${CONFIG.APP_URL}/login` },
    });

    await this.sendMail({
      to: userEmail,
      recipientName: userName,
      subject: userSubject,
      html: userHtml,
      emailType: 'INVITATION_ACCEPTED_USER',
      emailCategory: 'AUTH',
      actionUrl: `${CONFIG.APP_URL}/login`,
    });

    // 2. Send notice to inviter if available
    if (inviterEmail && inviterEmail.trim()) {
      const inviterSubject = `Invitation Accepted: ${userName} (${roleTitle})`;
      const inviterHtml = this.renderBrandTemplate({
        titleHeader: 'INVITATION ACCEPTED NOTIFICATION',
        recipientName: inviterName || 'Admin',
        mainParagraphs: [
          `<strong>${userName}</strong> (${userEmail}) has accepted your invitation and activated their <strong>${roleTitle}</strong> account.`,
        ],
        ctaButton: { label: 'View Users in Admin Portal →', url: `${CONFIG.APP_URL}/superadmin/users` },
      });

      await this.sendMail({
        to: inviterEmail,
        recipientName: inviterName || 'Admin',
        subject: inviterSubject,
        html: inviterHtml,
        emailType: 'INVITATION_ACCEPTED_INVITER',
        emailCategory: 'TRANSACTIONAL',
        actionUrl: `${CONFIG.APP_URL}/superadmin/users`,
      });
    }

    return true;
  }

  // =========================================================================
  // 8. CUSTOMER & AGENT ASSIGNMENT EMAILS
  // =========================================================================

  async sendAgentAssignedNotification(options: {
    customerEmail: string;
    customerName: string;
    agentEmail: string;
    agentName: string;
    serviceType: string;
    assignedBy: string;
  }): Promise<boolean> {
    const { customerEmail, customerName, agentEmail, agentName, serviceType, assignedBy } = options;

    // Notice to Customer
    const custSubject = `New Advisor Assigned to Your Account - GFS ${serviceType}`;
    const custHtml = this.renderBrandTemplate({
      titleHeader: 'ADVISOR ASSIGNED',
      recipientName: customerName,
      mainParagraphs: [
        `A dedicated GFS <strong>${serviceType} Advisor</strong> has been assigned to assist you.`,
        `Your assigned advisor is <strong>${agentName}</strong> (${agentEmail}). They will guide you through your requirements and applications.`,
      ],
      detailsCard: [
        { label: 'Assigned Advisor', value: agentName, color: '#1d63ed' },
        { label: 'Advisor Contact', value: agentEmail },
        { label: 'Service Domain', value: serviceType },
      ],
      ctaButton: { label: 'View Customer Dashboard →', url: `${CONFIG.APP_URL}/customer/dashboard` },
    });

    await this.sendMail({
      to: customerEmail,
      recipientName: customerName,
      subject: custSubject,
      html: custHtml,
      emailType: 'AGENT_ASSIGNED_CUSTOMER',
      emailCategory: 'TRANSACTIONAL',
      actionUrl: `${CONFIG.APP_URL}/customer/dashboard`,
    });

    // Notice to Agent
    const agentSubject = `New Customer Assignment: ${customerName} (${serviceType})`;
    const agentHtml = this.renderBrandTemplate({
      titleHeader: 'NEW CUSTOMER ASSIGNMENT',
      recipientName: agentName,
      mainParagraphs: [
        `You have been assigned as the primary <strong>${serviceType} Advisor</strong> for customer <strong>${customerName}</strong> by ${assignedBy}.`,
      ],
      detailsCard: [
        { label: 'Customer Name', value: customerName, color: '#0c5837' },
        { label: 'Customer Email', value: customerEmail },
        { label: 'Service Domain', value: serviceType },
      ],
      ctaButton: { label: 'View Customer Profile →', url: `${CONFIG.APP_URL}/agent/customers` },
    });

    await this.sendMail({
      to: agentEmail,
      recipientName: agentName,
      subject: agentSubject,
      html: agentHtml,
      emailType: 'AGENT_ASSIGNED_AGENT',
      emailCategory: 'TRANSACTIONAL',
      actionUrl: `${CONFIG.APP_URL}/agent/customers`,
    });

    return true;
  }

  async sendCustomerReassignedNotification(options: {
    customerEmail: string;
    customerName: string;
    newAgentEmail: string;
    newAgentName: string;
    prevAgentEmail?: string;
    serviceType: string;
  }): Promise<boolean> {
    const { customerEmail, customerName, newAgentEmail, newAgentName, prevAgentEmail, serviceType } = options;

    const subject = `Update: Reassigned Advisor for Your GFS ${serviceType} Services`;
    const html = this.renderBrandTemplate({
      titleHeader: 'ADVISOR REASSIGNMENT NOTICE',
      recipientName: customerName,
      mainParagraphs: [
        `Your dedicated GFS <strong>${serviceType} Advisor</strong> has been updated.`,
        `Your new primary advisor is <strong>${newAgentName}</strong> (${newAgentEmail}).`,
      ],
      detailsCard: [
        { label: 'New Advisor Name', value: newAgentName, color: '#1d63ed' },
        { label: 'New Advisor Email', value: newAgentEmail },
        { label: 'Service Domain', value: serviceType },
      ],
      ctaButton: { label: 'Go to Customer Portal →', url: `${CONFIG.APP_URL}/customer/dashboard` },
    });

    return this.sendMail({
      to: customerEmail,
      recipientName: customerName,
      subject,
      html,
      emailType: 'CUSTOMER_REASSIGNED',
      emailCategory: 'TRANSACTIONAL',
      actionUrl: `${CONFIG.APP_URL}/customer/dashboard`,
    });
  }

  // =========================================================================
  // 9. APPLICATION EMAILS
  // =========================================================================

  async sendApplicationCreatedNotification(options: {
    customerEmail: string;
    customerName: string;
    applicationId: string;
    type: string;
    amount?: number;
    agentEmail?: string;
    agentName?: string;
  }): Promise<boolean> {
    const { customerEmail, customerName, applicationId, type, amount, agentEmail, agentName } = options;
    const viewUrl = `${CONFIG.APP_URL}/customer/applications`;

    const subject = `Application ${applicationId} Successfully Created - GFS ${type}`;
    const html = this.renderBrandTemplate({
      titleHeader: `APPLICATION CREATED (${applicationId})`,
      recipientName: customerName,
      mainParagraphs: [
        `Your new <strong>${type} Application</strong> (ID: <strong>${applicationId}</strong>) has been successfully created in the GFS Portal.`,
        `Our team and assigned advisors will review your submission and notify you of any required documents or updates.`,
      ],
      detailsCard: [
        { label: 'Application Reference ID', value: applicationId, color: '#1d63ed' },
        { label: 'Application Type', value: type },
        { label: 'Requested Amount', value: amount ? `₹${amount.toLocaleString('en-IN')}` : 'N/A' },
        { label: 'Current Status', value: 'SUBMITTED', color: '#16a34a' },
      ],
      ctaButton: { label: 'View Application Details →', url: viewUrl },
    });

    await this.sendMail({
      to: customerEmail,
      recipientName: customerName,
      subject,
      html,
      emailType: 'APPLICATION_CREATED_CUSTOMER',
      emailCategory: 'APPLICATION',
      relatedEntity: 'APPLICATION',
      relatedEntityId: applicationId,
      applicationId,
      actionUrl: viewUrl,
    });

    // Notify agent if assigned
    if (agentEmail && agentEmail.trim()) {
      const agentSubject = `New Application Assigned: ${applicationId} (${customerName})`;
      const agentHtml = this.renderBrandTemplate({
        titleHeader: 'NEW APPLICATION ASSIGNMENT',
        recipientName: agentName || 'Agent',
        mainParagraphs: [
          `A new <strong>${type} Application</strong> (ID: <strong>${applicationId}</strong>) for customer <strong>${customerName}</strong> has been assigned to your workspace.`,
        ],
        detailsCard: [
          { label: 'Application ID', value: applicationId, color: '#0c5837' },
          { label: 'Customer Name', value: customerName },
          { label: 'Service Type', value: type },
          { label: 'Requested Amount', value: amount ? `₹${amount.toLocaleString('en-IN')}` : 'N/A' },
        ],
        ctaButton: { label: 'Review Application in Agent Desk →', url: `${CONFIG.APP_URL}/loan-agent/applications` },
      });

      await this.sendMail({
        to: agentEmail,
        recipientName: agentName,
        subject: agentSubject,
        html: agentHtml,
        emailType: 'APPLICATION_CREATED_AGENT',
        emailCategory: 'APPLICATION',
        relatedEntity: 'APPLICATION',
        relatedEntityId: applicationId,
        applicationId,
        actionUrl: `${CONFIG.APP_URL}/loan-agent/applications`,
      });
    }

    return true;
  }

  async sendApplicationStatusUpdatedEmail(options: {
    recipientEmail: string;
    recipientName: string;
    applicationId: string;
    type: string;
    previousStatus: string;
    newStatus: string;
    updatedBy: string;
    comments?: string;
    isCustomer?: boolean;
  }): Promise<boolean> {
    const {
      recipientEmail,
      recipientName,
      applicationId,
      type,
      previousStatus,
      newStatus,
      updatedBy,
      comments,
      isCustomer = true,
    } = options;

    const actionUrl = isCustomer
      ? `${CONFIG.APP_URL}/customer/applications`
      : `${CONFIG.APP_URL}/superadmin/applications/all`;

    const formattedPrev = previousStatus.replace(/_/g, ' ');
    const formattedNew = newStatus.replace(/_/g, ' ');

    let statusColor = '#2563eb';
    if (['APPROVED', 'COMPLETED', 'VERIFIED'].includes(newStatus)) statusColor = '#16a34a';
    if (['REJECTED', 'CANCELLED'].includes(newStatus)) statusColor = '#dc2626';
    if (['INFORMATION_REQUIRED', 'DOCUMENTS_REQUIRED'].includes(newStatus)) statusColor = '#d97706';

    const subject = `Application ${applicationId} Status Changed to ${formattedNew} - GFS`;
    const html = this.renderBrandTemplate({
      titleHeader: 'APPLICATION STATUS UPDATE',
      recipientName,
      mainParagraphs: [
        `The status of <strong>${type} Application (${applicationId})</strong> has been updated.`,
      ],
      detailsCard: [
        { label: 'Application ID', value: applicationId, color: '#1d63ed' },
        { label: 'Previous Status', value: formattedPrev },
        { label: 'New Current Status', value: formattedNew, color: statusColor },
        { label: 'Updated By', value: updatedBy },
      ],
      alertBox: comments ? { text: `Remarks / Notes: "${comments}"`, type: 'info' } : undefined,
      ctaButton: { label: 'View Application Status →', url: actionUrl },
    });

    return this.sendMail({
      to: recipientEmail,
      recipientName,
      subject,
      html,
      emailType: 'APPLICATION_STATUS_UPDATED',
      emailCategory: 'APPLICATION',
      relatedEntity: 'APPLICATION',
      relatedEntityId: applicationId,
      applicationId,
      actionUrl,
    });
  }

  async sendApplicationApprovedEmail(options: {
    recipientEmail: string;
    recipientName: string;
    applicationId: string;
    type: string;
    amount?: number;
    remarks?: string;
  }): Promise<boolean> {
    const { recipientEmail, recipientName, applicationId, type, amount, remarks } = options;
    const viewUrl = `${CONFIG.APP_URL}/customer/applications`;

    const subject = `Congratulations! Application ${applicationId} Has Been Approved 🎉`;
    const html = this.renderBrandTemplate({
      titleHeader: 'APPLICATION APPROVED',
      recipientName,
      mainParagraphs: [
        `We are pleased to inform you that your <strong>${type} Application (ID: ${applicationId})</strong> has been formally <strong>APPROVED</strong> by Greetwell Financial Services.`,
        `Our team will reach out regarding final agreement execution and disbursement/issuance schedules.`,
      ],
      detailsCard: [
        { label: 'Application ID', value: applicationId, color: '#16a34a' },
        { label: 'Sanctioned Amount', value: amount ? `₹${amount.toLocaleString('en-IN')}` : 'N/A', color: '#16a34a' },
        { label: 'Final Decision', value: 'APPROVED', color: '#16a34a' },
      ],
      alertBox: remarks ? { text: `Approval Notes: "${remarks}"`, type: 'success' } : { text: `Please ensure all remaining original physical documents are kept ready for verification.`, type: 'success' },
      ctaButton: { label: 'View Sanction Details in Portal →', url: viewUrl, color: '#16a34a' },
    });

    return this.sendMail({
      to: recipientEmail,
      recipientName,
      subject,
      html,
      emailType: 'APPLICATION_APPROVED',
      emailCategory: 'APPLICATION',
      relatedEntity: 'APPLICATION',
      relatedEntityId: applicationId,
      applicationId,
      actionUrl: viewUrl,
    });
  }

  async sendApplicationRejectedEmail(options: {
    recipientEmail: string;
    recipientName: string;
    applicationId: string;
    type: string;
    rejectionReason: string;
  }): Promise<boolean> {
    const { recipientEmail, recipientName, applicationId, type, rejectionReason } = options;
    const viewUrl = `${CONFIG.APP_URL}/customer/applications`;

    const subject = `Update regarding Application ${applicationId} - GFS`;
    const html = this.renderBrandTemplate({
      titleHeader: 'APPLICATION DECISION UPDATE',
      recipientName,
      mainParagraphs: [
        `Thank you for applying with Greetwell Financial Services for your <strong>${type} Application (${applicationId})</strong>.`,
        `After thorough verification of submitted records, we regret to inform you that we are unable to approve this application at this time.`,
      ],
      detailsCard: [
        { label: 'Application ID', value: applicationId, color: '#dc2626' },
        { label: 'Status', value: 'REJECTED', color: '#dc2626' },
      ],
      alertBox: { text: `Rejection Reason: "${rejectionReason || 'Did not fulfill current eligibility criteria.'}"`, type: 'error' },
      ctaButton: { label: 'View Details in Portal →', url: viewUrl, color: '#0f172a' },
    });

    return this.sendMail({
      to: recipientEmail,
      recipientName,
      subject,
      html,
      emailType: 'APPLICATION_REJECTED',
      emailCategory: 'APPLICATION',
      relatedEntity: 'APPLICATION',
      relatedEntityId: applicationId,
      applicationId,
      actionUrl: viewUrl,
    });
  }

  async sendApplicationCommentNotification(options: {
    recipientEmail: string;
    recipientName: string;
    applicationId: string;
    authorName: string;
    commentText: string;
    isCustomer?: boolean;
  }): Promise<boolean> {
    const { recipientEmail, recipientName, applicationId, authorName, commentText, isCustomer = true } = options;
    const actionUrl = isCustomer ? `${CONFIG.APP_URL}/customer/applications` : `${CONFIG.APP_URL}/loan-agent/applications`;

    const subject = `New Note / Comment Added on Application ${applicationId}`;
    const html = this.renderBrandTemplate({
      titleHeader: 'APPLICATION COMMENT NOTIFICATION',
      recipientName,
      mainParagraphs: [
        `<strong>${authorName}</strong> posted a new comment regarding Application <strong>${applicationId}</strong>:`,
      ],
      alertBox: { text: `"${commentText}"`, type: 'info' },
      ctaButton: { label: 'View Application Notes →', url: actionUrl },
    });

    return this.sendMail({
      to: recipientEmail,
      recipientName,
      subject,
      html,
      emailType: 'APPLICATION_COMMENT_ADDED',
      emailCategory: 'APPLICATION',
      relatedEntity: 'APPLICATION',
      relatedEntityId: applicationId,
      applicationId,
      actionUrl,
    });
  }

  // =========================================================================
  // 10. DOCUMENT EMAIL NOTIFICATIONS
  // =========================================================================

  async sendDocumentRequestedEmail(options: {
    customerEmail: string;
    customerName: string;
    applicationId: string;
    requestedDocumentNames: string[];
    reason?: string;
    dueDate?: Date;
  }): Promise<boolean> {
    const { customerEmail, customerName, applicationId, requestedDocumentNames, reason, dueDate } = options;
    const uploadUrl = `${CONFIG.APP_URL}/customer/documents`;
    const docListStr = requestedDocumentNames.join(', ');
    const formattedDueDate = dueDate ? dueDate.toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'As soon as possible';

    const subject = `Action Required: Documents Requested for Application ${applicationId}`;
    const html = this.renderBrandTemplate({
      titleHeader: 'ACTION REQUIRED - UPLOAD DOCUMENTS',
      recipientName: customerName,
      mainParagraphs: [
        `Your advisor / administrator requires additional document proofs to process your <strong>Application (${applicationId})</strong>.`,
      ],
      detailsCard: [
        { label: 'Application ID', value: applicationId, color: '#1d63ed' },
        { label: 'Requested Document(s)', value: docListStr, color: '#d97706' },
        { label: 'Requested Due Date', value: formattedDueDate },
      ],
      alertBox: reason ? { text: `Reason / Instruction: "${reason}"`, type: 'warning' } : undefined,
      ctaButton: { label: 'Upload Requested Documents Now →', url: uploadUrl, color: '#d97706' },
    });

    return this.sendMail({
      to: customerEmail,
      recipientName: customerName,
      subject,
      html,
      emailType: 'DOCUMENT_REQUESTED',
      emailCategory: 'DOCUMENT',
      relatedEntity: 'APPLICATION',
      relatedEntityId: applicationId,
      applicationId,
      actionUrl: uploadUrl,
    });
  }

  async sendDocumentUploadedNotification(options: {
    recipientEmail: string;
    recipientName: string;
    customerName: string;
    applicationId: string;
    documentTitle: string;
    fileName: string;
  }): Promise<boolean> {
    const { recipientEmail, recipientName, customerName, applicationId, documentTitle, fileName } = options;
    const reviewUrl = `${CONFIG.APP_URL}/superadmin/documents`;

    const subject = `New Document Uploaded by ${customerName} (${applicationId})`;
    const html = this.renderBrandTemplate({
      titleHeader: 'NEW DOCUMENT UPLOADED',
      recipientName,
      mainParagraphs: [
        `Customer <strong>${customerName}</strong> uploaded a new document proof for Application <strong>${applicationId}</strong>.`,
      ],
      detailsCard: [
        { label: 'Application ID', value: applicationId, color: '#1d63ed' },
        { label: 'Customer Name', value: customerName },
        { label: 'Document Title', value: documentTitle },
        { label: 'File Name', value: fileName },
      ],
      ctaButton: { label: 'Review Uploaded Documents →', url: reviewUrl },
    });

    return this.sendMail({
      to: recipientEmail,
      recipientName,
      subject,
      html,
      emailType: 'DOCUMENT_UPLOADED',
      emailCategory: 'DOCUMENT',
      relatedEntity: 'DOCUMENT',
      applicationId,
      actionUrl: reviewUrl,
    });
  }

  async sendDocumentApprovedEmail(options: {
    customerEmail: string;
    customerName: string;
    applicationId: string;
    documentTitle: string;
  }): Promise<boolean> {
    const { customerEmail, customerName, applicationId, documentTitle } = options;
    const viewUrl = `${CONFIG.APP_URL}/customer/documents`;

    const subject = `Document Verified: ${documentTitle} (${applicationId})`;
    const html = this.renderBrandTemplate({
      titleHeader: 'DOCUMENT VERIFIED SUCCESSFULLY',
      recipientName: customerName,
      mainParagraphs: [
        `Your document <strong>"${documentTitle}"</strong> submitted for Application <strong>${applicationId}</strong> has been successfully verified and approved.`,
      ],
      detailsCard: [
        { label: 'Document Title', value: documentTitle, color: '#16a34a' },
        { label: 'Application ID', value: applicationId },
        { label: 'Verification Status', value: 'VERIFIED', color: '#16a34a' },
      ],
      ctaButton: { label: 'View Document Center →', url: viewUrl, color: '#16a34a' },
    });

    return this.sendMail({
      to: customerEmail,
      recipientName: customerName,
      subject,
      html,
      emailType: 'DOCUMENT_APPROVED',
      emailCategory: 'DOCUMENT',
      relatedEntity: 'DOCUMENT',
      applicationId,
      actionUrl: viewUrl,
    });
  }

  async sendDocumentRejectedEmail(options: {
    customerEmail: string;
    customerName: string;
    applicationId: string;
    documentTitle: string;
    rejectionReason: string;
  }): Promise<boolean> {
    const { customerEmail, customerName, applicationId, documentTitle, rejectionReason } = options;
    const uploadUrl = `${CONFIG.APP_URL}/customer/documents`;

    const subject = `Action Required: Document "${documentTitle}" Rejected - GFS`;
    const html = this.renderBrandTemplate({
      titleHeader: 'DOCUMENT REJECTED - RE-UPLOAD REQUIRED',
      recipientName: customerName,
      mainParagraphs: [
        `Your document <strong>"${documentTitle}"</strong> submitted for Application <strong>${applicationId}</strong> was rejected during verification.`,
        `Please upload a clear, valid replacement document to avoid processing delays.`,
      ],
      detailsCard: [
        { label: 'Document Title', value: documentTitle, color: '#dc2626' },
        { label: 'Application ID', value: applicationId },
        { label: 'Verification Status', value: 'REJECTED', color: '#dc2626' },
      ],
      alertBox: { text: `Rejection Reason: "${rejectionReason || 'Document unreadable or invalid.'}"`, type: 'error' },
      ctaButton: { label: 'Re-upload Document Now →', url: uploadUrl, color: '#dc2626' },
    });

    return this.sendMail({
      to: customerEmail,
      recipientName: customerName,
      subject,
      html,
      emailType: 'DOCUMENT_REJECTED',
      emailCategory: 'DOCUMENT',
      relatedEntity: 'DOCUMENT',
      applicationId,
      actionUrl: uploadUrl,
    });
  }

  // =========================================================================
  // 11. ENQUIRY & SUPPORT NOTIFICATIONS
  // =========================================================================

  async sendEnquiryCreatedNotification(options: {
    email: string;
    userName: string;
    enquiryId: string;
    subject: string;
    category: string;
    relatedApplicationId?: string;
  }): Promise<boolean> {
    const { email, userName, enquiryId, subject: reqSubject, category, relatedApplicationId } = options;
    const portalUrl = `${CONFIG.APP_URL}/customer/enquiries`;

    const subject = `Enquiry Acknowledgement: ${enquiryId} - GFS`;
    const html = this.renderBrandTemplate({
      titleHeader: 'ENQUIRY TICKET ACKNOWLEDGEMENT',
      recipientName: userName,
      mainParagraphs: [
        `We have received your enquiry ticket <strong>${enquiryId}</strong>. Our support team will review your ticket and respond shortly.`,
      ],
      detailsCard: [
        { label: 'Ticket Reference ID', value: enquiryId, color: '#1d63ed' },
        { label: 'Category', value: category },
        { label: 'Subject', value: reqSubject },
        ...(relatedApplicationId ? [{ label: 'Related Application', value: relatedApplicationId }] : []),
        { label: 'Ticket Status', value: 'OPEN', color: '#16a34a' },
      ],
      ctaButton: { label: 'View Enquiry in Portal →', url: portalUrl },
    });

    return this.sendMail({
      to: email,
      recipientName: userName,
      subject,
      html,
      emailType: 'ENQUIRY_CREATED',
      emailCategory: 'ENQUIRY',
      relatedEntity: 'ENQUIRY',
      relatedEntityId: enquiryId,
      actionUrl: portalUrl,
    });
  }

  async sendEnquiryReplyNotification(options: {
    email: string;
    userName: string;
    enquiryId: string;
    subject: string;
    senderName: string;
    message: string;
    status: string;
  }): Promise<boolean> {
    const { email, userName, enquiryId, subject: reqSubject, senderName, message, status } = options;
    const portalUrl = `${CONFIG.APP_URL}/customer/enquiries`;

    const subject = `New Response on Enquiry ${enquiryId} - GFS`;
    const html = this.renderBrandTemplate({
      titleHeader: 'NEW RESPONSE ON ENQUIRY TICKET',
      recipientName: userName,
      mainParagraphs: [
        `A new response has been posted by <strong>${senderName}</strong> for enquiry <strong>${enquiryId}</strong>:`,
      ],
      alertBox: { text: `"${message}"`, type: 'info' },
      detailsCard: [
        { label: 'Ticket ID', value: enquiryId },
        { label: 'Subject', value: reqSubject },
        { label: 'Current Status', value: status, color: '#16a34a' },
      ],
      ctaButton: { label: 'View & Reply in Portal →', url: portalUrl },
    });

    return this.sendMail({
      to: email,
      recipientName: userName,
      subject,
      html,
      emailType: 'ENQUIRY_REPLY',
      emailCategory: 'ENQUIRY',
      relatedEntity: 'ENQUIRY',
      relatedEntityId: enquiryId,
      actionUrl: portalUrl,
    });
  }

  async sendEnquiryInfoRequestedNotification(options: {
    email: string;
    userName: string;
    enquiryId: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const { email, userName, enquiryId, subject: reqSubject, message } = options;
    const portalUrl = `${CONFIG.APP_URL}/customer/enquiries`;

    const subject = `Action Required: Additional Info Needed for Enquiry ${enquiryId}`;
    const html = this.renderBrandTemplate({
      titleHeader: 'ACTION REQUIRED - AWAITING INFORMATION',
      recipientName: userName,
      mainParagraphs: [
        `Our support team requires additional details or attachments to process your enquiry <strong>${enquiryId}</strong>:`,
      ],
      alertBox: { text: `Message from Support: "${message}"`, type: 'warning' },
      ctaButton: { label: 'Provide Information in Portal →', url: portalUrl, color: '#d97706' },
    });

    return this.sendMail({
      to: email,
      recipientName: userName,
      subject,
      html,
      emailType: 'ENQUIRY_INFO_REQUESTED',
      emailCategory: 'ENQUIRY',
      relatedEntity: 'ENQUIRY',
      relatedEntityId: enquiryId,
      actionUrl: portalUrl,
    });
  }

  async sendEnquiryResolvedNotification(options: {
    email: string;
    userName: string;
    enquiryId: string;
    subject: string;
    resolutionMessage: string;
  }): Promise<boolean> {
    const { email, userName, enquiryId, subject: reqSubject, resolutionMessage } = options;
    const portalUrl = `${CONFIG.APP_URL}/customer/enquiries`;

    const subject = `Enquiry Ticket ${enquiryId} Resolved - GFS`;
    const html = this.renderBrandTemplate({
      titleHeader: 'ENQUIRY TICKET RESOLVED',
      recipientName: userName,
      mainParagraphs: [
        `Your enquiry ticket <strong>${enquiryId}</strong> ("${reqSubject}") has been marked as <strong>RESOLVED</strong>.`,
      ],
      alertBox: { text: `Resolution Summary: "${resolutionMessage || 'Issue has been addressed by support team.'}"`, type: 'success' },
      ctaButton: { label: 'View Resolved Ticket →', url: portalUrl, color: '#16a34a' },
    });

    return this.sendMail({
      to: email,
      recipientName: userName,
      subject,
      html,
      emailType: 'ENQUIRY_RESOLVED',
      emailCategory: 'ENQUIRY',
      relatedEntity: 'ENQUIRY',
      relatedEntityId: enquiryId,
      actionUrl: portalUrl,
    });
  }

  async sendEnquiryClosedNotification(options: {
    email: string;
    userName: string;
    enquiryId: string;
    subject: string;
  }): Promise<boolean> {
    const { email, userName, enquiryId, subject: reqSubject } = options;
    const subject = `Enquiry Ticket ${enquiryId} Closed - GFS`;
    const html = this.renderBrandTemplate({
      titleHeader: 'ENQUIRY TICKET CLOSED',
      recipientName: userName,
      mainParagraphs: [
        `Your enquiry ticket <strong>${enquiryId}</strong> ("${reqSubject}") has been closed.`,
        `Thank you for reaching out to Greetwell Financial Services.`,
      ],
      ctaButton: { label: 'Go to Support Portal →', url: `${CONFIG.APP_URL}/customer/enquiries` },
    });

    return this.sendMail({
      to: email,
      recipientName: userName,
      subject,
      html,
      emailType: 'ENQUIRY_CLOSED',
      emailCategory: 'ENQUIRY',
      relatedEntity: 'ENQUIRY',
      relatedEntityId: enquiryId,
      actionUrl: `${CONFIG.APP_URL}/customer/enquiries`,
    });
  }

  // =========================================================================
  // 12. ADMIN ALERTS
  // =========================================================================

  async sendAdminAlert(options: {
    adminEmail: string;
    title: string;
    description: string;
    entityType: string;
    entityId: string;
    actionUrl?: string;
  }): Promise<boolean> {
    const { adminEmail, title, description, entityType, entityId, actionUrl } = options;
    const targetUrl = actionUrl || `${CONFIG.APP_URL}/superadmin/dashboard`;

    const subject = `[Admin Alert] ${title} (${entityId})`;
    const html = this.renderBrandTemplate({
      titleHeader: 'SUPER ADMIN SYSTEM ALERT',
      recipientName: 'Super Admin Executive',
      mainParagraphs: [description],
      detailsCard: [
        { label: 'Event Type', value: entityType, color: '#1d63ed' },
        { label: 'Entity Reference', value: entityId },
      ],
      ctaButton: { label: 'Open Admin Workspace →', url: targetUrl },
    });

    return this.sendMail({
      to: adminEmail,
      recipientName: 'Super Admin',
      subject,
      html,
      emailType: 'ADMIN_SYSTEM_ALERT',
      emailCategory: 'SYSTEM',
      relatedEntity: entityType,
      relatedEntityId: entityId,
      actionUrl: targetUrl,
    });
  }
}

export const emailService = new EmailService();
