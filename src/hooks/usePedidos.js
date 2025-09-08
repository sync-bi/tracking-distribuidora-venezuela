// src/hooks/usePedidos.js
import { useState, useCallback, useEffect } from 'react';
import { pedidosIniciales } from '../data/mockData';
import { loadPedidosFromPublic } from '../utils/importers';
import { generarCoordenadasVenezuela } from '../utils/calculos';
import { ESTADOS_PEDIDO } from '../utils/constants';

export const usePedidos = () => {
  const [pedidos, setPedidos] = useState(pedidosIniciales);

  // Autocarga de pedidos desde /public/pedidos.xlsx|csv si existe
  useEffect(() => {
    let mounted = true;
    const shouldAuto = String(process.env.REACT_APP_AUTOLOAD_PEDIDOS || 'true').toLowerCase() === 'true';
    if (shouldAuto && (!pedidos || pedidos.length === 0)) {
      (async () => {
        try {
          const imported = await loadPedidosFromPublic();
          if (mounted && imported.length) setPedidos(imported);
        } catch (_) { /* ignore */ }
      })();
    }
    return () => { mounted = false; };
  }, []);

  // Crear nuevo pedido
  const crearPedido = useCallback((datosPedido) => {
    const nuevoPedido = {
      ...datosPedido,
      id: `PED${String(pedidos.length + 1).padStart(3, '0')}`,
      coordenadas: generarCoordenadasVenezuela(),
      estado: ESTADOS_PEDIDO.PENDIENTE,
      fechaCreacion: new Date().toISOString().split('T')[0],
      horaEstimada: new Date().toLocaleTimeString('es-VE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      camionAsignado: null
    };
    
    setPedidos(prev => [...prev, nuevoPedido]);
    return nuevoPedido;
  }, [pedidos.length]);

  // Actualizar estado de pedido
  const actualizarEstadoPedido = useCallback((pedidoId, nuevoEstado) => {
    setPedidos(prev => prev.map(pedido => 
      pedido.id === pedidoId 
        ? { ...pedido, estado: nuevoEstado }
        : pedido
    ));
  }, []);

  // Asignar camión a pedido
  const asignarCamionAPedido = useCallback((pedidoId, camionId) => {
    setPedidos(prev => prev.map(pedido => 
      pedido.id === pedidoId 
        ? { 
            ...pedido, 
            camionAsignado: camionId, 
            estado: ESTADOS_PEDIDO.ASIGNADO 
          }
        : pedido
    ));
  }, []);

  // Eliminar pedido
  const eliminarPedido = useCallback((pedidoId) => {
    setPedidos(prev => prev.filter(pedido => pedido.id !== pedidoId));
  }, []);

  // Actualizar pedido completo
  const actualizarPedido = useCallback((pedidoId, datosActualizados) => {
    setPedidos(prev => prev.map(pedido => 
      pedido.id === pedidoId 
        ? { ...pedido, ...datosActualizados }
        : pedido
    ));
  }, []);

  // Reemplazar todos los pedidos (importación masiva)
  const reemplazarPedidos = useCallback((nuevosPedidos) => {
    if (!Array.isArray(nuevosPedidos)) return;
    setPedidos(nuevosPedidos);
  }, []);

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
      pedido.cliente.toLowerCase().includes(termino.toLowerCase()) ||
      pedido.id.toLowerCase().includes(termino.toLowerCase()) ||
      pedido.direccion.toLowerCase().includes(termino.toLowerCase())
    );
  }, [pedidos]);

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
    estadisticas: estadisticas()
  };
};
