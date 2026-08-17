// src/utils/geo.js
// Captura de ubicación puntual, independiente del tracking continuo.

const OPCIONES_GPS = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 0
};

// Un fix del tracking continuo sirve como ubicación de entrega solo si es reciente.
export const ANTIGUEDAD_MAXIMA_FIX_MS = 2 * 60 * 1000;

/**
 * Pide una lectura GPS puntual al navegador.
 * Nunca lanza: si falla o el usuario niega el permiso devuelve null.
 */
export const obtenerUbicacionActual = (opciones = {}) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        precision: pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : null,
        timestamp: pos.timestamp,
        fuente: 'puntual'
      }),
      (err) => {
        console.warn('No se pudo obtener ubicación puntual:', err?.message || err);
        resolve(null);
      },
      { ...OPCIONES_GPS, ...opciones }
    );
  });
};

/**
 * Resuelve la ubicación de una entrega.
 * Prioriza el último fix del tracking activo si es reciente; si no, pide uno puntual.
 */
export const resolverUbicacionEntrega = async (lastFix) => {
  const ahora = Date.now();

  if (lastFix?.coord && ahora - lastFix.ts < ANTIGUEDAD_MAXIMA_FIX_MS) {
    return {
      lat: lastFix.coord.lat,
      lng: lastFix.coord.lng,
      precision: lastFix.accuracy != null ? Math.round(lastFix.accuracy) : null,
      timestamp: lastFix.ts,
      fuente: 'tracking'
    };
  }

  const puntual = await obtenerUbicacionActual();
  if (puntual) return puntual;

  // Último recurso: fix viejo del tracking, marcado como tal para no fingir precisión.
  if (lastFix?.coord) {
    return {
      lat: lastFix.coord.lat,
      lng: lastFix.coord.lng,
      precision: lastFix.accuracy != null ? Math.round(lastFix.accuracy) : null,
      timestamp: lastFix.ts,
      fuente: 'tracking_desactualizado'
    };
  }

  return null;
};

export const ETIQUETA_FUENTE_UBICACION = {
  tracking: 'GPS en ruta',
  puntual: 'GPS al momento de la entrega',
  tracking_desactualizado: 'GPS desactualizado'
};
