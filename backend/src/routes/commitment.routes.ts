import { Router } from 'express';
import { 
  getAllCommitments,
  getCommitmentById,
  createCommitment,
  updateCommitment,
  deleteCommitment,
  getCommitmentsByType,
  getCommitmentsByStatus
} from '../controllers/commitment.controller';
import { verifyToken, isAdmin, isUser } from '../middleware/auth.middleware';
import { body, param } from 'express-validator';
import { CommitmentType, CommitmentStatus } from '../models/Commitment';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get all commitments
router.get('/', getAllCommitments);

// Get commitment by ID
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid commitment ID')],
  getCommitmentById
);

// Get commitments by type
router.get(
  '/type/:type',
  [param('type').isIn(Object.values(CommitmentType)).withMessage('Invalid commitment type')],
  getCommitmentsByType
);

// Get commitments by status
router.get(
  '/status/:status',
  [param('status').isIn(Object.values(CommitmentStatus)).withMessage('Invalid commitment status')],
  getCommitmentsByStatus
);

// Create commitment (admin/user only)
router.post(
  '/',
  isUser,
  [
    body('commitmentNumber').notEmpty().withMessage('Commitment number is required'),
    body('activityDescription').notEmpty().withMessage('Activity description is required'),
    body('commitmentType')
      .isIn(Object.values(CommitmentType))
      .withMessage('Invalid commitment type'),
    body('accountType').optional(),
    body('commitmentDate').optional().isISO8601().withMessage('Commitment date must be a valid date'),
    body('obligationDate').optional().isISO8601().withMessage('Obligation date must be a valid date'),
    body('status')
      .optional()
      .isIn(Object.values(CommitmentStatus))
      .withMessage('Invalid commitment status'),
    body('amountCommitted')
      .isNumeric()
      .withMessage('Amount committed must be a number')
      .isFloat({ min: 0 })
      .withMessage('Amount committed must be positive'),
    body('amountObligated')
      .optional()
      .isNumeric()
      .withMessage('Amount obligated must be a number')
      .isFloat({ min: 0 })
      .withMessage('Amount obligated must be positive'),
    body('amountExpended')
      .optional()
      .isNumeric()
      .withMessage('Amount expended must be a number')
      .isFloat({ min: 0 })
      .withMessage('Amount expended must be positive'),
    body('projectedFullExpenditureDate')
      .optional()
      .isISO8601()
      .withMessage('Projected full expenditure date must be a valid date'),
    body('notes').optional()
  ],
  createCommitment
);

// Update commitment (admin/user only)
router.put(
  '/:id',
  isUser,
  [
    param('id').isUUID().withMessage('Invalid commitment ID'),
    body('commitmentNumber').optional().notEmpty().withMessage('Commitment number cannot be empty'),
    body('activityDescription').optional().notEmpty().withMessage('Activity description cannot be empty'),
    body('commitmentType')
      .optional()
      .isIn(Object.values(CommitmentType))
      .withMessage('Invalid commitment type'),
    body('accountType').optional(),
    body('commitmentDate').optional().isISO8601().withMessage('Commitment date must be a valid date'),
    body('obligationDate').optional().isISO8601().withMessage('Obligation date must be a valid date'),
    body('status')
      .optional()
      .isIn(Object.values(CommitmentStatus))
      .withMessage('Invalid commitment status'),
    body('amountCommitted')
      .optional()
      .isNumeric()
      .withMessage('Amount committed must be a number')
      .isFloat({ min: 0 })
      .withMessage('Amount committed must be positive'),
    body('amountObligated')
      .optional()
      .isNumeric()
      .withMessage('Amount obligated must be a number')
      .isFloat({ min: 0 })
      .withMessage('Amount obligated must be positive'),
    body('amountExpended')
      .optional()
      .isNumeric()
      .withMessage('Amount expended must be a number')
      .isFloat({ min: 0 })
      .withMessage('Amount expended must be positive'),
    body('projectedFullExpenditureDate')
      .optional()
      .isISO8601()
      .withMessage('Projected full expenditure date must be a valid date'),
    body('notes').optional()
  ],
  updateCommitment
);

// Delete commitment (admin only)
router.delete(
  '/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Invalid commitment ID')],
  deleteCommitment
);

export default router;
