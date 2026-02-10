// src/components/Clientes/ModalHistorial.js
import React from 'react';
import { History, X } from 'lucide-react';

const ModalHistorial = ({ historialCambios, onCerrar }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <History size={24} />
            Historial de Cambios
          </h3>
          <button
            onClick={onCerrar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {historialCambios.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <History size={48} className="mx-auto mb-4" />
              <p>No hay cambios registrados aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historialCambios.map((cambio, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{cambio.cliente}</h4>
                      <p className="text-xs text-gray-500">
                        Código: {cambio.codigoCliente}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(cambio.fecha).toLocaleString('es-VE')}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {cambio.metodo}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600">
                      <strong>Nueva ubicación:</strong> {cambio.ubicacionNueva.lat.toFixed(6)}, {cambio.ubicacionNueva.lng.toFixed(6)}
                    </p>
                    {cambio.razon && (
                      <p className="text-gray-600">
                        <strong>Razón:</strong> {cambio.razon}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalHistorial;
