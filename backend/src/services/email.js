import nodemailer from 'nodemailer';
import { supabaseAdmin } from '../config/supabase.js';

// Email service configuration
// For MVP, using nodemailer with SMTP
// In production, consider using Resend, SendGrid, or Postmark

let transporter = null;

const initEmailService = () => {
  // Configure based on environment
  // For development, use Ethereal or similar test service
  // For production, configure with real SMTP credentials
  
  if (process.env.NODE_ENV === 'development') {
    // Use Ethereal for testing (creates test accounts)
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  } else {
    // Production SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
};

// Initialize on module load
initEmailService();

/**
 * Email templates
 */
const emailTemplates = {
  welcome: (data) => ({
    subject: 'Welcome to BhashaConnect!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #EA580C;">Welcome to BhashaConnect!</h1>
        <p>Hi ${data.name},</p>
        <p>Thank you for joining BhashaConnect! We're excited to help you on your language learning journey.</p>
        <p>Please verify your email address to get started.</p>
        <p>Best regards,<br>The BhashaConnect Team</p>
      </div>
    `,
    text: `Welcome to BhashaConnect! Hi ${data.name}, Thank you for joining! Please verify your email to get started.`,
  }),

  verification: (data) => ({
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #EA580C;">Verify Your Email</h1>
        <p>Hi ${data.name},</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="${data.verificationLink}" style="background-color: #EA580C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
    text: `Verify your email: ${data.verificationLink}`,
  }),

  password_reset: (data) => ({
    subject: 'Reset your password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #EA580C;">Reset Your Password</h1>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${data.resetLink}" style="background-color: #EA580C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    text: `Reset your password: ${data.resetLink}`,
  }),

  booking_confirmation: (data) => ({
    subject: `Booking Confirmed - ${data.tutorName} on ${data.sessionDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #EA580C;">Booking Confirmed!</h1>
        <p>Hi ${data.name},</p>
        <p>Your session with ${data.tutorName} has been confirmed.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Date:</strong> ${data.sessionDate}</p>
          <p><strong>Time:</strong> ${data.startTime}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Amount:</strong> ₹${data.amount}</p>
        </div>
        <p>We'll send you a reminder 24 hours before your session.</p>
      </div>
    `,
    text: `Booking confirmed with ${data.tutorName} on ${data.sessionDate} at ${data.startTime}`,
  }),

  // Add more templates as needed
};

/**
 * Send email
 */
export const sendEmail = async ({ to, type, data }) => {
  try {
    if (!transporter) {
      console.error('Email transporter not initialized');
      return { success: false, error: 'Email service not configured' };
    }

    const template = emailTemplates[type];
    if (!template) {
      console.error(`Email template not found: ${type}`);
      return { success: false, error: 'Email template not found' };
    }

    const emailContent = template(data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@bhashaconnect.com',
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log email to database
    await supabaseAdmin.from('email_logs').insert({
      recipient_email: to,
      email_type: type,
      status: 'sent',
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);

    // Log failed email
    await supabaseAdmin.from('email_logs').insert({
      recipient_email: to,
      email_type: type,
      status: 'failed',
      error_message: error.message,
    });

    return { success: false, error: error.message };
  }
};

export default { sendEmail };



