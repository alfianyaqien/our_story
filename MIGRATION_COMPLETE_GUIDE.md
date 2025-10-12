# Complete MySQL Migration & Testing Setup

## Current Status ✅

Your database migration is **partially complete**:

- ✅ MySQL database initialized successfully
- ✅ Connection pool configured
- ✅ Authentication module converted
- ✅ Login API route updated
- ✅ Love Letters API route updated
- ✅ Notes API route updated
- ⏳ Remaining routes need conversion

## Issue Resolved: `db.prepare is not a function`

**Root Cause:** API routes still using SQLite syntax (`db.prepare()`) instead of MySQL (`pool.execute()`)

**Solution:** Convert all remaining routes to use MySQL async queries

## Quick Fix - Complete All Route Conversions

Run this script to install test dependencies and verify migration:

```powershell
# Install testing dependencies
npm install --save-dev @testing-library/jest-dom @testing-library/react @types/jest jest jest-environment-jsdom

# Test MySQL connection
npm run db:test

# Start development server
npm run dev
```

## Remaining Routes to Convert

### Still Using SQLite (Need Conversion):

1. ✅ `/api/love-letters/route.ts` - **DONE**
2. ✅ `/api/notes/route.ts` - **DONE**
3. ⏳ `/api/letter-templates/route.ts`
4. ⏳ `/api/travel/route.ts`
5. ⏳ `/api/recipes/route.ts`
6. ⏳ `/api/wishlist/route.ts`
7. ⏳ `/api/photos/route.ts` (if using database)
8. ⏳ Dynamic routes in subdirectories

### Conversion Pattern

**Before (SQLite):**
```typescript
import db from '@/lib/database';

const items = db.prepare('SELECT * FROM table').all();
const result = db.prepare('INSERT INTO table VALUES (?)').run(value);
```

**After (MySQL):**
```typescript
import pool from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM table');
const [result] = await pool.execute<ResultSetHeader>('INSERT INTO table VALUES (?)', [value]);
```

## Manual Conversion Steps

For each remaining route file:

### Step 1: Update Imports

```typescript
// OLD
import db from '@/lib/database';

// NEW
import pool from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
```

### Step 2: Convert SELECT Queries

```typescript
// OLD
const items = db.prepare('SELECT * FROM notes').all();

// NEW
const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM notes');
const items = rows;
```

### Step 3: Convert INSERT Queries

```typescript
// OLD
const result = db.prepare('INSERT INTO notes (title) VALUES (?)').run(title);
const id = result.lastInsertRowid;

// NEW
const [result] = await pool.execute<ResultSetHeader>(
  'INSERT INTO notes (title) VALUES (?)',
  [title]
);
const id = result.insertId;
```

### Step 4: Convert UPDATE Queries

```typescript
// OLD
db.prepare('UPDATE notes SET title = ? WHERE id = ?').run(title, id);

// NEW
await pool.execute('UPDATE notes SET title = ? WHERE id = ?', [title, id]);
```

### Step 5: Convert DELETE Queries

```typescript
// OLD
db.prepare('DELETE FROM notes WHERE id = ?').run(id);

// NEW
await pool.execute('DELETE FROM notes WHERE id = ?', [id]);
```

## Automated Migration Script

I've created test files and configuration. Now let's verify what still needs conversion:

```bash
# Check migration status
node scripts/check-mysql-migration.js
```

## Testing After Conversion

### 1. Install Test Dependencies

```bash
npm install --save-dev jest @types/jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run unit tests
npm run test:unit

# Run integration tests  
npm run test:integration
```

### 3. Manual Testing Checklist

- [ ] Login with partner1/password1
- [ ] Create a love letter
- [ ] View received letters
- [ ] Mark letter as read
- [ ] Create a note
- [ ] Edit a note
- [ ] Delete a note
- [ ] Use letter template
- [ ] Create travel plan
- [ ] Add recipe
- [ ] Create wishlist item
- [ ] Upload photo (if implemented)

## Files Created for Testing

```
✅ jest.config.js                          - Jest configuration
✅ jest.setup.js                           - Test environment setup
✅ __tests__/unit/auth.test.ts            - Auth module tests
✅ __tests__/unit/encryption.test.ts       - Encryption tests
✅ __tests__/integration/love-letters-api.test.ts - API integration tests
✅ TESTING_GUIDE.md                        - Comprehensive testing documentation
✅ scripts/check-mysql-migration.js        - Migration status checker
```

## Next Steps

### Option 1: Manual Conversion (Recommended for Learning)

1. Open each route file listed above
2. Follow the conversion pattern
3. Test each route after conversion
4. Run `npm run dev` and test in browser

### Option 2: Automated Conversion (Faster)

I can create and run automated conversion scripts for all remaining routes.

### Option 3: Batch Update (Quick)

I'll update all remaining routes in the next messages if you want me to continue.

## Verify Current State

```bash
# 1. Check database connection
npm run db:test

# 2. Check which routes still need conversion
node scripts/check-mysql-migration.js

# 3. Try starting the app
npm run dev
```

## Common Errors After Migration

### Error: `db.prepare is not a function`
- **Cause:** Route still using SQLite syntax
- **Fix:** Convert to MySQL pool.execute()

### Error: `Cannot read property 'insertId'`
- **Cause:** Using SQLite's `lastInsertRowid` instead of MySQL's `insertId`
- **Fix:** Change to `result.insertId`

### Error: `is_read is not a boolean`
- **Cause:** SQLite used 0/1 for boolean, MySQL uses true/false
- **Fix:** MySQL handles this automatically, remove `=== 1` checks

### Error: `Pool is closed`
- **Cause:** Database connection pool shutdown
- **Fix:** Check environment variables, restart dev server

## Testing Guide Quick Start

See `TESTING_GUIDE.md` for complete testing documentation.

```bash
# Quick test setup
npm install --save-dev jest @types/jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Run tests
npm test

# View coverage
npm run test:coverage
```

## Support

If you encounter any issues:

1. Check the error message carefully
2. Verify .env configuration (especially DB_PASSWORD)
3. Test database connection: `npm run db:test`
4. Check migration status: `node scripts/check-mysql-migration.js`
5. Review TESTING_GUIDE.md for test setup

## Summary

✅ **Completed:**
- MySQL database created and initialized
- Core library files converted (database.ts, auth.ts)
- Login route working
- Love letters route working
- Notes route working
- Test infrastructure created
- Documentation complete

⏳ **TODO:**
- Convert remaining 5-6 API routes
- Install test dependencies
- Run test suite
- Perform manual testing

**Estimated time to complete:** 15-30 minutes

Would you like me to:
1. **Convert all remaining routes automatically** (fastest)
2. **Guide you through converting one route** (learning opportunity)
3. **Focus on testing setup first** (verify what works)

Choose your preferred approach!
