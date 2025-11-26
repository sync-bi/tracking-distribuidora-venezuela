// src/hooks/usePedidosFirestore.js
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  isFirestoreAvailable,
  escucharPedidos,
  crearPedido as crearPedidoFS,
  actualizarPedido as actualizarPedidoFS,
  actualizarUbicacionPedido as actualizarUbicacionFS,
  actualizarEstadoPedido as actualizarEstadoFS,
  eliminarPedido as eliminarPedidoFS,
  obtenerHistorialUbicaciones
} from '../services/firestoreService';
import { pedidosIniciales } from '../data/mockData';
import { loadPedidosFromPublic } from '../utils/importers';
import { generarCoordenadasVenezuela } from '../utils/calculos';
import { ESTADOS_PEDIDO } from '../utils/constants';

export const usePedidosFirestore = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar pedidos
  useEffect(() => {
    let unsubscribe = null;

    const inicializar = async () => {
      if (isFirestoreAvailable()) {
        // Usar Firestore con sincronización en tiempo real
        console.log('📡 Conectando con Firestore...');

        unsubscribe = escucharPedidos((pedidosActualizados) => {
          console.log(`✅ Pedidos sincronizados: ${pedidosActualizados.length}`);
          setPedidos(pedidosActualizados);
          setCargando(false);
        });
      } else {
        // Fallback: cargar desde public o usar mockData
        console.warn('⚠️ Firestore no disponible, usando modo local');

        const shouldAuto = String(process.env.REACT_APP_AUTOLOAD_PEDIDOS || 'true').toLowerCase() === 'true';

        if (shouldAuto) {
          try {
            const imported = await loadPedidosFromPublic();
            if (imported.length > 0) {
              setPedidos(imported);
            } else {
              setPedidos(pedidosIniciales);
            }
          } catch (err) {
            console.error('Error al cargar pedidos:', err);
            setPedidos(pedidosIniciales);
          }
        } else {
          setPedidos(pedidosIniciales);
        }

        setCargando(false);
      }
    };

    inicializar();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Crear nuevo pedido
  const crearPedido = useCallback(async (datosPedido) => {
    try {
      const userId = user?.uid || user?.email || 'sistema';

      if (isFirestoreAvailable()) {
        // Crear en Firestore
        const nuevoPedido = await crearPedidoFS({
          ...datosPedido,
          coordenadas: datosPedido.coordenadas || generarCoordenadasVenezuela(),
          estado: ESTADOS_PEDIDO.PENDIENTE,
          camionAsignado: null
        }, userId);

        return nuevoPedido;
      } else {
        // Modo local
        const nuevoPedido = {
          ...datosPedido,
          id: `PED${String(pedidos.length + 1).padStart(3, '0')}`,
          coordenadas: datosPedido.coordenadas || generarCoordenadasVenezuela(),
          estado: ESTADOS_PEDIDO.PENDIENTE,
          fechaCreacion: new Date().toISOString(),
          camionAsignado: null
        };

        setPedidos(prev => [...prev, nuevoPedido]);
        return nuevoPedido;
      }
    } catch (error) {
      console.error('Error al crear pedido:', error);
      setError(error.message);
      throw error;
    }
  }, [pedidos.length, user]);

  // Actualizar pedido completo
  const actualizarPedido = useCallback(async (pedidoId, datosActualizados) => {
    try {
      const userId = user?.uid || user?.email || 'sistema';

      if (isFirestoreAvailable()) {
        await actualizarPedidoFS(pedidoId, datosActualizados, userId);
      } else {
        setPedidos(prev => prev.map(pedido =>
          pedido.id === pedidoId
            ? { ...pedido, ...datosActualizados }
            : pedido
        ));
      }
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // Actualizar ubicación de pedido (con historial)
  const actualizarUbicacion = useCallback(async (
    pedidoId,
    nuevaUbicacion,
    metodo = 'manual',
    razon = ''
  ) => {
    try {
      const userId = user?.uid || user?.email || 'sistema';

      if (isFirestoreAvailable()) {
        await actualizarUbicacionFS(
          pedidoId,
          nuevaUbicacion,
          userId,
          metodo,
          razon
        );
      } else {
        // Modo local (sin historial)
        setPedidos(prev => prev.map(pedido =>
          pedido.id === pedidoId
            ? {
                ...pedido,
                coordenadas: {
                  lat: nuevaUbicacion.lat,
                  lng: nuevaUbicacion.lng,
                  corregida: nuevaUbicacion.corregida || false
                },
                ...(nuevaUbicacion.direccion && { direccion: nuevaUbicacion.direccion }),
                ...(nuevaUbicacion.ciudad && { ciudad: nuevaUbicacion.ciudad })
              }
            : pedido
        ));
      }
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // Actualizar estado de pedido (con historial)
  const actualizarEstadoPedido = useCallback(async (
    pedidoId,
    nuevoEstado,
    observaciones = ''
  ) => {
    try {
      const userId = user?.uid || user?.email || 'sistema';

      if (isFirestoreAvailable()) {
        await actualizarEstadoFS(pedidoId, nuevoEstado, userId, observaciones);
      } else {
        setPedidos(prev => prev.map(pedido =>
          pedido.id === pedidoId
            ? { ...pedido, estado: nuevoEstado }
            : pedido
        ));
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // Asignar camión a pedido
  const asignarCamionAPedido = useCallback(async (pedidoId, camionId) => {
    try {
      const userId = user?.uid || user?.email || 'sistema';

      if (isFirestoreAvailable()) {
        await actualizarPedidoFS(pedidoId, {
          camionAsignado: camionId,
          estado: ESTADOS_PEDIDO.ASIGNADO
        }, userId);
      } else {
        setPedidos(prev => prev.map(pedido =>
          pedido.id === pedidoId
            ? {
                ...pedido,
                camionAsignado: camionId,
                estado: ESTADOS_PEDIDO.ASIGNADO
              }
            : pedido
        ));
      }
    } catch (error) {
      console.error('Error al asignar camión:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // Eliminar pedido
  const eliminarPedido = useCallback(async (pedidoId) => {
    try {
      const userId = user?.uid || user?.email || 'sistema';

      if (isFirestoreAvailable()) {
        await eliminarPedidoFS(pedidoId, userId);
      } else {
        setPedidos(prev => prev.filter(pedido => pedido.id !== pedidoId));
      }
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // Reemplazar todos los pedidos (importación masiva)
  const reemplazarPedidos = useCallback(async (nuevosPedidos) => {
    if (!Array.isArray(nuevosPedidos)) return;

    try {
      if (isFirestoreAvailable()) {
        // En Firestore, crear cada pedido individualmente
        const userId = user?.uid || user?.email || 'sistema';

        console.log(`📤 Importando ${nuevosPedidos.length} pedidos a Firestore...`);

        for (const pedido of nuevosPedidos) {
          await crearPedidoFS(pedido, userId);
        }

        console.log('✅ Importación completada');
      } else {
        setPedidos(nuevosPedidos);
      }
    } catch (error) {
      console.error('Error al reemplazar pedidos:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // Obtener pedidos por estado
  const obtenerPedidosPorEstado = useCallback((estado) => {
    return pedidos.filter(pedido => pedido.estado === estado);
  }, [pedidos]);

  // Obtener pedidos por camión
  const obtenerPedidosPorCamion = useCallback((camionId) => {
    return pedidos.filter(pedido => pedido.camionAsignado === camionId);
  }, [pedidos]);

  // Obtener pedidos por prioridad
  const obtenerPedidosPorPrioridad = useCallback((prioridad) => {
    return pedidos.filter(pedido => pedido.prioridad === prioridad);
  }, [pedidos]);

  // Buscar pedidos
  const buscarPedidos = useCallback((termino) => {
    if (!termino) return pedidos;

    return pedidos.filter(pedido =>
      pedido.cliente?.toLowerCase().includes(termino.toLowerCase()) ||
      pedido.id?.toLowerCase().includes(termino.toLowerCase()) ||
      pedido.direccion?.toLowerCase().includes(termino.toLowerCase())
    );
  }, [pedidos]);

  // Obtener historial de un pedido
  const obtenerHistorial = useCallback(async (pedidoId) => {
    if (!isFirestoreAvailable()) {
      return [];
    }

    try {
      return await obtenerHistorialUbicaciones(pedidoId);
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return [];
    }
  }, []);

  // Estadísticas de pedidos
  const estadisticas = useCallback(() => {
    const total = pedidos.length;
    const pendientes = pedidos.filter(p => p.estado === ESTADOS_PEDIDO.PENDIENTE).length;
    const enRuta = pedidos.filter(p => p.estado === ESTADOS_PEDIDO.EN_RUTA).length;
    const entregados = pedidos.filter(p => p.estado === ESTADOS_PEDIDO.ENTREGADO).length;
    const asignados = pedidos.filter(p => p.estado === ESTADOS_PEDIDO.ASIGNADO).length;

    return {
      total,
      pendientes,
      asignados,
      enRuta,
      entregados,
      porcentajeEntregados: total > 0 ? Math.round((entregados / total) * 100) : 0
    };
  }, [pedidos]);

  return {
    pedidos,
    cargando,
    error,
    crearPedido,
    actualizarEstadoPedido,
    asignarCamionAPedido,
    eliminarPedido,
    actualizarPedido,
    actualizarUbicacion,
    reemplazarPedidos,
    obtenerPedidosPorEstado,
    obtenerPedidosPorCamion,
    obtenerPedidosPorPrioridad,
    buscarPedidos,
    obtenerHistorial,
    estadisticas: estadisticas(),
    firestoreDisponible: isFirestoreAvailable()
  };
};
