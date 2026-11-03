// Game TikTok LIVE "Bến câu sinh tồn": người xem vào LIVE thành người ngồi câu trên hai bến gỗ.
// Gõ số hoặc tên mồi để câu (mồi quyết định loại cá), thả tim cho cá cắn nhanh, chia sẻ để cá to gấp đôi,
// tặng quà để thả thính / quăng lưới / gọi thủy quái. Thể lực tụt dần: nướng cá ăn, đốt lửa sưởi ban đêm.
// Hai bến thi nhau ai câu nặng hơn mỗi trận; cả live cùng thả tim kéo thủy quái và đạt mục tiêu chung.
import {
  W, H, TAU, SEATS, SEAT_ORDER, TEAM, RAFT, WATER_Y, CHANNEL,
  drawSky, drawFarBank, drawWater, drawWaterDecor, drawPiers, drawPierSigns, drawLanterns, drawRaft, drawFireGlow,
  drawFisher, drawFish, drawJunk, drawBasketBoat, drawDragonBoat, drawMonster, lookFor, crowdLook, roundRectPath as rr, FISH_ART,
} from './river.js';
import * as sfx from './fishAudio.js';
import * as voice from '../audio.js';

const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const FONT = '"Segoe UI", system-ui, sans-serif';

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'BẾN CÂU SINH TỒN',
  subtitle: 'Gõ số để câu • Thả tim cá cắn nhanh • Chia sẻ cá to gấp đôi',
  ambientCrowd: 8,
  idleMinutes: 15,
  dayMinutes: 15,
  staminaMinutes: 5,
  matchMinutes: 5,
  monsterMinutes: 10,
  monsterSeconds: 60,
  rainEveryMinutes: 9,
  rainSeconds: 60,
  fireSeconds: 90,
  autoFishSeconds: 25,
  junkChance: 0.05,
  legendChance: 0.004,
  giftTiers: { medium: 10, big: 100 },
  goals: [
    { type: 'like', target: 500, reward: 'fishRain', label: 'MƯA CÁ' },
    { type: 'share', target: 10, reward: 'dragonBoat', label: 'THUYỀN RỒNG' },
    { type: 'like', target: 1500, reward: 'goldRush', label: 'GIỜ CÁ VÀNG' },
  ],
  cameraZoom: 1.25,
  sound: true,
  music: true,
  musicVolume: 0.3,
  ambienceVolume: 0.14,
  voice: true,
  voiceLevel: 'vua',
  voiceGapSeconds: 10,
  voiceJoin: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-NamMinhNeural',
  captions: true,
  narration: true,
  narrationSeconds: 45,
  fish: {
    ro: { name: 'Cá rô', min: 0.1, max: 0.4 },
    diec: { name: 'Cá diếc', min: 0.2, max: 0.6 },
    bong: { name: 'Cá bống', min: 0.05, max: 0.2 },
    chep: { name: 'Cá chép', min: 1, max: 5 },
    me: { name: 'Cá mè', min: 1.5, max: 6 },
    tram: { name: 'Cá trắm cỏ', min: 3, max: 12 },
    loc: { name: 'Cá lóc', min: 1, max: 4 },
    tre: { name: 'Cá trê', min: 0.5, max: 3 },
    luon: { name: 'Con lươn', min: 0.3, max: 1.2 },
    chepvang: { name: 'Cá chép vàng', min: 20, max: 35, legend: true },
    trekhong: { name: 'Cá trê khổng lồ', min: 25, max: 50, legend: true },
  },
  junk: { dep: 'Chiếc dép tổ ong', ung: 'Chiếc ủng rách', chai: 'Chai nhựa' },
  baits: {
    giun: { num: '1', label: 'Giun', hint: 'rô, diếc', wait: [6, 14], pool: { ro: 5, diec: 4, bong: 3, tre: 1 } },
    com: { num: '2', label: 'Cơm nắm', hint: 'chép, mè', wait: [8, 16], pool: { chep: 5, me: 3, diec: 2 } },
    ngo: { num: '3', label: 'Ngô', hint: 'trắm cỏ', wait: [12, 22], pool: { tram: 5, chep: 2, me: 2 } },
    tom: { num: '4', label: 'Tôm', hint: 'cá lóc', wait: [8, 18], pool: { loc: 6, tre: 2, chep: 1 } },
    tanh: { num: '5', label: 'Mồi tanh', hint: 'trê, lươn', wait: [8, 18], pool: { tre: 5, luon: 4, loc: 1 }, night: true },
  },
  commands: {
    giun: ['giun', 'mồi giun', 'câu giun', 'câu rô', 'cá rô', 'câu diếc', 'cá diếc'],
    com: ['cơm nắm', 'mồi cơm', 'câu chép', 'cá chép', 'câu mè', 'cá mè'],
    ngo: ['ngô', 'bắp', 'mồi ngô', 'câu trắm', 'cá trắm'],
    tom: ['tôm', 'mồi tôm', 'câu lóc', 'cá lóc', 'cá quả'],
    tanh: ['mồi tanh', 'lòng gà', 'câu trê', 'cá trê', 'câu lươn', 'con lươn'],
    eat: ['nướng cá', 'ăn cá', 'đói quá', 'ăn thôi'],
    fire: ['đốt lửa', 'nhóm lửa', 'lạnh quá', 'sưởi ấm'],
  },
  // chỉ nhận khi cả bình luận đúng bằng từ này (tránh nhầm với câu thường)
  teamWords: {
    left: ['trái', 'bến trái', 'đội trái', 'ben trai'],
    right: ['phải', 'bến phải', 'đội phải', 'ben phai'],
  },
  messages: {
    join: ['Mời {name} xuống bến ngồi câu', '{name} đến rồi, chọn mồi đi nào', 'Chào {name}, gõ số một để câu bằng giun nhé', '{name} vác cần ra bến rồi'],
    big: ['{name} kéo được {fish} nặng {kg} cân', 'Ối dồi ôi, {name} câu được {fish} {kg} cân', 'Cá to quá, {name} được {fish} {kg} cân'],
    legend: ['Huyền thoại. {name} câu được {fish} nặng {kg} cân', 'Cả bến ơi, {name} kéo được {fish} {kg} cân'],
    junkLine: ['{name} câu được {fish}, hôm nay đen thật', 'Ơ kìa, {name} kéo lên {fish}'],
    follow: ['Cảm ơn {name} đã theo dõi, tặng nón lá có nơ và một mẻ cá đẹp', '{name} theo dõi rồi, mẻ tới chắc chắn cá đẹp'],
    share: ['Cảm ơn {name} đã chia sẻ, con cá tới to gấp đôi', '{name} vừa chia sẻ, mẻ tới cá to'],
    gift: ['{name} tặng {gift}, thả thính cho cả bến, cá cắn liên tục', 'Cảm ơn {name}, cả bến được thả thính'],
    mediumGift: ['{name} tặng {gift}, thuyền thúng ra giữa sông quăng lưới', 'Cảm ơn {name}, quăng lưới chia cá cho cả bến'],
    bigGift: ['Đại gia {name} tặng {gift}, gọi thủy quái lên. Cả bến thả tim kéo nào', '{name} tặng {gift}, đứng mũi thuyền kéo thủy quái'],
    sleep: ['{name} đói quá ngủ gục rồi, gõ sáu để nướng cá ăn', '{name} hết sức rồi, ai thả tim đánh thức đi'],
    eat: ['{name} nướng cá ăn cho lại sức', '{name} ăn cá nướng, thơm phức'],
    fire: ['{name} đốt lửa, cả bến được sưởi ấm', 'Lửa bùng lên rồi, cảm ơn {name}'],
    monsterWarn: ['Mặt nước sủi bọt, thủy quái sắp lên. Chuẩn bị thả tim'],
    monster: ['Thủy quái xuất hiện. Cả live thả tim để kéo nó lên bờ', 'Thủy quái lên rồi. Thả tim thật nhanh để kéo'],
    monsterWin: ['Kéo được thủy quái rồi. Cả bến được thưởng cá', 'Thắng rồi. Thủy quái bị kéo lên bờ'],
    monsterLose: ['Thủy quái lặn mất, cướp luôn ít cá trong giỏ', 'Tiếc quá, thủy quái thoát rồi'],
    roundWin: ['{team} thắng trận với {kg} cân cá. Cao thủ là {name}', 'Hết trận, {team} thắng. {name} câu nặng nhất'],
    roundDraw: ['Hết trận, hai bến hoà nhau'],
    roundStart: ['Trận mới bắt đầu. Gõ trái hoặc phải để chọn bến'],
    rain: ['Trời đổ mưa, cá trốn hết rồi. Tặng quà để trời tạnh', 'Mưa to quá, cả bến ướt hết'],
    rainEnd: ['Tạnh mưa rồi, câu tiếp thôi'],
    night: ['Trời tối rồi, nhớ gõ bảy để đốt lửa sưởi ấm', 'Màn đêm buông xuống, cá trê cá lươn bắt đầu cắn'],
    day: ['Trời sáng rồi, chúc cả bến một ngày câu đẹp'],
    goal: ['Cả live đạt mục tiêu. {reward}'],
    reminder: [
      'Gõ số một để câu bằng giun, số hai câu cá chép',
      'Gõ số ba câu trắm cỏ, cá to nhất sông',
      'Gõ số bốn câu cá lóc, số năm câu trê và lươn',
      'Thả tim để cá cắn câu nhanh hơn',
      'Chia sẻ live thì con cá tiếp theo to gấp đôi',
      'Đói thì gõ sáu để nướng cá ăn, kẻo ngủ gục',
      'Gõ trái hoặc phải để chọn bến thi đấu',
      'Theo dõi kênh để được nón lá có nơ và mẻ cá đẹp',
      'Tặng quà để thả thính, quăng lưới, hoặc gọi thủy quái',
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
  return list[i].replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : ''));
}
const kgText = (kg) => (kg >= 10 ? kg.toFixed(1) : kg.toFixed(kg < 1 ? 2 : 1)).replace('.', ',');
const kgSpeak = (kg) => (kg < 1 ? `${Math.round(kg * 10) / 10}`.replace('.', ' phẩy ') : `${Math.round(kg * 10) / 10}`.replace('.', ' phẩy '));

// bỏ dấu tiếng Việt để nhận lệnh dù gõ không dấu
function norm(s) {
  return ` ${String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}
let commandList = [];
let teamList = [];
function buildCommands() {
  commandList = [];
  const cmds = { ...DEFAULTS.commands, ...(config.commands || {}) };
  for (const [act, words] of Object.entries(cmds)) {
    for (const w of words || []) {
      const n = norm(w);
      if (n.trim()) commandList.push({ act, key: n, len: n.length, target: targetOf(w) });
    }
  }
  commandList.sort((a, b) => b.len - a.len);
  teamList = [];
  const tw = { ...DEFAULTS.teamWords, ...(config.teamWords || {}) };
  for (const [side, words] of Object.entries(tw)) for (const w of words || []) teamList.push({ side: side === 'left' ? 0 : 1, key: norm(w).trim() });
}
// "câu chép" → nhắm cá chép
function targetOf(word) {
  const n = norm(word);
  for (const [id, f] of Object.entries(config.fish || DEFAULTS.fish)) {
    if (f.legend) continue;
    const fn = norm(f.name.replace(/^(cá|con)\s+/i, ''));
    if (n.includes(fn)) return id;
  }
  return '';
}
function numberAct(n) {
  const m = n.trim().match(/^([1-7])(?:\s*\1)*$/);
  if (!m) return '';
  const d = m[1];
  if (d === '6') return 'eat';
  if (d === '7') return 'fire';
  for (const [id, b] of Object.entries(config.baits)) if (b.num === d) return id;
  return '';
}
function detectCommand(text) {
  const n = norm(text);
  const num = numberAct(n);
  if (num) return { act: num };
  const whole = n.trim();
  for (const t of teamList) if (whole === t.key) return { act: 'team', side: t.side };
  for (const c of commandList) if (n.includes(c.key)) return { act: c.act, target: c.target };
  const flat = n.replace(/\s+/g, '');
  for (const c of commandList) if (c.len > 6 && flat.includes(c.key.replace(/\s+/g, ''))) return { act: c.act, target: c.target };
  return null;
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

// lớp vẽ sẵn: bờ bên kia (trên nền trời) và bến gỗ (trên mặt nước)
const farLayer = document.createElement('canvas');
farLayer.width = W;
farLayer.height = WATER_Y + 4;
const pierLayer = document.createElement('canvas');
pierLayer.width = W;
pierLayer.height = H;

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
let now = performance.now();
const startTime = now;
const guests = new Map(); // người xem thật
const crowd = []; // người câu không tên ngồi sẵn
let crowdSeq = 0;
const seatOwner = new Array(SEATS.length).fill(null);
const particles = [];
const toasts = [];
const flyers = []; // cá bay từ lưới / mưa cá về giỏ
const teamKg = [0, 0];
let round = { n: 1, start: now, end: now + 5 * 60000, pause: 0, banner: null };
let goal = { i: 0, loop: 0, progress: 0 };
let fireUntil = 0;
let rain = null; // { t0, until }
let nextRainAt = now + 9 * 60000;
let biteBoostUntil = 0;
let goldRushUntil = 0;
let monster = null;
let nextMonsterAt = now + 10 * 60000;
let monsterWarned = false;
let netBoat = null;
let dragon = null;
let vip = null; // { g, until }
const cam = { x: W / 2, y: H / 2, z: 1 };
let camFocusUntil = 0;
let flash = 0;
let bestFish = null; // { name, fish, kg, kind }
let lastNightState = null;
let dayOffset = 0; // giả lập: tua nhanh ngày đêm

function realGuests() {
  return [...guests.values()].filter((g) => g.seat >= 0 && g.state !== 'leave');
}
function allFishers() {
  return [...guests.values(), ...crowd];
}

function teamCount(side) {
  let n = 0;
  for (const g of guests.values()) if (g.seat >= 0 && SEATS[g.seat].side === side) n++;
  return n;
}
function freeSeatOn(side) {
  for (const i of SEAT_ORDER) if (SEATS[i].side === side && !seatOwner[i]) return i;
  return -1;
}
// lấy chỗ trên bến mong muốn: chỗ trống → đuổi người câu không tên → người xem im lặng lâu nhất
function takeSeat(side, forId) {
  let i = freeSeatOn(side);
  if (i >= 0) return i;
  const cr = crowd.filter((c) => c.seat >= 0 && SEATS[c.seat].side === side);
  if (cr.length) {
    const c = pick(cr);
    removeCrowd(c);
    return c.seat;
  }
  let oldest = null;
  for (const g of guests.values()) {
    if (g.id === forId || g.seat < 0 || SEATS[g.seat].side !== side) continue;
    if (now - g.lastActive < 60000) continue;
    if (!oldest || g.lastActive < oldest.lastActive) oldest = g;
  }
  if (oldest) {
    const s = oldest.seat;
    removeGuest(oldest);
    return s;
  }
  return -1;
}
function removeCrowd(c) {
  const i = crowd.indexOf(c);
  if (i >= 0) crowd.splice(i, 1);
  if (c.seat >= 0 && seatOwner[c.seat] === c) seatOwner[c.seat] = null;
  puff(c.x, c.y - 40 * c.s);
}
function removeGuest(g) {
  if (g.seat >= 0 && seatOwner[g.seat] === g) seatOwner[g.seat] = null;
  guests.delete(g.id);
  if (vip && vip.g === g) vip = null;
  puff(g.x, g.y - 40 * g.s);
}

function newFisher(id, look, real, user = null) {
  return {
    id, look, real, user,
    seat: -1, x: 0, y: 0, s: 1, dir: 1, col: 0,
    state: 'idle', t0: now, dur: 0, bait: 'giun', target: '', biteAt: 0, bob: null, caught: null,
    stamina: 100, basket: [], basketKg: 0, best: null, roundKg: 0,
    likes: 0, comments: 0, shares: 0, coins: 0, boost: 0, followBoost: 0, goldRod: false, bow: false,
    lastActive: now, autoAt: now + rand(4000, 15000), bubble: null, happyUntil: 0, born: now,
    phase: Math.random() * 10, pulls: 0, warned: false,
  };
}
function placeAt(p, seat) {
  p.seat = seat;
  seatOwner[seat] = p;
  const st = SEATS[seat];
  p.x = st.x;
  p.y = st.y;
  p.s = st.s;
  p.dir = st.dir;
  p.col = st.col;
  p.bob = null;
  if (p.state !== 'sleep') setState(p, 'idle');
}

function ensureGuest(user, { announceJoin = false, side = -1 } = {}) {
  if (!user || !user.id) return null;
  let g = guests.get(user.id);
  if (g) {
    g.user = { ...g.user, ...user };
    g.lastActive = now;
    return g;
  }
  const want = side >= 0 ? side : teamCount(0) <= teamCount(1) ? 0 : 1;
  let seat = takeSeat(want, user.id);
  if (seat < 0) seat = takeSeat(1 - want, user.id);
  if (seat < 0) return null;
  g = newFisher(user.id, lookFor(user.id), true, user);
  guests.set(user.id, g);
  placeAt(g, seat);
  sparks(g.x, g.y - 50 * g.s, 16);
  if (announceJoin && config.voiceJoin !== false) announce(line('join', { name: user.name }), 0);
  addToast(`👋 ${truncate(user.name, 18)} xuống ${TEAM[SEATS[seat].side].name}`, TEAM[SEATS[seat].side].light);
  return g;
}

function moveTeam(g, side) {
  if (g.seat >= 0 && SEATS[g.seat].side === side) {
    say(g, `Mình ở ${TEAM[side].name} rồi!`, 2200);
    return;
  }
  const seat = takeSeat(side, g.id);
  if (seat < 0) {
    say(g, `${TEAM[side].name} hết chỗ rồi`, 2200);
    return;
  }
  if (g.seat >= 0 && seatOwner[g.seat] === g) seatOwner[g.seat] = null;
  puff(g.x, g.y - 40 * g.s);
  placeAt(g, seat);
  g.roundKg = 0;
  sparks(g.x, g.y - 50 * g.s, 20, [TEAM[side].color, '#fff']);
  say(g, `Sang ${TEAM[side].name}!`, 2200);
  sfx.pop();
}

function setState(p, st, dur = 0) {
  p.state = st;
  p.t0 = now;
  p.dur = dur;
}
function say(p, text, ms = 3200) {
  p.bubble = { text, until: now + ms, born: now };
}
function headPos(p) {
  return { x: p.x + 3 * p.s * p.dir, y: p.y - 70 * p.s, s: p.s };
}

// ------------------------------------------------------------------ hạt hiệu ứng
function addParticle(o) {
  if (particles.length > 900) particles.shift();
  particles.push({ vx: 0, vy: 0, g: 0, rot: 0, vr: 0, size: 10, born: now, ...o });
}
function hearts(x, y, n) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'heart', x: x + rand(-14, 14), y, vx: rand(-30, 30), vy: rand(-120, -70), life: 1300, size: rand(12, 20), color: pick(['#ff4d6d', '#ff8fa3', '#ff2e63']) });
}
function sparks(x, y, n, colors = ['#ffe066', '#fff3b0', '#ffb300']) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(60, 260);
    addParticle({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 220, life: rand(500, 1000), size: rand(3, 7), color: pick(colors) });
  }
}
function drops(x, y, n, big = false) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'drop', x: x + rand(-10, 10), y, vx: rand(-90, 90) * (big ? 2 : 1), vy: rand(-280, -120) * (big ? 1.6 : 1), g: 700, life: rand(500, 900), size: rand(3, 6) * (big ? 1.6 : 1) });
}
function ripple(x, y, big = false) {
  addParticle({ kind: 'ring', x, y, life: big ? 1400 : 900, size: big ? 60 : 24 });
}
function confetti(x, y, n) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'confetti', x: x + rand(-60, 60), y: y + rand(-30, 30), vx: rand(-260, 260), vy: rand(-520, -160), g: 380, life: rand(1600, 2600), size: rand(7, 12), rot: rand(0, TAU), vr: rand(-8, 8), color: pick(['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#e040fb', '#ffab40']) });
}
function puff(x, y) {
  for (let i = 0; i < 8; i++) addParticle({ kind: 'smoke', x: x + rand(-20, 20), y: y + rand(-20, 20), vx: rand(-30, 30), vy: rand(-50, -10), life: 700, size: rand(12, 22) });
}
function zzz(x, y) {
  addParticle({ kind: 'z', x, y, vx: rand(10, 25), vy: -30, life: 1800, size: rand(16, 24) });
}
function addToast(text, color = '#fff') {
  toasts.push({ text, color, born: now });
  if (toasts.length > 4) toasts.shift();
}

// ------------------------------------------------------------------ lời dẫn
const captions = [];
let lastAnnounce = performance.now();
let lastSpoken = -1e9;
function announce(text, priority = 0, force = false) {
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
  captions.push({ text, priority });
  captions.sort((a, b) => b.priority - a.priority);
  if (captions.length > 4) captions.length = 4;
}

// ------------------------------------------------------------------ ngày đêm, mưa, lửa
function dayPhase() {
  const cyc = Math.max(2, Number(config.dayMinutes) || 15) * 60000;
  return (((now - startTime + dayOffset) / cyc) + 0.08) % 1;
}
// ngày 0..0.45, chiều 0.45..0.55, đêm 0.55..0.92, rạng sáng 0.92..1
function skyState() {
  const p = dayPhase();
  let night = 0;
  let dusk = 0;
  if (p < 0.45) night = 0;
  else if (p < 0.55) {
    const k = (p - 0.45) / 0.1;
    dusk = Math.sin(k * Math.PI);
    night = ease(k);
  } else if (p < 0.92) night = 1;
  else {
    const k = (p - 0.92) / 0.08;
    night = 1 - ease(k);
    dusk = Math.sin(k * Math.PI) * 0.6;
  }
  return { night, dusk };
}
const isNight = () => skyState().night > 0.6;
const fireOn = () => now < fireUntil;
function rainLevel() {
  if (!rain) return 0;
  const a = clamp((now - rain.t0) / 3000, 0, 1);
  const b = clamp((rain.until - now) / 3000, 0, 1);
  return Math.min(a, b);
}
function startRain() {
  if (rain || monster) return;
  rain = { t0: now, until: now + Math.max(15, Number(config.rainSeconds) || 60) * 1000 };
  sfx.thunder();
  flash = 0.9;
  announce(line('rain'), 1);
  addToast('🌧 Trời đổ mưa! Tặng quà để tạnh', '#b3e5fc');
}
function stopRain(by) {
  if (!rain) return;
  rain.until = Math.min(rain.until, now + 3000);
  if (by) addToast(`☀ ${truncate(by, 16)} làm trời tạnh mưa`, '#fff59d');
}
function lightFire(g) {
  const was = fireOn();
  fireUntil = Math.max(fireUntil, now) + Math.max(20, Number(config.fireSeconds) || 90) * 1000;
  fireUntil = Math.min(fireUntil, now + 5 * 60000);
  sfx.fire();
  sparks(RAFT.x + 48, RAFT.y - 40, 30, ['#ffb300', '#ff6f00', '#fff59d']);
  if (g) {
    g.stamina = Math.min(100, g.stamina + 8);
    if (!was) announce(line('fire', { name: g.user.name }), 0);
    addToast(`🔥 ${truncate(g.user.name, 16)} đốt lửa sưởi cả bến`, '#ffcc80');
    say(g, 'Lửa lên rồi, sưởi đi cả nhà!', 2400);
  }
}

// ------------------------------------------------------------------ câu cá
function bobberSpot(p) {
  const st = SEATS[p.seat];
  const off = st.col === 0 ? rand(85, 170) : rand(275, 360);
  return { x: st.x + st.dir * off, y: st.y - 34 + rand(-16, 16) };
}
function biteWait(p) {
  const b = config.baits[p.bait] || config.baits.giun;
  let ms = rand(b.wait[0], b.wait[1]) * 1000;
  if (now < biteBoostUntil) ms *= 0.45;
  if (now < goldRushUntil) ms *= 0.6;
  if (rain) ms *= 1.6;
  if (b.night && isNight()) ms *= 0.7;
  if (p.auto) ms *= 1.8;
  return ms;
}
function startCast(p, bait, target = '', auto = false) {
  if (p.seat < 0) return false;
  if (p.state === 'sleep') {
    if (p.real) say(p, 'Đói lả rồi... gõ 6 nướng cá!', 2600);
    return false;
  }
  if (['reel', 'show', 'eat', 'tug', 'cast'].includes(p.state) || (vip && vip.g === p)) {
    // đang bận: nhớ mồi cho lần quăng sau
    p.bait = bait || p.bait;
    p.target = target || p.target;
    p.nextCast = true;
    return false;
  }
  p.bait = bait || p.bait || 'giun';
  p.target = target;
  p.auto = auto;
  setState(p, 'cast', 650);
  p.bob = null;
  sfx.cast();
  return true;
}
function rollCatch(p) {
  const F = config.fish;
  const b = config.baits[p.bait] || config.baits.giun;
  const boosted = p.boost > 0;
  const follow = p.followBoost > 0;
  let legendChance = Number(config.legendChance) || 0.004;
  if (boosted) legendChance = 0.08;
  if (now < goldRushUntil) legendChance = Math.max(legendChance, 0.07);
  if (p.forceLegend) legendChance = 1;
  if (boosted) p.boost--;
  if (follow) p.followBoost--;
  if (p.real && Math.random() < legendChance) {
    p.forceLegend = false;
    const kind = isNight() || p.bait === 'tanh' ? 'trekhong' : 'chepvang';
    const f = F[kind];
    return { kind, name: f.name, kg: rand(f.min, f.max), legend: true };
  }
  if (!boosted && !follow && Math.random() < (Number(config.junkChance) || 0.05)) {
    const ids = Object.keys(config.junk);
    const kind = pick(ids);
    return { kind, name: config.junk[kind], kg: 0, junk: true };
  }
  let kind = '';
  if (p.target && b.pool[p.target] && Math.random() < 0.6) kind = p.target;
  if (!kind) {
    const entries = Object.entries(b.pool).map(([k, w]) => [k, w * (isNight() && (k === 'tre' || k === 'luon') ? 1.6 : 1)]);
    let r = Math.random() * entries.reduce((a, [, w]) => a + w, 0);
    for (const [k, w] of entries) {
      r -= w;
      if (r <= 0) {
        kind = k;
        break;
      }
    }
    kind = kind || entries[0][0];
  }
  const f = F[kind] || F.ro;
  let t = Math.random() ** 1.7;
  if (follow) t = rand(0.7, 1);
  let kg = f.min + (f.max - f.min) * t;
  if (boosted) kg *= 2;
  if (!p.real) kg = f.min + (f.max - f.min) * Math.random() * 0.4;
  return { kind, name: f.name, kg, boosted, follow };
}

function fishLen(c) {
  if (c.junk) return 46;
  if (c.legend) return 120;
  return clamp(30 + Math.sqrt(c.kg) * 26, 30, 110);
}

function landCatch(p, c, { silent = false } = {}) {
  if (!c) return;
  if (c.junk) {
    if (p.real && !silent) {
      say(p, pick(['Ơ... cái dép?', 'Xui thế không biết', 'Rác ai vứt đây!']), 2400);
      sfx.junk();
      if (Math.random() < 0.35) announce(line('junkLine', { name: p.user.name, fish: c.name.toLowerCase() }), -1);
    }
    return;
  }
  if (!p.real) return;
  p.basket.push({ kind: c.kind, kg: c.kg, name: c.name });
  p.basketKg += c.kg;
  if (!p.best || c.kg > p.best.kg) p.best = { kind: c.kind, kg: c.kg, name: c.name };
  if (p.seat >= 0 && round.pause === 0) {
    teamKg[SEATS[p.seat].side] += c.kg;
    p.roundKg += c.kg;
  }
  const isRecord = !bestFish || c.kg > bestFish.kg;
  if (isRecord) bestFish = { name: p.user.name, fish: c.name, kg: c.kg, kind: c.kind };
  if (silent) return;
  const h = headPos(p);
  const vars = { name: p.user.name, fish: c.name.toLowerCase(), kg: kgSpeak(c.kg) };
  if (c.legend) {
    sfx.legendary();
    flash = 0.7;
    confetti(h.x, h.y, 80);
    sparks(h.x, h.y, 50);
    addToast(`🌟 ${truncate(p.user.name, 14)}: ${c.name} ${kgText(c.kg)}kg!`, '#ffd54a');
    announce(line('legend', vars), 2, true);
    focusCam(h.x, h.y + 40, 4000);
  } else if (c.kg >= 5) {
    sfx.caught(2);
    confetti(h.x, h.y, 30);
    addToast(`🐟 ${truncate(p.user.name, 14)}: ${c.name} ${kgText(c.kg)}kg`, '#a5f3fc');
    announce(line('big', vars), 1);
  } else {
    sfx.caught(c.kg >= 1.5 ? 1 : 0);
    if (isRecord && c.kg >= 1) addToast(`🏆 Kỷ lục mới: ${c.name} ${kgText(c.kg)}kg`, '#ffe082');
  }
  if (c.boosted) sparks(h.x, h.y, 20, ['#7cf7ff', '#fff']);
}

function eat(p) {
  if (p.seat < 0) return;
  if (['reel', 'show', 'tug'].includes(p.state)) {
    p.wantEat = true;
    return;
  }
  let gain = 12;
  let what = 'củ khoai nướng';
  const fishes = p.basket.filter((f) => !FISH_ART[f.kind] || !config.fish[f.kind]?.legend);
  if (fishes.length) {
    const smallest = fishes.reduce((a, b) => (b.kg < a.kg ? b : a));
    p.basket.splice(p.basket.indexOf(smallest), 1);
    p.basketKg = Math.max(0, p.basketKg - smallest.kg);
    gain = Math.min(80, 25 + smallest.kg * 12);
    what = smallest.name.toLowerCase();
    p.eating = smallest.kind;
  } else p.eating = '';
  const wasSleep = p.state === 'sleep';
  p.stamina = Math.min(100, p.stamina + gain);
  setState(p, 'eat', 2800);
  sfx.sizzle();
  setTimeout(() => sfx.crunch(), 900);
  say(p, p.eating ? `Nướng ${what}, ngon quá!` : 'Giỏ trống, ăn tạm củ khoai', 2600);
  if (wasSleep || Math.random() < 0.3) announce(line('eat', { name: p.user.name }), 0);
  const h = headPos(p);
  for (let i = 0; i < 6; i++) addParticle({ kind: 'smoke', x: h.x + p.dir * 20, y: h.y, vx: rand(-10, 10), vy: rand(-60, -30), life: 1200, size: rand(8, 14) });
}

// ------------------------------------------------------------------ máy ảnh
function focusCam(x, y, ms) {
  cam.tx = clamp(x, W / 2 / (config.cameraZoom || 1.25), W - W / 2 / (config.cameraZoom || 1.25));
  cam.ty = clamp(y, H / 2 / (config.cameraZoom || 1.25), H - H / 2 / (config.cameraZoom || 1.25));
  camFocusUntil = now + ms;
}

// ------------------------------------------------------------------ đấu 2 bến
function startRound() {
  round.n += round.banner ? 1 : 0;
  round.start = now;
  round.end = now + Math.max(1, Number(config.matchMinutes) || 5) * 60000;
  round.pause = 0;
  round.banner = null;
  teamKg[0] = 0;
  teamKg[1] = 0;
  for (const g of guests.values()) g.roundKg = 0;
  announce(line('roundStart'), 0);
}
function endRound() {
  if (round.pause) return;
  const [a, b] = teamKg;
  const winner = Math.abs(a - b) < 0.05 ? -1 : a > b ? 0 : 1;
  let mvp = null;
  for (const g of guests.values()) {
    if (g.seat < 0 || (winner >= 0 && SEATS[g.seat].side !== winner)) continue;
    if (g.roundKg > 0 && (!mvp || g.roundKg > mvp.roundKg)) mvp = g;
  }
  round.pause = now + 7000;
  round.banner = { winner, kg: winner >= 0 ? teamKg[winner] : a, mvp: mvp ? mvp.user.name : '', born: now };
  sfx.gong();
  if (winner >= 0) {
    setTimeout(() => sfx.cheer(), 600);
    for (const g of guests.values()) {
      if (g.seat >= 0 && SEATS[g.seat].side === winner && ['idle', 'wait'].includes(g.state)) {
        g.cheerUntil = now + 4000;
        g.happyUntil = now + 4000;
      }
    }
    confetti(winner === 0 ? 170 : W - 170, 1000, 120);
    if (realGuests().length) announce(line('roundWin', { team: TEAM[winner].name.toLowerCase(), kg: kgSpeak(teamKg[winner]), name: mvp ? mvp.user.name : 'cả bến' }), 2, true);
  } else if (realGuests().length) announce(line('roundDraw'), 1);
}

// ------------------------------------------------------------------ mục tiêu chung
function currentGoal() {
  const list = Array.isArray(config.goals) && config.goals.length ? config.goals : DEFAULTS.goals;
  const g = list[goal.i % list.length];
  const mult = 1.5 ** goal.loop;
  return { ...g, target: Math.round((Number(g.target) || 100) * mult) };
}
function addGoal(type, n) {
  const g = currentGoal();
  if (g.type !== type) return;
  goal.progress += n;
  if (goal.progress >= g.target) {
    goal.progress = 0;
    const list = Array.isArray(config.goals) && config.goals.length ? config.goals : DEFAULTS.goals;
    goal.i++;
    if (goal.i % list.length === 0) goal.loop++;
    reward(g);
  }
}
function reward(g) {
  sfx.fanfare();
  flash = 0.6;
  confetti(W / 2, 760, 140);
  const label = g.label || '';
  if (g.reward === 'dragonBoat') {
    dragon = { t0: now, dur: 9000 };
    sfx.drum(14);
    for (const p of guests.values()) p.boost++;
    announce(line('goal', { reward: 'Thuyền rồng đi qua, mẻ tới của cả bến to gấp đôi' }), 2, true);
    addToast('🐉 THUYỀN RỒNG! Mẻ tới cả bến cá to x2', '#ffd54a');
  } else if (g.reward === 'goldRush') {
    goldRushUntil = now + 40000;
    announce(line('goal', { reward: 'Giờ cá vàng bắt đầu, cá huyền thoại cắn câu liên tục' }), 2, true);
    addToast('✨ GIỜ CÁ VÀNG 40 giây!', '#ffd54a');
  } else {
    // mưa cá: mỗi người câu được 1 con ngay
    announce(line('goal', { reward: 'Mưa cá. Cá từ trên trời rơi xuống giỏ cả bến' }), 2, true);
    addToast('🐟 MƯA CÁ! Ai cũng có cá', '#a5f3fc');
    for (let i = 0; i < 26; i++) addParticle({ kind: 'rainfish', x: rand(330, 750), y: rand(560, 800), vy: rand(300, 520), vx: rand(-40, 40), g: 200, life: 2600, size: rand(30, 52), fish: pick(['ro', 'diec', 'chep', 'me', 'loc']), rot: rand(-1, 1), vr: rand(-4, 4) });
    let k = 0;
    for (const p of realGuests()) {
      const pool = pick(['giun', 'com', 'tom']);
      const old = p.bait;
      p.bait = pool;
      const c = rollCatch(p);
      p.bait = old;
      if (c.junk) continue;
      setTimeout(() => flyFishTo(p, c, rand(100, W - 100), 300), 600 + (k++ % 20) * 120);
    }
  }
  if (label) goal.lastReward = { label, at: now };
}

// cá bay từ một điểm vào tay người câu
function flyFishTo(p, c, fx, fy) {
  if (!guests.has(p.id) || p.seat < 0) return;
  flyers.push({ p, c, x0: fx, y0: fy, t0: now, dur: 1100 });
}

// ------------------------------------------------------------------ thuyền thúng quăng lưới (quà vừa)
function startNetBoat(g, giftLabel) {
  netBoat = { g, t0: now, dur: 8000, cast: false, pulled: false, giftLabel };
}
function updateNetBoat() {
  if (!netBoat) return;
  const k = (now - netBoat.t0) / netBoat.dur;
  if (k > 0.42 && !netBoat.cast) {
    netBoat.cast = true;
    netBoat.castAt = now;
    sfx.splash(true);
  }
  if (k > 0.6 && !netBoat.pulled) {
    netBoat.pulled = true;
    sfx.splash(true);
    drops(540, 1260, 30, true);
    const list = realGuests().sort(() => Math.random() - 0.5);
    const n = Math.min(list.length, 5);
    const targets = [netBoat.g, ...list.filter((x) => x !== netBoat.g)].filter((x) => x && guests.has(x.id)).slice(0, n + 1);
    targets.forEach((p, i) => {
      const old = p.bait;
      p.bait = pick(['com', 'ngo', 'tom']);
      const c = rollCatch(p);
      p.bait = old;
      if (c.junk) return;
      setTimeout(() => flyFishTo(p, c, 540 + rand(-40, 40), 1240), i * 220);
    });
  }
  if (k >= 1) netBoat = null;
}

// ------------------------------------------------------------------ thủy quái
const MONSTER_POS = { x: 540, y: 1180 };
function startMonster(donor = null) {
  if (monster) return;
  if (rain) rain.until = Math.min(rain.until, now + 2000);
  const n = realGuests().length;
  const hp = Math.max(120, n * 30);
  monster = { t0: now, until: now + Math.max(20, Number(config.monsterSeconds) || 60) * 1000, hp, maxHp: hp, donor, hurt: 0, end: null };
  monsterWarned = false;
  sfx.roar();
  flash = 0.5;
  announce(line('monster'), 2, true);
  for (const p of allFishers()) {
    if (p.seat < 0 || p.state === 'sleep') continue;
    p.pulls = 0;
    setState(p, 'tug');
  }
  if (donor) {
    vip = { g: donor, until: monster.until + 4000 };
    setState(donor, 'tug');
  }
}
function damageMonster(n, g) {
  if (!monster || monster.end) return;
  monster.hp -= n;
  monster.hurt = 1;
  if (g) g.pulls = (g.pulls || 0) + n;
  if (Math.random() < 0.5) sfx.tug();
  if (Math.random() < 0.3) drops(MONSTER_POS.x + rand(-100, 100), MONSTER_POS.y + 100, 3);
  if (monster.hp <= 0) endMonster(true);
}
function endMonster(win) {
  if (!monster || monster.end) return;
  monster.end = { win, at: now };
  monster.endUntil = now + 3500;
  for (const p of allFishers()) if (p.state === 'tug' && !(vip && vip.g === p)) setState(p, 'idle');
  const ps = realGuests();
  if (win) {
    sfx.splash(true);
    setTimeout(() => sfx.cheer(), 300);
    setTimeout(() => sfx.fanfare(), 900);
    confetti(540, 1000, 160);
    drops(540, 1250, 50, true);
    announce(line('monsterWin'), 2, true);
    const top = [...ps].sort((a, b) => (b.pulls || 0) - (a.pulls || 0)).filter((x) => x.pulls > 0).slice(0, 3);
    if (top.length) addToast(`🏆 Kéo khoẻ nhất: ${top.map((x) => truncate(x.user.name, 10)).join(', ')}`, '#ffd54a');
    ps.forEach((p, i) => {
      const old = p.bait;
      p.bait = pick(['com', 'ngo']);
      const c = rollCatch(p);
      p.bait = old;
      if (monster.donor === p) {
        const f = config.fish.chepvang;
        Object.assign(c, { kind: 'chepvang', name: f.name, kg: rand(f.min, f.max), legend: true, junk: false });
      } else if (c.junk) return;
      setTimeout(() => flyFishTo(p, c, MONSTER_POS.x, MONSTER_POS.y - 60), 700 + (i % 20) * 140);
    });
  } else {
    sfx.roar();
    sfx.splash(true);
    announce(line('monsterLose'), 2, true);
    addToast('🐉 Thủy quái thoát, cướp mất cá!', '#ff8a80');
    for (const p of ps) {
      if (!p.basket.length) continue;
      const lose = Math.max(1, Math.floor(p.basket.length * 0.2));
      for (let i = 0; i < lose; i++) {
        const f = p.basket.splice(Math.floor(Math.random() * p.basket.length), 1)[0];
        if (f) p.basketKg = Math.max(0, p.basketKg - f.kg);
      }
      say(p, pick(['Mất cá rồi!', 'Huhu giỏ cá của tôi', 'Đồ thủy quái!']), 2200);
    }
  }
}
function updateMonster(dt) {
  if (!monster) {
    if (!monsterWarned && nextMonsterAt - now < 10000 && !round.pause) {
      monsterWarned = true;
      announce(line('monsterWarn'), 1);
      addToast('🫧 Mặt nước sủi bọt... thủy quái sắp lên!', '#b9f6ca');
    }
    if (nextMonsterAt - now < 10000 && Math.random() < dt * 20) addParticle({ kind: 'bubble', x: MONSTER_POS.x + rand(-120, 120), y: MONSTER_POS.y + rand(0, 160), vy: -40, life: 900, size: rand(4, 10) });
    if (now >= nextMonsterAt) startMonster();
    return;
  }
  monster.hurt = Math.max(0, monster.hurt - dt * 3);
  if (!monster.end && now >= monster.until) endMonster(false);
  if (monster.end && now >= monster.endUntil) {
    monster = null;
    nextMonsterAt = now + Math.max(2, Number(config.monsterMinutes) || 10) * 60000;
    for (const p of allFishers()) if (p.state === 'tug') setState(p, 'idle');
    if (vip) vip.until = Math.min(vip.until, now + 3000);
  }
}

// ------------------------------------------------------------------ sự kiện TikTok
function handleEvent(ev) {
  now = performance.now();
  const user = ev.user;
  switch (ev.type) {
    case 'join': {
      if (user) ensureGuest(user, { announceJoin: !guests.has(user.id) });
      break;
    }
    case 'chat': {
      if (!user) break;
      const text = String(ev.text || '').trim();
      const cmd = detectCommand(text);
      const g = ensureGuest(user, { side: cmd && cmd.act === 'team' ? cmd.side : -1 });
      if (!g) break;
      g.comments++;
      if (monster && !monster.end) damageMonster(3, g);
      if (cmd) {
        if (cmd.act === 'team') moveTeam(g, cmd.side);
        else if (cmd.act === 'eat') eat(g);
        else if (cmd.act === 'fire') lightFire(g);
        else if (config.baits[cmd.act]) {
          const b = config.baits[cmd.act];
          if (startCast(g, cmd.act, cmd.target)) say(g, `Mồi ${b.label.toLowerCase()}!`, 1600);
        }
      } else if (text) say(g, text, 5000);
      break;
    }
    case 'like': {
      if (!user) break;
      const g = ensureGuest(user);
      if (!g) break;
      const n = clamp(Number(ev.count) || 1, 1, 100);
      g.likes += n;
      addGoal('like', n);
      g.stamina = Math.min(100, g.stamina + Math.min(6, n * 1.5));
      if (g.state === 'sleep' && g.stamina >= 12) {
        setState(g, 'idle');
        say(g, 'Ơ, tỉnh rồi!', 1800);
      }
      if (monster && !monster.end) damageMonster(n, g);
      else if (g.state === 'wait') g.biteAt = Math.max(now + 250, g.biteAt - n * 900);
      else if (g.state === 'idle') g.autoAt = Math.min(g.autoAt, now + 600);
      const h = headPos(g);
      hearts(h.x, h.y - 30 * h.s, Math.min(6, n));
      sfx.pop();
      break;
    }
    case 'follow': {
      if (!user) break;
      const g = ensureGuest(user);
      if (!g) break;
      g.bow = true;
      g.followBoost = Math.max(g.followBoost, 1);
      g.happyUntil = now + 3000;
      const h = headPos(g);
      sparks(h.x, h.y - 30, 30);
      sfx.sparkle();
      addToast(`⭐ ${truncate(user.name, 16)} theo dõi: nón lá có nơ`, '#ffd54a');
      say(g, 'Mẻ tới chắc chắn cá đẹp!', 2600);
      announce(line('follow', { name: user.name }), 1);
      if (g.state === 'idle') g.autoAt = now + 400;
      break;
    }
    case 'share': {
      if (!user) break;
      const g = ensureGuest(user);
      if (!g) break;
      g.shares++;
      g.boost = Math.min(5, g.boost + 1);
      addGoal('share', 1);
      if (monster && !monster.end) damageMonster(15, g);
      if (g.shares === 3) {
        g.goldRod = true;
        addToast(`🎣 ${truncate(user.name, 16)} được cần tre vàng`, '#ffd54a');
      }
      const h = headPos(g);
      confetti(h.x, h.y, 24);
      sfx.sparkle();
      addToast(`📣 ${truncate(user.name, 16)} chia sẻ: cá tới to x2`, '#7cf7ff');
      announce(line('share', { name: user.name }), 0);
      if (g.state === 'idle') g.autoAt = now + 400;
      break;
    }
    case 'giftStreak': {
      if (!user) break;
      const g = ensureGuest(user);
      if (!g) break;
      const h = headPos(g);
      sparks(h.x, h.y, 6);
      break;
    }
    case 'gift': {
      if (!user) break;
      const g = ensureGuest(user);
      if (!g) break;
      const coinsN = Number(ev.coins) || (Number(ev.diamonds) || 1) * (Number(ev.repeatCount) || 1);
      const giftLabel = `${ev.giftName || 'quà'}${Number(ev.repeatCount) > 1 ? ` x${ev.repeatCount}` : ''}`;
      g.coins += coinsN;
      g.happyUntil = now + 4000;
      g.stamina = 100;
      if (g.state === 'sleep') setState(g, 'idle');
      if (rain) stopRain(user.name);
      const tiers = { ...DEFAULTS.giftTiers, ...(config.giftTiers || {}) };
      const h = headPos(g);
      if (monster && !monster.end) {
        damageMonster(Math.max(20, coinsN * 5), g);
        addToast(`🎁 ${truncate(user.name, 14)} tặng ${truncate(giftLabel, 14)}: kéo mạnh!`, '#ffd54a');
        announce(`Cảm ơn ${user.name} đã tặng ${giftLabel}, kéo mạnh lên`, 1);
        sparks(h.x, h.y, 30);
        sfx.sparkle();
        break;
      }
      if (coinsN >= tiers.big) {
        addToast(`💎 ${truncate(user.name, 14)} tặng ${truncate(giftLabel, 16)}: GỌI THỦY QUÁI`, '#ffd54a');
        announce(line('bigGift', { name: user.name, gift: giftLabel }), 2, true);
        sfx.fanfare();
        flash = 0.8;
        confetti(W / 2, 700, 120);
        setTimeout(() => startMonster(g), 1800);
      } else if (coinsN >= tiers.medium) {
        addToast(`🎁 ${truncate(user.name, 14)} tặng ${truncate(giftLabel, 16)}: quăng lưới`, '#ff9de2');
        announce(line('mediumGift', { name: user.name, gift: giftLabel }), 1);
        sfx.sparkle();
        confetti(h.x, h.y, 40);
        startNetBoat(g, giftLabel);
      } else {
        addToast(`🎁 ${truncate(user.name, 14)} tặng ${truncate(giftLabel, 16)}: thả thính`, '#ffe9a8');
        announce(line('gift', { name: user.name, gift: giftLabel }), 1);
        sfx.sparkle();
        sparks(h.x, h.y, 22);
        biteBoostUntil = Math.max(biteBoostUntil, now) + 30000;
        g.boost = Math.min(5, g.boost + 1);
        // nắm thính bay ra giữa sông
        for (let i = 0; i < 14; i++) addParticle({ kind: 'bait', x: h.x, y: h.y, vx: (SEATS[g.seat].dir * rand(150, 380)), vy: rand(-380, -200), g: 600, life: 1100, size: rand(4, 7) });
        if (g.state === 'idle') startCast(g, g.bait);
        else if (g.state === 'wait') g.biteAt = Math.min(g.biteAt, now + 700);
      }
      break;
    }
    // ------- nút thử ở bảng điều khiển
    case 'monster':
      if (!monster) startMonster();
      break;
    case 'rain':
      if (rain) stopRain('Bảng điều khiển');
      else startRain();
      break;
    case 'skipTime': {
      dayOffset += Math.max(2, Number(config.dayMinutes) || 15) * 60000 * 0.25;
      break;
    }
    case 'goal': {
      const gg = currentGoal();
      addGoal(gg.type, gg.target);
      break;
    }
    case 'endRound':
      endRound();
      break;
    case 'starve':
      for (const p of guests.values()) p.stamina = Math.min(p.stamina, 3);
      break;
    case 'voiceTest':
      announce('Xin chào cả nhà. Mời mọi người ra bến ngồi câu. Gõ số một để câu bằng giun nhé', 2, true);
      break;
    case 'reset':
      for (const g of guests.values()) if (g.seat >= 0) seatOwner[g.seat] = null;
      guests.clear();
      vip = null;
      monster = null;
      netBoat = null;
      dragon = null;
      rain = null;
      flyers.length = 0;
      particles.length = 0;
      teamKg[0] = 0;
      teamKg[1] = 0;
      bestFish = null;
      goal = { i: 0, loop: 0, progress: 0 };
      nextMonsterAt = now + Math.max(2, Number(config.monsterMinutes) || 10) * 60000;
      round = { n: 1, start: now, end: now + Math.max(1, Number(config.matchMinutes) || 5) * 60000, pause: 0, banner: null };
      break;
    default:
      break;
  }
}

// ------------------------------------------------------------------ cập nhật
function refillCrowd() {
  const want = Math.max(0, Number(config.ambientCrowd) || 0);
  const realN = realGuests().length;
  const target = Math.max(0, Math.min(want, SEATS.length - realN - 6));
  if (crowd.length < target) {
    const side = crowd.filter((c) => SEATS[c.seat].side === 0).length <= crowd.filter((c) => SEATS[c.seat].side === 1).length ? 0 : 1;
    // người câu không tên ngồi tầng ngoài cùng trước, nhường chỗ giữa cho người xem
    const order = [...SEAT_ORDER].reverse();
    let seat = order.find((i) => SEATS[i].side === side && !seatOwner[i]);
    if (seat == null) seat = order.find((i) => !seatOwner[i]);
    if (seat == null) return;
    const c = newFisher(`crowd-${crowdSeq}`, crowdLook(crowdSeq++), false);
    placeAt(c, seat);
    c.autoAt = now + rand(1000, 8000);
    crowd.push(c);
  } else if (crowd.length > target + 1) removeCrowd(crowd[0]);
}

function updateFisher(p, dt) {
  const k = p.dur ? (now - p.t0) / p.dur : 0;
  // thể lực
  if (p.real && p.state !== 'eat') {
    const base = 100 / (Math.max(1, Number(config.staminaMinutes) || 5) * 60);
    let mult = 1;
    if (isNight() && !fireOn()) mult *= 1.8;
    if (rain) mult *= 1.5;
    if (vip && vip.g === p) mult = 0;
    p.stamina = Math.max(0, p.stamina - base * mult * dt);
    if (p.stamina <= 0 && p.state !== 'sleep' && !['reel', 'show', 'tug'].includes(p.state)) {
      setState(p, 'sleep');
      p.bob = null;
      announce(line('sleep', { name: p.user.name }), 0);
      say(p, 'Đói quá... khò khò', 2200);
    }
    if (p.stamina < 25 && !p.warned && p.state !== 'sleep') {
      p.warned = true;
      say(p, 'Đói rồi, gõ 6 nướng cá!', 2600);
    }
    if (p.stamina > 40) p.warned = false;
    if (now - p.lastActive > Math.max(1, Number(config.idleMinutes) || 15) * 60000 && !(vip && vip.g === p)) {
      removeGuest(p);
      return;
    }
  }
  switch (p.state) {
    case 'idle':
      if (p.wantEat) {
        p.wantEat = false;
        eat(p);
        break;
      }
      if (p.nextCast) {
        p.nextCast = false;
        startCast(p, p.bait, p.target);
        break;
      }
      if (now > p.autoAt && !monster) {
        p.autoAt = now + Math.max(8, Number(config.autoFishSeconds) || 25) * 1000 * rand(0.8, 1.3);
        startCast(p, p.real ? p.bait : pick(['giun', 'giun', 'com', 'tom']), p.target, true);
      }
      break;
    case 'cast':
      if (k >= 1) {
        p.bob = bobberSpot(p);
        setState(p, 'wait');
        p.biteAt = now + biteWait(p);
        sfx.plop(p.real ? 1 : 0.4);
        ripple(p.bob.x, p.bob.y);
        drops(p.bob.x, p.bob.y, 4);
      }
      break;
    case 'wait':
      if (monster) break;
      if (now >= p.biteAt) {
        setState(p, 'bite', 800);
        if (p.real) sfx.bite();
        ripple(p.bob.x, p.bob.y);
      }
      break;
    case 'bite':
      if (k >= 1) {
        p.caught = rollCatch(p);
        setState(p, 'reel', 1100);
        if (p.real) {
          sfx.reel(1);
          sfx.splash(p.caught.kg >= 3 || p.caught.legend);
        }
        drops(p.bob.x, p.bob.y, p.caught.kg >= 3 ? 14 : 6, p.caught.kg >= 3);
      }
      break;
    case 'reel':
      if (k >= 1) {
        setState(p, 'show', p.caught && (p.caught.legend || p.caught.kg >= 5) ? 2600 : 1700);
        landCatch(p, p.caught);
        p.happyUntil = now + 1700;
      }
      break;
    case 'show':
      if (k >= 1) {
        p.caught = null;
        p.bob = null;
        setState(p, 'idle');
        // vừa bình luận gần đây thì tự quăng tiếp với mồi cũ
        if (p.real && now - p.lastActive < 45000) p.autoAt = now + rand(600, 1500);
        else p.autoAt = now + Math.max(8, Number(config.autoFishSeconds) || 25) * 1000 * rand(0.8, 1.3);
      }
      break;
    case 'eat':
      if (k >= 1) {
        setState(p, 'idle');
        p.autoAt = now + rand(800, 2000);
      }
      break;
    case 'sleep':
      if (Math.random() < dt * 0.8) {
        const h = headPos(p);
        zzz(h.x + p.dir * 14, h.y - 10);
        if (p.real) sfx.snore();
      }
      break;
    case 'tug':
      if (!monster) setState(p, 'idle');
      break;
    default:
      break;
  }
  if (p.bubble && now > p.bubble.until) p.bubble = null;
}

function update(dt) {
  // camera
  const zoom = Number(config.cameraZoom) || 1.25;
  const tz = now < camFocusUntil ? zoom : 1;
  cam.z = lerp(cam.z, tz, Math.min(1, dt * 2.5));
  cam.x = lerp(cam.x, now < camFocusUntil ? cam.tx : W / 2, Math.min(1, dt * 2.5));
  cam.y = lerp(cam.y, now < camFocusUntil ? cam.ty : H / 2, Math.min(1, dt * 2.5));
  flash = Math.max(0, flash - dt * 1.5);
  for (const p of [...guests.values()]) updateFisher(p, dt);
  for (const c of crowd) updateFisher(c, dt);
  // trận đấu
  if (!round.pause && now >= round.end) endRound();
  if (round.pause && now >= round.pause) startRound();
  // mưa
  if (rain && now >= rain.until) {
    rain = null;
    announce(line('rainEnd'), 0);
    nextRainAt = now + Math.max(2, Number(config.rainEveryMinutes) || 9) * 60000 * rand(0.8, 1.2);
  }
  if (!rain && now >= nextRainAt && !monster) {
    if (Number(config.rainEveryMinutes) > 0 || config.rainEveryMinutes == null) startRain();
    else nextRainAt = Infinity;
  }
  // ngày đêm
  const nightNow = isNight();
  if (lastNightState !== null && nightNow !== lastNightState) announce(line(nightNow ? 'night' : 'day'), 0);
  lastNightState = nightNow;
  sfx.setEnvironment(skyState().night, rainLevel());
  updateMonster(dt);
  updateNetBoat();
  if (dragon && now - dragon.t0 > dragon.dur) dragon = null;
  if (vip && now > vip.until && !monster) vip = null;
  // cá bay về tay
  for (let i = flyers.length - 1; i >= 0; i--) {
    const f = flyers[i];
    if (now - f.t0 >= f.dur) {
      flyers.splice(i, 1);
      if (guests.has(f.p.id)) {
        landCatch(f.p, f.c);
        f.p.happyUntil = now + 1500;
        if (['idle', 'wait', 'tug'].includes(f.p.state)) {
          f.p.showFish = { c: f.c, until: now + 1500 };
        }
      }
    }
  }
  // hạt
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    const age = now - q.born;
    if (age > q.life) {
      if (q.kind === 'rainfish') {
        drops(q.x, q.y, 6);
        ripple(q.x, q.y);
      }
      particles.splice(i, 1);
      continue;
    }
    q.vy += q.g * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.rot += q.vr * dt;
    if (q.kind === 'rainfish' && q.y > 1300) q.life = 0;
    if (q.kind === 'bait' && q.y > 1250 && q.vy > 0) {
      ripple(q.x, q.y);
      q.life = 0;
    }
  }
  while (toasts.length && now - toasts[0].born > 5000) toasts.shift();
}

// ------------------------------------------------------------------ vẽ
function rodGeom(p, hand) {
  const st = p.state;
  const k = p.dur ? clamp((now - p.t0) / p.dur, 0, 1) : 0;
  let a = 0.72;
  if (st === 'cast') a = k < 0.4 ? lerp(0.9, 2.3, k / 0.4) : lerp(2.3, 0.6, (k - 0.4) / 0.6);
  else if (st === 'bite') a = 0.62 + Math.sin(now * 0.05) * 0.06;
  else if (st === 'reel') a = lerp(0.8, 1.35, ease(k));
  else if (st === 'show') a = 1.45;
  else if (st === 'tug') a = 1.0 + Math.sin(now * 0.02 + p.phase) * 0.12;
  else if (st === 'sleep') a = 0.2;
  else if (st === 'eat') a = 0.35;
  const L = (p.col === 0 ? 105 : 150) * p.s;
  const tip = { x: hand.x + p.dir * Math.cos(a) * L, y: hand.y - Math.sin(a) * L };
  return { tip, a, L };
}

function drawRod(p, hand, rod) {
  const { tip } = rod;
  // cần câu cong nhẹ khi cá kéo
  const bend = p.state === 'bite' || p.state === 'tug' ? 18 : p.state === 'reel' ? 12 : 4;
  const mx = (hand.x + tip.x) / 2;
  const my = (hand.y + tip.y) / 2 + bend * p.s;
  ctx.strokeStyle = p.goldRod ? '#ffca28' : '#6d4c2f';
  ctx.lineWidth = 4 * p.s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hand.x - p.dir * 14 * p.s, hand.y + 8 * p.s);
  ctx.quadraticCurveTo(mx, my, tip.x, tip.y);
  ctx.stroke();
  if (p.goldRod) {
    ctx.strokeStyle = 'rgba(255,240,180,0.7)';
    ctx.lineWidth = 1.5 * p.s;
    ctx.stroke();
  }
}

function drawLine(from, to, sag, color = 'rgba(255,255,255,0.75)') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo((from.x + to.x) / 2, Math.max(from.y, to.y) + sag, to.x, to.y);
  ctx.stroke();
}

function drawBobber(b, dip, t) {
  const y = b.y + Math.sin(t * 0.004 + b.x) * 2 + dip;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(b.x, y, 5, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.ellipse(b.x, y - 4, 5, 4, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillRect(b.x - 1, y - 14, 2, 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(b.x, y + 5, 10, 3, 0, 0, TAU);
  ctx.stroke();
}

function poseOf(p) {
  if (now < (p.cheerUntil || 0) && ['idle', 'wait'].includes(p.state)) return 'cheer';
  if (p.showFish && now < p.showFish.until) return 'show';
  switch (p.state) {
    case 'cast': return 'cast';
    case 'reel':
    case 'tug': return 'reel';
    case 'show': return 'show';
    case 'sleep': return 'sleep';
    case 'eat': return 'eat';
    default: return 'sit';
  }
}

function drawCaughtFish(c, x, y, len, ang, t) {
  if (c.junk) drawJunk(ctx, c.kind, x, y, len, ang);
  else drawFish(ctx, c.kind, x, y, len, ang, t);
}

function drawFisherFull(p, onBoat = false) {
  const pose = poseOf(p);
  const k = p.dur ? clamp((now - p.t0) / p.dur, 0, 1) : 0;
  let born = clamp((now - p.born) / 400, 0, 1);
  if (!p.real) born = 1;
  const x = onBoat ? 540 : p.x;
  const y = onBoat ? 1400 : p.y;
  const s = onBoat ? 1.15 : p.s * (0.6 + 0.4 * ease(born));
  const dir = onBoat ? 1 : p.dir;
  const fp = { ...p, x, y, s, dir };
  const hand = drawFisher(ctx, {
    x, y, s, dir, look: p.look, pose, t: now, col: onBoat ? 1 : p.col, k, phase: p.phase, bow: p.bow,
    happy: now < p.happyUntil,
  });
  const rod = rodGeom(fp, hand);
  if (pose !== 'eat' && pose !== 'show' && pose !== 'cheer') drawRod(fp, hand, rod);
  else if (pose === 'show' && p.state === 'show') drawRod(fp, hand, rod);
  // dây câu
  if (p.state === 'wait' || p.state === 'bite') {
    const dip = p.state === 'bite' ? 8 + Math.sin(now * 0.04) * 6 : 0;
    if (p.bob) {
      drawLine(rod.tip, { x: p.bob.x, y: p.bob.y + dip - 12 }, p.state === 'bite' ? 0 : 26);
      drawBobber(p.bob, dip, now);
      if (p.state === 'bite' && p.real) {
        ctx.fillStyle = '#ffeb3b';
        ctx.font = `900 ${Math.round(34 * p.s)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('!', p.bob.x, p.bob.y - 26);
      }
    }
  } else if (p.state === 'reel' && p.caught && p.bob) {
    // cá vọt lên khỏi nước theo đường cong về phía tay
    const e = ease(k);
    const fx = lerp(p.bob.x, rod.tip.x, e);
    const fy = lerp(p.bob.y, rod.tip.y + 40 * p.s, e) - Math.sin(e * Math.PI) * 90 * p.s;
    drawLine(rod.tip, { x: fx, y: fy }, 0);
    const len = fishLen(p.caught) * (p.real ? 1 : 0.7) * p.s;
    drawCaughtFish(p.caught, fx, fy + len * 0.3, len, Math.PI / 2 + Math.sin(now * 0.03) * 0.5, now);
  } else if (p.state === 'show' && p.caught) {
    const len = fishLen(p.caught) * (p.real ? 1 : 0.7) * p.s;
    const fx = rod.tip.x;
    const fy = rod.tip.y + 14 * p.s;
    drawLine(rod.tip, { x: fx, y: fy }, 0);
    drawCaughtFish(p.caught, fx, fy + len * 0.45, len, Math.PI / 2 + Math.sin(now * 0.02) * 0.35, now);
    if (p.real) drawCatchLabel(p.caught, fx, fy - 16);
  } else if (p.state === 'tug' && monster && !monster.end) {
    drawLine(rod.tip, { x: MONSTER_POS.x + rand(-2, 2) + (p.seat >= 0 ? (SEATS[p.seat].side ? 40 : -40) : 0), y: MONSTER_POS.y - 40 + (monster.end ? 200 : 0) }, 0, 'rgba(255,255,255,0.6)');
  }
  if (p.showFish && now < p.showFish.until) {
    const len = fishLen(p.showFish.c) * p.s;
    drawCaughtFish(p.showFish.c, hand.x + p.dir * 8, hand.y - len * 0.3, len, -Math.PI / 2 + Math.sin(now * 0.02) * 0.3, now);
    if (p.real) drawCatchLabel(p.showFish.c, hand.x, hand.y - len * 0.8 - 10);
  }
  if (pose === 'eat' && p.eating !== undefined) {
    // xiên cá nướng
    const ex = hand.x + dir * 6 * s;
    const ey = hand.y - 4 * s;
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(ex, ey + 18 * s);
    ctx.lineTo(ex, ey - 26 * s);
    ctx.stroke();
    if (p.eating) {
      drawFish(ctx, p.eating, ex, ey - 6 * s, 36 * s, -Math.PI / 2, 0);
      ctx.fillStyle = 'rgba(80,40,10,0.45)';
      ctx.beginPath();
      ctx.ellipse(ex, ey - 6 * s, 6 * s, 14 * s, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#8d5a3a';
      ctx.beginPath();
      ctx.ellipse(ex, ey - 8 * s, 8 * s, 13 * s, 0, 0, TAU);
      ctx.fill();
    }
  }
  return hand;
}

