// src/data/mockData.js

export const pedidosIniciales = [
  {
    id: 'PED001',
    cliente: 'Distribuidora El Sol C.A.',
    codigoCliente: 'CLI001',
    direccion: 'Av. Francisco de Miranda, Los Palos Grandes',
    ciudad: 'Caracas',
    zona: 'Este',
    telefono: '0212-9876543',
    coordenadas: { lat: 10.4975, lng: -66.8535 },
    productos: ['Producto A x10', 'Producto B x5'],
    peso: '450 kg',
    volumen: '2.5 m³',
    prioridad: 'Alta',
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString().split('T')[0],
    horaEstimada: '09:00',
    camionAsignado: null,
    vendedorAsignado: 'Juan Pérez'
  },
  {
    id: 'PED002',
    cliente: 'Comercial Los Andes',
    codigoCliente: 'CLI002',
    direccion: 'Calle 23, Centro Comercial',
    ciudad: 'Caracas',
    zona: 'Oeste',
    telefono: '0212-5554321',
    coordenadas: { lat: 10.4715, lng: -66.9190 },
    productos: ['Producto C x20'],
    peso: '600 kg',
    volumen: '3.0 m³',
    prioridad: 'Media',
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString().split('T')[0],
    horaEstimada: '10:30',
    camionAsignado: null,
    vendedorAsignado: 'María González'
  },
  {
    id: 'PED003',
    cliente: 'Supermercado La Esquina',
    codigoCliente: 'CLI003',
    direccion: 'Av. Principal de Las Mercedes',
    ciudad: 'Caracas',
    zona: 'Este',
    telefono: '0212-3332211',
    coordenadas: { lat: 10.4918, lng: -66.8553 },
    productos: ['Producto A x15', 'Producto D x8'],
    peso: '520 kg',
    volumen: '2.8 m³',
    prioridad: 'Alta',
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString().split('T')[0],
    horaEstimada: '11:00',
    camionAsignado: null,
    vendedorAsignado: 'Juan Pérez'
  },
  {
    id: 'PED004',
    cliente: 'Abastos Central',
    codigoCliente: 'CLI004',
    direccion: 'Mercado Municipal, Catia',
    ciudad: 'Caracas',
    zona: 'Oeste',
    telefono: '0212-7778899',
    coordenadas: { lat: 10.4850, lng: -66.9520 },
    productos: ['Producto B x12', 'Producto C x10'],
    peso: '380 kg',
    volumen: '2.0 m³',
    prioridad: 'Media',
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString().split('T')[0],
    horaEstimada: '14:00',
    camionAsignado: null,
    vendedorAsignado: 'Carlos Rodríguez'
  },
  {
    id: 'PED005',
    cliente: 'Bodega Mi Preferida',
    codigoCliente: 'CLI005',
    direccion: 'Av. Libertador, El Recreo',
    ciudad: 'Caracas',
    zona: 'Centro',
    telefono: '0212-4445566',
    coordenadas: { lat: 10.4926, lng: -66.8750 },
    productos: ['Producto A x8'],
    peso: '280 kg',
    volumen: '1.5 m³',
    prioridad: 'Baja',
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString().split('T')[0],
    horaEstimada: '15:30',
    camionAsignado: null,
    vendedorAsignado: 'María González'
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
