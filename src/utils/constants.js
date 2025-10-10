// src/utils/constants.js

export const ESTADOS_PEDIDO = {
  PENDIENTE: 'Pendiente',
  ASIGNADO: 'Asignado',
  EN_RUTA: 'En Ruta',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado'
};

export const PRIORIDADES = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente'
};

export const ESTADOS_CAMION = {
  DISPONIBLE: 'Disponible',
  ASIGNADO: 'Asignado',
  EN_RUTA: 'En Ruta',
  MANTENIMIENTO: 'Mantenimiento',
  FUERA_DE_SERVICIO: 'Fuera de Servicio'
};

export const TIPOS_PRODUCTO = {
  LLANTA: 'Llanta',
  BATERIA: 'Batería',
  ACEITE: 'Aceite',
  FILTRO: 'Filtro',
  REPUESTO: 'Repuesto'
};

export const MARCAS_LLANTAS = [
  'Bridgestone',
  'Michelin',
  'Firestone',
  'Goodyear',
  'Continental',
  'Pirelli',
  'Kumho',
  'Hankook'
];

export const MARCAS_BATERIAS = [
  'Duncan',
  'Tudor',
  'Bosch',
  'Varta',
  'AC Delco',
  'Optima',
  'Interstate',
  'Exide'
];

export const CIUDADES_VENEZUELA = [
  // Región Capital
  { nombre: 'Caracas', estado: 'Miranda', coordenadas: { lat: 10.4806, lng: -66.9036 } },
  { nombre: 'Los Teques', estado: 'Miranda', coordenadas: { lat: 10.3446, lng: -67.0425 } },
  { nombre: 'Guarenas', estado: 'Miranda', coordenadas: { lat: 10.4667, lng: -66.6167 } },
  { nombre: 'Guatire', estado: 'Miranda', coordenadas: { lat: 10.4667, lng: -66.5333 } },
  { nombre: 'Petare', estado: 'Miranda', coordenadas: { lat: 10.4667, lng: -66.8000 } },

  // Región Central
  { nombre: 'Valencia', estado: 'Carabobo', coordenadas: { lat: 10.1621, lng: -68.0075 } },
  { nombre: 'Maracay', estado: 'Aragua', coordenadas: { lat: 10.2733, lng: -67.5951 } },
  { nombre: 'Puerto Cabello', estado: 'Carabobo', coordenadas: { lat: 10.4731, lng: -68.0125 } },
  { nombre: 'Turmero', estado: 'Aragua', coordenadas: { lat: 10.2286, lng: -67.4744 } },
  { nombre: 'Cagua', estado: 'Aragua', coordenadas: { lat: 10.1867, lng: -67.4597 } },
  { nombre: 'La Victoria', estado: 'Aragua', coordenadas: { lat: 10.2267, lng: -67.3311 } },

  // Región Occidental
  { nombre: 'Maracaibo', estado: 'Zulia', coordenadas: { lat: 10.6666, lng: -71.6124 } },
  { nombre: 'Barquisimeto', estado: 'Lara', coordenadas: { lat: 10.0647, lng: -69.3301 } },
  { nombre: 'Cabimas', estado: 'Zulia', coordenadas: { lat: 10.3933, lng: -71.4469 } },
  { nombre: 'Punto Fijo', estado: 'Falcón', coordenadas: { lat: 11.6917, lng: -70.1997 } },
  { nombre: 'Coro', estado: 'Falcón', coordenadas: { lat: 11.4045, lng: -69.6732 } },
  { nombre: 'Carora', estado: 'Lara', coordenadas: { lat: 10.1733, lng: -70.0803 } },

  // Región Los Andes
  { nombre: 'San Cristóbal', estado: 'Táchira', coordenadas: { lat: 7.7669, lng: -72.2250 } },
  { nombre: 'Mérida', estado: 'Mérida', coordenadas: { lat: 8.5983, lng: -71.1408 } },
  { nombre: 'Valera', estado: 'Trujillo', coordenadas: { lat: 9.3178, lng: -70.6033 } },
  { nombre: 'San Antonio del Táchira', estado: 'Táchira', coordenadas: { lat: 7.8167, lng: -72.4333 } },
  { nombre: 'Rubio', estado: 'Táchira', coordenadas: { lat: 7.7017, lng: -72.3528 } },
  { nombre: 'Tovar', estado: 'Mérida', coordenadas: { lat: 8.3264, lng: -71.7536 } },

  // Región Oriental
  { nombre: 'Barcelona', estado: 'Anzoátegui', coordenadas: { lat: 10.1167, lng: -64.7000 } },
  { nombre: 'Puerto La Cruz', estado: 'Anzoátegui', coordenadas: { lat: 10.2131, lng: -64.6328 } },
  { nombre: 'Maturín', estado: 'Monagas', coordenadas: { lat: 9.7469, lng: -63.1833 } },
  { nombre: 'Cumaná', estado: 'Sucre', coordenadas: { lat: 10.4530, lng: -64.1669 } },
  { nombre: 'El Tigre', estado: 'Anzoátegui', coordenadas: { lat: 8.8897, lng: -64.2522 } },
  { nombre: 'Anaco', estado: 'Anzoátegui', coordenadas: { lat: 9.4378, lng: -64.4728 } },
  { nombre: 'Carúpano', estado: 'Sucre', coordenadas: { lat: 10.6678, lng: -63.2558 } },

  // Región Guayana
  { nombre: 'Ciudad Guayana', estado: 'Bolívar', coordenadas: { lat: 8.3831, lng: -62.6474 } },
  { nombre: 'Puerto Ordaz', estado: 'Bolívar', coordenadas: { lat: 8.3000, lng: -62.7167 } },
  { nombre: 'San Félix', estado: 'Bolívar', coordenadas: { lat: 8.3833, lng: -62.6833 } },
  { nombre: 'Ciudad Bolívar', estado: 'Bolívar', coordenadas: { lat: 8.1292, lng: -63.5444 } },
  { nombre: 'Upata', estado: 'Bolívar', coordenadas: { lat: 8.0078, lng: -62.4050 } },

  // Región de Los Llanos
  { nombre: 'Calabozo', estado: 'Guárico', coordenadas: { lat: 8.9244, lng: -67.4292 } },
  { nombre: 'San Fernando de Apure', estado: 'Apure', coordenadas: { lat: 7.8881, lng: -67.4739 } },
  { nombre: 'Valle de la Pascua', estado: 'Guárico', coordenadas: { lat: 9.2167, lng: -65.9833 } },
  { nombre: 'Acarigua', estado: 'Portuguesa', coordenadas: { lat: 9.5553, lng: -69.1997 } },
  { nombre: 'Guanare', estado: 'Portuguesa', coordenadas: { lat: 9.0417, lng: -69.7486 } },

  // Región Insular
  { nombre: 'Porlamar', estado: 'Nueva Esparta', coordenadas: { lat: 10.9575, lng: -63.8497 } },
  { nombre: 'La Asunción', estado: 'Nueva Esparta', coordenadas: { lat: 11.0333, lng: -63.8625 } }
];

