import { supabase, dbHelpers } from '../config/supabase.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Login error:', authError);
      return res.status(401).json({
        error: 'Invalid credentials',
        message: authError.message
      });
    }

    // Get user profile from database
    const userProfile = await dbHelpers.getUserProfile(authData.user.id);

    // Generate custom JWT (if needed for your app logic)
    const customToken = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        role: userProfile.role || 'USER'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          ...userProfile
        },
        session: authData.session,
        customToken, // For legacy compatibility if needed
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      }
    });

  } catch (error) {
    console.error('Login handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}