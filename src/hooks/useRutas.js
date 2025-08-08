// src/hooks/useRutas.js
import { useState, useCallback } from 'react';
import { optimizarRuta } from '../utils/calculos';

export const useRutas = () => {
  const [rutas, setRutas] = useState({});

  // Optimizar ruta para un camión específico
  const optimizarRutaCamion = useCallback((camion, pedidos) => {
    const rutaOptimizada = optimizarRuta(camion, pedidos);
    
    setRutas(prev => ({
      ...prev,
      [camion.id]: rutaOptimizada
    }));

    return rutaOptimizada;
  }, []);

  // Obtener ruta de un camión
  const obtenerRutaCamion = useCallback((camionId) => {
    return rutas[camionId] || [];
  }, [rutas]);

  // Limpiar ruta de un camión
  const limpiarRutaCamion = useCallback((camionId) => {
    setRutas(prev => {
      const nuevasRutas = { ...prev };
      delete nuevasRutas[camionId];
      return nuevasRutas;
    });
  }, []);

  // Actualizar progreso de ruta
  const actualizarProgresoRuta = useCallback((camionId, pedidoCompletadoId) => {
    setRutas(prev => ({
      ...prev,
      [camionId]: prev[camionId]?.map(parada => 
        parada.id === pedidoCompletadoId 
          ? { ...parada, completado: true }
          : parada
      ) || []
    }));
  }, []);

  // Recalcular todas las rutas
  const recalcularTodasLasRutas = useCallback((camiones, pedidos) => {
    const nuevasRutas = {};
    
    camiones.forEach(camion => {
      if (camion.pedidosAsignados.length > 0) {
        nuevasRutas[camion.id] = optimizarRuta(camion, pedidos);
      }
    });

    setRutas(nuevasRutas);
    return nuevasRutas;
  }, []);

  // Obtener estadísticas de rutas
  const estadisticasRutas = useCallback(() => {
    const rutasActivas = Object.keys(rutas).length;
    let totalParadas = 0;
    let totalDistancia = 0;
    let tiempoTotalEstimado = 0;

    Object.values(rutas).forEach(ruta => {
      totalParadas += ruta.length;
      ruta.forEach(parada => {
        totalDistancia += parada.distancia || 0;
        tiempoTotalEstimado += parada.tiempoEstimado || 0;
      });
    });

    return {
      rutasActivas,
      totalParadas,
      totalDistancia: Math.round(totalDistancia * 100) / 100,
      tiempoTotalEstimado: Math.round(tiempoTotalEstimado)
    };
  }, [rutas]);

  return {
    rutas,
    optimizarRutaCamion,
    obtenerRutaCamion,
    limpiarRutaCamion,
    actualizarProgresoRuta,
    recalcularTodasLasRutas,
    estadisticasRutas: estadisticasRutas()
  };
};