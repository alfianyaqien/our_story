/**
 * Integration Tests for Love Letters API
 * These tests verify the API routes work correctly with the database
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/love-letters/route';
import pool from '@/lib/database';
import { encrypt } from '@/lib/encryption';

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((name: string) => {
      if (name === 'session') {
        return {
          value: JSON.stringify({
            userId: 1,
            username: 'partner1',
            displayName: 'Partner 1',
          }),
        };
      }
      return null;
    }),
  })),
}));

// Mock database pool
jest.mock('@/lib/database', () => ({
  execute: jest.fn(),
}));

describe('Love Letters API - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/love-letters', () => {
    it('should return all letters for authenticated user', async () => {
      const mockLetters = [
        {
          id: 1,
          from_user_id: 1,
          to_user_id: 2,
          sender_name: 'Partner 1',
          receiver_name: 'Partner 2',
          subject: 'I Love You',
          encrypted_content: encrypt('You are amazing!'),
          created_at: '2024-01-01T12:00:00Z',
          is_read: false,
        },
      ];

      (pool.execute as jest.Mock).mockResolvedValue([mockLetters]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.letters).toHaveLength(1);
      expect(data.letters[0].subject).toBe('I Love You');
      expect(data.letters[0].content).toBe('You are amazing!');
    });

    it('should return 401 if not authenticated', async () => {
      const { cookies } = require('next/headers');
      cookies.mockReturnValue({
        get: jest.fn(() => null),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should handle database errors gracefully', async () => {
      (pool.execute as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch letters');
    });
  });

  describe('POST /api/love-letters', () => {
    it('should create a new love letter', async () => {
      const mockResult = {
        insertId: 5,
        affectedRows: 1,
      };

      (pool.execute as jest.Mock).mockResolvedValue([mockResult]);

      const request = new NextRequest('http://localhost:3000/api/love-letters', {
        method: 'POST',
        body: JSON.stringify({
          toUserId: 2,
          subject: 'Missing You',
          content: 'I cant wait to see you again!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.letterId).toBe(5);
    });

    it('should return 400 if required fields are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/love-letters', {
        method: 'POST',
        body: JSON.stringify({
          toUserId: 2,
          // Missing subject and content
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });
});
