# Troubleshooting Guide - Our Story

## Common Issues and Solutions

### Installation Issues

#### Issue: `npm install` fails
**Symptoms**: Errors during dependency installation

**Solutions**:
```powershell
# 1. Clear npm cache
npm cache clean --force

# 2. Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 3. Reinstall
npm install

# 4. If still failing, try with --legacy-peer-deps
npm install --legacy-peer-deps
```

#### Issue: better-sqlite3 compilation errors
**Symptoms**: Build errors related to better-sqlite3

**Solutions**:
```powershell
# On Windows, install build tools
npm install --global windows-build-tools

# Or install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"

# Then reinstall better-sqlite3
npm install better-sqlite3 --build-from-source
```

---

### Runtime Issues

#### Issue: Port 3000 already in use
**Symptoms**: Error: "Port 3000 is already in use"

**Solutions**:
```powershell
# Option 1: Find and kill the process
netstat -ano | findstr :3000
# Note the PID (last column)
taskkill /PID <PID> /F

# Option 2: Use a different port
npm run dev -- -p 3001

# Option 3: Change default port in package.json
# Edit: "dev": "next dev -p 3001"
```

#### Issue: Database not created
**Symptoms**: Error about missing database file

**Solutions**:
```powershell
# 1. Check write permissions
# Right-click folder → Properties → Security

# 2. Manually trigger database creation
# Just start the app and login - database will be created automatically

# 3. Check for existing database lock
Remove-Item our_story.db-wal
Remove-Item our_story.db-shm
```

#### Issue: Login fails with correct credentials
**Symptoms**: "Invalid credentials" despite correct username/password

**Solutions**:
```powershell
# 1. Check .env file exists
Get-Content .env

# 2. Verify database has users
# Delete database to recreate
Remove-Item our_story.db
# Restart app

# 3. Check for bcrypt issues
npm rebuild bcryptjs
```

---

### Feature-Specific Issues

#### Issue: Love letters not encrypting
**Symptoms**: Love letters visible as plain text in database

**Solutions**:
```powershell
# 1. Verify ENCRYPTION_KEY in .env
Get-Content .env | Select-String "ENCRYPTION_KEY"

# 2. Check ENCRYPTION_KEY is 32+ characters
# Edit .env and add longer key

# 3. Restart the server
# Press Ctrl+C and run: npm run dev
```

#### Issue: Notes not saving
**Symptoms**: Notes disappear after creation

**Solutions**:
```javascript
// Check browser console for errors (F12)
// Look for API errors

// Verify database table exists
// Check lib/database.ts initialization
```

#### Issue: Images in gallery not displaying
**Symptoms**: Gallery shows placeholder

**Solutions**:
```
Note: Photo upload is not yet implemented (placeholder only)
To add photo upload, see SETUP_GUIDE.md "Add Photo Upload" section
```

---

### UI/Display Issues

#### Issue: Styles not loading
**Symptoms**: Page shows unstyled HTML

**Solutions**:
```powershell
# 1. Rebuild Tailwind
npm run dev

# 2. Clear .next cache
Remove-Item -Recurse -Force .next
npm run dev

# 3. Check globals.css is imported
# Verify in app/layout.tsx: import './globals.css'
```

#### Issue: Icons not showing
**Symptoms**: Missing icons, broken icon components

**Solutions**:
```powershell
# Reinstall lucide-react
npm uninstall lucide-react
npm install lucide-react@latest
```

---

### Browser Issues

#### Issue: Session not persisting
**Symptoms**: Logged out after refresh

**Solutions**:
```javascript
// 1. Check browser cookies are enabled
// Settings → Privacy → Cookies → Allow

// 2. Clear browser cache and cookies
// Ctrl+Shift+Delete → Clear all

// 3. Try incognito/private window
// Check if extensions are interfering
```

#### Issue: CORS errors in console
**Symptoms**: "blocked by CORS policy" errors

**Solutions**:
```javascript
// Add to next.config.js:
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

---

### Development Issues

#### Issue: Changes not reflecting
**Symptoms**: Code changes don't show in browser

**Solutions**:
```powershell
# 1. Hard refresh browser
# Ctrl+Shift+R or Ctrl+F5

# 2. Clear Next.js cache
Remove-Item -Recurse -Force .next
npm run dev

