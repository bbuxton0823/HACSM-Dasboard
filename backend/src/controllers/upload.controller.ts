import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getRepository } from 'typeorm';
import multer from 'multer';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import { HCVUtilization, VoucherType } from '../models/HCVUtilization';
import { StyleTemplate } from '../models/StyleTemplate';

// Simple logger implementation until the actual logger is available
const logger = {
  error: (message: string, meta?: any) => console.error(`ERROR: ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`WARN: ${message}`, meta || ''),
  info: (message: string, meta?: any) => console.info(`INFO: ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.debug(`DEBUG: ${message}`, meta || '')
};

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Define file filter to only accept certain types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept csv, excel, pdf, word, and text files
  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'text/plain'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV, Excel, PDF, Word, and text files are allowed.'));
  }
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * Process CSV or Excel file for HCV Utilization data
 */
const processDataFile = async (filePath: string, fileType: string) => {
  const hcvUtilizationRepo = getRepository(HCVUtilization);
  const results: any[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];

  try {
    if (fileType === 'csv') {
      // Process CSV file with error handling for malformed data
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({
            // Handle quotes and delimiters more flexibly
            strict: false,
            // Skip empty lines
            skipLines: 0,
            // Handle headers with different formats
            mapHeaders: (header: string) => {
              if (!header) return 'unknown_column';
              // Normalize header names by removing spaces, special chars
              return header.toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            }
          }))
          .on('data', (data: any) => {
            // Check if row has at least some valid data
            const hasData = Object.values(data).some(val => val !== null && val !== undefined && val !== '');
            if (hasData) {
              results.push(data);
            }
          })
          .on('end', () => {
            if (results.length === 0) {
              warnings.push('CSV file appears to be empty or contains no valid data');
            }
            resolve();
          })
          .on('error', (error: any) => {
            warnings.push(`Error parsing CSV: ${error.message}`);
            // Don't reject, try to continue with any data we could parse
            resolve();
          });
      });
    } else if (fileType === 'excel') {
      // Process Excel file with error handling
      try {
        const workbook = XLSX.readFile(filePath, { cellDates: true, cellNF: false, cellText: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
        
        // Filter out completely empty rows
        const filteredData = jsonData.filter((row: any) => {
          return Object.values(row).some(val => val !== null && val !== undefined && val !== '');
        });
        
        results.push(...filteredData);
      } catch (excelError) {
        warnings.push(`Error parsing Excel file: ${(excelError as Error).message}`);
      }
    }

    // Log warnings if any
    if (warnings.length > 0) {
      logger.warn('Warnings during file processing:', { warnings });
    }

    // Map the data to our HCVUtilization model with extensive error handling
    const hcvData = results.map((row) => {
      try {
        // Check if row is valid
        if (!row || typeof row !== 'object') {
          throw new Error('Invalid row data');
        }

        // Helper function to find value across multiple possible column names
        const findValue = (possibleKeys: string[], defaultValue: any = null) => {
          // Try exact matches first
          for (const key of possibleKeys) {
            if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
              return row[key];
            }
          }
          
          // Try fuzzy matches (contains the key)
          const rowKeys = Object.keys(row);
          for (const possibleKey of possibleKeys) {
            const matchingKey = rowKeys.find(k => 
              k.toLowerCase().includes(possibleKey.toLowerCase()));
            if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== '') {
              return row[matchingKey];
            }
          }
          
          return defaultValue;
        };

        // Parse date with fallbacks
        let reportingDate: Date;
        const rawDate = findValue(['reporting_date', 'reportingdate', 'date', 'report_date', 'month', 'period']);
        
        if (!rawDate) {
          throw new Error('Missing required reporting date');
        }
        
        try {
          // Try to parse the date in various formats
          if (rawDate instanceof Date) {
            reportingDate = rawDate;
          } else if (typeof rawDate === 'string') {
            // Try ISO format first
            reportingDate = new Date(rawDate);
            
            // If invalid date, try other formats
            if (isNaN(reportingDate.getTime())) {
              // Try MM/DD/YYYY format
              const parts = rawDate.split(/[\/\-]/);
              if (parts.length === 3) {
                // Try both MM/DD/YYYY and DD/MM/YYYY formats
                reportingDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
                if (isNaN(reportingDate.getTime())) {
                  reportingDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
              }
            }
          } else if (typeof rawDate === 'number') {
            // Handle Excel serial dates
            reportingDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
          } else {
            throw new Error('Invalid date format');
          }
          
          // Validate the date is reasonable
          if (isNaN(reportingDate.getTime()) || reportingDate.getFullYear() < 2000 || reportingDate.getFullYear() > 2100) {
            throw new Error('Date out of reasonable range');
          }
        } catch (dateError) {
          throw new Error(`Invalid reporting date: ${rawDate}`);
        }
        
        // Get voucher type with fallbacks
        const voucherType = (findValue(
          ['voucher_type', 'vouchertype', 'type', 'voucher', 'program_type', 'programtype'], 
          'tenant_based'
        )).toString().toLowerCase();
        
        // Parse numeric values with validation
        const parseNumericValue = (value: any, fieldName: string) => {
          if (value === null || value === undefined || value === '') {
            return 0;
          }
          
          if (typeof value === 'number') {
            return isNaN(value) ? 0 : value;
          }
          
          // Remove any non-numeric characters except decimal point
          const cleanedValue = value.toString().replace(/[^0-9.-]/g, '');
          const parsedValue = parseFloat(cleanedValue);
          
          if (isNaN(parsedValue)) {
            logger.warn(`Invalid ${fieldName} value: ${value}, using 0 instead`);
            return 0;
          }
          
          return parsedValue;
        };
        
        const authorizedVouchers = parseNumericValue(
          findValue(['authorized_vouchers', 'authorizedvouchers', 'authorized', 'auth_vouchers', 'total_authorized']), 
          'authorized vouchers'
        );
        
        const leasedVouchers = parseNumericValue(
          findValue(['leased_vouchers', 'leasedvouchers', 'leased', 'units_leased', 'total_leased']), 
          'leased vouchers'
        );
        
        const hapExpenses = parseNumericValue(
          findValue(['hap_expenses', 'hapexpenses', 'expenses', 'hap', 'total_hap', 'expenditures']), 
          'HAP expenses'
        );

        // Calculate utilization rate
        const utilizationRate = authorizedVouchers > 0 
          ? (leasedVouchers / authorizedVouchers) * 100 
          : 0;

        // Calculate average HAP per unit
        const averageHapPerUnit = leasedVouchers > 0 
          ? hapExpenses / leasedVouchers 
          : 0;

        // Get the matching voucher type from our enum
        const matchedVoucherType = Object.values(VoucherType).find(
          (type) => type.toLowerCase() === voucherType.toLowerCase()
        ) || VoucherType.TENANT_BASED;

        return {
          reportingDate: new Date(reportingDate),
          voucherType: matchedVoucherType,
          authorizedVouchers,
          leasedVouchers,
          utilizationRate,
          hapExpenses,
          averageHapPerUnit,
          budgetUtilization: 0, // Calculate this based on your business logic
          notes: row.notes || '',
        };
      } catch (error) {
        errors.push({
          row,
          error: (error as Error).message,
        });
        return null;
      }
    }).filter(Boolean);

    // Save the data to the database
    const filteredData = hcvData.filter((item): item is NonNullable<typeof item> => item !== null);
    const savedData = await hcvUtilizationRepo.save(filteredData);

    return {
      imported: savedData.length,
      errors,
      warnings
    };
  } catch (error) {
    logger.error('Error processing data file:', error);
    throw error;
  }
};

