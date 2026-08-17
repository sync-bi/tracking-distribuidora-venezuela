// src/utils/imagenes.js
// Compresión de evidencia fotográfica para guardarla dentro del documento de Firestore.
//
// Firestore limita cada documento a 1 MiB. El recibo ya lleva la firma en base64,
// así que las fotos se comprimen agresivamente y se valida el peso total antes de guardar.

export const MAX_FOTOS = 3;
export const LADO_MAXIMO_PX = 800;
export const CALIDAD_JPEG = 0.55;

// Presupuesto del documento: 1 MiB real, dejamos margen para firma, items y metadatos.
export const LIMITE_BYTES_RECIBO = 800 * 1024;

const leerArchivo = (archivo) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
  reader.readAsDataURL(archivo);
});

const cargarImagen = (dataUrl) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Formato de imagen no soportado'));
  img.src = dataUrl;
});

/**
 * Reduce una foto a JPEG de lado máximo LADO_MAXIMO_PX y devuelve un data URL.
 */
export const comprimirImagen = async (archivo, { ladoMaximo = LADO_MAXIMO_PX, calidad = CALIDAD_JPEG } = {}) => {
  const dataUrl = await leerArchivo(archivo);
  const img = await cargarImagen(dataUrl);

  const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
  const ancho = Math.round(img.width * escala);
  const alto = Math.round(img.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext('2d');
  // Fondo blanco: los PNG con transparencia quedarían negros al pasar a JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(img, 0, 0, ancho, alto);

  return canvas.toDataURL('image/jpeg', calidad);
};

/**
 * Peso aproximado en bytes de un payload que se va a serializar a JSON.
 */
export const pesoAproximadoBytes = (valor) => {
  try {
    return new Blob([JSON.stringify(valor)]).size;
  } catch {
    return JSON.stringify(valor).length;
  }
};

export const formatearPeso = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Si el recibo excede el presupuesto, recomprime las fotos con calidad decreciente.
 * Devuelve { recibo, ajustado, peso }. Si aun así no entra, el llamador debe rechazarlo.
 */
export const ajustarPesoRecibo = async (recibo, limite = LIMITE_BYTES_RECIBO) => {
  let peso = pesoAproximadoBytes(recibo);
  if (peso <= limite || !recibo.fotos?.length) {
    return { recibo, ajustado: false, peso };
  }

  let actual = recibo;
  let ajustado = false;

  for (const [lado, calidad] of [[640, 0.45], [480, 0.4]]) {
    const fotos = [];
    for (const foto of actual.fotos) {
      // Las fotos ya son data URLs; se recomprimen pasando por un blob.
      const blob = await (await fetch(foto)).blob();
      fotos.push(await comprimirImagen(blob, { ladoMaximo: lado, calidad }));
    }
    actual = { ...actual, fotos };
    ajustado = true;
    peso = pesoAproximadoBytes(actual);
    if (peso <= limite) break;
  }

  return { recibo: actual, ajustado, peso };
};
