// Hình vẽ game Leo núi: bầu trời + dãy núi xa, sườn tuyết cuộn theo độ cao, đường mòn có dây cố định,
// các trại, đỉnh núi, người leo núi (nhìn từ sau lưng), trực thăng. Tự vẽ bằng canvas, không dùng ảnh có bản quyền.
// Mỗi phần đều thay được bằng ảnh riêng (thư mục public/assets/leo-nui), xem leoGame.js.
export const W = 1080;
export const H = 1920;
export const TAU = Math.PI * 2;
export const BASE_ALT = 5364;
export const SUMMIT_ALT = 8849;
export const CAMPS = [
  { alt: 5364, name: 'TRẠM GỐC', short: 'Trạm gốc', tents: 7 },
  { alt: 6065, name: 'TRẠI 1', short: 'Trại 1', tents: 4 },
  { alt: 6400, name: 'TRẠI 2', short: 'Trại 2', tents: 5 },
  { alt: 7162, name: 'TRẠI 3', short: 'Trại 3', tents: 3 },
  { alt: 7950, name: 'TRẠI 4', short: 'Trại 4', tents: 3 },
  { alt: 8849, name: 'ĐỈNH NÚI', short: 'Đỉnh', tents: 0 },
];
const FONT = '"Segoe UI", system-ui, sans-serif';

// số ngẫu nhiên cố định theo vị trí (để cảnh giống nhau mỗi lần cuộn qua)
export function hash(n, salt = 0) {
  let x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// đường mòn lượn trên sườn núi (x theo độ cao)
export function trailX(a) {
  const k = Math.max(0, Math.min(1, (SUMMIT_ALT - a) / 220));
  const wav = 200 * Math.sin(a / 92) + 60 * Math.sin(a / 33 + 1.3);
  return 520 + wav * k;
}
// mép trái/phải của sườn tuyết; gần đỉnh thì thu hẹp thành chóp núi
export function faceEdges(a) {
  const near = Math.max(0, Math.min(1, (SUMMIT_ALT - a) / 260));
  const k = near ** 0.75;
  const peak = trailX(SUMMIT_ALT);
  const l = 135 + 50 * Math.sin(a / 140) + 30 * Math.sin(a / 51 + 0.7);
  const r = 945 + 50 * Math.sin(a / 160 + 2) + 30 * Math.sin(a / 47 + 4);
  return [peak + (l - peak) * k, peak + (r - peak) * k];
}

export function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ------------------------------------------------------------------ bầu trời + núi xa (vẽ sẵn 1 lần)
export function drawSkyLayer(g, weather = 'clear') {
  const sky = g.createLinearGradient(0, 0, 0, H);
  if (weather === 'storm') {
    sky.addColorStop(0, '#5d6b7c');
    sky.addColorStop(1, '#c6ced8');
  } else {
    sky.addColorStop(0, '#1d4f9a');
    sky.addColorStop(0.45, '#5f9ad8');
    sky.addColorStop(1, '#d9e9f7');
  }
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // mặt trời
  if (weather !== 'storm') {
    const sun = g.createRadialGradient(860, 300, 10, 860, 300, 260);
    sun.addColorStop(0, 'rgba(255,255,240,0.95)');
    sun.addColorStop(0.15, 'rgba(255,250,220,0.55)');
    sun.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = sun;
    g.fillRect(500, 0, 580, 700);
  }
  // 3 lớp núi xa, càng gần càng đậm
  const layers = [
    { base: 900, amp: 260, col: weather === 'storm' ? '#9aa5b3' : '#a9c3e2', snow: 'rgba(255,255,255,0.75)', seed: 3 },
    { base: 1150, amp: 300, col: weather === 'storm' ? '#7f8a99' : '#7d9cc4', snow: 'rgba(255,255,255,0.85)', seed: 7 },
    { base: 1450, amp: 280, col: weather === 'storm' ? '#66717f' : '#5b7ba6', snow: 'rgba(250,252,255,0.9)', seed: 11 },
  ];
  for (const L of layers) {
    const pts = [];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * (W + 200) - 100;
      const y = L.base - (i % 2 === 0 ? 0.25 : 1) * L.amp * (0.55 + 0.45 * hash(i, L.seed));
      pts.push([x, y]);
    }
    g.fillStyle = L.col;
    g.beginPath();
    g.moveTo(-100, H);
    for (const [x, y] of pts) g.lineTo(x, y);
    g.lineTo(W + 100, H);
    g.closePath();
    g.fill();
    // mũ tuyết trên các chóp
    g.fillStyle = L.snow;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      if (pts[i - 1][1] < y || pts[i + 1][1] < y) continue;
      const [lx, ly] = pts[i - 1];
      const [rx, ry] = pts[i + 1];
      const t = 0.28;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rx - x) * t, y + (ry - y) * t);
      g.lineTo(x + (rx - x) * t * 0.55, y + (ry - y) * t * 0.8);
      g.lineTo(x, y + (ry - y) * t * 0.5);
      g.lineTo(x + (lx - x) * t * 0.5, y + (ly - y) * t * 0.85);
      g.lineTo(x + (lx - x) * t, y + (ly - y) * t);
      g.closePath();
      g.fill();
    }
  }
  // biển mây phía dưới
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 26; i++) {
    const x = hash(i, 21) * W;
    const y = 1500 + hash(i, 22) * 420;
    g.beginPath();
    g.ellipse(x, y, 140 + hash(i, 23) * 160, 40 + hash(i, 24) * 40, 0, 0, TAU);
    g.fill();
  }
}

