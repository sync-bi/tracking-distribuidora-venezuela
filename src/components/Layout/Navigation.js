// src/components/Layout/Navigation.js
import React from 'react';
import { Package, Truck, MapPin, Clipboard, Navigation as NavIcon, Radio, MapPinned, Building2 } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab, allowedTabs = [], user, onLogout }) => {
  const tabs = [
    { id: 'pedidos', label: 'Pedidos', icon: Package, description: 'Gestion de pedidos y asignaciones' },
    { id: 'camiones', label: 'Camiones', icon: Truck, description: 'Seguimiento de vehiculos' },
    { id: 'despachos', label: 'Despachos', icon: Clipboard, description: 'Crear nuevos despachos' },
    { id: 'seguimiento', label: 'Seguimiento', icon: Radio, description: 'Seguimiento en tiempo real y optimización de rutas' },
    { id: 'conductor', label: 'Conductor', icon: NavIcon, description: 'Modo rastreador del conductor' },
    { id: 'mapa', label: 'Mapa', icon: MapPin, description: 'Vista geografica en tiempo real' },
    { id: 'ubicaciones', label: 'Ubicaciones', icon: MapPinned, description: 'Gestión de ubicaciones de clientes' },
    { id: 'clientes', label: 'Clientes', icon: Building2, description: 'Gestión de clientes y corrección de ubicaciones' }
  ];

  return (
    <nav id="app-navigation" className="bg-white border-b sticky top-[104px] z-40 shadow-sm">
      <div className="px-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            {tabs
              .filter(t => allowedTabs.length === 0 || allowedTabs.includes(t.id))
              .map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    title={tab.description}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        size={16}
                        className={`transition-transform duration-200 ${
                          isActive ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                      />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
          </div>

          {user && (
            <div className="flex items-center gap-3 py-2">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
              </div>
              <button
                onClick={onLogout}
                className="text-sm text-gray-600 hover:text-red-600 border px-2 py-1 rounded"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

