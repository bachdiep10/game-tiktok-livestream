// Nhân vật chơi rồng rắn lên mây (vẽ bằng code, kiểu chibi).
// Toạ độ: (0, 0) là điểm chân chạm đất. Ngồi: mặt ghế ở y = -42.
import { roundRectPath as rr } from './sanDinh.js';

const drawTeaGlass = () => {};
const drawPipe = () => {};

const TAU = Math.PI * 2;

const SKINS = ['#f6d3b3', '#efc19b', '#e0a87e', '#c98d62', '#f3c9a5', '#d9a07a'];
const HAIRS = ['#1d1410', '#2b1d16', '#3b2a20', '#5a3d2b', '#1a1a1a', '#6b4a32', '#8a8a8a'];
const SHIRTS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#fb8c00', '#8e24aa', '#00897b', '#f5f5f5', '#6d4c41', '#3949ab', '#ec407a', '#26a69a', '#78909c'];
const SHORTS = ['#37474f', '#1565c0', '#4e342e', '#2e7d32', '#455a64', '#5d4037', '#263238'];
const STYLES = ['short', 'short', 'spiky', 'long', 'bun', 'bob', 'ponytail', 'cap', 'bald', 'side'];
const PATTERNS = ['plain', 'plain', 'stripe', 'tank', 'collar', 'plain', 'check'];
const SANDALS = ['#fdd835', '#e53935', '#1e88e5', '#ff7043', '#43a047'];

