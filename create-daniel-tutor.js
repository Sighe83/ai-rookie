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
  
  // Load environment-specific configuration
  const envFile = envType === 'development' ? '.env.development' : '.env.production';
  require('dotenv').config({ path: envFile });
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
    throw new Error(`Missing required environment variables for ${envType}`);
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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
        authData.user = existingUser;
      } else {
        throw authError;
      }
    } else {
      console.log('✅ User created in Supabase Auth');
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
        basePrice: tutorData.basePrice,
        price: tutorData.price,
        isActive: true
      },
      create: {
        userId: userId,
        title: tutorData.title,
        specialty: tutorData.specialty,
        experience: tutorData.experience,
        valueProp: tutorData.valueProp,
        basePrice: tutorData.basePrice,
        price: tutorData.price,
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
          price: sessionData.price,
          isActive: true
        }
      });
    }
    console.log(`✅ Created ${tutorData.sessions.length} sessions`);
    
    // Step 5: Generate availability for next 14 days
    console.log('📅 Generating availability...');
    const today = new Date();
    
    // Clear existing availability
    await prisma.tutorAvailability.deleteMany({
      where: { tutorId: tutor.id }
    });
    
    // Generate new availability
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (isWeekend) continue;
      
      // Generate time slots (9:00-17:00, excluding lunch 12:00-13:00)
      const timeSlots = [];
      for (let hour = 9; hour < 17; hour++) {
        if (hour === 12) continue; // Skip lunch
        
        const time = `${hour.toString().padStart(2, '0')}:00`;
        timeSlots.push({
          time: time,
          status: 'available'
        });
      }
      
      await prisma.tutorAvailability.create({
        data: {
          tutorId: tutor.id,
          date: date,
          timeSlots: JSON.stringify(timeSlots)
        }
      });
    }
    console.log('✅ Availability generated for next 14 days');
    
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
