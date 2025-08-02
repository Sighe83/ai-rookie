const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
  constructor() {
    this.prisma = null;
    this.supabase = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
  }

  async initialize() {
    try {
      // Get database URL from environment
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not found in environment variables');
      }

      // Create Prisma client
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });

      // Initialize Supabase client
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
      }

      // Test connection
      await this.connect();
      
      console.log('✅ Database initialized successfully', {
        component: 'database',
        connectionAttempts: this.connectionAttempts,
      });

      return this.prisma;
    } catch (error) {
      console.error('❌ Database initialization failed', {
        component: 'database',
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async connect() {
    if (this.isConnected) {
      return this.prisma;
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.connectionAttempts = attempt;
        
        // Test database connection
        await this.prisma.$connect();
        await this.prisma.$queryRaw`SELECT 1`;
        
        this.isConnected = true;
        console.log(`✅ Database connected on attempt ${attempt}`);
        return this.prisma;
        
      } catch (error) {
        lastError = error;
        this.isConnected = false;
        
        console.warn(`⚠️ Database connection attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          console.error('❌ Database connection failed after max retries', {
            component: 'database',
            attempts: this.maxRetries,
            error: error.message,
          });
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  async disconnect() {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect();
        this.isConnected = false;
        console.log('📴 Database disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }

  async healthCheck() {
    try {
      if (!this.prisma) {
        return false;
      }
      
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error.message);
      return false;
    }
  }

  // Transaction wrapper with retry logic
  async transaction(callback, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(callback);
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain types of errors
        if (error.code === 'P2002' || error.code === 'P2025') {
          throw error;
        }
        
        if (attempt === maxRetries) {
          console.error('❌ Transaction failed after retries', {
            component: 'database',
            attempts: maxRetries,
            error: error.message,
          });
          throw error;
        }
        
        console.warn(`⚠️ Transaction attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw lastError;
  }

  // Helper methods for common database operations
  async findUnique(model, args) {
    return this.prisma[model].findUnique(args);
  }

  async findMany(model, args) {
    return this.prisma[model].findMany(args);
  }

  async create(model, args) {
    return this.prisma[model].create(args);
  }

  async update(model, args) {
    return this.prisma[model].update(args);
  }

  async delete(model, args) {
    return this.prisma[model].delete(args);
  }

  async upsert(model, args) {
    return this.prisma[model].upsert(args);
  }

  // Get Supabase client for storage and auth operations
  getSupabaseClient() {
    return this.supabase;
  }

  // Get Prisma client for direct database operations
  getPrismaClient() {
    return this.prisma;
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = { 
  databaseService,
  DatabaseService 
};