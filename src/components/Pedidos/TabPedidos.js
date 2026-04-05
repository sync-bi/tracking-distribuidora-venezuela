// src/components/Pedidos/TabPedidos.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Package, Search, Calendar, Database, Loader2 } from 'lucide-react';
import TarjetaPedido from './TarjetaPedido';
import { obtenerCorreccionesClientes } from '../../services/firestoreService';

// Helper: fecha ISO (YYYY-MM-DD) de hace N días
const fechaHaceDias = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().split('T')[0];
};

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
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('pendientes');
  const [filtroPrioridad] = useState('todos');
  const [filtroCliente] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(fechaHaceDias(15));
  const [filtroZona, setFiltroZona] = useState('');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroVencDesde] = useState('');
  const [filtroVencHasta] = useState('');
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

  // Extraer fecha ISO de un pedido (soporta Timestamp de Firestore y strings)
  const extraerFechaISO = useCallback((fechaCreacion) => {
    if (!fechaCreacion) return '';
    if (fechaCreacion.toDate) {
      return fechaCreacion.toDate().toISOString().split('T')[0];
    }
    if (typeof fechaCreacion === 'string' && fechaCreacion.length >= 10) {
      return fechaCreacion.substring(0, 10);
    }
    return '';
  }, []);

  // Filtrar pedidos según criterios
  const pedidosFiltrados = pedidos.filter(pedido => {
    // Filtro de estado unificado: "pendientes" = todo lo que NO es Entregado/Entrega Parcial/Desistido
    const cumpleFiltroEstado = filtroEstado === 'pendientes'
      ? (pedido.estado !== 'Entregado' && pedido.estado !== 'Entrega Parcial' && pedido.estado !== 'Desistido')
      : filtroEstado === 'todos'
        ? true
        : pedido.estado === filtroEstado;
    const cumpleFiltroPrioridad = filtroPrioridad === 'todos' || pedido.prioridad === filtroPrioridad;
    const cumpleBusqueda = terminoBusqueda === '' ||
      (pedido.cliente || '').toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      (pedido.id || '').toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      (pedido.direccion || '').toLowerCase().includes(terminoBusqueda.toLowerCase());
    const cumpleCliente = (filtroCliente === '') || ((pedido.cliente || '').toLowerCase().includes(filtroCliente.toLowerCase()));
    // Filtro de fecha: desde la fecha seleccionada hacia adelante
    const fechaPedido = extraerFechaISO(pedido.fechaCreacion);
    const cumpleFechaDesde = (filtroFechaDesde === '') || (fechaPedido && fechaPedido >= filtroFechaDesde);
    const ciudadPedidoRaw = (pedido.ciudad && String(pedido.ciudad)) || (pedido.direccion ? String(pedido.direccion).split(',').slice(-1)[0] : '') || '';
    const ciudadPedidoCanon = canonCiudad(ciudadPedidoRaw);
    const cumpleZona = (filtroZona === '') || (ciudadPedidoCanon === filtroZona);
    const vence = (pedido.fechaVencimiento || '');
    const cumpleVencDesde = (filtroVencDesde === '') || (vence && vence >= filtroVencDesde);
    const cumpleVencHasta = (filtroVencHasta === '') || (vence && vence <= filtroVencHasta);

    return cumpleFiltroEstado && cumpleFiltroPrioridad && cumpleCliente && cumpleFechaDesde && cumpleZona && cumpleVencDesde && cumpleVencHasta && cumpleBusqueda;
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


  // Convertir pedido SQL al formato local
  const sqlPedidoToLocal = useCallback((p, correcciones = {}) => {
    let coordenadas = null;
    if (p.coordenadas && !p.coordenadas.geocodificada) {
      coordenadas = p.coordenadas;
    }
    if (!coordenadas) {
      const codigoNorm = (p.codigoCliente || '').replace(/^0+/, '');
      const correccion = correcciones[codigoNorm] || correcciones[p.codigoCliente];
      if (correccion?.coordenadas?.lat && correccion?.coordenadas?.lng) {
        coordenadas = { lat: correccion.coordenadas.lat, lng: correccion.coordenadas.lng };
      }
    }
    if (!coordenadas && p.coordenadas?.geocodificada) {
      coordenadas = p.coordenadas;
    }
    if (!coordenadas) coordenadas = { lat: 10.4806, lng: -66.9036 };

    return {
      id: p.numeroPedido,
      numeroPedido: p.numeroPedido,
      cliente: p.nombreCliente || '',
      codigoCliente: p.codigoCliente || '',
      direccion: p.direccionCliente || '',
      telefono: p.telefonoCliente || '',
      ciudad: p.ciudadCliente || '',
      zona: p.nombreZona || '',
      coordenadas,
      productos: (p.productos || []).map(prod => ({
        tipo: 'Repuesto', marca: '',
        cantidad: prod.cantidad || 1,
        pendiente: prod.pendiente || 0,
        despachado: prod.despachado || 0,
        modelo: prod.codigoArticulo || '',
        descripcion: prod.descripcion || prod.codigoArticulo || '',
        precioUnitario: prod.precioUnitario,
        subtotal: prod.montoRenglon
      })),
      prioridad: 'Media',
      estado: p.estadoDespacho === 'Despachado' ? 'Entregado' : 'Pendiente',
      estadoDespachoSQL: p.estadoDespacho,
      porcentajeDespacho: p.porcentajeDespacho || 0,
      fechaCreacion: p.fechaEmision ? new Date(p.fechaEmision).toISOString().split('T')[0] : '',
      fechaVencimiento: p.fechaVencimiento ? new Date(p.fechaVencimiento).toISOString().split('T')[0] : '',
      horaEstimada: '',
      camionAsignado: null,
      vendedorAsignado: p.nombreVendedor || 'Sin asignar',
      montoNeto: p.totalNeto || 0
    };
  }, []);

  // Sincronizar pedidos desde SQL Server
  const sincronizarPedidos = useCallback(async () => {
    setSincronizando(true);
    try {
      const res = await fetch('/api/pedidos?desde=2026-03-15&estado=pendientes', { cache: 'no-store' });
      if (!res.ok) throw new Error('API no disponible');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Error en API');

      let correcciones = {};
      try { correcciones = await obtenerCorreccionesClientes(); } catch (_) {}

      const pedidosSQL = data.pedidos.map(p => sqlPedidoToLocal(p, correcciones));

      // Pedidos en Firestore que NO están en SQL (ya fueron despachados) → eliminar
      const idsSQL = new Set(pedidosSQL.map(p => p.id));
      for (const pedido of pedidos) {
        if (!idsSQL.has(pedido.numeroPedido || pedido.id) && pedido.estado === 'Pendiente') {
          try { await onEliminarPedido(pedido.id); } catch (_) {}
        }
      }

      // Pedidos en SQL que NO están en Firestore → crear
      const idsFirestore = new Set(pedidos.map(p => p.numeroPedido || p.id));
      let nuevos = 0;
      for (const pedido of pedidosSQL) {
        if (!idsFirestore.has(pedido.id)) {
          await onCrearPedido(pedido);
          nuevos++;
        }
      }

      setUltimaSync(new Date());
      console.log(`✅ Sincronización: ${nuevos} nuevos, ${pedidosSQL.length} pendientes en SQL`);
    } catch (err) {
      console.error('Error sincronizando:', err);
      alert('Error al sincronizar: ' + err.message);
    } finally {
      setSincronizando(false);
    }
  }, [pedidos, onCrearPedido, onEliminarPedido, sqlPedidoToLocal]);

  // Sincronizar automáticamente al cargar si no hay pedidos
  useEffect(() => {
    if (pedidos.length === 0 && !sincronizando) {
      sincronizarPedidos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6">
      {/* Header con estadísticas */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Pedidos</h2>
            {ultimaSync && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Database size={12} />
                Última sync: {ultimaSync.toLocaleTimeString('es-VE')}
              </p>
            )}
          </div>
          <button
            onClick={sincronizarPedidos}
            disabled={sincronizando}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          >
            {sincronizando ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            {sincronizando ? 'Sincronizando...' : 'Actualizar'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Búsqueda */}
          <div className="relative md:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente, ID o dirección..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
          </div>

          {/* Filtro por fecha desde */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              className="w-full pl-10 pr-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              title="Mostrar pedidos desde esta fecha"
            />
          </div>

          {/* Filtro por estado - unificado */}
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="pendientes">Pendientes (activos)</option>
            <option value="todos">Todos los estados</option>
            <option value="Pendiente">Solo Pendiente</option>
            <option value="En Consolidación">En Consolidación</option>
            <option value="Asignado">Asignado</option>
            <option value="En Ruta">En Ruta</option>
            <option value="Entregado">Entregado</option>
            <option value="Entrega Parcial">Entrega Parcial</option>
            <option value="Desistido">Desistido</option>
          </select>

          {/* Zona/Ciudad */}
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
          >
            <option value="">Todas las zonas</option>
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
              {filtroCliente || filtroFechaDesde || filtroZona || filtroVencDesde || filtroVencHasta || filtroEstado !== 'pendientes' || filtroPrioridad !== 'todos'
                ? 'No se encontraron pedidos con los filtros aplicados'
                : 'Aún no has creado ningún pedido'}
            </p>
          </div>
        )}
      </div>

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
              <div><strong>Fecha:</strong> {pedidoSeleccionado.fechaCreacion?.toDate ? pedidoSeleccionado.fechaCreacion.toDate().toLocaleDateString('es-VE') : (pedidoSeleccionado.fechaCreacion || '')}</div>
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
