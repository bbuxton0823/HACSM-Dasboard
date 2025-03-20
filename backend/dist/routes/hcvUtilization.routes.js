"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hcvUtilization_controller_1 = require("../controllers/hcvUtilization.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const HCVUtilization_1 = require("../models/HCVUtilization");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.verifyToken);
// Get all HCV utilization records
router.get('/', hcvUtilization_controller_1.getAllHCVUtilization);
// Get HCV utilization dashboard summary
router.get('/dashboard', hcvUtilization_controller_1.getHCVUtilizationDashboard);
// Get HCV utilization trends
router.get('/trends', [(0, express_validator_1.query)('months').optional().isInt({ min: 1 }).withMessage('Months must be a positive integer')], hcvUtilization_controller_1.getHCVUtilizationTrends);
// Get HCV utilization by ID
router.get('/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid HCV utilization ID')], hcvUtilization_controller_1.getHCVUtilizationById);
// Get HCV utilization by voucher type
router.get('/type/:type', [(0, express_validator_1.param)('type').isIn(Object.values(HCVUtilization_1.VoucherType)).withMessage('Invalid voucher type')], hcvUtilization_controller_1.getHCVUtilizationByType);
// Get HCV utilization by date range
router.get('/date-range', [
    (0, express_validator_1.query)('startDate').isISO8601().withMessage('Start date must be a valid date'),
    (0, express_validator_1.query)('endDate').isISO8601().withMessage('End date must be a valid date')
], hcvUtilization_controller_1.getHCVUtilizationByDateRange);
// Create HCV utilization record (admin/user only)
router.post('/', auth_middleware_1.isUser, [
    (0, express_validator_1.body)('reportingDate').isISO8601().withMessage('Reporting date must be a valid date'),
    (0, express_validator_1.body)('voucherType')
        .isIn(Object.values(HCVUtilization_1.VoucherType))
        .withMessage('Invalid voucher type'),
    (0, express_validator_1.body)('authorizedVouchers')
        .isInt({ min: 0 })
        .withMessage('Authorized vouchers must be a positive integer'),
    (0, express_validator_1.body)('leasedVouchers')
        .isInt({ min: 0 })
        .withMessage('Leased vouchers must be a positive integer'),
    (0, express_validator_1.body)('utilizationRate')
        .isFloat({ min: 0 })
        .withMessage('Utilization rate must be a positive number'),
    (0, express_validator_1.body)('hapExpenses')
        .isFloat({ min: 0 })
        .withMessage('HAP expenses must be a positive number'),
    (0, express_validator_1.body)('averageHapPerUnit')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Average HAP per unit must be a positive number'),
    (0, express_validator_1.body)('budgetUtilization')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Budget utilization must be a positive number'),
    (0, express_validator_1.body)('notes').optional()
], hcvUtilization_controller_1.createHCVUtilization);
// Update HCV utilization record (admin/user only)
router.put('/:id', auth_middleware_1.isUser, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid HCV utilization ID'),
    (0, express_validator_1.body)('reportingDate').optional().isISO8601().withMessage('Reporting date must be a valid date'),
    (0, express_validator_1.body)('voucherType')
        .optional()
        .isIn(Object.values(HCVUtilization_1.VoucherType))
        .withMessage('Invalid voucher type'),
    (0, express_validator_1.body)('authorizedVouchers')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Authorized vouchers must be a positive integer'),
    (0, express_validator_1.body)('leasedVouchers')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Leased vouchers must be a positive integer'),
    (0, express_validator_1.body)('utilizationRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Utilization rate must be a positive number'),
    (0, express_validator_1.body)('hapExpenses')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('HAP expenses must be a positive number'),
    (0, express_validator_1.body)('averageHapPerUnit')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Average HAP per unit must be a positive number'),
    (0, express_validator_1.body)('budgetUtilization')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Budget utilization must be a positive number'),
    (0, express_validator_1.body)('notes').optional()
], hcvUtilization_controller_1.updateHCVUtilization);
// Delete HCV utilization record (admin only)
router.delete('/:id', auth_middleware_1.isAdmin, [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid HCV utilization ID')], hcvUtilization_controller_1.deleteHCVUtilization);
exports.default = router;
