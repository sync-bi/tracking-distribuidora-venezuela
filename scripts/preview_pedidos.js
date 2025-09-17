// scripts/preview_pedidos.js
// Preview de mapeo de public/Pedidos.xlsx hacia el modelo de pedidos
// Ejecuta: node scripts/preview_pedidos.js

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const normalize = (s = '') => s
  .toString()
  .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')
  .trim();

const excelSerialToISO = (val) => {
  if (val == null) return '';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  const ms = Math.round((n - 25569) * 86400 * 1000);
  const d = new Date(ms);
  if (isNaN(d.getTime())) return s;
  return d.toISOString().split('T')[0];
};

function mapRowsToPedidos(rows) {
  if (!rows.length) return [];
  const expected = [
    'numero_pedido','fecha_pedido','nombre_cliente','direccion_cliente','ciudad_cliente',
    'codigo_articulo','descripcion_articulo','cantidad_pedida','prioridad','estado','lat','lng','fecha','hora','productos','cliente','direccion',
    'precio_unitario','monto_neto','codigo_cliente','fecha_vencimiento','almacen','ruta','cuadrante','zona'
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
    pos = headers.findIndex(h => h.includes(n) || n.includes(h));
    return pos;
  };
  const idxExact = (name) => headers.indexOf(normalize(name));

  let iNombreCliente = idxExact('nombre_cliente');
  if (iNombreCliente < 0) {
    const iClienteExact = idxExact('cliente');
    if (iClienteExact >= 0) iNombreCliente = iClienteExact;
  }
  if (iNombreCliente < 0) {
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
  const iAlmacen = (() => { for (const c of ['almacen','almacen_origen','almacenorigen','deposito','bodega']) { const p = idx(c); if (p>=0) return p; } return -1; })();
  const iZona = (() => { for (const c of ['zona','ruta','cuadrante','sector']) { const p = idx(c); if (p>=0) return p; } return -1; })();

  const body = rows.slice(headerRowIdx + 1).filter(r => r && r.some(v => (v||'').toString().trim() !== ''));

  const toIntQty = (v) => {
    if (v == null) return 1;
    const s = String(v).replace(',', '.');
    const head = s.split('.')[0];
    const n = parseInt(head.replace(/[^0-9-]/g, ''), 10);
    return Number.isNaN(n) ? 1 : n;
  };

  const buildProducto = (row) => {
    const cantidad = iCantidadPedida >= 0 ? toIntQty(row[iCantidadPedida]) : 1;
    const precioUnitario = iPrecioUnitario >= 0 ? Number(row[iPrecioUnitario] || 0) : undefined;
    return {
      tipo: 'Repuesto',
      marca: '',
      cantidad,
      modelo: iCodigoArticulo >= 0 ? String(row[iCodigoArticulo] || '') : '',
      descripcion: iDescripcionArticulo >= 0 ? String(row[iDescripcionArticulo] || '') : '',
      ...(precioUnitario !== undefined ? { precioUnitario, subtotal: Math.round(cantidad * precioUnitario * 100) / 100 } : {})
    };
  };

  if (iNumeroPedido >= 0) {
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
      const lat = iLat >= 0 ? parseFloat(to(head, iLat)) : null;
      const lng = iLng >= 0 ? parseFloat(to(head, iLng)) : null;
      const productos = rowsPedido.map(buildProducto);
      pedidos.push({
        id: String(num),
        cliente: iNombreCliente >= 0 ? String(to(head, iNombreCliente) || '') : `Cliente PED${String(idxPedido).padStart(3,'0')}`,
        direccion: (iDireccionCliente >= 0 ? String(to(head, iDireccionCliente) || '') : (iDireccion >= 0 ? String(to(head, iDireccion) || '') : '')) + (iCiudad >= 0 ? `, ${String(to(head, iCiudad) || '')}` : ''),
        coordenadas: (lat != null && !Number.isNaN(lat) && lng != null && !Number.isNaN(lng)) ? { lat, lng } : undefined,
        productos,
        prioridad: iPrioridad >= 0 ? (String(to(head, iPrioridad) || 'Media')) : 'Media',
        estado: iEstado >= 0 ? (String(to(head, iEstado) || 'Pendiente')) : 'Pendiente',
        fechaCreacion: excelSerialToISO(iFechaPedido >= 0 ? to(head, iFechaPedido) : (iFecha >= 0 ? to(head, iFecha) : '')),
        horaEstimada: iHora >= 0 ? String(to(head, iHora) || '') : '',
        ...(iFechaVencimiento >= 0 ? { fechaVencimiento: excelSerialToISO(to(head, iFechaVencimiento)) } : {}),
        ...(iAlmacen >= 0 ? { almacen: String(to(head, iAlmacen) || '') } : {}),
        ...(iZona >= 0 ? { zona: String(to(head, iZona) || '') } : {}),
        ...(iCodigoCliente >= 0 ? { codigoCliente: String(to(head, iCodigoCliente) || '') } : {}),
        ...(iMontoNeto >= 0 ? { montoNeto: Number(to(head, iMontoNeto) || 0) } : {}),
        ...(iFechaVencimiento >= 0 ? { fechaVencimiento: String(to(head, iFechaVencimiento) || '') } : {}),
      });
      idxPedido++;
    }
    return pedidos;
  }

  // Sin numero_pedido: 1 fila por pedido
  return body.map((r, k) => {
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
      productos.push(buildProducto(r));
    }

    const id = `PED${String(k + 1).padStart(3, '0')}`;
    return {
      id,
      cliente: iNombreCliente >= 0 ? to(iNombreCliente) : (iCliente >= 0 ? to(iCliente) : `Cliente ${id}`),
      direccion: (iDireccionCliente >= 0 ? to(iDireccionCliente) : (iDireccion >= 0 ? to(iDireccion) : '')) + (iCiudad >= 0 ? `, ${to(iCiudad)}` : ''),
      coordenadas: (lat != null && !Number.isNaN(lat) && lng != null && !Number.isNaN(lng)) ? { lat, lng } : undefined,
      productos: productos.length ? productos : [{ tipo: 'Producto', marca: '', cantidad: 1, modelo: '' }],
      prioridad: iPrioridad >= 0 ? (to(iPrioridad) || 'Media') : 'Media',
      estado: iEstado >= 0 ? (to(iEstado) || 'Pendiente') : 'Pendiente',
      fechaCreacion: iFecha >= 0 ? excelSerialToISO(to(iFecha) || '') : '',
      horaEstimada: iHora >= 0 ? (to(iHora) || '') : '',
      ...(iFechaVencimiento >= 0 ? { fechaVencimiento: excelSerialToISO(to(iFechaVencimiento)) } : {}),
      ...(iAlmacen >= 0 ? { almacen: String(to(iAlmacen) || '') } : {}),
      ...(iZona >= 0 ? { zona: String(to(iZona) || '') } : {}),
      ...(iCodigoCliente >= 0 ? { codigoCliente: String(to(iCodigoCliente) || '') } : {}),
      ...(iMontoNeto >= 0 ? { montoNeto: Number(to(iMontoNeto) || 0) } : {}),
      ...(iFechaVencimiento >= 0 ? { fechaVencimiento: String(to(iFechaVencimiento) || '') } : {}),
    };
  });
}

