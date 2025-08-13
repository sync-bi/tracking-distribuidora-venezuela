// src/data/mockDataConductores.js
export const conductoresIniciales = [
  {
    id: 'COND001',
    nombre: 'Carlos Rodríguez',
    cedula: 'V-12345678',
    licencia: 'D-12345678',
    telefono: '+58-412-1234567',
    email: 'carlos.rodriguez@sarego.com',
    estado: 'Disponible',
    experiencia: '5 años',
    calificacion: 4.8,
    camionAsignado: null
  },
  {
    id: 'COND002',
    nombre: 'María González',
    cedula: 'V-87654321',
    licencia: 'D-87654321',
    telefono: '+58-424-7654321',
    email: 'maria.gonzalez@sarego.com',
    estado: 'Asignado',
    experiencia: '3 años',
    calificacion: 4.9,
    camionAsignado: 'CAM001'
  },
  {
    id: 'COND003',
    nombre: 'José Martínez',
    cedula: 'V-11223344',
    licencia: 'D-11223344',
    telefono: '+58-416-2233445',
    email: 'jose.martinez@sarego.com',
    estado: 'Disponible',
    experiencia: '7 años',
    calificacion: 4.7,
    camionAsignado: null
  },
  {
    id: 'COND004',
    nombre: 'Ana Pérez',
    cedula: 'V-55667788',
    licencia: 'D-55667788',
    telefono: '+58-426-5566778',
    email: 'ana.perez@sarego.com',
    estado: 'Descanso',
    experiencia: '2 años',
    calificacion: 4.6,
    camionAsignado: null
  }
];

export const estadosConductor = ['Disponible', 'Asignado', 'Descanso', 'Vacaciones'];