"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMTWReserve = exports.updateMTWReserve = exports.createMTWReserve = exports.getMTWReserveById = exports.getAllMTWReserves = exports.deleteBudgetAuthority = exports.updateBudgetAuthority = exports.createBudgetAuthority = exports.getBudgetAuthorityById = exports.getAllBudgetAuthorities = exports.getDashboardSummary = void 0;
const database_1 = require("../config/database");
const BudgetAuthority_1 = require("../models/BudgetAuthority");
const MTWReserve_1 = require("../models/MTWReserve");
const HAPExpenditure_1 = require("../models/HAPExpenditure");
const Commitment_1 = require("../models/Commitment");
const class_validator_1 = require("class-validator");
// Repositories
const budgetRepository = database_1.AppDataSource.getRepository(BudgetAuthority_1.BudgetAuthority);
const reserveRepository = database_1.AppDataSource.getRepository(MTWReserve_1.MTWReserve);
const expenditureRepository = database_1.AppDataSource.getRepository(HAPExpenditure_1.HAPExpenditure);
const commitmentRepository = database_1.AppDataSource.getRepository(Commitment_1.Commitment);
// Get dashboard summary data
const getDashboardSummary = async (req, res) => {
    try {
        // Get current active budget authority
        const budgetAuthority = await budgetRepository.findOne({
            where: { isActive: true },
            order: { fiscalYear: 'DESC' }
        });
        if (!budgetAuthority) {
            res.status(404).json({
                status: 'error',
                message: 'No active budget authority found'
            });
            return;
        }
        // Get latest MTW reserve
        const mtwReserve = await reserveRepository.findOne({
            order: { asOfDate: 'DESC' }
        });
        // Calculate YTD HAP expenditures
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const ytdExpenditures = await expenditureRepository
            .createQueryBuilder('expenditure')
            .select('SUM(expenditure.amount)', 'total')
            .where('expenditure.expenditureDate >= :startDate', { startDate: startOfYear })
            .getRawOne();
        // Get commitments data
        const commitments = await commitmentRepository.find();
        // Calculate totals
        const totalCommitted = commitments.reduce((sum, commitment) => sum + Number(commitment.amountCommitted), 0);
        const totalObligated = commitments.reduce((sum, commitment) => sum + (commitment.amountObligated || 0), 0);
        const totalExpended = commitments.reduce((sum, commitment) => sum + (commitment.amountExpended || 0), 0);
        // Calculate planned commitments (not yet approved)
        const pendingCommitments = commitments.filter(c => c.status === Commitment_1.CommitmentStatus.PLANNED);
        const pendingAmount = pendingCommitments.reduce((sum, commitment) => sum + Number(commitment.amountCommitted), 0);
        // Calculate available budget
        const availableBudget = budgetAuthority.totalBudgetAmount - totalCommitted;
        // Calculate MTW reserve percentage
        const reservePercentage = mtwReserve
            ? (mtwReserve.reserveAmount / budgetAuthority.totalBudgetAmount) * 100
            : 0;
        res.status(200).json({
            status: 'success',
            data: {
                budgetAuthority: {
                    id: budgetAuthority.id,
                    totalBudgetAmount: budgetAuthority.totalBudgetAmount,
                    fiscalYear: budgetAuthority.fiscalYear,
                    effectiveDate: budgetAuthority.effectiveDate,
                    expirationDate: budgetAuthority.expirationDate
                },
                mtwReserve: mtwReserve ? {
                    id: mtwReserve.id,
                    amount: mtwReserve.reserveAmount,
                    asOfDate: mtwReserve.asOfDate,
                    percentage: reservePercentage.toFixed(2)
                } : null,
                ytdExpenditures: (ytdExpenditures === null || ytdExpenditures === void 0 ? void 0 : ytdExpenditures.total) || 0,
                commitments: {
                    total: totalCommitted,
                    obligated: totalObligated,
                    expended: totalExpended,
                    pending: pendingAmount
                },
                availableBudget
            }
        });
        return;
    }
    catch (error) {
        console.error('Get dashboard summary error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get dashboard summary'
        });
        return;
    }
};
exports.getDashboardSummary = getDashboardSummary;
// Budget Authority Controllers
// Get all budget authorities
const getAllBudgetAuthorities = async (req, res) => {
    try {
        const budgetAuthorities = await budgetRepository.find({
            order: { fiscalYear: 'DESC' }
        });
        res.status(200).json({
            status: 'success',
            data: budgetAuthorities
        });
        return;
    }
    catch (error) {
        console.error('Get all budget authorities error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get budget authorities'
        });
        return;
    }
};
exports.getAllBudgetAuthorities = getAllBudgetAuthorities;
// Get budget authority by ID
const getBudgetAuthorityById = async (req, res) => {
    try {
        const { id } = req.params;
        const budgetAuthority = await budgetRepository.findOne({
            where: { id }
        });
        if (!budgetAuthority) {
            res.status(404).json({
                status: 'error',
                message: 'Budget authority not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: budgetAuthority
        });
        return;
    }
    catch (error) {
        console.error('Get budget authority by ID error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get budget authority'
        });
        return;
    }
};
exports.getBudgetAuthorityById = getBudgetAuthorityById;
// Create budget authority
const createBudgetAuthority = async (req, res) => {
    try {
        const { totalBudgetAmount, fiscalYear, effectiveDate, expirationDate, notes } = req.body;
        // Create new budget authority
        const budgetAuthority = new BudgetAuthority_1.BudgetAuthority();
        budgetAuthority.totalBudgetAmount = totalBudgetAmount;
        budgetAuthority.fiscalYear = fiscalYear;
        budgetAuthority.effectiveDate = new Date(effectiveDate);
        if (expirationDate)
            budgetAuthority.expirationDate = new Date(expirationDate);
        if (notes)
            budgetAuthority.notes = notes;
        // Validate budget authority data
        const errors = await (0, class_validator_1.validate)(budgetAuthority);
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
        // If this is set as active, deactivate all other budget authorities
        if (req.body.isActive) {
            budgetAuthority.isActive = true;
            await budgetRepository.update({}, { isActive: false });
        }
        // Save budget authority to database
        await budgetRepository.save(budgetAuthority);
        res.status(201).json({
            status: 'success',
            message: 'Budget authority created successfully',
            data: budgetAuthority
        });
        return;
    }
    catch (error) {
        console.error('Create budget authority error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create budget authority'
        });
        return;
    }
};
exports.createBudgetAuthority = createBudgetAuthority;
// Update budget authority
const updateBudgetAuthority = async (req, res) => {
    try {
        const { id } = req.params;
        const { totalBudgetAmount, fiscalYear, effectiveDate, expirationDate, isActive, notes } = req.body;
        // Find budget authority
        const budgetAuthority = await budgetRepository.findOne({
            where: { id }
        });
        if (!budgetAuthority) {
            res.status(404).json({
                status: 'error',
                message: 'Budget authority not found'
            });
            return;
        }
        // Update budget authority fields
        if (totalBudgetAmount !== undefined)
            budgetAuthority.totalBudgetAmount = totalBudgetAmount;
        if (fiscalYear !== undefined)
            budgetAuthority.fiscalYear = fiscalYear;
        if (effectiveDate !== undefined)
            budgetAuthority.effectiveDate = new Date(effectiveDate);
        if (expirationDate !== undefined) {
            budgetAuthority.expirationDate = expirationDate ? new Date(expirationDate) : new Date();
        }
        if (notes !== undefined)
            budgetAuthority.notes = notes;
        // Validate updated budget authority data
        const errors = await (0, class_validator_1.validate)(budgetAuthority);
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
        // If this is set as active, deactivate all other budget authorities
        if (isActive) {
            budgetAuthority.isActive = true;
            await budgetRepository.createQueryBuilder()
                .update(BudgetAuthority_1.BudgetAuthority)
                .set({ isActive: false })
                .where("id != :id", { id })
                .execute();
        }
        // Save updated budget authority
        await budgetRepository.save(budgetAuthority);
        res.status(200).json({
            status: 'success',
            message: 'Budget authority updated successfully',
            data: budgetAuthority
        });
        return;
    }
    catch (error) {
        console.error('Update budget authority error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update budget authority'
        });
        return;
    }
};
exports.updateBudgetAuthority = updateBudgetAuthority;
// Delete budget authority
const deleteBudgetAuthority = async (req, res) => {
    try {
        const { id } = req.params;
        // Find budget authority
        const budgetAuthority = await budgetRepository.findOne({
            where: { id }
        });
        if (!budgetAuthority) {
            res.status(404).json({
                status: 'error',
                message: 'Budget authority not found'
            });
            return;
        }
        // Delete budget authority
        await budgetRepository.remove(budgetAuthority);
        res.status(200).json({
            status: 'success',
            message: 'Budget authority deleted successfully'
        });
        return;
    }
    catch (error) {
        console.error('Delete budget authority error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete budget authority'
        });
        return;
    }
};
exports.deleteBudgetAuthority = deleteBudgetAuthority;
// MTW Reserve Controllers
// Get all MTW reserves
const getAllMTWReserves = async (req, res) => {
    try {
        const mtwReserves = await reserveRepository.find({
            order: { asOfDate: 'DESC' }
        });
        res.status(200).json({
            status: 'success',
            data: mtwReserves
        });
        return;
    }
    catch (error) {
        console.error('Get all MTW reserves error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get MTW reserves'
        });
        return;
    }
};
exports.getAllMTWReserves = getAllMTWReserves;
// Get MTW reserve by ID
const getMTWReserveById = async (req, res) => {
    try {
        const { id } = req.params;
        const mtwReserve = await reserveRepository.findOne({
            where: { id }
        });
        if (!mtwReserve) {
            res.status(404).json({
                status: 'error',
                message: 'MTW reserve not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: mtwReserve
        });
        return;
    }
    catch (error) {
        console.error('Get MTW reserve by ID error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get MTW reserve'
        });
        return;
    }
};
exports.getMTWReserveById = getMTWReserveById;
// Create MTW reserve
const createMTWReserve = async (req, res) => {
    try {
        const { amount, asOfDate, notes } = req.body;
        // Create new MTW reserve
        const mtwReserve = new MTWReserve_1.MTWReserve();
        mtwReserve.reserveAmount = amount;
        mtwReserve.asOfDate = new Date(asOfDate);
        if (notes)
            mtwReserve.notes = notes;
        // Validate MTW reserve data
        const errors = await (0, class_validator_1.validate)(mtwReserve);
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
        // Save MTW reserve to database
        await reserveRepository.save(mtwReserve);
        res.status(201).json({
            status: 'success',
            message: 'MTW reserve created successfully',
            data: mtwReserve
        });
        return;
    }
    catch (error) {
        console.error('Create MTW reserve error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create MTW reserve'
        });
        return;
    }
};
exports.createMTWReserve = createMTWReserve;
// Update MTW reserve
const updateMTWReserve = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, asOfDate, notes } = req.body;
        // Find MTW reserve
        const mtwReserve = await reserveRepository.findOne({
            where: { id }
        });
        if (!mtwReserve) {
            res.status(404).json({
                status: 'error',
                message: 'MTW reserve not found'
            });
            return;
        }
        // Update MTW reserve fields
        if (amount !== undefined)
            mtwReserve.reserveAmount = amount;
        if (asOfDate !== undefined)
            mtwReserve.asOfDate = new Date(asOfDate);
        if (notes !== undefined)
            mtwReserve.notes = notes;
        // Validate updated MTW reserve data
        const errors = await (0, class_validator_1.validate)(mtwReserve);
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
        // Save updated MTW reserve
        await reserveRepository.save(mtwReserve);
        res.status(200).json({
            status: 'success',
            message: 'MTW reserve updated successfully',
            data: mtwReserve
        });
        return;
    }
    catch (error) {
        console.error('Update MTW reserve error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update MTW reserve'
        });
        return;
    }
};
exports.updateMTWReserve = updateMTWReserve;
// Delete MTW reserve
const deleteMTWReserve = async (req, res) => {
    try {
        const { id } = req.params;
        // Find MTW reserve
        const mtwReserve = await reserveRepository.findOne({
            where: { id }
        });
        if (!mtwReserve) {
            res.status(404).json({
                status: 'error',
                message: 'MTW reserve not found'
            });
            return;
        }
        // Delete MTW reserve
        await reserveRepository.remove(mtwReserve);
        res.status(200).json({
            status: 'success',
            message: 'MTW reserve deleted successfully'
        });
        return;
    }
    catch (error) {
        console.error('Delete MTW reserve error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete MTW reserve'
        });
        return;
    }
};
exports.deleteMTWReserve = deleteMTWReserve;
