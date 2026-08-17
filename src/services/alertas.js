// src/services/alertas.js
// Motor de alertas automáticas del flujo transversal del proceso.
//
// Las alertas se derivan del estado actual (posiciones, pedidos, incidencias)
// en cada render: no se persisten. Eso las hace siempre consistentes con los
// datos y evita una cola de alertas obsoletas que nadie limpia.
//
// Limitación honesta: 'desvío de ruta' y el retraso contra ETA sólo son
// calculables cuando el destino tiene coordenadas reales. Con la calidad de
// direcciones actual del ERP, la mayoría de pedidos no las tiene, y en ese
// caso la alerta simplemente no se emite en vez de inventar un valor.

import { TIPOS_ALERTA, CONFIG_ALERTAS } from '../utils/constants';
import { calcularDistancia } from '../utils/calculos';

export const SEVERIDADES = {
  CRITICA: 'critica',
  ALTA: 'alta',
  MEDIA: 'media'
};

const ESTILOS_SEVERIDAD = {
  [SEVERIDADES.CRITICA]: 'bg-red-100 text-red-800 border-red-300',
  [SEVERIDADES.ALTA]: 'bg-orange-100 text-orange-800 border-orange-300',
  [SEVERIDADES.MEDIA]: 'bg-yellow-100 text-yellow-800 border-yellow-300'
};

export const estiloSeveridad = (severidad) =>
  ESTILOS_SEVERIDAD[severidad] || 'bg-gray-100 text-gray-800 border-gray-300';

const minutosDesde = (valor, ahora) => {
  if (!valor) return null;
  const fecha = valor?.toDate ? valor.toDate() : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return (ahora - fecha.getTime()) / 60000;
};

const coordsValidas = (c) =>
  c && typeof c.lat === 'number' && typeof c.lng === 'number' &&
  !(c.lat === 0 && c.lng === 0);

/**
 * Vehículo detenido: hay señal reciente pero no se ha movido.
 */
const alertaParadaProlongada = (camion, ahora) => {
  const historial = camion.historialPosiciones;
  if (!Array.isArray(historial) || historial.length < 2) return null;

  const ultima = historial[historial.length - 1];
  const minutosUltima = minutosDesde(ultima.ts, ahora);
  if (minutosUltima == null || minutosUltima > CONFIG_ALERTAS.MINUTOS_SIN_SENAL) return null;

  // Referencia: la posición más reciente que ya tenga al menos la antigüedad de
  // la ventana. Si desde ella el vehículo no se movió, lleva parado ese tiempo.
  let referencia = null;
  let minutosReferencia = null;

  for (const posicion of historial) {
    const m = minutosDesde(posicion.ts, ahora);
    if (m == null || m < CONFIG_ALERTAS.MINUTOS_PARADA_PROLONGADA) continue;
    if (minutosReferencia == null || m < minutosReferencia) {
      referencia = posicion;
      minutosReferencia = m;
    }
  }

  if (!referencia) return null;

  // Ninguna posición intermedia debe haberse alejado del punto de referencia.
  const posicionesDesdeReferencia = historial.filter(p => {
    const m = minutosDesde(p.ts, ahora);
    return m != null && m <= minutosReferencia;
  });

  const seMovio = posicionesDesdeReferencia.some(
    p => calcularDistancia(referencia, p) * 1000 > CONFIG_ALERTAS.METROS_MOVIMIENTO_MINIMO
  );
  if (seMovio) return null;

  const minutosPrimera = minutosReferencia;

  return {
    tipo: TIPOS_ALERTA.PARADA_PROLONGADA,
    severidad: SEVERIDADES.MEDIA,
    camionId: camion.id,
    titulo: `${camion.placa || camion.id} detenido`,
    detalle: `Sin desplazamiento significativo desde hace ${Math.round(minutosPrimera)} min.`
  };
};

/**
 * Tracking caído: el vehículo está en ruta pero dejó de reportar posición.
 */
const alertaSinSenal = (camion, ahora) => {
  const minutos = minutosDesde(camion.ultimaActualizacion, ahora);
  if (minutos == null || minutos <= CONFIG_ALERTAS.MINUTOS_SIN_SENAL) return null;

  return {
    tipo: TIPOS_ALERTA.FALLA_VEHICULO,
    severidad: SEVERIDADES.ALTA,
    camionId: camion.id,
    titulo: `${camion.placa || camion.id} sin señal`,
    detalle: `No reporta posición desde hace ${Math.round(minutos)} min. Puede ser falla del vehículo o del dispositivo.`
  };
};

/**
 * Desvío: el vehículo se alejó de todos sus destinos pendientes.
 * Sólo calculable con coordenadas reales del destino.
 */
