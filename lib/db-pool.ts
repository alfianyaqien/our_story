import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * A single connection pool for the whole process.
 *
 * This module used to create the pool at import time with no caching. Next's
 * dev server re-evaluates modules on every hot reload, so each edit built a
 * fresh pool and abandoned the previous one's sockets - they stayed open,
 * sleeping, until MySQL ran out. An editing session was enough to reach 147
 * connections against a default max_connections of 151, at which point every
 * query in the app failed and the whole thing returned 500s.
 *
 * Caching on globalThis means a reload reuses the existing pool. Production
 * gets the same single pool per process.
 */
const globalForDb = globalThis as unknown as {
  __ourStoryPool?: mysql.Pool;
};

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'our_story',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

const pool = globalForDb.__ourStoryPool ?? createPool();

if (!globalForDb.__ourStoryPool) {
  globalForDb.__ourStoryPool = pool;

  // Probe once, on first creation only. Doing this at module scope on every
  // reload was itself checking out a connection each time.
  pool
    .getConnection()
    .then((connection) => {
      console.log('✅ MySQL Database connected successfully');
      connection.release();
    })
    .catch((err) => {
      console.error('❌ MySQL connection error:', err.message);
    });
}

export default pool;
