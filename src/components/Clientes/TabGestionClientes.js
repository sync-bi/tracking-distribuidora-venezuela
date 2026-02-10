// src/components/Clientes/TabGestionClientes.js
import React, { useState, useMemo, useCallback } from 'react';
import { Loader2, AlertTriangle, RefreshCw, List, Map as MapIcon } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useClientesCSV } from '../../hooks/useClientesCSV';
import ListaClientes from './ListaClientes';
import MapaClientes from './MapaClientes';
import PanelEdicionCliente from './PanelEdicionCliente';
import ModalHistorial from './ModalHistorial';

const TabGestionClientes = () => {
  const {
    clientes,
    ciudades,
    vendedores,
    historialCambios,
    cargando,
    error,
    guardando,
    firestoreActivo,
    actualizarUbicacionCliente,
    obtenerClientesFiltrados,
    estadisticas,
    recargarClientes,
    exportarClientesCSV
  } = useClientesCSV();

  const [viewport, setViewport] = useState({
    latitude: 10.4806,
    longitude: -66.9036,
    zoom: 6
  });

  const [clienteEditando, setClienteEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    direccion: '',
    ciudad: '',
    lat: 0,
    lng: 0
  });
  const [busqueda, setBusqueda] = useState('');
  const [ciudadFiltro, setCiudadFiltro] = useState('todos');
  const [vendedorFiltro, setVendedorFiltro] = useState('todos');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [estiloMapa, setEstiloMapa] = useState('streets');
  const [vistaMobile, setVistaMobile] = useState('lista');

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    let resultado = obtenerClientesFiltrados(ciudadFiltro, vendedorFiltro);

    switch (filtroEstado) {
      case 'conCoordenadas':
        resultado = resultado.filter(c =>
          c.coordenadas && c.coordenadas.lat && c.coordenadas.lng &&
          c.coordenadas.lat !== 0 && c.coordenadas.lng !== 0
        );
        break;
      case 'sinCoordenadas':
        resultado = resultado.filter(c =>
          !c.coordenadas || !c.coordenadas.lat || !c.coordenadas.lng ||
          c.coordenadas.lat === 0 || c.coordenadas.lng === 0
        );
        break;
      case 'corregidas':
        resultado = resultado.filter(c => c.coordenadas?.corregida);
        break;
      case 'sinCorregir':
        resultado = resultado.filter(c => !c.coordenadas?.corregida);
        break;
      default:
        break;
    }

    if (busqueda) {
      const terminoLower = busqueda.toLowerCase();
      resultado = resultado.filter(c =>
        c.nombre?.toLowerCase().includes(terminoLower) ||
        c.codigoCliente?.toLowerCase().includes(terminoLower) ||
        c.direccion?.toLowerCase().includes(terminoLower) ||
        c.ciudad?.toLowerCase().includes(terminoLower) ||
        c.vendedorAsignado?.toLowerCase().includes(terminoLower)
      );
    }

    return resultado;
  }, [clientes, busqueda, ciudadFiltro, vendedorFiltro, filtroEstado, obtenerClientesFiltrados]);

  // Iniciar edición de cliente
  const handleIniciarEdicion = useCallback((cliente) => {
    const tieneUbicacion = cliente.coordenadas?.lat && cliente.coordenadas?.lng &&
      cliente.coordenadas.lat !== 0 && cliente.coordenadas.lng !== 0;

    setClienteEditando(cliente.id);
    setClienteSeleccionado(cliente);
    setFormulario({
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      lat: tieneUbicacion ? cliente.coordenadas.lat : 10.4806,
      lng: tieneUbicacion ? cliente.coordenadas.lng : -66.9036
    });

    // Centrar mapa
    if (tieneUbicacion) {
      setViewport(prev => ({
        ...prev,
        latitude: cliente.coordenadas.lat,
        longitude: cliente.coordenadas.lng,
        zoom: 15
      }));
    } else {
      // Cliente sin ubicación: zoom a Venezuela
      setViewport(prev => ({
        ...prev,
        latitude: 10.4806,
        longitude: -66.9036,
        zoom: 7
      }));
    }
  }, []);

  // Cancelar edición
  const handleCancelarEdicion = useCallback(() => {
    setClienteEditando(null);
    setClienteSeleccionado(null);
    setFormulario({ direccion: '', ciudad: '', lat: 0, lng: 0 });
  }, []);

  // Guardar cambios
  const handleGuardarCambios = useCallback(async () => {
    if (!clienteSeleccionado) return;

    const nuevaUbicacion = {
      direccion: formulario.direccion,
      ciudad: formulario.ciudad,
      lat: formulario.lat,
      lng: formulario.lng,
      corregida: true
    };

    try {
      await actualizarUbicacionCliente(
        clienteSeleccionado.id,
        nuevaUbicacion,
        'manual',
        'Corrección manual de ubicación'
      );
      handleCancelarEdicion();
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  }, [clienteSeleccionado, formulario, actualizarUbicacionCliente, handleCancelarEdicion]);

  // Click en mapa para ubicar
  const handleMapClick = useCallback((event) => {
    if (!clienteEditando) return;
    const { lngLat } = event;
    setFormulario(prev => ({
      ...prev,
      lat: lngLat.lat,
      lng: lngLat.lng
    }));
  }, [clienteEditando]);

  // Drag del marcador
  const handleMarkerDragStart = useCallback(() => {
    setArrastrando(true);
  }, []);

  const handleMarkerDragEnd = useCallback((event) => {
    const { lngLat } = event;
    setFormulario(prev => ({
      ...prev,
      lat: lngLat.lat,
      lng: lngLat.lng
    }));
    setArrastrando(false);
  }, []);

  // Zoom a cliente seleccionado
  const handleZoomCliente = useCallback((cliente) => {
    if (cliente.coordenadas?.lat && cliente.coordenadas?.lng) {
      setViewport({
        latitude: cliente.coordenadas.lat,
        longitude: cliente.coordenadas.lng,
        zoom: 17
      });
      setClienteSeleccionado(cliente);
    }
  }, []);

  // Pantalla de carga
  if (cargando) {
    return (
      <div className="fixed inset-0 top-[168px] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="fixed inset-0 top-[168px] flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar clientes</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={recargarClientes}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-[116px] md:top-[168px] flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-6">
      {/* Toggle vista móvil */}
      <div className="md:hidden flex gap-2 mb-2">
        <button
          onClick={() => setVistaMobile('lista')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
            vistaMobile === 'lista' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <List size={18} />
          Lista ({clientesFiltrados.length})
        </button>
        <button
          onClick={() => setVistaMobile('mapa')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
            vistaMobile === 'mapa' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <MapIcon size={18} />
          Mapa
        </button>
      </div>

      {/* Panel izquierdo - Lista de clientes */}
      <div className={`${vistaMobile === 'lista' ? 'flex' : 'hidden'} md:flex`}>
        <ListaClientes
          clientesFiltrados={clientesFiltrados}
          estadisticas={estadisticas}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          ciudadFiltro={ciudadFiltro}
          setCiudadFiltro={setCiudadFiltro}
          vendedorFiltro={vendedorFiltro}
          setVendedorFiltro={setVendedorFiltro}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          ciudades={ciudades}
          vendedores={vendedores}
          estiloMapa={estiloMapa}
          setEstiloMapa={setEstiloMapa}
          clienteEditando={clienteEditando}
          clienteSeleccionado={clienteSeleccionado}
          onIniciarEdicion={handleIniciarEdicion}
          onZoomCliente={handleZoomCliente}
          onMostrarHistorial={setMostrarHistorial}
          mostrarHistorial={mostrarHistorial}
          onRecargar={recargarClientes}
          onExportar={exportarClientesCSV}
          firestoreActivo={firestoreActivo}
          guardando={guardando}
          vistaMobile={vistaMobile}
          setVistaMobile={setVistaMobile}
        />
      </div>

      {/* Panel central - Mapa */}
      <div className={`${vistaMobile === 'mapa' ? 'flex' : 'hidden'} md:flex flex-1`}>
        <MapaClientes
          viewport={viewport}
          onMove={setViewport}
          estiloMapa={estiloMapa}
          clientesFiltrados={clientesFiltrados}
          clienteEditando={clienteEditando}
          clienteSeleccionado={clienteSeleccionado}
          formulario={formulario}
          arrastrando={arrastrando}
          onZoomCliente={handleZoomCliente}
          onMarkerDragStart={handleMarkerDragStart}
          onMarkerDragEnd={handleMarkerDragEnd}
          onMapClick={handleMapClick}
          onGuardarCambios={handleGuardarCambios}
          onCancelarEdicion={handleCancelarEdicion}
        />
      </div>

      {/* Panel derecho - Edición (solo desktop) */}
      {clienteEditando && clienteSeleccionado && (
        <PanelEdicionCliente
          clienteSeleccionado={clienteSeleccionado}
          formulario={formulario}
          setFormulario={setFormulario}
          onGuardarCambios={handleGuardarCambios}
          onCancelarEdicion={handleCancelarEdicion}
          guardando={guardando}
          firestoreActivo={firestoreActivo}
        />
      )}

      {/* Modal de historial */}
      {mostrarHistorial && (
        <ModalHistorial
          historialCambios={historialCambios}
          onCerrar={() => setMostrarHistorial(false)}
        />
      )}
    </div>
  );
};

export default TabGestionClientes;
