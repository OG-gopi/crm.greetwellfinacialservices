"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
class EmailService {
    transporter = null;
    constructor() {
        if (config_1.CONFIG.SMTP.HOST && config_1.CONFIG.SMTP.USER) {
            this.transporter = nodemailer_1.default.createTransport({
                host: config_1.CONFIG.SMTP.HOST,
                port: config_1.CONFIG.SMTP.PORT,
                secure: config_1.CONFIG.SMTP.PORT === 465,
                auth: {
                    user: config_1.CONFIG.SMTP.USER,
                    pass: config_1.CONFIG.SMTP.PASS,
                },
            });
        }
    }
    async sendMail(to, subject, html) {
        if (this.transporter && process.env.NODE_ENV !== 'test') {
            try {
                await this.transporter.sendMail({
                    from: config_1.CONFIG.SMTP.FROM,
                    to,
                    subject,
                    html,
                });
                console.log(`✉️ Email sent to ${to}: "${subject}"`);
                return true;
            }
            catch (err) {
                console.error(`❌ SMTP transport error sending email to ${to}:`, err);
                console.log(`📧 [DEV EMAIL SERVICE FALLBACK LOGGED] To: ${to} Subject: ${subject}`);
                return true;
            }
        }
        else {
            // Local development fallback
            console.log(`\n==================================================`);
            console.log(`📧 [DEV EMAIL SERVICE FALLBACK]`);
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Content:\n${html.replace(/<[^>]*>?/gm, '')}`);
            console.log(`==================================================\n`);
            return true;
        }
    }
    async sendAgentInvitation(options) {
        const { email, role, token, firstName, lastName, agentIdCode, emailOtp, mobileOtp } = options;
        const inviteUrl = `${config_1.CONFIG.APP_URL}/invite/${token}`;
        const roleTitle = role.replace(/_/g, ' ');
        const agentName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : 'Agent';
        const subject = `Welcome to GFS Portal – Official Agent Invitation (${agentIdCode})`;
        const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <!-- Header Brand Logo Container -->
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
          <div style="background-color: #091526; display: inline-block; padding: 12px 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <span style="color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1.5px; font-family: Arial, sans-serif;">GREETWELL</span>
            <span style="color: #10b981; font-size: 10px; font-weight: 800; display: block; tracking-wider; margin-top: 2px;">FINANCIAL SERVICES</span>
          </div>
          <p style="font-size: 11px; font-weight: 800; color: #0c5837; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
            OFFICIAL AGENT ONBOARDING PORTAL
          </p>
        </div>

        <!-- Body Content -->
        <div style="padding-top: 24px;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 16px;">
            Hello ${agentName},
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            You have been officially invited by Super Admin to join Greetwell Financial Services as a <strong>${roleTitle}</strong>.
          </p>

          <!-- Agent Details Card -->
          <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #cbd5e1; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 12px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Assigned Agent ID:</span>
              <div style="font-size: 18px; font-weight: 900; color: #0c5837; font-family: monospace; margin-top: 2px;">${agentIdCode}</div>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Designated Role:</span>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px; text-transform: uppercase;">${roleTitle}</div>
            </div>
            <!-- Email & Mobile OTP Display -->
            <div style="background-color: #f0fdf4; border: 1px dashed #16a34a; padding: 12px; border-radius: 8px; margin-top: 10px;">
              <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 4px;">Verification Security OTP Codes:</div>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; font-family: monospace;">
                Email Verification OTP: <span style="color: #059669; font-size: 18px;">${emailOtp}</span>
              </div>
              ${mobileOtp ? `
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; font-family: monospace; margin-top: 4px;">
                Mobile Verification OTP: <span style="color: #2563eb; font-size: 18px;">${mobileOtp}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            To complete your registration, click the link below, enter your OTP codes to verify your identity, and set up your secure password.
          </p>

          <!-- Button CTA -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${inviteUrl}" style="background-color: #0c5837; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(12, 88, 55, 0.3);">
              Verify OTP & Activate Agent Portal →
            </a>
          </div>

          <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">
            If the button above does not work, copy and paste this link into your browser:<br/>
            <a href="${inviteUrl}" style="color: #0c5837;">${inviteUrl}</a>
          </p>

          <p style="font-size: 11px; color: #94a3b8;">
            * Note: This invitation link is secure, single-use, and will expire in 72 hours.
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
          <p style="font-weight: 700; color: #334155; margin-bottom: 4px;">Greetwell Financial Services (GFS)</p>
          <p style="margin-bottom: 8px;">LOANS | INSURANCE | INVESTMENTS</p>
          <p style="color: #94a3b8;">&copy; ${new Date().getFullYear()} Greetwell Financial Services. All rights reserved.</p>
        </div>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendCustomerInvitation(options) {
        const { email, token, firstName, customerIdCode, serviceTypes, inviterName } = options;
        const inviteUrl = `${config_1.CONFIG.APP_URL}/invite/${token}`;
        const formattedServices = serviceTypes.join(' | ');
        const customerName = firstName ? `${firstName}` : 'Customer';
        const subject = `Welcome to GFS Portal – Complete Your Account Setup (${customerIdCode})`;
        const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <!-- Header Brand Logo Container -->
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
          <div style="background-color: #091526; display: inline-block; padding: 12px 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <span style="color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1.5px; font-family: Arial, sans-serif;">GREETWELL</span>
            <span style="color: #3b82f6; font-size: 10px; font-weight: 800; display: block; tracking-wider; margin-top: 2px;">FINANCIAL SERVICES</span>
          </div>
          <p style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
            EMPOWERING DREAMS, SECURING FUTURES
          </p>
        </div>

        <!-- Body Content -->
        <div style="padding-top: 24px;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 16px;">
            Hello ${customerName},
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            You have been officially invited to join the <strong>Greetwell Financial Services (GFS) Portal</strong> for <strong>${formattedServices}</strong>.
          </p>

          <!-- Details Card -->
          <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #cbd5e1; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Your Customer ID:</span>
              <div style="font-size: 18px; font-weight: 900; color: #1d63ed; font-family: monospace; margin-top: 2px;">${customerIdCode}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Selected Service(s):</span>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${formattedServices}</div>
            </div>
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Invited By:</span>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${inviterName}</div>
            </div>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Please verify your email address and complete your secure account password setup by clicking the button below.
          </p>

          <!-- Button CTA -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${inviteUrl}" style="background-color: #1d63ed; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(29, 99, 237, 0.3);">
              Verify Email & Set Password →
            </a>
          </div>

          <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">
            If the button above does not work, copy and paste this link into your browser:<br/>
            <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a>
          </p>

          <p style="font-size: 11px; color: #94a3b8;">
            * Note: This invitation link is secure, single-use, and will expire in 72 hours.
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
          <p style="font-weight: 700; color: #334155; margin-bottom: 4px;">Greetwell Financial Services (GFS)</p>
          <p style="margin-bottom: 8px;">LOANS | INSURANCE | INVESTMENTS</p>
          <p style="color: #94a3b8;">&copy; ${new Date().getFullYear()} Greetwell Financial Services. All rights reserved.</p>
        </div>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendSuperAdminInvitation(options) {
        const { email, token, firstName, lastName, inviterName, notes } = options;
        const inviteUrl = `${config_1.CONFIG.APP_URL}/invite/${token}`;
        const superAdminName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : 'Super Admin';
        const subject = `Welcome to GFS Portal – Super Admin Executive Invitation`;
        const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <!-- Header Brand Logo Container -->
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
          <div style="background-color: #091526; display: inline-block; padding: 12px 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <span style="color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1.5px; font-family: Arial, sans-serif;">GREETWELL</span>
            <span style="color: #38bdf8; font-size: 10px; font-weight: 800; display: block; tracking-wider; margin-top: 2px;">FINANCIAL SERVICES</span>
          </div>
          <p style="font-size: 11px; font-weight: 800; color: #0284c7; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
            EXECUTIVE SUPER ADMIN PORTAL ONBOARDING
          </p>
        </div>

        <!-- Body Content -->
        <div style="padding-top: 24px;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 16px;">
            Hello ${superAdminName},
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            You have been officially invited to join <strong>Greetwell Financial Services (GFS)</strong> as a <strong>Super Admin Executive</strong>.
          </p>

          <!-- Details Card -->
          <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #cbd5e1; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Assigned Role:</span>
              <div style="font-size: 16px; font-weight: 900; color: #0284c7; font-family: sans-serif; margin-top: 2px;">SUPER ADMIN (FULL ACCESS)</div>
            </div>
            ${inviterName ? `
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Invited By:</span>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${inviterName}</div>
            </div>
            ` : ''}
            ${notes ? `
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Note from Executive:</span>
              <div style="font-size: 13px; font-style: italic; color: #475569; margin-top: 2px;">"${notes}"</div>
            </div>
            ` : ''}
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            To set up your account password and activate your Super Admin access, please click the button below.
          </p>

          <!-- Button CTA -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${inviteUrl}" style="background-color: #0284c7; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
              Accept Invitation & Activate Super Admin Account →
            </a>
          </div>

          <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">
            If the button above does not work, copy and paste this link into your browser:<br/>
            <a href="${inviteUrl}" style="color: #0284c7;">${inviteUrl}</a>
          </p>

          <p style="font-size: 11px; color: #94a3b8;">
            * Note: This invitation link is secure, single-use, and will expire in 72 hours.
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
          <p style="font-weight: 700; color: #334155; margin-bottom: 4px;">Greetwell Financial Services (GFS)</p>
          <p style="margin-bottom: 8px;">EXECUTIVE SUPPORT DESK</p>
          <p style="color: #94a3b8;">&copy; ${new Date().getFullYear()} Greetwell Financial Services. All rights reserved.</p>
        </div>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendPasswordReset(email, token) {
        const resetUrl = `${config_1.CONFIG.APP_URL}/reset-password/${token}`;
        const subject = `Password Reset Request - Greetwell Financial Services`;
        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2>Password Reset Request</h2>
        <p>Click below to reset your portal password:</p>
        <p><a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendApplicationStatusNotification(email, appId, status) {
        const subject = `Application ${appId} Status Updated: ${status}`;
        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2>Application Update</h2>
        <p>Your application <strong>${appId}</strong> status has been updated to: <strong>${status}</strong>.</p>
        <p>Please log in to your portal dashboard for further details and required actions.</p>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendCustomerRegistrationVerification(options) {
        const { email, token, firstName, lastName, customerIdCode, serviceTypes } = options;
        const verifyUrl = `${config_1.CONFIG.APP_URL}/verify-email/${token}`;
        const formattedServices = serviceTypes.join(' | ');
        const fullName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : 'Customer';
        const subject = `Verify Your Email Address – Greetwell Financial Services (${customerIdCode})`;
        const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <!-- Header Brand Logo Container -->
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
          <div style="background-color: #091526; display: inline-block; padding: 12px 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <span style="color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1.5px; font-family: Arial, sans-serif;">GREETWELL</span>
            <span style="color: #3b82f6; font-size: 10px; font-weight: 800; display: block; tracking-wider; margin-top: 2px;">FINANCIAL SERVICES</span>
          </div>
          <p style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
            CUSTOMER ACCOUNT EMAIL VERIFICATION
          </p>
        </div>

        <!-- Body Content -->
        <div style="padding-top: 24px;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 16px;">
            Hello ${fullName},
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            Thank you for registering with <strong>Greetwell Financial Services (GFS)</strong> for <strong>${formattedServices}</strong>.
          </p>

          <!-- Details Card -->
          <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #cbd5e1; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Assigned Customer ID:</span>
              <div style="font-size: 18px; font-weight: 900; color: #1d63ed; font-family: monospace; margin-top: 2px;">${customerIdCode}</div>
            </div>
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; font-family: monospace;">Selected Service(s):</span>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${formattedServices}</div>
            </div>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Please click the button below to verify your email address and activate your GFS Customer Account.
          </p>

          <!-- Button CTA -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${verifyUrl}" style="background-color: #1d63ed; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(29, 99, 237, 0.3);">
              Verify Email Address & Activate Account →
            </a>
          </div>

          <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">
            If the button above does not work, copy and paste this link into your browser:<br/>
            <a href="${verifyUrl}" style="color: #2563eb;">${verifyUrl}</a>
          </p>

          <p style="font-size: 11px; color: #94a3b8;">
            * Note: This verification link is secure, single-use, and will expire in 72 hours.
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
          <p style="font-weight: 700; color: #334155; margin-bottom: 4px;">Greetwell Financial Services (GFS)</p>
          <p style="margin-bottom: 8px;">LOANS | INSURANCE | INVESTMENTS</p>
          <p style="color: #94a3b8;">&copy; ${new Date().getFullYear()} Greetwell Financial Services. All rights reserved.</p>
        </div>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendEnquiryCreatedNotification(options) {
        const { email, userName, enquiryId, subject: reqSubject, category, relatedApplicationId } = options;
        const portalUrl = `${config_1.CONFIG.APP_URL}/customer/enquiries`;
        const subject = `Enquiry Acknowledgement: ${enquiryId} - Greetwell Financial Services`;
        const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
          <div style="background-color: #091526; display: inline-block; padding: 12px 24px; border-radius: 12px;">
            <span style="color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1.5px;">GREETWELL</span>
            <span style="color: #3b82f6; font-size: 10px; font-weight: 800; display: block; margin-top: 2px;">FINANCIAL SERVICES</span>
          </div>
          <p style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
            ENQUIRY & COMPLAINT SUPPORT DESK
          </p>
        </div>

        <div style="padding-top: 24px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-bottom: 16px;">Hello ${userName},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            We have received your enquiry <strong>${enquiryId}</strong>. Our support team will review your ticket and respond shortly.
          </p>

          <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #cbd5e1; margin-bottom: 24px;">
            <p style="font-size: 12px; margin-bottom: 6px;"><strong>Enquiry ID:</strong> <span style="color: #2563eb; font-weight: 800;">${enquiryId}</span></p>
            <p style="font-size: 12px; margin-bottom: 6px;"><strong>Category:</strong> ${category}</p>
            <p style="font-size: 12px; margin-bottom: 6px;"><strong>Subject:</strong> ${reqSubject}</p>
            ${relatedApplicationId ? `<p style="font-size: 12px; margin-bottom: 6px;"><strong>Related Application:</strong> ${relatedApplicationId}</p>` : ''}
            <p style="font-size: 12px;"><strong>Current Status:</strong> <span style="color: #16a34a; font-weight: 800;">OPEN</span></p>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${portalUrl}" style="background-color: #091526; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; display: inline-block;">
              View Enquiry in Portal →
            </a>
          </div>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
          <p style="font-weight: 700;">Greetwell Financial Services (GFS)</p>
          <p>&copy; ${new Date().getFullYear()} Greetwell Financial Services. All rights reserved.</p>
        </div>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendEnquiryReplyNotification(options) {
        const { email, userName, enquiryId, subject: reqSubject, senderName, message, status } = options;
        const portalUrl = `${config_1.CONFIG.APP_URL}/customer/enquiries`;
        const subject = `New Response on Enquiry ${enquiryId} - Greetwell Financial Services`;
        const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
          <div style="background-color: #091526; display: inline-block; padding: 12px 24px; border-radius: 12px;">
            <span style="color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1.5px;">GREETWELL</span>
            <span style="color: #3b82f6; font-size: 10px; font-weight: 800; display: block; margin-top: 2px;">FINANCIAL SERVICES</span>
          </div>
          <p style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
            ENQUIRY UPDATE NOTIFICATION
          </p>
        </div>

        <div style="padding-top: 24px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-bottom: 16px;">Hello ${userName},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            A new response has been posted by <strong>${senderName}</strong> for enquiry <strong>${enquiryId}</strong>:
          </p>

          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="font-size: 13px; color: #1e3a8a; line-height: 1.5;">${message}</p>
          </div>

          <div style="background-color: #ffffff; border-radius: 12px; padding: 16px; border: 1px solid #cbd5e1; margin-bottom: 24px;">
            <p style="font-size: 12px; margin-bottom: 4px;"><strong>Ticket ID:</strong> ${enquiryId}</p>
            <p style="font-size: 12px; margin-bottom: 4px;"><strong>Subject:</strong> ${reqSubject}</p>
            <p style="font-size: 12px;"><strong>Current Status:</strong> ${status}</p>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${portalUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; display: inline-block;">
              View & Reply in Portal →
            </a>
          </div>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
          <p style="font-weight: 700;">Greetwell Financial Services (GFS)</p>
          <p>&copy; ${new Date().getFullYear()} Greetwell Financial Services. All rights reserved.</p>
        </div>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendEnquiryInfoRequestedNotification(options) {
        const { email, userName, enquiryId, subject: reqSubject, message } = options;
        const portalUrl = `${config_1.CONFIG.APP_URL}/customer/enquiries`;
        const subject = `Action Required: Information Requested for Enquiry ${enquiryId}`;
        const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
          <div style="background-color: #091526; display: inline-block; padding: 12px 24px; border-radius: 12px;">
            <span style="color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1.5px;">GREETWELL</span>
            <span style="color: #f59e0b; font-size: 10px; font-weight: 800; display: block; margin-top: 2px;">FINANCIAL SERVICES</span>
          </div>
          <p style="font-size: 11px; font-weight: 800; color: #b45309; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
            ACTION REQUIRED - AWAITING INFORMATION
          </p>
        </div>

        <div style="padding-top: 24px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-bottom: 16px;">Hello ${userName},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            Our support team requires additional details or documents to process your enquiry <strong>${enquiryId}</strong>:
          </p>

          <div style="background-color: #fffbebfb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="font-size: 13px; color: #78350f; line-height: 1.5;">${message}</p>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${portalUrl}" style="background-color: #d97706; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; display: inline-block;">
              Provide Information in Portal →
            </a>
          </div>
        </div>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendEnquiryResolvedNotification(options) {
        const { email, userName, enquiryId, subject: reqSubject, resolutionMessage } = options;
        const portalUrl = `${config_1.CONFIG.APP_URL}/customer/enquiries`;
        const subject = `Enquiry Resolved: ${enquiryId} - Greetwell Financial Services`;
        const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
          <div style="background-color: #091526; display: inline-block; padding: 12px 24px; border-radius: 12px;">
            <span style="color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1.5px;">GREETWELL</span>
            <span style="color: #10b981; font-size: 10px; font-weight: 800; display: block; margin-top: 2px;">FINANCIAL SERVICES</span>
          </div>
          <p style="font-size: 11px; font-weight: 800; color: #047857; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
            ENQUIRY RESOLVED
          </p>
        </div>

        <div style="padding-top: 24px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-bottom: 16px;">Hello ${userName},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            Your enquiry <strong>${enquiryId}</strong> ("${reqSubject}") has been marked as <strong>RESOLVED</strong> by Super Admin.
          </p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 4px;">Resolution Notes:</p>
            <p style="font-size: 13px; color: #14532d; line-height: 1.5;">${resolutionMessage}</p>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-bottom: 20px;">
            If your issue persists or you need further help, you can reopen this enquiry from your portal dashboard.
          </p>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${portalUrl}" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; display: inline-block;">
              View Resolved Enquiry →
            </a>
          </div>
        </div>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
    async sendEnquiryClosedNotification(options) {
        const { email, userName, enquiryId, subject: reqSubject } = options;
        const subject = `Enquiry Closed: ${enquiryId} - Greetwell Financial Services`;
        const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <h2>Enquiry Closed</h2>
        <p>Hello ${userName},</p>
        <p>Your enquiry <strong>${enquiryId}</strong> ("${reqSubject}") has been closed.</p>
        <p>Thank you for contacting Greetwell Financial Services.</p>
      </div>
    `;
        return this.sendMail(email, subject, html);
    }
}
exports.emailService = new EmailService();
