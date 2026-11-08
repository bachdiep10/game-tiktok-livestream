// Game TikTok LIVE "Đuổi hình bắt chữ": mỗi câu ghép vài hình emoji 3D thành một từ tiếng Việt,
// người xem gõ đáp án vào bình luận. Ai đúng trước được nhiều điểm hơn, bảng xếp hạng Top 5 luôn hiện.
// Thả tim / tặng quà để mở bớt chữ gợi ý, đủ mục tiêu tim thì câu sau nhân đôi điểm.
// Hình: Microsoft Fluent Emoji 3D (giấy phép MIT), tải sẵn trong public/assets/duoi-hinh/hinh.
import { CAU_DO, HINH_GIAO_DIEN } from './cauDo.js';
import * as sfx from './dhAudio.js';
import * as voice from '../audio.js';

const W = 1080;
const H = 1920;
const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);
const PREVIEW = params.get('preview') === '1';
const SPEED = Math.max(0.25, Number(params.get('speed')) || 1);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const FONT = '"Segoe UI", system-ui, sans-serif';

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'ĐUỔI HÌNH BẮT CHỮ',
  mcName: 'MC',
  backgroundImage: '',
  mcImage: '',
  questionSeconds: 40,
  afterFirstSeconds: 10,
  revealSeconds: 6,
  questionsPerRound: 10,
  roundEndSeconds: 10,
  difficultyOrder: [1, 1, 1, 1, 2, 2, 2, 3, 3, 3],
  points: { 1: 10, 2: 15, 3: 20 },
  rankFactor: [1, 0.8, 0.6, 0.5, 0.4],
  autoHintAt: [0.5, 0.75],
  likesPerHint: 30,
  heartGoal: 1000,
  heartGoalStep: 1000,
  giftTiers: { medium: 10, big: 100 },
  followBonus: 3,
  shareBonus: 2,
  acceptNoAccent: true,
  customOnly: false,
  cauDoThem: [],
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.22,
  voice: true,
  voiceLevel: 'vua',
  voiceGapSeconds: 3,
  voiceJoin: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-HoaiMyNeural',
  captions: true,
  narration: true,
  narrationSeconds: 50,
  messages: {
    join: ['Chào {name}! Vào soi hình đoán chữ cùng mình nha', 'Chào mừng {name}, gõ đáp án vào bình luận nhé', '{name} vào rồi, soi kỹ hình nào', 'Xin chào {name}, cùng đuổi hình bắt chữ nhé'],
    question: ['Câu số {n}. Cả nhà soi kỹ nhé', 'Câu {n}. Hình gì đây cả nhà ơi', 'Câu {n} đến rồi, ai nhanh tay nhất nào', 'Câu số {n}. Đoán nhanh lên nào'],
    firstCorrect: ['Chính xác! {name} trả lời đúng đầu tiên', 'Quá đỉnh! {name} đoán trúng rồi', '{name} nhanh nhất, chính xác'],
    noOne: ['Hết giờ! Chưa ai đoán ra. Đáp án là {answer}', 'Khó quá phải không? Đáp án là {answer}'],
    answer: ['Đáp án là {answer}. Có {n} người trả lời đúng', 'Đáp án: {answer}. {n} bạn đã đoán trúng'],
    almost: ['{name} gần đúng rồi', 'Sắp trúng rồi {name} ơi'],
    hintLikes: ['Đủ tim rồi, mở thêm một chữ', 'Cảm ơn cả nhà thả tim, mở một chữ gợi ý'],
    hintAuto: ['Gợi ý thêm một chữ nhé', 'Mở bớt một chữ cho dễ nào'],
    heartGoal: ['Đạt mục tiêu {goal} tim! Câu sau nhân đôi điểm', 'Tuyệt vời, đủ {goal} tim rồi! Câu tiếp theo điểm gấp đôi'],
    follow: ['Cảm ơn {name} đã theo dõi, tặng {n} điểm', '{name} vừa theo dõi kênh, cộng {n} điểm'],
    share: ['Cảm ơn {name} đã chia sẻ, cộng {n} điểm', '{name} chia sẻ LIVE, cộng {n} điểm'],
    gift: ['Cảm ơn {name} tặng {gift}, mở giúp cả nhà một chữ', '{name} tặng {gift}. Mở một chữ gợi ý nào'],
    mediumGift: ['Cảm ơn {name} tặng {gift}! Mở một chữ và cộng {n} điểm cho {name}', '{name} tặng {gift}, cộng {n} điểm và mở thêm chữ'],
    bigGift: ['Ôi {name} tặng {gift}! Mở một nửa số chữ, câu này nhân đôi điểm', 'Cảm ơn đại gia {name} tặng {gift}! Siêu gợi ý, điểm gấp đôi'],
    roundEnd: ['Kết thúc vòng {round}. Thánh soi hình là {name} với {n} điểm', 'Hết vòng {round}! Quán quân là {name}, {n} điểm'],
    roundEmpty: ['Kết thúc vòng {round}. Vòng sau cả nhà nhớ gõ đáp án vào bình luận nhé'],
    reminder: [
      'Gõ đáp án vào bình luận, ai đúng trước được nhiều điểm hơn',
      'Thả tim để mở bớt chữ gợi ý',
      'Tặng quà để mở chữ, quà lớn được nhân đôi điểm',
      'Gõ không dấu cũng được tính nhé',
      'Top 5 người giỏi nhất luôn hiện trên màn hình',
      'Theo dõi kênh để được cộng điểm',
    ],
  },
};
let config = structuredClone(DEFAULTS);

const lastLine = {};
function line(kind, vars = {}) {
  const list = (config.messages && config.messages[kind]) || DEFAULTS.messages[kind] || [];
  if (!list.length) return '';
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastLine[kind]) i = (i + 1) % list.length;
  lastLine[kind] = i;
  return list[i].replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
}

// bỏ dấu + khoảng trắng để so đáp án
function compact(s, noAccent = true) {
  let t = String(s || '').toLowerCase().normalize('NFC');
  if (noAccent) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  return t.replace(/[^\p{L}\p{N}]+/gu, '');
}
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

