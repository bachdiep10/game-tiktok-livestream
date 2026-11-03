// Game TikTok LIVE "Trà đá vỉa hè": người xem vào LIVE thành khách ngồi ghế nhựa ở quán trà đá.
// Bình luận để gọi đồ (trà đá, điếu cày, kẹo lạc...), chém gió với người bên cạnh,
// thả tim để uống trà, tặng quà để bao cả quán.
import {
  W, H, CURB_Y, ROAD_Y, FOOT_Y, SEATS, TABLES, VIP, STALL, JUG_TAP, OWNER_MOUTH,
  scaleAtY, drawStatic, drawCanopy, drawStool, drawBench, drawTable, drawUmbrella, drawStallFront,
  drawVipChair, drawMotorbike, drawTeaGlass, drawPipe, roundRectPath as rr,
} from './street.js';
import { lookFor, crowdLook, OWNER_LOOK, drawPerson } from './people.js';
import * as sfx from './teaAudio.js';
import * as voice from '../audio.js';

const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const FONT = '"Segoe UI", system-ui, sans-serif';

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  shopName: 'TRÀ ĐÁ VỈA HÈ',
  subtitle: 'Bình luận để gọi đồ • Thả tim để uống • Tặng quà để bao cả quán',
  backgroundImage: '',
  showUmbrella: true,
  showMotorbikes: true,
  showLeaves: true,
  ambientCrowd: 10,
  idleMinutes: 15,
  hypeMax: 200,
  giftTiers: { medium: 10, big: 100 },
  vipSeconds: 25,
  cameraZoom: 1.7,
  sound: true,
  music: true,
  musicVolume: 0.3,
  ambienceVolume: 0.12,
  voice: true,
  voiceLevel: 'vua',
  voiceGapSeconds: 12,
  voiceJoin: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-HoaiMyNeural',
  captions: true,
  narration: true,
  narrationSeconds: 50,
  commands: {
    lemon: ['trà chanh', 'trachanh'],
    drink: ['trà đá', 'trada', 'cốc trà', 'uống trà'],
    candy: ['kẹo lạc', 'keolac', 'kẹo vừng'],
    seeds: ['hướng dương', 'hạt dưa', 'cắn hạt'],
    pipe: ['điếu cày', 'dieucay', 'thuốc lào', 'rít điếu'],
    talk: ['chém gió', 'chemgio', 'tám chuyện', 'buôn chuyện'],
    chess: ['cờ tướng', 'đánh cờ', 'chơi cờ', 'ván cờ'],
    paper: ['đọc báo', 'xem báo'],
    fan: ['nóng quá', 'quạt'],
    toast: ['dzô', 'cụng ly', 'cạn ly', 'một hai ba', '123 dzo'],
    leave: ['tính tiền', 'về thôi', 'đi về'],
  },
  messages: {
    join: [
      'Mời {name} vào ngồi, làm cốc trà đá cho mát',
      '{name} đến rồi đấy à, kéo ghế ngồi đi',
      'Ơ {name}, lâu lắm mới thấy ra quán',
      'Chào {name}, hôm nay uống trà đá hay trà chanh',
    ],
    drink: ['Có ngay cốc trà đá cho {name}', 'Trà đá của {name} đây, nhiều đá luôn', 'Một trà đá cho {name}'],
    lemon: ['Trà chanh cho {name}, chua chua ngọt ngọt', 'Có ngay trà chanh cho {name}'],
    candy: ['Kẹo lạc cho {name} đây, giòn tan', 'Thanh kẹo lạc cho {name}'],
    seeds: ['Đĩa hướng dương cho {name}, cắn từ từ thôi', 'Hướng dương cho {name} đây'],
    pipe: ['Điếu cày đây {name}, rít nhẹ thôi kẻo say', 'Đưa điếu cho {name}, phê thì đừng có ngã'],
    talk: ['{name} với {other} lại chém gió rồi', 'Bàn {name} bắt đầu chém gió bay cả ô'],
    chess: ['{name} với {other} làm ván cờ tướng', 'Ván cờ giữa {name} và {other} bắt đầu'],
    paper: ['{name} đọc báo, có tin gì hay không', '{name} xem báo buổi sáng'],
    fan: ['Nóng quá thì quạt đi {name}', 'Cầm cái quạt nan mà quạt cho mát {name} ơi'],
    toast: ['Một hai ba dzô', 'Cả bàn cụng ly nào'],
    leave: ['Cảm ơn {name}, mai lại ra quán nhé', 'Tạm biệt {name}, về cẩn thận nhé'],
    follow: ['Cảm ơn {name} đã theo dõi, từ nay là khách quen của quán', '{name} thành khách quen rồi, tặng cái mũ cối'],
    share: ['Cảm ơn {name} đã rủ thêm bạn ra quán', '{name} vừa chia sẻ, quán càng đông càng vui'],
    gift: ['Cảm ơn {name} đã tặng {gift}, cô mời cả bàn kẹo lạc', '{name} tặng {gift}, quý hoá quá'],
    mediumGift: ['{name} tặng {gift}, bao cả quán một chầu trà đá', 'Cả quán ơi, {name} bao một chầu trà đá. Dzô'],
    bigGift: ['Đại gia {name} tặng {gift}, bao cả phố. Mời {name} lên ghế VIP', 'Ối giời ơi, {name} tặng {gift}. Mời đại gia ngồi ghế VIP'],
    hype: ['Quán đông như hội. Cả quán một hai ba dzô', 'Vui quá cả nhà ơi. Một hai ba dzô'],
    reminder: [
      'Bình luận trà đá để cô mang trà ra',
      'Ai muốn rít điếu cày thì bình luận điếu cày',
      'Bình luận chém gió để ngồi tán chuyện với người bên cạnh',
      'Thả tim để nhân vật của bạn uống trà',
      'Tặng quà để bao cả quán một chầu trà đá',
      'Bình luận cờ tướng để làm một ván với người bên cạnh',
      'Theo dõi kênh để thành khách quen, được tặng mũ cối',
      'Bình luận kẹo lạc hoặc hướng dương để có đồ nhâm nhi',
      'Bình luận dzô để cả bàn cụng ly',
    ],
  },
  chemGio: [
    'Hồi trẻ tôi bơi qua sông một mạch',
    'Con cá tôi câu hôm qua to bằng cái xe máy',
    'Sang năm tôi mua hẳn cái máy bay',
    'Tôi quen cả giám đốc ngân hàng đấy',
    'Đội tuyển mà có tôi đá thì vô địch lâu rồi',
    'Xe tôi đi trăm cây số hết nửa lít xăng',
    'Mai giá vàng chắc chắn lên, tin tôi đi',
    'Ngày xưa tôi đánh cờ thắng cả kỳ thủ',
    'Tôi ngủ ba tiếng là khoẻ cả ngày',
    'Nhà tôi có quả mít nặng một tạ',
    'Hồi đó tôi suýt thành ca sĩ nổi tiếng',
    'Tôi uống một lúc mười cốc trà đá chưa no',
    'Đất chỗ tôi vài năm nữa lên gấp chục lần',
    'Hôm qua tôi đi bộ từ đây lên tận Sapa',
    'Tôi nhìn trời là biết mai mưa hay nắng',
  ],
  chemGioReply: ['Thôi đi ông ơi 😂', 'Thật không đấy?', 'Ghê thế!', 'Lại chém gió rồi', 'Thế mà tôi còn hơn', 'Ối giời ơi', 'Nghe như phim ấy', 'Bay cả ô rồi 💨'],
  paperNews: [
    'Tin nóng: trà đá vẫn 3 nghìn!',
    'Mai nắng to, uống nhiều trà đá',
    'Phố mình sắp mở thêm quán trà chanh',
    'Đội nhà thắng đậm tối qua',
    'Giá rau hôm nay lại tăng',
  ],
};
let config = structuredClone(DEFAULTS);

