// Check Database State
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'our_story'
  };

  const connection = await mysql.createConnection(config);

  console.log('Checking database tables...\n');

  // Get all tables
  const [tables] = await connection.query('SHOW TABLES');
  console.log('Existing tables:');
  tables.forEach(row => {
    const tableName = Object.values(row)[0];
    console.log(`  ✓ ${tableName}`);
  });

  console.log('\n==================================================\n');

  // Check if recipes table exists
  const [recipeCheck] = await connection.query(
    "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'recipes'",
    [config.database]
  );
  
  if (recipeCheck[0].count > 0) {
    console.log('✓ recipes table exists');
  } else {
    console.log('✗ recipes table does NOT exist');
  }

  // Check if albums table exists
  const [albumCheck] = await connection.query(
    "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'albums'",
    [config.database]
  );
  
  if (albumCheck[0].count > 0) {
    console.log('✓ albums table exists');
    
    // Check albums table structure
    const [albumCols] = await connection.query('SHOW COLUMNS FROM albums');
    console.log('\n  Albums table columns:');
    albumCols.forEach(col => {
      console.log(`    - ${col.Field} (${col.Type})`);
    });
  } else {
    console.log('✗ albums table does NOT exist');
  }

  // Check photos table
  const [photoCheck] = await connection.query(
    "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'photos'",
    [config.database]
  );
  
  if (photoCheck[0].count > 0) {
    console.log('\n✓ photos table exists');
    
    const [photoCols] = await connection.query('SHOW COLUMNS FROM photos');
    console.log('\n  Photos table columns:');
    photoCols.forEach(col => {
      console.log(`    - ${col.Field} (${col.Type})`);
    });
  }

  // Check users table
  const [userCols] = await connection.query('SHOW COLUMNS FROM users');
  console.log('\n✓ users table columns:');
  userCols.forEach(col => {
    console.log(`    - ${col.Field} (${col.Type})`);
  });

  await connection.end();
}

checkDatabase().catch(console.error);