// ------------------------------------------------------------------ hình
const codeOf = (e) => Array.from(String(e).replace(/️/g, '')).map((c) => c.codePointAt(0).toString(16)).join('-');
const isFile = (s) => /\.(png|jpe?g|webp|gif|svg)$/i.test(String(s));
let onlineLib = null;
async function onlineUrl(glyph) {
  if (!onlineLib) {
    onlineLib = fetch('assets/duoi-hinh/thu-vien.json').then((r) => r.json()).then((j) => ({ base: j.goc, map: new Map(j.hinh.map(([g, , , p]) => [codeOf(g), p])) })).catch(() => ({ map: new Map() }));
  }
  const lib = await onlineLib;
  const p = lib.map.get(codeOf(glyph));
  return p ? lib.base + p.split('/').map(encodeURIComponent).join('/') : '';
}
const imgCache = new Map();
// trả về { img, ready, glyph } ; nếu không có ảnh thì vẽ emoji bằng phông chữ
function getImage(item) {
  const key = String(item);
  let rec = imgCache.get(key);
  if (rec) return rec;
  rec = { img: new Image(), ready: false, failed: false, glyph: key };
  imgCache.set(key, rec);
  rec.img.onload = () => {
    rec.ready = true;
  };
  if (isFile(key)) {
    rec.img.onerror = () => {
      rec.failed = true;
    };
    rec.img.src = key.startsWith('http') || key.startsWith('/') || key.startsWith('assets/') ? key : `assets/duoi-hinh/tu-them/${key}`;
  } else {
    rec.img.onerror = async () => {
      // chưa tải sẵn -> lấy trực tiếp từ thư viện Fluent Emoji trên mạng
      if (rec.triedOnline) {
        rec.failed = true;
        return;
      }
      rec.triedOnline = true;
      const url = await onlineUrl(key);
      if (url) {
        rec.img.crossOrigin = 'anonymous';
        rec.img.src = url;
      } else rec.failed = true;
    };
    rec.img.src = `assets/duoi-hinh/hinh/${codeOf(key)}.png`;
  }
  return rec;
}
function drawItem(item, cx, cy, size, alpha = 1) {
  const rec = getImage(item);
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (rec.ready) {
    const iw = rec.img.naturalWidth;
    const ih = rec.img.naturalHeight;
    const s = size / Math.max(iw, ih);
    ctx.drawImage(rec.img, cx - (iw * s) / 2, cy - (ih * s) / 2, iw * s, ih * s);
  } else if (rec.failed || rec.triedOnline) {
    ctx.font = `${Math.round(size * 0.8)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isFile(item) ? '❓' : item, cx, cy + size * 0.05);
  }
  ctx.restore();
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

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function truncate(s, n) {
  const a = Array.from(String(s || ''));
  return a.length > n ? `${a.slice(0, n - 1).join('')}…` : a.join('');
}
function fitFont(text, weight, maxSize, maxWidth) {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  return size;
}

// ảnh đại diện
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
const COLORS = ['#ef5350', '#ab47bc', '#5c6bc0', '#29b6f6', '#26a69a', '#9ccc65', '#ffca28', '#ff7043', '#8d6e63', '#ec407a'];
function colorOf(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}
function drawAvatar(x, y, r, user, ring = '#fff') {
  const img = getAvatar(user.avatar);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  if (img) {
    ctx.clip();
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = colorOf(user.id);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${Math.round(r * 1.05)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Array.from(user.name || '?')[0].toUpperCase(), x, y + 2);
  }
  ctx.restore();
  ctx.strokeStyle = ring;
  ctx.lineWidth = Math.max(3, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}

// ------------------------------------------------------------------ trạng thái
let now = performance.now();
const players = new Map(); // id -> { id, name, avatar, score, roundScore, correct, lastSeen, shareAt }
let bank = []; // câu đố đang dùng
let round = 1;
let qIndex = 0; // câu thứ mấy trong vòng (1..)
let totalLikes = 0;
let goal = 1000;
let doubleNext = false;
let pendingHints = 0;
const phase = { name: 'boot', t0: 0, until: 0 };
let q = null; // câu hiện tại
const particles = [];
const toasts = [];
const guesses = []; // bình luận đoán gần nhất
const captions = [];
let mcText = '';
let mcTextAt = 0;
let lastAnnounce = performance.now();
let lastSpoken = -1e9;
let roundTop = [];
let flash = 0;
let shake = 0;

function player(user) {
  if (!user || !user.id) return null;
  let p = players.get(user.id);
  if (!p) {
    p = { id: user.id, name: user.name || user.uniqueId || 'Bạn', avatar: user.avatar || '', score: 0, roundScore: 0, correct: 0, lastSeen: now, shareAt: 0 };
    players.set(user.id, p);
  }
  if (user.name) p.name = user.name;
  if (user.avatar) p.avatar = user.avatar;
  p.lastSeen = now;
  return p;
}
function activeCount() {
  let n = 0;
  for (const p of players.values()) if (now - p.lastSeen < 5 * 60 * 1000) n++;
  return n;
}
function top(n, key = 'score') {
  return [...players.values()].filter((p) => p[key] > 0).sort((a, b) => b[key] - a[key] || (a.firstAt || 0) - (b.firstAt || 0)).slice(0, n);
}

// priority: -1 chỉ hiện chữ, 0 chào hỏi, 1 diễn biến, 2 quà lớn
function announce(text, priority = 0, force = false) {
  if (!text) return;
  lastAnnounce = performance.now();
  mcText = text;
  mcTextAt = now;
  const level = { it: 2, vua: 1, nhieu: 0 }[config.voiceLevel] ?? 1;
  const gap = Math.max(0, Number(config.voiceGapSeconds ?? 3)) * 1000;
  if (priority >= 0 && (force || (priority >= level && performance.now() - lastSpoken >= gap))) {
    lastSpoken = performance.now();
    voice.speak(text, Math.max(0, priority));
  }
}
function addToast(text, color = '#fff', icon = '') {
  toasts.push({ text, color, icon, born: now });
  if (toasts.length > 2) toasts.shift();
}
function addParticle(o) {
  if (particles.length < 500) particles.push({ born: now, vx: 0, vy: 0, g: 0, life: 1200, rot: 0, vr: 0, ...o });
}
function confetti(x, y, n, spread = 1) {
  const cols = ['#ffd54a', '#ff5c8a', '#4fc3f7', '#7cff9a', '#ffffff', '#c39bff'];
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(200, 650) * spread;
    addParticle({ kind: 'conf', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 300, g: 900, life: rand(1400, 2400), color: pick(cols), rot: rand(0, TAU), vr: rand(-10, 10), s: rand(8, 16) });
  }
}
function sparks(x, y, n, color = '#ffe066') {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(80, 320);
    addParticle({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 120, life: rand(500, 900), color, s: rand(3, 7) });
  }
}
function hearts(n) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'heart', x: rand(860, 1040), y: rand(250, 300), vx: rand(-60, 60), vy: rand(-260, -120), g: -30, life: rand(1000, 1600), s: rand(14, 26), color: pick(['#ff4d6d', '#ff8fab', '#ff2e63']) });
}

// ------------------------------------------------------------------ ngân hàng câu đố
function buildBank() {
  const custom = (Array.isArray(config.cauDoThem) ? config.cauDoThem : [])
    .map((c) => ({ items: Array.isArray(c.hinh) ? c.hinh.filter(Boolean) : String(c.hinh || '').split(/\s+/).filter(Boolean), answer: String(c.dapAn || '').toUpperCase().trim(), level: clamp(Number(c.doKho) || 2, 1, 3), alt: (c.dapAnKhac || []).map((x) => String(x).toUpperCase()), custom: true }))
    .filter((c) => c.items.length && c.answer);
  const builtIn = CAU_DO.map(([h, a, l, alt]) => ({ items: h.split(/\s+/), answer: a, level: l, alt: alt || [] }));
  bank = config.customOnly && custom.length ? custom : [...custom, ...builtIn];
}
const USED_KEY = 'duoiHinhDaDung';
function loadUsed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(USED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
let used = loadUsed();
function pickPuzzle(level) {
  let pool = bank.filter((c) => c.level === level && !used.has(c.answer));
  if (!pool.length) {
    // hết câu ở mức này -> dùng lại từ đầu
    for (const c of bank) if (c.level === level) used.delete(c.answer);
    pool = bank.filter((c) => c.level === level);
  }
  if (!pool.length) pool = bank.filter((c) => !used.has(c.answer));
  if (!pool.length) {
    used.clear();
    pool = bank;
  }
  // câu tự thêm được ưu tiên ra trước
  const custom = pool.filter((c) => c.custom);
  const c = pick(custom.length ? custom : pool);
  used.add(c.answer);
  if (!PREVIEW) {
    try {
      localStorage.setItem(USED_KEY, JSON.stringify([...used].slice(-2000)));
    } catch {}
  }
  return c;
}

// ------------------------------------------------------------------ vòng chơi
function setPhase(name, ms) {
  phase.name = name;
  phase.t0 = now;
  phase.until = now + ms / SPEED;
}

function newQuestion() {
  qIndex++;
  if (qIndex > (Number(config.questionsPerRound) || 10)) {
    endRound();
    return;
  }
  const order = Array.isArray(config.difficultyOrder) && config.difficultyOrder.length ? config.difficultyOrder : DEFAULTS.difficultyOrder;
  const level = clamp(Number(order[(qIndex - 1) % order.length]) || 1, 1, 3);
  const c = pickPuzzle(level);
  const chars = Array.from(c.answer.normalize('NFC'));
  const letters = chars.map((ch, i) => ({ ch, i, space: ch === ' ', shown: false, shownAt: 0 }));
  q = {
    ...c,
    letters,
    keys: [c.answer, ...c.alt].map((a) => compact(a, config.acceptNoAccent !== false)),
    keysExact: [c.answer, ...c.alt].map((a) => compact(a, false)),
    winners: [],
    likes: 0,
    double: doubleNext,
    autoDone: 0,
    firstAt: 0,
    sponsor: null,
  };
  doubleNext = false;
  setPhase('intro', 2200);
  sfx.whoosh();
  announce(line('question', { n: qIndex }), 1);
  sendState();
}

function startAsk() {
  setPhase('ask', (Number(config.questionSeconds) || 40) * 1000);
  q.askAt = now;
  if (pendingHints > 0) {
    const n = pendingHints;
    pendingHints = 0;
    for (let i = 0; i < n; i++) revealLetter(false);
  }
}

function hiddenLetters() {
  return q ? q.letters.filter((l) => !l.space && !l.shown) : [];
}
function maxReveal() {
  const total = q.letters.filter((l) => !l.space).length;
  return Math.max(0, total - Math.max(1, Math.ceil(total * 0.34)));
}
// mở một chữ ngẫu nhiên (để lại ít nhất 1/3 số chữ)
function revealLetter(sound = true) {
  if (!q) return false;
  const shown = q.letters.filter((l) => !l.space && l.shown).length;
  if (shown >= maxReveal()) return false;
  const hidden = hiddenLetters();
  if (!hidden.length) return false;
  // ưu tiên chữ đầu mỗi từ
  const firsts = hidden.filter((l) => l.i === 0 || q.letters[l.i - 1].space);
  const l = pick(firsts.length && Math.random() < 0.6 ? firsts : hidden);
  l.shown = true;
  l.shownAt = now;
  if (sound) sfx.reveal();
  sparks(...letterPos(l.i), 14, '#ffe066');
  return true;
}
function queueHint(n = 1) {
  if (phase.name === 'ask' && q) {
    let ok = false;
    for (let i = 0; i < n; i++) ok = revealLetter() || ok;
    return ok;
  }
  pendingHints += n;
  return true;
}

function pointsFor(rank) {
  const base = Number((config.points || DEFAULTS.points)[q.level]) || 10;
  const f = (config.rankFactor || DEFAULTS.rankFactor);
  const k = f[Math.min(rank, f.length - 1)] ?? 0.4;
  return Math.max(1, Math.round(base * k * (q.double ? 2 : 1)));
}

function tryAnswer(p, text) {
  if (!q || phase.name !== 'ask') return false;
  if (q.winners.some((w) => w.p === p)) return true;
  const raw = compact(text, false);
  const t = compact(text, config.acceptNoAccent !== false);
  if (!t) return false;
  const keys = q.keys;
  let ok = false;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (t === k) ok = true;
    // câu dài có đáp án bên trong ("đàn ông à") vẫn tính
    else if (k.length >= 4 && t.includes(k) && t.length <= k.length + 8) ok = true;
    // gõ có dấu thì phải đúng dấu
    if (ok && config.acceptNoAccent === false && !raw.includes(q.keysExact[i])) ok = false;
    if (ok) break;
  }
  if (!ok) {
    const close = keys.some((k) => k.length >= 5 && editDistance(t, k) === 1);
    addGuess(p, text, close);
    if (close && Math.random() < 0.5) announce(line('almost', { name: p.name }), -1);
    if (close) sfx.almost();
    return false;
  }
  const rank = q.winners.length;
  const pts = pointsFor(rank);
  p.score += pts;
  p.roundScore += pts;
  p.correct++;
  if (!p.firstAt) p.firstAt = now;
  q.winners.push({ p, pts, at: now });
  sfx.correct(rank === 0);
  confetti(540, 980, rank === 0 ? 70 : 20, rank === 0 ? 1 : 0.6);
  if (rank === 0) {
    flash = 0.5;
    q.firstAt = now;
    announce(line('firstCorrect', { name: p.name }), 1);
    const left = phase.until - now;
    const cap = (Number(config.afterFirstSeconds) || 10) * 1000 / SPEED;
    if (left > cap) phase.until = now + cap;
  }
  addToast(`${truncate(p.name, 18)} trả lời đúng +${pts}`, '#7cff9a', '✅');
  sendState();
  return true;
}

function addGuess(p, text, close) {
  const t = String(text || '').trim();
  if (!t || Array.from(t).length > 28) return;
  guesses.unshift({ name: p.name, text: t, close, born: now });
  if (guesses.length > 3) guesses.length = 3;
}

function endQuestion() {
  setPhase('reveal', (Number(config.revealSeconds) || 6) * 1000);
  q.letters.forEach((l, idx) => {
    if (!l.shown) {
      l.shown = true;
      l.shownAt = now + idx * 70;
      l.final = true;
    }
  });
  if (!q.winners.length) {
    sfx.timeUp();
    announce(line('noOne', { answer: q.answer.toLowerCase() }), 1, true);
  } else {
    sfx.fanfare();
    announce(line('answer', { answer: q.answer.toLowerCase(), n: q.winners.length }), 1, true);
  }
  sendState();
}

function endRound() {
  roundTop = top(3, 'roundScore');
  setPhase('roundEnd', (Number(config.roundEndSeconds) || 10) * 1000);
  q = null;
  if (roundTop.length) {
    sfx.fanfare();
    confetti(540, 700, 160, 1.3);
    announce(line('roundEnd', { round, name: roundTop[0].name, n: roundTop[0].roundScore }), 2, true);
  } else announce(line('roundEmpty', { round }), 1, true);
  sendState();
}
function nextRound() {
  round++;
  qIndex = 0;
  for (const p of players.values()) p.roundScore = 0;
  newQuestion();
}

function skipQuestion() {
  if (phase.name === 'ask' || phase.name === 'intro') endQuestion();
  else if (phase.name === 'reveal') newQuestion();
  else if (phase.name === 'roundEnd') nextRound();
}

// ------------------------------------------------------------------ sự kiện TikTok
function handleEvent(ev) {
  if (!ev || !ev.type) return;
  if (ev.type === 'reset') {
    for (const p of players.values()) {
      p.score = 0;
      p.roundScore = 0;
      p.correct = 0;
    }
    addToast('Đã xoá bảng điểm', '#ffd54a', '🧹');
    return;
  }
  if (ev.type === 'skip') return skipQuestion();
  if (ev.type === 'hint') {
    queueHint(1);
    return;
  }
  if (ev.type === 'voiceTest') {
    announce('Xin chào cả nhà, mình là MC đuổi hình bắt chữ', 2, true);
    return;
  }
  if (ev.type === 'simCorrect' || ev.type === 'simAlmost') {
    if (!q || !ev.user) return;
    const p = player(ev.user);
    let text = q.answer.toLowerCase();
    if (ev.type === 'simCorrect' && Math.random() < 0.4) text = compact(q.answer); // gõ không dấu
    if (ev.type === 'simAlmost') {
      const a = Array.from(q.answer.toLowerCase());
      const idx = a.findIndex((ch, i) => ch !== ' ' && i > 0);
      a[idx] = a[idx] === 'a' ? 'o' : 'a';
      text = a.join('');
    }
    tryAnswer(p, text);
    return;
  }
  const p = ev.user ? player(ev.user) : null;
  if (!p) return;
  switch (ev.type) {
    case 'join':
      if (config.voiceJoin !== false) announce(line('join', { name: p.name }), 0);
      else announce(line('join', { name: p.name }), -1);
      break;
    case 'chat':
      if (ev.text) tryAnswer(p, ev.text);
      break;
    case 'like': {
      const n = Math.max(1, Number(ev.count) || 1);
      totalLikes += n;
      hearts(Math.min(4, n));
      if (q && phase.name === 'ask') {
        q.likes += n;
        const per = Math.max(1, Number(config.likesPerHint) || 30);
        while (q.likes >= per) {
          q.likes -= per;
          if (revealLetter()) announce(line('hintLikes'), -1);
        }
      }
      if (totalLikes >= goal) {
        const reached = goal;
        goal += Math.max(100, Number(config.heartGoalStep) || 1000);
        doubleNext = true;
        confetti(940, 280, 80);
        sfx.fanfare();
        addToast(`Đạt ${reached.toLocaleString('vi-VN')} tim! Câu sau x2 điểm`, '#ff8fab', '❤️');
        announce(line('heartGoal', { goal: reached.toLocaleString('vi-VN') }), 2);
      }
      break;
    }
    case 'follow': {
      const n = Number(config.followBonus) || 0;
      p.score += n;
      p.roundScore += n;
      addToast(`${truncate(p.name, 18)} theo dõi +${n}`, '#ffd54a', '⭐');
      announce(line('follow', { name: p.name, n }), 1);
      break;
    }
    case 'share': {
      if (now - p.shareAt < 60000) break;
      p.shareAt = now;
      const n = Number(config.shareBonus) || 0;
      p.score += n;
      p.roundScore += n;
      addToast(`${truncate(p.name, 18)} chia sẻ +${n}`, '#4fc3f7', '📣');
      announce(line('share', { name: p.name, n }), 0);
      break;
    }
    case 'gift':
      onGift(p, ev);
      break;
    default:
      break;
  }
}

function onGift(p, ev) {
  const coins = Number(ev.coins) || (Number(ev.diamonds) || 1) * (Number(ev.repeatCount) || 1);
  const tiers = config.giftTiers || DEFAULTS.giftTiers;
  const gift = ev.giftName || 'quà';
  sfx.sparkle();
  if (coins >= (tiers.big || 100)) {
    const bonus = 10;
    p.score += bonus;
    p.roundScore += bonus;
    const hidden = q && phase.name === 'ask' ? hiddenLetters().length : 3;
    queueHint(Math.max(1, Math.ceil(hidden / 2)));
    if (q && (phase.name === 'ask' || phase.name === 'intro')) q.double = true;
    else doubleNext = true;
    if (q) q.sponsor = p;
    confetti(540, 600, 150, 1.2);
    flash = 0.6;
    shake = 1;
    sfx.fanfare();
    addToast(`${truncate(p.name, 16)} tặng ${gift}: siêu gợi ý, x2 điểm`, '#ffd54a', '🎁');
    announce(line('bigGift', { name: p.name, gift }), 2, true);
  } else if (coins >= (tiers.medium || 10)) {
    const bonus = 5;
    p.score += bonus;
    p.roundScore += bonus;
    queueHint(1);
    if (q) q.sponsor = p;
    confetti(540, 600, 50);
    addToast(`${truncate(p.name, 16)} tặng ${gift} +${bonus}`, '#ffd54a', '🎁');
    announce(line('mediumGift', { name: p.name, gift, n: bonus }), 1);
  } else {
    queueHint(1);
    addToast(`${truncate(p.name, 16)} tặng ${gift}: mở 1 chữ`, '#ffd54a', '🎁');
    announce(line('gift', { name: p.name, gift }), 1);
  }
}

// ------------------------------------------------------------------ cập nhật
function update(dt) {
  if (phase.name === 'intro' && now >= phase.until) startAsk();
  else if (phase.name === 'ask') {
    const total = phase.until - q.askAt;
    const passed = (now - q.askAt) / ((Number(config.questionSeconds) || 40) * 1000 / SPEED);
    const marks = Array.isArray(config.autoHintAt) ? config.autoHintAt : [];
    if (!q.firstAt && q.autoDone < marks.length && passed >= marks[q.autoDone]) {
      q.autoDone++;
      if (revealLetter()) announce(line('hintAuto'), -1);
    }
    const left = Math.ceil((phase.until - now) / 1000 * SPEED);
    if (left <= 5 && left > 0 && left !== q.lastTick) {
      q.lastTick = left;
      sfx.tick(left <= 3);
    }
    if (now >= phase.until || total < 0) endQuestion();
  } else if (phase.name === 'reveal' && now >= phase.until) newQuestion();
  else if (phase.name === 'roundEnd' && now >= phase.until) nextRound();

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    if (now - pt.born > pt.life) {
      particles.splice(i, 1);
      continue;
    }
    pt.vy += pt.g * dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.99;
    pt.rot += pt.vr * dt;
  }
  for (let i = toasts.length - 1; i >= 0; i--) if (now - toasts[i].born > 4200) toasts.splice(i, 1);
  for (let i = guesses.length - 1; i >= 0; i--) if (now - guesses[i].born > 9000) guesses.splice(i, 1);
  flash = Math.max(0, flash - dt * 1.4);
  shake = Math.max(0, shake - dt * 2);
}

// ------------------------------------------------------------------ vẽ
const bg = document.createElement('canvas');
bg.width = W;
bg.height = H;
let bgImage = null;
function drawStatic(g) {
  // nền đêm gameshow: tím than -> xanh đậm, tia sáng, đèn sân khấu
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1b0b3a');
  grad.addColorStop(0.45, '#2a1066');
  grad.addColorStop(1, '#0d0626');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.save();
  g.translate(540, 640);
  for (let i = 0; i < 24; i++) {
    g.rotate(TAU / 24);
    g.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(160,110,255,0.05)';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(-90, -1500);
    g.lineTo(90, -1500);
    g.closePath();
    g.fill();
  }
  g.restore();
  // chấm sáng bokeh
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = rand(2, 9);
    g.fillStyle = `rgba(${pick(['255,213,74', '255,120,200', '120,200,255'])},${rand(0.08, 0.3)})`;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  // sân khấu dưới
  const sy = 1640;
  g.fillStyle = '#3b1478';
  g.beginPath();
  g.ellipse(540, sy + 40, 620, 150, 0, 0, TAU);
  g.fill();
  const sg = g.createLinearGradient(0, sy - 120, 0, sy + 40);
  sg.addColorStop(0, '#ffcf3f');
  sg.addColorStop(1, '#ff8a00');
  g.fillStyle = sg;
  g.beginPath();
  g.ellipse(540, sy, 560, 120, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#ffe58a';
  g.beginPath();
  g.ellipse(540, sy - 18, 520, 98, 0, 0, TAU);
  g.fill();
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    g.fillStyle = i % 2 ? '#fff6c9' : '#ff6fb5';
    g.beginPath();
    g.arc(540 + Math.cos(a) * 540, sy + 10 + Math.sin(a) * 110, 10, 0, TAU);
    g.fill();
  }
}

// vị trí từng ô chữ
let letterLayout = null;
function layoutLetters() {
  if (!q) return null;
  if (letterLayout && letterLayout.q === q) return letterLayout;
  const words = q.answer.split(' ');
  const count = q.letters.filter((l) => !l.space).length;
  // chia 2 dòng khi dài
  let lines = [words];
  if (count > 12 && words.length > 1) {
    let best = null;
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join('').length;
      const b = words.slice(k).join('').length;
      const d = Math.abs(a - b);
      if (!best || d < best.d) best = { k, d };
    }
    lines = [words.slice(0, best.k), words.slice(best.k)];
  }
  const maxLine = Math.max(...lines.map((ws) => ws.join('').length + (ws.length - 1) * 0.45));
  const size = Math.min(86, Math.floor(960 / (maxLine * 1.12)));
  const gap = size * 0.12;
  const pos = new Map();
  let idx = 0;
  const top0 = lines.length > 1 ? 920 : 960;
  lines.forEach((ws, li) => {
    const lineW = ws.join('').length * (size + gap) + (ws.length - 1) * size * 0.45 - gap;
    let x = 540 - lineW / 2;
    const y = top0 + li * (size + 16);
    ws.forEach((w, wi) => {
      for (const ch of Array.from(w)) {
        pos.set(idx, [x + size / 2, y + size / 2]);
        x += size + gap;
        idx++;
      }
      if (wi < ws.length - 1) {
        idx++; // dấu cách
        x += size * 0.45;
      }
    });
    if (li < lines.length - 1) idx++; // dấu cách nối dòng
  });
  letterLayout = { q, pos, size, bottom: top0 + lines.length * (size + 16) };
  return letterLayout;
}
function letterPos(i) {
  const lay = layoutLetters();
  return lay?.pos.get(i) || [540, 1000];
}

const BOARD = { x: 50, y: 385, w: 980, h: 500 };

function drawHeader() {
  // bảng tên game
  ctx.save();
  const tx = 30;
  const ty = 160;
  const tw = 640;
  const th = 110;
  const g = ctx.createLinearGradient(0, ty, 0, ty + th);
  g.addColorStop(0, '#ffe066');
  g.addColorStop(1, '#ff9f1c');
  ctx.fillStyle = '#4a1a8a';
  rr(tx - 6, ty - 6, tw + 12, th + 12, 30);
  ctx.fill();
  ctx.fillStyle = g;
  rr(tx, ty, tw, th, 26);
  ctx.fill();
  ctx.fillStyle = '#3a0f6e';
  const size = fitFont(config.title, 900, 64, tw - 40);
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.title, tx + tw / 2, ty + th / 2 + 3);
  ctx.restore();

  // vòng + câu
  const cx = 750;
  const cy = 215;
  ctx.save();
  ctx.fillStyle = '#4a1a8a';
  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, TAU);
  ctx.fill();
  const rg = ctx.createRadialGradient(cx - 15, cy - 20, 5, cx, cy, 56);
  rg.addColorStop(0, '#fff2a8');
  rg.addColorStop(1, '#ffb300');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a0f6e';
  ctx.textAlign = 'center';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillText('VÒNG', cx, cy - 22);
  ctx.font = `900 48px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(round), cx, cy + 14);
  // câu x/10
  ctx.fillStyle = '#ff3d7f';
  rr(cx - 70, cy + 54, 140, 36, 18);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `800 22px ${FONT}`;
  ctx.fillText(`Câu ${Math.max(1, Math.min(qIndex, config.questionsPerRound))}/${config.questionsPerRound}`, cx, cy + 73);
  ctx.restore();

  // mục tiêu tim
  const hx = 935;
  const hy = 200;
  const prevGoal = goal - Math.max(100, Number(config.heartGoalStep) || 1000);
  const base = Math.max(0, prevGoal);
  const pct = clamp((totalLikes - (totalLikes >= base ? base : 0)) / (goal - base || 1), 0, 1);
  ctx.save();
  heartPath(hx, hy, 72);
  ctx.fillStyle = '#4a1a8a';
  ctx.fill();
  ctx.save();
  heartPath(hx, hy, 64);
  ctx.clip();
  ctx.fillStyle = '#ffd1dc';
  ctx.fillRect(hx - 80, hy - 80, 160, 160);
  ctx.fillStyle = '#ff2e63';
  const fillTop = hy + 62 - 128 * pct;
  ctx.fillRect(hx - 80, fillTop, 160, 200);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#7a0030';
  ctx.lineWidth = 5;
  ctx.font = `900 34px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(`${Math.floor(pct * 100)}%`, hx, hy + 2);
  ctx.fillText(`${Math.floor(pct * 100)}%`, hx, hy + 2);
  ctx.fillStyle = 'rgba(20,5,45,0.85)';
  rr(hx - 115, hy + 66, 230, 36, 18);
  ctx.fill();
  ctx.fillStyle = '#ffd1dc';
  ctx.font = `800 21px ${FONT}`;
  ctx.fillText(`${totalLikes.toLocaleString('vi-VN')} / ${goal.toLocaleString('vi-VN')} tim`, hx, hy + 85);
  ctx.restore();

  // dòng phụ: kiểu câu + độ khó
  if (q) {
    ctx.save();
    const kind = q.items.length === 2 ? 'Hình + Hình' : q.items.length === 3 ? 'Hình + Hình + Hình' : `${q.items.length} hình`;
    ctx.font = `800 26px ${FONT}`;
    const kw = ctx.measureText(kind).width + 40;
    ctx.fillStyle = 'rgba(20,5,45,0.85)';
    rr(60, 296, kw, 46, 23);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(kind, 80, 320);
    const lv = ['', 'Dễ', 'Vừa', 'Khó'][q.level];
    const lx = 60 + kw + 12;
    ctx.fillStyle = ['', '#2ecc71', '#ff9800', '#e53935'][q.level];
    rr(lx, 296, 190, 46, 23);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(lv, lx + 18, 320);
    ctx.fillStyle = '#ffe066';
    ctx.font = `900 26px ${FONT}`;
    ctx.fillText('★'.repeat(q.level) + '☆'.repeat(3 - q.level), lx + 80, 320);
    if (q.double) {
      const dx = lx + 205;
      const pulse = 1 + Math.sin(now / 150) * 0.05;
      ctx.save();
      ctx.translate(dx + 60, 319);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#ff3d7f';
      rr(-60, -23, 120, 46, 23);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('x2 ĐIỂM', 0, 1);
      ctx.restore();
    }
    ctx.restore();
  }
}

function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.05, x - s * 0.75, y - s * 0.95, x, y - s * 0.38);
  ctx.bezierCurveTo(x + s * 0.75, y - s * 0.95, x + s * 1.3, y + s * 0.05, x, y + s * 0.9);
  ctx.closePath();
}

function drawBoard() {
  const { x, y, w, h } = BOARD;
  ctx.save();
  // khung đèn
  ctx.fillStyle = '#ffb300';
  rr(x - 14, y - 14, w + 28, h + 28, 34);
  ctx.fill();
  ctx.fillStyle = '#7a2bd6';
  rr(x - 6, y - 6, w + 12, h + 12, 28);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#fffdf3');
  g.addColorStop(1, '#fff1c9');
  ctx.fillStyle = g;
  rr(x, y, w, h, 24);
  ctx.fill();
  // bóng đèn quanh khung
  const n = 34;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const per = 2 * (w + h);
    let d = t * per;
    let bx;
    let by;
    if (d < w) [bx, by] = [x + d, y - 10];
    else if ((d -= w) < h) [bx, by] = [x + w + 10, y + d];
    else if ((d -= h) < w) [bx, by] = [x + w - d, y + h + 10];
    else [bx, by] = [x - 10, y + h - (d - w)];
    const on = (Math.floor(now / 250) + i) % 3 !== 0;
    ctx.fillStyle = on ? '#fff8d0' : '#d18b00';
    ctx.beginPath();
    ctx.arc(bx, by, 6, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  if (!q) return;
  // hình
  const items = q.items;
  const n2 = items.length;
  const plus = n2 > 1 ? 54 : 0;
  const size = Math.min(330, (w - 60 - plus * (n2 - 1)) / n2);
  const totalW = size * n2 + plus * (n2 - 1);
  let cx = x + w / 2 - totalW / 2 + size / 2;
  const cy = y + h / 2 + 5;
  const appear = phase.name === 'intro' ? ease((now - phase.t0) / 700) : 1;
  items.forEach((it, i) => {
    const k = clamp(appear * 1.4 - i * 0.2, 0, 1);
    const bob = Math.sin(now / 600 + i * 1.7) * 6;
    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.scale(0.4 + 0.6 * ease(k), 0.4 + 0.6 * ease(k));
    // bóng
    ctx.fillStyle = 'rgba(80,40,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.46, size * 0.36, size * 0.07, 0, 0, TAU);
    ctx.fill();
    drawItem(it, 0, 0, size * 0.9, k);
    ctx.restore();
    if (i < n2 - 1) {
      ctx.save();
      ctx.fillStyle = '#ff3d7f';
      ctx.font = `900 ${Math.round(plus * 1.3)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = appear;
      ctx.fillText('+', cx + size / 2 + plus / 2, cy);
      ctx.restore();
    }
    cx += size + plus;
  });

  // nhà tài trợ câu hỏi
  if (q.sponsor) {
    ctx.save();
    const s = `🎁 Câu này do ${truncate(q.sponsor.name, 16)} tài trợ`;
    ctx.font = `800 22px ${FONT}`;
    const sw = ctx.measureText(s).width + 30;
    ctx.fillStyle = 'rgba(122,43,214,0.9)';
    rr(x + w / 2 - sw / 2, y + h - 46, sw, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x + w / 2, y + h - 28);
    ctx.restore();
  }
}

