# Our Story - Couple's Memory & Planning App

A beautiful, intimate web application designed for couples to share memories, plan together, and express love. Built with modern web technologies and comprehensive authentication.

## ✨ Features

### 🔐 **Authentication System**
- **User Registration** with email verification
- **Secure Login** with username or email
- **Password Reset** via email
- **Account Security** with automatic lockout after failed attempts
- **Email Verification** required for new accounts

### 💕 **Core Features**
- 🎀 **Secure Love Letters** - Exchange encrypted private messages
- 📝 **Shared Notes** - Collaborate on notes together
- 📸 **Photo Gallery** - Store and cherish your memories
- 💌 **Love Letter Maker** - Create beautiful letters from templates
- 🍽️ **Culinary Planner** - Plan meals and recipes together
- ✈️ **Travel Planner** - Dream and plan your adventures
- 🎁 **Wishlists** - Share wishes and gift ideas

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- MySQL 5.7+ or MariaDB
- npm or yarn package manager
- SMTP email service (Gmail, SendGrid, etc.) for email features

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/alfianyaqien/our_story.git
cd our_story
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file from `.env.example`:
```bash
copy .env.example .env  # Windows
# or
cp .env.example .env    # macOS/Linux
```

4. **Configure your `.env` file**

```bash
# Authentication
SESSION_SECRET=your-secret-key-here-min-32-chars

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# MySQL Database
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=our_story

# Email Configuration (for authentication emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Our Story <your-email@gmail.com>

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Gmail:** Generate an App Password at https://myaccount.google.com/apppasswords

5. **Set up the database**

The database schema is automatically initialized on first run. The authentication tables are already migrated.

6. **Run the development server**
```bash
npm run dev
```

7. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 First Time Setup

1. **Sign Up**: Go to `/auth/signup` and create your account
2. **Verify Email**: Check your email and click the verification link
3. **Log In**: Return to the login page and enter your credentials
4. **Start Using**: Enjoy all the features!

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL with mysql2
- **Authentication**: Custom JWT-like session with HTTP-only cookies
- **Email**: Nodemailer with HTML templates
- **Security**: 
  - bcrypt for password hashing (12 rounds)
  - crypto for token generation
  - Account locking after failed attempts
  - Email verification requirement
- **Encryption**: Crypto-JS for love letter content

## 📁 Project Structure

```
our_story/
├── app/                          # Next.js app directory
│   ├── api/auth/                 # Authentication API routes
│   │   ├── login/                # Login endpoint
│   │   ├── signup/               # Registration endpoint
│   │   ├── verify-email/         # Email verification endpoint
│   │   ├── forgot-password/      # Password reset request
│   │   └── reset-password/       # Password reset confirmation
│   ├── auth/                     # Auth pages
│   │   ├── signup/               # Sign up page
│   │   ├── verify-email/         # Email verification page
│   │   ├── forgot-password/      # Forgot password page
│   │   └── reset-password/       # Reset password page
│   ├── dashboard/                # Main dashboard
│   └── page.tsx                  # Login page
├── components/                   # React components
├── lib/                          # Utilities and core logic
│   ├── auth.ts                   # Authentication logic
│   ├── database.ts               # Database utilities
│   ├── db-pool.ts                # MySQL connection pool
│   ├── email.ts                  # Email service
│   └── encryption.ts             # Encryption utilities
├── database/                     # Database migrations
│   └── migrations/               # SQL migration files
├── public/                       # Static assets
└── types/                        # TypeScript type definitions
```

## 🔒 Security Features

### Account Protection
- **Password Hashing**: bcrypt with 12 rounds
- **Account Locking**: Automatic lockout after 5 failed login attempts (15 minutes)
- **Email Verification**: Required before account can be used
- **Session Security**: HTTP-only cookies, 1-week expiry

### Token Security
- **Verification Tokens**: 24-hour expiry, one-time use
- **Reset Tokens**: 1-hour expiry, one-time use
- **Crypto-secure**: All tokens generated with Node.js crypto

### Best Practices
- Email enumeration prevention
- SQL injection protection (parameterized queries)
- XSS protection (React automatic escaping)
- CSRF protection (same-origin policy)

## 📧 Email Features

The app sends branded HTML emails for:
- **Email Verification** - Welcome new users
- **Password Reset** - Secure password recovery
- **Welcome Email** - After successful verification

All emails feature:
- Responsive design
- Beautiful gradient styling
- Clear call-to-action buttons
- Professional branding

## 🔧 Authentication API

Full documentation available in `AUTH_README.md`

**Endpoints:**
- `POST /api/auth/signup` - Register new user
- `GET /api/auth/verify-email` - Verify email address
- `POST /api/auth/login` - Login with username/email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/logout` - End session

## 🐛 Troubleshooting

### Email Not Sending
1. Check your `EMAIL_USER` and `EMAIL_PASS` are correct
2. For Gmail, ensure you're using an App Password
3. Check your firewall allows SMTP connections
4. Verify `EMAIL_HOST` and `EMAIL_PORT` are correct

### Can't Login
1. Ensure your email is verified (check your inbox)
2. Check for account lockout (wait 15 minutes)
3. Try password reset if you forgot your password
4. Check browser console for errors

### Database Issues
1. Ensure MySQL is running on the correct port
2. Verify database credentials in `.env`
3. Check if database `our_story` exists
4. Review migration logs in console

## 📖 Additional Documentation

- `AUTH_README.md` - Complete authentication system documentation
- `.env.example` - Environment variable reference

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a production-grade database (managed MySQL/MariaDB)
3. Set up proper HTTPS with SSL certificates
4. Use a professional email service (SendGrid, AWS SES, Mailgun)
5. Set strong `SESSION_SECRET` and `ENCRYPTION_KEY`
6. Enable database backups
7. Set up monitoring and logging
8. Configure proper CORS policies
9. Update `NEXT_PUBLIC_APP_URL` to your domain

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

Personal project - All rights reserved

## 💝 Built with Love

Created for couples who want to cherish their memories and plan their future together.

---

**Version**: 2.0.0  
**Last Updated**: October 15, 2025  
**Branch**: feature/enhanced-auth-system

## Regression tests

End-to-end checks against the real HTTP API: auth, full CRUD on every
feature, the love-letter encryption round-trip, date round-trips, and that
each data endpoint rejects anonymous requests.

The harness drives the running app, so start it first:

```bash
npm run dev              # terminal 1
npm run test:regression  # terminal 2
```

Point it at another environment with `REGRESSION_BASE_URL`:

```bash
REGRESSION_BASE_URL=https://staging.example.com npm run test:regression
```

It also reads the signup verification token straight from MySQL, so it needs
the same `DB_*` credentials as the app.
