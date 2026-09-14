"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationReports = getApplicationReports;
exports.getUserReports = getUserReports;
exports.getAgentPerformanceReports = getAgentPerformanceReports;
exports.exportReportCSV = exportReportCSV;
const prisma_1 = require("../utils/prisma");
async function getApplicationReports(req, res) {
    try {
        const { startDate, endDate, type, status } = req.query;
        const where = {};
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [total, loanCount, insCount, invCount, statusBreakdown] = await Promise.all([
            prisma_1.prisma.application.count({ where }),
            prisma_1.prisma.application.count({ where: { ...where, type: 'LOAN' } }),
            prisma_1.prisma.application.count({ where: { ...where, type: 'INSURANCE' } }),
            prisma_1.prisma.application.count({ where: { ...where, type: 'INVESTMENT' } }),
            prisma_1.prisma.application.groupBy({
                by: ['status'],
                where,
                _count: { _all: true },
            }),
        ]);
        return res.json({
            success: true,
            data: {
                summary: {
                    totalApplications: total,
                    loanApplications: loanCount,
                    insuranceApplications: insCount,
                    investmentApplications: invCount,
                },
                statusBreakdown,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function getUserReports(req, res) {
    try {
        const roleBreakdown = await prisma_1.prisma.user.groupBy({
            by: ['role'],
            _count: { _all: true },
        });
        const statusBreakdown = await prisma_1.prisma.user.groupBy({
            by: ['status'],
            _count: { _all: true },
        });
        return res.json({
            success: true,
            data: {
                roleBreakdown,
                statusBreakdown,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function getAgentPerformanceReports(req, res) {
    try {
        const agents = await prisma_1.prisma.user.findMany({
            where: { role: { in: ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'] } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                _count: {
                    select: {
                        assignedApplications: true,
                    },
                },
            },
        });
        return res.json({ success: true, data: agents });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function exportReportCSV(req, res) {
    try {
        const { reportType } = req.query; // applications, users, audit
        let csvData = '';
        if (reportType === 'users') {
            const users = await prisma_1.prisma.user.findMany({ take: 50 });
            csvData = 'ID,Email,First Name,Last Name,Role,Status\n';
            users.forEach((u) => {
                csvData += `"${u.id}","${u.email}","${u.firstName}","${u.lastName}","${u.role}","${u.status}"\n`;
            });
        }
        else {
            const apps = await prisma_1.prisma.application.findMany({ take: 50 });
            csvData = 'Application ID,Customer ID,Type,Status,Amount,Created At\n';
            apps.forEach((a) => {
                csvData += `"${a.id}","${a.customerId}","${a.type}","${a.status}","${a.amount || 0}","${a.createdAt.toISOString()}"\n`;
            });
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType || 'report'}_export.csv"`);
        return res.send(csvData);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