const lastLine = {};
function line(kind, vars = {}) {
  const list = (config.messages && config.messages[kind]) || DEFAULTS.messages[kind] || [];
  if (!list.length) return '';
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastLine[kind]) i = (i + 1) % list.length;
  lastLine[kind] = i;
  return list[i].replace(/\{name\}/g, vars.name || '').replace(/\{other\}/g, vars.other || 'người bên cạnh').replace(/\{gift\}/g, vars.gift || 'quà');
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
  // ưu tiên cụm dài trước ("trà chanh" trước "trà")
  commandList.sort((a, b) => b.len - a.len);
}
function detectCommand(text) {
  const n = norm(text);
  for (const c of commandList) if (n.includes(c.key)) return c.act;
  // gõ dính liền không dấu: "tradaa", "dieucay"
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
const guests = new Map(); // khách thật (người xem)
let crowd = []; // khách không tên ngồi sẵn
let crowdSeq = 0;
const seatOwner = new Array(SEATS.length).fill(null);
const flights = []; // đồ bay từ quầy tới khách
const particles = [];
const toasts = [];
const bikes = [];
const owner = { act: 'idle', until: 0, bubble: null, mouthUntil: 0 };
let vip = null;
let vipUntil = 0;
const cam = { x: W / 2, y: H / 2, z: 1 };
let camFocusUntil = 0;
let hype = 0;
let partyUntil = 0;
let teaCount = 0;
let chemCount = 0;
let flash = 0;
let now = performance.now();

function allPeople() {
  return [...guests.values(), ...crowd];
}

function freeSeats() {
  const out = [];
  for (let i = 0; i < SEATS.length; i++) if (!seatOwner[i]) out.push(i);
  return out;
}

function takeSeat() {
  let free = freeSeats();
  if (!free.length) {
    // khách không tên nhường ghế cho người xem thật
    const c = crowd.find((x) => x.state === 'sit');
    if (c) {
      startLeave(c);
      free = freeSeats();
    }
  }
  if (!free.length) {
    // hết ghế: khách thật ngồi lâu không tương tác nhất phải về
    const idle = [...guests.values()].filter((g) => g.state === 'sit' && g !== vip).sort((a, b) => a.lastActive - b.lastActive)[0];
    if (idle) {
      startLeave(idle);
      free = freeSeats();
    }
  }
  if (!free.length) return -1;
  // ưu tiên hàng giữa cho dễ nhìn
  free.sort((a, b) => Math.abs(SEATS[a].y - 1300) - Math.abs(SEATS[b].y - 1300) + rand(-180, 180));
  return free[0];
}

function newPerson(id, look, real, user = null) {
  const seat = takeSeat();
  if (seat < 0) return null;
  const s = SEATS[seat];
  const p = {
    id, user, look, real, seat,
    x: s.x, y: s.y, state: 'sit', act: 'idle', actStart: 0, actUntil: 0,
    partner: null, bubble: null, likes: 0, coins: 0, comments: 0,
    lastActive: now, seed: Math.random() * 1000, hat: null, shades: false, dizzyUntil: 0,
    happyUntil: 0, nextIdle: now + rand(4000, 15000), fill: 0.8, joinedAt: now,
  };
  seatOwner[seat] = p;
  return p;
}

function walkTo(p, tx, ty, then) {
  p.state = 'walk';
  p.from = { x: p.x, y: p.y };
  p.to = { x: tx, y: ty };
  p.t0 = now;
  p.dur = clamp(Math.hypot(tx - p.x, ty - p.y) / 0.45, 700, 2600);
  p.then = then;
}

function ensureGuest(user, { walkIn = true, announceJoin = false } = {}) {
  let g = guests.get(user.id);
  if (g) {
    g.user = { ...g.user, ...user, avatar: user.avatar || g.user.avatar };
    g.lastActive = now;
    if (g.state === 'leave') {
      // đang về thì quay lại ghế
      const seat = takeSeat();
      if (seat >= 0) {
        g.seat = seat;
        seatOwner[seat] = g;
        walkTo(g, SEATS[seat].x, SEATS[seat].y, 'sit');
      }
    }
    return g;
  }
  g = newPerson(user.id, lookFor(user.id), true, user);
  if (!g) return null;
  guests.set(user.id, g);
  if (walkIn) {
    const s = SEATS[g.seat];
    const fromLeft = s.x < W / 2;
    g.x = fromLeft ? -60 : W + 60;
    g.y = clamp(s.y + rand(-20, 40), 900, CURB_Y - 10);
    walkTo(g, s.x, s.y, 'sit');
  }
  if (announceJoin) {
    addToast(`👋 ${truncate(user.name, 18)} vào quán`, '#ffe9a8');
    if (config.voiceJoin !== false) announce(line('join', { name: user.name }), 0);
    else announce(line('join', { name: user.name }), -1);
  }
  return g;
}

function startLeave(p) {
  if (p.state === 'leave') return;
  if (p.seat >= 0 && seatOwner[p.seat] === p) seatOwner[p.seat] = null;
  if (p === vip) vip = null;
  p.seat = -1;
  p.act = 'wave';
  p.actStart = now;
  p.actUntil = now + 900;
  p.partner = null;
  const toLeft = p.x < W / 2;
  setTimeout(() => walkTo(p, toLeft ? -80 : W + 80, clamp(p.y + rand(0, 60), 900, CURB_Y - 10), 'gone'), 600);
  p.state = 'leave';
}

function seatPos(p) {
  if (p === vip) return { x: VIP.x, y: VIP.y, s: VIP.s };
  const s = SEATS[p.seat];
  return s ? { x: s.x, y: s.y, s: s.s } : { x: p.x, y: p.y, s: scaleAtY(p.y) };
}

// người ngồi cạnh: cùng bàn, nếu không có thì người gần nhất
function neighborOf(p) {
  const s = SEATS[p.seat];
  if (s && s.table >= 0) {
    const other = TABLES[s.table].seats.find((id) => id !== p.seat);
    const o = seatOwner[other];
    if (o && o.state === 'sit') return o;
  }
  let best = null;
  let bd = 340;
  for (const o of allPeople()) {
    if (o === p || o.state !== 'sit' || o === vip) continue;
    const d = Math.hypot(o.x - p.x, (o.y - p.y) * 1.6);
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}

function nameOf(p) {
  return p.user ? p.user.name : 'bác bên cạnh';
}

function setAct(p, act, ms) {
  p.act = act;
  p.actStart = now;
  p.actUntil = now + ms;
  p.pipePuffed = false;
  p.lastSip = false;
}

function say(p, text, ms = 3200) {
  if (!p || !text) return;
  p.bubble = { text: truncate(text, 70), until: now + ms, born: now };
}

// ------------------------------------------------------------------ hiệu ứng
function headPos(p) {
  const sp = p.state === 'sit' ? seatPos(p) : { x: p.x, y: p.y, s: scaleAtY(p.y) };
  return { x: sp.x, y: sp.y - 150 * sp.s, s: sp.s };
}
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
function smoke(x, y, n, big = false) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'smoke', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-25, 45), vy: rand(-70, -30), life: rand(1600, 2600), size: rand(big ? 14 : 8, big ? 26 : 14) });
}
function bubblesUp(x, y, n) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'bubble', x: x + rand(-5, 5), y, vx: rand(-8, 8), vy: rand(-60, -30), life: rand(400, 800), size: rand(2, 4) });
}
function crumbs(x, y, n, color = '#c58a3a') {
  for (let i = 0; i < n; i++) addParticle({ kind: 'crumb', x, y, vx: rand(-60, 60), vy: rand(-80, 0), g: 500, life: 900, size: rand(1.5, 3), color });
}
function confetti(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(120, 420);
    addParticle({ kind: 'confetti', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, g: 420, life: rand(1400, 2200), size: rand(5, 9), color: pick(['#e53935', '#fdd835', '#43a047', '#1e88e5', '#ff7043', '#fff']), rot: rand(0, TAU), vr: rand(-8, 8) });
  }
}
function coinRain(n) {
  for (let i = 0; i < n; i++) addParticle({ kind: 'coin', x: rand(40, W - 40), y: rand(-200, 0), vx: rand(-20, 20), vy: rand(200, 420), g: 300, life: 3200, size: rand(10, 16), rot: rand(0, TAU), vr: rand(-6, 6) });
}
function windSwirl(x, y, s) {
  for (let i = 0; i < 2; i++) addParticle({ kind: 'wind', x: x + rand(-30, 30) * s, y: y + rand(-20, 20) * s, vx: rand(-40, 40), vy: rand(-50, -20), life: 1400, size: rand(14, 22) * s, rot: rand(0, TAU) });
}
function leafFall() {
  addParticle({ kind: 'leaf', x: rand(0, 420), y: rand(250, 480), vx: rand(10, 50), vy: rand(30, 60), life: 9000, size: rand(7, 11), rot: rand(0, TAU), vr: rand(-2, 2), color: pick(['#c0562b', '#e08a2e', '#7cb342', '#d4a017']) });
}
function addToast(text, color = '#fff') {
  toasts.push({ text, color, born: now });
  if (toasts.length > 4) toasts.shift();
}

