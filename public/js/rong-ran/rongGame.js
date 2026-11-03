// Game TikTok LIVE "Rồng rắn lên mây": người xem vào LIVE thì nắm vai nhau nối thành đuôi rồng ở sân đình.
// Mỗi ván: rồng dạo quanh sân hát "Rồng rắn lên mây...", tới hỏi thầy thuốc, xin khúc đầu, khúc giữa, khúc đuôi,
// rồi thầy thuốc đuổi bắt khúc đuôi. Thả tim để rồng chạy nhanh hơn, tặng quà để có bùa hộ mệnh,
// làm thầy thuốc trượt ngã, hoặc làm đầu rồng và cả đàn bay lên mây.
import { W, H, YARD, DOCTOR_HOME, matSpot, scaleAtY, drawStatic, drawFlags, cloud, drawDragonBody, drawDragonHead, roundRectPath as rr } from './sanDinh.js';
import { lookFor, DOCTOR_LOOK, drawPerson } from './people.js';
import * as sfx from './rongAudio.js';
import * as voice from '../audio.js';

const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const FONT = '"Segoe UI", system-ui, sans-serif';

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'RỒNG RẮN LÊN MÂY',
  subtitle: 'Vào LIVE là nối đuôi rồng • Thả tim để rồng chạy • Tặng quà để bay lên mây',
  backgroundImage: '',
  maxDragon: 30,
  ambientCrowd: 5,
  idleMinutes: 10,
  roundSeconds: 40,
  chaseSeconds: 20,
  caughtSeconds: 40,
  releaseLikes: 20,
  dragonSpeed: 190,
  doctorSpeed: 215,
  likeBoost: 1.2,
  hypeMax: 1500,
  flySeconds: 11,
  giftTiers: { medium: 10, big: 100 },
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.3,
  ambienceVolume: 0.08,
  voice: true,
  voiceLevel: 'vua',
  voiceGapSeconds: 10,
  voiceJoin: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-HoaiMyNeural',
  captions: true,
  narration: true,
  narrationSeconds: 45,
  commands: {
    sing: ['rồng rắn', 'lên mây', 'rong ran len may'],
    wiggle: ['lúc lắc', 'lắc lư', 'lắc đi'],
    run: ['chạy mau', 'chạy đi', 'chạy nhanh', 'chạy thôi'],
    protect: ['bảo vệ', 'che chở', 'che đuôi'],
    fire: ['xin lửa', 'xin ít lửa'],
    askHead: ['khúc đầu', 'xin khúc đầu'],
    askMid: ['khúc giữa', 'xin khúc giữa'],
    askTail: ['khúc đuôi', 'xin khúc đuôi', 'tha hồ mà đuổi'],
    ransom: ['chuộc', 'về đội', 'cứu tôi', 'cứu em'],
  },
  messages: {
    join: ['Mời {name} nối vào đuôi rồng', '{name} nắm vai bạn phía trước nào', 'Rồng dài thêm một khúc, chào {name}', 'Chào {name}, vào chơi rồng rắn lên mây'],
    chant: ['Rồng rắn lên mây, có cây lúc lắc, có nhà điểm binh. Hỏi thăm thầy thuốc có nhà hay không?'],
    doctorOut: ['Thầy thuốc đi chơi rồi', 'Thầy thuốc đi chợ, mai lại sang', 'Thầy thuốc đang ngủ trưa'],
    chaseStart: ['Tha hồ mà đuổi! Thả tim để rồng chạy nhanh', 'Thầy thuốc đuổi rồi. Cả nhà thả tim cho rồng chạy đi'],
    caught: ['Thầy thuốc bắt được {name} rồi', 'Ối, {name} bị bắt mất rồi', '{name} chạy chậm quá, bị bắt rồi'],
    escape: ['Rồng chạy thoát rồi, giỏi quá cả nhà ơi', 'Thầy thuốc mệt quá, rồng thoát rồi'],
    someCaught: ['Ván này thầy thuốc bắt được {n} người', 'Thầy thuốc bắt được {n} khúc đuôi'],
    release: ['{name} được thả về, nối lại vào đuôi rồng', 'Thầy thuốc cho {name} về rồi'],
    follow: ['Cảm ơn {name} đã theo dõi, tặng khăn đỏ', '{name} theo dõi kênh, đeo khăn đỏ vào nào'],
    share: ['Cảm ơn {name} đã chia sẻ, lên gần đầu rồng nào', '{name} chia sẻ rồi, được đứng gần đầu rồng'],
    gift: ['Cảm ơn {name} tặng {gift}, có bùa hộ mệnh không sợ bị bắt', '{name} tặng {gift}, được lên ngay sau đầu rồng'],
    mediumGift: ['{name} tặng {gift}. Thầy thuốc trượt vỏ chuối rồi', 'Cảm ơn {name}, thầy thuốc ngã sấp mặt, cứu hết mọi người'],
    bigGift: ['Đại gia {name} tặng {gift}. Mời {name} làm đầu rồng, cả đàn bay lên mây', 'Ôi {name} tặng {gift}. Rồng vàng bay lên mây'],
    fly: ['Cả nhà ơi, rồng bay lên mây rồi', 'Rồng rắn lên mây thật rồi'],
    reminder: [
      'Thả tim để rồng chạy nhanh, không bị thầy thuốc bắt',
      'Bình luận rồng rắn để cả đàn cùng hát',
      'Bình luận lúc lắc để rồng uốn éo',
      'Bình luận khúc đuôi để thầy thuốc bắt đầu đuổi',
      'Ai bị bắt thì bình luận chuộc để về đội',
      'Tặng quà để có bùa hộ mệnh, không sợ bị bắt',
      'Chia sẻ để được đứng gần đầu rồng',
      'Thả tim thật nhiều cho rồng bay lên mây',
    ],
  },
  doctorLines: {
    askHead: 'Những xương cùng xẩu!',
    askMid: 'Những máu cùng me!',
    askTail: 'Tha hồ mà đuổi!',
    fire: ['Lửa nhà tôi để nấu cơm!', 'Lửa đang sắc thuốc, không cho!', 'Sang nhà bên mà xin!'],
  },
  idleChat: ['Rồng rắn lên mây ~', 'Có cây lúc lắc ~', 'Có nhà điểm binh ~', 'Chạy nhanh lên!', 'Đừng buông vai nhé', 'Vui quá!', 'Thầy thuốc đâu rồi?', 'Hihi'],
};
let config = structuredClone(DEFAULTS);

const lastLine = {};
function line(kind, vars = {}) {
  const list = (config.messages && config.messages[kind]) || DEFAULTS.messages[kind] || [];
  if (!list.length) return '';
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastLine[kind]) i = (i + 1) % list.length;
  lastLine[kind] = i;
  return list[i].replace(/\{name\}/g, vars.name || '').replace(/\{gift\}/g, vars.gift || 'quà').replace(/\{n\}/g, vars.n ?? '');
}

