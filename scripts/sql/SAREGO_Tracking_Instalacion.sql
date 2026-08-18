/* ============================================================================================
   SISTEMA DE TRACKING DE DESPACHOS - SAREGO
   Script de instalacion en la base de datos de Profit Plus
   --------------------------------------------------------------------------------------------
   Preparado por : SYNC BI
   Fecha         : 18 de agosto de 2026
   Base destino  : SARUSA_AD (Profit Plus)
   Corresponde a : documento tecnico "Proceso de despacho con tracking en tiempo real",
                   seccion "Escritura al ERP - que tablas crear" (paso 4.1 del diagrama)

   --------------------------------------------------------------------------------------------
   QUE HACE ESTE SCRIPT
   --------------------------------------------------------------------------------------------
     1. Crea las 5 tablas zt_ del documento tecnico, mas zt_cliente_contacto (seccion 8).
     2. Agrega 2 columnas a zt_coordenada, la tabla de ubicaciones que ustedes ya tienen.
     3. Crea el usuario sarego_tracking con permisos UNICAMENTE sobre esas tablas.
        No recibe db_datareader ni db_datawriter: nada de acceso a la base completa.

   --------------------------------------------------------------------------------------------
   QUE NO HACE (importante)
   --------------------------------------------------------------------------------------------
     NO modifica ninguna tabla nativa de Profit Plus.
     No se altera saFacturaVenta, saNotaEntregaVenta, saCliente, saArticulo ni ninguna otra.
     No toca inventario, cuentas por cobrar ni documentos fiscales.

     Las tablas nuevas se relacionan con los documentos del ERP por su numero, sin llaves
     foraneas hacia Profit Plus. Escribir dentro de las tablas del ERP es lo que rompe
     actualizaciones, invalida el soporte del proveedor y arriesga corromper la contabilidad.

     Si mañana deciden retirar el sistema: se borran las tablas zt_ y el ERP queda intacto.

   --------------------------------------------------------------------------------------------
   QUIEN LO EJECUTA
   --------------------------------------------------------------------------------------------
     El administrador de la base de datos, con una cuenta sysadmin o db_owner.

     La cuenta que usa hoy la aplicacion no tiene permisos para crear tablas ni usuarios;
     se verifico el 18-08-2026. Por eso este script lo debe correr el DBA una sola vez.

   --------------------------------------------------------------------------------------------
   COMO EJECUTARLO
   --------------------------------------------------------------------------------------------
     Desde SQL Server Management Studio, conectados a la base SARUSA_AD, o con sqlcmd.
     El script usa separadores GO entre lotes.

     ANTES DE EJECUTAR: cambien la contraseña del usuario en la seccion 9 (marcada CAMBIAR).

     Es idempotente: se puede ejecutar varias veces sin causar daño. Lo que ya exista se
     detecta y no se toca.
   ============================================================================================ */

SET NOCOUNT ON;
GO

/* ============================================================================================
   1. VERIFICACION PREVIA
   --------------------------------------------------------------------------------------------
   Comprueba que estamos en la base correcta y con permisos suficientes antes de crear nada.
   ============================================================================================ */

PRINT '';
PRINT '=========================================================';
PRINT ' INSTALACION TRACKING SAREGO';
PRINT '=========================================================';
PRINT CONCAT('Base de datos : ', DB_NAME());
PRINT CONCAT('Usuario       : ', SUSER_NAME());
PRINT CONCAT('Fecha         : ', CONVERT(VARCHAR(19), GETDATE(), 120));
PRINT '';
GO

IF OBJECT_ID('dbo.saCliente', 'U') IS NULL
BEGIN
    RAISERROR('ATENCION: no se encuentra la tabla saCliente. Verifiquen que estan conectados a la base de Profit Plus antes de continuar.', 20, 1) WITH LOG;
END
GO

IF IS_SRVROLEMEMBER('sysadmin') = 0 AND IS_ROLEMEMBER('db_owner') = 0
BEGIN
    RAISERROR('ATENCION: la cuenta actual no es sysadmin ni db_owner. No podra crear las tablas ni el usuario.', 16, 1);
END
GO

