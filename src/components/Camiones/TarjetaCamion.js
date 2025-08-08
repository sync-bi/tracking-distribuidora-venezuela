// src/components/Camiones/TarjetaCamion.js
import React from 'react';
import { Truck, Navigation, Fuel, Gauge, Route, Eye, Settings, MapPin, Package } from 'lucide-react';

const TarjetaCamion = ({
  camion,
  pedidosAsignados,
  rutaOptimizada,
  onOptimizarRuta,
  onActualizarEstado,
  onActualizarInfo,
  onVerDetalles
}) => {
  const obtenerColorEstado = (estado) => {
    const colores = {
      'Disponible': 'bg-green-100 text-green-800',
      'Asignado': 'bg-orange-100 text-orange-800',
      'En Ruta': 'bg-blue-100 text-blue-800',
      'Mantenimiento': 'bg-yellow-100 text-yellow-800',
      'Fuera de Servicio': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'Disponible':
        return '🟢';
      case 'Asignado':
        return '🟡';
      case 'En Ruta':
        return '🔵';
      case 'Mantenimiento':
        return '🔧';
      case 'Fuera de Servicio':
        return '🔴';
      default:
        return '⚫';
    }
  };

  const obtenerNivelCombustible = () => {
    const nivel = parseInt(camion.combustible.replace('%', ''));
    if (nivel > 70) return 'text-green-600';
    if (nivel > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calcularDistanciaTotal = () => {
    if (!rutaOptimizada || rutaOptimizada.length === 0) return 0;
    return rutaOptimizada.reduce((total, parada) => total + (parada.distancia || 0), 0);
  };

  const calcularTiempoTotal = () => {
    if (!rutaOptimizada || rutaOptimizada.length === 0) return 0;
    return rutaOptimizada.reduce((total, parada) => total + (parada.tiempoEstimado || 0), 0);
  };

  const formatearTiempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
  };

  const estaEnMovimiento = () => {
    return camion.estado === 'En Ruta' && camion.velocidad !== '0 km/h';
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Truck 
              size={24} 
              className={`${estaEnMovimiento() ? 'text-blue-600' : 'text-gray-600'}`}
            />
            {estaEnMovimiento() && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              {camion.id} - {camion.conductor}
              <span className="text-lg">{obtenerIconoEstado(camion.estado)}</span>
            </h3>
            <div className="text-sm text-gray-600">
              <span>Placa: {camion.placa}</span> • <span>Capacidad: {camion.capacidad}</span>
            </div>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${obtenerColorEstado(camion.estado)}`}>
          {camion.estado}
        </span>
      </div>

      {/* Información del vehículo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center gap-2 mb-1">
            <Navigation size={16} className="text-blue-600" />
            <span className="text-sm font-medium">Ubicación</span>
          </div>
          <div className="text-sm text-gray-700">{camion.direccionActual}</div>
          <div className="text-xs text-gray-500 mt-1">
            {camion.ubicacionActual.lat.toFixed(4)}, {camion.ubicacionActual.lng.toFixed(4)}
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center gap-2 mb-1">
            <Gauge size={16} className="text-green-600" />
            <span className="text-sm font-medium">Velocidad</span>
          </div>
          <div className="text-lg font-bold text-gray-700">{camion.velocidad}</div>
          {estaEnMovimiento() && (
            <div className="text-xs text-green-600 font-medium">En movimiento</div>
          )}
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center gap-2 mb-1">
            <Fuel size={16} className={obtenerNivelCombustible()} />
            <span className="text-sm font-medium">Combustible</span>
          </div>
          <div className={`text-lg font-bold ${obtenerNivelCombustible()}`}>
            {camion.combustible}
          </div>
          {parseInt(camion.combustible.replace('%', '')) < 30 && (
            <div className="text-xs text-red-600 font-medium">Nivel bajo</div>
          )}
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-purple-600" />
            <span className="text-sm font-medium">Pedidos</span>
          </div>
          <div className="text-lg font-bold text-gray-700">{pedidosAsignados.length}</div>
          <div className="text-xs text-gray-500">Asignados</div>
        </div>
      </div>

      {/* Pedidos asignados */}
      {pedidosAsignados.length > 0 && (
        <div className="border-t pt-4 mb-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Package size={16} />
            Pedidos Asignados ({pedidosAsignados.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pedidosAsignados.map(pedido => (
              <div key={pedido.id} className="text-sm bg-blue-50 p-2 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <strong>{pedido.id}</strong> - {pedido.cliente}
                    <div className="text-gray-600 text-xs">{pedido.direccion}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    pedido.prioridad === 'Alta' ? 'bg-red-100 text-red-700' :
                    pedido.prioridad === 'Media' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {pedido.prioridad}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ruta optimizada */}
      {rutaOptimizada.length > 0 && (
        <div className="border-t pt-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium flex items-center gap-2">
              <Route size={16} />
              Ruta Optimizada
            </h4>
            <div className="text-sm text-gray-600">
              {calcularDistanciaTotal().toFixed(1)} km • {formatearTiempo(calcularTiempoTotal())}
            </div>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {rutaOptimizada.map((parada, index) => (
              <div key={index} className="text-sm flex justify-between items-center bg-green-50 p-2 rounded">
                <div>
                  <strong>{index + 1}.</strong> {parada.cliente}
                </div>
                <div className="text-right text-xs text-gray-600">
                  <div>{parada.distancia} km</div>
                  <div>{parada.tiempoEstimado} min</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 justify-between items-center pt-3 border-t">
        <div className="flex gap-2">
          {/* Cambiar estado */}
          <select
            className="text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            value={camion.estado}
            onChange={(e) => onActualizarEstado(camion.id, e.target.value)}
          >
            <option value="Disponible">Disponible</option>
            <option value="Asignado">Asignado</option>
            <option value="En Ruta">En Ruta</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Fuera de Servicio">Fuera de Servicio</option>
          </select>

          {/* Optimizar ruta */}
          {pedidosAsignados.length > 0 && (
            <button
              onClick={onOptimizarRuta}
              className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              title="Optimizar ruta"
            >
              <Route size={14} />
              Optimizar
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Ver detalles */}
          <button
            onClick={() => onVerDetalles(camion)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            title="Ver detalles completos"
          >
            <Eye size={14} />
            Detalles
          </button>

          {/* Configurar */}
          <button
            onClick={() => onActualizarInfo(camion.id, {})}
            className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            title="Configurar camión"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Alertas */}
      {parseInt(camion.combustible.replace('%', '')) < 20 && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
          <Fuel size={14} />
          <span className="font-medium">¡Combustible crítico! - {camion.combustible}</span>
        </div>
      )}

      {camion.estado === 'Mantenimiento' && (
        <div className="mt-3 flex items-center gap-2 text-yellow-600 text-sm bg-yellow-50 p-2 rounded">
          <Settings size={14} />
          <span className="font-medium">Vehículo en mantenimiento programado</span>
        </div>
      )}
    </div>
  );
};

export default TarjetaCamion;