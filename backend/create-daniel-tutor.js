#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

/**
 * Create Daniel Elkjær as a tutor in both dev and prod environments
 * Email: daniel.elkjaer@cph.dk
 * Password: Mormor7594
 */

const tutorData = {
  email: 'daniel.elkjaer@cph.dk',
  password: 'Mormor7594',
  name: 'Daniel Elkjær',
  title: 'AI & Technology Consultant',
  specialty: 'AI Implementation & Digital Transformation',
  experience: 'Specialist i at hjælpe virksomheder med at implementere AI-løsninger og automatisere forretningsprocesser for øget produktivitet.',
  valueProp: 'Transformér jeres forretning med praktiske AI-løsninger der leverer målbare resultater inden for 30 dage.',
  phone: '+45 20 12 34 56', // Placeholder
  company: 'AI Rookie',
  department: 'Technology',
  basePrice: 125000, // 1250 DKK in øre for B2B
  price: 99500,      // 995 DKK in øre for B2C
  sessions: [
    {
      title: 'AI Strategy Workshop',
      description: 'Udvikl en skræddersyet AI-strategi for jeres virksomhed. Identificér de bedste muligheder for automation og AI-integration.',
      price: 125000, // 1250 DKK
    },
    {
      title: 'Automatisér kundeservice med AI',
      description: 'Implementér intelligente chatbots og AI-assistenter der kan håndtere 80% af kundehenvendelser automatisk.',
      price: 99500, // 995 DKK
    },
    {
      title: 'Data Analytics med AI',
      description: 'Lær at bruge AI til at analysere forretningsdata og træffe datadrevne beslutninger baseret på predictive analytics.',
      price: 89500, // 895 DKK
    },
    {
      title: 'Process Automation Bootcamp',
      description: 'Automatisér manuelle processer og workflows med AI-drevne værktøjer. Reducer arbejdsbyrden med op til 60%.',
      price: 79500, // 795 DKK
    }
  ]
};

