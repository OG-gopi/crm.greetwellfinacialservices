import { prisma } from '../utils/prisma';
import { emailService } from './emailService';
import { whatsAppService } from './whatsappService';
import { CONFIG } from '../config';

export type CRMEventType =
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'CUSTOMER_STATUS_CHANGED'
  | 'AGENT_CREATED'
  | 'AGENT_UPDATED'
  | 'AGENT_ASSIGNED'
  | 'AGENT_REASSIGNED'
  | 'AGENT_STATUS_CHANGED'
  | 'APPLICATION_CREATED'
  | 'APPLICATION_UPDATED'
  | 'APPLICATION_ASSIGNED'
  | 'APPLICATION_REASSIGNED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_CANCELLED'
  | 'DOCUMENT_REQUESTED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_REPLACED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_REJECTED'
  | 'ENQUIRY_CREATED'
  | 'ENQUIRY_ASSIGNED'
  | 'ENQUIRY_REPLIED'
  | 'ENQUIRY_STATUS_CHANGED'
  | 'PAYMENT_TRANSACTION_CREATED'
  | 'PAYMENT_TRANSACTION_STATUS_CHANGED';

export interface EventPayload {
  eventType: CRMEventType;
  actorUserId?: string;
  actorName?: string;
  actorRole?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  agentId?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  applicationId?: string;
  applicationType?: string; // LOAN, INSURANCE, INVESTMENT
  amount?: number;
  oldStatus?: string;
  newStatus?: string;
  documentTitle?: string;
  documentId?: string;
  rejectionReason?: string;
  enquiryId?: string;
  enquirySubject?: string;
  paymentId?: string;
  details?: string;
  metadata?: Record<string, any>;
}

export class EventNotificationService {
  /**
   * Main entry point to dispatch business events to all appropriate stakeholders.
   * Runs asynchronously without blocking core database operations.
   */
  async triggerBusinessEvent(payload: EventPayload): Promise<void> {
    try {
      console.log(`\n🔔 [BUSINESS EVENT TRIGGERED]: ${payload.eventType}`);
      if (payload.applicationId) console.log(`   Application ID: ${payload.applicationId}`);
      if (payload.customerEmail) console.log(`   Customer: ${payload.customerEmail}`);

      // 1. Always notify ALL active Super Admins
      await this.notifyAllSuperAdmins(payload);

      // 2. Notify primary customer if relevant
      if (payload.customerEmail || payload.customerId) {
        await this.notifyCustomer(payload);
      }

      // 3. Notify assigned agent if relevant
      if (payload.agentEmail || payload.agentId) {
        await this.notifyAgent(payload);
      }
    } catch (err: any) {
      console.error(`❌ EventNotificationService Error for [${payload.eventType}]:`, err?.message || err);
      // Non-blocking catch ensures CRM database action remains successful!
    }
  }

  /**
   * Notify ALL ACTIVE Super Admins in the database
   */
  private async notifyAllSuperAdmins(payload: EventPayload): Promise<void> {
    try {
      const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      });

      if (!superAdmins.length) return;

      const title = this.formatTitleForEvent(payload, 'SUPER_ADMIN');
      const message = this.formatMessageForEvent(payload, 'SUPER_ADMIN');
      const targetUrl = this.resolveDeepLink(payload, 'SUPER_ADMIN');

