// Bối cảnh Thủ thành Cổ Loa (khung dọc 1080x1920), vẽ hoàn toàn bằng code.
// Trên: trời bình minh, núi xa, rừng sương nơi yêu quái kéo ra. Giữa: đồng cỏ, đường đất, con sông nhỏ.
// Dưới: tường thành đất đắp, hàng rào gỗ, cổng thành có vọng lâu, sân trong thành.
export const W = 1080;
export const H = 1920;
// Tường thành đặt cao (y≈1030) vì phần dưới màn hình điện thoại bị khung bình luận TikTok che.
export const FOREST_Y = 380; // yêu quái bước ra từ bìa rừng
export const RIVER_Y = 610; // con sông vắt ngang
export const WALL_Y = 1030; // mép trước tường thành
export const STOP_Y = WALL_Y - 18; // yêu quái dừng lại đập tường
export const WALL_BOTTOM = WALL_Y + 200;
export const GATE_X = 540;
export const ROW_Y = [WALL_Y + 54, WALL_Y + 102, WALL_Y + 152]; // 3 hàng chỗ lính đứng (chân)
export const TOWER_X = [62, 1018];
export const TOWER_FEET = WALL_Y - 14;

const TAU = Math.PI * 2;
const INK = '#2a1d14';

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// pseudo-random ổn định để cảnh tĩnh không đổi mỗi lần vẽ
let seed = 7;
function srand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// tọa độ x của đường đất ở độ cao y (uốn lượn từ bìa rừng xuống cổng)
export function roadX(y) {
  const k = Math.max(0, Math.min(1, (y - FOREST_Y) / (STOP_Y - FOREST_Y)));
  return GATE_X + Math.sin(k * 5.2 + 0.6) * 150 * (1 - k * 0.85);
}

function drawSky(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 420);
  g.addColorStop(0, '#2c3e78');
  g.addColorStop(0.45, '#c46d7a');
  g.addColorStop(0.75, '#f5b56b');
  g.addColorStop(1, '#ffe2a6');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 420);
  // mặt trời mọc
  const sg = ctx.createRadialGradient(760, 300, 10, 760, 300, 200);
  sg.addColorStop(0, 'rgba(255,248,214,1)');
  sg.addColorStop(0.25, 'rgba(255,220,150,0.8)');
  sg.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(500, 80, 520, 340);
  // núi xa nhiều lớp
  const layers = [
    ['#7d6a8f', 250, 70],
    ['#5e5679', 290, 60],
    ['#3f4a63', 330, 46],
  ];
  layers.forEach(([c, base, amp], li) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, 420);
    for (let x = 0; x <= W; x += 20) {
      const y = base - Math.abs(Math.sin(x * 0.006 + li * 1.7)) * amp - Math.sin(x * 0.021 + li) * amp * 0.25;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, 420);
    ctx.closePath();
    ctx.fill();
  });
}

