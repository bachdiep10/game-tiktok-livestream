// Sơn Tinh – Thủy Tinh đại chiến: game tương tác TikTok LIVE, hai phe đánh nhau phá thành.
// Người xem chọn phe (gõ 1 / 2), mỗi người có một chiến binh mang tên mình tự đánh.
// Bình luận ra lệnh, thả tim thả lính từ trời xuống, chia sẻ gọi viện binh, chia sẻ gọi voi chiến / rắn biển, quà gọi đại bàng / rùa thần và thần hiện thân.
import { W, H, HORIZON_Y, FIELD, BASE_FRONT, TEAM, scaleAtY, drawStatic, drawBaseNui, drawBaseNuoc, drawFlood, drawGiant, drawElephant, drawSerpent, drawEagle, drawTurtle, roundRectPath as rr } from './battlefield.js';
import { drawSoldier, GENERAL_SCALE } from './units.js';
import * as sfx from './chienAudio.js';
import * as voice from '../audio.js';

const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const FONT = '"Segoe UI", system-ui, sans-serif';

const DEFAULTS = {
  title: 'SƠN TINH ⚔ THỦY TINH',
  roundSeconds: 240,
  resultSeconds: 12,
  baseHp: 1500,
  heroHp: 100,
  generalHp: 260,
  respawnSeconds: 6,
  likesPerSoldier: 10,
  maxUnitsPerTeam: 70,
  maxHeroesPerTeam: 45,
  ambientSoldiers: 8,
  moraleMax: 300,
  rallySeconds: 10,
  cmdCooldown: 3,
  beastSeconds: 40,
  idleMinutes: 10,
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
    team0: ['phe núi', 'sơn tinh', 'theo núi', 'vào núi'],
    team1: ['phe nước', 'thủy tinh', 'thuỷ tinh', 'theo nước', 'vào nước'],
    bow: ['cung tên', 'cung', 'bắn'],
    sword: ['kiếm', 'chém'],
    spear: ['giáo', 'đâm', 'xông lên', 'xung phong'],
    shield: ['khiên', 'phòng thủ'],
    heal: ['hồi máu', 'hồi sức', 'chữa thương', 'băng bó'],
    drum: ['trống', 'cố lên', 'đánh trống', 'tiến lên'],
    surrender: ['đầu hàng', 'xin hàng', 'chạy thôi'],
  },
  numberCommands: { 1: 'team0', 2: 'team1', 3: 'bow', 4: 'sword', 5: 'spear', 6: 'shield', 7: 'heal', 8: 'drum' },
  messages: {
    join: ['{name} gia nhập quân {team}', 'Chào {name}, xung trận cùng {team} nào', '{name} cầm giáo theo {team}', 'Thêm một chiến binh {team}: {name}'],
    switch: ['{name} đổi sang phe {team}', '{name} quay giáo theo {team}'],
    follow: ['{name} được phong làm tướng quân {team}', 'Cảm ơn {name} theo dõi, phong tướng cho {name}'],
    share0: ['Cảm ơn {name} chia sẻ, Sơn Tinh gọi voi chiến', '{name} chia sẻ, voi chiến xông ra trận'],
    share1: ['Cảm ơn {name} chia sẻ, Thủy Tinh gọi rắn biển', '{name} chia sẻ, rắn biển trồi lên từ đáy biển'],
    gift0: ['Cảm ơn {name} tặng {gift}, Sơn Tinh gọi đại bàng', 'Cảm ơn {name}, đại bàng núi lao xuống'],
    gift1: ['Cảm ơn {name} tặng {gift}, Thủy Tinh gọi rùa thần', 'Cảm ơn {name}, rùa thần bò lên bờ'],
    beast0: ['Cảm ơn {name} tặng {gift}! Voi chúa ra trận, đá lăn ầm ầm', '{name} cưỡi voi chúa xông lên'],
    beast1: ['Cảm ơn {name} tặng {gift}! Rắn biển khổng lồ nổi dậy', '{name} gọi rắn biển khổng lồ, sóng dâng ngập trận'],
    cheer0: ['Sơn Tinh vô địch!', 'Núi cao vạn trượng!', 'Phe Núi cố lên!', 'Giữ thành Núi!'],
    cheer1: ['Thủy Tinh vô địch!', 'Nước dâng ngập trời!', 'Phe Nước cố lên!', 'Giữ thành Nước!'],
    god0: ['{name} tặng {gift}! Sơn Tinh hiện thân, dời non chặn nước', 'Cảm ơn {name}! Sơn Tinh nâng núi, quân Nước tan tác'],
    god1: ['{name} tặng {gift}! Thủy Tinh hiện thân, hô mưa gọi gió', 'Cảm ơn {name}! Thủy Tinh dâng nước, quân Núi chạy dài'],
    rally: ['Quân {team} khí thế ngút trời, tổng tấn công', 'Trống trận dồn dập, {team} tổng tấn công'],
    roundStart: ['Ván {n} bắt đầu. Gõ 1 theo Sơn Tinh, gõ 2 theo Thủy Tinh', 'Ván {n}. Hai phe vào trận, thả tim để thả lính'],
    win: ['Quân {team} chiến thắng! Mãnh tướng giỏi nhất là {name}', '{team} thắng ván này! Xin chúc mừng {name}'],
    winNoName: ['Quân {team} chiến thắng ván này'],
    baseLow: ['Thành {team} sắp vỡ, mau thả tim cứu thành', 'Thành {team} nguy rồi, gõ 5 dựng khiên'],
    reminder: [
      'Gõ 1 theo Sơn Tinh, gõ 2 theo Thủy Tinh',
      'Thả tim để thả lính xuống chiến trường, mười tim một lính',
      'Gõ 3 cầm cung tên, gõ 4 cầm kiếm, gõ 5 cầm giáo',
      'Gõ 6 dựng khiên, gõ 7 hồi máu cho đồng đội',
      'Gõ 8 đánh trống, đủ khí thế là tổng tấn công',
      'Chia sẻ để Sơn Tinh gọi voi, Thủy Tinh gọi rắn biển',
      'Tặng quà để gọi đại bàng, rùa thần, và thần hiện thân',
      'Theo dõi kênh để được phong tướng',
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
  return list[i]
    .replace(/\{name\}/g, vars.name || '')
    .replace(/\{gift\}/g, vars.gift || 'quà')
    .replace(/\{team\}/g, vars.team || '')
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
// returning: { act, strong } - strong = chọn phe rõ ràng (gõ số, "phe ...", "theo ...", "vào ...")
function detectCommand(text, skipTeam = false) {
  const t = String(text || '').trim();
  const nums = { ...DEFAULTS.numberCommands, ...(config.numberCommands || {}) };
  // cả bình luận là 1 chữ số (vd "3" hoặc "33")
  const m = t.match(/^([1-9])\1*$/);
  if (m && nums[m[1]]) return { act: nums[m[1]], strong: true };
  const n = norm(t);
  for (const c of commandList) {
    if (skipTeam && (c.act === 'team0' || c.act === 'team1')) continue;
    if (n.includes(c.key)) return { act: c.act, strong: /^ (phe|theo|vao) /.test(c.key) };
  }
  return { act: '', strong: false };
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
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}

// ------------------------------------------------------------------ trạng thái
let now = performance.now();
const players = new Map(); // userId -> người chơi
let units = [];
let projectiles = [];
const particles = [];
const toasts = [];
const effects = []; // hiệu ứng lớn: thần, sóng, mưa đá
let unitSeq = 0;
const base = [{ hp: 1500, max: 1500, hitT: 0 }, { hp: 1500, max: 1500, hitT: 0 }];
const morale = [0, 0];
const rallyUntil = [0, 0];
const likePool = [0, 0];
const score = [0, 0];
let round = 0;
let front = W / 2;
let shake = 0;
let flash = 0;
let banner = null; // { text, sub, color, t0, until }
const phase = { name: 'battle', t0: now, until: now + 240000, winner: -1, mvp: [] };
const baseLowWarned = [false, false];

function teamName(t) {
  return TEAM[t].name;
}
function heroesOf(t) {
  let n = 0;
  for (const p of players.values()) if (p.team === t && p.hero) n++;
  return n;
}
function aliveCount(t) {
  let n = 0;
  for (const u of units) if (u.team === t && !u.deadT) n++;
  return n;
}
function teamPlayers(t) {
  return [...players.values()].filter((p) => p.team === t);
}

function laneY() {
  return rand(FIELD.top + 20, FIELD.bottom - 20);
}

function makeUnit(team, kind, extra = {}) {
  const stats = {
    hero: { hp: Number(config.heroHp) || 100, atk: 12, speed: 72, range: 34, cd: 0.9 },
    mini: { hp: 45, atk: 7, speed: 82, range: 30, cd: 0.9 },
    filler: { hp: 60, atk: 8, speed: 66, range: 32, cd: 1.0 },
    beast: { hp: 520, atk: 30, speed: 46, range: 64, cd: 1.3 },
    eagle: { hp: 70, atk: 14, speed: 150, range: 40, cd: 0.8 },
    turtle: { hp: 170, atk: 9, speed: 36, range: 36, cd: 1.0 },
  }[kind];
  const u = {
    id: ++unitSeq,
    team,
    kind,
    x: team === 0 ? BASE_FRONT[0] - 10 : BASE_FRONT[1] + 10,
    y: laneY(),
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    speed: stats.speed * rand(0.9, 1.1),
    range: stats.range,
    cd: stats.cd,
    nextAtk: now + rand(0, 600),
    atkT: 0,
    hurtT: 0,
    deadT: 0,
    walk: rand(0, TAU),
    dir: team === 0 ? 1 : -1,
    shieldUntil: 0,
    healT: 0,
    cheerUntil: 0,
    whiteUntil: 0,
    dropY: 0,
    skin: Math.floor(Math.random() * 4),
    expireAt: 0,
    weapon: '',
    ...extra,
  };
  u.ty = u.y;
  if (kind === 'hero' || kind === 'mini' || kind === 'filler') {
    const w = extra.weapon || (kind === 'hero' ? 'spear' : pick(['spear', 'spear', 'sword', 'bow']));
    setWeapon(u, w);
  }
  return u;
}

// vũ khí: giáo đánh xa vừa + đẩy lùi, kiếm đánh nhanh, cung tên bắn xa
const WEAPONS = {
  spear: { atkMul: 1.15, range: 52, cd: 1.0 },
  sword: { atkMul: 0.95, range: 30, cd: 0.6 },
  bow: { atkMul: 0.8, range: 240, cd: 1.25 },
};
function setWeapon(u, w) {
  const def = WEAPONS[w] || WEAPONS.spear;
  if (!u.baseAtk) u.baseAtk = u.atk;
  u.weapon = w;
  u.atk = u.baseAtk * def.atkMul;
  u.range = def.range;
  u.cd = def.cd;
}

function spawnFiller(team) {
  if (aliveCount(team) >= maxUnits()) return;
  units.push(makeUnit(team, 'filler'));
}
function maxUnits() {
  return Math.max(20, Number(config.maxUnitsPerTeam) || 70);
}

// thả lính từ trời xuống gần mặt trận phía mình
function dropMini(team, owner = null, nearX = null) {
  if (aliveCount(team) >= maxUnits()) {
    // quân đầy: thưởng hồi máu cho cả phe thay vì thêm lính
    for (const u of units) if (u.team === team && !u.deadT) u.hp = Math.min(u.maxHp, u.hp + 4);
    return null;
  }
  const own = team === 0 ? [BASE_FRONT[0] + 20, front - 40] : [front + 40, BASE_FRONT[1] - 20];
  const x = nearX != null ? clamp(nearX + rand(-40, 40), FIELD.left, FIELD.right) : rand(Math.min(own[0], own[1]), Math.max(own[0], own[1]));
  const u = makeUnit(team, 'mini', { x, owner });
  u.dropY = 420 + Math.random() * 120;
  units.push(u);
  return u;
}

function ensurePlayer(user, team = -1) {
  let p = players.get(user.id);
  if (!p) {
    let t = team;
    if (t < 0) {
      const a = heroesOf(0);
      const b = heroesOf(1);
      t = a === b ? (Math.random() < 0.5 ? 0 : 1) : a < b ? 0 : 1;
    }
    p = { user, team: t, hero: null, likes: 0, coins: 0, dmg: 0, kills: 0, baseDmg: 0, lastCmd: 0, lastActive: now, general: false, bubble: null };
    players.set(user.id, p);
    spawnHero(p);
    if (p.hero) {
      announce(line('join', { name: user.name, team: teamName(t) }), 0);
      addToast(`${TEAM[t].icon} ${truncate(user.name, 16)} theo ${teamName(t)}`, TEAM[t].light);
    }
  } else {
    p.user = { ...p.user, ...user };
    if (!p.hero && heroesOf(p.team) < (Number(config.maxHeroesPerTeam) || 45)) spawnHero(p);
  }
  p.lastActive = now;
  return p;
}

function spawnHero(p) {
  if (heroesOf(p.team) >= (Number(config.maxHeroesPerTeam) || 45)) return;
  const u = makeUnit(p.team, 'hero', { player: p });
  if (p.general) applyGeneral(u);
  u.dropY = 300;
  units.push(u);
  p.hero = u;
}

function applyGeneral(u) {
  const hp = Number(config.generalHp) || 200;
  u.maxHp = hp;
  u.hp = Math.max(u.hp, hp);
  u.baseAtk = 18;
  setWeapon(u, u.weapon || 'spear');
  u.general = true;
}

function switchTeam(p, team) {
  if (p.team === team) {
    say(p, `Đã ở phe ${TEAM[team].short} rồi!`, 1800);
    return;
  }
  p.team = team;
  if (p.hero) {
    units = units.filter((u) => u !== p.hero);
    p.hero = null;
  }
  spawnHero(p);
  addToast(`🔁 ${truncate(p.user.name, 16)} sang phe ${teamName(team)}`, TEAM[team].light);
  announce(line('switch', { name: p.user.name, team: teamName(team) }), 0);
}

function say(p, text, ms = 3000) {
  p.bubble = { text: truncate(text, 26), until: now + ms, born: now };
}

// ------------------------------------------------------------------ hiệu ứng
function addParticle(o) {
  if (particles.length > 500) particles.shift();
  particles.push({ vx: 0, vy: 0, g: 0, size: 6, life: 0, ...o, max: o.max || o.life || 1, born: now });
}
function sparks(x, y, n, colors = ['#ffe066', '#fff3b0', '#ffb300']) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(80, 320);
    addParticle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 400, life: rand(0.5, 1), color: pick(colors), size: rand(3, 7) });
  }
}
function dust(x, y, n = 8) {
  for (let i = 0; i < n; i++) {
    addParticle({ x: x + rand(-14, 14), y: y - 4, vx: rand(-80, 80), vy: rand(-80, -20), g: 80, life: rand(0.4, 0.8), color: 'rgba(170,150,110,0.7)', size: rand(6, 12), kind: 'puff' });
  }
}
function splashFx(x, y, n = 12) {
  for (let i = 0; i < n; i++) {
    addParticle({ x, y, vx: rand(-160, 160), vy: rand(-320, -100), g: 700, life: rand(0.5, 0.9), color: pick(['#bff3ff', '#7cd8ff', '#ffffff']), size: rand(3, 7) });
  }
}
function floatText(x, y, text, color = '#fff', size = 22) {
  addParticle({ x, y, vy: -60, life: 1, color, size, kind: 'text', text });
}
function hearts(x, y, n) {
  for (let i = 0; i < n; i++) addParticle({ x: x + rand(-14, 14), y, vx: rand(-30, 30), vy: rand(-150, -90), life: rand(0.8, 1.3), color: pick(['#ff4d6d', '#ff8fa3', '#ff2e63']), size: rand(9, 14), kind: 'heart' });
}
function confetti(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(150, 520);
    addParticle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, g: 520, life: rand(1.2, 2.2), color: pick(['#ffd54a', '#4caf50', '#29a8ff', '#ff5252', '#fff']), size: rand(5, 10), kind: 'rect', spin: rand(-8, 8) });
  }
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

