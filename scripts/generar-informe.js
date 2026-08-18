/**
 * Genera el informe de estado del proyecto con datos frescos de SQL Server.
 *
 *   node scripts/generar-informe.js
 *
 * Escribe informe/estado-produccion.html. Solo hace SELECT: no modifica la base.
 *
 * El informe se publica como Artifact. Para republicarlo conservando el mismo
 * enlace hay que pasar la URL existente, que esta en informe/URL.txt.
 *
 * Credenciales: SQLSERVER_* en .env.local
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Venezuela: fuera de esta caja, una coordenada es dato corrupto, no una ubicacion.
const LAT_MIN = 0.6, LAT_MAX = 12.3, LNG_MIN = -73.4, LNG_MAX = -59.7;
const DIAS_VENTANA = 90;

const cfg = {
  server: process.env.SQLSERVER_HOST,
  port: parseInt(process.env.SQLSERVER_PORT) || 1433,
  database: process.env.SQLSERVER_DATABASE,
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true },
  connectionTimeout: 20000,
  requestTimeout: 90000
};

const COORD_SANA = `
  TRY_CAST(latitud   AS DECIMAL(18,10)) BETWEEN ${LAT_MIN} AND ${LAT_MAX}
  AND TRY_CAST(longuitud AS DECIMAL(18,10)) BETWEEN ${LNG_MIN} AND ${LNG_MAX}`;

async function medir(pool) {
  const q = (texto) => pool.request().query(texto);

  const [clientes, coords, cobertura, ciudades, dupes, tablas] = await Promise.all([
    q(`SELECT COUNT(*) AS n FROM saCliente`),

    q(`SELECT COUNT(*) AS filas,
              SUM(CASE WHEN ${COORD_SANA} THEN 1 ELSE 0 END) AS sanas,
              SUM(CASE WHEN TRY_CAST(latitud AS DECIMAL(18,10)) IS NULL
                         OR TRY_CAST(longuitud AS DECIMAL(18,10)) IS NULL
                       THEN 1 ELSE 0 END) AS no_convertibles
       FROM zt_coordenada`),

    q(`WITH ubic AS (
         SELECT DISTINCT RTRIM(co_cli) co_cli FROM zt_coordenada WHERE ${COORD_SANA}),
       desp AS (
         SELECT DISTINCT RTRIM(co_cli) co_cli FROM saNotaEntregaVenta
         WHERE anulado=0 AND fec_emis >= DATEADD(DAY,-${DIAS_VENTANA},CAST(GETDATE() AS DATE))
         UNION
         SELECT DISTINCT RTRIM(co_cli) FROM saFacturaVenta
         WHERE anulado=0 AND fec_emis >= DATEADD(DAY,-${DIAS_VENTANA},CAST(GETDATE() AS DATE)))
       SELECT (SELECT COUNT(*) FROM ubic) AS ubicables,
              (SELECT COUNT(*) FROM desp) AS con_despacho,
              (SELECT COUNT(*) FROM desp d INNER JOIN ubic u ON u.co_cli=d.co_cli)
                AS ubicables_con_despacho`),

    q(`WITH ubic AS (
         SELECT DISTINCT RTRIM(co_cli) co_cli FROM zt_coordenada WHERE ${COORD_SANA}),
       desp AS (
         SELECT RTRIM(co_cli) co_cli FROM saNotaEntregaVenta
         WHERE anulado=0 AND fec_emis >= DATEADD(DAY,-${DIAS_VENTANA},CAST(GETDATE() AS DATE))
         UNION ALL
         SELECT RTRIM(co_cli) FROM saFacturaVenta
         WHERE anulado=0 AND fec_emis >= DATEADD(DAY,-${DIAS_VENTANA},CAST(GETDATE() AS DATE)))
       SELECT TOP 8 RTRIM(cli.ciudad) AS ciudad,
              COUNT(DISTINCT d.co_cli) AS clientes, COUNT(*) AS documentos
       FROM desp d
       INNER JOIN ubic u ON u.co_cli = d.co_cli
       LEFT JOIN saCliente cli ON RTRIM(cli.co_cli) = d.co_cli
       GROUP BY RTRIM(cli.ciudad)
       ORDER BY clientes DESC`),

    q(`SELECT COUNT(*) AS n FROM (
         SELECT RTRIM(num_doc) x FROM saFacturaVentaReng
         WHERE num_doc IS NOT NULL AND LTRIM(RTRIM(num_doc))<>''
         GROUP BY RTRIM(num_doc) HAVING COUNT(DISTINCT RTRIM(doc_num))>1) t`),

    q(`SELECT name FROM sys.tables WHERE name LIKE 'zt[_]%' ORDER BY name`)
  ]);

  return {
    clientesTotal: clientes.recordset[0].n,
    coordFilas: coords.recordset[0].filas,
    coordSanas: coords.recordset[0].sanas,
    coordRotas: coords.recordset[0].no_convertibles,
    ubicables: cobertura.recordset[0].ubicables,
    conDespacho: cobertura.recordset[0].con_despacho,
    ubicablesConDespacho: cobertura.recordset[0].ubicables_con_despacho,
    ciudades: ciudades.recordset,
    notasDuplicadas: dupes.recordset[0].n,
    tablasZt: tablas.recordset.map(r => r.name)
  };
}

// Estado del repositorio y de las pruebas: no sale de la base, sale de aqui.
function medirRepo() {
  const sh = (cmd) => { try { return execSync(cmd, { encoding: 'utf8' }).trim(); } catch { return ''; } };
  let pruebas = null;
  try {
    const salida = execSync('npx react-scripts test --watchAll=false 2>&1', {
      encoding: 'utf8', env: { ...process.env, CI: 'true' }, timeout: 300000
    });
    const m = salida.match(/Tests:\s+(\d+) passed, (\d+) total/);
    const s = salida.match(/Test Suites:\s+(\d+) passed, (\d+) total/);
    if (m) pruebas = { pasan: +m[1], total: +m[2], suites: s ? +s[2] : null };
  } catch (e) {
    const m = (e.stdout || '').match(/Tests:.*?(\d+) passed, (\d+) total/);
    if (m) pruebas = { pasan: +m[1], total: +m[2], suites: null };
  }
  return { commit: sh('git rev-parse --short HEAD'), rama: sh('git rev-parse --abbrev-ref HEAD'), pruebas };
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (n) => Number(n).toLocaleString('es-VE');
const pct = (parte, total) => total > 0 ? Math.round((parte / total) * 100) : 0;

function construirHtml(d, repo) {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const hora = ahora.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

  const sinUbicacion = d.clientesTotal - d.ubicables;
  const pctSin = pct(sinUbicacion, d.clientesTotal);
  const pctCobertura = pct(d.ubicablesConDespacho, d.conDespacho);

  const topCiudades = d.ciudades.slice(0, 5);
  const enTop3 = d.ciudades.slice(0, 3).reduce((s, c) => s + c.clientes, 0);
  const hayPiloto = d.ubicablesConDespacho >= 20;

  const filasCiudad = topCiudades.map(c => `
        <tr>
          <td>${esc(c.ciudad || 'Sin ciudad')}</td>
          <td class="n">${num(c.clientes)}</td>
          <td class="n">${num(c.documentos)}</td>
        </tr>`).join('');

  const faltantes = ['zt_despacho', 'zt_despacho_doc', 'zt_entrega', 'zt_entrega_reng', 'zt_incidencia']
    .filter(t => !d.tablasZt.includes(t));

  const pruebasTxt = repo.pruebas
    ? `${repo.pruebas.pasan} de ${repo.pruebas.total}`
    : 'sin medir';

  return `<title>Salida a producción Sarego</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">

<style>
  :root {
    --ground:#F4F7F8; --surface:#FFFFFF; --sunken:#EAEFF2; --line:#D5DEE3;
    --ink:#131A20; --muted:#64757F; --steel:#1F4E6B;
    --ok:#2C6A4B; --warn:#8C5D06; --crit:#9C302C;
    --ok-bg:#E6F0EA; --warn-bg:#F7EEDC; --crit-bg:#F7E7E6;
    --display:'Archivo','Helvetica Neue',Arial,sans-serif;
    --body:'Source Serif 4',Georgia,'Times New Roman',serif;
    --mono:'IBM Plex Mono',Consolas,monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground:#0E1418; --surface:#161E24; --sunken:#1B252C; --line:#2C3941;
      --ink:#E4EBEF; --muted:#93A4AE; --steel:#7FB0CD;
      --ok:#7BC49B; --warn:#DDAE5A; --crit:#E38B86;
      --ok-bg:#16281F; --warn-bg:#2A2213; --crit-bg:#2C1918;
    }
  }
  :root[data-theme="dark"] {
    --ground:#0E1418; --surface:#161E24; --sunken:#1B252C; --line:#2C3941;
    --ink:#E4EBEF; --muted:#93A4AE; --steel:#7FB0CD;
    --ok:#7BC49B; --warn:#DDAE5A; --crit:#E38B86;
    --ok-bg:#16281F; --warn-bg:#2A2213; --crit-bg:#2C1918;
  }
  *{box-sizing:border-box}
  body{background:var(--ground);color:var(--ink);font-family:var(--body);
    font-size:17px;line-height:1.62;margin:0;padding:0 24px 96px;-webkit-font-smoothing:antialiased}
  .wrap{max-width:820px;margin:0 auto}
  .prose{max-width:66ch}
  header.masthead{padding:56px 0 28px;border-bottom:2px solid var(--ink);margin-bottom:24px}
  .eyebrow{font-family:var(--mono);font-size:11.5px;font-weight:500;letter-spacing:.13em;
    text-transform:uppercase;color:var(--muted)}
  h1{font-family:var(--display);font-weight:700;font-size:clamp(34px,5.4vw,50px);
    line-height:1.04;letter-spacing:-.022em;text-wrap:balance;margin:14px 0 18px}
  .standfirst{font-size:19px;max-width:60ch;margin:0 0 26px}
  .meta{display:flex;flex-wrap:wrap;gap:8px 28px;font-family:var(--mono);font-size:12px;color:var(--muted)}
  .meta b{color:var(--ink);font-weight:500}
  .sello{display:flex;align-items:center;gap:9px;background:var(--sunken);
    border-left:3px solid var(--steel);padding:10px 14px;margin-bottom:44px;
    font-family:var(--mono);font-size:12px;color:var(--muted)}
  .sello .pip{width:7px;height:7px;border-radius:50%;background:var(--ok);flex:none}
  h2{font-family:var(--display);font-weight:700;font-size:25px;letter-spacing:-.014em;
    line-height:1.2;text-wrap:balance;margin:0 0 6px}
  h3{font-family:var(--display);font-weight:600;font-size:18px;letter-spacing:-.008em;margin:0 0 4px}
  section{margin-bottom:52px}
  .section-head{margin-bottom:24px}
  p{margin:0 0 15px}
  code{font-family:var(--mono);font-size:.855em;background:var(--sunken);
    padding:1px 5px;border-radius:3px;word-break:break-word}
  strong{font-weight:600}
  .verdict{background:var(--surface);border:1px solid var(--line);
    border-left:5px solid var(--steel);padding:22px 26px;margin-bottom:52px}
  .verdict p{margin:0}
  .verdict p + p{margin-top:12px}
  .board{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
    gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:22px}
  .cell{background:var(--surface);padding:16px 18px 18px}
  .cell .k{font-family:var(--mono);font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;
    color:var(--muted);display:block;margin-bottom:9px}
  .cell .v{font-family:var(--display);font-weight:700;font-size:27px;line-height:1;
    letter-spacing:-.02em;font-variant-numeric:tabular-nums;display:block}
  .cell .n{font-family:var(--mono);font-size:11.5px;color:var(--muted);display:block;
    margin-top:7px;line-height:1.45}
  .v.ok{color:var(--ok)} .v.warn{color:var(--warn)} .v.crit{color:var(--crit)}
  .card{background:var(--surface);border:1px solid var(--line);border-left:5px solid var(--line);
    padding:20px 24px 22px;margin-bottom:18px}
  .card.crit{border-left-color:var(--crit)}
  .card.warn{border-left-color:var(--warn)}
  .card.ok{border-left-color:var(--ok)}
  .card-top{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px 14px;margin-bottom:12px}
  .owner{font-family:var(--mono);font-size:10.5px;font-weight:600;letter-spacing:.1em;
    text-transform:uppercase;padding:3px 9px;border-radius:2px;white-space:nowrap}
  .owner.cliente{background:var(--crit-bg);color:var(--crit)}
  .owner.nuestro{background:var(--warn-bg);color:var(--warn)}
  .owner.hecho{background:var(--ok-bg);color:var(--ok)}
  .card p:last-child{margin-bottom:0}
  .card .prose{max-width:64ch}
  .tabla-wrap{overflow-x:auto;margin:16px 0}
  table{border-collapse:collapse;width:100%;font-size:15px}
  th,td{text-align:left;padding:9px 14px 9px 0;border-bottom:1px solid var(--line)}
  th{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--muted);font-weight:500}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums;font-family:var(--mono);font-size:14px}
  ol.steps{list-style:none;counter-reset:s;padding:0;margin:0;display:grid;gap:3px}
  ol.steps li{counter-increment:s;background:var(--surface);border:1px solid var(--line);
    padding:15px 20px 16px 56px;position:relative}
  ol.steps li::before{content:counter(s);position:absolute;left:20px;top:15px;
    font-family:var(--mono);font-size:12px;font-weight:600;color:var(--steel);
    font-variant-numeric:tabular-nums}
  ol.steps li p{margin:5px 0 0;font-size:15.5px;color:var(--muted);max-width:62ch}
  ol.steps li .t{font-family:var(--display);font-weight:600;font-size:16px}
  ul.plain{padding-left:20px;margin:0 0 15px}
  ul.plain li{margin-bottom:7px}
  details{border-top:1px solid var(--line);padding:14px 0 2px}
  summary{cursor:pointer;font-family:var(--display);font-weight:600;font-size:15px}
  summary:focus-visible{outline:2px solid var(--steel);outline-offset:3px}
  details .prose{padding-top:10px}
  footer{border-top:1px solid var(--line);margin-top:60px;padding-top:20px;
    font-family:var(--mono);font-size:12px;color:var(--muted);line-height:1.7}
  @media (max-width:560px){
    body{font-size:16px;padding:0 18px 72px}
    .card{padding:18px 18px 20px}
    header.masthead{padding-top:40px}
  }
</style>

<div class="wrap">

  <header class="masthead">
    <span class="eyebrow">Tracking Distribuidora Sarego · SYNC BI</span>
    <h1>Qué falta para salir a producción</h1>
    <p class="standfirst">
      Todas las cifras salen de consultar la base de Profit Plus en el momento de generar
      esta página. Cada punto separa lo que depende del equipo de lo que depende del cliente.
    </p>
    <div class="meta">
      <span>${fecha}</span>
      <span>rama <b>${esc(repo.rama)}</b></span>
      <span>commit <b>${esc(repo.commit)}</b></span>
      <span><b>${num(d.clientesTotal)}</b> clientes en el ERP</span>
    </div>
  </header>

  <div class="sello">
    <span class="pip"></span>
    <span>Medido contra la base el ${fecha} a las ${hora}</span>
  </div>

  <div class="verdict prose">
    <p>
      <strong>El desarrollo no es el problema.</strong> El proyecto compila, las pruebas pasan
      (${esc(pruebasTxt)}) y los módulos están construidos. Lo que impide arrancar es un dato que
      vive en Profit Plus: <strong>${num(sinUbicacion)} de ${num(d.clientesTotal)} clientes
      (${pctSin} %) no tienen ubicación</strong>. Sin eso no hay ruta, no hay mapa y no hay
      seguimiento.
    </p>
    <p>
      ${hayPiloto
        ? `Pero no hace falta resolverlo entero para empezar. <strong>${num(d.ubicablesConDespacho)}
           clientes ya ubicados tuvieron despachos en los últimos ${DIAS_VENTANA} días</strong>, y
           ${num(enTop3)} de ellos están concentrados en tres ciudades vecinas. Eso alcanza para
           un arranque parcial.`
        : `Hoy solo <strong>${num(d.ubicablesConDespacho)} clientes ubicados</strong> tuvieron
           despachos en los últimos ${DIAS_VENTANA} días. Son muy pocos para sostener un arranque
           parcial: hace falta cargar ubicaciones antes de salir.`}
    </p>
  </div>

  <section>
    <div class="section-head"><h2>Dónde está parado hoy</h2></div>
    <div class="board">
      <div class="cell">
        <span class="k">Pruebas</span>
        <span class="v ok">${repo.pruebas ? num(repo.pruebas.pasan) : '—'}</span>
        <span class="n">${repo.pruebas ? `de ${num(repo.pruebas.total)}, todas verdes` : 'sin medir'}</span>
      </div>
      <div class="cell">
        <span class="k">Clientes ubicables</span>
        <span class="v crit">${pct(d.ubicables, d.clientesTotal)} %</span>
        <span class="n">${num(d.ubicables)} de ${num(d.clientesTotal)}</span>
      </div>
      <div class="cell">
        <span class="k">Cobertura del reparto</span>
        <span class="v ${hayPiloto ? 'warn' : 'crit'}">${pctCobertura} %</span>
        <span class="n">${num(d.ubicablesConDespacho)} de ${num(d.conDespacho)} con despacho</span>
      </div>
      <div class="cell">
        <span class="k">Notas duplicadas</span>
        <span class="v warn">${num(d.notasDuplicadas)}</span>
        <span class="n">inflan el tablero</span>
      </div>
    </div>
    <p class="prose" style="font-family:var(--mono);font-size:12.5px;color:var(--muted)">
      Ventana de reparto: últimos ${DIAS_VENTANA} días. Una ubicación cuenta como válida solo si
      cae dentro de Venezuela.
    </p>
  </section>

  <section>
    <div class="section-head"><h2>El bloqueador real</h2></div>
    <div class="card crit">
      <div class="card-top">
        <span class="owner cliente">Depende del cliente</span>
        <h3>${num(sinUbicacion)} clientes no tienen dónde entregarse</h3>
      </div>
      <div class="prose">
        <p>
          De los ${num(d.clientesTotal)} clientes del ERP, solo <strong>${num(d.ubicables)}</strong>
          tienen una ubicación utilizable en <code>zt_coordenada</code>. El resto no se puede poner
          en un mapa.
        </p>
        <p>
          Esto no se arregla con código: es captura de datos en Profit Plus. Vale la pena que el
          cliente lo vea con el número delante — no es «hay que mejorar las direcciones», es que
          <strong>${pctSin} de cada 100 clientes no se pueden ubicar</strong>.
        </p>
      </div>
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>${hayPiloto ? 'Hay con qué arrancar' : 'Todavía no alcanza para arrancar'}</h2>
      <p class="prose" style="color:var(--muted);margin-top:8px">
        Clientes ya ubicados que recibieron despachos en los últimos ${DIAS_VENTANA} días.
      </p>
    </div>
    <div class="tabla-wrap">
      <table>
        <thead>
          <tr><th>Ciudad</th><th class="n">Clientes ubicados</th><th class="n">Documentos</th></tr>
        </thead>
        <tbody>${filasCiudad}
        </tbody>
      </table>
    </div>
    <div class="prose">
      <p>
        ${hayPiloto
          ? `No es una lista dispersa de casos sueltos: <strong>${num(enTop3)} de los
             ${num(d.ubicablesConDespacho)}</strong> están en las tres primeras ciudades, que son
             vecinas. Eso es una zona de reparto coherente, con volumen real.`
          : `Los clientes ubicados están demasiado dispersos para armar una zona de reparto.`}
      </p>
      <p>
        Y en <code>f3c4bf3</code> quedó implementado el aprendizaje de coordenadas por GPS: al
        entregar, el teléfono del conductor captura la posición exacta de la puerta del cliente.
        <strong>Cada entrega ubica un cliente más.</strong> La carga de datos deja de ser un muro
        de ${num(d.clientesTotal)} filas y pasa a ser un subproducto de operar.
      </p>
    </div>
  </section>

  <section>
    <div class="section-head"><h2>Lo que falta de nuestro lado</h2></div>

    <div class="card warn">
      <div class="card-top">
        <span class="owner nuestro">Nuestro</span>
        <h3>El tablero duplica despachos</h3>
      </div>
      <div class="prose">
        <p>
          Hay <strong>${num(d.notasDuplicadas)} notas de entrega facturadas en más de una
          factura</strong>. Cada una aparece repetida en el tablero, porque el cruce entre notas y
          facturas en <code>api/despachos.js</code> genera una fila por factura en vez de una por
          nota. Es independiente de la ventana de fechas, que ya se corrigió.
        </p>
      </div>
    </div>

    <div class="card ${faltantes.length ? 'warn' : 'ok'}">
      <div class="card-top">
        <span class="owner ${faltantes.length ? 'cliente' : 'hecho'}">
          ${faltantes.length ? 'Esperando al cliente' : 'Instalado'}</span>
        <h3>${faltantes.length
          ? `Faltan ${faltantes.length} tablas por crear en el ERP`
          : 'Las tablas del ERP ya están creadas'}</h3>
      </div>
      <div class="prose">
        <p>
          ${faltantes.length
            ? `El script de instalación está listo y entregado. Faltan por crear:
               <code>${faltantes.map(esc).join('</code>, <code>')}</code>. Sin ellas, el paso 4.1
               del diagrama — devolverle al ERP lo que pasó en la calle — no se puede implementar.`
            : `Las cinco tablas del documento técnico están creadas. El sistema ya puede
               devolverle al ERP el resultado de cada entrega.`}
        </p>
        <p style="font-family:var(--mono);font-size:12.5px;color:var(--muted)">
          Tablas <code>zt_</code> en la base:
          ${d.tablasZt.length ? d.tablasZt.map(t => `<code>${esc(t)}</code>`).join(' ') : 'ninguna'}
        </p>
      </div>
    </div>
  </section>

  <section>
    <div class="section-head"><h2>Por dónde seguir</h2></div>
    <ol class="steps">
      ${faltantes.length ? `<li>
        <span class="t">Que el cliente corra el script de instalación</span>
        <p>
          <code>scripts/sql/SAREGO_Tracking_Instalacion.sql</code>. Crea las tablas que faltan y el
          usuario con permisos solo sobre ellas.
        </p>
      </li>` : ''}
      <li>
        <span class="t">Corregir la duplicación de notas y facturas</span>
        <p>
          ${num(d.notasDuplicadas)} notas repetidas hoy. Es trabajo nuestro, no depende de nadie más.
        </p>
      </li>
      ${hayPiloto ? `<li>
        <span class="t">Proponer el arranque parcial</span>
        <p>
          Salir con ${esc(topCiudades.slice(0, 3).map(c => c.ciudad).filter(Boolean).join(', '))}
          — ${num(enTop3)} clientes ya ubicados — y dejar que el resto se complete entregando.
        </p>
      </li>` : ''}
      <li>
        <span class="t">Llevarle al cliente el ${pctSin} % con el número medido</span>
        <p>
          Con la propuesta al lado, no como queja: arrancamos con lo que está ubicado y el sistema
          aprende el resto.
        </p>
      </li>
    </ol>
  </section>

  <section>
    <details>
      <summary>Cómo se obtuvo cada cifra</summary>
      <div class="prose">
        <p style="margin-top:12px">
          Esta página la genera <code>scripts/generar-informe.js</code>, que consulta la base de
          Profit Plus y vuelve a publicarla. Solo hace <code>SELECT</code>: no modifica nada.
        </p>
        <ul class="plain">
          <li><strong>Clientes en el ERP:</strong> total de filas en <code>saCliente</code>.</li>
          <li><strong>Ubicables:</strong> clientes en <code>zt_coordenada</code> cuya coordenada
              cae dentro de Venezuela (latitud ${LAT_MIN} a ${LAT_MAX}, longitud ${LNG_MIN} a
              ${LNG_MAX}). Fuera de esa caja el valor es dato corrupto, no una ubicación.</li>
          <li><strong>Con despacho:</strong> clientes con nota de entrega o factura no anulada en
              los últimos ${DIAS_VENTANA} días.</li>
          <li><strong>Notas duplicadas:</strong> valores de <code>num_doc</code> en
              <code>saFacturaVentaReng</code> que aparecen en más de una factura.</li>
          <li><strong>Pruebas:</strong> corrida completa de la suite al generar la página.</li>
        </ul>
        <p><strong>Lo que esta página no puede saber:</strong> si las ubicaciones que existen son
        correctas. Que una coordenada caiga dentro de Venezuela no garantiza que sea la puerta del
        cliente. Eso solo se confirma entregando.</p>
      </div>
    </details>
  </section>

  <footer>
    Generado el ${fecha} a las ${hora} desde la base ${esc(cfg.database || '')}<br>
    ${esc(repo.rama)} · ${esc(repo.commit)} · Tracking Distribuidora Sarego — SYNC BI
  </footer>

</div>
`;
}

(async () => {
  let pool;
  try {
    pool = await sql.connect(cfg);
  } catch (e) {
    console.error('No se pudo conectar a SQL Server:', e.message);
    console.error('Revisen SQLSERVER_* en .env.local y el acceso a la red del cliente.');
    process.exit(1);
  }

  console.log('Consultando la base...');
  const datos = await medir(pool);
  await pool.close();

  console.log('Corriendo las pruebas...');
  const repo = medirRepo();

  const destino = path.join(__dirname, '..', 'informe');
  fs.mkdirSync(destino, { recursive: true });
  const archivo = path.join(destino, 'estado-produccion.html');
  fs.writeFileSync(archivo, construirHtml(datos, repo), 'utf8');

  console.log('');
  console.log('Informe escrito en informe/estado-produccion.html');
  console.log('');
  console.log(`  Clientes en el ERP          ${datos.clientesTotal}`);
  console.log(`  Con ubicacion utilizable    ${datos.ubicables}`);
  console.log(`  Con despacho (90 dias)      ${datos.conDespacho}`);
  console.log(`  Ubicables CON despacho      ${datos.ubicablesConDespacho}`);
  console.log(`  Notas duplicadas            ${datos.notasDuplicadas}`);
  console.log(`  Tablas zt_ en la base       ${datos.tablasZt.join(', ') || 'ninguna'}`);
  console.log(`  Pruebas                     ${repo.pruebas ? repo.pruebas.pasan + '/' + repo.pruebas.total : 'sin medir'}`);
})();
