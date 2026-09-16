"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNote = createNote;
exports.getNotes = getNotes;
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
const notificationService_1 = require("../services/notificationService");
const emailService_1 = require("../services/emailService");
async function createNote(req, res) {
    try {
        const { applicationId, content, isCustomerVisible = false } = req.body;
        const user = req.user;
        if (!applicationId || !content) {
            return res.status(400).json({ success: false, message: 'Application ID and note content are required.' });
        }
        const application = await prisma_1.prisma.application.findUnique({
            where: { id: applicationId },
            include: { customer: true },
        });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }
        const note = await prisma_1.prisma.note.create({
            data: {
                applicationId,
                authorUserId: user.id,
                content,
                isCustomerVisible: Boolean(isCustomerVisible),
            },
            include: {
                authorUser: { select: { firstName: true, lastName: true, role: true } },
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: user.id,
            userRole: user.role,
            action: 'ADD_NOTE',
            entityType: 'NOTE',
            entityId: note.id,
            description: `Added ${isCustomerVisible ? 'customer-visible' : 'internal'} note on application ${applicationId}.`,
            ipAddress: req.ip,
        });
        if (isCustomerVisible && user.role !== 'CUSTOMER') {
            await (0, notificationService_1.createNotification)({
                recipientUserId: application.customerId,
                type: 'NEW_NOTE',
                title: `Message on Application ${applicationId}`,
                message: `New note from ${user.firstName} ${user.lastName}: "${content.substring(0, 80)}..."`,
                relatedEntity: 'APPLICATION',
                relatedEntityId: applicationId,
            });
            if (application.customer?.email) {
                await emailService_1.emailService.sendApplicationCommentNotification({
                    recipientEmail: application.customer.email,
                    recipientName: `${application.customer.firstName} ${application.customer.lastName || ''}`.trim(),
                    applicationId: application.id,
                    authorName: `${user.firstName} ${user.lastName || ''}`.trim(),
                    commentText: content,
                }).catch((err) => console.error('Application comment email error:', err));
            }
        }
        return res.status(201).json({ success: true, message: 'Note added.', data: note });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function getNotes(req, res) {
    try {
        const { applicationId } = req.params;
        const user = req.user;
        const application = await prisma_1.prisma.application.findUnique({ where: { id: applicationId } });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }
        const where = { applicationId };
        if (user.role === 'CUSTOMER') {
            where.isCustomerVisible = true;
        }
        const notes = await prisma_1.prisma.note.findMany({
            where,
            include: {
                authorUser: { select: { firstName: true, lastName: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: notes });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
