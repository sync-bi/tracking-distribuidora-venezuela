// src/components/Layout/Navigation.js
import React, { useState } from 'react';
import { Package, Truck, MapPin, Clipboard, Navigation as NavIcon, Radio, MapPinned, Building2, Menu, X, LogOut } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab, allowedTabs = [], user, onLogout }) => {
  const [menuAbierto, setMenuAbierto] = useState(false);

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

  const tabsFiltrados = tabs.filter(t => allowedTabs.length === 0 || allowedTabs.includes(t.id));
  const tabActual = tabs.find(t => t.id === activeTab);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMenuAbierto(false);
  };

  return (
    <nav id="app-navigation" className="bg-white border-b sticky top-[72px] md:top-[104px] z-40 shadow-sm">
      <div className="px-4 md:px-6">
        {/* Vista móvil */}
        <div className="md:hidden flex items-center justify-between py-2">
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="flex items-center gap-2 text-gray-700 bg-gray-100 px-3 py-2 rounded-lg"
          >
            {menuAbierto ? <X size={20} /> : <Menu size={20} />}
            {tabActual && (
              <span className="flex items-center gap-2">
                <tabActual.icon size={16} />
                {tabActual.label}
              </span>
            )}
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">{user.name}</span>
              <button
                onClick={onLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Menú móvil desplegable */}
        {menuAbierto && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-white border-b shadow-lg z-50">
            <div className="p-2 grid grid-cols-2 gap-2">
              {tabsFiltrados.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vista desktop */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex space-x-1 lg:space-x-4 overflow-x-auto">
            {tabsFiltrados.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group py-3 lg:py-4 px-2 lg:px-3 border-b-2 font-medium text-xs lg:text-sm transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  title={tab.description}
                >
                  <div className="flex items-center gap-1 lg:gap-2">
                    <Icon
                      size={16}
                      className={`transition-transform duration-200 ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`}
                    />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {user && (
            <div className="flex items-center gap-3 py-2">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
              </div>
              <button
                onClick={onLogout}
                className="text-sm text-gray-600 hover:text-red-600 border px-2 py-1 rounded flex items-center gap-1"
                title="Cerrar sesión"
              >
                <LogOut size={14} />
                <span className="hidden lg:inline">Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