// ------------------------------------------------------------------ đồ bay từ quầy
const ITEM_FOR = { drink: 'glass', lemon: 'lemon', candy: 'candy', seeds: 'seeds', pipe: 'pipe' };
function deliver(p, act, { delay = 0, quiet = false, ms } = {}) {
  owner.act = 'pour';
  owner.until = now + 900 + delay;
  flights.push({ item: ITEM_FOR[act] || 'glass', act, to: p, t0: now + delay, dur: 750, from: { x: JUG_TAP.x, y: JUG_TAP.y - 20 }, quiet, ms });
  if (!quiet) {
    if (act === 'drink' || act === 'lemon') sfx.pour(0.6);
    else sfx.whoosh();
  }
}
function actDuration(act) {
  return { drink: 6500, lemon: 6500, candy: 5200, seeds: 6500, pipe: 5200, talk: 10000, chess: 12000, paper: 8000, fan: 6000, toast: 2600 }[act] || 4000;
}
function arrive(f) {
  const p = f.to;
  if (!p || p.state === 'leave') return;
  setAct(p, f.act, f.ms || actDuration(f.act));
  p.fill = 0.9;
  if (!f.quiet) {
    if (f.act === 'drink' || f.act === 'lemon') sfx.clink();
    if (f.act === 'pipe') sfx.bubble(2.4);
  }
  if (f.act === 'drink' || f.act === 'lemon') teaCount++;
}

