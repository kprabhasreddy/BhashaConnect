import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

// Initialize Razorpay
let razorpay = null;

const initRazorpay = () => {
  // Skip Razorpay initialization if using placeholder/test values
  if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes('skip') &&
    !process.env.RAZORPAY_KEY_SECRET.includes('skip')
  ) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } else {
    console.log('⚠️  Razorpay not configured - payment features will be limited');
  }
};

initRazorpay();

/**
 * Create Razorpay order
 */
export const createOrder = async (amount, currency = 'INR', receipt = null) => {
  try {
    if (!razorpay) {
      // Return mock order for development when Razorpay not configured
      return {
        success: true,
        order: {
          id: `order_mock_${Date.now()}`,
          amount: Math.round(amount * 100),
          currency,
          receipt: receipt || `receipt_${Date.now()}`,
          status: 'created',
        },
        isMock: true,
      };
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    return generatedSignature === razorpaySignature;
  } catch (error) {
    console.error('Verify payment error:', error);
    return false;
  }
};

/**
 * Verify Razorpay webhook signature
 */
export const verifyWebhookSignature = (payload, signature) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Verify webhook signature error:', error);
    return false;
  }
};

/**
 * Initiate refund
 */
export const initiateRefund = async (paymentId, amount = null) => {
  try {
    if (!razorpay) {
      throw new Error('Razorpay not configured');
    }

    const options = {
      payment_id: paymentId,
    };

    if (amount) {
      options.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, options);
    return { success: true, refund };
  } catch (error) {
    console.error('Initiate refund error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    if (!razorpay) {
      throw new Error('Razorpay not configured');
    }

    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error('Get payment details error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate refund amount based on cancellation policy
 */
export const calculateRefundAmount = (totalAmount, sessionDateTime) => {
  const now = new Date();
  const hoursUntilSession = (sessionDateTime - now) / (1000 * 60 * 60);

  const { REFUND_POLICY } = require('../config/constants.js');

  if (hoursUntilSession > REFUND_POLICY.FULL_REFUND_HOURS) {
    // Full refund (> 24 hours)
    return { refundAmount: totalAmount, refundPercentage: 100 };
  } else if (hoursUntilSession > REFUND_POLICY.PARTIAL_REFUND_HOURS) {
    // 50% refund (12-24 hours)
    return { refundAmount: totalAmount * 0.5, refundPercentage: 50 };
  } else {
    // No refund (< 12 hours)
    return { refundAmount: 0, refundPercentage: 0 };
  }
};

