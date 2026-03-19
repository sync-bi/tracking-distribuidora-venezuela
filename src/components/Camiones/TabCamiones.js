// src/components/Camiones/TabCamiones.js
import React, { useState } from 'react';
import { Search, Truck, Plus, Users, X, Trash2, Edit2 } from 'lucide-react';
import TarjetaCamion from './TarjetaCamion';
import { crearCamion, crearConductor, actualizarConductor, eliminarCamion, eliminarConductor } from '../../services/firestoreService';

const TabCamiones = ({
  camiones,
  conductores = [],
  pedidos,
  rutas,
  onOptimizarRuta,
  onActualizarEstado,
  onActualizarInfo,
  onBuscarCamiones,
  estadisticas
}) => {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [camionSeleccionado, setCamionSeleccionado] = useState(null);
  const [vista, setVista] = useState('camiones'); // 'camiones' | 'conductores'
  const [mostrarFormCamion, setMostrarFormCamion] = useState(false);
  const [mostrarFormConductor, setMostrarFormConductor] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form camión
  const [formCamion, setFormCamion] = useState({ id: '', placa: '', capacidad: '', conductor: '', direccionActual: '' });
  // Form conductor
  const [formConductor, setFormConductor] = useState({ id: '', nombre: '', cedula: '', telefono: '' });
  // Editar conductor
  const [conductorEditando, setConductorEditando] = useState(null);

  const camionesFiltrados = camiones.filter(camion => {
    const cumpleFiltroEstado = filtroEstado === 'todos' || camion.estado === filtroEstado;
    const cumpleBusqueda = terminoBusqueda === '' ||
      (camion.conductor || '').toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      (camion.id || '').toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      (camion.placa || '').toLowerCase().includes(terminoBusqueda.toLowerCase());
    return cumpleFiltroEstado && cumpleBusqueda;
  });

  const obtenerPedidosPorCamion = (camionId) => {
    const camion = camiones.find(c => c.id === camionId);
    return camion ? pedidos.filter(p => (camion.pedidosAsignados || []).includes(p.id)) : [];
  };

  const handleCrearCamion = async () => {
    setFormError(null);
    if (!formCamion.id.trim() || !formCamion.placa.trim()) {
      setFormError('ID y Placa son obligatorios');
      return;
    }
    try {
      await crearCamion({
        id: formCamion.id.trim().toUpperCase(),
        placa: formCamion.placa.trim().toUpperCase(),
        capacidad: formCamion.capacidad.trim() || 'N/A',
        conductor: formCamion.conductor.trim() || '',
        direccionActual: formCamion.direccionActual.trim() || '',
        ubicacionActual: { lat: 10.4806, lng: -66.9036 }
      });
      setFormCamion({ id: '', placa: '', capacidad: '', conductor: '', direccionActual: '' });
      setMostrarFormCamion(false);
    } catch (e) {
      setFormError(e.message);
    }
  };

  const handleCrearConductor = async () => {
    setFormError(null);
    if (!formConductor.nombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    try {
      const id = formConductor.id.trim() || `COND${Date.now()}`;
      await crearConductor({
        id,
        nombre: formConductor.nombre.trim(),
        cedula: formConductor.cedula.trim() || '',
        telefono: formConductor.telefono.trim() || ''
      });
      setFormConductor({ id: '', nombre: '', cedula: '', telefono: '' });
      setMostrarFormConductor(false);
    } catch (e) {
      setFormError(e.message);
    }
  };

  const handleEliminarCamion = async (camionId) => {
    if (!window.confirm(`¿Eliminar camión ${camionId}?`)) return;
    try { await eliminarCamion(camionId); } catch (e) { alert(e.message); }
  };

  const handleEliminarConductor = async (conductorId) => {
    if (!window.confirm(`¿Eliminar conductor ${conductorId}?`)) return;
    try { await eliminarConductor(conductorId); } catch (e) { alert(e.message); }
  };

  const handleEditarConductor = (conductor) => {
    setConductorEditando(conductor.id);
    setFormConductor({ id: conductor.id, nombre: conductor.nombre || '', cedula: conductor.cedula || '', telefono: conductor.telefono || '' });
    setFormError(null);
  };

  const handleGuardarEdicionConductor = async () => {
    setFormError(null);
    if (!formConductor.nombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    try {
      await actualizarConductor(conductorEditando, {
        nombre: formConductor.nombre.trim(),
        cedula: formConductor.cedula.trim(),
        telefono: formConductor.telefono.trim()
      });
      setConductorEditando(null);
      setFormConductor({ id: '', nombre: '', cedula: '', telefono: '' });
    } catch (e) {
      setFormError(e.message);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Gestión de Flota</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setVista('camiones')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                vista === 'camiones' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Truck size={18} />
              Camiones ({camiones.length})
            </button>
            <button
              onClick={() => setVista('conductores')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                vista === 'conductores' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Users size={18} />
              Conductores ({conductores.length})
            </button>
          </div>
        </div>

        {/* Estadísticas camiones */}
        {vista === 'camiones' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{estadisticas.disponibles}</div>
              <div className="text-sm text-gray-500">Disponibles</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{estadisticas.asignados}</div>
              <div className="text-sm text-gray-500">Asignados</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.enRuta}</div>
              <div className="text-sm text-gray-500">En Ruta</div>
            </div>
          </div>
        )}
      </div>

      {/* === VISTA CAMIONES === */}
      {vista === 'camiones' && (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por ID, placa o conductor..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                />
              </div>
              <select className="p-2 border rounded-lg" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="Disponible">Disponible</option>
                <option value="Asignado">Asignado</option>
                <option value="En Ruta">En Ruta</option>
              </select>
              <button
                onClick={() => { setMostrarFormCamion(true); setFormError(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus size={18} />
                Agregar Camión
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {camionesFiltrados.map(camion => (
              <TarjetaCamion
                key={camion.id}
                camion={camion}
                pedidosAsignados={obtenerPedidosPorCamion(camion.id)}
                rutaOptimizada={rutas[camion.id] || []}
                onOptimizarRuta={() => onOptimizarRuta(camion.id)}
                onActualizarEstado={onActualizarEstado}
                onActualizarInfo={onActualizarInfo}
                onVerDetalles={setCamionSeleccionado}
              />
            ))}
            {camionesFiltrados.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Truck className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-500">No hay camiones</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* === VISTA CONDUCTORES === */}
      {vista === 'conductores' && (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
            <span className="text-sm text-gray-600">{conductores.length} conductores registrados</span>
            <button
              onClick={() => { setMostrarFormConductor(true); setFormError(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus size={18} />
              Agregar Conductor
            </button>
          </div>

          <div className="grid gap-3">
            {conductores.map(conductor => (
              <div key={conductor.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{conductor.nombre || conductor.id}</h3>
                    <div className="text-sm text-gray-500">
                      {conductor.cedula && <span>C.I. {conductor.cedula} • </span>}
                      {conductor.telefono && <span>{conductor.telefono} • </span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        conductor.estado === 'Disponible' ? 'bg-green-100 text-green-700' :
                        conductor.estado === 'Asignado' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {conductor.estado || 'Disponible'}
                      </span>
                      {conductor.camionAsignado && <span className="ml-2 text-xs text-blue-600">Camión: {conductor.camionAsignado}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditarConductor(conductor)} className="text-blue-400 hover:text-blue-600" title="Editar">
                    <Edit2 size={18} />
                  </button>
                  {conductor.estado === 'Disponible' && (
                    <button onClick={() => handleEliminarConductor(conductor.id)} className="text-red-400 hover:text-red-600" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {conductores.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Users className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-500">No hay conductores registrados</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Agregar Camión */}
      {mostrarFormCamion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Agregar Camión</h3>
              <button onClick={() => setMostrarFormCamion(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID del Camión *</label>
                <input type="text" placeholder="Ej: CAM104" className="w-full p-2 border rounded-lg"
                  value={formCamion.id} onChange={(e) => setFormCamion(p => ({ ...p, id: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa *</label>
                <input type="text" placeholder="Ej: ABC-123" className="w-full p-2 border rounded-lg"
                  value={formCamion.placa} onChange={(e) => setFormCamion(p => ({ ...p, placa: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                <input type="text" placeholder="Ej: 3000 kg" className="w-full p-2 border rounded-lg"
                  value={formCamion.capacidad} onChange={(e) => setFormCamion(p => ({ ...p, capacidad: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación base</label>
                <input type="text" placeholder="Ej: Depósito Central, Caracas" className="w-full p-2 border rounded-lg"
                  value={formCamion.direccionActual} onChange={(e) => setFormCamion(p => ({ ...p, direccionActual: e.target.value }))} />
              </div>
              {formError && <p className="text-red-600 text-sm">{formError}</p>}
              <button onClick={handleCrearCamion} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
                Crear Camión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Conductor */}
      {mostrarFormConductor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Agregar Conductor</h3>
              <button onClick={() => setMostrarFormConductor(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input type="text" placeholder="Ej: Juan Pérez" className="w-full p-2 border rounded-lg"
                  value={formConductor.nombre} onChange={(e) => setFormConductor(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input type="text" placeholder="Ej: V-12345678" className="w-full p-2 border rounded-lg"
                  value={formConductor.cedula} onChange={(e) => setFormConductor(p => ({ ...p, cedula: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" placeholder="Ej: 0412-1234567" className="w-full p-2 border rounded-lg"
                  value={formConductor.telefono} onChange={(e) => setFormConductor(p => ({ ...p, telefono: e.target.value }))} />
              </div>
              {formError && <p className="text-red-600 text-sm">{formError}</p>}
              <button onClick={handleCrearConductor} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
                Crear Conductor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Conductor */}
      {conductorEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Editar Conductor</h3>
              <button onClick={() => setConductorEditando(null)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input type="text" className="w-full p-2 border rounded-lg"
                  value={formConductor.nombre} onChange={(e) => setFormConductor(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input type="text" className="w-full p-2 border rounded-lg"
                  value={formConductor.cedula} onChange={(e) => setFormConductor(p => ({ ...p, cedula: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" className="w-full p-2 border rounded-lg"
                  value={formConductor.telefono} onChange={(e) => setFormConductor(p => ({ ...p, telefono: e.target.value }))} />
              </div>
              {formError && <p className="text-red-600 text-sm">{formError}</p>}
              <button onClick={handleGuardarEdicionConductor} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles Camión */}
      {camionSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Detalles - {camionSeleccionado.id}</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div><strong>Placa:</strong> {camionSeleccionado.placa || 'N/A'}</div>
              <div><strong>Capacidad:</strong> {camionSeleccionado.capacidad || 'N/A'}</div>
              <div><strong>Estado:</strong> {camionSeleccionado.estado || 'Disponible'}</div>
              <div><strong>Conductor:</strong> {camionSeleccionado.conductor || 'Sin asignar'}</div>
              <div><strong>Ubicación:</strong> {camionSeleccionado.direccionActual || 'N/A'}</div>
            </div>
            {(camionSeleccionado.pedidosAsignados || []).length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold mb-2">Pedidos ({(camionSeleccionado.pedidosAsignados || []).length})</h4>
                {obtenerPedidosPorCamion(camionSeleccionado.id).map(p => (
                  <div key={p.id} className="bg-gray-50 p-2 rounded mb-1 text-sm">
                    <strong>{p.id}</strong> - {p.cliente} ({p.estado})
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setCamionSeleccionado(null)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cerrar</button>
              {camionSeleccionado.estado === 'Disponible' && (
                <button onClick={() => { handleEliminarCamion(camionSeleccionado.id); setCamionSeleccionado(null); }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Eliminar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabCamiones;
