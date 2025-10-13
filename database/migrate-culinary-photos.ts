import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function runCulinaryPhotosMigration() {
  let connection;
  try {
    console.log('🔄 Starting culinary photos migration...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3307'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'our_story'
    });

    console.log('✅ Connected to database\n');
    
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', '005_create_culinary_photos_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Executing migration SQL...\n');
    
    // Execute the SQL
    await connection.execute(migrationSQL);
    
    console.log('✅ Culinary photos table created successfully!\n');

    // Create uploads directory for culinary photos
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'culinary');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory: /public/uploads/culinary/\n');
    } else {
      console.log('ℹ️  Uploads directory already exists: /public/uploads/culinary/\n');
    }

    await connection.end();
    
    console.log('🎉 Culinary photos migration completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

runCulinaryPhotosMigration();
