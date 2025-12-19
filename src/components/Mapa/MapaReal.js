// src/components/Mapa/MapaReal.js
import React, { useState, useRef, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { Truck, Navigation, Package, AlertTriangle } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapaReal = ({
  camiones = [],
  pedidos = [],
  rutas = [],
  zoomLevel = 11,
  mostrarCapas = true,
  busquedaCliente = '',
  onAsignarPedido = null
}) => {
  const [viewState, setViewState] = useState({
    longitude: -66.9036, // Caracas, Venezuela
    latitude: 10.4806,
    zoom: zoomLevel
  });

  const [popupInfo, setPopupInfo] = useState(null);
  const mapRef = useRef();

  // Validar que camiones y pedidos tengan coordenadas válidas
  const camionesValidos = camiones.filter(camion =>
    camion?.ubicacionActual?.lng != null &&
    camion?.ubicacionActual?.lat != null
  );

  const pedidosValidos = pedidos.filter(pedido =>
    pedido?.coordenadas?.lng != null &&
    pedido?.coordenadas?.lat != null
  );

  const onSelectCamion = useCallback((camion) => {
    setPopupInfo({ type: 'camion', data: camion });
  }, []);

  const onSelectPedido = useCallback((pedido) => {
    setPopupInfo({ type: 'pedido', data: pedido });
  }, []);

  const obtenerColorEstadoCamion = (estado) => {
    const colores = {
      'Disponible': '#10b981', // verde
      'En Ruta': '#3b82f6',    // azul
      'Asignado': '#f59e0b',   // naranja
      'Mantenimiento': '#ef4444' // rojo
    };
    return colores[estado] || '#6b7280';
  };

  const obtenerColorEstadoPedido = (estado) => {
    const colores = {
      'Pendiente': '#f59e0b',  // naranja
      'Asignado': '#3b82f6',   // azul
      'En Ruta': '#10b981',    // verde
      'Entregado': '#6b7280'   // gris
    };
    return colores[estado] || '#6b7280';
  };

  return (
    <div className="w-full h-full relative">
      {/* Mensaje cuando no hay datos */}
      {camionesValidos.length === 0 && pedidosValidos.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-6 rounded-lg shadow-lg text-center">
          <Package size={48} className="mx-auto mb-3 text-gray-400" />
          <h3 className="font-bold text-gray-700 mb-2">No hay datos para mostrar</h3>
          <p className="text-sm text-gray-500">
            Agrega pedidos o verifica que los camiones tengan coordenadas válidas
          </p>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
      >
        {/* Marcadores de Camiones */}
        {camionesValidos.map((camion) => (
          <Marker
            key={camion.id}
            longitude={camion.ubicacionActual.lng}
            latitude={camion.ubicacionActual.lat}
            anchor="center"
          >
            <button
              className="bg-white rounded-full p-2 shadow-lg border-2 hover:scale-110 transition-transform"
              style={{ borderColor: obtenerColorEstadoCamion(camion.estado) }}
              onClick={() => onSelectCamion(camion)}
            >
              <Truck
                size={20}
                style={{ color: obtenerColorEstadoCamion(camion.estado) }}
              />
            </button>
          </Marker>
        ))}

        {/* Marcadores de Pedidos */}
        {pedidosValidos.map((pedido) => {
          const tieneAdvertencia = pedido.coordenadasAdvertencia && !pedido.coordenadasAdvertencia.valido;
          return (
            <Marker
              key={pedido.id}
              longitude={pedido.coordenadas.lng}
              latitude={pedido.coordenadas.lat}
              anchor="center"
            >
              <div className="relative">
                <button
                  className="bg-white rounded-full p-2 shadow-lg border-2 hover:scale-110 transition-transform"
                  style={{ borderColor: obtenerColorEstadoPedido(pedido.estado) }}
                  onClick={() => onSelectPedido(pedido)}
                >
                  <Package
                    size={18}
                    style={{ color: obtenerColorEstadoPedido(pedido.estado) }}
                  />
                </button>
                {tieneAdvertencia && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5" title="Coordenadas verificadas automáticamente">
                    <AlertTriangle size={12} className="text-white" />
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {/* Popup de información */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.type === 'camion' ? popupInfo.data.ubicacionActual.lng : popupInfo.data.coordenadas.lng}
            latitude={popupInfo.type === 'camion' ? popupInfo.data.ubicacionActual.lat : popupInfo.data.coordenadas.lat}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 min-w-[200px]">
              {popupInfo.type === 'camion' ? (
                // Información del Camión
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={16} />
                    <h3 className="font-bold">{popupInfo.data.id}</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Conductor:</strong> {popupInfo.data.conductor}</div>
                    <div><strong>Estado:</strong> {popupInfo.data.estado}</div>
                    <div><strong>Velocidad:</strong> {popupInfo.data.velocidad}</div>
                    <div><strong>Combustible:</strong> {popupInfo.data.combustible}</div>
                    <div><strong>Pedidos asignados:</strong> {popupInfo.data.pedidosAsignados.length}</div>
                  </div>
                </div>
              ) : (
                // Información del Pedido
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={16} />
                    <h3 className="font-bold">{popupInfo.data.id}</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Cliente:</strong> {popupInfo.data.cliente}</div>
                    <div><strong>Estado:</strong> {popupInfo.data.estado}</div>
                    <div><strong>Prioridad:</strong> {popupInfo.data.prioridad}</div>
                    <div><strong>Productos:</strong> {popupInfo.data.productos.length} items</div>
                    {popupInfo.data.camionAsignado && (
                      <div><strong>Camión:</strong> {popupInfo.data.camionAsignado}</div>
                    )}
                    {/* Asignar a camión si está pendiente */}
                    {onAsignarPedido && popupInfo.data.estado === 'Pendiente' && camiones.length > 0 && (
                      <div className="mt-3 pt-2 border-t">
                        <select
                          className="w-full text-xs p-1 border rounded"
                          onChange={(e) => {
                            if (e.target.value) {
                              onAsignarPedido(popupInfo.data.id, e.target.value);
                              setPopupInfo(null);
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">Asignar a camión...</option>
                          {camiones.filter(c => c.estado === 'Disponible' || c.estado === 'Asignado').map(c => (
                            <option key={c.id} value={c.id}>{c.id} - {c.conductor}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {popupInfo.data.ciudad && (
                      <div><strong>Ciudad:</strong> {popupInfo.data.ciudad}</div>
                    )}
                    {popupInfo.data.coordenadasAdvertencia && !popupInfo.data.coordenadasAdvertencia.valido && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded">
                        <div className="flex items-center gap-1 text-yellow-800 font-semibold mb-1">
                          <AlertTriangle size={14} />
                          <span className="text-xs">Coordenadas corregidas</span>
                        </div>
                        <div className="text-xs text-yellow-700">
                          {popupInfo.data.coordenadasAdvertencia.razon === 'coordenadas_muy_lejos' ? (
                            <>Las coordenadas originales estaban a {popupInfo.data.coordenadasAdvertencia.distancia}km de {popupInfo.data.coordenadasAdvertencia.ciudadEsperada}. Se usaron las coordenadas de la ciudad.</>
                          ) : popupInfo.data.coordenadasAdvertencia.razon === 'ciudad_no_encontrada' ? (
                            <>La ciudad especificada no se encontró en el sistema. Se usó ubicación por defecto.</>
                          ) : (
                            <>Coordenadas verificadas automáticamente.</>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
        <div className="flex flex-col gap-2">
          <button
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              setViewState({
                longitude: -66.9036,
                latitude: 10.4806,
                zoom: 6
              });
            }}
          >
            <Navigation size={14} />
            Centrar Venezuela
          </button>
          
          <button
            className="flex items-center gap-2 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => {
              if (camionesValidos.length > 0) {
                // Centrar en el primer camión activo
                const camionActivo = camionesValidos.find(c => c.estado === 'En Ruta') || camionesValidos[0];
                setViewState({
                  longitude: camionActivo.ubicacionActual.lng,
                  latitude: camionActivo.ubicacionActual.lat,
                  zoom: 10
                });
              }
            }}
          >
            <Truck size={14} />
            Seguir Camión
          </button>
        </div>
      </div>

      {/* Leyenda del mapa */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h4 className="font-bold text-sm mb-2">Leyenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Camiones Disponibles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Camiones en Ruta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Pedidos Pendientes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Pedidos Entregados</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaReal;