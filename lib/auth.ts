import pool from './database';
import bcrypt from 'bcryptjs';
import { User } from '@/types';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  display_name: string;
  password: string;
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      password: user.password
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
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
