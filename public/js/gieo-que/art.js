// Hình cho game Gieo Quẻ: sân miếu cổ ban đêm, Ông Từ, ống xăm, que xăm, đồng keo, tờ quẻ, lư hương,
// đèn lồng (vẽ bằng code khi chưa có ảnh riêng) và bộ tải ảnh tự xoá nền xanh lá #00FF00.
export const W = 1080;
export const H = 1920;
export const TAU = Math.PI * 2;
export const FONT = '"Segoe UI", system-ui, sans-serif';
export const SERIF = 'Georgia, "Times New Roman", serif';

// bố cục
export const ONG = { x: 330, bottom: 1480, w: 560 };
export const TABLE = { x: 120, y: 1250, w: 840, h: 90 };
export const OXAM = { x: 820, base: 1440, w: 150, h: 290 };
export const BOARD = { x: 716, y: 292, w: 344, rowH: 50 };
export const LUHUONG = { x: 150, y: 1225 };

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
export function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ------------------------------------------------------------------ ảnh + xoá nền xanh
export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
// Ảnh AI nền xanh lá đồng màu: nếu các góc là xanh lá thì xoá nền, làm mềm viền, khử ánh xanh
export function chromaKey(img) {
  if (!img) return null;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  let data;
  try {
    data = g.getImageData(0, 0, w, h);
  } catch {
    return img;
  }
  const d = data.data;
  const isGreen = (i) => d[i + 3] > 200 && d[i + 1] > 140 && d[i + 1] > d[i] * 1.5 && d[i + 1] > d[i + 2] * 1.5;
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
  if (corners.filter(isGreen).length < 2) return img;
  for (let i = 0; i < d.length; i += 4) {
    const m = Math.max(d[i], d[i + 2]);
    const diff = d[i + 1] - m;
    if (diff > 60 && d[i + 1] > 110) d[i + 3] = 0;
    else if (diff > 18) {
      d[i + 3] = Math.round(d[i + 3] * Math.max(0, 1 - (diff - 18) / 42));
      d[i + 1] = m + Math.round(diff * 0.25);
    }
  }
  g.putImageData(data, 0, 0);
  return c;
}

// ------------------------------------------------------------------ tiện ích chữ, khung
export function outlined(ctx, text, x, y, { size = 40, color = '#fff', stroke = '#2a0a06', lw = 8, weight = 800, align = 'center', base = 'middle', font = FONT, maxW } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y, maxW);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y, maxW);
}
export function panel(ctx, x, y, w, h, r = 22, fill = 'rgba(40,8,6,0.82)', stroke = 'rgba(232,190,90,0.9)') {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  roundRectPath(ctx, x + 7, y + 7, w - 14, h - 14, Math.max(4, r - 6));
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(232,190,90,0.35)';
  ctx.stroke();
}
export function bar(ctx, x, y, w, h, frac, a, b) {
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fill();
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0.01) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    roundRectPath(ctx, x + 4, y + 4, Math.max(h - 8, (w - 8) * f), h - 8, (h - 8) / 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    roundRectPath(ctx, x + 8, y + 6, Math.max(h - 16, (w - 16) * f), (h - 8) * 0.32, 6);
    ctx.fill();
  }
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,225,150,0.85)';
  ctx.stroke();
}

