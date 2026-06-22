// scripts/test-despachos.js
// Valida la lógica de despachos (notas de entrega + facturas) contra el SQL real.
// Uso:  node scripts/test-despachos.js [YYYY-MM-DD]
//
// 1) Introspecciona las tablas clave para confirmar nombres de columnas.
// 2) Cuenta documentos por tipo.
// 3) Corre la consulta de despachos y muestra ejemplos + estadísticas de revisión.
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

const config = {
  server: process.env.SQLSERVER_HOST,
  port: parseInt(process.env.SQLSERVER_PORT),
  database: process.env.SQLSERVER_DATABASE,
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true },
  connectionTimeout: 15000,
  requestTimeout: 60000
};

const fechaDesde = process.argv[2] || '2026-03-15';

const TABLAS = [
  'saNotaEntregaVenta',
  'saNotaEntregaVentaReng',
  'saFacturaVenta',
  'saFacturaVentaReng',
  'saCliente'
];

async function main() {
  let pool;
  try {
    console.log(`Conectando a ${config.server}:${config.port}/${config.database} ...`);
    pool = await sql.connect(config);
    console.log('Conexión OK\n');

    // 1) Esquema de las tablas clave
    for (const t of TABLAS) {
      const cols = await pool.request()
        .input('t', sql.VarChar, t)
        .query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=@t ORDER BY ORDINAL_POSITION`);
      if (cols.recordset.length === 0) {
        console.log(`[!] Tabla NO encontrada: ${t}`);
        continue;
      }
      console.log(`=== ${t} (${cols.recordset.length} columnas) ===`);
      console.log('    ' + cols.recordset.map(c => c.COLUMN_NAME).join(', '));

      // Marcar columnas que nos importan
      const set = new Set(cols.recordset.map(c => c.COLUMN_NAME.toLowerCase()));
      const importantes = {
        saNotaEntregaVenta: ['doc_num', 'fec_emis', 'dir_ent', 'co_cli'],
        saFacturaVenta: ['doc_num', 'fec_emis', 'dir_ent', 'co_cli'],
        saFacturaVentaReng: ['doc_num', 'num_doc'],
        saNotaEntregaVentaReng: ['doc_num'],
        saCliente: ['co_cli', 'direc1', 'dir_ent2', 'ciudad', 'telefonos']
      }[t] || [];
      const faltan = importantes.filter(c => !set.has(c));
      if (faltan.length) console.log(`    [!] Faltan columnas esperadas: ${faltan.join(', ')}`);

      // Candidatas a contacto secundario en saCliente
      if (t === 'saCliente') {
        const cands = [...set].filter(c => /contac|represent|telef|persona/.test(c));
        console.log(`    Columnas de contacto/teléfono: ${cands.join(', ') || '(ninguna)'}`);
      }
      console.log('');
    }

    // 2) Conteos
    const cNotas = await pool.request().input('f', sql.VarChar, fechaDesde)
      .query(`SELECT COUNT(*) n FROM saNotaEntregaVenta WHERE fec_emis >= @f`);
    const cFact = await pool.request().input('f', sql.VarChar, fechaDesde)
      .query(`SELECT COUNT(*) n FROM saFacturaVenta WHERE fec_emis >= @f`);
    console.log(`Desde ${fechaDesde}:  notas de entrega = ${cNotas.recordset[0].n}, facturas = ${cFact.recordset[0].n}\n`);

    // 3) Consulta de despachos (TOP 20)
    const query = `
      WITH fact_nota AS (
        SELECT DISTINCT RTRIM(fvr.doc_num) AS factura, RTRIM(fvr.num_doc) AS nota
        FROM saFacturaVentaReng fvr
        WHERE fvr.num_doc IS NOT NULL AND LTRIM(RTRIM(fvr.num_doc)) <> ''
      ),
      despachos AS (
        SELECT RTRIM(nde.doc_num) AS nota, fn.factura AS factura,
               nde.fec_emis AS fecha_nota, RTRIM(nde.dir_ent) AS dir_nota, RTRIM(nde.co_cli) AS co_cli
        FROM saNotaEntregaVenta nde
        LEFT JOIN fact_nota fn ON fn.nota = RTRIM(nde.doc_num)
        WHERE nde.fec_emis >= @f
        UNION
        SELECT NULL, RTRIM(fv.doc_num), NULL, NULL, RTRIM(fv.co_cli)
        FROM saFacturaVenta fv
        WHERE fv.fec_emis >= @f
          AND NOT EXISTS (SELECT 1 FROM fact_nota fn WHERE fn.factura = RTRIM(fv.doc_num))
      )
      SELECT TOP 20
        d.nota AS numero_nota, d.factura AS numero_factura,
        d.fecha_nota, fv.fec_emis AS fecha_factura,
        RTRIM(d.co_cli) AS codigo_cliente, RTRIM(cli.cli_des) AS nombre_cliente,
        d.dir_nota, RTRIM(fv.dir_ent) AS dir_factura,
        RTRIM(cli.dir_ent2) AS dir_ficha, RTRIM(cli.direc1) AS dir_fiscal,
        RTRIM(cli.ciudad) AS ciudad
      FROM despachos d
      LEFT JOIN saFacturaVenta fv ON RTRIM(fv.doc_num) = d.factura
      LEFT JOIN saCliente cli ON RTRIM(cli.co_cli) = RTRIM(d.co_cli)
      ORDER BY COALESCE(d.fecha_nota, fv.fec_emis) DESC
    `;
    const r = await pool.request().input('f', sql.VarChar, fechaDesde).query(query);
    console.log(`=== Ejemplos de despacho (${r.recordset.length}) ===`);
    r.recordset.forEach(d => {
      const dir = d.dir_nota || d.dir_factura || d.dir_ficha || d.dir_fiscal || '(VACÍA)';
      const fuente = d.dir_nota ? 'nota' : d.dir_factura ? 'factura' : d.dir_ficha ? 'ficha' : d.dir_fiscal ? 'fiscal' : 'ninguna';
      const tipo = d.numero_nota ? 'NE' : 'FA';
      console.log(`  [${tipo}] nota=${d.numero_nota || '-'} fact=${d.numero_factura || '-'} | ${d.nombre_cliente || '?'} | dir(${fuente}): ${String(dir).substring(0, 60)}`);
    });

    await pool.close();
    console.log('\nListo.');
  } catch (err) {
    console.error('ERROR:', err.message);
    if (pool) await pool.close();
    process.exit(1);
  }
}

main();
