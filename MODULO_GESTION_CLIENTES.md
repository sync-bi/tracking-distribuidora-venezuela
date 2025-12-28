# 📋 Módulo de Gestión de Clientes

## 🎯 Objetivo

Este módulo permite a los **vendedores** corregir las ubicaciones de **TODOS los clientes** desde un archivo CSV independiente (`clientes.csv`), facilitando la corrección de datos geográficos de manera centralizada y sin depender de los pedidos.

---

## ✨ Características Principales

### 1. **Carga Independiente desde CSV**
- Carga clientes desde `public/clientes.csv` automáticamente
- **Independiente de pedidos** - no requiere tener pedidos en el sistema
- Detección inteligente de coordenadas lat/lng invertidas
- Soporte para coordenadas de Venezuela (lat 0-15°N, lng -60° a -75°W)

### 2. **Filtros Avanzados**
- 🔍 **Búsqueda**: Por nombre, código, dirección o ciudad
- 👤 **Por Vendedor**: Cada vendedor ve solo sus clientes asignados
- 📊 **Estadísticas en tiempo real**: Total clientes, % ubicados

### 3. **Corrección de Ubicaciones**
- 🗺️ **Mapa interactivo** con todos los clientes
- 📍 **Marcadores arrastrables**: Ajusta la ubicación con precisión
- ✏️ **Edición de datos**: Dirección, ciudad y coordenadas
- 💾 **Guardado automático**: Los cambios se aplican a todos los pedidos del cliente
- 📝 **Historial de cambios**: Registro de todas las correcciones realizadas

### 4. **Estados Visuales**
- 🟢 **Verde**: Ubicación corregida
- 🔴 **Rojo**: Sin corregir
- 🟡 **Amarillo**: En edición (arrastrable)

---

## 🚀 Cómo Usar el Módulo

### Paso 1: Acceder al Módulo
1. Iniciar sesión con credenciales de vendedor
2. Hacer clic en la pestaña **"Clientes"** en la navegación superior

### Paso 2: Filtrar Clientes
```
Opciones de filtro:
- Buscar por nombre o código de cliente
- Seleccionar "Mi cartera" en el filtro de vendedores
- Ver estadísticas en tiempo real
```

### Paso 3: Corregir Ubicación
1. **Seleccionar cliente** de la lista (aparece resaltado en azul)
2. **Hacer clic en "Corregir Ubicación"**
3. **Panel de edición se abre** a la derecha con:
   - Información del cliente
   - Formulario de edición
   - Advertencia de pedidos afectados

### Paso 4: Ajustar Coordenadas

#### Opción A: Arrastrar Marcador
1. El marcador amarillo en el mapa es arrastrable
2. Mover el marcador a la ubicación correcta
3. Las coordenadas se actualizan automáticamente

#### Opción B: Editar Manualmente
1. Modificar dirección y ciudad
2. Ingresar latitud/longitud si se conocen
3. Las coordenadas se actualizan en el formulario

### Paso 5: Guardar Cambios
1. Hacer clic en **"Guardar Cambios"**
2. Los cambios se aplican a **TODOS** los pedidos del cliente
3. Se registra en el historial de cambios
4. El marcador cambia a verde (ubicación corregida)

---

## 👥 Roles y Permisos

### Rol: **Vendedor**
```javascript
Permisos: ['clientes', 'pedidos', 'mapa']
```
- ✅ Acceso al módulo de Clientes
- ✅ Ver y editar clientes de su cartera
- ✅ Ver pedidos asignados
- ✅ Ver mapa general
- ❌ No puede crear despachos
- ❌ No puede gestionar camiones

### Rol: **Admin / Operador**
```javascript
Permisos: ['pedidos', 'camiones', 'despachos', 'seguimiento', 'conductor', 'mapa', 'ubicaciones', 'clientes']
```
- ✅ Acceso completo al módulo de Clientes
- ✅ Ver y editar TODOS los clientes
- ✅ Acceso a todos los módulos

