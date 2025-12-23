// Platform Configuration
export const PLATFORM_COMMISSION_RATE = parseFloat(
  process.env.PLATFORM_COMMISSION_RATE || '0.18'
);

// Booking Settings
export const MIN_BOOKING_ADVANCE_HOURS = parseInt(
  process.env.MIN_BOOKING_ADVANCE_HOURS || '2'
);
export const MAX_BOOKING_DAYS_AHEAD = parseInt(
  process.env.MAX_BOOKING_DAYS_AHEAD || '60'
);
export const PAYMENT_TIMEOUT_MINUTES = parseInt(
  process.env.PAYMENT_TIMEOUT_MINUTES || '15'
);

// Indian Languages List
export const INDIAN_LANGUAGES = [
  'Hindi',
  'Bengali',
  'Telugu',
  'Marathi',
  'Tamil',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Odia',
  'Assamese',
  'Urdu',
  'Sanskrit',
  'English',
  'Kashmiri',
  'Konkani',
  'Manipuri',
  'Nepali',
  'Sindhi',
  'Maithili',
  'Santali',
  'Bodo',
];

// User Types
export const USER_TYPES = {
  STUDENT: 'student',
  TUTOR: 'tutor',
  ADMIN: 'admin',
};

// Booking Statuses
export const BOOKING_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Tutor Profile Statuses
export const TUTOR_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
};

// Payment Statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Cancellation Refund Policy (hours before session)
export const REFUND_POLICY = {
  FULL_REFUND_HOURS: 24, // 100% refund if cancelled > 24 hours before
  PARTIAL_REFUND_HOURS: 12, // 50% refund if cancelled 12-24 hours before
  NO_REFUND_HOURS: 12, // 0% refund if cancelled < 12 hours before
};

// Session Durations (in minutes)
export const SESSION_DURATIONS = [30, 60, 90, 120];

// Minimum/Maximum Rates
export const MIN_HOURLY_RATE = 100; // ₹100
export const MAX_HOURLY_RATE = 5000; // ₹5000



