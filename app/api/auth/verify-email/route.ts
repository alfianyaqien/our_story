import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { sendWelcomeEmail } from '@/lib/email';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying email with token:', token.substring(0, 10) + '...');

    // Find user with this token
    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT id, email, display_name, email_verified, verification_token_expires, account_status
       FROM users 
       WHERE verification_token = ?`,
      [token]
    );

    console.log('📊 Users found:', users.length);

    if (users.length === 0) {
      // Check if token exists but account_status is different
      const [allUsers] = await pool.execute<RowDataPacket[]>(
        `SELECT id, account_status, email_verified FROM users WHERE verification_token = ?`,
        [token]
      );
      
      if (allUsers.length > 0) {
        console.log('⚠️ Token found but account status:', allUsers[0].account_status);
      } else {
        // Check if user exists with this email and is already verified
        console.log('❌ Token not found in database - checking if already verified');
        const [verifiedUsers] = await pool.execute<RowDataPacket[]>(
          `SELECT id, email, email_verified FROM users WHERE email = ? AND email_verified = TRUE`,
          [token] // This won't match, but let's check by email in signup
        );
        
        if (verifiedUsers.length > 0) {
          console.log('✅ User already verified');
          return NextResponse.json(
            { error: 'This email has already been verified. Please log in.' },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired verification token. The link may have already been used.' },
        { status: 400 }
      );
    }

    const user = users[0];
    console.log('✅ User found:', { id: user.id, email: user.email, verified: user.email_verified, status: user.account_status });

    // Check account status
    if (user.account_status !== 'active') {
      console.log('❌ Account not active:', user.account_status);
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Check if token expired
    const now = new Date();
    const expires = new Date(user.verification_token_expires);
    if (now > expires) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Update user as verified
    await pool.execute<ResultSetHeader>(
      `UPDATE users 
       SET email_verified = TRUE, 
           verification_token = NULL, 
           verification_token_expires = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [user.id]
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.display_name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
