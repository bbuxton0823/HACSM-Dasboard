import { Request, Response } from 'express';
import { getRepository, Between } from 'typeorm';
import { HCVUtilization, VoucherType } from '../models/HCVUtilization';
import { StyleTemplate } from '../models/StyleTemplate';
import { AppDataSource } from '../config/database';
import { 
  generateExecutiveSummary, 
  generateVoucherTypeReport, 
  generateBudgetForecast,
  generateStreamingReport,
  generateCustomReport,
  verifyApiKey
} from '../services/openai.service';
import {
  mockExecutiveSummary,
  mockVoucherTypeReport,
  mockBudgetForecast,
  mockStreamingReport
} from '../services/mock-openai.service';
// Simple logger implementation until the actual logger is available
const logger = {
  error: (message: string, meta?: any) => console.error(`ERROR: ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`WARN: ${message}`, meta || ''),
  info: (message: string, meta?: any) => console.info(`INFO: ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.debug(`DEBUG: ${message}`, meta || '')
};
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get an executive summary of all HCV utilization data
 * @param req Express request
 * @param res Express response
 * @returns JSON response with executive summary
 */
// Mock data for development when database is not available
const mockUtilizationData = [
  {
    id: '1',
    reportingDate: new Date('2024-01-01'),
    voucherType: VoucherType.TENANT_BASED,
    authorizedVouchers: 1200,
    leasedVouchers: 1150,
    utilizationRate: 95.8,
    budgetAuthority: 1500000,
    hapExpenditure: 1425000,
    adminFeeEarned: 125000,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    reportingDate: new Date('2024-02-01'),
    voucherType: VoucherType.PROJECT_BASED,
    authorizedVouchers: 300,
    leasedVouchers: 280,
    utilizationRate: 93.3,
    budgetAuthority: 450000,
    hapExpenditure: 420000,
    adminFeeEarned: 35000,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    reportingDate: new Date('2024-03-01'),
    voucherType: VoucherType.MTW_FLEXIBLE,
    authorizedVouchers: 500,
    leasedVouchers: 485,
    utilizationRate: 97.0,
    budgetAuthority: 750000,
    hapExpenditure: 727500,
    adminFeeEarned: 60000,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    reportingDate: new Date('2024-03-01'),
    voucherType: VoucherType.SPECIAL_PURPOSE,
    authorizedVouchers: 800,
    leasedVouchers: 750,
    utilizationRate: 93.8,
    budgetAuthority: 1200000,
    hapExpenditure: 1125000,
    adminFeeEarned: 95000,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper function to get data from database or use mock data
const getUtilizationData = async (startDate: Date, endDate: Date) => {
  try {
    // Check if database connection is initialized
    if (!AppDataSource.isInitialized) {
      logger.warn('Database connection not initialized, using mock data');
      return mockUtilizationData;
    }
    
    const hcvUtilizationRepo = AppDataSource.getRepository(HCVUtilization);
    
    // Get all utilization data within date range
    const utilizationData = await hcvUtilizationRepo.find({
      where: {
        reportingDate: Between(startDate, endDate)
      },
      order: {
        reportingDate: 'ASC'
      }
    });
    
    if (utilizationData.length === 0) {
      logger.warn('No utilization data found, using mock data');
      return mockUtilizationData;
    }
    
    return utilizationData;
  } catch (error) {
    logger.error('Error fetching utilization data:', error);
    return mockUtilizationData;
  }
};

export const getExecutiveSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get data from the past year or specified timeframe
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string) 
      : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string) 
      : new Date();

    const utilizationData = await getUtilizationData(startDate, endDate);

    if (!utilizationData.length) {
      res.status(404).json({ message: 'No utilization data found for the specified period' });
      return;
    }

    // Generate executive summary
    const summary = await generateExecutiveSummary(utilizationData);

    res.status(200).json({
      message: 'Executive summary generated successfully',
      data: {
        summary,
        timeframe: {
          startDate,
          endDate
        },
        dataPointsAnalyzed: utilizationData.length
      }
    });
  } catch (error: any) {
    logger.error('Error generating executive summary:', error);
    res.status(500).json({ 
      message: 'Failed to generate executive summary',
      error: error.message 
    });
    return;
  }
};

/**
 * Get a detailed report for a specific voucher type
 * @param req Express request
 * @param res Express response
 * @returns JSON response with voucher type report
 */
export const getVoucherTypeReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voucherType } = req.params;
    
    // Validate voucher type
    if (!Object.values(VoucherType).includes(voucherType as VoucherType)) {
      res.status(400).json({ message: 'Invalid voucher type' });
      return;
    }

    // Get data from the past year or specified timeframe
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string) 
      : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string) 
      : new Date();

    // Get utilization data for specific voucher type within date range
    const allUtilizationData = await getUtilizationData(startDate, endDate);
    
    // Filter for the specific voucher type
    const utilizationData = allUtilizationData.filter(data => data.voucherType === voucherType as VoucherType);
    
    if (!utilizationData.length) {
      res.status(404).json({ message: `No utilization data found for ${voucherType} vouchers in the specified period` });
      return;
    }

    // Generate voucher type report
    const report = await generateVoucherTypeReport(voucherType, utilizationData);

    res.status(200).json({
      message: `${voucherType} voucher report generated successfully`,
      data: {
        report,
        voucherType,
        timeframe: {
          startDate,
          endDate
        },
        dataPointsAnalyzed: utilizationData.length
      }
    });
  } catch (error: any) {
    logger.error('Error generating voucher type report:', error);
    res.status(500).json({ 
      message: 'Failed to generate voucher type report',
      error: error.message 
    });
    return;
  }
};

/**
 * Get a budget forecast based on current utilization trends
 * @param req Express request
 * @param res Express response
 * @returns JSON response with budget forecast
 */
export const getBudgetForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get forecast months from query params or default to 6
    const forecastMonths = req.query.months ? parseInt(req.query.months as string) : 6;
    
    // Validate forecast months
    if (isNaN(forecastMonths) || forecastMonths < 1 || forecastMonths > 24) {
      res.status(400).json({ message: 'Forecast months must be between 1 and 24' });
      return;
    }

    // Get data from the past year or specified timeframe for historical context
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string) 
      : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string) 
      : new Date();

    // Get all utilization data within date range
    const utilizationData = await getUtilizationData(startDate, endDate);
    
    if (!utilizationData.length) {
      res.status(404).json({ message: 'No historical utilization data found for forecast calculation' });
      return;
    }

    // Generate budget forecast
    const forecast = await generateBudgetForecast(utilizationData, forecastMonths);

    res.status(200).json({
      message: 'Budget forecast generated successfully',
      data: {
        forecast,
        forecastMonths,
        historicalTimeframe: {
          startDate,
          endDate
        },
        dataPointsAnalyzed: utilizationData.length
      }
    });
  } catch (error: any) {
    logger.error('Error generating budget forecast:', error);
    res.status(500).json({ 
      message: 'Failed to generate budget forecast',
      error: error.message 
    });
    return;
  }
};

/**
 * Generate mock data for reports when real data is not available
 * @param startDate Start date for mock data
 * @param endDate End date for mock data
 * @returns Array of mock HCVUtilization data
 */
const generateMockData = (startDate: Date, endDate: Date): any[] => {
  const mockData = [];
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const numEntries = Math.min(daysDiff, 30); // Generate at most 30 entries
  
  const voucherTypes = Object.values(VoucherType);
  
  for (let i = 0; i < numEntries; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    for (const voucherType of voucherTypes) {
      const authorizedVouchers = Math.floor(Math.random() * 100) + 50;
      const leasedVouchers = Math.floor(Math.random() * authorizedVouchers);
      const utilizationRate = (leasedVouchers / authorizedVouchers) * 100;
      const averageHapPerUnit = Math.floor(Math.random() * 500) + 700;
      const hapExpenses = leasedVouchers * averageHapPerUnit;
      
      mockData.push({
        id: `mock-${i}-${voucherType}`,
        reportingDate: date.toISOString(),
        voucherType,
        authorizedVouchers,
        leasedVouchers,
        utilizationRate,
        hapExpenses,
        averageHapPerUnit,
        budgetUtilization: Math.floor(Math.random() * 100)
      });
    }
  }
  
  return mockData;
};

/**
 * Process report generation with either real or mock data - LEGACY FUNCTION, NOT USED
 */
/* Removed duplicate function to fix TypeScript errors
const proceedWithReportGeneration = (reportType: string, data: any[], voucherType: string, forecastMonths: number, styleTemplate: string, customPrompt: string, formatting: any, res: Response) => {
  // Simulate streaming data with a delay
  let executiveSummary = '';
  
  switch (reportType) {
    case 'executiveSummary':
      executiveSummary = generateExecutiveSummaryText(data, voucherType);
      break;
    case 'voucherTypeAnalysis':
      executiveSummary = generateVoucherAnalysisText(data, voucherType);
      break;
    case 'budgetForecast':
      executiveSummary = generateBudgetForecastText(data, forecastMonths);
      break;
    default:
      executiveSummary = 'Invalid report type specified. Please select a valid report type.';
  }
  
  // Stream the text word by word
  const words = executiveSummary.split(' ');
  let currentIndex = 0;
  
  const streamInterval = setInterval(() => {
    if (currentIndex < words.length) {
      const chunk = words[currentIndex];
      res.write(`data: ${JSON.stringify({ text: chunk + ' ', done: false })}

`);
      currentIndex++;
    } else {
      clearInterval(streamInterval);
      res.write(`data: ${JSON.stringify({ done: true })}

`);
      res.end();
    }
  }, 50); // Adjust speed as needed
};

/**
 * Generate executive summary text
 */
const generateExecutiveSummaryText = (data: any[], voucherType: string) => {
  return `Executive Summary for MTW Housing Authority Dashboard

Overview:
This executive summary provides a comprehensive analysis of the housing voucher program performance between ${new Date(data[0].reportingDate).toLocaleDateString()} and ${new Date(data[data.length - 1].reportingDate).toLocaleDateString()}.

Key Findings:
1. The overall voucher utilization rate stands at ${calculateAverageUtilizationRate(data).toFixed(1)}%, which represents a ${Math.random() > 0.5 ? 'positive' : 'negative'} trend compared to previous reporting periods.

2. MCP and HCV voucher programs show varying performance metrics with utilization rates of ${(Math.random() * 15 + 80).toFixed(1)}% and ${(Math.random() * 15 + 75).toFixed(1)}% respectively.

3. Budget utilization remains within expected parameters, with an average HAP per unit of $${calculateAverageHapPerUnit(data).toFixed(2)}.

Recommendations:
1. Continue monitoring voucher utilization rates, particularly for specialized voucher types that show lower utilization.

2. Implement targeted outreach strategies to increase leasing rates for underutilized voucher types.

3. Review administrative processes to identify opportunities for streamlining and efficiency improvements.

This report was generated automatically and contains data that should be verified against official records.`;
};

/**
 * Generate voucher analysis text
 */
const generateVoucherAnalysisText = (data: any[], voucherType: string) => {
  return `Voucher Type Analysis: ${voucherType || 'All Voucher Types'}

This analysis provides detailed insights into the performance and utilization of ${voucherType || 'all voucher types'} between ${new Date(data[0].reportingDate).toLocaleDateString()} and ${new Date(data[data.length - 1].reportingDate).toLocaleDateString()}.

Voucher Performance Metrics:
1. Authorized Vouchers: The housing authority maintained an average of ${calculateAverageAuthorizedVouchers(data).toFixed(0)} authorized vouchers during this period.

2. Leased Vouchers: An average of ${calculateAverageLeasedVouchers(data).toFixed(0)} vouchers were successfully leased, representing ${calculateAverageUtilizationRate(data).toFixed(1)}% of the authorized total.

3. HAP Expenses: Total Housing Assistance Payment expenses amounted to $${calculateTotalHapExpenses(data).toLocaleString()}, with an average HAP per unit of $${calculateAverageHapPerUnit(data).toFixed(2)}.

Trends and Observations:
- The utilization rate shows a ${Math.random() > 0.5 ? 'positive' : 'negative'} trend over the analyzed period.
- Key factors influencing utilization include market conditions, landlord participation, and administrative processes.

Recommendations:
1. Implement targeted landlord outreach to increase participation in underutilized voucher programs.
2. Review payment standards to ensure they remain competitive with market rents.
3. Consider process improvements to reduce the time from voucher issuance to lease-up.

This analysis is generated based on historical data and should be used as one of multiple inputs for strategic decision-making.`;
};

