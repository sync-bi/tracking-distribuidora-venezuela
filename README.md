# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

## Tracking del Conductor (Fase 1)

Se añadió una pestaña "Conductor" para iniciar/detener el seguimiento desde el móvil/tablet. El mapa refleja el movimiento del camión en tiempo real.

Variables de entorno (archivo `.env.local`):

```
# REST (recomendado en Fase 1)
REACT_APP_TRACKING_MODE=rest
REACT_APP_TRACKING_BASE_URL=https://tu-backend.example.com/api

# Si tu backend requiere encabezado de autorización personalizado
# REACT_APP_TRACKING_AUTH_HEADER=Authorization
# REACT_APP_TRACKING_AUTH_VALUE=Bearer <tu_token>
```

Formato del endpoint esperado (REST):
- POST {REACT_APP_TRACKING_BASE_URL}/tracking/{vehiculoId}
- Body JSON: `{ driverId, vehiculoId, lat, lng, speedKmh?, heading?, accuracy?, ts, source }`
- Respuesta: 200/201 (JSON opcional)

Si `REACT_APP_TRACKING_BASE_URL` no está configurado, los eventos se encolan localmente y se reintentan cuando el backend esté disponible.

### Backend en Vercel (sin servidor propio)

Este repo incluye una Function de Vercel para recibir posiciones:

- Ruta: `api/tracking/[vehiculoId].js`
- Endpoint: `POST https://<tu-proyecto>.vercel.app/api/tracking/<vehiculoId>`
- CORS abierto por defecto (ajústalo si lo necesitas)
- Auth opcional con token: configura `TRACKING_API_TOKEN` en Vercel y envía `Authorization: Bearer <TOKEN>` desde el cliente.

Pasos:
- Conecta este repo a Vercel y despliega.
- En Vercel → Project → Settings → Environment Variables, agrega (opcional) `TRACKING_API_TOKEN`.
- En `.env.local` del frontend añade:
  - `REACT_APP_TRACKING_MODE=rest`
  - `REACT_APP_TRACKING_BASE_URL=https://<tu-proyecto>.vercel.app/api`
  - Si usas token: `REACT_APP_TRACKING_AUTH_HEADER=Authorization` y `REACT_APP_TRACKING_AUTH_VALUE=Bearer <TOKEN>`

Con esto, el móvil del conductor enviará los puntos a tu endpoint en Vercel sin necesidad de un servidor aparte.

## Carga Automática de Pedidos (Producción)

- La app carga automáticamente pedidos desde un archivo público si existe:
  - Busca en este orden: `/pedidos.xlsx`, `/Pedidos.xlsx`, `/pedidos.csv`, `/Pedidos.csv` (carpeta `public/`).
  - No requiere interacción del usuario.
- Coloca tu Excel en `public/Pedidos.xlsx` (o `public/pedidos.xlsx`) antes de desplegar.
- Variables opcionales:
  - `REACT_APP_AUTOLOAD_PEDIDOS=true` (default) para activar la autocarga.
  - `REACT_APP_ALLOW_MANUAL_IMPORT=false` (default) para ocultar el botón de importación manual.

## Gestión de Clientes (Independiente)

La pestaña **Clientes** carga datos desde `public/clientes.csv` de forma independiente de pedidos:
- Permite corregir ubicaciones de clientes antes de tener pedidos
- Detección inteligente de coordenadas lat/lng invertidas
- Filtro por ciudad y búsqueda
- Exportación de clientes corregidos

Formato del CSV:
```csv
co_cli;cliente;ciudad;direccion_principal;direccion_temporal;latitud;longuitud
```

## Formulario Recibido Conforme (Conductor)

En la pestaña **Conductor**, al entregar un pedido:
- Formulario de confirmación con firma digital del cliente
- Opción **Conforme** o **No Conforme**
- Si no conforme: selección de items con problemas y causas
- Causas disponibles: Mal estado, Faltante, Dañado, Producto incorrecto, Vencido, Cantidad incorrecta, Otro


### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
