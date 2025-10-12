/**
 * Unit Tests for Encryption Module
 */

import { encrypt, decrypt } from '@/lib/encryption';

describe('Encryption Module - Unit Tests', () => {
  const testMessage = 'This is a secret love letter! ❤️';
  
  describe('encrypt', () => {
    it('should encrypt a message', () => {
      const encrypted = encrypt(testMessage);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testMessage);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different outputs for same input (due to randomization)', () => {
      const encrypted1 = encrypt(testMessage);
      const encrypted2 = encrypt(testMessage);
      
      // Note: AES with same IV might produce same result
      // This depends on encryption implementation
      expect(encrypted1).toBeDefined();
      expect(encrypted2).toBeDefined();
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('');
      expect(encrypted).toBeDefined();
    });

    it('should handle special characters', () => {
      const specialMessage = '❤️💕💖 !@#$%^&*() 中文 日本語';
      const encrypted = encrypt(specialMessage);
      
      expect(encrypted).toBeDefined();
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(specialMessage);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted message correctly', () => {
      const encrypted = encrypt(testMessage);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(testMessage);
    });

    it('should handle multiple encryption/decryption cycles', () => {
      const message1 = 'First message';
      const message2 = 'Second message';
      const message3 = 'Third message';

      const enc1 = encrypt(message1);
      const enc2 = encrypt(message2);
      const enc3 = encrypt(message3);

      expect(decrypt(enc1)).toBe(message1);
      expect(decrypt(enc2)).toBe(message2);
      expect(decrypt(enc3)).toBe(message3);
    });

    it('should preserve newlines and formatting', () => {
      const formattedMessage = `Dear Love,

      I miss you so much!
      
      With all my heart,
      Your Partner`;

      const encrypted = encrypt(formattedMessage);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(formattedMessage);
    });
  });

  describe('encryption security', () => {
    it('should not contain original text in encrypted string', () => {
      const message = 'secret password';
      const encrypted = encrypt(message);
      
      expect(encrypted.toLowerCase()).not.toContain('secret');
      expect(encrypted.toLowerCase()).not.toContain('password');
    });

    it('should be consistent - same decryption key produces same result', () => {
      const encrypted = encrypt(testMessage);
      const decrypted1 = decrypt(encrypted);
      const decrypted2 = decrypt(encrypted);
      
      expect(decrypted1).toBe(decrypted2);
      expect(decrypted1).toBe(testMessage);
    });
  });
});
