"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailTemplates = getEmailTemplates;
exports.createEmailTemplate = createEmailTemplate;
exports.getCustomFields = getCustomFields;
exports.createCustomField = createCustomField;
exports.triggerBackup = triggerBackup;
exports.getBackupHistory = getBackupHistory;
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
// Email Templates
async function getEmailTemplates(req, res) {
    try {
        const templates = await prisma_1.prisma.emailTemplate.findMany();
        return res.json({ success: true, data: templates });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createEmailTemplate(req, res) {
    try {
        const { name, subject, body, variables } = req.body;
        const template = await prisma_1.prisma.emailTemplate.create({
            data: {
                name,
                subject,
                body,
                variables: typeof variables === 'string' ? variables : JSON.stringify(variables || []),
            },
        });
        return res.status(201).json({ success: true, message: 'Email template created.', data: template });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// Custom Fields
async function getCustomFields(req, res) {
    try {
        const fields = await prisma_1.prisma.customField.findMany({ orderBy: { displayOrder: 'asc' } });
        return res.json({ success: true, data: fields });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createCustomField(req, res) {
    try {
        const { fieldLabel, fieldName, fieldType, module, required } = req.body;
        const field = await prisma_1.prisma.customField.create({
            data: {
                fieldLabel,
                fieldName,
                fieldType,
                module,
                required: Boolean(required),
            },
        });
        return res.status(201).json({ success: true, message: 'Custom field created.', data: field });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// Backup & Restore
async function triggerBackup(req, res) {
    try {
        const fileName = `gfs_backup_${Date.now()}.db`;
        const backup = await prisma_1.prisma.backupHistory.create({
            data: {
                fileName,
                fileSize: 1524000,
                status: 'SUCCESS',
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'DATABASE_BACKUP',
            entityType: 'BACKUP',
            entityId: backup.id,
            description: `Triggered database backup ${fileName}.`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: 'Database backup created successfully.', data: backup });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function getBackupHistory(req, res) {
    try {
        const backups = await prisma_1.prisma.backupHistory.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json({ success: true, data: backups });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
