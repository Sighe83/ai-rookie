const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dfovfdluhrdmrhtubomt.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmb3ZmZGx1aHJkbXJodHVib210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NDI4MjcsImV4cCI6MjA1MDAxODgyN30.sBOjLcBz2fFmfTmhmbcK-Sv9n_W8c1TLGAKqLbKjOyY';

console.log('Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testProfileFetch = async () => {
  try {
    console.log('Testing profile fetch...');
    const userId = '6177fe67-8ef9-496f-a233-de6151750eb5';
    
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('Profile fetch result:', { 
      hasProfile: !!profile, 
      error: error?.message,
      errorCode: error?.code,
      profile: profile 
    });
  } catch (error) {
    console.error('Profile fetch failed:', error);
  }
};

testProfileFetch();
