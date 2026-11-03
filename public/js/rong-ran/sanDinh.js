// Cảnh "Rồng rắn lên mây": sân đình làng ngày hội, mái đình cong, cây đa, luỹ tre,
// sân gạch đỏ, dây cờ ngũ sắc, góc nhà thầy thuốc. Tất cả vẽ bằng code.
export const W = 1080;
export const H = 1920;
export const HORIZON_Y = 640; // chân đình
const TAU = Math.PI * 2;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// tỉ lệ nhân vật theo độ sâu (xa nhỏ, gần to)
export function scaleAtY(y) {
  return lerp(0.6, 1.0, clamp((y - 720) / (1600 - 720), 0, 1));
}

// sân chơi cho rồng (toạ độ chân nhân vật)
export const YARD = { x0: 160, x1: 920, y0: 860, y1: 1560 };
// góc nhà thầy thuốc: chiếu ngồi cho người bị bắt
export const DOCTOR_HOME = { x: 200, y: 760 };
export const MAT = { x: 40, y: 700, w: 280, h: 96 };
export function matSpot(i) {
  const col = i % 5;
  const row = Math.floor(i / 5) % 2;
  return { x: MAT.x + 36 + col * 50 + row * 20, y: MAT.y + 40 + row * 34 };
}

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
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5) >>> 0;
    return (s & 0xffffff) / 0x1000000;
  };
}

// ------------------------------------------------------------------ bầu trời, mây
function drawSky(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
  g.addColorStop(0, '#7ec8f0');
  g.addColorStop(0.55, '#bfe6f7');
  g.addColorStop(1, '#fbe9c4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, HORIZON_Y + 4);
  // mặt trời sớm
  const sun = ctx.createRadialGradient(170, 330, 10, 170, 330, 170);
  sun.addColorStop(0, 'rgba(255,248,214,1)');
  sun.addColorStop(0.25, 'rgba(255,236,170,0.8)');
  sun.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 160, 360, 360);
}

export function cloud(ctx, x, y, s, alpha = 0.9, color = '#ffffff') {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [dx, dy, r] of [[-60, 6, 34], [-24, -14, 44], [22, -20, 50], [64, 0, 36], [0, 12, 40], [-40, 18, 28], [44, 18, 30]]) {
    ctx.moveTo(x + dx * s + r * s, y + dy * s);
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
  }
  ctx.fill();
  // viền cuộn kiểu mây trang trí
  ctx.strokeStyle = 'rgba(160,190,220,0.35)';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.arc(x - 24 * s, y - 10 * s, 18 * s, Math.PI * 0.2, Math.PI * 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 22 * s, y - 16 * s, 22 * s, Math.PI * 1.5, Math.PI * 2.6);
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ luỹ tre
function drawBamboo(ctx) {
  const rnd = seeded(7);
  for (let layer = 0; layer < 2; layer++) {
    ctx.fillStyle = layer === 0 ? '#7aa36a' : '#5b8a4e';
    for (let x = -40; x < W + 40; x += 26) {
      const h = 140 + rnd() * 120 - layer * 40;
      const base = HORIZON_Y + 4;
      ctx.beginPath();
      ctx.moveTo(x - 30, base);
      ctx.quadraticCurveTo(x + rnd() * 30 - 15, base - h * 0.6, x + (rnd() - 0.5) * 40, base - h);
      ctx.quadraticCurveTo(x + 20, base - h * 0.5, x + 34, base);
      ctx.fill();
    }
  }
  // thân tre
  ctx.strokeStyle = 'rgba(70,100,50,0.6)';
  ctx.lineWidth = 3;
  for (let x = 10; x < W; x += 47) {
    ctx.beginPath();
    ctx.moveTo(x, HORIZON_Y);
    ctx.quadraticCurveTo(x + 6, HORIZON_Y - 90, x + 18 * Math.sin(x), HORIZON_Y - 170 - (x % 5) * 10);
    ctx.stroke();
  }
}

