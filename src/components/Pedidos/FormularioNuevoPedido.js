// src/components/Pedidos/FormularioNuevoPedido.js
import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import Modal from '../UI/Modal';

const FormularioNuevoPedido = ({ onCrear, onCerrar }) => {
  const [nuevoPedido, setNuevoPedido] = useState({
    cliente: '',
    direccion: '',
    productos: [{ tipo: 'Llanta', marca: '', cantidad: 1, modelo: '' }],
    prioridad: 'Media'
  });

  const [errores, setErrores] = useState({});

  const tiposProducto = ['Llanta', 'Batería'];
  const prioridades = ['Baja', 'Media', 'Alta', 'Urgente'];
  
  const marcasLlantas = ['Bridgestone', 'Michelin', 'Firestone', 'Goodyear', 'Continental', 'Pirelli'];
  const marcasBaterias = ['Duncan', 'Tudor', 'Bosch', 'Varta', 'AC Delco', 'Optima'];

  const agregarProducto = () => {
    setNuevoPedido(prev => ({
      ...prev,
      productos: [...prev.productos, { tipo: 'Llanta', marca: '', cantidad: 1, modelo: '' }]
    }));
  };

  const eliminarProducto = (index) => {
    if (nuevoPedido.productos.length > 1) {
      setNuevoPedido(prev => ({
        ...prev,
        productos: prev.productos.filter((_, i) => i !== index)
      }));
    }
  };

  const actualizarProducto = (index, campo, valor) => {
    setNuevoPedido(prev => ({
      ...prev,
      productos: prev.productos.map((prod, i) => 
        i === index ? { ...prod, [campo]: valor } : prod
      )
    }));
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!nuevoPedido.cliente.trim()) {
      nuevosErrores.cliente = 'El nombre del cliente es requerido';
    }

    if (!nuevoPedido.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es requerida';
    }

    // Validar productos
    nuevoPedido.productos.forEach((producto, index) => {
      if (!producto.marca.trim()) {
        nuevosErrores[`producto_${index}_marca`] = 'La marca es requerida';
      }
      if (!producto.modelo.trim()) {
        nuevosErrores[`producto_${index}_modelo`] = 'El modelo es requerido';
      }
      if (producto.cantidad < 1) {
        nuevosErrores[`producto_${index}_cantidad`] = 'La cantidad debe ser mayor a 0';
      }
    });

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const crearPedido = () => {
    if (validarFormulario()) {
      onCrear(nuevoPedido);
    }
  };

  const obtenerMarcasPorTipo = (tipo) => {
    return tipo === 'Llanta' ? marcasLlantas : marcasBaterias;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCerrar}
      title="Nuevo Pedido"
      size="lg"
    >
      <div className="p-6">
        <div className="space-y-6">
          {/* Información del cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <input
                type="text"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errores.cliente ? 'border-red-500' : 'border-gray-300'
                }`}
                value={nuevoPedido.cliente}
                onChange={(e) => setNuevoPedido(prev => ({ ...prev, cliente: e.target.value }))}
                placeholder="Nombre del cliente o empresa"
              />
              {errores.cliente && (
                <p className="text-red-500 text-xs mt-1">{errores.cliente}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={nuevoPedido.prioridad}
                onChange={(e) => setNuevoPedido(prev => ({ ...prev, prioridad: e.target.value }))}
              >
                {prioridades.map(prioridad => (
                  <option key={prioridad} value={prioridad}>{prioridad}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            <textarea
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errores.direccion ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="2"
              value={nuevoPedido.direccion}
              onChange={(e) => setNuevoPedido(prev => ({ ...prev, direccion: e.target.value }))}
              placeholder="Dirección completa con ciudad y estado (ej: Av. Francisco de Miranda, Caracas, Miranda)"
            />
            {errores.direccion && (
              <p className="text-red-500 text-xs mt-1">{errores.direccion}</p>
            )}
          </div>

          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Productos *
              </label>
              <button
                onClick={agregarProducto}
                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                <Plus size={16} />
                Agregar Producto
              </button>
            </div>

            <div className="space-y-3">
              {nuevoPedido.productos.map((producto, index) => (
                <div key={index} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Producto {index + 1}</h4>
                    {nuevoPedido.productos.length > 1 && (
                      <button
                        onClick={() => eliminarProducto(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={producto.tipo}
                        onChange={(e) => {
                          actualizarProducto(index, 'tipo', e.target.value);
                          actualizarProducto(index, 'marca', ''); // Reset marca cuando cambia tipo
                        }}
                      >
                        {tiposProducto.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                      <input
                        type="number"
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                          errores[`producto_${index}_cantidad`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={producto.cantidad}
                        onChange={(e) => actualizarProducto(index, 'cantidad', parseInt(e.target.value))}
                        min="1"
                      />
                      {errores[`producto_${index}_cantidad`] && (
                        <p className="text-red-500 text-xs mt-1">{errores[`producto_${index}_cantidad`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
                      <select
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                          errores[`producto_${index}_marca`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={producto.marca}
                        onChange={(e) => actualizarProducto(index, 'marca', e.target.value)}
                      >
                        <option value="">Seleccionar marca</option>
                        {obtenerMarcasPorTipo(producto.tipo).map(marca => (
                          <option key={marca} value={marca}>{marca}</option>
                        ))}
                      </select>
                      {errores[`producto_${index}_marca`] && (
                        <p className="text-red-500 text-xs mt-1">{errores[`producto_${index}_marca`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
                      <input
                        type="text"
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                          errores[`producto_${index}_modelo`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={producto.modelo}
                        onChange={(e) => actualizarProducto(index, 'modelo', e.target.value)}
                        placeholder={producto.tipo === 'Llanta' ? '225/60R16' : '12V 75Ah'}
                      />
                      {errores[`producto_${index}_modelo`] && (
                        <p className="text-red-500 text-xs mt-1">{errores[`producto_${index}_modelo`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={crearPedido}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            disabled={!nuevoPedido.cliente || !nuevoPedido.direccion}
          >
            Crear Pedido
          </button>
          <button
            onClick={onCerrar}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FormularioNuevoPedido;