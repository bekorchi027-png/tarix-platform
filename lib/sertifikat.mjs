// Draws the result certificate (SVG -> PNG) that the Telegram bot sends after a Milliy sertifikat test.
// Layout follows the familiar portrait certificate format, but it is O'zing O'rgan branded and
// carries no state emblem, agency name, signature or serial number, plus a visible "no legal force" note.
// Fonts ship in sertifikat/fonts (OFL / GPL+font-exception); nothing is fetched at run time.
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.join(process.cwd(), "sertifikat");
let FONTS = null, QR = null;
function fonts(){
  if(!FONTS) FONTS = fs.readdirSync(path.join(ROOT, "fonts")).filter(f => f.endsWith(".ttf")).map(f => path.join(ROOT, "fonts", f));
  return FONTS;
}
function qr(){ if(!QR) QR = JSON.parse(fs.readFileSync(path.join(ROOT, "qr.json"), "utf8")); return QR; }

export const LEVELS = [["A+",70],["A",65],["B+",60],["B",55],["C+",50],["C",46]];
export function levelOf(score){ for(const [l,t] of LEVELS) if(score >= t) return l; return null; }
// Next level up and the points still missing (null when already A+).
export function nextLevel(score){
  for(let i = LEVELS.length - 1; i >= 0; i--){ const [l,t] = LEVELS[i]; if(score < t) return {level:l, need:Math.round((t - score)*10)/10}; }
  return null;
}
export const fmt = n => (Math.round(n*10)/10).toFixed(1).replace(".", ",").replace(",0", "");
const dot = n => (Math.round(n*10)/10).toFixed(1);

// Short, warm words for each level; the bot repeats them in its message.
export function motivation(score){
  const l = levelOf(score), nx = nextLevel(score);
  if(l === "A+") return "Ajoyib natija! Siz eng yuqori darajadasiz — shu sur'atda davom eting!";
  if(l === "A")  return `Zo'r natija! A+ darajagacha atigi ${fmt(nx.need)} ball qoldi.`;
  if(l === "B+" || l === "B") return `Yaxshi natija! Yana biroz mashq — va ${nx.level} daraja sizniki.`;
  if(l === "C+" || l === "C") return `Yaxshi qadam! Har bir test sizni maqsadga yaqinlashtiradi.`;
  return "Birinchi qadam qo'yildi! Xatolarni tahlil qilib, qayta urinib ko'ring.";
}

