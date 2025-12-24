// src/hooks/useClientesCSV.js
import { useState, useCallback, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';

/**
 * Hook para gestión de clientes desde archivo CSV
 * Carga clientes desde clientes.csv independiente de pedidos
 */
export const useClientesCSV = () => {
  const [clientes, setClientes] = useState([]);
  const [historialCambios, setHistorialCambios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar clientes desde CSV al iniciar
  useEffect(() => {
    cargarClientesDesdeCSV();
  }, []);

  // Función para parsear el CSV
  const parsearCSV = (texto) => {
    const lineas = texto.split('\n');
    if (lineas.length < 2) return [];

    // Obtener headers (primera línea)
    const headers = lineas[0].split(';').map(h => h.trim().replace(/^\uFEFF/, ''));

    const clientesParsed = [];

    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue;

      const valores = linea.split(';').map(v => v.trim().replace(/^"|"$/g, '').trim());

      const cliente = {};
      headers.forEach((header, idx) => {
        cliente[header] = valores[idx] || '';
      });

      // Parsear coordenadas - El CSV tiene columnas con nombres confusos
      // Necesitamos detectar cuál es lat y cuál es lng por sus valores
      const val1 = parseFloat(cliente.longuitud) || 0;  // Columna "longuitud" del CSV
      const val2 = parseFloat(cliente.latitud) || 0;    // Columna "latitud" del CSV

      let lat, lng;

      // Para Venezuela:
      // - Latitud: entre 0° y 15° Norte (valores positivos pequeños, típicamente 8-12)
      // - Longitud: entre -60° y -75° Oeste (valores negativos grandes)

      // Detectar basándose en los valores reales
      if (val1 < 0 && Math.abs(val1) > 50) {
        // val1 es negativo y grande (como -66) -> es longitud
        lng = val1;
        lat = val2;
      } else if (val2 < 0 && Math.abs(val2) > 50) {
        // val2 es negativo y grande -> es longitud
        lng = val2;
        lat = val1;
      } else if (val1 > 0 && val1 < 20 && Math.abs(val2) > 50) {
        // val1 es positivo pequeño (como 10.4) -> es latitud
        lat = val1;
        lng = val2;
      } else if (val2 > 0 && val2 < 20 && Math.abs(val1) > 50) {
        // val2 es positivo pequeño -> es latitud
        lat = val2;
        lng = val1;
      } else {
        // Fallback - asumir que están en orden correcto
        lat = val1;
        lng = val2;
      }

      // Validación final - Venezuela está aproximadamente en lat 1-12, lng -60 a -73
      const latValida = lat > 0 && lat < 20;
      const lngValida = lng < 0 && lng > -80;

      if (!latValida || !lngValida) {
        // Si no son válidas, intentar intercambiar
        if (lng > 0 && lng < 20 && lat < 0 && lat > -80) {
          const temp = lat;
          lat = lng;
          lng = temp;
        }
      }

      clientesParsed.push({
        id: cliente.co_cli?.trim() || `cli-${i}`,
        codigoCliente: cliente.co_cli?.trim() || '',
        nombre: cliente.cliente || '',
        ciudad: cliente.ciudad || '',
        direccion: cliente.direccion_principal || '',
        direccionTemporal: cliente.direccion_temporal !== 'NULL' ? cliente.direccion_temporal : '',
        coordenadas: {
          lat: lat,
          lng: lng,
          corregida: false
        },
        // Para compatibilidad con la UI existente
        vendedorAsignado: 'Sin asignar',
        totalPedidos: 0
      });
    }

    return clientesParsed.filter(c => c.nombre); // Filtrar clientes sin nombre
  };

  // Cargar desde archivo CSV
  const cargarClientesDesdeCSV = async () => {
    setCargando(true);
    setError(null);

    try {
      // Intentar cargar desde /clientes.csv
      const rutasIntento = ['/clientes.csv', '/Clientes.csv'];

      let texto = null;
      for (const ruta of rutasIntento) {
        try {
          const response = await fetch(ruta);
          if (response.ok) {
            texto = await response.text();
            break;
          }
        } catch (e) {
          console.log(`No se pudo cargar ${ruta}`);
        }
      }

      if (texto) {
        const clientesParsed = parsearCSV(texto);
        setClientes(clientesParsed);
        console.log(`✅ Cargados ${clientesParsed.length} clientes desde CSV`);
      } else {
        setError('No se encontró el archivo clientes.csv');
        setClientes([]);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError(err.message);
      setClientes([]);
    } finally {
      setCargando(false);
    }
  };

  // Actualizar ubicación de un cliente
  const actualizarUbicacionCliente = useCallback((codigoCliente, nuevaUbicacion, metodo = 'manual', razon = '') => {
    setClientes(prev => {
      const clienteIndex = prev.findIndex(c => c.codigoCliente === codigoCliente || c.id === codigoCliente);
      if (clienteIndex === -1) return prev;

      const clienteAnterior = prev[clienteIndex];
      const clienteActualizado = {
        ...clienteAnterior,
        direccion: nuevaUbicacion.direccion || clienteAnterior.direccion,
        ciudad: nuevaUbicacion.ciudad || clienteAnterior.ciudad,
        coordenadas: {
          lat: nuevaUbicacion.lat,
          lng: nuevaUbicacion.lng,
          corregida: true
        }
      };

      // Registrar en historial
      const cambio = {
        cliente: clienteAnterior.nombre,
        codigoCliente: clienteAnterior.codigoCliente,
        fecha: new Date().toISOString(),
        ubicacionAnterior: {
          direccion: clienteAnterior.direccion,
          ciudad: clienteAnterior.ciudad,
          coordenadas: clienteAnterior.coordenadas
        },
        ubicacionNueva: nuevaUbicacion,
        metodo,
        razon
      };

      setHistorialCambios(prevHist => [cambio, ...prevHist]);

      const nuevoArray = [...prev];
      nuevoArray[clienteIndex] = clienteActualizado;
      return nuevoArray;
    });
  }, []);

  // Obtener ciudades únicas
  const ciudades = useMemo(() => {
    const ciudadesSet = new Set();
    clientes.forEach(c => {
      if (c.ciudad) {
        ciudadesSet.add(c.ciudad);
      }
    });
    return Array.from(ciudadesSet).sort();
  }, [clientes]);

  // Filtrar clientes por ciudad
  const obtenerClientesPorCiudad = useCallback((ciudad) => {
    if (!ciudad || ciudad === 'todos') return clientes;
    return clientes.filter(c => c.ciudad === ciudad);
  }, [clientes]);

  // Buscar clientes
  const buscarClientes = useCallback((termino) => {
    if (!termino) return clientes;

    const terminoLower = termino.toLowerCase();
    return clientes.filter(c =>
      c.nombre?.toLowerCase().includes(terminoLower) ||
      c.codigoCliente?.toLowerCase().includes(terminoLower) ||
      c.direccion?.toLowerCase().includes(terminoLower) ||
      c.ciudad?.toLowerCase().includes(terminoLower)
    );
  }, [clientes]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = clientes.length;
    const conCoordenadas = clientes.filter(c =>
      c.coordenadas?.lat && c.coordenadas?.lng &&
      c.coordenadas.lat !== 0 && c.coordenadas.lng !== 0
    ).length;
    const sinCoordenadas = total - conCoordenadas;
    const corregidas = clientes.filter(c => c.coordenadas?.corregida).length;
    const porCiudad = {};

    clientes.forEach(c => {
      const ciudad = c.ciudad || 'Sin ciudad';
      if (!porCiudad[ciudad]) {
        porCiudad[ciudad] = 0;
      }
      porCiudad[ciudad]++;
    });

    return {
      total,
      conCoordenadas,
      sinCoordenadas,
      corregidas,
      porcentajeCompleto: total > 0 ? Math.round((conCoordenadas / total) * 100) : 0,
      porCiudad
    };
  }, [clientes]);

  // Exportar clientes actualizados a CSV
  const exportarClientesCSV = useCallback(() => {
    const headers = ['co_cli', 'cliente', 'ciudad', 'direccion_principal', 'direccion_temporal', 'latitud', 'longitud', 'corregida'];
    const lineas = [headers.join(';')];

    clientes.forEach(c => {
      const linea = [
        c.codigoCliente,
        c.nombre,
        c.ciudad,
        c.direccion,
        c.direccionTemporal || 'NULL',
        c.coordenadas?.lat || '',
        c.coordenadas?.lng || '',
        c.coordenadas?.corregida ? 'SI' : 'NO'
      ].join(';');
      lineas.push(linea);
    });

    const contenido = lineas.join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_actualizados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [clientes]);

  return {
    clientes,
    ciudades,
    historialCambios,
    cargando,
    error,
    actualizarUbicacionCliente,
    obtenerClientesPorCiudad,
    buscarClientes,
    estadisticas,
    recargarClientes: cargarClientesDesdeCSV,
    exportarClientesCSV
  };
};
