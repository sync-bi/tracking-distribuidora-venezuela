// src/components/Conductor/Tracker.js
import React, { useMemo, useState, useEffect } from 'react';
import { Navigation, Play, Square, Activity, Truck } from 'lucide-react';
import { useTracking } from '../../hooks/useTracking';

const formatTime = (ts) => {
  try { return new Date(ts).toLocaleTimeString(); } catch { return ''; }
};

const Tracker = ({ user, camiones = [], onStartTracking, onStopTracking, onSendPosition }) => {
  const [vehiculoId, setVehiculoId] = useState(camiones[0]?.id || '');

  useEffect(() => {
    if (!vehiculoId && camiones.length) setVehiculoId(camiones[0].id);
  }, [camiones, vehiculoId]);

  const {
    isTracking,
    start,
    stop,
    lastFix,
    error,
    queueLength
  } = useTracking({
    // En Fase 1 enviamos al estado local de la app vía prop
    sendPosition: async (evt) => {
      await onSendPosition?.(evt);
      return Promise.resolve();
    },
    minSeconds: 15,
    minMeters: 50
  });

  const vehiculoSeleccionado = useMemo(() => camiones.find(c => c.id === vehiculoId), [camiones, vehiculoId]);

  const handleStart = async () => {
    if (!vehiculoId) return;
    onStartTracking?.(vehiculoId);
    start({ vehiculoId, driverId: user?.id ?? 'driver' });
  };

  const handleStop = () => {
    stop();
    if (vehiculoId) onStopTracking?.(vehiculoId);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Navigation size={18} /> Modo Conductor
      </h2>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Camión</label>
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-gray-500" />
              <select
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              >
                {camiones.map(c => (
                  <option key={c.id} value={c.id}>{c.id} - {c.placa}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStart}
              disabled={!vehiculoId || isTracking}
              className={`flex items-center gap-2 px-4 py-2 rounded text-white ${isTracking ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              title="Iniciar seguimiento"
            >
              <Play size={16} /> Iniciar
            </button>
            <button
              onClick={handleStop}
              disabled={!isTracking}
              className={`flex items-center gap-2 px-4 py-2 rounded text-white ${!isTracking ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              title="Detener seguimiento"
            >
              <Square size={16} /> Detener
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <div>Estado: {isTracking ? <span className="text-green-600 font-medium">Rastreando</span> : <span className="text-gray-700">Detenido</span>}</div>
            <div>Cola offline: {queueLength}</div>
            {error && <div className="text-red-600">{String(error.message || error)}</div>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-gray-500" />
          <h3 className="font-medium">Última posición</h3>
        </div>
        {lastFix ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Hora</div>
              <div className="font-medium">{formatTime(lastFix.ts)}</div>
            </div>
            <div>
              <div className="text-gray-500">Lat</div>
              <div className="font-medium">{lastFix.coord.lat.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-gray-500">Lng</div>
              <div className="font-medium">{lastFix.coord.lng.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-gray-500">Velocidad</div>
              <div className="font-medium">{lastFix.speedKmh != null ? `${lastFix.speedKmh} km/h` : '—'}</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600 text-sm">Sin lecturas aún. Inicia el seguimiento para ver datos.</div>
        )}
      </div>
    </div>
  );
};

export default Tracker;

