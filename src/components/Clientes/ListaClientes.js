// src/components/Clientes/ListaClientes.js
import React from 'react';
import {
  Search,
  Users,
  Edit2,
  MapPin,
  Building2,
  RotateCcw,
  Download,
  RefreshCw,
  History,
  Map as MapIcon,
  Globe,
  Compass,
  Cloud,
  CloudOff,
  AlertTriangle
} from 'lucide-react';

const ListaClientes = ({
  clientesFiltrados,
  estadisticas,
  busqueda,
  setBusqueda,
  ciudadFiltro,
  setCiudadFiltro,
  vendedorFiltro,
  setVendedorFiltro,
  filtroEstado,
  setFiltroEstado,
  ciudades,
  vendedores,
  estiloMapa,
  setEstiloMapa,
  clienteEditando,
  clienteSeleccionado,
  onIniciarEdicion,
  onZoomCliente,
  onMostrarHistorial,
  mostrarHistorial,
  onRecargar,
  onExportar,
  firestoreActivo,
  guardando,
  vistaMobile,
  setVistaMobile
}) => {
  return (
    <div className="flex w-full md:w-[420px] lg:w-[480px] flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header con estadísticas */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 size={20} />
            Clientes
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <div className="text-center">
              <div className="font-bold text-white">{estadisticas.total}</div>
              <div className="text-blue-200">Total</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-300">{estadisticas.conCoordenadas}</div>
              <div className="text-blue-200">GPS</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-300">{estadisticas.sinCoordenadas}</div>
              <div className="text-blue-200">Sin GPS</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-300">{estadisticas.corregidas}</div>
              <div className="text-blue-200">Corr.</div>
            </div>
          </div>
        </div>
        {/* Barra de progreso */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 bg-blue-400 rounded-full h-1.5">
            <div
              className="bg-green-300 h-1.5 rounded-full transition-all"
              style={{ width: `${estadisticas.porcentajeCompleto}%` }}
            />
          </div>
          <span className="text-xs text-blue-100 font-medium">{estadisticas.porcentajeCompleto}%</span>
        </div>
      </div>

      {/* Filtros compactos */}
      <div className="p-2 space-y-2 border-b bg-gray-50">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar cliente, código, ciudad..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Filtros en grid */}
        <div className="grid grid-cols-2 gap-2">
          <select
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            value={ciudadFiltro}
            onChange={(e) => setCiudadFiltro(e.target.value)}
          >
            <option value="todos">Todas ciudades</option>
            {ciudades.map(ciudad => (
              <option key={ciudad} value={ciudad}>{ciudad}</option>
            ))}
          </select>

          <select
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            value={vendedorFiltro}
            onChange={(e) => setVendedorFiltro(e.target.value)}
          >
            <option value="todos">Todos vendedores</option>
            {vendedores.map(vendedor => (
              <option key={vendedor} value={vendedor}>{vendedor}</option>
            ))}
          </select>

          <select
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white col-span-2"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos estados</option>
            <option value="conCoordenadas">Con GPS ({estadisticas.conCoordenadas})</option>
            <option value="sinCoordenadas">Sin GPS ({estadisticas.sinCoordenadas})</option>
            <option value="corregidas">Corregidas ({estadisticas.corregidas})</option>
            <option value="sinCorregir">Sin corregir</option>
          </select>
        </div>

        {/* Acciones compactas */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRecargar}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            title="Recargar datos"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={onExportar}
            className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
            title="Exportar CSV"
          >
            <Download size={12} />
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300"
            onClick={() => {
              setFiltroEstado('todos');
              setCiudadFiltro('todos');
              setVendedorFiltro('todos');
              setBusqueda('');
            }}
            title="Limpiar filtros"
          >
            <RotateCcw size={12} />
          </button>

          {/* Indicador Firestore */}
          <div className="flex items-center gap-1 px-2 py-1 rounded text-xs" title={firestoreActivo ? 'Cambios se guardan en la nube' : 'Solo memoria local'}>
            {firestoreActivo ? (
              <>
                <Cloud size={12} className={`text-green-600 ${guardando ? 'animate-pulse' : ''}`} />
                <span className="text-green-700 hidden sm:inline">{guardando ? 'Guardando...' : 'Nube'}</span>
              </>
            ) : (
              <>
                <CloudOff size={12} className="text-orange-500" />
                <span className="text-orange-600 hidden sm:inline">Local</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* Estilo de mapa mini */}
          <div className="flex gap-0.5 bg-gray-100 rounded p-0.5">
            <button
              className={`p-1 rounded ${estiloMapa === 'streets' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setEstiloMapa('streets')}
              title="Vista calles"
            >
              <MapIcon size={12} />
            </button>
            <button
              className={`p-1 rounded ${estiloMapa === 'satellite' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setEstiloMapa('satellite')}
              title="Vista satélite"
            >
              <Globe size={12} />
            </button>
            <button
              className={`p-1 rounded ${estiloMapa === 'navigation' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setEstiloMapa('navigation')}
              title="Vista navegación"
            >
              <Compass size={12} />
            </button>
          </div>
        </div>

        {/* Contador y acciones */}
        <div className="flex items-center justify-between text-xs pt-1 border-t">
          <span className="text-gray-600 font-medium">
            {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => onMostrarHistorial(!mostrarHistorial)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            <History size={14} />
            Historial
          </button>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="flex-1 overflow-y-auto">
        {clientesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <Users size={48} className="mb-4" />
            <p className="text-center">
              {busqueda || ciudadFiltro !== 'todos'
                ? 'No se encontraron clientes con los filtros aplicados'
                : 'No hay clientes disponibles'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {clientesFiltrados.map((cliente) => {
              const esEditando = clienteEditando === cliente.id;
              const esSeleccionado = clienteSeleccionado?.id === cliente.id;
              const tieneUbicacion = cliente.coordenadas?.lat && cliente.coordenadas?.lng &&
                cliente.coordenadas.lat !== 0 && cliente.coordenadas.lng !== 0;

              return (
                <div
                  key={cliente.id}
                  className={`p-2.5 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                    esSeleccionado ? 'bg-blue-50 border-l-blue-500' :
                    esEditando ? 'bg-yellow-50 border-l-yellow-500' :
                    !tieneUbicacion ? 'border-l-orange-300 bg-orange-50/30' :
                    'border-l-transparent'
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      onIniciarEdicion(cliente);
                      setVistaMobile('mapa');
                    } else {
                      if (tieneUbicacion) {
                        onZoomCliente(cliente);
                      } else {
                        onIniciarEdicion(cliente);
                      }
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {/* Indicador de ubicación */}
                    <div className="flex-shrink-0">
                      {tieneUbicacion ? (
                        <div className={`w-2.5 h-2.5 rounded-full ${cliente.coordenadas?.corregida ? 'bg-green-500' : 'bg-blue-500'}`} />
                      ) : (
                        <AlertTriangle size={14} className="text-orange-500" />
                      )}
                    </div>

                    {/* Info del cliente */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {cliente.nombre}
                        </h3>
                        {cliente.coordenadas?.corregida && (
                          <span className="px-1 py-0.5 bg-green-100 text-green-700 text-[10px] rounded flex-shrink-0">
                            GPS
                          </span>
                        )}
                        {!tieneUbicacion && (
                          <span className="px-1 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded flex-shrink-0">
                            Sin GPS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        {cliente.codigoCliente && (
                          <span className="font-mono">{cliente.codigoCliente}</span>
                        )}
                        {cliente.ciudad && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="text-blue-600">{cliente.ciudad}</span>
                          </>
                        )}
                        {cliente.vendedorAsignado && cliente.vendedorAsignado !== 'Sin asignar' && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="text-purple-600 truncate max-w-[80px]">{cliente.vendedorAsignado}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Botón editar/agregar ubicación */}
                    {!esEditando && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onIniciarEdicion(cliente);
                        }}
                        className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                          tieneUbicacion
                            ? 'text-blue-600 hover:bg-blue-100'
                            : 'text-orange-600 hover:bg-orange-100'
                        }`}
                        title={tieneUbicacion ? 'Corregir ubicación' : 'Agregar ubicación'}
                      >
                        {tieneUbicacion ? <Edit2 size={16} /> : <MapPin size={16} />}
                      </button>
                    )}
                  </div>

                  {/* Dirección */}
                  {(esSeleccionado || esEditando) && cliente.direccion && (
                    <div className="mt-1.5 pl-5 text-xs text-gray-500 flex items-start gap-1">
                      <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cliente.direccion}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaClientes;