// Puntos de partida (depósitos) fijos
export const DEPOSITOS = {
  LOS_CORTIJOS: {
    nombre: 'Zona industrial Los Cortijos, Caracas 1060, Venezuela',
    coordenadas: { lat: 10.4918, lng: -66.8289 }
  },
  LOS_RUICES: {
    nombre: 'Av. Milán de Los Ruices, Caracas, Venezuela',
    coordenadas: { lat: 10.4895, lng: -66.8269 }
  }
};

export const COLORES_ESTADO = {
  [ESTADOS_PEDIDO.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
  [ESTADOS_PEDIDO.ASIGNADO]: 'bg-blue-100 text-blue-800',
  [ESTADOS_PEDIDO.EN_RUTA]: 'bg-green-100 text-green-800',
  [ESTADOS_PEDIDO.ENTREGADO]: 'bg-gray-100 text-gray-800',
  [ESTADOS_PEDIDO.CANCELADO]: 'bg-red-100 text-red-800'
};

export const COLORES_PRIORIDAD = {
  [PRIORIDADES.BAJA]: 'bg-green-100 text-green-800',
  [PRIORIDADES.MEDIA]: 'bg-orange-100 text-orange-800',
  [PRIORIDADES.ALTA]: 'bg-red-100 text-red-800',
  [PRIORIDADES.URGENTE]: 'bg-purple-100 text-purple-800'
};

export const COLORES_CAMION = {
  [ESTADOS_CAMION.DISPONIBLE]: 'bg-green-100 text-green-800',
  [ESTADOS_CAMION.ASIGNADO]: 'bg-orange-100 text-orange-800',
  [ESTADOS_CAMION.EN_RUTA]: 'bg-blue-100 text-blue-800',
  [ESTADOS_CAMION.MANTENIMIENTO]: 'bg-yellow-100 text-yellow-800',
  [ESTADOS_CAMION.FUERA_DE_SERVICIO]: 'bg-red-100 text-red-800'
};

export const CONFIGURACION = {
  VELOCIDAD_PROMEDIO_KMH: 40,
  INTERVALO_ACTUALIZACION_MS: 5000,
  CAPACIDAD_UTILIZACION_MAXIMA: 0.8,
  DELTA_MOVIMIENTO_SIMULADO: 0.001
};

export const ROLES_USUARIO = {
  ADMIN: 'admin',
  OPERADOR: 'operador',
  CONDUCTOR: 'conductor',
  CLIENTE: 'cliente'
};

export const PERMISOS = {
  [ROLES_USUARIO.ADMIN]: ['crear', 'leer', 'actualizar', 'eliminar', 'asignar'],
  [ROLES_USUARIO.OPERADOR]: ['crear', 'leer', 'actualizar', 'asignar'],
  [ROLES_USUARIO.CONDUCTOR]: ['leer', 'actualizar_estado'],
  [ROLES_USUARIO.CLIENTE]: ['leer', 'crear_pedido']
};
