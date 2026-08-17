import { calcularAlertas, SEVERIDADES } from './alertas';
import { TIPOS_ALERTA, CONFIG_ALERTAS } from '../utils/constants';

const AHORA = 1700000000000;
const hace = (min) => new Date(AHORA - min * 60000).toISOString();

// Caracas: dos puntos separados ~50 m y otro a ~5 km
const P1 = { lat: 10.4918, lng: -66.8289 };
const P1_CERCA = { lat: 10.49215, lng: -66.8289 };
const LEJOS = { lat: 10.5370, lng: -66.8289 };

const camionEnRuta = (extra = {}) => ({
  id: 'C1',
  placa: 'ABC123',
  estado: 'En Ruta',
  ultimaActualizacion: hace(1),
  ubicacionActual: P1,
  ...extra
});

const tipos = (alertas) => alertas.map(a => a.tipo);

describe('parada prolongada', () => {
  it('alerta cuando el vehículo no se movió durante la ventana configurada', () => {
    const camion = camionEnRuta({
      historialPosiciones: [
        { ...P1, ts: hace(CONFIG_ALERTAS.MINUTOS_PARADA_PROLONGADA + 5) },
        { ...P1_CERCA, ts: hace(1) }
      ]
    });

    const alertas = calcularAlertas({ camiones: [camion], ahora: AHORA });
    expect(tipos(alertas)).toContain(TIPOS_ALERTA.PARADA_PROLONGADA);
  });

  it('no alerta si el vehículo se desplazó', () => {
    const camion = camionEnRuta({
      ubicacionActual: LEJOS,
      historialPosiciones: [
        { ...P1, ts: hace(CONFIG_ALERTAS.MINUTOS_PARADA_PROLONGADA + 5) },
        { ...LEJOS, ts: hace(1) }
      ]
    });

    const alertas = calcularAlertas({ camiones: [camion], ahora: AHORA });
    expect(tipos(alertas)).not.toContain(TIPOS_ALERTA.PARADA_PROLONGADA);
  });

  it('no alerta si aún no se cumple la ventana', () => {
    const camion = camionEnRuta({
      historialPosiciones: [
        { ...P1, ts: hace(5) },
        { ...P1_CERCA, ts: hace(1) }
      ]
    });

    const alertas = calcularAlertas({ camiones: [camion], ahora: AHORA });
    expect(tipos(alertas)).not.toContain(TIPOS_ALERTA.PARADA_PROLONGADA);
  });
});

describe('pérdida de señal', () => {
  it('alerta cuando el vehículo en ruta deja de reportar', () => {
    const camion = camionEnRuta({ ultimaActualizacion: hace(CONFIG_ALERTAS.MINUTOS_SIN_SENAL + 10) });
    const alertas = calcularAlertas({ camiones: [camion], ahora: AHORA });
    expect(tipos(alertas)).toContain(TIPOS_ALERTA.FALLA_VEHICULO);
  });

  it('sin señal suprime parada y desvío para no duplicar el mismo hecho', () => {
    const camion = camionEnRuta({
      ultimaActualizacion: hace(CONFIG_ALERTAS.MINUTOS_SIN_SENAL + 10),
      historialPosiciones: [
        { ...P1, ts: hace(CONFIG_ALERTAS.MINUTOS_PARADA_PROLONGADA + 5) },
        { ...P1_CERCA, ts: hace(30) }
      ]
    });

    const alertas = calcularAlertas({ camiones: [camion], ahora: AHORA });
    expect(tipos(alertas)).toContain(TIPOS_ALERTA.FALLA_VEHICULO);
    expect(tipos(alertas)).not.toContain(TIPOS_ALERTA.PARADA_PROLONGADA);
    expect(tipos(alertas)).not.toContain(TIPOS_ALERTA.DESVIO);
  });
});

