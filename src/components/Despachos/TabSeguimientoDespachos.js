// src/components/Despachos/TabSeguimientoDespachos.js
// Real-time dispatch tracking component with route optimization

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Truck, MapPin, Clock, Fuel, Route, Navigation, Zap,
  ChevronUp, ChevronDown, Play, Pause, CheckCircle,
  AlertCircle, Package, Radio, RotateCcw, List, Map as MapIcon, ChevronLeft
} from 'lucide-react';
import MapaDespachos from './MapaDespachos';
import { escucharPosicionVehiculo, isFirebaseAvailable } from '../../services/firebase';
import {
  intelligentOptimizer as optimizarRutaInteligente,
  calculateRouteMetrics
} from '../../services/routeOptimizer';

const TabSeguimientoDespachos = ({
  despachos = [],
  camiones = [],
  pedidos = [],
  rutas = {},
  onModificarRuta,
  onActualizarDespacho
}) => {
  const [despachoSeleccionado, setDespachoSeleccionado] = useState(null);
  const [preferenciaOptimizacion, setPreferenciaOptimizacion] = useState('distancia');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rutaEditada, setRutaEditada] = useState([]);
  const [posicionesVehiculos, setPosicionesVehiculos] = useState({});
  const [seguimientoActivo, setSeguimientoActivo] = useState({});
  const [metricas, setMetricas] = useState(null);
  const [firebaseDisponible, setFirebaseDisponible] = useState(false);
  const [vistaMobile, setVistaMobile] = useState('lista'); // 'lista' | 'mapa'

  // Check Firebase availability on mount
  useEffect(() => {
    setFirebaseDisponible(isFirebaseAvailable());
  }, []);

  // Filter active despachos (not completed or canceled)
  const despachosActivos = despachos.filter(
    d => d.estado !== 'Completado' && d.estado !== 'Cancelado'
  );

  // Get selected despacho details
  const despacho = despachoSeleccionado
    ? despachosActivos.find(d => d.id === despachoSeleccionado)
    : null;

  const camion = despacho
    ? camiones.find(c => c.id === despacho.camionId)
    : null;

  const rutaActual = despacho
    ? (rutas[despacho.camionId] || despacho.ruta || [])
    : [];

  // Initialize edited route when entering edit mode
  useEffect(() => {
    if (modoEdicion && rutaActual.length > 0) {
      setRutaEditada([...rutaActual]);
    }
  }, [modoEdicion, rutaActual]);

  // Calculate metrics when route changes
  useEffect(() => {
    if (rutaActual.length > 0) {
      const startPoint = camion?.ubicacionActual || null;
      const calculatedMetrics = calculateRouteMetrics(rutaActual, startPoint);
      setMetricas(calculatedMetrics);
    }
  }, [rutaActual, camion]);

  // Ref to trigger map centering
  const [triggerCentrar, setTriggerCentrar] = useState(0);
  const despachoAnterior = useRef(null);

  // Auto-center map ONLY when despacho changes (not when route changes)
  useEffect(() => {
    if (despachoSeleccionado && despachoSeleccionado !== despachoAnterior.current && rutaActual.length > 0) {
      // Trigger centering after a short delay to ensure map is rendered
      setTimeout(() => {
        setTriggerCentrar(prev => prev + 1);
      }, 300);
      despachoAnterior.current = despachoSeleccionado;
    }
  }, [despachoSeleccionado]);

  // Recalculate metrics when editing route
  useEffect(() => {
    if (modoEdicion && rutaEditada.length > 0) {
      const startPoint = camion?.ubicacionActual || null;
      const calculatedMetrics = calculateRouteMetrics(rutaEditada, startPoint);
      setMetricas(calculatedMetrics);
    }
  }, [rutaEditada, modoEdicion, camion]);

  // Real-time GPS tracking
  useEffect(() => {
    if (!despacho || !seguimientoActivo[despacho.id] || !firebaseDisponible) {
      return;
    }

    const vehiculoId = despacho.camionId;
    const unsubscribe = escucharPosicionVehiculo(vehiculoId, (posicion) => {
      setPosicionesVehiculos(prev => ({
        ...prev,
        [vehiculoId]: {
          ...posicion,
          timestamp: new Date().toISOString()
        }
      }));
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [despacho, seguimientoActivo, firebaseDisponible]);

  // Toggle real-time tracking
  const toggleSeguimiento = useCallback((despachoId) => {
    setSeguimientoActivo(prev => ({
      ...prev,
      [despachoId]: !prev[despachoId]
    }));
  }, []);

  // Handle route optimization
  const handleOptimizarRuta = useCallback(() => {
    if (!rutaActual || rutaActual.length === 0) {
      alert('No hay paradas para optimizar');
      return;
    }

    const startPoint = camion?.ubicacionActual || null;

    // Run intelligent optimizer
    const resultado = optimizarRutaInteligente(rutaActual, {
      startPoint,
      enableZoneOptimization: true,
      enableNearestNeighbor: true,
      enableTwoOpt: true
    });

    // Show optimization results
    const mejora = resultado.originalMetrics && resultado.metrics
      ? ((resultado.originalMetrics.totalDistance - resultado.metrics.totalDistance) / resultado.originalMetrics.totalDistance * 100).toFixed(1)
      : 0;

    const mensaje = `Ruta optimizada exitosamente

Algoritmo: ${resultado.algorithm}
Distancia original: ${resultado.originalMetrics?.totalDistance?.toFixed(1) || 0} km
Distancia optimizada: ${resultado.metrics?.totalDistance?.toFixed(1) || 0} km
Mejora: ${mejora}% menos distancia

Tiempo estimado: ${resultado.metrics?.totalTimeMinutes || 0} min
Combustible estimado: ${resultado.metrics?.totalFuel?.toFixed(1) || 0} L`;

    alert(mensaje);

    // Apply optimized route
    if (onModificarRuta && despacho) {
      onModificarRuta(despacho.camionId, resultado.route);
    }
  }, [rutaActual, camion, onModificarRuta, despacho]);

  // Manual route editing functions
  const moverParada = (index, direccion) => {
    const nuevaRuta = [...rutaEditada];
    const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;

    if (nuevoIndex >= 0 && nuevoIndex < nuevaRuta.length) {
      [nuevaRuta[index], nuevaRuta[nuevoIndex]] = [nuevaRuta[nuevoIndex], nuevaRuta[index]];
      setRutaEditada(nuevaRuta);
    }
  };

  const guardarEdicion = () => {
    if (onModificarRuta && despacho) {
      onModificarRuta(despacho.camionId, rutaEditada);
      setModoEdicion(false);
      alert('Ruta actualizada exitosamente');
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setRutaEditada([]);
  };

  // Get last GPS update time
  const getUltimaActualizacion = (vehiculoId) => {
    const posicion = posicionesVehiculos[vehiculoId];
    if (!posicion?.timestamp) return 'Sin datos';

    const ahora = new Date();
    const entonces = new Date(posicion.timestamp);
    const diffMs = ahora - entonces;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `Hace ${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    return `Hace ${diffHr}h`;
  };

  // Handle despacho selection on mobile
  const handleSelectDespachoMobile = (id) => {
    setDespachoSeleccionado(id);
    setVistaMobile('mapa');
  };

  // Render left sidebar with despacho list
  const renderSidebar = () => (
    <div className={`${vistaMobile === 'lista' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-white md:border-r overflow-y-auto flex-col`}>
      <div className="p-3 md:p-4 border-b bg-gray-50">
        <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
          <Navigation className="text-blue-600" size={18} />
          Despachos Activos
        </h3>
        <p className="text-xs md:text-sm text-gray-600 mt-1">
          {despachosActivos.length} en seguimiento
        </p>
      </div>

      <div className="divide-y">
        {despachosActivos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Truck size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No hay despachos activos</p>
          </div>
        ) : (
          despachosActivos.map(d => {
            const cam = camiones.find(c => c.id === d.camionId);
            const ruta = rutas[d.camionId] || d.ruta || [];
            const isSelected = despachoSeleccionado === d.id;

            return (
              <div
                key={d.id}
                onClick={() => {
                  setDespachoSeleccionado(d.id);
                  // En móvil, cambiar a vista mapa al seleccionar
                  if (window.innerWidth < 768) {
                    setVistaMobile('mapa');
                  }
                }}
                className={`p-3 md:p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-blue-600" />
                    <span className="font-semibold">{d.camionId}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    d.estado === 'En Ruta' ? 'bg-green-100 text-green-700' :
                    d.estado === 'Asignado' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {d.estado}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span className="truncate">{cam?.conductor || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package size={12} />
                    <span>{ruta.length} paradas</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-2 h-1 bg-blue-500 rounded-full" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Render route metrics cards
  const renderMetricsCards = () => {
    if (!metricas) return null;

    return (
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Route size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Distancia Total</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {metricas.totalDistance?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-gray-500">kilómetros</div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-green-600" />
            <span className="text-sm font-medium text-gray-600">Tiempo Estimado</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {metricas.totalTimeMinutes || 0}
          </div>
          <div className="text-xs text-gray-500">minutos</div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Fuel size={16} className="text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Combustible</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {metricas.totalFuel?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-gray-500">litros</div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Paradas</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {metricas.stopsCount || 0}
          </div>
          <div className="text-xs text-gray-500">entregas</div>
        </div>
      </div>
    );
  };

  // Render main content area
  const renderMainContent = () => {
    if (!despacho) {
      return (
        <div className={`${vistaMobile === 'mapa' ? 'flex' : 'hidden'} md:flex flex-1 items-center justify-center bg-gray-50`}>
          <div className="text-center p-4">
            <Navigation size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">
              Selecciona un despacho
            </h3>
            <p className="text-gray-500 text-sm md:text-base">
              Elige un despacho para ver el seguimiento
            </p>
            <button
              onClick={() => setVistaMobile('lista')}
              className="md:hidden mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              <ChevronLeft size={18} />
              Ver lista
            </button>
          </div>
        </div>
      );
    }

    const posicionVehiculo = posicionesVehiculos[despacho.camionId];
    const trackingActivo = seguimientoActivo[despacho.id];

    return (
      <div className={`${vistaMobile === 'mapa' ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-y-auto bg-gray-50`}>
        <div className="p-3 md:p-6">
          {/* Botón volver en móvil */}
          <button
            onClick={() => setVistaMobile('lista')}
            className="md:hidden flex items-center gap-2 mb-3 text-blue-600 font-medium"
          >
            <ChevronLeft size={20} />
            Volver a lista
          </button>

          {/* Header with truck info */}
          <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                  <Truck size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">{despacho.camionId}</h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    {camion?.conductor || 'N/A'} • {rutaActual.length} paradas
                  </p>
                </div>
              </div>

              {/* Real-time tracking toggle */}
              <button
                onClick={() => toggleSeguimiento(despacho.id)}
                disabled={!firebaseDisponible}
                className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
                  trackingActivo
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${!firebaseDisponible ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!firebaseDisponible ? 'Firebase no disponible' : ''}
              >
                {trackingActivo ? <Pause size={16} /> : <Play size={16} />}
                <span className="hidden sm:inline">Seguimiento en Vivo</span>
                <span className="sm:hidden">En Vivo</span>
              </button>
            </div>

            {/* GPS info banner */}
            {trackingActivo && firebaseDisponible && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Radio size={16} className="text-green-600 animate-pulse" />
                  <span className="text-sm font-medium text-green-700">
                    Sincronización activa con Firebase
                  </span>
                </div>
                <span className="text-xs text-green-600">
                  Última actualización: {getUltimaActualizacion(despacho.camionId)}
                </span>
              </div>
            )}
          </div>

          {/* Route optimization controls */}
          <div className="bg-white rounded-lg border shadow-sm p-4 mb-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap size={18} className="text-yellow-500" />
              Optimización de Ruta
            </h3>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferencia de optimización
                </label>
                <select
                  value={preferenciaOptimizacion}
                  onChange={(e) => setPreferenciaOptimizacion(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={modoEdicion}
                >
                  <option value="distancia">Minimizar distancia</option>
                  <option value="tiempo">Minimizar tiempo</option>
                  <option value="combustible">Minimizar combustible</option>
                </select>
              </div>

              <button
                onClick={handleOptimizarRuta}
                disabled={modoEdicion || rutaActual.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                <Zap size={16} />
                Optimizar Ruta
              </button>

              <button
                onClick={() => {
                  // Recalcular ruta con algoritmo inteligente
                  handleOptimizarRuta();
                }}
                disabled={modoEdicion || rutaActual.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                <RotateCcw size={16} />
                Recalcular Ruta
              </button>

              <button
                onClick={() => {
                  // Re-iniciar ruta: resetear progreso
                  if (despacho && window.confirm('¿Reiniciar el progreso de la ruta? Esto marcará todas las paradas como pendientes.')) {
                    const rutaReiniciada = rutaActual.map(parada => ({
                      ...parada,
                      completada: false
                    }));
                    onModificarRuta(despacho.camionId, rutaReiniciada);
                    onActualizarDespacho(despacho.id, { progreso: 0 });
                  }
                }}
                disabled={modoEdicion || rutaActual.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                <Play size={16} />
                Re-iniciar Ruta
              </button>

              <button
                onClick={() => setModoEdicion(!modoEdicion)}
                disabled={rutaActual.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                <Route size={16} />
                {modoEdicion ? 'Cancelar Edición' : 'Editar Manual'}
              </button>
            </div>
          </div>

          {/* Metrics cards */}
          {renderMetricsCards()}

          {/* Map */}
          <div className="mb-4">
            <MapaDespachos
              camion={{
                ...camion,
                ubicacionActual: posicionVehiculo || camion?.ubicacionActual
              }}
              ruta={modoEdicion ? rutaEditada : rutaActual}
              depositoPreferido={despacho.depositoOrigen || ''}
              editandoRuta={modoEdicion}
              rutaEditada={rutaEditada}
              triggerCentrar={triggerCentrar}
            />
          </div>

          {/* Route editing section */}
          {rutaActual.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />
                  Secuencia de Paradas
                </h3>

                {modoEdicion && (
                  <div className="flex gap-2">
                    <button
                      onClick={guardarEdicion}
                      className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      <CheckCircle size={14} />
                      Guardar
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      <AlertCircle size={14} />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {modoEdicion && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    Modo edición manual: Use las flechas para reordenar las paradas.
                    Los cambios se reflejan en el mapa y las métricas se actualizan automáticamente.
                  </p>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(modoEdicion ? rutaEditada : rutaActual).map((parada, index) => (
                  <div
                    key={parada.id || index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      modoEdicion ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{parada.cliente}</div>
                        <div className="text-sm text-gray-600 truncate">{parada.direccion}</div>
                        <div className="text-xs text-gray-500">
                          {parada.distancia?.toFixed(1) || '0.0'} km • {parada.tiempoEstimado || 0} min
                        </div>
                      </div>
                    </div>

                    {modoEdicion && (
                      <div className="flex flex-col gap-1 ml-2">
                        <button
                          onClick={() => moverParada(index, 'arriba')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover arriba"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => moverParada(index, 'abajo')}
                          disabled={index === rutaEditada.length - 1}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover abajo"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    )}

                    {!modoEdicion && parada.completado && (
                      <CheckCircle size={20} className="text-green-500 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Toggle vista móvil */}
      <div className="md:hidden flex gap-2 p-2 bg-white border-b">
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

      {renderSidebar()}
      {renderMainContent()}
    </div>
  );
};

export default TabSeguimientoDespachos;
