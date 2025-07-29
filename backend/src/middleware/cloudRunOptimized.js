const { gcloudService } = require('../config/gcloud');

// Middleware optimized for Cloud Run
const cloudRunMiddleware = {
  // Request tracing for Cloud Trace
  tracing: (req, res, next) => {
    // Extract trace context from headers
    const traceHeader = req.get('X-Cloud-Trace-Context');
    if (traceHeader) {
      const [traceId] = traceHeader.split('/');
      req.traceId = traceId;
    }
    
    // Add trace ID to response headers
    if (req.traceId) {
      res.set('X-Trace-Id', req.traceId);
    }
    
    next();
  },

  // Enhanced logging with Cloud Logging
  requestLogging: (req, res, next) => {
    const start = Date.now();
    
    // Log request start
    gcloudService.log('info', 'Request started', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      traceId: req.traceId,
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - start;
      
      gcloudService.log('info', 'Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        traceId: req.traceId,
      });

      originalEnd.call(this, chunk, encoding);
    };

    next();
  },

  // Health check optimized for Cloud Run
  healthCheck: (req, res, next) => {
    if (req.url === '/health' || req.url === '/_ah/health') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.K_REVISION || '1.0.0',
        service: process.env.K_SERVICE || 'ai-rookie-backend',
      });
    }
    next();
  },

  // Graceful shutdown handling
  gracefulShutdown: () => {
    const signals = ['SIGTERM', 'SIGINT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`Received ${signal}, starting graceful shutdown...`);
        
        try {
          // Log shutdown start
          await gcloudService.log('info', 'Graceful shutdown initiated', {
            signal,
            timestamp: new Date().toISOString(),
          });

          // Close database connections
          const { databaseService } = require('../config/database');
          await databaseService.disconnect();

          console.log('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    });
  },

  // Memory usage monitoring
  memoryMonitoring: (req, res, next) => {
    // Check memory usage on each request
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    // Log high memory usage
    if (memUsageMB.heapUsed > 400) { // Alert if heap > 400MB
      gcloudService.log('warning', 'High memory usage detected', {
        memoryUsage: memUsageMB,
        url: req.url,
        traceId: req.traceId,
      });
    }

    // Add memory info to response headers (for debugging)
    if (process.env.NODE_ENV === 'development') {
      res.set('X-Memory-Usage', JSON.stringify(memUsageMB));
    }

    next();
  },

  // Error handling optimized for Cloud Logging
  errorHandler: (error, req, res, next) => {
    const statusCode = error.status || error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Log error to Cloud Logging
    gcloudService.log('error', 'Request error', {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
      },
      statusCode,
      traceId: req.traceId,
    });

    // Send error response
    res.status(statusCode).json({
      error: {
        message: process.env.NODE_ENV === 'production' ? 
          (statusCode < 500 ? message : 'Internal Server Error') : 
          message,
        code: error.code,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      },
      timestamp: new Date().toISOString(),
      traceId: req.traceId,
    });
  },

  // Rate limiting with Cloud Trace correlation
  enhancedRateLimit: (windowMs = 15 * 60 * 1000, max = 100) => {
    const requests = new Map();

    return (req, res, next) => {
      const clientId = req.ip || req.get('X-Forwarded-For') || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old requests
      if (requests.has(clientId)) {
        const clientRequests = requests.get(clientId).filter(time => time > windowStart);
        requests.set(clientId, clientRequests);
      } else {
        requests.set(clientId, []);
      }

      const clientRequests = requests.get(clientId);
      
      if (clientRequests.length >= max) {
        // Log rate limit exceeded
        gcloudService.log('warning', 'Rate limit exceeded', {
          clientId,
          requestCount: clientRequests.length,
          windowMs,
          max,
          traceId: req.traceId,
        });

        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      clientRequests.push(now);
      requests.set(clientId, clientRequests);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - clientRequests.length),
        'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
      });

      next();
    };
  },
};

module.exports = cloudRunMiddleware;