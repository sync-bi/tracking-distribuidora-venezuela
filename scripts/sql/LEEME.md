# Instalación en la base de datos — Tracking Sarego

Lo que se le entrega al administrador de base de datos del cliente.

## Archivo a ejecutar

**`SAREGO_Tracking_Instalacion.sql`** — es el único que hay que correr.

Implementa la sección *"Escritura al ERP — qué tablas crear"* del documento técnico
*Proceso de despacho con tracking en tiempo real* (17-08-2026). Las definiciones de
tabla son exactamente las de ese documento, para que no haya discrepancia entre lo
que se explicó y lo que se ejecuta.

| Sección | Qué hace |
|---|---|
| 1 | Verifica que sea la base correcta y haya permisos |
| 2–6 | Crea las 5 tablas del documento |
| 7 | Agrega 2 columnas a `zt_coordenada` (la tabla de ubicaciones, que ya existe) |
| 8 | Crea `zt_cliente_contacto` — adicional, ver abajo |
| 9 | Crea el usuario y otorga permisos tabla por tabla |
| 10 | Muestra el resultado para que el DBA lo verifique |

Es **idempotente**: se puede correr varias veces sin causar daño. Lo que ya existe se
detecta y no se toca.

## Antes de ejecutar

1. **Cambiar la contraseña** en la sección 9. Está marcada `CAMBIAR_ESTA_CLAVE_ANTES_DE_EJECUTAR`.
2. Enviarla a SYNC BI por un canal seguro — no por correo ni WhatsApp.
3. Decidir si autorizan la sección 7 (las dos columnas en `zt_coordenada`). Es la única
   tabla existente que el script toca, y solo para agregar columnas. Si prefieren que no,
   se puede omitir esa sección y el sistema escribe en una tabla aparte.

Se ejecuta desde SQL Server Management Studio o `sqlcmd`, porque usa separadores `GO`.

## Sobre los permisos

El usuario `sarego_tracking` recibe permisos **tabla por tabla, nunca sobre la base completa**:

- **Lectura** sobre las 9 tablas del ERP que la aplicación consulta. Ninguna más.
- **Escritura** sobre las tablas `zt_` del tracking. Ninguna más.

No se le da `db_datareader` ni `db_datawriter`: esos roles darían acceso a *todas* las
tablas de Profit Plus, incluidas contabilidad, nómina y cuentas por cobrar. No puede crear,
alterar ni borrar tablas, y cualquier consulta a una tabla no listada se la niega el motor.

La sección 10 imprime los permisos efectivos para que el DBA lo compruebe con sus propios ojos.

## Los otros archivos

- **`00_diagnostico.sql`** — solo consultas, no modifica nada. Útil para revisar el estado
  de la base antes o después de instalar.
- **`99_recuperar_coordenadas_de_csv.sql`** — **no hace falta.** Herramienta de respaldo por
  si alguna vez se carga a la base un CSV cuyas coordenadas pasaron por Excel.

## Qué se verificó antes de escribir esto (18-08-2026)

Contra la base real, para no proponer cosas ya hechas:

- `zt_coordenada` ya existe, con llave primaria y sin duplicados. 121 clientes con ubicación
  y los valores están correctos. Solo le faltan las dos columnas de trazabilidad.
- Ninguna de las 5 tablas del documento existe todavía.
- `saCliente` no tiene ninguna columna de contacto secundario — se comprobaron las ocho
  variantes posibles. Tampoco `persona_con`, así que hoy el contacto principal también llega
  vacío al sistema. De ahí la tabla adicional de la sección 8, que **no está** en el documento
  del 17 de agosto.
- La cuenta que usa hoy la aplicación no puede crear tablas ni usuarios. Por eso hace falta
  el DBA y un usuario nuevo.
- El documento listaba 7 tablas del ERP para lectura; el script otorga 9. Faltaban
  `saPedidoVenta` y `saPedidoVentaReng`, que la aplicación usa en su consulta de respaldo.

Los scripts pasaron validación sintáctica contra el SQL Server del cliente con `SET PARSEONLY`,
que analiza sin ejecutar. Las secciones de creación no se ejecutaron: eso lo decide su DBA.

## Consultas

Carlos Montero — SYNC BI — carlos.montero@syncbi.net