function addMorale(team, v, who = null) {
  if (phase.name !== 'battle') return;
  if (now < rallyUntil[team]) return;
  morale[team] += v;
  const max = Math.max(50, Number(config.moraleMax) || 300);
  if (morale[team] >= max) {
    morale[team] = 0;
    startRally(team, who);
  }
}
function startRally(team) {
  rallyUntil[team] = now + Math.max(3, Number(config.rallySeconds) || 10) * 1000;
  sfx.drumRoll(8);
  sfx.warHorn();
  showBanner(`${TEAM[team].icon} TỔNG TẤN CÔNG!`, `Quân ${teamName(team)} mạnh gấp rưỡi`, TEAM[team].light, 2600);
  announce(line('rally', { team: teamName(team) }), 1, true);
  for (const u of units) if (u.team === team && !u.deadT) u.cheerUntil = now + 900;
}
function buffed(team) {
  return now < rallyUntil[team];
}

// ------------------------------------------------------------------ chiến đấu
function damage(target, amount, attacker = null, kindTag = '') {
  if (target.deadT || phase.name !== 'battle') return;
  let dmg = amount;
  if (now < target.shieldUntil) dmg *= 0.25;
  if (target.dropY > 0) dmg *= 0.3;
  if (target.kind === 'turtle') dmg *= 0.5;
  dmg = Math.max(1, Math.round(dmg));
  target.hp -= dmg;
  target.hurtT = now;
  const owner = attacker && (attacker.player || attacker.owner);
  if (owner) owner.dmg += dmg;
  if (target.hp <= 0) {
    target.hp = 0;
    target.deadT = now;
    if (owner) owner.kills++;
    if (target.kind === 'hero' && target.player) {
      target.respawnAt = now + Math.max(2, Number(config.respawnSeconds) || 6) * 1000;
      say(target.player, pick(['Á á á!', 'Ta sẽ trở lại!', 'Thả tim hồi sinh tôi!', 'Ối giời ơi!']), 1800);
    }
    if (target.kind === 'beast') {
      sfx.rumble(1, 0.18);
      dust(target.x, target.y, 20);
    }
    if (kindTag !== 'quiet') sfx.hit();
  }
}