// ------------------------------------------------------------------ sườn núi
// view: { camAlt, camY, px } -> y = camY - (a - camAlt) * px
export function makeView(camAlt, camY, px) {
  return {
    camAlt, camY, px,
    y: (a) => camY - (a - camAlt) * px,
    a: (y) => camAlt + (camY - y) / px,
  };
}

function rock(ctx, x, y, s, seed, snowy = true) {
  ctx.fillStyle = '#5b5f68';
  ctx.beginPath();
  const n = 7;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU;
    const r = s * (0.7 + 0.45 * hash(seed + i, 5));
    const px = x + Math.cos(ang) * r * 1.3;
    const py = y + Math.sin(ang) * r * 0.62;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7b808b';
  ctx.beginPath();
  ctx.ellipse(x - s * 0.25, y - s * 0.12, s * 0.7, s * 0.3, -0.2, 0, TAU);
  ctx.fill();
  if (snowy) {
    ctx.fillStyle = '#f7fbff';
    ctx.beginPath();
    ctx.ellipse(x - s * 0.1, y - s * 0.32, s * 0.95, s * 0.26, 0.05, Math.PI, TAU);
    ctx.fill();
  }
}

// vẽ toàn bộ sườn núi theo camera
export function drawSlope(ctx, v, { weather = 'clear', time = 0 } = {}) {
  const aTop = v.a(-60);
  const aBot = v.a(H + 60);
  const step = 6;
  // mép sườn: vách đá tối bên ngoài, tuyết bên trong
  const left = [];
  const right = [];
  for (let y = -60; y <= H + 60; y += step) {
    const a = v.a(y);
    if (a > SUMMIT_ALT) continue;
    const [l, r] = faceEdges(a);
    left.push([l, y]);
    right.push([r, y]);
  }
  if (left.length < 2) return;
  const topY = left[0][1];
  // vách đá (dải rộng hơn mép tuyết)
  ctx.fillStyle = weather === 'storm' ? '#3e4450' : '#454b57';
  ctx.beginPath();
  ctx.moveTo(left[0][0] - 10, topY - 8);
  for (const [x, y] of left) ctx.lineTo(x - 60 - 20 * hash(Math.round(v.a(y) / 30), 1), y + 30);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0] + 60 + 20 * hash(Math.round(v.a(right[i][1]) / 30), 2), right[i][1] + 30);
  ctx.closePath();
  ctx.fill();
  // sườn tuyết
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#c9d8ea');
  grad.addColorStop(0.18, '#eef4fb');
  grad.addColorStop(0.55, '#ffffff');
  grad.addColorStop(0.85, '#e3ecf7');
  grad.addColorStop(1, '#bccde3');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(left[0][0], topY);
  for (const [x, y] of left) ctx.lineTo(x, y);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  // dải bóng tuyết lượn sóng
  const k0 = Math.floor(aBot / 25);
  const k1 = Math.ceil(aTop / 25);
  for (let k = k0; k <= k1; k++) {
    const a = k * 25;
    const y = v.y(a);
    const r = hash(k, 3);
    if (r < 0.55) {
      ctx.fillStyle = `rgba(150,180,215,${0.1 + 0.12 * hash(k, 4)})`;
      ctx.beginPath();
      ctx.ellipse(120 + hash(k, 5) * 840, y, 150 + hash(k, 6) * 220, 10 + hash(k, 7) * 16, (hash(k, 8) - 0.5) * 0.4, 0, TAU);
      ctx.fill();
    }
    // vết nứt băng (xanh) ở vùng cao
    if (a > 5800 && hash(k, 9) < 0.12) {
      const cx = 160 + hash(k, 10) * 760;
      if (Math.abs(cx - trailX(a)) > 140) {
        ctx.strokeStyle = 'rgba(70,130,190,0.55)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - 90, y);
        ctx.quadraticCurveTo(cx, y + 10 * (hash(k, 11) - 0.5), cx + 90, y - 6);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(30,70,120,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }
  // đá nhô lên
  const r0 = Math.floor(aBot / 14);
  const r1 = Math.ceil(aTop / 14);
  for (let k = r0; k <= r1; k++) {
    if (hash(k, 12) > 0.3) continue;
    const a = k * 14;
    if (a > SUMMIT_ALT - 20) continue;
    const y = v.y(a);
    const [l, r] = faceEdges(a);
    const x = l + 20 + hash(k, 13) * (r - l - 40);
    if (Math.abs(x - trailX(a)) < 150) continue;
    rock(ctx, x, y, 14 + hash(k, 14) * 26, k, a > 5300);
  }
  // vùng đá vụn dưới trạm gốc (không có tuyết)
  if (aBot < BASE_ALT) {
    const yb = v.y(BASE_ALT - 40);
    const g2 = ctx.createLinearGradient(0, yb - 120, 0, yb + 200);
    g2.addColorStop(0, 'rgba(140,135,128,0)');
    g2.addColorStop(1, 'rgba(140,135,128,0.85)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, yb - 120, W, H);
  }
  ctx.restore();
  // viền tuyết sáng dọc mép
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.beginPath();
  right.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

// đường mòn + dây cố định đỏ + cọc mỗi 40 m
export function drawTrail(ctx, v) {
  const aTop = Math.min(SUMMIT_ALT, v.a(-40));
  const aBot = Math.max(BASE_ALT - 120, v.a(H + 40));
  if (aTop <= aBot) return;
  const pts = [];
  for (let a = aBot; a <= aTop; a += 3) pts.push([trailX(a), v.y(a)]);
  pts.push([trailX(aTop), v.y(aTop)]);
  // vệt dẫm tuyết
  ctx.strokeStyle = 'rgba(170,190,215,0.55)';
  ctx.lineWidth = 46;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.strokeStyle = 'rgba(205,218,235,0.9)';
  ctx.lineWidth = 30;
  ctx.stroke();
  // dây cố định
  ctx.strokeStyle = '#d0302a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + 26, y) : ctx.moveTo(x + 26, y)));
  ctx.stroke();
  for (let a = Math.ceil(aBot / 40) * 40; a <= aTop; a += 40) {
    const x = trailX(a) + 26;
    const y = v.y(a);
    ctx.fillStyle = '#3a3f4a';
    ctx.fillRect(x - 2, y - 16, 4, 18);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(x - 3, y - 18, 6, 5);
  }
}

// mốc độ cao bên đường mỗi 100 m
export function drawMarkers(ctx, v) {
  const aTop = Math.min(SUMMIT_ALT - 50, v.a(-40));
  const aBot = Math.max(BASE_ALT + 50, v.a(H + 40));
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let a = Math.ceil(aBot / 100) * 100; a <= aTop; a += 100) {
    if (CAMPS.some((c) => Math.abs(c.alt - a) < 60)) continue;
    const x = trailX(a) - 80;
    const y = v.y(a);
    ctx.fillStyle = 'rgba(30,45,70,0.55)';
    roundRectPath(ctx, x - 48, y - 15, 96, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(`${a.toLocaleString('vi-VN')} m`, x, y + 1);
  }
}

function tent(ctx, x, y, s, color) {
  ctx.fillStyle = 'rgba(60,80,110,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, s * 1.25, s * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - s * 1.1, y);
  ctx.quadraticCurveTo(x - s * 0.8, y - s * 1.05, x, y - s * 1.1);
  ctx.quadraticCurveTo(x + s * 0.8, y - s * 1.05, x + s * 1.1, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.1);
  ctx.quadraticCurveTo(x + s * 0.8, y - s * 1.05, x + s * 1.1, y);
  ctx.lineTo(x + s * 0.2, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b2f3a';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.28, y);
  ctx.lineTo(x, y - s * 0.62);
  ctx.lineTo(x + s * 0.28, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.9, y - s * 0.4);
  ctx.quadraticCurveTo(x, y - s * 1.45, x + s * 0.9, y - s * 0.4);
  ctx.stroke();
}

export function flag(ctx, x, y, h, color, t = 0, text = '') {
  ctx.strokeStyle = '#30343d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h);
  ctx.stroke();
  const fw = text ? Math.max(70, text.length * 13 + 24) : 54;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  for (let i = 0; i <= 10; i++) {
    const fx = x + (fw * i) / 10;
    ctx.lineTo(fx, y - h + Math.sin(t * 6 + i * 0.7) * 4 * (i / 10));
  }
  for (let i = 10; i >= 0; i--) {
    const fx = x + (fw * i) / 10;
    ctx.lineTo(fx, y - h + 34 + Math.sin(t * 6 + i * 0.7) * 4 * (i / 10));
  }
  ctx.closePath();
  ctx.fill();
  if (text) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 10, y - h + 17);
  }
}

const TENT_COLORS = ['#f2a516', '#e5482f', '#2f8fdd', '#3bb36b', '#f2a516', '#9b4fd1', '#e5482f'];
export function drawCamps(ctx, v, t, img = {}) {
  for (const c of CAMPS) {
    const y = v.y(c.alt);
    if (y < -260 || y > H + 200) continue;
    if (c.alt === SUMMIT_ALT) continue;
    const tx = trailX(c.alt);
    const side = tx > 540 ? -1 : 1;
    if (img.tent) {
      for (let i = 0; i < Math.min(4, c.tents); i++) {
        const x = tx + side * (150 + i * 105);
        const yy = y - 10 - (i % 2) * 34;
        const w = 150;
        ctx.drawImage(img.tent, x - w / 2, yy - w * (img.tent.height / img.tent.width), w, w * (img.tent.height / img.tent.width));
      }
    } else {
      for (let i = 0; i < c.tents; i++) {
        const x = tx + side * (130 + (i % 4) * 92 + (i >= 4 ? 46 : 0));
        const yy = y - (i >= 4 ? 70 : 0) - (i % 2) * 18;
        if (x < 40 || x > W - 40) continue;
        tent(ctx, x, yy, 38, TENT_COLORS[i % TENT_COLORS.length]);
      }
    }
    // biển tên trại
    const bx = tx - side * 150;
    ctx.fillStyle = '#5a3b22';
    ctx.fillRect(bx - 4, y - 70, 8, 74);
    ctx.fillStyle = 'rgba(20,40,70,0.88)';
    roundRectPath(ctx, bx - 92, y - 118, 184, 58, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffd34d';
    ctx.font = `bold 22px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.name, bx, y - 100);
    ctx.fillStyle = '#fff';
    ctx.font = `bold 19px ${FONT}`;
    ctx.fillText(`${c.alt.toLocaleString('vi-VN')} m`, bx, y - 77);
  }
}

// đỉnh núi: cờ nhiều màu + cờ tên người chinh phục mới nhất
export function drawSummit(ctx, v, t, winner = '', img = null) {
  const y = v.y(SUMMIT_ALT);
  if (y < -300 || y > H + 300) return;
  const x = trailX(SUMMIT_ALT);
  if (img) {
    // ảnh riêng: chân cột cờ nằm giữa mép dưới ảnh, đặt đúng chóp núi
    const w = 420;
    const h = w * (img.height / img.width);
    ctx.drawImage(img, x - w / 2, y - h + 12, w, h);
  } else {
    // dây cờ ngũ sắc giăng từ đỉnh
    const cols = ['#2f6fdd', '#ffffff', '#e5482f', '#3bb36b', '#f2c516'];
    for (const dir of [-1, 1]) {
      ctx.strokeStyle = 'rgba(60,60,70,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 70);
      ctx.quadraticCurveTo(x + dir * 120, y - 20, x + dir * 230, y + 60);
      ctx.stroke();
      for (let i = 1; i <= 9; i++) {
        const k = i / 10;
        const px = x + dir * 230 * k;
        const py = y - 70 + (130 * k) - Math.sin(k * Math.PI) * 30;
        ctx.fillStyle = cols[i % cols.length];
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.sin(t * 3 + i) * 0.15);
        ctx.fillRect(-9, 0, 18, 24);
        ctx.restore();
      }
    }
    flag(ctx, x, y + 6, 110, '#e53935', t);
  }
  ctx.fillStyle = 'rgba(15,30,60,0.85)';
  roundRectPath(ctx, x - 140, y + 26, 280, 62, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffd34d';
  ctx.font = `900 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ĐỈNH EVEREST', x, y + 46);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 21px ${FONT}`;
  ctx.fillText('8.849 m', x, y + 71);
  if (winner) flag(ctx, x + 70, y + 20, 150, '#ffb300', t + 1, winner);
}

// ------------------------------------------------------------------ người leo núi (nhìn từ sau lưng)
export const SUITS = [
  { jacket: '#e53935', pants: '#2b3245', pack: '#3d4a5c', helmet: '#ffca28' },
  { jacket: '#1e88e5', pants: '#263040', pack: '#c0662b', helmet: '#ffffff' },
  { jacket: '#43a047', pants: '#2d3340', pack: '#4a3f6b', helmet: '#ff7043' },
  { jacket: '#fb8c00', pants: '#283142', pack: '#2f5d8a', helmet: '#e0e0e0' },
  { jacket: '#8e24aa', pants: '#2a2f3c', pack: '#7a8a3a', helmet: '#ffd54f' },
  { jacket: '#fdd835', pants: '#303848', pack: '#b23b3b', helmet: '#1e88e5' },
  { jacket: '#00acc1', pants: '#2b3245', pack: '#d07a2a', helmet: '#f06292' },
  { jacket: '#d81b60', pants: '#252b38', pack: '#45617a', helmet: '#ffffff' },
];

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// phase: pha bước chân (radian), moving: đang đi, s: tỉ lệ (1 = cao khoảng 120px)
export function drawClimber(ctx, x, y, s, suit, phase = 0, moving = false, img = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // bóng
  ctx.fillStyle = 'rgba(60,80,120,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 9, 0, 0, TAU);
  ctx.fill();
  const sw = moving ? Math.sin(phase) : 0;
  const bob = moving ? Math.abs(Math.cos(phase)) * 3 : 0;
  if (img) {
    const h = 128;
    const w = h * (img.width / img.height);
    ctx.rotate(sw * 0.05);
    ctx.drawImage(img, -w / 2, -h - bob, w, h);
    ctx.restore();
    return;
  }
  ctx.translate(0, -bob);
  // chân
  for (const side of [-1, 1]) {
    const k = side * sw;
    const lift = Math.max(0, k) * 10;
    ctx.fillStyle = suit.pants;
    roundRectPath(ctx, side * 11 - 8, -50 - lift * 0.3, 16, 40 - lift * 0.5, 7);
    ctx.fill();
    // giày
    ctx.fillStyle = '#20232b';
    roundRectPath(ctx, side * 11 - 10, -14 - lift, 20, 14, 5);
    ctx.fill();
    ctx.fillStyle = '#9aa3b0';
    ctx.fillRect(side * 11 - 9, -3 - lift, 18, 3);
  }
  // gậy leo núi
  ctx.strokeStyle = '#4a4f5a';
  ctx.lineWidth = 3;
  for (const side of [-1, 1]) {
    const k = side * sw;
    ctx.beginPath();
    ctx.moveTo(side * 30, -70);
    ctx.lineTo(side * (36 + k * 6), -4 - Math.max(0, -k) * 6);
    ctx.stroke();
  }
  // tay
  ctx.fillStyle = shade(suit.jacket, 0.85);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 24, -94);
    ctx.rotate(side * (0.25 + sw * side * 0.15));
    roundRectPath(ctx, -8, 0, 16, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#20232b';
    ctx.beginPath();
    ctx.arc(0, 34, 7, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = shade(suit.jacket, 0.85);
  }
  // thân áo phao
  ctx.fillStyle = suit.jacket;
  roundRectPath(ctx, -26, -104, 52, 58, 18);
  ctx.fill();
  ctx.strokeStyle = shade(suit.jacket, 0.75);
  ctx.lineWidth = 2;
  for (const yy of [-88, -72, -58]) {
    ctx.beginPath();
    ctx.moveTo(-24, yy);
    ctx.quadraticCurveTo(0, yy + 4, 24, yy);
    ctx.stroke();
  }
  // ba lô
  ctx.fillStyle = suit.pack;
  roundRectPath(ctx, -20, -112, 40, 52, 9);
  ctx.fill();
  ctx.fillStyle = shade(suit.pack, 1.25);
  roundRectPath(ctx, -15, -86, 30, 18, 5);
  ctx.fill();
  // cuộn đệm trên ba lô
  ctx.fillStyle = '#e8b04a';
  roundRectPath(ctx, -22, -122, 44, 14, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.moveTo(-8, -122);
  ctx.lineTo(-8, -108);
  ctx.moveTo(8, -122);
  ctx.lineTo(8, -108);
  ctx.stroke();
  // bình oxy
  ctx.fillStyle = '#d84315';
  roundRectPath(ctx, 14, -118, 9, 34, 4);
  ctx.fill();
  // đầu + mũ bảo hiểm
  ctx.fillStyle = suit.helmet;
  ctx.beginPath();
  ctx.arc(0, -128, 16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.arc(4, -126, 14, -0.5, 1.6);
  ctx.fill();
  ctx.fillStyle = '#20232b';
  ctx.fillRect(-16, -128, 32, 5);
  ctx.restore();
}

// trực thăng cứu hộ kéo người leo bằng dây
export function drawHelicopter(ctx, x, y, t, img = null) {
  ctx.save();
  ctx.translate(x, y);
  if (img) {
    const w = 300;
    const h = w * (img.height / img.width);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return;
  }
  // đuôi
  ctx.fillStyle = '#c62828';
  ctx.beginPath();
  ctx.moveTo(40, -8);
  ctx.lineTo(170, -18);
  ctx.lineTo(170, -6);
  ctx.lineTo(40, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8e1c1c';
  ctx.fillRect(160, -44, 12, 40);
  // cánh quạt đuôi
  ctx.strokeStyle = 'rgba(40,40,40,0.6)';
  ctx.lineWidth = 4;
  const a2 = t * 40;
  ctx.beginPath();
  ctx.moveTo(166 + Math.cos(a2) * 22, -24 + Math.sin(a2) * 22);
  ctx.lineTo(166 - Math.cos(a2) * 22, -24 - Math.sin(a2) * 22);
  ctx.stroke();
  // thân
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.ellipse(0, 0, 70, 40, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-60, 6, 120, 8);
  // kính
  ctx.fillStyle = '#90caf9';
  ctx.beginPath();
  ctx.ellipse(-36, -8, 30, 24, 0, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  // càng đáp
  ctx.strokeStyle = '#30343d';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-50, 52);
  ctx.lineTo(50, 52);
  ctx.moveTo(-30, 36);
  ctx.lineTo(-34, 52);
  ctx.moveTo(30, 36);
  ctx.lineTo(34, 52);
  ctx.stroke();
  // trục + cánh quạt chính (mờ chuyển động)
  ctx.fillStyle = '#30343d';
  ctx.fillRect(-5, -52, 10, 14);
  ctx.fillStyle = 'rgba(60,60,70,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, -52, 170, 12, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,30,30,0.7)';
  ctx.lineWidth = 6;
  const a = t * 30;
  ctx.beginPath();
  ctx.moveTo(-170 * Math.cos(a), -52);
  ctx.lineTo(170 * Math.cos(a), -52);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 18px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('CỨU HỘ', 10, 30);
  ctx.restore();
}
