# Database Setup Guide

## Prerequisites
- MySQL Server running on port 3307
- MySQL credentials (root or dedicated user)

## Step 1: Configure Environment Variables

Edit the `.env` file and update the MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=our_story
```

## Step 2: (Optional) Create Dedicated Database User

For better security, you can create a dedicated user instead of using root:

```sql
-- Connect to MySQL as root
mysql -u root -p -P 3307

-- Create database
CREATE DATABASE our_story CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'our_story_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON our_story.* TO 'our_story_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update `.env`:
```env
DB_USER=our_story_user
DB_PASSWORD=your_secure_password
```

## Step 3: Initialize Database

Run the initialization script:

```bash
npx tsx database/init.ts
```

This will:
- Create the database if it doesn't exist
- Create all required tables
- Seed initial users (partner1/password1, partner2/password2)
- Seed letter templates

## Step 4: Verify Setup

You should see:
```
🔌 Connecting to MySQL server...
✅ Connected to MySQL
📝 Creating database 'our_story'...
✅ Database created
📊 Executing schema...
✅ Schema created successfully
👥 Seeding users...
✅ Users seeded
📧 Seeding letter templates...
✅ Letter templates seeded
✅ Database initialization completed
```

## Troubleshooting

### Error: Access denied for user

- Check your MySQL password in `.env`
- Verify MySQL is running: `mysql -u root -p -P 3307`
- Ensure the user has proper privileges

### Error: Connection refused

- Check if MySQL is running on port 3307
- Verify the port in `.env` matches your MySQL configuration
- Check MySQL error logs

### Error: Database already exists

This is fine! The script will use the existing database. To start fresh:

```sql
DROP DATABASE our_story;
```

Then run the initialization script again.

## Manual Setup (Alternative)

If you prefer to set up manually:

1. Create the database:
```sql
CREATE DATABASE our_story CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE our_story;
```

2. Run the schema file:
```bash
mysql -u root -p -P 3307 our_story < database/schema.sql
```

3. The initial users and templates will be created on first app run.

## Testing Connection

You can test the connection with this command:

```bash
mysql -u root -p -P 3307 -e "SHOW DATABASES;"
```

## Next Steps

After successful database setup:
1. Start the development server: `npm run dev`
2. Open http://localhost:3000
3. Login with partner1/password1 or partner2/password2
