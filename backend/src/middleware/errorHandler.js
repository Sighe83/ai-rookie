// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error('Error Details:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    const message = `${field} already exists`;
    error = { message, statusCode: 409 };
  }

  if (err.code === 'P2014') {
    const message = 'Invalid ID provided';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'P2003') {
    const message = 'Invalid reference - related record not found';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'P2025') {
    const message = 'Record not found';
    error = { message, statusCode: 404 };
  }

  if (err.code === 'P2016') {
    const message = 'Query interpretation error';
    error = { message, statusCode: 400 };
  }

  // Supabase auth errors
  if (err.message?.includes('Invalid JWT')) {
    const message = 'Invalid authentication token';
    error = { message, statusCode: 401 };
  }

  if (err.message?.includes('JWT expired')) {
    const message = 'Authentication token expired';
    error = { message, statusCode: 401 };
  }

  // Validation errors (Joi)
  if (err.name === 'ValidationError' || err.isJoi) {
    const message = err.details ? err.details.map(detail => detail.message).join(', ') : err.message;
    error = { message, statusCode: 400 };
  }

  // Express validator errors
  if (err.errors && Array.isArray(err.errors)) {
    const message = err.errors.map(e => e.msg).join(', ');
    error = { message, statusCode: 400 };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 413 };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = { message, statusCode: 413 };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err
    })
  });
};

module.exports = { errorHandler, AppError, asyncHandler };