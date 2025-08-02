const express = require('express');
const { databaseService } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/tutors - Get all tutors with their sessions
router.get('/', optionalAuth, async (req, res) => {
  try {
    const siteMode = req.header('x-site-mode') || 'B2B';
    
    const tutors = await databaseService.findMany('tutor', {
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
            duration: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    // Transform data based on site mode
    const transformedTutors = tutors.map(tutor => {
      const rawPrice = siteMode === 'B2C' ? tutor.price : tutor.basePrice;
      return {
        id: tutor.id,
        name: tutor.user.name,
        email: tutor.user.email,
        title: tutor.title,
        specialty: tutor.specialty,
        experience: tutor.experience,
        valueProp: tutor.valueProp,
        img: tutor.img,
        price: Number((rawPrice / 100).toFixed(2)),
        priceFormatted: (rawPrice / 100).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        basePrice: Number((tutor.basePrice / 100).toFixed(2)),
        basePriceFormatted: (tutor.basePrice / 100).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        sessions: tutor.sessions
      };
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
    const siteMode = req.header('x-site-mode') || 'B2B';

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
            duration: true
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

    const rawPrice = siteMode === 'B2C' ? tutor.price : tutor.basePrice;
    const transformedTutor = {
      id: tutor.id,
      name: tutor.user.name,
      email: tutor.user.email,
      title: tutor.title,
      specialty: tutor.specialty,
      experience: tutor.experience,
      valueProp: tutor.valueProp,
      img: tutor.img,
      price: Number((rawPrice / 100).toFixed(2)),
      priceFormatted: (rawPrice / 100).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      basePrice: Number((tutor.basePrice / 100).toFixed(2)),
      basePriceFormatted: (tutor.basePrice / 100).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sessions: tutor.sessions,
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