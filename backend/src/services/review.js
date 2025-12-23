import { supabaseAdmin } from '../config/supabase.js';

/**
 * Calculate new average rating after a review
 */
export const calculateNewRating = async (tutorId, newRating) => {
  try {
    // Get current tutor profile
    const { data: tutorProfile } = await supabaseAdmin
      .from('tutor_profiles')
      .select('avg_rating, total_reviews')
      .eq('id', tutorId)
      .single();

    if (!tutorProfile) {
      throw new Error('Tutor profile not found');
    }

    const currentRating = parseFloat(tutorProfile.avg_rating) || 0;
    const currentReviews = tutorProfile.total_reviews || 0;

    // Calculate new average
    const newAverage =
      (currentRating * currentReviews + newRating) / (currentReviews + 1);

    // Round to 2 decimal places
    const newAvgRating = Math.round(newAverage * 100) / 100;

    // Update tutor profile
    const { error } = await supabaseAdmin
      .from('tutor_profiles')
      .update({
        avg_rating: newAvgRating,
        total_reviews: currentReviews + 1,
      })
      .eq('id', tutorId);

    if (error) {
      throw error;
    }

    return { success: true, newAvgRating, totalReviews: currentReviews + 1 };
  } catch (error) {
    console.error('Calculate rating error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if student can review a booking
 */
export const canReviewBooking = async (bookingId, studentId) => {
  try {
    // Get booking details
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, student_id, status')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return { canReview: false, reason: 'Booking not found' };
    }

    if (booking.student_id !== studentId) {
      return { canReview: false, reason: 'Not authorized to review this booking' };
    }

    if (booking.status !== 'completed') {
      return { canReview: false, reason: 'Can only review completed bookings' };
    }

    // Check if review already exists
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingReview) {
      return { canReview: false, reason: 'Review already submitted' };
    }

    // Check if booking was completed more than 30 days ago
    const { data: bookingDetails } = await supabaseAdmin
      .from('bookings')
      .select('updated_at')
      .eq('id', bookingId)
      .single();

    if (bookingDetails) {
      const completedDate = new Date(bookingDetails.updated_at);
      const daysSinceCompletion = (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceCompletion > 30) {
        return { canReview: false, reason: 'Review period expired (30 days)' };
      }
    }

    return { canReview: true };
  } catch (error) {
    console.error('Can review booking error:', error);
    return { canReview: false, reason: 'Error checking review eligibility' };
  }
};



