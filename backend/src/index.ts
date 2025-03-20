import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import budgetRoutes from './routes/budget.routes';
import commitmentRoutes from './routes/commitment.routes';
import expenditureRoutes from './routes/expenditure.routes';
import importRoutes from './routes/import.routes';
import hcvUtilizationRoutes from './routes/hcvUtilization.routes';
import reportsRoutes from './routes/reports.routes';
import uploadRoutes from './routes/upload.routes';

// Load environment variables
dotenv.config();

// Initialize express app
const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Configure CORS for cross-domain requests including SSE
app.use(cors({
  origin: ['http://localhost:3000', process.env.FRONTEND_URL || ''],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/commitments', commitmentRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/import', importRoutes);
app.use('/api/hcv-utilization', hcvUtilizationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Start listening for requests
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
