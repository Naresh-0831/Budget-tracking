require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// ─── CORS Configuration ───────────────────────────────────────────────────────
// Using array-based origin — cors() handles OPTIONS preflight automatically
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://budget-tracking-1-ih5p.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// ─────────────────────────────────────────────────────────────────────────────

// Security middleware
app.use(helmet());

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ml', require('./routes/mlRoutes'));
app.use('/api/bank', require('./routes/bank'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Smart Budget API is running 🚀', timestamp: new Date() });
});

// 404 handler (middleware-based — no wildcard route needed)
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
