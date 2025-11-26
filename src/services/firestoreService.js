// src/services/firestoreService.js
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  addDoc,
  Timestamp
} from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Verificar si Firebase está configurado
const isConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId
  );
};

// Inicializar Firebase
let app = null;
let db = null;

if (isConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ Firestore inicializado correctamente');
  } catch (error) {
    console.warn('⚠️ Error al inicializar Firestore:', error.message);
  }
} else {
  console.warn('⚠️ Firestore no configurado. Los datos no se persistirán.');
}

/**
 * Verifica si Firestore está disponible
 */
export const isFirestoreAvailable = () => {
  return !!db;
};

// ==========================================
// PEDIDOS
// ==========================================

/**
 * Crear un nuevo pedido
 */
export const crearPedido = async (pedidoData, userId = 'sistema') => {
  if (!db) {
    console.warn('Firestore no disponible, guardando solo en memoria');
    return null;
  }

  try {
    const pedidoRef = doc(collection(db, 'pedidos'));
    const pedido = {
      ...pedidoData,
      id: pedidoRef.id,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
      creadoPor: userId,
      actualizadoPor: userId
    };

    await setDoc(pedidoRef, pedido);

    // Registrar en auditoría
    await registrarAuditoria('crear', 'pedido', pedidoRef.id, userId, null, pedido);

    console.log('✅ Pedido creado:', pedidoRef.id);
    return { ...pedido, id: pedidoRef.id };
  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    throw error;
  }
};

/**
 * Obtener todos los pedidos
 */
