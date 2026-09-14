"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentTypes = getDocumentTypes;
exports.createDocumentType = createDocumentType;
exports.getSettings = getSettings;
exports.updateSetting = updateSetting;
exports.getPermissions = getPermissions;
exports.getVerificationData = getVerificationData;
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
// --- DOCUMENT TYPES MANAGEMENT ---
async function getDocumentTypes(req, res) {
    try {
        const types = await prisma_1.prisma.documentType.findMany({ orderBy: { name: 'asc' } });
        return res.json({ success: true, data: types });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createDocumentType(req, res) {
    try {
        const { name, code, category, isRequiredDefault, description } = req.body;
        const docType = await prisma_1.prisma.documentType.create({
            data: {
                name,
                code,
                category: category || 'GENERAL',
                isRequiredDefault: Boolean(isRequiredDefault),
                description,
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'CREATE_DOCUMENT_TYPE',
            entityType: 'DOCUMENT_TYPE',
            entityId: docType.id,
            description: `Created Document Type '${name}' (${code}).`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: 'Document Type created.', data: docType });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// --- SYSTEM SETTINGS MANAGEMENT ---
async function getSettings(req, res) {
    try {
        const settings = await prisma_1.prisma.systemSetting.findMany();
        return res.json({ success: true, data: settings });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function updateSetting(req, res) {
    try {
        const { key, value } = req.body;
        const setting = await prisma_1.prisma.systemSetting.upsert({
            where: { key },
            update: { value, updatedByUserId: req.user?.id },
            create: { key, value, updatedByUserId: req.user?.id },
        });
        return res.json({ success: true, message: 'Setting updated.', data: setting });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// --- PERMISSIONS MANAGEMENT ---
async function getPermissions(req, res) {
    try {
        const permissions = await prisma_1.prisma.rolePermission.findMany();
        return res.json({ success: true, data: permissions });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// --- DATA VERIFICATION CENTER ---
async function getVerificationData(req, res) {
    try {
        const { status = 'PENDING' } = req.query; // PENDING, VERIFIED, REJECTED
        const [documents, applications] = await Promise.all([
            prisma_1.prisma.document.findMany({
                where: { status: status },
                include: {
                    application: { select: { id: true, type: true, customer: { select: { firstName: true, lastName: true } } } },
                    uploadedByUser: { select: { firstName: true, lastName: true, email: true } },
                    verifiedByUser: { select: { firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.application.findMany({
                where: { verificationStatus: status },
                include: {
                    customer: { select: { firstName: true, lastName: true, email: true } },
                    assignedAgent: { select: { firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return res.json({
            success: true,
            data: {
                documents,
                applications,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
