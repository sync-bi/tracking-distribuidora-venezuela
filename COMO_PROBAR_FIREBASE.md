# Cómo Probar Firebase - Sincronización en Tiempo Real

Esta guía te mostrará cómo probar que Firebase está funcionando correctamente y sincronizando datos en tiempo real.

## Prerrequisitos

- Firebase debe estar configurado (ver `FIREBASE_SETUP.md`)
- La aplicación debe estar corriendo (`npm start`)
- Debes ver el mensaje "✅ Firebase inicializado correctamente" en la consola del navegador

## Método 1: Prueba con Dos Dispositivos (Recomendado)

Esta es la forma más realista de probar el tracking en tiempo real.

### Configuración

1. **Dispositivo 1 (Escritorio)**: Operador/Despachador
   - Abre la aplicación en el navegador
   - Inicia sesión como operador o despachador
   - Ve a la pestaña **Seguimiento**

2. **Dispositivo 2 (Móvil)**: Conductor
   - Abre la aplicación en el navegador del teléfono
   - Inicia sesión como conductor
   - Ve a la pestaña **Conductor**

### Prueba

1. En el **Dispositivo 2 (Móvil)**:
   - Selecciona un camión (ejemplo: CAM-001)
   - Haz clic en "Iniciar Tracking"
   - Permite que el navegador acceda a tu ubicación GPS
   - Verás tu posición actual en el mapa

2. En el **Dispositivo 1 (Escritorio)**:
   - Ve a la pestaña **Seguimiento**
   - Selecciona un despacho asignado al camión CAM-001
   - Deberías ver el marcador del camión moverse en tiempo real

3. **Verifica la sincronización**:
   - Muévete con el Dispositivo 2 (camina o conduce)
   - Observa cómo el marcador se actualiza en el Dispositivo 1
   - La actualización debería ser casi instantánea (1-2 segundos)

### Qué esperar

✅ **Funcionando correctamente**:
- El marcador del camión aparece en ambos dispositivos
- La posición se actualiza en tiempo real
- La velocidad se muestra correctamente
- Los datos persisten al recargar la página

❌ **No funciona**:
- El marcador no aparece en el Dispositivo 1
- La posición no se actualiza
- Hay un retraso mayor a 5 segundos

## Método 2: Prueba con Dos Pestañas del Navegador

Si solo tienes un dispositivo, puedes simular dos usuarios con dos pestañas.

### Configuración

1. **Pestaña 1**: Modo Conductor
   - Abre la aplicación
   - Inicia sesión como conductor
   - Ve a **Conductor**

2. **Pestaña 2**: Modo Seguimiento
   - Abre otra pestaña con la misma URL
   - Inicia sesión como operador
   - Ve a **Seguimiento**

### Prueba

1. En **Pestaña 1**:
   - Selecciona CAM-001
   - Haz clic en "Iniciar Tracking"
   - Permite acceso a ubicación

2. En **Pestaña 2**:
   - Crea o selecciona un despacho con CAM-001
   - Observa el mapa

3. **Simula movimiento** (opcional):
   - Abre las **Herramientas de Desarrollo** (F12)
   - Ve a la consola
   - Ejecuta este código para simular movimiento:

```javascript
// Simular posición en Caracas, Venezuela
const posiciones = [
  { lat: 10.4806, lng: -66.9036 },
  { lat: 10.4810, lng: -66.9040 },
  { lat: 10.4815, lng: -66.9045 },
  { lat: 10.4820, lng: -66.9050 }
];

let i = 0;
setInterval(() => {
  const pos = posiciones[i % posiciones.length];
  // Esto simulará actualizaciones de posición
  console.log('Posición simulada:', pos);
  i++;
}, 3000);
```

## Método 3: Verificar Datos en Firebase Console

Puedes ver los datos en tiempo real directamente en Firebase.

### Pasos

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Build > Realtime Database**
4. Verás la estructura de datos en tiempo real

### Qué buscar

```
/
├── vehiculos/
│   └── CAM-001/
│       └── posicion/
│           ├── lat: 10.4806
│           ├── lng: -66.9036
│           ├── velocidad: 0
│           ├── heading: 0
│           └── ultimaActualizacion: "2024-01-15T..."
```

### Prueba en vivo

