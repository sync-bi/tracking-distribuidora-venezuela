// src/hooks/useDespachos.js
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  isFirestoreAvailable,
  escucharDespachos as escucharDespachosFS,
  crearDespacho as crearDespachoFS,
  actualizarDespacho as actualizarDespachoFS,
  escucharConductores as escucharConductoresFS,
  inicializarConductores
} from '../services/firestoreService';
import { conductoresIniciales } from '../data/mockDataConductores';

export const useDespachos = () => {
  const { user } = useAuth();
  const [conductores, setConductores] = useState([]);
  const [despachos, setDespachos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Inicializar despachos y conductores desde Firestore
  useEffect(() => {
    let unsubDespachos = null;
    let unsubConductores = null;

    const inicializar = async () => {
      if (isFirestoreAvailable()) {
        console.log('📡 Conectando despachos y conductores con Firestore...');

        // Escuchar despachos en tiempo real
        unsubDespachos = escucharDespachosFS((despachosActualizados) => {
          console.log(`✅ Despachos sincronizados: ${despachosActualizados.length}`);
          setDespachos(despachosActualizados);
          setCargando(false);
        });

        // Escuchar conductores en tiempo real
        unsubConductores = escucharConductoresFS((conductoresActualizados) => {
          if (conductoresActualizados.length > 0) {
            console.log(`✅ Conductores sincronizados: ${conductoresActualizados.length}`);
            setConductores(conductoresActualizados);
          } else {
            // Si no hay conductores en Firestore, inicializarlos desde mock
            console.log('📤 Inicializando conductores en Firestore...');
            inicializarConductores(conductoresIniciales).then(() => {
              console.log('✅ Conductores inicializados');
            }).catch(err => {
              console.error('❌ Error al inicializar conductores:', err);
              setConductores(conductoresIniciales);
            });
          }
        });
      } else {
        console.warn('⚠️ Firestore no disponible para despachos, usando modo local');
        setConductores(conductoresIniciales);
        setCargando(false);
      }
    };

    inicializar();

    return () => {
      if (unsubDespachos) unsubDespachos();
      if (unsubConductores) unsubConductores();
    };
  }, []);

  // Asignar conductor a camión
  const asignarConductor = useCallback((camionId, conductorId) => {
    // Actualización local optimista (Firestore lo maneja en crearDespacho)
    setConductores(prev => prev.map(conductor =>
      conductor.id === conductorId
        ? { ...conductor, estado: 'Asignado', camionAsignado: camionId }
        : conductor
    ));
  }, []);

  // Crear nuevo despacho
  const crearDespacho = useCallback(async (datosDespacho) => {
    try {
      const userId = user?.uid || user?.email || 'sistema';

      if (isFirestoreAvailable()) {
        const nuevoDespacho = await crearDespachoFS({
          ...datosDespacho,
          pedidosIds: datosDespacho.pedidosSeleccionados || []
        }, userId);

        if (datosDespacho.conductorId) {
          asignarConductor(datosDespacho.camionId, datosDespacho.conductorId);
        }

        return nuevoDespacho;
      } else {
        // Modo local (fallback)
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
      }
    } catch (error) {
      console.error('❌ Error al crear despacho:', error);
      throw error;
    }
  }, [user, asignarConductor]);

  // Actualizar despacho
  const actualizarDespacho = useCallback(async (despachoId, actualizacion) => {
    try {
      const userId = user?.uid || user?.email || 'sistema';

      if (isFirestoreAvailable()) {
        await actualizarDespachoFS(despachoId, actualizacion, userId);
      } else {
        setDespachos(prev => prev.map(despacho =>
          despacho.id === despachoId
            ? { ...despacho, ...actualizacion }
            : despacho
        ));
      }
    } catch (error) {
      console.error('❌ Error al actualizar despacho:', error);
      throw error;
    }
  }, [user]);

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
    cargando,
    asignarConductor,
    crearDespacho,
    actualizarDespacho,
    modificarRuta,
    obtenerConductoresDisponibles,
    estadisticas: estadisticasDespachos()
  };
};
