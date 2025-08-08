// src/components/Camiones/TabCamiones.js
import React, { useState } from 'react';
import { Search, Truck, MapPin, Route } from 'lucide-react';
import TarjetaCamion from './TarjetaCamion';

const TabCamiones = ({
  camiones,
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

  // Filtrar camiones según criterios
  const camionesFiltrados = camiones.filter(camion => {
    const cumpleFiltroEstado = filtroEstado === 'todos' || camion.estado === filtroEstado;
    const cumpleBusqueda = terminoBusqueda === '' || 
      camion.conductor.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      camion.id.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      camion.placa.toLowerCase().includes(terminoBusqueda.toLowerCase());

    return cumpleFiltroEstado && cumpleBusqueda;
  });

  const obtenerPedidosPorCamion = (camionId) => {
    const camion = camiones.find(c => c.id === camionId);
    return camion ? pedidos.filter(p => camion.pedidosAsignados.includes(p.id)) : [];
  };

  return (
    <div className="p-6">
      {/* Header con estadísticas */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Seguimiento de Camiones</h2>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
            <div className="text-sm text-gray-500">Total Flota</div>
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
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{estadisticas.mantenimiento}</div>
            <div className="text-sm text-gray-500">Mantenimiento</div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por conductor, ID o placa..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
          </div>

          {/* Filtro por estado */}
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Asignado">Asignado</option>
            <option value="En Ruta">En Ruta</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>

          {/* Contador de resultados */}
          <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4">
            <span className="text-sm text-gray-600">
              {camionesFiltrados.length} de {camiones.length} camiones
            </span>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-bold text-gray-700 mb-3">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              camiones.forEach(camion => {
                if (camion.pedidosAsignados.length > 0) {
                  onOptimizarRuta(camion.id);
                }
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Route size={18} />
            Optimizar Todas las Rutas
          </button>
          
          <button
            onClick={() => setFiltroEstado('En Ruta')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Truck size={18} />
            Ver Camiones en Ruta
          </button>
          
          <button
            onClick={() => setFiltroEstado('Disponible')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <MapPin size={18} />
            Ver Disponibles
          </button>
        </div>
      </div>

      {/* Lista de camiones */}
      <div className="grid gap-4">
        {camionesFiltrados.length > 0 ? (
          camionesFiltrados.map(camion => (
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
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 mb-2">
              <Truck className="mx-auto" size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay camiones</h3>
            <p className="text-gray-500">
              {terminoBusqueda || filtroEstado !== 'todos'
                ? 'No se encontraron camiones con los filtros aplicados'
                : 'No hay camiones registrados en el sistema'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalles del camión */}
      {camionSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Detalles del Camión {camionSeleccionado.id}</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Información básica */}
              <div>
                <h4 className="font-bold mb-3">Información del Vehículo</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> {camionSeleccionado.id}</div>
                  <div><strong>Conductor:</strong> {camionSeleccionado.conductor}</div>
                  <div><strong>Placa:</strong> {camionSeleccionado.placa}</div>
                  <div><strong>Capacidad:</strong> {camionSeleccionado.capacidad}</div>
                  <div><strong>Estado:</strong> {camionSeleccionado.estado}</div>
                  <div><strong>Velocidad:</strong> {camionSeleccionado.velocidad}</div>
                  <div><strong>Combustible:</strong> {camionSeleccionado.combustible}</div>
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <h4 className="font-bold mb-3">Ubicación Actual</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Dirección:</strong> {camionSeleccionado.direccionActual}</div>
                  <div><strong>Latitud:</strong> {camionSeleccionado.ubicacionActual.lat.toFixed(6)}</div>
                  <div><strong>Longitud:</strong> {camionSeleccionado.ubicacionActual.lng.toFixed(6)}</div>
                  <div><strong>Última actualización:</strong> {new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Pedidos asignados */}
              {camionSeleccionado.pedidosAsignados.length > 0 && (
                <div className="md:col-span-2">
                  <h4 className="font-bold mb-3">Pedidos Asignados ({camionSeleccionado.pedidosAsignados.length})</h4>
                  <div className="space-y-2">
                    {obtenerPedidosPorCamion(camionSeleccionado.id).map(pedido => (
                      <div key={pedido.id} className="bg-gray-50 p-3 rounded">
                        <div className="font-medium">{pedido.id} - {pedido.cliente}</div>
                        <div className="text-sm text-gray-600">{pedido.direccion}</div>
                        <div className="text-sm text-gray-500">Estado: {pedido.estado}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ruta optimizada */}
              {rutas[camionSeleccionado.id] && rutas[camionSeleccionado.id].length > 0 && (
                <div className="md:col-span-2">
                  <h4 className="font-bold mb-3">Ruta Optimizada</h4>
                  <div className="space-y-2">
                    {rutas[camionSeleccionado.id].map((parada, index) => (
                      <div key={index} className="flex justify-between items-center bg-green-50 p-3 rounded">
                        <div>
                          <strong>{index + 1}.</strong> {parada.cliente}
                          <div className="text-sm text-gray-600">{parada.direccion}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div>{parada.distancia} km</div>
                          <div className="text-gray-500">{parada.tiempoEstimado} min</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setCamionSeleccionado(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabCamiones;