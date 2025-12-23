import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
  .optional();

// Registration validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  user_type: z.enum(['student', 'tutor']),
});

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Profile update validation
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: phoneSchema,
});

// Tutor profile validation
export const tutorProfileSchema = z.object({
  languages: z
    .array(z.string())
    .min(1, 'Select at least one language')
    .max(10, 'Maximum 10 languages allowed'),
  hourly_rate: z
    .number()
    .int()
    .min(100, 'Minimum rate is ₹100')
    .max(5000, 'Maximum rate is ₹5000'),
  experience_years: z.number().int().min(0).max(50),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(500),
  education: z.string().max(200).optional(),
  certifications: z.array(z.string()).optional(),
});

// Availability validation
export const availabilitySchema = z.array(
  z.object({
    day_of_week: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
    start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
    end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  })
);

// Booking validation
export const bookingSchema = z.object({
  tutor_id: z.string().uuid(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  duration_minutes: z.enum(['30', '60', '90', '120']).transform(Number),
  notes: z.string().max(500).optional(),
});

// Review validation
export const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// Message validation
export const messageSchema = z.object({
  booking_id: z.string().uuid(),
  message: z.string().min(1, 'Message cannot be empty').max(1000),
});

/**
 * Validate request body against schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};