// bỏ dấu tiếng Việt để nhận lệnh dù gõ không dấu
function norm(s) {
  return ` ${String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}
let commandList = [];
function buildCommands() {
  commandList = [];
  const cmds = { ...DEFAULTS.commands, ...(config.commands || {}) };
  for (const [act, words] of Object.entries(cmds)) {
    for (const w of words || []) {
      const n = norm(w);
      if (n.trim()) commandList.push({ act, key: n, len: n.length });
    }
  }
  commandList.sort((a, b) => b.len - a.len);
}
function detectCommand(text) {
  const n = norm(text);
  for (const c of commandList) if (n.includes(c.key)) return c.act;
  const flat = n.replace(/\s+/g, '');
  for (const c of commandList) if (c.len > 6 && flat.includes(c.key.replace(/\s+/g, ''))) return c.act;
  return '';
}

// ------------------------------------------------------------------ canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;
function fit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = `${W * s}px`;
  canvas.style.height = `${H * s}px`;
}
window.addEventListener('resize', fit);
fit();

const bg = document.createElement('canvas');
bg.width = W;
bg.height = H;
let bgImage = null;

function truncate(s, n) {
  const a = Array.from(String(s || ''));
  return a.length > n ? `${a.slice(0, n - 1).join('')}…` : a.join('');
}
function wrapText(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (Array.from(next).length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = truncate(`${kept[maxLines - 1]} …`, maxChars);
    return kept;
  }
  return lines.map((l) => truncate(l, maxChars + 2));
}

const avatarCache = new Map();
function getAvatar(url) {
  if (!url) return null;
  let img = avatarCache.get(url);
  if (!img) {
    img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.src = url;
    avatarCache.set(url, img);
    if (avatarCache.size > 400) avatarCache.delete(avatarCache.keys().next().value);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}
function drawAvatar(x, y, r, user, color) {
  const img = getAvatar(user.avatar);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  if (img) {
    ctx.clip();
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(r * 1.1)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Array.from(user.name || '?')[0].toUpperCase(), x, y + 1);
  }
  ctx.restore();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1.5, r * 0.14);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}

// ------------------------------------------------------------------ trạng thái
const people = new Map(); // id -> người (thật hoặc không tên)
let dragon = []; // thứ tự từ đầu tới đuôi
const caught = []; // đang ngồi chiếu nhà thầy thuốc
const leaving = []; // đang đi ra khỏi sân
const particles = [];
const toasts = [];
let fillerSeq = 0;
let now = performance.now();
let hype = 0;
let flash = 0;
let round = 0;
let caughtTotal = 0;
let escapes = 0;

// đường đi của đầu rồng: trail[0] là đầu, càng về sau càng cũ
const head = { x: 540, y: 1200, dir: Math.PI, speed: 0, target: null };
let trail = [];
function resetTrail() {
  trail = [];
  // xoắn ốc quanh sân để người mới có chỗ đứng
  for (let i = 0; i < 900; i++) {
    const a = Math.PI - i * 0.012;
    const k = 1 - i / 1400;
    trail.push({ x: 540 + Math.cos(a) * 330 * k, y: 1210 + Math.sin(a) * 260 * k });
  }
  head.x = trail[0].x;
  head.y = trail[0].y;
}
resetTrail();

const doctor = { x: DOCTOR_HOME.x, y: DOCTOR_HOME.y, state: 'home', walk: 0, bubble: null, stunUntil: 0, slowUntil: 0, tripUntil: 0, mouthUntil: 0, act: 'idle' };
// pha của ván chơi: walk (dạo + hát) → ask (hỏi thầy thuốc) → chase (đuổi) → result → walk
const phase = { name: 'walk', t0: performance.now(), until: performance.now() + 20000, step: 0, nextStep: 0, caught: 0, out: false };
let fly = null; // { t0, until }
let speedUntil = 0;
let wiggleUntil = 0;
const likeLog = [];

function realCount() {
  let n = 0;
  for (const p of dragon) if (p.real) n++;
  return n;
}

function newPerson(id, user = null) {
  const real = Boolean(user);
  return {
    id, user, real, look: lookFor(real ? id : `filler-${id}`),
    x: 0, y: 0, walk: 0, seed: Math.random() * 1000,
    state: 'line', act: 'shoulder', actUntil: 0, bubble: null,
    hat: null, shield: false, coins: 0, likes: 0, comments: 0, lastActive: now, joinedAt: now,
    happyUntil: 0, scaredUntil: 0, releaseAt: 0, likesCaught: 0, spot: 0,
  };
}

function spawnIntoDragon(p, index = dragon.length) {
  // chạy vào từ mép dưới sân
  p.x = rand(200, 880);
  p.y = 1760;
  p.state = 'line';
  p.act = 'shoulder';
  dragon.splice(clamp(index, 0, dragon.length), 0, p);
}

function ensurePerson(user, { announceJoin = false } = {}) {
  let p = people.get(user.id);
  if (p) {
    p.user = { ...p.user, ...user, name: user.name || p.user.name };
    p.lastActive = now;
    if (p.state === 'gone') {
      p.state = 'line';
      makeRoom();
      spawnIntoDragon(p);
    }
    return p;
  }
  p = newPerson(user.id, user);
  people.set(user.id, p);
  makeRoom();
  spawnIntoDragon(p);
  if (announceJoin) {
    addToast(`👋 ${truncate(user.name, 18)} nối đuôi rồng`, '#ffe9a8');
    if (config.voiceJoin !== false) announce(line('join', { name: user.name }), 0);
  }
  return p;
}

// rồng đủ dài: bỏ bớt người không tên, rồi tới người lâu không tương tác
function makeRoom() {
  const max = clamp(Number(config.maxDragon) || 30, 6, 60);
  while (dragon.length >= max) {
    const filler = [...dragon].reverse().find((p) => !p.real);
    const victim = filler || [...dragon].slice(1).filter((p) => p.coins === 0).sort((a, b) => a.lastActive - b.lastActive)[0]
      || [...dragon].slice(1).sort((a, b) => a.lastActive - b.lastActive)[0];
    if (!victim) break;
    removeFromDragon(victim);
    sendAway(victim);
  }
}

function removeFromDragon(p) {
  const i = dragon.indexOf(p);
  if (i >= 0) dragon.splice(i, 1);
}

function sendAway(p) {
  p.state = 'leave';
  p.leaveTo = { x: p.x < W / 2 ? -80 : W + 80, y: clamp(p.y + 200, 900, 1700) };
  leaving.push(p);
}

function refillCrowd() {
  const want = Math.max(0, (Number(config.ambientCrowd) || 0) - realCount());
  const fillers = dragon.filter((p) => !p.real);
  if (fillers.length < want && dragon.length < 4 + want) {
    const p = newPerson(`f${fillerSeq++}`);
    people.set(p.id, p);
    spawnIntoDragon(p);
  } else if (fillers.length > want && phase.name !== 'chase') {
    // bỏ người không tên ở đầu rồng trước để người xem thật được dẫn đầu
    const f = !dragon[0].real ? dragon[0] : fillers[fillers.length - 1];
    removeFromDragon(f);
    sendAway(f);
    people.delete(f.id);
  }
}

function nameOf(p) {
  return p.user ? p.user.name : 'bạn nhỏ';
}
function say(p, text, ms = 3200) {
  p.bubble = { text, born: now, until: now + ms };
}
function doctorSay(text, ms = 2800) {
  doctor.bubble = { text, born: now, until: now + ms };
  doctor.mouthUntil = now + Math.min(3000, 600 + text.length * 50);
}
function setAct(p, act, ms) {
  p.act = act;
  p.actUntil = now + ms;
}
function headPos(p) {
  const s = scaleAtY(p.y);
  return { x: p.x, y: p.y - 150 * s, s };
}

// ------------------------------------------------------------------ hiệu ứng
function addParticle(o) {
  particles.push({ born: now, life: 1200, vx: 0, vy: 0, g: 0, ...o });
  if (particles.length > 700) particles.splice(0, particles.length - 700);
}
function hearts(x, y, n) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'heart', x: x + rand(-14, 14), y, vx: rand(-30, 30), vy: rand(-160, -90), life: 1300, size: rand(10, 16), color: pick(['#ff3d7f', '#ff6fa4', '#ff2e63']) });
}
function sparks(x, y, n, colors = ['#ffe066', '#fff3b0', '#ffb300']) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(80, 260);
    addParticle({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 200, life: rand(600, 1100), size: rand(3, 6), color: pick(colors) });
  }
}
function dust(x, y) {
  addParticle({ kind: 'dust', x: x + rand(-8, 8), y: y - 4, vx: rand(-30, 30), vy: rand(-30, -10), life: rand(400, 700), size: rand(6, 11) });
}
function confetti(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(120, 420);
    addParticle({ kind: 'confetti', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, g: 420, life: rand(1400, 2200), size: rand(5, 9), color: pick(['#e53935', '#fdd835', '#43a047', '#1e88e5', '#ff7043', '#fff']), rot: rand(0, TAU), vr: rand(-8, 8) });
  }
}
function puffs(x, y, n) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'cloud', x: x + rand(-40, 40), y: y + rand(-20, 20), vx: rand(-40, 40), vy: rand(-20, 10), life: rand(1200, 2000), size: rand(0.25, 0.45) });
}
function stars(x, y) {
  for (let i = 0; i < 5; i++) addParticle({ kind: 'star', x, y, life: 1500, size: 9, rot: (i / 5) * TAU });
}
function addToast(text, color = '#fff') {
  toasts.push({ text, color, born: now });
  if (toasts.length > 4) toasts.shift();
}

// ------------------------------------------------------------------ lời dẫn
const captions = [];
let lastAnnounce = performance.now();
let lastSpoken = -1e9;
// priority: -1 chỉ hiện chữ, 0 chào hỏi, 1 diễn biến ván / quà, 2 quà lớn
function announce(text, priority = 0, force = false, who = 'narrator') {
  if (!text) return;
  lastAnnounce = performance.now();
  const level = { it: 2, vua: 1, nhieu: 0 }[config.voiceLevel] ?? 1;
  const gap = Math.max(0, Number(config.voiceGapSeconds ?? 10)) * 1000;
  if (priority >= 0 && (force || (priority >= level && performance.now() - lastSpoken >= gap))) {
    lastSpoken = performance.now();
    voice.speak(text, Math.max(0, priority));
  }
  if (config.captions === false) return;
  if (priority <= 0 && captions.length >= 2) return;
  captions.push({ text, priority, who });
  captions.sort((a, b) => b.priority - a.priority);
  if (captions.length > 4) captions.length = 4;
}

function addHype(v) {
  if (fly) return;
  hype += v;
  const max = Math.max(50, Number(config.hypeMax) || 1500);
  if (hype >= max) {
    hype = 0;
    startFly(null);
  }
}

// ------------------------------------------------------------------ pha của ván
function setPhase(name, ms) {
  phase.name = name;
  phase.t0 = now;
  phase.until = now + ms;
  phase.step = 0;
  phase.nextStep = now;
  phase.arrived = false;
}

function startWalk() {
  setPhase('walk', Math.max(15, Number(config.roundSeconds) || 40) * 1000);
  head.target = null;
  doctor.state = doctor.state === 'home' ? 'home' : 'return';
  // cả đàn hát khi bắt đầu dạo
  setTimeout(() => {
    if (phase.name !== 'walk' || !dragon.length) return;
    say(dragon[0], 'Rồng rắn lên mây ~ Có cây lúc lắc ~', 4200);
    for (const p of dragon) if (Math.random() < 0.5) setAct(p, 'sing', 2600);
    sfx.drum(3);
  }, 800);
}

const ASK_POINT = { x: 360, y: 900 };
function startAsk() {
  if (dragon.length < 3) {
    startWalk();
    return;
  }
  round++;
  setPhase('ask', 60000);
  head.target = { ...ASK_POINT };
  phase.out = Math.random() < 0.22;
}

// lời thoại lúc hỏi thầy thuốc: [ai nói, câu, thời gian chờ ms]
function askScript() {
  if (phase.out) {
    return [
      ['dragon', 'Rồng rắn lên mây, có cây lúc lắc, có nhà điểm binh. Hỏi thăm thầy thuốc có nhà hay không?', 4200],
      ['doctor', line('doctorOut') || 'Thầy thuốc đi chơi!', 2600],
      ['dragon', 'Thế thì đi tiếp thôi!', 2000],
    ];
  }
  return [
    ['dragon', 'Rồng rắn lên mây, có cây lúc lắc, có nhà điểm binh. Hỏi thăm thầy thuốc có nhà hay không?', 4200],
    ['doctor', 'Có nhà!', 1600],
    ['dragon', 'Xin khúc đầu!', 1500],
    ['doctor', docLine('askHead'), 1800],
    ['dragon', 'Xin khúc giữa!', 1500],
    ['doctor', docLine('askMid'), 1800],
    ['dragon', 'Xin khúc đuôi!', 1500],
    ['doctor', docLine('askTail'), 1400],
  ];
}
function docLine(k) {
  const v = (config.doctorLines && config.doctorLines[k]) || DEFAULTS.doctorLines[k];
  return Array.isArray(v) ? pick(v) : v;
}

function runAsk() {
  if (!phase.arrived) {
    if (dist(head, ASK_POINT) > 30 && now - phase.t0 < 9000) return;
    phase.arrived = true;
  }
  if (now < phase.nextStep) return;
  const script = phase.script || (phase.script = askScript());
  if (phase.step >= script.length) {
    phase.script = null;
    if (phase.out) {
      startWalk();
      phase.until = now + 15000;
    } else startChase();
    return;
  }
  const [who, text, ms] = script[phase.step];
  if (who === 'doctor') doctorSay(text, ms + 600);
  else if (dragon[0]) {
    say(dragon[0], text, ms + 600);
    setAct(dragon[0], 'sing', ms);
  }
  if (phase.step === 0 && /^Rồng rắn/.test(text)) {
    announce(line('chant'), 1, true, 'dragon');
    sfx.drum(2);
  } else sfx.clap();
  phase.step++;
  phase.nextStep = now + ms;
}

function startChase() {
  setPhase('chase', Math.max(8, Number(config.chaseSeconds) || 20) * 1000);
  phase.caught = 0;
  doctor.state = 'chase';
  doctor.act = 'grab';
  sfx.gong();
  sfx.panic();
  announce(line('chaseStart'), 1, true);
  addToast('🏃 Thầy thuốc đuổi! Thả tim để chạy!', '#ff8a80');
  for (const p of dragon.slice(-4)) p.scaredUntil = now + 4000;
}

function endChase() {
  doctor.state = 'return';
  doctor.act = 'idle';
  setPhase('result', 3800);
  if (phase.caught === 0) {
    escapes++;
    announce(line('escape'), 1, true);
    sfx.cheer();
    for (const p of dragon) {
      p.happyUntil = now + 3500;
      setAct(p, 'sing', 2500);
    }
    if (dragon[0]) confetti(dragon[0].x, dragon[0].y - 120, 60);
    doctorSay('Mệt quá, không đuổi nữa!', 2600);
  } else {
    announce(line('someCaught', { n: phase.caught }), 1, true);
    doctorSay(`Bắt được ${phase.caught} đứa! Hehe`, 2600);
  }
}

function catchTail() {
  const tail = dragon[dragon.length - 1];
  if (!tail || dragon.length < 2) return;
  if (tail.shield) {
    tail.shield = false;
    doctor.stunUntil = now + 1600;
    stars(doctor.x, doctor.y - 120 * scaleAtY(doctor.y));
    sparks(tail.x, tail.y - 80, 30, ['#fff59d', '#ffd54a', '#ffffff']);
    say(tail, 'Có bùa hộ mệnh! 🧧', 2200);
    doctorSay('Ối, bùa gì mà mạnh thế!', 2000);
    sfx.bonk();
    return;
  }
  removeFromDragon(tail);
  phase.caught++;
  caughtTotal++;
  doctor.stunUntil = now + 1300;
  sfx.bonk();
  sparks(tail.x, tail.y - 80, 20, ['#ffffff', '#ffccbc']);
  doctorSay(pick(['Bắt được rồi!', 'Hehe, đứng lại!', 'Về sắc thuốc với ta!']), 1800);
  if (tail.real) {
    addToast(`😵 ${truncate(nameOf(tail), 16)} bị bắt`, '#ffab91');
    announce(line('caught', { name: nameOf(tail) }), 0);
  }
  tail.state = 'caught';
  tail.act = 'walk';
  tail.releaseAt = now + Math.max(10, Number(config.caughtSeconds) || 40) * 1000;
  tail.likesCaught = 0;
  tail.scaredUntil = now + 2000;
  say(tail, pick(['Huhu bị bắt rồi 😭', 'Cứu tôi với!', 'Thả tim cứu tôi!']), 2600);
  const used = new Set(caught.map((c) => c.spot));
  let spot = 0;
  while (used.has(spot)) spot++;
  tail.spot = spot;
  caught.push(tail);
  if (!tail.real) tail.releaseAt = now + 9000;
  for (const p of dragon.slice(-3)) p.scaredUntil = now + 2500;
}

function release(p, why = '') {
  const i = caught.indexOf(p);
  if (i < 0) return;
  caught.splice(i, 1);
  if (!p.real) {
    sendAway(p);
    people.delete(p.id);
    return;
  }
  p.state = 'line';
  p.act = 'shoulder';
  p.happyUntil = now + 3000;
  makeRoom();
  dragon.push(p);
  sparks(p.x, p.y - 80, 16, ['#a5d6a7', '#ffffff']);
  say(p, why || 'Về đội rồi! 🥳', 2200);
  announce(line('release', { name: nameOf(p) }), 0);
}

// ------------------------------------------------------------------ bay lên mây
function startFly(leader) {
  if (fly) {
    fly.until = Math.max(fly.until, now + 4000);
    return;
  }
  if (phase.name === 'chase') {
    doctor.state = 'return';
    doctor.act = 'idle';
  }
  if (phase.name === 'ask') phase.script = null;
  fly = { t0: now, until: now + Math.max(6, Number(config.flySeconds) || 11) * 1000, ang: Math.atan2(head.y - 450, head.x - 540), leader };
  setPhase('fly', 999999);
  announce(line('fly'), 1, true);
  sfx.rise();
  sfx.gong();
  flash = 0.6;
  for (const p of dragon) {
    p.happyUntil = now + 8000;
    setAct(p, 'sing', 9000);
  }
}

function endFly() {
  fly = null;
  head.target = { x: 540, y: 1150 };
  sfx.drum(3);
  for (let i = 0; i < 5; i++) puffs(rand(200, 880), rand(900, 1300), 3);
  startWalk();
}

// ------------------------------------------------------------------ lệnh bình luận
function runCommand(p, act) {
  const inLine = p.state === 'line';
  switch (act) {
    case 'sing':
      if (inLine) setAct(p, 'sing', 2800);
      say(p, pick(['Rồng rắn lên mây ~', 'Có cây lúc lắc ~', 'Có nhà điểm binh ~']), 2800);
      sfx.clap();
      addHype(3);
      break;
    case 'wiggle':
      wiggleUntil = Math.max(wiggleUntil, now) + 2500;
      if (wiggleUntil > now + 7000) wiggleUntil = now + 7000;
      say(p, 'Lúc lắc lúc lắc ~ 🐍', 2400);
      sfx.drum(2);
      addHype(3);
      break;
    case 'run':
      speedUntil = Math.max(speedUntil, now + 3000);
      say(p, 'Chạy mauuu! 🏃', 2000);
      addHype(3);
      break;
    case 'protect': {
      const lead = dragon[0];
      if (lead) {
        setAct(lead, 'protect', 3000);
        say(lead, 'Đầu rồng che cho cả đàn! 🛡️', 2400);
      }
      if (p !== lead) say(p, 'Bảo vệ đuôi rồng!', 2000);
      if (phase.name === 'chase') doctor.slowUntil = now + 2000;
      addHype(3);
      break;
    }
    case 'fire':
      say(p, 'Cho tôi xin ít lửa!', 2200);
      setTimeout(() => {
        doctorSay(pick((config.doctorLines && config.doctorLines.fire) || DEFAULTS.doctorLines.fire), 2400);
        sparks(300, 670, 14, ['#ff7043', '#ffca28', '#fff176']);
      }, 900);
      addHype(2);
      break;
    case 'askHead':
    case 'askMid':
      say(p, act === 'askHead' ? 'Xin khúc đầu!' : 'Xin khúc giữa!', 2000);
      setTimeout(() => doctorSay(docLine(act), 2200), 900);
      addHype(2);
      break;
    case 'askTail':
      say(p, 'Xin khúc đuôi!', 2000);
      if (phase.name === 'walk' && now - phase.t0 > 8000 && dragon.length >= 3) {
        startAsk();
        phase.script = [
          ['dragon', 'Xin khúc đuôi!', 1400],
          ['doctor', docLine('askTail'), 1400],
        ];
        phase.out = false;
      } else setTimeout(() => doctorSay(docLine('askTail'), 2000), 900);
      addHype(3);
      break;
    case 'ransom':
      if (p.state === 'caught') {
        doctorSay('Uống bát thuốc đắng rồi về!', 2200);
        setTimeout(() => release(p, 'Chuộc được rồi! 🥳'), 800);
      } else say(p, 'Ai bị bắt thì chuộc về nào!', 2000);
      addHype(2);
      break;
    default:
      break;
  }
}

// ------------------------------------------------------------------ sự kiện TikTok
function handleEvent(ev) {
  now = performance.now();
  const user = ev.user;
  switch (ev.type) {
    case 'join':
      if (user) ensurePerson(user, { announceJoin: !people.has(user.id) || people.get(user.id).state === 'gone' });
      break;
    case 'chat': {
      if (!user) break;
      const fresh = !people.has(user.id);
      const p = ensurePerson(user);
      const text = String(ev.text || '').trim();
      p.comments++;
      addHype(2);
      const act = detectCommand(text);
      if (act) runCommand(p, act);
      else if (text) say(p, text, 5000);
      if (fresh) addToast(`👋 ${truncate(user.name, 18)} nối đuôi rồng`, '#ffe9a8');
      break;
    }
    case 'like': {
      if (!user) break;
      const p = ensurePerson(user);
      const n = clamp(Number(ev.count) || 1, 1, 100);
      p.likes += n;
      likeLog.push({ t: now, n });
      const h = headPos(p);
      hearts(h.x, h.y - 20, Math.min(6, n));
      sfx.pop();
      addHype(n);
      if (p.state === 'caught') {
        p.likesCaught += n;
        const need = Math.max(5, Number(config.releaseLikes) || 20);
        if (p.likesCaught >= need) release(p, 'Được thả nhờ thả tim! ❤️');
        else if (Math.random() < 0.3) say(p, `Thả tim cứu tôi! ${p.likesCaught}/${need}`, 1600);
      } else if (phase.name === 'chase') {
        // tim làm cả đàn chạy nhanh hơn
        if (Math.random() < 0.15) say(p, pick(['Chạy nhanh lên!', 'Nhanh nữa!', 'Sắp bắt được rồi!']), 1400);
      }
      break;
    }
    case 'follow': {
      if (!user) break;
      const p = ensurePerson(user);
      p.hat = 'band';
      p.happyUntil = now + 3000;
      const h = headPos(p);
      sparks(h.x, h.y - 20, 30);
      sfx.sparkle();
      addToast(`⭐ ${truncate(user.name, 18)} đeo khăn đỏ`, '#ffd54a');
      say(p, 'Có khăn đỏ rồi!', 2400);
      announce(line('follow', { name: user.name }), 1);
      addHype(10);
      break;
    }
    case 'share': {
      if (!user) break;
      const p = ensurePerson(user);
      const i = dragon.indexOf(p);
      if (i > 1) {
        dragon.splice(i, 1);
        dragon.splice(Math.max(1, i - 3), 0, p);
      }
      const h = headPos(p);
      confetti(h.x, h.y, 30);
      sfx.sparkle();
      addToast(`📣 ${truncate(user.name, 18)} lên gần đầu rồng`, '#7cf7ff');
      announce(line('share', { name: user.name }), 0);
      addHype(10);
      break;
    }
    case 'giftStreak': {
      if (!user) break;
      const p = ensurePerson(user);
      const h = headPos(p);
      sparks(h.x, h.y, 6);
      break;
    }
    case 'gift': {
      if (!user) break;
      const p = ensurePerson(user);
      const coinsN = Number(ev.coins) || (Number(ev.diamonds) || 1) * (Number(ev.repeatCount) || 1);
      const giftLabel = `${ev.giftName || 'quà'}${Number(ev.repeatCount) > 1 ? ` x${ev.repeatCount}` : ''}`;
      p.coins += coinsN;
      p.lastActive = now;
      p.happyUntil = now + 4000;
      addHype(coinsN * 3);
      const tiers = { ...DEFAULTS.giftTiers, ...(config.giftTiers || {}) };
      if (p.state === 'caught') release(p, 'Tặng quà là được về! 🎁');
      const h = headPos(p);
      if (coinsN >= tiers.big) {
        addToast(`💎 ${truncate(user.name, 16)} làm đầu rồng`, '#ffd54a');
        announce(line('bigGift', { name: user.name, gift: giftLabel }), 2, true);
        sfx.fanfare();
        makeLeader(p);
        confetti(W / 2, 700, 160);
        flash = 0.8;
        startFly(p);
      } else if (coinsN >= tiers.medium) {
        addToast(`🍌 ${truncate(user.name, 16)}: thầy thuốc trượt ngã`, '#ff9de2');
        announce(line('mediumGift', { name: user.name, gift: giftLabel }), 1, true);
        p.shield = true;
        moveBehindHead(p);
        doctor.tripUntil = now + 4500;
        doctor.stunUntil = now + 4500;
        doctorSay('Ối giời ơi, vỏ chuối!', 2600);
        sfx.slip();
        stars(doctor.x, doctor.y - 60);
        for (const c of [...caught]) release(c, 'Thầy thuốc ngã, chạy về thôi!');
        confetti(h.x, h.y, 50);
      } else {
        addToast(`🧧 ${truncate(user.name, 16)} có bùa hộ mệnh`, '#ffe9a8');
        announce(line('gift', { name: user.name, gift: giftLabel }), 1);
        p.shield = true;
        moveBehindHead(p);
        sfx.sparkle();
        sparks(h.x, h.y, 22);
        say(p, 'Có bùa rồi, không sợ! 🧧', 2400);
      }
      break;
    }
    case 'chaseNow':
      if (phase.name === 'walk' || phase.name === 'result') {
        startAsk();
        phase.script = [['dragon', 'Xin khúc đuôi!', 1200], ['doctor', docLine('askTail'), 1200]];
        phase.out = false;
      }
      break;
    case 'fly':
      startFly(dragon[0] || null);
      break;
    case 'ransomAny': {
      const c = caught.find((x) => x.real);
      if (c) runCommand(c, 'ransom');
      break;
    }
    case 'voiceTest':
      announce('Xin chào cả nhà. Mời mọi người vào chơi rồng rắn lên mây. Thả tim để rồng chạy thật nhanh nhé', 2, true);
      break;
    case 'reset':
      people.clear();
      dragon = [];
      caught.length = 0;
      leaving.length = 0;
      particles.length = 0;
      fly = null;
      hype = 0;
      round = 0;
      caughtTotal = 0;
      escapes = 0;
      Object.assign(doctor, { x: DOCTOR_HOME.x, y: DOCTOR_HOME.y, state: 'home', act: 'idle', bubble: null });
      resetTrail();
      startWalk();
      break;
    default:
      break;
  }
}

function makeLeader(p) {
  const old = dragon[0];
  if (old === p) return;
  removeFromDragon(p);
  if (p.state !== 'line') {
    const i = caught.indexOf(p);
    if (i >= 0) caught.splice(i, 1);
    p.state = 'line';
  }
  dragon.unshift(p);
  p.x = head.x;
  p.y = head.y;
}
function moveBehindHead(p) {
  const i = dragon.indexOf(p);
  if (i > 1) {
    dragon.splice(i, 1);
    dragon.splice(1, 0, p);
  }
}

// ------------------------------------------------------------------ cập nhật
function likeRate() {
  while (likeLog.length && now - likeLog[0].t > 2500) likeLog.shift();
  return likeLog.reduce((a, b) => a + b.n, 0) / 2.5; // tim mỗi giây
}

function steerHead(dt) {
  let speed = Number(config.dragonSpeed) || 190;
  let turn = 2.2;
  let tx;
  let ty;
  if (fly) {
    // bay vòng trên trời
    const k = (now - fly.t0) / 1000;
    fly.ang += dt * 0.9;
    tx = 540 + Math.cos(fly.ang) * 360;
    ty = 520 + Math.sin(fly.ang * 2) * 110 - Math.min(1, k / 2) * 30;
    speed *= 1.9;
    turn = 4;
  } else if (phase.name === 'chase') {
    // chạy tránh thầy thuốc, ở trong sân
    const boost = 1 + clamp(likeRate() * 0.045, 0, Number(config.likeBoost) || 1.2) + (now < speedUntil ? 0.3 : 0);
    speed *= boost;
    head.boost = boost;
    let best = null;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const px = head.x + Math.cos(a) * 160;
      const py = head.y + Math.sin(a) * 160;
      const margin = Math.min(px - YARD.x0, YARD.x1 - px, py - YARD.y0, YARD.y1 - py);
      const away = Math.hypot(px - doctor.x, py - doctor.y);
      let score = away - Math.max(0, -margin) * 6 + Math.cos(a - head.dir) * 60;
      // đầu rồng lượn vòng để đuôi văng ra xa
      score += Math.cos(a - (head.dir + 0.9)) * 40;
      if (!best || score > best.score) best = { score, a };
    }
    tx = head.x + Math.cos(best.a) * 100;
    ty = head.y + Math.sin(best.a) * 100;
    turn = 3;
  } else if (head.target) {
    tx = head.target.x;
    ty = head.target.y;
    if (Math.hypot(tx - head.x, ty - head.y) < 12) {
      if (phase.name === 'ask') return;
      head.target = null;
      return;
    }
  } else {
    // dạo quanh sân
    if (!head.wander || Math.hypot(head.wander.x - head.x, head.wander.y - head.y) < 60) {
      head.wander = { x: rand(YARD.x0 + 60, YARD.x1 - 60), y: rand(YARD.y0 + 60, YARD.y1 - 60) };
    }
    tx = head.wander.x;
    ty = head.wander.y;
    speed *= 0.62 * (now < speedUntil ? 1.6 : 1);
  }
  if (phase.name !== 'chase') head.boost = 1;
  const want = Math.atan2(ty - head.y, tx - head.x);
  let d = want - head.dir;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  head.dir += clamp(d, -turn * dt, turn * dt);
  const sc = scaleAtY(head.y) / 0.7;
  head.x += Math.cos(head.dir) * speed * dt * sc;
  head.y += Math.sin(head.dir) * speed * dt * sc;
  if (!fly) {
    head.x = clamp(head.x, YARD.x0 - 40, YARD.x1 + 40);
    head.y = clamp(head.y, phase.name === 'ask' ? 860 : YARD.y0 - 40, YARD.y1 + 40);
  }
  head.moved = speed * dt;
}

function gapAt(y) {
  return 54 * scaleAtY(y) / 0.7;
}

function updateTrail() {
  if (Math.hypot(head.x - trail[0].x, head.y - trail[0].y) >= 3) trail.unshift({ x: head.x, y: head.y });
  else {
    trail[0].x = head.x;
    trail[0].y = head.y;
  }
  // gán vị trí cho từng khúc theo quãng đường dọc vết
  let need = 0;
  let idx = 0;
  let acc = 0;
  const wig = now < wiggleUntil ? 1 : 0;
  for (let i = 0; i < dragon.length; i++) {
    const p = dragon[i];
    if (i > 0) need += gapAt(dragon[i - 1].ty ?? head.y);
    while (idx < trail.length - 1) {
      const seg = Math.hypot(trail[idx + 1].x - trail[idx].x, trail[idx + 1].y - trail[idx].y);
      if (acc + seg >= need) {
        const k = seg ? (need - acc) / seg : 0;
        p.tx = lerp(trail[idx].x, trail[idx + 1].x, k);
        p.ty = lerp(trail[idx].y, trail[idx + 1].y, k);
        p.tdir = Math.atan2(trail[idx].y - trail[idx + 1].y, trail[idx].x - trail[idx + 1].x);
        break;
      }
      acc += seg;
      idx++;
    }
    if (idx >= trail.length - 1) {
      // vết chưa đủ dài: kéo dài theo hướng cuối
      const last = trail[trail.length - 1];
      p.tx = last.x + (need - acc);
      p.ty = last.y;
    }
    if (wig) {
      const off = Math.sin(now * 0.012 - i * 0.7) * 18 * scaleAtY(p.ty);
      p.tx += Math.cos((p.tdir || 0) + Math.PI / 2) * off;
      p.ty += Math.sin((p.tdir || 0) + Math.PI / 2) * off * 0.6;
    }
  }
  // bỏ phần vết thừa
  const keep = Math.min(trail.length, idx + 200);
  if (trail.length > keep && trail.length > 400) trail.length = keep;
}

function moveToward(p, tx, ty, maxSpeed, dt) {
  const dx = tx - p.x;
  const dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  const step = Math.min(d, maxSpeed * dt);
  if (d > 0.01) {
    p.x += (dx / d) * step;
    p.y += (dy / d) * step;
  }
  p.walk = (p.walk || 0) + step / 10;
  return d;
}

function updateDoctor(dt) {
  const tail = dragon[dragon.length - 1];
  if (doctor.state === 'chase' && phase.name === 'chase' && tail) {
    if (now < doctor.stunUntil) return;
    const sp = (Number(config.doctorSpeed) || 215) * (now < doctor.slowUntil ? 0.55 : 1) * (scaleAtY(doctor.y) / 0.7);
    const d = moveToward(doctor, tail.x, tail.y, sp, dt);
    if (Math.random() < 0.3) dust(doctor.x, doctor.y);
    if (d < 34 * scaleAtY(doctor.y) / 0.7 && dragon.length > 1) catchTail();
  } else if (doctor.state === 'return' || doctor.state === 'chase') {
    if (now < doctor.tripUntil) return;
    const d = moveToward(doctor, DOCTOR_HOME.x, DOCTOR_HOME.y, 160, dt);
    if (d < 4) doctor.state = 'home';
  } else if (phase.name === 'ask') {
    // ra đứng trước cửa chờ
    moveToward(doctor, 230, 820, 120, dt);
  }
}

function update(dt) {
  if (fly && now > fly.until) endFly();
  if (phase.name === 'walk' && now > phase.until) startAsk();
  else if (phase.name === 'ask') runAsk();
  else if (phase.name === 'chase' && (now > phase.until || dragon.length < 2)) endChase();
  else if (phase.name === 'result' && now > phase.until) startWalk();

  if (dragon.length) {
    steerHead(dt);
    if (dragon[0].state === 'line' && dist(dragon[0], head) > 200 && !fly) {
      // đầu rồng mới: kéo đầu về chỗ người đó
      head.x = dragon[0].x;
      head.y = dragon[0].y;
    }
  }
  updateTrail();
  const runSpeed = (Number(config.dragonSpeed) || 190) * 2.6;
  for (const p of dragon) {
    if (p.tx == null) continue;
    const d = moveToward(p, p.tx, p.ty, Math.max(runSpeed, 900 * (head.boost || 1)), dt);
    if (d > 60) p.walk += dt * 6;
    if (p.act !== 'shoulder' && now > p.actUntil) p.act = 'shoulder';
    if (phase.name === 'chase' && Math.random() < 0.02) dust(p.x, p.y);
  }
  for (const p of caught) {
    const s = matSpot(p.spot);
    const d = moveToward(p, s.x, s.y, 300, dt);
    p.sitting = d < 3;
    if (now > p.releaseAt) release(p, 'Hết giờ phạt, về đội!');
  }
  for (let i = leaving.length - 1; i >= 0; i--) {
    const p = leaving[i];
    if (moveToward(p, p.leaveTo.x, p.leaveTo.y, 380, dt) < 5) {
      leaving.splice(i, 1);
      if (p.real) p.state = 'gone';
    }
  }
  updateDoctor(dt);
  // người lâu không tương tác thì rời rồng khi rồng đã dài
  if (Math.random() < 0.01) {
    const idleMs = Math.max(2, Number(config.idleMinutes) || 10) * 60000;
    const max = clamp(Number(config.maxDragon) || 30, 6, 60);
    if (dragon.length > max * 0.7) {
      const old = dragon.slice(1).find((p) => p.real && p.coins === 0 && now - p.lastActive > idleMs);
      if (old) {
        removeFromDragon(old);
        sendAway(old);
      }
    }
  }
  // tán gẫu khi rảnh
  if (phase.name === 'walk' && Math.random() < dt * 0.25 && dragon.length) {
    const p = pick(dragon);
    if (!p.bubble || now > p.bubble.until) say(p, pick(config.idleChat || DEFAULTS.idleChat), 2200);
  }
  // hạt
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    if (now - q.born > q.life) {
      particles.splice(i, 1);
      continue;
    }
    q.vy += (q.g || 0) * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (q.vr) q.rot += q.vr * dt;
  }
  if (fly && Math.random() < dt * 14) {
    const p = pick(dragon);
    if (p) puffs(p.x, p.y + 10, 1);
  }
  flash = Math.max(0, flash - dt * 1.2);
}

// ------------------------------------------------------------------ vẽ
function personParams(p, extra = {}) {
  const t = now + p.seed * 1000;
  const talking = p.bubble && now < p.bubble.until && now - p.bubble.born < 2200;
  const sitting = p.state === 'caught' && p.sitting;
  return {
    sit: sitting,
    act: sitting ? 'sitSad' : p.state === 'leave' ? 'walk' : p === dragon[0] && phase.name === 'chase' ? 'protect' : p.act,
    t,
    mouth: talking || p.act === 'sing' ? Math.abs(Math.sin(t * 0.025)) : 0,
    blink: (t % 4200) < 130,
    walk: p.walk || 0,
    happy: now < p.happyUntil,
    scared: now < p.scaredUntil || (p.state === 'caught' && !p.sitting),
    hat: p === dragon[0] && p.state === 'line' ? 'dragon' : p.hat,
    seed: p.seed,
    ...extra,
  };
}

function drawShadow(x, y, s) {
  ctx.fillStyle = 'rgba(60,20,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y, 30 * s, 8 * s, 0, 0, TAU);
  ctx.fill();
}

function drawMember(p) {
  const s = scaleAtY(p.y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(s, s);
  if (p.shield) {
    // vòng bùa hộ mệnh
    ctx.strokeStyle = `rgba(255,213,74,${0.55 + Math.sin(now * 0.008) * 0.25})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, -80, 46, 100, 0, 0, TAU);
    ctx.stroke();
  }
  drawPerson(ctx, p.look, personParams(p));
  ctx.restore();
}

