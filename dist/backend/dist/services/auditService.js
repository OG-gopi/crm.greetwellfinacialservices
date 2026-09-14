"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
const prisma_1 = require("../utils/prisma");
async function createAuditLog(input) {
    try {
        return await prisma_1.prisma.auditLog.create({
            data: {
                userId: input.userId || null,
                userRole: input.userRole || null,
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId || null,
                description: input.description,
                ipAddress: input.ipAddress || null,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            },
        });
    }
    catch (err) {
        console.error('❌ Failed to log audit event:', err);
        return null;
    }
}
