// Game TikTok LIVE "Bói bài Tarot": người xem tặng quà để được xem bói 3 lá (Gốc rễ, Hiện tại, Thời gian tới)
// theo chủ đề tự chọn (Công việc, Tiền tài, Tình duyên, Học vấn). Hàng chờ xếp theo giá trị quà.
// Cô Nguyệt lật từng lá, đọc ý nghĩa và lời giải bằng giọng AI. Chỉ mang tính giải trí.
import {
  W, H, PANEL, READER, BALL, TABLE_Y, CARD, CARD_X,
  drawRoom, drawReader, drawBall, drawCandle, drawCat, drawCardBack, drawCardFace, setCardImages, roundRectPath as rr, starShape,
} from './art.js';
import { CARDS, TOPICS, POSITIONS, topicById } from './cards.js';
import * as sfx from './tarotAudio.js';
import * as voice from '../audio.js';

const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const FONT = '"Segoe UI", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const SPEED = clamp(Number(params.get('speed')) || 1, 0.25, 8);

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'BÓI BÀI TAROT',
  readerName: 'Nguyệt',
  subtitle: 'Tặng quà để được xem bói • Gõ 1 2 3 4 chọn chủ đề • Chỉ mang tính giải trí',
  backgroundImage: '',
  readerImage: '',
  freeQueue: true,
  freeQueueMax: 3,
  likesPerPoint: 50,
  sharePoints: 2,
  followPoints: 1,
  bigGift: 100,
  defaultTopic: 'random',
  giftTopics: {},
  introSeconds: 4,
  shuffleSeconds: 3.5,
  dealSeconds: 2,
  cardSeconds: 9,
  summarySeconds: 10,
  outroSeconds: 3,
  roomCardSeconds: 35,
  queueShow: 6,
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.35,
  voice: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-HoaiMyNeural',
  voiceGapSeconds: 10,
  voiceJoin: true,
  narration: true,
  narrationSeconds: 45,
  messages: {
    welcome: ['Chào {name}, mời bạn vào phòng bói nhé', '{name} ghé chơi rồi, ngồi xuống cùng nghe bài nha', 'Chào mừng {name}, hôm nay bạn muốn hỏi chuyện gì nào'],
    thanks: ['Cảm ơn {name} nhé. Bạn xếp số {pos}, tặng thêm quà để lên sớm hơn nha', 'Cảm ơn {name} đã tặng {gift}. Bạn đang xếp số {pos} rồi đó', '{name} ơi cảm ơn bạn. Số {pos} trong hàng chờ, chờ {reader} một chút nhé'],
    thanksTopic: ['Bạn chưa chọn chủ đề, gõ 1 công việc, 2 tiền tài, 3 tình duyên, 4 học vấn nhé'],
    big: ['Wow, {name} tặng {gift}. Cảm ơn bạn rất nhiều, {reader} xem cho bạn ngay đây'],
    follow: ['Cảm ơn {name} đã theo dõi kênh nhé', 'Cảm ơn {name} đã follow, chúc bạn nhiều may mắn'],
    share: ['Cảm ơn {name} đã chia sẻ phòng live'],
    intro: ['Mời {name}. Chủ đề {topic}. Bạn hãy hít một hơi thật sâu và nghĩ về câu hỏi của mình nhé', 'Đến lượt {name}, xem về {topic}. Tập trung nghĩ về điều bạn muốn hỏi nha'],
    outro: ['Đó là thông điệp dành cho {name}. Chúc bạn mọi điều tốt đẹp', 'Cảm ơn {name}. Bài chỉ để tham khảo, quyết định vẫn là ở bạn nhé'],
    reminder: [
      'Muốn {reader} xem bài cho mình thì tặng quà bất kỳ nhé. Quà càng lớn càng được lên sớm',
      'Gõ số 1 là công việc, 2 là tiền tài, 3 là tình duyên, 4 là học vấn. Chọn chủ đề rồi tặng quà để vào hàng chờ nha',
      'Thả tim cho quả cầu pha lê sáng lên nào cả nhà ơi',
      'Mỗi người được bốc 3 lá: gốc rễ, hiện tại và thời gian tới. Cùng xem bài vui vẻ nha',
    ],
    roomCard: ['Lá bài cho cả phòng lúc này là {card}. {adv}. Ai muốn xem riêng thì tặng quà và gõ chủ đề nhé'],
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

// bỏ dấu tiếng Việt để nhận lệnh dù gõ không dấu
function norm(s) {
  return ` ${String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}
function detectTopic(text) {
  const n = norm(text);
  const num = n.trim().match(/^([1-4])$/) || n.match(/ (?:chu de|so|chon) ([1-4]) /);
  if (num) return TOPICS[Number(num[1]) - 1].id;
  for (const t of TOPICS) for (const w of t.words) if (n.includes(` ${w} `)) return t.id;
  return '';
}
const wantsReading = (text) => /( xem boi | boi bai | boi cho | xem bai | tarot )/.test(norm(text));

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
let readerImage = null;
let readerTalkImage = null;
let backImage = null;
const faceImages = [];

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

// ------------------------------------------------------------------ trạng thái
let now = 0;
const users = new Map(); // id -> { id, name, topic, likes }
const queue = []; // { user, topic, coins, points, at, vip, free }
let reading = null;
let roomCard = null;
let lastActive = 0;
let caption = null;
const toasts = [];
const particles = [];
let ballPower = 0;
let readCount = 0;
let lastVoice = 0;
let lastAnnounce = 0;
let blinkUntil = 0;
let nextBlink = 2000;
let catHappyUntil = 0;

function getUser(u) {
  if (!u || !u.id) return null;
  let x = users.get(u.id);
  if (!x) {
    x = { id: u.id, name: u.name || u.uniqueId || 'Bạn', topic: '', likes: 0, likeRemainder: 0 };
    users.set(u.id, x);
  } else if (u.name) x.name = u.name;
  return x;
}
function topicName(id) {
  return topicById(id)?.name || 'Tổng quan';
}
function sortQueue() {
  queue.sort((a, b) => b.coins + b.points - (a.coins + a.points) || a.at - b.at);
}
function queuePos(user) {
  return queue.findIndex((q) => q.user === user) + 1;
}
function say(text, priority = 0) {
  if (!text) return;
  lastVoice = now;
  if (priority > 0) lastAnnounce = now;
  // tắt giọng đọc thì vẫn cho nhân vật mấp máy môi như đang nói
  if (config.voice === false || config.sound === false) speakUntil = Math.max(speakUntil, now) + Math.min(6000, 600 + text.length * 45);
  voice.speak(text, priority);
}
function setCaption(text, ms = 6000) {
  caption = { text, until: now + ms, start: now };
}
function toast(text, color = '#e8c766') {
  toasts.push({ text, color, until: now + 3500, start: now });
  if (toasts.length > 4) toasts.shift();
}
function burstStars(x, y, n = 14, color = '#ffe08a', spread = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const sp = rand(0.08, 0.35) * spread;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.1, life: rand(900, 1700), age: 0, size: rand(5, 11), color, kind: 'star' });
  }
}
function heartFloat(x, y) {
  particles.push({ x, y, vx: rand(-0.04, 0.04), vy: rand(-0.16, -0.1), life: 1600, age: 0, size: rand(12, 18), color: pick(['#ff5c8a', '#ff8fb1', '#ffd1dc']), kind: 'heart' });
}

// ------------------------------------------------------------------ xếp hàng
function enqueue(u, { coins = 0, points = 0, free = false, giftName = '' } = {}) {
  const user = getUser(u);
  if (!user) return null;
  // đang xem cho chính người này (chưa lật lá nào): cộng quà vào lượt hiện tại, không xếp hàng lại
  if (!free && reading && reading.user === user && reading.cardIdx < 0) {
    reading.entry.coins += coins;
    if (reading.entry.coins >= Number(config.bigGift || 100)) reading.vip = reading.entry.vip = true;
    return reading.entry;
  }
  let e = queue.find((q) => q.user === user);
  if (!e) {
    if (free) {
      if (!config.freeQueue) return null;
      if (queue.filter((q) => q.free).length >= Number(config.freeQueueMax || 0)) return null;
      if (reading?.entry?.user === user) return null;
    }
    e = { user, topic: user.topic, coins: 0, points: 0, at: now, vip: false, free };
    queue.push(e);
  }
  e.coins += coins;
  e.points += points;
  if (coins > 0) e.free = false;
  if (coins >= Number(config.bigGift || 100) || e.coins >= Number(config.bigGift || 100)) e.vip = true;
  if (!e.topic && giftName) {
    const map = config.giftTopics || {};
    const key = Object.keys(map).find((k) => k.toLowerCase() === giftName.toLowerCase());
    if (key && topicById(map[key])) e.topic = map[key];
  }
  sortQueue();
  return e;
}

// ------------------------------------------------------------------ sự kiện
function handleEvent(ev) {
  if (!ev || !ev.type) return;
  if (ev.type === 'reset') {
    queue.length = 0;
    users.clear();
    reading = null;
    roomCard = null;
    return;
  }
  if (ev.type === 'voiceTest') {
    say(`Xin chào, mình là ${config.readerName}. Mời cả nhà tặng quà và chọn chủ đề để xem bài nhé`, 2);
    return;
  }
  if (ev.type === 'nextPhase') {
    if (reading) reading.phaseEnd = now;
    else lastActive = -1e9;
    return;
  }
  if (ev.type === 'giftStreak') return;
  const user = ev.user ? getUser(ev.user) : null;
  if (!user) return;
  switch (ev.type) {
    case 'join': {
      toast(`${truncate(user.name, 18)} vào phòng bói`, '#c9b6ff');
      if (config.voiceJoin && now - lastVoice > Number(config.voiceGapSeconds || 10) * 1000 && !reading) say(line('welcome', { name: user.name }), 0);
      break;
    }
    case 'chat': {
      const text = String(ev.text || '');
      const topic = detectTopic(text);
      if (topic) {
        user.topic = topic;
        const e = queue.find((q) => q.user === user);
        if (e) {
          e.topic = topic;
          toast(`${truncate(user.name, 16)} chọn ${topicName(topic)}`, topicById(topic).color);
        } else {
          const added = enqueue(ev.user, { free: true });
          if (added) {
            added.topic = topic;
            toast(`${truncate(user.name, 16)} xếp hàng: ${topicName(topic)}`, topicById(topic).color);
          } else toast(`${truncate(user.name, 16)} chọn ${topicName(topic)}, tặng quà để vào hàng`, topicById(topic).color);
        }
        sfx.sparkle();
      } else if (wantsReading(text)) {
        const added = enqueue(ev.user, { free: true });
        if (added) toast(`${truncate(user.name, 16)} vào hàng chờ`, '#c9b6ff');
      }
      break;
    }
    case 'like': {
      const n = Math.max(1, Number(ev.count) || 1);
      user.likes += n;
      ballPower = clamp(ballPower + n * 0.03, 0, 1);
      for (let i = 0; i < Math.min(3, n); i++) heartFloat((readerImage ? BALL_SIDE.x : BALL.x) + rand(-60, 60), (readerImage ? BALL_SIDE.y : BALL.y) - 20);
      sfx.sparkle();
      const per = Math.max(1, Number(config.likesPerPoint) || 50);
      user.likeRemainder += n;
      const e = queue.find((q) => q.user === user);
      if (e && user.likeRemainder >= per) {
        e.points += Math.floor(user.likeRemainder / per);
        sortQueue();
      }
      user.likeRemainder %= per;
      break;
    }
    case 'follow': {
      const e = queue.find((q) => q.user === user);
      if (e) {
        e.points += Number(config.followPoints || 0);
        sortQueue();
      }
      setCaption(line('follow', { name: user.name }), 4500);
      if (now - lastVoice > 4000) say(line('follow', { name: user.name }), 1);
      catHappyUntil = now + 2500;
      sfx.meow();
      break;
    }
    case 'share': {
      const e = queue.find((q) => q.user === user);
      if (e) {
        e.points += Number(config.sharePoints || 0);
        sortQueue();
      }
      toast(`${truncate(user.name, 16)} chia sẻ phòng live`, '#80deea');
      break;
    }
    case 'gift': {
      const coins = Math.max(1, Number(ev.coins) || Number(ev.diamonds) * Number(ev.repeatCount || 1) || 1);
      const e = enqueue(ev.user, { coins, giftName: ev.giftName || '' });
      if (!e) break;
      const pos = queuePos(user);
      const big = coins >= Number(config.bigGift || 100);
      const vars = { name: user.name, gift: ev.giftName || 'quà', pos };
      let text = big ? line('big', vars) : pos ? line('thanks', vars) : `Cảm ơn ${user.name} đã tặng ${vars.gift}, ${config.readerName} đang xem bài cho bạn đây`;
      if (pos && !e.topic && !user.topic) text += `. ${line('thanksTopic', vars)}`;
      setCaption(text, big ? 8000 : 6500);
      say(text, big ? 2 : 1);
      sfx.chimes(big ? 12 : 6);
      if (big) sfx.gong(true);
      ballPower = 1;
      burstStars(readerImage ? BALL_SIDE.x : BALL.x, readerImage ? BALL_SIDE.y : BALL.y, big ? 50 : 18, big ? '#ffe08a' : '#e1bee7', big ? 2 : 1);
      catHappyUntil = now + 3000;
      break;
    }
    default:
  }
}

// ------------------------------------------------------------------ một lượt xem bói
function phaseMs(name) {
  const key = { intro: 'introSeconds', shuffle: 'shuffleSeconds', deal: 'dealSeconds', card: 'cardSeconds', summary: 'summarySeconds', outro: 'outroSeconds' }[name];
  return (Math.max(1, Number(config[key]) || DEFAULTS[key]) * 1000) / SPEED;
}
function drawThree() {
  const pool = [...CARDS.keys()];
  const out = [];
  for (let i = 0; i < 3; i++) {
    const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const card = CARDS[k];
    const reversed = Math.random() < 0.35;
    out.push({ card, reversed, side: reversed ? card.rev : card.up, dealAt: 0, flipAt: 0 });
  }
  return out;
}
const trendLabel = (score) => (score >= 1 ? { text: 'Tốt lên', color: '#66bb6a' } : score <= -1 ? { text: 'Cần chú ý', color: '#ef5350' } : { text: 'Giữ vững', color: '#ffb300' });

function buildSummary(r) {
  const [a, b, c] = r.cards.map((x) => x.side.score);
  let head;
  if (b >= 0 && c > 0) head = a < 0 ? 'Khó trước, dễ sau' : 'Thuận lợi, cứ thế tiến lên';
  else if (b > 0 && c < 0) head = 'Đang tốt, cần đề phòng';
  else if (b <= 0 && c > 0) head = 'Qua khúc khó là sáng';
  else if (b < 0 && c < 0) head = 'Chậm lại, giữ mình';
  else head = 'Bình ổn, cần kiên nhẫn';
  const worst = r.cards.reduce((m, x) => (x.side.score < m.side.score ? x : m), r.cards[0]);
  const future = r.cards[2];
  let text = `${future.side.adv}.`;
  if (worst.side.score < 0) text += ` Chỗ bạn cần để ý nhất là lá ${worst.card.en} (${worst.card.vi}).`;
  else {
    const best = r.cards.reduce((m, x) => (x.side.score > m.side.score ? x : m), r.cards[0]);
    text += ` Cả ba lá đều thuận, điểm sáng nhất là lá ${best.card.en} (${best.card.vi}).`;
  }
  const t1 = trendLabel(b);
  const t2 = trendLabel(c);
  return { head, text, trend: `${t1.text} → ${t2.text}` };
}

function startReading(entry) {
  const user = entry.user;
  let topic = entry.topic || user.topic;
  let autoTopic = false;
  if (!topicById(topic)) {
    topic = topicById(config.defaultTopic) ? config.defaultTopic : pick(TOPICS).id;
    autoTopic = true;
  }
  reading = {
    entry, user, topic, autoTopic, vip: entry.vip,
    cards: drawThree(), phase: 'intro', phaseStart: now, phaseEnd: now + phaseMs('intro'), cardIdx: -1,
    revealed: 0, summary: null, scroll: 0, start: now,
  };
  reading.summaryData = buildSummary(reading);
  readCount++;
  let text = line('intro', { name: user.name, topic: topicName(topic) });
  if (autoTopic) text += `. Bạn chưa chọn chủ đề nên ${config.readerName} xem ${topicName(topic)} nhé`;
  say(text, 2);
  sfx.gong(entry.vip);
  if (entry.vip) burstStars(W / 2, PANEL.y + 40, 40, '#ffe08a', 2);
}

function nextPhase() {
  const r = reading;
  const go = (phase, ms) => {
    r.phase = phase;
    r.phaseStart = now;
    r.phaseEnd = now + ms;
  };
  if (r.phase === 'intro') {
    go('shuffle', phaseMs('shuffle'));
    sfx.shuffle(Math.min(3, phaseMs('shuffle') / 1000));
  } else if (r.phase === 'shuffle') {
    go('deal', phaseMs('deal'));
    r.cards.forEach((c, i) => {
      c.dealAt = now + i * (phaseMs('deal') / 4);
      setTimeout(() => sfx.deal(), (i * phaseMs('deal')) / 4);
    });
  } else if (r.phase === 'deal' || r.phase === 'card') {
    if (r.cardIdx < 2) {
      r.cardIdx++;
      go('card', phaseMs('card'));
      const c = r.cards[r.cardIdx];
      c.flipAt = now;
      r.revealed = r.cardIdx + 1;
      sfx.flip(c.reversed);
      sfx.whoosh();
      burstStars(CARD_X[r.cardIdx], CARD.y + CARD.h / 2, 16, '#ffe08a');
      const order = ['Lá thứ nhất', 'Lá thứ hai', 'Lá thứ ba'][r.cardIdx];
      say(`${order}, ${POSITIONS[r.cardIdx]}: ${c.card.vi}${c.reversed ? ', lá ngược' : ''}. ${c.side[r.topic]}`, 2);
    } else {
      go('summary', phaseMs('summary'));
      r.summary = r.summaryData;
      say(`Tóm lại: ${r.summary.head}. ${r.summary.text}`, 2);
      sfx.chimes(5);
    }
  } else if (r.phase === 'summary') {
    go('outro', phaseMs('outro'));
    say(line('outro', { name: r.user.name }), 1);
  } else {
    reading = null;
    lastActive = now;
  }
}

function startRoomCard() {
  const card = pick(CARDS);
  const reversed = false;
  roomCard = { card, reversed, start: now, end: now + 16000 / SPEED, flipAt: now + 2200 / SPEED };
  sfx.shuffle(1.2);
  setTimeout(() => {
    sfx.flip(false);
    say(line('roomCard', { card: card.vi, adv: card.up.adv }), 1);
  }, 2200 / SPEED);
}

function update(dt) {
  ballPower = Math.max(0, ballPower - dt * 0.00012);
  if (reading) {
    if (now >= reading.phaseEnd) nextPhase();
  } else if (roomCard) {
    if (now >= roomCard.end || queue.length) {
      roomCard = null;
      lastActive = now;
    }
  } else if (queue.length) {
    const entry = queue.shift();
    startReading(entry);
  } else if (now - lastActive > (Number(config.roomCardSeconds) || 35) * 1000 / SPEED) {
    startRoomCard();
  }
  for (const p of particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'star') p.vy += 0.0002 * dt;
  }
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].age > particles[i].life) particles.splice(i, 1);
  if (now > nextBlink) {
    blinkUntil = now + 140;
    nextBlink = now + rand(2500, 5000);
  }
}

// ------------------------------------------------------------------ vẽ
function drawHeader() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 64px ${SERIF}`;
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(20,6,40,0.85)';
  ctx.strokeText(config.title, W / 2, 196);
  const g = ctx.createLinearGradient(0, 166, 0, 226);
  g.addColorStop(0, '#fff3c4');
  g.addColorStop(1, '#d9a63a');
  ctx.fillStyle = g;
  ctx.fillText(config.title, W / 2, 196);
  ctx.fillStyle = '#ffe08a';
  for (const s of [-1, 1]) {
    starShape(ctx, W / 2 + s * (ctx.measureText(config.title).width / 2 + 34), 194, 14, 4, 0.35);
    ctx.fill();
  }
  if (!reading) {
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = 'rgba(255,240,210,0.9)';
    ctx.fillText(config.subtitle, W / 2, 246, W - 60);
  }
  ctx.restore();
}

function panelBox() {
  const { x, y, w, h } = PANEL;
  ctx.save();
  ctx.fillStyle = 'rgba(16,8,24,0.86)';
  rr(ctx, x, y, w, h, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,199,102,0.85)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,199,102,0.3)';
  ctx.lineWidth = 1.5;
  rr(ctx, x + 8, y + 8, w - 16, h - 16, 16);
  ctx.stroke();
  ctx.restore();
}

