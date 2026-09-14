"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTasks = getTasks;
exports.createTask = createTask;
exports.updateTaskStatus = updateTaskStatus;
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
const notificationService_1 = require("../services/notificationService");
async function getTasks(req, res) {
    try {
        const user = req.user;
        const { status, applicationId } = req.query;
        const where = {};
        if (user.role !== 'SUPER_ADMIN') {
            where.assignedToUserId = user.id;
        }
        if (status)
            where.status = status;
        if (applicationId)
            where.applicationId = applicationId;
        const tasks = await prisma_1.prisma.task.findMany({
            where,
            include: {
                application: { select: { id: true, type: true, status: true } },
                createdByUser: { select: { firstName: true, lastName: true, role: true } },
                assignedToUser: { select: { firstName: true, lastName: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: tasks });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createTask(req, res) {
    try {
        const { applicationId, title, description, assignedToUserId, priority = 'MEDIUM', dueDate } = req.body;
        const user = req.user;
        if (!title) {
            return res.status(400).json({ success: false, message: 'Task title is required.' });
        }
        const task = await prisma_1.prisma.task.create({
            data: {
                applicationId: applicationId || null,
                title,
                description,
                createdByUserId: user.id,
                assignedToUserId: assignedToUserId || user.id,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'PENDING',
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: user.id,
            userRole: user.role,
            action: 'CREATE_TASK',
            entityType: 'TASK',
            entityId: task.id,
            description: `Created task '${title}'.`,
            ipAddress: req.ip,
        });
        if (assignedToUserId && assignedToUserId !== user.id) {
            await (0, notificationService_1.createNotification)({
                recipientUserId: assignedToUserId,
                type: 'TASK_ASSIGNED',
                title: 'New Task Assigned',
                message: `Task assigned to you: ${title}`,
                relatedEntity: 'TASK',
                relatedEntityId: task.id,
            });
        }
        return res.status(201).json({ success: true, message: 'Task created.', data: task });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function updateTaskStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
        const user = req.user;
        const task = await prisma_1.prisma.task.findUnique({ where: { id } });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }
        const updatedTask = await prisma_1.prisma.task.update({
            where: { id },
            data: {
                status,
                completedAt: status === 'COMPLETED' ? new Date() : null,
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: user.id,
            userRole: user.role,
            action: 'UPDATE_TASK_STATUS',
            entityType: 'TASK',
            entityId: task.id,
            description: `Updated task '${task.title}' status to ${status}.`,
            ipAddress: req.ip,
        });
        return res.json({ success: true, message: `Task status updated to ${status}.`, data: updatedTask });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
