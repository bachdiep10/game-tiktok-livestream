// Game TikTok LIVE "Bạn có giỏi hơn học sinh lớp 5?": lớp học trắc nghiệm A/B/C/D.
// - Mọi người xem cùng trả lời bằng bình luận A, B, C, D. Ô đáp án hiện số người chọn + avatar.
// - Hết giờ: khoá đáp án, đếm ngược 5-4-3-2-1 (đèn chạy vòng qua 4 ô), rồi lật đáp án.
// - Nhóm đúng cùng ăn mừng, nhóm sai cùng "dính đòn" (phấn bay, ô sập, trứng, gà trống, sét, gọi phụ huynh, mũ học lại).
// - Lớp 5A có 6 bạn do máy điều khiển (Na, Tí, Bin, Tèo, Mai, Cu Tũn) thi với người xem, để LIVE vắng vẫn vui.
// - Like: đánh thức nhân vật, đủ số like trong 1 câu thì Na nhắc loại 1 đáp án sai. Share: thẻ miễn phạt (ô che đầu).
//   Follow: khăn quàng + điểm. Quà: thẻ miễn phạt, quà lớn làm Lớp trưởng (x2 điểm cả tiết).
import { CAU_HOI } from './cauHoi.js';
import * as sfx from './lhAudio.js';
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
const CHALK = '"Segoe Print", "Comic Sans MS", "Segoe UI", sans-serif';
const LETTERS = ['A', 'B', 'C', 'D'];
const OPT_COLORS = ['#1e88e5', '#43a047', '#fb8c00', '#8e24aa'];

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'BẠN CÓ GIỎI HƠN HỌC SINH LỚP 5?',
  className: 'Lớp 5A',
  teacherName: 'Cô',
  backgroundImage: 'assets/lop-hoc/nen-lop-hoc.jpg',
  questionSeconds: 20,
  speedSeconds: 8,
  lockSeconds: 5,
  revealSeconds: 10,
  introSeconds: 5,
  lessonEndSeconds: 15,
  questionsPerLesson: 10,
  difficultyOrder: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
  specialPerLesson: 2,
  meoPerLesson: 1,
  shuffleAnswers: true,
  points: 10,
  speedBonus: 5,
  likesPerHint: 15,
  sleepSeconds: 150,
  followBonus: 5,
  maxUmbrellas: 3,
  bigGiftCoins: 99,
  npc: true,
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.22,
  voice: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-HoaiMyNeural',
  voiceJoin: true,
  readExplanation: true,
  narration: true,
  narrationSeconds: 45,
  messages: {
    lessonStart: ['Cả lớp đứng! Chào cô! Hôm nay ai dám thi với lớp 5A nào? Gõ A, B, C, D để trả lời nhé', 'Vào tiết rồi các em ơi! Gõ A, B, C hoặc D vào bình luận để trả lời nhé', 'Tiết học mới bắt đầu! Xem ai thông minh hơn học sinh lớp 5 nào'],
    question: ['Câu số {n}. {q}', 'Câu {n}. {q}', 'Câu hỏi số {n}. {q}'],
    hurry: ['Còn 5 giây! Ai chưa trả lời gõ ngay A, B, C, D đi nào!', 'Nhanh lên các em, sắp hết giờ rồi!', 'Mới có {n} bạn trả lời thôi à? Lớp 5A đang dẫn đấy nhé!'],
    lock: ['Hết giờ! Khoá đáp án!', 'Bỏ bút xuống! Cô công bố đáp án nhé', 'Hết giờ! Hồi hộp quá!'],
    answer: ['Đáp án đúng là {l}. {a}', 'Đáp án {l}. {a}', 'Câu trả lời đúng là {l}. {a}'],
    praise: ['Giỏi lắm! Về bảo mẹ thưởng thêm bát cơm!', 'Em ăn gì mà thông minh thế? Chia cho cô với!', 'Xuất sắc! Cả lớp vỗ tay nào!', 'Đúng rồi! Cô cho mười điểm!', 'Giỏi quá, cô tự hào về các em!'],
    scold: ['Sai rồi em ơi, câu này học sinh lớp 2 cũng biết!', 'Ối giời ơi! Ai dạy em thế?', 'Về nhà học bài ngay cho cô!', 'Sai rồi! Cô phạt nhé!', 'Trời ơi là trời, sai rồi!'],
    allCorrect: ['Trời ơi, cả lớp đúng hết! Cô sướng quá ngất mất!', 'Đúng hết luôn! Cô cảm động quá!'],
    allWrong: ['Cô dạy các em bao nhiêu năm, sao sai hết thế này!', 'Sai hết cả lớp! Cô khóc mất thôi!'],
    noAnswer: ['Không ai trả lời à? Gõ A, B, C, D vào bình luận nhé các em!', 'Cả lớp ngủ hết rồi à? Gõ A, B, C hoặc D để trả lời nhé!'],
    beatNa: ['Ồ! Có bạn giỏi hơn cả Na Mọt Sách!', 'Na sai rồi! Người xem thắng Na nhé!'],
    tiTrick: ['Tí! Em lại nhắc bài bậy phải không?', 'Tí lại lừa các bạn rồi!'],
    join: ['Chào {name}! Vào lớp ngồi đi em', '{name} vào lớp rồi, gõ A B C D để trả lời nhé', 'Chào mừng {name} đến lớp 5A'],
    follow: ['Cảm ơn {name} đã theo dõi, cô tặng khăn quàng đỏ và {n} điểm', '{name} vừa theo dõi kênh, được đeo khăn quàng đỏ'],
    share: ['Cảm ơn {name} đã chia sẻ, tặng một thẻ miễn phạt', '{name} chia sẻ LIVE, được thêm thẻ miễn phạt'],
    gift: ['Cảm ơn {name} tặng {gift}, tặng em thẻ miễn phạt', '{name} tặng {gift}, cô cho thẻ miễn phạt nhé'],
    bigGift: ['Ôi {name} tặng {gift}! Em làm lớp trưởng tiết này, điểm nhân đôi', 'Cảm ơn {name}! Lớp trưởng mới của lớp 5A, nhân đôi điểm cả tiết'],
    hieuTruong: ['Cả lớp đứng! Thầy hiệu trưởng đến dự giờ! Câu này nhân ba điểm', 'Im lặng nào, thầy hiệu trưởng vào lớp! Câu này điểm gấp ba'],
    kiemTraMieng: ['Kiểm tra miệng! Cô gọi bạn {name} lên bảng! Đúng được nhân đôi điểm', 'Cô dò sổ điểm nào... Bạn {name}! Trả lời câu này nhé'],
    sieuToc: ['Câu siêu tốc! Chỉ có {n} giây thôi!', 'Câu hỏi nhanh! {n} giây, nhanh tay lên!'],
    thachNa: ['Na Mọt Sách nói câu này không ai đúng được đâu! Ai dám thử nào?', 'Câu thách đố của Na! Đúng được cộng mười điểm'],
    meo: ['Câu đố mẹo! Suy nghĩ kỹ nhé, đừng để bị lừa!', 'Đố mẹo đây! Cả lớp đang cãi nhau ầm ĩ rồi!'],
    lessonEndWin: ['Người xem thắng lớp 5A rồi! Lớp 5A cúi chào thầy cô danh dự!', 'Quá giỏi! Người xem thông minh hơn học sinh lớp 5!'],
    lessonEndLose: ['Lớp 5A thắng rồi! Na nói: các bạn về học lại lớp 5 nhé!', 'Học sinh lớp 5 vẫn giỏi hơn! Tiết sau cố lên nhé!'],
    lessonEndTie: ['Hoà rồi! Người xem và lớp 5A giỏi ngang nhau!'],
    best: ['Giấy khen tiết này thuộc về {name} với {n} điểm!'],
    reminder: [
      'Gõ A, B, C hoặc D vào bình luận để trả lời câu hỏi',
      'Trả lời nhanh và đúng được nhiều điểm hơn',
      'Chia sẻ LIVE để nhận thẻ miễn phạt, sai cũng không bị phạt',
      'Thả tim nhiều để Na Mọt Sách nhắc bài cho bạn',
      'Theo dõi kênh được đeo khăn quàng đỏ và cộng điểm',
      'Ai giỏi nhất tiết học sẽ được nhận giấy khen',
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
const noAccent = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

// ------------------------------------------------------------------ hình
const IMG = {};
function loadImg(key, src) {
  const img = new Image();
  const rec = { img, ready: false };
  img.onload = () => {
    rec.ready = true;
  };
  img.src = src;
  IMG[key] = rec;
  return rec;
}
const ready = (k) => IMG[k] && IMG[k].ready;
for (const k of ['co-giao', 'thay-hieu-truong', 'hs-nam', 'hs-nu', 'ga-trong']) loadImg(k, `assets/lop-hoc/${k}.png`);
loadImg('giay-khen', 'assets/lop-hoc/giay-khen.jpg');
// trả lời sai bị "biến hình" thành con vật / đồ vật (hình emoji 3D Fluent, MIT)
const BIEN = [
  ['ech', 'con ếch'], ['vit', 'con vịt'], ['heo', 'chú heo'], ['khoai', 'củ khoai'], ['trung', 'quả trứng'],
  ['khi', 'con khỉ'], ['rua', 'con rùa'], ['oc', 'ốc sên'], ['chuoi', 'quả chuối'], ['da', 'hòn đá'],
  ['ca', 'con cá'], ['hanh', 'củ hành'], ['catim', 'quả cà tím'], ['ga', 'con gà'], ['tho', 'con thỏ'],
];
for (const [k] of BIEN) loadImg(`bien-${k}`, `assets/lop-hoc/bien/${k}.png`);

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
// chọn cỡ chữ lớn nhất để đoạn văn vừa khung (tối đa maxLines dòng)
function fitText(text, weight, family, maxSize, minSize, maxW, maxH, maxLines = 4) {
  for (let s = maxSize; s >= minSize; s -= 2) {
    const font = `${weight} ${s}px ${family}`;
    const lines = wrap(text, maxW, font);
    if (lines.length <= maxLines && lines.length * s * 1.22 <= maxH) return { font, size: s, lines };
  }
  const font = `${weight} ${minSize}px ${family}`;
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
  return rec.ready ? rec.img : null;
}
const COLORS = ['#ef5350', '#ab47bc', '#5c6bc0', '#29b6f6', '#26a69a', '#9ccc65', '#ffca28', '#ff7043', '#8d6e63', '#ec407a'];
function hashOf(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
function drawAvatar(x, y, r, p, ring = '#fff') {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = p.npc ? '#1a237e' : COLORS[hashOf(p.id) % COLORS.length];
  ctx.fill();
  const img = p.npc ? null : getAvatar(p.avatar);
  if (img) {
    ctx.clip();
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${Math.round(r * 1.05)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Array.from(p.name || '?')[0].toUpperCase(), x, y + r * 0.06);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.strokeStyle = ring;
  ctx.stroke();
}

// ------------------------------------------------------------------ chỗ ngồi (khớp với bàn trong ảnh nền)
// y = chân nhân vật, h = chiều cao nhân vật (gần bảng thì nhỏ, gần người xem thì to)
const ROWS = [
  { y: 1112, h: 118, xs: [258, 345, 500, 585, 738, 828] },
  { y: 1192, h: 140, xs: [205, 310, 492, 595, 772, 880] },
  { y: 1312, h: 168, xs: [140, 270, 480, 602, 815, 945] },
  { y: 1470, h: 200, xs: [75, 215, 465, 615, 870, 1010] },
  { y: 1735, h: 245, xs: [62, 158, 440, 635, 935, 1030] },
];
const SEATS = [];
ROWS.forEach((r, ri) => r.xs.forEach((x) => SEATS.push({ x, y: r.y, h: r.h, row: ri, who: null })));

// 6 bạn lớp 5A do máy điều khiển
const NPC_DEF = [
  { key: 'mai', name: 'Mai Lớp Trưởng', short: 'Mai', girl: true, seat: 2, acc: 0.75 },
  { key: 'ti', name: 'Tí Lém', short: 'Tí', girl: false, seat: 10, acc: 0.55 },
  { key: 'na', name: 'Na Mọt Sách', short: 'Na', girl: true, seat: 14, acc: 0.92 },
  { key: 'teo', name: 'Tèo Hóng Hớt', short: 'Tèo', girl: false, seat: 16, acc: 0.5 },
  { key: 'bin', name: 'Bin Ngủ Gật', short: 'Bin', girl: false, seat: 19, acc: 0.45 },
  { key: 'tun', name: 'Cu Tũn', short: 'Cu Tũn', girl: false, seat: 27, acc: 0.3, scale: 0.8 },
];

// ------------------------------------------------------------------ trạng thái
let now = performance.now();
const players = new Map(); // người xem + bạn 5A
const npcs = [];
let bank = [];
let lesson = 1;
let qIndex = 0;
let lessonPlan = [];
let q = null;
const phase = { name: 'boot', t0: 0, until: 0 };
const team = { viewers: 0, npc: 0 };
const particles = [];
const toasts = [];
let teacherText = '';
let teacherTextAt = 0;
let teacherMood = 'normal'; // normal | happy | angry | cry | faint
let teacherMoodUntil = 0;
let lastAnnounce = performance.now();
let lastJoinVoice = 0;
let flash = 0;
let shake = 0;
let lessonSummary = null;
let principal = null; // { t0, leaveAt }
let rooster = null;
let paused = false;

function player(user) {
  if (!user || !user.id) return null;
  let p = players.get(user.id);
  if (!p) {
    p = {
      id: user.id, name: user.name || user.uniqueId || 'Bạn', avatar: user.avatar || '', npc: null,
      girl: hashOf(user.id) % 2 === 1, seat: -1, score: 0, total: 0, likesLesson: 0, wrongLesson: 0,
      answer: null, likesQ: 0, hinted: null, umbrellas: 0, follow: false, lopTruong: false, streak: 0, wrongStreak: 0,
      lastActive: now, joinedAt: now, bubble: null, react: null, hitAt: 0,
    };
    players.set(user.id, p);
    seatPlayer(p);
  } else {
    if (user.name) p.name = user.name;
    if (user.avatar) p.avatar = user.avatar;
    if (p.seat < 0) seatPlayer(p);
  }
  p.lastActive = now;
  return p;
}
const viewers = () => [...players.values()].filter((p) => !p.npc);
const isSleeping = (p) => !p.npc && now - p.lastActive > Math.max(30, config.sleepSeconds) * 1000;

function seatPlayer(p) {
  let free = SEATS.map((s, i) => i).filter((i) => !SEATS[i].who);
  if (!free.length) {
    // hết chỗ: mời bạn lâu không tương tác nhất ra
    const out = viewers().filter((v) => v.seat >= 0 && v !== p && !v.answer).sort((a, b) => a.lastActive - b.lastActive)[0];
    if (!out) return;
    SEATS[out.seat].who = null;
    out.seat = -1;
    free = [SEATS.findIndex((s) => !s.who)];
  }
  // ưu tiên bàn giữa, gần người xem (dễ thấy)
  const prefer = [20, 21, 25, 26, 15, 13, 22, 18, 9, 8, 24, 28, 23, 12, 17, 3, 7, 11, 1, 4, 0, 5, 6, 29, 30, 31, 32, 33, 34, 35];
  const i = prefer.find((k) => free.includes(k)) ?? free[0];
  if (i == null || i < 0) return;
  SEATS[i].who = p.id;
  p.seat = i;
}
function moveToBackRow(p) {
  const back = SEATS.map((s, i) => i).filter((i) => SEATS[i].row === 4 && !SEATS[i].who);
  if (!back.length || SEATS[p.seat]?.row === 4) return false;
  SEATS[p.seat].who = null;
  p.seat = back[0];
  SEATS[p.seat].who = p.id;
  return true;
}

function makeNpcs() {
  for (const d of NPC_DEF) {
    const p = {
      id: `npc-${d.key}`, name: d.short, fullName: d.name, avatar: '', npc: d.key, girl: d.girl, seat: d.seat, scale: d.scale || 1,
      acc: d.acc, score: 0, answer: null, plan: null, bubble: null, react: null, streak: 0, lastActive: now, hitAt: 0,
    };
    SEATS[d.seat].who = p.id;
    players.set(p.id, p);
    npcs.push(p);
  }
}
const npc = (key) => npcs.find((n) => n.npc === key);

// ------------------------------------------------------------------ thông báo / giọng đọc
function say(text, priority = 1, mood = null, ms = 4500) {
  if (!text) return;
  teacherText = text;
  teacherTextAt = now;
  lastAnnounce = now;
  if (mood) {
    teacherMood = mood;
    teacherMoodUntil = now + ms;
  }
  voice.speak(text, priority);
}
function addToast(text, color = '#fff') {
  toasts.push({ text, color, t0: now });
  while (toasts.length > 4) toasts.shift();
}
function bubble(p, text, ms = 3200, kind = 'say') {
  if (!p) return;
  p.bubble = { text, t0: now, until: now + ms, kind };
}
function addParticle(o) {
  if (particles.length < 900) particles.push({ t0: now, life: 1.2, vx: 0, vy: 0, g: 0, size: 10, rot: 0, vr: 0, ...o });
}
function confetti(x, y, n, spread = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand(-Math.PI, 0);
    const v = rand(300, 900) * spread;
    addParticle({ kind: 'confetti', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 900, life: rand(1.4, 2.4), size: rand(8, 15), color: pick(COLORS), rot: rand(0, TAU), vr: rand(-8, 8) });
  }
}
function sparks(x, y, n, color = '#ffe066') {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(80, 320);
    addParticle({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 120, life: rand(0.5, 1), size: rand(4, 8), color });
  }
}
function dust(x, y, n, color = 'rgba(255,255,255,0.85)') {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const v = rand(40, 200);
    addParticle({ kind: 'dust', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: -20, life: rand(0.6, 1.3), size: rand(10, 24), color });
  }
}

// ------------------------------------------------------------------ ngân hàng câu hỏi
let customData = { cauHoi: [], monChon: [], chiDungCauTuThem: false };
function toQuestion(row) {
  const [mon, lop, kho, cau, dung, s1, s2, s3, giai, loai] = row;
  return { mon, lop, kho: Number(kho) || 1, q: cau, opts: [dung, s1, s2, s3], correct: 0, giai: giai || '', meo: loai === 'meo', shuffle: true, key: `${mon}|${cau}` };
}
function customToQuestion(c) {
  const opts = LETTERS.map((L) => String(c[L] ?? '').trim());
  const idx = LETTERS.indexOf(String(c.dapAn || 'A').trim().toUpperCase()[0]);
  if (!String(c.cauHoi || '').trim() || opts.some((o) => !o) || idx < 0) return null;
  return {
    mon: String(c.mon || 'Tự thêm').trim() || 'Tự thêm', lop: c.lop || '', kho: clamp(Number(c.doKho) || 2, 1, 3), q: String(c.cauHoi).trim(), opts, correct: idx,
    giai: String(c.giaiThich || '').trim(), meo: !!c.meo, shuffle: false, key: `tu-them|${c.cauHoi}`, custom: true,
  };
}
async function loadBank() {
  try {
    const r = await fetch('/lop-hoc-de-thi.json', { cache: 'no-store' });
    if (r.ok) customData = { ...customData, ...(await r.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  const custom = (customData.cauHoi || []).map(customToQuestion).filter(Boolean);
  let all = customData.chiDungCauTuThem && custom.length ? custom : [...CAU_HOI.map(toQuestion), ...custom];
  const chon = (customData.monChon || []).filter(Boolean);
  if (chon.length) {
    const f = all.filter((x) => chon.includes(x.mon));
    if (f.length >= 5) all = f;
  }
  bank = all;
}
const USED_KEY = 'lopHocDaDung';
let used = new Set();
try {
  used = new Set(JSON.parse(localStorage.getItem(USED_KEY) || '[]'));
} catch {
  /* bỏ qua */
}
function markUsed(k) {
  used.add(k);
  try {
    localStorage.setItem(USED_KEY, JSON.stringify([...used].slice(-2000)));
  } catch {
    /* bỏ qua */
  }
}
function pickQuestion(level, { meo = false, hard = false } = {}) {
  const taken = new Set(lessonPlan.map((p) => p.q && p.q.key));
  let pool = bank.filter((x) => !taken.has(x.key));
  if (meo) {
    const m = pool.filter((x) => x.meo);
    if (!m.length) return null;
    pool = m;
  } else pool = pool.filter((x) => !x.meo) .length ? pool.filter((x) => !x.meo) : pool;
  const want = hard ? 3 : level;
  let cand = pool.filter((x) => x.kho === want && !used.has(x.key));
  if (!cand.length) cand = pool.filter((x) => !used.has(x.key));
  if (!cand.length) {
    // đã ra hết câu: chơi lại từ đầu (giữ thứ tự ngẫu nhiên)
    for (const x of pool) used.delete(x.key);
    cand = pool.filter((x) => x.kho === want);
    if (!cand.length) cand = pool;
  }
  return cand.length ? pick(cand) : null;
}

function planLesson() {
  const n = Math.max(3, Number(config.questionsPerLesson) || 10);
  const order = Array.isArray(config.difficultyOrder) ? config.difficultyOrder : DEFAULTS.difficultyOrder;
  lessonPlan = [];
  // vị trí câu đặc biệt (không phải câu 1, 2)
  const slots = [];
  for (let i = 2; i < n; i++) slots.push(i);
  slots.sort(() => Math.random() - 0.5);
  const kinds = ['hieuTruong', 'kiemTraMieng', 'sieuToc', 'thachNa'].sort(() => Math.random() - 0.5);
  const special = {};
  const ns = clamp(Number(config.specialPerLesson) || 0, 0, 4);
  for (let i = 0; i < ns && slots.length; i++) special[slots.shift()] = kinds[i];
  const meoSlots = new Set();
  for (let i = 0; i < (Number(config.meoPerLesson) || 0) && slots.length; i++) meoSlots.add(slots.shift());
  for (let i = 0; i < n; i++) {
    const level = Number(order[Math.min(i, order.length - 1)]) || 2;
    const kind = special[i] || (meoSlots.has(i) ? 'meo' : 'thuong');
    let qq = pickQuestion(level, { meo: kind === 'meo', hard: kind === 'thachNa' });
    let k = kind;
    if (!qq) {
      qq = pickQuestion(level);
      if (kind === 'meo') k = 'thuong';
    }
    lessonPlan.push({ kind: k, q: qq });
  }
}

// ------------------------------------------------------------------ vòng chơi
function setPhase(name, ms) {
  phase.name = name;
  phase.t0 = now;
  phase.until = now + ms / SPEED;
  sendState();
}
const phaseT = () => (now - phase.t0) / 1000 * SPEED;
const phaseLeft = () => Math.max(0, (phase.until - now) / 1000 * SPEED);

function startLesson() {
  qIndex = 0;
  team.viewers = 0;
  team.npc = 0;
  for (const p of players.values()) {
    p.score = 0;
    p.likesLesson = 0;
    p.wrongLesson = 0;
    p.lopTruong = false;
    p.streak = 0;
    p.wrongStreak = 0;
  }
  planLesson();
  lessonSummary = null;
  setPhase('intro', config.introSeconds * 1000);
  sfx.schoolDrum(3);
  say(line('lessonStart'), 2, 'happy', 5000);
}

function nextQuestion() {
  if (qIndex >= lessonPlan.length) {
    endLesson();
    return;
  }
  const plan = lessonPlan[qIndex];
  qIndex++;
  const base = plan.q || pickQuestion(2);
  if (!base) return;
  markUsed(base.key);
  // xáo đáp án
  let order = [0, 1, 2, 3];
  if (base.shuffle && config.shuffleAnswers !== false) order.sort(() => Math.random() - 0.5);
  q = {
    ...base, kind: plan.kind, opts: order.map((i) => base.opts[i]), correct: order.indexOf(base.correct),
    n: qIndex, t0: now, secs: plan.kind === 'sieuToc' ? Number(config.speedSeconds) || 8 : Number(config.questionSeconds) || 20,
    target: null, tiTrick: null, eliminated: new Map(), penalty: null, results: null,
  };
  for (const p of players.values()) {
    p.answer = null;
    p.likesQ = 0;
    p.hinted = null;
    p.react = null;
    p.plan = null;
  }
  if (q.kind === 'kiemTraMieng') {
    const act = viewers().filter((v) => v.seat >= 0 && !isSleeping(v));
    if (act.length) q.target = pick(act).id;
    else q.kind = 'thuong';
  }
  planNpcAnswers();
  setPhase('ask', q.secs * 1000);
  sfx.whoosh();
  const intro = q.kind === 'hieuTruong' ? line('hieuTruong')
    : q.kind === 'kiemTraMieng' ? line('kiemTraMieng', { name: players.get(q.target)?.name || '' })
      : q.kind === 'sieuToc' ? line('sieuToc', { n: q.secs })
        : q.kind === 'thachNa' ? line('thachNa')
          : q.kind === 'meo' ? line('meo') : '';
  if (q.kind === 'hieuTruong') principal = { t0: now };
  else if (principal && !principal.leaveAt) principal.leaveAt = now;
  if (q.kind === 'thachNa') bubble(npc('na'), 'Câu này không ai đúng được đâu!', 4500);
  if (q.kind === 'kiemTraMieng') {
    sfx.drumroll(1.6);
    for (const n of npcs) n.react = { kind: 'hide', t0: now, until: now + 2500 };
  }
  if (q.kind === 'meo') {
    const lines = ['Câu này dễ ợt!', 'Không phải đâu!', 'Đáp án là... ơ...', 'Mẹo đấy, cẩn thận!'];
    npcs.forEach((n, i) => setTimeout(() => bubble(n, pick(lines), 2200), 400 + i * 350));
  }
  if (intro) say(intro, 2, q.kind === 'hieuTruong' ? 'normal' : 'happy');
  setTimeout(() => say(line('question', { n: q.n, q: q.q }), 1), intro ? 2600 : 200);
}

function planNpcAnswers() {
  if (config.npc === false) return;
  for (const n of npcs) {
    let acc = n.acc;
    if (q.kind === 'thachNa' && n.npc === 'na') acc = 0.5;
    if (q.meo) acc *= 0.6;
    if (q.kho === 3) acc *= 0.85;
    const right = Math.random() < acc;
    const wrongOpts = [0, 1, 2, 3].filter((i) => i !== q.correct);
    const at = n.npc === 'bin' ? rand(0.45, 0.85) : n.npc === 'teo' ? rand(0.55, 0.8) : n.npc === 'na' ? rand(0.12, 0.35) : rand(0.2, 0.75);
    n.plan = { at: at * q.secs, opt: right ? q.correct : pick(wrongOpts), done: false };
  }
  // Tí nhắc bài (thường là sai)
  const wrongOpts = [0, 1, 2, 3].filter((i) => i !== q.correct);
  q.tiTrick = { at: rand(0.3, 0.5) * q.secs, opt: Math.random() < 0.75 ? pick(wrongOpts) : q.correct, done: false };
  // Bin nói mớ
  q.binTalk = { at: rand(0.5, 0.7) * q.secs, opt: Math.random() < 0.5 ? q.correct : pick(wrongOpts), done: false };
}

function parseAnswer(text) {
  const t = noAccent(text).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return -1;
  let m = t.match(/^(?:dap an|da|chon|cau|la|em chon|con chon|toi chon)?\s*([abcd])(?:\s|$)/);
  if (m) return LETTERS.indexOf(m[1].toUpperCase());
  m = t.match(/^([abcd])\1+$/);
  if (m) return LETTERS.indexOf(m[1].toUpperCase());
  return -1;
}

function setAnswer(p, opt) {
  if (phase.name !== 'ask' || !q) return false;
  const first = !p.answer;
  if (p.answer && p.answer.opt === opt) return true;
  p.answer = { opt, t: (now - q.t0) / 1000 * SPEED };
  if (!p.npc) {
    sfx.pop();
    if (first && viewers().filter((v) => v.answer).length === 1) addToast(`⚡ ${truncate(p.name, 14)} trả lời đầu tiên!`, '#ffd54a');
  }
  return true;
}

function counts() {
  const c = [[], [], [], []];
  for (const p of players.values()) if (p.answer) c[p.answer.opt].push(p);
  for (const list of c) list.sort((a, b) => (a.npc ? 1 : 0) - (b.npc ? 1 : 0) || a.answer.t - b.answer.t);
  return c;
}

function lockAnswers() {
  setPhase('lock', (Number(config.lockSeconds) || 5) * 1000);
  sfx.drumroll(Math.max(1, (Number(config.lockSeconds) || 5) - 0.2) / SPEED);
  say(line('lock'), 1);
}

const PENALTIES = ['phan', 'sap', 'trung', 'ga', 'set', 'dienThoai', 'mu', 'bienHinh', 'khoc', 'bienHinh', 'khoc'];
let lastPenalty = '';
function reveal() {
  setPhase('reveal', (Number(config.revealSeconds) || 10) * 1000);
  const answered = [...players.values()].filter((p) => p.answer);
  const right = answered.filter((p) => p.answer.opt === q.correct);
  const wrong = answered.filter((p) => p.answer.opt !== q.correct);
  const vAns = answered.filter((p) => !p.npc);
  const vRight = vAns.filter((p) => p.answer.opt === q.correct);
  const nAns = answered.filter((p) => p.npc);
  const nRight = nAns.filter((p) => p.answer.opt === q.correct);
  // điểm
  const fastest = vRight.slice().sort((a, b) => a.answer.t - b.answer.t);
  for (const p of answered) {
    if (p.answer.opt === q.correct) {
      let pts = (Number(config.points) || 10);
      if (q.kind === 'hieuTruong') pts *= 3;
      pts += Math.round((Number(config.speedBonus) || 5) * clamp(1 - p.answer.t / q.secs, 0, 1));
      if (q.kind === 'kiemTraMieng' && p.id === q.target) pts *= 2;
      if (q.kind === 'thachNa') pts += 10;
      if (q.kind === 'sieuToc' && fastest[0] === p) pts += 5;
      if (p.lopTruong) pts *= 2;
      p.score += pts;
      if (!p.npc) p.total = (p.total || 0) + pts;
      p.streak = (p.streak || 0) + 1;
      p.wrongStreak = 0;
      p.react = { kind: 'happy', t0: now, until: now + 5000, pts };
      if (!p.npc && (p.streak === 3 || p.streak === 5)) {
        addToast(p.streak === 3 ? `💡 ${truncate(p.name, 14)} thành THẦN ĐỒNG (3 câu liền)!` : `🎓 ${truncate(p.name, 14)} thành GIÁO SƯ NHÍ (5 câu liền)!`, '#ffe082');
        if (p.streak === 5) bubble(npc('na'), `Cho Na xin chữ ký ${truncate(p.name, 10)}!`, 4000);
      }
    } else {
      const saved = !p.npc && p.umbrellas > 0;
      if (saved) {
        p.umbrellas--;
        p.react = { kind: 'umbrella', t0: now, until: now + 7000 };
      } else {
        p.streak = 0;
        p.wrongStreak = (p.wrongStreak || 0) + 1;
        if (!p.npc) p.wrongLesson++;
        p.react = { kind: 'sad', t0: now, until: now + Math.max(7000, (Number(config.revealSeconds) || 10) * 1000 / SPEED) };
      }
    }
  }
  // đội
  const vPct = vAns.length ? vRight.length / vAns.length : -1;
  const nPct = nAns.length ? nRight.length / nAns.length : -1;
  let qWinner = 'none';
  if (vPct < 0 && nPct >= 0) qWinner = 'npc';
  else if (vPct >= 0 && nPct < 0) qWinner = 'viewers';
  else if (vPct >= 0) qWinner = vPct > nPct ? 'viewers' : vPct < nPct ? 'npc' : 'tie';
  if (qWinner === 'viewers' || qWinner === 'tie') team.viewers++;
  if (qWinner === 'npc' || qWinner === 'tie') team.npc++;

  const penPool = PENALTIES.filter((k) => k !== lastPenalty);
  const penalty = pick(penPool.length ? penPool : PENALTIES);
  lastPenalty = penalty;
  q.results = { right, wrong, vAns, vRight, fastest: fastest[0] || null, qWinner };
  q.penalty = penalty;
  if (penalty === 'bienHinh') {
    const used = new Set();
    wrong.forEach((p, i) => {
      if (!p.react || p.react.kind !== 'sad') return;
      let j = (hashOf(p.id) + q.n * 7 + i) % BIEN.length;
      for (let k = 0; k < BIEN.length && used.has(j) && used.size < BIEN.length; k++) j = (j + 1) % BIEN.length;
      used.add(j);
      p.react.bien = BIEN[j];
    });
    const first = wrong.find((p) => !p.npc && p.react && p.react.bien);
    const ti = npc('ti');
    if (first && ti) setTimeout(() => bubble(ti, `Ha ha, ${truncate(first.name, 8)} thành ${first.react.bien[1]} rồi!`, 3500), 3600 / SPEED);
  }
  if (penalty === 'khoc') {
    const mai = npc('mai');
    if (mai && wrong.length) setTimeout(() => bubble(mai, 'Lớp trưởng phát khăn giấy nè!', 3500), 3400 / SPEED);
  }
  q.penaltyAt = now + 2600 / SPEED;
  q.revealAt = now;
  const L = LETTERS[q.correct];
  sfx.correct(true);
  setTimeout(() => (right.length ? sfx.fanfare() : sfx.timeUp()), 250);
  flash = 0.6;
  const boxC = boxRect(q.correct);
  confetti(boxC.x + boxC.w / 2, boxC.y + boxC.h / 2, right.length ? 70 : 20);
  // lời cô
  let mood = 'happy';
  let msg = line('answer', { l: L, a: q.opts[q.correct] });
  if (vAns.length === 0) {
    msg += `. ${line('noAnswer')}`;
    mood = 'angry';
  } else if (vRight.length === vAns.length) {
    msg += `. ${vAns.length >= 2 ? line('allCorrect') : line('praise')}`;
    mood = vAns.length >= 2 ? 'faint' : 'happy';
  } else if (vRight.length === 0) {
    msg += `. ${vAns.length >= 2 ? line('allWrong') : line('scold')}`;
    mood = vAns.length >= 2 ? 'cry' : 'angry';
  } else msg += `. ${pick([line('praise'), line('scold')])}`;
  say(msg, 2, mood, 6500);
  if (mood === 'cry') setTimeout(() => sfx.rain(3), 600);
  if (mood === 'faint') bubble(npc('mai'), 'Cô ơi! Để em quạt cho cô!', 3500);
  if (config.readExplanation !== false && q.giai) setTimeout(() => phase.name === 'reveal' && say(q.giai, 1), 4200 / SPEED);
  // Na thua người xem
  const na = npc('na');
  if (na && na.answer && na.answer.opt !== q.correct && vRight.length) {
    q.beatNa = true;
    setTimeout(() => {
      sfx.glass();
      bubble(na, 'Hu hu... kính của Na!', 3500);
      addToast(`🤓💥 ${vRight.length} bạn giỏi hơn Na Mọt Sách!`, '#80deea');
    }, 1400 / SPEED);
  }
  // Tí lừa
  if (q.tiTrick && q.tiTrick.done && q.tiTrick.opt !== q.correct) {
    const fooled = vAns.filter((p) => p.answer.opt === q.tiTrick.opt);
    if (fooled.length) setTimeout(() => bubble(npc('ti'), 'Hí hí, bị lừa rồi!', 3500), 2000 / SPEED);
    else setTimeout(() => bubble(npc('ti'), 'Ơ, không ai bị lừa à?', 3000), 2000 / SPEED);
  }
  const tun = npc('tun');
  if (tun && tun.answer && tun.answer.opt !== q.correct) {
    const same = vAns.filter((p) => p.answer.opt === tun.answer.opt);
    if (same.length) setTimeout(() => bubble(tun, `${truncate(same[0].name, 8)} ơi, hai đứa mình giống nhau!`, 3500), 3200 / SPEED);
  }
  const bin = npc('bin');
  if (bin && bin.answer && bin.answer.opt === q.correct && Math.random() < 0.6) setTimeout(() => bubble(bin, 'Zzz... đúng hả... zzz', 3000, 'sleep'), 3800 / SPEED);
  if (q.kind === 'kiemTraMieng' && q.target) {
    const t = players.get(q.target);
    if (t && t.answer && t.answer.opt === q.correct) addToast(`🎤 ${truncate(t.name, 14)} trả lời miệng ĐÚNG, nhân đôi điểm!`, '#a5d6a7');
    else if (t) addToast(`🎤 ${truncate(t.name, 14)} bị kiểm tra miệng... ${t.answer ? 'sai mất rồi!' : 'không trả lời!'}`, '#ef9a9a');
  }
  // 3 câu sai liền: xuống bàn cuối
  for (const p of wrong) {
    if (!p.npc && p.wrongStreak === 3 && p.react && p.react.kind === 'sad') {
      setTimeout(() => {
        if (moveToBackRow(p)) addToast(`🪑 ${truncate(p.name, 14)} sai 3 câu liền, xuống bàn cuối!`, '#ffab91');
      }, 7000 / SPEED);
    }
  }
  if (wrong.length) setTimeout(() => startPenaltySound(penalty, wrong.length), 2600 / SPEED);
  sendState();
}

function startPenaltySound(kind, n) {
  sfx.wrongGroup();
  const k = Math.min(n, 8);
  if (kind === 'phan') for (let i = 0; i < k; i++) setTimeout(() => sfx.chalk(), 300 + i * 220);
  if (kind === 'sap') setTimeout(() => sfx.crumble(), 200);
  if (kind === 'trung') for (let i = 0; i < k; i++) setTimeout(() => sfx.egg(), 300 + i * 200);
  if (kind === 'ga') {
    sfx.rooster();
    for (let i = 0; i < k; i++) setTimeout(() => sfx.peck(), 900 + i * 380);
  }
  if (kind === 'set') {
    setTimeout(() => sfx.thunder(), 500);
    sfx.rain(2);
  }
  if (kind === 'dienThoai') sfx.phone(2);
  if (kind === 'mu') for (let i = 0; i < k; i++) setTimeout(() => sfx.boing(), 300 + i * 220);
  if (kind === 'bienHinh') {
    sfx.sparkle();
    for (let i = 0; i < k; i++) setTimeout(() => sfx.poof(), 600 + i * 250);
    setTimeout(() => sfx.sob(), 900 + k * 250);
  }
  if (kind === 'khoc') {
    sfx.sob();
    setTimeout(() => sfx.sob(), 1500);
    setTimeout(() => sfx.rain(2.5), 700);
  }
  if (kind === 'ga') rooster = { t0: performance.now() };
}

function endLesson() {
  setPhase('lessonEnd', (Number(config.lessonEndSeconds) || 15) * 1000);
  const vs = viewers().filter((p) => p.score > 0).sort((a, b) => b.score - a.score);
  const hardest = viewers().filter((p) => p.wrongLesson >= 2).sort((a, b) => b.wrongLesson - a.wrongLesson)[0] || null;
  const liker = viewers().filter((p) => p.likesLesson > 0).sort((a, b) => b.likesLesson - a.likesLesson)[0] || null;
  const result = team.viewers > team.npc ? 'win' : team.viewers < team.npc ? 'lose' : 'tie';
  lessonSummary = { top: vs.slice(0, 3), hardest, liker, result, v: team.viewers, n: team.npc, lesson };
  sfx.fanfare();
  sfx.schoolDrum(5);
  confetti(W / 2, 700, 120, 1.3);
  let msg = line(result === 'win' ? 'lessonEndWin' : result === 'lose' ? 'lessonEndLose' : 'lessonEndTie');
  if (vs[0]) msg += `. ${line('best', { name: vs[0].name, n: vs[0].score })}`;
  say(msg, 2, result === 'lose' ? 'normal' : 'happy', 8000);
  if (result === 'lose') bubble(npc('na'), 'Bạn về học lại lớp 5 nhé!', 6000);
  else if (result === 'win') for (const n of npcs) n.react = { kind: 'bow', t0: now, until: now + 6000 };
}

function skip() {
  if (phase.name === 'ask') lockAnswers();
  else if (phase.name === 'lock') reveal();
  else if (phase.name === 'reveal') nextQuestion();
  else if (phase.name === 'intro') nextQuestion();
  else if (phase.name === 'lessonEnd') {
    lesson++;
    startLesson();
  }
}

// ------------------------------------------------------------------ sự kiện TikTok
function handleEvent(ev) {
  if (!ev || !ev.type) return;
  if (ev.type === 'reset') {
    for (const p of players.values()) {
      p.score = 0;
      p.total = 0;
    }
    team.viewers = 0;
    team.npc = 0;
    addToast('🧹 Đã xoá bảng điểm', '#fff');
    return;
  }
  if (ev.type === 'skip') return skip();
  if (ev.type === 'newLesson') {
    lesson++;
    startLesson();
    return;
  }
  if (ev.type === 'pause') {
    paused = !paused;
    addToast(paused ? '⏸ Tạm dừng' : '▶ Chơi tiếp', '#fff');
    return;
  }
  if (ev.type === 'reloadBank') {
    loadBank().then(() => addToast(`📚 Đã nạp ngân hàng đề: ${bank.length} câu`, '#c5e1a5'));
    return;
  }
  if (ev.type === 'voiceTest') {
    say('Xin chào cả lớp! Cô đọc to, các em nghe rõ không?', 3, 'happy');
    return;
  }
  const p = player(ev.user);
  if (!p) return;
  switch (ev.type) {
    case 'join':
      if (config.voiceJoin !== false && now - lastJoinVoice > 9000 && phase.name !== 'reveal') {
        lastJoinVoice = now;
        voice.speak(line('join', { name: p.name }), 0);
      }
      break;
    case 'chat': {
      const text = String(ev.text || '').trim();
      const opt = parseAnswer(text);
      if (opt >= 0 && phase.name === 'ask') setAnswer(p, opt);
      else if (text) bubble(p, truncate(text, 26), 3000, 'chat');
      break;
    }
    case 'simAnswer': {
      if (phase.name !== 'ask' || !q) break;
      let opt = ev.opt;
      if (opt === 'correct') opt = q.correct;
      else if (opt === 'wrong') opt = pick([0, 1, 2, 3].filter((i) => i !== q.correct));
      else if (typeof opt === 'string') opt = LETTERS.indexOf(opt.toUpperCase());
      if (opt >= 0 && opt < 4) setAnswer(p, opt);
      break;
    }
    case 'like': {
      const n = Math.max(1, Number(ev.count) || 1);
      p.likesQ += n;
      p.likesLesson += n;
      if (Math.random() < 0.5) addParticle({ kind: 'heart', ...headPos(p), vx: rand(-30, 30), vy: -120, life: 1.2, size: 26 });
      const need = Math.max(3, Number(config.likesPerHint) || 15);
      if (phase.name === 'ask' && q && !p.hinted && p.likesQ >= need) {
        const done = q.eliminated.get(p.id) || [];
        const opts = [0, 1, 2, 3].filter((i) => i !== q.correct && !done.includes(i));
        if (opts.length) {
          const o = pick(opts);
          p.hinted = o;
          q.eliminated.set(p.id, [...done, o]);
          bubble(npc('na'), `Psst ${truncate(p.name, 8)}: không phải ${LETTERS[o]}!`, 3500, 'whisper');
          addToast(`🤓 Na nhắc ${truncate(p.name, 12)}: không phải ${LETTERS[o]}!`, '#b3e5fc');
          sfx.sparkle();
        }
      }
      break;
    }
    case 'follow':
      if (!p.follow) {
        p.follow = true;
        const n = Number(config.followBonus) || 5;
        p.score += n;
        p.total = (p.total || 0) + n;
        addToast(`⭐ ${truncate(p.name, 14)} theo dõi: đeo khăn quàng đỏ +${n} điểm`, '#ff8a80');
        say(line('follow', { name: p.name, n }), 1);
        sfx.sparkle();
        sparks(headPos(p).x, headPos(p).y, 24, '#ff5252');
      }
      break;
    case 'share': {
      const max = Number(config.maxUmbrellas) || 3;
      if (p.umbrellas < max) p.umbrellas++;
      addToast(`☂️ ${truncate(p.name, 14)} chia sẻ: có thẻ miễn phạt (${p.umbrellas})`, '#80cbc4');
      if (now - lastAnnounce > 4000) say(line('share', { name: p.name }), 0);
      sfx.umbrella();
      break;
    }
    case 'gift': {
      const coins = Number(ev.coins) || Number(ev.diamonds) || 1;
      if (coins >= (Number(config.bigGiftCoins) || 99)) {
        p.lopTruong = true;
        addToast(`👑 ${truncate(p.name, 14)} làm LỚP TRƯỞNG, x2 điểm cả tiết!`, '#ffd54f');
        say(line('bigGift', { name: p.name, gift: ev.giftName || 'quà' }), 2, 'happy');
        sfx.fanfare();
        confetti(headPos(p).x, headPos(p).y, 60);
      } else {
        const max = Number(config.maxUmbrellas) || 3;
        if (p.umbrellas < max) p.umbrellas++;
        addToast(`🎁 ${truncate(p.name, 14)} tặng ${ev.giftName || 'quà'}: thẻ miễn phạt (${p.umbrellas})`, '#f8bbd0');
        if (now - lastAnnounce > 3000) say(line('gift', { name: p.name, gift: ev.giftName || 'quà' }), 1);
        sfx.umbrella();
      }
      break;
    }
    default:
      break;
  }
}

// ------------------------------------------------------------------ cập nhật
let lastTickSec = -1;
let hurrySaid = false;
function update(dt) {
  if (paused) {
    phase.until += dt * 1000 / SPEED;
    if (q) q.t0 += dt * 1000 / SPEED;
    return;
  }
  flash = Math.max(0, flash - dt * 1.5);
  shake = Math.max(0, shake - dt * 2);
  if (teacherMoodUntil && now > teacherMoodUntil) {
    teacherMood = 'normal';
    teacherMoodUntil = 0;
  }
  if (phase.name === 'intro' && now >= phase.until) nextQuestion();
  if (phase.name === 'ask' && q) {
    const t = (now - q.t0) / 1000 * SPEED;
    for (const n of npcs) {
      if (n.plan && !n.plan.done && t >= n.plan.at) {
        n.plan.done = true;
        let opt = n.plan.opt;
        if (n.npc === 'teo') {
          // Tèo chép đáp án được nhiều người xem chọn nhất
          const c = counts().map((l) => l.filter((p) => !p.npc).length);
          const best = c.indexOf(Math.max(...c));
          if (Math.max(...c) > 0) {
            opt = best;
            const who = counts()[best].find((p) => !p.npc);
            if (who) bubble(n, `${truncate(who.name, 8)} chọn ${LETTERS[best]} đó cô ơi!`, 3000);
          }
        }
        setAnswer(n, opt);
      }
    }
    if (q.tiTrick && !q.tiTrick.done && t >= q.tiTrick.at) {
      q.tiTrick.done = true;
      bubble(npc('ti'), `Psst... ${LETTERS[q.tiTrick.opt]} đó, tin tớ đi!`, 3800, 'whisper');
    }
    if (q.binTalk && !q.binTalk.done && t >= q.binTalk.at && Math.random() < 0.02) {
      q.binTalk.done = true;
      bubble(npc('bin'), `Zzz... ${LETTERS[q.binTalk.opt]}... zzz`, 3000, 'sleep');
    }
    const left = Math.ceil(phaseLeft());
    if (left !== lastTickSec && left <= 5 && left > 0) sfx.tick(left <= 3);
    lastTickSec = left;
    if (left === 6 && !hurrySaid) {
      hurrySaid = true;
      const nv = viewers().filter((v) => v.answer).length;
      if (q.secs > 10 && Math.random() < 0.7) say(line('hurry', { n: nv }), 0, 'angry', 2500);
    }
    if (now >= phase.until) {
      hurrySaid = false;
      lockAnswers();
    }
  }
  if (phase.name === 'lock') {
    // đèn chạy qua 4 ô, chậm dần
    const total = Number(config.lockSeconds) || 5;
    const t = phaseT();
    const steps = Math.floor(14 * Math.sqrt(clamp(t / total, 0, 1)) * 3);
    if (steps !== update.lastStep) {
      update.lastStep = steps;
      if (t < total - 0.3) sfx.blip(steps % 4 === 0);
    }
    if (now >= phase.until) reveal();
  }
  if (phase.name === 'reveal') {
    if (q && q.penalty && now >= q.penaltyAt) runPenaltyParticles();
    if (now >= phase.until) {
      principal = principal ? { ...principal, leaveAt: principal.leaveAt || now } : null;
      if (qIndex >= lessonPlan.length) endLesson();
      else nextQuestion();
    }
  }
  if (phase.name === 'lessonEnd' && now >= phase.until) {
    lesson++;
    startLesson();
  }
  if (principal && principal.leaveAt && now - principal.leaveAt > 2500) principal = null;
  for (let i = particles.length - 1; i >= 0; i--) {
    const pa = particles[i];
    pa.vy += pa.g * dt;
    pa.x += pa.vx * dt;
    pa.y += pa.vy * dt;
    pa.rot += pa.vr * dt;
    if ((now - pa.t0) / 1000 > pa.life) particles.splice(i, 1);
  }
  for (const p of players.values()) {
    if (p.bubble && now > p.bubble.until) p.bubble = null;
    if (p.react && now > p.react.until) p.react = null;
  }
}

// hiệu ứng hạt khi phạt (phấn trúng đầu -> bụi phấn ...), chạy một lần cho mỗi người
function runPenaltyParticles() {
  const wrong = q.results ? q.results.wrong : [];
  wrong.slice(0, 12).forEach((p, i) => {
    const hitAt = q.penaltyAt + (penaltyDelay(q.penalty, i)) / SPEED;
    if (!p._hitDone && now >= hitAt && p.seat >= 0) {
      p._hitDone = q.n;
      const hp = headPos(p);
      const prot = p.react && p.react.kind === 'umbrella';
      if (prot) {
        sparks(hp.x, hp.y - 20, 12, '#80deea');
        return;
      }
      if (q.penalty === 'phan') dust(hp.x, hp.y, 14);
      if (q.penalty === 'trung') dust(hp.x, hp.y, 8, 'rgba(255,214,0,0.9)');
      if (q.penalty === 'set') {
        dust(hp.x, hp.y, 10, 'rgba(60,60,60,0.8)');
        flash = 0.5;
      }
      if (q.penalty === 'ga') sparks(hp.x, hp.y, 10, '#ffeb3b');
      if (q.penalty === 'sap') dust(hp.x, SEATS[p.seat].y, 12, 'rgba(200,170,130,0.9)');
      if (q.penalty === 'bienHinh') {
        sparks(hp.x, hp.y, 6, '#e1bee7');
      }
      if (q.penalty === 'khoc') sparks(hp.x, hp.y, 8, '#4fc3f7');
      p.hitAt = now;
    }
  });
  for (const p of players.values()) if (p._hitDone && p._hitDone !== q.n) p._hitDone = 0;
}
function penaltyDelay(kind, i) {
  if (kind === 'ga') return 900 + i * 380;
  if (kind === 'set') return 500;
  if (kind === 'sap') return 900;
  if (kind === 'dienThoai') return 400;
  if (kind === 'bienHinh') return 600 + i * 250;
  if (kind === 'khoc') return 300 + i * 120;
  return 300 + i * 220 + (kind === 'trung' ? 320 : kind === 'phan' ? 280 : 120);
}

// ------------------------------------------------------------------ vẽ
let bgImage = null;
const BOARD = { x: 112, y: 100, w: 856, h: 382 };
const BOX = { x0: 240, y0: 522, w: 412, h: 186, gx: 12, gy: 14 };
function boxRect(i) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  return { x: BOX.x0 + col * (BOX.w + BOX.gx), y: BOX.y0 + row * (BOX.h + BOX.gy), w: BOX.w, h: BOX.h };
}
function headPos(p) {
  const s = SEATS[p.seat];
  if (!s) return { x: W / 2, y: 1200 };
  const h = s.h * (p.scale || 1);
  return { x: s.x, y: s.y - h * 0.78 };
}

function drawBackground() {
  if (bgImage) ctx.drawImage(bgImage, 0, 0, W, H);
  else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f3e0c8');
    g.addColorStop(1, '#c49a6c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1f4d3a';
    rr(BOARD.x - 10, BOARD.y - 10, BOARD.w + 20, BOARD.h + 20, 8);
    ctx.fill();
  }
}

function drawHeader() {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 86);
  g.addColorStop(0, 'rgba(120,20,20,0.95)');
  g.addColorStop(1, 'rgba(170,40,30,0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 84);
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(0, 84, W, 4);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff8e1';
  let s = 40;
  ctx.font = `900 ${s}px ${FONT}`;
  while (ctx.measureText(config.title).width > 610 && s > 22) ctx.font = `900 ${--s}px ${FONT}`;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 6;
  ctx.fillText(config.title, 22, 43);
  ctx.shadowBlur = 0;
  // tỉ số đội
  const x = 650;
  rr(x, 12, 412, 62, 31);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = '#b3e5fc';
  ctx.textAlign = 'left';
  ctx.fillText('👥 NGƯỜI XEM', x + 16, 43);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffcc80';
  ctx.fillText(`${config.className.toUpperCase()} 🎒`, x + 396, 43);
  ctx.textAlign = 'center';
  ctx.font = `900 34px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(`${team.viewers} : ${team.npc}`, x + 222, 44);
  ctx.restore();
}

function drawBoard() {
  if (!q || phase.name === 'lessonEnd') return;
  ctx.save();
  // nhãn câu
  const kindLabel = {
    hieuTruong: '👔 THẦY HIỆU TRƯỞNG DỰ GIỜ · x3', kiemTraMieng: `🎤 KIỂM TRA MIỆNG: ${truncate(players.get(q.target)?.name || '', 12)}`,
    sieuToc: '⚡ CÂU SIÊU TỐC', thachNa: '🤓 CÂU THÁCH NA · +10', meo: '🧠 CÂU ĐỐ MẸO',
  }[q.kind];
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `800 26px ${FONT}`;
  const head = `Câu ${q.n}/${lessonPlan.length} · ${q.mon}${q.lop ? ` lớp ${q.lop}` : ''}`;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText(head, BOARD.x + 22, BOARD.y + 34);
  if (kindLabel) {
    const pulse = 0.85 + 0.15 * Math.sin(now / 160);
    ctx.font = `900 26px ${FONT}`;
    const w = ctx.measureText(kindLabel).width + 30;
    const kx = BOARD.x + 22;
    rr(kx, BOARD.y + 56, w, 42, 21);
    ctx.fillStyle = `rgba(255,${q.kind === 'sieuToc' ? 60 : 193},${q.kind === 'sieuToc' ? 60 : 7},${pulse})`;
    ctx.fill();
    ctx.fillStyle = '#3e2723';
    ctx.fillText(kindLabel, kx + 15, BOARD.y + 78);
  }
  // câu hỏi bằng phấn
  const top = BOARD.y + (kindLabel ? 108 : 70);
  const maxH = BOARD.y + BOARD.h - (teacherBubbleOn() ? 100 : 20) - top;
  const ft = fitText(q.q, '700', CHALK, 54, 28, BOARD.w - 70, maxH, 4);
  ctx.font = ft.font;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbfbf2';
  ctx.shadowColor = 'rgba(255,255,255,0.35)';
  ctx.shadowBlur = 4;
  const lh = ft.size * 1.22;
  const y0 = top + (maxH - ft.lines.length * lh) / 2 + lh / 2;
  ft.lines.forEach((l, i) => ctx.fillText(l, BOARD.x + BOARD.w / 2, y0 + i * lh));
  ctx.shadowBlur = 0;
  ctx.restore();
  drawTimer();
}

function drawTimer() {
  if (phase.name !== 'ask' || !q) return;
  const cx = BOARD.x + BOARD.w - 58;
  const cy = BOARD.y + 58;
  const left = phaseLeft();
  const frac = clamp(left / q.secs, 0, 1);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, TAU);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
  ctx.lineWidth = 8;
  ctx.strokeStyle = left <= 5 ? '#ff5252' : '#ffd54a';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${left <= 5 ? 40 + Math.sin(now / 80) * 3 : 36}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.ceil(left)), cx, cy + 2);
  ctx.restore();
}

const teacherBubbleOn = () => teacherText && now - teacherTextAt < Math.min(9000, 2500 + teacherText.length * 70);
function drawTeacherBubble() {
  if (!teacherBubbleOn() || phase.name === 'lessonEnd') return;
  ctx.save();
  const a = clamp((now - teacherTextAt) / 200, 0, 1);
  ctx.globalAlpha = a;
  const x = BOARD.x + 10;
  const w = BOARD.w - 20;
  const ft = fitText(teacherText, '700', FONT, 28, 20, w - 40, 76, 2);
  const h = ft.lines.length * ft.size * 1.2 + 22;
  const y = BOARD.y + BOARD.h - h - 8;
  rr(x, y, w, h, 18);
  ctx.fillStyle = 'rgba(255,253,240,0.96)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 50, y + h);
  ctx.lineTo(x + 30, y + h + 30);
  ctx.lineTo(x + 90, y + h);
  ctx.fill();
  ctx.fillStyle = '#4e342e';
  ctx.font = ft.font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ft.lines.forEach((l, i) => ctx.fillText(i === 0 ? `👩‍🏫 ${l}` : l, x + 20, y + 11 + ft.size * 0.6 + i * ft.size * 1.2));
  ctx.restore();
}

function drawTeacher() {
  const rec = IMG['co-giao'];
  const hgt = 420;
  const baseX = 122;
  const baseY = 978;
  ctx.save();
  let ang = 0;
  let dy = Math.sin(now / 600) * 4;
  let dx = 0;
  if (teacherMood === 'happy') dy = -Math.abs(Math.sin(now / 160)) * 22;
  if (teacherMood === 'angry') dx = Math.sin(now / 40) * 5;
  if (teacherMood === 'faint') {
    const t = clamp((now - teacherTextAt) / 600, 0, 1);
    ang = -1.25 * ease(t);
  }
  ctx.translate(baseX + dx, baseY + dy);
  ctx.rotate(ang);
  if (rec && rec.ready) {
    const w = rec.img.naturalWidth * (hgt / rec.img.naturalHeight);
    ctx.drawImage(rec.img, -w / 2, -hgt, w, hgt);
  } else {
    ctx.fillStyle = '#90caf9';
    rr(-60, -hgt, 120, hgt, 40);
    ctx.fill();
  }
  ctx.restore();
  // biểu cảm vẽ thêm
  const headX = baseX + 6;
  const headY = baseY - hgt * 0.8;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (teacherMood === 'angry') {
    ctx.font = `48px ${FONT}`;
    ctx.fillText('💢', headX + 70, headY - 60 + Math.sin(now / 100) * 4);
  }
  if (teacherMood === 'cry') {
    for (let i = 0; i < 2; i++) {
      const t = ((now / 500) + i * 0.5) % 1;
      ctx.fillStyle = 'rgba(100,180,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(headX - 24 + i * 48, headY + 10 + t * 70, 7, 11, 0, 0, TAU);
      ctx.fill();
    }
    ctx.font = `44px ${FONT}`;
    ctx.fillText('😭', headX + 75, headY - 70);
  }
  if (teacherMood === 'happy') {
    ctx.font = `40px ${FONT}`;
    ctx.fillText('✨', headX + 80, headY - 70 + Math.sin(now / 120) * 6);
  }
  if (teacherMood === 'faint') {
    ctx.font = `40px ${FONT}`;
    ctx.fillText('💫', baseX - 120, baseY - 60);
    ctx.fillText('😵', baseX - 160, baseY - 120);
  }
  ctx.restore();
}

function drawBoxes() {
  if (!q || phase.name === 'lessonEnd' || phase.name === 'intro') return;
  const c = counts();
  const t = phaseT();
  // đèn chạy khi đếm ngược: nhanh rồi chậm dần, dừng ở ô đúng
  let lit = -1;
  if (phase.name === 'lock') {
    const total = Number(config.lockSeconds) || 5;
    const steps = Math.floor(14 * Math.sqrt(clamp(t / total, 0, 1)) * 3);
    lit = (q.correct + 4 * 10 - (42 - steps)) % 4;
    lit = ((lit % 4) + 4) % 4;
  }
  for (let i = 0; i < 4; i++) {
    const r = boxRect(i);
    let { x, y } = r;
    const { w, h } = r;
    const isRight = i === q.correct;
    const revealed = phase.name === 'reveal';
    const elim = q.eliminated && [...q.eliminated.values()].some((a) => a.includes(i));
    ctx.save();
    // ô sai bị sập
    if (revealed && !isRight && q.penalty === 'sap' && now > q.penaltyAt) {
      const k = ease(clamp((now - q.penaltyAt) / 1100, 0, 1));
      y += k * 900;
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(k * (i % 2 ? 0.6 : -0.6));
      ctx.translate(-(x + w / 2), -(y + h / 2));
      ctx.globalAlpha = 1 - k * 0.7;
    }
    if (revealed && !isRight && q.penalty !== 'sap') ctx.globalAlpha = 0.6;
    // khung
    rr(x, y, w, h, 22);
    let fill = 'rgba(255,253,245,0.95)';
    if (revealed && isRight) fill = `rgba(255,${215 + Math.sin(now / 120) * 20},80,0.98)`;
    if (revealed && !isRight) fill = 'rgba(255,205,210,0.95)';
    ctx.fillStyle = fill;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = lit === i ? 10 : revealed && isRight ? 8 : 4;
    ctx.strokeStyle = lit === i ? '#fff176' : revealed && isRight ? '#ff8f00' : OPT_COLORS[i];
    if (lit === i) {
      ctx.shadowColor = '#fff59d';
      ctx.shadowBlur = 30;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    // chữ cái
    ctx.beginPath();
    ctx.arc(x + 44, y + 50, 32, 0, TAU);
    ctx.fillStyle = OPT_COLORS[i];
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `900 38px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LETTERS[i], x + 44, y + 52);
    // nội dung
    const ft = fitText(q.opts[i], '800', FONT, 36, 20, w - 110, 92, 2);
    ctx.font = ft.font;
    ctx.fillStyle = '#263238';
    ctx.textAlign = 'left';
    ft.lines.forEach((l, k) => ctx.fillText(l, x + 88, y + 52 + (k - (ft.lines.length - 1) / 2) * ft.size * 1.15));
    // số người chọn
    const list = c[i];
    const nv = list.length;
    ctx.textAlign = 'right';
    ctx.font = `900 30px ${FONT}`;
    ctx.fillStyle = nv ? '#d84315' : '#90a4ae';
    ctx.fillText(`👥 ${nv}`, x + w - 14, y + h - 30);
    // avatar người chọn
    const show = list.slice(0, 7);
    show.forEach((p, k) => drawAvatar(x + 30 + k * 40, y + h - 32, 18, p, p.npc ? '#90caf9' : '#fff'));
    if (list.length > 7) {
      ctx.textAlign = 'left';
      ctx.font = `800 22px ${FONT}`;
      ctx.fillStyle = '#546e7a';
      ctx.fillText(`+${list.length - 7}`, x + 30 + 7 * 40 - 10, y + h - 30);
    }
    if (elim && phase.name === 'ask') {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x + 80, y + 52);
      ctx.lineTo(x + w - 30, y + 46);
      ctx.stroke();
    }
    if (revealed) {
      ctx.font = `900 54px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isRight ? '#2e7d32' : '#c62828';
      const s = 1 + 0.25 * Math.max(0, 1 - (now - q.revealAt) / 300);
      ctx.save();
      ctx.translate(x + w - 40, y + 44);
      ctx.scale(s, s);
      ctx.fillText(isRight ? '✔' : '✖', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}

function drawCountdown() {
  if (phase.name !== 'lock') return;
  const total = Number(config.lockSeconds) || 5;
  const t = phaseT();
  const n = Math.max(1, Math.ceil(total - t));
  const frac = 1 - ((total - t) % 1);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 930, W, 860);
  ctx.translate(W / 2, 1330);
  const s = 1.6 - ease(frac) * 0.6;
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, TAU);
  ctx.fillStyle = 'rgba(183,28,28,0.9)';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#ffd54a';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `900 150px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), 0, 8);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = `900 40px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 10;
  ctx.fillText('🔒 KHOÁ ĐÁP ÁN · HỒI HỘP QUÁ...', W / 2, 1520);
  ctx.restore();
}

// --- học sinh
function spriteFor(p) {
  return IMG[p.girl ? 'hs-nu' : 'hs-nam'];
}
function drawStudent(p) {
  const s = SEATS[p.seat];
  if (!s) return;
  const rec = spriteFor(p);
  let h = s.h * (p.scale || 1);
  let x = s.x;
  let y = s.y;
  const k = s.h / 200; // tỉ lệ theo hàng
  let ang = 0;
  let squash = 1;
  let alpha = 1;
  let dark = 0;
  const sleeping = isSleeping(p) || (p.npc === 'bin' && phase.name === 'ask' && !(p.bubble && p.bubble.kind === 'sleep') && !p.answer);
  const react = p.react;
  const revealed = phase.name === 'reveal' && q;
  // khiêng người nhanh nhất
  const carried = revealed && q.results && q.results.fastest === p && now - q.revealAt < 4500;
  if (carried) y -= 70 * k + Math.abs(Math.sin(now / 140)) * 16 * k;
  if (p.npc && revealed && q.results && q.results.fastest && (p.npc === 'mai' || p.npc === 'teo') && now - q.revealAt < 4500) return;
  if (p.answer && (phase.name === 'ask' || phase.name === 'lock')) y -= 10 * k;
  if (react && react.kind === 'happy' && revealed) y -= Math.abs(Math.sin((now - react.t0) / 150)) * 34 * k;
  if (react && react.kind === 'sad' && revealed && now > q.penaltyAt) {
    ang = Math.sin(now / 90) * 0.04;
    if (q.penalty === 'sap') squash = 0.82;
    if (q.penalty === 'set' && now > q.penaltyAt + 500) dark = 0.55;
  }
  if (react && react.kind === 'hide') {
    squash = 0.55;
  }
  if (react && react.kind === 'bow') ang = 0.35 * Math.abs(Math.sin((now - react.t0) / 500));
  if (sleeping) {
    ang = 0.18;
    alpha = 0.9;
  }
  if (!sleeping && !react) y += Math.sin(now / 500 + hashOf(p.id)) * 2 * k;
  if (react && react.kind === 'sad' && react.bien && revealed && q.results && now >= penaltyHitAt(p)) {
    drawTransformed(p, x, y, h, k);
    drawStudentExtras(p, x, y, h, k, false);
    return;
  }
  if (react && react.kind === 'sad' && q && q.penalty === 'khoc' && revealed && q.results && now >= penaltyHitAt(p)) {
    y -= Math.abs(Math.sin(now / 160 + hashOf(p.id))) * 8 * k; // nấc lên nấc xuống
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(1, squash);
  if (rec && rec.ready) {
    const w = rec.img.naturalWidth * (h / rec.img.naturalHeight);
    if (dark) ctx.filter = `brightness(${1 - dark})`;
    if (sleeping) ctx.filter = 'saturate(0.5)';
    ctx.drawImage(rec.img, -w / 2, -h, w, h);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = p.girl ? '#f48fb1' : '#90caf9';
    rr(-h * 0.2, -h, h * 0.4, h, h * 0.2);
    ctx.fill();
  }
  ctx.restore();
  if (carried) {
    // hai bạn khiêng ở dưới
    const mai = npc('mai');
    const teo = npc('teo');
    [mai, teo].forEach((n, i) => {
      if (!n) return;
      const r2 = spriteFor(n);
      if (!r2 || !r2.ready) return;
      const hh = s.h * 0.85;
      const ww = r2.img.naturalWidth * (hh / r2.img.naturalHeight);
      ctx.drawImage(r2.img, s.x + (i ? 0.32 : -0.32) * s.h - ww / 2, s.y - hh + Math.abs(Math.sin(now / 140 + i)) * 6, ww, hh);
    });
    ctx.save();
    ctx.font = `800 ${Math.round(26 * k + 10)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff176';
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 5;
    ctx.strokeText('NHANH NHẤT!', s.x, y - h - 30 * k);
    ctx.fillText('NHANH NHẤT!', s.x, y - h - 30 * k);
    ctx.restore();
  }
  drawStudentExtras(p, x, y, h, k, sleeping);
}

