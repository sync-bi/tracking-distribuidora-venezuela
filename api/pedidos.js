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

    // Fecha por defecto: 15 de marzo 2026
    const fechaDesde = desde || '2026-03-15';

    // status en Profit: 0 = pendiente, 1 = parcial, 2 = completado (despachado/facturado)
    let filtroEstado = '';
    if (estado === 'pendientes') {
      filtroEstado = "AND p.status IN ('0', '1')";
    } else if (estado === 'despachados') {
      filtroEstado = "AND p.status = '2'";
    }
    // 'todos' o sin filtro = trae todo

    // Query principal: pedidos con cliente, coordenadas, vendedor y zona
    const result = await pool.request()
      .input('fechaDesde', sql.VarChar, fechaDesde)
      .query(`
        SELECT
          RTRIM(p.doc_num) AS numero_pedido,
          p.fec_emis AS fecha_emision,
          p.fec_venc AS fecha_vencimiento,
          p.total_neto,
          p.total_bruto,
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

    // Obtener renglones con info de pendientes
    const docNums = result.recordset.map(p => p.numero_pedido);

    let renglones = [];
    if (docNums.length > 0) {
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
          r.pendiente AS pendiente,
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
        pendiente: r.pendiente,
        despachado: r.cantidad - r.pendiente,
        precioUnitario: r.precio_unitario,
        montoRenglon: r.monto_renglon,
        almacen: r.codigo_almacen
      });
    });

    // Corregir coordenadas invertidas en zt_coordenada
    const corregirCoords = (v1Raw, v2Raw) => {
      const v1 = parseFloat(v1Raw);
      const v2 = parseFloat(v2Raw);
      if (isNaN(v1) || isNaN(v2)) return null;
      // Venezuela: lat ~1-12, lng ~-73 a -60
      if (v1 > 0 && v1 < 13) return { lat: v1, lng: v2 };
      if (v1 < 0) return { lat: v2, lng: v1 };
      return { lat: v1, lng: v2 };
    };

    // Geocodificar ciudades sin coordenadas usando Mapbox
    const geocodeCache = {};
    const geocodificarCiudad = async (ciudad) => {
      if (!ciudad || !process.env.REACT_APP_MAPBOX_TOKEN) return null;
      const key = ciudad.trim().toUpperCase();
      if (geocodeCache[key] !== undefined) return geocodeCache[key];

      try {
        const query = encodeURIComponent(`${ciudad}, Venezuela`);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&country=VE&limit=1`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.features && data.features[0]) {
          const [lng, lat] = data.features[0].center;
          geocodeCache[key] = { lat, lng, geocodificada: true };
          return geocodeCache[key];
        }
      } catch (err) {
        console.warn('Geocoding falló para:', ciudad, err.message);
      }
      geocodeCache[key] = null;
      return null;
    };

    // Determinar estado real del pedido
    const determinarEstado = (statusProfit, productos) => {
      // Status Profit: 0=Pendiente, 1=Parcial, 2=Completado
      if (statusProfit === '2') {
        const todoDespachado = productos.every(p => p.pendiente === 0);
        return todoDespachado ? 'Despachado' : 'Parcial';
      }
      if (statusProfit === '1') return 'Parcial';

      // Status 0: verificar si tiene algo despachado
      const algoDespachado = productos.some(p => p.despachado > 0);
      return algoDespachado ? 'Parcial' : 'Pendiente';
    };

    // Armar respuesta — geocodificar los que no tienen coordenadas
    const pedidos = [];
    for (const p of result.recordset) {
      const productos = renglonesPorPedido[p.numero_pedido] || [];
      let coordenadas = corregirCoords(p.coord_valor1, p.coord_valor2);
      const estadoDespacho = determinarEstado(p.status_pedido, productos);

      // Si no tiene coordenadas, geocodificar por ciudad
      if (!coordenadas && p.ciudad_cliente) {
        coordenadas = await geocodificarCiudad(p.ciudad_cliente);
      }

      // Calcular totales de despacho
      const totalUnidades = productos.reduce((s, pr) => s + pr.cantidad, 0);
      const totalPendiente = productos.reduce((s, pr) => s + pr.pendiente, 0);
      const totalDespachado = totalUnidades - totalPendiente;
      const porcentajeDespacho = totalUnidades > 0
        ? Math.round((totalDespachado / totalUnidades) * 100)
        : 0;

      pedidos.push({
        numeroPedido: p.numero_pedido,
        fechaEmision: p.fecha_emision,
        fechaVencimiento: p.fecha_vencimiento,
        totalNeto: p.total_neto,
        totalBruto: p.total_bruto,
        statusProfit: p.status_pedido,
        estadoDespacho,
        porcentajeDespacho,
        totalUnidades,
        totalDespachado,
        totalPendiente,
        codigoCliente: p.codigo_cliente,
        nombreCliente: p.nombre_cliente,
        direccionCliente: p.direccion_entrega || p.direccion_cliente,
        telefonoCliente: p.telefono_cliente,
        ciudadCliente: p.ciudad_cliente,
        codigoZona: p.codigo_zona,
        nombreZona: p.nombre_zona,
        codigoVendedor: p.codigo_vendedor,
        nombreVendedor: p.nombre_vendedor,
        coordenadas,
        productos
      });
    }

    // Resumen
    const resumen = {
      total: pedidos.length,
      pendientes: pedidos.filter(p => p.estadoDespacho === 'Pendiente').length,
      parciales: pedidos.filter(p => p.estadoDespacho === 'Parcial').length,
      despachados: pedidos.filter(p => p.estadoDespacho === 'Despachado').length
    };

    res.status(200).json({
      ok: true,
      fechaDesde,
      resumen,
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
