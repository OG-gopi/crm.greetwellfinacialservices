"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoanProducts = getLoanProducts;
exports.createLoanProduct = createLoanProduct;
exports.updateLoanProduct = updateLoanProduct;
exports.getInsuranceProducts = getInsuranceProducts;
exports.createInsuranceProduct = createInsuranceProduct;
exports.updateInsuranceProduct = updateInsuranceProduct;
exports.getInvestmentProducts = getInvestmentProducts;
exports.createInvestmentProduct = createInvestmentProduct;
exports.updateInvestmentProduct = updateInvestmentProduct;
const prisma_1 = require("../utils/prisma");
const auditService_1 = require("../services/auditService");
// --- LOAN PRODUCTS ---
async function getLoanProducts(req, res) {
    try {
        const products = await prisma_1.prisma.loanProduct.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json({ success: true, data: products });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createLoanProduct(req, res) {
    try {
        const { name, code, category, interestRate, minAmount, maxAmount, description } = req.body;
        const product = await prisma_1.prisma.loanProduct.create({
            data: {
                name,
                code,
                category,
                interestRate: parseFloat(interestRate),
                minAmount: parseFloat(minAmount),
                maxAmount: parseFloat(maxAmount),
                description,
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'CREATE_LOAN_PRODUCT',
            entityType: 'LOAN_PRODUCT',
            entityId: product.id,
            description: `Created Loan Product '${name}' (${code}).`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: 'Loan Product created.', data: product });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function updateLoanProduct(req, res) {
    try {
        const { id } = req.params;
        const { name, category, interestRate, minAmount, maxAmount, description, isActive } = req.body;
        const product = await prisma_1.prisma.loanProduct.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(category && { category }),
                ...(interestRate !== undefined && { interestRate: parseFloat(interestRate) }),
                ...(minAmount !== undefined && { minAmount: parseFloat(minAmount) }),
                ...(maxAmount !== undefined && { maxAmount: parseFloat(maxAmount) }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'UPDATE_LOAN_PRODUCT',
            entityType: 'LOAN_PRODUCT',
            entityId: product.id,
            description: `Updated Loan Product '${product.name}'.`,
            ipAddress: req.ip,
        });
        return res.json({ success: true, message: 'Loan Product updated.', data: product });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// --- INSURANCE PRODUCTS ---
async function getInsuranceProducts(req, res) {
    try {
        const products = await prisma_1.prisma.insuranceProduct.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json({ success: true, data: products });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createInsuranceProduct(req, res) {
    try {
        const { name, code, type, coverageAmount, premiumAmount, description } = req.body;
        const product = await prisma_1.prisma.insuranceProduct.create({
            data: {
                name,
                code,
                type,
                coverageAmount: parseFloat(coverageAmount),
                premiumAmount: parseFloat(premiumAmount),
                description,
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'CREATE_INSURANCE_PRODUCT',
            entityType: 'INSURANCE_PRODUCT',
            entityId: product.id,
            description: `Created Insurance Product '${name}' (${code}).`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: 'Insurance Product created.', data: product });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function updateInsuranceProduct(req, res) {
    try {
        const { id } = req.params;
        const { name, type, coverageAmount, premiumAmount, description, isActive } = req.body;
        const product = await prisma_1.prisma.insuranceProduct.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(coverageAmount !== undefined && { coverageAmount: parseFloat(coverageAmount) }),
                ...(premiumAmount !== undefined && { premiumAmount: parseFloat(premiumAmount) }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        return res.json({ success: true, message: 'Insurance Product updated.', data: product });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
// --- INVESTMENT PRODUCTS ---
async function getInvestmentProducts(req, res) {
    try {
        const products = await prisma_1.prisma.investmentProduct.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json({ success: true, data: products });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function createInvestmentProduct(req, res) {
    try {
        const { name, code, riskLevel, expectedReturnRate, minInvestment, description } = req.body;
        const product = await prisma_1.prisma.investmentProduct.create({
            data: {
                name,
                code,
                riskLevel,
                expectedReturnRate: parseFloat(expectedReturnRate),
                minInvestment: parseFloat(minInvestment),
                description,
            },
        });
        await (0, auditService_1.createAuditLog)({
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'CREATE_INVESTMENT_PRODUCT',
            entityType: 'INVESTMENT_PRODUCT',
            entityId: product.id,
            description: `Created Investment Product '${name}' (${code}).`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: 'Investment Product created.', data: product });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
async function updateInvestmentProduct(req, res) {
    try {
        const { id } = req.params;
        const { name, riskLevel, expectedReturnRate, minInvestment, description, isActive } = req.body;
        const product = await prisma_1.prisma.investmentProduct.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(riskLevel && { riskLevel }),
                ...(expectedReturnRate !== undefined && { expectedReturnRate: parseFloat(expectedReturnRate) }),
                ...(minInvestment !== undefined && { minInvestment: parseFloat(minInvestment) }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        return res.json({ success: true, message: 'Investment Product updated.', data: product });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
