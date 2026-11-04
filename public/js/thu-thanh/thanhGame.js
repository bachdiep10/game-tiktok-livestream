// Thủ thành Cổ Loa: game tương tác TikTok LIVE kiểu thủ thành.
// Người xem là lính nỏ trên tường thành (mỗi người 1 lính mang tên mình, tự bắn).
// Hạ quái để lên cấp (tối đa 10), mỗi cấp có trang bị mạnh hơn. Yêu quái là NPC, có người chơi mới thì thả thêm quái.
// Mỗi đợt thủ thành 10 hiệp, cuối mỗi hiệp có boss, mỗi hiệp có thể có hiện tượng ngẫu nhiên.
import { W, H, FOREST_Y, RIVER_Y, STOP_Y, WALL_Y, GATE_X, ROW_Y, TOWER_X, TOWER_FEET, drawStatic, drawGate, drawTower, drawWeather, lightningBolt, rr } from './scene.js';
import { drawArcher, drawMonster, drawGiong, drawKimQuy, drawVillager, drawCatapult, GEAR } from './art.js';
import * as sfx from './thanhAudio.js';
import * as voice from '../audio.js';

const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const FONT = '"Segoe UI", system-ui, sans-serif';

const DEFAULTS = {
  title: 'THỦ THÀNH CỔ LOA',
  backgroundImage: '',
  hiepCount: 10,
  hiepSeconds: 50,
  bossBeforeEnd: 12,
  breakSeconds: 6,
  resultSeconds: 14,
  gateHp: 1000,
  gateHealPerHiep: 0.08,
  levelKills: [0, 1, 3, 6, 10, 15, 21, 28, 36, 45],
  baseMonsters: 8,
  monstersPerHiep: 3,
  monstersPerPlayerPerHiep: 1.2,
  monstersPerNewPlayer: 2,
  trickleSeconds: 5,
  packSeconds: 5,
  maxMonsters: 60,
  monsterHpPerHiep: 0.5,
  monsterHpPerPlayer: 0.07,
  bossHp: 600,
  bossHpPerHiep: 0.6,
  bossHpPerPlayer: 0.06,
  finalBossMultiplier: 2.5,
  kidnapFromHiep: 2,
  rescueNeeded: 5,
  rescueSeconds: 15,
  awaySeconds: 15,
  ambientArchers: 6,
  likesPerRain: 20,
  kimQuyLikes: 1000,
  fogLikes: 100,
  phenomenaChance: 0.75,
  phenomena: ['suong', 'mua', 'gio', 'trang', 'set', 'dan'],
  catapultSeconds: 60,
  cmdCooldown: 3,
  repairHp: 4,
  maxWallDamagePerSecond: 0.03,
  idleSwapSeconds: 120,
  giftTiers: { medium: 10, big: 100 },
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.3,
  ambienceVolume: 0.06,
  voice: true,
  voiceLevel: 'vua',
  voiceGapSeconds: 8,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-NamMinhNeural',
  captions: true,
  narration: true,
  narrationSeconds: 40,
  commands: {
    shoot: ['bắn đi', 'bắn nỏ', 'bắn tên', 'bắn nào'],
    repair: ['sửa thành', 'sửa cổng', 'sửa đi', 'xây thành'],
    rock: ['lăn đá', 'ném đá', 'thả đá'],
    shield: ['khiên', 'dựng khiên', 'phòng thủ'],
    drum: ['đánh trống', 'trống trận', 'cố lên', 'tiến lên'],
    rescue: ['cứu'],
    gate: ['mở cổng'],
  },
  numberCommands: { 1: 'shoot', 2: 'repair', 3: 'rock', 4: 'shield', 5: 'drum' },
  messages: {
    join: ['{name} lên tường thành', 'Chào {name}, cầm nỏ giữ thành nào', 'Thêm một lính nỏ: {name}'],
    newMonsters: ['Có thêm người giữ thành, yêu quái cũng kéo tới đông hơn', 'Thành đông lính, giặc yêu cũng tràn tới'],
    hiepStart: ['Hiệp {n}. Yêu quái kéo đến, giữ vững cổng thành', 'Hiệp {n} bắt đầu. Anh em lên nỏ'],
    hiepClear: ['Qua hiệp {n}. Thành được sửa lại một ít', 'Giữ thành thành công hiệp {n}'],
    boss: ['{boss} xuất hiện! Tập trung bắn boss', 'Cẩn thận, {boss} đang tới cổng thành'],
    bossDown: ['{name} hạ được {boss}', 'Boss {boss} đã gục, công đầu thuộc về {name}'],
    levelMax: ['{name} đạt cấp mười, cầm Nỏ thần', 'Chúc mừng {name} lên cấp tối đa, Nỏ thần trong tay'],
    kidnap: ['{boss} bắt mất {name}! Gõ cứu để giải cứu', 'Nguy rồi, {name} bị bắt, mọi người gõ cứu'],
    rescued: ['Đã cứu được {name}', '{name} được giải cứu, tiếp tục chiến đấu'],
    lost: ['{name} bị kéo ra ngoài thành, mất một cấp', 'Không kịp cứu {name}'],
    share: ['Cảm ơn {name} chia sẻ, máy bắn đá đã dựng xong', '{name} chia sẻ, thêm máy bắn đá trên tường'],
    follow: ['Cảm ơn {name} theo dõi, phong {name} làm tướng giữ thành', '{name} được phong tướng, bắn mạnh gấp rưỡi'],
    giftSmall: ['Cảm ơn {name} tặng {gift}, mưa tên lửa trút xuống', 'Cảm ơn {name}, tên lửa đốt cháy yêu quái'],
    giftGiong: ['Cảm ơn {name} tặng {gift}! Thánh Gióng cưỡi ngựa sắt xông trận', '{name} gọi Thánh Gióng, quét sạch một hàng giặc'],
    giftKimQuy: ['{name} tặng {gift}! Rùa Vàng hiện lên trao Nỏ thần', 'Cảm ơn {name}! Nỏ thần bắn một phát, yêu quái tan tác'],
    kimQuyLikes: ['Cả thành thả đủ tim, Rùa Vàng hiện lên', 'Tim của mọi người gọi được Rùa Vàng'],
    win: ['Giữ thành thành công cả mười hiệp! Công đầu là {name}', 'Chiến thắng! Thành Cổ Loa vững vàng, xin chúc mừng {name}'],
    lose: ['Thành đã vỡ ở hiệp {n}. Chuẩn bị đợt mới', 'Thất thủ ở hiệp {n}, cố lên đợt sau nhé'],
    gateLow: ['Cổng thành sắp vỡ, gõ 2 để sửa thành', 'Cổng nguy rồi, gõ 4 dựng khiên'],
    reminder: [
      'Bình luận bất kỳ để làm lính nỏ trên tường thành',
      'Hạ yêu quái để lên cấp, cấp mười có Nỏ thần',
      'Gõ 1 bắn, 2 sửa thành, 3 lăn đá, 4 dựng khiên, 5 đánh trống',
      'Thả tim, cứ hai mươi tim là một trận mưa tên',
      'Chia sẻ để dựng máy bắn đá trên tường',
      'Tặng quà để gọi Thánh Gióng, quà lớn thì Rùa Vàng hiện lên',
      'Theo dõi kênh để được phong tướng',
    ],
  },
};
let config = structuredClone(DEFAULTS);

const PHENOMENA = {
  suong: { icon: '🌫️', name: 'Sương mù', desc: 'Thả tim để thổi tan sương' },
  mua: { icon: '🌧️', name: 'Mưa lớn', desc: 'Quái chậm, tên yếu, lửa tắt' },
  gio: { icon: '🌬️', name: 'Gió lớn', desc: 'Tên bay xa, sát thương mạnh' },
  trang: { icon: '🌕', name: 'Đêm trăng', desc: 'Quái khỏe hơn, hạ quái tính gấp đôi' },
  set: { icon: '⛈️', name: 'Sấm sét', desc: 'Sét đánh trúng yêu quái' },
  dan: { icon: '🧺', name: 'Dân chạy nạn', desc: 'Chia sẻ hoặc gõ "mở cổng" đón dân' },
};
const KINDS = {
  moc: { name: 'Mộc tinh', hp: 90, speed: 30, dps: 3, scale: 1 },
  ngu: { name: 'Ngư tinh', hp: 40, speed: 55, dps: 2, scale: 0.95 },
  ho: { name: 'Hồ tinh', hp: 60, speed: 45, dps: 3, scale: 0.95 },
  da: { name: 'Đá tinh', hp: 180, speed: 24, dps: 6, scale: 1.05 },
};
const BOSSES = ['moc', 'ngu', 'ho', 'da'];
const BOSS_NAMES = { moc: 'Mộc tinh chúa', ngu: 'Ngư tinh chúa', ho: 'Hồ tinh', da: 'Đá tinh chúa' };
const LV_DMG = [0, 10, 11, 13, 15, 17, 19, 21, 23, 26, 30];
const LV_CD = [0, 1.5, 1.45, 1.25, 1.2, 1.15, 1.1, 1.1, 1.05, 1.0, 0.9];

const lastLine = {};
function line(kind, vars = {}) {
  const list = (config.messages && config.messages[kind]) || DEFAULTS.messages[kind] || [];
  if (!list.length) return '';
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastLine[kind]) i = (i + 1) % list.length;
  lastLine[kind] = i;
  return list[i]
    .replace(/\{name\}/g, vars.name || '')
    .replace(/\{gift\}/g, vars.gift || 'quà')
    .replace(/\{boss\}/g, vars.boss || '')
    .replace(/\{n\}/g, vars.n ?? '');
}

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
  const t = String(text || '').trim();
  const nums = { ...DEFAULTS.numberCommands, ...(config.numberCommands || {}) };
  const m = t.match(/^([1-9])\1*$/);
  if (m && nums[m[1]]) return nums[m[1]];
  const n = norm(t);
  for (const c of commandList) if (n.includes(c.key)) return c.act;
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

// ------------------------------------------------------------------ trạng thái
let now = performance.now();
const sec = () => now / 1000;
const players = new Map();
let monsters = [];
let projectiles = [];
const particles = [];
const toasts = [];
const effects = [];
const catapults = [];
const villagers = [];
let monsterSeq = 0;
let lookSeq = 0;
const gate = { hp: 1000, max: 1000, hitT: 0, shieldUntil: 0, open: 0, openUntil: 0 };
const game = {
  phase: 'fight', // fight | break | result
  hiep: 1,
  dot: 0,
  t0: 0,
  phaseUntil: 0,
  queue: 0,
  spawnT: 0,
  trickleT: 0,
  bossSpawned: false,
  boss: null,
  won: false,
  weather: '',
  fog: 1,
  fogLikes: 0,
  lightningT: 0,
  drumUntil: 0,
  likePool: 0,
  kimQuyLikes: 0,
  kidnap: null,
  newMonstersMsgT: 0,
  gateLowWarned: false,
  mvp: [],
  bossKills: 0,
};
let record = { hiep: 0, wins: 0 };
try {
  record = { ...record, ...JSON.parse(localStorage.getItem('thuThanhRecord') || '{}') };
} catch {
  /* không có bộ nhớ */
}
function saveRecord() {
  try {
    localStorage.setItem('thuThanhRecord', JSON.stringify(record));
  } catch {
    /* bỏ qua */
  }
}
let shake = 0;
let flash = 0;
let banner = null;

// ------------------------------------------------------------------ chỗ đứng trên tường
// 3 hàng, hai bên cổng, mỗi bên 6 chỗ; 2 tháp canh cho 2 người tặng quà nhiều nhất
const slots = [];
(() => {
  ROW_Y.forEach((y, r) => {
    const off = r === 1 ? 23 : 0;
    const xs = [];
    for (let i = 0; i < 6; i++) xs.push(392 - off - i * 46, 688 + off + i * 46);
    xs.sort((a, b) => Math.abs(a - GATE_X) - Math.abs(b - GATE_X));
    for (const x of xs) slots.push({ x, y, row: r, tower: false, p: null, filler: null });
  });
  TOWER_X.forEach((x) => slots.push({ x, y: TOWER_FEET, row: -1, tower: true, p: null, filler: null }));
})();
const ARCHER_SCALE = 1.12;
const FOG_Y = STOP_Y - 300; // sương mù: chỉ bắn được quái đã tới gần

function activePlayers(windowMs = 180000) {
  let n = 0;
  for (const p of players.values()) if (now - p.lastActive < windowMs) n++;
  return n;
}

function ensurePlayer(user) {
  let p = players.get(user.id);
  const fresh = !p;
  if (!p) {
    p = {
      id: user.id,
      user,
      name: user.name || 'Ẩn danh',
      look: lookSeq++ % 16,
      level: 1,
      kills: 0,
      killScore: 0,
      dmg: 0,
      coins: 0,
      likes: 0,
      general: false,
      slot: null,
      lastActive: now,
      cd: {},
      awayUntil: 0,
      shotT: 0,
      aim: 0,
      fireT: rand(0, 1),
      bubble: null,
      hurtT: 0,
    };
    players.set(user.id, p);
    assignSlot(p);
    onNewPlayer(p);
  } else {
    p.user = { ...p.user, ...user };
    p.name = user.name || p.name;
  }
  p.lastActive = now;
  if (!p.slot && now > p.awayUntil) assignSlot(p);
  return p;
}

function onNewPlayer(p) {
  addToast(`🏹 ${truncate(p.name, 16)} lên tường thành`, '#ffe9a8');
  if (Math.random() < 0.35) announce(line('join', { name: p.name }), 0);
  // có người chơi mới thì thả thêm yêu quái
  if (game.phase !== 'result') {
    const n = Math.max(0, Number(config.monstersPerNewPlayer) || 0);
    game.queue += n;
    if (n && now - game.newMonstersMsgT > 15000) {
      game.newMonstersMsgT = now;
      addToast(`👹 Thêm người giữ thành, yêu quái kéo tới đông hơn`, '#ffab91');
    }
  }
}

function assignSlot(p) {
  if (p.slot || now < p.awayUntil) return;
  const top = topGifters();
  const wantTower = top.includes(p);
  let s = null;
  if (wantTower) s = slots.find((x) => x.tower && (!x.p || !top.includes(x.p)));
  if (!s) s = slots.find((x) => !x.tower && !x.p);
  if (!s) s = slots.find((x) => x.tower && !x.p);
  if (!s) {
    // hết chỗ: thay người đã lâu không tương tác
    const idle = Number(config.idleSwapSeconds || 120) * 1000;
    let worst = null;
    for (const x of slots) if (x.p && now - x.p.lastActive > idle && (!worst || x.p.lastActive < worst.p.lastActive)) worst = x;
    if (!worst) return;
    worst.p.slot = null;
    s = worst;
  }
  if (s.p) s.p.slot = null;
  s.p = p;
  s.filler = null;
  p.slot = s;
}

function topGifters() {
  return [...players.values()].filter((p) => p.coins > 0).sort((a, b) => b.coins - a.coins).slice(0, 2);
}
function refreshTowers() {
  const top = topGifters();
  for (const p of top) {
    if (p.slot && p.slot.tower) continue;
    if (now < p.awayUntil) continue;
    const t = slots.find((x) => x.tower && (!x.p || !top.includes(x.p)));
    if (!t) continue;
    const old = t.p;
    if (p.slot) p.slot.p = null;
    p.slot = t;
    t.p = p;
    t.filler = null;
    if (old) {
      old.slot = null;
      assignSlot(old);
    }
  }
}

function refreshFillers() {
  const real = [...players.values()].filter((p) => p.slot).length;
  let need = Math.max(0, (Number(config.ambientArchers) || 0) - real);
  for (const s of slots) {
    if (s.p) {
      s.filler = null;
      continue;
    }
    if (need > 0 && !s.tower) {
      if (!s.filler) s.filler = { level: 1, look: lookSeq++ % 16, fireT: rand(0, 1.5), shotT: 0, aim: 0 };
      need--;
    } else s.filler = null;
  }
}

// ------------------------------------------------------------------ hiệu ứng
function addParticle(o) {
  particles.push({ born: now, ...o });
  if (particles.length > 700) particles.splice(0, particles.length - 700);
}
function sparks(x, y, n, colors = ['#ffe066', '#fff3b0', '#ffb300']) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'spark', x, y, vx: rand(-160, 160), vy: rand(-220, -40), life: rand(400, 800), color: pick(colors), r: rand(2, 4) });
}
function smoke(x, y, n = 8, color = '#7e57c2') {
  for (let i = 0; i < n; i++) addParticle({ kind: 'smoke', x: x + rand(-14, 14), y: y + rand(-30, 0), vx: rand(-30, 30), vy: rand(-60, -20), life: rand(500, 900), color, r: rand(6, 12) });
}
function floatText(x, y, text, color = '#fff', size = 22) {
  addParticle({ kind: 'text', x, y, vx: 0, vy: -50, life: 1000, text, color, size });
}
function hearts(x, y, n) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'heart', x: x + rand(-10, 10), y, vx: rand(-20, 20), vy: rand(-90, -50), life: 1100, r: rand(7, 11) });
}
function confetti(n) {
  const colors = ['#ffd54a', '#ef5350', '#66bb6a', '#42a5f5', '#ab47bc', '#fff'];
  for (let i = 0; i < n; i++) addParticle({ kind: 'confetti', x: rand(0, W), y: rand(-200, 0), vx: rand(-60, 60), vy: rand(150, 320), life: rand(2500, 4000), color: pick(colors), r: rand(4, 8), rot: rand(0, 6) });
}
function addToast(text, color = '#fff') {
  toasts.push({ text, color, born: now });
  if (toasts.length > 5) toasts.shift();
}

