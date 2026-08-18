// api/estado.js — Métricas de estado del proyecto, medidas contra Profit Plus.
//
// Alimenta la página /estado.html, que se actualiza sola cada vez que se abre.
// Corre en Vercel, que ya tiene las credenciales de SQL Server configuradas: no
// hace falta nada del lado local ni exponer la base a ningún sitio nuevo.
//
// Solo hace SELECT. No modifica la base.
const { getPool } = require('./lib/db');

// Venezuela. Fuera de esta caja, una coordenada es dato corrupto y no una ubicación.
const LAT_MIN = 0.6, LAT_MAX = 12.3, LNG_MIN = -73.4, LNG_MAX = -59.7;
const DIAS_VENTANA = 90;

const COORD_SANA = `
  TRY_CAST(latitud    AS DECIMAL(18,10)) BETWEEN ${LAT_MIN} AND ${LAT_MAX}
  AND TRY_CAST(longuitud AS DECIMAL(18,10)) BETWEEN ${LNG_MIN} AND ${LNG_MAX}`;

const DESDE = `DATEADD(DAY, -${DIAS_VENTANA}, CAST(GETDATE() AS DATE))`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  // Estas son cifras del negocio del cliente. Si ESTADO_TOKEN está configurado en
  // Vercel, se exige; si no lo está, el endpoint responde igual pero lo advierte,
  // para que quede a la vista que la página está abierta a quien tenga la URL.
  const tokenEsperado = process.env.ESTADO_TOKEN;
  if (tokenEsperado && req.query.t !== tokenEsperado) {
    return res.status(401).json({ ok: false, error: 'Token inválido' });
  }

  // Los datos cambian al ritmo del reparto: media hora de caché evita golpear el
  // ERP en cada recarga sin que la página se sienta vieja.
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  try {
    const pool = await getPool();
    const q = (texto) => pool.request().query(texto);

    const [clientes, coords, cobertura, ciudades, dupes, tablas] = await Promise.all([
      q(`SELECT COUNT(*) AS n FROM saCliente`),

      q(`SELECT COUNT(*) AS filas,
                SUM(CASE WHEN ${COORD_SANA} THEN 1 ELSE 0 END) AS sanas
         FROM zt_coordenada`),

      q(`WITH ubic AS (
           SELECT DISTINCT RTRIM(co_cli) co_cli FROM zt_coordenada WHERE ${COORD_SANA}),
         desp AS (
           SELECT DISTINCT RTRIM(co_cli) co_cli FROM saNotaEntregaVenta
           WHERE anulado = 0 AND fec_emis >= ${DESDE}
           UNION
           SELECT DISTINCT RTRIM(co_cli) FROM saFacturaVenta
           WHERE anulado = 0 AND fec_emis >= ${DESDE})
         SELECT (SELECT COUNT(*) FROM ubic) AS ubicables,
                (SELECT COUNT(*) FROM desp) AS con_despacho,
                (SELECT COUNT(*) FROM desp d INNER JOIN ubic u ON u.co_cli = d.co_cli)
                  AS ubicables_con_despacho`),

      q(`WITH ubic AS (
           SELECT DISTINCT RTRIM(co_cli) co_cli FROM zt_coordenada WHERE ${COORD_SANA}),
         desp AS (
           SELECT RTRIM(co_cli) co_cli FROM saNotaEntregaVenta
           WHERE anulado = 0 AND fec_emis >= ${DESDE}
           UNION ALL
           SELECT RTRIM(co_cli) FROM saFacturaVenta
           WHERE anulado = 0 AND fec_emis >= ${DESDE})
         SELECT TOP 8 RTRIM(cli.ciudad) AS ciudad,
                COUNT(DISTINCT d.co_cli) AS clientes,
                COUNT(*) AS documentos
         FROM desp d
         INNER JOIN ubic u ON u.co_cli = d.co_cli
         LEFT JOIN saCliente cli ON RTRIM(cli.co_cli) = d.co_cli
         GROUP BY RTRIM(cli.ciudad)
         ORDER BY clientes DESC`),

      q(`SELECT COUNT(*) AS n FROM (
           SELECT RTRIM(num_doc) x FROM saFacturaVentaReng
           WHERE num_doc IS NOT NULL AND LTRIM(RTRIM(num_doc)) <> ''
           GROUP BY RTRIM(num_doc) HAVING COUNT(DISTINCT RTRIM(doc_num)) > 1) t`),

      q(`SELECT name FROM sys.tables WHERE name LIKE 'zt[_]%' ORDER BY name`)
    ]);

    const tablasZt = tablas.recordset.map(r => r.name);
    const esperadas = ['zt_despacho', 'zt_despacho_doc', 'zt_entrega',
                       'zt_entrega_reng', 'zt_incidencia'];

    res.status(200).json({
      ok: true,
      medidoEn: new Date().toISOString(),
      diasVentana: DIAS_VENTANA,
      protegido: Boolean(tokenEsperado),
      clientesTotal: clientes.recordset[0].n,
      coordFilas: coords.recordset[0].filas,
      ubicables: cobertura.recordset[0].ubicables,
      conDespacho: cobertura.recordset[0].con_despacho,
      ubicablesConDespacho: cobertura.recordset[0].ubicables_con_despacho,
      ciudades: ciudades.recordset,
      notasDuplicadas: dupes.recordset[0].n,
      tablasZt,
      tablasFaltantes: esperadas.filter(t => !tablasZt.includes(t))
    });
  } catch (error) {
    console.error('Error API estado:', error);
    res.status(500).json({ ok: false, error: 'No se pudo consultar el ERP', detalle: error.message });
  }
};
