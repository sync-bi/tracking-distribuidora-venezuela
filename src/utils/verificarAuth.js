// src/utils/verificarAuth.js
import { getAuth } from 'firebase/auth';

/**
 * Verifica el estado de autenticación actual
 * Ejecutar desde consola: verificarAuth()
 */
export const verificarAuth = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  console.log('🔐 ESTADO DE AUTENTICACIÓN');
  console.log('===========================\n');

  if (!user) {
    console.error('❌ NO HAY USUARIO AUTENTICADO');
    console.error('');
    console.error('📋 Acciones:');
    console.error('   1. Cierra sesión si estás logueado');
    console.error('   2. Vuelve a iniciar sesión');
    console.error('   3. Ejecuta verificarAuth() nuevamente');
    return null;
  }

  console.log('✅ Usuario autenticado correctamente\n');
  console.log('📊 Información del usuario:');
  console.log('   UID:', user.uid);
  console.log('   Email:', user.email);
  console.log('   Email verificado:', user.emailVerified);
  console.log('   Creado:', new Date(user.metadata.creationTime).toLocaleString());
  console.log('   Último acceso:', new Date(user.metadata.lastSignInTime).toLocaleString());

  console.log('\n🎫 Token de autenticación:');
  user.getIdToken(true).then(token => {
    console.log('   Token generado:', token.substring(0, 50) + '...');
    console.log('   Longitud:', token.length, 'caracteres');

    // Decodificar el token para ver claims
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      console.log('\n📋 Claims del token:');
      console.log('   user_id:', payload.user_id);
      console.log('   email:', payload.email);
      console.log('   auth_time:', new Date(payload.auth_time * 1000).toLocaleString());
      console.log('   exp:', new Date(payload.exp * 1000).toLocaleString());

      if (payload.admin) {
        console.log('   🔑 Custom claims: admin =', payload.admin);
      } else {
        console.log('   ⚠️  No tiene custom claims configurados');
      }
    } catch (e) {
      console.error('   Error decodificando token:', e);
    }
  });

  console.log('\n💡 Siguiente paso:');
  console.log('   Si todo se ve bien, ejecuta: testFirestorePermisos()');

  return user;
};

// Exportar a window para uso desde consola
window.verificarAuth = verificarAuth;

console.log('🔧 Función de verificación cargada. Ejecuta: verificarAuth()');
