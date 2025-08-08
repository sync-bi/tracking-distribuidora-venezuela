// src/App.js
import React, { useState } from 'react';

// Hooks personalizados
import { usePedidos } from './hooks/usePedidos';
import { useCamiones } from './hooks/useCamiones';
import { useRutas } from './hooks/useRutas';

// Componentes de Layout
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';

// Componentes de Pedidos
import TabPedidos from './components/Pedidos/TabPedidos';

// Componentes de Camiones
import TabCamiones from './components/Camiones/TabCamiones';

// Componentes de Mapa
import TabMapa from './components/Mapa/TabMapa';

const App = () => {
  const [activeTab, setActiveTab] = useState('pedidos');

  // Hooks personalizados para manejo de estado
  const {
    pedidos,
    crearPedido,
    actualizarEstadoPedido,
    asignarCamionAPedido,
    eliminarPedido,
    actualizarPedido,
    obtenerPedidosPorEstado,
    obtenerPedidosPorCamion,
    obtenerPedidosPorPrioridad,
    buscarPedidos,
    estadisticas: estadisticasPedidos
  } = usePedidos();

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

  // Props para cada componente de tab
  const pedidosProps = {
    pedidos,
    camiones: obtenerCamionesDisponibles(),
    onCrearPedido: crearPedido,
    onAsignarCamion: handleAsignarCamion,
    onActualizarEstado: actualizarEstadoPedido,
    onEliminarPedido: eliminarPedido,
    onBuscarPedidos: buscarPedidos,
    estadisticas: estadisticasPedidos
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

  const mapaProps = {
    camiones,
    pedidos,
    rutas,
    estadisticasPedidos,
    estadisticasCamiones,
    estadisticasRutas
  };

  // Renderizar contenido de tab activo
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'pedidos':
        return <TabPedidos {...pedidosProps} />;
      case 'camiones':
        return <TabCamiones {...camionesProps} />;
      case 'mapa':
        return <TabMapa {...mapaProps} />;
      default:
        return <TabPedidos {...pedidosProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con estadísticas */}
      <Header 
        estadisticasPedidos={estadisticasPedidos}
        estadisticasCamiones={estadisticasCamiones}
      />

      {/* Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Content */}
      <main className="relative">
        {renderActiveTab()}
      </main>
    </div>
  );
};

export default App;