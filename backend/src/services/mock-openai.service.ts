/**
 * Mock OpenAI service for development and testing
 * This provides mock responses when the OpenAI API is unavailable or fails
 */

// Mock executive summary
export const mockExecutiveSummary = `
# Housing Choice Voucher (HCV) Utilization Executive Summary

## Overview
The Housing Authority has maintained an overall utilization rate of 94.2% across all voucher types over the past year, representing a 2.1% increase from the previous reporting period. This improvement demonstrates our commitment to maximizing the effectiveness of our housing assistance programs.

## Voucher Type Performance
- **MCP Vouchers**: Utilization rate of 96.8%, our highest performing category
- **HCV Vouchers**: Utilization rate of 93.5%, showing steady improvement
- **Project-Based Vouchers**: 92.1% utilization, with 3.2% increase in the last quarter
- **Special Purpose Vouchers**: 89.4% utilization, requiring additional attention

## Budget Implications
Current spending is at 97.3% of allocated HAP funds, indicating efficient budget management while maintaining adequate reserves. The projected year-end utilization suggests we will achieve 99.1% of our funding utilization target.

## Areas of Concern
1. Emergency Housing Vouchers show lower utilization (82.3%) due to challenges in landlord recruitment
2. Lease-up times have increased by an average of 12 days compared to the previous year
3. Port-outs have increased by 8.7%, impacting our administrative fees

## Notable Achievements
1. Successfully implemented the MTW flexibility initiatives, resulting in 43 additional families housed
2. Reduced the waiting list by 12% through improved processing efficiency
3. Decreased payment errors by 18% through enhanced quality control measures

## Recommendations
1. Expand landlord outreach efforts to improve Emergency Housing Voucher utilization
2. Implement the proposed process improvements to reduce lease-up times
3. Evaluate the impact of port-outs and consider policy adjustments
4. Continue to leverage MTW flexibility to maximize housing opportunities

This summary reflects data from March 2024 through March 2025, encompassing 1,876 active vouchers across all programs.
`;

// Mock voucher type report
export const mockVoucherTypeReport = (voucherType: string) => `
# ${voucherType.toUpperCase()} Voucher Utilization Analysis

## Historical Trends
The ${voucherType} voucher program has shown a consistent utilization pattern over the past 12 months, with an average utilization rate of 93.7%. The most recent quarter shows a slight improvement to 94.2%, indicating positive momentum.

## Budget Allocation and Spending
- **Annual Budget**: $4.2M allocated for this voucher type
- **Current Spending**: $3.9M (92.8% of allocation)
- **Per Unit Cost**: Average of $1,247 per month, a 3.2% increase from last year
- **Administrative Costs**: 8.4% of total program costs, within acceptable parameters

## Contributing Factors
1. The local rental market has stabilized, with average rents increasing by only 2.1%
2. Landlord retention rate improved to 87.3%, reducing turnover-related vacancies
3. Improved applicant screening has reduced failed inspections by 14.2%
4. Staff training initiatives have decreased processing times by 9.8 days on average

## Recommendations
1. Continue the landlord appreciation program that has shown positive results
2. Implement the proposed streamlined inspection process to further reduce delays
3. Consider increasing the payment standard in high-opportunity areas to improve leasing success
4. Expand the security deposit assistance program to reduce barriers to leasing

This analysis is based on data from March 2024 through March 2025, representing 412 active ${voucherType} vouchers.
`;

