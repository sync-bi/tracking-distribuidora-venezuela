# 🔐 Credenciales de Acceso - Sistema de Tracking

**Fecha de actualización:** 26 Enero 2025
**Modo:** Desarrollo Local (MOCK)

---

## 👥 Usuarios Disponibles

El sistema funciona en modo desarrollo con usuarios de prueba. Usa cualquiera de estas credenciales para acceder:

### 1️⃣ Administrador
```
Email: admin@example.com
Contraseña: admin123
Rol: admin
```
**Acceso:** Total al sistema (todas las pestañas)

---

### 2️⃣ Operador
```
Email: op@example.com
Contraseña: op123
Rol: operador
```
**Acceso:** Gestión operativa completa (todas las pestañas excepto gestión de usuarios)

---

### 3️⃣ Despachador
```
Email: disp@example.com
Contraseña: disp123
Rol: despachador
```
**Acceso:** Despachos, Seguimiento, Camiones, Mapa, Ubicaciones, Clientes

---

### 4️⃣ Vendedor (NUEVO) ⭐
```
Email: vendedor@example.com
Contraseña: vendedor123
Rol: vendedor
Nombre: Juan Pérez
```
**Acceso:** Clientes, Pedidos, Mapa
**Perfil:** Solo ve su cartera de clientes asignados

---

### 5️⃣ Visor
```
Email: visor@example.com
Contraseña: visor123
Rol: visor
```
**Acceso:** Solo lectura (Mapa, Pedidos, Seguimiento)

---

### 6️⃣ Conductor
```
Email: driver@example.com
Contraseña: driver123
Rol: conductor
```
**Acceso:** Módulo de tracking GPS (Conductor, Mapa)

---

## 🚀 Cómo Iniciar Sesión

1. Abrir el sistema en el navegador
2. Copiar el **email** del usuario que quieres probar
3. Copiar la **contraseña**
4. Hacer clic en "Iniciar Sesión"
5. ¡Listo! El sistema te redirigirá al dashboard correspondiente

---

## 🎯 Usuario Recomendado para Probar el Módulo de Clientes

### **Vendedor**
```
Email: vendedor@example.com
Contraseña: vendedor123
```

Este usuario te permite probar todas las funcionalidades del nuevo módulo de Gestión de Clientes:
- Filtrar por vendedor (verás solo clientes de "Juan Pérez")
- Corregir ubicaciones
- Ver historial de cambios
- Interfaz optimizada para vendedores

---

## 📋 Comparación de Permisos

| Módulo | Admin | Operador | Despachador | Vendedor | Visor | Conductor |
|--------|-------|----------|-------------|----------|-------|-----------|
| Pedidos | ✅ | ✅ | ❌ | ✅ (lectura) | ✅ (lectura) | ❌ |
| Camiones | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Despachos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Seguimiento | ✅ | ✅ | ✅ | ❌ | ✅ (lectura) | ❌ |
| Conductor | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Mapa | ✅ | ✅ | ✅ | ✅ (lectura) | ✅ (lectura) | ✅ |
| Ubicaciones | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Clientes** | ✅ | ✅ | ✅ | ✅ (solo su cartera) | ❌ | ❌ |

---

## 🔄 Modo Producción (Firebase)

Cuando el sistema esté en producción con Firebase, estos usuarios MOCK dejarán de funcionar.

Las credenciales reales se gestionarán desde:
- **Firebase Authentication** (emails y contraseñas)
- **Firestore** (roles y permisos)

---

## 🆘 Problemas de Acceso

### "Credenciales inválidas"
- ✅ Verifica que estés copiando el email completo (incluyendo `@example.com`)
- ✅ Verifica que la contraseña no tenga espacios extra
- ✅ Intenta copiar y pegar directamente desde este documento

### "No tienes permisos para esta pestaña"
- ✅ Es normal - cada rol tiene permisos limitados
- ✅ Prueba con el usuario **Admin** para acceso completo

### La sesión expira al refrescar
- ✅ Esto es temporal en modo MOCK
- ✅ Simplemente vuelve a iniciar sesión

---

## 📝 Notas Importantes

1. **Estos son usuarios de PRUEBA** - No usar en producción
2. **Las contraseñas son simples** - Solo para desarrollo
3. **Los datos se pierden al refrescar** - Hasta resolver Firebase
4. **Cada usuario tiene su propia "vista"** - Prueba con diferentes roles

---

## 🎓 Escenarios de Prueba Sugeridos

### Escenario 1: Flujo Completo como Admin
```
Login: admin@example.com / admin123
1. Ir a Pedidos → Ver pedidos existentes
2. Ir a Clientes → Ver todos los clientes
3. Corregir ubicación de un cliente
4. Ir a Despachos → Crear despacho
5. Ir a Seguimiento → Ver despacho creado
```

### Escenario 2: Flujo de Vendedor
```
Login: vendedor@example.com / vendedor123
1. Ir a Clientes → Solo verás clientes de "Juan Pérez"
2. Filtrar por "Juan Pérez" (debería estar pre-filtrado)
3. Seleccionar un cliente
4. Corregir su ubicación
5. Ver historial de cambios
```

### Escenario 3: Flujo de Despachador
```
Login: disp@example.com / disp123
1. Ir a Clientes → Verificar ubicaciones
2. Ir a Despachos → Crear despacho con pedidos por zona
3. Ir a Seguimiento → Optimizar ruta y monitorear
```

---

## 🔗 Documentación Relacionada

- **Guía Completa de Usuario**: `GUIA_USUARIO_COMPLETA.md`
- **Módulo de Clientes**: `MODULO_GESTION_CLIENTES.md`
- **Estado del Proyecto**: `ESTADO_PROYECTO_2025-01-18.md`

---

**¿Necesitas agregar más usuarios o cambiar contraseñas?**
Contacta al desarrollador o modifica el archivo `src/context/AuthContext.js` línea 48-54.

---

**Última actualización:** 26 Enero 2025
**Versión:** 2.0 (incluye rol vendedor)