function drawTimer() {
  if (!q) return;
  const x = 975;
  const y = 400;
  const r = 66;
  let left;
  let frac;
  if (phase.name === 'ask') {
    const total = (Number(config.questionSeconds) || 40) * 1000 / SPEED;
    left = Math.max(0, Math.ceil((phase.until - now) / 1000 * SPEED));
    frac = clamp((phase.until - now) / total, 0, 1);
  } else if (phase.name === 'intro') {
    left = Number(config.questionSeconds) || 40;
    frac = 1;
  } else {
    left = 0;
    frac = 0;
  }
  const urgent = phase.name === 'ask' && left <= 10;
  const pulse = urgent ? 1 + Math.sin(now / 90) * 0.04 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#3a0f6e';
  ctx.beginPath();
  ctx.arc(0, 0, r + 10, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, r - 4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#ff3d3d' : '#22c55e';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, r + 1, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
  ctx.stroke();
  ctx.fillStyle = urgent ? '#e11d48' : '#3a0f6e';
  ctx.font = `900 ${left >= 100 ? 46 : 58}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(phase.name === 'reveal' ? '✓' : String(left), 0, 3);
  ctx.restore();
}

function drawLetters() {
  if (!q) return;
  const lay = layoutLetters();
  const s = lay.size;
  for (const l of q.letters) {
    if (l.space) continue;
    const [cx, cy] = lay.pos.get(l.i);
    const show = l.shown && now >= l.shownAt;
    const flip = show ? clamp((now - l.shownAt) / 260, 0, 1) : 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, show ? Math.max(0.02, flip < 0.5 ? 1 - flip * 2 : (flip - 0.5) * 2) : 1);
    const isReveal = phase.name === 'reveal';
    const face = !show || flip < 0.5;
    ctx.fillStyle = '#2b0c5c';
    rr(-s / 2 - 4, -s / 2 - 4, s + 8, s + 8, 16);
    ctx.fill();
    if (face) {
      const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
      g.addColorStop(0, '#5b2bb5');
      g.addColorStop(1, '#3b1584');
      ctx.fillStyle = g;
      rr(-s / 2, -s / 2, s, s, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      const winner = isReveal && q.winners.length;
      const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
      g.addColorStop(0, winner || !isReveal ? '#fff59d' : '#ffcdd2');
      g.addColorStop(1, winner || !isReveal ? '#ffc107' : '#ef9a9a');
      ctx.fillStyle = g;
      rr(-s / 2, -s / 2, s, s, 12);
      ctx.fill();
      ctx.fillStyle = '#3a0f6e';
      ctx.font = `900 ${Math.round(s * 0.66)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l.ch, 0, s * 0.05);
    }
    ctx.restore();
  }
}

