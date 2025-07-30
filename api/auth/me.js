import { supabase, dbHelpers } from '../config/supabase.js';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Set the session for Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: userError?.message 
      });
    }

    // Get complete user profile from database
    try {
      const userProfile = await dbHelpers.getUserProfile(user.id);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            ...userProfile,
            // Add auth metadata
            emailVerified: user.email_confirmed_at ? true : false,
            lastSignIn: user.last_sign_in_at,
            createdAt: user.created_at
          }
        }
      });

    } catch (profileError) {
      // User exists in auth but not in database - create profile
      console.warn('User profile not found, creating basic profile:', profileError);
      
      const basicProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        phone: user.user_metadata?.phone || null,
        company: user.user_metadata?.company || null,
        department: user.user_metadata?.department || null,
        role: 'USER',
        site_mode: 'B2B',
        email_verified: user.email_confirmed_at ? true : false,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      };

      const createdProfile = await dbHelpers.createUserProfile(basicProfile);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            ...createdProfile,
            emailVerified: user.email_confirmed_at ? true : false,
            lastSignIn: user.last_sign_in_at,
            createdAt: user.created_at
          }
        }
      });
    }

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}