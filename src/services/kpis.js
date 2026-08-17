// src/services/kpis.js
// Indicadores clave del proceso de despacho (franja inferior del diagrama):
//   % entregas a tiempo (OTD), tiempo promedio de entrega,
//   % cumplimiento de ruta, incidencias por cada 100 entregas, NPS.
//
// Cada indicador devuelve además `base`, la cantidad de casos con datos
// suficientes para calcularlo. Un porcentaje sobre 3 entregas no significa lo
// mismo que sobre 300, y la UI lo muestra para no dar una falsa sensación de
// precisión.

import { METAS_KPI } from '../utils/constants';

const aFecha = (valor) => {
  if (!valor) return null;
  const f = valor?.toDate ? valor.toDate() : new Date(valor);
  return Number.isNaN(f.getTime()) ? null : f;
};

const ESTADOS_ENTREGA = ['Entregado', 'Entrega Parcial', 'Cerrado'];

const porcentaje = (parte, total) => (total > 0 ? (parte / total) * 100 : null);

/**
 * % de entregas dentro de la hora comprometida.
 * Sólo cuenta pedidos que tenían una ETA comprometida y un recibo con hora real.
 */
export const calcularOTD = (pedidos, recibos) => {
  const recibosPorPedido = new Map(recibos.map(r => [r.pedidoId, r]));

  let aTiempo = 0;
  let base = 0;

  for (const pedido of pedidos) {
    const eta = aFecha(pedido.etaEstimada);
    const recibo = recibosPorPedido.get(pedido.id);
    const entrega = aFecha(recibo?.fechaEntrega);
    if (!eta || !entrega) continue;

    base++;
    if (entrega <= eta) aTiempo++;
  }

  return { valor: porcentaje(aTiempo, base), base, meta: METAS_KPI.OTD, unidad: '%' };
};

/**
 * Tiempo promedio entre la salida del almacén y la entrega, en minutos.
 */
export const calcularTiempoPromedioEntrega = (pedidos, recibos, despachos) => {
  const recibosPorPedido = new Map(recibos.map(r => [r.pedidoId, r]));
  const salidaPorCamion = new Map();

  for (const d of despachos) {
    const salida = aFecha(d.salidaAlmacen?.fechaSalida);
    if (salida && d.camionId) {
      const previa = salidaPorCamion.get(d.camionId);
      if (!previa || salida > previa) salidaPorCamion.set(d.camionId, salida);
    }
  }

  const duraciones = [];

  for (const pedido of pedidos) {
    const recibo = recibosPorPedido.get(pedido.id);
    const entrega = aFecha(recibo?.fechaEntrega);
    const salida = salidaPorCamion.get(pedido.camionAsignado);
    if (!entrega || !salida || entrega <= salida) continue;

    duraciones.push((entrega - salida) / 60000);
  }

  if (!duraciones.length) return { valor: null, base: 0, unidad: 'min' };

  const promedio = duraciones.reduce((a, b) => a + b, 0) / duraciones.length;
  return { valor: promedio, base: duraciones.length, unidad: 'min' };
};

/**
 * % de paradas planificadas que efectivamente se cumplieron.
 */
export const calcularCumplimientoRuta = (despachos, pedidos) => {
  const estadoPorPedido = new Map(pedidos.map(p => [p.id, p.estado]));

  let planificadas = 0;
  let cumplidas = 0;

  for (const despacho of despachos) {
    const ruta = Array.isArray(despacho.ruta) ? despacho.ruta : [];
    for (const parada of ruta) {
      const pedidoId = parada?.id || parada;
      if (!pedidoId) continue;
      planificadas++;
      if (ESTADOS_ENTREGA.includes(estadoPorPedido.get(pedidoId))) cumplidas++;
    }
  }

  return {
    valor: porcentaje(cumplidas, planificadas),
    base: planificadas,
    meta: METAS_KPI.CUMPLIMIENTO_RUTA,
    unidad: '%'
  };
};

/**
 * Incidencias (en ruta + no conformidades) por cada 100 entregas.
 */
export const calcularIncidenciasPor100 = (incidenciasRuta, noConformidades, pedidos) => {
  const entregas = pedidos.filter(p => ESTADOS_ENTREGA.includes(p.estado)).length;
  if (!entregas) return { valor: null, base: 0, meta: METAS_KPI.INCIDENCIAS_POR_100, unidad: '/100' };

  const total = incidenciasRuta.length + noConformidades.length;
  return {
    valor: (total / entregas) * 100,
    base: entregas,
    meta: METAS_KPI.INCIDENCIAS_POR_100,
    unidad: '/100'
  };
};

/**
 * NPS a partir de las calificaciones de 1 a 10 dejadas por los clientes.
 * Promotores (9-10) menos detractores (1-6), en porcentaje.
 */
export const calcularNPS = (calificaciones) => {
  const validas = calificaciones.filter(c => Number.isFinite(Number(c.calificacion)));
  if (!validas.length) return { valor: null, base: 0, meta: METAS_KPI.NPS, unidad: '' };

  const promotores = validas.filter(c => Number(c.calificacion) >= 9).length;
  const detractores = validas.filter(c => Number(c.calificacion) <= 6).length;

  return {
    valor: ((promotores - detractores) / validas.length) * 100,
    base: validas.length,
    meta: METAS_KPI.NPS,
    unidad: ''
  };
};

/**
 * Filtra a una ventana de días hacia atrás usando la fecha de emisión del ERP.
 */
export const filtrarPorRango = (pedidos, dias) => {
  if (!dias) return pedidos;
  const desde = Date.now() - dias * 24 * 60 * 60 * 1000;

  return pedidos.filter(p => {
    const f = aFecha(p.fechaEmision) || aFecha(p.fechaCreacion);
    return f ? f.getTime() >= desde : false;
  });
};

export const calcularKPIs = ({
  pedidos = [],
  recibos = [],
  despachos = [],
  incidenciasRuta = [],
  noConformidades = [],
  calificaciones = []
} = {}) => ({
  otd: calcularOTD(pedidos, recibos),
  tiempoPromedio: calcularTiempoPromedioEntrega(pedidos, recibos, despachos),
  cumplimientoRuta: calcularCumplimientoRuta(despachos, pedidos),
  incidencias: calcularIncidenciasPor100(incidenciasRuta, noConformidades, pedidos),
  nps: calcularNPS(calificaciones)
});

const kpisService = { calcularKPIs, filtrarPorRango };
export default kpisService;
