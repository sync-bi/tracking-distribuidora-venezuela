// src/components/Layout/Navigation.js
import React from 'react';
import { Package, Truck, MapPin, Clipboard } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'pedidos',
      label: 'Pedidos',
      icon: Package,
      description: 'Gestión de pedidos y asignaciones'
    },
    {
      id: 'camiones',
      label: 'Camiones',
      icon: Truck,
      description: 'Seguimiento de vehículos'
    },
    {
      id: 'despachos',
      label: 'Despachos',
      icon: Clipboard,
      description: 'Centro de operaciones y rutas'
    },
    {
      id: 'mapa',
      label: 'Mapa',
      icon: MapPin,
      description: 'Vista geográfica en tiempo real'
    }
  ];

  return (
    <nav className="bg-white border-b">
      <div className="px-6">
        <div className="flex space-x-8">
          {tabs.map(tab => {
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
      </div>
    </nav>
  );
};

export default Navigation;