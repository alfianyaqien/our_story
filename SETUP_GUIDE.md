# Our Story - Setup Guide

## Quick Start Guide

Follow these steps to get your "Our Story" application running locally.

### Step 1: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

This will install all required packages including:
- Next.js 14 (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- Better-SQLite3 (database)
- Crypto-JS (encryption for love letters)
- Lucide React (beautiful icons)
- Date-fns (date formatting)

### Step 2: Create Environment File

Create a `.env` file in the root directory:

```powershell
Copy-Item .env.example .env
```

Then edit the `.env` file with your own values:
- Change the SESSION_SECRET to a random string
- Change the ENCRYPTION_KEY to a random 32-character string
- Optionally update the default usernames and passwords

### Step 3: Run Development Server

Start the application:

```powershell
npm run dev
```

The application will be available at: **http://localhost:3000**

### Step 4: Login

Use one of the default accounts:
- Username: `partner1` / Password: `password1`
- Username: `partner2` / Password: `password2`

## Features Overview

### 🎀 Secure Love Letters
- Send encrypted private messages to your partner
- Messages are encrypted using AES encryption
- View sent and received letters
- Beautiful interface for reading love letters

### 📝 Shared Notes
- Create collaborative notes together
- Edit and update notes in real-time
- Track who created each note
- Perfect for shopping lists, plans, or thoughts

### 📸 Photo Gallery (Coming Soon)
- Upload and share photos together
- Add captions to memories
- Organized timeline view
- Note: File upload can be added based on storage preference

### 💌 Love Letter Maker
- Use beautiful pre-made templates
- Fill in custom placeholders
- Generate personalized love letters
- Send directly as encrypted love letters

### ✈️ Travel Planner
- Plan future trips together
- Track destinations, dates, and budgets
- Status tracking: Wishlist → Planning → Booked → Completed
- Add notes for each destination

### 🍽️ Recipe Book
- Save your favorite recipes
- Mark recipes as favorites
- Track cooking time and difficulty
- Share culinary discoveries together

### 🎁 Wishlists
- Create personal wishlists
- Set priorities and categories
- Track status: Wished → Planned → Purchased
- Add prices and links to items
- See each other's wishes

## Database

The application uses SQLite (better-sqlite3) for local data storage:
- Database file: `our_story.db` (created automatically)
- All data is stored locally on your computer
- No external database required
- Easy to backup (just copy the .db file)

### Initial Data

On first run, the database automatically creates:
- 2 user accounts (partner1 and partner2)
- 3 love letter templates
- All necessary tables

## Project Structure

```
our_story/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── love-letters/      # Love letters CRUD
│   │   ├── notes/             # Notes CRUD
│   │   ├── recipes/           # Recipes CRUD
│   │   ├── travel/            # Travel plans CRUD
│   │   └── wishlist/          # Wishlist CRUD
│   ├── dashboard/             # Main dashboard page
│   ├── love-letters/          # Love letters feature
│   ├── notes/                 # Shared notes feature
│   ├── gallery/               # Photo gallery (placeholder)
│   ├── letter-maker/          # Letter template generator
│   ├── travel/                # Travel planner
│   ├── recipes/               # Recipe book
│   ├── wishlist/              # Wishlist feature
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Login page
│   └── globals.css            # Global styles
├── lib/                       # Utility libraries
│   ├── database.ts            # SQLite database setup
│   ├── auth.ts                # Authentication helpers
│   └── encryption.ts          # Encryption utilities
├── types/                     # TypeScript type definitions
│   └── index.ts               # All interfaces
├── public/                    # Static assets
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # Tailwind CSS config
├── next.config.js             # Next.js config
└── README.md                  # Documentation
```

## Technology Stack

- **Frontend**: React 18, Next.js 14, TypeScript
- **Styling**: Tailwind CSS with custom love-themed colors
- **Icons**: Lucide React
- **Database**: Better-SQLite3 (local SQLite)
- **Security**: 
  - Bcrypt for password hashing
  - AES encryption for love letters
  - HTTP-only cookies for sessions
- **Date Handling**: date-fns

## Customization

### Change Color Theme

Edit `tailwind.config.js` to customize the love-themed colors:

```javascript
colors: {
  'love-pink': '#FFB6C1',
  'love-red': '#FF6B9D',
  'love-purple': '#C5A3E6',
  'love-lavender': '#E6E6FA',
}
```

### Add More Users

Currently supports 2 users. To add more, modify the database schema and authentication logic in:
- `lib/database.ts` (user creation)
- `lib/auth.ts` (authentication logic)

### Add Photo Upload

To implement photo gallery:
1. Install multer or use Next.js API routes for file upload
2. Create upload endpoint in `app/api/photos/`
3. Store files in `public/uploads/`
4. Update `app/gallery/page.tsx` with upload UI

## Troubleshooting

### "Cannot find module" errors
Run: `npm install`

### Database not created
Make sure you have write permissions in the project directory

### Port 3000 already in use
Either:
- Stop the other process using port 3000
- Or change port: `npm run dev -- -p 3001`

### Encryption errors
Make sure `.env` file exists and contains a valid ENCRYPTION_KEY

## Security Notes

⚠️ **Important for Production:**

This MVP is designed for local/personal use. If deploying online:

1. **Use HTTPS** - Enable SSL/TLS encryption
2. **Strong Passwords** - Enforce strong password requirements
3. **Secure Sessions** - Use proper session management (Redis, JWT)
4. **Database** - Use PostgreSQL or MySQL instead of SQLite
5. **Environment Variables** - Never commit `.env` to git
6. **File Upload** - Validate and sanitize all uploads
7. **Rate Limiting** - Prevent brute force attacks
8. **CORS** - Configure proper CORS policies

## Backup Your Data

To backup your data:

```powershell
# Backup database
Copy-Item our_story.db our_story_backup_$(Get-Date -Format 'yyyyMMdd').db

# Backup everything
Compress-Archive -Path * -DestinationPath backup_$(Get-Date -Format 'yyyyMMdd').zip
```

## Support

For questions or issues:
1. Check the README.md
2. Review the code comments
3. Check Next.js documentation: https://nextjs.org/docs

## Future Enhancements

Potential features to add:
- Real-time notifications
- Mobile app (React Native)
- Calendar integration
- Reminder system
- Anniversary countdown
- Memory timeline
- Couple's journal
- Shared calendar
- Budget tracker
- Date ideas generator

## License

Personal project - Customize freely for your personal use!

---

**Built with ❤️ for couples who want to stay connected**
