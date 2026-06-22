// api/despachos.js — Origen de despachos desde NOTAS DE ENTREGA + FACTURAS
// -----------------------------------------------------------------------------
// Reunión 2026-05-27 (Sarego / Profit Plus):
//   - El despacho NO sale de la tabla de pedidos (saPedidoVenta). Un pedido no
//     genera movimiento de inventario; eso lo hacen la FACTURA o la NOTA DE ENTREGA.
//   - Se capturan AMBOS sentidos: notas con factura, notas sin factura y
//     facturas sin nota ("o viceversa", min 01:02:15).
//   - Regla de fecha: si hay fecha en nota Y en factura, el despacho se considera
//     hecho por NOTA DE ENTREGA y se usa la fecha de la nota como referencia (01:07:15).
//   - Dirección en cascada: nota.dir_ent -> factura.dir_ent -> ficha cliente
//     (dir_ent2) -> dirección fiscal (direc1) (00:53:17).
//   - Si la dirección no cumple requisitos mínimos (sin ciudad/estado), se marca
//     para REVISIÓN antes de despachar (00:20:58).
//   - Contacto secundario: se extrae si la columna existe en saCliente (00:24:24).
// -----------------------------------------------------------------------------
const { getPool, sql } = require('./lib/db');

// Columnas candidatas para "contacto secundario" en saCliente. Alexander las
// agregará del lado de Profit; aquí las detectamos dinámicamente para no romper
// la consulta si todavía no existen.
const COLS_CONTACTO_SECUNDARIO = [
  'contacto2', 'contac2', 'contacto_2', 'persona_contacto2',
  'representante2', 'telefonos2', 'telefono2', 'telef2'
];
const COLS_CONTACTO_PRINCIPAL = [
  'persona_con', 'contacto', 'persona_contacto', 'representante'
];

