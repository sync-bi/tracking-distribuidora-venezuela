/* =============================================================================
   02 — zt_cliente_contacto : segundo contacto del cliente
   -----------------------------------------------------------------------------
   Necesidad acordada en la reunión del 27-05-2026 (min 00:24:24): al despachar
   hace falta un segundo teléfono. Con uno solo, si no contesta, el conductor
   queda sin a quién llamar y la entrega se cae.

   POR QUÉ UNA TABLA APARTE Y NO UNA COLUMNA EN saCliente
   -------------------------------------------------------
   saCliente es una tabla nativa de Profit Plus. Agregarle columnas trae dos
   riesgos concretos:
     1. Una actualización del ERP puede recrear la tabla y perder la columna
        junto con todos los datos que se hayan capturado.
     2. Las validaciones y pantallas de Profit no conocen esa columna, así que
        el dato no se puede mantener desde el propio ERP.
   Una tabla propia (prefijo zt_) sobrevive a las actualizaciones y es de
   nosotros. Se relaciona por co_cli, que es la llave del cliente.

   Si aun así prefieren la columna dentro de saCliente, la aplicación también lo
   soporta: busca por nombre entre contacto2, contac2, contacto_2,
   persona_contacto2, representante2, telefonos2, telefono2 y telef2, y usa la
   primera que encuentre. Es decisión de ustedes; la tabla aparte es lo que
   recomendamos.

   OJO — ESTA TABLA REQUIERE UN AJUSTE EN LA APLICACIÓN
   ----------------------------------------------------
   Hoy api/despachos.js busca el contacto secundario como columna de saCliente.
   Para leerlo desde esta tabla hay que agregar el LEFT JOIN correspondiente.
   Es un cambio de pocas líneas de nuestro lado; avísennos cuando la creen.

   VERIFICADO EL 18-08-2026 CONTRA LA BASE: saCliente no tiene ninguna de las
   ocho columnas de contacto secundario que la aplicacion busca. Tampoco tiene
   persona_con ni contacto, asi que el contacto principal tambien sale vacio.
   Esta tabla si hace falta. La unica columna que ya existe es dir_ent2.

   Idempotente.
   ============================================================================= */

SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.zt_cliente_contacto', 'U') IS NULL
BEGIN
    PRINT 'Creando dbo.zt_cliente_contacto...';

    CREATE TABLE dbo.zt_cliente_contacto (
        co_cli        CHAR(16)     NOT NULL,   -- = saCliente.co_cli

        -- Contacto principal alterno (el de la ficha sigue siendo el de Profit)
        contacto1     VARCHAR(80)  NULL,
        telefono1     VARCHAR(40)  NULL,

        -- Segundo contacto: el que se usa cuando el primero no responde
        contacto2     VARCHAR(80)  NULL,
        telefono2     VARCHAR(40)  NULL,

        -- Teléfono al que se manda el aviso de WhatsApp, si es distinto
        whatsapp      VARCHAR(40)  NULL,

        observacion   VARCHAR(200) NULL,
        fecha_reg     DATETIME     NOT NULL
                      CONSTRAINT DF_zt_cli_contacto_fecha DEFAULT (GETDATE()),
        usuario_reg   VARCHAR(50)  NULL,

        CONSTRAINT PK_zt_cliente_contacto PRIMARY KEY CLUSTERED (co_cli)
    );

    PRINT 'Tabla dbo.zt_cliente_contacto creada.';
END
ELSE
    PRINT 'dbo.zt_cliente_contacto ya existe — no se modifica.';
GO

/* ---------------------------------------------------------------------------
   Carga inicial: arrastrar lo que ya está en la ficha del cliente
   ---------------------------------------------------------------------------
   Deja el teléfono actual de Profit como telefono1 para no partir de cero.
   Solo inserta los clientes que todavía no tengan ficha de contacto.
--------------------------------------------------------------------------- */
INSERT INTO dbo.zt_cliente_contacto (co_cli, telefono1, usuario_reg)
SELECT
    cli.co_cli,
    NULLIF(RTRIM(cli.telefonos), ''),
    'carga_inicial'
FROM saCliente cli
WHERE NOT EXISTS (
        SELECT 1 FROM dbo.zt_cliente_contacto zc
        WHERE zc.co_cli = cli.co_cli
      )
  AND NULLIF(RTRIM(cli.telefonos), '') IS NOT NULL;

PRINT CONCAT(@@ROWCOUNT, ' cliente(s) precargados desde saCliente.telefonos');
GO


/* ===========================================================================
   PERMISOS PARA LA APLICACION
   ---------------------------------------------------------------------------
   La cuenta que usa la aplicacion (ossa) no tiene permisos sobre tablas nuevas
   hasta que se le otorguen. Se verifico: hoy no puede crear ni alterar tablas,
   por eso este script lo debe correr el DBA.

   Ajusten el nombre del usuario si en su instalacion es distinto.
=========================================================================== */

GRANT SELECT, INSERT, UPDATE ON dbo.zt_cliente_contacto TO ossa;
GO

/* ---------------------------------------------------------------------------
   Comprobación: cuántos clientes quedan con un solo teléfono
--------------------------------------------------------------------------- */
SELECT
    COUNT(*)                                                        AS fichas,
    SUM(CASE WHEN telefono1 IS NOT NULL THEN 1 ELSE 0 END)          AS con_primer_telefono,
    SUM(CASE WHEN telefono2 IS NOT NULL THEN 1 ELSE 0 END)          AS con_segundo_telefono,
    SUM(CASE WHEN whatsapp  IS NOT NULL THEN 1 ELSE 0 END)          AS con_whatsapp
FROM dbo.zt_cliente_contacto;
GO
