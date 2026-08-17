// src/components/Conductor/FormularioIncidencia.js
// Fase 2 del proceso: "¿Se presenta alguna incidencia durante la ruta?"
// El conductor la reporta desde el camino, antes de llegar al cliente.

import React, { useState } from 'react';
import { AlertTriangle, X, Save, Loader2, MapPin } from 'lucide-react';
import { TIPOS_INCIDENCIA_RUTA, ACCIONES_INCIDENCIA } from '../../utils/constants';

const FormularioIncidencia = ({ pedidos = [], camion, onGuardar, onCancelar }) => {
  const [tipo, setTipo] = useState('');
  const [pedidoId, setPedidoId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [accion, setAccion] = useState('continuar');
  const [guardando, setGuardando] = useState(false);

  const tipoSeleccionado = TIPOS_INCIDENCIA_RUTA.find(t => t.id === tipo);
  // Un problema del vehículo afecta a toda la ruta, no a un pedido puntual.
  const afectaTodaLaRuta = tipo === 'averia' || tipo === 'vehiculo';

  const handleGuardar = async () => {
    if (!tipo) {
      alert('Seleccione el tipo de incidencia.');
      return;
    }
    if (!descripcion.trim()) {
      alert('Describa brevemente lo que ocurrió.');
      return;
    }
    if (!afectaTodaLaRuta && !pedidoId) {
      alert('Indique a qué pedido corresponde la incidencia.');
      return;
    }

    setGuardando(true);
    try {
      const pedido = pedidos.find(p => p.id === pedidoId);
      await onGuardar({
        tipo,
        tipoLabel: tipoSeleccionado?.label || tipo,
        gravedad: tipoSeleccionado?.gravedad || 'Moderada',
        pedidoId: afectaTodaLaRuta ? null : pedidoId,
        cliente: pedido?.cliente || null,
        numeroPedido: pedido?.numeroPedido || null,
        camionId: camion?.id || null,
        camionPlaca: camion?.placa || null,
        descripcion: descripcion.trim(),
        accion,
        accionLabel: ACCIONES_INCIDENCIA.find(a => a.id === accion)?.label || accion,
        afectaTodaLaRuta
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={22} />
              Reportar incidencia
            </h3>
            <button onClick={onCancelar} className="p-1 hover:bg-orange-700 rounded" disabled={guardando}>
              <X size={20} />
            </button>
          </div>
          <p className="text-orange-100 text-sm mt-1">
            Se notifica a operaciones de inmediato.
          </p>
        </div>

        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Qué ocurrió? *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_INCIDENCIA_RUTA.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipo(t.id)}
                  className={`p-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                    tipo === t.id
                      ? 'border-orange-500 bg-orange-50 text-orange-800'
                      : 'border-gray-200 text-gray-700 hover:border-orange-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tipo && !afectaTodaLaRuta && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pedido afectado *
              </label>
              <select
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">-- Seleccione el pedido --</option>
                {pedidos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.cliente} ({p.numeroPedido || p.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {afectaTodaLaRuta && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>Esta incidencia afecta toda la ruta, no un pedido en particular.</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows="3"
              placeholder="Explique brevemente lo que pasó..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué va a hacer?
            </label>
            <select
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {ACCIONES_INCIDENCIA.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} />
            Se registrará su ubicación actual junto con el reporte.
          </p>
        </div>

        <div className="p-4 border-t bg-gray-50 space-y-2">
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold disabled:bg-orange-400"
          >
            {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {guardando ? 'Registrando...' : 'Reportar incidencia'}
          </button>
          <button
            onClick={onCancelar}
            disabled={guardando}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormularioIncidencia;
