import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Prueba de humo: sin sesión iniciada la app debe montar y mostrar el acceso.
// Verifica que todo el árbol de componentes compone, que es justo lo que
// rompería un import mal puesto o un hook fuera de lugar.
test('sin usuario autenticado muestra la pantalla de acceso', async () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );

  const acceso = await screen.findByRole(
    'heading',
    { name: /iniciar sesión/i },
    { timeout: 10000 }
  );

  expect(acceso).toBeInTheDocument();
}, 20000); // El montaje completo de la app supera el límite por defecto de 5 s
