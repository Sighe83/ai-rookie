// Create a test user and simulate email confirmation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key to bypass email confirmation
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createConfirmedTestUser() {
  console.log('Creating confirmed test user...');
  
  try {
    // Create user with admin privileges (bypasses email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'testuser123@gmail.com',
      password: 'testpass123',
      email_confirm: true, // This bypasses email confirmation
      user_metadata: {
        name: 'Test User',
        site_mode: 'B2C'
      }
    });
    
    if (error) {
      console.error('User creation error:', error);
    } else {
      console.log('User created successfully:', {
        email: data.user?.email,
        confirmed: data.user?.email_confirmed_at !== null,
        id: data.user?.id
      });
      
      console.log('\n✅ You can now test login with:');
      console.log('Email: testuser123@gmail.com');
      console.log('Password: testpass123');
    }
  } catch (err) {
    console.error('Failed to create user:', err.message);
  }
}

createConfirmedTestUser();