describe('desvío de ruta', () => {
  const pedidoLejano = {
    id: 'P1', camionAsignado: 'C1', estado: 'En Ruta',
    cliente: 'Cliente', coordenadas: LEJOS
  };

  it('alerta cuando el vehículo está lejos de todos sus destinos', () => {
    const alertas = calcularAlertas({
      camiones: [camionEnRuta()], pedidos: [pedidoLejano], ahora: AHORA
    });
    expect(tipos(alertas)).toContain(TIPOS_ALERTA.DESVIO);
  });

  it('no alerta si el destino está dentro del radio', () => {
    const cerca = { ...pedidoLejano, coordenadas: P1_CERCA };
    const alertas = calcularAlertas({
      camiones: [camionEnRuta()], pedidos: [cerca], ahora: AHORA
    });
    expect(tipos(alertas)).not.toContain(TIPOS_ALERTA.DESVIO);
  });

  it('no inventa desvío cuando el destino no tiene coordenadas reales', () => {
    const geocodificado = {
      ...pedidoLejano,
      coordenadas: { ...LEJOS, geocodificada: true }
    };
    const alertas = calcularAlertas({
      camiones: [camionEnRuta()], pedidos: [geocodificado], ahora: AHORA
    });
    expect(tipos(alertas)).not.toContain(TIPOS_ALERTA.DESVIO);
  });

  it('no alerta para pedidos ya entregados', () => {
    const entregado = { ...pedidoLejano, estado: 'Entregado' };
    const alertas = calcularAlertas({
      camiones: [camionEnRuta()], pedidos: [entregado], ahora: AHORA
    });
    expect(tipos(alertas)).not.toContain(TIPOS_ALERTA.DESVIO);
  });
});

describe('retraso y cambio de ETA', () => {
  it('alerta cuando la ETA comprometida ya pasó', () => {
    const pedido = {
      id: 'P1', camionAsignado: 'C1', estado: 'En Ruta', cliente: 'Cliente',
      etaEstimada: hace(CONFIG_ALERTAS.MINUTOS_RETRASO + 15)
    };
    const alertas = calcularAlertas({ camiones: [camionEnRuta()], pedidos: [pedido], ahora: AHORA });
    expect(tipos(alertas)).toContain(TIPOS_ALERTA.RETRASO);
  });

  it('no alerta sin ETA comprometida', () => {
    const pedido = { id: 'P1', camionAsignado: 'C1', estado: 'En Ruta' };
    const alertas = calcularAlertas({ camiones: [camionEnRuta()], pedidos: [pedido], ahora: AHORA });
    expect(tipos(alertas)).not.toContain(TIPOS_ALERTA.RETRASO);
  });

  it('alerta cuando la ETA se movió respecto a la informada al cliente', () => {
    const pedido = {
      id: 'P1', camionAsignado: 'C1', estado: 'En Ruta',
      etaOriginal: new Date(AHORA + 3600000).toISOString(),
      etaEstimada: new Date(AHORA + 3600000 + 45 * 60000).toISOString()
    };
    const alertas = calcularAlertas({ camiones: [camionEnRuta()], pedidos: [pedido], ahora: AHORA });
    expect(tipos(alertas)).toContain(TIPOS_ALERTA.CAMBIO_ETA);
  });
});

describe('incidencias reportadas', () => {
  it('una avería genera alerta crítica', () => {
    const incidencia = {
      id: 'I1', estado: 'Abierta', gravedad: 'Grave',
      tipoLabel: 'Accidente / Avería', camionId: 'C1', descripcion: 'Caucho reventado'
    };
    const alertas = calcularAlertas({ incidencias: [incidencia], ahora: AHORA });
    expect(alertas[0].tipo).toBe(TIPOS_ALERTA.INCIDENCIA);
    expect(alertas[0].severidad).toBe(SEVERIDADES.CRITICA);
  });

  it('las incidencias resueltas no siguen alertando', () => {
    const incidencia = { id: 'I1', estado: 'Resuelta', gravedad: 'Grave', camionId: 'C1' };
    expect(calcularAlertas({ incidencias: [incidencia], ahora: AHORA })).toEqual([]);
  });
});

describe('alcance y orden', () => {
  it('ignora vehículos que no están en ruta', () => {
    const disponible = camionEnRuta({ estado: 'Disponible', ultimaActualizacion: hace(300) });
    expect(calcularAlertas({ camiones: [disponible], ahora: AHORA })).toEqual([]);
  });

  it('ordena las críticas primero', () => {
    const camion = camionEnRuta({ ultimaActualizacion: hace(CONFIG_ALERTAS.MINUTOS_SIN_SENAL + 10) });
    const incidencia = { id: 'I1', estado: 'Abierta', gravedad: 'Grave', camionId: 'C1' };

    const alertas = calcularAlertas({ camiones: [camion], incidencias: [incidencia], ahora: AHORA });
    expect(alertas.length).toBeGreaterThan(1);
    expect(alertas[0].severidad).toBe(SEVERIDADES.CRITICA);
  });

  it('sin datos no inventa alertas', () => {
    expect(calcularAlertas()).toEqual([]);
  });
});
