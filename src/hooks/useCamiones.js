// src/hooks/useCamiones.js
import { useState, useEffect, useCallback } from 'react';
import { camionesIniciales } from '../data/mockData';
import { simularMovimientoCamion } from '../utils/calculos';
import { ESTADOS_CAMION, CONFIGURACION } from '../utils/constants';

export const useCamiones = () => {
  const [camiones, setCamiones] = useState(camionesIniciales);

  // Simular movimiento de camiones en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setCamiones(prev => prev.map(camion => {
        if (camion.estado === ESTADOS_CAMION.EN_RUTA) {
          return {
            ...camion,
            ubicacionActual: simularMovimientoCamion(
              camion.ubicacionActual, 
              CONFIGURACION.DELTA_MOVIMIENTO_SIMULADO
            )
          };
        }
        return camion;
      }));
    }, CONFIGURACION.INTERVALO_ACTUALIZACION_MS);

    return () => clearInterval(interval);
  }, []);

  // Asignar pedido a camión
  const asignarPedidoACamion = useCallback((camionId, pedidoId) => {
    setCamiones(prev => prev.map(camion => 
      camion.id === camionId
        ? { 
            ...camion, 
            pedidosAsignados: [...camion.pedidosAsignados, pedidoId],
            estado: ESTADOS_CAMION.ASIGNADO
          }
        : camion
    ));
  }, []);

  // Remover pedido de camión
  const removerPedidoDeCamion = useCallback((camionId, pedidoId) => {
    setCamiones(prev => prev.map(camion => 
      camion.id === camionId
        ? { 
            ...camion, 
            pedidosAsignados: camion.pedidosAsignados.filter(id => id !== pedidoId),
            estado: camion.pedidosAsignados.length === 1 ? ESTADOS_CAMION.DISPONIBLE : camion.estado
          }
        : camion
    ));
  }, []);

  // Actualizar estado de camión
  const actualizarEstadoCamion = useCallback((camionId, nuevoEstado) => {
    setCamiones(prev => prev.map(camion => 
      camion.id === camionId 
        ? { ...camion, estado: nuevoEstado }
        : camion
    ));
  }, []);

  // Actualizar ubicación de camión
  const actualizarUbicacionCamion = useCallback((camionId, nuevaUbicacion, direccion = null) => {
    setCamiones(prev => prev.map(camion => 
      camion.id === camionId 
        ? { 
            ...camion, 
            ubicacionActual: nuevaUbicacion,
            ...(direccion && { direccionActual: direccion })
          }
        : camion
    ));
  }, []);

  // Actualizar información del vehículo
  const actualizarInfoVehiculo = useCallback((camionId, info) => {
    setCamiones(prev => prev.map(camion => 
      camion.id === camionId 
        ? { ...camion, ...info }
        : camion
    ));
  }, []);

  // Obtener camiones disponibles
  const obtenerCamionesDisponibles = useCallback(() => {
    return camiones.filter(camion => camion.estado === ESTADOS_CAMION.DISPONIBLE);
  }, [camiones]);

  // Obtener camiones por estado
  const obtenerCamionesPorEstado = useCallback((estado) => {
    return camiones.filter(camion => camion.estado === estado);
  }, [camiones]);

  // Obtener camión por ID
  const obtenerCamionPorId = useCallback((camionId) => {
    return camiones.find(camion => camion.id === camionId);
  }, [camiones]);

  // Buscar camiones
  const buscarCamiones = useCallback((termino) => {
    if (!termino) return camiones;
    
    return camiones.filter(camion => 
      camion.conductor.toLowerCase().includes(termino.toLowerCase()) ||
      camion.id.toLowerCase().includes(termino.toLowerCase()) ||
      camion.placa.toLowerCase().includes(termino.toLowerCase())
    );
  }, [camiones]);

  // Estadísticas de camiones
  const estadisticas = useCallback(() => {
    const total = camiones.length;
    const disponibles = camiones.filter(c => c.estado === ESTADOS_CAMION.DISPONIBLE).length;
    const enRuta = camiones.filter(c => c.estado === ESTADOS_CAMION.EN_RUTA).length;
    const asignados = camiones.filter(c => c.estado === ESTADOS_CAMION.ASIGNADO).length;
    const mantenimiento = camiones.filter(c => c.estado === ESTADOS_CAMION.MANTENIMIENTO).length;

    return {
      total,
      disponibles,
      asignados,
      enRuta,
      mantenimiento,
      porcentajeDisponibles: total > 0 ? Math.round((disponibles / total) * 100) : 0
    };
  }, [camiones]);

  return {
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
    estadisticas: estadisticas()
  };
};