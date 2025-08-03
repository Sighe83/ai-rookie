// Debug script to test session deletion
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dfovfdluhrdmrhtubomt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmb3ZmZGx1aHJkbXJodHVib210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjk5NDEsImV4cCI6MjA2OTQwNTk0MX0.pHMloRnImKF8MqQjAJgk6NfGV5PkECJq83_j8ZX3m80'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Add this to your browser console when you're logged in as a tutor
window.debugSessionDeletion = async () => {
  console.log('🐛 Starting session deletion debug...')
  
  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    if (!user) {
      console.error('❌ No user logged in')
      return
    }
    
    console.log('✅ User authenticated:', user.email)
    
    // 2. Get tutor data
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select('id, user_id')
      .eq('user_id', user.id)
      .single()
    
    if (tutorError) {
      console.error('❌ Tutor error:', tutorError)
      return
    }
    
    console.log('✅ Tutor found:', tutorData)
    
    // 3. Get tutor's sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, title, tutor_id, is_active')
      .eq('tutor_id', tutorData.id)
      .eq('is_active', true)
    
    if (sessionsError) {
      console.error('❌ Sessions error:', sessionsError)
      return
    }
    
    console.log('✅ Sessions found:', sessions.length)
    sessions.forEach(session => {
      console.log(`  - ${session.title} (ID: ${session.id})`)
    })
    
    // 4. Test deletion on first session (if any)
    if (sessions.length > 0) {
      const testSession = sessions[0]
      console.log(`🧪 Testing deletion of: ${testSession.title}`)
      
      const { data, error } = await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('id', testSession.id)
        .eq('tutor_id', tutorData.id)
        .select()
      
      if (error) {
        console.error('❌ Deletion failed:', error)
      } else {
        console.log('✅ Deletion successful:', data)
        
        // Revert the change
        await supabase
          .from('sessions')
          .update({ is_active: true })
          .eq('id', testSession.id)
          .eq('tutor_id', tutorData.id)
        
        console.log('↩️ Reverted change')
      }
    } else {
      console.log('⚠️ No sessions to test deletion with')
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

console.log('🐛 Debug script loaded. Run window.debugSessionDeletion() in console when logged in as tutor.')
