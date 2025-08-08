const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Supabase optimized imports
const { databaseService } = require('./config/database');

const { errorHandler } = require('./middleware/errorHandler');
const tutorRoutes = require('./routes/tutors');
const bookingRoutes = require('./routes/bookings');
const availabilityRoutes = require('./routes/availability');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const bookingCleanupService = require('./services/bookingCleanupService');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://ai-rookie.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-site-mode']
}));

// Rate limiting
const { apiLimiter } = require('./middleware/rateLimiting');
app.use('/api', apiLimiter);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'AI Rookie Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await databaseService.healthCheck();
    
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'ai-rookie-backend',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealthy,
      supabase: dbHealthy,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use(errorHandler);

// Start server function
async function startServer() {
  try {
    // Initialize database
    await databaseService.initialize();
    
    // Start booking cleanup service
    bookingCleanupService.start();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`📊 Database: Supabase PostgreSQL`);
      console.log(`🧹 Booking cleanup service started`);
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  bookingCleanupService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  bookingCleanupService.stop();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection:', err.message);
  bookingCleanupService.stop();
  process.exit(1);
});

module.exports = app;