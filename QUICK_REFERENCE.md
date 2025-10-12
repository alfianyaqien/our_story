# Our Story - Quick Reference Card

## 🚀 Quick Start

```powershell
# Method 1: Use the start script
.\start.ps1

# Method 2: Manual start
npm install
npm run dev
```

Open: **http://localhost:3000**

## 🔑 Default Login

| User | Username | Password |
|------|----------|----------|
| Partner 1 | partner1 | password1 |
| Partner 2 | partner2 | password2 |

## ✨ Features

| Feature | Icon | Description | Route |
|---------|------|-------------|-------|
| **Love Letters** | 💌 | Encrypted private messages | `/love-letters` |
| **Shared Notes** | 📝 | Collaborative notes | `/notes` |
| **Photo Gallery** | 📸 | Memory storage (coming soon) | `/gallery` |
| **Letter Maker** | ✍️ | Template-based letters | `/letter-maker` |
| **Travel Planner** | ✈️ | Plan trips together | `/travel` |
| **Recipe Book** | 🍽️ | Culinary sharing | `/recipes` |
| **Wishlists** | 🎁 | Shared wishes & gifts | `/wishlist` |

## 📂 Key Files

| File | Purpose |
|------|---------|
| `lib/database.ts` | SQLite database setup & schema |
| `lib/auth.ts` | Authentication logic |
| `lib/encryption.ts` | AES encryption for love letters |
| `app/api/*` | Backend API routes |
| `app/*/page.tsx` | Frontend pages |
| `.env` | Configuration (keep secret!) |

## 🎨 Color Theme

```css
love-pink: #FFB6C1
love-red: #FF6B9D
love-purple: #C5A3E6
love-lavender: #E6E6FA
```

## 📊 Database Tables

- `users` - Partner accounts
- `love_letters` - Encrypted messages
- `notes` - Shared notes
- `photos` - Photo metadata
- `letter_templates` - Letter templates
- `travel_plans` - Travel planning
- `recipes` - Recipe collection
- `wishlist` - Wishlist items

## 🔧 Common Commands

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Backup database
Copy-Item our_story.db backup.db
```

## 🐛 Troubleshooting

**Module not found?**
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

**Port already in use?**
```powershell
npm run dev -- -p 3001
```

**Database issues?**
```powershell
Remove-Item our_story.db
# Restart app to recreate
```

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt
- [x] Love letters encrypted with AES
- [x] HTTP-only session cookies
- [x] SQLite for local storage
- [ ] HTTPS (for production)
- [ ] Strong password enforcement (add if needed)
- [ ] Rate limiting (add if needed)
- [ ] File upload validation (for photos)

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get session

### Love Letters
- `GET /api/love-letters` - List letters
- `POST /api/love-letters` - Create letter

### Notes
- `GET /api/notes` - List notes
- `POST /api/notes` - Create note
- `PUT /api/notes` - Update note
- `DELETE /api/notes?id={id}` - Delete note

### Templates
- `GET /api/letter-templates` - List templates

### Travel
- `GET /api/travel` - List plans
- `POST /api/travel` - Create plan
- `PUT /api/travel` - Update plan
- `DELETE /api/travel?id={id}` - Delete plan

### Recipes
- `GET /api/recipes` - List recipes
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes` - Update recipe
- `DELETE /api/recipes?id={id}` - Delete recipe

### Wishlist
- `GET /api/wishlist` - List items
- `POST /api/wishlist` - Create item
- `PUT /api/wishlist` - Update item
- `DELETE /api/wishlist?id={id}` - Delete item

## 💡 Tips

1. **Backup regularly**: Copy `our_story.db` file
2. **Keep .env secret**: Never commit to version control
3. **Customize colors**: Edit `tailwind.config.js`
4. **Add templates**: Insert into `letter_templates` table
5. **Personal touch**: Edit quotes, messages, and UI text

## 📱 Mobile Access

Access from other devices on same network:
1. Find your IP: `ipconfig` (look for IPv4)
2. Open: `http://YOUR_IP:3000`
3. Make sure Windows Firewall allows port 3000

## 🎯 Next Steps

1. Change default passwords in `.env`
2. Customize color theme
3. Add your own letter templates
4. Start creating memories together!
5. Consider adding photo upload feature
6. Deploy to hosting if desired

---

**Enjoy your journey together! 💕**
