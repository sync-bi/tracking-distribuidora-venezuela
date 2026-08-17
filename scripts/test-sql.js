// Script para probar conexión a SQL Server y explorar tablas
require('dotenv').config();
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
  requestTimeout: 15000
};

async function main() {
  try {
    console.log('Conectando a SQL Server...');
    console.log(`Host: ${config.server}:${config.port}`);
    console.log(`DB: ${config.database}`);

    const pool = await sql.connect(config);
    console.log('✅ Conexión exitosa!\n');

    // Listar tablas
    const tablas = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);

    console.log('=== TABLAS ===');
    tablas.recordset.forEach(t => {
      console.log(`  ${t.TABLE_SCHEMA}.${t.TABLE_NAME}`);
    });

    // Buscar tablas que parezcan de clientes o pedidos
    console.log('\n=== TABLAS RELEVANTES (cliente/pedido/factura/orden) ===');
    const relevantes = tablas.recordset.filter(t => {
      const name = t.TABLE_NAME.toLowerCase();
      return name.includes('client') || name.includes('pedid') ||
             name.includes('factur') || name.includes('orden') ||
             name.includes('orden') || name.includes('direc') ||
             name.includes('articul') || name.includes('product') ||
             name.includes('vendedor') || name.includes('despacho');
    });

    for (const t of relevantes) {
      console.log(`\n--- ${t.TABLE_SCHEMA}.${t.TABLE_NAME} ---`);
      const cols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${t.TABLE_NAME}' AND TABLE_SCHEMA = '${t.TABLE_SCHEMA}'
        ORDER BY ORDINAL_POSITION
      `);
      cols.recordset.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`    ${c.COLUMN_NAME} ${c.DATA_TYPE}${len}`);
      });

      // Mostrar 2 filas de ejemplo
      const sample = await pool.request().query(
        `SELECT TOP 2 * FROM [${t.TABLE_SCHEMA}].[${t.TABLE_NAME}]`
      );
      if (sample.recordset.length > 0) {
        console.log(`  Ejemplo: ${JSON.stringify(sample.recordset[0]).substring(0, 300)}`);
      }
    }

    await pool.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