const alertaDesvio = (camion, pedidosDelCamion) => {
  if (!coordsValidas(camion.ubicacionActual)) return null;

  const destinos = pedidosDelCamion.filter(p => coordsValidas(p.coordenadas) && !p.coordenadas.geocodificada);
  if (!destinos.length) return null;

  const distancias = destinos.map(p => calcularDistancia(camion.ubicacionActual, p.coordenadas));
  const masCercano = Math.min(...distancias);
  if (masCercano <= CONFIG_ALERTAS.KM_DESVIO) return null;

  return {
    tipo: TIPOS_ALERTA.DESVIO,
    severidad: SEVERIDADES.ALTA,
    camionId: camion.id,
    titulo: `${camion.placa || camion.id} fuera de zona`,
    detalle: `A ${masCercano.toFixed(1)} km del destino pendiente más cercano.`
  };
};

/**
 * Retraso: la ETA comprometida ya pasó y el pedido sigue sin entregar.
 */
const alertaRetraso = (pedido, ahora) => {
  if (!pedido.etaEstimada) return null;

  const minutos = minutosDesde(pedido.etaEstimada, ahora);
  if (minutos == null || minutos < CONFIG_ALERTAS.MINUTOS_RETRASO) return null;

  return {
    tipo: TIPOS_ALERTA.RETRASO,
    severidad: minutos > 120 ? SEVERIDADES.ALTA : SEVERIDADES.MEDIA,
    pedidoId: pedido.id,
    camionId: pedido.camionAsignado,
    titulo: `Retraso en ${pedido.cliente || pedido.numeroPedido || pedido.id}`,
    detalle: `${Math.round(minutos)} min sobre la hora estimada de llegada.`
  };
};

/**
 * Cambio de ETA: la estimación se movió respecto a la comprometida al cliente.
 */
const alertaCambioEta = (pedido) => {
  if (!pedido.etaEstimada || !pedido.etaOriginal) return null;

  const actual = new Date(pedido.etaEstimada).getTime();
  const original = new Date(pedido.etaOriginal).getTime();
  if (Number.isNaN(actual) || Number.isNaN(original)) return null;

  const diffMin = Math.abs(actual - original) / 60000;
  if (diffMin < CONFIG_ALERTAS.MINUTOS_RETRASO) return null;

  return {
    tipo: TIPOS_ALERTA.CAMBIO_ETA,
    severidad: SEVERIDADES.MEDIA,
    pedidoId: pedido.id,
    camionId: pedido.camionAsignado,
    titulo: `ETA cambió en ${pedido.cliente || pedido.id}`,
    detalle: `${Math.round(diffMin)} min de diferencia con lo informado al cliente.`
  };
};

/**
 * Incidencias abiertas reportadas por el conductor.
 */
const alertasDeIncidencias = (incidencias) =>
  incidencias
    .filter(i => i.estado === 'Abierta' || i.estado === 'En gestión')
    .map(i => ({
      tipo: TIPOS_ALERTA.INCIDENCIA,
      severidad: i.gravedad === 'Grave' ? SEVERIDADES.CRITICA : SEVERIDADES.ALTA,
      camionId: i.camionId,
      pedidoId: i.pedidoId,
      incidenciaId: i.id,
      titulo: `${i.tipoLabel || 'Incidencia'} — ${i.camionPlaca || i.camionId || 'vehículo'}`,
      detalle: i.descripcion || 'Incidencia reportada por el conductor.'
    }));

/**
 * Calcula todas las alertas activas del momento.
 */
export const calcularAlertas = ({ camiones = [], pedidos = [], incidencias = [], ahora = Date.now() } = {}) => {
  const alertas = [];

  const enRuta = camiones.filter(c => c.estado === 'En Ruta');

  for (const camion of enRuta) {
    const pedidosDelCamion = pedidos.filter(p =>
      p.camionAsignado === camion.id &&
      p.estado !== 'Entregado' && p.estado !== 'Entrega Parcial' && p.estado !== 'Cerrado'
    );

    const sinSenal = alertaSinSenal(camion, ahora);
    if (sinSenal) alertas.push(sinSenal);
    // Si no hay señal, "detenido" y "desvío" son ruido derivado del mismo hecho.
    if (!sinSenal) {
      const parada = alertaParadaProlongada(camion, ahora);
      if (parada) alertas.push(parada);

      const desvio = alertaDesvio(camion, pedidosDelCamion);
      if (desvio) alertas.push(desvio);
    }

    for (const pedido of pedidosDelCamion) {
      const retraso = alertaRetraso(pedido, ahora);
      if (retraso) alertas.push(retraso);

      const cambioEta = alertaCambioEta(pedido);
      if (cambioEta) alertas.push(cambioEta);
    }
  }

  alertas.push(...alertasDeIncidencias(incidencias));

  const orden = { [SEVERIDADES.CRITICA]: 0, [SEVERIDADES.ALTA]: 1, [SEVERIDADES.MEDIA]: 2 };
  return alertas.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
};

const alertasService = { calcularAlertas, estiloSeveridad, SEVERIDADES };
export default alertasService;
