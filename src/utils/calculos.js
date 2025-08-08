// src/utils/calculos.js

/**
 * Calcula la distancia entre dos coordenadas usando la fórmula Haversine
 * @param {Object} coord1 - Primera coordenada {lat, lng}
 * @param {Object} coord2 - Segunda coordenada {lat, lng}
 * @returns {number} - Distancia en kilómetros
 */
export const calcularDistancia = (coord1, coord2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calcula el tiempo estimado de viaje basado en la distancia
 * @param {number} distancia - Distancia en kilómetros
 * @param {number} velocidadPromedio - Velocidad promedio en km/h (default: 40)
 * @returns {number} - Tiempo estimado en minutos
 */
export const calcularTiempoEstimado = (distancia, velocidadPromedio = 40) => {
  // Velocidad considerando tráfico venezolano
  const horas = distancia / velocidadPromedio;
  const minutos = Math.round(horas * 60);
  return minutos;
};

/**
 * Optimiza la ruta para un camión usando el algoritmo del vecino más cercano
 * @param {Object} camion - Objeto del camión con ubicación actual
 * @param {Array} pedidos - Array de pedidos asignados al camión
 * @returns {Array} - Array de pedidos ordenados por ruta óptima
 */
export const optimizarRuta = (camion, pedidos) => {
  const pedidosCamion = pedidos.filter(p => camion.pedidosAsignados.includes(p.id));
  
  if (pedidosCamion.length === 0) return [];

  let rutaOptima = [];
  let ubicacionActual = camion.ubicacionActual;
  let pedidosRestantes = [...pedidosCamion];

  while (pedidosRestantes.length > 0) {
    let pedidoMasCercano = null;
    let distanciaMinima = Infinity;

    pedidosRestantes.forEach(pedido => {
      const distancia = calcularDistancia(ubicacionActual, pedido.coordenadas);
      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        pedidoMasCercano = pedido;
      }
    });

    if (pedidoMasCercano) {
      const tiempo = calcularTiempoEstimado(distanciaMinima);
      rutaOptima.push({
        ...pedidoMasCercano,
        distancia: Math.round(distanciaMinima * 100) / 100,
        tiempoEstimado: tiempo
      });
      ubicacionActual = pedidoMasCercano.coordenadas;
      pedidosRestantes = pedidosRestantes.filter(p => p.id !== pedidoMasCercano.id);
    }
  }

  return rutaOptima;
};

/**
 * Genera coordenadas aleatorias dentro de Venezuela
 * @returns {Object} - Coordenadas {lat, lng}
 */
export const generarCoordenadasVenezuela = () => {
  // Rango aproximado de coordenadas de Venezuela
  const latMin = 0.6;
  const latMax = 12.2;
  const lngMin = -73.4;
  const lngMax = -59.8;

  return {
    lat: latMin + Math.random() * (latMax - latMin),
    lng: lngMin + Math.random() * (lngMax - lngMin)
  };
};

/**
 * Simula movimiento de camión (para tracking en tiempo real)
 * @param {Object} ubicacionActual - Ubicación actual del camión
 * @param {number} deltaMovimiento - Cantidad de movimiento (default: 0.001)
 * @returns {Object} - Nueva ubicación
 */
export const simularMovimientoCamion = (ubicacionActual, deltaMovimiento = 0.001) => {
  const deltaLat = (Math.random() - 0.5) * deltaMovimiento;
  const deltaLng = (Math.random() - 0.5) * deltaMovimiento;
  
  return {
    lat: ubicacionActual.lat + deltaLat,
    lng: ubicacionActual.lng + deltaLng
  };
};

/**
 * Calcula el peso total de productos en un pedido
 * @param {Array} productos - Array de productos
 * @returns {number} - Peso total estimado en kg
 */
export const calcularPesoTotal = (productos) => {
  const pesosEstimados = {
    'Llanta': 15, // kg promedio por llanta
    'Batería': 20  // kg promedio por batería
  };

  return productos.reduce((total, producto) => {
    const pesoUnitario = pesosEstimados[producto.tipo] || 10;
    return total + (pesoUnitario * producto.cantidad);
  }, 0);
};

/**
 * Verifica si un camión puede cargar un pedido según su capacidad
 * @param {Object} camion - Objeto del camión
 * @param {Array} productos - Array de productos del pedido
 * @returns {boolean} - true si puede cargar, false si no
 */
export const verificarCapacidadCamion = (camion, productos) => {
  const capacidadKg = parseInt(camion.capacidad.replace(' kg', ''));
  const pesoProductos = calcularPesoTotal(productos);
  
  // Considera también los pedidos ya asignados
  // Esta función se puede expandir para calcular peso actual del camión
  
  return pesoProductos <= capacidadKg * 0.8; // 80% de capacidad máxima por seguridad
};