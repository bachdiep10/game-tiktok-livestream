// Game TikTok LIVE "Gieo Quẻ – Xin Xăm": người xem bình luận xin xăm + chia sẻ live (hoặc tặng quà) để vào
// danh sách chờ 10 người, xếp theo điểm (quà, chia sẻ, tim). Tới lượt: 10 giây gõ điều muốn xin, cả phòng thả
// tim lắc ống xăm, đoán keo, gieo keo (Thánh keo mới được), Ông Từ đọc thơ và giải quẻ theo bộ Quan Âm 100 quẻ.
// Ra Hạ quẻ thì cả phòng có 15 giây tặng quà giải hạn. Chỉ mang tính giải trí.
import {
  W, H, TAU, FONT, SERIF, ONG, OXAM, BOARD, LUHUONG,
  roundRectPath as rr, loadImage, chromaKey, outlined, panel, bar,
  drawTemple, drawLantern, drawOngTu, drawOngXam, drawStick, drawKeo, drawScroll, drawLuHuong, drawBua,
} from './art.js';
import { QUE, GRADES, GRADE_ORDER, TOPICS, topicById, READ, LUCKY_COLORS, DIRECTIONS } from './que.js';
import * as sfx from './gqAudio.js';
import * as voice from '../audio.js';

const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SPEED = clamp(Number(params.get('speed')) || 1, 0.25, 8);

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'GIEO QUẺ · XIN XĂM',
  readerName: 'Ông Từ',
  subtitle: 'Bình luận "xin xăm" + chia sẻ live để vào danh sách • Tặng quà vào ngay',
  footer: 'Quẻ theo bộ Quan Âm linh xăm 100 quẻ • Chỉ mang tính giải trí',
  showRules: true,
  rulesTitle: 'LUẬT CHƠI',
  rules: [
    'Bình luận "xin xăm" + chia sẻ live = vào danh sách · Tặng quà = vào ngay',
    'Xếp hạng: 1 xu = {coinPoints} điểm · 1 chia sẻ = {sharePoints} điểm · {likesPerPoint} tim = 1 điểm',
    'Tới lượt: {wishSeconds} giây gõ điều muốn xin · Cả phòng đoán keo: thánh / âm / dương',
    'Ra Hạ quẻ: tặng quà giải hạn · {giaiHanSmall} xu lên 1 bậc · {giaiHanBig} xu lên Cát quẻ',
  ],
  imageFolder: 'assets/gieo-que',
  readerWidth: 560,
  coinPoints: 10,
  sharePoints: 5,
  likesPerPoint: 50,
  minShares: 1,
  shareCooldownMinutes: 10,
  boardSize: 10,
  bigGift: 100,
  wishSeconds: 10,
  shakeSeconds: 7,
  likeShakeBoost: 0.012,
  guessKeo: true,
  guessSeconds: 5,
  maxKeoTries: 3,
  resultMinSeconds: 16,
  giaiHan: true,
  giaiHanGrades: ['ha'],
  giaiHanSeconds: 15,
  giaiHanSmall: 10,
  giaiHanBig: 100,
  roomQueSeconds: 30,
  likesForLocTroi: 1000,
  sharesForIncense: 10,
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.35,
  voice: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-NamMinhNeural',
  voiceGapSeconds: 10,
  voiceJoin: true,
  narration: true,
  narrationSeconds: 40,
  messages: {
    welcome: ['Chào {name}, mời vào sân miếu xin quẻ đầu ngày', '{name} đến rồi, thắp nén nhang rồi xin một quẻ nhé', 'Chào {name}, muốn xin xăm thì bình luận xin xăm và chia sẻ live nha'],
    needShare: ['{name} ơi, chia sẻ live một lần là được vào danh sách xin xăm nhé', '{name} chia sẻ live giúp {reader} rồi sẽ có tên trong danh sách nha'],
    needWish: ['Cảm ơn {name} đã chia sẻ. Bình luận xin xăm và điều muốn hỏi để vào danh sách nhé'],
    joined: ['{name} đã vào danh sách xin xăm, đang xếp số {pos}', '{name} có tên rồi, số {pos}. Chia sẻ, thả tim thêm để lên sớm hơn nha'],
    gift: ['Cảm ơn {name} đã tặng {gift}. Bạn đang đứng số {pos} trong danh sách', '{name} tặng {gift}, cảm ơn nhiều. Số {pos} rồi đó, chờ {reader} một chút'],
    big: ['Ôi quý hóa quá, {name} tặng {gift}. Lượt của bạn sẽ là Đại Quẻ, ống xăm vàng'],
    call: ['Mời thí chủ {name} vào xin quẻ', 'Đến lượt {name}. Mời bạn vào trước ban thờ', 'Thí chủ {name} ơi, tới lượt bạn rồi'],
    askWish: ['{name} ơi, bình luận điều bạn muốn xin trong mười giây nhé', 'Bạn muốn hỏi chuyện gì, gõ vào bình luận trong mười giây nha'],
    noWish: ['Bạn chưa gõ lời xin nên {reader} xin cho bạn quẻ {topic} nhé'],
    pray: ['Thí chủ {name} thành tâm xin: {wish}', '{name} xin rằng: {wish}'],
    shake: ['Cả nhà thả tim giúp {name} lắc ống xăm nào', 'Thả tim thật nhiều để ống xăm lắc mạnh lên nhé'],
    stick: ['Que xăm số {n} đã ra', 'Được quẻ số {n}'],
    guess: ['Cả nhà đoán đi, Thánh keo, Âm keo hay Dương keo'],
    thanh: ['Thánh keo! Thánh đã chấp nhận quẻ này', 'Một sấp một ngửa, Thánh keo rồi'],
    am: ['Hai mặt sấp, Âm keo. Thánh chưa chấp nhận, xin lại quẻ khác', 'Âm keo rồi, mình lắc lại ống xăm nhé'],
    duong: ['Hai mặt ngửa, Dương keo. Thánh cười, mình xin lại nhé', 'Dương keo, chưa được rồi, lắc lại nào'],
    giaiHan: ['Quẻ có chút trắc trở. Ai thương {name} thì tặng quà giải hạn cho bạn ấy trong mười lăm giây nhé'],
    giaiHanOk: ['Cảm ơn {helper} đã giải hạn cho {name}. Quẻ đã chuyển thành {grade}'],
    giaiHanNone: ['Không sao đâu {name}. Làm việc thiện, nói lời hay thì hạn sẽ qua', 'Quẻ chỉ để nhắc mình cẩn thận thôi {name} ơi. Giữ lòng thiện là hóa giải được'],
    outroGood: ['Chúc mừng {name}, quẻ tốt lắm. Chúc bạn vạn sự như ý', 'Chúc {name} được như lời xin, may mắn cả năm'],
    outro: ['Chúc {name} bình an. Quẻ chỉ để tham khảo, cố gắng vẫn là ở mình', 'Cảm ơn {name}. Mời người tiếp theo nhé'],
    vipBua: ['{name} được tặng lá bùa bình an, treo trên màn hình năm phút'],
    locTroi: ['Cả phòng đã thả {likes} tim, lộc trời rơi xuống. Chúc cả nhà phát tài phát lộc'],
    incense: ['Lư hương đã đủ mười nén nhang, cảm ơn cả nhà đã chia sẻ live'],
    roomQue: ['Quẻ chung cho cả nhà lúc này: quẻ số {n}, {title}, {grade}. {y}'],
    follow: ['Cảm ơn {name} đã theo dõi, tên bạn được ghi vào sổ công đức'],
    reminder: [
      'Muốn xin xăm thì bình luận xin xăm kèm điều muốn hỏi, rồi chia sẻ live là có tên trong danh sách',
      'Tặng quà bất kỳ là được vào danh sách xin xăm ngay, không cần chia sẻ',
      'Danh sách xếp theo điểm. Chia sẻ thêm, thả tim thêm hoặc tặng quà để lên sớm hơn nhé',
      'Quẻ ở đây theo bộ Quan Âm linh xăm một trăm quẻ, chỉ để giải trí và tham khảo thôi nhé',
      'Lúc lắc ống xăm, cả nhà thả tim thật nhiều cho ống lắc nhanh hơn nha',
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
  return list[i].replace(/\{(\w+)\}/g, (_, k) => (k === 'reader' ? config.readerName : vars[k] ?? ''));
}
const sec = (k) => (Math.max(0.5, Number(config[k]) || DEFAULTS[k]) * 1000) / SPEED;

// bỏ dấu tiếng Việt để nhận lệnh dù gõ không dấu
function norm(s) {
  return ` ${String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}
function detectTopic(text) {
  const n = norm(text);
  const num = n.trim().match(/^([1-7])$/) || n.match(/ (?:chu de|so|chon) ([1-7]) /);
  if (num) return TOPICS[Number(num[1]) - 1].id;
  let best = '';
  let bestLen = 0;
  for (const t of TOPICS) {
    for (const w of t.words) {
      if (n.includes(` ${w} `) && w.length > bestLen) {
        best = t.id;
        bestLen = w.length;
      }
    }
  }
  return best;
}
const wantsXam = (text) => / (xin|xam|que|gieo|boc) /.test(norm(text)) || Boolean(detectTopic(text));
function detectGuess(text) {
  const n = norm(text);
  if (/ thanh /.test(n)) return 'thanh';
  if (/ am /.test(n)) return 'am';
  if (/ duong /.test(n)) return 'duong';
  return '';
}
// lời xin có nghĩa (không chỉ là "1", "xin xăm"...) thì mới đọc lại
function meaningfulWish(text) {
  const n = norm(text).trim();
  if (!n || /^[1-7]$/.test(n)) return '';
  const stripped = n.replace(/\b(xin|xam|que|gieo|cho|em|con|minh|toi|voi|a|nha|nhe|ong|tu|thay|1 que)\b/g, '').trim();
  if (stripped.length < 3) return '';
  return String(text).replace(/\s+/g, ' ').trim();
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
const bgCanvas = {};
for (const m of ['', 'vip', 'storm']) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  drawTemple(c.getContext('2d'), m);
  bgCanvas[m] = c;
}
const IMG = {};

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
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
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
const AV_COLORS = ['#c62828', '#ad1457', '#6a1b9a', '#283593', '#00695c', '#2e7d32', '#ef6c00', '#4e342e'];
function drawAvatar(x, y, r, user, ring = '#ffd54f', ringW = 3) {
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
    ctx.fillStyle = AV_COLORS[Math.abs([...String(user.id)].reduce((a, c) => a + c.charCodeAt(0), 0)) % AV_COLORS.length];
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
const users = new Map();
let turn = null; // lượt xin xăm hiện tại
let roomQue = null; // quẻ chung cho cả phòng khi vắng
let lastActive = 0;
let caption = null;
const toasts = [];
const particles = [];
let totalLikes = 0;
let nextLocTroi = 0;
let locTroiUntil = 0;
let incense = 0;
let incenseFullUntil = 0;
let lastVoice = 0;
let lastAnnounce = 0;
let speakUntil = 0;
let blinkUntil = 0;
let nextBlink = 2000;
let turnCount = 0;
const buaList = []; // { name, until }
const boardFlash = new Map(); // userId -> until (vừa vượt hạng)
let lastOrder = [];
let phucDuc = {};
try {
  phucDuc = JSON.parse(localStorage.getItem('gieoQuePhucDuc') || '{}') || {};
} catch {
  phucDuc = {};
}
let pdSaveAt = 0;
function addPhucDuc(user, pts) {
  if (!user || !pts) return;
  const e = phucDuc[user.id] || { name: user.name, pts: 0 };
  e.name = user.name;
  e.pts += pts;
  phucDuc[user.id] = e;
  if (now - pdSaveAt > 3000) {
    pdSaveAt = now;
    try {
      const top = Object.entries(phucDuc).sort((a, b) => b[1].pts - a[1].pts).slice(0, 200);
      phucDuc = Object.fromEntries(top);
      localStorage.setItem('gieoQuePhucDuc', JSON.stringify(phucDuc));
    } catch {
      /* bỏ qua */
    }
  }
}

function getUser(u) {
  if (!u || !u.id) return null;
  let x = users.get(u.id);
  if (!x) {
    x = { id: u.id, name: u.name || u.uniqueId || 'Bạn', avatar: u.avatar || '', shares: 0, coins: 0, likes: 0, want: false, wish: '', topic: '', qualifiedAt: 0, lastTurn: -1e12 };
    users.set(u.id, x);
  } else {
    if (u.name) x.name = u.name;
    if (u.avatar) x.avatar = u.avatar;
  }
  return x;
}
const score = (u) => u.coins * Number(config.coinPoints || 10) + u.shares * Number(config.sharePoints || 5) + Math.floor(u.likes / Math.max(1, Number(config.likesPerPoint) || 50));
function eligible(u) {
  if (turn && turn.user === u) return false;
  if (u.coins > 0) return true;
  if (!u.want || u.shares < Number(config.minShares ?? 1)) return false;
  return now - u.lastTurn >= Number(config.shareCooldownMinutes || 0) * 60000;
}
function waitingList() {
  const list = [];
  for (const u of users.values()) if (eligible(u)) list.push(u);
  list.sort((a, b) => score(b) - score(a) || a.qualifiedAt - b.qualifiedAt);
  return list;
}
function posOf(u) {
  return waitingList().indexOf(u) + 1;
}
// gọi sau mỗi thay đổi điểm: đánh dấu người mới vào / vượt hạng
function refreshBoard(user) {
  if (user && eligible(user) && !user.qualifiedAt) user.qualifiedAt = now;
  const order = waitingList().map((u) => u.id);
  if (user) {
    const before = lastOrder.indexOf(user.id);
    const after = order.indexOf(user.id);
    if (after >= 0 && (before < 0 || after < before)) boardFlash.set(user.id, now + 1800);
    if (after >= 0 && before >= 0 && after < before) toast(`${truncate(user.name, 16)} vượt lên số ${after + 1}`, '#ffd54f');
  }
  lastOrder = order;
}

function say(text, priority = 0) {
  if (!text) return;
  lastVoice = now;
  if (priority > 0) lastAnnounce = now;
  if (config.voice === false || config.sound === false) speakUntil = Math.max(speakUntil, now) + Math.min(6000, 600 + text.length * 45);
  voice.speak(text, priority);
}
function setCaption(text, ms = 6000) {
  caption = { text, until: now + ms, start: now };
}
function toast(text, color = '#ffe08a') {
  toasts.push({ text, color, until: now + 3600, start: now });
  if (toasts.length > 4) toasts.shift();
}
function burst(x, y, n = 16, colors = ['#ffe08a', '#ffb74d', '#fff3c4'], spread = 1, kind = 'spark') {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const sp = rand(0.08, 0.38) * spread;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.08, life: rand(900, 1800), age: 0, size: rand(4, 10), color: pick(colors), kind });
  }
}
function firework(x, y) {
  burst(x, y, 46, ['#ffd54f', '#ff7043', '#fff59d', '#f48fb1', '#80deea'], 1.6);
  sfx.firework();
}
function heartFloat(x, y) {
  particles.push({ x, y, vx: rand(-0.05, 0.05), vy: rand(-0.2, -0.12), life: 1500, age: 0, size: rand(14, 22), color: pick(['#ff5c8a', '#ff8fb1', '#ffd1dc']), kind: 'heart' });
}
function coinRain(n = 40) {
  for (let i = 0; i < n; i++) particles.push({ x: rand(40, W - 40), y: rand(-400, -20), vx: rand(-0.02, 0.02), vy: rand(0.25, 0.45), life: 5200, age: 0, size: rand(16, 26), color: '#ffd54f', kind: 'coin', spin: rand(0, TAU) });
}

// ------------------------------------------------------------------ sự kiện
function handleEvent(ev) {
  if (!ev || !ev.type) return;
  if (ev.type === 'reset') {
    users.clear();
    turn = null;
    roomQue = null;
    lastOrder = [];
    return;
  }
  if (ev.type === 'voiceTest') {
    say(`Xin chào cả nhà, ${config.readerName} đây. Bình luận xin xăm và chia sẻ live để vào danh sách nhé`, 2);
    return;
  }
  if (ev.type === 'nextPhase') {
    if (turn && turn.phase === 'shake') turn.shake = 1;
    else if (turn) turn.phaseEnd = now;
    else if (roomQue) roomQue.end = now;
    else lastActive = -1e9;
    return;
  }
  if (ev.type === 'giftStreak') return;
  const user = ev.user ? getUser(ev.user) : null;
  if (!user) return;
  switch (ev.type) {
    case 'join': {
      toast(`${truncate(user.name, 18)} vào sân miếu`, '#ffe0b2');
      if (config.voiceJoin && now - lastVoice > Number(config.voiceGapSeconds || 10) * 1000 && !turn) say(line('welcome', { name: user.name }), 0);
      break;
    }
    case 'chat': onChat(user, String(ev.text || '')); break;
    case 'like': {
      const n = Math.max(1, Number(ev.count) || 1);
      user.likes += n;
      totalLikes += n;
      if (turn && turn.phase === 'shake') {
        turn.shake = Math.min(1, turn.shake + n * Number(config.likeShakeBoost || 0.012));
        turn.shakeBoostUntil = now + 500;
      }
      for (let i = 0; i < Math.min(3, n); i++) heartFloat(OXAM.x + rand(-70, 70), OXAM.base - 380);
      const per = Number(config.likesForLocTroi || 1000);
      if (per > 0 && totalLikes >= nextLocTroi + per) {
        nextLocTroi = Math.floor(totalLikes / per) * per;
        locTroiUntil = now + 5000;
        coinRain(60);
        sfx.coins(16);
        setCaption(line('locTroi', { likes: nextLocTroi.toLocaleString('vi-VN') }), 5000);
        say(line('locTroi', { likes: nextLocTroi }), 1);
      }
      if (eligible(user) || user.want) refreshBoard(user);
      break;
    }
    case 'follow': {
      addPhucDuc(user, 1);
      toast(`${truncate(user.name, 16)} ghi tên vào sổ công đức`, '#c5e1a5');
      if (now - lastVoice > 5000 && !turn) say(line('follow', { name: user.name }), 0);
      break;
    }
    case 'share': {
      user.shares++;
      addPhucDuc(user, 2);
      incense++;
      if (incense >= Number(config.sharesForIncense || 10)) {
        incense = 0;
        incenseFullUntil = now + 20000;
        burst(LUHUONG.x, LUHUONG.y - 80, 40, ['#ffd54f', '#ffb74d'], 1.4);
        sfx.bigBell();
        setCaption(line('incense'), 5000);
        if (!turn || turn.phase === 'shake') say(line('incense'), 1);
      }
      const was = eligible(user);
      refreshBoard(user);
      if (!was && eligible(user)) {
        const pos = posOf(user);
        toast(`${truncate(user.name, 16)} vào danh sách, số ${pos}`, '#ffd54f');
        if (!turn || now - lastVoice > 6000) say(line('joined', { name: user.name, pos }), 1);
      } else if (!eligible(user) && !user.want && now - lastVoice > 8000 && !turn) {
        say(line('needWish', { name: user.name }), 0);
        toast(`${truncate(user.name, 16)} chia sẻ live · bình luận "xin xăm" để vào danh sách`, '#80deea');
      } else toast(`${truncate(user.name, 16)} chia sẻ live +${config.sharePoints} điểm`, '#80deea');
      break;
    }
    case 'gift': onGift(user, ev); break;
    default:
  }
}

function onChat(user, text) {
  // người đang tới lượt gõ lời xin
  if (turn && turn.user === user && turn.phase === 'wish') {
    const t = detectTopic(text);
    if (t) turn.topic = t;
    const w = meaningfulWish(text);
    if (w) turn.wish = w;
    if (w || t) {
      turn.gotWish = true;
      turn.phaseEnd = Math.min(turn.phaseEnd, now + 1500 / SPEED);
      sfx.chimes(4);
    }
    return;
  }
  // cả phòng đoán keo
  if (turn && turn.phase === 'guess') {
    const g = detectGuess(text);
    if (g && !turn.guesses.has(user.id)) {
      turn.guesses.set(user.id, { g, user });
      sfx.sparkle();
    }
    if (g) return;
  }
  if (!wantsXam(text)) return;
  const t = detectTopic(text);
  if (t) user.topic = t;
  const w = meaningfulWish(text);
  if (w) user.wish = w;
  const was = eligible(user);
  const firstWant = !user.want;
  user.want = true;
  refreshBoard(user);
  if (!was && eligible(user)) {
    const pos = posOf(user);
    toast(`${truncate(user.name, 16)} vào danh sách, số ${pos}`, '#ffd54f');
    if (!turn || now - lastVoice > 6000) say(line('joined', { name: user.name, pos }), 1);
  } else if (!eligible(user) && firstWant) {
    const cooling = user.coins <= 0 && user.shares >= Number(config.minShares ?? 1);
    toast(cooling ? `${truncate(user.name, 16)} vừa xin rồi, chờ ít phút hoặc tặng quà nhé` : `${truncate(user.name, 16)} muốn xin xăm · chia sẻ live để vào danh sách`, '#80deea');
    if (!cooling && now - lastVoice > 7000 && (!turn || turn.phase === 'shake' || turn.phase === 'result')) say(line('needShare', { name: user.name }), 0);
  }
}

function onGift(user, ev) {
  const coins = Math.max(1, Number(ev.coins) || Number(ev.diamonds) * Number(ev.repeatCount || 1) || 1);
  addPhucDuc(user, coins);
  const big = coins >= Number(config.bigGift || 100);
  sfx.chimes(big ? 12 : 6);
  // đang giải hạn: quà của bất kỳ ai đều tính
  if (turn && turn.phase === 'giaihan') {
    turn.hanCoins += coins;
    const h = turn.helpers.get(user.id) || { user, coins: 0 };
    h.coins += coins;
    turn.helpers.set(user.id, h);
    burst(W / 2, 1520, big ? 50 : 20, ['#ffd54f', '#fff59d'], big ? 2 : 1.2);
    checkGiaiHan(user);
    return;
  }
  // quà của chính người đang xin (chưa ra kết quả): nâng lên Đại Quẻ
  if (turn && turn.user === user && !turn.revealed) {
    turn.coins += coins;
    if (!turn.vip && turn.coins >= Number(config.bigGift || 100)) {
      turn.vip = true;
      sfx.bigBell(true);
      burst(OXAM.x, OXAM.base - 250, 60, ['#ffd54f', '#fff59d'], 2);
      say(line('big', { name: user.name, gift: ev.giftName || 'quà' }), 2);
    } else toast(`${truncate(user.name, 16)} tặng ${ev.giftName || 'quà'}`, '#ffd54f');
    return;
  }
  const was = eligible(user);
  user.coins += coins;
  refreshBoard(user);
  const pos = posOf(user);
  const vars = { name: user.name, gift: ev.giftName || 'quà', pos };
  const text = big ? line('big', vars) : line('gift', vars);
  setCaption(text, big ? 8000 : 6000);
  if (big || !turn || now - lastVoice > 4000) say(text, big ? 2 : 1);
  if (big) sfx.bigBell(true);
  if (!was) burst(BOARD.x + BOARD.w / 2, BOARD.y + 80, 24, ['#ffd54f', '#fff59d']);
}

// ------------------------------------------------------------------ một lượt xin xăm
function go(phase, ms) {
  turn.phase = phase;
  turn.phaseStart = now;
  turn.phaseEnd = now + ms;
}
function drawQue(exclude = []) {
  let q;
  do q = pick(QUE);
  while (exclude.includes(q.n) && exclude.length < 90);
  return q;
}
function startTurn(user) {
  turnCount++;
  turn = {
    user, wish: user.wish, topic: user.topic, gotWish: false, coins: user.coins, vip: user.coins >= Number(config.bigGift || 100),
    phase: 'call', phaseStart: now, phaseEnd: now + 3200 / SPEED, shake: 0, tries: 0, used: [], que: null, keo: null,
    guesses: new Map(), guessResult: null, revealed: false, grade: '', graded: [], hanCoins: 0, helpers: new Map(), helperTop: null,
    lucky: { n: 1 + Math.floor(Math.random() * 99), color: pick(LUCKY_COLORS), dir: pick(DIRECTIONS) }, start: now,
  };
  // dùng điểm cho lượt này: xoá để phải xin lại
  user.coins = 0;
  user.shares = 0;
  user.likes = 0;
  user.want = false;
  user.wish = '';
  user.qualifiedAt = 0;
  user.lastTurn = now;
  refreshBoard(null);
  say(line('call', { name: user.name }), 2);
  sfx.bigBell(turn.vip);
  if (turn.vip) burst(OXAM.x, OXAM.base - 250, 50, ['#ffd54f', '#fff59d'], 2);
}
const topicName = (id) => topicById(id)?.name || 'Tài lộc';

function nextPhase() {
  const t = turn;
  switch (t.phase) {
    case 'call':
      go('wish', sec('wishSeconds'));
      t.lastTick = 0;
      say(line('askWish', { name: t.user.name }), 2);
      break;
    case 'wish': {
      if (!topicById(t.topic)) t.topic = 'tl';
      let text;
      if (t.wish) text = line('pray', { name: t.user.name, wish: t.wish });
      else text = line('noWish', { topic: topicName(t.topic) });
      text += `. Chủ đề ${topicName(t.topic)}`;
      say(text, 2);
      go('pray', Math.max(3500, Math.min(7000, 1500 + text.length * 55)) / SPEED);
      sfx.mo(3);
      break;
    }
    case 'pray':
      startShake(sec('shakeSeconds'));
      say(line('shake', { name: t.user.name }), 1);
      break;
    case 'shake':
      break; // kết thúc khi thanh lắc đầy (update)
    case 'stick':
      if (config.guessKeo !== false) {
        go('guess', sec('guessSeconds'));
        t.guesses.clear();
        say(line('guess'), 1);
      } else startToss();
      break;
    case 'guess':
      startToss();
      break;
    case 'toss': {
      const k = t.keo;
      if (k.result === 'thanh') {
        reveal();
      } else {
        startShake(sec('shakeSeconds') * 0.6);
      }
      break;
    }
    case 'result':
      if (config.giaiHan !== false && (config.giaiHanGrades || ['ha']).includes(t.grade)) {
        go('giaihan', sec('giaiHanSeconds'));
        t.hanStart = now;
        sfx.thunder();
        sfx.wind(4);
        say(line('giaiHan', { name: t.user.name }), 2);
      } else outro();
      break;
    case 'giaihan':
      if (GRADE_ORDER.indexOf(t.grade) <= GRADE_ORDER.indexOf(t.baseGrade)) say(line('giaiHanNone', { name: t.user.name }), 1);
      outro();
      break;
    case 'outro':
      turn = null;
      lastActive = now;
      break;
    default:
  }
}
function startShake(ms) {
  turn.shake = 0;
  turn.shakeMs = ms;
  go('shake', ms + 60000);
}
function stickOut() {
  const t = turn;
  t.que = drawQue(t.used);
  t.used.push(t.que.n);
  go('stick', 3000 / SPEED);
  sfx.stickOut();
  burst(OXAM.x, OXAM.base - 330, 24, ['#ffe08a', '#fff']);
  say(line('stick', { n: t.que.n }), 2);
}
function startToss() {
  const t = turn;
  t.tries++;
  const last = t.tries >= Number(config.maxKeoTries || 3);
  let result = 'thanh';
  if (!last) {
    const r = Math.random();
    result = r < 0.5 ? 'thanh' : r < 0.75 ? 'am' : 'duong';
  }
  const faces = result === 'thanh' ? (Math.random() < 0.5 ? ['sap', 'ngua'] : ['ngua', 'sap']) : result === 'am' ? ['sap', 'sap'] : ['ngua', 'ngua'];
  t.keo = { result, faces, start: now, landed: false, rot: [rand(-0.4, 0.4), rand(-0.4, 0.4)] };
  go('toss', 4200 / SPEED);
  sfx.toss();
}
function keoLanded() {
  const t = turn;
  const k = t.keo;
  k.landed = true;
  sfx.keoLand();
  // chấm đoán keo
  const right = [];
  for (const { g, user } of t.guesses.values()) {
    if (g === k.result) {
      right.push(user);
      addPhucDuc(user, 1);
    }
  }
  t.guessResult = { right, total: t.guesses.size };
  if (k.result === 'thanh') {
    setTimeout(() => sfx.bigBell(), 250);
    burst(W / 2, 1300, 40, ['#ffd54f', '#fff59d', '#ffffff'], 1.6);
  } else sfx.sad();
  say(line(k.result), 2);
}
function readingText(t) {
  const q = t.que;
  const g = GRADES[t.grade];
  const topicRead = pick(READ[t.topic]?.[t.grade] || READ.tl[t.grade]);
  t.topicRead = topicRead;
  return `Quẻ số ${q.n}, ${q.t}. ${g.name}. ${q.y} Về ${topicName(t.topic).toLowerCase()}: ${topicRead} Lời khuyên: ${q.k}`;
}
function reveal() {
  const t = turn;
  t.revealed = true;
  t.grade = t.que.g;
  t.baseGrade = t.grade;
  const text = readingText(t);
  t.revealAt = now;
  const ms = Math.max(sec('resultMinSeconds'), (2500 + text.length * 62) / SPEED);
  go('result', ms);
  sfx.chimes(8);
  sfx.mo(1);
  say(text, 2);
  if (t.grade === 'thuong' || t.grade === 'tot') setTimeout(() => turn && firework(rand(250, 830), rand(350, 700)), 1200 / SPEED);
}
function checkGiaiHan(helper) {
  const t = turn;
  const small = Number(config.giaiHanSmall || 10);
  const bigC = Number(config.giaiHanBig || 100);
  let target = t.baseGrade;
  const base = GRADE_ORDER.indexOf(t.baseGrade);
  if (t.hanCoins >= bigC) target = GRADE_ORDER[Math.max(base, GRADE_ORDER.indexOf('tot'))];
  else if (t.hanCoins >= small) target = GRADE_ORDER[Math.min(GRADE_ORDER.length - 1, base + 1)];
  if (GRADE_ORDER.indexOf(target) > GRADE_ORDER.indexOf(t.grade)) {
    t.grade = target;
    t.upgradedAt = now;
    t.helperTop = [...t.helpers.values()].sort((a, b) => b.coins - a.coins)[0]?.user || helper;
    t.topicRead = pick(READ[t.topic]?.[t.grade] || READ.tl[t.grade]);
    sfx.bigBell(true);
    firework(W / 2, 700);
    setTimeout(() => turn && firework(rand(250, 830), rand(350, 700)), 600);
    const g = GRADES[t.grade];
    say(`${line('giaiHanOk', { helper: t.helperTop.name, name: t.user.name, grade: g.name })}. ${t.topicRead}`, 2);
    if (t.grade === 'tot' || t.grade === 'thuong') t.phaseEnd = Math.min(t.phaseEnd, now + 7000 / SPEED);
  }
}
function outro() {
  const t = turn;
  const good = t.grade === 'thuong' || t.grade === 'tot';
  go('outro', 5000 / SPEED);
  let text = line(good ? 'outroGood' : 'outro', { name: t.user.name });
  if (t.vip) {
    buaList.push({ name: t.user.name, until: now + 5 * 60000 });
    if (buaList.length > 3) buaList.shift();
    text += `. ${line('vipBua', { name: t.user.name })}`;
  }
  say(text, 1);
  if (good) {
    firework(300, 600);
    setTimeout(() => turn && firework(780, 520), 500);
  }
}

function startRoomQue() {
  const q = drawQue();
  roomQue = { q, start: now, out: now + 2600 / SPEED, end: now + 16000 / SPEED, said: false };
}

// ------------------------------------------------------------------ cập nhật
function update(dt) {
  if (turn) {
    const t = turn;
    if (t.phase === 'shake') {
      t.shake = Math.min(1, t.shake + dt / t.shakeMs);
      sfx.rattle(now < (t.shakeBoostUntil || 0) ? 1 : 0.5);
      if (t.shake >= 1) stickOut();
    } else if (t.phase === 'wish') {
      const left = Math.ceil((t.phaseEnd - now) / 1000 * SPEED);
      if (left !== t.lastTick && left <= 10 && left > 0) {
        t.lastTick = left;
        sfx.tick(left <= 3);
      }
    } else if (t.phase === 'toss' && !t.keo.landed && now - t.keo.start > 1600 / SPEED) keoLanded();
    if (now >= t.phaseEnd) nextPhase();
  } else if (roomQue) {
    if (!roomQue.said && now >= roomQue.out) {
      roomQue.said = true;
      sfx.stickOut();
      const q = roomQue.q;
      say(line('roomQue', { n: q.n, title: q.t, grade: GRADES[q.g].name, y: q.y }), 1);
    }
    if (now >= roomQue.end) {
      roomQue = null;
      lastActive = now;
    }
  } else {
    const list = waitingList();
    if (list.length) startTurn(list[0]);
    else if (now - lastActive > sec('roomQueSeconds')) startRoomQue();
  }
  for (const p of particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'spark') p.vy += 0.00025 * dt;
  }
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].age > particles[i].life || particles[i].y > H + 60) particles.splice(i, 1);
  for (let i = buaList.length - 1; i >= 0; i--) if (now > buaList[i].until) buaList.splice(i, 1);
  if (now > nextBlink) {
    blinkUntil = now + 140;
    nextBlink = now + rand(2500, 5000);
  }
}

// ------------------------------------------------------------------ vẽ
function bgMode() {
  if (turn && turn.phase === 'giaihan' && GRADE_ORDER.indexOf(turn.grade) <= GRADE_ORDER.indexOf(turn.baseGrade)) return 'storm';
  if (turn && turn.vip) return 'vip';
  return '';
}
function drawBackground() {
  const m = bgMode();
  const img = m === 'vip' ? IMG.nenVip || IMG.nen : m === 'storm' ? IMG.nenHan || IMG.nen : IMG.nen;
  if (img) {
    ctx.drawImage(img, 0, 0, W, H);
    if (m === 'storm' && !IMG.nenHan) {
      ctx.fillStyle = 'rgba(20,10,60,0.55)';
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.drawImage(bgCanvas[m], 0, 0);
    drawLantern(ctx, 140, 120, 0.9, now, 1);
    drawLantern(ctx, 420, 90, 0.7, now, 2);
    drawLantern(ctx, 980, 330, 0.8, now, 3);
  }
  if (m === 'storm') {
    // chớp
    const f = Math.sin(now * 0.0021) > 0.985 ? 0.35 : 0;
    if (f) {
      ctx.fillStyle = `rgba(220,220,255,${f})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
  // tối dần phía dưới cho dễ đọc chữ
  const g = ctx.createLinearGradient(0, 1380, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 1380, W, H - 1380);
  const g2 = ctx.createLinearGradient(0, 0, 0, 300);
  g2.addColorStop(0, 'rgba(0,0,0,0.6)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, 300);
}

function drawHeader() {
  outlined(ctx, config.title, W / 2, 190, { size: 66, color: '#ffe08a', stroke: '#3a0a04', lw: 12, weight: 900, font: SERIF });
  if (!turn) outlined(ctx, config.subtitle, W / 2, 248, { size: 24, color: '#fff3d6', stroke: 'rgba(0,0,0,0.85)', lw: 6, weight: 700, maxW: W - 60 });
}

function speaking() {
  return now < speakUntil;
}
function drawOng() {
  const iw = Number(config.readerWidth) || ONG.w;
  if (IMG.ong) {
    const img = speaking() && IMG.ongNoi && Math.sin(now * 0.022) > -0.2 ? IMG.ongNoi : IMG.ong;
    const ih = (img.height / img.width) * iw;
    ctx.drawImage(img, ONG.x - iw / 2, ONG.bottom - ih + Math.sin(now * 0.002) * 3, iw, ih);
  } else drawOngTu(ctx, { x: ONG.x, bottom: ONG.bottom + 40, t: now, speaking: speaking(), blink: now < blinkUntil });
}

function shakeLevel() {
  if (turn && turn.phase === 'shake') return 0.55 + 0.45 * (now < (turn.shakeBoostUntil || 0) ? 1 : 0) + turn.shake * 0.3;
  if (roomQue && now < roomQue.out) return 0.6;
  return 0;
}
function drawOngXamArea() {
  const gold = Boolean(turn && turn.vip);
  const img = gold ? IMG.oxamVang || IMG.oxam : IMG.oxam;
  const sh = shakeLevel();
  if (img) {
    const w = 190;
    const h = (img.height / img.width) * w;
    const rot = sh ? Math.sin(now * 0.045) * 0.15 * sh : 0;
    const jx = sh ? Math.sin(now * 0.09) * 7 * sh : 0;
    ctx.save();
    ctx.translate(OXAM.x + jx, OXAM.base);
    ctx.rotate(rot);
    if (gold) {
      const gl = ctx.createRadialGradient(0, -h / 2, 10, 0, -h / 2, h * 0.8);
      gl.addColorStop(0, `rgba(255,225,120,${0.45 + 0.15 * Math.sin(now * 0.005)})`);
      gl.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(0, -h / 2, h * 0.8, 0, TAU);
      ctx.fill();
    }
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
  } else drawOngXam(ctx, OXAM.x, OXAM.base, { shake: sh, t: now, gold });
}

// thẻ tên người đang xin + lời xin
function drawPlayerCard() {
  const t = turn;
  if (!t || t.phase === 'result' || t.phase === 'giaihan' || t.phase === 'outro') return;
  const x = 24;
  const y = 278;
  const w = 670;
  const h = 150;
  if (IMG.theTen) ctx.drawImage(IMG.theTen, x, y, w, h);
  else panel(ctx, x, y, w, h, 18, 'rgba(90,40,16,0.92)');
  drawAvatar(x + 92, y + h / 2, 46, t.user, t.vip ? '#ffd54f' : '#fff3c4', 4);
  outlined(ctx, truncate(t.user.name, 16), x + 160, y + 58, { size: 40, color: '#fff3c4', stroke: '#3a1a08', lw: 7, weight: 900, align: 'left', maxW: w - 190 });
  const label = `${t.vip ? 'ĐẠI QUẺ · ' : ''}${topicById(t.topic) ? `Xin ${topicName(t.topic)}` : 'Đang xin xăm'}`;
  outlined(ctx, label, x + 160, y + 104, { size: 28, color: t.vip ? '#ffd54f' : '#ffe0b2', stroke: '#3a1a08', lw: 6, weight: 800, align: 'left' });
  // bong bóng lời xin
  if (t.wish && t.phase !== 'call') {
    const text = `“${truncate(t.wish, 70)}”`;
    const lines = wrap(text, 600, `italic 600 30px ${FONT}`).slice(0, 2);
    const bh = 30 + lines.length * 40;
    ctx.save();
    ctx.fillStyle = 'rgba(255,248,230,0.95)';
    rr(ctx, x + 10, y + h + 14, w - 20, bh, 20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 70, y + h + 16);
    ctx.lineTo(x + 92, y + h - 4);
    ctx.lineTo(x + 112, y + h + 16);
    ctx.fill();
    ctx.fillStyle = '#5a1a08';
    ctx.font = `italic 600 30px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, x + 36, y + h + 14 + 34 + i * 40));
    ctx.restore();
  }
}

// danh sách chờ (top 10) hoặc bảng phúc đức khi chưa ai chờ
function drawBoard() {
  const list = waitingList();
  const n = Number(config.boardSize || 10);
  const { x, y, w, rowH } = BOARD;
  if (turn && (turn.phase === 'result' || turn.phase === 'giaihan')) return;
  if (!list.length) return drawPhucDuc();
  const rows = list.slice(0, n);
  const h = 70 + rows.length * rowH + (list.length > n ? 34 : 10);
  panel(ctx, x, y, w, h, 20, 'rgba(50,10,6,0.82)');
  outlined(ctx, 'DANH SÁCH XIN XĂM', x + w / 2, y + 36, { size: 26, color: '#ffd54f', stroke: '#2a0804', lw: 5, weight: 900 });
  rows.forEach((u, i) => {
    const ry = y + 66 + i * rowH;
    const flash = (boardFlash.get(u.id) || 0) > now;
    if (flash) {
      ctx.fillStyle = `rgba(255,213,79,${0.25 + 0.2 * Math.sin(now * 0.02)})`;
      rr(ctx, x + 8, ry, w - 16, rowH - 4, 10);
      ctx.fill();
    }
    outlined(ctx, String(i + 1), x + 26, ry + rowH / 2, { size: 24, color: i < 3 ? '#ffd54f' : '#fff', stroke: '#2a0804', lw: 5, weight: 900 });
    drawAvatar(x + 66, ry + rowH / 2 - 2, 19, u, u.coins > 0 ? '#ffd54f' : '#fff3c4', 2);
    outlined(ctx, truncate(u.name, 11), x + 94, ry + rowH / 2 - 2, { size: 22, color: '#fff8e1', stroke: '#2a0804', lw: 4, weight: 700, align: 'left', maxW: 120 });
    const tag = u.coins > 0 ? `🎁${u.coins}` : `📣${u.shares}`;
    outlined(ctx, `${tag} · ${score(u)} điểm`, x + w - 14, ry + rowH / 2 - 2, { size: 18, color: u.coins > 0 ? '#ffd54f' : '#b2ebf2', stroke: '#2a0804', lw: 4, weight: 800, align: 'right' });
  });
  if (list.length > n) outlined(ctx, `+${list.length - n} người đang chờ`, x + w / 2, y + h - 22, { size: 19, color: '#ffe0b2', stroke: '#2a0804', lw: 4, weight: 700 });
}
function drawPhucDuc() {
  const top = Object.values(phucDuc).sort((a, b) => b.pts - a.pts).slice(0, 5);
  const { x, y, w } = BOARD;
  const h = 70 + Math.max(1, top.length) * 44 + 92;
  panel(ctx, x, y, w, h, 20, 'rgba(50,10,6,0.78)');
  outlined(ctx, 'BẢNG PHÚC ĐỨC', x + w / 2, y + 36, { size: 26, color: '#ffd54f', stroke: '#2a0804', lw: 5, weight: 900 });
  if (!top.length) outlined(ctx, 'Chưa có ai', x + w / 2, y + 92, { size: 22, color: '#ffe0b2', stroke: '#2a0804', lw: 4, weight: 700 });
  top.forEach((e, i) => {
    const ry = y + 92 + i * 44;
    outlined(ctx, `${['🥇', '🥈', '🥉', '4', '5'][i]} ${truncate(e.name, 12)}`, x + 20, ry, { size: 22, color: '#fff8e1', stroke: '#2a0804', lw: 4, weight: 700, align: 'left' });
    outlined(ctx, String(e.pts), x + w - 18, ry, { size: 22, color: '#ffd54f', stroke: '#2a0804', lw: 4, weight: 800, align: 'right' });
  });
  const hy = y + h - 74;
  ctx.font = `600 18px ${FONT}`;
  ctx.fillStyle = '#ffe0b2';
  ctx.textAlign = 'center';
  ctx.fillText('Danh sách chờ đang trống', x + w / 2, hy + 6);
  ctx.fillText('Bình luận "xin xăm" + chia sẻ live', x + w / 2, hy + 32);
  ctx.fillText('hoặc tặng quà để xin ngay', x + w / 2, hy + 56);
}

// khung dưới: hướng dẫn từng bước
function drawStagePanel() {
  const t = turn;
  const x = 40;
  const y = 1462;
  const w = W - 80;
  if (t && (t.phase === 'result' || t.phase === 'outro')) return;
  if (t && t.phase === 'giaihan') return drawGiaiHan();
  if (!t) {
    if (roomQue) return;
    panel(ctx, x, y, w, 196, 24, 'rgba(50,10,6,0.8)');
    outlined(ctx, 'CÁCH XIN XĂM', W / 2, y + 38, { size: 30, color: '#ffd54f', stroke: '#2a0804', lw: 6, weight: 900 });
    const steps = ['① Bình luận "xin xăm" + điều muốn hỏi', '② Chia sẻ live (hoặc tặng quà) để có tên', '③ Chia sẻ, thả tim, tặng quà thêm để lên hạng'];
    steps.forEach((s, i) => outlined(ctx, s, x + 40, y + 88 + i * 40, { size: 27, color: '#fff8e1', stroke: '#2a0804', lw: 5, weight: 700, align: 'left', maxW: w - 80 }));
    return;
  }
  panel(ctx, x, y, w, 170, 24, 'rgba(50,10,6,0.82)');
  if (t.phase === 'call' || t.phase === 'pray') {
    outlined(ctx, t.phase === 'call' ? `Mời ${truncate(t.user.name, 18)} vào xin quẻ` : 'Thành tâm khấn nguyện...', W / 2, y + 62, { size: 38, color: '#ffe08a', stroke: '#2a0804', lw: 7, weight: 900, maxW: w - 40 });
    outlined(ctx, `Chủ đề: ${topicName(t.topic)}`, W / 2, y + 118, { size: 28, color: '#fff8e1', stroke: '#2a0804', lw: 5, weight: 700 });
  } else if (t.phase === 'wish') {
    const left = Math.max(0, Math.ceil((t.phaseEnd - now) / 1000 * SPEED));
    outlined(ctx, t.gotWish ? 'Đã nhận lời xin!' : `${truncate(t.user.name, 14)} ơi, gõ điều muốn xin`, x + 30, y + 56, { size: 34, color: '#ffe08a', stroke: '#2a0804', lw: 7, weight: 900, align: 'left', maxW: w - 200 });
    outlined(ctx, 'Ví dụ: "xin cho con thi đỗ", "năm nay có lấy chồng không"', x + 30, y + 112, { size: 24, color: '#fff8e1', stroke: '#2a0804', lw: 5, weight: 600, align: 'left', maxW: w - 200 });
    // vòng đếm ngược
    const cx = x + w - 80;
    const cy = y + 85;
    const frac = clamp((t.phaseEnd - now) / (t.phaseEnd - t.phaseStart), 0, 1);
    ctx.save();
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = left <= 3 ? '#ef5350' : '#ffd54f';
    ctx.beginPath();
    ctx.arc(cx, cy, 56, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
    ctx.stroke();
    ctx.restore();
    outlined(ctx, String(left), cx, cy + 2, { size: 56, color: '#fff', stroke: '#2a0804', lw: 7, weight: 900 });
  } else if (t.phase === 'shake') {
    outlined(ctx, t.tries ? `Lắc lại ống xăm (lần ${t.tries + 1})` : 'THẢ TIM ĐỂ LẮC ỐNG XĂM!', W / 2, y + 50, { size: 36, color: '#ffe08a', stroke: '#2a0804', lw: 7, weight: 900 });
    bar(ctx, x + 40, y + 88, w - 80, 46, t.shake, '#ff7043', '#ffd54f');
    outlined(ctx, `${Math.round(t.shake * 100)}%`, W / 2, y + 111, { size: 26, color: '#fff', stroke: '#2a0804', lw: 5, weight: 900 });
  } else if (t.phase === 'stick') {
    outlined(ctx, `Quẻ số ${t.que.n} đã ra!`, W / 2, y + 62, { size: 44, color: '#ffe08a', stroke: '#2a0804', lw: 8, weight: 900 });
    outlined(ctx, 'Gieo keo xin Thánh chấp nhận', W / 2, y + 120, { size: 28, color: '#fff8e1', stroke: '#2a0804', lw: 5, weight: 700 });
  } else if (t.phase === 'guess' || t.phase === 'toss') drawGuessPanel(x, y, w);
}
const KEO_NAME = { thanh: 'THÁNH', am: 'ÂM', duong: 'DƯƠNG' };
function drawGuessPanel(x, y, w) {
  const t = turn;
  const counts = { thanh: 0, am: 0, duong: 0 };
  for (const { g } of t.guesses.values()) counts[g]++;
  const guessing = t.phase === 'guess';
  const title = guessing ? `ĐOÁN KEO! Bình luận: thánh · âm · dương (${Math.max(0, Math.ceil((t.phaseEnd - now) / 1000 * SPEED))})` : t.keo.landed ? `${KEO_NAME[t.keo.result]} KEO${t.keo.result === 'thanh' ? ' ✓' : ` · lần ${t.tries}/${config.maxKeoTries}`}` : 'Đang gieo keo...';
  outlined(ctx, title, W / 2, y + 40, { size: guessing ? 28 : 38, color: t.keo?.landed ? (t.keo.result === 'thanh' ? '#a5d6a7' : '#ef9a9a') : '#ffe08a', stroke: '#2a0804', lw: 6, weight: 900, maxW: w - 30 });
  const opts = [['thanh', 'Thánh keo', '1 sấp 1 ngửa'], ['am', 'Âm keo', '2 sấp'], ['duong', 'Dương keo', '2 ngửa']];
  opts.forEach(([id, name, sub], i) => {
    const bx = x + 24 + i * ((w - 48) / 3);
    const bw = (w - 48) / 3 - 16;
    const win = t.keo?.landed && t.keo.result === id;
    ctx.fillStyle = win ? 'rgba(129,199,132,0.45)' : 'rgba(0,0,0,0.35)';
    rr(ctx, bx, y + 70, bw, 84, 14);
    ctx.fill();
    if (win) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#a5d6a7';
      ctx.stroke();
    }
    outlined(ctx, name, bx + bw / 2, y + 98, { size: 26, color: '#fff8e1', stroke: '#2a0804', lw: 5, weight: 800 });
    outlined(ctx, `${sub} · ${counts[id]} người`, bx + bw / 2, y + 134, { size: 18, color: '#ffe0b2', stroke: '#2a0804', lw: 4, weight: 600 });
  });
  if (t.keo?.landed && t.guessResult && t.guessResult.total) {
    const r = t.guessResult.right;
    const s = r.length ? `${r.length} người đoán đúng +1 phúc đức: ${r.slice(0, 3).map((u) => truncate(u.name, 10)).join(', ')}${r.length > 3 ? '...' : ''}` : 'Không ai đoán đúng!';
    outlined(ctx, s, W / 2, y + 196, { size: 22, color: '#fff59d', stroke: '#2a0804', lw: 5, weight: 700, maxW: w });
  }
}

// que xăm bay ra
function drawStickFly() {
  const t = turn;
  if (!t || !t.que || !['stick', 'guess', 'toss'].includes(t.phase)) return;
  let p;
  let len;
  let x;
  let y;
  let rot;
  if (t.phase === 'stick') {
    p = easeOut(clamp((now - t.phaseStart) / (900 / SPEED), 0, 1));
    x = lerp(OXAM.x, W / 2, p);
    y = lerp(OXAM.base - 380, 860, p) - Math.sin(p * Math.PI) * 120;
    rot = lerp(0.3, 0, p) + (1 - p) * Math.sin(now * 0.03) * 0.3;
    len = lerp(240, 560, p);
  } else {
    // thu nhỏ sang bên trái ống xăm khi gieo keo
    p = ease(clamp((now - t.phaseStart) / (600 / SPEED), 0, 1));
    const fromStick = t.phase === 'guess' || (t.phase === 'toss' && t.tries === 1 && config.guessKeo === false);
    x = fromStick ? lerp(W / 2, 960, p) : 960;
    y = fromStick ? lerp(860, 1060, p) : 1060;
    len = fromStick ? lerp(560, 340, p) : 340;
    rot = 0;
  }
  if (IMG.que) drawStick(ctx, x, y, rot, t.que.n, { len, glow: 1, img: IMG.que });
  else drawStick(ctx, x, y, rot, t.que.n, { len, glow: 1, gold: t.vip });
  // số quẻ to
  outlined(ctx, `QUẺ SỐ ${t.que.n}`, x, y - len / 2 - 40, { size: Math.round(len * 0.1), color: '#ffe08a', stroke: '#3a0a04', lw: 8, weight: 900, font: SERIF });
  // nhãn số trên que (ảnh que có ô trống)
  if (IMG.que) outlined(ctx, String(t.que.n), x, y - len * 0.32, { size: Math.round(len * 0.07), color: '#5a0c06', stroke: '#f0d49a', lw: 4, weight: 900, font: SERIF });
}
function drawKeoToss() {
  const t = turn;
  if (!t || t.phase !== 'toss' || !t.keo) return;
  const k = t.keo;
  const el = (now - k.start) * SPEED;
  const flyP = clamp(el / 1600, 0, 1);
  [380, 700].forEach((tx, i) => {
    const sx = 540 + (i ? 40 : -40);
    const x = lerp(sx, tx, flyP);
    const y = lerp(1300, 1330, flyP) - Math.sin(flyP * Math.PI) * 520;
    const spin = k.landed ? 1 : Math.cos(el * 0.02 + i);
    const face = k.landed ? k.faces[i] : spin > 0 ? 'ngua' : 'sap';
    const rot = k.landed ? k.rot[i] : el * 0.004 * (i ? -1 : 1);
    if (IMG.keo) {
      const s = 1.15;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(1, Math.max(0.08, Math.abs(spin)) * (face === 'sap' ? -1 : 1));
      const iw = IMG.keo.width * 0.42 * s;
      const ih = IMG.keo.height * 0.42 * s;
      if (face === 'sap') ctx.filter = 'brightness(1.25) saturate(1.2)';
      ctx.drawImage(IMG.keo, -iw / 2, -ih / 2, iw, ih);
      ctx.filter = 'none';
      ctx.restore();
    } else drawKeo(ctx, x, y, 90, rot, face, spin);
    if (k.landed) outlined(ctx, face === 'sap' ? 'SẤP' : 'NGỬA', tx, 1405, { size: 28, color: '#fff8e1', stroke: '#2a0804', lw: 6, weight: 900 });
  });
  if (k.landed) {
    const p = easeOut(clamp((now - k.start - 1600 / SPEED) / 400, 0, 1));
    outlined(ctx, `${KEO_NAME[k.result]} KEO`, W / 2, 1180, { size: 60 + 30 * p, color: k.result === 'thanh' ? '#a5d6a7' : '#ef9a9a', stroke: '#1a0402', lw: 12, weight: 900, font: SERIF });
  }
}

// tờ quẻ
const SCROLL = { x: 110, y: 262, w: 860, h: 1191 };
function drawResult() {
  const t = turn;
  if (!t || !t.revealed || !['result', 'giaihan', 'outro'].includes(t.phase)) return;
  const open = easeOut(clamp((now - t.revealAt) / (900 / SPEED), 0, 1));
  const { x, y, w, h } = SCROLL;
  if (IMG.toQue) {
    const hh = h * Math.max(0.08, open);
    ctx.drawImage(IMG.toQue, x, y + (h - hh) / 2, w, hh);
  } else drawScroll(ctx, x, y, w, h, open);
  if (open < 0.95) return;
  const q = t.que;
  const g = GRADES[t.grade];
  const ix = x + 150;
  const iw = w - 300;
  let cy = y + 150;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  outlined(ctx, `Quẻ của ${truncate(t.user.name, 18)}${t.vip ? ' · ĐẠI QUẺ' : ''}`, W / 2, cy, { size: 26, color: '#ffe0b2', stroke: '#4a0804', lw: 5, weight: 700 });
  cy += 52;
  outlined(ctx, `QUẺ SỐ ${q.n}`, W / 2, cy, { size: 56, color: '#ffe08a', stroke: '#4a0804', lw: 9, weight: 900, font: SERIF });
  cy += 54;
  outlined(ctx, q.t, W / 2, cy, { size: 34, color: '#fff3d6', stroke: '#4a0804', lw: 6, weight: 800, font: SERIF, maxW: iw });
  cy += 56;
  // nhãn mức quẻ
  const up = t.upgradedAt && now - t.upgradedAt < 2500 ? 1 + 0.15 * Math.sin((now - t.upgradedAt) * 0.02) : 1;
  ctx.font = `900 ${Math.round(32 * up)}px ${FONT}`;
  const lw = ctx.measureText(g.label).width + 60;
  ctx.fillStyle = g.color;
  rr(ctx, W / 2 - lw / 2, cy - 26, lw, 52, 26);
  ctx.fill();
  ctx.fillStyle = '#2a0804';
  ctx.fillText(g.label, W / 2, cy + 1);
  cy += 52;
  outlined(ctx, g.sub + (t.grade !== t.baseGrade ? ' · đã giải hạn' : ''), W / 2, cy, { size: 22, color: g.glow, stroke: '#4a0804', lw: 4, weight: 700 });
  cy += 44;
  // thơ
  ctx.font = `italic 28px ${SERIF}`;
  ctx.fillStyle = '#ffe9b0';
  for (const l of q.p) {
    ctx.fillText(l, W / 2, cy, iw);
    cy += 38;
  }
  cy += 12;
  ctx.strokeStyle = 'rgba(232,190,90,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ix + 60, cy);
  ctx.lineTo(ix + iw - 60, cy);
  ctx.stroke();
  cy += 30;
  ctx.textAlign = 'left';
  const para = (label, text, color) => {
    const font = `600 24px ${FONT}`;
    const lines = wrap(`${label} ${text}`, iw, font);
    lines.forEach((l, i) => {
      ctx.font = font;
      if (i === 0) {
        ctx.fillStyle = color;
        ctx.font = `800 24px ${FONT}`;
        ctx.fillText(label, ix, cy);
        const lw2 = ctx.measureText(`${label} `).width;
        ctx.font = font;
        ctx.fillStyle = '#fff8e1';
        ctx.fillText(l.slice(label.length + 1), ix + lw2, cy);
      } else {
        ctx.fillStyle = '#fff8e1';
        ctx.fillText(l, ix, cy);
      }
      cy += 32;
    });
    cy += 8;
  };
  para('Ý quẻ:', q.y, '#ffd54f');
  para(`${topicName(t.topic)}:`, t.topicRead || '', topicById(t.topic)?.color || '#ffd54f');
  para('Lời khuyên:', q.k, '#a5d6a7');
  ctx.textAlign = 'center';
  ctx.font = `700 23px ${FONT}`;
  ctx.fillStyle = '#ffe0b2';
  ctx.fillText(`Số may mắn ${t.lucky.n} · Màu ${t.lucky.color} · Hướng ${t.lucky.dir}`, W / 2, Math.min(cy + 6, y + h - 110), iw);
  ctx.restore();
}

function drawGiaiHan() {
  const t = turn;
  const x = 40;
  const y = 1462;
  const w = W - 80;
  const done = GRADE_ORDER.indexOf(t.grade) > GRADE_ORDER.indexOf(t.baseGrade);
  panel(ctx, x, y, w, 236, 24, done ? 'rgba(30,60,20,0.88)' : 'rgba(30,10,60,0.88)', done ? '#a5d6a7' : '#b39ddb');
  const left = Math.max(0, Math.ceil((t.phaseEnd - now) / 1000 * SPEED));
  if (done) {
    outlined(ctx, `ĐÃ GIẢI HẠN · ${GRADES[t.grade].label}`, W / 2, y + 50, { size: 38, color: '#c8f7c5', stroke: '#0a2a04', lw: 7, weight: 900 });
    outlined(ctx, `Quý nhân của ${truncate(t.user.name, 12)}: ${truncate(t.helperTop?.name || '', 14)}`, W / 2, y + 104, { size: 30, color: '#ffd54f', stroke: '#0a2a04', lw: 6, weight: 800, maxW: w - 40 });
  } else {
    outlined(ctx, `GIẢI HẠN CHO ${truncate(t.user.name, 12).toUpperCase()}! (${left}s)`, W / 2, y + 50, { size: 36, color: '#e1bee7', stroke: '#1a0430', lw: 7, weight: 900, maxW: w - 30 });
    outlined(ctx, `Ai cũng tặng được · ${config.giaiHanSmall} xu lên 1 bậc · ${config.giaiHanBig} xu lên Cát quẻ`, W / 2, y + 100, { size: 24, color: '#fff8e1', stroke: '#1a0430', lw: 5, weight: 700, maxW: w - 30 });
  }
  const goal = Number(config.giaiHanBig || 100);
  bar(ctx, x + 40, y + 140, w - 80, 44, Math.min(1, t.hanCoins / goal), done ? '#66bb6a' : '#9575cd', '#ffd54f');
  outlined(ctx, `${t.hanCoins} / ${goal} xu`, W / 2, y + 162, { size: 24, color: '#fff', stroke: '#1a0430', lw: 5, weight: 900 });
  // vạch mốc 10 xu
  const mx = x + 40 + (w - 80) * Math.min(1, Number(config.giaiHanSmall || 10) / goal);
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(mx - 2, y + 134, 4, 56);
  const helpers = [...t.helpers.values()].sort((a, b) => b.coins - a.coins).slice(0, 3);
  if (helpers.length) outlined(ctx, `Giải hạn: ${helpers.map((h) => `${truncate(h.user.name, 10)} ${h.coins}`).join(' · ')}`, W / 2, y + 212, { size: 21, color: '#ffe0b2', stroke: '#1a0430', lw: 4, weight: 700, maxW: w - 30 });
}

function drawRoomQue() {
  if (!roomQue) return;
  const q = roomQue.q;
  const p = easeOut(clamp((now - roomQue.out) / 700, 0, 1));
  if (now < roomQue.out) {
    outlined(ctx, 'Gieo quẻ chung cho cả nhà...', W / 2, 1530, { size: 36, color: '#ffe08a', stroke: '#2a0804', lw: 7, weight: 900 });
    return;
  }
  const x = 60;
  const y = 1430;
  const w = W - 120;
  ctx.save();
  ctx.globalAlpha = p;
  panel(ctx, x, y, w, 250, 24, 'rgba(90,12,8,0.9)');
  outlined(ctx, `QUẺ CHUNG · SỐ ${q.n} · ${GRADES[q.g].label}`, W / 2, y + 44, { size: 32, color: GRADES[q.g].color, stroke: '#2a0804', lw: 6, weight: 900, maxW: w - 30 });
  outlined(ctx, q.t, W / 2, y + 90, { size: 28, color: '#fff3d6', stroke: '#2a0804', lw: 5, weight: 800, font: SERIF });
  const lines = wrap(q.y, w - 70, `600 24px ${FONT}`).slice(0, 3);
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = '#fff8e1';
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y + 140 + i * 32));
  ctx.restore();
  drawStick(ctx, 960, 1060, 0, q.n, { len: 300, glow: 0.6, img: IMG.que });
  if (IMG.que) outlined(ctx, String(q.n), 960, 1060 - 300 * 0.32, { size: 22, color: '#5a0c06', stroke: '#f0d49a', lw: 4, weight: 900, font: SERIF });
}

function drawIncenseAndBua() {
  const full = now < incenseFullUntil;
  drawLuHuong(ctx, 92, 1440, full ? 10 : incense, now, full, IMG.luHuong);
  outlined(ctx, full ? 'Hương đầy!' : `${incense}/${config.sharesForIncense} nén`, 92, 1452, { size: 20, color: full ? '#ffd54f' : '#ffe0b2', stroke: '#2a0804', lw: 4, weight: 800 });
  buaList.forEach((b, i) => {
    const bx = 40 + i * 92;
    drawBua(ctx, bx + 40, 520, 76, IMG.bua ? 270 : 130, b.name, now + i * 700, IMG.bua);
    if (IMG.bua) {
      ctx.save();
      ctx.font = `800 15px ${FONT}`;
      ctx.fillStyle = '#ffe9a8';
      ctx.textAlign = 'center';
      ctx.fillText(truncate(b.name, 8), bx + 40, 640, 60);
      ctx.restore();
    }
  });
}

function drawToasts() {
  let y = 1290;
  for (let i = toasts.length - 1; i >= 0; i--) {
    const t = toasts[i];
    if (now > t.until) {
      toasts.splice(i, 1);
      continue;
    }
    if (turn && ['result', 'giaihan'].includes(turn.phase)) continue;
    const a = Math.min(1, (t.until - now) / 400, (now - t.start) / 200);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = `700 22px ${FONT}`;
    const tw = Math.min(620, ctx.measureText(t.text).width + 36);
    ctx.fillStyle = 'rgba(30,8,4,0.78)';
    rr(ctx, 30, y - 22, tw, 44, 22);
    ctx.fill();
    ctx.fillStyle = t.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.text, 48, y + 1, tw - 36);
    ctx.restore();
    y -= 52;
  }
}
function drawCaption() {
  if (!caption || now > caption.until) return;
  if (turn && turn.phase !== 'shake') return;
  const lines = wrap(caption.text, W - 160, `700 26px ${FONT}`).slice(0, 2);
  const y = 1700;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (caption.until - now) / 400);
  ctx.fillStyle = 'rgba(30,8,4,0.8)';
  rr(ctx, 60, y - 30, W - 120, 30 + lines.length * 36, 20);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = `700 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y + 2 + i * 36));
  ctx.restore();
}
function drawParticles() {
  for (const p of particles) {
    const a = 1 - p.age / p.life;
    ctx.globalAlpha = Math.max(0, Math.min(1, a * 1.5));
    if (p.kind === 'heart') {
      ctx.fillStyle = p.color;
      ctx.font = `${Math.round(p.size * 1.6)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('❤', p.x, p.y);
    } else if (p.kind === 'coin') {
      const sx = Math.abs(Math.cos(now * 0.006 + p.spin));
      ctx.fillStyle = '#ffd54f';
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * sx + 1, p.size, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(p.x - 4 * sx, p.y - 4, 8 * sx, 8);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
// luật chơi luôn hiện ở đáy màn hình, chữ lấy từ config (thay {coinPoints}... bằng số thật)
function drawRules() {
  if (!config.showRules || !Array.isArray(config.rules) || !config.rules.length) return;
  const lines = config.rules.slice(0, 4).map((r) => String(r).replace(/\{(\w+)\}/g, (m, k) => (config[k] ?? m)));
  const x = 30;
  const w = W - 60;
  const lh = 33;
  const h = 48 + lines.length * lh;
  const y = H - 40 - h;
  ctx.save();
  ctx.fillStyle = 'rgba(28,6,3,0.78)';
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,213,79,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = `900 24px ${FONT}`;
  ctx.fillStyle = '#ffd54f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`📜 ${config.rulesTitle || 'LUẬT CHƠI'}`, W / 2, y + 22);
  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'left';
  lines.forEach((l, i) => ctx.fillText(`${i + 1}. ${l}`, x + 22, y + 56 + i * lh, w - 44));
  ctx.restore();
}
function drawFooter() {
  ctx.save();
  ctx.font = `600 20px ${FONT}`;
  ctx.fillStyle = 'rgba(255,240,210,0.75)';
  ctx.textAlign = 'center';
  ctx.fillText(config.footer, W / 2, H - 20, W - 40);
  ctx.restore();
}

let audioBlocked = false;
function frame(t) {
  const dt = Math.min(100, t - (now || t)) * SPEED;
  now = t;
  update(dt);
  drawBackground();
  drawOng();
  drawOngXamArea();
  drawIncenseAndBua();
  drawHeader();
  drawBoard();
  drawPlayerCard();
  drawStagePanel();
  drawRoomQue();
  drawStickFly();
  drawResult();
  drawKeoToss();
  drawToasts();
  drawParticles();
  drawRules();
  drawCaption();
  drawFooter();
  if (audioBlocked) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(ctx, W / 2 - 250, 1760, 500, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Bấm vào game để bật tiếng', W / 2, 1789);
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
    const res = await fetch('/gieo-que-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  const dir = String(config.imageFolder || 'assets/gieo-que').replace(/\/$/, '');
  let have = null;
  try {
    const r = await fetch('/gieo-que-images.json', { cache: 'no-store' });
    if (r.ok && dir === 'assets/gieo-que') have = new Set((await r.json()).map((f) => f.toLowerCase()));
  } catch {
    /* không có máy chủ */
  }
  const load = async (names, key = true) => {
    for (const n of names) {
      if (have && !have.has(n.toLowerCase())) continue;
      const img = await loadImage(`${dir}/${n}`);
      if (img) return key ? chromaKey(img) : img;
    }
    return null;
  };
  if (params.get('img') !== '0') {
    [IMG.nen, IMG.nenVip, IMG.nenHan, IMG.ong, IMG.ongNoi, IMG.oxam, IMG.oxamVang, IMG.que, IMG.keo, IMG.toQue, IMG.luHuong, IMG.bua, IMG.theTen] = await Promise.all([
      load(['nen.jpg', 'nen.png'], false), load(['nen-vip.jpg', 'nen-vip.png'], false), load(['nen-giai-han.jpg', 'nen-giai-han.png'], false),
      load(['ong-tu.png']), load(['ong-tu-noi.png']), load(['ong-xam.png']), load(['ong-xam-vang.png']), load(['que-xam.png']),
      load(['keo.png', 'keo-ngua.png']), load(['to-que.png']), load(['lu-huong.png']), load(['bua.png']), load(['the-ten.png']),
    ]);
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
    const ms = Math.min(14000, 900 + String(text).length * 70);
    sfx.duck(ms);
    speakUntil = performance.now() + ms;
  });
  let files = Array.isArray(config.musicFiles) ? config.musicFiles.filter(Boolean) : [];
  try {
    const r = await fetch('/gieo-que-music.json', { cache: 'no-store' });
    if (r.ok) files = [...(await r.json()), ...files];
  } catch {
    /* không có máy chủ */
  }
  const startMusic = () => {
    if (config.sound === false || config.music === false) return;
    sfx.startMusic({ files, volume: Number(config.musicVolume ?? 0.35) });
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
      if (!turn && !roomQue && performance.now() - lastAnnounce > gap && performance.now() - lastVoice > 8000) {
        lastAnnounce = performance.now();
        say(line('reminder'), 0);
      }
    }, 3000);
  }
  nextLocTroi = 0;
  connectWs();
  requestAnimationFrame((t) => {
    now = t;
    lastActive = t;
    requestAnimationFrame(frame);
  });
}

window.__gq = {
  handleEvent, config: () => config,
  state: () => ({
    phase: turn?.phase || (roomQue ? 'room' : 'idle'), user: turn?.user?.name, wish: turn?.wish, topic: turn?.topic, que: turn?.que?.n, grade: turn?.grade,
    keo: turn?.keo?.result, tries: turn?.tries, vip: turn?.vip, hanCoins: turn?.hanCoins, turnCount,
    board: waitingList().map((u) => `${u.name}:${score(u)}`),
  }),
  skip: () => handleEvent({ type: 'nextPhase' }),
  forceGrade: (g) => {
    if (turn?.que) {
      turn.que = { ...turn.que, g };
    }
  },
};
boot();