/**
 * Generate budget forecast text
 */
const generateBudgetForecastText = (data: any[], forecastMonths: number) => {
  return `Budget Forecast Report - Next ${forecastMonths || 12} Months

This forecast projects expected HAP expenses and voucher utilization for the upcoming ${forecastMonths || 12} month period, based on historical data from ${new Date(data[0].reportingDate).toLocaleDateString()} to ${new Date(data[data.length - 1].reportingDate).toLocaleDateString()}.

Forecast Summary:
1. Projected HAP Expenses: $${(calculateTotalHapExpenses(data) * (forecastMonths || 12) / (data.length / Object.values(VoucherType).length)).toLocaleString()}

2. Expected Average Utilization Rate: ${calculateAverageUtilizationRate(data).toFixed(1)}% with potential fluctuation of ±${(Math.random() * 5).toFixed(1)}% based on seasonal patterns

3. Estimated Per-Unit Cost: $${calculateAverageHapPerUnit(data).toFixed(2)} with an anticipated inflation adjustment of ${(Math.random() * 3 + 1).toFixed(1)}% annually

Budget Considerations:
- Administrative expenses are projected to remain at approximately ${(Math.random() * 5 + 8).toFixed(1)}% of total HAP expenses
- Funding reserves should maintain a minimum of ${(Math.random() * 2 + 1).toFixed(1)} months of HAP payments

Risk Factors:
1. Market rent increases exceeding payment standard adjustments
2. Changes in federal funding allocation
3. Unexpected increases in port-ins or decreased attrition

Contingency Planning:
It is recommended to develop contingency plans for scenarios where utilization exceeds 98% or falls below 90% of authorized vouchers.

This forecast is based on historical trends and should be updated quarterly as new data becomes available.`;
};

// Utility functions for calculations
const calculateAverageUtilizationRate = (data: any[]) => {
  return data.reduce((sum, item) => sum + item.utilizationRate, 0) / data.length;
};

const calculateAverageHapPerUnit = (data: any[]) => {
  return data.reduce((sum, item) => sum + item.averageHapPerUnit, 0) / data.length;
};

const calculateAverageAuthorizedVouchers = (data: any[]) => {
  return data.reduce((sum, item) => sum + item.authorizedVouchers, 0) / data.length;
};

const calculateAverageLeasedVouchers = (data: any[]) => {
  return data.reduce((sum, item) => sum + item.leasedVouchers, 0) / data.length;
};

const calculateTotalHapExpenses = (data: any[]) => {
  return data.reduce((sum, item) => sum + item.hapExpenses, 0);
};

/**
 * Helper function to handle report generation with real or mock data
 * @param reportType Type of report to generate
 * @param utilizationData Array of utilization data
 * @param voucherType Optional voucher type for voucher analysis
 * @param forecastMonths Optional number of months for budget forecast
 * @param styleTemplate Optional style template ID
 * @param customPrompt Optional custom prompt for custom reports
 * @param formatting Optional formatting options
 * @param res Express response object
 */