function damageBase(team, amount, attacker = null) {
  if (phase.name !== 'battle') return;
  const b = base[team];
  const dmg = buffed(1 - team) ? amount * 1.5 : amount;
  b.hp = Math.max(0, b.hp - dmg);
  b.hitT = 1;
  const owner = attacker && (attacker.player || attacker.owner);
  if (owner) owner.baseDmg += dmg;
  if (!baseLowWarned[team] && b.hp < b.max * 0.25 && b.hp > 0) {
    baseLowWarned[team] = true;
    announce(line('baseLow', { team: teamName(team) }), 1);
    addToast(`⚠️ Thành ${teamName(team)} sắp vỡ!`, '#ff8a80');
  }
  if (b.hp <= 0) endRound(1 - team);
}

function nearestEnemy(u, maxDx = 240) {
  let best = null;
  let bd = Infinity;
  for (const e of units) {
    if (e.team === u.team || e.deadT || e.dropY > 0) continue;
    const dx = Math.abs(e.x - u.x);
    if (dx > maxDx) continue;
    const d = dx + Math.abs(e.y - u.y) * 0.6;
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}

function shoot(u, target, kind, dmg) {
  const dur = clamp(Math.hypot(target.x - u.x, target.y - u.y) / 700, 0.25, 0.9);
  projectiles.push({ x0: u.x, y0: u.y - 40, x1: target.x, y1: target.y - 30, t0: now, dur: dur * 1000, team: u.team, kind, dmg, target, from: u, arc: kind === 'arrow' ? 80 : 50 });
  if (kind === 'arrow') sfx.arrow();
  else sfx.splash();
}

function unitAct(u, dt) {
  const speedMul = buffed(u.team) ? 1.4 : 1;
  const atkMul = buffed(u.team) ? 1.5 : 1;
  const enemyFront = BASE_FRONT[1 - u.team];
  const target = nearestEnemy(u, u.kind === 'eagle' ? 900 : u.kind === 'beast' ? 300 : u.weapon === 'bow' ? 320 : 240);
  let moving = false;
  if (target) {
    const d = Math.hypot(target.x - u.x, (target.y - u.y) * 1.4);
    if (d <= u.range + (target.kind === 'beast' ? 40 : 0)) {
      if (now >= u.nextAtk) {
        u.nextAtk = now + u.cd * 1000 * rand(0.85, 1.15);
        u.atkT = now;
        u.dir = target.x >= u.x ? 1 : -1;
        if (u.kind === 'beast') {
          // giẫm / quật: đánh lan
          for (const e of units) {
            if (e.team !== u.team && !e.deadT && Math.hypot(e.x - target.x, e.y - target.y) < 80) {
              damage(e, u.atk * atkMul, u);
              e.x += u.dir * 24;
            }
          }
          shake = Math.max(shake, 0.25);
          dust(target.x, target.y, 6);
          if (u.team === 0) sfx.thud();
          else sfx.splash();
        } else if (u.weapon === 'bow') {
          shoot(u, target, 'arrow', u.atk * atkMul);
        } else {
          damage(target, u.atk * atkMul, u);
          if (u.weapon === 'spear' && target.kind !== 'beast') target.x += u.dir * 8;
          sfx.clash();
          if (Math.random() < 0.35) sparks((u.x + target.x) / 2, u.y - 34, 3);
        }
      }
    } else {
      const ang = Math.atan2(target.y - u.y, target.x - u.x);
      u.x += Math.cos(ang) * u.speed * speedMul * dt;
      u.y += Math.sin(ang) * u.speed * speedMul * dt * 0.7;
      u.dir = Math.cos(ang) >= 0 ? 1 : -1;
      moving = true;
    }
  } else {
    // không có địch gần: tiến về thành địch
    const reach = u.weapon === 'bow' ? 180 : 4;
    const atBase = u.team === 0 ? u.x >= enemyFront - reach : u.x <= enemyFront + reach;
    if (atBase) {
      if (now >= u.nextAtk) {
        u.nextAtk = now + u.cd * 1000 * rand(0.9, 1.2);
        u.atkT = now;
        damageBase(1 - u.team, (u.kind === 'beast' ? u.atk * 2 : u.atk) * 0.6, u);
        sfx.hit();
        if (Math.random() < 0.3) dust(u.x + u.dir * 20, u.y - 30, 3);
      }
    } else {
      u.x += u.dir * u.speed * speedMul * dt;
      u.dir = u.team === 0 ? 1 : -1;
      u.y += (u.ty - u.y) * dt;
      moving = true;
    }
  }
  if (moving) u.walk += dt * 10 * speedMul;
}

function heroCommand(p, act) {
  const u = p.hero;
  if (!u) return;
  const cd = Math.max(0.5, Number(config.cmdCooldown) || 3) * 1000;
  if (now - p.lastCmd < cd) return;
  p.lastCmd = now;
  if (u.deadT) {
    say(p, 'Đang chờ hồi sinh... thả tim nhanh lên!', 1600);
    return;
  }
  const atkMul = buffed(u.team) ? 1.5 : 1;
  switch (act) {
    case 'shoot':
    case 'bow': {
      setWeapon(u, 'bow');
      u.atkT = now;
      const t = nearestEnemy(u, 560);
      if (t) shoot(u, t, 'arrow', 26 * atkMul);
      say(p, t ? 'Cầm cung, bắn!' : 'Cầm cung tên!', 1200);
      break;
    }
    case 'slash':
    case 'sword': {
      setWeapon(u, 'sword');
      u.x += u.dir * 70;
      u.atkT = now;
      let hits = 0;
      for (const e of units) {
        if (e.team !== u.team && !e.deadT && Math.abs(e.x - u.x) < 70 && Math.abs(e.y - u.y) < 60) {
          damage(e, 30 * atkMul, u);
          e.x += u.dir * 30;
          hits++;
        }
      }
      sfx.clash();
      sparks(u.x + u.dir * 30, u.y - 30, 10, ['#fff', '#ffe066']);
      say(p, hits ? `Kiếm chém trúng ${hits}!` : 'Rút kiếm!', 1200);
      break;
    }
    case 'spear': {
      setWeapon(u, 'spear');
      u.atkT = now;
      let hits = 0;
      for (const e of units) {
        if (e.team !== u.team && !e.deadT && (e.x - u.x) * u.dir > -10 && (e.x - u.x) * u.dir < 110 && Math.abs(e.y - u.y) < 40) {
          damage(e, 28 * atkMul, u);
          e.x += u.dir * 50;
          hits++;
        }
      }
      sfx.clash();
      say(p, hits ? `Giáo đâm ${hits} tên!` : 'Cầm giáo!', 1200);
      break;
    }
    case 'shield':
      u.shieldUntil = now + 6000;
      sfx.shield();
      say(p, 'Dựng khiên!', 1200);
      break;
    case 'heal': {
      let n = 0;
      for (const a of units) {
        if (a.team === u.team && !a.deadT && Math.hypot(a.x - u.x, a.y - u.y) < 160) {
          a.hp = Math.min(a.maxHp, a.hp + 35);
          a.healT = now;
          n++;
        }
      }
      sfx.heal();
      say(p, `Hồi máu cho ${n} người`, 1400);
      break;
    }
    case 'drum':
      u.cheerUntil = now + 1500;
      addMorale(u.team, 15, p);
      sfx.drumRoll(3);
      say(p, pick(['Tùng tùng tùng!', `${TEAM[u.team].short} cố lên!`, 'Tiến lên anh em!']), 1400);
      break;
    case 'surrender':
      u.whiteUntil = now + 4000;
      say(p, pick(['Tha cho tôi!', 'Hàng rồi, hàng rồi!', 'Cho xin cái vé về quê!']), 2400);
      break;
    default:
      break;
  }
}

// mưa đá / sóng nhỏ từ quà nhỏ
function giftVolley(team, p, count) {
  const foes = units.filter((u) => u.team !== team && !u.deadT);
  for (let i = 0; i < count; i++) {
    const t = foes.length ? pick(foes) : null;
    const x = t ? t.x : team === 0 ? rand(front, BASE_FRONT[1]) : rand(BASE_FRONT[0], front);
    const y = t ? t.y : laneY();
    projectiles.push({ x0: x + rand(-60, 60) - (team === 0 ? 200 : -200), y0: 380, x1: x, y1: y - 10, t0: now + i * 160, dur: 700, team, kind: team === 0 ? 'rock' : 'wave', dmg: 34, area: 55, from: p.hero, owner: p, arc: 0 });
  }
}

// chia sẻ: voi chiến / rắn biển. Quà vừa: voi chúa / rắn biển khổng lồ (to, khỏe, sống lâu hơn) + mưa đá / sóng
function spawnBeast(team, p, label, big = false) {
  if (units.filter((u) => u.kind === 'beast' && u.team === team && !u.deadT).length >= (big ? 5 : 3)) {
    if (big) giftVolley(team, p, 8);
    else for (let i = 0; i < 3; i++) dropMini(team, p, p.hero ? p.hero.x : null);
    return;
  }
  const secs = Math.max(10, Number(config.beastSeconds) || 40) * (big ? 1 : 0.6);
  const u = makeUnit(team, 'beast', { owner: p, name: truncate(p.user.name, 12), big, expireAt: now + secs * 1000 });
  if (!big) {
    u.maxHp = u.hp = 320;
    u.atk = 22;
  }
  u.y = lerp(FIELD.top, FIELD.bottom, 0.5) + rand(-80, 80);
  u.ty = u.y;
  units.push(u);
  if (team === 0) sfx.trumpet();
  else sfx.roar();
  dust(u.x, u.y, 16);
  const beastName = team === 0 ? (big ? 'VOI CHÚA' : 'VOI CHIẾN') : big ? 'RẮN BIỂN KHỔNG LỒ' : 'RẮN BIỂN';
  showBanner(`${team === 0 ? '🐘' : '🐍'} ${beastName} RA TRẬN`, truncate(p.user.name, 20), TEAM[team].light, 2200);
  addToast(`${team === 0 ? '🐘' : '🐍'} ${truncate(p.user.name, 14)} gọi ${beastName.toLowerCase()}`, TEAM[team].light);
  if (big) {
    giftVolley(team, p, 5);
    announce(line(`beast${team}`, { name: p.user.name, gift: label }), 1, true);
  } else announce(line(`share${team}`, { name: p.user.name }), 1);
}

// quà nhỏ: Sơn Tinh gọi đại bàng, Thủy Tinh gọi rùa thần
function summonPets(team, p, n) {
  const kind = team === 0 ? 'eagle' : 'turtle';
  for (let i = 0; i < n; i++) {
    if (units.filter((u) => u.kind === kind && u.team === team && !u.deadT).length >= 12) {
      giftVolley(team, p, 3);
      break;
    }
    const u = makeUnit(team, kind, { owner: p, name: truncate(p.user.name, 10), expireAt: now + (kind === 'eagle' ? 30000 : 45000) });
    if (kind === 'eagle') {
      u.x = team === 0 ? 60 : W - 60;
      u.alt = 260;
    } else {
      u.x = team === 0 ? BASE_FRONT[0] : BASE_FRONT[1];
      splashFx(u.x, u.y, 10);
    }
    units.push(u);
  }
  if (kind === 'eagle') sfx.arrow();
  else sfx.splash(true);
}

function godStrike(team, p, label) {
  effects.push({ kind: 'god', team, t0: now, until: now + 6500, hitAt: now + 1600, done: false, owner: p });
  sfx.warHorn();
  sfx.gong();
  showBanner(team === 0 ? '⛰️ SƠN TINH HIỆN THÂN' : '🌊 THỦY TINH HIỆN THÂN', `${truncate(p.user.name, 18)} tặng ${truncate(label, 16)}`, TEAM[team].accent, 3600);
  announce(line(`god${team}`, { name: p.user.name, gift: label }), 2, true);
  flash = 0.7;
  if (!p.general) promote(p, false);
}

function godHit(e) {
  const team = e.team;
  shake = 1.2;
  flash = 0.6;
  if (team === 0) {
    sfx.rumble(2.2, 0.3);
    for (let i = 0; i < 40; i++) {
      addParticle({ x: rand(front - 100, W), y: rand(380, 600), vx: rand(-60, 60), vy: rand(200, 500), g: 900, life: rand(0.8, 1.4), color: pick(['#6d5a3e', '#8a7454', '#5a4a33']), size: rand(10, 22), kind: 'rock' });
    }
  } else {
    sfx.wave(2.6);
    effects.push({ kind: 'wave', t0: now, until: now + 1800 });
  }
  for (const u of units) {
    if (u.team === team || u.deadT) continue;
    damage(u, u.maxHp * 0.7, null, 'quiet');
    u.x = clamp(u.x + (team === 0 ? 140 : -140), FIELD.left - 20, FIELD.right + 20);
  }
  damageBase(1 - team, base[1 - team].max * 0.1, null);
  if (e.owner) e.owner.dmg += 150;
}

function promote(p, speak = true) {
  p.general = true;
  if (p.hero) applyGeneral(p.hero);
  if (p.hero && !p.hero.deadT) sparks(p.hero.x, p.hero.y - 60, 24);
  if (speak) {
    sfx.sparkle();
    addToast(`⭐ ${truncate(p.user.name, 16)} được phong tướng`, '#ffd54a');
    announce(line('follow', { name: p.user.name, team: teamName(p.team) }), 1);
  }
}

// ------------------------------------------------------------------ sự kiện TikTok
function handleEvent(ev) {
  now = performance.now();
  const user = ev.user;
  switch (ev.type) {
    case 'join':
      if (user) ensurePlayer(user);
      break;
    case 'chat': {
      if (!user) break;
      const text = String(ev.text || '').trim();
      const fresh = !players.has(user.id);
      let { act, strong } = detectCommand(text);
      // người đã có phe mà chỉ nhắc tên phe (vd "Thủy Tinh cố lên") thì là cổ vũ, không đổi phe
      if ((act === 'team0' || act === 'team1') && !fresh && !strong) act = detectCommand(text, true).act;
      const team = act === 'team0' ? 0 : act === 'team1' ? 1 : -1;
      const p = ensurePlayer(user, team);
      if (team >= 0 && !fresh) switchTeam(p, team);
      else if (act && team < 0) heroCommand(p, act);
      else if (!act && text) say(p, text, 4000);
      addMorale(p.team, 3, p);
      break;
    }
    case 'like': {
      if (!user) break;
      const p = ensurePlayer(user);
      const n = clamp(Number(ev.count) || 1, 1, 100);
      p.likes += n;
      likePool[p.team] += n;
      addMorale(p.team, n, p);
      const u = p.hero;
      if (u && u.deadT && u.respawnAt) u.respawnAt -= n * 300; // tim giúp hồi sinh nhanh
      if (u && !u.deadT) hearts(u.x, u.y - 70, Math.min(4, n));
      sfx.pop();
      const per = Math.max(1, Number(config.likesPerSoldier) || 15);
      let dropped = 0;
      while (likePool[p.team] >= per && dropped < 6) {
        likePool[p.team] -= per;
        dropMini(p.team, p, u && !u.deadT ? u.x : null);
        dropped++;
      }
      break;
    }
    case 'follow': {
      if (!user) break;
      const p = ensurePlayer(user);
      promote(p);
      addMorale(p.team, 20, p);
      break;
    }
    case 'share': {
      if (!user) break;
      const p = ensurePlayer(user);
      if (phase.name === 'battle') spawnBeast(p.team, p, '', false);
      addMorale(p.team, 20, p);
      break;
    }
    case 'giftStreak': {
      if (!user) break;
      const p = players.get(user.id);
      if (p && p.hero && !p.hero.deadT) sparks(p.hero.x, p.hero.y - 40, 5);
      break;
    }
    case 'gift': {
      if (!user) break;
      const p = ensurePlayer(user);
      const coinsN = Number(ev.coins) || (Number(ev.diamonds) || 1) * (Number(ev.repeatCount) || 1);
      const label = `${ev.giftName || 'quà'}${Number(ev.repeatCount) > 1 ? ` x${ev.repeatCount}` : ''}`;
      p.coins += coinsN;
      const tiers = { ...DEFAULTS.giftTiers, ...(config.giftTiers || {}) };
      addMorale(p.team, coinsN * 5, p);
      if (p.hero) {
        if (p.hero.deadT) {
          p.hero.respawnAt = now;
        } else {
          p.hero.hp = p.hero.maxHp;
          p.hero.healT = now;
          p.hero.cheerUntil = now + 1500;
        }
      }
      if (phase.name !== 'battle') {
        addToast(`🎁 ${truncate(user.name, 16)}: ${truncate(label, 14)}`, '#ffe9a8');
        announce(`Cảm ơn ${user.name} tặng ${label}`, 1);
        break;
      }
      if (coinsN >= tiers.big) godStrike(p.team, p, label);
      else if (coinsN >= tiers.medium) spawnBeast(p.team, p, label, true);
      else {
        summonPets(p.team, p, clamp(coinsN, 1, 4));
        addToast(`${p.team === 0 ? '🦅 ' : '🐢 '}${truncate(user.name, 14)} gọi ${p.team === 0 ? 'đại bàng' : 'rùa thần'}`, TEAM[p.team].light);
        announce(line(`gift${p.team}`, { name: user.name, gift: label }), 1);
        sfx.sparkle();
      }
      break;
    }
    // ----- chỉ dùng khi thử ở bảng điều khiển
    case 'cheerSim': {
      if (!user) break;
      const p = ensurePlayer(user);
      say(p, line(`cheer${p.team}`), 3000);
      addMorale(p.team, 3, p);
      break;
    }
    case 'rally':
      startRally(Number(ev.team) === 1 ? 1 : 0);
      break;
    case 'endRound':
      if (phase.name === 'battle') endRound(base[0].hp / base[0].max >= base[1].hp / base[1].max ? 0 : 1);
      break;
    case 'voiceTest':
      announce('Xin chào cả nhà. Sơn Tinh, Thủy Tinh đại chiến. Gõ 1 theo Sơn Tinh, gõ 2 theo Thủy Tinh', 2, true);
      break;
    case 'reset':
      players.clear();
      units = [];
      projectiles = [];
      particles.length = 0;
      effects.length = 0;
      score[0] = score[1] = 0;
      round = 0;
      startRound();
      break;
    default:
      break;
  }
}

// ------------------------------------------------------------------ ván đấu
function startRound() {
  round++;
  const max = Math.max(100, Number(config.baseHp) || 1500);
  for (const b of base) {
    b.max = max;
    b.hp = max;
    b.hitT = 0;
  }
  baseLowWarned[0] = baseLowWarned[1] = false;
  morale[0] = morale[1] = 0;
  rallyUntil[0] = rallyUntil[1] = 0;
  likePool[0] = likePool[1] = 0;
  projectiles = [];
  effects.length = 0;
  // người vắng lâu thì rời trận
  const idle = Math.max(1, Number(config.idleMinutes) || 10) * 60000;
  for (const [id, p] of players) if (now - p.lastActive > idle) players.delete(id);
  units = [];
  for (const p of players.values()) {
    p.dmg = 0;
    p.kills = 0;
    p.baseDmg = 0;
    p.hero = null;
    spawnHero(p);
  }
  for (const t of [0, 1]) for (let i = 0; i < Math.min(8, Number(config.ambientSoldiers) || 0); i++) spawnFiller(t);
  phase.name = 'battle';
  phase.t0 = now;
  phase.until = now + Math.max(30, Number(config.roundSeconds) || 240) * 1000;
  showBanner(`VÁN ${round}`, 'Gõ 1 theo Sơn Tinh · Gõ 2 theo Thủy Tinh', '#ffd54a', 3000);
  sfx.gong();
  sfx.warHorn();
  announce(line('roundStart', { n: round }), 1);
}

function mvpOf(list) {
  return list
    .map((p) => ({ p, s: Math.round(p.dmg + p.kills * 20 + p.baseDmg * 2) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
}

function endRound(winner) {
  if (phase.name !== 'battle') return;
  phase.name = 'result';
  phase.winner = winner;
  phase.t0 = now;
  phase.until = now + Math.max(5, Number(config.resultSeconds) || 12) * 1000;
  score[winner]++;
  phase.mvp = mvpOf([...players.values()]);
  const top = phase.mvp[0];
  sfx.cheer();
  sfx.gong();
  confetti(winner === 0 ? 300 : 780, 700, 140);
  flash = 0.5;
  const tname = teamName(winner);
  announce(top ? line('win', { team: tname, name: top.p.user.name }) : line('winNoName', { team: tname }), 2, true);
  for (const u of units) {
    if (u.deadT) continue;
    if (u.team === winner) u.cheerUntil = phase.until;
    else u.whiteUntil = phase.until;
  }
}

// ------------------------------------------------------------------ cập nhật
let lastFiller = 0;
let lastCheer = 0;
function update(dt) {
  if (phase.name === 'battle' && now >= phase.until) {
    const a = base[0].hp / base[0].max;
    const b = base[1].hp / base[1].max;
    endRound(Math.abs(a - b) < 0.001 ? (front > W / 2 ? 0 : 1) : a > b ? 0 : 1);
  }
  if (phase.name === 'result' && now >= phase.until) startRound();

  // chiến binh thỉnh thoảng hô khẩu hiệu phe mình
  if (phase.name === 'battle' && now - lastCheer > 4500) {
    lastCheer = now;
    const hs = units.filter((u) => u.kind === 'hero' && !u.deadT && u.player && !(u.player.bubble && now < u.player.bubble.until));
    if (hs.length) {
      const h = pick(hs);
      say(h.player, line(`cheer${h.team}`), 2200);
    }
  }
  if (phase.name === 'battle' && now - lastFiller > 2500) {
    lastFiller = now;
    for (const t of [0, 1]) {
      const n = units.filter((u) => u.team === t && !u.deadT && (u.kind === 'hero' || u.kind === 'mini' || u.kind === 'filler')).length;
      if (n < (Number(config.ambientSoldiers) || 0)) spawnFiller(t);
    }
  }

  for (const u of units) {
    if (u.dropY > 0) {
      // đang rơi từ trời xuống
      u.dropY = Math.max(0, u.dropY - dt * 900);
      if (u.dropY === 0) {
        dust(u.x, u.y, 6);
        sfx.thud();
      }
      continue;
    }
    if (u.deadT) {
      if (u.kind === 'hero' && u.respawnAt && now >= u.respawnAt && phase.name === 'battle') {
        u.deadT = 0;
        u.hp = u.maxHp;
        u.x = u.team === 0 ? BASE_FRONT[0] - 10 : BASE_FRONT[1] + 10;
        u.y = laneY();
        u.ty = u.y;
        u.respawnAt = 0;
        u.healT = now;
      }
      continue;
    }
    if (u.expireAt && now > u.expireAt) {
      u.deadT = now;
      dust(u.x, u.y, 14);
      continue;
    }
    if (phase.name === 'battle') unitAct(u, dt);
  }
  // tách nhau ra cho khỏi chồng lên
  const live = units.filter((u) => !u.deadT && u.dropY === 0);
  for (let i = 0; i < live.length; i++) {
    const a = live[i];
    for (let j = i + 1; j < live.length; j++) {
      const b = live[j];
      const dx = b.x - a.x;
      const dy = (b.y - a.y) * 1.6;
      if (a.kind === 'eagle' || b.kind === 'eagle') continue;
      const r = a.kind === 'beast' || b.kind === 'beast' ? 46 : a.kind === 'turtle' || b.kind === 'turtle' ? 34 : 20;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0.01 && d2 < r * r) {
        const d = Math.sqrt(d2);
        const push = ((r - d) / d) * 0.5;
        a.x -= dx * push * 0.5;
        b.x += dx * push * 0.5;
        a.y -= (dy / 1.6) * push * 0.5;
        b.y += (dy / 1.6) * push * 0.5;
      }
    }
  }
  for (const u of live) {
    u.x = clamp(u.x, BASE_FRONT[0] - 30, BASE_FRONT[1] + 30);
    u.y = clamp(u.y, FIELD.top, FIELD.bottom);
  }
  // xoá xác cũ
  units = units.filter((u) => !(u.deadT && u.kind !== 'hero' && now - u.deadT > 1600));

  // đạn
  for (const pr of projectiles) {
    if (now < pr.t0) continue;
    const k = (now - pr.t0) / pr.dur;
    if (k >= 1 && !pr.done) {
      pr.done = true;
      if (pr.area) {
        for (const e of units) if (e.team !== pr.team && !e.deadT && Math.hypot(e.x - pr.x1, (e.y - pr.y1 - 10) * 1.3) < pr.area) damage(e, pr.dmg, pr.from || { owner: pr.owner });
        if (pr.kind === 'rock') {
          dust(pr.x1, pr.y1 + 10, 8);
          sfx.thud();
          shake = Math.max(shake, 0.2);
        } else {
          splashFx(pr.x1, pr.y1, 14);
          sfx.splash(true);
        }
      } else {
        const t = pr.target;
        if (t && !t.deadT && Math.hypot(t.x - pr.x1, t.y - 30 - pr.y1) < 60) damage(t, pr.dmg, pr.from);
        if (pr.kind === 'water') splashFx(pr.x1, pr.y1, 6);
      }
    }
  }
  projectiles = projectiles.filter((p) => !p.done);

  for (const e of effects) {
    if (e.kind === 'god' && !e.done && now >= e.hitAt) {
      e.done = true;
      godHit(e);
    }
  }
  for (let i = effects.length - 1; i >= 0; i--) if (now > effects[i].until) effects.splice(i, 1);

  // mặt trận: giữa hai mũi tiến xa nhất
  let a0 = BASE_FRONT[0] + 40;
  let b1 = BASE_FRONT[1] - 40;
  const s0 = live.filter((u) => u.team === 0).map((u) => u.x).sort((x, y) => y - x);
  const s1 = live.filter((u) => u.team === 1).map((u) => u.x).sort((x, y) => x - y);
  if (s0.length) a0 = s0[Math.min(2, s0.length - 1)];
  if (s1.length) b1 = s1[Math.min(2, s1.length - 1)];
  const target = clamp((a0 + b1) / 2, 240, 840);
  front += (target - front) * Math.min(1, dt * 0.8);

  base[0].hitT = Math.max(0, base[0].hitT - dt * 3);
  base[1].hitT = Math.max(0, base[1].hitT - dt * 3);
  shake = Math.max(0, shake - dt * 1.6);
  flash = Math.max(0, flash - dt * 1.4);
  const tension = phase.name === 'battle' ? Math.max(1 - Math.min(base[0].hp / base[0].max, base[1].hp / base[1].max), buffed(0) || buffed(1) ? 0.8 : 0, (phase.until - now) < 30000 ? 0.7 : 0) : 0;
  sfx.setIntensity(tension);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

// ------------------------------------------------------------------ vẽ
function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.1, x - s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.1, x, y, x, y + s * 0.3);
}

function drawParticles() {
  for (const p of particles) {
    const k = clamp(p.life / p.max, 0, 1);
    ctx.globalAlpha = Math.min(1, k * 1.5);
    if (p.kind === 'text') {
      ctx.fillStyle = p.color;
      ctx.font = `800 ${p.size}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
    } else if (p.kind === 'heart') {
      ctx.fillStyle = p.color;
      heartPath(p.x, p.y, p.size);
      ctx.fill();
    } else if (p.kind === 'puff') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.6 - k), 0, TAU);
      ctx.fill();
    } else if (p.kind === 'rect') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.spin || 0) * (now - p.born) / 1000);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else if (p.kind === 'rock') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.x - p.size, p.y);
      ctx.lineTo(p.x - p.size * 0.3, p.y - p.size);
      ctx.lineTo(p.x + p.size, p.y - p.size * 0.4);
      ctx.lineTo(p.x + p.size * 0.6, p.y + p.size * 0.6);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawProjectiles() {
  for (const pr of projectiles) {
    if (now < pr.t0) continue;
    const k = clamp((now - pr.t0) / pr.dur, 0, 1);
    const x = lerp(pr.x0, pr.x1, k);
    const y = lerp(pr.y0, pr.y1, k) - Math.sin(k * Math.PI) * pr.arc;
    if (pr.kind === 'arrow') {
      const k2 = Math.min(1, k + 0.05);
      const x2 = lerp(pr.x0, pr.x1, k2);
      const y2 = lerp(pr.y0, pr.y1, k2) - Math.sin(k2 * Math.PI) * pr.arc;
      const a = Math.atan2(y2 - y, x2 - x);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.strokeStyle = '#5b3a1e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(8, -5);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd54a';
      ctx.fillRect(-24, -4, 6, 8);
      ctx.restore();
    } else if (pr.kind === 'water') {
      ctx.fillStyle = 'rgba(140,220,255,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(x - 3, y - 3, 3, 0, TAU);
      ctx.fill();
    } else if (pr.kind === 'rock') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(k * 8);
      ctx.fillStyle = '#7a6748';
      ctx.beginPath();
      ctx.moveTo(-18, 4);
      ctx.lineTo(-8, -16);
      ctx.lineTo(14, -12);
      ctx.lineTo(18, 8);
      ctx.lineTo(0, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-6, -10, 10, 6);
      ctx.restore();
    } else if (pr.kind === 'wave') {
      ctx.fillStyle = 'rgba(90,200,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(x, y, 24, 14, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x - 4, y, 12, Math.PI, Math.PI * 1.8);
      ctx.stroke();
    }
  }
}

function unitDrawOpts(u) {
  const atk = u.atkT && now - u.atkT < 300 ? (now - u.atkT) / 300 : 0;
  return {
    team: u.team,
    dir: u.dir,
    walk: u.walk,
    atk,
    hurt: u.hurtT && now - u.hurtT < 150 ? 1 : 0,
    general: u.general,
    mini: u.kind === 'mini',
    weapon: u.weapon,
    shield: now < u.shieldUntil,
    dead: u.deadT ? clamp((now - u.deadT) / 800, 0, 1) : 0,
    cheer: now < u.cheerUntil,
    white: now < u.whiteUntil,
    skin: u.skin,
    healGlow: u.healT && now - u.healT < 900 ? 1 - (now - u.healT) / 900 : 0,
    buff: buffed(u.team),
  };
}

function drawUnit(u) {
  const s = scaleAtY(u.y);
  const y = u.y - u.dropY;
  if (u.dropY > 0) {
    // bóng rơi + dù lá
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, 14 * s, 4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = u.team === 0 ? 'rgba(124,179,66,0.9)' : 'rgba(41,168,255,0.9)';
    ctx.beginPath();
    ctx.arc(u.x, y - 80 * s, 26 * s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(u.x - 24 * s, y - 80 * s);
    ctx.lineTo(u.x, y - 40 * s);
    ctx.lineTo(u.x + 24 * s, y - 80 * s);
    ctx.stroke();
  }
  if (u.kind === 'beast') {
    if (u.deadT) ctx.globalAlpha = clamp(1 - (now - u.deadT) / 1500, 0, 1);
    const hurt = u.hurtT && now - u.hurtT < 150;
    const bs = s * (u.big ? 1.05 : 0.8);
    if (u.team === 0) drawElephant(ctx, u.x, y, bs, u.dir, now / 1000 + u.id, hurt, u.deadT ? '' : `🐘 ${u.name}`);
    else drawSerpent(ctx, u.x, y, bs, u.dir, now / 1000 + u.id, hurt, u.deadT ? '' : `🐍 ${u.name}`);
    ctx.globalAlpha = 1;
    if (!u.deadT) hpBar(u.x, y - 180 * bs, 90, u.hp / u.maxHp, TEAM[u.team].color);
    return;
  }
  if (u.kind === 'eagle' || u.kind === 'turtle') {
    if (u.deadT) ctx.globalAlpha = clamp(1 - (now - u.deadT) / 1200, 0, 1);
    const hurt = u.hurtT && now - u.hurtT < 150;
    if (u.kind === 'eagle') {
      const swoop = u.atkT && now - u.atkT < 500 ? Math.sin(((now - u.atkT) / 500) * Math.PI) : 0;
      const alt = u.deadT ? Math.max(0, 120 - (now - u.deadT) / 6) : 110 + Math.sin(now / 300 + u.id) * 12 - swoop * 80;
      drawEagle(ctx, u.x, y, alt, s, u.dir, now / 1000 + u.id, hurt, u.deadT ? '' : `🦅 ${u.name}`);
    } else drawTurtle(ctx, u.x, y, s * 0.9, u.dir, now / 1000 + u.id, hurt, u.deadT ? '' : `🐢 ${u.name}`);
    ctx.globalAlpha = 1;
    return;
  }
  if (u.deadT && u.kind === 'hero' && now - u.deadT > 1500) {
    // đã ngã: chỉ còn bia nhỏ chờ hồi sinh
    return;
  }
  drawSoldier(ctx, u.x, y, s, unitDrawOpts(u), now / 1000);
}

function hpBar(x, y, w, k, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 7);
  ctx.fillStyle = k > 0.5 ? color : k > 0.25 ? '#ffb300' : '#ff5252';
  ctx.fillRect(x - w / 2, y, w * clamp(k, 0, 1), 5);
}

function drawTag(u) {
  const p = u.player;
  if (!p || u.dropY > 0) return;
  const s = scaleAtY(u.y);
  const sc = s * (u.general ? GENERAL_SCALE : 1);
  const x = u.x;
  const y = u.y - 84 * sc;
  const name = `${u.general ? '⭐' : ''}${truncate(p.user.name, 9)}`;
  ctx.font = `700 ${Math.round(15 * s + 2)}px ${FONT}`;
  const w = ctx.measureText(name).width + 12;
  if (u.deadT) {
    const left = Math.max(0, Math.ceil(((u.respawnAt || now) - now) / 1000));
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    rr(ctx, x - w / 2, u.y - 34, w, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(phase.name === 'battle' ? `💀 ${left}s` : name, x, u.y - 22);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = u.team === 0 ? 'rgba(27,94,32,0.85)' : 'rgba(13,60,120,0.85)';
  rr(ctx, x - w / 2, y - 11, w, 22, 11);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x, y + 1);
  hpBar(x, y + 13, Math.max(30, w - 10), u.hp / u.maxHp, TEAM[u.team].light);
  if (p.bubble && now < p.bubble.until) {
    const k = clamp((now - p.bubble.born) / 150, 0, 1);
    ctx.font = `600 ${Math.round(17 * s + 3)}px ${FONT}`;
    const bw = ctx.measureText(p.bubble.text).width + 18;
    const by = y - 40;
    ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    rr(ctx, x - bw / 2, by - 15, bw, 30, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 6, by + 14);
    ctx.lineTo(x, by + 24);
    ctx.lineTo(x + 6, by + 14);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillText(p.bubble.text, x, by + 1);
    ctx.globalAlpha = 1;
  }
}

function drawEffectsBack() {
  for (const e of effects) {
    if (e.kind !== 'god') continue;
    const life = e.until - e.t0;
    const t = now - e.t0;
    const k = Math.min(clamp(t / 700, 0, 1), clamp((life - t) / 900, 0, 1));
    drawGiant(ctx, e.team, k, now / 1000);
  }
}
function drawEffectsFront() {
  for (const e of effects) {
    if (e.kind !== 'wave') continue;
    const k = clamp((now - e.t0) / (e.until - e.t0), 0, 1);
    const x = lerp(W + 100, -300, k);
    ctx.save();
    const g = ctx.createLinearGradient(x, 0, x + 400, 0);
    g.addColorStop(0, 'rgba(200,245,255,0.95)');
    g.addColorStop(0.3, 'rgba(60,170,240,0.85)');
    g.addColorStop(1, 'rgba(30,110,200,0.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + 500, HORIZON_Y + 40);
    ctx.lineTo(x + 40, HORIZON_Y + 40);
    for (let y = HORIZON_Y + 40; y <= 1440; y += 30) ctx.lineTo(x + Math.sin(y * 0.05 + now / 200) * 30, y);
    ctx.lineTo(x + 500, 1440);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawWorld() {
  ctx.save();
  if (shake > 0) ctx.translate(rand(-1, 1) * shake * 14, rand(-1, 1) * shake * 10);
  ctx.drawImage(bgImage || bg, 0, 0, W, H);
  const t = now / 1000;
  drawEffectsBack();
  drawFlood(ctx, front, t);
  drawBaseNui(ctx, base[0].hp / base[0].max, t, base[0].hitT);
  drawBaseNuoc(ctx, base[1].hp / base[1].max, t, base[1].hitT);
  // mặt trận: vạch cờ
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.setLineDash([10, 12]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(front, HORIZON_Y + 40);
  ctx.lineTo(front, 1420);
  ctx.stroke();
  ctx.setLineDash([]);
  const sorted = [...units].sort((a, b) => a.y - b.y);
  for (const u of sorted) drawUnit(u);
  drawProjectiles();
  for (const u of sorted) if (u.kind === 'hero') drawTag(u);
  drawEffectsFront();
  drawParticles();
  ctx.restore();
}

function chip(text, x, y, color, bgc = 'rgba(0,0,0,0.55)', size = 22) {
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + 24;
  ctx.fillStyle = bgc;
  rr(ctx, x - w / 2, y - size * 0.8, w, size * 1.6, size * 0.8);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  return w;
}

function drawHeader() {
  // nền đầu trang
  const g = ctx.createLinearGradient(0, 0, 0, 340);
  g.addColorStop(0, 'rgba(10,12,25,0.9)');
  g.addColorStop(1, 'rgba(10,12,25,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 340);
  // tên game
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 50px ${FONT}`;
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  const title = config.title || DEFAULTS.title;
  ctx.strokeText(title, W / 2, 56);
  const tg = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0);
  tg.addColorStop(0, '#a5e887');
  tg.addColorStop(0.5, '#fff3b0');
  tg.addColorStop(1, '#9fe0ff');
  ctx.fillStyle = tg;
  ctx.fillText(title, W / 2, 56);
  // tỉ số
  ctx.font = `900 64px ${FONT}`;
  ctx.fillStyle = TEAM[0].light;
  ctx.strokeText(String(score[0]), 70, 60);
  ctx.fillText(String(score[0]), 70, 60);
  ctx.fillStyle = TEAM[1].light;
  ctx.strokeText(String(score[1]), W - 70, 60);
  ctx.fillText(String(score[1]), W - 70, 60);
  // thời gian
  const left = Math.max(0, Math.ceil((phase.until - now) / 1000));
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  chip(phase.name === 'battle' ? `Ván ${round} · ⏱ ${mm}:${ss}` : `Ván mới sau ${left}s`, W / 2, 114, left <= 30 && phase.name === 'battle' ? '#ff8a80' : '#fff', 'rgba(0,0,0,0.6)', 24);
  // máu thành + khí thế
  for (const t of [0, 1]) {
    const x0 = t === 0 ? 24 : W / 2 + 12;
    const w = W / 2 - 36;
    const k = base[t].hp / base[t].max;
    const y = 150;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    rr(ctx, x0, y, w, 34, 17);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,213,74,0.85)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    const bw = (w - 6) * k;
    const bg2 = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    bg2.addColorStop(0, TEAM[t].dark);
    bg2.addColorStop(1, TEAM[t].color);
    ctx.fillStyle = k > 0.25 ? bg2 : '#e53935';
    if (bw > 4) {
      rr(ctx, t === 0 ? x0 + 3 : x0 + 3 + (w - 6 - bw), y + 3, bw, 28, 14);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = `800 20px ${FONT}`;
    ctx.textAlign = t === 0 ? 'left' : 'right';
    ctx.fillText(`${TEAM[t].icon} Thành ${TEAM[t].short} ${Math.ceil(base[t].hp)}`, t === 0 ? x0 + 14 : x0 + w - 14, y + 18);
    // khí thế
    const my = 194;
    const mk = buffed(t) ? (rallyUntil[t] - now) / ((Number(config.rallySeconds) || 10) * 1000) : morale[t] / (Number(config.moraleMax) || 300);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(ctx, x0, my, w, 18, 9);
    ctx.fill();
    ctx.fillStyle = buffed(t) ? '#ff7043' : '#ffd54a';
    const mw = (w - 4) * clamp(mk, 0, 1);
    if (mw > 3) {
      rr(ctx, t === 0 ? x0 + 2 : x0 + 2 + (w - 4 - mw), my + 2, mw, 14, 7);
      ctx.fill();
    }
    ctx.font = `800 14px ${FONT}`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeText(buffed(t) ? '🔥 TỔNG TẤN CÔNG' : `🥁 Khí thế ${Math.floor(clamp(mk, 0, 1) * 100)}%`, t === 0 ? x0 + 12 : x0 + w - 12, my + 10);
    ctx.fillStyle = '#fff';
    ctx.fillText(buffed(t) ? '🔥 TỔNG TẤN CÔNG' : `🥁 Khí thế ${Math.floor(clamp(mk, 0, 1) * 100)}%`, t === 0 ? x0 + 12 : x0 + w - 12, my + 10);
    // quân số
    const heroes = heroesOf(t);
    const alive = aliveCount(t);
    ctx.font = `700 18px ${FONT}`;
    ctx.fillStyle = TEAM[t].light;
    ctx.fillText(`👤 ${heroes} chiến binh · ⚔ ${alive} quân`, t === 0 ? x0 + 6 : x0 + w - 6, 230);
  }
}

const GUIDE_TEAM = [['1', 'theo Sơn Tinh ⛰️', 0], ['2', 'theo Thủy Tinh 🌊', 1]];
const GUIDE_ACT = [['3', 'cung tên'], ['4', 'kiếm'], ['5', 'giáo'], ['6', 'khiên'], ['7', 'hồi máu'], ['8', 'trống']];
function chipRow(items, y, size, gap) {
  ctx.font = `800 ${size}px ${FONT}`;
  const widths = items.map(([n, label]) => ctx.measureText(`${n} = ${label}`).width + 30);
  const total = widths.reduce((a, b) => a + b, 0) + (items.length - 1) * gap;
  let x = (W - total) / 2;
  items.forEach(([n, label, team], i) => {
    const w = widths[i];
    const h = size * 1.7;
    ctx.fillStyle = team === 0 ? 'rgba(46,125,50,0.92)' : team === 1 ? 'rgba(21,101,192,0.92)' : 'rgba(10,14,30,0.72)';
    rr(ctx, x, y - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,213,74,0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.fillStyle = '#ffd54a';
    ctx.fillText(n, x + 14, y + 1);
    const nw = ctx.measureText(n).width;
    ctx.font = `700 ${size - 2}px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(` = ${label}`, x + 14 + nw, y + 1);
    x += w + gap;
  });
}
function drawGuide() {
  chipRow(GUIDE_TEAM, 272, 26, 16);
  chipRow(GUIDE_ACT, 322, 20, 7);
  chip(`❤️ ${Number(config.likesPerSoldier) || 10} tim = 1 lính  ·  📣 chia sẻ = 🐘 voi / 🐍 rắn biển  ·  ⭐ theo dõi = phong tướng`, W / 2, 366, '#fff', 'rgba(10,14,30,0.6)', 18);
  chip(`🎁 quà nhỏ = 🦅 đại bàng / 🐢 rùa  ·  ${config.giftTiers?.medium ?? 10} xu = voi chúa / rắn khổng lồ  ·  ${config.giftTiers?.big ?? 100} xu = thần hiện thân`, W / 2, 406, '#ffe9a8', 'rgba(10,14,30,0.6)', 18);
}

function drawToasts() {
  let y = 460;
  for (let i = toasts.length - 1; i >= 0; i--) {
    const t = toasts[i];
    const age = now - t.born;
    if (age > 4500) {
      toasts.splice(i, 1);
      continue;
    }
    const k = Math.min(clamp(age / 200, 0, 1), clamp((4500 - age) / 400, 0, 1));
    ctx.globalAlpha = k;
    chip(t.text, W / 2, y, t.color, 'rgba(0,0,0,0.6)', 22);
    ctx.globalAlpha = 1;
    y += 44;
  }
}

function drawBanner() {
  if (!banner || now > banner.until) return;
  const age = now - banner.t0;
  const k = Math.min(clamp(age / 250, 0, 1), clamp((banner.until - now) / 400, 0, 1));
  const s = 0.8 + 0.2 * clamp(age / 250, 0, 1);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(W / 2, 700);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  rr(ctx, -440, -70, 880, banner.sub ? 140 : 100, 30);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 58px ${FONT}`;
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.strokeText(banner.text, 0, -22);
  ctx.fillStyle = banner.color;
  ctx.fillText(banner.text, 0, -22);
  if (banner.sub) {
    ctx.font = `700 28px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(banner.sub, 0, 36);
  }
  ctx.restore();
}

function drawResult() {
  if (phase.name !== 'result') return;
  const w = phase.winner;
  const age = now - phase.t0;
  const k = clamp(age / 400, 0, 1);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(10,14,30,0.9)';
  rr(ctx, 90, 520, 900, 620, 36);
  ctx.fill();
  ctx.strokeStyle = TEAM[w].color;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 40px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(`KẾT THÚC VÁN ${round}`, W / 2, 580);
  ctx.font = `900 76px ${FONT}`;
  ctx.fillStyle = TEAM[w].light;
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  const wt = `${TEAM[w].icon} ${TEAM[w].name.toUpperCase()} THẮNG`;
  ctx.strokeText(wt, W / 2, 670);
  ctx.fillText(wt, W / 2, 670);
  ctx.font = `800 34px ${FONT}`;
  ctx.fillStyle = '#ffd54a';
  ctx.fillText(`Tỉ số  ${score[0]} - ${score[1]}`, W / 2, 740);
  ctx.font = `800 30px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText('🏆 MÃNH TƯỚNG CỦA VÁN', W / 2, 810);
  const medals = ['🥇', '🥈', '🥉'];
  if (!phase.mvp.length) {
    ctx.font = `600 26px ${FONT}`;
    ctx.fillStyle = '#ccc';
    ctx.fillText('Chưa có ai ra trận. Gõ 1 hoặc 2 để tham gia!', W / 2, 890);
  }
  phase.mvp.forEach(({ p, s }, i) => {
    const y = 880 + i * 76;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    rr(ctx, 160, y - 32, 760, 64, 32);
    ctx.fill();
    ctx.font = `30px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(medals[i], 180, y);
    drawAvatar(250, y, 24, p.user, TEAM[p.team].color);
    ctx.font = `800 28px ${FONT}`;
    ctx.fillStyle = TEAM[p.team].light;
    ctx.fillText(truncate(p.user.name, 16), 290, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd54a';
    ctx.fillText(`${s} điểm · ${p.kills} hạ`, 900, y);
    ctx.textAlign = 'center';
  });
  const left = Math.max(0, Math.ceil((phase.until - now) / 1000));
  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = '#ccc';
  ctx.fillText(`Ván mới sau ${left} giây · Gõ 1 hoặc 2 để chọn phe`, W / 2, 1105);
  ctx.restore();
}

function drawLeaders() {
  if (phase.name !== 'battle') return;
  const y0 = 1452;
  for (const t of [0, 1]) {
    const top = mvpOf(teamPlayers(t));
    if (!top.length) continue;
    const x0 = t === 0 ? 24 : W / 2 + 12;
    const w = W / 2 - 36;
    ctx.fillStyle = t === 0 ? 'rgba(27,94,32,0.6)' : 'rgba(13,60,120,0.6)';
    rr(ctx, x0, y0 - 20, w, 26 + top.length * 34, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,213,74,0.8)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.font = `800 18px ${FONT}`;
    ctx.fillStyle = '#ffd54a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🏅 Mãnh tướng ${TEAM[t].short}`, x0 + 14, y0 - 4);
    top.forEach(({ p, s }, i) => {
      const y = y0 + 26 + i * 34;
      drawAvatar(x0 + 28, y, 13, p.user, TEAM[t].color);
      ctx.font = `700 19px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(truncate(p.user.name, 14), x0 + 50, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = TEAM[t].light;
      ctx.fillText(String(s), x0 + w - 14, y);
    });
  }
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
  const text = truncate(caption.text, 52);
  const w = Math.min(W - 40, ctx.measureText(text).width + 70);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  rr(ctx, W / 2 - w / 2, 1380 - 26, w, 52, 26);
  ctx.fill();
  ctx.fillStyle = '#fff3b0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🎙️ ${text}`, W / 2, 1381);
  ctx.globalAlpha = 1;
}

let lastFrame = performance.now();
let audioBlocked = false;
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastFrame) / 1000);
  lastFrame = ts;
  now = ts;
  update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawWorld();
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,250,230,${flash * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawHeader();
  drawGuide();
  drawToasts();
  drawLeaders();
  drawCaption();
  drawBanner();
  drawResult();
  if (audioBlocked) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(ctx, W / 2 - 250, 1220, 500, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔇 Bấm vào game để bật tiếng', W / 2, 1249);
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
    const res = await fetch('/dai-chien-config.json', { cache: 'no-store' });
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
    a.download = 'nen-dai-chien.png';
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
    const r = await fetch('/dai-chien-music.json', { cache: 'no-store' });
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
  startRound();
  connectWs();
  requestAnimationFrame(frame);
}

window.__daiChien = {
  handleEvent,
  config: () => config,
  state: () => ({ phase: phase.name, round, score: [...score], base: base.map((b) => Math.round(b.hp)), front: Math.round(front), units: units.length, alive: [aliveCount(0), aliveCount(1)], heroes: [heroesOf(0), heroesOf(1)], players: players.size }),
};
boot();
