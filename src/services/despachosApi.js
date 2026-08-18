// src/services/despachosApi.js
// Obtiene despachos desde el nuevo origen (notas de entrega + facturas).
// Cae automáticamente al endpoint anterior (/api/pedidos) si el nuevo no está
// disponible, para que la app nunca quede sin datos.

// Ventana operativa de sincronización. Un despacho más viejo que esto ya no se
// considera "por rutear": si aparece uno trabado, se revisa a mano en el ERP.
export const DIAS_SINCRONIZACION = 7;

// Fecha ISO (YYYY-MM-DD) de hace N días
export const fechaHaceDias = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().split('T')[0];
};

export async function fetchDespachos({ desde = fechaHaceDias(DIAS_SINCRONIZACION), estado = 'pendientes' } = {}) {
  // 1) Nuevo origen: despachos (notas de entrega + facturas)
  try {
    const res = await fetch(`/api/despachos?desde=${desde}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.pedidos) && data.pedidos.length > 0) {
        return { ...data, origen: data.origen || 'despachos' };
      }
    }
  } catch (err) {
    console.warn('API /despachos no disponible, usando /pedidos…', err.message);
  }

  // 2) Respaldo: endpoint anterior basado en pedidos
  const res = await fetch(`/api/pedidos?desde=${desde}&estado=${estado}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('API no disponible');
  const data = await res.json();
  return { ...data, origen: 'pedidos' };
}
