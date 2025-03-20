import { Router } from 'express';
import { 
  getDashboardSummary,
  getAllBudgetAuthorities,
  getBudgetAuthorityById,
  createBudgetAuthority,
  updateBudgetAuthority,
  deleteBudgetAuthority,
  getAllMTWReserves,
  getMTWReserveById,
  createMTWReserve,
  updateMTWReserve,
  deleteMTWReserve
} from '../controllers/budget.controller';
import { verifyToken, isAdmin, isUser } from '../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Dashboard summary route
router.get('/dashboard-summary', getDashboardSummary);

// Budget Authority routes
router.get('/budget-authorities', getAllBudgetAuthorities);
router.get(
  '/budget-authorities/:id',
  [param('id').isUUID().withMessage('Invalid budget authority ID')],
  getBudgetAuthorityById
);

// Create budget authority (admin/user only)
router.post(
  '/budget-authorities',
  isUser,
  [
    body('totalBudgetAmount')
      .isNumeric()
      .withMessage('Total budget amount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Total budget amount must be positive'),
    body('fiscalYear')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Fiscal year must be a valid year'),
    body('effectiveDate')
      .isISO8601()
      .withMessage('Effective date must be a valid date'),
    body('expirationDate')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be a valid date'),
    body('notes').optional(),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  createBudgetAuthority
);

// Update budget authority (admin/user only)
router.put(
  '/budget-authorities/:id',
  isUser,
  [
    param('id').isUUID().withMessage('Invalid budget authority ID'),
    body('totalBudgetAmount')
      .optional()
      .isNumeric()
      .withMessage('Total budget amount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Total budget amount must be positive'),
    body('fiscalYear')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Fiscal year must be a valid year'),
    body('effectiveDate')
      .optional()
      .isISO8601()
      .withMessage('Effective date must be a valid date'),
    body('expirationDate')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be a valid date'),
    body('notes').optional(),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  updateBudgetAuthority
);

// Delete budget authority (admin only)
router.delete(
  '/budget-authorities/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Invalid budget authority ID')],
  deleteBudgetAuthority
);

// MTW Reserve routes
router.get('/mtw-reserves', getAllMTWReserves);
router.get(
  '/mtw-reserves/:id',
  [param('id').isUUID().withMessage('Invalid MTW reserve ID')],
  getMTWReserveById
);

// Create MTW reserve (admin/user only)
router.post(
  '/mtw-reserves',
  isUser,
  [
    body('reserveAmount')
      .isNumeric()
      .withMessage('Reserve amount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Reserve amount must be positive'),
    body('asOfDate')
      .isISO8601()
      .withMessage('As of date must be a valid date'),
    body('minimumReserveLevel')
      .optional()
      .isNumeric()
      .withMessage('Minimum reserve level must be a number')
      .isFloat({ min: 0 })
      .withMessage('Minimum reserve level must be positive'),
    body('notes').optional()
  ],
  createMTWReserve
);

// Update MTW reserve (admin/user only)
router.put(
  '/mtw-reserves/:id',
  isUser,
  [
    param('id').isUUID().withMessage('Invalid MTW reserve ID'),
    body('reserveAmount')
      .optional()
      .isNumeric()
      .withMessage('Reserve amount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Reserve amount must be positive'),
    body('asOfDate')
      .optional()
      .isISO8601()
      .withMessage('As of date must be a valid date'),
    body('minimumReserveLevel')
      .optional()
      .isNumeric()
      .withMessage('Minimum reserve level must be a number')
      .isFloat({ min: 0 })
      .withMessage('Minimum reserve level must be positive'),
    body('notes').optional()
  ],
  updateMTWReserve
);

// Delete MTW reserve (admin only)
router.delete(
  '/mtw-reserves/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Invalid MTW reserve ID')],
  deleteMTWReserve
);

export default router;
