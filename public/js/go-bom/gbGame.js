// Game TikTok LIVE "Gỡ bom cứu Boss": mỗi quả bom buộc trên một "boss" (chó, mèo) bị trói trên ghế.
// - Bảng mạch có 3-5 dây rối nối từ các chữ A, B, C, D, E xuống các cọc 1, 2, 3... Cọc mở lần lượt.
//   Người xem dò xem dây nào chạy vào cọc đang sáng rồi bình luận chữ của dây đó. Hết giờ bỏ phiếu thì cắt dây nhiều phiếu nhất.
// - Cắt đúng hết các cọc = cứu được boss. Cắt sai: đồng hồ chạy nhanh x1.5 rồi x2, sai lần 3 thì nổ. Hết giờ cũng nổ.
// - Boss đổi biểu cảm theo đồng hồ (tự tin, lo lắng, hốt hoảng, khóc, cầu nguyện, thở phào, bị nổ) và mắng gọi tên người chơi.
// - Bảng mạch tối om: thả tim mới bật đèn thấy dây. Chia sẻ: cộng giây. Bình luận "đốt": trừ giây (đội Phá). Theo dõi: áo giáp + điểm.
//   Quà (không bắt buộc): đóng băng đồng hồ; quà lớn: kìm vàng tự cắt đúng.
import * as sfx from './gbAudio.js';
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
const DIGIT = '"Consolas", "Courier New", monospace';
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const EXPR = ['tu-tin', 'lo-lang', 'hot-hoang', 'mang', 'khoc', 'cau-nguyen', 'tho-phao', 'bi-no'];

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'GỠ BOM CỨU BOSS',
  // độ khó từng cấp: wires = số dây (3-5), bends = số khúc uốn, wiggle = độ ngoằn ngoèo (0-30), decoys = dây giả không nối vào cọc,
  // colors = 'khac' (mỗi dây một màu) / 'xanh' / 'tim' (cùng tông, dễ lẫn), cover = tấm che chớp tắt, seconds = thời gian bom
  levels: [
    { wires: 3, bends: 4, wiggle: 6, decoys: 0, colors: 'khac', cover: false, seconds: 120 },
    { wires: 4, bends: 5, wiggle: 10, decoys: 0, colors: 'khac', cover: false, seconds: 150 },
    { wires: 4, bends: 6, wiggle: 14, decoys: 0, colors: 'xanh', cover: false, seconds: 150 },
    { wires: 5, bends: 7, wiggle: 16, decoys: 1, colors: 'xanh', cover: false, seconds: 180 },
    { wires: 5, bends: 8, wiggle: 20, decoys: 1, colors: 'tim', cover: false, seconds: 180 },
    { wires: 5, bends: 9, wiggle: 22, decoys: 2, colors: 'tim', cover: true, seconds: 180 },
    { wires: 5, bends: 10, wiggle: 26, decoys: 2, colors: 'tim', cover: true, seconds: 170 },
    { wires: 5, bends: 11, wiggle: 30, decoys: 3, colors: 'tim', cover: true, seconds: 160 },
  ],
  bossLevel: { wires: 5, bends: 10, wiggle: 24, decoys: 2, colors: 'tim', cover: true, seconds: 210 },
  levelMode: 'tu-dong',
  startLevel: 1,
  voteSeconds: 20,
  earlyCutVotes: 6,
  suspenseSeconds: 2.2,
  enterSeconds: 4,
  savedSeconds: 7,
  boomSeconds: 8,
  wrongSpeeds: [1, 1.5, 2],
  maxWrong: 3,
  correctToCalm: 2,
  bossEvery: 5,
  // đèn bảng mạch: mỗi tim cộng bấy nhiêu giây sáng, tối đa lightMaxSeconds; darkness = độ tối khi tắt đèn (0..1)
  likeLightSeconds: 0.5,
  lightMaxSeconds: 12,
  darkness: 0.94,
  // chia sẻ: cộng giây đồng hồ, mỗi người tối đa shareMaxPerUser lần mỗi quả bom
  shareSeconds: 10,
  shareMaxPerUser: 2,
  burnSeconds: 3,
  burnMaxPerUser: 1,
  burnFloorSeconds: 6,
  flashlightSeconds: 4,
  followPoints: 5,
  giftFreezeSeconds: 10,
  bigGiftCoins: 99,
  points: 10,
  firstBonus: 5,
  hostages: [
    { id: 'shiba', name: 'Chú Tư Shiba', folder: 'assets/go-bom/shiba', voice: 'vi-VN-NamMinhNeural',
      lines: {
        intro: ['Bọn bắt cóc trói chú ở đây từ sáng, chưa kịp chạy cuốc xe nào!', 'Chú Tư đây! Cứu chú với, chiều chú còn phải chở khách!'],
        cry: ['Chú còn chưa trả xong tiền góp xe!!!', 'Vợ ơi anh xin lỗi vụ trốn đi nhậu!!!'],
        saved: ['Sống rồi! Tối nay chú chở cả phòng miễn phí!', 'Chú Tư sống rồi! Đi nhậu ăn mừng thôi!'],
      } },
    { id: 'meo', name: 'Bé Mướp', folder: 'assets/go-bom/meo', voice: 'vi-VN-HoaiMyNeural',
      lines: {
        intro: ['Bé Mướp đây! Ai trói bé thế này, bé cào cho bây giờ!', 'Cứu bé với, bé còn chưa ăn pate sáng nay!'],
        cry: ['Bé còn chín mạng mà sao thấy sắp hết mạng rồi!!!', 'Huhu bé chưa kịp ngủ trưa!!!'],
        saved: ['Bé sống rồi! Tối nay bé cho mọi người vuốt lông!', 'Cảm ơn cả nhà, bé thương lắm luôn!'],
      } },
    { id: 'cun', name: 'Anh Lu Lì Lợm', folder: 'assets/go-bom/cun', voice: 'vi-VN-NamMinhNeural',
      lines: {
        intro: ['Anh Lu đây! Trói anh thế này anh sủa cả xóm dậy bây giờ!', 'Gâu! Ai thả anh ra, anh cho gặm xương chung!'],
        cry: ['Anh còn giấu cục xương ngoài vườn chưa kịp gặm!!!', 'Gâu gâu… anh sợ quá rồi!!!'],
        saved: ['Gâu! Anh sống rồi! Ra vườn đào xương thôi!', 'Ân nhân của anh đây rồi!'],
      } },
    { id: 'golden', name: 'Bếp Trưởng Bơ', folder: 'assets/go-bom/golden', voice: 'vi-VN-NamMinhNeural',
      lines: {
        intro: ['Bếp trưởng Bơ đây! Nồi phở còn đang sôi ở nhà, cứu tôi nhanh lên!', 'Tôi chỉ là con chó nấu ăn hiền lành thôi mà!'],
        cry: ['Nồi canh của tôi trào hết rồi!!!', 'Tôi chưa kịp dạy ai công thức nước dùng!!!'],
        saved: ['Sống rồi! Tối nay tôi nấu cho cả phòng một nồi lẩu!', 'Cảm ơn mọi người, mai ghé quán tôi ăn miễn phí!'],
      } },
  ],
  hostageOrder: 'lan-luot',
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.22,
  voice: true,
  voiceEngine: 'auto',
  voiceJoin: true,
  chatterSeconds: 9,
  messages: {
    intro: ['Ai đó cứu tôi với! Bình luận chữ A, B, C, D để cắt dây!', 'Dò dây cho kỹ rồi bình luận chữ của dây nối vào cọc đang sáng nhé!'],
    calm: ['Dễ ợt! Cả nhà comment chữ của dây cho tôi nào', 'Nhìn kỹ dây nào chạy vào cọc sáng nhé', 'Thả tim cho tôi thêm tí giờ nào cả nhà!', '{ten} ơi, nhìn kỹ hộ tôi nhé'],
    worried: ['Ơ… sao im thế? Có ai ở đây không?', 'Tôi hơi run rồi đấy nhé…', 'Phiếu đang chia đôi kìa, quyết đi mấy đứa!', 'Đồng hồ chạy nhanh quá, cứu tôi với!'],
    panic: ['NHANH LÊN! Mấy bố ngồi xem phim à?!', 'Trời đất ơi! Còn mấy giây thôi!', 'Cắt đi! Cắt đi! Chọn dây nhanh lên!', 'Tôi sắp thành than rồi đấy!'],
    cry: ['Mẹ ơi cứu con!!!', 'Tôi còn trẻ mà!!!', 'Không muốn nổ đâu!!!'],
    noVote: ['Không ai chọn dây à? Cả phòng đâu hết rồi?!', 'Comment chữ A, B, C hoặc D đi chứ! Ngồi xem à?!', 'Có ai ở đây không? Comment một chữ thôi mà!'],
    fewVotes: ['Có {n} người chọn thôi à? Cả phòng đâu rồi?!', 'Mới {n} phiếu! Comment nhanh lên!'],
    split: ['Chia đôi thế này thì cắt dây nào?! Cãi nhau đi!', 'Phiếu sát nút quá! Thêm phiếu đi mấy đứa!'],
    likerNoVote: ['{ten} thả tim mà không chọn dây, tim để ngắm à?!', '{ten}! Thả tim xong comment chữ dây luôn đi!'],
    flip: ['{ten} đổi ý mấy lần rồi, quyết đi em ơi!', '{ten} ơi, chọn một dây thôi!'],
    burn: ['{ten}! Tôi với bạn thù gì mà đốt giờ của tôi?!', 'Lại là {ten}! Ra đây nói chuyện!', 'Ai đốt nữa là tôi mách mẹ đấy! {ten} nhé!'],
    thankLike: ['{ten} thả tim, đèn sáng rồi! Nhìn dây nhanh lên!', 'Cảm ơn {ten}, sáng rồi, thấy dây rồi!', 'Đấy, thế mới là người tốt chứ, cảm ơn {ten} bật đèn!'],
    thankShare: ['{ten} chia sẻ, tôi sống thêm mấy giây rồi!', 'Cảm ơn {ten}! Thêm giờ rồi, chia sẻ tiếp đi cả nhà!'],
    dark: ['Tối thui! Thả tim bật đèn lên, tôi không thấy dây!', 'Cúp điện rồi! Thả tim đi cả nhà, tim là điện đấy!', 'Ai thả tim cho sáng đèn với! Tối thế này cắt bằng niềm tin à?!', 'Đèn tắt rồi kìa! Tim đâu hết rồi?!'],
    thankFollow: ['Cảm ơn {ten} theo dõi, tặng áo giáp chống nổ!', '{ten} theo dõi kênh, được mặc áo giáp rồi!'],
    thankGift: ['{ten} tặng {gift}, đóng băng đồng hồ! Cảm ơn nhiều!', 'Cảm ơn {ten}! Đồng hồ đứng yên rồi!'],
    bigGift: ['{ten} tặng {gift}! Kìm vàng tự cắt đúng dây luôn!', 'Đại gia {ten} ra tay! Kìm vàng cắt đúng rồi!'],
    pray: ['Lạy trời lạy phật… cắt đi!', 'Nhắm mắt lại… cắt!', 'Xin đừng nổ… xin đừng nổ…'],
    correct: ['Đúng rồi! {ten} là thiên tài!', 'Phù… sống rồi! Cảm ơn {ten}!', 'Chuẩn luôn! Dây tiếp theo nào!'],
    wrong: ['AAAA! Ai bảo cắt dây đó?! Đồng hồ chạy nhanh hơn rồi!', '{ten} chọn đấy à? Tôi nhớ mặt rồi nhé!', 'Sai rồi! Sai lần nữa là tôi về chầu ông bà đấy!'],
    lastChance: ['Sai thêm lần nữa là nổ đấy! Nhìn kỹ vào!', 'Còn một lần sai thôi! Cẩn thận!'],
    saved: ['Sống rồi! Sống rồi!', 'Cảm ơn cả nhà đã cứu tôi!'],
    boom: ['…Khụ khụ… Ai… ai cắt dây đấy…', 'Tôi đen như cái nồi rồi, vui chưa?!', 'Lần sau tôi tự gỡ, không nhờ mấy đứa nữa!'],
    timeUp: ['Hết giờ rồi!!!', 'Không kịp rồi!!!'],
    join: ['{ten} ơi, cứu tôi với!', 'Chào {ten}! Vào gỡ bom giúp tôi đi!', '{ten} vào đúng lúc quá, chọn dây giúp tôi!'],
    taunt: ['Hơ hơ hơ! Chúng mày không gỡ nổi đâu!', 'Dây đỏ hay dây xanh? Đoán xem nào!', 'Bom của ta chưa ai gỡ được!', 'Cứ đốt thêm giây đi, ta thích lắm!'],
    tauntSaved: ['Hừ! Chúng mày gặp may thôi!', 'Không thể nào! Quả bom tiếp theo sẽ khó hơn!'],
    tauntBoom: ['Hơ hơ hơ! Bùm! Ta đã nói rồi mà!', 'Ta lại thắng! Quả tiếp theo nào!'],
    tauntBoss: ['BOM TRÙM của ta đây! Có tấm che, nhìn được mới tài!', 'Đến lượt bom trùm! Lần này chúng mày tiêu rồi!'],
    reminder: [
      'Bình luận chữ A, B, C, D để chọn dây cần cắt',
      'Dò theo dây từ cọc đang sáng ngược lên chữ ở trên',
      'Thả tim để bật đèn, đèn tắt là không thấy dây',
      'Bình luận chữ đốt để trừ giây, nếu bạn là đội phá',
      'Chia sẻ LIVE để cộng thêm giây cho đồng hồ',
      'Theo dõi kênh để được mặc áo giáp chống nổ',
    ],
  },
};
let config = structuredClone(DEFAULTS);

const lastLine = {};
function line(kind, vars = {}, extra = null) {
  const base = (config.messages && config.messages[kind]) || DEFAULTS.messages[kind] || [];
  const list = extra && extra.length ? [...extra, ...extra, ...base] : base;
  if (!list.length) return '';
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastLine[kind]) i = (i + 1) % list.length;
  lastLine[kind] = i;
  return list[i].replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
}
const noAccent = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
const shortName = (n) => {
  const a = Array.from(String(n || '').trim());
  return a.length > 18 ? `${a.slice(0, 17).join('')}…` : a.join('');
};

// ------------------------------------------------------------------ hình
const IMG = {};
function loadImg(key, src) {
  if (IMG[key]) return IMG[key];
  const img = new Image();
  const rec = { img, ready: false };
  img.onload = () => {
    rec.ready = true;
  };
  img.src = src;
  IMG[key] = rec;
  return rec;
}
function hostageImg(h, expr) {
  return loadImg(`${h.id}/${expr}`, `${h.folder}/${expr}.webp`);
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
function wrap(text, maxW, font) {
  ctx.font = font;
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
function fitText(text, weight, maxSize, minSize, maxW, maxH, maxLines = 4) {
  for (let s = maxSize; s >= minSize; s -= 2) {
    const font = `${weight} ${s}px ${FONT}`;
    const lines = wrap(text, maxW, font);
    if (lines.length <= maxLines && lines.length * s * 1.2 <= maxH) return { font, size: s, lines };
  }
  const font = `${weight} ${minSize}px ${FONT}`;
  return { font, size: minSize, lines: wrap(text, maxW, font).slice(0, maxLines) };
}

const avatarCache = new Map();
function getAvatar(url) {
  if (!url) return null;
  let rec = avatarCache.get(url);
  if (!rec) {
    rec = { img: new Image(), ready: false };
    rec.img.crossOrigin = 'anonymous';
    rec.img.onload = () => {
      rec.ready = true;
    };
    rec.img.src = url;
    avatarCache.set(url, rec);
  }
  return rec;
}
const COLORS = ['#ef5350', '#ab47bc', '#5c6bc0', '#29b6f6', '#26a69a', '#9ccc65', '#ffca28', '#ff7043', '#8d6e63', '#ec407a'];
function hashOf(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
function drawAvatar(x, y, r, p, ring = '#fff') {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.closePath();
  const av = getAvatar(p.avatar);
  if (av && av.ready) {
    ctx.save();
    ctx.clip();
    ctx.drawImage(av.img, x - r, y - r, r * 2, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = COLORS[hashOf(p.id) % COLORS.length];
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${Math.round(r * 1.05)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Array.from(p.name || '?')[0].toUpperCase(), x, y + r * 0.05);
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.strokeStyle = ring;
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ trạng thái
let now = performance.now();
const players = new Map();
const particles = [];
const toasts = [];
const floaters = [];
let paused = false;
let shake = 0;
let flash = 0;
let hostageIdx = -1;
let hostage = null;
let bombNo = 0;
let level = 1; // số quả cứu được liên tiếp tăng cấp
let saved = 0;
let exploded = 0;
let bomb = null; // quả bom hiện tại
const phase = { name: 'boot', t0: 0, until: 0 };
let bubbleText = '';
let bubbleAt = 0;
let mood = null; // { expr, until }
let lastSayAt = 0;
let lastChatter = 0;
let tauntText = '';
let tauntAt = 0;
let lastJoinVoice = 0;
let lastThank = {};
let smoke = 0;

function player(user) {
  if (!user || !user.id) return null;
  let p = players.get(user.id);
  if (!p) {
    p = { id: user.id, name: shortName(user.name || user.uniqueId || 'Bạn'), avatar: user.avatar || '', score: 0, streak: 0, armor: false, cuts: 0 };
    players.set(user.id, p);
  }
  if (user.avatar) p.avatar = user.avatar;
  if (user.name) p.name = shortName(user.name);
  return p;
}

function setPhase(name, sec) {
  phase.name = name;
  phase.t0 = now;
  phase.until = now + (sec * 1000) / SPEED;
}
const phaseT = () => ((now - phase.t0) / 1000) * SPEED;
const phaseLeft = () => Math.max(0, ((phase.until - now) / 1000) * SPEED);

function say(text, priority = 1, expr = null, ms = 2800) {
  if (!text) return;
  bubbleText = text;
  bubbleAt = now;
  lastSayAt = now;
  if (expr) mood = { expr, until: now + ms };
  voice.speak(text, priority);
}
function taunt(text) {
  tauntText = text;
  tauntAt = now;
  sfx.evilLaugh();
}
function addToast(text, color = '#fff') {
  toasts.push({ text, color, t0: now });
  if (toasts.length > 5) toasts.shift();
}
function floater(text, color, x, y) {
  floaters.push({ text, color, x, y, t0: now });
  if (floaters.length > 30) floaters.shift();
}
function addParticle(o) {
  particles.push({ t0: now, ...o });
  if (particles.length > 500) particles.splice(0, particles.length - 500);
}
function sparks(x, y, n, color = '#ffe066') {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const s = rand(200, 700);
    addParticle({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 150, life: rand(0.3, 0.8), color, size: rand(3, 7) });
  }
}
function confetti(x, y, n) {
  const cols = ['#ffd54f', '#ef5350', '#66bb6a', '#42a5f5', '#ab47bc', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
    const s = rand(400, 1100);
    addParticle({ kind: 'conf', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(1.6, 3), color: pick(cols), size: rand(10, 20), rot: rand(0, TAU), vr: rand(-10, 10) });
  }
}

// ------------------------------------------------------------------ bảng mạch + dây
const PANEL = { x: 50, y: 1000, w: 980, h: 808 };
const TIMER_BOX = { x: PANEL.x + PANEL.w / 2 - 210, y: PANEL.y + 26, w: 420, h: 130 };
const TOP_Y = PANEL.y + 262;
const BOT_Y = PANEL.y + PANEL.h - 70;
const WIRE_TOP = TOP_Y + 46;
const WIRE_BOT = BOT_Y - 46;
const AREA = { x: PANEL.x + 70, w: PANEL.w - 140 };

const PALETTE_EASY = ['#ff5252', '#40c4ff', '#ffd740', '#69f0ae', '#e040fb'];
const PALETTE_HARD = ['#b388ff', '#ce93d8', '#9575cd', '#ea80fc', '#7c4dff'];
const PALETTE_MID = ['#4fc3f7', '#81d4fa', '#29b6f6', '#80deea', '#4dd0e1'];

function slotX(i, n) {
  return AREA.x + ((i + 0.5) * AREA.w) / n;
}
// đường Catmull-Rom qua các điểm, trả về danh sách điểm dày
function smooth(pts, seg = 14) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) {
      const t = k / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function makeBomb() {
  bombNo++;
  const isBoss = config.bossEvery > 0 && saved > 0 && (saved + exploded) % config.bossEvery === 0 && !(bomb && bomb.boss);
  const L = isBoss ? { ...DEFAULTS.bossLevel, ...(config.bossLevel || {}) } : levelSpec();
  const n = clamp(Math.round(Number(L.wires) || 4), 3, 5);
  const total = Math.max(30, Number(L.seconds) || 120);
  // hoán vị: dây i nối vào cọc perm[i]; tránh trường hợp dây chạy thẳng xuống quá nhiều
  let perm;
  for (let tries = 0; tries < 50; tries++) {
    perm = [...Array(n).keys()].sort(() => Math.random() - 0.5);
    const straight = perm.filter((v, i) => v === i).length;
    if (straight <= (n >= 4 ? 1 : 0)) break;
  }
  const rows = clamp(Math.round(Number(L.bends) || 4), 2, 14);
  const wig = clamp(Number(L.wiggle) || 0, 0, 40);
  const palette = L.colors === 'tim' ? PALETTE_HARD : L.colors === 'xanh' ? PALETTE_MID : PALETTE_EASY;
  const cols = [...palette].sort(() => Math.random() - 0.5);
  const wigglePath = (pts) => {
    const path = smooth(pts, 10 + rows);
    if (!wig) return path;
    const k = rand(5, 9);
    const ph = rand(0, TAU);
    return path.map((pt, j) => {
      const t = j / (path.length - 1);
      const fade = Math.min(1, t / 0.12, (1 - t) / 0.12);
      const a = path[Math.max(0, j - 1)];
      const b = path[Math.min(path.length - 1, j + 1)];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const off = Math.sin(t * k * TAU + ph) * wig * fade;
      return { x: clamp(pt.x + (-dy / len) * off, AREA.x - 20, AREA.x + AREA.w + 20), y: pt.y + (dx / len) * off };
    });
  };
  const midPoints = (pts) => {
    for (let r = 1; r <= rows; r++) {
      const y = WIRE_TOP + ((WIRE_BOT - WIRE_TOP) * r) / (rows + 1);
      // khúc uốn qua lại hai bên để dây quấn vào nhau
      const side = (r + Math.floor(Math.random() * 2)) % 2;
      const x = side ? rand(AREA.x + AREA.w * 0.5, AREA.x + AREA.w - 10) : rand(AREA.x + 10, AREA.x + AREA.w * 0.5);
      pts.push({ x, y: y + rand(-14, 14) });
    }
    return pts;
  };
  const wires = [];
  for (let i = 0; i < n; i++) {
    const pts = midPoints([{ x: slotX(i, n), y: TOP_Y + 18 }, { x: slotX(i, n), y: WIRE_TOP }]);
    pts.push({ x: slotX(perm[i], n), y: WIRE_BOT });
    pts.push({ x: slotX(perm[i], n), y: BOT_Y - 18 });
    wires.push({ i, term: perm[i], color: cols[i % cols.length], path: wigglePath(pts), cut: false, wrongCut: false, cutAt: 0, patched: false });
  }
  // dây giả: đầu trên nằm giữa hai chữ, đầu dưới cụt giữa hai cọc, không nối vào cọc nào
  const decoys = [];
  const nd = clamp(Math.round(Number(L.decoys) || 0), 0, 4);
  for (let d = 0; d < nd; d++) {
    const top = clamp(Math.floor(Math.random() * (n - 1)), 0, n - 2);
    const bot = clamp(Math.floor(Math.random() * (n - 1)), 0, n - 2);
    const xt = (slotX(top, n) + slotX(top + 1, n)) / 2;
    const xb = (slotX(bot, n) + slotX(bot + 1, n)) / 2;
    const pts = midPoints([{ x: xt, y: WIRE_TOP - 6 }, { x: xt, y: WIRE_TOP + 10 }]);
    pts.push({ x: xb, y: WIRE_BOT });
    pts.push({ x: xb, y: WIRE_BOT + 16 });
    decoys.push({ color: cols[(n + d) % cols.length], path: wigglePath(pts) });
  }
  bomb = {
    no: bombNo, boss: isBoss, level: isBoss ? 'TRÙM' : level, cover: !!L.cover, decoys, n, wires, total, left: total, stage: 0, wrongs: 0, correctRun: 0, freeze: 0,
    votes: new Map(), flips: new Map(), likeSec: new Map(), likeBuf: new Map(), burned: new Map(), voters: new Map(),
    light: 0, lightShown: 0, darkSince: 0, shares: new Map(), flashlight: 0, cutWire: -1, cutOk: false, cutAt: 0, coverOpen: true, lastBeep: 0, warned: false, mvp: new Map(),
  };
}
const levelList = () => (Array.isArray(config.levels) && config.levels.length ? config.levels : DEFAULTS.levels);
const levelCount = () => levelList().length;
const levelAuto = () => config.levelMode !== 'co-dinh';
function levelSpec() {
  const list = levelList();
  return { ...DEFAULTS.levels[0], ...list[clamp(level - 1, 0, list.length - 1)] };
}
const speedMult = () => (bomb ? Number(config.wrongSpeeds[Math.min(bomb.wrongs, config.wrongSpeeds.length - 1)]) || 1 : 1);
const targetWire = () => (bomb ? bomb.wires.find((w) => w.term === bomb.stage) : null);

function nextHostage() {
  const list = Array.isArray(config.hostages) && config.hostages.length ? config.hostages : DEFAULTS.hostages;
  if (config.hostageOrder === 'ngau-nhien' && list.length > 1) {
    let k;
    do k = Math.floor(Math.random() * list.length);
    while (k === hostageIdx);
    hostageIdx = k;
  } else hostageIdx = (hostageIdx + 1) % list.length;
  hostage = { ...list[hostageIdx] };
  hostage.folder = hostage.folder || `assets/go-bom/${hostage.id}`;
  hostage.lines = hostage.lines || {};
  for (const e of EXPR) hostageImg(hostage, e);
  // nạp trước ảnh của boss kế tiếp
  const nx = list[(hostageIdx + 1) % list.length];
  if (nx) for (const e of EXPR) hostageImg({ ...nx, folder: nx.folder || `assets/go-bom/${nx.id}` }, e);
  voice.setPreferredVoice(hostage.voice || 'vi-VN-NamMinhNeural');
}
const hLine = (kind, vars = {}) => line(kind, { boss: hostage?.name || '', ...vars }, hostage?.lines?.[kind]);

function startBomb() {
  nextHostage();
  makeBomb();
  mood = null;
  smoke = 0;
  setPhase('enter', Number(config.enterSeconds) || 4);
  sfx.whoosh();
  if (bomb.boss) taunt(line('tauntBoss'));
  else taunt(line('taunt'));
  setTimeout(() => say(hLine('intro'), 1, 'hot-hoang', 3000), 900 / SPEED);
}

function startVote() {
  if (bomb.stage === 0 && !bomb.darkSince) {
    bomb.darkSince = now;
    addToast('🌑 Tiến sĩ Nổ cắt điện! Thả tim ❤️ để bật đèn', '#b39ddb');
  }
  bomb.votes.clear();
  bomb.flips.clear();
  bomb.voteStart = now;
  bomb.scoldedFew = false;
  bomb.scoldedSplit = false;
  setPhase('vote', Number(config.voteSeconds) || 20);
}

function parseVote(text) {
  const t = noAccent(text).trim().replace(/\s+/g, ' ');
  if (!t) return null;
  if (/^(dot|burn)\b/.test(t) || /^🔥/.test(text.trim())) return { burn: true };
  const m = t.match(/^(?:(?:cat|cut|chon|day|cat day|chon day|dap an)\s*)?([a-e])(?:\s*$|\s|[!.?,]|\1+$)/);
  if (m) return { letter: m[1].toUpperCase().charCodeAt(0) - 65 };
  return null;
}

function castVote(p, wi) {
  if (!bomb || phase.name !== 'vote') return;
  if (wi < 0 || wi >= bomb.n) return;
  const w = bomb.wires[wi];
  if (w.cut) return;
  const prev = bomb.votes.get(p.id);
  if (prev === wi) return;
  if (prev != null) {
    const f = (bomb.flips.get(p.id) || 0) + 1;
    bomb.flips.set(p.id, f);
    if (f === 3) yell(hLine('flip', { ten: p.name }));
  }
  bomb.votes.set(p.id, wi);
  if (!bomb.voters.has(p.id)) bomb.voters.set(p.id, p);
  p.lastVote = now;
  sfx.pop();
}
function tally() {
  const c = bomb ? Array(bomb.n).fill(0) : [];
  if (bomb) for (const wi of bomb.votes.values()) c[wi]++;
  return c;
}
function votersOf(wi) {
  const out = [];
  if (!bomb) return out;
  for (const [id, v] of bomb.votes) if (v === wi) out.push(players.get(id));
  return out.filter(Boolean);
}

function yell(text) {
  say(text, 1, 'mang', 2600);
  shake = Math.max(shake, 0.35);
}

function decideCut(forceWire = null, golden = null) {
  const c = tally();
  let wi = forceWire;
  if (wi == null) {
    const max = Math.max(...c);
    if (max <= 0) return false;
    const top = c.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
    wi = pick(top);
  }
  bomb.cutWire = wi;
  bomb.golden = golden;
  setPhase('suspense', golden ? 0.8 : Number(config.suspenseSeconds) || 2.2);
  if (!golden) {
    say(hLine('pray'), 0, 'cau-nguyen', 2500);
    sfx.drumroll(Number(config.suspenseSeconds) || 2.2);
  }
  return true;
}

function doCut() {
  const w = bomb.wires[bomb.cutWire];
  const ok = w.term === bomb.stage;
  bomb.cutOk = ok;
  bomb.cutAt = now;
  const cp = w.path[Math.floor(w.path.length * 0.1)];
  sfx.snip();
  sparks(cp.x, cp.y, 26, ok ? '#fff59d' : '#ff8a80');
  const voters = bomb.golden ? [bomb.golden] : votersOf(bomb.cutWire);
  const winners = bomb.golden ? [bomb.golden] : votersOf(targetWire().i);
  if (ok) {
    w.cut = true;
    w.cutT = now;
    sfx.correct();
    sfx.spark();
    bomb.correctRun++;
    if (bomb.wrongs > 0 && bomb.correctRun >= (Number(config.correctToCalm) || 2)) {
      bomb.wrongs--;
      bomb.correctRun = 0;
      addToast('🧊 2 dây đúng liên tiếp: đồng hồ chạy chậm lại', '#80deea');
    }
    winners.forEach((p, k) => {
      p.score += (Number(config.points) || 10) + (k < 3 ? Number(config.firstBonus) || 5 : 0);
      p.cuts++;
      bomb.mvp.set(p.id, (bomb.mvp.get(p.id) || 0) + 1);
    });
    const hero = winners[0];
    bomb.stage++;
    if (bomb.stage >= bomb.n) {
      setPhase('cutAnim', 1.2);
      setTimeout(() => savedBomb(), 1200 / SPEED);
    } else {
      say(hLine('correct', { ten: hero ? hero.name : 'cả nhà' }), 1, 'tho-phao', 2200);
      setPhase('cutAnim', 1.6);
    }
  } else {
    w.wrongCut = true;
    w.cutT = now;
    bomb.wrongs++;
    bomb.correctRun = 0;
    sfx.wrong();
    shake = 1;
    flash = 0.6;
    const culprit = voters[0];
    if (bomb.wrongs >= (Number(config.maxWrong) || 3)) {
      setPhase('cutAnim', 1);
      setTimeout(() => explode(), 900 / SPEED);
      return;
    }
    const sp = speedMult();
    addToast(`⚠️ CẮT SAI! Đồng hồ chạy nhanh x${sp}`, '#ff8a80');
    say(hLine('wrong', { ten: culprit ? culprit.name : 'ai đó' }), 2, 'hot-hoang', 3200);
    if (bomb.wrongs === (Number(config.maxWrong) || 3) - 1) setTimeout(() => say(hLine('lastChance'), 1, 'mang', 2400), 3400 / SPEED);
    setPhase('cutAnim', 1.8);
  }
}

function savedBomb() {
  if (!bomb) return;
  saved++;
  if (levelAuto()) level = Math.min(levelCount(), level + 1);
  setPhase('saved', Number(config.savedSeconds) || 7);
  sfx.fanfare();
  confetti(330, 620, 140);
  confetti(780, 620, 80);
  const mvps = [...bomb.mvp.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => players.get(id)).filter(Boolean);
  bomb.mvpList = mvps.slice(0, 5);
  for (const p of bomb.voters.values()) p.streak = bomb.mvp.has(p.id) ? p.streak + 1 : p.streak;
  say(hLine('saved'), 2, 'tho-phao', 6000);
  setTimeout(() => taunt(line('tauntSaved')), 1500 / SPEED);
}

function explode() {
  if (!bomb || phase.name === 'boom') return;
  exploded++;
  if (levelAuto()) level = Math.max(1, level - 1);
  setPhase('boom', Number(config.boomSeconds) || 8);
  sfx.boom();
  setTimeout(() => sfx.cough(), 2600 / SPEED);
  shake = 2.2;
  flash = 1;
  smoke = 1;
  const cx = 330;
  const cy = 620;
  for (let i = 0; i < 70; i++) {
    const a = rand(0, TAU);
    const s = rand(150, 900);
    addParticle({ kind: 'smoke', x: cx + rand(-60, 60), y: cy + rand(-60, 60), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - 80, life: rand(2.2, 4.2), size: rand(90, 220), color: pick(['#2b2b2b', '#3d3d3d', '#4a4a4a', '#1f1f1f']) });
  }
  for (let i = 0; i < 40; i++) {
    const a = rand(0, TAU);
    const s = rand(400, 1300);
    addParticle({ kind: 'fire', x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.5, 1.1), size: rand(40, 110), color: pick(['#ffeb3b', '#ff9800', '#ff5722', '#ffffff']) });
  }
  sparks(cx, cy, 60, '#ffcc80');
  for (const p of bomb.voters.values()) if (!p.armor) p.streak = 0;
  setTimeout(() => say(hLine('boom'), 2, 'bi-no', 5000), 1800 / SPEED);
  setTimeout(() => taunt(line('tauntBoom')), 3200 / SPEED);
}

// ------------------------------------------------------------------ sự kiện TikTok
function handleEvent(ev) {
  if (!ev || !ev.type) return;
  if (ev.type === 'pause') {
    paused = !paused;
    return;
  }
  if (ev.type === 'skip') {
    if (phase.name === 'vote' && bomb) {
      if (!decideCut()) decideCut(targetWire().i);
    } else phase.until = now;
    return;
  }
  if (ev.type === 'nextBomb') {
    startBomb();
    return;
  }
  if (ev.type === 'testBoom') {
    if (bomb && !['boom', 'saved'].includes(phase.name)) explode();
    return;
  }
  if (ev.type === 'testSave') {
    if (bomb && !['boom', 'saved'].includes(phase.name)) savedBomb();
    return;
  }
  if (ev.type === 'setLevel') {
    // người phát LIVE chọn độ khó ở bảng điều khiển: auto = tự lên/xuống cấp, hoặc cố định một cấp
    config.levelMode = ev.auto ? 'tu-dong' : 'co-dinh';
    if (ev.level) level = clamp(Math.round(Number(ev.level)) || 1, 1, levelCount());
    addToast(ev.auto ? `🎚️ Độ khó tự động (đang cấp ${level})` : `🎚️ Độ khó cố định: cấp ${level}`, '#b39ddb');
    if (ev.now && !['boom', 'saved'].includes(phase.name)) startBomb();
    return;
  }
  if (ev.type === 'voiceTest') {
    say(hLine('panic'), 2, 'mang');
    return;
  }
  if (ev.type === 'reset' ) {
    for (const p of players.values()) {
      p.score = 0;
      p.streak = 0;
      p.cuts = 0;
    }
    saved = 0;
    exploded = 0;
    level = clamp(Number(config.startLevel) || 1, 1, levelCount());
    return;
  }
  const p = player(ev.user);
  if (!p) return;
  p.lastActive = now;
  switch (ev.type) {
    case 'join': {
      if (config.voiceJoin !== false && now - lastJoinVoice > 15000 && phase.name === 'vote' && !voiceBusy()) {
        lastJoinVoice = now;
        say(hLine('join', { ten: p.name }), 0);
      }
      break;
    }
    case 'simVote': {
      if (!bomb || phase.name !== 'vote') break;
      const t = targetWire();
      if (ev.opt === 'correct') castVote(p, t.i);
      else {
        const others = bomb.wires.filter((w) => !w.cut && w.i !== t.i);
        if (others.length) castVote(p, pick(others).i);
      }
      break;
    }
    case 'chat': {
      const v = parseVote(ev.text || '');
      if (!v) break;
      if (v.burn) doBurn(p);
      else castVote(p, v.letter);
      break;
    }
    case 'like': {
      doLike(p, Number(ev.count) || 1);
      break;
    }
    case 'share': {
      if (!bomb || !['vote', 'suspense', 'cutAnim', 'enter'].includes(phase.name)) break;
      const used = bomb.shares.get(p.id) || 0;
      if (used >= (Number(config.shareMaxPerUser) || 2)) break;
      bomb.shares.set(p.id, used + 1);
      const add = Number(config.shareSeconds) || 10;
      bomb.left = Math.min(bomb.total + 90, bomb.left + add);
      sfx.plus();
      floater(`+${add}s 📣 ${p.name}`, '#80d8ff', PANEL.x + PANEL.w - 150 + rand(-20, 20), TIMER_BOX.y + TIMER_BOX.h + 10);
      addToast(`📣 ${p.name} chia sẻ: +${add} giây!`, '#80d8ff');
      thank('thankShare', p);
      break;
    }
    case 'follow': {
      if (!p.armor) {
        p.armor = true;
        p.score += Number(config.followPoints) || 5;
        addToast(`🛡️ ${p.name} theo dõi: có áo giáp chống nổ!`, '#90caf9');
        thank('thankFollow', p);
        sfx.pop();
      }
      break;
    }
    case 'gift': {
      if (!bomb || !['vote', 'suspense', 'cutAnim', 'enter'].includes(phase.name)) break;
      const coins = Number(ev.coins) || Number(ev.diamonds) || 1;
      if (coins >= (Number(config.bigGiftCoins) || 99) && phase.name === 'vote') {
        addToast(`✂️🏆 ${p.name} tặng ${ev.giftName || 'quà'}: KÌM VÀNG tự cắt đúng!`, '#ffd54f');
        say(hLine('bigGift', { ten: p.name, gift: ev.giftName || 'quà' }), 2, 'tho-phao', 2500);
        decideCut(targetWire().i, p);
      } else {
        bomb.freeze = Math.min(30, bomb.freeze + (Number(config.giftFreezeSeconds) || 10));
        sfx.freeze();
        addToast(`🧊 ${p.name} tặng ${ev.giftName || 'quà'}: đóng băng đồng hồ!`, '#80deea');
        thank('thankGift', p, { gift: ev.giftName || 'quà' });
      }
      break;
    }
    default:
      break;
  }
}

const voiceBusy = () => now - lastSayAt < 2600;
function thank(kind, p, vars = {}) {
  if (lastThank[kind] && now - lastThank[kind] < 7000) return;
  lastThank[kind] = now;
  say(hLine(kind, { ten: p.name, ...vars }), 1, 'tho-phao', 1800);
}

function doLike(p, count) {
  if (!bomb || !['vote', 'suspense', 'cutAnim', 'enter'].includes(phase.name)) return;
  // tim = điện: mỗi tim cộng thêm thời gian sáng đèn cho bảng mạch
  const wasDark = bomb.light <= 0;
  const max = Number(config.lightMaxSeconds) || 12;
  bomb.light = Math.min(max, bomb.light + count * (Number(config.likeLightSeconds) || 0.5));
  bomb.likeSec.set(p.id, (bomb.likeSec.get(p.id) || 0) + count);
  if (wasDark) {
    sfx.click();
    floater(`💡 ${p.name} bật đèn`, '#fff59d', PANEL.x + 150 + rand(-20, 20), TIMER_BOX.y + TIMER_BOX.h + 10);
    if (!voiceBusy() && Math.random() < 0.5) thank('thankLike', p);
  } else if (!voiceBusy() && Math.random() < 0.1) thank('thankLike', p);
  // thả tim mà chưa chọn dây -> nhắc
  if (phase.name === 'vote' && !bomb.votes.has(p.id) && (bomb.likeSec.get(p.id) || 0) >= 15 && !p.nagged && phaseT() > 6 && !voiceBusy() && Math.random() < 0.3) {
    p.nagged = true;
    yell(hLine('likerNoVote', { ten: p.name }));
  }
}

function doBurn(p) {
  if (!bomb || !['vote', 'suspense', 'cutAnim'].includes(phase.name)) return;
  const n = bomb.burned.get(p.id) || 0;
  if (n >= (Number(config.burnMaxPerUser) || 1)) return;
  const floor = Number(config.burnFloorSeconds) || 6;
  if (bomb.left <= floor) return;
  bomb.burned.set(p.id, n + 1);
  const sec = Number(config.burnSeconds) || 3;
  bomb.left = Math.max(floor, bomb.left - sec);
  sfx.burn();
  floater(`-${sec}s 🔥 ${p.name}`, '#ffab40', PANEL.x + 150 + rand(-20, 20), TIMER_BOX.y + TIMER_BOX.h + 10);
  sparks(TIMER_BOX.x + 30, TIMER_BOX.y + TIMER_BOX.h / 2, 14, '#ffab40');
  addToast(`🔥 ${p.name} đốt ${sec} giây!`, '#ffab40');
  if (!bomb.lastBurnYell || now - bomb.lastBurnYell > 3500) {
    bomb.lastBurnYell = now;
    yell(hLine('burn', { ten: p.name }));
  }
}

// ------------------------------------------------------------------ cập nhật
let lastSec = -1;
function update(dt) {
  if (paused) return;
  shake = Math.max(0, shake - dt * 2.2);
  flash = Math.max(0, flash - dt * 1.6);
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    const age = (now - q.t0) / 1000;
    if (age > q.life) {
      particles.splice(i, 1);
      continue;
    }
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (q.kind === 'conf' || q.kind === 'spark') q.vy += 900 * dt;
    if (q.kind === 'smoke') {
      q.vx *= 0.96;
      q.vy = q.vy * 0.96 - 20 * dt;
    }
    if (q.kind === 'fire') {
      q.vx *= 0.9;
      q.vy *= 0.9;
    }
    if (q.rot != null) q.rot += q.vr * dt;
  }
  if (phase.name === 'boot') return;

  // đồng hồ bom
  const ticking = bomb && ['vote', 'suspense', 'cutAnim'].includes(phase.name);
  if (ticking) {
    if (bomb.freeze > 0) bomb.freeze = Math.max(0, bomb.freeze - dt);
    else bomb.left -= dt * speedMult();
    if (bomb.flashlight > 0) bomb.flashlight = Math.max(0, bomb.flashlight - dt);
    if (bomb.light > 0) bomb.light = Math.max(0, bomb.light - dt);
    if (bomb.light > 0) bomb.darkSince = now;
    const sec = Math.ceil(bomb.left);
    if (sec !== lastSec) {
      lastSec = sec;
      if (bomb.freeze <= 0) sfx.beep(bomb.left < 15);
      if (bomb.left < 10) sfx.heartbeat();
    }
    if (bomb.left < 0.6 && bomb.left > 0 && bomb.freeze <= 0 && !bomb.warned) {
      bomb.warned = true;
      say(line('timeUp'), 2, 'khoc', 1500);
    }
    if (bomb.left <= 0) {
      bomb.left = 0;
      explode();
      return;
    }
    sfx.setTension(1 - bomb.left / bomb.total + (speedMult() - 1) * 0.5);
    // tấm che của bom trùm: mở 2 giây trong mỗi 5 giây
    bomb.coverOpen = !bomb.cover || ((now / 1000) % 5) < 2 || bomb.flashlight > 0;
  } else sfx.setTension(phase.name === 'boom' ? 0 : 0.1);

  if (bomb) {
    // lúc boss vừa vào và lúc xong quả bom thì đèn sáng sẵn cho người xem thấy dây
    const lit = ['enter', 'saved', 'boom'].includes(phase.name) || bomb.light > 0;
    const k = Math.min(1, dt * (lit ? 6 : 2.5));
    bomb.lightShown += ((lit ? 1 : 0) - bomb.lightShown) * k;
  }
  if (phase.name === 'vote' && bomb.light <= 0 && now - bomb.darkSince > 5000 && now - (bomb.lastDarkNag || 0) > 14000 && !voiceBusy()) {
    bomb.lastDarkNag = now;
    yell(hLine('dark'));
  }
  if (phase.name === 'enter' && phaseLeft() <= 0) startVote();
  else if (phase.name === 'vote') {
    const c = tally();
    const total = c.reduce((a, b) => a + b, 0);
    const vt = phaseT();
    // chốt sớm khi đã đủ phiếu và một dây dẫn rõ ràng
    const early = Number(config.earlyCutVotes) || 0;
    if (early > 0 && total >= early && vt > 8) {
      const sorted = [...c].sort((a, b) => b - a);
      if (sorted[0] >= Math.max(early * 0.6, sorted[1] * 2 + 1)) phase.until = now;
    }
    if (vt > 9 && total === 0 && !bomb.scoldedFew) {
      bomb.scoldedFew = true;
      yell(hLine('noVote'));
    } else if (vt > 9 && total > 0 && total < 3 && !bomb.scoldedFew && phaseLeft() < 9) {
      bomb.scoldedFew = true;
      yell(hLine('fewVotes', { n: total }));
    }
    if (total >= 4 && !bomb.scoldedSplit && phaseLeft() < 7) {
      const s = [...c].sort((a, b) => b - a);
      if (s[0] - s[1] <= 1) {
        bomb.scoldedSplit = true;
        yell(hLine('split'));
      }
    }
    if (phaseLeft() <= 0) {
      if (!decideCut()) {
        yell(hLine('noVote'));
        startVote();
      }
    }
  } else if (phase.name === 'suspense' && phaseLeft() <= 0) doCut();
  else if (phase.name === 'cutAnim' && phaseLeft() <= 0) {
    if (bomb.stage < bomb.n && bomb.wrongs < (Number(config.maxWrong) || 3)) startVote();
  } else if ((phase.name === 'saved' || phase.name === 'boom') && phaseLeft() <= 0) startBomb();

  // boss nói một mình theo tâm trạng
  const gap = Math.max(5, Number(config.chatterSeconds) || 9) * 1000;
  if (phase.name === 'vote' && now - lastSayAt > gap && now - lastChatter > gap) {
    lastChatter = now;
    const e = baseExpr();
    const kind = e === 'khoc' ? 'cry' : e === 'hot-hoang' ? 'panic' : e === 'lo-lang' ? 'worried' : Math.random() < 0.3 ? 'reminder' : 'calm';
    const top = [...players.values()].filter((p) => p.lastActive && now - p.lastActive < 60000);
    say(kind === 'reminder' ? line('reminder') : hLine(kind, { ten: top.length ? pick(top).name : 'cả nhà' }), 0, kind === 'panic' ? 'mang' : null, 2500);
  }
  if (smoke > 0 && phase.name !== 'boom') smoke = Math.max(0, smoke - dt * 0.5);
}

// biểu cảm theo đồng hồ (khi không có cảm xúc tức thời)
function baseExpr() {
  if (!bomb) return 'tu-tin';
  const frac = bomb.left / bomb.total;
  if (bomb.left <= 10) return 'khoc';
  if (frac < 0.3 || bomb.wrongs >= 2) return 'hot-hoang';
  if (frac < 0.6 || bomb.wrongs === 1) return 'lo-lang';
  return 'tu-tin';
}
function currentExpr() {
  if (phase.name === 'boom') return phaseT() > 0.5 ? 'bi-no' : 'hot-hoang';
  if (phase.name === 'saved') return 'tho-phao';
  if (phase.name === 'suspense') return bomb && bomb.golden ? 'tho-phao' : 'cau-nguyen';
  if (phase.name === 'enter') return phaseT() < 1.2 ? 'hot-hoang' : 'lo-lang';
  if (mood && now < mood.until) return mood.expr;
  return baseExpr();
}

// ------------------------------------------------------------------ vẽ
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#241a3a');
  g.addColorStop(0.5, '#160f26');
  g.addColorStop(1, '#0b0814');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // tường gạch mờ
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = '#d7c4ff';
  ctx.lineWidth = 2;
  for (let y = 160; y < 1000; y += 46) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    const off = (y / 46) % 2 ? 0 : 60;
    for (let x = off; x < W; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 46);
      ctx.stroke();
    }
  }
  ctx.restore();
  // đèn treo chiếu xuống con tin
  const lx = 330;
  const sway = Math.sin(now / 1400) * 18;
  ctx.save();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(lx, 150);
  ctx.lineTo(lx + sway, 215);
  ctx.stroke();
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.moveTo(lx + sway - 38, 240);
  ctx.lineTo(lx + sway + 38, 240);
  ctx.lineTo(lx + sway + 16, 212);
  ctx.lineTo(lx + sway - 16, 212);
  ctx.closePath();
  ctx.fill();
  const cone = ctx.createRadialGradient(lx + sway, 240, 10, lx + sway * 2, 700, 520);
  const danger = bomb && phase.name !== 'saved' ? clamp(1 - bomb.left / bomb.total, 0, 1) : 0;
  cone.addColorStop(0, `rgba(255,${Math.round(236 - danger * 120)},${Math.round(170 - danger * 120)},0.38)`);
  cone.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(lx + sway - 30, 240);
  ctx.lineTo(lx + sway + 30, 240);
  ctx.lineTo(lx + sway * 2 + 330, 990);
  ctx.lineTo(lx + sway * 2 - 330, 990);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff8e1';
  ctx.beginPath();
  ctx.arc(lx + sway, 242, 10, 0, TAU);
  ctx.fill();
  ctx.restore();
  // sàn
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(330, 932, 260, 34, 0, 0, TAU);
  ctx.fill();
  // đèn đỏ cảnh báo nhấp nháy khi gấp
  if (bomb && ['vote', 'suspense', 'cutAnim'].includes(phase.name) && (bomb.left < 20 || bomb.wrongs >= 2)) {
    const a = (Math.sin(now / 160) + 1) / 2;
    ctx.fillStyle = `rgba(255,0,0,${0.06 + a * 0.1})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function chip(x, y, text, bg, fg = '#fff', size = 30) {
  ctx.font = `800 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + size;
  ctx.fillStyle = bg;
  rr(x, y, w, size * 1.5, size * 0.75);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + size / 2, y + size * 0.77);
  return w;
}

