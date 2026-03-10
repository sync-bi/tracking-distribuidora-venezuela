// src/hooks/useClientesCSV.js
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  isFirestoreAvailable,
  guardarCorreccionCliente,
  obtenerCorreccionesClientes,
  escucharCorreccionesClientes
} from '../services/firestoreService';

/**
 * Hook para gestión de clientes desde archivo CSV + Firestore
 * - CSV: fuente base (lista de clientes + vendedores + coordenadas originales)
 * - Firestore: capa de correcciones persistentes (overlay)
 * - Al cargar: merge CSV + correcciones Firestore
 */
export const useClientesCSV = () => {
  const [clientesBase, setClientesBase] = useState([]);
  const [correcciones, setCorrecciones] = useState({});
  const [historialCambios, setHistorialCambios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [firestoreActivo, setFirestoreActivo] = useState(false);
  const unsubscribeRef = useRef(null);

  // Cargar clientes desde CSV + Firestore al iniciar
  useEffect(() => {
    cargarTodo();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Función para normalizar código de cliente (quitar espacios y ceros a la izquierda)
  const normalizarCodigo = (codigo) => {
    if (!codigo) return '';
    return codigo.toString().trim().replace(/^0+/, '');
  };

  // Validar que las coordenadas estén dentro de Venezuela
  // Límites aproximados: lat 0.6°N - 12.5°N, lng -73.4°W - -59.8°W
  // Clientes con lat < 5 son datos truncados (ej: 1.04 debería ser 10.4)
  const esCoordenadasVenezuela = (lat, lng) => {
    if (!lat || !lng || lat === 0 || lng === 0) return false;
    const latValida = lat >= 5 && lat <= 12.5;
    const lngValida = lng >= -73.5 && lng <= -59.5;
    return latValida && lngValida;
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

      // Parsear coordenadas - longitud (ya corregido el typo)
      const val1 = parseFloat(cliente.longitud) || 0;
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
        const esCorregida = (cliente.corregida || '').toUpperCase() === 'SI';
        const coordValidas = esCoordenadasVenezuela(lat, lng);
        mapaClientes[codigoNorm] = {
          nombre: cliente.cliente || '',
          ciudad: cliente.ciudad || '',
          direccion: cliente.direccion_principal || '',
          direccionTemporal: cliente.direccion_temporal !== 'NULL' ? cliente.direccion_temporal : '',
          lat: coordValidas ? lat : 0,
          lng: coordValidas ? lng : 0,
          corregidaCSV: coordValidas ? esCorregida : false
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

  // Cargar CSV + Firestore
  const cargarTodo = async () => {
    setCargando(true);
    setError(null);

    try {
      // 1. Cargar CSV base
      const clientesCSV = await cargarClientesDesdeCSV();

      // 2. Cargar correcciones de Firestore
      let correccionesFS = {};
      if (isFirestoreAvailable()) {
        try {
          correccionesFS = await obtenerCorreccionesClientes();
          setFirestoreActivo(true);
          console.log(`☁️ ${Object.keys(correccionesFS).length} correcciones cargadas de Firestore`);

          // Iniciar listener en tiempo real
          if (unsubscribeRef.current) unsubscribeRef.current();
          unsubscribeRef.current = escucharCorreccionesClientes((nuevasCorrecciones) => {
            setCorrecciones(nuevasCorrecciones);
          });
        } catch (err) {
          console.warn('⚠️ Firestore no disponible, usando solo CSV:', err.message);
          setFirestoreActivo(false);
        }
      }

      setCorrecciones(correccionesFS);
      setClientesBase(clientesCSV);
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError(err.message);
      setClientesBase([]);
    } finally {
      setCargando(false);
    }
  };

  // Cargar desde archivos CSV y hacer merge
  const cargarClientesDesdeCSV = async () => {
    const [respCoordenadas, respVendedores] = await Promise.all([
      fetch('/clientes.csv').catch(() => null),
      fetch('/clientes con vendedor.csv').catch(() => null)
    ]);

    let mapaCoordenadas = {};
    let clientesVendedores = [];

    if (respCoordenadas && respCoordenadas.ok) {
      const textoCoordenadas = await respCoordenadas.text();
      mapaCoordenadas = parsearCSVCoordenadas(textoCoordenadas);
      console.log(`📍 Cargadas coordenadas de ${Object.keys(mapaCoordenadas).length} clientes`);
    }

    if (respVendedores && respVendedores.ok) {
      const textoVendedores = await respVendedores.text();
      clientesVendedores = parsearCSVVendedores(textoVendedores);
      console.log(`👤 Cargados ${clientesVendedores.length} clientes con vendedor`);
    }

    let clientesMerge = [];

    if (clientesVendedores.length > 0) {
      clientesMerge = clientesVendedores.map((cv, idx) => {
        const coords = mapaCoordenadas[cv.codigoNormalizado] || {};
        return {
          id: cv.codigoCliente || `cli-${idx}`,
          codigoCliente: cv.codigoCliente,
          codigoNormalizado: cv.codigoNormalizado,
          nombre: cv.nombre,
          ciudad: coords.ciudad || '',
          direccion: coords.direccion || '',
          direccionTemporal: coords.direccionTemporal || '',
          coordenadas: {
            lat: coords.lat || 0,
            lng: coords.lng || 0,
            corregida: coords.corregidaCSV || false
          },
          vendedorAsignado: cv.vendedorAsignado,
          tipoCliente: cv.tipoCliente,
          totalPedidos: 0
        };
      });
    } else if (Object.keys(mapaCoordenadas).length > 0) {
      clientesMerge = Object.entries(mapaCoordenadas).map(([codigo, datos], idx) => ({
        id: codigo || `cli-${idx}`,
        codigoCliente: codigo,
        codigoNormalizado: codigo,
        nombre: datos.nombre,
        ciudad: datos.ciudad || '',
        direccion: datos.direccion || '',
        direccionTemporal: datos.direccionTemporal || '',
        coordenadas: {
          lat: datos.lat || 0,
          lng: datos.lng || 0,
          corregida: datos.corregidaCSV || false
        },
        vendedorAsignado: 'Sin asignar',
        tipoCliente: '',
        totalPedidos: 0
      }));
    }

    if (clientesMerge.length === 0) {
      throw new Error('No se encontraron archivos CSV de clientes');
    }

    console.log(`✅ Total: ${clientesMerge.length} clientes cargados desde CSV`);
    return clientesMerge;
  };

  // Clientes finales = CSV base + correcciones Firestore aplicadas
  const clientes = useMemo(() => {
    if (clientesBase.length === 0) return [];

    return clientesBase.map(cliente => {
      const codigoNorm = normalizarCodigo(cliente.codigoCliente);
      const correccion = correcciones[codigoNorm];

      if (correccion && correccion.coordenadas) {
        const lat = correccion.coordenadas.lat;
        const lng = correccion.coordenadas.lng;
        if (esCoordenadasVenezuela(lat, lng)) {
          return {
            ...cliente,
            coordenadas: { lat, lng, corregida: true },
            ...(correccion.direccion && { direccion: correccion.direccion }),
            ...(correccion.ciudad && { ciudad: correccion.ciudad })
          };
        }
      }

      return cliente;
    });
  }, [clientesBase, correcciones]);

  // Actualizar ubicación de un cliente (guarda en Firestore + actualiza local)
  const actualizarUbicacionCliente = useCallback(async (codigoCliente, nuevaUbicacion, metodo = 'manual', razon = '') => {
    const clienteIndex = clientes.findIndex(c => c.codigoCliente === codigoCliente || c.id === codigoCliente);
    if (clienteIndex === -1) return;

    if (!esCoordenadasVenezuela(nuevaUbicacion.lat, nuevaUbicacion.lng)) {
      throw new Error('Las coordenadas están fuera de Venezuela. Verifica la ubicación en el mapa.');
    }

    const clienteAnterior = clientes[clienteIndex];

    // Registrar en historial local
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

    // Guardar en Firestore (persistente)
    if (isFirestoreAvailable()) {
      setGuardando(true);
      try {
        const codigoNorm = normalizarCodigo(clienteAnterior.codigoCliente);
        await guardarCorreccionCliente(codigoNorm, {
          codigoCliente: clienteAnterior.codigoCliente,
          nombre: clienteAnterior.nombre,
          lat: nuevaUbicacion.lat,
          lng: nuevaUbicacion.lng,
          direccion: nuevaUbicacion.direccion || clienteAnterior.direccion,
          ciudad: nuevaUbicacion.ciudad || clienteAnterior.ciudad,
          metodo,
          razon
        });
        console.log(`☁️ Corrección guardada en Firestore: ${clienteAnterior.nombre}`);
      } catch (err) {
        console.error('Error guardando en Firestore:', err);
        // Fallback: guardar solo en memoria
        aplicarCorreccionLocal(clienteAnterior, nuevaUbicacion);
      } finally {
        setGuardando(false);
      }
    } else {
      // Sin Firestore: guardar solo en memoria
      aplicarCorreccionLocal(clienteAnterior, nuevaUbicacion);
    }
  }, [clientes]);

  // Aplicar corrección solo en memoria (fallback sin Firestore)
  const aplicarCorreccionLocal = useCallback((clienteAnterior, nuevaUbicacion) => {
    const codigoNorm = normalizarCodigo(clienteAnterior.codigoCliente);
    setCorrecciones(prev => ({
      ...prev,
      [codigoNorm]: {
        coordenadas: {
          lat: nuevaUbicacion.lat,
          lng: nuevaUbicacion.lng,
          corregida: true
        },
        ...(nuevaUbicacion.direccion && { direccion: nuevaUbicacion.direccion }),
        ...(nuevaUbicacion.ciudad && { ciudad: nuevaUbicacion.ciudad })
      }
    }));
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
      const lat = c.coordenadas?.lat || 0;
      const lng = c.coordenadas?.lng || 0;
      const linea = [
        c.codigoCliente,
        c.nombre,
        c.ciudad,
        c.direccion,
        c.direccionTemporal || 'NULL',
        lat !== 0 ? lat.toFixed(8) : '',
        lng !== 0 ? lng.toFixed(8) : '',
        c.coordenadas?.corregida ? 'SI' : 'NO'
      ].join(';');
      lineas.push(linea);
    });

    const contenido = lineas.join('\n');
    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_actualizados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [clientes]);

  return {
    clientes,
    ciudades,
    vendedores,
    historialCambios,
    cargando,
    error,
    guardando,
    firestoreActivo,
    actualizarUbicacionCliente,
    obtenerClientesFiltrados,
    buscarClientes,
    estadisticas,
    recargarClientes: cargarTodo,
    exportarClientesCSV
  };
};
