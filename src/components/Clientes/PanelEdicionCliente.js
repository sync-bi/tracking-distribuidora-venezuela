// src/components/Clientes/PanelEdicionCliente.js
import React, { useState, useCallback } from 'react';
import { Edit2, Save, X, MapPin, Cloud, CloudOff } from 'lucide-react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MiniMapa = ({ lat, lng, onDragEnd, onMapClick }) => {
  const [viewState, setViewState] = useState({
    latitude: lat || 10.4806,
    longitude: lng || -66.9036,
    zoom: (lat && lng && lat !== 0 && lng !== 0) ? 15 : 7
  });

  const handleMapClick = useCallback((event) => {
    const { lngLat } = event;
    onMapClick?.(lngLat.lat, lngLat.lng);
  }, [onMapClick]);

  const handleDragEnd = useCallback((event) => {
    const { lngLat } = event;
    onDragEnd?.(lngLat.lat, lngLat.lng);
  }, [onDragEnd]);

  return (
    <div className="h-48 rounded-lg overflow-hidden border">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
      >
        {lat && lng && lat !== 0 && lng !== 0 && (
          <Marker
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            draggable
            onDragEnd={handleDragEnd}
          >
            <div className="w-6 h-6 bg-yellow-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
              <MapPin size={14} className="text-white" />
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
};

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
    clienteSeleccionado?.coordenadas?.lat !== 0 &&
    clienteSeleccionado?.coordenadas?.lng !== 0;

  const handleMapUpdate = useCallback((lat, lng) => {
    setFormulario(prev => ({ ...prev, lat, lng }));
  }, [setFormulario]);

  return (
    <>
    {/* Backdrop móvil */}
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onCancelarEdicion} />
    <div className="fixed inset-x-0 bottom-0 z-50 md:relative md:inset-auto md:z-auto md:w-80 bg-white rounded-t-2xl md:rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[85vh] md:max-h-none">
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

        {/* Mini mapa para arrastrar marcador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación en mapa
          </label>
          <MiniMapa
            lat={formulario.lat}
            lng={formulario.lng}
            onDragEnd={handleMapUpdate}
            onMapClick={handleMapUpdate}
          />
          <p className="text-xs text-gray-500 mt-1">
            Toca el mapa o arrastra el marcador para ajustar la ubicación
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
    </>
  );
};

export default PanelEdicionCliente;
