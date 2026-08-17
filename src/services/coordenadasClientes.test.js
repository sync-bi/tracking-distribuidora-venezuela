import {
  ubicacionEsUtilizable,
  debeAprenderCoordenada,
  PRECISION_MAXIMA_METROS
} from './coordenadasClientes';

const buenFix = {
  lat: 10.4918, lng: -66.8289, precision: 12, fuente: 'puntual', timestamp: 1700000000000
};

describe('ubicacionEsUtilizable', () => {
  it('acepta un fix preciso tomado en la entrega', () => {
    expect(ubicacionEsUtilizable(buenFix)).toBe(true);
    expect(ubicacionEsUtilizable({ ...buenFix, fuente: 'tracking' })).toBe(true);
  });

  it('rechaza un fix impreciso: no sirve para ubicar una puerta', () => {
    expect(ubicacionEsUtilizable({ ...buenFix, precision: PRECISION_MAXIMA_METROS + 1 })).toBe(false);
  });

  it('rechaza un fix viejo del tracking: pudo tomarse cuadras antes', () => {
    expect(ubicacionEsUtilizable({ ...buenFix, fuente: 'tracking_desactualizado' })).toBe(false);
  });

  it('rechaza cuando no se conoce la precisión', () => {
    expect(ubicacionEsUtilizable({ ...buenFix, precision: null })).toBe(false);
  });

  it('rechaza la isla nula y la ausencia de datos', () => {
    expect(ubicacionEsUtilizable({ ...buenFix, lat: 0, lng: 0 })).toBe(false);
    expect(ubicacionEsUtilizable(null)).toBe(false);
  });
});

describe('debeAprenderCoordenada', () => {
  const pedidoSinCoords = { codigoCliente: '001234', cliente: 'Cliente', coordenadas: null };

  it('aprende cuando el cliente no tiene coordenada', () => {
    expect(debeAprenderCoordenada(pedidoSinCoords, null)).toBe(true);
  });

  it('aprende cuando la coordenada existente es sólo el centroide de la ciudad', () => {
    const pedido = {
      ...pedidoSinCoords,
      coordenadas: { lat: 10.48, lng: -66.90, geocodificada: true }
    };
    expect(debeAprenderCoordenada(pedido, null)).toBe(true);
  });

  it('no pisa una coordenada real del ERP', () => {
    const pedido = { ...pedidoSinCoords, coordenadas: { lat: 10.4918, lng: -66.8289 } };
    expect(debeAprenderCoordenada(pedido, null)).toBe(false);
  });

  it('no pisa una corrección hecha a mano', () => {
    const correccion = { coordenadas: { lat: 10.5, lng: -66.8, corregidaManualmente: true } };
    expect(debeAprenderCoordenada(pedidoSinCoords, correccion)).toBe(false);
  });

  it('no reescribe una coordenada ya aprendida', () => {
    const correccion = { metodo: 'gps_entrega', coordenadas: { lat: 10.5, lng: -66.8 } };
    expect(debeAprenderCoordenada(pedidoSinCoords, correccion)).toBe(false);
  });

  it('no hace nada sin código de cliente', () => {
    expect(debeAprenderCoordenada({ cliente: 'Sin código' }, null)).toBe(false);
  });
});
