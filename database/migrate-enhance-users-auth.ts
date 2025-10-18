import pool from '@/lib/database';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  try {
    console.log('🔄 Starting users table enhancement migration...');

    // Read SQL file
    const sqlPath = join(process.cwd(), 'database', 'migrations', '006_enhance_users_table_for_auth.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    // Split by statements and execute each
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      await pool.execute(statement);
    }

    console.log('✅ Users table enhanced successfully!');
    console.log('📧 New fields added: email, email_verified, verification_token, reset_token, etc.');
    console.log('🔐 Account security features enabled');
    console.log('🎉 Migration completed!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
