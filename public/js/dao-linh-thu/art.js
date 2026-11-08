// Hình cho game Đảo Linh Thú: bầu trời, biển, hòn đảo bay (vẽ bằng code khi chưa có ảnh riêng),
// bộ tải ảnh tự xoá nền xanh lá (#00FF00) cho ảnh làm bằng công cụ AI, và vài hàm vẽ tiện ích.
export const W = 1080;
export const H = 1920;
export const TAU = Math.PI * 2;
export const FONT = '"Segoe UI", system-ui, sans-serif';

// Vị trí hòn đảo trên màn hình
export const ISLAND = { cx: 540, top: 1060, w: 940, grassH: 150 };

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
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

// ------------------------------------------------------------------ tải ảnh + xoá nền xanh
export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Ảnh AI thường có nền xanh lá đồng màu: nếu các góc ảnh là màu xanh lá thì xoá nền đó,
// làm mềm viền và khử ánh xanh dính trên mép. Ảnh PNG đã trong suốt thật thì giữ nguyên.
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
    const r = d[i];
    const gg = d[i + 1];
    const b = d[i + 2];
    const m = Math.max(r, b);
    const diff = gg - m;
    if (diff > 60 && gg > 110) d[i + 3] = 0;
    else if (diff > 18) {
      // mép: mờ dần và bớt xanh
      d[i + 3] = Math.round(d[i + 3] * Math.max(0, 1 - (diff - 18) / 42));
      d[i + 1] = m + Math.round(diff * 0.25);
    }
  }
  g.putImageData(data, 0, 0);
  return c;
}

// ------------------------------------------------------------------ bầu trời + biển
export function drawSky(g, storm = false) {
  const sky = g.createLinearGradient(0, 0, 0, H);
  if (storm) {
    sky.addColorStop(0, '#2b2f4a');
    sky.addColorStop(0.55, '#4b5878');
    sky.addColorStop(1, '#2c3d55');
  } else {
    sky.addColorStop(0, '#3aa6f0');
    sky.addColorStop(0.5, '#8fd6ff');
    sky.addColorStop(0.75, '#d9f3ff');
    sky.addColorStop(1, '#bfeaff');
  }
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  if (!storm) {
    // mặt trời
    const sun = g.createRadialGradient(860, 260, 10, 860, 260, 260);
    sun.addColorStop(0, 'rgba(255,250,210,1)');
    sun.addColorStop(0.25, 'rgba(255,240,170,0.6)');
    sun.addColorStop(1, 'rgba(255,240,170,0)');
    g.fillStyle = sun;
    g.fillRect(500, 0, 580, 600);
  }
  // biển phía dưới
  const seaTop = 1560;
  const sea = g.createLinearGradient(0, seaTop, 0, H);
  sea.addColorStop(0, storm ? '#33506e' : '#4fd1e0');
  sea.addColorStop(0.4, storm ? '#203a55' : '#18a3c4');
  sea.addColorStop(1, storm ? '#10223a' : '#0a6d9a');
  g.fillStyle = sea;
  g.fillRect(0, seaTop, W, H - seaTop);
  g.fillStyle = storm ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 70; i++) {
    const y = seaTop + 10 + hash(i) * (H - seaTop - 20);
    const x = hash(i + 50) * W;
    const len = 20 + hash(i + 9) * 60 * (y / H);
    g.fillRect(x, y, len, 3);
  }
  // đảo nhỏ xa xa
  g.fillStyle = storm ? '#2e4a3c' : '#5fbf7a';
  for (const [x, s] of [[120, 1], [960, 0.7]]) {
    g.beginPath();
    g.ellipse(x, seaTop + 8, 90 * s, 26 * s, 0, Math.PI, 0);
    g.fill();
  }
}

