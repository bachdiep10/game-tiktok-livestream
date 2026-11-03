// Cảnh "Trà đá vỉa hè": dãy nhà ống, cây bàng, dây điện, vỉa hè lát gạch, quán trà đá dưới ô dù.
// Tất cả vẽ bằng code, không dùng ảnh của bên thứ ba.
export const W = 1080;
export const H = 1920;
export const GROUND_Y = 820; // chân tường nhà
export const CURB_Y = 1650; // mép vỉa hè
export const ROAD_Y = 1676;
export const FOOT_Y = 1790; // dải chú thích phía dưới
const TAU = Math.PI * 2;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// tỉ lệ nhân vật theo độ sâu (xa nhỏ, gần to)
export function scaleAtY(y) {
  return lerp(0.56, 1.06, clamp((y - 900) / (1600 - 900), 0, 1));
}

// ------------------------------------------------------------------ chỗ ngồi
// Mỗi bàn nhựa thấp có 2 ghế hai bên. Toạ độ là điểm chân (mặt đất) của nhân vật.
const STOOL_COLORS = ['#e53935', '#1e88e5', '#e53935', '#43a047', '#1e88e5', '#fb8c00'];
export const TABLES = [];
export const SEATS = [];
function addTable(x, y) {
  const s = scaleAtY(y);
  const t = { id: TABLES.length, x, y: y - 6 * s, s, seats: [] };
  TABLES.push(t);
  for (const side of [-1, 1]) {
    const seat = { id: SEATS.length, x: x + side * 64 * s, y, s, table: t.id, side, color: STOOL_COLORS[(SEATS.length * 7) % STOOL_COLORS.length] };
    SEATS.push(seat);
    t.seats.push(seat.id);
  }
}
// ghế dài sát tường (không có bàn)
function addBench(x, y) {
  const s = scaleAtY(y);
  SEATS.push({ id: SEATS.length, x, y, s, table: -1, side: 0, bench: true, color: '#8d6e63' });
}
for (const x of [130, 230, 330]) addBench(x, 930);
for (const x of [750, 850, 950]) addBench(x, 930);
for (const x of [175, 905]) addTable(x, 1040);
for (const y of [1170, 1310, 1450, 1595]) {
  for (const x of [135, 405, 675, 945]) addTable(x, y);
}

// ghế VIP (ghế bành gỗ) cạnh bà chủ quán cho người tặng quà lớn
export const VIP = { x: 805, y: 1000, s: scaleAtY(1000) * 1.12 };
// quầy của bà chủ quán
export const STALL = { x: 540, y: 975, ownerX: 470, jugX: 620, jarX: 360, pipeX: 735 };
export const OWNER_MOUTH = { x: 470, y: 850 };
export const JUG_TAP = { x: 600, y: 932 };

// ------------------------------------------------------------------ nền tĩnh
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export { rr as roundRectPath };

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function shutterWindow(ctx, x, y, w, h, color, open = 0.5) {
  // khung cửa sổ + cửa chớp gỗ sơn xanh
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,230,170,0.12)';
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  const leaf = (lx, lw) => {
    ctx.fillStyle = color;
    ctx.fillRect(lx, y, lw, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    for (let yy = y + 8; yy < y + h - 4; yy += 9) {
      ctx.beginPath();
      ctx.moveTo(lx + 4, yy);
      ctx.lineTo(lx + lw - 4, yy);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(lx + 1, y + 1, lw - 2, h - 2);
  };
  const lw = (w / 2) * (1 - open * 0.75);
  leaf(x - (w / 2) * open * 0.6, lw);
  leaf(x + w - lw + (w / 2) * open * 0.6, lw);
  // khung trên
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x - 6, y - 8, w + 12, 8);
}

function balcony(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x, y, w, 12);
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 46);
  ctx.lineTo(x + w, y - 46);
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let xx = x + 6; xx < x + w; xx += 12) {
    ctx.beginPath();
    ctx.moveTo(xx, y - 46);
    ctx.lineTo(xx, y);
    ctx.stroke();
  }
}

