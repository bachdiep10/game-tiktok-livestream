// Cảnh "Ăn cỗ đám cưới": rạp cưới dựng ở sân, mâm cỗ tròn, sân khấu, bàn tiếp tân, thùng bia hơi.
// Tất cả vẽ bằng code, không dùng ảnh của bên thứ ba.
export const SCENE = { groom: 'Minh', bride: 'Lan' };
export function setNames(groom, bride) {
  if (groom) SCENE.groom = String(groom).slice(0, 12);
  if (bride) SCENE.bride = String(bride).slice(0, 12);
}
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
  // ô cửa: bên trong phòng ấm đèn vàng, cửa kính khung gỗ, hai cánh chớp xanh mở ra hai bên
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#5a3a22');
  g.addColorStop(1, '#3a2414');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // đèn treo
  const lx = x + w * 0.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx, y);
  ctx.lineTo(lx, y + h * 0.25);
  ctx.stroke();
  const glow = ctx.createRadialGradient(lx, y + h * 0.3, 2, lx, y + h * 0.3, w * 0.55);
  glow.addColorStop(0, 'rgba(255,214,120,0.75)');
  glow.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffcf5a';
  ctx.beginPath();
  ctx.arc(lx, y + h * 0.28, 6, Math.PI, 0);
  ctx.fill();
  // khung tranh trên tường phòng
  ctx.fillStyle = 'rgba(30,20,10,0.55)';
  ctx.fillRect(x + w * 0.14, y + h * 0.42, w * 0.16, h * 0.2);
  ctx.fillStyle = 'rgba(200,170,120,0.6)';
  ctx.fillRect(x + w * 0.16, y + h * 0.44, w * 0.12, h * 0.16);
  // cửa kính khung gỗ
  ctx.strokeStyle = '#6b4226';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 3);
  ctx.lineTo(x + w / 2, y + h - 3);
  ctx.moveTo(x + 3, y + h * 0.35);
  ctx.lineTo(x + w - 3, y + h * 0.35);
  ctx.stroke();
  const leaf = (lx2, lw) => {
    ctx.fillStyle = color;
    ctx.fillRect(lx2, y - 2, lw, h + 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 2;
    for (let yy = y + 8; yy < y + h - 4; yy += 8) {
      ctx.beginPath();
      ctx.moveTo(lx2 + 4, yy);
      ctx.lineTo(lx2 + lw - 4, yy);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(lx2 + 2, y, 4, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(lx2 + 1, y - 1, lw - 2, h + 2);
  };
  const lw = w * (0.22 + (1 - open) * 0.1);
  leaf(x - lw + 4, lw);
  leaf(x + w - 4, lw);
  // gờ trên cửa
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x - lw, y - 14, w + lw * 2, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x - lw, y - 8, w + lw * 2, 6);
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

function plantPot(ctx, x, y, r, flowers = '') {
  ctx.fillStyle = '#c0663a';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.7, y);
  ctx.lineTo(x + r * 0.7, y);
  ctx.lineTo(x + r * 0.5, y + r * 0.9);
  ctx.lineTo(x - r * 0.5, y + r * 0.9);
  ctx.fill();
  ctx.fillStyle = '#9c4f2a';
  ctx.fillRect(x - r * 0.75, y - 3, r * 1.5, 6);
  for (let i = 0; i < 11; i++) {
    ctx.fillStyle = i % 3 === 0 ? '#2e7d32' : i % 3 === 1 ? '#43a047' : '#66bb6a';
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(i * 1.7) * r * 0.75, y - r * 0.55 + Math.sin(i * 2.3) * r * 0.45, r * 0.42, r * 0.24, i, 0, TAU);
    ctx.fill();
  }
  if (flowers) {
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? flowers : '#fff59d';
      ctx.beginPath();
      ctx.arc(x + Math.cos(i * 2.1) * r * 0.75, y - r * 0.6 + Math.sin(i * 1.3) * r * 0.5, r * 0.13, 0, TAU);
      ctx.fill();
    }
  }
}

