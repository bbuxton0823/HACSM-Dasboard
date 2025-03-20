"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyExpenditureSummary = exports.getExpenditureSummaryByType = exports.getExpendituresByDateRange = exports.getExpendituresByType = exports.deleteExpenditure = exports.updateExpenditure = exports.createExpenditure = exports.getExpenditureById = exports.getAllExpenditures = void 0;
const database_1 = require("../config/database");
const HAPExpenditure_1 = require("../models/HAPExpenditure");
const class_validator_1 = require("class-validator");
// Expenditure repository
const expenditureRepository = database_1.AppDataSource.getRepository(HAPExpenditure_1.HAPExpenditure);
// Get all expenditures
const getAllExpenditures = async (req, res) => {
    try {
        const expenditures = await expenditureRepository.find({
            order: { expenditureDate: 'DESC' }
        });
        res.status(200).json({
            status: 'success',
            data: expenditures
        });
        return;
    }
    catch (error) {
        console.error('Get all expenditures error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get expenditures'
        });
        return;
    }
};
exports.getAllExpenditures = getAllExpenditures;
// Get expenditure by ID
const getExpenditureById = async (req, res) => {
    try {
        const { id } = req.params;
        const expenditure = await expenditureRepository.findOne({
            where: { id }
        });
        if (!expenditure) {
            res.status(404).json({
                status: 'error',
                message: 'Expenditure not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: expenditure
        });
        return;
    }
    catch (error) {
        console.error('Get expenditure by ID error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get expenditure'
        });
        return;
    }
};
exports.getExpenditureById = getExpenditureById;
// Create expenditure
const createExpenditure = async (req, res) => {
    try {
        const { expenditureDate, expenditureType, amount, description, notes } = req.body;
        // Create new expenditure
        const expenditure = new HAPExpenditure_1.HAPExpenditure();
        expenditure.expenditureDate = new Date(expenditureDate);
        expenditure.expenditureType = expenditureType;
        expenditure.amount = amount;
        if (description)
            expenditure.description = description;
        if (notes)
            expenditure.notes = notes;
        // Validate expenditure data
        const errors = await (0, class_validator_1.validate)(expenditure);
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
        // Save expenditure to database
        await expenditureRepository.save(expenditure);
        res.status(201).json({
            status: 'success',
            message: 'Expenditure created successfully',
            data: expenditure
        });
        return;
    }
    catch (error) {
        console.error('Create expenditure error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create expenditure'
        });
    }
};
exports.createExpenditure = createExpenditure;
// Update expenditure
const updateExpenditure = async (req, res) => {
    try {
        const { id } = req.params;
        const { expenditureDate, expenditureType, amount, description, notes } = req.body;
        // Find expenditure
        const expenditure = await expenditureRepository.findOne({
            where: { id }
        });
        if (!expenditure) {
            res.status(404).json({
                status: 'error',
                message: 'Expenditure not found'
            });
            return;
        }
        // Update expenditure fields
        if (expenditureDate)
            expenditure.expenditureDate = new Date(expenditureDate);
        if (expenditureType)
            expenditure.expenditureType = expenditureType;
        if (amount !== undefined)
            expenditure.amount = amount;
        if (description !== undefined)
            expenditure.description = description;
        if (notes !== undefined)
            expenditure.notes = notes;
        // Validate updated expenditure data
        const errors = await (0, class_validator_1.validate)(expenditure);
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
        // Save updated expenditure
        await expenditureRepository.save(expenditure);
        res.status(200).json({
            status: 'success',
            message: 'Expenditure updated successfully',
            data: expenditure
        });
        return;
    }
    catch (error) {
        console.error('Update expenditure error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update expenditure'
        });
    }
};
exports.updateExpenditure = updateExpenditure;
// Delete expenditure
const deleteExpenditure = async (req, res) => {
    try {
        const { id } = req.params;
        // Find expenditure
        const expenditure = await expenditureRepository.findOne({
            where: { id }
        });
        if (!expenditure) {
            res.status(404).json({
                status: 'error',
                message: 'Expenditure not found'
            });
            return;
        }
        // Delete expenditure
        await expenditureRepository.remove(expenditure);
        res.status(200).json({
            status: 'success',
            message: 'Expenditure deleted successfully'
        });
        return;
    }
    catch (error) {
        console.error('Delete expenditure error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete expenditure'
        });
    }
};
exports.deleteExpenditure = deleteExpenditure;
// Get expenditures by type
const getExpendituresByType = async (req, res) => {
    try {
        const { type } = req.params;
        // Validate expenditure type
        if (!Object.values(HAPExpenditure_1.ExpenditureType).includes(type)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid expenditure type'
            });
            return;
        }
        const expenditures = await expenditureRepository.find({
            where: { expenditureType: type },
            order: { expenditureDate: 'DESC' }
        });
        res.status(200).json({
            status: 'success',
            data: expenditures
        });
        return;
    }
    catch (error) {
        console.error('Get expenditures by type error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get expenditures by type'
        });
    }
};
exports.getExpendituresByType = getExpendituresByType;
// Get expenditures by date range
const getExpendituresByDateRange = async (req, res) => {
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
        const expenditures = await expenditureRepository
            .createQueryBuilder('expenditure')
            .where('expenditure.expenditureDate >= :startDate', { startDate: start })
            .andWhere('expenditure.expenditureDate <= :endDate', { endDate: end })
            .orderBy('expenditure.expenditureDate', 'DESC')
            .getMany();
        res.status(200).json({
            status: 'success',
            data: expenditures
        });
        return;
    }
    catch (error) {
        console.error('Get expenditures by date range error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get expenditures by date range'
        });
    }
};
exports.getExpendituresByDateRange = getExpendituresByDateRange;
// Get expenditure summary by type
const getExpenditureSummaryByType = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryBuilder = expenditureRepository
            .createQueryBuilder('expenditure')
            .select('expenditure.expenditureType', 'type')
            .addSelect('SUM(expenditure.amount)', 'total');
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                queryBuilder = queryBuilder
                    .where('expenditure.expenditureDate >= :startDate', { startDate: start })
                    .andWhere('expenditure.expenditureDate <= :endDate', { endDate: end });
            }
        }
        const summary = await queryBuilder
            .groupBy('expenditure.expenditureType')
            .getRawMany();
        res.status(200).json({
            status: 'success',
            data: summary
        });
        return;
    }
    catch (error) {
        console.error('Get expenditure summary by type error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get expenditure summary by type'
        });
    }
};
exports.getExpenditureSummaryByType = getExpenditureSummaryByType;
// Get monthly expenditure summary
const getMonthlyExpenditureSummary = async (req, res) => {
    try {
        const { year } = req.params;
        if (!year || isNaN(parseInt(year))) {
            res.status(400).json({
                status: 'error',
                message: 'Valid year is required'
            });
            return;
        }
        const yearNum = parseInt(year);
        const startDate = new Date(yearNum, 0, 1); // January 1st of the year
        const endDate = new Date(yearNum, 11, 31); // December 31st of the year
        const summary = await expenditureRepository
            .createQueryBuilder('expenditure')
            .select("TO_CHAR(expenditure.expenditureDate, 'YYYY-MM')", 'month')
            .addSelect('expenditure.expenditureType', 'type')
            .addSelect('SUM(expenditure.amount)', 'total')
            .where('expenditure.expenditureDate >= :startDate', { startDate })
            .andWhere('expenditure.expenditureDate <= :endDate', { endDate })
            .groupBy("TO_CHAR(expenditure.expenditureDate, 'YYYY-MM')")
            .addGroupBy('expenditure.expenditureType')
            .orderBy("TO_CHAR(expenditure.expenditureDate, 'YYYY-MM')", 'ASC')
            .addOrderBy('expenditure.expenditureType', 'ASC')
            .getRawMany();
        res.status(200).json({
            status: 'success',
            data: summary
        });
        return;
    }
    catch (error) {
        console.error('Get monthly expenditure summary error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get monthly expenditure summary'
        });
    }
};
exports.getMonthlyExpenditureSummary = getMonthlyExpenditureSummary;