function drawHeader() {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 150);
  g.addColorStop(0, 'rgba(0,0,0,0.75)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 160);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 64px ${FONT}`;
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#3b0000';
  ctx.strokeText(config.title, W / 2, 56);
  const tg = ctx.createLinearGradient(0, 24, 0, 90);
  tg.addColorStop(0, '#fff176');
  tg.addColorStop(1, '#ff7043');
  ctx.fillStyle = tg;
  ctx.fillText(config.title, W / 2, 56);
  let x = 40;
  x += chip(x, 104, `💣 Bom ${bombNo} · ${bomb && bomb.boss ? 'TRÙM' : `Cấp ${bomb ? bomb.level : level}`}`, bomb && bomb.boss ? '#b71c1c' : 'rgba(255,255,255,0.14)', '#fff', 26) + 12;
  x += chip(x, 104, `🐾 Đã cứu ${saved}`, 'rgba(46,125,50,0.85)', '#fff', 26) + 12;
  chip(x, 104, `💥 Nổ ${exploded}`, 'rgba(191,54,12,0.85)', '#fff', 26);
  ctx.restore();
}

function drawHostage() {
  if (!hostage) return;
  const expr = currentExpr();
  let rec = hostageImg(hostage, expr);
  if (!rec.ready) rec = hostageImg(hostage, 'lo-lang');
  const baseX = 330;
  const footY = 928;
  let x = baseX;
  let alpha = 1;
  if (phase.name === 'enter') {
    const t = ease(phaseT() / 0.9);
    x = -300 + (baseX + 300) * t;
  }
  if (phase.name === 'saved' && phaseT() > 4.6) {
    const t = clamp((phaseT() - 4.6) / 1.6, 0, 1);
    x = baseX + t * t * 900;
  }
  if (phase.name === 'boom' && phaseLeft() < 1) alpha = phaseLeft();
  const panic = expr === 'hot-hoang' || expr === 'khoc' || expr === 'mang';
  const breathe = Math.sin(now / 420) * (panic ? 0.02 : 0.012);
  let jx = 0;
  let jy = 0;
  if (panic) {
    const amp = expr === 'khoc' ? 6 : 4;
    jx = rand(-amp, amp);
    jy = rand(-amp * 0.5, amp * 0.5);
  }
  if (expr === 'mang' && mood && now < mood.until) {
    const k = 1 - (mood.until - now) / 2600;
    jx += Math.sin(k * 40) * 8;
  }
  if (phase.name === 'saved' && phaseT() < 4.6) jy = -Math.abs(Math.sin(phaseT() * 6)) * 40;
  const hh = 760;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + jx, footY + jy);
  ctx.scale(1 + breathe, 1 - breathe);
  if (rec.ready) {
    const ww = (rec.img.width / rec.img.height) * hh;
    ctx.drawImage(rec.img, -ww / 2, -hh, ww, hh);
  } else {
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.ellipse(0, -380, 180, 300, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // giọt mồ hôi bay ra khi lo lắng/hốt hoảng
  if ((expr === 'lo-lang' || expr === 'hot-hoang' || expr === 'khoc') && Math.random() < (expr === 'lo-lang' ? 0.04 : 0.12)) {
    const side = Math.random() < 0.5 ? -1 : 1;
    addParticle({ kind: 'drop', x: x + side * rand(110, 170), y: footY - hh + rand(120, 240), vx: side * rand(60, 160), vy: rand(-200, -60), life: 0.9, size: rand(9, 14), color: '#81d4fa' });
  }
  // áo giáp/khói đen sau khi nổ: phủ muội
  if (phase.name === 'boom' && phaseT() > 0.5) {
    ctx.save();
    ctx.globalAlpha = 0.25 * alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, footY - hh * 0.62, 200, 260, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    if (Math.random() < 0.2) addParticle({ kind: 'smoke', x: x + rand(-80, 80), y: footY - hh * 0.75, vx: rand(-20, 20), vy: rand(-90, -40), life: 2, size: rand(30, 60), color: '#555' });
  }
  // tên boss
  if (phase.name !== 'boom' || phaseT() > 1) {
    ctx.save();
    ctx.font = `800 34px ${FONT}`;
    const t = `🐾 ${hostage.name}`;
    const w = ctx.measureText(t).width + 40;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    rr(x - w / 2, footY + 6, w, 52, 26);
    ctx.fill();
    ctx.fillStyle = '#ffe082';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t, x, footY + 33);
    ctx.restore();
  }
}