export const obtenerPedidos = async () => {
  if (!db) return [];

  try {
    const pedidosRef = collection(db, 'pedidos');
    const snapshot = await getDocs(pedidosRef);
    const pedidos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Obtenidos ${pedidos.length} pedidos`);
    return pedidos;
  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error);
    return [];
  }
};

/**
 * Escuchar cambios en pedidos en tiempo real
 */
export const escucharPedidos = (callback) => {
  if (!db) {
    console.warn('Firestore no disponible');
    return () => {};
  }

  const pedidosRef = collection(db, 'pedidos');
  const q = query(pedidosRef, orderBy('fechaCreacion', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const pedidos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(pedidos);
  }, (error) => {
    console.error('❌ Error en listener de pedidos:', error);
  });
};

/**
 * Actualizar pedido
 */
export const actualizarPedido = async (pedidoId, datos, userId = 'sistema') => {
  if (!db) return;

  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);

    // Obtener datos anteriores para auditoría
    const pedidoDoc = await getDoc(pedidoRef);
    const datosAnteriores = pedidoDoc.data();

    const actualizacion = {
      ...datos,
      fechaActualizacion: serverTimestamp(),
      actualizadoPor: userId
    };

    await updateDoc(pedidoRef, actualizacion);

    // Registrar en auditoría
    await registrarAuditoria('actualizar', 'pedido', pedidoId, userId, datosAnteriores, datos);

    console.log('✅ Pedido actualizado:', pedidoId);
  } catch (error) {
    console.error('❌ Error al actualizar pedido:', error);
    throw error;
  }
};

/**
 * Actualizar ubicación de pedido con historial
 */
export const actualizarUbicacionPedido = async (
  pedidoId,
  nuevaUbicacion,
  userId = 'sistema',
  metodo = 'manual',
  razon = ''
) => {
  if (!db) return;

  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    const pedidoData = pedidoDoc.data();

    // Guardar en historial de ubicaciones
    const historialRef = collection(db, 'pedidos', pedidoId, 'historialUbicaciones');
    await addDoc(historialRef, {
      latAnterior: pedidoData.coordenadas?.lat || null,
      lngAnterior: pedidoData.coordenadas?.lng || null,
      latNueva: nuevaUbicacion.lat,
      lngNueva: nuevaUbicacion.lng,
      direccionAnterior: pedidoData.direccion || '',
      direccionNueva: nuevaUbicacion.direccion || pedidoData.direccion || '',
      ciudadAnterior: pedidoData.ciudad || '',
      ciudadNueva: nuevaUbicacion.ciudad || pedidoData.ciudad || '',
      fecha: serverTimestamp(),
      usuario: userId,
      razon,
      metodo
    });

    // Actualizar pedido
    await updateDoc(pedidoRef, {
      coordenadas: {
        lat: nuevaUbicacion.lat,
        lng: nuevaUbicacion.lng,
        corregida: nuevaUbicacion.corregida || false
      },
      ...(nuevaUbicacion.direccion && { direccion: nuevaUbicacion.direccion }),
      ...(nuevaUbicacion.ciudad && { ciudad: nuevaUbicacion.ciudad }),
      fechaActualizacion: serverTimestamp(),
      actualizadoPor: userId
    });

    console.log('✅ Ubicación actualizada con historial:', pedidoId);
  } catch (error) {
    console.error('❌ Error al actualizar ubicación:', error);
    throw error;
  }
};

/**
 * Actualizar estado de pedido con historial
 */
export const actualizarEstadoPedido = async (
  pedidoId,
  nuevoEstado,
  userId = 'sistema',
  observaciones = ''
) => {
  if (!db) return;

  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    const pedidoData = pedidoDoc.data();

    // Guardar en historial de estados
    const historialRef = collection(db, 'pedidos', pedidoId, 'historialEstados');
    await addDoc(historialRef, {
      estadoAnterior: pedidoData.estado,
      estadoNuevo: nuevoEstado,
      fecha: serverTimestamp(),
      usuario: userId,
      observaciones
    });

    // Actualizar pedido
    await updateDoc(pedidoRef, {
      estado: nuevoEstado,
      fechaActualizacion: serverTimestamp(),
      actualizadoPor: userId
    });

    console.log('✅ Estado actualizado con historial:', pedidoId);
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
    throw error;
  }
};

/**
 * Eliminar pedido
 */
export const eliminarPedido = async (pedidoId, userId = 'sistema') => {
  if (!db) return;

  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    const datosAnteriores = pedidoDoc.data();

    await deleteDoc(pedidoRef);

    // Registrar en auditoría
    await registrarAuditoria('eliminar', 'pedido', pedidoId, userId, datosAnteriores, null);

    console.log('✅ Pedido eliminado:', pedidoId);
  } catch (error) {
    console.error('❌ Error al eliminar pedido:', error);
    throw error;
  }
};

/**
 * Obtener historial de ubicaciones de un pedido
 */
export const obtenerHistorialUbicaciones = async (pedidoId) => {
  if (!db) return [];

  try {
    const historialRef = collection(db, 'pedidos', pedidoId, 'historialUbicaciones');
    const q = query(historialRef, orderBy('fecha', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error al obtener historial de ubicaciones:', error);
    return [];
  }
};

// ==========================================
// DESPACHOS
// ==========================================

/**
 * Crear despacho
 */
export const crearDespacho = async (despachoData, userId = 'sistema') => {
  if (!db) return null;

  try {
    const batch = writeBatch(db);

    // Crear despacho
    const despachoRef = doc(collection(db, 'despachos'));
    const despacho = {
      ...despachoData,
      id: despachoRef.id,
      fechaCreacion: serverTimestamp(),
      creadoPor: userId,
      estado: 'Planificado',
      progreso: 0
    };
    batch.set(despachoRef, despacho);

    // Actualizar pedidos a estado "Asignado"
    if (despachoData.pedidosIds && despachoData.pedidosIds.length > 0) {
      for (const pedidoId of despachoData.pedidosIds) {
        const pedidoRef = doc(db, 'pedidos', pedidoId);
        batch.update(pedidoRef, {
          estado: 'Asignado',
          camionAsignado: despachoData.camionId,
          fechaActualizacion: serverTimestamp(),
          actualizadoPor: userId
        });
      }
    }

    // Actualizar camión a estado "Asignado"
    const camionRef = doc(db, 'camiones', despachoData.camionId);
    batch.update(camionRef, {
      estado: 'Asignado',
      pedidosAsignados: despachoData.pedidosIds || [],
      ultimaActualizacion: serverTimestamp()
    });

    // Actualizar conductor a estado "Asignado"
    if (despachoData.conductorId) {
      const conductorRef = doc(db, 'conductores', despachoData.conductorId);
      batch.update(conductorRef, {
        estado: 'Asignado',
        camionAsignado: despachoData.camionId
      });
    }

    await batch.commit();

    // Registrar en auditoría
    await registrarAuditoria('crear', 'despacho', despachoRef.id, userId, null, despacho);

    console.log('✅ Despacho creado:', despachoRef.id);
    return { ...despacho, id: despachoRef.id };
  } catch (error) {
    console.error('❌ Error al crear despacho:', error);
    throw error;
  }
};

/**
 * Escuchar cambios en despachos
 */
export const escucharDespachos = (callback) => {
  if (!db) return () => {};

  const despachosRef = collection(db, 'despachos');
  const q = query(despachosRef, orderBy('fechaCreacion', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const despachos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(despachos);
  });
};

/**
 * Actualizar despacho
 */
export const actualizarDespacho = async (despachoId, datos, userId = 'sistema') => {
  if (!db) return;

  try {
    const despachoRef = doc(db, 'despachos', despachoId);
    await updateDoc(despachoRef, {
      ...datos,
      fechaActualizacion: serverTimestamp()
    });

    console.log('✅ Despacho actualizado:', despachoId);
  } catch (error) {
    console.error('❌ Error al actualizar despacho:', error);
    throw error;
  }
};

// ==========================================
// CAMIONES
// ==========================================

/**
 * Obtener camiones
 */
export const obtenerCamiones = async () => {
  if (!db) return [];

  try {
    const camionesRef = collection(db, 'camiones');
    const snapshot = await getDocs(camionesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error al obtener camiones:', error);
    return [];
  }
};

/**
 * Escuchar cambios en camiones
 */
export const escucharCamiones = (callback) => {
  if (!db) return () => {};

  const camionesRef = collection(db, 'camiones');

  return onSnapshot(camionesRef, (snapshot) => {
    const camiones = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(camiones);
  });
};

/**
 * Actualizar camión
 */
export const actualizarCamion = async (camionId, datos) => {
  if (!db) return;

  try {
    const camionRef = doc(db, 'camiones', camionId);
    await updateDoc(camionRef, {
      ...datos,
      ultimaActualizacion: serverTimestamp()
    });

    console.log('✅ Camión actualizado:', camionId);
  } catch (error) {
    console.error('❌ Error al actualizar camión:', error);
    throw error;
  }
};

// ==========================================
// CONDUCTORES
// ==========================================

/**
 * Obtener conductores
 */
export const obtenerConductores = async () => {
  if (!db) return [];

  try {
    const conductoresRef = collection(db, 'conductores');
    const snapshot = await getDocs(conductoresRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error al obtener conductores:', error);
    return [];
  }
};

/**
 * Escuchar cambios en conductores
 */
export const escucharConductores = (callback) => {
  if (!db) return () => {};

  const conductoresRef = collection(db, 'conductores');

  return onSnapshot(conductoresRef, (snapshot) => {
    const conductores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(conductores);
  });
};

// ==========================================
// AUDITORÍA
// ==========================================

/**
 * Registrar acción en auditoría
 */
export const registrarAuditoria = async (
  accion,
  entidad,
  entidadId,
  usuario,
  datosAntes,
  datosDespues
) => {
  if (!db) return;

  try {
    const auditoriaRef = collection(db, 'auditoria');
    await addDoc(auditoriaRef, {
      accion,
      entidad,
      entidadId,
      usuario,
      datosAntes,
      datosDespues,
      timestamp: serverTimestamp(),
      ip: 'N/A', // Puede obtenerse del servidor
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.error('❌ Error al registrar auditoría:', error);
  }
};

/**
 * Obtener auditoría de una entidad
 */
export const obtenerAuditoria = async (entidad, entidadId, limite = 50) => {
  if (!db) return [];

  try {
    const auditoriaRef = collection(db, 'auditoria');
    const q = query(
      auditoriaRef,
      where('entidad', '==', entidad),
      where('entidadId', '==', entidadId),
      orderBy('timestamp', 'desc'),
      limit(limite)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error al obtener auditoría:', error);
    return [];
  }
};

// ==========================================
// INICIALIZACIÓN DE DATOS
// ==========================================

/**
 * Inicializar camiones en Firestore (solo una vez)
 */
export const inicializarCamiones = async (camiones) => {
  if (!db) {
    throw new Error('Firestore no está inicializado');
  }

  const batch = writeBatch(db);

  camiones.forEach(camion => {
    const camionRef = doc(db, 'camiones', camion.id);
    batch.set(camionRef, {
      ...camion,
      ultimaActualizacion: serverTimestamp()
    });
  });

  await batch.commit();
  console.log('✅ Camiones inicializados en Firestore');
};

/**
 * Inicializar conductores en Firestore
 */
export const inicializarConductores = async (conductores) => {
  if (!db) {
    throw new Error('Firestore no está inicializado');
  }

  const batch = writeBatch(db);

  conductores.forEach(conductor => {
    const conductorRef = doc(db, 'conductores', conductor.id);
    batch.set(conductorRef, {
      ...conductor,
      fechaIngreso: serverTimestamp()
    });
  });

  await batch.commit();
  console.log('✅ Conductores inicializados en Firestore');
};

// Exportar todo
export default {
  isFirestoreAvailable,
  // Pedidos
  crearPedido,
  obtenerPedidos,
  escucharPedidos,
  actualizarPedido,
  actualizarUbicacionPedido,
  actualizarEstadoPedido,
  eliminarPedido,
  obtenerHistorialUbicaciones,
  // Despachos
  crearDespacho,
  escucharDespachos,
  actualizarDespacho,
  // Camiones
  obtenerCamiones,
  escucharCamiones,
  actualizarCamion,
  // Conductores
  obtenerConductores,
  escucharConductores,
  // Auditoría
  registrarAuditoria,
  obtenerAuditoria,
  // Inicialización
  inicializarCamiones,
  inicializarConductores
};
