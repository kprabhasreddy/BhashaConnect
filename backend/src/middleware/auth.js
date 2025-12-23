import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware to authenticate requests using Supabase JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Get user's role from database
      const { data: userData, error } = await supabaseAdmin
        .from('users')
        .select('user_type')
        .eq('id', req.userId)
        .single();

      if (error || !userData) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Unable to verify user role',
        });
      }

      if (!allowedRoles.includes(userData.user_type)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
      }

      req.userRole = userData.user_type;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to verify permissions',
      });
    }
  };
};

/**
 * Middleware to check if user is verified
 */
export const requireVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if email is verified
    if (!req.user.email_confirmed_at) {
      return res.status(403).json({
        success: false,
        error: 'Email Not Verified',
        message: 'Please verify your email address before proceeding',
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to verify email status',
    });
  }
};