      for (const admin of superAdmins) {
        const adminName = admin.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Super Admin';

        // A. In-App Notification
        await prisma.notification.create({
          data: {
            recipientUserId: admin.id,
            recipientRole: 'SUPER_ADMIN',
            type: payload.eventType,
            title,
            message,
            module: payload.applicationType || 'SYSTEM',
            source: payload.actorRole || 'SYSTEM',
            customerId: payload.customerId || null,
            agentId: payload.agentId || null,
            applicationId: payload.applicationId || null,
            documentId: payload.documentId || null,
            relatedEntity: 'APPLICATION',
            relatedEntityId: payload.applicationId || payload.customerId || null,
          },
        }).catch((err) => console.error('Failed to create admin in-app notification:', err));

        // B. Email Notification
        if (admin.email) {
          await emailService.sendMail({
            to: admin.email,
            recipientName: adminName,
            subject: `[GFS Admin Alert] ${title}`,
            html: this.renderEmailHtml(title, adminName, message, targetUrl, payload),
            emailType: payload.eventType,
            emailCategory: 'SYSTEM',
            applicationId: payload.applicationId,
            actionUrl: targetUrl,
          }).catch((err) => console.error(`Failed to send email to super admin ${admin.email}:`, err));
        }

        // C. WhatsApp Mock Notification (if phone available)
        if (admin.phone) {
          await whatsAppService.sendNotification({
            to: admin.phone,
            recipientName: adminName,
            templateType: this.mapEventToWhatsAppTemplate(payload.eventType),
            message: `[GFS ADMIN NOTICE]\n${title}\n${message}\nPortal: ${targetUrl}`,
            applicationId: payload.applicationId,
            metadata: { eventType: payload.eventType, role: 'SUPER_ADMIN' },
          }).catch((err) => console.error(`Failed to dispatch WhatsApp mock to admin ${admin.phone}:`, err));
        }
      }
    } catch (err: any) {
      console.error('Error notifying Super Admins:', err?.message || err);
    }
  }

  /**
   * Notify Customer about account or application updates
   */
  private async notifyCustomer(payload: EventPayload): Promise<void> {
    try {
      let customerEmail = payload.customerEmail;
      let customerName = payload.customerName || 'Valued Customer';
      let customerPhone = payload.customerPhone;
      let customerUserId = payload.customerId;

      if (payload.customerId && (!customerEmail || !customerPhone)) {
        const cust = await prisma.user.findUnique({
          where: { id: payload.customerId },
          select: { id: true, email: true, firstName: true, lastName: true, phone: true },
        });
        if (cust) {
          customerUserId = cust.id;
          customerEmail = customerEmail || cust.email;
          customerName = `${cust.firstName} ${cust.lastName || ''}`.trim();
          customerPhone = customerPhone || cust.phone || undefined;
        }
      }

      const title = this.formatTitleForEvent(payload, 'CUSTOMER');
      const message = this.formatMessageForEvent(payload, 'CUSTOMER');
      const targetUrl = this.resolveDeepLink(payload, 'CUSTOMER');

      // A. In-App Notification
      if (customerUserId) {
        await prisma.notification.create({
          data: {
            recipientUserId: customerUserId,
            recipientRole: 'CUSTOMER',
            type: payload.eventType,
            title,
            message,
            module: payload.applicationType || 'GENERAL',
            source: payload.actorRole || 'SYSTEM',
            applicationId: payload.applicationId || null,
            documentId: payload.documentId || null,
          },
        }).catch((err) => console.error('Failed to create customer in-app notification:', err));
      }

      // B. Email
      if (customerEmail) {
        await emailService.sendMail({
          to: customerEmail,
          recipientName: customerName,
          subject: `${title} - Greetwell Financial Services`,
          html: this.renderEmailHtml(title, customerName, message, targetUrl, payload),
          emailType: payload.eventType,
          emailCategory: 'APPLICATION',
          applicationId: payload.applicationId,
          actionUrl: targetUrl,
        }).catch((err) => console.error(`Failed to send email to customer ${customerEmail}:`, err));
      }

      // C. WhatsApp Mock
      if (customerPhone) {
        await whatsAppService.sendNotification({
          to: customerPhone,
          recipientName: customerName,
          templateType: this.mapEventToWhatsAppTemplate(payload.eventType),
          message: `Hello ${customerName},\n${message}\nView details: ${targetUrl}\nRegards,\nGreetwell Financial Services`,
          applicationId: payload.applicationId,
          metadata: { eventType: payload.eventType, role: 'CUSTOMER' },
        }).catch((err) => console.error(`Failed WhatsApp dispatch to customer ${customerPhone}:`, err));
      }
    } catch (err: any) {
      console.error('Error notifying Customer:', err?.message || err);
    }
  }

  /**
   * Notify Agent / Advisor about assignments, uploads, or task updates
   */
  private async notifyAgent(payload: EventPayload): Promise<void> {
    try {
      let agentEmail = payload.agentEmail;
      let agentName = payload.agentName || 'Advisor';
      let agentPhone = payload.agentPhone;
      let agentUserId = payload.agentId;

      if (payload.agentId && (!agentEmail || !agentPhone)) {
        const agt = await prisma.user.findUnique({
          where: { id: payload.agentId },
          select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true },
        });
        if (agt) {
          agentUserId = agt.id;
          agentEmail = agentEmail || agt.email;
          agentName = `${agt.firstName} ${agt.lastName || ''}`.trim();
          agentPhone = agentPhone || agt.phone || undefined;
        }
      }

      const title = this.formatTitleForEvent(payload, 'AGENT');
      const message = this.formatMessageForEvent(payload, 'AGENT');
      const targetUrl = this.resolveDeepLink(payload, 'AGENT');

      // A. In-App Notification
      if (agentUserId) {
        await prisma.notification.create({
          data: {
            recipientUserId: agentUserId,
            recipientRole: 'AGENT',
            type: payload.eventType,
            title,
            message,
            module: payload.applicationType || 'GENERAL',
            source: payload.actorRole || 'SYSTEM',
            applicationId: payload.applicationId || null,
            documentId: payload.documentId || null,
          },
        }).catch((err) => console.error('Failed to create agent in-app notification:', err));
      }

      // B. Email
      if (agentEmail) {
        await emailService.sendMail({
          to: agentEmail,
          recipientName: agentName,
          subject: `[Agent Alert] ${title} - GFS`,
          html: this.renderEmailHtml(title, agentName, message, targetUrl, payload),
          emailType: payload.eventType,
          emailCategory: 'APPLICATION',
          applicationId: payload.applicationId,
          actionUrl: targetUrl,
        }).catch((err) => console.error(`Failed to send email to agent ${agentEmail}:`, err));
      }

      // C. WhatsApp Mock
      if (agentPhone) {
        await whatsAppService.sendNotification({
          to: agentPhone,
          recipientName: agentName,
          templateType: this.mapEventToWhatsAppTemplate(payload.eventType),
          message: `Hello ${agentName},\n${message}\nOpen Desk: ${targetUrl}`,
          applicationId: payload.applicationId,
          metadata: { eventType: payload.eventType, role: 'AGENT' },
        }).catch((err) => console.error(`Failed WhatsApp dispatch to agent ${agentPhone}:`, err));
      }
    } catch (err: any) {
      console.error('Error notifying Agent:', err?.message || err);
    }
  }

  // =========================================================================
  // HELPER FORMATTERS & LINK RESOLVERS
  // =========================================================================

  private formatTitleForEvent(payload: EventPayload, targetRole: 'SUPER_ADMIN' | 'CUSTOMER' | 'AGENT'): string {
    const appType = payload.applicationType || 'Application';
    const appId = payload.applicationId || '';

    switch (payload.eventType) {
      case 'CUSTOMER_CREATED':
        return targetRole === 'SUPER_ADMIN' ? `New Customer Profile Created: ${payload.customerName}` : 'Welcome to Greetwell Financial Services';
      case 'AGENT_CREATED':
      case 'AGENT_ASSIGNED':
        return targetRole === 'AGENT' ? `New Customer Assignment (${payload.customerName})` : `Advisor Assigned to Application ${appId}`;
      case 'APPLICATION_CREATED':
        return targetRole === 'CUSTOMER' ? `Application Submitted (${appId})` : `New ${appType} Application Submitted (${appId})`;
      case 'APPLICATION_STATUS_CHANGED':
        return `Status Change: ${appType} ${appId} -> ${payload.newStatus}`;
      case 'APPLICATION_APPROVED':
        return `Application Approved! (${appId})`;
      case 'APPLICATION_REJECTED':
        return `Application Status Update (${appId})`;
      case 'DOCUMENT_REQUESTED':
        return `Document Action Required (${appId})`;
      case 'DOCUMENT_UPLOADED':
        return `Document Uploaded for ${appId}`;
      case 'DOCUMENT_VERIFIED':
        return `Document Verified (${payload.documentTitle || 'File'})`;
      case 'DOCUMENT_REJECTED':
        return `Document Rejection Notice (${payload.documentTitle || 'File'})`;
      case 'ENQUIRY_CREATED':
        return `New Support Ticket: ${payload.enquirySubject || 'Enquiry'}`;
      case 'ENQUIRY_REPLIED':
        return `Reply Received on Ticket ${payload.enquiryId || ''}`;
      default:
        return `Update on ${appType} ${appId}`.trim();
    }
  }

  private formatMessageForEvent(payload: EventPayload, targetRole: 'SUPER_ADMIN' | 'CUSTOMER' | 'AGENT'): string {
    const appId = payload.applicationId ? `[${payload.applicationId}]` : '';
    const appType = payload.applicationType || 'Service';

    switch (payload.eventType) {
      case 'APPLICATION_CREATED':
        return targetRole === 'CUSTOMER'
          ? `Your ${appType} application ${appId} has been successfully submitted and is under initial review.`
          : `Customer ${payload.customerName || ''} submitted a new ${appType} application ${appId}.`;
      case 'APPLICATION_STATUS_CHANGED':
        return `Application ${appId} status transitioned from ${payload.oldStatus || 'Previous'} to ${payload.newStatus}.`;
      case 'APPLICATION_APPROVED':
        return `Great news! Your ${appType} application ${appId} has been officially APPROVED by Greetwell Financial Services.`;
      case 'APPLICATION_REJECTED':
        return `Your ${appType} application ${appId} was reviewed and updated to REJECTED.${payload.rejectionReason ? ` Reason: ${payload.rejectionReason}` : ''}`;
      case 'APPLICATION_ASSIGNED':
        return `Application ${appId} was assigned to Advisor ${payload.agentName || 'Agent'}.`;
      case 'DOCUMENT_REQUESTED':
        return `Attention required for ${appId}: Please upload requested document '${payload.documentTitle || 'Required Doc'}'.`;
      case 'DOCUMENT_UPLOADED':
        return `A new document '${payload.documentTitle || 'Document'}' was uploaded for ${appId}.`;
      case 'DOCUMENT_VERIFIED':
        return `Document '${payload.documentTitle || 'File'}' for application ${appId} has been VERIFIED.`;
      case 'DOCUMENT_REJECTED':
        return `Document '${payload.documentTitle || 'File'}' for application ${appId} was REJECTED.${payload.rejectionReason ? ` Reason: ${payload.rejectionReason}` : ''}`;
      case 'ENQUIRY_CREATED':
        return `New support enquiry '${payload.enquirySubject || ''}' was raised by ${payload.customerName || 'User'}.`;
      case 'ENQUIRY_REPLIED':
        return `A new reply was posted on support ticket '${payload.enquirySubject || ''}'.`;
      default:
        return payload.details || `An event occurred for application ${appId}.`;
    }
  }

  private resolveDeepLink(payload: EventPayload, targetRole: 'SUPER_ADMIN' | 'CUSTOMER' | 'AGENT'): string {
    let relativePath = '/dashboard';

    if (targetRole === 'SUPER_ADMIN') {
      if (payload.applicationId) relativePath = `/superadmin/applications?id=${payload.applicationId}`;
      else if (payload.enquiryId) relativePath = `/superadmin/enquiries?id=${payload.enquiryId}`;
      else if (payload.customerId) relativePath = `/superadmin/customers`;
      else relativePath = `/superadmin/dashboard`;
    } else if (targetRole === 'AGENT') {
      if (payload.applicationId) relativePath = `/agent/applications?id=${payload.applicationId}`;
      else relativePath = `/agent/dashboard`;
    } else {
      // CUSTOMER
      if (payload.applicationId) relativePath = `/customer/applications?id=${payload.applicationId}`;
      else relativePath = `/customer/dashboard`;
    }

    // Unified Deep Link: Login with redirect query param
    return `${CONFIG.APP_URL}/login?redirect=${encodeURIComponent(relativePath)}`;
  }

  private mapEventToWhatsAppTemplate(eventType: CRMEventType): 'REGISTRATION' | 'INVITATION' | 'APP_SUBMITTED' | 'STATUS_UPDATE' | 'DOCUMENT_REQUEST' | 'CUSTOMER_REPLY' {
    switch (eventType) {
      case 'CUSTOMER_CREATED':
        return 'REGISTRATION';
      case 'AGENT_CREATED':
      case 'AGENT_ASSIGNED':
        return 'INVITATION';
      case 'APPLICATION_CREATED':
        return 'APP_SUBMITTED';
      case 'DOCUMENT_REQUESTED':
      case 'DOCUMENT_REJECTED':
        return 'DOCUMENT_REQUEST';
      case 'ENQUIRY_REPLIED':
      case 'DOCUMENT_UPLOADED':
        return 'CUSTOMER_REPLY';
      default:
        return 'STATUS_UPDATE';
    }
  }

  private renderEmailHtml(title: string, recipientName: string, message: string, actionUrl: string, payload: EventPayload): string {
    const details: { label: string; value: string; color?: string }[] = [];

    if (payload.applicationId) details.push({ label: 'Application ID', value: payload.applicationId, color: '#1d63ed' });
    if (payload.applicationType) details.push({ label: 'Service Type', value: payload.applicationType });
    if (payload.newStatus) details.push({ label: 'Current Status', value: payload.newStatus, color: '#0c5837' });
    if (payload.documentTitle) details.push({ label: 'Document', value: payload.documentTitle });
    if (payload.rejectionReason) details.push({ label: 'Rejection Reason', value: payload.rejectionReason, color: '#dc2626' });

    return emailService['renderBrandTemplate']({
      titleHeader: title.toUpperCase(),
      recipientName,
      mainParagraphs: [message],
      detailsCard: details.length > 0 ? details : undefined,
      ctaButton: { label: 'Open GFS Portal →', url: actionUrl },
    });
  }
}

export const eventNotificationService = new EventNotificationService();
