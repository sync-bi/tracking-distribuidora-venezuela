# Documentacion del Sistema de Tracking - Distribuidora Sarego

**Ultima actualizacion:** 5 de abril de 2026  
**Plataforma:** Vercel (Frontend + Serverless Functions)  
**Repositorio:** tracking-distribuidora1

---

## 1. Resumen del Sistema

El sistema de Tracking de Distribuidora Sarego es una plataforma web para la gestion integral de despachos y entregas. Permite sincronizar pedidos desde el ERP Profit Plus (SQL Server), planificar rutas de entrega sobre un mapa interactivo, asignar camiones y conductores, enviar notificaciones automaticas por WhatsApp a los clientes, y realizar seguimiento GPS en tiempo real de los vehiculos en ruta.

El flujo operativo cubre desde la recepcion de pedidos hasta la confirmacion de entrega (o registro de no conformidad), proporcionando visibilidad completa a operadores, despachadores, conductores y clientes.

---

## 2. Arquitectura

### Frontend
- **React** (Create React App)
- **Tailwind CSS** para estilos
- **Mapbox GL JS** para mapas interactivos y geocodificacion
- **Lucide React** para iconografia
- Desplegado en **Vercel**

### Backend
- **Vercel Serverless Functions** (Node.js) en la carpeta `/api`
- Sin servidor propio; las funciones se ejecutan bajo demanda

### Bases de Datos

| Componente | Tecnologia | Modo | Proposito |
|---|---|---|---|
| ERP | SQL Server (Profit Plus) | SOLO LECTURA | Pedidos, clientes, productos, vendedores, zonas, coordenadas |
| Datos operativos | Firebase Firestore | Lectura/Escritura | Despachos, estados de pedidos, conductores, camiones, no conformidades, recibos |
| GPS conductores | Firebase Realtime Database | Lectura/Escritura | Posiciones GPS en tiempo real de vehiculos |

### Servicios Externos
- **Mapbox**: Mapas, geocodificacion de direcciones por ciudad, planificacion visual de rutas
- **WhatsApp Web**: Notificaciones automaticas a clientes al crear despacho (via `wa.me` links)

### Conexion a SQL Server
La conexion se gestiona mediante un pool compartido en `api/lib/db.js` usando la libreria `mssql`. Configuracion:
- Timeout de conexion: 15 segundos
- Timeout de request: 30 segundos
- Pool: maximo 5 conexiones, minimo 0, idle timeout 30 segundos
- Encriptacion deshabilitada (`encrypt: false`, `trustServerCertificate: true`)

---

## 3. Flujo Operativo Completo

El flujo diario de trabajo es el siguiente:

### Paso 1: Sincronizar Pedidos
- En la pestana **Pedidos**, el operador presiona **"Actualizar desde Profit"**
- El sistema llama a `GET /api/pedidos` que consulta SQL Server
- Los pedidos se almacenan en Firebase Firestore para uso en tiempo real
- Se muestran con sus productos, cantidades, montos y estado de despacho

### Paso 2: Planificar Despacho
- En la pestana **Despachos**, el despachador:
  - Selecciona pedidos pendientes de la lista
  - Los visualiza en el **mapa de planificacion** (Mapbox)
  - Asigna un **camion** y un **conductor** al despacho
  - Crea el despacho

### Paso 3: Notificacion WhatsApp
- Al crear el despacho, el sistema abre automaticamente ventanas de WhatsApp Web
- Cada cliente recibe un mensaje con:
  - Placa del vehiculo
  - Nombre del conductor
  - Link de seguimiento en tiempo real (`/tracking/{numeroPedido}`)
- **MODO PRUEBA ACTUAL:** Todos los mensajes se envian al numero `+57 313 496 7101`
- En produccion se cambiara al telefono real de cada cliente

### Paso 4: Conductor Inicia Ruta
- En la pestana **Conductor**, el chofer:
  - Selecciona su vehiculo asignado
  - Presiona **"Iniciar Ruta"**
  - El GPS del dispositivo comienza a enviar posiciones cada 15 segundos / 50 metros minimo
  - Las posiciones se guardan en Firebase Realtime Database

### Paso 5: Entrega o No Conformidad
- El conductor ve la lista de pedidos asignados a su camion
- Para cada entrega puede:
  - Marcar como **Entregado** (genera recibo de entrega)
  - Marcar como **Entrega Parcial**
  - Marcar como **Desistido** (genera automaticamente una No Conformidad)

### Paso 6: Seguimiento en Tiempo Real
- En la pestana **Seguimiento**, los operadores ven:
  - Timeline del pedido (estados por los que ha pasado)
  - Posicion GPS actual del vehiculo en el mapa
  - Historial de estados
  - Recibo de entrega cuando esta disponible
- Los clientes acceden via el link `/tracking/{numeroPedido}` (autenticacion anonima)

### Paso 7: No Conformidades
- Se generan automaticamente cuando un conductor marca una entrega como no conforme
- Tambien se pueden crear manualmente
- Se clasifican por tipo y gravedad
- Flujo: Abierta -> En Investigacion -> Resuelta/Cerrada

---

## 4. Modulos del Sistema

### 4.1 Pedidos (`TabPedidos`)
- **Que hace:** Muestra los pedidos sincronizados desde Profit Plus. Permite filtrar por estado (pendientes, despachados, todos), buscar por numero o cliente, y ver el detalle de productos.
- **Funcionalidades clave:**
  - Sincronizacion desde SQL Server (boton "Actualizar desde Profit")
  - Filtros por estado de despacho y prioridad
  - Visualizacion de productos con cantidades pendientes y despachadas
  - Porcentaje de despacho por pedido
  - Eliminacion de pedidos de la vista
- **Roles que acceden:** admin, operador, visor, vendedor

### 4.2 Despachos (`TabDespachoSimplificado`)
- **Que hace:** Permite planificar y crear despachos. El despachador selecciona pedidos, los visualiza en un mapa de planificacion, asigna camion y conductor, y genera el despacho.
- **Funcionalidades clave:**
  - Seleccion multiple de pedidos pendientes
  - Mapa de planificacion con Mapbox (visualizar ubicaciones de entrega)
  - Asignacion de camion y conductor
  - Creacion de despacho con notificacion WhatsApp automatica
  - Vista de despachos activos y su seguimiento
- **Roles que acceden:** admin, operador, despachador

### 4.3 Seguimiento (`SeguimientoPedido` + `TabSeguimientoDespachos`)
- **Que hace:** Monitoreo en tiempo real de pedidos y despachos. Muestra timeline de estados, posicion GPS del vehiculo y recibos de entrega.
- **Funcionalidades clave:**
  - Timeline visual con estados: Pendiente -> En Consolidacion -> Asignado -> En Ruta -> Entregado
  - Mapa con posicion GPS del vehiculo en tiempo real
  - Historial completo de cambios de estado
  - Acceso publico via link de tracking (autenticacion anonima Firebase)
  - Visualizacion de recibo de entrega
- **Roles que acceden:** admin, operador, despachador, visor
- **Acceso externo:** Clientes via link `/tracking/{numeroPedido}`

### 4.4 Conductor (`Tracker`)
- **Que hace:** Interfaz para el conductor en ruta. Permite iniciar/detener tracking GPS, ver pedidos asignados a su camion y registrar entregas.
- **Funcionalidades clave:**
  - Seleccion de vehiculo asignado
  - Inicio/parada de tracking GPS (cada 15 seg / 50 metros)
  - Lista de pedidos asignados al camion (excluye entregados)
  - Formulario de entrega: entregado, parcial o desistido
  - Generacion de recibo de entrega
  - Creacion automatica de no conformidad en entregas desistidas
- **Roles que acceden:** conductor

### 4.5 Clientes (`TabGestionClientes`)
- **Que hace:** Gestion y consulta de clientes sincronizados desde Profit Plus. Permite buscar, filtrar por zona/vendedor y corregir ubicaciones en el mapa.
- **Funcionalidades clave:**
  - Consulta de clientes desde SQL Server (`GET /api/clientes`)
  - Filtros por zona, vendedor, estado (activos/inactivos)
  - Busqueda por nombre, codigo o direccion
  - Correccion de ubicaciones GPS por vendedores (se guardan en Firebase `clientes_correcciones`)
  - Visualizacion en mapa
- **Roles que acceden:** admin, operador, despachador, vendedor