// ------------------------------------------------------------------ đình làng
function drawDinh(ctx) {
  const cx = 540;
  const base = HORIZON_Y;
  // bậc thềm đá
  ctx.fillStyle = '#b9ad98';
  rr(ctx, cx - 330, base - 24, 660, 30, 4);
  ctx.fill();
  ctx.fillStyle = '#a39782';
  ctx.fillRect(cx - 300, base - 6, 600, 12);
  ctx.fillStyle = '#cfc4ae';
  ctx.fillRect(cx - 330, base - 24, 660, 5);
  // thân đình
  ctx.fillStyle = '#8a4b2a';
  ctx.fillRect(cx - 290, base - 150, 580, 128);
  // cửa bức bàn
  for (let i = -3; i <= 3; i++) {
    const x = cx + i * 76 - 32;
    ctx.fillStyle = i === 0 ? '#5d2a14' : '#6e3519';
    ctx.fillRect(x, base - 140, 64, 116);
    ctx.strokeStyle = '#a8673d';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, base - 136, 56, 108);
    ctx.fillStyle = 'rgba(255,214,140,0.25)';
    for (let k = 0; k < 4; k++) ctx.fillRect(x + 10, base - 128 + k * 10, 44, 3);
  }
  // cột đỏ
  ctx.fillStyle = '#b3261e';
  for (let i = -4; i <= 4; i++) {
    const x = cx + i * 76 + (i < 0 ? 0 : 0);
    if (Math.abs(i) === 4) continue;
    ctx.fillRect(x - 38 - 7, base - 160, 14, 138);
  }
  ctx.fillRect(cx - 300, base - 160, 16, 138);
  ctx.fillRect(cx + 284, base - 160, 16, 138);
  // hoành phi
  ctx.fillStyle = '#7a1d14';
  rr(ctx, cx - 110, base - 186, 220, 36, 6);
  ctx.fill();
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffd54a';
  ctx.font = '900 22px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ĐÌNH LÀNG', cx, base - 167);

  // mái đình: hai tầng mái cong, đầu đao vút lên
  const roof = (top, bottom, half, flare, color, edge) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.62, top);
    ctx.lineTo(cx + half * 0.62, top);
    ctx.quadraticCurveTo(cx + half * 0.8, bottom - 10, cx + half, bottom - flare);
    ctx.quadraticCurveTo(cx + half * 0.96, bottom + 6, cx + half * 0.82, bottom + 6);
    ctx.lineTo(cx - half * 0.82, bottom + 6);
    ctx.quadraticCurveTo(cx - half * 0.96, bottom + 6, cx - half, bottom - flare);
    ctx.quadraticCurveTo(cx - half * 0.8, bottom - 10, cx - half * 0.62, top);
    ctx.closePath();
    ctx.fill();
    // ngói âm dương
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 3;
    for (let x = cx - half; x < cx + half; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + (x - cx) * 0.18, bottom + 6);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let y = top + 10; y < bottom; y += 12) {
      ctx.beginPath();
      ctx.moveTo(cx - half, y);
      ctx.lineTo(cx + half, y);
      ctx.stroke();
    }
    ctx.restore();
    // diềm mái
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.82, bottom + 2);
    ctx.lineTo(cx + half * 0.82, bottom + 2);
    ctx.quadraticCurveTo(cx + half * 0.96, bottom + 2, cx + half, bottom - flare);
    ctx.lineTo(cx + half + 10, bottom - flare - 22);
    ctx.quadraticCurveTo(cx + half * 0.98, bottom + 16, cx + half * 0.82, bottom + 14);
    ctx.lineTo(cx - half * 0.82, bottom + 14);
    ctx.quadraticCurveTo(cx - half * 0.98, bottom + 16, cx - half - 10, bottom - flare - 22);
    ctx.lineTo(cx - half, bottom - flare);
    ctx.quadraticCurveTo(cx - half * 0.96, bottom + 2, cx - half * 0.82, bottom + 2);
    ctx.fill();
  };
  roof(base - 270, base - 160, 400, 46, '#5a3a33', '#3b2420');
  roof(base - 340, base - 262, 300, 40, '#64413a', '#3b2420');
  // bờ nóc + lưỡng long chầu nguyệt
  const ridgeY = base - 346;
  ctx.fillStyle = '#3b2420';
  rr(ctx, cx - 200, ridgeY - 14, 400, 20, 8);
  ctx.fill();
  // mặt trăng
  ctx.fillStyle = '#ffd54a';
  ctx.beginPath();
  ctx.arc(cx, ridgeY - 30, 18, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ff8f00';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 22, ridgeY - 30 + Math.sin(a) * 22);
    ctx.lineTo(cx + Math.cos(a) * 30, ridgeY - 30 + Math.sin(a) * 30);
    ctx.stroke();
  }
  // hai con rồng uốn lượn
  for (const sx of [-1, 1]) {
    ctx.strokeStyle = '#2f7d4a';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + sx * 190, ridgeY - 4);
    ctx.bezierCurveTo(cx + sx * 150, ridgeY - 44, cx + sx * 110, ridgeY + 6, cx + sx * 80, ridgeY - 30);
    ctx.bezierCurveTo(cx + sx * 64, ridgeY - 50, cx + sx * 50, ridgeY - 40, cx + sx * 40, ridgeY - 34);
    ctx.stroke();
    ctx.fillStyle = '#2f7d4a';
    ctx.beginPath();
    ctx.ellipse(cx + sx * 40, ridgeY - 36, 12, 9, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ffd54a';
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const x = cx + sx * (170 - k * 26);
      ctx.beginPath();
      ctx.moveTo(x, ridgeY - 20 - (k % 2) * 14);
      ctx.lineTo(x + sx * 6, ridgeY - 32 - (k % 2) * 14);
      ctx.stroke();
    }
  }
  // đầu đao trang trí
  for (const [x, y] of [[cx - 410, base - 228], [cx + 410, base - 228], [cx - 310, base - 316], [cx + 310, base - 316]]) {
    ctx.fillStyle = '#2f7d4a';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, TAU);
    ctx.fill();
  }
  // đèn lồng đỏ treo hiên
  for (const x of [cx - 228, cx - 76, cx + 76, cx + 228]) {
    ctx.strokeStyle = '#3b2420';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, base - 160);
    ctx.lineTo(x, base - 140);
    ctx.stroke();
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.ellipse(x, base - 124, 15, 18, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd54a';
    ctx.fillRect(x - 8, base - 144, 16, 4);
    ctx.fillRect(x - 8, base - 108, 16, 4);
  }
}