// ------------------------------------------------------------------ lời dẫn (bà chủ quán)
const captions = [];
let lastAnnounce = performance.now();
let lastSpoken = -1e9;
// priority: -1 chỉ hiện chữ, 0 chào hỏi/gọi đồ, 1 quà/theo dõi, 2 quà lớn
function announce(text, priority = 0, force = false) {
  if (!text) return;
  lastAnnounce = performance.now();
  const level = { it: 2, vua: 1, nhieu: 0 }[config.voiceLevel] ?? 1;
  const gap = Math.max(0, Number(config.voiceGapSeconds ?? 12)) * 1000;
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

// ------------------------------------------------------------------ lệnh bình luận
function runCommand(g, act) {
  const name = g.user.name;
  switch (act) {
    case 'drink':
    case 'lemon':
    case 'candy':
    case 'seeds':
    case 'pipe':
      deliver(g, act);
      say(g, { drink: 'Cô ơi cho cốc trà đá!', lemon: 'Cô ơi trà chanh!', candy: 'Cho cháu thanh kẹo lạc', seeds: 'Cho đĩa hướng dương cô ơi', pipe: 'Cho rít điếu cày phát!' }[act], 2200);
      announce(line(act, { name }), 0);
      break;
    case 'talk': {
      const o = neighborOf(g);
      startChat(g, o);
      chemCount++;
      announce(line('talk', { name, other: o ? nameOf(o) : 'cô chủ quán' }), 0);
      break;
    }
    case 'chess': {
      const o = neighborOf(g);
      if (!o) {
        say(g, 'Ai làm ván cờ không?', 3000);
        break;
      }
      startChess(g, o);
      announce(line('chess', { name, other: nameOf(o) }), 0);
      break;
    }
    case 'paper':
      setAct(g, 'paper', actDuration('paper'));
      sfx.paper();
      setTimeout(() => say(g, pick(config.paperNews || DEFAULTS.paperNews), 3500), 900);
      announce(line('paper', { name }), -1);
      break;
    case 'fan':
      setAct(g, 'fan', actDuration('fan'));
      say(g, 'Nóng quá trời ơi!', 2500);
      announce(line('fan', { name }), -1);
      break;
    case 'toast':
      tableToast(g);
      announce(line('toast', { name }), -1);
      break;
    case 'leave': {
      say(g, 'Cô ơi tính tiền!', 2200);
      const h = headPos(g);
      flights.push({ item: 'money', to: null, toXY: { x: OWNER_MOUTH.x, y: OWNER_MOUTH.y + 40 }, from: { x: h.x, y: h.y + 40 }, t0: now, dur: 700 });
      sfx.coins();
      sayOwner('Cảm ơn nhé, mai lại ra!');
      announce(line('leave', { name }), -1);
      setTimeout(() => startLeave(g), 1200);
      break;
    }
    default:
      break;
  }
}

function startChat(a, b) {
  setAct(a, 'talk', actDuration('talk'));
  a.partner = b;
  sfx.wind();
  const lines = [...(config.chemGio || DEFAULTS.chemGio)].sort(() => Math.random() - 0.5);
  const replies = config.chemGioReply || DEFAULTS.chemGioReply;
  if (b) {
    setAct(b, 'talk', actDuration('talk'));
    b.partner = a;
    say(a, lines[0], 2600);
    setTimeout(() => say(b, pick(replies), 2200), 2400);
    setTimeout(() => say(a, lines[1], 2600), 4600);
    setTimeout(() => say(b, lines[2], 2600), 7000);
  } else {
    say(a, lines[0], 2800);
    setTimeout(() => sayOwner(pick(replies)), 2600);
    setTimeout(() => say(a, lines[1], 2800), 5000);
  }
}

function startChess(a, b) {
  setAct(a, 'chess', actDuration('chess'));
  setAct(b, 'chess', actDuration('chess'));
  a.partner = b;
  b.partner = a;
  a.chessWith = b;
  say(a, 'Làm ván cờ nào!', 2200);
  setTimeout(() => say(b, 'Chơi luôn!', 2000), 1500);
  const [win, lose] = Math.random() < 0.5 ? [a, b] : [b, a];
  setTimeout(() => {
    if (win.act !== 'chess') return;
    say(win, 'Chiếu tướng! Hết cờ!', 2600);
    sfx.chessTap();
    sparks(headPos(win).x, headPos(win).y - 20, 18);
    setTimeout(() => say(lose, 'Ván nữa! Ván nữa!', 2200), 900);
  }, actDuration('chess') - 3200);
}

function tableToast(g) {
  const group = [g];
  const n = neighborOf(g);
  if (n) group.push(n);
  for (const o of allPeople()) {
    if (group.length >= 6) break;
    if (!group.includes(o) && o.state === 'sit' && Math.hypot(o.x - g.x, o.y - g.y) < 230) group.push(o);
  }
  group.forEach((o, i) => {
    setAct(o, 'toast', actDuration('toast'));
    o.happyUntil = now + 2600;
    setTimeout(() => say(o, pick(['Dzô!', 'Dzô dzô!', '1 2 3 dzô!', 'Cạn ly!']), 1600), i * 120);
  });
  sfx.cheer();
  confetti(g.x, g.y - 160 * seatPos(g).s, 24);
}

function partyToast(withGlasses = true) {
  // cả quán cụng ly
  let i = 0;
  for (const o of allPeople()) {
    if (o.state !== 'sit') continue;
    const delay = (i++ % 40) * 60;
    if (withGlasses) setTimeout(() => setAct(o, 'toast', 3000), delay);
    else setAct(o, 'toast', 3000);
    o.happyUntil = now + 3500;
    if (Math.random() < 0.3) setTimeout(() => say(o, pick(['Dzô!', 'Dzô dzô!', '1 2 3 dzô!', 'Cạn!']), 1600), delay + 300);
  }
  sfx.cheer();
  partyUntil = now + 3500;
}

function rollAll(act) {
  // bao cả quán: mỗi người một cốc
  let i = 0;
  for (const o of allPeople()) {
    if (o.state !== 'sit' || i > 45) continue;
    deliver(o, act, { delay: i * 70, quiet: i > 0, ms: 3200 });
    i++;
  }
  sfx.pour(1.2);
  setTimeout(() => partyToast(), i * 70 + 1100);
}

function sayOwner(text, ms = 2600) {
  owner.bubble = { text: truncate(text, 70), until: now + ms, born: now };
  owner.mouthUntil = now + Math.min(ms, 2200);
}

// ------------------------------------------------------------------ sự kiện TikTok
function addHype(v) {
  hype += v;
  const max = Math.max(20, Number(config.hypeMax) || 200);
  if (hype >= max) {
    hype = 0;
    announce(line('hype'), 1);
    addToast('🎉 QUÁN ĐÔNG NHƯ HỘI! 1 2 3 DZÔ!', '#ffd54a');
    confetti(W / 2, 900, 120);
    flash = 0.5;
    partyToast(false);
  }
}

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
      const fresh = !guests.has(user.id);
      const g = ensureGuest(user);
      if (!g) break;
      const text = String(ev.text || '').trim();
      g.comments++;
      addHype(2);
      const act = detectCommand(text);
      if (act) {
        // vừa vào thì chờ ngồi xuống rồi mới làm
        const delay = g.state === 'walk' ? Math.max(0, g.t0 + g.dur - now) + 100 : 0;
        setTimeout(() => runCommand(g, act), delay);
      } else if (text) {
        say(g, text, 5000);
      }
      if (fresh) addToast(`👋 ${truncate(user.name, 18)} vào quán`, '#ffe9a8');
      break;
    }
    case 'like': {
      if (!user) break;
      const g = ensureGuest(user);
      if (!g) break;
      const n = clamp(Number(ev.count) || 1, 1, 100);
      g.likes += n;
      if (g.state === 'sit' && (g.act === 'idle' || now > g.actUntil)) {
        setAct(g, 'drink', 2600);
        g.fill = 0.7;
      }
      const h = headPos(g);
      hearts(h.x, h.y - 30 * h.s, Math.min(6, n));
      sfx.pop();
      if (n >= 5) sfx.gulp();
      addHype(n);
      break;
    }
    case 'follow': {
      if (!user) break;
      const g = ensureGuest(user);
      if (!g) break;
      g.hat = 'helmet';
      g.happyUntil = now + 3000;
      const h = headPos(g);
      sparks(h.x, h.y - 30, 30);
      sfx.sparkle();
      addToast(`⭐ ${truncate(user.name, 18)} thành khách quen`, '#ffd54a');
      say(g, 'Từ nay em là khách quen!', 2600);
      announce(line('follow', { name: user.name }), 1);
      addHype(10);
      break;
    }
    case 'share': {
      if (!user) break;
      const g = ensureGuest(user);
      if (!g) break;
      const h = headPos(g);
      confetti(h.x, h.y, 30);
      sfx.sparkle();
      addToast(`📣 ${truncate(user.name, 18)} rủ bạn ra quán`, '#7cf7ff');
      announce(line('share', { name: user.name }), 0);
      addHype(10);
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
      g.lastActive = now;
      g.happyUntil = now + 4000;
      addHype(coinsN * 3);
      const tiers = { ...DEFAULTS.giftTiers, ...(config.giftTiers || {}) };
      const h = headPos(g);
      const later = g.state === 'walk' ? Math.max(0, g.t0 + g.dur - now) + 100 : 0;
      if (coinsN >= tiers.big) {
        addToast(`💎 ${truncate(user.name, 16)} tặng ${truncate(giftLabel, 18)}`, '#ffd54a');
        announce(line('bigGift', { name: user.name, gift: giftLabel }), 2, true);
        sfx.fanfare();
        coinRain(80);
        confetti(W / 2, 700, 160);
        flash = 0.8;
        setTimeout(() => makeVip(g), later);
        setTimeout(() => rollAll('drink'), later + 1800);
        // đoàn xe máy bấm còi chúc mừng
        for (let i = 0; i < 4; i++) setTimeout(() => spawnBike(true), i * 450);
      } else if (coinsN >= tiers.medium) {
        addToast(`🎁 ${truncate(user.name, 16)} bao cả quán`, '#ff9de2');
        announce(line('mediumGift', { name: user.name, gift: giftLabel }), 1);
        sfx.sparkle();
        confetti(h.x, h.y, 50);
        say(g, 'Cả quán uống đi, em bao!', 3000);
        setTimeout(() => rollAll('drink'), later);
      } else {
        addToast(`🎁 ${truncate(user.name, 16)} tặng ${truncate(giftLabel, 18)}`, '#ffe9a8');
        announce(line('gift', { name: user.name, gift: giftLabel }), 1);
        sfx.sparkle();
        sparks(h.x, h.y, 22);
        setTimeout(() => {
          deliver(g, 'candy');
          const n = neighborOf(g);
          if (n) deliver(n, 'candy', { delay: 250, quiet: true });
        }, later);
      }
      break;
    }
    case 'voiceTest':
      announce('Xin chào cả nhà. Mời mọi người ra quán làm cốc trà đá cho mát. Bình luận trà đá để cô mang ra nhé', 2, true);
      break;
    case 'reset':
      for (const g of guests.values()) if (g.seat >= 0) seatOwner[g.seat] = null;
      guests.clear();
      vip = null;
      flights.length = 0;
      particles.length = 0;
      hype = 0;
      teaCount = 0;
      chemCount = 0;
      break;
    default:
      break;
  }
}