### 4.6 Flota y Conductores (`TabCamiones`)
- **Que hace:** Gestion de la flota de vehiculos y conductores.
- **Funcionalidades clave:**
  - Alta, edicion y baja de camiones
  - Alta, edicion y baja de conductores
  - Estados de camiones: Disponible, Asignado, En Ruta, Mantenimiento, Fuera de Servicio
  - Asignacion de conductor a vehiculo
- **Roles que acceden:** admin, operador, despachador

### 4.7 No Conformidad (`TabNoConformidad`)
- **Que hace:** Gestion de no conformidades en entregas. Registro, seguimiento y cierre de incidencias.
- **Funcionalidades clave:**
  - Creacion automatica al registrar entrega desistida
  - Creacion manual de no conformidades
  - Tipos: Producto danado, Producto faltante, Producto incorrecto, Retraso en entrega, Devolucion, Problema de documentacion, Queja del cliente, Otro
  - Clasificacion por gravedad
  - Flujo de estados: Abierta -> En Investigacion -> Resuelta/Cerrada
- **Roles que acceden:** admin, operador, despachador

---

## 5. Tablas SQL Server Involucradas (Profit Plus - SOLO LECTURA)

**IMPORTANTE:** El sistema SOLO LEE datos de SQL Server. Nunca escribe ni modifica registros. Toda la gestion operativa (estados, despachos, recibos) se maneja en Firebase.

### 5.1 `saPedidoVenta` - Pedidos de Venta
Tabla principal de pedidos del ERP.

| Campo | Descripcion |
|---|---|
| `doc_num` | Numero de pedido (identificador unico) |
| `fec_emis` | Fecha de emision del pedido |
| `fec_venc` | Fecha de vencimiento |
| `total_neto` | Total neto del pedido |
| `total_bruto` | Total bruto del pedido |
| `status` | Estado Profit: 0=Pendiente, 1=Parcial, 2=Completado |
| `anulado` | Indicador de anulacion (0=activo, 1=anulado) |
| `co_ven` | Codigo de vendedor |
| `co_cli` | Codigo de cliente |
| `dir_ent` | Direccion de entrega |

**Requisito:** Los pedidos deben crearse en Profit Plus para que aparezcan en el sistema de tracking.

### 5.2 `saPedidoVentaReng` - Renglones del Pedido (Productos)
Detalle de productos por pedido.

| Campo | Descripcion |
|---|---|
| `doc_num` | Numero de pedido (FK) |
| `reng_num` | Numero de renglon |
| `co_art` | Codigo de articulo |
| `des_art` | Descripcion del articulo (puede estar vacia) |
| `total_art` | Cantidad total pedida |
| `pendiente` | Cantidad pendiente por despachar |
| `prec_vta` | Precio de venta unitario |
| `reng_neto` | Monto neto del renglon |
| `co_alma` | Codigo de almacen |

**Requisito:** Los articulos deben tener descripcion en `saArticulo` para que se muestre correctamente.

### 5.3 `saCliente` - Clientes
Maestro de clientes del ERP.

| Campo | Descripcion |
|---|---|
| `co_cli` | Codigo de cliente (identificador unico) |
| `cli_des` | Nombre/descripcion del cliente |
| `direc1` | Direccion principal |
| `telefonos` | Telefonos de contacto |
| `ciudad` | Ciudad (usada para geocodificacion si no hay coordenadas) |
| `co_zon` | Codigo de zona |
| `co_ven` | Codigo de vendedor asignado |
| `rif` | RIF del cliente |
| `email` | Correo electronico |
| `inactivo` | Indicador de inactividad |

**Requisitos para que el sistema funcione correctamente:**
- `cli_des`: Debe estar actualizado (nombre del cliente)
- `direc1`: Direccion completa y correcta
- `telefonos`: Necesario para WhatsApp (en produccion)
- `ciudad`: Si no hay coordenadas GPS, se usa para geocodificar con Mapbox
- `co_zon`: Para filtros por zona
- `co_ven`: Para filtros por vendedor

### 5.4 `saArticulo` - Articulos/Productos
Maestro de articulos.

| Campo | Descripcion |
|---|---|
| `co_art` | Codigo de articulo |
| `art_des` | Descripcion del articulo |

**Requisito:** Si `des_art` en el renglon del pedido esta vacia, se usa `art_des` de esta tabla como fallback.