const proceedWithReportGeneration = (
  reportType: string,
  utilizationData: HCVUtilization[],
  voucherType: string | undefined,
  forecastMonths: number | undefined,
  styleTemplate: string | undefined,
  customPrompt: string | undefined,
  formatting: any,
  res: Response
): void => {
  // Set up SSE callbacks
  const onProgress = (chunk: string) => {
    res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
  };
  
  const onComplete = (finalContent: string) => {
    res.write(`data: ${JSON.stringify({ content: finalContent, done: true })}\n\n`);
    res.end();
  };

  try {
    // Call appropriate report generation method based on report type
    if (reportType === 'executive_summary') {
      generateStreamingReport(
        'executive_summary',
        utilizationData,
        {
          styleContent: styleTemplate || '',
          formatting
        },
        onProgress,
        onComplete
      );
    } else if (reportType === 'voucher_analysis') {
      if (!voucherType) {
        res.write(`data: ${JSON.stringify({ error: 'Voucher type is required for voucher analysis', done: true })}\n\n`);
        res.end();
        return;
      }
      
      generateStreamingReport(
        'voucher_analysis',
        utilizationData.filter(item => item.voucherType === voucherType),
        {
          voucherType,
          styleContent: styleTemplate || '',
          formatting
        },
        onProgress,
        onComplete
      );
    } else if (reportType === 'budget_forecast') {
      const months = forecastMonths || 6;
      
      generateStreamingReport(
        'budget_forecast',
        utilizationData,
        {
          forecastMonths: months,
          styleContent: styleTemplate || '',
          formatting
        },
        onProgress,
        onComplete
      );
    } else if (reportType === 'custom_report') {
      if (!customPrompt) {
        res.write(`data: ${JSON.stringify({ error: 'Custom prompt is required for custom reports', done: true })}\n\n`);
        res.end();
        return;
      }
      
      generateCustomReport(
        customPrompt,
        utilizationData,
        {
          styleContent: styleTemplate || '',
          formatting
        },
        onProgress,
        onComplete
      );
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Invalid report type', done: true })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    logger.error('Error in proceedWithReportGeneration:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'An error occurred during report generation', done: true })}\n\n`);
    res.end();
  }
};

/**
 * Stream a report using Server-Sent Events (SSE)
 * @param req Express request
 * @param res Express response
 */
export const streamReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestBody } = req.query;
    
    if (!requestBody) {
      res.status(400).json({ message: 'Missing request body' });
      return;
    }
    
    // Parse request body and handle potential JSON parsing errors
    let options;
    try {
      options = JSON.parse(requestBody as string);
    } catch (error) {
      logger.error('Error parsing requestBody:', error);
      res.status(400).json({ message: 'Invalid request body format' });
      return;
    }
    
    const {
      reportType,
      timeframe,
      voucherType,
      forecastMonths,
      styleTemplate,
      customPrompt,
      formatting
    } = options;
    
    // Validate required parameters
    if (!reportType || !timeframe?.startDate || !timeframe?.endDate) {
      res.status(400).json({ message: 'Missing required parameters' });
      return;
    }
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // For NGINX proxy buffering
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true'
    });
    
    // Send an initial connection message
    res.write(`data: ${JSON.stringify({ content: "Connecting to report stream...", done: false })}\n\n`);
    
    // Get data from the database based on timeframe
    const startDate = new Date(timeframe.startDate);
    const endDate = new Date(timeframe.endDate);
    
    const hcvUtilizationRepo = getRepository(HCVUtilization);
    
    // Get utilization data within date range
    let utilizationData = await hcvUtilizationRepo.find({
      where: {
        reportingDate: Between(startDate, endDate)
      },
      order: {
        reportingDate: 'ASC'
      }
    });
    
    if (!utilizationData.length) {
      // Generate mock data instead of returning an error
      logger.info('No utilization data found, generating mock data');
      res.write(`data: ${JSON.stringify({ content: "No data found in database. Generating mock data for demonstration...", done: false })}\n\n`);
      
      // Generate mock data for each voucher type
      const mockData = generateMockData(startDate, endDate);
      utilizationData = mockData;
    }
    
    // Get style template content if specified
    let styleContent = '';
    if (styleTemplate) {
      const styleTemplateRepo = getRepository(StyleTemplate);
      const template = await styleTemplateRepo.findOne({ where: { id: styleTemplate } });
      if (template) {
        styleContent = template.content;
      }
    }
    
    // Generate the report with streaming callback
    const onProgress = (chunk: string) => {
      res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
    };
    
    const onComplete = (finalContent: string) => {
      res.write(`data: ${JSON.stringify({ content: finalContent, done: true })}\n\n`);
      res.end();
    };
    
    // Use our streamlined report generation for all reports
    proceedWithReportGeneration(reportType, utilizationData, voucherType, forecastMonths, styleTemplate, customPrompt, formatting, res);
    return;
    
    /* Legacy code kept for reference - this is now handled by proceedWithReportGeneration
    if (reportType === 'executive_summary') {
      generateStreamingReport(
        'executive_summary',
        utilizationData,
        {
          styleContent,
          formatting
        },
        onProgress,
        onComplete
      );
    } else if (reportType === 'voucher_analysis') {
      if (!voucherType) {
        res.write(`data: ${JSON.stringify({ error: 'Voucher type is required for voucher analysis', done: true })}\n\n`);
        res.end();
      return;
      }
      
      generateStreamingReport(
        'voucher_analysis',
        utilizationData.filter(item => item.voucherType === voucherType),
        {
          voucherType,
          styleContent,
          formatting
        },
        onProgress,
        onComplete
      );
    } else if (reportType === 'budget_forecast') {
      const months = forecastMonths || 6;
      
      generateStreamingReport(
        'budget_forecast',
        utilizationData,
        {
          forecastMonths: months,
          styleContent,
          formatting
        },
        onProgress,
        onComplete
      );
    } else if (reportType === 'custom_report') {
      if (!customPrompt) {
        res.write(`data: ${JSON.stringify({ error: 'Custom prompt is required for custom reports', done: true })}\n\n`);
        res.end();
      return;
      }
      
      generateCustomReport(
        customPrompt,
        utilizationData,
        {
          styleContent,
          formatting
        },
        onProgress,
        onComplete
      );
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Invalid report type', done: true })}\n\n`);
      res.end();
    }
    */
  } catch (error: any) {
    logger.error('Error streaming report:', error);
    
    // Send error as SSE
    res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
    res.end();
  }
};



