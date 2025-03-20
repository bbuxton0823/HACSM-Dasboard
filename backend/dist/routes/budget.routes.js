"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const budget_controller_1 = require("../controllers/budget.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.verifyToken);
// Dashboard summary route
router.get('/dashboard-summary', budget_controller_1.getDashboardSummary);
// Budget Authority routes
router.get('/budget-authorities', budget_controller_1.getAllBudgetAuthorities);
router.get('/budget-authorities/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid budget authority ID')], budget_controller_1.getBudgetAuthorityById);
// Create budget authority (admin/user only)
router.post('/budget-authorities', auth_middleware_1.isUser, [
    (0, express_validator_1.body)('totalBudgetAmount')
        .isNumeric()
        .withMessage('Total budget amount must be a number')
        .isFloat({ min: 0 })
        .withMessage('Total budget amount must be positive'),
    (0, express_validator_1.body)('fiscalYear')
        .isInt({ min: 2000, max: 2100 })
        .withMessage('Fiscal year must be a valid year'),
    (0, express_validator_1.body)('effectiveDate')
        .isISO8601()
        .withMessage('Effective date must be a valid date'),
    (0, express_validator_1.body)('expirationDate')
        .optional()
        .isISO8601()
        .withMessage('Expiration date must be a valid date'),
    (0, express_validator_1.body)('notes').optional(),
    (0, express_validator_1.body)('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], budget_controller_1.createBudgetAuthority);
// Update budget authority (admin/user only)
router.put('/budget-authorities/:id', auth_middleware_1.isUser, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid budget authority ID'),
    (0, express_validator_1.body)('totalBudgetAmount')
        .optional()
        .isNumeric()
        .withMessage('Total budget amount must be a number')
        .isFloat({ min: 0 })
        .withMessage('Total budget amount must be positive'),
    (0, express_validator_1.body)('fiscalYear')
        .optional()
        .isInt({ min: 2000, max: 2100 })
        .withMessage('Fiscal year must be a valid year'),
    (0, express_validator_1.body)('effectiveDate')
        .optional()
        .isISO8601()
        .withMessage('Effective date must be a valid date'),
    (0, express_validator_1.body)('expirationDate')
        .optional()
        .isISO8601()
        .withMessage('Expiration date must be a valid date'),
    (0, express_validator_1.body)('notes').optional(),
    (0, express_validator_1.body)('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], budget_controller_1.updateBudgetAuthority);
// Delete budget authority (admin only)
router.delete('/budget-authorities/:id', auth_middleware_1.isAdmin, [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid budget authority ID')], budget_controller_1.deleteBudgetAuthority);
// MTW Reserve routes
router.get('/mtw-reserves', budget_controller_1.getAllMTWReserves);
router.get('/mtw-reserves/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid MTW reserve ID')], budget_controller_1.getMTWReserveById);
// Create MTW reserve (admin/user only)
router.post('/mtw-reserves', auth_middleware_1.isUser, [
    (0, express_validator_1.body)('reserveAmount')
        .isNumeric()
        .withMessage('Reserve amount must be a number')
        .isFloat({ min: 0 })
        .withMessage('Reserve amount must be positive'),
    (0, express_validator_1.body)('asOfDate')
        .isISO8601()
        .withMessage('As of date must be a valid date'),
    (0, express_validator_1.body)('minimumReserveLevel')
        .optional()
        .isNumeric()
        .withMessage('Minimum reserve level must be a number')
        .isFloat({ min: 0 })
        .withMessage('Minimum reserve level must be positive'),
    (0, express_validator_1.body)('notes').optional()
], budget_controller_1.createMTWReserve);
// Update MTW reserve (admin/user only)
router.put('/mtw-reserves/:id', auth_middleware_1.isUser, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid MTW reserve ID'),
    (0, express_validator_1.body)('reserveAmount')
        .optional()
        .isNumeric()
        .withMessage('Reserve amount must be a number')
        .isFloat({ min: 0 })
        .withMessage('Reserve amount must be positive'),
    (0, express_validator_1.body)('asOfDate')
        .optional()
        .isISO8601()
        .withMessage('As of date must be a valid date'),
    (0, express_validator_1.body)('minimumReserveLevel')
        .optional()
        .isNumeric()
        .withMessage('Minimum reserve level must be a number')
        .isFloat({ min: 0 })
        .withMessage('Minimum reserve level must be positive'),
    (0, express_validator_1.body)('notes').optional()
], budget_controller_1.updateMTWReserve);
// Delete MTW reserve (admin only)
router.delete('/mtw-reserves/:id', auth_middleware_1.isAdmin, [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid MTW reserve ID')], budget_controller_1.deleteMTWReserve);
exports.default = router;
