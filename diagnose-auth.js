// Comprehensive diagnosis of the authentication issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseAuth() {
  console.log('🔍 Diagnosing Authentication Issue\n');
  
  // 1. Check database users
  console.log('1. Checking users in custom database table:');
  try {
    const { data: dbUsers, error } = await supabase
      .from('users')
      .select('email, name, role, created_at')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching database users:', error);
    } else {
      console.log('✅ Database users found:', dbUsers.length);
      dbUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - Created: ${user.created_at}`);
      });
    }
  } catch (err) {
    console.error('❌ Database query failed:', err.message);
  }
  
  // 2. Test login with known user
  console.log('\n2. Testing login with existing user:');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'daniel.elkjaer@gmail.com',
      password: 'test123' // Common test password - update this
    });
    
    if (error) {
      console.log('❌ Login failed:', error.message);
      
      if (error.code === 'invalid_credentials') {
        console.log('   💡 This means either:');
        console.log('      a) Wrong password, or');
        console.log('      b) User not registered in Supabase Auth');
      }
    } else {
      console.log('✅ Login successful!');
    }
  } catch (err) {
    console.error('❌ Login attempt failed:', err.message);
  }
  
  // 3. Test registration with new user
  console.log('\n3. Testing registration with new user:');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'newtest@gmail.com',
      password: 'testpass123',
      options: {
        data: {
          name: 'New Test User',
          site_mode: 'B2C'
        }
      }
    });
    
    if (error) {
      console.log('❌ Registration failed:', error.message);
    } else {
      console.log('✅ Registration successful!');
      console.log('   📧 Email confirmation needed:', !data.session);
    }
  } catch (err) {
    console.error('❌ Registration attempt failed:', err.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('- Update passwords in test scripts with real values');
  console.log('- Run register-existing-user.js to add existing users to Supabase Auth');
  console.log('- Confirm emails if required');
  console.log('- Test login with correct credentials');
}

diagnoseAuth();
