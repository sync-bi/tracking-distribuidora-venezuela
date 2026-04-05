// api/clientes.js — API para obtener clientes desde SQL Server
const { getPool } = require('./lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const pool = await getPool();

    const { buscar, zona, vendedor, activos } = req.query;

    let filtros = 'WHERE 1=1';
    if (activos !== 'false') filtros += ' AND c.inactivo = 0';
    if (zona) filtros += ` AND RTRIM(c.co_zon) = '${zona.replace(/'/g, "''")}'`;
    if (vendedor) filtros += ` AND RTRIM(c.co_ven) = '${vendedor.replace(/'/g, "''")}'`;
    if (buscar) {
      const term = buscar.replace(/'/g, "''");
      filtros += ` AND (c.cli_des LIKE '%${term}%' OR c.co_cli LIKE '%${term}%' OR c.direc1 LIKE '%${term}%')`;
    }

    const result = await pool.request().query(`
      SELECT TOP 1000
        RTRIM(c.co_cli) AS codigo,
        RTRIM(c.cli_des) AS nombre,
        RTRIM(c.direc1) AS direccion,
        RTRIM(c.telefonos) AS telefono,
        RTRIM(c.ciudad) AS ciudad,
        RTRIM(c.co_zon) AS codigoZona,
        RTRIM(z.zon_des) AS nombreZona,
        RTRIM(c.co_ven) AS codigoVendedor,
        RTRIM(v.ven_des) AS nombreVendedor,
        RTRIM(c.rif) AS rif,
        RTRIM(c.email) AS email,
        c.inactivo,
        RTRIM(coord.longuitud) AS coord_valor1,
        RTRIM(coord.latitud) AS coord_valor2
      FROM saCliente c
      LEFT JOIN saZona z ON RTRIM(c.co_zon) = RTRIM(z.co_zon)
      LEFT JOIN saVendedor v ON RTRIM(c.co_ven) = RTRIM(v.co_ven)
      LEFT JOIN zt_coordenada coord ON RTRIM(c.co_cli) = RTRIM(coord.co_cli)
      ${filtros}
      ORDER BY c.cli_des
    `);

    // Geocodificar ciudades sin coordenadas
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
      } catch (_) {}
      geocodeCache[key] = null;
      return null;
    };

    const clientes = [];
    for (const c of result.recordset) {
      let coords = null;
      const v1 = parseFloat(c.coord_valor1);
      const v2 = parseFloat(c.coord_valor2);
      if (!isNaN(v1) && !isNaN(v2)) {
        if (v1 > 0 && v1 < 13) { coords = { lat: v1, lng: v2 }; }
        else if (v1 < 0) { coords = { lat: v2, lng: v1 }; }
        else { coords = { lat: v1, lng: v2 }; }
      }

      // Geocodificar si no tiene coordenadas
      if (!coords && c.ciudad) {
        coords = await geocodificarCiudad(c.ciudad);
      }

      clientes.push({
        codigo: c.codigo,
        nombre: c.nombre,
        direccion: c.direccion,
        telefono: c.telefono,
        ciudad: c.ciudad,
        codigoZona: c.codigoZona,
        nombreZona: c.nombreZona,
        codigoVendedor: c.codigoVendedor,
        nombreVendedor: c.nombreVendedor,
        rif: c.rif,
        email: c.email,
        activo: !c.inactivo,
        coordenadas: coords
      });
    }

    res.status(200).json({
      ok: true,
      total: clientes.length,
      clientes
    });
  } catch (error) {
    console.error('Error API clientes:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al consultar clientes',
      detalle: error.message
    });
  }
};
