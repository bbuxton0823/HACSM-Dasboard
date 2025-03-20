const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createConnection } = require('typeorm');
const { HCVUtilization } = require('../dist/models/HCVUtilization');
const { StyleTemplate } = require('../dist/models/StyleTemplate');
const { BudgetAuthority } = require('../dist/models/BudgetAuthority');
const { HAPExpenditure } = require('../dist/models/HAPExpenditure');

// Function to parse CSV file
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Main function to import data
const importData = async () => {
  try {
    // Connect to database
    const connection = await createConnection();
    console.log('Connected to database');

    // Import HCV Utilization data
    const hcvUtilizationData = await parseCSV(path.join(__dirname, '../mock-data/san_mateo_hcv_utilization.csv'));
    const hcvUtilizationRepo = connection.getRepository(HCVUtilization);
    
    console.log(`Importing ${hcvUtilizationData.length} HCV utilization records...`);
    for (const row of hcvUtilizationData) {
      const hcvData = new HCVUtilization();
      hcvData.reportingDate = new Date(row.reportingDate);
      hcvData.voucherType = row.voucherType;
      hcvData.authorizedVouchers = parseInt(row.authorizedVouchers);
      hcvData.leasedVouchers = parseInt(row.leasedVouchers);
      hcvData.utilizationRate = parseFloat(row.utilizationRate);
      hcvData.hapExpenses = parseFloat(row.hapExpenses);
      hcvData.averageHapPerUnit = parseFloat(row.averageHapPerUnit);
      hcvData.budgetUtilization = parseFloat(row.budgetUtilization);
      hcvData.notes = row.notes;
      
      await hcvUtilizationRepo.save(hcvData);
    }
    console.log('HCV utilization data imported successfully');

    // Import Budget Authority data
    const budgetAuthorityData = await parseCSV(path.join(__dirname, '../mock-data/san_mateo_budget_authority.csv'));
    const budgetAuthorityRepo = connection.getRepository(BudgetAuthority);
    
    console.log(`Importing ${budgetAuthorityData.length} budget authority records...`);
    for (const row of budgetAuthorityData) {
      const budgetData = new BudgetAuthority();
      budgetData.totalBudgetAmount = parseFloat(row.totalBudgetAmount);
      budgetData.fiscalYear = parseInt(row.fiscalYear);
      budgetData.effectiveDate = new Date(row.effectiveDate);
      if (row.expirationDate) {
        budgetData.expirationDate = new Date(row.expirationDate);
      }
      budgetData.isActive = row.isActive === 'true';
      budgetData.notes = row.notes;
      
      await budgetAuthorityRepo.save(budgetData);
    }
    console.log('Budget authority data imported successfully');

    // Import HAP Expenditure data
    const hapExpenditureData = await parseCSV(path.join(__dirname, '../mock-data/san_mateo_hap_expenditures.csv'));
    const hapExpenditureRepo = connection.getRepository(HAPExpenditure);
    
    console.log(`Importing ${hapExpenditureData.length} HAP expenditure records...`);
    for (const row of hapExpenditureData) {
      const hapData = new HAPExpenditure();
      hapData.expenditureDate = new Date(row.expenditureDate);
      hapData.expenditureAmount = parseFloat(row.expenditureAmount);
      hapData.voucherType = row.voucherType;
      hapData.unitCount = parseInt(row.unitCount);
      hapData.averagePerUnit = parseFloat(row.averagePerUnit);
      hapData.notes = row.notes;
      
      await hapExpenditureRepo.save(hapData);
    }
    console.log('HAP expenditure data imported successfully');

    // Import Style Templates data
    const styleTemplatesData = await parseCSV(path.join(__dirname, '../mock-data/style_templates.csv'));
    const styleTemplateRepo = connection.getRepository(StyleTemplate);
    
    console.log(`Importing ${styleTemplatesData.length} style templates...`);
    for (const row of styleTemplatesData) {
      const templateData = new StyleTemplate();
      templateData.name = row.name;
      templateData.content = row.content;
      templateData.category = row.category;
      
      await styleTemplateRepo.save(templateData);
    }
    console.log('Style templates imported successfully');

    // Close connection
    await connection.close();
    console.log('Database connection closed');
    console.log('All mock data imported successfully!');
    
  } catch (error) {
    console.error('Error importing mock data:', error);
  }
};

// Run the import
importData();
