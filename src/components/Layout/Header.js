// src/components/Layout/Header.js
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Header = ({
  estadisticasPedidos = {},
  estadisticasCamiones = {},
  estadisticasDespachos = {}
}) => {
  const [mostrarStats, setMostrarStats] = useState(false);

  return (
    <header id="app-header" className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          {/* Título y botón de stats en móvil */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                Sistema de Tracking - SAREGO
              </h1>
              <p className="text-gray-600 text-xs md:text-base mt-0.5 md:mt-1">Venezuela - Seguimiento en Tiempo Real</p>
            </div>
            {/* Botón para mostrar/ocultar stats en móvil */}
            <button
              onClick={() => setMostrarStats(!mostrarStats)}
              className="md:hidden flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"
            >
              Stats
              {mostrarStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Estadísticas - ocultas en móvil por defecto */}
          <div className={`${mostrarStats ? 'grid' : 'hidden'} md:flex grid-cols-3 gap-3 md:gap-6 text-sm`}>
            <div className="text-center bg-blue-50 md:bg-transparent p-2 md:p-0 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                {estadisticasPedidos?.total || 0}
              </div>
              <div className="text-gray-500 text-xs md:text-sm">Pedidos</div>
            </div>

            <div className="text-center bg-green-50 md:bg-transparent p-2 md:p-0 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-green-600">
                {estadisticasPedidos?.enRuta || 0}
              </div>
              <div className="text-gray-500 text-xs md:text-sm">En Ruta</div>
            </div>

            <div className="text-center bg-orange-50 md:bg-transparent p-2 md:p-0 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-orange-600">
                {estadisticasPedidos?.pendientes || 0}
              </div>
              <div className="text-gray-500 text-xs md:text-sm">Pendientes</div>
            </div>

            <div className="text-center bg-purple-50 md:bg-transparent p-2 md:p-0 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-purple-600">
                {estadisticasCamiones?.disponibles || 0}
              </div>
              <div className="text-gray-500 text-xs md:text-sm">Camiones Disp.</div>
            </div>

            <div className="text-center bg-indigo-50 md:bg-transparent p-2 md:p-0 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-indigo-600">
                {(estadisticasDespachos?.enRuta || 0) + (estadisticasDespachos?.enPreparacion || 0)}
              </div>
              <div className="text-gray-500 text-xs md:text-sm">Despachos</div>
            </div>

            <div className="text-center bg-cyan-50 md:bg-transparent p-2 md:p-0 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-cyan-600">
                {estadisticasDespachos?.conductoresLibres || 0}
              </div>
              <div className="text-gray-500 text-xs md:text-sm">Cond. Libres</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;