// Game TikTok LIVE "Quán bar": người xem vào phòng được thả từ trên trời xuống sàn nhảy,
// thả tim / tặng quà để tích điểm và được mời lên sân khấu VIP, camera zoom cận cảnh.
import {
  W, H, FLOOR, STAGE, LED, floorPoint, scaleAtY, drawStatic, drawFloor, drawStageTop, drawSpeakers,
  drawDiscoBall, drawLasers, drawSpotlights, drawFog, hsl,
} from './club.js';
import {
  lookFor, shadowLook, drawDancer, DANCES, fallPose, landPose, cheerPose, wavePose, roundRectPath,
} from './dancer.js';
import * as sfx from './barAudio.js';
import * as voice from '../audio.js';

const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  clubName: 'NEON PARTY',
  subtitle: 'Vào LIVE là được thả xuống sàn • Thả tim & tặng quà để lên sân khấu VIP',
  maxDancers: 70,
  ambientCrowd: 18,
  idleMinutes: 15,
  stagePoints: 60,
  pointsPerCoin: 20,
  stageGiftCoins: 10,
  stageSeconds: 6,
  stageSecondsBig: 10,
  cameraZoom: 2.2,
  hypeMax: 150,
  giftTiers: { medium: 10, big: 100 },
  sound: true,
  music: true,
  musicFile: '',
  musicVolume: 0.35,
  bpm: 124,
  voice: true,
  voiceJoin: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-NamMinhNeural',
  captions: true,
  narration: true,
  narrationSeconds: 35,
  danceKeywords: ['quẩy', 'quay', 'nhảy', 'nhay', 'dance', 'lên', 'len', '🔥'],
  messages: {
    join: [
      'Chào {name} vừa đáp xuống sàn nhảy',
      '{name} đã vào quán, quẩy lên nào',
      'Hoan nghênh {name}, chúc bạn một đêm thật vui',
      'Ơ kìa, {name} rơi từ trên trời xuống rồi',
    ],
    stage: [
      'Mời {name} lên sân khấu VIP. Cả nhà cổ vũ nào',
      'Sân khấu là của {name}. Quẩy hết mình đi',
      'Đèn đã bật, camera đã quay. Mời {name} lên sân khấu',
      'Cả quán nhìn về {name} nào. Nhảy đẹp quá',
    ],
    follow: [
      'Cảm ơn {name} đã theo dõi kênh. Tặng bạn vương miện',
      '{name} vừa theo dõi kênh, đội vương miện lên nào',
    ],
    share: [
      'Cảm ơn {name} đã chia sẻ, rủ thêm bạn vào quẩy nhé',
      '{name} đã chia sẻ phiên LIVE, quán càng đông càng vui',
    ],
    gift: [
      'Cảm ơn {name} đã tặng {gift}',
      'Wow, {name} tặng {gift}. Cảm ơn bạn',
      '{name} chơi lớn quá, cảm ơn {gift}',
    ],
    bigGift: [
      'Bùng nổ. {name} vừa tặng {gift}. Cả quán cảm ơn {name}',
      'Quá đỉnh. Cảm ơn {name} đã tặng {gift}. Mời đại gia lên sân khấu',
    ],
    drop: [
      'Bùng nổ rồi. Cả sàn cùng nhảy nào',
      'Độ quẩy đã đầy. Lên nhạc thôi',
    ],
    reminder: [
      'Thả tim liên tục để nhân vật của bạn nhảy sung và được lên sân khấu VIP',
      'Ai muốn lên sân khấu thì thả tim thật nhiều hoặc tặng một món quà nhé',
      'Bình luận chữ quẩy để nhân vật của bạn nhảy ngay',
      'Theo dõi kênh để được đội vương miện trên sàn nhảy',
      'Thả tim cho đầy thanh độ quẩy, cả sàn sẽ bùng nổ',
      'Ai mới vào quán thì bình luận để được thả xuống sàn nhảy nhé',
    ],
  },
};
let config = { ...DEFAULTS };

const lastLine = {};
function line(kind, vars = {}) {
  const list = (config.messages && config.messages[kind]) || DEFAULTS.messages[kind] || [];
  if (!list.length) return '';
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastLine[kind]) i = (i + 1) % list.length;
  lastLine[kind] = i;
  return list[i].replace(/\{name\}/g, vars.name || '').replace(/\{gift\}/g, vars.gift || 'quà');
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
drawStatic(bg.getContext('2d'));

// ------------------------------------------------------------------ chữ
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
const FONT = 'system-ui, "Segoe UI", sans-serif';

// ------------------------------------------------------------------ ảnh đại diện
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
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(1.5, r * 0.14);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}

// ------------------------------------------------------------------ trạng thái
const dancers = new Map(); // người xem thật
let crowd = []; // người nhảy không tên
let crowdSeq = 0;
const particles = [];
const rings = [];
const beams = [];
const toasts = [];
const queue = [];
let show = null; // lượt diễn trên sân khấu
let nextShowAt = 0;
const cam = { x: W / 2, y: H / 2, z: 1 };
let shake = 0;
let flash = 0;
let hype = 0;
let dropUntil = 0;
let hue = 280;
let floorMode = 0;
let beat = 0;
let now = performance.now();

function allBodies() {
  return [...dancers.values(), ...crowd];
}

function pickFloorSpot() {
  const others = allBodies();
  let best = null;
  let bestD = -1;
  for (let k = 0; k < 12; k++) {
    const [x, y] = floorPoint(rand(0.06, 0.94), rand(0.04, 0.96));
    let d = 1e9;
    for (const o of others) d = Math.min(d, Math.hypot(o.hx - x, (o.hy - y) * 1.6));
    if (d > bestD) {
      bestD = d;
      best = [x, y];
    }
  }
  return best;
}

function newBody(id, look, real) {
  const [hx, hy] = pickFloorSpot();
  return {
    id,
    look,
    real,
    hx,
    hy,
    x: hx,
    y: hy,
    state: 'dance',
    t0: now,
    hypeUntil: 0,
    bubble: null,
    born: now,
  };
}

