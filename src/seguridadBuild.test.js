/**
 * El paquete que se publica no debe contener credenciales ni código fuente.
 *
 * Esto existe porque llegó a producción una aplicación donde:
 *   - las cuentas de prueba viajaban dentro del paquete,
 *   - la pantalla de acceso las imprimía en la parte de abajo,
 *   - y el login caía en ellas cuando Firebase rechazaba unas credenciales,
 * de modo que cualquiera entraba como administrador escribiendo admin123.
 *
 * Revisar el paquete construido, y no el código fuente, es lo único que
 * comprueba de verdad qué se está publicando: las guardas dependen de que el
 * compilador elimine el código, no de cómo esté escrito.
 *
 * Se ejecuta solo si existe la carpeta build/. Sin ella no hay nada que
 * revisar y las pruebas no deben fallar por eso; en cambio, después de
 * construir para desplegar, esta prueba sí protege.
 */
const fs = require('fs');
const path = require('path');

const DIR_JS = path.join(__dirname, '..', 'build', 'static', 'js');
const hayBuild = fs.existsSync(DIR_JS);

// Contraseñas y correos de las cuentas de prueba de src/context/AuthContext.js
const CREDENCIALES = [
  'admin123', 'op123', 'disp123', 'visor123', 'driver123', 'vendedor123',
  'admin@example.com', 'driver@example.com'
];

const leerPaquete = () => {
  const archivos = fs.readdirSync(DIR_JS).filter(f => f.endsWith('.js'));
  return archivos.map(f => ({
    nombre: f,
    contenido: fs.readFileSync(path.join(DIR_JS, f), 'utf8')
  }));
};

const describeSiHayBuild = hayBuild ? describe : describe.skip;

describeSiHayBuild('el paquete publicado', () => {
  let paquete;
  beforeAll(() => { paquete = leerPaquete(); });

  it.each(CREDENCIALES)('no contiene la credencial de prueba %s', (credencial) => {
    const culpables = paquete
      .filter(a => a.contenido.includes(credencial))
      .map(a => a.nombre);

    expect(culpables).toEqual([]);
  });

  it('no publica el código fuente en mapas .map', () => {
    const mapas = fs.readdirSync(DIR_JS).filter(f => f.endsWith('.map'));
    expect(mapas).toEqual([]);
  });

  it('no deja rastro de la lista de cuentas de prueba', () => {
    const culpables = paquete
      .filter(a => a.contenido.includes('MOCK_USERS'))
      .map(a => a.nombre);

    expect(culpables).toEqual([]);
  });
});

// Deja constancia en la corrida cuando no hubo nada que revisar, para que un
// "todo verde" sin build no se confunda con un paquete comprobado.
if (!hayBuild) {
  describe('el paquete publicado', () => {
    it('no se revisó: no existe build/ (correr npm run build antes de desplegar)', () => {
      expect(hayBuild).toBe(false);
    });
  });
}
