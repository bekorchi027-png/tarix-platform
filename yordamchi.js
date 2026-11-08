// Site helper: a chat panel that explains the site and opens the page the visitor is looking for.
// Free parts (tour, keyword search) work without the AI; the AI goes through /api/yordamchi.
(function(){
  if(window.OZY) return;
  const LS = "oz-yordamchi";
  const st = (() => { try{ return JSON.parse(sessionStorage.getItem(LS)) || {}; }catch(e){ return {}; } })();
  st.tarix = st.tarix || [];
  const save = () => { try{ sessionStorage.setItem(LS, JSON.stringify({tarix:st.tarix.slice(-20), open:st.open})); }catch(e){} };
  let BILIM = null;
  const bilim = () => BILIM || (BILIM = fetch("/yordamchi-bilim.json").then(r => r.json()).catch(() => ({bolimlar:[]})));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm = s => String(s||"").toLowerCase().replace(/[ʻʼ'`‘’]/g, "").replace(/[^a-z0-9а-яё\s-]/gi, " ");

  const css = `
#ozy-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:60;border:0;border-radius:999px;background:var(--accent,#1f4f7a);color:var(--sheet,#fff);font:600 15px/1 var(--body,system-ui);padding:13px 18px;box-shadow:0 6px 20px rgba(0,0,0,.22);display:flex;gap:8px;align-items:center;cursor:pointer}
#ozy-fab svg{width:18px;height:18px}
#ozy{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:61;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100dvh - 32px));background:var(--sheet,#fff);color:var(--ink,#1b2430);border:1px solid var(--line,#d6dde2);border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;font:15px/1.5 var(--body,system-ui)}
#ozy.on{display:flex}
#ozy .hd{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line,#d6dde2)}
#ozy .hd b{flex:1;font-size:16px}
#ozy .hd button{border:0;background:transparent;color:var(--muted,#5d6b78);font-size:22px;line-height:1;cursor:pointer;padding:2px 6px}
#ozy .ms{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
#ozy .m{max-width:88%;padding:9px 12px;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere}
#ozy .m.u{align-self:flex-end;background:var(--accent,#1f4f7a);color:var(--sheet,#fff);border-bottom-right-radius:3px}
#ozy .m.a{align-self:flex-start;background:var(--paper,#f3f5f4);border-bottom-left-radius:3px}
#ozy .m.a .ln{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
#ozy .ln a,#ozy .chips button,#ozy .tour button{border:1px solid var(--accent,#1f4f7a);color:var(--accent,#1f4f7a);background:var(--sheet,#fff);border-radius:999px;padding:5px 11px;font:600 13px/1.3 var(--body,system-ui);text-decoration:none;cursor:pointer}
#ozy .ln a.pri,#ozy .tour button.pri{background:var(--accent,#1f4f7a);color:var(--sheet,#fff)}
#ozy .chips{display:flex;flex-wrap:wrap;gap:6px}
#ozy .tour{border:1px solid var(--line,#d6dde2);border-radius:8px;padding:12px;display:grid;gap:8px;background:var(--sheet,#fff)}
#ozy .tour .eb{font-size:12px;color:var(--muted,#5d6b78)}
#ozy .tour .row{display:flex;gap:6px;flex-wrap:wrap}
#ozy .dots span{display:inline-block;width:6px;height:6px;border-radius:9px;background:var(--line,#d6dde2);margin-right:4px}
#ozy .dots span.on{background:var(--accent,#1f4f7a)}
#ozy form{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line,#d6dde2)}
#ozy input{flex:1;min-width:0;border:1px solid var(--line,#d6dde2);border-radius:6px;padding:9px 10px;font:inherit;background:var(--sheet,#fff);color:inherit}
#ozy form button{border:1px solid var(--accent,#1f4f7a);background:var(--accent,#1f4f7a);color:var(--sheet,#fff);border-radius:6px;padding:0 14px;font-weight:600;cursor:pointer}
#ozy .typing{color:var(--muted,#5d6b78);font-style:italic}
#ozy .note{font-size:12px;color:var(--muted,#5d6b78)}
@media print{#ozy,#ozy-fab{display:none!important}}`;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  const fab = document.createElement("button");
  fab.id = "ozy-fab"; fab.type = "button"; fab.setAttribute("aria-label", "Sayt yordamchisi");
  fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>Yordamchi`;
  const box = document.createElement("div");
  box.id = "ozy"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Sayt yordamchisi");
  box.innerHTML = `<div class="hd"><b>Yordamchi</b><button type="button" data-x aria-label="Yopish">×</button></div>
    <div class="ms" aria-live="polite"></div>
    <form><input name="q" autocomplete="off" maxlength="500" placeholder="Savolingizni yozing…" aria-label="Savol"><button type="submit">Yuborish</button></form>`;
  document.body.append(fab, box);
  const ms = box.querySelector(".ms"), form = box.querySelector("form"), inp = form.q;

  // Hidden while a timed test runs, so it never becomes a cheating tool.
  const busy = () => !!document.querySelector("#timer") || /^#jonli\/\d/.test(location.hash);
  function guard(){ const b = busy(); fab.style.display = b || box.classList.contains("on") ? "none" : ""; if(b && box.classList.contains("on")) close(); }
  new MutationObserver(guard).observe(document.body, {childList:true, subtree:true});
  addEventListener("hashchange", guard);

  function scroll(){ ms.scrollTop = ms.scrollHeight; }
  function bubble(kim, matn, links){
    const d = document.createElement("div"); d.className = "m " + (kim === "user" ? "u" : "a");
    d.innerHTML = esc(matn) + (links && links.length ? `<div class="ln">${links.map((l,i) => `<a href="${esc(l.url)}" class="${i?"":"pri"}">${esc(l.nom)}</a>`).join("")}</div>` : "");
    ms.appendChild(d); scroll(); return d;
  }
  function greet(){
    ms.innerHTML = "";
    bubble("model", "Salom! Men O'zing O'rgan saytining yordamchisiman. Sayt bilan tanishtiraman va kerakli bo'limni ochib beraman. Masalan: \"jonli o'yinga qanday qo'shilaman?\" yoki \"Temuriylar davlati hududini ko'rsat\".");
    const c = document.createElement("div"); c.className = "chips";
    [["Saytni tanishtir", tour], ["Qanday mashqlar bor?"], ["Testni qanday boshlayman?"], ["Jonli o'yinga qanday qo'shilaman?"]].forEach(([t, f]) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = t;
      b.onclick = () => f ? f() : send(t); c.appendChild(b);
    });
    ms.appendChild(c);
    st.tarix.forEach(m => bubble(m.kim, m.matn, m.havolalar));
  }

  // ----- Free guided tour -----
  async function tour(){
    const B = (await bilim()).bolimlar.filter(b => !["natija"].includes(b.id));
    let i = 0;
    const card = document.createElement("div"); card.className = "tour"; ms.appendChild(card);
    function paint(){
      const b = B[i];
      card.innerHTML = `<div class="eb">Sayt bo'ylab sayohat · ${i+1}/${B.length}</div><b>${esc(b.nom)}</b><div>${esc(b.tavsif)}</div>
        <div class="dots">${B.map((_,k)=>`<span class="${k===i?"on":""}"></span>`).join("")}</div>
        <div class="row"><button type="button" class="pri" data-o>Ochish</button>${i?`<button type="button" data-p>← Oldingi</button>`:""}${i<B.length-1?`<button type="button" data-n>Keyingi →</button>`:`<button type="button" data-e>Tugatish</button>`}</div>`;
      card.querySelector("[data-o]").onclick = () => go(b.url);
      const p = card.querySelector("[data-p]"), n = card.querySelector("[data-n]"), e = card.querySelector("[data-e]");
      if(p) p.onclick = () => { i--; paint(); };
      if(n) n.onclick = () => { i++; paint(); };
      if(e) e.onclick = () => { card.remove(); bubble("model", "Sayohat tugadi. Biror narsani topa olmasangiz, shu yerga yozing."); };
      scroll();
    }
    paint();
  }

  // ----- Keyword search, used when the AI is unavailable -----
  async function search(q){
    const w = norm(q).split(/\s+/).filter(x => x.length > 2);
    const scored = (await bilim()).bolimlar.map(b => {
      const hay = norm(b.nom + " " + b.kalit + " " + b.tavsif);
      return {b, s: w.reduce((t, x) => t + (hay.includes(x.slice(0, Math.max(4, x.length - 2))) ? 1 : 0), 0)};
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
    return scored;
  }

  let sending = false;
  async function send(q){
    q = String(q || "").trim(); if(!q || sending) return;
    sending = true; inp.value = "";
    bubble("user", q);
    const wait = bubble("model", "Yozmoqda…"); wait.classList.add("typing");
    let ans = null, err = "";
    try{
      const r = await fetch("/api/yordamchi", {method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({q, tarix:st.tarix.slice(-6).map(m => ({kim:m.kim, matn:m.matn})), sahifa:location.pathname + location.hash})});
      const j = await r.json().catch(() => ({}));
      if(r.ok && j.javob) ans = j; else err = j.xato || String(r.status);
    }catch(e){ err = "tarmoq"; }
    wait.remove();
    if(ans){
      bubble("model", ans.javob, ans.havolalar);
      st.tarix.push({kim:"user", matn:q}, {kim:"model", matn:ans.javob, havolalar:ans.havolalar}); save();
    }else{
      const hits = await search(q);
      const why = err === "limit" ? "Hozir savollar ko'payib ketdi, birozdan keyin qayta yozing." : "Hozir AI javob bera olmayapti.";
      if(hits.length) bubble("model", why + " Mana, savolingizga mos bo'limlar:", hits.map(h => ({nom:h.b.nom, url:h.b.url})));
      else { bubble("model", why + " Mos bo'lim topilmadi. Saytni tanishtirib chiqishim mumkin:"); const c = document.createElement("div"); c.className = "chips"; const b = document.createElement("button"); b.type = "button"; b.textContent = "Saytni tanishtir"; b.onclick = tour; c.appendChild(b); ms.appendChild(c); scroll(); }
    }
    sending = false;
  }

  // ----- Opening links -----
  // ?oyna=royxat / ?oyna=kabinet open the sign-up or cabinet dialog from auth.js.
  function oyna(w){
    if(!window.OZ) return;
    (OZ.ready || Promise.resolve()).then(() => {
      if(w === "royxat") OZ.user ? document.querySelector("#ozwho")?.click() : OZ.open("signup");
      if(w === "kabinet") OZ.user ? document.querySelector("#ozwho")?.click() : OZ.open("login");
    });
  }
  function go(url){
    const u = new URL(url, location.origin);
    const same = u.pathname.replace(/index\.html$/, "") === location.pathname.replace(/index\.html$/, "");
    const w = u.searchParams.get("oyna");
    if(same && w){ oyna(w); if(innerWidth < 700) close(); return; }
    if(same && u.hash && !u.search){ location.hash = u.hash; if(innerWidth < 700) close(); return; }
    location.href = u.pathname + u.search + u.hash;
  }
  ms.addEventListener("click", e => {
    const a = e.target.closest("a[href]"); if(!a) return;
    e.preventDefault(); go(a.getAttribute("href"));
  });

  function open(){ box.classList.add("on"); st.open = true; save(); if(!ms.children.length) greet(); guard(); setTimeout(() => inp.focus(), 50); }
  function close(){ box.classList.remove("on"); st.open = false; save(); guard(); }
  fab.onclick = open;
  box.querySelector("[data-x]").onclick = close;
  addEventListener("keydown", e => { if(e.key === "Escape" && box.classList.contains("on")) close(); });
  form.onsubmit = e => { e.preventDefault(); send(inp.value); };

  // Arriving from a helper link like /?oyna=royxat
  const w0 = new URLSearchParams(location.search).get("oyna");
  if(w0){ oyna(w0); const p = new URLSearchParams(location.search); p.delete("oyna"); history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash); }
  if(st.open && !busy()) open();
  guard();
  window.OZY = {open, close, send, tour};
})();
