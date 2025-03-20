import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { HCVUtilization, VoucherType } from '../models/HCVUtilization';
import { validate } from 'class-validator';

// HCV Utilization repository
const hcvUtilizationRepository = AppDataSource.getRepository(HCVUtilization);

// Get all HCV utilization records
export const getAllHCVUtilization = async (req: Request, res: Response): Promise<void> => {
  try {
    const utilization = await hcvUtilizationRepository.find({
      order: { reportingDate: 'DESC' }
    });
    
    res.status(200).json({
      status: 'success',
      data: utilization
    });
    return;
  } catch (error) {
    console.error('Get all HCV utilization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get HCV utilization data'
    });
    return;
  }
};

// Get HCV utilization by ID
export const getHCVUtilizationById = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Get HCV utilization by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get HCV utilization record'
    });
    return;
  }
};

// Create HCV utilization record
export const createHCVUtilization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      reportingDate, 
      voucherType, 
      authorizedVouchers, 
      leasedVouchers,
      utilizationRate,
      hapExpenses,
      averageHapPerUnit,
      budgetUtilization,
      notes
    } = req.body;
    
    // Create new HCV utilization record
    const utilization = new HCVUtilization();
    utilization.reportingDate = new Date(reportingDate);
    utilization.voucherType = voucherType;
    utilization.authorizedVouchers = authorizedVouchers;
    utilization.leasedVouchers = leasedVouchers;
    utilization.utilizationRate = utilizationRate;
    utilization.hapExpenses = hapExpenses;
    
    if (averageHapPerUnit) utilization.averageHapPerUnit = averageHapPerUnit;
    if (budgetUtilization) utilization.budgetUtilization = budgetUtilization;
    if (notes) utilization.notes = notes;
    
    // Validate utilization data
    const errors = await validate(utilization);
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
  } catch (error) {
    console.error('Create HCV utilization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create HCV utilization record'
    });
    return;
  }
};

// Update HCV utilization record
export const updateHCVUtilization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      reportingDate, 
      voucherType, 
      authorizedVouchers, 
      leasedVouchers,
      utilizationRate,
      hapExpenses,
      averageHapPerUnit,
      budgetUtilization,
      notes
    } = req.body;
    
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
    if (reportingDate) utilization.reportingDate = new Date(reportingDate);
    if (voucherType) utilization.voucherType = voucherType;
    if (authorizedVouchers !== undefined) utilization.authorizedVouchers = authorizedVouchers;
    if (leasedVouchers !== undefined) utilization.leasedVouchers = leasedVouchers;
    if (utilizationRate !== undefined) utilization.utilizationRate = utilizationRate;
    if (hapExpenses !== undefined) utilization.hapExpenses = hapExpenses;
    if (averageHapPerUnit !== undefined) utilization.averageHapPerUnit = averageHapPerUnit;
    if (budgetUtilization !== undefined) utilization.budgetUtilization = budgetUtilization;
    if (notes !== undefined) utilization.notes = notes;
    
    // Validate updated utilization data
    const errors = await validate(utilization);
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
  } catch (error) {
    console.error('Update HCV utilization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update HCV utilization record'
    });
    return;
  }
};

// Delete HCV utilization record
export const deleteHCVUtilization = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Delete HCV utilization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete HCV utilization record'
    });
    return;
  }
};

// Get HCV utilization by voucher type
export const getHCVUtilizationByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    
    // Validate voucher type
    if (!Object.values(VoucherType).includes(type as VoucherType)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid voucher type'
      });
      return;
    }
    
    const utilization = await hcvUtilizationRepository.find({
      where: { voucherType: type as VoucherType },
      order: { reportingDate: 'DESC' }
    });
    
    res.status(200).json({
      status: 'success',
      data: utilization
    });
    return;
  } catch (error) {
    console.error('Get HCV utilization by type error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get HCV utilization by type'
    });
    return;
  }
};

// Get HCV utilization by date range
export const getHCVUtilizationByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        status: 'error',
        message: 'Start date and end date are required'
      });
      return;
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
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
  } catch (error) {
    console.error('Get HCV utilization by date range error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get HCV utilization by date range'
    });
    return;
  }
};

// Get HCV utilization trends
export const getHCVUtilizationTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { months } = req.query;
    
    let monthsToFetch = 12; // Default to 12 months
    if (months && !isNaN(parseInt(months as string))) {
      monthsToFetch = parseInt(months as string);
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
  } catch (error) {
    console.error('Get HCV utilization trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get HCV utilization trends'
    });
    return;
  }
};

// Get HCV utilization dashboard summary
export const getHCVUtilizationDashboard = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Get HCV utilization dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get HCV utilization dashboard'
    });
    return;
  }
};