function makeVip(g) {
  if (!g || g.state === 'leave') return;
  if (vip && vip !== g) returnFromVip(vip);
  // giữ lại ghế cũ, lên ghế VIP
  if (g.seat >= 0) seatOwner[g.seat] = null;
  g.seat = -1;
  vip = g;
  vipUntil = now + (Number(config.vipSeconds) || 25) * 1000;
  g.hat = 'crown';
  g.shades = true;
  walkTo(g, VIP.x, VIP.y, 'sit');
  camFocusUntil = now + 5500;
  setTimeout(() => {
    if (vip === g) {
      setAct(g, 'toast', 3000);
      say(g, 'Hôm nay tôi bao cả phố!', 3200);
      sparks(VIP.x, VIP.y - 180, 40);
    }
  }, g.dur || 1200);
}

function returnFromVip(g) {
  if (vip === g) vip = null;
  g.shades = false;
  const seat = takeSeat();
  if (seat < 0) {
    startLeave(g);
    return;
  }
  g.seat = seat;
  seatOwner[seat] = g;
  walkTo(g, SEATS[seat].x, SEATS[seat].y, 'sit');
}

// ------------------------------------------------------------------ xe máy qua đường
const BIKE_COLORS = ['#d32f2f', '#1976d2', '#f5f5f5', '#212121', '#fbc02d', '#7b1fa2', '#388e3c', '#9e9e9e'];
function spawnBike(celebrate = false) {
  if (config.showMotorbikes === false) return;
  const dir = Math.random() < 0.5 ? 1 : -1;
  const lane = dir > 0 ? ROAD_Y + 112 : ROAD_Y + 70;
  bikes.push({
    x: dir > 0 ? -120 : W + 120, y: lane, dir, s: dir > 0 ? 0.95 : 0.85,
    speed: rand(260, 420) * (celebrate ? 1.2 : 1), color: pick(BIKE_COLORS), helmet: pick(BIKE_COLORS), shirt: pick(['#455a64', '#8d6e63', '#1e88e5', '#e53935', '#43a047', '#fdd835']),
    seed: Math.random() * 10, cargo: !celebrate && Math.random() < 0.25 ? pick(['#eeeeee', '#a1887f', '#90caf9']) : null,
    honked: false, celebrate,
  });
}

// ------------------------------------------------------------------ khách không tên
function refillCrowd() {
  const target = Math.max(0, (Number(config.ambientCrowd) || 0) - guests.size);
  const alive = crowd.filter((c) => c.state !== 'leave');
  if (alive.length < target && freeSeats().length > 4) {
    const c = newPerson(`crowd-${crowdSeq}`, crowdLook(crowdSeq++), false);
    if (c) {
      const s = SEATS[c.seat];
      c.x = s.x < W / 2 ? -60 : W + 60;
      walkTo(c, s.x, s.y, 'sit');
      crowd.push(c);
    }
  } else if (alive.length > target && alive.length) {
    startLeave(alive[0]);
  }
}

// ------------------------------------------------------------------ cập nhật
function update(dt) {
  const idleMs = Math.max(1, Number(config.idleMinutes) || 15) * 60000;
  for (const p of allPeople()) {
    if (p.state === 'walk' || p.state === 'leave') {
      if (p.to && now >= p.t0) {
        const k = clamp((now - p.t0) / p.dur, 0, 1);
        p.x = lerp(p.from.x, p.to.x, k);
        p.y = lerp(p.from.y, p.to.y, k);
        p.walkPhase = (now - p.t0) * 0.012;
        if (k >= 1) {
          if (p.then === 'gone') {
            p.gone = true;
          } else {
            p.state = 'sit';
            p.to = null;
            sfx.pop();
          }
        }
      }
      continue;
    }
    // hành động hết giờ
    if (p.act !== 'idle' && now > p.actUntil) {
      if (p.act === 'pipe' && !p.pipePuffed) {
        p.pipePuffed = true;
      }
      p.act = 'idle';
      p.partner = null;
    }
    // rít điếu cày xong thì phả khói, mắt xoay vì say
    if (p.act === 'pipe') {
      const k = (now - p.actStart) / (p.actUntil - p.actStart);
      const h = headPos(p);
      if (k < 0.65 && Math.random() < 0.5) bubblesUp(h.x + 28 * h.s, p.y - 40 * h.s, 1);
      if (k >= 0.65 && !p.pipePuffed) {
        p.pipePuffed = true;
        smoke(h.x, h.y + 10 * h.s, 18, true);
        if (p.real) {
          sfx.puff();
          p.dizzyUntil = now + 2600;
          setTimeout(() => say(p, pick(['Phê quá!', 'Ê ê… say rồi 😵', 'Đã! Đã!', 'Trời đất quay cuồng']), 2200), 300);
        }
      }
    }
    if ((p.act === 'drink' || p.act === 'lemon') && p.real) {
      const k = (now - p.actStart) / Math.max(1, p.actUntil - p.actStart);
      const sip = (k * 3) % 1 < 0.45;
      if (sip && !p.lastSip) {
        sfx.gulp();
        p.fill = Math.max(0.15, p.fill - 0.22);
      }
      p.lastSip = sip;
    }
    if ((p.act === 'candy' || p.act === 'seeds') && Math.random() < dt * 3) {
      const h = headPos(p);
      if (p.act === 'candy') {
        crumbs(h.x + 6 * h.s, h.y + 22 * h.s, 2);
        if (p.real) sfx.crunch();
      } else {
        crumbs(h.x + 6 * h.s, h.y + 22 * h.s, 2, '#2b2b2b');
        if (p.real) sfx.crack();
      }
    }
    if (p.act === 'talk' && Math.random() < dt * 2.5) {
      const h = headPos(p);
      windSwirl(h.x + (p.partner ? Math.sign(p.partner.x - p.x) * 40 * h.s : 0), h.y, h.s);
    }
    if (p.act === 'chess' && Math.random() < dt * 0.8 && p.real) sfx.chessTap();
    // khách tự làm vài động tác cho quán sinh động
    if (p.act === 'idle' && now > p.nextIdle && p.state === 'sit') {
      p.nextIdle = now + rand(p.real ? 9000 : 6000, p.real ? 22000 : 16000);
      const r = Math.random();
      const act = r < 0.5 ? 'drink' : r < 0.65 ? 'fan' : r < 0.78 ? 'seeds' : r < 0.9 ? 'paper' : 'candy';
      setAct(p, act, rand(2500, 4500));
      p.fill = rand(0.3, 0.8);
    }
    if (p.real && p !== vip && now - p.lastActive > idleMs) startLeave(p);
  }
  for (const [id, g] of guests) if (g.gone) guests.delete(id);
  crowd = crowd.filter((c) => !c.gone);
  if (vip && now > vipUntil) returnFromVip(vip);

  // đồ bay
  for (let i = flights.length - 1; i >= 0; i--) {
    const f = flights[i];
    if (now >= f.t0 + f.dur) {
      flights.splice(i, 1);
      if (f.to) arrive(f);
    }
  }
  // hạt
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (now - p.born > p.life) {
      particles.splice(i, 1);
      continue;
    }
    p.vy += (p.g || 0) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.vr) p.rot += p.vr * dt;
    if (p.kind === 'leaf') {
      p.x += Math.sin((now - p.born) * 0.003) * 0.8;
      if (p.y > 1600) p.vy = 0;
    }
    if (p.kind === 'smoke') p.size += dt * 12;
  }
  // xe máy
  for (let i = bikes.length - 1; i >= 0; i--) {
    const b = bikes[i];
    b.x += b.dir * b.speed * dt;
    if (!b.honked && b.x > 200 && b.x < W - 200 && (b.celebrate || Math.random() < 0.002)) {
      b.honked = true;
      sfx.honk(!b.celebrate);
    }
    if (b.x < -200 || b.x > W + 200) bikes.splice(i, 1);
  }
  // camera
  let tx = W / 2;
  let ty = H / 2;
  let tz = 1;
  if (vip && now < camFocusUntil) {
    tz = Math.max(1, Number(config.cameraZoom) || 1.7);
    tx = clamp(vip.x, W / (2 * tz), W - W / (2 * tz));
    ty = clamp(vip.y - 120, H / (2 * tz), H - H / (2 * tz));
  }
  const ck = 1 - Math.exp(-dt * 3);
  cam.x = lerp(cam.x, tx, ck);
  cam.y = lerp(cam.y, ty, ck);
  cam.z = lerp(cam.z, tz, ck);
  flash = Math.max(0, flash - dt * 1.5);
  if (owner.act !== 'idle' && now > owner.until) owner.act = 'idle';
}

