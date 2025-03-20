import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { BudgetAuthority } from '../models/BudgetAuthority';
import { MTWReserve } from '../models/MTWReserve';
import { HAPExpenditure, ExpenditureType } from '../models/HAPExpenditure';
import { Commitment, CommitmentStatus, CommitmentType } from '../models/Commitment';
import { HCVUtilization, VoucherType } from '../models/HCVUtilization';
import { deleteFile } from '../utils/fileUpload';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import { parse as parseCsv } from 'papaparse';

// Helper function for type safety
function typedData<T>(data: unknown): Record<string, any>[] {
  return data as Record<string, any>[];
}

// Helper function to safely access properties
function safeGet(obj: unknown, key: string): any {
  if (obj && typeof obj === 'object' && key in obj) {
    return (obj as Record<string, any>)[key];
  }
  return undefined;
}

// Repositories
const budgetRepository = AppDataSource.getRepository(BudgetAuthority);
const reserveRepository = AppDataSource.getRepository(MTWReserve);
const expenditureRepository = AppDataSource.getRepository(HAPExpenditure);
const commitmentRepository = AppDataSource.getRepository(Commitment);
const hcvUtilizationRepository = AppDataSource.getRepository(HCVUtilization);

// Upload and process file
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
      return;
    }
    
    const { importType } = req.body;
    
    if (!importType) {
      // Delete the uploaded file
      await deleteFile(req.file.path);
      
      res.status(400).json({
        status: 'error',
        message: 'Import type is required'
      });
      return;
    }
    
    // Process the file based on import type
    let result;
    
    switch (importType) {
      case 'budget':
        result = await processBudgetFile(req.file.path);
        break;
      case 'reserves':
        result = await processReservesFile(req.file.path);
        break;
      case 'expenditures':
        result = await processExpendituresFile(req.file.path);
        break;
      case 'commitments':
        result = await processCommitmentsFile(req.file.path);
        break;
      case 'hcv-utilization':
        result = await processHCVUtilizationFile(req.file.path);
        break;
      default:
        // Delete the uploaded file
        await deleteFile(req.file.path);
        
        res.status(400).json({
          status: 'error',
          message: 'Invalid import type'
        });
        return;
    }
    
    // Delete the uploaded file after processing
    await deleteFile(req.file.path);
    
    res.status(200).json({
      status: 'success',
      message: 'File processed successfully',
      data: result
    });
    return;
  } catch (error) {
    console.error('File upload error:', error);
    
    // Delete the uploaded file if it exists
    if (req.file) {
      try {
        await deleteFile(req.file.path);
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError);
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to process file'
    });
    return;
  }
};

// Download template file
export const downloadTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateType } = req.params;
    
    const templatesDir = path.join(__dirname, '../../templates');
    let templatePath;
    
    switch (templateType) {
      case 'budget':
        templatePath = path.join(templatesDir, 'budget_template.xlsx');
        break;
      case 'reserves':
        templatePath = path.join(templatesDir, 'reserves_template.xlsx');
        break;
      case 'expenditures':
        templatePath = path.join(templatesDir, 'expenditures_template.xlsx');
        break;
      case 'commitments':
        templatePath = path.join(templatesDir, 'commitments_template.xlsx');
        break;
      case 'hcv-utilization':
        templatePath = path.join(templatesDir, 'hcv_utilization_template.xlsx');
        break;
      default:
        res.status(400).json({
          status: 'error',
          message: 'Invalid template type'
        });
        return;
    }
    
    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      res.status(404).json({
        status: 'error',
        message: 'Template file not found'
      });
      return;
    }
    
    res.download(templatePath);
    return;
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to download template'
    });
    return;
  }
};

// Helper function to read file data
const readFileData = (filePath: string) => {
  const fileExt = path.extname(filePath).toLowerCase();
  
  if (fileExt === '.csv') {
    // Read CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const result = parseCsv(fileContent, {
      header: true,
      skipEmptyLines: true
    });
    return result.data;
  } else {
    // Read Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  }
};