export function drawCloud(ctx, x, y, s, alpha = 0.9, dark = false) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = dark ? '#5d6684' : '#ffffff';
  const parts = [[0, 0, 60], [55, -25, 52], [105, 0, 58], [50, 18, 55], [-45, 14, 40], [150, 18, 38]];
  ctx.beginPath();
  for (const [dx, dy, r] of parts) {
    ctx.moveTo(x + dx * s + r * s, y + dy * s);
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
  }
  ctx.fill();
  ctx.globalAlpha = alpha * 0.35;
  ctx.fillStyle = dark ? '#3c4360' : '#c9e6f7';
  ctx.beginPath();
  ctx.ellipse(x + 50 * s, y + 42 * s, 120 * s, 22 * s, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ hòn đảo bay vẽ bằng code
// level 1..5: đảo to dần, nhiều hoa cỏ hơn. Vẽ vào canvas riêng 1080 x 1080, mặt cỏ ở y = 300.
export function drawIsland(level = 1) {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1080;
  const g = c.getContext('2d');
  const cx = 540;
  const top = 300;
  const hw = 420 + level * 12;
  // khối đất đá phía dưới
  g.save();
  const rock = g.createLinearGradient(0, top, 0, 1000);
  rock.addColorStop(0, '#9a6a3c');
  rock.addColorStop(0.4, '#7a4f2c');
  rock.addColorStop(1, '#4a2e1a');
  g.fillStyle = rock;
  g.beginPath();
  g.moveTo(cx - hw, top + 30);
  const pts = 14;
  for (let i = 0; i <= pts; i++) {
    const t = i / pts;
    const x = cx - hw + t * hw * 2;
    const depth = Math.sin(t * Math.PI);
    const y = top + 60 + depth * (480 + level * 25) + (hash(i * 3.1) - 0.5) * 70 * depth;
    g.lineTo(x, y);
  }
  g.lineTo(cx + hw, top + 30);
  g.closePath();
  g.fill();
  // vân đá
  g.strokeStyle = 'rgba(40,20,10,0.35)';
  g.lineWidth = 5;
  for (let i = 0; i < 18; i++) {
    const x = cx - hw * 0.8 + hash(i + 1) * hw * 1.6;
    const y = top + 90 + hash(i + 7) * 300;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (hash(i + 3) - 0.5) * 80, y + 40 + hash(i) * 60);
    g.stroke();
  }
  // đá sáng
  g.fillStyle = 'rgba(255,220,170,0.16)';
  for (let i = 0; i < 12; i++) {
    const x = cx - hw * 0.7 + hash(i + 20) * hw * 1.4;
    const y = top + 80 + hash(i + 40) * 260;
    g.beginPath();
    g.ellipse(x, y, 30 + hash(i) * 40, 14 + hash(i + 2) * 12, 0, 0, TAU);
    g.fill();
  }
  // rễ cây treo
  g.strokeStyle = '#5a3a1e';
  g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const x = cx - hw * 0.75 + (i / 8) * hw * 1.5;
    const len = 80 + hash(i + 11) * 160;
    g.lineWidth = 6 - hash(i) * 3;
    g.beginPath();
    g.moveTo(x, top + 120 + hash(i + 5) * 100);
    g.quadraticCurveTo(x + 20, top + 200 + len / 2, x - 10, top + 220 + len);
    g.stroke();
  }
  // thác nước bên phải
  const fx = cx + hw * 0.55;
  const fall = g.createLinearGradient(0, top + 20, 0, 1060);
  fall.addColorStop(0, 'rgba(180,240,255,0.95)');
  fall.addColorStop(1, 'rgba(180,240,255,0)');
  g.fillStyle = fall;
  g.beginPath();
  g.moveTo(fx - 26, top + 40);
  g.lineTo(fx + 26, top + 40);
  g.lineTo(fx + 50, 1060);
  g.lineTo(fx - 40, 1060);
  g.closePath();
  g.fill();
  g.restore();
  // mặt cỏ
  const grass = g.createLinearGradient(0, top - 40, 0, top + 90);
  grass.addColorStop(0, '#9be46a');
  grass.addColorStop(0.6, '#5cc24a');
  grass.addColorStop(1, '#3d9a35');
  g.fillStyle = '#2f7d2a';
  g.beginPath();
  g.ellipse(cx, top + 46, hw + 6, 104, 0, 0, TAU);
  g.fill();
  g.fillStyle = grass;
  g.beginPath();
  g.ellipse(cx, top + 30, hw, 100, 0, 0, TAU);
  g.fill();
  // mép cỏ rủ xuống
  g.fillStyle = '#3d9a35';
  for (let i = 0; i < 26; i++) {
    const a = Math.PI * (0.06 + 0.88 * (i / 25));
    const x = cx + Math.cos(a) * hw * -1;
    const y = top + 30 + Math.sin(a) * 100;
    g.beginPath();
    g.ellipse(x, y + 10, 26, 22 + hash(i) * 16, 0, 0, TAU);
    g.fill();
  }
  // vệt cỏ sáng
  g.fillStyle = 'rgba(255,255,255,0.12)';
  g.beginPath();
  g.ellipse(cx - 80, top + 5, hw * 0.6, 40, 0, 0, TAU);
  g.fill();
  // lối đi đất
  g.fillStyle = 'rgba(205,160,95,0.55)';
  g.beginPath();
  g.ellipse(cx, top + 50, 230, 42, 0, 0, TAU);
  g.fill();
  // hoa nhỏ ở mép (cấp càng cao càng nhiều)
  const colors = ['#ff6b9a', '#ffd34d', '#ffffff', '#b98cff', '#ff8a3d'];
  const n = 10 + level * 8;
  for (let i = 0; i < n; i++) {
    const a = hash(i * 7.7) * TAU;
    const rr = 0.72 + hash(i * 3.3) * 0.25;
    const x = cx + Math.cos(a) * hw * rr;
    const y = top + 30 + Math.sin(a) * 92 * rr;
    if (Math.abs(x - cx) < 260 && Math.abs(y - top - 40) < 60) continue;
    g.fillStyle = colors[i % colors.length];
    for (let p = 0; p < 5; p++) {
      g.beginPath();
      g.arc(x + Math.cos((p * TAU) / 5) * 6, y + Math.sin((p * TAU) / 5) * 6, 5, 0, TAU);
      g.fill();
    }
    g.fillStyle = '#ffe07a';
    g.beginPath();
    g.arc(x, y, 4, 0, TAU);
    g.fill();
  }
  if (level >= 5) {
    // đảo vàng: viền sáng lấp lánh
    g.strokeStyle = 'rgba(255,220,90,0.8)';
    g.lineWidth = 8;
    g.beginPath();
    g.ellipse(cx, top + 30, hw, 100, 0, 0, TAU);
    g.stroke();
  }
  return c;
}

