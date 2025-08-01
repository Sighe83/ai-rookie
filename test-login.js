// Test login with existing user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log('Testing login with existing user...');
  
  // First, let's try to understand what users exist in Supabase Auth
  console.log('Checking Supabase auth users...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'daniel.elkjaer@gmail.com',
      password: 'Mormor7594'
    });
    
    if (error) {
      console.log('Login error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      
      // If invalid credentials, the user might not exist in Supabase Auth
      if (error.code === 'invalid_credentials') {
        console.log('\n⚠️  The user exists in your database but not in Supabase Auth.');
        console.log('This means the user was created directly in the database, not through Supabase Auth.');
        console.log('To fix this, you need to either:');
        console.log('1. Register the user through Supabase Auth, or');
        console.log('2. Use the correct password if they were registered through Auth');
      }
    } else {
      console.log('✅ Login successful:', data.user?.email);
    }
  } catch (err) {
    console.error('Login failed:', err.message);
  }
}

testLogin();
