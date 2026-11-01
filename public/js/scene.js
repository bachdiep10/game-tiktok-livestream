// Vẽ bối cảnh chánh điện hoàn toàn bằng code (không dùng ảnh bên ngoài).
// Kích thước logic: 1080 x 1920 (dọc, đúng khung TikTok LIVE).

export const W = 1080;
export const H = 1920;
export const FLOOR_TOP = 1060;

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function goldGradient(ctx, x0, x1, y = 0) {
  const g = ctx.createLinearGradient(x0, y, x1, y);
  g.addColorStop(0, '#8a5410');
  g.addColorStop(0.25, '#e0a93a');
  g.addColorStop(0.5, '#ffe08a');
  g.addColorStop(0.75, '#d99a2b');
  g.addColorStop(1, '#7a4a0e');
  return g;
}

// Hoa sen: dùng cho bàn thờ, hiệu ứng quà
export function drawLotus(ctx, x, y, size, open = 1, colors = {}) {
  const outer = colors.outer || '#f48fb1';
  const inner = colors.inner || '#fce4ec';
  const layers = [
    { n: 8, len: 1.0, wid: 0.34, spread: 1.0, color: outer },
    { n: 6, len: 0.8, wid: 0.3, spread: 0.75, color: '#f8bbd0' },
    { n: 5, len: 0.6, wid: 0.26, spread: 0.5, color: inner },
  ];
  ctx.save();
  ctx.translate(x, y);
  for (const L of layers) {
    for (let i = 0; i < L.n; i++) {
      const t = L.n === 1 ? 0.5 : i / (L.n - 1);
      const ang = (-Math.PI / 2) + (t - 0.5) * Math.PI * 1.1 * L.spread * open;
      ctx.save();
      ctx.rotate(ang + Math.PI / 2);
      const len = size * L.len * (0.55 + 0.45 * open);
      const wid = size * L.wid;
      const g = ctx.createLinearGradient(0, 0, 0, -len);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, L.color);
      g.addColorStop(1, shade(L.color, -30));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(wid, -len * 0.5, 0, -len);
      ctx.quadraticCurveTo(-wid, -len * 0.5, 0, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,30,70,0.35)';
      ctx.lineWidth = Math.max(1, size * 0.02);
      ctx.stroke();
      ctx.restore();
    }
  }
  // nhuỵ sen
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.12, size * 0.16, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function drawLantern(ctx, x, y, s) {
  // dây treo
  ctx.strokeStyle = '#3b1a08';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, y - 40 * s);
  ctx.stroke();
  // quầng sáng
  const glow = ctx.createRadialGradient(x, y, 5, x, y, 140 * s);
  glow.addColorStop(0, 'rgba(255,170,60,0.45)');
  glow.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 140 * s, y - 140 * s, 280 * s, 280 * s);
  // thân đèn
  const g = ctx.createRadialGradient(x - 10 * s, y - 10 * s, 5, x, y, 50 * s);
  g.addColorStop(0, '#ffcf6b');
  g.addColorStop(0.45, '#e2401f');
  g.addColorStop(1, '#7d1208');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, 38 * s, 46 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,120,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(i) * 9 * s + 2, 46 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = goldGradient(ctx, x - 22 * s, x + 22 * s);
  ctx.fillRect(x - 22 * s, y - 52 * s, 44 * s, 10 * s);
  ctx.fillRect(x - 22 * s, y + 42 * s, 44 * s, 10 * s);
  // tua rua
  ctx.strokeStyle = '#c0291a';
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 3 * s, y + 52 * s);
    ctx.lineTo(x + i * 4 * s, y + 85 * s);
    ctx.stroke();
  }
}

