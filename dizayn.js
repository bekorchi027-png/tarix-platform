// Theme toggle (dark default). The <head> sets data-theme early; this adds the sun/moon button to the header from auth.js.
(function(){
  const KEY = "oz-tema", root = document.documentElement;
  const SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function set(t){ root.dataset.theme = t; try{ localStorage.setItem(KEY, t); }catch(e){}
    const m = document.querySelector('meta[name="theme-color"]'); if(m) m.content = t === "light" ? "#f4f6fb" : "#070b14"; paint(); }
  function paint(){ const b = document.querySelector(".oztema"); if(!b) return; const dark = root.dataset.theme !== "light";
    b.innerHTML = dark ? SUN : MOON; b.title = b.ariaLabel = dark ? "Yorug' rejim" : "Tungi rejim"; }
  function mount(){
    const bar = document.querySelector(".ozbar > .in"); if(!bar || bar.querySelector(".oztema")) return !!bar;
    const b = document.createElement("button"); b.type = "button"; b.className = "oztema";
    b.onclick = () => set(root.dataset.theme === "light" ? "dark" : "light");
    const who = bar.querySelector(".who"); who ? bar.insertBefore(b, who) : bar.appendChild(b); paint(); return true;
  }
  if(!mount()){ const mo = new MutationObserver(() => { if(mount()) mo.disconnect(); }); mo.observe(document.documentElement, {childList:true, subtree:true}); }
})();