// ------------------------------------------------------------------ người xem
let lastJoinVoice = 0;
function ensureDancer(user, { announceJoin = false } = {}) {
  let d = dancers.get(user.id);
  if (d) {
    if (user.name) d.user.name = user.name;
    if (user.avatar) d.user.avatar = user.avatar;
    d.lastActive = now;
    if (d.state === 'leaving') {
      d.state = 'dance';
      d.y = d.hy;
    }
    return d;
  }
  d = newBody(user.id, lookFor(user.id), true);
  Object.assign(d, {
    user: { ...user, name: user.name || user.uniqueId || 'Khách' },
    points: 0,
    pending: 0,
    likes: 0,
    coins: 0,
    crown: false,
    lastActive: now,
    state: 'falling',
    t0: now,
  });
  dancers.set(user.id, d);
  // nhường chỗ: bớt một người nhảy không tên
  const filler = crowd.find((c) => c.state !== 'fadeout');
  if (filler) {
    filler.state = 'fadeout';
    filler.t0 = now;
  }
  beams.push({ x: d.hx, y: d.hy, born: now, color: d.look.glow });
  sfx.whoosh();
  trimDancers();
  if (announceJoin && config.voiceJoin !== false && now - lastJoinVoice > 4500) {
    lastJoinVoice = now;
    announce(line('join', { name: d.user.name }), 0);
  }
  return d;
}

function trimDancers() {
  const max = Math.max(10, Number(config.maxDancers) || 70);
  if (dancers.size <= max) return;
  const busy = new Set([show?.id, ...queue.map((q) => q.id)]);
  const list = [...dancers.values()].filter((d) => !busy.has(d.id) && d.state !== 'leaving');
  list.sort((a, b) => a.lastActive - b.lastActive);
  for (const d of list.slice(0, dancers.size - max)) leave(d);
}

function leave(d) {
  d.state = 'leaving';
  d.t0 = now;
}

function hypeUp(d, ms = 1600) {
  d.hypeUntil = now + ms;
}

function addHype(v) {
  if (now < dropUntil) return;
  hype += v;
  if (hype >= (Number(config.hypeMax) || 150)) startDrop();
}

function startDrop() {
  hype = 0;
  dropUntil = now + 9000;
  sfx.riser(1.2);
  setTimeout(() => {
    sfx.boom();
    sfx.horn();
    sfx.setDrop(true);
    flash = 1;
    shake = 14;
    for (let i = 0; i < 6; i++) setTimeout(() => firework(rand(150, 930), rand(250, 900)), i * 380);
    confettiRain(160);
  }, 1200);
  setTimeout(() => sfx.setDrop(false), 9000);
  for (const d of allBodies()) hypeUp(d, 4000);
  addToast('🔥 ĐỘ QUẨY ĐẦY - BÙNG NỔ!', '#ff4fd8');
  announce(line('drop'), 1);
}

// ------------------------------------------------------------------ sân khấu
function enqueueStage(d, priority, seconds) {
  if (show && show.id === d.id) {
    show.end = Math.min(show.end + 3000, show.start + 20000);
    return;
  }
  const q = queue.find((x) => x.id === d.id);
  if (q) {
    q.priority = Math.max(q.priority, priority);
    q.seconds = Math.max(q.seconds, seconds);
  } else {
    queue.push({ id: d.id, priority, seconds, ts: now });
  }
  queue.sort((a, b) => b.priority - a.priority || a.ts - b.ts);
  if (queue.length > 20) queue.length = 20;
}

function addPoints(d, pts) {
  d.points += pts;
  d.pending += pts;
  const need = Math.max(5, Number(config.stagePoints) || 60);
  if (d.pending >= need) {
    d.pending = 0;
    enqueueStage(d, 0, Number(config.stageSeconds) || 6);
  }
}

const FLY_MS = 900;
function updateShow() {
  if (!show) {
    if (now < nextShowAt) return;
    while (queue.length) {
      const q = queue.shift();
      const d = dancers.get(q.id);
      if (!d || d.state === 'leaving') continue;
      if (d.state === 'falling' || d.state === 'landing') {
        // chờ hạ cánh xong
        queue.unshift(q);
        return;
      }
      show = { id: d.id, start: now, end: now + FLY_MS + q.seconds * 1000, big: q.priority >= 1000 };
      d.state = 'toStage';
      d.t0 = now;
      sfx.whoosh();
      sfx.laser();
      announce(line('stage', { name: d.user.name }), 1);
      addToast(`🎤 ${truncate(d.user.name, 18)} lên sân khấu VIP!`, '#7cf7ff');
      return;
    }
    return;
  }
  const d = dancers.get(show.id);
  if (!d) {
    show = null;
    return;
  }
  if (d.state === 'toStage' && now - d.t0 >= FLY_MS) {
    d.state = 'stage';
    d.t0 = now;
    sfx.thud(true);
    sfx.cheer();
    shake = 8;
    flash = 0.6;
    rings.push({ x: STAGE.x, y: STAGE.y, r: 10, max: 320, born: now, life: 700, color: '#fff' });
    confettiBurst(STAGE.x, STAGE.y - 120, 70);
    co2Jets();
    if (show.big) for (let i = 0; i < 4; i++) setTimeout(() => firework(rand(200, 880), rand(200, 500)), i * 300);
  }
  if (d.state === 'stage') {
    // hiệu ứng theo nhịp
    if (Math.floor(beat) % 4 === 0 && Math.floor(beat) !== show.lastJet) {
      show.lastJet = Math.floor(beat);
      co2Jets();
    }
    if (Math.random() < 0.25) {
      particles.push({
        type: 'spark', x: STAGE.x + rand(-200, 200), y: STAGE.y - rand(0, 260), vx: rand(-20, 20), vy: rand(-40, 10),
        life: 900, born: now, color: hsl(hue + rand(0, 120), 100, 75), size: rand(2, 5),
      });
    }
    if (now >= show.end) {
      d.state = 'fromStage';
      d.t0 = now;
      sfx.whoosh();
    }
  }
  if (d.state === 'fromStage' && now - d.t0 >= FLY_MS) {
    d.state = 'landing';
    d.t0 = now;
    sfx.thud();
    rings.push({ x: d.hx, y: d.hy, r: 5, max: 120, born: now, life: 600, color: d.look.glow });
    show = null;
    nextShowAt = now + 700;
  }
}

