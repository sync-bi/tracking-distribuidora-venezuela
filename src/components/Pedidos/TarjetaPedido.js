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
        return <Clock size={14} className="text-yellow-600" />;
      case 'Asignado':
        return <Truck size={14} className="text-blue-600" />;
      case 'En Ruta':
        return <MapPin size={14} className="text-green-600" />;
      case 'Entregado':
        return <Package size={14} className="text-gray-600" />;
      case 'Cancelado':
        return <AlertCircle size={14} className="text-red-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  const calcularTotalProductos = () => {
    return pedido.productos.reduce((total, producto) => total + producto.cantidad, 0);
  };

  const esUrgente = () => {
    return pedido.prioridad === 'Alta' || pedido.prioridad === 'Urgente';
  };

  const obtenerEstadoVencimiento = () => {
    if (!pedido.fechaVencimiento) return null;
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fv = new Date(`${pedido.fechaVencimiento}T00:00:00`);
      if (isNaN(fv.getTime())) return null;
      const diffDays = Math.floor((fv - hoy) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return { color: 'bg-red-100 text-red-800', label: 'Vencido' };
      }
      if (diffDays <= 2) {
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Próx.' };
      }
      return { color: 'bg-green-100 text-green-800', label: 'OK' };
    } catch (_) {
      return null;
    }
  };

  return (
    <div className={`border rounded-lg p-3 bg-white shadow-sm overflow-hidden w-full ${
      esUrgente() ? 'border-l-4 border-l-red-500' : ''
    }`}>
      {/* Header compacto */}
      <div className="mb-2">
        {/* Badges de estado */}
        <div className="flex flex-wrap items-center gap-1 mb-1">
          <div className="flex items-center gap-1">
            {obtenerIconoEstado(pedido.estado)}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${obtenerColorEstado(pedido.estado)}`}>
              {pedido.estado}
            </span>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${obtenerColorPrioridad(pedido.prioridad)}`}>
            {pedido.prioridad}
          </span>
          {(() => { const v = obtenerEstadoVencimiento(); return v ? (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${v.color}`}>{v.label}</span>
          ) : null; })()}
        </div>

        {/* Cliente */}
        <h3 className="font-bold text-sm text-gray-900 leading-tight">{pedido.cliente || '(Sin nombre)'}</h3>
        <div className="text-xs text-gray-500">#{pedido.id}</div>

        {/* Dirección */}
        <div className="flex items-start gap-1 text-gray-600 mt-1">
          <MapPin size={12} className="flex-shrink-0 mt-0.5" />
          <span className="text-xs leading-tight">{pedido.direccion}</span>
        </div>
      </div>

      {/* Productos - compacto */}
      <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
        <div className="font-medium text-gray-700 mb-1">
          {calcularTotalProductos()} productos
        </div>
        {pedido.productos.slice(0, 2).map((producto, index) => (
          <div key={index} className="flex justify-between text-gray-600">
            <span className="truncate flex-1 mr-2">{producto.descripcion || producto.modelo || 'Producto'}</span>
            <span className="flex-shrink-0">x{producto.cantidad}</span>
          </div>
        ))}
        {pedido.productos.length > 2 && (
          <div className="text-gray-400 text-[10px]">+{pedido.productos.length - 2} más...</div>
        )}
      </div>

      {/* Info adicional - una línea */}
      <div className="text-[10px] text-gray-500 mb-2">
        {pedido.fechaCreacion} • {pedido.horaEstimada || 'Sin hora'}
        {pedido.coordenadas && ` • ${pedido.coordenadas.lat.toFixed(2)},${pedido.coordenadas.lng.toFixed(2)}`}
      </div>

      {/* Camión asignado */}
      {pedido.camionAsignado && (
        <div className="mb-2 p-1.5 bg-green-50 border border-green-200 rounded text-xs">
          <div className="flex items-center gap-1 text-green-700">
            <Truck size={12} />
            <span className="font-medium">{pedido.camionAsignado}</span>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="pt-2 border-t space-y-1.5">
        {/* Selectores en stack vertical */}
        {!pedido.camionAsignado && camiones.length > 0 && (
          <select
            className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            onChange={(e) => e.target.value && onAsignarCamion(pedido.id, e.target.value)}
            defaultValue=""
          >
            <option value="">Asignar Camión...</option>
            {camiones.map(camion => (
              <option key={camion.id} value={camion.id}>
                {camion.id} - {camion.conductor}
              </option>
            ))}
          </select>
        )}

        {pedido.estado !== 'Entregado' && (
          <select
            className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
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

        {/* Botones */}
        <div className="flex gap-1.5">
          <button
            onClick={() => onVerDetalles(pedido)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            <Eye size={12} />
            Ver
          </button>
          {pedido.estado === 'Pendiente' && (
            <button
              onClick={() => onEliminar(pedido.id)}
              className="flex-1 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Indicador urgente */}
      {esUrgente() && (
        <div className="mt-2 flex items-center gap-1 text-red-600 text-[10px]">
          <AlertCircle size={10} />
          <span className="font-medium">
            {pedido.prioridad === 'Urgente' ? 'URGENTE' : 'Alta prioridad'}
          </span>
        </div>
      )}
    </div>
  );
};

export default TarjetaPedido;
