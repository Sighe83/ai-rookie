const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Google Cloud optimized imports
const { databaseService } = require('./config/database');
const { gcloudService } = require('./config/gcloud');
const cloudRunMiddleware = require('./middleware/cloudRunOptimized');

const errorHandler = require('./middleware/errorHandler');
const tutorRoutes = require('./routes/tutors');
const bookingRoutes = require('./routes/bookings');
const availabilityRoutes = require('./routes/availability');
const authRoutes = require('./routes/auth');
// const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://airookie.dk',
    'https://storage.googleapis.com',
    'https://ai-rookie-frontend-arcane-fire-467421-d1.storage.googleapis.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-site-mode']
}));

// Google Cloud optimized rate limiting
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
app.use('/api', cloudRunMiddleware.enhancedRateLimit(rateLimitWindow, rateLimitMax));

// Google Cloud optimized middleware
app.use(cloudRunMiddleware.tracing);
app.use(cloudRunMiddleware.requestLogging);
app.use(cloudRunMiddleware.healthCheck);
app.use(cloudRunMiddleware.memoryMonitoring);
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

// Enhanced health check endpoint with Google Cloud services
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await databaseService.healthCheck();
    const gcloudHealth = await gcloudService.healthCheck();
    
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.K_REVISION || '1.0.0',
      service: process.env.K_SERVICE || 'ai-rookie-backend',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealthy,
      googleCloud: gcloudHealth,
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
// app.use('/api/payments', paymentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Google Cloud optimized error handler
app.use(cloudRunMiddleware.errorHandler);

// Google Cloud optimized graceful shutdown
cloudRunMiddleware.gracefulShutdown();

// Initialize Google Cloud services and start server
async function startServer() {
  try {
    // Initialize database
    await databaseService.initialize();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`☁️  Google Cloud Project: ${process.env.GOOGLE_CLOUD_PROJECT || 'local'}`);
    });
    
    // Log startup
    await gcloudService.log('info', 'Server started successfully', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.K_REVISION || '1.0.0'
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    await gcloudService.log('error', 'Server startup failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;