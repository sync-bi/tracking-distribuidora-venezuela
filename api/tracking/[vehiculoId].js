// Vercel Serverless Function: POST /api/tracking/[vehiculoId]
// Recibe eventos de posicion enviados por el modo Conductor (web/app)

export default async function handler(req, res) {
  // CORS básico (ajusta a tu dominio en producción)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Auth opcional por token (configura TRACKING_API_TOKEN en Vercel)
    const requiredToken = process.env.TRACKING_API_TOKEN;
    if (requiredToken) {
      const auth = req.headers['authorization'] || req.headers['Authorization'];
      const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token || token !== requiredToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const { vehiculoId } = req.query;
    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');

    const {
      driverId,
      lat,
      lng,
      speedKmh = null,
      heading = null,
      accuracy = null,
      ts,
      source = 'web'
    } = body;

    if (!vehiculoId || typeof lat !== 'number' || typeof lng !== 'number' || !ts) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Aquí puedes persistir en una base de datos (ej. Vercel Postgres, Supabase, Firebase)
    // Por ahora, solo log para ver en logs de Vercel
    console.log('TRACK', {
      vehiculoId,
      driverId: driverId || null,
      lat,
      lng,
      speedKmh,
      heading,
      accuracy,
      ts,
      source
    });

    // Respuesta mínima
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('TRACK_ERROR', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

