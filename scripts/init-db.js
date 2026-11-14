require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initialize() {
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'lab_quimica';
  if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error('El nombre de base de datos tiene caracteres no admitidos.');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || process.env.TIDB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.TIDB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.TIDB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.TIDB_PASSWORD || process.env.MYSQLPASSWORD || '',
    ssl: process.env.TIDB_ENABLE_SSL === 'true' || process.env.DB_SSL === 'true'
      ? { minVersion: 'TLSv1.2' }
      : undefined,
    multipleStatements: true
  });

  try {
    let schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    schema = schema.replaceAll('lab_quimica', database);
    await connection.query(schema);

    await connection.query(`USE \`${database}\``);
    const [columns] = await connection.query('SHOW COLUMNS FROM prestamos LIKE \'usuario_id\'');
    if (!columns.length) {
      await connection.query('ALTER TABLE prestamos ADD COLUMN usuario_id INT NULL AFTER material_id');
      await connection.query('ALTER TABLE prestamos ADD INDEX idx_prestamo_usuario(usuario_id)');
      await connection.query('ALTER TABLE prestamos ADD CONSTRAINT fk_prestamo_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL');
    }
    console.log(`Esquema de Lab Química inicializado en ${database}.`);
  } finally {
    await connection.end();
  }
}

initialize().catch(error => {
  console.error(`No se pudo inicializar MySQL: ${error.message}`);
  process.exit(1);
});
