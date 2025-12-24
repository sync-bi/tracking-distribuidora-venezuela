// src/components/Conductor/Tracker.js
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Play,
  Square,
  Activity,
  Truck,
  ClipboardCheck,
  Package,
  CheckCircle,
  XCircle,
  PenTool,
  Trash2,
  Save,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTracking } from '../../hooks/useTracking';

const formatTime = (ts) => {
  try { return new Date(ts).toLocaleTimeString(); } catch { return ''; }
};

// Componente de Firma (Canvas)
const SignaturePad = ({ onSave, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear?.();
  };

  const saveSignature = () => {
    if (!hasSignature) return null;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave?.(dataUrl);
    return dataUrl;
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <PenTool size={12} />
          Firma del cliente aquí
        </p>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 size={12} />
          Limpiar
        </button>
      </div>
    </div>
  );
};

// Causas predefinidas para items no conformes
const CAUSAS_NO_CONFORME = [
  { id: 'mal_estado', label: 'Mal estado' },
  { id: 'faltante', label: 'Faltante' },
  { id: 'danado', label: 'Dañado' },
  { id: 'incorrecto', label: 'Producto incorrecto' },
  { id: 'vencido', label: 'Vencido' },
  { id: 'cantidad_incorrecta', label: 'Cantidad incorrecta' },
  { id: 'otro', label: 'Otro' }
];