function drawMC() {
  // MC: ảnh riêng (mcImage) hoặc thám tử emoji 3D
  const x = 40;
  const y = BOARD.y + BOARD.h - 120;
  const bob = Math.sin(now / 500) * 4;
  if (config.mcImage) drawItem(config.mcImage, x + 60, y + bob, 220);
  else {
    drawItem('🕵️‍♀️', x + 50, y + bob, 150);
  }
  drawItem('🔍', W - 70, BOARD.y + BOARD.h - 30 + Math.sin(now / 400) * 6, 110);
  // dòng MC
  const layBottom = q ? layoutLetters().bottom : 1060;
  const my = Math.max(1068, layBottom + 18);
  const text = mcText || 'Gõ đáp án vào bình luận nhé!';
  ctx.save();
  ctx.font = `700 30px ${FONT}`;
  const tag = config.mcName || 'MC';
  const tagW = ctx.measureText(tag).width + 24;
  const size = fitFont(text, 700, 30, 900 - tagW);
  ctx.font = `700 ${size}px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const bw = tw + tagW + 50;
  const bx = 540 - bw / 2;
  const a = clamp((now - mcTextAt) / 250, 0, 1);
  ctx.globalAlpha = 0.4 + 0.6 * a;
  ctx.fillStyle = 'rgba(20,5,45,0.9)';
  rr(bx, my, bw, 56, 28);
  ctx.fill();
  ctx.strokeStyle = '#ffb300';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffb300';
  rr(bx + 10, my + 10, tagW, 36, 10);
  ctx.fill();
  ctx.fillStyle = '#3a0f6e';
  ctx.font = `900 24px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, bx + 10 + tagW / 2, my + 29);
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(text, bx + tagW + 26, my + 30);
  ctx.restore();
  return my + 56;
}

function drawLeaderboard(y0) {
  const list = top(5);
  const order = [3, 1, 0, 2, 4]; // vị trí trên màn: 4 2 1 3 5
  const xs = [140, 340, 540, 740, 940];
  const y = y0 + 110;
  ctx.save();
  order.forEach((rank, slot) => {
    const p = list[rank];
    const x = xs[slot];
    const r = rank === 0 ? 70 : rank < 3 ? 56 : 48;
    const cy = y - (rank === 0 ? 14 : 0);
    if (!p) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = `800 ${Math.round(r * 0.7)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x, cy + 2);
      return;
    }
    const ring = ['#ffd700', '#cfd8dc', '#ff9e5e', '#b388ff', '#80deea'][rank];
    if (rank === 0) {
      const glow = ctx.createRadialGradient(x, cy, r * 0.6, x, cy, r * 1.6);
      glow.addColorStop(0, 'rgba(255,215,0,0.5)');
      glow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, cy, r * 1.6, 0, TAU);
      ctx.fill();
    }
    drawAvatar(x, cy, r, p, ring);
    if (rank === 0) drawItem('👑', x, cy - r - 22 + Math.sin(now / 300) * 3, 70);
    // số hạng
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(x - r * 0.75, cy - r * 0.75, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2b0c5c';
    ctx.font = `900 22px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(rank + 1), x - r * 0.75, cy - r * 0.75 + 1);
    // điểm
    ctx.fillStyle = '#2b0c5c';
    rr(x - 38, cy + r - 18, 76, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.font = `900 24px ${FONT}`;
    ctx.fillText(String(p.score), x, cy + r - 1);
    // tên
    const name = truncate(p.name, rank === 0 ? 14 : 11);
    const ny = cy + r + 34;
    ctx.font = `800 ${rank === 0 ? 24 : 21}px ${FONT}`;
    const nw = Math.min(190, ctx.measureText(name).width + 24);
    ctx.fillStyle = rank === 0 ? '#ffb300' : 'rgba(255,255,255,0.92)';
    rr(x - nw / 2, ny - 16, nw, 32, 10);
    ctx.fill();
    ctx.fillStyle = '#2b0c5c';
    ctx.fillText(name, x, ny + 1);
  });
  ctx.restore();
  return y + 120;
}