function stagePos(d) {
  // vị trí khi bay lên/xuống sân khấu
  const k = clamp((now - d.t0) / FLY_MS, 0, 1);
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const stageSc = 1.55;
  let from = [d.hx, d.hy, scaleAtY(d.hy)];
  let to = [STAGE.x, STAGE.y, stageSc];
  if (d.state === 'fromStage') [from, to] = [to, from];
  const x = lerp(from[0], to[0], e);
  const y = lerp(from[1], to[1], e) - Math.sin(e * Math.PI) * 260;
  return { x, y, sc: lerp(from[2], to[2], e), k };
}

// ------------------------------------------------------------------ hiệu ứng
function hearts(x, y, n, color = '#ff3d7f') {
  for (let i = 0; i < n; i++) {
    particles.push({
      type: 'heart', x: x + rand(-18, 18), y, vx: rand(-25, 25), vy: rand(-140, -90), life: rand(1100, 1600), born: now,
      color: Math.random() < 0.7 ? color : pick(['#ff7ad9', '#ff4f6d', '#ffd1e8']), size: rand(9, 15),
    });
  }
}

function sparks(x, y, n, colorFn, speed = 260) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(speed * 0.3, speed);
    particles.push({
      type: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(600, 1200), born: now,
      color: colorFn(i), size: rand(2, 5), gravity: 160,
    });
  }
}

function coins(x, y, n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      type: 'coin', x: x + rand(-20, 20), y, vx: rand(-120, 120), vy: rand(-380, -200), life: 1400, born: now,
      gravity: 700, size: rand(7, 10), spin: rand(0, TAU),
    });
  }
}

const CONFETTI = ['#ff2e88', '#22d3ee', '#a3e635', '#facc15', '#f97316', '#8b5cf6', '#ffffff'];
function confettiBurst(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
    const v = rand(200, 650);
    particles.push({
      type: 'confetti', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(1800, 3000), born: now,
      color: pick(CONFETTI), size: rand(6, 11), gravity: 380, drag: 0.985, spin: rand(0, TAU), vs: rand(-10, 10),
    });
  }
}

function confettiRain(n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      type: 'confetti', x: rand(0, W), y: rand(-400, -10), vx: rand(-40, 40), vy: rand(120, 260), life: 4500, born: now,
      color: pick(CONFETTI), size: rand(7, 12), gravity: 40, spin: rand(0, TAU), vs: rand(-8, 8),
    });
  }
}

function co2Jets() {
  for (const sx of [STAGE.x - STAGE.rx + 30, STAGE.x + STAGE.rx - 30]) {
    for (let i = 0; i < 14; i++) {
      particles.push({
        type: 'jet', x: sx + rand(-8, 8), y: STAGE.y + 10, vx: rand(-30, 30), vy: rand(-900, -600), life: rand(700, 1100), born: now,
        size: rand(18, 30), drag: 0.93,
      });
    }
  }
}

function firework(x, y) {
  particles.push({ type: 'rocket', x, y: H * 0.55, tx: x, ty: y, vx: 0, vy: -1100, life: 2000, born: now, color: hsl(rand(0, 360), 100, 65) });
  sfx.whoosh();
}

function burstFirework(p) {
  const h = rand(0, 360);
  sparks(p.x, p.y, 70, (i) => hsl(h + (i % 3) * 40, 100, 65), 420);
  sfx.boom();
}

function addToast(text, color = '#fff') {
  toasts.push({ text, color, born: now });
  if (toasts.length > 4) toasts.shift();
}

// ------------------------------------------------------------------ lời dẫn
const captions = [];
let caption = null;
let lastAnnounce = performance.now();
function announce(text, priority = 0) {
  if (!text) return;
  lastAnnounce = performance.now();
  voice.speak(text, priority);
  if (config.captions === false) return;
  if (priority === 0 && captions.length >= 2) return;
  captions.push({ text, priority });
  captions.sort((a, b) => b.priority - a.priority);
  if (captions.length > 4) captions.length = 4;
}

// ------------------------------------------------------------------ sự kiện
function handleEvent(ev) {
  now = performance.now();
  const user = ev.user;
  switch (ev.type) {
    case 'join': {
      if (user) ensureDancer(user, { announceJoin: true });
      break;
    }
    case 'chat': {
      if (!user) break;
      const d = ensureDancer(user);
      const text = String(ev.text || '').trim();
      if (text) d.bubble = { text: truncate(text, 60), until: now + 5000 };
      const low = text.toLowerCase();
      if ((config.danceKeywords || []).some((k) => low.includes(String(k).toLowerCase()))) {
        hypeUp(d, 3000);
        sparks(d.x, d.y - 60, 12, () => d.look.glow, 160);
      }
      addHype(1);
      break;
    }
    case 'like': {
      if (!user) break;
      const d = ensureDancer(user);
      const n = clamp(Number(ev.count) || 1, 1, 100);
      d.likes += n;
      addPoints(d, n);
      hypeUp(d);
      hearts(d.x, d.y - 70 * scaleAtY(d.y), Math.min(6, n));
      sfx.pop();
      addHype(n);
      break;
    }
    case 'follow': {
      if (!user) break;
      const d = ensureDancer(user);
      d.crown = true;
      hypeUp(d, 2500);
      sparks(d.x, d.y - 110, 30, () => pick(['#ffd54a', '#fff3b0', '#ffb300']), 220);
      sfx.sparkle();
      addToast(`👑 ${truncate(d.user.name, 18)} đã theo dõi`, '#ffd54a');
      announce(line('follow', { name: d.user.name }), 1);
      break;
    }
    case 'share': {
      if (!user) break;
      const d = ensureDancer(user);
      hypeUp(d, 2500);
      confettiBurst(d.x, d.y - 60, 30);
      sfx.sparkle();
      addToast(`📣 ${truncate(d.user.name, 18)} đã chia sẻ`, '#7cf7ff');
      announce(line('share', { name: d.user.name }), 0);
      addHype(10);
      break;
    }
    case 'giftStreak': {
      if (!user) break;
      const d = ensureDancer(user);
      hypeUp(d);
      sparks(d.x, d.y - 60, 6, () => '#ffe066', 140);
      break;
    }
    case 'gift': {
      if (!user) break;
      const d = ensureDancer(user);
      const coinsN = Number(ev.coins) || (Number(ev.diamonds) || 1) * (Number(ev.repeatCount) || 1);
      const giftLabel = `${ev.giftName || 'quà'}${Number(ev.repeatCount) > 1 ? ` x${ev.repeatCount}` : ''}`;
      d.coins += coinsN;
      hypeUp(d, 4000);
      addHype(coinsN * 3);
      const tiers = { ...DEFAULTS.giftTiers, ...(config.giftTiers || {}) };
      const x = d.x;
      const y = d.y - 70 * scaleAtY(d.y);
      d.points += coinsN * (Number(config.pointsPerCoin) || 20);
      if (coinsN >= tiers.big) {
        enqueueStage(d, 1000 + coinsN, Number(config.stageSecondsBig) || 10);
        sfx.horn();
        sfx.boom();
        flash = 0.9;
        shake = 12;
        for (let i = 0; i < 5; i++) setTimeout(() => firework(rand(150, 930), rand(220, 800)), i * 350);
        confettiRain(120);
        coins(x, y, 30);
        addToast(`💎 ${truncate(d.user.name, 16)} tặng ${truncate(giftLabel, 18)}`, '#ffd54a');
        announce(line('bigGift', { name: d.user.name, gift: giftLabel }), 2);
      } else if (coinsN >= (Number(config.stageGiftCoins) || tiers.medium)) {
        enqueueStage(d, coinsN, Number(config.stageSeconds) || 6);
        sfx.sparkle();
        sfx.laser();
        confettiBurst(x, y, 50);
        coins(x, y, 14);
        flash = 0.35;
        addToast(`🎁 ${truncate(d.user.name, 16)} tặng ${truncate(giftLabel, 18)}`, '#ff9de2');
        announce(line('gift', { name: d.user.name, gift: giftLabel }), 1);
      } else {
        // quà nhỏ: cộng điểm để sớm được lên sân khấu
        d.pending += coinsN * (Number(config.pointsPerCoin) || 20);
        addPoints(d, 0);
        sfx.sparkle();
        sparks(x, y, 24, () => pick(['#ffe066', '#ff9de2', '#9dfcff']), 220);
        coins(x, y, 5);
        addToast(`🎁 ${truncate(d.user.name, 16)} tặng ${truncate(giftLabel, 18)}`, '#ffe9a8');
        announce(line('gift', { name: d.user.name, gift: giftLabel }), 1);
      }
      break;
    }
    case 'voiceTest': {
      announce('Xin chào cả nhà. Chào mừng đến với quán bar. Thả tim để lên sân khấu nào', 2);
      break;
    }
    case 'reset': {
      dancers.clear();
      queue.length = 0;
      show = null;
      particles.length = 0;
      hype = 0;
      break;
    }
    default:
      break;
  }
}

// ------------------------------------------------------------------ người nhảy không tên
function refillCrowd() {
  const target = Math.max(0, (Number(config.ambientCrowd) || 0) - dancers.size);
  const alive = crowd.filter((c) => c.state !== 'fadeout');
  if (alive.length < target) {
    const c = newBody(`crowd-${crowdSeq}`, shadowLook(crowdSeq++), false);
    c.state = 'fadein';
    c.t0 = now;
    crowd.push(c);
  } else if (alive.length > target) {
    alive[0].state = 'fadeout';
    alive[0].t0 = now;
  }
}

// ------------------------------------------------------------------ cập nhật
let lastFrame = performance.now();
function update(dt) {
  hype = Math.max(0, hype - dt * 3);
  if (flash > 0) flash = Math.max(0, flash - dt * 2.2);
  if (shake > 0) shake = Math.max(0, shake - dt * 30);
  hue = (hue + dt * 12) % 360;
  floorMode = Math.floor(beat / 16) % 4;
  updateShow();

  // trạng thái người nhảy
  const idleMs = Math.max(1, Number(config.idleMinutes) || 15) * 60000;
  for (const d of dancers.values()) {
    if (d.state === 'falling' && now - d.t0 >= 1000) {
      d.state = 'landing';
      d.t0 = now;
      sfx.thud();
      shake = Math.max(shake, 3);
      rings.push({ x: d.hx, y: d.hy, r: 5, max: 110, born: now, life: 600, color: d.look.glow });
      for (let i = 0; i < 10; i++) {
        particles.push({
          type: 'dust', x: d.hx + rand(-10, 10), y: d.hy, vx: rand(-90, 90), vy: rand(-40, -5), life: 600, born: now, size: rand(8, 14),
        });
      }
    } else if (d.state === 'landing' && now - d.t0 >= 500) {
      d.state = 'dance';
    } else if (d.state === 'leaving' && now - d.t0 >= 1500) {
      dancers.delete(d.id);
    } else if (d.state === 'dance' && now - d.lastActive > idleMs && show?.id !== d.id && !queue.some((q) => q.id === d.id)) {
      leave(d);
    }
  }
  crowd = crowd.filter((c) => !(c.state === 'fadeout' && now - c.t0 > 1200));
  for (const c of crowd) if (c.state === 'fadein' && now - c.t0 > 1200) c.state = 'dance';

  // hạt
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (now - p.born > p.life) {
      if (p.type === 'rocket') burstFirework(p);
      particles.splice(i, 1);
      continue;
    }
    if (p.type === 'rocket') {
      p.y += p.vy * dt;
      p.vy *= 0.985;
      if (p.y <= p.ty) {
        burstFirework(p);
        particles.splice(i, 1);
        continue;
      }
      if (Math.random() < 0.8) {
        particles.push({ type: 'spark', x: p.x + rand(-2, 2), y: p.y, vx: rand(-20, 20), vy: rand(20, 80), life: 400, born: now, color: '#ffd9a0', size: 2 });
      }
      continue;
    }
    if (p.drag) {
      p.vx *= p.drag;
      p.vy *= p.drag;
    }
    p.vy += (p.gravity || 0) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.vs) p.spin += p.vs * dt;
  }
  if (particles.length > 1500) particles.splice(0, particles.length - 1500);

  // camera
  const onStage = show && dancers.get(show.id)?.state === 'stage';
  const zoomIn = show && (onStage || dancers.get(show.id)?.state === 'toStage');
  const z = zoomIn ? Number(config.cameraZoom) || 2.2 : 1;
  const tx = zoomIn ? STAGE.x : W / 2;
  const ty = zoomIn ? STAGE.y - 110 : H / 2;
  const k = 1 - Math.pow(0.04, dt);
  cam.z += (z - cam.z) * k;
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  const halfH = H / 2 / cam.z;
  const halfW = W / 2 / cam.z;
  cam.y = clamp(cam.y, halfH, H - halfH);
  cam.x = clamp(cam.x, halfW, W - halfW);
}

// ------------------------------------------------------------------ vẽ
function poseFor(d) {
  const b = beat * (d.look.tempo || 1) + d.look.phase;
  const hot = now < d.hypeUntil || now < dropUntil;
  if (d.state === 'falling') return fallPose(now / 1000);
  if (d.state === 'landing') return landPose(1 - (now - d.t0) / 500);
  if (d.state === 'toStage' || d.state === 'fromStage') return cheerPose(b);
  if (d.state === 'leaving') return wavePose(now / 1000);
  if (d.state === 'stage') {
    const order = [4, 1, 2, 5, 0, 6, 3, 7];
    const style = order[Math.floor((now - d.t0) / 2000 + (d.look.style % 3)) % order.length];
    return DANCES[style](beat, 1.3);
  }
  if (hot && now < dropUntil && now < dropUntil - 7000) return cheerPose(b);
  if (hot) return DANCES[4](b, 1.3);
  const style = (d.look.style + Math.floor((beat + d.look.phase * 4) / 16)) % DANCES.length;
  return DANCES[style](b, 0.9);
}

function drawLED() {
  ctx.save();
  ctx.beginPath();
  ctx.rect(LED.x, LED.y, LED.w, LED.h);
  ctx.clip();
  ctx.fillStyle = '#070312';
  ctx.fillRect(LED.x, LED.y, LED.w, LED.h);
  // cột âm thanh
  const n = 28;
  const bw = LED.w / n;
  const pulse = Math.pow(Math.max(0, Math.cos((beat % 1) * TAU)), 2);
  for (let i = 0; i < n; i++) {
    const v = 0.25 + 0.35 * Math.abs(Math.sin(i * 0.7 + beat * 1.3)) + 0.4 * pulse * Math.abs(Math.sin(i * 1.9 + Math.floor(beat)));
    const h = v * LED.h * 0.8;
    const g = ctx.createLinearGradient(0, LED.y + LED.h, 0, LED.y + LED.h - h);
    g.addColorStop(0, hsl(hue + i * 6, 100, 50, 0.55));
    g.addColorStop(1, hsl(hue + i * 6 + 60, 100, 70, 0.25));
    ctx.fillStyle = g;
    ctx.fillRect(LED.x + i * bw + 3, LED.y + LED.h - h, bw - 6, h);
  }
  // chấm LED
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let y = LED.y; y < LED.y + LED.h; y += 6) ctx.fillRect(LED.x, y, LED.w, 2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const d = show && dancers.get(show.id);
  if (d && (d.state === 'stage' || d.state === 'toStage')) {
    ctx.font = `900 24px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = hsl(hue, 100, 60);
    ctx.shadowBlur = 20;
    ctx.fillText('🔥 ĐANG QUẨY TRÊN SÂN KHẤU 🔥', W / 2, LED.y + 70);
    ctx.font = `900 46px ${FONT}`;
    ctx.fillText(truncate(d.user.name, 16), W / 2, LED.y + 115);
  } else if (now < dropUntil) {
    ctx.font = `900 80px ${FONT}`;
    ctx.fillStyle = Math.floor(beat * 2) % 2 ? '#fff' : hsl(hue + 180, 100, 65);
    ctx.shadowColor = hsl(hue, 100, 60);
    ctx.shadowBlur = 30;
    ctx.fillText('BÙNG NỔ!', W / 2, LED.y + 130);
  } else {
    ctx.font = `900 46px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = hsl(hue + 200, 100, 60);
    ctx.shadowBlur = 18;
    ctx.fillText('SÂN KHẤU VIP', W / 2, LED.y + 62);
    ctx.font = `700 30px ${FONT}`;
    ctx.shadowBlur = 8;
    ctx.fillText('❤️ Thả tim nhiều  •  🎁 Tặng quà', W / 2, LED.y + 118);
    ctx.fillText('để được lên đây nhảy!', W / 2, LED.y + 158);
  }
  ctx.restore();
}

function drawBody(d, x, y, sc, alpha = 1) {
  const pose = poseFor(d);
  ctx.save();
  if (alpha < 1) ctx.globalAlpha = alpha;
  if (d.real && !d.look.shadow) {
    // vầng sáng dưới chân
    const g = ctx.createRadialGradient(x, y, 2, x, y, 34 * sc);
    g.addColorStop(0, d.look.glow + '88');
    g.addColorStop(1, d.look.glow + '00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, 34 * sc, 10 * sc, 0, 0, TAU);
    ctx.fill();
  }
  const info = drawDancer(ctx, d.look, pose, x, y, sc, { noShadow: d.state === 'falling' });
  ctx.restore();
  return info;
}

function drawTag(d, x, headY, sc) {
  if (!d.real) return;
  const name = truncate(d.user.name, 12);
  const fs = Math.round(16 * sc);
  ctx.save();
  ctx.font = `700 ${fs}px ${FONT}`;
  const tw = ctx.measureText(name).width;
  const r = 10 * sc;
  const w = tw + r * 2 + 14 * sc;
  const h = 22 * sc;
  const y = headY - h - 2;
  ctx.fillStyle = 'rgba(10,4,24,0.72)';
  roundRectPath(ctx, x - w / 2, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = d.look.glow;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawAvatar(x - w / 2 + r + 2, y + h / 2, r - 1, d.user, d.look.top);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(name, x - w / 2 + r * 2 + 8 * sc, y + h / 2 + 1);
  if (d.crown) {
    ctx.font = `${Math.round(22 * sc)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('👑', x, y - 12 * sc);
  }
  ctx.restore();
  return y;
}

function drawBubble(d, x, topY) {
  if (!d.bubble || now > d.bubble.until) return;
  const a = clamp((d.bubble.until - now) / 400, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `600 20px ${FONT}`;
  const lines = wrapText(d.bubble.text, 18, 2);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 24;
  const h = lines.length * 25 + 12;
  const bx = clamp(x - w / 2, 6, W - w - 6);
  const by = topY - h - 14;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  roundRectPath(ctx, bx, by, w, h, 12);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 7, by + h - 1);
  ctx.lineTo(x + 7, by + h - 1);
  ctx.lineTo(x, by + h + 10);
  ctx.fill();
  ctx.fillStyle = '#1b0b33';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 6 + 12.5 + i * 25));
  ctx.restore();
}

function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.5, y - s * 1.1, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 1.1, x + s, y - s * 0.4, x, y + s * 0.35);
}

function drawParticles() {
  for (const p of particles) {
    const age = (now - p.born) / p.life;
    const a = clamp(1 - age, 0, 1);
    switch (p.type) {
      case 'heart':
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        heartPath(p.x + Math.sin(age * 10) * 6, p.y, p.size);
        ctx.fill();
        break;
      case 'spark':
      case 'rocket':
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, TAU);
        ctx.fill();
        break;
      case 'coin':
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffd54a';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * Math.abs(Math.cos(p.spin + age * 12)) + 1, p.size, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      case 'confetti':
        ctx.globalAlpha = Math.min(1, a * 2);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.scale(1, Math.cos(p.spin * 2));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
        break;
      case 'jet': {
        const r = p.size * (1 + age * 3);
        const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, r);
        g.addColorStop(0, `rgba(255,255,255,${0.5 * a})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
        break;
      }
      case 'dust':
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = '#c9b8ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + age), 0, TAU);
        ctx.fill();
        break;
      default:
        break;
    }
  }
  ctx.globalAlpha = 1;
}

