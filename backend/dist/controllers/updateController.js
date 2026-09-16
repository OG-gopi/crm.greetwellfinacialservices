"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleaseNotes = getReleaseNotes;
exports.createReleaseNote = createReleaseNote;
exports.getPublicVersion = getPublicVersion;
exports.updateReleaseNote = updateReleaseNote;
exports.deleteReleaseNote = deleteReleaseNote;
exports.updateSystemVersion = updateSystemVersion;
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
async function getPublicVersion(req, res) {
    try {
        const versionSetting = await prisma_1.prisma.systemSetting.findUnique({ where: { key: 'VERSION' } });
        const currentVersion = versionSetting ? versionSetting.value : '1.0.0';
        const latestNotes = await prisma_1.prisma.releaseNote.findMany({
            where: { status: 'PUBLISHED', visibility: 'ALL_USERS' },
            orderBy: { releaseDate: 'desc' },
            take: 5,
        });
        return res.json({
            success: true,
            data: {
                version: currentVersion,
                displayVersion: `GFS Portal v${currentVersion}`,
                releaseNotes: latestNotes,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function updateReleaseNote(req, res) {
    try {
        const { id } = req.params;
        const { version, title, description, updateType, visibility, status } = req.body;
        const user = req.user;
        const existing = await prisma_1.prisma.releaseNote.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Release note not found.' });
        }
        const updatedNote = await prisma_1.prisma.releaseNote.update({
            where: { id },
            data: {
                ...(version && { version }),
                ...(title && { title }),
                ...(description && { description }),
                ...(updateType && { updateType }),
                ...(visibility && { visibility }),
                ...(status && { status }),
            },
        });
        if (version) {
            await prisma_1.prisma.systemSetting.upsert({
                where: { key: 'VERSION' },
                update: { value: version, updatedByUserId: user.id },
                create: { key: 'VERSION', value: version, updatedByUserId: user.id },
            });
        }
        await (0, auditService_1.createAuditLog)({
            userId: user.id,
            userRole: user.role,
            action: 'UPDATE_RELEASE_NOTE',
            entityType: 'RELEASE_NOTE',
            entityId: id,
            description: `Updated release note v${updatedNote.version}: "${updatedNote.title}".`,
            ipAddress: req.ip,
        });
        return res.json({ success: true, message: 'Release note updated successfully.', data: updatedNote });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function deleteReleaseNote(req, res) {
    try {
        const { id } = req.params;
        const user = req.user;
        const existing = await prisma_1.prisma.releaseNote.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Release note not found.' });
        }
        await prisma_1.prisma.releaseNote.delete({ where: { id } });
        await (0, auditService_1.createAuditLog)({
            userId: user.id,
            userRole: user.role,
            action: 'DELETE_RELEASE_NOTE',
            entityType: 'RELEASE_NOTE',
            entityId: id,
            description: `Deleted release note v${existing.version}: "${existing.title}".`,
            ipAddress: req.ip,
        });
        return res.json({ success: true, message: 'Release note deleted successfully.' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function updateSystemVersion(req, res) {
    try {
        const { version } = req.body;
        const user = req.user;
        if (!version || typeof version !== 'string' || !version.trim()) {
            return res.status(400).json({ success: false, message: 'Valid version string is required.' });
        }
        const cleanVersion = version.trim();
        const setting = await prisma_1.prisma.systemSetting.upsert({
            where: { key: 'VERSION' },
            update: { value: cleanVersion, updatedByUserId: user.id },
            create: { key: 'VERSION', value: cleanVersion, updatedByUserId: user.id },
        });
        await (0, auditService_1.createAuditLog)({
            userId: user.id,
            userRole: user.role,
            action: 'UPDATE_SYSTEM_VERSION',
            entityType: 'SYSTEM_SETTING',
            entityId: setting.id,
            description: `Updated system version string to "${cleanVersion}".`,
            ipAddress: req.ip,
        });
        return res.json({
            success: true,
            message: `System version updated to ${cleanVersion}.`,
            data: { version: cleanVersion, displayVersion: `GFS Portal v${cleanVersion}` },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