function penaltyHitAt(p) {
  const wrong = q.results.wrong;
  const i = Math.max(0, wrong.findIndex((w) => w.id === p.id));
  return q.penaltyAt + penaltyDelay(q.penalty, i) / SPEED;
}

// vẽ con vật thay cho bạn trả lời sai
function drawTransformed(p, x, y, h, k) {
  const [key] = p.react.bien;
  const rec = IMG[`bien-${key}`];
  const tt = (now - penaltyHitAt(p)) / 1000;
  const pop = tt < 0.35 ? 0.4 + ease(tt / 0.35) * 0.75 : 1.15 - Math.min(0.15, (tt - 0.35) * 0.6);
  const size = h * 0.62 * pop;
  const hop = Math.abs(Math.sin(now / 260 + hashOf(p.id))) * 12 * k;
  // bóng đổ
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y - 4 * k, size * 0.42, size * 0.1, 0, 0, TAU);
  ctx.fill();
  if (rec && rec.ready) ctx.drawImage(rec.img, x - size / 2, y - size - hop - h * 0.12, size, size);
  if (tt < 0.5) {
    // làn khói "bụp"
    const cy = y - h * 0.45;
    ctx.fillStyle = `rgba(255,255,255,${0.95 - tt * 1.9})`;
    for (let j = 0; j < 7; j++) {
      const ang = (j / 7) * TAU;
      const d = h * 0.18 * (0.4 + tt * 2);
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.7, h * 0.13 * (1 - tt), 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

// nước mắt chảy thành 2 dòng như vòi phun + vũng nước dưới chân
function drawTears(x, eyeY, r, t, big = false, footY = null) {
  ctx.save();
  const n = big ? 9 : 6;
  const spread = r * (big ? 1.6 : 1.1);
  for (const side of [-1, 1]) {
    for (let j = 0; j < n; j++) {
      const f = (t * (big ? 1.6 : 1.2) + j / n) % 1;
      const dx = side * (r * 0.32 + f * spread);
      const dy = -Math.sin(f * Math.PI) * r * (big ? 0.6 : 0.35) + f * f * r * (big ? 2.4 : 1.6);
      const rad = Math.max(1.5, r * (big ? 0.12 : 0.09) * (1 - f * 0.4));
      ctx.globalAlpha = 0.9 - f * 0.4;
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.arc(x + dx, eyeY + dy, rad, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 0.85;
  if (footY != null) {
    const pw = Math.min(1, t * 0.5) * r * (big ? 3.2 : 2);
    ctx.fillStyle = 'rgba(79,195,247,0.55)';
    ctx.beginPath();
    ctx.ellipse(x, footY, pw, pw * 0.22, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawStudentExtras(p, x, y, h, k, sleeping) {
  const headY = y - h * 0.78;
  const headR = h * 0.16;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // phụ kiện bạn 5A
  if (p.npc === 'na') {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = Math.max(2, 3 * k);
    const gy = headY + headR * 0.05;
    const crack = q && q.beatNa && phase.name === 'reveal' && now - q.revealAt > 1400;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + sx * headR * 0.42, gy, headR * 0.3, 0, TAU);
      ctx.stroke();
      if (crack) {
        ctx.beginPath();
        ctx.moveTo(x + sx * headR * 0.42 - headR * 0.2, gy - headR * 0.2);
        ctx.lineTo(x + sx * headR * 0.42, gy);
        ctx.lineTo(x + sx * headR * 0.42 - headR * 0.1, gy + headR * 0.25);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.moveTo(x - headR * 0.12, gy);
    ctx.lineTo(x + headR * 0.12, gy);
    ctx.stroke();
  }
  if (p.npc === 'mai') {
    ctx.fillStyle = '#d32f2f';
    rr(x - h * 0.15, y - h * 0.5, h * 0.3, h * 0.07, 3);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${Math.max(9, Math.round(h * 0.05))}px ${FONT}`;
    ctx.fillText('LỚP TRƯỞNG', x, y - h * 0.465);
  }
  if (p.npc === 'ti') {
    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.ellipse(x, headY - headR * 0.85, headR * 0.95, headR * 0.45, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(x - headR * 1.4, headY - headR * 0.9, headR * 0.7, headR * 0.15);
  }
  if (sleeping) {
    ctx.font = `800 ${Math.round(22 * k + 10)}px ${FONT}`;
    ctx.fillStyle = '#1a237e';
    const t = (now / 900) % 1;
    ctx.globalAlpha = 1 - t;
    ctx.fillText('Z', x + headR * 1.2 + t * 20, headY - headR - t * 40);
    ctx.globalAlpha = 1;
    ctx.fillText('z', x + headR * 1.1, headY - headR * 0.5);
  }
  // bảng con giơ đáp án
  if (p.answer && (phase.name === 'ask' || phase.name === 'lock') && !(p.react && p.react.kind === 'hide')) {
    const bw = 40 * k + 14;
    const bh = 34 * k + 12;
    const bx = x + headR * 1.1;
    const by = headY - headR * 1.6;
    rr(bx - bw / 2, by - bh / 2, bw, bh, 6);
    ctx.fillStyle = '#263238';
    ctx.fill();
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.round(bh * 0.72)}px ${CHALK}`;
    ctx.fillText(LETTERS[p.answer.opt], bx, by + 2);
  }
  // kiểm tra miệng: đèn chiếu
  if (q && q.kind === 'kiemTraMieng' && q.target === p.id && (phase.name === 'ask' || phase.name === 'lock')) {
    const g = ctx.createRadialGradient(x, y - h / 2, 10, x, y - h / 2, h);
    g.addColorStop(0, 'rgba(255,255,180,0.45)');
    g.addColorStop(1, 'rgba(255,255,180,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - h, y - h * 1.5, h * 2, h * 1.6);
    ctx.font = `900 ${Math.round(30 * k + 8)}px ${FONT}`;
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText('🎤 LÊN BẢNG!', x, y - h - 26 * k);
  }
  // phản ứng sau khi lật đáp án
  if (phase.name === 'reveal' && q && p.react) {
    if (p.react.kind === 'happy') {
      ctx.font = `${Math.round(30 * k + 12)}px ${FONT}`;
      ctx.fillText('⭐', x, headY - headR * 1.9 + Math.sin(now / 120) * 5);
      if (p.react.pts) {
        const t = clamp((now - p.react.t0) / 1600, 0, 1);
        ctx.globalAlpha = 1 - t;
        ctx.font = `900 ${Math.round(26 * k + 12)}px ${FONT}`;
        ctx.fillStyle = '#ffeb3b';
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 4;
        ctx.strokeText(`+${p.react.pts}`, x + headR * 1.6, headY - t * 60);
        ctx.fillText(`+${p.react.pts}`, x + headR * 1.6, headY - t * 60);
        ctx.globalAlpha = 1;
      }
    }
    if (p.react.kind === 'umbrella' && now > q.penaltyAt - 300) {
      drawUmbrella(x, headY - headR * 1.4, headR * 2.2);
    }
    if (p.react.kind === 'sad' && now > q.penaltyAt && !p.react.bien) drawPenaltyOn(p, x, y, h, k, headY, headR);
    if (p.react.kind === 'sad' && q.results && now > q.penaltyAt) {
      // ai trả lời sai cũng khóc sau khi bị phạt (biến hình thì con vật khóc)
      const hit = penaltyHitAt(p);
      const isKhoc = q.penalty === 'khoc';
      const cryAt = hit + (isKhoc ? 0 : 900) / SPEED;
      if (now > cryAt) {
        const tt = (now - cryAt) / 1000;
        if (p.react.bien) {
          const size = h * 0.62;
          drawTears(x, y - h * 0.12 - size * 0.62, size * 0.3, tt, false, y - 2 * k);
        } else drawTears(x, headY + headR * 0.1, headR, tt, isKhoc, isKhoc ? y - 2 * k : null);
        if (isKhoc && Math.floor(tt * 1.5) % 2 === 0) {
          ctx.save();
          ctx.font = `900 ${Math.round(16 * k + 8)}px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#e1f5fe';
          ctx.strokeStyle = '#01579b';
          ctx.lineWidth = 4;
          ctx.strokeText('HU HU', x, headY - headR * 2.1);
          ctx.fillText('HU HU', x, headY - headR * 2.1);
          ctx.restore();
        }
      }
    }
    if (p.react.kind === 'sad' && now <= q.penaltyAt) {
      ctx.font = `${Math.round(26 * k + 10)}px ${FONT}`;
      ctx.fillText('😰', x + headR * 1.3, headY - headR);
    }
  }
  // bóng nói
  if (p.bubble) drawBubble(p, x, headY - headR * 1.7, k);
  ctx.restore();
}

function drawUmbrella(x, y, r) {
  ctx.save();
  ctx.fillStyle = '#26a69a';
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, TAU);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#004d40';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + r * 0.9);
  ctx.stroke();
  ctx.font = `800 ${Math.round(r * 0.32)}px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('MIỄN PHẠT', x, y - r * 0.38);
  ctx.restore();
}

function drawPenaltyOn(p, x, y, h, k, headY, headR) {
  const wrong = q.results.wrong;
  const i = Math.max(0, wrong.findIndex((w) => w.id === p.id));
  const hitAt = q.penaltyAt + penaltyDelay(q.penalty, i) / SPEED;
  const before = now < hitAt;
  const tt = (now - hitAt) / 1000;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  switch (q.penalty) {
    case 'phan': {
      if (before) {
        // viên phấn bay từ tay cô
        const start = { x: 230, y: 700 };
        const t0 = hitAt - 600 / SPEED;
        const f = clamp((now - t0) / (600 / SPEED), 0, 1);
        if (f > 0) {
          const cx = start.x + (x - start.x) * f;
          const cy = start.y + (headY - start.y) * f - Math.sin(f * Math.PI) * 160;
          ctx.translate(cx, cy);
          ctx.rotate(f * 12);
          ctx.fillStyle = '#fff';
          ctx.fillRect(-12, -4, 24, 8);
        }
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(x, headY, headR * 0.9, 0, TAU);
        ctx.fill();
        // tóc dựng
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = Math.max(2, 3 * k);
        for (let j = -2; j <= 2; j++) {
          ctx.beginPath();
          ctx.moveTo(x + j * headR * 0.3, headY - headR * 0.9);
          ctx.lineTo(x + j * headR * 0.45, headY - headR * 1.6 - Math.abs(Math.sin(now / 80 + j)) * 6);
          ctx.stroke();
        }
        ctx.font = `${Math.round(24 * k + 10)}px ${FONT}`;
        ctx.fillText('💥', x + headR, headY - headR);
      }
      break;
    }
    case 'trung': {
      if (before) {
        const f = clamp(1 - (hitAt - now) / (320 / SPEED), 0, 1);
        if (f > 0) {
          ctx.fillStyle = '#fffde7';
          ctx.beginPath();
          ctx.ellipse(x, headY - headR * 4 + f * headR * 3, headR * 0.45, headR * 0.6, 0, 0, TAU);
          ctx.fill();
        }
      } else {
        // lòng đỏ trên đầu + gà con
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.ellipse(x, headY - headR * 0.8, headR * 0.9, headR * 0.35, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffb300';
        ctx.beginPath();
        ctx.arc(x + headR * 0.1, headY - headR * 0.82, headR * 0.3, 0, TAU);
        ctx.fill();
        if (tt > 0.6) {
          const bob = Math.abs(Math.sin(now / 150)) * 6 * k;
          const cx = x - headR * 0.3;
          const cy = headY - headR * 1.25 - bob;
          ctx.fillStyle = '#ffeb3b';
          ctx.beginPath();
          ctx.arc(cx, cy, headR * 0.35, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#ff6f00';
          ctx.beginPath();
          ctx.moveTo(cx + headR * 0.3, cy);
          ctx.lineTo(cx + headR * 0.55, cy + headR * 0.07);
          ctx.lineTo(cx + headR * 0.3, cy + headR * 0.14);
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(cx + headR * 0.12, cy - headR * 0.08, Math.max(1.5, headR * 0.06), 0, TAU);
          ctx.fill();
          if (Math.floor(now / 400) % 3 === 0) {
            ctx.font = `700 ${Math.round(16 * k + 8)}px ${FONT}`;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText('chiếp!', cx + headR, cy - headR * 0.6);
            ctx.fillText('chiếp!', cx + headR, cy - headR * 0.6);
          }
        }
      }
      break;
    }
    case 'set': {
      // mây đen
      ctx.fillStyle = 'rgba(55,55,65,0.92)';
      const cy = headY - headR * 3.2;
      for (const [dx, r] of [[-0.6, 0.55], [0, 0.75], [0.6, 0.55]]) {
        ctx.beginPath();
        ctx.arc(x + dx * headR * 1.6, cy, r * headR * 1.3, 0, TAU);
        ctx.fill();
      }
      if (!before && tt < 0.35) {
        ctx.strokeStyle = '#fff59d';
        ctx.lineWidth = Math.max(3, 5 * k);
        ctx.beginPath();
        ctx.moveTo(x, cy + headR * 0.6);
        ctx.lineTo(x - headR * 0.4, cy + headR * 1.5);
        ctx.lineTo(x + headR * 0.2, cy + headR * 1.6);
        ctx.lineTo(x - headR * 0.2, headY - headR * 0.6);
        ctx.stroke();
      }
      if (!before) {
        ctx.strokeStyle = '#111';
        ctx.lineWidth = Math.max(2, 3 * k);
        for (let j = -3; j <= 3; j++) {
          ctx.beginPath();
          const bx = x + j * headR * 0.28;
          ctx.moveTo(bx, headY - headR * 0.8);
          ctx.lineTo(bx + headR * 0.15, headY - headR * 1.2);
          ctx.lineTo(bx - headR * 0.1, headY - headR * 1.5);
          ctx.stroke();
        }
        // mưa
        ctx.strokeStyle = 'rgba(120,170,255,0.8)';
        ctx.lineWidth = 2;
        for (let j = 0; j < 6; j++) {
          const rx = x - headR * 1.3 + ((j * 37 + now / 4) % (headR * 2.6));
          const ry = cy + headR * 0.8 + ((now / 3 + j * 23) % (headR * 1.8));
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 3, ry + 10);
          ctx.stroke();
        }
      }
      break;
    }
    case 'mu': {
      const f = before ? clamp(1 - (hitAt - now) / (300 / SPEED), 0, 1) : 1;
      const hy = headY - headR * 0.6 - (1 - f) * headR * 4;
      ctx.fillStyle = '#fafafa';
      ctx.strokeStyle = '#9e9e9e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - headR * 0.85, hy);
      ctx.lineTo(x + headR * 0.85, hy);
      ctx.lineTo(x + headR * 0.1, hy - headR * 2.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.translate(x + headR * 0.05, hy - headR * 0.9);
      ctx.rotate(-0.06);
      ctx.fillStyle = '#c62828';
      ctx.font = `900 ${Math.max(9, Math.round(headR * 0.42))}px ${FONT}`;
      ctx.fillText('HỌC', 0, -headR * 0.32);
      ctx.fillText('LẠI', 0, headR * 0.18);
      ctx.restore();
      break;
    }
    case 'ga': {
      if (!before && tt < 1.2) {
        ctx.font = `${Math.round(24 * k + 10)}px ${FONT}`;
        ctx.fillText('💫', x, headY - headR * 1.4);
      }
      break;
    }
    case 'dienThoai': {
      ctx.font = `${Math.round(26 * k + 10)}px ${FONT}`;
      ctx.fillText('😱', x + headR * 1.2, headY - headR);
      break;
    }
    case 'sap': {
      if (!before) {
        ctx.font = `${Math.round(24 * k + 10)}px ${FONT}`;
        ctx.fillText('😵', x + headR * 1.2, headY - headR);
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// sân khấu phạt: phóng to ảnh đại diện nhóm sai ở giữa lớp để ai cũng thấy rõ màn phạt
const PEN_TITLE = { phan: '🧑‍🏫 Cô ném phấn trúng đầu!', sap: '💥 Ô đáp án sập!', trung: '🥚 Điểm trứng ngỗng!', ga: '🐓 Gà trống mổ đầu!', set: '⚡ Sét đánh tóc xù!', mu: '🎓 Đội mũ HỌC LẠI!', bienHinh: '🪄 Phép thuật: BIẾN HÌNH!', khoc: '😭 Khóc lụt cả lớp!' };
function drawPenaltyStage() {
  if (phase.name !== 'reveal' || !q || !q.results || q.penalty === 'dienThoai' || now < q.penaltyAt) return;
  const wrong = q.results.wrong;
  const vw = wrong.filter((p) => !p.npc);
  const list = (vw.length ? vw : wrong).slice(0, 4);
  if (!list.length) return;
  const t = (now - q.penaltyAt) / 1000 * SPEED;
  const a = clamp(t * 4, 0, 1) * clamp((5.2 - t) * 2, 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  const y0 = 1150;
  const hgt = 370;
  rr(50, y0, W - 100, hgt, 30);
  ctx.fillStyle = 'rgba(30,10,10,0.78)';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ff7043';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 40px ${FONT}`;
  ctx.fillStyle = '#ffccbc';
  ctx.fillText(`${PEN_TITLE[q.penalty] || 'Bị phạt!'}${wrong.length > list.length ? `  (${wrong.length} bạn)` : ''}`, W / 2, y0 + 44);
  const n = list.length;
  const gap = Math.min(230, (W - 160) / n);
  list.forEach((p, i) => {
    const cx = W / 2 + (i - (n - 1) / 2) * gap;
    const cy = y0 + 215;
    const r = 66;
    const prot = p.react && p.react.kind === 'umbrella';
    const shakeX = !prot && t > 0.3 ? Math.sin(now / 45 + i) * 3 : 0;
    const bien = !prot && p.react && p.react.bien;
    const changed = bien && t > 0.6 + i * 0.25;
    if (changed) {
      const rec = IMG[`bien-${bien[0]}`];
      const ct = t - 0.6 - i * 0.25;
      const s2 = r * 2.3 * (ct < 0.3 ? 0.5 + ease(ct / 0.3) * 0.6 : 1.1 - Math.min(0.1, (ct - 0.3) * 0.4));
      const hop = Math.abs(Math.sin(now / 240 + i)) * 10;
      if (ct < 0.35) {
        ctx.fillStyle = `rgba(255,255,255,${0.9 - ct * 2.4})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r * (1 + ct * 3), 0, TAU);
        ctx.fill();
      }
      if (rec && rec.ready) ctx.drawImage(rec.img, cx - s2 / 2, cy - s2 / 2 - hop, s2, s2);
      drawAvatar(cx + r * 0.85, cy + r * 0.75, r * 0.36, p, '#ef5350');
      if (ct > 0.5) drawTears(cx, cy - r * 0.25 - hop, r * 0.55, ct - 0.5);
      ctx.font = `800 21px ${FONT}`;
      ctx.fillStyle = '#e1bee7';
      ctx.fillText(`→ ${bien[1]}`, cx, cy + r + 62);
    } else drawAvatar(cx + shakeX, cy, r, p, prot ? '#80deea' : '#ef5350');
    if (prot) drawUmbrella(cx, cy - r * 0.9, r * 1.25);
    else if (bien) {
      if (!changed) {
        ctx.font = `52px ${FONT}`;
        ctx.fillText('🪄', cx - r * 0.9, cy - r * 0.9 - Math.sin(now / 80) * 6);
      }
    } else if (q.penalty === 'khoc') {
      const ct = t - 0.3;
      if (ct > 0) drawTears(cx, cy - r * 0.05, r * 0.8, ct, true, cy + r + 8);
      if (ct > 0 && Math.floor(ct * 1.5) % 2 === 0) {
        ctx.font = `900 30px ${FONT}`;
        ctx.fillStyle = '#b3e5fc';
        ctx.fillText('HU HU!', cx, cy - r - 20);
      }
    } else {
      // dùng lại hình phạt nhưng phóng to theo ảnh đại diện
      const fake = { ...p };
      ctx.save();
      drawPenaltyOn(fake, cx, cy + r, r * 2.2, 2.2, cy, q.penalty === 'set' ? r * 0.7 : r * 0.95);
      ctx.restore();
      if (q.penalty === 'ga' && t > 0.9 + i * 0.38) {
        ctx.font = `48px ${FONT}`;
        ctx.fillText('🐓', cx + r * 0.9, cy - r * 0.9);
      }
      if (q.penalty === 'sap' && t > 0.9) {
        ctx.font = `46px ${FONT}`;
        ctx.fillText('😵', cx + r * 0.9, cy - r * 0.8);
      }
    }
    ctx.font = `800 26px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(truncate(p.name, 11), cx, cy + r + 34);
    if (prot) {
      ctx.font = `700 20px ${FONT}`;
      ctx.fillStyle = '#80deea';
      ctx.fillText('thẻ miễn phạt', cx, cy + r + 60);
    }
  });
  ctx.restore();
}

function drawBubble(p, x, y, k) {
  const b = p.bubble;
  const a = clamp((now - b.t0) / 150, 0, 1) * clamp((b.until - now) / 300, 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  const size = Math.round(clamp(18 * k + 10, 18, 30));
  ctx.font = `800 ${size}px ${FONT}`;
  const w = Math.min(460, ctx.measureText(b.text).width + 24);
  const h = size + 18;
  let bx = clamp(x - w / 2, 8, W - w - 8);
  const by = y - h - 8;
  rr(bx, by, w, h, h / 2);
  ctx.fillStyle = b.kind === 'whisper' ? 'rgba(225,245,254,0.97)' : b.kind === 'sleep' ? 'rgba(232,234,246,0.95)' : b.kind === 'chat' ? 'rgba(255,255,255,0.95)' : 'rgba(255,249,196,0.97)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 8, by + h - 1);
  ctx.lineTo(x, by + h + 12);
  ctx.lineTo(x + 8, by + h - 1);
  ctx.fill();
  ctx.fillStyle = '#263238';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let t = b.text;
  while (ctx.measureText(t).width > w - 20 && t.length > 3) t = `${t.slice(0, -2)}…`;
  ctx.fillText(t, bx + w / 2, by + h / 2 + 1);
  ctx.restore();
}

function drawNameTag(p) {
  const s = SEATS[p.seat];
  if (!s) return;
  const k = s.h / 200;
  const size = Math.round(clamp(15 * k + 7, 14, 24));
  ctx.save();
  ctx.font = `800 ${size}px ${FONT}`;
  let icons = '';
  if (p.lopTruong) icons += '👑';
  if (p.follow) icons += '🧣';
  if ((p.streak || 0) >= 5) icons += '🎓';
  else if ((p.streak || 0) >= 3) icons += '💡';
  if (p.umbrellas) icons += `☂${p.umbrellas > 1 ? p.umbrellas : ''}`;
  const label = `${icons}${truncate(p.name, p.npc ? 9 : 10)}${p.score ? ` ${p.score}` : ''}`;
  const w = ctx.measureText(label).width + 16;
  const h = size + 8;
  const x = clamp(s.x - w / 2, 4, W - w - 4);
  const y = s.y + 4;
  rr(x, y, w, h, h / 2);
  ctx.fillStyle = p.npc ? 'rgba(26,35,126,0.85)' : 'rgba(0,0,0,0.6)';
  ctx.fill();
  ctx.fillStyle = p.npc ? '#bbdefb' : '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawClass() {
  const list = [...players.values()].filter((p) => p.seat >= 0).sort((a, b) => SEATS[a.seat].y - SEATS[b.seat].y);
  for (const p of list) drawStudent(p);
  for (const p of list) drawNameTag(p);
}

function drawPrincipal() {
  if (!principal) return;
  const rec = IMG['thay-hieu-truong'];
  const t = (now - principal.t0) / 1000;
  let x = 1180 - ease(t / 1.6) * 480;
  if (principal.leaveAt) x = 700 + ease((now - principal.leaveAt) / 1600) * 480;
  const hgt = 330;
  const y = 1262 + Math.abs(Math.sin(now / 220)) * (t < 1.6 || principal.leaveAt ? 6 : 0);
  if (rec && rec.ready) {
    const w = rec.img.naturalWidth * (hgt / rec.img.naturalHeight);
    ctx.drawImage(rec.img, x - w / 2, y - hgt, w, hgt);
  }
  if (t > 1.6 && !principal.leaveAt) {
    ctx.save();
    ctx.font = `900 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 5;
    ctx.strokeText('Thầy hiệu trưởng · x3', x, y - hgt - 18);
    ctx.fillText('Thầy hiệu trưởng · x3', x, y - hgt - 18);
    ctx.restore();
  }
}

function drawRooster() {
  if (!rooster || phase.name !== 'reveal' || !q || !q.results) return;
  const wrong = q.results.wrong.filter((p) => p.seat >= 0 && !(p.react && p.react.kind === 'umbrella')).slice(0, 8);
  const rec = IMG['ga-trong'];
  const t = (performance.now() - rooster.t0) / 1000 * SPEED;
  // bay vào từ cửa sổ trái, ghé đầu từng bạn sai, rồi bay ra
  const pts = [{ x: -120, y: 1050 }, ...wrong.map((p) => { const hp = headPos(p); return { x: hp.x, y: hp.y - 60 }; }), { x: W + 150, y: 900 }];
  const seg = 0.38;
  const lead = 0.9;
  let pos;
  if (t < lead) {
    const f = t / lead;
    pos = { x: pts[0].x + (pts[1].x - pts[0].x) * f, y: pts[0].y + (pts[1].y - pts[0].y) * f };
  } else {
    const i = Math.min(pts.length - 2, 1 + Math.floor((t - lead) / seg));
    const f = clamp(((t - lead) % seg) / seg, 0, 1);
    if (i >= pts.length - 1) return;
    pos = { x: pts[i].x + (pts[i + 1].x - pts[i].x) * ease(f), y: pts[i].y + (pts[i + 1].y - pts[i].y) * ease(f) - Math.sin(f * Math.PI) * 50 };
    if (t > lead + seg * (pts.length - 1)) {
      rooster = null;
      return;
    }
  }
  const hgt = 170;
  ctx.save();
  ctx.translate(pos.x, pos.y + Math.sin(now / 60) * 6);
  if (rec && rec.ready) {
    const w = rec.img.naturalWidth * (hgt / rec.img.naturalHeight);
    ctx.drawImage(rec.img, -w / 2, -hgt / 2, w, hgt);
  } else {
    ctx.font = `100px ${FONT}`;
    ctx.fillText('🐓', -50, 30);
  }
  if (t < 2.2) {
    ctx.font = `900 34px ${FONT}`;
    ctx.fillStyle = '#ffeb3b';
    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 6;
    ctx.textAlign = 'center';
    ctx.strokeText('Ò Ó O! HỌC BÀI ĐI!', 0, -hgt / 2 - 12);
    ctx.fillText('Ò Ó O! HỌC BÀI ĐI!', 0, -hgt / 2 - 12);
  }
  ctx.restore();
}

function drawPhone() {
  if (phase.name !== 'reveal' || !q || q.penalty !== 'dienThoai' || now < q.penaltyAt) return;
  const wrong = q.results.wrong.filter((p) => !p.npc && !(p.react && p.react.kind === 'umbrella'));
  const names = (wrong.length ? wrong : q.results.wrong).map((p) => truncate(p.name, 12)).slice(0, 4);
  if (!names.length) return;
  const t = (now - q.penaltyAt) / 1000;
  const a = clamp(t * 4, 0, 1) * clamp((q.penaltyAt + 5200 - now) / 400, 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  const x = W / 2 + (t < 2.4 ? Math.sin(now / 30) * 6 : 0);
  const y = 1300;
  ctx.translate(x, y);
  rr(-200, -280, 400, 560, 50);
  ctx.fillStyle = '#212121';
  ctx.fill();
  rr(-180, -240, 360, 470, 20);
  const g = ctx.createLinearGradient(0, -240, 0, 230);
  g.addColorStop(0, '#43a047');
  g.addColorStop(1, '#1b5e20');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText('📞 Đang gọi phụ huynh của:', 0, -190);
  ctx.font = `900 34px ${FONT}`;
  names.forEach((n, i) => ctx.fillText(n, 0, -120 + i * 48));
  if (q.results.wrong.length > names.length) {
    ctx.font = `700 24px ${FONT}`;
    ctx.fillText(`và ${q.results.wrong.length - names.length} bạn nữa...`, 0, -120 + names.length * 48);
  }
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(t < 2.4 ? `reng reng${'.'.repeat(1 + (Math.floor(now / 300) % 3))}` : '"Alo, mẹ ơi con biết lỗi rồi!"', 0, 120);
  ctx.beginPath();
  ctx.arc(0, 190, 32, 0, TAU);
  ctx.fillStyle = '#e53935';
  ctx.fill();
  ctx.restore();
}

function drawRain() {
  if (!(teacherMood === 'cry' && phase.name === 'reveal')) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(140,180,255,0.55)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 70; i++) {
    const x = (i * 157 + now * 0.05) % W;
    const y = 960 + ((i * 97 + now * 0.9) % 830);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y + 22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawToasts() {
  ctx.save();
  let y = 965;
  for (let i = toasts.length - 1; i >= 0; i--) {
    const t = toasts[i];
    const age = (now - t.t0) / 1000;
    if (age > 5) {
      toasts.splice(i, 1);
      continue;
    }
    const a = clamp(age * 5, 0, 1) * clamp((5 - age) * 2, 0, 1);
    ctx.globalAlpha = a;
    ctx.font = `800 27px ${FONT}`;
    const w = Math.min(W - 40, ctx.measureText(t.text).width + 34);
    rr(W / 2 - w / 2, y, w, 46, 23);
    ctx.fillStyle = 'rgba(20,20,30,0.78)';
    ctx.fill();
    ctx.fillStyle = t.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.text, W / 2, y + 24);
    y += 54;
  }
  ctx.restore();
}

function drawParticles() {
  for (const pa of particles) {
    const age = (now - pa.t0) / 1000;
    const a = clamp(1 - age / pa.life, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(pa.x, pa.y);
    if (pa.kind === 'confetti') {
      ctx.rotate(pa.rot);
      ctx.fillStyle = pa.color;
      ctx.fillRect(-pa.size / 2, -pa.size / 4, pa.size, pa.size / 2);
    } else if (pa.kind === 'heart') {
      ctx.font = `${pa.size}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('❤️', 0, 0);
    } else if (pa.kind === 'dust') {
      ctx.fillStyle = pa.color;
      ctx.beginPath();
      ctx.arc(0, 0, pa.size * (1 + age), 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = pa.color;
      ctx.beginPath();
      ctx.arc(0, 0, pa.size, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBottom() {
  const y0 = 1786;
  ctx.save();
  const g = ctx.createLinearGradient(0, y0, 0, H);
  g.addColorStop(0, 'rgba(62,39,35,0.92)');
  g.addColorStop(1, 'rgba(40,24,20,0.97)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, H - y0);
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(0, y0, W, 3);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  if (phase.name === 'reveal' && q && q.results) {
    const names = q.results.vRight.map((p) => truncate(p.name, 12));
    ctx.font = `900 30px ${FONT}`;
    ctx.fillStyle = '#ffe082';
    ctx.fillText(names.length ? `🏅 BẢNG VÀNG: ${q.results.vRight.length} bạn trả lời đúng` : '😢 Câu này chưa người xem nào đúng', W / 2, y0 + 36);
    if (names.length) {
      ctx.font = `800 26px ${FONT}`;
      ctx.fillStyle = '#fff';
      const text = names.join('  ·  ');
      const tw = ctx.measureText(text).width;
      if (tw < W - 40) ctx.fillText(text, W / 2, y0 + 88);
      else {
        const off = ((now - q.revealAt) / 8) % (tw + W);
        ctx.textAlign = 'left';
        ctx.fillText(text, W - off, y0 + 88);
      }
    }
  } else {
    ctx.font = `900 34px ${FONT}`;
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText('💬 Gõ  A · B · C · D  để trả lời!', W / 2, y0 + 34);
    ctx.font = `700 21px ${FONT}`;
    ctx.fillStyle = '#ffccbc';
    ctx.fillText(`❤️ ${config.likesPerHint} like: Na nhắc bài  ·  📣 Share: thẻ miễn phạt  ·  ⭐ Follow: khăn quàng +${config.followBonus}`, W / 2, y0 + 72);
    const top = viewers().filter((p) => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
    ctx.font = `800 23px ${FONT}`;
    ctx.fillStyle = '#fff';
    const medals = ['🥇', '🥈', '🥉', '4.'];
    const txt = top.length ? top.map((p, i) => `${medals[i]} ${truncate(p.name, 9)} ${p.score}`).join('   ') : `Tiết ${lesson} · Ai giỏi nhất sẽ nhận giấy khen!`;
    ctx.fillText(txt, W / 2, y0 + 108);
  }
  ctx.restore();
}

function drawIntro() {
  if (phase.name !== 'intro') return;
  const t = phaseT();
  const a = clamp(t * 3, 0, 1) * clamp((phaseLeft()) * 2, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(W / 2, 290);
  const s = 0.8 + ease(t * 2) * 0.2;
  ctx.scale(s, s);
  ctx.fillStyle = '#fbfbf2';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 64px ${CHALK}`;
  ctx.fillText(`🥁 Tiết học số ${lesson}`, 0, -70);
  ctx.font = `700 40px ${CHALK}`;
  ctx.fillText(`Người xem ⚔ ${config.className}: ${lessonPlan.length} câu hỏi`, 0, 10);
  ctx.font = `700 34px ${CHALK}`;
  ctx.fillStyle = '#ffeb3b';
  ctx.fillText('Gõ A, B, C, D vào bình luận để trả lời!', 0, 80);
  ctx.restore();
}

function drawLessonEnd() {
  if (phase.name !== 'lessonEnd' || !lessonSummary) return;
  const S = lessonSummary;
  const t = phaseT();
  const a = clamp(t * 3, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(10,10,20,0.72)';
  ctx.fillRect(0, 88, W, 1698);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // kết quả đội
  const title = S.result === 'win' ? '🎉 NGƯỜI XEM THẮNG LỚP 5A!' : S.result === 'lose' ? '🎒 LỚP 5A THẮNG RỒI!' : '🤝 HOÀ NHAU!';
  ctx.font = `900 58px ${FONT}`;
  ctx.fillStyle = S.result === 'win' ? '#ffeb3b' : S.result === 'lose' ? '#ffab91' : '#b3e5fc';
  ctx.fillText(title, W / 2, 170);
  ctx.font = `900 46px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(`Người xem ${S.v}  :  ${S.n} ${config.className}`, W / 2, 240);
  ctx.font = `700 30px ${FONT}`;
  ctx.fillStyle = '#e0e0e0';
  ctx.fillText(S.result === 'lose' ? 'Na Mọt Sách: "Bạn về học lại lớp 5 nhé!"' : S.result === 'win' ? 'Cả lớp 5A cúi đầu: "Dạ thưa thầy cô danh dự!"' : 'Tiết sau phân thắng bại nhé!', W / 2, 292);
  // giấy khen
  const best = S.top[0];
  const gk = IMG['giay-khen'];
  const gw = 520;
  const gh = 696;
  const gx = W / 2 - gw / 2;
  const gy = 340;
  const sc = 0.7 + ease((t - 0.3) * 2) * 0.3;
  ctx.save();
  ctx.translate(W / 2, gy + gh / 2);
  ctx.scale(sc, sc);
  ctx.rotate(Math.sin(now / 900) * 0.015);
  ctx.translate(-W / 2, -(gy + gh / 2));
  if (gk && gk.ready) ctx.drawImage(gk.img, gx, gy, gw, gh);
  else {
    ctx.fillStyle = '#fff8e1';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = '#c62828';
    ctx.lineWidth = 16;
    ctx.strokeRect(gx + 8, gy + 8, gw - 16, gh - 16);
  }
  ctx.fillStyle = '#b71c1c';
  ctx.font = `900 64px ${FONT}`;
  ctx.fillText('GIẤY KHEN', W / 2, gy + 150);
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = '#5d4037';
  ctx.fillText(`Tiết học số ${S.lesson} · ${config.className}`, W / 2, gy + 205);
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText('Cô giáo khen tặng em:', W / 2, gy + 270);
  if (best) {
    drawAvatar(W / 2, gy + 360, 56, best, '#ffb300');
    const nf = fitText(best.name, '900', FONT, 46, 26, gw - 90, 60, 1);
    ctx.font = nf.font;
    ctx.fillStyle = '#c62828';
    ctx.fillText(nf.lines[0] || '', W / 2, gy + 450);
    const sf = fitText(`Đạt ${best.score} điểm, giỏi nhất tiết học`, '700', FONT, 28, 18, gw - 110, 40, 1);
    ctx.font = sf.font;
    ctx.fillStyle = '#4e342e';
    ctx.fillText(sf.lines[0] || '', W / 2, gy + 505);
  } else {
    ctx.font = `700 30px ${FONT}`;
    ctx.fillStyle = '#6d4c41';
    ctx.fillText('Chưa có ai... tiết sau nhé!', W / 2, gy + 400);
  }
  ctx.font = `italic 600 24px ${FONT}`;
  ctx.fillStyle = '#6d4c41';
  ctx.fillText('"Thông minh hơn học sinh lớp 5"', W / 2, gy + 580);
  ctx.restore();
  // top 2, 3 + giải phụ
  let y = 1090;
  ctx.font = `800 34px ${FONT}`;
  S.top.slice(1, 3).forEach((p, i) => {
    drawAvatar(250, y, 30, p, i ? '#bcaaa4' : '#cfd8dc');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${i ? '🥉' : '🥈'} ${truncate(p.name, 16)} · ${p.score} điểm`, 295, y);
    y += 76;
  });
  ctx.textAlign = 'center';
  y = Math.max(y + 10, 1260);
  ctx.font = `800 30px ${FONT}`;
  if (S.liker) {
    ctx.fillStyle = '#f8bbd0';
    ctx.fillText(`❤️ Chăm chỉ nhất lớp: ${truncate(S.liker.name, 16)} (${S.liker.likesLesson} like)`, W / 2, y);
    y += 58;
  }
  if (S.hardest) {
    ctx.fillStyle = '#ffe0b2';
    ctx.fillText(`🪣 Giải Cố Gắng: ${truncate(S.hardest.name, 16)} (cúp... cái xô!)`, W / 2, y);
    y += 58;
  }
  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = '#b0bec5';
  ctx.fillText(`🔔 Tiết sau bắt đầu sau ${Math.ceil(phaseLeft())} giây`, W / 2, Math.max(y + 20, 1560));
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
  drawBackground();
  if (shake > 0) ctx.translate(rand(-8, 8) * shake, rand(-8, 8) * shake);
  drawBoard();
  drawIntro();
  drawPrincipal();
  drawClass();
  drawRain();
  drawBoxes();
  drawTeacher();
  drawTeacherBubble();
  drawPenaltyStage();
  drawRooster();
  drawPhone();
  drawCountdown();
  drawParticles();
  drawToasts();
  drawBottom();
  drawHeader();
  drawLessonEnd();
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = `900 70px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('⏸ TẠM DỪNG', W / 2, H / 2);
  }
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,250,220,${flash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (audioBlocked && !PREVIEW) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(W / 2 - 250, 1720, 500, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔇 Bấm vào game để bật tiếng', W / 2, 1749);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ kết nối
let ws = null;
function sendState() {
  if (PREVIEW || !ws || ws.readyState !== 1) return;
  const c = q ? counts().map((l) => l.filter((p) => !p.npc).length) : [];
  ws.send(JSON.stringify({
    cmd: 'gameState',
    state: {
      lesson, q: qIndex, total: lessonPlan.length, phase: phase.name, question: q ? q.q : '',
      answer: q ? `${LETTERS[q.correct]}. ${q.opts[q.correct]}` : '', counts: c, viewers: viewers().length, bank: bank.length, team: { ...team },
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
setInterval(sendState, 2000);

async function boot() {
  try {
    const res = await fetch('/lop-hoc-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  await loadBank();
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
  if (config.npc !== false) makeNpcs();
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
    const r = await fetch('/lop-hoc-music.json', { cache: 'no-store' });
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
    const gap = Math.max(15, Number(config.narrationSeconds) || 45) * 1000;
    setInterval(() => {
      if (performance.now() - lastAnnounce > gap && phase.name === 'ask' && phaseLeft() > 8) say(line('reminder'), 0);
    }, 3000);
  }
  startLesson();
  connectWs();
  requestAnimationFrame(frame);
}

window.__lopHoc = {
  handleEvent, skip, config: () => config,
  state: () => ({ lesson, qIndex, phase: phase.name, kind: q?.kind, correct: q?.correct, penalty: q?.penalty, bank: bank.length, players: players.size, team: { ...team } }),
  setPenalty: (k) => { lastPenalty = ''; PENALTIES.splice(0, PENALTIES.length, ...(k ? [k] : ['phan', 'sap', 'trung', 'ga', 'set', 'dienThoai', 'mu', 'bienHinh', 'khoc', 'bienHinh', 'khoc'])); },
  forceKind: (k) => { if (lessonPlan[qIndex]) lessonPlan[qIndex].kind = k; },
};
boot();
