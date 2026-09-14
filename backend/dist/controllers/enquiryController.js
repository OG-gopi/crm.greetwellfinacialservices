"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ENQUIRY_CATEGORIES = void 0;
exports.getEnquiries = getEnquiries;
exports.getEnquiryById = getEnquiryById;
exports.getUserApplications = getUserApplications;
exports.createEnquiry = createEnquiry;
exports.addEnquiryMessage = addEnquiryMessage;
exports.updateEnquiryStatus = updateEnquiryStatus;
exports.getComplaintCategories = getComplaintCategories;
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
const notificationService_1 = require("../services/notificationService");
const emailService_1 = require("../services/emailService");
const validation_1 = require("../utils/validation");
// Valid categories list
exports.ALL_ENQUIRY_CATEGORIES = [
    'Loan',
    'Insurance',
    'Investment',
    'Account & Registration',
    'Technical Support',
    'Documents',
    'Payments',
    'Other',
];
async function getEnquiries(req, res) {
    try {
        const { status, category, priority, search, page = '1', limit = '50' } = req.query;
        const user = req.user;
        const where = {};
        // 1. Role-based scoping
        if (user.role === 'CUSTOMER') {
            where.raisedByUserId = user.id;
        }
        else if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(user.role)) {
            where.raisedByUserId = user.id;
        }
        // 2. Filters
        if (status)
            where.status = status;
        if (category)
            where.category = category;
        if (priority)
            where.priority = priority;
        if (search) {
            const q = search.toLowerCase();
            where.OR = [
                { id: { contains: q } },
                { subject: { contains: q } },
                { description: { contains: q } },
                { relatedApplicationId: { contains: q } },
                { raisedByUser: { firstName: { contains: q } } },
                { raisedByUser: { lastName: { contains: q } } },
                { raisedByUser: { email: { contains: q } } },
            ];
        }
        // Calculate metric counters
        const baseWhere = user.role === 'SUPER_ADMIN' ? {} : { raisedByUserId: user.id };
        const [allTickets, total, open, inProgress, resolved] = await Promise.all([
            prisma_1.prisma.enquiry.findMany({
                where,
                include: {
                    raisedByUser: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true } },
                    assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
                    _count: { select: { messages: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.enquiry.count({ where: baseWhere }),
            prisma_1.prisma.enquiry.count({ where: { ...baseWhere, status: 'OPEN' } }),
            prisma_1.prisma.enquiry.count({ where: { ...baseWhere, status: { in: ['IN_PROGRESS', 'AWAITING_INFORMATION'] } } }),
            prisma_1.prisma.enquiry.count({ where: { ...baseWhere, status: { in: ['RESOLVED', 'CLOSED'] } } }),
        ]);
        return res.json({
            success: true,
            data: allTickets,
            metrics: {
                total,
                open,
                inProgress,
                resolved,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function getEnquiryById(req, res) {
    try {
        const { id } = req.params;
        const user = req.user;
        const enquiry = await prisma_1.prisma.enquiry.findUnique({
            where: { id },
            include: {
                raisedByUser: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true } },
                assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
                messages: {
                    include: {
                        sender: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                history: {
                    include: {
                        performedByUser: { select: { firstName: true, lastName: true, role: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry ticket not found.' });
        }
        // RBAC Security Guard: Non-admin users can ONLY view their own tickets
        if (user.role !== 'SUPER_ADMIN' && enquiry.raisedByUserId !== user.id && enquiry.assignedAgentId !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied to this enquiry.' });
        }
        return res.json({ success: true, data: enquiry });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function getUserApplications(req, res) {
    try {
        const user = req.user;
        const where = {};
        if (user.role === 'CUSTOMER') {
            where.customerId = user.id;
        }
        else if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(user.role)) {
            where.assignedAgentId = user.id;
        }
        const applications = await prisma_1.prisma.application.findMany({
            where,
            select: { id: true, type: true, status: true, purpose: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: applications });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createEnquiry(req, res) {
    try {
        const { subject, category, description, priority = 'MEDIUM', relatedApplicationId, attachmentUrl, contactPhone } = req.body;
        const user = req.user;
        if (!subject || !category || !description) {
            return res.status(400).json({ success: false, message: 'Subject, Category, and Description are required.' });
        }
        // Indian Mobile Validation if mobile provided or auto-filled
        const phoneToValidate = contactPhone || user.phone;
        if (phoneToValidate) {
            const mobileValid = (0, validation_1.validateIndianMobile)(phoneToValidate);
            if (!mobileValid.isValid) {
                return res.status(400).json({ success: false, message: mobileValid.message });
            }
        }
        // Validate Category Access based on User Role & Service Types
        const userServices = Array.isArray(user.serviceTypes)
            ? user.serviceTypes.map((s) => s.toUpperCase())
            : user.role === 'LOAN_AGENT' ? ['LOANS'] : user.role === 'INSURANCE_AGENT' ? ['INSURANCE'] : user.role === 'INVESTMENT_AGENT' ? ['INVESTMENT'] : ['LOANS'];
        if (user.role !== 'SUPER_ADMIN') {
            if (category === 'Loan' && !userServices.includes('LOANS') && !userServices.includes('LOAN') && user.role !== 'LOAN_AGENT') {
                return res.status(403).json({ success: false, message: 'You are not permitted to submit Loan enquiries.' });
            }
            if (category === 'Insurance' && !userServices.includes('INSURANCE') && user.role !== 'INSURANCE_AGENT') {
                return res.status(403).json({ success: false, message: 'You are not permitted to submit Insurance enquiries.' });
            }
            if (category === 'Investment' && !userServices.includes('INVESTMENT') && !userServices.includes('INVESTMENTS') && user.role !== 'INVESTMENT_AGENT') {
                return res.status(403).json({ success: false, message: 'You are not permitted to submit Investment enquiries.' });
            }
        }
        // Generate unique ID: ENQ-2026-XXXXXX
        const year = new Date().getFullYear();
        const count = await prisma_1.prisma.enquiry.count();
        const enquiryId = `ENQ-${year}-${(count + 1).toString().padStart(6, '0')}`;
        const enquiry = await prisma_1.prisma.enquiry.create({
            data: {
                id: enquiryId,
                raisedByUserId: user.id,
                userRole: user.role,
                subject,
                category,
                relatedApplicationId: relatedApplicationId || null,
                description,
                priority,
                status: 'OPEN',
                attachmentUrl: attachmentUrl || null,
                contactEmail: user.email,
                contactPhone: phoneToValidate || null,
            },
        });
        // Create initial conversation message
        await prisma_1.prisma.enquiryMessage.create({
            data: {
                enquiryId: enquiry.id,
                senderId: user.id,
                senderRole: user.role,
                message: description,
                attachmentUrl: attachmentUrl || null,
            },
        });
        // Create audit history entry
        await prisma_1.prisma.enquiryHistory.create({
            data: {
                enquiryId: enquiry.id,
                performedByUserId: user.id,
                action: 'ENQUIRY_CREATED',
                details: `Enquiry ticket ${enquiry.id} created by ${user.firstName} ${user.lastName || ''} (${user.role}).`,
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: user.id,
            userRole: user.role,
            action: 'CREATE_ENQUIRY',
            entityType: 'ENQUIRY',
            entityId: enquiry.id,
            description: `User ${user.email} created enquiry ${enquiry.id}: "${subject}".`,
            ipAddress: req.ip,
        });
        await (0, notificationService_1.notifySuperAdmins)('NEW_ENQUIRY', `New Enquiry Ticket (${enquiry.id})`, `New enquiry ticket ${enquiry.id} (${category}) submitted by ${user.firstName} ${user.lastName || ''}.`, { module: 'ENQUIRY', relatedEntityId: enquiry.id });
        // Send email acknowledgement
        emailService_1.emailService.sendEnquiryCreatedNotification({
            email: user.email,
            userName: `${user.firstName} ${user.lastName || ''}`,
            enquiryId: enquiry.id,
            subject: enquiry.subject,
            category: enquiry.category,
            relatedApplicationId: enquiry.relatedApplicationId || undefined,
        }).catch((err) => console.error('Failed to send enquiry email acknowledgement:', err));
        return res.status(201).json({
            success: true,
            message: `Enquiry ${enquiry.id} submitted successfully.`,
            data: enquiry,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function addEnquiryMessage(req, res) {
    try {
        const { id } = req.params;
        const { message, attachmentUrl } = req.body;
        const user = req.user;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message content is required.' });
        }
        const enquiry = await prisma_1.prisma.enquiry.findUnique({
            where: { id },
            include: { raisedByUser: true },
        });
        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry ticket not found.' });
        }
        // RBAC Security Check
        if (user.role !== 'SUPER_ADMIN' && enquiry.raisedByUserId !== user.id && enquiry.assignedAgentId !== user.id) {
            return res.status(403).json({ success: false, message: 'You are not authorized to reply to this enquiry.' });
        }
        if (enquiry.status === 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Cannot reply to a closed enquiry. Reopen the ticket first.' });
        }
        // Post message
        const newMessage = await prisma_1.prisma.enquiryMessage.create({
            data: {
                enquiryId: enquiry.id,
                senderId: user.id,
                senderRole: user.role,
                message,
                attachmentUrl: attachmentUrl || null,
            },
        });
        // Auto status update: if AWAITING_INFORMATION and raisedByUser replies -> change to IN_PROGRESS
        let updatedStatus = enquiry.status;
        if (enquiry.status === 'AWAITING_INFORMATION' && user.id === enquiry.raisedByUserId) {
            updatedStatus = 'IN_PROGRESS';
            await prisma_1.prisma.enquiry.update({
                where: { id },
                data: { status: 'IN_PROGRESS' },
            });
        }
        // Record history entry
        await prisma_1.prisma.enquiryHistory.create({
            data: {
                enquiryId: enquiry.id,
                performedByUserId: user.id,
                action: 'MESSAGE_ADDED',
                details: `Message posted by ${user.firstName} (${user.role}).`,
            },
        });
        // Send notifications
        const recipientId = user.id === enquiry.raisedByUserId
            ? (enquiry.assignedAgentId || null)
            : enquiry.raisedByUserId;
        if (recipientId) {
            await (0, notificationService_1.createNotification)({
                recipientUserId: recipientId,
                type: 'ENQUIRY_REPLY_RECEIVED',
                title: `New Response on Ticket ${enquiry.id}`,
                message: `${user.firstName} replied: "${message.substring(0, 80)}..."`,
                relatedEntity: 'ENQUIRY',
                relatedEntityId: enquiry.id,
            });
        }
        // Send email notification to owner if replied by Admin/Agent
        if (user.id !== enquiry.raisedByUserId && enquiry.raisedByUser?.email) {
            emailService_1.emailService.sendEnquiryReplyNotification({
                email: enquiry.raisedByUser.email,
                userName: `${enquiry.raisedByUser.firstName} ${enquiry.raisedByUser.lastName || ''}`,
                enquiryId: enquiry.id,
                subject: enquiry.subject,
                senderName: `${user.firstName} ${user.lastName || ''} (${user.role.replace('_', ' ')})`,
                message,
                status: updatedStatus,
            }).catch((err) => console.error('Failed to send enquiry reply email:', err));
        }
        return res.status(201).json({
            success: true,
            message: 'Reply posted successfully.',
            data: newMessage,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function updateEnquiryStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, priority, assignedAgentId, resolutionComment, internalNotes } = req.body;
        const user = req.user;
        const enquiry = await prisma_1.prisma.enquiry.findUnique({
            where: { id },
            include: { raisedByUser: true },
        });
        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry ticket not found.' });
        }
        // Security Check: Owners can close or reopen tickets. Super Admin can perform full updates.
        const isOwner = user.id === enquiry.raisedByUserId;
        const isSuperAdmin = user.role === 'SUPER_ADMIN';
        if (!isSuperAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to modify this enquiry.' });
        }
        const updateData = {};
        let historyDetails = [];
        if (status) {
            const validStatuses = ['OPEN', 'IN_PROGRESS', 'AWAITING_INFORMATION', 'RESOLVED', 'CLOSED'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid enquiry status.' });
            }
            // Non-admin owners can only transition to CLOSED or REOPEN (OPEN/IN_PROGRESS)
            if (!isSuperAdmin && !['CLOSED', 'OPEN', 'IN_PROGRESS'].includes(status)) {
                return res.status(403).json({ success: false, message: 'Owners can only close or reopen tickets.' });
            }
            updateData.status = status;
            historyDetails.push(`Status changed from ${enquiry.status} to ${status}`);
        }
        if (priority && isSuperAdmin) {
            if (!['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
                return res.status(400).json({ success: false, message: 'Invalid priority level.' });
            }
            updateData.priority = priority;
            historyDetails.push(`Priority changed to ${priority}`);
        }
        if (assignedAgentId !== undefined && isSuperAdmin) {
            updateData.assignedAgentId = assignedAgentId || null;
            historyDetails.push(assignedAgentId ? `Assigned agent updated` : `Unassigned agent`);
        }
        if (resolutionComment)
            updateData.resolutionComment = resolutionComment;
        if (internalNotes && isSuperAdmin)
            updateData.internalNotes = internalNotes;
        const updated = await prisma_1.prisma.enquiry.update({
            where: { id },
            data: updateData,
        });
        // Record audit history
        if (historyDetails.length > 0) {
            await prisma_1.prisma.enquiryHistory.create({
                data: {
                    enquiryId: enquiry.id,
                    performedByUserId: user.id,
                    action: 'STATUS_CHANGED',
                    details: `${historyDetails.join(', ')} by ${user.firstName} (${user.role}).`,
                },
            });
            await (0, auditService_1.createAuditLog)({
                userId: user.id,
                userRole: user.role,
                action: 'UPDATE_ENQUIRY',
                entityType: 'ENQUIRY',
                entityId: enquiry.id,
                description: `Updated enquiry ${enquiry.id}: ${historyDetails.join(', ')}.`,
                ipAddress: req.ip,
            });
        }
        // Handle Status Specific Email & In-App Notifications
        if (status && status !== enquiry.status && enquiry.raisedByUser?.email) {
            const ownerEmail = enquiry.raisedByUser.email;
            const ownerName = `${enquiry.raisedByUser.firstName} ${enquiry.raisedByUser.lastName || ''}`;
            await (0, notificationService_1.createNotification)({
                recipientUserId: enquiry.raisedByUserId,
                type: 'ENQUIRY_STATUS_CHANGED',
                title: `Enquiry ${enquiry.id} ${status}`,
                message: `Your enquiry status is now ${status}. ${resolutionComment ? 'Notes: ' + resolutionComment : ''}`,
                relatedEntity: 'ENQUIRY',
                relatedEntityId: enquiry.id,
            });
            if (status === 'AWAITING_INFORMATION') {
                emailService_1.emailService.sendEnquiryInfoRequestedNotification({
                    email: ownerEmail,
                    userName: ownerName,
                    enquiryId: enquiry.id,
                    subject: enquiry.subject,
                    message: resolutionComment || 'Additional details or documents requested by support.',
                }).catch((err) => console.error('Failed to send info request email:', err));
            }
            else if (status === 'RESOLVED') {
                emailService_1.emailService.sendEnquiryResolvedNotification({
                    email: ownerEmail,
                    userName: ownerName,
                    enquiryId: enquiry.id,
                    subject: enquiry.subject,
                    resolutionMessage: resolutionComment || 'Your ticket has been marked as resolved.',
                }).catch((err) => console.error('Failed to send resolution email:', err));
            }
            else if (status === 'CLOSED') {
                emailService_1.emailService.sendEnquiryClosedNotification({
                    email: ownerEmail,
                    userName: ownerName,
                    enquiryId: enquiry.id,
                    subject: enquiry.subject,
                }).catch((err) => console.error('Failed to send closure email:', err));
            }
        }
        return res.json({
            success: true,
            message: `Enquiry ${enquiry.id} updated successfully.`,
            data: updated,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function getComplaintCategories(req, res) {
    try {
        const categories = await prisma_1.prisma.complaintCategory.findMany({ orderBy: { name: 'asc' } });
        return res.json({ success: true, data: categories });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