function drawDoctor() {
  const s = scaleAtY(doctor.y) * 1.12;
  ctx.save();
  ctx.translate(doctor.x, doctor.y);
  if (now < doctor.tripUntil) {
    // ngã sấp
    ctx.rotate(-Math.PI / 2 * 0.9);
    ctx.translate(40 * s, -10 * s);
  }
  ctx.scale(s, s);
  const t = now;
  const chasing = doctor.state === 'chase' && phase.name === 'chase';
  // gậy
  ctx.strokeStyle = '#6d4c2f';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(chasing ? 70 : 34, chasing ? -150 : -64);
  ctx.lineTo(chasing ? 96 : 40, chasing ? -60 : 0);
  ctx.stroke();
  drawPerson(ctx, DOCTOR_LOOK, {
    sit: false,
    act: chasing ? (now < doctor.stunUntil ? 'cheer' : 'grab') : doctor.state === 'home' ? 'idle' : 'walk',
    t,
    walk: doctor.walk || 0,
    mouth: now < doctor.mouthUntil ? Math.abs(Math.sin(t * 0.025)) : 0,
    blink: (t % 3800) < 140,
    happy: phase.name === 'result' && phase.caught > 0,
    scared: now < doctor.tripUntil,
    hat: 'khanDong',
  });
  ctx.restore();
  if (now < doctor.stunUntil && now >= doctor.tripUntil && Math.random() < 0.1) stars(doctor.x, doctor.y - 170 * s);
}

function drawTag(p) {
  if (!p.real || !p.user || p.state === 'leave') return;
  const s = scaleAtY(p.y);
  const sitting = p.state === 'caught' && p.sitting;
  const ts = Math.max(0.8, s * 1.2);
  const top = p.y - (sitting ? 172 : 190) * s - (p === dragon[0] ? 26 * s : p.hat ? 6 * s : 0);
  const lead = p === dragon[0];
  const name = lead ? `🐲 ${truncate(p.user.name, 10)}` : truncate(p.user.name, 10);
  const fs = Math.round(16 * ts);
  ctx.font = `700 ${fs}px ${FONT}`;
  const tw = ctx.measureText(name).width;
  const r = 10 * ts;
  const w = tw + r * 2 + 14 * ts;
  const h = 24 * ts;
  const x = p.x - w / 2;
  const y = top - h;
  ctx.fillStyle = lead ? 'rgba(150,20,10,0.88)' : p.state === 'caught' ? 'rgba(70,70,70,0.8)' : 'rgba(40,20,10,0.72)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (p.shield) {
    ctx.strokeStyle = '#ffd54a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  drawAvatar(x + r + 2 * ts, y + h / 2, r, p.user, p.look.shirt);
  ctx.fillStyle = lead ? '#ffe082' : '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + r * 2 + 7 * ts, y + h / 2 + 1);
}

function drawBubbleAt(x, bottomY, text, s, born, color = '#fff') {
  const fs = Math.round(clamp(20 * s, 16, 24));
  ctx.font = `600 ${fs}px ${FONT}`;
  const lines = wrapText(text, 20, 3);
  const lh = fs * 1.2;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22;
  const h = lines.length * lh + 14;
  const pop = clamp((now - born) / 160, 0, 1);
  const bx = clamp(x - w / 2, 6, W - w - 6);
  const by = clamp(bottomY - h - 10, 270, H);
  ctx.save();
  ctx.globalAlpha = pop;
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  rr(ctx, bx, by, w, h, 12);
  ctx.fill();
  ctx.shadowBlur = 0;
  const tx = clamp(x, bx + 14, bx + w - 14);
  ctx.beginPath();
  ctx.moveTo(tx - 7, by + h - 1);
  ctx.lineTo(tx + 7, by + h - 1);
  ctx.lineTo(tx, by + h + 10);
  ctx.fill();
  ctx.fillStyle = '#2a1a12';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 7 + i * lh));
  ctx.restore();
}

function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
}

function drawParticles() {
  for (const p of particles) {
    const k = (now - p.born) / p.life;
    const a = 1 - k;
    ctx.save();
    switch (p.kind) {
      case 'heart':
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        heartPath(p.x, p.y, p.size);
        ctx.fill();
        break;
      case 'spark':
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - k * 0.5), 0, TAU);
        ctx.fill();
        break;
      case 'dust':
        ctx.globalAlpha = a * 0.45;
        ctx.fillStyle = '#e8c9a8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + k), 0, TAU);
        ctx.fill();
        break;
      case 'cloud':
        cloud(ctx, p.x, p.y, p.size * (0.8 + k * 0.6), a * 0.9);
        break;
      case 'confetti':
        ctx.globalAlpha = Math.min(1, a * 2);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        break;
      case 'star': {
        ctx.globalAlpha = a;
        const ang = p.rot + k * 6;
        const sx = p.x + Math.cos(ang) * 34;
        const sy = p.y + Math.sin(ang) * 12;
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? p.size * 0.45 : p.size;
          const aa = (i / 10) * TAU - Math.PI / 2;
          ctx.lineTo(sx + Math.cos(aa) * r, sy + Math.sin(aa) * r);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      default:
        break;
    }
    ctx.restore();
  }
}

function drawWorld() {
  if (bgImage) ctx.drawImage(bgImage, 0, 0, W, H);
  else ctx.drawImage(bg, 0, 0);
  drawFlags(ctx, now);
  // mây trôi
  for (let i = 0; i < 3; i++) {
    const x = ((now * (0.008 + i * 0.004) + i * 420) % (W + 400)) - 200;
    cloud(ctx, x, 290 + i * 70, 0.45 + i * 0.12, 0.55);
  }
  // rồng vàng khi bay
  if (fly && dragon.length > 1) {
    const k = clamp((now - fly.t0) / 1500, 0, 1) * clamp((fly.until - now) / 1200, 0, 1);
    // cả đàn cưỡi trên lưng rồng vàng
    const pts = dragon.map((p) => ({ x: p.x, y: p.y + 4 }));
    const last = dragon[dragon.length - 1];
    const prev = dragon[dragon.length - 2];
    pts.push({ x: last.x + (last.x - prev.x) * 0.8, y: last.y + 4 + (last.y - prev.y) * 0.8 });
    drawDragonBody(ctx, pts, 1, now, k);
  }
  const items = [];
  for (const p of dragon) items.push({ y: p.y, draw: () => { drawShadow(p.x, p.y, scaleAtY(p.y)); drawMember(p); } });
  for (const p of caught) items.push({ y: p.y, draw: () => drawMember(p) });
  for (const p of leaving) items.push({ y: p.y, draw: () => drawMember(p) });
  items.push({ y: doctor.y, draw: drawDoctor });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();
  if (fly && dragon.length) {
    const k = clamp((now - fly.t0) / 1500, 0, 1) * clamp((fly.until - now) / 1200, 0, 1);
    const h = dragon[0];
    ctx.save();
    ctx.globalAlpha = k;
    drawDragonHead(ctx, h.x + Math.cos(head.dir) * 60, h.y - 10, 0.85, head.dir, now);
    ctx.restore();
  }
  drawParticles();
  const ppl = [...dragon, ...caught].sort((a, b) => a.y - b.y);
  for (const p of ppl) drawTag(p);
  // bong bóng: chỉ vài cái mới nhất cho đỡ rối
  const talk = ppl.filter((p) => p.bubble && now < p.bubble.until).sort((a, b) => b.bubble.born - a.bubble.born).slice(0, 6);
  for (const p of talk) {
    const s = scaleAtY(p.y);
    drawBubbleAt(p.x, p.y - (p.real ? 222 : 196) * s, p.bubble.text, Math.max(0.8, s * 1.2), p.bubble.born);
  }
  if (doctor.bubble && now < doctor.bubble.until) {
    const s = scaleAtY(doctor.y) * 1.12;
    drawBubbleAt(doctor.x + 30, doctor.y - 200 * s, doctor.bubble.text, 1.05, doctor.bubble.born, '#fff3e0');
  }
}

// ------------------------------------------------------------------ giao diện phủ
function chip(text, x, y, align, bgc = 'rgba(40,15,5,0.7)') {
  const tw = ctx.measureText(text).width + 24;
  const bx = align === 'left' ? x : align === 'center' ? x - tw / 2 : x - tw;
  ctx.fillStyle = bgc;
  rr(ctx, bx, y, tw, 38, 19);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(text, bx + 12, y + 20);
}

function drawHeader() {
  const w = 700;
  const x = (W - w) / 2;
  const y = 18;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 12;
  const g = ctx.createLinearGradient(0, y, 0, y + 96);
  g.addColorStop(0, '#c62828');
  g.addColorStop(1, '#8e1414');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, 96, 22);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 4;
  rr(ctx, x + 7, y + 7, w - 14, 82, 16);
  ctx.stroke();
  // hoa văn mây hai bên
  for (const sx of [x + 44, x + w - 44]) {
    ctx.strokeStyle = 'rgba(255,213,74,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, y + 48, 14, Math.PI * 0.2, Math.PI * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx + (sx < W / 2 ? 14 : -14), y + 56, 8, Math.PI, TAU * 1.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff4d6';
  ctx.font = `900 54px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#5a0b0b';
  const title = config.title || DEFAULTS.title;
  ctx.strokeText(title, W / 2, y + 50);
  ctx.fillText(title, W / 2, y + 50);
  ctx.restore();
  ctx.save();
  ctx.font = `600 21px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const sub = config.subtitle || '';
  const sw = Math.min(W - 20, ctx.measureText(sub).width + 30);
  ctx.fillStyle = 'rgba(40,15,5,0.62)';
  rr(ctx, (W - sw) / 2, 120, sw, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(sub, W / 2, 138);
  ctx.restore();
}

function drawStatus() {
  ctx.save();
  ctx.font = `800 21px ${FONT}`;
  ctx.textBaseline = 'middle';
  chip(`🐉 Rồng dài ${dragon.length} khúc`, 14, 272, 'left');
  chip(`🎯 Ván ${round} · thoát ${escapes}`, 14, 316, 'left');
  chip(`😵 Bị bắt: ${caught.length}`, 14, 360, 'left');
  ctx.restore();
  // thanh lên mây
  const max = Math.max(50, Number(config.hypeMax) || 1500);
  const k = fly ? 1 : clamp(hype / max, 0, 1);
  const bw = 320;
  const bx = W - 14 - bw;
  const by = 272;
  ctx.save();
  ctx.fillStyle = 'rgba(40,15,5,0.7)';
  rr(ctx, bx, by, bw, 38, 19);
  ctx.fill();
  const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  g.addColorStop(0, '#81d4fa');
  g.addColorStop(1, '#ffd54a');
  ctx.fillStyle = g;
  rr(ctx, bx + 4, by + 4, Math.max(30, (bw - 8) * k), 30, 15);
  ctx.fill();
  ctx.fillStyle = '#3a1a00';
  ctx.font = `900 19px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fly ? '☁️ ĐANG BAY LÊN MÂY!' : `☁️ Lên mây ${Math.round(k * 100)}%`, bx + bw / 2, by + 20);
  ctx.restore();
  // pha hiện tại
  ctx.save();
  ctx.font = `800 21px ${FONT}`;
  ctx.textBaseline = 'middle';
  const left = Math.max(0, Math.ceil((phase.until - now) / 1000));
  let text = '';
  let col = 'rgba(40,15,5,0.7)';
  if (fly) text = '🐲 Rồng bay lên mây!';
  else if (phase.name === 'walk') text = `🎶 Dạo sân · ${left}s nữa hỏi thầy thuốc`;
  else if (phase.name === 'ask') text = '🙋 Hỏi thăm thầy thuốc...';
  else if (phase.name === 'chase') {
    text = `🏃 THẦY THUỐC ĐUỔI! ${left}s`;
    col = 'rgba(183,28,28,0.9)';
  } else if (phase.name === 'result') text = phase.caught ? `😵 Bị bắt ${phase.caught} người` : '🎉 Rồng thoát rồi!';
  chip(text, W - 14, 316, 'right', col);
  if (phase.name === 'chase') {
    const boost = Math.round(((head.boost || 1) - 1) * 100);
    chip(`❤️ Thả tim: rồng nhanh +${boost}%`, W - 14, 360, 'right', 'rgba(173,20,87,0.85)');
  }
  ctx.restore();
  // top quà
  const top = [...people.values()].filter((x) => x.real && x.coins > 0).sort((a, b) => b.coins - a.coins).slice(0, 3);
  if (top.length) {
    ctx.save();
    const lx = W - 14 - 300;
    let ly = phase.name === 'chase' ? 408 : 364;
    ctx.fillStyle = 'rgba(40,15,5,0.62)';
    rr(ctx, lx, ly, 300, 36 + top.length * 34, 14);
    ctx.fill();
    ctx.fillStyle = '#ffd54a';
    ctx.font = `800 19px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆 Bảng vàng hội làng', lx + 14, ly + 19);
    ly += 38;
    top.forEach((g2, i) => {
      drawAvatar(lx + 30, ly + 14, 13, g2.user, g2.look.shirt);
      ctx.fillStyle = '#fff';
      ctx.font = `700 18px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(`${['🥇', '🥈', '🥉'][i]} ${truncate(g2.user.name, 13)}`, lx + 50, ly + 15);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffe082';
      ctx.fillText(`${g2.coins} xu`, lx + 288, ly + 15);
      ly += 34;
    });
    ctx.restore();
  }
}

function drawToasts() {
  let y = 650;
  for (let i = toasts.length - 1; i >= 0; i--) {
    const t = toasts[i];
    const age = now - t.born;
    if (age > 4200) {
      toasts.splice(i, 1);
      continue;
    }
    const a = Math.min(1, age / 200, (4200 - age) / 400);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `800 24px ${FONT}`;
    const w = ctx.measureText(t.text).width + 32;
    const x = W - 14 - w + (1 - Math.min(1, age / 200)) * 60;
    ctx.fillStyle = 'rgba(40,15,5,0.75)';
    rr(ctx, x, y, w, 44, 22);
    ctx.fill();
    ctx.fillStyle = t.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.text, x + 16, y + 23);
    ctx.restore();
    y += 52;
  }
}

let caption = null;
function drawCaption() {
  if (!caption || now > caption.until) {
    caption = null;
    const next = captions.shift();
    if (next) caption = { ...next, born: now, until: now + Math.max(3200, next.text.length * 70) };
  }
  if (!caption) return;
  const age = now - caption.born;
  const a = Math.min(1, age / 250, (caption.until - now) / 300);
  ctx.save();
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.font = `700 27px ${FONT}`;
  const lines = wrapText(caption.text, 36, 3);
  const w = Math.min(W - 30, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 100);
  const h = 22 + lines.length * 35;
  const x = (W - w) / 2;
  const y = 520;
  ctx.fillStyle = 'rgba(255,248,230,0.95)';
  rr(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.strokeStyle = '#b71c1c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = `${Math.round(40)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(caption.who === 'doctor' ? '👴' : caption.who === 'dragon' ? '🐲' : '🥁', x + 42, y + h / 2);
  ctx.font = `700 27px ${FONT}`;
  ctx.fillStyle = '#3e1a0a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, x + 76, y + 12 + i * 35));
  ctx.restore();
}

const GUIDE_CMDS = [
  ['🐉', 'rồng rắn'], ['🐍', 'lúc lắc'], ['🏃', 'chạy mau'], ['🛡️', 'bảo vệ'], ['🔥', 'xin lửa'],
  ['💀', 'khúc đầu'], ['🩸', 'khúc giữa'], ['🦎', 'khúc đuôi'], ['🙏', 'chuộc'], ['❤️', 'thả tim = chạy nhanh'],
];
// bảng lệnh đặt phía trên: phía dưới màn hình điện thoại bị khung bình luận TikTok che
function drawGuide() {
  ctx.save();
  const top = 164;
  ctx.fillStyle = 'rgba(40,15,5,0.75)';
  rr(ctx, 10, top, W - 20, 92, 18);
  ctx.fill();
  ctx.font = `700 21px ${FONT}`;
  ctx.textBaseline = 'middle';
  const rows = [GUIDE_CMDS.slice(0, 5), GUIDE_CMDS.slice(5)];
  rows.forEach((row, r) => {
    const widths = row.map(([e, t]) => ctx.measureText(`${e} ${t}`).width + 22);
    const total = widths.reduce((a2, b2) => a2 + b2, 0) + (row.length - 1) * 8;
    let x = (W - total) / 2;
    const y = top + 8 + r * 42;
    row.forEach(([e, t], i) => {
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      rr(ctx, x, y, widths[i], 34, 17);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(`${e} ${t}`, x + 11, y + 18);
      x += widths[i] + 8;
    });
  });
  ctx.restore();
}

let lastFrame = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastFrame) / 1000);
  lastFrame = ts;
  now = ts;
  update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawWorld();
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,240,200,${flash * 0.45})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (fly) {
    // ánh vàng khi rồng bay
    const k = clamp((now - fly.t0) / 1500, 0, 1) * clamp((fly.until - now) / 1200, 0, 1);
    ctx.fillStyle = `rgba(255,215,64,${0.12 * k})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawHeader();
  drawGuide();
  drawStatus();
  drawToasts();
  drawCaption();
  if (audioBlocked) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(ctx, W / 2 - 250, 760, 500, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔇 Bấm vào game để bật tiếng', W / 2, 789);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ kết nối
function connectWs() {
  if (location.protocol === 'file:') return;
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onmessage = (e) => {
    try {
      handleEvent(JSON.parse(e.data));
    } catch (err) {
      console.warn(err);
    }
  };
  ws.onclose = () => setTimeout(connectWs, 2000);
}

let audioBlocked = false;
async function boot() {
  try {
    const res = await fetch('/rong-ran-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  config.doctorLines = { ...DEFAULTS.doctorLines, ...(config.doctorLines || {}) };
  buildCommands();
  drawStatic(bg.getContext('2d'));
  if (params.get('export') === '1') {
    exportBackground();
    return;
  }
  if (config.backgroundImage && params.get('bg') !== '0') {
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        bgImage = img;
        resolve();
      };
      img.onerror = () => {
        console.warn('[nền] Không tải được ảnh', config.backgroundImage);
        resolve();
      };
      img.src = config.backgroundImage;
    });
  }
  if (params.get('sound') === '0') config.sound = false;
  if (params.get('voice') === '0') config.voice = false;
  if (params.get('music') === '0') config.music = false;
  sfx.setSoundEnabled(config.sound !== false);
  voice.setSoundEnabled(config.sound !== false);
  voice.setVoiceEnabled(config.voice !== false);
  voice.setVoiceEngine(params.get('engine') || config.voiceEngine);
  voice.setPreferredVoice(config.ttsVoice);
  voice.setOnSpeakStart((text) => sfx.duck(Math.min(9000, 1500 + String(text).length * 75)));
  let files = Array.isArray(config.musicFiles) ? config.musicFiles.filter(Boolean) : [];
  try {
    const r = await fetch('/rong-ran-music.json', { cache: 'no-store' });
    if (r.ok) files = [...(await r.json()), ...files];
  } catch {
    /* không có máy chủ */
  }
  const startMusic = () => {
    if (config.sound === false) return;
    if (config.music === false) {
      sfx.startMusic({ files: [], volume: 0, ambience: Number(config.ambienceVolume ?? 0.08) });
      return;
    }
    sfx.startMusic({ files, volume: Number(config.musicVolume ?? 0.3), ambience: Number(config.ambienceVolume ?? 0.08) });
  };
  startMusic();
  window.addEventListener('pointerdown', () => {
    sfx.unlockAudio();
    voice.unlockAudio();
    startMusic();
  });
  setInterval(() => {
    audioBlocked = config.sound !== false && config.music !== false && !sfx.musicAudible();
    if (audioBlocked) {
      sfx.unlockAudio();
      startMusic();
    }
  }, 3000);
  if (config.narration !== false) {
    const gap = Math.max(15, Number(config.narrationSeconds) || 45) * 1000;
    setInterval(() => {
      if (performance.now() - lastAnnounce > gap) announce(line('reminder'), 0);
    }, 3000);
  }
  setInterval(refillCrowd, 1500);
  for (let i = 0; i < Math.min(5, Number(config.ambientCrowd) || 0); i++) refillCrowd();
  startWalk();
  connectWs();
  requestAnimationFrame(frame);
}

// Xuất ảnh nền trống để tự thiết kế lại (rong-ran.html?export=1)
function exportBackground() {
  const a = document.createElement('a');
  a.download = 'nen-rong-ran.png';
  a.href = bg.toDataURL('image/png');
  a.click();
  ctx.drawImage(bg, 0, 0);
}

window.__rongRan = { handleEvent, dragon: () => dragon, config: () => config, state: () => ({ phase: phase.name, caught: caught.length, caughtTotal, round, escapes, boost: head.boost }) };
boot();
