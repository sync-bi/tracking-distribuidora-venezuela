// src/services/coordenadasClientes.js
//
// Aprendizaje de coordenadas a partir de las entregas reales.
//
// Por qué existe: sólo el 2.8% de los clientes tiene coordenadas en Profit Plus,
// y la geocodificación por dirección no es una salida — Mapbox no resuelve
// direcciones venezolanas a nivel de calle (se midió sobre una muestra real:
// 20 de 20 devolvieron ciudad, estado o país). Llenar la base con centroides de
// ciudad sería peor que no tener nada: enviaría conductores a puntos falsos.
//
// La fuente confiable es el propio reparto: cuando el conductor entrega, su
// teléfono ya captura la posición exacta de la puerta del cliente. Esa
// coordenada es mejor que cualquier geocodificador, y el sistema se corrige
// solo a medida que se reparte.

import { guardarCorreccionCliente } from './firestoreService';

// Un fix peor que esto no sirve para ubicar una puerta.
export const PRECISION_MAXIMA_METROS = 100;

// Fuentes de ubicación aceptables: un fix viejo del tracking pudo tomarse
// cuadras antes de llegar, así que no se usa para fijar la dirección.
const FUENTES_CONFIABLES = ['tracking', 'puntual'];

const coordenadaEsReal = (coords) =>
  coords &&
  typeof coords.lat === 'number' && typeof coords.lng === 'number' &&
  !(coords.lat === 0 && coords.lng === 0) &&
  !coords.geocodificada;

/**
 * Decide si la ubicación de una entrega sirve para fijar la del cliente.
 */
export const ubicacionEsUtilizable = (ubicacion) => {
  if (!ubicacion) return false;
  if (!FUENTES_CONFIABLES.includes(ubicacion.fuente)) return false;
  if (typeof ubicacion.lat !== 'number' || typeof ubicacion.lng !== 'number') return false;
  if (ubicacion.lat === 0 && ubicacion.lng === 0) return false;
  // Sin dato de precisión no se puede descartar un fix malo: se rechaza.
  if (ubicacion.precision == null) return false;
  return ubicacion.precision <= PRECISION_MAXIMA_METROS;
};

/**
 * ¿Vale la pena aprender la coordenada de este cliente?
 * No se pisa una coordenada corregida a mano ni una ya aprendida antes.
 */
export const debeAprenderCoordenada = (pedido, correccionExistente) => {
  if (!pedido?.codigoCliente) return false;
  if (correccionExistente?.coordenadas?.corregidaManualmente) return false;
  if (correccionExistente?.metodo === 'gps_entrega') return false;
  if (correccionExistente?.coordenadas?.lat != null) return false;
  return !coordenadaEsReal(pedido.coordenadas);
};

/**
 * Guarda la coordenada aprendida de una entrega.
 * Devuelve la coordenada guardada, o null si no se guardó nada.
 */
export const aprenderCoordenadaDeEntrega = async ({
  pedido,
  ubicacionEntrega,
  correccionExistente = null,
  userId = 'sistema'
}) => {
  if (!ubicacionEsUtilizable(ubicacionEntrega)) return null;
  if (!debeAprenderCoordenada(pedido, correccionExistente)) return null;

  try {
    await guardarCorreccionCliente(
      pedido.codigoCliente,
      {
        codigoCliente: pedido.codigoCliente,
        nombre: pedido.cliente || '',
        lat: ubicacionEntrega.lat,
        lng: ubicacionEntrega.lng,
        direccion: pedido.direccion || '',
        ciudad: pedido.ciudad || '',
        metodo: 'gps_entrega'
      },
      userId
    );

    console.log(`📍 Coordenada aprendida para ${pedido.cliente || pedido.codigoCliente}`);
    return { lat: ubicacionEntrega.lat, lng: ubicacionEntrega.lng };
  } catch (error) {
    // Aprender la coordenada es un efecto secundario: nunca debe tumbar la entrega.
    console.error('No se pudo guardar la coordenada aprendida:', error);
    return null;
  }
};

const coordenadasClientesService = {
  aprenderCoordenadaDeEntrega,
  ubicacionEsUtilizable,
  debeAprenderCoordenada,
  PRECISION_MAXIMA_METROS
};

export default coordenadasClientesService;