function drawCatchLabel(c, x, y) {
  const text = c.junk ? c.name : `${c.name} ${kgText(c.kg)}kg`;
  ctx.save();
  ctx.font = `800 21px ${FONT}`;
  const w = ctx.measureText(text).width + 22;
  const bx = clamp(x - w / 2, 8, W - w - 8);
  rr(ctx, bx, y - 30, w, 32, 16);
  ctx.fillStyle = c.legend ? '#ffb300' : c.junk ? '#757575' : c.kg >= 5 ? '#00838f' : 'rgba(20,40,50,0.85)';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + w / 2, y - 13);
  ctx.restore();
}

function drawTag(p) {
  if (!p.real) return;
  const st = SEATS[p.seat];
  const cx = p.x + (st.col === 0 ? 14 : -14) * st.dir;
  const top = p.y - 118 * p.s;
  const name = truncate(p.user.name, 10);
  ctx.save();
  ctx.font = `700 ${Math.round(17 * Math.min(1.1, p.s))}px ${FONT}`;
  const tw = ctx.measureText(name).width;
  const w = Math.min(128, tw + 34);
  const x0 = cx - w / 2;
  rr(ctx, x0, top - 14, w, 26, 13);
  ctx.fillStyle = 'rgba(15,25,35,0.72)';
  ctx.fill();
  ctx.strokeStyle = TEAM[st.side].color;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawAvatar(x0 + 12, top - 1, 9, p.user, TEAM[st.side].color);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x0 + 25, top);
  // thanh thể lực
  const bw = w - 10;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x0 + 5, top + 14, bw, 6);
  const sv = p.stamina / 100;
  ctx.fillStyle = sv > 0.5 ? '#66bb6a' : sv > 0.25 ? '#ffca28' : '#ef5350';
  ctx.fillRect(x0 + 5, top + 14, bw * sv, 6);
  if (p.boost > 0) {
    ctx.font = `900 16px ${FONT}`;
    ctx.fillStyle = '#7cf7ff';
    ctx.textAlign = 'left';
    ctx.fillText('x2', x0 + w + 2, top);
  }
  ctx.restore();
}

