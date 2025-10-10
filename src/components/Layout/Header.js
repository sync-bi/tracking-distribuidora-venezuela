// src/components/Layout/Header.js
import React from 'react';

const Header = ({ 
  estadisticasPedidos = {}, 
  estadisticasCamiones = {},
  estadisticasDespachos = {}
}) => {
  return (
    <header id="app-header" className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sistema de Tracking - SAREGO
            </h1>
            <p className="text-gray-600 mt-1">Venezuela - Seguimiento en Tiempo Real</p>
          </div>
          
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {estadisticasPedidos?.total || 0}
              </div>
              <div className="text-gray-500">Pedidos Total</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {estadisticasPedidos?.enRuta || 0}
              </div>
              <div className="text-gray-500">En Ruta</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {estadisticasPedidos?.pendientes || 0}
              </div>
              <div className="text-gray-500">Pendientes</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {estadisticasCamiones?.disponibles || 0}
              </div>
              <div className="text-gray-500">Camiones Disponibles</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {(estadisticasDespachos?.enRuta || 0) + (estadisticasDespachos?.enPreparacion || 0)}
              </div>
              <div className="text-gray-500">Despachos Activos</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600">
                {estadisticasDespachos?.conductoresLibres || 0}
              </div>
              <div className="text-gray-500">Conductores Libres</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;