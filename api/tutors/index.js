import { dbHelpers } from '../config/supabase.js';
import { setCorsHeaders } from '../middleware/cors.js';

export default async function handler(req, res) {
  // Set CORS headers for all responses
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { 
      specialty, 
      siteMode = 'B2B',
      search,
      limit = 50,
      offset = 0
    } = req.query;

    // Build filters
    const filters = {};
    if (specialty) filters.specialty = specialty;
    if (siteMode) filters.siteMode = siteMode;

    // Get tutors from database
    let tutors = await dbHelpers.getTutors(filters);

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      tutors = tutors.filter(tutor => 
        tutor.title.toLowerCase().includes(searchLower) ||
        tutor.specialty.toLowerCase().includes(searchLower) ||
        tutor.user?.name.toLowerCase().includes(searchLower) ||
        tutor.value_prop?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTutors = tutors.slice(startIndex, endIndex);

    // Transform data for response
    const transformedTutors = paginatedTutors.map(tutor => ({
      id: tutor.id,
      userId: tutor.user_id,
      title: tutor.title,
      specialty: tutor.specialty,
      experience: tutor.experience,
      valueProp: tutor.value_prop,
      img: tutor.img,
      basePrice: tutor.base_price,
      price: tutor.price,
      isActive: tutor.is_active,
      user: tutor.user ? {
        name: tutor.user.name,
        email: tutor.user.email
      } : null,
      sessions: tutor.sessions || [],
      // Calculate average rating if reviews exist
      averageRating: tutor.reviews ? 
        tutor.reviews.reduce((sum, review) => sum + review.rating, 0) / tutor.reviews.length : 
        null,
      totalReviews: tutor.reviews ? tutor.reviews.length : 0
    }));

    res.status(200).json({
      success: true,
      data: transformedTutors,
      pagination: {
        total: tutors.length,
        offset: startIndex,
        limit: parseInt(limit),
        hasMore: endIndex < tutors.length
      }
    });

  } catch (error) {
    console.error('Get tutors error:', error);
    res.status(500).json({
      error: 'Failed to fetch tutors',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}