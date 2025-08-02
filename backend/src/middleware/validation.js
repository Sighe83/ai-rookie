const Joi = require('joi');
const { AppError } = require('./errorHandler');

// Common validation schemas
const schemas = {
  // User registration schema
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().optional(),
    company: Joi.string().max(100).optional(),
    department: Joi.string().max(100).optional(),
    siteMode: Joi.string().valid('B2B', 'B2C').default('B2B')
  }),

  // User login schema
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // User profile update schema
  userProfileUpdate: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().optional(),
    company: Joi.string().max(100).optional(),
    department: Joi.string().max(100).optional(),
    siteMode: Joi.string().valid('B2B', 'B2C').optional()
  }),

  // Password change schema
  passwordChange: Joi.object({
    newPassword: Joi.string().min(6).required()
  }),

  // Booking creation schema
  bookingCreation: Joi.object({
    tutorId: Joi.string().uuid().required(),
    sessionId: Joi.string().uuid().required(),
    format: Joi.string().valid('INDIVIDUAL', 'TEAM').required(),
    selectedDateTime: Joi.date().min('now').required().custom((value, helpers) => {
      // Validate that time is on the hour
      const date = new Date(value);
      if (date.getMinutes() !== 0 || date.getSeconds() !== 0) {
        return helpers.message('Session must start on the hour (e.g., 10:00, 11:00)');
      }
      
      // Validate business hours (8:00 - 18:00)
      const hour = date.getHours();
      if (hour < 8 || hour >= 18) {
        return helpers.message('Sessions must be scheduled between 8:00 and 18:00');
      }
      
      return value;
    }),
    participants: Joi.number().integer().min(1).max(50).when('format', {
      is: 'TEAM',
      then: Joi.required(),
      otherwise: Joi.optional().default(1)
    }),
    siteMode: Joi.string().valid('B2B', 'B2C').required(),
    contactName: Joi.string().min(2).max(100).required(),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().optional(),
    company: Joi.string().max(100).optional(),
    department: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional()
  }),

  // Booking status update schema
  bookingStatusUpdate: Joi.object({
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED').required()
  }),

  // Availability update schema
  availabilityUpdate: Joi.object({
    tutorId: Joi.string().uuid().required(),
    date: Joi.date().required(),
    timeSlots: Joi.array().items(
      Joi.object({
        time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        available: Joi.boolean().required(),
        booked: Joi.boolean().default(false)
      })
    ).min(1).required()
  }),

  // Session creation schema
  sessionCreation: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(1000).required(),
    duration: Joi.number().integer().valid(60).default(60), // Always 60 minutes
    priceOverride: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().default(true)
  }),

  // Common query parameters
  queryParams: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      skip: Joi.number().integer().min(0).optional()
    }),
    
    dateRange: Joi.object({
      startDate: Joi.date().optional(),
      endDate: Joi.date().min(Joi.ref('startDate')).optional()
    }),
    
    filters: Joi.object({
      status: Joi.string().optional(),
      siteMode: Joi.string().valid('B2B', 'B2C').optional(),
      isActive: Joi.boolean().optional()
    })
  }
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message.replace(/"/g, ''))
        .join(', ');
      
      return next(new AppError(errorMessage, 400));
    }

    // Replace the original data with validated and sanitized data
    req[source] = value;
    next();
  };
};

// UUID validation middleware
const validateUUID = (paramName) => {
  const uuidSchema = Joi.string().uuid().required();
  
  return (req, res, next) => {
    const { error } = uuidSchema.validate(req.params[paramName]);
    
    if (error) {
      return next(new AppError(`Invalid ${paramName} format`, 400));
    }
    
    next();
  };
};

// Email validation middleware
const validateEmail = (fieldName = 'email') => {
  const emailSchema = Joi.string().email().required();
  
  return (req, res, next) => {
    const email = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
    const { error } = emailSchema.validate(email);
    
    if (error) {
      return next(new AppError(`Invalid ${fieldName} format`, 400));
    }
    
    next();
  };
};

// File upload validation
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFiles = 5
  } = options;

  return (req, res, next) => {
    if (!req.files && !req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const files = req.files || [req.file];
    
    if (files.length > maxFiles) {
      return next(new AppError(`Maximum ${maxFiles} files allowed`, 400));
    }

    for (const file of files) {
      if (file.size > maxSize) {
        return next(new AppError(`File ${file.originalname} exceeds ${maxSize} bytes`, 413));
      }
      
      if (!allowedTypes.includes(file.mimetype)) {
        return next(new AppError(`File type ${file.mimetype} not allowed`, 400));
      }
    }

    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateUUID,
  validateEmail,
  validateFileUpload
};