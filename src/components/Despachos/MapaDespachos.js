// src/components/Despachos/MapaDespachos.js - Versión con líneas corregidas
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import { 
  MapPin, Truck, Navigation, Route, Eye, EyeOff, 
  ZoomIn, ZoomOut, RotateCcw, Settings
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapaDespachos = ({ 
  camion, 
  ruta = [], 
  editandoRuta = false,
  rutaEditada = [],
  onCentrarMapa 
}) => {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: -66.9036, // Caracas, Venezuela
    latitude: 10.4806,
    zoom: 6,
    bearing: 0,
    pitch: 0
  });
  
  const [popupInfo, setPopupInfo] = useState(null);
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true);
  const [mostrarLineasRuta, setMostrarLineasRuta] = useState(true);
  const [estiloMapa, setEstiloMapa] = useState('mapbox://styles/mapbox/streets-v12');

  // Obtener la ruta actual (editada o normal)
  const rutaActual = editandoRuta ? rutaEditada : ruta;

  // Coordenadas por defecto para ciudades venezolanas
  const coordenadasCiudades = [
    { lat: 10.4806, lng: -66.9036, nombre: 'Caracas' },
    { lat: 10.1621, lng: -68.0075, nombre: 'Valencia' },
    { lat: 10.6666, lng: -71.6124, nombre: 'Maracaibo' },
    { lat: 10.2733, lng: -67.5951, nombre: 'Maracay' },
    { lat: 10.0647, lng: -69.3301, nombre: 'Barquisimeto' },
    { lat: 10.2133, lng: -64.6333, nombre: 'Puerto La Cruz' }
  ];

  // Obtener coordenadas para una parada
  const obtenerCoordenadasParada = (parada, index) => {
    if (parada.coordenadas) {
      return { lng: parada.coordenadas.lng, lat: parada.coordenadas.lat };
    }
    const ciudad = coordenadasCiudades[index % coordenadasCiudades.length];
    return { lng: ciudad.lng, lat: ciudad.lat };
  };

  // Generar datos de línea de ruta para Mapbox - VERSIÓN CORREGIDA
  const generarDatosRuta = () => {
    if (rutaActual.length === 0) return null;

    const coordinates = [];
    
    // Agregar punto de inicio (depósito/camión)
    if (camion?.ubicacionActual) {
      coordinates.push([camion.ubicacionActual.lng, camion.ubicacionActual.lat]);
    } else {
      coordinates.push([-66.9036, 10.4806]); // Caracas por defecto
    }

    // Agregar todas las paradas en orden
    rutaActual.forEach((parada, index) => {
      const coords = obtenerCoordenadasParada(parada, index);
      coordinates.push([coords.lng, coords.lat]);
    });

    // Solo crear la línea si tenemos al menos 2 puntos
    if (coordinates.length < 2) return null;

    return {
      type: 'Feature',
      properties: {
        'route-type': editandoRuta ? 'editing' : 'normal'
      },
      geometry: {
        type: 'LineString',
        coordinates
      }
    };
  };

  // Configuración de la línea de ruta normal
  const lineLayerNormal = {
    id: 'route-normal',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#3b82f6',
      'line-width': 5,
      'line-opacity': 0.8
    },
    filter: ['==', ['get', 'route-type'], 'normal']
  };

  // Configuración de la línea de ruta en edición
  const lineLayerEditing = {
    id: 'route-editing',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#f59e0b',
      'line-width': 6,
      'line-opacity': 0.7,
      'line-dasharray': [3, 3]
    },
    filter: ['==', ['get', 'route-type'], 'editing']
  };

  // Obtener colores para los marcadores
  const obtenerColorMarcador = (index) => {
    const colores = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    return colores[index % colores.length];
  };

  // Centrar mapa en la ruta - VERSIÓN SIMPLIFICADA
  const centrarEnRuta = useCallback(() => {
    if (rutaActual.length === 0 || !mapRef.current) return;

    try {
      const coordinates = [];
      
      // Agregar coordenadas del camión
      if (camion?.ubicacionActual) {
        coordinates.push([camion.ubicacionActual.lng, camion.ubicacionActual.lat]);
      }
      
      // Agregar coordenadas de las paradas
      rutaActual.forEach((parada, index) => {
        const coords = obtenerCoordenadasParada(parada, index);
        coordinates.push([coords.lng, coords.lat]);
      });

      if (coordinates.length > 0) {
        // Calcular bounds manualmente
        const lngs = coordinates.map(coord => coord[0]);
        const lats = coordinates.map(coord => coord[1]);
        
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;
        
        // Calcular zoom apropiado
        const lngDiff = maxLng - minLng;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lngDiff, latDiff);
        
        let zoom = 8;
        if (maxDiff < 0.5) zoom = 10;
        else if (maxDiff < 1) zoom = 9;
        else if (maxDiff < 2) zoom = 8;
        else zoom = 7;

        setViewState(prev => ({
          ...prev,
          longitude: centerLng,
          latitude: centerLat,
          zoom: zoom,
          transitionDuration: 1000
        }));
      }
    } catch (error) {
      console.error('Error al centrar el mapa:', error);
    }
  }, [rutaActual, camion]);

  // Efectos
  useEffect(() => {
    if (rutaActual.length > 0) {
      const timer = setTimeout(() => {
        centrarEnRuta();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [rutaActual.length, centrarEnRuta]);

  // Handlers de zoom
  const handleZoomIn = () => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 1, 18),
      transitionDuration: 300
    }));
  };

  const handleZoomOut = () => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 1, 1),
      transitionDuration: 300
    }));
  };

  const datosRuta = generarDatosRuta();

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header del mapa */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-blue-600" size={20} />
            <h4 className="font-medium">Mapa de Ruta - {camion?.id}</h4>
            {editandoRuta && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium animate-pulse">
                ✏️ Editando
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {rutaActual.length} paradas
            </span>
          </div>
        </div>

        {/* Controles del mapa */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setEstiloMapa('mapbox://styles/mapbox/streets-v12')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                estiloMapa.includes('streets') 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Calles
            </button>
            <button
              onClick={() => setEstiloMapa('mapbox://styles/mapbox/satellite-v9')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                estiloMapa.includes('satellite') 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Satélite
            </button>
            <button
              onClick={() => setEstiloMapa('mapbox://styles/mapbox/outdoors-v12')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                estiloMapa.includes('outdoors') 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Híbrida
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarEtiquetas(!mostrarEtiquetas)}
              className={`p-1 rounded transition-colors ${
                mostrarEtiquetas ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Mostrar/ocultar etiquetas"
            >
              {mostrarEtiquetas ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            
            <button
              onClick={() => setMostrarLineasRuta(!mostrarLineasRuta)}
              className={`p-1 rounded transition-colors ${
                mostrarLineasRuta ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Mostrar/ocultar líneas de ruta"
            >
              <Route size={16} />
            </button>

            <div className="flex border rounded bg-white">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-gray-100 transition-colors"
                title="Alejar"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-gray-100 border-l transition-colors"
                title="Acercar"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <button
              onClick={centrarEnRuta}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Centrar en ruta"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Mapa Mapbox */}
      <div className="h-96 relative">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle={estiloMapa}
          attributionControl={false}
        >
          {/* Líneas de ruta - VERSIÓN CORREGIDA */}
          {mostrarLineasRuta && datosRuta && (
            <Source 
              id="route" 
              type="geojson" 
              data={datosRuta}
            >
              <Layer {...(editandoRuta ? lineLayerEditing : lineLayerNormal)} />
            </Source>
          )}

          {/* Marcador del camión/depósito */}
          {camion && (
            <Marker
              longitude={camion.ubicacionActual?.lng || -66.9036}
              latitude={camion.ubicacionActual?.lat || 10.4806}
              anchor="center"
            >
              <div
                className="bg-white rounded-full p-2 shadow-lg border-4 border-green-500 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setPopupInfo({ 
                  type: 'camion', 
                  data: camion,
                  longitude: camion.ubicacionActual?.lng || -66.9036,
                  latitude: camion.ubicacionActual?.lat || 10.4806
                })}
              >
                <Truck size={20} className="text-green-600" />
              </div>
            </Marker>
          )}

          {/* Marcadores de paradas */}
          {rutaActual.map((parada, index) => {
            const coords = obtenerCoordenadasParada(parada, index);
            const color = obtenerColorMarcador(index);
            
            return (
              <Marker
                key={`parada-${index}`}
                longitude={coords.lng}
                latitude={coords.lat}
                anchor="center"
              >
                <div
                  className={`relative cursor-pointer hover:scale-110 transition-transform ${
                    editandoRuta ? 'animate-bounce' : ''
                  }`}
                  onClick={() => setPopupInfo({ 
                    type: 'parada', 
                    data: parada, 
                    index: index + 1,
                    longitude: coords.lng,
                    latitude: coords.lat
                  })}
                >
                  {/* Círculo del marcador */}
                  <div
                    className="w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <span className="text-white font-bold text-xs">{index + 1}</span>
                  </div>
                  
                  {/* Etiqueta flotante */}
                  {mostrarEtiquetas && (
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg border text-xs font-medium whitespace-nowrap">
                      {parada.cliente}
                    </div>
                  )}
                </div>
              </Marker>
            );
          })}

          {/* Popup de información */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              anchor="top"
              onClose={() => setPopupInfo(null)}
              closeButton={true}
              closeOnClick={false}
            >
              <div className="p-2">
                {popupInfo.type === 'camion' ? (
                  <div>
                    <h4 className="font-bold text-green-600">{popupInfo.data.id}</h4>
                    <p className="text-sm">Conductor: {popupInfo.data.conductor}</p>
                    <p className="text-sm">Estado: {popupInfo.data.estado}</p>
                    <p className="text-sm">Placa: {popupInfo.data.placa}</p>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-bold text-blue-600">Parada #{popupInfo.index}</h4>
                    <p className="text-sm font-medium">{popupInfo.data.cliente}</p>
                    <p className="text-xs text-gray-600">{popupInfo.data.direccion}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Prioridad: {popupInfo.data.prioridad}
                    </p>
                  </div>
                )}
              </div>
            </Popup>
          )}
        </Map>

        {/* Panel de información de la ruta */}
        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
          <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Route size={14} className="text-blue-600" />
            Información de Ruta
          </h5>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Total paradas:</span>
              <span className="font-medium text-gray-900">{rutaActual.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Distancia total:</span>
              <span className="font-medium text-gray-900">
                {rutaActual.reduce((acc, curr) => acc + (curr.distancia || 0), 0).toFixed(1)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tiempo estimado:</span>
              <span className="font-medium text-gray-900">
                {Math.round(rutaActual.reduce((acc, curr) => acc + (curr.tiempoEstimado || 0), 0))} min
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className={`font-medium ${
                editandoRuta ? 'text-orange-600' : 'text-green-600'
              }`}>
                {editandoRuta ? '✏️ Editando' : '✅ Optimizada'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Líneas visibles:</span>
              <span className={`font-medium ${mostrarLineasRuta ? 'text-green-600' : 'text-red-600'}`}>
                {mostrarLineasRuta ? '✅ SÍ' : '❌ NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador de edición */}
        {editandoRuta && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-medium animate-pulse">
            <div className="flex items-center gap-2">
              <Route size={12} />
              <span>Modificando ruta en tiempo real...</span>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
              <span>Depósito/Camión</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
              <span>Paradas numeradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-500 rounded shadow-sm"></div>
              <span>Ruta optimizada</span>
            </div>
            {editandoRuta && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-orange-500 rounded shadow-sm opacity-60"></div>
                <span>Ruta en edición</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={12} />
            <span>Haga clic en los marcadores para más información</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaDespachos;