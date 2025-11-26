// src/utils/testFirestorePermisos.js
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

/**
 * Test diagnóstico para verificar permisos de Firestore
 * Ejecutar desde consola: testFirestorePermisos()
 */
export const testFirestorePermisos = async () => {
  const db = getFirestore();

  console.log('🔍 DIAGNÓSTICO DE PERMISOS FIRESTORE');
  console.log('=====================================\n');

  // Test 1: Leer colección usuarios
  console.log('📋 Test 1: Leer colección usuarios...');
  try {
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    console.log(`✅ ÉXITO - Encontrados ${usuariosSnapshot.size} usuarios`);
    usuariosSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.nombre} (${data.email}) - Rol: ${data.rol}`);
    });
  } catch (error) {
    console.error('❌ ERROR al leer usuarios:', error.message);
    console.error('   Código:', error.code);
  }

  console.log('\n');

  // Test 2: Crear un camión de prueba
  console.log('📋 Test 2: Crear documento en colección camiones...');
  try {
    const testCamionRef = doc(db, 'camiones', 'TEST_DIAGNOSTICO');
    await setDoc(testCamionRef, {
      id: 'TEST_DIAGNOSTICO',
      placa: 'TEST-001',
      capacidad: '1000 kg',
      estado: 'Disponible',
      modelo: 'Test Model',
      marca: 'Test Brand',
      fechaCreacion: new Date().toISOString(),
      test: true
    });
    console.log('✅ ÉXITO - Camión de prueba creado');

    // Verificar que se creó
    const docSnap = await getDoc(testCamionRef);
    if (docSnap.exists()) {
      console.log('✅ VERIFICADO - Documento existe en Firestore');
      console.log('   Datos:', docSnap.data());
    }
  } catch (error) {
    console.error('❌ ERROR al crear camión:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalles completos:', error);
  }

  console.log('\n');

  // Test 3: Crear un conductor de prueba
  console.log('📋 Test 3: Crear documento en colección conductores...');
  try {
    const testConductorRef = doc(db, 'conductores', 'TEST_DIAGNOSTICO');
    await setDoc(testConductorRef, {
      id: 'TEST_DIAGNOSTICO',
      nombre: 'Test Driver',
      cedula: '00000000',
      telefono: '0000000000',
      activo: true,
      fechaCreacion: new Date().toISOString(),
      test: true
    });
    console.log('✅ ÉXITO - Conductor de prueba creado');

    // Verificar que se creó
    const docSnap = await getDoc(testConductorRef);
    if (docSnap.exists()) {
      console.log('✅ VERIFICADO - Documento existe en Firestore');
      console.log('   Datos:', docSnap.data());
    }
  } catch (error) {
    console.error('❌ ERROR al crear conductor:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalles completos:', error);
  }

  console.log('\n');

  // Test 4: Leer camiones existentes
  console.log('📋 Test 4: Leer colección camiones existente...');
  try {
    const camionesSnapshot = await getDocs(collection(db, 'camiones'));
    console.log(`✅ ÉXITO - Encontrados ${camionesSnapshot.size} camiones`);
    if (camionesSnapshot.size > 0) {
      camionesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.id} (${data.placa}) - Estado: ${data.estado}`);
      });
    } else {
      console.log('   ℹ️  La colección está vacía (esto es normal si no se ha inicializado)');
    }
  } catch (error) {
    console.error('❌ ERROR al leer camiones:', error.message);
    console.error('   Código:', error.code);
  }

  console.log('\n');

  // Test 5: Leer conductores existentes
  console.log('📋 Test 5: Leer colección conductores existente...');
  try {
    const conductoresSnapshot = await getDocs(collection(db, 'conductores'));
    console.log(`✅ ÉXITO - Encontrados ${conductoresSnapshot.size} conductores`);
    if (conductoresSnapshot.size > 0) {
      conductoresSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.nombre} (${data.cedula})`);
      });
    } else {
      console.log('   ℹ️  La colección está vacía (esto es normal si no se ha inicializado)');
    }
  } catch (error) {
    console.error('❌ ERROR al leer conductores:', error.message);
    console.error('   Código:', error.code);
  }

  console.log('\n');
  console.log('=====================================');
  console.log('🏁 DIAGNÓSTICO COMPLETADO');
  console.log('\n');
  console.log('💡 INTERPRETACIÓN:');
  console.log('   - Si Test 1 falla: Problema con autenticación o reglas de usuarios');
  console.log('   - Si Test 2 falla: Las reglas de Firestore no permiten crear camiones');
  console.log('   - Si Test 3 falla: Las reglas de Firestore no permiten crear conductores');
  console.log('   - Si Test 4/5 fallan: Las reglas no permiten leer colecciones');
  console.log('\n');
  console.log('📖 PRÓXIMOS PASOS:');
  console.log('   1. Si ves errores PERMISSION_DENIED, verifica las reglas en Firebase Console');
  console.log('   2. Si todo funciona, ejecuta: inicializarFirebase()');
  console.log('   3. Revisa GUIA_CONFIGURACION_FIREBASE.md para más ayuda');
};

// Exportar a window para uso desde consola
window.testFirestorePermisos = testFirestorePermisos;

console.log('🔧 Función de diagnóstico cargada. Ejecuta: testFirestorePermisos()');
