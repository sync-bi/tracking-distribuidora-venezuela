import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

// Detectar si es ruta pública de tracking
const isTrackingPage = window.location.pathname.startsWith('/tracking');

const root = ReactDOM.createRoot(document.getElementById('root'));

if (isTrackingPage) {
  // Página pública de seguimiento — carga mínima, sin auth ni utils
  import('./components/Tracking/SeguimientoPedido').then(({ default: SeguimientoPedido }) => {
    root.render(
      <React.StrictMode>
        <SeguimientoPedido />
      </React.StrictMode>
    );
  });
} else {
  // App principal con autenticación y todos los módulos
  Promise.all([
    import('./App'),
    import('./context/AuthContext'),
    import('./utils/inicializarFirebase'),
    import('./utils/testFirestorePermisos'),
    import('./utils/verificarAuth')
  ]).then(([{ default: App }, { AuthProvider }]) => {
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>
    );
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
