/* =============================================================================
   01 - zt_coordenada : completar la tabla de ubicaciones
   -----------------------------------------------------------------------------
   ESTA TABLA YA EXISTE. Verificado el 18-08-2026 contra la base:

       co_cli      char(16)        con llave primaria, sin duplicados
       longuitud   nvarchar(max)
       latitud     nvarchar(max)

       121 filas, todas convertibles a numero. 119 caen dentro de Venezuela.

   Los datos estan SANOS. El problema de formato que veniamos investigando
   (valores tipo '10.971.725.066.821.500') NO esta en la base: lo introdujo
   Excel al abrir un CSV exportado. No hay nada que reparar aqui.

   Este script hace dos cosas, ambas seguras:
     A. Agrega las columnas de trazabilidad que necesita el aprendizaje de
        coordenadas por GPS. Sin ellas no se puede distinguir una ubicacion
        capturada por el conductor de una escrita a mano, ni saber si es
        confiable.
     B. Corrige dos registros que tienen la latitud y la longitud invertidas.

   NO cambia el tipo de las columnas. Esa mejora esta en el script 05 y requiere
   coordinacion con nosotros porque toca codigo.

   QUIEN LO CORRE: el DBA, con una cuenta db_owner o sysadmin.
   La cuenta que usa la aplicacion (ossa) NO tiene permiso para crear ni
   alterar tablas; se verifico. Ver el GRANT al final.

   Idempotente: se puede correr varias veces sin daño.
   ============================================================================= */

SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.zt_coordenada', 'U') IS NULL
BEGIN
    RAISERROR('zt_coordenada no existe en esta base. Revisen que estan conectados a la base correcta antes de continuar.', 16, 1);
END
GO

/* ===========================================================================
   PARTE A - Columnas de trazabilidad para el aprendizaje por GPS
   ---------------------------------------------------------------------------
   POR QUE HACEN FALTA
   El 92 % de los clientes no tiene ubicacion, y capturar 4.000 direcciones a
   mano no es viable. La solucion acordada es que el sistema aprenda: al
   entregar, el telefono del conductor registra la posicion exacta de la puerta
   del cliente. Esa coordenada es mejor que cualquier geocodificador.

   Pero para poder confiar en ella hay que saber DE DONDE SALIO y CON QUE
   EXACTITUD. Sin estas columnas, una ubicacion aprendida con un GPS de mala
   señal pisaria una direccion verificada a mano, y nadie podria darse cuenta.
=========================================================================== */

IF COL_LENGTH('dbo.zt_coordenada', 'origen') IS NULL
BEGIN
    ALTER TABLE dbo.zt_coordenada
        ADD origen VARCHAR(20) NULL;
    PRINT 'Columna origen agregada.';
END
GO

-- Se agrega el valor por defecto aparte para que la tabla existente no se
-- bloquee reescribiendo las 121 filas.
IF COL_LENGTH('dbo.zt_coordenada', 'origen') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.default_constraints
                   WHERE name = 'DF_zt_coordenada_origen')
BEGIN
    ALTER TABLE dbo.zt_coordenada
        ADD CONSTRAINT DF_zt_coordenada_origen DEFAULT ('erp') FOR origen;
    PRINT 'Valor por defecto de origen agregado.';
END
GO

IF COL_LENGTH('dbo.zt_coordenada', 'precision_m') IS NULL
BEGIN
    -- Exactitud del GPS en metros. La aplicacion descarta las capturas de mas
    -- de 100 m, porque a esa distancia el punto puede caer en otra cuadra.
    ALTER TABLE dbo.zt_coordenada ADD precision_m INT NULL;
    PRINT 'Columna precision_m agregada.';
END
GO

IF COL_LENGTH('dbo.zt_coordenada', 'observacion') IS NULL
BEGIN
    ALTER TABLE dbo.zt_coordenada ADD observacion VARCHAR(200) NULL;
    PRINT 'Columna observacion agregada.';
END
GO

IF COL_LENGTH('dbo.zt_coordenada', 'fecha_reg') IS NULL
BEGIN
    ALTER TABLE dbo.zt_coordenada ADD fecha_reg DATETIME NULL;
    PRINT 'Columna fecha_reg agregada.';
END
GO

IF COL_LENGTH('dbo.zt_coordenada', 'usuario_reg') IS NULL
BEGIN
    ALTER TABLE dbo.zt_coordenada ADD usuario_reg VARCHAR(50) NULL;
    PRINT 'Columna usuario_reg agregada.';
END
GO