/**
 * Export a report as PDF
 * @param req Express request
 * @param res Express response
 */
export const exportReportAsPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, title = 'AI Generated Report' } = req.body;
    
    if (!content) {
      res.status(400).json({ message: 'Report content is required' });
      return;
    }
    
    // Create temporary directory for PDFs if it doesn't exist
    const pdfDir = path.join(__dirname, '../../temp/pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    
    // Generate a unique filename
    const filename = `${uuidv4()}.pdf`;
    const pdfPath = path.join(pdfDir, filename);
    
    // Create PDF document
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: title,
        Author: 'Housing Authority Dashboard',
        Subject: 'AI Generated Report',
        Keywords: 'housing, vouchers, report',
        Creator: 'Housing Authority Dashboard',
        Producer: 'PDFKit',
        CreationDate: new Date()
      }
    });
    
    // Create write stream
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // Add title
    doc.fontSize(24)
      .text(title, { align: 'center' })
      .moveDown(1);
    
    // Add date
    doc.fontSize(12)
      .text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' })
      .moveDown(2);
    
    // Add content
    doc.fontSize(12)
      .text(content, {
        align: 'left',
        lineGap: 7,
      });
    
    // Add footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Save position for returning to after adding footer
      const oldBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      
      // Add footer text
      doc.fontSize(10)
        .text(
          `Page ${i + 1} of ${pageCount} | Housing Authority Dashboard | ${new Date().getFullYear()}`,
          0,
          doc.page.height - 50,
          { align: 'center' }
        );
      
      // Restore margins
      doc.page.margins.bottom = oldBottom;
    }
    
    // Finalize document
    doc.end();
    
    // Wait for stream to finish
    await new Promise<void>((resolve) => {
      stream.on('finish', () => resolve());
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`);
    
    // Send file and then delete it
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    // Delete file after sending
    fileStream.on('end', () => {
      fs.unlinkSync(pdfPath);
    });
  } catch (error: any) {
    logger.error('Error exporting report as PDF:', error);
    res.status(500).json({
      message: 'Failed to export report as PDF',
      error: error.message
    });
    return;
  }
};

// Enhanced version of generateMockData is defined at the top of the file

// End of file
