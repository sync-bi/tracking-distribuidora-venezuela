// src/components/Despachos/MapaPlanificacion.js
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import { MapPin, Package, Navigation, RotateCcw, Route, CheckSquare, Square, Eye } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { intelligentOptimizer } from '../../services/routeOptimizer';

const COLORES_ZONA = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];

const MapaPlanificacion = ({
  pedidos = [],
  pedidosSeleccionados = [],
  onTogglePedido,
  onToggleZona,
  zonas = {},
  zonaEnfocada = null,
  onZonaEnfocada
}) => {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: -66.9036,
    latitude: 10.4806,
    zoom: 7,
    bearing: 0,
    pitch: 0
  });
  const [popupInfo, setPopupInfo] = useState(null);
  const [mostrarRutaSugerida, setMostrarRutaSugerida] = useState(true);
  const [rutaOptimizada, setRutaOptimizada] = useState(null);

  // Asignar color por zona
  const zonaColores = useMemo(() => {
    const mapa = {};
    Object.keys(zonas).forEach((zona, i) => {
      mapa[zona] = COLORES_ZONA[i % COLORES_ZONA.length];
    });
    return mapa;
  }, [zonas]);

  // Pedidos con coordenadas válidas
  const pedidosConCoords = useMemo(() => {
    return pedidos.filter(p =>
      p.coordenadas &&
      typeof p.coordenadas.lat === 'number' &&
      typeof p.coordenadas.lng === 'number' &&
      !isNaN(p.coordenadas.lat) &&
      !isNaN(p.coordenadas.lng)
    );
  }, [pedidos]);

  const getZonaPedido = useCallback((pedido) => {
    return pedido.zona || pedido.ciudad || 'Sin zona';
  }, []);

  // Pedidos agrupados por zona con coords
  const pedidosPorZona = useMemo(() => {
    const mapa = {};
    pedidosConCoords.forEach(p => {
      const zona = getZonaPedido(p);
      if (!mapa[zona]) mapa[zona] = [];
      mapa[zona].push(p);
    });
    return mapa;
  }, [pedidosConCoords, getZonaPedido]);

  // Calcular ruta optimizada cuando hay pedidos seleccionados
  useEffect(() => {
    if (pedidosSeleccionados.length < 2) {
      setRutaOptimizada(null);
      return;
    }

    const seleccionadosData = pedidosConCoords.filter(p =>
      pedidosSeleccionados.includes(p.id)
    );

    if (seleccionadosData.length < 2) {
      setRutaOptimizada(null);
      return;
    }

    const resultado = intelligentOptimizer(seleccionadosData, {
      enableZoneOptimization: true,
      enableNearestNeighbor: true,
      enableTwoOpt: true
    });

    setRutaOptimizada(resultado);
  }, [pedidosSeleccionados, pedidosConCoords]);

  // GeoJSON para la línea de ruta sugerida
  const rutaGeoJSON = useMemo(() => {
    if (!rutaOptimizada || !mostrarRutaSugerida) return null;

    const coordinates = rutaOptimizada.route
      .filter(p => p.coordenadas)
      .map(p => [p.coordenadas.lng, p.coordenadas.lat]);

    if (coordinates.length < 2) return null;

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      }
    };
  }, [rutaOptimizada, mostrarRutaSugerida]);

  // Función genérica para hacer zoom a un conjunto de pedidos
  const zoomAPedidos = useCallback((listaPedidos, paddingFactor = 0.15) => {
    const conCoords = listaPedidos.filter(p =>
      p.coordenadas && typeof p.coordenadas.lat === 'number' && !isNaN(p.coordenadas.lat)
    );
    if (conCoords.length === 0) return;

    const lats = conCoords.map(p => p.coordenadas.lat);
    const lngs = conCoords.map(p => p.coordenadas.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padLat = Math.max((maxLat - minLat) * paddingFactor, 0.005);
    const padLng = Math.max((maxLng - minLng) * paddingFactor, 0.005);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const maxDiff = Math.max(maxLat - minLat + padLat * 2, maxLng - minLng + padLng * 2);

    let zoom = 8;
    if (maxDiff < 0.02) zoom = 15;
    else if (maxDiff < 0.05) zoom = 14;
    else if (maxDiff < 0.1) zoom = 13;
    else if (maxDiff < 0.3) zoom = 12;
    else if (maxDiff < 0.5) zoom = 11;
    else if (maxDiff < 1) zoom = 10;
    else if (maxDiff < 2) zoom = 9;
    else if (maxDiff < 4) zoom = 8;
    else zoom = 7;

    setViewState(prev => ({
      ...prev,
      longitude: centerLng,
      latitude: centerLat,
      zoom,
      transitionDuration: 1000
    }));
  }, []);

  // Centrar mapa en todos los pedidos
  const centrarEnTodos = useCallback(() => {
    if (onZonaEnfocada) onZonaEnfocada(null);
    zoomAPedidos(pedidosConCoords);
  }, [pedidosConCoords, zoomAPedidos, onZonaEnfocada]);

  // Zoom a zona cuando cambia zonaEnfocada
  useEffect(() => {
    if (!zonaEnfocada) return;

    const pedidosZona = pedidosPorZona[zonaEnfocada];
    if (pedidosZona && pedidosZona.length > 0) {
      zoomAPedidos(pedidosZona);
    }
  }, [zonaEnfocada, pedidosPorZona, zoomAPedidos]);

  // Auto-centrar al cargar pedidos (solo la primera vez)
  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (pedidosConCoords.length > 0 && !initialLoadRef.current) {
      initialLoadRef.current = true;
      zoomAPedidos(pedidosConCoords);
    }
  }, [pedidosConCoords.length, zoomAPedidos]);

  // Handler para clic en zona desde la leyenda del mapa
  const handleZonaClick = useCallback((zona) => {
    if (onZonaEnfocada) {
      // Si ya está enfocada, quitar enfoque
      onZonaEnfocada(zonaEnfocada === zona ? null : zona);
    }
  }, [zonaEnfocada, onZonaEnfocada]);

  // Handler para seleccionar toda la zona desde la leyenda
  const handleZonaToggle = useCallback((zona, e) => {
    e.stopPropagation();
    if (onToggleZona) onToggleZona(zona);
  }, [onToggleZona]);

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Navigation className="text-blue-600" size={18} />
          <h4 className="font-medium text-sm">Mapa de Planificación</h4>
          <span className="text-xs text-gray-500">
            {pedidosConCoords.length} pedidos
            {pedidosSeleccionados.length > 0 && (
              <span className="text-blue-600 font-medium"> • {pedidosSeleccionados.length} seleccionados</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pedidosSeleccionados.length >= 2 && (
            <button
              onClick={() => setMostrarRutaSugerida(!mostrarRutaSugerida)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                mostrarRutaSugerida
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Route size={14} />
              Ruta
            </button>
          )}
          {zonaEnfocada && (
            <button
              onClick={centrarEnTodos}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <Eye size={14} />
              Ver todo
            </button>
          )}
          <button onClick={centrarEnTodos} className="p-1 hover:bg-gray-200 rounded" title="Centrar mapa">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative" style={{ minHeight: '350px' }}>
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => {
            const vs = evt.viewState;
            if (typeof vs.longitude === 'number' && !isNaN(vs.longitude)) {
              setViewState(vs);
            }
          }}
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          attributionControl={false}
        >
          {/* Línea de ruta sugerida */}
          {rutaGeoJSON && (
            <Source id="ruta-sugerida" type="geojson" data={rutaGeoJSON}>
              <Layer
                id="ruta-sugerida-line"
                type="line"
                paint={{
                  'line-color': '#2563eb',
                  'line-width': 3,
                  'line-opacity': 0.8,
                  'line-dasharray': [2, 1]
                }}
              />
            </Source>
          )}

          {/* Marcadores de pedidos */}
          {pedidosConCoords.map((pedido) => {
            const seleccionado = pedidosSeleccionados.includes(pedido.id);
            const zona = getZonaPedido(pedido);
            const color = zonaColores[zona] || '#6b7280';
            const estaEnZonaEnfocada = !zonaEnfocada || zona === zonaEnfocada;
            const ordenEnRuta = rutaOptimizada && mostrarRutaSugerida
              ? rutaOptimizada.route.findIndex(p => p.id === pedido.id) + 1
              : 0;

            return (
              <Marker
                key={pedido.id}
                longitude={pedido.coordenadas.lng}
                latitude={pedido.coordenadas.lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  onTogglePedido(pedido.id);
                }}
              >
                <div
                  className={`cursor-pointer transition-all duration-200 ${
                    seleccionado ? 'scale-125 z-20' : estaEnZonaEnfocada ? 'hover:scale-110 z-10' : 'opacity-30 z-0'
                  }`}
                  onMouseEnter={() => setPopupInfo({
                    pedido,
                    longitude: pedido.coordenadas.lng,
                    latitude: pedido.coordenadas.lat
                  })}
                  onMouseLeave={() => setPopupInfo(null)}
                >
                  <div
                    className={`rounded-full flex items-center justify-center shadow-lg ${
                      seleccionado
                        ? 'w-9 h-9 border-[3px] border-white ring-2 ring-blue-400'
                        : 'w-7 h-7 border-2 border-white'
                    }`}
                    style={{ backgroundColor: seleccionado ? color : (estaEnZonaEnfocada ? color : '#9ca3af') }}
                  >
                    {ordenEnRuta > 0 ? (
                      <span className="text-white font-bold text-xs">{ordenEnRuta}</span>
                    ) : seleccionado ? (
                      <CheckSquare size={14} className="text-white" />
                    ) : (
                      <Package size={12} className="text-white" />
                    )}
                  </div>
                </div>
              </Marker>
            );
          })}

          {/* Popup de información */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              anchor="bottom"
              closeButton={false}
              closeOnClick={false}
              offset={20}
            >
              <div className="p-1.5 text-xs max-w-[220px]">
                <div className="font-bold text-gray-900 mb-0.5">{popupInfo.pedido.cliente}</div>
                <div className="text-gray-500 mb-1">{popupInfo.pedido.direccion}</div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span>{popupInfo.pedido.productos?.length || 0} producto(s)</span>
                  <span>•</span>
                  <span>{getZonaPedido(popupInfo.pedido)}</span>
                </div>
                {popupInfo.pedido.prioridad === 'Alta' && (
                  <div className="mt-1 text-red-600 font-medium">Prioridad Alta</div>
                )}
                <div className={`mt-1 font-medium ${
                  pedidosSeleccionados.includes(popupInfo.pedido.id) ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {pedidosSeleccionados.includes(popupInfo.pedido.id)
                    ? '✓ Seleccionado — click para quitar'
                    : 'Click para seleccionar'}
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Info de ruta optimizada */}
        {rutaOptimizada && mostrarRutaSugerida && (
          <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg border text-xs max-w-[180px]">
            <div className="font-medium text-blue-700 mb-2 flex items-center gap-1">
              <Route size={12} />
              Ruta sugerida
            </div>
            <div className="space-y-1 text-gray-600">
              <div className="flex justify-between">
                <span>Distancia:</span>
                <span className="font-medium">{rutaOptimizada.metrics.totalDistance} km</span>
              </div>
              <div className="flex justify-between">
                <span>Tiempo est.:</span>
                <span className="font-medium">{rutaOptimizada.metrics.totalTimeMinutes} min</span>
              </div>
              <div className="flex justify-between">
                <span>Paradas:</span>
                <span className="font-medium">{rutaOptimizada.route.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Leyenda de zonas interactiva */}
        {Object.keys(zonaColores).length > 0 && (
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur p-2 rounded-lg shadow-lg border text-xs max-h-[200px] overflow-y-auto min-w-[160px]">
            <div className="font-semibold text-gray-700 mb-1.5 pb-1 border-b">Zonas — click para zoom</div>
            {Object.entries(zonaColores).map(([zona, color]) => {
              const pedidosZona = pedidosPorZona[zona] || [];
              const seleccionadosZona = pedidosZona.filter(p => pedidosSeleccionados.includes(p.id)).length;
              const todosSeleccionados = pedidosZona.length > 0 && seleccionadosZona === pedidosZona.length;
              const esZonaActiva = zonaEnfocada === zona;

              return (
                <div
                  key={zona}
                  className={`flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer transition-colors ${
                    esZonaActiva ? 'bg-blue-50 ring-1 ring-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleZonaClick(zona)}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{zona}</div>
                    <div className="text-[10px] text-gray-400">
                      {pedidosZona.length} pedido{pedidosZona.length !== 1 ? 's' : ''}
                      {seleccionadosZona > 0 && (
                        <span className="text-blue-500"> • {seleccionadosZona} sel.</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200"
                    onClick={(e) => handleZonaToggle(zona, e)}
                    title={todosSeleccionados ? 'Deseleccionar zona' : 'Seleccionar toda la zona'}
                  >
                    {todosSeleccionados ? (
                      <CheckSquare size={14} className="text-blue-600" />
                    ) : (
                      <Square size={14} className="text-gray-400" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Indicador de zona enfocada */}
        {zonaEnfocada && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2">
            <MapPin size={14} />
            {zonaEnfocada}
            <button
              onClick={centrarEnTodos}
              className="ml-1 hover:bg-blue-500 rounded p-0.5"
              title="Volver a vista general"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaPlanificacion;