function drawDharmaWheel(ctx, x, y, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25);
    ctx.lineTo(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPillar(ctx, x, w) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#4a0805');
  g.addColorStop(0.35, '#b52418');
  g.addColorStop(0.55, '#d2402a');
  g.addColorStop(1, '#4a0805');
  ctx.fillStyle = g;
  ctx.fillRect(x, 0, w, FLOOR_TOP + 40);
  // đai vàng + hoa văn xoắn (cách điệu rồng mây)
  for (let y = 80; y < FLOOR_TOP; y += 230) {
    ctx.fillStyle = goldGradient(ctx, x, x + w);
    ctx.fillRect(x - 4, y, w + 8, 16);
    ctx.strokeStyle = 'rgba(255,205,90,0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let t = 0; t < 1; t += 0.02) {
      const yy = y + 30 + t * 170;
      const xx = x + w / 2 + Math.sin(t * Math.PI * 3) * w * 0.32;
      if (t === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(x + w / 2 + (k - 1) * w * 0.22, y + 70 + k * 45, w * 0.1, 0, Math.PI * 1.6);
      ctx.stroke();
    }
  }
  // chân cột
  ctx.fillStyle = '#2b1206';
  ctx.fillRect(x - 10, FLOOR_TOP - 10, w + 20, 50);
  ctx.fillStyle = goldGradient(ctx, x - 10, x + w + 10);
  ctx.fillRect(x - 10, FLOOR_TOP - 14, w + 20, 8);
}

function drawBanner(ctx, x, y, w, h) {
  ctx.fillStyle = '#9e1610';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w / 2, y + h - 30);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8b54a';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = goldGradient(ctx, x - 6, x + w + 6);
  ctx.fillRect(x - 8, y - 10, w + 16, 14);
  for (let i = 0; i < 4; i++) {
    drawDharmaWheel(ctx, x + w / 2, y + 70 + i * ((h - 140) / 3), w * 0.22, 'rgba(255,214,110,0.85)');
  }
}

function drawVase(ctx, x, y, s) {
  // bình hoa + hoa
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32;
    const fx = x + Math.cos(a) * 70 * s;
    const fy = y - 70 * s + Math.sin(a) * 70 * s;
    ctx.strokeStyle = '#2f6b2a';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(x, y - 30 * s);
    ctx.quadraticCurveTo(x + (fx - x) * 0.3, fy + 30 * s, fx, fy);
    ctx.stroke();
    ctx.fillStyle = '#3f8a35';
    ctx.beginPath();
    ctx.ellipse(fx * 0.6 + x * 0.4, fy * 0.6 + (y - 30 * s) * 0.4, 14 * s, 6 * s, a, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32;
    drawLotus(ctx, x + Math.cos(a) * 70 * s, y - 70 * s + Math.sin(a) * 70 * s + 10 * s, 26 * s, 0.75);
  }
  ctx.fillStyle = goldGradient(ctx, x - 26 * s, x + 26 * s);
  ctx.beginPath();
  ctx.moveTo(x - 14 * s, y - 34 * s);
  ctx.quadraticCurveTo(x - 40 * s, y + 10 * s, x - 18 * s, y + 40 * s);
  ctx.lineTo(x + 18 * s, y + 40 * s);
  ctx.quadraticCurveTo(x + 40 * s, y + 10 * s, x + 14 * s, y - 34 * s);
  ctx.closePath();
  ctx.fill();
}

function drawFruitPlate(ctx, x, y, s) {
  ctx.fillStyle = goldGradient(ctx, x - 50 * s, x + 50 * s);
  ctx.beginPath();
  ctx.ellipse(x, y, 50 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 10 * s, y, 20 * s, 22 * s);
  const fruits = ['#f39c12', '#e74c3c', '#f1c40f', '#e67e22', '#c0392b', '#f5b041'];
  let k = 0;
  for (let row = 0; row < 3; row++) {
    const n = 4 - row;
    for (let i = 0; i < n; i++) {
      const fx = x + (i - (n - 1) / 2) * 22 * s;
      const fy = y - 10 * s - row * 18 * s;
      const g = ctx.createRadialGradient(fx - 4 * s, fy - 4 * s, 1, fx, fy, 12 * s);
      g.addColorStop(0, '#fff3c4');
      g.addColorStop(0.3, fruits[k++ % fruits.length]);
      g.addColorStop(1, '#6e2c00');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fx, fy, 12 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Tượng Phật ngồi thiền (vẽ cách điệu)
function drawBuddha(ctx) {
  const cx = 540;
  // Hào quang lớn
  const halo = ctx.createRadialGradient(cx, 430, 20, cx, 470, 380);
  halo.addColorStop(0, 'rgba(255,250,220,1)');
  halo.addColorStop(0.25, 'rgba(255,214,120,0.95)');
  halo.addColorStop(0.55, 'rgba(214,140,40,0.55)');
  halo.addColorStop(1, 'rgba(120,50,10,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, 470, 380, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(cx, 430);
  for (let i = 0; i < 64; i++) {
    ctx.rotate((Math.PI * 2) / 64);
    ctx.fillStyle = i % 2 ? 'rgba(255,230,150,0.18)' : 'rgba(255,200,90,0.1)';
    ctx.beginPath();
    ctx.moveTo(-6, 120);
    ctx.lineTo(6, 120);
    ctx.lineTo(16, 330);
    ctx.lineTo(-16, 330);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,225,140,0.6)';
  ctx.lineWidth = 3;
  for (const r of [130, 150, 250]) {
    ctx.beginPath();
    ctx.arc(cx, 420, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Đài sen
  const petalRow = (y, n, w, h, color) => {
    for (let i = 0; i < n; i++) {
      const px = cx - w / 2 + (i + 0.5) * (w / n);
      const g = ctx.createLinearGradient(px, y - h, px, y + 10);
      g.addColorStop(0, '#fff0f5');
      g.addColorStop(0.5, color);
      g.addColorStop(1, shade(color, -60));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(px - (w / n) * 0.62, y);
      ctx.quadraticCurveTo(px - (w / n) * 0.55, y - h * 0.8, px, y - h);
      ctx.quadraticCurveTo(px + (w / n) * 0.55, y - h * 0.8, px + (w / n) * 0.62, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,120,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };
  ctx.fillStyle = goldGradient(ctx, cx - 230, cx + 230);
  ctx.beginPath();
  ctx.ellipse(cx, 880, 230, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  petalRow(890, 11, 500, 90, '#e8557f');
  petalRow(850, 9, 440, 80, '#f06d94');

  // Thân
  const body = goldGradient(ctx, cx - 230, cx + 230);
  ctx.fillStyle = body;
  // chân xếp bằng
  ctx.beginPath();
  ctx.ellipse(cx, 770, 225, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  // thân trên
  ctx.beginPath();
  ctx.moveTo(cx - 70, 505);
  ctx.quadraticCurveTo(cx - 140, 510, cx - 150, 560);
  ctx.quadraticCurveTo(cx - 175, 650, cx - 190, 730);
  ctx.quadraticCurveTo(cx - 120, 770, cx, 760);
  ctx.quadraticCurveTo(cx + 120, 770, cx + 190, 730);
  ctx.quadraticCurveTo(cx + 175, 650, cx + 150, 560);
  ctx.quadraticCurveTo(cx + 140, 510, cx + 70, 505);
  ctx.closePath();
  ctx.fill();
  // nếp áo cà sa
  ctx.strokeStyle = 'rgba(120,70,10,0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 120, 530);
  ctx.quadraticCurveTo(cx - 10, 620, cx + 110, 740);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 200 + i * 12, 760 + i * 6);
    ctx.quadraticCurveTo(cx, 800 + i * 10, cx + 200 - i * 12, 760 + i * 6);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - 150, 570);
  ctx.quadraticCurveTo(cx - 165, 650, cx - 120, 720);
  ctx.moveTo(cx + 150, 570);
  ctx.quadraticCurveTo(cx + 165, 650, cx + 120, 720);
  ctx.stroke();
  // tay ấn thiền
  ctx.fillStyle = goldGradient(ctx, cx - 80, cx + 80, 740);
  ctx.beginPath();
  ctx.ellipse(cx, 735, 78, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,70,10,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, 732, 50, 12, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  // cổ
  ctx.fillStyle = goldGradient(ctx, cx - 36, cx + 36);
  ctx.fillRect(cx - 34, 470, 68, 45);
  ctx.strokeStyle = 'rgba(120,70,10,0.5)';
  ctx.beginPath();
  ctx.moveTo(cx - 28, 492);
  ctx.quadraticCurveTo(cx, 500, cx + 28, 492);
  ctx.stroke();
  // tai
  ctx.fillStyle = goldGradient(ctx, cx - 95, cx + 95);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * 72, 445, 16, 52, side * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  // đầu
  ctx.fillStyle = goldGradient(ctx, cx - 75, cx + 75);
  ctx.beginPath();
  ctx.ellipse(cx, 410, 70, 84, 0, 0, Math.PI * 2);
  ctx.fill();
  // nhục kế + tóc xoắn ốc
  ctx.fillStyle = '#9c6417';
  ctx.beginPath();
  ctx.ellipse(cx, 380, 72, 60, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, 320, 38, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9a440';
  for (let yy = 300; yy < 380; yy += 11) {
    for (let xx = -70; xx <= 70; xx += 11) {
      const inHead = (xx * xx) / (70 * 70) + ((yy - 380) * (yy - 380)) / (60 * 60) < 1 && yy < 378;
      const inTop = (xx * xx) / (36 * 36) + ((yy - 320) * (yy - 320)) / (28 * 28) < 1;
      if (inHead || inTop) {
        ctx.beginPath();
        ctx.arc(cx + xx + ((yy / 11) % 2) * 5, yy, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // khuôn mặt
  ctx.strokeStyle = '#7a4a0c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath(); // lông mày
    ctx.moveTo(cx + side * 10, 398);
    ctx.quadraticCurveTo(cx + side * 30, 386, cx + side * 52, 398);
    ctx.stroke();
    ctx.beginPath(); // mắt khép hờ
    ctx.moveTo(cx + side * 16, 418);
    ctx.quadraticCurveTo(cx + side * 32, 426, cx + side * 46, 418);
    ctx.stroke();
  }
  ctx.beginPath(); // mũi
  ctx.moveTo(cx, 405);
  ctx.lineTo(cx - 3, 445);
  ctx.quadraticCurveTo(cx, 452, cx + 8, 446);
  ctx.stroke();
  ctx.beginPath(); // miệng
  ctx.moveTo(cx - 16, 466);
  ctx.quadraticCurveTo(cx, 474, cx + 16, 466);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); // bạch hào
  ctx.arc(cx, 395, 4, 0, Math.PI * 2);
  ctx.fill();
  // ánh sáng phản chiếu
  const shine = ctx.createRadialGradient(cx - 30, 420, 5, cx - 30, 420, 200);
  shine.addColorStop(0, 'rgba(255,255,230,0.35)');
  shine.addColorStop(1, 'rgba(255,255,230,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(cx - 240, 300, 480, 500);
}

function drawAltar(ctx) {
  // bàn thờ sơn son thếp vàng
  const top = 900;
  ctx.fillStyle = '#5a0d07';
  ctx.fillRect(210, top, 660, 100);
  const g = ctx.createLinearGradient(0, top, 0, top + 100);
  g.addColorStop(0, '#a3200f');
  g.addColorStop(1, '#4d0905');
  ctx.fillStyle = g;
  ctx.fillRect(220, top + 12, 640, 88);
  ctx.fillStyle = goldGradient(ctx, 200, 880);
  ctx.fillRect(200, top - 6, 680, 16);
  ctx.strokeStyle = 'rgba(255,205,90,0.8)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const x = 250 + i * 120;
    roundRect(ctx, x, top + 26, 100, 60, 10);
    ctx.stroke();
    drawDharmaWheel(ctx, x + 50, top + 56, 14, 'rgba(255,205,90,0.8)');
  }
}

export function drawStaticBackground(ctx, slots) {
  // tường
  const wall = ctx.createLinearGradient(0, 0, 0, FLOOR_TOP);
  wall.addColorStop(0, '#1c0603');
  wall.addColorStop(0.5, '#3e1207');
  wall.addColorStop(1, '#5b1c0a');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, FLOOR_TOP);
  // vách gỗ chạm phía sau
  ctx.fillStyle = 'rgba(110,45,15,0.6)';
  ctx.fillRect(150, 100, 780, FLOOR_TOP - 100);
  ctx.strokeStyle = 'rgba(230,170,70,0.18)';
  ctx.lineWidth = 2;
  for (let x = 160; x < 930; x += 36) {
    for (let y = 110; y < FLOOR_TOP - 60; y += 36) {
      ctx.strokeRect(x, y, 28, 28);
      ctx.beginPath();
      ctx.arc(x + 14, y + 14, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // xà ngang trên trần
  const beam = ctx.createLinearGradient(0, 0, 0, 110);
  beam.addColorStop(0, '#120402');
  beam.addColorStop(1, '#4a1406');
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, W, 105);
  ctx.fillStyle = goldGradient(ctx, 0, W);
  ctx.fillRect(0, 98, W, 10);
  ctx.strokeStyle = 'rgba(240,180,70,0.5)';
  ctx.lineWidth = 3;
  for (let x = 20; x < W; x += 90) {
    ctx.beginPath();
    ctx.arc(x + 25, 55, 22, 0, Math.PI * 2);
    ctx.stroke();
    drawDharmaWheel(ctx, x + 25, 55, 10, 'rgba(240,180,70,0.5)');
  }

  drawBuddha(ctx);
  drawPillar(ctx, 20, 95);
  drawPillar(ctx, W - 115, 95);
  drawBanner(ctx, 140, 125, 70, 560);
  drawBanner(ctx, W - 210, 125, 70, 560);
  drawLantern(ctx, 260, 210, 1);
  drawLantern(ctx, W - 260, 210, 1);
  drawLantern(ctx, 70, 320, 0.8);
  drawLantern(ctx, W - 70, 320, 0.8);

  drawAltar(ctx);
  // đồ cúng trên bàn thờ
  drawVase(ctx, 290, 860, 1);
  drawVase(ctx, 790, 860, 1);
  drawFruitPlate(ctx, 420, 885, 0.9);
  drawFruitPlate(ctx, 660, 885, 0.9);
  // lư hương
  ctx.fillStyle = goldGradient(ctx, 490, 590);
  ctx.beginPath();
  ctx.ellipse(540, 870, 52, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(488, 870);
  ctx.quadraticCurveTo(490, 905, 540, 908);
  ctx.quadraticCurveTo(590, 905, 592, 870);
  ctx.fill();
  ctx.fillRect(500, 900, 12, 10);
  ctx.fillRect(568, 900, 12, 10);
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(540 + i * 8, 868);
    ctx.lineTo(540 + i * 9, 820);
    ctx.stroke();
  }
  // chân nến
  for (const x of [235, 845]) {
    ctx.fillStyle = goldGradient(ctx, x - 16, x + 16);
    ctx.fillRect(x - 14, 860, 28, 40);
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(x - 8, 800, 16, 62);
  }
  // giá hoa hai bên
  for (const x of [120, 960]) {
    ctx.fillStyle = '#3b0c05';
    ctx.fillRect(x - 40, 960, 80, 100);
    ctx.fillStyle = goldGradient(ctx, x - 44, x + 44);
    ctx.fillRect(x - 44, 955, 88, 10);
    drawVase(ctx, x, 930, 1.15);
  }

  // bậc thềm
  for (let i = 0; i < 3; i++) {
    const y = 1000 + i * 20;
    const sg = ctx.createLinearGradient(0, y, 0, y + 20);
    sg.addColorStop(0, i % 2 ? '#6e2a10' : '#7e3414');
    sg.addColorStop(1, '#3a1206');
    ctx.fillStyle = sg;
    ctx.fillRect(0, y, W, 20);
    ctx.fillStyle = 'rgba(255,200,90,0.35)';
    ctx.fillRect(0, y, W, 2);
  }

  // sàn gỗ phối cảnh
  const fl = ctx.createLinearGradient(0, FLOOR_TOP, 0, H);
  fl.addColorStop(0, '#4a2210');
  fl.addColorStop(1, '#2a1208');
  ctx.fillStyle = fl;
  ctx.fillRect(0, FLOOR_TOP, W, H - FLOOR_TOP);
  const vpX = 540;
  const vpY = 300;
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 2;
  for (let i = -14; i <= 14; i++) {
    const xb = 540 + i * 110;
    const t = (FLOOR_TOP - vpY) / (H - vpY);
    ctx.beginPath();
    ctx.moveTo(vpX + (xb - vpX) * t, FLOOR_TOP);
    ctx.lineTo(xb, H);
    ctx.stroke();
  }
  for (let k = 0; k < 16; k++) {
    const y = FLOOR_TOP + Math.pow(k / 15, 1.6) * (H - FLOOR_TOP);
    ctx.strokeStyle = 'rgba(255,200,140,0.06)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // thảm đỏ lối đi
  const topW = 70;
  const botW = 150;
  ctx.fillStyle = '#8f1610';
  ctx.beginPath();
  ctx.moveTo(540 - topW, FLOOR_TOP);
  ctx.lineTo(540 + topW, FLOOR_TOP);
  ctx.lineTo(540 + botW, H);
  ctx.lineTo(540 - botW, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e0a640';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(224,166,64,0.35)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 20; k++) {
    const y = FLOOR_TOP + Math.pow(k / 19, 1.4) * (H - FLOOR_TOP);
    const t = (y - FLOOR_TOP) / (H - FLOOR_TOP);
    const hw = topW + (botW - topW) * t - 14;
    drawDiamond(ctx, 540, y, hw * 0.25, 8 + t * 6);
  }

  // bồ đoàn cho từng chỗ quỳ
  for (const s of slots) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 6 * s.scale, 40 * s.scale, 13 * s.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    const cg = ctx.createRadialGradient(s.x, s.y - 4 * s.scale, 2, s.x, s.y, 38 * s.scale);
    cg.addColorStop(0, '#b8862f');
    cg.addColorStop(1, '#6b4313');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 36 * s.scale, 12 * s.scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // viền tối tạo chiều sâu
  const vig = ctx.createRadialGradient(540, 900, 400, 540, 1000, 1200);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

function drawDiamond(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w, y);
  ctx.closePath();
  ctx.stroke();
}

// Tạo các vị trí quỳ theo hàng, gần bàn thờ được ưu tiên trước
export const ROW_TOP = 1150;
export const ROW_BOTTOM = 1690;
export function scaleAtY(y) {
  const t = Math.max(-0.4, Math.min(1.6, (y - ROW_TOP) / (ROW_BOTTOM - ROW_TOP)));
  return 0.6 + 0.45 * t;
}

export function buildSlots(maxSlots = 120) {
  const rows = [];
  const yTop = ROW_TOP;
  const yBot = ROW_BOTTOM;
  const R = 9;
  for (let r = 0; r < R; r++) {
    const t = r / (R - 1);
    const y = yTop + Math.pow(t, 1.1) * (yBot - yTop);
    const scale = scaleAtY(y);
    const halfW = Math.min(510, 380 + (y - yTop) * 0.3);
    const aisle = 62 + 60 * ((y - yTop) / (yBot - yTop));
    const spacing = 82 * scale;
    const perSide = Math.floor((halfW - aisle) / spacing);
    const row = [];
    for (let i = 0; i < perSide; i++) {
      const offset = aisle + spacing * (i + 0.5) + (r % 2 ? spacing * 0.25 : 0);
      if (offset > halfW) continue;
      row.push({ x: 540 - offset, y, scale, row: r, dist: i });
      row.push({ x: 540 + offset, y, scale, row: r, dist: i });
    }
    rows.push(row);
  }
  const slots = rows.flat();
  slots.sort((a, b) => a.row - b.row || a.dist - b.dist);
  return slots.slice(0, maxSlots).map((s, i) => ({ ...s, id: i, occupant: null }));
}

export function candlePositions() {
  return [
    { x: 235, y: 800 },
    { x: 845, y: 800 },
  ];
}
