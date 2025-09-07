// src/services/trackingClient.js

const MODE = process.env.REACT_APP_TRACKING_MODE || 'rest';
const BASE_URL = process.env.REACT_APP_TRACKING_BASE_URL || '';
const AUTH_HEADER = process.env.REACT_APP_TRACKING_AUTH_HEADER || '';
const AUTH_VALUE = process.env.REACT_APP_TRACKING_AUTH_VALUE || '';

const restSend = async (evt) => {
  if (!BASE_URL) throw new Error('REACT_APP_TRACKING_BASE_URL no configurado');
  const urlBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const url = `${urlBase}/tracking/${encodeURIComponent(evt.vehiculoId)}`;

  const headers = { 'Content-Type': 'application/json' };
  if (AUTH_HEADER && AUTH_VALUE) headers[AUTH_HEADER] = AUTH_VALUE;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      driverId: evt.driverId,
      vehiculoId: evt.vehiculoId,
      lat: evt.coord.lat,
      lng: evt.coord.lng,
      speedKmh: evt.speedKmh ?? null,
      heading: evt.heading ?? null,
      accuracy: evt.accuracy ?? null,
      ts: evt.ts,
      source: 'web'
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Error ${res.status}: ${text || res.statusText}`);
  }
  return res.json().catch(() => ({}));
};

// Placeholder para Firebase/Supabase sin dependencias en Fase 1
const cloudSend = async (_evt) => {
  // Implementar cuando se integre Firebase/Supabase
  // Por ahora, simular éxito para no frenar la UI si se selecciona este modo por error.
  return Promise.resolve();
};

export const trackingClient = {
  mode: MODE,
  async sendPosition(evt) {
    if (MODE === 'rest') return restSend(evt);
    if (MODE === 'firebase') return cloudSend(evt);
    return restSend(evt);
  }
};

