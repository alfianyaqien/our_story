# Deployment Guide - Our Story

This guide shows how to deploy "Our Story" to various hosting platforms.

## ⚠️ Before Deployment

### Security Checklist

Before deploying online, ensure:

- [ ] Change all default passwords
- [ ] Use strong, random SESSION_SECRET (32+ characters)
- [ ] Use strong, random ENCRYPTION_KEY (32+ characters)
- [ ] Never commit `.env` file to version control
- [ ] Enable HTTPS/SSL
- [ ] Consider switching from SQLite to PostgreSQL/MySQL
- [ ] Add rate limiting
- [ ] Implement proper session management
- [ ] Add CORS configuration
- [ ] Validate all user inputs
- [ ] Add error logging

## Option 1: Vercel (Recommended for Next.js)

### Limitations
⚠️ **SQLite won't work on Vercel** (serverless environment). You'll need to switch to a cloud database.

### Steps

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Prepare for Deployment**
   ```powershell
   # Create vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "framework": "nextjs"
   }
   ```

3. **Switch to Cloud Database** (Required)
   
   Option A: **Vercel Postgres**
   ```powershell
   npm install @vercel/postgres
   ```
   
   Option B: **PlanetScale** (MySQL)
   ```powershell
   npm install @planetscale/database
   ```
   
   Option C: **Supabase** (PostgreSQL)
   ```powershell
   npm install @supabase/supabase-js
   ```

4. **Deploy**
   ```powershell
   npm install -g vercel
   vercel
   ```

5. **Set Environment Variables** in Vercel Dashboard
   - SESSION_SECRET
   - ENCRYPTION_KEY
   - Database credentials

### Cost: Free tier available

## Option 2: Railway (SQLite Compatible)

Railway supports persistent storage, so SQLite will work!

### Steps

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Install Railway CLI**
   ```powershell
   npm install -g @railway/cli
   railway login
   ```

3. **Deploy**
   ```powershell
   railway init
   railway up
   ```

4. **Add Environment Variables**
   ```powershell
   railway variables set SESSION_SECRET=your-secret
   railway variables set ENCRYPTION_KEY=your-key
   ```

5. **Enable Persistent Volume** for SQLite
   - Go to Railway dashboard
   - Add volume mount: `/app/our_story.db`

### Cost: Free $5 credit/month, then $5/month

## Option 3: DigitalOcean App Platform

### Steps

1. **Create DigitalOcean Account**
   - Go to https://digitalocean.com
   - Create account

2. **Create App**
   - App Platform → Create App
   - Connect GitHub repository
   - Select branch

3. **Configure Build**
   - Build Command: `npm run build`
   - Run Command: `npm start`

4. **Add Environment Variables**
   - SESSION_SECRET
   - ENCRYPTION_KEY
   - NODE_ENV=production

5. **Add Database** (Optional)
   - Add managed PostgreSQL database
   - Update connection in code

### Cost: From $5/month

## Option 4: Self-Hosting (VPS)

For full control, host on your own server.

### Requirements
- VPS (DigitalOcean, Linode, AWS EC2, etc.)
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt)

### Steps

1. **Set up Server** (Ubuntu example)
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 (process manager)
   sudo npm install -g pm2
   ```

2. **Clone and Setup**
   ```bash
   # Clone your repository
   git clone your-repo-url
   cd our_story

   # Install dependencies
   npm install

   # Create .env
   nano .env
   # (Add your environment variables)

   # Build
   npm run build
   ```

3. **Setup PM2**
   ```bash
   # Start app
   pm2 start npm --name "our-story" -- start

   # Save PM2 config
   pm2 save

   # Auto-start on reboot
   pm2 startup
   ```

4. **Setup Nginx** (Reverse Proxy)
   ```bash
   sudo apt install nginx

   # Create config
   sudo nano /etc/nginx/sites-available/ourstory
   ```

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/ourstory /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Setup SSL** (Let's Encrypt)
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Cost: From $5/month for VPS

## Option 5: Docker Deployment

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app files
COPY . .

# Build app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=${SESSION_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### Deploy

```powershell
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Database Migration Guide

If switching from SQLite to PostgreSQL/MySQL:

### 1. Install Database Driver

PostgreSQL:
```powershell
npm install pg
```

MySQL:
```powershell
npm install mysql2
```

### 2. Update lib/database.ts

Replace SQLite code with:

```typescript
// For PostgreSQL
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default pool;
```

### 3. Update Queries

Convert SQLite queries to PostgreSQL/MySQL syntax:
- Change `INTEGER PRIMARY KEY AUTOINCREMENT` to `SERIAL PRIMARY KEY`
- Change `CURRENT_TIMESTAMP` usage if needed
- Update data type mappings

### 4. Migrate Data (if needed)

```bash
# Export from SQLite
sqlite3 our_story.db .dump > backup.sql

# Convert to PostgreSQL format
# (Manual editing or use conversion tools)

# Import to PostgreSQL
psql $DATABASE_URL < converted.sql
```

## Environment Variables

Required for all deployments:

```env
NODE_ENV=production
SESSION_SECRET=your-very-long-random-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key-here
DATABASE_URL=postgresql://user:pass@host:5432/db  # If using cloud DB
```

## Monitoring & Maintenance

### Health Checks

Add health check endpoint in `app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Logging

Consider adding:
- Error tracking (Sentry)
- Analytics (Plausible, Simple Analytics)
- Uptime monitoring (UptimeRobot)

### Backups

Automated backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup database
cp our_story.db "$BACKUP_DIR/our_story_$DATE.db"

# Keep only last 7 days
find $BACKUP_DIR -name "our_story_*.db" -mtime +7 -delete
```

Add to cron:
```bash
0 2 * * * /path/to/backup.sh
```

## Performance Optimization

### 1. Enable Caching

In `next.config.js`:

```javascript
module.exports = {
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
};
```

### 2. Add CDN

Use Vercel's CDN or Cloudflare for static assets.

### 3. Database Indexing

Add indexes to frequently queried columns:

```sql
CREATE INDEX idx_love_letters_user ON love_letters(to_user_id, from_user_id);
CREATE INDEX idx_notes_created ON notes(created_at);
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
```

## Cost Comparison

| Platform | Free Tier | Paid | Database | SSL | Best For |
|----------|-----------|------|----------|-----|----------|
| Vercel | ✅ | $20/mo | ❌ SQLite | ✅ | Easy deploy |
| Railway | $5 credit | $5/mo | ✅ SQLite | ✅ | SQLite needed |
| DigitalOcean | ❌ | $5/mo | Optional | ✅ | Full control |
| VPS | ❌ | $5/mo | Included | Setup | Max control |

## Recommended Choice

**For Beginners**: Railway (supports SQLite)
**For Scale**: Vercel + PlanetScale
**For Control**: VPS with Docker

## Post-Deployment

1. Test all features thoroughly
2. Update DNS records
3. Monitor error logs
4. Set up backups
5. Enable monitoring
6. Document custom changes

---

**Need Help?** Check platform-specific documentation or community forums.
