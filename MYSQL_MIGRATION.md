# MySQL Migration Status

## ✅ Completed Steps

### 1. MySQL Setup
- ✅ Installed `mysql2` package (v3.15.2)
- ✅ Installed `dotenv` package for environment variables
- ✅ Created `.env.example` with MySQL configuration template
- ✅ Configured `.env` with your MySQL credentials (localhost:3307, admin user)
- ✅ Created connection pool (`lib/db-pool.ts`)
- ✅ Successfully tested MySQL connection

### 2. Database Schema
- ✅ Created complete MySQL schema (`database/schema.sql`)
- ✅ All 8 tables defined:
  - users
  - love_letters
  - notes
  - photos
  - letter_templates
  - travel_plans
  - recipes
  - wishlist
- ✅ Proper foreign keys with CASCADE on delete
- ✅ Indexes on frequently queried columns
- ✅ InnoDB engine with utf8mb4 charset

### 3. Database Initialization
- ✅ Created initialization script (`database/init.ts`)
- ✅ Successfully ran initialization
- ✅ Database `our_story` created
- ✅ All tables created successfully
- ✅ Initial users seeded (partner1/password1, partner2/password2)
- ✅ Letter templates seeded (3 templates)

### 4. Core Library Updates
- ✅ Updated `lib/database.ts` to use MySQL connection pool
- ✅ Added query helper function
- ✅ Added transaction helper function
- ✅ Updated `lib/auth.ts` to use async MySQL queries
- ✅ All auth functions now return Promises

### 5. API Routes - Partially Updated
- ✅ Updated `/api/auth/login` route for async authentication
- ⏳ Need to update remaining API routes (see below)

### 6. Documentation
- ✅ Created `database/setup-guide.md` with comprehensive setup instructions
- ✅ Created `database/test-connection.ts` for connection testing
- ✅ This migration status document

## ⏳ Remaining Tasks

### API Routes to Update (Priority Order)

All these routes need to be converted from SQLite synchronous queries to MySQL async queries:

#### Authentication Routes
- `/api/auth/logout/route.ts` - Simple, no DB queries
- `/api/auth/session/route.ts` - Needs getUserById update

#### Love Letters Routes
- `/api/love-letters/route.ts` - GET (list) and POST (create)
- `/api/love-letters/[id]/route.ts` - GET (single), PATCH (mark read), DELETE
- `/api/love-letters/sent/route.ts` - GET sent letters

#### Notes Routes
- `/api/notes/route.ts` - GET (list) and POST (create)
- `/api/notes/[id]/route.ts` - GET (single), PATCH (update), DELETE

#### Letter Templates Routes
- `/api/letter-templates/route.ts` - GET (list) and POST (create)
- `/api/letter-templates/[id]/route.ts` - GET (single), DELETE

#### Photos/Gallery Routes
- `/api/photos/route.ts` - GET (list) and POST (upload)
- `/api/photos/[id]/route.ts` - GET (single), PATCH (update caption), DELETE

#### Travel Plans Routes
- `/api/travel/route.ts` - GET (list) and POST (create)
- `/api/travel/[id]/route.ts` - GET (single), PATCH (update), DELETE

#### Recipes Routes
- `/api/recipes/route.ts` - GET (list) and POST (create)
- `/api/recipes/[id]/route.ts` - GET (single), PATCH (update/favorite), DELETE

#### Wishlist Routes
- `/api/wishlist/route.ts` - GET (list) and POST (create)
- `/api/wishlist/[id]/route.ts` - GET (single), PATCH (update), DELETE

### Conversion Pattern

Each route needs these changes:

**Before (SQLite):**
```typescript
const items = db.prepare('SELECT * FROM table WHERE user_id = ?').all(userId);
```

**After (MySQL):**
```typescript
const [rows] = await pool.execute<RowDataPacket[]>(
  'SELECT * FROM table WHERE user_id = ?',
  [userId]
);
const items = rows;
```

### Additional Tasks
- [ ] Update all database initialization calls in API routes
- [ ] Test each feature endpoint after conversion
- [ ] Update README.md with MySQL setup instructions
- [ ] Remove SQLite dependencies from package.json
- [ ] Delete old SQLite database file (our_story.db) if exists

## 🧪 Testing Checklist

After all routes are updated, test:

- [ ] Login/Logout functionality
- [ ] Create and view love letters
- [ ] Encrypt/decrypt letter content
- [ ] Mark letters as read
- [ ] Create/edit/delete notes
- [ ] Upload/view/delete photos
- [ ] Use letter templates with placeholders
- [ ] Create/manage travel plans
- [ ] Create/favorite/delete recipes
- [ ] Create/update/delete wishlist items
- [ ] Session persistence across page refreshes

## 🚀 Quick Start (Current State)

Your database is ready! To start the app:

```bash
# The database is already initialized and ready
npm run dev
```

Open http://localhost:3000 and login with:
- Username: `partner1` / Password: `password1`
- Username: `partner2` / Password: `password2`

**Note:** Most features won't work yet until the remaining API routes are converted to MySQL.

## 📝 Notes

- Your MySQL server is running on port **3307** (not the default 3306)
- Using user **admin** instead of root
- Database name: **our_story**
- Connection pool configured with max 10 connections
- All passwords are hashed with bcrypt (10 rounds)
- Love letter content is encrypted with AES (crypto-js)

## 🔧 Utility Commands

```bash
# Test MySQL connection
npx tsx database/test-connection.ts

# Re-initialize database (drops and recreates)
# Warning: This will delete all data!
npx tsx database/init.ts

# Connect to MySQL directly
mysql -u admin -p -P 3307 -D our_story

# View database tables
mysql -u admin -p -P 3307 -D our_story -e "SHOW TABLES;"
```

## Next Steps

1. **Immediate:** Update remaining API routes (start with simple ones like logout)
2. **Testing:** Test each feature as routes are converted
3. **Documentation:** Update main README.md with MySQL setup
4. **Cleanup:** Remove SQLite dependencies
5. **Production:** Consider adding database migrations for future schema changes
