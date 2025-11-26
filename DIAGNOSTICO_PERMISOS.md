# 🔍 Diagnóstico de Permisos de Firestore

## 🎯 Objetivo

Este documento te guiará paso a paso para identificar y resolver el problema de permisos que está impidiendo crear camiones y conductores en Firestore.

---

## 📋 Paso 1: Ejecutar Diagnóstico Automático

He creado una herramienta de diagnóstico que probará todos los permisos de forma sistemática.

### Instrucciones:

1. **Reinicia el servidor de desarrollo** (si no lo has hecho):
   ```bash
   # Presiona Ctrl+C para detener el servidor actual
   npm start
   ```

2. **Abre la aplicación** en tu navegador:
   ```
   http://localhost:3000
   ```

3. **Inicia sesión** con:
   ```
   Email: admin@sarego.com
   Password: Admin123!
   ```

4. **Abre la consola del navegador** (F12 o Click derecho → Inspeccionar → Console)

5. **Ejecuta el diagnóstico**:
   ```javascript
   testFirestorePermisos()
   ```

6. **Lee los resultados** cuidadosamente y copia TODA la salida

---

## 🔎 Paso 2: Interpretar Resultados

### ✅ Resultado Esperado (Todo bien):

```
🔍 DIAGNÓSTICO DE PERMISOS FIRESTORE
=====================================

📋 Test 1: Leer colección usuarios...
✅ ÉXITO - Encontrados 3 usuarios
   - Administrador (admin@sarego.com) - Rol: admin
   - Operador (operador@sarego.com) - Rol: operador
   - Conductor Demo (conductor@sarego.com) - Rol: conductor

📋 Test 2: Crear documento en colección camiones...
✅ ÉXITO - Camión de prueba creado
✅ VERIFICADO - Documento existe en Firestore

📋 Test 3: Crear documento en colección conductores...
✅ ÉXITO - Conductor de prueba creado
✅ VERIFICADO - Documento existe en Firestore

📋 Test 4: Leer colección camiones existente...
✅ ÉXITO - Encontrados 1 camiones
   - TEST_DIAGNOSTICO (TEST-001) - Estado: Disponible

📋 Test 5: Leer colección conductores existente...
✅ ÉXITO - Encontrados 1 conductores
   - Test Driver (00000000)
```

### ❌ Problema Detectado:

Si ves mensajes como:
```
❌ ERROR al crear camión: Missing or insufficient permissions.
   Código: permission-denied
```

Significa que las reglas de Firestore NO están permitiendo las operaciones.

---

## 🛠️ Paso 3: Verificar Reglas en Firebase Console

### A. Verificar que las reglas están publicadas:

