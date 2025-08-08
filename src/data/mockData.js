// src/data/mockData.js
export const pedidosIniciales = [
  {
    id: 'PED001',
    cliente: 'Auto Repuestos Caracas',
    direccion: 'Av. Francisco de Miranda, Caracas, Miranda',
    coordenadas: { lat: 10.4806, lng: -66.9036 },
    productos: [
      { tipo: 'Llanta', marca: 'Bridgestone', cantidad: 4, modelo: '225/60R16' },
      { tipo: 'Batería', marca: 'Duncan', cantidad: 1, modelo: '12V 75Ah' }
    ],
    prioridad: 'Alta',
    estado: 'Pendiente',
    fechaCreacion: '2025-08-06',
    horaEstimada: '14:30',
    camionAsignado: null
  },
  {
    id: 'PED002',
    cliente: 'Cauchos Valencia',
    direccion: 'Av. Bolívar Norte, Valencia, Carabobo',
    coordenadas: { lat: 10.1621, lng: -68.0075 },
    productos: [
      { tipo: 'Llanta', marca: 'Michelin', cantidad: 6, modelo: '195/65R15' }
    ],
    prioridad: 'Media',
    estado: 'En Ruta',
    fechaCreacion: '2025-08-06',
    horaEstimada: '16:00',
    camionAsignado: 'CAM001'
  },
  {
    id: 'PED003',
    cliente: 'Repuestos Maracaibo',
    direccion: 'Av. 5 de Julio, Maracaibo, Zulia',
    coordenadas: { lat: 10.6666, lng: -71.6124 },
    productos: [
      { tipo: 'Batería', marca: 'Tudor', cantidad: 3, modelo: '12V 65Ah' },
      { tipo: 'Llanta', marca: 'Firestone', cantidad: 2, modelo: '185/70R14' }
    ],
    prioridad: 'Baja',
    estado: 'Pendiente',
    fechaCreacion: '2025-08-07',
    horaEstimada: '10:00',
    camionAsignado: null
  }
];

export const camionesIniciales = [
  {
    id: 'CAM001',
    conductor: 'Carlos Rodríguez',
    placa: 'ABC-123',
    capacidad: '3000 kg',
    ubicacionActual: { lat: 10.2733, lng: -67.5951 },
    direccionActual: 'Av. Principal, Maracay, Aragua',
    estado: 'En Ruta',
    pedidosAsignados: ['PED002'],
    velocidad: '45 km/h',
    combustible: '75%'
  },
  {
    id: 'CAM002',
    conductor: 'María González',
    placa: 'DEF-456',
    capacidad: '2500 kg',
    ubicacionActual: { lat: 10.4806, lng: -66.9036 },
    direccionActual: 'Depósito Central, Caracas',
    estado: 'Disponible',
    pedidosAsignados: [],
    velocidad: '0 km/h',
    combustible: '90%'
  },
  {
    id: 'CAM003',
    conductor: 'José Martínez',
    placa: 'GHI-789',
    capacidad: '4000 kg',
    ubicacionActual: { lat: 10.0647, lng: -69.3301 },
    direccionActual: 'Terminal de Carga, Valencia',
    estado: 'Disponible',
    pedidosAsignados: [],
    velocidad: '0 km/h',
    combustible: '85%'
  }
];

export const estadosPedido = ['Pendiente', 'Asignado', 'En Ruta', 'Entregado'];
export const prioridadesPedido = ['Baja', 'Media', 'Alta'];
export const tiposProducto = ['Llanta', 'Batería'];
export const estadosCamion = ['Disponible', 'Asignado', 'En Ruta', 'Mantenimiento'];