/**
 * Process style template file (PDF, Word, Text)
 */
const processStyleTemplate = async (
  filePath: string, 
  fileType: string, 
  styleName: string
) => {
  const styleTemplateRepo = getRepository(StyleTemplate);
  
  try {
    let content = '';
    
    if (fileType === 'pdf') {
      // Extract text from PDF
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      content = data.text;
    } else if (fileType === 'word') {
      // Extract text from Word document
      const result = await mammoth.extractRawText({
        path: filePath
      });
      content = result.value;
    } else if (fileType === 'text') {
      // Read text file
      content = fs.readFileSync(filePath, 'utf8');
    }
    
    // Save style template
    const styleTemplate = new StyleTemplate();
    styleTemplate.name = styleName;
    styleTemplate.content = content;
    
    const savedTemplate = await styleTemplateRepo.save(styleTemplate);
    
    return {
      id: savedTemplate.id,
      name: savedTemplate.name,
    };
  } catch (error) {
    logger.error('Error processing style template:', error);
    throw error;
  }
};

/**
 * Handle file upload
 * @route POST /api/upload
 */
export const handleFileUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        message: 'No file uploaded',
      });
      return;
    }

    const uploadType = req.body.uploadType;
    const styleName = req.body.styleName;
    const filePath = req.file.path;
    const fileType = getFileType(req.file.originalname);

    let result;

    // Process file based on upload type
    if (
      uploadType === 'HCV Utilization Data' ||
      uploadType === 'Voucher Types Data' ||
      uploadType === 'Financial Data'
    ) {
      // Process data files (CSV, Excel)
      if (fileType === 'csv' || fileType === 'excel') {
        result = await processDataFile(filePath, fileType);
      } else {
        res.status(400).json({
          message: 'Invalid file type for data upload. Please use CSV or Excel files.',
        });
        return;
      }
    } else if (
      uploadType === 'Writing Style Template' ||
      uploadType === 'Executive Report'
    ) {
      // Process style template files (PDF, Word, Text)
      if (fileType === 'pdf' || fileType === 'word' || fileType === 'text') {
        if (!styleName && uploadType === 'Writing Style Template') {
          res.status(400).json({
            message: 'Style name is required for style templates',
          });
          return;
        }
        
        result = await processStyleTemplate(
          filePath, 
          fileType, 
          styleName || `Template-${uuidv4().substring(0, 8)}`
        );
      } else {
        res.status(400).json({
          message: 'Invalid file type for style template. Please use PDF, Word, or text files.',
        });
        return;
      }
    } else {
      res.status(400).json({
        message: 'Invalid upload type',
      });
      return;
    }

    // Delete the file after processing
    fs.unlinkSync(filePath);

    res.status(200).json({
      message: 'File processed successfully',
      data: result,
    });
    return;
  } catch (error: any) {
    logger.error('Error handling file upload:', error);
    
    // Delete the file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      message: error.message || 'Error processing file',
    });
    return;
  }
};

