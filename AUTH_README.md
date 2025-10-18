# Authentication System Documentation

## Overview

This application now features a complete, production-ready authentication system with the following capabilities:

- **User Registration** with email verification
- **Secure Login** with account security features
- **Password Reset** functionality
- **Account Locking** after failed login attempts
- **Email Notifications** for verification and password resets

## Features

### 1. User Registration (Sign Up)
- Username and email uniqueness validation
- Password strength requirements (minimum 8 characters)
- Email verification required before login
- Automatic welcome email after verification
- **Route**: `/auth/signup`
- **API**: `POST /api/auth/signup`

### 2. Email Verification
- 24-hour verification token expiry
- Secure token generation using crypto
- Automatic account activation upon verification
- **Route**: `/auth/verify-email?token=xxx`
- **API**: `GET /api/auth/verify-email?token=xxx`

### 3. Secure Login
- Login with username OR email
- Password hashing using bcrypt (12 rounds)
- Session management with HTTP-only cookies
- Account status checks (active/inactive/suspended)
- Failed login attempt tracking
- **Route**: `/` (login page)
- **API**: `POST /api/auth/login`

### 4. Account Security

#### Account Locking
- Locks account after 5 failed login attempts
- 15-minute automatic unlock period
- Shows remaining attempts before lockout
- Resets failed attempts on successful login

#### Email Verification Requirement
- Users must verify their email before logging in
- Prevents unauthorized account usage
- Can be made optional by modifying `lib/auth.ts`

### 5. Password Reset
- Secure password reset flow
- 1-hour reset token expiry
- Email enumeration prevention (always returns success)
- Resets failed login attempts upon password reset
- **Routes**: 
  - Request reset: `/auth/forgot-password`
  - Set new password: `/auth/reset-password?token=xxx`
- **APIs**:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`

## Setup Instructions

### 1. Database Migration

The database migration has already been run. It added the following fields to the `users` table:

```sql
- email (VARCHAR 255, UNIQUE)
- email_verified (BOOLEAN, DEFAULT FALSE)
- verification_token (VARCHAR 255)
- verification_token_expires (TIMESTAMP)
- reset_token (VARCHAR 255)
- reset_token_expires (TIMESTAMP)
- account_status (ENUM: 'active', 'inactive', 'suspended')
- last_login (TIMESTAMP)
- failed_login_attempts (INT, DEFAULT 0)
- locked_until (TIMESTAMP)
- updated_at (TIMESTAMP, auto-updates)
```

### 2. Environment Variables

Add the following to your `.env` file:

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com           # SMTP host
EMAIL_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
EMAIL_USER=your-email@gmail.com     # Your email address
EMAIL_PASS=your-app-password        # App password (not regular password)
EMAIL_FROM=Our Story <your-email@gmail.com>  # From address

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your app URL (for email links)
```

#### Gmail Setup (Recommended)

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
   - Use this as `EMAIL_PASS`

#### Alternative Email Providers

For other providers, update:
- `EMAIL_HOST`: Your provider's SMTP host (e.g., smtp.office365.com, smtp.sendgrid.net)
- `EMAIL_PORT`: Provider's SMTP port
- `EMAIL_USER` and `EMAIL_PASS`: Your credentials

### 3. Testing Without Email

If you want to test without configuring email:
- The system will log email content to the console instead
- Verification tokens and reset links will be visible in server logs
- Not recommended for production

## API Endpoints

### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created! Please check your email...",
  "userId": 123
}
```

### GET /api/auth/verify-email?token=xxx
Verify email address.

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully!"
}
```

### POST /api/auth/login
Login with username/email and password.

**Request Body:**
```json
{
  "username": "johndoe",  // or email
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 123,
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account exists, a reset link has been sent"
}
```

### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "abc123...",
  "password": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Security Features

### Password Security
- **Hashing**: bcrypt with 12 rounds
- **Minimum Length**: 8 characters
- **Strength Indicator**: Visual feedback on signup/reset pages

### Token Security
- **Generation**: Crypto-secure random bytes (32 bytes, hex encoded)
- **Expiry Times**:
  - Email verification: 24 hours
  - Password reset: 1 hour
- **One-time Use**: Tokens are cleared after successful use

### Account Security
- **Account Locking**: Automatic after 5 failed attempts
- **Lock Duration**: 15 minutes
- **Auto-unlock**: Expired locks cleared automatically
- **Email Enumeration Prevention**: Forgot password doesn't reveal if email exists

