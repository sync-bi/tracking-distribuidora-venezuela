import { CIUDADES_VENEZUELA } from './constants';
// src/utils/importers.js

// Normaliza cabeceras: sin tildes, minúsculas, solo alfanumérico
const normalize = (s = '') => s
  .toString()
  .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')
  .trim();

// Convierte serial de Excel (días desde 1899-12-30) a YYYY-MM-DD
const excelSerialToISO = (val) => {
  if (val == null) return '';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // ya es ISO
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  const ms = Math.round((n - 25569) * 86400 * 1000);
  const d = new Date(ms);
  if (isNaN(d.getTime())) return s;
  return d.toISOString().split('T')[0];
};

export const parseCSV = (text) => {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* ignore */ }
      else { field += c; }
    }
    i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
};


// Función para calcular distancia entre dos coordenadas (fórmula de Haversine)
const calcularDistancia = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
};

// Validar que las coordenadas estén cerca de la ciudad especificada
const validarCoordenadasCiudad = (lat, lng, ciudadNombre) => {
  if (!ciudadNombre || lat == null || lng == null) return { valido: false, razon: 'datos_incompletos' };

  const city = normalize(ciudadNombre);
  const ciudadInfo = CIUDADES_VENEZUELA.find(c =>
    normalize(c.nombre) === city || city.includes(normalize(c.nombre))
  );

  if (!ciudadInfo) return { valido: false, razon: 'ciudad_no_encontrada' };

  const distancia = calcularDistancia(
    lat, lng,
    ciudadInfo.coordenadas.lat,
    ciudadInfo.coordenadas.lng
  );

  // Si la distancia es mayor a 50km, probablemente hay un error
  const DISTANCIA_MAX_KM = 50;
  if (distancia > DISTANCIA_MAX_KM) {
    return {
      valido: false,
      razon: 'coordenadas_muy_lejos',
      distancia: Math.round(distancia),
      ciudadEsperada: ciudadInfo.nombre,
      coordenadasEsperadas: ciudadInfo.coordenadas
    };
  }

  return { valido: true };
};

const cityToCoord = (cityRaw) => {
  if (!cityRaw) return null;
  const city = normalize(cityRaw);
  const found = CIUDADES_VENEZUELA.find(c => normalize(c.nombre) === city);
  if (found) return { ...found.coordenadas, ciudadEncontrada: found.nombre };
  // intento por contiene
  const partial = CIUDADES_VENEZUELA.find(c => city.includes(normalize(c.nombre)));
  return partial ? { ...partial.coordenadas, ciudadEncontrada: partial.nombre } : null;
};

