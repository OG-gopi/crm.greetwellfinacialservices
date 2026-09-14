"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleaseNotes = getReleaseNotes;
exports.createReleaseNote = createReleaseNote;
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
async function getReleaseNotes(req, res) {
    try {
        const userRole = req.user?.role || 'GUEST';
        const where = { status: 'PUBLISHED' };
        // Role-based update visibility rule (Section 17.2 Requirement)
        if (userRole !== 'SUPER_ADMIN') {
            where.visibility = { in: ['ALL_USERS', 'AGENTS_AND_CUSTOMERS'] };
        }
        const releaseNotes = await prisma_1.prisma.releaseNote.findMany({
            where,
            orderBy: { releaseDate: 'desc' },
        });
        const versionSetting = await prisma_1.prisma.systemSetting.findUnique({ where: { key: 'VERSION' } });
        const currentVersion = versionSetting ? versionSetting.value : '1.0.0';
        return res.json({
            success: true,
            data: {
                currentVersion,
                releaseNotes,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createReleaseNote(req, res) {
    try {
        const { version, title, description, updateType = 'NEW_FEATURE', visibility = 'ALL_USERS' } = req.body;
        const user = req.user;
        if (!version || !title || !description) {
            return res.status(400).json({ success: false, message: 'Version, Title, and Description are required.' });
        }
        const note = await prisma_1.prisma.releaseNote.create({
            data: {
                version,
                title,
                description,
                updateType,
                visibility,
                status: 'PUBLISHED',
            },
        });
        // Update central system setting VERSION
        await prisma_1.prisma.systemSetting.upsert({
            where: { key: 'VERSION' },
            update: { value: version, updatedByUserId: user.id },
            create: { key: 'VERSION', value: version, updatedByUserId: user.id },
        });
        await (0, auditService_1.createAuditLog)({
            userId: user.id,
            userRole: user.role,
            action: 'PUBLISH_SYSTEM_UPDATE',
            entityType: 'RELEASE_NOTE',
            entityId: note.id,
            description: `Published version ${version} update: "${title}".`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: 'Release note published.', data: note });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
