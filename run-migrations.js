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
  '007_create_albums_table.sql',
  '008_create_missing_feature_tables.sql',
  '009_create_stories.sql'
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

    // Ledger of applied migrations. Without it every run re-executed every
    // file, so the non-idempotent ones (plain ADD COLUMN) reported
    // "Duplicate column name" failures forever on a perfectly healthy
    // database - noise that hid real errors.
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [appliedRows] = await connection.query('SELECT name FROM schema_migrations');
    const applied = new Set(appliedRows.map(r => r.name));

    // Migrations that predate the ledger already ran against this database.
    // Adopt them on first sight so they are not replayed, but only when their
    // effect is already present - detected by the tables/columns they create.
    if (applied.size === 0) {
      const [tables] = await connection.query('SHOW TABLES');
      const tableNames = new Set(tables.map(t => Object.values(t)[0]));
      const [userCols] = await connection.query('SHOW COLUMNS FROM users');
      const userColNames = new Set(userCols.map(c => c.Field));
      const [photoCols] = tableNames.has('photos')
        ? await connection.query('SHOW COLUMNS FROM photos')
        : [[]];
      const photoColNames = new Set(photoCols.map(c => c.Field));

      const alreadyDone = {
        '001_update_recipes_to_culinary_plans.sql': tableNames.has('recipes'),
        '004_create_photos_table.sql': tableNames.has('photos'),
        '005_create_culinary_photos_table.sql': tableNames.has('culinary_photos'),
        '006_enhance_users_table_for_auth.sql': userColNames.has('email'),
        '006_enhance_users_table_for_auth_v2.sql': userColNames.has('email'),
        '007_create_albums_table.sql': tableNames.has('albums') && photoColNames.has('album_id'),
      };

      for (const [name, done] of Object.entries(alreadyDone)) {
        if (done) {
          await connection.query(
            'INSERT IGNORE INTO schema_migrations (name) VALUES (?)', [name]
          );
          applied.add(name);
        }
      }
      if (applied.size) {
        console.log(`Adopted ${applied.size} pre-ledger migration(s) as already applied.\n`);
      }
    }

    const pending = migrations.filter(m => !applied.has(m));

    if (pending.length === 0) {
      console.log('Nothing to do - all migrations already applied.\n');
      console.log('==================================================');
      console.log('Migration Summary:');
      console.log(`  Applied earlier: ${migrations.length}`);
      console.log('==================================================\n');
      return;
    }

    console.log('Migrations to run:');
    pending.forEach(m => console.log(`  ${m}`));
    console.log('');

    let successCount = 0;
    let failCount = 0;

    for (const migration of pending) {
      const migrationPath = path.join(__dirname, 'database', 'migrations', migration);

      try {
        console.log(`Running: ${migration}`);

        const sql = await fs.readFile(migrationPath, 'utf8');
        await connection.query(sql);
        await connection.query(
          'INSERT IGNORE INTO schema_migrations (name) VALUES (?)', [migration]
        );

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
    console.log(`  Skipped (already applied): ${migrations.length - pending.length}`);
    console.log('==================================================\n');

    if (failCount === 0) {
      console.log('✓ All migrations completed successfully!\n');
    } else {
      console.log('⚠ Some migrations failed. Please check the errors above.\n');
      process.exitCode = 1;
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