// Detecta qué columnas existen realmente en una tabla (una sola vez por request).
async function columnasExistentes(pool, tabla) {
  const r = await pool.request()
    .input('t', sql.VarChar, tabla)
    .query(`SELECT LOWER(COLUMN_NAME) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @t`);
  return new Set(r.recordset.map(x => x.c));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const pool = await getPool();

    const { desde } = req.query;
    const fechaDesde = desde || '2026-03-15';

    // --- Detección de columnas opcionales en saCliente ----------------------
    const colsCli = await columnasExistentes(pool, 'saCliente');
    const colContactoSec = COLS_CONTACTO_SECUNDARIO.find(c => colsCli.has(c)) || null;
    const colContactoPrin = COLS_CONTACTO_PRINCIPAL.find(c => colsCli.has(c)) || null;
    const tieneDirEnt2 = colsCli.has('dir_ent2');

    const selContactoSec = colContactoSec ? `RTRIM(cli.${colContactoSec})` : 'NULL';
    const selContactoPrin = colContactoPrin ? `RTRIM(cli.${colContactoPrin})` : 'NULL';
    const dirFichaCliente = tieneDirEnt2 ? 'cli.dir_ent2' : 'NULL';

    // --- Consulta principal de despachos ------------------------------------
    // Un despacho se identifica por su nota de entrega; si no tiene nota, por su
    // factura. Capturamos los tres casos: nota+factura, nota sola y factura sola.
    //
    // Vínculo: una línea de factura (saFacturaVentaReng.num_doc) referencia el
    // número de la nota de entrega que la originó.
    const query = `
      WITH fact_nota AS (
        SELECT DISTINCT RTRIM(fvr.doc_num) AS factura, RTRIM(fvr.num_doc) AS nota
        FROM saFacturaVentaReng fvr
        WHERE fvr.num_doc IS NOT NULL AND LTRIM(RTRIM(fvr.num_doc)) <> ''
      ),
      despachos AS (
        -- A) Notas de entrega (con su factura asociada si existe)
        SELECT
          RTRIM(nde.doc_num) AS nota,
          fn.factura          AS factura,
          nde.fec_emis        AS fecha_nota,
          RTRIM(nde.dir_ent)  AS dir_nota,
          RTRIM(nde.co_cli)   AS co_cli,
          nde.total_neto      AS neto_doc
        FROM saNotaEntregaVenta nde
        LEFT JOIN fact_nota fn ON fn.nota = RTRIM(nde.doc_num)
        WHERE nde.fec_emis >= @fechaDesde
          AND nde.anulado = 0

        UNION

        -- B) Facturas SIN nota de entrega asociada (viceversa)
        SELECT
          NULL                AS nota,
          RTRIM(fv.doc_num)   AS factura,
          NULL                AS fecha_nota,
          NULL                AS dir_nota,
          RTRIM(fv.co_cli)    AS co_cli,
          fv.total_neto       AS neto_doc
        FROM saFacturaVenta fv
        WHERE fv.fec_emis >= @fechaDesde
          AND fv.anulado = 0
          AND NOT EXISTS (SELECT 1 FROM fact_nota fn WHERE fn.factura = RTRIM(fv.doc_num))
      )
      SELECT
        d.nota                                   AS numero_nota,
        d.factura                                AS numero_factura,
        d.fecha_nota                             AS fecha_nota,
        fv.fec_emis                              AS fecha_factura,
        RTRIM(d.co_cli)                          AS codigo_cliente,
        d.dir_nota                               AS dir_nota,
        RTRIM(fv.dir_ent)                        AS dir_factura,
        ${dirFichaCliente}                       AS dir_ficha,
        RTRIM(cli.direc1)                        AS dir_fiscal,
        RTRIM(cli.cli_des)                       AS nombre_cliente,
        RTRIM(cli.telefonos)                     AS telefono_cliente,
        RTRIM(cli.ciudad)                        AS ciudad_cliente,
        RTRIM(cli.estado)                        AS estado_cliente,
        COALESCE(fv.total_neto, d.neto_doc)      AS total_neto,
        RTRIM(cli.co_zon)                        AS codigo_zona,
        RTRIM(z.zon_des)                         AS nombre_zona,
        RTRIM(cli.co_ven)                        AS codigo_vendedor,
        RTRIM(v.ven_des)                         AS nombre_vendedor,
        ${selContactoPrin}                       AS contacto_principal,
        ${selContactoSec}                        AS contacto_secundario,
        RTRIM(coord.longuitud)                   AS coord_valor1,
        RTRIM(coord.latitud)                     AS coord_valor2
      FROM despachos d
      LEFT JOIN saFacturaVenta fv ON RTRIM(fv.doc_num) = d.factura
      LEFT JOIN saCliente cli     ON RTRIM(cli.co_cli) = RTRIM(d.co_cli)
      LEFT JOIN saZona z          ON RTRIM(cli.co_zon) = RTRIM(z.co_zon)
      LEFT JOIN saVendedor v      ON RTRIM(cli.co_ven) = RTRIM(v.co_ven)
      LEFT JOIN zt_coordenada coord ON RTRIM(d.co_cli) = RTRIM(coord.co_cli)
      ORDER BY COALESCE(d.fecha_nota, fv.fec_emis) DESC
    `;

    const result = await pool.request()
      .input('fechaDesde', sql.VarChar, fechaDesde)
      .query(query);

    // --- Renglones (productos) por documento --------------------------------
    // Para no inflar la consulta principal, traemos los renglones aparte.
    // Si una columna o tabla de renglones no existe, no rompemos el endpoint.
    const facturas = [...new Set(result.recordset.map(d => d.numero_factura).filter(Boolean))];
    const notas = [...new Set(result.recordset.map(d => d.numero_nota).filter(Boolean))];
    const rengPorFactura = await traerRenglones(pool, 'saFacturaVentaReng', facturas);
    const rengPorNota = await traerRenglones(pool, 'saNotaEntregaVentaReng', notas);

    // --- Helpers de coordenadas y geocodificación (igual que api/pedidos) ---
    const corregirCoords = (v1Raw, v2Raw) => {
      const v1 = parseFloat(v1Raw);
      const v2 = parseFloat(v2Raw);
      if (isNaN(v1) || isNaN(v2)) return null;
      if (v1 > 0 && v1 < 13) return { lat: v1, lng: v2 };
      if (v1 < 0) return { lat: v2, lng: v1 };
      return { lat: v1, lng: v2 };
    };

    const geocodeCache = {};
    const geocodificarCiudad = async (ciudad) => {
      if (!ciudad || !process.env.REACT_APP_MAPBOX_TOKEN) return null;
      const key = ciudad.trim().toUpperCase();
      if (geocodeCache[key] !== undefined) return geocodeCache[key];
      try {
        const q = encodeURIComponent(`${ciudad}, Venezuela`);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&country=VE&limit=1`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.features && data.features[0]) {
          const [lng, lat] = data.features[0].center;
          geocodeCache[key] = { lat, lng, geocodificada: true };
          return geocodeCache[key];
        }
      } catch (_) {}
      geocodeCache[key] = null;
      return null;
    };

    // --- Armado de la respuesta --------------------------------------------
    const despachos = [];
    for (const d of result.recordset) {
      // Cascada de dirección
      const { direccion, fuente } = resolverDireccion(d);

      // Regla de fecha: nota manda sobre factura
      const tipoDocumento = d.numero_nota ? 'Nota de Entrega' : 'Factura';
      const fechaReferencia = d.fecha_nota || d.fecha_factura;
      // Documento que se usa como identificador del despacho
      const numeroDespacho = d.numero_nota || d.numero_factura;

      // Coordenadas — geocodifica por "ciudad, estado" si no hay coords
      let coordenadas = corregirCoords(d.coord_valor1, d.coord_valor2);
      if (!coordenadas && (d.ciudad_cliente || d.estado_cliente)) {
        const lugar = [d.ciudad_cliente, d.estado_cliente].filter(Boolean).join(', ');
        coordenadas = await geocodificarCiudad(lugar);
      }

      // Validación de dirección (¿requiere revisión?)
      const revision = validarDireccion(direccion, d.ciudad_cliente, d.estado_cliente, coordenadas);

      // Productos del despacho (factura primero; si no, nota)
      const productos =
        (d.numero_factura && rengPorFactura[d.numero_factura]) ||
        (d.numero_nota && rengPorNota[d.numero_nota]) ||
        [];

      despachos.push({
        // --- Campos compatibles con /api/pedidos (no romper el frontend) ---
        numeroPedido: numeroDespacho,
        fechaEmision: fechaReferencia,
        fechaVencimiento: null,
        codigoCliente: d.codigo_cliente,
        nombreCliente: d.nombre_cliente,
        direccionCliente: direccion,
        telefonoCliente: d.telefono_cliente,
        ciudadCliente: d.ciudad_cliente,
        estadoCliente: d.estado_cliente,
        codigoZona: d.codigo_zona,
        nombreZona: d.nombre_zona,
        codigoVendedor: d.codigo_vendedor,
        nombreVendedor: d.nombre_vendedor,
        coordenadas,
        productos,
        // Un despacho recién emitido entra al tracking como Pendiente (por rutear)
        estadoDespacho: 'Pendiente',
        porcentajeDespacho: 0,
        totalUnidades: productos.reduce((s, p) => s + (p.cantidad || 0), 0),
        totalDespachado: 0,
        totalPendiente: 0,
        totalNeto: d.total_neto != null ? Number(d.total_neto) : null,

        // --- Campos nuevos del modelo despacho -----------------------------
        tipoDocumento,
        numeroNota: d.numero_nota || null,
        numeroFactura: d.numero_factura || null,
        fechaNota: d.fecha_nota || null,
        fechaFactura: d.fecha_factura || null,
        fuenteDireccion: fuente,           // 'nota' | 'factura' | 'ficha' | 'fiscal' | 'ninguna'
        contactoPrincipal: d.contacto_principal || null,
        contactoSecundario: d.contacto_secundario || null,
        requiereRevision: revision.requiere,
        motivoRevision: revision.motivo
      });
    }

    const resumen = {
      total: despachos.length,
      porNota: despachos.filter(d => d.tipoDocumento === 'Nota de Entrega').length,
      porFactura: despachos.filter(d => d.tipoDocumento === 'Factura').length,
      requierenRevision: despachos.filter(d => d.requiereRevision).length,
      sinCoordenadas: despachos.filter(d => !d.coordenadas).length
    };

    res.status(200).json({
      ok: true,
      fechaDesde,
      origen: 'notas_entrega+facturas',
      columnasDetectadas: {
        contactoSecundario: colContactoSec,
        contactoPrincipal: colContactoPrin,
        dirEnt2: tieneDirEnt2
      },
      resumen,
      // Alias 'pedidos' para compatibilidad con los consumidores actuales
      pedidos: despachos,
      despachos
    });
  } catch (error) {
    console.error('Error API despachos:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al consultar despachos',
      detalle: error.message
    });
  }
};

// --- Cascada de dirección (nota -> factura -> ficha -> fiscal) ---------------
function resolverDireccion(d) {
  const limpia = (s) => (s && String(s).trim() ? String(s).trim() : null);
  const nota = limpia(d.dir_nota);
  const factura = limpia(d.dir_factura);
  const ficha = limpia(d.dir_ficha);
  const fiscal = limpia(d.dir_fiscal);
  if (nota) return { direccion: nota, fuente: 'nota' };
  if (factura) return { direccion: factura, fuente: 'factura' };
  if (ficha) return { direccion: ficha, fuente: 'ficha' };
  if (fiscal) return { direccion: fiscal, fuente: 'fiscal' };
  return { direccion: '', fuente: 'ninguna' };
}

// --- Validación de dirección: ¿requiere revisión manual? --------------------
// Criterio (reunión 00:20:58): sin ciudad/estado o claramente incompleta.
const ESTADOS_VE = [
  'amazonas', 'anzoategui', 'anzoátegui', 'apure', 'aragua', 'barinas', 'bolivar',
  'bolívar', 'carabobo', 'cojedes', 'delta amacuro', 'falcon', 'falcón', 'guarico',
  'guárico', 'lara', 'merida', 'mérida', 'miranda', 'monagas', 'nueva esparta',
  'portuguesa', 'sucre', 'tachira', 'táchira', 'trujillo', 'vargas', 'la guaira',
  'yaracuy', 'zulia', 'distrito capital', 'caracas'
];

function validarDireccion(direccion, ciudad, estado, coordenadas) {
  const dir = (direccion || '').trim();
  const ciu = (ciudad || '').trim();
  const est = (estado || '').trim();
  const motivos = [];

  if (!dir) motivos.push('Sin dirección');
  else if (dir.length < 10) motivos.push('Dirección demasiado corta');

  const texto = `${dir} ${ciu} ${est}`.toLowerCase();
  const tieneEstado = !!est || ESTADOS_VE.some(e => texto.includes(e));
  if (!ciu && !tieneEstado) motivos.push('Sin ciudad ni estado');

  if (!coordenadas) motivos.push('Sin coordenadas');

  return { requiere: motivos.length > 0, motivo: motivos.join('; ') || null };
}

// --- Renglones por documento (defensivo) ------------------------------------
async function traerRenglones(pool, tabla, docNums) {
  const out = {};
  if (!docNums || docNums.length === 0) return out;
  try {
    const batch = docNums.slice(0, 500);
    const placeholders = batch.map((_, i) => `@d${i}`).join(',');
    const reqr = pool.request();
    batch.forEach((doc, i) => reqr.input(`d${i}`, sql.VarChar(20), doc));
    const r = await reqr.query(`
      SELECT
        RTRIM(r.doc_num) AS doc_num,
        r.reng_num,
        RTRIM(r.co_art) AS codigo_articulo,
        COALESCE(RTRIM(r.des_art), RTRIM(a.art_des), RTRIM(r.co_art)) AS descripcion,
        r.total_art AS cantidad,
        r.prec_vta AS precio_unitario,
        r.reng_neto AS monto_renglon,
        RTRIM(r.co_alma) AS almacen
      FROM ${tabla} r
      LEFT JOIN saArticulo a ON RTRIM(r.co_art) = RTRIM(a.co_art)
      WHERE RTRIM(r.doc_num) IN (${placeholders})
      ORDER BY r.doc_num, r.reng_num
    `);
    for (const row of r.recordset) {
      if (!out[row.doc_num]) out[row.doc_num] = [];
      out[row.doc_num].push({
        renglon: row.reng_num,
        codigoArticulo: row.codigo_articulo,
        descripcion: row.descripcion,
        cantidad: row.cantidad,
        pendiente: 0,
        despachado: row.cantidad,
        precioUnitario: row.precio_unitario,
        montoRenglon: row.monto_renglon,
        almacen: row.almacen
      });
    }
  } catch (err) {
    console.warn(`No se pudieron traer renglones de ${tabla}:`, err.message);
  }
  return out;
}
