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
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Prox. venc.' };
      }
      return { color: 'bg-green-100 text-green-800', label: 'Vigente' };
    } catch (_) {
      return null;
    }
  };

  return (
    <div className={`border rounded-lg p-3 md:p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${
      esUrgente() ? 'border-l-4 border-l-red-500' : ''
    }`}>
      {/* Header - responsive */}
      <div className="mb-3">
        {/* Badges de estado en fila superior en móvil */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            {obtenerIconoEstado(pedido.estado)}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${obtenerColorEstado(pedido.estado)}`}>
              {pedido.estado}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${obtenerColorPrioridad(pedido.prioridad)}`}>
            {pedido.prioridad}
          </span>
          {esUrgente() && <AlertCircle size={16} className="text-red-500 ml-auto" />}
        </div>

        {/* Info del cliente */}
        <h3 className="font-bold text-base md:text-lg text-gray-900 break-words">{pedido.cliente || '(Sin nombre)'}</h3>
        <div className="text-sm text-gray-600 mb-1">N° Pedido: {pedido.id}</div>
        {(() => { const v = obtenerEstadoVencimiento(); return v ? (
          <div className="text-xs flex flex-wrap items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full ${v.color}`}>{v.label}</span>
            <span className="text-gray-600">Venc: {pedido.fechaVencimiento}</span>
          </div>
        ) : null; })()}
        {pedido.almacen && (
          <div className="text-xs text-gray-600 mb-1">Desde almacen: {pedido.almacen}</div>
        )}
        <div className="flex items-start gap-2 text-gray-600">
          <MapPin size={14} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm break-words">{pedido.direccion}</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 mb-4 text-xs md:text-sm text-gray-600">
        <div>
          <span className="font-medium">Fecha:</span> {pedido.fechaCreacion}
        </div>
        {pedido.fechaVencimiento && (
          <div>
            <span className="font-medium">Vencimiento:</span> {pedido.fechaVencimiento}
          </div>
        )}
        <div>
          <span className="font-medium">Hora estimada:</span> {pedido.horaEstimada}
        </div>
        {pedido.almacen && (
          <div className="col-span-1 sm:col-span-2">
            <span className="font-medium">Almacen:</span> {pedido.almacen}
          </div>
        )}
        {pedido.zona && (
          <div className="col-span-1 sm:col-span-2">
            <span className="font-medium">Ruta:</span> {pedido.zona}
          </div>
        )}
        {pedido.coordenadas && (
          <div className="col-span-1 sm:col-span-2">
            <span className="font-medium">Coord:</span> {pedido.coordenadas.lat.toFixed(4)}, {pedido.coordenadas.lng.toFixed(4)}
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

      {/* Acciones - responsive */}
      <div className="pt-3 border-t space-y-2">
        {/* Fila de selectores */}
        <div className="flex flex-wrap gap-2">
          {/* Asignar camión */}
          {!pedido.camionAsignado && camiones.length > 0 && (
            <select
              className="text-xs md:text-sm p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 flex-1 min-w-[120px]"
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
              className="text-xs md:text-sm p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 flex-1 min-w-[100px]"
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

        {/* Fila de botones */}
        <div className="flex gap-2">
          {/* Ver detalles */}
          <button
            onClick={() => onVerDetalles(pedido)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500 text-white rounded text-xs md:text-sm hover:bg-blue-600 transition-colors"
            title="Ver detalles"
          >
            <Eye size={14} />
            <span>Detalles</span>
          </button>

          {/* Eliminar (solo si está pendiente) */}
          {pedido.estado === 'Pendiente' && (
            <button
              onClick={() => onEliminar(pedido.id)}
              className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded text-xs md:text-sm hover:bg-red-600 transition-colors"
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
