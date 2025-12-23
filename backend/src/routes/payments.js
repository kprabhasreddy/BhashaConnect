import express from 'express';
import { authenticate, requireVerified } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { createOrder, verifyPayment, verifyWebhookSignature, initiateRefund } from '../services/payment.js';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

// All routes require authentication (except webhook)
router.use((req, res, next) => {
  if (req.path === '/webhook') {
    return next(); // Webhook doesn't need auth
  }
  authenticate(req, res, next);
});

// Create Razorpay order
router.post('/create-order', requireVerified, async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Booking ID is required',
      });
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('student_id', req.userId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Request',
        message: 'Booking is not in pending payment status',
      });
    }

    // Create Razorpay order
    const orderResult = await createOrder(
      booking.total_amount,
      'INR',
      `booking_${booking.id}`
    );

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Payment Error',
        message: 'Failed to create payment order',
      });
    }

    // Save order ID to payments table
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: booking.id,
        razorpay_order_id: orderResult.order.id,
        amount: booking.total_amount,
        status: PAYMENT_STATUS.PENDING,
      })
      .select()
      .single();

    if (paymentError) {
      return res.status(500).json({
        success: false,
        error: 'Database Error',
        message: 'Failed to save payment record',
      });
    }

    // Check if this is a mock order (Razorpay not configured)
    if (orderResult.isMock) {
      return res.json({
        success: true,
        message: 'Mock payment order created (Razorpay not configured)',
        data: {
          order_id: orderResult.order.id,
          amount: orderResult.order.amount / 100,
          currency: orderResult.order.currency,
          key_id: 'rzp_test_mock',
          isMock: true,
        },
      });
    }

    res.json({
      success: true,
      data: {
        order_id: orderResult.order.id,
        amount: orderResult.order.amount / 100, // Convert from paise
        currency: orderResult.order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create payment order',
    });
  }
});

// Verify payment
router.post('/verify', requireVerified, async (req, res) => {
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'All payment fields are required',
      });
    }

    // Verify signature
    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Verification Failed',
        message: 'Invalid payment signature',
      });
    }

    // Get booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('student_id', req.userId)
      .single();

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: PAYMENT_STATUS.CAPTURED,
        paid_at: new Date().toISOString(),
      })
      .eq('booking_id', booking_id);

    // Update booking status
    await supabaseAdmin
      .from('bookings')
      .update({
        status: BOOKING_STATUS.CONFIRMED,
        payment_status: PAYMENT_STATUS.CAPTURED,
      })
      .eq('id', booking_id);

    // Get updated booking with tutor info
    const { data: updatedBooking } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        tutor:tutor_id (
          id,
          full_name
        )
      `)
      .eq('id', booking_id)
      .single();

    // Send confirmation emails
    const { data: student } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('id', req.userId)
      .single();

    if (student) {
      await sendEmail({
        to: student.email,
        type: 'booking_confirmation',
        data: {
          name: student.full_name,
          tutorName: updatedBooking.tutor.full_name,
          sessionDate: booking.session_date,
          startTime: booking.start_time,
          duration: booking.duration_minutes,
          amount: booking.total_amount,
        },
      });
    }

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      data: updatedBooking,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to verify payment',
    });
  }
});

// Razorpay webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.parse(req.body.toString());

    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Signature',
        message: 'Webhook signature verification failed',
      });
    }

    const event = payload.event;

    // Handle payment.captured event
    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;

      // Find payment record
      const { data: paymentRecord } = await supabaseAdmin
        .from('payments')
        .select('booking_id')
        .eq('razorpay_order_id', orderId)
        .single();

      if (paymentRecord) {
        // Update payment status
        await supabaseAdmin
          .from('payments')
          .update({
            razorpay_payment_id: payment.id,
            status: PAYMENT_STATUS.CAPTURED,
            paid_at: new Date(payment.created_at * 1000).toISOString(),
          })
          .eq('booking_id', paymentRecord.booking_id);

        // Update booking status
        await supabaseAdmin
          .from('bookings')
          .update({
            status: BOOKING_STATUS.CONFIRMED,
            payment_status: PAYMENT_STATUS.CAPTURED,
          })
          .eq('id', paymentRecord.booking_id);
      }
    }

    // Handle payment.failed event
    if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;

      // Find payment record
      const { data: paymentRecord } = await supabaseAdmin
        .from('payments')
        .select('booking_id')
        .eq('razorpay_order_id', orderId)
        .single();

      if (paymentRecord) {
        // Update payment status
        await supabaseAdmin
          .from('payments')
          .update({
            status: PAYMENT_STATUS.FAILED,
          })
          .eq('booking_id', paymentRecord.booking_id);
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Webhook processing failed',
    });
  }
});

export default router;

