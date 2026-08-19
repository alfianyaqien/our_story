import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { authenticateUser } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';
import pool from '@/lib/database';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { name: 'login', limit: 10, windowSeconds: 300 });
    if (limited) return limited;

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const result = await authenticateUser(username, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = result.user!;

    // Update last login
    await pool.execute<ResultSetHeader>(
      'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Signed session cookie - see lib/session.ts
    await setSessionCookie({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        displayName: user.displayName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
