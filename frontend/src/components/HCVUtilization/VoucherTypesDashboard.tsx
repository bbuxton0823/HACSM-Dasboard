import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Tabs,
  Tab,
  Divider,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { VoucherType } from '../../types/hcvUtilization';
import api from '../../services/api';

// Interface for the voucher data
interface VoucherData {
  id: string;
  reportingDate: string;
  voucherType: VoucherType;
  authorizedVouchers: number;
  leasedVouchers: number;
  utilizationRate: number;
  hapExpenses: number;
  averageHapPerUnit: number;
  budgetUtilization: number;
  notes?: string;
}

// Interface for the aggregated data
interface AggregatedData {
  voucherType: string;
  authorizedVouchers: number;
  leasedVouchers: number;
  utilizationRate: number;
  hapExpenses: number;
  averageHapPerUnit: number;
}

// Interface for the tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`voucher-tabpanel-${index}`}
      aria-labelledby={`voucher-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const VoucherTypesDashboard: React.FC = () => {
  const theme = useTheme();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [voucherData, setVoucherData] = useState<VoucherData[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([]);
  const [timeframeFilter, setTimeframeFilter] = useState<string>('6months');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState<number>(0);
  const [error, setError] = useState<string>('');
  
  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#8dd1e1',
  ];

  // Fetch voucher data
  useEffect(() => {
    fetchVoucherData();
    
    // Set default selected month to current month
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, []);

  // Mock data for when API call fails
  const generateMockData = () => {
    // Ensure we don't have duplicate voucher types
    const voucherTypes = Object.values(VoucherType);
    const months = ['2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03'];
    const mockData: VoucherData[] = [];
    
    let id = 1;
    months.forEach(month => {
      voucherTypes.forEach(type => {
        const authorizedVouchers = Math.floor(Math.random() * 1000) + 500;
        const leasedVouchers = Math.floor(Math.random() * authorizedVouchers);
        const utilizationRate = (leasedVouchers / authorizedVouchers) * 100;
        const hapExpenses = leasedVouchers * (Math.floor(Math.random() * 500) + 800);
        const averageHapPerUnit = hapExpenses / leasedVouchers;
        
        mockData.push({
          id: id.toString(),
          reportingDate: `${month}-01`,
          voucherType: type as VoucherType,
          authorizedVouchers,
          leasedVouchers,
          utilizationRate,
          hapExpenses,
          averageHapPerUnit,
          budgetUtilization: (hapExpenses / (authorizedVouchers * averageHapPerUnit)) * 100,
          notes: type === VoucherType.MTW_FLEXIBLE ? 'Priority program' : undefined
        });
        id++;
      });
    });
    
    return mockData;
  };

  // Fetch voucher data from API
  const fetchVoucherData = useCallback(async () => {
    setLoading(true);
    try {
      // Calculate date range based on timeframe filter
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeframeFilter === '1month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (timeframeFilter === '3months') {
        startDate.setMonth(endDate.getMonth() - 3);
      } else if (timeframeFilter === '6months') {
        startDate.setMonth(endDate.getMonth() - 6);
      } else if (timeframeFilter === '1year') {
        startDate.setFullYear(endDate.getFullYear() - 1);
      } else if (timeframeFilter === 'all') {
        startDate = new Date(0); // Beginning of time
      }
      
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      try {
        // Make API request to the date-range endpoint
        const response = await api.get(`/hcv-utilization/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
        
        console.log('API response:', response.data);
        
        if (response.data && response.data.data) {
          const data = response.data.data;
          setVoucherData(data);
          
          // Get unique months for filter
          const monthSet = new Set<string>();
          data.forEach((item: VoucherData) => {
            const date = new Date(item.reportingDate);
            monthSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
          });
          
          const sortedMonths = Array.from(monthSet).sort();
          setAvailableMonths(sortedMonths);
          
          if (sortedMonths.length > 0) {
            setSelectedMonth(sortedMonths[sortedMonths.length - 1]);
          }
        }
      } catch (error) {
        console.log('API call failed, using mock data', error);
        
        // Show a more user-friendly message
        setError('Unable to fetch data from the server. Using mock data for demonstration.');
        
        // Use mock data if API call fails
        const mockData = generateMockData();
        setVoucherData(mockData);
        
        // Get unique months for filter
        const monthSet = new Set<string>();
        mockData.forEach((item: VoucherData) => {
          const date = new Date(item.reportingDate);
          monthSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        });
        const months = Array.from(monthSet).sort();
        
        // Set selected month to most recent if not already set
        if (!selectedMonth && months.length > 0) {
          setSelectedMonth(months[months.length - 1]);
        }
        
        // Aggregate data by voucher type for the most recent month
        aggregateData(mockData, selectedMonth || months[months.length - 1]);
        
        // Auto-dismiss error after 5 seconds
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error fetching voucher data:', error);
      setError('Failed to fetch voucher data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [timeframeFilter, selectedMonth, generateMockData]);

  // Aggregate data by voucher type for a specific month
  const aggregateData = (data: VoucherData[], monthFilter: string) => {
    // Filter data for the selected month
    const filteredData = data.filter((item: VoucherData) => {
      const date = new Date(item.reportingDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return month === monthFilter;
    });
    
    // Group by voucher type
    const groupedData: { [key: string]: AggregatedData } = {};
    
    // Initialize with all voucher types to ensure we have all categories
    Object.values(VoucherType).forEach(type => {
      groupedData[type] = {
        voucherType: type,
        authorizedVouchers: 0,
        leasedVouchers: 0,
        utilizationRate: 0,
        hapExpenses: 0,
        averageHapPerUnit: 0,
      };
    });
    
    // Aggregate data by voucher type
    filteredData.forEach((item: VoucherData) => {
      groupedData[item.voucherType] = {
        voucherType: item.voucherType,
        authorizedVouchers: item.authorizedVouchers,
        leasedVouchers: item.leasedVouchers,
        utilizationRate: item.utilizationRate,
        hapExpenses: item.hapExpenses,
        averageHapPerUnit: item.averageHapPerUnit,
      };
    });
    
    // Convert to array and sort by voucher type
    const result = Object.values(groupedData).sort((a, b) => 
      a.voucherType.localeCompare(b.voucherType)
    );
    
    setAggregatedData(result);
  };

  // Handle timeframe filter change
  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframeFilter(event.target.value);
  };

  // Handle month filter change
  const handleMonthChange = (event: SelectChangeEvent) => {
    const month = event.target.value;
    setSelectedMonth(month);
    
    // If we have data for this month, use it
    if (voucherData.length > 0) {
      aggregateData(voucherData, month);
    } else {
      // Otherwise generate mock data for this month
      const mockData = generateMockData();
      aggregateData(mockData, month);
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format voucher type for display
  const formatVoucherType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get available months for filter
  const getAvailableMonths = () => {
    // Return the state variable directly
    return availableMonths;
  };

  // Prepare data for trend charts
  const prepareTrendData = () => {
    // Check if we have data in voucherData state
    if (voucherData.length === 0) {
      // Generate sample trend data when real data isn't available
      return generateSampleTrendData();
    }
    
    // Group data by month
    const monthlyData: { [key: string]: { [key: string]: number | string } } = {};
    
    voucherData.forEach((item: VoucherData) => {
      const date = new Date(item.reportingDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[month]) {
        monthlyData[month] = { month };
      }
      
      monthlyData[month][item.voucherType] = item.utilizationRate;
    });
    
    // Convert to array and sort by month
    return Object.values(monthlyData).sort((a, b) => 
      String(a.month).localeCompare(String(b.month))
    );
  };
  
  // Generate sample trend data when real data isn't available
  const generateSampleTrendData = () => {
    const months = ['2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01'];
    const sampleData = [];
    
    // Create trend data points for each month
    for (let i = 0; i < months.length; i++) {
      const dataPoint: { [key: string]: any } = {
        month: months[i]
      };
      
      // Add utilization rates for each voucher type
      Object.values(VoucherType).forEach(type => {
        // Base value that increases over time (to show a trend)
        const baseValue = 50 + (i * 3);
        // Add some randomness for each type
        const randomOffset = Math.floor(Math.random() * 30) - 15;
        dataPoint[type] = Math.min(98, Math.max(20, baseValue + randomOffset));
      });
      
      sampleData.push(dataPoint);
    }
    
    return sampleData;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        MTW/HCV Voucher Types Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Visualize and analyze utilization metrics across different voucher types including MTW, HCV, HUD-VASH, 
        Permanent Supportive Housing, Mainstream, and Emergency Housing vouchers.
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframeFilter}
              label="Timeframe"
              onChange={handleTimeframeChange}
            >
              <MenuItem value="1month">Last Month</MenuItem>
              <MenuItem value="3months">Last 3 Months</MenuItem>
              <MenuItem value="6months">Last 6 Months</MenuItem>
              <MenuItem value="1year">Last Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Reporting Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Reporting Month"
              onChange={handleMonthChange}
              disabled={loading}
            >
              <MenuItem value="2025-01">January 2025</MenuItem>
              <MenuItem value="2025-02">February 2025</MenuItem>
              <MenuItem value="2025-03">March 2025</MenuItem>
              <MenuItem value="2025-04">April 2025</MenuItem>
              <MenuItem value="2025-05">May 2025</MenuItem>
              <MenuItem value="2025-06">June 2025</MenuItem>
              <MenuItem value="2025-07">July 2025</MenuItem>
              <MenuItem value="2025-08">August 2025</MenuItem>
              <MenuItem value="2025-09">September 2025</MenuItem>
              <MenuItem value="2025-10">October 2025</MenuItem>
              <MenuItem value="2025-11">November 2025</MenuItem>
              <MenuItem value="2025-12">December 2025</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h6">{error}</Typography>
        </Paper>
      ) : (
        <>
          {/* Quick stats cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Authorized Vouchers
                  </Typography>
                  <Typography variant="h4">
                    {aggregatedData.reduce((sum, item) => sum + item.authorizedVouchers, 0).toLocaleString()}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Across all voucher types
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Leased Vouchers
                  </Typography>
                  <Typography variant="h4">
                    {aggregatedData.reduce((sum, item) => sum + item.leasedVouchers, 0).toLocaleString()}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Currently in use
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Average Utilization
                  </Typography>
                  <Typography variant="h4">
                    {(aggregatedData.reduce((sum, item) => sum + item.utilizationRate, 0) / 
                      (aggregatedData.length || 1)).toFixed(2)}%
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Across all voucher types
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total HAP Expenses
                  </Typography>
                  <Typography variant="h4">
                    ${aggregatedData.reduce((sum, item) => sum + item.hapExpenses, 0).toLocaleString()}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Housing Assistance Payments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Visualization tabs */}
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Voucher Distribution" />
                <Tab label="Utilization Rates" />
                <Tab label="HAP Expenses" />
                <Tab label="Trends Over Time" />
              </Tabs>
            </Box>
            
            {/* Voucher Distribution Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Authorized vs. Leased Vouchers by Type
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={aggregatedData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="voucherType" 
                        tickFormatter={formatVoucherType} 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                      />
                      <Tooltip 
                        formatter={(value) => [value, 'Vouchers']}
                        labelFormatter={formatVoucherType}
                      />
                      <Legend />
                      <Bar 
                        name="Authorized Vouchers" 
                        dataKey="authorizedVouchers" 
                        fill={theme.palette.primary.main} 
                      />
                      <Bar 
                        name="Leased Vouchers" 
                        dataKey="leasedVouchers" 
                        fill={theme.palette.secondary.main} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Voucher Type Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={aggregatedData}
                        dataKey="authorizedVouchers"
                        nameKey="voucherType"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        labelLine={false}
                        label={(entry: any) => {
                          // Only show label for larger segments (over 5%)
                          if (entry.percent > 0.05) {
                            return formatVoucherType(entry.name);
                          }
                          return '';
                        }}
                      >
                        {aggregatedData.map((entry: AggregatedData, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} vouchers`, 'Authorized']}
                        labelFormatter={formatVoucherType}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        formatter={formatVoucherType}
                        iconSize={10}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* Utilization Rates Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Utilization Rates by Voucher Type
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={aggregatedData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="voucherType" 
                        tickFormatter={formatVoucherType} 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                        interval={0}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        unit="%" 
                        tick={{ fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Utilization Rate']}
                        labelFormatter={formatVoucherType}
                      />
                      <Legend />
                      <Bar 
                        name="Utilization Rate" 
                        dataKey="utilizationRate" 
                        fill={theme.palette.success.main}
                        isAnimationActive={false}
                      >
                        {
                          aggregatedData.map((entry, index) => {
                            let color = theme.palette.success.main;
                            if (entry.utilizationRate < 85) {
                              color = theme.palette.warning.main;
                            }
                            if (entry.utilizationRate < 70) {
                              color = theme.palette.error.main;
                            }
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Voucher Types by Utilization Category
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ mr: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          High Utilization (≥90%)
                        </Typography>
                        {aggregatedData
                          .filter(item => item.utilizationRate >= 90)
                          .map(item => (
                            <Chip 
                              key={item.voucherType}
                              label={formatVoucherType(item.voucherType)}
                              color="success"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        {aggregatedData.filter(item => item.utilizationRate >= 90).length === 0 && (
                          <Typography variant="body2" color="text.secondary">None</Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ mr: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Medium Utilization (85-90%)
                        </Typography>
                        {aggregatedData
                          .filter(item => item.utilizationRate >= 85 && item.utilizationRate < 90)
                          .map(item => (
                            <Chip 
                              key={item.voucherType}
                              label={formatVoucherType(item.voucherType)}
                              color="primary"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        {aggregatedData.filter(item => item.utilizationRate >= 85 && item.utilizationRate < 90).length === 0 && (
                          <Typography variant="body2" color="text.secondary">None</Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ mr: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Low Utilization (70-85%)
                        </Typography>
                        {aggregatedData
                          .filter(item => item.utilizationRate >= 70 && item.utilizationRate < 85)
                          .map(item => (
                            <Chip 
                              key={item.voucherType}
                              label={formatVoucherType(item.voucherType)}
                              color="warning"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        {aggregatedData.filter(item => item.utilizationRate >= 70 && item.utilizationRate < 85).length === 0 && (
                          <Typography variant="body2" color="text.secondary">None</Typography>
                        )}
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Critical Utilization (&lt;70%)
                        </Typography>
                        {aggregatedData
                          .filter(item => item.utilizationRate < 70)
                          .map(item => (
                            <Chip 
                              key={item.voucherType}
                              label={formatVoucherType(item.voucherType)}
                              color="error"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        {aggregatedData.filter(item => item.utilizationRate < 70).length === 0 && (
                          <Typography variant="body2" color="text.secondary">None</Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* HAP Expenses Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    HAP Expenses by Voucher Type
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={aggregatedData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="voucherType" 
                        tickFormatter={formatVoucherType} 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, 'HAP Expenses']}
                        labelFormatter={formatVoucherType}
                      />
                      <Legend />
                      <Bar 
                        name="HAP Expenses" 
                        dataKey="hapExpenses" 
                        fill={theme.palette.primary.main} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Average HAP Per Unit
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={aggregatedData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="voucherType" 
                        tickFormatter={formatVoucherType} 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Avg HAP Per Unit']}
                        labelFormatter={formatVoucherType}
                      />
                      <Legend />
                      <Bar 
                        name="Average HAP Per Unit" 
                        dataKey="averageHapPerUnit" 
                        fill={theme.palette.secondary.main} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* Trends Tab */}
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Utilization Rate Trends Over Time
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Monthly utilization rates shown over time for each voucher type
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={500}>
                    <LineChart
                      data={prepareTrendData()}
                      margin={{ top: 20, right: 90, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(month) => {
                          const date = new Date(`${month}-01`);
                          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                        }}
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        unit="%" 
                        tick={{ fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Utilization Rate']}
                        labelFormatter={(month) => {
                          const date = new Date(`${month}-01`);
                          return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        }}
                      />
                      <Legend 
                        formatter={formatVoucherType} 
                        iconSize={10}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px' }}
                        layout="horizontal"
                        align="center"
                      />
                      
                      {Object.values(VoucherType).map((type, index) => (
                        <Line
                          key={type}
                          type="monotone"
                          dataKey={type}
                          name={formatVoucherType(type)}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 1 }}
                          activeDot={{ r: 6, strokeWidth: 1 }}
                          connectNulls
                          isAnimationActive={true}
                          animationDuration={1000}
                          animationEasing="ease-in-out"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default VoucherTypesDashboard;
