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
  Users,
  MapPinned,
  History,
  Building2,
  RotateCcw,
  Map as MapIcon,
  Globe,
  Compass,
  Download,
  RefreshCw,
  Loader2,
  List
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useClientesCSV } from '../../hooks/useClientesCSV';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const TabGestionClientes = () => {
  const {
    clientes,
    ciudades,
    vendedores,
    historialCambios,
    cargando,
    error,
    actualizarUbicacionCliente,
    obtenerClientesFiltrados,
    buscarClientes,
    estadisticas,
    recargarClientes,
    exportarClientesCSV
  } = useClientesCSV();

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
  const [ciudadFiltro, setCiudadFiltro] = useState('todos');
  const [vendedorFiltro, setVendedorFiltro] = useState('todos');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [estiloMapa, setEstiloMapa] = useState('streets');
  const [vistaMobile, setVistaMobile] = useState('lista'); // 'lista' | 'mapa'

  // Filtrar clientes por ciudad, vendedor, estado y búsqueda
  const clientesFiltrados = useMemo(() => {
    let resultado = obtenerClientesFiltrados(ciudadFiltro, vendedorFiltro);

    // Aplicar filtro por estado de coordenadas
    switch (filtroEstado) {
      case 'conCoordenadas':
        resultado = resultado.filter(c =>
          c.coordenadas && c.coordenadas.lat && c.coordenadas.lng &&
          c.coordenadas.lat !== 0 && c.coordenadas.lng !== 0
        );
        break;
      case 'sinCoordenadas':
        resultado = resultado.filter(c =>
          !c.coordenadas || !c.coordenadas.lat || !c.coordenadas.lng ||
          c.coordenadas.lat === 0 || c.coordenadas.lng === 0
        );
        break;
      case 'corregidas':
        resultado = resultado.filter(c => c.coordenadas?.corregida);
        break;
      case 'sinCorregir':
        resultado = resultado.filter(c => !c.coordenadas?.corregida);
        break;
      default:
        break;
    }

    // Aplicar búsqueda
    if (busqueda) {
      const terminoLower = busqueda.toLowerCase();
      resultado = resultado.filter(c =>
        c.nombre?.toLowerCase().includes(terminoLower) ||
        c.codigoCliente?.toLowerCase().includes(terminoLower) ||
        c.direccion?.toLowerCase().includes(terminoLower) ||
        c.ciudad?.toLowerCase().includes(terminoLower) ||
        c.vendedorAsignado?.toLowerCase().includes(terminoLower)
      );
    }

    return resultado;
  }, [clientes, busqueda, ciudadFiltro, vendedorFiltro, filtroEstado, obtenerClientesFiltrados]);

  // Iniciar edición de cliente
  const handleIniciarEdicion = useCallback((cliente) => {
    setClienteEditando(cliente.id);
    setClienteSeleccionado(cliente);
    setFormulario({
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      lat: cliente.coordenadas?.lat || 10.4806,
      lng: cliente.coordenadas?.lng || -66.9036
    });

    // Centrar mapa en el cliente
    if (cliente.coordenadas?.lat && cliente.coordenadas?.lng) {
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

    actualizarUbicacionCliente(
      clienteSeleccionado.id,
      nuevaUbicacion,
      'manual',
      'Corrección manual de ubicación'
    );

    handleCancelarEdicion();
  }, [clienteSeleccionado, formulario, actualizarUbicacionCliente, handleCancelarEdicion]);

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
    setArrastrando(false);
  }, []);

  // Hacer zoom a cliente seleccionado
  const handleZoomCliente = useCallback((cliente) => {
    if (cliente.coordenadas?.lat && cliente.coordenadas?.lng) {
      setViewport({
        latitude: cliente.coordenadas.lat,
        longitude: cliente.coordenadas.lng,
        zoom: 17
      });
      setClienteSeleccionado(cliente);
    }
  }, []);

  // Obtener URL del estilo de mapa
  const obtenerEstiloMapa = () => {
    const estilos = {
      streets: 'mapbox://styles/mapbox/streets-v12',
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      navigation: 'mapbox://styles/mapbox/navigation-day-v1'
    };
    return estilos[estiloMapa] || estilos.streets;
  };

  // Pantalla de carga
  if (cargando) {
    return (
      <div className="fixed inset-0 top-[168px] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando clientes desde CSV...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="fixed inset-0 top-[168px] flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar clientes</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Asegúrate de que el archivo <code className="bg-gray-100 px-1 rounded">clientes.csv</code> esté en la carpeta <code className="bg-gray-100 px-1 rounded">public/</code>
          </p>
          <button
            onClick={recargarClientes}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-[116px] md:top-[168px] flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-6">
      {/* Toggle vista móvil */}
      <div className="md:hidden flex gap-2 mb-2">
        <button
          onClick={() => setVistaMobile('lista')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
            vistaMobile === 'lista' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <List size={18} />
          Lista
        </button>
        <button
          onClick={() => setVistaMobile('mapa')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
            vistaMobile === 'mapa' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <MapIcon size={18} />
          Mapa
        </button>
      </div>

      {/* Panel izquierdo - Lista de clientes */}
      <div className={`${vistaMobile === 'lista' ? 'flex' : 'hidden'} md:flex w-full md:w-[420px] lg:w-[480px] flex-col bg-white rounded-lg shadow-lg overflow-hidden`}>
        {/* Header compacto con estadísticas */}
        <div className="p-3 border-b bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 size={20} />
              Clientes
            </h2>
            {/* Estadísticas inline */}
            <div className="flex items-center gap-3 text-xs">
              <div className="text-center">
                <div className="font-bold text-white">{estadisticas.total}</div>
                <div className="text-blue-200">Total</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-300">{estadisticas.conCoordenadas}</div>
                <div className="text-blue-200">GPS</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-300">{estadisticas.corregidas}</div>
                <div className="text-blue-200">Corr.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros compactos */}
        <div className="p-2 space-y-2 border-b bg-gray-50">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar cliente, código, ciudad..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtros en grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Filtro por ciudad */}
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={ciudadFiltro}
              onChange={(e) => setCiudadFiltro(e.target.value)}
            >
              <option value="todos">Todas ciudades</option>
              {ciudades.map(ciudad => (
                <option key={ciudad} value={ciudad}>
                  {ciudad}
                </option>
              ))}
            </select>

            {/* Filtro por vendedor */}
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={vendedorFiltro}
              onChange={(e) => setVendedorFiltro(e.target.value)}
            >
              <option value="todos">Todos vendedores</option>
              {vendedores.map(vendedor => (
                <option key={vendedor} value={vendedor}>
                  {vendedor}
                </option>
              ))}
            </select>

            {/* Filtro por estado */}
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos estados</option>
              <option value="conCoordenadas">Con GPS</option>
              <option value="sinCoordenadas">Sin GPS</option>
              <option value="corregidas">Corregidas</option>
              <option value="sinCorregir">Sin corregir</option>
            </select>
          </div>

          {/* Acciones compactas en línea */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={recargarClientes}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
              title="Recargar CSV"
            >
              <RefreshCw size={12} />
            </button>
            <button
              onClick={exportarClientesCSV}
              className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
              title="Exportar CSV"
            >
              <Download size={12} />
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300"
              onClick={() => {
                setFiltroEstado('todos');
                setCiudadFiltro('todos');
                setVendedorFiltro('todos');
                setBusqueda('');
              }}
              title="Limpiar filtros"
            >
              <RotateCcw size={12} />
            </button>
            <div className="flex-1" />
            {/* Estilo de mapa mini */}
            <div className="flex gap-0.5 bg-gray-100 rounded p-0.5">
              <button
                className={`p-1 rounded ${estiloMapa === 'streets' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setEstiloMapa('streets')}
                title="Vista calles"
              >
                <MapIcon size={12} />
              </button>
              <button
                className={`p-1 rounded ${estiloMapa === 'satellite' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setEstiloMapa('satellite')}
                title="Vista satélite"
              >
                <Globe size={12} />
              </button>
              <button
                className={`p-1 rounded ${estiloMapa === 'navigation' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setEstiloMapa('navigation')}
                title="Vista navegación"
              >
                <Compass size={12} />
              </button>
            </div>
          </div>

          {/* Contador y acciones */}
          <div className="flex items-center justify-between text-xs pt-1 border-t">
            <span className="text-gray-600 font-medium">
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <History size={14} />
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
                {busqueda || ciudadFiltro !== 'todos'
                  ? 'No se encontraron clientes con los filtros aplicados'
                  : 'No hay clientes disponibles'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {clientesFiltrados.map((cliente) => {
                const esEditando = clienteEditando === cliente.id;
                const esSeleccionado = clienteSeleccionado?.id === cliente.id;
                const tieneUbicacion = cliente.coordenadas?.lat && cliente.coordenadas?.lng &&
                  cliente.coordenadas.lat !== 0 && cliente.coordenadas.lng !== 0;

                return (
                  <div
                    key={cliente.id}
                    className={`p-2.5 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                      esSeleccionado ? 'bg-blue-50 border-l-blue-500' :
                      esEditando ? 'bg-yellow-50 border-l-yellow-500' :
                      'border-l-transparent'
                    }`}
                    onClick={() => handleZoomCliente(cliente)}
                  >
                    {/* Fila principal: Nombre + Iconos de estado + Botón editar */}
                    <div className="flex items-center gap-2">
                      {/* Indicador de ubicación */}
                      <div className="flex-shrink-0">
                        {tieneUbicacion ? (
                          <div className={`w-2.5 h-2.5 rounded-full ${cliente.coordenadas?.corregida ? 'bg-green-500' : 'bg-blue-500'}`} />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                        )}
                      </div>

                      {/* Info del cliente */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {cliente.nombre}
                          </h3>
                          {cliente.coordenadas?.corregida && (
                            <span className="px-1 py-0.5 bg-green-100 text-green-700 text-[10px] rounded flex-shrink-0">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          {cliente.codigoCliente && (
                            <span className="font-mono">{cliente.codigoCliente}</span>
                          )}
                          {cliente.ciudad && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-blue-600">{cliente.ciudad}</span>
                            </>
                          )}
                          {cliente.vendedorAsignado && cliente.vendedorAsignado !== 'Sin asignar' && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-purple-600 truncate max-w-[80px]">{cliente.vendedorAsignado}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Botón editar compacto */}
                      {!esEditando && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIniciarEdicion(cliente);
                          }}
                          className="flex-shrink-0 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Corregir ubicación"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Dirección (solo si está seleccionado o expandido) */}
                    {(esSeleccionado || esEditando) && cliente.direccion && (
                      <div className="mt-1.5 pl-5 text-xs text-gray-500 flex items-start gap-1">
                        <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{cliente.direccion}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel central - Mapa */}
      <div className={`${vistaMobile === 'mapa' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white rounded-lg shadow-lg overflow-hidden`}>
        {/* Header del mapa */}
        <div className="p-2 md:p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm md:text-base">
            <MapPinned size={18} className="text-blue-600" />
            <span className="hidden sm:inline">Mapa de Ubicaciones</span>
            <span className="sm:hidden">Mapa</span>
            {clienteSeleccionado && (
              <span className="text-xs md:text-sm font-normal text-gray-500 ml-2 truncate max-w-[150px] md:max-w-none">
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
            mapStyle={obtenerEstiloMapa()}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />

            {/* Marcadores de clientes (no mostrar el que se está editando) */}
            {clientesFiltrados.map((cliente) => {
              if (!cliente.coordenadas?.lat || !cliente.coordenadas?.lng ||
                  cliente.coordenadas.lat === 0 || cliente.coordenadas.lng === 0) return null;

              // Si este cliente se está editando, no mostrar su marcador aquí
              if (clienteEditando === cliente.id) return null;

              const esSeleccionado = clienteSeleccionado?.id === cliente.id;

              return (
                <Marker
                  key={cliente.id}
                  latitude={cliente.coordenadas.lat}
                  longitude={cliente.coordenadas.lng}
                  onClick={() => handleZoomCliente(cliente)}
                >
                  <div className="relative cursor-pointer">
                    <svg
                      width={esSeleccionado ? 36 : 32}
                      height={esSeleccionado ? 36 : 32}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                        fill={cliente.coordenadas?.corregida ? '#8b5cf6' : '#3b82f6'}
                        stroke="white"
                        strokeWidth="1.5"
                      />
                      <circle cx="12" cy="9" r="2.5" fill="white" />
                    </svg>
                  </div>
                </Marker>
              );
            })}

            {/* Marcador amarillo editable (solo cuando hay cliente editando) */}
            {clienteEditando && (
              <Marker
                key="marker-editando"
                latitude={formulario.lat}
                longitude={formulario.lng}
                draggable={true}
                onDragStart={handleMarkerDragStart}
                onDragEnd={handleMarkerDragEnd}
              >
                <div className="relative">
                  <div className="cursor-move animate-pulse">
                    <svg
                      width={44}
                      height={44}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                        fill="#eab308"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="9" r="2.5" fill="white" />
                    </svg>
                  </div>
                  {arrastrando && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Suelta para fijar
                    </div>
                  )}
                </div>
              </Marker>
            )}
          </Map>

          {/* Leyenda */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs">
            <h4 className="font-semibold mb-2 text-gray-700">Leyenda</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3b82f6" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <span>Ubicación original</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#8b5cf6" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <span>Ubicación corregida</span>
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

      {/* Panel derecho - Edición (modal en móvil, panel en desktop) */}
      {clienteEditando && clienteSeleccionado && (
        <>
          {/* Overlay para móvil */}
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleCancelarEdicion} />

          <div className="fixed md:relative inset-x-2 bottom-2 top-auto md:inset-auto md:w-80 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col z-50 max-h-[80vh] md:max-h-none">
            {/* Header */}
            <div className="p-3 md:p-4 bg-yellow-500 text-white">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
                  <Edit2 size={18} />
                  Editando Cliente
                </h3>
                <button
                  onClick={handleCancelarEdicion}
                  className="p-1 hover:bg-yellow-600 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs md:text-sm text-yellow-100 truncate">
                {clienteSeleccionado.nombre}
              </p>
            </div>

          {/* Formulario */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Información del cliente */}
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-2">Información del Cliente</p>
              <div className="space-y-1 text-blue-700">
                <p>🏢 Ciudad: {clienteSeleccionado.ciudad || 'Sin ciudad'}</p>
                <p>🔖 Código: {clienteSeleccionado.codigoCliente || 'N/A'}</p>
              </div>
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
                Arrastra el marcador amarillo en el mapa para posicionar la ubicación exacta del cliente.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-3 md:p-4 border-t bg-gray-50 space-y-2">
            <button
              onClick={handleGuardarCambios}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm md:text-base"
            >
              <Save size={18} />
              Guardar Cambios
            </button>
            <button
              onClick={handleCancelarEdicion}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
        </>
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
                          <p className="text-xs text-gray-500">
                            Código: {cambio.codigoCliente}
                          </p>
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
                          <strong>Nueva ubicación:</strong> {cambio.ubicacionNueva.lat.toFixed(6)}, {cambio.ubicacionNueva.lng.toFixed(6)}
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
