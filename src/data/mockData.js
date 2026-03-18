// src/data/mockData.js

export const pedidosIniciales = [
  {
    id: 'PED001',
    cliente: 'Distribuidora El Sol C.A.',
    direccion: 'Av. Francisco de Miranda, Los Palos Grandes',
    ciudad: 'Caracas',
    zona: 'Este',
    coordenadas: { lat: 10.4975, lng: -66.8535 },
    productos: [
      { tipo: 'Llanta', marca: 'Bridgestone', modelo: 'Turanza T005', cantidad: 10 },
      { tipo: 'Batería', marca: 'Duncan', modelo: 'N60', cantidad: 5 }
    ],
    prioridad: 'Alta',
    estado: 'Pendiente',
    camionAsignado: null
  },
  {
    id: 'PED002',
    cliente: 'Comercial Los Andes',
    direccion: 'Calle 23, Centro Comercial',
    ciudad: 'Caracas',
    zona: 'Oeste',
    coordenadas: { lat: 10.4715, lng: -66.9190 },
    productos: [
      { tipo: 'Llanta', marca: 'Michelin', modelo: 'Primacy 4', cantidad: 20 }
    ],
    prioridad: 'Media',
    estado: 'Pendiente',
    camionAsignado: null
  },
  {
    id: 'PED003',
    cliente: 'Supermercado La Esquina',
    direccion: 'Av. Principal de Las Mercedes',
    ciudad: 'Caracas',
    zona: 'Este',
    coordenadas: { lat: 10.4918, lng: -66.8553 },
    productos: [
      { tipo: 'Llanta', marca: 'Goodyear', modelo: 'EfficientGrip', cantidad: 15 },
      { tipo: 'Batería', marca: 'Bosch', modelo: 'S5', cantidad: 8 }
    ],
    prioridad: 'Alta',
    estado: 'Pendiente',
    camionAsignado: null
  },
  {
    id: 'PED004',
    cliente: 'Abastos Central',
    direccion: 'Mercado Municipal, Catia',
    ciudad: 'Caracas',
    zona: 'Oeste',
    coordenadas: { lat: 10.4850, lng: -66.9520 },
    productos: [
      { tipo: 'Batería', marca: 'Tudor', modelo: 'TL600', cantidad: 12 },
      { tipo: 'Llanta', marca: 'Continental', modelo: 'PowerContact 2', cantidad: 10 }
    ],
    prioridad: 'Media',
    estado: 'Pendiente',
    camionAsignado: null
  },
  {
    id: 'PED005',
    cliente: 'Bodega Mi Preferida',
    direccion: 'Av. Libertador, El Recreo',
    ciudad: 'Caracas',
    zona: 'Centro',
    coordenadas: { lat: 10.4926, lng: -66.8750 },
    productos: [
      { tipo: 'Llanta', marca: 'Pirelli', modelo: 'Cinturato P1', cantidad: 8 }
    ],
    prioridad: 'Baja',
    estado: 'Pendiente',
    camionAsignado: null
  }
];

export const camionesIniciales = [
  {
    id: 'CAM101',
    conductor: '',
    placa: 'VAA-101',
    capacidad: '3000 kg',
    ubicacionActual: { lat: 10.4806, lng: -66.9036 }, // Caracas
    direccionActual: 'Depósito Central, Caracas',
    estado: 'Disponible',
    pedidosAsignados: [],
    velocidad: '0 km/h',
    combustible: '100%'
  },
  {
    id: 'CAM102',
    conductor: '',
    placa: 'VAA-102',
    capacidad: '2500 kg',
    ubicacionActual: { lat: 10.1621, lng: -68.0075 }, // Valencia
    direccionActual: 'Planta Valencia, Carabobo',
    estado: 'Disponible',
    pedidosAsignados: [],
    velocidad: '0 km/h',
    combustible: '100%'
  },
  {
    id: 'CAM103',
    conductor: '',
    placa: 'VAA-103',
    capacidad: '4000 kg',
    ubicacionActual: { lat: 10.6666, lng: -71.6124 }, // Maracaibo
    direccionActual: 'Base Occidente, Maracaibo',
    estado: 'Disponible',
    pedidosAsignados: [],
    velocidad: '0 km/h',
    combustible: '100%'
  }
];

export const estadosPedido = ['Pendiente', 'Asignado', 'En Ruta', 'Entregado'];
export const prioridadesPedido = ['Baja', 'Media', 'Alta'];
export const tiposProducto = ['Llanta', 'Bateria'];
export const estadosCamion = ['Disponible', 'Asignado', 'En Ruta', 'Mantenimiento'];
