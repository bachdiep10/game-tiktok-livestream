// Cảnh "Bia hơi vỉa hè" buổi tối: phố đèn vàng, biển neon, bàn nhựa thấp, thùng bia hơi.
// Tất cả vẽ bằng code, không dùng ảnh của bên thứ ba.
export const SCENE = { groom: '', bride: '' };
export function setNames() {}
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
const STOOL_COLORS = ['#1e88e5', '#1565c0', '#29b6f6', '#1e88e5', '#0d47a1', '#1976d2'];
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
  SEATS.push({ id: SEATS.length, x, y, s, table: -1, side: 0, bench: true, color: '#78909c' });
}
for (const x of [130, 230, 330]) addBench(x, 930);
for (const x of [750, 850, 950]) addBench(x, 930);
addTable(175, 1040); // góc phải là xe nướng
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

// ================================================================== cảnh quán bia hơi về đêm
// Khác hẳn quán trà đá: phố đêm, nhà hàng bia mở toang mặt tiền có đèn tuýp, giá bom bia inox,
// tivi bóng đá, bạt đỏ chữ vàng, mái bạt kẻ sọc che vỉa hè, dây bóng đèn tròn, két bia chất cao,
// xe nướng than khói nghi ngút, sàn xi măng loang nước, bàn nhựa đỏ ghế xanh.
function skyline(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, 620);
  sky.addColorStop(0, '#070a24');
  sky.addColorStop(0.55, '#1b1440');
  sky.addColorStop(1, '#4a2246');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND_Y);
  const rnd = seeded(404);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 50; i++) {
    ctx.globalAlpha = 0.2 + rnd() * 0.5;
    ctx.beginPath();
    ctx.arc(rnd() * W, 10 + rnd() * 260, 0.8 + rnd() * 1.3, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // trăng
  ctx.fillStyle = 'rgba(255,244,214,0.95)';
  ctx.beginPath();
  ctx.arc(900, 120, 38, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,244,214,0.12)';
  ctx.beginPath();
  ctx.arc(900, 120, 70, 0, TAU);
  ctx.fill();
  // nhà cao tầng xa, cửa sổ sáng lác đác
  const r2 = seeded(31);
  let x = -20;
  while (x < W) {
    const w = 70 + r2() * 90;
    const top = 170 + r2() * 160;
    ctx.fillStyle = r2() < 0.5 ? '#151634' : '#1c1b3d';
    ctx.fillRect(x, top, w, 500);
    for (let wy = top + 14; wy < 560; wy += 22) {
      for (let wx = x + 8; wx < x + w - 12; wx += 16) {
        if (r2() < 0.3) {
          ctx.fillStyle = r2() < 0.7 ? 'rgba(255,214,120,0.75)' : 'rgba(140,220,255,0.6)';
          ctx.fillRect(wx, wy, 8, 11);
        }
      }
    }
    x += w + 4;
  }
}

function sideBuilding(ctx, x, w, top) {
  ctx.fillStyle = '#2b2440';
  ctx.fillRect(x, top, w, GROUND_Y - top);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x, top, w, 8);
  for (let fy = top + 40; fy < 560; fy += 120) {
    ctx.fillStyle = '#3a2f55';
    ctx.fillRect(x + w * 0.18, fy, w * 0.64, 70);
    ctx.fillStyle = 'rgba(255,196,110,0.55)';
    ctx.fillRect(x + w * 0.22, fy + 6, w * 0.26, 58);
    ctx.fillStyle = 'rgba(255,196,110,0.25)';
    ctx.fillRect(x + w * 0.52, fy + 6, w * 0.26, 58);
  }
  // cửa cuốn đóng kín tầng trệt
  ctx.fillStyle = '#4b4f5c';
  ctx.fillRect(x + 8, 640, w - 16, GROUND_Y - 640);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  for (let yy = 646; yy < GROUND_Y; yy += 9) {
    ctx.beginPath();
    ctx.moveTo(x + 8, yy);
    ctx.lineTo(x + w - 8, yy);
    ctx.stroke();
  }
}