// nội dung bảng giải bài, có cuộn dần xuống phần mới nhất
function drawPanel() {
  const { x, y, w, h } = PANEL;
  panelBox();
  if (!reading) {
    drawPanelIdle();
    return;
  }
  const r = reading;
  // dòng tiêu đề
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.font = `700 34px ${SERIF}`;
  ctx.fillStyle = '#ffe9b0';
  const head = r.summary ? r.summary.head : r.phase === 'intro' || r.phase === 'shuffle' ? 'Đang xào bài...' : r.phase === 'deal' ? 'Đang trải bài...' : `Đang giải lá ${POSITIONS[r.cardIdx] || ''}`;
  ctx.fillText(head, x + 34, y + 44, w * 0.62);
  ctx.textAlign = 'right';
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  if (r.summary) ctx.fillText(r.summary.trend, x + w - 34, y + 46);
  else ctx.fillText(`Chủ đề: ${topicName(r.topic)}`, x + w - 34, y + 46);
  ctx.restore();
  ctx.strokeStyle = 'rgba(232,199,102,0.4)';
  ctx.beginPath();
  ctx.moveTo(x + 30, y + 78);
  ctx.lineTo(x + w - 30, y + 78);
  ctx.stroke();

  // khối nội dung
  const blocks = [];
  const tw = w - 80;
  const fBody = `500 25px ${FONT}`;
  const fBold = `700 25px ${FONT}`;
  for (let i = 0; i < r.revealed; i++) {
    const c = r.cards[i];
    blocks.push({ kind: 'title', i, text: `${i + 1}. ${POSITIONS[i]}: `, name: `${c.card.en}`, vi: ` (${c.card.vi}${c.reversed ? ', ngược' : ''})`, active: i === r.cardIdx && !r.summary });
    for (const ln of wrap(`Ý nghĩa: ${c.side.y}`, tw, fBody)) blocks.push({ kind: 'line', text: ln, label: ln.startsWith('Ý nghĩa:') ? 'Ý nghĩa:' : '' });
    for (const ln of wrap(`Lý giải: ${c.side[r.topic]}`, tw, fBody)) blocks.push({ kind: 'line', text: ln, label: ln.startsWith('Lý giải:') ? 'Lý giải:' : '' });
    blocks.push({ kind: 'gap' });
  }
  if (r.summary) {
    blocks.push({ kind: 'sumTitle', text: 'Lý giải chung' });
    for (const ln of wrap(r.summary.text, tw - 30, `italic 500 25px ${SERIF}`)) blocks.push({ kind: 'sum', text: ln });
  }
  if (!blocks.length) {
    // chưa lật lá nào: hiện tên người được xem
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 28px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Đang xem bài cho', W / 2, y + 170);
    ctx.font = `700 48px ${SERIF}`;
    ctx.fillStyle = r.vip ? '#ffe08a' : '#fff';
    ctx.fillText(truncate(r.user.name, 22), W / 2, y + 232, w - 80);
    ctx.font = `600 28px ${FONT}`;
    ctx.fillStyle = topicById(r.topic).color;
    ctx.fillText(`Chủ đề: ${topicName(r.topic)}`, W / 2, y + 294);
    ctx.font = `500 23px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Hãy nghĩ về câu hỏi của bạn thật rõ ràng nhé', W / 2, y + 356);
    ctx.restore();
    return;
  }
  const LH = { title: 42, line: 34, gap: 14, sumTitle: 44, sum: 34 };
  const total = blocks.reduce((s, b) => s + LH[b.kind], 0);
  const viewTop = y + 92;
  const viewH = h - 110;
  const target = Math.max(0, total - viewH);
  r.scroll = lerp(r.scroll, target, 0.06);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 10, viewTop, w - 20, viewH);
  ctx.clip();
  let cy = viewTop - r.scroll;
  ctx.textBaseline = 'top';
  for (const b of blocks) {
    const bx = x + 40;
    if (b.kind === 'title') {
      ctx.font = `700 28px ${SERIF}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(b.text, bx, cy + 6);
      let ox = bx + ctx.measureText(b.text).width;
      ctx.fillStyle = '#ffd54f';
      ctx.fillText(b.name, ox, cy + 6);
      ox += ctx.measureText(b.name).width;
      ctx.font = `600 23px ${FONT}`;
      ctx.fillStyle = 'rgba(255,230,190,0.85)';
      ctx.fillText(b.vi, ox, cy + 10);
      if (b.active) {
        ctx.fillStyle = '#ffe08a';
        starShape(ctx, bx - 18, cy + 21, 9, 4, 0.4);
        ctx.fill();
      }
    } else if (b.kind === 'line') {
      ctx.font = fBody;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      if (b.label) {
        ctx.font = fBold;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(b.label, bx, cy);
        const lw = ctx.measureText(`${b.label} `).width;
        ctx.font = fBody;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(b.text.slice(b.label.length + 1), bx + lw, cy);
      } else ctx.fillText(b.text, bx, cy);
    } else if (b.kind === 'sumTitle') {
      ctx.font = `700 28px ${SERIF}`;
      ctx.fillStyle = '#ffd54f';
      ctx.fillText(b.text, bx, cy + 8);
    } else if (b.kind === 'sum') {
      ctx.fillStyle = '#e8c766';
      ctx.fillRect(bx, cy - 2, 4, LH.sum);
      ctx.font = `italic 500 25px ${SERIF}`;
      ctx.fillStyle = '#fff6dc';
      ctx.fillText(b.text, bx + 20, cy);
    }
    cy += LH[b.kind];
  }
  ctx.restore();
  // thanh tiến độ của lượt
  const total2 = r.phaseEnd - r.phaseStart;
  const p = clamp((now - r.phaseStart) / total2, 0, 1);
  ctx.fillStyle = 'rgba(232,199,102,0.25)';
  ctx.fillRect(x + 30, y + h - 14, w - 60, 4);
  ctx.fillStyle = '#e8c766';
  ctx.fillRect(x + 30, y + h - 14, (w - 60) * p, 4);
}

