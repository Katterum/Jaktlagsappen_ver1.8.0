/* Jaktlaget v1.8.0 additions */
'use strict';
(() => {
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const monthName=d=>d.toLocaleDateString('sv-SE',{month:'long',year:'numeric'});
  const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  let calCursor=new Date(); calCursor.setDate(1);
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

  function homeCalendar(){
    const host=q('#homeCalendar'); if(!host)return;
    const today=new Date(), start=new Date(today.getFullYear(),today.getMonth(),1), first=(start.getDay()+6)%7, days=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
    const events=db.events||[];
    let cells='<span></span>'.repeat(first);
    for(let day=1;day<=days;day++){
      const date=ymd(new Date(today.getFullYear(),today.getMonth(),day)), n=events.filter(x=>x.date===date).length;
      cells+=`<button class="miniDay ${date===ymd(today)?'today':''} ${n?'hasEvent':''}" data-home-date="${date}"><b>${day}</b>${n?`<i>${n}</i>`:''}</button>`;
    }
    const upcoming=events.filter(x=>x.date>=ymd(today)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
    host.innerHTML=`<div class="miniCalHead"><b>${monthName(today)}</b><button class="textLink" data-module="calendar">Öppna</button></div><div class="weekHead">${['M','T','O','T','F','L','S'].map(x=>`<span>${x}</span>`).join('')}</div><div class="miniGrid">${cells}</div><div class="homeUpcoming">${upcoming.map(x=>`<div><b>${x.date.slice(5)}</b><span>${e(x.title)}</span></div>`).join('')||'<small>Inga kommande aktiviteter.</small>'}</div>`;
    qa('#homeCalendar [data-module]').forEach(b=>b.onclick=()=>openFeature('calendar'));
  }
  const oldHome=window.renderHome;
  window.renderHome=function(){oldHome();if(!q('#homeCalendarCard')){const chat=q('#homeChat')?.closest('.card');chat?.insertAdjacentHTML('afterend','<div id="homeCalendarCard" class="card homeUpdate"><div id="homeCalendar"></div></div>')}homeCalendar()};

  function shooterStats(){
    const host=q('#shooterStats'); if(!host)return;
    const year=q('#statsYear')?.value||db.activeYear;
    const animals=db.animals.filter(a=>a.year===year&&!a.discarded);
    const names=[...new Set(animals.map(a=>a.shooter||'Ej angivet'))].sort((a,b)=>a.localeCompare(b,'sv'));
    host.innerHTML=names.map(name=>{
      const mine=animals.filter(a=>(a.shooter||'Ej angivet')===name);
      const species=[...mainSpecies,...[...new Set(mine.filter(a=>a.species==='Annat').map(a=>a.otherSpecies||'Övrigt'))]];
      const rows=species.map(sp=>{const arr=mine.filter(a=>(a.species==='Annat'?(a.otherSpecies||'Övrigt'):a.species)===sp),adult=arr.filter(a=>a.age==='Vuxen').length,young=arr.filter(a=>a.age==='Ungdjur').length;return arr.length?`<div class="summaryRow"><span>${e(sp)}</span><span>${adult}</span><span>${young}</span><b>${arr.length}</b></div>`:''}).join('');
      const adult=mine.filter(a=>a.age==='Vuxen').length,young=mine.filter(a=>a.age==='Ungdjur').length;
      return `<section class="shooterBlock"><h3>${e(name)}</h3><div class="summaryRow head"><b>Djurslag</b><b>Vuxen</b><b>Ungdjur</b><b>Totalt</b></div>${rows}<div class="summaryRow total"><b>Totalt</b><b>${adult}</b><b>${young}</b><b>${mine.length}</b></div></section>`;
    }).join('')||'<p class="muted">Inga fällda djur för valt jaktår.</p>';
  }
  const oldStats=window.renderStats;
  window.renderStats=function(){oldStats();if(!q('#shooterStatsCard'))q('#speciesSummary')?.closest('.card')?.insertAdjacentHTML('afterend','<div id="shooterStatsCard" class="card"><h2>Skjutna djur per skytt</h2><div id="shooterStats"></div></div>');shooterStats()};

  window.renderMoreMenu=function(){
    const groups=[
      ['Registrering och planering',[['hunts','Genomförda jakter','Registrera, ändra och visa jakter'],['observations','Viltobservationer','Registrera, ändra och visa observationer'],['map','Viltobservationer på karta','Observationer, spårtecken och punktprognos'],['allocator','Tilldela pass','Slumpa deltagare till valda pass'],['calendar','Kalender','Aktiviteter och planering'],['info','Information','Jaktlagets information'],['chat','Chatt','Lokala meddelanden']]],
      ['Karta, pass och väder',[['passdistribution','Passfördelning','Passplacering och jaktprognos'],['passview','Passöversikt','Skjutet, observationer och jaktformer'],['weathercenter','Väderprognos','Detaljerat väder för markens centrumpunkt']]],
      ['Statistik och uppföljning',[['huntstats','Jaktstatistik','Vak-, pyrsch- och drevjakt'],['obsstats','Observationsstatistik','Observationer och flockstorlek'],['goals','Avskjutningsmål','Mål och ackumulerad tidslinje'],['discards','Kassation och övrigt vilt','Separat sidoinformation']]]
    ];
    q('#moreMenu').innerHTML=groups.map(g=>`<section class="moreGroup"><h2>${g[0]}</h2>${g[1].map(x=>`<button data-module="${x[0]}"><b>${x[1]}</b><span>${x[2]}</span></button>`).join('')}</section>`).join('');
    qa('#moreMenu [data-module]').forEach(x=>x.onclick=()=>x.dataset.module==='allocator'?allocator():openFeature(x.dataset.module));
  };

  window.allocator=function(){
    go('feature'); shell('Tilldela pass',`<p class="muted">Välj alla som är på plats och de pass som ska bemannas. Tillfälliga namn påverkar inte medlems- eller passregistret.</p>
    <fieldset><legend>Deltagare</legend><div class="checkGrid">${db.members.filter(m=>m.active!==false).map(m=>`<label class="toggle"><input type="checkbox" data-alloc-member value="${e(m.name)}">${e(m.name)}</label>`).join('')}</div><label>Lösa namn, ett per rad<textarea id="allocGuests" placeholder="Gäst eller annan deltagare"></textarea></label></fieldset>
    <fieldset><legend>Pass och uppgifter</legend><div class="checkGrid">${db.passes.filter(p=>p.active).map(p=>`<label class="toggle"><input type="checkbox" data-alloc-pass value="${e(p.name)}">${e(p.name)}</label>`).join('')}</div><label>Andra pass eller uppgifter, ett per rad<textarea id="allocExtraPasses" placeholder="Hundförare\nReserv\nEget passnamn"></textarea></label></fieldset>
    <div class="allocatorActions"><button id="allocRun">Slumpa pass</button><button id="allocReset" class="danger">Avbryt och nollställ</button></div><div id="allocResult"></div>`);
    q('#allocRun').onclick=runAllocation;q('#allocReset').onclick=allocator;
  };
  function lines(id){return q(id).value.split('\n').map(x=>x.trim()).filter(Boolean)}
  function runAllocation(){
    let people=qa('[data-alloc-member]:checked').map(x=>x.value).concat(lines('#allocGuests')),passes=qa('[data-alloc-pass]:checked').map(x=>x.value).concat(lines('#allocExtraPasses'));
    if(!people.length||!passes.length)return toast('Välj minst en deltagare och ett pass');
    people=shuffle(people);passes=shuffle(passes);const n=Math.max(people.length,passes.length),rows=[];
    for(let i=0;i<n;i++)rows.push({pass:passes[i%passes.length],person:people[i]||'Obemannat'});
    q('#allocResult').innerHTML=`<h3>Fördelningslista</h3><div class="allocationList">${rows.map(r=>`<div><b>${e(r.pass)}</b><span>${e(r.person)}</span></div>`).join('')}</div><div class="allocatorActions"><button id="allocAgain">Slumpa om</button><button id="allocCopy" class="secondary">Kopiera lista</button><button id="allocCancel" class="danger">Avbryt och nollställ</button></div>`;
    q('#allocAgain').onclick=runAllocation;q('#allocCancel').onclick=allocator;q('#allocCopy').onclick=async()=>{await navigator.clipboard.writeText(rows.map(r=>`${r.pass}: ${r.person}`).join('\n'));toast('Listan kopierades')};
  }

  window.calendar=function(){go('feature');drawCalendar()};
  function drawCalendar(selected=''){
    const events=db.events||[], y=calCursor.getFullYear(),m=calCursor.getMonth(), first=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate();
    let cells='<span class="blank"></span>'.repeat(first);
    for(let d=1;d<=days;d++){const date=ymd(new Date(y,m,d)),ev=events.filter(x=>x.date===date);cells+=`<button class="calDay ${date===ymd(new Date())?'today':''} ${date===selected?'selected':''}" data-date="${date}"><b>${d}</b>${ev.length?`<i>${ev.length}</i>`:''}</button>`}
    const chosen=selected?events.filter(x=>x.date===selected):events.filter(x=>x.date>=ymd(new Date())).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);
    shell('Kalender',`<div class="calendarHead"><button id="calPrev" class="secondary">‹</button><h2>${monthName(calCursor)}</h2><button id="calNext" class="secondary">›</button></div><div class="weekHead">${['Mån','Tis','Ons','Tor','Fre','Lör','Sön'].map(x=>`<span>${x}</span>`).join('')}</div><div class="monthGrid">${cells}</div><h3>${selected?'Aktiviteter '+selected:'Kommande aktiviteter'}</h3><div class="calendarList">${chosen.map(x=>`<div class="calendarCard"><div><b>${x.date}</b><span>${e(x.title)}</span></div><button class="danger" onclick="deleteEvent('${x.id}')">Radera</button></div>`).join('')||'<p class="muted">Inga aktiviteter.</p>'}</div><div class="stackForm calendarForm"><label>Datum<input id="eventDate" type="date" value="${selected||ymd(new Date())}"></label><label>Aktivitet<input id="eventTitle" placeholder="Aktivitet"></label><button id="addEvent">Lägg till</button></div>`);
    q('#calPrev').onclick=()=>{calCursor.setMonth(calCursor.getMonth()-1);drawCalendar()};q('#calNext').onclick=()=>{calCursor.setMonth(calCursor.getMonth()+1);drawCalendar()};qa('[data-date]').forEach(b=>b.onclick=()=>drawCalendar(b.dataset.date));
    q('#addEvent').onclick=()=>{if(q('#eventDate').value&&q('#eventTitle').value.trim()){db.events.push({id:uid('event'),date:q('#eventDate').value,title:q('#eventTitle').value.trim()});save();drawCalendar(q('#eventDate').value)}};
  }
  const oldDelete=window.deleteEvent;window.deleteEvent=id=>{if(confirm('Radera aktiviteten?')){db.events=db.events.filter(x=>x.id!==id);save();drawCalendar()}};

  let pfMap=null,pfWind=[];
  window.passdistribution=function(){shell('Passfördelning','<p class="muted">Tryck på ett pass för väder, vind och jaktprognos vid passets exakta position.</p><div id="passMapCanvas" class="huntMap"></div><aside id="passInfo" class="passInfo" hidden></aside>');loadLeaflet(()=>{const el=q('#passMapCanvas');pfMap=L.map(el);L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(pfMap);L.polygon(db.mapData.boundary,{color:'#2997ff',weight:3,fillOpacity:.05}).addTo(pfMap);pfMap.fitBounds(db.mapData.boundary);db.passes.filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)).forEach(p=>L.marker([p.latitude,p.longitude]).bindTooltip(p.name).on('click',()=>forecastForPass(p.id)).addTo(pfMap))})};
  window.forecastForPass=id=>{const p=db.passes.find(x=>x.id===id),n=new Date(),side=q('#passInfo');side.hidden=false;side.innerHTML=`<button class="panelClose" id="pfClose">×</button><h3>${e(p.name)}</h3><div class="two"><label>Datum<input id="pfDate" type="date" value="${ymd(n)}"></label><label>Tid<input id="pfTime" type="time" value="${n.toTimeString().slice(0,5)}"></label></div><button id="pfRun">Visa prognos</button><div id="pfResult"></div>`;q('#pfClose').onclick=()=>{side.hidden=true;pfWind.forEach(x=>pfMap.removeLayer(x));pfWind=[]};q('#pfRun').onclick=()=>passPointForecast(p)};
  window.passPointForecast=async p=>{const iso=q('#pfDate').value+'T'+q('#pfTime').value,r=q('#pfResult');r.innerHTML='<p class="muted">Hämtar prognos…</p>';try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&hourly=wind_speed_10m,wind_direction_10m,temperature_2m,precipitation_probability,precipitation,rain,showers,snowfall,cloud_cover,is_day,visibility&wind_speed_unit=ms&timezone=Europe%2FStockholm&forecast_days=16`,j=await(await fetch(u)).json(),i=j.hourly.time.reduce((b,t,k)=>Math.abs(new Date(t)-new Date(iso))<Math.abs(new Date(j.hourly.time[b])-new Date(iso))?k:b,0),h=j.hourly,wd=h.wind_direction_10m[i],ws=h.wind_speed_10m[i];drawPassWind(p,wd,ws);const hour=+q('#pfTime').value.split(':')[0],rows=mainSpecies.map(sp=>{const a=db.observations.filter(o=>o.species===sp&&Number.isFinite(o.latitude));const score=a.reduce((n,o)=>{const x=(o.latitude-p.latitude)*111,y=(o.longitude-p.longitude)*60,km=Math.sqrt(x*x+y*y),oh=+(o.time||'12:00').split(':')[0];return n+Math.max(0,1-km/3)*Math.max(0,1-Math.abs(oh-hour)/8)*Math.sqrt(o.count||1)},0);return{sp,n:a.length,score}}),sum=rows.reduce((n,x)=>n+x.score,0),ptype=h.snowfall[i]>0?'Snö':h.showers[i]>0?'Skurar':h.rain[i]>0?'Regn':'Ingen';r.innerHTML=`<div class="forecastGrid"><div>Vind<b>${dirs[1+Math.round(wd/45)%8]} · ${ws.toFixed(1)} m/s</b></div><div>Temperatur<b>${h.temperature_2m[i].toFixed(1)} °C</b></div><div>Molnighet<b>${h.cloud_cover[i]}%</b></div><div>Nederbörd<b>${ptype} · ${h.precipitation[i].toFixed(1)} mm</b></div><div>Ljus<b>${h.is_day[i]?'Dagsljus':'Mörkt/skymning'}</b></div><div>Sikt<b>${(h.visibility[i]/1000).toFixed(1)} km</b></div></div><h3>Chans vid passet</h3>${rows.map(x=>`<div class="forecastChance"><span>${x.sp}<small>${x.n} kartobs</small></span><b>${sum?Math.round(x.score/sum*100):0}%</b></div>`).join('')}`;}catch{r.innerHTML='<p class="muted">Prognosen kunde inte hämtas.</p>'}};
  function drawPassWind(p,wd,ws){pfWind.forEach(x=>pfMap.removeLayer(x));pfWind=[];const f=(wd+180)*Math.PI/180,c=Math.cos(p.latitude*Math.PI/180),meter=111320,len=140+ws*10,perp=f+Math.PI/2;[-1,-.66,-.33,0,.33,.66,1].forEach((offset,k)=>{const a=f+offset*12.5*Math.PI/180,lat=p.latitude+Math.cos(perp)*offset*5/meter,lng=p.longitude+Math.sin(perp)*offset*5/meter/c,pts=[];for(let i=0;i<=26;i++){const t=i/26,w=Math.sin(t*Math.PI*2+k)*2/meter;pts.push([lat+Math.cos(a)*len*t/meter+Math.cos(perp)*w,lng+(Math.sin(a)*len*t/meter+Math.sin(perp)*w)/c])}pfWind.push(L.polyline(pts,{color:'#68cef7',weight:2.5,opacity:.85}).addTo(pfMap))})}

  window.renderMoreMenu(); window.renderHome(); window.renderStats();
})();
