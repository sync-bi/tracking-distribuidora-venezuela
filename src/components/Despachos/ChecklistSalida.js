// src/components/Despachos/ChecklistSalida.js
// Paso 1.1 del proceso: confirmación de salida del despacho.
// Es la compuerta entre "despacho armado" y "vehículo en ruta".

import React, { useState } from 'react';
import { ClipboardCheck, X, Truck, AlertTriangle, Loader2 } from 'lucide-react';
import { CHECKLIST_SALIDA } from '../../utils/constants';

const ChecklistSalida = ({ despacho, camion, conductor, onConfirmar, onCancelar }) => {
  const [marcados, setMarcados] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const todosMarcados = CHECKLIST_SALIDA.every(item => marcados[item.id]);
  const faltantes = CHECKLIST_SALIDA.filter(item => !marcados[item.id]);

  const toggle = (id) => setMarcados(prev => ({ ...prev, [id]: !prev[id] }));

  const handleConfirmar = async () => {
    if (!todosMarcados || guardando) return;

    setGuardando(true);
    try {
      await onConfirmar({
        items: CHECKLIST_SALIDA.map(item => ({ id: item.id, label: item.label, conforme: true })),
        observaciones,
        kilometrajeSalida: kilometraje ? Number(kilometraje) : null,
        camionId: camion?.id || despacho?.camionId || null,
        placa: camion?.placa || null,
        conductorNombre: conductor?.nombre || despacho?.conductorNombre || null
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ClipboardCheck size={22} />
              Confirmar salida del almacén
            </h3>
            <button onClick={onCancelar} className="p-1 hover:bg-blue-800 rounded" disabled={guardando}>
              <X size={20} />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            Verifique antes de autorizar la salida del vehículo.
          </p>
        </div>

        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm">
            <Truck size={18} className="text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-blue-900 truncate">
                {camion?.placa || despacho?.camionId || 'Vehículo'}
              </p>
              <p className="text-blue-700 text-xs truncate">
                {conductor?.nombre || despacho?.conductorNombre || 'Conductor sin asignar'}
                {' · '}
                {(despacho?.ruta?.length || 0)} parada(s)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {CHECKLIST_SALIDA.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                  marcados[item.id]
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  marcados[item.id] ? 'border-green-600 bg-green-600' : 'border-gray-300'
                }`}>
                  {marcados[item.id] && <span className="text-white text-xs leading-none">✓</span>}
                </span>
                <span className={`text-sm ${marcados[item.id] ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kilometraje de salida (opcional)
            </label>
            <input
              type="number"
              value={kilometraje}
              onChange={(e) => setKilometraje(e.target.value)}
              placeholder="Ej: 145320"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="2"
              placeholder="Novedades al momento de la salida..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!todosMarcados && (
            <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>Falta confirmar: {faltantes.map(f => f.label).join(', ')}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 space-y-2">
          <button
            onClick={handleConfirmar}
            disabled={!todosMarcados || guardando}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-300 disabled:text-gray-500"
          >
            {guardando ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
            {guardando ? 'Registrando salida...' : 'Autorizar salida'}
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

export default ChecklistSalida;
