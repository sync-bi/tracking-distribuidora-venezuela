// src/services/firebase.js
// Servicio de Firebase para sincronización en tiempo real

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, serverTimestamp } from 'firebase/database';

// Configuración de Firebase desde variables de entorno
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
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId
  );
};

// Inicializar Firebase solo si está configurado
let app = null;
let database = null;

if (isConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('✅ Firebase inicializado correctamente');
  } catch (error) {
    console.warn('⚠️ Error al inicializar Firebase:', error.message);
  }
} else {
  console.warn('⚠️ Firebase no configurado. El sistema funcionará sin sincronización en tiempo real.');
}

/**
 * Verifica si Firebase está disponible
 */
export const isFirebaseAvailable = () => {
  return !!database;
};

/**
 * Actualiza la posición de un vehículo en Firebase
 * @param {string} vehiculoId - ID del vehículo
 * @param {object} posicion - Objeto con lat, lng, velocidad, heading
 */
export const actualizarPosicionVehiculo = async (vehiculoId, posicion) => {
  if (!database) {
    console.log('Firebase no está disponible, guardando solo localmente');
    return;
  }

  try {
    const vehiculoRef = ref(database, `vehiculos/${vehiculoId}/posicion`);
    await set(vehiculoRef, {
      lat: posicion.lat,
      lng: posicion.lng,
      velocidad: posicion.velocidad || 0,
      heading: posicion.heading || 0,
      timestamp: serverTimestamp(),
      ultimaActualizacion: new Date().toISOString()
    });
    console.log(`📍 Posición actualizada: ${vehiculoId}`, posicion);
  } catch (error) {
    console.error('❌ Error al actualizar posición en Firebase:', error);
  }
};

/**
 * Escucha cambios en la posición de un vehículo
 * @param {string} vehiculoId - ID del vehículo
 * @param {function} callback - Función que se ejecuta cuando cambia la posición
 * @returns {function} Función para dejar de escuchar
 */
export const escucharPosicionVehiculo = (vehiculoId, callback) => {
  if (!database) {
    console.log('Firebase no está disponible, no se puede escuchar cambios');
    return () => {}; // Retornar función vacía
  }

  const vehiculoRef = ref(database, `vehiculos/${vehiculoId}/posicion`);

  const listener = onValue(vehiculoRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      console.log(`📡 Posición recibida: ${vehiculoId}`, data);
      callback(data);
    }
  });

  // Retornar función para dejar de escuchar
  return () => {
    off(vehiculoRef, 'value', listener);
  };
};

/**
 * Actualiza un despacho en Firebase
 * @param {string} despachoId - ID del despacho
 * @param {object} datos - Datos del despacho
 */
export const actualizarDespacho = async (despachoId, datos) => {
  if (!database) {
    console.log('Firebase no está disponible');
    return;
  }

  try {
    const despachoRef = ref(database, `despachos/${despachoId}`);
    await set(despachoRef, {
      ...datos,
      ultimaActualizacion: new Date().toISOString()
    });
    console.log(`✅ Despacho actualizado: ${despachoId}`);
  } catch (error) {
    console.error('❌ Error al actualizar despacho en Firebase:', error);
  }
};

/**
 * Escucha cambios en un despacho
 * @param {string} despachoId - ID del despacho
 * @param {function} callback - Función que se ejecuta cuando cambia el despacho
 * @returns {function} Función para dejar de escuchar
 */
export const escucharDespacho = (despachoId, callback) => {
  if (!database) {
    return () => {};
  }

  const despachoRef = ref(database, `despachos/${despachoId}`);

  const listener = onValue(despachoRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });

  return () => {
    off(despachoRef, 'value', listener);
  };
};

/**
 * Guarda una ruta optimizada en Firebase
 * @param {string} despachoId - ID del despacho
 * @param {array} ruta - Array de paradas optimizadas
 */
export const guardarRutaOptimizada = async (despachoId, ruta) => {
  if (!database) {
    return;
  }

  try {
    const rutaRef = ref(database, `despachos/${despachoId}/ruta`);
    await set(rutaRef, {
      paradas: ruta,
      timestamp: serverTimestamp(),
      totalParadas: ruta.length
    });
    console.log(`✅ Ruta optimizada guardada: ${despachoId}`);
  } catch (error) {
    console.error('❌ Error al guardar ruta:', error);
  }
};

/**
 * Registra una parada completada
 * @param {string} despachoId - ID del despacho
 * @param {string} paradaId - ID de la parada
 */
export const registrarParadaCompletada = async (despachoId, paradaId) => {
  if (!database) {
    return;
  }

  try {
    const paradaRef = ref(database, `despachos/${despachoId}/paradasCompletadas/${paradaId}`);
    await set(paradaRef, {
      completada: true,
      timestamp: serverTimestamp()
    });
    console.log(`✅ Parada completada: ${paradaId}`);
  } catch (error) {
    console.error('❌ Error al registrar parada:', error);
  }
};

export default {
  isFirebaseAvailable,
  actualizarPosicionVehiculo,
  escucharPosicionVehiculo,
  actualizarDespacho,
  escucharDespacho,
  guardarRutaOptimizada,
  registrarParadaCompletada
};
