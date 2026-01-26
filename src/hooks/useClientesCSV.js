// src/hooks/useClientesCSV.js
import { useState, useCallback, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';

/**
 * Hook para gestión de clientes desde archivo CSV
 * Carga clientes desde clientes.csv (coordenadas) y clientes con vendedor.csv (vendedores)
 * Hace merge de ambos archivos por código de cliente
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

  // Función para normalizar código de cliente (quitar espacios y ceros a la izquierda)
  const normalizarCodigo = (codigo) => {
    if (!codigo) return '';
    return codigo.toString().trim().replace(/^0+/, '');
  };

  // Función para parsear el CSV de coordenadas (clientes.csv)
  const parsearCSVCoordenadas = (texto) => {
    const lineas = texto.split('\n');
    if (lineas.length < 2) return {};

    const headers = lineas[0].split(';').map(h => h.trim().replace(/^\uFEFF/, ''));
    const mapaClientes = {};

    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue;

      const valores = linea.split(';').map(v => v.trim().replace(/^"|"$/g, '').trim());

      const cliente = {};
      headers.forEach((header, idx) => {
        cliente[header] = valores[idx] || '';
      });

      // Parsear coordenadas
      const val1 = parseFloat(cliente.longuitud) || 0;
      const val2 = parseFloat(cliente.latitud) || 0;

      let lat, lng;

      if (val1 < 0 && Math.abs(val1) > 50) {
        lng = val1;
        lat = val2;
      } else if (val2 < 0 && Math.abs(val2) > 50) {
        lng = val2;
        lat = val1;
      } else if (val1 > 0 && val1 < 20 && Math.abs(val2) > 50) {
        lat = val1;
        lng = val2;
      } else if (val2 > 0 && val2 < 20 && Math.abs(val1) > 50) {
        lat = val2;
        lng = val1;
      } else {
        lat = val1;
        lng = val2;
      }

      const latValida = lat > 0 && lat < 20;
      const lngValida = lng < 0 && lng > -80;

      if (!latValida || !lngValida) {
        if (lng > 0 && lng < 20 && lat < 0 && lat > -80) {
          const temp = lat;
          lat = lng;
          lng = temp;
        }
      }

      const codigoNorm = normalizarCodigo(cliente.co_cli);
      if (codigoNorm) {
        mapaClientes[codigoNorm] = {
          nombre: cliente.cliente || '',
          ciudad: cliente.ciudad || '',
          direccion: cliente.direccion_principal || '',
          direccionTemporal: cliente.direccion_temporal !== 'NULL' ? cliente.direccion_temporal : '',
          lat,
          lng
        };
      }
    }

    return mapaClientes;
  };

  // Función para parsear el CSV de vendedores (clientes con vendedor.csv)
  const parsearCSVVendedores = (texto) => {
    const lineas = texto.split('\n');
    if (lineas.length < 2) return [];

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

      const codigoCliente = cliente.co_cli?.trim() || '';
      const nombre = cliente.cli_des || '';
      const vendedor = cliente.ven_des || 'Sin asignar';

      if (nombre) {
        clientesParsed.push({
          codigoCliente,
          codigoNormalizado: normalizarCodigo(codigoCliente),
          nombre,
          tipoCliente: cliente.tip_cli?.trim() || '',
          vendedorAsignado: vendedor
        });
      }
    }

    return clientesParsed;
  };

  // Cargar desde archivos CSV y hacer merge
  const cargarClientesDesdeCSV = async () => {
    setCargando(true);
    setError(null);

    try {
      // Cargar ambos archivos en paralelo
      const [respCoordenadas, respVendedores] = await Promise.all([
        fetch('/clientes.csv').catch(() => null),
        fetch('/clientes con vendedor.csv').catch(() => null)
      ]);

      let mapaCoordenadas = {};
      let clientesVendedores = [];

      // Parsear CSV de coordenadas
      if (respCoordenadas && respCoordenadas.ok) {
        const textoCoordenadas = await respCoordenadas.text();
        mapaCoordenadas = parsearCSVCoordenadas(textoCoordenadas);
        console.log(`📍 Cargadas coordenadas de ${Object.keys(mapaCoordenadas).length} clientes`);
      }

      // Parsear CSV de vendedores
      if (respVendedores && respVendedores.ok) {
        const textoVendedores = await respVendedores.text();
        clientesVendedores = parsearCSVVendedores(textoVendedores);
        console.log(`👤 Cargados ${clientesVendedores.length} clientes con vendedor`);
      }

      // Hacer merge: base es clientesVendedores, agregar coordenadas de mapaCoordenadas
      let clientesMerge = [];

      if (clientesVendedores.length > 0) {
        // Usar clientes con vendedor como base
        clientesMerge = clientesVendedores.map((cv, idx) => {
          const coords = mapaCoordenadas[cv.codigoNormalizado] || {};
          return {
            id: cv.codigoCliente || `cli-${idx}`,
            codigoCliente: cv.codigoCliente,
            nombre: cv.nombre,
            ciudad: coords.ciudad || '',
            direccion: coords.direccion || '',
            direccionTemporal: coords.direccionTemporal || '',
            coordenadas: {
              lat: coords.lat || 0,
              lng: coords.lng || 0,
              corregida: false
            },
            vendedorAsignado: cv.vendedorAsignado,
            tipoCliente: cv.tipoCliente,
            totalPedidos: 0
          };
        });
      } else if (Object.keys(mapaCoordenadas).length > 0) {
        // Fallback: usar solo coordenadas si no hay vendedores
        clientesMerge = Object.entries(mapaCoordenadas).map(([codigo, datos], idx) => ({
          id: codigo || `cli-${idx}`,
          codigoCliente: codigo,
          nombre: datos.nombre,
          ciudad: datos.ciudad || '',
          direccion: datos.direccion || '',
          direccionTemporal: datos.direccionTemporal || '',
          coordenadas: {
            lat: datos.lat || 0,
            lng: datos.lng || 0,
            corregida: false
          },
          vendedorAsignado: 'Sin asignar',
          tipoCliente: '',
          totalPedidos: 0
        }));
      }

      if (clientesMerge.length > 0) {
        setClientes(clientesMerge);
        console.log(`✅ Total: ${clientesMerge.length} clientes cargados`);
      } else {
        setError('No se encontraron archivos CSV de clientes');
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

  // Filtrar clientes por ciudad
  const obtenerClientesPorCiudad = useCallback((ciudad) => {
    if (!ciudad || ciudad === 'todos') return clientes;
    return clientes.filter(c => c.ciudad === ciudad);
  }, [clientes]);

  // Filtrar clientes por vendedor
  const obtenerClientesPorVendedor = useCallback((vendedor) => {
    if (!vendedor || vendedor === 'todos') return clientes;
    return clientes.filter(c => c.vendedorAsignado === vendedor);
  }, [clientes]);

  // Filtrar clientes por ciudad y vendedor
  const obtenerClientesFiltrados = useCallback((ciudad, vendedor) => {
    let resultado = clientes;
    if (ciudad && ciudad !== 'todos') {
      resultado = resultado.filter(c => c.ciudad === ciudad);
    }
    if (vendedor && vendedor !== 'todos') {
      resultado = resultado.filter(c => c.vendedorAsignado === vendedor);
    }
    return resultado;
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
    vendedores,
    historialCambios,
    cargando,
    error,
    actualizarUbicacionCliente,
    obtenerClientesPorCiudad,
    obtenerClientesPorVendedor,
    obtenerClientesFiltrados,
    buscarClientes,
    estadisticas,
    recargarClientes: cargarClientesDesdeCSV,
    exportarClientesCSV
  };
};
