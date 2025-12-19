// src/components/Mapa/TabMapa.js
import React, { useState, useEffect } from 'react';
import { Truck, Package, Route, Eye, RotateCcw, Filter, Navigation, BarChart3, Search, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import MapaReal from './MapaReal';

const TabMapa = ({
  camiones,
  pedidos,
  rutas,
  estadisticasPedidos,
  estadisticasCamiones,
  estadisticasRutas,
  onAsignarCamion,
  onOptimizarRuta,
  onLimpiarRuta,
  onRecalcularRutas
}) => {
  const [filtroMapa, setFiltroMapa] = useState('todos');
  const [actualizacionAutomatica, setActualizacionAutomatica] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [zoomLevel, setZoomLevel] = useState(11);
  const [mostrarCapas, setMostrarCapas] = useState(true);

  // Simular actualización automática
  useEffect(() => {
    if (actualizacionAutomatica) {
      const interval = setInterval(() => {
        setUltimaActualizacion(new Date());
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [actualizacionAutomatica]);

  const obtenerCamionesActivos = () => {
    return camiones.filter(camion => camion.estado === 'En Ruta' || camion.estado === 'Asignado');
  };

  const obtenerPedidosPendientes = () => {
    return pedidos.filter(pedido => pedido.estado === 'Pendiente' || pedido.estado === 'Asignado');
  };

  const calcularDistanciaPromedio = () => {
    const rutasConDistancia = Object.values(rutas).flat();
    if (rutasConDistancia.length === 0) return 0;
    const totalDistancia = rutasConDistancia.reduce((sum, parada) => sum + (parada.distancia || 0), 0);
    return (totalDistancia / rutasConDistancia.length).toFixed(1);
  };

  // Filtrar datos según el filtro seleccionado y búsqueda
  const datosFiltrados = () => {
    let camionesFiltrados = camiones;
    let pedidosFiltrados = pedidos;

    // PRIMERO: Aplicar filtros por estado según la opción seleccionada
    switch (filtroMapa) {
      case 'todos':
        // Mostrar todos los camiones activos y TODOS los pedidos en seguimiento
        camionesFiltrados = camiones.filter(c =>
          c.estado === 'Asignado' || c.estado === 'En Ruta' || c.estado === 'Disponible'
        );
        pedidosFiltrados = pedidos.filter(p =>
          p.estado !== 'Entregado' && p.estado !== 'Cancelado'
        );
        break;
      case 'camiones':
        camionesFiltrados = camiones.filter(c =>
          c.estado === 'Asignado' || c.estado === 'En Ruta' || c.estado === 'Disponible'
        );
        pedidosFiltrados = [];
        break;
      case 'pedidos':
        camionesFiltrados = [];
        pedidosFiltrados = pedidos.filter(p =>
          p.estado !== 'Entregado' && p.estado !== 'Cancelado'
        );
        break;
      case 'enRuta':
        camionesFiltrados = camiones.filter(c => c.estado === 'En Ruta');
        pedidosFiltrados = pedidos.filter(p => p.estado === 'En Ruta');
        break;
      case 'pendientes':
        // Mostrar solo lo que falta por asignar
        camionesFiltrados = camiones.filter(c => c.estado === 'Disponible');
        pedidosFiltrados = pedidos.filter(p => p.estado === 'Pendiente');
        break;
      case 'asignados':
        // Mostrar solo lo asignado pero no en ruta aún
        camionesFiltrados = camiones.filter(c => c.estado === 'Asignado');
        pedidosFiltrados = pedidos.filter(p => p.estado === 'Asignado');
        break;
      default:
        // Por defecto, mostrar todo en seguimiento
        camionesFiltrados = camiones.filter(c =>
          c.estado === 'Asignado' || c.estado === 'En Ruta' || c.estado === 'Disponible'
        );
        pedidosFiltrados = pedidos.filter(p =>
          p.estado !== 'Entregado' && p.estado !== 'Cancelado'
        );
        break;
    }

    // SEGUNDO: Aplicar búsqueda de cliente DESPUÉS de los filtros de estado
    if (busquedaCliente.trim()) {
      const termino = busquedaCliente.toLowerCase();
      pedidosFiltrados = pedidosFiltrados.filter(p =>
        (p.cliente || '').toLowerCase().includes(termino) ||
        (p.direccion || '').toLowerCase().includes(termino) ||
        (p.ciudad || '').toLowerCase().includes(termino) ||
        (p.id || '').toLowerCase().includes(termino)
      );
    }

    return { camionesFiltrados, pedidosFiltrados };
  };

  const { camionesFiltrados, pedidosFiltrados } = datosFiltrados();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mapa de Seguimiento en Tiempo Real</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${actualizacionAutomatica ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {actualizacionAutomatica ? 'En vivo' : 'Pausado'}
            </span>
          </div>
          <button
            onClick={() => setActualizacionAutomatica(!actualizacionAutomatica)}
            className={`px-3 py-1 rounded text-sm ${
              actualizacionAutomatica ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}
          >
            {actualizacionAutomatica ? 'Pausar' : 'Reanudar'}
          </button>
        </div>
      </div>

      {/* Panel de estadísticas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="text-blue-600" size={20} />
            <span className="text-sm font-medium">Camiones Activos</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{obtenerCamionesActivos().length}</div>
          <div className="text-xs text-gray-500">de {camiones.length} total</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-orange-600" size={20} />
            <span className="text-sm font-medium">Pedidos Activos</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{obtenerPedidosPendientes().length}</div>
          <div className="text-xs text-gray-500">pendientes y asignados</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Route className="text-green-600" size={20} />
            <span className="text-sm font-medium">Rutas Activas</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{estadisticasRutas.rutasActivas}</div>
          <div className="text-xs text-gray-500">{estadisticasRutas.totalParadas} paradas</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="text-purple-600" size={20} />
            <span className="text-sm font-medium">Distancia Promedio</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{calcularDistanciaPromedio()}</div>
          <div className="text-xs text-gray-500">km por parada</div>
        </div>
      </div>

      {/* Controles del mapa */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700">Controles del Mapa</h3>
          <div className="text-xs text-gray-500">
            Última actualización: {ultimaActualizacion.toLocaleTimeString()}
          </div>
        </div>

        {/* Búsqueda de clientes */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar cliente por nombre, dirección o ciudad..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroMapa}
            onChange={(e) => setFiltroMapa(e.target.value)}
          >
            <option value="todos">Todos en Seguimiento</option>
            <option value="camiones">Solo Camiones</option>
            <option value="pedidos">Solo Pedidos</option>
            <option value="enRuta">Solo En Ruta</option>
            <option value="pendientes">Solo Pendientes</option>
            <option value="asignados">Solo Asignados</option>
          </select>

          <button
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => {
              // Centrar vista en elementos filtrados
              setUltimaActualizacion(new Date());
            }}
          >
            <Eye size={16} />
            Centrar
          </button>

          <button
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={() => setUltimaActualizacion(new Date())}
          >
            <RotateCcw size={16} />
            Actualizar
          </button>

          <button
            className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            onClick={() => setMostrarCapas(!mostrarCapas)}
          >
            <Layers size={16} />
            {mostrarCapas ? 'Ocultar' : 'Mostrar'} Capas
          </button>

          <button
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            onClick={() => {
              setFiltroMapa('todos');
              setBusquedaCliente('');
            }}
          >
            <Filter size={16} />
            Limpiar
          </button>
        </div>

        {/* Controles de Zoom */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-gray-600">Zoom:</span>
          <button
            className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setZoomLevel(Math.min(zoomLevel + 1, 18))}
            title="Acercar zoom"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-sm font-mono text-gray-700 min-w-[3rem] text-center">{zoomLevel}</span>
          <button
            className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setZoomLevel(Math.max(zoomLevel - 1, 3))}
            title="Alejar zoom"
          >
            <ZoomOut size={16} />
          </button>
          <button
            className="ml-2 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            onClick={() => setZoomLevel(11)}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Mapa Real */}
      <div className="bg-white border rounded-lg shadow">
        <div className="h-96 rounded-lg overflow-hidden">
          <MapaReal
            camiones={camionesFiltrados}
            pedidos={pedidosFiltrados}
            rutas={rutas}
            zoomLevel={zoomLevel}
            mostrarCapas={mostrarCapas}
            busquedaCliente={busquedaCliente}
            onAsignarPedido={onAsignarCamion}
          />
        </div>
        
        {/* Panel lateral con información detallada */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Camiones en tiempo real */}
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Truck size={18} />
              Camiones en Tiempo Real
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {camiones.map(camion => (
                <div key={camion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      camion.estado === 'En Ruta' ? 'bg-blue-500 animate-pulse' : 
                      camion.estado === 'Disponible' ? 'bg-green-500' : 
                      camion.estado === 'Asignado' ? 'bg-orange-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <span className="font-medium">{camion.id}</span>
                      <div className="text-sm text-gray-600">{camion.conductor}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{camion.velocidad}</div>
                    <div className="text-xs text-gray-500">{camion.combustible}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Resumen de pedidos por ubicación */}
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <BarChart3 size={18} />
              Resumen por Estado
            </h3>
            
            {/* Estados de pedidos */}
            <div className="space-y-3 mb-4">
              <h4 className="font-medium text-gray-700">Pedidos:</h4>
              {['Pendiente', 'Asignado', 'En Ruta', 'Entregado'].map(estado => {
                const cantidad = pedidos.filter(p => p.estado === estado).length;
                const porcentaje = pedidos.length > 0 ? Math.round((cantidad / pedidos.length) * 100) : 0;
                return (
                  <div key={estado} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{estado}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            estado === 'Pendiente' ? 'bg-yellow-500' :
                            estado === 'Asignado' ? 'bg-blue-500' :
                            estado === 'En Ruta' ? 'bg-green-500' : 'bg-gray-500'
                          }`}
                          style={{width: `${porcentaje}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{cantidad}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Estados de camiones */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Camiones:</h4>
              {['Disponible', 'Asignado', 'En Ruta', 'Mantenimiento'].map(estado => {
                const cantidad = camiones.filter(c => c.estado === estado).length;
                const porcentaje = camiones.length > 0 ? Math.round((cantidad / camiones.length) * 100) : 0;
                return (
                  <div key={estado} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{estado}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            estado === 'Disponible' ? 'bg-green-500' :
                            estado === 'Asignado' ? 'bg-orange-500' :
                            estado === 'En Ruta' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}
                          style={{width: `${porcentaje}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{cantidad}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="border-t p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-700 mb-1">Eficiencia de Rutas</div>
              <div className="text-blue-600">
                {estadisticasRutas.totalDistancia} km totales
              </div>
              <div className="text-xs text-blue-500">
                {estadisticasRutas.tiempoTotalEstimado} minutos estimados
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-700 mb-1">Rendimiento</div>
              <div className="text-green-600">
                {estadisticasPedidos.porcentajeEntregados}% entregados
              </div>
              <div className="text-xs text-green-500">
                {estadisticasCamiones.porcentajeDisponibles}% flota disponible
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-medium text-purple-700 mb-1">Cobertura</div>
              <div className="text-purple-600">
                {new Set(pedidos.map(p => p.direccion.split(',').pop()?.trim())).size} ciudades
              </div>
              <div className="text-xs text-purple-500">
                Venezuela - Distribución nacional
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabMapa;