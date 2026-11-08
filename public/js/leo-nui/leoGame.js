// Game TikTok LIVE "Leo núi Everest": mỗi người xem là một nhà leo núi xuất phát từ trạm gốc 5.364 m,
// đua lên đỉnh 8.849 m. Thả tim, bình luận = leo lên; quà = tăng tốc nhân 1,5 / 2 / 3, quà lớn gọi trực thăng.
// Thời tiết đổi liên tục (bão tuyết, tuyết lở). Ai lên đỉnh đầu tiên thắng vòng, tên vào Bảng vàng.
import {
  W, H, TAU, BASE_ALT, SUMMIT_ALT, CAMPS, SUITS, hash, trailX, faceEdges, makeView, roundRectPath as rr,
  drawSkyLayer, drawSlope, drawTrail, drawMarkers, drawCamps, drawSummit, drawClimber, drawHelicopter, flag,
} from './art.js';
import * as sfx from './leoAudio.js';
import * as voice from '../audio.js';

const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const FONT = '"Segoe UI", system-ui, sans-serif';
const SPEED = clamp(Number(params.get('speed')) || 1, 0.25, 8);
const fmt = (n) => Math.round(n).toLocaleString('vi-VN');

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'LEO NÚI EVEREST',
  guideName: 'Hướng dẫn viên',
  likeMeters: 2,
  chatMeters: 5,
  chatCooldownSeconds: 5,
  followMeters: 40,
  shareMeters: 60,
  joinCreatesClimber: true,
  autoClimb: 0.6,
  activeSeconds: 45,
  metersPerCoin: 3,
  maxGiftMeters: 1500,
  giftTiers: [
    { min: 1, mult: 1.5, seconds: 20, meters: 40 },
    { min: 10, mult: 2, seconds: 30, meters: 120 },
    { min: 100, mult: 3, seconds: 45, meters: 400, helicopter: true },
  ],
  weather: true,
  weatherSeconds: 60,
  stormSeconds: 25,
  stormLikeFactor: 0.5,
  stormCheerMeters: 15,
  cheerWords: ['co len', 'leo', 'leo len', 'len', 'go', 'di', 'tien len', 'quyet tam'],
  avalanche: true,
  avalancheIdleSeconds: 30,
  celebrateSeconds: 14,
  zoom: 3.2,
  maxClimbers: 400,
  maxVisible: 70,
  labelCount: 12,
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.3,
  voice: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-NamMinhNeural',
  voiceGapSeconds: 6,
  voiceJoin: true,
  narration: true,
  narrationSeconds: 40,
  messages: {
    welcome: ['Chào {name}, chào mừng tới trạm gốc Everest. Thả tim để bắt đầu leo nhé', '{name} đã gia nhập đoàn leo núi. Thả tim để leo nhanh hơn nha', 'Chào {name}, mặc áo ấm vào, mình cùng chinh phục đỉnh Everest nào'],
    thanks: ['Cảm ơn {name} đã tặng {gift}. Tăng tốc nhân {mult} trong {sec} giây', 'Cảm ơn {name} nhé, {gift} giúp bạn leo nhanh gấp {mult} lần', '{name} tặng {gift}, bay lên {meters} mét. Cảm ơn bạn'],
    helicopter: ['Wow! {name} gọi trực thăng cứu hộ, bay vọt lên {meters} mét. Cảm ơn bạn rất nhiều', 'Trực thăng đã tới đón {name}! Cảm ơn {gift} của bạn'],
    follow: ['Cảm ơn {name} đã theo dõi kênh, tặng bạn thêm {meters} mét', 'Cảm ơn {name} đã follow nhé'],
    share: ['Cảm ơn {name} đã chia sẻ phòng live, cộng ngay {meters} mét'],
    camp: ['{name} là người đầu tiên tới {camp}, độ cao {alt} mét', 'Tuyệt vời, {name} đã tới {camp}'],
    leader: ['{name} đang dẫn đầu ở độ cao {alt} mét. Ai đuổi kịp không nào', 'Dẫn đầu lúc này là {name}, cách đỉnh còn {left} mét'],
    storm: ['Bão tuyết đang tới! Cả đoàn gõ cố lên để giữ sức nhé', 'Bão tuyết! Thả tim chỉ được nửa sức, gõ cố lên để leo tiếp'],
    stormEnd: ['Bão tuyết đã qua, trời quang rồi. Leo tiếp nào'],
    avalanche: ['Tuyết lở! Ai đứng yên lâu sẽ bị trượt xuống. Thả tim để bám chặt dây nhé', 'Cẩn thận tuyết lở! Mọi người bám chắc dây'],
    summit: ['Chúc mừng {name} đã chinh phục đỉnh Everest 8849 mét!', 'Tuyệt vời! {name} đã cắm cờ trên nóc nhà thế giới'],
    round: ['Vòng leo mới bắt đầu! Tất cả trở về trạm gốc. Thả tim để leo nào'],
    reminder: [
      'Thả tim để leo nhanh hơn. Mỗi tim là một bước chân lên đỉnh',
      'Tặng quà để tăng tốc nhân 1 phẩy 5, quà lớn được trực thăng chở lên',
      'Ai lên đỉnh 8849 mét đầu tiên sẽ thắng vòng này và được ghi tên vào bảng vàng',
      'Gõ bình luận bất kỳ để có nhà leo núi của riêng mình nhé',
      'Theo dõi kênh được cộng 40 mét, chia sẻ phòng live được cộng 60 mét',
    ],
  },
};
let config = structuredClone(DEFAULTS);
const lastLine = {};
function line(kind, vars = {}) {
  const list = config.messages[kind] || DEFAULTS.messages[kind] || [''];
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastLine[kind]) i = (i + 1) % list.length;
  lastLine[kind] = i;
  return list[i].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
function norm(s) {
  return ` ${String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}
const isCheer = (text) => {
  const n = norm(text);
  return (config.cheerWords || []).some((w) => n.includes(` ${w} `));
};

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
const skyCanvas = { clear: document.createElement('canvas'), storm: document.createElement('canvas') };
const IMG = { bg: null, bgStorm: null, climbers: [], tent: null, summit: null, heli: null };

function truncate(s, n) {
  const a = Array.from(String(s || ''));
  return a.length > n ? `${a.slice(0, n - 1).join('')}…` : a.join('');
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
    if (avatarCache.size > 500) avatarCache.delete(avatarCache.keys().next().value);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}
function drawAvatar(x, y, r, user, color, ring = '#fff', ringW = 3) {
  const img = getAvatar(user.avatar);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  if (img) {
    ctx.save();
    ctx.clip();
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(r * 1.05)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Array.from(user.name || '?')[0].toUpperCase(), x, y + 1);
  }
  ctx.lineWidth = ringW;
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ trạng thái
let now = 0;
let gameTime = 0;
const climbers = new Map();
let round = 1;
let totalHearts = 0;
let viewers = 0;
let liveUser = '';
let winnerName = '';
let celebrate = null; // { until, climber }
let lastVoice = -1e9;
let lastAnnounce = 0;
let lastLeaderTalk = 0;
const campFirst = new Set();
const floats = [];
const particles = [];
const banners = []; // cảm ơn quà
const toasts = [];
let hall = {};
try {
  hall = JSON.parse(localStorage.getItem('leoNuiHall') || '{}') || {};
} catch {
  hall = {};
}

// thời tiết
const WEATHERS = {
  clear: { name: 'Nắng đẹp', icon: 'sun', temp: 6 },
  cloud: { name: 'Nhiều mây', icon: 'cloud', temp: 0 },
  snow: { name: 'Tuyết rơi', icon: 'snow', temp: -5 },
  storm: { name: 'Bão tuyết', icon: 'storm', temp: -14 },
};
const WEATHER_CYCLE = ['clear', 'cloud', 'snow', 'storm', 'snow', 'cloud'];
let weatherIdx = 0;
let weather = 'clear';
let weatherUntil = 0;
let avalanche = null; // { start, hits }
let nextAvalanche = 0;

// camera
let camAlt = BASE_ALT + 120;
let tourStart = 0;
let focus = null; // { id, until, prio }
const CAM_Y = 1060;
const CLIMBER_SCALE = 1.3;

function say(text, priority = 1) {
  if (!text) return;
  const gap = Math.max(2, Number(config.voiceGapSeconds) || 6) * 1000;
  if (priority < 2 && now - lastVoice < gap) return;
  lastVoice = now;
  voice.speak(text, priority);
}

function suitFor(id) {
  // FNV-1a + trộn bit để id gần giống nhau vẫn ra vị trí, màu áo khác nhau
  let h = 2166136261;
  for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
}

function getClimber(user, create = true) {
  if (!user?.id) return null;
  let c = climbers.get(user.id);
  if (c) {
    if (user.avatar) c.user.avatar = user.avatar;
    if (user.name) c.user.name = user.name;
    return c;
  }
  if (!create) return null;
  if (climbers.size >= config.maxClimbers) {
    // bỏ người lâu không tương tác nhất
    let worst = null;
    for (const x of climbers.values()) if (!worst || x.lastActive < worst.lastActive) worst = x;
    if (worst) climbers.delete(worst.id);
  }
  const h = suitFor(user.id);
  c = {
    id: user.id,
    user: { ...user },
    suitIdx: h % SUITS.length,
    lane: ((h >> 3) % 1000) / 1000 * 2 - 1,
    depth: ((h >> 13) % 1000) / 1000,
    alt: BASE_ALT,
    target: BASE_ALT,
    safeAlt: BASE_ALT,
    boostMult: 1,
    boostUntil: 0,
    boostTotal: 0,
    heli: null,
    lastActive: now,
    lastChat: -1e9,
    phase: Math.random() * TAU,
    speed: 0,
    likes: 0,
    coins: 0,
    slip: 0,
    joinedAt: now,
  };
  climbers.set(user.id, c);
  return c;
}

const activeMult = (c) => (now < c.boostUntil ? c.boostMult : 1);

// cộng mét cho một người (đã nhân tăng tốc + thời tiết)
function gain(c, meters, kind = '') {
  if (!c || celebrate) return 0;
  let m = meters * activeMult(c);
  if (weather === 'storm' && kind === 'like') m *= Number(config.stormLikeFactor ?? 0.5);
  if (weather === 'clear' && kind === 'like') m *= 1.2;
  c.target = Math.min(SUMMIT_ALT, c.target + m);
  c.lastActive = now;
  return m;
}

function addFloat(c, text, color = '#fff', kind = 'text') {
  if (floats.length > 60) floats.shift();
  floats.push({ id: c.id, text, color, kind, t0: now, dx: rand(-30, 30) });
}

function setFocus(c, ms, prio) {
  if (!c) return;
  if (focus && now < focus.until && focus.prio > prio && climbers.has(focus.id)) return;
  focus = { id: c.id, until: now + ms, prio, since: now };
}

function addBanner(c, gift, tier, meters) {
  banners.unshift({ id: c.id, user: c.user, gift, mult: tier.mult, until: c.boostUntil, total: tier.seconds * 1000, meters, t0: now });
  if (banners.length > 4) banners.length = 4;
}
function toast(text, color = '#ffd34d', ms = 3500) {
  toasts.push({ text, color, t0: now, until: now + ms });
  if (toasts.length > 3) toasts.shift();
}

function tierFor(coins) {
  const tiers = [...(config.giftTiers || DEFAULTS.giftTiers)].sort((a, b) => a.min - b.min);
  let t = tiers[0];
  for (const x of tiers) if (coins >= x.min) t = x;
  return t;
}

// ------------------------------------------------------------------ sự kiện TikTok
function handleEvent(ev) {
  if (!ev || !ev.type) return;
  switch (ev.type) {
    case 'status':
      viewers = Number(ev.status?.viewers) || viewers;
      if (ev.status?.username) liveUser = ev.status.username;
      return;
    case 'reset':
      climbers.clear();
      banners.length = 0;
      newRound(false);
      return;
    case 'voiceTest':
      say(`Xin chào, tôi là ${config.guideName} của đoàn leo núi Everest`, 2);
      return;
    case 'weather':
      setWeather(ev.weather || 'storm');
      return;
    case 'avalanche':
      startAvalanche();
      return;
    case 'summitTest': {
      const c = topClimbers(1)[0];
      if (c) {
        c.target = SUMMIT_ALT;
        c.lastActive = now;
      }
      return;
    }
  }
  const user = ev.user;
  if (!user?.id) return;
  switch (ev.type) {
    case 'join': {
      if (!config.joinCreatesClimber) return;
      const isNew = !climbers.has(user.id);
      const c = getClimber(user);
      if (isNew) {
        c.lastActive = now - config.activeSeconds * 1000 + 8000;
        setFocus(c, 2500, 1);
        if (config.voiceJoin) say(line('welcome', { name: user.name }), 0);
      }
      return;
    }
    case 'chat': {
      const c = getClimber(user);
      const cheer = isCheer(ev.text);
      if (now - c.lastChat > config.chatCooldownSeconds * 1000) {
        c.lastChat = now;
        const m = gain(c, weather === 'storm' && cheer ? config.stormCheerMeters : config.chatMeters, 'chat');
        if (m) addFloat(c, `+${fmt(m)} m`, cheer ? '#ffd34d' : '#bfe3ff');
      } else c.lastActive = now;
      setFocus(c, 3000, 0.5);
      return;
    }
    case 'like': {
      const c = getClimber(user);
      const n = Math.max(1, Number(ev.count) || 1);
      totalHearts += n;
      c.likes += n;
      const m = gain(c, n * config.likeMeters, 'like');
      addFloat(c, `+${n}`, '#ff4d6d', 'heart');
      if (m) sfx.pop();
      if (!focus || now > focus.until) setFocus(c, 3500, 0.5);
      return;
    }
    case 'follow': {
      const c = getClimber(user);
      const m = gain(c, config.followMeters, 'follow');
      addFloat(c, `+${fmt(m)} m ⭐`, '#ffd34d');
      setFocus(c, 4000, 2);
      say(line('follow', { name: user.name, meters: Math.round(m) }), 1);
      toast(`⭐ ${truncate(user.name, 16)} theo dõi kênh · +${fmt(m)} m`);
      return;
    }
    case 'share': {
      const c = getClimber(user);
      const m = gain(c, config.shareMeters, 'share');
      addFloat(c, `+${fmt(m)} m 📣`, '#9be7ff');
      setFocus(c, 4000, 2);
      say(line('share', { name: user.name, meters: Math.round(m) }), 1);
      toast(`📣 ${truncate(user.name, 16)} chia sẻ live · +${fmt(m)} m`, '#9be7ff');
      return;
    }
    case 'gift': {
      const c = getClimber(user);
      const coins = Math.max(1, Number(ev.coins) || Number(ev.diamonds) * (Number(ev.repeatCount) || 1) || 1);
      c.coins += coins;
      const tier = tierFor(coins);
      // tăng tốc: giữ hệ số cao nhất, cộng dồn thời gian
      const remain = Math.max(0, c.boostUntil - now);
      c.boostMult = Math.max(now < c.boostUntil ? c.boostMult : 1, tier.mult);
      c.boostUntil = now + Math.min(180000, remain + tier.seconds * 1000);
      c.boostTotal = c.boostUntil - now;
      const meters = Math.min(config.maxGiftMeters, tier.meters + coins * config.metersPerCoin);
      if (celebrate) return;
      const before = c.target;
      if (tier.helicopter) {
        c.target = Math.min(SUMMIT_ALT, c.target + meters);
        c.heli = { start: now, from: c.alt, to: c.target, dur: 4500 };
        c.lastActive = now;
        sfx.helicopter(5);
        say(line('helicopter', { name: user.name, gift: ev.giftName || 'quà', meters: Math.round(c.target - before) }), 2);
        setFocus(c, 9000, 3);
      } else {
        c.target = Math.min(SUMMIT_ALT, c.target + meters);
        c.lastActive = now;
        say(line('thanks', { name: user.name, gift: ev.giftName || 'quà', mult: String(tier.mult).replace('.', ' phẩy '), sec: tier.seconds, meters: Math.round(c.target - before) }), coins >= 10 ? 2 : 1);
        setFocus(c, 7000, 3);
      }
      sfx.boost(tier.helicopter ? 3 : tier.mult >= 2 ? 2 : 1);
      addFloat(c, `+${fmt(c.target - before)} m`, '#ffd34d');
      addBanner(c, ev.giftName || 'Quà', tier, c.target - before);
      for (let i = 0; i < (tier.helicopter ? 50 : 20); i++) spawnSpark(c, tier.helicopter ? '#ffd34d' : pick(['#ffd34d', '#ff8a65', '#fff']));
      return;
    }
  }
}

function spawnSpark(c, color) {
  if (particles.length > 400) return;
  particles.push({ id: c.id, x: rand(-40, 40), y: rand(-130, -20), vx: rand(-260, 260), vy: rand(-420, -80), life: rand(0.6, 1.3), t: 0, color, size: rand(4, 9) });
}

// ------------------------------------------------------------------ thời tiết, tuyết lở, vòng chơi
function setWeather(w) {
  const prev = weather;
  weather = w;
  const dur = w === 'storm' ? config.stormSeconds : config.weatherSeconds;
  weatherUntil = now + dur * 1000 / 1;
  sfx.setWind(w === 'storm' ? 2 : w === 'clear' ? 0 : 1);
  if (w === 'storm') {
    say(line('storm'), 2);
    toast('❄️ BÃO TUYẾT! Gõ "cố lên" để giữ sức', '#bfe3ff', 5000);
  } else if (prev === 'storm') {
    say(line('stormEnd'), 1);
    // tuyết lở hay xảy ra sau bão
    if (config.avalanche && Math.random() < 0.6) nextAvalanche = now + rand(6000, 14000);
  }
}
function updateWeather() {
  if (!config.weather) return;
  if (now < weatherUntil) return;
  weatherIdx = (weatherIdx + 1) % WEATHER_CYCLE.length;
  let w = WEATHER_CYCLE[weatherIdx];
  // không có ai leo thì bỏ qua bão
  if (w === 'storm' && activeCount() === 0) w = 'snow';
  setWeather(w);
}

function startAvalanche() {
  const idle = config.avalancheIdleSeconds * 1000;
  const hits = [];
  for (const c of climbers.values()) {
    if (c.alt < CAMPS[1].alt || now - c.lastActive < idle || c.heli) continue;
    // trượt xuống nhưng không thấp hơn trại an toàn gần nhất
    const drop = rand(40, 120);
    const to = Math.max(c.safeAlt, c.target - drop);
    if (c.target - to < 5) continue;
    c.target = to;
    c.slip = now;
    hits.push(c);
  }
  avalanche = { start: now, hits: hits.length };
  sfx.rumble();
  say(line('avalanche'), 2);
  toast(hits.length ? `⚠️ TUYẾT LỞ! ${hits.length} người trượt xuống` : '⚠️ TUYẾT LỞ! May quá, cả đoàn bám chắc dây', '#ff8a65', 5000);
}

function activeCount() {
  let n = 0;
  for (const c of climbers.values()) if (now - c.lastActive < config.activeSeconds * 1000) n++;
  return n;
}

function topClimbers(n) {
  return [...climbers.values()].sort((a, b) => b.alt - a.alt || a.joinedAt - b.joinedAt).slice(0, n);
}

function campName(alt) {
  return CAMPS.find((c) => c.alt === alt)?.short || '';
}

function reachSummit(c) {
  celebrate = { until: now + config.celebrateSeconds * 1000, climber: c, t0: now };
  winnerName = c.user.name;
  hall[c.user.name] = (hall[c.user.name] || 0) + 1;
  try {
    localStorage.setItem('leoNuiHall', JSON.stringify(hall));
  } catch {
    /* bỏ qua */
  }
  sfx.fanfare();
  say(line('summit', { name: c.user.name }), 3);
  focus = { id: c.id, until: celebrate.until, prio: 9 };
  banners.length = 0;
}

function newRound(announce = true) {
  celebrate = null;
  round++;
  campFirst.clear();
  for (const c of climbers.values()) {
    c.alt = BASE_ALT;
    c.target = BASE_ALT;
    c.safeAlt = BASE_ALT;
    c.heli = null;
    c.boostUntil = 0;
  }
  focus = null;
  camAlt = BASE_ALT + 120;
  tourStart = gameTime;
  if (announce) {
    say(line('round'), 2);
    toast(`🚩 VÒNG ${round} BẮT ĐẦU!`, '#ffd34d', 4000);
  }
}

// ------------------------------------------------------------------ cập nhật mỗi khung hình
function update(dt) {
  updateWeather();
  if (config.avalanche && nextAvalanche && now > nextAvalanche) {
    nextAvalanche = 0;
    startAvalanche();
  }
  if (avalanche && now - avalanche.start > 4500) avalanche = null;
  if (celebrate) {
    if (now > celebrate.until) newRound(true);
  }
  const activeMs = config.activeSeconds * 1000;
  for (const c of climbers.values()) {
    if (!celebrate && now - c.lastActive < activeMs && c.target < SUMMIT_ALT) c.target = Math.min(SUMMIT_ALT, c.target + config.autoClimb * activeMult(c) * dt);
    if (c.heli) {
      const k = clamp((now - c.heli.start) / c.heli.dur, 0, 1);
      const e = k < 0.25 ? 0 : (k - 0.25) / 0.6;
      const ee = clamp(e, 0, 1);
      c.alt = c.heli.from + (c.heli.to - c.heli.from) * (ee * ee * (3 - 2 * ee));
      c.speed = 0;
      if (k >= 1) {
        c.alt = c.heli.to;
        c.heli = null;
      }
    } else if (c.target > c.alt) {
      const diff = c.target - c.alt;
      const sp = Math.min(60, 3 + diff * 1.4);
      c.alt = Math.min(c.target, c.alt + sp * dt);
      c.speed = sp;
      c.phase += dt * (5 + Math.min(sp, 30) * 0.35);
    } else if (c.target < c.alt) {
      // trượt xuống (tuyết lở)
      c.alt = Math.max(c.target, c.alt - 90 * dt);
      c.speed = 0;
    } else c.speed = 0;
    // qua trại
    for (const camp of CAMPS) {
      if (camp.alt <= c.safeAlt || c.alt < camp.alt) continue;
      c.safeAlt = camp.alt;
      if (camp.alt === SUMMIT_ALT) {
        if (!celebrate) reachSummit(c);
        continue;
      }
      const first = !campFirst.has(camp.alt);
      campFirst.add(camp.alt);
      sfx.camp();
      if (first || (focus && focus.id === c.id)) toast(`⛺ ${truncate(c.user.name, 16)} tới ${camp.short} · ${fmt(camp.alt)} m`, '#9be7a0');
      if (first) say(line('camp', { name: c.user.name, camp: camp.short, alt: camp.alt }), 1);
    }
  }
  // tiếng bước chân khi người đang được quay di chuyển
  const fc = focus && climbers.get(focus.id);
  if (fc && fc.speed > 2 && Math.random() < dt * 4) sfx.crunch();
  updateCamera(dt);
  // hiệu ứng
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 600 * dt;
    if (p.t > p.life) particles.splice(i, 1);
  }
  for (let i = floats.length - 1; i >= 0; i--) if (now - floats[i].t0 > 1600) floats.splice(i, 1);
  for (let i = banners.length - 1; i >= 0; i--) if (now > banners[i].until + 1500 || !climbers.has(banners[i].id)) banners.splice(i, 1);
  for (let i = toasts.length - 1; i >= 0; i--) if (now > toasts[i].until) toasts.splice(i, 1);
  if (celebrate && Math.random() < dt * 6) fireworkBurst();
  updateSnow(dt);
  // lời dẫn khi vắng
  if (config.narration !== false && now - lastAnnounce > Math.max(15, config.narrationSeconds) * 1000 && now - lastVoice > 8000) {
    lastAnnounce = now;
    const lead = topClimbers(1)[0];
    if (lead && lead.alt > BASE_ALT + 50 && now - lastLeaderTalk > 90000) {
      lastLeaderTalk = now;
      say(line('leader', { name: lead.user.name, alt: Math.round(lead.alt), left: Math.round(SUMMIT_ALT - lead.alt) }), 0);
    } else say(line('reminder'), 0);
  }
}

function updateCamera(dt) {
  let target;
  if (celebrate) target = SUMMIT_ALT + 75;
  else {
    let c = focus && climbers.get(focus.id);
    if (!c || now > focus.until) {
      // giữ ít nhất 4 giây rồi chuyển sang người vừa tương tác gần nhất
      const hold = focus && now - (focus.since || 0) < 4000 && c;
      if (!hold) {
        let best = null;
        // người đang leo (còn mét chưa đi hết) được ưu tiên như vừa tương tác
        const score = (x) => (x.target - x.alt > 3 ? now : x.lastActive);
        for (const x of climbers.values()) if (!best || score(x) > score(best)) best = x;
        if (best && now - score(best) < 20000) {
          focus = { id: best.id, until: now + 4000, prio: 0, since: now };
          c = best;
        } else {
          focus = null;
          c = null;
        }
      }
    }
    if (c) target = c.alt + 40;
    else {
      // không ai tương tác: camera chậm rãi lướt từ trạm gốc lên đỉnh rồi xuống
      const k = 0.5 - 0.5 * Math.cos((gameTime - tourStart) / 38);
      target = BASE_ALT + 120 + (SUMMIT_ALT - BASE_ALT - 160) * k;
    }
  }
  const view = H / config.zoom;
  if (!celebrate) target = clamp(target, BASE_ALT + 40, SUMMIT_ALT - view * 0.15);
  const diff = target - camAlt;
  const k = 2.2 + Math.min(8, Math.abs(diff) / 80);
  camAlt += diff * Math.min(1, dt * k);
}

// tuyết rơi
const flakes = Array.from({ length: 220 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: rand(1.5, 4.5), s: rand(0.5, 1.2) }));
function updateSnow(dt) {
  const storm = weather === 'storm';
  const fall = storm ? 520 : weather === 'snow' ? 140 : 60;
  const wind = storm ? -900 : -40;
  for (const f of flakes) {
    f.y += fall * f.s * dt;
    f.x += (wind * f.s + Math.sin(gameTime * 1.3 + f.r * 7) * 30) * dt;
    if (f.y > H) f.y -= H;
    if (f.x < 0) f.x += W;
    if (f.x > W) f.x -= W;
  }
}

const fireworks = [];
function fireworkBurst() {
  const x = rand(150, W - 150);
  const y = rand(500, 1100);
  const col = pick(['#ffd34d', '#ff5370', '#7cf3ff', '#a6ff7c', '#ffffff', '#ff9f43']);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    const sp = rand(200, 420);
    fireworks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: rand(0.9, 1.5), col });
  }
  if (fireworks.length > 600) fireworks.splice(0, fireworks.length - 600);
}

// ------------------------------------------------------------------ vẽ
function climberPos(c, v) {
  const a = c.alt - c.depth * 14;
  const [l, r] = faceEdges(a);
  const x = clamp(trailX(a) + c.lane * 120, l + 55, r - 55);
  return [x, v.y(a)];
}

function drawWorld(v, t) {
  // trời + núi xa (lệch nhẹ theo độ cao cho có chiều sâu)
  const storm = weather === 'storm';
  const sky = storm ? (IMG.bgStorm || IMG.bg) : IMG.bg;
  const par = ((camAlt - BASE_ALT) / (SUMMIT_ALT - BASE_ALT)) * 160;
  if (sky) {
    const s = Math.max(W / sky.width, (H + 200) / sky.height);
    const w = sky.width * s;
    const h = sky.height * s;
    ctx.drawImage(sky, (W - w) / 2, -200 + par + (H + 200 - h) / 2, w, h);
  } else ctx.drawImage(storm ? skyCanvas.storm : skyCanvas.clear, 0, par - 160);
  drawSlope(ctx, v, { weather, time: t });
  drawTrail(ctx, v);
  drawMarkers(ctx, v);
  drawCamps(ctx, v, t, { tent: IMG.tent });
  drawSummit(ctx, v, t, winnerName, IMG.summit);
}

function visibleClimbers(v) {
  const list = [];
  for (const c of climbers.values()) {
    const [x, y] = climberPos(c, v);
    if (y < -200 || y > H + 160) continue;
    list.push({ c, x, y });
  }
  // đông quá thì chỉ vẽ những người vừa tương tác gần nhất (cho máy yếu vẫn mượt)
  const max = Number(config.maxVisible) || 70;
  if (list.length > max) {
    list.sort((a, b) => b.c.lastActive - a.c.lastActive);
    list.length = max;
  }
  list.sort((a, b) => a.y - b.y);
  return list;
}


// vẽ sẵn người leo (mỗi màu áo x 8 pha bước chân + đứng yên) để nhiều người cùng lúc vẫn mượt
const SPRITE_FRAMES = 8;
const spriteCache = new Map();
function climberSprite(suitIdx, phase, moving) {
  const frame = moving ? Math.floor((((phase % TAU) + TAU) % TAU) / TAU * SPRITE_FRAMES) % SPRITE_FRAMES : -1;
  const key = `${suitIdx}|${frame}`;
  let cv = spriteCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = 150;
    cv.height = 230;
    const g = cv.getContext('2d');
    drawClimber(g, 75, 210, CLIMBER_SCALE, SUITS[suitIdx], moving ? ((frame + 0.5) / SPRITE_FRAMES) * TAU : 0, moving, null);
    spriteCache.set(key, cv);
  }
  return cv;
}
function drawClimberFast(x, y, c, img, lift = 0) {
  if (img) {
    drawClimber(ctx, x, y - lift, CLIMBER_SCALE, SUITS[c.suitIdx], c.phase, c.speed > 1, img);
    return;
  }
  ctx.drawImage(climberSprite(c.suitIdx, c.phase, c.speed > 1), x - 75, y - lift - 210);
}

function drawClimbers(list, t) {
  for (const { c, x, y } of list) {
    const boosted = now < c.boostUntil;
    if (boosted) {
      // vòng sáng tăng tốc (không dùng shadowBlur cho nhẹ máy)
      const g = ctx.createRadialGradient(x, y - 60, 10, x, y - 60, 90);
      g.addColorStop(0, 'rgba(255,214,77,0.45)');
      g.addColorStop(1, 'rgba(255,214,77,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y - 60, 90, 0, TAU);
      ctx.fill();
      if (c.speed > 4) {
        ctx.strokeStyle = 'rgba(255,214,77,0.7)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const ox = -30 + i * 20;
          const len = 30 + 20 * Math.sin(t * 20 + i);
          ctx.beginPath();
          ctx.moveTo(x + ox, y + 6);
          ctx.lineTo(x + ox, y + 6 + len);
          ctx.stroke();
        }
      }
    }
    const img = IMG.climbers.length ? IMG.climbers[c.suitIdx % IMG.climbers.length] : null;
    let sx = x;
    if (c.slip && now - c.slip < 1200) sx += Math.sin((now - c.slip) / 30) * 8;
    if (c.heli) {
      const k = clamp((now - c.heli.start) / c.heli.dur, 0, 1);
      const hx = sx + 40;
      const hy = y - 380 + Math.sin(t * 3) * 8 - (k < 0.2 ? (0.2 - k) * 2000 : k > 0.9 ? (k - 0.9) * 3000 : 0);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 50);
      ctx.lineTo(sx, y - 165);
      ctx.stroke();
      drawClimberFast(sx, y, { ...c, speed: 0 }, img, k > 0.2 && k < 0.95 ? 20 : 0);
      drawHelicopter(ctx, hx, hy, t, IMG.heli);
      continue;
    }
    drawClimberFast(sx, y, c, img);
  }
}

function drawLabels(list) {
  // chọn người được hiện tên: người đang quay, top 3, người vừa tương tác
  const top = new Set(topClimbers(3).map((c) => c.id));
  const scored = list.map((e) => {
    const c = e.c;
    let s = -(now - c.lastActive) / 1000;
    if (focus && focus.id === c.id) s += 1000;
    if (top.has(c.id)) s += 500;
    if (now < c.boostUntil) s += 300;
    return { ...e, s };
  });
  scored.sort((a, b) => b.s - a.s);
  const shown = scored.slice(0, config.labelCount);
  const placed = [];
  for (const e of shown) {
    const { c, x } = e;
    let y = e.y - 200;
    // tránh đè nhau: thử nhích lên 1 lần, vẫn đè thì bỏ qua bảng tên này
    let ok = false;
    for (let tries = 0; tries < 2; tries++) {
      const hit = placed.find((p) => Math.abs(p.x - x) < 250 && Math.abs(p.y - y) < 64);
      if (!hit) {
        ok = true;
        break;
      }
      y = hit.y - 66;
    }
    if (!ok) continue;
    placed.push({ x, y });
    const name = truncate(c.user.name, 14);
    const boosted = now < c.boostUntil;
    const altText = `${fmt(c.alt)} m${boosted ? `  ⚡x${c.boostMult}` : ''}`;
    ctx.font = `bold 23px ${FONT}`;
    const aw = ctx.measureText(altText).width;
    ctx.font = `bold 26px ${FONT}`;
    const tw = Math.max(ctx.measureText(name).width, aw, 110);
    const w = tw + 84;
    const lx = clamp(x - w / 2, 10, W - w - 80);
    const isFocus = focus && focus.id === c.id;
    ctx.fillStyle = isFocus ? 'rgba(20,35,65,0.9)' : 'rgba(30,45,75,0.72)';
    rr(ctx, lx, y - 32, w, 64, 32);
    ctx.fill();
    if (now < c.boostUntil) {
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    drawAvatar(lx + 32, y, 26, c.user, SUITS[c.suitIdx].jacket, '#fff', 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(name, lx + 66, y - 12);
    ctx.font = `bold 23px ${FONT}`;
    ctx.fillStyle = boosted ? '#ffd34d' : '#7cc8ff';
    ctx.fillText(altText, lx + 66, y + 14);
  }
}

function drawFloats(v) {
  for (const f of floats) {
    const c = climbers.get(f.id);
    if (!c) continue;
    const [x, y] = climberPos(c, v);
    const k = (now - f.t0) / 1600;
    const yy = y - 150 - k * 110;
    ctx.globalAlpha = 1 - k * k;
    if (f.kind === 'heart') {
      heart(x + 70 + f.dx, yy, 16, f.color);
      ctx.fillStyle = '#fff';
      ctx.font = `bold 26px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, x + 92 + f.dx, yy);
    } else {
      ctx.font = `900 34px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(20,30,50,0.8)';
      ctx.strokeText(f.text, x + f.dx, yy - 20);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, x + f.dx, yy - 20);
    }
    ctx.globalAlpha = 1;
  }
  for (const p of particles) {
    const c = climbers.get(p.id);
    if (!c) continue;
    const [x, y] = climberPos(c, v);
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(x + p.x - p.size / 2, y + p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function heart(x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.1, x - s * 0.7, y - s * 1.3, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.1, x, y + s * 0.9);
  ctx.fill();
}

function drawSnow() {
  const storm = weather === 'storm';
  if (weather === 'clear' && !storm) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 50; i++) {
      const f = flakes[i];
      ctx.fillRect(f.x, f.y, f.r * 0.7, f.r * 0.7);
    }
    return;
  }
  const n = storm ? flakes.length : weather === 'snow' ? 160 : 70;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const f = flakes[i];
    if (storm) {
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + 40 * f.s, f.y - 22 * f.s);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, TAU);
      ctx.fill();
    }
  }
  if (storm) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(225,235,245,0.35)');
    g.addColorStop(0.5, 'rgba(225,235,245,0.18)');
    g.addColorStop(1, 'rgba(225,235,245,0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawAvalanche() {
  if (!avalanche) return;
  const k = (now - avalanche.start) / 4500;
  const y = -300 + k * (H + 600);
  const g = ctx.createLinearGradient(0, y - 300, 0, y + 80);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(240,246,255,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, y - 300);
  ctx.lineTo(W, y - 300);
  ctx.lineTo(W, y);
  for (let i = 12; i >= 0; i--) ctx.lineTo((i / 12) * W, y + 40 * Math.sin(i * 1.7 + now / 200) + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 30; i++) {
    const x = hash(i, 41) * W;
    const yy = y + 40 + hash(i, 42) * 80 - ((now / 3) % 60);
    ctx.beginPath();
    ctx.arc(x, yy, 6 + hash(i, 43) * 14, 0, TAU);
    ctx.fill();
  }
}

// ------------------------------------------------------------------ giao diện (HUD)
function mountainIcon(x, y, s) {
  ctx.fillStyle = '#3bb36b';
  ctx.beginPath();
  ctx.moveTo(x - s, y + s * 0.7);
  ctx.lineTo(x - s * 0.15, y - s * 0.8);
  ctx.lineTo(x + s * 0.35, y);
  ctx.lineTo(x + s * 0.55, y - s * 0.35);
  ctx.lineTo(x + s, y + s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.15, y - s * 0.8);
  ctx.lineTo(x - s * 0.45, y - s * 0.25);
  ctx.lineTo(x - s * 0.2, y - s * 0.35);
  ctx.lineTo(x - s * 0.02, y - s * 0.2);
  ctx.lineTo(x + s * 0.12, y - s * 0.4);
  ctx.closePath();
  ctx.fill();
}

function pill(x, y, w, h, fill, stroke = null) {
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function weatherIcon(x, y, kind) {
  if (kind === 'sun') {
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16);
      ctx.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22);
      ctx.stroke();
    }
    return;
  }
  if (kind === 'cloud') {
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(x + 8, y - 6, 10, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = kind === 'storm' ? '#b0bccb' : '#fff';
  ctx.beginPath();
  ctx.arc(x - 8, y + 2, 10, 0, TAU);
  ctx.arc(x + 4, y - 4, 12, 0, TAU);
  ctx.arc(x + 14, y + 4, 8, 0, TAU);
  ctx.fill();
  ctx.fillRect(x - 8, y + 2, 22, 10);
  if (kind === 'snow' || kind === 'storm') {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x - 8 + i * 10, y + 20 + (i % 2) * 4, 3, 0, TAU);
      ctx.fill();
    }
  }
}

function temperature() {
  const k = (camAlt - BASE_ALT) / (SUMMIT_ALT - BASE_ALT);
  return Math.round(-4 - k * 30 + WEATHERS[weather].temp);
}

function drawHud(t) {
  // tiêu đề
  ctx.font = `900 52px ${FONT}`;
  const title = config.title;
  const tw = ctx.measureText(title).width;
  ctx.font = `900 30px ${FONT}`;
  const sw = ctx.measureText('8.849 m').width;
  const bw = tw + sw + 130;
  const bx = (W - bw) / 2;
  pill(bx, 42, bw, 84, 'rgba(25,35,55,0.82)', 'rgba(255,255,255,0.25)');
  mountainIcon(bx + 52, 86, 28);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `900 52px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(title, bx + 92, 86);
  ctx.font = `900 30px ${FONT}`;
  ctx.fillStyle = '#ffd34d';
  ctx.fillText('8.849 m', bx + 104 + tw, 92);

  // hàng thông tin: LIVE · người xem · tim · thời tiết
  const rowY = 146;
  const liveText = liveUser ? `LIVE · @${truncate(liveUser, 14)}` : 'LIVE';
  ctx.font = `900 30px ${FONT}`;
  const lw = ctx.measureText(liveText).width + 40;
  const statText1 = fmt(viewers || climbers.size);
  const statText2 = fmt(totalHearts);
  ctx.font = `bold 30px ${FONT}`;
  const s1 = ctx.measureText(statText1).width;
  const s2 = ctx.measureText(statText2).width;
  const sw2 = s1 + s2 + 120;
  const tempText = `${temperature()}°C`;
  const ww = ctx.measureText(tempText).width + 72;
  const total = lw + sw2 + ww + 24;
  let x = (W - total) / 2;
  pill(x, rowY, lw, 58, '#e8304a');
  ctx.fillStyle = '#fff';
  ctx.font = `900 30px ${FONT}`;
  ctx.fillText(liveText, x + 20, rowY + 30);
  x += lw + 12;
  pill(x, rowY, sw2, 58, 'rgba(25,35,55,0.82)');
  // biểu tượng người leo
  ctx.fillStyle = '#7cc8ff';
  ctx.beginPath();
  ctx.arc(x + 26, rowY + 20, 8, 0, TAU);
  ctx.fill();
  rr(ctx, x + 16, rowY + 30, 20, 18, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(statText1, x + 44, rowY + 30);
  heart(x + 70 + s1, rowY + 29, 13, '#ff4d6d');
  ctx.fillStyle = '#fff';
  ctx.fillText(statText2, x + 92 + s1, rowY + 30);
  x += sw2 + 12;
  pill(x, rowY, ww, 58, 'rgba(25,35,55,0.82)');
  weatherIcon(x + 30, rowY + 26, WEATHERS[weather].icon);
  ctx.fillStyle = '#fff';
  ctx.fillText(tempText, x + 56, rowY + 30);

  // top 3
  const top = topClimbers(3);
  const medal = ['#ffc83d', '#cfd8e3', '#e09a5a'];
  for (let i = 0; i < 3; i++) {
    const cw = 320;
    const cx = 30 + i * (cw + 15);
    const cy = 222;
    pill(cx, cy, cw, 86, 'rgba(25,35,55,0.85)', medal[i]);
    const c = top[i];
    if (c) {
      drawAvatar(cx + 44, cy + 43, 33, c.user, SUITS[c.suitIdx].jacket, medal[i], 4);
      ctx.fillStyle = medal[i];
      ctx.beginPath();
      ctx.arc(cx + 70, cy + 70, 14, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1b2333';
      ctx.font = `900 18px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), cx + 70, cy + 71);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = `bold 27px ${FONT}`;
      ctx.fillText(truncate(c.user.name, 11), cx + 90, cy + 28);
      ctx.fillStyle = '#ffd34d';
      ctx.font = `900 28px ${FONT}`;
      ctx.fillText(`${fmt(c.alt)} m`, cx + 90, cy + 60);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = `bold 24px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`Top ${i + 1} · chờ bạn`, cx + cw / 2, cy + 44);
      ctx.textAlign = 'left';
    }
  }

  // gợi ý cách chơi xoay vòng
  const hints = [
    ['heart', 'Thả tym', ' → leo nhanh hơn'],
    ['gift', 'Tặng quà', ` → tăng tốc x${tierFor(1).mult}`],
    ['heli', 'Quà lớn', ' → trực thăng chở lên'],
    ['chat', 'Bình luận', ' → có người leo riêng'],
    ['star', 'Theo dõi', ` +${config.followMeters} m · Chia sẻ +${config.shareMeters} m`],
  ];
  const storm = weather === 'storm';
  const hi = storm ? ['storm', 'Bão tuyết!', ' Gõ "cố lên" để giữ sức'] : hints[Math.floor(gameTime / 5) % hints.length];
  ctx.font = `bold 32px ${FONT}`;
  const hw1 = ctx.measureText(hi[1]).width;
  const hw2 = ctx.measureText(hi[2]).width;
  const hw = hw1 + hw2 + 90;
  const hx = (W - hw) / 2;
  pill(hx, 330, hw, 62, storm ? 'rgba(40,80,130,0.9)' : 'rgba(25,35,55,0.8)', storm ? '#bfe3ff' : null);
  if (hi[0] === 'heart') heart(hx + 38, 362, 14, '#ff4d6d');
  else {
    ctx.font = `30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText({ gift: '🎁', heli: '🚁', chat: '💬', star: '⭐', storm: '❄️' }[hi[0]] || '', hx + 38, 363);
  }
  ctx.textAlign = 'left';
  ctx.font = `bold 32px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(hi[1], hx + 64, 362);
  ctx.fillStyle = '#ffd34d';
  ctx.fillText(hi[2], hx + 64 + hw1, 362);

  // vòng + số người leo
  ctx.font = `bold 24px ${FONT}`;
  const rt = `Vòng ${round} · ${climbers.size} nhà leo núi`;
  const rw = ctx.measureText(rt).width + 36;
  pill(24, 412, rw, 44, 'rgba(25,35,55,0.7)');
  ctx.fillStyle = '#d6e6ff';
  ctx.fillText(rt, 42, 435);
  // thời tiết hiện tại
  const wt = WEATHERS[weather].name;
  const wtw = ctx.measureText(wt).width + 74;
  pill(24, 464, wtw, 44, weather === 'storm' ? 'rgba(40,80,130,0.85)' : 'rgba(25,35,55,0.7)');
  weatherIcon(50, 484, WEATHERS[weather].icon);
  ctx.fillStyle = '#fff';
  ctx.fillText(wt, 76, 487);

  drawAltitudeBar();
  drawToasts();
  drawBanners();
}

function drawAltitudeBar() {
  const x = 1012;
  const yTop = 470;
  const yBot = 1320;
  const ay = (a) => yBot - ((a - BASE_ALT) / (SUMMIT_ALT - BASE_ALT)) * (yBot - yTop);
  ctx.fillStyle = 'rgba(25,35,55,0.55)';
  rr(ctx, x - 9, yTop - 10, 18, yBot - yTop + 20, 9);
  ctx.fill();
  const lead = topClimbers(1)[0];
  if (lead) {
    const g = ctx.createLinearGradient(0, yBot, 0, yTop);
    g.addColorStop(0, '#4fc3f7');
    g.addColorStop(1, '#ffd34d');
    ctx.fillStyle = g;
    rr(ctx, x - 5, ay(lead.alt), 10, yBot - ay(lead.alt), 5);
    ctx.fill();
  }
  ctx.font = `bold 21px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const c of CAMPS) {
    const y = ay(c.alt);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 16, y - 1.5, 32, 3);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(20,30,50,0.75)';
    const s = fmt(c.alt);
    ctx.strokeText(s, x - 22, y);
    ctx.fillStyle = c.alt === SUMMIT_ALT ? '#ffd34d' : '#fff';
    ctx.fillText(s, x - 22, y);
  }
  ctx.textAlign = 'left';
  // khung camera
  const cy = ay(clamp(camAlt, BASE_ALT, SUMMIT_ALT));
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 20, cy - 14, 40, 28);
  // ảnh đại diện top 10
  const list = topClimbers(10).reverse();
  const used = [];
  for (const c of list) {
    const y = ay(c.alt);
    let ox = 0;
    while (used.some((u) => Math.abs(u.y - y) < 32 && u.ox === ox) && ox < 3) ox++;
    used.push({ y, ox });
    drawAvatar(x + 28 - ox * 40, y, 19, c.user, SUITS[c.suitIdx].jacket, now < c.boostUntil ? '#ffd34d' : '#fff', 2.5);
  }
}

function drawToasts() {
  let y = 560;
  for (const tt of toasts) {
    const k = clamp((now - tt.t0) / 300, 0, 1);
    const out = clamp((tt.until - now) / 400, 0, 1);
    ctx.globalAlpha = Math.min(k, out);
    ctx.font = `bold 32px ${FONT}`;
    const w = ctx.measureText(tt.text).width + 50;
    pill((W - w) / 2, y - 30, w, 60, 'rgba(15,25,45,0.85)', tt.color);
    ctx.fillStyle = tt.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tt.text, W / 2, y + 1);
    ctx.globalAlpha = 1;
    y += 72;
  }
  ctx.textAlign = 'left';
}

function drawBanners() {
  let y = 1340;
  for (const b of banners.slice(0, 2)) {
    const c = climbers.get(b.id);
    if (!c) continue;
    const k = clamp((now - b.t0) / 300, 0, 1);
    const bx = 60 + (1 - k) * 600;
    const bw = W - 120;
    pill(bx, y, bw, 96, 'rgba(20,30,52,0.9)', '#ffd34d');
    drawAvatar(bx + 50, y + 48, 36, b.user, SUITS[c.suitIdx].jacket, '#ffd34d', 3);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(truncate(`🎁 Cảm ơn ${b.user.name} đã tặng ${b.gift}`, 30), bx + 100, y + 30);
    // thanh thời gian tăng tốc
    const remain = clamp((c.boostUntil - now) / Math.max(1, c.boostTotal), 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    rr(ctx, bx + 100, y + 58, bw - 300, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#ffd34d';
    rr(ctx, bx + 100, y + 58, (bw - 300) * remain, 14, 7);
    ctx.fill();
    ctx.textAlign = 'right';
    ctx.font = `900 34px ${FONT}`;
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(`⚡ x${c.boostMult}`, bx + bw - 28, y + 32);
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(`${fmt(c.alt)} m`, bx + bw - 28, y + 68);
    ctx.textAlign = 'left';
    y += 108;
  }
}

function drawCelebration(t) {
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const p = fireworks[i];
    p.t += 1 / 60;
    p.x += p.vx / 60;
    p.y += p.vy / 60;
    p.vy += 220 / 60;
    p.vx *= 0.985;
    if (p.t > p.life) {
      fireworks.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.col;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
  if (!celebrate) return;
  const c = celebrate.climber;
  const k = clamp((now - celebrate.t0) / 600, 0, 1);
  const y = 700;
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
  ctx.globalAlpha = k;
  ctx.fillStyle = 'rgba(15,25,50,0.92)';
  rr(ctx, -470, -150, 940, 330, 40);
  ctx.fill();
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 6;
  ctx.stroke();
  drawAvatar(0, -150, 70, c.user, SUITS[c.suitIdx].jacket, '#ffd34d', 6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd34d';
  ctx.font = `900 46px ${FONT}`;
  ctx.fillText('🏆 CHINH PHỤC ĐỈNH EVEREST!', 0, -30);
  ctx.fillStyle = '#fff';
  ctx.font = `900 54px ${FONT}`;
  ctx.fillText(truncate(c.user.name, 18), 0, 36);
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = '#bfe3ff';
  ctx.fillText(`Thắng vòng ${round} · Lên đỉnh lần thứ ${hall[c.user.name] || 1}`, 0, 92);
  const left = Math.max(0, Math.ceil((celebrate.until - now) / 1000));
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText(`Vòng mới sau ${left} giây`, 0, 140);
  ctx.restore();
  // bảng vàng
  const hallTop = Object.entries(hall).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (hallTop.length) {
    const bx = 190;
    const by = 905;
    ctx.fillStyle = 'rgba(15,25,50,0.88)';
    rr(ctx, bx, by, W - 380, 70 + hallTop.length * 46, 28);
    ctx.fill();
    ctx.fillStyle = '#ffd34d';
    ctx.font = `900 32px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('BẢNG VÀNG ĐỈNH EVEREST', W / 2, by + 38);
    ctx.font = `bold 28px ${FONT}`;
    hallTop.forEach(([name, n], i) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${i + 1}. ${truncate(name, 18)}`, bx + 40, by + 86 + i * 46);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd34d';
      ctx.fillText(`${n} lần`, W - bx - 40, by + 86 + i * 46);
    });
    ctx.textAlign = 'left';
  }
}

let audioBlocked = false;
let last = 0;
function frame(t) {
  const dtReal = Math.min(0.05, (t - last) / 1000 || 0);
  last = t;
  const dt = dtReal * SPEED;
  now += dt * 1000;
  gameTime += dt;
  update(dt);
  const v = makeView(camAlt, CAM_Y, config.zoom);
  // rung màn hình khi tuyết lở
  ctx.save();
  if (avalanche) {
    const k = 1 - (now - avalanche.start) / 4500;
    ctx.translate(Math.sin(now / 25) * 10 * k, Math.cos(now / 31) * 6 * k);
  }
  drawWorld(v, gameTime);
  const list = visibleClimbers(v);
  drawClimbers(list, gameTime);
  drawAvalanche();
  drawSnow();
  drawLabels(list);
  drawFloats(v);
  ctx.restore();
  drawHud(gameTime);
  drawCelebration(gameTime);
  if (audioBlocked) {
    ctx.save();
    pill(W / 2 - 260, 1460, 520, 70, 'rgba(0,0,0,0.75)', '#ffd34d');
    ctx.fillStyle = '#ffd34d';
    ctx.font = `bold 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔇 Bấm vào game để bật tiếng', W / 2, 1496);
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

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function boot() {
  try {
    const res = await fetch('/leo-nui-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  for (const [k, w] of Object.entries(skyCanvas)) {
    w.width = W;
    w.height = H + 200;
    drawSkyLayer(w.getContext('2d'), k);
  }
  // ảnh tự thiết kế (không bắt buộc) trong public/assets/leo-nui
  const dir = String(config.imageFolder || 'assets/leo-nui').replace(/\/$/, '');
  let have = null;
  try {
    const r = await fetch('/leo-nui-images.json', { cache: 'no-store' });
    if (r.ok && dir === 'assets/leo-nui') have = new Set((await r.json()).map((f) => f.toLowerCase()));
  } catch {
    /* không có máy chủ */
  }
  const first = async (...names) => {
    for (const n of names) {
      if (have && !have.has(n.toLowerCase())) continue;
      const img = await loadImage(`${dir}/${n}`);
      if (img) return img;
    }
    return null;
  };
  if (params.get('img') !== '0') {
    IMG.bg = await first('nen.jpg', 'nen.png', 'nen.webp');
    IMG.bgStorm = await first('nen-bao.jpg', 'nen-bao.png');
    IMG.tent = await first('leu.png', 'leu.webp');
    IMG.summit = await first('dinh-nui.png', 'dinh-nui.webp');
    IMG.heli = await first('truc-thang.png', 'truc-thang.webp');
    for (let i = 1; i <= 8; i++) {
      const img = await first(`nguoi-leo-${i}.png`, `nguoi-leo-${i}.webp`);
      if (img) IMG.climbers.push(img);
    }
  }
  if (params.get('sound') === '0') config.sound = false;
  if (params.get('voice') === '0') config.voice = false;
  if (params.get('music') === '0') config.music = false;
  sfx.setSoundEnabled(config.sound !== false);
  voice.setSoundEnabled(config.sound !== false);
  voice.setVoiceEnabled(config.voice !== false);
  voice.setVoiceEngine(params.get('engine') || config.voiceEngine);
  voice.setPreferredVoice(config.ttsVoice);
  voice.setOnSpeakStart((text) => sfx.duck(Math.min(12000, 900 + String(text).length * 70)));
  let files = Array.isArray(config.musicFiles) ? config.musicFiles.filter(Boolean) : [];
  try {
    const r = await fetch('/leo-nui-music.json', { cache: 'no-store' });
    if (r.ok) files = [...(await r.json()), ...files];
  } catch {
    /* không có máy chủ */
  }
  const startAudio = () => {
    if (config.sound === false) return;
    sfx.startWind();
    sfx.setWind(weather === 'storm' ? 2 : weather === 'clear' ? 0 : 1);
    if (config.music !== false) sfx.startMusic({ files, volume: Number(config.musicVolume ?? 0.3) });
  };
  startAudio();
  window.addEventListener('pointerdown', () => {
    sfx.unlockAudio();
    voice.unlockAudio();
    startAudio();
  });
  setInterval(() => {
    audioBlocked = config.sound !== false && config.music !== false && !sfx.musicAudible();
    if (audioBlocked) {
      sfx.unlockAudio();
      startAudio();
    }
  }, 3000);
  weatherUntil = now + config.weatherSeconds * 1000;
  if (params.get('weather')) setWeather(params.get('weather'));
  connectWs();
  requestAnimationFrame((t) => {
    last = t;
    requestAnimationFrame(frame);
  });
}

window.__leoNui = {
  handleEvent,
  config: () => config,
  climbers,
  state: () => ({
    round, weather, camAlt: Math.round(camAlt), celebrate: Boolean(celebrate), winner: winnerName, hearts: totalHearts,
    top: topClimbers(5).map((c) => `${c.user.name}:${Math.round(c.alt)}${now < c.boostUntil ? ` x${c.boostMult}` : ''}`),
    focus: focus && climbers.get(focus.id)?.user.name,
  }),
  setWeather,
  avalanche: startAvalanche,
};
boot();
