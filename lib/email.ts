// Email service for sending verification and password reset emails
// Using Nodemailer - you can switch to SendGrid, AWS SES, or other providers

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
// For development, you can use Ethereal Email (fake SMTP service)
// For production, use real SMTP or email service
const createTransporter = () => {
  // Check if we have email configuration
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');

  if (!emailUser || !emailPass) {
    console.warn('⚠️  Email credentials not configured. Emails will be logged to console.');
    return null;
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      // No SMTP configured. In development this prints the message so the
      // verification/reset link is usable; in production it must not, because
      // the body carries single-use tokens and letter text straight into the
      // server log. Reporting failure there is also more honest than
      // returning true for an email that was never sent.
      if (process.env.NODE_ENV === 'production') {
        console.error(
          'Email not sent: SMTP is not configured (set EMAIL_USER and EMAIL_PASS).'
        );
        return false;
      }
      console.log('📧 Email (development mode):');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.text || options.html);
      return true;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string, displayName: string): Promise<boolean> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💝 Our Story</h1>
          <p>Welcome to our special place!</p>
        </div>
        <div class="content">
          <h2>Hi ${displayName}! 👋</h2>
          <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
          <p>Click the button below to verify your email:</p>
          <p style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Our Story. Made with ❤️</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✉️ Verify Your Email - Our Story',
    html,
    text: `Hi ${displayName}!\n\nPlease verify your email by clicking this link: ${verifyUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, displayName: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hi ${displayName},</h2>
          <p>We received a request to reset your password for your Our Story account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
          <div class="warning">
            <p><strong>⏰ This link will expire in 1 hour.</strong></p>
          </div>
          <p><strong>If you didn't request a password reset, please ignore this email.</strong> Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Our Story. Made with ❤️</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔑 Reset Your Password - Our Story',
    html,
    text: `Hi ${displayName},\n\nWe received a request to reset your password.\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`,
  });
}

export async function sendWelcomeEmail(email: string, displayName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome!</h1>
        </div>
        <div class="content">
          <h2>Hi ${displayName}! 👋</h2>
          <p>Your email has been verified successfully!</p>
          <p>You can now access all features of Our Story:</p>
          <ul>
            <li>📸 Photo Gallery</li>
            <li>🍽️ Culinary Plans</li>
            <li>✈️ Travel Plans</li>
            <li>💝 Love Letters</li>
            <li>📝 Notes & Wishlist</li>
          </ul>
          <p>Start creating beautiful memories together!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Our Story. Made with ❤️</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to Our Story!',
    html,
    text: `Hi ${displayName}!\n\nYour email has been verified successfully!\n\nYou can now access all features of Our Story.\n\nStart creating beautiful memories together!`,
  });
}
