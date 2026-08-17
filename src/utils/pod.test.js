import { construirHtmlPOD } from './pod';

const RECIBO_BASE = {
  id: 'rec_abc123',
  pedidoId: '1egGUJKnwRZCCmcw9Jb7',
  fechaEntrega: '2026-08-17T14:30:00.000Z',
  conforme: true,
  itemsProblemas: [],
  observaciones: '',
  receptor: { nombre: 'Maria Perez', cedula: 'V-12345678' },
  firma: 'data:image/png;base64,iVBORw0KGgo=',
  fotos: [],
  ubicacionEntrega: null
};

const PEDIDO = {
  numeroPedido: '0000006978',
  cliente: 'DISTRIBUIDORA HERNAN 2050 C.A.',
  direccion: 'Av. Principal, Caracas'
};

describe('construirHtmlPOD', () => {
  it('genera un documento HTML completo', () => {
    const html = construirHtmlPOD(RECIBO_BASE, PEDIDO);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('</html>');
  });

  it('incluye los datos del pedido y del receptor', () => {
    const html = construirHtmlPOD(RECIBO_BASE, PEDIDO);
    expect(html).toContain('0000006978');
    expect(html).toContain('DISTRIBUIDORA HERNAN 2050 C.A.');
    expect(html).toContain('Av. Principal, Caracas');
    expect(html).toContain('Maria Perez');
    expect(html).toContain('V-12345678');
  });

  it('marca la entrega como conforme cuando no hay problemas', () => {
    const html = construirHtmlPOD(RECIBO_BASE, PEDIDO);
    expect(html).toContain('ENTREGA CONFORME');
    expect(html).toContain('Mercancía recibida conforme en su totalidad.');
  });

  it('lista los items con su causa cuando la entrega no es conforme', () => {
    const recibo = {
      ...RECIBO_BASE,
      conforme: false,
      itemsProblemas: [
        { nombre: 'Llanta Michelin 205/55', cantidad: 2, causaLabel: 'Dañado', detalle: 'Golpe en el flanco' }
      ]
    };
    const html = construirHtmlPOD(recibo, PEDIDO);
    expect(html).toContain('ENTREGA NO CONFORME');
    expect(html).toContain('Llanta Michelin 205/55');
    expect(html).toContain('Dañado');
    expect(html).toContain('Golpe en el flanco');
  });

  it('avisa explicitamente cuando no hubo geolocalizacion', () => {
    const html = construirHtmlPOD(RECIBO_BASE, PEDIDO);
    expect(html).toContain('Sin geolocalización registrada');
  });

  it('muestra coordenadas, precision y enlace al mapa cuando hay ubicacion', () => {
    const recibo = {
      ...RECIBO_BASE,
      ubicacionEntrega: { lat: 10.4918, lng: -66.8289, precision: 13, fuente: 'puntual', timestamp: 1700000000000 }
    };
    const html = construirHtmlPOD(recibo, PEDIDO);
    expect(html).toContain('10.491800, -66.828900');
    expect(html).toContain('± 13 m');
    expect(html).toContain('GPS al momento de la entrega');
    expect(html).toContain('https://www.google.com/maps?q=10.4918,-66.8289');
  });

  it('incrusta la firma y las fotos', () => {
    const recibo = {
      ...RECIBO_BASE,
      fotos: ['data:image/jpeg;base64,AAA', 'data:image/jpeg;base64,BBB']
    };
    const html = construirHtmlPOD(recibo, PEDIDO);
    expect(html).toContain('Evidencia fotográfica');
    expect(html).toContain('data:image/jpeg;base64,AAA');
    expect(html).toContain('data:image/jpeg;base64,BBB');
    expect(html).toContain('data:image/png;base64,iVBORw0KGgo=');
  });

  it('omite la seccion de fotos cuando no hay evidencia', () => {
    const html = construirHtmlPOD(RECIBO_BASE, PEDIDO);
    expect(html).not.toContain('Evidencia fotográfica');
  });

  it('escapa el contenido para que un nombre con HTML no rompa el documento', () => {
    const recibo = {
      ...RECIBO_BASE,
      receptor: { nombre: '<script>alert("x")</script>', cedula: 'V-1' },
      observaciones: 'Comillas " y <etiquetas> & ampersands'
    };
    const html = construirHtmlPOD(recibo, PEDIDO);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
  });

  it('no rompe cuando faltan datos del pedido', () => {
    const html = construirHtmlPOD({ conforme: true }, {});
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('—');
  });
});
