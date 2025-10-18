import pool from './database';
import bcrypt from 'bcryptjs';
import { User } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  display_name: string;
  password: string;
  email: string | null;
  email_verified: boolean;
  account_status: 'active' | 'inactive' | 'suspended';
  failed_login_attempts: number;
  locked_until: Date | null;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export async function authenticateUser(username: string, password: string): Promise<AuthResult> {
  try {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    
    if (rows.length === 0) {
      return { success: false, error: 'Invalid credentials' };
    }

    const user = rows[0];

    // Check if account is suspended
    if (user.account_status === 'suspended') {
      return { success: false, error: 'Account has been suspended. Please contact support.' };
    }

    if (user.account_status === 'inactive') {
      return { success: false, error: 'Account is inactive. Please contact support.' };
    }

    // Check if account is locked
    if (user.locked_until) {
      const now = new Date();
      const lockedUntil = new Date(user.locked_until);
      if (now < lockedUntil) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        return { 
          success: false, 
          error: `Account is locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).` 
        };
      } else {
        // Unlock account if lock period has passed
        await pool.execute<ResultSetHeader>(
          'UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?',
          [user.id]
        );
      }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      // Increment failed login attempts
      const newAttempts = user.failed_login_attempts + 1;
      
      if (newAttempts >= 5) {
        // Lock account for 15 minutes after 5 failed attempts
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 15);
        
        await pool.execute<ResultSetHeader>(
          'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
          [newAttempts, lockUntil, user.id]
        );
        
        return { 
          success: false, 
          error: 'Too many failed login attempts. Account locked for 15 minutes.' 
        };
      } else {
        await pool.execute<ResultSetHeader>(
          'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
          [newAttempts, user.id]
        );
        
        return { 
          success: false, 
          error: `Invalid credentials. ${5 - newAttempts} attempt(s) remaining.` 
        };
      }
    }

    // Check if email is verified (optional - you can make this strict)
    if (!user.email_verified && user.email) {
      return { 
        success: false, 
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.' 
      };
    }

    // Reset failed login attempts on successful login
    if (user.failed_login_attempts > 0) {
      await pool.execute<ResultSetHeader>(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
        [user.id]
      );
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email || undefined,
        password: user.password
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'An error occurred during authentication' };
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      password: user.password
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const [rows] = await pool.execute<UserRow[]>('SELECT * FROM users');
    
    return rows.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      password: user.password
    }));
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
}
