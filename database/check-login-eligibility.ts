import 'dotenv/config';
import pool from '../lib/db-pool';

async function checkLoginEligibility() {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        id, 
        username, 
        email, 
        email_verified, 
        account_status,
        CASE 
          WHEN email IS NULL THEN 'Can login (no email verification required)'
          WHEN email_verified = TRUE THEN 'Can login (email verified)'
          ELSE 'Cannot login (email not verified)'
        END as login_status
       FROM users 
       WHERE email IS NOT NULL
       ORDER BY created_at DESC`
    );
    
    console.log('\n✅ Users eligible to login:');
    console.table(rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLoginEligibility();