function vines(ctx, x, y, len, rnd) {
  // dây leo rủ xuống từ ban công
  for (let k = 0; k < 3; k++) {
    let vx = x + k * 10;
    for (let i = 0; i < len; i += 8) {
      vx += (rnd() - 0.5) * 4;
      ctx.fillStyle = i % 16 ? '#388e3c' : '#66bb6a';
      ctx.beginPath();
      ctx.ellipse(vx, y + i, 5, 3, rnd() * 3, 0, TAU);
      ctx.fill();
    }
  }
}

function bougainvillea(ctx, x0, x1, y, rnd) {
  // giàn hoa giấy hồng phủ ban công
  for (let i = 0; i < 140; i++) {
    const t = rnd();
    const x = x0 + t * (x1 - x0);
    const hang = Math.sin(t * Math.PI) * 30 + (t > 0.75 ? (t - 0.75) * 380 : 0);
    const yy = y - 20 + rnd() * (40 + hang);
    ctx.fillStyle = rnd() < 0.3 ? '#4caf50' : ['#e91e63', '#f06292', '#ec407a', '#f48fb1'][Math.floor(rnd() * 4)];
    ctx.beginPath();
    ctx.ellipse(x, yy, 7 + rnd() * 4, 5 + rnd() * 3, rnd() * 3, 0, TAU);
    ctx.fill();
  }
}

function clouds(ctx) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [cx, cy, s] of [[560, 150, 1], [900, 90, 0.8], [250, 120, 0.7]]) {
    for (const [dx, dy, r] of [[0, 0, 40], [40, 10, 32], [-38, 12, 30], [70, 18, 22], [-70, 20, 20]]) {
      ctx.beginPath();
      ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU);
      ctx.fill();
    }
  }
}

function parapet(ctx, x, w, top) {
  // tường hoa kiểu Pháp trên mái
  ctx.fillStyle = '#f3dca0';
  ctx.fillRect(x + 20, top - 46, w - 40, 46);
  ctx.fillStyle = '#e6c77a';
  ctx.fillRect(x + w / 2 - 70, top - 74, 140, 30);
  ctx.beginPath();
  ctx.arc(x + w / 2, top - 74, 46, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let xx = x + 34; xx < x + w - 30; xx += 22) ctx.fillRect(xx, top - 34, 10, 30);
  ctx.fillStyle = '#d9b86a';
  ctx.fillRect(x + 12, top - 50, w - 24, 8);
  ctx.fillRect(x + 12, top - 6, w - 24, 8);
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
    plantPot(ctx, x + w * 0.24, fy + 100, 22);
    plantPot(ctx, x + w * 0.76, fy + 100, 22);
    if (rnd() < 0.5) plantPot(ctx, x + w * 0.5, fy + 100, 18, '#ffd54f');
    if (rnd() < 0.5) vines(ctx, x + w * 0.84, fy + 112, 60 + rnd() * 50, rnd);
    if (rnd() < 0.35) acUnit(ctx, x + (rnd() < 0.5 ? 6 : w - 76), fy + 20);
  }
}