// ------------------------------------------------------------------ cây đa
function drawBanyan(ctx) {
  const tx = 990;
  const base = 760;
  // rễ phụ
  ctx.strokeStyle = '#6d5236';
  ctx.lineWidth = 3;
  const rnd = seeded(31);
  for (let i = 0; i < 18; i++) {
    const x = 850 + rnd() * 240;
    ctx.beginPath();
    ctx.moveTo(x, 420 + rnd() * 80);
    ctx.lineTo(x + (rnd() - 0.5) * 10, 560 + rnd() * 160);
    ctx.stroke();
  }
  // thân
  ctx.fillStyle = '#6b4e33';
  ctx.beginPath();
  ctx.moveTo(tx - 90, base + 10);
  ctx.quadraticCurveTo(tx - 50, base - 120, tx - 60, 440);
  ctx.lineTo(tx + 60, 440);
  ctx.quadraticCurveTo(tx + 60, base - 120, tx + 110, base + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,25,10,0.35)';
  ctx.lineWidth = 4;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(tx + i * 18, base);
    ctx.quadraticCurveTo(tx + i * 12 + 6, base - 150, tx + i * 14, 450);
    ctx.stroke();
  }
  // tán lá
  const blobs = [];
  for (let i = 0; i < 26; i++) blobs.push([780 + rnd() * 320, 250 + rnd() * 250, 50 + rnd() * 50]);
  for (const [shade, dy] of [['#2e6b34', 8], ['#3f8a43', 0], ['#58a556', -10]]) {
    ctx.fillStyle = shade;
    ctx.beginPath();
    for (const [x, y, r] of blobs) {
      ctx.moveTo(x + r, y + dy);
      ctx.arc(x, y + dy, r * (shade === '#58a556' ? 0.55 : 1), 0, TAU);
    }
    ctx.fill();
  }
  // bóng râm dưới gốc
  ctx.fillStyle = 'rgba(30,40,10,0.18)';
  ctx.beginPath();
  ctx.ellipse(950, base + 20, 200, 38, 0, 0, TAU);
  ctx.fill();
  // bệ gốc đa
  ctx.fillStyle = '#9e9583';
  rr(ctx, tx - 130, base - 6, 260, 30, 6);
  ctx.fill();
  ctx.fillStyle = '#b8af9b';
  ctx.fillRect(tx - 130, base - 6, 260, 6);
}

