#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDanielUser() {
    try {
        const email = 'daniel.elkjaer@gmail.com';
        
        console.log('🔍 Checking user status for daniel.elkjaer@gmail.com...');
        
        // Check if user exists in users table
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
        }

        if (userProfile) {
            console.log('✅ User profile found:');
            console.log('• ID:', userProfile.id);
            console.log('• Email:', userProfile.email);
            console.log('• Name:', userProfile.name);
            console.log('• Site Mode:', userProfile.site_mode);
            console.log('• Role:', userProfile.role);
            console.log('• Email Verified:', userProfile.email_verified);
            console.log('• Active:', userProfile.is_active);
            console.log('• Created:', new Date(userProfile.created_at).toLocaleString());
            
            if (userProfile.site_mode === 'B2C' && userProfile.is_active) {
                console.log('\n🎉 User is properly configured as B2C and active!');
                console.log('🔐 You can now login with:');
                console.log('• Email: daniel.elkjaer@gmail.com');
                console.log('• Password: [Your set password]');
            } else if (userProfile.site_mode !== 'B2C') {
                console.log('\n⚠️  User exists but is not configured as B2C');
                console.log('Updating site mode to B2C...');
                
                const { data: updated, error: updateError } = await supabase
                    .from('users')
                    .update({ 
                        site_mode: 'B2C',
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', email)
                    .select()
                    .single();
                
                if (updateError) {
                    throw updateError;
                }
                
                console.log('✅ User updated to B2C mode!');
            }
        } else {
            console.log('❌ User profile not found in users table');
            console.log('The auth user exists but profile is missing');
            
            // Try to get the auth user ID
            const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
            
            if (listError) {
                throw listError;
            }
            
            const authUser = authUsers.users.find(u => u.email === email);
            if (authUser) {
                console.log('📧 Auth user found, creating profile...');
                
                const { data: newProfile, error: createError } = await supabase
                    .from('users')
                    .insert([{
                        id: authUser.id,
                        email: email,
                        name: 'Daniel Elkjær',
                        site_mode: 'B2C',
                        role: 'USER',
                        email_verified: true,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (createError) {
                    throw createError;
                }
                
                console.log('✅ User profile created successfully!');
                console.log('🎉 User is now ready as B2C user!');
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking user:', error);
        throw error;
    }
}

checkDanielUser()
    .then(() => {
        console.log('\n✅ Daniel B2C user check complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Failed to check Daniel user:', error.message);
        process.exit(1);
    });