function rollingShutter(ctx, x, y, w, h, openFrac) {
  // cửa cuốn kéo lên một nửa, bên trong tối
  ctx.fillStyle = '#1c1612';
  ctx.fillRect(x, y, w, h);
  const inner = ctx.createLinearGradient(0, y + h * openFrac, 0, y + h);
  inner.addColorStop(0, 'rgba(255,200,120,0.35)');
  inner.addColorStop(1, 'rgba(120,70,30,0.2)');
  ctx.fillStyle = inner;
  ctx.fillRect(x, y + h * openFrac, w, h * (1 - openFrac));
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = 'rgba(40,25,10,0.5)';
    ctx.fillRect(x + 20 + i * (w / 4), y + h * openFrac + 14, 26, 22);
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath();
    ctx.arc(x + w * (0.25 + i * 0.25) - 10, y + h * openFrac + 8, 4, 0, TAU);
    ctx.fill();
  }
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
  // diềm rạp đỏ trắng phía trên và dây đèn nhấp nháy
  ctx.save();
  const top = 320;
  for (let i = 0; i < 12; i++) {
    const x0 = (W / 12) * i;
    ctx.fillStyle = i % 2 ? '#fff5f5' : '#d32f2f';
    ctx.beginPath();
    ctx.moveTo(x0, top);
    ctx.lineTo(x0 + W / 12, top);
    ctx.quadraticCurveTo(x0 + W / 24, top + 120 + Math.sin(t * 0.0012 + i) * 3, x0, top);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x0 + W / 24, top + 22, W / 24, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(0, top - 6, W, 8);
  // dây đèn
  const pts = 22;
  for (let i = 0; i <= pts; i++) {
    const px = (i / pts) * W;
    const py = top + 70 + Math.sin((i / pts) * Math.PI * 3) * 14;
    const on = Math.sin(t * 0.005 + i * 1.3) > -0.3;
    ctx.fillStyle = on ? ['#fff59d', '#ffab91', '#b3e5fc', '#f8bbd0'][i % 4] : '#6d4c41';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, TAU);
    ctx.fill();
  }
  // đèn lồng đỏ
  for (const lx of [90, 990]) {
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.ellipse(lx, top + 150 + Math.sin(t * 0.002 + lx) * 4, 24, 32, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(lx - 10, top + 114 + Math.sin(t * 0.002 + lx) * 4, 20, 5);
  }
  ctx.restore();
}

