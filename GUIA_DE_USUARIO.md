# 📚 Guía Completa de Usuario - SAREGO Tracking System

## 🎯 Índice
1. [Crear un Despacho](#1-crear-un-despacho)
2. [Hacer Seguimiento del Despacho](#2-hacer-seguimiento-del-despacho)
3. [Optimizar Rutas](#3-optimizar-rutas)
4. [Ver Despachos en el Mapa](#4-ver-despachos-en-el-mapa)
5. [Modo Conductor (GPS)](#5-modo-conductor-gps)
6. [Importar Pedidos desde Excel](#6-importar-pedidos-desde-excel)

---

## 1. 📦 Crear un Despacho

### Paso a Paso:

#### **Paso 1: Ir a la Pestaña "Despachos"**
- Haz clic en la pestaña **"Despachos"** en la barra de navegación superior
- Verás dos paneles: Lista de pedidos (izquierda) y Resumen (derecha)

#### **Paso 2: Seleccionar Pedidos**
Tienes dos opciones:

**Opción A - Seleccionar por Zona:**
1. Los pedidos están agrupados por zona/ciudad
2. Haz clic en el nombre de la zona para expandirla
3. Haz clic en el **checkbox de la zona** para seleccionar TODOS los pedidos de esa área
4. Puedes combinar pedidos de múltiples zonas

**Opción B - Selección Manual:**
1. Expande cada zona haciendo clic en ella
2. Marca individualmente los pedidos que necesites
3. Usa el buscador si hay muchos pedidos

#### **Paso 3: Verificar Totales en el Panel de Resumen**
El panel derecho (SIEMPRE visible) muestra en tiempo real:
- ✅ Cantidad de pedidos seleccionados
- ⚖️ Peso total estimado (kg)
- 📦 Volumen total estimado (m³)
- 🎁 Total de productos

**⚠️ IMPORTANTE:** Verifica que el peso no exceda la capacidad del camión (típicamente 3000kg)

#### **Paso 4: Seleccionar Camión**
1. En el panel de resumen, despliega el selector "Seleccionar Camión"
2. Verás: ID del camión, placa y capacidad
3. Selecciona el camión apropiado para la carga

#### **Paso 5: Seleccionar Conductor**
1. Despliega el selector "Seleccionar Conductor"
2. Solo verás conductores **disponibles** en ese momento
3. Selecciona el conductor que manejará el camión

#### **Paso 6: Crear Despacho**
1. El botón "Crear Despacho" se habilitará cuando:
   - Tengas al menos 1 pedido seleccionado
   - Hayas seleccionado un camión
   - Hayas seleccionado un conductor
2. Haz clic en **"Crear Despacho"**
3. Los pedidos cambiarán automáticamente a estado "Asignado"
4. El camión cambiará a estado "Asignado"

✅ **Despacho creado exitosamente!**

---

## 2. 🗺️ Hacer Seguimiento del Despacho

### Paso a Paso:

#### **Paso 1: Ir a la Pestaña "Seguimiento"**
- Haz clic en **"Seguimiento"** en la barra de navegación
- Verás todos tus despachos activos

#### **Paso 2: Seleccionar el Despacho**
Cada tarjeta de despacho muestra:
- 🚚 Camión asignado (ID y placa)
- 👤 Conductor asignado
- 📦 Cantidad de pedidos
- 📊 Progreso (% completado)
- 📅 Fecha de creación

Haz clic en el despacho que quieres seguir

#### **Paso 3: Visualizar en el Mapa**
El mapa mostrará:
- 🚚 **Icono de camión** = Ubicación actual del vehículo
- 📦 **Iconos de paquete** = Puntos de entrega
- 📍 **Líneas conectoras** = Ruta planificada

**Acciones en el mapa:**
- Haz clic en cualquier marcador para ver detalles
- Usa los controles para hacer zoom in/out
- Arrastra para mover el mapa

#### **Paso 4: Ver Lista de Paradas**
A la derecha del mapa verás la lista ordenada de entregas:
- 🟢 Verde = Entrega completada
- 🔵 Azul = Próxima parada
- ⚪ Gris = Pendiente

Para cada parada verás:
- Cliente
- Dirección
- Productos
- Distancia estimada

---

## 3. 🎯 Optimizar Rutas

### Optimización Automática:

#### **Paso 1: Abrir el Despacho en Seguimiento**
- Ve a la pestaña "Seguimiento"
- Selecciona el despacho

#### **Paso 2: Optimizar Ruta**
1. Haz clic en el botón **"Optimizar Ruta"** 🎯
2. El sistema calculará automáticamente:
   - Distancia total mínima
   - Orden óptimo de entregas
   - Tiempo estimado
3. La ruta se reorganiza automáticamente
4. El mapa se actualiza con el nuevo orden

**Algoritmo:**
- Toma la ubicación actual del camión como punto de inicio
- Calcula la distancia entre todos los puntos
- Usa el algoritmo del "vecino más cercano"
- Minimiza distancia total recorrida

#### **Paso 3: Reorganizar Manualmente (Opcional)**
Si necesitas cambiar el orden por razones específicas:

1. Ve a la lista de paradas
2. **Arrastra** cada parada hacia arriba o abajo
3. Suéltala en la posición deseada
4. El mapa se actualiza automáticamente

**Casos de uso:**
- Cliente con horario específico de recepción
- Entregas urgentes que deben ir primero
- Restricciones de tráfico o zonas

---

## 4. 🗺️ Ver Despachos en el Mapa

### Vista General del Sistema:

#### **Paso 1: Ir a la Pestaña "Mapa"**
- Haz clic en **"Mapa"** en la navegación superior
- Verás TODOS los elementos del sistema simultáneamente

#### **Estadísticas en Tiempo Real:**
En la parte superior verás:
- 🚚 **Camiones Activos** (asignados + en ruta)
- 📦 **Pedidos Activos** (pendientes + asignados + en ruta)
- 🛣️ **Rutas Activas**
- 📏 **Distancia Promedio** por parada

#### **Paso 2: Usar Filtros**
Selector de filtros disponibles:

1. **"Todos en Seguimiento"** (predeterminado)
   - Muestra: Todos los pedidos NO entregados
   - Ideal para: Vista general del día

2. **"Solo Camiones"**
   - Muestra: Solo vehículos
   - Ideal para: Ver distribución de la flota

3. **"Solo Pedidos"**
   - Muestra: Solo puntos de entrega
   - Ideal para: Planificación de zonas

4. **"Solo En Ruta"**
   - Muestra: Solo elementos activos ahora mismo
   - Ideal para: Monitoreo en tiempo real

5. **"Solo Pendientes"**
   - Muestra: Pedidos sin asignar y camiones disponibles
   - Ideal para: Planificación de nuevos despachos

6. **"Solo Asignados"**
   - Muestra: Despachos listos para salir
   - Ideal para: Coordinación de salidas

#### **Paso 3: Interactuar con el Mapa**

**Marcadores:**
- 🚚 **Camiones:**
  - 🟢 Verde = Disponible
  - 🟠 Naranja = Asignado
  - 🔵 Azul = En ruta
  - 🔴 Rojo = Mantenimiento

- 📦 **Pedidos:**
  - 🟠 Naranja = Pendiente
  - 🔵 Azul = Asignado
  - 🟢 Verde = En ruta
  - ⚪ Gris = Entregado

- ⚠️ **Triángulo Amarillo:**
  - Indica coordenadas corregidas automáticamente
  - Aparece cuando las coordenadas originales estaban muy lejas de la ciudad

**Al hacer clic en un marcador:**

Para **Camiones**:
- ID y placa
- Conductor asignado
- Estado actual
- Velocidad
- Combustible
- Pedidos asignados

Para **Pedidos**:
- ID del pedido
- Cliente
- Estado y prioridad
- Productos (cantidad)
- Camión asignado (si aplica)
- Ciudad
- ⚠️ Advertencia si coordenadas fueron corregidas

#### **Paso 4: Controles del Mapa**

Botones disponibles:

1. **"Centrar Vista"** 🎯
   - Vuelve a la vista general de Venezuela
   - Zoom: 6 (vista de país)

2. **"Actualizar"** 🔄
   - Refresca los datos del mapa
   - Actualiza posiciones de camiones

3. **"Limpiar Filtros"** 🧹
   - Vuelve al filtro predeterminado
   - Muestra todos en seguimiento

4. **"Seguir Camión"** 🚚 (si hay camiones en ruta)
   - Centra el mapa en el primer camión activo
   - Hace zoom automático
   - Útil para seguimiento detallado

---

## 5. 📍 Modo Conductor (GPS)

### Para Conductores con Dispositivo Móvil:

#### **Paso 1: Iniciar Sesión como Conductor**
- Usuario: `driver@example.com`
- Contraseña: `driver123`
- Rol: Conductor

#### **Paso 2: Ir a la Pestaña "Conductor"**
- Verás el panel de tracking GPS

#### **Paso 3: Seleccionar tu Camión**
- Despliega el selector
- Elige tu camión asignado

#### **Paso 4: Iniciar Seguimiento**
1. Haz clic en **"Iniciar"** ▶️
2. Tu navegador pedirá permisos de ubicación
3. Haz clic en **"Permitir"** / **"Allow"**

**⚠️ IMPORTANTE:**
- Debe estar en un dispositivo con GPS (móvil/tablet)
- Requiere conexión a internet
- Consume batería (recomendado tener cargador)

#### **Paso 5: Monitoreo Automático**
Una vez iniciado, el sistema:
- ✅ Obtiene tu ubicación cada **15 segundos** o **50 metros**
- ✅ Envía posición a Firebase (tiempo real)
- ✅ Envía posición al backend REST (histórico)
- ✅ Actualiza velocidad y heading
- ✅ Muestra última posición en pantalla

**Panel de información:**
- 📍 Latitud y Longitud
- ⏱️ Hora de última actualización
- 🚗 Velocidad actual (km/h)
- 🧭 Dirección (heading)

#### **Paso 6: Detener Seguimiento**
- Cuando termines la ruta, haz clic en **"Detener"** ⏹️
- El GPS se desactiva
- El estado del camión vuelve a "Disponible"

---

## 6. 📥 Importar Pedidos desde Excel

### Carga Masiva de Pedidos:

#### **Método 1: Importación Automática (Recomendado)**

1. Coloca tu archivo en: `public/Pedidos.xlsx` o `public/pedidos.xlsx`
2. Reinicia la aplicación
3. Los pedidos se cargan automáticamente

#### **Método 2: Importación Manual**

1. Ve a la pestaña **"Pedidos"**
2. Haz clic en **"Importar Pedidos"** 📥
3. Selecciona tu archivo Excel (.xlsx) o CSV (.csv)
4. El sistema procesará automáticamente

#### **Formato del Excel:**

**Columnas Requeridas:**
- `numero_pedido` - ID único del pedido
- `cliente` o `nombre_cliente` - Nombre del cliente
- `direccion_cliente` o `direccion` - Dirección de entrega
- `ciudad_cliente` o `ciudad` - Ciudad (para geocodificar)

**Columnas Opcionales:**
- `lat`, `lng` - Coordenadas exactas (si las tienes)
- `codigo_articulo` - SKU del producto
- `descripcion_articulo` - Descripción
- `cantidad_pedida` - Cantidad
- `prioridad` - Alta, Media, Baja
- `estado` - Pendiente, Asignado, etc.
- `fecha_pedido` - Fecha de creación
- `almacen` - Almacén de origen
- `zona` o `ruta` - Zona/ruta asignada

**Procesamiento Inteligente:**
- ✅ Detecta automáticamente las columnas
- ✅ Agrupa renglones por `numero_pedido`
- ✅ Geocodifica ciudades automáticamente (45 ciudades de Venezuela)
- ✅ Valida coordenadas vs ciudad (detecta errores)
- ✅ Corrige coordenadas incorrectas
- ✅ Convierte fechas de Excel a formato ISO
- ✅ Normaliza nombres de columnas (quita tildes, mayúsculas, etc.)

**Ejemplo de fila:**

| numero_pedido | nombre_cliente | direccion_cliente | ciudad_cliente | codigo_articulo | cantidad_pedida | prioridad |
|--------------|----------------|-------------------|----------------|-----------------|-----------------|-----------|
| PED001 | Comercial XYZ | Av. Principal #123 | Caracas | LLANTA-185-65-R15 | 4 | Alta |
| PED001 | Comercial XYZ | Av. Principal #123 | Caracas | BATERIA-55AH | 1 | Alta |

**Resultado:**
- Se crea UN pedido (PED001)
- Con DOS productos (4 llantas + 1 batería)
- Coordenadas de Caracas: 10.4806, -66.9036

---

## 🆘 Preguntas Frecuentes

### ¿Cómo sé si las coordenadas son correctas?
- En el mapa, si el marcador tiene un **triángulo amarillo ⚠️**, las coordenadas fueron corregidas
- Haz clic en el marcador para ver la advertencia con detalles

### ¿Puedo cambiar un despacho después de crearlo?
- Sí, ve a "Seguimiento" y selecciona el despacho
- Puedes reorganizar la ruta manualmente
- Puedes marcar entregas como completadas

### ¿Qué pasa si el conductor no tiene GPS?
- Puedes actualizar la posición manualmente desde "Camiones"
- O usar simulación (el sistema mueve el camión automáticamente)

### ¿Cuántos pedidos puede tener un despacho?
- No hay límite técnico
- Recomendado: Verificar capacidad del camión (peso/volumen)

### ¿Cómo elimino un pedido?
- Ve a "Pedidos"
- Busca el pedido
- Haz clic en el botón de eliminar 🗑️

---

## 📞 Soporte

Para ayuda adicional:
- Haz clic en el botón **?** (esquina inferior derecha) para ver el tour guiado
- Consulta esta guía en: `GUIA_DE_USUARIO.md`
- Revisa el README.md para configuración técnica

---

**Versión:** 1.0
**Última actualización:** 2025-10-10
