/* =============================================================================
   99 - Recuperar coordenadas dañadas por Excel  (NO HACE FALTA HOY)
   -----------------------------------------------------------------------------
   *** NO ES NECESARIO CORRER ESTE SCRIPT. Se deja como herramienta. ***

   Verificado el 18-08-2026 contra la base: las 121 coordenadas de
   zt_coordenada estan SANAS. Ninguna presenta el daño de formato que este
   script repara. No hay nada que arreglar.

   Se conserva por dos razones:
     1. Si algun dia se carga a la base un CSV que paso por Excel, el daño
        aparecera y este script lo revierte.
     2. El archivo clientes_actualizados_2026-01-30.csv tiene 318 clientes con
        coordenada, mientras la base solo tiene 121. Si se decide cargar ese
        archivo, sus valores vienen dañados y hay que pasarlos por esta logica
        antes de insertarlos.

   Para el caso normal, ignoren este archivo.

   QUE PASO
   --------
   Las coordenadas guardadas como texto pasaron por Excel y volvieron con el
   separador decimal convertido en separador de miles:

       valor real     10,971725     ->  guardado  '10.971.725.066.821.500'
       valor real    -63,820380     ->  guardado  '-6.382.038.029.018.570'

   La aplicacion las lee con parseFloat, que corta en el segundo punto y obtiene
   -6,382 en vez de -63,820: el cliente aparece a 6.259 km al este, en el
   oceano Atlantico.

   COMO SE RECUPERA
   ----------------
   Los digitos no se perdieron, solo el punto decimal. Se quitan todos los
   separadores y se vuelve a colocar el punto en la unica posicion que deja la
   coordenada dentro de Venezuela (latitud 0,60 a 12,30 / longitud -73,40 a
   -59,70). La longitud no tiene ambiguedad: siempre lleva dos enteros.

   Se valido contra geografia real antes de escribir este script:
       La Asuncion (Margarita)   10,971725 / -63,820380   correcto
       Maracaibo                 10,685266 / -71,601845   correcto
       La Guaira                 10,615263 / -66,842474   correcto

   LIMITACION CONOCIDA
   -------------------
   En latitud, un valor como 1,09 y otro como 10,9 producen los mismos digitos.
   Se prefiere la lectura de dos enteros, porque la Venezuela poblada esta entre
   7 y 12 de latitud. Un cliente real en el extremo sur de Amazonas se
   interpretaria mal. Por eso la FASE 1 deja todo para revision y no toca nada.

   ESTE SCRIPT NO MODIFICA DATOS. Deja una tabla de propuesta para que la
   revisen. La escritura esta en la FASE 2, comentada al final a proposito.
   ============================================================================= */

SET NOCOUNT ON;
GO

/* =============================== FASE 1 =====================================
   Construir la propuesta de correccion. Solo lectura sobre zt_coordenada.
   ========================================================================== */

IF OBJECT_ID('dbo.zt_coordenada_propuesta', 'U') IS NOT NULL
    DROP TABLE dbo.zt_coordenada_propuesta;
GO

