// Test script to create a user for testing login
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestUser() {
  console.log('Creating test user...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'testuser@gmail.com',
      password: 'testpass123',
      options: {
        data: {
          name: 'Test User',
          site_mode: 'B2C'
        }
      }
    });
    
    if (error) {
      console.error('Registration error:', error);
    } else {
      console.log('Registration result:', {
        user: data.user?.email,
        emailConfirmationSent: data.user?.email_confirmed_at === null,
        session: !!data.session
      });
      
      if (data.session) {
        console.log('User can login immediately');
      } else {
        console.log('User needs to confirm email before login');
      }
    }
  } catch (err) {
    console.error('Registration failed:', err.message);
  }
}

createTestUser();