1. En la app, inicia el tracking desde **Conductor**
2. En Firebase Console, expande `vehiculos/CAM-001/posicion`
3. Observa cómo los valores cambian en tiempo real
4. Deberías ver:
   - `lat` y `lng` actualizándose cada 3-5 segundos
   - `velocidad` cambiando según te mueves
   - `heading` mostrando la dirección
   - `ultimaActualizacion` con timestamp reciente

## Método 4: Verificar Logs en la Consola

La aplicación registra eventos importantes en la consola del navegador.

### Mensajes a buscar

**Al iniciar tracking** (Pestaña Conductor):
```
📍 Posición actualizada: CAM-001 {lat: 10.4806, lng: -66.9036}
```

**Al recibir actualizaciones** (Pestaña Seguimiento):
```
📡 Posición recibida: CAM-001 {lat: 10.4806, lng: -66.9036, velocidad: 45, ...}
```

**Errores comunes**:
```
⚠️ Firebase no configurado. El sistema funcionará sin sincronización en tiempo real.
❌ Error al actualizar posición en Firebase: [error]
```

## Checklist de Prueba Completa

Usa este checklist para asegurarte de que todo funciona:

### Firebase Inicialización
- [ ] Mensaje "✅ Firebase inicializado correctamente" en consola
- [ ] No hay errores en la consola del navegador
- [ ] Variables de entorno configuradas en `.env`

### Tracking del Conductor
- [ ] Botón "Iniciar Tracking" funciona
- [ ] El navegador solicita permisos de ubicación
- [ ] La posición se muestra en el mapa local
- [ ] Aparecen logs "📍 Posición actualizada" en consola
- [ ] Los datos aparecen en Firebase Console

### Sincronización en Tiempo Real
- [ ] La posición se actualiza en otro dispositivo/pestaña
- [ ] El retraso es menor a 3 segundos
- [ ] La velocidad se calcula correctamente
- [ ] El marcador se mueve suavemente en el mapa

### Persistencia
- [ ] Al recargar la página, se mantiene la última posición
- [ ] Los datos persisten en Firebase Console
- [ ] Se puede detener y reiniciar el tracking sin problemas

## Solución de Problemas

### El tracking no se sincroniza

**Problema**: Los datos no aparecen en otro dispositivo.

**Soluciones**:
1. Verifica que Firebase esté inicializado en ambos dispositivos
2. Revisa las reglas de seguridad en Firebase Console
3. Asegúrate de que ambos dispositivos usan el mismo proyecto Firebase
4. Comprueba que el `vehiculoId` sea el mismo en ambos lados

### Error de permisos de ubicación

**Problema**: El navegador no permite acceder al GPS.

**Soluciones**:
1. Usa HTTPS (requerido para Geolocation API)
2. Permite permisos de ubicación en la configuración del navegador
3. En desarrollo local, `localhost` está permitido
4. En móvil, verifica permisos en Ajustes del navegador

### Datos no aparecen en Firebase Console

**Problema**: No se guardan datos en Firebase.

**Soluciones**:
1. Verifica las reglas de seguridad (deben permitir escritura)
2. Revisa la consola del navegador para errores
3. Asegúrate de que `databaseURL` sea correcta
4. Verifica que el tracking esté iniciado

### Retraso excesivo en la sincronización

**Problema**: Los datos tardan más de 10 segundos en sincronizarse.

**Soluciones**:
1. Verifica tu conexión a Internet
2. Revisa la región de Firebase (usa una cercana)
3. Comprueba que no haya errores en la consola
4. Reduce la frecuencia de actualización si es muy alta

## Prueba de Estrés

Para probar con múltiples vehículos:

1. Abre 3-4 pestañas en modo **Conductor**
2. Inicia tracking en diferentes camiones (CAM-001, CAM-002, CAM-003)
3. Abre una pestaña en modo **Seguimiento**
4. Crea despachos para cada camión
5. Verifica que todos se actualicen simultáneamente

### Qué esperar

✅ **Rendimiento aceptable**:
- 10-15 vehículos actualizándose sin problemas
- Retraso menor a 5 segundos
- Sin errores en consola

⚠️ **Límites**:
- Firebase Realtime Database (plan gratuito): 100 conexiones simultáneas
- Si necesitas más, considera actualizar el plan

## Siguiente Paso

Una vez que confirmes que Firebase funciona correctamente:

1. Prueba crear despachos reales
2. Optimiza rutas en la pestaña **Seguimiento**
3. Monitorea camiones en la pestaña **Mapa**
4. Revisa las estadísticas de entregas

Para producción, recuerda configurar reglas de seguridad adecuadas con autenticación.
