// Register existing user in Supabase Auth
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

async function registerExistingUser() {
  console.log('Registering existing user in Supabase Auth...');
  
  try {
    // Get the existing user data from your custom table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'daniel.elkjaer@gmail.com')
      .single();
    
    if (fetchError) {
      console.error('Error fetching existing user:', fetchError);
      return;
    }
    
    console.log('Found existing user:', existingUser);
    
    // Now register them in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: existingUser.email,
      password: 'Password123!', // Replace with your preferred password
      options: {
        data: {
          name: existingUser.name,
          phone: existingUser.phone,
          company: existingUser.company,
          department: existingUser.department,
          site_mode: existingUser.site_mode || 'B2C'
        }
      }
    });
    
    if (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('User already registered')) {
        console.log('✅ User already exists in Supabase Auth - just use the correct password for login');
      }
    } else {
      console.log('✅ Registration successful:', {
        user: data.user?.email,
        needsConfirmation: !data.session,
        authId: data.user?.id
      });
      
      if (!data.session) {
        console.log('📧 Check email for confirmation link');
      }
    }
  } catch (err) {
    console.error('Registration failed:', err.message);
  }
}

registerExistingUser();
