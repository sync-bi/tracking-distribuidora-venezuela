// src/components/NoConformidad/TabNoConformidad.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  X,
  CheckCircle,
  Clock,
  FileText,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  crearNoConformidad,
  escucharNoConformidades,
  actualizarNoConformidad
} from '../../services/firestoreService';

const TIPOS_NC = [
  'Producto dañado',
  'Producto faltante',
  'Producto incorrecto',
  'Retraso en entrega',
  'Devolución',
  'Problema de documentación',
  'Queja del cliente',
  'Otro'
];

const GRAVEDADES = [
  { value: 'Leve', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Moderada', color: 'bg-orange-100 text-orange-800' },
  { value: 'Grave', color: 'bg-red-100 text-red-800' }
];

const ESTADOS_NC = [
  { value: 'Abierta', color: 'bg-red-100 text-red-700' },
  { value: 'En proceso', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Cerrada', color: 'bg-green-100 text-green-700' }
];

const formatFecha = (timestamp) => {
  if (!timestamp) return '-';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return '-'; }
};

const TabNoConformidad = ({ pedidos = [], despachos = [] }) => {
  const { user } = useAuth();
  const [noConformidades, setNoConformidades] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [ncSeleccionada, setNcSeleccionada] = useState(null);

  // Form state
  const [form, setForm] = useState({
    tipo: '',
    pedidoId: '',
    despachoId: '',
    descripcion: '',
    gravedad: 'Leve',
    accionCorrectiva: '',
    responsable: ''
  });

  // Escuchar no conformidades
  useEffect(() => {
    const unsubscribe = escucharNoConformidades((ncs) => {
      setNoConformidades(ncs);
    });
    return () => unsubscribe();
  }, []);

  // Filtrar
  const ncFiltradas = useMemo(() => {
    return noConformidades.filter(nc => {
      const cumpleEstado = filtroEstado === 'todas' || nc.estado === filtroEstado;
      const cumpleTipo = !filtroTipo || nc.tipo === filtroTipo;
      const cumpleBusqueda = !terminoBusqueda ||
        (nc.descripcion || '').toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        (nc.pedidoId || '').toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        (nc.responsable || '').toLowerCase().includes(terminoBusqueda.toLowerCase());
      return cumpleEstado && cumpleTipo && cumpleBusqueda;
    });
  }, [noConformidades, filtroEstado, filtroTipo, terminoBusqueda]);

  // Estadísticas
  const stats = useMemo(() => ({
    total: noConformidades.length,
    abiertas: noConformidades.filter(n => n.estado === 'Abierta').length,
    enProceso: noConformidades.filter(n => n.estado === 'En proceso').length,
    cerradas: noConformidades.filter(n => n.estado === 'Cerrada').length
  }), [noConformidades]);

  const handleCrear = async () => {
    if (!form.tipo || !form.descripcion) {
      alert('Por favor complete el tipo y la descripción');
      return;
    }

    try {
      const userId = user?.uid || user?.email || 'sistema';
      await crearNoConformidad({
        tipo: form.tipo,
        pedidoId: form.pedidoId || null,
        despachoId: form.despachoId || null,
        descripcion: form.descripcion,
        gravedad: form.gravedad,
        accionCorrectiva: form.accionCorrectiva || '',
        responsable: form.responsable || ''
      }, userId);

      setForm({ tipo: '', pedidoId: '', despachoId: '', descripcion: '', gravedad: 'Leve', accionCorrectiva: '', responsable: '' });
      setMostrarFormulario(false);
    } catch (err) {
      alert('Error al crear: ' + err.message);
    }
  };

  const handleCambiarEstado = async (ncId, nuevoEstado) => {
    try {
      const userId = user?.uid || user?.email || 'sistema';
      const datos = { estado: nuevoEstado };
      if (nuevoEstado === 'Cerrada') {
        datos.fechaCierre = new Date().toISOString();
      }
      await actualizarNoConformidad(ncId, datos, userId);
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="text-orange-600" size={24} />
          No Conformidades
        </h2>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} />
          Registrar No Conformidad
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.abiertas}</div>
          <div className="text-sm text-gray-500">Abiertas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.enProceso}</div>
          <div className="text-sm text-gray-500">En proceso</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.cerradas}</div>
          <div className="text-sm text-gray-500">Cerradas</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por descripción, pedido o responsable..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
          </div>
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todas">Todos los estados</option>
            {ESTADOS_NC.map(e => <option key={e.value} value={e.value}>{e.value}</option>)}
          </select>
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {TIPOS_NC.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Lista de no conformidades */}
      <div className="space-y-3">
        {ncFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hay no conformidades registradas</p>
          </div>
        ) : (
          ncFiltradas.map(nc => {
            const estadoInfo = ESTADOS_NC.find(e => e.value === nc.estado) || ESTADOS_NC[0];
            const gravedadInfo = GRAVEDADES.find(g => g.value === nc.gravedad) || GRAVEDADES[0];

            return (
              <div key={nc.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoInfo.color}`}>
                      {nc.estado}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${gravedadInfo.color}`}>
                      {nc.gravedad}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {nc.tipo}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatFecha(nc.fechaReporte)}</span>
                </div>

                <p className="text-sm text-gray-800 mb-2">{nc.descripcion}</p>

                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                  {nc.pedidoId && <span>Pedido: <strong>{nc.pedidoId}</strong></span>}
                  {nc.responsable && <span>Responsable: <strong>{nc.responsable}</strong></span>}
                </div>

                {nc.accionCorrectiva && (
                  <div className="text-xs bg-blue-50 p-2 rounded mb-3">
                    <strong className="text-blue-700">Acción correctiva:</strong>{' '}
                    <span className="text-blue-600">{nc.accionCorrectiva}</span>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-2 border-t">
                  {nc.estado === 'Abierta' && (
                    <button
                      onClick={() => handleCambiarEstado(nc.id, 'En proceso')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                    >
                      <Clock size={12} />
                      En proceso
                    </button>
                  )}
                  {(nc.estado === 'Abierta' || nc.estado === 'En proceso') && (
                    <button
                      onClick={() => handleCambiarEstado(nc.id, 'Cerrada')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      <CheckCircle size={12} />
                      Cerrar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de creación */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Registrar No Conformidad</h3>
              <button onClick={() => setMostrarFormulario(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={form.tipo}
                  onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}
                >
                  <option value="">Seleccionar tipo...</option>
                  {TIPOS_NC.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Pedido asociado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pedido asociado</label>
                <select
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={form.pedidoId}
                  onChange={(e) => setForm(f => ({ ...f, pedidoId: e.target.value }))}
                >
                  <option value="">Sin pedido específico</option>
                  {pedidos.map(p => (
                    <option key={p.id} value={p.numeroPedido || p.id}>
                      {p.numeroPedido || p.id} - {p.cliente}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gravedad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gravedad</label>
                <div className="flex gap-2">
                  {GRAVEDADES.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, gravedad: g.value }))}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                        form.gravedad === g.value
                          ? `${g.color} border-current`
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {g.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                <textarea
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Describa la no conformidad..."
                  value={form.descripcion}
                  onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                />
              </div>

              {/* Acción correctiva */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acción correctiva</label>
                <textarea
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  placeholder="Acciones a tomar..."
                  value={form.accionCorrectiva}
                  onChange={(e) => setForm(f => ({ ...f, accionCorrectiva: e.target.value }))}
                />
              </div>

              {/* Responsable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Nombre del responsable..."
                  value={form.responsable}
                  onChange={(e) => setForm(f => ({ ...f, responsable: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-4 border-t flex gap-3 justify-end">
              <button
                onClick={() => setMostrarFormulario(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={!form.tipo || !form.descripcion}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabNoConformidad;