function drawBubble(p) {
  if (!p.bubble) return;
  const h = headPos(p);
  const lines = wrapText(p.bubble.text, 16, 2);
  const age = now - p.bubble.born;
  const sc = Math.min(1, age / 150);
  ctx.save();
  ctx.font = `600 19px ${FONT}`;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22;
  const hh = lines.length * 23 + 12;
  const st = SEATS[p.seat];
  let bx = p.x - w / 2 + (st ? (st.col === 0 ? 40 : -40) * st.dir : 0);
  bx = clamp(bx, 6, W - w - 6);
  const by = h.y - 70 * p.s - hh;
  ctx.globalAlpha = sc;
  rr(ctx, bx, by, w, hh, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 7 + i * 23));
  ctx.restore();
}

function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.4, y - s, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.4, x, y + s * 0.3);
}
function drawParticles(layer) {
  for (const q of particles) {
    const k = (now - q.born) / q.life;
    const a = 1 - k;
    if (layer === 'water' && q.kind !== 'ring' && q.kind !== 'bubble') continue;
    if (layer !== 'water' && (q.kind === 'ring' || q.kind === 'bubble')) continue;
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    switch (q.kind) {
      case 'heart':
        ctx.fillStyle = q.color;
        heartPath(q.x, q.y, q.size);
        ctx.fill();
        break;
      case 'spark':
        ctx.fillStyle = q.color;
        ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
        break;
      case 'drop':
        ctx.fillStyle = 'rgba(220,245,255,0.9)';
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size, 0, TAU);
        ctx.fill();
        break;
      case 'ring':
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(q.x, q.y, 4 + k * q.size, (4 + k * q.size) * 0.35, 0, 0, TAU);
        ctx.stroke();
        break;
      case 'bubble':
        ctx.strokeStyle = 'rgba(220,255,240,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (0.6 + k), 0, TAU);
        ctx.stroke();
        break;
      case 'confetti':
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        ctx.fillStyle = q.color;
        ctx.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2);
        break;
      case 'smoke':
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (0.6 + k), 0, TAU);
        ctx.fill();
        break;
      case 'z':
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 3;
        ctx.font = `900 ${q.size}px ${FONT}`;
        ctx.strokeText('z', q.x, q.y);
        ctx.fillText('z', q.x, q.y);
        break;
      case 'rainfish':
        ctx.globalAlpha = 1;
        drawFish(ctx, q.fish, q.x, q.y, q.size, q.rot, now);
        break;
      case 'bait':
        ctx.fillStyle = '#d7b46a';
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size, 0, TAU);
        ctx.fill();
        break;
      default:
        break;
    }
    ctx.restore();
  }
}

