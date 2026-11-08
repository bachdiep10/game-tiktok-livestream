// Game TikTok LIVE "Đảo Linh Thú": streamer là Trùm Đảo, nuôi một con Pet trên hòn đảo bay.
// Thả tim = năng lượng (đủ 100% Pet nhảy "Vũ điệu ngáo"), comment xay / tam / choi / don điều khiển Pet,
// chia sẻ = rương kho báu rơi xuống đảo (streamer bấm chuột mở), bình chọn 1/2 cho Pet ăn,
// quà nhỏ = thả phân/rác, quà trung = sét đánh / mưa băng (streamer gõ phím giải cứu),
// quà lớn = boss phá nhà (cả phòng thả tim, comment để đánh) hoặc Pet hoá Khổng Lồ Trọc Đầu.
// Định kỳ Pet rơi xuống biển / bị đại bàng tha đi: spam "cuu" 30 giây để cứu.
import {
  W, H, TAU, FONT, ISLAND, hash, roundRectPath as rr, loadImage, chromaKey, drawSky, drawCloud, drawIsland,
  pill, panel, outlined, bar, drawIceBlock, drawBolt,
} from './art.js';
import * as sfx from './dltAudio.js';
import * as voice from '../audio.js';

const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SPEED = clamp(Number(params.get('speed')) || 1, 0.25, 8);
const fmt = (n) => Math.round(n).toLocaleString('vi-VN');

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'ĐẢO LINH THÚ',
  bossName: 'Trùm Đảo',
  petOrder: ['vit', 'tho', 'cho'],
  petNames: { vit: 'Vịt Ngáo', tho: 'Thỏ Đột Biến', cho: 'Chó Shiba' },
  likeEnergy: 2,
  danceSeconds: 6,
  danceJoy: 8,
  joyStart: 80,
  joyDecayPerMinute: 4,
  trashDecayPerMinute: 1.5,
  woodPerBuild: 3,
  buildCooldownSeconds: 3,
  houseWood: [0, 40, 120, 250, 450],
  bathJoy: 3,
  playJoy: 2,
  cleanJoy: 2,
  chatJoy: 0.3,
  followJoy: 5,
  followGold: 20,
  buildWords: ['xay', 'build', 'xay nha', 'go'],
  bathWords: ['tam', 'tam rua', 'xit nuoc', 'rua'],
  playWords: ['choi', 'nem bong', 'bong', 'play'],
  cleanWords: ['don', 'clean', 'cleans', 'don dep', 'don rac', 'quet'],
  rescueWords: ['cuu', 'cuu pet', 'cuu vit', 'cuu tho', 'cuu cho', 'save'],
  attackWords: ['danh', 'dam', 'chem', 'dap', 'hit'],
  chestAutoOpenSeconds: 15,
  chestGold: [10, 30],
  chestWood: [3, 8],
  dragonChestEvery: 50,
  _milestones: 'mốc chia sẻ trong phiên: island = nâng đảo lên cấp đó, pet = mở khoá Pet mới',
  shareMilestones: [
    { shares: 100, island: 2 },
    { shares: 250, island: 3 },
    { shares: 500, pet: true },
    { shares: 1000, island: 4 },
    { shares: 2000, island: 5 },
  ],
  smallGiftMax: 9,
  bigGiftMin: 100,
  bigGiftMode: 'random',
  maxTrash: 14,
  freezeSeconds: 10,
  freezeTaps: 15,
  shockSeconds: 8,
  shockTaps: 10,
  shockJoy: 8,
  giantSeconds: 20,
  bossSeconds: 60,
  bossHp: 400,
  bossHpPerCoin: 1,
  likeDamage: 1,
  chatDamage: 4,
  shareDamage: 30,
  giftDamagePerCoin: 5,
  bossWinGold: 100,
  bossWinJoy: 25,
  bossLoseJoy: 25,
  qteMinutes: 5,
  qteSeconds: 30,
  qteMinGoal: 15,
  qteMaxGoal: 60,
  qteSuccessJoy: 20,
  qteFailJoy: 30,
  voteEverySeconds: 150,
  voteSeconds: 30,
  votes: [
    ['Bún Đậu', 'bun-dau', 'Sầu Riêng', 'sau-rieng'],
    ['Chuối', 'chuoi', 'Dừa', 'dua'],
    ['Xương', 'xuong', 'Bún Đậu', 'bun-dau'],
    ['Sầu Riêng', 'sau-rieng', 'Chuối', 'chuoi'],
  ],
  stinkFoods: ['sau-rieng'],
  maxAvatars: 18,
  imageFolder: 'assets/dao-linh-thu',
  islandOffsetY: 0,
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.3,
  voice: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-HoaiMyNeural',
  voiceGapSeconds: 6,
  voiceJoin: true,
  narration: true,
  narrationSeconds: 45,
  messages: {
    welcome: ['Chào {name} đã lên Đảo Linh Thú. Thả tim để {pet} có năng lượng nha', '{name} vừa đáp xuống đảo. Gõ xay để xây nhà cho {pet} nào', 'Chào mừng {name}. Gõ choi để ném bóng cho {pet} nhé'],
    dance: ['Đủ năng lượng rồi! {pet} tung chiêu vũ điệu ngáo', 'Vũ điệu ngáo bắt đầu! Thả tim tiếp để {pet} nhảy nữa nào'],
    house: ['Nhà của {pet} đã lên cấp {level}. Cảm ơn cả nhà đã góp gỗ', 'Tuyệt vời, nhà cấp {level} đã xây xong'],
    chest: ['Cảm ơn {name} đã chia sẻ, một rương kho báu vừa rơi xuống đảo', '{name} chia sẻ phòng live, rương kho báu rơi rồi kìa'],
    dragon: ['Đủ {n} lượt chia sẻ! Rương Rồng khổng lồ đã rơi xuống đảo', 'Rương Rồng xuất hiện! Cảm ơn cả nhà đã chia sẻ'],
    island: ['Đảo đã nâng lên cấp {level}! Cảm ơn mọi người đã chia sẻ', 'Mốc {n} lượt chia sẻ! Đảo Linh Thú lên cấp {level}'],
    newPet: ['Mốc {n} lượt chia sẻ! {pet} đã gia nhập hòn đảo', 'Chào bạn mới {pet}! Đảo đông vui hơn rồi'],
    poop: ['Ối, {name} thả {gift} thành đống phân lên đảo. Cả nhà gõ don để dọn nhé', '{name} chọc phá rồi! Gõ don để dọn rác cho {pet}'],
    shock: ['Sét đánh! {name} tặng {gift} làm {pet} đen thui mặt. Streamer gõ phím để cứu', 'Ầm! {pet} bị sét đánh, cảm ơn {name} nhé'],
    freeze: ['Mưa băng! {name} tặng {gift}, {pet} bị đóng băng rồi. Streamer gõ phím liên tục để phá băng', '{pet} bị đóng băng! Cảm ơn {name}'],
    boss: ['Cảnh báo! {name} tặng {gift} triệu hồi Boss quái vật tới phá nhà. Cả phòng thả tim, gõ danh để đánh boss', 'Boss xuất hiện! Thả tim và comment liên tục để giúp {pet}'],
    bossWin: ['Hạ gục boss rồi! Cảm ơn cả nhà. {top} đánh mạnh nhất', 'Chiến thắng! Boss đã bị đánh bay khỏi đảo'],
    bossLose: ['Boss đã phá nhà của {pet}. Cả nhà gõ xay để xây lại nhé', 'Ôi không, nhà bị phá rồi. Xây lại thôi'],
    giant: ['Wow! {name} tặng {gift}, {pet} hoá Khổng Lồ Trọc Đầu', 'Khổng Lồ Trọc Đầu xuất hiện! Cảm ơn {name} rất nhiều'],
    qteSea: ['Ối! {pet} rơi xuống biển rồi! Spam comment cuu trong 30 giây để cứu', 'Cứu với! {pet} đang chới với giữa biển. Gõ cuu liên tục'],
    qteEagle: ['Đại bàng tha {pet} đi rồi! Spam comment cuu để cứu ngay', 'Cứu {pet}! Gõ cuu liên tục trong 30 giây'],
    qteWin: ['Cứu thành công! Cảm ơn {top} đã cứu {pet}', '{pet} đã an toàn. Cả phòng tuyệt vời quá'],
    qteFail: ['Chưa cứu kịp, {pet} tự bơi về nhưng buồn lắm. Thả tim để dỗ nhé', '{pet} về rồi nhưng mất vui. Gõ choi để chơi với {pet} nào'],
    vote: ['Bình chọn! Gõ 1 cho {pet} ăn {a}, gõ 2 cho ăn {b}', 'Cả nhà chọn món cho {pet}: 1 là {a}, 2 là {b}'],
    voteEnd: ['{food} thắng rồi! {pet} măm măm', 'Cả phòng chọn {food}. {pet} ăn ngay đây'],
    stink: ['Ối, {food} thơm quá làm {pet} xỉu luôn', '{pet} ăn {food} xong say mùi rồi'],
    sulk: ['{pet} buồn quá bỏ nhà đi rồi! Thả tim, gõ choi để dỗ {pet} nhé', 'Hạnh phúc về 0 rồi! Mau dỗ {pet} đi cả nhà'],
    happyAgain: ['{pet} vui trở lại rồi. Cảm ơn cả nhà'],
    follow: ['Cảm ơn {name} đã theo dõi, {pet} vui lắm', 'Cảm ơn {name} đã follow nhé'],
    gift: ['Cảm ơn {name} đã tặng {gift}'],
    reminder: [
      'Thả tim để nạp năng lượng, đủ 100 phần trăm {pet} sẽ nhảy vũ điệu ngáo',
      'Gõ xay để góp gỗ xây nhà, gõ tam để tắm cho {pet}, gõ choi để ném bóng',
      'Mỗi lượt chia sẻ là một rương kho báu rơi xuống đảo. Đủ 50 lượt có Rương Rồng',
      'Ai comment nhiều nhất sẽ làm Phó Đảo Chủ, tên hiện to ở góc màn hình',
      'Giữ cho {pet} luôn vui nhé, Hạnh Phúc về 0 là {pet} giận dỗi bỏ nhà đi đó',
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
  return list[i].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? (k === 'pet' ? petName() : ''));
}
function norm(s) {
  return ` ${String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}
const hasWord = (n, words) => (words || []).some((w) => n.includes(` ${w} `));

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

const IMG = { bg: null, bgStorm: null, islands: [], pets: {}, houses: [], boss: [], bossHit: [], f: {}, own: {} };
const skyCanvas = { clear: null, storm: null };

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
const COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac'];
function colorFor(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}
function drawAvatar(x, y, r, user, ring = '#fff', ringW = 4) {
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
    ctx.fillStyle = colorFor(user.id || user.name);
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
// vẽ ảnh (emoji 3D hoặc ảnh riêng) căn giữa theo chiều ngang, chân ở y
function drawImg(img, x, y, h, { flip = false, alpha = 1, rot = 0, sx = 1, sy = 1, anchor = 'bottom' } = {}) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const w = (h * iw) / ih;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale((flip ? -1 : 1) * sx, sy);
  ctx.drawImage(img, -w / 2, anchor === 'center' ? -h / 2 : -h, w, h);
  ctx.restore();
}
const F = (name) => IMG.f[name] || null;

// ------------------------------------------------------------------ trạng thái
let now = 0;
let gameTime = 0;
let viewers = 0;
let liveUser = '';
let totalHearts = 0;
let joy = 80;
let energy = 0;
let wood = 0;
let houseLevel = 1;
let gold = 0;
let shares = 0;
let islandLevel = 1;
let petsUnlocked = 1;
let sulking = false;
let lastVoice = -1e9;
let lastActivity = 0;
let lastNarration = 0;
let nextQte = 0;
let nextVote = 0;
let houseShake = 0;
let flash = 0;
let shakeScreen = 0;
const people = new Map(); // id -> người xem
const floats = [];
const particles = [];
const toasts = [];
const trash = [];
const chests = [];
const balls = [];
const bubbles = [];
let event = null; // boss | qte | giant
let vote = null;
let bolt = null;
const milestonesDone = new Set();
const stats = { danced: 0, bossWins: 0, rescues: 0 };

const GROUND_Y = () => ISLAND.top + bobY();
const bobY = () => Math.sin(gameTime * 0.9) * 8;

function petKind(i = 0) {
  const order = config.petOrder?.length ? config.petOrder : DEFAULTS.petOrder;
  return order[i % order.length];
}
function petName(i = 0) {
  return (config.petNames || DEFAULTS.petNames)[petKind(i)] || 'Pet';
}

// Pet chính + Pet mở khoá thêm
const pets = [];
function makePet(i) {
  return {
    i, kind: petKind(i), x: 540 + (i ? (i % 2 ? -150 : 150) : 0), tx: 540, z: 20, face: 1, jump: 0, vy: 0,
    state: 'idle', stateUntil: 0, nextWander: 0, frozenUntil: 0, freezeHp: 0, shockUntil: 0, shockHp: 0, giantUntil: 0,
    sick: 0, scale: 1,
  };
}
pets.push(makePet(0));
const mainPet = () => pets[0];

function say(text, priority = 1) {
  if (!text) return;
  const gap = Math.max(2, Number(config.voiceGapSeconds) || 6) * 1000;
  if (priority < 2 && now - lastVoice < gap) return;
  lastVoice = now;
  voice.speak(text, priority);
}
function toast(text, color = '#ffd34d', ms = 3800) {
  toasts.push({ text, color, t0: now, until: now + ms });
  if (toasts.length > 3) toasts.shift();
}
function addFloat(x, y, text, color = '#fff', size = 40, img = null) {
  if (floats.length > 50) floats.shift();
  floats.push({ x, y, text, color, size, img, t0: now });
}
function burstParticles(x, y, n, colors, speed = 500, size = 10, img = null) {
  for (let i = 0; i < n; i++) {
    if (particles.length > 260) particles.shift();
    const a = rand(0, TAU);
    const s = rand(speed * 0.3, speed);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.4, life: rand(0.8, 1.6), t: 0, color: pick(colors), size: rand(size * 0.6, size * 1.4), img, rot: rand(0, TAU) });
  }
}
function confetti(n = 80) {
  for (let i = 0; i < n; i++) {
    if (particles.length > 300) particles.shift();
    particles.push({ x: rand(0, W), y: rand(-200, 0), vx: rand(-60, 60), vy: rand(200, 500), life: rand(2.5, 4), t: 0, color: pick(COLORS), size: rand(10, 18), rect: true, rot: rand(0, TAU) });
  }
}

// ------------------------------------------------------------------ người xem
function getPerson(user, create = true) {
  if (!user?.id) return null;
  let p = people.get(user.id);
  if (p) {
    if (user.avatar) p.user.avatar = user.avatar;
    if (user.name) p.user.name = user.name;
    return p;
  }
  if (!create) return null;
  if (people.size > 600) {
    let worst = null;
    for (const x of people.values()) if (!worst || x.lastActive < worst.lastActive) worst = x;
    if (worst) people.delete(worst.id);
  }
  const a = rand(0, TAU);
  p = {
    id: user.id, user: { ...user }, chats: 0, shares: 0, likes: 0, coins: 0, damage: 0, rescues: 0,
    lastActive: now, lastBuild: -1e9, joinedAt: now,
    x: 540 + Math.cos(a) * 320, z: 40 + Math.sin(a) * 40, tx: 540, tz: 40, nextMove: 0, bubble: null, hop: rand(0, TAU),
  };
  people.set(user.id, p);
  return p;
}
function touch(p) {
  if (!p) return;
  p.lastActive = now;
  lastActivity = now;
}
function onIsland() {
  const list = [...people.values()].filter((p) => now - p.lastActive < 120000);
  list.sort((a, b) => b.lastActive - a.lastActive);
  return list.slice(0, config.maxAvatars);
}
function topBy(key, n = 3) {
  return [...people.values()].filter((p) => p[key] > 0).sort((a, b) => b[key] - a[key]).slice(0, n);
}

// ------------------------------------------------------------------ niềm vui / năng lượng
function addJoy(v) {
  joy = clamp(joy + v, 0, 100);
  if (v > 0 && sulking && joy >= 30) {
    sulking = false;
    say(line('happyAgain'), 1);
    toast(`😊 ${petName()} vui trở lại rồi!`, '#8cff9e');
  }
}
function petBusy(p = mainPet()) {
  return now < p.frozenUntil || now < p.shockUntil || (event && event.type === 'qte' && p === mainPet());
}
function setState(p, state, ms) {
  p.state = state;
  p.stateUntil = now + ms;
}
function addEnergy(v) {
  // đang nhảy thì giữ năng lượng ở 100%, nhảy xong mới tính lượt tiếp theo
  energy = Math.min(energy + v, 199);
  checkDance();
}
function checkDance() {
  if (energy < 100 || mainPet().state === 'dance') return;
  energy -= 100;
  startDance();
}
function startDance() {
  stats.danced++;
  for (const p of pets) if (!petBusy(p)) setState(p, 'dance', config.danceSeconds * 1000);
  addJoy(config.danceJoy);
  sfx.fanfare();
  confetti(60);
  toast(`💃 VŨ ĐIỆU NGÁO! ${petName()} quẩy tung đảo`, '#ff9de2');
  say(line('dance'), 1);
}

// ------------------------------------------------------------------ nhà + gỗ
function houseNeed(level) {
  const list = config.houseWood || DEFAULTS.houseWood;
  return list[Math.min(level, list.length - 1)] ?? Infinity;
}
function addWood(v, x, y) {
  wood += v;
  if (x != null) addFloat(x, y, `+${v}`, '#ffd08a', 36, F('go'));
  const max = (config.houseWood || DEFAULTS.houseWood).length;
  while (houseLevel < max && wood >= houseNeed(houseLevel)) {
    houseLevel++;
    houseShake = 1;
    sfx.fanfare();
    burstParticles(houseX(), GROUND_Y() - 120, 40, ['#ffd34d', '#fff', '#ff9a3d'], 600, 12);
    toast(`🏠 Nhà lên cấp ${houseLevel}!`, '#ffd34d');
    say(line('house', { level: houseLevel }), 2);
  }
}
const houseX = () => 290;

// ------------------------------------------------------------------ rác, rương, bóng
function islandPoint() {
  // điểm ngẫu nhiên trên mặt cỏ
  const a = rand(0, TAU);
  const r = Math.sqrt(Math.random());
  return { x: clamp(540 + Math.cos(a) * 360 * r, 160, 920), z: 30 + Math.sin(a) * 45 * r };
}
function dropTrash(by, kind) {
  if (trash.length >= config.maxTrash) trash.shift();
  const pt = islandPoint();
  trash.push({ ...pt, y: -100 - rand(0, 200), vy: 0, landed: false, kind, by: by?.name || '', t0: now });
}
function cleanOne(p) {
  if (!trash.length) return false;
  // dọn cục gần người dọn nhất
  let best = 0;
  let bd = Infinity;
  trash.forEach((t, i) => {
    const d = Math.abs(t.x - (p?.x ?? 540));
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  const t = trash.splice(best, 1)[0];
  burstParticles(t.x, GROUND_Y() + t.z - 30, 14, ['#c9f5ff', '#ffffff', '#9be46a'], 300, 8);
  addFloat(t.x, GROUND_Y() + t.z - 80, '✨ sạch', '#c9f5ff', 34);
  sfx.whoosh();
  return true;
}
function dropChest(by, dragon = false) {
  if (chests.filter((c) => !c.opened).length >= 10) {
    const old = chests.find((c) => !c.opened && c.landed);
    if (old) openChest(old);
  }
  const pt = islandPoint();
  chests.push({ ...pt, y: -150, vy: 0, landed: false, dragon, by: by?.name || '', t0: now, opened: false, openAt: 0 });
  sfx.whoosh();
}
function openChest(c) {
  if (c.opened) return;
  c.opened = true;
  c.openAt = now;
  const g = c.dragon ? 200 : Math.round(rand(config.chestGold[0], config.chestGold[1]));
  const wd = c.dragon ? 40 : Math.round(rand(config.chestWood[0], config.chestWood[1]));
  gold += g;
  const sx = c.x;
  const sy = GROUND_Y() + c.z - 60;
  addFloat(sx, sy - 40, `+${g}`, '#ffe066', 44, F('vang'));
  addWood(wd, sx + 40, sy);
  burstParticles(sx, sy, c.dragon ? 60 : 24, ['#ffe066', '#ffd34d', '#fff6b0'], c.dragon ? 700 : 420, 12, F('vang'));
  sfx.chest();
  if (c.dragon) {
    addJoy(15);
    confetti(100);
  } else addJoy(1);
  // đang đánh boss: rương có thể chứa vũ khí
  if (event?.type === 'boss' && (c.dragon || Math.random() < 0.5)) {
    const dmg = c.dragon ? 150 : 40;
    damageBoss(dmg, null, '⚔️ Vũ khí trong rương');
  }
}
function throwBall(p) {
  if (balls.length > 3) balls.shift();
  const from = p ? p.x : rand(200, 880);
  const tx = clamp(rand(180, 900), 160, 920);
  balls.push({ x: from, y: GROUND_Y() - 120, z: 30, vx: (tx - from) / 1.1, vy: -700, t0: now, tx, bounces: 0 });
  sfx.boing();
}

// ------------------------------------------------------------------ boss
function startBoss(by, coins, giftName) {
  const kinds = IMG.boss.length || 1;
  const k = Math.floor(Math.random() * kinds);
  const hp = Math.round(config.bossHp + coins * config.bossHpPerCoin);
  event = { type: 'boss', kind: k, hp, max: hp, start: now, until: now + config.bossSeconds * 1000, by: by?.name || '', nextAttack: now + 3500, hitAt: -1e9, x: 900, lunge: 0 };
  sfx.roar();
  sfx.alarm();
  shakeScreen = 1;
  for (const p of people.values()) p.damage = 0;
  toast(`👹 BOSS do ${truncate(by?.name, 16)} triệu hồi!`, '#ff6b6b', 5000);
  say(line('boss', { name: by?.name, gift: giftName }), 2);
}
function damageBoss(v, person, label = '') {
  if (event?.type !== 'boss' || v <= 0) return;
  event.hp -= v;
  event.hitAt = now;
  if (person) person.damage += v;
  sfx.hit();
  addFloat(event.x - 60 + rand(-60, 60), GROUND_Y() - 300 + rand(-60, 40), `-${Math.round(v)}`, '#ff5c5c', v >= 50 ? 56 : 40);
  if (label) toast(label, '#ffb3b3', 2500);
  if (event.hp <= 0) endBoss(true);
}
function endBoss(win) {
  const e = event;
  event = null;
  const top = topBy('damage', 1)[0];
  if (win) {
    stats.bossWins++;
    gold += config.bossWinGold;
    addJoy(config.bossWinJoy);
    sfx.fanfare();
    confetti(120);
    burstParticles(e.x - 60, GROUND_Y() - 200, 50, ['#ffd34d', '#ff6b6b', '#fff'], 800, 14);
    toast(`🏆 HẠ GỤC BOSS! +${config.bossWinGold} vàng${top ? ` · ${truncate(top.user.name, 14)} đánh mạnh nhất` : ''}`, '#8cff9e', 6000);
    say(line('bossWin', { top: top?.user.name || 'cả phòng' }), 2);
  } else {
    // boss phá nhà: tụt 1 cấp
    if (houseLevel > 1) {
      houseLevel--;
      wood = houseNeed(houseLevel - 1);
    }
    houseShake = 1.5;
    shakeScreen = 1;
    addJoy(-config.bossLoseJoy);
    sfx.sad();
    burstParticles(houseX(), GROUND_Y() - 100, 40, ['#8a5a2b', '#c58b4c', '#666'], 600, 14);
    toast('💥 Boss phá nhà! Gõ "xay" để xây lại', '#ff6b6b', 6000);
    say(line('bossLose'), 2);
  }
  for (const p of people.values()) p.damage = 0;
}

// ------------------------------------------------------------------ cứu pet (minigame phản ứng nhanh)
function startQte(kind) {
  if (event) return;
  kind = kind || (Math.random() < 0.5 ? 'sea' : 'eagle');
  const active = [...people.values()].filter((p) => now - p.lastActive < 90000).length;
  const goal = Math.round(clamp(active * 1.2, config.qteMinGoal, config.qteMaxGoal));
  event = { type: 'qte', kind, count: 0, goal, start: now, until: now + config.qteSeconds * 1000, rescuers: new Map() };
  vote = null;
  const p = mainPet();
  p.frozenUntil = 0;
  p.shockUntil = 0;
  sfx.alarm();
  if (kind === 'sea') sfx.splash();
  else sfx.whoosh();
  say(line(kind === 'sea' ? 'qteSea' : 'qteEagle'), 2);
}
function rescueHit(person, n = 1) {
  if (event?.type !== 'qte') return;
  event.count += n;
  if (person) {
    event.rescuers.set(person.id, (event.rescuers.get(person.id) || 0) + n);
    person.rescues += n;
  }
  sfx.pop();
  if (event.count >= event.goal) endQte(true);
}
function endQte(win) {
  const e = event;
  event = null;
  nextQte = now + config.qteMinutes * 60000;
  const p = mainPet();
  const tops = [...e.rescuers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => people.get(id)?.user.name).filter(Boolean);
  p.x = 540;
  p.jump = 420;
  p.vy = 0;
  if (win) {
    stats.rescues++;
    addJoy(config.qteSuccessJoy);
    sfx.fanfare();
    confetti(80);
    toast(`🛟 CỨU THÀNH CÔNG!${tops.length ? ` Cảm ơn ${tops.map((n) => truncate(n, 12)).join(', ')}` : ''}`, '#8cff9e', 6000);
    say(line('qteWin', { top: tops[0] || 'cả phòng' }), 2);
  } else {
    addJoy(-config.qteFailJoy);
    setState(p, 'sad', 8000);
    sfx.sad();
    toast(`😢 Chưa cứu kịp... ${petName()} tự bơi về`, '#ffb3b3', 5000);
    say(line('qteFail'), 2);
  }
}

// ------------------------------------------------------------------ bình chọn
function startVote() {
  if (event || vote) return;
  const list = config.votes?.length ? config.votes : DEFAULTS.votes;
  const v = pick(list);
  vote = { a: v[0], ai: v[1], b: v[2], bi: v[3], counts: [0, 0], voters: new Set(), until: now + config.voteSeconds * 1000, start: now };
  sfx.tick();
  say(line('vote', { a: v[0], b: v[2] }), 1);
}
function endVote() {
  const v = vote;
  vote = null;
  nextVote = now + config.voteEverySeconds * 1000;
  if (!v.counts[0] && !v.counts[1]) return;
  const win = v.counts[1] > v.counts[0] ? 1 : v.counts[0] > v.counts[1] ? 0 : Math.round(Math.random());
  const food = win ? v.b : v.a;
  const icon = win ? v.bi : v.ai;
  const p = mainPet();
  p.food = icon;
  setState(p, 'eat', 4500);
  addJoy(6);
  sfx.coin();
  toast(`🍽️ ${food} thắng (${v.counts[win]} phiếu)!`, '#ffe066', 4500);
  say(line('voteEnd', { food }), 1);
  if ((config.stinkFoods || []).includes(icon)) {
    setTimeout(() => {
      setState(p, 'stink', 4000);
      say(line('stink', { food }), 1);
      addFloat(p.x, GROUND_Y() - 340, '🤢 thơm quá...', '#b5f5a0', 40);
    }, 4500 / SPEED);
  }
}

// ------------------------------------------------------------------ quà
function giftTier(coins) {
  if (coins >= config.bigGiftMin) return 'big';
  if (coins > config.smallGiftMax) return 'mid';
  return 'small';
}
function handleGift(ev, person) {
  const coins = Number(ev.coins) || (Number(ev.diamonds) || 1) * (Number(ev.repeatCount) || 1);
  person.coins += coins;
  gold += coins;
  const name = person.user.name;
  const giftName = ev.giftName || 'quà';
  const tier = giftTier(coins);
  const p = mainPet();
  // đang có boss: quà nhỏ/trung = vũ khí đánh boss, quà lớn = boss nổi điên
  if (event?.type === 'boss') {
    if (tier === 'big') {
      event.hp += Math.round(coins * config.bossHpPerCoin);
      event.max = Math.max(event.max, event.hp);
      event.until += 15000;
      sfx.roar();
      toast(`😡 ${truncate(name, 14)} làm boss nổi điên! +máu +15 giây`, '#ff6b6b');
    } else {
      damageBoss(coins * config.giftDamagePerCoin, person, `⚔️ ${truncate(name, 14)} tặng ${giftName}: vũ khí đánh boss!`);
    }
    say(line('gift', { name, gift: giftName }), 1);
    return;
  }
  // đang cứu pet: quà nào cũng cộng lượt cứu
  if (event?.type === 'qte') {
    rescueHit(person, tier === 'big' ? event.goal : tier === 'mid' ? 10 : 3);
    say(line('gift', { name, gift: giftName }), 1);
    return;
  }
  if (tier === 'small') {
    const n = clamp(Number(ev.repeatCount) || 1, 1, 5);
    for (let i = 0; i < n; i++) setTimeout(() => dropTrash(person.user, Math.random() < 0.6 ? 'phan' : 'rac'), (i * 250) / SPEED);
    addJoy(-2 * n);
    toast(`💩 ${truncate(name, 16)} thả ${giftName} thành phân! Gõ "don" để dọn`, '#e0b07a');
    say(line('poop', { name, gift: giftName }), 1);
    return;
  }
  if (tier === 'mid') {
    if (Math.random() < 0.5) {
      // sét đánh
      p.shockUntil = now + config.shockSeconds * 1000;
      p.shockHp = config.shockTaps;
      p.frozenUntil = 0;
      bolt = { t0: now, x: p.x, seed: Math.random() * 100 };
      flash = 1;
      shakeScreen = 0.7;
      addJoy(-config.shockJoy);
      sfx.zap();
      toast(`⚡ ${truncate(name, 16)} tặng ${giftName}: SÉT ĐÁNH! Streamer gõ phím để cứu`, '#fff27a', 5000);
      say(line('shock', { name, gift: giftName }), 2);
    } else {
      p.frozenUntil = now + config.freezeSeconds * 1000;
      p.freezeHp = config.freezeTaps;
      p.shockUntil = 0;
      for (let i = 0; i < 40; i++) particles.push({ x: rand(0, W), y: rand(-300, 0), vx: rand(-40, 40), vy: rand(500, 900), life: 2, t: 0, color: '#dff6ff', size: rand(6, 12), ice: true, rot: 0 });
      addJoy(-5);
      sfx.freeze();
      toast(`🧊 ${truncate(name, 16)} tặng ${giftName}: MƯA BĂNG! Streamer gõ phím liên tục để phá băng`, '#aee9ff', 5000);
      say(line('freeze', { name, gift: giftName }), 2);
    }
    return;
  }
  // quà lớn
  const mode = config.bigGiftMode;
  const boss = mode === 'boss' || (mode !== 'giant' && Math.random() < 0.5);
  if (boss) startBoss(person.user, coins, giftName);
  else {
    p.giantUntil = now + config.giantSeconds * 1000;
    p.frozenUntil = 0;
    p.shockUntil = 0;
    // khổng lồ dậm chân: sạch hết rác
    setTimeout(() => {
      while (trash.length) cleanOne(null);
      shakeScreen = 0.8;
      sfx.thud();
    }, 900 / SPEED);
    addJoy(10);
    sfx.roar();
    confetti(60);
    toast(`💪 ${truncate(name, 16)} biến ${petName()} thành KHỔNG LỒ TRỌC ĐẦU!`, '#ffcf6b', 5000);
    say(line('giant', { name, gift: giftName }), 2);
  }
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
      resetAll();
      return;
    case 'voiceTest':
      say(`Xin chào, mình là ${petName()} trên Đảo Linh Thú`, 2);
      return;
    case 'qte':
      if (event?.type === 'qte') endQte(true);
      else if (!event) startQte(ev.kind);
      return;
    case 'vote':
      if (vote) vote.until = now;
      else startVote();
      return;
    case 'addShares':
      shares += Number(ev.n) || 50;
      checkMilestones();
      return;
    case 'giftStreak':
      return;
  }
  const person = getPerson(ev.user);
  if (!person) return;
  touch(person);
  const p = mainPet();
  switch (ev.type) {
    case 'join':
      if (config.voiceJoin && Math.random() < 0.35) say(line('welcome', { name: person.user.name }), 0);
      return;
    case 'like': {
      const n = Math.max(1, Number(ev.count) || 1);
      person.likes += n;
      totalHearts += n;
      addEnergy(n * config.likeEnergy);
      addJoy(n * 0.05);
      if (event?.type === 'boss') damageBoss(n * config.likeDamage, person);
      if (now < p.frozenUntil) p.freezeHp -= n * 0.1;
      for (let i = 0; i < Math.min(n, 4); i++) {
        if (particles.length > 240) break;
        particles.push({ x: rand(780, 1040), y: 1500, vx: rand(-80, 40), vy: rand(-700, -400), life: 1.6, t: 0, color: '#ff4d6d', size: 26, img: F('tim'), rot: 0, heart: true });
      }
      sfx.pop();
      return;
    }
    case 'chat': {
      const text = String(ev.text || '');
      if (text) person.bubble = { text: truncate(text, 26), until: now + 4500 };
      person.chats++;
      const n = norm(text);
      if (event?.type === 'qte' && hasWord(n, config.rescueWords)) {
        rescueHit(person, 1);
        return;
      }
      if (vote) {
        const first = n.trim().split(' ')[0];
        if ((first === '1' || first === '2') && !vote.voters.has(person.id)) {
          vote.voters.add(person.id);
          vote.counts[first === '1' ? 0 : 1]++;
          sfx.tick();
          return;
        }
      }
      if (event?.type === 'boss') damageBoss(config.chatDamage * (hasWord(n, config.attackWords) ? 2 : 1), person);
      if (hasWord(n, config.buildWords)) {
        if (now - person.lastBuild >= config.buildCooldownSeconds * 1000) {
          person.lastBuild = now;
          addWood(config.woodPerBuild, houseX() + rand(-40, 40), GROUND_Y() - 200);
          person.tx = houseX() + rand(40, 120);
          sfx.knock();
          burstParticles(houseX() + 60, GROUND_Y() - 60, 6, ['#c58b4c', '#8a5a2b'], 250, 8);
        }
      } else if (hasWord(n, config.bathWords)) {
        if (!petBusy(p)) {
          setState(p, 'bath', 4000);
          p.sick = Math.max(0, p.sick - 1);
        }
        for (let i = 0; i < 6; i++) bubbles.push({ x: p.x + rand(-90, 90), y: GROUND_Y() + p.z - rand(40, 220), r: rand(10, 26), t0: now, vy: rand(-60, -140) });
        addJoy(config.bathJoy);
        sfx.bubbles();
      } else if (hasWord(n, config.playWords)) {
        throwBall(person);
        addJoy(config.playJoy);
      } else if (hasWord(n, config.cleanWords)) {
        if (cleanOne(person)) addJoy(config.cleanJoy);
      } else {
        addJoy(config.chatJoy);
      }
      return;
    }
    case 'follow':
      addJoy(config.followJoy);
      gold += config.followGold;
      toast(`⭐ ${truncate(person.user.name, 18)} đã theo dõi! +${config.followGold} vàng`, '#ffe066');
      say(line('follow', { name: person.user.name }), 1);
      return;
    case 'share': {
      person.shares++;
      shares++;
      if (event?.type === 'boss') damageBoss(config.shareDamage, person);
      const every = Math.max(1, Number(config.dragonChestEvery) || 50);
      const dragon = shares % every === 0;
      dropChest(person.user, dragon);
      if (dragon) {
        toast(`🐉 ĐỦ ${shares} LƯỢT CHIA SẺ: RƯƠNG RỒNG!`, '#ff9a3d', 5000);
        say(line('dragon', { n: shares }), 2);
      } else {
        toast(`🎁 ${truncate(person.user.name, 18)} chia sẻ: rương kho báu rơi xuống!`, '#9be7ff');
        say(line('chest', { name: person.user.name }), 1);
      }
      checkMilestones();
      return;
    }
    case 'gift':
      handleGift(ev, person);
  }
}

function checkMilestones() {
  for (const m of config.shareMilestones || []) {
    if (shares < m.shares || milestonesDone.has(m.shares)) continue;
    milestonesDone.add(m.shares);
    if (m.island && m.island > islandLevel) {
      islandLevel = Math.min(5, m.island);
      sfx.fanfare();
      confetti(120);
      toast(`🏝️ ĐẢO LÊN CẤP ${islandLevel}!`, '#8cff9e', 6000);
      say(line('island', { level: islandLevel, n: m.shares }), 2);
    }
    if (m.pet) {
      const order = config.petOrder?.length ? config.petOrder : DEFAULTS.petOrder;
      if (petsUnlocked < order.length) {
        const np = makePet(petsUnlocked);
        np.jump = 600;
        pets.push(np);
        petsUnlocked++;
        sfx.fanfare();
        confetti(120);
        toast(`🎉 MỞ KHOÁ PET MỚI: ${petName(np.i)}!`, '#ff9de2', 6000);
        say(line('newPet', { pet: petName(np.i), n: m.shares }), 2);
      }
    }
  }
}
function nextMilestone() {
  return (config.shareMilestones || []).find((m) => !milestonesDone.has(m.shares));
}

function resetAll() {
  people.clear();
  trash.length = 0;
  chests.length = 0;
  balls.length = 0;
  floats.length = 0;
  event = null;
  vote = null;
  joy = config.joyStart;
  energy = 0;
  wood = 0;
  houseLevel = 1;
  gold = 0;
  shares = 0;
  islandLevel = 1;
  petsUnlocked = 1;
  totalHearts = 0;
  sulking = false;
  milestonesDone.clear();
  pets.length = 0;
  pets.push(makePet(0));
  nextQte = now + config.qteMinutes * 60000;
  nextVote = now + config.voteEverySeconds * 1000;
}

// streamer gõ phím / bấm chuột vào pet để giải cứu
function streamerTap() {
  const p = mainPet();
  if (now < p.frozenUntil) {
    p.freezeHp--;
    sfx.crack();
    burstParticles(p.x + rand(-80, 80), GROUND_Y() + p.z - rand(60, 260), 5, ['#dff6ff', '#fff', '#9fdcff'], 300, 9);
    if (p.freezeHp <= 0) {
      p.frozenUntil = 0;
      sfx.freeze();
      burstParticles(p.x, GROUND_Y() + p.z - 150, 40, ['#dff6ff', '#fff', '#9fdcff'], 600, 12);
      toast('🧊 Phá băng thành công!', '#aee9ff');
      addJoy(3);
    }
    return true;
  }
  if (now < p.shockUntil) {
    p.shockHp--;
    for (let i = 0; i < 4; i++) bubbles.push({ x: p.x + rand(-80, 80), y: GROUND_Y() + p.z - rand(60, 260), r: rand(10, 22), t0: now, vy: rand(-60, -140) });
    sfx.bubbles();
    if (p.shockHp <= 0) {
      p.shockUntil = 0;
      toast(`🚿 ${petName()} đã sạch lại!`, '#aee9ff');
      addJoy(3);
    }
    return true;
  }
  return false;
}
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  streamerTap();
});
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * W;
  const y = ((e.clientY - r.top) / r.height) * H;
  // rương gần chỗ bấm
  let best = null;
  let bd = 130;
  for (const c of chests) {
    if (c.opened || !c.landed) continue;
    const d = Math.hypot(c.x - x, GROUND_Y() + c.z - 50 - y);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  if (best) {
    openChest(best);
    return;
  }
  const p = mainPet();
  if (Math.abs(x - p.x) < 200 && Math.abs(y - (GROUND_Y() - 150)) < 220) streamerTap();
});

// ------------------------------------------------------------------ cập nhật
function update(dt) {
  const ground = GROUND_Y();
  // giảm niềm vui theo thời gian, rác làm giảm nhanh hơn
  const landedTrash = trash.filter((t) => t.landed).length;
  joy = clamp(joy - ((config.joyDecayPerMinute + landedTrash * config.trashDecayPerMinute) / 60) * dt, 0, 100);
  if (joy <= 0 && !sulking) {
    sulking = true;
    sfx.sad();
    toast(`💔 ${petName()} giận dỗi bỏ nhà đi! Thả tim, gõ "choi" để dỗ`, '#ff9db0', 6000);
    say(line('sulk'), 2);
  }

  // pet
  pets.forEach((p, idx) => {
    if (p.jump > 0 || p.vy !== 0) {
      p.vy += 2600 * dt;
      p.jump -= p.vy * dt;
      if (p.jump <= 0) {
        p.jump = 0;
        p.vy = 0;
        sfx.thud();
      }
    }
    const busy = now < p.frozenUntil || now < p.shockUntil || (idx === 0 && event?.type === 'qte');
    if (now >= p.stateUntil && p.state !== 'idle' && p.state !== 'walk') p.state = 'idle';
    if (busy) return;
    // đuổi theo bóng gần nhất
    const ball = balls.find((b) => !b.caught);
    if (ball && idx === 0) {
      p.tx = ball.x;
      p.state = 'chase';
      p.stateUntil = now + 500;
      if (Math.abs(ball.x - p.x) < 50 && ball.landed) {
        ball.caught = true;
        p.jump = 1;
        p.vy = -900;
        addFloat(p.x, ground - 360, '⚽ bắt được!', '#fff', 36);
      }
    } else if (p.state === 'idle' && now > p.nextWander) {
      p.tx = clamp(540 + rand(-300, 300), 200, 880);
      p.nextWander = now + rand(2500, 6000);
    }
    if (event?.type === 'boss' && idx === 0) p.tx = clamp(event.x - 330, 300, 700);
    const speed = (p.state === 'chase' ? 520 : p.state === 'dance' ? 0 : 140) * (now < p.giantUntil ? 0.7 : 1);
    const dx = p.tx - p.x;
    if (Math.abs(dx) > 6 && speed > 0 && p.state !== 'bath' && p.state !== 'eat') {
      p.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      p.face = dx > 0 ? 1 : -1;
      if (p.state === 'idle') p.state = 'walk';
    } else if (p.state === 'walk') p.state = 'idle';
    if (p.state === 'dance' && Math.random() < dt * 3) p.face *= -1;
  });
  if (now >= mainPet().giantUntil && mainPet().giantUntil) mainPet().giantUntil = 0;
  checkDance();

  // bóng
  for (const b of balls) {
    if (b.landed) continue;
    b.vy += 1800 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y >= ground + b.z - 20) {
      b.y = ground + b.z - 20;
      b.bounces++;
      b.vy *= -0.45;
      b.vx *= 0.6;
      if (b.bounces > 2) b.landed = true;
      sfx.boing();
    }
  }
  for (let i = balls.length - 1; i >= 0; i--) if (balls[i].caught || now - balls[i].t0 > 9000) balls.splice(i, 1);

  // rác, rương rơi
  for (const t of [...trash, ...chests]) {
    if (t.landed) continue;
    t.vy += 2200 * dt;
    t.y += t.vy * dt;
    if (t.y >= ground + t.z) {
      t.y = ground + t.z;
      t.landed = true;
      if (t.kind) sfx.plop();
      else sfx.thud();
      burstParticles(t.x, ground + t.z - 10, 10, t.kind ? ['#7a4f2c', '#a87442'] : ['#ffe066', '#fff'], 260, 8);
    }
  }
  const auto = config.chestAutoOpenSeconds * 1000;
  for (const c of chests) if (!c.opened && c.landed && auto > 0 && now - c.t0 > auto) openChest(c);
  for (let i = chests.length - 1; i >= 0; i--) if (chests[i].opened && now - chests[i].openAt > 2500) chests.splice(i, 1);

  // boss
  if (event?.type === 'boss') {
    if (now > event.nextAttack) {
      event.nextAttack = now + 3200;
      event.lunge = 1;
      houseShake = 0.6;
      sfx.thud();
      burstParticles(houseX() + 60, ground - 120, 10, ['#8a5a2b', '#c58b4c'], 400, 10);
    }
    event.lunge = Math.max(0, event.lunge - dt * 1.6);
    if (now > event.until) endBoss(false);
  }
  if (event?.type === 'qte' && now > event.until) endQte(false);
  if (vote && now > vote.until) endVote();
  if (!event && !vote && now > nextQte && config.qteMinutes > 0) startQte();
  if (!event && !vote && now > nextVote && config.voteEverySeconds > 0) startVote();

  // người xem đi dạo trên đảo
  for (const p of onIsland()) {
    if (now > p.nextMove) {
      const pt = islandPoint();
      p.tx = pt.x;
      p.tz = pt.z;
      p.nextMove = now + rand(3000, 8000);
    }
    const dx = p.tx - p.x;
    const dz = p.tz - p.z;
    const d = Math.hypot(dx, dz);
    if (d > 4) {
      const s = Math.min(d, 90 * dt);
      p.x += (dx / d) * s;
      p.z += (dz / d) * s;
      p.hop += dt * 10;
    }
  }

  // hạt
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    q.t += dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (!q.heart && !q.rect && !q.ice) q.vy += 900 * dt;
    q.rot += dt * 4;
    if (q.t > q.life) particles.splice(i, 1);
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y += b.vy * dt;
    if (now - b.t0 > 1800) bubbles.splice(i, 1);
  }
  for (let i = floats.length - 1; i >= 0; i--) if (now - floats[i].t0 > 1800) floats.splice(i, 1);
  for (let i = toasts.length - 1; i >= 0; i--) if (now > toasts[i].until) toasts.splice(i, 1);
  houseShake = Math.max(0, houseShake - dt * 1.5);
  flash = Math.max(0, flash - dt * 2.5);
  shakeScreen = Math.max(0, shakeScreen - dt * 1.4);

  // lời dẫn khi vắng
  if (config.narration && now - lastActivity > config.narrationSeconds * 1000 && now - lastNarration > config.narrationSeconds * 1000) {
    lastNarration = now;
    say(line('reminder'), 0);
  }
}

// ------------------------------------------------------------------ vẽ
const CLOUDS = Array.from({ length: 7 }, (_, i) => ({ x: hash(i + 1) * W, y: 380 + hash(i + 9) * 1000, s: 0.6 + hash(i + 4) * 0.8, v: 8 + hash(i + 2) * 14 }));
function drawBackground(t) {
  const storm = event?.type === 'boss';
  const bg = storm ? IMG.bgStorm || null : IMG.bg;
  if (bg) ctx.drawImage(bg, 0, 0, W, H);
  else ctx.drawImage(storm ? skyCanvas.storm : skyCanvas.clear, 0, 0);
  if (storm && !IMG.bgStorm && IMG.bg) {
    ctx.drawImage(IMG.bg, 0, 0, W, H);
    ctx.fillStyle = 'rgba(30,20,60,0.5)';
    ctx.fillRect(0, 0, W, H);
  }
  for (const c of CLOUDS) {
    const x = ((c.x + t * c.v) % (W + 400)) - 200;
    drawCloud(ctx, x, c.y, c.s, storm ? 0.7 : 0.85, storm);
  }
  // sóng biển nhẹ
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const y = 1600 + i * 70;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + Math.sin(x / 60 + t * 2 + i) * 6);
    ctx.stroke();
  }
  ctx.restore();
}

function islandImage() {
  return IMG.islands[islandLevel - 1] || IMG.islands.find(Boolean) || null;
}
function drawIslandBody() {
  const img = islandImage();
  const y = GROUND_Y() - 300 - 30 + (Number(config.islandOffsetY) || 0);
  const s = 1 + (islandLevel - 1) * 0.02;
  ctx.save();
  ctx.translate(540, y + 300);
  ctx.scale(s, s);
  ctx.drawImage(img, -540, -300, 1080, 1080);
  ctx.restore();
}

function petPose(p) {
  if (event?.type === 'qte' && p === mainPet()) return 'duoi-nuoc';
  if (now < p.frozenUntil) return 'dong-bang';
  if (now < p.shockUntil) return 'dien';
  if (now < p.giantUntil) return 'khong-lo';
  if (p.state === 'dance') return 'nhay';
  if (p.state === 'eat') return 'an';
  if (p.state === 'bath') return 'tam';
  if (p.state === 'chase') return 'choi';
  if (p.state === 'stink' || p.state === 'sad' || sulking || trash.filter((t) => t.landed).length >= 4) return 'buon';
  return 'dung';
}
function petImage(kind, pose) {
  const own = IMG.pets[kind] || {};
  return { img: own[pose] || own.dung || F(kind), own: Boolean(own[pose]), base: Boolean(own.dung) };
}

function drawPet(p, t) {
  const ground = GROUND_Y();
  const pose = petPose(p);
  const { img, own } = petImage(p.kind, pose);
  const giant = now < p.giantUntil;
  const baseH = (p.i === 0 ? 330 : 230) * (giant ? 1.6 : 1);
  let x = p.x;
  let y = ground + p.z - p.jump;
  let rot = 0;
  let sx = 1;
  let sy = 1;
  // chuyển động theo tư thế
  if (pose === 'nhay') {
    y -= Math.abs(Math.sin(t * 9)) * 70;
    rot = Math.sin(t * 9) * 0.25;
    sx = 1 + Math.sin(t * 18) * 0.06;
  } else if (pose === 'dung' || pose === 'choi') {
    const walk = p.state === 'walk' || p.state === 'chase';
    y -= walk ? Math.abs(Math.sin(t * 12)) * 22 : 0;
    sy = 1 + Math.sin(t * 3) * 0.025;
    sx = 2 - sy;
    rot = walk ? Math.sin(t * 12) * 0.06 : 0;
  } else if (pose === 'an') {
    sy = 1 + Math.sin(t * 14) * 0.05;
  } else if (pose === 'dien') {
    x += Math.sin(t * 60) * 6;
  } else if (pose === 'buon') {
    rot = -0.08;
    sy = 0.96;
  } else if (pose === 'khong-lo') {
    sy = 1 + Math.sin(t * 4) * 0.03;
  }
  // bóng đổ
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(p.x, ground + p.z, baseH * 0.38, baseH * 0.07, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // ảnh emoji 3D hướng sang trái: lật khi đi sang phải
  const flip = own ? p.face < 0 && pose !== 'dung' : p.face > 0;
  ctx.save();
  if (!own && pose === 'dien') ctx.filter = 'brightness(0.3) contrast(1.3)';
  if (!own && pose === 'buon' && p.state === 'stink') ctx.filter = 'hue-rotate(60deg) saturate(1.4)';
  drawImg(img, x, y, baseH, { flip, rot, sx, sy });
  ctx.restore();
  const top = y - baseH;
  // hiệu ứng thêm khi chưa có ảnh riêng cho tư thế đó
  if (pose === 'dong-bang' && !own) drawIceBlock(ctx, p.x, ground + p.z + 10, baseH * 1.05, baseH * 1.12, t);
  if (pose === 'dien') {
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.8 + i / 3) % 1;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(x + Math.sin(i * 2 + t) * 30, top - k * 120, 20 + k * 30, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    drawImg(F('set'), x + 90, top + 30, 90, { rot: Math.sin(t * 20) * 0.2 });
  }
  if (pose === 'khong-lo' && !own) {
    drawImg(F('co-bap'), x - baseH * 0.42, y - baseH * 0.35, baseH * 0.35, { flip: true, rot: Math.sin(t * 5) * 0.15 });
    drawImg(F('co-bap'), x + baseH * 0.42, y - baseH * 0.35, baseH * 0.35, { rot: -Math.sin(t * 5) * 0.15 });
  }
  if (pose === 'nhay') {
    drawImg(F('not-nhac'), x + Math.sin(t * 3) * 140, top + 20 + Math.cos(t * 3) * 30, 70);
    drawImg(F('lap-lanh'), x - Math.sin(t * 3) * 140, top + 40, 60);
  }
  if (pose === 'an' && p.food) {
    drawImg(IMG.own[p.food] || F(p.food), x + p.face * -baseH * 0.25, y - 10, 110);
  }
  if (pose === 'tam' && !own) drawImg(F('bot'), x, y - baseH * 0.15, baseH * 0.6, { sx: 1 + Math.sin(t * 6) * 0.08 });
  if (pose === 'buon') {
    // ruồi bay quanh
    for (let i = 0; i < 2; i++) drawImg(F('ruoi'), x + Math.cos(t * 4 + i * 3) * 100, top + 40 + Math.sin(t * 6 + i) * 30, 44, { anchor: 'center' });
    if (p.state === 'stink') drawImg(F('buon-non'), x + 70, top + 20, 80);
    else if (sulking) drawImg(F('mo-hoi'), x + 70, top + 30, 60);
  }
  // tên pet
  if (pose !== 'duoi-nuoc') outlined(ctx, petName(p.i), p.x, ground + p.z + 34, { size: p.i === 0 ? 30 : 24, color: '#fff', stroke: '#1d3b2a', lw: 7 });
  // vết bẩn khi đảo nhiều rác (chưa có ảnh "buon" riêng)
  if (pose === 'buon' && !own && p.state !== 'stink') {
    ctx.save();
    ctx.fillStyle = 'rgba(110,70,30,0.7)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(x + (hash(i + 2) - 0.5) * baseH * 0.6, y - baseH * (0.2 + hash(i + 7) * 0.5), 14 + hash(i) * 10, 10 + hash(i + 1) * 6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  // hướng dẫn streamer khi bị đóng băng / sét đánh
  if (p === mainPet() && (pose === 'dong-bang' || pose === 'dien')) {
    const left = pose === 'dong-bang' ? p.freezeHp : p.shockHp;
    const until = pose === 'dong-bang' ? p.frozenUntil : p.shockUntil;
    const total = (pose === 'dong-bang' ? config.freezeSeconds : config.shockSeconds) * 1000;
    pill(ctx, p.x - 260, top - 120, 520, 76, 'rgba(10,30,60,0.85)', pose === 'dong-bang' ? '#9fdcff' : '#ffe14d', 4);
    outlined(ctx, `⌨️ STREAMER GÕ PHÍM: còn ${Math.max(0, Math.ceil(left))} lần`, p.x, top - 92, { size: 28, color: '#fff', stroke: '#000', lw: 5 });
    bar(ctx, p.x - 220, top - 66, 440, 16, (until - now) / total, '#9fdcff', '#fff');
  }
}

function drawQtePet(t) {
  const p = mainPet();
  const name = petName();
  const { img, own } = petImage(p.kind, 'duoi-nuoc');
  if (event.kind === 'sea') {
    const x = 250 + Math.sin(t * 1.3) * 40;
    const y = 1560 + Math.sin(t * 3) * 10;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, y - (own ? 0 : 40));
    ctx.clip();
    drawImg(img, x, y + (own ? 60 : 30), own ? 280 : 230, { rot: Math.sin(t * 5) * 0.3 });
    ctx.restore();
    drawImg(F('song'), x - 90, y + 40, 110);
    drawImg(F('song'), x + 90, y + 40, 110, { flip: true });
    for (let i = 0; i < 3; i++) drawImg(F('giot'), x + Math.cos(t * 5 + i * 2) * 120, y - 120 - Math.abs(Math.sin(t * 5 + i)) * 60, 40);
    outlined(ctx, `${name} đang chới với!`, clamp(x, 230, 850), y - 200, { size: 30, color: '#fff', stroke: '#06345a', lw: 7 });
  } else {
    const x = 540 + Math.cos(t * 0.9) * 330;
    const y = 800 + Math.sin(t * 1.8) * 50;
    drawImg(own ? img : F(p.kind), x, y + 230, own ? 220 : 180, { rot: Math.sin(t * 4) * 0.25, flip: Math.sin(t * 0.9) > 0 });
    drawImg(F('dai-bang'), x, y + 70, 220, { flip: Math.sin(t * 0.9) < 0, sy: 1 + Math.sin(t * 12) * 0.08 });
    outlined(ctx, `${name} bị tha đi!`, x, y - 170, { size: 30, color: '#fff', stroke: '#5a1a00', lw: 7 });
  }
}

function drawHouse() {
  const own = IMG.houses[houseLevel - 1];
  const img = own || F(`nha-${houseLevel}`);
  const sh = houseShake > 0 ? Math.sin(now / 30) * 12 * houseShake : 0;
  const h = own ? 320 : 200 + houseLevel * 22;
  drawImg(img, houseX() + sh, GROUND_Y() + 10, h);
  // tiến độ xây
  const max = (config.houseWood || DEFAULTS.houseWood).length;
  const y = GROUND_Y() + 40;
  if (houseLevel < max) {
    const need = houseNeed(houseLevel);
    const prev = houseNeed(houseLevel - 1);
    bar(ctx, houseX() - 110, y, 220, 26, (wood - prev) / (need - prev), '#ffb84d', '#ffe066');
    outlined(ctx, `🪵 ${fmt(wood)}/${fmt(need)}`, houseX(), y + 13, { size: 20, color: '#fff', stroke: '#000', lw: 4 });
  } else outlined(ctx, '🏰 MAX', houseX(), y + 13, { size: 24, color: '#ffe066', stroke: '#000', lw: 5 });
}

function drawDecor(t) {
  const ground = GROUND_Y();
  // cây cối theo cấp đảo (khi chưa có ảnh đảo riêng thì thêm cây emoji)
  const decor = [
    ['cay-dua', 840, -10, 230, 1], ['tulip', 700, 40, 70, 1], ['huong-duong', 400, 50, 90, 2], ['cay', 960, 10, 170, 2],
    ['nam', 180, 50, 70, 3], ['dam-but', 620, 60, 70, 3], ['thong', 130, -10, 190, 4], ['da', 760, 60, 70, 4], ['cau-vong', 540, -380, 260, 5],
  ];
  for (const [n, x, z, h, lv] of decor) {
    if (islandLevel < lv) continue;
    if (IMG.islands[islandLevel - 1] && n !== 'cau-vong') continue;
    drawImg(F(n), x, ground + z, h, { rot: n.startsWith('cay') ? Math.sin(t + x) * 0.02 : 0 });
  }
  // bướm bay
  drawImg(F('buom'), 540 + Math.sin(t * 0.7) * 380, ground - 260 + Math.sin(t * 2.3) * 60, 56, { anchor: 'center', sx: 0.7 + Math.abs(Math.sin(t * 10)) * 0.3 });
}

function drawItems(t) {
  const ground = GROUND_Y();
  const items = [];
  for (const tr of trash) items.push({ z: tr.z, draw: () => {
    const y = tr.landed ? ground + tr.z : tr.y;
    const img = IMG.own[tr.kind] || F(tr.kind === 'phan' ? 'phan' : pick(['lon', 'bao', 'chuoi']));
    if (!tr.img) tr.img = tr.kind === 'phan' ? img : IMG.own.rac || F(['lon', 'bao', 'chuoi'][Math.floor(hash(tr.t0) * 3)]);
    drawImg(tr.img, tr.x, y, 76);
    if (tr.landed && tr.kind === 'phan') drawImg(F('ruoi'), tr.x + Math.cos(t * 5 + tr.x) * 40, y - 80 + Math.sin(t * 7 + tr.x) * 12, 30, { anchor: 'center' });
    if (tr.by && now - tr.t0 < 6000) outlined(ctx, truncate(tr.by, 12), tr.x, y + 18, { size: 18, color: '#ffd9a8', stroke: '#3a2210', lw: 4 });
  } });
  for (const c of chests) items.push({ z: c.z, draw: () => {
    const y = c.landed ? ground + c.z : c.y;
    const own = c.opened ? IMG.own['ruong-mo'] : c.dragon ? IMG.own['ruong-rong'] || IMG.own.ruong : IMG.own.ruong;
    const h = c.dragon ? 150 : 96;
    if (c.opened) {
      const k = (now - c.openAt) / 2500;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      if (own) drawImg(own, c.x, y, h);
      else drawImg(F('tui-vang'), c.x, y - k * 60, h);
      ctx.restore();
      return;
    }
    // ánh sáng gợi ý bấm
    if (c.landed) {
      const glow = ctx.createRadialGradient(c.x, y - h / 2, 5, c.x, y - h / 2, h);
      glow.addColorStop(0, c.dragon ? 'rgba(255,120,40,0.7)' : 'rgba(255,240,120,0.6)');
      glow.addColorStop(1, 'rgba(255,240,120,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(c.x - h, y - h * 1.5, h * 2, h * 2);
    }
    const wob = c.landed ? Math.sin(t * 8 + c.x) * 0.06 : 0;
    drawImg(own || F('ruong'), c.x, y, h, { rot: wob });
    if (c.dragon && !own) drawImg(F('rong'), c.x, y - h + 10, 80);
    if (!c.landed) drawImg(F('thien-thach'), c.x + 30, y - h, 90, { rot: -0.6 });
    if (c.landed) outlined(ctx, truncate(c.by, 12), c.x, y + 18, { size: 18, color: '#fff', stroke: '#0c2a4a', lw: 4 });
  } });
  for (const b of balls) items.push({ z: b.z, draw: () => drawImg(F('bong'), b.x, b.y + 20, 56, { rot: b.x / 30 }) });
  for (const p of pets) items.push({ z: 500 + p.z, pet: true, draw: () => (event?.type === 'qte' && p === mainPet() ? null : drawPet(p, t)) });
  for (const p of onIsland()) items.push({ z: p.z, draw: () => drawPerson(p, t) });
  items.sort((a, b) => a.z - b.z);
  for (const it of items) it.draw();
}

function drawPerson(p, t) {
  const ground = GROUND_Y();
  const hop = Math.abs(Math.sin(p.hop)) * 12;
  const x = p.x;
  const y = ground + p.z - hop;
  const r = 30;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, ground + p.z, 24, 7, 0, 0, TAU);
  ctx.fill();
  // thân + chân
  ctx.fillStyle = colorFor(p.id);
  rr(ctx, x - 18, y - 46, 36, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#2b2b3a';
  ctx.fillRect(x - 14, y - 14, 10, 14 + hop * 0.3);
  ctx.fillRect(x + 4, y - 14, 10, 14 - hop * 0.3);
  const topSharer = topBy('shares', 1)[0];
  const vice = topBy('chats', 1)[0];
  const ring = topSharer === p ? '#ffd34d' : vice === p ? '#ff9de2' : '#fff';
  drawAvatar(x, y - 46 - r + 6, r, p.user, ring, 4);
  if (topSharer === p) drawImg(F('vuong-mien'), x, y - 46 - r * 2 + 8, 52);
  outlined(ctx, truncate(p.user.name, 10), x, y + 12, { size: 18, color: '#fff', stroke: '#1a2a40', lw: 4 });
  if (p.bubble && now < p.bubble.until) {
    ctx.font = `700 22px ${FONT}`;
    const w = Math.min(320, ctx.measureText(p.bubble.text).width + 30);
    const bx = clamp(x - w / 2, 10, W - w - 10);
    const by = y - 46 - r * 2 - 56;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    rr(ctx, bx, by, w, 42, 18);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 8, by + 42);
    ctx.lineTo(x + 8, by + 42);
    ctx.lineTo(x, by + 54);
    ctx.fill();
    ctx.fillStyle = '#1a2a40';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.bubble.text, bx + w / 2, by + 22, w - 20);
  }
}

function drawBoss(t) {
  const e = event;
  const ground = GROUND_Y();
  const hit = now - e.hitAt < 160;
  const own = hit && IMG.bossHit[e.kind] ? IMG.bossHit[e.kind] : IMG.boss[e.kind];
  const img = own || F(`boss-${(e.kind % 3) + 1}`);
  const appear = clamp((now - e.start) / 1200, 0, 1);
  const x = e.x - e.lunge * 220 + (1 - appear) * 400;
  const h = own ? 460 : 380;
  ctx.save();
  if (hit) ctx.filter = 'brightness(2.2)';
  drawImg(img, x, ground + 20 + Math.sin(t * 3) * 6, h, { rot: Math.sin(t * 2) * 0.05 - e.lunge * 0.2 });
  ctx.restore();
  if (e.lunge > 0.5) drawImg(F('no'), houseX() + 80, ground - 120, 150, { anchor: 'center' });
  // thanh máu boss
  const y = 535;
  panel(ctx, 70, y, W - 140, 170, 30, 'rgba(60,0,10,0.78)', '#ff6b6b');
  outlined(ctx, '👹 BOSS PHÁ ĐẢO', W / 2, y + 36, { size: 38, color: '#ffdddd', stroke: '#5a0000', lw: 7 });
  bar(ctx, 110, y + 64, W - 220, 44, e.hp / e.max, '#ff3b3b', '#ff9a3d');
  outlined(ctx, `${fmt(Math.max(0, e.hp))} / ${fmt(e.max)} máu`, W / 2, y + 86, { size: 26, color: '#fff', stroke: '#000', lw: 5 });
  const left = Math.max(0, Math.ceil((e.until - now) / 1000));
  outlined(ctx, `⏱ ${left}s · Thả tim, gõ "danh" để đánh! Quà nhỏ = vũ khí`, W / 2, y + 140, { size: 26, color: '#ffe066', stroke: '#000', lw: 5 });
}

function drawQteBanner(t) {
  const e = event;
  const y = 535;
  const pulse = 1 + Math.sin(t * 10) * 0.03;
  ctx.save();
  ctx.translate(W / 2, y + 85);
  ctx.scale(pulse, pulse);
  panel(ctx, -480, -85, 960, 210, 34, 'rgba(120,10,10,0.85)', '#ffe066');
  outlined(ctx, `SPAM COMMENT "CUU" TRONG ${Math.max(0, Math.ceil((e.until - now) / 1000))} GIÂY`, 0, -38, { size: 40, color: '#ffe066', stroke: '#3a0000', lw: 8 });
  outlined(ctx, `ĐỂ CỨU ${petName().toUpperCase()}!`, 0, 14, { size: 46, color: '#fff', stroke: '#3a0000', lw: 8 });
  bar(ctx, -420, 52, 840, 48, e.count / e.goal, '#4dd0ff', '#8cff9e');
  outlined(ctx, `🛟 ${e.count} / ${e.goal}`, 0, 77, { size: 28, color: '#fff', stroke: '#000', lw: 5 });
  ctx.restore();
}

function drawVote(t) {
  const v = vote;
  const y = 535;
  panel(ctx, 70, y, W - 140, 180, 30, 'rgba(20,40,90,0.82)', '#9be7ff');
  outlined(ctx, `🍽️ BÌNH CHỌN CHO ${petName().toUpperCase()} ĂN · ${Math.max(0, Math.ceil((v.until - now) / 1000))}s`, W / 2, y + 34, { size: 32, color: '#fff', stroke: '#0a1a40', lw: 7 });
  const total = v.counts[0] + v.counts[1] || 1;
  [[v.a, v.ai, 0, 170, 'left'], [v.b, v.bi, 1, W - 170, 'right']].forEach(([name, icon, i, x, align]) => {
    drawImg(IMG.own[icon] || F(icon), x, y + 160, 96, { sy: 1 + Math.sin(t * 5 + i) * 0.04 });
    const tx = i ? x - 70 : x + 70;
    outlined(ctx, `Gõ ${i + 1}: ${name}`, tx, y + 88, { size: 30, align, color: '#ffe066', stroke: '#000', lw: 6 });
    outlined(ctx, `${v.counts[i]} phiếu`, tx, y + 124, { size: 26, align, color: '#fff', stroke: '#000', lw: 5 });
  });
  bar(ctx, 250, y + 140, W - 500, 26, v.counts[0] / total, '#ffb84d', '#ffe066', '#4dabf7');
}

function statIcon(name, x, y, s = 44) {
  drawImg(F(name), x, y, s, { anchor: 'center' });
}

function drawHud(t) {
  // tiêu đề
  outlined(ctx, config.title, W / 2, 62, { size: 74, color: '#ffe066', stroke: '#0b3a66', lw: 14 });
  outlined(ctx, `👑 ${config.bossName}: ${liveUser ? `@${liveUser}` : 'Streamer'}`, W / 2, 128, { size: 30, color: '#fff', stroke: '#0b3a66', lw: 7 });
  // bảng chỉ số
  panel(ctx, 30, 160, W - 60, 230, 30);
  const joyFace = joy > 60 ? '😊' : joy > 30 ? '😐' : joy > 0 ? '😟' : '💔';
  outlined(ctx, `${joyFace} HẠNH PHÚC`, 60, 200, { size: 28, align: 'left', color: '#fff', stroke: '#000', lw: 5 });
  bar(ctx, 300, 180, 680, 40, joy / 100, joy > 30 ? '#ff7aa8' : '#ff3b3b', joy > 30 ? '#ffd0e0' : '#ff9a3d');
  outlined(ctx, `${Math.round(joy)}%`, 640, 201, { size: 24, color: '#fff', stroke: '#000', lw: 5 });
  outlined(ctx, '⚡ NĂNG LƯỢNG', 60, 256, { size: 28, align: 'left', color: '#fff', stroke: '#000', lw: 5 });
  bar(ctx, 300, 236, 680, 40, Math.min(1, energy / 100), '#4dd0ff', '#b6ff6b');
  outlined(ctx, `${Math.min(100, Math.round(energy))}% · đủ 100% = Vũ điệu ngáo`, 640, 257, { size: 22, color: '#fff', stroke: '#000', lw: 5 });
  // tài nguyên
  const items = [['go', fmt(wood)], ['vang', fmt(gold)], ['nha-1', `Nhà cấp ${houseLevel}`], ['cay-dua', `Đảo cấp ${islandLevel}`], ['tim', fmt(totalHearts)]];
  items.forEach(([icon, text], i) => {
    const x = 70 + i * 196;
    statIcon(icon, x, 336, 46);
    outlined(ctx, text, x + 30, 338, { size: 24, align: 'left', color: '#fff', stroke: '#000', lw: 5 });
  });
  // Phó Đảo Chủ (top comment) + top chia sẻ
  const vice = topBy('chats', 1)[0];
  panel(ctx, 30, 400, 500, 120, 26, 'rgba(90,20,80,0.72)', '#ff9de2');
  outlined(ctx, '🎖️ PHÓ ĐẢO CHỦ', 60, 428, { size: 24, align: 'left', color: '#ffc9f0', stroke: '#000', lw: 5 });
  if (vice) {
    drawAvatar(90, 480, 30, vice.user, '#ff9de2', 4);
    outlined(ctx, truncate(vice.user.name, 13), 136, 474, { size: 38, align: 'left', color: '#fff', stroke: '#5a0a4a', lw: 7 });
    outlined(ctx, `${vice.chats} bình luận`, 136, 504, { size: 18, align: 'left', color: '#ffc9f0', stroke: '#000', lw: 4 });
  } else outlined(ctx, 'Comment nhiều nhất để làm Phó Đảo Chủ', 60, 478, { size: 22, align: 'left', color: '#fff', stroke: '#000', lw: 4 });
  panel(ctx, 550, 400, 500, 120, 26, 'rgba(90,60,0,0.72)', '#ffd34d');
  outlined(ctx, '👑 TOP CHIA SẺ', 580, 428, { size: 24, align: 'left', color: '#ffe9a8', stroke: '#000', lw: 5 });
  const ts = topBy('shares', 3);
  if (!ts.length) outlined(ctx, 'Share để đội vương miện', 580, 478, { size: 22, align: 'left', color: '#fff', stroke: '#000', lw: 4 });
  ts.forEach((p, i) => {
    outlined(ctx, `${i + 1}. ${truncate(p.user.name, 14)}`, 580, 458 + i * 26, { size: 22, align: 'left', color: i ? '#fff' : '#ffe066', stroke: '#000', lw: 4 });
    outlined(ctx, `${p.shares}`, 1020, 458 + i * 26, { size: 22, align: 'right', color: '#ffe066', stroke: '#000', lw: 4 });
  });
  // mốc chia sẻ
  const m = nextMilestone();
  const prevShares = [...milestonesDone].reduce((a, b) => Math.max(a, b), 0);
  panel(ctx, 40, 1570, W - 80, 110, 28, 'rgba(10,40,70,0.78)', '#9be7ff');
  if (m) {
    const reward = m.pet ? `Mở khoá Pet mới` : `Nâng cấp Đảo cấp ${m.island}`;
    outlined(ctx, `📣 ${fmt(m.shares)} SHARES = ${reward.toUpperCase()}`, W / 2, 1600, { size: 28, color: '#fff', stroke: '#000', lw: 6 });
    bar(ctx, 80, 1624, W - 160, 38, (shares - prevShares) / (m.shares - prevShares), '#ffb84d', '#ffe066');
    outlined(ctx, `${fmt(shares)} / ${fmt(m.shares)} lượt chia sẻ`, W / 2, 1643, { size: 22, color: '#fff', stroke: '#000', lw: 5 });
  } else outlined(ctx, `📣 ${fmt(shares)} lượt chia sẻ · đã mở hết mốc!`, W / 2, 1625, { size: 30, color: '#ffe066', stroke: '#000', lw: 6 });
  // lệnh
  const cmds = [['go', 'xay'], ['xa-phong', 'tam'], ['bong', 'choi'], ['bua', 'don'], ['ruong', 'share']];
  pill(ctx, 40, 1694, W - 80, 74, 'rgba(255,255,255,0.88)', '#0b3a66', 4);
  cmds.forEach(([icon, word], i) => {
    const x = 90 + i * 200;
    statIcon(icon, x, 1731, 46);
    outlined(ctx, word, x + 30, 1733, { size: 30, align: 'left', color: '#0b3a66', stroke: '#fff', lw: 4 });
  });
}

function drawToasts() {
  toasts.forEach((tt, i) => {
    const k = clamp((now - tt.t0) / 250, 0, 1) * clamp((tt.until - now) / 300, 0, 1);
    const y = event?.type === 'qte' ? 790 + i * 62 : 1520 - (toasts.length - 1 - i) * 62;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.font = `800 30px ${FONT}`;
    const tw = ctx.measureText(tt.text).width;
    const size = tw > W - 120 ? Math.floor((30 * (W - 120)) / tw) : 30;
    const w = Math.min(W - 40, (tw * size) / 30 + 60);
    pill(ctx, W / 2 - w / 2, y - 27, w, 54, 'rgba(0,0,0,0.68)', tt.color, 3);
    outlined(ctx, tt.text, W / 2, y, { size, weight: 800, color: tt.color, stroke: '#000', lw: 4 });
    ctx.restore();
  });
}

function drawParticles() {
  for (const q of particles) {
    const k = 1 - q.t / q.life;
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 1.5);
    if (q.img) drawImg(q.img, q.x, q.y, q.size * 2, { anchor: 'center', rot: q.heart ? 0 : q.rot });
    else if (q.rect) {
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.fillStyle = q.color;
      ctx.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2);
    } else {
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.size / 2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const b of bubbles) {
    const k = 1 - (now - b.t0) / 1800;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.fillStyle = 'rgba(200,240,255,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const f of floats) {
    const k = (now - f.t0) / 1800;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    const y = f.y - k * 90;
    if (f.img) drawImg(f.img, f.x - 40, y + 18, f.size, { anchor: 'bottom' });
    outlined(ctx, f.text, f.x + (f.img ? 10 : 0), y, { size: f.size, color: f.color, stroke: '#000', lw: 6 });
    ctx.restore();
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
  ctx.save();
  if (shakeScreen > 0) ctx.translate(Math.sin(now / 20) * 14 * shakeScreen, Math.cos(now / 27) * 9 * shakeScreen);
  drawBackground(gameTime);
  drawIslandBody();
  drawDecor(gameTime);
  drawHouse();
  if (event?.type === 'boss') drawBoss(gameTime);
  drawItems(gameTime);
  if (event?.type === 'qte') drawQtePet(gameTime);
  if (bolt && now - bolt.t0 < 600) {
    if (Math.floor((now - bolt.t0) / 80) % 2 === 0) drawBolt(ctx, bolt.x + 60, 0, mainPet().x, GROUND_Y() - 150, bolt.seed, 14);
  }
  drawParticles();
  ctx.restore();
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,255,230,${flash * 0.7})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawHud(gameTime);
  if (event?.type === 'qte') drawQteBanner(gameTime);
  else if (vote) drawVote(gameTime);
  drawToasts();
  if (audioBlocked) {
    pill(ctx, W / 2 - 260, 1800, 520, 70, 'rgba(0,0,0,0.75)', '#ffd34d');
    outlined(ctx, '🔇 Bấm vào game để bật tiếng', W / 2, 1836, { size: 30, color: '#ffd34d', stroke: '#000', lw: 4 });
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

const FLUENT = ['tho', 'vit', 'cho', 'nha-1', 'nha-2', 'nha-3', 'nha-4', 'nha-5', 'cay-dua', 'cay', 'thong', 'tulip', 'huong-duong', 'nam', 'da', 'dam-but',
  'go', 'vang', 'bong', 'bot', 'xa-phong', 'phan', 'lon', 'bao', 'chuoi', 'set', 'boss-1', 'boss-2', 'boss-3', 'dai-bang', 'co-bap', 'vuong-mien', 'lap-lanh',
  'tim', 'not-nhac', 'song', 'ruong', 'tui-vang', 'ruoi', 'no', 'bun-dau', 'sau-rieng', 'giot', 'buon-non', 'mo-hoi', 'cau-vong', 'dua', 'buom', 'rong', 'bua',
  'xuong', 'thien-thach'];
const POSES = ['dung', 'nhay', 'an', 'tam', 'choi', 'buon', 'dien', 'dong-bang', 'khong-lo', 'duoi-nuoc'];

async function boot() {
  try {
    const res = await fetch('/dao-linh-thu-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  config.petNames = { ...DEFAULTS.petNames, ...(config.petNames || {}) };
  joy = Number(config.joyStart) || 80;
  pets[0] = makePet(0);
  skyCanvas.clear = document.createElement('canvas');
  skyCanvas.storm = document.createElement('canvas');
  for (const [k, c] of Object.entries(skyCanvas)) {
    c.width = W;
    c.height = H;
    drawSky(c.getContext('2d'), k === 'storm');
  }
  for (let lv = 1; lv <= 5; lv++) IMG.islands[lv - 1] = null;
  const dir = String(config.imageFolder || 'assets/dao-linh-thu').replace(/\/$/, '');
  await Promise.all(FLUENT.map(async (n) => {
    IMG.f[n] = await loadImage(`assets/dao-linh-thu/fluent/${n}.png`);
  }));
  // ảnh tự thiết kế (không bắt buộc) trong public/assets/dao-linh-thu
  let have = null;
  try {
    const r = await fetch('/dao-linh-thu-images.json', { cache: 'no-store' });
    if (r.ok && dir === 'assets/dao-linh-thu') have = new Set((await r.json()).map((f) => f.toLowerCase()));
  } catch {
    /* không có máy chủ */
  }
  const first = async (...names) => {
    for (const n of names) {
      if (have && !have.has(n.toLowerCase())) continue;
      const img = await loadImage(`${dir}/${n}`);
      if (img) return n.endsWith('.jpg') ? img : chromaKey(img);
    }
    return null;
  };
  const png = (base) => [`${base}.png`, `${base}.webp`, `${base}.jpg`];
  if (params.get('img') !== '0') {
    IMG.bg = await first('nen.jpg', 'nen.png', 'nen.webp');
    IMG.bgStorm = await first('nen-bao.jpg', 'nen-bao.png');
    const one = await first(...png('dao'));
    for (let lv = 1; lv <= 5; lv++) IMG.islands[lv - 1] = (await first(...png(`dao-${lv}`))) || null;
    // thiếu cấp nào thì dùng cấp thấp hơn gần nhất
    for (let lv = 0; lv < 5; lv++) if (!IMG.islands[lv]) IMG.islands[lv] = (lv ? IMG.islands[lv - 1] : one) || null;
    for (const kind of ['vit', 'tho', 'cho']) {
      IMG.pets[kind] = {};
      for (const pose of POSES) {
        const img = await first(...png(`${kind}-${pose}`), ...(pose === 'dung' ? png(`${kind}-thuong`) : []));
        if (img) IMG.pets[kind][pose] = img;
      }
    }
    for (let i = 1; i <= 5; i++) IMG.houses[i - 1] = await first(...png(`nha-${i}`));
    for (let i = 1; i <= 3; i++) {
      const b = await first(...png(`boss-${i}`));
      if (b) {
        IMG.boss.push(b);
        IMG.bossHit.push(await first(...png(`boss-${i}-dau`)));
      }
    }
    for (const n of ['ruong', 'ruong-mo', 'ruong-rong', 'phan', 'rac', 'bun-dau', 'sau-rieng', 'chuoi', 'dua', 'xuong']) {
      const img = await first(...png(n));
      if (img) IMG.own[n] = img;
    }
  }
  // đảo vẽ bằng code cho các cấp còn thiếu
  for (let lv = 0; lv < 5; lv++) if (!IMG.islands[lv]) IMG.islands[lv] = drawIsland(lv + 1);
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
    const r = await fetch('/dao-linh-thu-music.json', { cache: 'no-store' });
    if (r.ok) files = [...(await r.json()), ...files];
  } catch {
    /* không có máy chủ */
  }
  const startAudio = () => {
    if (config.sound === false) return;
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
  nextQte = now + config.qteMinutes * 60000;
  nextVote = now + config.voteEverySeconds * 1000;
  connectWs();
  requestAnimationFrame((t) => {
    last = t;
    requestAnimationFrame(frame);
  });
}

window.__dao = {
  handleEvent,
  config: () => config,
  people,
  state: () => ({
    joy: Math.round(joy), energy: Math.round(energy), wood, houseLevel, gold, shares, islandLevel, pets: pets.map((p) => `${p.kind}:${petPose(p)}`),
    trash: trash.length, chests: chests.filter((c) => !c.opened).length, event: event && { type: event.type, hp: event.hp, count: event.count, goal: event.goal },
    vote: vote && vote.counts, sulking, vice: topBy('chats', 1)[0]?.user.name, topShare: topBy('shares', 1)[0]?.user.name,
  }),
  startQte,
  startVote,
  tap: streamerTap,
  openAll: () => chests.forEach((c) => c.landed && openChest(c)),
  setJoy: (v) => { joy = v; },
};
boot();
