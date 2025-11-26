// src/utils/inicializarFirebase.js
import {
  inicializarCamiones,
  inicializarConductores
} from '../services/firestoreService';
import { camionesIniciales } from '../data/mockData';
import { conductoresIniciales } from '../data/mockDataConductores';

/**
 * Inicializa los datos básicos en Firestore
 * Solo ejecutar UNA VEZ cuando configuras Firebase por primera vez
 */
export const inicializarDatos = async () => {
  console.log('🚀 Iniciando migración a Firestore...');
  console.log('⏳ Este proceso puede tomar unos segundos...');

  let exito = true;

  // Inicializar camiones
  console.log('📦 Creando camiones en Firestore...');
  try {
    await inicializarCamiones(camionesIniciales);
    console.log('✅ Camiones creados: CAM101, CAM102, CAM103');
  } catch (error) {
    console.error('❌ Error al crear camiones:', error.message);
    exito = false;
  }

  // Inicializar conductores
  console.log('👥 Creando conductores en Firestore...');
  try {
    await inicializarConductores(conductoresIniciales);
    console.log('✅ Conductores creados');
  } catch (error) {
    console.error('❌ Error al crear conductores:', error.message);
    exito = false;
  }

  console.log('');

  if (exito) {
    console.log('🎉 ¡Inicialización completada exitosamente!');
    console.log('');
    console.log('📋 Resumen:');
    console.log('   - Camiones: 3 (CAM101, CAM102, CAM103)');
    console.log('   - Conductores: ' + conductoresIniciales.length);
    console.log('');
    console.log('💡 Ahora puedes:');
    console.log('   1. Verificar en Firebase Console que los datos aparecen');
    console.log('   2. Importar pedidos desde Excel');
    console.log('   3. Empezar a usar el sistema');
  } else {
    console.error('⚠️ Inicialización completada con ERRORES');
    console.error('');
    console.error('🔍 Posibles causas:');
    console.error('   - Firebase no está configurado correctamente');
    console.error('   - Faltan variables de entorno en .env.local');
    console.error('   - No tienes permisos en Firestore (revisa las reglas)');
    console.error('');
    console.error('💡 SOLUCIÓN RECOMENDADA:');
    console.error('   1. Ejecuta: testFirestorePermisos()');
    console.error('   2. Revisa los resultados del diagnóstico');
    console.error('   3. Consulta GUIA_CONFIGURACION_FIREBASE.md para ayuda');
  }

  return exito;
};

/**
 * Función helper para ejecutar desde la consola del navegador
 */
window.inicializarFirebase = inicializarDatos;
