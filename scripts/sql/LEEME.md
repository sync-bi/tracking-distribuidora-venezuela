# Tablas a crear en Profit Plus — Tracking Sarego

Scripts para la base de datos del ERP. Preparados por SYNC BI, verificados el
18-08-2026 contra la base real antes de entregarlos.

## Quién debe correrlos

**El DBA, con una cuenta `db_owner` o `sysadmin`.**

La cuenta que usa la aplicación (`ossa`) no tiene permiso para crear ni alterar
tablas — se comprobó. Por eso cada script termina con un `GRANT` que le da a esa
cuenta los permisos mínimos que necesita sobre la tabla nueva: leer, insertar y
actualizar. Nada más.

Si en su instalación la aplicación usa otro usuario, cambien el nombre en esos
`GRANT` antes de ejecutar.

## Orden de ejecución

| # | Archivo | Qué hace | ¿Modifica datos? |
|---|---------|----------|------------------|
| 00 | `00_diagnostico.sql` | Revisa el estado actual. Solo consultas. | No |
| 01 | `01_zt_coordenada.sql` | Completa la tabla de ubicaciones que ya existe | Sí, dos registros |
| 02 | `02_zt_cliente_contacto.sql` | Crea la tabla del segundo contacto | Crea tabla |
| 03 | `03_zt_entrega.sql` | Crea el buzón de resultados de entrega | Crea tabla |
| 99 | `99_recuperar_coordenadas_de_csv.sql` | **No hace falta.** Herramienta de respaldo | No |

Los tres primeros son **idempotentes**: se pueden correr varias veces sin causar
daño. Si algo ya existe, lo detectan y no lo tocan.

Llevan `GO` entre lotes, así que conviene ejecutarlos desde SQL Server Management
Studio o con `sqlcmd`.

## Qué se encontró en la base (18-08-2026)

Esto es lo que se midió antes de escribir los scripts, para no proponer cosas que
ya están hechas:

- **`zt_coordenada` ya existe** con llave primaria y sin duplicados. Tiene 121
  clientes con ubicación, y los valores están correctos. Solo le faltan las
  columnas para registrar de dónde salió cada coordenada.
- **Dos registros tienen la latitud y la longitud invertidas.** El script 01 los
  corrige. Se detectan sin ambigüedad porque en Venezuela la latitud es positiva
  y la longitud negativa.
- **`saCliente` no tiene ningún campo de contacto secundario.** Se buscaron las
  ocho variantes posibles y no existe ninguna. Tampoco `persona_con`, así que hoy
  el contacto principal también llega vacío al sistema. Por eso hace falta el
  script 02.
- **`zt_cliente_contacto` y `zt_entrega` no existen.** Hay que crearlas.
- **No hay daño de formato en las coordenadas.** Se había detectado un problema
  con valores tipo `10.971.725.066.821.500`, pero eso lo produjo Excel al abrir
  un CSV exportado. En la base los valores están sanos. El script 99 queda solo
  como herramienta por si alguna vez se carga un archivo dañado.

## Por qué las tablas nuevas llevan el prefijo `zt_`

Son tablas nuestras, no de Profit Plus. Eso es deliberado:

- Una actualización del ERP puede recrear sus propias tablas y perder cualquier
  columna que les hayamos agregado, junto con los datos capturados.
- Las validaciones y pantallas de Profit no conocen columnas ajenas, así que el
  dato no se podría mantener desde el propio ERP.

Ninguno de estos scripts modifica una tabla nativa de Profit Plus. No tocan
inventario, cuentas por cobrar ni documentos fiscales.

## Sobre `zt_entrega`: es un buzón, no una intervención

La conversación sobre "escribir al ERP" quedó frenada, con razón, porque escribir
dentro de las tablas de Profit es delicado. **Esta propuesta no hace eso.**

La aplicación escribiría únicamente en `zt_entrega`, que es nueva y nuestra:

- No modifica ninguna tabla de Profit Plus.
- No altera inventario, cuentas por cobrar ni documentos fiscales.
- Si mañana deciden apagarla, se deja de escribir y no pasa nada más.
- Ustedes deciden, con calma, si algún proceso de Profit la lee o no.

La decisión es reversible en cualquier momento, y ahí está lo que la hace segura.

## El beneficio concreto: llenar las ubicaciones que faltan

Hoy 92 % de los clientes no tiene ubicación en el mapa. Capturar cuatro mil
direcciones a mano no es viable, y se descartó geocodificar por dirección: se
probó contra veinte direcciones reales del ERP y el servicio devolvió ciudad o
estado en las veinte, nunca la calle. Llenar la base con centros de ciudad sería
peor que no tener nada, porque mandaría a los conductores a puntos falsos.

La fuente confiable es el propio reparto. Al entregar, el teléfono del conductor
registra la posición exacta de la puerta del cliente — mejor que cualquier
geocodificador, porque es el sitio real donde se descargó la mercancía.

Con las columnas del script 01 y la tabla del script 03, **cada entrega ubica un
cliente más**. La base se corrige sola a medida que se reparte, sin que nadie se
siente a capturar direcciones.

## Consultas

Carlos Montero — SYNC BI — carlos.montero@syncbi.net