### Rol: **Despachador**
```javascript
Permisos: ['despachos', 'seguimiento', 'camiones', 'mapa', 'ubicaciones', 'clientes']
```
- ✅ Acceso al módulo de Clientes
- ✅ Puede corregir ubicaciones antes de crear despachos

---

## 📦 Estructura de Datos

### Modelo de Cliente (Cargado desde CSV)
```javascript
{
  id: 'CLI001',                    // Código del cliente (co_cli del CSV)
  codigoCliente: 'CLI001',
  nombre: 'Distribuidora El Sol C.A.',
  ciudad: 'Caracas',
  direccion: 'Av. Francisco de Miranda, Los Palos Grandes',
  direccionTemporal: '',           // direccion_temporal del CSV
  coordenadas: {
    lat: 10.4975,
    lng: -66.8535,
    corregida: true  // Indica si fue corregida manualmente
  },
  // Para compatibilidad con UI
  vendedorAsignado: 'Sin asignar',
  totalPedidos: 0
}
```

### Historial de Cambios
```javascript
{
  cliente: 'Distribuidora El Sol C.A.',
  fecha: '2025-01-20T10:30:00Z',
  ubicacionAnterior: {
    direccion: 'Av. Miranda',
    ciudad: 'Caracas',
    coordenadas: { lat: 10.4975, lng: -66.8535 }
  },
  ubicacionNueva: {
    direccion: 'Av. Francisco de Miranda, Los Palos Grandes',
    ciudad: 'Caracas',
    lat: 10.4980,
    lng: -66.8540
  },
  metodo: 'manual',  // manual | automatico | importacion
  razon: 'Corrección de ubicación por vendedor',
  pedidosAfectados: ['PED001', 'PED002', 'PED003']
}
```

---

## 📊 Importación de Pedidos con Vendedor

### Columnas Reconocidas en Excel/CSV
El importador reconoce automáticamente las siguientes columnas para vendedor:
- `vendedor`
- `vendedor_asignado`
- `asesor`
- `asesor_comercial`

### Ejemplo de Excel
| numero_pedido | nombre_cliente | direccion_cliente | ciudad_cliente | **vendedor** | lat | lng |
|---------------|----------------|-------------------|----------------|--------------|-----|-----|
| PED001 | Distribuidora El Sol | Av. Miranda | Caracas | Juan Pérez | 10.4975 | -66.8535 |
| PED002 | Comercial Los Andes | Calle 23 | Caracas | María González | 10.4715 | -66.9190 |

### Si NO hay columna de vendedor
- El campo `vendedorAsignado` se establece automáticamente como **"Sin asignar"**
- Los clientes "Sin asignar" aparecen en el filtro de vendedores
- Se pueden reasignar manualmente después

---

## 🔄 Flujo de Trabajo Recomendado

### Fase 1: Corrección Inicial por Vendedores
```mermaid
Usuario (Vendedor)
  → Accede a módulo "Clientes"
  → Filtra por "Mi cartera"
  → Corrige ubicaciones de sus clientes
  → Sistema actualiza todos los pedidos del cliente
```

### Fase 2: Revisión por Operadores
```mermaid
Usuario (Operador)
  → Accede a módulo "Clientes"
  → Filtra por "Todos los vendedores"
  → Revisa clientes con ubicaciones sin corregir
  → Corrige ubicaciones faltantes
```

### Fase 3: Uso en Despachos
```mermaid
Usuario (Despachador)
  → Crea despacho desde pestaña "Despachos"
  → Sistema usa ubicaciones corregidas
  → Rutas optimizadas con coordenadas correctas
```

---

## 🛠️ Archivos Creados/Modificados

### Nuevos Archivos
1. **`src/hooks/useClientesCSV.js`** (290 líneas)
   - Hook personalizado para cargar clientes desde CSV
   - **Independiente de pedidos** - carga desde `public/clientes.csv`
   - Detección inteligente de coordenadas invertidas (lat/lng)
   - Funciones de búsqueda y filtrado por ciudad
   - Gestión de historial de cambios
   - Exportación de clientes actualizados a CSV

