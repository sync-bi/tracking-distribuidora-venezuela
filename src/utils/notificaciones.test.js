import {
  normalizarTelefono,
  construirUrlTracking,
  construirMensajeSalida,
  construirUrlWhatsApp,
  esModoPrueba,
  TELEFONO_PRUEBA
} from './notificaciones';

const ORIGIN = 'https://tracking-distribuidora-venezuela.vercel.app';

describe('normalizarTelefono', () => {
  it('deja pasar un numero que ya trae codigo de pais', () => {
    expect(normalizarTelefono('584123456789')).toBe('584123456789');
  });

  it('convierte el formato local 0412... a 58412...', () => {
    expect(normalizarTelefono('04123456789')).toBe('584123456789');
  });

  it('agrega el codigo de pais a un numero de 10 digitos sin cero inicial', () => {
    expect(normalizarTelefono('4123456789')).toBe('584123456789');
  });

  it('ignora espacios, guiones y parentesis', () => {
    expect(normalizarTelefono('(0412) 345-67.89')).toBe('584123456789');
  });

  it('devuelve null cuando no hay telefono utilizable', () => {
    expect(normalizarTelefono(null)).toBeNull();
    expect(normalizarTelefono('')).toBeNull();
    expect(normalizarTelefono('sin numero')).toBeNull();
  });
});

describe('construirUrlTracking', () => {
  it('usa numeroPedido cuando existe', () => {
    const pedido = { id: '1egGUJKnwRZCCmcw9Jb7', numeroPedido: '0000006978' };
    expect(construirUrlTracking(pedido, ORIGIN)).toBe(`${ORIGIN}/tracking/0000006978`);
  });

  it('cae al document id cuando el pedido no tiene numero del ERP', () => {
    const pedido = { id: '1egGUJKnwRZCCmcw9Jb7' };
    expect(construirUrlTracking(pedido, ORIGIN)).toBe(`${ORIGIN}/tracking/1egGUJKnwRZCCmcw9Jb7`);
  });
});

describe('construirMensajeSalida', () => {
  const pedido = {
    id: 'abc123',
    numeroPedido: '0000006978',
    cliente: 'DISTRIBUIDORA HERNAN 2050 C.A.'
  };

  it('dice que el pedido salio del almacen, no que esta en consolidacion', () => {
    const mensaje = construirMensajeSalida({ pedido, placa: 'ABC123', conductor: 'Juan', origin: ORIGIN });
    expect(mensaje).toContain('salió de nuestro almacén');
    expect(mensaje).not.toContain('en consolidación');
  });

  it('incluye cliente, numero de pedido, placa, conductor y enlace', () => {
    const mensaje = construirMensajeSalida({ pedido, placa: 'ABC123', conductor: 'Juan', origin: ORIGIN });
    expect(mensaje).toContain('DISTRIBUIDORA HERNAN 2050 C.A.');
    expect(mensaje).toContain('0000006978');
    expect(mensaje).toContain('ABC123');
    expect(mensaje).toContain('Juan');
    expect(mensaje).toContain(`${ORIGIN}/tracking/0000006978`);
  });

  it('no rompe cuando falta placa o conductor', () => {
    const mensaje = construirMensajeSalida({ pedido, origin: ORIGIN });
    expect(mensaje).toContain('Vehículo: N/A');
    expect(mensaje).toContain('Conductor: N/A');
  });
});

describe('construirUrlWhatsApp', () => {
  const pedido = { id: 'abc', numeroPedido: '0000006978', cliente: 'Cliente', telefono: '04123456789' };

  it('apunta al numero de prueba mientras el modo prueba este activo', () => {
    const url = construirUrlWhatsApp({ pedido, placa: 'ABC123', conductor: 'Juan', origin: ORIGIN });
    expect(esModoPrueba()).toBe(true);
    expect(url.startsWith(`https://wa.me/${TELEFONO_PRUEBA}?text=`)).toBe(true);
  });

  it('codifica el mensaje de forma reversible', () => {
    const url = construirUrlWhatsApp({ pedido, placa: 'ABC123', conductor: 'Juan', origin: ORIGIN });
    const texto = decodeURIComponent(url.split('?text=')[1]);
    expect(texto).toContain('salió de nuestro almacén');
    expect(texto).toContain(`${ORIGIN}/tracking/0000006978`);
    // Los saltos de linea deben sobrevivir al encoding
    expect(texto.split('\n').length).toBeGreaterThan(5);
  });

  it('no deja caracteres crudos que rompan la URL', () => {
    const url = construirUrlWhatsApp({ pedido, placa: 'ABC123', conductor: 'Juan', origin: ORIGIN });
    const texto = url.split('?text=')[1];
    expect(texto).not.toMatch(/[ \n"<>#]/);
  });
});
