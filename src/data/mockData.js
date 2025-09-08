// src/data/mockData.js

export const pedidosIniciales = [];

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