### 5.5 `zt_coordenada` - Coordenadas GPS de Clientes
Tabla personalizada (no nativa de Profit) que almacena coordenadas GPS de clientes.

| Campo | Descripcion |
|---|---|
| `co_cli` | Codigo de cliente (FK) |
| `latitud` | Latitud GPS |
| `longuitud` | Longitud GPS (nota: el nombre del campo tiene un error ortografico) |

**Nota importante:** El sistema detecta y corrige automaticamente coordenadas invertidas (latitud/longitud intercambiadas). Usa la logica: si el primer valor esta entre 0 y 13, es latitud (Venezuela); si es negativo, es longitud.

**Requisito:** Mantener esta tabla actualizada para que los clientes aparezcan correctamente en el mapa.

### 5.6 `saZona` - Zonas
Maestro de zonas geograficas.

| Campo | Descripcion |
|---|---|
| `co_zon` | Codigo de zona |
| `zon_des` | Descripcion/nombre de la zona |

### 5.7 `saVendedor` - Vendedores
Maestro de vendedores.

| Campo | Descripcion |
|---|---|
| `co_ven` | Codigo de vendedor |
| `ven_des` | Nombre del vendedor |

---

## 6. Colecciones Firebase Firestore

### 6.1 `pedidos`
Pedidos sincronizados desde SQL Server. Se actualizan cada vez que se ejecuta la sincronizacion. Incluyen estado operativo gestionado por el sistema (no por Profit).

### 6.2 `despachos`
Despachos creados en la aplicacion. Contienen:
- Camion y conductor asignados
- Lista de pedidos incluidos
- Ruta planificada
- Fecha y hora de creacion

### 6.3 `conductores`
Registro de conductores con sus datos personales, licencia, telefono y estado.

### 6.4 `camiones`
Registro de vehiculos con placa, marca, modelo, capacidad y estado (Disponible, Asignado, En Ruta, Mantenimiento, Fuera de Servicio).

### 6.5 `no_conformidades`
Registros de no conformidad generados automaticamente al desistir una entrega, o creados manualmente. Incluyen tipo, gravedad, descripcion y estado de resolucion.

### 6.6 `recibos_entrega`
Comprobantes de entrega generados por el conductor al completar cada entrega. Incluyen firma, foto, observaciones y estado.

### 6.7 `clientes_correcciones`
Correcciones de ubicacion GPS realizadas por vendedores desde el modulo de Clientes. Tienen prioridad sobre las coordenadas de SQL Server.

### 6.8 `auditoria`
Registro de acciones importantes realizadas en el sistema (quien hizo que y cuando).

### Firebase Realtime Database
- **`/vehiculos/{vehiculoId}`**: Posicion GPS en tiempo real de cada vehiculo (latitud, longitud, timestamp, velocidad).

---

## 7. APIs del Sistema

Las APIs son Vercel Serverless Functions ubicadas en la carpeta `/api`.

### `GET /api/pedidos`

Obtiene pedidos de venta desde SQL Server.

**Parametros de query:**
| Parametro | Tipo | Descripcion |
|---|---|---|
| `desde` | `YYYY-MM-DD` | Fecha desde la cual traer pedidos (default: `2026-03-15`) |
| `estado` | `string` | `pendientes` (status 0,1), `despachados` (status 2), o `todos` |

**Respuesta:**
```json
{
  "ok": true,
  "fechaDesde": "2026-03-15",
  "resumen": {
    "total": 150,
    "pendientes": 80,
    "parciales": 30,
    "despachados": 40
  },
  "pedidos": [
    {
      "numeroPedido": "PED-001",
      "fechaEmision": "2026-03-20",
      "totalNeto": 1500.00,
      "estadoDespacho": "Pendiente",
      "porcentajeDespacho": 0,
      "nombreCliente": "Cliente ABC",
      "direccionCliente": "Av. Principal...",
      "coordenadas": { "lat": 10.48, "lng": -66.90 },
      "productos": [...]
    }
  ]
}
```

**Logica de estado:** El sistema determina el estado real del pedido combinando el `status` de Profit con las cantidades pendientes de cada producto:
- Status 2 + todo despachado = "Despachado"
- Status 2 + algo pendiente = "Parcial"
- Status 1 = "Parcial"
- Status 0 + algo despachado = "Parcial"
- Status 0 + nada despachado = "Pendiente"