async function createTutorInEnvironment(envType) {
  console.log(`\n🚀 Creating tutor in ${envType.toUpperCase()} environment...`);
  
  let supabaseUrl, supabaseServiceKey, databaseUrl;
  
  if (envType === 'development') {
    supabaseUrl = "https://kqayvowdlnlfaqonrudy.supabase.co";
    supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXl2b3dkbG5sZmFxb25ydWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDczMTQyMCwiZXhwIjoyMDcwMzA3NDIwfQ.yeJdbRqoFnE_AJBl2fVfy51yhhdKWeLe_fyWT8PYOA8";
    databaseUrl = "postgresql://postgres.kqayvowdlnlfaqonrudy:rZ6Afbu9A6QDY94L@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
  } else {
    supabaseUrl = "https://ycdhzwnjiarflruwavxi.supabase.co";
    supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZGh6d25qaWFyZmxydXdhdnhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcyOTUyNCwiZXhwIjoyMDcwMzA1NTI0fQ.tsffZflNBXR6fMGHJfp8AJhpnkDaIaRRukGd3HvFP68";
    databaseUrl = "postgres://postgres.ycdhzwnjiarflruwavxi:I4LOOja2DT9xfS8J@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
  }
  
  console.log(`Environment: ${envType}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Database: ${databaseUrl.substring(0, 30)}...`);
  
  // Initialize clients
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });
  
  try {
    // Step 1: Create user in Supabase Auth
    console.log('📧 Creating user in Supabase Auth...');
    let authData;
    const { data: initialAuthData, error: authError } = await supabase.auth.admin.createUser({
      email: tutorData.email,
      password: tutorData.password,
      email_confirm: true,
      user_metadata: {
        name: tutorData.name,
        phone: tutorData.phone,
        company: tutorData.company,
        department: tutorData.department,
        site_mode: 'B2B' // Default to B2B
      }
    });
    
    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('⚠️  User already exists in Supabase Auth, continuing with existing user...');
        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        const existingUser = users.find(u => u.email === tutorData.email);
        if (!existingUser) throw new Error('User exists but could not be found');
        // Create authData structure to match
        authData = { user: existingUser };
      } else {
        throw authError;
      }
    } else {
      console.log('✅ User created in Supabase Auth');
      authData = initialAuthData;
    }
    
    const userId = authData.user.id;
    console.log(`User ID: ${userId}`);
    
    // Step 2: Create/update user in database
    console.log('👤 Creating user profile in database...');
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        name: tutorData.name,
        phone: tutorData.phone,
        company: tutorData.company,
        department: tutorData.department,
        role: 'TUTOR',
        siteMode: 'B2B',
        emailVerified: true
      },
      create: {
        id: userId,
        email: tutorData.email,
        name: tutorData.name,
        phone: tutorData.phone,
        company: tutorData.company,
        department: tutorData.department,
        role: 'TUTOR',
        siteMode: 'B2B',
        emailVerified: true
      }
    });
    console.log('✅ User profile created/updated');
    
    // Step 3: Create tutor profile
    console.log('🎓 Creating tutor profile...');
    const tutor = await prisma.tutor.upsert({
      where: { userId: userId },
      update: {
        title: tutorData.title,
        specialty: tutorData.specialty,
        experience: tutorData.experience,
        valueProp: tutorData.valueProp,
        isActive: true
      },
      create: {
        userId: userId,
        title: tutorData.title,
        specialty: tutorData.specialty,
        experience: tutorData.experience,
        valueProp: tutorData.valueProp,
        isActive: true
      }
    });
    console.log('✅ Tutor profile created/updated');
    
    // Step 4: Create sessions
    console.log('📚 Creating tutor sessions...');
    
    // First, deactivate any existing sessions
    await prisma.session.updateMany({
      where: { tutorId: tutor.id },
      data: { isActive: false }
    });
    
    // Create new sessions
    for (const sessionData of tutorData.sessions) {
      await prisma.session.create({
        data: {
          tutorId: tutor.id,
          title: sessionData.title,
          description: sessionData.description,
          duration: 60, // 60 minutes standard
          price: (sessionData.price / 100).toString(), // Convert øre to DKK for Decimal field
          isActive: true
        }
      });
    }
    console.log(`✅ Created ${tutorData.sessions.length} sessions`);
    
        // Step 5: Generate time slots for next 14 days
    console.log('📅 Generating time slots...');
    const today = new Date();
    
    // Clear existing time slots
    await prisma.tutorTimeSlot.deleteMany({
      where: { tutorId: tutor.id }
    });
    
    // Generate new time slots
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (isWeekend) continue;
      
      // Generate time slots (9:00-17:00, excluding lunch 12:00-13:00)
      for (let hour = 9; hour < 17; hour++) {
        if (hour === 12) continue; // Skip lunch
        
        const startTime = new Date(1970, 0, 1, hour, 0, 0); // Use epoch date for time only
        const endTime = new Date(1970, 0, 1, hour + 1, 0, 0); // 1 hour slots
        
        await prisma.tutorTimeSlot.create({
          data: {
            tutorId: tutor.id,
            date: date,
            startTime: startTime,
            endTime: endTime
          }
        });
      }
    }
    console.log('✅ Time slots generated for next 14 days');
    
    console.log(`\n🎉 Successfully created tutor Daniel Elkjær in ${envType.toUpperCase()}!`);
    console.log(`📧 Email: ${tutorData.email}`);
    console.log(`🔑 Password: ${tutorData.password}`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`🎓 Tutor ID: ${tutor.id}`);
    
  } catch (error) {
    console.error(`❌ Error creating tutor in ${envType}:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🎯 Creating Daniel Elkjær tutor profile');
  console.log('📧 Email: daniel.elkjaer@cph.dk');
  console.log('🔑 Password: Mormor7594');
  
  try {
    // Create in development environment
    await createTutorInEnvironment('development');
    
    // Create in production environment
    await createTutorInEnvironment('production');
    
    console.log('\n🚀 Daniel Elkjær has been successfully created as a tutor in both DEV and PROD environments!');
    console.log('\n📋 Login Details:');
    console.log('   Email: daniel.elkjaer@cph.dk');
    console.log('   Password: Mormor7594');
    console.log('\n🌐 Environments:');
    console.log('   DEV: https://kqayvowdlnlfaqonrudy.supabase.co');
    console.log('   PROD: https://ycdhzwnjiarflruwavxi.supabase.co');
    
  } catch (error) {
    console.error('\n💥 Failed to create tutor:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createTutorInEnvironment, tutorData };
