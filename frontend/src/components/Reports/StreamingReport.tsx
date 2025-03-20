import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  IconButton,
} from '@mui/material';
// DatePicker imports removed to fix TypeScript errors
import { VoucherType } from '../../types/hcvUtilization';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '../../services/api';
import { format } from 'date-fns';

// Enum for report types
enum ReportType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  VOUCHER_ANALYSIS = 'voucher_analysis',
  BUDGET_FORECAST = 'budget_forecast',
  CUSTOM_REPORT = 'custom_report',
}

// Interface for style template
interface StyleTemplate {
  id: string;
  name: string;
  createdAt: string;
}

// Interface for formatting options
interface FormattingOptions {
  includeTables: boolean;
  includeVisualizations: boolean;
  includeRecommendations: boolean;
  bulletPoints: boolean;
}

// Interface for report options
interface ReportOptions {
  reportType: ReportType;
  startDate: Date | null;
  endDate: Date | null;
  voucherType?: VoucherType;
  forecastMonths?: number;
  styleTemplate?: string;
  customPrompt?: string;
  formatting?: FormattingOptions;
}

// Interface for Stream response
interface StreamResponse {
  content: string;
  done: boolean;
}

const StreamingReport: React.FC = () => {
  // State for report options
  const [options, setOptions] = useState<ReportOptions>({
    reportType: ReportType.EXECUTIVE_SUMMARY,
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    endDate: new Date(),
    forecastMonths: 6,
    formatting: {
      includeTables: true,
      includeVisualizations: true,
      includeRecommendations: true,
      bulletPoints: false,
    },
  });

  // State for report generation
  const [generating, setGenerating] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [streamingComplete, setStreamingComplete] = useState<boolean>(false);
  const [styleTemplates, setStyleTemplates] = useState<StyleTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Reference to report container for auto-scrolling
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Fetch style templates on component mount
  useEffect(() => {
    fetchStyleTemplates();
  }, []);

  // Auto-scroll as report streams in
  useEffect(() => {
    if (reportContainerRef.current) {
      reportContainerRef.current.scrollTop = reportContainerRef.current.scrollHeight;
    }
  }, [reportContent]);

  // Fetch available style templates
  const fetchStyleTemplates = async () => {
    try {
      const response = await api.get('/reports/style-templates');
      if (response.data && response.data.data) {
        setStyleTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching style templates:', error);
    }
  };

  // Handle report type change
  const handleReportTypeChange = (event: SelectChangeEvent<ReportType>) => {
    setOptions({
      ...options,
      reportType: event.target.value as ReportType,
    });
  };

  // Handle voucher type change
  const handleVoucherTypeChange = (event: SelectChangeEvent<VoucherType>) => {
    setOptions({
      ...options,
      voucherType: event.target.value as VoucherType,
    });
  };

  // Handle style template change
  const handleStyleTemplateChange = (event: SelectChangeEvent<string>) => {
    setOptions({
      ...options,
      styleTemplate: event.target.value,
    });
  };

  // Handle formatting option change
  const handleFormattingChange = (
    option: keyof FormattingOptions
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      formatting: {
        ...options.formatting!,
        [option]: event.target.checked,
      },
    });
  };

  // Handle forecast months change
  const handleForecastMonthsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setOptions({
        ...options,
        forecastMonths: value,
      });
    }
  };

  // Generate the report with streaming response
  const generateReport = async () => {
    if (!options.startDate || !options.endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (
      options.reportType === ReportType.VOUCHER_ANALYSIS &&
      !options.voucherType
    ) {
      setError('Please select a voucher type for analysis.');
      return;
    }

    setError(null);
    setGenerating(true);
    setConnecting(true);
    setReportContent('');
    setStreamingComplete(false);

    try {
      // Prepare request body
      const requestBody = {
        reportType: options.reportType,
        timeframe: {
          startDate: format(options.startDate, 'yyyy-MM-dd'),
          endDate: format(options.endDate, 'yyyy-MM-dd'),
        },
        voucherType: options.voucherType,
        forecastMonths: options.forecastMonths,
        styleTemplate: options.styleTemplate,
        customPrompt: options.customPrompt,
        formatting: options.formatting,
      };

      // Initialize stream with EventSource
      // For SSE connections, we need to use the full URL and ensure CORS is properly handled
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const reportEndpoint = `${baseUrl}/reports/stream?${new URLSearchParams({
        requestBody: JSON.stringify(requestBody),
      }).toString()}`;

      console.log('Connecting to EventSource at:', reportEndpoint);
      
      // Create EventSource with withCredentials option to send cookies
      const eventSource = new EventSource(reportEndpoint, { withCredentials: true });

      // Handle incoming stream events
      eventSource.onmessage = (event) => {
        try {
          const data: StreamResponse = JSON.parse(event.data);
          
          // Only append content if it exists
          if (data.content) {
            setReportContent((prev) => prev + data.content);
          }
          
          // Check if the streaming is complete
          if (data.done) {
            eventSource.close();
            setStreamingComplete(true);
            setGenerating(false);
            setConnecting(false);
          } else {
            setConnecting(false);
          }
        } catch (error) {
          console.error('Error parsing stream data:', error);
        }
      };

      // Handle stream errors
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        setError('Error generating report. Please try again.');
        setGenerating(false);
        setConnecting(false);
      };

      // Clean up the event source when component unmounts
      return () => {
        eventSource.close();
      };
    } catch (error: any) {
      console.error('Error setting up report stream:', error);
      setError(
        error.response?.data?.message || 'Error generating report. Please try again.'
      );
      setGenerating(false);
      setConnecting(false);
    }
  };

  // Save report as PDF
  const saveAsPdf = async () => {
    try {
      const response = await api.post('/reports/export-pdf', {
        content: reportContent,
        title: `${
          options.reportType === ReportType.EXECUTIVE_SUMMARY
            ? 'Executive Summary'
            : options.reportType === ReportType.VOUCHER_ANALYSIS
            ? `${options.voucherType} Analysis`
            : options.reportType === ReportType.BUDGET_FORECAST
            ? 'Budget Forecast'
            : 'Custom Report'
        } - ${format(new Date(), 'yyyy-MM-dd')}`,
      }, { responseType: 'blob' });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `report-${options.reportType}-${format(new Date(), 'yyyyMMdd')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      setSnackbar({
        open: true,
        message: 'Report saved as PDF successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving report as PDF:', error);
      setSnackbar({
        open: true,
        message: 'Error saving report as PDF',
        severity: 'error',
      });
    }
  };

  // Copy report to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(reportContent);
    setSnackbar({
      open: true,
      message: 'Report copied to clipboard',
      severity: 'success',
    });
  };

  // Print report
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>AI Generated Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 20px;
              }
              h1, h2, h3 {
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .footer {
                text-align: center;
                margin-top: 50px;
                font-size: 0.8em;
                color: #666;
              }
              .content {
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${
                options.reportType === ReportType.EXECUTIVE_SUMMARY
                  ? 'Executive Summary'
                  : options.reportType === ReportType.VOUCHER_ANALYSIS
                  ? `${options.voucherType} Analysis`
                  : options.reportType === ReportType.BUDGET_FORECAST
                  ? 'Budget Forecast'
                  : 'Custom Report'
              }</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">${reportContent}</div>
            <div class="footer">
              <p>AI Generated Report - Housing Authority Dashboard</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Format report type for display
  const formatReportType = (type: ReportType) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format voucher type for display
  const formatVoucherType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Report Generator
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Generate AI-powered reports with real-time streaming output based on your housing voucher data.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Report Options
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={options.reportType}
                  label="Report Type"
                  onChange={handleReportTypeChange}
                  disabled={generating}
                >
                  {Object.values(ReportType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {formatReportType(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <TextField
                  label="Start Date"
                  type="date"
                  value={options.startDate ? options.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setOptions({ ...options, startDate: date });
                  }}
                  disabled={generating}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </FormControl>

              <FormControl fullWidth margin="normal">
                <TextField
                  label="End Date"
                  type="date"
                  value={options.endDate ? options.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setOptions({ ...options, endDate: date });
                  }}
                  disabled={generating}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </FormControl>

              {options.reportType === ReportType.VOUCHER_ANALYSIS && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Voucher Type</InputLabel>
                  <Select
                    value={options.voucherType || ''}
                    label="Voucher Type"
                    onChange={handleVoucherTypeChange}
                    disabled={generating}
                  >
                    {Object.values(VoucherType).map((type) => (
                      <MenuItem key={type} value={type}>
                        {formatVoucherType(type)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {options.reportType === ReportType.BUDGET_FORECAST && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Forecast Months"
                  type="number"
                  value={options.forecastMonths || ''}
                  onChange={handleForecastMonthsChange}
                  inputProps={{ min: 1, max: 24 }}
                  disabled={generating}
                />
              )}

              <FormControl fullWidth margin="normal">
                <InputLabel>Writing Style Template</InputLabel>
                <Select
                  value={options.styleTemplate || ''}
                  label="Writing Style Template"
                  onChange={handleStyleTemplateChange}
                  disabled={generating || styleTemplates.length === 0}
                >
                  <MenuItem value="">Default Style</MenuItem>
                  {styleTemplates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {options.reportType === ReportType.CUSTOM_REPORT && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Custom Prompt"
                  multiline
                  rows={4}
                  value={options.customPrompt || ''}
                  onChange={(e) =>
                    setOptions({ ...options, customPrompt: e.target.value })
                  }
                  disabled={generating}
                  placeholder="Describe what analysis or information you'd like in this report..."
                />
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Formatting Options:
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.formatting?.includeTables}
                      onChange={handleFormattingChange('includeTables')}
                      disabled={generating}
                    />
                  }
                  label="Include Tables"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.formatting?.includeVisualizations}
                      onChange={handleFormattingChange('includeVisualizations')}
                      disabled={generating}
                    />
                  }
                  label="Include Visualizations"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.formatting?.includeRecommendations}
                      onChange={handleFormattingChange('includeRecommendations')}
                      disabled={generating}
                    />
                  }
                  label="Include Recommendations"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.formatting?.bulletPoints}
                      onChange={handleFormattingChange('bulletPoints')}
                      disabled={generating}
                    />
                  }
                  label="Use Bullet Points"
                />
              </Box>

              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 3 }}
                onClick={generateReport}
                disabled={generating}
                startIcon={
                  generating ? <CircularProgress size={20} /> : <DescriptionIcon />
                }
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Report Output
              </Typography>
              
              {streamingComplete && reportContent && (
                <Box>
                  <IconButton
                    onClick={saveAsPdf}
                    title="Save as PDF"
                  >
                    <SaveIcon />
                  </IconButton>
                  <IconButton
                    onClick={copyToClipboard}
                    title="Copy to Clipboard"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                  <IconButton
                    onClick={printReport}
                    title="Print Report"
                  >
                    <PrintIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />

            {generating && !reportContent && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 10,
                }}
              >
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>
                  {connecting ? 'Connecting...' : 'Generating your report...'}
                </Typography>
              </Box>
            )}

            <Box
              ref={reportContainerRef}
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                position: 'relative',
                minHeight: '500px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {reportContent ? (
                <>
                  {reportContent}
                  {generating && (
                    <Box
                      sx={{
                        display: 'inline-block',
                        width: '0.5em',
                        height: '1.2em',
                        backgroundColor: 'primary.main',
                        animation: 'blink 1s steps(1) infinite',
                        '@keyframes blink': {
                          '0%, 100%': {
                            visibility: 'hidden',
                          },
                          '50%': {
                            visibility: 'visible',
                          },
                        },
                        verticalAlign: 'text-bottom',
                        ml: 0.5,
                      }}
                    />
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ pt: 10 }}>
                  {connecting
                    ? 'Connecting to report stream...'
                    : generating
                    ? 'Your report will appear here...'
                    : 'Configure your report options and click "Generate Report" to create an AI-powered analysis.'}
                </Typography>
              )}
            </Box>

            {generating && reportContent && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Chip
                  label="AI is writing..."
                  color="primary"
                  icon={<CircularProgress size={16} />}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StreamingReport;
