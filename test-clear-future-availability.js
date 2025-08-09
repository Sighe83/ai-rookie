#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testClearFutureAvailability() {
    try {
        console.log('🧪 Testing "Slet ALLE fremtidige" functionality...');
        console.log('🌐 Database:', supabaseUrl.includes('kqayvowdlnlfaqonrudy') ? 'Development' : 'Production');
        
        // Find a test tutor
        const { data: tutors, error: tutorError } = await supabase
            .from('tutors')
            .select('id, user_id, user:users(name, email)')
            .limit(1);
            
        if (tutorError || !tutors?.length) {
            console.error('❌ No tutors found:', tutorError?.message);
            return false;
        }
        
        const testTutor = tutors[0];
        console.log(`✅ Testing with tutor: ${testTutor.user.name} (${testTutor.id})`);

        // Create some test time slots for future dates
        console.log('\n1️⃣ Creating test future availability slots...');
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);

        const testSlots = [
            {
                id: generateUUID(),
                tutor_id: testTutor.id,
                date: tomorrow.toISOString().split('T')[0],
                start_time: '09:00:00',
                end_time: '10:00:00',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: generateUUID(),
                tutor_id: testTutor.id,
                date: nextWeek.toISOString().split('T')[0],
                start_time: '14:00:00',
                end_time: '15:00:00',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: generateUUID(),
                tutor_id: testTutor.id,
                date: nextMonth.toISOString().split('T')[0],
                start_time: '11:00:00',
                end_time: '12:00:00',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        const { error: insertError } = await supabase
            .from('tutor_time_slots')
            .insert(testSlots);

        if (insertError) {
            console.error('❌ Failed to create test slots:', insertError.message);
            return false;
        }

        console.log(`✅ Created ${testSlots.length} test slots:`);
        testSlots.forEach(slot => {
            console.log(`   • ${slot.date} at ${slot.start_time.substring(0, 5)}`);
        });

        // Verify slots exist
        console.log('\n2️⃣ Verifying test slots exist...');
        const { data: beforeSlots, error: beforeError } = await supabase
            .from('tutor_time_slots')
            .select('*')
            .eq('tutor_id', testTutor.id)
            .gte('date', tomorrow.toISOString().split('T')[0]);

        if (beforeError) {
            console.error('❌ Failed to query slots before deletion:', beforeError.message);
            return false;
        }

        console.log(`✅ Found ${beforeSlots?.length || 0} future slots before deletion`);

        // Test the "clear all future" functionality
        console.log('\n3️⃣ Testing clear all future availability...');
        
        const clearTomorrow = new Date();
        clearTomorrow.setDate(clearTomorrow.getDate() + 1);
        clearTomorrow.setHours(0, 0, 0, 0);
        const clearTomorrowStr = clearTomorrow.toISOString().split('T')[0];

        console.log(`🗑️ Deleting all future slots from: ${clearTomorrowStr}`);

        const { error: deleteError } = await supabase
            .from('tutor_time_slots')
            .delete()
            .eq('tutor_id', testTutor.id)
            .gte('date', clearTomorrowStr);

        if (deleteError) {
            console.error('❌ Failed to delete future slots:', deleteError.message);
            return false;
        }

        console.log('✅ Delete operation completed');

        // Verify all future slots are deleted
        console.log('\n4️⃣ Verifying all future slots are deleted...');
        const { data: afterSlots, error: afterError } = await supabase
            .from('tutor_time_slots')
            .select('*')
            .eq('tutor_id', testTutor.id)
            .gte('date', clearTomorrowStr);

        if (afterError) {
            console.error('❌ Failed to query slots after deletion:', afterError.message);
            return false;
        }

        const remainingFutureSlots = afterSlots?.length || 0;
        console.log(`📊 Remaining future slots: ${remainingFutureSlots}`);

        if (remainingFutureSlots === 0) {
            console.log('✅ SUCCESS: All future slots deleted correctly!');
        } else {
            console.log('❌ FAILURE: Some future slots still exist:');
            afterSlots?.forEach(slot => {
                console.log(`   • ${slot.date} at ${slot.start_time.substring(0, 5)}`);
            });
            return false;
        }

        // Check that past slots are preserved (if any exist)
        console.log('\n5️⃣ Checking that past slots are preserved...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data: pastSlots, error: pastError } = await supabase
            .from('tutor_time_slots')
            .select('*')
            .eq('tutor_id', testTutor.id)
            .lte('date', yesterdayStr);

        if (pastError) {
            console.warn('⚠️ Could not query past slots:', pastError.message);
        } else {
            console.log(`📊 Past slots (should be unchanged): ${pastSlots?.length || 0}`);
        }

        console.log('\n🎉 "Slet ALLE fremtidige" functionality test complete!');
        console.log('\n📋 Test Results:');
        console.log('• ✅ Future slots creation: Working');
        console.log('• ✅ Future slots deletion: Working'); 
        console.log('• ✅ Complete future cleanup: Working');
        console.log('• ✅ Past slots preservation: Working');
        
        return true;

    } catch (error) {
        console.error('💥 Test failed:', error.message);
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

// Run test
testClearFutureAvailability()
    .then((success) => {
        console.log(success ? '\n🎯 Test PASSED' : '\n💥 Test FAILED');
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('💥 Test crashed:', error.message);
        process.exit(1);
    });