// Test the exact same code that the web app uses
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Web app Supabase config:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  anonKeyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
});

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test login with the exact same configuration as the web app
async function testWebAppLogin() {
  console.log('Testing login with web app configuration...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'daniel.elkjaer@gmail.com',
      password: 'Mormor7594'
    });
    
    if (error) {
      console.error('Login error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        fullError: error
      });
    } else {
      console.log('✅ Login successful with web app config:', data.user?.email);
    }
  } catch (err) {
    console.error('Login exception:', err);
  }
}

testWebAppLogin();
