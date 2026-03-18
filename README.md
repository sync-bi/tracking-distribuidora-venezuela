# Tracking Distribuidora Sarego

Sistema de gestión y seguimiento de entregas para distribuidoras en Venezuela.

![React](https://img.shields.io/badge/React-19.1.1-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.3.0-orange)
![Mapbox](https://img.shields.io/badge/Mapbox_GL-3.14.0-green)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.3.0-cyan)

## Descripcion

Sistema completo para la gestion de entregas que incluye:
- Gestion de pedidos con importacion desde Excel/CSV
- Seguimiento de camiones en tiempo real
- Gestion de clientes con correccion de ubicaciones GPS
- Despachos y asignacion de rutas
- Panel para conductores con firma digital
- Mapas interactivos con Mapbox

## Inicio Rapido

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Firebase (Firestore + Auth)
- Token de Mapbox

### Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/sync-bi/tracking-distribuidora-venezuela.git
cd tracking-distribuidora-venezuela

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar en desarrollo
npm start
```

### Variables de Entorno

Crear archivo `.env.local`:

```env
# Firebase
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123

# Mapbox
REACT_APP_MAPBOX_TOKEN=pk.tu_token_mapbox

# Opcionales
REACT_APP_AUTOLOAD_PEDIDOS=true
REACT_APP_ALLOW_MANUAL_IMPORT=false
```

## Modulos del Sistema

### 1. Pedidos
- Importacion automatica desde `public/pedidos.xlsx` o `public/pedidos.csv`
- Creacion manual de pedidos
- Estados: Pendiente, Asignado, En Ruta, Entregado, Cancelado
- Prioridades: Baja, Media, Alta, Urgente
- Asignacion a camiones

### 2. Camiones
- Registro de vehiculos y conductores
- Estados: Disponible, Asignado, En Ruta, Mantenimiento
- Seguimiento de ubicacion en tiempo real
- Historial de entregas

### 3. Clientes
- Carga desde `public/clientes.csv`
- Correccion de ubicaciones GPS en mapa
- Filtro por ciudad y vendedor
- Exportacion de datos corregidos
- Soporte para multiples sedes

### 4. Despachos
- Creacion de hojas de despacho
- Asignacion de pedidos a camiones
- Seguimiento de entregas
- Vista simplificada para operadores

### 5. Conductor (Movil)
- Tracking GPS en tiempo real
- Lista de entregas asignadas
- Formulario de entrega con firma digital
- Registro de conformidad/no conformidad

### 6. Mapa
- Visualizacion de camiones y pedidos
- Marcadores con colores por estado
- Zoom y navegacion
- Multiples estilos de mapa

## Roles de Usuario

| Rol | Acceso |
|-----|--------|
| `admin` | Acceso completo a todos los modulos |
| `operador` | Pedidos, Despachos, Camiones |
| `despachador` | Despachos y seguimiento |
| `visor` | Solo lectura |
| `conductor` | App de conductor |
| `vendedor` | Pedidos de sus clientes |

## Estructura del Proyecto

```
src/
├── components/
│   ├── Auth/           # Login y autenticacion
│   ├── Camiones/       # Gestion de vehiculos
│   ├── Clientes/       # Gestion de clientes
│   ├── Conductor/      # App del conductor
│   ├── Despachos/      # Hojas de despacho
│   ├── Layout/         # Header, Navigation
│   ├── Mapa/           # Mapas interactivos
│   ├── Pedidos/        # Gestion de pedidos
│   ├── Ubicaciones/    # Puntos de entrega
│   └── UI/             # Componentes reutilizables
├── hooks/              # Custom hooks
├── context/            # React Context (Auth)
├── services/           # Firebase, APIs
├── utils/              # Funciones utilitarias
└── data/               # Datos mock
```

## Formatos de Archivos

### Pedidos (Excel/CSV)

```
N_Pedido | Cliente | Direccion | Ciudad | Fecha_Vencimiento | ...
```

### Clientes (CSV)

```csv
co_cli;cliente;ciudad;direccion_principal;direccion_temporal;latitud;longuitud
```

### Clientes con Vendedor (CSV)

```csv
co_cli;tip_cli;cli_des;ven_des
```

## Despliegue

### Vercel (Recomendado)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno en Settings
3. Deploy automatico en cada push

### Build Manual

```bash
npm run build
# La carpeta build/ contiene los archivos estaticos
```

## API de Tracking (Opcional)

El proyecto incluye una Function de Vercel para recibir posiciones:

- Endpoint: `POST /api/tracking/{vehiculoId}`
- Body: `{ driverId, lat, lng, speedKmh, ts }`
- Auth: Bearer token (opcional)

## Documentacion Adicional

| Documento | Descripcion |
|-----------|-------------|
| [Guia de Usuario](./docs/GUIA_USUARIO.md) | Manual completo para usuarios |
| [Arquitectura Firebase](./docs/ARQUITECTURA_FIREBASE.md) | Estructura de Firestore |
| [Configuracion Firebase](./docs/FIREBASE_SETUP.md) | Setup inicial de Firebase |
| [Modulo Clientes](./docs/MODULO_CLIENTES.md) | Detalle del modulo de clientes |

## Scripts Disponibles

```bash
npm start       # Desarrollo en localhost:3000
npm run build   # Build de produccion
npm test        # Ejecutar tests
```

## Tecnologias

- **Frontend**: React 19.1.1, Tailwind CSS 3.3.0
- **Backend**: Firebase (Firestore, Auth, Realtime DB)
- **Mapas**: Mapbox GL 3.14.0, React Map GL 7.1.9
- **Iconos**: Lucide React
- **Datos**: XLSX (Excel), PapaParse (CSV)

## Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcion`)
3. Commit cambios (`git commit -m 'Agregar nueva funcion'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Crear Pull Request

## Soporte

Para reportar problemas o solicitar funciones:
- GitHub Issues: [tracking-distribuidora-venezuela/issues](https://github.com/sync-bi/tracking-distribuidora-venezuela/issues)

## Licencia

Proyecto privado - SYNC BI / Sarego

---

Desarrollado por SYNC BI para Distribuidora Sarego, Venezuela.