function beerHall(ctx) {
  // nhà hàng bia 2 tầng ở giữa
  const x0 = 120;
  const x1 = 960;
  const top = 250;
  ctx.fillStyle = '#3b3550';
  ctx.fillRect(x0, top, x1 - x0, GROUND_Y - top);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x0 - 6, top, x1 - x0 + 12, 10);
  // cửa sổ tầng trên sáng đèn vàng có rèm
  for (const wx of [170, 790]) {
    ctx.fillStyle = '#ffcf7a';
    ctx.fillRect(wx, 280, 120, 70);
    ctx.fillStyle = 'rgba(180,60,40,0.55)';
    ctx.fillRect(wx, 280, 34, 70);
    ctx.fillRect(wx + 86, 280, 34, 70);
    ctx.strokeStyle = '#231e33';
    ctx.lineWidth = 6;
    ctx.strokeRect(wx, 280, 120, 70);
  }
  // băng rôn bạt đỏ chữ vàng
  ctx.save();
  ctx.fillStyle = '#c62828';
  ctx.beginPath();
  ctx.moveTo(x0 + 20, 446);
  ctx.lineTo(x1 - 20, 446);
  ctx.lineTo(x1 - 26, 516);
  ctx.quadraticCurveTo(540, 522, x0 + 26, 516);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 6; i++) ctx.fillRect(x0 + 60 + i * 140, 446, 3, 72);
  ctx.fillStyle = '#ffeb3b';
  ctx.font = '900 44px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BIA HƠI TƯƠI MỖI NGÀY', 540, 476);
  ctx.font = '800 17px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#fff3c4';
  ctx.fillText('LẨU • NƯỚNG • MỒI NHẬU • CÓ CHỖ ĐỂ XE', 540, 505);
  ctx.restore();
  // tầng trệt mở toang, bên trong đèn tuýp trắng
  const iy = 592;
  const g = ctx.createLinearGradient(0, iy, 0, GROUND_Y);
  g.addColorStop(0, '#d7e6e0');
  g.addColorStop(1, '#a9bdb6');
  ctx.fillStyle = g;
  ctx.fillRect(x0 + 20, iy, x1 - x0 - 40, GROUND_Y - iy);
  // gạch men ốp tường
  ctx.strokeStyle = 'rgba(80,110,100,0.25)';
  ctx.lineWidth = 1.5;
  for (let yy = iy + 120; yy < GROUND_Y; yy += 22) {
    ctx.beginPath();
    ctx.moveTo(x0 + 20, yy);
    ctx.lineTo(x1 - 20, yy);
    ctx.stroke();
  }
  // đèn tuýp
  for (const lx of [260, 540, 820]) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#e0fff8';
    ctx.shadowBlur = 18;
    ctx.fillRect(lx - 70, iy + 14, 140, 7);
    ctx.shadowBlur = 0;
  }
  // giá bom bia inox xếp 2 tầng
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 6; i++) {
      const bx = 175 + i * 52;
      const by = iy + 60 + r * 64;
      const kg = ctx.createLinearGradient(bx - 22, 0, bx + 22, 0);
      kg.addColorStop(0, '#8e9aa3');
      kg.addColorStop(0.35, '#f1f5f7');
      kg.addColorStop(1, '#7c8891');
      ctx.fillStyle = kg;
      rr(ctx, bx - 22, by, 44, 56, 8);
      ctx.fill();
      ctx.fillStyle = '#5f6b73';
      ctx.fillRect(bx - 23, by + 14, 46, 4);
      ctx.fillRect(bx - 23, by + 40, 46, 4);
    }
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(145, iy + 116 + r * 64, 330, 6);
  }
  // tivi đang chiếu bóng đá
  const tx = 690;
  const ty = iy + 40;
  ctx.fillStyle = '#111';
  rr(ctx, tx, ty, 170, 104, 6);
  ctx.fill();
  ctx.fillStyle = '#2e9e4f';
  ctx.fillRect(tx + 8, ty + 8, 154, 88);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(tx + 14, ty + 14, 142, 76);
  ctx.beginPath();
  ctx.moveTo(tx + 85, ty + 14);
  ctx.lineTo(tx + 85, ty + 90);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(tx + 85, ty + 52, 13, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '800 12px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('1 - 0', tx + 14, ty + 26);
  // tủ lạnh cửa kính
  ctx.fillStyle = '#e8eef0';
  rr(ctx, 874, iy + 26, 62, 190, 6);
  ctx.fill();
  ctx.fillStyle = '#8fd3ff';
  ctx.fillRect(880, iy + 34, 50, 166);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = ['#2e7d32', '#ffb300', '#c62828', '#1565c0'][(r + c) % 4];
      ctx.fillRect(883 + c * 12, iy + 44 + r * 40, 7, 26);
    }
  }
  // cột nhà hai bên
  ctx.fillStyle = '#2a2438';
  ctx.fillRect(x0, iy - 10, 24, GROUND_Y - iy + 10);
  ctx.fillRect(x1 - 24, iy - 10, 24, GROUND_Y - iy + 10);
}