function drawRainStreaks(level) {
  if (level <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(30,40,60,${0.28 * level})`;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = `rgba(210,225,255,${0.45 * level})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const n = Math.floor(160 * level);
  for (let i = 0; i < n; i++) {
    const x = (i * 97.3 + now * 0.4) % (W + 200) - 100;
    const y = (i * 211.7 + now * 1.6) % (H + 100) - 50;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 14, y + 40);
  }
  ctx.stroke();
  ctx.restore();
}

function drawNetBoat() {
  if (!netBoat) return;
  const k = (now - netBoat.t0) / netBoat.dur;
  let x;
  if (k < 0.4) x = lerp(-120, 540, ease(k / 0.4));
  else if (k < 0.7) x = 540;
  else x = lerp(540, W + 140, ease((k - 0.7) / 0.3));
  const y = 1300;
  if (netBoat.cast) {
    const nk = clamp((now - netBoat.castAt) / 900, 0, 1);
    const r = (netBoat.pulled ? 1 - clamp((k - 0.6) / 0.1, 0, 1) : nk) * 120;
    if (r > 2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(240,240,220,0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(540, y - 40, r, r * 0.35, 0, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(540, y - 40);
        ctx.lineTo(540 + Math.cos(a) * r, y - 40 + Math.sin(a) * r * 0.35);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  if (Math.random() < 0.05) sfx.oar();
  drawBasketBoat(ctx, x, y, 1, now, (bx, by) => {
    const g = netBoat.g;
    drawFisher(ctx, { x: bx, y: by + 4, s: 0.95, dir: 1, look: g && guests.has(g.id) ? g.look : crowdLook(3), pose: netBoat.cast && !netBoat.pulled ? 'cheer' : 'sit', t: now, col: 1 });
  });
  if (netBoat.g && guests.has(netBoat.g.id)) {
    ctx.save();
    ctx.font = `800 20px ${FONT}`;
    ctx.textAlign = 'center';
    const label = `🎁 ${truncate(netBoat.g.user.name, 12)}`;
    const w = ctx.measureText(label).width + 20;
    rr(ctx, x - w / 2, y - 150, w, 30, 15);
    ctx.fillStyle = 'rgba(194,24,91,0.9)';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - 135);
    ctx.restore();
  }
}

function drawWorld() {
  const sky = skyState();
  drawSky(ctx, sky.night, sky.dusk, now);
  ctx.drawImage(farLayer, 0, 0);
  if (sky.night > 0) {
    ctx.fillStyle = `rgba(10,20,50,${sky.night * 0.55})`;
    ctx.fillRect(0, 380, W, WATER_Y - 380);
  }
  const rl = rainLevel();
  drawWater(ctx, now, sky.night, rl);
  ctx.drawImage(waterDecor, 0, 0);
  drawParticles('water');
  // thủy quái
  if (monster) {
    const age = now - monster.t0;
    let rise = clamp(age / 1800, 0, 1);
    if (monster.end) {
      const ek = clamp((now - monster.end.at) / 2500, 0, 1);
      rise = monster.end.win ? 1 - ek * 0.2 : 1 - ek;
    }
    let my = MONSTER_POS.y;
    if (monster.end && monster.end.win) my -= ease(clamp((now - monster.end.at) / 1500, 0, 1)) * 180;
    drawMonster(ctx, MONSTER_POS.x, my, ease(rise), now, monster.hurt, 1);
  }
  if (dragon) {
    const k = (now - dragon.t0) / dragon.dur;
    drawDragonBoat(ctx, lerp(-340, W + 340, k), 1240, now);
  }
  drawNetBoat();
  drawRaft(ctx, now, fireOn() ? 1 : 0, sky.night);
  ctx.drawImage(pierLayer, 0, 0);
  drawPierSigns(ctx, sky.night, teamKg, teamKg[0] > teamKg[1] + 0.05 ? 0 : teamKg[1] > teamKg[0] + 0.05 ? 1 : -1);
  // người câu: hàng xa trước, gần sau
  const list = allFishers().filter((p) => p.seat >= 0 && !(vip && vip.g === p));
  list.sort((a, b) => a.y - b.y || a.col - b.col);
  for (const p of list) drawFisherFull(p);
  if (vip && guests.has(vip.g.id)) {
    drawBasketBoat(ctx, 540, 1430, 1.25, now, () => drawFisherFull(vip.g, true));
    ctx.save();
    ctx.font = `900 24px ${FONT}`;
    ctx.textAlign = 'center';
    const label = `💎 ${truncate(vip.g.user.name, 14)}`;
    const w = ctx.measureText(label).width + 26;
    rr(ctx, 540 - w / 2, 1478, w, 36, 18);
    ctx.fillStyle = 'rgba(255,179,0,0.95)';
    ctx.fill();
    ctx.fillStyle = '#3e2723';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 540, 1496);
    ctx.restore();
  }
  // cá bay từ lưới / thủy quái về tay
  for (const f of flyers) {
    const k = clamp((now - f.t0) / f.dur, 0, 1);
    const e = ease(k);
    const tx = f.p.x;
    const ty = f.p.y - 90 * f.p.s;
    const x = lerp(f.x0, tx, e);
    const y = lerp(f.y0, ty, e) - Math.sin(e * Math.PI) * 220;
    drawCaughtFish(f.c, x, y, fishLen(f.c) * 0.8, now * 0.01, now);
  }
  // đêm tối dần, đèn dầu và lửa sáng lên
  if (sky.night > 0) {
    ctx.fillStyle = `rgba(8,16,45,${sky.night * 0.42})`;
    ctx.fillRect(0, WATER_Y, W, H - WATER_Y);
  }
  drawLanterns(ctx, sky.night, now);
  drawFireGlow(ctx, now, fireOn() ? 1 : 0, sky.night);
  for (const p of list) drawTag(p);
  for (const p of list) drawBubble(p);
  drawParticles('air');
  drawRainStreaks(rl);
}

// ------------------------------------------------------------------ giao diện (nửa trên màn hình)
function panel(x, y, w, h, r = 18, fill = 'rgba(8,28,38,0.82)', stroke = 'rgba(255,255,255,0.18)') {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
function text(t, x, y, { size = 24, weight = 700, color = '#fff', align = 'left', base = 'middle', stroke = null, max } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(3, size / 6);
    ctx.lineJoin = 'round';
    ctx.strokeText(t, x, y, max);
  }
  ctx.fillStyle = color;
  ctx.fillText(t, x, y, max);
}
const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function drawHeader() {
  ctx.save();
  // tiêu đề
  text(config.title || DEFAULTS.title, W / 2, 52, { size: 62, weight: 900, color: '#fff3c4', align: 'center', stroke: '#0b3a4a' });
  text(config.subtitle || DEFAULTS.subtitle, W / 2, 104, { size: 25, weight: 700, color: '#e0f7fa', align: 'center', stroke: 'rgba(0,30,40,0.8)', max: W - 40 });

  // bảng lệnh
  const gy = 128;
  panel(16, gy, W - 32, 200);
  const baits = Object.values(config.baits);
  const cw = (W - 52) / 5;
  baits.slice(0, 5).forEach((b, i) => {
    const x = 26 + i * cw;
    drawChip(x, gy + 10, cw - 8, 84, b.num, b.label, b.hint, '#ffd54f');
  });
  const extra = [
    ['6', 'Nướng cá', 'ăn hồi sức', '#ff8a65'],
    ['7', 'Đốt lửa', 'sưởi đêm', '#ffb74d'],
    ['⇄', 'trái / phải', 'chọn bến', '#90caf9'],
    ['❤', 'Thả tim', 'cá cắn nhanh', '#f48fb1'],
    ['📣', 'Chia sẻ', 'cá to x2', '#80deea'],
  ];
  extra.forEach(([n, a, b, c], i) => drawChip(26 + i * cw, gy + 102, cw - 8, 84, n, a, b, c));

  const monsterLive = monster && !monster.end;
  if (monsterLive) drawMonsterBar(340);
  else {
    drawTeamBar(340);
    drawGoalBar(436);
  }
  drawInfoRow(490);
  ctx.restore();
}

function drawChip(x, y, w, h, num, label, hint, color) {
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 30, y + h / 2, 22, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
  text(num, x + 30, y + h / 2 + 1, { size: num.length > 1 ? 22 : 30, weight: 900, color: '#1a1a1a', align: 'center' });
  text(label, x + 58, y + 30, { size: 23, weight: 800, color: '#fff', max: w - 62 });
  text(hint, x + 58, y + 60, { size: 18, weight: 600, color: '#b2ebf2', max: w - 62 });
}

function drawTeamBar(y) {
  panel(16, y, W - 32, 86);
  const [a, b] = teamKg;
  const tot = a + b;
  const k = tot > 0 ? a / tot : 0.5;
  const bx = 36;
  const bw = W - 72;
  rr(ctx, bx, y + 54, bw, 20, 10);
  ctx.fillStyle = TEAM[1].color;
  ctx.fill();
  ctx.save();
  rr(ctx, bx, y + 54, bw, 20, 10);
  ctx.clip();
  ctx.fillStyle = TEAM[0].color;
  ctx.fillRect(bx, y + 54, bw * k, 20);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.fillRect(bx + bw * k - 2, y + 50, 4, 28);
  text(`${TEAM[0].name} ${kgText(a)}kg`, 36, y + 27, { size: 27, weight: 900, color: TEAM[0].light });
  text(`${kgText(b)}kg ${TEAM[1].name}`, W - 36, y + 27, { size: 27, weight: 900, color: TEAM[1].light, align: 'right' });
  if (round.banner) {
    const bn = round.banner;
    const msg = bn.winner >= 0 ? `🏆 ${TEAM[bn.winner].name} THẮNG` : 'HOÀ';
    text(msg, W / 2, y + 27, { size: 27, weight: 900, color: '#ffe082', align: 'center' });
  } else {
    text(`Trận ${round.n} · ${mmss(round.end - now)}`, W / 2, y + 27, { size: 24, weight: 800, color: '#fff', align: 'center' });
  }
}

function drawGoalBar(y) {
  const g = currentGoal();
  panel(16, y, W - 32, 46, 23);
  const k = clamp(goal.progress / g.target, 0, 1);
  rr(ctx, 20, y + 4, (W - 40) * k, 38, 19);
  ctx.fillStyle = 'rgba(255,193,7,0.55)';
  if (k > 0.02) ctx.fill();
  const unit = g.type === 'share' ? 'chia sẻ' : '❤';
  text(`MỤC TIÊU CHUNG: ${goal.progress}/${g.target} ${unit} → ${g.label}`, W / 2, y + 24, { size: 23, weight: 800, color: '#fff', align: 'center', max: W - 60 });
}

function drawMonsterBar(y) {
  panel(16, y, W - 32, 142, 18, 'rgba(60,10,10,0.82)', '#ff5252');
  const pulse = 0.85 + 0.15 * Math.sin(now * 0.012);
  text('THỦY QUÁI! THẢ TIM ĐỂ KÉO LÊN BỜ', W / 2, y + 34, { size: 34 * pulse, weight: 900, color: '#ffeb3b', align: 'center', stroke: '#3b0000' });
  const k = clamp(monster.hp / monster.maxHp, 0, 1);
  rr(ctx, 40, y + 66, W - 80, 32, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fill();
  rr(ctx, 40, y + 66, (W - 80) * k, 32, 16);
  ctx.fillStyle = '#e53935';
  if (k > 0.01) ctx.fill();
  text(`Còn ${Math.ceil(Math.max(0, monster.hp))} sức · ${mmss(monster.until - now)}`, W / 2, y + 83, { size: 22, weight: 800, color: '#fff', align: 'center' });
  text('❤ = kéo 1 · bình luận = 3 · chia sẻ = 15 · quà = rất mạnh', W / 2, y + 122, { size: 20, weight: 700, color: '#ffcdd2', align: 'center' });
}

function drawInfoRow(y) {
  const h = 110;
  const half = (W - 44) / 2;
  panel(16, y, half, h);
  text('GIỎ NẶNG NHẤT', 34, y + 22, { size: 20, weight: 900, color: '#ffe082' });
  const top = [...guests.values()].filter((g) => g.basketKg > 0).sort((a, b) => b.basketKg - a.basketKg).slice(0, 3);
  if (!top.length) text('Chưa ai có cá, gõ 1 để câu!', 34, y + 60, { size: 20, weight: 600, color: '#cfd8dc' });
  top.forEach((g, i) => {
    const yy = y + 50 + i * 24;
    text(`${['🥇', '🥈', '🥉'][i]} ${truncate(g.user.name, 13)}`, 30, yy, { size: 20, weight: 700, color: '#fff' });
    text(`${kgText(g.basketKg)}kg`, 16 + half - 16, yy, { size: 20, weight: 800, color: '#b2ebf2', align: 'right' });
  });
  const x2 = 28 + half;
  panel(x2, y, half, h);
  const sky = skyState();
  const lines = [];
  if (bestFish) lines.push([`🏆 ${truncate(bestFish.name, 10)}: ${truncate(bestFish.fish, 12)} ${kgText(bestFish.kg)}kg`, '#ffe082']);
  else lines.push(['🏆 Kỷ lục: chưa có', '#ffe082']);
  if (!monster) lines.push([`🐉 Thủy quái sau ${mmss(nextMonsterAt - now)}`, '#ffab91']);
  else lines.push([monster.end ? (monster.end.win ? '🐉 Đã kéo được thủy quái!' : '🐉 Thủy quái đã lặn') : `🐉 Đang kéo! ${mmss(monster.until - now)}`, '#ffab91']);
  const env = [];
  env.push(sky.night > 0.6 ? '🌙 Đêm' : sky.dusk > 0.3 ? '🌇 Chiều' : '☀ Ngày');
  env.push(fireOn() ? `🔥 ${mmss(fireUntil - now)}` : sky.night > 0.6 ? '🔥 tắt · gõ 7' : '🔥 tắt');
  if (rain) env.push('🌧 Mưa');
  if (now < biteBoostUntil) env.push(`🍥 Thính ${Math.ceil((biteBoostUntil - now) / 1000)}s`);
  if (now < goldRushUntil) env.push(`✨ Cá vàng ${Math.ceil((goldRushUntil - now) / 1000)}s`);
  lines.push([env.join('  '), '#e0f7fa']);
  lines.forEach(([t, c], i) => text(t, x2 + 16, y + 24 + i * 32, { size: 20, weight: 700, color: c, max: half - 28 }));
}

function drawToasts() {
  toasts.forEach((t, i) => {
    const age = now - t.born;
    const a = Math.min(1, age / 200, (5000 - age) / 400);
    const y = 720 + i * 44;
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.font = `800 22px ${FONT}`;
    const w = Math.min(W - 60, ctx.measureText(t.text).width + 30);
    rr(ctx, W / 2 - w / 2, y - 18, w, 38, 19);
    ctx.fillStyle = 'rgba(10,25,35,0.82)';
    ctx.fill();
    ctx.fillStyle = t.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.text, W / 2, y + 1, W - 80);
    ctx.restore();
  });
}

let caption = null;
function drawCaption() {
  if (!caption && captions.length) caption = { ...captions.shift(), born: now };
  if (!caption) return;
  const dur = Math.min(7000, 2600 + caption.text.length * 55);
  const age = now - caption.born;
  if (age > dur) {
    caption = null;
    return;
  }
  const a = Math.min(1, age / 250, (dur - age) / 300);
  const lines = wrapText(caption.text, 44, 2);
  ctx.save();
  ctx.globalAlpha = clamp(a, 0, 1);
  const y = 612;
  const hh = lines.length * 30 + 14;
  rr(ctx, 40, y, W - 80, hh, 16);
  ctx.fillStyle = caption.priority >= 2 ? 'rgba(120,60,0,0.85)' : 'rgba(0,40,50,0.8)';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 24px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(`${i === 0 ? '🎙 ' : ''}${l}`, W / 2, y + 9 + i * 30));
  ctx.restore();
}

function drawRoundBanner() {
  const bn = round.banner;
  if (!bn) return;
  const age = now - bn.born;
  if (age > 6500) return;
  const a = Math.min(1, age / 300, (6500 - age) / 400);
  const sc = 0.8 + 0.2 * ease(Math.min(1, age / 400));
  ctx.save();
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.translate(W / 2, 1240);
  ctx.scale(sc, sc);
  const col = bn.winner >= 0 ? TEAM[bn.winner] : { color: '#78909c', dark: '#37474f' };
  rr(ctx, -440, -110, 880, 220, 30);
  ctx.fillStyle = col.dark;
  ctx.fill();
  ctx.strokeStyle = '#ffe082';
  ctx.lineWidth = 6;
  ctx.stroke();
  text('HẾT TRẬN', 0, -62, { size: 34, weight: 900, color: '#ffe082', align: 'center' });
  text(bn.winner >= 0 ? `${TEAM[bn.winner].name} THẮNG!` : 'HAI BẾN HOÀ!', 0, -6, { size: 64, weight: 900, color: '#fff', align: 'center', stroke: 'rgba(0,0,0,0.4)' });
  if (bn.mvp) text(`Cao thủ: ${truncate(bn.mvp, 18)} · ${kgText(bn.kg)}kg cả bến`, 0, 62, { size: 28, weight: 800, color: '#fff3c4', align: 'center' });
  ctx.restore();
}

// ------------------------------------------------------------------ vòng lặp
let audioBlocked = false;
let lastFrame = performance.now();
const waterDecor = document.createElement('canvas');
waterDecor.width = W;
waterDecor.height = H;
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastFrame) / 1000);
  lastFrame = ts;
  now = ts;
  update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);
  drawWorld();
  ctx.restore();
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,250,230,${flash * 0.45})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawHeader();
  drawCaption();
  drawToasts();
  drawRoundBanner();
  if (audioBlocked) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(ctx, W / 2 - 250, 820, 500, 56, 28);
    ctx.fill();
    text('🔇 Bấm vào game để bật tiếng', W / 2, 849, { size: 24, weight: 700, align: 'center' });
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