const captions = [];
let lastAnnounce = performance.now();
let lastSpoken = -1e9;
function announce(text, priority = 0, force = false) {
  if (!text) return;
  lastAnnounce = performance.now();
  const level = { it: 2, vua: 1, nhieu: 0 }[config.voiceLevel] ?? 1;
  const gap = Math.max(0, Number(config.voiceGapSeconds ?? 8)) * 1000;
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
function showBanner(text, sub = '', color = '#ffd54a', ms = 2600) {
  banner = { text, sub, color, t0: now, until: now + ms };
}

// ------------------------------------------------------------------ yêu quái
function hpMul() {
  const pl = Math.min(40, activePlayers());
  return (1 + (Number(config.monsterHpPerHiep) || 0.5) * (game.hiep - 1)) * (1 + (Number(config.monsterHpPerPlayer) || 0) * pl) * (game.weather === 'trang' ? 1.25 : 1);
}
function spawnMonster(kind = null) {
  if (monsters.length >= (Number(config.maxMonsters) || 60)) return false;
  if (!kind) {
    const pool = ['moc', 'ngu', 'ho', 'ho', 'ngu', 'moc'];
    if (game.hiep >= 4) pool.push('da', 'da');
    kind = pick(pool);
  }
  const k = KINDS[kind];
  // ngư tinh có khi trồi lên từ sông
  const fromRiver = kind === 'ngu' && Math.random() < 0.5;
  const x = rand(70, W - 70);
  const y = fromRiver ? RIVER_Y + rand(-10, 10) : FOREST_Y + rand(0, 30);
  const hp = k.hp * hpMul();
  // quái thường đánh vào tường hai bên, chừa vọng lâu ở giữa cho boss
  let tx = clamp(x + rand(-160, 160), 60, W - 60);
  if (Math.abs(tx - GATE_X) < 150) tx = GATE_X + Math.sign(tx - GATE_X || 1) * rand(150, 220);
  monsters.push({
    id: ++monsterSeq, kind, x, y, tx, hp, maxHp: hp, speed: k.speed * rand(0.9, 1.15),
    dps: k.dps * (1 + 0.12 * (game.hiep - 1)), s: k.scale, boss: false, hurt: 0, burnUntil: 0, burnBy: null, atWall: false, seed: rand(0, 10), born: now, stunUntil: 0,
  });
  if (fromRiver) {
    for (let i = 0; i < 8; i++) addParticle({ kind: 'drop', x: x + rand(-14, 14), y, vx: rand(-60, 60), vy: rand(-200, -80), life: 600, r: 3, color: '#bfe9ff' });
  } else smoke(x, y, 4, '#5e4b7a');
  return true;
}
function spawnBoss() {
  const final = game.hiep >= (Number(config.hiepCount) || 10);
  const kind = final ? 'ho' : BOSSES[(game.hiep - 1) % BOSSES.length];
  const name = final ? 'Hồ ly chín đuôi' : BOSS_NAMES[kind];
  const players_ = Math.min(40, activePlayers());
  let hp = (Number(config.bossHp) || 600) * (1 + (Number(config.bossHpPerHiep) || 0.6) * (game.hiep - 1)) * (1 + (Number(config.bossHpPerPlayer) || 0.06) * players_);
  if (final) hp *= Number(config.finalBossMultiplier) || 2.5;
  if (game.weather === 'trang') hp *= 1.25;
  const b = {
    id: ++monsterSeq, kind, x: GATE_X + rand(-200, 200), y: FOREST_Y + 10, tx: GATE_X + rand(-80, 80), hp, maxHp: hp, speed: 22,
    dps: 12 + game.hiep * 1.5, s: final ? 2.9 : 2.3, boss: true, name, tails: final ? 9 : 1, hurt: 0, burnUntil: 0, atWall: false, seed: 1,
    born: now, kidnapDone: game.hiep < (Number(config.kidnapFromHiep) || 2), stunUntil: 0,
  };
  monsters.push(b);
  game.boss = b;
  game.bossSpawned = true;
  smoke(b.x, b.y, 24, '#4a148c');
  shake = Math.max(shake, 10);
  sfx.warHorn();
  sfx.roar();
  showBanner(`👹 ${name.toUpperCase()}`, final ? 'ĐẠI BOSS hiệp cuối!' : 'Boss xuất hiện, tập trung bắn!', '#ff8a80', 3000);
  announce(line('boss', { boss: name }), 2);
}

function killMonster(m, killer = null) {
  m.dead = true;
  smoke(m.x, m.y - 20 * m.s, m.boss ? 30 : 8, m.boss ? '#6a1b9a' : '#7e57c2');
  sparks(m.x, m.y - 20 * m.s, m.boss ? 30 : 6);
  sfx.poof();
  if (m.boss) {
    shake = Math.max(shake, 14);
    flash = 0.6;
    sfx.gong();
    sfx.cheer();
    if (game.kidnap && game.kidnap.boss === m) rescueDone(true);
    game.boss = null;
    game.bossKills++;
    const who = killer ? killer.name : 'cả thành';
    showBanner(`⚔️ HẠ ${m.name.toUpperCase()}!`, killer ? `Công đầu: ${truncate(killer.name, 20)}` : '', '#ffd54a', 2800);
    announce(line('bossDown', { name: who, boss: m.name }), 2, true);
  }
  if (killer) giveKill(killer, m.boss ? 3 : 1);
}

function giveKill(p, n = 1) {
  p.kills += n;
  const mult = game.weather === 'trang' ? 2 : 1;
  p.killScore += n * mult;
  const need = Array.isArray(config.levelKills) ? config.levelKills : DEFAULTS.levelKills;
  let lv = 1;
  for (let i = 0; i < need.length && i < 10; i++) if (p.killScore >= need[i]) lv = i + 1;
  lv = Math.min(10, lv);
  if (lv > p.level) {
    p.level = lv;
    const pos = archerPos(p);
    if (pos) {
      sparks(pos.x, pos.y - 50, 18, ['#fff59d', '#ffd54a', '#ffffff', '#ffab40']);
      floatText(pos.x, pos.y - 90, `CẤP ${lv}!`, '#ffe066', 26);
    }
    sfx.levelUp(lv);
    addToast(`⬆️ ${truncate(p.name, 14)} lên cấp ${lv}: ${GEAR[lv].name}`, '#fff59d');
    if (lv === 10) {
      announce(line('levelMax', { name: p.name }), 2, true);
      showBanner(`🏹 ${truncate(p.name, 18)}`, 'đạt CẤP 10, cầm Nỏ thần!', '#fff176', 2400);
    }
  }
}
function nextLevelNeed(p) {
  const need = Array.isArray(config.levelKills) ? config.levelKills : DEFAULTS.levelKills;
  if (p.level >= 10) return null;
  return need[p.level];
}

function archerPos(p) {
  if (!p.slot) return null;
  return { x: p.slot.x, y: p.slot.y };
}

// sát thương lên yêu quái
function hurtMonster(m, dmg, by = null, opts = {}) {
  if (m.dead) return;
  m.hp -= dmg;
  m.hurt = 1;
  if (by) by.dmg += dmg;
  if (opts.burn && game.weather !== 'mua') {
    m.burnUntil = now + 2000;
    m.burnBy = by;
  }
  if (opts.text !== false && (dmg >= 25 || opts.crit)) floatText(m.x + rand(-10, 10), m.y - 60 * m.s, `${opts.crit ? '💥' : ''}${Math.round(dmg)}`, opts.crit ? '#ff5252' : '#fff59d', opts.crit ? 26 : 20);
  if (m.hp <= 0) killMonster(m, by);
}

function damageMult() {
  let k = 1;
  if (game.weather === 'mua') k *= 0.85;
  if (game.weather === 'gio') k *= 1.2;
  return k;
}

function canTarget(m) {
  if (m.dead) return false;
  if (game.weather === 'suong' && game.fog > 0.15 && m.y < FOG_Y) return false;
  return m.y > FOREST_Y - 20;
}
function chooseTarget(x, exclude = null) {
  let best = null;
  let bestScore = -1e9;
  for (const m of monsters) {
    if (!canTarget(m) || m === exclude) continue;
    const score = m.y - Math.abs(m.x - x) * 0.35 + (m.boss ? 60 : 0) + rand(0, 40);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

function fireArrow(x, y, target, dmg, by, opts = {}) {
  const speed = (game.weather === 'gio' ? 1500 : 1100) * (opts.speed || 1);
  projectiles.push({ kind: opts.kind || 'arrow', x, y, target, tx: target.x, ty: target.y - 30 * target.s, dmg, by, speed, fire: Boolean(opts.fire), pierce: opts.pierce || 0, splash: opts.splash || 0, crit: Boolean(opts.crit), born: now, hit: new Set() });
}

// lính bắn 1 lượt
function archerShoot(src, p, burst = false) {
  const lv = p ? p.level : src.filler.level;
  const g = GEAR[lv];
  const sx = src.x;
  const sy = src.y - 70 * ARCHER_SCALE;
  const target = chooseTarget(sx);
  if (!target) return false;
  let dmg = LV_DMG[lv] * damageMult() * (p ? (p.general ? 1.5 : 1) : 0.6);
  const holder = p || src.filler;
  holder.aim = clamp(Math.atan2(target.x - sx, sy - target.y), -1.1, 1.1);
  holder.shotT = sec();
  const crit = lv >= 9 && Math.random() < 0.25;
  if (crit) dmg *= 2;
  const opts = { fire: Boolean(g.fire) && game.weather !== 'mua', pierce: lv >= 8 ? 1 : 0, splash: lv >= 10 ? 70 : 0, crit, kind: lv >= 10 ? 'bolt' : 'arrow' };
  fireArrow(sx, sy, target, dmg, p, opts);
  if (g.triple) {
    const t2 = chooseTarget(sx, target) || target;
    const t3 = chooseTarget(sx + rand(-200, 200), target) || target;
    fireArrow(sx - 6, sy, t2, dmg * 0.4, p, { ...opts, splash: 0 });
    fireArrow(sx + 6, sy, t3, dmg * 0.4, p, { ...opts, splash: 0 });
  } else if (lv >= 5 && Math.random() < 0.3) {
    const t2 = chooseTarget(sx, target) || target;
    fireArrow(sx + 4, sy, t2, dmg * 0.6, p, opts);
  }
  if (!burst) sfx.crossbow();
  return true;
}

// ------------------------------------------------------------------ lệnh
function onCooldown(p, act, seconds) {
  const c = p.cd[act] || 0;
  if (now < c) return true;
  p.cd[act] = now + seconds * 1000;
  return false;
}
function playerCommand(p, act) {
  const cd = Math.max(1, Number(config.cmdCooldown) || 3);
  const pos = archerPos(p);
  switch (act) {
    case 'shoot': {
      if (!pos || onCooldown(p, act, cd)) return;
      for (let i = 0; i < 3; i++) setTimeout(() => p.slot && archerShoot(p.slot, p, i > 0), i * 140);
      say(p, '🏹 Bắn!', 1200);
      break;
    }
    case 'repair': {
      if (onCooldown(p, act, cd + 1) || game.phase === 'result') return;
      const hp = (Number(config.repairHp) || 4) * (1 + (p.level - 1) * 0.1);
      gate.hp = Math.min(gate.max, gate.hp + hp);
      sparks(GATE_X + rand(-60, 60), WALL_Y + rand(20, 120), 4, ['#a5d6a7', '#e8f5e9', '#ffe082']);
      floatText(GATE_X + rand(-50, 50), WALL_Y + 40, `+${Math.round(hp)}`, '#a5d6a7', 20);
      sfx.heal();
      if (pos) say(p, '🔨 Sửa thành', 1200);
      break;
    }
    case 'rock': {
      if (!pos || onCooldown(p, act, cd + 2)) return;
      const x = pos.x;
      const dmg = 40 + p.level * 4;
      effects.push({ kind: 'rock', x, y: WALL_Y - 10, born: now, until: now + 900, by: p, dmg, done: false });
      say(p, '🪨 Lăn đá!', 1200);
      break;
    }
    case 'shield': {
      if (onCooldown(p, act, cd + 5) || game.phase === 'result') return;
      gate.shieldUntil = Math.max(gate.shieldUntil, now) + 2500;
      gate.shieldUntil = Math.min(gate.shieldUntil, now + 10000);
      sfx.shield();
      if (pos) say(p, '🛡️ Dựng khiên', 1200);
      break;
    }
    case 'drum': {
      if (onCooldown(p, act, cd + 2)) return;
      game.drumUntil = Math.min(Math.max(game.drumUntil, now) + 3000, now + 12000);
      sfx.drumRoll(3);
      if (pos) say(p, '🥁 Tùng tùng!', 1200);
      break;
    }
    case 'rescue':
      if (game.kidnap && game.kidnap.p !== p) {
        game.kidnap.got++;
        if (pos) say(p, `🙌 Cứu ${truncate(game.kidnap.p.name, 8)}!`, 1400);
        if (game.kidnap.got >= game.kidnap.need) rescueDone(true);
      }
      break;
    case 'gate':
      openGateForVillagers(p);
      break;
    default:
      break;
  }
}

function say(p, text, ms = 3000) {
  p.bubble = { text: truncate(text, 22), until: now + ms };
}

// ------------------------------------------------------------------ bắt người, dân làng, quà
function startKidnap(boss) {
  boss.kidnapDone = true;
  const cand = slots.filter((s) => s.p && !s.tower && now - s.p.lastActive < 300000).map((s) => s.p);
  if (!cand.length) return;
  cand.sort((a, b) => b.level - a.level);
  const p = pick(cand.slice(0, 4));
  const slot = p.slot;
  slot.p = null;
  p.slot = null;
  p.awayUntil = now + 1e9;
  game.kidnap = { p, boss, from: { x: slot.x, y: slot.y }, t0: now, until: now + (Number(config.rescueSeconds) || 15) * 1000, need: Math.max(1, Number(config.rescueNeeded) || 5), got: 0 };
  sfx.roar();
  showBanner(`😱 ${truncate(p.name, 16)} BỊ BẮT!`, 'Gõ "cứu" để giải cứu', '#ff8a80', 2600);
  announce(line('kidnap', { name: p.name, boss: boss.name }), 2, true);
}
function rescueDone(ok) {
  const k = game.kidnap;
  if (!k) return;
  game.kidnap = null;
  const p = k.p;
  if (ok) {
    p.awayUntil = 0;
    assignSlot(p);
    if (k.boss && !k.boss.dead) {
      k.boss.stunUntil = now + 3000;
      hurtMonster(k.boss, k.boss.maxHp * 0.1, null, { text: false });
    }
    sparks(GATE_X, WALL_Y - 40, 20);
    sfx.cheer();
    addToast(`🙌 Đã cứu ${truncate(p.name, 16)}`, '#a5d6a7');
    announce(line('rescued', { name: p.name }), 1);
  } else {
    p.level = Math.max(1, p.level - 1);
    const need = Array.isArray(config.levelKills) ? config.levelKills : DEFAULTS.levelKills;
    p.killScore = Math.min(p.killScore, need[p.level - 1] || 0);
    p.awayUntil = now + (Number(config.awaySeconds) || 15) * 1000;
    addToast(`💀 ${truncate(p.name, 16)} bị kéo ra ngoài thành (-1 cấp)`, '#ff8a80');
    announce(line('lost', { name: p.name }), 1);
  }
}

function spawnVillagers() {
  villagers.length = 0;
  for (let i = 0; i < 8; i++) villagers.push({ x: GATE_X + rand(-220, 220), y: STOP_Y - rand(20, 140), look: i, state: 'wait', tx: 0, ty: 0, born: now + i * 300 });
}
function openGateForVillagers(p) {
  if (game.weather !== 'dan' || !villagers.some((v) => v.state === 'wait')) return;
  gate.openUntil = now + 3500;
  let n = 0;
  for (const v of villagers) if (v.state === 'wait') {
    v.state = 'enter';
    n++;
  }
  const heal = gate.max * 0.025 * n;
  gate.hp = Math.min(gate.max, gate.hp + heal);
  addToast(`🧺 ${p ? truncate(p.name, 14) : 'Cả thành'} mở cổng đón ${n} người dân, thành +${Math.round(heal)}`, '#c5e1a5');
  sfx.cheer();
}

function giftRain(p, n) {
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const t = chooseTarget(rand(100, W - 100));
      if (!t) return;
      fireArrow(rand(80, W - 80), WALL_Y + 40, t, 18 * damageMult(), p, { fire: game.weather !== 'mua', speed: 1.1 });
      sfx.crossbow();
    }, i * 60);
  }
}
function giongCharge(p) {
  // chọn dải có nhiều quái nhất
  let bestY = 900;
  let best = -1;
  for (let y = 520; y <= STOP_Y - 20; y += 40) {
    const n = monsters.filter((m) => !m.dead && Math.abs(m.y - y) < 90).length;
    if (n > best) {
      best = n;
      bestY = y;
    }
  }
  const dir = Math.random() < 0.5 ? 1 : -1;
  effects.push({ kind: 'giong', y: bestY, dir, x: dir > 0 ? -160 : W + 160, by: p, born: now, until: now + 2600, hit: new Set() });
  sfx.trumpet();
  sfx.rumble(1.6, 0.2);
}
function kimQuy(p, label) {
  effects.push({ kind: 'kimquy', born: now, until: now + 4200, by: p, fired: false });
  sfx.gong();
  sfx.warHorn();
  showBanner('🐢 RÙA VÀNG HIỆN LÊN', p ? `${truncate(p.name, 18)} gọi Nỏ thần` : 'Nỏ thần bắn một phát', '#fff176', 3200);
  if (p) announce(line('giftKimQuy', { name: p.name, gift: label }), 2, true);
  else announce(line('kimQuyLikes'), 2, true);
}
function kimQuyFire(e) {
  e.fired = true;
  flash = 1;
  shake = 20;
  sfx.thunder();
  sfx.rumble(2, 0.3);
  for (const m of monsters) {
    if (m.dead) continue;
    if (m.boss) hurtMonster(m, m.maxHp * 0.4, e.by, { crit: true });
    else {
      sparks(m.x, m.y - 20, 6, ['#fff59d', '#ffffff']);
      killMonster(m, e.by);
    }
  }
  gate.hp = Math.min(gate.max, gate.hp + gate.max * 0.3);
  game.queue = Math.max(0, game.queue - 4);
}

// ------------------------------------------------------------------ sự kiện từ TikTok
function handleEvent(ev) {
  const user = ev.user;
  switch (ev.type) {
    case 'join':
      if (user) ensurePlayer(user);
      break;
    case 'chat': {
      if (!user) break;
      const text = String(ev.text || '').trim();
      const p = ensurePlayer(user);
      const act = detectCommand(text);
      if (act) playerCommand(p, act);
      else if (text) say(p, text, 3500);
      break;
    }
    case 'like': {
      if (!user) break;
      const p = ensurePlayer(user);
      const n = clamp(Number(ev.count) || 1, 1, 100);
      p.likes += n;
      const pos = archerPos(p);
      if (pos) hearts(pos.x, pos.y - 80, Math.min(3, n));
      sfx.pop();
      if (game.phase === 'result') break;
      game.likePool += n;
      const per = Math.max(1, Number(config.likesPerRain) || 20);
      let rains = 0;
      while (game.likePool >= per && rains < 4) {
        game.likePool -= per;
        rains++;
        giftRain(p, 8);
      }
      if (rains) addToast(`❤️ ${truncate(p.name, 14)}: mưa tên!`, '#ffcdd2');
      if (game.weather === 'suong' && game.fog > 0) {
        game.fogLikes += n;
        game.fog = clamp(1 - game.fogLikes / Math.max(1, Number(config.fogLikes) || 100), 0, 1);
        if (game.fog <= 0) addToast('🌬️ Sương mù đã tan, bắn được xa rồi!', '#b3e5fc');
      }
      game.kimQuyLikes += n;
      const kq = Math.max(1, Number(config.kimQuyLikes) || 1000);
      if (game.kimQuyLikes >= kq && game.phase === 'fight') {
        game.kimQuyLikes = 0;
        kimQuy(null, '');
      }
      break;
    }
    case 'follow': {
      if (!user) break;
      const p = ensurePlayer(user);
      if (!p.general) {
        p.general = true;
        const pos = archerPos(p);
        if (pos) sparks(pos.x, pos.y - 80, 16);
        sfx.sparkle();
        addToast(`⭐ ${truncate(p.name, 16)} được phong tướng`, '#ffe082');
        announce(line('follow', { name: p.name }), 1);
      }
      break;
    }
    case 'share': {
      if (!user) break;
      const p = ensurePlayer(user);
      if (game.weather === 'dan' && villagers.some((v) => v.state === 'wait')) openGateForVillagers(p);
      if (game.phase === 'result') break;
      const secs = (Number(config.catapultSeconds) || 60) * 1000;
      if (catapults.length < 2) {
        const side = catapults.length ? -catapults[0].side : Math.random() < 0.5 ? -1 : 1;
        catapults.push({ side, x: GATE_X + side * 200, y: WALL_Y + 50, until: now + secs, fireT: 0, nextT: now + 800, by: p });
      } else {
        const c = catapults.reduce((a, b) => (a.until < b.until ? a : b));
        c.until = Math.min(now + secs * 2, c.until + secs);
        c.by = p;
      }
      sfx.thud();
      addToast(`🪨 ${truncate(p.name, 14)} dựng máy bắn đá`, '#d7ccc8');
      announce(line('share', { name: p.name }), 1);
      break;
    }
    case 'gift': {
      if (!user) break;
      const p = ensurePlayer(user);
      const coinsN = Number(ev.coins) || (Number(ev.diamonds) || 1) * (Number(ev.repeatCount) || 1);
      const label = `${ev.giftName || 'quà'}${Number(ev.repeatCount) > 1 ? ` x${ev.repeatCount}` : ''}`;
      p.coins += coinsN;
      refreshTowers();
      if (game.kidnap) rescueDone(true);
      const tiers = { ...DEFAULTS.giftTiers, ...(config.giftTiers || {}) };
      if (game.phase === 'result') {
        addToast(`🎁 ${truncate(user.name, 16)}: ${truncate(label, 14)}`, '#ffe9a8');
        announce(`Cảm ơn ${user.name} tặng ${label}`, 1);
        break;
      }
      if (coinsN >= tiers.big) kimQuy(p, label);
      else if (coinsN >= tiers.medium) {
        giongCharge(p);
        addToast(`🐎 ${truncate(user.name, 14)} gọi Thánh Gióng`, '#ffcc80');
        showBanner('🐎 THÁNH GIÓNG', `${truncate(user.name, 18)} tặng ${truncate(label, 16)}`, '#ffcc80', 2200);
        announce(line('giftGiong', { name: user.name, gift: label }), 2);
      } else {
        giftRain(p, clamp(6 + coinsN * 4, 6, 30));
        addToast(`🔥 ${truncate(user.name, 14)}: mưa tên lửa`, '#ffab91');
        announce(line('giftSmall', { name: user.name, gift: label }), 1);
        sfx.sparkle();
      }
      break;
    }
    // ----- chỉ dùng khi thử ở bảng điều khiển
    case 'weather':
      setWeather(String(ev.kind || ''));
      break;
    case 'levelUp': {
      // thử: cho người này lên ngay 1 cấp để xem trang bị
      if (!user) break;
      const p = ensurePlayer(user);
      const need = nextLevelNeed(p);
      if (need != null) giveKill(p, Math.max(1, Math.ceil((need - p.killScore) / (game.weather === 'trang' ? 2 : 1))));
      break;
    }
    case 'bossNow':
      if (game.phase === 'fight' && !game.boss) spawnBoss();
      break;
    case 'skipHiep':
      if (game.phase === 'fight') {
        monsters = [];
        if (game.kidnap) rescueDone(true);
        game.boss = null;
        game.queue = 0;
        clearHiep();
      } else if (game.phase === 'break') startHiep(game.hiep + 1);
      break;
    case 'loseNow':
      if (game.phase !== 'result') gate.hp = 0;
      break;
    case 'voiceTest':
      announce('Xin chào cả nhà. Thủ thành Cổ Loa. Bình luận để làm lính nỏ, hạ yêu quái để lên cấp', 2, true);
      break;
    case 'reset':
      players.clear();
      for (const s of slots) s.p = null;
      record = { hiep: 0, wins: 0 };
      saveRecord();
      newDot();
      break;
    default:
      break;
  }
}