function awning(ctx) {
  // mái bạt kẻ sọc xanh trắng che ra vỉa hè
  const y0 = 522;
  const y1 = 592;
  for (let i = 0; i < 18; i++) {
    const xa = 90 + i * 50;
    const xb = 60 + i * 53.3;
    ctx.fillStyle = i % 2 ? '#f3f3f3' : '#1e5fa8';
    ctx.beginPath();
    ctx.moveTo(xa, y0);
    ctx.lineTo(xa + 50, y0);
    ctx.lineTo(xb + 53.3, y1);
    ctx.lineTo(xb, y1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(90, y0, 900, 5);
  // mép rèm lượn sóng
  for (let i = 0; i < 18; i++) {
    const xb = 60 + i * 53.3;
    ctx.fillStyle = i % 2 ? '#f3f3f3' : '#1e5fa8';
    ctx.beginPath();
    ctx.moveTo(xb, y1);
    ctx.lineTo(xb + 53.3, y1);
    ctx.quadraticCurveTo(xb + 26.6, y1 + 30, xb, y1);
    ctx.fill();
  }
  // cột sắt chống bạt
  ctx.fillStyle = '#55606a';
  for (const px of [72, 1008]) ctx.fillRect(px - 5, y1, 10, GROUND_Y + 150 - y1);
}

function crateTower(ctx, x, y, rows, cols, colors) {
  // két bia nhựa chất cao (không nhãn hiệu)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = x + c * 56 + (r % 2) * 6;
      const by = y - (r + 1) * 34;
      const col = colors[(r + c) % colors.length];
      ctx.fillStyle = col;
      rr(ctx, bx, by, 54, 32, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(bx + 8, by + 6, 38, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(bx, by, 54, 3);
      ctx.fillStyle = '#5a3a14';
      for (let b = 0; b < 4; b++) {
        ctx.beginPath();
        ctx.arc(bx + 10 + b * 11, by + 2, 3.5, 0, TAU);
        ctx.fill();
      }
    }
  }
}

function grillCart(ctx) {
  // xe nướng than góc phải
  const x = 985;
  const y = 1075;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.75, 0.75);
  ctx.translate(-x, -y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 110, 14, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9aa4ab';
  rr(ctx, x - 100, y - 120, 200, 70, 6);
  ctx.fill();
  ctx.fillStyle = '#6b757c';
  ctx.fillRect(x - 100, y - 70, 200, 14);
  ctx.fillStyle = '#4b555c';
  ctx.fillRect(x - 90, y - 56, 10, 56);
  ctx.fillRect(x + 80, y - 56, 10, 56);
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - 70, y - 4, 14, 0, TAU);
  ctx.arc(x + 70, y - 4, 14, 0, TAU);
  ctx.fill();
  // than hồng + vỉ
  ctx.fillStyle = '#ff5722';
  ctx.fillRect(x - 88, y - 126, 176, 10);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 86 + i * 15, y - 130);
    ctx.lineTo(x - 86 + i * 15, y - 116);
    ctx.stroke();
  }
  // xiên thịt
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = '#8d4a23';
    rr(ctx, x - 80 + i * 28, y - 136, 20, 9, 3);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NƯỚNG', x, y - 78);
  ctx.restore();
}

