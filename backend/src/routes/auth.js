import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { validate, registerSchema, loginSchema } from '../utils/validation.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

// Register new user
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, full_name, user_type } = req.body;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          user_type,
        },
      },
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        error: 'Registration Failed',
        message: authError.message,
      });
    }

    // Create user record in public.users table
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      full_name,
      user_type,
      email_verified: false,
    });

    if (userError) {
      // Rollback: delete auth user if user creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        error: 'Registration Failed',
        message: 'Failed to create user profile',
      });
    }

    // Send welcome email and verification email
    await sendEmail({
      to: email,
      type: 'welcome',
      data: { name: full_name },
    });

    await sendEmail({
      to: email,
      type: 'verification',
      data: {
        name: full_name,
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${authData.session?.access_token || 'pending'}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          user_type,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Registration failed. Please try again.',
    });
  }
});

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: 'Invalid email or password',
      });
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      return res.status(403).json({
        success: false,
        error: 'Email Not Verified',
        message: 'Please verify your email address before logging in',
      });
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          user_type: authData.user.user_metadata?.user_type,
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Login failed. Please try again.',
    });
  }
});

// Password reset request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Email is required',
      });
    }

    // Request password reset from Supabase
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Send password reset email
    await sendEmail({
      to: email,
      type: 'password_reset',
      data: {
        resetLink: `${process.env.FRONTEND_URL}/reset-password`,
      },
    });

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process password reset request',
    });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Verification token is required',
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Verification Failed',
        message: 'Invalid or expired verification token',
      });
    }

    // Update user email_verified status
    await supabaseAdmin
      .from('users')
      .update({ email_verified: true })
      .eq('id', data.user.id);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Email verification failed',
    });
  }
});

export default router;



