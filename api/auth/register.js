import { supabase, supabaseAdmin, dbHelpers } from '../config/supabase.js';
import { setCorsHeaders } from '../middleware/cors.js';

export default async function handler(req, res) {
  // Set CORS headers for all responses
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      email, 
      password, 
      name, 
      phone, 
      company, 
      department, 
      role = 'USER',
      siteMode = 'B2B' 
    } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, password and name are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          company,
          department
        }
      }
    });

    if (authError) {
      console.error('Registration error:', authError);
      return res.status(400).json({
        error: 'Registration failed',
        message: authError.message
      });
    }

    // Create user profile in database
    const userProfile = {
      id: authData.user.id,
      email,
      name,
      phone: phone || null,
      company: company || null,
      department: department || null,
      role,
      site_mode: siteMode,
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const profile = await dbHelpers.createUserProfile(userProfile);
      
      // If registration successful but needs email verification
      if (!authData.session) {
        return res.status(201).json({
          success: true,
          message: 'Registration successful! Please check your email to verify your account.',
          data: {
            user: profile,
            needsEmailVerification: true
          }
        });
      }

      // Full registration with immediate login
      res.status(201).json({
        success: true,
        message: 'Registration successful!',
        data: {
          user: profile,
          session: authData.session,
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token
        }
      });

    } catch (dbError) {
      // If profile creation fails, clean up auth user
      console.error('Profile creation failed:', dbError);
      
      // Attempt to delete the auth user (admin only)
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }

      res.status(500).json({
        error: 'Registration failed during profile creation',
        message: dbError.message
      });
    }

  } catch (error) {
    console.error('Registration handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}