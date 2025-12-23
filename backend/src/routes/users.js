import express from 'express';
import { authenticate, requireVerified } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { validate, profileUpdateSchema } from '../utils/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User profile not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch profile',
    });
  }
});

// Update user profile
router.patch('/me', validate(profileUpdateSchema), async (req, res) => {
  try {
    const updates = {};
    if (req.body.full_name) updates.full_name = req.body.full_name;
    if (req.body.phone) updates.phone = req.body.phone;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Update Failed',
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update profile',
    });
  }
});

// Upload profile picture (placeholder - implement file upload service)
router.post('/me/profile-picture', requireVerified, async (req, res) => {
  try {
    // TODO: Implement file upload to Supabase Storage
    res.status(501).json({
      success: false,
      error: 'Not Implemented',
      message: 'Profile picture upload will be implemented in next iteration',
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to upload profile picture',
    });
  }
});

export default router;



