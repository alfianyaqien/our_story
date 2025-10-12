import pool from './db-pool';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Initialize database schema
export async function initDatabase() {
  try {
    // Import and run initialization
    const { initializeDatabase } = await import('../database/init');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Helper function to execute queries
export async function query<T extends RowDataPacket[] | RowDataPacket[][] | ResultSetHeader>(
  sql: string,
  params?: any[]
): Promise<T> {
  const [rows] = await pool.execute<T>(sql, params);
  return rows;
}

// Helper function for transactions
export async function transaction<T>(
  callback: (connection: any) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
