// src/components/Pedidos/TabPedidos.js
import React, { useState } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import FormularioNuevoPedido from './FormularioNuevoPedido';
import TarjetaPedido from './TarjetaPedido';

const TabPedidos = ({
  pedidos,
  camiones,
  onCrearPedido,
  onAsignarCamion,
  onActualizarEstado,
  onEliminarPedido,
  onBuscarPedidos,
  estadisticas
}) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  // Filtrar pedidos según criterios
  const pedidosFiltrados = pedidos.filter(pedido => {
    const cumpleFiltroEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado;
    const cumpleFiltroPrioridad = filtroPrioridad === 'todos' || pedido.prioridad === filtroPrioridad;
    const cumpleBusqueda = terminoBusqueda === '' || 
      pedido.cliente.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      pedido.id.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      pedido.direccion.toLowerCase().includes(terminoBusqueda.toLowerCase());

    return cumpleFiltroEstado && cumpleFiltroPrioridad && cumpleBusqueda;
  });

  const handleCrearPedido = (nuevoPedido) => {
    onCrearPedido(nuevoPedido);
    setMostrarFormulario(false);
  };

  return (
    <div className="p-6">
      {/* Header con estadísticas */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Gestión de Pedidos</h2>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
            Nuevo Pedido
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{estadisticas.asignados}</div>
            <div className="text-sm text-gray-500">Asignados</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{estadisticas.enRuta}</div>
            <div className="text-sm text-gray-500">En Ruta</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">{estadisticas.entregados}</div>
            <div className="text-sm text-gray-500">Entregados</div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente, ID o dirección..."
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
            <option value="Pendiente">Pendiente</option>
            <option value="Asignado">Asignado</option>
            <option value="En Ruta">En Ruta</option>
            <option value="Entregado">Entregado</option>
          </select>

          {/* Filtro por prioridad */}
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
          >
            <option value="todos">Todas las prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>

          {/* Contador de resultados */}
          <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4">
            <span className="text-sm text-gray-600">
              {pedidosFiltrados.length} de {pedidos.length} pedidos
            </span>
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="grid gap-4">
        {pedidosFiltrados.length > 0 ? (
          pedidosFiltrados.map(pedido => (
            <TarjetaPedido
              key={pedido.id}
              pedido={pedido}
              camiones={camiones}
              onAsignarCamion={onAsignarCamion}
              onActualizarEstado={onActualizarEstado}
              onEliminar={onEliminarPedido}
              onVerDetalles={setPedidoSeleccionado}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 mb-2">
              <Package className="mx-auto" size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay pedidos</h3>
            <p className="text-gray-500">
              {terminoBusqueda || filtroEstado !== 'todos' || filtroPrioridad !== 'todos'
                ? 'No se encontraron pedidos con los filtros aplicados'
                : 'Aún no has creado ningún pedido'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <FormularioNuevoPedido
          onCrear={handleCrearPedido}
          onCerrar={() => setMostrarFormulario(false)}
        />
      )}

      {/* Modal de detalles */}
      {pedidoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Detalles del Pedido</h3>
            <div className="space-y-3">
              <div><strong>ID:</strong> {pedidoSeleccionado.id}</div>
              <div><strong>Cliente:</strong> {pedidoSeleccionado.cliente}</div>
              <div><strong>Dirección:</strong> {pedidoSeleccionado.direccion}</div>
              <div><strong>Estado:</strong> {pedidoSeleccionado.estado}</div>
              <div><strong>Prioridad:</strong> {pedidoSeleccionado.prioridad}</div>
              <div><strong>Fecha:</strong> {pedidoSeleccionado.fechaCreacion}</div>
              <div><strong>Hora estimada:</strong> {pedidoSeleccionado.horaEstimada}</div>
              
              <div>
                <strong>Productos:</strong>
                <div className="mt-2 space-y-1">
                  {pedidoSeleccionado.productos.map((producto, index) => (
                    <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                      {producto.cantidad}x {producto.tipo} {producto.marca} {producto.modelo}
                    </div>
                  ))}
                </div>
              </div>
              
              {pedidoSeleccionado.camionAsignado && (
                <div><strong>Camión asignado:</strong> {pedidoSeleccionado.camionAsignado}</div>
              )}
            </div>
            <button
              onClick={() => setPedidoSeleccionado(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabPedidos;