const express = require('express');
const { databaseService } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/tutors - Get all tutors with their sessions
router.get('/', optionalAuth, async (req, res) => {
  try {
    const prisma = databaseService.getPrismaClient();
    
    // Debug: Check users table first
    const users = await prisma.user.findMany({
      where: { role: 'TUTOR' }
    });
    console.log('TUTOR Users in database:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));
    
    // Debug: Check tutors table
    const tutorsRaw = await prisma.tutor.findMany();
    console.log('Tutors in database:', tutorsRaw.map(t => ({ id: t.id, userId: t.userId, title: t.title })));
    
    // Debug: Check tutor-user join
    const tutorsWithUsers = await prisma.tutor.findMany({
      include: {
        user: true
      }
    });
    console.log('Tutors with users:', tutorsWithUsers.map(t => ({ 
      tutorId: t.id, 
      title: t.title, 
      userId: t.userId,
      userName: t.user?.name,
      userEmail: t.user?.email 
    })));
    
    const tutors = await prisma.tutor.findMany({
      where: {
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        sessions: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            price: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    // Transform data
    const transformedTutors = tutors.map(tutor => {
      console.log('Raw tutor data:', JSON.stringify({
        id: tutor.id,
        user: tutor.user,
        title: tutor.title
      }, null, 2));
      
      const transformed = {
        id: tutor.id,
        name: tutor.user?.name || tutor.title || 'Unavngivet Tutor',
        email: tutor.user?.email || 'No email',
        title: tutor.title || 'No title',
        specialty: tutor.specialty,
        experience: tutor.experience,
        valueProp: tutor.valueProp,
        img: tutor.img,
        sessions: tutor.sessions.map(session => ({
          ...session,
          price: Number(session.price),
          priceFormatted: Number(session.price).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }))
      };
      
      console.log('Transformed tutor:', JSON.stringify(transformed, null, 2));
      return transformed;
    });

    res.json({
      success: true,
      data: transformedTutors
    });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tutors'
    });
  }
});

// GET /api/tutors/:id - Get specific tutor with detailed information
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const tutor = await databaseService.findUnique('tutor', {
      where: {
        id: id,
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        sessions: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            price: true
          }
        },
        availability: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          },
          take: 30 // Next 30 days
        }
      }
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found'
      });
    }

    const transformedTutor = {
      id: tutor.id,
      name: tutor.user.name,
      email: tutor.user.email,
      title: tutor.title,
      specialty: tutor.specialty,
      experience: tutor.experience,
      valueProp: tutor.valueProp,
      img: tutor.img,
      sessions: tutor.sessions.map(session => ({
        ...session,
        price: Number(session.price),
        priceFormatted: Number(session.price).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      })),
      availability: tutor.availability
    };

    res.json({
      success: true,
      data: transformedTutor
    });
  } catch (error) {
    console.error('Error fetching tutor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tutor'
    });
  }
});

module.exports = router;