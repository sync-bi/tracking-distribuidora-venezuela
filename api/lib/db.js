// api/lib/db.js — Pool de conexión compartido para SQL Server
const sql = require('mssql');

const config = {
  server: process.env.SQLSERVER_HOST,
  port: parseInt(process.env.SQLSERVER_PORT),
  database: process.env.SQLSERVER_DATABASE,
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

async function getPool() {
  if (pool) {
    try {
      // Verificar que sigue vivo
      await pool.request().query('SELECT 1');
      return pool;
    } catch {
      pool = null;
    }
  }
  pool = await sql.connect(config);
  return pool;
}

module.exports = { getPool, sql };
