// src/App.js
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';

// Hooks personalizados
import { usePedidosFirestore } from './hooks/usePedidosFirestore';
import { useCamiones } from './hooks/useCamiones';
import { useRutas } from './hooks/useRutas';
import { useDespachos } from './hooks/useDespachos';

// Componentes de Layout
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';

// Componentes de Pedidos
import TabPedidos from './components/Pedidos/TabPedidos';

// Componentes de Camiones
import TabCamiones from './components/Camiones/TabCamiones';

// Componentes de Despachos
import TabDespachoSimplificado from './components/Despachos/TabDespachoSimplificado';
import TabSeguimientoDespachos from './components/Despachos/TabSeguimientoDespachos';

// Componentes de Mapa
import TabMapa from './components/Mapa/TabMapa';
import Tracker from './components/Conductor/Tracker';
import { trackingClient } from './services/trackingClient';
import { actualizarPosicionVehiculo } from './services/firebase';
import { guardarReciboEntrega } from './services/firestoreService';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Componentes de Ubicaciones
import TabGestionUbicaciones from './components/Ubicaciones/TabGestionUbicaciones';

// Componentes de Clientes
import TabGestionClientes from './components/Clientes/TabGestionClientes';

// Tour Guide
import TourGuide from './components/UI/TourGuide';
import { getTourSteps } from './data/tourSteps';