// ------------------------------------------------------------------ vẽ tiện ích
export function pill(ctx, x, y, w, h, fill, stroke = null, lw = 3) {
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function panel(ctx, x, y, w, h, r = 26, fill = 'rgba(20,30,60,0.72)', stroke = 'rgba(255,255,255,0.35)') {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

// chữ có viền (dễ đọc trên nền sáng)
export function outlined(ctx, text, x, y, { size = 40, color = '#fff', stroke = '#1b2a4a', lw = 8, weight = 900, align = 'center', base = 'middle' } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function bar(ctx, x, y, w, h, frac, colorA, colorB, back = 'rgba(0,0,0,0.45)') {
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = back;
  ctx.fill();
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0.01) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);
    roundRectPath(ctx, x + 4, y + 4, Math.max(h - 8, (w - 8) * f), h - 8, (h - 8) / 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    roundRectPath(ctx, x + 8, y + 6, Math.max(h - 16, (w - 16) * f), (h - 8) * 0.35, (h - 8) * 0.2);
    ctx.fill();
  }
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.stroke();
}

// khối băng trong suốt quanh pet
export function drawIceBlock(ctx, x, y, w, h, t) {
  ctx.save();
  roundRectPath(ctx, x - w / 2, y - h, w, h, 30);
  const g = ctx.createLinearGradient(x - w / 2, y - h, x + w / 2, y);
  g.addColorStop(0, 'rgba(210,245,255,0.75)');
  g.addColorStop(0.5, 'rgba(140,215,255,0.45)');
  g.addColorStop(1, 'rgba(90,180,240,0.65)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + 30, y - h + 40);
  ctx.lineTo(x - w / 2 + 30, y - h * 0.45);
  ctx.moveTo(x - w / 2 + 55, y - h + 30);
  ctx.lineTo(x - w / 2 + 55, y - h + 90);
  ctx.stroke();
  // lấp lánh
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    const a = (Math.sin(t * 3 + i * 2) + 1) / 2;
    ctx.globalAlpha = a;
    const sx = x - w / 2 + hash(i + 1) * w;
    const sy = y - h + hash(i + 5) * h;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 12);
    ctx.lineTo(sx + 4, sy);
    ctx.lineTo(sx, sy + 12);
    ctx.lineTo(sx - 4, sy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// tia sét zig-zag
export function drawBolt(ctx, x1, y1, x2, y2, seed, width = 10) {
  ctx.save();
  ctx.strokeStyle = '#fff7a8';
  ctx.shadowColor = '#ffe14d';
  ctx.shadowBlur = 30;
  ctx.lineWidth = width;
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const n = 7;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    ctx.lineTo(x1 + (x2 - x1) * t + (hash(seed + i) - 0.5) * 120, y1 + (y2 - y1) * t);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.lineWidth = width * 0.4;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();
}
