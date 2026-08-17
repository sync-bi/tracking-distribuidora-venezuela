// src/utils/notificaciones.js
// Aviso al cliente por WhatsApp (paso 1.3 del proceso: al salir del almacén).
//
// Limitación conocida: wa.me abre WhatsApp con el mensaje redactado, pero el envío
// lo confirma una persona y no hay acuse de recibo. Confirmar la recepción exige
// WhatsApp Business API. Por eso se notifica de uno en uno y se registra el envío:
// abrir varias pestañas de golpe además es bloqueado por el navegador.

// MODO PRUEBA: si se le pone un número, todos los mensajes van a ese número en
// lugar del teléfono del cliente. Vacío = producción, se usa pedido.telefono.
export const TELEFONO_PRUEBA = '';

/**
 * Normaliza un teléfono venezolano al formato internacional que espera wa.me.
 */
export const normalizarTelefono = (telefono) => {
  if (!telefono) return null;

  const digitos = String(telefono).replace(/\D/g, '');
  if (!digitos) return null;

  // Ya viene con código de país
  if (digitos.startsWith('58')) return digitos;
  // Formato local 0412... -> 58412...
  if (digitos.startsWith('0')) return `58${digitos.slice(1)}`;
  // 412... sin cero inicial
  if (digitos.length === 10) return `58${digitos}`;

  return digitos;
};

export const construirUrlTracking = (pedido, origin = window.location.origin) =>
  `${origin}/tracking/${pedido.numeroPedido || pedido.id}`;

/**
 * Mensaje de salida del almacén.
 */
export const construirMensajeSalida = ({ pedido, placa, conductor, origin }) => {
  const trackingUrl = construirUrlTracking(pedido, origin);

  return `*Distribuidora Sarego*

Hola ${pedido.cliente || ''},

Su pedido *${pedido.numeroPedido || pedido.id}* salió de nuestro almacén y va en camino.

🚛 Vehículo: ${placa || 'N/A'}
👤 Conductor: ${conductor || 'N/A'}

📍 Siga su pedido en tiempo real:
${trackingUrl}

Gracias por su preferencia.`;
};

/**
 * URL de WhatsApp lista para abrir. Devuelve null si no hay teléfono utilizable.
 */
export const construirUrlWhatsApp = ({ pedido, placa, conductor, origin }) => {
  const destino = TELEFONO_PRUEBA || normalizarTelefono(pedido.telefono);
  if (!destino) return null;

  const mensaje = construirMensajeSalida({ pedido, placa, conductor, origin });
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`;
};

/**
 * Mensaje de entrega completada (pasos 3.3A y 4.3 del proceso).
 */
export const construirMensajeEntrega = ({ pedido, conforme, origin }) => {
  const trackingUrl = construirUrlTracking(pedido, origin);

  const cuerpo = conforme
    ? `Su pedido *${pedido.numeroPedido || pedido.id}* ha sido entregado exitosamente.`
    : `Su pedido *${pedido.numeroPedido || pedido.id}* fue entregado con observaciones. Ya estamos gestionando el caso.`;

  return `*Distribuidora Sarego*

Hola ${pedido.cliente || ''},

${cuerpo}

📄 Consulte y descargue su comprobante de entrega:
${trackingUrl}

Gracias por su preferencia.`;
};

export const construirUrlWhatsAppEntrega = ({ pedido, conforme, origin }) => {
  const destino = TELEFONO_PRUEBA || normalizarTelefono(pedido.telefono);
  if (!destino) return null;

  const mensaje = construirMensajeEntrega({ pedido, conforme, origin });
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`;
};

export const esModoPrueba = () => Boolean(TELEFONO_PRUEBA);
