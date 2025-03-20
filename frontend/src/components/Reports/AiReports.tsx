import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  SelectChangeEvent,
  Divider,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { VoucherType } from '../../types/hcvUtilization';
import api from '../../services/api';

const AiReports: React.FC = () => {
  // State for report selection
  const [reportType, setReportType] = useState<string>('executive-summary');
  const [voucherType, setVoucherType] = useState<string>('tenant_based');
  const [forecastMonths, setForecastMonths] = useState<number>(6);
  
  // State for date range
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setFullYear(new Date().getFullYear() - 1))
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  
  // State for report data
  const [reportData, setReportData] = useState<string>('');
  const [editableReportData, setEditableReportData] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string}>({open: false, message: ''});

  // Handle report type change
  const handleReportTypeChange = (event: SelectChangeEvent) => {
    setReportType(event.target.value);
    setReportData('');
    setError('');
  };

  // Handle voucher type change
  const handleVoucherTypeChange = (event: SelectChangeEvent) => {
    setVoucherType(event.target.value);
    setReportData('');
    setError('');
  };

  // Handle forecast months change
  const handleForecastMonthsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0 && value <= 24) {
      setForecastMonths(value);
      setReportData('');
      setError('');
    }
  };

  // Generate report based on selection
  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReportData('');

    try {
      let endpoint = '';
      let params = new URLSearchParams();

      // Add date range parameters
      if (startDate) {
        params.append('startDate', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }

      // Set endpoint based on report type
      switch (reportType) {
        case 'executive-summary':
          endpoint = '/reports/executive-summary';
          break;
        case 'voucher-type':
          endpoint = `/reports/voucher-type/${voucherType}`;
          break;
        case 'budget-forecast':
          endpoint = '/reports/budget-forecast';
          params.append('months', forecastMonths.toString());
          break;
        default:
          setError('Invalid report type selected');
          setLoading(false);
          return;
      }

      // Make API request
      const response = await api.get(`${endpoint}?${params.toString()}`);
      
      // Extract report data based on report type
      if (reportType === 'executive-summary') {
        setReportData(response.data.data.summary);
        setEditableReportData(response.data.data.summary);
      } else if (reportType === 'voucher-type') {
        setReportData(response.data.data.report);
        setEditableReportData(response.data.data.report);
      } else if (reportType === 'budget-forecast') {
        setReportData(response.data.data.forecast);
        setEditableReportData(response.data.data.forecast);
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      setError(
        error.response?.data?.message || 
        'Failed to generate report. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI-Powered Reports
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Generate AI-powered reports and insights based on HCV utilization data.
        These reports provide executive summaries, voucher-specific analysis, and budget forecasts.
      </Typography>

        <Grid container spacing={3}>
          {/* Report configuration card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Report Configuration
                </Typography>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    label="Report Type"
                    onChange={handleReportTypeChange}
                  >
                    <MenuItem value="executive-summary">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <InsightsIcon sx={{ mr: 1 }} />
                        Executive Summary
                      </Box>
                    </MenuItem>
                    <MenuItem value="voucher-type">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssessmentIcon sx={{ mr: 1 }} />
                        Voucher Type Analysis
                      </Box>
                    </MenuItem>
                    <MenuItem value="budget-forecast">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BarChartIcon sx={{ mr: 1 }} />
                        Budget Forecast
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {reportType === 'voucher-type' && (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Voucher Type</InputLabel>
                    <Select
                      value={voucherType}
                      label="Voucher Type"
                      onChange={handleVoucherTypeChange}
                    >
                      <MenuItem value={VoucherType.TENANT_BASED}>Tenant Based</MenuItem>
                      <MenuItem value={VoucherType.PROJECT_BASED}>Project Based</MenuItem>
                      <MenuItem value={VoucherType.HOMEOWNERSHIP}>Homeownership</MenuItem>
                      <MenuItem value={VoucherType.EMERGENCY_HOUSING}>Emergency Housing</MenuItem>
                      <MenuItem value={VoucherType.HUD_VASH}>HUD-VASH</MenuItem>
                      <MenuItem value={VoucherType.PERMANENT_SUPPORTIVE}>Permanent Supportive Housing</MenuItem>
                      <MenuItem value={VoucherType.MAINSTREAM}>Mainstream</MenuItem>
                      <MenuItem value={VoucherType.SPECIAL_PURPOSE}>Special Purpose</MenuItem>
                      <MenuItem value={VoucherType.MTW_FLEXIBLE}>MTW Flexible</MenuItem>
                      <MenuItem value={VoucherType.OTHER}>Other</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {reportType === 'budget-forecast' && (
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Forecast Months"
                    type="number"
                    value={forecastMonths}
                    onChange={handleForecastMonthsChange}
                    inputProps={{ min: 1, max: 24 }}
                    helperText="Number of months to forecast (1-24)"
                  />
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Date Range
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      margin="normal"
                      value={startDate ? startDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setStartDate(new Date(e.target.value))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="End Date"
                      type="date"
                      fullWidth
                      margin="normal"
                      value={endDate ? endDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEndDate(new Date(e.target.value))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={generateReport}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Report display card */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                minHeight: '600px', 
                display: 'flex', 
                flexDirection: 'column' 
              }}
            >
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flex: 1
                  }}
                >
                  <CircularProgress />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Generating your report... This may take a moment.
                  </Typography>
                </Box>
              ) : reportData ? (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {reportType === 'executive-summary' && 'Executive Summary'}
                    {reportType === 'voucher-type' && `${voucherType.replace('_', ' ').toUpperCase()} Voucher Analysis`}
                    {reportType === 'budget-forecast' && `${forecastMonths}-Month Budget Forecast`}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ position: 'relative' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                      <Tooltip title={isEditing ? 'Save' : 'Edit'}>
                        <IconButton 
                          onClick={() => {
                            if (isEditing) {
                              setReportData(editableReportData);
                              setSnackbar({open: true, message: 'Changes saved successfully'});
                            }
                            setIsEditing(!isEditing);
                          }}
                          color={isEditing ? 'primary' : 'default'}
                        >
                          {isEditing ? <SaveIcon /> : <EditIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy to clipboard">
                        <IconButton
                          onClick={() => {
                            navigator.clipboard.writeText(isEditing ? editableReportData : reportData);
                            setSnackbar({open: true, message: 'Content copied to clipboard'});
                          }}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    {isEditing ? (
                      <TextField
                        multiline
                        fullWidth
                        minRows={10}
                        value={editableReportData}
                        onChange={(e) => setEditableReportData(e.target.value)}
                        sx={{ 
                          fontFamily: 'inherit',
                          '& .MuiInputBase-root': {
                            fontFamily: 'inherit',
                            fontSize: 'inherit'
                          }
                        }}
                      />
                    ) : (
                      <Typography 
                        variant="body1" 
                        component="div"
                        sx={{ 
                          whiteSpace: 'pre-line',
                          '& p': { mb: 1.5 }
                        }}
                      >
                        {reportData.split('\n').map((paragraph, index) => (
                          <Typography key={index} paragraph>
                            {paragraph}
                          </Typography>
                        ))}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flex: 1,
                    color: 'text.secondary'
                  }}
                >
                  <InsightsIcon sx={{ fontSize: 80, opacity: 0.3 }} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Configure and generate a report to see insights here
                  </Typography>
                  <Typography variant="body2" align="center" sx={{ mt: 1, maxWidth: '80%' }}>
                    Select your report type, date range, and other parameters, then click 'Generate Report'
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          message={snackbar.message}
          onClose={() => setSnackbar({...snackbar, open: false})}
        />
      </Box>
  );
};

export default AiReports;