2. **`public/clientes.csv`**
   - Archivo CSV con datos de clientes
   - Columnas: co_cli, cliente, ciudad, direccion_principal, direccion_temporal, latitud, longitud

3. **`src/components/Clientes/TabGestionClientes.js`** (700+ líneas)
   - Componente principal del módulo
   - Usa `useClientesCSV` internamente (sin props)
   - Mapa interactivo con Mapbox
   - Panel de lista de clientes con filtro por ciudad
   - Panel de edición con formulario y marcador único amarillo
   - Modal de historial de cambios

4. **`MODULO_GESTION_CLIENTES.md`** (este documento)
   - Documentación completa del módulo

### Archivos Modificados
1. **`src/App.js`**
   - Import de `TabGestionClientes` sin props
   - El componente es autónomo con su propio hook

2. **`src/components/Layout/Navigation.js`**
   - Tab "Clientes" con ícono `Building2`

---

## 🎨 Interfaz de Usuario

### Panel Izquierdo (Lista de Clientes)
```
┌─────────────────────────────────────┐
│  📋 Gestión de Clientes             │
│  Corrección de ubicaciones          │
├─────────────────────────────────────┤
│  📊 5 Total    ✅ 80% Ubicados      │
├─────────────────────────────────────┤
│  🔍 [Buscar cliente...]             │
│  👤 [Filtro: Mi cartera      ▼]     │
│  5 clientes                          │
├─────────────────────────────────────┤
│  ✅ Distribuidora El Sol C.A.       │
│     Av. Francisco de Miranda         │
│     👤 Juan Pérez | 3 pedidos       │
│     [Corregir Ubicación]            │
├─────────────────────────────────────┤
│  🔴 Comercial Los Andes             │
│     Calle 23, Centro Comercial      │
│     👤 María González | 2 pedidos   │
│     [Corregir Ubicación]            │
└─────────────────────────────────────┘
```

### Panel Central (Mapa)
```
┌─────────────────────────────────────────┐
│  🗺️ Mapa de Ubicaciones                 │
│  → Distribuidora El Sol C.A.            │
├─────────────────────────────────────────┤
│                                         │
│    📍 (verde) - Ubicación corregida    │
│    📍 (roja)  - Sin corregir           │
│    📍 (amarilla) - Editando            │
│                                         │
│         [Mapa Interactivo]             │
│                                         │
└─────────────────────────────────────────┘
```

### Panel Derecho (Edición - Solo cuando hay cliente editando)
```
┌─────────────────────────────────────┐
│  ✏️ Editando Cliente                │
│  Distribuidora El Sol C.A.    [×]   │
├─────────────────────────────────────┤
│  👤 Vendedor: Juan Pérez            │
│  📦 Pedidos: 3                      │
├─────────────────────────────────────┤
│  ⚠️ Los cambios afectarán 3 pedidos│
├─────────────────────────────────────┤
│  Dirección:                         │
│  [______________________________]   │
│                                     │
│  Ciudad:                            │
│  [______________________________]   │
│                                     │
│  Latitud:        Longitud:          │
│  [__________]    [__________]       │
├─────────────────────────────────────┤
│  💡 Arrastra el marcador amarillo   │
│     para ajustar la ubicación       │
├─────────────────────────────────────┤
│  [   💾 Guardar Cambios   ]         │
│  [   ❌ Cancelar          ]         │
└─────────────────────────────────────┘
```

---

## 🔐 Seguridad

### Control de Acceso
- Cada vendedor solo ve sus clientes asignados
- Admin/Operador pueden ver todos los clientes
- Las correcciones se registran con fecha y usuario

### Validaciones
- Coordenadas válidas (rango de Venezuela)
- Dirección y ciudad requeridas
- Confirmación antes de guardar cambios masivos

---

## 📈 Estadísticas y Métricas

### Métricas Disponibles
- **Total de clientes**: Clientes únicos en el sistema
- **Porcentaje ubicados**: % con coordenadas correctas
- **Clientes por vendedor**: Distribución de cartera
- **Historial de cambios**: Auditoría completa