function hashStr(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function lookFor(id) {
  let h = hashStr(id);
  const take = (arr) => {
    const v = arr[h % arr.length];
    h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0;
    return v;
  };
  const shirt = take(SHIRTS);
  return {
    skin: take(SKINS),
    hair: take(HAIRS),
    style: take(STYLES),
    shirt,
    shirt2: take(SHIRTS),
    pattern: take(PATTERNS),
    shorts: take(SHORTS),
    sandal: take(SANDALS),
    glasses: h % 7 === 0,
    beard: h % 9 === 0,
    accent: shirt,
  };
}

// khách không tên ngồi sẵn: màu nhạt, không có bảng tên
export function crowdLook(i) {
  const l = lookFor(`crowd-${i}`);
  return { ...l, shirt: ['#b0a89a', '#9fa8a8', '#a89b8f', '#a4a8b5'][i % 4], shirt2: '#c9c2b5', pattern: 'plain', faded: true };
}

// ông thầy thuốc: khăn đóng, râu bạc, áo the nâu, quần trắng
export const DOCTOR_LOOK = {
  skin: '#e2b08a', hair: '#d8d8d8', style: 'bald', shirt: '#6d4c41', shirt2: '#8d6e63', pattern: 'collar',
  shorts: '#efe9dc', pants: '#efe9dc', sandal: '#3e2723', glasses: true, beard: false, longBeard: true,
};

function limb(ctx, x0, y0, x1, y1, bend, width, color) {
  // tay 2 khớp: khuỷu đẩy ra ngoài theo bend
  const mx = (x0 + x1) / 2 + bend;
  const my = (y0 + y1) / 2 + Math.abs(bend) * 0.25;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(mx, my);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  return [mx, my];
}

// vị trí hai bàn tay theo hành động. Trả về toạ độ so với vai.
function hands(p, up) {
  const t = p.t || 0;
  const k = p.k || 0;
  const lean = p.lean || 0;
  const mouth = [4 + lean * 6, -122 + up];
  const rest = { L: [-17, -60 + up], R: [17, -60 + up] };
  switch (p.act) {
    case 'drink':
    case 'lemon': {
      const sip = (k * 3) % 1 < 0.45;
      return { L: rest.L, R: sip ? [mouth[0] + 6, mouth[1] + 2] : [22, -86 + up], sip };
    }
    case 'candy':
    case 'seeds': {
      const bite = (k * (p.act === 'seeds' ? 6 : 3)) % 1 < 0.4;
      return { L: [-18, -78 + up], R: bite ? [mouth[0] + 4, mouth[1] + 4] : [20, -80 + up], sip: bite };
    }
    case 'pipe':
      return { L: [26, -92 + up], R: [30, -64 + up] };
    case 'talk': {
      const a = Math.sin(t * 0.012);
      const side = lean >= 0 ? 1 : -1;
      return { L: rest.L, R: [side * (26 + a * 8), -108 + up + Math.cos(t * 0.009) * 14] };
    }
    case 'chess':
      return { L: [lean * 30 - 12, -66 + up], R: [lean * 34 + 12, -70 + up + Math.max(0, Math.sin(t * 0.004)) * -14] };
    case 'paper':
      return { L: [-28, -96 + up], R: [28, -96 + up] };
    case 'toast':
      return { L: rest.L, R: [26, -158 + up + Math.sin(t * 0.02) * 4] };
    case 'wave':
      return { L: rest.L, R: [30 + Math.sin(t * 0.03) * 8, -160 + up] };
    case 'fan':
      return { L: rest.L, R: [22 + Math.sin(t * 0.03) * 12, -118 + up] };
    case 'pour':
      return { L: [-20, -76 + up], R: [44, -76 + up] };
    case 'cheer':
      return { L: [-30, -160 + up], R: [30, -160 + up] };
    case 'run':
      return { L: [-30, -120 + up + Math.sin((p.walk || 0) * 2) * 10], R: [30, -120 + up - Math.sin((p.walk || 0) * 2) * 10] };
    case 'point':
      return { L: [-18, -70 + up], R: [48, -128 + up] };
    case 'shoulder':
      // đặt tay lên vai bạn phía trước
      return { L: [-24, -112 + up + Math.sin((p.walk || 0) + Math.PI) * 3], R: [24, -112 + up + Math.sin(p.walk || 0) * 3] };
    case 'protect':
      // đầu rồng dang tay che chở cả đàn
      return { L: [-62, -118 + up + Math.sin(t * 0.02) * 6], R: [62, -118 + up - Math.sin(t * 0.02) * 6] };
    case 'grab':
      // thầy thuốc vồ
      return { L: [-40, -130 + up], R: [56, -122 + up + Math.sin(t * 0.03) * 8] };
    case 'sing':
      return { L: [-34, -150 + up + Math.sin(t * 0.012) * 8], R: [34, -150 + up - Math.sin(t * 0.012) * 8] };
    case 'sitSad':
      return { L: [-12, -78 + up], R: [12, -78 + up] };
    case 'walk':
      return { L: [-22, -66 + up + Math.sin((p.walk || 0) + Math.PI) * 4], R: [22, -66 + up + Math.sin(p.walk || 0) * 4] };
    default:
      return rest;
  }
}

function drawHair(ctx, L, hy, r, back) {
  ctx.fillStyle = L.hair;
  const s = L.style;
  if (back) {
    // phần tóc phía sau đầu
    if (s === 'long') {
      rr(ctx, -r - 3, hy - r * 0.4, r * 2 + 6, r * 1.9, r * 0.6);
      ctx.fill();
    } else if (s === 'ponytail') {
      ctx.beginPath();
      ctx.ellipse(r * 0.9, hy + r * 0.2, r * 0.3, r * 0.75, -0.3, 0, TAU);
      ctx.fill();
    } else if (s === 'bob') {
      rr(ctx, -r - 4, hy - r * 0.5, r * 2 + 8, r * 1.35, r * 0.5);
      ctx.fill();
    }
    return;
  }
  if (s === 'bald') {
    ctx.beginPath();
    ctx.ellipse(-r * 0.9, hy - r * 0.05, r * 0.18, r * 0.3, 0, 0, TAU);
    ctx.ellipse(r * 0.9, hy - r * 0.05, r * 0.18, r * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, hy - r * 0.65, r * 0.3, r * 0.14, -0.3, 0, TAU);
    ctx.fill();
    return;
  }
  if (s === 'cap') {
    ctx.fillStyle = L.shirt2;
    ctx.beginPath();
    ctx.arc(0, hy - r * 0.15, r * 1.02, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(-r * 1.02, hy - r * 0.2, r * 2.04, r * 0.12);
    ctx.beginPath();
    ctx.ellipse(r * 0.55, hy - r * 0.12, r * 0.85, r * 0.2, 0, 0, TAU);
    ctx.fill();
    return;
  }
  // tóc phía trên
  ctx.beginPath();
  ctx.arc(0, hy - r * 0.1, r * 1.04, Math.PI * 1.02, Math.PI * 1.98);
  ctx.quadraticCurveTo(r * 0.6, hy - r * 0.5, 0, hy - r * 0.45);
  ctx.quadraticCurveTo(-r * 0.6, hy - r * 0.5, -r * 1.04, hy - r * 0.05);
  ctx.closePath();
  ctx.fill();
  if (s === 'spiky') {
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.36 - r * 0.2, hy - r * 0.8);
      ctx.lineTo(i * r * 0.36, hy - r * 1.35);
      ctx.lineTo(i * r * 0.36 + r * 0.2, hy - r * 0.8);
      ctx.fill();
    }
  } else if (s === 'bun') {
    ctx.beginPath();
    ctx.arc(0, hy - r * 1.1, r * 0.38, 0, TAU);
    ctx.fill();
  } else if (s === 'side') {
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, hy - r * 0.62, r * 0.75, r * 0.32, -0.25, 0, TAU);
    ctx.fill();
  } else if (s === 'long' || s === 'bob') {
    ctx.fillRect(-r * 1.05, hy - r * 0.3, r * 0.3, r * 1.0);
    ctx.fillRect(r * 0.75, hy - r * 0.3, r * 0.3, r * 1.0);
  }
}

