// src/components/Despachos/TabDespachoSimplificado.js
import React, { useState, useMemo } from 'react';
import {
  Package,
  Truck,
  User,
  Search,
  CheckSquare,
  Square,
  Weight,
  Box,
  MapPin,
  Plus,
  X,
  AlertCircle,
  List,
  ClipboardList
} from 'lucide-react';

const TabDespachoSimplificado = ({
  pedidos = [],
  camiones = [],
  conductores = [],
  onCrearDespacho
}) => {
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState([]);
  const [camionSeleccionado, setCamionSeleccionado] = useState('');
  const [conductorSeleccionado, setConductorSeleccionado] = useState('');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [zonaExpandida, setZonaExpandida] = useState(null);
  const [vistaMobile, setVistaMobile] = useState('pedidos'); // 'pedidos' | 'resumen'

  // Filtrar pedidos disponibles (sin asignar)
  const pedidosDisponibles = useMemo(() => {
    return pedidos.filter(p => !p.camionAsignado || p.estado === 'Pendiente');
  }, [pedidos]);

  // Agrupar pedidos por zona/ciudad
  const pedidosAgrupados = useMemo(() => {
    const grupos = {};

    pedidosDisponibles.forEach(pedido => {
      const zona = pedido.zona || pedido.ciudad || 'Sin zona';
      if (!grupos[zona]) {
        grupos[zona] = [];
      }
      grupos[zona].push(pedido);
    });

    return grupos;
  }, [pedidosDisponibles]);

  // Filtrar pedidos por búsqueda
  const pedidosFiltrados = useMemo(() => {
    if (!terminoBusqueda) return pedidosAgrupados;

    const grupos = {};
    Object.entries(pedidosAgrupados).forEach(([zona, pedidos]) => {
      const pedidosFiltradosZona = pedidos.filter(p =>
        p.cliente?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        p.id?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        p.direccion?.toLowerCase().includes(terminoBusqueda.toLowerCase())
      );

      if (pedidosFiltradosZona.length > 0) {
        grupos[zona] = pedidosFiltradosZona;
      }
    });

    return grupos;
  }, [pedidosAgrupados, terminoBusqueda]);

  // Calcular totales
  const totales = useMemo(() => {
    const pedidosSeleccionadosData = pedidosDisponibles.filter(p =>
      pedidosSeleccionados.includes(p.id)
    );

    let pesoTotal = 0;
    let volumenTotal = 0;
    let cantidadProductos = 0;

    pedidosSeleccionadosData.forEach(pedido => {
      if (pedido.productos) {
        pedido.productos.forEach(producto => {
          cantidadProductos += producto.cantidad || 0;
          // Estimación de peso y volumen si no están disponibles
          pesoTotal += (producto.peso || 10) * producto.cantidad;
          volumenTotal += (producto.volumen || 0.5) * producto.cantidad;
        });
      }
    });

    return {
      cantidad: pedidosSeleccionados.length,
      peso: pesoTotal.toFixed(2),
      volumen: volumenTotal.toFixed(2),
      productos: cantidadProductos
    };
  }, [pedidosSeleccionados, pedidosDisponibles]);

  // Seleccionar/deseleccionar un pedido
  const togglePedido = (pedidoId) => {
    setPedidosSeleccionados(prev =>
      prev.includes(pedidoId)
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  // Seleccionar/deseleccionar toda una zona
  const toggleZona = (zona) => {
    const pedidosZona = pedidosFiltrados[zona] || [];
    const idsZona = pedidosZona.map(p => p.id);
    const todosSeleccionados = idsZona.every(id => pedidosSeleccionados.includes(id));

    if (todosSeleccionados) {
      // Deseleccionar todos
      setPedidosSeleccionados(prev => prev.filter(id => !idsZona.includes(id)));
    } else {
      // Seleccionar todos
      setPedidosSeleccionados(prev => {
        const nuevosIds = idsZona.filter(id => !prev.includes(id));
        return [...prev, ...nuevosIds];
      });
    }
  };

  // Limpiar selección
  const limpiarSeleccion = () => {
    setPedidosSeleccionados([]);
  };

  // Crear despacho
  const handleCrearDespacho = () => {
    if (!camionSeleccionado) {
      alert('Por favor seleccione un camión');
      return;
    }

    if (!conductorSeleccionado) {
      alert('Por favor seleccione un conductor');
      return;
    }

    if (pedidosSeleccionados.length === 0) {
      alert('Por favor seleccione al menos un pedido');
      return;
    }

    const datosDespacho = {
      camionId: camionSeleccionado,
      conductorId: conductorSeleccionado,
      pedidosSeleccionados: pedidosSeleccionados,
      fechaSalida: new Date().toISOString().split('T')[0],
      horaSalida: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
    };

    onCrearDespacho(datosDespacho);

    // Limpiar formulario
    setPedidosSeleccionados([]);
    setCamionSeleccionado('');
    setConductorSeleccionado('');
  };

  // Verificar si una zona está completamente seleccionada
  const zonaCompletamenteSeleccionada = (zona) => {
    const pedidosZona = pedidosFiltrados[zona] || [];
    return pedidosZona.length > 0 && pedidosZona.every(p => pedidosSeleccionados.includes(p.id));
  };

  // Camiones y conductores disponibles
  const camionesDisponibles = camiones.filter(c => c.estado === 'Disponible' || c.estado === 'Asignado');
  const conductoresDisponibles = conductores.filter(c => c.estado === 'Disponible');

  return (
    <div className="fixed inset-0 top-[116px] md:top-[168px] flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-6">
      {/* Toggle vista móvil */}
      <div className="md:hidden flex gap-2 mb-2">
        <button
          onClick={() => setVistaMobile('pedidos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
            vistaMobile === 'pedidos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <List size={18} />
          Pedidos
        </button>
        <button
          onClick={() => setVistaMobile('resumen')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors relative ${
            vistaMobile === 'resumen' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <ClipboardList size={18} />
          Resumen
          {pedidosSeleccionados.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {pedidosSeleccionados.length}
            </span>
          )}
        </button>
      </div>

      {/* Panel izquierdo - Lista de pedidos */}
      <div id="despachos-pedidos-list" className={`${vistaMobile === 'pedidos' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white rounded-lg shadow-lg min-w-0`}>
        {/* Header */}
        <div className="p-3 md:p-4 border-b">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 mb-3 md:mb-4">
            <Package className="text-blue-600" size={20} />
            Pedidos Disponibles
          </h2>

          {/* Búsqueda */}
          <div id="despachos-search" className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar cliente, pedido..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
          </div>

          {/* Contador */}
          <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-600">
            {Object.keys(pedidosFiltrados).length} zonas • {pedidosDisponibles.length} pedidos
          </div>
        </div>

        {/* Lista de zonas y pedidos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {Object.entries(pedidosFiltrados).length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay pedidos disponibles</p>
            </div>
          ) : (
            Object.entries(pedidosFiltrados).map(([zona, pedidosZona]) => {
              const zonaSeleccionada = zonaCompletamenteSeleccionada(zona);
              const algunoSeleccionado = pedidosZona.some(p => pedidosSeleccionados.includes(p.id));
              const expandida = zonaExpandida === zona;

              return (
                <div key={zona} className="border rounded-lg overflow-hidden">
                  {/* Header de zona */}
                  <div
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      zonaSeleccionada
                        ? 'bg-blue-100 hover:bg-blue-200'
                        : algunoSeleccionado
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setZonaExpandida(expandida ? null : zona)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleZona(zona);
                        }}
                        className="flex-shrink-0"
                      >
                        {zonaSeleccionada ? (
                          <CheckSquare className="text-blue-600" size={20} />
                        ) : (
                          <Square className="text-gray-400" size={20} />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{zona}</div>
                        <div className="text-sm text-gray-600">
                          {pedidosZona.length} pedido{pedidosZona.length !== 1 ? 's' : ''}
                          {algunoSeleccionado && (
                            <span className="ml-2 text-blue-600 font-medium">
                              ({pedidosZona.filter(p => pedidosSeleccionados.includes(p.id)).length} seleccionado{pedidosZona.filter(p => pedidosSeleccionados.includes(p.id)).length !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {expandida ? '▼' : '▶'}
                    </div>
                  </div>

                  {/* Lista de pedidos de la zona */}
                  {expandida && (
                    <div className="divide-y">
                      {pedidosZona.map(pedido => {
                        const seleccionado = pedidosSeleccionados.includes(pedido.id);
                        return (
                          <div
                            key={pedido.id}
                            className={`p-3 cursor-pointer transition-colors ${
                              seleccionado ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => togglePedido(pedido.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 pt-1">
                                {seleccionado ? (
                                  <CheckSquare className="text-blue-600" size={18} />
                                ) : (
                                  <Square className="text-gray-400" size={18} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="font-medium text-gray-900">{pedido.cliente}</div>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                    pedido.prioridad === 'Alta' ? 'bg-red-100 text-red-700' :
                                    pedido.prioridad === 'Media' ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {pedido.prioridad}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                                  <MapPin size={14} />
                                  <span className="truncate">{pedido.direccion}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {pedido.id} • {pedido.productos?.length || 0} producto{pedido.productos?.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Panel derecho fijo - Resumen y acciones */}
      <div id="despachos-resumen" className={`${vistaMobile === 'resumen' ? 'flex' : 'hidden'} md:flex w-full md:w-96 flex-col gap-3 md:gap-4 flex-shrink-0 overflow-y-auto`}>
        {/* Card de resumen */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
            <Box className="text-green-600" size={20} />
            Resumen de Despacho
          </h3>

          {/* Totales */}
          <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600 text-sm md:text-base">Pedidos seleccionados:</span>
              <span className="font-bold text-lg md:text-xl text-blue-600">{totales.cantidad}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600 flex items-center gap-1 text-sm md:text-base">
                <Weight size={14} />
                Peso total:
              </span>
              <span className="font-semibold text-sm md:text-base">{totales.peso} kg</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600 flex items-center gap-1 text-sm md:text-base">
                <Box size={14} />
                Volumen total:
              </span>
              <span className="font-semibold text-sm md:text-base">{totales.volumen} m³</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 flex items-center gap-1 text-sm md:text-base">
                <Package size={14} />
                Total productos:
              </span>
              <span className="font-semibold text-sm md:text-base">{totales.productos}</span>
            </div>
          </div>

          {/* Selector de camión */}
          <div id="despachos-camion-select" className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Truck size={16} />
              Seleccionar Camión *
            </label>
            <select
              value={camionSeleccionado}
              onChange={(e) => setCamionSeleccionado(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Seleccione un camión --</option>
              {camionesDisponibles.map(camion => (
                <option key={camion.id} value={camion.id}>
                  {camion.id} - {camion.placa} ({camion.capacidad})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de conductor */}
          <div id="despachos-conductor-select" className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User size={16} />
              Seleccionar Conductor *
            </label>
            <select
              value={conductorSeleccionado}
              onChange={(e) => setConductorSeleccionado(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Seleccione un conductor --</option>
              {conductoresDisponibles.map(conductor => (
                <option key={conductor.id} value={conductor.id}>
                  {conductor.nombre} - {conductor.licencia}
                </option>
              ))}
            </select>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2">
            <button
              id="despachos-crear-btn"
              onClick={handleCrearDespacho}
              disabled={!camionSeleccionado || !conductorSeleccionado || pedidosSeleccionados.length === 0}
              className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                camionSeleccionado && conductorSeleccionado && pedidosSeleccionados.length > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus size={20} />
              Crear Despacho
            </button>

            {pedidosSeleccionados.length > 0 && (
              <button
                onClick={limpiarSeleccion}
                className="w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
              >
                <X size={18} />
                Limpiar Selección
              </button>
            )}
          </div>

          {/* Advertencias */}
          {pedidosSeleccionados.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-yellow-800">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Seleccione al menos un pedido para crear el despacho</span>
              </div>
            </div>
          )}
        </div>

        {/* Card de información */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Instrucciones</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click en zonas para seleccionar todos los pedidos</li>
            <li>• Click en pedidos individuales para selección manual</li>
            <li>• Use la búsqueda para filtrar pedidos</li>
            <li>• Revise los totales antes de crear el despacho</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TabDespachoSimplificado;
