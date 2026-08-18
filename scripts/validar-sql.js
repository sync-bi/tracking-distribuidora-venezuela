// Valida la sintaxis de los scripts de scripts/sql contra SQL Server.
//
// Usa SET PARSEONLY ON: el motor analiza cada lote y reporta errores de sintaxis
// SIN EJECUTAR NADA. No crea, no modifica y no borra. Es seguro correrlo contra
// produccion.
//
//   node scripts/validar-sql.js
//
// Credenciales: SQLSERVER_* en .env.local
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const sql = require('mssql');
const fs = require('fs');
const path = 'scripts/sql';

(async () => {
  let pool;
  try {
    pool = await sql.connect({
      server: process.env.SQLSERVER_HOST,
      port: parseInt(process.env.SQLSERVER_PORT) || 1433,
      database: process.env.SQLSERVER_DATABASE,
      user: process.env.SQLSERVER_USER,
      password: process.env.SQLSERVER_PASSWORD,
      options: { encrypt: false, trustServerCertificate: true },
      connectionTimeout: 8000
    });
  } catch (e) {
    console.log('SIN CONEXION a SQL Server:', e.message);
    console.log('(no se pudo validar contra el motor)');
    process.exit(3);
  }

  for (const f of fs.readdirSync(path).filter(x => x.endsWith('.sql')).sort()) {
    const raw = fs.readFileSync(`${path}/${f}`, 'utf8');
    const lotes = raw.split(/^\s*GO\s*$/mi).map(b => b.trim()).filter(Boolean);
    let errores = 0;
    for (let i = 0; i < lotes.length; i++) {
      try {
        await pool.request().batch(`SET PARSEONLY ON;\n${lotes[i]}`);
      } catch (e) {
        errores++;
        console.log(`  ${f} lote ${i + 1}: ${e.message.split('\n')[0]}`);
      }
    }
    console.log(`${errores === 0 ? 'OK  ' : 'FALLA'} ${f}  (${lotes.length} lotes, ${errores} con error)`);
  }
  await pool.close();
})();
