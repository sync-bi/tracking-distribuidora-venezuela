// src/components/KPIs/TabKPIs.js
// Indicadores clave del proceso (franja inferior del diagrama del cliente).

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Clock, Route, AlertTriangle, Smile, Calendar, Info
} from 'lucide-react';
import {
  escucharIncidenciasRuta,
  escucharNoConformidades,
  escucharCalificaciones,
  escucharRecibosEntrega
} from '../../services/firestoreService';
import { calcularKPIs, filtrarPorRango } from '../../services/kpis';

const RANGOS = [
  { dias: 7, label: '7 días' },
  { dias: 30, label: '30 días' },
  { dias: 90, label: '90 días' },
  { dias: 0, label: 'Todo' }
];

const formatearValor = (kpi) => {
  if (kpi.valor == null) return '—';
  if (kpi.unidad === 'min') {
    const h = Math.floor(kpi.valor / 60);
    const m = Math.round(kpi.valor % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  return `${kpi.valor.toFixed(1)}${kpi.unidad}`;
};

// Para incidencias, menos es mejor; para el resto, más es mejor.
const cumpleMeta = (kpi, menosEsMejor) => {
  if (kpi.valor == null || kpi.meta == null) return null;
  return menosEsMejor ? kpi.valor <= kpi.meta : kpi.valor >= kpi.meta;
};

const TarjetaKPI = ({ icono: Icono, titulo, kpi, menosEsMejor = false, ayuda }) => {
  const ok = cumpleMeta(kpi, menosEsMejor);
  const sinDatos = kpi.valor == null;

  const color = sinDatos
    ? 'text-gray-400'
    : ok === null ? 'text-gray-800'
      : ok ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icono size={16} className="text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">{titulo}</h3>
      </div>

      <p className={`text-3xl font-bold ${color}`}>{formatearValor(kpi)}</p>

      <div className="mt-2 space-y-1">
        {kpi.meta != null && (
          <p className="text-xs text-gray-500">
            Meta: {menosEsMejor ? '≤' : '≥'} {kpi.meta}{kpi.unidad}
          </p>
        )}
        {sinDatos ? (
          <p className="text-xs text-amber-600">Sin datos suficientes</p>
        ) : (
          <p className="text-xs text-gray-400">Sobre {kpi.base} caso(s)</p>
        )}
      </div>

      {ayuda && (
        <p className="mt-2 text-[11px] text-gray-400 leading-snug">{ayuda}</p>
      )}
    </div>
  );
};

const TabKPIs = ({ pedidos = [], despachos = [] }) => {
  const [rango, setRango] = useState(30);
  const [incidenciasRuta, setIncidenciasRuta] = useState([]);
  const [noConformidades, setNoConformidades] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);
  const [recibos, setRecibos] = useState([]);

  useEffect(() => {
    const subs = [
      escucharIncidenciasRuta(setIncidenciasRuta),
      escucharNoConformidades(setNoConformidades),
      escucharCalificaciones(setCalificaciones),
      escucharRecibosEntrega(setRecibos)
    ];
    return () => subs.forEach(u => u?.());
  }, []);

  const pedidosRango = useMemo(() => filtrarPorRango(pedidos, rango), [pedidos, rango]);

  const kpis = useMemo(() => {
    const idsRango = new Set(pedidosRango.map(p => p.id));
    return calcularKPIs({
      pedidos: pedidosRango,
      recibos: recibos.filter(r => idsRango.has(r.pedidoId)),
      despachos,
      incidenciasRuta: incidenciasRuta.filter(i => !i.pedidoId || idsRango.has(i.pedidoId)),
      noConformidades: noConformidades.filter(n => !n.pedidoId || idsRango.has(n.pedidoId)),
      calificaciones: calificaciones.filter(c => idsRango.has(c.pedidoId))
    });
  }, [pedidosRango, recibos, despachos, incidenciasRuta, noConformidades, calificaciones]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp size={20} /> Indicadores de servicio
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <Calendar size={14} className="text-gray-500" />
          {RANGOS.map(r => (
            <button
              key={r.dias}
              onClick={() => setRango(r.dias)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                rango === r.dias
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <TarjetaKPI
          icono={TrendingUp}
          titulo="Entregas a tiempo (OTD)"
          kpi={kpis.otd}
          ayuda="Requiere que el pedido tenga hora estimada comprometida y recibo de entrega."
        />
        <TarjetaKPI
          icono={Clock}
          titulo="Tiempo promedio de entrega"
          kpi={kpis.tiempoPromedio}
          ayuda="Desde la salida del almacén hasta la firma del cliente."
        />
        <TarjetaKPI
          icono={Route}
          titulo="Cumplimiento de ruta"
          kpi={kpis.cumplimientoRuta}
          ayuda="Paradas planificadas que terminaron entregadas."
        />
        <TarjetaKPI
          icono={AlertTriangle}
          titulo="Incidencias por 100 entregas"
          kpi={kpis.incidencias}
          menosEsMejor
          ayuda="Suma incidencias en ruta y no conformidades de entrega."
        />
        <TarjetaKPI
          icono={Smile}
          titulo="Nivel de servicio (NPS)"
          kpi={kpis.nps}
          ayuda="Promotores (9-10) menos detractores (1-6) de las calificaciones del portal."
        />
      </div>

      <div className="mt-6 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            Cada tarjeta indica sobre cuántos casos se calcula. Un porcentaje sobre pocos
            casos no es representativo: se muestra igual para no ocultar información.
          </p>
          <p>
            <strong>OTD</strong> y <strong>tiempo promedio</strong> sólo pueden calcularse desde que se
            registran la salida del almacén y la hora estimada de llegada, así que al principio
            aparecerán sin datos suficientes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TabKPIs;