function beerFloor(ctx) {
  const top = GROUND_Y;
  const g = ctx.createLinearGradient(0, top, 0, CURB_Y);
  g.addColorStop(0, '#5a5560');
  g.addColorStop(1, '#6e6870');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, CURB_Y - top);
  // ô gạch xi măng lớn theo phối cảnh
  const vpX = W / 2;
  const vpY = 300;
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 2;
  for (let c = -12; c <= 12; c++) {
    ctx.beginPath();
    ctx.moveTo(vpX + c * 150 * ((top - vpY) / (1300 - vpY)), top);
    ctx.lineTo(vpX + c * 150 * ((CURB_Y - vpY) / (1300 - vpY)), CURB_Y);
    ctx.stroke();
  }
  let y = top;
  while (y < CURB_Y) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    y += 70 * scaleAtY(y) + 10;
  }
  // vũng bia loang + vỏ lạc + giấy ăn
  const rnd = seeded(7);
  for (let i = 0; i < 14; i++) {
    const x = rnd() * W;
    const yy = top + 60 + rnd() * (CURB_Y - top - 100);
    const s = scaleAtY(yy);
    ctx.fillStyle = 'rgba(255,200,90,0.12)';
    ctx.beginPath();
    ctx.ellipse(x, yy, (30 + rnd() * 40) * s, (8 + rnd() * 6) * s, 0, 0, TAU);
    ctx.fill();
  }
  for (let i = 0; i < 70; i++) {
    const x = rnd() * W;
    const yy = top + 20 + rnd() * (CURB_Y - top - 40);
    const s = scaleAtY(yy);
    const k = rnd();
    ctx.fillStyle = k < 0.6 ? '#b88a52' : k < 0.85 ? 'rgba(255,255,255,0.85)' : '#c9c2b0';
    ctx.beginPath();
    if (k < 0.6) ctx.ellipse(x, yy, 4 * s, 2.4 * s, rnd() * 3, 0, TAU);
    else ctx.rect(x, yy, 9 * s, 7 * s);
    ctx.fill();
  }
  // vùng sáng ấm dưới mái bạt
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [lx, ly, lr, a] of [[540, 1000, 560, 0.2], [200, 1300, 380, 0.1], [880, 1300, 380, 0.1], [540, 1500, 520, 0.08]]) {
    const rg = ctx.createRadialGradient(lx, ly, 10, lx, ly, lr);
    rg.addColorStop(0, `rgba(255,190,100,${a})`);
    rg.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, top, W, CURB_Y - top);
  }
  ctx.restore();
}

function nightRoad(ctx) {
  ctx.fillStyle = '#8d8a92';
  ctx.fillRect(0, CURB_Y, W, ROAD_Y - CURB_Y);
  for (let x = 0; x < W; x += 90) {
    ctx.fillStyle = (x / 90) % 2 ? '#d9d4c8' : '#b8352e';
    ctx.fillRect(x, CURB_Y, 90, 10);
  }
  const g = ctx.createLinearGradient(0, ROAD_Y, 0, H);
  g.addColorStop(0, '#1d1d24');
  g.addColorStop(1, '#141419');
  ctx.fillStyle = g;
  ctx.fillRect(0, ROAD_Y, W, H - ROAD_Y);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let x = 20; x < W; x += 140) ctx.fillRect(x, ROAD_Y + 92, 70, 6);
  // ánh đèn quán hắt ra mặt đường
  const rg = ctx.createLinearGradient(0, ROAD_Y, 0, ROAD_Y + 140);
  rg.addColorStop(0, 'rgba(255,170,80,0.18)');
  rg.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, ROAD_Y, W, 140);
}

