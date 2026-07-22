const endpoints = [
  ['Core', 'Pokédex completa', 'v1/pokedex.json', 'Especies, formas, tipos, movimientos y combate.'],
  ['Core', 'Pokémon individual', 'v1/pokemon/25.json', 'Documento ligero por número de Pokédex.'],
  ['Core', 'Formas', 'v1/forms.json', 'Formas regionales, especiales y disfraces.'],
  ['Core', 'Tipos', 'v1/types.json', 'Catálogo de los 18 tipos.'],
  ['Core', 'Efectividad', 'v1/type-effectiveness.json', 'Matriz de multiplicadores ofensivos y defensivos.'],
  ['Combate', 'Movimientos', 'v1/moves.json', 'Datos PvE, PvP, energía, turnos y buffs.'],
  ['Combate', 'Estadísticas', 'v1/combat.json', 'CP máximo, bulk y producto estadístico.'],
  ['Combate', 'Rankings', 'v1/rankings.json', 'Top por ataque, defensa, stamina, bulk y CP.'],
  ['Evolución', 'Evoluciones', 'v1/evolutions.json', 'Relaciones y costes de evolución.'],
  ['Evolución', 'Familias', 'v1/families.json', 'Familias completas y sus rutas.'],
  ['Evolución', 'Megaevoluciones', 'v1/temporary-evolutions.json', 'Estadísticas y costes de Mega Energy.'],
  ['Evolución', 'Gigamax', 'v1/gigantamax.json', 'Pokémon y movimientos Gigamax.'],
  ['Mundo', 'Objetos', 'v1/items.json', 'Objetos, categorías y nivel requerido.'],
  ['Mundo', 'Clima', 'v1/weather.json', 'Climas y tipos potenciados.'],
  ['Mundo', 'Incursiones', 'v1/raids.json', 'Catálogo de niveles de incursión.'],
  ['Mundo', 'Invasiones Rocket', 'v1/invasions.json', 'Equipos y encuentros del Team GO Rocket.'],
  ['Mundo', 'Disfraces', 'v1/costumes.json', 'Disfraces y restricciones de evolución.'],
  ['Mundo', 'Location Cards', 'v1/location-cards.json', 'Tarjetas de ubicación y recursos asociados.'],
  ['Misiones', 'Tipos de misión', 'v1/quest-types.json', 'Catálogo de acciones de investigación.'],
  ['Misiones', 'Condiciones', 'v1/quest-conditions.json', 'Condiciones aplicables a misiones.'],
  ['Misiones', 'Recompensas', 'v1/quest-reward-types.json', 'Tipos de recompensa disponibles.'],
  ['Sistema', 'Equipos', 'v1/teams.json', 'Equipos definidos por el juego.'],
  ['Sistema', 'Tipos de ruta', 'v1/route-types.json', 'Catálogo de rutas.'],
  ['Sistema', 'Idiomas', 'v1/translations.json', 'Manifiesto de traducciones disponibles.'],
  ['Sistema', 'Metadatos', 'v1/meta.json', 'Versión, fuente, fecha y cantidades.'],
] as const

function endpointCards() {
  return endpoints.map(([category, name, path, description]) => `
    <article class="endpoint" data-search="${category} ${name} ${path} ${description}">
      <div class="endpoint-top"><span class="tag">${category}</span><span class="method">GET</span></div>
      <h3>${name}</h3><p>${description}</p>
      <div class="url"><a href="${path}" target="_blank" rel="noreferrer"><code>/${path}</code></a><button class="copy" data-copy="${path}" aria-label="Copiar /${path}">Copiar</button></div>
    </article>`).join('')
}

