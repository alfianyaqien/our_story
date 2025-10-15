import 'dotenv/config';
import pool from '../lib/db-pool';

async function verifyColumns() {
  const [rows] = await pool.execute('DESCRIBE users');
  console.table(rows);
  process.exit(0);
}

verifyColumns();
