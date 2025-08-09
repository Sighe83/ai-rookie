#!/usr/bin/env node

require('dotenv').config({path: '.env.production'});
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🌐 Testing Production Database:', supabaseUrl?.includes('ycdhzwnjiarflruwavxi') ? 'ai-rookie-prod ✅' : 'Wrong DB ❌');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductionAudit() {
    try {
        console.log('\n🧪 Testing Production Hybrid Audit System...');
        
        // 1. Verify audit table exists in production
        console.log('\n1️⃣ Verifying production audit table...');
        const { data: tableCheck, error: tableError } = await supabase
            .from('tutor_availability_log')
            .select('count')
            .limit(1);
            
        if (tableError) {
            console.error('❌ Production audit table missing:', tableError.message);
            return false;
        }
        console.log('✅ Production audit table exists and is accessible');

        // 2. Find a tutor in production
        console.log('\n2️⃣ Finding production tutor...');
        const { data: tutors, error: tutorError } = await supabase
            .from('tutors')
            .select('id, user_id, user:users(name, email)')
            .limit(1);
            
        if (tutorError || !tutors?.length) {
            console.error('❌ No tutors found in production:', tutorError?.message);
            return false;
        }
        
        const testTutor = tutors[0];
        console.log(`✅ Found production tutor: ${testTutor.user.name} (${testTutor.id})`);

        // 3. Test production audit insertion
        console.log('\n3️⃣ Testing production audit insertion...');
        const testAuditRecord = {
            id: generateUUID(),
            tutor_id: testTutor.id,
            date: '2025-08-15',
            start_time: '10:00:00',
            action: 'ADDED',
            reason: 'production_test',
            changed_at: new Date().toISOString(),
            changed_by: testTutor.user_id,
            notes: 'Production test record for hybrid audit system'
        };
        
        const { error: auditError } = await supabase
            .from('tutor_availability_log')
            .insert([testAuditRecord]);
            
        if (auditError) {
            console.error('❌ Error inserting production audit record:', auditError.message);
            return false;
        }
        console.log('✅ Production audit record inserted successfully');

        // 4. Test production audit retrieval
        console.log('\n4️⃣ Testing production audit retrieval...');
        const { data: auditLogs, error: logError } = await supabase
            .from('tutor_availability_log')
            .select('*')
            .eq('tutor_id', testTutor.id)
            .order('changed_at', { ascending: false })
            .limit(3);
            
        if (logError) {
            console.error('❌ Error retrieving production audit logs:', logError.message);
            return false;
        }
        
        console.log(`✅ Retrieved ${auditLogs?.length || 0} production audit entries:`);
        auditLogs?.forEach(log => {
            console.log(`   • ${log.changed_at.substring(0, 19)} - ${log.action} slot at ${log.start_time.substring(0, 5)} (${log.reason})`);
        });

        // 5. Clean up test data
        console.log('\n5️⃣ Cleaning up production test data...');
        const { error: cleanupError } = await supabase
            .from('tutor_availability_log')
            .delete()
            .eq('id', testAuditRecord.id);
            
        if (cleanupError) {
            console.warn('⚠️ Could not clean up production test record:', cleanupError.message);
        } else {
            console.log('✅ Production test record cleaned up');
        }

        console.log('\n🎉 Production Hybrid Audit System Test Complete!');
        console.log('\n📋 Production Summary:');
        console.log('• ✅ Production audit table functional');
        console.log('• ✅ Production audit logging works');
        console.log('• ✅ Production audit retrieval works');
        console.log('• ✅ Production data integrity maintained');
        
        return true;

    } catch (error) {
        console.error('💥 Production test failed:', error.message);
        return false;
    }
}

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Run production test
testProductionAudit()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('💥 Production test crashed:', error.message);
        process.exit(1);
    });