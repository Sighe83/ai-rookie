-- Seed data for AI Rookie

-- Insert sample tutors (you'll need to create corresponding auth users first)
-- This is just an example structure

-- Sample system settings
INSERT INTO public.system_settings (key, value) VALUES
  ('site_config', '{
    "company_name": "AI Rookie",
    "support_email": "support@airookie.dk",
    "default_session_duration": 60,
    "booking_advance_days": 30
  }'),
  ('payment_config', '{
    "currency": "DKK",
    "stripe_enabled": true,
    "payment_methods": ["card", "mobilepay"]
  }'),
  ('notification_config', '{
    "email_notifications": true,
    "booking_reminders": true,
    "reminder_hours": [24, 2]
  }');

-- Sample specialties for tutors
INSERT INTO public.system_settings (key, value) VALUES
  ('tutor_specialties', '[
    "Artificial Intelligence",
    "Machine Learning",
    "Data Science",
    "Python Programming",
    "JavaScript Development",
    "React Development",
    "Database Design",
    "Cloud Computing",
    "DevOps",
    "Cybersecurity"
  ]');

-- Sample session formats
INSERT INTO public.system_settings (key, value) VALUES
  ('session_formats', '{
    "INDIVIDUAL": {
      "name": "Individual Session",
      "description": "One-on-one tutoring session",
      "max_participants": 1
    },
    "TEAM": {
      "name": "Team Session",
      "description": "Small team training session",
      "max_participants": 5
    },
    "GROUP": {
      "name": "Group Session",
      "description": "Group learning session",
      "max_participants": 15
    },
    "PROGRAM": {
      "name": "Program Session",
      "description": "Structured learning program",
      "max_participants": 50
    }
  }');

-- Sample time slots configuration
INSERT INTO public.system_settings (key, value) VALUES
  ('default_time_slots', '[
    {"time": "09:00", "available": true, "booked": false},
    {"time": "10:00", "available": true, "booked": false},
    {"time": "11:00", "available": true, "booked": false},
    {"time": "13:00", "available": true, "booked": false},
    {"time": "14:00", "available": true, "booked": false},
    {"time": "15:00", "available": true, "booked": false},
    {"time": "16:00", "available": true, "booked": false}
  ]');

-- Note: To create sample tutors and users, you would need to:
-- 1. Create auth users via Supabase dashboard or API
-- 2. The trigger will automatically create corresponding user profiles
-- 3. Then create tutor profiles referencing those users

-- Example of how to create sample data (uncomment and modify with actual UUIDs):
/*
-- Assuming you have created auth users and have their UUIDs
INSERT INTO public.tutors (user_id, title, specialty, experience, value_prop, base_price, price, is_active) VALUES
  ('user-uuid-1', 'Senior AI Engineer', 'Artificial Intelligence', '5+ years in AI/ML development', 'Expert in production AI systems and best practices', 150000, 180000, true),
  ('user-uuid-2', 'Full Stack Developer', 'JavaScript Development', '3+ years in full-stack development', 'Specialized in React, Node.js and modern web technologies', 120000, 150000, true),
  ('user-uuid-3', 'Data Science Expert', 'Data Science', '4+ years in data science and analytics', 'Expert in Python, R, and machine learning algorithms', 140000, 170000, true);

-- Sample sessions for tutors
INSERT INTO public.sessions (tutor_id, title, description, duration, is_active) VALUES
  ('tutor-uuid-1', 'AI Fundamentals', 'Introduction to artificial intelligence concepts and applications', 90, true),
  ('tutor-uuid-1', 'Machine Learning Deep Dive', 'Advanced machine learning techniques and implementation', 120, true),
  ('tutor-uuid-2', 'React Masterclass', 'Complete React development from basics to advanced patterns', 180, true),
  ('tutor-uuid-2', 'Node.js Backend Development', 'Building scalable backend applications with Node.js', 150, true),
  ('tutor-uuid-3', 'Data Analysis with Python', 'Comprehensive data analysis using Python and pandas', 120, true),
  ('tutor-uuid-3', 'ML Model Deployment', 'Deploying machine learning models to production', 180, true);
*/