// Process budget file
const processBudgetFile = async (filePath: string) => {
  const data = readFileData(filePath);
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid or empty file');
  }
  
  const typedRows = typedData(data);
  const requiredFields = ['totalBudgetAmount', 'fiscalYear', 'effectiveDate'];
  
  // Validate required fields
  for (const field of requiredFields) {
    if (!Object.keys(typedRows[0]).includes(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Process data
  const results = {
    success: 0,
    errors: [] as any[]
  };
  
  for (const row of typedRows) {
    try {
      const budgetAuthority = new BudgetAuthority();
      budgetAuthority.totalBudgetAmount = parseFloat(row.totalBudgetAmount);
      budgetAuthority.fiscalYear = parseInt(row.fiscalYear);
      budgetAuthority.effectiveDate = new Date(row.effectiveDate);
      
      if (row.expirationDate) {
        budgetAuthority.expirationDate = new Date(row.expirationDate);
      }
      
      if (row.notes) {
        budgetAuthority.notes = row.notes;
      }
      
      if (row.isActive && (typeof row.isActive === 'string' ? row.isActive.toLowerCase() === 'true' : row.isActive === true)) {
        // If this is set as active, deactivate all other budget authorities
        await budgetRepository.update({}, { isActive: false });
        budgetAuthority.isActive = true;
      }
      
      // Save budget authority to database
      await budgetRepository.save(budgetAuthority);
      results.success++;
    } catch (error) {
      results.errors.push({
        row,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
};

// Process reserves file
const processReservesFile = async (filePath: string) => {
  const data = readFileData(filePath);
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid or empty file');
  }
  
  const typedRows = typedData(data);
  const requiredFields = ['reserveAmount', 'asOfDate'];
  
  // Validate required fields
  for (const field of requiredFields) {
    if (!Object.keys(typedRows[0]).includes(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Process data
  const results = {
    success: 0,
    errors: [] as any[]
  };
  
  // Get active budget authority for percentage calculation
  const activeBudgetAuthority = await budgetRepository.findOne({
    where: { isActive: true }
  });
  
  for (const row of typedRows) {
    try {
      const mtwReserve = new MTWReserve();
      mtwReserve.reserveAmount = parseFloat(row.reserveAmount);
      mtwReserve.asOfDate = new Date(row.asOfDate);
      
      if (row.minimumReserveLevel) {
        mtwReserve.minimumReserveLevel = parseFloat(row.minimumReserveLevel);
      }
      
      if (row.notes) {
        mtwReserve.notes = row.notes;
      }
      
      // Calculate percentage of budget authority if active budget authority exists
      if (activeBudgetAuthority) {
        mtwReserve.percentageOfBudgetAuthority = 
          (mtwReserve.reserveAmount / Number(activeBudgetAuthority.totalBudgetAmount)) * 100;
      }
      
      // Save MTW reserve to database
      await reserveRepository.save(mtwReserve);
      results.success++;
    } catch (error) {
      results.errors.push({
        row,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
};

// Process expenditures file
const processExpendituresFile = async (filePath: string) => {
  const data = readFileData(filePath);
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid or empty file');
  }
  
  const requiredFields = ['expenditureDate', 'expenditureType', 'amount'];
  
  // Validate required fields
  const typedRows = typedData(data);
  for (const field of requiredFields) {
    if (!Object.keys(typedRows[0]).includes(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Process data
  const results = {
    success: 0,
    errors: [] as any[]
  };
  
  for (const row of typedRows) {
    try {
      // Validate expenditure type
      if (!Object.values(ExpenditureType).includes(row.expenditureType as ExpenditureType)) {
        throw new Error(`Invalid expenditure type: ${row.expenditureType}`);
      }
      
      const expenditure = new HAPExpenditure();
      expenditure.expenditureDate = new Date(row.expenditureDate);
      expenditure.expenditureType = row.expenditureType as ExpenditureType;
      expenditure.amount = parseFloat(row.amount);
      
      if (row.description) {
        expenditure.description = row.description;
      }
      
      if (row.notes) {
        expenditure.notes = row.notes;
      }
      
      // Save expenditure to database
      await expenditureRepository.save(expenditure);
      results.success++;
    } catch (error) {
      results.errors.push({
        row,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
};

// Process commitments file
const processCommitmentsFile = async (filePath: string) => {
  const data = readFileData(filePath);
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid or empty file');
  }
  
  const requiredFields = ['commitmentNumber', 'activityDescription', 'commitmentType', 'amountCommitted'];
  
  // Validate required fields
  const typedRows = typedData(data);
  for (const field of requiredFields) {
    if (!Object.keys(typedRows[0]).includes(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Process data
  const results = {
    success: 0,
    errors: [] as any[]
  };
  
  for (const row of typedRows) {
    try {
      // Validate commitment type
      if (!Object.values(CommitmentType).includes(row.commitmentType as CommitmentType)) {
        throw new Error(`Invalid commitment type: ${row.commitmentType}`);
      }
      
      // Validate commitment status if provided
      if (row.status && !Object.values(CommitmentStatus).includes(row.status as CommitmentStatus)) {
        throw new Error(`Invalid commitment status: ${row.status}`);
      }
      
      const commitment = new Commitment();
      commitment.commitmentNumber = row.commitmentNumber;
      commitment.activityDescription = row.activityDescription;
      commitment.commitmentType = row.commitmentType as CommitmentType;
      commitment.amountCommitted = parseFloat(row.amountCommitted);
      
      if (row.accountType) {
        commitment.accountType = row.accountType;
      }
      
      if (row.commitmentDate) {
        commitment.commitmentDate = new Date(row.commitmentDate);
      }
      
      if (row.obligationDate) {
        commitment.obligationDate = new Date(row.obligationDate);
      }
      
      if (row.status) {
        commitment.status = row.status as CommitmentStatus;
      }
      
      if (row.amountObligated) {
        commitment.amountObligated = parseFloat(row.amountObligated);
      }
      
      if (row.amountExpended) {
        commitment.amountExpended = parseFloat(row.amountExpended);
      }
      
      if (row.projectedFullExpenditureDate) {
        commitment.projectedFullExpenditureDate = new Date(row.projectedFullExpenditureDate);
      }
      
      if (row.notes) {
        commitment.notes = row.notes;
      }
      
      // Save commitment to database
      await commitmentRepository.save(commitment);
      results.success++;
    } catch (error) {
      results.errors.push({
        row,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
};

// Process HCV utilization file
const processHCVUtilizationFile = async (filePath: string) => {
  const data = readFileData(filePath);
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid or empty file');
  }
  
  const requiredFields = ['reportingDate', 'voucherType', 'authorizedVouchers', 'leasedVouchers', 'utilizationRate', 'hapExpenses'];
  
  // Validate required fields
  const typedRows = typedData(data);
  for (const field of requiredFields) {
    if (!Object.keys(typedRows[0]).includes(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Process data
  const results = {
    success: 0,
    errors: [] as any[]
  };
  
  for (const row of typedRows) {
    try {
      const typedRow = row as Record<string, unknown>;
      
      // Validate voucher type
      if (!Object.values(VoucherType).includes(typedRow.voucherType as VoucherType)) {
        throw new Error(`Invalid voucher type: ${typedRow.voucherType}`);
      }
      
      const utilization = new HCVUtilization();
      utilization.reportingDate = new Date(typedRow.reportingDate as string);
      utilization.voucherType = typedRow.voucherType as VoucherType;
      utilization.authorizedVouchers = parseInt(typedRow.authorizedVouchers as string);
      utilization.leasedVouchers = parseInt(typedRow.leasedVouchers as string);
      utilization.utilizationRate = parseFloat(typedRow.utilizationRate as string);
      utilization.hapExpenses = parseFloat(typedRow.hapExpenses as string);
      
      if (typedRow.averageHapPerUnit) {
        utilization.averageHapPerUnit = parseFloat(typedRow.averageHapPerUnit as string);
      }
      
      if (typedRow.budgetUtilization) {
        utilization.budgetUtilization = parseFloat(typedRow.budgetUtilization as string);
      }
      
      if (typedRow.notes) {
        utilization.notes = typedRow.notes as string;
      }
      
      // Save HCV utilization to database
      await hcvUtilizationRepository.save(utilization);
      results.success++;
    } catch (error) {
      results.errors.push({
        row,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
};