// ------------------------------------------------------------------ hiệp, đợt
function setWeather(kind) {
  game.weather = PHENOMENA[kind] ? kind : '';
  game.fog = 1;
  game.fogLikes = 0;
  villagers.length = 0;
  if (game.weather === 'dan') spawnVillagers();
  if (game.weather) {
    const ph = PHENOMENA[game.weather];
    addToast(`${ph.icon} ${ph.name}: ${ph.desc}`, '#e1f5fe');
    if (game.weather === 'set') sfx.thunder();
  }
}
function startHiep(n) {
  game.hiep = n;
  game.phase = 'fight';
  game.t0 = now;
  game.bossSpawned = false;
  game.boss = null;
  game.trickleT = now;
  game.gateLowWarned = false;
  const base = Number(config.baseMonsters) || 6;
  const per = Number(config.monstersPerHiep) || 2;
  const pp = Number(config.monstersPerPlayerPerHiep) || 0;
  game.queue += Math.round(base + per * n + pp * Math.min(60, activePlayers()));
  const chance = Number(config.phenomenaChance ?? 0.75);
  const list = (Array.isArray(config.phenomena) ? config.phenomena : DEFAULTS.phenomena).filter((k) => PHENOMENA[k]);
  setWeather(n >= 2 && list.length && Math.random() < chance ? pick(list) : '');
  const ph = game.weather ? PHENOMENA[game.weather] : null;
  showBanner(`HIỆP ${n}/${config.hiepCount}`, ph ? `${ph.icon} ${ph.name}: ${ph.desc}` : 'Yêu quái kéo đến!', '#ffd54a', 2800);
  sfx.drumRoll(6);
  if (n === 1) sfx.warHorn();
  announce(line('hiepStart', { n }) + (ph ? `. ${ph.name}` : ''), 1);
}
function clearHiep() {
  const n = game.hiep;
  record.hiep = Math.max(record.hiep, n);
  saveRecord();
  if (n >= (Number(config.hiepCount) || 10)) {
    endDot(true);
    return;
  }
  game.phase = 'break';
  game.phaseUntil = now + (Number(config.breakSeconds) || 6) * 1000;
  const heal = gate.max * (Number(config.gateHealPerHiep) || 0.08);
  gate.hp = Math.min(gate.max, gate.hp + heal);
  showBanner(`✅ QUA HIỆP ${n}`, `Thành được sửa +${Math.round(heal)}`, '#a5d6a7', 2600);
  sfx.cheer();
  announce(line('hiepClear', { n }), 1);
  setWeather('');
}
function mvpList() {
  return [...players.values()].filter((p) => p.kills > 0 || p.dmg > 0).sort((a, b) => b.kills - a.kills || b.dmg - a.dmg).slice(0, 3);
}
function endDot(won) {
  game.phase = 'result';
  game.won = won;
  game.phaseUntil = now + (Number(config.resultSeconds) || 14) * 1000;
  game.mvp = mvpList();
  if (game.kidnap) rescueDone(true);
  setWeather('');
  if (won) {
    record.wins++;
    record.hiep = Math.max(record.hiep, game.hiep);
    confetti(160);
    sfx.cheer();
    sfx.gong();
    announce(line('win', { name: game.mvp[0] ? game.mvp[0].name : 'cả thành' }), 2, true);
  } else {
    shake = 24;
    flash = 0.8;
    sfx.rumble(2.4, 0.35);
    sfx.gong();
    announce(line('lose', { n: game.hiep }), 2, true);
  }
  saveRecord();
}
function newDot() {
  game.dot++;
  monsters = [];
  projectiles = [];
  effects.length = 0;
  catapults.length = 0;
  villagers.length = 0;
  game.queue = 0;
  game.kidnap = null;
  game.likePool = 0;
  game.drumUntil = 0;
  gate.max = Math.max(100, Number(config.gateHp) || 1000);
  gate.hp = gate.max;
  gate.shieldUntil = 0;
  // hết đợt: cấp lính về 1
  for (const p of players.values()) {
    p.level = 1;
    p.kills = 0;
    p.killScore = 0;
    p.dmg = 0;
    p.awayUntil = 0;
    if (!p.slot) assignSlot(p);
  }
  startHiep(1);
}

// ------------------------------------------------------------------ cập nhật
let lastSwap = 0;
function update(dt) {
  const t = sec();
  shake = Math.max(0, shake - dt * 30);
  flash = Math.max(0, flash - dt * 1.5);
  // pha
  if (game.phase === 'break' && now >= game.phaseUntil) startHiep(game.hiep + 1);
  if (game.phase === 'result' && now >= game.phaseUntil) newDot();
  if (game.phase === 'fight') {
    const hs = (Number(config.hiepSeconds) || 50) * 1000;
    const bossAt = hs - (Number(config.bossBeforeEnd) || 12) * 1000;
    const el = now - game.t0;
    // thả quái từ hàng chờ
    if (el < bossAt) {
      if (now - game.trickleT > (Number(config.trickleSeconds) || 6) * 1000) {
        game.trickleT = now;
        game.queue++;
      }
    }
    // thả quái theo từng đàn để có lúc dồn dập
    if (game.queue > 0 && now >= game.spawnT) {
      const pack = Math.min(game.queue, 3 + Math.floor(game.hiep / 2) + Math.floor(game.queue / 12));
      for (let i = 0; i < pack; i++) if (spawnMonster()) game.queue--;
      game.spawnT = now + (Number(config.packSeconds) || 5) * 1000 * rand(0.8, 1.2);
    }
    if (!game.bossSpawned && el >= bossAt) spawnBoss();
    if (game.bossSpawned && !game.boss && el >= hs) clearHiep();
    if (gate.hp <= 0) {
      gate.hp = 0;
      endDot(false);
    }
  }
  // sét đánh
  if (game.weather === 'set' && game.phase === 'fight' && now > game.lightningT) {
    game.lightningT = now + rand(3000, 5000);
    const cands = monsters.filter((m) => !m.dead && m.y > 420);
    if (cands.length) {
      const m = pick(cands);
      effects.push({ kind: 'lightning', x: m.x, y: m.y - 20, born: now, until: now + 350 });
      flash = Math.max(flash, 0.35);
      sfx.thunder();
      hurtMonster(m, m.boss ? 80 : 70, null, { crit: true });
    }
  }
  // dân làng
  for (const v of villagers) {
    if (v.state === 'enter') {
      v.x += (GATE_X - v.x) * Math.min(1, dt * 2.5);
      v.y += 120 * dt;
      if (v.y > WALL_Y + 120) v.state = 'in';
    }
  }
  for (let i = villagers.length - 1; i >= 0; i--) if (villagers[i].state === 'in') villagers.splice(i, 1);
  if (now > gate.openUntil) gate.open = Math.max(0, gate.open - dt * 2);
  else gate.open = Math.min(1, gate.open + dt * 3);
  // yêu quái di chuyển
  const shield = now < gate.shieldUntil;
  let wallDps = 0;
  for (const m of monsters) {
    if (m.dead) continue;
    m.hurt = Math.max(0, m.hurt - dt * 5);
    if (m.burnUntil > now) {
      m.burnT = (m.burnT || 0) + dt;
      if (m.burnT > 0.5) {
        m.burnT = 0;
        hurtMonster(m, 5, m.burnBy, { text: false });
        if (m.dead) continue;
      }
    }
    if (now < m.stunUntil) continue;
    if (!m.atWall) {
      const sp = m.speed * (game.weather === 'mua' ? 0.85 : 1);
      m.y += sp * dt;
      const k = clamp((m.y - FOREST_Y) / (STOP_Y - FOREST_Y), 0, 1);
      m.x += (m.tx - m.x) * dt * (0.4 + k * k * 2.5) * k + (m.kind === 'ho' ? Math.sin(sec() * 3 + m.seed) * 40 * dt : 0);
      m.x = clamp(m.x, 40, W - 40);
      if (m.y >= STOP_Y - (m.boss ? 8 : rand(0, 6))) {
        m.atWall = true;
        m.y = Math.min(m.y, STOP_Y);
      }
      if (m.boss && !m.kidnapDone && m.y > STOP_Y - 130) startKidnap(m);
    } else {
      wallDps += m.dps;
      if (Math.random() < dt * 1.2) {
        gate.hitT = sec();
        sfx.gateHit();
        if (Math.random() < 0.3) addParticle({ kind: 'spark', x: m.x, y: WALL_Y - 4, vx: rand(-80, 80), vy: rand(-140, -40), life: 400, color: '#8d6e63', r: 3 });
      }
    }
  }
  if (game.phase === 'fight' && wallDps > 0) {
    // giới hạn tốc độ vỡ thành để người xem luôn có thời gian sửa thành, dựng khiên, tặng quà cứu thành
    const cap = gate.max * (Number(config.maxWallDamagePerSecond) || 0.03) * (1 + (game.hiep - 1) * 0.05);
    wallDps = Math.min(wallDps, cap);
    gate.hp -= wallDps * dt * (shield ? 0.4 : 1);
    if (!game.gateLowWarned && gate.hp < gate.max * 0.3) {
      game.gateLowWarned = true;
      announce(line('gateLow'), 2);
      addToast('⚠️ Cổng thành sắp vỡ! Gõ 2 sửa, 4 khiên', '#ff8a80');
    }
    if (game.boss && game.boss.atWall) shake = Math.max(shake, 2.5);
  }
  monsters = monsters.filter((m) => !m.dead);
  // bắt người
  if (game.kidnap) {
    if (now > game.kidnap.until) rescueDone(false);
    else if (game.kidnap.boss.dead) rescueDone(true);
  }
  // lính bắn
  const fireK = now < game.drumUntil ? 1.35 : 1;
  for (const s of slots) {
    const p = s.p;
    const h = p || s.filler;
    if (!h) continue;
    if (p && now < p.awayUntil) continue;
    h.fireT = (h.fireT || 0) - dt * fireK;
    if (h.fireT <= 0 && game.phase !== 'result') {
      const lv = p ? p.level : 1;
      h.fireT = LV_CD[lv] * rand(0.9, 1.1) * (p ? 1 : 1.3);
      archerShoot(s, p);
    }
  }
  // máy bắn đá
  for (let i = catapults.length - 1; i >= 0; i--) {
    const c = catapults[i];
    if (now > c.until) {
      catapults.splice(i, 1);
      continue;
    }
    if (now > c.nextT && game.phase === 'fight') {
      c.nextT = now + 2500;
      const t1 = chooseTarget(c.x);
      if (t1) {
        c.fireT = sec();
        projectiles.push({ kind: 'boulder', x: c.x, y: c.y - 60, sx: c.x, sy: c.y - 60, target: t1, tx: t1.x, ty: t1.y - 10, dmg: 50, by: c.by, born: now, dur: 900, splash: 80, hit: new Set() });
        sfx.thud();
      }
    }
  }
  // đạn bay
  for (const pr of projectiles) {
    if (pr.kind === 'boulder') {
      const k = (now - pr.born) / pr.dur;
      if (pr.target && !pr.target.dead) {
        pr.tx = pr.target.x;
        pr.ty = pr.target.y - 10;
      }
      pr.x = pr.sx + (pr.tx - pr.sx) * k;
      pr.y = pr.sy + (pr.ty - pr.sy) * k - Math.sin(k * Math.PI) * 220;
      if (k >= 1) {
        pr.done = true;
        explode(pr.tx, pr.ty, pr.splash, pr.dmg, pr.by);
      }
      continue;
    }
    if (pr.target && !pr.target.dead) {
      pr.tx = pr.target.x;
      pr.ty = pr.target.y - 30 * pr.target.s;
    }
    const dx = pr.tx - pr.x;
    const dy = pr.ty - pr.y;
    const d = Math.hypot(dx, dy);
    const step = pr.speed * dt;
    pr.ang = Math.atan2(dy, dx);
    if (d <= step + 4) {
      pr.x = pr.tx;
      pr.y = pr.ty;
      if (pr.target && !pr.target.dead) {
        hurtMonster(pr.target, pr.dmg, pr.by, { burn: pr.fire, crit: pr.crit });
        sfx.hit();
        if (pr.splash) explode(pr.tx, pr.ty, pr.splash, pr.dmg * 0.5, pr.by, true);
        if (pr.pierce > 0) {
          pr.pierce--;
          pr.hit.add(pr.target);
          const next = monsters.find((m) => !m.dead && !pr.hit.has(m) && Math.hypot(m.x - pr.x, m.y - pr.y) < 160);
          if (next) {
            pr.target = next;
            pr.dmg *= 0.7;
            continue;
          }
        }
      }
      pr.done = true;
    } else {
      pr.x += (dx / d) * step;
      pr.y += (dy / d) * step;
    }
    if (now - pr.born > 3000) pr.done = true;
  }
  projectiles = projectiles.filter((p) => !p.done);
  // hiệu ứng lớn
  for (const e of effects) {
    if (e.kind === 'rock') {
      const k = (now - e.born) / (e.until - e.born);
      e.y = WALL_Y - 10 - k * 160;
      if (!e.done && k > 0.4) {
        e.done = true;
        for (const m of monsters) if (!m.dead && Math.abs(m.x - e.x) < 70 && m.y > STOP_Y - 170) hurtMonster(m, e.dmg, e.by);
        sfx.rumble(0.6, 0.15);
        shake = Math.max(shake, 4);
      }
    } else if (e.kind === 'giong') {
      const k = (now - e.born) / (e.until - e.born);
      e.x = e.dir > 0 ? -160 + k * (W + 320) : W + 160 - k * (W + 320);
      for (const m of monsters) {
        if (m.dead || e.hit.has(m) || Math.abs(m.y - e.y) > 100 || Math.abs(m.x - e.x) > 60) continue;
        e.hit.add(m);
        if (m.boss) hurtMonster(m, m.maxHp * 0.15, e.by, { crit: true });
        else hurtMonster(m, 400, e.by, { burn: true });
        sparks(m.x, m.y - 20, 6, ['#ff9800', '#ffeb3b', '#fff']);
      }
      if (Math.random() < dt * 30) addParticle({ kind: 'smoke', x: e.x - e.dir * 60, y: e.y - 20, vx: -e.dir * 40, vy: rand(-40, -10), life: 700, color: '#ff7043', r: rand(8, 14) });
    } else if (e.kind === 'kimquy') {
      if (!e.fired && now - e.born > 1600) kimQuyFire(e);
    }
  }
  for (let i = effects.length - 1; i >= 0; i--) if (now > effects[i].until) effects.splice(i, 1);
  // hạt
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const age = now - p.born;
    if (age > p.life) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'spark' || p.kind === 'drop') p.vy += 500 * dt;
    if (p.kind === 'confetti') p.rot += dt * 5;
  }
  // xoay vòng người dự bị, chia tháp
  if (now - lastSwap > 3000) {
    lastSwap = now;
    for (const p of players.values()) if (!p.slot && now > p.awayUntil && now - p.lastActive < 60000) assignSlot(p);
    refreshFillers();
  }
  // nhạc căng theo trận
  const pressure = clamp((monsters.length + game.queue) / 40, 0, 1);
  sfx.setIntensity(game.boss ? 1 : pressure);
}

