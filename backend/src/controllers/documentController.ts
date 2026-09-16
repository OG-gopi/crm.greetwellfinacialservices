import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CONFIG } from '../config';
import { prisma } from '../utils/prisma';
import { createAuditLog } from '../services/auditService';
import { createNotification } from '../services/notificationService';
import { emailService } from '../services/emailService';
import { AuthRequest } from '../middleware/authMiddleware';

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
        fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('Notice creating upload directory:', e);
    }
    cb(null, CONFIG.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: CONFIG.MAX_FILE_SIZE },
});

export async function uploadDocument(req: AuthRequest, res: Response) {
  try {
    const file = req.file;
    const { applicationId, documentTypeId, title } = req.body;
    const user = req.user!;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded.' });
    }

    if (!applicationId) {
      return res.status(400).json({ success: false, message: 'Application ID is required.' });
    }

    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Customer can only upload to their own application
    if (user.role === 'CUSTOMER' && application.customerId !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const document = await prisma.document.create({
      data: {
        applicationId,
        documentTypeId: documentTypeId || null,
        title: title || file.originalname,
        fileName: file.filename,
        fileUrl: `/uploads/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedByUserId: user.id,
        status: 'PENDING',
      },
    });

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'UPLOAD_DOCUMENT',
      entityType: 'DOCUMENT',
      entityId: document.id,
      description: `Uploaded document ${file.originalname} for application ${applicationId}.`,
      ipAddress: req.ip,
    });

    // Notify assigned agent or admin
    if (application.assignedAgentId) {
      await createNotification({
        recipientUserId: application.assignedAgentId,
        type: 'DOCUMENT_UPLOADED',
        title: 'New Document Uploaded',
        message: `Customer uploaded ${file.originalname} for application ${applicationId}.`,
        relatedEntity: 'APPLICATION',
        relatedEntityId: applicationId,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: document,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyDocument(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // VERIFIED, REJECTED, REPLACEMENT_REQUIRED
    const user = req.user!;

    if (!['VERIFIED', 'REJECTED', 'REPLACEMENT_REQUIRED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status.' });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { application: { include: { customer: true } } },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        status,
        verifiedByUserId: user.id,
        verifiedAt: new Date(),
        rejectionReason: status !== 'VERIFIED' ? rejectionReason : null,
      },
    });

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: `VERIFY_DOCUMENT_${status}`,
      entityType: 'DOCUMENT',
      entityId: document.id,
      description: `${user.role} marked document ${document.title} as ${status}.`,
      ipAddress: req.ip,
    });

    // Notify customer
    await createNotification({
      recipientUserId: document.application.customerId,
      type: 'DOCUMENT_VERIFICATION',
      title: `Document ${status.replace('_', ' ')}`,
      message: `Your document '${document.title}' was marked as ${status.replace('_', ' ')}. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
      relatedEntity: 'APPLICATION',
      relatedEntityId: document.applicationId,
    });

    if (document.application.customer?.email) {
      const customerEmail = document.application.customer.email;
      const customerName = `${document.application.customer.firstName} ${document.application.customer.lastName || ''}`.trim();
      if (status === 'VERIFIED') {
        emailService.sendDocumentApprovedEmail({
          customerEmail,
          customerName,
          documentTitle: document.title,
          applicationId: document.applicationId,
        }).catch((err) => console.error('Async document approved email error:', err));
      } else {
        emailService.sendDocumentRejectedEmail({
          customerEmail,
          customerName,
          documentTitle: document.title,
          applicationId: document.applicationId,
          rejectionReason: rejectionReason || 'Document clarity or compliance verification failed.',
        }).catch((err) => console.error('Async document rejected email error:', err));
      }
    }

    return res.json({
      success: true,
      message: `Document status updated to ${status}.`,
      data: updatedDoc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteDocument(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user!;

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (user.role === 'CUSTOMER' && document.uploadedByUserId !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await prisma.document.delete({ where: { id } });

    // Remove local file if exists
    const filePath = path.join(CONFIG.UPLOAD_DIR, document.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({ success: true, message: 'Document deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
