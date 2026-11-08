// O'zing O'rgan: shared header, sign-up / log-in and the personal cabinet.
// Accounts use Supabase Auth with a login name instead of an email: "vali_01" becomes vali_01@talaba.ozing-organ.uz.
(function(){
const SB_URL = "https://nhwzwqjbwwzvqxvdbecc.supabase.co";
const SB_KEY = "sb_publishable_wlGqP_SHtv-BgS1RT4CpgQ_YpQDf2Ch";
const DOMAIN = "talaba.ozing-organ.uz";
const VILOYAT = ["Toshkent shahri","Toshkent viloyati","Andijon","Buxoro","Farg'ona","Jizzax","Xorazm","Namangan","Navoiy","Qashqadaryo","Qoraqalpog'iston","Samarqand","Sirdaryo","Surxondaryo"];
const MODES = {viktorina:"Tezkor viktorina", xarita:"Xaritada toping", xronologiya:"Xronologiya", kartochka:"Kartochkalar", jonli:"Jonli bellashuv"};

let client = null;
try{ client = window.supabase.createClient(SB_URL, SB_KEY, {auth:{persistSession:true, autoRefreshToken:true, storageKey:"oz-auth"}}); }catch(e){}

const OZ = window.OZ = {
  client, user:null, profile:null, ready:null, subs:[],
  onChange(f){ this.subs.push(f); },
  // Bearer token for REST calls: the signed-in user's, or the public key.
  token(){ return (this.session && this.session.access_token) || SB_KEY; },
  displayName(){ return (this.profile && this.profile.full_name) || ""; },
  open(tab){ openAuth(tab||"login"); },
  async savePractice(mode, score, correct, total){
    if(!client || !this.user) return false;
    const {error} = await client.from("oz_practice").insert({mode, score:Math.round(score), correct, total});
    return !error;
  },
  async leaderboard(mode){
    if(!client) return [];
    const {data, error} = await client.rpc("oz_reyting", {p_mode:mode});
    return error ? [] : data;
  }
};

const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const css = `
.ozbar{background:var(--sheet);border-bottom:1px solid var(--line);font:14px/1.4 var(--body)}
.ozbar .in{max-width:1080px;margin:0 auto;padding:8px 16px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.ozbar .brand{font-family:var(--display);font-weight:700;font-size:18px;color:var(--ink);text-decoration:none;margin-right:10px}
.ozbar nav{display:flex;gap:2px;flex-wrap:wrap}
.ozbar nav a{color:var(--muted);text-decoration:none;padding:6px 10px;border-radius:6px;font-weight:500}
.ozbar nav a[aria-current="page"]{color:var(--accent);background:var(--accent-soft)}
.ozbar nav a:hover{color:var(--ink)}
.ozbar .sp{flex:1}
.ozbar .who{border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;padding:6px 12px;font-weight:500;min-height:36px}
.ozbar .who.in{border-color:var(--accent);color:var(--accent)}
@media (max-width:600px){.ozbar .in{padding:6px 12px;flex-wrap:nowrap}.ozbar .sp{display:none}.ozbar .who{margin-left:auto;padding:6px 10px;white-space:nowrap;font-size:13px}.ozbar nav a{white-space:nowrap}.ozbar .brand{font-size:16px;margin-right:4px}.ozbar nav a{padding:6px 7px}}
.ozdlg{border:1px solid var(--line);border-radius:10px;padding:0;background:var(--sheet);color:var(--ink);width:min(440px,calc(100vw - 24px));max-height:calc(100vh - 24px)}
.ozdlg::backdrop{background:rgba(10,14,18,.55)}
.ozdlg .bd{padding:20px;display:grid;gap:14px}
.ozdlg h2{font-size:24px}
.ozdlg .tabs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--line)}
.ozdlg .tabs button{background:transparent;border:0;border-bottom:3px solid transparent;padding:12px;color:var(--muted);font-weight:600}
.ozdlg .tabs button[aria-selected="true"]{color:var(--accent);border-bottom-color:var(--accent)}
.ozdlg label{display:grid;gap:5px;font-weight:500;font-size:14px}
.ozdlg input,.ozdlg select{font:inherit;font-size:16px;padding:10px 12px;border:1px solid var(--line);border-radius:6px;background:var(--paper);color:var(--ink);width:100%}
.ozdlg .hint{font-size:12.5px;color:var(--muted);font-weight:400}
.ozdlg .err{color:var(--bad);font-size:13.5px;margin:0}
.ozdlg .ok{color:var(--ok);font-size:13.5px;margin:0}
.ozdlg .steps{display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--muted)}
.ozdlg .steps i{font-style:normal;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;border:1px solid var(--line);font-family:var(--mono)}
.ozdlg .steps .on i{background:var(--accent);border-color:var(--accent);color:var(--sheet)}
.ozdlg .steps .ln{flex:1;height:1px;background:var(--line)}
.ozdlg .row{display:flex;gap:8px;flex-wrap:wrap}
.ozdlg .row .btn{flex:1}
.ozdlg .x{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;background:transparent;color:var(--muted);font-size:24px;border-radius:50%}
.ozdlg table{width:100%;border-collapse:collapse;font-size:13.5px}
.ozdlg td,.ozdlg th{padding:6px 4px;border-bottom:1px solid var(--line);text-align:left}
.ozdlg th{color:var(--muted);font-weight:500}
`;

function header(){
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const here = location.pathname.endsWith("mashqlar.html") ? "m" : "t";
  const h = document.createElement("header"); h.className = "ozbar";
  h.innerHTML = `<div class="in"><a class="brand" href="/">O'zing O'rgan</a>
    <nav><a href="/" ${here==="t"?'aria-current="page"':""}>Testlar</a><a href="/mashqlar.html" ${here==="m"?'aria-current="page"':""}>Mashq va o'yinlar</a></nav>
    <span class="sp"></span><button class="who" type="button" id="ozwho">Kirish</button></div>`;
  document.body.prepend(h);
  h.querySelector("#ozwho").onclick = () => OZ.user ? openCabinet() : openAuth("login");
}
function paintWho(){
  const b = document.getElementById("ozwho"); if(!b) return;
  if(OZ.user){ b.textContent = (OZ.profile && OZ.profile.full_name ? OZ.profile.full_name.split(" ")[0] : "Kabinet") + (innerWidth<600 ? "" : " · Kabinet"); b.classList.add("in"); }
  else { b.textContent = innerWidth<600 ? "Kirish" : "Kirish / Ro'yxatdan o'tish"; b.classList.remove("in"); }
}

let dlg = null;
function dialog(html){
  if(!dlg){ dlg = document.createElement("dialog"); dlg.className = "ozdlg"; document.body.appendChild(dlg);
    dlg.addEventListener("click", e => { if(e.target===dlg) dlg.close(); }); }
  dlg.innerHTML = `<button class="x" type="button" aria-label="Yopish">×</button>` + html;
  dlg.querySelector(".x").onclick = () => dlg.close();
  if(!dlg.open) dlg.showModal();
  return dlg;
}
const loginOk = s => /^[a-z0-9_.]{3,24}$/.test(s);
const emailOf = u => u.toLowerCase().trim() + "@" + DOMAIN;
function errText(e){
  const m = (e && (e.message||e.error_description||String(e))) || "";
  if(/already registered|already exists/i.test(m)) return "Bu login band. Boshqa login tanlang.";
  if(/Invalid login credentials/i.test(m)) return "Login yoki parol noto'g'ri.";
  if(/Email not confirmed/i.test(m)) return "Hisob hali faollashtirilmagan. Sayt egasiga xabar bering.";
  if(/Password should be/i.test(m)) return "Parol kamida 6 belgidan iborat bo'lsin.";
  if(/rate limit|too many/i.test(m)) return "Juda ko'p urinish. Bir necha daqiqadan keyin qayta urinib ko'ring.";
  if(/fetch|network/i.test(m)) return "Internet aloqasini tekshiring.";
  return "Xatolik: " + m;
}

// Sign-up is two short steps: who you are, then login and password.
const draft = {full_name:"", sinf:"", viloyat:"", username:""};
function openAuth(tab, step){
  if(!client){ dialog(`<div class="bd"><h2>Kirish ishlamayapti</h2><p class="note">Sahifani yangilab qayta urinib ko'ring.</p></div>`); return; }
  const tabs = `<div class="tabs" role="tablist"><button role="tab" data-t="login" aria-selected="${tab==="login"}">Kirish</button><button role="tab" data-t="signup" aria-selected="${tab==="signup"}">Ro'yxatdan o'tish</button></div>`;
  let body = "";
  if(tab==="login"){
    body = `<form class="bd" id="ozf"><h2>Hisobingizga kiring</h2>
      <label>Login<input id="ozu" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
      <label>Parol<input id="ozp" type="password" autocomplete="current-password" required></label>
      <p class="err" id="ozerr" role="alert"></p>
      <button class="btn" type="submit">Kirish</button>
      <p class="note">Hisobingiz yo'qmi? <a href="#" data-go="signup">Ro'yxatdan o'ting</a>, bu bir daqiqa oladi. Testlarni hisobsiz ham yechish mumkin.</p></form>`;
  } else if((step||1)===1){
    body = `<form class="bd" id="ozf"><div class="steps"><span class="on"><i>1</i> Ma'lumotlar</span><span class="ln"></span><span><i>2</i> Login va parol</span></div>
      <h2>Ro'yxatdan o'tish</h2>
      <label>Ism va familiya<input id="ozn" autocomplete="name" required minlength="2" maxlength="80" value="${esc(draft.full_name)}" placeholder="Masalan: Aliyev Vali"></label>
      <label>Sinf yoki guruh <span class="hint">(ixtiyoriy)</span><input id="ozs" maxlength="40" value="${esc(draft.sinf)}" placeholder="Masalan: 11-B"></label>
      <label>Hudud <span class="hint">(ixtiyoriy)</span><select id="ozv"><option value="">Tanlang</option>${VILOYAT.map(v=>`<option ${draft.viloyat===v?"selected":""}>${v}</option>`).join("")}</select></label>
      <p class="err" id="ozerr" role="alert"></p>
      <button class="btn" type="submit">Davom etish →</button></form>`;
  } else {
    body = `<form class="bd" id="ozf"><div class="steps"><span class="on"><i>1</i> Ma'lumotlar</span><span class="ln"></span><span class="on"><i>2</i> Login va parol</span></div>
      <h2>Login va parol</h2>
      <label>Login <span class="hint">3–24 ta lotin harfi, raqam, _ yoki nuqta</span><input id="ozu" autocomplete="username" autocapitalize="none" spellcheck="false" required value="${esc(draft.username)}" placeholder="masalan: vali_aliyev"></label>
      <label>Parol <span class="hint">kamida 6 belgi</span><input id="ozp" type="password" autocomplete="new-password" required minlength="6"></label>
      <label>Parolni takrorlang<input id="ozp2" type="password" autocomplete="new-password" required minlength="6"></label>
      <p class="note">Loginni va parolni yozib qo'ying: email ishlatilmagani uchun parolni tiklash faqat sayt egasi orqali bo'ladi.</p>
      <p class="err" id="ozerr" role="alert"></p>
      <div class="row"><button class="btn ghost" type="button" id="ozback">← Orqaga</button><button class="btn" type="submit">Hisob yaratish</button></div></form>`;
  }
  const d = dialog(tabs + body);
  d.querySelectorAll("[data-t]").forEach(b => b.onclick = () => openAuth(b.dataset.t));
  d.querySelectorAll("[data-go]").forEach(a => a.onclick = e => { e.preventDefault(); openAuth(a.dataset.go); });
  const f = d.querySelector("#ozf"), err = d.querySelector("#ozerr");
  const back = d.querySelector("#ozback"); if(back) back.onclick = () => { draft.username = d.querySelector("#ozu").value; openAuth("signup", 1); };
  f.onsubmit = async e => {
    e.preventDefault(); err.textContent = "";
    const btn = f.querySelector('[type="submit"]');
    if(tab==="login"){
      const u = d.querySelector("#ozu").value.trim().toLowerCase();
      if(!loginOk(u)){ err.textContent = "Login 3–24 ta lotin harfi, raqam, _ yoki nuqtadan iborat bo'ladi."; return; }
      btn.disabled = true;
      const {error} = await client.auth.signInWithPassword({email:emailOf(u), password:d.querySelector("#ozp").value});
      btn.disabled = false;
      if(error){ err.textContent = errText(error); return; }
      d.close();
    } else if((step||1)===1){
      draft.full_name = d.querySelector("#ozn").value.trim().replace(/\s+/g," ");
      draft.sinf = d.querySelector("#ozs").value.trim(); draft.viloyat = d.querySelector("#ozv").value;
      if(draft.full_name.length<2){ err.textContent = "Ism va familiyani yozing."; return; }
      openAuth("signup", 2);
    } else {
      const u = d.querySelector("#ozu").value.trim().toLowerCase(), p = d.querySelector("#ozp").value;
      draft.username = u;
      if(!loginOk(u)){ err.textContent = "Login 3–24 ta lotin harfi, raqam, _ yoki nuqtadan iborat bo'lsin (bo'sh joysiz)."; return; }
      if(p.length<6){ err.textContent = "Parol kamida 6 belgidan iborat bo'lsin."; return; }
      if(p !== d.querySelector("#ozp2").value){ err.textContent = "Parollar bir xil emas."; return; }
      btn.disabled = true;
      try{ const {data:free} = await client.rpc("oz_username_free", {p:u}); if(free===false){ btn.disabled=false; err.textContent = "Bu login band. Boshqa login tanlang."; return; } }catch(e){}
      const {data, error} = await client.auth.signUp({email:emailOf(u), password:p, options:{data:{username:u, full_name:draft.full_name, sinf:draft.sinf, viloyat:draft.viloyat}}});
      btn.disabled = false;
      if(error){ err.textContent = errText(error); return; }
      if(!data.session){ err.textContent = "Hisob yaratildi, lekin hali faollashtirilmagan. Sayt egasiga xabar bering."; return; }
      dialog(`<div class="bd"><h2>Xush kelibsiz, ${esc(draft.full_name.split(" ")[0])}!</h2>
        <p>Hisobingiz tayyor. Login: <b class="num">${esc(u)}</b></p>
        <p class="note">Endi test natijalaringiz va mashqlardagi ballaringiz kabinetingizda saqlanadi, haftalik reytingda ismingiz chiqadi.</p>
        <button class="btn" type="button" id="ozdone">Boshlash</button></div>`).querySelector("#ozdone").onclick = () => dlg.close();
      Object.assign(draft, {full_name:"", sinf:"", viloyat:"", username:""});
    }
  };
  setTimeout(() => { const i = d.querySelector("input"); if(i) i.focus(); }, 30);
}

async function openCabinet(){
  const p = OZ.profile || {};
  const d = dialog(`<div class="bd"><div class="eyebrow">Kabinet</div><h2>${esc(p.full_name||"Hisobim")}</h2>
    <p class="note">Login: <b class="num">${esc(p.username||"")}</b>${p.sinf?` · ${esc(p.sinf)}`:""}${p.viloyat?` · ${esc(p.viloyat)}`:""}</p>
    <div id="ozres"><p class="note">Natijalar yuklanmoqda…</p></div>
    <button class="btn ghost" type="button" id="ozout">Chiqish</button></div>`);
  d.querySelector("#ozout").onclick = async () => { await client.auth.signOut(); d.close(); };
  const box = d.querySelector("#ozres");
  try{
    const [a, b, t] = await Promise.all([
      client.from("ms_attempts").select("test_id,score,level,created_at").order("created_at",{ascending:false}).limit(30),
      client.from("oz_practice").select("mode,score,correct,total,created_at").order("created_at",{ascending:false}).limit(200),
      fetch("tests.json").then(r=>r.json()).catch(()=>[])
    ]);
    const title = id => (t.find(v=>v.id===id)||{}).title || id;
    const day = s => new Date(s).toLocaleDateString("uz-UZ",{day:"2-digit",month:"2-digit",year:"numeric"});
    let html = `<h3 style="font-size:18px;margin:4px 0">Test natijalari</h3>`;
    html += a.data && a.data.length ? `<table><tr><th>Variant</th><th>Ball</th><th>Daraja</th><th>Sana</th></tr>${a.data.map(r=>`<tr><td>${esc(title(r.test_id))}</td><td class="num">${String(r.score).replace(".",",")}</td><td>${esc(r.level)}</td><td class="num">${day(r.created_at)}</td></tr>`).join("")}</table>` : `<p class="note">Hali test yechilmagan. Hisobga kirgan holda yechilgan testlar shu yerda ko'rinadi.</p>`;
    const best = {};
    (b.data||[]).forEach(r => { const m = best[r.mode] || (best[r.mode] = {n:0, best:0}); m.n++; m.best = Math.max(m.best, r.score); });
    html += `<h3 style="font-size:18px;margin:12px 0 4px">Mashqlar</h3>`;
    html += Object.keys(best).length ? `<table><tr><th>Mashq</th><th>Urinish</th><th>Eng yaxshi</th></tr>${Object.entries(best).map(([m,v])=>`<tr><td>${esc(MODES[m]||m)}</td><td class="num">${v.n}</td><td class="num">${v.best}</td></tr>`).join("")}</table>` : `<p class="note">Hali mashq bajarilmagan.</p>`;
    box.innerHTML = html;
  }catch(e){ box.innerHTML = `<p class="err">Natijalarni yuklab bo'lmadi.</p>`; }
}

async function loadProfile(){
  if(!OZ.user){ OZ.profile = null; return; }
  const {data} = await client.from("oz_profiles").select("username,full_name,sinf,viloyat").eq("id", OZ.user.id).maybeSingle();
  const m = OZ.user.user_metadata || {};
  OZ.profile = data || {username:m.username, full_name:m.full_name, sinf:m.sinf, viloyat:m.viloyat};
}
async function changed(session){
  OZ.session = session; OZ.user = session ? session.user : null;
  try{ await loadProfile(); }catch(e){}
  paintWho(); OZ.subs.forEach(f => { try{ f(OZ.user); }catch(e){} });
}

header();
OZ.ready = client ? client.auth.getSession().then(r => changed(r.data.session)).catch(()=>changed(null)) : Promise.resolve();
if(client) client.auth.onAuthStateChange((ev, session) => { if(ev!=="INITIAL_SESSION") setTimeout(()=>changed(session),0); });
paintWho();
})();
