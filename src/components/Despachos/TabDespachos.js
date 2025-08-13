// src/components/Despachos/TabDespachos.js
// ¡REEMPLAZA TODO EL CONTENIDO DE TU ARCHIVO ACTUAL CON ESTE CÓDIGO!

import React, { useState } from 'react';
import { 
  Truck, Users, Route, Clock, MapPin,
  Plus, Search, Edit, Save, X, ChevronUp, ChevronDown,
  CheckCircle, Package, Clipboard
} from 'lucide-react';
import FormularioDespacho from './FormularioDespacho';
import MapaDespachos from './MapaDespachos';

// COMPONENTE PRINCIPAL TabDespachos
const TabDespachos = ({
  camiones = [],
  pedidos = [],
  conductores = [],
  rutas = {},
  onAsignarConductor,
  onCrearDespacho,
  onModificarRuta,
  onActualizarDespacho,
  estadisticas = {}
}) => {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Filtrar camiones según criterios
  const camionesFiltrados = camiones.filter(camion => {
    const cumpleFiltro = filtroEstado === 'todos' || camion.estado === filtroEstado;
    const cumpleBusqueda = terminoBusqueda === '' || 
      camion.conductor.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      camion.id.toLowerCase().includes(terminoBusqueda.toLowerCase());
    return cumpleFiltro && cumpleBusqueda;
  });

  // Obtener pedidos por camión
  const obtenerPedidosPorCamion = (camionId) => {
    return pedidos.filter(p => p.camionAsignado === camionId);
  };

  // Manejar creación de despacho
  const handleCrearDespacho = (datosDespacho) => {
    try {
      onCrearDespacho(datosDespacho);
      setMostrarFormulario(false);
      
      const conductorNombre = conductores.find(c => c.id === datosDespacho.conductorId)?.nombre || 'N/A';
      alert(`¡Despacho creado exitosamente!\n\nCamión: ${datosDespacho.camionId}\nConductor: ${conductorNombre}\nPedidos: ${datosDespacho.pedidosSeleccionados.length} entregas`);
    } catch (error) {
      alert('Error al crear el despacho. Intente nuevamente.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clipboard className="text-blue-600" size={28} />
              Centro de Despachos
            </h2>
            <p className="text-gray-600">Gestión de conductores, rutas y entregas con visualización en mapa</p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
            Nuevo Despacho
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{estadisticas?.totalDespachos || camiones.length}</div>
            <div className="text-sm text-gray-500">Despachos Activos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{estadisticas?.enRuta || 0}</div>
            <div className="text-sm text-gray-500">En Ruta</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{estadisticas?.enPreparacion || 0}</div>
            <div className="text-sm text-gray-500">En Preparación</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{estadisticas?.conductoresLibres || conductores.filter(c => c.estado === 'Disponible').length}</div>
            <div className="text-sm text-gray-500">Conductores Libres</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">{estadisticas?.rutasOptimizadas || Object.keys(rutas).length}</div>
            <div className="text-sm text-gray-500">Rutas Optimizadas</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-cyan-600">{estadisticas?.eficienciaPromedio || 85}%</div>
            <div className="text-sm text-gray-500">Eficiencia</div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por conductor, camión..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
          </div>
          
          <select
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los Estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Asignado">Asignado</option>
            <option value="En Ruta">En Ruta</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>

          <button 
            onClick={() => alert('Optimizando todas las rutas...')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Route size={16} className="inline mr-2" />
            Optimizar Todas las Rutas
          </button>
        </div>
      </div>

      {/* Lista de Despachos */}
      <div className="space-y-6">
        {camionesFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <Truck size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No se encontraron camiones con los filtros aplicados</p>
          </div>
        ) : (
          camionesFiltrados.map(camion => (
            <TarjetaDespacho
              key={camion.id}
              camion={camion}
              pedidos={obtenerPedidosPorCamion(camion.id)}
              ruta={rutas[camion.id] || []}
              onModificarRuta={onModificarRuta}
            />
          ))
        )}
      </div>

      {/* Formulario de nuevo despacho */}
      {mostrarFormulario && (
        <FormularioDespacho
          camiones={camiones}
          conductores={conductores}
          pedidos={pedidos}
          onCrear={handleCrearDespacho}
          onCerrar={() => setMostrarFormulario(false)}
        />
      )}
    </div>
  );
};

// COMPONENTE TarjetaDespacho - ESTÁ DENTRO DEL MISMO ARCHIVO
const TarjetaDespacho = ({ camion, pedidos, ruta, onModificarRuta }) => {
  const [editandoRuta, setEditandoRuta] = useState(false);
  const [rutaEditada, setRutaEditada] = useState(ruta);
  const [mostrarMapa, setMostrarMapa] = useState(true);

  const obtenerColorEstado = (estado) => {
    const colores = {
      'Disponible': 'bg-green-100 text-green-800',
      'Asignado': 'bg-orange-100 text-orange-800',
      'En Ruta': 'bg-blue-100 text-blue-800',
      'Mantenimiento': 'bg-yellow-100 text-yellow-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const moverEntrega = (index, direccion) => {
    const nuevaRuta = [...rutaEditada];
    const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
    
    if (nuevoIndex >= 0 && nuevoIndex < nuevaRuta.length) {
      [nuevaRuta[index], nuevaRuta[nuevoIndex]] = [nuevaRuta[nuevoIndex], nuevaRuta[index]];
      setRutaEditada(nuevaRuta);
    }
  };

  const iniciarEdicion = () => {
    setEditandoRuta(true);
    setRutaEditada(ruta.length > 0 ? ruta : pedidos.map((p, index) => ({
      ...p,
      distancia: (index + 1) * 5.2,
      tiempoEstimado: (index + 1) * 15
    })));
  };

  const guardarRuta = () => {
    onModificarRuta && onModificarRuta(camion.id, rutaEditada);
    setEditandoRuta(false);
    alert('✅ Ruta modificada exitosamente. El mapa se ha actualizado con el nuevo orden de entregas.');
  };

  const cancelarEdicion = () => {
    setEditandoRuta(false);
    setRutaEditada(ruta);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Truck size={24} className="text-blue-600" />
              {camion.estado === 'En Ruta' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">{camion.id}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={14} />
                <span>Conductor: {camion.conductor}</span>
              </div>
              <div className="text-sm text-gray-500">Placa: {camion.placa}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${obtenerColorEstado(camion.estado)}`}>
              {camion.estado}
            </span>
            {pedidos.length > 0 && (
              <button
                onClick={() => setMostrarMapa(!mostrarMapa)}
                className={`p-2 rounded-lg transition-colors ${
                  mostrarMapa 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={mostrarMapa ? 'Ocultar mapa' : 'Mostrar mapa'}
              >
                <MapPin size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Información del vehículo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-purple-600" />
              <span className="text-sm font-medium">Entregas</span>
            </div>
            <div className="text-xl font-bold">{pedidos.length}</div>
            <div className="text-xs text-gray-500">Asignadas</div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Route size={16} className="text-green-600" />
              <span className="text-sm font-medium">Distancia</span>
            </div>
            <div className="text-xl font-bold">
              {(editandoRuta ? rutaEditada : ruta).reduce((acc, curr) => acc + (curr.distancia || 0), 0).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">km total</div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-orange-600" />
              <span className="text-sm font-medium">Tiempo Est.</span>
            </div>
            <div className="text-xl font-bold">
              {Math.round((editandoRuta ? rutaEditada : ruta).reduce((acc, curr) => acc + (curr.tiempoEstimado || 0), 0))}
            </div>
            <div className="text-xs text-gray-500">minutos</div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-red-600" />
              <span className="text-sm font-medium">Estado</span>
            </div>
            <div className="text-sm font-bold">{camion.estado}</div>
            <div className="text-xs text-gray-500">Actual</div>
          </div>
        </div>
      </div>

      {/* Mapa de rutas */}
      {pedidos.length > 0 && mostrarMapa && (
        <div className="px-6 pb-4">
          <MapaDespachos
            camion={camion}
            ruta={ruta}
            editandoRuta={editandoRuta}
            rutaEditada={rutaEditada}
            onCentrarMapa={() => {
              console.log('Centrando mapa para', camion.id);
            }}
          />
        </div>
      )}

      {/* Ruta de entregas */}
      {pedidos.length > 0 && (
        <div className="px-6 pb-6">
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Route size={16} />
                Ruta de Entregas ({pedidos.length} paradas)
              </h4>
              <div className="flex gap-2">
                {!editandoRuta ? (
                  <button
                    onClick={iniciarEdicion}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                  >
                    <Edit size={14} />
                    Modificar Orden
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={guardarRuta}
                      className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      <Save size={14} />
                      Guardar
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(editandoRuta ? rutaEditada : (ruta.length > 0 ? ruta : pedidos)).map((entrega, index) => (
                <div key={entrega.id || index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{entrega.cliente}</div>
                      <div className="text-sm text-gray-600">{entrega.direccion}</div>
                      <div className="text-xs text-gray-500">
                        {entrega.distancia?.toFixed(1) || ((index + 1) * 5.2).toFixed(1)} km • 
                        {entrega.tiempoEstimado || (index + 1) * 15} min
                      </div>
                    </div>
                  </div>
                  
                  {editandoRuta && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moverEntrega(index, 'arriba')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        title="Mover hacia arriba"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moverEntrega(index, 'abajo')}
                        disabled={index === rutaEditada.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        title="Mover hacia abajo"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  )}
                  
                  {!editandoRuta && entrega.completado && (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                </div>
              ))}
            </div>

            {editandoRuta && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-sm text-orange-700">
                  ✏️ <strong>Modo edición:</strong> Use las flechas ↑↓ para reordenar las entregas. 
                  Los cambios se reflejan automáticamente en el mapa superior.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay pedidos */}
      {pedidos.length === 0 && (
        <div className="px-6 pb-6">
          <div className="border-t pt-4 text-center text-gray-500">
            <Package size={24} className="mx-auto mb-2 text-gray-400" />
            <p>No hay pedidos asignados a este camión</p>
            <button
              onClick={() => alert(`Asignar pedidos a ${camion.id}`)}
              className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Asignar Pedidos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// EXPORTAR SOLO EL COMPONENTE PRINCIPAL
export default TabDespachos;