"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCustomReport = exports.generateStreamingReport = exports.generateBudgetForecast = exports.generateVoucherTypeReport = exports.generateExecutiveSummary = exports.verifyApiKey = void 0;
const openai_1 = require("openai");
const dotenv_1 = require("dotenv");
const logger_1 = require("../utils/logger");
const mock_openai_service_1 = require("./mock-openai.service");
// Load environment variables
(0, dotenv_1.config)();
// Initialize OpenAI client
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Flag to track if we've verified the API key is valid
let isApiKeyValid = null;
/**
 * Verify if the OpenAI API key is valid
 * @returns Promise<boolean> True if the API key is valid
 */
const verifyApiKey = async () => {
    if (isApiKeyValid !== null) {
        return isApiKeyValid;
    }
    try {
        // Make a minimal API call to check if the key works
        const response = await openai.chat.completions.create({
            messages: [{ role: 'user', content: 'Hello' }],
            model: 'gpt-3.5-turbo',
            max_tokens: 5,
        });
        isApiKeyValid = !!response.choices[0].message.content;
        if (isApiKeyValid) {
            logger_1.logger.info('OpenAI API key verified successfully');
        }
        else {
            logger_1.logger.warn('OpenAI API key verification returned empty response');
        }
        return isApiKeyValid;
    }
    catch (error) {
        logger_1.logger.error('OpenAI API key verification failed:', error);
        isApiKeyValid = false;
        return false;
    }
};
exports.verifyApiKey = verifyApiKey;
/**
 * Check if we should use mock data instead of calling the API
 * @returns Promise<boolean> True if we should use mock data
 */
const shouldUseMockData = async () => {
    // If we're in development mode and BYPASS_AUTH is true, check if API key is valid
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        const apiKeyValid = await (0, exports.verifyApiKey)();
        return !apiKeyValid;
    }
    return false;
};
/**
 * Generate an executive summary of HCV utilization data
 * @param data Array of utilization data for different voucher types
 * @returns Generated summary text
 */
const generateExecutiveSummary = async (data) => {
    // Check if we should use mock data
    if (await shouldUseMockData()) {
        logger_1.logger.info('Using mock data for executive summary');
        return mock_openai_service_1.mockExecutiveSummary;
    }
    try {
        // Prepare the data for the prompt
        const formattedData = JSON.stringify(data, null, 2);
        // Create a prompt for OpenAI
        const prompt = `
    You are an expert housing analyst for a Housing Authority. 
    Analyze the following Housing Choice Voucher (HCV) utilization data and provide a concise executive summary.
    Focus on:
    1. Overall utilization rates and trends
    2. Performance comparisons between different voucher types
    3. Budget implications
    4. Areas of concern or notable achievements
    5. Recommendations for improvement

    Here is the data (JSON format):
    ${formattedData}

    Provide a well-structured executive summary (300-500 words) with key insights and actionable recommendations.
    `;
        // Call OpenAI API
        const response = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4',
            temperature: 0.5,
            max_tokens: 1000,
        });
        // Return the generated summary
        return response.choices[0].message.content || 'Unable to generate summary.';
    }
    catch (error) {
        logger_1.logger.error('Error generating executive summary:', error);
        throw new Error('Failed to generate executive summary');
    }
};
exports.generateExecutiveSummary = generateExecutiveSummary;
/**
 * Generate a report focused on a specific voucher type
 * @param voucherType Type of voucher to analyze
 * @param data Array of utilization data for the specific voucher type
 * @returns Generated report text
 */
const generateVoucherTypeReport = async (voucherType, data) => {
    // Check if we should use mock data
    if (await shouldUseMockData()) {
        logger_1.logger.info(`Using mock data for ${voucherType} voucher report`);
        return (0, mock_openai_service_1.mockVoucherTypeReport)(voucherType);
    }
    try {
        // Prepare the data for the prompt
        const formattedData = JSON.stringify(data, null, 2);
        // Create a prompt for OpenAI
        const prompt = `
    You are an expert housing analyst for a Housing Authority. 
    Analyze the following Housing Choice Voucher (HCV) utilization data for ${voucherType} vouchers.
    Focus on:
    1. Historical trends in utilization rates
    2. Budget allocation and spending efficiency
    3. Factors contributing to current performance
    4. Comparison to industry benchmarks (if inferrable)
    5. Specific recommendations for this voucher type

    Here is the data (JSON format):
    ${formattedData}

    Provide a concise but comprehensive report (200-300 words) with key insights and actionable recommendations 
    specifically for managing this voucher type.
    `;
        // Call OpenAI API
        const response = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4',
            temperature: 0.5,
            max_tokens: 800,
        });
        // Return the generated report
        return response.choices[0].message.content || 'Unable to generate report.';
    }
    catch (error) {
        logger_1.logger.error(`Error generating ${voucherType} report:`, error);
        throw new Error(`Failed to generate ${voucherType} report`);
    }
};
exports.generateVoucherTypeReport = generateVoucherTypeReport;
/**
 * Generate a budget forecast based on current utilization data
 * @param data Array of utilization data
 * @param forecastMonths Number of months to forecast
 * @returns Generated forecast text
 */
