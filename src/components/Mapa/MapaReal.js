// src/components/Mapa/MapaReal.js
import React, { useState, useRef, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { MapPin, Truck, Navigation, Package } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapaReal = ({ camiones, pedidos, rutas }) => {
  const [viewState, setViewState] = useState({
    longitude: -66.9036, // Caracas, Venezuela
    latitude: 10.4806,
    zoom: 6
  });
  
  const [popupInfo, setPopupInfo] = useState(null);
  const mapRef = useRef();

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
        {camiones.map((camion) => (
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
        {pedidos.map((pedido) => (
          <Marker
            key={pedido.id}
            longitude={pedido.coordenadas.lng}
            latitude={pedido.coordenadas.lat}
            anchor="center"
          >
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
          </Marker>
        ))}

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
              if (camiones.length > 0) {
                // Centrar en el primer camión activo
                const camionActivo = camiones.find(c => c.estado === 'En Ruta') || camiones[0];
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