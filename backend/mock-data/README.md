# Mock Data for MTW Utilization Dashboard

This directory contains mock data files for testing the MTW Utilization Dashboard. The data is based on publicly available information about San Mateo County Housing Authority but has been modified for testing purposes.

## Files Included

1. **san_mateo_hcv_utilization.csv** - Housing Choice Voucher utilization data for San Mateo County
2. **san_mateo_budget_authority.csv** - Budget authority data for San Mateo County Housing Authority
3. **san_mateo_hap_expenditures.csv** - Housing Assistance Payment expenditure data
4. **style_templates.csv** - Templates for different report writing styles

## Data Sources

The mock data is based on information from:
- Housing Authority of the County of San Mateo (HACSM) public reports
- HUD's Picture of Subsidized Households data
- AffordableHousingOnline.com statistics

## Importing the Data

To import this mock data into your database, run the import script:

```bash
node scripts/import-mock-data.js
```

## Data Structure

### HCV Utilization Data
- reportingDate: Date of the report
- voucherType: Type of voucher (tenant_based, project_based, etc.)
- authorizedVouchers: Number of vouchers authorized
- leasedVouchers: Number of vouchers leased
- utilizationRate: Percentage of vouchers utilized
- hapExpenses: Housing Assistance Payment expenses
- averageHapPerUnit: Average HAP per unit
- budgetUtilization: Percentage of budget utilized
- notes: Additional notes

### Budget Authority Data
- totalBudgetAmount: Total budget amount
- fiscalYear: Fiscal year
- effectiveDate: Date when the budget becomes effective
- expirationDate: Date when the budget expires
- isActive: Whether the budget is active
- notes: Additional notes

### HAP Expenditure Data
- expenditureDate: Date of the expenditure
- expenditureAmount: Amount of the expenditure
- voucherType: Type of voucher
- unitCount: Number of units
- averagePerUnit: Average expenditure per unit
- notes: Additional notes

### Style Templates
- name: Name of the template
- content: Content of the template
- category: Category of the template (executive, public, technical)

## Note

This data is for testing purposes only and should not be used for production.
