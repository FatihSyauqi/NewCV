import mysql from 'mysql2/promise';

export async function query(sql, params) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'db_cv_fatih',
      port: parseInt(process.env.DB_PORT || '3306', 10),
    });
    
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
