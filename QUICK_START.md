# 🚀 Quick Start Guide

## ✅ Current Status: READY TO USE!

Your "Our Story" application is fully migrated to MySQL and ready to run!

## Instant Start (3 Steps)

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Open Your Browser
Navigate to: **http://localhost:3000**

### 3. Login
Use either account:
- Username: `partner1` | Password: `password1`
- Username: `partner2` | Password: `password2`

## What's Working

✅ **Login/Authentication** - Secure session-based auth
✅ **Love Letters** - Write encrypted letters to each other
✅ **Shared Notes** - Collaborative note-taking
✅ **Letter Templates** - Pre-made templates with placeholders
✅ **Travel Planner** - Plan trips together
✅ **Recipe Book** - Save favorite recipes
✅ **Wishlist** - Track things you want

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Check Test Coverage
```bash
npm run test:coverage
```

## Features Overview

### 💌 Love Letters
- Write encrypted love letters
- View sent and received letters
- Mark letters as read
- Secure end-to-end encryption

### 📝 Shared Notes
- Create collaborative notes
- Edit and delete notes
- See who created each note
- Real-time updates

### ✉️ Letter Templates
- Choose from pre-made templates
- Customize with placeholders
- Categories: Romance, Gratitude, Longing

### ✈️ Travel Planner
- Plan future trips
- Track budget and dates
- Status: Wishlist, Planned, Completed
- Add detailed notes

### 🍳 Recipe Book
- Save favorite recipes
- Track cooking time and difficulty
- Mark favorites
- Full ingredients and instructions

### 🎁 Wishlist
- Personal wishlist items
- Track prices and links
- Categories and priorities
- Status: Wished, Purchased, Received

## Database Commands

### Test Connection
```bash
npm run db:test
```

### Reinitialize Database (⚠️ Deletes all data!)
```bash
npm run db:init
```

### Connect to MySQL Directly
```bash
mysql -u admin -p -P 3307 -D our_story
```

## Project Structure

```
our_story/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication
│   │   ├── love-letters/ # Love letters endpoints
│   │   ├── notes/        # Notes endpoints
│   │   ├── letter-templates/
│   │   ├── travel/       # Travel plans
│   │   ├── recipes/      # Recipes
│   │   └── wishlist/     # Wishlist
│   ├── dashboard/        # Main dashboard
│   ├── love-letters/     # Love letters UI
│   ├── notes/           # Notes UI
│   ├── letter-maker/    # Letter creator
│   ├── travel/          # Travel planner UI
│   ├── recipes/         # Recipe book UI
│   └── wishlist/        # Wishlist UI
├── lib/                   # Utilities
│   ├── database.ts       # MySQL connection
│   ├── db-pool.ts        # Connection pool
│   ├── auth.ts           # Authentication
│   └── encryption.ts     # AES encryption
├── database/             # Database files
│   ├── schema.sql        # MySQL schema
│   ├── init.ts           # Initialization script
│   └── test-connection.ts
├── __tests__/            # Test files
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
└── docs/                 # Documentation
```

## Troubleshooting

### Issue: Can't Connect to Database
**Solution:**
1. Check `.env` file has correct `DB_PASSWORD`
2. Verify MySQL is running: `mysql -u admin -p -P 3307`
3. Run connection test: `npm run db:test`

### Issue: Login Not Working
**Solution:**
1. Verify database was initialized: `npm run db:init`
2. Check users table: `mysql -u admin -p -P 3307 -D our_story -e "SELECT * FROM users;"`
3. Use default credentials: `partner1/password1`

### Issue: Love Letters Not Loading
**Solution:**
1. Check browser console for errors
2. Verify you're logged in (session cookie exists)
3. Check dev server logs for API errors

### Issue: Tests Failing
**Solution:**
1. Clear Jest cache: `npx jest --clearCache`
2. Reinstall dependencies: `npm install`
3. Check Jest setup: Verify `jest.setup.js` exists

## Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:test      # Test MySQL connection
npm run db:init      # Initialize/reset database

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run with coverage report
npm run test:unit    # Run unit tests only
npm run test:integration # Run integration tests only
```

## Environment Variables

Your `.env` file should contain:

```env
# Authentication
SESSION_SECRET=our-story-secret-key-change-this-in-production
ENCRYPTION_KEY=our-story-encryption-key-32chars

# MySQL Database
DB_HOST=localhost
DB_PORT=3307
DB_USER=admin
DB_PASSWORD=your_password_here
DB_NAME=our_story
```

## Next Steps

### 1. Customize Your App
- Change partner usernames in database
- Add your own letter templates
- Customize colors in `tailwind.config.ts`

### 2. Add More Features
- Photo gallery integration
- Calendar integration
- Memory timeline
- Anniversary reminders

### 3. Deploy to Production
- Set up production MySQL database
- Configure environment variables
- Deploy to Vercel/Railway/other host
- Set up SSL certificates

### 4. Write More Tests
- Add E2E tests with Playwright
- Increase coverage to 90%+
- Add visual regression tests

## Documentation

- 📖 `TESTING_GUIDE.md` - Complete testing documentation
- 📖 `MIGRATION_SUCCESS.md` - Migration summary
- 📖 `MIGRATION_COMPLETE_GUIDE.md` - Detailed migration steps
- 📖 `database/setup-guide.md` - Database setup help

## Support & Resources

### Getting Help
1. Check error messages in browser console
2. Review server logs in terminal
3. Check documentation files
4. Verify database connection

### Learning Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Jest Testing](https://jestjs.io/)
- [React Documentation](https://react.dev/)

## Tips for Success

1. **Keep Sessions Active** - Sessions last 7 days
2. **Test Regularly** - Run tests before committing code
3. **Backup Database** - Export data regularly
4. **Use Version Control** - Commit changes often
5. **Read the Docs** - Check documentation files

## Common Tasks

### Add a New User
```sql
mysql -u admin -p -P 3307 -D our_story

INSERT INTO users (username, display_name, password) 
VALUES ('newuser', 'New User', '$2a$10$hashed_password_here');
```

### View All Love Letters
```sql
SELECT l.*, 
       sender.display_name as sender,
       receiver.display_name as receiver
FROM love_letters l
JOIN users sender ON l.from_user_id = sender.id
JOIN users receiver ON l.to_user_id = receiver.id;
```

### Check Database Size
```sql
SELECT 
  table_name,
  table_rows,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'our_story';
```

## Success! 🎉

Everything is set up and ready to go. Start coding and enjoy your app!

```bash
npm run dev
```

**Happy Building! ❤️**
