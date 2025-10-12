import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  let connection;

  try {
    console.log('🔌 Connecting to MySQL server...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3307'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'our_story',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');

    // Read migration file
    console.log('📦 Reading migration file...');
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', '001_update_recipes_to_culinary_plans.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔨 Running migration...');
    await connection.query(migration);

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Table "recipes" has been updated to culinary plans structure');
    console.log('   Fields: place_name, location, cuisine_type, price_range, recommended_menu, notes, status, rating, visit_date');

  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