const generateBudgetForecast = async (data, forecastMonths = 6) => {
    // Check if we should use mock data
    if (await shouldUseMockData()) {
        logger_1.logger.info(`Using mock data for budget forecast (${forecastMonths} months)`);
        return (0, mock_openai_service_1.mockBudgetForecast)(forecastMonths);
    }
    try {
        // Prepare the data for the prompt
        const formattedData = JSON.stringify(data, null, 2);
        // Create a prompt for OpenAI
        const prompt = `
    You are an expert financial analyst for a Housing Authority. 
    Based on the following Housing Choice Voucher (HCV) utilization data, provide a budget forecast 
    for the next ${forecastMonths} months.
    
    Focus on:
    1. Projected utilization rates by voucher type
    2. Estimated HAP expenses
    3. Budget utilization forecasts
    4. Potential financial risks or opportunities
    5. Recommendations for budget management

    Here is the historical data (JSON format):
    ${formattedData}

    Provide a detailed budget forecast (300-500 words) with month-by-month projections 
    and financial management recommendations.
    `;
        // Call OpenAI API
        const response = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4',
            temperature: 0.5,
            max_tokens: 1000,
        });
        // Return the generated forecast
        return response.choices[0].message.content || 'Unable to generate budget forecast.';
    }
    catch (error) {
        logger_1.logger.error('Error generating budget forecast:', error);
        throw new Error('Failed to generate budget forecast');
    }
};
exports.generateBudgetForecast = generateBudgetForecast;
/**
 * Generate a streaming report using OpenAI's streaming capability
 * @param reportType Type of report to generate (executive_summary, voucher_analysis, budget_forecast)
 * @param data Array of utilization data
 * @param options Additional options for the report
 * @param onProgress Callback function for streaming progress
 * @param onComplete Callback function for completion
 */
