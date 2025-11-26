# 🚀 Guía de Configuración Firebase - Paso a Paso

## 📋 Índice
1. [Crear Proyecto Firebase](#1-crear-proyecto-firebase)
2. [Configurar Authentication](#2-configurar-authentication)
3. [Configurar Firestore](#3-configurar-firestore)
4. [Configurar Realtime Database](#4-configurar-realtime-database)
5. [Obtener Credenciales](#5-obtener-credenciales)
6. [Configurar Variables de Entorno](#6-configurar-variables-de-entorno)
7. [Inicializar Datos](#7-inicializar-datos)
8. [Aplicar Reglas de Seguridad](#8-aplicar-reglas-de-seguridad)
9. [Verificar Configuración](#9-verificar-configuración)

---

## 1. Crear Proyecto Firebase

### Paso 1.1: Acceder a Firebase Console
1. Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Click en **"Agregar proyecto"** o **"Create a project"**

### Paso 1.2: Configurar Proyecto
1. **Nombre del proyecto:** `tracking-distribuidora-sarego`
2. Click **"Continuar"**
3. **Google Analytics:**
   - Puedes deshabilitarlo para empezar más rápido
   - O habilitarlo si quieres analytics (recomendado)
4. Click **"Crear proyecto"**
5. Espera 30-60 segundos mientras se crea
6. Click **"Continuar"**

---

## 2. Configurar Authentication

### Paso 2.1: Habilitar Authentication
1. En el menú lateral, click en **"Authentication"**
2. Click **"Get started"** o **"Empezar"**
3. Verás la pestaña **"Sign-in method"**

### Paso 2.2: Habilitar Email/Password
1. Click en **"Email/Password"**
2. Toggle **"Enable"** (Habilitar)
3. **NO habilites** "Email link (passwordless sign-in)" por ahora
4. Click **"Save"** (Guardar)

### Paso 2.3: Crear Usuarios Iniciales
1. Ve a la pestaña **"Users"**
2. Click **"Add user"** (Agregar usuario)

**Usuario 1 - Administrador:**
```
Email: admin@sarego.com
Password: Admin123!
```
✅ Click **"Add user"**

**Usuario 2 - Operador:**
```
Email: operador@sarego.com
Password: Operador123!
```
✅ Click **"Add user"**

**Usuario 3 - Conductor:**
```
Email: conductor@sarego.com
Password: Conductor123!
```
✅ Click **"Add user"**

**⚠️ IMPORTANTE:** Copia los **UIDs** de cada usuario. Los necesitarás en el siguiente paso.

---

## 3. Configurar Firestore

### Paso 3.1: Crear Firestore Database
1. En el menú lateral, click en **"Firestore Database"**
2. Click **"Create database"** (Crear base de datos)

### Paso 3.2: Modo de Seguridad
Selecciona **"Start in production mode"** (Modo producción)
- ✅ Más seguro
- Configuraremos las reglas manualmente después

Click **"Next"**

### Paso 3.3: Ubicación
1. Selecciona la ubicación más cercana:
   - **Recomendado para Venezuela:** `us-east1` (South Carolina)
   - También funciona: `southamerica-east1` (São Paulo, Brasil)
2. ⚠️ **IMPORTANTE:** La ubicación NO se puede cambiar después
3. Click **"Enable"** (Habilitar)
4. Espera 1-2 minutos mientras se crea la base de datos

### Paso 3.4: Crear Colecciones y Documentos de Prueba

#### Crear Colección "usuarios"
1. Click **"Start collection"** (Iniciar colección)
2. **Collection ID:** `usuarios`
3. Click **"Next"**

#### Crear Documento Admin
1. **Document ID:** Pega el **UID del usuario admin** que copiaste antes
2. Agrega estos campos (click "Add field"):

| Field | Type | Value |
|-------|------|-------|
| `uid` | string | [UID del admin] |
| `nombre` | string | `Administrador` |
| `email` | string | `admin@sarego.com` |
| `rol` | string | `admin` |
| `activo` | boolean | `true` |
| `fechaCreacion` | timestamp | [Click en "Set to current time"] |
| `ultimoAcceso` | timestamp | [Click en "Set to current time"] |

3. Click **"Save"**

#### Crear Documentos para Operador y Conductor
Repite el proceso anterior para:
- **UID del operador** con `rol: "operador"`
- **UID del conductor** con `rol: "conductor"`

#### Crear Colección "camiones"
1. Click **"Start collection"**
2. **Collection ID:** `camiones`
3. **Document ID:** `CAM101`
4. Agrega campos:

```json
{
  "id": "CAM101",
  "placa": "VAA-101",
  "capacidad": "3000 kg",
  "conductor": "",
  "conductorId": null,
  "estado": "Disponible",
  "ubicacionActual": {
    "lat": 10.4806,
    "lng": -66.9036
  },
  "direccionActual": "Depósito Central, Caracas",
  "pedidosAsignados": [],
  "velocidad": "0 km/h",
  "combustible": "100%",
  "trackingActivo": false,
  "ultimaActualizacion": [timestamp]
}
```

5. Repite para `CAM102` y `CAM103` (cambia coordenadas según ciudad)

#### Crear Colección "conductores"
1. **Collection ID:** `conductores`
2. **Document ID:** `COND001`
3. Campos:

```json
{
  "id": "COND001",
  "nombre": "Juan Pérez",
  "cedula": "V-12345678",
  "telefono": "+58-412-1234567",
  "email": "conductor@sarego.com",
  "licencia": "123456",
  "estado": "Disponible",
  "camionAsignado": null,
  "despachosCompletados": 0,
  "calificacionPromedio": 5.0,
  "fechaIngreso": [timestamp]
}
```

---

## 4. Configurar Realtime Database

### Paso 4.1: Crear Realtime Database
1. En el menú lateral, click en **"Realtime Database"**
2. Click **"Create Database"**

### Paso 4.2: Configuración
1. **Ubicación:** Usa la misma que elegiste para Firestore
2. **Security rules:** Selecciona **"Start in locked mode"**
3. Click **"Enable"**

### Paso 4.3: Aplicar Reglas de Seguridad
1. Ve a la pestaña **"Rules"**
2. Reemplaza el contenido con:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",

    "vehiculos": {
      "$vehiculoId": {
        "posicion": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },

    "despachos": {
      "$despachoId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

3. Click **"Publish"** (Publicar)

---

## 5. Obtener Credenciales

### Paso 5.1: Registrar App Web
1. En la página principal de Firebase, busca **"Get started by adding Firebase to your app"**
2. Click en el ícono **</> Web**
3. **App nickname:** `tracking-web`
4. ✅ Check **"Also set up Firebase Hosting"** (opcional)
5. Click **"Register app"**

### Paso 5.2: Copiar Configuración
Verás algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "tracking-distribuidora.firebaseapp.com",
  databaseURL: "https://tracking-distribuidora-default-rtdb.firebaseio.com",
  projectId: "tracking-distribuidora",
  storageBucket: "tracking-distribuidora.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**⚠️ ¡COPIA ESTOS VALORES! Los necesitarás en el siguiente paso.**

---

## 6. Configurar Variables de Entorno

### Paso 6.1: Editar .env.local
1. Abre el archivo `.env.local` en la raíz del proyecto
2. Reemplaza o agrega estas variables con TUS valores de Firebase:

```env
# ==========================================
# FIREBASE CONFIGURATION
# ==========================================
REACT_APP_FIREBASE_API_KEY=AIzaSyC...
REACT_APP_FIREBASE_AUTH_DOMAIN=tracking-distribuidora.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://tracking-distribuidora-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=tracking-distribuidora
REACT_APP_FIREBASE_STORAGE_BUCKET=tracking-distribuidora.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# ==========================================
# MAPBOX CONFIGURATION
# ==========================================
REACT_APP_MAPBOX_TOKEN=pk.eyJ1... (tu token actual de Mapbox)

# ==========================================
# APP CONFIGURATION
# ==========================================
REACT_APP_AUTOLOAD_PEDIDOS=false
REACT_APP_ALLOW_MANUAL_IMPORT=true
```

### Paso 6.2: Guardar y Reiniciar
1. Guarda el archivo `.env.local`
2. **IMPORTANTE:** Detén el servidor de desarrollo (`Ctrl + C`)
3. Reinicia el servidor: `npm start`

---

## 7. Inicializar Datos

### Opción A: Usar el Script de Inicialización (Recomendado)

#### Paso 7.1: Crear Script de Inicialización
Crea el archivo `src/utils/inicializarFirebase.js`:

```javascript
import {
  inicializarCamiones,
  inicializarConductores,
  crearPedido
} from '../services/firestoreService';
import { camionesIniciales } from '../data/mockData';
import { conductoresIniciales } from '../data/mockDataConductores';

export const inicializarDatos = async () => {
  console.log('🚀 Inicializando datos en Firestore...');

  try {
    // Inicializar camiones
    await inicializarCamiones(camionesIniciales);
    console.log('✅ Camiones inicializados');

    // Inicializar conductores
    await inicializarConductores(conductoresIniciales);
    console.log('✅ Conductores inicializados');

    console.log('🎉 Inicialización completada');
    return true;
  } catch (error) {
    console.error('❌ Error en inicialización:', error);
    return false;
  }
};
```

#### Paso 7.2: Ejecutar Inicialización
1. Agrega un botón temporal en tu app o ejecuta desde la consola del navegador:

```javascript
// En la consola del navegador (F12):
import { inicializarDatos } from './utils/inicializarFirebase';
inicializarDatos();
```

2. O crea un componente temporal:

```jsx
// src/components/Admin/InicializarDatos.js
import { inicializarDatos } from '../../utils/inicializarFirebase';

export const InicializarDatos = () => {
  const handleInicializar = async () => {
    const exito = await inicializarDatos();
    if (exito) {
      alert('✅ Datos inicializados correctamente');
    } else {
      alert('❌ Error al inicializar datos');
    }
  };

  return (
    <button onClick={handleInicializar}>
      Inicializar Datos en Firebase
    </button>
  );
};
```

### Opción B: Importar Pedidos desde Excel
1. Ve a la pestaña **"Pedidos"**
2. Click en **"Importar Pedidos"**
3. Selecciona tu archivo `Pedidos.xlsx`
4. Los pedidos se subirán automáticamente a Firestore

---

## 8. Aplicar Reglas de Seguridad

### Paso 8.1: Reglas de Firestore
1. Ve a **Firestore Database** → **Rules**
2. Copia las reglas del archivo `ARQUITECTURA_FIREBASE.md` (sección "Reglas de Seguridad")
3. Pega en el editor
4. Click **"Publish"**

**⚠️ Verifica que no hay errores de sintaxis antes de publicar**

---

## 9. Verificar Configuración

### Checklist de Verificación

#### ✅ Firebase Console
- [ ] Proyecto creado
- [ ] Authentication habilitado
- [ ] 3 usuarios creados (admin, operador, conductor)
- [ ] Firestore Database creado
- [ ] Colección "usuarios" con 3 documentos
- [ ] Colección "camiones" con 3 documentos
- [ ] Colección "conductores" con al menos 1 documento
- [ ] Realtime Database creado
- [ ] Reglas de seguridad aplicadas (Firestore y Realtime)

#### ✅ Aplicación Local
- [ ] `.env.local` actualizado con credenciales de Firebase
- [ ] Servidor reiniciado después de cambiar `.env.local`
- [ ] Console del navegador muestra "✅ Firestore inicializado correctamente"
- [ ] Console del navegador muestra "✅ Firebase inicializado correctamente"
- [ ] No hay errores en la consola relacionados con Firebase

### Prueba de Conexión

#### Test 1: Login
1. Abre la aplicación: `http://localhost:3000`
2. Ingresa:
   - **Email:** `admin@sarego.com`
   - **Password:** `Admin123!`
3. ✅ Deberías poder iniciar sesión

#### Test 2: Crear Pedido
1. Ve a la pestaña **"Pedidos"**
2. Click **"Nuevo Pedido"**
3. Llena el formulario
4. Click **"Guardar"**
5. ✅ Verifica en Firebase Console → Firestore → colección "pedidos" que aparezca

#### Test 3: Modificar Ubicación
1. Ve a la pestaña **"Ubicaciones"**
2. Arrastra un marcador en el mapa
3. ✅ Verifica en Firebase Console que las coordenadas se actualizaron
4. ✅ Verifica que existe una subcolección "historialUbicaciones" con el cambio

---

## 🎉 ¡Configuración Completada!

Si todos los checks están ✅, tu sistema está completamente configurado con:

- ✅ Persistencia de datos
- ✅ Sincronización en tiempo real
- ✅ Historial de cambios
- ✅ Auditoría completa
- ✅ Multi-usuario
- ✅ Seguridad configurada

---

## 🆘 Troubleshooting

### Problema: "Firestore no inicializado"
**Solución:**
1. Verifica que `.env.local` tiene TODAS las variables
2. Reinicia el servidor: `Ctrl + C` → `npm start`
3. Limpia caché del navegador (Ctrl + Shift + Delete)

### Problema: "Permission denied" en Firestore
**Solución:**
1. Verifica que las reglas están publicadas
2. Verifica que el usuario está autenticado
3. Verifica que el rol del usuario en `/usuarios/{uid}` es correcto

### Problema: No se sincronizan los datos
**Solución:**
1. Abre DevTools → Console
2. Busca errores de Firebase
3. Verifica que `isFirestoreAvailable()` retorna `true`
4. Verifica la conexión a internet

### Problema: Errores de CORS
**Solución:**
1. Ve a Firebase Console → Authentication → Settings
2. En "Authorized domains", agrega `localhost`

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Revisa la consola de Firebase Console
3. Consulta la documentación oficial: [https://firebase.google.com/docs](https://firebase.google.com/docs)

---

**Última actualización:** 2025-01-18
**Versión:** 1.0
