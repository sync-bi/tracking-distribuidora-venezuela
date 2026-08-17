// src/utils/pod.js
// Generación del comprobante de entrega (Proof of Delivery).
//
// Se arma como HTML imprimible y se abre en una ventana nueva con el diálogo de
// impresión del navegador, que permite "Guardar como PDF". Evita sumar una
// dependencia de generación de PDF al bundle.

import { ETIQUETA_FUENTE_UBICACION } from './geo';

const escapar = (valor) => String(valor ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const formatearFecha = (valor) => {
  if (!valor) return '—';
  try {
    const fecha = valor?.toDate ? valor.toDate() : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '—';
    return fecha.toLocaleString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return '—';
  }
};

const filaDato = (etiqueta, valor) => `
  <div class="dato">
    <span class="etiqueta">${escapar(etiqueta)}</span>
    <span class="valor">${escapar(valor || '—')}</span>
  </div>`;

const seccionUbicacion = (ubicacion) => {
  if (!ubicacion) {
    return `<p class="aviso">Sin geolocalización registrada en el momento de la entrega.</p>`;
  }

  const coords = `${ubicacion.lat.toFixed(6)}, ${ubicacion.lng.toFixed(6)}`;
  const mapa = `https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lng}`;
  const fuente = ETIQUETA_FUENTE_UBICACION[ubicacion.fuente] || 'GPS';
  const precision = ubicacion.precision != null ? `± ${ubicacion.precision} m` : 'precisión no reportada';

  return `
    <div class="grid">
      ${filaDato('Coordenadas', coords)}
      ${filaDato('Origen del dato', `${fuente} (${precision})`)}
    </div>
    <p class="link">Ver en el mapa: <a href="${escapar(mapa)}">${escapar(mapa)}</a></p>`;
};

const seccionItems = (recibo) => {
  const problemas = recibo.itemsProblemas || [];
  if (!problemas.length) {
    return `<p class="ok">Mercancía recibida conforme en su totalidad.</p>`;
  }

  const filas = problemas.map((item) => `
    <tr>
      <td>${escapar(item.nombre)}</td>
      <td class="centro">${escapar(item.cantidad)}</td>
      <td>${escapar(item.causaLabel || item.causa)}</td>
      <td>${escapar(item.detalle)}</td>
    </tr>`).join('');

  return `
    <table>
      <thead>
        <tr><th>Ítem</th><th class="centro">Cant.</th><th>Causa</th><th>Detalle</th></tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>`;
};

const seccionFotos = (fotos = []) => {
  if (!fotos.length) return '';
  const imgs = fotos
    .map((src, i) => `<figure><img src="${escapar(src)}" alt="Evidencia ${i + 1}" /><figcaption>Evidencia ${i + 1}</figcaption></figure>`)
    .join('');
  return `
    <section>
      <h2>Evidencia fotográfica</h2>
      <div class="fotos">${imgs}</div>
    </section>`;
};

/**
 * Construye el HTML completo del comprobante.
 * Exportado aparte para poder probarlo sin abrir ventanas.
 */
export const construirHtmlPOD = (recibo, pedido = {}) => {
  const numero = pedido.numeroPedido || recibo.numeroPedido || recibo.pedidoId || '—';
  const conforme = recibo.conforme;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Comprobante de entrega ${escapar(numero)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 32px; font-size: 13px; line-height: 1.5; }
  header { border-bottom: 3px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #1e3a8a; }
  .empresa { font-size: 12px; color: #6b7280; margin: 0; }
  .estado { padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 12px; white-space: nowrap; }
  .estado.conforme { background: #dcfce7; color: #166534; }
  .estado.parcial { background: #fee2e2; color: #991b1b; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; margin: 24px 0 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; }
  .dato { display: flex; flex-direction: column; }
  .etiqueta { font-size: 11px; color: #6b7280; }
  .valor { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f9fafb; font-size: 11px; text-transform: uppercase; color: #6b7280; }
  .centro { text-align: center; }
  .ok { color: #166534; font-weight: 600; }
  .aviso { color: #92400e; background: #fef3c7; padding: 8px 12px; border-radius: 6px; }
  .link { font-size: 11px; color: #6b7280; word-break: break-all; }
  .fotos { display: flex; flex-wrap: wrap; gap: 12px; }
  figure { margin: 0; width: 180px; }
  figure img { width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; }
  figcaption { font-size: 11px; color: #6b7280; text-align: center; margin-top: 4px; }
  .firma { margin-top: 8px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; width: 320px; }
  .firma img { width: 100%; display: block; }
  footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
<header>
  <div>
    <h1>Comprobante de Entrega</h1>
    <p class="empresa">Distribuidora Sarego · Pedido ${escapar(numero)}</p>
  </div>
  <span class="estado ${conforme ? 'conforme' : 'parcial'}">
    ${conforme ? 'ENTREGA CONFORME' : 'ENTREGA NO CONFORME'}
  </span>
</header>

<section>
  <h2>Datos de la entrega</h2>
  <div class="grid">
    ${filaDato('Cliente', pedido.cliente || recibo.cliente)}
    ${filaDato('Dirección', pedido.direccion || recibo.direccion)}
    ${filaDato('Fecha y hora', formatearFecha(recibo.fechaEntrega || recibo.fechaRegistro))}
    ${filaDato('N° de comprobante', recibo.id)}
  </div>
</section>

<section>
  <h2>Recibido por</h2>
  <div class="grid">
    ${filaDato('Nombre', recibo.receptor?.nombre)}
    ${filaDato('Cédula', recibo.receptor?.cedula)}
  </div>
</section>

<section>
  <h2>Estado de la mercancía</h2>
  ${seccionItems(recibo)}
  ${recibo.observaciones ? `<p><strong>Observaciones:</strong> ${escapar(recibo.observaciones)}</p>` : ''}
</section>

<section>
  <h2>Geolocalización</h2>
  ${seccionUbicacion(recibo.ubicacionEntrega)}
</section>

${seccionFotos(recibo.fotos)}

${recibo.firma ? `
<section>
  <h2>Firma del receptor</h2>
  <div class="firma"><img src="${escapar(recibo.firma)}" alt="Firma" /></div>
</section>` : ''}

<footer>
  Documento generado automáticamente por el sistema de tracking de Distribuidora Sarego.
  La firma y la geolocalización fueron capturadas en el dispositivo del conductor al momento de la entrega.
</footer>
</body>
</html>`;
};

/**
 * Abre el comprobante en una ventana nueva y lanza el diálogo de impresión.
 * Devuelve false si el navegador bloqueó la ventana emergente.
 */
export const abrirPOD = (recibo, pedido = {}) => {
  const ventana = window.open('', '_blank');
  if (!ventana) return false;

  ventana.document.write(construirHtmlPOD(recibo, pedido));
  ventana.document.close();

  // Esperar a que las imágenes en base64 se pinten antes de imprimir.
  ventana.onload = () => {
    ventana.focus();
    ventana.print();
  };

  return true;
};
