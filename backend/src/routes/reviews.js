import express from 'express';
import { authenticate, requireVerified, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { validate, reviewSchema } from '../utils/validation.js';
import { canReviewBooking, calculateNewRating } from '../services/review.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

// Submit review (students only)
router.post('/', authenticate, requireVerified, requireRole('student'), validate(reviewSchema), async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    // Check if student can review this booking
    const reviewCheck = await canReviewBooking(booking_id, req.userId);

    if (!reviewCheck.canReview) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Request',
        message: reviewCheck.reason,
      });
    }

    // Get booking details
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('tutor_id, tutor:tutor_id(id)')
      .eq('id', booking_id)
      .single();

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Get tutor profile ID
    const { data: tutorProfile } = await supabaseAdmin
      .from('tutor_profiles')
      .select('id')
      .eq('user_id', booking.tutor_id)
      .single();

    if (!tutorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Tutor profile not found',
      });
    }

    // Create review
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .insert({
        booking_id,
        student_id: req.userId,
        tutor_id: booking.tutor_id,
        rating,
        comment: comment || null,
      })
      .select()
      .single();

    if (reviewError) {
      return res.status(400).json({
        success: false,
        error: 'Creation Failed',
        message: reviewError.message,
      });
    }

    // Calculate and update tutor rating
    const ratingResult = await calculateNewRating(tutorProfile.id, rating);

    if (!ratingResult.success) {
      console.error('Failed to update tutor rating:', ratingResult.error);
      // Don't fail the review creation, just log the error
    }

    // Send notification email to tutor
    const { data: tutor } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', booking.tutor_id)
      .single();

    if (tutor) {
      const { data: student } = await supabaseAdmin
        .from('users')
        .select('full_name')
        .eq('id', req.userId)
        .single();

      await sendEmail({
        to: tutor.email,
        type: 'new_review',
        data: {
          tutorName: tutor.full_name,
          studentName: student?.full_name || 'A student',
          rating,
          comment: comment || 'No comment provided',
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to submit review',
    });
  }
});

// Get reviews for a tutor (public)
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get tutor profile to get user_id
    const { data: tutorProfile } = await supabaseAdmin
      .from('tutor_profiles')
      .select('user_id')
      .eq('id', tutorId)
      .single();

    if (!tutorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Tutor profile not found',
      });
    }

    // Get reviews
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        student:student_id (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('tutor_id', tutorProfile.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database Error',
        message: 'Failed to fetch reviews',
      });
    }

    // Get total count
    const { count } = await supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorProfile.user_id);

    res.json({
      success: true,
      data: reviews || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch reviews',
    });
  }
});

export default router;

