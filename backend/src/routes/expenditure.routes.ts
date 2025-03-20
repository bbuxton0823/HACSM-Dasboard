import { Router } from 'express';
import { 
  getAllExpenditures,
  getExpenditureById,
  createExpenditure,
  updateExpenditure,
  deleteExpenditure,
  getExpendituresByType,
  getExpendituresByDateRange,
  getExpenditureSummaryByType,
  getMonthlyExpenditureSummary
} from '../controllers/expenditure.controller';
import { verifyToken, isAdmin, isUser } from '../middleware/auth.middleware';
import { body, param, query } from 'express-validator';
import { ExpenditureType } from '../models/HAPExpenditure';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get all expenditures
router.get('/', getAllExpenditures);

// Get expenditure by ID
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid expenditure ID')],
  getExpenditureById
);

// Get expenditures by type
router.get(
  '/type/:type',
  [param('type').isIn(Object.values(ExpenditureType)).withMessage('Invalid expenditure type')],
  getExpendituresByType
);

// Get expenditures by date range
router.get(
  '/date-range',
  [
    query('startDate').isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').isISO8601().withMessage('End date must be a valid date')
  ],
  getExpendituresByDateRange
);

// Get expenditure summary by type
router.get(
  '/summary/by-type',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  getExpenditureSummaryByType
);

// Get monthly expenditure summary
router.get(
  '/summary/monthly/:year',
  [param('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required')],
  getMonthlyExpenditureSummary
);

// Create expenditure (admin/user only)
router.post(
  '/',
  isUser,
  [
    body('expenditureDate').isISO8601().withMessage('Expenditure date must be a valid date'),
    body('expenditureType')
      .isIn(Object.values(ExpenditureType))
      .withMessage('Invalid expenditure type'),
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Amount must be positive'),
    body('description').optional(),
    body('notes').optional()
  ],
  createExpenditure
);

// Update expenditure (admin/user only)
router.put(
  '/:id',
  isUser,
  [
    param('id').isUUID().withMessage('Invalid expenditure ID'),
    body('expenditureDate').optional().isISO8601().withMessage('Expenditure date must be a valid date'),
    body('expenditureType')
      .optional()
      .isIn(Object.values(ExpenditureType))
      .withMessage('Invalid expenditure type'),
    body('amount')
      .optional()
      .isNumeric()
      .withMessage('Amount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Amount must be positive'),
    body('description').optional(),
    body('notes').optional()
  ],
  updateExpenditure
);

// Delete expenditure (admin only)
router.delete(
  '/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Invalid expenditure ID')],
  deleteExpenditure
);

export default router;