function drawStatus(y0) {
  const y = y0 + 10;
  ctx.save();
  // đã đúng
  const n = q ? q.winners.length : 0;
  ctx.fillStyle = '#16a34a';
  rr(40, y, 170, 64, 32);
  ctx.fill();
  drawItem('✅', 76, y + 32, 44);
  ctx.fillStyle = '#fff';
  ctx.font = `800 19px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Đã đúng', 104, y + 20);
  ctx.font = `900 28px ${FONT}`;
  ctx.fillText(String(n), 104, y + 45);
  // tên người đúng hoặc lời mời
  let msg;
  if (q && q.winners.length) msg = q.winners.slice(0, 4).map((w) => truncate(w.p.name, 12)).join(', ') + (q.winners.length > 4 ? ` và ${q.winners.length - 4} người` : '');
  else if (phase.name === 'reveal') msg = 'Chưa ai đoán ra câu này';
  else if (phase.name === 'roundEnd') msg = 'Vòng mới sắp bắt đầu!';
  else msg = 'Ai sẽ là người đầu tiên?';
  // gợi ý tim (bên phải)
  let right = 1040;
  if (q && phase.name === 'ask') {
    const per = Math.max(1, Number(config.likesPerHint) || 30);
    const t = `❤️ ${q.likes}/${per} tim mở 1 chữ`;
    ctx.font = `800 22px ${FONT}`;
    const tw = ctx.measureText(t).width + 30;
    ctx.fillStyle = 'rgba(255,61,127,0.9)';
    rr(1040 - tw, y + 13, tw, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(t, 1040 - tw / 2, y + 34);
    right = 1040 - tw - 14;
  }
  ctx.textAlign = 'left';
  const ms = fitFont(msg, 800, 28, right - 230);
  ctx.font = `800 ${ms}px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(msg, 230, y + 33);
  // đang chơi
  const playing = `Đang chơi: ${activeCount()}`;
  ctx.font = `800 26px ${FONT}`;
  const pw = ctx.measureText(playing).width + 40;
  ctx.fillStyle = 'rgba(20,5,45,0.85)';
  rr(540 - pw / 2, y + 78, pw, 46, 23);
  ctx.fill();
  ctx.strokeStyle = '#7a2bd6';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(playing, 540, y + 102);
  // đoán gần nhất
  let gy = y + 150;
  for (const gss of guesses) {
    const a = clamp(1 - (now - gss.born - 7000) / 2000, 0, 1);
    ctx.globalAlpha = a;
    const s = `${truncate(gss.name, 12)}: ${gss.text}${gss.close ? '  🔥 gần đúng!' : ''}`;
    ctx.font = `700 22px ${FONT}`;
    const sw = ctx.measureText(s).width + 28;
    ctx.fillStyle = gss.close ? 'rgba(255,152,0,0.85)' : 'rgba(255,255,255,0.15)';
    rr(540 - sw / 2, gy, sw, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(s, 540, gy + 18);
    gy += 40;
  }
  ctx.restore();
}

function drawToasts() {
  let y = BOARD.y + 12;
  for (const t of toasts) {
    const age = now - t.born;
    const a = clamp(age / 200, 0, 1) * clamp((4200 - age) / 400, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `800 25px ${FONT}`;
    const s = `${t.icon} ${t.text}`;
    const w = Math.min(900, ctx.measureText(s).width + 40);
    const x = 540 - w / 2 + (1 - ease(age / 300)) * 200;
    ctx.fillStyle = 'rgba(30,8,70,0.92)';
    rr(x, y, w, 44, 22);
    ctx.fill();
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = t.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x + w / 2, y + 23);
    ctx.restore();
    y += 50;
  }
}

function drawParticles() {
  for (const pt of particles) {
    const a = clamp(1 - (now - pt.born) / pt.life, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(pt.x, pt.y);
    if (pt.kind === 'conf') {
      ctx.rotate(pt.rot);
      ctx.fillStyle = pt.color;
      ctx.fillRect(-pt.s / 2, -pt.s / 4, pt.s, pt.s / 2);
    } else if (pt.kind === 'heart') {
      ctx.fillStyle = pt.color;
      heartPath(0, 0, pt.s);
      ctx.fill();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(0, 0, pt.s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawIntroBanner() {
  if (phase.name !== 'intro') return;
  const t = (now - phase.t0) / ((phase.until - phase.t0) || 1);
  const a = clamp(t * 4, 0, 1) * clamp((1 - t) * 4, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(540, BOARD.y + BOARD.h / 2);
  const s = 0.8 + 0.2 * ease(t * 3);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(58,15,110,0.92)';
  rr(-300, -80, 600, 160, 40);
  ctx.fill();
  ctx.strokeStyle = '#ffb300';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#ffe066';
  ctx.font = `900 90px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`CÂU ${qIndex}`, 0, -4);
  if (q?.double) {
    ctx.fillStyle = '#ff8fab';
    ctx.font = `900 34px ${FONT}`;
    ctx.fillText('NHÂN ĐÔI ĐIỂM', 0, 58);
  }
  ctx.restore();
}

function drawRoundEnd() {
  if (phase.name !== 'roundEnd') return;
  const t = (now - phase.t0) / 600;
  const a = clamp(t, 0, 1);
  const { x, y, w, h } = BOARD;
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#4b1ca0');
  g.addColorStop(1, '#2a0d63');
  ctx.fillStyle = g;
  rr(x, y, w, h, 24);
  ctx.fill();
  ctx.fillStyle = '#ffe066';
  ctx.font = `900 50px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`TỔNG KẾT VÒNG ${round}`, 540, y + 56);
  if (!roundTop.length) {
    ctx.fillStyle = '#fff';
    ctx.font = `700 34px ${FONT}`;
    ctx.fillText('Vòng sau gõ đáp án vào bình luận nhé!', 540, y + h / 2);
    drawItem('❓', 540, y + h / 2 + 110, 120);
  } else {
    // bục 2 - 1 - 3
    drawItem('🏆', 540 - 260, y + 56, 64);
    drawItem('🏆', 540 + 260, y + 56, 64);
    const slots = [[1, 300, 120], [0, 540, 165], [2, 780, 95]];
    for (const [rank, px, ph] of slots) {
      const p = roundTop[rank];
      const baseY = y + h - 16;
      const rise = ease((now - phase.t0 - rank * 250) / 700);
      const hh = ph * rise;
      const cols = ['#ffc107', '#b0bec5', '#ff8a50'];
      ctx.fillStyle = cols[rank];
      rr(px - 105, baseY - hh, 210, hh, 14);
      ctx.fill();
      if (!p) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.font = `900 56px ${FONT}`;
        if (hh > 50) ctx.fillText(String(rank + 1), px, baseY - hh / 2 + 4);
        continue;
      }
      ctx.fillStyle = '#2b0c5c';
      ctx.font = `800 24px ${FONT}`;
      ctx.fillText(truncate(p.name, 13), px, baseY - hh + 30);
      ctx.font = `900 26px ${FONT}`;
      ctx.fillText(`${p.roundScore} điểm`, px, baseY - hh + 62);
      const r = rank === 0 ? 58 : 48;
      const ay = baseY - hh - r - 8;
      drawAvatar(px, ay, r, p, cols[rank]);
      drawItem(['🥇', '🥈', '🥉'][rank], px + r * 0.85, ay + r * 0.6, 50);
      if (rank === 0) drawItem('👑', px, ay - r - 18 + Math.sin(now / 300) * 3, 60);
    }
  }
  ctx.restore();
  if (Math.random() < 0.08) confetti(rand(100, 980), BOARD.y, 6, 0.5);
}

function drawGuide() {
  // hướng dẫn ngắn dưới cùng (phần trên khung bình luận TikTok)
  const items = ['💬 Gõ đáp án', `❤️ ${config.likesPerHint} tim = 1 chữ`, '🎁 Quà = gợi ý', '⭐ Theo dõi +điểm'];
  ctx.save();
  ctx.font = `800 22px ${FONT}`;
  const widths = items.map((s) => ctx.measureText(s).width + 26);
  const total = widths.reduce((a, b) => a + b, 0) + 10 * (items.length - 1);
  let x = 540 - total / 2;
  const y = 108;
  items.forEach((s, i) => {
    ctx.fillStyle = 'rgba(20,5,45,0.75)';
    rr(x, y, widths[i], 38, 19);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x + widths[i] / 2, y + 20);
    x += widths[i] + 10;
  });
  ctx.restore();
}

let lastFrame = performance.now();
let audioBlocked = false;
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastFrame) / 1000) * SPEED;
  lastFrame = ts;
  now = ts;
  update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (bgImage) ctx.drawImage(bgImage, 0, 0, W, H);
  else ctx.drawImage(bg, 0, 0);
  if (shake > 0) ctx.translate(rand(-8, 8) * shake, rand(-8, 8) * shake);
  drawGuide();
  drawHeader();
  drawBoard();
  drawRoundEnd();
  drawTimer();
  drawIntroBanner();
  if (phase.name !== 'roundEnd') drawLetters();
  const y1 = drawMC();
  const y2 = drawLeaderboard(y1);
  drawStatus(y2);
  drawParticles();
  if (phase.name !== 'roundEnd') drawToasts();
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,250,220,${flash * 0.4})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (audioBlocked && !PREVIEW) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(W / 2 - 250, 1500, 500, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔇 Bấm vào game để bật tiếng', W / 2, 1529);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ kết nối
let ws = null;
function sendState() {
  // gửi đáp án hiện tại cho bảng điều khiển (chỉ cửa sổ game chính, không phải khung xem trước)
  if (PREVIEW || !ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify({ cmd: 'gameState', state: { round, q: qIndex, answer: q?.answer || '', phase: phase.name, winners: q ? q.winners.length : 0 } }));
}
function connectWs() {
  if (location.protocol === 'file:') return;
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onopen = () => sendState();
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'status' || msg.type === 'log' || msg.type === 'gameState') return;
      if (msg.type === 'askState') {
        sendState();
        return;
      }
      handleEvent(msg);
    } catch (err) {
      console.warn(err);
    }
  };
  ws.onclose = () => setTimeout(connectWs, 2000);
}

