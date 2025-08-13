// src/hooks/useDespachos.js
import { useState, useCallback } from 'react';
import { conductoresIniciales } from '../data/mockDataConductores';

export const useDespachos = () => {
  const [conductores, setConductores] = useState(conductoresIniciales);
  const [despachos, setDespachos] = useState([]);

  // Asignar conductor a camión
  const asignarConductor = useCallback((camionId, conductorId) => {
    setConductores(prev => prev.map(conductor => 
      conductor.id === conductorId 
        ? { ...conductor, estado: 'Asignado', camionAsignado: camionId }
        : conductor
    ));
  }, []);

  // Crear nuevo despacho
  const crearDespacho = useCallback((datosDespacho) => {
    const nuevoDespacho = {
      id: `DESP${Date.now()}`,
      ...datosDespacho,
      fechaCreacion: new Date().toISOString(),
      estado: 'Planificado',
      progreso: 0
    };

    setDespachos(prev => [...prev, nuevoDespacho]);

    if (datosDespacho.conductorId) {
      asignarConductor(datosDespacho.camionId, datosDespacho.conductorId);
    }

    return nuevoDespacho;
  }, [asignarConductor]);

  // Actualizar despacho
  const actualizarDespacho = useCallback((despachoId, actualizacion) => {
    setDespachos(prev => prev.map(despacho => 
      despacho.id === despachoId 
        ? { ...despacho, ...actualizacion }
        : despacho
    ));
  }, []);

  // Modificar ruta de despacho
  const modificarRuta = useCallback((camionId, nuevaRuta) => {
    return nuevaRuta;
  }, []);

  // Obtener conductores disponibles
  const obtenerConductoresDisponibles = useCallback(() => {
    return conductores.filter(conductor => conductor.estado === 'Disponible');
  }, [conductores]);

  // Estadísticas de despachos
  const estadisticasDespachos = useCallback(() => {
    const totalDespachos = despachos.length;
    const enRuta = despachos.filter(d => d.estado === 'En Ruta').length;
    const enPreparacion = despachos.filter(d => d.estado === 'En Preparación').length;
    const completados = despachos.filter(d => d.estado === 'Completado').length;
    const conductoresLibres = conductores.filter(c => c.estado === 'Disponible').length;
    const rutasOptimizadas = despachos.filter(d => d.ruta && d.ruta.length > 0).length;

    return {
      totalDespachos,
      enRuta,
      enPreparacion,
      completados,
      conductoresLibres,
      rutasOptimizadas
    };
  }, [despachos, conductores]);

  return {
    conductores,
    despachos,
    asignarConductor,
    crearDespacho,
    actualizarDespacho,
    modificarRuta,
    obtenerConductoresDisponibles,
    estadisticas: estadisticasDespachos()
  };
};