1. Ve a **Firebase Console**: https://console.firebase.google.com
2. Selecciona tu proyecto: **tracking-distribuidora-sarego**
3. Ve a **Firestore Database** (menú izquierdo)
4. Click en la pestaña **Rules** (Reglas)
5. Verifica que veas este código:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: verificar si el usuario tiene un rol específico
    function hasRole(role) {
      return request.auth != null &&
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == role;
    }

    // Helper function: verificar si el usuario tiene alguno de los roles
    function hasAnyRole(roles) {
      return request.auth != null &&
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol in roles;
    }

    // Helper function: verificar si el usuario está activo
    function isActive() {
      return request.auth != null &&
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.activo == true;
    }

    // Colección: usuarios
    match /usuarios/{userId} {
      allow read: if request.auth != null && isActive();
      allow write: if hasAnyRole(['admin']);
    }

    // Colección: pedidos
    match /pedidos/{pedidoId} {
      allow read: if request.auth != null && isActive();
      allow create: if hasAnyRole(['admin', 'operador']);
      allow update: if hasAnyRole(['admin', 'operador', 'despachador', 'conductor']);
      allow delete: if hasAnyRole(['admin']);

      // Subcolección: historialUbicaciones
      match /historialUbicaciones/{historialId} {
        allow read: if request.auth != null && isActive();
        allow create: if hasAnyRole(['admin', 'operador', 'despachador']);
      }

      // Subcolección: historialEstados
      match /historialEstados/{historialId} {
        allow read: if request.auth != null && isActive();
        allow create: if hasAnyRole(['admin', 'operador', 'despachador', 'conductor']);
      }
    }

    // Colección: camiones
    match /camiones/{camionId} {
      allow read: if request.auth != null && isActive();
      allow create: if hasAnyRole(['admin', 'operador']);
      allow update: if hasAnyRole(['admin', 'operador', 'despachador', 'conductor']);
      allow delete: if hasAnyRole(['admin']);
    }

    // Colección: conductores
    match /conductores/{conductorId} {
      allow read: if request.auth != null && isActive();
      allow create: if hasAnyRole(['admin', 'operador']);
      allow update: if hasAnyRole(['admin', 'operador']);
      allow delete: if hasAnyRole(['admin']);
    }

    // Colección: despachos
    match /despachos/{despachoId} {
      allow read: if request.auth != null && isActive();
      allow create: if hasAnyRole(['admin', 'operador', 'despachador']);
      allow update: if hasAnyRole(['admin', 'operador', 'despachador', 'conductor']);
      allow delete: if hasAnyRole(['admin']);

      // Subcolección: historial
      match /historial/{historialId} {
        allow read: if request.auth != null && isActive();
        allow create: if hasAnyRole(['admin', 'operador', 'despachador', 'conductor']);
      }
    }

    // Colección: rutas
    match /rutas/{rutaId} {
      allow read: if request.auth != null && isActive();
      allow create: if hasAnyRole(['admin', 'operador', 'despachador']);
      allow update: if hasAnyRole(['admin', 'operador', 'despachador', 'conductor']);
      allow delete: if hasAnyRole(['admin', 'operador']);
    }

    // Colección: auditoria
    match /auditoria/{auditoriaId} {
      allow read: if hasAnyRole(['admin']);
      allow create: if request.auth != null && isActive();
    }
  }
}
```

6. Si no ves estas reglas o son diferentes, **cópialas y pégalas** en el editor
7. Click en **Publish** (Publicar)
8. **ESPERA 30-60 SEGUNDOS** para que las reglas se propaguen

### B. Verificar que el usuario tiene el rol correcto:

1. En Firebase Console, ve a **Firestore Database**
2. Click en la pestaña **Data** (Datos)
3. Busca la colección **usuarios**
4. Busca el documento con ID igual al UID del usuario autenticado
   - Puedes ver el UID en la consola del navegador cuando haces login
5. Verifica que el campo `rol` sea **"admin"** (entre comillas)
6. Verifica que el campo `activo` sea **true** (booleano, sin comillas)

---

## 🔄 Paso 4: Probar Nuevamente

Una vez que hayas verificado las reglas y el rol del usuario:

1. **Refresca la página** de la aplicación (Ctrl + F5 para limpiar caché)

2. **Vuelve a ejecutar el diagnóstico**:
   ```javascript
   testFirestorePermisos()
   ```

3. Si ahora todos los tests pasan (✅), ejecuta la inicialización:
   ```javascript
   inicializarFirebase()
   ```

---

## 🆘 Solución Alternativa: Crear Manualmente

Si después de todos los pasos anteriores TODAVÍA tienes problemas con permisos, puedes crear los documentos manualmente desde Firebase Console:

### Crear Camiones Manualmente:

1. Ve a Firebase Console → Firestore Database → Data
2. Click en **Start Collection** (o añadir colección)
3. Collection ID: `camiones`
4. Document ID: `CAM101`
5. Añade estos campos:

| Campo | Tipo | Valor |
|-------|------|-------|
| id | string | CAM101 |
| placa | string | VAA-101 |
| capacidad | string | 3000 kg |
| estado | string | Disponible |
| modelo | string | Camión 3.5 Ton |
| marca | string | Chevrolet |
| pedidosAsignados | array | [] (vacío) |
| ubicacionActual | map | { lat: 10.4806, lng: -66.9036 } |

6. Repite para CAM102 y CAM103 con los datos de `src/data/mockData.js`

### Crear Conductores Manualmente:

1. En Firestore Database → Data
2. Click en **Start Collection**
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

6. Repite para COND002 y COND003 con los datos de `src/data/mockDataConductores.js`

---

## 📊 Verificar Éxito

Después de crear los datos (ya sea por script o manualmente), verifica:

1. En Firebase Console → Firestore Database → Data:
   - [ ] Colección `camiones` tiene 3 documentos
   - [ ] Colección `conductores` tiene 3 documentos

2. En tu aplicación:
   - [ ] Refresca la página (Ctrl + F5)
   - [ ] Ve a la pestaña **Camiones**
   - [ ] Deberías ver los 3 camiones listados

---

## 🐛 Problemas Comunes

### Error: "get is not defined"
**Causa**: Las reglas no están usando la función `get()` correctamente
**Solución**: Asegúrate de copiar las reglas EXACTAMENTE como aparecen arriba

### Error: "Missing or insufficient permissions" incluso después de publicar reglas
**Causa**: Las reglas tardan en propagarse o hay un problema de caché
**Solución**:
1. Espera 2-3 minutos
2. Cierra sesión y vuelve a iniciar sesión
3. Limpia caché del navegador (Ctrl + Shift + Delete)
4. Refresca la página (Ctrl + F5)

### El usuario tiene rol "visor" en lugar de "admin"
**Causa**: El documento en Firestore no tiene el rol correcto
**Solución**: Edita el documento en Firestore y cambia el campo `rol` a `admin`

---

## 📞 Siguiente Paso

Una vez que el diagnóstico pase todos los tests (✅), avísame y continuamos con la importación de pedidos.
