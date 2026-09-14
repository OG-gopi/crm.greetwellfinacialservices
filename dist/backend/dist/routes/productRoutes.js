"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Loan Products
router.get('/loan', productController_1.getLoanProducts);
router.post('/loan', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), (0, authMiddleware_1.requirePermission)('products.create'), productController_1.createLoanProduct);
router.put('/loan/:id', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), (0, authMiddleware_1.requirePermission)('products.edit'), productController_1.updateLoanProduct);
// Insurance Products
router.get('/insurance', productController_1.getInsuranceProducts);
router.post('/insurance', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), (0, authMiddleware_1.requirePermission)('products.create'), productController_1.createInsuranceProduct);
router.put('/insurance/:id', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), (0, authMiddleware_1.requirePermission)('products.edit'), productController_1.updateInsuranceProduct);
// Investment Products
router.get('/investment', productController_1.getInvestmentProducts);
router.post('/investment', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), (0, authMiddleware_1.requirePermission)('products.create'), productController_1.createInvestmentProduct);
router.put('/investment/:id', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), (0, authMiddleware_1.requirePermission)('products.edit'), productController_1.updateInvestmentProduct);
exports.default = router;