function drawFace(ctx, L, p, hy, r) {
  const blink = p.blink;
  const lean = (p.lean || 0) * 3;
  ctx.fillStyle = '#2a1a12';
  ctx.strokeStyle = '#2a1a12';
  ctx.lineWidth = 2.4;
  const ex = r * 0.36;
  const ey = hy + r * 0.05;
  if (p.dizzy) {
    // mắt xoáy sau khi rít điếu cày
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      for (let a = 0; a < TAU * 1.6; a += 0.3) {
        const rr2 = (a / (TAU * 1.6)) * r * 0.2;
        const xx = sx * ex + lean + Math.cos(a + (p.t || 0) * 0.02) * rr2;
        const yy = ey + Math.sin(a + (p.t || 0) * 0.02) * rr2;
        if (a === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
  } else if (blink || p.happy) {
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * ex + lean, ey + (p.happy ? 2 : 0), r * 0.14, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  } else {
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sx * ex + lean, ey, r * 0.09, r * 0.13, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx * ex + lean + 1, ey - 2, r * 0.035, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#2a1a12';
    }
  }
  // lông mày
  ctx.lineWidth = 2.2;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * ex - r * 0.14 + lean, ey - r * 0.3 - (p.raise ? 3 : 0));
    ctx.lineTo(sx * ex + r * 0.14 + lean, ey - r * 0.33 - (p.raise ? 3 : 0));
    ctx.stroke();
  }
  if (L.glasses) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * ex + lean, ey, r * 0.22, 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-ex + r * 0.22 + lean, ey);
    ctx.lineTo(ex - r * 0.22 + lean, ey);
    ctx.stroke();
  }
  if (p.shades) {
    ctx.fillStyle = '#111';
    rr(ctx, -ex - r * 0.3 + lean, ey - r * 0.16, r * 0.62, r * 0.3, 4);
    ctx.fill();
    rr(ctx, ex - r * 0.32 + lean, ey - r * 0.16, r * 0.62, r * 0.3, 4);
    ctx.fill();
    ctx.fillRect(-ex + lean, ey - r * 0.1, ex * 2, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(-ex - r * 0.2 + lean, ey - r * 0.1, r * 0.15, r * 0.06);
  }
  // má hồng
  ctx.fillStyle = 'rgba(255,120,120,0.28)';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * r * 0.58 + lean, hy + r * 0.36, r * 0.16, r * 0.09, 0, 0, TAU);
    ctx.fill();
  }
  if (p.scared) {
    ctx.fillStyle = '#7fd3ff';
    ctx.beginPath();
    ctx.moveTo(r * 0.85, hy - r * 0.55);
    ctx.quadraticCurveTo(r * 1.05, hy - r * 0.2, r * 0.85, hy - r * 0.1);
    ctx.quadraticCurveTo(r * 0.65, hy - r * 0.2, r * 0.85, hy - r * 0.55);
    ctx.fill();
  }
  if (L.longBeard) {
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath();
    ctx.moveTo(-r * 0.35 + lean, hy + r * 0.62);
    ctx.quadraticCurveTo(lean, hy + r * 2.0 + Math.sin((p.t || 0) * 0.004) * 3, r * 0.35 + lean, hy + r * 0.62);
    ctx.fill();
    ctx.strokeStyle = '#f2f2f2';
    ctx.lineWidth = 3;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * r * 0.12 + lean, hy + r * 0.42);
      ctx.quadraticCurveTo(sx * r * 0.6 + lean, hy + r * 0.45, sx * r * 0.7 + lean, hy + r * 0.85);
      ctx.stroke();
    }
  }
  if (L.beard) {
    ctx.fillStyle = 'rgba(40,25,15,0.35)';
    ctx.beginPath();
    ctx.ellipse(lean, hy + r * 0.72, r * 0.45, r * 0.2, 0, 0, Math.PI);
    ctx.fill();
  }
  // miệng
  const m = Math.max(0, Math.min(1, p.mouth || 0));
  const my = hy + r * 0.52;
  ctx.fillStyle = '#7a2a22';
  ctx.strokeStyle = '#5a1e18';
  ctx.lineWidth = 2.2;
  if (m > 0.08) {
    ctx.beginPath();
    ctx.ellipse(lean, my, r * 0.2, r * 0.05 + r * 0.2 * m, 0, 0, TAU);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(lean, my - r * 0.12, r * 0.2, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  }
}

