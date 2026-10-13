const API='https://v3.football.api-sports.io';
const $=id=>document.getElementById(id);
const todayLocal=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
$('matchDate').value=todayLocal();
let fixtures=[];
const storedKey=()=>localStorage.getItem('fa_api_key')||'';
function status(msg,kind=''){ $('status').textContent=msg; $('status').className='status '+kind; }
function safe(s){return String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function api(path){
 const key=storedKey(); if(!key) throw new Error('Falta la clave API. Abre Ajustes ⚙ y guárdala.');
 const r=await fetch(API+path,{headers:{'x-apisports-key':key}});
 if(!r.ok) throw new Error(`API respondió HTTP ${r.status}. Comprueba la clave o el límite de consultas.`);
 const j=await r.json();
 if(j.errors && Object.keys(j.errors).length) throw new Error(JSON.stringify(j.errors));
 return j.response||[];
}
async function loadMatches(){
 $('matches').innerHTML='';
 status('Consultando partidos…');
 try{
  const date=$('matchDate').value||todayLocal();
  let path=`/fixtures?date=${encodeURIComponent(date)}&timezone=Europe%2FMadrid`;
  const all=await api(path);
  const league=$('leagueFilter').value;
  fixtures=all.filter(f=>league==='all'||String(f.league.id)===league);
  fixtures.sort((a,b)=>new Date(a.fixture.date)-new Date(b.fixture.date));
  if(!fixtures.length){$('matches').innerHTML='<div class="empty">No hay partidos devueltos para esta fecha y filtro.</div>';status(`Consulta completada: 0 partidos · ${date}`,'ok');return;}
  $('matches').innerHTML=fixtures.map(f=>{
   const t=new Date(f.fixture.date);
   const time=t.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'});
   const score=(f.goals.home==null?'':`${f.goals.home} - ${f.goals.away}`);
   return `<article class="match" id="m-${f.fixture.id}"><div class="league">${safe(f.league.name)} · ${safe(f.league.country||'')}</div><div class="teams"><div class="team">${safe(f.teams.home.name)}</div><div class="vs">${score||time}</div><div class="team">${safe(f.teams.away.name)}</div></div><div class="matchmeta"><span>${safe(f.fixture.status.long)}</span><span>Árbitro: ${safe(f.fixture.referee||'No disponible')}</span></div><button class="primary" data-analyze="${f.fixture.id}">Analizar tarjetas y córners</button><div id="a-${f.fixture.id}"></div></article>`;
  }).join('');
  status(`${fixtures.length} partidos · ${date}. El análisis detallado consulta datos adicionales.`,'ok');
 }catch(e){status(e.message,'error');$('matches').innerHTML='<div class="empty">No se han podido cargar los partidos. Revisa la clave, conexión y cuota diaria.</div>';}
}
function getStat(stats, name){const x=stats.find(s=>String(s.type).toLowerCase()===name.toLowerCase());return x?.value==null?null:Number(String(x.value).replace('%',''));}
async function fixtureStats(id){
 const r=await api(`/fixtures/statistics?fixture=${id}`);
 const out={};
 for(const x of r){const teamId=x.team?.id;out[teamId]={name:x.team?.name,corners:getStat(x.statistics,'Corner Kicks'),yellow:getStat(x.statistics,'Yellow Cards'),red:getStat(x.statistics,'Red Cards'),fouls:getStat(x.statistics,'Fouls')};}
 return out;
}
const avg=arr=>{const nums=arr.filter(x=>Number.isFinite(x));return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null};
const fmt=n=>n==null?'N/D':n.toFixed(1);
async function lastMatches(teamId, season, venue){
 let q=`/fixtures?team=${teamId}&last=5&season=${season}`;
 if(venue) q+=`&venue=${venue}`;
 return api(q);
}
async function teamHistory(fxs, teamId){
 const vals=[];
 for(const f of fxs){
  try{const s=await fixtureStats(f.fixture.id);const x=s[teamId];if(x) vals.push({date:f.fixture.date,home:f.teams.home.name,away:f.teams.away.name,score:`${f.goals.home??'-'}-${f.goals.away??'-'}`,corners:x.corners,yellow:x.yellow,red:x.red});}
  catch(e){vals.push({date:f.fixture.date,home:f.teams.home.name,away:f.teams.away.name,score:`${f.goals.home??'-'}-${f.goals.away??'-'}`,corners:null,yellow:null,red:null});}
 }
 return vals;
}
function renderHistory(title, rows){
 const c=rows.map(x=>`<div class="recent"><span>${safe(new Date(x.date).toLocaleDateString('es-ES'))} · ${safe(x.home)}–${safe(x.away)} (${safe(x.score)})</span><span>C ${x.corners??'—'} · A ${x.yellow??'—'} · R ${x.red??'—'}</span></div>`).join('');
 return `<h4>${safe(title)}</h4><div class="recentlist">${c||'<div class="muted small">Sin datos disponibles.</div>'}</div>`;
}
async function analyze(id){
 const f=fixtures.find(x=>String(x.fixture.id)===String(id)); if(!f)return;
 const target=$(`a-${id}`); if(!target)return;
 target.innerHTML='<div class="analysis muted">Calculando… puede consumir varias consultas de API.</div>';
 try{
  const season=f.league.season || new Date(f.fixture.date).getFullYear();
  const homeFx=await lastMatches(f.teams.home.id,season,'home');
  const awayFx=await lastMatches(f.teams.away.id,season,'away');
  const h2h=await api(`/fixtures/headtohead?h2h=${f.teams.home.id}-${f.teams.away.id}&last=5`);
  const homeRows=await teamHistory(homeFx,f.teams.home.id);
  const awayRows=await teamHistory(awayFx,f.teams.away.id);
  const h2hRows=await Promise.all(h2h.slice(0,5).map(async x=>{
   try{const s=await fixtureStats(x.fixture.id);const a=s[x.teams.home.id]||{},b=s[x.teams.away.id]||{};return {date:x.fixture.date,home:x.teams.home.name,away:x.teams.away.name,score:`${x.goals.home??'-'}-${x.goals.away??'-'}`,corners:(a.corners==null||b.corners==null)?null:a.corners+b.corners,yellow:(a.yellow==null||b.yellow==null)?null:a.yellow+b.yellow,red:(a.red==null||b.red==null)?null:a.red+b.red};}
   catch(e){return {date:x.fixture.date,home:x.teams.home.name,away:x.teams.away.name,score:`${x.goals.home??'-'}-${x.goals.away??'-'}`,corners:null,yellow:null,red:null};}
  }));
  const avgbox=(label,rows)=>`<div class="statbox"><span>${safe(label)} · media</span><strong>${fmt(avg(rows.map(x=>x.corners)))}</strong><span>Córners</span><strong>${fmt(avg(rows.map(x=>x.yellow)))}</strong><span>Amarillas</span><strong>${fmt(avg(rows.map(x=>x.red)))}</strong><span>Rojas</span></div>`;
  target.innerHTML=`<div class="analysis"><h3>Resumen estadístico</h3><div class="statgrid">${avgbox('Local en casa',homeRows)}${avgbox('Visitante fuera',awayRows)}${avgbox('H2H total',h2hRows)}</div>${renderHistory('Últimos partidos del local en casa',homeRows)}${renderHistory('Últimos partidos del visitante fuera',awayRows)}${renderHistory('Últimos enfrentamientos directos (totales)',h2hRows)}<p class="muted small">N/D significa que el proveedor no facilitó ese dato. El histórico usa la temporada devuelta por la API y puede no cruzar temporadas.</p></div>`;
 }catch(e){target.innerHTML=`<div class="analysis status error">${safe(e.message)}</div>`;}
}
$('loadBtn').addEventListener('click',loadMatches);
$('leagueFilter').addEventListener('change',loadMatches);
$('matches').addEventListener('click',e=>{const b=e.target.closest('[data-analyze]');if(b){b.disabled=true;b.textContent='Analizando…';analyze(b.dataset.analyze).finally(()=>{b.disabled=false;b.textContent='Actualizar análisis';});}});
$('settingsBtn').addEventListener('click',()=>{$('apiKey').value=storedKey();$('settingsDialog').showModal();});
$('showKey').addEventListener('change',e=>$('apiKey').type=e.target.checked?'text':'password');
$('clearKey').addEventListener('click',()=>{localStorage.removeItem('fa_api_key');$('apiKey').value='';status('Clave borrada del navegador.');});
$('settingsForm').addEventListener('submit',e=>{if(e.submitter?.id==='saveKey'){e.preventDefault();localStorage.setItem('fa_api_key',$('apiKey').value.trim());$('settingsDialog').close();status('Clave guardada en este navegador. Pulsa Cargar para probar.','ok');}});
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
if(storedKey()) loadMatches();
