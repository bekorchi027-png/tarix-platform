// "Joy nomlari xaritasi": historical place names, old region labels, state borders by year, and two map games.
// Loaded by mashqlar.html after its main script; uses its helpers ($, $$, esc, shuffle, km, bank, BANK, saveScore, showBoard, back, cleanup).
// Deep link: mashqlar.html#joylar?yil=1405&davlat=temuriylar&joy=Samarqand  (all optional, yil < 0 = BC)
(function(){
const NRM = s => String(s||"").toLowerCase().replace(/[ʻʼ‘’`´']/g,"'").replace(/\s+/g," ").trim();
const PER = Object.fromEntries(JOY_DAVR.map(p=>[p.id,p]));
const DAV = Object.fromEntries(DAVLATLAR.map(d=>[d.id,d]));
const EN2DAV = {}; DAVLATLAR.forEach(d => d.en.forEach(n => { (EN2DAV[n] = EN2DAV[n] || []).push(d); }));
const YRS = CHEGARA_YILLAR;
const yTxt = y => y<0 ? `mil. avv. ${-y}` : `${y}`;
const span = d => `${yTxt(d.boshi)}–${d.oxiri>=2100?"hozir":yTxt(d.oxiri)}`;
const geoCache = {};
async function geo(y){ if(!geoCache[y]) geoCache[y] = fetch(`chegara/${y}.json`).then(r=>{ if(!r.ok) throw 0; return r.json(); }); return geoCache[y]; }
function snapAtOrBefore(y){ let s = YRS[0]; for(const v of YRS) if(v<=y) s=v; return s; }
// Snapshot to show a state: the latest one at or before yil (inside the state's years) that has it, else the closest one that has it.
async function snapFor(d, yil){
  const want = yil!=null ? yil : d.boshi;
  const cands = [...YRS].sort((a,b)=>Math.abs(a-want)-Math.abs(b-want) || (b<=want) - (a<=want));
  const before = YRS.filter(v=>v<=want && v>=d.boshi-60).reverse();
  for(const y of [...before, ...cands]){ const g = await geo(y); if(g.features.some(f=>d.en.includes(f.properties.NAME))) return y; }
  return snapAtOrBefore(want);
}
const uzName = n => { const d = EN2DAV[n]; if(d) return d.length>1 ? d.map(x=>x.nom.replace(/ \(.*\)/,"")).join(" / ") : d[0].nom; return CHEGARA_UZ[n] || n; };
function colorOf(n){ let h=0; for(const c of n) h=(h*31+c.charCodeAt(0))>>>0; return `hsl(${h%360} 45% 48%)`; }

// --- test questions that mention a place ---
let QIDX = null;
function keysOf(p){
  const out = new Set();
  [p.n, ...(p.a?p.a.split(","):[])].forEach(s => {
    s = NRM(s).replace(/\(.*?\)/g,"").replace(/ (g'ori|qal'asi|minorasi|ehromlari|madaniyati)$/,"").trim();
    s.split(" va ").forEach(k => { k=k.trim(); if(k.length>=3) out.add(k); });
  });
  return [...out];
}
function rxFor(k){ const e = k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); return new RegExp(`(^|[^a-z'])${e}${k.length<=4?"(?![a-z])":""}`); }
async function questionsFor(p){
  await bank();
  if(!QIDX) QIDX = [...BANK.closed.map(q=>({q, t:NRM([q.q,q.extra,...q.opts].join(" "))})), ...BANK.open.filter(c=>c.part==="a").map(q=>({q, t:NRM([q.q,q.extra,q.ask].join(" "))}))];
  const rx = keysOf(p).map(rxFor);
  return QIDX.filter(x => rx.some(r=>r.test(x.t))).map(x=>x.q);
}
function qList(list, el, title){
  let shown = 0;
  function more(){
    const part = list.slice(shown, shown+6); shown += part.length;
    el.querySelector(".ql").insertAdjacentHTML("beforeend", part.map(q => `<div class="jq"><div class="eyebrow">${esc(q.vtitle)}, ${q.n}-topshiriq</div><p style="margin:4px 0">${esc(q.q)}</p>${q.extra && !/^33–35-savollar/.test(q.extra)?`<pre class="extra">${esc(q.extra)}</pre>`:""}${q.img?`<img class="qimg" src="${esc(q.img)}" alt="Topshiriq rasmi" loading="lazy">`:""}
      ${q.opts?`<ol class="jopts">${q.opts.map((o,i)=>`<li data-ok="${i===q.ans}"><b>${LET[i]})</b> ${esc(o)}</li>`).join("")}</ol>`:`<p style="margin:4px 0;font-weight:600">a) ${esc(q.ask)}</p>`}
      <button class="btn ghost jshow" type="button">Javobni ko'rsatish</button><span class="jans" hidden>${q.opts?`To'g'ri javob: <b>${LET[q.ans]}</b>`:`Javob: <b>${esc(q.ansTxt)}</b>`}</span></div>`).join(""));
    el.querySelectorAll(".jshow").forEach(b => b.onclick = () => { b.hidden = true; const box = b.parentNode; box.querySelector(".jans").hidden = false; box.querySelectorAll('[data-ok="true"]').forEach(li=>li.classList.add("ok")); });
    const m = el.querySelector(".qmore"); m.hidden = shown>=list.length;
  }
  el.innerHTML = `<h3 style="font-size:20px;margin:14px 0 6px">${esc(title)}</h3>${list.length?"":`<p class="note">Hozircha saytdagi testlarda bu nom uchramadi.</p>`}<div class="ql"></div><button class="btn ghost qmore" type="button" hidden>Yana ko'rsatish</button>`;
  el.querySelector(".qmore").onclick = more;
  if(list.length) more();
}

// --- shared map setup ---
function baseMap(el, {labels=false}={}){
  const map = L.map(el, {worldCopyJump:true, zoomSnap:.5}).setView([40.5, 64.5], 5);
  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:12, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
  const plain = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", {maxZoom:12, subdomains:"abcd", attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'});
  let cur = (labels?osm:plain).addTo(map);
  map.attributionControl.addAttribution('Chegaralar: <a href="https://github.com/aourednik/historical-basemaps">historical-basemaps</a> (GPL-3.0)');
  map.setModern = on => { map.removeLayer(cur); cur = (on?osm:plain).addTo(map); cur.bringToBack(); };
  const vl = L.layerGroup().addTo(map);
  JOY_VILOYAT.forEach(v => L.marker([v.lat,v.lng], {interactive:false, keyboard:false, icon:L.divIcon({className:"", html:`<div class="rlabel ${v.river?"riv":""} ${v.big?"big":""}" title="${esc(v.a||"")}">${esc(v.n)}${v.a&&!v.river?`<small>${esc(v.a)}</small>`:""}</div>`, iconSize:[0,0]})}).addTo(vl));
  map.regions = vl;
  const zcls = () => { el.classList.toggle("z-lo", map.getZoom()<4.5); el.classList.toggle("z-hi", map.getZoom()>=6.5); };
  map.on("zoomend", zcls); zcls();
  cleanup = () => { try{ map.stop(); map.off(); }catch(e){} map.remove(); };
  return map;
}
const pinIcon = (c, big) => L.divIcon({className:"", html:`<div class="dot${big?" big":""}" style="background:${c}"></div>`, iconSize:[14,14], iconAnchor:[7,7]});
const placeColor = p => PER[p.p[0]].c;
function findPlace(q){ q = NRM(q); if(!q) return null; return JOYLAR.find(p => NRM(p.n)===q) || JOYLAR.find(p => keysOf(p).includes(q)) || JOYLAR.find(p => NRM(p.n).startsWith(q)) || JOYLAR.find(p => keysOf(p).some(k=>k.startsWith(q))); }
function cardHtml(p){
  return `<div class="jcard"><b class="jn">${esc(p.n)}</b>${p.a?`<div class="note">Boshqa nomlari: ${esc(p.a)}</div>`:""}
    <div><span class="note">Hozir:</span> ${esc(p.now)}</div>
    <div class="note">${JOY_TUR[p.k]} · ${p.p.map(x=>PER[x].name).join(", ")}</div>
    <p style="margin:6px 0">${esc(p.d)}</p>${p.t?`<div class="note">Joylashuv taxminiy.</div>`:""}
    <button class="btn ghost jq-btn" type="button" style="min-height:36px;padding:6px 12px">Shu joy haqidagi test savollari</button></div>`;
}

// --- explore view ---
async function viewJoylar(arg, qs){
  qs = qs || new URLSearchParams();
  if(arg==="qayerda") return gameWhere();
  if(arg==="nomi") return gameName();
  const P = {yil: qs.has("yil") ? parseInt(qs.get("yil"),10) : null, davlat: (qs.get("davlat")||"").toLowerCase(), joy: qs.get("joy")||""};
  const dav = DAV[P.davlat] || null;
  $("#app").innerHTML = `<div class="head"><h1>Joy nomlari xaritasi</h1><span class="sp"></span>
    <div class="seg"><button type="button" aria-pressed="true">Xarita</button><button type="button" data-g="qayerda" aria-pressed="false">Qayerda?</button><button type="button" data-g="nomi" aria-pressed="false">Nomi nima?</button></div>${back}</div>
    <div class="card">
      <div class="maptools">
        <input id="jsr" list="jdl" placeholder="Joy nomini qidiring: Nautaka, Poykent…" autocomplete="off" style="flex:1;min-width:200px">
        <datalist id="jdl">${JOYLAR.map(p=>`<option value="${esc(p.n)}">`).join("")}${JOYLAR.filter(p=>p.a).flatMap(p=>p.a.split(",").map(a=>`<option value="${esc(a.trim())}">${esc(p.n)}</option>`)).join("")}</datalist>
        <div class="seg" id="jr"><button data-v="all" aria-pressed="true">Hammasi</button><button data-v="uz" aria-pressed="false">Markaziy Osiyo</button><button data-v="j" aria-pressed="false">Jahon</button></div>
      </div>
      <div class="maptools" style="margin-top:8px">
        <select id="jp"><option value="all">Barcha davrlar</option>${JOY_DAVR.map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select>
        <label class="chk"><input type="checkbox" id="jb" ${(P.yil!=null||dav)?"checked":""}> Davlat chegaralari</label>
        <label class="chk"><input type="checkbox" id="jm"> Hozirgi nomlar</label>
        <label class="chk"><input type="checkbox" id="jo" checked> Eski xarita ko'rinishi</label>
      </div>
      <div id="jyb" class="yearbar" hidden>
        <label class="f" style="flex:1;min-width:220px">Yil: <b class="num" id="jyv"></b><input type="range" id="jy" min="0" max="${YRS.length-1}" step="1"></label>
        <label class="f">Davlatni ko'rsatish<select id="jd"><option value="">Tanlang…</option>${[...DAVLATLAR].sort((a,b)=>a.boshi-b.boshi).map(d=>`<option value="${d.id}">${esc(d.nom)} (${span(d)})</option>`).join("")}</select></label>
      </div>
      <p class="note" id="jinfo" style="margin:8px 0"></p>
      <div id="map" class="oldmap jmap"></div>
      <div id="mbot"></div>
    </div>`;
  $$(".seg [data-g]").forEach(b => b.onclick = () => { location.hash = "joylar/" + b.dataset.g; });
  if(!window.L){ $("#map").outerHTML = `<p>Xarita kutubxonasi yuklanmadi. Sahifani yangilang.</p>`; return; }
  const map = baseMap($("#map"));
  const st = {r:"all", per:"all", yi: YRS.indexOf(snapAtOrBefore(P.yil!=null?P.yil:1400)), dav: dav?dav.id:"", borders: $("#jb").checked};
  const markers = new Map(), pl = L.layerGroup().addTo(map);
  let bl = null, tok = 0;

  function paintPlaces(){
    pl.clearLayers(); markers.clear();
    const list = JOYLAR.filter(p => (st.r==="all"||p.r===st.r) && (st.per==="all"||p.p.includes(st.per)));
    list.forEach(p => {
      const m = L.marker([p.lat,p.lng], {icon:pinIcon(placeColor(p)), title:p.n}).bindTooltip(esc(p.n), {permanent:true, direction:"right", offset:[6,0], className:"plabel"}).bindPopup(cardHtml(p), {maxWidth:300});
      m.on("popupopen", ev => { const b = ev.popup.getElement().querySelector(".jq-btn"); if(b) b.onclick = async () => { b.disabled = true; b.textContent = "Qidirilmoqda…"; const qsx = await questionsFor(p); b.textContent = `Test savollari: ${qsx.length} ta (pastda)`; qList(qsx, $("#mbot"), `«${p.n}» uchraydigan test savollari`); $("#mbot").scrollIntoView({behavior:"smooth", block:"start"}); }; });
      m.addTo(pl); markers.set(p, m);
    });
    return list;
  }
  function syncHash(){
    const q = new URLSearchParams();
    if(st.borders) q.set("yil", YRS[st.yi]);
    if(st.borders && st.dav) q.set("davlat", st.dav);
    if(st.joy) q.set("joy", st.joy);
    const h = "#joylar" + (q.toString() ? "?"+q : "");
    if(location.hash !== h) history.replaceState(null, "", h);
  }
  async function paintBorders(fit){
    const my = ++tok;
    $("#jyb").hidden = !st.borders;
    if(bl){ map.removeLayer(bl); bl = null; }
    if(!st.borders){ $("#jinfo").textContent = "Nuqtani bosing: joyning qadimgi va hozirgi nomi, davri va izohi chiqadi. Rang davrni bildiradi."; syncHash(); return; }
    const y = YRS[st.yi]; $("#jy").value = st.yi; $("#jyv").textContent = yTxt(y) + (y<0?"":"-yil");
    let g; try{ g = await geo(y); }catch(e){ $("#jinfo").textContent = "Chegaralar faylini yuklab bo'lmadi."; return; }
    if(my!==tok) return;
    const d = DAV[st.dav];
    const hit = f => d && d.en.includes(f.properties.NAME);
    bl = L.geoJSON(g, {
      style: f => hit(f) ? {color:"#b3372f", weight:3, fillColor:"#c0392b", fillOpacity:.32} : {color:colorOf(f.properties.NAME), weight:1, fillColor:colorOf(f.properties.NAME), fillOpacity: d ? .06 : .16},
      onEachFeature: (f, l) => l.bindTooltip(esc(uzName(f.properties.NAME)), {sticky:true, className:"blabel"}).on("click", () => { const ds = EN2DAV[f.properties.NAME]; if(ds && ds.length===1){ st.dav = ds[0].id; $("#jd").value = st.dav; paintBorders(true); } })
    }).addTo(map);
    bl.bringToBack();
    const has = d && g.features.some(hit);
    $("#jinfo").innerHTML = d ? (has ? `<b>${esc(d.nom)}</b> (${span(d)}), ${esc(yTxt(y))}-yil holatida. ` : `<b>${esc(d.nom)}</b> bu yilgi xaritada yo'q, yilni ${span(d)} oralig'iga suring. `) + `Chegaralar taxminiy.`
      : `${esc(yTxt(y))}-yildagi davlatlar. Hududni bosing yoki ro'yxatdan davlat tanlang. Chegaralar taxminiy.`;
    if(fit && has){ const b = L.geoJSON({type:"FeatureCollection", features:g.features.filter(hit)}).getBounds(); if(b.isValid()) map.fitBounds(b.pad(.08), {maxZoom:6}); }
    syncHash();
  }
  function focusPlace(p, open=true){
    if(!p) return false;
    if(st.r!=="all" && p.r!==st.r){ st.r="all"; $$("#jr button").forEach(x=>x.setAttribute("aria-pressed", x.dataset.v==="all")); }
    if(st.per!=="all" && !p.p.includes(st.per)){ st.per="all"; $("#jp").value="all"; }
    if(!markers.has(p)) paintPlaces();
    map.setView([p.lat,p.lng], Math.max(map.getZoom(), 7));
    if(open) markers.get(p).openPopup();
    st.joy = p.n; syncHash();
    return true;
  }

  $$("#jr button").forEach(b => b.onclick = () => { st.r = b.dataset.v; $$("#jr button").forEach(x=>x.setAttribute("aria-pressed", x===b)); const l = paintPlaces(); if(l.length && st.r!=="all") map.fitBounds(L.latLngBounds(l.map(p=>[p.lat,p.lng])).pad(.1)); });
  $("#jp").onchange = e => { st.per = e.target.value; paintPlaces(); };
  $("#jb").onchange = e => { st.borders = e.target.checked; paintBorders(!!st.dav); };
  $("#jm").onchange = e => map.setModern(e.target.checked);
  $("#jo").onchange = e => $("#map").classList.toggle("oldmap", e.target.checked);
  $("#jy").oninput = e => { st.yi = +e.target.value; paintBorders(false); };
  $("#jd").onchange = async e => { st.dav = e.target.value; const d = DAV[st.dav]; if(d){ const y = YRS[st.yi]; if(y<d.boshi-60 || y>d.oxiri) st.yi = YRS.indexOf(await snapFor(d)); } paintBorders(true); };
  const go = () => { const p = findPlace($("#jsr").value); if(!focusPlace(p)) $("#jinfo").textContent = `«${$("#jsr").value}» topilmadi. Boshqacha yozib ko'ring (masalan: Marakanda, Gurganj).`; };
  $("#jsr").onchange = go; $("#jsr").onkeydown = e => { if(e.key==="Enter"){ e.preventDefault(); go(); } };

  paintPlaces();
  if(dav){ st.yi = YRS.indexOf(await snapFor(dav, P.yil)); $("#jd").value = dav.id; }
  await paintBorders(!!dav);
  if(P.joy){ $("#jsr").value = P.joy; const p = findPlace(P.joy); if(p) focusPlace(p, true); }
}

// --- game 1: find the place on the map ---
function gameShell(title, mode){
  $("#app").innerHTML = `<div class="head"><h1>${title}</h1><span class="sp"></span>
    <div class="seg"><button type="button" data-g="" aria-pressed="false">Xarita</button><button type="button" data-g="qayerda" aria-pressed="${mode==="qayerda"}">Qayerda?</button><button type="button" data-g="nomi" aria-pressed="${mode==="nomi"}">Nomi nima?</button></div>${back}</div>
    <div class="card"><div id="mtop"></div><div id="map" class="oldmap jmap"></div><div id="mbot"></div></div>`;
  $$(".seg [data-g]").forEach(b => b.onclick = () => { location.hash = "joylar" + (b.dataset.g ? "/"+b.dataset.g : ""); });
}
function scopePick(onPick){
  $("#mtop").innerHTML = `<p style="margin:0 0 8px">Qaysi joylardan savol berilsin?</p><div class="row" style="margin-bottom:10px">
    <button class="btn" data-s="uz" type="button">Markaziy Osiyo</button><button class="btn ghost" data-s="j" type="button">Jahon tarixi</button><button class="btn ghost" data-s="all" type="button">Aralash</button></div>`;
  $$("[data-s]").forEach(b => b.onclick = () => onPick(b.dataset.s));
}
const VIEW = {uz:[[40.3,64.5],5], j:[[35,40],3], all:[[38,55],3.5]};
function gameWhere(){
  gameShell("Qayerda?", "qayerda");
  if(!window.L) return;
  const map = baseMap($("#map"));
  $("#mbot").innerHTML = `<p class="note" style="margin:8px 0 0">Xaritada nom yozuvlari yo'q: faqat qadimgi viloyat va daryo nomlari bor. Joyni xotiradan toping.</p>`;
  scopePick(scope => {
    const R = shuffle(JOYLAR.filter(p => scope==="all" || p.r===scope)).slice(0,10), scale = scope==="uz" ? 150 : 500;
    let k = 0, score = 0, guess = null, locked = true;
    const layer = L.layerGroup().addTo(map);
    map.on("click", ev => { if(locked) return; layer.clearLayers(); guess = ev.latlng; L.marker(guess, {icon:pinIcon("#1b2430")}).addTo(layer); $("#ok").disabled = false; });
    function round(){
      locked = false; guess = null; layer.clearLayers(); map.setView(...VIEW[scope]);
      const p = R[k];
      $("#mtop").innerHTML = `<div class="stats"><span>Raund <b>${k+1}</b>/${R.length}</span><span>Ball <b>${score}</b></span></div>
        <p class="task" style="margin:6px 0">${esc(p.n)} qayerda? <span class="note">(${p.p.map(x=>PER[x].name).join(", ")})</span></p><p class="note" style="margin:0 0 8px">Xaritadan joyni bosing, so'ng «Tasdiqlash»ni bosing.</p>`;
      $("#mbot").innerHTML = `<div class="row" style="margin-top:10px"><button class="btn" id="ok" type="button" disabled>Tasdiqlash</button></div>`;
      $("#ok").onclick = check;
    }
    function check(){
      if(!guess) return; locked = true;
      const p = R[k], d = km(guess, p), pts = Math.round(1000*Math.exp(-d/scale));
      score += pts;
      L.marker([p.lat,p.lng], {icon:pinIcon("#c0392b", true)}).addTo(layer).bindPopup(cardHtml(p).replace(/<button[\s\S]*?<\/button>/,""), {maxWidth:300}).openPopup();
      L.polyline([guess,[p.lat,p.lng]], {color:"#c0392b", dashArray:"6 6"}).addTo(layer);
      map.fitBounds(L.latLngBounds([guess,[p.lat,p.lng]]).pad(.5), {maxZoom:7});
      $("#mbot").innerHTML = `<div class="feedback ${d<scale?"ok":"bad"}" style="margin-top:10px"><span>Farq: <span class="num">${Math.round(d)}</span> km · +${pts} ball</span><span style="flex:1"></span><button class="btn" id="nx" type="button">${k+1<R.length?"Keyingi →":"Natija"}</button></div>`;
      $("#nx").onclick = () => { k++; k<R.length ? round() : end(); };
    }
    async function end(){
      layer.clearLayers();
      $("#mtop").innerHTML = `<div class="eyebrow">O'yin tugadi</div><h2 style="font-size:30px"><span class="num">${score}</span> ball</h2><div id="sv"></div>`;
      $("#mbot").innerHTML = `<div class="row" style="margin-top:10px"><button class="btn" id="ag" type="button">Yana o'ynash</button></div><div id="lb"></div>`;
      $("#ag").onclick = () => gameWhere();
      await saveScore("xarita", score, 0, R.length, $("#sv")); showBoard("xarita", $("#lb"));
    }
    round();
  });
}

// --- game 2: a point is shown, pick its name ---
function gameName(){
  gameShell("Nomi nima?", "nomi");
  if(!window.L) return;
  const map = baseMap($("#map"));
  scopePick(scope => {
    const pool = JOYLAR.filter(p => scope==="all" || p.r===scope);
    const R = shuffle(pool).slice(0,10);
    let k = 0, score = 0, right = 0;
    const layer = L.layerGroup().addTo(map);
    function round(){
      layer.clearLayers();
      const p = R[k];
      // distractors: same kind of place first, so the answer is not given away by type
      const others = shuffle(pool.filter(x => x!==p)).sort((a,b)=>(b.k===p.k)-(a.k===p.k)).slice(0,3);
      const opts = shuffle([p, ...others]);
      L.marker([p.lat,p.lng], {icon:pinIcon("#c0392b", true)}).addTo(layer);
      map.setView([p.lat,p.lng], p.r==="uz" ? 6 : 4.5);
      $("#mtop").innerHTML = `<div class="stats"><span>Raund <b>${k+1}</b>/${R.length}</span><span>Ball <b>${score}</b></span></div>
        <p class="task" style="margin:6px 0">Qizil nuqtadagi joyning nomi nima?</p><p class="note" style="margin:0 0 8px">Ishora: ${esc(JOY_TUR[p.k])}, ${p.p.map(x=>PER[x].name).join(", ")}.</p>`;
      $("#mbot").innerHTML = `<div class="tiles" style="margin-top:10px">${opts.map((o,i)=>`<button class="tile" data-i="${i}" type="button"><span class="l">${LET[i]}</span><span>${esc(o.n)}</span></button>`).join("")}</div><div id="fb"></div>`;
      $$("#mbot .tile").forEach(b => b.onclick = () => {
        const pick = opts[+b.dataset.i], ok = pick===p;
        $$("#mbot .tile").forEach(t => { t.disabled = true; t.classList.add(opts[+t.dataset.i]===p ? "right" : "dim"); });
        b.classList.add("mine");
        if(ok){ score += 100; right++; }
        layer.eachLayer(m => m.bindPopup(cardHtml(p).replace(/<button[\s\S]*?<\/button>/,""), {maxWidth:300}).openPopup());
        $("#fb").innerHTML = `<div class="feedback ${ok?"ok":"bad"}" style="margin-top:10px"><span>${ok?"To'g'ri! +100 ball":`Bu ${esc(p.n)}.`}</span><span style="flex:1"></span><button class="btn" id="nx" type="button">${k+1<R.length?"Keyingi →":"Natija"}</button></div>`;
        $("#nx").onclick = () => { k++; k<R.length ? round() : end(); };
      });
    }
    async function end(){
      layer.clearLayers(); map.setView(...VIEW[scope]);
      $("#mtop").innerHTML = `<div class="eyebrow">O'yin tugadi</div><h2 style="font-size:30px"><span class="num">${score}</span> ball</h2><p>${R.length} ta joydan ${right} tasini topdingiz.</p><div id="sv"></div>`;
      $("#mbot").innerHTML = `<div class="row" style="margin-top:10px"><button class="btn" id="ag" type="button">Yana o'ynash</button></div><div id="lb"></div>`;
      $("#ag").onclick = () => gameName();
      await saveScore("xarita", score, right, R.length, $("#sv")); showBoard("xarita", $("#lb"));
    }
    round();
  });
}
window.viewJoylar = viewJoylar;
})();
