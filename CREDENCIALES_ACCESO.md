# Acceso al sistema de tracking

**Actualizado:** 18 de agosto de 2026

---

## Producción

Las cuentas las crea el administrador en **Firebase Authentication**, y el rol
se asigna en la colección `usuarios` de Firestore.

No existen usuarios genéricos ni contraseñas compartidas. Cada persona entra con
su propia cuenta, y así queda registrado quién hizo cada cosa.

Si no puedes entrar, pídele al administrador que revise tu cuenta en Firebase.

### Roles

| Rol | Qué puede hacer |
|---|---|
| `admin` | Todo, incluida la gestión de usuarios |
| `operador` | Toda la operación, sin gestionar usuarios |
| `despachador` | Armar despachos y asignar camiones |
| `conductor` | Su propia ruta y el registro de entregas |
| `vendedor` | Consultar los despachos de sus clientes |
| `visor` | Solo lectura |

---

## Desarrollo local

Cuando se trabaja en local **sin** configurar Firebase, la aplicación ofrece unas
cuentas de prueba para poder entrar. Están definidas en
`src/context/AuthContext.js` y la pantalla de acceso las muestra en la parte de
abajo.

Esas cuentas **no existen en producción**. El compilador las elimina del paquete
publicado, y la aplicación desplegada las rechaza aunque alguien las escriba.

Para trabajar contra el Firebase real, copia `.env.example` a `.env.local` y
rellena las claves. Con Firebase configurado, las cuentas de prueba no se usan.

---

## Qué pasa si falta la configuración de Firebase

En producción la aplicación **se niega a abrir** y muestra que faltan las
variables de entorno.

Es deliberado. Antes, si Firebase no respondía, la aplicación caía en las cuentas
de prueba y quedaba accesible con una contraseña conocida. Un despliegue mal
configurado debe fallar a la vista, no abrirse solo.

---

## Página de estado del proyecto

`/estado.html` muestra cifras del negocio y está aparte del acceso de la
aplicación. Se protege con la variable `ESTADO_TOKEN`: definida, la página solo
abre con `?t=EL_VALOR` en la URL.

---

## Consultas

Carlos Montero — SYNC BI — carlos.montero@syncbi.net