function plantPot(ctx, x, y, r) {
  ctx.fillStyle = '#b5532c';
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x + 14, y);
  ctx.lineTo(x + 10, y + 20);
  ctx.lineTo(x - 10, y + 20);
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? '#4caf50' : '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(i) * r * 0.6, y - r * 0.5 + Math.sin(i * 2) * r * 0.3, r * 0.55, r * 0.35, i, 0, TAU);
    ctx.fill();
  }
}

function acUnit(ctx, x, y) {
  ctx.fillStyle = '#e8e4da';
  rr(ctx, x, y, 70, 46, 4);
  ctx.fill();
  ctx.strokeStyle = '#9e9a90';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 46, y + 23, 15, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 10 + i * 9);
    ctx.lineTo(x + 26, y + 10 + i * 9);
    ctx.stroke();
  }
}

function house(ctx, x, w, top, wall, shutter, rnd) {
  // tường + vệt ố
  ctx.fillStyle = wall;
  ctx.fillRect(x, top, w, GROUND_Y - top);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(80,50,20,${0.03 + rnd() * 0.05})`;
    const sx = x + rnd() * w;
    const sy = top + rnd() * (GROUND_Y - top);
    ctx.beginPath();
    ctx.ellipse(sx, sy, 20 + rnd() * 50, 30 + rnd() * 80, 0, 0, TAU);
    ctx.fill();
  }
  // mái / gờ
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x - 4, top, w + 8, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x - 4, top, w + 8, 4);
  // các tầng
  const floors = Math.floor((GROUND_Y - 200 - top) / 150);
  for (let f = 0; f < floors; f++) {
    const fy = top + 40 + f * 150;
    shutterWindow(ctx, x + w * 0.22, fy, w * 0.56, 100, shutter, 0.2 + rnd() * 0.6);
    balcony(ctx, x + w * 0.12, fy + 120, w * 0.76);
    if (rnd() < 0.6) plantPot(ctx, x + w * 0.2 + rnd() * w * 0.6, fy + 92, 18);
    if (rnd() < 0.5) acUnit(ctx, x + (rnd() < 0.5 ? 6 : w - 76), fy + 20);
  }
}

function rollingShutter(ctx, x, y, w, h, openFrac) {
  // cửa cuốn kéo lên một nửa, bên trong tối
  ctx.fillStyle = '#1c1612';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,190,110,0.10)';
  ctx.fillRect(x, y + h * openFrac, w, h * (1 - openFrac));
  const sh = h * openFrac;
  const g = ctx.createLinearGradient(0, y, 0, y + sh);
  g.addColorStop(0, '#9aa0a6');
  g.addColorStop(1, '#6f757b');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, sh);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  for (let yy = y + 6; yy < y + sh; yy += 8) {
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
  ctx.fillStyle = '#4a4f55';
  ctx.fillRect(x - 6, y - 10, w + 12, 12);
}

function paintedSign(ctx, x, y, w, h, lines) {
  ctx.save();
  ctx.fillStyle = '#f4ecd8';
  rr(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = '#b71c1c';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#b71c1c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => {
    ctx.font = `900 ${l.size}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = l.color || '#b71c1c';
    ctx.fillText(l.text, x + w / 2, y + h * ((i + 0.5) / lines.length) + 2);
  });
  ctx.restore();
}

function electricPole(ctx, x) {
  ctx.fillStyle = '#8a8a86';
  ctx.fillRect(x - 12, 230, 24, GROUND_Y - 200);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x + 4, 230, 8, GROUND_Y - 200);
  ctx.fillStyle = '#5c5c58';
  ctx.fillRect(x - 60, 280, 120, 10);
  ctx.fillRect(x - 46, 330, 92, 8);
  // hộp công tơ + cuộn dây
  ctx.fillStyle = '#d6d2c4';
  ctx.fillRect(x - 30, 420, 60, 70);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 30, 420, 60, 70);
  ctx.fillStyle = '#222';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(x + Math.sin(i) * 10, 370 + i * 6, 34 - i * 3, 9, 0, 0, TAU);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1a1a1a';
    ctx.stroke();
  }
}

