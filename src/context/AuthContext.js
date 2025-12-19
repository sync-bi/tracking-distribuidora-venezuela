// src/context/AuthContext.js
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Verificar si Firebase está configurado
const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain
  );
};

// Inicializar Firebase Auth
let auth = null;
let db = null;

if (isFirebaseConfigured()) {
  try {
    const app = initializeApp(firebaseConfig, 'auth-app');
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Firebase Auth inicializado correctamente');
  } catch (error) {
    console.warn('⚠️ Error al inicializar Firebase Auth:', error.message);
  }
}

// Usuarios MOCK para desarrollo (fallback si Firebase no está configurado)
const MOCK_USERS = [
  { id: 1, name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin', uid: 'mock-admin' },
  { id: 2, name: 'Operador', email: 'op@example.com', password: 'op123', role: 'operador', uid: 'mock-operador' },
  { id: 3, name: 'Despachador', email: 'disp@example.com', password: 'disp123', role: 'despachador', uid: 'mock-despachador' },
  { id: 4, name: 'Visor', email: 'visor@example.com', password: 'visor123', role: 'visor', uid: 'mock-visor' },
  { id: 5, name: 'Conductor Demo', email: 'driver@example.com', password: 'driver123', role: 'conductor', uid: 'mock-conductor' },
  { id: 6, name: 'Juan Pérez', email: 'vendedor@example.com', password: 'vendedor123', role: 'vendedor', uid: 'mock-vendedor' }
];

const STORAGE_KEY = 'auth:user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listener de autenticación de Firebase
  useEffect(() => {
    if (!auth) {
      // Modo MOCK: cargar de localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch (_) {
        // ignore
      } finally {
        setLoading(false);
      }
      return;
    }

    // Modo Firebase: escuchar cambios de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Obtener datos adicionales del usuario desde Firestore
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const safeUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.nombre || firebaseUser.email,
              role: userData.rol || 'visor',
              activo: userData.activo !== false
            };

            setUser(safeUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
            console.log('✅ Usuario autenticado:', safeUser.email);
          } else {
            console.warn('⚠️ Usuario no existe en Firestore. Creando perfil básico...');
            const safeUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.email,
              role: 'visor',
              activo: true
            };
            setUser(safeUser);
          }
        } catch (error) {
          console.error('❌ Error al obtener datos del usuario:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
    // PRIORIDAD 1: Intentar con usuarios MOCK primero
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      console.warn('⚠️ Usando autenticación MOCK');
      await new Promise(r => setTimeout(r, 300));
      const safeUser = {
        uid: found.uid,
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      setUser(safeUser);
      return safeUser;
    }

    // PRIORIDAD 2: Si no está en MOCK y Firebase está configurado, intentar con Firebase
    if (!auth) {
      // Si no hay Firebase configurado y tampoco está en MOCK, error
      throw new Error('Credenciales inválidas');
    }

    // Modo Firebase
    try {
      console.log('🔐 Intentando login con Firebase Auth...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Obtener rol desde Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado en la base de datos. Contacta al administrador.');
      }

      const userData = userDoc.data();

      if (userData.activo === false) {
        await signOut(auth);
        throw new Error('Usuario desactivado. Contacta al administrador.');
      }

      const safeUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: userData.nombre || firebaseUser.email,
        role: userData.rol || 'visor',
        activo: userData.activo !== false
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      setUser(safeUser);

      console.log('✅ Login exitoso:', safeUser.email);
      return safeUser;
    } catch (error) {
      console.error('❌ Error en login:', error);

      // Mensajes de error más amigables
      let errorMessage = 'Error al iniciar sesión';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        console.log('✅ Logout exitoso');
      } catch (error) {
        console.error('❌ Error en logout:', error);
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    isFirebaseAuth: !!auth
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
