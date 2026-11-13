// Draws the result certificate (SVG -> PNG) that the Telegram bot sends after a Milliy sertifikat test.
// Fonts ship in sertifikat/fonts (all SIL OFL); nothing is fetched at run time.
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const FONT_DIR = path.join(process.cwd(), "sertifikat", "fonts");
let FONTS = null;
function fonts(){
  if(!FONTS) FONTS = fs.readdirSync(FONT_DIR).filter(f => f.endsWith(".ttf")).map(f => path.join(FONT_DIR, f));
  return FONTS;
}

export const LEVELS = [["A+",70],["A",65],["B+",60],["B",55],["C+",50],["C",46]];
export function levelOf(score){ for(const [l,t] of LEVELS) if(score >= t) return l; return null; }
// Next level up and the points still missing (null when already A+).
export function nextLevel(score){
  for(let i = LEVELS.length - 1; i >= 0; i--){ const [l,t] = LEVELS[i]; if(score < t) return {level:l, need:Math.round((t - score)*10)/10}; }
  return null;
}
export const fmt = n => (Math.round(n*10)/10).toFixed(1).replace(".", ",").replace(",0", "");

// Short, warm words for each level; the bot repeats them in its message.
export function motivation(score){
  const l = levelOf(score), nx = nextLevel(score);
  if(l === "A+") return "Ajoyib natija! Siz eng yuqori darajadasiz — shu sur'atda davom eting!";
  if(l === "A")  return `Zo'r natija! A+ darajagacha atigi ${fmt(nx.need)} ball qoldi.`;
  if(l === "B+" || l === "B") return `Yaxshi natija! Yana biroz mashq — va ${nx.level} daraja sizniki.`;
  if(l === "C+" || l === "C") return `Yaxshi qadam! Har bir test sizni maqsadga yaqinlashtiradi.`;
  return "Birinchi qadam qo'yildi! Xatolarni tahlil qilib, qayta urinib ko'ring.";
}

const X = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))
  .replace(/[ʻ‘`]/g, "‘").replace(/[ʼ’]/g, "’");

// Eight-pointed star (two squares), the girih motif used in the corners.
function star(cx, cy, r, fill, op = 1){
  const sq = rot => [0,1,2,3].map(i => { const a = (i*90 + 45 + rot) * Math.PI/180; return `${(cx + r*Math.cos(a)).toFixed(1)},${(cy + r*Math.sin(a)).toFixed(1)}`; }).join(" ");
  return `<polygon points="${sq(0)}" fill="${fill}" opacity="${op}"/><polygon points="${sq(45)}" fill="${fill}" opacity="${op}"/>`;
}
function corner(x, y, sx, sy){
  return `<g transform="translate(${x} ${y}) scale(${sx} ${sy})">
    <path d="M0 150 L0 0 L150 0" fill="none" stroke="#B88A2E" stroke-width="5"/>
    <path d="M22 120 L22 22 L120 22" fill="none" stroke="#B88A2E" stroke-width="2"/>
    ${star(58, 58, 30, "#B88A2E")}${star(58, 58, 15, "#FBF6EA")}${star(58, 58, 7, "#14213D")}
  </g>`;
}

// Splits text into lines of at most `max` characters, on spaces.
function wrap(text, max){
  const out = []; let cur = "";
  for(const w of String(text).split(/\s+/)){
    if(cur && (cur + " " + w).length > max){ out.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
  }
  if(cur) out.push(cur);
  return out;
}

export function sertifikatSvg({ism, title, score, date, code}){
  const W = 2000, H = 1414, cx = W/2;
  const lvl = levelOf(score);
  const nx = nextLevel(score);
  const nameSize = Math.min(150, Math.floor(1500 / Math.max(8, [...ism].length * 0.42)));
  const short = String(title).replace(/\s*\(.*$/, "").slice(0, 18);
  const motL = wrap(motivation(score), 56);

  // Score scale with level marks from 30 to 100 points.
  const bx = 560, bw = 880, by = 1112, lo = 30, hi = 100;
  const px = v => bx + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * bw;
  const ticks = [...LEVELS].reverse().map(([l,t]) => `
    <line x1="${px(t)}" y1="${by-14}" x2="${px(t)}" y2="${by+14}" stroke="#14213D" stroke-width="2" opacity=".35"/>
    <text x="${px(t)}" y="${by+46}" font-family="Manrope" font-weight="700" font-size="22" fill="${l===lvl?"#14213D":"#8C8270"}" text-anchor="middle">${l}</text>`).join("");

  const seal = lvl ? `
    <g transform="translate(1640 1000)">
      <path d="M-62 60 L-92 200 L-48 172 L-22 214 L0 80 Z" fill="#8E2F2F"/>
      <path d="M62 60 L92 200 L48 172 L22 214 L0 80 Z" fill="#A83A3A"/>
      ${[...Array(24)].map((_, i) => { const a = i*15*Math.PI/180; return `<circle cx="${(Math.cos(a)*118).toFixed(1)}" cy="${(Math.sin(a)*118).toFixed(1)}" r="20" fill="url(#gold)"/>`; }).join("")}
      <circle r="118" fill="url(#gold)"/>
      <circle r="100" fill="none" stroke="#FFF6DC" stroke-width="3" opacity=".8"/>
      <circle r="90" fill="none" stroke="#FFF6DC" stroke-width="1.5" stroke-dasharray="4 6" opacity=".8"/>
      <text y="-40" font-family="Manrope" font-weight="700" font-size="20" letter-spacing="5" fill="#FFF6DC" text-anchor="middle">DARAJA</text>
      <text y="${lvl.length > 1 ? 42 : 46}" font-family="Playfair Display" font-weight="900" font-size="${lvl.length > 1 ? 92 : 104}" fill="#FFFFFF" text-anchor="middle">${lvl}</text>
      <text y="78" font-family="Manrope" font-weight="700" font-size="20" letter-spacing="3" fill="#FFF6DC" text-anchor="middle">${fmt(score)} BALL</text>
    </g>` : `
    <g transform="translate(1640 1000)">
      <circle r="118" fill="url(#navy)"/>
      <circle r="100" fill="none" stroke="#E7C873" stroke-width="3"/>
      <text y="-18" font-family="Manrope" font-weight="700" font-size="20" letter-spacing="4" fill="#E7C873" text-anchor="middle">ISHTIROKCHI</text>
      <text y="44" font-family="Playfair Display" font-weight="900" font-size="64" fill="#FFFFFF" text-anchor="middle">${fmt(score)}</text>
      <text y="78" font-family="Manrope" font-weight="700" font-size="20" letter-spacing="3" fill="#E7C873" text-anchor="middle">BALL</text>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="paper" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#FFFDF7"/><stop offset=".7" stop-color="#FBF5E6"/><stop offset="1" stop-color="#F1E5C8"/></radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D98B"/><stop offset=".45" stop-color="#C9973A"/><stop offset="1" stop-color="#8F6420"/></linearGradient>
    <linearGradient id="navy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22345E"/><stop offset="1" stop-color="#0E1830"/></linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9973A"/><stop offset="1" stop-color="#14213D"/></linearGradient>
    <pattern id="girih" width="120" height="120" patternUnits="userSpaceOnUse">${star(60, 60, 26, "#B88A2E", .06)}${star(0, 0, 12, "#B88A2E", .05)}${star(120, 0, 12, "#B88A2E", .05)}${star(0, 120, 12, "#B88A2E", .05)}${star(120, 120, 12, "#B88A2E", .05)}</pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#navy)"/>
  <rect x="34" y="34" width="${W-68}" height="${H-68}" fill="url(#paper)"/>
  <rect x="34" y="34" width="${W-68}" height="${H-68}" fill="url(#girih)"/>
  <rect x="70" y="70" width="${W-140}" height="${H-140}" fill="none" stroke="#B88A2E" stroke-width="3"/>
  <rect x="84" y="84" width="${W-168}" height="${H-168}" fill="none" stroke="#B88A2E" stroke-width="1.2"/>
  ${corner(100, 100, 1, 1)}${corner(W-100, 100, -1, 1)}${corner(100, H-100, 1, -1)}${corner(W-100, H-100, -1, -1)}

  <text x="${cx}" y="215" font-family="Unbounded" font-weight="600" font-size="30" letter-spacing="10" fill="#14213D" text-anchor="middle">O‘ZING O‘RGAN</text>
  <g transform="translate(${cx} 250)"><line x1="-210" y1="0" x2="-30" y2="0" stroke="#B88A2E" stroke-width="2"/><line x1="30" y1="0" x2="210" y2="0" stroke="#B88A2E" stroke-width="2"/>${star(0, 0, 13, "#B88A2E")}</g>
  <text x="${cx}" y="400" font-family="Playfair Display" font-weight="900" font-size="150" letter-spacing="14" fill="#14213D" text-anchor="middle">SERTIFIKAT</text>
  <text x="${cx}" y="465" font-family="Manrope" font-weight="700" font-size="30" letter-spacing="8" fill="#9A7428" text-anchor="middle">MILLIY SERTIFIKAT · TARIX · SINOV TEST NATIJASI</text>

  <text x="${cx}" y="545" font-family="Manrope" font-weight="500" font-size="32" fill="#6B6252" text-anchor="middle">Ushbu sertifikat</text>
  <text x="${cx}" y="${545 + 40 + nameSize*0.85}" font-family="Great Vibes" font-size="${nameSize}" fill="#14213D" text-anchor="middle">${X(ism)}</text>
  <line x1="${cx-560}" y1="${545 + 66 + nameSize*0.85}" x2="${cx+560}" y2="${545 + 66 + nameSize*0.85}" stroke="url(#gold)" stroke-width="3"/>
  <g transform="translate(${cx} 790)">
    <rect x="-500" y="0" width="1000" height="118" rx="14" fill="#FFFFFF" fill-opacity=".72" stroke="#B88A2E" stroke-width="2"/>
    ${[["FAN","Tarix"],["VARIANT",short],["BALL",`${fmt(score)} / 100`],["DARAJA",lvl || "—"]].map(([k,v], i) => `
      ${i ? `<line x1="${-500 + i*250}" y1="18" x2="${-500 + i*250}" y2="100" stroke="#B88A2E" stroke-width="1.5" opacity=".6"/>` : ""}
      <text x="${-375 + i*250}" y="44" font-family="Manrope" font-weight="700" font-size="20" letter-spacing="4" fill="#9A7428" text-anchor="middle">${k}</text>
      <text x="${-375 + i*250}" y="92" font-family="${i > 1 ? "Playfair Display" : "Manrope"}" font-weight="${i > 1 ? 900 : 700}" font-size="${i > 1 ? 44 : 34}" fill="#14213D" text-anchor="middle">${X(v)}</text>`).join("")}
  </g>
  ${motL.map((l, i) => `<text x="${cx}" y="${975 + i*46}" font-family="Playfair Display" font-style="italic" font-weight="500" font-size="38" fill="#8E2F2F" text-anchor="middle">${X(l)}</text>`).join("")}

  <rect x="${bx}" y="${by-7}" width="${bw}" height="14" rx="7" fill="#14213D" opacity=".1"/>
  <rect x="${bx}" y="${by-7}" width="${px(score)-bx}" height="14" rx="7" fill="url(#bar)"/>
  ${ticks}
  <circle cx="${px(score)}" cy="${by}" r="17" fill="#FFFFFF" stroke="#14213D" stroke-width="5"/>
  <text x="${cx}" y="${by-34}" font-family="Manrope" font-weight="700" font-size="24" fill="#6B6252" text-anchor="middle">${nx ? X(`Keyingi daraja ${nx.level} gacha: ${fmt(nx.need)} ball`) : "Eng yuqori daraja: A+"}</text>

  <g font-family="Manrope" fill="#3A3428">
    <text x="240" y="1160" font-weight="700" font-size="22" letter-spacing="4" fill="#9A7428">SANA</text>
    <text x="240" y="1202" font-weight="700" font-size="34">${X(date)}</text>
  </g>
  ${seal}
  <text x="${cx}" y="1212" font-family="Manrope" font-weight="700" font-size="28" letter-spacing="2" fill="#14213D" text-anchor="middle">ozing-organ.uz</text>
  <rect x="${cx-620}" y="1240" width="1240" height="62" rx="12" fill="#8E2F2F" fill-opacity=".08" stroke="#8E2F2F" stroke-opacity=".45" stroke-width="1.5"/>
  <text x="${cx}" y="1280" font-family="Manrope" font-weight="700" font-size="23" fill="#7A2626" text-anchor="middle">Diqqat: bu sertifikat rasmiy hujjat emas va hech qanday yuridik kuchga ega emas. Faqat mashq natijasi.</text>
</svg>`;
}

export function sertifikatPng(data){
  const r = new Resvg(sertifikatSvg(data), {font:{fontFiles:fonts(), loadSystemFonts:false, defaultFontFamily:"Manrope"}, fitTo:{mode:"width", value:2000}});
  return r.render().asPng();
}
