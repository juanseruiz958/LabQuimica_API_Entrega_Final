const mysql = require('mysql2/promise');
module.exports = mysql.createPool({
  host: process.env.DB_HOST || process.env.TIDB_HOST || process.env.MYSQLHOST || 'localhost',
  port: Number(process.env.DB_PORT || process.env.TIDB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.DB_USER || process.env.TIDB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.TIDB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.TIDB_DATABASE || process.env.MYSQLDATABASE || 'lab_quimica',
  ssl: process.env.TIDB_ENABLE_SSL === 'true' || process.env.DB_SSL === 'true'
    ? { minVersion: 'TLSv1.2' }
    : undefined,
  waitForConnections: true, connectionLimit: 10, maxIdle: 5,
  idleTimeout: 240000, queueLimit: 0, dateStrings: true
});
