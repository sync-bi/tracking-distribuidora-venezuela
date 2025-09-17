// src/components/Despachos/MapaDespachos.js - Con rutas reales
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import { 
  MapPin, Truck, Navigation, Route, Eye, EyeOff, 
  ZoomIn, ZoomOut, RotateCcw, Settings, AlertTriangle
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DEPOSITOS, CIUDADES_VENEZUELA } from '../../utils/constants';

const MapaDespachos = ({ 
  camion, 
  ruta = [], 
  depositoPreferido = '',
  editandoRuta = false,
  rutaEditada = [],
  onCentrarMapa 
}) => {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: -66.9036,
    latitude: 10.4806,
    zoom: 6,
    bearing: 0,
    pitch: 0
  });
  
  const [popupInfo, setPopupInfo] = useState(null);
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true);
  const [mostrarLineasRuta, setMostrarLineasRuta] = useState(true);
  const [estiloMapa, setEstiloMapa] = useState('mapbox://styles/mapbox/streets-v12');
  const [rutasReales, setRutasReales] = useState({}); // Almacenar rutas calculadas
  const [calculandoRutas, setCalculandoRutas] = useState(false);
  const [perfilRuta, setPerfilRuta] = useState('driving-traffic'); // driving-traffic, driving, cycling, walking
  const [posCamion, setPosCamion] = useState(null); // posición animada del camión
  const [trayectoCoords, setTrayectoCoords] = useState([]);
  const [animando, setAnimando] = useState(true);

  const rutaActual = editandoRuta ? rutaEditada : ruta;

  const coordenadasCiudades = [
    { lat: 10.4806, lng: -66.9036, nombre: 'Caracas' },
    { lat: 10.1621, lng: -68.0075, nombre: 'Valencia' },
    { lat: 10.6666, lng: -71.6124, nombre: 'Maracaibo' },
    { lat: 10.2733, lng: -67.5951, nombre: 'Maracay' },
    { lat: 10.0647, lng: -69.3301, nombre: 'Barquisimeto' },
    { lat: 10.2133, lng: -64.6333, nombre: 'Puerto La Cruz' }
  ];

  const obtenerCoordenadasParada = (parada, index) => {
    const base = (() => {
      if (parada.coordenadas && typeof parada.coordenadas.lat === 'number' && typeof parada.coordenadas.lng === 'number') {
        return { lng: parada.coordenadas.lng, lat: parada.coordenadas.lat };
      }
      const ciudad = coordenadasCiudades[index % coordenadasCiudades.length];
      return { lng: ciudad.lng, lat: ciudad.lat };
    })();

    // Si la coordenada coincide con un centro de ciudad conocido (ej. Caracas)
    // aplicamos un pequeño "jitter" basado en el índice para dispersar paradas
    const isCityCenter = (() => {
      const tol = 1e-5;
      return CIUDADES_VENEZUELA.some(c => Math.abs(c.coordenadas.lat - base.lat) < tol && Math.abs(c.coordenadas.lng - base.lng) < tol);
    })();

    if (!isCityCenter) return base;

    const degToRad = (d) => (d * Math.PI) / 180;
    const radToDeg = (r) => (r * 180) / Math.PI;
    const Rm = 111000; // metros por grado aprox. en latitud
    const angle = (index * 137.508) % 360; // distribuir en espiral de oro
    const radiusM = 300 + (index % 6) * 120; // 300m .. ~900m
    const latRad = degToRad(base.lat);
    const dLat = (radiusM * Math.cos(degToRad(angle))) / Rm;
    const dLng = (radiusM * Math.sin(degToRad(angle))) / (Rm * Math.cos(latRad));
    return { lng: base.lng + dLng, lat: base.lat + dLat };
  };

  const distancia2 = (a, b) => {
    const dx = (a.lng - b.lng);
    const dy = (a.lat - b.lat);
    return dx*dx + dy*dy;
  };

  // Función para calcular ruta real usando Mapbox Directions API
  const calcularRutaReal = async (origen, destino, perfil = 'driving-traffic') => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/${perfil}/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?geometries=geojson&overview=full&steps=true&access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        return {
          geometry: route.geometry,
          distance: route.distance / 1000, // convertir a km
          duration: route.duration / 60,   // convertir a minutos
          steps: route.legs[0]?.steps || []
        };
      }
    } catch (error) {
      console.error('Error calculando ruta real:', error);
    }
    return null;
  };

  // Calcular todas las rutas reales
  const calcularTodasLasRutasReales = useCallback(async () => {
    if (rutaActual.length === 0) return;

    setCalculandoRutas(true);
    const nuevasRutas = {};

    try {
      // Punto de inicio: ubicación del camión o depósito más cercano a la primera parada
      let puntoInicio;
      if (camion?.ubicacionActual && camion.ubicacionActual.lng != null && camion.ubicacionActual.lat != null) {
        puntoInicio = { ...camion.ubicacionActual };
      } else {
        const primera = rutaActual[0] ? obtenerCoordenadasParada(rutaActual[0], 0) : { lng: -66.9036, lat: 10.4806 };
        if (depositoPreferido && DEPOSITOS[depositoPreferido]) {
          puntoInicio = DEPOSITOS[depositoPreferido].coordenadas;
        } else {
          const dep1 = DEPOSITOS.LOS_CORTIJOS.coordenadas;
          const dep2 = DEPOSITOS.LOS_RUICES.coordenadas;
          puntoInicio = distancia2(dep1, primera) <= distancia2(dep2, primera) ? dep1 : dep2;
        }
      }
      setPosCamion(puntoInicio);
      let puntoAnterior = puntoInicio;

      // Calcular ruta desde depósito hasta primera parada y entre paradas
      for (let i = 0; i < rutaActual.length; i++) {
        const parada = rutaActual[i];
        const coordsParada = obtenerCoordenadasParada(parada, i);
        
        const rutaReal = await calcularRutaReal(puntoAnterior, coordsParada, perfilRuta);
        
        if (rutaReal) {
          nuevasRutas[`segmento-${i}`] = {
            ...rutaReal,
            origen: puntoAnterior,
            destino: coordsParada,
            paradaIndex: i
          };
        }
        
        puntoAnterior = coordsParada;
      }

      setRutasReales(nuevasRutas);
      // Preparar trayecto continuo para animación
      const coordsContinuas = [];
      for (let i = 0; i < rutaActual.length; i++) {
        const seg = nuevasRutas[`segmento-${i}`];
        if (seg?.geometry?.coordinates?.length) {
          coordsContinuas.push(...seg.geometry.coordinates.map(([lng, lat]) => ({ lng, lat })));
        }
      }
      if (coordsContinuas.length) setTrayectoCoords(coordsContinuas);
    } catch (error) {
      console.error('Error calculando rutas reales:', error);
    } finally {
      setCalculandoRutas(false);
    }
  }, [rutaActual, camion, perfilRuta]);

  // Generar datos GeoJSON para todas las rutas reales
  const generarDatosRutasReales = () => {
    const features = [];
    
    Object.entries(rutasReales).forEach(([segmentoId, rutaData]) => {
      if (rutaData.geometry) {
        features.push({
          type: 'Feature',
          properties: {
            'route-type': editandoRuta ? 'editing' : 'normal',
            'segmento-id': segmentoId,
            'distancia': rutaData.distance,
            'duracion': rutaData.duration
          },
          geometry: rutaData.geometry
        });
      }
    });

    return features.length > 0 ? {
      type: 'FeatureCollection',
      features
    } : null;
  };

  // Configuraciones de línea para rutas reales
  const lineLayerRutaReal = {
    id: 'route-real',
    type: 'line',
    source: 'route-real',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'route-type'], 'editing'],
        '#f59e0b', // naranja para edición
        '#3b82f6'  // azul para normal
      ],
      'line-width': [
        'case',
        ['==', ['get', 'route-type'], 'editing'],
        6,  // más gruesa en edición
        4
      ],
      'line-opacity': 0.8,
      'line-dasharray': [
        'case',
        ['==', ['get', 'route-type'], 'editing'],
        ['literal', [3, 3]], // punteada en edición
        ['literal', [1, 0]]   // sólida normal
      ]
    }
  };

  // Capa para resaltar rutas con tráfico pesado
  const lineLayerTrafico = {
    id: 'route-traffic',
    type: 'line',
    source: 'route-real',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#ef4444', // rojo para indicar tráfico
      'line-width': 2,
      'line-opacity': 0.6
    },
    filter: ['>', ['get', 'duracion'], 60] // Solo rutas que toman más de 60 min
  };

  const obtenerColorMarcador = (index) => {
    const colores = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    return colores[index % colores.length];
  };

  // Calcular rutas cuando cambie la ruta actual
  useEffect(() => {
    if (rutaActual.length > 0) {
      calcularTodasLasRutasReales();
    }
  }, [calcularTodasLasRutasReales]);

  // Animar movimiento del camión a lo largo del trayecto calculado
  useEffect(() => {
    if (!trayectoCoords.length) return;
    setAnimando(true);
    let idx = 0;
    setPosCamion(trayectoCoords[0]);
    const id = setInterval(() => {
      idx = (idx + 1) % trayectoCoords.length;
      setPosCamion(trayectoCoords[idx]);
    }, 800);
    return () => clearInterval(id);
  }, [trayectoCoords]);

  // Centrar mapa
  const centrarEnRuta = useCallback(() => {
    if (rutaActual.length === 0 || !mapRef.current) return;

    try {
      const coordinates = [];
      
      if (camion?.ubicacionActual) {
        coordinates.push([camion.ubicacionActual.lng, camion.ubicacionActual.lat]);
      } else if (posCamion) {
        coordinates.push([posCamion.lng, posCamion.lat]);
      }
      
      rutaActual.forEach((parada, index) => {
        const coords = obtenerCoordenadasParada(parada, index);
        coordinates.push([coords.lng, coords.lat]);
      });

      if (coordinates.length > 0) {
        const lngs = coordinates.map(coord => coord[0]);
        const lats = coordinates.map(coord => coord[1]);
        
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;
        
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

  const datosRutasReales = generarDatosRutasReales();
  const distanciaTotal = Object.values(rutasReales).reduce((acc, ruta) => acc + (ruta.distance || 0), 0);
  const tiempoTotal = Object.values(rutasReales).reduce((acc, ruta) => acc + (ruta.duration || 0), 0);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header del mapa */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-blue-600" size={20} />
            <h4 className="font-medium">Mapa de Ruta Real - {camion?.id}</h4>
            {editandoRuta && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium animate-pulse">
                Editando
              </span>
            )}
            {calculandoRutas && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                Calculando rutas...
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
              onClick={() => setEstiloMapa('mapbox://styles/mapbox/navigation-day-v1')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                estiloMapa.includes('navigation') 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Navegación
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de perfil de ruta */}
            <select
              value={perfilRuta}
              onChange={(e) => setPerfilRuta(e.target.value)}
              className="text-xs p-1 border rounded"
              title="Tipo de ruta"
            >
              <option value="driving-traffic">Tráfico Real</option>
              <option value="driving">Conducir</option>
              <option value="cycling">Ciclismo</option>
              <option value="walking">Caminar</option>
            </select>

            <button
              onClick={() => setMostrarEtiquetas(!mostrarEtiquetas)}
              className={`p-1 rounded transition-colors ${
                mostrarEtiquetas ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {mostrarEtiquetas ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            
            <button
              onClick={() => setMostrarLineasRuta(!mostrarLineasRuta)}
              className={`p-1 rounded transition-colors ${
                mostrarLineasRuta ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Route size={16} />
            </button>

            <div className="flex border rounded bg-white">
              <button onClick={handleZoomOut} className="p-1 hover:bg-gray-100">
                <ZoomOut size={14} />
              </button>
              <button onClick={handleZoomIn} className="p-1 hover:bg-gray-100 border-l">
                <ZoomIn size={14} />
              </button>
            </div>

            <button onClick={centrarEnRuta} className="p-1 hover:bg-gray-100 rounded">
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
          {/* Rutas reales siguiendo carreteras */}
          {mostrarLineasRuta && datosRutasReales && (
            <Source id="route-real" type="geojson" data={datosRutasReales}>
              <Layer {...lineLayerRutaReal} />
              {perfilRuta === 'driving-traffic' && <Layer {...lineLayerTrafico} />}
            </Source>
          )}

          {/* Marcador del camión/depósito */}
          {(camion || posCamion) && (
            <Marker
              longitude={(posCamion?.lng) ?? (camion?.ubicacionActual?.lng ?? -66.9036)}
              latitude={(posCamion?.lat) ?? (camion?.ubicacionActual?.lat ?? 10.4806)}
              anchor="center"
            >
              <div
                className="bg-white rounded-full p-2 shadow-lg border-4 border-green-500 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setPopupInfo({ 
                  type: 'camion', 
                  data: camion,
                  longitude: (posCamion?.lng) ?? (camion?.ubicacionActual?.lng ?? -66.9036),
                  latitude: (posCamion?.lat) ?? (camion?.ubicacionActual?.lat ?? 10.4806)
                })}
              >
                <Truck size={20} className="text-green-600" />
              </div>
            </Marker>
          )}

          {/* Depósitos fijos: Los Cortijos y Los Ruices */}
          {[DEPOSITOS.LOS_CORTIJOS, DEPOSITOS.LOS_RUICES].map((dep, i) => (
            <Marker key={`deposito-${i}`} longitude={dep.coordenadas.lng} latitude={dep.coordenadas.lat} anchor="bottom">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow" />
                {mostrarEtiquetas && (
                  <span className="mt-1 text-[10px] bg-white border rounded px-1 py-0.5 shadow">
                    Depósito {i === 0 ? 'Los Cortijos' : 'Los Ruices'}
                  </span>
                )}
              </div>
            </Marker>
          ))}

          {/* Marcadores de paradas */}
          {rutaActual.map((parada, index) => {
            const coords = obtenerCoordenadasParada(parada, index);
            const color = obtenerColorMarcador(index);
            const rutaSegmento = rutasReales[`segmento-${index}`];
            const tieneRetraso = rutaSegmento && rutaSegmento.duration > 60;
            
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
                    rutaInfo: rutaSegmento,
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
                  
                  {/* Indicador de tráfico pesado */}
                  {tieneRetraso && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertTriangle size={10} className="text-white" />
                    </div>
                  )}
                  
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
                    {popupInfo.rutaInfo && (
                      <div className="mt-2 text-xs">
                        <p>Distancia: {popupInfo.rutaInfo.distance.toFixed(1)} km</p>
                        <p>Tiempo: {Math.round(popupInfo.rutaInfo.duration)} min</p>
                        {popupInfo.rutaInfo.duration > 60 && (
                          <p className="text-red-600 font-medium">⚠️ Tráfico pesado</p>
                        )}
                      </div>
                    )}
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
            Ruta Real
          </h5>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Total paradas:</span>
              <span className="font-medium text-gray-900">{rutaActual.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Distancia real:</span>
              <span className="font-medium text-gray-900">
                {distanciaTotal.toFixed(1)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tiempo real:</span>
              <span className="font-medium text-gray-900">
                {Math.round(tiempoTotal)} min
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tipo:</span>
              <span className="font-medium text-blue-600">
                {perfilRuta === 'driving-traffic' ? 'Con Tráfico' : 
                 perfilRuta === 'driving' ? 'Conducir' : perfilRuta}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className={`font-medium ${
                editandoRuta ? 'text-orange-600' : 'text-green-600'
              }`}>
                {editandoRuta ? 'Editando' : 'Optimizada'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
              <span>Depósito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
              <span>Paradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-500 rounded shadow-sm"></div>
              <span>Ruta real</span>
            </div>
            {perfilRuta === 'driving-traffic' && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-red-500 rounded shadow-sm"></div>
                <span>Tráfico pesado</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Rutas calculadas por carreteras reales
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaDespachos;
