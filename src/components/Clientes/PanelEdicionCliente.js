// src/components/Clientes/PanelEdicionCliente.js
import React from 'react';
import { Edit2, Save, X, MapPin, Cloud, CloudOff } from 'lucide-react';

const PanelEdicionCliente = ({
  clienteSeleccionado,
  formulario,
  setFormulario,
  onGuardarCambios,
  onCancelarEdicion,
  guardando,
  firestoreActivo
}) => {
  const tieneUbicacionOriginal = clienteSeleccionado?.coordenadas?.lat &&
    clienteSeleccionado?.coordenadas?.lng &&
    clienteSeleccionado.coordenadas.lat !== 0 &&
    clienteSeleccionado.coordenadas.lng !== 0;

  return (
    <div className="hidden md:flex md:w-80 bg-white rounded-lg shadow-lg overflow-hidden flex-col">
      {/* Header */}
      <div className={`p-3 md:p-4 text-white ${tieneUbicacionOriginal ? 'bg-yellow-500' : 'bg-orange-500'}`}>
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
            {tieneUbicacionOriginal ? <Edit2 size={18} /> : <MapPin size={18} />}
            {tieneUbicacionOriginal ? 'Corregir Ubicación' : 'Agregar Ubicación'}
          </h3>
          <button
            onClick={onCancelarEdicion}
            className={`p-1 rounded transition-colors ${tieneUbicacionOriginal ? 'hover:bg-yellow-600' : 'hover:bg-orange-600'}`}
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-xs md:text-sm opacity-90 truncate">
          {clienteSeleccionado.nombre}
        </p>
      </div>

      {/* Formulario */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Información del cliente */}
        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <p className="font-semibold text-blue-900 mb-2">Información del Cliente</p>
          <div className="space-y-1 text-blue-700">
            <p>Ciudad: {clienteSeleccionado.ciudad || 'Sin ciudad'}</p>
            <p>Código: {clienteSeleccionado.codigoCliente || 'N/A'}</p>
            {clienteSeleccionado.vendedorAsignado && clienteSeleccionado.vendedorAsignado !== 'Sin asignar' && (
              <p>Vendedor: {clienteSeleccionado.vendedorAsignado}</p>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            value={formulario.direccion}
            onChange={(e) => setFormulario(prev => ({ ...prev, direccion: e.target.value }))}
            placeholder="Dirección completa del cliente"
          />
        </div>

        {/* Ciudad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formulario.ciudad}
            onChange={(e) => setFormulario(prev => ({ ...prev, ciudad: e.target.value }))}
            placeholder="Ciudad"
          />
        </div>

        {/* Coordenadas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitud
            </label>
            <input
              type="number"
              step="0.000001"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={formulario.lat}
              onChange={(e) => setFormulario(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitud
            </label>
            <input
              type="number"
              step="0.000001"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={formulario.lng}
              onChange={(e) => setFormulario(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {/* Instrucciones */}
        <div className={`border rounded-lg p-3 ${tieneUbicacionOriginal ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-sm ${tieneUbicacionOriginal ? 'text-blue-800' : 'text-orange-800'}`}>
            {tieneUbicacionOriginal
              ? 'Arrastra el marcador amarillo en el mapa o haz click en la ubicación correcta.'
              : 'Este cliente no tiene ubicación. Haz click en el mapa donde se encuentra el cliente o arrastra el marcador amarillo.'
            }
          </p>
        </div>

        {/* Indicador de almacenamiento */}
        <div className={`flex items-center gap-2 text-xs p-2 rounded ${firestoreActivo ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
          {firestoreActivo ? (
            <>
              <Cloud size={14} />
              <span>Los cambios se guardarán en la nube</span>
            </>
          ) : (
            <>
              <CloudOff size={14} />
              <span>Los cambios se guardarán solo en memoria (se perderán al recargar)</span>
            </>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="p-3 md:p-4 border-t bg-gray-50 space-y-2">
        <button
          onClick={onGuardarCambios}
          disabled={guardando}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm md:text-base disabled:opacity-50"
        >
          <Save size={18} />
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        <button
          onClick={onCancelarEdicion}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
        >
          <X size={16} />
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PanelEdicionCliente;