function explode(x, y, r, dmg, by, quiet = false) {
  for (const m of monsters) if (!m.dead && Math.hypot(m.x - x, m.y - y) < r) hurtMonster(m, dmg, by, { text: !quiet });
  for (let i = 0; i < 10; i++) addParticle({ kind: 'smoke', x: x + rand(-r / 2, r / 2), y: y + rand(-20, 10), vx: rand(-60, 60), vy: rand(-80, -20), life: 600, color: quiet ? '#fff59d' : '#8d6e63', r: rand(6, 14) });
  if (!quiet) {
    sfx.thud();
    shake = Math.max(shake, 3);
  }
}

// ------------------------------------------------------------------ vẽ
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
    const k = 1 - (now - p.born) / p.life;
    ctx.globalAlpha = clamp(k, 0, 1);
    if (p.kind === 'spark' || p.kind === 'drop') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    } else if (p.kind === 'smoke') {
      ctx.globalAlpha = clamp(k, 0, 1) * 0.6;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1.6 - k * 0.6), 0, TAU);
      ctx.fill();
    } else if (p.kind === 'heart') {
      ctx.fillStyle = '#ff4d6d';
      heartPath(p.x, p.y, p.r * 2);
      ctx.fill();
    } else if (p.kind === 'confetti') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      ctx.restore();
    } else if (p.kind === 'text') {
      ctx.font = `800 ${p.size}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
  }
  ctx.globalAlpha = 1;
}

function drawProjectiles() {
  for (const p of projectiles) {
    if (p.kind === 'boulder') {
      ctx.fillStyle = '#8d877c';
      ctx.strokeStyle = '#2a1d14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, TAU);
      ctx.fill();
      ctx.stroke();
      continue;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.ang || -Math.PI / 2);
    if (p.kind === 'bolt') {
      ctx.strokeStyle = '#fff59d';
      ctx.shadowColor = '#ffeb3b';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(-12, -4);
      ctx.lineTo(-4, 3);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = p.fire ? '#ff9800' : '#6d4c2f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(4, 0);
      ctx.stroke();
      ctx.fillStyle = p.fire ? '#ffeb3b' : '#eceff1';
      ctx.beginPath();
      ctx.moveTo(4, -3);
      ctx.lineTo(10, 0);
      ctx.lineTo(4, 3);
      ctx.fill();
      if (p.fire) {
        ctx.fillStyle = 'rgba(255,120,0,0.6)';
        ctx.beginPath();
        ctx.ellipse(-16, 0, 8, 3, 0, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

function hpBar(x, y, w, k, color, h = 6) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y, w * clamp(k, 0, 1), h);
}

function drawMonsters() {
  const t = sec();
  const list = [...monsters].sort((a, b) => a.y - b.y);
  for (const m of list) {
    const fog = game.weather === 'suong' && m.y < FOG_Y ? game.fog : 0;
    ctx.globalAlpha = 1 - fog * 0.75;
    const attack = m.atWall ? Math.sin(t * 8 + m.seed) * 4 : 0;
    drawMonster(ctx, m.kind, m.x, m.y - Math.max(0, attack), m.s, t, { hurt: m.hurt, boss: m.boss, tails: m.tails, seed: m.seed, burnT: m.burnUntil > now ? t + 1 : 0 });
    ctx.globalAlpha = 1;
    if (m.boss) {
      const w = 180;
      hpBar(m.x, m.y - 80 * m.s - 22, w, m.hp / m.maxHp, '#e040fb', 10);
      ctx.font = `800 20px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeText(m.name, m.x, m.y - 80 * m.s - 26);
      ctx.fillStyle = '#ffccff';
      ctx.fillText(m.name, m.x, m.y - 80 * m.s - 26);
      // người bị bắt treo trên tay boss
      if (game.kidnap && game.kidnap.boss === m) {
        const k = game.kidnap;
        const hx = m.x + 50 * m.s * 0.6;
        const hy = m.y - 40 * m.s;
        drawArcher(ctx, hx, hy + Math.sin(t * 6) * 4, 0.8, { level: k.p.level, look: k.p.look, aim: 0.6, hurtT: t }, t);
        ctx.font = `800 20px ${FONT}`;
        ctx.textBaseline = 'middle';
        const txt = `🆘 ${truncate(k.p.name, 12)} · cứu ${k.got}/${k.need}`;
        const tw = ctx.measureText(txt).width + 24;
        ctx.fillStyle = 'rgba(183,28,28,0.9)';
        rr(ctx, hx - tw / 2, hy + 14, tw, 32, 16);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(txt, hx, hy + 31);
      }
    } else if (m.hp < m.maxHp) {
      hpBar(m.x, m.y - 72 * m.s, 36, m.hp / m.maxHp, m.hp / m.maxHp > 0.5 ? '#76ff03' : '#ff9100', 4);
    }
  }
}

function levelColor(lv) {
  return ['#9e9e9e', '#9e9e9e', '#8bc34a', '#4caf50', '#26a69a', '#29b6f6', '#5c6bc0', '#ab47bc', '#ef5350', '#ff9800', '#ffd600'][lv];
}

