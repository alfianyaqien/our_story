// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '3307'
process.env.DB_USER = 'admin'
process.env.DB_PASSWORD = 'test_password'
process.env.DB_NAME = 'our_story_test'
process.env.SESSION_SECRET = 'test-secret-key'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters'
