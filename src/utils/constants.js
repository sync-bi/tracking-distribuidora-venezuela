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
  { nombre: 'Caracas', estado: 'Miranda', coordenadas: { lat: 10.4806, lng: -66.9036 } },
  { nombre: 'Valencia', estado: 'Carabobo', coordenadas: { lat: 10.1621, lng: -68.0075 } },
  { nombre: 'Maracaibo', estado: 'Zulia', coordenadas: { lat: 10.6666, lng: -71.6124 } },
  { nombre: 'Maracay', estado: 'Aragua', coordenadas: { lat: 10.2733, lng: -67.5951 } },
  { nombre: 'Barcelona', estado: 'Anzoátegui', coordenadas: { lat: 10.1167, lng: -64.7000 } },
  { nombre: 'Barquisimeto', estado: 'Lara', coordenadas: { lat: 10.0647, lng: -69.3301 } },
  { nombre: 'Ciudad Guayana', estado: 'Bolívar', coordenadas: { lat: 8.3831, lng: -62.6474 } },
  { nombre: 'Maturín', estado: 'Monagas', coordenadas: { lat: 9.7469, lng: -63.1833 } }
];

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