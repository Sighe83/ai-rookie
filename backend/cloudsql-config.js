const { PrismaClient } = require('@prisma/client');

// Google Cloud SQL connection configuration
function getDatabaseUrl() {
  if (process.env.NODE_ENV === 'production') {
    // For Google Cloud SQL with private IP
    if (process.env.DB_SOCKET_PATH) {
      return `mysql://${process.env.DB_USER}:${process.env.DB_PASS}@localhost/${process.env.DB_NAME}?socket=${process.env.DB_SOCKET_PATH}`;
    }
    
    // For Google Cloud SQL with public IP
    if (process.env.DB_HOST) {
      return `mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`;
    }
  }
  
  // Fallback to DATABASE_URL (for development or external databases)
  return process.env.DATABASE_URL;
}

// Create Prisma client with connection pooling for Google Cloud
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Connection health check
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Graceful shutdown
async function closeDatabaseConnection() {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

module.exports = {
  prisma,
  checkDatabaseConnection,
  closeDatabaseConnection,
  getDatabaseUrl
};