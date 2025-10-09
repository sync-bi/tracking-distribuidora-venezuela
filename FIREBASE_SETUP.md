# Configuración de Firebase para Tracking Distribuidora

Esta guía te ayudará a configurar Firebase Realtime Database para la sincronización en tiempo real de posiciones de vehículos.

## Paso 1: Crear un Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto" o "Add project"
3. Ingresa un nombre para tu proyecto (ejemplo: `tracking-distribuidora`)
4. Sigue los pasos del asistente:
   - Puedes deshabilitar Google Analytics si no lo necesitas
   - Haz clic en "Crear proyecto"

## Paso 2: Habilitar Realtime Database

1. En el menú lateral de Firebase Console, ve a **Build > Realtime Database**
2. Haz clic en "Crear base de datos" o "Create Database"
3. Selecciona una ubicación (recomendado: `us-central1` para Latinoamérica)
4. Elige el modo de seguridad:
   - **Modo de prueba** (para desarrollo): Permite lectura/escritura por 30 días
   - **Modo bloqueado** (para producción): Requiere configurar reglas de seguridad

## Paso 3: Configurar Reglas de Seguridad

Para desarrollo, puedes usar estas reglas (permiten lectura/escritura):

```json
{
  "rules": {
    "vehiculos": {
      "$vehiculoId": {
        ".read": true,
        ".write": true
      }
    },
    "despachos": {
      "$despachoId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**⚠️ IMPORTANTE**: Para producción, debes configurar reglas más estrictas con autenticación.

## Paso 4: Obtener las Credenciales

1. Ve a **Configuración del proyecto** (ícono de engranaje en el menú lateral)
2. En la pestaña **General**, baja hasta "Tus aplicaciones"
3. Haz clic en el ícono de **Web** (`</>`)
4. Registra tu app con un nombre (ejemplo: `tracking-web`)
5. Copia las credenciales que aparecen:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Paso 5: Configurar Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto (al mismo nivel que `package.json`)
2. Copia el contenido del archivo `.env.example` y reemplaza con tus credenciales:

```env
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto
REACT_APP_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**⚠️ IMPORTANTE**:
- El archivo `.env` NO debe subirse a Git (ya está en `.gitignore`)
- Cada desarrollador debe tener su propio archivo `.env`
- Para producción, configura las variables de entorno en tu servidor/hosting

## Paso 6: Reiniciar la Aplicación

Después de crear/modificar el archivo `.env`, debes reiniciar el servidor de desarrollo:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
npm start
```

## Verificación

Si todo está configurado correctamente, deberías ver en la consola del navegador:

```
✅ Firebase inicializado correctamente
```

Si Firebase no está configurado, verás:

```
⚠️ Firebase no configurado. El sistema funcionará sin sincronización en tiempo real.
```

## Estructura de Datos en Firebase

La aplicación guarda los datos en esta estructura:

```
/
├── vehiculos/
│   ├── CAM-001/
│   │   └── posicion/
│   │       ├── lat: 10.4806
│   │       ├── lng: -66.9036
│   │       ├── velocidad: 45
│   │       ├── heading: 180
│   │       ├── timestamp: [Firebase ServerTimestamp]
│   │       └── ultimaActualizacion: "2024-01-15T10:30:00.000Z"
│   └── CAM-002/
│       └── posicion/
│           └── ...
└── despachos/
    ├── DESP-001/
    │   ├── camionId: "CAM-001"
    │   ├── conductorId: "COND-001"
    │   ├── ruta/
    │   │   ├── paradas: [...]
    │   │   ├── totalParadas: 5
    │   │   └── timestamp: [Firebase ServerTimestamp]
    │   └── paradasCompletadas/
    │       └── PED-001/
    │           ├── completada: true
    │           └── timestamp: [Firebase ServerTimestamp]
    └── DESP-002/
        └── ...
```

## Próximos Pasos

1. Lee el archivo `COMO_PROBAR_FIREBASE.md` para aprender a probar la sincronización
2. Prueba el tracking en la pestaña **Conductor**
3. Verifica la sincronización en la pestaña **Seguimiento**
4. Revisa los datos en Firebase Console en tiempo real

## Solución de Problemas

### No aparece el mensaje "Firebase inicializado correctamente"

- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de haber reiniciado el servidor después de crear `.env`
- Revisa la consola del navegador para ver errores específicos

### Error: "Permission denied"

- Verifica las reglas de seguridad en Firebase Console
- Para desarrollo, usa las reglas permisivas mostradas arriba

### El tracking no se sincroniza entre dispositivos

- Verifica que Firebase esté correctamente inicializado
- Revisa que la `databaseURL` sea correcta
- Comprueba que los datos se están guardando en Firebase Console
