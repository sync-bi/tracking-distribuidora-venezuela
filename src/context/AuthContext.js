// src/context/AuthContext.js
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

// Usuarios de ejemplo (solo para desarrollo)
const MOCK_USERS = [
  { id: 1, name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Operador', email: 'op@example.com', password: 'op123', role: 'operador' },
  { id: 3, name: 'Despachador', email: 'disp@example.com', password: 'disp123', role: 'despachador' },
  { id: 4, name: 'Visor', email: 'visor@example.com', password: 'visor123', role: 'visor' },
  { id: 5, name: 'Conductor Demo', email: 'driver@example.com', password: 'driver123', role: 'conductor' }
];

const STORAGE_KEY = 'auth:user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async ({ email, password }) => {
    // Simulación de autenticación local
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    await new Promise(r => setTimeout(r, 300));
    if (!found) {
      throw new Error('Credenciales inválidas');
    }
    const safeUser = { id: found.id, name: found.name, email: found.email, role: found.role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
    return safeUser;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
