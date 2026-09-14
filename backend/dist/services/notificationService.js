"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.notifySuperAdmins = notifySuperAdmins;
exports.notifyUser = notifyUser;
const prisma_1 = require("../utils/prisma");
async function createNotification(input) {
    try {
        return await prisma_1.prisma.notification.create({
            data: {
                recipientUserId: input.recipientUserId,
                type: input.type,
                title: input.title,
                message: input.message,
                module: input.module || 'GENERAL',
                source: input.source || 'SYSTEM',
                actionStatus: input.actionStatus || 'NONE',
                recipientRole: input.recipientRole || null,
                customerId: input.customerId || null,
                agentId: input.agentId || null,
                applicationId: input.applicationId || null,
                documentId: input.documentId || null,
                commentId: input.commentId || null,
                relatedEntity: input.relatedEntity || null,
                relatedEntityId: input.relatedEntityId || null,
            },
        });
    }
    catch (err) {
        console.error('❌ Failed to create notification:', err);
        return null;
    }
}
async function notifySuperAdmins(type, title, message, options) {
    try {
        const superAdmins = await prisma_1.prisma.user.findMany({
            where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
            select: { id: true },
        });
        for (const admin of superAdmins) {
            await createNotification({
                recipientUserId: admin.id,
                recipientRole: 'SUPER_ADMIN',
                type,
                title,
                message,
                module: options?.module || 'GENERAL',
                source: options?.source || 'SYSTEM',
                actionStatus: options?.actionStatus || 'NONE',
                customerId: options?.customerId,
                agentId: options?.agentId,
                applicationId: options?.applicationId,
                documentId: options?.documentId,
                relatedEntity: options?.relatedEntity,
                relatedEntityId: options?.relatedEntityId,
            });
        }
    }
    catch (err) {
        console.error('❌ Failed to notify super admins:', err);
    }
}
async function notifyUser(recipientUserId, type, title, message, options) {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: recipientUserId },
            select: { role: true },
        });
        return await createNotification({
            recipientUserId,
            recipientRole: options?.recipientRole || user?.role || 'CUSTOMER',
            type,
            title,
            message,
            module: options?.module || 'GENERAL',
            source: options?.source || 'SYSTEM',
            actionStatus: options?.actionStatus || 'NONE',
            customerId: options?.customerId,
            agentId: options?.agentId,
            applicationId: options?.applicationId,
            documentId: options?.documentId,
            relatedEntity: options?.relatedEntity,
            relatedEntityId: options?.relatedEntityId,
        });
    }
    catch (err) {
        console.error(`❌ Failed to notify user ${recipientUserId}:`, err);
        return null;
    }
}
