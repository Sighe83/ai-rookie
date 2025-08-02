const { createClient } = require('@supabase/supabase-js');
const { databaseService } = require('../config/database');

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token, authorization denied'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Get user data from our database using the Supabase user ID
    const dbUser = await databaseService.findUnique('user', {
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        siteMode: true,
        createdAt: true
      }
    });

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        error: 'User not found in database'
      });
    }

    req.user = dbUser;
    req.supabaseUser = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        const dbUser = await databaseService.findUnique('user', {
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            siteMode: true,
            createdAt: true
          }
        });

        if (dbUser) {
          req.user = dbUser;
          req.supabaseUser = user;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin role required.'
    });
  }
  next();
};

const tutorOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'TUTOR' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Tutor role required.'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminOnly,
  tutorOnly
};