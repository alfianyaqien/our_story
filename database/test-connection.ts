import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('🔍 Testing MySQL Connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST}`);
  console.log(`  Port: ${process.env.DB_PORT}`);
  console.log(`  User: ${process.env.DB_USER}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : '(empty)'}`);
  console.log('');

  try {
    console.log('🔌 Connecting to MySQL server...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3307'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected successfully!');
    
    // Test query
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log(`📊 MySQL Version: ${(rows as any[])[0].version}`);
    
    // Show databases
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('\n📁 Available Databases:');
    (databases as any[]).forEach(db => {
      console.log(`  - ${db.Database}`);
    });
    
    await connection.end();
    console.log('\n✅ Connection test passed!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Suggestions:');
      console.error('  1. Check your DB_PASSWORD in .env file');
      console.error('  2. Verify user credentials with: mysql -u root -p -P 3307');
      console.error('  3. Make sure the user exists and has proper privileges');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Suggestions:');
      console.error('  1. Check if MySQL is running');
      console.error('  2. Verify the port (3307) is correct');
      console.error('  3. Check MySQL error logs');
    }
    
    process.exit(1);
  }
}

testConnection();
