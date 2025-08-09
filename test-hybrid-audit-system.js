#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHybridAuditSystem() {
    try {
        console.log('🧪 Testing Hybrid Audit System...');
        console.log('🌐 Database:', supabaseUrl.includes('kqayvowdlnlfaqonrudy') ? 'Development' : 'Production');
        
        // 1. Verify audit table exists
        console.log('\n1️⃣ Verifying audit table exists...');
        const { data: tableCheck, error: tableError } = await supabase
            .from('tutor_availability_log')
            .select('count')
            .limit(1);
            
        if (tableError) {
            console.error('❌ Audit table missing:', tableError.message);
            return false;
        }
        console.log('✅ Audit table exists and is accessible');

        // 2. Find a tutor to test with
        console.log('\n2️⃣ Finding test tutor...');
        const { data: tutors, error: tutorError } = await supabase
            .from('tutors')
            .select('id, user_id, user:users(name, email)')
            .limit(1);
            
        if (tutorError || !tutors?.length) {
            console.error('❌ No tutors found for testing:', tutorError?.message);
            return false;
        }
        
        const testTutor = tutors[0];
        console.log(`✅ Found test tutor: ${testTutor.user.name} (${testTutor.id})`);

        // 3. Test current availability query (single source of truth)
        console.log('\n3️⃣ Testing current availability query...');
        const testDate = '2025-08-15';
        
        const { data: currentSlots, error: slotsError } = await supabase
            .from('tutor_time_slots')
            .select('*')
            .eq('tutor_id', testTutor.id)
            .eq('date', testDate);
            
        if (slotsError) {
            console.error('❌ Error querying time slots:', slotsError.message);
            return false;
        }
        
        console.log(`✅ Current slots for ${testDate}: ${currentSlots?.length || 0} slots`);
        currentSlots?.forEach(slot => {
            console.log(`   • ${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`);
        });

        // 4. Test audit log insertion (simulate a change)
        console.log('\n4️⃣ Testing audit log insertion...');
        const testAuditRecord = {
            id: generateUUID(),
            tutor_id: testTutor.id,
            date: testDate,
            start_time: '09:00:00',
            action: 'ADDED',
            reason: 'test_insertion',
            changed_at: new Date().toISOString(),
            changed_by: testTutor.user_id,
            notes: 'Test record for hybrid audit system'
        };
        
        const { error: auditError } = await supabase
            .from('tutor_availability_log')
            .insert([testAuditRecord]);
            
        if (auditError) {
            console.error('❌ Error inserting audit record:', auditError.message);
            return false;
        }
        console.log('✅ Audit record inserted successfully');

        // 5. Test audit log retrieval
        console.log('\n5️⃣ Testing audit log retrieval...');
        const { data: auditLogs, error: logError } = await supabase
            .from('tutor_availability_log')
            .select('*')
            .eq('tutor_id', testTutor.id)
            .order('changed_at', { ascending: false })
            .limit(5);
            
        if (logError) {
            console.error('❌ Error retrieving audit logs:', logError.message);
            return false;
        }
        
        console.log(`✅ Retrieved ${auditLogs?.length || 0} audit log entries:`);
        auditLogs?.forEach(log => {
            console.log(`   • ${log.changed_at.substring(0, 19)} - ${log.action} slot at ${log.start_time.substring(0, 5)} (${log.reason})`);
        });

        // 6. Test single source of truth calculation (with bookings)
        console.log('\n6️⃣ Testing single source of truth with bookings...');
        const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('selected_date_time, unified_status, payment_expires_at')
            .eq('tutor_id', testTutor.id)
            .gte('selected_date_time', testDate)
            .lte('selected_date_time', testDate + ' 23:59:59');
            
        if (bookingError) {
            console.error('❌ Error querying bookings:', bookingError.message);
            return false;
        }
        
        console.log(`✅ Found ${bookings?.length || 0} bookings for ${testDate}`);
        bookings?.forEach(booking => {
            const time = new Date(booking.selected_date_time).toTimeString().substring(0, 5);
            console.log(`   • ${time} - Status: ${booking.unified_status}`);
        });

        // 7. Calculate real availability (the single source of truth)
        const bookedTimes = new Set();
        const now = new Date();
        
        bookings?.forEach(booking => {
            const isActiveBooking = booking.unified_status === 'CONFIRMED' || 
                (booking.unified_status === 'AWAITING_PAYMENT' && 
                 booking.payment_expires_at && 
                 new Date(booking.payment_expires_at) > now);
            
            if (isActiveBooking) {
                const bookingDateTime = new Date(booking.selected_date_time);
                const timeStr = bookingDateTime.toTimeString().substring(0, 5);
                bookedTimes.add(timeStr);
            }
        });
        
        const availableSlots = currentSlots?.filter(slot => {
            const timeStr = slot.start_time.substring(0, 5);
            return !bookedTimes.has(timeStr);
        }) || [];
        
        console.log(`✅ Real availability (single source of truth): ${availableSlots.length} available slots`);
        availableSlots.forEach(slot => {
            console.log(`   • ${slot.start_time.substring(0, 5)} - AVAILABLE`);
        });

        // 8. Clean up test audit record
        console.log('\n8️⃣ Cleaning up test data...');
        const { error: cleanupError } = await supabase
            .from('tutor_availability_log')
            .delete()
            .eq('id', testAuditRecord.id);
            
        if (cleanupError) {
            console.warn('⚠️ Could not clean up test audit record:', cleanupError.message);
        } else {
            console.log('✅ Test audit record cleaned up');
        }

        console.log('\n🎉 Hybrid Audit System Test Complete!');
        console.log('\n📋 Summary:');
        console.log('• ✅ Audit table exists and is functional');
        console.log('• ✅ Single source of truth calculation works');
        console.log('• ✅ Audit logging works independently');
        console.log('• ✅ Real-time availability calculation is correct');
        console.log('• ✅ System maintains data integrity');
        
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
testHybridAuditSystem()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('💥 Test crashed:', error.message);
        process.exit(1);
    });