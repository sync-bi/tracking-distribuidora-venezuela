// src/hooks/useCamiones.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { camionesIniciales } from '../data/mockData';
import { simularMovimientoCamion } from '../utils/calculos';
import { ESTADOS_CAMION, CONFIGURACION } from '../utils/constants';
import {
  isFirestoreAvailable,
  escucharCamiones as escucharCamionesFS,
  actualizarCamion as actualizarCamionFS,
  inicializarCamiones
} from '../services/firestoreService';

export const useCamiones = () => {
  const { user } = useAuth();
  const [camiones, setCamiones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Inicializar camiones desde Firestore
  useEffect(() => {
    let unsubscribe = null;

    const inicializar = async () => {
      if (isFirestoreAvailable()) {
        console.log('📡 Conectando camiones con Firestore...');

        unsubscribe = escucharCamionesFS((camionesActualizados) => {
          if (camionesActualizados.length > 0) {
            console.log(`✅ Camiones sincronizados: ${camionesActualizados.length}`);
            setCamiones(camionesActualizados);
          } else {
            // Si no hay camiones en Firestore, inicializarlos desde mock
            console.log('📤 Inicializando camiones en Firestore...');
            inicializarCamiones(camionesIniciales).then(() => {
              console.log('✅ Camiones inicializados');
            }).catch(err => {
              console.error('❌ Error al inicializar camiones:', err);
              setCamiones(camionesIniciales);
            });
          }
          setCargando(false);
        });
      } else {
        console.warn('⚠️ Firestore no disponible para camiones, usando modo local');
        setCamiones(camionesIniciales);
        setCargando(false);
      }
    };

    inicializar();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Simular movimiento de camiones en tiempo real (solo modo local sin Firestore)
  useEffect(() => {
    if (isFirestoreAvailable()) return; // En Firestore, la posición se actualiza desde el conductor

    const interval = setInterval(() => {
      setCamiones(prev => prev.map(camion => {
        if (camion.estado === ESTADOS_CAMION.EN_RUTA && !camion.trackingActivo) {
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

  // Helper para actualizar en Firestore
  const actualizarEnFirestore = useCallback(async (camionId, datos) => {
    if (isFirestoreAvailable()) {
      try {
        await actualizarCamionFS(camionId, datos);
      } catch (error) {
        console.error('❌ Error al actualizar camión en Firestore:', error);
      }
    }
  }, []);

  // Asignar pedido a camión
  const asignarPedidoACamion = useCallback((camionId, pedidoId) => {
    setCamiones(prev => prev.map(camion => {
      if (camion.id === camionId) {
        const nuevosAsignados = [...(camion.pedidosAsignados || []), pedidoId];
        actualizarEnFirestore(camionId, { pedidosAsignados: nuevosAsignados });
        return { ...camion, pedidosAsignados: nuevosAsignados };
      }
      return camion;
    }));
  }, [actualizarEnFirestore]);

  // Remover pedido de camión
  const removerPedidoDeCamion = useCallback((camionId, pedidoId) => {
    setCamiones(prev => prev.map(camion => {
      if (camion.id === camionId) {
        const nuevosAsignados = (camion.pedidosAsignados || []).filter(id => id !== pedidoId);
        const nuevoEstado = nuevosAsignados.length === 0 ? ESTADOS_CAMION.DISPONIBLE : camion.estado;
        actualizarEnFirestore(camionId, { pedidosAsignados: nuevosAsignados, estado: nuevoEstado });
        return { ...camion, pedidosAsignados: nuevosAsignados, estado: nuevoEstado };
      }
      return camion;
    }));
  }, [actualizarEnFirestore]);

  // Actualizar estado de camión
  const actualizarEstadoCamion = useCallback((camionId, nuevoEstado) => {
    setCamiones(prev => prev.map(camion =>
      camion.id === camionId
        ? { ...camion, estado: nuevoEstado }
        : camion
    ));
    actualizarEnFirestore(camionId, { estado: nuevoEstado });
  }, [actualizarEnFirestore]);

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
    // No persistimos ubicación en cada cambio para evitar demasiadas escrituras
    // La ubicación se persiste desde firebase.js (Realtime DB) en el tracking del conductor
  }, []);

  // Actualizar información del vehículo
  const actualizarInfoVehiculo = useCallback((camionId, info) => {
    setCamiones(prev => prev.map(camion =>
      camion.id === camionId
        ? { ...camion, ...info }
        : camion
    ));
    // Persistir solo campos relevantes (no trackingActivo temporal)
    const { trackingActivo, ...infoParaFS } = info;
    if (Object.keys(infoParaFS).length > 0) {
      actualizarEnFirestore(camionId, infoParaFS);
    }
  }, [actualizarEnFirestore]);

  // Obtener camiones disponibles (incluye DISPONIBLE y ASIGNADO)
  const obtenerCamionesDisponibles = useCallback(() => {
    return camiones.filter(camion =>
      camion.estado === ESTADOS_CAMION.DISPONIBLE ||
      camion.estado === ESTADOS_CAMION.ASIGNADO
    );
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
      (camion.conductor || '').toLowerCase().includes(termino.toLowerCase()) ||
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
    cargando,
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