WITH crudo AS (
    SELECT
        RTRIM(z.co_cli) AS co_cli,
        CAST(z.latitud   AS VARCHAR(60)) AS lat_txt,
        CAST(z.longuitud AS VARCHAR(60)) AS lng_txt
    FROM dbo.zt_coordenada z
),
limpio AS (
    SELECT
        co_cli, lat_txt, lng_txt,
        -- Signo original (la latitud de Venezuela es positiva; la longitud negativa)
        CASE WHEN CHARINDEX('-', lat_txt) > 0 THEN -1 ELSE 1 END AS lat_signo,
        CASE WHEN CHARINDEX('-', lng_txt) > 0 THEN -1 ELSE 1 END AS lng_signo,
        -- Solo los digitos: se quitan puntos, comas, signos y espacios
        REPLACE(REPLACE(REPLACE(REPLACE(lat_txt, '.', ''), ',', ''), '-', ''), ' ', '') AS lat_d,
        REPLACE(REPLACE(REPLACE(REPLACE(lng_txt, '.', ''), ',', ''), '-', ''), ' ', '') AS lng_d
    FROM crudo
),
sin_ceros AS (
    SELECT
        co_cli, lat_txt, lng_txt, lat_signo, lng_signo,
        -- Quitar ceros a la izquierda sin borrar el numero entero
        CASE WHEN PATINDEX('%[1-9]%', lat_d) > 0
             THEN SUBSTRING(lat_d, PATINDEX('%[1-9]%', lat_d), 60) ELSE '' END AS lat_d,
        CASE WHEN PATINDEX('%[1-9]%', lng_d) > 0
             THEN SUBSTRING(lng_d, PATINDEX('%[1-9]%', lng_d), 60) ELSE '' END AS lng_d
    FROM limpio
),
candidatos AS (
    SELECT
        co_cli, lat_txt, lng_txt,
        -- Latitud: se prueban dos enteros y, si no cae en rango, uno
        lat_signo * TRY_CAST(LEFT(lat_d, 2) + '.' + SUBSTRING(lat_d, 3, 6) AS DECIMAL(9,6)) AS lat_k2,
        lat_signo * TRY_CAST(LEFT(lat_d, 1) + '.' + SUBSTRING(lat_d, 2, 6) AS DECIMAL(9,6)) AS lat_k1,
        -- Longitud: en Venezuela siempre lleva dos enteros
        lng_signo * TRY_CAST(LEFT(lng_d, 2) + '.' + SUBSTRING(lng_d, 3, 6) AS DECIMAL(9,6)) AS lng_k2,
        lng_signo * TRY_CAST(LEFT(lng_d, 1) + '.' + SUBSTRING(lng_d, 2, 6) AS DECIMAL(9,6)) AS lng_k1
    FROM sin_ceros
    WHERE LEN(lat_d) > 0 AND LEN(lng_d) > 0
),
elegido AS (
    SELECT
        co_cli, lat_txt, lng_txt, nota_amb =
            CASE WHEN lat_k2 BETWEEN 0.60 AND 12.30
                  AND lat_k1 BETWEEN 0.60 AND 12.30
                 THEN 'lat ambigua: se tomo la de dos enteros' END,
        lat_ok = CASE WHEN lat_k2 BETWEEN  0.60 AND  12.30 THEN lat_k2
                      WHEN lat_k1 BETWEEN  0.60 AND  12.30 THEN lat_k1 END,
        lng_ok = CASE WHEN lng_k2 BETWEEN -73.40 AND -59.70 THEN lng_k2
                      WHEN lng_k1 BETWEEN -73.40 AND -59.70 THEN lng_k1 END
    FROM candidatos
)
SELECT
    co_cli,
    lat_txt   AS latitud_original,
    lng_txt   AS longitud_original,
    lat_ok    AS latitud_propuesta,
    lng_ok    AS longitud_propuesta,
    CASE WHEN lat_ok IS NOT NULL AND lng_ok IS NOT NULL
         THEN 'RECUPERABLE' ELSE 'REVISAR A MANO' END AS veredicto,
    nota_amb  AS nota
INTO dbo.zt_coordenada_propuesta
FROM elegido;
GO

/* --- Resumen de la propuesta ---------------------------------------------- */
SELECT
    veredicto,
    COUNT(*) AS clientes
FROM dbo.zt_coordenada_propuesta
GROUP BY veredicto
ORDER BY veredicto;
GO

/* --- Muestra para revisar con los propios ojos ----------------------------
   Forma rapida de comprobar: copiar "latitud, longitud" en el buscador de
   Google Maps y ver si cae en la ciudad que dice la ficha del cliente.
-------------------------------------------------------------------------- */
SELECT TOP 25
    p.co_cli,
    RTRIM(cli.cli_des)  AS cliente,
    RTRIM(cli.ciudad)   AS ciudad,
    p.latitud_original,
    p.longitud_original,
    p.latitud_propuesta,
    p.longitud_propuesta,
    p.nota
FROM dbo.zt_coordenada_propuesta p
LEFT JOIN saCliente cli ON RTRIM(cli.co_cli) = p.co_cli
WHERE p.veredicto = 'RECUPERABLE'
ORDER BY cli.ciudad, cli.cli_des;
GO

/* =============================== FASE 2 =====================================
   APLICAR LA CORRECCION.

   Esta comentada a proposito. Antes de descomentarla:

     1. Revisen la muestra de arriba y confirmen que las coordenadas propuestas
        caen donde corresponde.
     2. Saquen respaldo de la tabla:
            SELECT * INTO dbo.zt_coordenada_respaldo FROM dbo.zt_coordenada;
     3. Recuerden que zt_coordenada debe tener las columnas en DECIMAL(9,6)
        (script 01). Si siguen en texto, el daño se repetira en el proximo Excel.

   Solo entonces quiten los comentarios y ejecuten.
   ========================================================================== */

/*
BEGIN TRANSACTION;

    UPDATE z
       SET z.latitud   = p.latitud_propuesta,
           z.longuitud = p.longitud_propuesta
    FROM dbo.zt_coordenada z
    INNER JOIN dbo.zt_coordenada_propuesta p
            ON p.co_cli = RTRIM(z.co_cli)
    WHERE p.veredicto = 'RECUPERABLE';

    PRINT CONCAT(@@ROWCOUNT, ' coordenada(s) corregida(s)');

    -- Verificar antes de confirmar: todo debe quedar dentro de Venezuela
    IF EXISTS (
        SELECT 1 FROM dbo.zt_coordenada
        WHERE latitud IS NOT NULL
          AND NOT (latitud   BETWEEN  0.60 AND  12.30
               AND longuitud BETWEEN -73.40 AND -59.70)
    )
    BEGIN
        PRINT 'Quedaron coordenadas fuera de rango. Se deshace el cambio.';
        ROLLBACK TRANSACTION;
    END
    ELSE
    BEGIN
        PRINT 'Verificacion correcta. Se confirma el cambio.';
        COMMIT TRANSACTION;
    END
*/
