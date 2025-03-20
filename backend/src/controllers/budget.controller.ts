import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { BudgetAuthority } from '../models/BudgetAuthority';
import { MTWReserve } from '../models/MTWReserve';
import { HAPExpenditure } from '../models/HAPExpenditure';
import { Commitment, CommitmentStatus } from '../models/Commitment';
import { validate } from 'class-validator';

// Repositories
const budgetRepository = AppDataSource.getRepository(BudgetAuthority);
const reserveRepository = AppDataSource.getRepository(MTWReserve);
const expenditureRepository = AppDataSource.getRepository(HAPExpenditure);
const commitmentRepository = AppDataSource.getRepository(Commitment);

// Get dashboard summary data
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
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
    const pendingCommitments = commitments.filter(c => c.status === CommitmentStatus.PLANNED);
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
        ytdExpenditures: ytdExpenditures?.total || 0,
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
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get dashboard summary'
    });
    return;
  }
};

// Budget Authority Controllers

// Get all budget authorities
export const getAllBudgetAuthorities = async (req: Request, res: Response): Promise<void> => {
  try {
    const budgetAuthorities = await budgetRepository.find({
      order: { fiscalYear: 'DESC' }
    });
    
    res.status(200).json({
      status: 'success',
      data: budgetAuthorities
    });
    return;
  } catch (error) {
    console.error('Get all budget authorities error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get budget authorities'
    });
    return;
  }
};

// Get budget authority by ID
export const getBudgetAuthorityById = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Get budget authority by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get budget authority'
    });
    return;
  }
};

// Create budget authority
export const createBudgetAuthority = async (req: Request, res: Response): Promise<void> => {
  try {
    const { totalBudgetAmount, fiscalYear, effectiveDate, expirationDate, notes } = req.body;
    
    // Create new budget authority
    const budgetAuthority = new BudgetAuthority();
    budgetAuthority.totalBudgetAmount = totalBudgetAmount;
    budgetAuthority.fiscalYear = fiscalYear;
    budgetAuthority.effectiveDate = new Date(effectiveDate);
    if (expirationDate) budgetAuthority.expirationDate = new Date(expirationDate);
    if (notes) budgetAuthority.notes = notes;
    
    // Validate budget authority data
    const errors = await validate(budgetAuthority);
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
  } catch (error) {
    console.error('Create budget authority error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create budget authority'
    });
    return;
  }
};

// Update budget authority
export const updateBudgetAuthority = async (req: Request, res: Response): Promise<void> => {
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
    if (totalBudgetAmount !== undefined) budgetAuthority.totalBudgetAmount = totalBudgetAmount;
    if (fiscalYear !== undefined) budgetAuthority.fiscalYear = fiscalYear;
    if (effectiveDate !== undefined) budgetAuthority.effectiveDate = new Date(effectiveDate);
    if (expirationDate !== undefined) {
      budgetAuthority.expirationDate = expirationDate ? new Date(expirationDate) : new Date();
    }
    if (notes !== undefined) budgetAuthority.notes = notes;
    
    // Validate updated budget authority data
    const errors = await validate(budgetAuthority);
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
        .update(BudgetAuthority)
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
  } catch (error) {
    console.error('Update budget authority error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update budget authority'
    });
    return;
  }
};

// Delete budget authority
export const deleteBudgetAuthority = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Delete budget authority error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete budget authority'
    });
    return;
  }
};

// MTW Reserve Controllers

// Get all MTW reserves
export const getAllMTWReserves = async (req: Request, res: Response): Promise<void> => {
  try {
    const mtwReserves = await reserveRepository.find({
      order: { asOfDate: 'DESC' }
    });
    
    res.status(200).json({
      status: 'success',
      data: mtwReserves
    });
    return;
  } catch (error) {
    console.error('Get all MTW reserves error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get MTW reserves'
    });
    return;
  }
};

// Get MTW reserve by ID
export const getMTWReserveById = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Get MTW reserve by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get MTW reserve'
    });
    return;
  }
};

// Create MTW reserve
export const createMTWReserve = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, asOfDate, notes } = req.body;
    
    // Create new MTW reserve
    const mtwReserve = new MTWReserve();
    mtwReserve.reserveAmount = amount;
    mtwReserve.asOfDate = new Date(asOfDate);
    if (notes) mtwReserve.notes = notes;
    
    // Validate MTW reserve data
    const errors = await validate(mtwReserve);
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
  } catch (error) {
    console.error('Create MTW reserve error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create MTW reserve'
    });
    return;
  }
};

// Update MTW reserve
export const updateMTWReserve = async (req: Request, res: Response): Promise<void> => {
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
    if (amount !== undefined) mtwReserve.reserveAmount = amount;
    if (asOfDate !== undefined) mtwReserve.asOfDate = new Date(asOfDate);
    if (notes !== undefined) mtwReserve.notes = notes;
    
    // Validate updated MTW reserve data
    const errors = await validate(mtwReserve);
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
  } catch (error) {
    console.error('Update MTW reserve error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update MTW reserve'
    });
    return;
  }
};

// Delete MTW reserve
export const deleteMTWReserve = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Delete MTW reserve error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete MTW reserve'
    });
    return;
  }
};
