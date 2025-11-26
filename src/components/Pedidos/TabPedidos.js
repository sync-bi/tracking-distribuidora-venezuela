// src/components/Pedidos/TabPedidos.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Package, Search } from 'lucide-react';
import FormularioNuevoPedido from './FormularioNuevoPedido';
import TarjetaPedido from './TarjetaPedido';
import ImportPedidos from './ImportPedidos';

const TabPedidos = ({
  pedidos,
  camiones,
  onCrearPedido,
  onAsignarCamion,
  onActualizarEstado,
  onEliminarPedido,
  onBuscarPedidos,
  estadisticas,
  onImportarPedidos
}) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroVencDesde, setFiltroVencDesde] = useState('');
  const [filtroVencHasta, setFiltroVencHasta] = useState('');
  const [ordenarPorVencimiento, setOrdenarPorVencimiento] = useState(false);

  // Normaliza nombres de ciudades para unificar sinónimos
  const canonCiudad = useCallback((raw) => {
    if (!raw) return '';
    const s = String(raw).normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().trim();
    if (s === 'PTO ORDAZ' || s === 'PTO. ORDAZ') return 'PUERTO ORDAZ';
    if (s === 'VALENCIA EDO CARABOBO') return 'VALENCIA';
    return s;
  }, []);

  // Opciones de zonas/ciudades a partir de los pedidos importados (unificadas)
  const opcionesZona = useMemo(() => {
    const mapa = new Map(); // canon -> label
    (pedidos || []).forEach(p => {
      let ciudad = '';
      if (p.ciudad && String(p.ciudad).trim()) {
        ciudad = String(p.ciudad).trim();
      } else if (p.direccion && typeof p.direccion === 'string') {
        const partes = p.direccion.split(',');
        if (partes.length > 0) {
          ciudad = partes[partes.length - 1].trim();
        }
      }
      const canon = canonCiudad(ciudad);
      if (canon && !mapa.has(canon)) mapa.set(canon, ciudad || canon);
    });
    return Array.from(mapa.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [pedidos, canonCiudad]);

  // Activa ordenar por vencimiento por defecto cuando hay filtros de vencimiento
  useEffect(() => {
    if (filtroVencDesde || filtroVencHasta) {
      setOrdenarPorVencimiento(true);
    }
  }, [filtroVencDesde, filtroVencHasta]);

  // Filtrar pedidos según criterios
  const pedidosFiltrados = pedidos.filter(pedido => {
    const cumpleFiltroEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado;
    const cumpleFiltroPrioridad = filtroPrioridad === 'todos' || pedido.prioridad === filtroPrioridad;
    const cumpleBusqueda = terminoBusqueda === '' ||
      (pedido.cliente || '').toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      (pedido.id || '').toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      (pedido.direccion || '').toLowerCase().includes(terminoBusqueda.toLowerCase());
    const cumpleCliente = (filtroCliente === '') || ((pedido.cliente || '').toLowerCase().includes(filtroCliente.toLowerCase()));
    const cumpleFecha = (filtroFecha === '') || ((pedido.fechaCreacion || '') === filtroFecha);
    const ciudadPedidoRaw = (pedido.ciudad && String(pedido.ciudad)) || (pedido.direccion ? String(pedido.direccion).split(',').slice(-1)[0] : '') || '';
    const ciudadPedidoCanon = canonCiudad(ciudadPedidoRaw);
    const cumpleZona = (filtroZona === '') || (ciudadPedidoCanon === filtroZona);
    const vence = (pedido.fechaVencimiento || '');
    const cumpleVencDesde = (filtroVencDesde === '') || (vence && vence >= filtroVencDesde);
    const cumpleVencHasta = (filtroVencHasta === '') || (vence && vence <= filtroVencHasta);

    return cumpleFiltroEstado && cumpleFiltroPrioridad && cumpleCliente && cumpleFecha && cumpleZona && cumpleVencDesde && cumpleVencHasta && cumpleBusqueda;
  }).sort((a, b) => {
    if (ordenarPorVencimiento) {
      const va = a.fechaVencimiento || '';
      const vb = b.fechaVencimiento || '';
      if (va && vb) return va.localeCompare(vb);
      if (va && !vb) return -1; // con vencimiento primero
      if (!va && vb) return 1;
      // fallback a id
    }
    const na = (a.id || '').toString().match(/\d+/)?.[0];
    const nb = (b.id || '').toString().match(/\d+/)?.[0];
    if (na && nb) return Number(na) - Number(nb);
    return (a.id || '').localeCompare(b.id || '');
  });

  // Resumen de vencimientos en resultados filtrados
  const resumenVenc = useMemo(() => {
    let vencidos = 0, proximos = 0, vigentes = 0, sinFecha = 0;
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    (pedidosFiltrados || []).forEach(p => {
      const fv = p.fechaVencimiento;
      if (!fv) { sinFecha++; return; }
      const d = new Date(`${fv}T00:00:00`);
      if (isNaN(d.getTime())) { sinFecha++; return; }
      const diff = Math.floor((d - hoy) / (1000*60*60*24));
      if (diff < 0) vencidos++;
      else if (diff <= 2) proximos++;
      else vigentes++;
    });
    return { vencidos, proximos, vigentes, sinFecha };
  }, [pedidosFiltrados]);

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

        {/* Importar manual (oculto por defecto en producción) */}
        {String(process.env.REACT_APP_ALLOW_MANUAL_IMPORT || 'false').toLowerCase() === 'true' && (
          <div className="flex justify-end">
            <ImportPedidos onImport={onImportarPedidos} />
          </div>
        )}

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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

          {/* Cliente */}
          <input
            type="text"
            placeholder="Cliente"
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
          />

          {/* Fecha */}
          <input
            type="date"
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />

          {/* Venc. desde */}
          <input
            type="date"
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroVencDesde}
            onChange={(e) => setFiltroVencDesde(e.target.value)}
          />

          {/* Venc. hasta */}
          <input
            type="date"
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroVencHasta}
            onChange={(e) => setFiltroVencHasta(e.target.value)}
          />

          {/* Zona/Ciudad */}
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
          >
            <option value="">Todas las zonas/ciudades</option>
            {opcionesZona.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Contador de resultados */}
          <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4">
            <span className="text-sm text-gray-600">
              {pedidosFiltrados.length} de {pedidos.length} pedidos
            </span>
          </div>
          {/* Ordenar por vencimiento */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={ordenarPorVencimiento}
              onChange={(e) => setOrdenarPorVencimiento(e.target.checked)}
            />
            Ordenar por vencimiento
          </label>

          {/* Resumen vencimiento */}
          <div className="md:col-span-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Vencimiento:</span>
            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Vencidos: {resumenVenc.vencidos}</span>
            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Próx.: {resumenVenc.proximos}</span>
            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Vigentes: {resumenVenc.vigentes}</span>
            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Sin fecha: {resumenVenc.sinFecha}</span>
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
              {filtroCliente || filtroFecha || filtroZona || filtroVencDesde || filtroVencHasta || filtroEstado !== 'todos' || filtroPrioridad !== 'todos'
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
              {pedidoSeleccionado.almacen && (
                <div><strong>Desde almacen:</strong> {pedidoSeleccionado.almacen}</div>
              )}
              {pedidoSeleccionado.zona && (
                <div><strong>RUTA (Cuadrante/Zona):</strong> {pedidoSeleccionado.zona}</div>
              )}
              {(() => {
                const fv = pedidoSeleccionado.fechaVencimiento;
                if (!fv) return null;
                try {
                  const hoy = new Date();
                  hoy.setHours(0,0,0,0);
                  const d = new Date(`${fv}T00:00:00`);
                  const diff = Math.floor((d - hoy) / (1000*60*60*24));
                  let color = 'bg-green-100 text-green-800';
                  let label = 'Vigente';
                  if (diff < 0) { color = 'bg-red-100 text-red-800'; label = 'Vencido'; }
                  else if (diff <= 2) { color = 'bg-yellow-100 text-yellow-800'; label = 'Prox. venc.'; }
                  return (
                    <div>
                      <strong>Fecha vencimiento:</strong>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${color}`}>{label}</span>
                      <span className="ml-2">{fv}</span>
                    </div>
                  );
                } catch (_) { return null; }
              })()}
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
