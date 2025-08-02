const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const SessionService = require('../services/sessionService');

const prisma = new PrismaClient();

const tutorsData = [
  {
    email: 'mette.jensen@airookie.dk',
    name: 'Mette Jensen',
    title: 'Marketing Director & AI‑praktiker',
    specialty: 'AI for Marketing & Kommunikation',
    experience: 'Forstår travle professionelles behov for hurtig, relevant læring.',
    valueProp: 'Øg jeres marketing‑output med 10× uden ekstra headcount.',
    basePrice: 85000, // 850 kr in øre
    price: 69500, // 695 kr for B2C
    sessions: [
      {
        title: 'Skaler content‑produktionen med AI',
        description: 'Strømliner jeres SoMe & kampagner gennem smart prompt‑design og værktøjer.',
      },
      {
        title: 'Datadrevet kampagneoptimering',
        description: 'Lær at bruge AI til at analysere kampagnedata og justere i realtid.',
      },
      {
        title: 'Få ideer til SoMe-opslag på minutter',
        description: 'Lær at bruge AI til at brainstorme og skabe indhold til sociale medier, der fanger opmærksomhed.',
      },
      {
        title: 'Skriv bedre marketingtekster med AI',
        description: 'Optimer dine nyhedsbreve, annoncer og webtekster ved hjælp af en AI-assistent.',
      },
    ]
  },
  {
    email: 'lars.petersen@airookie.dk',
    name: 'Lars Petersen',
    title: 'Sales VP & Workflow‑Optimist',
    specialty: 'Effektivitets‑boost i salgsorganisationer',
    experience: 'Specialist i at omsætte AI til målbare salgsresultater.',
    valueProp: 'Forkort salgscyklussen med gennemsnitligt 32 %.',
    basePrice: 99500, // 995 kr in øre
    price: 95000, // 950 kr for B2C
    sessions: [
      {
        title: 'Lead‑research på autopilot',
        description: 'Automatisér indsamling & kvalificering af leads med AI‑drevne pipelines.',
      },
      {
        title: 'AI‑assist til salgs‑mails',
        description: 'Personaliser salgs‑kommunikation i skala — uden at miste det menneskelige touch.',
      },
      {
        title: 'Automatiser research af nye leads',
        description: 'Spar timer på at finde og kvalificere potentielle kunder med AI-drevne værktøjer.',
      },
    ]
  },
  {
    email: 'anna.kristensen@airookie.dk',
    name: 'Anna Kristensen',
    title: 'Operations Manager & Automation Expert',
    specialty: 'Proces‑optimering & AI‑workflows',
    experience: 'Hjælper ledere med at integrere AI i teams og processer.',
    valueProp: 'Reducer manuelle processer med op til 60% gennem intelligent automatisering.',
    basePrice: 92500, // 925 kr in øre
    price: 47500, // 475 kr for B2C
    sessions: [
      {
        title: 'Automatisér dokumenthåndtering',
        description: 'Implementér AI‑baserede systemer til at behandle og kategorisere dokumenter.',
      },
      {
        title: 'Intelligent kvalitetskontrol',
        description: 'Opsæt AI‑drevne kontroller der fanger fejl før de når kunden.',
      },
    ]
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@airookie.dk' },
      update: {},
      create: {
        email: 'admin@airookie.dk',
        name: 'Admin User',
        role: 'ADMIN',
        password: hashedPassword,
        emailVerified: true
      }
    });

    console.log('✅ Created admin user');

    // Create tutors
    for (const tutorData of tutorsData) {
      const { sessions, ...tutorInfo } = tutorData;
      
      // Create user for tutor
      const tutorUser = await prisma.user.upsert({
        where: { email: tutorInfo.email },
        update: {},
        create: {
          email: tutorInfo.email,
          name: tutorInfo.name,
          role: 'TUTOR',
          emailVerified: true
        }
      });

      // Create tutor profile
      const tutor = await prisma.tutor.upsert({
        where: { userId: tutorUser.id },
        update: {
          title: tutorInfo.title,
          specialty: tutorInfo.specialty,
          experience: tutorInfo.experience,
          valueProp: tutorInfo.valueProp,
          basePrice: tutorInfo.basePrice,
          price: tutorInfo.price,
        },
        create: {
          userId: tutorUser.id,
          title: tutorInfo.title,
          specialty: tutorInfo.specialty,
          experience: tutorInfo.experience,
          valueProp: tutorInfo.valueProp,
          basePrice: tutorInfo.basePrice,
          price: tutorInfo.price,
        }
      });

      // Create sessions for tutor with enforced 60-minute duration
      for (const sessionData of sessions) {
        await prisma.session.create({
          data: {
            tutorId: tutor.id,
            title: sessionData.title,
            description: sessionData.description,
            duration: SessionService.SESSION_DURATION_MINUTES, // Always 60 minutes
          }
        });
      }

      console.log(`✅ Created tutor: ${tutorInfo.name}`);
    }

    // Generate availability for next 14 days for each tutor
    const tutors = await prisma.tutor.findMany();
    const today = new Date();
    
    for (const tutor of tutors) {
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Skip weekends for some tutors
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        if (isWeekend && parseInt(tutor.id) % 3 !== 0) continue;
        
        // Generate time slots using SessionService
        const availableSlots = SessionService.generateTimeSlots(date, [12]); // Exclude lunch hour
        
        // Apply tutor-specific availability patterns
        const timeSlots = availableSlots.filter((slot, index) => {
          // Use seeded randomness for consistent availability
          const seed = parseInt(tutor.id) * 1000 + i * 100 + slot.dateTime.getHours();
          const isAvailable = ((seed * 9301 + 49297) % 233280) / 233280 > 0.3;
          return isAvailable;
        }).map(slot => ({
          time: slot.time,
          available: slot.available,
          booked: slot.booked
        }));
        
        if (timeSlots.length > 0) {
          await prisma.tutorAvailability.upsert({
            where: {
              tutorId_date: {
                tutorId: tutor.id,
                date: date
              }
            },
            update: {
              timeSlots: JSON.stringify(timeSlots)
            },
            create: {
              tutorId: tutor.id,
              date: date,
              timeSlots: JSON.stringify(timeSlots)
            }
          });
        }
      }
      
      console.log(`✅ Generated availability for: ${tutor.id}`);
    }

    console.log('🎉 Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedDatabase;