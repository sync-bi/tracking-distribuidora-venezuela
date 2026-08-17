import {
  obtenerUbicacionActual,
  resolverUbicacionEntrega,
  ANTIGUEDAD_MAXIMA_FIX_MS
} from './geo';

const definirGeolocation = (impl) => {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: impl,
    configurable: true,
    writable: true
  });
};

const fixExitoso = (pos) => ({
  getCurrentPosition: (ok) => ok(pos)
});

const fixFallido = () => ({
  getCurrentPosition: (_ok, err) => err(new Error('permiso denegado'))
});

const POSICION = {
  coords: { latitude: 10.4918, longitude: -66.8289, accuracy: 12.7 },
  timestamp: 1700000000000
};

describe('obtenerUbicacionActual', () => {
  afterEach(() => definirGeolocation(undefined));

  it('devuelve la lectura del GPS con la precision redondeada', async () => {
    definirGeolocation(fixExitoso(POSICION));
    const ubicacion = await obtenerUbicacionActual();
    expect(ubicacion).toEqual({
      lat: 10.4918,
      lng: -66.8289,
      precision: 13,
      timestamp: 1700000000000,
      fuente: 'puntual'
    });
  });

  it('devuelve null si el usuario niega el permiso, sin lanzar', async () => {
    definirGeolocation(fixFallido());
    await expect(obtenerUbicacionActual()).resolves.toBeNull();
  });

  it('devuelve null si el navegador no soporta geolocalizacion', async () => {
    definirGeolocation(undefined);
    await expect(obtenerUbicacionActual()).resolves.toBeNull();
  });
});

describe('resolverUbicacionEntrega', () => {
  afterEach(() => definirGeolocation(undefined));

  it('usa el fix del tracking cuando es reciente, sin pedir GPS', async () => {
    const pedirGps = jest.fn();
    definirGeolocation({ getCurrentPosition: pedirGps });

    const lastFix = {
      coord: { lat: 10.5, lng: -66.9 },
      accuracy: 8.2,
      ts: Date.now()
    };

    const ubicacion = await resolverUbicacionEntrega(lastFix);

    expect(ubicacion.fuente).toBe('tracking');
    expect(ubicacion.lat).toBe(10.5);
    expect(ubicacion.precision).toBe(8);
    expect(pedirGps).not.toHaveBeenCalled();
  });

  it('pide una lectura puntual cuando el fix del tracking esta viejo', async () => {
    definirGeolocation(fixExitoso(POSICION));

    const lastFix = {
      coord: { lat: 10.5, lng: -66.9 },
      accuracy: 8.2,
      ts: Date.now() - ANTIGUEDAD_MAXIMA_FIX_MS - 1000
    };

    const ubicacion = await resolverUbicacionEntrega(lastFix);

    expect(ubicacion.fuente).toBe('puntual');
    expect(ubicacion.lat).toBe(10.4918);
  });

  it('cae al fix viejo marcandolo como desactualizado si el GPS falla', async () => {
    definirGeolocation(fixFallido());

    const lastFix = {
      coord: { lat: 10.5, lng: -66.9 },
      accuracy: 8.2,
      ts: Date.now() - ANTIGUEDAD_MAXIMA_FIX_MS - 1000
    };

    const ubicacion = await resolverUbicacionEntrega(lastFix);

    expect(ubicacion.fuente).toBe('tracking_desactualizado');
    expect(ubicacion.lat).toBe(10.5);
  });

  it('devuelve null cuando el conductor nunca inicio tracking y el GPS falla', async () => {
    definirGeolocation(fixFallido());
    await expect(resolverUbicacionEntrega(null)).resolves.toBeNull();
  });

  it('georreferencia la entrega aunque el conductor nunca haya iniciado el tracking', async () => {
    definirGeolocation(fixExitoso(POSICION));
    const ubicacion = await resolverUbicacionEntrega(null);
    expect(ubicacion.fuente).toBe('puntual');
    expect(ubicacion.lat).toBe(10.4918);
  });
});
