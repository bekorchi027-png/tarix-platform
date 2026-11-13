// Telegram bot "O'zing O'rgan": signs students up with first + last name and sends a certificate
// picture after each Milliy sertifikat test finished on ozing-organ.uz.
// The token lives only in the Vercel env var TELEGRAM_BOT_TOKEN. The database is reached through
// oz_bot_* RPCs that check a secret derived from the token (see migration oz_telegram_bot).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { sertifikatPng, motivation, levelOf, nextLevel, fmt } from "../lib/sertifikat.mjs";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const SB_URL = "https://nhwzwqjbwwzvqxvdbecc.supabase.co";
const SB_KEY = "sb_publishable_wlGqP_SHtv-BgS1RT4CpgQ_YpQDf2Ch";
const SITE = "https://ozing-organ.uz";
const ADMINS = String(process.env.BOT_ADMINS || "").split(",").map(s => s.trim()).filter(Boolean);

const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const DBK = TOKEN ? sha("oz-bot-db:" + TOKEN) : "";
const WHK = TOKEN ? sha("oz-bot-wh:" + TOKEN).slice(0, 48) : "";

let TESTS = null;
function testTitle(id){
  if(!TESTS){ try{ TESTS = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests.json"), "utf8")).map(t => [t.id, t.title])); }catch(e){ TESTS = {}; } }
  return TESTS[id] || id;
}

async function tg(method, body){
  const isForm = body instanceof FormData;
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {method:"POST", body: isForm ? body : JSON.stringify(body||{}), headers: isForm ? {} : {"Content-Type":"application/json"}});
  const j = await r.json().catch(() => ({}));
  if(!j.ok) console.error("tg", method, j.description);
  return j;
}
async function rpc(fn, args){
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {method:"POST", headers:{apikey:SB_KEY, Authorization:"Bearer "+SB_KEY, "Content-Type":"application/json"}, body:JSON.stringify({p_k:DBK, ...args})});
  if(!r.ok){ console.error("rpc", fn, r.status, await r.text()); throw new Error("rpc " + fn); }
  return r.json();
}
const getUser = chat => rpc("oz_bot_user", {p_chat:chat});
const saveUser = (chat, p) => rpc("oz_bot_user_save", {p_chat:chat, p});

const MENU = {keyboard:[[{text:"📝 Test yechish"},{text:"🏆 Natijalarim"}],[{text:"✏️ Ismni o'zgartirish"},{text:"ℹ️ Yordam"}]], resize_keyboard:true};
const send = (chat, text, extra = {}) => tg("sendMessage", {chat_id:chat, text, parse_mode:"HTML", disable_web_page_preview:true, ...extra});
const H = s => String(s ?? "").replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const fullName = u => [u.first_name, u.last_name].filter(Boolean).join(" ");