export const mapRowsToPedidos = (rows) => {
  if (!rows.length) return [];
  // Detectar fila de cabeceras (busca la que más coincide con tokens esperados)
  const expected = [
    'numero_pedido','fecha_pedido','nombre_cliente','direccion_cliente','ciudad_cliente',
    'codigo_articulo','descripcion_articulo','cantidad_pedida','prioridad','estado','lat','lng','fecha','hora','productos','cliente','direccion'
  ].map(normalize);

  const scores = rows.slice(0, 10).map((r, i) => ({
    i,
    score: (r || []).reduce((acc, cell) => acc + (expected.includes(normalize(cell)) ? 1 : 0), 0)
  }));
  const best = scores.sort((a,b) => b.score - a.score)[0] || { i: 0, score: 0 };
  const headerRowIdx = best.score > 0 ? best.i : 0;

  const headers = (rows[headerRowIdx] || []).map(h => normalize(h));
  const idx = (name) => {
    const n = normalize(name);
    let pos = headers.indexOf(n);
    if (pos >= 0) return pos;
    // Fallback: contiene
    pos = headers.findIndex(h => h.includes(n) || n.includes(h));
    return pos;
  };
  const idxExact = (name) => headers.indexOf(normalize(name));

  // Priorizar nombre_cliente sobre codigo_cliente
  let iNombreCliente = idxExact('nombre_cliente');
  if (iNombreCliente < 0) {
    const iClienteExact = idxExact('cliente');
    if (iClienteExact >= 0) iNombreCliente = iClienteExact;
  }
  if (iNombreCliente < 0) {
    // Fallback por contiene pero evitando capturar codigo_cliente
    const iClienteLoose = headers.findIndex(h => (h.includes('cliente') || 'cliente'.includes(h)) && !h.includes('codigo_cliente'));
    iNombreCliente = iClienteLoose;
  }
  const iDireccion = idx('direccion');
  const iDireccionCliente = iDireccion >= 0 ? iDireccion : idx('direccion_cliente');
  const iCiudad = idx('ciudad_cliente');
  const iLat = idx('lat');
  const iLng = idx('lng');
  const iPrioridad = idx('prioridad');
  const iEstado = idx('estado');
  const iFecha = idx('fecha');
  const iFechaPedido = idx('fecha_pedido');
  const iHora = idx('hora');
  const iProductos = idx('productos');
  const iNumeroPedido = idx('numero_pedido');
  const iCodigoArticulo = idx('codigo_articulo');
  const iDescripcionArticulo = idx('descripcion_articulo');
  const iCantidadPedida = idx('cantidad_pedida');
  const iPrecioUnitario = idx('precio_unitario');
  const iMontoNeto = idx('monto_neto');
  const iCodigoCliente = idx('codigo_cliente');
  const iFechaVencimiento = idx('fecha_vencimiento');
  // Nuevos: almacen, zona/ruta/cuadrante y vendedor
  const iAlmacen = (() => {
    const cands = ['almacen', 'almacen_origen', 'almacenorigen', 'deposito', 'bodega'];
    for (const c of cands) { const p = idx(c); if (p >= 0) return p; }
    return -1;
  })();
  const iZona = (() => {
    const cands = ['zona', 'ruta', 'cuadrante', 'sector'];
    for (const c of cands) { const p = idx(c); if (p >= 0) return p; }
    return -1;
  })();
  const iVendedor = (() => {
    const cands = ['vendedor', 'vendedor_asignado', 'vendedorasignado', 'asesor', 'asesor_comercial'];
    for (const c of cands) { const p = idx(c); if (p >= 0) return p; }
    return -1;
  })();

  const body = rows.slice(headerRowIdx + 1).filter(r => r && r.some(v => {
    if (v == null) return false;
    const str = String(v).trim();
    return str !== '';
  }));

  // Si hay numero_pedido, agrupar renglones por pedido
  if (iNumeroPedido >= 0) {
    const toIntQty = (v) => {
      if (v == null) return 1;
      const s = String(v).replace(',', '.');
      const head = s.split('.')[0];
      const n = parseInt(head.replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(n) ? 1 : n;
    };
    const byNum = new Map();
    body.forEach(r => {
      const num = String(r[iNumeroPedido] ?? '').trim();
      if (!num) return;
      if (!byNum.has(num)) byNum.set(num, []);
      byNum.get(num).push(r);
    });
    const pedidos = [];
    let idxPedido = 1;
    for (const [num, rowsPedido] of byNum.entries()) {
      const head = rowsPedido[0];
      const to = (row, i) => (i >= 0 ? row[i] : undefined);
      // Coordenadas: lat/lng si existen; si no, intentar por ciudad
      let coord = null;
      let coordenadasAdvertencia = null;
      const lat = iLat >= 0 ? parseFloat(to(head, iLat)) : null;
      const lng = iLng >= 0 ? parseFloat(to(head, iLng)) : null;
      const ciudadNombre = iCiudad >= 0 ? String(to(head, iCiudad) || '') : '';

      if (lat != null && !Number.isNaN(lat) && lng != null && !Number.isNaN(lng)) {
        // Validar si las coordenadas coinciden con la ciudad
        if (ciudadNombre) {
          const validacion = validarCoordenadasCiudad(lat, lng, ciudadNombre);
          if (!validacion.valido) {
            coordenadasAdvertencia = validacion;
            // Usar las coordenadas esperadas de la ciudad si están muy lejos
            if (validacion.coordenadasEsperadas) {
              coord = validacion.coordenadasEsperadas;
              console.warn(`⚠️ Pedido ${num}: Coordenadas (${lat}, ${lng}) muy lejos de ${ciudadNombre} (${validacion.distancia}km). Usando coordenadas de la ciudad.`);
            } else {
              coord = { lat, lng };
            }
          } else {
            coord = { lat, lng };
          }
        } else {
          coord = { lat, lng };
        }
      } else if (ciudadNombre) {
        const coordCiudad = cityToCoord(ciudadNombre);
        coord = coordCiudad || { lat: 10.4806, lng: -66.9036 };
      }
      if (!coord) coord = { lat: 10.4806, lng: -66.9036 };

      const productos = rowsPedido.map(row => {
        const cantidad = iCantidadPedida >= 0 ? toIntQty(to(row, iCantidadPedida)) : 1;
        const precioUnitario = iPrecioUnitario >= 0 ? Number(to(row, iPrecioUnitario) || 0) : undefined;
        return {
          tipo: 'Repuesto',
          marca: '',
          cantidad,
          modelo: iCodigoArticulo >= 0 ? String(to(row, iCodigoArticulo) || '') : '',
          descripcion: iDescripcionArticulo >= 0 ? String(to(row, iDescripcionArticulo) || '') : '',
          ...(precioUnitario !== undefined ? { precioUnitario, subtotal: Math.round(cantidad * precioUnitario * 100) / 100 } : {})
        };
      });

      pedidos.push({
        id: String(num),
        cliente: iNombreCliente >= 0 ? String(to(head, iNombreCliente) || '') : `Cliente PED${String(idxPedido).padStart(3,'0')}`,
        direccion: (iDireccionCliente >= 0 ? String(to(head, iDireccionCliente) || '') : (iDireccion >= 0 ? String(to(head, iDireccion) || '') : '')) + (iCiudad >= 0 ? `, ${String(to(head, iCiudad) || '')}` : ''),
        coordenadas: coord,
        productos: productos,
        prioridad: iPrioridad >= 0 ? (String(to(head, iPrioridad) || 'Media')) : 'Media',
        estado: iEstado >= 0 ? (String(to(head, iEstado) || 'Pendiente')) : 'Pendiente',
        fechaCreacion: excelSerialToISO(iFechaPedido >= 0 ? to(head, iFechaPedido) : (iFecha >= 0 ? to(head, iFecha) : '')),
        horaEstimada: iHora >= 0 ? String(to(head, iHora) || '') : '',
        camionAsignado: null,
        ...(iCiudad >= 0 ? { ciudad: String(to(head, iCiudad) || '') } : {}),
        ...(iAlmacen >= 0 ? { almacen: String(to(head, iAlmacen) || '') } : {}),
        ...(iZona >= 0 ? { zona: String(to(head, iZona) || '') } : {}),
        ...(iCodigoCliente >= 0 ? { codigoCliente: String(to(head, iCodigoCliente) || '') } : {}),
        ...(iMontoNeto >= 0 ? { montoNeto: Number(to(head, iMontoNeto) || 0) } : {}),
        ...(iFechaVencimiento >= 0 ? { fechaVencimiento: excelSerialToISO(to(head, iFechaVencimiento)) } : {}),
        ...(iVendedor >= 0 ? { vendedorAsignado: String(to(head, iVendedor) || 'Sin asignar') } : { vendedorAsignado: 'Sin asignar' }),
        ...(coordenadasAdvertencia ? { coordenadasAdvertencia } : {})
      });
      idxPedido++;
    }
    return pedidos;
  }

  // Caso simple: una fila por pedido
  return body.map((r, k) => {
    const toIntQty = (v) => {
      if (v == null) return 1;
      const s = String(v).replace(',', '.');
      const head = s.split('.')[0];
      const n = parseInt(head.replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(n) ? 1 : n;
    };
    const to = (i) => (i >= 0 ? r[i] : undefined);
    const lat = iLat >= 0 ? parseFloat(to(iLat)) : null;
    const lng = iLng >= 0 ? parseFloat(to(iLng)) : null;

    const productos = [];
    if (iProductos >= 0 && to(iProductos)) {
      const items = String(to(iProductos)).split(/;|\n/).map(s => s.trim()).filter(Boolean);
      items.forEach(it => {
        const parts = it.split('|').map(s => s.trim());
        productos.push({
          tipo: parts[0] || 'Producto',
          marca: parts[1] || '',
          cantidad: parts[2] ? toIntQty(parts[2]) : 1,
          modelo: parts[3] || ''
        });
      });
    } else if (iCodigoArticulo >= 0 || iDescripcionArticulo >= 0 || iCantidadPedida >= 0) {
      productos.push({
        tipo: 'Repuesto',
        marca: '',
        cantidad: iCantidadPedida >= 0 ? toIntQty(to(iCantidadPedida)) : 1,
        modelo: iCodigoArticulo >= 0 ? String(to(iCodigoArticulo) || '') : '',
        descripcion: iDescripcionArticulo >= 0 ? String(to(iDescripcionArticulo) || '') : ''
      });
    }

    const id = `PED${String(k + 1).padStart(3, '0')}`;
    return {
      id,
      cliente: iNombreCliente >= 0 ? to(iNombreCliente) : `Cliente ${id}`,
      direccion: (iDireccionCliente >= 0 ? to(iDireccionCliente) : (iDireccion >= 0 ? to(iDireccion) : '')) + (iCiudad >= 0 ? `, ${to(iCiudad)}` : ''),
      coordenadas: (lat != null && !Number.isNaN(lat) && lng != null && !Number.isNaN(lng)) ? { lat, lng } : (iCiudad >= 0 ? (cityToCoord(to(iCiudad)) || { lat: 10.4806, lng: -66.9036 }) : { lat: 10.4806, lng: -66.9036 }),
      productos: productos.length ? productos : [{ tipo: 'Producto', marca: '', cantidad: 1, modelo: '' }],
      prioridad: iPrioridad >= 0 ? (to(iPrioridad) || 'Media') : 'Media',
      estado: iEstado >= 0 ? (to(iEstado) || 'Pendiente') : 'Pendiente',
      fechaCreacion: iFecha >= 0 ? excelSerialToISO(to(iFecha) || '') : '',
      horaEstimada: iHora >= 0 ? (to(iHora) || '') : '',
      camionAsignado: null,
      ...(iCiudad >= 0 ? { ciudad: String(to(iCiudad) || '') } : {}),
      ...(iAlmacen >= 0 ? { almacen: String(to(iAlmacen) || '') } : {}),
      ...(iZona >= 0 ? { zona: String(to(iZona) || '') } : {}),
      ...(iFechaVencimiento >= 0 ? { fechaVencimiento: excelSerialToISO(to(iFechaVencimiento)) } : {}),
      ...(iVendedor >= 0 ? { vendedorAsignado: String(to(iVendedor) || 'Sin asignar') } : { vendedorAsignado: 'Sin asignar' })
    };
  });
};

export const loadPedidosFromPublic = async () => {
  // Intentos en orden
  const candidates = ['/pedidos.xlsx', '/Pedidos.xlsx', '/pedidos.csv', '/Pedidos.csv'];
  for (const path of candidates) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) continue;
      const lower = path.toLowerCase();
      if (lower.endsWith('.csv')) {
        const text = await res.text();
        const rows = parseCSV(text);
        return mapRowsToPedidos(rows);
      } else {
        const buf = await res.arrayBuffer();
        const XLSX = await import('xlsx');
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        return mapRowsToPedidos(rows);
      }
    } catch (_) {
      // probar siguiente
    }
  }
  return [];
};
