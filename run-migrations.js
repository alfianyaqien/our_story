// Database Migration Runner for Our Story
// Run this with: node run-migrations.js

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const migrations = [
  '001_update_recipes_to_culinary_plans.sql',
  '004_create_photos_table.sql',
  '005_create_culinary_photos_table.sql',
  '006_enhance_users_table_for_auth_v2.sql',
  '007_create_albums_table.sql'
];

async function runMigrations() {
  console.log('==================================================');
  console.log('   Our Story - Database Migration Runner');
  console.log('==================================================\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'our_story',
    multipleStatements: true
  };

  console.log('Database Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}\n`);

  let connection;

  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✓ Connected successfully\n');

    console.log('Migrations to run:');
    migrations.forEach(m => console.log(`  ${m}`));
    console.log('');

    let successCount = 0;
    let failCount = 0;

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, 'database', 'migrations', migration);
      
      try {
        console.log(`Running: ${migration}`);
        
        const sql = await fs.readFile(migrationPath, 'utf8');
        await connection.query(sql);
        
        console.log('  ✓ Success\n');
        successCount++;
      } catch (error) {
        console.log('  ✗ Failed');
        console.log(`  Error: ${error.message}\n`);
        failCount++;
        
        // Continue with other migrations even if one fails
      }
    }

    console.log('==================================================');
    console.log('Migration Summary:');
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log('==================================================\n');

    if (failCount === 0) {
      console.log('✓ All migrations completed successfully!\n');
    } else {
      console.log('⚠ Some migrations failed. Please check the errors above.\n');
    }

  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.error('\nPlease check your database configuration in .env file\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations().catch(console.error);
