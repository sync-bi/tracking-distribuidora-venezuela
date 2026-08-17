// src/components/Alertas/PanelAlertas.js
// Alertas automáticas del flujo transversal, para operaciones/logística.

import React, { useState, useEffect, useMemo } from 'react';
import { Bell, BellOff, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { escucharIncidenciasRuta, actualizarIncidenciaRuta } from '../../services/firestoreService';
import { calcularAlertas, estiloSeveridad, SEVERIDADES } from '../../services/alertas';
import { useAuth } from '../../context/AuthContext';

const ETIQUETA_SEVERIDAD = {
  [SEVERIDADES.CRITICA]: 'Crítica',
  [SEVERIDADES.ALTA]: 'Alta',
  [SEVERIDADES.MEDIA]: 'Media'
};

const PanelAlertas = ({ camiones = [], pedidos = [] }) => {
  const { user } = useAuth();
  const [incidencias, setIncidencias] = useState([]);
  const [expandido, setExpandido] = useState(true);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const unsub = escucharIncidenciasRuta(setIncidencias);
    return () => unsub?.();
  }, []);

  // Las alertas dependen del paso del tiempo (parada prolongada, sin señal),
  // así que se reevalúan periódicamente aunque no cambien los datos.
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const alertas = useMemo(
    () => calcularAlertas({ camiones, pedidos, incidencias, ahora }),
    [camiones, pedidos, incidencias, ahora]
  );

  const resolverIncidencia = async (incidenciaId) => {
    if (!window.confirm('¿Marcar esta incidencia como resuelta?')) return;
    try {
      await actualizarIncidenciaRuta(
        incidenciaId,
        { estado: 'Resuelta' },
        user?.email || user?.uid || 'operaciones'
      );
    } catch {
      alert('No se pudo actualizar la incidencia. Intente de nuevo.');
    }
  };

  if (!alertas.length) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BellOff size={16} />
          <span>Sin alertas activas.</span>
        </div>
      </div>
    );
  }

  const criticas = alertas.filter(a => a.severidad === SEVERIDADES.CRITICA).length;

  return (
    <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Bell size={16} className={criticas ? 'text-red-600' : 'text-orange-500'} />
          <h3 className="font-medium">Alertas activas ({alertas.length})</h3>
          {criticas > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
              {criticas} crítica(s)
            </span>
          )}
        </div>
        {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expandido && (
        <div className="border-t divide-y">
          {alertas.map((alerta, i) => (
            <div key={`${alerta.tipo}-${alerta.camionId || alerta.pedidoId || i}`} className="p-3">
              <div className="flex items-start gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${estiloSeveridad(alerta.severidad)}`}>
                  {ETIQUETA_SEVERIDAD[alerta.severidad]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{alerta.titulo}</p>
                  <p className="text-xs text-gray-600">{alerta.detalle}</p>
                </div>
                {alerta.incidenciaId && (
                  <button
                    onClick={() => resolverIncidencia(alerta.incidenciaId)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 border border-green-600 rounded hover:bg-green-50 flex-shrink-0"
                  >
                    <CheckCircle size={12} />
                    Resolver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PanelAlertas;