export function drawStool(ctx, x, y, s, color) {
  // ghế tiệc bọc vải trắng thắt nơ đỏ: y là mặt đất
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f7f2e8';
  rr(ctx, -26, -104, 52, 62, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f7f2e8';
  ctx.beginPath();
  ctx.moveTo(-28, -42);
  ctx.lineTo(28, -42);
  ctx.lineTo(32, -4);
  ctx.lineTo(-32, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // nơ sau lưng ghế
  const bow = color === '#e53935' || color === '#fb8c00' ? '#d32f2f' : '#ec407a';
  ctx.fillStyle = bow;
  ctx.fillRect(-26, -80, 52, 8);
  ctx.beginPath();
  ctx.moveTo(0, -76);
  ctx.lineTo(-14, -90);
  ctx.lineTo(-14, -62);
  ctx.closePath();
  ctx.moveTo(0, -76);
  ctx.lineTo(14, -90);
  ctx.lineTo(14, -62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawBench(ctx, x0, x1, y, s) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x0 - 40 * s, y - 4 * s, x1 - x0 + 80 * s, 8 * s);
  ctx.fillStyle = '#e8dcc8';
  ctx.fillRect(x0 - 44 * s, y - 44 * s, x1 - x0 + 88 * s, 12 * s);
  ctx.fillStyle = '#c62828';
  ctx.fillRect(x0 - 44 * s, y - 48 * s, x1 - x0 + 88 * s, 6 * s);
  ctx.fillStyle = '#4e342e';
  for (const xx of [x0 - 34 * s, x1 + 28 * s]) ctx.fillRect(xx, y - 34 * s, 7 * s, 34 * s);
  ctx.restore();
}

export function drawTable(ctx, table, glasses = 2) {
  // mâm cỗ tròn trải khăn trắng, chạy đỏ, đĩa cỗ, ly bia
  const { x, y, s } = table;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 62, 12, 0, 0, TAU);
  ctx.fill();
  // váy khăn bàn
  ctx.fillStyle = '#f2ece0';
  ctx.beginPath();
  ctx.moveTo(-54, -44);
  ctx.lineTo(54, -44);
  ctx.lineTo(58, 2);
  ctx.quadraticCurveTo(0, 14, -58, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 15, -40);
    ctx.lineTo(i * 16, 6);
    ctx.stroke();
  }
  // mặt bàn
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.ellipse(0, -46, 56, 17, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.stroke();
  ctx.fillStyle = '#c62828';
  ctx.beginPath();
  ctx.ellipse(0, -46, 20, 7, 0, 0, TAU);
  ctx.fill();
  // đĩa cỗ giữa bàn: gà, nem
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(0, -48, 15, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e0a44a';
  ctx.beginPath();
  ctx.ellipse(0, -52, 9, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8bc34a';
  ctx.beginPath();
  ctx.arc(-11, -50, 2.6, 0, TAU);
  ctx.arc(11, -50, 2.6, 0, TAU);
  ctx.fill();
  // bát đĩa nhỏ quanh bàn
  ctx.fillStyle = '#fff';
  for (const a of [-2.6, -1.2, 0.3, 1.7, 2.9]) {
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 38, -46 + Math.sin(a) * 11, 6, 2.4, 0, 0, TAU);
    ctx.fill();
  }
  // ly bia
  for (let i = 0; i < glasses; i++) {
    drawTeaGlass(ctx, -30 + i * 60, -48, 0.8, 0.8);
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
  ctx.fillStyle = lemon ? 'rgba(255,167,38,0.92)' : 'rgba(236,176,32,0.94)';
  const fh = h * fill;
  ctx.beginPath();
  ctx.moveTo(-w0, 0);
  ctx.lineTo(w0, 0);
  ctx.lineTo(w0 + (w1 - w0) * (fh / h), -fh);
  ctx.lineTo(-w0 - (w1 - w0) * (fh / h), -fh);
  ctx.closePath();
  ctx.fill();
  // bọt bia (hoặc đá viên với nước ngọt)
  if (fill > 0.2) {
    if (lemon) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(-5, -fh + 1, 5, 5);
      ctx.fillRect(1, -fh + 3, 5, 4);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.beginPath();
      ctx.ellipse(0, -fh - 1, w0 + (w1 - w0) * (fh / h) + 1, 4.5, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-4, -fh - 5, 3.4, 0, TAU);
      ctx.arc(3, -fh - 6, 3.8, 0, TAU);
      ctx.fill();
    }
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
    ctx.fillStyle = '#ffb300';
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
  // phông sân khấu: cổng hoa, chữ song hỷ, tên cô dâu chú rể, đèn nhấp nháy
  const cx = 540;
  ctx.save();
  // tấm phông đỏ
  const bg = ctx.createLinearGradient(0, 560, 0, 905);
  bg.addColorStop(0, '#d81b60');
  bg.addColorStop(1, '#ad1457');
  ctx.fillStyle = bg;
  rr(ctx, cx - 300, 560, 600, 345, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 6;
  ctx.stroke();
  // vòm hoa
  const rnd = seeded(31);
  for (let i = 0; i < 70; i++) {
    const a = Math.PI + (i / 69) * Math.PI;
    const rx = 270;
    const ry = 250;
    const px = cx + Math.cos(a) * rx + (rnd() - 0.5) * 24;
    const py = 880 + Math.sin(a) * ry + (rnd() - 0.5) * 24;
    ctx.fillStyle = ['#fff', '#f8bbd0', '#ff80ab', '#ffe082'][i % 4];
    ctx.beginPath();
    ctx.arc(px, py, 10 + rnd() * 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 6, 9, 4, 0.6, 0, TAU);
    ctx.fill();
  }
  // chữ song hỷ
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(cx, 690, 70, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c62828';
  ctx.font = '900 96px "Segoe UI", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('囍', cx, 694);
  // tên
  ctx.fillStyle = '#fff';
  ctx.font = '900 54px "Segoe UI", system-ui, sans-serif';
  ctx.strokeStyle = 'rgba(120,0,40,0.8)';
  ctx.lineWidth = 7;
  const nm = `${SCENE.groom} & ${SCENE.bride}`;
  ctx.strokeText(nm, cx, 800);
  ctx.fillText(nm, cx, 800);
  ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('TRĂM NĂM HẠNH PHÚC', cx, 842);
  // đèn LED chạy quanh viền
  for (let i = 0; i < 28; i++) {
    const on = Math.sin(t * 0.004 + i * 0.7) > 0;
    ctx.fillStyle = on ? '#fff59d' : '#8d6e63';
    const px = cx - 290 + (i / 27) * 580;
    ctx.beginPath();
    ctx.arc(px, 572, 4.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawStallFront(ctx) {
  // bàn tiếp tân: khăn đỏ, hộp phong bì, tháp ly, bánh kem, thùng bia hơi
  const { x, y } = STALL;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 250, 16, 0, 0, TAU);
  ctx.fill();
  // bàn dài phủ khăn đỏ viền vàng
  ctx.fillStyle = '#b71c1c';
  ctx.beginPath();
  ctx.moveTo(x - 230, y - 70);
  ctx.lineTo(x + 230, y - 70);
  ctx.lineTo(x + 236, y + 2);
  ctx.lineTo(x - 236, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d32f2f';
  ctx.fillRect(x - 230, y - 74, 460, 10);
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(x - 232, y - 14, 464, 6);
  // hộp phong bì (bên phải bàn)
  const bx = STALL.pipeX;
  ctx.fillStyle = '#c62828';
  rr(ctx, bx - 36, y - 128, 72, 58, 6);
  ctx.fill();
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(bx - 20, y - 114, 40, 6);
  ctx.fillStyle = '#ffd54f';
  ctx.font = '900 13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MỪNG CƯỚI', bx, y - 88);
  // bánh kem 3 tầng (bên trái)
  const kx = STALL.jarX;
  const tiers = [[64, 24, '#fff5f7'], [46, 22, '#f8bbd0'], [30, 20, '#fff5f7']];
  let ky = y - 70;
  for (const [w, h, c] of tiers) {
    ctx.fillStyle = c;
    rr(ctx, kx - w / 2, ky - h, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ky -= h;
  }
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.arc(kx, ky - 6, 6, 0, TAU);
  ctx.fill();
  // thùng bia hơi inox + vòi (chỗ chị cô dâu rót bia)
  const jx = STALL.jugX;
  ctx.fillStyle = '#b0bec5';
  rr(ctx, jx - 24, y - 130, 48, 62, 12);
  ctx.fill();
  ctx.fillStyle = '#eceff1';
  ctx.fillRect(jx - 18, y - 124, 8, 50);
  ctx.fillStyle = '#78909c';
  ctx.fillRect(jx - 26, y - 108, 52, 5);
  ctx.fillRect(jx - 26, y - 88, 52, 5);
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(jx - 7, y - 80, 14, 7);
  ctx.fillRect(jx - 4, y - 74, 8, 12);
  // tháp ly champagne ở giữa
  const tx = x + 130;
  ctx.fillStyle = 'rgba(200,230,255,0.75)';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c <= r; c++) {
      const px = tx + (c - r / 2) * 22;
      const py = y - 74 - (3 - r) * 18;
      ctx.beginPath();
      ctx.moveTo(px - 9, py - 14);
      ctx.lineTo(px + 9, py - 14);
      ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fill();
    }
  }
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
  ctx.fillStyle = '#b8860b';
  rr(ctx, -46, -150, 92, 110, 14);
  ctx.fill();
  ctx.fillStyle = '#c62828';
  rr(ctx, -38, -142, 76, 96, 10);
  ctx.fill();
  ctx.fillStyle = '#8d6e09';
  ctx.fillRect(-52, -60, 104, 18);
  ctx.fillRect(-48, -42, 10, 42);
  ctx.fillRect(38, -42, 10, 42);
  ctx.fillStyle = '#ffd54a';
  ctx.font = '900 15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHỦ HÔN', 0, -108);
  ctx.restore();
}

export function drawStatic(ctx, flags = {}) {
  ctx.save();
  // trời chiều
  const sky = ctx.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, '#8ec5e8');
  sky.addColorStop(1, '#fbe0c2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND_Y);
  clouds(ctx);
  if (flags.showHouses !== false) {
    const rnd = seeded(2026);
    // nhà quê mái ngói phía sau rạp
    house(ctx, -20, 330, 330, '#f4e2b8', '#8d3b2a', rnd);
    house(ctx, 730, 370, 300, '#cfe3c1', '#8d3b2a', rnd);
    // cây cau hai bên
    for (const px of [60, 1010, 330, 800]) {
      ctx.strokeStyle = '#7a6a4f';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(px, GROUND_Y);
      ctx.lineTo(px + 6, 420);
      ctx.stroke();
      ctx.fillStyle = '#3f8a33';
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.ellipse(px + 6 + Math.cos(k * 1.05 - 1.5) * 38, 420 + Math.sin(k * 1.05 - 1.5) * 16, 44, 9, k * 1.05 - 1.5, 0, TAU);
        ctx.fill();
      }
    }
    // tường rạp phía sau: rèm đỏ trắng
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(0, 520, W, GROUND_Y - 520);
    for (let x = 0; x < W; x += 54) {
      ctx.fillStyle = (x / 54) % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(x, 520, 27, GROUND_Y - 520);
    }
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(0, 516, W, 8);
    // bục sân khấu
    ctx.fillStyle = '#f8bbd0';
    rr(ctx, 160, 898, 760, 56, 10);
    ctx.fill();
    ctx.fillStyle = '#ec407a';
    ctx.fillRect(160, 940, 760, 14);
    // biển cổng hoa bên trái
    ctx.save();
    ctx.translate(120, 640);
    ctx.fillStyle = '#ffd54f';
    rr(ctx, -80, -44, 160, 88, 12);
    ctx.fill();
    ctx.fillStyle = '#b71c1c';
    ctx.font = '900 26px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VU QUY', 0, -12);
    ctx.fillText('TÂN HÔN', 0, 20);
    ctx.restore();
    ctx.save();
    ctx.translate(960, 660);
    ctx.fillStyle = '#ffd54f';
    rr(ctx, -80, -44, 160, 88, 12);
    ctx.fill();
    ctx.fillStyle = '#b71c1c';
    ctx.font = '900 24px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NHÀ TRAI', 0, -12);
    ctx.fillText('& NHÀ GÁI', 0, 20);
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, GROUND_Y - 6, W, 6);
    for (const px of [20, 290, 760, 1060]) plantPot(ctx, px, GROUND_Y - 34, 30, '#f48fb1');
  }
  if (flags.showWires !== false) {
    electricPole(ctx, 1000);
    wires(ctx);
  }
  sidewalk(ctx);
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

// xe tải nhỏ của đội trật tự (nhìn ngang, đầu xe bên trái). cargo: số đồ đã thu
export function drawTruck(ctx, x, y, cargo = 0, t = 0, label = 'ĐỘI TRẬT TỰ') {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(20, 4, 190, 14, 0, 0, TAU);
  ctx.fill();
  // thùng xe
  ctx.fillStyle = '#e8e8e2';
  rr(ctx, -40, -150, 240, 110, 6);
  ctx.fill();
  ctx.fillStyle = '#5b6b2e';
  ctx.fillRect(-40, -112, 240, 26);
  ctx.fillStyle = '#fff';
  ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 80, -98);
  // đồ bị thu chất trên nóc thùng
  const cols = ['#e53935', '#1e88e5', '#43a047', '#fb8c00'];
  for (let i = 0; i < Math.min(cargo, 40); i++) {
    const cx = -30 + (i % 10) * 23;
    const cy = -158 - Math.floor(i / 10) * 16;
    ctx.fillStyle = cols[i % 4];
    ctx.fillRect(cx, cy, 20, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(cx, cy, 20, 3);
  }
  // cabin
  ctx.fillStyle = '#5b6b2e';
  ctx.beginPath();
  ctx.moveTo(-150, -40);
  ctx.lineTo(-150, -100);
  ctx.quadraticCurveTo(-140, -140, -100, -140);
  ctx.lineTo(-44, -140);
  ctx.lineTo(-44, -40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a7d4f2';
  ctx.beginPath();
  ctx.moveTo(-140, -98);
  ctx.quadraticCurveTo(-132, -128, -100, -128);
  ctx.lineTo(-60, -128);
  ctx.lineTo(-60, -98);
  ctx.closePath();
  ctx.fill();
  // đèn nháy trên nóc
  const on = Math.floor(t / 250) % 2 === 0;
  ctx.fillStyle = on ? '#ffeb3b' : '#ff9800';
  rr(ctx, -110, -152, 30, 12, 4);
  ctx.fill();
  // khung gầm + bánh
  ctx.fillStyle = '#333';
  ctx.fillRect(-150, -46, 350, 12);
  for (const wx of [-100, 140]) {
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.arc(wx, -22, 24, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9e9e9e';
    ctx.beginPath();
    ctx.arc(wx, -22, 9, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffe082';
  ctx.fillRect(-154, -66, 8, 12);
  ctx.restore();
}

// chó chạy (nhìn ngang). dir: 1 sang phải, -1 sang trái
export function drawDog(ctx, x, y, s, dir, t, barking = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  const run = t * 0.03;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 50, 8, 0, 0, TAU);
  ctx.fill();
  // chân
  ctx.strokeStyle = '#a0662f';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  for (const [hx, ph] of [[-26, 0], [-18, Math.PI], [22, Math.PI / 2], [30, Math.PI * 1.5]]) {
    const a = Math.sin(run + ph) * 0.7;
    ctx.beginPath();
    ctx.moveTo(hx, -34);
    ctx.lineTo(hx + Math.sin(a) * 18, -4);
    ctx.stroke();
  }
  // đuôi vẫy
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-38, -46);
  ctx.quadraticCurveTo(-56, -60 + Math.sin(t * 0.04) * 10, -60, -76);
  ctx.stroke();
  // thân
  ctx.fillStyle = '#c47d3a';
  ctx.beginPath();
  ctx.ellipse(0, -44, 44, 20, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f0d2a8';
  ctx.beginPath();
  ctx.ellipse(6, -36, 26, 10, 0, 0, TAU);
  ctx.fill();
  // đầu
  ctx.fillStyle = '#c47d3a';
  ctx.beginPath();
  ctx.ellipse(46, -66, 20, 17, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(64, -60, 14, 9, 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7a4a1e';
  ctx.beginPath();
  ctx.ellipse(36, -78, 7, 14, -0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(76, -62, 4, 0, TAU);
  ctx.arc(50, -70, 3, 0, TAU);
  ctx.fill();
  if (barking) {
    ctx.fillStyle = '#7a2a22';
    ctx.beginPath();
    ctx.ellipse(66, -52, 8, 4 + Math.abs(Math.sin(t * 0.03)) * 4, 0.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// micro karaoke (x, y là vị trí bàn tay, tilt là góc nghiêng)
export function drawMic(ctx, x, y, sc = 1, tilt = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(sc, sc);
  ctx.fillStyle = '#212121';
  rr(ctx, -3.5, -2, 7, 24, 3);
  ctx.fill();
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath();
  ctx.arc(0, -8, 8, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#607d8b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(8, -8);
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.restore();
}
