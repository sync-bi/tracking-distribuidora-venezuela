// src/components/Tracking/SeguimientoPedido.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  Search,
  XCircle
} from 'lucide-react';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  escucharPedido,
  obtenerHistorialEstados,
  obtenerReciboPedido,
  isFirestoreAvailable
} from '../../services/firestoreService';
import { escucharPosicionVehiculo } from '../../services/firebase';

// Configuración de estados y su orden en el timeline
const ESTADOS_TIMELINE = [
  { key: 'Pendiente', label: 'Pedido recibido', icon: Package, color: 'yellow' },
  { key: 'En Consolidación', label: 'Pedido en consolidación', icon: Package, color: 'blue' },
  { key: 'Asignado', label: 'Asignado a transporte', icon: Truck, color: 'blue' },
  { key: 'En Ruta', label: 'En camino', icon: MapPin, color: 'indigo' },
  { key: 'Entregado', label: 'Entregado', icon: CheckCircle, color: 'green' }
];

const COLORES = {
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', icon: 'text-yellow-500', line: 'bg-yellow-500' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', icon: 'text-blue-500', line: 'bg-blue-500' },
  indigo: { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-700', icon: 'text-indigo-500', line: 'bg-indigo-500' },
  green: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', icon: 'text-green-500', line: 'bg-green-500' },
  red: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', icon: 'text-red-500', line: 'bg-red-500' },
  gray: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-400', icon: 'text-gray-300', line: 'bg-gray-200' }
};

const formatFecha = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