// Uzbek apostrophes as typographic ‘ ’ (present in every bundled font).
const X = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))
  .replace(/([OoGg])['`ʻ’]/g, "$1‘").replace(/[ʻ`]/g, "‘").replace(/[ʼ]/g, "’");
const UP = s => String(s ?? "").toLocaleUpperCase("uz");

// Eight-pointed star (two squares), the girih motif.
function star(cx, cy, r, fill, op = 1, extra = ""){
  const sq = rot => [0,1,2,3].map(i => { const a = (i*90 + 45 + rot) * Math.PI/180; return `${(cx + r*Math.cos(a)).toFixed(1)},${(cy + r*Math.sin(a)).toFixed(1)}`; }).join(" ");
  return `<polygon points="${sq(0)}" fill="${fill}" opacity="${op}" ${extra}/><polygon points="${sq(45)}" fill="${fill}" opacity="${op}" ${extra}/>`;
}
// Hexagon outline, for the corner lattice.
function hex(cx, cy, r){
  return `<polygon points="${[0,1,2,3,4,5].map(i => { const a = (60*i + 30) * Math.PI/180; return `${(cx + r*Math.cos(a)).toFixed(1)},${(cy + r*Math.sin(a)).toFixed(1)}`; }).join(" ")}"/>`;
}
function lattice(){
  const out = [], r = 46, w = r*Math.sqrt(3);
  for(let row = 0; row < 5; row++) for(let col = 0; col < 5 - row; col++){
    const cx = col*w + (row % 2 ? w/2 : 0), cy = row*r*1.5;
    out.push(hex(cx, cy, r), hex(cx, cy, r*0.55));
  }
  return out.join("");
}

// Smiling sticker shown when the student sends no photo.
function smiley(x, y, w, h){
  const cx = x + w/2, cy = y + h/2, r = Math.min(w, h)*0.36;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFF8E1"/>
    ${star(x + 26, y + 30, 10, "#F5B700", .7)}${star(x + w - 28, y + h - 34, 8, "#F5B700", .6)}${star(x + w - 34, y + 30, 6, "#FF8A65", .7)}
    <circle cx="${cx}" cy="${cy + 4}" r="${r}" fill="#E0A100" opacity=".25"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sun)"/>
    <ellipse cx="${cx - r*0.36}" cy="${cy - r*0.18}" rx="${r*0.1}" ry="${r*0.15}" fill="#3B2A10"/>
    <ellipse cx="${cx + r*0.36}" cy="${cy - r*0.18}" rx="${r*0.1}" ry="${r*0.15}" fill="#3B2A10"/>
    <circle cx="${cx - r*0.33}" cy="${cy - r*0.24}" r="${r*0.035}" fill="#fff"/><circle cx="${cx + r*0.39}" cy="${cy - r*0.24}" r="${r*0.035}" fill="#fff"/>
    <ellipse cx="${cx - r*0.6}" cy="${cy + r*0.18}" rx="${r*0.16}" ry="${r*0.1}" fill="#FF7A59" opacity=".55"/>
    <ellipse cx="${cx + r*0.6}" cy="${cy + r*0.18}" rx="${r*0.16}" ry="${r*0.1}" fill="#FF7A59" opacity=".55"/>
    <path d="M${cx - r*0.48} ${cy + r*0.12} Q${cx} ${cy + r*0.78} ${cx + r*0.48} ${cy + r*0.12} Q${cx} ${cy + r*0.38} ${cx - r*0.48} ${cy + r*0.12} Z" fill="#7A2E12"/>
    <path d="M${cx - r*0.22} ${cy + r*0.42} Q${cx} ${cy + r*0.6} ${cx + r*0.22} ${cy + r*0.42} Q${cx} ${cy + r*0.5} ${cx - r*0.22} ${cy + r*0.42} Z" fill="#FF8A80"/>
  </g>`;
}

/**
 * data: {familiya, ism, title, score, date, sections:[{nom, got, max}], photo?: {buf, mime}}
 */
export function sertifikatSvg({familiya, ism, title, score, date, sections = [], photo = null}){
  const W = 1240, H = 1754, L = 110, R = 1130;
  const lvl = levelOf(score), nx = nextLevel(score);
  const q = qr(), qs = 150, qx = W/2 - qs/2, qy = 1470;
  const serif = `font-family="Liberation Serif"`;
  const row = (y, label, value, bold = true, size = 25) =>
    `<text x="${L+6}" y="${y}" ${serif} font-size="22" fill="#2B2B2B">${X(label)}</text>
     <text x="420" y="${y}" ${serif} font-weight="${bold ? 700 : 400}" font-size="${size}" fill="#111">${X(value)}</text>`;
  const px = 920, py = 505, pw = 190, ph = 240;
  const photoSvg = photo
    ? `<clipPath id="pc"><rect x="${px}" y="${py}" width="${pw}" height="${ph}"/></clipPath>
       <image x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice" clip-path="url(#pc)" href="data:${photo.mime};base64,${photo.buf.toString("base64")}"/>`
    : smiley(px, py, pw, ph);
  const secY = 925;
  const secRows = sections.map((s, i) => `
    <text x="${L+16}" y="${secY + 44 + i*36}" ${serif} font-size="23" fill="#2B2B2B">${X(s.nom)}:</text>
    <text x="${R-6}" y="${secY + 44 + i*36}" ${serif} font-weight="700" font-size="23" fill="#111" text-anchor="end">${dot(s.got)} / ${dot(s.max)}</text>`).join("");
  const motY = secY + 44 + sections.length*36 + 70;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="paper" cx="50%" cy="48%" r="70%"><stop offset="0" stop-color="#FFFDF5"/><stop offset=".45" stop-color="#F6EDD2"/><stop offset="1" stop-color="#E2CF98"/></radialGradient>
    <radialGradient id="sun" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFE680"/><stop offset=".7" stop-color="#FFC928"/><stop offset="1" stop-color="#F5A800"/></radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D98B"/><stop offset=".5" stop-color="#C9973A"/><stop offset="1" stop-color="#8F6420"/></linearGradient>
    <pattern id="girih" width="64" height="64" patternUnits="userSpaceOnUse">${star(32, 32, 16, "none", 1, 'stroke="#A88A3E" stroke-opacity=".16" stroke-width="1.2"')}${star(0, 0, 9, "#A88A3E", .07)}${star(64, 0, 9, "#A88A3E", .07)}${star(0, 64, 9, "#A88A3E", .07)}${star(64, 64, 9, "#A88A3E", .07)}</pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#paper)"/>
  <rect width="${W}" height="${H}" fill="url(#girih)"/>
  <rect x="26" y="26" width="${W-52}" height="${H-52}" fill="none" stroke="#A88A3E" stroke-width="3"/>
  <rect x="38" y="38" width="${W-76}" height="${H-76}" fill="none" stroke="#A88A3E" stroke-width="1.2"/>
  <g transform="translate(${W-44} 44) scale(-1 1)" fill="none" stroke="#B89A4E" stroke-opacity=".55" stroke-width="2.5">${lattice()}</g>
  <g transform="translate(44 ${H-44}) scale(1 -1)" fill="none" stroke="#B89A4E" stroke-opacity=".55" stroke-width="2.5">${lattice()}</g>

  <g transform="translate(${W/2} 165)">
    <circle r="78" fill="url(#gold)"/>
    <circle r="66" fill="none" stroke="#FFF6DC" stroke-width="2.5"/>
    ${star(0, 0, 46, "#14213D")}${star(0, 0, 24, "#F3D98B")}${star(0, 0, 11, "#14213D")}
  </g>
  <text x="${W/2}" y="290" font-family="Unbounded" font-weight="600" font-size="30" letter-spacing="6" fill="#14213D" text-anchor="middle">O‘ZING O‘RGAN</text>
  <text x="${W/2}" y="326" ${serif} font-weight="700" font-size="21" letter-spacing="1" fill="#2B2B2B" text-anchor="middle">TARIX FANIDAN ONLAYN TAYYORGARLIK PLATFORMASI</text>
  <rect x="${L-10}" y="350" width="${R-L+20}" height="4" fill="#1A1A1A"/>
  <text x="${W/2}" y="405" ${serif} font-weight="700" font-size="28" fill="#111" text-anchor="middle">MILLIY SERTIFIKAT FORMATIDAGI SINOV TESTI</text>
  <text x="${W/2}" y="441" ${serif} font-weight="700" font-size="28" fill="#111" text-anchor="middle">NATIJASI TO‘G‘RISIDA SERTIFIKAT</text>

  ${row(540, "Familiyasi:", UP(familiya), true, 26)}
  ${row(600, "Ismi:", UP(ism), true, 26)}
  ${row(660, "Test varianti:", title, true, 23)}
  ${row(720, "Topshirilgan sana:", date, true, 23)}
  <rect x="${px-2}" y="${py-2}" width="${pw+4}" height="${ph+4}" fill="#fff" stroke="#7D7D7D" stroke-width="2"/>
  ${photoSvg}
  <line x1="${L}" y1="785" x2="${R}" y2="785" stroke="#A88A3E" stroke-opacity=".6" stroke-width="1.2"/>

  <text x="${L+6}" y="835" ${serif} font-size="22" fill="#2B2B2B">Fan: <tspan font-weight="700" fill="#111">Tarix (O‘zbek)</tspan></text>
  <text x="${L+6}" y="875" ${serif} font-size="22" fill="#2B2B2B">Taxminiy daraja: <tspan font-weight="700" font-size="26" fill="#8E2F2F">${lvl || "C dan past"}</tspan></text>
  <text x="690" y="835" ${serif} font-size="21" fill="#2B2B2B">Umumiy to‘plangan ball:</text>
  <text x="${R-6}" y="835" ${serif} font-weight="700" font-size="23" fill="#111" text-anchor="end">${dot(score)}</text>
  <text x="690" y="875" ${serif} font-size="21" fill="#2B2B2B">Umumiy ballga nisbatan foiz:</text>
  <text x="${R-6}" y="875" ${serif} font-weight="700" font-size="23" fill="#111" text-anchor="end">${dot(score)} %</text>

  <text x="${L+6}" y="${secY}" ${serif} font-weight="700" font-size="24" fill="#111">Bo‘limlar bo‘yicha test sinovi natijalari:</text>
  ${secRows}

  <g transform="translate(${W/2} ${motY})">
    <rect x="-470" y="-44" width="940" height="${nx ? 128 : 92}" rx="14" fill="#FFFFFF" fill-opacity=".55" stroke="#A88A3E" stroke-opacity=".5"/>
    <text y="0" font-family="Playfair Display" font-style="italic" font-weight="500" font-size="30" fill="#8E2F2F" text-anchor="middle">${X(motivation(score))}</text>
    ${nx ? `<text y="44" ${serif} font-size="22" fill="#4A4436" text-anchor="middle">Keyingi daraja ${nx.level} gacha: <tspan font-weight="700">${fmt(nx.need)} ball</tspan></text>` : ""}
  </g>

  <line x1="${L}" y1="1440" x2="${R}" y2="1440" stroke="#A88A3E" stroke-opacity=".6" stroke-width="1.2"/>
  <text x="${L+6}" y="1490" ${serif} font-size="22" fill="#2B2B2B">Berilgan sanasi: <tspan font-weight="700" fill="#111">${X(date)}</tspan></text>
  <text x="${R-6}" y="1490" ${serif} font-size="22" fill="#2B2B2B" text-anchor="end">Natija turi: <tspan font-weight="700" fill="#111">mashq testi</tspan></text>
  <rect x="${qx-12}" y="${qy-12}" width="${qs+24}" height="${qs+24}" fill="#FFFFFF"/>
  <g transform="translate(${qx} ${qy}) scale(${qs/q.n})"><path d="${q.d}" fill="#111"/></g>
  <text x="${qx-36}" y="${qy+qs/2+8}" ${serif} font-weight="700" font-size="22" fill="#111" text-anchor="end">Saytga o‘tish</text>
  <text x="${qx+qs+36}" y="${qy+qs/2+8}" ${serif} font-weight="700" font-size="22" fill="#111">ozing-organ.uz</text>

  <rect x="${L-10}" y="1652" width="${R-L+20}" height="50" rx="10" fill="#8E2F2F" fill-opacity=".08" stroke="#8E2F2F" stroke-opacity=".5" stroke-width="1.5"/>
  <text x="${W/2}" y="1684" font-family="Manrope" font-weight="700" font-size="18.5" fill="#7A2626" text-anchor="middle">Diqqat: bu sertifikat rasmiy hujjat emas va hech qanday yuridik kuchga ega emas. Faqat mashq natijasi.</text>
</svg>`;
}

export function sertifikatPng(data){
  const r = new Resvg(sertifikatSvg(data), {font:{fontFiles:fonts(), loadSystemFonts:false, defaultFontFamily:"Liberation Serif"}, fitTo:{mode:"width", value:1654}});
  return r.render().asPng();
}