const App = () => {
  const [activeTab, setActiveTab] = useState('pedidos');
  const { user, loading, logout } = useAuth();

  const PERMISSIONS = useMemo(() => ({
    admin: ['pedidos', 'camiones', 'despachos', 'seguimiento', 'conductor', 'clientes'],
    operador: ['pedidos', 'camiones', 'despachos', 'seguimiento', 'conductor', 'clientes'],
    despachador: ['despachos', 'seguimiento', 'camiones', 'clientes'],
    visor: ['pedidos', 'seguimiento'],
    conductor: ['conductor'],
    vendedor: ['clientes', 'pedidos']
  }), []);

  const allowedTabs = useMemo(() => {
    if (!user) return [];

    // Debug: mostrar rol del usuario
    console.log('👤 Usuario:', user);
    console.log('🎭 Rol detectado:', user.role);
    console.log('📋 Pestañas permitidas:', PERMISSIONS[user.role] || []);

    return PERMISSIONS[user.role] || [];
  }, [user, PERMISSIONS]);

  useEffect(() => {
    if (!user) return;
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] || '');
    }
  }, [user, allowedTabs, activeTab]);

  // Hooks personalizados para manejo de estado
  const {
    pedidos,
    crearPedido,
    actualizarEstadoPedido,
    asignarCamionAPedido,
    eliminarPedido,
    actualizarPedido,
    reemplazarPedidos,
    obtenerPedidosPorEstado,
    obtenerPedidosPorCamion,
    obtenerPedidosPorPrioridad,
    buscarPedidos,
    estadisticas: estadisticasPedidos
  } = usePedidosFirestore();

  const {
    camiones,
    asignarPedidoACamion,
    removerPedidoDeCamion,
    actualizarEstadoCamion,
    actualizarUbicacionCamion,
    actualizarInfoVehiculo,
    obtenerCamionesDisponibles,
    obtenerCamionesPorEstado,
    obtenerCamionPorId,
    buscarCamiones,
    estadisticas: estadisticasCamiones
  } = useCamiones();

  const {
    rutas,
    optimizarRutaCamion,
    obtenerRutaCamion,
    limpiarRutaCamion,
    actualizarProgresoRuta,
    recalcularTodasLasRutas,
    estadisticasRutas
  } = useRutas();

  // Hook de Despachos
  const {
    conductores,
    despachos,
    asignarConductor,
    crearDespacho,
    actualizarDespacho,
    modificarRuta,
    obtenerConductoresDisponibles,
    estadisticas: estadisticasDespachos
  } = useDespachos();

  // Función combinada para asignar camión a pedido
  const handleAsignarCamion = (pedidoId, camionId) => {
    asignarCamionAPedido(pedidoId, camionId);
    asignarPedidoACamion(camionId, pedidoId);
  };

  // Función para optimizar ruta de camión
  const handleOptimizarRuta = (camionId) => {
    const camion = obtenerCamionPorId(camionId);
    if (camion) {
      optimizarRutaCamion(camion, pedidos);
    }
  };

  // Función para crear despacho completo
  const handleCrearDespacho = async (datosDespacho) => {
    try {
      // Convertir IDs de pedidos a objetos completos de pedidos para la ruta
      const rutaPedidos = datosDespacho.pedidosSeleccionados
        .map(pedidoId => pedidos.find(p => p.id === pedidoId))
        .filter(p => p); // Filtrar pedidos que existen

      // Crear despacho con la ruta de pedidos
      const nuevoDespacho = await crearDespacho({
        ...datosDespacho,
        ruta: rutaPedidos
      });

      // Asignar pedidos al camión si se seleccionaron
      if (datosDespacho.pedidosSeleccionados) {
        for (const pedidoId of datosDespacho.pedidosSeleccionados) {
          await asignarCamionAPedido(pedidoId, datosDespacho.camionId);
          asignarPedidoACamion(datosDespacho.camionId, pedidoId);
        }
      }

      // Actualizar estado del camión
      actualizarEstadoCamion(datosDespacho.camionId, 'Asignado');

      console.log('✅ Despacho creado exitosamente:', nuevoDespacho?.id);
      return nuevoDespacho;
    } catch (error) {
      console.error('❌ Error al crear despacho:', error);
      alert('Error al crear el despacho. Por favor intente de nuevo.');
    }
  };

  // Función para modificar orden de ruta
  const handleModificarRuta = (camionId, nuevaRuta) => {
    const rutaModificada = modificarRuta(camionId, nuevaRuta);
    
    // Buscar despacho correspondiente y actualizarlo
    const despachoActual = despachos.find(d => d.camionId === camionId);
    if (despachoActual) {
      actualizarDespacho(despachoActual.id, { ruta: rutaModificada });
    }

    return rutaModificada;
  };

  // Props para cada componente de tab
  const pedidosProps = {
    pedidos,
    camiones: obtenerCamionesDisponibles(),
    onCrearPedido: crearPedido,
    onAsignarCamion: handleAsignarCamion,
    onActualizarEstado: actualizarEstadoPedido,
    onEliminarPedido: eliminarPedido,
    onBuscarPedidos: buscarPedidos,
    estadisticas: estadisticasPedidos,
    onImportarPedidos: (nuevos) => {
      const normalizados = (nuevos || []).map((p, idx) => ({
        ...p,
        id: p.id || `PED${String(idx + 1).padStart(3, '0')}`,
        coordenadas: p.coordenadas && typeof p.coordenadas.lat === 'number' && typeof p.coordenadas.lng === 'number'
          ? p.coordenadas
          : { lat: 10.4806, lng: -66.9036 }
      }));
      reemplazarPedidos(normalizados);
    }
  };

  const camionesProps = {
    camiones,
    pedidos,
    rutas,
    onOptimizarRuta: handleOptimizarRuta,
    onActualizarEstado: actualizarEstadoCamion,
    onActualizarInfo: actualizarInfoVehiculo,
    onBuscarCamiones: buscarCamiones,
    estadisticas: estadisticasCamiones
  };

  // Props para despachos
  const despachosProps = {
    camiones,
    pedidos,
    conductores,
    rutas,
    despachos,
    onAsignarConductor: asignarConductor,
    onCrearDespacho: handleCrearDespacho,
    onModificarRuta: handleModificarRuta,
    onActualizarDespacho: actualizarDespacho,
    estadisticas: estadisticasDespachos
  };

  const mapaProps = {
    camiones,
    pedidos,
    rutas,
    despachos,
    estadisticasPedidos,
    estadisticasCamiones,
    estadisticasRutas,
    estadisticasDespachos,
    onAsignarCamion: handleAsignarCamion,
    onOptimizarRuta: handleOptimizarRuta,
    onLimpiarRuta: limpiarRutaCamion,
    onRecalcularRutas: recalcularTodasLasRutas
  };

  // Props para Conductor (tracking en dispositivo)
  const conductorProps = {
    user,
    camiones,
    pedidos,
    despachos,
    onStartTracking: async (camionId) => {
      actualizarInfoVehiculo(camionId, { trackingActivo: true });
      actualizarEstadoCamion(camionId, 'En Ruta');
      // Cambiar todos los pedidos asignados a este camión a "En Ruta"
      const pedidosDelCamion = pedidos.filter(p => p.camionAsignado === camionId && p.estado === 'Asignado');
      for (const p of pedidosDelCamion) {
        try {
          await actualizarEstadoPedido(p.id, 'En Ruta', 'Conductor inició ruta');
        } catch (e) {
          console.error('Error al actualizar pedido a En Ruta:', e);
        }
      }
    },
    onStopTracking: (camionId) => {
      actualizarInfoVehiculo(camionId, { trackingActivo: false });
    },
    onSendPosition: async (evt) => {
      const { vehiculoId, coord, speedKmh, heading } = evt;

      // Actualizar estado local
      actualizarUbicacionCamion(vehiculoId, { lat: coord.lat, lng: coord.lng });
      if (speedKmh != null) {
        actualizarInfoVehiculo(vehiculoId, { velocidad: `${speedKmh} km/h` });
      }

      // Enviar a Firebase para sincronización en tiempo real
      await actualizarPosicionVehiculo(vehiculoId, {
        lat: coord.lat,
        lng: coord.lng,
        velocidad: speedKmh || 0,
        heading: heading || 0
      });

      // También enviar al backend REST si está configurado
      return trackingClient.sendPosition(evt);
    },
    onGuardarRecibo: async (recibo) => {
      try {
        // Guardar recibo en Firestore
        await guardarReciboEntrega(recibo, user?.uid || user?.email || 'conductor');

        // Actualizar estado del pedido a Entregado
        if (recibo.pedidoId) {
          const nuevoEstado = recibo.conforme ? 'Entregado' : 'Entrega Parcial';
          const observaciones = recibo.conforme
            ? `Entregado conforme. Recibido por: ${recibo.receptor?.nombre || 'N/A'}`
            : `Entrega parcial - ${recibo.itemsProblemas?.length || 0} item(s) con problemas. Recibido por: ${recibo.receptor?.nombre || 'N/A'}`;
          await actualizarEstadoPedido(recibo.pedidoId, nuevoEstado, observaciones);
        }
        // Verificar si todos los pedidos del camión ya fueron entregados
        const pedidoEntregado = pedidos.find(p => p.id === recibo.pedidoId);
        if (pedidoEntregado?.camionAsignado) {
          const camionId = pedidoEntregado.camionAsignado;
          const pedidosDelCamion = pedidos.filter(p =>
            p.camionAsignado === camionId &&
            p.id !== recibo.pedidoId
          );
          const todosEntregados = pedidosDelCamion.every(p =>
            p.estado === 'Entregado' || p.estado === 'Entrega Parcial'
          );
          if (todosEntregados) {
            try {
              // Liberar camión
              await actualizarEstadoCamion(camionId, 'Disponible');
              await actualizarInfoVehiculo(camionId, {
                trackingActivo: false,
                pedidosAsignados: [],
                velocidad: '0 km/h'
              });

              // Liberar conductor y marcar despacho completado
              const despachoActivo = despachos.find(d =>
                d.camionId === camionId && d.estado !== 'Completado'
              );
              if (despachoActivo) {
                await actualizarDespacho(despachoActivo.id, { estado: 'Completado' });
                if (despachoActivo.conductorId) {
                  const db = getFirestore();
                  await updateDoc(doc(db, 'conductores', despachoActivo.conductorId), {
                    estado: 'Disponible',
                    camionAsignado: null,
                    ultimaActualizacion: serverTimestamp()
                  });
                }
              }
              console.log('✅ Camión, conductor y despacho liberados');
            } catch (e) {
              console.error('Error al liberar camión/conductor:', e);
            }
          }
        }

        console.log('✅ Recibo guardado en Firestore:', recibo.pedidoId);
      } catch (err) {
        console.error('❌ Error al guardar recibo:', err);
      }
    }
  };

  // Props para Ubicaciones
  const ubicacionesProps = {
    pedidos,
    onActualizarPedido: actualizarPedido
  };

  // TabGestionClientes ya no necesita props - usa useClientesCSV internamente

  // Renderizar contenido de tab activo
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'pedidos':
        return <TabPedidos {...pedidosProps} />;
      case 'camiones':
        return <TabCamiones {...camionesProps} />;
      case 'despachos':
        return <TabDespachoSimplificado {...despachosProps} />;
      case 'seguimiento':
        return <TabSeguimientoDespachos {...despachosProps} />;
      case 'conductor':
        return <Tracker {...conductorProps} />;
      case 'mapa':
        return <TabMapa {...mapaProps} />;
      case 'ubicaciones':
        return <TabGestionUbicaciones {...ubicacionesProps} />;
      case 'clientes':
        return <TabGestionClientes />;
      default:
        return <TabPedidos {...pedidosProps} />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando…</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Tour Guide */}
      <TourGuide
        steps={getTourSteps(user?.role, activeTab)}
        autoStart={true}
      />

      {/* Header con estadísticas */}
      <Header
        estadisticasPedidos={estadisticasPedidos}
        estadisticasCamiones={estadisticasCamiones}
        estadisticasDespachos={estadisticasDespachos}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allowedTabs={allowedTabs}
        user={user}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="relative">
        {allowedTabs.includes(activeTab) ? (
          renderActiveTab()
        ) : (
          <div className="p-6 text-red-600">No autorizado para ver esta sección.</div>
        )}
      </main>
    </div>
  );
};

export default App;
