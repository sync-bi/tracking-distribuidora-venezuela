// Script para limpiar pedidos viejos de Firestore
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Seguro: este script borra TODOS los pedidos, apuntando al proyecto que esté
// en .env.local, que normalmente es producción. Sin confirmación explícita un
// tecleo distraído se lleva los pedidos reales, así que hay que nombrar el
// proyecto a mano para poder ejecutarlo.
function verificarConfirmacion(proyectoId) {
  const confirmado = process.argv.slice(2).find(a => a.startsWith('--confirmar='));
  const nombreDado = confirmado ? confirmado.split('=')[1] : null;

  if (nombreDado === proyectoId) return;

  console.error('\n⛔ Este script ELIMINA TODOS los pedidos de Firestore.');
  console.error(`   Proyecto destino: ${proyectoId}`);
  console.error('\n   Para ejecutarlo debe confirmar nombrando el proyecto:');
  console.error(`   node scripts/limpiar-firestore.js --confirmar=${proyectoId}\n`);
  process.exit(1);
}

async function main() {
  if (!firebaseConfig.projectId) {
    console.error('⛔ Falta REACT_APP_FIREBASE_PROJECT_ID en .env.local');
    process.exit(1);
  }
  verificarConfirmacion(firebaseConfig.projectId);

  console.log('Conectando a Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Contar pedidos actuales
  const pedidosRef = collection(db, 'pedidos');
  const snapshot = await getDocs(pedidosRef);
  console.log(`📦 Pedidos en Firestore: ${snapshot.size}`);

  if (snapshot.size === 0) {
    console.log('No hay pedidos para eliminar.');
    process.exit(0);
  }

  // Eliminar en batches de 500 (límite de Firestore)
  let eliminados = 0;
  let batch = writeBatch(db);
  let count = 0;

  for (const docSnap of snapshot.docs) {
    batch.delete(doc(db, 'pedidos', docSnap.id));
    count++;
    eliminados++;

    if (count >= 400) {
      await batch.commit();
      console.log(`  🗑️ Eliminados ${eliminados}...`);
      batch = writeBatch(db);
      count = 0;
    }
  }

  // Commit del último batch
  if (count > 0) {
    await batch.commit();
  }

  console.log(`\n✅ ${eliminados} pedidos eliminados de Firestore.`);
  console.log('Ahora usa "Actualizar Pedidos" en la app para importar los pedidos reales desde SQL Server.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
