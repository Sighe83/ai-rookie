#!/usr/bin/env node

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

// Use production environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://ycdhzwnjiarflruwavxi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing production Supabase configuration');
    console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.production');
    process.exit(1);
}

console.log('🌐 Using Production Database:', supabaseUrl.includes('ycdhzwnjiarflruwavxi') ? '✅ ai-rookie-prod' : '❌ Wrong DB');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDanielB2CUserProduction() {
    try {
        console.log('🚀 Creating B2C user in PRODUCTION for daniel.elkjaer@gmail.com...');
        console.log('🌐 Target Database: ai-rookie-prod (ycdhzwnjiarflruwavxi)');
        
        const email = 'daniel.elkjaer@gmail.com';
        const password = 'Mormor7594';
        const name = 'Daniel Elkjær';
        
        // First check if user already exists
        console.log('🔍 Checking if user already exists...');
        const { data: existingProfile, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingProfile) {
            console.log('✅ User already exists in production:');
            console.log('• Email:', existingProfile.email);
            console.log('• Name:', existingProfile.name);
            console.log('• Site Mode:', existingProfile.site_mode);
            console.log('• Active:', existingProfile.is_active);
            console.log('• User ID:', existingProfile.id);
            
            if (existingProfile.site_mode === 'B2C' && existingProfile.is_active) {
                console.log('\n🎉 Production B2C user is already properly configured!');
                return existingProfile;
            } else {
                console.log('\n🔄 Updating user to B2C mode...');
                const { data: updated, error: updateError } = await supabase
                    .from('users')
                    .update({ 
                        site_mode: 'B2C',
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', email)
                    .select()
                    .single();
                
                if (updateError) throw updateError;
                console.log('✅ User updated to B2C in production!');
                return updated;
            }
        }
        
        // Create the user in Supabase Auth
        console.log('📧 Creating auth user in production...');
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
            if (authError.code === 'email_exists') {
                console.log('📧 Auth user already exists, checking for profile...');
                
                // Get existing auth users to find the ID
                const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) throw listError;
                
                const existingAuthUser = authUsers.users.find(u => u.email === email);
                if (!existingAuthUser) {
                    throw new Error('Auth user exists but could not be found');
                }
                
                // Create profile for existing auth user
                const { data: userProfile, error: profileError } = await supabase
                    .from('users')
                    .insert([{
                        id: existingAuthUser.id,
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

                console.log('✅ User profile created for existing auth user!');
                return userProfile;
            } else {
                console.error('❌ Auth creation failed:', authError);
                throw authError;
            }
        }

        console.log('✅ Auth user created in production:', authUser.user.id);

        // Create the user profile in the users table
        console.log('👤 Creating user profile in production...');
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

        console.log('✅ User profile created successfully in production!');
        
        console.log('\n📋 Production User Details:');
        console.log('• Email:', email);
        console.log('• Name:', name);
        console.log('• Site Mode:', 'B2C');
        console.log('• Role:', 'USER');
        console.log('• ID:', authUser.user.id);
        console.log('• Database:', 'ai-rookie-prod');
        console.log('• Email Verified:', true);
        console.log('• Active:', true);
        
        return userProfile;

    } catch (error) {
        console.error('❌ Failed to create production user:', error);
        throw error;
    }
}

// Run the function
createDanielB2CUserProduction()
    .then((user) => {
        console.log('\n🎉 Success! Daniel B2C user is ready in PRODUCTION.');
        console.log('🔐 Production Login Credentials:');
        console.log('• Email: daniel.elkjaer@gmail.com');
        console.log('• Password: Mormor7594');
        console.log('• Environment: Production (ai-rookie-prod)');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Failed to create Daniel B2C user in production:', error.message);
        process.exit(1);
    });