function wires(ctx) {
  // dây điện chằng chịt kiểu phố cổ
  const rnd = seeded(42);
  ctx.strokeStyle = 'rgba(25,25,25,0.85)';
  for (let i = 0; i < 16; i++) {
    ctx.lineWidth = 1.5 + rnd() * 2;
    const y0 = 270 + rnd() * 120;
    const y1 = 230 + rnd() * 200;
    ctx.beginPath();
    ctx.moveTo(-20, y1);
    ctx.quadraticCurveTo(450, y1 + 60 + rnd() * 90, 930, y0);
    ctx.stroke();
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(930, y0);
      ctx.quadraticCurveTo(1010, y0 + 30, 1100, y0 - 20 + rnd() * 40);
      ctx.stroke();
    }
  }
}

function sidewalk(ctx) {
  // gạch lát vỉa hè (gạch đỏ xen xám) theo phối cảnh
  const top = GROUND_Y;
  const g = ctx.createLinearGradient(0, top, 0, CURB_Y);
  g.addColorStop(0, '#b9a48a');
  g.addColorStop(1, '#cdb79a');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, CURB_Y - top);
  const vpX = W / 2;
  const vpY = 300;
  // hàng ngang
  let y = top;
  let row = 0;
  const rowsY = [];
  while (y < CURB_Y) {
    const s = scaleAtY(y);
    const h = 44 * s + 6;
    rowsY.push([y, Math.min(CURB_Y, y + h)]);
    y += h;
    row++;
  }
  rowsY.forEach(([y0, y1], r) => {
    for (let c = -14; c <= 14; c++) {
      const xAt = (yy, cc) => vpX + (cc * 100 - 0) * ((yy - vpY) / (1300 - vpY));
      const x0a = xAt(y0, c);
      const x1a = xAt(y0, c + 1);
      const x0b = xAt(y1, c);
      const x1b = xAt(y1, c + 1);
      if (x1b < -50 || x0b > W + 50) continue;
      const red = (r + c) % 2 === 0;
      ctx.fillStyle = red ? 'rgba(170,70,50,0.35)' : 'rgba(120,115,110,0.22)';
      ctx.beginPath();
      ctx.moveTo(x0a + 2, y0 + 1.5);
      ctx.lineTo(x1a - 2, y0 + 1.5);
      ctx.lineTo(x1b - 2, y1 - 1.5);
      ctx.lineTo(x0b + 2, y1 - 1.5);
      ctx.closePath();
      ctx.fill();
    }
  });
  // vết bẩn, lá khô
  const rnd = seeded(7);
  for (let i = 0; i < 40; i++) {
    const x = rnd() * W;
    const yy = top + 20 + rnd() * (CURB_Y - top - 40);
    const s = scaleAtY(yy);
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(150,110,40,0.5)' : 'rgba(90,70,40,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, yy, 9 * s, 4 * s, rnd() * 3, 0, TAU);
    ctx.fill();
  }
  // bóng nhà đổ xuống vỉa hè
  const sh = ctx.createLinearGradient(0, top, 0, top + 90);
  sh.addColorStop(0, 'rgba(40,25,10,0.35)');
  sh.addColorStop(1, 'rgba(40,25,10,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, top, W, 90);
}

function curbAndRoad(ctx) {
  ctx.fillStyle = '#d8d4cc';
  ctx.fillRect(0, CURB_Y, W, ROAD_Y - CURB_Y);
  for (let x = 0; x < W; x += 90) {
    ctx.fillStyle = (x / 90) % 2 ? '#e9e6df' : '#c9c5bd';
    ctx.fillRect(x, CURB_Y, 90, 10);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, ROAD_Y - 6, W, 6);
  const g = ctx.createLinearGradient(0, ROAD_Y, 0, H);
  g.addColorStop(0, '#4a4a4c');
  g.addColorStop(1, '#3a3a3c');
  ctx.fillStyle = g;
  ctx.fillRect(0, ROAD_Y, W, H - ROAD_Y);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let x = 20; x < W; x += 140) ctx.fillRect(x, ROAD_Y + 92, 70, 6);
}

