const { PrismaClient } = require('@prisma/client');
const { gcloudService } = require('./gcloud');

class DatabaseService {
  constructor() {
    this.prisma = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
  }

  async initialize() {
    try {
      // Get database URL from Secret Manager or environment
      const databaseUrl = await gcloudService.getSecret('DATABASE_URL') || process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not found in secrets or environment');
      }

      // Create Prisma client with optimized configuration for Cloud Run
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        
        // Connection pooling optimized for Cloud Run
        __internal: {
          engine: {
            endpoint: databaseUrl,
          },
        },
      });

      // Test connection
      await this.connect();
      
      await gcloudService.log('info', 'Database initialized successfully', {
        component: 'database',
        connectionAttempts: this.connectionAttempts,
      });

      return this.prisma;
    } catch (error) {
      await gcloudService.log('error', 'Database initialization failed', {
        component: 'database',
        error: error.message,
        connectionAttempts: this.connectionAttempts,
      });
      throw error;
    }
  }

  async connect() {
    if (this.isConnected) {
      return this.prisma;
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.connectionAttempts = attempt;
        await this.prisma.$connect();
        this.isConnected = true;
        
        console.log(`✅ Database connected on attempt ${attempt}`);
        return this.prisma;
      } catch (error) {
        console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          await gcloudService.log('error', 'Database connection failed after max retries', {
            component: 'database',
            error: error.message,
            attempts: this.maxRetries,
          });
          throw new Error(`Database connection failed after ${this.maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async disconnect() {
    if (this.prisma && this.isConnected) {
      try {
        await this.prisma.$disconnect();
        this.isConnected = false;
        console.log('🔌 Database disconnected');
      } catch (error) {
        console.error('Error disconnecting from database:', error);
      }
    }
  }

  async healthCheck() {
    try {
      if (!this.prisma || !this.isConnected) {
        return false;
      }

      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Transaction wrapper with retry logic
  async transaction(operations, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(operations);
      } catch (error) {
        if (attempt === maxRetries) {
          await gcloudService.log('error', 'Transaction failed after retries', {
            component: 'database',
            error: error.message,
            attempts: maxRetries,
          });
          throw error;
        }
        
        // Check if it's a retryable error
        if (this.isRetryableError(error)) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
  }

  isRetryableError(error) {
    const retryableErrors = [
      'Connection terminated',
      'Connection reset',
      'Timeout',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
    ];
    
    return retryableErrors.some(msg => 
      error.message.includes(msg) || error.code === msg
    );
  }

  getClient() {
    if (!this.prisma || !this.isConnected) {
      throw new Error('Database not connected. Call initialize() first.');
    }
    return this.prisma;
  }
}

// Singleton instance
const databaseService = new DatabaseService();

module.exports = {
  DatabaseService,
  databaseService,
};