function drawBubble() {
  const on = bubbleText && now - bubbleAt < Math.min(7000, 2600 + bubbleText.length * 60);
  if (!on) return;
  const age = (now - bubbleAt) / 1000;
  const s = ease(age / 0.18);
  const bx = 600;
  const by = 360;
  const bw = 440;
  const bh = 250;
  const yelling = currentExpr() === 'mang' || currentExpr() === 'hot-hoang' || currentExpr() === 'khoc';
  ctx.save();
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.scale(s, s);
  if (yelling) ctx.rotate(Math.sin(now / 50) * 0.012);
  ctx.translate(-bw / 2, -bh / 2);
  ctx.fillStyle = yelling ? '#fff3e0' : '#ffffff';
  ctx.strokeStyle = yelling ? '#e53935' : '#263238';
  ctx.lineWidth = 6;
  rr(0, 0, bw, bh, 34);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, bh * 0.55);
  ctx.lineTo(-70, bh * 0.75);
  ctx.lineTo(16, bh * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(12, bh * 0.56, 12, bh * 0.18);
  const ft = fitText(bubbleText, 800, yelling ? 46 : 42, 24, bw - 50, bh - 40, 5);
  ctx.fillStyle = yelling ? '#b71c1c' : '#1a237e';
  ctx.font = ft.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lh = ft.size * 1.2;
  ft.lines.forEach((l, i) => ctx.fillText(l, bw / 2, bh / 2 + (i - (ft.lines.length - 1) / 2) * lh));
  ctx.restore();
}

