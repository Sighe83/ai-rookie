const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { databaseService } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authLimiter, passwordLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/auth/register - Register new user via Supabase
router.post('/register', authLimiter, validate(schemas.userRegistration), asyncHandler(async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    company,
    department,
    siteMode
  } = req.body;

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password: password,
    email_confirm: true,
    user_metadata: {
      name: name,
      phone: phone,
      company: company,
      department: department,
      site_mode: siteMode
    }
  });

  if (authError) {
    return res.status(400).json({
      success: false,
      error: authError.message
    });
  }

  // Create user profile in our database
  const user = await databaseService.create('user', {
    data: {
      id: authData.user.id,
      email: email.toLowerCase(),
      name: name,
      phone: phone,
      company: company,
      department: department,
      siteMode: siteMode,
      emailVerified: true
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      company: true,
      department: true,
      role: true,
      siteMode: true,
      createdAt: true
    }
  });

  res.status(201).json({
    success: true,
    data: {
      user: user,
      supabaseUser: authData.user
    }
  });
}));

// POST /api/auth/login - Login user via Supabase
router.post('/login', authLimiter, validate(schemas.userLogin), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Sign in with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password: password
  });

  if (authError) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Get user profile from our database
  const user = await databaseService.findUnique('user', {
    where: { id: authData.user.id },
    include: {
      tutor: {
        select: {
          id: true,
          title: true,
          specialty: true
        }
      }
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User profile not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: user,
      session: authData.session,
      supabaseUser: authData.user
    }
  });
}));

// GET /api/auth/me - Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await databaseService.findUnique('user', {
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        company: true,
        department: true,
        role: true,
        siteMode: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      },
      include: {
        tutor: {
          select: {
            id: true,
            title: true,
            specialty: true,
            experience: true,
            valueProp: true,
            img: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user,
        supabaseUser: req.supabaseUser
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authMiddleware, validate(schemas.userProfileUpdate), asyncHandler(async (req, res) => {
  try {
    const {
      name,
      phone,
      company,
      department,
      siteMode
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (company) updateData.company = company;
    if (department) updateData.department = department;
    if (siteMode) updateData.siteMode = siteMode;

    const updatedUser = await databaseService.update('user', {
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        company: true,
        department: true,
        role: true,
        siteMode: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
}));

// POST /api/auth/change-password - Change user password via Supabase
router.post('/change-password', passwordLimiter, authMiddleware, validate(schemas.passwordChange), asyncHandler(async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Update password in Supabase Auth
    const { error } = await supabase.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
}));

// POST /api/auth/logout - Logout user via Supabase
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Sign out from Supabase (invalidates the session)
    const { error } = await supabase.auth.admin.signOut(req.supabaseUser.id);
    
    if (error) {
      console.warn('Error signing out from Supabase:', error.message);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

module.exports = router;