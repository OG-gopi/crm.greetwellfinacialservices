import { prisma } from '../utils/prisma';
import { CONFIG } from '../config';

export interface WhatsAppNotificationPayload {
  to: string; // Recipient mobile number
  recipientName?: string;
  recipientRole?: string;
  templateType: 'REGISTRATION' | 'INVITATION' | 'APP_SUBMITTED' | 'STATUS_UPDATE' | 'DOCUMENT_REQUEST' | 'CUSTOMER_REPLY';
  message: string;
  applicationId?: string;
  metadata?: Record<string, any>;
}

export class WhatsAppService {
  async sendNotification(payload: WhatsAppNotificationPayload): Promise<boolean> {
    const { to, recipientName, recipientRole = 'User', templateType, message, applicationId, metadata } = payload;

    try {
      // Clean recipient phone number
      const cleanPhone = to ? to.trim() : 'N/A';

      // 1. Structured Local Mock Log Output
      console.log(`\n==================================================`);
      console.log(`📱 WhatsApp Notification – LOCAL TEST MOCK MODE`);
      console.log(`--------------------------------------------------`);
      console.log(`Recipient: ${cleanPhone} (${recipientName || 'Valued User'})`);
      console.log(`Role:      ${recipientRole}`);
      console.log(`Template:  ${templateType}`);
      if (applicationId) console.log(`App ID:    ${applicationId}`);
      console.log(`Event:     ${metadata?.eventType || 'CRM_BUSINESS_EVENT'}`);
      console.log(`--------------------------------------------------`);
      console.log(`Message:`);
      console.log(message);
      console.log(`--------------------------------------------------`);
      console.log(`Delivery:  MOCK / NOT SENT (Local Development Mode)`);
      console.log(`==================================================\n`);

      // 2. Persist log record in DB WhatsAppLog table
      await prisma.whatsAppLog.create({
        data: {
          recipientPhone: cleanPhone,
          recipientName: recipientName || null,
          templateType,
          message,
          status: 'MOCK',
          applicationId: applicationId || null,
          metadata: metadata ? JSON.stringify({ ...metadata, mode: 'MOCK' }) : JSON.stringify({ mode: 'MOCK' }),
        },
      });

      return true;
    } catch (err: any) {
      console.error('⚠️ Failed to record WhatsAppLog in DB:', err?.message || err);
      return false;
    }
  }

  async notifyApplicationCreated(to: string, customerName: string, applicationId: string, appType: string, status: string) {
    const message = `Hello ${customerName},\nYour ${appType} application ${applicationId} has been successfully submitted to GFS Portal.\nCurrent Status: ${status}.\nTrack application: ${CONFIG.APP_URL}/login?redirect=%2Fcustomer%2Fapplications`;
    return this.sendNotification({
      to,
      recipientName: customerName,
      recipientRole: 'Customer',
      templateType: 'APP_SUBMITTED',
      message,
      applicationId,
      metadata: { appType, status, eventType: 'APPLICATION_CREATED' },
    });
  }

  async notifyStatusUpdate(to: string, recipientName: string, applicationId: string, appType: string, newStatus: string) {
    const message = `Hello ${recipientName},\nYour ${appType} application ${applicationId} status has been updated to: ${newStatus}.\nView details: ${CONFIG.APP_URL}/login?redirect=%2Fcustomer%2Fapplications`;
    return this.sendNotification({
      to,
      recipientName,
      recipientRole: 'Customer',
      templateType: 'STATUS_UPDATE',
      message,
      applicationId,
      metadata: { appType, newStatus, eventType: 'APPLICATION_STATUS_CHANGED' },
    });
  }

  async notifyDocumentRequest(to: string, customerName: string, applicationId: string, requestTitle: string, description?: string) {
    const message = `Hello ${customerName},\nAttention Required for Application ${applicationId}:\nRequest: ${requestTitle}${description ? `\nDetails: ${description}` : ''}\nPlease upload requested documents: ${CONFIG.APP_URL}/login?redirect=%2Fcustomer%2Fapplications`;
    return this.sendNotification({
      to,
      recipientName: customerName,
      recipientRole: 'Customer',
      templateType: 'DOCUMENT_REQUEST',
      message,
      applicationId,
      metadata: { requestTitle, description, eventType: 'DOCUMENT_REQUESTED' },
    });
  }

  async notifyCustomerReply(to: string, recipientName: string, applicationId: string, requestTitle: string) {
    const message = `Hello ${recipientName},\nCustomer has replied to request '${requestTitle}' on Application ${applicationId}.\nReview update: ${CONFIG.APP_URL}/login?redirect=%2Fsuperadmin%2Fapplications`;
    return this.sendNotification({
      to,
      recipientName,
      recipientRole: 'Agent/Admin',
      templateType: 'CUSTOMER_REPLY',
      message,
      applicationId,
      metadata: { requestTitle, eventType: 'DOCUMENT_UPLOADED' },
    });
  }
}

export const whatsAppService = new WhatsAppService();
