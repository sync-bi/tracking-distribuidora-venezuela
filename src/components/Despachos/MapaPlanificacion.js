// src/components/Despachos/MapaPlanificacion.js
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import { MapPin, Package, Navigation, RotateCcw, ZoomIn, ZoomOut, Route } from 'lucide-react';
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
  zonas = {}
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
  const [mostrarRutaSugerida, setMostrarRutaSugerida] = useState(false);
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

  // Centrar mapa en los pedidos visibles
  const centrarEnPedidos = useCallback(() => {
    const coords = pedidosConCoords.length > 0
      ? pedidosConCoords
      : [];

    if (coords.length === 0) return;

    const lats = coords.map(p => p.coordenadas.lat);
    const lngs = coords.map(p => p.coordenadas.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const maxDiff = Math.max(maxLat - minLat, maxLng - minLng);

    let zoom = 8;
    if (maxDiff < 0.1) zoom = 13;
    else if (maxDiff < 0.5) zoom = 11;
    else if (maxDiff < 1) zoom = 9;
    else if (maxDiff < 2) zoom = 8;
    else zoom = 7;

    setViewState(prev => ({
      ...prev,
      longitude: centerLng,
      latitude: centerLat,
      zoom,
      transitionDuration: 800
    }));
  }, [pedidosConCoords]);

  // Auto-centrar al cargar pedidos
  useEffect(() => {
    if (pedidosConCoords.length > 0) {
      centrarEnPedidos();
    }
  }, [pedidosConCoords.length]);

  const getZonaPedido = (pedido) => {
    return pedido.zona || pedido.ciudad || 'Sin zona';
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Navigation className="text-blue-600" size={18} />
          <h4 className="font-medium text-sm">Mapa de Planificación</h4>
          <span className="text-xs text-gray-500">
            {pedidosConCoords.length} pedidos en mapa
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
              Ruta sugerida
            </button>
          )}
          <button onClick={centrarEnPedidos} className="p-1 hover:bg-gray-200 rounded" title="Centrar mapa">
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
                  'line-color': '#3b82f6',
                  'line-width': 3,
                  'line-opacity': 0.7,
                  'line-dasharray': [2, 2]
                }}
              />
            </Source>
          )}

          {/* Marcadores de pedidos */}
          {pedidosConCoords.map((pedido) => {
            const seleccionado = pedidosSeleccionados.includes(pedido.id);
            const zona = getZonaPedido(pedido);
            const color = zonaColores[zona] || '#6b7280';
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
                    seleccionado ? 'scale-125 z-10' : 'hover:scale-110'
                  }`}
                  onMouseEnter={() => setPopupInfo({
                    pedido,
                    longitude: pedido.coordenadas.lng,
                    latitude: pedido.coordenadas.lat
                  })}
                  onMouseLeave={() => setPopupInfo(null)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-3 shadow-lg ${
                      seleccionado
                        ? 'border-white ring-2 ring-blue-400'
                        : 'border-white opacity-70'
                    }`}
                    style={{ backgroundColor: seleccionado ? color : '#9ca3af' }}
                  >
                    {ordenEnRuta > 0 ? (
                      <span className="text-white font-bold text-xs">{ordenEnRuta}</span>
                    ) : (
                      <Package size={14} className="text-white" />
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
              <div className="p-1 text-xs max-w-[200px]">
                <div className="font-bold text-gray-900">{popupInfo.pedido.cliente}</div>
                <div className="text-gray-500">{popupInfo.pedido.direccion}</div>
                <div className="text-gray-400 mt-1">
                  {popupInfo.pedido.productos?.length || 0} producto(s) •{' '}
                  {getZonaPedido(popupInfo.pedido)}
                </div>
                <div className={`mt-1 font-medium ${
                  pedidosSeleccionados.includes(popupInfo.pedido.id) ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {pedidosSeleccionados.includes(popupInfo.pedido.id) ? 'Seleccionado' : 'Click para seleccionar'}
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Info de ruta optimizada */}
        {rutaOptimizada && mostrarRutaSugerida && (
          <div className="absolute bottom-2 right-2 bg-white p-3 rounded-lg shadow-lg border text-xs max-w-[180px]">
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
              <div className="flex justify-between">
                <span>Algoritmo:</span>
                <span className="font-medium text-blue-600">{rutaOptimizada.algorithm}</span>
              </div>
            </div>
          </div>
        )}

        {/* Leyenda de zonas */}
        {Object.keys(zonaColores).length > 0 && (
          <div className="absolute top-2 left-2 bg-white p-2 rounded-lg shadow border text-xs max-h-[150px] overflow-y-auto">
            <div className="font-medium text-gray-700 mb-1">Zonas</div>
            {Object.entries(zonaColores).map(([zona, color]) => (
              <div
                key={zona}
                className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-gray-50 px-1 rounded"
                onClick={() => onToggleZona && onToggleZona(zona)}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="truncate">{zona}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaPlanificacion;
