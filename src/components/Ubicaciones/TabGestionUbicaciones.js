// src/components/Ubicaciones/TabGestionUbicaciones.js
import React, { useState, useMemo } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { MapPin, Edit2, Save, X, Search, AlertTriangle, CheckCircle, Navigation, Eye, RotateCcw, Filter, Layers, ZoomIn, ZoomOut, Map as MapIcon, Globe, Compass, Users } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const TabGestionUbicaciones = ({ pedidos, onActualizarPedido }) => {
  const [viewport, setViewport] = useState({
    latitude: 10.4806,
    longitude: -66.9036,
    zoom: 6
  });

  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    direccion: '',
    ciudad: '',
    lat: 0,
    lng: 0
  });
  const [busqueda, setBusqueda] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [marcadorTemporal, setMarcadorTemporal] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [mostrarCapas, setMostrarCapas] = useState(true);
  const [estiloMapa, setEstiloMapa] = useState('streets'); // streets, satellite, navigation
  const [agruparPorCliente, setAgruparPorCliente] = useState(false);

  // Filtrar pedidos por estado y búsqueda
  const pedidosFiltrados = useMemo(() => {
    let resultado = pedidos;

    // PRIMERO: Aplicar filtro de estado
    switch (filtroEstado) {
      case 'conCoordenadas':
        resultado = resultado.filter(p => p.coordenadas && p.coordenadas.lat && p.coordenadas.lng);
        break;
      case 'sinCoordenadas':
        resultado = resultado.filter(p => !p.coordenadas || !p.coordenadas.lat || !p.coordenadas.lng);
        break;
      case 'corregidas':
        resultado = resultado.filter(p => p.coordenadas?.corregida === true);
        break;
      case 'verificadas':
        resultado = resultado.filter(p => p.coordenadas && !p.coordenadas.corregida);
        break;
      case 'todos':
      default:
        // No filtrar por estado
        break;
    }

    // SEGUNDO: Aplicar búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.cliente?.toLowerCase().includes(termino) ||
        p.id?.toLowerCase().includes(termino) ||
        p.direccion?.toLowerCase().includes(termino) ||
        p.ciudad?.toLowerCase().includes(termino)
      );
    }

    return resultado;
  }, [pedidos, busqueda, filtroEstado]);

  // Agrupar pedidos por cliente
  const pedidosAgrupadosPorCliente = useMemo(() => {
    if (!agruparPorCliente) return null;

    const grupos = {};
    pedidosFiltrados.forEach(pedido => {
      const nombreCliente = pedido.cliente || 'Sin cliente';
      if (!grupos[nombreCliente]) {
        grupos[nombreCliente] = {
          cliente: nombreCliente,
          pedidos: [],
          ubicaciones: new Set(),
          totalPedidos: 0
        };
      }
      grupos[nombreCliente].pedidos.push(pedido);
      grupos[nombreCliente].totalPedidos++;

      // Agregar ubicación única
      if (pedido.coordenadas) {
        const ubicacionKey = `${pedido.coordenadas.lat.toFixed(4)},${pedido.coordenadas.lng.toFixed(4)}`;
        grupos[nombreCliente].ubicaciones.add(ubicacionKey);
      }
    });

    // Convertir a array y agregar conteo de ubicaciones
    return Object.values(grupos).map(grupo => ({
      ...grupo,
      cantidadUbicaciones: grupo.ubicaciones.size,
      ubicaciones: Array.from(grupo.ubicaciones)
    })).sort((a, b) => b.totalPedidos - a.totalPedidos);
  }, [pedidosFiltrados, agruparPorCliente]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const conCoordenadas = pedidos.filter(p =>
      p.coordenadas &&
      typeof p.coordenadas.lat === 'number' &&
      typeof p.coordenadas.lng === 'number'
    ).length;

    const coordenadasCorregidas = pedidos.filter(p =>
      p.coordenadas?.corregida === true
    ).length;

    const sinCoordenadas = pedidos.length - conCoordenadas;

    return {
      total: pedidos.length,
      conCoordenadas,
      sinCoordenadas,
      coordenadasCorregidas,
      porcentajeCompleto: pedidos.length > 0
        ? Math.round((conCoordenadas / pedidos.length) * 100)
        : 0
    };
  }, [pedidos]);

  // Iniciar edición
  const handleIniciarEdicion = (pedido) => {
    setPedidoEditando(pedido.id);
    setPedidoSeleccionado(pedido);
    setFormulario({
      direccion: pedido.direccion || '',
      ciudad: pedido.ciudad || '',
      lat: pedido.coordenadas?.lat || 10.4806,
      lng: pedido.coordenadas?.lng || -66.9036
    });

    // Centrar mapa en el pedido
    if (pedido.coordenadas) {
      setViewport(prev => ({
        ...prev,
        latitude: pedido.coordenadas.lat,
        longitude: pedido.coordenadas.lng,
        zoom: 14
      }));
    }
  };

  // Cancelar edición
  const handleCancelarEdicion = () => {
    setPedidoEditando(null);
    setPedidoSeleccionado(null);
    setMarcadorTemporal(null);
    setFormulario({
      direccion: '',
      ciudad: '',
      lat: 0,
      lng: 0
    });
  };

  // Guardar cambios
  const handleGuardarCambios = () => {
    if (!pedidoEditando) return;

    const coordenadasActualizadas = marcadorTemporal || {
      lat: formulario.lat,
      lng: formulario.lng
    };

    onActualizarPedido(pedidoEditando, {
      direccion: formulario.direccion,
      ciudad: formulario.ciudad,
      coordenadas: {
        ...coordenadasActualizadas,
        corregida: false // Marcar como no corregida ya que fue editada manualmente
      }
    });

    handleCancelarEdicion();
  };

  // Manejar arrastre de marcador
  const handleMarkerDragStart = (pedidoId) => {
    setArrastrando(true);
    setPedidoEditando(pedidoId);
    const pedido = pedidosFiltrados.find(p => p.id === pedidoId);
    if (pedido) {
      setPedidoSeleccionado(pedido);
      setFormulario({
        direccion: pedido.direccion || '',
        ciudad: pedido.ciudad || '',
        lat: pedido.coordenadas?.lat || 10.4806,
        lng: pedido.coordenadas?.lng || -66.9036
      });
    }
  };

  const handleMarkerDrag = (event) => {
    const { lng, lat } = event.lngLat;
    setMarcadorTemporal({ lat, lng });
    setFormulario(prev => ({
      ...prev,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6))
    }));
  };

  const handleMarkerDragEnd = () => {
    // Auto-guardar al soltar el marcador
    if (pedidoEditando && marcadorTemporal) {
      const pedido = pedidosFiltrados.find(p => p.id === pedidoEditando);
      if (pedido) {
        onActualizarPedido(pedidoEditando, {
          direccion: formulario.direccion,
          ciudad: formulario.ciudad,
          coordenadas: {
            lat: marcadorTemporal.lat,
            lng: marcadorTemporal.lng,
            corregida: false
          }
        });
      }
    }
    // Mantener el modo de edición activo
    setMarcadorTemporal(null);

    // Delay para evitar que el onClick se dispare inmediatamente después del drag
    setTimeout(() => {
      setArrastrando(false);
    }, 100);
  };

  // Click en el mapa para establecer nueva ubicación
  const handleMapClick = (event) => {
    if (!pedidoEditando) return;

    const { lng, lat } = event.lngLat;
    setMarcadorTemporal({ lat, lng });
    setFormulario(prev => ({
      ...prev,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6))
    }));
  };

  // Centrar en pedido con zoom más cercano
  const handleCentrarEnPedido = (pedido) => {
    if (pedido.coordenadas) {
      setViewport(prev => ({
        ...prev,
        latitude: pedido.coordenadas.lat,
        longitude: pedido.coordenadas.lng,
        zoom: 17  // Aumentado de 15 a 17 para mayor cercanía
      }));
      setPedidoSeleccionado(pedido);
    }
  };

  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

  // Obtener URL del estilo de mapa
  const obtenerEstiloMapa = () => {
    const estilos = {
      streets: 'mapbox://styles/mapbox/streets-v12',
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      navigation: 'mapbox://styles/mapbox/navigation-day-v1'
    };
    return estilos[estiloMapa] || estilos.streets;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header con Estadísticas */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Gestión de Ubicaciones de Clientes
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Clientes</div>
              <div className="text-2xl font-bold text-blue-900">{estadisticas.total}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Con Ubicación</div>
              <div className="text-2xl font-bold text-green-900">{estadisticas.conCoordenadas}</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Sin Ubicación</div>
              <div className="text-2xl font-bold text-red-900">{estadisticas.sinCoordenadas}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Corregidas</div>
              <div className="text-2xl font-bold text-yellow-900">{estadisticas.coordenadasCorregidas}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">% Completo</div>
              <div className="text-2xl font-bold text-purple-900">{estadisticas.porcentajeCompleto}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo - Lista de Clientes */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Buscador */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por cliente, ID, dirección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtros y Controles */}
            <div className="mt-3 space-y-2">
              {/* Filtro por estado */}
              <select
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todas las Ubicaciones</option>
                <option value="conCoordenadas">Con Coordenadas</option>
                <option value="sinCoordenadas">Sin Coordenadas</option>
                <option value="corregidas">Corregidas Automáticamente</option>
                <option value="verificadas">Verificadas Manualmente</option>
              </select>

              {/* Botones de control */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                    agruparPorCliente
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  onClick={() => setAgruparPorCliente(!agruparPorCliente)}
                >
                  <Users size={14} />
                  {agruparPorCliente ? 'Ver Todos' : 'Agrupar'}
                </button>
                <button
                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                  onClick={() => setMostrarCapas(!mostrarCapas)}
                >
                  <Layers size={14} />
                  {mostrarCapas ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <button
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 w-full"
                onClick={() => {
                  setFiltroEstado('todos');
                  setBusqueda('');
                  setAgruparPorCliente(false);
                }}
              >
                <Filter size={14} />
                Limpiar Filtros
              </button>

              {/* Controles de Zoom */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <span className="text-xs text-gray-600">Zoom:</span>
                <button
                  className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom - 1, 3) }))}
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs font-mono text-gray-700">{Math.round(viewport.zoom)}</span>
                <button
                  className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom + 1, 18) }))}
                >
                  <ZoomIn size={14} />
                </button>
              </div>

              {/* Estilos de Mapa */}
              <div className="border-t pt-2">
                <span className="text-xs text-gray-600 block mb-2 text-center">Estilo de Mapa:</span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    className={`flex flex-col items-center justify-center p-2 rounded text-xs transition-colors ${
                      estiloMapa === 'streets'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setEstiloMapa('streets')}
                  >
                    <MapIcon size={16} />
                    <span className="mt-1">Calles</span>
                  </button>
                  <button
                    className={`flex flex-col items-center justify-center p-2 rounded text-xs transition-colors ${
                      estiloMapa === 'satellite'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setEstiloMapa('satellite')}
                  >
                    <Globe size={16} />
                    <span className="mt-1">Satélite</span>
                  </button>
                  <button
                    className={`flex flex-col items-center justify-center p-2 rounded text-xs transition-colors ${
                      estiloMapa === 'navigation'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setEstiloMapa('navigation')}
                  >
                    <Compass size={16} />
                    <span className="mt-1">Navegación</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Pedidos */}
          <div className="flex-1 overflow-y-auto">
            {pedidosFiltrados.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No se encontraron clientes
              </div>
            ) : agruparPorCliente && pedidosAgrupadosPorCliente ? (
              /* Vista agrupada por cliente */
              <div className="divide-y divide-gray-200">
                {pedidosAgrupadosPorCliente.map(grupo => (
                  <div key={grupo.cliente} className="p-4">
                    {/* Encabezado del cliente */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-gray-900">{grupo.cliente}</h3>
                      </div>
                      <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {grupo.totalPedidos} pedido{grupo.totalPedidos !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Ubicaciones únicas */}
                    <div className="ml-7 space-y-1">
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="font-medium">{grupo.cantidadUbicaciones} ubicación{grupo.cantidadUbicaciones !== 1 ? 'es' : ''} diferente{grupo.cantidadUbicaciones !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Lista de pedidos del cliente */}
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                          Ver {grupo.totalPedidos} pedido{grupo.totalPedidos !== 1 ? 's' : ''}
                        </summary>
                        <div className="ml-4 mt-2 space-y-2">
                          {grupo.pedidos.map(pedido => (
                            <div
                              key={pedido.id}
                              className={`p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                                pedidoSeleccionado?.id === pedido.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                              }`}
                              onClick={() => handleCentrarEnPedido(pedido)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-700">{pedido.id}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIniciarEdicion(pedido);
                                  }}
                                  className="p-1 hover:bg-blue-100 rounded text-blue-600"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{pedido.direccion}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Vista normal de pedidos */
              <div className="divide-y divide-gray-200">
                {pedidosFiltrados.map(pedido => (
                  <div
                    key={pedido.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      pedidoSeleccionado?.id === pedido.id ? 'bg-blue-50' : ''
                    } ${pedidoEditando === pedido.id ? 'bg-yellow-50' : ''}`}
                    onClick={() => !pedidoEditando && handleCentrarEnPedido(pedido)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{pedido.cliente}</h3>
                          {pedido.coordenadas?.corregida && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" title="Coordenadas corregidas automáticamente" />
                          )}
                          {pedido.coordenadas && !pedido.coordenadas.corregida && (
                            <CheckCircle className="w-4 h-4 text-green-500" title="Coordenadas verificadas" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{pedido.id}</p>
                      </div>
                      {pedidoEditando !== pedido.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIniciarEdicion(pedido);
                          }}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Editar ubicación"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{pedido.direccion || 'Sin dirección'}</span>
                      </div>
                      <div className="ml-6 text-xs text-gray-500">
                        {pedido.ciudad || 'Sin ciudad'}
                      </div>
                      {pedido.coordenadas && (
                        <div className="ml-6 text-xs font-mono text-gray-400">
                          {pedido.coordenadas.lat.toFixed(4)}, {pedido.coordenadas.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Central - Mapa */}
        <div className="flex-1 relative">
          <Map
            {...viewport}
            onMove={evt => setViewport(evt.viewState)}
            onClick={handleMapClick}
            mapStyle={obtenerEstiloMapa()}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />

            {/* Marcadores de todos los pedidos */}
            {mostrarCapas && pedidosFiltrados.map(pedido => {
              if (!pedido.coordenadas) return null;

              const esSeleccionado = pedidoSeleccionado?.id === pedido.id;
              const esEditando = pedidoEditando === pedido.id;

              // Usar coordenadas temporales si está arrastrando este marcador
              const coords = (esEditando && marcadorTemporal)
                ? marcadorTemporal
                : pedido.coordenadas;

              return (
                <Marker
                  key={pedido.id}
                  latitude={coords.lat}
                  longitude={coords.lng}
                  anchor="bottom"
                  draggable={true}
                  onDragStart={() => handleMarkerDragStart(pedido.id)}
                  onDrag={handleMarkerDrag}
                  onDragEnd={handleMarkerDragEnd}
                >
                  <div className="relative group">
                    <div
                      className={`cursor-pointer transition-all ${esEditando || arrastrando ? 'animate-pulse' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!arrastrando) {
                          handleCentrarEnPedido(pedido);
                        }
                      }}
                    >
                      <svg
                        width={esEditando || arrastrando ? 40 : esSeleccionado ? 36 : 32}
                        height={esEditando || arrastrando ? 40 : esSeleccionado ? 36 : 32}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Punta precisa del marcador GPS */}
                        <path
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                          fill={esEditando || arrastrando ? '#eab308' : '#3b82f6'}
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        {/* Punto central para precisión */}
                        <circle cx="12" cy="9" r="2.5" fill="white" />
                      </svg>
                    </div>
                    {/* Tooltip */}
                    {!arrastrando && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          {pedido.cliente}
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Arrastra para mover
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Marker>
              );
            })}

          </Map>

          {/* Instrucciones cuando está editando */}
          {pedidoEditando && !arrastrando && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-10">
              <p className="text-sm font-medium">Arrastra el marcador para mover la ubicación o haz clic en el mapa</p>
            </div>
          )}

          {/* Mensaje durante arrastre */}
          {arrastrando && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-10 animate-pulse">
              <p className="text-sm font-medium">Arrastrando... Suelta para guardar la nueva ubicación</p>
            </div>
          )}
        </div>

        {/* Panel Derecho - Formulario de Edición */}
        {pedidoEditando && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Editar Ubicación</h3>
              <button
                onClick={handleCancelarEdicion}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Cliente (solo lectura) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={pedidosFiltrados.find(p => p.id === pedidoEditando)?.cliente || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              {/* ID Pedido (solo lectura) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Pedido
                </label>
                <input
                  type="text"
                  value={pedidoEditando}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  value={formulario.direccion}
                  onChange={(e) => setFormulario(prev => ({ ...prev, direccion: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese la dirección completa"
                />
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formulario.ciudad}
                  onChange={(e) => setFormulario(prev => ({ ...prev, ciudad: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese la ciudad"
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
                    value={marcadorTemporal?.lat || formulario.lat}
                    onChange={(e) => setFormulario(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={marcadorTemporal?.lng || formulario.lng}
                    onChange={(e) => setFormulario(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleGuardarCambios}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={handleCancelarEdicion}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>

              {/* Ayuda */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 space-y-1">
                  <strong className="block">Cómo ajustar la ubicación:</strong>
                  <span className="block">• <strong>Arrastra</strong> el marcador directamente en el mapa</span>
                  <span className="block">• <strong>Haz clic</strong> en el mapa para establecer nueva ubicación</span>
                  <span className="block">• <strong>Edita</strong> manualmente las coordenadas en los campos</span>
                  <span className="block mt-2 text-green-700">✓ Los cambios se guardan automáticamente al arrastrar</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabGestionUbicaciones;
