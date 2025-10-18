import 'dotenv/config';
import pool from '../lib/db-pool';

async function checkAllUsers() {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        id, 
        username, 
        email, 
        email_verified, 
        SUBSTRING(verification_token, 1, 20) as token_preview,
        verification_token_expires,
        account_status, 
        created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    console.log('\n📋 All users in database:');
    console.table(rows);
    
    // Also check if there are any pending verifications
    const [pending] = await pool.execute(
      `SELECT COUNT(*) as count FROM users WHERE email_verified = FALSE AND email IS NOT NULL`
    );
    console.log('\n⏳ Pending email verifications:', (pending as any[])[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllUsers();