export function docsHtml() {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="API JSON estática, abierta y versionada de datos de Pokémon GO.">
<title>PoGo Data API — Documentación</title>
<style>
:root{--bg:#07111f;--panel:#0d1a2c;--panel2:#101f34;--line:#203451;--text:#eef6ff;--muted:#91a5bf;--blue:#62a8ff;--cyan:#55e6c1;--violet:#9b87ff;--shadow:0 24px 70px #0006;color-scheme:dark}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 78% -10%,#183b68 0,transparent 34%),radial-gradient(circle at 12% 15%,#173349 0,transparent 25%),var(--bg);color:var(--text);font:15px/1.6 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:inherit;text-decoration:none}button,input{font:inherit}.wrap{width:min(1160px,calc(100% - 36px));margin:auto}
header{height:70px;display:flex;align-items:center;border-bottom:1px solid #ffffff12;position:sticky;top:0;z-index:5;background:#07111fd9;backdrop-filter:blur(16px)}nav{display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{font-weight:850;letter-spacing:-.03em;font-size:18px}.brand i{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--cyan);box-shadow:0 0 20px var(--cyan);margin-right:10px}.navlinks{display:flex;gap:24px;color:var(--muted);font-size:14px}.navlinks a:hover{color:var(--text)}
.hero{padding:92px 0 70px;position:relative}.eyebrow{display:inline-flex;align-items:center;gap:9px;border:1px solid #55e6c150;background:#55e6c10d;color:#8af3d8;border-radius:999px;padding:6px 12px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.09em}.pulse{width:7px;height:7px;border-radius:50%;background:var(--cyan);box-shadow:0 0 0 5px #55e6c118}
h1{font-size:clamp(46px,8vw,82px);line-height:.98;letter-spacing:-.065em;margin:25px 0 23px;max-width:900px}.gradient{background:linear-gradient(100deg,#fff 10%,var(--blue) 55%,var(--cyan));-webkit-background-clip:text;color:transparent}.lead{font-size:19px;color:var(--muted);max-width:690px;margin:0 0 33px}.actions{display:flex;gap:12px;flex-wrap:wrap}.btn{border:1px solid var(--line);padding:11px 17px;border-radius:10px;font-weight:750;background:#ffffff08;cursor:pointer;color:var(--text)}.btn.primary{background:linear-gradient(120deg,#3a82ee,#6557d8);border-color:transparent;box-shadow:0 10px 28px #3a82ee35}.btn:hover{transform:translateY(-1px);border-color:#52739e}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:58px}.stat{background:linear-gradient(145deg,#ffffff0b,#ffffff04);border:1px solid #ffffff14;border-radius:14px;padding:19px}.stat strong{font-size:27px;display:block;letter-spacing:-.04em}.stat span{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em}
section{padding:58px 0}.section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:25px}.section-head h2{font-size:32px;letter-spacing:-.04em;margin:0}.section-head p{color:var(--muted);margin:5px 0 0}.search{width:min(330px,100%);padding:12px 14px;border-radius:10px;border:1px solid var(--line);background:#081423;color:var(--text);outline:none}.search:focus{border-color:var(--blue);box-shadow:0 0 0 3px #62a8ff18}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.endpoint{background:linear-gradient(145deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:14px;padding:18px;min-width:0;transition:.2s ease}.endpoint:hover{border-color:#3c5d86;transform:translateY(-2px);box-shadow:var(--shadow)}.endpoint-top{display:flex;justify-content:space-between}.tag{font-size:11px;color:#b7c9df;background:#ffffff0a;padding:3px 8px;border-radius:999px}.method{font:bold 11px ui-monospace,SFMono-Regular,monospace;color:var(--cyan)}.endpoint h3{margin:15px 0 4px;font-size:17px}.endpoint p{color:var(--muted);margin:0 0 16px;min-height:48px}.url{display:flex;align-items:center;gap:8px;background:#06101d;border:1px solid #1b304c;border-radius:8px;padding:7px 7px 7px 10px}.url code{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#a9c9f4;font-size:12px}.copy{margin-left:auto;border:0;background:#1a2d47;color:#cce1fb;border-radius:6px;padding:5px 8px;cursor:pointer;font-size:11px}.copy:hover{background:#29486f}.copy.done{background:#154b41;color:#8af3d8}
.quick{display:grid;grid-template-columns:1fr 1fr;gap:15px}.codebox{background:#050d18;border:1px solid var(--line);border-radius:14px;overflow:hidden}.codehead{display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--line);color:var(--muted);font-size:12px}.codebox pre{margin:0;padding:20px;overflow:auto;color:#b9d4f7;font:13px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace}.architecture{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.step{border-left:2px solid var(--violet);background:#ffffff06;padding:17px;border-radius:0 12px 12px 0}.step b{display:block;margin-bottom:5px}.step span{color:var(--muted)}
footer{border-top:1px solid #ffffff12;padding:34px 0 50px;color:var(--muted)}.footerline{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.hidden{display:none!important}
@media(max-width:850px){.grid{grid-template-columns:repeat(2,1fr)}.quick{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}.architecture{grid-template-columns:1fr}.navlinks{display:none}}
@media(max-width:560px){.grid{grid-template-columns:1fr}.section-head{align-items:stretch;flex-direction:column}.search{width:100%}.hero{padding-top:62px}h1{font-size:47px}.stats{grid-template-columns:1fr 1fr}.stat strong{font-size:22px}}
</style></head><body>
<header><nav class="wrap"><a class="brand" href="#top"><i></i>PoGo Data API</a><div class="navlinks"><a href="#endpoints">Endpoints</a><a href="#quickstart">Inicio rápido</a><a href="v1/meta.json">Estado</a></div></nav></header>
<main id="top"><div class="hero wrap"><span class="eyebrow"><span class="pulse"></span>API operativa · v1</span><h1>Datos de Pokémon GO,<br><span class="gradient">listos para construir.</span></h1><p class="lead">Una API JSON abierta, rápida y versionada. Sin claves, sin servidor y con actualizaciones automáticas desde GitHub Actions.</p><div class="actions"><a class="btn primary" href="#endpoints">Explorar endpoints</a><button class="btn" data-copy="">Copiar URL base</button></div>
<div class="stats"><div class="stat"><strong id="pokemonCount">—</strong><span>Pokémon</span></div><div class="stat"><strong id="formsCount">—</strong><span>Formas</span></div><div class="stat"><strong id="movesCount">—</strong><span>Movimientos</span></div><div class="stat"><strong id="updatedAt">—</strong><span>Última actualización</span></div></div></div>
<section id="endpoints"><div class="wrap"><div class="section-head"><div><h2>Catálogo de endpoints</h2><p>Todo se sirve como JSON estático con rutas estables bajo <code>/v1</code>.</p></div><input id="search" class="search" type="search" placeholder="Buscar Pokémon, combate, clima…" aria-label="Buscar endpoints"></div><div id="endpointGrid" class="grid">${endpointCards()}</div></div></section>
<section id="quickstart"><div class="wrap"><div class="section-head"><div><h2>Inicio rápido</h2><p>Consume los datos desde cualquier proyecto web o backend.</p></div></div><div class="quick"><div class="codebox"><div class="codehead"><span>JavaScript</span><button class="copy" data-code="jsExample">Copiar</button></div><pre id="jsExample">const response = await fetch(
  'https://gaelvm.github.io/pogo-data-api/v1/pokemon/25.json'
)
const pikachu = await response.json()
console.log(pikachu.forms)</pre></div><div class="codebox"><div class="codehead"><span>curl</span><button class="copy" data-code="curlExample">Copiar</button></div><pre id="curlExample">curl https://gaelvm.github.io/pogo-data-api/v1/meta.json</pre></div></div></div></section>
<section><div class="wrap"><div class="section-head"><div><h2>Diseñada para permanecer disponible</h2><p>El cliente nunca depende directamente de las fuentes de generación.</p></div></div><div class="architecture"><div class="step"><b>1. Generación</b><span>GitHub Actions obtiene y valida un snapshot completo.</span></div><div class="step"><b>2. Normalización</b><span>Los datos se transforman a un esquema propio y versionado.</span></div><div class="step"><b>3. Distribución</b><span>GitHub Pages entrega JSON globalmente, sin autenticación.</span></div></div></div></section></main>
<footer><div class="wrap footerline"><span>PoGo Data API · Proyecto comunitario no afiliado</span><span id="datasetVersion">Dataset —</span></div></footer>
<script>
const base=new URL('./',location.href);const absolute=p=>new URL(p,base).href;
async function copy(text,button){try{await navigator.clipboard.writeText(text);const old=button.textContent;button.textContent='Copiado ✓';button.classList.add('done');setTimeout(()=>{button.textContent=old;button.classList.remove('done')},1500)}catch{prompt('Copia esta URL:',text)}}
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>copy(absolute(b.dataset.copy),b)));
document.querySelectorAll('[data-code]').forEach(b=>b.addEventListener('click',()=>copy(document.getElementById(b.dataset.code).textContent,b)));
document.getElementById('search').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll('.endpoint').forEach(card=>card.classList.toggle('hidden',!card.dataset.search.toLowerCase().includes(q)))});
fetch('v1/meta.json').then(r=>r.json()).then(m=>{document.getElementById('pokemonCount').textContent=(m.counts.pokemon||0).toLocaleString('es');document.getElementById('formsCount').textContent=(m.counts.forms||0).toLocaleString('es');document.getElementById('movesCount').textContent=(m.counts.moves||0).toLocaleString('es');document.getElementById('updatedAt').textContent=new Date(m.generatedAt).toLocaleDateString('es',{day:'2-digit',month:'short',year:'numeric'});document.getElementById('datasetVersion').textContent='Dataset '+m.datasetVersion}).catch(()=>{});
</script></body></html>`
}
