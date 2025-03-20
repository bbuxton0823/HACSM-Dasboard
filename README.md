# MTW Housing Authority Dashboard

A comprehensive dashboard application for Housing Authorities to visualize and analyze Moving to Work (MTW) and Housing Choice Voucher (HCV) utilization data, generate reports, and manage housing voucher programs.

## Features

- **Voucher Types Dashboard**: Visualize and analyze utilization metrics across different voucher types including MTW, HCV, HUD-VASH, Permanent Supportive Housing, Mainstream, and Emergency Housing vouchers.
- **AI-Powered Reports**: Generate AI-powered reports with real-time streaming output based on your housing voucher data.
- **Document Upload**: Upload and process various document types (PDF, Word, Excel) for data extraction.
- **Budget Management**: Track budget authority, HAP expenditures, and MTW reserves.
- **Secure Authentication**: Role-based access control with JWT authentication.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or later)
- npm (v7 or later)
- PostgreSQL (v12 or later)
- Git

## Installation

### Clone the Repository

```bash
git clone https://github.com/bbuxton0823/HACSM-Dasboard.git
cd HACSM-Dasboard
```

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the provided `.env.example`:

```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials and other configuration options.

5. Build the TypeScript code:

```bash
npm run build
```

6. Set up the database:

```bash
# First, create the database in PostgreSQL
# Then run the import script to load mock data (optional)
node scripts/import-mock-data.js
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file for the frontend:

```bash
# Create .env file with the API URL
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

## Configuration

### Backend Configuration

Edit the `.env` file in the backend directory with your specific settings:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=mtw_hcv_dashboard

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

# Logging
LOG_LEVEL=info
```

### Frontend Configuration

Edit the `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev  # For development with hot-reloading
# OR
npm start    # For production
```

The backend server will start on http://localhost:5000 (or the port specified in your .env file).

### Start the Frontend Development Server

```bash
cd frontend
npm start
```

The frontend development server will start on http://localhost:3000 and will automatically open in your default browser.

## Usage Guide

### Dashboard Navigation

The dashboard provides several key sections:

1. **MTW/HCV Voucher Types Dashboard**: 
   - View utilization metrics across different voucher types
   - Filter data by date range
   - Visualize trends with interactive charts

2. **AI Report Generator**:
   - Select report type (Executive Summary, Voucher Analysis, Budget Forecast, or Custom Report)
   - Configure date range and formatting options
   - Generate reports with real-time streaming output
   - Save, print, or copy reports

3. **Document Upload**:
   - Upload PDF, Word, or Excel documents
   - Extract data for analysis
   - Process and integrate data with the dashboard

### Authentication

1. **Login**: Access the system using your credentials
2. **User Management**: Administrators can manage user accounts and roles
3. **Security**: All API requests require authentication tokens

## API Documentation

The backend provides the following API endpoints:

### Authentication

- `POST /api/auth/login`: Authenticate user and get JWT token
- `POST /api/auth/register`: Register a new user (admin only)

### HCV Utilization

- `GET /api/hcv-utilization/date-range`: Get utilization data by date range
- `GET /api/hcv-utilization/types`: Get utilization data by voucher type
- `POST /api/hcv-utilization`: Create new utilization record
- `PUT /api/hcv-utilization/:id`: Update utilization record
- `DELETE /api/hcv-utilization/:id`: Delete utilization record

### Reports

- `GET /api/reports/stream`: Stream report generation (SSE)
- `GET /api/reports/style-templates`: Get available report style templates
- `POST /api/reports/export`: Export report to PDF

### Document Upload

- `POST /api/upload`: Upload documents
- `POST /api/import`: Import data from uploaded documents

## Troubleshooting

### Common Issues

1. **Blank Dashboard**: 
   - Ensure the backend server is running
   - Check that the frontend is configured with the correct API URL
   - Verify that CORS is properly configured in the backend

2. **Streaming Reports Not Working**:
   - Ensure your browser supports Server-Sent Events (SSE)
   - Check that the backend is properly configured to handle SSE connections
   - Verify that the frontend is using the correct API endpoint with credentials

3. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check database credentials in the .env file
   - Ensure the database schema is properly set up

### Logs

- Backend logs are available in the console and log files
- Frontend console logs can be viewed in the browser developer tools

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