### `GET /api/clientes`

Obtiene clientes desde SQL Server.

**Parametros de query:**
| Parametro | Tipo | Descripcion |
|---|---|---|
| `buscar` | `string` | Buscar por nombre, codigo o direccion |
| `zona` | `string` | Filtrar por codigo de zona |
| `vendedor` | `string` | Filtrar por codigo de vendedor |
| `activos` | `boolean` | Filtrar solo activos (default: `true`) |

**Respuesta:**
```json
{
  "ok": true,
  "total": 500,
  "clientes": [
    {
      "codigo": "CLI001",
      "nombre": "Cliente ABC",
      "direccion": "Av. Principal...",
      "telefono": "0212-1234567",
      "ciudad": "Caracas",
      "codigoZona": "Z01",
      "nombreZona": "Zona Capital",
      "codigoVendedor": "V01",
      "nombreVendedor": "Juan Perez",
      "rif": "J-12345678-0",
      "email": "cliente@email.com",
      "activo": true,
      "coordenadas": { "lat": 10.48, "lng": -66.90 }
    }
  ]
}
```

**Nota:** Retorna maximo 1000 clientes por consulta (TOP 1000).

---

## 7.3 Consultas SQL que ejecuta el sistema

### Consulta de Pedidos (api/pedidos.js)

```sql
SELECT
  RTRIM(p.doc_num) AS numero_pedido,
  p.fec_emis AS fecha_emision,
  p.fec_venc AS fecha_vencimiento,
  p.total_neto,
  p.total_bruto,
  p.status AS status_pedido,
  RTRIM(p.co_ven) AS codigo_vendedor,
  RTRIM(p.dir_ent) AS direccion_entrega,
  RTRIM(p.co_cli) AS codigo_cliente,
  RTRIM(c.cli_des) AS nombre_cliente,
  RTRIM(c.direc1) AS direccion_cliente,
  RTRIM(c.telefonos) AS telefono_cliente,
  RTRIM(c.ciudad) AS ciudad_cliente,
  RTRIM(c.co_zon) AS codigo_zona,
  RTRIM(z.zon_des) AS nombre_zona,
  RTRIM(v.ven_des) AS nombre_vendedor,
  RTRIM(coord.longuitud) AS coord_valor1,
  RTRIM(coord.latitud) AS coord_valor2
FROM saPedidoVenta p
LEFT JOIN saCliente c ON RTRIM(p.co_cli) = RTRIM(c.co_cli)
LEFT JOIN saZona z ON RTRIM(c.co_zon) = RTRIM(z.co_zon)
LEFT JOIN saVendedor v ON RTRIM(p.co_ven) = RTRIM(v.co_ven)
LEFT JOIN zt_coordenada coord ON RTRIM(p.co_cli) = RTRIM(coord.co_cli)
WHERE p.anulado = 0
  AND p.fec_emis >= '2026-03-15'
  AND p.status IN ('0', '1')  -- 0=Pendiente, 1=Parcial (excluye 2=Despachado)
ORDER BY p.fec_emis DESC
```

### Consulta de Productos del Pedido (api/pedidos.js)

```sql
SELECT
  RTRIM(r.doc_num) AS numero_pedido,
  r.reng_num,
  RTRIM(r.co_art) AS codigo_articulo,
  COALESCE(RTRIM(r.des_art), RTRIM(a.art_des), RTRIM(r.co_art)) AS descripcion_articulo,
  r.total_art AS cantidad,
  r.pendiente AS pendiente,
  r.prec_vta AS precio_unitario,
  r.reng_neto AS monto_renglon,
  RTRIM(r.co_alma) AS codigo_almacen
FROM saPedidoVentaReng r
LEFT JOIN saArticulo a ON RTRIM(r.co_art) = RTRIM(a.co_art)
WHERE RTRIM(r.doc_num) IN (... lista de pedidos ...)
ORDER BY r.doc_num, r.reng_num
```

**Nota:** El campo `pendiente` indica cuantas unidades faltan por despachar. Si `pendiente = 0`, ese renglon ya fue despachado completamente.

### Consulta de Clientes (api/clientes.js)