async function boot() {
  try {
    const res = await fetch('/cau-ca-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  config.fish = { ...DEFAULTS.fish, ...(config.fish || {}) };
  config.baits = { ...DEFAULTS.baits, ...(config.baits || {}) };
  config.junk = { ...DEFAULTS.junk, ...(config.junk || {}) };
  buildCommands();
  const fc = farLayer.getContext('2d');
  drawFarBank(fc);
  drawPiers(pierLayer.getContext('2d'));
  drawWaterDecor(waterDecor.getContext('2d'));
  now = performance.now();
  round = { n: 1, start: now, end: now + Math.max(1, Number(config.matchMinutes) || 5) * 60000, pause: 0, banner: null };
  nextMonsterAt = now + Math.max(2, Number(config.monsterMinutes) || 10) * 60000;
  nextRainAt = now + Math.max(2, Number(config.rainEveryMinutes) || 9) * 60000;
  if (Number(config.rainEveryMinutes) === 0) nextRainAt = Infinity;
  if (params.get('sound') === '0') config.sound = false;
  if (params.get('voice') === '0') config.voice = false;
  if (params.get('music') === '0') config.music = false;
  sfx.setSoundEnabled(config.sound !== false);
  voice.setSoundEnabled(config.sound !== false);
  voice.setVoiceEnabled(config.voice !== false);
  voice.setVoiceEngine(params.get('engine') || config.voiceEngine);
  voice.setPreferredVoice(config.ttsVoice);
  voice.setOnSpeakStart((t) => sfx.duck(Math.min(9000, 1500 + String(t).length * 75)));
  let files = Array.isArray(config.musicFiles) ? config.musicFiles.filter(Boolean) : [];
  try {
    const r = await fetch('/cau-ca-music.json', { cache: 'no-store' });
    if (r.ok) files = [...(await r.json()), ...files];
  } catch {
    /* không có máy chủ */
  }
  const startMusic = () => {
    if (config.sound === false) return;
    sfx.startMusic({ files: config.music === false ? [] : files, volume: config.music === false ? 0 : Number(config.musicVolume ?? 0.3), ambience: Number(config.ambienceVolume ?? 0.14) });
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
  for (let i = 0; i < Math.min(5, Number(config.ambientCrowd) || 0); i++) refillCrowd();
  setInterval(refillCrowd, 2500);
  connectWs();
  requestAnimationFrame(frame);
}

window.__cauCa = { handleEvent, guests, config: () => config };
boot();