function treeTrunk(ctx) {
  // cây bàng góc trái: thân + cành (tán lá vẽ riêng ở lớp trên)
  ctx.save();
  const g = ctx.createLinearGradient(20, 0, 90, 0);
  g.addColorStop(0, '#4a3324');
  g.addColorStop(1, '#6d4c37');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(20, CURB_Y - 30);
  ctx.bezierCurveTo(40, 1200, 30, 800, 70, 420);
  ctx.lineTo(110, 430);
  ctx.bezierCurveTo(80, 800, 100, 1200, 92, CURB_Y - 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a3324';
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2, w] of [[90, 480, 300, 330, 16], [80, 560, -10, 420, 14], [95, 440, 200, 250, 12]]) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, y1 - 20, x2, y2);
    ctx.stroke();
  }
  // bồn cây
  ctx.fillStyle = '#9e9a92';
  ctx.fillRect(-10, CURB_Y - 50, 150, 26);
  ctx.fillStyle = '#6d5a40';
  ctx.fillRect(-4, CURB_Y - 44, 138, 12);
  ctx.restore();
}

export function drawCanopy(ctx, t = 0) {
  // tán lá bàng (lớp phía trên người ngồi ở xa), đung đưa nhẹ
  const rnd = seeded(99);
  ctx.save();
  for (let i = 0; i < 46; i++) {
    const bx = -30 + rnd() * 420;
    const by = 170 + rnd() * 330 - (bx > 250 ? 0 : 0);
    const r = 40 + rnd() * 50;
    const sway = Math.sin(t * 0.0007 + i) * 4;
    const shade = rnd();
    ctx.fillStyle = shade < 0.33 ? '#2f6b2a' : shade < 0.66 ? '#3f8a33' : '#5aa641';
    ctx.beginPath();
    ctx.ellipse(bx + sway, by, r, r * 0.62, rnd() * 3, 0, TAU);
    ctx.fill();
  }
  // vài lá đỏ (bàng chuyển mùa)
  for (let i = 0; i < 18; i++) {
    const bx = rnd() * 400;
    const by = 190 + rnd() * 300;
    ctx.fillStyle = rnd() < 0.5 ? '#c0562b' : '#e08a2e';
    ctx.beginPath();
    ctx.ellipse(bx + Math.sin(t * 0.0008 + i) * 3, by, 14, 8, rnd() * 3, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawStool(ctx, x, y, s, color) {
  // ghế nhựa thấp: y là mặt đất
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-26, -40);
  ctx.lineTo(26, -40);
  ctx.lineTo(30, 0);
  ctx.lineTo(18, 0);
  ctx.lineTo(14, -22);
  ctx.lineTo(-14, -22);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-30, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, -42, 28, 7, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawBench(ctx, x0, x1, y, s) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x0 - 40 * s, y - 4 * s, x1 - x0 + 80 * s, 8 * s);
  ctx.fillStyle = '#6d4c37';
  ctx.fillRect(x0 - 44 * s, y - 44 * s, x1 - x0 + 88 * s, 12 * s);
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(x0 - 44 * s, y - 48 * s, x1 - x0 + 88 * s, 6 * s);
  ctx.fillStyle = '#4e342e';
  for (const xx of [x0 - 34 * s, x1 + 28 * s]) ctx.fillRect(xx, y - 34 * s, 7 * s, 34 * s);
  ctx.restore();
}

export function drawTable(ctx, table, glasses = 2) {
  const { x, y, s } = table;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 44, 9, 0, 0, TAU);
  ctx.fill();
  // bàn nhựa xanh thấp
  ctx.fillStyle = '#1565c0';
  ctx.fillRect(-30, -40, 8, 42);
  ctx.fillRect(22, -40, 8, 42);
  ctx.fillStyle = '#1e88e5';
  rr(ctx, -40, -50, 80, 14, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-36, -49, 72, 3);
  // cốc trà trên bàn
  for (let i = 0; i < glasses; i++) {
    const gx = -18 + i * 30;
    drawTeaGlass(ctx, gx, -52, 0.8, 0.7);
  }
  ctx.restore();
}