// Cleans one name word: letters (Latin or Cyrillic), apostrophes and hyphens, first letter upper case.
function cleanName(s){
  s = String(s || "").replace(/[`‘’ʻʼ´]/g, "'").replace(/\s+/g, " ").trim();
  if(!/^[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ' -]{2,30}$/.test(s) || !/[A-Za-zА-Яа-яЁё]{2}/.test(s)) return null;
  return s.split(" ").map(w => w.split("-").map(p => p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p).join("-")).join(" ");
}

function dateUz(iso){
  const d = new Date(new Date(iso).getTime() + 5*3600e3);   // Asia/Tashkent, no DST
  return `${String(d.getUTCDate()).padStart(2,"0")}.${String(d.getUTCMonth()+1).padStart(2,"0")}.${d.getUTCFullYear()}`;
}

async function askFirst(chat, pending){
  await saveUser(chat, {step:"ism", tmp:null, ...(pending ? {pending} : {})});
  return send(chat, "Sertifikatga yoziladigan <b>ismingizni</b> yozing.\n\nMasalan: <i>Aziza</i>", {reply_markup:{remove_keyboard:true}});
}

async function sendCertificate(chat, user, attemptId){
  const a = await rpc("oz_bot_claim", {p_chat:chat, p_attempt:attemptId});
  if(a.holat === "yoq") return send(chat, "Bu natija topilmadi. Test oxirida \"Sertifikatni Telegramda olish\" tugmasini qayta bosib ko'ring.", {reply_markup:MENU});
  if(a.holat === "band") return send(chat, "Bu natijaning sertifikati boshqa Telegram hisobiga berilgan. Har kim o'z natijasini o'zi oladi 🙂", {reply_markup:MENU});
  const score = Number(a.score), ism = fullName(user), title = testTitle(a.test_id);
  await tg("sendChatAction", {chat_id:chat, action:"upload_photo"});
  const png = sertifikatPng({ism, title, score, date:dateUz(a.created_at), code:String(a.id).slice(0,8).toUpperCase()});
  const st = await rpc("oz_bot_results", {p_chat:chat});
  const lvl = levelOf(score), nx = nextLevel(score);
  const best = st.soni > 1 && Number(st.eng) <= score;
  const lines = [
    `🎉 <b>Tabriklaymiz, ${H(user.first_name)}!</b>`, "",
    `📘 ${H(title)}`,
    `✅ Natija: <b>${fmt(score)}</b> / 100 ball`,
    `🏅 Daraja: <b>${lvl || "hali C dan past"}</b>${lvl ? " (taxminiy)" : ""}`,
    a.duration_sec ? `⏱ Vaqt: ${Math.max(1, Math.round(a.duration_sec/60))} daqiqa` : null,
    nx ? `🎯 ${nx.level} darajagacha: ${fmt(nx.need)} ball` : null,
    best ? `🔥 Bu sizning eng yaxshi natijangiz!` : null,
    "", `<i>${H(motivation(score))}</i>`
  ].filter(l => l !== null);
  const share = `https://t.me/share/url?url=${encodeURIComponent(SITE)}&text=${encodeURIComponent(`Men Milliy sertifikat (tarix) sinov testidan ${fmt(score)} ball oldim${lvl ? ` (${lvl})` : ""}! Sen ham sinab ko'r 👇`)}`;
  const fd = new FormData();
  fd.append("chat_id", String(chat));
  fd.append("caption", lines.join("\n"));
  fd.append("parse_mode", "HTML");
  fd.append("reply_markup", JSON.stringify({inline_keyboard:[
    [{text:"🔁 Yana test yechish", url:SITE + "/"}, {text:"📤 Ulashish", url:share}],
    [{text:"📄 Sifatli fayl (chop etish uchun)", callback_data:"f:" + a.id}],
    [{text:"✏️ Ism xato bo'lsa — tuzatish", callback_data:"t:" + a.id}]
  ]}));
  fd.append("photo", new Blob([png], {type:"image/png"}), `sertifikat-${String(a.id).slice(0,8)}.png`);
  return tg("sendPhoto", fd);
}

async function sendFile(chat, user, attemptId){
  const a = await rpc("oz_bot_claim", {p_chat:chat, p_attempt:attemptId});
  if(a.holat !== "ok") return;
  await tg("sendChatAction", {chat_id:chat, action:"upload_document"});
  const png = sertifikatPng({ism:fullName(user), title:testTitle(a.test_id), score:Number(a.score), date:dateUz(a.created_at), code:String(a.id).slice(0,8).toUpperCase()});
  const fd = new FormData();
  fd.append("chat_id", String(chat));
  fd.append("caption", "Chop etish uchun yuqori sifatli nusxa 🖨");
  fd.append("document", new Blob([png], {type:"image/png"}), `Sertifikat ${fullName(user)}.png`);
  return tg("sendDocument", fd);
}

async function showResults(chat){
  const r = await rpc("oz_bot_results", {p_chat:chat});
  if(!r.soni) return send(chat, "Hali natija yo'q. Saytda test yechib, oxirida <b>\"Sertifikatni Telegramda olish\"</b> tugmasini bosing — natija shu yerga keladi.", {reply_markup:{inline_keyboard:[[{text:"📝 Test yechish", url:SITE + "/"}]]}});
  const rows = r.oxirgi.map((x, i) => `${i+1}. ${H(testTitle(x.test_id))} — <b>${fmt(Number(x.score))}</b> ball${x.level ? ` (${x.level})` : ""} · ${dateUz(x.created_at)}`);
  return send(chat, [`🏆 <b>Natijalaringiz</b>`, `Jami: ${r.soni} ta test · eng yaxshisi: <b>${fmt(Number(r.eng))}</b> ball`, "", ...rows, "", "Sertifikatni qayta olish uchun pastdagi tugmani bosing:"].join("\n"),
    {reply_markup:{inline_keyboard: r.oxirgi.slice(0, 5).map(x => [{text:`📜 ${testTitle(x.test_id).slice(0, 40)} · ${fmt(Number(x.score))}`, callback_data:"s:" + x.id}])}});
}

const HELP = `<b>O'zing O'rgan</b> boti tarix testlaringiz uchun sertifikat beradi.

1️⃣ <a href="${SITE}">ozing-organ.uz</a> saytida Milliy sertifikat variantini yeching.
2️⃣ Natija sahifasida <b>"Sertifikatni Telegramda olish"</b> tugmasini bosing.
3️⃣ Bot ism-familiyangiz yozilgan sertifikatni yuboradi.

🏆 Natijalarim — barcha natijalaringiz va eng yaxshi ball.
✏️ Ismni o'zgartirish — sertifikatdagi ismni tuzatish.`;

async function onMessage(m){
  const chat = m.chat.id, text = String(m.text || "").trim();
  if(m.chat.type !== "private") return;
  let u = await getUser(chat);
  if(m.from && m.from.username && (!u || u.tg_username !== m.from.username)) u = await saveUser(chat, {tg_username:m.from.username});

  const start = text.match(/^\/start(?:\s+(\S+))?$/);
  if(start){
    const arg = start[1] || "";
    const cm = arg.match(/^c_([0-9a-f-]{36})$/i);
    if(cm){
      if(u && u.first_name && u.last_name){ await saveUser(chat, {step:null, pending:null}); return sendCertificate(chat, u, cm[1]); }
      await send(chat, "🎓 Assalomu alaykum! Natijangiz tayyor.\nSertifikatni olish uchun bir marta ro'yxatdan o'ting — ism va familiyangiz kerak.");
      return askFirst(chat, cm[1]);
    }
    if(u && u.first_name && u.last_name) return send(chat, `Assalomu alaykum, <b>${H(u.first_name)}</b>! 👋\n\n` + HELP, {reply_markup:MENU});
    await send(chat, "Assalomu alaykum! 👋\n\n" + HELP + "\n\nAvval ro'yxatdan o'tamiz — bu bir daqiqa.");
    return askFirst(chat, null);
  }

  if(u && u.step === "ism"){
    const parts = text.replace(/\s+/g, " ").split(" ");
    // "Ali Valiyev" in one message fills both fields.
    if(parts.length === 2 && cleanName(parts[0]) && cleanName(parts[1])) return finishSignup(chat, u, cleanName(parts[0]), cleanName(parts[1]));
    const n = cleanName(text);
    if(!n || n.includes(" ") && n.length > 20) return send(chat, "Ismni harflar bilan yozing (2–30 ta harf). Masalan: <i>Aziza</i>");
    await saveUser(chat, {step:"familiya", tmp:n});
    return send(chat, `Rahmat, ${H(n)}! Endi <b>familiyangizni</b> yozing.\n\nMasalan: <i>Karimova</i>`);
  }
  if(u && u.step === "familiya"){
    const n = cleanName(text);
    if(!n) return send(chat, "Familiyani harflar bilan yozing (2–30 ta harf). Masalan: <i>Karimova</i>");
    return finishSignup(chat, u, u.tmp, n);
  }

  if(!u || !u.first_name || !u.last_name) return askFirst(chat, null);
  if(/test yechish/i.test(text)) return send(chat, "Testni saytda yeching, oxirida natijangizni shu yerga yuboramiz 👇", {reply_markup:{inline_keyboard:[[{text:"📝 Milliy sertifikat testlari", url:SITE + "/"}],[{text:"🎮 Mashqlar va o'yinlar", url:SITE + "/mashqlar.html"}]]}});
  if(/natija/i.test(text)) return showResults(chat);
  if(/ism/i.test(text) && /o'zgart|ozgart|tuzat/i.test(text)) return askFirst(chat, null);
  if(text === "/stat" && ADMINS.includes(String(chat))){
    const s = await rpc("oz_bot_stats", {});
    return send(chat, `📊 Ro'yxatdan o'tganlar: ${s.foydalanuvchi}\n📜 Sertifikatlar: ${s.sertifikat}\n🕐 Oxirgi 24 soat: ${s.bugun}`);
  }
  return send(chat, HELP, {reply_markup:MENU});
}

async function finishSignup(chat, u, first, last){
  const nu = await saveUser(chat, {first_name:first, last_name:last, step:null, tmp:null, pending:null});
  await send(chat, `✅ Tayyor, <b>${H(first)} ${H(last)}</b>! Sertifikatlaringizga shu ism yoziladi.`, {reply_markup:MENU});
  if(u.pending) return sendCertificate(chat, nu, u.pending);
}

async function onCallback(q){
  const chat = q.message && q.message.chat.id, data = String(q.data || "");
  await tg("answerCallbackQuery", {callback_query_id:q.id});
  if(!chat) return;
  const u = await getUser(chat);
  const m = data.match(/^([sft]):([0-9a-f-]{36})$/i);
  if(!m) return;
  if(m[1] === "t") return askFirst(chat, m[2]);
  if(!u || !u.first_name) return askFirst(chat, m[2]);
  if(m[1] === "s") return sendCertificate(chat, u, m[2]);
  if(m[1] === "f") return sendFile(chat, u, m[2]);
}

let ME = null;
async function me(){ if(!ME && TOKEN){ const j = await tg("getMe", {}); if(j.ok) ME = j.result; } return ME; }

async function setup(req){
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const url = new URL(`https://${host}/api/bot`);
  // Preview deployments sit behind Vercel login; the automation bypass secret lets Telegram through.
  if(process.env.VERCEL_ENV !== "production" && process.env.VERCEL_AUTOMATION_BYPASS_SECRET) url.searchParams.set("x-vercel-protection-bypass", process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
  const init = await rpc("oz_bot_init", {});
  const wh = await tg("setWebhook", {url:url.toString(), secret_token:WHK, allowed_updates:["message","callback_query"], drop_pending_updates:true});
  await tg("setMyCommands", {commands:[{command:"start", description:"Boshlash"}]});
  await tg("setMyDescription", {description:"O'zing O'rgan — tarix testlari uchun sertifikat boti. ozing-organ.uz saytida Milliy sertifikat testini yeching va ism-familiyangiz yozilgan chiroyli sertifikatni shu yerda oling! 🎓"});
  await tg("setMyShortDescription", {short_description:"Tarix testlari natijasi uchun sertifikat • ozing-organ.uz"});
  return {baza:init === true, webhook:!!wh.ok, host, muhit:process.env.VERCEL_ENV || "?"};
}

export default async function handler(req, res){
  try{
    if(req.method === "GET"){
      const q = req.query || {};
      if(q.namuna === "1"){   // sample certificate to check the design
        const png = sertifikatPng({ism:"Aziza Karimova", title:"12-variant (TMS-26)", score:Number(q.ball || 67.5), date:dateUz(new Date().toISOString()), code:"NAMUNA00"});
        res.setHeader("Content-Type", "image/png"); return res.status(200).send(png);
      }
      if(!TOKEN) return res.status(200).json({tayyor:false});
      if(q.ornat === "1") return res.status(200).json(await setup(req));
      const b = await me();
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.status(200).json({tayyor:!!b, username:b ? b.username : null});
    }
    if(req.method !== "POST") return res.status(405).end();
    if(!TOKEN || req.headers["x-telegram-bot-api-secret-token"] !== WHK) return res.status(401).end();
    const up = req.body || {};
    if(up.message) await onMessage(up.message);
    else if(up.callback_query) await onCallback(up.callback_query);
    return res.status(200).json({ok:true});
  }catch(e){
    console.error(e);
    return res.status(200).json({ok:false});   // a non-200 makes Telegram resend the same update over and over
  }
}
