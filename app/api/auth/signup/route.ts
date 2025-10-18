import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, displayName } = await request.json();

    // Validation
    if (!username || !email || !password || !displayName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const [existingUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const [existingEmails] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    console.log('📧 Creating user with verification token:', {
      email,
      tokenPreview: verificationToken.substring(0, 10) + '...',
      expires: verificationExpires
    });

    // Insert new user
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (
        username, 
        email, 
        password, 
        display_name, 
        email_verified, 
        verification_token, 
        verification_token_expires,
        account_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        email,
        hashedPassword,
        displayName,
        false,
        verificationToken,
        verificationExpires,
        'active'
      ]
    );

    console.log('✅ User created with ID:', result.insertId);

    // Send verification email
    try {
      console.log('📧 Sending verification email to:', email);
      await sendVerificationEmail(email, verificationToken, displayName);
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail the signup if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      userId: result.insertId
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