/**
 * Helper function to determine file type from extension
 */
const getFileType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  
  if (ext === '.csv') {
    return 'csv';
  } else if (ext === '.xlsx' || ext === '.xls') {
    return 'excel';
  } else if (ext === '.pdf') {
    return 'pdf';
  } else if (ext === '.doc' || ext === '.docx') {
    return 'word';
  } else if (ext === '.txt') {
    return 'text';
  }
  
  return 'unknown';
};

/**
 * Get all style templates
 * @route GET /api/upload/style-templates
 */
export const getStyleTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const styleTemplateRepo = getRepository(StyleTemplate);
    const templates = await styleTemplateRepo.find({
      select: ['id', 'name', 'createdAt'],
    });
    
    res.status(200).json({
      message: 'Style templates retrieved successfully',
      data: templates,
    });
    return;
  } catch (error) {
    logger.error('Error getting style templates:', error);
    res.status(500).json({
      message: 'Error retrieving style templates',
    });
    return;
  }
};

/**
 * Delete a style template
 * @route DELETE /api/upload/style-templates/:id
 */
export const deleteStyleTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const styleTemplateRepo = getRepository(StyleTemplate);
    
    const template = await styleTemplateRepo.findOne({ where: { id } });
    
    if (!template) {
      res.status(404).json({
        message: 'Style template not found',
      });
      return;
    }
    
    await styleTemplateRepo.remove(template);
    
    res.status(200).json({
      message: 'Style template deleted successfully',
    });
    return;
  } catch (error) {
    logger.error('Error deleting style template:', error);
    res.status(500).json({
      message: 'Error deleting style template',
    });
    return;
  }
};