function drawRings() {
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    const k = (now - r.born) / r.life;
    if (k >= 1) {
      rings.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = 1 - k;
    ctx.lineWidth = 6 * (1 - k) + 1;
    ctx.shadowColor = r.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, lerp(r.r, r.max, k), lerp(r.r, r.max, k) * 0.28, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBeams() {
  for (let i = beams.length - 1; i >= 0; i--) {
    const b = beams[i];
    const k = (now - b.born) / 1400;
    if (k >= 1) {
      beams.splice(i, 1);
      continue;
    }
    const a = k < 0.7 ? 0.5 : (1 - k) / 0.3 * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(b.x - 30, 0, b.x + 30, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, b.color + Math.round(a * 255).toString(16).padStart(2, '0'));
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 30, 0, 60, b.y);
    // vòng mục tiêu hạ cánh
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = 0.8 * (1 - k);
    ctx.lineWidth = 3;
    const rr = 30 + 10 * Math.sin(now / 80);
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, rr, rr * 0.3, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

function drawStageSpot(d) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, 0, 0, STAGE.y);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0.28)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(STAGE.x - 40, 0);
  ctx.lineTo(STAGE.x + 40, 0);
  ctx.lineTo(STAGE.x + 170, STAGE.y);
  ctx.lineTo(STAGE.x - 170, STAGE.y);
  ctx.closePath();
  ctx.fill();
  const rg = ctx.createRadialGradient(STAGE.x, STAGE.y, 5, STAGE.x, STAGE.y, 190);
  rg.addColorStop(0, 'rgba(255,255,255,0.45)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.ellipse(STAGE.x, STAGE.y, 190, 40, 0, 0, TAU);
  ctx.fill();
  // tia màu xoay sau lưng
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + now / 1400;
    ctx.fillStyle = hsl(hue + k * 45, 100, 60, 0.08);
    ctx.beginPath();
    ctx.moveTo(STAGE.x, STAGE.y - 100);
    ctx.lineTo(STAGE.x + Math.cos(a) * 520, STAGE.y - 100 + Math.sin(a) * 520);
    ctx.lineTo(STAGE.x + Math.cos(a + 0.18) * 520, STAGE.y - 100 + Math.sin(a + 0.18) * 520);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawWorld() {
  const t = now / 1000;
  ctx.drawImage(bg, 0, 0);
  drawLED();
  drawSpeakers(ctx, beat, hue);
  drawDiscoBall(ctx, 95, 250, 34, t * 0.8, hue);
  drawDiscoBall(ctx, W - 95, 250, 34, t * 0.8 + 1, hue);

  const sd = show && dancers.get(show.id);
  const onStage = sd && sd.state === 'stage';
  if (onStage) drawStageSpot(sd);
  drawStageTop(ctx, beat, hue, onStage);
  if (onStage) {
    const info = drawBody(sd, STAGE.x, STAGE.y, 1.55);
    drawTag(sd, STAGE.x, info.headY, 1.3);
    drawBubble(sd, STAGE.x, info.headY - 34);
  }

  drawFloor(ctx, beat, hue, now < dropUntil ? 1.6 : 1, floorMode);
  drawSpotlights(ctx, t, hue);
  drawRings();

  // người trên sàn, xếp theo chiều sâu
  const list = [];
  for (const c of crowd) list.push(c);
  for (const d of dancers.values()) {
    if (d.state === 'dance' || d.state === 'landing' || d.state === 'leaving') list.push(d);
  }
  list.sort((a, b) => a.hy - b.hy);
  for (const d of list) {
    const wob = Math.sin(t * 0.4 + d.look.phase * 3) * 10;
    let x = d.hx + wob;
    let y = d.hy;
    let alpha = 1;
    if (d.state === 'fadein') alpha = clamp((now - d.t0) / 1200, 0, 1);
    if (d.state === 'fadeout') alpha = 1 - clamp((now - d.t0) / 1200, 0, 1);
    if (d.state === 'leaving') {
      const k = clamp((now - d.t0) / 1500, 0, 1);
      alpha = 1 - k;
      y -= k * k * 400;
    }
    d.x = x;
    d.y = y;
    const sc = scaleAtY(d.hy);
    if (!d.real) alpha *= 0.9;
    const info = drawBody(d, x, y, sc, alpha);
    if (d.real && d.state !== 'leaving') {
      const tagY = drawTag(d, x, info.headY, sc * 0.95);
      drawBubble(d, x, tagY ?? info.headY);
    }
  }

  // người đang rơi / đang bay
  drawBeams();
  for (const d of dancers.values()) {
    if (d.state === 'falling') {
      const k = clamp((now - d.t0) / 1000, 0, 1);
      const y = lerp(-200, d.hy, k * k);
      const sc = scaleAtY(d.hy);
      d.x = d.hx;
      d.y = y;
      // vệt rơi
      ctx.save();
      ctx.strokeStyle = d.look.glow;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 3;
      for (const off of [-16, 0, 16]) {
        ctx.beginPath();
        ctx.moveTo(d.hx + off, y - 150 * sc);
        ctx.lineTo(d.hx + off, y - 150 * sc - 90 * k);
        ctx.stroke();
      }
      ctx.restore();
      const info = drawBody(d, d.hx, y, sc);
      drawTag(d, d.hx, info.headY, sc);
    } else if (d.state === 'toStage' || d.state === 'fromStage') {
      const p = stagePos(d);
      d.x = p.x;
      d.y = p.y;
      if (Math.random() < 0.7) {
        particles.push({ type: 'spark', x: p.x + rand(-15, 15), y: p.y - rand(0, 80), vx: 0, vy: 30, life: 500, born: now, color: d.look.glow, size: rand(2, 5) });
      }
      const info = drawBody(d, p.x, p.y, p.sc);
      drawTag(d, p.x, info.headY, p.sc * 0.85);
    }
  }

  drawLasers(ctx, t, hue, now < dropUntil ? 1 : onStage ? 0.8 : 0.35);
  drawFog(ctx, t);
  drawParticles();
}

// ------------------------------------------------------------------ giao diện (không zoom)
function drawHeader() {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 190);
  g.addColorStop(0, 'rgba(5,1,12,0.95)');
  g.addColorStop(1, 'rgba(5,1,12,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 190);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 76px ${FONT}`;
  const flick = Math.random() < 0.02 ? 0.4 : 1;
  ctx.shadowColor = hsl(hue + 300, 100, 60);
  ctx.shadowBlur = 30;
  ctx.strokeStyle = hsl(hue + 300, 100, 70, flick);
  ctx.lineWidth = 4;
  ctx.strokeText(config.clubName, W / 2, 68);
  ctx.fillStyle = `rgba(255,255,255,${0.95 * flick})`;
  ctx.fillText(config.clubName, W / 2, 68);
  ctx.shadowBlur = 6;
  ctx.font = `600 25px ${FONT}`;
  ctx.fillStyle = '#e9ddff';
  wrapText(config.subtitle, 52, 2).forEach((l, i) => ctx.fillText(l, W / 2, 124 + i * 30));
  ctx.restore();

  // thanh độ quẩy
  const x = 210;
  const y = LED.y - 30;
  const w = W - 420;
  const max = Number(config.hypeMax) || 150;
  const v = now < dropUntil ? 1 : clamp(hype / max, 0, 1);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRectPath(ctx, x, y, w, 20, 10);
  ctx.fill();
  const hg = ctx.createLinearGradient(x, 0, x + w, 0);
  hg.addColorStop(0, '#ff2e88');
  hg.addColorStop(0.5, '#ffb02e');
  hg.addColorStop(1, '#fff36b');
  ctx.fillStyle = hg;
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = 12;
  if (v > 0.01) {
    roundRectPath(ctx, x, y, Math.max(20, w * v), 20, 10);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.font = `800 17px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(now < dropUntil ? '🔥 BÙNG NỔ 🔥' : `🔥 ĐỘ QUẨY ${Math.round(v * 100)}%`, x + w / 2, y + 11);
  ctx.restore();
}

function drawToasts() {
  let y = cam.z > 1.1 ? 1380 : 640;
  for (let i = toasts.length - 1; i >= 0; i--) {
    const tt = toasts[i];
    const age = now - tt.born;
    if (age > 5000) {
      toasts.splice(i, 1);
      continue;
    }
    const slide = clamp(age / 250, 0, 1);
    const a = clamp((5000 - age) / 400, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `700 24px ${FONT}`;
    const w = ctx.measureText(tt.text).width + 32;
    const x = lerp(-w, 16, slide);
    ctx.fillStyle = 'rgba(12,4,28,0.82)';
    roundRectPath(ctx, x, y, w, 44, 22);
    ctx.fill();
    ctx.strokeStyle = tt.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = tt.color;
    ctx.textBaseline = 'middle';
    ctx.fillText(tt.text, x + 16, y + 23);
    ctx.restore();
    y -= 54;
  }
}

function drawCamOverlay() {
  const k = clamp((cam.z - 1) / ((Number(config.cameraZoom) || 2.2) - 1), 0, 1);
  if (k < 0.05) return;
  const d = show && dancers.get(show.id);
  ctx.save();
  ctx.globalAlpha = k;
  // viền khung máy quay
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 6;
  const m = 40;
  const L = 70;
  for (const [x, y, sx, sy] of [[m, 200, 1, 1], [W - m, 200, -1, 1], [m, 1680, 1, -1], [W - m, 1680, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(x, y + sy * L);
    ctx.lineTo(x, y);
    ctx.lineTo(x + sx * L, y);
    ctx.stroke();
  }
  ctx.font = `800 28px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = Math.floor(now / 500) % 2 ? '#ff2d55' : 'rgba(255,45,85,0.3)';
  ctx.beginPath();
  ctx.arc(m + 34, 250, 11, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText('CAM VIP', m + 56, 251);
  if (d && show) {
    // băng tên + đếm ngược
    const y = 1440;
    const left = Math.max(0, show.end - now);
    const total = Math.max(1, show.end - show.start - FLY_MS);
    ctx.fillStyle = 'rgba(10,3,25,0.85)';
    roundRectPath(ctx, 60, y, W - 120, 120, 26);
    ctx.fill();
    ctx.strokeStyle = hsl(hue, 100, 65);
    ctx.lineWidth = 3;
    ctx.stroke();
    drawAvatar(130, y + 60, 42, d.user, d.look.top);
    ctx.fillStyle = '#fff';
    ctx.font = `900 44px ${FONT}`;
    ctx.fillText(truncate(d.user.name, 16), 190, y + 44);
    ctx.font = `600 24px ${FONT}`;
    ctx.fillStyle = '#ffd1f4';
    ctx.fillText(`❤️ ${d.likes}   🎁 ${d.coins} xu   ⭐ ${d.points} điểm`, 190, y + 88);
    ctx.fillStyle = hsl(hue + 60, 100, 60);
    ctx.fillRect(80, y + 112, (W - 160) * clamp(left / total, 0, 1), 5);
  }
  ctx.restore();
}

function drawCaption() {
  if ((!caption || now > caption.until) && captions.length) {
    const c = captions.shift();
    caption = { ...c, born: now, until: now + Math.min(7000, 2500 + c.text.length * 55) };
  }
  if (!caption) return;
  if (now > caption.until) {
    caption = null;
    return;
  }
  const a = clamp(Math.min((now - caption.born) / 250, (caption.until - now) / 400), 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `700 30px ${FONT}`;
  const lines = wrapText(caption.text, 36, 3);
  const w = Math.min(1000, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 70);
  const lh = 40;
  const h = lines.length * lh + 26;
  const zoomed = cam.z > 1.1;
  const y = zoomed ? 1580 : 430;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(90,10,120,0.95)');
  g.addColorStop(1, 'rgba(40,5,70,0.95)');
  ctx.fillStyle = g;
  roundRectPath(ctx, W / 2 - w / 2, y, w, h, 22);
  ctx.fill();
  ctx.strokeStyle = '#ff7ae0';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y + 13 + lh / 2 + i * lh));
  ctx.restore();
}

function drawFooter() {
  const y0 = 1712;
  ctx.save();
  ctx.fillStyle = '#06020f';
  ctx.fillRect(0, y0, W, H - y0);
  ctx.fillStyle = hsl(hue + 300, 100, 60);
  ctx.fillRect(0, y0, W, 3);
  ctx.textBaseline = 'middle';

  // bảng xếp hạng
  ctx.font = `900 24px ${FONT}`;
  ctx.fillStyle = '#ffd54a';
  ctx.textAlign = 'left';
  ctx.fillText('🏆 TOP QUẨY', 24, y0 + 26);
  const top = [...dancers.values()].filter((d) => d.points > 0).sort((a, b) => b.points - a.points).slice(0, 4);
  ctx.font = `600 22px ${FONT}`;
  top.forEach((d, i) => {
    const y = y0 + 64 + i * 34;
    ctx.fillStyle = ['#ffd54a', '#e5e7eb', '#f0a060', '#c4b5fd'][i];
    ctx.fillText(`${i + 1}`, 26, y);
    drawAvatar(62, y, 13, d.user, d.look.top);
    ctx.fillStyle = '#fff';
    ctx.fillText(truncate(d.user.name, 13), 84, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff9de2';
    ctx.fillText(`${d.points}`, 505, y);
    ctx.textAlign = 'left';
  });
  if (!top.length) {
    ctx.fillStyle = '#b9a8e0';
    ctx.fillText('Thả tim để vào bảng!', 26, y0 + 64);
  }

  // hàng chờ sân khấu
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(536, y0 + 14, 2, 170);
  ctx.font = `900 24px ${FONT}`;
  ctx.fillStyle = '#7cf7ff';
  ctx.fillText('🎤 SẮP LÊN SÂN KHẤU', 556, y0 + 26);
  ctx.font = `600 22px ${FONT}`;
  const waiting = queue.map((q) => dancers.get(q.id)).filter(Boolean).slice(0, 4);
  waiting.forEach((d, i) => {
    const y = y0 + 64 + i * 34;
    drawAvatar(572, y, 13, d.user, d.look.top);
    ctx.fillStyle = '#fff';
    ctx.fillText(truncate(d.user.name, 16), 594, y);
  });
  if (!waiting.length) {
    ctx.fillStyle = '#b9a8e0';
    const need = Number(config.stagePoints) || 60;
    ctx.fillText(`Chưa có ai • ${need} tim hoặc`, 558, y0 + 64);
    ctx.fillText(`quà ${Number(config.stageGiftCoins) || 10} xu là được lên!`, 558, y0 + 98);
  }
  ctx.restore();
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - lastFrame) / 1000);
  lastFrame = ts;
  now = ts;
  beat = sfx.beatNow();
  update(dt);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  const sx = shake ? rand(-shake, shake) : 0;
  const sy = shake ? rand(-shake, shake) : 0;
  ctx.translate(W / 2 + sx, H / 2 + sy);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);
  drawWorld();
  ctx.restore();

  // nháy đèn theo nhịp khi bùng nổ
  if (now < dropUntil && Math.floor(beat * 2) % 2 === 0) {
    ctx.fillStyle = hsl(hue + Math.floor(beat) * 90, 100, 60, 0.08);
    ctx.fillRect(0, 0, W, H);
  }
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flash * 0.45})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawHeader();
  drawCamOverlay();
  drawToasts();
  drawCaption();
  drawFooter();
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

