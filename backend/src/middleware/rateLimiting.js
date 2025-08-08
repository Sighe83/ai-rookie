const rateLimit = require('express-rate-limit');

// Basic rate limiting for general API usage
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiting for password-related endpoints
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 password attempts per hour
  message: {
    success: false,
    error: 'Too many password change attempts from this IP, please try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for booking creation
const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // limit each IP to 50 booking attempts per 10 minutes (increased for development)
  message: {
    success: false,
    error: 'Too many booking attempts from this IP, please try again in 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 upload requests per 15 minutes
  message: {
    success: false,
    error: 'Too many file uploads from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for email-related endpoints
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 email requests per hour
  message: {
    success: false,
    error: 'Too many email requests from this IP, please try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dynamic rate limiting based on user authentication status
const createDynamicLimiter = (authenticatedMax, unauthenticatedMax, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: (req) => {
      // Check if user is authenticated
      return req.user ? authenticatedMax : unauthenticatedMax;
    },
    message: {
      success: false,
      error: 'Rate limit exceeded. Authenticated users have higher limits.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Skip rate limiting for certain conditions
const skipSuccessfulRequests = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: 'Too many failed requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordLimiter,
  bookingLimiter,
  uploadLimiter,
  emailLimiter,
  createDynamicLimiter,
  skipSuccessfulRequests
};