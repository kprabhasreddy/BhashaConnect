import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, requireVerified, requireRole } from '../middleware/auth.js';
import { validate, tutorProfileSchema, availabilitySchema } from '../utils/validation.js';
import { INDIAN_LANGUAGES, TUTOR_STATUS } from '../config/constants.js';

const router = express.Router();

// Get all tutors (public endpoint)
router.get('/', async (req, res) => {
  try {
    // TODO: Implement filters, search, sort, pagination
    const { data: tutors, error } = await supabaseAdmin
      .from('tutor_profiles')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email,
          profile_picture_url
        )
      `)
      .eq('status', TUTOR_STATUS.ACTIVE)
      .order('avg_rating', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database Error',
        message: 'Failed to fetch tutors',
      });
    }

    res.json({
      success: true,
      data: tutors,
    });
  } catch (error) {
    console.error('Get tutors error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch tutors',
    });
  }
});

// Get single tutor profile (public endpoint)
router.get('/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;

    const { data: tutor, error } = await supabaseAdmin
      .from('tutor_profiles')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email,
          profile_picture_url,
          created_at
        )
      `)
      .eq('id', tutorId)
      .eq('status', TUTOR_STATUS.ACTIVE)
      .single();

    if (error || !tutor) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Tutor profile not found',
      });
    }

    // Get availability
    const { data: availability } = await supabaseAdmin
      .from('availability')
      .select('*')
      .eq('tutor_id', tutorId);

    res.json({
      success: true,
      data: {
        ...tutor,
        availability: availability || [],
      },
    });
  } catch (error) {
    console.error('Get tutor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch tutor profile',
    });
  }
});

// Create tutor profile (requires tutor role and verification)
router.post('/profile', authenticate, requireVerified, requireRole('tutor'), validate(tutorProfileSchema), async (req, res) => {
  try {
    // Check if profile already exists
    const { data: existing } = await supabaseAdmin
      .from('tutor_profiles')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Profile Exists',
        message: 'Tutor profile already exists. Use PATCH to update.',
      });
    }

    // Validate languages
    const invalidLanguages = req.body.languages.filter(
      (lang) => !INDIAN_LANGUAGES.includes(lang)
    );
    if (invalidLanguages.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Invalid languages: ${invalidLanguages.join(', ')}`,
      });
    }

    // Create tutor profile
    const { data: profile, error } = await supabaseAdmin
      .from('tutor_profiles')
      .insert({
        user_id: req.userId,
        languages: req.body.languages,
        hourly_rate: req.body.hourly_rate,
        experience_years: req.body.experience_years,
        bio: req.body.bio,
        education: req.body.education,
        certifications: req.body.certifications || [],
        status: TUTOR_STATUS.PENDING,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Creation Failed',
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tutor profile created successfully. Pending admin approval.',
      data: profile,
    });
  } catch (error) {
    console.error('Create tutor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create tutor profile',
    });
  }
});

// Update tutor profile
router.patch('/profile', authenticate, requireVerified, requireRole('tutor'), validate(tutorProfileSchema), async (req, res) => {
  try {
    const updates = {};
    if (req.body.languages) updates.languages = req.body.languages;
    if (req.body.hourly_rate) updates.hourly_rate = req.body.hourly_rate;
    if (req.body.experience_years) updates.experience_years = req.body.experience_years;
    if (req.body.bio) updates.bio = req.body.bio;
    if (req.body.education !== undefined) updates.education = req.body.education;
    if (req.body.certifications) updates.certifications = req.body.certifications;

    const { data: profile, error } = await supabaseAdmin
      .from('tutor_profiles')
      .update(updates)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Update Failed',
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Update tutor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update tutor profile',
    });
  }
});

// Set availability
router.post('/availability', authenticate, requireVerified, requireRole('tutor'), validate(availabilitySchema), async (req, res) => {
  try {
    // Get tutor profile ID
    const { data: profile } = await supabaseAdmin
      .from('tutor_profiles')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Tutor profile not found',
      });
    }

    // Delete existing availability
    await supabaseAdmin.from('availability').delete().eq('tutor_id', profile.id);

    // Insert new availability
    const availabilityData = req.body.map((slot) => ({
      tutor_id: profile.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
    }));

    const { data: availability, error } = await supabaseAdmin
      .from('availability')
      .insert(availabilityData)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Update Failed',
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: availability,
    });
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update availability',
    });
  }
});

export default router;