function drawShirt(ctx, L, up) {
  const top = -114 + up;
  const h = 62;
  ctx.save();
  if (L.pattern === 'tank') {
    // áo ba lỗ
    ctx.fillStyle = L.skin;
    rr(ctx, -25, top, 50, 30, 12);
    ctx.fill();
    ctx.fillStyle = L.shirt;
    ctx.beginPath();
    ctx.moveTo(-16, top);
    ctx.lineTo(-9, top);
    ctx.quadraticCurveTo(0, top + 18, 9, top);
    ctx.lineTo(16, top);
    ctx.quadraticCurveTo(24, top + 18, 23, top + 30);
    ctx.lineTo(23, top + h - 10);
    ctx.quadraticCurveTo(23, top + h, 12, top + h);
    ctx.lineTo(-12, top + h);
    ctx.quadraticCurveTo(-23, top + h, -23, top + h - 10);
    ctx.lineTo(-23, top + 30);
    ctx.quadraticCurveTo(-24, top + 18, -16, top);
    ctx.fill();
  } else {
    ctx.fillStyle = L.shirt;
    rr(ctx, -25, top, 50, h, 14);
    ctx.fill();
    ctx.save();
    rr(ctx, -25, top, 50, h, 14);
    ctx.clip();
    if (L.pattern === 'stripe') {
      ctx.fillStyle = L.shirt2;
      for (let y = top + 6; y < top + h; y += 12) ctx.fillRect(-26, y, 52, 5);
    } else if (L.pattern === 'check') {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      for (let y = top; y < top + h; y += 12) ctx.fillRect(-26, y, 52, 5);
      for (let x = -26; x < 26; x += 12) ctx.fillRect(x, top, 5, h);
    } else if (L.pattern === 'flower') {
      for (let i = 0; i < 9; i++) {
        const fx = -18 + (i % 3) * 18 + (Math.floor(i / 3) % 2) * 8;
        const fy = top + 12 + Math.floor(i / 3) * 18;
        ctx.fillStyle = L.shirt2;
        for (let k = 0; k < 5; k++) {
          ctx.beginPath();
          ctx.arc(fx + Math.cos((k / 5) * TAU) * 3.5, fy + Math.sin((k / 5) * TAU) * 3.5, 2.6, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    if (L.pattern === 'collar') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(-12, top);
      ctx.lineTo(0, top + 14);
      ctx.lineTo(-4, top + 2);
      ctx.moveTo(12, top);
      ctx.lineTo(0, top + 14);
      ctx.lineTo(4, top + 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, top + 22 + i * 12, 1.8, 0, TAU);
        ctx.fill();
      }
    }
    // cổ áo
    ctx.fillStyle = L.skin;
    ctx.beginPath();
    ctx.moveTo(-8, top);
    ctx.quadraticCurveTo(0, top + 9, 8, top);
    ctx.fill();
  }
  ctx.restore();
}

// hat: 'helmet' (mũ cối khách quen) | 'crown'
export function drawPerson(ctx, L, p = {}) {
  const sit = p.sit !== false;
  const up = sit ? 0 : -14;
  const t = p.t || 0;
  ctx.save();
  if (p.alpha != null) ctx.globalAlpha *= p.alpha;
  if (L.faded) ctx.globalAlpha *= 0.85;
  // bóng
  if (!sit) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 7, 0, 0, TAU);
    ctx.fill();
  }
  const bodyBob = sit ? Math.sin(t * 0.003 + (p.seed || 0)) * 0.8 : -Math.abs(Math.sin(p.walk || 0)) * 3;
  // chân
  ctx.lineCap = 'round';
  if (sit) {
    ctx.fillStyle = L.shorts;
    rr(ctx, -25, -62, 50, 22, 9);
    ctx.fill();
    for (const sx of [-1, 1]) {
      ctx.strokeStyle = L.skin;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(sx * 15, -50);
      ctx.lineTo(sx * 21, -5);
      ctx.stroke();
      ctx.fillStyle = L.sandal;
      ctx.beginPath();
      ctx.ellipse(sx * 23, -2, 12, 5, 0, 0, TAU);
      ctx.fill();
    }
  } else {
    const w = p.walk || 0;
    for (const sx of [-1, 1]) {
      const lift = Math.max(0, Math.sin(w + (sx > 0 ? 0 : Math.PI))) * 10;
      ctx.strokeStyle = L.pants || L.skin;
      ctx.lineWidth = L.pants ? 14 : 12;
      ctx.beginPath();
      ctx.moveTo(sx * 10, -62);
      ctx.lineTo(sx * 11, -4 - lift);
      ctx.stroke();
      ctx.fillStyle = L.sandal;
      ctx.beginPath();
      ctx.ellipse(sx * 12, -2 - lift, 11, 5, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = L.shorts;
    rr(ctx, -23, -82, 46, 30, 9);
    ctx.fill();
  }
  ctx.translate(0, bodyBob);
  const hy = -146 + up;
  const r = 27;
  // tóc sau
  ctx.save();
  ctx.translate(0, 0);
  drawHair(ctx, L, hy, r, true);
  ctx.restore();
  drawShirt(ctx, L, up);
  // điếu cày đứng trước người, sau tay
  if (p.act === 'pipe') drawPipe(ctx, 30, -2 + (sit ? 0 : 0), 0.82, -0.05);
  const hp = hands(p, up);
  const sleeve = L.pattern === 'tank' ? L.skin : L.shirt;
  for (const [side, key] of [[-1, 'L'], [1, 'R']]) {
    const [hx, hy2] = hp[key];
    const sx = side * 23;
    const sy = -106 + up;
    const bend = side * (hy2 < sy ? 4 : 10);
    const [ex, ey] = limb(ctx, sx, sy, hx, hy2, bend, 12, L.skin);
    // tay áo ngắn
    ctx.strokeStyle = sleeve;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (ex - sx) * 0.55, sy + (ey - sy) * 0.55);
    ctx.stroke();
    ctx.fillStyle = L.skin;
    ctx.beginPath();
    ctx.arc(hx, hy2, 6.5, 0, TAU);
    ctx.fill();
  }
  // cổ + đầu
  ctx.save();
  const tilt = p.act === 'pipe' ? 0.22 : (p.lean || 0) * 0.12 + (p.dizzy ? Math.sin(t * 0.008) * 0.12 : 0);
  ctx.translate(0, hy + r);
  ctx.rotate(tilt);
  ctx.translate(0, -(hy + r));
  ctx.fillStyle = L.skin;
  ctx.fillRect(-7, hy + r - 8, 14, 12);
  ctx.beginPath();
  ctx.arc(0, hy, r, 0, TAU);
  ctx.fill();
  // tai
  ctx.beginPath();
  ctx.ellipse(-r, hy + 3, 5, 7, 0, 0, TAU);
  ctx.ellipse(r, hy + 3, 5, 7, 0, 0, TAU);
  ctx.fill();
  drawFace(ctx, L, p, hy, r);
  drawHair(ctx, L, hy, r, false);
  if (p.hat === 'helmet') {
    // mũ cối
    ctx.fillStyle = '#7c8a3a';
    ctx.beginPath();
    ctx.ellipse(0, hy - r * 0.35, r * 1.35, r * 0.28, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8f9d45';
    ctx.beginPath();
    ctx.arc(0, hy - r * 0.4, r * 0.98, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.arc(0, hy - r * 0.95, 4, 0, TAU);
    ctx.fill();
  } else if (p.hat === 'officer') {
    // mũ kê-pi (không phù hiệu)
    ctx.fillStyle = '#4e5b2c';
    ctx.beginPath();
    ctx.ellipse(0, hy - r * 0.62, r * 1.12, r * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a4420';
    ctx.fillRect(-r * 0.95, hy - r * 0.55, r * 1.9, r * 0.28);
    ctx.fillStyle = '#1f2412';
    ctx.beginPath();
    ctx.ellipse(0, hy - r * 0.26, r * 0.9, r * 0.16, 0, 0, Math.PI);
    ctx.fill();
  } else if (p.hat === 'khanDong') {
    // khăn đóng đen quấn nhiều lớp
    ctx.fillStyle = '#1f1a17';
    ctx.beginPath();
    ctx.ellipse(0, hy - r * 0.45, r * 1.08, r * 0.5, 0, Math.PI, TAU);
    ctx.fill();
    rr(ctx, -r * 1.06, hy - r * 0.62, r * 2.12, r * 0.42, r * 0.2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.98, hy - r * 0.55 + i * 5 - 4);
      ctx.quadraticCurveTo(0, hy - r * 0.72 + i * 5, r * 0.98, hy - r * 0.55 + i * 5 - 4);
      ctx.stroke();
    }
  } else if (p.hat === 'band') {
    // khăn đỏ buộc trán (người theo dõi kênh)
    ctx.fillStyle = '#e53935';
    rr(ctx, -r * 1.02, hy - r * 0.62, r * 2.04, r * 0.26, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.95, hy - r * 0.5);
    ctx.quadraticCurveTo(r * 1.5, hy - r * 0.3 + Math.sin(t * 0.01) * 4, r * 1.6, hy + r * 0.1);
    ctx.lineTo(r * 1.35, hy - r * 0.05);
    ctx.quadraticCurveTo(r * 1.3, hy - r * 0.35, r * 0.95, hy - r * 0.38);
    ctx.fill();
  } else if (p.hat === 'dragon') {
    drawDragonMask(ctx, hy, r, t);
  } else if (p.hat === 'crown') {
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    const cy = hy - r * 0.9;
    ctx.moveTo(-18, cy + 8);
    ctx.lineTo(-20, cy - 12);
    ctx.lineTo(-9, cy - 2);
    ctx.lineTo(0, cy - 16);
    ctx.lineTo(9, cy - 2);
    ctx.lineTo(20, cy - 12);
    ctx.lineTo(18, cy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(0, cy, 3, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // đồ cầm tay vẽ trước mặt
  const [rx, ry] = hp.R;
  const [lx, ly] = hp.L;
  switch (p.act) {
    case 'drink':
    case 'toast':
      drawTeaGlass(ctx, rx - 1, ry + 10, 1.05, p.fill ?? 0.8);
      break;
    case 'lemon':
      drawTeaGlass(ctx, rx - 1, ry + 10, 1.05, p.fill ?? 0.8, true);
      break;
    case 'candy':
      ctx.fillStyle = '#c58a3a';
      rr(ctx, rx - 9, ry - 6, 18, 11, 2);
      ctx.fill();
      ctx.fillStyle = '#ecc77f';
      for (let i = 0; i < 4; i++) ctx.fillRect(rx - 7 + i * 4, ry - 3, 2.5, 2.5);
      break;
    case 'seeds':
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath();
      ctx.ellipse(rx, ry - 3, 3, 5, 0.4, 0, TAU);
      ctx.fill();
      // vốc hạt ở tay trái
      ctx.fillStyle = '#3a3a3a';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(lx - 4 + (i % 3) * 4, ly - 4 - Math.floor(i / 3) * 3, 2.4, 3.6, i, 0, TAU);
        ctx.fill();
      }
      break;
    case 'paper': {
      ctx.save();
      ctx.fillStyle = '#f2efe6';
      ctx.translate(0, -94 + up);
      ctx.rotate(Math.sin(t * 0.002) * 0.03);
      rr(ctx, -40, -26, 80, 56, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#c62828';
      ctx.font = '900 11px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BÁO PHỐ', 0, -12);
      ctx.fillStyle = 'rgba(60,60,60,0.55)';
      for (let i = 0; i < 4; i++) ctx.fillRect(-32, -4 + i * 7, i === 3 ? 34 : 64, 3);
      ctx.fillStyle = 'rgba(80,120,160,0.5)';
      ctx.fillRect(10, -4, 22, 18);
      ctx.restore();
      ctx.fillStyle = L.skin;
      for (const [x, y] of [hp.L, hp.R]) {
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'fan': {
      // quạt nan
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(Math.sin(t * 0.03) * 0.5);
      ctx.fillStyle = '#e8c27a';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 26, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a07a3a';
      ctx.lineWidth = 1.2;
      for (let a = -0.85; a <= -0.15; a += 0.1) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a * Math.PI) * 26, Math.sin(a * Math.PI) * 26);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'pour':
      // bà chủ cầm cốc rót trà
      drawTeaGlass(ctx, rx, ry + 10, 1.05, p.fill ?? 0.4);
      break;
    default:
      break;
  }
  ctx.restore();
}

// mặt nạ đầu rồng đội trên đầu người dẫn đầu
export function drawDragonMask(ctx, hy, r, t = 0) {
  ctx.save();
  const y = hy - r * 0.95;
  // bờm
  ctx.fillStyle = '#ff9800';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.28 - r * 0.16, y + r * 0.2);
    ctx.lineTo(i * r * 0.32 + Math.sin(t * 0.01 + i) * 3, y - r * 0.75 - (3 - Math.abs(i)) * 3);
    ctx.lineTo(i * r * 0.28 + r * 0.16, y + r * 0.2);
    ctx.fill();
  }
  // sừng
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * r * 0.45, y - r * 0.1);
    ctx.quadraticCurveTo(sx * r * 0.7, y - r * 0.9, sx * r * 1.15, y - r * 1.05);
    ctx.stroke();
  }
  // đầu
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath();
  ctx.ellipse(0, y, r * 1.05, r * 0.55, 0, 0, TAU);
  ctx.fill();
  // mõm
  ctx.fillStyle = '#e53935';
  rr(ctx, -r * 0.62, y - r * 0.05, r * 1.24, r * 0.5, r * 0.22);
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.2 - 3, y + r * 0.42);
    ctx.lineTo(i * r * 0.2, y + r * 0.58);
    ctx.lineTo(i * r * 0.2 + 3, y + r * 0.42);
    ctx.fill();
  }
  // mắt
  for (const sx of [-1, 1]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(sx * r * 0.45, y - r * 0.2, r * 0.22, r * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(sx * r * 0.45 + Math.sin(t * 0.003) * 2, y - r * 0.2, r * 0.09, 0, TAU);
    ctx.fill();
  }
  // râu rồng
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 2.5;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * r * 0.55, y + r * 0.15);
    ctx.bezierCurveTo(sx * r * 1.2, y + r * 0.1, sx * r * 1.1, y + r * 0.7 + Math.sin(t * 0.008) * 4, sx * r * 1.6, y + r * 0.6);
    ctx.stroke();
  }
  ctx.restore();
}
