// api/pedidos.js — API para obtener pedidos desde SQL Server
const { getPool, sql } = require('./lib/db');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const pool = await getPool();

    // Parámetros de filtro
    const { desde, estado } = req.query;

    // Fecha por defecto: últimos 15 días
    const fechaDesde = desde || new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // status en Profit: 0 = pendiente, 1 = parcial, 2 = completado
    let filtroEstado = '';
    if (estado === 'pendientes') {
      filtroEstado = "AND p.status IN ('0', '1')";
    } else if (estado === 'completados') {
      filtroEstado = "AND p.status = '2'";
    }

    // Query principal: pedidos con cliente, coordenadas, vendedor y zona
    const result = await pool.request()
      .input('fechaDesde', sql.VarChar, fechaDesde)
      .query(`
        SELECT
          RTRIM(p.doc_num) AS numero_pedido,
          p.fec_emis AS fecha_emision,
          p.fec_venc AS fecha_vencimiento,
          p.total_neto,
          p.status AS status_pedido,
          p.anulado,
          RTRIM(p.co_ven) AS codigo_vendedor,
          RTRIM(p.dir_ent) AS direccion_entrega,
          RTRIM(p.co_cli) AS codigo_cliente,
          RTRIM(c.cli_des) AS nombre_cliente,
          RTRIM(c.direc1) AS direccion_cliente,
          RTRIM(c.telefonos) AS telefono_cliente,
          RTRIM(c.ciudad) AS ciudad_cliente,
          RTRIM(c.co_zon) AS codigo_zona,
          RTRIM(z.zon_des) AS nombre_zona,
          RTRIM(v.ven_des) AS nombre_vendedor,
          RTRIM(coord.longuitud) AS coord_valor1,
          RTRIM(coord.latitud) AS coord_valor2
        FROM saPedidoVenta p
        LEFT JOIN saCliente c ON RTRIM(p.co_cli) = RTRIM(c.co_cli)
        LEFT JOIN saZona z ON RTRIM(c.co_zon) = RTRIM(z.co_zon)
        LEFT JOIN saVendedor v ON RTRIM(p.co_ven) = RTRIM(v.co_ven)
        LEFT JOIN zt_coordenada coord ON RTRIM(p.co_cli) = RTRIM(coord.co_cli)
        WHERE p.anulado = 0
          AND p.fec_emis >= @fechaDesde
          ${filtroEstado}
        ORDER BY p.fec_emis DESC
      `);

    // Obtener renglones de todos los pedidos encontrados
    const docNums = result.recordset.map(p => p.numero_pedido);

    let renglones = [];
    if (docNums.length > 0) {
      // Construir lista de doc_nums para IN clause (en batches si son muchos)
      const batch = docNums.slice(0, 500);
      const placeholders = batch.map((_, i) => `@doc${i}`).join(',');
      const rengRequest = pool.request();
      batch.forEach((doc, i) => rengRequest.input(`doc${i}`, sql.Char(20), doc));

      const rengResult = await rengRequest.query(`
        SELECT
          RTRIM(r.doc_num) AS numero_pedido,
          r.reng_num,
          RTRIM(r.co_art) AS codigo_articulo,
          COALESCE(RTRIM(r.des_art), RTRIM(a.art_des), RTRIM(r.co_art)) AS descripcion_articulo,
          r.total_art AS cantidad,
          r.prec_vta AS precio_unitario,
          r.reng_neto AS monto_renglon,
          RTRIM(r.co_alma) AS codigo_almacen
        FROM saPedidoVentaReng r
        LEFT JOIN saArticulo a ON RTRIM(r.co_art) = RTRIM(a.co_art)
        WHERE RTRIM(r.doc_num) IN (${placeholders})
        ORDER BY r.doc_num, r.reng_num
      `);

      renglones = rengResult.recordset;
    }

    // Agrupar renglones por pedido
    const renglonesPorPedido = {};
    renglones.forEach(r => {
      if (!renglonesPorPedido[r.numero_pedido]) {
        renglonesPorPedido[r.numero_pedido] = [];
      }
      renglonesPorPedido[r.numero_pedido].push({
        renglon: r.reng_num,
        codigoArticulo: r.codigo_articulo,
        descripcion: r.descripcion_articulo,
        cantidad: r.cantidad,
        precioUnitario: r.precio_unitario,
        montoRenglon: r.monto_renglon,
        almacen: r.codigo_almacen
      });
    });

    // Armar respuesta con coordenadas corregidas
    const pedidos = result.recordset.map(p => {
      // Corregir coordenadas invertidas en zt_coordenada
      let lat = null, lng = null;
      const v1 = parseFloat(p.coord_valor1);
      const v2 = parseFloat(p.coord_valor2);
      if (!isNaN(v1) && !isNaN(v2)) {
        // Venezuela: lat ~1-12, lng ~-73 a -60
        // Si valor1 es positivo y <13 → es latitud; si es negativo → es longitud
        if (v1 > 0 && v1 < 13) {
          lat = v1;
          lng = v2;
        } else if (v1 < 0) {
          lat = v2;
          lng = v1;
        } else {
          lat = v1;
          lng = v2;
        }
      }

      return {
        numeroPedido: p.numero_pedido,
        fechaEmision: p.fecha_emision,
        fechaVencimiento: p.fecha_vencimiento,
        totalNeto: p.total_neto,
        status: p.status_pedido === '0' ? 'Pendiente' : p.status_pedido === '1' ? 'Parcial' : 'Completado',
        codigoCliente: p.codigo_cliente,
        nombreCliente: p.nombre_cliente,
        direccionCliente: p.direccion_entrega || p.direccion_cliente,
        telefonoCliente: p.telefono_cliente,
        ciudadCliente: p.ciudad_cliente,
        codigoZona: p.codigo_zona,
        nombreZona: p.nombre_zona,
        codigoVendedor: p.codigo_vendedor,
        nombreVendedor: p.nombre_vendedor,
        coordenadas: lat !== null ? { lat, lng } : null,
        productos: renglonesPorPedido[p.numero_pedido] || []
      };
    });

    res.status(200).json({
      ok: true,
      total: pedidos.length,
      fechaDesde,
      pedidos
    });
  } catch (error) {
    console.error('Error API pedidos:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al consultar pedidos',
      detalle: error.message
    });
  }
};
