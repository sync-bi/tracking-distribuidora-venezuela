// src/hooks/useClientes.js
import { useState, useCallback, useMemo } from 'react';

/**
 * Hook para gestión de clientes
 * Extrae información única de clientes desde los pedidos
 */
export const useClientes = (pedidos = []) => {
  const [historialCambios, setHistorialCambios] = useState([]);

  // Extraer clientes únicos de los pedidos
  const clientes = useMemo(() => {
    const clientesMap = new Map();

    pedidos.forEach(pedido => {
      const clienteNombre = pedido.cliente || pedido.codigoCliente;
      if (!clienteNombre) return;

      if (!clientesMap.has(clienteNombre)) {
        clientesMap.set(clienteNombre, {
          nombre: pedido.cliente || '',
          codigoCliente: pedido.codigoCliente || '',
          direccion: pedido.direccion || '',
          ciudad: pedido.ciudad || '',
          coordenadas: pedido.coordenadas || { lat: 10.4806, lng: -66.9036 },
          vendedorAsignado: pedido.vendedorAsignado || 'Sin asignar',
          telefono: pedido.telefono || '',
          // Metadata
          totalPedidos: 0,
          pedidosIds: [],
          ultimoPedido: null,
          primeraFecha: pedido.fechaCreacion,
          ultimaFecha: pedido.fechaCreacion
        });
      }

      const cliente = clientesMap.get(clienteNombre);
      cliente.totalPedidos++;
      cliente.pedidosIds.push(pedido.id);

      // Actualizar última fecha
      if (!cliente.ultimaFecha || pedido.fechaCreacion > cliente.ultimaFecha) {
        cliente.ultimaFecha = pedido.fechaCreacion;
        cliente.ultimoPedido = pedido.id;
      }

      // Actualizar primera fecha
      if (!cliente.primeraFecha || pedido.fechaCreacion < cliente.primeraFecha) {
        cliente.primeraFecha = pedido.fechaCreacion;
      }
    });

    return Array.from(clientesMap.values());
  }, [pedidos]);

  // Actualizar ubicación de un cliente (actualiza todos sus pedidos)
  const actualizarUbicacionCliente = useCallback((nombreCliente, nuevaUbicacion, pedidosActualizados, metodo = 'manual', razon = '') => {
    const cambio = {
      cliente: nombreCliente,
      fecha: new Date().toISOString(),
      ubicacionAnterior: {
        direccion: pedidosActualizados[0]?.direccion,
        ciudad: pedidosActualizados[0]?.ciudad,
        coordenadas: pedidosActualizados[0]?.coordenadas
      },
      ubicacionNueva: nuevaUbicacion,
      metodo,
      razon,
      pedidosAfectados: pedidosActualizados.map(p => p.id)
    };

    setHistorialCambios(prev => [cambio, ...prev]);
  }, []);

  // Obtener clientes por vendedor
  const obtenerClientesPorVendedor = useCallback((vendedor) => {
    if (!vendedor || vendedor === 'todos') return clientes;
    return clientes.filter(c => c.vendedorAsignado === vendedor);
  }, [clientes]);

  // Obtener vendedores únicos
  const vendedores = useMemo(() => {
    const vendedoresSet = new Set();
    clientes.forEach(c => {
      if (c.vendedorAsignado) {
        vendedoresSet.add(c.vendedorAsignado);
      }
    });
    return Array.from(vendedoresSet).sort();
  }, [clientes]);

  // Buscar clientes
  const buscarClientes = useCallback((termino) => {
    if (!termino) return clientes;

    const terminoLower = termino.toLowerCase();
    return clientes.filter(c =>
      c.nombre?.toLowerCase().includes(terminoLower) ||
      c.codigoCliente?.toLowerCase().includes(terminoLower) ||
      c.direccion?.toLowerCase().includes(terminoLower) ||
      c.ciudad?.toLowerCase().includes(terminoLower) ||
      c.vendedorAsignado?.toLowerCase().includes(terminoLower)
    );
  }, [clientes]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = clientes.length;
    const conCoordenadas = clientes.filter(c =>
      c.coordenadas?.lat && c.coordenadas?.lng
    ).length;
    const sinCoordenadas = total - conCoordenadas;
    const porVendedor = {};

    clientes.forEach(c => {
      const vendedor = c.vendedorAsignado || 'Sin asignar';
      if (!porVendedor[vendedor]) {
        porVendedor[vendedor] = 0;
      }
      porVendedor[vendedor]++;
    });

    return {
      total,
      conCoordenadas,
      sinCoordenadas,
      porcentajeCompleto: total > 0 ? Math.round((conCoordenadas / total) * 100) : 0,
      porVendedor
    };
  }, [clientes]);

  return {
    clientes,
    vendedores,
    historialCambios,
    actualizarUbicacionCliente,
    obtenerClientesPorVendedor,
    buscarClientes,
    estadisticas
  };
};