// ------------------------------------------------------------------ vẽ
function personParams(p) {
  const sitting = p.state === 'sit';
  const t = now + p.seed * 1000;
  const k = p.act !== 'idle' ? clamp((now - p.actStart) / Math.max(1, p.actUntil - p.actStart), 0, 1) : 0;
  const talking = p.bubble && now < p.bubble.until && now - p.bubble.born < 2200;
  return {
    sit: sitting,
    act: sitting ? (p.act === 'pipe' && p.pipePuffed ? 'idle' : p.act) : p.state === 'leave' && p.act === 'wave' && now < p.actUntil ? 'wave' : 'walk',
    k, t,
    lean: p.partner ? Math.sign(p.partner.x - p.x) * 0.8 : 0,
    mouth: talking || p.act === 'toast' ? Math.abs(Math.sin(t * 0.025)) : p.act === 'candy' || p.act === 'seeds' ? Math.abs(Math.sin(t * 0.03)) * 0.5 : 0,
    blink: (t % 4200) < 130,
    walk: p.walkPhase || 0,
    dizzy: now < p.dizzyUntil,
    happy: now < p.happyUntil,
    hat: p.hat,
    shades: p.shades,
    fill: p.fill,
    seed: p.seed,
  };
}

function drawPersonAt(p) {
  const sitting = p.state === 'sit';
  const sp = sitting ? seatPos(p) : { x: p.x, y: p.y, s: scaleAtY(p.y) };
  ctx.save();
  ctx.translate(sp.x, sp.y - (p === vip && sitting ? 18 * sp.s : 0));
  ctx.scale(sp.s, sp.s);
  drawPerson(ctx, p.look, personParams(p));
  ctx.restore();
}

function drawTag(p) {
  if (!p.real || !p.user) return;
  const sitting = p.state === 'sit';
  const sp = sitting ? seatPos(p) : { x: p.x, y: p.y, s: scaleAtY(p.y) };
  const s = Math.max(0.62, sp.s);
  const top = sp.y - (sitting ? 182 : 196) * sp.s - (p.hat ? 16 * sp.s : 0) - (p === vip ? 18 * sp.s : 0);
  const name = truncate(p.user.name, 14);
  const fs = Math.round(17 * s);
  ctx.font = `700 ${fs}px ${FONT}`;
  const tw = ctx.measureText(name).width;
  const r = 11 * s;
  const w = tw + r * 2 + 16 * s;
  const h = 26 * s;
  const x = sp.x - w / 2;
  const y = top - h;
  ctx.fillStyle = p === vip ? 'rgba(120,80,0,0.85)' : 'rgba(30,20,10,0.72)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (p.hat === 'helmet') {
    ctx.strokeStyle = '#c5d86d';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  drawAvatar(x + r + 2 * s, y + h / 2, r, p.user, p.look.shirt);
  ctx.fillStyle = p === vip ? '#ffe082' : '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + r * 2 + 8 * s, y + h / 2 + 1);
}

function drawBubbleAt(x, bottomY, text, s, born, color = '#fff') {
  const fs = Math.round(clamp(20 * s, 15, 24));
  ctx.font = `600 ${fs}px ${FONT}`;
  const lines = wrapText(text, 18, 3);
  const lh = fs * 1.2;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22;
  const h = lines.length * lh + 14;
  const pop = clamp((now - born) / 160, 0, 1);
  const bx = clamp(x - w / 2, 6, W - w - 6);
  const by = bottomY - h - 10;
  ctx.save();
  ctx.globalAlpha = pop;
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  rr(ctx, bx, by, w, h, 12);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(clamp(x, bx + 14, bx + w - 14) - 7, by + h - 1);
  ctx.lineTo(clamp(x, bx + 14, bx + w - 14) + 7, by + h - 1);
  ctx.lineTo(clamp(x, bx + 14, bx + w - 14), by + h + 10);
  ctx.fill();
  ctx.fillStyle = '#2a1a12';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 7 + i * lh));
  ctx.restore();
}

function drawBubble(p) {
  if (!p.bubble || now > p.bubble.until) return;
  const sitting = p.state === 'sit';
  const sp = sitting ? seatPos(p) : { x: p.x, y: p.y, s: scaleAtY(p.y) };
  const top = sp.y - (sitting ? 182 : 196) * sp.s - (p.real ? 30 * Math.max(0.62, sp.s) : 0) - (p.hat ? 16 * sp.s : 0);
  drawBubbleAt(sp.x, top, p.bubble.text, Math.max(0.75, sp.s), p.bubble.born);
}

function drawOwner() {
  const s = scaleAtY(STALL.y) * 1.45;
  ctx.save();
  ctx.translate(STALL.ownerX, STALL.y - 8);
  ctx.scale(s, s);
  const talking = now < owner.mouthUntil || voice.isSpeaking?.();
  drawPerson(ctx, OWNER_LOOK, {
    sit: true,
    act: owner.act === 'pour' ? 'pour' : 'idle',
    t: now,
    mouth: talking ? Math.abs(Math.sin(now * 0.025)) : 0,
    blink: now % 3800 < 130,
    happy: now < partyUntil,
    fill: 0.6,
  });
  ctx.restore();
  // nước trà chảy từ vòi bình khi đang rót
  if (owner.act === 'pour') {
    ctx.strokeStyle = 'rgba(196,120,30,0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(JUG_TAP.x - 4, JUG_TAP.y - 18);
    ctx.lineTo(JUG_TAP.x - 4 + Math.sin(now * 0.05), JUG_TAP.y + 2);
    ctx.stroke();
  }
}

function drawTables() {
  // bàn có người chơi cờ thì hiện bàn cờ
  const items = [];
  for (const t of TABLES) {
    const occ = t.seats.filter((id) => seatOwner[id] && seatOwner[id].state === 'sit').length;
    items.push({ y: t.y - 1, draw: () => drawTable(ctx, t, Math.max(occ, 0)) });
    const a = seatOwner[t.seats[0]];
    const b = seatOwner[t.seats[1]];
    if (a && b && a.act === 'chess' && b.act === 'chess') {
      items.push({ y: t.y - 0.5, draw: () => drawChessBoard(t) });
    }
  }
  return items;
}

