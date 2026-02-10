// src/components/Clientes/MapaClientes.js
import React from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { MapPinned, Save, X } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const MapaClientes = ({
  viewport,
  onMove,
  estiloMapa,
  clientesFiltrados,
  clienteEditando,
  clienteSeleccionado,
  formulario,
  arrastrando,
  onZoomCliente,
  onMarkerDragStart,
  onMarkerDragEnd,
  onMapClick,
  onGuardarCambios,
  onCancelarEdicion
}) => {
  const obtenerEstiloMapa = () => {
    const estilos = {
      streets: 'mapbox://styles/mapbox/streets-v12',
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      navigation: 'mapbox://styles/mapbox/navigation-day-v1'
    };
    return estilos[estiloMapa] || estilos.streets;
  };

  const tieneUbicacionOriginal = clienteSeleccionado?.coordenadas?.lat &&
    clienteSeleccionado?.coordenadas?.lng &&
    clienteSeleccionado.coordenadas.lat !== 0 &&
    clienteSeleccionado.coordenadas.lng !== 0;

  return (
    <div className="flex flex-1 flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header del mapa */}
      <div className="p-2 md:p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm md:text-base">
          <MapPinned size={18} className="text-blue-600" />
          <span className="hidden sm:inline">Mapa de Ubicaciones</span>
          <span className="sm:hidden">Mapa</span>
          {clienteSeleccionado && (
            <span className="text-xs md:text-sm font-normal text-gray-500 ml-2 truncate max-w-[150px] md:max-w-none">
              {clienteEditando ? (
                <span className="text-yellow-600 font-medium">
                  {tieneUbicacionOriginal ? 'Corrigiendo' : 'Ubicando'}: {clienteSeleccionado.nombre}
                </span>
              ) : (
                <>→ {clienteSeleccionado.nombre}</>
              )}
            </span>
          )}
        </h3>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <Map
          {...viewport}
          onMove={evt => onMove(evt.viewState)}
          mapStyle={obtenerEstiloMapa()}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          onClick={clienteEditando ? onMapClick : undefined}
          cursor={clienteEditando ? 'crosshair' : 'grab'}
        >
          <NavigationControl position="top-right" />

          {/* Marcadores de clientes - ocultar cuando se edita en móvil */}
          {!clienteEditando && clientesFiltrados.map((cliente) => {
            if (!cliente.coordenadas?.lat || !cliente.coordenadas?.lng ||
                cliente.coordenadas.lat === 0 || cliente.coordenadas.lng === 0) return null;

            const esSeleccionado = clienteSeleccionado?.id === cliente.id;

            return (
              <Marker
                key={cliente.id}
                latitude={cliente.coordenadas.lat}
                longitude={cliente.coordenadas.lng}
                onClick={() => onZoomCliente(cliente)}
              >
                <div className="relative cursor-pointer">
                  <svg
                    width={esSeleccionado ? 36 : 28}
                    height={esSeleccionado ? 36 : 28}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill={cliente.coordenadas?.corregida ? '#8b5cf6' : '#3b82f6'}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <circle cx="12" cy="9" r="2.5" fill="white" />
                  </svg>
                </div>
              </Marker>
            );
          })}

          {/* Marcador amarillo editable */}
          {clienteEditando && (
            <Marker
              key="marker-editando"
              latitude={formulario.lat}
              longitude={formulario.lng}
              draggable={true}
              onDragStart={onMarkerDragStart}
              onDragEnd={onMarkerDragEnd}
            >
              <div className="relative">
                <div className="cursor-move animate-pulse">
                  <svg
                    width={44}
                    height={44}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill="#eab308"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="9" r="2.5" fill="white" />
                  </svg>
                </div>
                {arrastrando && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Suelta para fijar
                  </div>
                )}
              </div>
            </Marker>
          )}
        </Map>

        {/* Instrucción al editar - banner superior */}
        {clienteEditando && (
          <div className="absolute top-2 left-2 right-14 bg-yellow-500 text-yellow-900 text-xs font-medium px-3 py-1.5 rounded-lg shadow z-10">
            {tieneUbicacionOriginal
              ? 'Arrastra el pin o haz click en el mapa para corregir la ubicación'
              : 'Haz click en el mapa o arrastra el pin para ubicar al cliente'
            }
          </div>
        )}

        {/* Tarjeta flotante del cliente editando - ABAJO del mapa (solo en móvil) */}
        {clienteEditando && clienteSeleccionado && (
          <div className="md:hidden absolute bottom-2 left-2 right-2 bg-yellow-400 rounded-lg shadow-xl p-2 z-20">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-yellow-900 text-sm truncate">
                  {clienteSeleccionado.nombre}
                </div>
                <div className="text-[10px] text-yellow-800">
                  {clienteSeleccionado.codigoCliente} {clienteSeleccionado.ciudad && `| ${clienteSeleccionado.ciudad}`}
                </div>
              </div>
              <div className="flex-shrink-0 text-[10px] text-yellow-800 flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
                {tieneUbicacionOriginal ? 'Arrastra o toca el mapa' : 'Toca el mapa para ubicar'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onGuardarCambios}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-600 text-white rounded font-semibold text-xs"
              >
                <Save size={14} />
                Guardar
              </button>
              <button
                onClick={onCancelarEdicion}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white text-gray-700 rounded font-medium text-xs"
              >
                <X size={14} />
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Leyenda - solo en desktop */}
        {!clienteEditando && (
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs hidden md:block">
            <h4 className="font-semibold mb-2 text-gray-700">Leyenda</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3b82f6" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <span>Ubicación original</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#8b5cf6" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <span>Ubicación corregida</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#eab308" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <span>Editando (arrastra o click)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaClientes;
