import {
  W, H, roundRect, drawLotus, drawStaticBackground, buildSlots, candlePositions, scaleAtY, useLayout,
} from './scene.js';
import * as sfx from './audio.js';
import { drawCharacter, lookFor } from './characterArt.js';

// ------------------------------------------------------------------ cấu hình
const params = new URLSearchParams(location.search);
const DEFAULTS = {
  title: 'NAM MÔ A DI ĐÀ PHẬT',
  subtitle: 'Bình luận "Nam mô A Di Đà Phật" để lễ Phật',
  templeName: 'Chánh Điện An Lạc',
  maxCharacters: 90,
  ambientMonks: 6,
  ambientCrowd: 30,
  backgroundImage: '',
  idleMinutes: 20,
  bowKeywords: ['nam mo a di da phat', 'nam mo', 'a di da phat', 'adida', 'nammo'],
  bowCount: 3,
  giftTiers: { lotus: 1, bell: 10, grand: 100 },
  sound: true,
  voice: true,
  voiceJoin: true,
  voiceEngine: 'auto',
  captions: true,
  music: true,
  musicFile: '',
  musicVolume: 0.25,
  buddhaImage: '',
  reminderMinutes: 3,
  narration: true,
  narrationSeconds: 30,
  buddhaLight: true,
  messages: {
    join: [
      'A Di Đà Phật, chào mừng {name} đã đến chánh điện',
      'Nam mô A Di Đà Phật, {name} vừa vào lễ Phật',
      'Hoan hỷ đón {name}, chúc bạn một ngày an lạc',
      'Chào {name}, mời bạn tịnh tâm cùng mọi người',
      'A Di Đà Phật, {name} đã đến, nguyện bình an',
    ],
    follow: [
      'Cảm ơn {name} đã theo dõi kênh. Nguyện an lạc',
      'A Di Đà Phật, tri ân {name} đã theo dõi, chúc bạn nhiều phước lành',
      'Cảm ơn {name} đã đồng hành cùng chánh điện',
    ],
    share: [
      'Cảm ơn {name} đã chia sẻ, công đức vô lượng',
      'A Di Đà Phật, {name} đã lan toả phiên lễ Phật',
    ],
    gift: [
      'Cảm ơn {name} đã cúng dường {gift}',
      'A Di Đà Phật, tri ân {name} đã dâng {gift}',
      'Hoan hỷ tâm thành của {name}, nguyện bạn bình an',
    ],
    bigGift: [
      'Nam mô A Di Đà Phật. Xin tri ân {name} đã cúng dường {gift}. Nguyện cầu gia đạo bình an, vạn sự cát tường',
      'Nam mô A Di Đà Phật. Tâm thành của {name} thật đáng quý. Nguyện bạn và gia đình luôn an lạc',
    ],
    reminder: [
      'Mời quý Phật tử bình luận Nam mô A Di Đà Phật để cùng lễ Phật',
      'Thả tim để nhân vật của bạn vái lạy, theo dõi kênh để nhận hào quang',
      'Cầu nguyện điều gì, quý vị hãy viết vào bình luận nhé',
      'Quý vị thả tim để vái lạy Đức Phật, mỗi lần thả tim là một lần tịnh tâm',
      'Nếu thấy an lạc, quý vị bấm theo dõi kênh và chia sẻ phiên lễ Phật đến người thân nhé',
      'Ai mới vào, hãy bình luận Nam mô A Di Đà Phật để vào ngồi trong chánh điện',
    ],
    teaching: [
      'Tâm an thì cảnh an. Mời quý vị hít thở thật chậm, buông xuống mọi lo toan',
      'Một lời nói hiền, một việc làm lành hôm nay là hạt giống phước lành cho ngày mai',
      'Giận dữ như cầm hòn than nóng, người bị bỏng trước tiên là chính mình. Mời quý vị buông xả',
      'Hạnh phúc không ở đâu xa, hạnh phúc là được bình an ngay trong giây phút này',
      'Biết đủ là giàu. Biết buông là nhẹ. Nguyện quý vị luôn thảnh thơi',
      'Hiếu thảo với cha mẹ là phước lớn nhất đời người. Hôm nay quý vị đã gọi điện cho cha mẹ chưa',
      'Gieo nhân lành, gặt quả lành. Nguyện quý vị gieo thật nhiều hạt giống yêu thương',
      'Mỗi tiếng niệm Phật là một lần tâm được thanh tịnh. Mời quý vị cùng niệm Nam mô A Di Đà Phật',
      'Đời người như dòng sông, có lúc êm đềm có lúc sóng gió. Giữ tâm bình thản, mọi việc rồi sẽ qua',
      'Nguyện cầu cho quý vị và gia đình thân tâm thường an lạc, vạn sự cát tường',
      'Tha thứ cho người khác cũng là tự giải thoát cho chính mình',
      'Sống chậm lại một chút, thương nhau nhiều hơn một chút. A Di Đà Phật',
    ],
    thanks: [
      'Cảm ơn {name} đã ghé thăm chánh điện. Nguyện quý vị luôn bình an',
      'A Di Đà Phật, tri ân {name} đã cùng tịnh tâm lễ Phật',
      'Hoan hỷ có {name} đồng hành hôm nay. Chúc quý vị nhiều sức khoẻ',
    ],
    chant: [
      'Nam mô A Di Đà Phật. Nam mô A Di Đà Phật. Nam mô A Di Đà Phật',
      'Mời quý vị cùng niệm. Nam mô Bổn Sư Thích Ca Mâu Ni Phật. Nam mô A Di Đà Phật',
      'Nam mô Đại Từ Đại Bi Quán Thế Âm Bồ Tát. Nam mô A Di Đà Phật',
    ],
  },
};

// Lời chúc: đọc thành tiếng + hiện chữ trên màn hình
const captions = [];
let caption = null;
let lastAnnounce = performance.now();
function announce(text, priority = 0) {
  if (!text) return;
  lastAnnounce = performance.now();
  sfx.speak(text, priority);
  if (config.captions === false) return;
  if (priority === 0 && captions.length >= 2) return;
  captions.push({ text, priority });
  captions.sort((a, b) => b.priority - a.priority);
  if (captions.length > 4) captions.length = 4;
}

function drawCaption(now) {
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
  ctx.font = '600 30px system-ui, "Segoe UI", sans-serif';
  const lines = wrapText(caption.text, 38, 3);
  const w = Math.min(1000, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 70);
  const lh = 40;
  const h = lines.length * lh + 26;
  const y = bgImage ? 900 : 860;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(110,20,8,0.95)');
  g.addColorStop(1, 'rgba(55,8,3,0.95)');
  ctx.fillStyle = g;
  roundRect(ctx, 540 - w / 2, y, w, h, 22);
  ctx.fill();
  ctx.strokeStyle = '#f0c35a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff3c9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, 540, y + 13 + lh / 2 + i * lh));
  ctx.restore();
}

// chọn ngẫu nhiên một câu, tránh lặp lại câu vừa dùng
const lastLine = {};
function line(kind, vars = {}) {
  const list = (config.messages && config.messages[kind]) || DEFAULTS.messages[kind] || [];
  if (!list.length) return '';
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastLine[kind]) i = (i + 1) % list.length;
  lastLine[kind] = i;
  return list[i].replace(/\{name\}/g, vars.name || '').replace(/\{gift\}/g, vars.gift || 'quà');
}
let config = { ...DEFAULTS };

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

let slots = [];
let bg = null;

let buddhaImage = null;
let bgImage = null; // ảnh nền thiết kế (nếu có) thay cho cảnh vẽ bằng code
const FOOTER_Y = 1742;
function rebuildScene() {
  if (!slots.length) slots = buildSlots(config.maxCharacters);
  bg = document.createElement('canvas');
  bg.width = W;
  bg.height = H;
  const b = bg.getContext('2d');
  if (bgImage) {
    b.drawImage(bgImage, 0, 0, W, H);
    // dải nền dưới cùng để đặt bảng quà / bảng vàng
    const fg = b.createLinearGradient(0, FOOTER_Y, 0, H);
    fg.addColorStop(0, '#3a1408');
    fg.addColorStop(1, '#1a0703');
    b.fillStyle = fg;
    b.fillRect(0, FOOTER_Y, W, H - FOOTER_Y);
    const edge = b.createLinearGradient(0, FOOTER_Y - 40, 0, FOOTER_Y);
    edge.addColorStop(0, 'rgba(26,7,3,0)');
    edge.addColorStop(1, 'rgba(26,7,3,0.85)');
    b.fillStyle = edge;
    b.fillRect(0, FOOTER_Y - 40, W, 40);
    b.fillStyle = '#d9a441';
    b.fillRect(0, FOOTER_Y, W, 3);
  } else {
    drawStaticBackground(b, slots, buddhaImage);
  }
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Không tải được ảnh:', src);
      resolve(null);
    };
    img.src = src;
  });
}

// Ảnh tượng Phật riêng (tuỳ chọn): đặt file vào public/assets và ghi tên trong config.json
function loadBuddhaImage() {
  if (!config.buddhaImage) return;
  const img = new Image();
  img.onload = () => {
    buddhaImage = img;
    rebuildScene();
  };
  img.onerror = () => console.warn('Không tải được ảnh tượng Phật:', config.buddhaImage);
  img.src = config.buddhaImage;
}

// ------------------------------------------------------------------ tiện ích
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => t * t * (3 - 2 * t);

