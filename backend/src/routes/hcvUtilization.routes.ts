import { Router } from 'express';
import { 
  getAllHCVUtilization,
  getHCVUtilizationById,
  createHCVUtilization,
  updateHCVUtilization,
  deleteHCVUtilization,
  getHCVUtilizationByType,
  getHCVUtilizationByDateRange,
  getHCVUtilizationTrends,
  getHCVUtilizationDashboard
} from '../controllers/hcvUtilization.controller';
import { verifyToken, isAdmin, isUser } from '../middleware/auth.middleware';
import { body, param, query } from 'express-validator';
import { VoucherType } from '../models/HCVUtilization';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get all HCV utilization records
router.get('/', getAllHCVUtilization);

// Get HCV utilization dashboard summary
router.get('/dashboard', getHCVUtilizationDashboard);

// Get HCV utilization trends
router.get(
  '/trends',
  [query('months').optional().isInt({ min: 1 }).withMessage('Months must be a positive integer')],
  getHCVUtilizationTrends
);

// Get HCV utilization by ID
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid HCV utilization ID')],
  getHCVUtilizationById
);

// Get HCV utilization by voucher type
router.get(
  '/type/:type',
  [param('type').isIn(Object.values(VoucherType)).withMessage('Invalid voucher type')],
  getHCVUtilizationByType
);

// Get HCV utilization by date range
router.get(
  '/date-range',
  [
    query('startDate').isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').isISO8601().withMessage('End date must be a valid date')
  ],
  getHCVUtilizationByDateRange
);

// Create HCV utilization record (admin/user only)
router.post(
  '/',
  isUser,
  [
    body('reportingDate').isISO8601().withMessage('Reporting date must be a valid date'),
    body('voucherType')
      .isIn(Object.values(VoucherType))
      .withMessage('Invalid voucher type'),
    body('authorizedVouchers')
      .isInt({ min: 0 })
      .withMessage('Authorized vouchers must be a positive integer'),
    body('leasedVouchers')
      .isInt({ min: 0 })
      .withMessage('Leased vouchers must be a positive integer'),
    body('utilizationRate')
      .isFloat({ min: 0 })
      .withMessage('Utilization rate must be a positive number'),
    body('hapExpenses')
      .isFloat({ min: 0 })
      .withMessage('HAP expenses must be a positive number'),
    body('averageHapPerUnit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Average HAP per unit must be a positive number'),
    body('budgetUtilization')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Budget utilization must be a positive number'),
    body('notes').optional()
  ],
  createHCVUtilization
);

// Update HCV utilization record (admin/user only)
router.put(
  '/:id',
  isUser,
  [
    param('id').isUUID().withMessage('Invalid HCV utilization ID'),
    body('reportingDate').optional().isISO8601().withMessage('Reporting date must be a valid date'),
    body('voucherType')
      .optional()
      .isIn(Object.values(VoucherType))
      .withMessage('Invalid voucher type'),
    body('authorizedVouchers')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Authorized vouchers must be a positive integer'),
    body('leasedVouchers')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Leased vouchers must be a positive integer'),
    body('utilizationRate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Utilization rate must be a positive number'),
    body('hapExpenses')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('HAP expenses must be a positive number'),
    body('averageHapPerUnit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Average HAP per unit must be a positive number'),
    body('budgetUtilization')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Budget utilization must be a positive number'),
    body('notes').optional()
  ],
  updateHCVUtilization
);

// Delete HCV utilization record (admin only)
router.delete(
  '/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Invalid HCV utilization ID')],
  deleteHCVUtilization
);

export default router;