function drawVillain() {
  const x = 790;
  const y = 170;
  const w = 250;
  const h = 170;
  ctx.save();
  ctx.fillStyle = '#212121';
  rr(x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = '#616161';
  ctx.lineWidth = 5;
  ctx.stroke();
  const scr = ctx.createLinearGradient(0, y + 12, 0, y + h - 30);
  scr.addColorStop(0, '#3e1f47');
  scr.addColorStop(1, '#14081a');
  ctx.fillStyle = scr;
  rr(x + 12, y + 12, w - 24, h - 46, 10);
  ctx.fill();
  const talking = tauntText && now - tauntAt < 4500;
  const bob = talking ? Math.sin(now / 90) * 4 : Math.sin(now / 600) * 2;
  ctx.font = `${86}px "Segoe UI Emoji", "Apple Color Emoji", ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('😈', x + w / 2 - 50, y + 68 + bob);
  ctx.font = `${54}px "Segoe UI Emoji", "Apple Color Emoji", ${FONT}`;
  ctx.fillText('🧪', x + w / 2 + 62, y + 76 - bob);
  // nhiễu màn hình
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 12, y + 12 + ((now / 7 + i * 23) % (h - 46)), w - 24, 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff5252';
  ctx.font = `900 24px ${FONT}`;
  ctx.fillText('TIẾN SĨ NỔ', x + w / 2, y + h - 18);
  if (talking) {
    const ft = fitText(tauntText, 800, 26, 18, 400, 74, 2);
    const tw = 430;
    ctx.fillStyle = 'rgba(183,28,28,0.92)';
    rr(x + w - tw, y + h + 10, tw, 90, 16);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = ft.font;
    ft.lines.forEach((l, i) => ctx.fillText(l, x + w - tw / 2, y + h + 55 + (i - (ft.lines.length - 1) / 2) * ft.size * 1.2));
  }
  ctx.restore();
}

function drawLeaderboard() {
  const top = [...players.values()].filter((p) => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  const x = 650;
  const y = 640;
  const w = 390;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  rr(x, y, w, 60 + Math.max(1, top.length) * 56, 22);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.font = `900 28px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏅 Chuyên gia gỡ bom', x + 18, y + 32);
  if (!top.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText('Cắt đúng dây để lên bảng!', x + 18, y + 86);
  }
  top.forEach((p, i) => {
    const yy = y + 86 + i * 56;
    drawAvatar(x + 42, yy, 22, p, i === 0 ? '#ffd54f' : '#fff');
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`${p.armor ? '🛡️' : ''}${shortName(p.name).slice(0, 14)}`, x + 74, yy);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffe082';
    ctx.fillText(`${p.score}${p.streak >= 2 ? ` 🔥${p.streak}` : ''}`, x + w - 18, yy);
  });
  ctx.restore();
}