function normalizeVi(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isBowText(text) {
  const n = normalizeVi(text);
  const squashed = n.replace(/ /g, '');
  return config.bowKeywords.some((k) => {
    const kn = normalizeVi(k);
    return n.includes(kn) || squashed.includes(kn.replace(/ /g, ''));
  });
}

function speakName(name) {
  // bỏ emoji / ký tự lạ để giọng đọc không vấp
  const clean = String(name || '')
    .replace(/[\p{Extended_Pictographic}‍️]/gu, '')
    .replace(/[_.]+/g, ' ')
    .trim();
  return clean.slice(0, 24) || 'Phật tử';
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function truncate(text, max) {
  const arr = Array.from(text);
  return arr.length > max ? `${arr.slice(0, max - 1).join('')}…` : text;
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
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  if (img) {
    ctx.clip();
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(r * 1.1)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Array.from(user.name || '?')[0].toUpperCase(), x, y + 1);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,220,140,0.9)';
  ctx.lineWidth = Math.max(1.5, r * 0.15);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

// ------------------------------------------------------------------ nhân vật
const TAG_COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac', '#f06292'];

const characters = new Map(); // userId -> Character
const ENTRANCE = { x: 540, y: H + 60 };

class Character {
  constructor(user, slot) {
    this.user = { ...user };
    this.slot = slot;
    slot.occupant = this;
    const h = hashCode(user.id);
    this.look = lookFor(h);
    this.npc = Boolean(user.npc);
    if (user.monk) {
      // sư thầy / chú tiểu: áo nâu hoặc vàng, đầu cạo
      this.look = { ...this.look, hair: 'bald', robe: h % 2 ? ['#e8a748', '#c27a1e', '#7d4a0e'] : ['#a07a55', '#76553a', '#4a3322'] };
    }
    this.tagColor = TAG_COLORS[(h >> 7) % TAG_COLORS.length];
    this.x = ENTRANCE.x + rand(-40, 40);
    this.y = ENTRANCE.y;
    this.path = [
      { x: 540 + rand(-20, 20), y: slot.y + 30 },
      { x: slot.x, y: slot.y },
    ];
    this.state = 'walk'; // walk | kneel | leave
    this.kneelT = 0; // 0 đứng -> 1 quỳ
    this.walkPhase = rand(0, 6);
    this.breath = rand(0, 6);
    this.actions = []; // hàng đợi động tác
    this.action = null;
    this.bubble = null;
    this.halo = false;
    this.auraUntil = 0;
    this.alpha = 0;
    this.lastActive = performance.now();
    this.hearts = [];
    this.joinFlash = 1;
    if (this.npc) {
      // nhân vật nền (không tên): ngồi sẵn, hoặc đi vào từ cửa nếu walkIn
      this.joinFlash = 0;
      this.nextBow = performance.now() + rand(3000, 15000);
      if (!user.walkIn) {
        this.x = slot.x;
        this.y = slot.y;
        this.path = [];
        this.state = 'kneel';
        this.kneelT = 1;
      }
    }
  }

  get scale() {
    // to dần khi đi về phía camera
    return scaleAtY(this.y);
  }

  touch() {
    this.lastActive = performance.now();
  }

  queueAction(type, times = 1) {
    for (let i = 0; i < times; i++) this.actions.push(type);
    if (this.actions.length > 6) this.actions.splice(0, this.actions.length - 6);
  }

  say(text) {
    this.bubble = { lines: wrapText(text, 16, 3), until: performance.now() + 6000, born: performance.now() };
  }

  leave() {
    if (this.state === 'leave') return;
    this.state = 'leave';
    if (this.slot) this.slot.occupant = null;
    this.slot = null;
  }

  update(dt, now) {
    this.breath += dt * 1.6;
    if (this.npc && this.state !== 'leave') {
      this.lastActive = now;
      if (now > this.nextBow && !this.action) {
        this.queueAction(Math.random() < 0.6 ? 'bow' : 'raise');
        this.nextBow = now + rand(9000, 22000);
      }
    }
    if (this.state === 'leave') {
      this.alpha -= dt * 1.5;
      return this.alpha > 0;
    }
    this.alpha = Math.min(1, this.alpha + dt * 3);
    this.joinFlash = Math.max(0, this.joinFlash - dt * 0.6);

    if (this.state === 'walk') {
      const target = this.path[0];
      const speed = 330 * Math.max(0.6, this.scale);
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < speed * dt) {
        this.x = target.x;
        this.y = target.y;
        this.path.shift();
        if (!this.path.length) this.state = 'kneel';
      } else {
        this.x += (dx / d) * speed * dt;
        this.y += (dy / d) * speed * dt;
      }
      this.walkPhase += dt * 11;
      this.kneelT = Math.max(0, this.kneelT - dt * 4);
    } else if (this.state === 'kneel') {
      this.kneelT = Math.min(1, this.kneelT + dt * 3);
      if (!this.action && this.actions.length && this.kneelT >= 1) {
        const type = this.actions.shift();
        this.action = { type, t: 0, dur: type === 'bow' ? 1.5 : 1.1 };
      }
      if (this.action) {
        this.action.t += dt;
        if (this.action.t >= this.action.dur) this.action = null;
      }
    }

    for (const h of this.hearts) {
      h.t += dt;
      h.y -= dt * 90;
      h.x += Math.sin(h.t * 5 + h.seed) * dt * 30;
    }
    this.hearts = this.hearts.filter((h) => h.t < 1.6);
    if (this.bubble && now > this.bubble.until) this.bubble = null;
    return true;
  }

  // 0..1 mức cúi người / giơ tay hiện tại
  poseAmounts() {
    let bow = 0;
    let raise = 0;
    if (this.action) {
      const p = this.action.t / this.action.dur;
      if (this.action.type === 'bow') {
        // chắp tay -> cúi lạy sát đất -> ngồi dậy
        raise = p < 0.25 ? ease(p / 0.25) : p < 0.4 ? 1 - ease((p - 0.25) / 0.15) : 0;
        bow = p < 0.3 ? 0 : p < 0.55 ? ease((p - 0.3) / 0.25) : p < 0.75 ? 1 : 1 - ease((p - 0.75) / 0.25);
      } else if (this.action.type === 'raise') {
        raise = Math.sin(Math.PI * p);
        bow = Math.sin(Math.PI * p) * 0.25;
      }
    }
    return { bow, raise };
  }

  drawBody(now) {
    const s = this.scale;
    const { x, y } = this;
    ctx.save();
    ctx.globalAlpha = this.alpha;

    // hào quang của người đã tặng quà
    if (now < this.auraUntil) {
      const a = clamp((this.auraUntil - now) / 1500, 0, 1);
      const g = ctx.createRadialGradient(x, y - 50 * s, 5, x, y - 50 * s, 90 * s);
      g.addColorStop(0, `rgba(255,230,140,${0.7 * a})`);
      g.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 90 * s, y - 140 * s, 180 * s, 180 * s);
    }

    const top = drawCharacter(ctx, this, s, this.poseAmounts(), now);

    // vầng hào quang người theo dõi
    if (this.halo) {
      const pulse = 0.75 + Math.sin(now / 400 + this.breath) * 0.25;
      ctx.strokeStyle = `rgba(255,220,110,${0.9 * pulse})`;
      ctx.shadowColor = '#ffd54f';
      ctx.shadowBlur = 14 * s;
      ctx.lineWidth = 3.5 * s;
      ctx.beginPath();
      ctx.ellipse(x, top - 5 * s, 15 * s, 4.5 * s, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // tia sáng lúc mới vào
    if (this.joinFlash > 0 && this.state !== 'walk') {
      ctx.globalAlpha = this.joinFlash * this.alpha;
      const jg = ctx.createRadialGradient(x, y - 40 * s, 2, x, y - 40 * s, 70 * s);
      jg.addColorStop(0, 'rgba(255,255,220,0.8)');
      jg.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = jg;
      ctx.fillRect(x - 70 * s, y - 110 * s, 140 * s, 140 * s);
    }

    this.headTop = top;
    ctx.restore();
  }

  drawLabels(now) {
    if (this.npc) return;
    const s = this.scale;
    const ts = clamp(s * 1.05, 0.66, 1.1);
    const x = this.x;
    // so le thẻ tên giữa các cột cạnh nhau để đỡ chồng lên nhau
    const stagger = this.state !== 'walk' && this.slot && this.slot.dist % 2 === 1;
    const top = (this.headTop ?? this.y - 100 * s) - 10 * s - (stagger ? 34 * ts : 0);
    ctx.save();
    ctx.globalAlpha = this.alpha;

    // thẻ tên + avatar
    const name = truncate(this.user.name, s < 0.75 ? 9 : 12);
    const fs = Math.round(19 * ts);
    ctx.font = `600 ${fs}px system-ui, "Segoe UI", sans-serif`;
    const tw = ctx.measureText(name).width;
    const r = 13 * ts;
    const padX = 8 * ts;
    const w = r * 2 + padX * 2 + tw + 4 * ts;
    const h = r * 2 + 6 * ts;
    const tx = x - w / 2;
    const ty = top - h;
    ctx.fillStyle = 'rgba(20,12,8,0.62)';
    roundRect(ctx, tx, ty, w, h, h / 2);
    ctx.fill();
    if (this.halo) {
      ctx.strokeStyle = 'rgba(255,215,100,0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    drawAvatar(tx + 3 * ts + r, ty + h / 2, r, this.user, this.tagColor);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, tx + r * 2 + padX, ty + h / 2 + 1);

    // trái tim nhỏ bên dưới thẻ tên
    drawHeart(x, ty + h + 6 * ts, 5 * ts, '#ff6f91');

    // bong bóng bình luận
    if (this.bubble) {
      const life = (now - this.bubble.born) / 250;
      const pop = clamp(life, 0, 1);
      const fade = clamp((this.bubble.until - now) / 400, 0, 1);
      ctx.globalAlpha = this.alpha * fade;
      const bfs = Math.round(20 * ts);
      ctx.font = `600 ${bfs}px system-ui, "Segoe UI", sans-serif`;
      const lw = Math.max(...this.bubble.lines.map((l) => ctx.measureText(l).width));
      const bw = (lw + 22 * ts) * (0.7 + 0.3 * pop);
      const lh = bfs * 1.22;
      const bh = this.bubble.lines.length * lh + 14 * ts;
      const bx = x - bw / 2;
      const by = ty - bh - 12 * ts;
      ctx.fillStyle = 'rgba(30,18,10,0.82)';
      roundRect(ctx, bx, by, bw, bh, 12 * ts);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,214,130,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 7 * ts, by + bh);
      ctx.lineTo(x, by + bh + 9 * ts);
      ctx.lineTo(x + 7 * ts, by + bh);
      ctx.fillStyle = 'rgba(30,18,10,0.82)';
      ctx.fill();
      ctx.fillStyle = '#fff8e1';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      this.bubble.lines.forEach((l, i) => ctx.fillText(l, x, by + 7 * ts + i * lh));
    }

    // tim bay lên khi thả tim
    ctx.globalAlpha = this.alpha;
    for (const hrt of this.hearts) {
      const a = 1 - hrt.t / 1.6;
      ctx.globalAlpha = a * this.alpha;
      drawHeart(x + hrt.x, top + hrt.y, hrt.size * ts, hrt.color);
    }
    ctx.restore();
  }
}

function drawHeart(x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.6, y - size * 0.2, x - size * 0.7, y - size * 1.3, x, y - size * 0.45);
  ctx.bezierCurveTo(x + size * 0.7, y - size * 1.3, x + size * 1.6, y - size * 0.2, x, y + size * 0.9);
  ctx.fill();
}

const ROW_PREF = { 4: 0, 5: 1, 3: 2, 6: 3, 2: 4, 7: 5, 1: 6, 0: 7 };
function findFreeSlot() {
  // người thật được ngồi chỗ tốt nhất (gần tượng Phật); nếu nhân vật nền đang ngồi đó thì nhường chỗ
  // ưu tiên các hàng giữa: nhân vật to, thẻ tên dễ đọc, không bị che
  const order = [...slots].sort((x, y) => (ROW_PREF[x.row] ?? 9) - (ROW_PREF[y.row] ?? 9) || x.dist - y.dist);
  const best = order.find((s) => !s.occupant) || order.find((s) => s.occupant.npc && s.occupant.state !== 'leave');
  if (best) {
    if (best.occupant) best.occupant.leave();
    return best;
  }
  // hết chỗ: mời người im lặng lâu nhất (không phải người tặng quà/theo dõi) ra về
  let victim = null;
  for (const c of characters.values()) {
    if (c.state === 'leave' || !c.slot) continue;
    const vip = c.halo || c.user.coins > 0;
    const score = c.lastActive - (vip ? 10 * 60 * 1000 : 0);
    if (!victim || score < victim.score) victim = { c, score };
  }
  if (!victim) return null;
  const slot = victim.c.slot;
  victim.c.leave();
  return slot;
}

// Nhân vật nền: sư thầy / chú tiểu và Phật tử không tên ngồi sẵn cho chánh điện đông vui.
// Không mang tên, không tính vào số người lễ. Người xem thật vào sẽ được nhường chỗ đẹp,
// rồi thỉnh thoảng có Phật tử không tên khác đi vào ngồi chỗ trống phía sau.
let npcSeq = 0;
function addNpc(slot, { monk = false, walkIn = false } = {}) {
  const c = new Character({ id: `npc-${npcSeq++}`, name: '', npc: true, monk, walkIn }, slot);
  characters.set(c.user.id, c);
  return c;
}
function npcTarget() {
  const monks = clamp(Number(config.ambientMonks ?? 6), 0, 20);
  const crowd = clamp(Number(config.ambientCrowd ?? 30), 0, 200);
  return Math.min(monks + crowd, Math.max(0, slots.length - 4)); // luôn chừa vài chỗ trống
}
function spawnAmbientMonks() {
  const monks = clamp(Number(config.ambientMonks ?? 6), 0, 20);
  const total = npcTarget();
  if (!total) return;
  // sư thầy ngồi hai bên các hàng giữa
  const monkSlots = [...slots]
    .filter((sl) => !sl.occupant && sl.row >= 1 && sl.row <= 4)
    .sort((a, b) => b.dist - a.dist || a.row - b.row)
    .slice(0, Math.min(monks, total));
  monkSlots.forEach((slot) => addNpc(slot, { monk: true }));
  // Phật tử không tên: rải ngẫu nhiên, chừa hàng đầu cho người xem thật
  const rest = total - monkSlots.length;
  const free = slots.filter((sl) => !sl.occupant).map((sl) => ({ sl, k: (ROW_PREF[sl.row] ?? 9) <= 1 ? Math.random() + 0.6 : Math.random() }));
  free.sort((x, y) => x.k - y.k).slice(0, rest).forEach(({ sl }) => addNpc(sl));
}
// giữ số nhân vật nền: khi có người thật chiếm chỗ, thỉnh thoảng có người không tên đi vào chỗ trống phía sau
function refillCrowd() {
  const target = npcTarget();
  const npcs = [...characters.values()].filter((c) => c.npc && c.state !== 'leave').length;
  const free = slots.filter((sl) => !sl.occupant);
  if (npcs >= target || free.length <= 4) return;
  const slot = free[free.length - 1 - Math.floor(Math.random() * Math.min(6, free.length))];
  addNpc(slot, { walkIn: true });
}

let joinCount = 0;
const recentVisitors = []; // tên người mới vào, chưa được cảm ơn trong lời dẫn
function ensureCharacter(user, { greet = false } = {}) {
  if (!user || !user.id) return null;
  let c = characters.get(user.id);
  if (c && c.state !== 'leave') {
    if (user.avatar) c.user.avatar = user.avatar;
    if (user.name) c.user.name = user.name;
    c.touch();
    return c;
  }
  const slot = findFreeSlot();
  if (!slot) return null;
  c = new Character(user, slot);
  c.user.coins = 0;
  characters.set(user.id, c);
  joinCount++;
  if (!user.npc && user.name) {
    recentVisitors.push(user.name);
    if (recentVisitors.length > 12) recentVisitors.shift();
  }
  sfx.pop();
  addTicker(`🙏 ${truncate(user.name, 18)} đã vào chánh điện`);
  if (greet && config.voiceJoin) announce(line('join', { name: speakName(user.name) }), 0);
  c.queueAction('raise');
  return c;
}

// ------------------------------------------------------------------ hiệu ứng
const lotusBlooms = [];
const particles = [];
const bellRings = [];
const grandQueue = [];
let grand = null;
let haloBoost = 0;
let flash = 0;

function spawnPetals(x, y, n, spread = 200) {
  for (let i = 0; i < n; i++) {
    particles.push({
      kind: 'petal',
      x: x + rand(-spread, spread),
      y: y + rand(-spread * 0.4, spread * 0.2),
      vx: rand(-40, 40),
      vy: rand(30, 110),
      rot: rand(0, 6),
      vr: rand(-3, 3),
      size: rand(8, 15),
      life: rand(3, 5),
      t: 0,
      color: Math.random() < 0.7 ? '#f8a5c2' : '#ffe08a',
    });
  }
  if (particles.length > 500) particles.splice(0, particles.length - 500);
}

function spawnSparkles(x, y, n, spread = 40) {
  for (let i = 0; i < n; i++) {
    particles.push({
      kind: 'spark',
      x: x + rand(-spread, spread),
      y: y + rand(-spread, spread),
      vx: rand(-60, 60),
      vy: rand(-120, -20),
      size: rand(2, 5),
      life: rand(0.8, 1.6),
      t: 0,
      color: '#fff3b0',
    });
  }
}

function effectLotus(user) {
  const x = rand(260, 820);
  lotusBlooms.push({ x, y: bgImage ? rand(1112, 1150) : rand(1015, 1065), t: 0, life: 7, size: rand(34, 46), name: user?.name });
  if (lotusBlooms.length > 14) lotusBlooms.shift();
  spawnPetals(x, 960, 6, 60);
  sfx.chime();
}

function effectBell() {
  bellRings.push({ t: 0 });
  haloBoost = Math.max(haloBoost, 1);
  flash = Math.max(flash, 0.35);
  spawnPetals(540, 300, 25, 450);
  buddhaPulse(1.2);
  sfx.bell(196, 0.55, 5);
}

function effectGrand(user, giftName, count) {
  grandQueue.push({ user, giftName, count });
}

function startGrand(g) {
  grand = { ...g, t: 0, dur: 7 };
  haloBoost = 2;
  buddhaPulse(2);
  setTimeout(() => buddhaPulse(1.5), 1200);
  setTimeout(() => buddhaPulse(1.5), 2400);
  flash = 0.7;
  sfx.bell(130.8, 0.7, 7);
  setTimeout(() => sfx.bell(196, 0.5, 5), 900);
  announce(line('bigGift', { name: speakName(g.user.name), gift: g.giftName }), 2);
}

// ------------------------------------------------------------------ UI
const ticker = [];
function addTicker(text) {
  ticker.push({ text, t: 0 });
  if (ticker.length > 4) ticker.shift();
}

const giftToasts = []; // {key, user, giftName, count, until}
function showGiftToast(user, giftName, count, image) {
  const key = `${user.id}|${giftName}`;
  let t = giftToasts.find((g) => g.key === key);
  if (t) {
    t.count = Math.max(t.count, count);
    t.until = performance.now() + 4500;
  } else {
    t = { key, user, giftName, count, image, until: performance.now() + 4500, born: performance.now() };
    giftToasts.push(t);
    if (giftToasts.length > 3) giftToasts.shift();
  }
}

const board = new Map(); // userId -> {user, coins}
function addCoins(user, coins) {
  const e = board.get(user.id) || { user, coins: 0 };
  e.user = user;
  e.coins += coins;
  board.set(user.id, e);
}

// ------------------------------------------------------------------ xử lý sự kiện
let lastLikeSound = 0;

function handleEvent(ev) {
  if (!ev || !ev.type) return;
  const now = performance.now();
  switch (ev.type) {
    case 'join': {
      ensureCharacter(ev.user, { greet: true });
      break;
    }
    case 'chat': {
      const c = ensureCharacter(ev.user);
      if (!c) break;
      const text = String(ev.text || '').slice(0, 80);
      if (text.trim()) c.say(text);
      if (isBowText(text)) {
        c.queueAction('bow', config.bowCount);
        sfx.woodfish();
        buddhaPulse(0.6);
        spawnSparkles(c.x, c.y - 60 * c.scale, 6);
      }
      break;
    }
    case 'like': {
      const c = ensureCharacter(ev.user);
      if (!c) break;
      const n = clamp(Number(ev.count) || 1, 1, 6);
      for (let i = 0; i < n; i++) {
        c.hearts.push({
          x: rand(-14, 14), y: -10 - i * 12, t: -i * 0.12, seed: rand(0, 6), size: rand(6, 10),
          color: ['#ff4d6d', '#ff8fab', '#ffb3c6', '#ff6f91'][i % 4],
        });
      }
      if (c.hearts.length > 18) c.hearts.splice(0, c.hearts.length - 18);
      // mỗi lần thả tim nhân vật vái một cái (không dồn quá nhiều)
      if (!c.action && c.actions.length < 2) c.queueAction(Math.random() < 0.5 ? 'raise' : 'bow');
      if (now - lastLikeSound > 350) {
        sfx.woodfish();
        lastLikeSound = now;
      }
      break;
    }
    case 'follow': {
      const c = ensureCharacter(ev.user);
      if (!c) break;
      c.halo = true;
      c.queueAction('bow');
      buddhaPulse(0.8);
      spawnSparkles(c.x, c.y - 80 * c.scale, 18);
      addTicker(`✨ ${truncate(ev.user.name, 18)} đã theo dõi, nhận hào quang`);
      sfx.chime();
      announce(line('follow', { name: speakName(ev.user.name) }), 1);
      break;
    }
    case 'share': {
      const c = ensureCharacter(ev.user);
      if (c) c.queueAction('raise');
      addTicker(`📿 ${truncate(ev.user.name, 18)} đã chia sẻ phiên LIVE`);
      announce(line('share', { name: speakName(ev.user.name) }), 1);
      break;
    }
    case 'giftStreak': {
      showGiftToast(ev.user, ev.giftName, ev.repeatCount || 1, ev.image);
      break;
    }
    case 'gift': {
      const c = ensureCharacter(ev.user);
      const coins = Number(ev.coins) || (Number(ev.diamonds) || 1) * (Number(ev.repeatCount) || 1);
      const count = Number(ev.repeatCount) || 1;
      addCoins(ev.user, coins);
      showGiftToast(ev.user, ev.giftName, count, ev.image);
      if (c) {
        c.user.coins = (c.user.coins || 0) + coins;
        c.auraUntil = now + 8000 + Math.min(coins, 500) * 40;
        c.queueAction('bow');
        spawnSparkles(c.x, c.y - 60 * c.scale, 14);
      }
      const tiers = config.giftTiers;
      if (coins >= tiers.grand) {
        effectGrand(ev.user, ev.giftName, count);
      } else if (coins >= tiers.bell) {
        effectBell();
        announce(line('gift', { name: speakName(ev.user.name), gift: ev.giftName }), 1);
      } else {
        const n = Math.min(count, 5);
        for (let i = 0; i < n; i++) setTimeout(() => effectLotus(ev.user), i * 250);
        announce(line('gift', { name: speakName(ev.user.name), gift: ev.giftName }), 0);
      }
      break;
    }
    case 'voiceTest': {
      announce(line('join', { name: 'Phật tử thử nghiệm' }) || 'A Di Đà Phật', 2);
      break;
    }
    case 'reset': {
      for (const c of characters.values()) if (!c.npc) c.leave();
      board.clear();
      giftToasts.length = 0;
      break;
    }
    case 'status': {
      statusText = ev.status?.message || '';
      viewers = ev.status?.viewers || viewers;
      break;
    }
    default:
      break;
  }
}

let statusText = '';
let viewers = 0;

// ------------------------------------------------------------------ vẽ
const smoke = [];
const motes = Array.from({ length: 40 }, () => ({ x: rand(500, 1080), y: rand(100, 1100), s: rand(1, 2.5), v: rand(5, 15) }));

function drawLightRays(now) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.5 + Math.sin(now / 3000) * 0.15;
  for (let i = 0; i < 4; i++) {
    const g = ctx.createLinearGradient(1080, 0, 500, 1100);
    g.addColorStop(0, `rgba(255,230,170,${0.16 * pulse})`);
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    const off = i * 70;
    ctx.moveTo(1080 - off, 0);
    ctx.lineTo(1080 - off - 50, 0);
    ctx.lineTo(380 - off * 1.4, 1150);
    ctx.lineTo(560 - off * 1.2, 1150);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,240,200,0.5)';
  for (const m of motes) {
    m.y -= m.v * 0.016;
    m.x += Math.sin(now / 2000 + m.y) * 0.2;
    if (m.y < 80) m.y = 1100;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAltarLife(now, dt) {
  // ngọn nến (chỉ với cảnh vẽ bằng code; ảnh nền đã có nến)
  for (const c of bgImage ? [] : candlePositions()) {
    const f = 1 + Math.sin(now / 90 + c.x) * 0.12 + Math.sin(now / 37 + c.x) * 0.06;
    const glow = ctx.createRadialGradient(c.x, c.y - 10, 2, c.x, c.y - 10, 60);
    glow.addColorStop(0, 'rgba(255,200,90,0.55)');
    glow.addColorStop(1, 'rgba(255,150,40,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(c.x - 60, c.y - 70, 120, 120);
    ctx.fillStyle = '#ffcc4d';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - 26 * f);
    ctx.quadraticCurveTo(c.x + 8, c.y - 6, c.x, c.y);
    ctx.quadraticCurveTo(c.x - 8, c.y - 6, c.x, c.y - 26 * f);
    ctx.fill();
    ctx.fillStyle = '#fff6d5';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 6, 2.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // khói hương
  if (Math.random() < dt * 14) {
    smoke.push({ x: 540 + rand(-18, 18), y: bgImage ? 915 : 818, r: rand(6, 10), t: 0, life: rand(4, 6), seed: rand(0, 6) });
  }
  for (const p of smoke) {
    p.t += dt;
    p.y -= dt * 38;
    p.x += Math.sin(p.t * 1.3 + p.seed) * dt * 14;
    p.r += dt * 6;
  }
  while (smoke.length && smoke[0].t > smoke[0].life) smoke.shift();
  for (const p of smoke) {
    const a = 0.22 * (1 - p.t / p.life);
    ctx.fillStyle = `rgba(235,235,240,${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  if (config.buddhaLight !== false) drawBuddhaLight(now, dt);
}

// ------------------------------------------------------------------ hào quang tượng Phật
// Vẽ chồng lên tượng (ảnh nền hoặc tượng vẽ bằng code): tia sáng xoay chậm, vầng hào quang
// sau đầu, ánh sáng toả quanh thân, hạt vàng bay lên và sóng ánh sáng lan ra khi có lễ/quà.
const lightWaves = [];
const goldMotes = [];
let nextAutoWave = performance.now() + 6000;
function buddhaPulse(power = 1) {
  if (lightWaves.length > 6) lightWaves.shift();
  lightWaves.push({ t: 0, power: clamp(power, 0.3, 2) });
  haloBoost = Math.max(haloBoost, Math.min(2, 0.4 * power));
}
function buddhaGeo() {
  return bgImage ? { x: 540, head: 372, body: 600, base: 820, r: 148 } : { x: 540, head: 345, body: 560, base: 800, r: 135 };
}

function drawBuddhaLight(now, dt) {
  const B = buddhaGeo();
  const boost = haloBoost; // 0..2
  if (now > nextAutoWave) {
    buddhaPulse(0.5);
    nextAutoWave = now + rand(14000, 22000);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // 1. tia sáng xoay chậm toả ra từ đầu tượng
  const rot = now / 26000;
  const len = 560 + boost * 160;
  const rg = ctx.createRadialGradient(B.x, B.head, B.r * 0.6, B.x, B.head, len);
  const ra = 0.1 + Math.sin(now / 2200) * 0.025 + boost * 0.08;
  rg.addColorStop(0, `rgba(255,236,170,${ra})`);
  rg.addColorStop(0.45, `rgba(255,210,120,${ra * 0.45})`);
  rg.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = rg;
  ctx.beginPath();
  const N = 18;
  for (let i = 0; i < N; i++) {
    const a = rot + (i / N) * Math.PI * 2;
    const w = i % 2 ? 0.05 : 0.085;
    ctx.moveTo(B.x + Math.cos(a) * B.r * 0.7, B.head + Math.sin(a) * B.r * 0.7);
    ctx.lineTo(B.x + Math.cos(a - w) * len, B.head + Math.sin(a - w) * len);
    ctx.lineTo(B.x + Math.cos(a + w) * len, B.head + Math.sin(a + w) * len);
    ctx.closePath();
  }
  ctx.fill();
  // lớp tia thứ hai xoay ngược, mờ hơn
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = -rot * 1.6 + (i / 12) * Math.PI * 2 + 0.13;
    const w = 0.035;
    ctx.moveTo(B.x, B.head);
    ctx.lineTo(B.x + Math.cos(a - w) * len * 0.8, B.head + Math.sin(a - w) * len * 0.8);
    ctx.lineTo(B.x + Math.cos(a + w) * len * 0.8, B.head + Math.sin(a + w) * len * 0.8);
    ctx.closePath();
  }
  ctx.fill();
  ctx.globalAlpha = 1;

  // 2. vầng hào quang sau đầu, thở nhẹ
  const breathe = 0.5 + Math.sin(now / 1600) * 0.5;
  const hg = ctx.createRadialGradient(B.x, B.head, B.r * 0.2, B.x, B.head, B.r * (1.25 + boost * 0.15));
  hg.addColorStop(0, `rgba(255,248,215,${0.16 + breathe * 0.06 + boost * 0.12})`);
  hg.addColorStop(0.7, `rgba(255,220,140,${0.08 + boost * 0.06})`);
  hg.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(B.x, B.head, B.r * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,236,170,${0.22 + breathe * 0.15 + boost * 0.15})`;
  ctx.lineWidth = 3 + boost * 2;
  ctx.beginPath();
  ctx.arc(B.x, B.head, B.r * (1.02 + breathe * 0.02), 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = `rgba(255,250,220,${0.12 + boost * 0.1})`;
  ctx.beginPath();
  ctx.arc(B.x, B.head, B.r * 1.16, 0, Math.PI * 2);
  ctx.stroke();

  // 3. ánh sáng toả quanh thân
  ctx.save();
  ctx.translate(B.x, B.body);
  ctx.scale(1, 1.3);
  const bg2 = ctx.createRadialGradient(0, 0, 40, 0, 0, 300 + boost * 60);
  bg2.addColorStop(0, `rgba(255,225,150,${0.07 + boost * 0.07})`);
  bg2.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = bg2;
  ctx.beginPath();
  ctx.arc(0, 0, 360 + boost * 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. hạt vàng bay lên quanh tượng
  if (Math.random() < dt * (5 + boost * 20)) {
    goldMotes.push({
      x: B.x + rand(-260, 260), y: B.base + rand(-40, 20), vy: rand(30, 70), sway: rand(0, 6),
      size: rand(1.5, 3.5), t: 0, life: rand(4, 7),
    });
    if (goldMotes.length > 120) goldMotes.shift();
  }
  for (const m of goldMotes) {
    m.t += dt;
    m.y -= m.vy * dt;
    m.x += Math.sin(m.t * 1.2 + m.sway) * dt * 12;
    const a = Math.sin(clamp(m.t / m.life, 0, 1) * Math.PI);
    const tw = 0.6 + Math.sin(now / 150 + m.sway * 10) * 0.4;
    ctx.fillStyle = `rgba(255,232,150,${a * tw * 0.9})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,220,120,${a * tw * 0.2})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  while (goldMotes.length && goldMotes[0].t > goldMotes[0].life) goldMotes.shift();

  // 5. sóng ánh sáng lan ra
  for (const w of lightWaves) {
    w.t += dt;
    const k = w.t / 2.4;
    if (k > 1) continue;
    const r = B.r + ease(k) * (480 + w.power * 120);
    const a = (1 - k) * 0.35 * w.power;
    const wg = ctx.createRadialGradient(B.x, B.head, Math.max(0, r - 40), B.x, B.head, r + 10);
    wg.addColorStop(0, 'rgba(255,230,160,0)');
    wg.addColorStop(0.75, `rgba(255,236,180,${a})`);
    wg.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.arc(B.x, B.head, r + 10, 0, Math.PI * 2);
    ctx.fill();
  }
  while (lightWaves.length && lightWaves[0].t > 2.4) lightWaves.shift();
  ctx.restore();
}

// ------------------------------------------------------------------ lời dẫn tự động khi vắng
// Khi đã lâu không có câu nào được đọc, tự đọc xen kẽ: lời nhắn tịnh tâm, cảm ơn người mới vào,
// mời thả tim/theo dõi, và niệm Phật kèm tiếng mõ (cả chánh điện cùng lễ).
const NARRATION_ORDER = ['teaching', 'reminder', 'thanks', 'teaching', 'chant', 'reminder', 'thanks', 'teaching'];
let narrationStep = 0;
function narrate() {
  for (let tries = 0; tries < NARRATION_ORDER.length; tries++) {
    const kind = NARRATION_ORDER[narrationStep++ % NARRATION_ORDER.length];
    if (kind === 'thanks') {
      if (!recentVisitors.length) continue;
      const names = [...new Set(recentVisitors.splice(0))].slice(-4).map(speakName);
      const joined = names.length > 1 ? `${names.slice(0, -1).join(', ')} và ${names[names.length - 1]}` : names[0];
      announce(line('thanks', { name: joined }), 1);
      return;
    }
    if (kind === 'chant') {
      announce(line('chant'), 1);
      chantTogether();
      return;
    }
    const text = line(kind);
    if (!text) continue;
    if (kind === 'reminder') addTicker(`📢 ${truncate(text, 40)}`);
    announce(text, 1);
    if (kind === 'teaching') buddhaPulse(0.6);
    return;
  }
}

function chantTogether() {
  buddhaPulse(1);
  let i = 0;
  const tap = () => {
    sfx.woodfish();
    if (i % 3 === 0) {
      for (const c of characters.values()) if (c.state === 'kneel' && !c.action && c.actions.length < 2) c.queueAction('bow');
      buddhaPulse(0.5);
    }
    if (++i < 12) setTimeout(tap, 700);
    else sfx.chime();
  };
  setTimeout(tap, 400);
}

function drawBlooms(dt) {
  for (const b of lotusBlooms) {
    b.t += dt;
    const open = ease(clamp(b.t / 1.2, 0, 1));
    const fade = clamp((b.life - b.t) / 0.8, 0, 1);
    ctx.save();
    ctx.globalAlpha = fade;
    const g = ctx.createRadialGradient(b.x, b.y - 10, 2, b.x, b.y - 10, b.size * 1.8);
    g.addColorStop(0, 'rgba(255,220,240,0.6)');
    g.addColorStop(1, 'rgba(255,180,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(b.x - b.size * 2, b.y - b.size * 2, b.size * 4, b.size * 4);
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 4, b.size * 0.9, b.size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    drawLotus(ctx, b.x, b.y, b.size, open);
    ctx.restore();
  }
  while (lotusBlooms.length && lotusBlooms[0].t > lotusBlooms[0].life) lotusBlooms.shift();
}

function drawBells(dt) {
  for (const b of bellRings) {
    b.t += dt;
    const swing = Math.sin(b.t * 7) * Math.exp(-b.t * 0.8) * 0.35;
    const fade = clamp((4 - b.t) / 0.6, 0, 1);
    ctx.save();
    ctx.globalAlpha = fade;
    // sóng âm vàng
    for (let i = 0; i < 3; i++) {
      const r = ((b.t * 300 + i * 120) % 500);
      ctx.strokeStyle = `rgba(255,214,110,${0.5 * (1 - r / 500)})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(160, 330, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // quả chuông
    ctx.translate(160, 230);
    ctx.rotate(swing);
    const g = ctx.createLinearGradient(-60, 0, 60, 0);
    g.addColorStop(0, '#5b3a12');
    g.addColorStop(0.4, '#d9a441');
    g.addColorStop(0.6, '#f5d37a');
    g.addColorStop(1, '#5b3a12');
    ctx.fillStyle = '#3b1a08';
    ctx.fillRect(-4, -40, 8, 40);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.quadraticCurveTo(-34, 60, -62, 150);
    ctx.lineTo(62, 150);
    ctx.quadraticCurveTo(34, 60, 28, 0);
    ctx.quadraticCurveTo(0, -14, -28, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,40,10,0.6)';
    ctx.lineWidth = 3;
    for (const yy of [40, 90, 135]) {
      ctx.beginPath();
      ctx.moveTo(-30 - yy * 0.2, yy);
      ctx.lineTo(30 + yy * 0.2, yy);
      ctx.stroke();
    }
    ctx.restore();
  }
  while (bellRings.length && bellRings[0].t > 4) bellRings.shift();
}

function drawParticles(dt) {
  for (const p of particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'petal') {
      p.rot += p.vr * dt;
      p.vx += Math.sin(p.t * 2 + p.size) * 20 * dt;
    } else {
      p.vy += 80 * dt;
    }
    const a = clamp(1 - p.t / p.life, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.kind === 'petal') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].t > particles[i].life) particles.splice(i, 1);
}

function drawGrand(dt) {
  if (!grand && grandQueue.length) startGrand(grandQueue.shift());
  if (!grand) return;
  grand.t += dt;
  const t = grand.t;
  const inA = ease(clamp(t / 1, 0, 1));
  const outA = clamp((grand.dur - t) / 0.8, 0, 1);
  const a = inA * outA;
  if (t < 4 && Math.random() < 0.6) spawnPetals(540, 120, 3, 520);
  ctx.save();
  ctx.globalAlpha = a;
  // nền tối nhẹ + tia sáng toả tròn
  ctx.fillStyle = 'rgba(30,10,0,0.35)';
  ctx.fillRect(0, 0, W, H);
  ctx.translate(540, 1000);
  ctx.globalCompositeOperation = 'lighter';
  ctx.rotate(t * 0.25);
  for (let i = 0; i < 24; i++) {
    ctx.rotate((Math.PI * 2) / 24);
    ctx.fillStyle = 'rgba(255,215,120,0.12)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-40, -900);
    ctx.lineTo(40, -900);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = a;
  const rise = 1 - ease(clamp(t / 1.5, 0, 1));
  const lotusY = 1040 + rise * 300;
  const glow = ctx.createRadialGradient(540, lotusY - 60, 10, 540, lotusY - 60, 320);
  glow.addColorStop(0, 'rgba(255,240,200,0.9)');
  glow.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(140, lotusY - 400, 800, 700);
  drawLotus(ctx, 540, lotusY, 170, ease(clamp((t - 0.3) / 1.5, 0, 1)), { outer: '#ff7eb3' });

  // bảng tên người cúng dường
  const by = 560;
  const bw = 820;
  const bh = 190;
  const grd = ctx.createLinearGradient(0, by, 0, by + bh);
  grd.addColorStop(0, 'rgba(120,20,10,0.95)');
  grd.addColorStop(1, 'rgba(60,8,4,0.95)');
  ctx.fillStyle = grd;
  roundRect(ctx, 540 - bw / 2, by, bw, bh, 26);
  ctx.fill();
  ctx.strokeStyle = '#ffd36b';
  ctx.lineWidth = 5;
  ctx.stroke();
  drawAvatar(540 - bw / 2 + 95, by + bh / 2, 62, grand.user, '#c0392b');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '700 46px system-ui, "Segoe UI", sans-serif';
  ctx.fillText(truncate(grand.user.name, 16), 540 - bw / 2 + 180, by + 62);
  ctx.fillStyle = '#fff';
  ctx.font = '500 32px system-ui, "Segoe UI", sans-serif';
  ctx.fillText(truncate(`đã cúng dường ${grand.giftName} x${grand.count}`, 34), 540 - bw / 2 + 180, by + 120);
  ctx.restore();

  if (t > grand.dur) grand = null;
}

function drawUI(now) {
  // ảnh nền thiết kế đã có sẵn hoành phi và dòng hướng dẫn
  if (!bgImage) {
  // bảng hiệu (hoành phi)
  const pw = 640;
  const ph = 92;
  const px = 540 - pw / 2;
  const py = 120;
  const g = ctx.createLinearGradient(0, py, 0, py + ph);
  g.addColorStop(0, '#7a1208');
  g.addColorStop(1, '#3d0703');
  ctx.fillStyle = g;
  roundRect(ctx, px, py, pw, ph, 14);
  ctx.fill();
  ctx.strokeStyle = '#e9b84f';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(233,184,79,0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, px + 9, py + 9, pw - 18, ph - 18, 9);
  ctx.stroke();
  ctx.fillStyle = '#ffd97a';
  ctx.font = '800 46px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,200,80,0.8)';
  ctx.shadowBlur = 12;
  ctx.fillText(config.title, 540, py + ph / 2 + 3);
  ctx.shadowBlur = 0;

  // hướng dẫn trên bậc thềm
  ctx.fillStyle = 'rgba(25,8,3,0.65)';
  roundRect(ctx, 150, 1012, 780, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '600 25px system-ui, "Segoe UI", sans-serif';
  ctx.fillText(truncate(config.subtitle, 46), 540, 1035);
  }

  // số người đang lễ
  const present = [...characters.values()].filter((c) => c.state !== 'leave' && !c.npc).length;
  const cy = bgImage ? 262 : 236;
  ctx.fillStyle = bgImage ? 'rgba(25,8,3,0.92)' : 'rgba(25,8,3,0.6)';
  roundRect(ctx, 24, cy, 300, 50, 25);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '600 25px system-ui, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🙏 ${present} Phật tử đang lễ`, 44, cy + 26);
  const ty0 = cy + 64;

  // dòng thông báo người mới vào
  ticker.forEach((tk) => (tk.t += 1 / 60));
  while (ticker.length && ticker[0].t > 5) ticker.shift();
  ticker.slice(-3).forEach((tk, i) => {
    const a = clamp(Math.min(tk.t * 4, (5 - tk.t) * 2), 0, 1);
    ctx.globalAlpha = a;
    ctx.font = '600 24px system-ui, "Segoe UI", sans-serif';
    const tw = ctx.measureText(tk.text).width;
    ctx.fillStyle = 'rgba(25,8,3,0.6)';
    roundRect(ctx, 24, ty0 + i * 50, tw + 32, 42, 21);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText(tk.text, 40, ty0 + 22 + i * 50);
  });
  ctx.globalAlpha = 1;

  // thông báo quà (bên trái, giữa màn hình)
  for (let i = giftToasts.length - 1; i >= 0; i--) if (giftToasts[i].until < now) giftToasts.splice(i, 1);
  giftToasts.forEach((gt, i) => {
    const y = 1280 + i * 96;
    const slide = ease(clamp((now - gt.born) / 300, 0, 1));
    const x = -420 + slide * 444;
    ctx.fillStyle = 'rgba(40,10,5,0.75)';
    roundRect(ctx, x, y, 420, 80, 40);
    ctx.fill();
    drawAvatar(x + 40, y + 40, 32, gt.user, '#c0392b');
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.font = '700 26px system-ui, "Segoe UI", sans-serif';
    ctx.fillText(truncate(gt.user.name, 14), x + 84, y + 27);
    ctx.fillStyle = '#ffd97a';
    ctx.font = '500 22px system-ui, "Segoe UI", sans-serif';
    ctx.fillText(truncate(`đã gửi ${gt.giftName}`, 20), x + 84, y + 57);
    ctx.fillStyle = '#ffe082';
    ctx.font = 'italic 900 44px system-ui, sans-serif';
    ctx.fillText(`x${gt.count}`, x + 340, y + 42);
  });

  // bảng hướng dẫn quà
  const tiers = config.giftTiers;
  const boxes = [
    { label: `${tiers.lotus} XU`, desc: 'Hoa sen nở', icon: 'lotus' },
    { label: `${tiers.bell}+ XU`, desc: 'Chuông chùa', icon: 'bell' },
    { label: `${tiers.grand}+ XU`, desc: 'Đại liên hoa', icon: 'grand' },
  ];
  boxes.forEach((b, i) => {
    const x = 20 + i * 228;
    const y = 1760;
    ctx.fillStyle = bgImage ? 'rgba(48,14,6,0.97)' : 'rgba(40,10,5,0.72)';
    roundRect(ctx, x, y, 214, 120, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(233,184,79,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (b.icon === 'lotus') drawLotus(ctx, x + 50, y + 82, 30, 1);
    else if (b.icon === 'bell') {
      ctx.fillStyle = '#e0aa45';
      ctx.beginPath();
      ctx.moveTo(x + 40, y + 40);
      ctx.quadraticCurveTo(x + 36, y + 70, x + 26, y + 92);
      ctx.lineTo(x + 74, y + 92);
      ctx.quadraticCurveTo(x + 64, y + 70, x + 60, y + 40);
      ctx.closePath();
      ctx.fill();
    } else drawLotus(ctx, x + 50, y + 88, 40, 1, { outer: '#ff7eb3' });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd97a';
    ctx.font = '800 26px system-ui, "Segoe UI", sans-serif';
    ctx.fillText(b.label, x + 96, y + 44);
    ctx.fillStyle = '#fff';
    ctx.font = '500 20px system-ui, "Segoe UI", sans-serif';
    ctx.fillText(b.desc, x + 96, y + 80);
  });

  // bảng vàng tấm lòng thành
  const top = [...board.values()].sort((a, b) => b.coins - a.coins).slice(0, 3);
  const lx = 712;
  const ly = 1700;
  ctx.fillStyle = bgImage ? 'rgba(48,14,6,0.97)' : 'rgba(40,10,5,0.75)';
  roundRect(ctx, lx, ly, 350, 180, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(233,184,79,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd97a';
  ctx.font = '800 26px "Times New Roman", Georgia, serif';
  ctx.fillText('TẤM LÒNG THÀNH', lx + 175, ly + 28);
  ctx.textAlign = 'left';
  ctx.font = '600 22px system-ui, "Segoe UI", sans-serif';
  if (!top.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Chưa có ai cúng dường', lx + 24, ly + 90);
  }
  top.forEach((e, i) => {
    const y = ly + 70 + i * 40;
    ctx.fillStyle = ['#ffd54f', '#e0e0e0', '#ffab76'][i];
    ctx.fillText(`${i + 1}`, lx + 18, y);
    drawAvatar(lx + 56, y, 15, e.user, '#c0392b');
    ctx.fillStyle = '#fff';
    ctx.fillText(truncate(e.user.name, 12), lx + 80, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd97a';
    ctx.fillText(`${e.coins}`, lx + 334, y);
    ctx.textAlign = 'left';
  });

  if (params.has('debug') && statusText) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = '#0f0';
    ctx.font = '20px monospace';
    ctx.fillText(statusText, 10, H - 20);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  haloBoost = Math.max(0, haloBoost - dt * 0.25);
  flash = Math.max(0, flash - dt * 0.8);

  ctx.drawImage(bg, 0, 0);
  drawAltarLife(now, dt);
  drawBells(dt);
  drawBlooms(dt);

  // cập nhật + xoá người ra về / im lặng lâu
  const idleMs = (config.idleMinutes || 20) * 60 * 1000;
  for (const [id, c] of characters) {
    if (c.state !== 'leave' && now - c.lastActive > idleMs) c.leave();
    if (!c.update(dt, now)) characters.delete(id);
  }
  const list = [...characters.values()].sort((a, b) => a.y - b.y);
  for (const c of list) c.drawBody(now);
  drawLightRays(now);
  for (const c of list) c.drawLabels(now);
  drawParticles(dt);
  drawGrand(dt);
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,236,180,${flash * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawUI(now);
  drawCaption(now);
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

// ------------------------------------------------------------------ chế độ demo (tự sinh sự kiện)
import { randomUser, randomChat, randomGift } from './fake.js';

function startDemo() {
  const users = [];
  const tick = () => {
    const r = Math.random();
    if (users.length < 60 || r < 0.25) {
      const u = randomUser();
      users.push(u);
      handleEvent({ type: 'join', user: u });
    } else if (r < 0.6) {
      handleEvent({ type: 'chat', user: users[Math.floor(Math.random() * users.length)], text: randomChat() });
    } else if (r < 0.85) {
      handleEvent({ type: 'like', user: users[Math.floor(Math.random() * users.length)], count: 1 + Math.floor(Math.random() * 5) });
    } else if (r < 0.9) {
      handleEvent({ type: 'follow', user: users[Math.floor(Math.random() * users.length)] });
    } else {
      handleEvent({ type: 'gift', user: users[Math.floor(Math.random() * users.length)], ...randomGift() });
    }
    setTimeout(tick, users.length < 60 ? 150 : rand(300, 900));
  };
  tick();
}

// ------------------------------------------------------------------ khởi động
async function boot() {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) config = { ...DEFAULTS, ...(await res.json()) };
  } catch {
    /* chạy không có server */
  }
  config.giftTiers = { ...DEFAULTS.giftTiers, ...(config.giftTiers || {}) };
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  if (params.get('sound') === '0') config.sound = false;
  if (params.get('voice') === '0') config.voice = false;
  if (params.get('music') === '0') config.music = false;
  if (config.backgroundImage && params.get('bg') !== '0') {
    bgImage = await loadImage(config.backgroundImage);
    if (bgImage) useLayout('design');
  }
  sfx.setSoundEnabled(config.sound !== false);
  sfx.setVoiceEnabled(config.voice !== false);
  sfx.setVoiceEngine(params.get('engine') || config.voiceEngine);
  rebuildScene();
  loadBuddhaImage();
  const startMusic = () => {
    if (config.music !== false && config.sound !== false) {
      sfx.startMusic({ file: config.musicFile, volume: Number(config.musicVolume) || 0.25 });
    }
  };
  startMusic();
  window.addEventListener('pointerdown', () => {
    sfx.unlockAudio();
    startMusic();
  }, { once: true });
  // lời dẫn tự động khi vắng (đã gồm cả lời nhắc); nếu tắt thì dùng nhắc nhở định kỳ kiểu cũ
  if (config.narration !== false) {
    const gap = Math.max(15, Number(config.narrationSeconds) || 30) * 1000;
    setInterval(() => {
      if (performance.now() - lastAnnounce > gap) narrate();
    }, 3000);
  } else if (Number(config.reminderMinutes) > 0) {
    setInterval(() => {
      const text = line('reminder');
      if (!text) return;
      addTicker(`📢 ${truncate(text, 40)}`);
      announce(text, 1);
    }, Number(config.reminderMinutes) * 60 * 1000);
  }
  connectWs();
  spawnAmbientMonks();
  setInterval(refillCrowd, 9000);
  if (params.has('demo')) startDemo();
  requestAnimationFrame(frame);
}

window.TempleGame = { handleEvent, characters };
boot();