function tree(ctx, x, y, s, dark) {
  ctx.fillStyle = '#3b2a1c';
  ctx.fillRect(x - 3 * s, y - 14 * s, 6 * s, 16 * s);
  ctx.fillStyle = dark ? '#1f3f2a' : '#2f5d36';
  ctx.beginPath();
  ctx.arc(x, y - 26 * s, 18 * s, 0, TAU);
  ctx.arc(x - 13 * s, y - 16 * s, 13 * s, 0, TAU);
  ctx.arc(x + 13 * s, y - 16 * s, 13 * s, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,30,20,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawField(ctx) {
  const g = ctx.createLinearGradient(0, 330, 0, WALL_Y);
  g.addColorStop(0, '#5f8f45');
  g.addColorStop(0.5, '#79a84f');
  g.addColorStop(1, '#8cb85c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 330, W, WALL_Y - 330 + 40);
  // ruộng lúa hai bên
  seed = 11;
  for (let i = 0; i < 14; i++) {
    const y = 700 + srand() * 380;
    const left = srand() < 0.5;
    const x = left ? 40 + srand() * 220 : 760 + srand() * 260;
    const w = 120 + srand() * 90;
    const h = 46 + srand() * 26;
    ctx.fillStyle = srand() < 0.5 ? '#a7c76a' : '#94bb5c';
    ctx.strokeStyle = 'rgba(80,110,40,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(70,110,40,0.35)';
    ctx.lineWidth = 1.5;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + 14, y + k * 8);
      ctx.lineTo(x + w / 2 - 14, y + k * 8);
      ctx.stroke();
    }
  }
  // đường đất uốn lượn
  ctx.lineCap = 'round';
  for (const [w, c] of [[120, '#8a6a3d'], [100, '#c9a368'], [60, '#d8b77d']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let y = FOREST_Y - 20; y <= WALL_Y + 10; y += 10) {
      const x = roadX(y);
      if (y === FOREST_Y - 20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // sông nhỏ vắt ngang
  ctx.lineCap = 'butt';
  const riverPath = () => {
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 20) {
      const y = RIVER_Y + Math.sin(x * 0.008) * 30;
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  };
  ctx.strokeStyle = '#6b5432';
  ctx.lineWidth = 78;
  riverPath();
  ctx.stroke();
  ctx.strokeStyle = '#3f8fc0';
  ctx.lineWidth = 64;
  riverPath();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,240,255,0.45)';
  ctx.lineWidth = 3;
  ctx.setLineDash([26, 30]);
  riverPath();
  ctx.stroke();
  ctx.setLineDash([]);
  // cầu gỗ trên đường
  const bx = roadX(RIVER_Y);
  const by = RIVER_Y + Math.sin(bx * 0.008) * 30;
  ctx.fillStyle = '#8b5a2b';
  rr(ctx, bx - 64, by - 44, 128, 88, 8);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,20,10,0.5)';
  ctx.lineWidth = 2;
  for (let k = -36; k <= 36; k += 12) {
    ctx.beginPath();
    ctx.moveTo(bx - 60, by + k);
    ctx.lineTo(bx + 60, by + k);
    ctx.stroke();
  }
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(bx - 70, by - 48, 10, 96);
  ctx.fillRect(bx + 60, by - 48, 10, 96);
  // đá, bụi cỏ
  seed = 23;
  for (let i = 0; i < 40; i++) {
    const x = srand() * W;
    const y = 400 + srand() * 700;
    if (Math.abs(x - roadX(y)) < 80 || Math.abs(y - RIVER_Y) < 60) continue;
    if (srand() < 0.5) {
      ctx.fillStyle = '#4f7a35';
      ctx.beginPath();
      ctx.arc(x, y, 10 + srand() * 8, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.fillStyle = '#9a9488';
      ctx.beginPath();
      ctx.ellipse(x, y, 10 + srand() * 8, 7, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,40,40,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  // bìa rừng sương mù nơi yêu quái kéo ra
  seed = 5;
  for (let row = 0; row < 3; row++) {
    for (let x = -20; x < W + 40; x += 46 + srand() * 20) {
      const y = 350 + row * 22 + srand() * 14;
      tree(ctx, x, y, 1.1 + row * 0.15 + srand() * 0.3, row < 2);
    }
  }
  const mist = ctx.createLinearGradient(0, 330, 0, 470);
  mist.addColorStop(0, 'rgba(230,225,240,0.0)');
  mist.addColorStop(0.5, 'rgba(230,225,240,0.45)');
  mist.addColorStop(1, 'rgba(230,225,240,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, 330, W, 140);
}

function drawWallBody(ctx) {
  // hào nước trước thành
  ctx.fillStyle = '#3a7aa0';
  ctx.fillRect(0, WALL_Y - 22, W, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let x = 10; x < W; x += 60) ctx.fillRect(x, WALL_Y - 14, 26, 3);
  // thân tường đất đắp kè đá ong
  const g = ctx.createLinearGradient(0, WALL_Y, 0, WALL_BOTTOM);
  g.addColorStop(0, '#b0703f');
  g.addColorStop(1, '#7c4a26');
  ctx.fillStyle = g;
  ctx.fillRect(0, WALL_Y, W, WALL_BOTTOM - WALL_Y);
  ctx.strokeStyle = 'rgba(60,30,10,0.45)';
  ctx.lineWidth = 2;
  for (let y = WALL_Y + 22, r = 0; y < WALL_BOTTOM; y += 24, r++) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    for (let x = (r % 2) * 30; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, y - 24);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  // lối đi trên tường (lính đứng)
  ctx.fillStyle = '#c9925a';
  ctx.fillRect(0, WALL_Y + 34, W, 128);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, WALL_Y + 34, W, 8);
  // lỗ châu mai phía trước
  ctx.fillStyle = '#9b5f33';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  for (let x = 0; x < W; x += 54) {
    rr(ctx, x + 4, WALL_Y - 4, 40, 42, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#7c4a26';
  ctx.fillRect(0, WALL_Y + 162, W, 12);
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, WALL_BOTTOM);
  ctx.lineTo(W, WALL_BOTTOM);
  ctx.stroke();
}

function drawYard(ctx) {
  const g = ctx.createLinearGradient(0, WALL_BOTTOM, 0, H);
  g.addColorStop(0, '#6f5a3c');
  g.addColorStop(1, '#4a3b28');
  ctx.fillStyle = g;
  ctx.fillRect(0, WALL_BOTTOM, W, H - WALL_BOTTOM);
  // sân lát gạch
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let y = WALL_BOTTOM + 40; y < H; y += 46) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // giếng / hồ rùa
  ctx.fillStyle = '#2e6e8e';
  ctx.beginPath();
  ctx.ellipse(220, 1660, 150, 60, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#8f8a7a';
  ctx.lineWidth = 10;
  ctx.stroke();
  // trống đồng lớn
  ctx.fillStyle = '#9c7a2e';
  ctx.beginPath();
  ctx.ellipse(860, 1640, 90, 34, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(770, 1640, 180, 60);
  ctx.beginPath();
  ctx.ellipse(860, 1700, 90, 34, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(860, 1640, 90, 34, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#e8c766';
  ctx.lineWidth = 2;
  for (const r of [20, 45, 70]) {
    ctx.beginPath();
    ctx.ellipse(860, 1640, r, r * 0.38, 0, 0, TAU);
    ctx.stroke();
  }
}

// vẽ tĩnh 1 lần ra canvas nền
export function drawStatic(ctx) {
  drawSky(ctx);
  drawField(ctx);
  drawWallBody(ctx);
  drawYard(ctx);
}

// ------------------------------------------------------------------ phần động
export function flag(ctx, x, y, h, color, t, text = '') {
  ctx.strokeStyle = '#4a2e14';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h);
  ctx.stroke();
  const fw = text ? Math.max(70, text.length * 13 + 20) : 54;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    ctx.lineTo(x + k * fw, y - h + Math.sin(t * 4 + k * 5) * 4 * k);
  }
  for (let i = 8; i >= 0; i--) {
    const k = i / 8;
    ctx.lineTo(x + k * fw, y - h + 30 + Math.sin(t * 4 + k * 5) * 4 * k);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (text) {
    ctx.fillStyle = '#fff';
    ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 8, y - h + 15);
  }
}

// cổng thành + vọng lâu (frac = máu thành còn lại 0..1, open = cổng mở 0..1)
export function drawGate(ctx, frac, t, hitT, open = 0, broken = false) {
  const shakeX = hitT && t - hitT < 0.25 ? Math.sin(t * 90) * 3 : 0;
  ctx.save();
  ctx.translate(shakeX, 0);
  const x = GATE_X;
  // trụ cổng
  ctx.fillStyle = '#8d5a33';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  rr(ctx, x - 120, WALL_Y - 70, 240, 240, 6);
  ctx.fill();
  ctx.stroke();
  // lòng cổng
  ctx.fillStyle = '#2b1a10';
  ctx.beginPath();
  ctx.moveTo(x - 70, WALL_Y + 170);
  ctx.lineTo(x - 70, WALL_Y + 20);
  ctx.arc(x, WALL_Y + 20, 70, Math.PI, 0);
  ctx.lineTo(x + 70, WALL_Y + 170);
  ctx.closePath();
  ctx.fill();
  // cánh cổng gỗ
  if (!broken) {
    const ow = 70 * (1 - open);
    ctx.fillStyle = frac < 0.3 ? '#7a4a24' : '#9b6331';
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - 70, WALL_Y + 170);
      ctx.lineTo(x - 70, WALL_Y + 20);
      ctx.arc(x, WALL_Y + 20, 70, Math.PI, 0);
      ctx.lineTo(x + 70, WALL_Y + 170);
      ctx.closePath();
      ctx.clip();
      const x0 = side < 0 ? x - 70 : x + 70 - ow;
      ctx.fillRect(x0, WALL_Y - 60, ow, 240);
      ctx.strokeStyle = 'rgba(40,20,5,0.6)';
      ctx.lineWidth = 2;
      for (let k = 1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x0 + (ow * k) / 4, WALL_Y - 60);
        ctx.lineTo(x0 + (ow * k) / 4, WALL_Y + 170);
        ctx.stroke();
      }
      ctx.fillStyle = '#e0b248';
      for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        ctx.arc(x0 + ow * (0.3 + j * 0.4), WALL_Y + 10 + k * 50, 4, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = frac < 0.3 ? '#7a4a24' : '#9b6331';
      ctx.restore();
    }
    // vết nứt khi yếu
    if (frac < 0.6) {
      ctx.strokeStyle = '#1a0e06';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 30, WALL_Y + 30);
      ctx.lineTo(x - 10, WALL_Y + 70);
      ctx.lineTo(x - 26, WALL_Y + 110);
      if (frac < 0.3) {
        ctx.moveTo(x + 40, WALL_Y + 10);
        ctx.lineTo(x + 18, WALL_Y + 60);
        ctx.lineTo(x + 38, WALL_Y + 120);
      }
      ctx.stroke();
    }
  } else {
    // mảnh gỗ vỡ
    ctx.fillStyle = '#6b3f1e';
    for (let k = 0; k < 6; k++) {
      ctx.save();
      ctx.translate(x - 60 + k * 24, WALL_Y + 150 - (k % 2) * 12);
      ctx.rotate(-0.6 + k * 0.25);
      ctx.fillRect(-16, -5, 32, 10);
      ctx.restore();
    }
  }
  // vọng lâu mái ngói cong
  ctx.fillStyle = '#a23b2a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  rr(ctx, x - 100, WALL_Y - 140, 200, 74, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5b2a1a';
  for (const cx of [-80, -26, 26, 80]) ctx.fillRect(x + cx - 6, WALL_Y - 136, 12, 70);
  ctx.fillStyle = '#ffd56a';
  ctx.font = '800 26px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2b1a10';
  rr(ctx, x - 62, WALL_Y - 122, 124, 36, 4);
  ctx.fill();
  ctx.fillStyle = '#ffd56a';
  ctx.fillText('CỔ LOA', x, WALL_Y - 103);
  // mái
  ctx.fillStyle = '#5a3a2a';
  ctx.beginPath();
  ctx.moveTo(x - 150, WALL_Y - 130);
  ctx.quadraticCurveTo(x - 120, WALL_Y - 150, x - 90, WALL_Y - 188);
  ctx.lineTo(x + 90, WALL_Y - 188);
  ctx.quadraticCurveTo(x + 120, WALL_Y - 150, x + 150, WALL_Y - 130);
  ctx.quadraticCurveTo(x + 130, WALL_Y - 160, x + 126, WALL_Y - 150);
  ctx.lineTo(x - 126, WALL_Y - 150);
  ctx.quadraticCurveTo(x - 130, WALL_Y - 160, x - 150, WALL_Y - 130);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  for (let k = -80; k <= 80; k += 16) {
    ctx.beginPath();
    ctx.moveTo(x + k, WALL_Y - 186);
    ctx.lineTo(x + k * 1.4, WALL_Y - 152);
    ctx.stroke();
  }
  // đầu đao cong vút
  ctx.fillStyle = '#e0b248';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + s * 150, WALL_Y - 136, 7, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// tháp canh hai đầu tường
export function drawTower(ctx, x, t, name = '', color = '#c62828') {
  ctx.fillStyle = '#8d5a33';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  rr(ctx, x - 56, WALL_Y - 40, 112, 210, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9b5f33';
  for (let k = -1; k <= 1; k++) {
    rr(ctx, x + k * 36 - 14, WALL_Y - 64, 28, 30, 3);
    ctx.fill();
    ctx.stroke();
  }
  flag(ctx, x + (x < W / 2 ? 30 : -30), WALL_Y - 60, 120, color, t, name);
}

// thời tiết, hiện tượng (vẽ đè lên chiến trường)
export function drawWeather(ctx, kind, t, k = 1, extra = {}) {
  if (!kind || k <= 0) return;
  ctx.save();
  ctx.globalAlpha = k;
  if (kind === 'suong') {
    const dens = extra.density ?? 1;
    for (let i = 0; i < 9; i++) {
      const y = 380 + i * 70 + Math.sin(t * 0.3 + i) * 20;
      const x = ((t * 18 * (i % 2 ? 1 : -1) + i * 260) % (W + 600)) - 300;
      const g = ctx.createRadialGradient(x, y, 20, x, y, 360);
      g.addColorStop(0, `rgba(235,235,245,${0.55 * dens})`);
      g.addColorStop(1, 'rgba(235,235,245,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 360, y - 360, 720, 720);
    }
    ctx.fillStyle = `rgba(220,220,235,${0.35 * dens})`;
    ctx.fillRect(0, 330, W, 560);
  } else if (kind === 'mua') {
    ctx.fillStyle = 'rgba(30,40,70,0.22)';
    ctx.fillRect(0, 0, W, WALL_BOTTOM);
    ctx.strokeStyle = 'rgba(200,220,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 160; i++) {
      const x = (i * 97 + t * 260) % W;
      const y = (i * 151 + t * 1300) % (WALL_BOTTOM + 40);
      ctx.moveTo(x, y);
      ctx.lineTo(x - 8, y + 26);
    }
    ctx.stroke();
  } else if (kind === 'trang') {
    ctx.fillStyle = 'rgba(10,15,50,0.42)';
    ctx.fillRect(0, 0, W, H);
    const mg = ctx.createRadialGradient(820, 170, 10, 820, 170, 160);
    mg.addColorStop(0, 'rgba(255,250,220,1)');
    mg.addColorStop(0.35, 'rgba(255,240,190,0.6)');
    mg.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(640, 0, 380, 340);
    ctx.fillStyle = '#fff6d6';
    ctx.beginPath();
    ctx.arc(820, 170, 50, 0, TAU);
    ctx.fill();
  } else if (kind === 'gio') {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const y = 420 + ((i * 53) % 700);
      const x = ((t * 500 + i * 211) % (W + 400)) - 200;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 40, y - 14, x + 80, y + 14, x + 140, y);
      ctx.stroke();
    }
    // lá bay
    ctx.fillStyle = '#6aa84f';
    for (let i = 0; i < 12; i++) {
      const x = ((t * 420 + i * 157) % (W + 200)) - 100;
      const y = 450 + ((i * 89) % 650) + Math.sin(t * 3 + i) * 20;
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 4, t * 4 + i, 0, TAU);
      ctx.fill();
    }
  } else if (kind === 'set') {
    ctx.fillStyle = 'rgba(20,20,50,0.3)';
    ctx.fillRect(0, 0, W, WALL_BOTTOM);
    // mây đen
    ctx.fillStyle = 'rgba(40,40,60,0.75)';
    for (let i = 0; i < 7; i++) {
      const x = ((i * 190 + t * 12) % (W + 300)) - 150;
      ctx.beginPath();
      ctx.arc(x, 120, 70, 0, TAU);
      ctx.arc(x + 60, 100, 60, 0, TAU);
      ctx.arc(x - 60, 110, 55, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function lightningBolt(ctx, x, y, k) {
  ctx.save();
  ctx.globalAlpha = k;
  ctx.strokeStyle = '#fffbe0';
  ctx.shadowColor = '#bfe3ff';
  ctx.shadowBlur = 20;
  ctx.lineWidth = 6;
  ctx.beginPath();
  let cx = x + 40;
  let cy = 80;
  ctx.moveTo(cx, cy);
  seed = Math.floor(x * 13 + y) || 3;
  while (cy < y) {
    cx += (srand() - 0.5) * 60;
    cy += 50 + srand() * 40;
    ctx.lineTo(cx, Math.min(cy, y));
  }
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.restore();
}
