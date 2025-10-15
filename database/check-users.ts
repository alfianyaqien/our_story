import 'dotenv/config';
import pool from '../lib/db-pool';

async function checkUsers() {
  const [rows] = await pool.execute(
    `SELECT id, username, email, email_verified, verification_token, account_status, created_at 
     FROM users 
     ORDER BY created_at DESC 
     LIMIT 5`
  );
  console.log('\n📋 Recent users:');
  console.table(rows);
  process.exit(0);
}

checkUsers();
