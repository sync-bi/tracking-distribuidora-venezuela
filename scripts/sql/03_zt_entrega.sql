/* =============================================================================
   03 — zt_entrega : el resultado de la entrega, de vuelta al ERP
   -----------------------------------------------------------------------------
   Hoy todo lo que pasa en la calle (a qué hora se entregó, quién recibió, dónde
   quedó realmente el cliente, si hubo no conformidad) vive solo en la
   aplicación. Profit Plus no se entera. Esta tabla es el puente.

   ESTO ES LO QUE DESTRABA LA DECISIÓN PENDIENTE DEL CLIENTE
   ---------------------------------------------------------
   La conversación sobre "escribir al ERP" quedó frenada porque escribir dentro
   de las tablas de Profit es delicado, y con razón. Esta propuesta NO hace eso.
   La aplicación escribe únicamente en esta tabla, que es nueva y nuestra:

     - No modifica ninguna tabla de Profit Plus.
     - No altera inventario, cuentas por cobrar ni documentos fiscales.
     - Si mañana deciden apagarla, se deja de escribir y no pasa nada.
     - Ustedes deciden, con calma, si algún proceso de Profit la lee o no.

   Es un buzón, no una intervención. Con eso el riesgo que preocupaba desaparece
   y la decisión se vuelve reversible.

   BENEFICIO INMEDIATO: la columna de coordenada de entrega
   --------------------------------------------------------
   Al entregar, el teléfono del conductor captura la posición exacta de la puerta
   del cliente. Esa coordenada es mejor que cualquier geocodificador: es el sitio
   real donde se descargó la mercancía. Cada entrega registrada aquí ubica un
   cliente más, y así se va llenando el 92 % de clientes que hoy no tiene
   ubicación — sin que nadie tenga que sentarse a capturar 4.000 direcciones.

   VERIFICADO EL 18-08-2026: la tabla no existe en la base. Hay que crearla.
   La unica tabla zt_ que existe hoy es zt_coordenada.

   Idempotente.
   ============================================================================= */

SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.zt_entrega', 'U') IS NULL
BEGIN
    PRINT 'Creando dbo.zt_entrega...';

    CREATE TABLE dbo.zt_entrega (
        id_entrega      INT IDENTITY(1,1) NOT NULL,

        -- Documento que se despachó (nota de entrega o factura, según el caso)
        tipo_doc        VARCHAR(20)   NOT NULL,   -- 'nota_entrega' | 'factura'
        doc_num         CHAR(20)      NOT NULL,   -- = saNotaEntregaVenta/saFacturaVenta.doc_num
        co_cli          CHAR(16)      NOT NULL,   -- = saCliente.co_cli

        -- Cómo terminó la entrega
        estado          VARCHAR(20)   NOT NULL,   -- 'entregado' | 'parcial' | 'rechazado' | 'no_entregado'
        fec_entrega     DATETIME      NULL,
        recibido_por    VARCHAR(80)   NULL,
        ci_recibe       VARCHAR(20)   NULL,

        -- Dónde se entregó de verdad. Alimenta zt_coordenada (ver script 01).
        lat_entrega     DECIMAL(9,6)  NULL,
        lng_entrega     DECIMAL(9,6)  NULL,
        precision_m     INT           NULL,       -- exactitud del GPS en metros

        -- Quién la hizo
        placa_vehiculo  VARCHAR(15)   NULL,
        conductor       VARCHAR(80)   NULL,

        -- Aviso al cliente por WhatsApp
        wa_enviado      BIT           NOT NULL CONSTRAINT DF_zt_entrega_wa DEFAULT (0),
        wa_fecha        DATETIME      NULL,
        wa_telefono     VARCHAR(40)   NULL,

        -- No conformidad, si la hubo
        no_conforme     BIT           NOT NULL CONSTRAINT DF_zt_entrega_nc DEFAULT (0),
        motivo_nc       VARCHAR(300)  NULL,

        observacion     VARCHAR(300)  NULL,

        -- Control
        id_app          VARCHAR(60)   NULL,       -- id del despacho en la aplicación
        fecha_reg       DATETIME      NOT NULL CONSTRAINT DF_zt_entrega_fecha DEFAULT (GETDATE()),
        usuario_reg     VARCHAR(50)   NULL,

        CONSTRAINT PK_zt_entrega PRIMARY KEY CLUSTERED (id_entrega),

        CONSTRAINT CK_zt_entrega_tipo
            CHECK (tipo_doc IN ('nota_entrega','factura')),
        CONSTRAINT CK_zt_entrega_estado
            CHECK (estado IN ('entregado','parcial','rechazado','no_entregado')),

        -- Mismos candados de rango que zt_coordenada: nada fuera de Venezuela
        CONSTRAINT CK_zt_entrega_lat
            CHECK (lat_entrega IS NULL OR lat_entrega BETWEEN  0.60 AND  12.30),
        CONSTRAINT CK_zt_entrega_lng
            CHECK (lng_entrega IS NULL OR lng_entrega BETWEEN -73.40 AND -59.70),

        -- Una entrega marcada como no conforme tiene que decir por qué
        CONSTRAINT CK_zt_entrega_nc_motivo
            CHECK (no_conforme = 0 OR NULLIF(LTRIM(RTRIM(motivo_nc)), '') IS NOT NULL)
    );

    PRINT 'Tabla dbo.zt_entrega creada.';
END
ELSE
    PRINT 'dbo.zt_entrega ya existe — no se modifica.';
GO

/* ---------------------------------------------------------------------------
   Índices
   ---------------------------------------------------------------------------
   Un documento no debería tener dos entregas registradas: el índice único lo
   impide y además hace que reintentar el envío desde la app sea inofensivo.
--------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.zt_entrega', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = 'UX_zt_entrega_doc'
                     AND object_id = OBJECT_ID('dbo.zt_entrega'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_zt_entrega_doc
        ON dbo.zt_entrega (tipo_doc, doc_num);
    PRINT 'Índice único UX_zt_entrega_doc creado.';
END
GO

IF OBJECT_ID('dbo.zt_entrega', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = 'IX_zt_entrega_cli_fecha'
                     AND object_id = OBJECT_ID('dbo.zt_entrega'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_zt_entrega_cli_fecha
        ON dbo.zt_entrega (co_cli, fec_entrega DESC)
        INCLUDE (estado, lat_entrega, lng_entrega);
    PRINT 'Índice IX_zt_entrega_cli_fecha creado.';
END
GO


/* ===========================================================================
   PERMISOS PARA LA APLICACION
   ---------------------------------------------------------------------------
   La cuenta que usa la aplicacion (ossa) no tiene permisos sobre tablas nuevas
   hasta que se le otorguen. Se verifico: hoy no puede crear ni alterar tablas,
   por eso este script lo debe correr el DBA.

   Ajusten el nombre del usuario si en su instalacion es distinto.
=========================================================================== */

GRANT SELECT, INSERT, UPDATE ON dbo.zt_entrega TO ossa;
GO

/* ---------------------------------------------------------------------------
   Comprobación
--------------------------------------------------------------------------- */
SELECT
    COUNT(*)                                                     AS entregas_registradas,
    SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END)        AS entregadas,
    SUM(CASE WHEN no_conforme = 1 THEN 1 ELSE 0 END)             AS con_no_conformidad,
    SUM(CASE WHEN lat_entrega IS NOT NULL THEN 1 ELSE 0 END)     AS con_ubicacion_capturada
FROM dbo.zt_entrega;
GO
