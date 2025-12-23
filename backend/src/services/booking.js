import { supabaseAdmin } from '../config/supabase.js';
import {
  MIN_BOOKING_ADVANCE_HOURS,
  MAX_BOOKING_DAYS_AHEAD,
  PLATFORM_COMMISSION_RATE,
  SESSION_DURATIONS,
} from '../config/constants.js';

/**
 * Check if a time slot is available for booking
 */
export const checkAvailability = async (tutorId, sessionDate, startTime, durationMinutes) => {
  try {
    // Get tutor profile
    const { data: tutorProfile } = await supabaseAdmin
      .from('tutor_profiles')
      .select('id, user_id')
      .eq('id', tutorId)
      .eq('status', 'active')
      .single();

    if (!tutorProfile) {
      return { available: false, reason: 'Tutor profile not found or inactive' };
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const date = new Date(sessionDate);
    const dayOfWeek = date.getDay();

    // Get tutor's availability for this day
    const { data: availability } = await supabaseAdmin
      .from('availability')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('day_of_week', dayOfWeek);

    if (!availability || availability.length === 0) {
      return { available: false, reason: 'Tutor not available on this day' };
    }

    // Parse start time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const sessionStart = new Date(date);
    sessionStart.setHours(startHour, startMinute, 0, 0);

    const sessionEnd = new Date(sessionStart);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + durationMinutes);

    // Check if time slot falls within any availability window
    const isWithinAvailability = availability.some((slot) => {
      const [slotStartHour, slotStartMin] = slot.start_time.split(':').map(Number);
      const [slotEndHour, slotEndMin] = slot.end_time.split(':').map(Number);

      const slotStart = new Date(date);
      slotStart.setHours(slotStartHour, slotStartMin, 0, 0);

      const slotEnd = new Date(date);
      slotEnd.setHours(slotEndHour, slotEndMin, 0, 0);

      return sessionStart >= slotStart && sessionEnd <= slotEnd;
    });

    if (!isWithinAvailability) {
      return { available: false, reason: 'Time slot not within tutor availability' };
    }

    // Check for conflicts with existing bookings
    const { data: conflicts } = await supabaseAdmin
      .from('bookings')
      .select('id, start_time, duration_minutes')
      .eq('tutor_id', tutorProfile.user_id)
      .eq('session_date', sessionDate)
      .in('status', ['pending_payment', 'confirmed']);

    if (conflicts && conflicts.length > 0) {
      const hasConflict = conflicts.some((booking) => {
        const [bookingStartHour, bookingStartMin] = booking.start_time.split(':').map(Number);
        const bookingStart = new Date(date);
        bookingStart.setHours(bookingStartHour, bookingStartMin, 0, 0);

        const bookingEnd = new Date(bookingStart);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.duration_minutes);

        // Check for overlap
        return (
          (sessionStart >= bookingStart && sessionStart < bookingEnd) ||
          (sessionEnd > bookingStart && sessionEnd <= bookingEnd) ||
          (sessionStart <= bookingStart && sessionEnd >= bookingEnd)
        );
      });

      if (hasConflict) {
        return { available: false, reason: 'Time slot already booked' };
      }
    }

    return { available: true };
  } catch (error) {
    console.error('Check availability error:', error);
    return { available: false, reason: 'Error checking availability' };
  }
};

/**
 * Validate booking time constraints
 */
export const validateBookingTime = (sessionDate, startTime) => {
  const now = new Date();
  const sessionDateTime = new Date(`${sessionDate}T${startTime}`);

  // Check minimum advance time
  const minAdvanceTime = new Date(now);
  minAdvanceTime.setHours(minAdvanceTime.getHours() + MIN_BOOKING_ADVANCE_HOURS);

  if (sessionDateTime < minAdvanceTime) {
    return {
      valid: false,
      reason: `Booking must be at least ${MIN_BOOKING_ADVANCE_HOURS} hours in advance`,
    };
  }

  // Check maximum days ahead
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_BOOKING_DAYS_AHEAD);

  if (sessionDateTime > maxDate) {
    return {
      valid: false,
      reason: `Booking cannot be more than ${MAX_BOOKING_DAYS_AHEAD} days in advance`,
    };
  }

  // Check if date is in the past
  if (sessionDateTime < now) {
    return { valid: false, reason: 'Cannot book sessions in the past' };
  }

  return { valid: true };
};

/**
 * Calculate booking amounts
 */
export const calculateBookingAmounts = (hourlyRate, durationMinutes) => {
  const totalAmount = (hourlyRate * durationMinutes) / 60;
  const platformFee = totalAmount * PLATFORM_COMMISSION_RATE;
  const tutorPayout = totalAmount - platformFee;

  return {
    total_amount: Math.round(totalAmount * 100) / 100, // Round to 2 decimals
    platform_fee: Math.round(platformFee * 100) / 100,
    tutor_payout: Math.round(tutorPayout * 100) / 100,
  };
};

/**
 * Auto-cancel unpaid bookings
 */
export const cancelUnpaidBookings = async () => {
  try {
    const timeoutMinutes = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '15');
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);

    // Find bookings that are still pending payment and past timeout
    const { data: unpaidBookings, error } = await supabaseAdmin
      .from('bookings')
      .select('id, student_id, tutor_id, total_amount')
      .eq('status', 'pending_payment')
      .eq('payment_status', 'pending')
      .lt('created_at', timeoutDate.toISOString());

    if (error) {
      console.error('Error fetching unpaid bookings:', error);
      return { cancelled: 0, error: error.message };
    }

    if (!unpaidBookings || unpaidBookings.length === 0) {
      return { cancelled: 0 };
    }

    // Cancel all unpaid bookings
    const bookingIds = unpaidBookings.map((b) => b.id);
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: 'Payment timeout',
        cancelled_at: new Date().toISOString(),
      })
      .in('id', bookingIds);

    if (updateError) {
      console.error('Error cancelling bookings:', updateError);
      return { cancelled: 0, error: updateError.message };
    }

    console.log(`Cancelled ${unpaidBookings.length} unpaid bookings`);
    return { cancelled: unpaidBookings.length };
  } catch (error) {
    console.error('Cancel unpaid bookings error:', error);
    return { cancelled: 0, error: error.message };
  }
};