async function boot() {
  try {
    const res = await fetch('/bar-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...DEFAULTS, ...(await res.json()) };
  } catch {
    /* chạy không có server */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  if (params.get('sound') === '0') config.sound = false;
  if (params.get('voice') === '0') config.voice = false;
  if (params.get('music') === '0') config.music = false;
  sfx.setSoundEnabled(config.sound !== false);
  voice.setSoundEnabled(config.sound !== false);
  voice.setVoiceEnabled(config.voice !== false);
  voice.setVoiceEngine(params.get('engine') || config.voiceEngine);
  voice.setPreferredVoice(config.ttsVoice);
  const startMusic = () => {
    if (config.music !== false && config.sound !== false) {
      sfx.startMusic({ file: config.musicFile, volume: Number(config.musicVolume) || 0.35, bpm: Number(config.bpm) || 124 });
    }
  };
  startMusic();
  window.addEventListener('pointerdown', () => {
    sfx.unlockAudio();
    voice.unlockAudio();
    startMusic();
  }, { once: true });
  if (config.narration !== false) {
    const gap = Math.max(15, Number(config.narrationSeconds) || 35) * 1000;
    setInterval(() => {
      if (performance.now() - lastAnnounce > gap) announce(line('reminder'), 0);
    }, 3000);
  }
  setInterval(refillCrowd, 1500);
  connectWs();
  requestAnimationFrame(frame);
}

window.BarGame = { handleEvent, dancers, queue };
boot();
