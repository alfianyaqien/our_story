# Testing Guide for "Our Story" Application

## Overview
This guide covers the testing strategy, setup, and execution for the "Our Story" application.

## Test Structure

```
__tests__/
├── unit/                    # Unit tests for individual modules
│   ├── auth.test.ts        # Authentication logic tests
│   ├── encryption.test.ts  # Encryption/decryption tests
│   └── database.test.ts    # Database utility tests
├── integration/             # Integration tests for APIs
│   ├── love-letters-api.test.ts
│   ├── notes-api.test.ts
│   ├── auth-api.test.ts
│   └── ...
└── e2e/                     # End-to-end tests (future)
    └── user-flows.test.ts
```

## Installation

### 1. Install Test Dependencies

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/react @types/jest jest jest-environment-jsdom
```

### 2. Verify Package.json Scripts

Your `package.json` should have these test scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:api": "jest --testPathPattern=api"
  }
}
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Only Unit Tests
```bash
npm run test:unit
```

### Run Only Integration Tests
```bash
npm run test:integration
```

### Run with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test auth.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="authentication"
```

## Test Types

### 1. Unit Tests

**Purpose:** Test individual functions and modules in isolation

**Location:** `__tests__/unit/`

**Examples:**
- Authentication functions (login, getUserById)
- Encryption/decryption functions
- Utility helpers
- Data transformations

**Run:**
```bash
npm run test:unit
```

### 2. Integration Tests

**Purpose:** Test API routes and database interactions

**Location:** `__tests__/integration/`

**Examples:**
- API endpoints with mocked database
- Complete request/response cycles
- Error handling scenarios
- Authentication flows

**Run:**
```bash
npm run test:integration
```

### 3. E2E Tests (Future)

**Purpose:** Test complete user workflows in a browser

**Tools:** Playwright or Cypress

**Examples:**
- User login flow
- Creating a love letter end-to-end
- Photo upload and gallery
- Complete user journey

## Coverage Goals

The application aims for:
- **70% code coverage** minimum
- **80% for critical paths** (auth, encryption, database)
- **90% for business logic** (love letters, notes)

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Writing Tests

### Unit Test Example

```typescript
// __tests__/unit/auth.test.ts
import { authenticateUser } from '@/lib/auth';

describe('authenticateUser', () => {
  it('should return user when credentials are valid', async () => {
    const user = await authenticateUser('partner1', 'password1');
    expect(user).toBeDefined();
    expect(user?.username).toBe('partner1');
  });

  it('should return null for invalid password', async () => {
    const user = await authenticateUser('partner1', 'wrongpassword');
    expect(user).toBeNull();
  });
});
```

### Integration Test Example

```typescript
// __tests__/integration/notes-api.test.ts
import { GET, POST } from '@/app/api/notes/route';

describe('Notes API', () => {
  it('should create a new note', async () => {
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

## Test Database Setup

### Option 1: Use Test Database

Create a separate MySQL database for testing:

```sql
CREATE DATABASE our_story_test;
```

Update `.env.test`:
```env
DB_NAME=our_story_test
```

### Option 2: Mock Database (Recommended)

Use Jest mocks to avoid hitting real database:

```typescript
jest.mock('@/lib/database', () => ({
  execute: jest.fn(),
}));
```

## Best Practices

### 1. Test Naming Convention

```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should do something when condition', () => {
      // test
    });
  });
});
```

### 2. AAA Pattern

```typescript
it('should create user', async () => {
  // Arrange
  const userData = { username: 'test', password: 'pass' };
  
  // Act
  const result = await createUser(userData);
  
  // Assert
  expect(result).toBeDefined();
  expect(result.username).toBe('test');
});
```

### 3. Mock External Dependencies

```typescript
// Mock database
jest.mock('@/lib/database');

// Mock Next.js cookies
jest.mock('next/headers');

// Mock file system
jest.mock('fs');
```

### 4. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await pool.end(); // Close database connections
});
```

### 5. Test Edge Cases

Always test:
- ✅ Happy path (normal operation)
- ✅ Error cases (database errors, network issues)
- ✅ Validation (missing fields, invalid input)
- ✅ Edge cases (empty strings, null values, very long inputs)
- ✅ Security (SQL injection, XSS attempts)

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Debugging Tests

### Run Single Test in Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.ts
```

### Use console.log

```typescript
it('should work', () => {
  console.log('Debug value:', someValue);
  expect(someValue).toBe(expected);
});
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal"
}
```

## Common Issues & Solutions

### Issue: Tests Timeout

```typescript
// Increase timeout for slow tests
jest.setTimeout(10000); // 10 seconds
```

### Issue: Module Not Found

```bash
# Clear Jest cache
npx jest --clearCache
```

### Issue: Async Tests Not Waiting

```typescript
// Always use async/await or return promise
it('should wait', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

## Test Coverage Report

After running `npm run test:coverage`, you'll see:

```
-----------------|---------|----------|---------|---------|
File             | % Stmts | % Branch | % Funcs | % Lines |
-----------------|---------|----------|---------|---------|
All files        |   75.5  |   68.2   |   80.1  |   76.3  |
 lib/auth.ts     |   85.0  |   75.0   |   90.0  |   86.0  |
 lib/database.ts |   70.0  |   60.0   |   75.0  |   71.0  |
 lib/encryption.ts|  95.0  |   90.0   |  100.0  |   96.0  |
-----------------|---------|----------|---------|---------|
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [MySQL Testing Best Practices](https://dev.mysql.com/doc/)

## Quick Command Reference

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Specific file
npm test auth.test

# Update snapshots
npm test -- -u

# Verbose output
npm test -- --verbose

# Clear cache
npx jest --clearCache
```

## Next Steps

1. **Install test dependencies** (see Installation section)
2. **Run existing tests** to verify setup
3. **Write tests for new features** before implementing
4. **Maintain coverage** above 70%
5. **Review coverage reports** regularly
6. **Add E2E tests** for critical user flows

---

**Remember:** Good tests are:
- Fast
- Isolated
- Repeatable
- Self-validating
- Timely (written before or with the code)
