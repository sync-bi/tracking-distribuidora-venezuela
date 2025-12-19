// src/components/Clientes/TabGestionClientes.js
import React, { useState, useMemo, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import {
  MapPin,
  Edit2,
  Save,
  X,
  Search,
  AlertTriangle,
  CheckCircle,
  Users,
  MapPinned,
  Filter,
  History,
  Building2,
  Navigation
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useClientes } from '../../hooks/useClientes';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const TabGestionClientes = ({ pedidos, onActualizarPedido }) => {
  const {
    clientes,
    vendedores,
    historialCambios,
    actualizarUbicacionCliente,
    obtenerClientesPorVendedor,
    buscarClientes,
    estadisticas
  } = useClientes(pedidos);

  const [viewport, setViewport] = useState({
    latitude: 10.4806,
    longitude: -66.9036,
    zoom: 6
  });

  const [clienteEditando, setClienteEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    direccion: '',
    ciudad: '',
    lat: 0,
    lng: 0
  });
  const [busqueda, setBusqueda] = useState('');
  const [vendedorFiltro, setVendedorFiltro] = useState('todos');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [marcadorTemporal, setMarcadorTemporal] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    let resultado = obtenerClientesPorVendedor(vendedorFiltro);

    if (busqueda) {
      resultado = buscarClientes(busqueda).filter(c =>
        vendedorFiltro === 'todos' || c.vendedorAsignado === vendedorFiltro
      );
    }

    return resultado;
  }, [clientes, busqueda, vendedorFiltro, obtenerClientesPorVendedor, buscarClientes]);

  // Iniciar edición de cliente
  const handleIniciarEdicion = useCallback((cliente) => {
    setClienteEditando(cliente.nombre);
    setClienteSeleccionado(cliente);
    setFormulario({
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      lat: cliente.coordenadas?.lat || 10.4806,
      lng: cliente.coordenadas?.lng || -66.9036
    });

    // Centrar mapa en el cliente
    if (cliente.coordenadas) {
      setViewport(prev => ({
        ...prev,
        latitude: cliente.coordenadas.lat,
        longitude: cliente.coordenadas.lng,
        zoom: 14
      }));
    }
  }, []);

  // Cancelar edición
  const handleCancelarEdicion = useCallback(() => {
    setClienteEditando(null);
    setClienteSeleccionado(null);
    setMarcadorTemporal(null);
    setFormulario({
      direccion: '',
      ciudad: '',
      lat: 0,
      lng: 0
    });
  }, []);

  // Guardar cambios
  const handleGuardarCambios = useCallback(() => {
    if (!clienteSeleccionado) return;

    const nuevaUbicacion = {
      direccion: formulario.direccion,
      ciudad: formulario.ciudad,
      lat: formulario.lat,
      lng: formulario.lng,
      corregida: true
    };

    // Obtener todos los pedidos de este cliente
    const pedidosCliente = pedidos.filter(p =>
      p.cliente === clienteSeleccionado.nombre ||
      p.codigoCliente === clienteSeleccionado.codigoCliente
    );

    // Actualizar todos los pedidos del cliente
    pedidosCliente.forEach(pedido => {
      onActualizarPedido(pedido.id, {
        direccion: formulario.direccion,
        ciudad: formulario.ciudad,
        coordenadas: {
          lat: formulario.lat,
          lng: formulario.lng,
          corregida: true
        }
      });
    });

    // Registrar en historial
    actualizarUbicacionCliente(
      clienteSeleccionado.nombre,
      nuevaUbicacion,
      pedidosCliente,
      'manual',
      'Corrección de ubicación por vendedor'
    );

    handleCancelarEdicion();
  }, [clienteSeleccionado, formulario, pedidos, onActualizarPedido, actualizarUbicacionCliente, handleCancelarEdicion]);

  // Manejar drag del marcador
  const handleMarkerDragStart = useCallback(() => {
    setArrastrando(true);
  }, []);

  const handleMarkerDragEnd = useCallback((event) => {
    const { lngLat } = event;
    setFormulario(prev => ({
      ...prev,
      lat: lngLat.lat,
      lng: lngLat.lng
    }));
    setMarcadorTemporal({ lat: lngLat.lat, lng: lngLat.lng });
    setArrastrando(false);
  }, []);

  // Hacer zoom a cliente seleccionado
  const handleZoomCliente = useCallback((cliente) => {
    if (cliente.coordenadas) {
      setViewport({
        latitude: cliente.coordenadas.lat,
        longitude: cliente.coordenadas.lng,
        zoom: 14
      });
      setClienteSeleccionado(cliente);
    }
  }, []);

  return (
    <div className="fixed inset-0 top-[168px] flex gap-4 p-6">
      {/* Panel izquierdo - Lista de clientes */}
      <div className="w-96 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 size={24} />
            Gestión de Clientes
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Corrección de ubicaciones por vendedor
          </p>
        </div>

        {/* Estadísticas */}
        <div className="p-4 bg-blue-50 border-b">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
              <div className="text-xs text-gray-600">Total Clientes</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.porcentajeCompleto}%
              </div>
              <div className="text-xs text-gray-600">Ubicados</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 space-y-3 border-b bg-gray-50">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtro por vendedor */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={vendedorFiltro}
              onChange={(e) => setVendedorFiltro(e.target.value)}
            >
              <option value="todos">Todos los vendedores</option>
              {vendedores.map(vendedor => (
                <option key={vendedor} value={vendedor}>
                  {vendedor}
                </option>
              ))}
            </select>
          </div>

          {/* Contador */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <History size={16} />
              Historial
            </button>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="flex-1 overflow-y-auto">
          {clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Users size={48} className="mb-4" />
              <p className="text-center">
                {busqueda || vendedorFiltro !== 'todos'
                  ? 'No se encontraron clientes con los filtros aplicados'
                  : 'No hay clientes disponibles'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {clientesFiltrados.map((cliente) => {
                const esEditando = clienteEditando === cliente.nombre;
                const tieneUbicacion = cliente.coordenadas?.lat && cliente.coordenadas?.lng;

                return (
                  <div
                    key={cliente.nombre}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      clienteSeleccionado?.nombre === cliente.nombre ? 'bg-blue-50' : ''
                    } ${esEditando ? 'bg-yellow-50' : ''}`}
                    onClick={() => handleZoomCliente(cliente)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {cliente.nombre}
                        </h3>
                        {cliente.codigoCliente && (
                          <p className="text-xs text-gray-500">
                            Código: {cliente.codigoCliente}
                          </p>
                        )}
                      </div>
                      {tieneUbicacion ? (
                        <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                      ) : (
                        <AlertTriangle className="text-orange-500 flex-shrink-0" size={20} />
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-1">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{cliente.direccion || 'Sin dirección'}</span>
                      </p>
                      {cliente.ciudad && (
                        <p className="text-xs text-gray-500 ml-5">{cliente.ciudad}</p>
                      )}
                      <p className="text-xs text-blue-600 ml-5">
                        👤 {cliente.vendedorAsignado}
                      </p>
                      <p className="text-xs text-gray-400 ml-5">
                        {cliente.totalPedidos} pedido{cliente.totalPedidos !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {!esEditando && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIniciarEdicion(cliente);
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit2 size={14} />
                        Corregir Ubicación
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel central - Mapa */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header del mapa */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <MapPinned size={20} className="text-blue-600" />
            Mapa de Ubicaciones
            {clienteSeleccionado && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                → {clienteSeleccionado.nombre}
              </span>
            )}
          </h3>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative">
          <Map
            {...viewport}
            onMove={evt => setViewport(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />

            {/* Marcadores de todos los clientes filtrados */}
            {clientesFiltrados.map((cliente) => {
              if (!cliente.coordenadas?.lat || !cliente.coordenadas?.lng) return null;

              const esEditando = clienteEditando === cliente.nombre;
              const esSeleccionado = clienteSeleccionado?.nombre === cliente.nombre;

              return (
                <Marker
                  key={cliente.nombre}
                  latitude={cliente.coordenadas.lat}
                  longitude={cliente.coordenadas.lng}
                  draggable={esEditando}
                  onDragStart={esEditando ? handleMarkerDragStart : undefined}
                  onDragEnd={esEditando ? handleMarkerDragEnd : undefined}
                  onClick={() => handleZoomCliente(cliente)}
                >
                  <div className="relative">
                    {/* Marcador preciso con punta - Solo azul o amarillo */}
                    <div className={`cursor-pointer transition-all ${
                      esEditando ? 'animate-pulse' : ''
                    }`}>
                      <svg
                        width={esEditando ? 40 : esSeleccionado ? 36 : 32}
                        height={esEditando ? 40 : esSeleccionado ? 36 : 32}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Punta precisa del marcador */}
                        <path
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                          fill={esEditando ? '#eab308' : '#3b82f6'}
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        {/* Punto central para precisión */}
                        <circle cx="12" cy="9" r="2.5" fill="white" />
                      </svg>
                    </div>
                    {esEditando && arrastrando && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Arrastra la punta
                      </div>
                    )}
                  </div>
                </Marker>
              );
            })}
          </Map>

          {/* Leyenda simplificada */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs">
            <h4 className="font-semibold mb-2 text-gray-700">Leyenda</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3b82f6" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <span>Ubicación del cliente</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#eab308" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <span>Editando (arrástralo)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Edición */}
      {clienteEditando && clienteSeleccionado && (
        <div className="w-80 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 bg-yellow-500 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold flex items-center gap-2">
                <Edit2 size={20} />
                Editando Cliente
              </h3>
              <button
                onClick={handleCancelarEdicion}
                className="p-1 hover:bg-yellow-600 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-yellow-100">
              {clienteSeleccionado.nombre}
            </p>
          </div>

          {/* Formulario */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Información del cliente */}
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-2">Información del Cliente</p>
              <div className="space-y-1 text-blue-700">
                <p>👤 Vendedor: {clienteSeleccionado.vendedorAsignado}</p>
                <p>📦 Pedidos: {clienteSeleccionado.totalPedidos}</p>
                {clienteSeleccionado.codigoCliente && (
                  <p>🔖 Código: {clienteSeleccionado.codigoCliente}</p>
                )}
              </div>
            </div>

            {/* Advertencia */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 flex items-start gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  Los cambios afectarán a <strong>{clienteSeleccionado.totalPedidos}</strong> pedido(s) de este cliente.
                </span>
              </p>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                value={formulario.direccion}
                onChange={(e) => setFormulario(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Dirección completa del cliente"
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formulario.ciudad}
                onChange={(e) => setFormulario(prev => ({ ...prev, ciudad: e.target.value }))}
                placeholder="Ciudad"
              />
            </div>

            {/* Coordenadas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitud
                </label>
                <input
                  type="number"
                  step="0.000001"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={formulario.lat}
                  onChange={(e) => setFormulario(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitud
                </label>
                <input
                  type="number"
                  step="0.000001"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={formulario.lng}
                  onChange={(e) => setFormulario(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Arrastra el marcador amarillo en el mapa. La punta del marcador indica la ubicación exacta.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-4 border-t bg-gray-50 space-y-2">
            <button
              onClick={handleGuardarCambios}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <Save size={20} />
              Guardar Cambios
            </button>
            <button
              onClick={handleCancelarEdicion}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X size={18} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de historial */}
      {mostrarHistorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History size={24} />
                Historial de Cambios
              </h3>
              <button
                onClick={() => setMostrarHistorial(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {historialCambios.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <History size={48} className="mx-auto mb-4" />
                  <p>No hay cambios registrados aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historialCambios.map((cambio, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{cambio.cliente}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(cambio.fecha).toLocaleString('es-VE')}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {cambio.metodo}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                          <strong>Pedidos afectados:</strong> {cambio.pedidosAfectados.join(', ')}
                        </p>
                        {cambio.razon && (
                          <p className="text-gray-600">
                            <strong>Razón:</strong> {cambio.razon}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabGestionClientes;
