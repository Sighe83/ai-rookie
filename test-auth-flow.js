const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dfovfdluhrdmrhtubomt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmb3ZmZGx1aHJkbXJodHVib210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjk5NDEsImV4cCI6MjA2OTQwNTk0MX0.pHMloRnImKF8MqQjAJgk6NfGV5PkECJq83_j8ZX3m80';

console.log('Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testAuth = async () => {
  try {
    console.log('1. Testing authentication with your credentials...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'daniel.elkjaer@gmail.com',
      password: 'Mormor7594'
    });

    if (loginError) {
      console.error('Login failed:', loginError);
      return;
    }

    console.log('2. Login successful:', { userId: loginData.user.id, email: loginData.user.email });

    console.log('3. Testing profile fetch with authenticated session...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    console.log('4. Profile fetch result:', { 
      hasProfile: !!profile, 
      error: profileError?.message,
      errorCode: profileError?.code,
      profile: profile 
    });

    console.log('5. Testing table access...');
    const { data: allUsers, error: tableError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5);

    console.log('6. Table access result:', { 
      count: allUsers?.length,
      error: tableError?.message,
      users: allUsers 
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
};

testAuth();
