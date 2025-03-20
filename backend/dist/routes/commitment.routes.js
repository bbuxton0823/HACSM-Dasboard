"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commitment_controller_1 = require("../controllers/commitment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const Commitment_1 = require("../models/Commitment");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.verifyToken);
// Get all commitments
router.get('/', commitment_controller_1.getAllCommitments);
// Get commitment by ID
router.get('/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid commitment ID')], commitment_controller_1.getCommitmentById);
// Get commitments by type
router.get('/type/:type', [(0, express_validator_1.param)('type').isIn(Object.values(Commitment_1.CommitmentType)).withMessage('Invalid commitment type')], commitment_controller_1.getCommitmentsByType);
// Get commitments by status
router.get('/status/:status', [(0, express_validator_1.param)('status').isIn(Object.values(Commitment_1.CommitmentStatus)).withMessage('Invalid commitment status')], commitment_controller_1.getCommitmentsByStatus);
// Create commitment (admin/user only)
router.post('/', auth_middleware_1.isUser, [
    (0, express_validator_1.body)('commitmentNumber').notEmpty().withMessage('Commitment number is required'),
    (0, express_validator_1.body)('activityDescription').notEmpty().withMessage('Activity description is required'),
    (0, express_validator_1.body)('commitmentType')
        .isIn(Object.values(Commitment_1.CommitmentType))
        .withMessage('Invalid commitment type'),
    (0, express_validator_1.body)('accountType').optional(),
    (0, express_validator_1.body)('commitmentDate').optional().isISO8601().withMessage('Commitment date must be a valid date'),
    (0, express_validator_1.body)('obligationDate').optional().isISO8601().withMessage('Obligation date must be a valid date'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(Object.values(Commitment_1.CommitmentStatus))
        .withMessage('Invalid commitment status'),
    (0, express_validator_1.body)('amountCommitted')
        .isNumeric()
        .withMessage('Amount committed must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount committed must be positive'),
    (0, express_validator_1.body)('amountObligated')
        .optional()
        .isNumeric()
        .withMessage('Amount obligated must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount obligated must be positive'),
    (0, express_validator_1.body)('amountExpended')
        .optional()
        .isNumeric()
        .withMessage('Amount expended must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount expended must be positive'),
    (0, express_validator_1.body)('projectedFullExpenditureDate')
        .optional()
        .isISO8601()
        .withMessage('Projected full expenditure date must be a valid date'),
    (0, express_validator_1.body)('notes').optional()
], commitment_controller_1.createCommitment);
// Update commitment (admin/user only)
router.put('/:id', auth_middleware_1.isUser, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid commitment ID'),
    (0, express_validator_1.body)('commitmentNumber').optional().notEmpty().withMessage('Commitment number cannot be empty'),
    (0, express_validator_1.body)('activityDescription').optional().notEmpty().withMessage('Activity description cannot be empty'),
    (0, express_validator_1.body)('commitmentType')
        .optional()
        .isIn(Object.values(Commitment_1.CommitmentType))
        .withMessage('Invalid commitment type'),
    (0, express_validator_1.body)('accountType').optional(),
    (0, express_validator_1.body)('commitmentDate').optional().isISO8601().withMessage('Commitment date must be a valid date'),
    (0, express_validator_1.body)('obligationDate').optional().isISO8601().withMessage('Obligation date must be a valid date'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(Object.values(Commitment_1.CommitmentStatus))
        .withMessage('Invalid commitment status'),
    (0, express_validator_1.body)('amountCommitted')
        .optional()
        .isNumeric()
        .withMessage('Amount committed must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount committed must be positive'),
    (0, express_validator_1.body)('amountObligated')
        .optional()
        .isNumeric()
        .withMessage('Amount obligated must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount obligated must be positive'),
    (0, express_validator_1.body)('amountExpended')
        .optional()
        .isNumeric()
        .withMessage('Amount expended must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount expended must be positive'),
    (0, express_validator_1.body)('projectedFullExpenditureDate')
        .optional()
        .isISO8601()
        .withMessage('Projected full expenditure date must be a valid date'),
    (0, express_validator_1.body)('notes').optional()
], commitment_controller_1.updateCommitment);
// Delete commitment (admin only)
router.delete('/:id', auth_middleware_1.isAdmin, [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid commitment ID')], commitment_controller_1.deleteCommitment);
exports.default = router;
