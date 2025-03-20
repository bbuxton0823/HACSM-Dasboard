"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("../controllers/reports.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
// Simple role middleware implementation for the test app
const roleMiddleware = (roles) => {
    return (req, res, next) => {
        // For testing purposes, allow all roles
        next();
    };
};
const router = (0, express_1.Router)();
/**
 * @route GET /api/reports/executive-summary
 * @desc Get an executive summary of all HCV utilization data
 * @access Private (Admin, Manager)
 */
router.get('/executive-summary', [auth_middleware_1.devModeBypass, auth_middleware_1.verifyToken, roleMiddleware(['admin', 'manager'])], reports_controller_1.getExecutiveSummary);
/**
 * @route GET /api/reports/voucher-type/:voucherType
 * @desc Get a detailed report for a specific voucher type
 * @access Private (Admin, Manager)
 */
router.get('/voucher-type/:voucherType', [auth_middleware_1.devModeBypass, auth_middleware_1.verifyToken, roleMiddleware(['admin', 'manager'])], reports_controller_1.getVoucherTypeReport);
/**
 * @route GET /api/reports/budget-forecast
 * @desc Get a budget forecast based on current utilization trends
 * @access Private (Admin, Manager)
 */
router.get('/budget-forecast', [auth_middleware_1.devModeBypass, auth_middleware_1.verifyToken, roleMiddleware(['admin', 'manager'])], reports_controller_1.getBudgetForecast);
/**
 * @route GET /api/reports/stream
 * @desc Stream a report using Server-Sent Events
 * @access Private (Admin, Manager)
 */
router.get('/stream', [auth_middleware_1.devModeBypass, auth_middleware_1.verifyToken, roleMiddleware(['admin', 'manager'])], reports_controller_1.streamReport);
/**
 * @route POST /api/reports/export-pdf
 * @desc Export a report as PDF
 * @access Private (Admin, Manager)
 */
router.post('/export-pdf', [auth_middleware_1.devModeBypass, auth_middleware_1.verifyToken, roleMiddleware(['admin', 'manager'])], reports_controller_1.exportReportAsPdf);
/**
 * @route GET /api/reports/style-templates
 * @desc Get available style templates for reports
 * @access Private (Admin, Manager)
 */
router.get('/style-templates', [auth_middleware_1.devModeBypass, auth_middleware_1.verifyToken, roleMiddleware(['admin', 'manager'])], (req, res) => {
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
});
exports.default = router;
