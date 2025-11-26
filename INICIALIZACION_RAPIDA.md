# 🚀 Inicialización Rápida de Firebase

## ✅ Pre-requisitos

Asegúrate de haber completado:
- [x] Proyecto Firebase creado
- [x] Authentication habilitado con 3 usuarios (admin, operador, conductor)
- [x] Firestore Database habilitado
- [x] Colección `usuarios` creada con los 3 documentos
- [x] `.env.local` actualizado con las credenciales
- [x] Servidor reiniciado (`npm start`)

---

## 📦 Crear Camiones y Conductores Automáticamente

### Método 1: Desde la Consola del Navegador (Más Fácil)

1. **Abre tu aplicación** en el navegador: `http://localhost:3000`

2. **Inicia sesión** con:
   ```
   Email: admin@sarego.com
   Password: Admin123!
   ```

3. **Abre la consola del navegador** (F12 o Click derecho → Inspeccionar → Console)

4. **Ejecuta este comando**:
   ```javascript
   inicializarFirebase()
   ```

5. **Espera** a ver estos mensajes:
   ```
   🚀 Iniciando migración a Firestore...
   ⏳ Este proceso puede tomar unos segundos...
   📦 Creando camiones en Firestore...
   ✅ Camiones creados: CAM101, CAM102, CAM103
   👥 Creando conductores en Firestore...
   ✅ Conductores creados
   🎉 ¡Inicialización completada exitosamente!
   ```

6. **Verifica en Firebase Console**:
   - Ve a Firestore Database
   - Deberías ver las colecciones:
     - `camiones` (3 documentos)
     - `conductores` (3 documentos)

---

### Método 2: Botón en la Interfaz (Opcional)

Si prefieres un botón en la app, puedes agregar esto temporalmente:

En `src/App.js`, después de la línea 36 (dentro del componente App):

```javascript
// TEMPORAL - Solo para inicialización
const [mostrarBotonInit, setMostrarBotonInit] = useState(true);

const handleInicializar = async () => {
  const { inicializarDatos } = await import('./utils/inicializarFirebase');
  const exito = await inicializarDatos();
  if (exito) {
    alert('✅ Datos inicializados correctamente');
    setMostrarBotonInit(false);
  } else {
    alert('❌ Error al inicializar. Revisa la consola.');
  }
};
```

Y en el JSX (antes del `<Header>`):

```jsx
{mostrarBotonInit && user?.role === 'admin' && (
  <div className="bg-yellow-100 p-4 text-center">
    <button
      onClick={handleInicializar}
      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
    >
      🚀 Inicializar Camiones y Conductores en Firebase
    </button>
  </div>
)}
```

---

## 🔍 Verificar que Todo Funciona

### Checklist:

1. **Firestore Console:**
   - [ ] Colección `usuarios` tiene 3 documentos
   - [ ] Colección `camiones` tiene 3 documentos (CAM101, CAM102, CAM103)
   - [ ] Colección `conductores` tiene 3 documentos

2. **Tu Aplicación:**
   - [ ] Consola del navegador NO muestra errores de Firebase
   - [ ] Ves los mensajes: "✅ Firestore inicializado correctamente"
   - [ ] Puedes hacer login

---

## 🎯 Siguiente Paso: Importar Pedidos

Una vez que tengas camiones y conductores, puedes:

### Opción A: Importar desde Excel
1. Ve a la pestaña **"Pedidos"**
2. Click en **"Importar Pedidos"**
3. Selecciona tu archivo `Pedidos.xlsx`
4. Los pedidos se crearán automáticamente en Firestore

### Opción B: Crear Pedidos Manualmente
1. Ve a la pestaña **"Pedidos"**
2. Click en **"Nuevo Pedido"**
3. Llena el formulario
4. Click **"Guardar"**
5. Verifica en Firebase Console que aparece en la colección `pedidos`

---

## 🆘 Troubleshooting

### Error: "inicializarFirebase is not defined"
**Solución:**
- Asegúrate de haber reiniciado el servidor después de actualizar `index.js`
- Refresca la página (Ctrl + F5)

### Error: "Permission denied"
**Solución:**
- Verifica que estás logueado como admin
- Ve a Firebase Console → Firestore → Rules
- Verifica que las reglas están publicadas

### Error: "Firebase not configured"
**Solución:**
- Verifica que `.env.local` tiene todas las variables
- Reinicia el servidor (`Ctrl + C` → `npm start`)
- Limpia caché del navegador

### Los camiones no aparecen en la app
**Solución:**
- Verifica en Firebase Console que los documentos existen
- Refresca la página
- Verifica la consola del navegador para errores

---

## 📊 Estructura Final en Firestore

Después de la inicialización, tendrás:

```
📦 Firestore Database
│
├── 📁 usuarios (3 docs)
│   ├── 📄 [UID-admin]
│   ├── 📄 [UID-operador]
│   └── 📄 [UID-conductor]
│
├── 📁 camiones (3 docs)
│   ├── 📄 CAM101
│   │   ├── id: "CAM101"
│   │   ├── placa: "VAA-101"
│   │   ├── capacidad: "3000 kg"
│   │   ├── estado: "Disponible"
│   │   ├── ubicacionActual: { lat: 10.4806, lng: -66.9036 }
│   │   └── ...
│   ├── 📄 CAM102 (Valencia)
│   └── 📄 CAM103 (Maracaibo)
│
└── 📁 conductores (3 docs)
    ├── 📄 COND001
    ├── 📄 COND002
    └── 📄 COND003
```

---

## ✅ ¡Listo!

Una vez que veas el mensaje de éxito, tu sistema está completamente configurado con Firebase y listo para usar en producción.

**Siguiente paso:** Importa tus pedidos reales y empieza a usar el sistema.