### Próximas Mejoras
- 📊 Dashboard de progreso por vendedor
- 🎯 Metas de corrección por equipo
- 📧 Notificaciones de cambios
- 🗺️ Geocodificación automática

---

## 🐛 Troubleshooting

### Problema: No veo mis clientes
**Solución**:
- Verificar que el filtro de vendedor esté en "Mi cartera" o tu nombre
- Verificar que los pedidos tengan el campo `vendedorAsignado`
- Si no aparece nada, puede que no tengas clientes asignados aún

### Problema: El marcador no se mueve
**Solución**:
- Asegurarse de estar en modo edición (hacer clic en "Corregir Ubicación")
- El marcador amarillo es el único arrastrable
- Recargar la página si persiste

### Problema: Los cambios no se guardan
**Solución**:
- Verificar que estés autenticado
- Verificar permisos de escritura
- Revisar la consola del navegador (F12) para errores
- Si es un problema de Firestore, usar modo local

### Problema: Importé Excel sin columna vendedor
**Solución**:
- Los pedidos se importan con `vendedorAsignado: "Sin asignar"`
- Puedes filtrar por "Sin asignar" y asignarlos manualmente
- O re-importar con columna de vendedor incluida

---

## 🎓 Capacitación para Vendedores

### Guión de Capacitación (5 minutos)

**Minuto 1: Introducción**
- "Vamos a corregir las ubicaciones de tus clientes en el mapa"
- "Esto ayudará a que las entregas sean más eficientes"

**Minuto 2: Acceso**
- Iniciar sesión → Pestaña "Clientes"
- Filtrar por "Mi cartera"

**Minuto 3: Selección**
- Hacer clic en un cliente de la lista
- Ver su ubicación en el mapa

**Minuto 4: Corrección**
- Clic en "Corregir Ubicación"
- Arrastrar el marcador amarillo a la ubicación correcta
- O editar dirección/ciudad manualmente

**Minuto 5: Guardar**
- Clic en "Guardar Cambios"
- Ver que el marcador cambia a verde
- Continuar con el siguiente cliente

---

## 📞 Soporte

### Contacto Técnico
- **Desarrollador**: Claude Code
- **Email**: [Email del administrador del sistema]
- **Documentación**: Este archivo + ESTADO_PROYECTO_2025-01-18.md

### Recursos Adicionales
- Firebase Console: https://console.firebase.google.com/project/tracking-distribuidora-sarego
- Mapbox Docs: https://docs.mapbox.com/mapbox-gl-js

---

## ✅ Checklist de Implementación

- [x] Crear hook `useClientesCSV` (carga desde CSV independiente)
- [x] Crear componente `TabGestionClientes`
- [x] Integrar en `App.js` (componente autónomo sin props)
- [x] Agregar pestaña en navegación
- [x] Actualizar permisos de roles
- [x] Crear rol `vendedor`
- [x] Detección inteligente de coordenadas invertidas
- [x] Marcador único amarillo al editar (sin confusión)
- [x] Exportación de clientes actualizados
- [x] Documentar módulo
- [ ] Pruebas con usuarios reales
- [ ] Desplegar a producción
- [ ] Capacitar vendedores

---

## 📄 Formato del Archivo CSV

### Columnas del archivo `public/clientes.csv`:
```csv
co_cli;cliente;ciudad;direccion_principal;direccion_temporal;latitud;longuitud
CLI001;Distribuidora El Sol;Caracas;Av. Miranda 123;NULL;10.4975;-66.8535
```

**Notas:**
- Separador: punto y coma (`;`)
- La columna `longuitud` puede tener errores tipográficos - el sistema lo detecta
- El sistema detecta automáticamente si lat/lng están invertidas basándose en:
  - Latitud Venezuela: 0° a 15° Norte (valores pequeños positivos)
  - Longitud Venezuela: -60° a -75° Oeste (valores negativos grandes)

---

**Última actualización**: 28 Diciembre 2025
**Versión**: 2.0
**Estado**: ✅ Implementado - Carga independiente desde CSV