// cốc thuỷ tinh trà đá (y là đáy cốc)
export function drawTeaGlass(ctx, x, y, sc = 1, fill = 0.85, lemon = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  const w0 = 7;
  const w1 = 9;
  const h = 22;
  ctx.fillStyle = lemon ? 'rgba(240,200,60,0.9)' : 'rgba(196,120,30,0.88)';
  const fh = h * fill;
  ctx.beginPath();
  ctx.moveTo(-w0, 0);
  ctx.lineTo(w0, 0);
  ctx.lineTo(w0 + (w1 - w0) * (fh / h), -fh);
  ctx.lineTo(-w0 - (w1 - w0) * (fh / h), -fh);
  ctx.closePath();
  ctx.fill();
  // đá viên
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  if (fill > 0.2) {
    ctx.fillRect(-5, -fh + 1, 5, 5);
    ctx.fillRect(1, -fh + 3, 5, 4);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w1, -h);
  ctx.lineTo(-w0, 0);
  ctx.lineTo(w0, 0);
  ctx.lineTo(w1, -h);
  ctx.stroke();
  if (lemon) {
    ctx.fillStyle = '#c6e04a';
    ctx.beginPath();
    ctx.arc(w1 - 1, -h + 2, 5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = '#ff5c8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -h + 4);
    ctx.lineTo(-6, -h - 10);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawUmbrella(ctx, t = 0) {
  // ô dù lớn sọc che quầy
  const cx = 545;
  const top = 610;
  ctx.save();
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(cx - 5, top, 10, 360);
  const segs = 8;
  const rx = 330;
  const ry = 95;
  for (let i = 0; i < segs; i++) {
    const a0 = Math.PI + (i / segs) * Math.PI;
    const a1 = Math.PI + ((i + 1) / segs) * Math.PI;
    ctx.fillStyle = i % 2 ? '#f3efe6' : '#d32f2f';
    ctx.beginPath();
    ctx.moveTo(cx, top - 4);
    ctx.lineTo(cx + Math.cos(a0) * rx, top + 30 + Math.sin(a0) * 10 + ry * 0.3);
    ctx.quadraticCurveTo(
      cx + Math.cos((a0 + a1) / 2) * rx * 1.02, top + 52 + ry * 0.3,
      cx + Math.cos(a1) * rx, top + 30 + Math.sin(a1) * 10 + ry * 0.3,
    );
    ctx.closePath();
    ctx.fill();
  }
  // diềm vải
  ctx.fillStyle = '#b71c1c';
  for (let i = 0; i < 16; i++) {
    const x = cx - rx + (i + 0.5) * ((rx * 2) / 16);
    ctx.beginPath();
    ctx.arc(x, top + 60 + Math.sin(t * 0.002 + i) * 1.5, 20, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#3e2723';
  ctx.beginPath();
  ctx.arc(cx, top - 6, 7, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawStallFront(ctx) {
  // bàn quầy gỗ thấp phía trước bà chủ: bình trà đá, lọ kẹo lạc, cốc úp, điếu cày dựng
  const { x, y } = STALL;
  ctx.save();
  // tủ kính nhỏ + lọ kẹo
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 230, 16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7b5233';
  rr(ctx, x - 210, y - 70, 420, 20, 5);
  ctx.fill();
  ctx.fillStyle = '#5d3d25';
  ctx.fillRect(x - 196, y - 52, 14, 54);
  ctx.fillRect(x + 182, y - 52, 14, 54);
  ctx.fillStyle = '#8d6040';
  ctx.fillRect(x - 210, y - 72, 420, 5);
  // tủ kính bên trái
  const kx = STALL.jarX - 70;
  ctx.fillStyle = 'rgba(200,230,255,0.35)';
  ctx.fillRect(kx, y - 150, 140, 80);
  ctx.strokeStyle = '#6d4c37';
  ctx.lineWidth = 4;
  ctx.strokeRect(kx, y - 150, 140, 80);
  // kẹo lạc trong tủ
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = '#c58a3a';
    ctx.fillRect(kx + 10 + (i % 4) * 32, y - 136 + Math.floor(i / 4) * 30, 24, 16);
    ctx.fillStyle = '#e8c27a';
    for (let k = 0; k < 4; k++) ctx.fillRect(kx + 13 + (i % 4) * 32 + k * 5, y - 132 + Math.floor(i / 4) * 30, 3, 3);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(kx + 8, y - 146, 10, 72);
  // nhãn
  ctx.fillStyle = '#fff8e1';
  ctx.fillRect(kx + 20, y - 168, 100, 20);
  ctx.fillStyle = '#b71c1c';
  ctx.font = '900 15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KẸO LẠC', kx + 70, y - 157);
  // bình trà đá lớn (bình giữ nhiệt)
  const jx = STALL.jugX;
  ctx.fillStyle = '#eceff1';
  rr(ctx, jx - 44, y - 190, 88, 120, 16);
  ctx.fill();
  ctx.fillStyle = '#1976d2';
  rr(ctx, jx - 48, y - 202, 96, 22, 8);
  ctx.fill();
  ctx.fillStyle = '#d32f2f';
  ctx.fillRect(jx - 44, y - 150, 88, 26);
  ctx.fillStyle = '#fff';
  ctx.font = '900 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('TRÀ ĐÁ', jx, y - 137);
  ctx.fillStyle = '#90a4ae';
  ctx.fillRect(jx - 20, y - 84, 14, 12);
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(jx - 24, y - 76, 6, 10);
  // cốc úp
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.translate(jx + 70 + (i % 3) * 22, y - 74 - Math.floor(i / 3) * 22);
    ctx.scale(1, -1);
    drawTeaGlass(ctx, 0, 0, 1, 0);
    ctx.restore();
  }
  // ấm tích nhỏ
  ctx.fillStyle = '#efe7d6';
  ctx.beginPath();
  ctx.ellipse(x - 20, y - 92, 26, 22, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3e7cb1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x - 20, y - 94, 12, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#efe7d6';
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 98);
  ctx.lineTo(x + 22, y - 112);
  ctx.lineTo(x + 6, y - 88);
  ctx.fill();
  // điếu cày dựng cạnh quầy
  drawPipe(ctx, STALL.pipeX, y + 2, 1.05);
  ctx.restore();
}

// điếu cày: ống tre dài, nõ điếu chĩa ra bên cạnh. (x, y) là chân ống
export function drawPipe(ctx, x, y, s = 1, tilt = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  const h = 150;
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, '#a1887f');
  g.addColorStop(0.5, '#e0c48a');
  g.addColorStop(1, '#8d6e63');
  ctx.fillStyle = g;
  rr(ctx, -8, -h, 16, h, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(80,50,20,0.6)';
  for (const yy of [-30, -75, -120]) ctx.fillRect(-9, yy, 18, 4);
  // dây buộc
  ctx.fillStyle = '#c62828';
  ctx.fillRect(-9, -52, 18, 6);
  // nõ điếu
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(6, -36);
  ctx.lineTo(24, -52);
  ctx.stroke();
  ctx.fillStyle = '#4e342e';
  ctx.beginPath();
  ctx.ellipse(26, -55, 6, 4, -0.7, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawVipChair(ctx, glow = 0) {
  const { x, y, s } = VIP;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (glow > 0) {
    const g = ctx.createRadialGradient(0, -80, 10, 0, -80, 140);
    g.addColorStop(0, `rgba(255,215,64,${0.45 * glow})`);
    g.addColorStop(1, 'rgba(255,215,64,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -80, 140, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 52, 10, 0, 0, TAU);
  ctx.fill();
  // ghế bành gỗ
  ctx.fillStyle = '#6d3b1f';
  rr(ctx, -46, -150, 92, 110, 14);
  ctx.fill();
  ctx.fillStyle = '#8b4d28';
  rr(ctx, -38, -142, 76, 96, 10);
  ctx.fill();
  ctx.fillStyle = '#5a2e16';
  ctx.fillRect(-52, -60, 104, 18);
  ctx.fillRect(-48, -42, 10, 42);
  ctx.fillRect(38, -42, 10, 42);
  ctx.fillStyle = '#ffd54a';
  ctx.font = '900 18px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIP', 0, -108);
  ctx.restore();
}

export function drawStatic(ctx, flags = {}) {
  ctx.save();
  // trời chiều
  const sky = ctx.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, '#8ec5e8');
  sky.addColorStop(1, '#f6d9a8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND_Y);
  // dãy nhà ống
  if (flags.showHouses !== false) {
    const rnd = seeded(2024);
    house(ctx, -20, 330, 250, '#e9c46a', '#2e7d5b', rnd);
    house(ctx, 310, 420, 180, '#f1d9a7', '#3b6e8f', rnd);
    house(ctx, 730, 370, 230, '#d9a7a0', '#2e7d5b', rnd);
    // tầng trệt: cửa cuốn + biển quán
    rollingShutter(ctx, 360, 600, 320, 220, 0.55);
    rollingShutter(ctx, 780, 640, 270, 180, 0.8);
    rollingShutter(ctx, 20, 640, 260, 180, 0.7);
    paintedSign(ctx, 380, 520, 280, 66, [
      { text: 'TRÀ ĐÁ • KẸO LẠC', size: 30 },
    ]);
    paintedSign(ctx, 790, 568, 240, 56, [{ text: 'SỬA XE • BƠM XE', size: 22, color: '#1b5e20' }]);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, GROUND_Y - 6, W, 6);
  }
  if (flags.showWires !== false) {
    electricPole(ctx, 1000);
    wires(ctx);
  }
  sidewalk(ctx);
  if (flags.showTree !== false) treeTrunk(ctx);
  curbAndRoad(ctx);
  ctx.restore();
}

// xe máy chạy ngang đường (nhìn ngang)
export function drawMotorbike(ctx, bike, t) {
  const { x, y, dir, color, helmet, shirt, s } = bike;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  const bob = Math.sin(t * 0.02 + bike.seed) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 80, 9, 0, 0, TAU);
  ctx.fill();
  // bánh xe
  for (const wx of [-48, 50]) {
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.arc(wx, -18, 20, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9e9e9e';
    ctx.beginPath();
    ctx.arc(wx, -18, 8, 0, TAU);
    ctx.fill();
  }
  ctx.translate(0, bob);
  // thân xe tay ga
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-70, -36);
  ctx.quadraticCurveTo(-60, -66, -10, -62);
  ctx.lineTo(18, -62);
  ctx.quadraticCurveTo(30, -40, 42, -38);
  ctx.lineTo(62, -84);
  ctx.lineTo(74, -80);
  ctx.lineTo(66, -30);
  ctx.quadraticCurveTo(10, -18, -70, -26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#222';
  rr(ctx, -54, -72, 60, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ddd';
  ctx.fillRect(58, -96, 6, 14);
  ctx.fillStyle = '#ffe082';
  ctx.beginPath();
  ctx.arc(76, -70, 6, 0, TAU);
  ctx.fill();
  // người lái
  ctx.strokeStyle = '#37474f';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-24, -72);
  ctx.lineTo(10, -60);
  ctx.lineTo(20, -36);
  ctx.stroke();
  ctx.fillStyle = shirt;
  rr(ctx, -40, -128, 34, 60, 12);
  ctx.fill();
  ctx.strokeStyle = shirt;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-14, -118);
  ctx.lineTo(30, -96);
  ctx.lineTo(56, -92);
  ctx.stroke();
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath();
  ctx.arc(-18, -146, 16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = helmet;
  ctx.beginPath();
  ctx.arc(-20, -150, 18, Math.PI * 0.95, Math.PI * 2.1);
  ctx.fill();
  ctx.fillRect(-36, -152, 34, 6);
  if (bike.cargo) {
    // chở hàng (thùng xốp / bao)
    ctx.fillStyle = bike.cargo;
    rr(ctx, -82, -104, 40, 40, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}
