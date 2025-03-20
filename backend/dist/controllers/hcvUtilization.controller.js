"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHCVUtilizationDashboard = exports.getHCVUtilizationTrends = exports.getHCVUtilizationByDateRange = exports.getHCVUtilizationByType = exports.deleteHCVUtilization = exports.updateHCVUtilization = exports.createHCVUtilization = exports.getHCVUtilizationById = exports.getAllHCVUtilization = void 0;
const database_1 = require("../config/database");
const HCVUtilization_1 = require("../models/HCVUtilization");
const class_validator_1 = require("class-validator");
// HCV Utilization repository
const hcvUtilizationRepository = database_1.AppDataSource.getRepository(HCVUtilization_1.HCVUtilization);
// Get all HCV utilization records
const getAllHCVUtilization = async (req, res) => {
    try {
        const utilization = await hcvUtilizationRepository.find({
            order: { reportingDate: 'DESC' }
        });
        res.status(200).json({
            status: 'success',
            data: utilization
        });
        return;
    }
    catch (error) {
        console.error('Get all HCV utilization error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get HCV utilization data'
        });
        return;
    }
};
exports.getAllHCVUtilization = getAllHCVUtilization;
// Get HCV utilization by ID
const getHCVUtilizationById = async (req, res) => {
    try {
        const { id } = req.params;
        const utilization = await hcvUtilizationRepository.findOne({
            where: { id }
        });
        if (!utilization) {
            res.status(404).json({
                status: 'error',
                message: 'HCV utilization record not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: utilization
        });
        return;
    }
    catch (error) {
        console.error('Get HCV utilization by ID error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get HCV utilization record'
        });
        return;
    }
};
exports.getHCVUtilizationById = getHCVUtilizationById;
// Create HCV utilization record
const createHCVUtilization = async (req, res) => {
    try {
        const { reportingDate, voucherType, authorizedVouchers, leasedVouchers, utilizationRate, hapExpenses, averageHapPerUnit, budgetUtilization, notes } = req.body;
        // Create new HCV utilization record
        const utilization = new HCVUtilization_1.HCVUtilization();
        utilization.reportingDate = new Date(reportingDate);
        utilization.voucherType = voucherType;
        utilization.authorizedVouchers = authorizedVouchers;
        utilization.leasedVouchers = leasedVouchers;
        utilization.utilizationRate = utilizationRate;
        utilization.hapExpenses = hapExpenses;
        if (averageHapPerUnit)
            utilization.averageHapPerUnit = averageHapPerUnit;
        if (budgetUtilization)
            utilization.budgetUtilization = budgetUtilization;
        if (notes)
            utilization.notes = notes;
        // Validate utilization data
        const errors = await (0, class_validator_1.validate)(utilization);
        if (errors.length > 0) {
            res.status(400).json({
                status: 'error',
                message: 'Validation error',
                errors: errors.map(error => ({
                    property: error.property,
                    constraints: error.constraints
                }))
            });
            return;
        }
        // Save utilization to database
        await hcvUtilizationRepository.save(utilization);
        res.status(201).json({
            status: 'success',
            message: 'HCV utilization record created successfully',
            data: utilization
        });
        return;
    }
    catch (error) {
        console.error('Create HCV utilization error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create HCV utilization record'
        });
        return;
    }
};
exports.createHCVUtilization = createHCVUtilization;
// Update HCV utilization record
const updateHCVUtilization = async (req, res) => {
    try {
        const { id } = req.params;
        const { reportingDate, voucherType, authorizedVouchers, leasedVouchers, utilizationRate, hapExpenses, averageHapPerUnit, budgetUtilization, notes } = req.body;
        // Find utilization record
        const utilization = await hcvUtilizationRepository.findOne({
            where: { id }
        });
        if (!utilization) {
            res.status(404).json({
                status: 'error',
                message: 'HCV utilization record not found'
            });
            return;
        }
        // Update utilization fields
        if (reportingDate)
            utilization.reportingDate = new Date(reportingDate);
        if (voucherType)
            utilization.voucherType = voucherType;
        if (authorizedVouchers !== undefined)
            utilization.authorizedVouchers = authorizedVouchers;
        if (leasedVouchers !== undefined)
            utilization.leasedVouchers = leasedVouchers;
        if (utilizationRate !== undefined)
            utilization.utilizationRate = utilizationRate;
        if (hapExpenses !== undefined)
            utilization.hapExpenses = hapExpenses;
        if (averageHapPerUnit !== undefined)
            utilization.averageHapPerUnit = averageHapPerUnit;
        if (budgetUtilization !== undefined)
            utilization.budgetUtilization = budgetUtilization;
        if (notes !== undefined)
            utilization.notes = notes;
        // Validate updated utilization data
        const errors = await (0, class_validator_1.validate)(utilization);
        if (errors.length > 0) {
            res.status(400).json({
                status: 'error',
                message: 'Validation error',
                errors: errors.map(error => ({
                    property: error.property,
                    constraints: error.constraints
                }))
            });
            return;
        }
        // Save updated utilization
        await hcvUtilizationRepository.save(utilization);
        res.status(200).json({
            status: 'success',
            message: 'HCV utilization record updated successfully',
            data: utilization
        });
        return;
    }
    catch (error) {
        console.error('Update HCV utilization error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update HCV utilization record'
        });
        return;
    }
};
exports.updateHCVUtilization = updateHCVUtilization;
// Delete HCV utilization record
const deleteHCVUtilization = async (req, res) => {
    try {
        const { id } = req.params;
        // Find utilization record
        const utilization = await hcvUtilizationRepository.findOne({
            where: { id }
        });
        if (!utilization) {
            res.status(404).json({
                status: 'error',
                message: 'HCV utilization record not found'
            });
            return;
        }
        // Delete utilization record
        await hcvUtilizationRepository.remove(utilization);
        res.status(200).json({
            status: 'success',
            message: 'HCV utilization record deleted successfully'
        });
        return;
    }
    catch (error) {
        console.error('Delete HCV utilization error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete HCV utilization record'
        });
        return;
    }
};
exports.deleteHCVUtilization = deleteHCVUtilization;
// Get HCV utilization by voucher type
const getHCVUtilizationByType = async (req, res) => {
    try {
        const { type } = req.params;
        // Validate voucher type
        if (!Object.values(HCVUtilization_1.VoucherType).includes(type)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid voucher type'
            });
            return;
        }
        const utilization = await hcvUtilizationRepository.find({
            where: { voucherType: type },
            order: { reportingDate: 'DESC' }
        });
        res.status(200).json({
            status: 'success',
            data: utilization
        });
        return;
    }
    catch (error) {
        console.error('Get HCV utilization by type error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get HCV utilization by type'
        });
        return;
    }
};
exports.getHCVUtilizationByType = getHCVUtilizationByType;
// Get HCV utilization by date range
const getHCVUtilizationByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({
                status: 'error',
                message: 'Start date and end date are required'
            });
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid date format'
            });
            return;
        }
        const utilization = await hcvUtilizationRepository
            .createQueryBuilder('utilization')
            .where('utilization.reportingDate >= :startDate', { startDate: start })
            .andWhere('utilization.reportingDate <= :endDate', { endDate: end })
            .orderBy('utilization.reportingDate', 'DESC')
            .getMany();
        res.status(200).json({
            status: 'success',
            data: utilization
        });
        return;
    }
    catch (error) {
        console.error('Get HCV utilization by date range error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get HCV utilization by date range'
        });
        return;
    }
};
exports.getHCVUtilizationByDateRange = getHCVUtilizationByDateRange;
// Get HCV utilization trends
const getHCVUtilizationTrends = async (req, res) => {
    try {
        const { months } = req.query;
        let monthsToFetch = 12; // Default to 12 months
        if (months && !isNaN(parseInt(months))) {
            monthsToFetch = parseInt(months);
        }
        // Calculate date range (last X months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsToFetch);
        // Get monthly data grouped by voucher type
        const trends = await hcvUtilizationRepository
            .createQueryBuilder('utilization')
            .select("TO_CHAR(utilization.reportingDate, 'YYYY-MM')", 'month')
            .addSelect('utilization.voucherType', 'voucherType')
            .addSelect('SUM(utilization.authorizedVouchers)', 'totalAuthorized')
            .addSelect('SUM(utilization.leasedVouchers)', 'totalLeased')
            .addSelect('AVG(utilization.utilizationRate)', 'avgUtilizationRate')
            .addSelect('SUM(utilization.hapExpenses)', 'totalHapExpenses')
            .addSelect('AVG(utilization.averageHapPerUnit)', 'avgHapPerUnit')
            .where('utilization.reportingDate >= :startDate', { startDate })
            .andWhere('utilization.reportingDate <= :endDate', { endDate })
            .groupBy("TO_CHAR(utilization.reportingDate, 'YYYY-MM')")
            .addGroupBy('utilization.voucherType')
            .orderBy("TO_CHAR(utilization.reportingDate, 'YYYY-MM')", 'ASC')
            .addOrderBy('utilization.voucherType', 'ASC')
            .getRawMany();
        res.status(200).json({
            status: 'success',
            data: trends
        });
        return;
    }
    catch (error) {
        console.error('Get HCV utilization trends error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get HCV utilization trends'
        });
        return;
    }
};
exports.getHCVUtilizationTrends = getHCVUtilizationTrends;
// Get HCV utilization dashboard summary
const getHCVUtilizationDashboard = async (req, res) => {
    try {
        // Get current month and year
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        // Get latest utilization data
        const latestUtilization = await hcvUtilizationRepository.find({
            order: { reportingDate: 'DESC' },
            take: 1
        });
        // Get YTD utilization data
        const startOfYear = new Date(currentYear, 0, 1); // January 1st of current year
        const ytdUtilization = await hcvUtilizationRepository
            .createQueryBuilder('utilization')
            .select('SUM(utilization.leasedVouchers)', 'totalLeasedYTD')
            .addSelect('SUM(utilization.authorizedVouchers)', 'totalAuthorizedYTD')
            .addSelect('AVG(utilization.utilizationRate)', 'avgUtilizationRateYTD')
            .addSelect('SUM(utilization.hapExpenses)', 'totalHapExpensesYTD')
            .where('utilization.reportingDate >= :startOfYear', { startOfYear })
            .getRawOne();
        // Get utilization by voucher type (current year)
        const utilizationByType = await hcvUtilizationRepository
            .createQueryBuilder('utilization')
            .select('utilization.voucherType', 'voucherType')
            .addSelect('AVG(utilization.utilizationRate)', 'avgUtilizationRate')
            .addSelect('SUM(utilization.leasedVouchers)', 'totalLeased')
            .addSelect('SUM(utilization.authorizedVouchers)', 'totalAuthorized')
            .where('utilization.reportingDate >= :startOfYear', { startOfYear })
            .groupBy('utilization.voucherType')
            .getRawMany();
        // Get monthly trend for current year
        const monthlyTrend = await hcvUtilizationRepository
            .createQueryBuilder('utilization')
            .select("TO_CHAR(utilization.reportingDate, 'YYYY-MM')", 'month')
            .addSelect('SUM(utilization.leasedVouchers)', 'totalLeased')
            .addSelect('SUM(utilization.authorizedVouchers)', 'totalAuthorized')
            .addSelect('AVG(utilization.utilizationRate)', 'avgUtilizationRate')
            .addSelect('SUM(utilization.hapExpenses)', 'totalHapExpenses')
            .where('EXTRACT(YEAR FROM utilization.reportingDate) = :year', { year: currentYear })
            .groupBy("TO_CHAR(utilization.reportingDate, 'YYYY-MM')")
            .orderBy("TO_CHAR(utilization.reportingDate, 'YYYY-MM')", 'ASC')
            .getRawMany();
        res.status(200).json({
            status: 'success',
            data: {
                latestUtilization: latestUtilization[0] || null,
                ytdUtilization,
                utilizationByType,
                monthlyTrend
            }
        });
        return;
    }
    catch (error) {
        console.error('Get HCV utilization dashboard error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get HCV utilization dashboard'
        });
        return;
    }
};
exports.getHCVUtilizationDashboard = getHCVUtilizationDashboard;