function drawChessBoard(t) {
  ctx.save();
  ctx.translate(t.x, t.y - 52 * t.s);
  ctx.scale(t.s, t.s);
  ctx.fillStyle = '#e8c27a';
  ctx.beginPath();
  ctx.moveTo(-34, 4);
  ctx.lineTo(34, 4);
  ctx.lineTo(26, -14);
  ctx.lineTo(-26, -14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a5a2a';
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#c62828' : '#263238';
    ctx.beginPath();
    ctx.ellipse(-24 + (i % 4) * 16 + (i > 3 ? 4 : 0), i > 3 ? -2 : -10, 4.5, 2.6, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawFlights() {
  for (const f of flights) {
    if (now < f.t0) continue;
    const k = clamp((now - f.t0) / f.dur, 0, 1);
    let tx;
    let ty;
    if (f.to) {
      const h = headPos(f.to);
      tx = h.x + 20 * h.s;
      ty = h.y + 70 * h.s;
    } else {
      tx = f.toXY.x;
      ty = f.toXY.y;
    }
    const x = lerp(f.from.x, tx, k);
    const y = lerp(f.from.y, ty, k) - Math.sin(k * Math.PI) * 140;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(k * Math.PI) * 0.3);
    const sc = 1.6;
    if (f.item === 'glass') drawTeaGlass(ctx, 0, 12, sc, 0.9);
    else if (f.item === 'lemon') drawTeaGlass(ctx, 0, 12, sc, 0.9, true);
    else if (f.item === 'candy') {
      ctx.fillStyle = '#c58a3a';
      rr(ctx, -16, -9, 32, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#ecc77f';
      for (let i = 0; i < 6; i++) ctx.fillRect(-12 + i * 4.5, -4, 3, 3);
    } else if (f.item === 'seeds') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#2b2b2b';
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(-12 + (i % 5) * 6, -3 + Math.floor(i / 5) * 4, 2.2, 3.4, i, 0, TAU);
        ctx.fill();
      }
    } else if (f.item === 'pipe') drawPipe(ctx, 0, 40, 0.55, 0.3);
    else if (f.item === 'money') {
      ctx.fillStyle = '#7cb342';
      rr(ctx, -18, -9, 36, 18, 2);
      ctx.fill();
      ctx.fillStyle = '#c5e1a5';
      ctx.fillRect(-8, -5, 16, 10);
    }
    ctx.restore();
  }
}

function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.5, y - s, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.4, x, y + s * 0.3);
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
      case 'smoke':
        ctx.globalAlpha = a * 0.55;
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
        break;
      case 'bubble':
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#d6f1ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.stroke();
        break;
      case 'crumb':
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        break;
      case 'confetti':
        ctx.globalAlpha = Math.min(1, a * 2);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        break;
      case 'coin':
        ctx.globalAlpha = Math.min(1, a * 3);
        ctx.translate(p.x, p.y);
        ctx.scale(Math.cos(p.rot), 1);
        ctx.fillStyle = '#ffca28';
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#f57f17';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case 'wind':
        ctx.globalAlpha = a * 0.8;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + k * 4);
        ctx.beginPath();
        for (let t = 0; t < 4.5; t += 0.3) {
          const r = (t / 4.5) * p.size;
          const xx = Math.cos(t) * r;
          const yy = Math.sin(t) * r * 0.6;
          if (t === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        break;
      case 'leaf':
        ctx.globalAlpha = Math.min(1, a * 3);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, TAU);
        ctx.fill();
        break;
      default:
        break;
    }
    ctx.restore();
  }
}

function drawWorld() {
  if (bgImage) ctx.drawImage(bgImage, 0, 0, W, H);
  else {
    ctx.drawImage(bg, 0, 0);
    if (config.showTree !== false) drawCanopy(ctx, now);
  }
  if (config.showUmbrella !== false) drawUmbrella(ctx, now);
  // vật thể sắp theo chiều sâu
  const items = [];
  items.push({ y: STALL.y - 2, draw: drawOwner });
  items.push({ y: STALL.y, draw: () => drawStallFront(ctx) });
  items.push({ y: VIP.y - 1, draw: () => drawVipChair(ctx, vip ? 0.6 + Math.sin(now * 0.005) * 0.4 : 0) });
  // ghế dài sát tường
  const bench = SEATS.filter((s) => s.bench);
  if (bench.length) {
    const left = bench.filter((s) => s.x < W / 2);
    const right = bench.filter((s) => s.x >= W / 2);
    for (const grp of [left, right]) {
      if (grp.length) items.push({ y: grp[0].y - 2, draw: () => drawBench(ctx, grp[0].x, grp[grp.length - 1].x, grp[0].y, grp[0].s) });
    }
  }
  for (const s of SEATS) {
    if (s.bench) continue;
    items.push({ y: s.y - 1.5, draw: () => drawStool(ctx, s.x, s.y, s.s, s.color) });
  }
  items.push(...drawTables());
  for (const p of allPeople()) {
    const sp = p.state === 'sit' ? seatPos(p) : { y: p.y };
    items.push({ y: sp.y, draw: () => drawPersonAt(p) });
  }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();
  // lá rơi, khói... và đồ bay
  drawParticles();
  drawFlights();
  // xe máy dưới lòng đường (gần nhất)
  bikes.sort((a, b) => a.y - b.y);
  for (const b of bikes) drawMotorbike(ctx, b, now);
  // bảng tên + bong bóng chat trên cùng
  const ppl = allPeople().sort((a, b) => a.y - b.y);
  for (const p of ppl) drawTag(p);
  for (const p of ppl) drawBubble(p);
  if (owner.bubble && now < owner.bubble.until) drawBubbleAt(OWNER_MOUTH.x, OWNER_MOUTH.y - 50, owner.bubble.text, 0.95, owner.bubble.born, '#fff3e0');
}

