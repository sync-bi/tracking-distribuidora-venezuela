// Regla de purga de despachos pendientes.
// Esta función decide qué se BORRA de Firestore: un falso positivo destruye un
// despacho vivo, así que cada condición se prueba por separado.
import { debeBorrarsePendiente } from './firestoreService';

const CORTE = '2026-08-03'; // 15 días antes del 18-ago-2026

const pendienteViejo = {
  estado: 'Pendiente',
  camionAsignado: null,
  fechaEmision: '2026-07-20'
};

describe('debeBorrarsePendiente', () => {
  it('borra un pendiente sin camión y anterior al corte', () => {
    expect(debeBorrarsePendiente(pendienteViejo, CORTE)).toBe(true);
  });

  it('conserva un pendiente dentro de la ventana', () => {
    expect(debeBorrarsePendiente(
      { ...pendienteViejo, fechaEmision: '2026-08-15' }, CORTE
    )).toBe(false);
  });

  it('conserva el pendiente emitido justo en la fecha de corte', () => {
    expect(debeBorrarsePendiente(
      { ...pendienteViejo, fechaEmision: CORTE }, CORTE
    )).toBe(false);
  });

  it('conserva un pendiente viejo si ya tiene camión asignado', () => {
    expect(debeBorrarsePendiente(
      { ...pendienteViejo, camionAsignado: 'camion-01' }, CORTE
    )).toBe(false);
  });

  it.each(['Asignado', 'En Ruta', 'Entregado', 'Entrega Parcial', 'Cerrado'])(
    'nunca borra un despacho en estado %s aunque sea viejo',
    (estado) => {
      expect(debeBorrarsePendiente({ ...pendienteViejo, estado }, CORTE)).toBe(false);
    }
  );

  it.each([undefined, null, '', '   ', 'ayer', '20/07/2026', 12345])(
    'conserva el pendiente si fechaEmision no es una fecha ISO usable (%p)',
    (fechaEmision) => {
      expect(debeBorrarsePendiente({ ...pendienteViejo, fechaEmision }, CORTE)).toBe(false);
    }
  );

  it('no revienta con un documento vacío', () => {
    expect(debeBorrarsePendiente(null, CORTE)).toBe(false);
    expect(debeBorrarsePendiente({}, CORTE)).toBe(false);
  });
});