// Componente de Formulario de Recibido Conforme
const FormularioRecibidoConforme = ({ pedido, onGuardar, onCancelar }) => {
  const [conforme, setConforme] = useState(true);
  const [itemsProblemas, setItemsProblemas] = useState({}); // { itemId: { causa: '', detalle: '' } }
  const [observaciones, setObservaciones] = useState('');
  const [firma, setFirma] = useState(null);
  const [nombreReceptor, setNombreReceptor] = useState('');
  const [cedulaReceptor, setCedulaReceptor] = useState('');

  // Items del pedido - normalizar estructura
  const items = useMemo(() => {
    let itemsRaw = [];

    if (pedido?.productos?.length > 0) {
      itemsRaw = pedido.productos;
    } else if (pedido?.items?.length > 0) {
      itemsRaw = pedido.items;
    } else {
      // Items de ejemplo
      return [
        { id: 'demo-1', nombre: 'Producto de ejemplo 1', cantidad: 2 },
        { id: 'demo-2', nombre: 'Producto de ejemplo 2', cantidad: 1 },
        { id: 'demo-3', nombre: 'Producto de ejemplo 3', cantidad: 3 }
      ];
    }

    // Normalizar items para asegurar que tengan id y nombre
    return itemsRaw.map((item, index) => ({
      id: item.id || item.codigo || item.sku || `item-${index}`,
      nombre: item.nombre || item.descripcion || item.producto || item.item || `Item ${index + 1}`,
      cantidad: item.cantidad || item.qty || item.cant || 1
    }));
  }, [pedido]);

  // Toggle individual de item con problema
  const toggleItemProblema = (itemId) => {
    setItemsProblemas(prev => {
      const newState = { ...prev };
      if (newState[itemId]) {
        delete newState[itemId];
      } else {
        newState[itemId] = { causa: '', detalle: '' };
      }
      return newState;
    });
  };

  // Actualizar causa de un item
  const actualizarCausaItem = (itemId, causa) => {
    setItemsProblemas(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], causa }
    }));
  };

  // Actualizar detalle de un item
  const actualizarDetalleItem = (itemId, detalle) => {
    setItemsProblemas(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], detalle }
    }));
  };

  // Verificar si un item tiene problema
  const tieneProblema = (itemId) => {
    return itemsProblemas[itemId] !== undefined;
  };

  // Obtener datos del problema de un item
  const getProblemaItem = (itemId) => {
    return itemsProblemas[itemId] || null;
  };

  // Contar items con problemas
  const cantidadProblemas = Object.keys(itemsProblemas).length;

  const handleGuardar = () => {
    if (!firma) {
      alert('Por favor, solicite la firma del cliente');
      return;
    }
    if (!nombreReceptor.trim()) {
      alert('Por favor, ingrese el nombre de quien recibe');
      return;
    }

    // Validar que todos los items con problema tengan causa seleccionada
    const itemsSinCausa = Object.entries(itemsProblemas)
      .filter(([_, problema]) => !problema.causa)
      .map(([id]) => items.find(i => i.id === id)?.nombre);

    if (itemsSinCausa.length > 0) {
      alert(`Por favor, seleccione la causa para: ${itemsSinCausa.join(', ')}`);
      return;
    }

    // Construir lista de items con problemas incluyendo causa y detalle
    const itemsConProblemas = Object.entries(itemsProblemas)
      .map(([id, problema]) => {
        const item = items.find(i => i.id === id);
        const causaLabel = CAUSAS_NO_CONFORME.find(c => c.id === problema.causa)?.label || problema.causa;
        return {
          ...item,
          causa: problema.causa,
          causaLabel,
          detalle: problema.detalle
        };
      })
      .filter(Boolean);

    const recibo = {
      pedidoId: pedido?.id,
      fechaEntrega: new Date().toISOString(),
      conforme: conforme && cantidadProblemas === 0,
      itemsProblemas: itemsConProblemas,
      observaciones,
      receptor: {
        nombre: nombreReceptor,
        cedula: cedulaReceptor
      },
      firma,
      ubicacionEntrega: null
    };

    onGuardar?.(recibo);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ClipboardCheck size={24} />
            Recibido Conforme
          </h3>
          <button
            onClick={onCancelar}
            className="p-1 hover:bg-green-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-green-100 text-sm mt-1">
          Pedido: {pedido?.id || 'Sin ID'}
        </p>
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Info del cliente */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="font-semibold text-blue-900">{pedido?.cliente || 'Cliente'}</p>
          <p className="text-sm text-blue-700">{pedido?.direccion || 'Dirección del cliente'}</p>
        </div>

        {/* Estado de entrega */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Estado de la entrega
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConforme(true)}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                conforme
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <CheckCircle size={20} />
              <span className="font-medium">Conforme</span>
            </button>
            <button
              onClick={() => setConforme(false)}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                !conforme
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <XCircle size={20} />
              <span className="font-medium">No Conforme</span>
            </button>
          </div>
        </div>

        {/* Lista de items */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Package size={16} />
            Items del pedido
            {!conforme && <span className="text-xs text-red-600">(toque para marcar problemas)</span>}
          </label>
          <div className="border rounded-lg divide-y">
            {items.map((item) => {
              const conProblema = tieneProblema(item.id);
              const problema = getProblemaItem(item.id);
              return (
                <div key={item.id} className={`transition-colors ${conProblema ? 'bg-red-50' : ''}`}>
                  {/* Fila principal del item */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!conforme) {
                        toggleItemProblema(item.id);
                      }
                    }}
                    className={`p-3 flex items-center justify-between ${
                      !conforme ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {!conforme && (
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            conProblema
                              ? 'border-red-500 bg-red-500'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {conProblema && (
                            <X size={16} className="text-white" />
                          )}
                        </div>
                      )}
                      <span className={`${conProblema ? 'line-through text-red-600' : 'text-gray-800'}`}>
                        {item.nombre}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                      Cant: {item.cantidad}
                    </span>
                  </div>

                  {/* Panel de causa (visible solo si tiene problema) */}
                  {conProblema && (
                    <div className="px-3 pb-3 pt-1 border-t border-red-200 bg-red-50">
                      <div className="space-y-2">
                        <select
                          value={problema?.causa || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            actualizarCausaItem(item.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full p-2 text-sm border border-red-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="">-- Seleccione causa --</option>
                          {CAUSAS_NO_CONFORME.map(causa => (
                            <option key={causa.id} value={causa.id}>
                              {causa.label}
                            </option>
                          ))}
                        </select>
                        {problema?.causa === 'otro' && (
                          <input
                            type="text"
                            value={problema?.detalle || ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              actualizarDetalleItem(item.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Especifique el problema..."
                            className="w-full p-2 text-sm border border-red-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {cantidadProblemas > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <AlertTriangle size={16} />
              <span>{cantidadProblemas} item(s) con problema(s)</span>
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Observaciones
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Agregue observaciones si es necesario..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows="2"
          />
        </div>

        {/* Datos del receptor */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Datos de quien recibe
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={nombreReceptor}
              onChange={(e) => setNombreReceptor(e.target.value)}
              placeholder="Nombre completo *"
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              value={cedulaReceptor}
              onChange={(e) => setCedulaReceptor(e.target.value)}
              placeholder="Cédula (opcional)"
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Área de firma */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Firma del cliente *
          </label>
          <SignaturePad
            onSave={setFirma}
            onClear={() => setFirma(null)}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="p-4 border-t bg-gray-50 space-y-2">
        <button
          onClick={handleGuardar}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <Save size={20} />
          Guardar Recibo
        </button>
        <button
          onClick={onCancelar}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <X size={18} />
          Cancelar
        </button>
      </div>
    </div>
  );
};

const Tracker = ({ user, camiones = [], despachos = [], pedidos = [], onStartTracking, onStopTracking, onSendPosition, onGuardarRecibo }) => {
  const [vehiculoId, setVehiculoId] = useState(camiones[0]?.id || '');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [recibosGuardados, setRecibosGuardados] = useState([]);
  const [expandirRecibos, setExpandirRecibos] = useState(false);

  useEffect(() => {
    if (!vehiculoId && camiones.length) setVehiculoId(camiones[0].id);
  }, [camiones, vehiculoId]);

  const {
    isTracking,
    start,
    stop,
    lastFix,
    error,
    queueLength
  } = useTracking({
    sendPosition: async (evt) => {
      await onSendPosition?.(evt);
      return Promise.resolve();
    },
    minSeconds: 15,
    minMeters: 50
  });

  const vehiculoSeleccionado = useMemo(() => camiones.find(c => c.id === vehiculoId), [camiones, vehiculoId]);

  // Obtener pedidos asignados al camión seleccionado
  const pedidosDelCamion = useMemo(() => {
    if (!vehiculoId) return [];
    return pedidos.filter(p =>
      p.camionAsignado === vehiculoId &&
      (p.estado === 'Asignado' || p.estado === 'En Ruta')
    );
  }, [pedidos, vehiculoId]);

  const handleStart = async () => {
    if (!vehiculoId) return;
    onStartTracking?.(vehiculoId);
    start({ vehiculoId, driverId: user?.id ?? 'driver' });
  };

  const handleStop = () => {
    stop();
    if (vehiculoId) onStopTracking?.(vehiculoId);
  };

  const handleAbrirFormulario = (pedido) => {
    setPedidoSeleccionado(pedido);
    setMostrarFormulario(true);
  };

  const handleGuardarRecibo = (recibo) => {
    // Agregar a la lista local de recibos
    setRecibosGuardados(prev => [...prev, recibo]);

    // Llamar callback externo si existe
    onGuardarRecibo?.(recibo);

    // Cerrar formulario
    setMostrarFormulario(false);
    setPedidoSeleccionado(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Navigation size={18} /> Modo Conductor
      </h2>

      {/* Control de tracking */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Camión</label>
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-gray-500" />
              <select
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              >
                {camiones.map(c => (
                  <option key={c.id} value={c.id}>{c.id} - {c.placa}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStart}
              disabled={!vehiculoId || isTracking}
              className={`flex items-center gap-2 px-4 py-2 rounded text-white ${isTracking ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              title="Iniciar seguimiento"
            >
              <Play size={16} /> Iniciar
            </button>
            <button
              onClick={handleStop}
              disabled={!isTracking}
              className={`flex items-center gap-2 px-4 py-2 rounded text-white ${!isTracking ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              title="Detener seguimiento"
            >
              <Square size={16} /> Detener
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <div>Estado: {isTracking ? <span className="text-green-600 font-medium">Rastreando</span> : <span className="text-gray-700">Detenido</span>}</div>
            <div>Cola offline: {queueLength}</div>
            {error && <div className="text-red-600">{String(error.message || error)}</div>}
          </div>
        </div>
      </div>

      {/* Última posición */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-gray-500" />
          <h3 className="font-medium">Última posición</h3>
        </div>
        {lastFix ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Hora</div>
              <div className="font-medium">{formatTime(lastFix.ts)}</div>
            </div>
            <div>
              <div className="text-gray-500">Lat</div>
              <div className="font-medium">{lastFix.coord.lat.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-gray-500">Lng</div>
              <div className="font-medium">{lastFix.coord.lng.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-gray-500">Velocidad</div>
              <div className="font-medium">{lastFix.speedKmh != null ? `${lastFix.speedKmh} km/h` : '—'}</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600 text-sm">Sin lecturas aún. Inicia el seguimiento para ver datos.</div>
        )}
      </div>

      {/* Pedidos asignados para entregar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-blue-600" />
          <h3 className="font-medium">Pedidos para entregar</h3>
          <span className="ml-auto text-sm text-gray-500">
            {pedidosDelCamion.length} pedido(s)
          </span>
        </div>

        {pedidosDelCamion.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package size={48} className="mx-auto mb-3 opacity-50" />
            <p>No hay pedidos asignados a este camión</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidosDelCamion.map(pedido => (
              <div
                key={pedido.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{pedido.cliente}</p>
                    <p className="text-sm text-gray-600">{pedido.direccion}</p>
                    <p className="text-xs text-gray-400">{pedido.ciudad}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    pedido.estado === 'En Ruta'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {pedido.estado}
                  </span>
                </div>
                <button
                  onClick={() => handleAbrirFormulario(pedido)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <ClipboardCheck size={16} />
                  Registrar Entrega
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recibos guardados */}
      {recibosGuardados.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <button
            onClick={() => setExpandirRecibos(!expandirRecibos)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <h3 className="font-medium">Recibos guardados ({recibosGuardados.length})</h3>
            </div>
            {expandirRecibos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandirRecibos && (
            <div className="border-t divide-y">
              {recibosGuardados.map((recibo, index) => (
                <div key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Pedido: {recibo.pedidoId}</p>
                      <p className="text-sm text-gray-600">
                        Recibido por: {recibo.receptor.nombre}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(recibo.fechaEntrega).toLocaleString('es-VE')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      recibo.conforme
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {recibo.conforme ? 'Conforme' : 'No Conforme'}
                    </span>
                  </div>
                  {recibo.itemsProblemas?.length > 0 && (
                    <div className="mt-2 text-sm text-red-600 space-y-1">
                      <p className="font-medium">Items con problemas:</p>
                      {recibo.itemsProblemas.map((item, idx) => (
                        <p key={idx} className="ml-2">
                          • {item.nombre}: <span className="font-medium">{item.causaLabel}</span>
                          {item.detalle && ` - ${item.detalle}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Formulario de Recibido Conforme */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg">
            <FormularioRecibidoConforme
              pedido={pedidoSeleccionado}
              onGuardar={handleGuardarRecibo}
              onCancelar={() => {
                setMostrarFormulario(false);
                setPedidoSeleccionado(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;
