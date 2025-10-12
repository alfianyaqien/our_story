#!/usr/bin/env node

/**
 * This script helps identify which API routes still need MySQL conversion
 * Run: node scripts/check-mysql-migration.js
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../app/api');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for SQLite patterns
  const hasSQLite = content.includes('db.prepare') || 
                    content.includes("from '@/lib/database'") ||
                    content.includes('import db from');
  
  // Check for MySQL patterns
  const hasMySQL = content.includes('pool.execute') || 
                   content.includes('import pool from');
  
  return {
    path: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
    needsConversion: hasSQLite && !hasMySQL,
    usingSQLite: hasSQLite,
    usingMySQL: hasMySQL
  };
}

function scanDirectory(dir) {
  const results = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item === 'route.ts' || item === 'route.js') {
        results.push(checkFile(fullPath));
      }
    }
  }
  
  scan(dir);
  return results;
}

console.log('🔍 Scanning API routes for MySQL migration status...\n');

const routes = scanDirectory(apiDir);

const needsConversion = routes.filter(r => r.needsConversion);
const converted = routes.filter(r => r.usingMySQL);
const noDatabase = routes.filter(r => !r.usingSQLite && !r.usingMySQL);

console.log('📊 Migration Status:');
console.log(`   ✅ Converted to MySQL: ${converted.length}`);
console.log(`   ⏳ Needs conversion: ${needsConversion.length}`);
console.log(`   ℹ️  No database access: ${noDatabase.length}`);
console.log(`   📁 Total routes: ${routes.length}\n`);

if (converted.length > 0) {
  console.log('✅ Converted Routes:');
  converted.forEach(r => console.log(`   ${r.path}`));
  console.log('');
}

if (needsConversion.length > 0) {
  console.log('⏳ Routes Needing Conversion:');
  needsConversion.forEach(r => console.log(`   ${r.path}`));
  console.log('');
}

if (noDatabase.length > 0) {
  console.log('ℹ️  Routes Without Database Access:');
  noDatabase.forEach(r => console.log(`   ${r.path}`));
}