# 3. Check for TypeScript errors
npm run build
```

#### Issue: TypeScript errors in IDE
**Symptoms**: Red squiggly lines everywhere

**Solutions**:
```powershell
# 1. Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# 2. Install type definitions
npm install --save-dev @types/node @types/react @types/react-dom

# 3. Check tsconfig.json is correct
# Compare with original tsconfig.json
```

---

### Database Issues

#### Issue: Database locked
**Symptoms**: "database is locked" error

**Solutions**:
```powershell
# 1. Close all connections
# Stop the dev server (Ctrl+C)

# 2. Remove lock files
Remove-Item our_story.db-wal
Remove-Item our_story.db-shm

# 3. Restart server
npm run dev
```

#### Issue: Data not persisting
**Symptoms**: Data disappears after restart

**Solutions**:
```powershell
# Check database file exists and has data
# Open our_story.db with SQLite browser
# Download from: https://sqlitebrowser.org/

# Verify database path in lib/database.ts
# Should be: path.join(process.cwd(), 'our_story.db')
```

---

### Production Issues

#### Issue: Build fails
**Symptoms**: `npm run build` errors

**Solutions**:
```powershell
# 1. Check for TypeScript errors
# Fix all type errors shown

# 2. Check environment variables
# Ensure .env exists in production

# 3. Clear cache and rebuild
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

#### Issue: Slow performance
**Symptoms**: App is laggy or slow

**Solutions**:
```javascript
// 1. Enable production mode
// Set: NODE_ENV=production

// 2. Add database indexes
// See DEPLOYMENT.md for index SQL

// 3. Enable compression
// Add to next.config.js: compress: true
```

---

### Network/Access Issues

#### Issue: Can't access from other devices
**Symptoms**: Mobile/tablet can't connect

**Solutions**:
```powershell
# 1. Find your IP address
ipconfig
# Look for IPv4 Address under your active network

# 2. Ensure same network
# Both devices must be on same WiFi

# 3. Check Windows Firewall
# Allow Node.js through firewall
# Settings → Firewall → Allow app through firewall

# 4. Start server with host binding
npm run dev -- -H 0.0.0.0
```

#### Issue: HTTPS required
**Symptoms**: "HTTPS required" or security errors

**Solutions**:
```powershell
# For local development, use mkcert
npm install -g mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1

# Update package.json:
# "dev": "next dev --experimental-https"
```

---

### Error Messages Decoder

#### "Cannot find module 'X'"
- **Cause**: Missing dependency
- **Fix**: `npm install X`

#### "Error: connect ECONNREFUSED"
- **Cause**: Server not running
- **Fix**: `npm run dev`

#### "Unexpected token"
- **Cause**: Syntax error in code
- **Fix**: Check the file mentioned in error

#### "Module not found: Can't resolve"
- **Cause**: Import path incorrect
- **Fix**: Check import statements and file paths

#### "EADDRINUSE"
- **Cause**: Port already in use
- **Fix**: Change port or kill process

---

## Debug Mode

Enable detailed logging:

```javascript
// Add to .env
DEBUG=*
NODE_ENV=development
```

View Next.js logs:
```powershell
npm run dev -- --debug
```

Check database:
```powershell
# Install SQLite command line
# View tables
sqlite3 our_story.db ".tables"

# View data
sqlite3 our_story.db "SELECT * FROM users;"
```

---

## Getting Help

### Check Documentation
1. README.md - Project overview
2. SETUP_GUIDE.md - Installation help
3. DEPLOYMENT.md - Production issues
4. PROJECT_SUMMARY.md - Feature details

### Online Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)
- [GitHub Issues](https://github.com/vercel/next.js/issues)

### Debug Checklist
- [ ] Check console for errors (F12)
- [ ] Verify .env file exists
- [ ] Ensure dependencies installed
- [ ] Check database file exists
- [ ] Verify port not in use
- [ ] Clear browser cache
- [ ] Restart dev server
- [ ] Check file permissions

---

## Still Having Issues?

### Gather Information
```powershell
# Node version
node --version

# NPM version
npm --version

# Operating System
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

# Error messages
# Copy full error from terminal
```

### Reset Everything
```powershell
# Nuclear option - complete reset
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
Remove-Item package-lock.json
Remove-Item our_story.db

npm install
npm run dev
```

---

**Remember**: Most issues can be solved by restarting the dev server! 🔄