### Session Security
- **HTTP-only Cookies**: Not accessible via JavaScript
- **Cookie Expiry**: 1 week
- **Session Data**: userId, username, displayName, email

## User Flow

### Registration Flow
1. User visits `/auth/signup`
2. Fills in username, email, password, display name
3. System validates and creates account
4. Verification email sent with 24-hour token
5. User clicks link in email
6. System verifies email and activates account
7. Welcome email sent
8. User can now login

### Login Flow
1. User visits `/` (login page)
2. Enters username/email and password
3. System checks:
   - Account exists
   - Account not suspended/inactive
   - Account not locked
   - Password is correct
   - Email is verified (if email exists)
4. Session created with HTTP-only cookie
5. Redirected to dashboard

### Password Reset Flow
1. User visits `/auth/forgot-password`
2. Enters email address
3. System sends reset email (if account exists)
4. User clicks link in email (valid for 1 hour)
5. User visits `/auth/reset-password?token=xxx`
6. Sets new password
7. System resets password and unlocks account
8. User redirected to login

## Customization

### Making Email Verification Optional

Edit `lib/auth.ts`, around line 90:

```typescript
// Comment out or remove this block to make verification optional
if (userRow.email && !userRow.email_verified) {
  return {
    success: false,
    error: 'Please verify your email before logging in. Check your inbox for the verification link.',
  };
}
```

### Adjusting Security Settings

Edit `lib/auth.ts`:

```typescript
// Change max failed attempts (default: 5)
const MAX_FAILED_ATTEMPTS = 5;

// Change lock duration (default: 15 minutes)
const LOCK_DURATION_MINUTES = 15;

// Change bcrypt rounds (default: 12, higher = more secure but slower)
const hashedPassword = await bcrypt.hash(password, 12);
```

### Customizing Email Templates

Edit `lib/email.ts` to modify the HTML email templates:
- `sendVerificationEmail()`: Verification email
- `sendPasswordResetEmail()`: Password reset email
- `sendWelcomeEmail()`: Welcome email

### Changing Token Expiry

**Verification Token** (default: 24 hours):
```typescript
// In app/api/auth/signup/route.ts
const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
```

**Reset Token** (default: 1 hour):
```typescript
// In app/api/auth/forgot-password/route.ts
const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
```

## Troubleshooting

### Email Not Sending
1. Check environment variables are set correctly
2. Verify email credentials are correct
3. For Gmail, ensure you're using an App Password, not your regular password
4. Check server logs for error messages
5. Test with console logging (emails will print to console if config missing)

### Account Locked
- Wait 15 minutes for automatic unlock
- Or manually unlock in database:
  ```sql
  UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE username = 'username';
  ```

### Email Not Verified
- Check spam/junk folder
- Check server logs for verification link
- Manually verify in database:
  ```sql
  UPDATE users SET email_verified = TRUE WHERE email = 'user@example.com';
  ```

### Token Expired
- Request a new verification/reset email
- Tokens cannot be extended, only regenerated

## Database Queries

### View User Auth Status
```sql
SELECT 
  id, username, email, email_verified, account_status,
  failed_login_attempts, locked_until, last_login
FROM users 
WHERE username = 'username';
```

### Unlock Account
```sql
UPDATE users 
SET failed_login_attempts = 0, locked_until = NULL 
WHERE username = 'username';
```

### Verify Email Manually
```sql
UPDATE users 
SET email_verified = TRUE, verification_token = NULL 
WHERE email = 'user@example.com';
```

### Reset Password Manually (use bcrypt hash)
```sql
-- First generate a bcrypt hash of the new password
-- Then update:
UPDATE users 
SET password = '$2b$12$hashedPasswordHere',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE username = 'username';
```

## Next Steps

1. **Configure Email**: Add email credentials to `.env`
2. **Test Registration**: Create a test account
3. **Verify Email Flow**: Check inbox and verify email
4. **Test Login**: Login with verified account
5. **Test Password Reset**: Try forgot password flow
6. **Test Account Locking**: Try 5 failed login attempts

## Production Considerations

- [ ] Use environment-specific email services (SendGrid, AWS SES, etc.)
- [ ] Set up proper error monitoring (Sentry, etc.)
- [ ] Add rate limiting to prevent abuse
- [ ] Consider adding 2FA/MFA
- [ ] Set up email delivery monitoring
- [ ] Add CAPTCHA to signup/login forms
- [ ] Implement session rotation
- [ ] Add audit logging for security events
- [ ] Configure proper CORS and CSP headers
- [ ] Use HTTPS in production (update NEXT_PUBLIC_APP_URL)