/* ============================================================================================
   2. zt_despacho   -   Un registro por salida de vehiculo
   --------------------------------------------------------------------------------------------
   Se inserta cuando se autoriza la salida del almacen (paso 1.1 del diagrama), con el
   checklist de verificacion, el kilometraje y quien autorizo. Se actualizan fec_cierre y
   estado cuando el despacho se completa.
   ============================================================================================ */

IF OBJECT_ID('dbo.zt_despacho', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.zt_despacho (
      id_despacho      varchar(40)   NOT NULL PRIMARY KEY,  -- id del sistema de tracking
      co_ven           char(6)       NULL,                  -- vendedor, si aplica
      placa            varchar(20)   NULL,
      conductor        varchar(120)  NULL,
      fec_salida       datetime      NOT NULL,              -- confirmacion del checklist
      km_salida        int           NULL,
      chk_documentos   bit           NOT NULL DEFAULT 0,
      chk_carga        bit           NOT NULL DEFAULT 0,
      chk_vehiculo     bit           NOT NULL DEFAULT 0,
      chk_conductor    bit           NOT NULL DEFAULT 0,
      observacion      varchar(500)  NULL,
      autorizado_por   varchar(120)  NULL,
      fec_cierre       datetime      NULL,
      estado           varchar(20)   NOT NULL,              -- En Ruta | Completado | Cancelado
      fec_registro     datetime      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'OK  zt_despacho creada.';
END
ELSE
    PRINT '--  zt_despacho ya existe, no se modifica.';
GO

/* ============================================================================================
   3. zt_despacho_doc   -   Que documentos iban en cada despacho
   --------------------------------------------------------------------------------------------
   Una fila por documento al armar el despacho. orden_parada guarda la ruta planificada, que
   es lo que despues permite calcular el indicador de cumplimiento de ruta dentro del ERP.
   ============================================================================================ */

IF OBJECT_ID('dbo.zt_despacho_doc', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.zt_despacho_doc (
      id_despacho   varchar(40)  NOT NULL,
      doc_num       char(20)     NOT NULL,   -- nro. de factura o nota de entrega
      tipo_doc      varchar(20)  NOT NULL,   -- FACTURA | NOTA
      co_cli        char(16)     NOT NULL,
      orden_parada  int          NULL,       -- posicion en la ruta planificada
      CONSTRAINT PK_zt_despacho_doc PRIMARY KEY (id_despacho, doc_num, tipo_doc)
    );
    CREATE INDEX IX_zt_despacho_doc_doc ON dbo.zt_despacho_doc (doc_num);
    PRINT 'OK  zt_despacho_doc creada.';
END
ELSE
    PRINT '--  zt_despacho_doc ya existe, no se modifica.';
GO

/* ============================================================================================
   4. zt_entrega   -   El comprobante de entrega (tabla principal)
   --------------------------------------------------------------------------------------------
   Se inserta al momento de la firma del cliente. Guarda donde y cuando se entrego, quien
   recibio, si fue conforme y el enlace al comprobante digital.

   La coordenada de esta tabla es la que despues alimenta zt_coordenada: es la posicion real
   de la puerta del cliente, capturada por el telefono del conductor.
   ============================================================================================ */

IF OBJECT_ID('dbo.zt_entrega', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.zt_entrega (
      id_entrega       varchar(40)   NOT NULL PRIMARY KEY,
      id_despacho      varchar(40)   NULL,
      doc_num          char(20)      NOT NULL,   -- documento entregado
      tipo_doc         varchar(20)   NOT NULL,   -- FACTURA | NOTA
      co_cli           char(16)      NOT NULL,
      fec_llegada      datetime      NULL,       -- paso 3.1
      fec_entrega      datetime      NOT NULL,   -- firma del cliente
      conforme         bit           NOT NULL,
      receptor_nombre  varchar(120)  NOT NULL,
      receptor_cedula  varchar(20)   NULL,
      latitud          decimal(9,6)  NULL,
      longitud         decimal(9,6)  NULL,
      precision_mts    int           NULL,
      origen_gps       varchar(30)   NULL,       -- tracking | puntual | desactualizado
      cant_fotos       tinyint       NOT NULL DEFAULT 0,
      url_comprobante  varchar(300)  NULL,       -- enlace al POD digital
      observacion      varchar(500)  NULL,
      registrado_por   varchar(120)  NULL,
      fec_registro     datetime      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_zt_entrega_doc ON dbo.zt_entrega (doc_num);
    CREATE INDEX IX_zt_entrega_cli ON dbo.zt_entrega (co_cli, fec_entrega);
    PRINT 'OK  zt_entrega creada.';
END
ELSE
    PRINT '--  zt_entrega ya existe, no se modifica.';
GO

/* ============================================================================================
   5. zt_entrega_reng   -   Detalle de lo que llego mal
   --------------------------------------------------------------------------------------------
   Una fila por cada articulo con problema, en la misma operacion de guardado de la entrega.
   Si la entrega fue conforme, esta tabla no recibe filas.

   Es la que permite responder "que producto se esta devolviendo mas y por que causa".
   ============================================================================================ */

IF OBJECT_ID('dbo.zt_entrega_reng', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.zt_entrega_reng (
      id_entrega    varchar(40)   NOT NULL,
      co_art        char(30)      NULL,        -- codigo de articulo de Profit Plus
      descripcion   varchar(200)  NULL,
      cantidad      decimal(18,4) NULL,
      causa         varchar(40)   NOT NULL,    -- danado | faltante | incorrecto | vencido
      detalle       varchar(300)  NULL,
      CONSTRAINT FK_zt_entrega_reng FOREIGN KEY (id_entrega)
        REFERENCES dbo.zt_entrega (id_entrega)
    );
    CREATE INDEX IX_zt_entrega_reng_ent ON dbo.zt_entrega_reng (id_entrega);
    PRINT 'OK  zt_entrega_reng creada.';
END
ELSE
    PRINT '--  zt_entrega_reng ya existe, no se modifica.';
GO

/* ============================================================================================
   6. zt_incidencia   -   Incidencias ocurridas en ruta
   --------------------------------------------------------------------------------------------
   Se inserta cuando el conductor reporta desde la ruta. Se actualizan estado y
   fec_resolucion cuando operaciones la gestiona.

   Una incidencia es distinta de una no conformidad: la incidencia ocurre con el camion
   rodando y afecta la operacion (una averia, un cliente ausente). La no conformidad ocurre
   en la entrega y afecta la mercancia.
   ============================================================================================ */

IF OBJECT_ID('dbo.zt_incidencia', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.zt_incidencia (
      id_incidencia  varchar(40)   NOT NULL PRIMARY KEY,
      id_despacho    varchar(40)   NULL,
      doc_num        char(20)      NULL,       -- NULL si afecta toda la ruta
      co_cli         char(16)      NULL,
      tipo           varchar(40)   NOT NULL,   -- retraso | averia | cliente_ausente
      gravedad       varchar(20)   NOT NULL,   -- Leve | Moderada | Grave
      descripcion    varchar(500)  NULL,
      accion         varchar(40)   NULL,       -- continuar | reprogramar | reasignar | cancelar
      latitud        decimal(9,6)  NULL,
      longitud       decimal(9,6)  NULL,
      fec_reporte    datetime      NOT NULL,
      fec_resolucion datetime      NULL,
      estado         varchar(20)   NOT NULL,   -- Abierta | En gestion | Resuelta | Cerrada
      reportado_por  varchar(120)  NULL
    );
    CREATE INDEX IX_zt_incidencia_doc ON dbo.zt_incidencia (doc_num);
    PRINT 'OK  zt_incidencia creada.';
END
ELSE
    PRINT '--  zt_incidencia ya existe, no se modifica.';
GO

/* ============================================================================================
   7. zt_coordenada   -   LA UBICACION DE LOS CLIENTES
   --------------------------------------------------------------------------------------------
   ESTA TABLA YA EXISTE Y ES DE USTEDES. Es la unica tabla existente que este script toca,
   y solo para AGREGAR dos columnas. No se borra ni se modifica ningun dato suyo.

   Situacion verificada el 18-08-2026:
       121 clientes con ubicacion, de 4.377 activos. Los valores estan correctos.

   POR QUE HACEN FALTA ESTAS DOS COLUMNAS
   ---------------------------------------
   El sistema aprende la ubicacion real de cada cliente desde el GPS del conductor al
   entregar, y puede devolversela al ERP: su base mejora sola con cada reparto, sin que
   nadie se siente a capturar cuatro mil direcciones.

   Pero para poder confiar en ese dato hay que saber DE DONDE SALIO. Sin la columna origen,
   una ubicacion aprendida con mala señal pisaria una direccion que ustedes verificaron a
   mano, y no habria forma de distinguirlas ni de revertirlo.

   SI PREFIEREN NO TOCAR ESTA TABLA: diganlo y el sistema escribe en una tabla aparte;
   ustedes deciden despues cuando y como volcarla. Esta seccion se puede omitir sin afectar
   el resto del script.
   ============================================================================================ */

IF OBJECT_ID('dbo.zt_coordenada', 'U') IS NULL
BEGIN
    PRINT '!!  zt_coordenada no existe en esta base. Se omite la seccion 7.';
    PRINT '    Avisen a SYNC BI: la aplicacion la consulta hoy y esperabamos encontrarla.';
END
ELSE
BEGIN
    IF COL_LENGTH('dbo.zt_coordenada', 'origen') IS NULL
    BEGIN
        EXEC('ALTER TABLE dbo.zt_coordenada ADD origen varchar(30) NULL');  -- manual | gps_entrega
        PRINT 'OK  zt_coordenada: columna origen agregada.';
    END
    ELSE
        PRINT '--  zt_coordenada: columna origen ya existe.';

    IF COL_LENGTH('dbo.zt_coordenada', 'fec_registro') IS NULL
    BEGIN
        EXEC('ALTER TABLE dbo.zt_coordenada ADD fec_registro datetime NULL');
        PRINT 'OK  zt_coordenada: columna fec_registro agregada.';
    END
    ELSE
        PRINT '--  zt_coordenada: columna fec_registro ya existe.';
END
GO

-- Marcar lo que ya estaba como cargado por ustedes, para no confundirlo despues con
-- las coordenadas que el sistema aprenda en la calle.
IF COL_LENGTH('dbo.zt_coordenada', 'origen') IS NOT NULL
BEGIN
    UPDATE dbo.zt_coordenada SET origen = 'erp' WHERE origen IS NULL;
    PRINT CONCAT('OK  zt_coordenada: ', @@ROWCOUNT, ' registro(s) marcados como origen=erp.');
END
GO

/* ============================================================================================
   8. zt_cliente_contacto   -   Segundo contacto del cliente
   --------------------------------------------------------------------------------------------
   NOTA: esta tabla NO figura en el documento tecnico del 17 de agosto. Se agrega aqui a
   partir de una revision posterior de la base, del 18-08-2026.

   QUE SE ENCONTRO
   ---------------
   saCliente no tiene ninguna columna de contacto secundario. Se verificaron las ocho
   variantes posibles (contacto2, telefonos2, representante2 y demas) y no existe ninguna.
   Tampoco existe persona_con, asi que hoy el sistema tampoco recibe el contacto principal:
   ese campo llega vacio.

   POR QUE IMPORTA
   ---------------
   Con un solo telefono, si el cliente no contesta el conductor queda sin a quien llamar y
   la entrega se cae. Es una de las causas evitables de reintento de despacho.

   Esta seccion es opcional. Si prefieren resolverlo con un campo dentro de Profit Plus,
   diganlo y la aplicacion lo lee desde alli.
   ============================================================================================ */

IF OBJECT_ID('dbo.zt_cliente_contacto', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.zt_cliente_contacto (
      co_cli        char(16)     NOT NULL PRIMARY KEY,   -- = saCliente.co_cli
      contacto1     varchar(80)  NULL,
      telefono1     varchar(40)  NULL,
      contacto2     varchar(80)  NULL,                   -- el segundo, cuando el primero no responde
      telefono2     varchar(40)  NULL,
      whatsapp      varchar(40)  NULL,                   -- si el aviso va a otro numero
      observacion   varchar(200) NULL,
      fec_registro  datetime     NOT NULL DEFAULT GETDATE()
    );
    PRINT 'OK  zt_cliente_contacto creada.';

    -- Precarga con el telefono que ya esta en la ficha, para no partir de cero.
    -- Solo lee saCliente; no la modifica.
    INSERT INTO dbo.zt_cliente_contacto (co_cli, telefono1)
    SELECT cli.co_cli, NULLIF(RTRIM(cli.telefonos), '')
    FROM dbo.saCliente cli
    WHERE NULLIF(RTRIM(cli.telefonos), '') IS NOT NULL;

    PRINT CONCAT('OK  zt_cliente_contacto: ', @@ROWCOUNT, ' cliente(s) precargados.');
END
ELSE
    PRINT '--  zt_cliente_contacto ya existe, no se modifica.';
GO

/* ============================================================================================
   9. USUARIO Y PERMISOS
   --------------------------------------------------------------------------------------------
   Se crea un usuario dedicado exclusivamente para la aplicacion de tracking.

   PRINCIPIO: permisos tabla por tabla. NUNCA sobre la base completa.

   Este usuario NO recibe db_datareader ni db_datawriter. Esos roles darian acceso a TODAS
   las tablas de Profit Plus, incluidas las de contabilidad, nomina y cuentas por cobrar.
   En su lugar se otorga:

       LECTURA   sobre las 9 tablas del ERP que la aplicacion necesita consultar, y ninguna mas.
       ESCRITURA sobre las tablas zt_ del tracking, y ninguna mas.

   El usuario no puede crear, alterar ni borrar tablas. No puede leer ninguna tabla que no
   este listada abajo. Si intenta consultar cualquier otra, SQL Server se lo niega.

   >>> CAMBIAR LA CONTRASEÑA ANTES DE EJECUTAR <<<
   Usen una contraseña larga y aleatoria, y compartanla con SYNC BI por un canal seguro
   (no por correo ni por WhatsApp).
   ============================================================================================ */

-- --- 9.1 Crear el login a nivel de servidor -------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'sarego_tracking')
BEGIN
    -- La base por defecto se toma de la conexion actual, para no depender de que
    -- el nombre sea exactamente SARUSA_AD en esta instalacion.
    DECLARE @sql nvarchar(500) = N'CREATE LOGIN sarego_tracking
        WITH PASSWORD = ''CAMBIAR_ESTA_CLAVE_ANTES_DE_EJECUTAR'',
             CHECK_POLICY = ON,
             DEFAULT_DATABASE = ' + QUOTENAME(DB_NAME()) + N';';
    EXEC sp_executesql @sql;
    PRINT 'OK  Login sarego_tracking creado. CAMBIEN LA CLAVE.';
END
ELSE
    PRINT '--  Login sarego_tracking ya existe.';
GO

-- --- 9.2 Crear el usuario dentro de la base -------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'sarego_tracking')
BEGIN
    CREATE USER sarego_tracking FOR LOGIN sarego_tracking;
    PRINT 'OK  Usuario sarego_tracking creado en la base.';
END
ELSE
    PRINT '--  Usuario sarego_tracking ya existe en la base.';
GO

/* --- 9.3 LECTURA sobre las tablas del ERP -----------------------------------------------
   Estas son exactamente las tablas que la aplicacion consulta hoy. Ni una mas.

   Nota: el documento del 17 de agosto listaba 7 tablas. Se agregaron saPedidoVenta y
   saPedidoVentaReng, que la aplicacion tambien usa en su consulta de respaldo. Sin ellas
   esa via falla en silencio.
------------------------------------------------------------------------------------------- */
GRANT SELECT ON dbo.saCliente           TO sarego_tracking;
GRANT SELECT ON dbo.saFacturaVenta      TO sarego_tracking;
GRANT SELECT ON dbo.saFacturaVentaReng  TO sarego_tracking;
GRANT SELECT ON dbo.saNotaEntregaVenta  TO sarego_tracking;
GRANT SELECT ON dbo.saPedidoVenta       TO sarego_tracking;
GRANT SELECT ON dbo.saPedidoVentaReng   TO sarego_tracking;
GRANT SELECT ON dbo.saArticulo          TO sarego_tracking;
GRANT SELECT ON dbo.saZona              TO sarego_tracking;
GRANT SELECT ON dbo.saVendedor          TO sarego_tracking;
GO
PRINT 'OK  Permisos de LECTURA otorgados sobre 9 tablas del ERP.';
GO

/* --- 9.4 ESCRITURA unicamente sobre las tablas del tracking ------------------------------ */
GRANT SELECT, INSERT, UPDATE ON dbo.zt_despacho         TO sarego_tracking;
GRANT SELECT, INSERT, UPDATE ON dbo.zt_despacho_doc     TO sarego_tracking;
GRANT SELECT, INSERT, UPDATE ON dbo.zt_entrega          TO sarego_tracking;
GRANT SELECT, INSERT, UPDATE ON dbo.zt_entrega_reng     TO sarego_tracking;
GRANT SELECT, INSERT, UPDATE ON dbo.zt_incidencia       TO sarego_tracking;
GRANT SELECT, INSERT, UPDATE ON dbo.zt_coordenada       TO sarego_tracking;
GO

IF OBJECT_ID('dbo.zt_cliente_contacto', 'U') IS NOT NULL
    EXEC('GRANT SELECT, INSERT, UPDATE ON dbo.zt_cliente_contacto TO sarego_tracking');
GO
PRINT 'OK  Permisos de ESCRITURA otorgados solo sobre las tablas zt_.';
GO

/* --- 9.5 Negar explicitamente lo que no debe poder hacer --------------------------------
   No es estrictamente necesario (lo que no se otorga, no se tiene), pero deja constancia
   escrita de la intencion y protege si alguien agrega el usuario a un rol por error.
------------------------------------------------------------------------------------------- */
DENY DELETE ON dbo.zt_coordenada TO sarego_tracking;
GO
PRINT 'OK  Denegado el borrado sobre zt_coordenada (la aplicacion solo agrega y corrige).';
GO

/* ============================================================================================
   10. VERIFICACION FINAL
   --------------------------------------------------------------------------------------------
   Lo que sigue le permite al DBA comprobar, con sus propios ojos, que el usuario quedo con
   los permisos justos y nada mas.
   ============================================================================================ */

PRINT '';
PRINT '--- Tablas del tracking instaladas ---';
SELECT
    t.name                                                                AS tabla,
    (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = t.object_id)  AS columnas,
    CASE WHEN t.name = 'zt_coordenada' THEN 'ya existia (solo se agregaron columnas)'
         ELSE 'nueva' END                                                 AS observacion
FROM sys.tables t
WHERE t.name LIKE 'zt[_]%'
ORDER BY t.name;
GO

PRINT '';
PRINT '--- Permisos efectivos del usuario sarego_tracking ---';
PRINT '    (esta lista debe contener SOLO las tablas de abajo, ninguna otra)';
SELECT
    OBJECT_NAME(p.major_id)  AS tabla,
    p.permission_name        AS permiso,
    p.state_desc             AS estado
FROM sys.database_permissions p
INNER JOIN sys.database_principals u ON u.principal_id = p.grantee_principal_id
WHERE u.name = 'sarego_tracking'
  AND p.major_id > 0
ORDER BY
    CASE WHEN OBJECT_NAME(p.major_id) LIKE 'zt[_]%' THEN 1 ELSE 0 END,
    OBJECT_NAME(p.major_id),
    p.permission_name;
GO

PRINT '';
PRINT '--- Comprobacion: el usuario NO debe pertenecer a roles amplios ---';
SELECT
    r.name AS rol_al_que_pertenece,
    'REVISAR: este rol da acceso mas alla de las tablas del tracking' AS advertencia
FROM sys.database_role_members m
INNER JOIN sys.database_principals r ON r.principal_id = m.role_principal_id
INNER JOIN sys.database_principals u ON u.principal_id = m.member_principal_id
WHERE u.name = 'sarego_tracking'
  AND r.name IN ('db_datareader','db_datawriter','db_owner','db_ddladmin');
GO

PRINT '';
PRINT '--- Estado de las ubicaciones de clientes ---';
IF OBJECT_ID('dbo.zt_coordenada', 'U') IS NOT NULL
    SELECT
        COUNT(*)                                                     AS clientes_con_ubicacion,
        SUM(CASE WHEN origen = 'erp' THEN 1 ELSE 0 END)              AS cargadas_por_ustedes,
        SUM(CASE WHEN origen = 'gps_entrega' THEN 1 ELSE 0 END)      AS aprendidas_en_reparto
    FROM dbo.zt_coordenada;
GO

PRINT '';
PRINT '=========================================================';
PRINT ' INSTALACION TERMINADA';
PRINT '=========================================================';
PRINT ' Pendiente:';
PRINT '   1. Cambiar la contraseña del usuario sarego_tracking.';
PRINT '   2. Enviarla a SYNC BI por un canal seguro.';
PRINT '   3. Confirmar si autorizan la seccion 7 (columnas en zt_coordenada).';
PRINT '';
GO