// ------------------------------------------------------------------ giao diện phủ
function drawHeader() {
  // biển hiệu gỗ
  const w = 640;
  const x = (W - w) / 2;
  const y = 22;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#7b4a26';
  rr(ctx, x, y, w, 96, 18);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#9a6234';
  rr(ctx, x + 8, y + 8, w - 16, 80, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,10,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 22 + i * 18);
    ctx.bezierCurveTo(x + w * 0.3, y + 18 + i * 18, x + w * 0.6, y + 28 + i * 18, x + w - 14, y + 20 + i * 18);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff4d6';
  ctx.font = `900 58px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#4a2a12';
  ctx.strokeText(config.shopName || DEFAULTS.shopName, W / 2, y + 50);
  ctx.fillText(config.shopName || DEFAULTS.shopName, W / 2, y + 50);
  ctx.restore();
  // dòng phụ
  ctx.save();
  ctx.font = `600 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const sub = config.subtitle || '';
  const sw = ctx.measureText(sub).width + 30;
  ctx.fillStyle = 'rgba(30,20,10,0.6)';
  rr(ctx, (W - sw) / 2, 126, sw, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(sub, W / 2, 144);
  ctx.restore();
  // bộ đếm
  ctx.save();
  ctx.font = `800 22px ${FONT}`;
  ctx.textBaseline = 'middle';
  const chip = (text, x, y, align) => {
    const tw = ctx.measureText(text).width + 24;
    const bx = align === 'left' ? x : x - tw;
    ctx.fillStyle = 'rgba(30,20,10,0.65)';
    rr(ctx, bx, y, tw, 38, 19);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(text, bx + 12, y + 20);
  };
  chip(`☕ ${teaCount} cốc trà`, 16, 176, 'left');
  chip(`💨 ${chemCount} vụ chém gió`, 16, 222, 'left');
  chip(`👥 ${guests.size} khách`, W - 16, 176, 'right');
  ctx.restore();
  // độ rôm rả
  const max = Math.max(20, Number(config.hypeMax) || 200);
  const k = clamp(hype / max, 0, 1);
  const bw = 300;
  const bx = W - 16 - bw;
  const by = 224;
  ctx.save();
  ctx.fillStyle = 'rgba(30,20,10,0.65)';
  rr(ctx, bx, by, bw, 34, 17);
  ctx.fill();
  const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  g.addColorStop(0, '#ffb300');
  g.addColorStop(1, '#ff5722');
  ctx.fillStyle = g;
  rr(ctx, bx + 4, by + 4, Math.max(26, (bw - 8) * k), 26, 13);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `800 18px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🔥 Độ rôm rả ${Math.round(k * 100)}%`, bx + bw / 2, by + 18);
  ctx.restore();
  // khách sộp
  const top = [...guests.values()].filter((x) => x.coins > 0).sort((a, b) => b.coins - a.coins).slice(0, 3);
  if (top.length) {
    ctx.save();
    const lx = W - 16 - 300;
    let ly = 270;
    ctx.fillStyle = 'rgba(30,20,10,0.6)';
    rr(ctx, lx, ly, 300, 36 + top.length * 34, 14);
    ctx.fill();
    ctx.fillStyle = '#ffd54a';
    ctx.font = `800 19px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆 Khách sộp hôm nay', lx + 14, ly + 19);
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
  let y = 410;
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
    const x = W - 16 - w + (1 - Math.min(1, age / 200)) * 60;
    ctx.fillStyle = 'rgba(30,20,10,0.72)';
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
  ctx.font = `700 28px ${FONT}`;
  const lines = wrapText(caption.text, 34, 2);
  const w = Math.min(W - 40, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 110);
  const h = 22 + lines.length * 36;
  const x = (W - w) / 2;
  const y = 1690;
  ctx.fillStyle = 'rgba(255,248,230,0.95)';
  rr(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.strokeStyle = '#b71c1c';
  ctx.lineWidth = 3;
  ctx.stroke();
  // mặt bà chủ quán nhỏ
  ctx.save();
  ctx.translate(x + 44, y + h / 2 + 42);
  ctx.scale(0.5, 0.5);
  ctx.beginPath();
  ctx.arc(0, -146, 34, 0, TAU);
  ctx.clip();
  drawPerson(ctx, OWNER_LOOK, { sit: true, t: now, mouth: Math.abs(Math.sin(now * 0.025)) });
  ctx.restore();
  ctx.fillStyle = '#3e2410';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, x + 82, y + 12 + i * 36));
  ctx.restore();
}

const FOOT_CMDS = [
  ['☕', 'trà đá'], ['🍋', 'trà chanh'], ['🎋', 'điếu cày'], ['🥜', 'kẹo lạc'], ['🌻', 'hướng dương'], ['💨', 'chém gió'],
  ['♟️', 'cờ tướng'], ['📰', 'đọc báo'], ['🪭', 'nóng quá'], ['🍻', 'dzô'], ['👋', 'tính tiền'],
];
function drawFooter() {
  ctx.save();
  ctx.fillStyle = 'rgba(25,15,8,0.82)';
  ctx.fillRect(0, FOOT_Y, W, H - FOOT_Y);
  ctx.fillStyle = '#ffcc80';
  ctx.font = `800 21px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BÌNH LUẬN ĐỂ GỌI ĐỒ  •  ❤️ THẢ TIM ĐỂ UỐNG  •  🎁 QUÀ = BAO CẢ QUÁN', W / 2, FOOT_Y + 22);
  ctx.font = `700 21px ${FONT}`;
  // 2 hàng nút lệnh
  const rows = [FOOT_CMDS.slice(0, 6), FOOT_CMDS.slice(6)];
  rows.forEach((row, r) => {
    const widths = row.map(([e, t]) => ctx.measureText(`${e} ${t}`).width + 22);
    const total = widths.reduce((a, b) => a + b, 0) + (row.length - 1) * 8;
    let x = (W - total) / 2;
    const y = FOOT_Y + 46 + r * 40;
    row.forEach(([e, t], i) => {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      rr(ctx, x, y, widths[i], 32, 16);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(`${e} ${t}`, x + 11, y + 17);
      x += widths[i] + 8;
    });
  });
  ctx.restore();
}

let lastFrame = performance.now();
let nextBike = 0;
let nextLeaf = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastFrame) / 1000);
  lastFrame = ts;
  now = ts;
  if (now > nextBike) {
    spawnBike();
    nextBike = now + rand(2500, 7000);
  }
  if (config.showLeaves !== false && config.showTree !== false && now > nextLeaf) {
    leafFall();
    nextLeaf = now + rand(1500, 4000);
  }
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
    ctx.fillStyle = `rgba(255,240,200,${flash * 0.4})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawHeader();
  drawToasts();
  drawCaption();
  drawFooter();
  if (audioBlocked) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(ctx, W / 2 - 250, 330, 500, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔇 Bấm vào game để bật tiếng', W / 2, 359);
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
    const res = await fetch('/tra-da-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  buildCommands();
  drawStatic(bg.getContext('2d'), config);
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
  voice.setOnSpeakStart((text) => {
    sfx.duck(Math.min(9000, 1500 + String(text).length * 75));
    owner.mouthUntil = performance.now() + Math.min(8000, 800 + String(text).length * 65);
  });
  let files = Array.isArray(config.musicFiles) ? config.musicFiles.filter(Boolean) : [];
  try {
    const r = await fetch('/tra-da-music.json', { cache: 'no-store' });
    if (r.ok) files = [...(await r.json()), ...files];
  } catch {
    /* không có máy chủ */
  }
  const startMusic = () => {
    if (config.sound === false) return;
    if (config.music === false) {
      sfx.startMusic({ files: [], volume: 0, ambience: Number(config.ambienceVolume ?? 0.12) });
      return;
    }
    sfx.startMusic({ files, volume: Number(config.musicVolume ?? 0.3), ambience: Number(config.ambienceVolume ?? 0.12) });
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
      if (performance.now() - lastAnnounce > gap) announce(line('reminder'), 0);
    }, 3000);
  }
  // khách không tên vào dần
  for (let i = 0; i < Math.min(6, Number(config.ambientCrowd) || 0); i++) {
    const c = newPerson(`crowd-${crowdSeq}`, crowdLook(crowdSeq++), false);
    if (c) crowd.push(c);
  }
  setInterval(refillCrowd, 1800);
  for (let i = 0; i < 4; i++) leafFall();
  connectWs();
  requestAnimationFrame(frame);
}

// Xuất ảnh nền trống để tự thiết kế lại (tra-da.html?export=1)
function exportBackground() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(bg, 0, 0);
  drawCanopy(x, 0);
  const a = document.createElement('a');
  a.download = 'nen-tra-da.png';
  a.href = c.toDataURL('image/png');
  a.click();
  ctx.drawImage(c, 0, 0);
}

window.__traDa = { handleEvent, guests, config: () => config };
boot();