async function boot() {
  try {
    const res = await fetch('/duoi-hinh-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  config.questionsPerRound = Math.max(1, Number(config.questionsPerRound) || 10);
  goal = Math.max(50, Number(config.heartGoal) || 1000);
  buildBank();
  drawStatic(bg.getContext('2d'));
  // tải trước hình giao diện + hình câu đố
  for (const g of HINH_GIAO_DIEN) getImage(g);
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
    const r = await fetch('/duoi-hinh-music.json', { cache: 'no-store' });
    if (r.ok) files = [...(await r.json()), ...files];
  } catch {
    /* không có máy chủ */
  }
  const startMusic = () => {
    if (config.sound === false) return;
    sfx.startMusic({ files, volume: config.music === false ? 0 : Number(config.musicVolume ?? 0.22) });
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
    const gap = Math.max(15, Number(config.narrationSeconds) || 50) * 1000;
    setInterval(() => {
      if (performance.now() - lastAnnounce > gap && phase.name === 'ask') announce(line('reminder'), 0);
    }, 3000);
  }
  qIndex = 0;
  newQuestion();
  connectWs();
  requestAnimationFrame(frame);
}

window.__duoiHinh = { handleEvent, config: () => config, state: () => ({ round, qIndex, phase: phase.name, answer: q?.answer, winners: q?.winners.length, players: players.size, bank: bank.length }), skip: skipQuestion };
boot();
