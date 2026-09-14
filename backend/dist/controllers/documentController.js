"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.uploadDocument = uploadDocument;
exports.verifyDocument = verifyDocument;
exports.deleteDocument = deleteDocument;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
const notificationService_1 = require("../services/notificationService");
// Configure Multer storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        try {
            if (!fs_1.default.existsSync(config_1.CONFIG.UPLOAD_DIR)) {
                fs_1.default.mkdirSync(config_1.CONFIG.UPLOAD_DIR, { recursive: true });
            }
        }
        catch (e) {
            console.warn('Notice creating upload directory:', e);
        }
        cb(null, config_1.CONFIG.UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `doc-${uniqueSuffix}${ext}`);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: config_1.CONFIG.MAX_FILE_SIZE },
});
async function uploadDocument(req, res) {
    try {
        const file = req.file;
        const { applicationId, documentTypeId, title } = req.body;
        const user = req.user;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No document file uploaded.' });
        }
        if (!applicationId) {
            return res.status(400).json({ success: false, message: 'Application ID is required.' });
        }
        const application = await prisma_1.prisma.application.findUnique({ where: { id: applicationId } });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }
        // Customer can only upload to their own application
        if (user.role === 'CUSTOMER' && application.customerId !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        const document = await prisma_1.prisma.document.create({
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
        await (0, auditService_1.createAuditLog)({
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
            await (0, notificationService_1.createNotification)({
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
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function verifyDocument(req, res) {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body; // VERIFIED, REJECTED, REPLACEMENT_REQUIRED
        const user = req.user;
        if (!['VERIFIED', 'REJECTED', 'REPLACEMENT_REQUIRED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid verification status.' });
        }
        const document = await prisma_1.prisma.document.findUnique({
            where: { id },
            include: { application: true },
        });
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found.' });
        }
        const updatedDoc = await prisma_1.prisma.document.update({
            where: { id },
            data: {
                status,
                verifiedByUserId: user.id,
                verifiedAt: new Date(),
                rejectionReason: status !== 'VERIFIED' ? rejectionReason : null,
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: user.id,
            userRole: user.role,
            action: `VERIFY_DOCUMENT_${status}`,
            entityType: 'DOCUMENT',
            entityId: document.id,
            description: `${user.role} marked document ${document.title} as ${status}.`,
            ipAddress: req.ip,
        });
        // Notify customer
        await (0, notificationService_1.createNotification)({
            recipientUserId: document.application.customerId,
            type: 'DOCUMENT_VERIFICATION',
            title: `Document ${status.replace('_', ' ')}`,
            message: `Your document '${document.title}' was marked as ${status.replace('_', ' ')}. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
            relatedEntity: 'APPLICATION',
            relatedEntityId: document.applicationId,
        });
        return res.json({
            success: true,
            message: `Document status updated to ${status}.`,
            data: updatedDoc,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function deleteDocument(req, res) {
    try {
        const { id } = req.params;
        const user = req.user;
        const document = await prisma_1.prisma.document.findUnique({ where: { id } });
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found.' });
        }
        if (user.role === 'CUSTOMER' && document.uploadedByUserId !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        await prisma_1.prisma.document.delete({ where: { id } });
        // Remove local file if exists
        const filePath = path_1.default.join(config_1.CONFIG.UPLOAD_DIR, document.fileName);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        return res.json({ success: true, message: 'Document deleted.' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
