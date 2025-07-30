import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!id) {
      return res.status(400).json({ error: 'Tutor ID is required' });
    }

    // Get tutor with all related data
    const { data: tutor, error } = await supabase
      .from('tutors')
      .select(`
        *,
        user:users(id, name, email),
        sessions(
          id,
          title,
          description,
          duration,
          is_active
        ),
        availability:tutor_availability(
          date,
          time_slots
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Get tutor error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Tutor not found' });
      }
      throw error;
    }

    // Transform availability data
    const availability = tutor.availability?.map(avail => ({
      date: avail.date,
      timeSlots: typeof avail.time_slots === 'string' ? 
        JSON.parse(avail.time_slots) : 
        avail.time_slots
    })) || [];

    // Transform response data
    const transformedTutor = {
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
        id: tutor.user.id,
        name: tutor.user.name,
        email: tutor.user.email
      } : null,
      sessions: tutor.sessions?.filter(session => session.is_active) || [],
      availability: availability,
      // Add metadata
      createdAt: tutor.created_at,
      updatedAt: tutor.updated_at
    };

    res.status(200).json({
      success: true,
      data: transformedTutor
    });

  } catch (error) {
    console.error('Get tutor by ID error:', error);
    res.status(500).json({
      error: 'Failed to fetch tutor',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}