// ------------------------------------------------------------------ sân gạch
function drawYard(ctx) {
  const g = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
  g.addColorStop(0, '#c9875c');
  g.addColorStop(1, '#b8653f');
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);
  // hàng gạch theo phối cảnh
  const vx = 540;
  const vy = 120;
  let y = HORIZON_Y + 4;
  let row = 0;
  const rnd = seeded(99);
  while (y < H) {
    const h = 10 + (y - HORIZON_Y) * 0.05;
    const s = (y - vy) / (HORIZON_Y - vy);
    const bw = 64 * s;
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -bw + off - ((vx * s) % bw); x < W + bw; x += bw) {
      const shade = rnd() * 0.12;
      ctx.fillStyle = `rgba(${rnd() < 0.5 ? '120,50,20' : '255,220,190'},${shade})`;
      ctx.fillRect(x + 1, y + 1, bw - 2, h - 2);
    }
    ctx.strokeStyle = 'rgba(90,45,25,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.beginPath();
    for (let x = -bw + off - ((vx * s) % bw); x < W + bw; x += bw) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + h);
    }
    ctx.stroke();
    y += h;
    row++;
  }
  // nắng loang
  const light = ctx.createRadialGradient(420, 1100, 60, 420, 1100, 720);
  light.addColorStop(0, 'rgba(255,240,200,0.22)');
  light.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);
  // vòng phấn vẽ sân chơi
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 5;
  ctx.setLineDash([22, 16]);
  ctx.beginPath();
  ctx.ellipse(540, 1200, 430, 330, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ------------------------------------------------------------------ góc nhà thầy thuốc
function drawDoctorCorner(ctx) {
  // chiếu cói
  ctx.save();
  ctx.fillStyle = '#e6cf8f';
  rr(ctx, MAT.x, MAT.y, MAT.w, MAT.h, 6);
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(160,110,40,0.35)';
  ctx.lineWidth = 2;
  for (let x = MAT.x; x < MAT.x + MAT.w; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, MAT.y);
    ctx.lineTo(x, MAT.y + MAT.h);
    ctx.stroke();
  }
  ctx.strokeStyle = '#c62828';
  ctx.lineWidth = 6;
  ctx.strokeRect(MAT.x + 8, MAT.y + 8, MAT.w - 16, MAT.h - 16);
  ctx.restore();
  // bếp sắc thuốc
  const sx = 300;
  const sy = 690;
  ctx.fillStyle = '#5d4037';
  for (const dx of [-16, 0, 16]) {
    ctx.beginPath();
    ctx.ellipse(sx + dx, sy + 4, 8, 6, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#8d4a2b';
  ctx.beginPath();
  ctx.ellipse(sx, sy - 14, 24, 20, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#6d3a22';
  ctx.fillRect(sx - 10, sy - 38, 20, 8);
  ctx.strokeStyle = '#6d3a22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx + 22, sy - 20);
  ctx.lineTo(sx + 36, sy - 30);
  ctx.stroke();
  // bảng tên
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(56, 600, 6, 100);
  ctx.fillStyle = '#fff3d6';
  rr(ctx, 14, 586, 220, 40, 6);
  ctx.fill();
  ctx.strokeStyle = '#8d4a2b';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#8d2a1a';
  ctx.font = '900 17px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NHÀ THẦY THUỐC', 124, 607);
}

// đống rơm + chum nước
function drawProps(ctx) {
  // đống rơm bên trái
  const hx = 70;
  const hy = 1000;
  ctx.fillStyle = '#d9b44a';
  ctx.beginPath();
  ctx.moveTo(hx - 90, hy);
  ctx.quadraticCurveTo(hx - 80, hy - 150, hx, hy - 190);
  ctx.quadraticCurveTo(hx + 80, hy - 150, hx + 90, hy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,110,20,0.6)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    const x = hx - 80 + i * 6.4;
    ctx.beginPath();
    ctx.moveTo(x, hy - 4);
    ctx.lineTo(x + (x - hx) * 0.1, hy - 150 + Math.abs(x - hx) * 1.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#8d6e3a';
  ctx.fillRect(hx - 3, hy - 230, 6, 50);
  // chum nước bên phải
  const cx = 1010;
  const cy = 1080;
  ctx.fillStyle = '#6d4c3a';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 50, 50, 60, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#4e342e';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 104, 34, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx - 20, cy - 66, 8, 22, -0.3, 0, TAU);
  ctx.fill();
}

// dây cờ ngũ sắc (vẽ động để cờ bay)
const FLAG_COLORS = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#fb8c00'];
export function drawFlags(ctx, t = 0) {
  const lines = [
    [[0, 520], [300, 600], [540, 560], [780, 600], [1080, 500]],
  ];
  for (const pts of lines) {
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, y0] = pts[k];
      const [x1, y1] = pts[k + 1];
      const sag = 26;
      ctx.strokeStyle = 'rgba(60,40,30,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1);
      ctx.stroke();
      const n = 7;
      for (let i = 1; i < n; i++) {
        const u = i / n;
        const x = lerp(lerp(x0, (x0 + x1) / 2, u), lerp((x0 + x1) / 2, x1, u), u);
        const y = lerp(lerp(y0, (y0 + y1) / 2 + sag, u), lerp((y0 + y1) / 2 + sag, y1, u), u);
        const flap = Math.sin(t * 0.004 + x * 0.05) * 5;
        ctx.fillStyle = FLAG_COLORS[(k * n + i) % FLAG_COLORS.length];
        ctx.beginPath();
        ctx.moveTo(x - 11, y);
        ctx.lineTo(x + 11, y);
        ctx.lineTo(x + flap, y + 30);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

export function drawStatic(ctx) {
  drawSky(ctx);
  cloud(ctx, 760, 330, 0.9, 0.85);
  cloud(ctx, 420, 290, 0.6, 0.7);
  drawBamboo(ctx);
  drawYard(ctx);
  drawDinh(ctx);
  drawBanyan(ctx);
  drawDoctorCorner(ctx);
  drawProps(ctx);
}

// ------------------------------------------------------------------ rồng vàng (khi lên mây)
// pts: các điểm từ đầu tới đuôi (toạ độ màn hình), s: độ dày
export function drawDragonBody(ctx, pts, s, t, alpha = 1) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  };
  ctx.strokeStyle = '#b26a00';
  ctx.lineWidth = 64 * s;
  path();
  ctx.stroke();
  ctx.strokeStyle = '#ffc107';
  ctx.lineWidth = 52 * s;
  path();
  ctx.stroke();
  ctx.strokeStyle = '#fff176';
  ctx.lineWidth = 16 * s;
  path();
  ctx.stroke();
  // vảy + vây lưng
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(b.x + nx * 24 * s - Math.cos(ang) * 10 * s, b.y + ny * 24 * s - Math.sin(ang) * 10 * s);
    ctx.lineTo(b.x - nx * (44 + Math.sin(t * 0.01 + i) * 6) * s * -1, b.y - ny * (44 + Math.sin(t * 0.01 + i) * 6) * s * -1);
    ctx.lineTo(b.x + nx * 24 * s + Math.cos(ang) * 10 * s, b.y + ny * 24 * s + Math.sin(ang) * 10 * s);
    ctx.fill();
  }
  // đuôi
  const e = pts[pts.length - 1];
  const p = pts[pts.length - 2];
  const ang = Math.atan2(e.y - p.y, e.x - p.x);
  ctx.fillStyle = '#ff7043';
  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  ctx.lineTo(e.x + Math.cos(ang + 0.6) * 70 * s, e.y + Math.sin(ang + 0.6) * 70 * s);
  ctx.lineTo(e.x + Math.cos(ang) * 40 * s, e.y + Math.sin(ang) * 40 * s);
  ctx.lineTo(e.x + Math.cos(ang - 0.6) * 70 * s, e.y + Math.sin(ang - 0.6) * 70 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// đầu rồng lớn (khi bay lên mây), hướng theo dir (radian)
export function drawDragonHead(ctx, x, y, s, dir, t) {
  ctx.save();
  ctx.translate(x, y);
  const flip = Math.cos(dir) < 0 ? -1 : 1;
  ctx.scale(s * flip, s);
  // bờm lửa
  ctx.fillStyle = '#ff7043';
  for (let i = 0; i < 7; i++) {
    const a = -2.6 + i * 0.35;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-20 + Math.cos(a) * (90 + Math.sin(t * 0.01 + i) * 10), Math.sin(a) * (90 + Math.sin(t * 0.01 + i) * 10));
    ctx.lineTo(-20 + Math.cos(a + 0.2) * 40, Math.sin(a + 0.2) * 40);
    ctx.fill();
  }
  // sừng
  ctx.strokeStyle = '#fff3c4';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -36);
  ctx.quadraticCurveTo(-40, -90, -90, -96);
  ctx.moveTo(14, -38);
  ctx.quadraticCurveTo(0, -100, -40, -120);
  ctx.stroke();
  // đầu
  ctx.fillStyle = '#ffc107';
  ctx.beginPath();
  ctx.ellipse(0, 0, 62, 46, 0, 0, TAU);
  ctx.fill();
  // mõm
  ctx.fillStyle = '#ffb300';
  rr(ctx, 20, -20, 78, 46, 20);
  ctx.fill();
  ctx.fillStyle = '#d32f2f';
  const jaw = 8 + Math.abs(Math.sin(t * 0.006)) * 10;
  rr(ctx, 26, 16, 70, jaw, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(32 + i * 13, 16);
    ctx.lineTo(37 + i * 13, 26);
    ctx.lineTo(42 + i * 13, 16);
    ctx.fill();
  }
  // mũi
  ctx.fillStyle = '#e65100';
  ctx.beginPath();
  ctx.arc(92, -12, 7, 0, TAU);
  ctx.fill();
  // mắt
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(18, -22, 16, 13, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.arc(22, -22, 7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(24, -25, 2.5, 0, TAU);
  ctx.fill();
  // râu
  ctx.strokeStyle = '#fff3c4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(86, -4);
  ctx.bezierCurveTo(130, -10, 120, 40 + Math.sin(t * 0.008) * 12, 170, 30);
  ctx.moveTo(80, 6);
  ctx.bezierCurveTo(110, 30, 90, 70 + Math.sin(t * 0.007) * 10, 140, 80);
  ctx.stroke();
  ctx.restore();
}
