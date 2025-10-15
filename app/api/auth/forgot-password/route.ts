import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, display_name, account_status FROM users WHERE email = ?',
      [email]
    );

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const user = users[0];

    // Check account status
    if (user.account_status !== 'active') {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    // Update user with reset token
    await pool.execute<ResultSetHeader>(
      `UPDATE users 
       SET reset_token = ?, 
           reset_token_expires = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [resetToken, resetExpires, user.id]
    );

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.display_name);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
