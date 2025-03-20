"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const budget_routes_1 = __importDefault(require("./routes/budget.routes"));
const commitment_routes_1 = __importDefault(require("./routes/commitment.routes"));
const expenditure_routes_1 = __importDefault(require("./routes/expenditure.routes"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
const hcvUtilization_routes_1 = __importDefault(require("./routes/hcvUtilization.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
// Load environment variables
dotenv_1.default.config();
// Initialize express app
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
// Configure CORS for cross-domain requests including SSE
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', process.env.FRONTEND_URL || ''],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/budget', budget_routes_1.default);
app.use('/api/commitments', commitment_routes_1.default);
app.use('/api/expenditures', expenditure_routes_1.default);
app.use('/api/import', import_routes_1.default);
app.use('/api/hcv-utilization', hcvUtilization_routes_1.default);
app.use('/api/reports', reports_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// Error handling middleware
app.use((err, req, res, next) => {
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
        await (0, database_1.initializeDatabase)();
        // Start listening for requests
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