function main() {
  const file = path.join(process.cwd(), 'public', 'Pedidos.xlsx');
  if (!fs.existsSync(file)) {
    console.error('No se encontró public/Pedidos.xlsx');
    process.exit(1);
  }
  const wb = XLSX.read(fs.readFileSync(file), { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const headers = rows[0] || [];
  console.log('Cabeceras detectadas:', headers);

  const pedidos = mapRowsToPedidos(rows);
  console.log(`Total pedidos mapeados: ${pedidos.length}`);
  console.log('Preview (primeros 5):');
  pedidos.slice(0, 5).forEach((p, i) => {
    console.log(`\n#${i+1}:`, {
      id: p.id,
      cliente: p.cliente,
      fechaCreacion: p.fechaCreacion,
      fechaVencimiento: p.fechaVencimiento,
      montoNeto: p.montoNeto,
      codigoCliente: p.codigoCliente,
      direccion: p.direccion,
      zona: p.zona,
      almacen: p.almacen,
      estado: p.estado,
      prioridad: p.prioridad,
      productos: p.productos ? `${p.productos.length} items (ej: ${p.productos[0] ? (p.productos[0].descripcion || p.productos[0].modelo || p.productos[0].tipo) : 'n/a'})` : 'n/a'
    });
  });
}

main();