function drawArchers() {
  const t = sec();
  const order = [...slots].sort((a, b) => a.y - b.y);
  for (const s of order) {
    const p = s.p;
    if (p && now < p.awayUntil) continue;
    const h = p || s.filler;
    if (!h) continue;
    const lv = p ? p.level : h.level;
    const sc = ARCHER_SCALE * (s.tower ? 1.15 : 1) * (p && p.general ? 1.08 : 1);
    drawArcher(ctx, s.x, s.y, sc, { level: lv, look: h.look, aim: h.aim, shotT: h.shotT, general: p && p.general, hurtT: p ? p.hurtT : 0 }, t);
  }
  // tên + cấp vẽ sau để không bị lính hàng sau che
  ctx.textBaseline = 'middle';
  for (const s of order) {
    const p = s.p;
    if (!p || now < p.awayUntil) continue;
    const sc = ARCHER_SCALE * (s.tower ? 1.15 : 1);
    // tên so le cao thấp để người đứng cạnh nhau không đè tên
    const ty = s.y - 84 * sc - (s.tower ? 0 : (Math.round(Math.abs(s.x - GATE_X) / 46) % 2) * 17);
    ctx.font = `700 13px ${FONT}`;
    ctx.textAlign = 'center';
    const name = truncate(p.name, s.tower ? 12 : 6);
    const w = ctx.measureText(name).width + 22;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, s.x - w / 2, ty - 9, w, 18, 9);
    ctx.fill();
    ctx.fillStyle = levelColor(p.level);
    ctx.beginPath();
    ctx.arc(s.x - w / 2 + 2, ty, 10, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2a1d14';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = p.level >= 9 ? '#2a1d14' : '#fff';
    ctx.font = `800 12px ${FONT}`;
    ctx.fillText(String(p.level), s.x - w / 2 + 2, ty + 0.5);
    ctx.font = `700 13px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(name, s.x + 5, ty);
    if (p.bubble && now < p.bubble.until) {
      ctx.font = `600 16px ${FONT}`;
      const bw = Math.min(260, ctx.measureText(p.bubble.text).width + 20);
      const by = ty - 30;
      const bx = clamp(s.x, bw / 2 + 4, W - bw / 2 - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      rr(ctx, bx - bw / 2, by - 13, bw, 26, 12);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s.x - 5, by + 12);
      ctx.lineTo(s.x, by + 19);
      ctx.lineTo(s.x + 5, by + 12);
      ctx.fill();
      ctx.fillStyle = '#2a1d14';
      ctx.fillText(p.bubble.text, bx, by + 1, bw - 10);
    }
  }
}

function drawEffects() {
  const t = sec();
  for (const e of effects) {
    if (e.kind === 'rock') {
      ctx.fillStyle = '#8d877c';
      ctx.strokeStyle = '#2a1d14';
      ctx.lineWidth = 2.5;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(t * 8);
      ctx.beginPath();
      ctx.moveTo(-18, -6);
      ctx.lineTo(-8, -18);
      ctx.lineTo(12, -14);
      ctx.lineTo(20, 4);
      ctx.lineTo(6, 18);
      ctx.lineTo(-14, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (e.kind === 'giong') {
      drawGiong(ctx, e.x, e.y, 1.6, e.dir, t);
      if (e.by) {
        ctx.font = `800 20px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(truncate(e.by.name, 16), e.x, e.y - 190);
        ctx.fillStyle = '#ffcc80';
        ctx.fillText(truncate(e.by.name, 16), e.x, e.y - 190);
      }
    } else if (e.kind === 'kimquy') {
      const age = now - e.born;
      const k = clamp(age / 800, 0, 1) * clamp((e.until - now) / 600, 0, 1);
      drawKimQuy(ctx, GATE_X, WALL_Y - 200 - (1 - k) * 40, 1.3, t, k);
      if (age > 1300 && age < 2200) {
        // tia Nỏ thần
        const a = 1 - (age - 1300) / 900;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#fffde7';
        ctx.shadowColor = '#ffeb3b';
        ctx.shadowBlur = 30;
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(GATE_X, WALL_Y - 260);
        ctx.lineTo(GATE_X, FOREST_Y - 40);
        ctx.stroke();
        ctx.lineWidth = 8;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(GATE_X, WALL_Y - 260);
          ctx.lineTo(GATE_X + i * 160, FOREST_Y);
          ctx.stroke();
        }
        ctx.restore();
      }
    } else if (e.kind === 'lightning') {
      lightningBolt(ctx, e.x, e.y, clamp((e.until - now) / 350, 0, 1));
    }
  }
}

let wt = 0;
function wmark(k) {
  const P = window.__prof;
  if (!P) return;
  const n = performance.now();
  if (k !== 'start') P['w_' + k] = (P['w_' + k] || 0) + n - wt;
  wt = n;
}
// bảng 10 cấp trang bị ở sân trong thành (phần dưới, cho người xem biết lên cấp được gì)
const LADDER_SHORT = ['', 'Nỏ tre', 'Nón lá', 'Giáp da', 'Nỏ đồng', 'Mũ đồng', 'Tên lửa', 'Liên châu', 'Giáp đồng', 'Nỏ vàng', 'Nỏ thần'];
function drawLadder(t) {
  const y0 = WALL_Y + 250;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, 16, y0 - 34, W - 32, 196, 22);
  ctx.fill();
  ctx.font = `800 24px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe082';
  ctx.fillText('⬆️ Hạ yêu quái để lên cấp, tối đa cấp 10', W / 2, y0 - 10);
  for (let lv = 1; lv <= 10; lv++) {
    const x = 16 + (W - 32) * ((lv - 0.5) / 10);
    drawArcher(ctx, x, y0 + 104, 0.9, { level: lv, look: lv * 3, aim: Math.sin(t + lv) * 0.3 }, t);
    ctx.fillStyle = levelColor(lv);
    ctx.beginPath();
    ctx.arc(x, y0 + 126, 13, 0, TAU);
    ctx.fill();
    ctx.fillStyle = lv >= 9 ? '#2a1d14' : '#fff';
    ctx.font = `800 15px ${FONT}`;
    ctx.fillText(String(lv), x, y0 + 127);
    ctx.fillStyle = '#fff';
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText(LADDER_SHORT[lv], x, y0 + 150);
  }
}

function drawWorld() {
  wmark('start');
  const t = sec();
  ctx.save();
  if (shake > 0) ctx.translate(rand(-shake, shake), rand(-shake, shake));
  ctx.drawImage(bgImage || bg, 0, 0, W, H);
  wmark('bg');
  // nước sông lấp lánh
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const x = ((t * 40 + i * 140) % (W + 100)) - 50;
    const y = RIVER_Y + Math.sin(x * 0.008) * 30 + ((i % 3) - 1) * 14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 24, y);
    ctx.stroke();
  }
  drawLadder(t);
  for (const v of villagers) if (now > v.born) drawVillager(ctx, v.x, v.y, 1, t, v.look);
  drawGate(ctx, gate.hp / gate.max, t, gate.hitT, gate.open, game.phase === 'result' && !game.won);
  const top = topGifters();
  TOWER_X.forEach((x, i) => drawTower(ctx, x, t, top[i] ? truncate(top[i].name, 10) : '', i ? '#1565c0' : '#c62828'));
  wmark('gateTower');
  drawMonsters();
  wmark('monsters');
  drawProjectiles();
  for (const c of catapults) drawCatapult(ctx, c.x, c.y, 1.2, t, c.fireT);
  drawArchers();
  wmark('archers');
  // khiên phủ tường
  if (now < gate.shieldUntil) {
    const a = 0.25 + Math.sin(t * 8) * 0.08;
    ctx.fillStyle = `rgba(100,181,246,${a})`;
    ctx.fillRect(0, WALL_Y - 30, W, 40);
    ctx.strokeStyle = `rgba(187,222,251,${a + 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, WALL_Y - 30);
    ctx.lineTo(W, WALL_Y - 30);
    ctx.stroke();
  }
  drawEffects();
  drawWeather(ctx, game.weather, t, 1, { density: game.fog });
  drawParticles();
  ctx.restore();
}

function chip(text, x, y, color, bgc = 'rgba(0,0,0,0.6)', size = 22, align = 'center') {
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + 24;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.fillStyle = bgc;
  rr(ctx, x0, y - size * 0.75, w, size * 1.5, size * 0.75);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x0 + w / 2, y + 1);
  return w;
}

function bar(x, y, w, h, k, color, label, right = '') {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, w, h, h / 2);
  ctx.clip();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, color[0]);
  g.addColorStop(1, color[1]);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w * clamp(k, 0, 1), h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, h / 2);
  ctx.stroke();
  ctx.font = `800 ${Math.round(h * 0.62)}px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.textAlign = 'left';
  ctx.strokeText(label, x + 12, y + h / 2 + 1);
  ctx.fillStyle = '#fff';
  ctx.fillText(label, x + 12, y + h / 2 + 1);
  if (right) {
    ctx.textAlign = 'right';
    ctx.strokeText(right, x + w - 12, y + h / 2 + 1);
    ctx.fillText(right, x + w - 12, y + h / 2 + 1);
  }
}

function drawHeader() {
  const g = ctx.createLinearGradient(0, 0, 0, 280);
  g.addColorStop(0, 'rgba(20,10,30,0.9)');
  g.addColorStop(1, 'rgba(20,10,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 290);
  // tiêu đề + hiệp
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `900 40px ${FONT}`;
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#5d1a0a';
  ctx.strokeText(config.title, 24, 44);
  ctx.fillStyle = '#ffd54a';
  ctx.fillText(config.title, 24, 44);
  const hc = Number(config.hiepCount) || 10;
  const hs = (Number(config.hiepSeconds) || 50) * 1000;
  let right = '';
  if (game.phase === 'fight') {
    const left = Math.max(0, hs - (now - game.t0));
    right = game.boss ? '👹 HẠ BOSS!' : `⏱ ${Math.ceil(left / 1000)}s`;
  } else if (game.phase === 'break') right = '⏳ nghỉ';
  else right = game.won ? '🏆 THẮNG' : '💥 THẤT THỦ';
  ctx.textAlign = 'right';
  ctx.font = `900 34px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.strokeText(`HIỆP ${Math.min(game.hiep, hc)}/${hc}`, W - 24, 40);
  ctx.fillText(`HIỆP ${Math.min(game.hiep, hc)}/${hc}`, W - 24, 40);
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = game.boss ? '#ff8a80' : '#ffe082';
  ctx.fillText(right, W - 24, 76);
  // 10 ô hiệp
  for (let i = 0; i < hc; i++) {
    const x = 26 + i * 30;
    const done = i < game.hiep - 1 || (game.phase !== 'fight' && i < game.hiep && (game.phase === 'break' || game.won));
    ctx.fillStyle = done ? '#66bb6a' : i === game.hiep - 1 ? '#ffd54a' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x + 10, 80, 9, 0, TAU);
    ctx.fill();
    if (i === hc - 1) {
      ctx.font = `12px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('👹', x + 10, 81);
    }
  }
  ctx.textAlign = 'left';
  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(`Kỷ lục: hiệp ${record.hiep} · thắng ${record.wins} đợt`, 26 + hc * 30 + 10, 81);
  // máu thành + áp lực giặc
  const gk = gate.hp / gate.max;
  bar(24, 104, 620, 36, gk, gk > 0.5 ? ['#43a047', '#9ccc65'] : gk > 0.25 ? ['#ef6c00', '#ffb300'] : ['#b71c1c', '#ff5252'], `🏯 Thành ${Math.max(0, Math.round(gate.hp))}/${gate.max}`, now < gate.shieldUntil ? '🛡️' : '');
  const pk = clamp((monsters.length + game.queue) / 40, 0, 1);
  bar(660, 104, 396, 36, pk, ['#6a1b9a', '#e040fb'], `👹 Áp lực ${monsters.length + game.queue}`);
  // hiện tượng + thanh Rùa Vàng
  let x = 24;
  if (game.weather) {
    const ph = PHENOMENA[game.weather];
    const txt = game.weather === 'suong' ? `${ph.icon} ${ph.name}: thả tim thổi tan ${Math.round((1 - game.fog) * 100)}%` : `${ph.icon} ${ph.name}: ${ph.desc}`;
    x += chip(txt, x, 166, '#e1f5fe', 'rgba(1,87,155,0.75)', 20, 'left') + 10;
  }
  if (now < game.drumUntil) x += chip('🥁 Trống trận: bắn nhanh', x, 166, '#fff3e0', 'rgba(191,54,12,0.8)', 20, 'left') + 10;
  const kq = Math.max(1, Number(config.kimQuyLikes) || 1000);
  bar(W - 340, 150, 316, 30, game.kimQuyLikes / kq, ['#f9a825', '#fff176'], `🐢 Rùa Vàng ${game.kimQuyLikes}/${kq}❤️`);
  drawGuide();
}

const GUIDE = [['1', 'Bắn'], ['2', 'Sửa thành'], ['3', 'Lăn đá'], ['4', 'Khiên'], ['5', 'Trống']];
function drawGuide() {
  const y = 214;
  ctx.font = `800 24px ${FONT}`;
  const items = GUIDE.map(([n, t]) => ({ n, t, w: ctx.measureText(t).width + 62 }));
  const total = items.reduce((a, b) => a + b.w, 0) + (items.length - 1) * 8;
  let x = (W - total) / 2;
  for (const it of items) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    rr(ctx, x, y - 20, it.w, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.arc(x + 20, y, 15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3b1d00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 20px ${FONT}`;
    ctx.fillText(it.n, x + 20, y + 1);
    ctx.fillStyle = '#fff';
    ctx.font = `800 22px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(it.t, x + 42, y + 1);
    x += it.w + 8;
  }
  ctx.font = `700 19px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  const sub = `💬 Bình luận = lên tường · Hạ quái = lên cấp (max 10) · ❤️ ${config.likesPerRain} tim = mưa tên · 🎁 Thánh Gióng / Rùa Vàng`;
  ctx.strokeText(sub, W / 2, 258);
  ctx.fillText(sub, W / 2, 258);
}