// Pantalla de búsqueda inicial
const PantallaBusqueda = ({ onBuscar, error }) => {
  const [codigo, setCodigo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (codigo.trim()) {
      onBuscar(codigo.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Truck size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Seguimiento de Pedido</h1>
          <p className="text-gray-500 mt-1">Distribuidora Sarego</p>
        </div>

        {/* Formulario de búsqueda */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingrese el codigo de su pedido
            </label>
            <div className="relative">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: PED001 o ID del pedido"
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-lg"
                autoFocus
              />
              <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!codigo.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            <Search size={20} />
            Consultar pedido
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Distribuidora Sarego &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

// Componente del timeline de estados
const TimelineEstados = ({ estadoActual, historial, esEntregaParcial }) => {
  const indiceActual = ESTADOS_TIMELINE.findIndex(e => e.key === estadoActual);
  // Si es entrega parcial o cancelado, tratar como entregado en timeline
  const indiceEfectivo = (estadoActual === 'Entrega Parcial' || estadoActual === 'Cancelado')
    ? ESTADOS_TIMELINE.length - 1
    : indiceActual;

  // Buscar fechas del historial para cada estado
  const fechasPorEstado = useMemo(() => {
    const fechas = {};
    historial.forEach(h => {
      if (!fechas[h.estadoNuevo]) {
        fechas[h.estadoNuevo] = h.fecha;
      }
    });
    return fechas;
  }, [historial]);

  return (
    <div className="space-y-0">
      {ESTADOS_TIMELINE.map((paso, index) => {
        const completado = index <= indiceEfectivo;
        const esActual = index === indiceEfectivo;
        const esFuturo = index > indiceEfectivo;
        const IconComponent = paso.icon;

        // Para el último paso, si es entrega parcial cambiar color y label
        const esUltimo = index === ESTADOS_TIMELINE.length - 1;
        let colorKey = completado ? paso.color : 'gray';
        let label = paso.label;

        if (esUltimo && esActual && esEntregaParcial) {
          colorKey = 'red';
          label = 'Entrega parcial';
        }
        if (esUltimo && esActual && estadoActual === 'Cancelado') {
          colorKey = 'red';
          label = 'Cancelado';
        }

        const colores = COLORES[colorKey];
        const fecha = fechasPorEstado[paso.key] || (esUltimo && esEntregaParcial ? fechasPorEstado['Entrega Parcial'] : null);

        return (
          <div key={paso.key} className="flex items-start gap-4">
            {/* Indicador + línea */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                completado
                  ? `${colores.bg} ${colores.border}`
                  : 'bg-gray-50 border-gray-200'
              } ${esActual ? 'ring-4 ring-opacity-30 ring-blue-300' : ''}`}>
                {esUltimo && esActual && esEntregaParcial ? (
                  <XCircle size={20} className={colores.icon} />
                ) : (
                  <IconComponent size={20} className={completado ? colores.icon : 'text-gray-300'} />
                )}
              </div>
              {/* Línea conectora */}
              {index < ESTADOS_TIMELINE.length - 1 && (
                <div className={`w-0.5 h-12 ${completado && index < indiceEfectivo ? COLORES[ESTADOS_TIMELINE[index + 1].color].line : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Contenido */}
            <div className={`pt-1.5 ${esFuturo ? 'opacity-40' : ''}`}>
              <p className={`font-semibold ${completado ? colores.text : 'text-gray-400'}`}>
                {label}
              </p>
              {fecha && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatFecha(fecha)}
                </p>
              )}
              {esActual && !esFuturo && (
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${colores.bg} ${colores.text}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Estado actual
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Mapa de seguimiento en tiempo real del vehículo
const MapaSeguimiento = ({ camionId, coordenadasDestino }) => {
  const [posicionVehiculo, setPosicionVehiculo] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Escuchar posición del vehículo
  useEffect(() => {
    if (!camionId) return;

    const unsubscribe = escucharPosicionVehiculo(camionId, (posicion) => {
      if (posicion && posicion.lat && posicion.lng) {
        setPosicionVehiculo(posicion);
      }
    });

    return () => unsubscribe();
  }, [camionId]);

  // Inicializar y actualizar mapa
  useEffect(() => {
    if (!mapContainerRef.current || !posicionVehiculo) return;

    const initMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');

        if (!mapRef.current) {
          mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
          const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [posicionVehiculo.lng, posicionVehiculo.lat],
            zoom: 13,
            attributionControl: false
          });
          map.addControl(new mapboxgl.NavigationControl(), 'top-right');
          mapRef.current = map;

          // Marcador del vehículo
          const el = document.createElement('div');
          el.innerHTML = '<div style="background:#3b82f6;border:3px solid white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M5 17h14l1-7H4l1 7z"/><circle cx="7.5" cy="19.5" r="1.5"/><circle cx="16.5" cy="19.5" r="1.5"/><path d="M14 17V6H3v11"/></svg></div>';
          markerRef.current = new mapboxgl.Marker({ element: el })
            .setLngLat([posicionVehiculo.lng, posicionVehiculo.lat])
            .addTo(map);

          // Marcador del destino
          if (coordenadasDestino?.lat && coordenadasDestino?.lng) {
            const destEl = document.createElement('div');
            destEl.innerHTML = '<div style="background:#ef4444;border:3px solid white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/></svg></div>';
            new mapboxgl.Marker({ element: destEl })
              .setLngLat([coordenadasDestino.lng, coordenadasDestino.lat])
              .addTo(map);

            // Ajustar vista para mostrar ambos puntos
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend([posicionVehiculo.lng, posicionVehiculo.lat]);
            bounds.extend([coordenadasDestino.lng, coordenadasDestino.lat]);
            map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
          }
        } else {
          // Actualizar posición del marcador
          if (markerRef.current) {
            markerRef.current.setLngLat([posicionVehiculo.lng, posicionVehiculo.lat]);
          }
          mapRef.current.flyTo({
            center: [posicionVehiculo.lng, posicionVehiculo.lat],
            duration: 1000
          });
        }
      } catch (err) {
        console.error('Error cargando mapa:', err);
      }
    };

    initMap();
  }, [posicionVehiculo, coordenadasDestino]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  if (!camionId) return null;

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <div className="p-4 border-b flex items-center gap-2">
        <MapPin size={18} className="text-blue-600" />
        <h3 className="font-semibold text-gray-800">Ubicación del vehículo</h3>
        {posicionVehiculo?.velocidad > 0 && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {Math.round(posicionVehiculo.velocidad)} km/h
          </span>
        )}
      </div>
      <div ref={mapContainerRef} style={{ height: '250px', width: '100%' }}>
        {!posicionVehiculo && (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <Truck size={32} className="mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Esperando ubicación del vehículo...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Info del recibo de entrega
const InfoRecibo = ({ recibo }) => {
  if (!recibo) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
      <h4 className="font-semibold text-green-800 flex items-center gap-2">
        <ClipboardCheck size={18} />
        Comprobante de entrega
      </h4>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Recibido por</p>
          <p className="font-medium text-gray-800">{recibo.receptor?.nombre || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Cedula</p>
          <p className="font-medium text-gray-800">{recibo.receptor?.cedula || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Fecha de entrega</p>
          <p className="font-medium text-gray-800">{formatFecha(recibo.fechaEntrega || recibo.fechaRegistro)}</p>
        </div>
        <div>
          <p className="text-gray-500">Estado</p>
          <p className={`font-medium ${recibo.conforme ? 'text-green-700' : 'text-red-700'}`}>
            {recibo.conforme ? 'Conforme' : 'No conforme'}
          </p>
        </div>
      </div>

      {recibo.itemsProblemas?.length > 0 && (
        <div className="border-t border-green-200 pt-3">
          <p className="text-sm font-medium text-red-700 mb-1">Items con observaciones:</p>
          {recibo.itemsProblemas.map((item, idx) => (
            <p key={idx} className="text-sm text-red-600 ml-2">
              - {item.nombre}: {item.causaLabel}{item.detalle ? ` (${item.detalle})` : ''}
            </p>
          ))}
        </div>
      )}

      {recibo.observaciones && (
        <div className="border-t border-green-200 pt-3">
          <p className="text-sm text-gray-500">Observaciones:</p>
          <p className="text-sm text-gray-700">{recibo.observaciones}</p>
        </div>
      )}
    </div>
  );
};

// Página principal de tracking
const SeguimientoPedido = () => {
  const [pedidoId, setPedidoId] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [recibo, setRecibo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Detectar ID desde la URL al montar
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/tracking\/(.+)/);
    if (match) {
      setPedidoId(match[1]);
    }

    // También escuchar hash por compatibilidad
    const hash = window.location.hash;
    const hashMatch = hash.match(/#tracking\/(.+)/);
    if (hashMatch) {
      setPedidoId(hashMatch[1]);
    }
  }, []);

  // Escuchar pedido en tiempo real
  useEffect(() => {
    if (!pedidoId) return;
    if (!isFirestoreAvailable()) {
      setError('Sistema no disponible en este momento');
      setCargando(false);
      return;
    }

    let cancelado = false;
    let unsubscribe = () => {};
    setCargando(true);
    setError(null);

    // Auth anónimo para que las reglas de Firestore permitan lectura
    const auth = getAuth();
    const iniciar = async () => {
      try {
        console.log('🔑 Intentando auth anónimo...');
        await signInAnonymously(auth);
        console.log('✅ Auth anónimo exitoso');
      } catch (e) {
        console.error('❌ Auth anónimo falló:', e);
        if (!cancelado) {
          setError('No se pudo conectar al sistema. Intente de nuevo en unos segundos.');
          setCargando(false);
        }
        return;
      }

      unsubscribe = escucharPedido(pedidoId, (data) => {
        if (cancelado) return;

        if (data) {
          console.log('✅ Pedido encontrado:', data.id);
          setPedido(data);

          // Usar el document ID real para buscar historial y recibos
          const docId = data.id;

          // Cargar historial y recibo en paralelo sin bloquear
          obtenerHistorialEstados(docId).then(hist => {
            if (!cancelado) setHistorial(hist);
          });

          if (data.estado === 'Entregado' || data.estado === 'Entrega Parcial') {
            obtenerReciboPedido(docId).then(rec => {
              if (!cancelado) setRecibo(rec);
            });
          }
        } else {
          console.warn('⚠️ Pedido no encontrado para ID:', pedidoId);
          setPedido(null);
          setError('Pedido no encontrado. Verifique el codigo e intente de nuevo.');
        }
        setCargando(false);
      });
    };

    iniciar();

    return () => {
      cancelado = true;
      unsubscribe();
    };
  }, [pedidoId]);

  const handleBuscar = (codigo) => {
    setError(null);
    setPedido(null);
    setRecibo(null);
    setHistorial([]);
    setPedidoId(codigo);

    // Actualizar URL sin recargar
    window.history.pushState(null, '', `/tracking/${codigo}`);
  };

  const handleVolver = () => {
    setPedidoId(null);
    setPedido(null);
    setError(null);
    setRecibo(null);
    setHistorial([]);
    window.history.pushState(null, '', '/tracking');
  };

  // Si no hay pedidoId, mostrar pantalla de búsqueda
  if (!pedidoId) {
    return <PantallaBusqueda onBuscar={handleBuscar} error={error} />;
  }

  // Cargando
  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Buscando pedido...</p>
        </div>
      </div>
    );
  }

  // Error / no encontrado
  if (!pedido) {
    return <PantallaBusqueda onBuscar={handleBuscar} error={error || 'Pedido no encontrado'} />;
  }

  const esEntregaParcial = pedido.estado === 'Entrega Parcial';
  const esCancelado = pedido.estado === 'Cancelado';
  const esEntregado = pedido.estado === 'Entregado' || esEntregaParcial;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck size={28} />
            <div>
              <h1 className="font-bold text-lg">Seguimiento de Pedido</h1>
              <p className="text-blue-200 text-xs">Distribuidora Sarego</p>
            </div>
          </div>
          <button
            onClick={handleVolver}
            className="text-sm px-3 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
          >
            Otro pedido
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Tarjeta de estado actual */}
        <div className={`rounded-2xl shadow-lg overflow-hidden ${
          esEntregado && !esEntregaParcial
            ? 'bg-green-600'
            : esEntregaParcial || esCancelado
              ? 'bg-red-600'
              : 'bg-white'
        }`}>
          <div className={`p-5 ${esEntregado || esCancelado ? 'text-white' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${esEntregado || esCancelado ? 'text-white/80' : 'text-gray-500'}`}>
                Pedido
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                esEntregado && !esEntregaParcial
                  ? 'bg-green-500 text-white'
                  : esEntregaParcial
                    ? 'bg-red-500 text-white'
                    : esCancelado
                      ? 'bg-red-500 text-white'
                      : pedido.estado === 'En Ruta'
                        ? 'bg-indigo-100 text-indigo-700'
                        : pedido.estado === 'Asignado'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
              }`}>
                {pedido.estado}
              </span>
            </div>
            <h2 className={`text-2xl font-bold ${esEntregado || esCancelado ? '' : 'text-gray-800'}`}>
              {pedido.id}
            </h2>
            {(esEntregado && !esEntregaParcial) && (
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle size={20} />
                <span className="font-medium">Su pedido fue entregado exitosamente</span>
              </div>
            )}
            {esEntregaParcial && (
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle size={20} />
                <span className="font-medium">Entrega parcial - revise los detalles abajo</span>
              </div>
            )}
          </div>
        </div>

        {/* Info del pedido */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            Detalles del pedido
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium text-gray-800 text-right">{pedido.cliente || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Direccion</span>
              <span className="font-medium text-gray-800 text-right max-w-[60%]">{pedido.direccion || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ciudad</span>
              <span className="font-medium text-gray-800">{pedido.ciudad || 'N/A'}</span>
            </div>
            {pedido.prioridad && (
              <div className="flex justify-between">
                <span className="text-gray-500">Prioridad</span>
                <span className={`font-medium ${
                  pedido.prioridad === 'Urgente' ? 'text-red-600' :
                  pedido.prioridad === 'Alta' ? 'text-orange-600' : 'text-gray-800'
                }`}>{pedido.prioridad}</span>
              </div>
            )}
            {pedido.fechaCreacion && (
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha pedido</span>
                <span className="font-medium text-gray-800">{formatFecha(pedido.fechaCreacion)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline de estados */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Clock size={18} className="text-blue-600" />
            Estado de la entrega
          </h3>
          <TimelineEstados
            estadoActual={pedido.estado}
            historial={historial}
            esEntregaParcial={esEntregaParcial}
          />
        </div>

        {/* Mapa en tiempo real cuando está en ruta */}
        {(pedido.estado === 'En Ruta' || pedido.estado === 'Asignado') && pedido.camionAsignado && (
          <MapaSeguimiento
            camionId={pedido.camionAsignado}
            coordenadasDestino={pedido.coordenadas}
          />
        )}

        {/* Info del vehículo y conductor */}
        {pedido.camionAsignado && (pedido.estado === 'En Ruta' || pedido.estado === 'En Consolidación' || pedido.estado === 'Asignado') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
              <Truck size={18} />
              Información de transporte
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Vehículo</p>
                <p className="font-medium text-gray-800">{pedido.camionAsignado}</p>
              </div>
              {pedido.placaVehiculo && (
                <div>
                  <p className="text-gray-500">Placa</p>
                  <p className="font-medium text-gray-800">{pedido.placaVehiculo}</p>
                </div>
              )}
              {pedido.nombreConductor && (
                <div>
                  <p className="text-gray-500">Conductor</p>
                  <p className="font-medium text-gray-800">{pedido.nombreConductor}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recibo de entrega */}
        {recibo && <InfoRecibo recibo={recibo} />}

        {/* Mensaje si está en ruta */}
        {pedido.estado === 'En Ruta' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
            <Truck size={24} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-indigo-800">Su pedido esta en camino</p>
              <p className="text-sm text-indigo-600 mt-1">
                El conductor se dirige a su ubicacion. Esta pagina se actualiza automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Distribuidora Sarego &copy; {new Date().getFullYear()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Esta pagina se actualiza en tiempo real
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeguimientoPedido;
