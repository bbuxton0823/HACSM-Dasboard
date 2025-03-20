"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadTemplate = exports.uploadFile = void 0;
const database_1 = require("../config/database");
const BudgetAuthority_1 = require("../models/BudgetAuthority");
const MTWReserve_1 = require("../models/MTWReserve");
const HAPExpenditure_1 = require("../models/HAPExpenditure");
const Commitment_1 = require("../models/Commitment");
const HCVUtilization_1 = require("../models/HCVUtilization");
const fileUpload_1 = require("../utils/fileUpload");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const xlsx_1 = __importDefault(require("xlsx"));
const papaparse_1 = require("papaparse");
// Helper function for type safety
function typedData(data) {
    return data;
}
// Helper function to safely access properties
function safeGet(obj, key) {
    if (obj && typeof obj === 'object' && key in obj) {
        return obj[key];
    }
    return undefined;
}
// Repositories
const budgetRepository = database_1.AppDataSource.getRepository(BudgetAuthority_1.BudgetAuthority);
const reserveRepository = database_1.AppDataSource.getRepository(MTWReserve_1.MTWReserve);
const expenditureRepository = database_1.AppDataSource.getRepository(HAPExpenditure_1.HAPExpenditure);
const commitmentRepository = database_1.AppDataSource.getRepository(Commitment_1.Commitment);
const hcvUtilizationRepository = database_1.AppDataSource.getRepository(HCVUtilization_1.HCVUtilization);
// Upload and process file
const uploadFile = async (req, res) => {
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
            await (0, fileUpload_1.deleteFile)(req.file.path);
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
                await (0, fileUpload_1.deleteFile)(req.file.path);
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid import type'
                });
                return;
        }
        // Delete the uploaded file after processing
        await (0, fileUpload_1.deleteFile)(req.file.path);
        res.status(200).json({
            status: 'success',
            message: 'File processed successfully',
            data: result
        });
        return;
    }
    catch (error) {
        console.error('File upload error:', error);
        // Delete the uploaded file if it exists
        if (req.file) {
            try {
                await (0, fileUpload_1.deleteFile)(req.file.path);
            }
            catch (deleteError) {
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
exports.uploadFile = uploadFile;
// Download template file
const downloadTemplate = async (req, res) => {
    try {
        const { templateType } = req.params;
        const templatesDir = path_1.default.join(__dirname, '../../templates');
        let templatePath;
        switch (templateType) {
            case 'budget':
                templatePath = path_1.default.join(templatesDir, 'budget_template.xlsx');
                break;
            case 'reserves':
                templatePath = path_1.default.join(templatesDir, 'reserves_template.xlsx');
                break;
            case 'expenditures':
                templatePath = path_1.default.join(templatesDir, 'expenditures_template.xlsx');
                break;
            case 'commitments':
                templatePath = path_1.default.join(templatesDir, 'commitments_template.xlsx');
                break;
            case 'hcv-utilization':
                templatePath = path_1.default.join(templatesDir, 'hcv_utilization_template.xlsx');
                break;
            default:
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid template type'
                });
                return;
        }
        // Check if template file exists
        if (!fs_1.default.existsSync(templatePath)) {
            res.status(404).json({
                status: 'error',
                message: 'Template file not found'
            });
            return;
        }
        res.download(templatePath);
        return;
    }
    catch (error) {
        console.error('Download template error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to download template'
        });
        return;
    }
};
exports.downloadTemplate = downloadTemplate;
// Helper function to read file data
const readFileData = (filePath) => {
    const fileExt = path_1.default.extname(filePath).toLowerCase();
    if (fileExt === '.csv') {
        // Read CSV file
        const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
        const result = (0, papaparse_1.parse)(fileContent, {
            header: true,
            skipEmptyLines: true
        });
        return result.data;
    }
    else {
        // Read Excel file
        const workbook = xlsx_1.default.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return xlsx_1.default.utils.sheet_to_json(worksheet);
    }
};
// Process budget file
const processBudgetFile = async (filePath) => {
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
        errors: []
    };
    for (const row of typedRows) {
        try {
            const budgetAuthority = new BudgetAuthority_1.BudgetAuthority();
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
        }
        catch (error) {
            results.errors.push({
                row,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    return results;
};
// Process reserves file
const processReservesFile = async (filePath) => {
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
        errors: []
    };
    // Get active budget authority for percentage calculation
    const activeBudgetAuthority = await budgetRepository.findOne({
        where: { isActive: true }
    });
    for (const row of typedRows) {
        try {
            const mtwReserve = new MTWReserve_1.MTWReserve();
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
        }
        catch (error) {
            results.errors.push({
                row,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    return results;
};
// Process expenditures file
const processExpendituresFile = async (filePath) => {
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
        errors: []
    };
    for (const row of typedRows) {
        try {
            // Validate expenditure type
            if (!Object.values(HAPExpenditure_1.ExpenditureType).includes(row.expenditureType)) {
                throw new Error(`Invalid expenditure type: ${row.expenditureType}`);
            }
            const expenditure = new HAPExpenditure_1.HAPExpenditure();
            expenditure.expenditureDate = new Date(row.expenditureDate);
            expenditure.expenditureType = row.expenditureType;
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
        }
        catch (error) {
            results.errors.push({
                row,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    return results;
};
// Process commitments file
const processCommitmentsFile = async (filePath) => {
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
        errors: []
    };
    for (const row of typedRows) {
        try {
            // Validate commitment type
            if (!Object.values(Commitment_1.CommitmentType).includes(row.commitmentType)) {
                throw new Error(`Invalid commitment type: ${row.commitmentType}`);
            }
            // Validate commitment status if provided
            if (row.status && !Object.values(Commitment_1.CommitmentStatus).includes(row.status)) {
                throw new Error(`Invalid commitment status: ${row.status}`);
            }
            const commitment = new Commitment_1.Commitment();
            commitment.commitmentNumber = row.commitmentNumber;
            commitment.activityDescription = row.activityDescription;
            commitment.commitmentType = row.commitmentType;
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
                commitment.status = row.status;
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
        }
        catch (error) {
            results.errors.push({
                row,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    return results;
};
// Process HCV utilization file
const processHCVUtilizationFile = async (filePath) => {
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
        errors: []
    };
    for (const row of typedRows) {
        try {
            const typedRow = row;
            // Validate voucher type
            if (!Object.values(HCVUtilization_1.VoucherType).includes(typedRow.voucherType)) {
                throw new Error(`Invalid voucher type: ${typedRow.voucherType}`);
            }
            const utilization = new HCVUtilization_1.HCVUtilization();
            utilization.reportingDate = new Date(typedRow.reportingDate);
            utilization.voucherType = typedRow.voucherType;
            utilization.authorizedVouchers = parseInt(typedRow.authorizedVouchers);
            utilization.leasedVouchers = parseInt(typedRow.leasedVouchers);
            utilization.utilizationRate = parseFloat(typedRow.utilizationRate);
            utilization.hapExpenses = parseFloat(typedRow.hapExpenses);
            if (typedRow.averageHapPerUnit) {
                utilization.averageHapPerUnit = parseFloat(typedRow.averageHapPerUnit);
            }
            if (typedRow.budgetUtilization) {
                utilization.budgetUtilization = parseFloat(typedRow.budgetUtilization);
            }
            if (typedRow.notes) {
                utilization.notes = typedRow.notes;
            }
            // Save HCV utilization to database
            await hcvUtilizationRepository.save(utilization);
            results.success++;
        }
        catch (error) {
            results.errors.push({
                row,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    return results;
};
