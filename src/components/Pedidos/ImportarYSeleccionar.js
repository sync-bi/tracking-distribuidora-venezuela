// src/components/Pedidos/ImportarYSeleccionar.js
import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Search, CheckSquare, Square, Package, Truck } from 'lucide-react';
import Modal from '../UI/Modal';
import { mapRowsToPedidos, parseCSV } from '../../utils/importers';

const ImportarYSeleccionar = ({ onAgregar, onCerrar, pedidosExistentes = [] }) => {
  const [pedidosImportados, setPedidosImportados] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [agregando, setAgregando] = useState(false);

  // Cargar pedidos automáticamente al abrir
  useEffect(() => {
    const cargarPedidos = async () => {
      setCargando(true);
      setError(null);
      try {
        // Intentar cargar Excel o CSV del servidor
        const candidates = ['/Pedidos.xlsx', '/pedidos.xlsx', '/Pedidos.csv', '/pedidos.csv'];
        for (const path of candidates) {
          try {
            const res = await fetch(path, { cache: 'no-store' });
            if (!res.ok) continue;
            const lower = path.toLowerCase();
            if (lower.endsWith('.csv')) {
              const text = await res.text();
              const rows = parseCSV(text);
              const pedidos = mapRowsToPedidos(rows);
              if (pedidos.length > 0) {
                setPedidosImportados(pedidos);
                setCargando(false);
                return;
              }
            } else {
              const buf = await res.arrayBuffer();
              const XLSX = await import('xlsx');
              const wb = XLSX.read(buf, { type: 'array' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
              const pedidos = mapRowsToPedidos(rows);
              if (pedidos.length > 0) {
                setPedidosImportados(pedidos);
                setCargando(false);
                return;
              }
            }
          } catch (_) { /* siguiente */ }
        }
        setError('No se encontraron pedidos. Puede cargar un archivo manualmente.');
      } catch (e) {
        setError(e.message || 'Error al cargar pedidos');
      } finally {
        setCargando(false);
      }
    };
    cargarPedidos();
  }, []);

  // IDs de pedidos que ya están en el sistema (Firestore) - comparar por numeroPedido y id
  const idsExistentes = useMemo(() => {
    const ids = new Set();
    pedidosExistentes.forEach(p => {
      if (p.id) ids.add(p.id);
      if (p.numeroPedido) ids.add(String(p.numeroPedido));
    });
    return ids;
  }, [pedidosExistentes]);

  // Filtrar pedidos importados por búsqueda
  const pedidosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return pedidosImportados;
    const term = busqueda.toLowerCase();
    return pedidosImportados.filter(p =>
      (p.id || '').toLowerCase().includes(term) ||
      (p.cliente || '').toLowerCase().includes(term) ||
      (p.ciudad || '').toLowerCase().includes(term) ||
      (p.direccion || '').toLowerCase().includes(term)
    );
  }, [pedidosImportados, busqueda]);

  const handleFile = async (file) => {
    setCargando(true);
    setError(null);
    try {
      const ext = file.name.toLowerCase().split('.').pop();
      let rows;
      if (ext === 'csv') {
        const text = await file.text();
        rows = parseCSV(text);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      } else {
        throw new Error('Formato no soportado. Use .csv o .xlsx');
      }
      const pedidos = mapRowsToPedidos(rows);
      setPedidosImportados(pedidos);
      setSeleccionados(new Set());
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setCargando(false);
    }
  };

  const toggleSeleccion = (id) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const seleccionarTodos = () => {
    const disponibles = pedidosFiltrados.filter(p => !idsExistentes.has(p.id));
    if (seleccionados.size === disponibles.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(disponibles.map(p => p.id)));
    }
  };

  const handleAgregar = async () => {
    if (seleccionados.size === 0) return;
    setAgregando(true);
    try {
      const pedidosParaAgregar = pedidosImportados.filter(p => seleccionados.has(p.id));
      await onAgregar(pedidosParaAgregar);
      onCerrar();
    } catch (e) {
      setError(e.message || 'Error al agregar pedidos');
    } finally {
      setAgregando(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onCerrar} title="Actualizar Pedidos" size="xl">
      <div className="p-6">
        {/* Zona de carga de archivo */}
        {cargando ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Actualizando pedidos del sistema...</p>
          </div>
        ) : pedidosImportados.length === 0 ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                No se encontraron pedidos
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Puede cargar un archivo manualmente
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors font-medium">
                <Upload size={20} />
                Cargar archivo
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </div>
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Barra de acciones */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={seleccionarTodos}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  <CheckSquare size={16} />
                  {seleccionados.size === pedidosFiltrados.filter(p => !idsExistentes.has(p.id)).length
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos'}
                </button>
                <span className="text-sm text-gray-500">
                  {seleccionados.size} de {pedidosImportados.length} seleccionados
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pedido..."
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>

            {/* Lista de pedidos */}
            <div className="border rounded-lg max-h-[50vh] overflow-auto">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 md:p-3 text-left w-8 md:w-10"></th>
                    <th className="p-2 md:p-3 text-left w-16 md:w-24">Pedido</th>
                    <th className="p-2 md:p-3 text-left">Cliente</th>
                    <th className="p-2 md:p-3 text-left hidden md:table-cell w-24">Ciudad</th>
                    <th className="p-2 md:p-3 text-left hidden lg:table-cell w-20">Productos</th>
                    <th className="p-2 md:p-3 text-left w-16 md:w-20">Prioridad</th>
                    <th className="p-2 md:p-3 text-left w-16 md:w-20">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((pedido) => {
                    const yaExiste = idsExistentes.has(pedido.id);
                    const isSelected = seleccionados.has(pedido.id);
                    return (
                      <tr
                        key={pedido.id}
                        className={`border-t cursor-pointer transition-colors ${
                          yaExiste
                            ? 'bg-green-50 opacity-60'
                            : isSelected
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                        }`}
                        onClick={() => !yaExiste && toggleSeleccion(pedido.id)}
                      >
                        <td className="p-2 md:p-3">
                          {yaExiste ? (
                            <Truck size={16} className="text-green-500" title="Ya en tracking" />
                          ) : isSelected ? (
                            <CheckSquare size={16} className="text-blue-500" />
                          ) : (
                            <Square size={16} className="text-gray-300" />
                          )}
                        </td>
                        <td className="p-2 md:p-3 font-medium truncate">{pedido.id}</td>
                        <td className="p-2 md:p-3 truncate">{pedido.cliente}</td>
                        <td className="p-2 md:p-3 hidden md:table-cell truncate">{pedido.ciudad || '-'}</td>
                        <td className="p-2 md:p-3 hidden lg:table-cell text-gray-500">
                          {pedido.productos?.length || 0}
                        </td>
                        <td className="p-2 md:p-3">
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            pedido.prioridad === 'Alta' || pedido.prioridad === 'Urgente'
                              ? 'bg-red-100 text-red-700'
                              : pedido.prioridad === 'Media'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {pedido.prioridad}
                          </span>
                        </td>
                        <td className="p-2 md:p-3">
                          {yaExiste ? (
                            <span className="text-xs text-green-600 font-medium">En tracking</span>
                          ) : (
                            <span className="text-xs text-gray-500">{pedido.estado}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            {/* Botones */}
            <div className="flex gap-3 justify-between items-center pt-2">
              <button
                onClick={() => { setPedidosImportados([]); setSeleccionados(new Set()); setError(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
              >
                Cargar otro archivo
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onCerrar}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregar}
                  disabled={seleccionados.size === 0 || agregando}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Package size={18} />
                  {agregando
                    ? 'Agregando...'
                    : `Agregar ${seleccionados.size} pedido${seleccionados.size !== 1 ? 's' : ''} al tracking`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportarYSeleccionar;
