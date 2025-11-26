# 🏗️ Arquitectura Completa Firebase - Sistema de Tracking

## 📋 Índice
1. [Estructura de Firestore](#estructura-de-firestore)
2. [Reglas de Seguridad](#reglas-de-seguridad)
3. [Índices Compuestos](#índices-compuestos)
4. [Flujos de Datos](#flujos-de-datos)
5. [Configuración Paso a Paso](#configuración-paso-a-paso)

---

## 🗄️ Estructura de Firestore

### **Colecciones Principales:**

```
/pedidos
  /{pedidoId}
    - id: string
    - cliente: string
    - direccion: string
    - ciudad: string
    - coordenadas: {
        lat: number
        lng: number
        corregida: boolean
      }
    - estado: string (Pendiente, Asignado, En Ruta, Entregado, Cancelado)
    - prioridad: string (Baja, Media, Alta, Urgente)
    - camionAsignado: string | null
    - productos: array [{
        codigo: string
        descripcion: string
        cantidad: number
      }]
    - fechaCreacion: timestamp
    - fechaActualizacion: timestamp
    - creadoPor: string (userId)
    - actualizadoPor: string (userId)

    /historialUbicaciones (subcolección)
      /{historialId}
        - latAnterior: number
        - lngAnterior: number
        - latNueva: number
        - lngNueva: number
        - direccionAnterior: string
        - direccionNueva: string
        - ciudadAnterior: string
        - ciudadNueva: string
        - fecha: timestamp
        - usuario: string
        - razon: string
        - metodo: string (manual, arrastre, click, importacion)

    /historialEstados (subcolección)
      /{historialId}
        - estadoAnterior: string
        - estadoNuevo: string
        - fecha: timestamp
        - usuario: string
        - observaciones: string

/despachos
  /{despachoId}
    - id: string
    - camionId: string
    - conductorId: string
    - pedidosIds: array[string]
    - ruta: array [{
        pedidoId: string
        orden: number
        distancia: number
        tiempoEstimado: number
        completada: boolean
        fechaCompletada: timestamp | null
      }]
    - estado: string (Planificado, En Preparación, En Ruta, Completado, Cancelado)
    - progreso: number (0-100)
    - fechaCreacion: timestamp
    - fechaInicio: timestamp | null
    - fechaFinalizacion: timestamp | null
    - distanciaTotal: number
    - tiempoEstimadoTotal: number
    - creadoPor: string
    - observaciones: string

    /entregas (subcolección)
      /{entregaId}
        - pedidoId: string
        - fechaEntrega: timestamp
        - lat: number
        - lng: number
        - firmaCliente: string (base64)
        - fotoComprobante: string (Firebase Storage URL)
        - observaciones: string
        - recibidoPor: string

/camiones
  /{camionId}
    - id: string
    - placa: string
    - capacidad: string
    - conductor: string
    - conductorId: string | null
    - estado: string (Disponible, Asignado, En Ruta, Mantenimiento)
    - ubicacionActual: {
        lat: number
        lng: number
      }
    - direccionActual: string
    - pedidosAsignados: array[string]
    - velocidad: string
    - combustible: string
    - trackingActivo: boolean
    - ultimaActualizacion: timestamp

    /posiciones (subcolección - para historial GPS)
      /{posicionId}
        - lat: number
        - lng: number
        - velocidad: number
        - heading: number
        - precision: number
        - timestamp: timestamp
        - fuente: string (gps, simulacion, manual)

/conductores
  /{conductorId}
    - id: string
    - nombre: string
    - cedula: string
    - telefono: string
    - email: string
    - licencia: string
    - estado: string (Disponible, Asignado, Inactivo)
    - camionAsignado: string | null
    - despachosCompletados: number
    - calificacionPromedio: number
    - fechaIngreso: timestamp

/usuarios
  /{userId}
    - uid: string (Firebase Auth UID)
    - nombre: string
    - email: string
    - rol: string (admin, operador, despachador, visor, conductor)
    - activo: boolean
    - fechaCreacion: timestamp
    - ultimoAcceso: timestamp

/auditoria
  /{auditoriaId}
    - accion: string (crear, actualizar, eliminar)
    - entidad: string (pedido, despacho, camion, etc)
    - entidadId: string
    - usuario: string
    - datosAntes: object
    - datosDespues: object
    - timestamp: timestamp
    - ip: string
    - userAgent: string

/configuracion
  /sistema
    - versionApp: string
    - ultimaActualizacion: timestamp
    - mantenimiento: boolean

  /geocodificacion
    - ciudadesVenezuela: array
    - distanciaMaximaCorreccion: number (km)
```

---

## 🔒 Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Función para verificar autenticación
    function isSignedIn() {
      return request.auth != null;
    }

    // Función para obtener usuario
    function getUserData() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }

    // Función para verificar rol
    function hasRole(role) {
      return isSignedIn() && getUserData().rol == role;
    }

    // Función para verificar roles múltiples
    function hasAnyRole(roles) {
      return isSignedIn() && getUserData().rol in roles;
    }

    // PEDIDOS
    match /pedidos/{pedidoId} {
      // Lectura: todos los autenticados
      allow read: if isSignedIn();

      // Creación: admin, operador
      allow create: if hasAnyRole(['admin', 'operador']);

      // Actualización: admin, operador, despachador
      allow update: if hasAnyRole(['admin', 'operador', 'despachador']);

      // Eliminación: solo admin
      allow delete: if hasRole('admin');

      // Historial de ubicaciones
      match /historialUbicaciones/{historialId} {
        allow read: if isSignedIn();
        allow create: if hasAnyRole(['admin', 'operador', 'despachador']);
        allow update, delete: if hasRole('admin');
      }

      // Historial de estados
      match /historialEstados/{historialId} {
        allow read: if isSignedIn();
        allow create: if hasAnyRole(['admin', 'operador', 'despachador', 'conductor']);
        allow update, delete: if hasRole('admin');
      }
    }

    // DESPACHOS
    match /despachos/{despachoId} {
      allow read: if isSignedIn();
      allow create: if hasAnyRole(['admin', 'operador', 'despachador']);
      allow update: if hasAnyRole(['admin', 'operador', 'despachador', 'conductor']);
      allow delete: if hasRole('admin');

      // Entregas
      match /entregas/{entregaId} {
        allow read: if isSignedIn();
        allow create, update: if hasAnyRole(['admin', 'conductor']);
        allow delete: if hasRole('admin');
      }
    }

    // CAMIONES
    match /camiones/{camionId} {
      allow read: if isSignedIn();
      allow create, update: if hasAnyRole(['admin', 'operador']);
      allow delete: if hasRole('admin');

      // Posiciones GPS
      match /posiciones/{posicionId} {
        allow read: if isSignedIn();
        allow create: if hasAnyRole(['admin', 'conductor']);
        allow update, delete: if hasRole('admin');
      }
    }

    // CONDUCTORES
    match /conductores/{conductorId} {
      allow read: if isSignedIn();
      allow create, update: if hasAnyRole(['admin', 'operador']);
      allow delete: if hasRole('admin');
    }

    // USUARIOS
    match /usuarios/{userId} {
      allow read: if isSignedIn();
      allow create, update, delete: if hasRole('admin');
      // Permitir que el usuario actualice su propio ultimoAcceso
      allow update: if isSignedIn() && request.auth.uid == userId
                    && request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['ultimoAcceso']);
    }

    // AUDITORÍA
    match /auditoria/{auditoriaId} {
      allow read: if hasAnyRole(['admin', 'operador']);
      allow create: if isSignedIn();
      allow update, delete: if false; // No se puede modificar auditoría
    }

    // CONFIGURACIÓN
    match /configuracion/{doc} {
      allow read: if isSignedIn();
      allow write: if hasRole('admin');
    }
  }
}
```

---

## 📊 Índices Compuestos Necesarios

```json
{
  "indexes": [
    {
      "collectionGroup": "pedidos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "pedidos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "camionAsignado", "order": "ASCENDING" },
        { "fieldPath": "estado", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "pedidos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ciudad", "order": "ASCENDING" },
        { "fieldPath": "estado", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "despachos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "despachos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "camionId", "order": "ASCENDING" },
        { "fieldPath": "estado", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "camiones",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "ultimaActualizacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditoria",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "entidad", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditoria",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "usuario", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🔄 Flujos de Datos Principales

### **Flujo 1: Crear Pedido**
```
1. Usuario crea pedido en UI
2. Frontend valida datos
3. Frontend llama a firestoreService.crearPedido()
4. Se crea documento en /pedidos/{pedidoId}
5. Se registra en /auditoria
6. Firestore dispara listener onSnapshot
7. UI se actualiza automáticamente
```

### **Flujo 2: Modificar Ubicación**
```
1. Usuario arrastra marcador
2. Frontend captura nueva ubicación
3. Frontend llama a firestoreService.actualizarUbicacion()
4. Se obtienen coordenadas anteriores
5. Se crea documento en /pedidos/{id}/historialUbicaciones
6. Se actualiza documento en /pedidos/{id}
7. Se registra en /auditoria
8. Firestore sincroniza con todos los clientes conectados
```

### **Flujo 3: Crear Despacho**
```
1. Usuario selecciona pedidos + camión + conductor
2. Frontend valida disponibilidad
3. Frontend llama a firestoreService.crearDespacho()
4. Se crea documento en /despachos/{despachoId}
5. Se actualizan pedidos (estado → Asignado)
6. Se actualiza camión (estado → Asignado)
7. Se actualiza conductor (estado → Asignado)
8. Se registra en /auditoria
9. Todos los cambios en transacción atómica
```

### **Flujo 4: Tracking GPS en Tiempo Real**
```
1. Conductor inicia tracking
2. GPS captura posición cada 15 segundos
3. Frontend envía a Realtime Database (velocidad)
4. Cada minuto se guarda en Firestore /camiones/{id}/posiciones
5. Se actualiza /camiones/{id}.ubicacionActual
6. Listeners actualizan mapa en tiempo real
```

---

## ⚙️ Configuración Paso a Paso

### **Paso 1: Crear Proyecto Firebase**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto"
3. Nombre: `tracking-distribuidora`
4. Habilita Google Analytics (opcional)
5. Click "Crear proyecto"

### **Paso 2: Habilitar Servicios**

1. **Authentication:**
   - Ve a "Authentication" → "Get Started"
   - Habilita "Email/Password"
   - Crea usuarios iniciales

2. **Firestore Database:**
   - Ve a "Firestore Database" → "Crear base de datos"
   - Modo: **Producción** (con reglas de seguridad)
   - Ubicación: **us-central1** (o la más cercana)

3. **Realtime Database:**
   - Ve a "Realtime Database" → "Crear base de datos"
   - Modo: **Bloqueado** (configuraremos reglas)
   - Ubicación: **us-central1**

4. **Storage (Opcional para fotos):**
   - Ve a "Storage" → "Get Started"
   - Modo: Producción

### **Paso 3: Configurar Reglas de Realtime Database**

```json
{
  "rules": {
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

### **Paso 4: Obtener Credenciales**

1. Ve a "Project Settings" (ícono engranaje)
2. Sección "Your apps" → "Web app" → Agregar app
3. Nombre: `tracking-web`
4. Copia el objeto `firebaseConfig`
5. Actualiza `.env.local`:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://tu_proyecto-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# Mapbox
REACT_APP_MAPBOX_TOKEN=tu_token_actual
```

### **Paso 5: Crear Índices Compuestos**

1. Ve a Firestore → "Indexes"
2. Click "Add Index"
3. Crea cada índice de la sección "Índices Compuestos" arriba
4. O espera a que Firebase te sugiera crearlos cuando hagas queries

### **Paso 6: Aplicar Reglas de Seguridad**

1. Ve a Firestore → "Rules"
2. Copia las reglas de la sección "Reglas de Seguridad"
3. Click "Publish"

### **Paso 7: Crear Usuarios Iniciales**

```javascript
// En Firebase Console → Authentication → Users → Add User
// O usando el código:

// Admin
email: admin@sarego.com
password: Admin123!
// Luego en Firestore crear documento:
/usuarios/uid_generado
{
  uid: "uid_del_auth",
  nombre: "Administrador",
  email: "admin@sarego.com",
  rol: "admin",
  activo: true,
  fechaCreacion: [timestamp],
  ultimoAcceso: [timestamp]
}
```

---

## 📈 Estimación de Costos Firebase

### **Plan Gratuito (Spark):**
- ✅ 50,000 lecturas/día
- ✅ 20,000 escrituras/día
- ✅ 20,000 eliminaciones/día
- ✅ 1 GB almacenamiento
- ✅ 10 GB transferencia/mes

**Estimación para tu uso:**
- 100 pedidos/día × 30 días = 3,000 escrituras/mes ✅
- 1,000 consultas/día × 30 días = 30,000 lecturas/mes ⚠️ (puede exceder)
- 10 usuarios simultáneos con listeners = ~5,000 lecturas/día ✅

**Recomendación:** Empezar con plan gratuito. Si creces, pasar a **Blaze (pago por uso)** cuesta ~$5-20/mes con tu volumen.

---

## 🎯 Próximos Pasos

Ahora voy a crear los servicios de Firestore para implementar toda esta arquitectura.

¿Te parece bien esta arquitectura? ¿Quieres que proceda a implementar los servicios?
