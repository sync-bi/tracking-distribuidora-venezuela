// src/components/Despachos/FormularioDespacho.js
import React, { useState } from 'react';
import { 
  Users, Truck, Package, Calendar, Clock, MapPin, 
  X, AlertCircle, CheckCircle2 
} from 'lucide-react';

const FormularioDespacho = ({ 
  camiones = [], 
  conductores = [], 
  pedidos = [], 
  onCrear, 
  onCerrar 
}) => {
  const [formData, setFormData] = useState({
    camionId: '',
    conductorId: '',
    pedidosSeleccionados: [],
    fechaSalida: new Date().toISOString().split('T')[0],
    horaSalida: '08:00',
    observaciones: ''
  });

  const [errors, setErrors] = useState({});
  const [paso, setPaso] = useState(1); // 1: Camión/Conductor, 2: Pedidos, 3: Detalles

  // Camiones disponibles
  const camionesDisponibles = camiones.filter(c => c.estado === 'Disponible');
  
  // Conductores disponibles
  const conductoresDisponibles = conductores.filter(c => c.estado === 'Disponible');
  
  // Pedidos disponibles (sin asignar)
  const pedidosDisponibles = pedidos.filter(p => !p.camionAsignado);

  // Validar paso actual
  const validarPaso = (numeroPaso) => {
    const nuevosErrores = {};

    if (numeroPaso === 1) {
      if (!formData.camionId) nuevosErrores.camionId = 'Seleccione un camión';
      if (!formData.conductorId) nuevosErrores.conductorId = 'Seleccione un conductor';
    }

    if (numeroPaso === 2) {
      if (formData.pedidosSeleccionados.length === 0) {
        nuevosErrores.pedidos = 'Seleccione al menos un pedido';
      }
    }

    if (numeroPaso === 3) {
      if (!formData.fechaSalida) nuevosErrores.fechaSalida = 'Seleccione fecha de salida';
      if (!formData.horaSalida) nuevosErrores.horaSalida = 'Seleccione hora de salida';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Avanzar paso
  const siguientePaso = () => {
    if (validarPaso(paso)) {
      setPaso(paso + 1);
    }
  };

  // Retroceder paso
  const pasoAnterior = () => {
    setPaso(paso - 1);
    setErrors({});
  };

  // Toggle pedido
  const togglePedido = (pedidoId) => {
    setFormData(prev => ({
      ...prev,
      pedidosSeleccionados: prev.pedidosSeleccionados.includes(pedidoId)
        ? prev.pedidosSeleccionados.filter(id => id !== pedidoId)
        : [...prev.pedidosSeleccionados, pedidoId]
    }));
  };

  // Crear despacho
  const handleCrear = () => {
    if (validarPaso(3)) {
      onCrear(formData);
    }
  };

  // Obtener datos del camión seleccionado
  const camionSeleccionado = camiones.find(c => c.id === formData.camionId);
  const conductorSeleccionado = conductores.find(c => c.id === formData.conductorId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-bold">Nuevo Despacho</h3>
            <p className="text-gray-600">Paso {paso} de 3: {
              paso === 1 ? 'Selección de Vehículo y Conductor' :
              paso === 2 ? 'Selección de Pedidos' :
              'Detalles del Despacho'
            }</p>
          </div>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center">
            {[1, 2, 3].map((numero) => (
              <React.Fragment key={numero}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  numero <= paso ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {numero < paso ? <CheckCircle2 size={16} /> : numero}
                </div>
                {numero < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    numero < paso ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Paso 1: Camión y Conductor */}
          {paso === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Truck className="text-blue-600" size={20} />
                  Selección de Camión
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {camionesDisponibles.map(camion => (
                    <div
                      key={camion.id}
                      onClick={() => setFormData(prev => ({ ...prev, camionId: camion.id }))}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.camionId === camion.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck size={20} className="text-blue-600" />
                        <div>
                          <div className="font-medium">{camion.id}</div>
                          <div className="text-sm text-gray-600">Placa: {camion.placa}</div>
                          <div className="text-sm text-gray-600">Capacidad: {camion.capacidad}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.camionId && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.camionId}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Users className="text-green-600" size={20} />
                  Selección de Conductor
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conductoresDisponibles.map(conductor => (
                    <div
                      key={conductor.id}
                      onClick={() => setFormData(prev => ({ ...prev, conductorId: conductor.id }))}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.conductorId === conductor.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users size={20} className="text-green-600" />
                        <div>
                          <div className="font-medium">{conductor.nombre}</div>
                          <div className="text-sm text-gray-600">Licencia: {conductor.licencia}</div>
                          <div className="text-sm text-gray-600">Experiencia: {conductor.experiencia}</div>
                          <div className="text-sm text-yellow-600">⭐ {conductor.calificacion}/5</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.conductorId && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.conductorId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Selección de Pedidos */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium flex items-center gap-2">
                  <Package className="text-purple-600" size={20} />
                  Selección de Pedidos ({formData.pedidosSeleccionados.length} seleccionados)
                </h4>
                <div className="text-sm text-gray-600">
                  Capacidad: {camionSeleccionado?.capacidad || 'N/A'}
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pedidosDisponibles.map(pedido => (
                  <div
                    key={pedido.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.pedidosSeleccionados.includes(pedido.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => togglePedido(pedido.id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.pedidosSeleccionados.includes(pedido.id)}
                        onChange={() => togglePedido(pedido.id)}
                        className="mt-1 rounded border-gray-300 text-purple-600"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{pedido.cliente}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin size={14} />
                              {pedido.direccion}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {pedido.productos.length} productos • Prioridad: {pedido.prioridad}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            pedido.prioridad === 'Alta' ? 'bg-red-100 text-red-700' :
                            pedido.prioridad === 'Media' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {pedido.prioridad}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">Productos:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pedido.productos.map((producto, index) => (
                              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {producto.cantidad}x {producto.tipo} {producto.marca}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.pedidos && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle size={16} />
                  {errors.pedidos}
                </p>
              )}
            </div>
          )}

          {/* Paso 3: Detalles del Despacho */}
          {paso === 3 && (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Resumen del Despacho</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Camión:</strong> {camionSeleccionado?.id} - {camionSeleccionado?.placa}
                  </div>
                  <div>
                    <strong>Conductor:</strong> {conductorSeleccionado?.nombre}
                  </div>
                  <div>
                    <strong>Pedidos:</strong> {formData.pedidosSeleccionados.length} entregas
                  </div>
                  <div>
                    <strong>Capacidad:</strong> {camionSeleccionado?.capacidad}
                  </div>
                </div>
              </div>

              {/* Programación */}
              <div>
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Calendar className="text-blue-600" size={20} />
                  Programación de Salida
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Salida *
                    </label>
                    <input
                      type="date"
                      value={formData.fechaSalida}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaSalida: e.target.value }))}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.fechaSalida ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.fechaSalida && (
                      <p className="text-red-500 text-sm mt-1">{errors.fechaSalida}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Salida *
                    </label>
                    <input
                      type="time"
                      value={formData.horaSalida}
                      onChange={(e) => setFormData(prev => ({ ...prev, horaSalida: e.target.value }))}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.horaSalida ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.horaSalida && (
                      <p className="text-red-500 text-sm mt-1">{errors.horaSalida}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (Opcional)
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Instrucciones especiales, notas del despacho..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div>
            {paso > 1 && (
              <button
                onClick={pasoAnterior}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Anterior
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCerrar}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>

            {paso < 3 ? (
              <button
                onClick={siguientePaso}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleCrear}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                Crear Despacho
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioDespacho;