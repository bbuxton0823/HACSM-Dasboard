import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Typography,
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import api, { uploadAPI } from '../../services/api';

// Define accepted file types and their MIME types
const ACCEPTED_FILE_TYPES = {
  CSV: ['text/csv', 'application/vnd.ms-excel'],
  EXCEL: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
  ],
  PDF: ['application/pdf'],
  WORD: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  TEXT: ['text/plain'],
};

// UploadType enum for the various upload purposes
enum UploadType {
  HCV_DATA = 'HCV Utilization Data',
  VOUCHER_DATA = 'Voucher Types Data',
  FINANCIAL_DATA = 'Financial Data',
  STYLE_TEMPLATE = 'Writing Style Template',
  EXECUTIVE_REPORT = 'Executive Report',
}

// Interface for the file item
interface FileItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  previewUrl?: string;
}

const DocumentUpload: React.FC = () => {
  // Interface for style template
  interface StyleTemplate {
    id: string;
    name: string;
    createdAt: string;
  }

  // State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploadType, setUploadType] = useState<UploadType>(UploadType.HCV_DATA);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [styleName, setStyleName] = useState<string>('');
  const [styleDialogOpen, setStyleDialogOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [styleTemplates, setStyleTemplates] = useState<StyleTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch style templates on component mount
  useEffect(() => {
    fetchStyleTemplates();
  }, []);
  
  // Fetch style templates
  const fetchStyleTemplates = async () => {
    if (uploadType !== UploadType.STYLE_TEMPLATE) return;
    
    setLoadingTemplates(true);
    try {
      const response = await uploadAPI.getStyleTemplates();
      if (response.data && response.data.data) {
        setStyleTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching style templates:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching style templates',
        severity: 'error',
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const newFiles: FileItem[] = Array.from(event.target.files).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}`,
      progress: 0,
      status: 'pending',
    }));

    // Check if any of the files are of the "Style Template" type
    if (uploadType === UploadType.STYLE_TEMPLATE && newFiles.length > 0) {
      setSelectedFile(newFiles[0]);
      setStyleDialogOpen(true);
    } else {
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle upload type change
  const handleUploadTypeChange = (event: SelectChangeEvent<UploadType>) => {
    setUploadType(event.target.value as UploadType);
  };

  // Handle file remove
  const handleRemoveFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  // Handle style dialog close
  const handleStyleDialogClose = () => {
    setStyleDialogOpen(false);
    setSelectedFile(null);
    setStyleName('');
  };

  // Handle style save
  const handleStyleSave = () => {
    if (selectedFile && styleName.trim()) {
      // Add the file with style name
      const fileWithStyle = {
        ...selectedFile,
        styleName,
      };
      
      setFiles((prevFiles) => [...prevFiles, fileWithStyle]);
      setStyleDialogOpen(false);
      setSelectedFile(null);
      setStyleName('');
    }
  };

  // Upload files
  const handleUpload = async () => {
    if (!files.length) {
      setSnackbar({
        open: true,
        message: 'Please select files to upload',
        severity: 'warning',
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Set all files to 'uploading' state
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({
          ...file,
          status: 'uploading',
        }))
      );

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file.file);
        formData.append('uploadType', uploadType);

        // Add style name if it's a style template
        if ('styleName' in file) {
          formData.append('styleName', (file as any).styleName);
        }

        try {
          // Use the uploadAPI method
          const response = await uploadAPI.uploadFile(formData);
          
          // If it's a style template, refresh the template list
          if (uploadType === UploadType.STYLE_TEMPLATE) {
            fetchStyleTemplates();
          }

          // Update file status to success
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === file.id
                ? { ...f, status: 'success', progress: 100 }
                : f
            )
          );
          
          // Update overall progress
          setUploadProgress(
            Math.round(((i * 100) + 100) / (files.length * 100) * 100)
          );
        } catch (error: any) {
          // Update file status to error
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === file.id
                ? {
                    ...f,
                    status: 'error',
                    errorMessage: error.response?.data?.message || 'Upload failed',
                  }
                : f
            )
          );
        }
      }

      // Show success message
      setSnackbar({
        open: true,
        message: 'Files uploaded successfully',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      
      // Show error message
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error uploading files',
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setUploadProgress(100);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (ACCEPTED_FILE_TYPES.CSV.includes(file.type) || extension === 'csv') {
      return <TableChartIcon fontSize="large" />;
    } else if (ACCEPTED_FILE_TYPES.EXCEL.includes(file.type) || ['xlsx', 'xls'].includes(extension || '')) {
      return <TableChartIcon fontSize="large" />;
    } else if (ACCEPTED_FILE_TYPES.PDF.includes(file.type) || extension === 'pdf') {
      return <PictureAsPdfIcon fontSize="large" />;
    } else if (ACCEPTED_FILE_TYPES.WORD.includes(file.type) || ['doc', 'docx'].includes(extension || '')) {
      return <DescriptionIcon fontSize="large" />;
    } else if (ACCEPTED_FILE_TYPES.TEXT.includes(file.type) || extension === 'txt') {
      return <ArticleIcon fontSize="large" />;
    }

    return <InsertDriveFileIcon fontSize="large" />;
  };

  // Get accepted file extensions for the current upload type
  const getAcceptedFileExtensions = () => {
    switch (uploadType) {
      case UploadType.HCV_DATA:
      case UploadType.VOUCHER_DATA:
      case UploadType.FINANCIAL_DATA:
        return '.csv,.xlsx,.xls';
      case UploadType.STYLE_TEMPLATE:
      case UploadType.EXECUTIVE_REPORT:
        return '.pdf,.doc,.docx,.txt';
      default:
        return '*';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Document Upload
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Upload documents to populate the dashboard with data or to provide style templates for AI-generated reports.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Settings
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Upload Type</InputLabel>
                <Select
                  value={uploadType}
                  label="Upload Type"
                  onChange={handleUploadTypeChange}
                  disabled={loading}
                >
                  {Object.values(UploadType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Accepted File Types:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {uploadType === UploadType.HCV_DATA ||
                  uploadType === UploadType.VOUCHER_DATA ||
                  uploadType === UploadType.FINANCIAL_DATA ? (
                    <>
                      <Chip label="CSV" size="small" />
                      <Chip label="Excel" size="small" />
                    </>
                  ) : (
                    <>
                      <Chip label="PDF" size="small" />
                      <Chip label="Word" size="small" />
                      <Chip label="Text" size="small" />
                    </>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Data Requirements:
                </Typography>
                <Typography variant="body2">
                  {uploadType === UploadType.HCV_DATA
                    ? 'File should contain columns for reporting date, voucher type, authorized vouchers, leased vouchers, and HAP expenses.'
                    : uploadType === UploadType.VOUCHER_DATA
                    ? 'File should contain information on different voucher types including HUD-VASH, Permanent Supportive Housing, Mainstream, and Emergency Housing vouchers.'
                    : uploadType === UploadType.FINANCIAL_DATA
                    ? 'File should contain budget and expense data related to housing voucher programs.'
                    : uploadType === UploadType.STYLE_TEMPLATE
                    ? 'Upload documents that demonstrate your preferred writing style for AI-generated reports.'
                    : 'Upload existing executive reports for reference and analysis.'}
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  How it Works:
                </Typography>
                <Typography variant="body2">
                  {uploadType === UploadType.STYLE_TEMPLATE
                    ? 'The system will analyze your uploaded document to capture the writing style, terminology, and formatting preferences. Future AI-generated reports will mimic this style.'
                    : 'Your data will be processed and integrated into the dashboard visualizations. You can then generate AI-powered reports based on this data.'}
                </Typography>
              </Box>
              
              {/* Display existing style templates if applicable */}
              {uploadType === UploadType.STYLE_TEMPLATE && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Existing Style Templates:
                  </Typography>
                  {loadingTemplates ? (
                    <CircularProgress size={24} />
                  ) : styleTemplates.length > 0 ? (
                    <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
                      {styleTemplates.map((template) => (
                        <Box 
                          key={template.id} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: 'action.hover'
                          }}
                        >
                          <Typography variant="body2">{template.name}</Typography>
                          <IconButton 
                            size="small" 
                            onClick={async () => {
                              try {
                                await uploadAPI.deleteStyleTemplate(template.id);
                                fetchStyleTemplates();
                                setSnackbar({
                                  open: true,
                                  message: 'Style template deleted successfully',
                                  severity: 'success',
                                });
                              } catch (error) {
                                setSnackbar({
                                  open: true,
                                  message: 'Error deleting style template',
                                  severity: 'error',
                                });
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No style templates found. Upload a document to create one.
                    </Typography>
                  )}
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  fullWidth
                >
                  Select Files
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  multiple
                  accept={getAcceptedFileExtensions()}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleUpload}
                  disabled={loading || files.length === 0}
                  fullWidth
                >
                  Upload All Files
                </Button>
              </Box>

              {loading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    {uploadProgress}% Complete
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Selected Files
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {files.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                }}
              >
                <InsertDriveFileIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  No files selected
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {files.map((file) => (
                  <Grid item xs={12} key={file.id}>
                    <Paper
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        bgcolor: file.status === 'error' ? 'error.light' : undefined,
                      }}
                    >
                      <Box
                        sx={{
                          mr: { xs: 0, sm: 2 },
                          mb: { xs: 2, sm: 0 },
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {getFileIcon(file.file)}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" noWrap>
                          {file.file.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {(file.file.size / 1024).toFixed(2)} KB • {file.file.type || 'Unknown type'}
                        </Typography>
                        {'styleName' in file && (
                          <Chip
                            label={`Style: ${(file as any).styleName}`}
                            size="small"
                            color="primary"
                            sx={{ mt: 1 }}
                          />
                        )}
                        {file.status === 'error' && (
                          <Typography variant="body2" color="error">
                            {file.errorMessage}
                          </Typography>
                        )}
                        {(file.status === 'uploading' || file.status === 'success') && (
                          <LinearProgress
                            variant="determinate"
                            value={file.progress}
                            sx={{ mt: 1, mb: 1 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 2, sm: 0 } }}>
                        {file.status === 'uploading' ? (
                          <CircularProgress size={24} />
                        ) : (
                          <IconButton
                            onClick={() => handleRemoveFile(file.id)}
                            disabled={loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Style Template Dialog */}
      <Dialog open={styleDialogOpen} onClose={handleStyleDialogClose}>
        <DialogTitle>Name Your Style Template</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a name for this style template. This name will be used to identify this
            style when generating AI reports.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Style Name"
            fullWidth
            variant="outlined"
            value={styleName}
            onChange={(e) => setStyleName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStyleDialogClose}>Cancel</Button>
          <Button onClick={handleStyleSave} disabled={!styleName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

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

export default DocumentUpload;
