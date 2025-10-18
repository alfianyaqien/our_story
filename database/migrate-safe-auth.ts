import 'dotenv/config';
import pool from '../lib/db-pool';

async function checkAndAddColumn(
  columnName: string, 
  columnDefinition: string
): Promise<void> {
  try {
    // Check if column exists
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
      [process.env.DB_NAME, columnName]
    );

    if ((columns as any[]).length === 0) {
      // Column doesn't exist, add it
      console.log(`➕ Adding column: ${columnName}`);
      await pool.execute(`ALTER TABLE users ADD COLUMN ${columnName} ${columnDefinition}`);
      console.log(`✅ Column ${columnName} added successfully`);
    } else {
      console.log(`⏭️  Column ${columnName} already exists, skipping`);
    }
  } catch (error) {
    console.error(`❌ Error with column ${columnName}:`, error);
    throw error;
  }
}

async function checkAndAddIndex(indexName: string, indexDefinition: string): Promise<void> {
  try {
    // Check if index exists
    const [indexes] = await pool.execute(
      `SELECT INDEX_NAME 
       FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND INDEX_NAME = ?`,
      [process.env.DB_NAME, indexName]
    );

    if ((indexes as any[]).length === 0) {
      console.log(`➕ Adding index: ${indexName}`);
      await pool.execute(`CREATE INDEX ${indexName} ${indexDefinition}`);
      console.log(`✅ Index ${indexName} created successfully`);
    } else {
      console.log(`⏭️  Index ${indexName} already exists, skipping`);
    }
  } catch (error) {
    console.error(`❌ Error with index ${indexName}:`, error);
    // Don't throw for indexes, just log
  }
}

async function runSafeMigration() {
  console.log('🔄 Starting safe users table enhancement migration...\n');

  try {
    // Test database connection
    await pool.execute('SELECT 1');
    console.log('✅ Database connected successfully\n');

    // Add columns
    await checkAndAddColumn('email', 'VARCHAR(255) UNIQUE');
    await checkAndAddColumn('email_verified', 'BOOLEAN DEFAULT FALSE');
    await checkAndAddColumn('verification_token', 'VARCHAR(255)');
    await checkAndAddColumn('verification_token_expires', 'TIMESTAMP NULL');
    await checkAndAddColumn('reset_token', 'VARCHAR(255)');
    await checkAndAddColumn('reset_token_expires', 'TIMESTAMP NULL');
    await checkAndAddColumn('account_status', "ENUM('active', 'inactive', 'suspended') DEFAULT 'active'");
    await checkAndAddColumn('last_login', 'TIMESTAMP NULL');
    await checkAndAddColumn('failed_login_attempts', 'INT DEFAULT 0');
    await checkAndAddColumn('locked_until', 'TIMESTAMP NULL');
    await checkAndAddColumn('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    console.log('\n📊 Adding indexes...\n');

    // Add indexes
    await checkAndAddIndex('idx_email', 'ON users(email)');
    await checkAndAddIndex('idx_verification_token', 'ON users(verification_token)');
    await checkAndAddIndex('idx_reset_token', 'ON users(reset_token)');
    await checkAndAddIndex('idx_account_status', 'ON users(account_status)');

    console.log('\n✅ Migration completed successfully!');
    console.log('📧 New fields: email, email_verified, verification_token, reset_token, etc.');
    console.log('🔐 Account security features enabled');
    console.log('🎉 Your authentication system is ready!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runSafeMigration();
