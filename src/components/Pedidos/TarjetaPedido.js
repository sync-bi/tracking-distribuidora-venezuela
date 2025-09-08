// src/components/Pedidos/TarjetaPedido.js
import React from 'react';
import { MapPin, Eye, Truck, Clock, Package, AlertCircle } from 'lucide-react';

const TarjetaPedido = ({
  pedido,
  camiones,
  onAsignarCamion,
  onActualizarEstado,
  onEliminar,
  onVerDetalles
}) => {
  const obtenerColorEstado = (estado) => {
    const colores = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Asignado': 'bg-blue-100 text-blue-800',
      'En Ruta': 'bg-green-100 text-green-800',
      'Entregado': 'bg-gray-100 text-gray-800',
      'Cancelado': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const obtenerColorPrioridad = (prioridad) => {
    const colores = {
      'Baja': 'bg-green-100 text-green-800',
      'Media': 'bg-orange-100 text-orange-800',
      'Alta': 'bg-red-100 text-red-800',
      'Urgente': 'bg-purple-100 text-purple-800'
    };
    return colores[prioridad] || 'bg-gray-100 text-gray-800';
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return <Clock size={16} className="text-yellow-600" />;
      case 'Asignado':
        return <Truck size={16} className="text-blue-600" />;
      case 'En Ruta':
        return <MapPin size={16} className="text-green-600" />;
      case 'Entregado':
        return <Package size={16} className="text-gray-600" />;
      case 'Cancelado':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const calcularTotalProductos = () => {
    return pedido.productos.reduce((total, producto) => total + producto.cantidad, 0);
  };

  const esUrgente = () => {
    return pedido.prioridad === 'Alta' || pedido.prioridad === 'Urgente';
  };

  return (
    <div className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${
      esUrgente() ? 'border-l-4 border-l-red-500' : ''
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-gray-900">N° Pedido: {pedido.id}</h3>
            {esUrgente() && <AlertCircle size={18} className="text-red-500" />}
          </div>
          <h4 className="font-medium text-gray-700 mb-1">{pedido.cliente}</h4>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={14} />
            <span className="text-sm">{pedido.direccion}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            {obtenerIconoEstado(pedido.estado)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorEstado(pedido.estado)}`}>
              {pedido.estado}
            </span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorPrioridad(pedido.prioridad)}`}>
            {pedido.prioridad}
          </span>
        </div>
      </div>

      {/* Productos */}
      <div className="mb-4">
        <h5 className="font-medium text-gray-700 mb-2">
          Productos ({calcularTotalProductos()} items):
        </h5>
        <div className="space-y-1">
          {pedido.productos.map((producto, index) => (
            <div key={index} className="text-sm bg-gray-50 p-2 rounded flex justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{producto.descripcion || producto.modelo || producto.tipo || 'Producto'}</div>
                <div className="text-xs text-gray-600 truncate">{producto.modelo ? `Código: ${producto.modelo}` : ''}</div>
              </div>
              <div className="text-right whitespace-nowrap">
                <div className="text-gray-600">x{producto.cantidad}</div>
                {typeof producto.precioUnitario === 'number' && (
                  <div className="text-gray-700">{Math.trunc(producto.subtotal ?? (producto.precioUnitario * producto.cantidad))}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">Fecha:</span> {pedido.fechaCreacion}
        </div>
        <div>
          <span className="font-medium">Hora estimada:</span> {pedido.horaEstimada}
        </div>
        {pedido.coordenadas && (
          <div className="col-span-2">
            <span className="font-medium">Coordenadas:</span> {pedido.coordenadas.lat.toFixed(4)}, {pedido.coordenadas.lng.toFixed(4)}
          </div>
        )}
      </div>

      {/* Camión asignado */}
      {pedido.camionAsignado && (
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center gap-2 text-green-700">
            <Truck size={16} />
            <span className="font-medium">Camión asignado: {pedido.camionAsignado}</span>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 justify-between items-center pt-3 border-t">
        <div className="flex gap-2">
          {/* Asignar camión */}
          {!pedido.camionAsignado && camiones.length > 0 && (
            <select
              className="text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              onChange={(e) => e.target.value && onAsignarCamion(pedido.id, e.target.value)}
              defaultValue=""
            >
              <option value="">Asignar Camión</option>
              {camiones.map(camion => (
                <option key={camion.id} value={camion.id}>
                  {camion.id} - {camion.conductor}
                </option>
              ))}
            </select>
          )}

          {/* Cambiar estado */}
          {pedido.estado !== 'Entregado' && (
            <select
              className="text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              value={pedido.estado}
              onChange={(e) => onActualizarEstado(pedido.id, e.target.value)}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Asignado">Asignado</option>
              <option value="En Ruta">En Ruta</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          )}
        </div>

        <div className="flex gap-2">
          {/* Ver detalles */}
          <button
            onClick={() => onVerDetalles(pedido)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            title="Ver detalles"
          >
            <Eye size={14} />
            Detalles
          </button>

          {/* Eliminar (solo si está pendiente) */}
          {pedido.estado === 'Pendiente' && (
            <button
              onClick={() => onEliminar(pedido.id)}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              title="Eliminar pedido"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Indicador de urgencia */}
      {esUrgente() && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={14} />
          <span className="font-medium">
            {pedido.prioridad === 'Urgente' ? 'Pedido urgente - Requiere atención inmediata' : 'Pedido de alta prioridad'}
          </span>
        </div>
      )}
    </div>
  );
};

export default TarjetaPedido;
