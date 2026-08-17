import {
  pesoAproximadoBytes,
  formatearPeso,
  ajustarPesoRecibo,
  LIMITE_BYTES_RECIBO,
  MAX_FOTOS
} from './imagenes';

describe('pesoAproximadoBytes', () => {
  it('mide el payload serializado', () => {
    expect(pesoAproximadoBytes({ a: 'x' })).toBe(JSON.stringify({ a: 'x' }).length);
  });

  it('crece con el contenido incrustado', () => {
    const chico = pesoAproximadoBytes({ fotos: ['a'] });
    const grande = pesoAproximadoBytes({ fotos: ['a'.repeat(10000)] });
    expect(grande).toBeGreaterThan(chico);
  });
});

describe('formatearPeso', () => {
  it('usa la unidad adecuada segun el tamano', () => {
    expect(formatearPeso(512)).toBe('512 B');
    expect(formatearPeso(2048)).toBe('2 KB');
    expect(formatearPeso(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('limites de seguridad', () => {
  it('el presupuesto deja margen bajo el limite de 1 MiB de Firestore', () => {
    expect(LIMITE_BYTES_RECIBO).toBeLessThan(1024 * 1024);
  });

  it('acota la cantidad de fotos por entrega', () => {
    expect(MAX_FOTOS).toBeGreaterThan(0);
    expect(MAX_FOTOS).toBeLessThanOrEqual(5);
  });
});

describe('ajustarPesoRecibo', () => {
  it('no toca un recibo que ya entra en el presupuesto', async () => {
    const recibo = { firma: 'data:image/png;base64,AAA', fotos: ['data:image/jpeg;base64,BBB'] };
    const { recibo: resultado, ajustado, peso } = await ajustarPesoRecibo(recibo);

    expect(ajustado).toBe(false);
    expect(resultado).toBe(recibo);
    expect(peso).toBeLessThan(LIMITE_BYTES_RECIBO);
  });

  it('no intenta recomprimir cuando el recibo no tiene fotos', async () => {
    const recibo = { firma: 'data:image/png;base64,' + 'A'.repeat(LIMITE_BYTES_RECIBO) };
    const { ajustado, peso } = await ajustarPesoRecibo(recibo);

    expect(ajustado).toBe(false);
    expect(peso).toBeGreaterThan(LIMITE_BYTES_RECIBO);
  });

  it('reporta el exceso de peso para que el llamador pueda rechazar el guardado', async () => {
    const fotoEnorme = 'data:image/jpeg;base64,' + 'A'.repeat(LIMITE_BYTES_RECIBO);
    const { peso } = await ajustarPesoRecibo({ fotos: [] , firma: fotoEnorme });
    expect(peso).toBeGreaterThan(LIMITE_BYTES_RECIBO);
  });
});
