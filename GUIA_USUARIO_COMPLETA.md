# 📖 Guía Completa de Usuario - Sistema de Tracking Distribuidora

**Versión:** 2.0
**Fecha:** 26 Enero 2025
**Sistema:** Tracking y Gestión de Distribución

---

## 🎯 Tabla de Contenidos

1. [Acceso al Sistema](#acceso-al-sistema)
2. [Roles y Permisos](#roles-y-permisos)
3. [Módulos del Sistema](#módulos-del-sistema)
4. [Guía por Rol](#guía-por-rol)
5. [Preguntas Frecuentes](#preguntas-frecuentes)
6. [Soporte y Contacto](#soporte-y-contacto)

---

## 🔐 Acceso al Sistema

### Credenciales de Acceso

El sistema funciona en **dos modos**:

#### Modo Desarrollo (MOCK - sin Firebase)
Utiliza estos usuarios de prueba:

| Rol | Email | Contraseña | Acceso |
|-----|-------|-----------|--------|
| **Admin** | `admin@example.com` | `admin123` | Acceso completo |
| **Operador** | `op@example.com` | `op123` | Gestión operativa |
| **Despachador** | `disp@example.com` | `disp123` | Despachos y rutas |
| **Visor** | `visor@example.com` | `visor123` | Solo lectura |
| **Conductor** | `driver@example.com` | `driver123` | App móvil |
| **Vendedor** | `vendedor@example.com` | `vendedor123` | Gestión de clientes |

#### Modo Producción (Firebase)
Las credenciales se gestionan desde Firebase Authentication.

---

### Pasos para Iniciar Sesión

1. **Abrir el navegador** y acceder a la URL del sistema
2. **Ingresar email** en el campo correspondiente
3. **Ingresar contraseña**
4. **Hacer clic en "Iniciar Sesión"**
5. El sistema te redirigirá al dashboard según tu rol

---

## 👥 Roles y Permisos

### 🔴 Admin (Administrador)
**Acceso:** Total al sistema

**Pestañas disponibles:**
- ✅ Pedidos
- ✅ Camiones
- ✅ Despachos
- ✅ Seguimiento
- ✅ Conductor
- ✅ Mapa
- ✅ Ubicaciones
- ✅ Clientes

**Capacidades:**
- Crear, editar y eliminar pedidos
- Gestionar flota de camiones
- Crear y gestionar despachos
- Asignar conductores
- Corregir ubicaciones de clientes
- Ver reportes y estadísticas completas
- Gestionar usuarios (Firebase)

---

### 🟠 Operador
**Acceso:** Gestión operativa completa

**Pestañas disponibles:**
- ✅ Pedidos
- ✅ Camiones
- ✅ Despachos
- ✅ Seguimiento
- ✅ Conductor
- ✅ Mapa
- ✅ Ubicaciones
- ✅ Clientes

**Capacidades:**
- Igual que Admin, excepto gestión de usuarios
- Enfoque en operaciones diarias
- Importación de pedidos desde Excel
- Optimización de rutas

---

### 🟡 Despachador
**Acceso:** Despachos y logística

**Pestañas disponibles:**
- ✅ Despachos
- ✅ Seguimiento
- ✅ Camiones
- ✅ Mapa
- ✅ Ubicaciones
- ✅ Clientes

**Capacidades:**
- Crear despachos con múltiples pedidos
- Asignar camiones y conductores
- Optimizar rutas
- Monitorear entregas en tiempo real
- Corregir ubicaciones antes de despachar

---

### 🟢 Vendedor (NUEVO)
**Acceso:** Gestión de su cartera de clientes

**Pestañas disponibles:**
- ✅ Clientes
- ✅ Pedidos
- ✅ Mapa

**Capacidades:**
- Ver solo sus clientes asignados
- Corregir ubicaciones de sus clientes
- Ver pedidos de su cartera
- Visualizar en mapa

**Restricciones:**
- ❌ No puede crear despachos
- ❌ No puede gestionar camiones
- ❌ No ve información de otros vendedores

---

### 🔵 Visor
**Acceso:** Solo lectura

**Pestañas disponibles:**
- ✅ Mapa
- ✅ Pedidos
- ✅ Seguimiento

**Capacidades:**
- Ver estado de pedidos
- Ver ubicaciones en mapa
- Ver seguimiento de despachos
- Sin permisos de edición

---

### 🟣 Conductor
**Acceso:** App de tracking móvil

**Pestañas disponibles:**
- ✅ Conductor
- ✅ Mapa

**Capacidades:**
- Compartir ubicación GPS en tiempo real
- Ver ruta asignada
- Actualizar estado de entregas
- Acceso optimizado para móvil/tablet

---

## 📱 Módulos del Sistema

### 1️⃣ Módulo de Pedidos

**Funcionalidades:**
- ✅ Crear pedidos manualmente
- ✅ Importar pedidos desde Excel/CSV
- ✅ Asignar a camiones
- ✅ Cambiar estados (Pendiente → Asignado → En Ruta → Entregado)
- ✅ Eliminar pedidos
- ✅ Filtros avanzados:
  - Por estado
  - Por prioridad
  - Por cliente
  - Por fecha
  - Por zona/ciudad
  - Por fecha de vencimiento
  - Por vendedor asignado

**Estadísticas disponibles:**
- Total de pedidos
- Pendientes
- Asignados
- En ruta
- Entregados
- Vencimientos (vencidos, próximos, vigentes)

**Acciones rápidas:**
- Ver detalles completos del pedido
- Asignar a camión disponible
- Cambiar prioridad
- Editar información

---

### 2️⃣ Módulo de Camiones

**Funcionalidades:**
- ✅ Ver flota completa
- ✅ Estados: Disponible, Asignado, En Ruta, Mantenimiento
- ✅ Asignar múltiples pedidos a un camión
- ✅ Ver ubicación en tiempo real
- ✅ Ver ruta asignada
- ✅ Estadísticas de rendimiento

**Información por camión:**
- Placa y modelo
- Conductor asignado
- Capacidad (kg)
- Ubicación actual
- Velocidad
- Combustible
- Pedidos asignados

---

### 3️⃣ Módulo de Despachos

**Funcionalidades:**
- ✅ Crear despachos con múltiples pedidos
- ✅ Seleccionar pedidos por zona
- ✅ Asignar camión
- ✅ Asignar conductor
- ✅ Optimización automática de rutas
- ✅ Modificar orden de entregas (drag & drop)
- ✅ Calcular peso y volumen total

**Panel de despacho:**
- Lista de pedidos disponibles agrupados por zona
- Selector de camión disponible
- Selector de conductor disponible
- Resumen de carga (peso, volumen, productos)
- Botón de crear despacho

---

### 4️⃣ Módulo de Seguimiento

**Funcionalidades:**
- ✅ Ver despachos activos
- ✅ Seguimiento en tiempo real
- ✅ Mapa con ruta optimizada
- ✅ Progreso de entregas
- ✅ Modificar ruta durante el viaje
- ✅ Actualizar estado de entregas

**Información disponible:**
- Despacho ID
- Camión y conductor
- Total de pedidos
- Pedidos completados
- Distancia total
- Tiempo estimado
- Próxima parada

---

### 5️⃣ Módulo de Mapa

**Funcionalidades:**
- ✅ Visualización completa en tiempo real
- ✅ Todos los camiones en movimiento
- ✅ Todos los pedidos por estado
- ✅ Rutas optimizadas
- ✅ Filtros dinámicos:
  - Todos en seguimiento
  - Solo camiones
  - Solo pedidos
  - Solo en ruta
  - Solo pendientes
  - Solo asignados

**Estadísticas del mapa:**
- Camiones activos
- Pedidos activos
- Rutas activas
- Distancia promedio
- Cobertura (ciudades)

---

### 6️⃣ Módulo de Ubicaciones

**Funcionalidades:**
- ✅ Ver todos los pedidos en mapa
- ✅ Corregir ubicaciones pendientes
- ✅ Marcadores arrastrables
- ✅ Editar dirección y ciudad
- ✅ Estadísticas de correcciones

**Uso típico:**
- Operadores corrigen ubicaciones de pedidos importados
- Validación de coordenadas vs ciudad
- Ajuste fino de ubicaciones incorrectas

---

### 7️⃣ Módulo de Clientes (NUEVO) ⭐

**Funcionalidades:**
- ✅ Gestión de clientes únicos
- ✅ Filtros por vendedor asignado
- ✅ Búsqueda por nombre, código, dirección
- ✅ Mapa interactivo con marcadores arrastrables
- ✅ Edición que afecta TODOS los pedidos del cliente
- ✅ Historial de cambios con auditoría
- ✅ Estadísticas por vendedor

**Ideal para:**
- Vendedores corrigiendo ubicaciones de su cartera
- Primera fase de corrección de datos
- Trabajo individual por vendedor
- Validación de direcciones antes de despachar

---

### 8️⃣ Módulo Conductor (Tracking GPS)

**Funcionalidades:**
- ✅ Compartir ubicación GPS cada 15 segundos
- ✅ Ver ruta asignada
- ✅ Interfaz optimizada para móvil/tablet
- ✅ Sincronización en tiempo real

**Uso:**
- El conductor abre esta pestaña en su dispositivo móvil
- El sistema captura su ubicación automáticamente
- La ubicación se muestra en tiempo real en el módulo de Seguimiento

---

## 📚 Guía por Rol

### 👨‍💼 Guía para ADMIN/OPERADOR

#### Flujo típico diario:

**1. Importar Pedidos del Día**
```
Pedidos → Importar → Seleccionar Excel/CSV → Confirmar
```

**2. Validar Ubicaciones**
```
Clientes → Filtrar por "Todos" → Revisar marcadores rojos → Corregir ubicaciones
```

**3. Crear Despachos**
```
Despachos → Seleccionar pedidos por zona → Asignar camión → Asignar conductor → Crear Despacho
```

**4. Monitorear Entregas**
```
Seguimiento → Ver despachos activos → Monitorear progreso → Actualizar estados
```

**5. Revisar Estadísticas**
```
Mapa → Ver dashboard general → Analizar rendimiento
```

---

### 🚚 Guía para DESPACHADOR

#### Flujo de creación de despacho:

**1. Revisar Pedidos Pendientes**
```
Pedidos → Filtrar por "Pendiente" → Identificar zonas con más pedidos
```

**2. Validar Ubicaciones (Opcional)**
```
Clientes → Filtrar por zona → Corregir ubicaciones si es necesario
```

**3. Crear Despacho**
```
Despachos → Panel izquierdo: expandir zona
→ Seleccionar pedidos (checkbox)
→ Panel derecho: seleccionar camión
→ Seleccionar conductor
→ Verificar resumen (peso, volumen)
→ Crear Despacho
```

**4. Optimizar Ruta (Automático)**
```
Sistema optimiza automáticamente al crear despacho
```

**5. Seguimiento**
```
Seguimiento → Ver despacho creado → Monitorear progreso
```

---

### 👔 Guía para VENDEDOR

#### Flujo de corrección de ubicaciones:

**Paso 1: Acceder al Módulo**
```
Login → Pestaña "Clientes"
```

**Paso 2: Filtrar Tu Cartera**
```
Panel izquierdo → Filtro de vendedor → Seleccionar tu nombre
```

**Paso 3: Buscar Cliente**
```
Usar barra de búsqueda O scroll en la lista
```

**Paso 4: Seleccionar Cliente**
```
Clic en el cliente → El mapa hace zoom a su ubicación
```

**Paso 5: Corregir Ubicación**
```
Clic en "Corregir Ubicación" → Se abre panel derecho
```

**Paso 6: Ajustar Coordenadas**

**Opción A - Visual (Recomendado):**
```
Arrastrar el marcador AMARILLO en el mapa a la ubicación correcta
Las coordenadas se actualizan automáticamente
```

**Opción B - Manual:**
```
Editar dirección y ciudad en el formulario
O ingresar latitud/longitud si las conoces
```

**Paso 7: Guardar**
```
Verificar que la ubicación sea correcta
Clic en "Guardar Cambios"
El marcador cambia a VERDE (ubicación corregida)
```

**Paso 8: Continuar**
```
Repetir con el siguiente cliente
```

---

### 🚗 Guía para CONDUCTOR

#### Uso del módulo de tracking:

**Paso 1: Acceder**
```
Login → Pestaña "Conductor"
```

**Paso 2: Permitir Ubicación**
```
El navegador pedirá permiso para acceder a tu ubicación
→ Permitir
```

**Paso 3: Iniciar Tracking**
```
El sistema comenzará a capturar tu ubicación cada 15 segundos automáticamente
```

**Paso 4: Mantener Activo**
```
Dejar la pestaña abierta durante todo el recorrido
No cerrar el navegador
```

**Notas:**
- Funciona mejor con GPS activo
- Consume datos móviles (aproximadamente 2-5 MB por hora)
- Recomendado: usar en tablet o teléfono montado en el vehículo

---

### 👁️ Guía para VISOR

#### Consulta de información:

**Ver Estado de Pedidos:**
```
Pedidos → Aplicar filtros → Ver detalles
```

**Ver Ubicaciones:**
```
Mapa → Aplicar filtros → Ver estado en tiempo real
```

**Ver Seguimiento:**
```
Seguimiento → Seleccionar despacho → Ver progreso
```

---

## ❓ Preguntas Frecuentes

### General

**P: ¿Cómo recupero mi contraseña?**
R: Contacta al administrador del sistema. En modo Firebase, se puede usar "Olvidé mi contraseña" (próxima actualización).

**P: ¿El sistema funciona en móvil?**
R: Sí, especialmente el módulo de Conductor. Los demás módulos funcionan mejor en computadora/tablet.

**P: ¿Los cambios se guardan automáticamente?**
R: No, debes hacer clic en "Guardar" o botones similares para confirmar cambios.

---

### Módulo de Pedidos

**P: ¿Qué formato de Excel acepta el sistema?**
R: Acepta .xlsx y .csv. Debe tener columnas como: numero_pedido, nombre_cliente, direccion_cliente, ciudad_cliente, vendedor, etc.

**P: ¿Puedo eliminar un pedido ya despachado?**
R: No se recomienda. Los pedidos entregados deben mantenerse para historial.

**P: ¿Cómo cambio la prioridad de un pedido?**
R: En la tarjeta del pedido → Editar → Cambiar prioridad → Guardar.

---

### Módulo de Clientes

**P: ¿Por qué no veo todos los clientes?**
R: Si eres vendedor, solo ves tu cartera asignada. Verifica el filtro de vendedor.

**P: ¿Los cambios afectan todos los pedidos del cliente?**
R: Sí, al corregir la ubicación de un cliente, se actualizan TODOS sus pedidos (pasados y futuros).

**P: ¿Puedo deshacer un cambio?**
R: No hay función de deshacer, pero el historial muestra la ubicación anterior.

**P: ¿El marcador no se mueve?**
R: Asegúrate de estar en modo edición (botón "Corregir Ubicación" presionado). Solo el marcador AMARILLO es arrastrable.

---

### Módulo de Despachos

**P: ¿Puedo crear un despacho con un solo pedido?**
R: Sí, pero se recomienda agrupar pedidos de la misma zona para eficiencia.

**P: ¿Cómo optimizo una ruta?**
R: El sistema optimiza automáticamente al crear el despacho. En Seguimiento puedes modificar manualmente con drag & drop.

**P: ¿Qué pasa si un camión no está disponible?**
R: Solo aparecen camiones con estado "Disponible" o "Asignado" en el selector.

---

### Tracking GPS

**P: ¿Por qué no se ve mi ubicación?**
R: Verifica que:
- Hayas dado permiso al navegador
- El GPS esté activado
- Tengas conexión a internet
- La pestaña esté activa (no minimizada)

**P: ¿Cada cuánto se actualiza mi ubicación?**
R: Cada 15 segundos automáticamente.

**P: ¿Consume mucha batería?**
R: El GPS consume batería. Recomendado: conectar el dispositivo a corriente.

---

## 🆘 Soporte y Contacto

### Reportar un Problema

**1. Tomar captura de pantalla** del error
**2. Anotar:**
- Tu rol de usuario
- Qué estabas haciendo
- Qué esperabas que pasara
- Qué pasó realmente

**3. Contactar a:**
- Email del administrador del sistema
- O abrir ticket en el sistema de soporte

---

### Errores Comunes

**"Credenciales inválidas"**
- Verifica tu email y contraseña
- Asegúrate de no tener espacios extra
- Contacta al admin si olvidaste tu contraseña

**"No tienes permisos para esta acción"**
- Tu rol no tiene acceso a esa función
- Contacta al admin si necesitas permisos adicionales

**"Error de conexión"**
- Verifica tu conexión a internet
- Recarga la página (F5)
- Si persiste, contacta soporte técnico

**"Los cambios no se guardaron"**
- Verifica que hayas hecho clic en "Guardar"
- Puede ser un problema de permisos de Firebase
- Contacta a soporte técnico

---

## 📊 Glosario de Términos

- **Pedido**: Solicitud de entrega de productos a un cliente
- **Despacho**: Agrupación de pedidos asignados a un camión y conductor
- **Ruta**: Secuencia optimizada de paradas para entregar pedidos
- **Zona**: Área geográfica (ciudad o región)
- **Estado**: Situación actual (Pendiente, Asignado, En Ruta, Entregado)
- **Prioridad**: Urgencia del pedido (Alta, Media, Baja)
- **Tracking**: Seguimiento en tiempo real de ubicación
- **Geocodificación**: Convertir direcciones en coordenadas GPS
- **Marcador**: Ícono en el mapa que representa una ubicación
- **Cartera**: Conjunto de clientes asignados a un vendedor

---

## 🎓 Tips y Mejores Prácticas

### Para Vendedores
✅ Corrige ubicaciones de lunes a miércoles (menor carga operativa)
✅ Usa la búsqueda para encontrar clientes rápidamente
✅ Verifica en Google Maps si tienes dudas de la ubicación
✅ Anota problemas recurrentes para reportar patrones

### Para Despachadores
✅ Crea despachos por zona para optimizar combustible
✅ Revisa el peso y volumen antes de confirmar
✅ Asigna conductores con experiencia en zonas difíciles
✅ Verifica ubicaciones antes de despachar (pestaña Clientes)

### Para Conductores
✅ Inicia el tracking antes de salir del almacén
✅ Mantén el GPS activado todo el recorrido
✅ Conecta el dispositivo a corriente
✅ Avisa si la ubicación no es correcta

### Para Operadores
✅ Importa pedidos temprano en la mañana
✅ Valida ubicaciones antes de crear despachos
✅ Revisa el historial de cambios para auditoría
✅ Usa filtros para trabajar más eficientemente

---

## 📱 Atajos de Teclado (Próximamente)

- `Ctrl + K`: Búsqueda rápida
- `Ctrl + N`: Nuevo pedido
- `Ctrl + S`: Guardar cambios
- `Esc`: Cerrar modal

---

## 🔄 Actualizaciones Recientes

**Versión 2.0 (26 Enero 2025)**
- ✅ Nuevo módulo de Gestión de Clientes
- ✅ Filtros por vendedor asignado
- ✅ Marcadores arrastrables en mapa
- ✅ Historial de cambios con auditoría
- ✅ Nuevo rol "Vendedor"
- ✅ Importador reconoce columna vendedor

**Versión 1.x (Enero 2025)**
- Sistema base de tracking
- Módulos: Pedidos, Camiones, Despachos, Seguimiento
- Integración con Firebase
- Optimización de rutas

---

## 📞 Información de Contacto

**Soporte Técnico:**
- Email: [Insertar email del administrador]
- Horario: Lunes a Viernes, 8:00 AM - 6:00 PM

**Documentación Adicional:**
- Guía Técnica: `MODULO_GESTION_CLIENTES.md`
- Estado del Proyecto: `ESTADO_PROYECTO_2025-01-18.md`
- Configuración Firebase: `GUIA_CONFIGURACION_FIREBASE.md`

---

**¡Gracias por usar nuestro sistema de tracking! 🚚📦**

Si tienes sugerencias para mejorar esta guía, por favor contacta al administrador.
