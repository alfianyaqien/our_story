import pool from '../lib/database';
import * as fs from 'fs';
import * as path from 'path';

async function runPhotoMigration() {
  try {
    console.log('🔄 Starting photo gallery migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '004_create_photos_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon to handle multiple statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      await pool.execute(statement);
    }

    console.log('✅ Photos table created successfully!');

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory: /public/uploads/photos/');
    }

    // Create thumbnails directory
    const thumbsDir = path.join(process.cwd(), 'public', 'uploads', 'photos', 'thumbnails');
    if (!fs.existsSync(thumbsDir)) {
      fs.mkdirSync(thumbsDir, { recursive: true });
      console.log('✅ Created thumbnails directory: /public/uploads/photos/thumbnails/');
    }

    console.log('🎉 Photo gallery migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runPhotoMigration();