// ------------------------------------------------------------------ nền sân miếu
// mode: '' thường, 'vip' chính điện vàng, 'storm' mây tối giải hạn
export function drawTemple(g, mode = '') {
  const sky = g.createLinearGradient(0, 0, 0, 1300);
  if (mode === 'storm') {
    sky.addColorStop(0, '#05040f');
    sky.addColorStop(0.6, '#1b1636');
    sky.addColorStop(1, '#2b1f3e');
  } else if (mode === 'vip') {
    sky.addColorStop(0, '#2a1200');
    sky.addColorStop(0.55, '#6b3200');
    sky.addColorStop(1, '#a35a10');
  } else {
    sky.addColorStop(0, '#070a1f');
    sky.addColorStop(0.55, '#1a1838');
    sky.addColorStop(1, '#3a1d2c');
  }
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // sao
  if (mode !== 'storm') {
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(255,245,220,${0.25 + hash(i) * 0.6})`;
      g.beginPath();
      g.arc(hash(i + 3) * W, hash(i + 7) * 560, 0.8 + hash(i + 11) * 1.8, 0, TAU);
      g.fill();
    }
  }
  // trăng
  if (mode === '') {
    const mg = g.createRadialGradient(860, 170, 10, 860, 170, 190);
    mg.addColorStop(0, 'rgba(255,240,200,0.55)');
    mg.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = mg;
    g.fillRect(660, 0, 420, 400);
    g.fillStyle = '#fff1c9';
    g.beginPath();
    g.arc(860, 170, 62, 0, TAU);
    g.fill();
  }
  // mây tối
  if (mode === 'storm') {
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(${40 + i * 3},${32 + i * 2},${70 + i * 3},0.75)`;
      g.beginPath();
      g.ellipse(hash(i) * W, 120 + hash(i + 5) * 380, 220 + hash(i + 9) * 200, 70 + hash(i + 2) * 50, 0, 0, TAU);
      g.fill();
    }
  }
  // cây đa bên trái
  g.fillStyle = mode === 'vip' ? '#2a1404' : '#0b0f14';
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    g.arc(-30 + hash(i + 40) * 380, 260 + hash(i + 50) * 420, 90 + hash(i + 60) * 90, 0, TAU);
    g.fill();
  }
  g.fillRect(90, 520, 70, 600);
  for (let i = 0; i < 16; i++) {
    g.fillRect(40 + hash(i + 70) * 300, 560 + hash(i + 80) * 100, 3, 200 + hash(i + 90) * 260);
  }
  // mái đình
  const roofY = 560;
  const wall = mode === 'vip' ? '#7a2a06' : mode === 'storm' ? '#2c1220' : '#4a1410';
  g.fillStyle = wall;
  g.fillRect(170, roofY + 90, 820, 600);
  // mái ngói cong
  const roof = (y, x0, x1, hgt, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x0 - 60, y + hgt);
    g.quadraticCurveTo(x0 - 20, y + hgt - 10, x0 - 70, y + hgt - 70);
    g.quadraticCurveTo(x0 + 30, y + hgt - 30, x0 + 60, y);
    g.lineTo(x1 - 60, y);
    g.quadraticCurveTo(x1 - 30, y + hgt - 30, x1 + 70, y + hgt - 70);
    g.quadraticCurveTo(x1 + 20, y + hgt - 10, x1 + 60, y + hgt);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 2;
    for (let x = x0 + 40; x < x1 - 30; x += 22) {
      g.beginPath();
      g.moveTo(x, y + 6);
      g.lineTo(x + (x - (x0 + x1) / 2) * 0.08, y + hgt - 6);
      g.stroke();
    }
  };
  const tile = mode === 'vip' ? '#8a4a10' : mode === 'storm' ? '#231a2e' : '#3a1f1a';
  roof(roofY - 150, 300, 860, 110, tile);
  roof(roofY - 10, 190, 970, 120, tile);
  // nóc: lưỡng long chầu nguyệt
  g.fillStyle = mode === 'vip' ? '#ffd54f' : '#c79a3a';
  g.beginPath();
  g.arc(580, roofY - 172, 20, 0, TAU);
  g.fill();
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(580 + s * 30, roofY - 160);
    g.quadraticCurveTo(580 + s * 110, roofY - 210, 580 + s * 190, roofY - 150);
    g.lineTo(580 + s * 180, roofY - 145);
    g.quadraticCurveTo(580 + s * 110, roofY - 190, 580 + s * 30, roofY - 150);
    g.fill();
  }
  // hoành phi (để trống, không chữ)
  g.fillStyle = mode === 'vip' ? '#b8860b' : '#6d1a12';
  roundRectPath(g, 470, roofY + 130, 220, 60, 8);
  g.fill();
  g.strokeStyle = '#d9a63a';
  g.lineWidth = 4;
  g.stroke();
  // cột đỏ
  for (const x of [230, 420, 740, 930]) {
    const cg = g.createLinearGradient(x - 22, 0, x + 22, 0);
    const base = mode === 'vip' ? ['#7a2a00', '#d0601a', '#7a2a00'] : ['#4a0a08', '#9b1f16', '#4a0a08'];
    cg.addColorStop(0, base[0]);
    cg.addColorStop(0.5, base[1]);
    cg.addColorStop(1, base[2]);
    g.fillStyle = cg;
    g.fillRect(x - 22, roofY + 110, 44, 620);
  }
  // cửa võng + ban thờ phát sáng
  const glow = g.createRadialGradient(580, 980, 20, 580, 980, 330);
  glow.addColorStop(0, mode === 'storm' ? 'rgba(150,140,255,0.35)' : 'rgba(255,190,90,0.75)');
  glow.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = mode === 'vip' ? 'rgba(80,30,0,0.6)' : 'rgba(20,4,4,0.75)';
  g.fillRect(470, 730, 220, 420);
  g.fillStyle = glow;
  g.fillRect(250, 650, 660, 620);
  g.fillStyle = mode === 'vip' ? '#ffcc4d' : '#a5701e';
  roundRectPath(g, 500, 930, 160, 60, 8);
  g.fill();
  g.fillStyle = mode === 'vip' ? '#fff0a0' : '#ffd27a';
  for (const x of [520, 640]) {
    g.fillRect(x - 4, 890, 8, 40);
    g.beginPath();
    g.ellipse(x, 882, 6, 12, 0, 0, TAU);
    g.fill();
  }
  // sân gạch
  const floor = g.createLinearGradient(0, 1180, 0, H);
  floor.addColorStop(0, mode === 'storm' ? '#1f1a29' : mode === 'vip' ? '#5a2e0c' : '#2a1812');
  floor.addColorStop(1, '#0a0605');
  g.fillStyle = floor;
  g.fillRect(0, 1180, W, H - 1180);
  g.strokeStyle = 'rgba(255,200,140,0.07)';
  g.lineWidth = 2;
  for (let y = 1200; y < H; y += 70) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  for (let i = -10; i < 20; i++) {
    g.beginPath();
    g.moveTo(540 + i * 70, 1180);
    g.lineTo(540 + i * 160, H);
    g.stroke();
  }
  if (mode === 'vip') {
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (i - 6.5) * 0.12;
      g.strokeStyle = 'rgba(255,230,140,0.08)';
      g.lineWidth = 40;
      g.beginPath();
      g.moveTo(580, 700);
      g.lineTo(580 + Math.cos(a) * 1400, 700 + Math.sin(a) * 1400);
      g.stroke();
    }
  }
}