```sql
SELECT TOP 1000
  RTRIM(c.co_cli) AS codigo,
  RTRIM(c.cli_des) AS nombre,
  RTRIM(c.direc1) AS direccion,
  RTRIM(c.telefonos) AS telefono,
  RTRIM(c.ciudad) AS ciudad,
  RTRIM(c.co_zon) AS codigoZona,
  RTRIM(z.zon_des) AS nombreZona,
  RTRIM(c.co_ven) AS codigoVendedor,
  RTRIM(v.ven_des) AS nombreVendedor,
  RTRIM(c.rif) AS rif,
  RTRIM(c.email) AS email,
  c.inactivo,
  RTRIM(coord.longuitud) AS coord_valor1,
  RTRIM(coord.latitud) AS coord_valor2
FROM saCliente c
LEFT JOIN saZona z ON RTRIM(c.co_zon) = RTRIM(z.co_zon)
LEFT JOIN saVendedor v ON RTRIM(c.co_ven) = RTRIM(v.co_ven)
LEFT JOIN zt_coordenada coord ON RTRIM(c.co_cli) = RTRIM(coord.co_cli)
WHERE c.inactivo = 0
ORDER BY c.cli_des
```

### Importante sobre las coordenadas (zt_coordenada)

La tabla `zt_coordenada` tiene los campos `longuitud` y `latitud` **invertidos** en algunos registros. El sistema detecta automaticamente si el valor es latitud o longitud basandose en los rangos de Venezuela (lat: 1-12, lng: -73 a -60) y los corrige.

---

## 8. Estados de un Pedido

Los pedidos pasan por los siguientes estados dentro del sistema:

```
Pendiente --> En Consolidacion --> Asignado --> En Ruta --> Entregado
                                                      |
                                                      +--> Entrega Parcial
                                                      |
                                                      +--> Desistido
```

| Estado | Descripcion | Quien lo cambia |
|---|---|---|
| **Pendiente** | Pedido sincronizado desde Profit, sin asignar | Sistema (sincronizacion) |
| **En Consolidacion** | Incluido en un despacho, preparandose | Sistema (al crear despacho) |
| **Asignado** | Asignado a camion y conductor | Sistema (al crear despacho) |
| **En Ruta** | El conductor inicio la ruta | Conductor (al iniciar tracking) |
| **Entregado** | Entrega exitosa confirmada | Conductor (al registrar entrega) |
| **Entrega Parcial** | Se entrego parcialmente | Conductor (al registrar entrega) |
| **Desistido** | El cliente no recibio / no se pudo entregar | Conductor (genera no conformidad) |
| **Cancelado** | Pedido cancelado | Operador/Admin |

**Estados definidos en constantes** (`src/utils/constants.js`):
`Pendiente`, `En Consolidacion`, `Asignado`, `En Ruta`, `Entregado`, `Desistido`, `Cancelado`

---

## 9. Coordenadas - 3 Niveles de Prioridad

El sistema utiliza tres fuentes de coordenadas GPS para ubicar clientes en el mapa, en el siguiente orden de prioridad:

### Prioridad 1: `zt_coordenada` (SQL Server)
- Coordenadas almacenadas directamente en la base de datos de Profit
- Es la fuente principal y mas confiable
- El sistema corrige automaticamente coordenadas invertidas (lat/lng)

### Prioridad 2: `clientes_correcciones` (Firebase)
- Correcciones realizadas por vendedores desde la aplicacion
- Sobreescriben las coordenadas de SQL cuando existen
- Utiles cuando las coordenadas en Profit son incorrectas o no existen

### Prioridad 3: Geocodificacion por Ciudad (Mapbox)
- Cuando no hay coordenadas en ninguna de las fuentes anteriores
- El sistema usa la ciudad del cliente para obtener coordenadas aproximadas via Mapbox API
- Se marca como `geocodificada: true` para distinguirla
- Precision limitada: ubica en el centro de la ciudad, no en la direccion exacta
- Se aplica un cache en memoria para evitar llamadas repetidas a Mapbox

---

## 10. WhatsApp

### Funcionamiento
Al crear un despacho, el sistema genera automaticamente mensajes de WhatsApp para cada cliente incluido en la ruta. Utiliza links `wa.me` que abren WhatsApp Web en nuevas pestanas del navegador.

