/* =============================================================================
   00 — DIAGNÓSTICO (solo lectura, no crea ni modifica nada)
   -----------------------------------------------------------------------------
   Correr ESTO PRIMERO. Responde las tres preguntas abiertas del proyecto y
   define si hacen falta los scripts 01 a 03, y con qué contenido.

   Seguro de ejecutar en producción: son SELECT.
   ============================================================================= */

/* ---------------------------------------------------------------------------
   1. ¿Existe zt_coordenada y cómo están definidas sus columnas?
   ---------------------------------------------------------------------------
   Lo que buscamos: el TIPO de dato de latitud/longuitud.
   Si son VARCHAR/CHAR, es la causa del problema de formato que detectamos
   (un valor como '10.971.725.066.821.500' en vez de 10.971725).
   Si son DECIMAL/FLOAT, el dato está sano y el problema era del Excel.
--------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.zt_coordenada', 'U') IS NULL
BEGIN
    SELECT 'zt_coordenada NO EXISTE - hay que crearla (script 01)' AS resultado;
END
ELSE
BEGIN
    SELECT
        c.COLUMN_NAME                AS columna,
        c.DATA_TYPE                  AS tipo,
        c.CHARACTER_MAXIMUM_LENGTH   AS largo_texto,
        c.NUMERIC_PRECISION          AS precision_num,
        c.NUMERIC_SCALE              AS decimales,
        c.IS_NULLABLE                AS admite_nulos
    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_NAME = 'zt_coordenada'
    ORDER BY c.ORDINAL_POSITION;
END
GO

/* ---------------------------------------------------------------------------
   2. ¿Cuántos clientes tienen coordenada, y están sanas?
   ---------------------------------------------------------------------------
   Venezuela cae en latitud 0,6 a 12,3 y longitud -73,4 a -59,7.
   Cualquier valor fuera de ese rango es dato corrupto, no una ubicación.
--------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.zt_coordenada', 'U') IS NOT NULL
BEGIN
    SELECT
        COUNT(*)                                                   AS filas_totales,
        SUM(CASE WHEN TRY_CAST(coord.latitud   AS DECIMAL(18,10)) IS NULL
                   OR TRY_CAST(coord.longuitud AS DECIMAL(18,10)) IS NULL
                 THEN 1 ELSE 0 END)                                AS no_convertibles,
        SUM(CASE WHEN TRY_CAST(coord.latitud   AS DECIMAL(18,10)) BETWEEN 0.6 AND 12.3
                  AND TRY_CAST(coord.longuitud AS DECIMAL(18,10)) BETWEEN -73.4 AND -59.7
                 THEN 1 ELSE 0 END)                                AS dentro_de_venezuela,
        SUM(CASE WHEN TRY_CAST(coord.latitud   AS DECIMAL(18,10)) IS NOT NULL
                  AND NOT (TRY_CAST(coord.latitud   AS DECIMAL(18,10)) BETWEEN 0.6 AND 12.3
                       AND TRY_CAST(coord.longuitud AS DECIMAL(18,10)) BETWEEN -73.4 AND -59.7)
                 THEN 1 ELSE 0 END)                                AS fuera_de_rango
    FROM dbo.zt_coordenada coord;

    -- Muestra cruda: ver el formato con los propios ojos
    SELECT TOP 15
        RTRIM(coord.co_cli) AS co_cli,
        coord.latitud       AS latitud_cruda,
        coord.longuitud     AS longitud_cruda
    FROM dbo.zt_coordenada coord
    ORDER BY coord.co_cli;
END
GO

/* ---------------------------------------------------------------------------
   3. ¿Cuántos clientes UBICABLES tienen despachos activos?
   ---------------------------------------------------------------------------
   Este es el número que decide si se puede arrancar con un piloto parcial
   sin esperar a que se corrijan los 4.000 clientes.
   Si salen decenas de clientes concentrados en pocas ciudades, hay piloto.
--------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.zt_coordenada', 'U') IS NULL
BEGIN
    PRINT 'Saltando punto 3: zt_coordenada no existe todavia.';
END
ELSE
BEGIN
    DECLARE @desde DATE = DATEADD(DAY, -90, CAST(GETDATE() AS DATE));

;WITH ubicables AS (
    SELECT DISTINCT RTRIM(coord.co_cli) AS co_cli
    FROM dbo.zt_coordenada coord
    WHERE TRY_CAST(coord.latitud   AS DECIMAL(18,10)) BETWEEN 0.6 AND 12.3
      AND TRY_CAST(coord.longuitud AS DECIMAL(18,10)) BETWEEN -73.4 AND -59.7
),
despachados AS (
    SELECT RTRIM(co_cli) AS co_cli, fec_emis FROM saNotaEntregaVenta
    WHERE anulado = 0 AND fec_emis >= @desde
    UNION ALL
    SELECT RTRIM(co_cli) AS co_cli, fec_emis FROM saFacturaVenta
    WHERE anulado = 0 AND fec_emis >= @desde
)
SELECT
    RTRIM(cli.ciudad)               AS ciudad,
    COUNT(DISTINCT d.co_cli)        AS clientes_ubicables_con_despacho,
    COUNT(*)                        AS documentos_ultimos_90_dias
FROM despachados d
INNER JOIN ubicables u  ON u.co_cli = d.co_cli
LEFT  JOIN saCliente cli ON RTRIM(cli.co_cli) = d.co_cli
GROUP BY RTRIM(cli.ciudad)
HAVING COUNT(DISTINCT d.co_cli) > 0
ORDER BY clientes_ubicables_con_despacho DESC;
END
GO

/* ---------------------------------------------------------------------------
   4. ¿Se duplican los despachos al cruzar notas con facturas?
   ---------------------------------------------------------------------------
   Una nota facturada en varias facturas parciales aparece repetida en el
   tablero. Si esta consulta devuelve filas, hay que corregir el cruce.
--------------------------------------------------------------------------- */
SELECT TOP 20
    RTRIM(fvr.num_doc)                  AS nota_de_entrega,
    COUNT(DISTINCT RTRIM(fvr.doc_num))  AS veces_facturada
FROM saFacturaVentaReng fvr
WHERE fvr.num_doc IS NOT NULL
  AND LTRIM(RTRIM(fvr.num_doc)) <> ''
GROUP BY RTRIM(fvr.num_doc)
HAVING COUNT(DISTINCT RTRIM(fvr.doc_num)) > 1
ORDER BY veces_facturada DESC;
GO

/* ---------------------------------------------------------------------------
   5. ¿Existe alguna columna de contacto secundario en saCliente?
   ---------------------------------------------------------------------------
   La app las busca por nombre y se adapta a la que encuentre. Si no aparece
   ninguna, hace falta el script 02.
--------------------------------------------------------------------------- */
SELECT COLUMN_NAME AS columna, DATA_TYPE AS tipo, CHARACTER_MAXIMUM_LENGTH AS largo
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'saCliente'
  AND (
        LOWER(COLUMN_NAME) IN ('contacto2','contac2','contacto_2','persona_contacto2',
                               'representante2','telefonos2','telefono2','telef2',
                               'persona_con','contacto','persona_contacto','representante',
                               'dir_ent2')
      )
ORDER BY COLUMN_NAME;
GO