function drawPanelIdle() {
  const { x, y, w } = PANEL;
  ctx.save();
  ctx.textBaseline = 'middle';
  if (roomCard && now > roomCard.flipAt) {
    ctx.textAlign = 'center';
    ctx.font = `700 32px ${SERIF}`;
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText('Lá bài cho cả phòng live', W / 2, y + 48);
    ctx.font = `700 40px ${SERIF}`;
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(`${roomCard.card.en}`, W / 2, y + 118);
    ctx.font = `600 26px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(roomCard.card.vi, W / 2, y + 162);
    let yy = y + 222;
    ctx.font = `italic 500 27px ${SERIF}`;
    ctx.fillStyle = '#fff6dc';
    for (const ln of wrap(`"${roomCard.card.up.adv}."`, w - 120, ctx.font)) {
      ctx.fillText(ln, W / 2, yy);
      yy += 38;
    }
    ctx.font = `500 23px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Muốn xem riêng: tặng quà + gõ số chủ đề', W / 2, y + 400);
    ctx.restore();
    return;
  }
  ctx.textAlign = 'center';
  ctx.font = `700 34px ${SERIF}`;
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText(`${config.readerName} xem bài cho bạn`, W / 2, y + 50);
  const rows = [
    ['1', 'Tặng quà bất kỳ để vào hàng chờ xem bói 3 lá'],
    ['2', 'Gõ 1 Công việc · 2 Tiền tài · 3 Tình duyên · 4 Học vấn'],
    ['3', 'Quà càng lớn càng được xem sớm, thả tim cũng được cộng điểm'],
    ['4', 'Ba lá: Gốc rễ · Hiện tại · Thời gian tới, có lời giải chi tiết'],
  ];
  ctx.textAlign = 'left';
  rows.forEach(([n, t], i) => {
    const yy = y + 122 + i * 74;
    ctx.fillStyle = '#e8c766';
    ctx.beginPath();
    ctx.arc(x + 70, yy, 22, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a1238';
    ctx.font = `800 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(n, x + 70, yy + 1);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `600 26px ${FONT}`;
    ctx.fillText(t, x + 110, yy, w - 140);
  });
  ctx.font = `500 21px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'center';
  ctx.fillText(`Đã xem cho ${readCount} người trong buổi live`, W / 2, y + 432);
  ctx.restore();
}

// tên người đang được xem (thẻ nhỏ trên bảng)
function drawNameTag() {
  if (!reading) return;
  const r = reading;
  const t = topicById(r.topic);
  ctx.save();
  ctx.font = `700 26px ${FONT}`;
  const name = truncate(r.user.name, 18);
  const tw = Math.max(ctx.measureText(name).width, 160) + 60;
  const x = W / 2 - tw / 2;
  const y = PANEL.y - 36;
  ctx.fillStyle = r.vip ? 'rgba(90,60,10,0.95)' : 'rgba(30,12,40,0.95)';
  rr(ctx, x, y, tw, 64, 32);
  ctx.fill();
  ctx.strokeStyle = r.vip ? '#ffd54f' : 'rgba(232,199,102,0.8)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(name, W / 2, y + 22);
  ctx.font = `italic 600 19px ${SERIF}`;
  ctx.fillStyle = t.color;
  ctx.fillText(`"${t.name}"${r.vip ? ' · VIP' : ''}`, W / 2, y + 47);
  ctx.restore();
}

function drawTopicMenu() {
  const x = 812;
  const y0 = 770;
  ctx.save();
  ctx.fillStyle = 'rgba(16,8,24,0.72)';
  rr(ctx, x - 14, y0 - 46, 262, 300, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,199,102,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textBaseline = 'middle';
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText('Gõ số chọn chủ đề', x + 4, y0 - 20);
  TOPICS.forEach((t, i) => {
    const y = y0 + 22 + i * 62;
    const active = reading && reading.topic === t.id;
    if (active) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      rr(ctx, x - 6, y - 26, 246, 52, 14);
      ctx.fill();
    }
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(x + 24, y, 22, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a1238';
    ctx.font = `800 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x + 24, y + 1);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `700 27px ${FONT}`;
    ctx.fillText(t.name, x + 58, y);
  });
  ctx.restore();
}

function drawQueue() {
  const x = 680;
  const y = 1520;
  const w = 380;
  const show = Math.max(1, Number(config.queueShow) || 6);
  const list = queue.slice(0, show);
  const h = 70 + Math.max(1, list.length) * 46 + (queue.length > show ? 50 : 12);
  ctx.save();
  ctx.fillStyle = 'rgba(16,8,24,0.82)';
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,199,102,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textBaseline = 'middle';
  ctx.font = `700 25px ${FONT}`;
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText('Hàng chờ xem bói', x + 20, y + 34);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.fillText(String(queue.length), x + w - 20, y + 34);
  ctx.textAlign = 'left';
  if (!list.length) {
    ctx.font = `500 21px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Tặng quà để là người đầu tiên', x + 20, y + 86);
  }
  list.forEach((e, i) => {
    const yy = y + 82 + i * 46;
    ctx.fillStyle = e.vip ? '#ffd54f' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(x + 34, yy, 16, 0, TAU);
    ctx.fill();
    ctx.fillStyle = e.vip ? '#3a2400' : '#fff';
    ctx.font = `700 18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x + 34, yy + 1);
    ctx.textAlign = 'left';
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(truncate(e.user.name, 13), x + 60, yy, 180);
    const t = topicById(e.topic || e.user.topic);
    ctx.fillStyle = t ? t.color : 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(x + 258, yy, 8, 0, TAU);
    ctx.fill();
    ctx.textAlign = 'right';
    ctx.font = `600 18px ${FONT}`;
    ctx.fillStyle = e.coins ? '#ffe08a' : 'rgba(255,255,255,0.55)';
    ctx.fillText(e.coins ? `${e.coins} xu` : 'miễn phí', x + w - 18, yy);
    ctx.textAlign = 'left';
  });
  if (queue.length > show) {
    ctx.font = `500 18px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`Còn ${queue.length - show} người phía sau · tặng thêm quà để lên sớm hơn`, x + 18, y + h - 24, w - 36);
  }
  ctx.restore();
}

function drawCaption() {
  if (!caption || now > caption.until) return;
  const a = clamp((now - caption.start) / 250, 0, 1) * clamp((caption.until - now) / 400, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  const lines = wrap(caption.text, 900, `700 27px ${FONT}`).slice(0, 3);
  const h = 26 + lines.length * 36;
  const y = 1046 - h / 2;
  ctx.fillStyle = 'rgba(10,4,16,0.88)';
  rr(ctx, 60, y, W - 120, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,199,102,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 27px ${FONT}`;
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, y + 31 + i * 36));
  ctx.restore();
}

function drawToasts() {
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.font = `600 22px ${FONT}`;
  toasts.forEach((t, i) => {
    if (now > t.until) return;
    const a = clamp((now - t.start) / 200, 0, 1) * clamp((t.until - now) / 400, 0, 1);
    ctx.globalAlpha = a;
    const y = 780 + i * 44;
    const tw = ctx.measureText(t.text).width + 36;
    ctx.fillStyle = 'rgba(16,8,24,0.78)';
    rr(ctx, 24, y - 18, tw, 38, 19);
    ctx.fill();
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, 42, y + 1);
  });
  for (let i = toasts.length - 1; i >= 0; i--) if (now > toasts[i].until) toasts.splice(i, 1);
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    const a = 1 - p.age / p.life;
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.fillStyle = p.color;
    if (p.kind === 'heart') {
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + s * 0.4);
      ctx.bezierCurveTo(p.x - s, p.y - s * 0.3, p.x - s * 0.5, p.y - s, p.x, p.y - s * 0.45);
      ctx.bezierCurveTo(p.x + s * 0.5, p.y - s, p.x + s, p.y - s * 0.3, p.x, p.y + s * 0.4);
      ctx.fill();
    } else {
      starShape(ctx, p.x, p.y, p.size * (0.6 + a * 0.4), 4, 0.4, p.age * 0.004);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// bộ bài, xào bài, chia bài, lật bài
const DECK = { x: W / 2, y: CARD.y + CARD.h / 2 };
const BALL_SIDE = { x: 150, y: 1010, s: 0.9 };
function cardPos(i, r) {
  const c = r.cards[i];
  const tx = CARD_X[i];
  const ty = CARD.y + CARD.h / 2;
  if (!c.dealAt || now < c.dealAt) return null;
  const p = ease(clamp((now - c.dealAt) / (450 / SPEED), 0, 1));
  return { x: lerp(DECK.x, tx, p), y: lerp(DECK.y - 40, ty, p), rot: (1 - p) * (i - 1) * 0.5 };
}
function drawCardAt(cx, cy, w, h, rot, face, card, reversed, flipP, glow) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  // lật: co chiều ngang rồi mở ra mặt trước
  const sx = Math.abs(Math.cos(flipP * Math.PI)) || 0.01;
  ctx.scale(sx, 1);
  // bóng đổ
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, -w / 2 + 6, -h / 2 + 10, w, h, 16);
  ctx.fill();
  if (flipP > 0.5 && face) drawCardFace(ctx, card, -w / 2, -h / 2, w, h, { reversed, glow });
  else drawCardBack(ctx, -w / 2, -h / 2, w, h, now, glow);
  ctx.restore();
}

function drawSpread() {
  const r = reading;
  const { w, h } = CARD;
  if (r && (r.phase === 'intro' || r.phase === 'shuffle' || r.phase === 'deal')) {
    // bộ bài giữa bàn
    const shuffling = r.phase === 'shuffle';
    const n = 6;
    for (let i = 0; i < n; i++) {
      let ox = 0;
      let oy = -i * 2;
      let rot = 0;
      if (shuffling) {
        const ph = (now * 0.006 * SPEED + i * 0.9) % TAU;
        ox = Math.sin(ph) * (i % 2 ? 120 : -120) * 0.6;
        oy += -Math.abs(Math.cos(ph)) * 30;
        rot = Math.sin(ph) * 0.12;
      }
      drawCardAt(DECK.x + ox, DECK.y - 40 + oy, w * 0.9, h * 0.9, rot, false, null, false, 0, 0);
    }
  }
  if (r && r.phase !== 'intro' && r.phase !== 'shuffle') {
    r.cards.forEach((c, i) => {
      const p = cardPos(i, r);
      if (!p) return;
      const flipP = c.flipAt ? clamp((now - c.flipAt) / (600 / SPEED), 0, 1) : 0;
      const active = r.cardIdx === i && r.phase === 'card';
      const lift = active ? -14 : 0;
      drawCardAt(p.x, p.y + lift, w, h, p.rot, true, c.card, c.reversed, flipP, active ? 0.7 + 0.3 * Math.sin(now * 0.005) : 0.15);
      // nhãn vị trí
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 25px ${SERIF}`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(10,4,16,0.8)';
      ctx.strokeText(POSITIONS[i], CARD_X[i], CARD.y + h + 26);
      ctx.fillStyle = '#ffe9b0';
      ctx.fillText(POSITIONS[i], CARD_X[i], CARD.y + h + 26);
      if (flipP >= 1) {
        const tl = trendLabel(c.side.score);
        const label = c.reversed ? `${tl.text} · Ngược` : tl.text;
        ctx.font = `700 19px ${FONT}`;
        const lw = ctx.measureText(label).width + 26;
        ctx.fillStyle = tl.color;
        rr(ctx, CARD_X[i] - lw / 2, CARD.y - 34, lw, 30, 15);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(label, CARD_X[i], CARD.y - 18);
      }
      ctx.restore();
    });
  }
  if (!r && roomCard) {
    const flipP = clamp((now - roomCard.flipAt) / (600 / SPEED), 0, 1);
    const appear = ease(clamp((now - roomCard.start) / 600, 0, 1));
    const shuffle = now < roomCard.flipAt ? Math.sin(now * 0.02) * 10 : 0;
    drawCardAt(W / 2 + shuffle, CARD.y + h / 2 + (1 - appear) * 60, w, h, 0, true, roomCard.card, false, flipP, 0.6);
  }
}

function frame(t) {
  const dt = Math.min(100, t - (now || t)) * SPEED;
  now = t;
  update(dt);
  if (bgImage) ctx.drawImage(bgImage, 0, 0, W, H);
  else ctx.drawImage(bg, 0, 0);
  if (!bgImage || config.candles) {
    drawCandle(ctx, 990, TABLE_Y + 90, 70, now);
    drawCandle(ctx, 930, TABLE_Y + 120, 46, now + 900, 0.8);
  }
  // cô Nguyệt
  const r = reading;
  let handMode = 'rest';
  let pointX = BALL.x;
  if (r) {
    if (r.phase === 'intro') handMode = 'ball';
    else if (r.phase === 'shuffle') handMode = 'shuffle';
    else if (r.phase === 'card') {
      handMode = 'point';
      pointX = CARD_X[r.cardIdx];
    } else if (r.phase === 'summary') handMode = 'ball';
  } else if (roomCard || ballPower > 0.3) handMode = 'ball';
  const speaking = voiceSpeaking();
  if (readerImage) {
    // ảnh nhân vật: đáy ảnh đặt ngay mép bàn, nhún nhẹ khi thở; đang nói thì xen ảnh miệng mở
    const iw = Number(config.readerWidth) || 640;
    const ih = (readerImage.height / readerImage.width) * iw;
    // đang nói: đổi qua lại ảnh miệng mở / miệng khép theo nhịp
    const img = speaking && readerTalkImage && Math.sin(now * 0.022) > -0.2 ? readerTalkImage : readerImage;
    ctx.drawImage(img, READER.x - iw / 2, (Number(config.readerBottom) || 1330) - ih + Math.sin(now * 0.002) * 3, iw, ih);
  } else {
    drawReader(ctx, {
      t: now, speaking, eyesOpen: !(r && r.phase === 'intro') && handMode !== 'ball', blink: now < blinkUntil,
      handMode, pointX, look: handMode === 'point' ? Math.sign(pointX - BALL.x) : 0,
    });
  }
  const ballPow = Math.max(ballPower, r && (r.phase === 'intro' || r.phase === 'summary') ? 0.8 : 0);
  if (readerImage) {
    // dùng ảnh nhân vật: quả cầu đặt bên trái bàn, không vẽ mèo (cho hợp phong cách ảnh)
    ctx.save();
    ctx.translate(BALL_SIDE.x - BALL.x * BALL_SIDE.s, BALL_SIDE.y - BALL.y * BALL_SIDE.s);
    ctx.scale(BALL_SIDE.s, BALL_SIDE.s);
    drawBall(ctx, now, ballPow);
    ctx.restore();
    if (config.showCat) drawCat(ctx, 90, TABLE_Y + 70, now, now < catHappyUntil ? 1 : 0);
  } else {
    drawBall(ctx, now, ballPow);
    if (config.showCat !== false) drawCat(ctx, 90, TABLE_Y + 70, now, now < catHappyUntil ? 1 : 0);
  }
  drawSpread();
  drawHeader();
  drawPanel();
  drawNameTag();
  drawTopicMenu();
  drawQueue();
  drawToasts();
  drawParticles();
  drawCaption();
  if (audioBlocked) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(ctx, W / 2 - 250, 1470, 500, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Bấm vào game để bật tiếng', W / 2, 1499);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}

let speakUntil = 0;
function voiceSpeaking() {
  return now < speakUntil;
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

function loadImage(src, quiet = false) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (!quiet) console.warn('[ảnh] Không tải được', src);
      resolve(null);
    };
    img.src = src;
  });
}

let audioBlocked = false;
async function boot() {
  try {
    const res = await fetch('/tarot-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  drawRoom(bg.getContext('2d'), config);
  if (params.get('export') === '1') {
    const a = document.createElement('a');
    a.download = 'nen-tarot.png';
    a.href = bg.toDataURL('image/png');
    a.click();
  }
  // Ảnh tự thiết kế (không bắt buộc): đặt vào thư mục public/assets/tarot với đúng tên file
  const dir = String(config.imageFolder || 'assets/tarot').replace(/\/$/, '');
  // danh sách ảnh có thật trong thư mục (để không tải thử file không tồn tại)
  let have = null;
  try {
    const r = await fetch('/tarot-images.json', { cache: 'no-store' });
    if (r.ok && dir === 'assets/tarot') have = new Set((await r.json()).map((f) => `${dir}/${f}`.toLowerCase()));
  } catch {
    /* không có máy chủ */
  }
  const first = async (...names) => {
    for (const n of names) {
      if (have && n.startsWith(`${dir}/`) && !have.has(n.toLowerCase())) continue;
      const img = await loadImage(n, true);
      if (img) return img;
    }
    return null;
  };
  if (params.get('bg') !== '0') bgImage = await first(...[config.backgroundImage, `${dir}/nen.jpg`, `${dir}/nen.png`].filter(Boolean));
  if (params.get('img') !== '0') {
    readerImage = await first(...[config.readerImage, `${dir}/nhan-vat.png`].filter(Boolean));
    readerTalkImage = await first(`${dir}/nhan-vat-noi.png`);
    backImage = await first(`${dir}/mat-sau.png`, `${dir}/mat-sau.jpg`);
    await Promise.all(CARDS.map(async (_, i) => {
      const n = String(i).padStart(2, '0');
      faceImages[i] = await first(`${dir}/la-${n}.png`, `${dir}/la-${n}.jpg`);
    }));
  }
  setCardImages(backImage, faceImages);
  if (params.get('sound') === '0') config.sound = false;
  if (params.get('voice') === '0') config.voice = false;
  if (params.get('music') === '0') config.music = false;
  sfx.setSoundEnabled(config.sound !== false);
  voice.setSoundEnabled(config.sound !== false);
  voice.setVoiceEnabled(config.voice !== false);
  voice.setVoiceEngine(params.get('engine') || config.voiceEngine);
  voice.setPreferredVoice(config.ttsVoice);
  voice.setOnSpeakStart((text) => {
    const ms = Math.min(12000, 900 + String(text).length * 70);
    sfx.duck(ms);
    speakUntil = performance.now() + ms;
  });
  let files = Array.isArray(config.musicFiles) ? config.musicFiles.filter(Boolean) : [];
  try {
    const r = await fetch('/tarot-music.json', { cache: 'no-store' });
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
    const gap = Math.max(15, Number(config.narrationSeconds) || 45) * 1000;
    setInterval(() => {
      if (!reading && performance.now() - lastAnnounce > gap && performance.now() - lastVoice > 8000) {
        lastAnnounce = performance.now();
        say(line('reminder'), 0);
      }
    }, 3000);
  }
  connectWs();
  requestAnimationFrame((t) => {
    now = t;
    lastActive = t;
    requestAnimationFrame(frame);
  });
}

window.__tarot = {
  handleEvent, queue, config: () => config,
  state: () => ({ phase: reading?.phase || (roomCard ? 'room' : 'idle'), user: reading?.user?.name, topic: reading?.topic, cards: reading?.cards.map((c) => `${c.card.en}${c.reversed ? ' (R)' : ''}`), queue: queue.map((q) => `${q.user.name}:${q.coins}+${q.points}:${q.topic}`), readCount }),
  skip: () => handleEvent({ type: 'nextPhase' }),
};
boot();
