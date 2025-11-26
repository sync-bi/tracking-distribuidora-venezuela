// src/components/Pedidos/ImportPedidos.js
import React, { useState } from 'react';

// Parser CSV sencillo (coma separador, comillas dobles, saltos de línea \n/\r\n)
const parseCSV = (text) => {
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
      else if (c === '\r') { /* ignore, handle \r\n by \n */ }
      else { field += c; }
    }
    i++;
  }
  // Último campo/row
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
};

// Mapea filas CSV a pedidos del sistema
const mapRowsToPedidos = (rows) => {
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const idx = (name) => headers.indexOf(name.toLowerCase());

  const iCliente = idx('cliente');
  const iDireccion = idx('direccion');
  const iLat = idx('lat');
  const iLng = idx('lng');
  const iPrioridad = idx('prioridad');
  const iEstado = idx('estado');
  const iFecha = idx('fecha');
  const iHora = idx('hora');
  const iProductos = idx('productos'); // ej: "Llanta|Bridgestone|4|225/60R16; Bateria|Duncan|1|12V 75Ah"

  const body = rows.slice(1).filter(r => r.some(v => {
    if (v == null) return false;
    const str = String(v).trim();
    return str !== '';
  }));

  return body.map((r, k) => {
    const lat = iLat >= 0 ? parseFloat(r[iLat]) : null;
    const lng = iLng >= 0 ? parseFloat(r[iLng]) : null;
    const productos = [];
    if (iProductos >= 0 && r[iProductos]) {
      const items = String(r[iProductos]).split(/;|\n/).map(s => s.trim()).filter(Boolean);
      items.forEach(it => {
        const parts = it.split('|').map(s => s.trim());
        // tipo|marca|cantidad|modelo
        productos.push({
          tipo: parts[0] || 'Producto',
          marca: parts[1] || '',
          cantidad: parts[2] ? Number(parts[2]) : 1,
          modelo: parts[3] || ''
        });
      });
    }
    const id = `PED${String(k + 1).padStart(3, '0')}`;
    return {
      id,
      cliente: iCliente >= 0 ? r[iCliente] : `Cliente ${id}`,
      direccion: iDireccion >= 0 ? r[iDireccion] : '',
      coordenadas: (lat != null && !Number.isNaN(lat) && lng != null && !Number.isNaN(lng)) ? { lat, lng } : { lat: 10.4806, lng: -66.9036 },
      productos: productos.length ? productos : [{ tipo: 'Producto', marca: '', cantidad: 1, modelo: '' }],
      prioridad: iPrioridad >= 0 ? (r[iPrioridad] || 'Media') : 'Media',
      estado: iEstado >= 0 ? (r[iEstado] || 'Pendiente') : 'Pendiente',
      fechaCreacion: iFecha >= 0 ? (r[iFecha] || '') : '',
      horaEstimada: iHora >= 0 ? (r[iHora] || '') : '',
      camionAsignado: null
    };
  });
};

const ImportPedidos = ({ onImport }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    setLoading(true); setError(null);
    try {
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'csv') {
        const text = await file.text();
        const rows = parseCSV(text);
        const pedidos = mapRowsToPedidos(rows);
        onImport?.(pedidos);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const pedidos = mapRowsToPedidos(json);
        onImport?.(pedidos);
      } else {
        throw new Error('Formato no soportado. Use .csv o .xlsx');
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDefault = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/pedidos.csv');
      if (!res.ok) throw new Error('No se encontró /pedidos.csv');
      const text = await res.text();
      const rows = parseCSV(text);
      const pedidos = mapRowsToPedidos(rows);
      onImport?.(pedidos);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDefaultXlsx = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/pedidos.xlsx');
      if (!res.ok) throw new Error('No se encontró /pedidos.xlsx');
      const buf = await res.arrayBuffer();
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const pedidos = mapRowsToPedidos(json);
      onImport?.(pedidos);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <label className="border px-3 py-2 rounded cursor-pointer bg-white hover:bg-gray-50">
        Cargar CSV/XLSX
        <input type="file" accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} />
      </label>
      <button onClick={handleFetchDefault} className="border px-3 py-2 rounded bg-white hover:bg-gray-50">Cargar /pedidos.csv</button>
      <button onClick={handleFetchDefaultXlsx} className="border px-3 py-2 rounded bg-white hover:bg-gray-50">Cargar /pedidos.xlsx</button>
      {loading && <span className="text-sm text-gray-600">Procesando...</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
};

export default ImportPedidos;