-- Marcar lo que ya estaba como proveniente del ERP, para no confundirlo
-- despues con las coordenadas aprendidas en la calle.
UPDATE dbo.zt_coordenada
   SET origen = 'erp'
 WHERE origen IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_zt_coordenada_origen')
BEGIN
    ALTER TABLE dbo.zt_coordenada WITH NOCHECK
        ADD CONSTRAINT CK_zt_coordenada_origen
        CHECK (origen IS NULL OR origen IN ('erp','manual','gps_entrega','importacion'));
    PRINT 'Candado de origen agregado.';
END
GO

/* ===========================================================================
   PARTE B - Corregir las coordenadas invertidas
   ---------------------------------------------------------------------------
   Dos registros tienen los valores cruzados: la latitud guarda la longitud y
   viceversa. Se detectan solos, sin ambiguedad posible:

       la latitud  de Venezuela esta entre   0,60 y  12,30  (positiva)
       la longitud de Venezuela esta entre -73,40 y -59,70  (negativa)

   Si el campo latitud tiene un valor negativo por debajo de -59, esta guardando
   una longitud. No hay forma de que sea una latitud valida.

   La aplicacion ya endereza este caso al leer, asi que hoy no causa daño
   visible. Se corrige igual: dejar el dato torcido en la base significa que
   cualquier otro consumidor (un reporte, un Excel, Power BI) lo va a leer mal.
=========================================================================== */

BEGIN TRANSACTION;

    ;WITH invertidas AS (
        SELECT co_cli, latitud, longuitud
        FROM dbo.zt_coordenada
        WHERE TRY_CAST(latitud   AS DECIMAL(18,10)) BETWEEN -73.40 AND -59.70
          AND TRY_CAST(longuitud AS DECIMAL(18,10)) BETWEEN   0.60 AND  12.30
    )
    UPDATE z
       SET z.latitud   = i.longuitud,   -- se intercambian
           z.longuitud = i.latitud,
           z.observacion = ISNULL(z.observacion + ' | ', '')
                         + 'lat/lng invertidas, corregido 2026-08-18'
    FROM dbo.zt_coordenada z
    INNER JOIN invertidas i ON i.co_cli = z.co_cli;

    PRINT CONCAT(@@ROWCOUNT, ' registro(s) con lat/lng invertidas corregido(s)');

    -- Comprobar antes de confirmar: no debe quedar nada fuera de Venezuela
    IF EXISTS (
        SELECT 1 FROM dbo.zt_coordenada
        WHERE latitud IS NOT NULL
          AND NOT (TRY_CAST(latitud   AS DECIMAL(18,10)) BETWEEN   0.60 AND  12.30
               AND TRY_CAST(longuitud AS DECIMAL(18,10)) BETWEEN -73.40 AND -59.70)
    )
    BEGIN
        PRINT 'ATENCION: quedan coordenadas fuera del rango de Venezuela.';
        PRINT 'Se deshace el cambio. Revisen la consulta de verificacion de abajo.';
        ROLLBACK TRANSACTION;
    END
    ELSE
    BEGIN
        PRINT 'Verificacion correcta: todas las coordenadas caen en Venezuela.';
        COMMIT TRANSACTION;
    END
GO

/* ===========================================================================
   PERMISOS PARA LA APLICACION
   ---------------------------------------------------------------------------
   La aplicacion necesita poder ESCRIBIR en esta tabla para guardar las
   coordenadas que aprende en cada entrega. Hoy solo puede leer.

   Ajusten el nombre del usuario si en su instalacion es distinto.
=========================================================================== */

GRANT SELECT, INSERT, UPDATE ON dbo.zt_coordenada TO ossa;
GO

/* ===========================================================================
   VERIFICACION FINAL
=========================================================================== */

SELECT
    COUNT(*)                                                      AS filas,
    SUM(CASE WHEN origen = 'erp'         THEN 1 ELSE 0 END)        AS del_erp,
    SUM(CASE WHEN origen = 'gps_entrega' THEN 1 ELSE 0 END)        AS aprendidas_en_reparto,
    SUM(CASE WHEN origen = 'manual'      THEN 1 ELSE 0 END)        AS puestas_a_mano,
    SUM(CASE WHEN TRY_CAST(latitud   AS DECIMAL(18,10)) BETWEEN   0.60 AND  12.30
              AND TRY_CAST(longuitud AS DECIMAL(18,10)) BETWEEN -73.40 AND -59.70
             THEN 1 ELSE 0 END)                                    AS dentro_de_venezuela
FROM dbo.zt_coordenada;
GO