const generateStreamingReport = async (reportType, data, options = {}, onProgress, onComplete) => {
    var _a, _b;
    // Check if we should use mock data
    if (await shouldUseMockData()) {
        logger_1.logger.info(`Using mock data for streaming report (${reportType})`);
        const mockChunks = (0, mock_openai_service_1.mockStreamingReport)(reportType, options);
        let fullContent = '';
        // Simulate streaming with setTimeout
        for (let i = 0; i < mockChunks.length; i++) {
            setTimeout(() => {
                const chunk = mockChunks[i];
                onProgress(chunk);
                fullContent += chunk;
                if (i === mockChunks.length - 1) {
                    onComplete(fullContent);
                }
            }, i * 300); // Simulate streaming with 300ms delay between chunks
        }
        return;
    }
    try {
        const { voucherType, forecastMonths = 6, styleContent = '', formatting = {} } = options;
        // Format data for the prompt
        const formattedData = JSON.stringify(data, null, 2);
        // Default formatting options
        const { includeHeadings = true, includeCharts = true, includeRecommendations = true, tone = 'formal', length = 'standard' } = formatting;
        // Create base prompt based on report type
        let basePrompt = '';
        if (reportType === 'executive_summary') {
            basePrompt = `
      You are an expert housing analyst for a Housing Authority.
      Analyze the following Housing Choice Voucher (HCV) utilization data and provide a concise executive summary.
      
      Focus on:
      1. Overall utilization rates and trends
      2. Performance comparisons between different voucher types
      3. Budget implications
      4. Areas of concern or notable achievements
      5. Recommendations for improvement

      Here is the data (JSON format):
      ${formattedData}
      `;
        }
        else if (reportType === 'voucher_analysis') {
            basePrompt = `
      You are an expert housing analyst for a Housing Authority.
      Analyze the following Housing Choice Voucher (HCV) utilization data for ${voucherType} vouchers.
      
      Focus on:
      1. Historical trends in utilization rates
      2. Budget allocation and spending efficiency
      3. Factors contributing to current performance
      4. Comparison to industry benchmarks (if inferrable)
      5. Specific recommendations for this voucher type

      Here is the data (JSON format):
      ${formattedData}
      `;
        }
        else if (reportType === 'budget_forecast') {
            basePrompt = `
      You are an expert financial analyst for a Housing Authority.
      Based on the following Housing Choice Voucher (HCV) utilization data, provide a budget forecast
      for the next ${forecastMonths} months.
      
      Focus on:
      1. Projected utilization rates by voucher type
      2. Estimated HAP expenses
      3. Budget utilization forecasts
      4. Potential financial risks or opportunities
      5. Recommendations for budget management

      Here is the historical data (JSON format):
      ${formattedData}
      `;
        }
        // Add formatting instructions
        let formattingInstructions = `
    Please format your response with the following characteristics:
    - Tone: ${tone}
    - Length: ${length === 'brief' ? '200-300 words' : length === 'detailed' ? '500-800 words' : '300-500 words'}
    ${includeHeadings ? '- Include clear section headings and structure' : '- Minimal headings'}
    ${includeRecommendations ? '- Include specific, actionable recommendations' : '- Focus more on analysis than recommendations'}
    `;
        // Add style template if provided
        let styleInstructions = '';
        if (styleContent) {
            styleInstructions = `
      Please use the following style template as a guide for your writing style and structure:

      ${styleContent}

      Adapt this style to the current content while maintaining your analytical accuracy.
      `;
        }
        // Combine all parts of the prompt
        const fullPrompt = `${basePrompt}
${formattingInstructions}
${styleInstructions}`;
        // Create streaming completion
        let fullResponse = '';
        const stream = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: fullPrompt }],
            stream: true,
            temperature: 0.5,
            max_tokens: length === 'brief' ? 500 : length === 'detailed' ? 1500 : 1000,
        });
        // Process the stream
        for await (const chunk of stream) {
            const content = ((_b = (_a = chunk.choices[0]) === null || _a === void 0 ? void 0 : _a.delta) === null || _b === void 0 ? void 0 : _b.content) || '';
            if (content) {
                fullResponse += content;
                onProgress(content);
            }
        }
        // Complete the process
        onComplete(fullResponse);
    }
    catch (error) {
        logger_1.logger.error(`Error generating streaming ${reportType} report:`, error);
        throw new Error(`Failed to generate ${reportType} report`);
    }
};
exports.generateStreamingReport = generateStreamingReport;
/**
 * Generate a custom report with a user-defined prompt
 * @param customPrompt User-defined prompt for the report
 * @param data Array of utilization data
 * @param options Additional options for the report
 * @param onProgress Callback function for streaming progress
 * @param onComplete Callback function for completion
 */
const generateCustomReport = async (customPrompt, data, options = {}, onProgress, onComplete) => {
    var _a, _b;
    try {
        const { styleContent = '', formatting = {} } = options;
        // Format data for the prompt
        const formattedData = JSON.stringify(data, null, 2);
        // Default formatting options
        const { tone = 'formal', length = 'standard' } = formatting;
        // Base prompt with user's custom instructions
        const basePrompt = `
    You are an expert housing analyst for a Housing Authority.
    ${customPrompt}

    Here is the Housing Choice Voucher (HCV) utilization data (JSON format):
    ${formattedData}
    `;
        // Add formatting instructions
        const formattingInstructions = `
    Please format your response with the following characteristics:
    - Tone: ${tone}
    - Length: ${length === 'brief' ? '200-300 words' : length === 'detailed' ? '500-800 words' : '300-500 words'}
    `;
        // Add style template if provided
        let styleInstructions = '';
        if (styleContent) {
            styleInstructions = `
      Please use the following style template as a guide for your writing style and structure:

      ${styleContent}

      Adapt this style to the current content while maintaining your analytical accuracy.
      `;
        }
        // Combine all parts of the prompt
        const fullPrompt = `${basePrompt}
${formattingInstructions}
${styleInstructions}`;
        // Create streaming completion
        let fullResponse = '';
        const stream = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: fullPrompt }],
            stream: true,
            temperature: 0.7, // Slightly more creative for custom prompts
            max_tokens: length === 'brief' ? 500 : length === 'detailed' ? 1500 : 1000,
        });
        // Process the stream
        for await (const chunk of stream) {
            const content = ((_b = (_a = chunk.choices[0]) === null || _a === void 0 ? void 0 : _a.delta) === null || _b === void 0 ? void 0 : _b.content) || '';
            if (content) {
                fullResponse += content;
                onProgress(content);
            }
        }
        // Complete the process
        onComplete(fullResponse);
    }
    catch (error) {
        logger_1.logger.error('Error generating custom report:', error);
        throw new Error('Failed to generate custom report');
    }
};
exports.generateCustomReport = generateCustomReport;
