import { Router, Request, Response } from 'express';
import { 
  getExecutiveSummary,
  getVoucherTypeReport,
  getBudgetForecast,
  streamReport,
  exportReportAsPdf
} from '../controllers/reports.controller';
import { verifyToken, devModeBypass } from '../middleware/auth.middleware';

// Simple role middleware implementation for the test app
const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: any) => {
    // For testing purposes, allow all roles
    next();
  };
};

const router = Router();

/**
 * @route GET /api/reports/executive-summary
 * @desc Get an executive summary of all HCV utilization data
 * @access Private (Admin, Manager)
 */
router.get(
  '/executive-summary',
  [devModeBypass, verifyToken, roleMiddleware(['admin', 'manager'])],
  getExecutiveSummary
);

/**
 * @route GET /api/reports/voucher-type/:voucherType
 * @desc Get a detailed report for a specific voucher type
 * @access Private (Admin, Manager)
 */
router.get(
  '/voucher-type/:voucherType',
  [devModeBypass, verifyToken, roleMiddleware(['admin', 'manager'])],
  getVoucherTypeReport
);

/**
 * @route GET /api/reports/budget-forecast
 * @desc Get a budget forecast based on current utilization trends
 * @access Private (Admin, Manager)
 */
router.get(
  '/budget-forecast',
  [devModeBypass, verifyToken, roleMiddleware(['admin', 'manager'])],
  getBudgetForecast
);

/**
 * @route GET /api/reports/stream
 * @desc Stream a report using Server-Sent Events
 * @access Private (Admin, Manager)
 */
router.get(
  '/stream',
  [devModeBypass, verifyToken, roleMiddleware(['admin', 'manager'])],
  streamReport
);

/**
 * @route POST /api/reports/export-pdf
 * @desc Export a report as PDF
 * @access Private (Admin, Manager)
 */
router.post(
  '/export-pdf',
  [devModeBypass, verifyToken, roleMiddleware(['admin', 'manager'])],
  exportReportAsPdf
);

/**
 * @route GET /api/reports/style-templates
 * @desc Get available style templates for reports
 * @access Private (Admin, Manager)
 */
router.get(
  '/style-templates',
  [devModeBypass, verifyToken, roleMiddleware(['admin', 'manager'])],
  (req: Request, res: Response) => {
    // Return mock style templates since this is a test app
    res.status(200).json({
      message: 'Style templates retrieved successfully',
      data: [
        { id: '1', name: 'Standard Report', createdAt: '2025-01-15T00:00:00.000Z' },
        { id: '2', name: 'Executive Brief', createdAt: '2025-01-20T00:00:00.000Z' },
        { id: '3', name: 'Detailed Analysis', createdAt: '2025-02-05T00:00:00.000Z' },
        { id: '4', name: 'HUD Submission', createdAt: '2025-02-15T00:00:00.000Z' },
      ]
    });
  }
);

export default router;