function drawLeaders() {
  const list = [...players.values()].filter((p) => p.kills > 0).sort((a, b) => b.level - a.level || b.kills - a.kills).slice(0, 5);
  if (!list.length) return;
  const x0 = 14;
  const y0 = 292;
  const h = 30 + list.length * 28;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  rr(ctx, x0, y0, 250, h, 14);
  ctx.fill();
  ctx.font = `800 18px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd54a';
  ctx.fillText('🏹 Lính giỏi nhất', x0 + 12, y0 + 16);
  list.forEach((p, i) => {
    const y = y0 + 44 + i * 28;
    ctx.fillStyle = levelColor(p.level);
    ctx.beginPath();
    ctx.arc(x0 + 24, y, 11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.level >= 9 ? '#2a1d14' : '#fff';
    ctx.font = `800 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(p.level), x0 + 24, y + 1);
    ctx.textAlign = 'left';
    ctx.font = `700 17px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(truncate(p.name, 13), x0 + 42, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffcc80';
    ctx.fillText(`${p.kills}👹`, x0 + 238, y);
  });
  const reserve = [...players.values()].filter((p) => !p.slot && now > p.awayUntil && now - p.lastActive < 60000).length;
  if (reserve) chip(`+${reserve} lính dự bị`, x0 + 125, y0 + h + 22, '#fff', 'rgba(0,0,0,0.55)', 16);
}

function drawToasts() {
  const x = W - 16;
  toasts.forEach((tt, i) => {
    const age = now - tt.born;
    if (age > 5000) return;
    const k = Math.min(1, age / 200) * Math.min(1, (5000 - age) / 400);
    ctx.globalAlpha = k;
    chip(truncate(tt.text, 34), x, 310 + i * 40, tt.color, 'rgba(0,0,0,0.6)', 19, 'right');
    ctx.globalAlpha = 1;
  });
}

function drawBanner() {
  if (!banner || now > banner.until) return;
  const age = now - banner.t0;
  const k = Math.min(1, age / 250) * Math.min(1, (banner.until - now) / 300);
  const sc = 0.8 + 0.2 * Math.min(1, age / 250);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(W / 2, 640);
  ctx.scale(sc, sc);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  rr(ctx, -440, -70, 880, banner.sub ? 140 : 100, 30);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 56px ${FONT}`;
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(banner.text, 0, -22, 840);
  ctx.fillStyle = banner.color;
  ctx.fillText(banner.text, 0, -22, 840);
  if (banner.sub) {
    ctx.font = `700 28px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(banner.sub, 0, 36, 840);
  }
  ctx.restore();
}

function drawResult() {
  if (game.phase !== 'result') return;
  const left = Math.max(0, Math.ceil((game.phaseUntil - now) / 1000));
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(30,15,10,0.92)';
  rr(ctx, 90, 470, 900, 640, 36);
  ctx.fill();
  ctx.strokeStyle = game.won ? '#ffd54a' : '#ef5350';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 74px ${FONT}`;
  ctx.fillStyle = game.won ? '#ffd54a' : '#ff5252';
  ctx.fillText(game.won ? '🏆 GIỮ THÀNH THÀNH CÔNG' : '💥 THẤT THỦ', W / 2, 560, 840);
  ctx.font = `700 30px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(game.won ? `Cả ${config.hiepCount} hiệp, hạ ${game.bossKills} boss` : `Thành vỡ ở hiệp ${game.hiep}/${config.hiepCount}`, W / 2, 630);
  ctx.font = `800 32px ${FONT}`;
  ctx.fillStyle = '#ffe082';
  ctx.fillText('Lính giỏi nhất đợt này', W / 2, 700);
  const medals = ['🥇', '🥈', '🥉'];
  if (!game.mvp.length) {
    ctx.font = `600 26px ${FONT}`;
    ctx.fillStyle = '#ccc';
    ctx.fillText('Chưa có ai hạ quái', W / 2, 780);
  }
  game.mvp.forEach((p, i) => {
    const y = 770 + i * 80;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    rr(ctx, 160, y - 32, 760, 64, 20);
    ctx.fill();
    ctx.font = `800 34px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${medals[i]} ${truncate(p.name, 18)}`, 180, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffcc80';
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText(`Cấp ${p.level} · ${p.kills} quái`, 900, y);
  });
  ctx.textAlign = 'center';
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = '#b0bec5';
  ctx.fillText(`Đợt mới sau ${left}s · cấp lính về 1`, W / 2, 1060);
}

let caption = null;
function drawCaption() {
  if ((!caption || now > caption.until) && captions.length) {
    const c = captions.shift();
    caption = { ...c, born: now, until: now + Math.max(3200, c.text.length * 75) };
  }
  if (!caption || now > caption.until) return;
  const k = Math.min(clamp((now - caption.born) / 200, 0, 1), clamp((caption.until - now) / 300, 0, 1));
  ctx.globalAlpha = k;
  ctx.font = `700 26px ${FONT}`;
  const text = truncate(caption.text, 54);
  const w = Math.min(W - 40, ctx.measureText(text).width + 70);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  rr(ctx, W / 2 - w / 2, 790 - 26, w, 52, 26);
  ctx.fill();
  ctx.fillStyle = '#fff3b0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🎙️ ${text}`, W / 2, 791);
  ctx.globalAlpha = 1;
}

let lastFrame = performance.now();
let audioBlocked = false;
// SPEED chỉ dùng khi thử (?speed=4 cho trận chạy nhanh gấp 4)
const SPEED = clamp(Number(params.get('speed')) || 1, 0.25, 8);
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastFrame) / 1000) * SPEED;
  lastFrame = ts;
  now += dt * 1000;
  const P = window.__prof;
  let tp = performance.now();
  const mark = (k) => {
    if (!P) return;
    const n = performance.now();
    P[k] = (P[k] || 0) + n - tp;
    tp = n;
  };
  update(dt);
  mark('update');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawWorld();
  mark('world');
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,250,230,${flash * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawHeader();
  mark('header');
  drawToasts();
  drawLeaders();
  drawCaption();
  drawBanner();
  drawResult();
  mark('hud');
  if (P) P.frames = (P.frames || 0) + 1;
  if (audioBlocked) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(ctx, W / 2 - 250, 1000, 500, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔇 Bấm vào game để bật tiếng', W / 2, 1029);
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
    const res = await fetch('/thu-thanh-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  config.giftTiers = { ...DEFAULTS.giftTiers, ...(config.giftTiers || {}) };
  buildCommands();
  drawStatic(bg.getContext('2d'));
  if (params.get('export') === '1') {
    const a = document.createElement('a');
    a.download = 'nen-thu-thanh.png';
    a.href = bg.toDataURL('image/png');
    a.click();
    ctx.drawImage(bg, 0, 0);
    return;
  }
  if (config.backgroundImage && params.get('bg') !== '0') {
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        bgImage = img;
        resolve();
      };
      img.onerror = () => resolve();
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
    const r = await fetch('/thu-thanh-music.json', { cache: 'no-store' });
    if (r.ok) files = [...(await r.json()), ...files];
  } catch {
    /* không có máy chủ */
  }
  const startMusic = () => {
    if (config.sound === false) return;
    if (config.music === false) {
      sfx.startMusic({ files: [], volume: 0, ambience: Number(config.ambienceVolume ?? 0.06) });
      return;
    }
    sfx.startMusic({ files, volume: Number(config.musicVolume ?? 0.3), ambience: Number(config.ambienceVolume ?? 0.06) });
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
    const gap = Math.max(15, Number(config.narrationSeconds) || 40) * 1000;
    setInterval(() => {
      if (performance.now() - lastAnnounce > gap) announce(line('reminder'), 0);
    }, 3000);
  }
  now = performance.now();
  gate.max = Math.max(100, Number(config.gateHp) || 1000);
  gate.hp = gate.max;
  refreshFillers();
  startHiep(1);
  connectWs();
  requestAnimationFrame(frame);
}

window.__thuThanh = {
  handleEvent,
  config: () => config,
  state: () => ({
    phase: game.phase,
    hiep: game.hiep,
    dot: game.dot,
    gate: Math.round(gate.hp),
    monsters: monsters.length,
    queue: game.queue,
    boss: game.boss ? { name: game.boss.name, hp: Math.round(game.boss.hp) } : null,
    weather: game.weather,
    players: players.size,
    onWall: slots.filter((s) => s.p).length,
    fillers: slots.filter((s) => s.filler).length,
    kidnap: game.kidnap ? game.kidnap.p.name : '',
    levels: [...players.values()].map((p) => p.level),
    record: { ...record },
  }),
};
boot();
