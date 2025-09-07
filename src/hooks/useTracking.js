// src/hooks/useTracking.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calcularDistancia } from '../utils/calculos';

// Almacenamiento simple de cola usando localStorage para Fase 1
const QUEUE_KEY = 'tracking:queue:v1';

const loadQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

const saveQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (_) {
    // ignore
  }
};

export const useTracking = ({ sendPosition, minSeconds = 15, minMeters = 50 } = {}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [queue, setQueue] = useState(loadQueue());
  const [lastFix, setLastFix] = useState(null);
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const lastSentRef = useRef({ ts: 0, coord: null });
  const metaRef = useRef({ driverId: null, vehiculoId: null });
  const retryTimerRef = useRef(null);

  const queueLength = queue.length;

  const shouldSend = useCallback((coord, ts) => {
    const last = lastSentRef.current;
    if (!last.coord) return true;

    const elapsedSec = (ts - last.ts) / 1000;
    if (elapsedSec < minSeconds) return false;

    const dist = calcularDistancia({ lat: last.coord.lat, lng: last.coord.lng }, coord) * 1000; // m
    return dist >= minMeters;
  }, [minSeconds, minMeters]);

  const processQueue = useCallback(async () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (!queue.length) return;
    if (!sendPosition) return; // no-op

    let newQueue = [...queue];
    while (newQueue.length) {
      const evt = newQueue[0];
      try {
        await sendPosition(evt);
        newQueue.shift();
        setQueue(newQueue);
        saveQueue(newQueue);
      } catch (e) {
        // Reintento con backoff simple
        const backoffMs = Math.min(30000, 2000 + Math.floor(Math.random() * 2000));
        retryTimerRef.current = setTimeout(processQueue, backoffMs);
        break;
      }
    }
  }, [queue, sendPosition]);

  useEffect(() => {
    if (queue.length) processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  const onFix = useCallback((pos) => {
    const { coords, timestamp } = pos;
    const coord = { lat: coords.latitude, lng: coords.longitude };
    const speedKmh = coords.speed != null && !Number.isNaN(coords.speed) ? Math.max(0, Math.round(coords.speed * 3.6)) : null; // m/s -> km/h
    const heading = coords.heading != null && !Number.isNaN(coords.heading) ? coords.heading : null;

    const now = timestamp || Date.now();
    const evt = {
      vehiculoId: metaRef.current.vehiculoId,
      driverId: metaRef.current.driverId,
      coord,
      speedKmh,
      heading,
      accuracy: coords.accuracy,
      ts: now
    };

    setLastFix(evt);

    if (!shouldSend(coord, now)) return;

    lastSentRef.current = { ts: now, coord };

    // Intentar enviar; si falla, encolar
    const attempt = async () => {
      if (!sendPosition) return; // no-op
      try {
        await sendPosition(evt);
      } catch (e) {
        const newQueue = [...queue, evt];
        setQueue(newQueue);
        saveQueue(newQueue);
      }
    };
    attempt();
  }, [queue, sendPosition, shouldSend]);

  const onError = useCallback((err) => {
    setError(err);
  }, []);

  const start = useCallback(({ vehiculoId, driverId }) => {
    if (!('geolocation' in navigator)) {
      setError(new Error('Geolocalización no soportada'));
      return;
    }
    metaRef.current = { vehiculoId, driverId };
    setIsTracking(true);
    setError(null);
    try {
      const id = navigator.geolocation.watchPosition(onFix, onError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      });
      watchIdRef.current = id;
    } catch (e) {
      setError(e);
    }
  }, [onFix, onError]);

  const stop = useCallback(() => {
    if (watchIdRef.current != null) {
      try { navigator.geolocation.clearWatch(watchIdRef.current); } catch (_) {}
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Limpieza
  useEffect(() => () => {
    if (watchIdRef.current != null) {
      try { navigator.geolocation.clearWatch(watchIdRef.current); } catch (_) {}
    }
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

  return {
    isTracking,
    start,
    stop,
    lastFix,
    error,
    queueLength,
  };
};