// ------------------------------------------------------------------ đèn lồng
export function drawLantern(ctx, x, y, s, t, seed = 0) {
  const sway = Math.sin(t * 0.0012 + seed) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -60 * s);
  ctx.lineTo(0, 0);
  ctx.stroke();
  const gl = ctx.createRadialGradient(0, 40 * s, 5, 0, 40 * s, 110 * s);
  gl.addColorStop(0, 'rgba(255,120,60,0.45)');
  gl.addColorStop(1, 'rgba(255,80,40,0)');
  ctx.fillStyle = gl;
  ctx.beginPath();
  ctx.arc(0, 40 * s, 110 * s, 0, TAU);
  ctx.fill();
  const lg = ctx.createRadialGradient(-10 * s, 30 * s, 5, 0, 40 * s, 45 * s);
  lg.addColorStop(0, '#ffb04a');
  lg.addColorStop(0.5, '#e8321e');
  lg.addColorStop(1, '#8a0f0a');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.ellipse(0, 40 * s, 38 * s, 44 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d9a63a';
  ctx.fillRect(-20 * s, 0, 40 * s, 6 * s);
  ctx.fillRect(-20 * s, 78 * s, 40 * s, 6 * s);
  ctx.strokeStyle = 'rgba(120,10,10,0.6)';
  ctx.lineWidth = 1.5;
  for (const k of [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.ellipse(0, 40 * s, 38 * s * Math.abs(k), 44 * s, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = '#e8321e';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 4 * s, 84 * s);
    ctx.lineTo(i * 5 * s, 112 * s);
    ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ Ông Từ (vẽ bằng code)
export function drawOngTu(ctx, { x = ONG.x, bottom = ONG.bottom, t = 0, speaking = false, blink = false, mode = '' }) {
  const s = 1.35;
  const by = bottom;
  const breathe = Math.sin(t * 0.002) * 3;
  ctx.save();
  ctx.translate(x, by + breathe * 0.3);
  ctx.scale(s, s);
  // thân áo the đen
  const rg = ctx.createLinearGradient(-170, 0, 170, 0);
  rg.addColorStop(0, '#0d0d14');
  rg.addColorStop(0.5, '#262636');
  rg.addColorStop(1, '#0d0d14');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(-180, 0);
  ctx.quadraticCurveTo(-170, -230, -95, -300);
  ctx.lineTo(95, -300);
  ctx.quadraticCurveTo(170, -230, 180, 0);
  ctx.closePath();
  ctx.fill();
  // vạt áo, cổ áo trắng
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -290);
  ctx.quadraticCurveTo(30, -150, 60, 0);
  ctx.stroke();
  ctx.fillStyle = '#efe6d2';
  ctx.beginPath();
  ctx.moveTo(-40, -300);
  ctx.lineTo(0, -255);
  ctx.lineTo(40, -300);
  ctx.lineTo(28, -306);
  ctx.lineTo(0, -272);
  ctx.lineTo(-28, -306);
  ctx.closePath();
  ctx.fill();
  // tay chắp trước ngực
  ctx.fillStyle = '#1a1a26';
  ctx.beginPath();
  ctx.ellipse(-60, -150, 48, 80, 0.5, 0, TAU);
  ctx.ellipse(60, -150, 48, 80, -0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d7a77f';
  ctx.beginPath();
  ctx.ellipse(-14, -196, 18, 30, 0.2, 0, TAU);
  ctx.ellipse(14, -196, 18, 30, -0.2, 0, TAU);
  ctx.fill();
  // cổ + mặt
  ctx.fillStyle = '#c99570';
  ctx.fillRect(-22, -335, 44, 40);
  const fg = ctx.createRadialGradient(-12, -400, 10, 0, -390, 80);
  fg.addColorStop(0, '#f0c9a2');
  fg.addColorStop(1, '#c99570');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.ellipse(0, -392, 58, 70, 0, 0, TAU);
  ctx.fill();
  // tai
  ctx.beginPath();
  ctx.ellipse(-58, -392, 10, 18, 0, 0, TAU);
  ctx.ellipse(58, -392, 10, 18, 0, 0, TAU);
  ctx.fill();
  // khăn xếp
  ctx.fillStyle = '#141420';
  ctx.beginPath();
  ctx.ellipse(0, -452, 66, 30, 0, Math.PI, TAU);
  ctx.lineTo(66, -440);
  ctx.quadraticCurveTo(0, -424, -66, -440);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(0, -448 + i * 5, 62, 22, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  // lông mày bạc
  ctx.strokeStyle = '#f2f2f2';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sgn * 12, -420);
    ctx.quadraticCurveTo(sgn * 30, -428, sgn * 44, -414);
    ctx.stroke();
  }
  // mắt hiền (cười)
  ctx.strokeStyle = '#3a2418';
  ctx.lineWidth = 4;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    if (blink) {
      ctx.moveTo(sgn * 18, -402);
      ctx.lineTo(sgn * 38, -402);
    } else ctx.arc(sgn * 28, -398, 10, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  // má hồng
  ctx.fillStyle = 'rgba(230,120,100,0.25)';
  ctx.beginPath();
  ctx.arc(-34, -378, 12, 0, TAU);
  ctx.arc(34, -378, 12, 0, TAU);
  ctx.fill();
  // mũi
  ctx.strokeStyle = 'rgba(120,70,40,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -396);
  ctx.quadraticCurveTo(8, -376, 0, -372);
  ctx.stroke();
  // râu bạc dài
  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.moveTo(-40, -362);
  ctx.quadraticCurveTo(-34, -300, 0, -250 + Math.sin(t * 0.003) * 2);
  ctx.quadraticCurveTo(34, -300, 40, -362);
  ctx.quadraticCurveTo(0, -340, -40, -362);
  ctx.fill();
  // ria
  ctx.beginPath();
  ctx.moveTo(-4, -364);
  ctx.quadraticCurveTo(-30, -368, -44, -350);
  ctx.quadraticCurveTo(-24, -358, -4, -356);
  ctx.moveTo(4, -364);
  ctx.quadraticCurveTo(30, -368, 44, -350);
  ctx.quadraticCurveTo(24, -358, 4, -356);
  ctx.fill();
  // miệng
  const open = speaking ? (Math.sin(t * 0.025) * 0.5 + 0.5) * 8 + 2 : 0;
  ctx.fillStyle = '#5a2a20';
  ctx.beginPath();
  ctx.ellipse(0, -352, 12, 2 + open * 0.7, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ ống xăm
export function drawOngXam(ctx, x, base, { shake = 0, t = 0, gold = false, sticks = 24, hideStick = -1, img = null }) {
  const { w, h } = OXAM;
  const rot = shake ? Math.sin(t * 0.045) * 0.16 * shake : 0;
  const jx = shake ? Math.sin(t * 0.09) * 6 * shake : 0;
  ctx.save();
  ctx.translate(x + jx, base);
  ctx.rotate(rot);
  if (gold) {
    const gl = ctx.createRadialGradient(0, -h / 2, 10, 0, -h / 2, h);
    gl.addColorStop(0, 'rgba(255,225,120,0.55)');
    gl.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(0, -h / 2, h, 0, TAU);
    ctx.fill();
  }
  if (img) {
    const iw = w * 1.5;
    const ih = (img.height / img.width) * iw;
    ctx.drawImage(img, -iw / 2, -ih, iw, ih);
    ctx.restore();
    return;
  }
  // que xăm thò lên
  for (let i = 0; i < sticks; i++) {
    if (i === hideStick) continue;
    const sx = -w / 2 + 14 + hash(i) * (w - 28);
    const lift = shake ? Math.max(0, Math.sin(t * 0.06 + i * 1.7)) * 18 * shake : 0;
    const top = -h - 70 - hash(i + 9) * 40 - lift;
    const ang = (sx / w) * 0.25;
    ctx.save();
    ctx.translate(sx, -h + 30);
    ctx.rotate(ang);
    ctx.fillStyle = gold ? '#f3d27a' : '#d9b77a';
    ctx.fillRect(-4, top + h - 30, 8, -top - h + 60);
    ctx.fillStyle = gold ? '#ff8a3a' : '#c62828';
    ctx.fillRect(-4, top + h - 30, 8, 22);
    ctx.restore();
  }
  // thân ống
  const bg = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  if (gold) {
    bg.addColorStop(0, '#7a4e00');
    bg.addColorStop(0.35, '#ffd860');
    bg.addColorStop(0.6, '#e0a820');
    bg.addColorStop(1, '#6a4000');
  } else {
    bg.addColorStop(0, '#4a0606');
    bg.addColorStop(0.35, '#d0281c');
    bg.addColorStop(0.6, '#a5160e');
    bg.addColorStop(1, '#3a0404');
  }
  ctx.fillStyle = bg;
  roundRectPath(ctx, -w / 2, -h, w, h, 16);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, -h, w / 2, 16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = gold ? '#fff2b0' : '#e8be5a';
  for (const y of [-h + 18, -h / 2, -26]) {
    ctx.fillRect(-w / 2, y - 6, w, 12);
  }
  // hoa văn tròn giữa ống
  ctx.strokeStyle = gold ? '#7a4e00' : '#e8be5a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -h * 0.72, 30, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -h * 0.28, 30, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-w / 2 + 18, -h + 10, 14, h - 24);
  ctx.restore();
}

// một que xăm (đứng dọc, tâm ở giữa)
export function drawStick(ctx, x, y, rot, num, { len = 420, glow = 0, gold = false, img = null } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (glow > 0) {
    const gl = ctx.createRadialGradient(0, 0, 10, 0, 0, len * 0.7);
    gl.addColorStop(0, `rgba(255,230,140,${0.55 * glow})`);
    gl.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(0, 0, len * 0.7, 0, TAU);
    ctx.fill();
  }
  const sw = len * 0.13;
  if (img) {
    const ih = len;
    const iw = (img.width / img.height) * ih;
    ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
  } else {
    const g = ctx.createLinearGradient(-sw / 2, 0, sw / 2, 0);
    g.addColorStop(0, gold ? '#b8860b' : '#a07a40');
    g.addColorStop(0.5, gold ? '#ffe08a' : '#f0d49a');
    g.addColorStop(1, gold ? '#b8860b' : '#a07a40');
    ctx.fillStyle = g;
    roundRectPath(ctx, -sw / 2, -len / 2, sw, len, sw / 2);
    ctx.fill();
    ctx.fillStyle = '#c62828';
    roundRectPath(ctx, -sw / 2, -len / 2, sw, len * 0.14, sw / 2);
    ctx.fill();
  }
  if (num) {
    ctx.fillStyle = '#5a0c06';
    ctx.font = `900 ${Math.round(sw * 0.62)}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const digits = String(num).split('');
    digits.forEach((d, i) => ctx.fillText(d, 0, -len * 0.05 + (i - (digits.length - 1) / 2) * sw * 0.7));
  }
  ctx.restore();
}

// đồng keo hình bán nguyệt: face 'sap' (mặt phẳng, đỏ tươi) hoặc 'ngua' (mặt cong, đỏ sẫm có vân)
export function drawKeo(ctx, x, y, size, rot, face, flip = 1, img = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(1, Math.max(0.06, Math.abs(flip)));
  if (img) {
    ctx.drawImage(img, -size, -size, size * 2, size * 2);
    ctx.restore();
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(6, 10, size, size * 0.55, 0, 0, TAU);
  ctx.fill();
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.quadraticCurveTo(-size * 0.9, -size * 0.75, 0, -size * 0.78);
    ctx.quadraticCurveTo(size * 0.9, -size * 0.75, size, 0);
    ctx.quadraticCurveTo(0, size * 0.42, -size, 0);
    ctx.closePath();
  };
  path();
  if (face === 'sap') {
    ctx.fillStyle = '#e53a2a';
    ctx.fill();
    ctx.strokeStyle = '#ffb3a0';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.3, -size * 0.4, size * 0.35, size * 0.12, -0.2, 0, TAU);
    ctx.fill();
  } else {
    const g = ctx.createRadialGradient(-size * 0.3, -size * 0.5, 4, 0, -size * 0.2, size * 1.1);
    g.addColorStop(0, '#d36a3a');
    g.addColorStop(1, '#5a1206');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,150,0.35)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.1, size * (1 - i * 0.2), size * (0.5 - i * 0.1), 0, Math.PI, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// tờ quẻ đỏ cuộn hai đầu; open 0..1
export function drawScroll(ctx, x, y, w, h, open, img = null) {
  const hh = Math.max(30, h * open);
  const cy = y + h / 2;
  const top = cy - hh / 2;
  ctx.save();
  if (img && open > 0.98) {
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    return;
  }
  const g = ctx.createLinearGradient(0, top, 0, top + hh);
  g.addColorStop(0, '#9e1810');
  g.addColorStop(0.5, '#c4261a');
  g.addColorStop(1, '#9e1810');
  ctx.fillStyle = g;
  ctx.fillRect(x + 20, top, w - 40, hh);
  ctx.strokeStyle = '#e8be5a';
  ctx.lineWidth = 5;
  ctx.strokeRect(x + 38, top + 14, w - 76, Math.max(0, hh - 28));
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 50, top + 26, w - 100, Math.max(0, hh - 52));
  // góc hoa văn
  ctx.fillStyle = '#e8be5a';
  for (const [cx2, cy2] of [[x + 50, top + 26], [x + w - 50, top + 26], [x + 50, top + hh - 26], [x + w - 50, top + hh - 26]]) {
    if (hh < 80) break;
    ctx.beginPath();
    ctx.arc(cx2, cy2, 9, 0, TAU);
    ctx.fill();
  }
  // trục gỗ
  for (const ry of [top, top + hh]) {
    const rg = ctx.createLinearGradient(0, ry - 16, 0, ry + 16);
    rg.addColorStop(0, '#3a1a08');
    rg.addColorStop(0.5, '#9a6a30');
    rg.addColorStop(1, '#3a1a08');
    ctx.fillStyle = rg;
    roundRectPath(ctx, x, ry - 16, w, 32, 14);
    ctx.fill();
    ctx.fillStyle = '#e8be5a';
    ctx.beginPath();
    ctx.arc(x + 6, ry, 18, 0, TAU);
    ctx.arc(x + w - 6, ry, 18, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// lư hương đồng + nén nhang (n nén, sáng rực khi full)
export function drawLuHuong(ctx, x, y, n, t, full = false, img = null) {
  ctx.save();
  ctx.translate(x, y);
  const k = Math.min(n, 10);
  for (let i = 0; i < k; i++) {
    const sx = -36 + (i % 5) * 18 + (i >= 5 ? 9 : 0);
    const top = -150 - (i >= 5 ? 14 : 0) - hash(i) * 12;
    ctx.strokeStyle = '#8a3a1a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, -40);
    ctx.lineTo(sx + (sx * 0.08), top);
    ctx.stroke();
    ctx.fillStyle = '#ff7a2a';
    ctx.beginPath();
    ctx.arc(sx + sx * 0.08, top, 3.5, 0, TAU);
    ctx.fill();
    // khói
    ctx.strokeStyle = 'rgba(220,220,230,0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let j = 0; j < 14; j++) {
      const yy = top - j * 12;
      const xx = sx + sx * 0.08 + Math.sin(t * 0.002 + j * 0.6 + i) * (3 + j * 1.4);
      if (j === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  if (full) {
    const gl = ctx.createRadialGradient(0, -60, 10, 0, -60, 170);
    gl.addColorStop(0, `rgba(255,210,110,${0.45 + 0.15 * Math.sin(t * 0.006)})`);
    gl.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(0, -60, 170, 0, TAU);
    ctx.fill();
  }
  if (img) {
    const iw = 170;
    const ih = (img.height / img.width) * iw;
    ctx.drawImage(img, -iw / 2, -ih + 10, iw, ih);
  } else {
    const g = ctx.createLinearGradient(-70, 0, 70, 0);
    g.addColorStop(0, '#4a3410');
    g.addColorStop(0.5, '#c79a3a');
    g.addColorStop(1, '#4a3410');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-72, -52);
    ctx.lineTo(72, -52);
    ctx.quadraticCurveTo(70, 0, 0, 2);
    ctx.quadraticCurveTo(-70, 0, -72, -52);
    ctx.fill();
    ctx.fillStyle = '#e8be5a';
    ctx.fillRect(-80, -60, 160, 12);
    ctx.fillStyle = '#3a2808';
    for (const s of [-1, 0, 1]) ctx.fillRect(s * 44 - 6, -2, 12, 22);
  }
  ctx.restore();
}

// lá bùa hộ mệnh nhỏ có tên
export function drawBua(ctx, x, y, w, h, name, t, img = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 0.0015) * 0.05);
  if (img) ctx.drawImage(img, -w / 2, 0, w, h);
  else {
    ctx.fillStyle = '#c62828';
    roundRectPath(ctx, -w / 2, 0, w, h * 0.82, 8);
    ctx.fill();
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 3;
    roundRectPath(ctx, -w / 2 + 6, 6, w - 12, h * 0.82 - 12, 6);
    ctx.stroke();
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 3 - 6, h * 0.82);
      ctx.lineTo(i * 4 - 8, h);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#ffe9a8';
  ctx.font = `800 ${Math.round(w * 0.16)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BÌNH AN', 0, h * 0.2, w - 16);
  const chars = Array.from(String(name || ''));
  const nm = chars.length > 9 ? `${chars.slice(0, 8).join('')}…` : chars.join('');
  ctx.font = `700 ${Math.round(w * 0.13)}px ${FONT}`;
  ctx.fillText(nm, 0, h * 0.5, w - 16);
  ctx.restore();
}
