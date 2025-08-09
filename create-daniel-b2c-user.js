#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDanielB2CUser() {
    try {
        console.log('🚀 Creating B2C user for daniel.elkjaer@gmail.com...');
        
        const email = 'daniel.elkjaer@gmail.com';
        const password = 'Mormor7594';
        const name = 'Daniel Elkjær';
        
        // Create the user in Supabase Auth
        console.log('📧 Creating auth user...');
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                name: name,
                site_mode: 'B2C'
            }
        });

        if (authError) {
            console.error('❌ Auth creation failed:', authError);
            throw authError;
        }

        console.log('✅ Auth user created:', authUser.user.id);

        // Create the user profile in the users table
        console.log('👤 Creating user profile...');
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .insert([{
                id: authUser.user.id,
                email: email,
                name: name,
                site_mode: 'B2C',
                role: 'USER',
                email_verified: true,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (profileError) {
            console.error('❌ Profile creation failed:', profileError);
            throw profileError;
        }

        console.log('✅ User profile created successfully!');
        
        console.log('\n📋 User Details:');
        console.log('• Email:', email);
        console.log('• Name:', name);
        console.log('• Site Mode:', 'B2C');
        console.log('• Role:', 'USER');
        console.log('• ID:', authUser.user.id);
        console.log('• Email Verified:', true);
        console.log('• Active:', true);
        
        console.log('\n🔐 Login Credentials:');
        console.log('• Email:', email);
        console.log('• Password:', '[Set as provided]');
        
        return userProfile;

    } catch (error) {
        console.error('❌ Failed to create user:', error);
        
        // Cleanup: If profile creation failed, remove auth user
        if (error.code && error.code.includes('23505')) { // Unique constraint violation
            console.log('🔍 User might already exist, checking...');
            
            try {
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();
                    
                if (existingUser) {
                    console.log('✅ User already exists:');
                    console.log('• Email:', existingUser.email);
                    console.log('• Name:', existingUser.name);
                    console.log('• Site Mode:', existingUser.site_mode);
                    console.log('• Active:', existingUser.is_active);
                    return existingUser;
                }
            } catch (lookupError) {
                console.error('❌ Failed to lookup existing user:', lookupError);
            }
        }
        
        throw error;
    }
}

// Run the function
createDanielB2CUser()
    .then((user) => {
        console.log('\n🎉 Success! Daniel B2C user is ready to use.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Failed to create Daniel B2C user:', error.message);
        process.exit(1);
    });