export function drawCanopy(ctx, t = 0) {
  // lớp trên: dây bóng đèn tròn võng dưới mái bạt + khói xe nướng
  ctx.save();
  const strings = [[60, 1020, 625, 36], [60, 1020, 668, 26]];
  strings.forEach(([xa, xb, y, sag], si) => {
    ctx.strokeStyle = 'rgba(20,20,20,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= 4; k++) {
      const segA = xa + ((xb - xa) * k) / 4;
      if (k === 0) ctx.moveTo(segA, y);
      else ctx.quadraticCurveTo(segA - (xb - xa) / 8, y + sag, segA, y);
    }
    ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const u = (i + 0.5) / 24;
      const px = xa + (xb - xa) * u;
      const local = (u * 4) % 1;
      const py = y + sag * 4 * local * (1 - local) * 0.5 + 10;
      const on = Math.sin(t * 0.003 + i * 0.9 + si * 2) > -0.6;
      if (on) {
        ctx.fillStyle = 'rgba(255,214,120,0.25)';
        ctx.beginPath();
        ctx.arc(px, py, 16, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = on ? '#ffe9a6' : '#6a5a3e';
      ctx.beginPath();
      ctx.arc(px, py, 6.5, 0, TAU);
      ctx.fill();
    }
  });
  // khói than từ xe nướng
  for (let i = 0; i < 9; i++) {
    const k = ((t * 0.00025 + i / 9) % 1);
    const x = 985 + Math.sin(k * 6 + i) * 24 - k * 60;
    const y = 975 - k * 330;
    ctx.fillStyle = `rgba(210,210,220,${0.22 * (1 - k)})`;
    ctx.beginPath();
    ctx.arc(x, y, 18 + k * 50, 0, TAU);
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
  ctx.fillStyle = '#7d8a93';
  ctx.fillRect(x0 - 44 * s, y - 44 * s, x1 - x0 + 88 * s, 12 * s);
  ctx.fillStyle = '#cfd8dc';
  ctx.fillRect(x0 - 44 * s, y - 48 * s, x1 - x0 + 88 * s, 6 * s);
  ctx.fillStyle = '#546e7a';
  for (const xx of [x0 - 34 * s, x1 + 28 * s]) ctx.fillRect(xx, y - 34 * s, 7 * s, 34 * s);
  ctx.restore();
}

export function drawTable(ctx, table, glasses = 2) {
  const { x, y, s } = table;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 50, 10, 0, 0, TAU);
  ctx.fill();
  // bàn nhựa đỏ thấp, mặt vuông rộng
  ctx.fillStyle = '#9f1d1d';
  ctx.fillRect(-36, -40, 9, 42);
  ctx.fillRect(27, -40, 9, 42);
  ctx.fillStyle = '#d32f2f';
  rr(ctx, -48, -54, 96, 16, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(-44, -53, 88, 3);
  // đĩa lạc + đĩa vỏ
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.ellipse(0, -56, 16, 4.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#b8864b';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(-9 + i * 3.6, -58 - (i % 2) * 1.5, 2.4, 0, TAU);
    ctx.fill();
  }
  // cốc bia vại
  for (let i = 0; i < glasses; i++) {
    const gx = i === 0 ? -30 : 30;
    drawTeaGlass(ctx, gx, -54, 0.85, 0.8);
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
  if (!lemon) {
    // quai cốc vại
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(w0 + 4, -h * 0.5, 5.5, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
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
  // biển hộp đèn neon BIA HƠI gắn trên mặt tiền tầng 2
  const cx = 545;
  const y = 600;
  ctx.save();
  const flick = 0.85 + 0.15 * Math.sin(t * 0.012) * Math.sin(t * 0.0031);
  ctx.fillStyle = '#12151f';
  rr(ctx, cx - 150, y, 300, 84, 14);
  ctx.strokeStyle = '#37474f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 120, y);
  ctx.lineTo(cx - 120, 592);
  ctx.moveTo(cx + 120, y);
  ctx.lineTo(cx + 120, 592);
  ctx.stroke();
  ctx.fill();
  ctx.strokeStyle = `rgba(255,64,129,${flick})`;
  ctx.lineWidth = 6;
  ctx.shadowColor = '#ff4081';
  ctx.shadowBlur = 24 * flick;
  rr(ctx, cx - 142, y + 7, 284, 70, 11);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,235,59,${flick})`;
  ctx.font = '900 46px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ffeb3b';
  ctx.shadowBlur = 20 * flick;
  ctx.fillText('BIA HƠI', cx - 30, y + 44);
  ctx.shadowBlur = 0;
  // cốc bia neon nhấp nháy bên cạnh chữ
  const on = Math.sin(t * 0.004) > -0.3;
  ctx.strokeStyle = on ? '#4dd0e1' : 'rgba(77,208,225,0.3)';
  ctx.shadowColor = '#4dd0e1';
  ctx.shadowBlur = on ? 14 : 0;
  ctx.lineWidth = 5;
  const gx = cx + 95;
  ctx.strokeRect(gx - 16, y + 24, 32, 42);
  ctx.beginPath();
  ctx.arc(gx + 20, y + 45, 10, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = on ? 'rgba(255,214,79,0.9)' : 'rgba(255,214,79,0.3)';
  ctx.fillRect(gx - 12, y + 36, 24, 28);
  ctx.fillStyle = on ? '#fff' : 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(gx - 8, y + 30, 7, 0, TAU);
  ctx.arc(gx + 3, y + 28, 8, 0, TAU);
  ctx.arc(gx + 11, y + 31, 6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawStallFront(ctx) {
  // quầy chủ quán: thùng bia hơi inox có vòi, két bia xếp chồng, đĩa mồi, bảng giá
  const { x, y } = STALL;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 240, 16, 0, 0, TAU);
  ctx.fill();
  // quầy inox
  ctx.fillStyle = '#90a4ae';
  rr(ctx, x - 220, y - 70, 440, 22, 6);
  ctx.fill();
  ctx.fillStyle = '#eceff1';
  ctx.fillRect(x - 220, y - 72, 440, 6);
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(x - 204, y - 50, 14, 52);
  ctx.fillRect(x + 190, y - 50, 14, 52);
  const sg = ctx.createLinearGradient(0, y - 48, 0, y - 8);
  sg.addColorStop(0, '#b0bec5');
  sg.addColorStop(1, '#78909c');
  ctx.fillStyle = sg;
  ctx.fillRect(x - 220, y - 48, 440, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 8; i++) ctx.fillRect(x - 200 + i * 55, y - 44, 3, 32);
  // két bia xếp chồng bên trái
  const kx = STALL.jarX;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      const bx = kx - 52 + c * 54 + (r % 2) * 8;
      const by = y - 72 - r * 28;
      ctx.fillStyle = '#e53935';
      rr(ctx, bx, by - 26, 50, 26, 3);
      ctx.fill();
      ctx.fillStyle = '#ffd54f';
      for (let b = 0; b < 4; b++) {
        ctx.beginPath();
        ctx.arc(bx + 8 + b * 11, by - 18, 4.5, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(bx, by - 8, 50, 8);
    }
  }
  // thùng bia hơi inox
  const jx = STALL.jugX;
  ctx.fillStyle = '#b0bec5';
  rr(ctx, jx - 34, y - 148, 68, 78, 14);
  ctx.fill();
  ctx.fillStyle = '#eceff1';
  ctx.fillRect(jx - 26, y - 140, 10, 64);
  ctx.fillStyle = '#78909c';
  ctx.fillRect(jx - 36, y - 122, 72, 6);
  ctx.fillRect(jx - 36, y - 98, 72, 6);
  ctx.fillStyle = '#455a64';
  ctx.fillRect(jx - 8, y - 82, 16, 8);
  ctx.fillRect(jx - 4, y - 76, 8, 14);
  // đĩa mồi: lạc, nem chua
  const px = STALL.pipeX;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(px - 30, y - 74, 28, 7, 0, 0, TAU);
  ctx.ellipse(px + 30, y - 74, 28, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c58a3a';
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.arc(px - 46 + i * 4, y - 80, 3.2, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#c0392b';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(px + 18 + i * 10, y - 81, 5, 4, 0, 0, TAU);
    ctx.fill();
  }
  // bảng phấn
  ctx.fillStyle = '#263238';
  rr(ctx, px - 20, y - 150, 100, 60, 4);
  ctx.fill();
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#eceff1';
  ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Bia hơi 10k', px - 12, y - 130);
  ctx.fillText('Lạc rang 20k', px - 12, y - 114);
  ctx.fillText('Nem chua 30k', px - 12, y - 98);
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
  skyline(ctx);
  if (flags.showHouses !== false) {
    sideBuilding(ctx, -20, 150, 300);
    sideBuilding(ctx, 950, 150, 320);
    beerHall(ctx);
  }
  if (flags.showUmbrella !== false) awning(ctx);
  beerFloor(ctx);
  // két bia chất cao góc trái sau ghế băng
  crateTower(ctx, -6, 905, 5, 2, ['#f9a825', '#2e7d32', '#c62828']);
  if (flags.showTree !== false) grillCart(ctx);
  nightRoad(ctx);
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
  ctx.restore();
}
