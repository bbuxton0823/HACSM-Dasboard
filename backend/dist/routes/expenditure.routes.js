"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expenditure_controller_1 = require("../controllers/expenditure.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const HAPExpenditure_1 = require("../models/HAPExpenditure");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.verifyToken);
// Get all expenditures
router.get('/', expenditure_controller_1.getAllExpenditures);
// Get expenditure by ID
router.get('/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid expenditure ID')], expenditure_controller_1.getExpenditureById);
// Get expenditures by type
router.get('/type/:type', [(0, express_validator_1.param)('type').isIn(Object.values(HAPExpenditure_1.ExpenditureType)).withMessage('Invalid expenditure type')], expenditure_controller_1.getExpendituresByType);
// Get expenditures by date range
router.get('/date-range', [
    (0, express_validator_1.query)('startDate').isISO8601().withMessage('Start date must be a valid date'),
    (0, express_validator_1.query)('endDate').isISO8601().withMessage('End date must be a valid date')
], expenditure_controller_1.getExpendituresByDateRange);
// Get expenditure summary by type
router.get('/summary/by-type', [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('End date must be a valid date')
], expenditure_controller_1.getExpenditureSummaryByType);
// Get monthly expenditure summary
router.get('/summary/monthly/:year', [(0, express_validator_1.param)('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required')], expenditure_controller_1.getMonthlyExpenditureSummary);
// Create expenditure (admin/user only)
router.post('/', auth_middleware_1.isUser, [
    (0, express_validator_1.body)('expenditureDate').isISO8601().withMessage('Expenditure date must be a valid date'),
    (0, express_validator_1.body)('expenditureType')
        .isIn(Object.values(HAPExpenditure_1.ExpenditureType))
        .withMessage('Invalid expenditure type'),
    (0, express_validator_1.body)('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount must be positive'),
    (0, express_validator_1.body)('description').optional(),
    (0, express_validator_1.body)('notes').optional()
], expenditure_controller_1.createExpenditure);
// Update expenditure (admin/user only)
router.put('/:id', auth_middleware_1.isUser, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid expenditure ID'),
    (0, express_validator_1.body)('expenditureDate').optional().isISO8601().withMessage('Expenditure date must be a valid date'),
    (0, express_validator_1.body)('expenditureType')
        .optional()
        .isIn(Object.values(HAPExpenditure_1.ExpenditureType))
        .withMessage('Invalid expenditure type'),
    (0, express_validator_1.body)('amount')
        .optional()
        .isNumeric()
        .withMessage('Amount must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount must be positive'),
    (0, express_validator_1.body)('description').optional(),
    (0, express_validator_1.body)('notes').optional()
], expenditure_controller_1.updateExpenditure);
// Delete expenditure (admin only)
router.delete('/:id', auth_middleware_1.isAdmin, [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid expenditure ID')], expenditure_controller_1.deleteExpenditure);
exports.default = router;
