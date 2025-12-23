import express from 'express';
import { authenticate, requireVerified, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { validate, bookingSchema } from '../utils/validation.js';
import {
  checkAvailability,
  validateBookingTime,
  calculateBookingAmounts,
} from '../services/booking.js';
import { BOOKING_STATUS } from '../config/constants.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(requireVerified);

// Create booking (students only)
router.post('/', requireRole('student'), validate(bookingSchema), async (req, res) => {
  try {
    const { tutor_id, session_date, start_time, duration_minutes, notes } = req.body;

    // Get tutor profile to get hourly rate
    const { data: tutorProfile, error: tutorError } = await supabaseAdmin
      .from('tutor_profiles')
      .select('id, user_id, hourly_rate, status')
      .eq('id', tutor_id)
      .single();

    if (tutorError || !tutorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Tutor profile not found',
      });
    }

    if (tutorProfile.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Request',
        message: 'Tutor profile is not active',
      });
    }

    // Validate booking time constraints
    const timeValidation = validateBookingTime(session_date, start_time);
    if (!timeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: timeValidation.reason,
      });
    }

    // Check availability
    const availability = await checkAvailability(
      tutor_id,
      session_date,
      start_time,
      duration_minutes
    );

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        error: 'Not Available',
        message: availability.reason,
      });
    }

    // Calculate amounts
    const amounts = calculateBookingAmounts(tutorProfile.hourly_rate, duration_minutes);

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        student_id: req.userId,
        tutor_id: tutorProfile.user_id,
        session_date,
        start_time,
        duration_minutes,
        status: BOOKING_STATUS.PENDING_PAYMENT,
        total_amount: amounts.total_amount,
        platform_fee: amounts.platform_fee,
        tutor_payout: amounts.tutor_payout,
        payment_status: 'pending',
        notes: notes || null,
      })
      .select()
      .single();

    if (bookingError) {
      return res.status(400).json({
        success: false,
        error: 'Creation Failed',
        message: bookingError.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created. Please complete payment.',
      data: booking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create booking',
    });
  }
});

// Get bookings (students see their bookings, tutors see bookings for them)
router.get('/', async (req, res) => {
  try {
    const { status, upcoming, past } = req.query;

    // Get user type to determine which bookings to show
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('user_type')
      .eq('id', req.userId)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        student:student_id (
          id,
          full_name,
          profile_picture_url
        ),
        tutor:tutor_id (
          id,
          full_name,
          profile_picture_url
        )
      `);

    // Filter by user type
    if (user.user_type === 'student') {
      query = query.eq('student_id', req.userId);
    } else if (user.user_type === 'tutor') {
      query = query.eq('tutor_id', req.userId);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (upcoming === 'true') {
      query = query.gte('session_date', new Date().toISOString().split('T')[0]);
      query = query.eq('status', BOOKING_STATUS.CONFIRMED);
    }

    if (past === 'true') {
      query = query.or(
        `session_date.lt.${new Date().toISOString().split('T')[0]},status.eq.${BOOKING_STATUS.COMPLETED}`
      );
    }

    // Order by session date
    query = query.order('session_date', { ascending: true });
    query = query.order('start_time', { ascending: true });

    const { data: bookings, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database Error',
        message: 'Failed to fetch bookings',
      });
    }

    res.json({
      success: true,
      data: bookings || [],
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch bookings',
    });
  }
});

// Cancel booking
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    // Get booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Check authorization
    if (booking.student_id !== req.userId && booking.tutor_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to cancel this booking',
      });
    }

    // Check if booking can be cancelled
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Request',
        message: 'Booking already cancelled',
      });
    }

    if (booking.status === BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Request',
        message: 'Cannot cancel completed booking',
      });
    }

    // TODO: Calculate refund and process refund (Week 6)
    // For now, just cancel the booking
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: BOOKING_STATUS.CANCELLED,
        cancellation_reason: reason || 'Cancelled by user',
        cancelled_by: req.userId,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: 'Update Failed',
        message: updateError.message,
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to cancel booking',
    });
  }
});

// Complete booking (tutors only)
router.post('/:bookingId/complete', requireRole('tutor'), async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Get booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Check authorization
    if (booking.tutor_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to complete this booking',
      });
    }

    // Check if booking can be completed
    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Request',
        message: 'Only confirmed bookings can be marked as complete',
      });
    }

    // Check if session time has passed
    const sessionDateTime = new Date(`${booking.session_date}T${booking.start_time}`);
    if (sessionDateTime > new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Request',
        message: 'Cannot complete booking before session time',
      });
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: BOOKING_STATUS.COMPLETED,
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: 'Update Failed',
        message: updateError.message,
      });
    }

    // Update tutor's total sessions
    const { data: tutorProfile } = await supabaseAdmin
      .from('tutor_profiles')
      .select('total_sessions')
      .eq('user_id', req.userId)
      .single();

    if (tutorProfile) {
      await supabaseAdmin
        .from('tutor_profiles')
        .update({
          total_sessions: (tutorProfile.total_sessions || 0) + 1,
        })
        .eq('user_id', req.userId);
    }

    // TODO: Send review request email (Week 6)

    res.json({
      success: true,
      message: 'Booking marked as complete',
      data: updatedBooking,
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to complete booking',
    });
  }
});

export default router;

