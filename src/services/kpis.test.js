import {
  calcularOTD,
  calcularTiempoPromedioEntrega,
  calcularCumplimientoRuta,
  calcularIncidenciasPor100,
  calcularNPS,
  filtrarPorRango,
  calcularKPIs
} from './kpis';

const iso = (ms) => new Date(ms).toISOString();
const AHORA = Date.now();
const horas = (h) => h * 3600000;

describe('OTD (entregas a tiempo)', () => {
  it('cuenta a tiempo la entrega anterior a la ETA', () => {
    const pedidos = [{ id: 'P1', etaEstimada: iso(AHORA + horas(1)) }];
    const recibos = [{ pedidoId: 'P1', fechaEntrega: iso(AHORA) }];

    const otd = calcularOTD(pedidos, recibos);
    expect(otd.valor).toBe(100);
    expect(otd.base).toBe(1);
  });

  it('cuenta fuera de tiempo la entrega posterior a la ETA', () => {
    const pedidos = [{ id: 'P1', etaEstimada: iso(AHORA) }];
    const recibos = [{ pedidoId: 'P1', fechaEntrega: iso(AHORA + horas(2)) }];

    expect(calcularOTD(pedidos, recibos).valor).toBe(0);
  });

  it('excluye del cálculo los pedidos sin ETA o sin recibo', () => {
    const pedidos = [
      { id: 'P1', etaEstimada: iso(AHORA + horas(1)) },
      { id: 'P2' },                                   // sin ETA
      { id: 'P3', etaEstimada: iso(AHORA + horas(1)) } // sin recibo
    ];
    const recibos = [
      { pedidoId: 'P1', fechaEntrega: iso(AHORA) },
      { pedidoId: 'P2', fechaEntrega: iso(AHORA) }
    ];

    const otd = calcularOTD(pedidos, recibos);
    expect(otd.base).toBe(1);
    expect(otd.valor).toBe(100);
  });

  it('devuelve null en vez de 0 cuando no hay base de cálculo', () => {
    const otd = calcularOTD([{ id: 'P1' }], []);
    expect(otd.valor).toBeNull();
    expect(otd.base).toBe(0);
  });
});

describe('tiempo promedio de entrega', () => {
  it('mide desde la salida del almacén hasta la entrega', () => {
    const despachos = [{ camionId: 'C1', salidaAlmacen: { fechaSalida: iso(AHORA) } }];
    const pedidos = [{ id: 'P1', camionAsignado: 'C1' }];
    const recibos = [{ pedidoId: 'P1', fechaEntrega: iso(AHORA + horas(2)) }];

    const kpi = calcularTiempoPromedioEntrega(pedidos, recibos, despachos);
    expect(Math.round(kpi.valor)).toBe(120);
    expect(kpi.base).toBe(1);
  });

  it('descarta entregas anteriores a la salida (datos inconsistentes)', () => {
    const despachos = [{ camionId: 'C1', salidaAlmacen: { fechaSalida: iso(AHORA) } }];
    const pedidos = [{ id: 'P1', camionAsignado: 'C1' }];
    const recibos = [{ pedidoId: 'P1', fechaEntrega: iso(AHORA - horas(1)) }];

    expect(calcularTiempoPromedioEntrega(pedidos, recibos, despachos).valor).toBeNull();
  });

  it('sin registro de salida no puede calcularse', () => {
    const despachos = [{ camionId: 'C1' }];
    const pedidos = [{ id: 'P1', camionAsignado: 'C1' }];
    const recibos = [{ pedidoId: 'P1', fechaEntrega: iso(AHORA) }];

    expect(calcularTiempoPromedioEntrega(pedidos, recibos, despachos).base).toBe(0);
  });
});

describe('cumplimiento de ruta', () => {
  it('mide las paradas planificadas que terminaron entregadas', () => {
    const despachos = [{ ruta: [{ id: 'P1' }, { id: 'P2' }, { id: 'P3' }, { id: 'P4' }] }];
    const pedidos = [
      { id: 'P1', estado: 'Entregado' },
      { id: 'P2', estado: 'Entrega Parcial' },
      { id: 'P3', estado: 'Cerrado' },
      { id: 'P4', estado: 'En Ruta' }
    ];

    const kpi = calcularCumplimientoRuta(despachos, pedidos);
    expect(kpi.valor).toBe(75);
    expect(kpi.base).toBe(4);
  });

  it('sin rutas planificadas no hay indicador', () => {
    expect(calcularCumplimientoRuta([], []).valor).toBeNull();
  });
});

describe('incidencias por 100 entregas', () => {
  it('suma incidencias en ruta y no conformidades', () => {
    const pedidos = Array.from({ length: 50 }, (_, i) => ({ id: `P${i}`, estado: 'Entregado' }));
    const kpi = calcularIncidenciasPor100([{ id: 'I1' }, { id: 'I2' }], [{ id: 'N1' }], pedidos);

    expect(kpi.valor).toBe(6);
    expect(kpi.base).toBe(50);
  });

  it('sin entregas no divide por cero', () => {
    expect(calcularIncidenciasPor100([{ id: 'I1' }], [], []).valor).toBeNull();
  });
});

describe('NPS', () => {
  it('resta detractores de promotores', () => {
    const calificaciones = [
      { calificacion: 10 }, { calificacion: 9 },  // promotores
      { calificacion: 8 },                        // pasivo
      { calificacion: 3 }                         // detractor
    ];
    expect(calcularNPS(calificaciones).valor).toBe(25);
  });

  it('puede ser negativo cuando dominan los detractores', () => {
    const calificaciones = [{ calificacion: 2 }, { calificacion: 3 }, { calificacion: 10 }];
    expect(calcularNPS(calificaciones).valor).toBeCloseTo(-33.3, 0);
  });

  it('sin calificaciones no inventa un valor', () => {
    expect(calcularNPS([]).valor).toBeNull();
  });
});

describe('filtrarPorRango', () => {
  it('deja fuera lo anterior a la ventana', () => {
    const pedidos = [
      { id: 'reciente', fechaEmision: iso(AHORA - horas(24)) },
      { id: 'viejo', fechaEmision: iso(AHORA - horas(24 * 60)) }
    ];
    const filtrados = filtrarPorRango(pedidos, 30);
    expect(filtrados.map(p => p.id)).toEqual(['reciente']);
  });

  it('sin rango devuelve todo', () => {
    const pedidos = [{ id: 'a' }, { id: 'b' }];
    expect(filtrarPorRango(pedidos, 0)).toHaveLength(2);
  });
});

describe('calcularKPIs', () => {
  it('devuelve los cinco indicadores del diagrama', () => {
    const kpis = calcularKPIs();
    expect(Object.keys(kpis).sort()).toEqual(
      ['cumplimientoRuta', 'incidencias', 'nps', 'otd', 'tiempoPromedio']
    );
  });

  it('sin datos, ningún indicador finge tener valor', () => {
    const kpis = calcularKPIs();
    Object.values(kpis).forEach(kpi => expect(kpi.valor).toBeNull());
  });
});