### Contenido del Mensaje
```
*Distribuidora Sarego*

Hola {nombre_cliente},

Su pedido *{numero_pedido}* esta en consolidacion.

Vehiculo: {placa}
Conductor: {nombre_conductor}

Siga su pedido en tiempo real:
{link_tracking}

Gracias por su preferencia.
```

### Modo Prueba (ACTIVO)
- **TODOS los mensajes se envian actualmente al numero:** `+57 313 496 7101`
- Esto es intencional para pruebas y evitar enviar mensajes a clientes reales
- Para activar modo produccion: cambiar `TELEFONO_PRUEBA` por `pedido.telefono` en `src/App.js` linea ~189

### Link de Tracking
- Formato: `{dominio}/tracking/{numeroPedido}`
- Permite al cliente ver el estado de su pedido y la ubicacion del vehiculo en tiempo real
- No requiere cuenta: usa autenticacion anonima de Firebase

---

## 11. Variables de Entorno Necesarias

### Variables en Vercel (Panel de Vercel > Settings > Environment Variables)

| Variable | Descripcion |
|---|---|
| `SQLSERVER_HOST` | IP o hostname del servidor SQL Server |
| `SQLSERVER_PORT` | Puerto de SQL Server (default: 1433) |
| `SQLSERVER_DATABASE` | Nombre de la base de datos de Profit Plus |
| `SQLSERVER_USER` | Usuario de SQL Server (solo lectura recomendado) |
| `SQLSERVER_PASSWORD` | Contrasena del usuario SQL Server |
| `REACT_APP_MAPBOX_TOKEN` | Token de acceso de Mapbox (usado tambien en serverless para geocodificacion) |

### Variables en `.env.local` (desarrollo local)

```env
# SQL Server
SQLSERVER_HOST=xxx.xxx.xxx.xxx
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=nombre_bd
SQLSERVER_USER=usuario
SQLSERVER_PASSWORD=contrasena

# Firebase
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=proyecto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_DATABASE_URL=https://proyecto-default-rtdb.firebaseio.com

# Mapbox
REACT_APP_MAPBOX_TOKEN=pk.eyJ1...
```

---

## 12. Roles y Permisos

El sistema tiene 6 roles con acceso diferenciado a las pestanas:

| Rol | Pestanas Permitidas |
|---|---|
| **admin** | Pedidos, Flota y Conductores, Despachos, Seguimiento, Conductor, Clientes, No Conformidad |
| **operador** | Pedidos, Flota y Conductores, Despachos, Seguimiento, Conductor, Clientes, No Conformidad |
| **despachador** | Despachos, Seguimiento, Flota y Conductores, Clientes, No Conformidad |
| **visor** | Pedidos, Seguimiento |
| **conductor** | Conductor (unicamente) |
| **vendedor** | Clientes, Pedidos |

### Descripcion de Roles

- **Admin:** Acceso total al sistema. Puede ver y gestionar todos los modulos.
- **Operador:** Mismo acceso que admin. Gestiona la operacion diaria completa.
- **Despachador:** Enfocado en la planificacion de despachos, seguimiento de entregas y gestion de no conformidades. No ve la pestana de Pedidos directamente.
- **Visor:** Solo consulta. Ve los pedidos y puede hacer seguimiento pero no puede modificar nada.
- **Conductor:** Solo ve su interfaz de tracking. Inicia ruta, registra entregas.
- **Vendedor:** Ve sus clientes y pedidos. Puede corregir ubicaciones de clientes en el mapa.

### Autenticacion
- Firebase Authentication
- Los usuarios se registran en Firestore con su rol asignado
- El primer usuario registrado obtiene rol `admin` automaticamente
- Los demas usuarios obtienen rol `visor` por defecto (el admin debe cambiarlo)
- Login con email/contrasena

---

## 13. Requisitos para que Todo Funcione

### Infraestructura

1. **SQL Server debe ser accesible desde los servidores de Vercel**
   - El servidor SQL debe tener una IP publica o estar expuesto via VPN/tunel
   - El firewall debe permitir conexiones desde las IPs de Vercel
   - Puerto configurado (default 1433) debe estar abierto

