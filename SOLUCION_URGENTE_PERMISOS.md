# 🚨 SOLUCIÓN URGENTE - Permisos Firestore

## Problema Actual

Las reglas de Firestore están bloqueando TODAS las operaciones, incluso después de publicarlas. Esto puede deberse a:

1. Las reglas no se han propagado (puede tardar hasta 2-3 minutos)
2. Estás editando las reglas en el proyecto equivocado
3. El usuario no está realmente autenticado
4. Hay un problema de caché en el navegador

---

## ✅ PASO 1: Verificar Autenticación

Antes de tocar las reglas, verifica que estés autenticado correctamente.

### En la consola del navegador (F12), ejecuta:

```javascript
verificarAuth()
```

### Deberías ver:

```
✅ Usuario autenticado correctamente

📊 Información del usuario:
   UID: f0p9xhLCbUT7LIbnDkIs0XT1bSA2
   Email: admin@sarego.com
   Email verificado: true
```

### ❌ Si dice "NO HAY USUARIO AUTENTICADO":

1. Cierra sesión (botón en la esquina superior derecha)
2. Vuelve a iniciar sesión con:
   - Email: `admin@sarego.com`
   - Password: `Admin123!`
3. Ejecuta `verificarAuth()` nuevamente

---

## ✅ PASO 2: Verificar Proyecto Correcto en Firebase Console

**MUY IMPORTANTE**: Asegúrate de estar en el proyecto correcto.

1. Abre: https://console.firebase.google.com
2. En la parte superior, verifica que diga: **"tracking-distribuidora-sarego"**
3. Si dice otro nombre, haz click y cambia al proyecto correcto

---

## ✅ PASO 3: Aplicar Reglas Permisivas (Temporal)

### A. Ve a Firestore Database:

1. En Firebase Console, menú izquierdo → **Firestore Database**
2. Click en la pestaña **Rules** (Reglas)

### B. BORRA TODO el contenido actual

Selecciona todo (Ctrl+A) y borra.

### C. COPIA Y PEGA estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### D. Click en **Publish** (Publicar)

Deberías ver un mensaje: "Your rules have been published"

### E. ESPERA 2-3 MINUTOS (importante!)

Las reglas tardan en propagarse por los servidores de Google.

---

## ✅ PASO 4: Limpiar Caché del Navegador

Mientras esperas, limpia la caché:

1. **Opción A - Recarga forzada**:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Opción B - Limpiar caché completa**:
   - Windows: `Ctrl + Shift + Delete`
   - Mac: `Cmd + Shift + Delete`
   - Selecciona "Cached images and files"
   - Click "Clear data"

3. **Cierra sesión y vuelve a iniciar sesión**

---

## ✅ PASO 5: Probar Nuevamente

Después de esperar 2-3 minutos y limpiar caché:

1. **Refresca la página** (Ctrl + Shift + R)

2. **Inicia sesión** (si cerraste sesión)

3. **Verifica autenticación**:
   ```javascript
   verificarAuth()
   ```

4. **Ejecuta el diagnóstico**:
   ```javascript
   testFirestorePermisos()
   ```

### ✅ Resultado Esperado:

```
📋 Test 1: Leer colección usuarios...
✅ ÉXITO - Encontrados X usuarios

📋 Test 2: Crear documento en colección camiones...
✅ ÉXITO - Camión de prueba creado

📋 Test 3: Crear documento en colección conductores...
✅ ÉXITO - Conductor de prueba creado

📋 Test 4: Leer colección camiones existente...
✅ ÉXITO - Encontrados X camiones

📋 Test 5: Leer colección conductores existente...
✅ ÉXITO - Encontrados X conductores
```

---

## 🆘 Si TODAVÍA Falla Después de Esto

Hay dos posibilidades:

### Opción A: Crear las Reglas desde Cero

1. Ve a Firebase Console → Firestore Database → Rules
2. Click en el ícono de **"⋮"** (tres puntos verticales)
3. Click en **"Restore default rules"**
4. Luego modifica y pega las reglas permisivas de nuevo
5. Publica y espera 3 minutos

### Opción B: Crear Datos Manualmente (Solución Alternativa)

Si después de TODO lo anterior siguen fallando los permisos, crearemos los datos manualmente desde Firebase Console:

#### Crear Colección `camiones`:

1. Ve a Firestore Database → Data
2. Click en **"Start collection"**
3. Collection ID: `camiones`
4. Document ID: `CAM101`
5. Añade estos campos (tipo = tipo de dato):

| Campo | Tipo | Valor |
|-------|------|-------|
| id | string | CAM101 |
| placa | string | VAA-101 |
| capacidad | string | 3000 kg |
| estado | string | Disponible |
| modelo | string | Camión 3.5 Ton |
| marca | string | Chevrolet |
| conductor | string | Juan Pérez |
| pedidosAsignados | array | [] (vacío) |

6. Click "Save"

7. Añade `ubicacionActual` (tipo: map):
   - Click en "Add field"
   - Field: `ubicacionActual`
   - Type: **map**
   - Dentro del map, añade:
     - `lat` (number): `10.4806`
     - `lng` (number): `-66.9036`

8. Repite para CAM102 y CAM103

#### Crear Colección `conductores`:

1. En Firestore Database → Data
2. Click en **"Start collection"**
3. Collection ID: `conductores`
4. Document ID: `COND001`
5. Añade estos campos:

| Campo | Tipo | Valor |
|-------|------|-------|
| id | string | COND001 |
| nombre | string | Juan Pérez |
| cedula | string | 12345678 |
| telefono | string | 04141234567 |
| activo | boolean | true |

6. Click "Save"
7. Repite para COND002 y COND003

---

## 📞 Siguiente Paso

Una vez que el diagnóstico pase TODOS los tests (✅):

1. Ejecuta:
   ```javascript
   inicializarFirebase()
   ```

2. Verifica que se crearon los datos en Firebase Console

3. Refresca la app y ve a la pestaña "Camiones"

4. Deberías ver los 3 camiones listados

**Hazme saber los resultados después de seguir estos pasos.**

---

## 🐛 Debugging Avanzado

Si nada de lo anterior funciona, ejecuta esto en la consola y envíame la salida completa:

```javascript
// Ver configuración de Firebase
console.log('Firebase Config:', JSON.stringify({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY?.substring(0, 10) + '...',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN
}));

// Ver usuario actual
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('Usuario actual:', auth.currentUser?.email, auth.currentUser?.uid);

// Intentar operación simple
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const db = getFirestore();
getDocs(collection(db, 'usuarios'))
  .then(snap => console.log('✅ Usuarios leídos:', snap.size))
  .catch(err => console.error('❌ Error:', err.code, err.message));
```
