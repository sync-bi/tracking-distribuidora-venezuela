import {
  ESTADOS_PEDIDO,
  ESTADOS_ENTREGADOS,
  COLORES_ESTADO,
  COLORES_PRIORIDAD,
  PRIORIDADES
} from './constants';

describe('estados del pedido', () => {
  it('declara los estados de entrega y cierre que usa la app', () => {
    expect(ESTADOS_PEDIDO.ENTREGA_PARCIAL).toBe('Entrega Parcial');
    expect(ESTADOS_PEDIDO.CERRADO).toBe('Cerrado');
  });

  it('todo estado declarado tiene color, para que ninguno se pinte por defecto', () => {
    const sinColor = Object.values(ESTADOS_PEDIDO).filter(estado => !COLORES_ESTADO[estado]);
    expect(sinColor).toEqual([]);
  });

  it('toda prioridad declarada tiene color', () => {
    const sinColor = Object.values(PRIORIDADES).filter(p => !COLORES_PRIORIDAD[p]);
    expect(sinColor).toEqual([]);
  });
});

describe('ESTADOS_ENTREGADOS', () => {
  it('cubre entrega conforme y parcial', () => {
    expect(ESTADOS_ENTREGADOS).toContain(ESTADOS_PEDIDO.ENTREGADO);
    expect(ESTADOS_ENTREGADOS).toContain(ESTADOS_PEDIDO.ENTREGA_PARCIAL);
  });

  it('no considera entregado un pedido que sigue en ruta o cancelado', () => {
    expect(ESTADOS_ENTREGADOS).not.toContain(ESTADOS_PEDIDO.EN_RUTA);
    expect(ESTADOS_ENTREGADOS).not.toContain(ESTADOS_PEDIDO.CANCELADO);
    expect(ESTADOS_ENTREGADOS).not.toContain(ESTADOS_PEDIDO.CERRADO);
  });
});