2. **Proyecto Firebase debe estar activo**
   - Firestore habilitado con reglas de seguridad apropiadas
   - Realtime Database habilitada (para GPS)
   - Authentication habilitada con proveedor email/contrasena y anonimo
   - Plan Blaze recomendado si hay alto volumen de operaciones

3. **Token de Mapbox debe ser valido**
   - Cuenta activa en Mapbox
   - Token con permisos de geocodificacion y mapas
   - Configurado tanto en Vercel como en `.env.local`

4. **Variables de entorno en Vercel deben estar configuradas**
   - Todas las variables de SQL Server
   - Token de Mapbox (para geocodificacion en serverless)

### Datos en Profit Plus

5. **Profit Plus debe tener datos actualizados**
   - Los pedidos deben crearse en Profit para que aparezcan en el sistema
   - Los clientes deben tener: nombre (`cli_des`), direccion (`direc1`), telefonos, ciudad, zona (`co_zon`) y vendedor (`co_ven`) actualizados
   - Los articulos deben tener descripcion en `saArticulo`
   - Los renglones de pedido deben tener cantidades y pendientes correctos

6. **Tabla `zt_coordenada` debe tener coordenadas GPS**
   - Sin coordenadas, los clientes no aparecen en el mapa correctamente
   - El sistema puede geocodificar por ciudad como fallback, pero con precision limitada
   - Las coordenadas deben estar en formato decimal (latitud entre 1-12, longitud entre -73 y -60 para Venezuela)

### Operativo

7. **Navegador con GPS** para los conductores (Chrome recomendado en Android)
8. **Conexion a internet estable** para tracking GPS y sincronizacion
9. **WhatsApp Web** activo en el navegador del operador que crea despachos

---

## Configuracion de Vercel (`vercel.json`)

```json
{
  "build": {
    "env": {
      "CI": "false",
      "DISABLE_ESLINT_PLUGIN": "true"
    }
  },
  "rewrites": [
    { "source": "/tracking/:path*", "destination": "/index.html" },
    { "source": "/((?!api|static|.*\\..*).*)", "destination": "/index.html" }
  ]
}
```

- `CI: false`: Evita que warnings de ESLint causen error en el build
- Rewrites: Redirige todas las rutas al SPA (excepto `/api`, `/static` y archivos con extension)
- La ruta `/tracking/:path*` se redirige especificamente para el seguimiento publico de pedidos

---

## Estructura de Archivos Principales

```
tracking-distribuidora1/
|-- api/
|   |-- lib/
|   |   +-- db.js                  # Pool de conexion SQL Server
|   |-- pedidos.js                 # API de pedidos
|   +-- clientes.js                # API de clientes
|-- src/
|   |-- components/
|   |   |-- Auth/Login.js          # Pantalla de login
|   |   |-- Pedidos/TabPedidos.js  # Modulo de pedidos
|   |   |-- Despachos/
|   |   |   |-- TabDespachoSimplificado.js  # Planificacion de despachos
|   |   |   |-- MapaPlanificacion.js        # Mapa para planificar rutas
|   |   |   +-- TabSeguimientoDespachos.js  # Seguimiento de despachos
|   |   |-- Tracking/SeguimientoPedido.js   # Seguimiento publico de pedido
|   |   |-- Conductor/Tracker.js            # Interfaz del conductor
|   |   |-- Clientes/TabGestionClientes.js  # Gestion de clientes
|   |   |-- Camiones/TabCamiones.js         # Gestion de flota
|   |   |-- NoConformidad/TabNoConformidad.js # No conformidades
|   |   |-- Mapa/TabMapa.js                 # Mapa general
|   |   +-- Layout/
|   |       |-- Header.js                   # Encabezado
|   |       +-- Navigation.js               # Navegacion con tabs
|   |-- context/AuthContext.js              # Contexto de autenticacion
|   |-- hooks/                              # Hooks personalizados
|   |-- services/
|   |   |-- firebase.js                     # Configuracion Firebase + Realtime DB
|   |   |-- firestoreService.js             # Operaciones Firestore
|   |   +-- trackingClient.js               # Cliente de tracking GPS
|   |-- utils/constants.js                  # Constantes del sistema
|   +-- App.js                              # Componente principal + permisos
|-- vercel.json                             # Configuracion de Vercel
+-- package.json
```
