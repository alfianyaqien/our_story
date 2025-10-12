/**
 * Unit Tests for Authentication Module
 */

import { authenticateUser, getUserById, getAllUsers } from '@/lib/auth';
import pool from '@/lib/database';
import bcrypt from 'bcryptjs';

// Mock the database pool
jest.mock('@/lib/database', () => ({
  execute: jest.fn(),
}));

describe('Authentication Module - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should return user object when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        display_name: 'Test User',
        password: hashedPassword,
      };

      (pool.execute as jest.Mock).mockResolvedValue([[mockUser]]);

      const result = await authenticateUser('testuser', 'password123');

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        password: hashedPassword,
      });
      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = ?',
        ['testuser']
      );
    });

    it('should return null when user is not found', async () => {
      (pool.execute as jest.Mock).mockResolvedValue([[]]);

      const result = await authenticateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        display_name: 'Test User',
        password: hashedPassword,
      };

      (pool.execute as jest.Mock).mockResolvedValue([[mockUser]]);

      const result = await authenticateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      (pool.execute as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await authenticateUser('testuser', 'password123');

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user object when user exists', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        display_name: 'Test User',
        password: 'hashedpassword',
      };

      (pool.execute as jest.Mock).mockResolvedValue([[mockUser]]);

      const result = await getUserById(1);

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        password: 'hashedpassword',
      });
      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [1]
      );
    });

    it('should return null when user is not found', async () => {
      (pool.execute as jest.Mock).mockResolvedValue([[]]);

      const result = await getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return array of all users', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'partner1',
          display_name: 'Partner 1',
          password: 'hash1',
        },
        {
          id: 2,
          username: 'partner2',
          display_name: 'Partner 2',
          password: 'hash2',
        },
      ];

      (pool.execute as jest.Mock).mockResolvedValue([mockUsers]);

      const result = await getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        username: 'partner1',
        displayName: 'Partner 1',
        password: 'hash1',
      });
    });

    it('should return empty array when no users exist', async () => {
      (pool.execute as jest.Mock).mockResolvedValue([[]]);

      const result = await getAllUsers();

      expect(result).toEqual([]);
    });
  });
});