// Mock budget forecast
export const mockBudgetForecast = (months: number) => `
# HCV Budget Forecast (${months}-Month Projection)

## Executive Summary
Based on current utilization trends and market conditions, we project a total HAP expenditure of $24.8M over the next ${months} months, representing 97.3% of our available funding. This forecast indicates we are on track to maintain high utilization while preserving adequate reserves.

## Monthly Projections

| Month | Projected Units | Projected HAP | Utilization % | Cumulative % |
|-------|----------------|---------------|--------------|--------------|
| Month 1 | 1,842 | $2.05M | 96.8% | 96.8% |
| Month 2 | 1,851 | $2.07M | 97.2% | 97.0% |
| Month 3 | 1,858 | $2.08M | 97.6% | 97.2% |
${months > 3 ? '| Month 4 | 1,863 | $2.09M | 97.9% | 97.4% |\n' : ''}${months > 4 ? '| Month 5 | 1,865 | $2.10M | 98.0% | 97.5% |\n' : ''}${months > 5 ? '| Month 6 | 1,868 | $2.11M | 98.2% | 97.6% |\n' : ''}${months > 6 ? '| Months 7-' + months + ' | ~1,870 | ~$2.12M/month | ~98.3% | ~97.8% |\n' : ''}

## Financial Risks and Opportunities

### Risks
1. Potential increase in payment standards due to market pressures (impact: +2.3%)
2. Possible reduction in attrition rate (impact: +1.1% utilization)
3. Landlord recruitment challenges in high-opportunity areas

### Opportunities
1. MTW flexibility to optimize subsidy amounts (potential savings: 1.8%)
2. Improved processing efficiency (potential additional units: 12-18)
3. Strategic use of project-based vouchers to guarantee utilization

## Budget Management Recommendations
1. Maintain current leasing pace to achieve optimal utilization
2. Consider a phased approach to payment standard increases
3. Allocate $120K for landlord incentives in hard-to-lease areas
4. Implement monthly budget reviews to allow for timely adjustments
5. Prepare contingency plans for potential funding changes

This forecast is based on historical data from the past 12 months and accounts for seasonal variations, market trends, and program-specific factors.
`;

// Mock streaming report
export const mockStreamingReport = (
  reportType: string,
  options: any = {}
): string[] => {
  let chunks: string[] = [];
  
  switch (reportType) {
    case 'executive_summary':
      chunks = mockExecutiveSummary.split('\n\n').map(chunk => chunk + '\n\n');
      break;
    case 'voucher_analysis':
      const voucherType = options.voucherType || 'tenant_based';
      chunks = mockVoucherTypeReport(voucherType).split('\n\n').map(chunk => chunk + '\n\n');
      break;
    case 'budget_forecast':
      const months = options.forecastMonths || 6;
      chunks = mockBudgetForecast(months).split('\n\n').map(chunk => chunk + '\n\n');
      break;
    default:
      chunks = ['# Invalid report type requested\n\nPlease select a valid report type.'];
  }
  
  return chunks;
};

// Mock custom report
export const mockCustomReport = (customPrompt: string): string[] => {
  // Extract key terms from the prompt to customize the response
  const includesVoucher = customPrompt.toLowerCase().includes('voucher');
  const includesBudget = customPrompt.toLowerCase().includes('budget');
  const includesPerformance = customPrompt.toLowerCase().includes('performance');
  
  let response = '# Custom Housing Authority Report\n\n';
  
  if (includesVoucher) {
    response += '## Voucher Program Analysis\n\n';
    response += 'Our voucher programs have maintained a 94.7% utilization rate across all categories. MCP vouchers show the highest performance at 96.8%, while Emergency Housing Vouchers require additional attention at 82.3% utilization.\n\n';
  }
  
  if (includesBudget) {
    response += '## Budget Overview\n\n';
    response += 'Current spending is at 97.3% of allocated HAP funds, indicating efficient budget management while maintaining adequate reserves. The projected year-end utilization suggests we will achieve 99.1% of our funding target.\n\n';
  }
  
  if (includesPerformance) {
    response += '## Performance Metrics\n\n';
    response += 'Key performance indicators show improvement across most areas:\n\n';
    response += '- Processing time: Reduced by 9.8 days on average\n';
    response += '- Landlord retention: Improved to 87.3%\n';
    response += '- Payment errors: Decreased by 18%\n';
    response += '- Waiting list: Reduced by 12%\n\n';
  }
  
  response += '## Recommendations\n\n';
  response += '1. Continue landlord outreach and retention programs\n';
  response += '2. Implement streamlined inspection processes\n';
  response += '3. Consider strategic payment standard adjustments\n';
  response += '4. Expand successful MTW initiatives\n\n';
  
  return [response];
};