function wireStroke(path, from, to, color, width, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(path[from].x, path[from].y);
  for (let i = from + 1; i <= to; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = width + 8;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = width * 0.3;
  ctx.stroke();
  ctx.restore();
}

function drawPanel() {
  if (!bomb) return;
  const P = PANEL;
  let ox = 0;
  if (phase.name === 'enter') ox = (1 - ease(phaseT() / 1.1)) * 1100;
  if (phase.name === 'saved' && phaseT() > 5) ox = -ease((phaseT() - 5) / 1.5) * 1100;
  ctx.save();
  ctx.translate(ox, 0);
  // khung kim loại
  const mg = ctx.createLinearGradient(P.x, P.y, P.x + P.w, P.y + P.h);
  mg.addColorStop(0, '#4b4f63');
  mg.addColorStop(1, '#262838');
  ctx.fillStyle = mg;
  rr(P.x, P.y, P.w, P.h, 30);
  ctx.fill();
  ctx.strokeStyle = bomb.boss ? '#ff5252' : '#8c92b0';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#10121c';
  rr(P.x + 22, P.y + 206, P.w - 44, P.h - 228, 20);
  ctx.fill();
  for (const [sx, sy] of [[P.x + 24, P.y + 24], [P.x + P.w - 24, P.y + 24], [P.x + 24, P.y + P.h - 24], [P.x + P.w - 24, P.y + P.h - 24]]) {
    ctx.fillStyle = '#9aa0b8';
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, TAU);
    ctx.fill();
  }
  drawTimer();

  // dây
  const ws = bomb.wires;
  const target = targetWire();
  for (const d of bomb.decoys || []) {
    wireStroke(d.path, 0, d.path.length - 1, d.color, 14);
    for (const e of [d.path[0], d.path[d.path.length - 1]]) {
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 11, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  for (const w of ws) {
    const n = w.path.length;
    if (w.cut) {
      const cutIdx = Math.floor(n * 0.1);
      const sag = Math.min(1, (now - w.cutT) / 500);
      ctx.save();
      ctx.translate(0, sag * 10);
      wireStroke(w.path, cutIdx + 2, n - 1, '#5d6070', 12, 0.7);
      ctx.restore();
      wireStroke(w.path, 0, cutIdx - 2, '#5d6070', 12, 0.7);
      continue;
    }
    const hl = phase.name === 'suspense' && bomb.cutWire === w.i ? 0.5 + 0.5 * Math.sin(now / 70) : 0;
    wireStroke(w.path, 0, n - 1, w.color, 14);
    if (hl > 0) wireStroke(w.path, 0, n - 1, '#ffffff', 6, hl);
    if (w.wrongCut) {
      // dây cắt nhầm được quấn băng keo lại
      const cp = w.path[Math.floor(n * 0.1)];
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.rotate(0.3);
      ctx.fillStyle = now - w.cutT < 1500 && Math.floor(now / 120) % 2 ? '#ff1744' : '#cfd8dc';
      rr(-22, -12, 44, 24, 6);
      ctx.fill();
      ctx.restore();
    }
  }
  // đèn pin soi nửa dưới dây đúng
  if (bomb.flashlight > 0 && target) {
    const n = target.path.length;
    const a = Math.min(1, bomb.flashlight / 1) * (0.6 + 0.4 * Math.sin(now / 90));
    wireStroke(target.path, Math.floor(n * 0.5), n - 1, '#fffde7', 8, a);
    const end = target.path[n - 1];
    const g = ctx.createRadialGradient(end.x, end.y - 120, 10, end.x, end.y - 120, 260);
    g.addColorStop(0, `rgba(255,253,200,${0.35 * a})`);
    g.addColorStop(1, 'rgba(255,253,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(end.x - 260, end.y - 380, 520, 520);
  }
  // bảng mạch tối: chỉ thấy dây khi có đèn (thả tim)
  const dark = (1 - bomb.lightShown) * clamp(Number(config.darkness) || 0.94, 0, 1);
  if (dark > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(4,5,10,${dark})`;
    rr(PANEL.x + 24, TOP_Y + 14, PANEL.w - 48, BOT_Y - TOP_Y - 40, 18);
    ctx.fill();
    if (dark > 0.5 && ['vote', 'suspense'].includes(phase.name)) {
      const pulse = 0.75 + 0.25 * Math.sin(now / 160);
      ctx.globalAlpha = Math.min(1, (dark - 0.5) * 2.2) * pulse;
      ctx.fillStyle = '#fff';
      ctx.font = `900 54px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cy = (WIRE_TOP + WIRE_BOT) / 2;
      ctx.fillText('🌑 TỐI THUI!', AREA.x + AREA.w / 2, cy - 40);
      ctx.fillStyle = '#ff80ab';
      ctx.font = `900 46px ${FONT}`;
      ctx.fillText('Thả tim ❤️ để bật đèn', AREA.x + AREA.w / 2, cy + 30);
    }
    ctx.restore();
  }
  // tấm che của bom trùm
  if (bomb.cover && !bomb.coverOpen) {
    const cy = WIRE_TOP + (WIRE_BOT - WIRE_TOP) * 0.3;
    const ch = (WIRE_BOT - WIRE_TOP) * 0.4;
    ctx.fillStyle = '#37474f';
    rr(AREA.x - 30, cy, AREA.w + 60, ch, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,235,59,0.85)';
    for (let x = AREA.x - 30; x < AREA.x + AREA.w + 30; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x + 30, cy);
      ctx.lineTo(x + 10, cy + 24);
      ctx.lineTo(x - 20, cy + 24);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = `900 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TẤM CHE · mở lại sau giây lát', AREA.x + AREA.w / 2, cy + ch / 2 + 10);
  }

  // ổ chữ phía trên + phiếu
  const c = tally();
  const maxV = Math.max(1, ...c);
  for (const w of ws) {
    const x = slotX(w.i, bomb.n);
    const y = TOP_Y;
    const v = c[w.i] || 0;
    const lead = v > 0 && v === maxV && phase.name === 'vote';
    ctx.save();
    ctx.fillStyle = w.cut ? '#424242' : lead ? '#ffca28' : '#1e88e5';
    ctx.shadowColor = lead ? '#ffca28' : 'rgba(0,0,0,0)';
    ctx.shadowBlur = lead ? 30 : 0;
    ctx.beginPath();
    ctx.arc(x, y - 22, 46, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#e3f2fd';
    ctx.stroke();
    ctx.fillStyle = w.cut ? '#9e9e9e' : lead ? '#3e2723' : '#fff';
    ctx.font = `900 50px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LETTERS[w.i], x, y - 20);
    if (!w.cut && v > 0 && (phase.name === 'vote' || phase.name === 'suspense')) {
      // số phiếu: huy hiệu nhỏ góc trên phải chữ
      ctx.fillStyle = lead ? '#e53935' : '#263238';
      ctx.beginPath();
      ctx.arc(x + 42, y - 62, 26, 0, TAU);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${v > 99 ? 20 : 26}px ${FONT}`;
      ctx.fillText(String(v), x + 42, y - 61);
      // avatar người vừa chọn
      const last = votersOf(w.i).slice(-1)[0];
      if (last) drawAvatar(x - 44, y - 64, 18, last, '#fff');
    }
    ctx.restore();
    ctx.fillStyle = w.cut ? '#5d6070' : w.color;
    ctx.beginPath();
    ctx.arc(x, y + 18, 10, 0, TAU);
    ctx.fill();
  }
  // cọc phía dưới
  for (let t = 0; t < bomb.n; t++) {
    const x = slotX(t, bomb.n);
    const y = BOT_Y;
    const done = t < bomb.stage;
    const active = t === bomb.stage && phase.name !== 'saved';
    ctx.save();
    if (active) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 160);
      ctx.shadowColor = '#e3f2fd';
      ctx.shadowBlur = 20 + pulse * 30;
    }
    ctx.fillStyle = done ? '#43a047' : active ? '#e3f2fd' : '#616161';
    ctx.beginPath();
    ctx.arc(x, y + 8, 40, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = done ? '#a5d6a7' : active ? '#42a5f5' : '#9e9e9e';
    ctx.stroke();
    ctx.font = `900 40px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = done ? '#fff' : active ? '#0d47a1' : '#e0e0e0';
    ctx.fillText(done ? '✓' : active ? String(t + 1) : '🔒', x, y + 10);
    ctx.restore();
    if (active && phase.name === 'vote') {
      ctx.save();
      ctx.fillStyle = '#fff59d';
      ctx.font = `900 26px ${FONT}`;
      ctx.textAlign = 'center';
      const bounce = Math.abs(Math.sin(now / 250)) * 10;
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText('▼ dây nào vào đây?').width + 24;
      const tx = clamp(x, PANEL.x + 40 + tw / 2, PANEL.x + PANEL.w - 40 - tw / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      rr(tx - tw / 2, y - 80 - bounce, tw, 40, 20);
      ctx.fill();
      ctx.fillStyle = '#fff59d';
      ctx.fillText('▼ dây nào vào đây?', tx, y - 59 - bounce);
      ctx.restore();
    }
  }
  // kéo cắt
  if ((phase.name === 'suspense' || (phase.name === 'cutAnim' && now - bomb.cutAt < 600)) && bomb.cutWire >= 0) {
    const w = ws[bomb.cutWire];
    const cp = w.path[Math.floor(w.path.length * 0.1)];
    const t = phase.name === 'suspense' ? ease(phaseT() / Math.max(0.4, Number(config.suspenseSeconds) || 2.2)) : 1;
    const sx = cp.x + 260 * (1 - t);
    const sy = cp.y - 40 * (1 - t);
    const open = phase.name === 'suspense' ? 0.35 + 0.25 * Math.sin(now / 80) : 0;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.font = `${78}px "Segoe UI Emoji", "Apple Color Emoji", ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.rotate(-0.6 + open);
    ctx.fillText(bomb.golden ? '🏆' : '✂️', 0, 0);
    ctx.restore();
  }
  // chữ ĐÚNG / SAI
  if (phase.name === 'cutAnim' && now - bomb.cutAt < 1500) {
    const k = ease((now - bomb.cutAt) / 300);
    ctx.save();
    ctx.translate(P.x + P.w / 2, P.y + P.h / 2);
    ctx.scale(k, k);
    ctx.font = `900 120px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#000';
    const t = bomb.cutOk ? 'ĐÚNG RỒI!' : 'SAI RỒI!';
    ctx.strokeText(t, 0, 0);
    ctx.fillStyle = bomb.cutOk ? '#69f0ae' : '#ff5252';
    ctx.fillText(t, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function fmt(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function drawTimer() {
  const T = TIMER_BOX;
  const urgent = bomb.left < 15;
  ctx.save();
  ctx.fillStyle = '#e8d9a8';
  rr(T.x - 10, T.y - 10, T.w + 20, T.h + 20, 22);
  ctx.fill();
  ctx.fillStyle = '#3a0505';
  rr(T.x, T.y, T.w, T.h, 16);
  ctx.fill();
  ctx.font = `900 104px ${DIGIT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,60,60,0.12)';
  ctx.fillText('8:88', T.x + T.w / 2, T.y + T.h / 2 + 4);
  const blink = urgent && Math.floor(now / 250) % 2 === 0;
  ctx.shadowColor = bomb.freeze > 0 ? '#80deea' : '#ff1744';
  ctx.shadowBlur = 24;
  ctx.fillStyle = bomb.freeze > 0 ? '#b2ebf2' : blink ? '#ffcdd2' : '#ff3d3d';
  const sc = urgent ? 1 + 0.06 * Math.abs(Math.sin(now / 120)) : 1;
  ctx.translate(T.x + T.w / 2, T.y + T.h / 2 + 4);
  ctx.scale(sc, sc);
  ctx.fillText(fmt(bomb.left), 0, 0);
  ctx.restore();
  // tốc độ + số lần sai + băng
  ctx.save();
  ctx.textBaseline = 'middle';
  const sp = speedMult();
  if (sp > 1) {
    ctx.fillStyle = Math.floor(now / 200) % 2 ? '#ff1744' : '#ff8a80';
    ctx.font = `900 40px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`⏩ x${sp}`, T.x + T.w + 24, T.y + 44);
  }
  ctx.textAlign = 'left';
  ctx.font = `800 30px ${FONT}`;
  const mw = Number(config.maxWrong) || 3;
  let hearts = '';
  for (let i = 0; i < mw; i++) hearts += i < mw - bomb.wrongs ? '❤️' : '🖤';
  ctx.fillStyle = '#fff';
  ctx.fillText(hearts, T.x + T.w + 24, T.y + 100);
  if (bomb.freeze > 0) {
    ctx.fillStyle = '#80deea';
    ctx.font = `900 32px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`🧊 ${Math.ceil(bomb.freeze)}s`, T.x + T.w + 24, T.y + 44);
  }
  {
    // đồng hồ pin đèn
    const max = Number(config.lightMaxSeconds) || 12;
    const f = clamp(bomb.light / max, 0, 1);
    const bx = T.x - 190, by = T.y + 78, bw = 150, bh = 26;
    ctx.fillStyle = bomb.light > 0 ? '#fff59d' : '#9e9e9e';
    ctx.font = `900 32px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(bomb.light > 0 ? '💡 Đèn' : '🌑 Tắt', bx, T.y + 50);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(bx, by, bw, bh, 13);
    ctx.fill();
    if (f > 0) {
      ctx.fillStyle = f < 0.25 && Math.floor(now / 200) % 2 ? '#ff8a65' : '#ffee58';
      rr(bx, by, Math.max(bh, bw * f), bh, 13);
      ctx.fill();
    }
  }
  if (phase.name === 'vote') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `800 28px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`Cọc ${bomb.stage + 1}/${bomb.n} · chốt phiếu sau ${Math.ceil(phaseLeft())}s`, PANEL.x + PANEL.w / 2, T.y + T.h + 30);
  }
  ctx.restore();
}

function drawBottom() {
  const tips = [
    '💬 Comment A, B, C, D để cắt dây',
    '❤️ Thả tim: bật đèn để thấy dây',
    '🔥 Comment "đốt": trừ giây (đội Phá)',
    '📣 Chia sẻ: cộng thêm giây',
    '⭐ Theo dõi: áo giáp chống nổ',
  ];
  const i = Math.floor(now / 3500) % tips.length;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  rr(40, 1820, W - 80, 76, 38);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `800 36px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tips[i], W / 2, 1859);
  ctx.restore();
}

function drawParticles() {
  for (const q of particles) {
    const age = (now - q.t0) / 1000;
    const k = age / q.life;
    ctx.save();
    if (q.kind === 'smoke') {
      ctx.globalAlpha = (1 - k) * 0.85;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.size * (0.6 + k * 0.8), 0, TAU);
      ctx.fill();
    } else if (q.kind === 'fire') {
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.size * (1 - k * 0.5), 0, TAU);
      ctx.fill();
    } else if (q.kind === 'conf') {
      ctx.globalAlpha = 1 - Math.max(0, k - 0.7) / 0.3;
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.fillStyle = q.color;
      ctx.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2);
    } else if (q.kind === 'drop') {
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.ellipse(q.x, q.y, q.size * 0.6, q.size, Math.atan2(q.vy, q.vx) + Math.PI / 2, 0, TAU);
      ctx.fill();
      q.vy += 15;
    } else {
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.size, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFloaters() {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    const age = (now - f.t0) / 1000;
    if (age > 1.8) {
      floaters.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = 1 - Math.max(0, age - 1.2) / 0.6;
    ctx.font = `900 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000';
    ctx.strokeText(f.text, f.x, f.y - age * 70);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - age * 70);
    ctx.restore();
  }
}

function drawToasts() {
  const list = toasts.filter((t) => now - t.t0 < 4500);
  list.forEach((t, i) => {
    const age = (now - t.t0) / 1000;
    const a = Math.min(1, age * 4) * Math.min(1, (4.5 - age) * 2);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `800 30px ${FONT}`;
    const w = Math.min(560, ctx.measureText(t.text).width + 50);
    const y = 990 - (list.length - i) * 58;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    rr(W - 40 - w, y, w, 50, 25);
    ctx.fill();
    ctx.fillStyle = t.color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.text, W - 65, y + 26, w - 40);
    ctx.restore();
  });
}

function drawOverlay() {
  if (phase.name === 'boom') {
    const t = phaseT();
    if (t < 2.4) {
      const k = ease(t / 0.35);
      ctx.save();
      ctx.translate(W / 2, 760);
      ctx.scale(0.5 + k, 0.5 + k);
      ctx.rotate(Math.sin(t * 30) * 0.04);
      ctx.font = `900 190px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 20;
      ctx.strokeStyle = '#3e0000';
      ctx.strokeText('BÙM!', 0, 0);
      const g = ctx.createLinearGradient(0, -90, 0, 90);
      g.addColorStop(0, '#fff176');
      g.addColorStop(1, '#ff3d00');
      ctx.fillStyle = g;
      ctx.fillText('BÙM!', 0, 0);
      ctx.restore();
    }
    if (t > 2.6) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (t - 2.6) * 3);
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      rr(80, 1180, W - 160, 300, 30);
      ctx.fill();
      ctx.fillStyle = '#ff8a65';
      ctx.font = `900 60px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`💥 ${hostage ? hostage.name : 'Boss'} đã bị nổ!`, W / 2, 1260);
      ctx.fillStyle = '#fff';
      ctx.font = `700 36px ${FONT}`;
      ctx.fillText('Boss tiếp theo đang bị trói vào...', W / 2, 1340);
      ctx.fillText('Thả tim, chia sẻ để cứu boss sau nhé!', W / 2, 1400);
      ctx.restore();
    }
  }
  if (phase.name === 'saved') {
    const t = phaseT();
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 3);
    ctx.fillStyle = 'rgba(0,40,10,0.82)';
    rr(80, 1100, W - 160, 520, 30);
    ctx.fill();
    ctx.fillStyle = '#b9f6ca';
    ctx.font = `900 62px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🎉 ĐÃ CỨU ${hostage ? hostage.name.toUpperCase() : 'BOSS'}!`, W / 2, 1180, W - 200);
    ctx.fillStyle = '#fff';
    ctx.font = `700 34px ${FONT}`;
    ctx.fillText('Ân nhân cắt đúng dây:', W / 2, 1260);
    const list = bomb && bomb.mvpList ? bomb.mvpList : [];
    if (!list.length) ctx.fillText('Cả phòng cùng góp sức!', W / 2, 1340);
    list.forEach((p, i) => {
      const y = 1330 + i * 56;
      drawAvatar(W / 2 - 220, y, 22, p, i === 0 ? '#ffd54f' : '#fff');
      ctx.fillStyle = i === 0 ? '#ffd54f' : '#fff';
      ctx.font = `800 30px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(`${i === 0 ? '👑 ' : ''}${p.name}`, W / 2 - 185, y);
      ctx.textAlign = 'right';
      ctx.fillText(`${p.score} điểm`, W / 2 + 260, y);
      ctx.textAlign = 'center';
    });
    ctx.restore();
  }
  if (phase.name === 'enter' && bomb && bomb.boss) {
    ctx.save();
    const a = Math.min(1, phaseT() * 2) * Math.min(1, phaseLeft() * 2);
    ctx.globalAlpha = a;
    ctx.font = `900 96px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#000';
    ctx.strokeText('⚠️ BOM TRÙM ⚠️', W / 2, 1400);
    ctx.fillStyle = '#ff1744';
    ctx.fillText('⚠️ BOM TRÙM ⚠️', W / 2, 1400);
    ctx.restore();
  }
}

let lastFrame = performance.now();
let audioBlocked = false;
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastFrame) / 1000) * SPEED;
  lastFrame = ts;
  now = ts;
  update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawBackground();
  ctx.save();
  if (shake > 0) ctx.translate(rand(-10, 10) * shake, rand(-10, 10) * shake);
  drawLeaderboard();
  drawHostage();
  drawPanel();
  drawParticles();
  drawVillain();
  drawBubble();
  drawFloaters();
  drawToasts();
  drawOverlay();
  ctx.restore();
  drawHeader();
  drawBottom();
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = `900 70px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('⏸ TẠM DỪNG', W / 2, H / 2);
  }
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,250,230,${flash * 0.7})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (audioBlocked && !PREVIEW) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(W / 2 - 250, 1740, 500, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔇 Bấm vào game để bật tiếng', W / 2, 1769);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ kết nối
let ws = null;
function sendState() {
  if (PREVIEW || !ws || ws.readyState !== 1 || !bomb) return;
  const t = targetWire();
  ws.send(JSON.stringify({
    cmd: 'gameState',
    state: {
      bomb: bombNo, boss: bomb.boss, level, levelMode: config.levelMode, levels: levelCount(), hostage: hostage ? hostage.name : '', phase: phase.name, stage: bomb.stage + 1, wires: bomb.n,
      answer: t ? LETTERS[t.i] : '', left: Math.ceil(bomb.left), wrongs: bomb.wrongs, saved, exploded, counts: tally(), players: players.size,
    },
  }));
}
function connectWs() {
  if (location.protocol === 'file:') return;
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onopen = () => sendState();
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'status' || msg.type === 'log' || msg.type === 'gameState' || msg.type === 'audio' || msg.type === 'audioTest') return;
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
setInterval(sendState, 1000);

async function boot() {
  try {
    const res = await fetch('/go-bom-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  if (params.get('sound') === '0') config.sound = false;
  if (params.get('voice') === '0') config.voice = false;
  if (params.get('music') === '0') config.music = false;
  sfx.setSoundEnabled(config.sound !== false);
  voice.setSoundEnabled(config.sound !== false);
  voice.setVoiceEnabled(config.voice !== false);
  voice.setVoiceEngine(params.get('engine') || config.voiceEngine);
  voice.setOnSpeakStart((text) => sfx.duck(Math.min(9000, 1500 + String(text).length * 75)));
  let files = Array.isArray(config.musicFiles) ? config.musicFiles.filter(Boolean) : [];
  try {
    const r = await fetch('/go-bom-music.json', { cache: 'no-store' });
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
  level = clamp(Number(config.startLevel) || 1, 1, levelCount());
  startBomb();
  connectWs();
  requestAnimationFrame(frame);
}

window.__goBom = {
  handleEvent, config: () => config,
  state: () => ({ phase: phase.name, level, bombNo, boss: bomb?.boss, stage: bomb?.stage, n: bomb?.n, answer: targetWire()?.i, left: bomb?.left, wrongs: bomb?.wrongs, saved, exploded, hostage: hostage?.id, expr: currentExpr() }),
  setLeft: (s) => { if (bomb) bomb.left = s; },
};
boot();
