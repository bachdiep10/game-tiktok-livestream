// Cảnh "Sơn Tinh – Thủy Tinh đại chiến": bên trái núi non Tản Viên và thành đá của phe Núi,
// bên phải biển động, mây giông và thủy cung của phe Nước, giữa là bãi chiến trường.
// Tất cả vẽ bằng code, không dùng ảnh có bản quyền.
export const W = 1080;
export const H = 1920;
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const HORIZON_Y = 790;
// vùng lính đứng (toạ độ chân lính)
export const FIELD = { top: 860, bottom: 1390, left: 150, right: 930 };
// vạch thành: lính tới đây là đánh vào thành địch
export const BASE_FRONT = [175, 905];
export const BASE_X = [78, 1002];
export const TEAM = [
  { key: 'nui', name: 'Sơn Tinh', short: 'Núi', icon: '⛰️', color: '#4caf50', light: '#a5e887', dark: '#1b5e20', accent: '#ffd54a' },
  { key: 'nuoc', name: 'Thủy Tinh', short: 'Nước', icon: '🌊', color: '#29a8ff', light: '#9fe0ff', dark: '#0d3c78', accent: '#7cf7ff' },
];

export function scaleAtY(y) {
  return lerp(0.72, 1.12, clamp((y - FIELD.top) / (FIELD.bottom - FIELD.top), 0, 1));
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

// ------------------------------------------------------------------ trời
function drawSky(ctx) {
  // trái: bình minh vàng ấm, phải: giông bão xanh thẫm
  const v = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
  v.addColorStop(0, '#1d2a4a');
  v.addColorStop(0.45, '#4a6b9a');
  v.addColorStop(1, '#c9d7e2');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, HORIZON_Y + 10);
  const h = ctx.createLinearGradient(0, 0, W, 0);
  h.addColorStop(0, 'rgba(255,190,110,0.75)');
  h.addColorStop(0.45, 'rgba(255,220,170,0.25)');
  h.addColorStop(0.55, 'rgba(60,90,140,0.1)');
  h.addColorStop(1, 'rgba(10,25,60,0.65)');
  ctx.fillStyle = h;
  ctx.fillRect(0, 0, W, HORIZON_Y + 10);
  // mặt trời sau núi
  const sun = ctx.createRadialGradient(210, 520, 10, 210, 520, 260);
  sun.addColorStop(0, 'rgba(255,245,200,1)');
  sun.addColorStop(0.2, 'rgba(255,214,130,0.85)');
  sun.addColorStop(1, 'rgba(255,190,100,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 240, 520, 560);
  // mây giông bên phải
  const rnd = seeded(77);
  for (let i = 0; i < 26; i++) {
    const x = lerp(560, 1120, rnd());
    const y = lerp(330, 560, rnd());
    const r = lerp(50, 120, rnd());
    const g = ctx.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(120,140,175,0.9)');
    g.addColorStop(1, 'rgba(40,55,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  // mây trắng bên trái
  for (let i = 0; i < 10; i++) {
    const x = lerp(-40, 480, rnd());
    const y = lerp(360, 470, rnd());
    const r = lerp(30, 60, rnd());
    ctx.fillStyle = 'rgba(255,240,220,0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.8, r * 0.6, 0, 0, TAU);
    ctx.fill();
  }
}

// ------------------------------------------------------------------ núi (trái)
function mountainRange(ctx, peaks, baseY, fill, rnd, jag = 18) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(peaks[0][0] - 60, baseY);
  for (let i = 0; i < peaks.length; i++) {
    const [x, y] = peaks[i];
    const prev = peaks[i - 1] || [x - 120, baseY];
    const steps = 6;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      ctx.lineTo(lerp(prev[0], x, t) + (rnd() - 0.5) * jag, lerp(prev[1] + (i ? 80 : 0), y, t) + (s < steps ? (rnd() - 0.5) * jag : 0));
    }
    ctx.lineTo(x + 40, y + 60 + rnd() * 40);
  }
  ctx.lineTo(peaks[peaks.length - 1][0] + 160, baseY);
  ctx.closePath();
  ctx.fill();
}
function drawMountains(ctx) {
  const rnd = seeded(5);
  mountainRange(ctx, [[60, 470], [230, 400], [400, 520], [520, 610]], HORIZON_Y, '#6f8aa6', rnd);
  mountainRange(ctx, [[-20, 520], [160, 455], [330, 560], [470, 650]], HORIZON_Y, '#4e7a5e', rnd, 22);
  // núi Tản Viên: ba đỉnh tròn
  const g = ctx.createLinearGradient(0, 470, 0, HORIZON_Y);
  g.addColorStop(0, '#3f8f4f');
  g.addColorStop(1, '#264f2c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-20, HORIZON_Y);
  ctx.quadraticCurveTo(10, 560, 80, 560);
  ctx.quadraticCurveTo(130, 500, 190, 560);
  ctx.quadraticCurveTo(250, 590, 300, 640);
  ctx.quadraticCurveTo(360, 700, 420, HORIZON_Y);
  ctx.closePath();
  ctx.fill();
  // rừng cây lấm tấm
  for (let i = 0; i < 160; i++) {
    const x = lerp(-10, 420, rnd());
    const top = x < 300 ? 580 : lerp(620, 760, (x - 300) / 120);
    const y = lerp(top, HORIZON_Y, rnd());
    ctx.fillStyle = rnd() < 0.5 ? '#2e6b37' : '#3b7f41';
    ctx.beginPath();
    ctx.arc(x, y, lerp(6, 13, rnd()), 0, TAU);
    ctx.fill();
  }
  // tuyết/mây quấn đỉnh
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(120, 555, 120, 16, 0, 0, TAU);
  ctx.fill();
}

// ------------------------------------------------------------------ biển (phải)
function drawSea(ctx) {
  const top = 640;
  const g = ctx.createLinearGradient(0, top, 0, HORIZON_Y + 20);
  g.addColorStop(0, '#1b4f8a');
  g.addColorStop(1, '#2c7fb8');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(560, HORIZON_Y + 20);
  ctx.lineTo(560, top + 70);
  ctx.quadraticCurveTo(700, top + 20, 820, top + 10);
  ctx.lineTo(W, top);
  ctx.lineTo(W, HORIZON_Y + 20);
  ctx.closePath();
  ctx.fill();
  // sóng bạc đầu
  const rnd = seeded(41);
  for (let row = 0; row < 7; row++) {
    const y = top + 30 + row * 20;
    for (let i = 0; i < 9; i++) {
      const x = lerp(580, 1070, rnd()) + row * 4;
      if (x < 600 + (6 - row) * 18) continue;
      ctx.strokeStyle = `rgba(220,245,255,${0.35 + row * 0.06})`;
      ctx.lineWidth = 2 + row * 0.4;
      ctx.beginPath();
      ctx.arc(x, y + 10, 14 + row * 2, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }
  // sóng thần lớn cuộn cao phía xa
  ctx.fillStyle = '#2a6fb0';
  ctx.beginPath();
  ctx.moveTo(760, top + 30);
  ctx.bezierCurveTo(820, 520, 960, 470, 1040, 520);
  ctx.bezierCurveTo(990, 520, 960, 560, 990, 590);
  ctx.bezierCurveTo(1010, 560, 1060, 560, 1090, 580);
  ctx.lineTo(1090, top + 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(230,250,255,0.85)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(800, 560);
  ctx.bezierCurveTo(860, 500, 960, 480, 1040, 522);
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,250,255,0.85)';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(1000 + i * 9, 520 + Math.sin(i) * 6, 6, 0, TAU);
    ctx.fill();
  }
}

// ------------------------------------------------------------------ mặt đất
function drawGround(ctx) {
  const g = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
  g.addColorStop(0, '#8a8f5a');
  g.addColorStop(0.25, '#7a7a45');
  g.addColorStop(0.6, '#5f5a33');
  g.addColorStop(1, '#2e2a18');
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);
  // trái xanh cỏ núi, phải cát ướt
  const h = ctx.createLinearGradient(0, 0, W, 0);
  h.addColorStop(0, 'rgba(70,140,60,0.55)');
  h.addColorStop(0.45, 'rgba(70,140,60,0)');
  h.addColorStop(0.55, 'rgba(60,120,170,0)');
  h.addColorStop(1, 'rgba(60,120,170,0.5)');
  ctx.fillStyle = h;
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);
  // bờ sông giữa trận mờ xa
  ctx.fillStyle = 'rgba(120,170,200,0.35)';
  ctx.beginPath();
  ctx.moveTo(380, HORIZON_Y + 4);
  ctx.quadraticCurveTo(540, HORIZON_Y + 30, 700, HORIZON_Y + 4);
  ctx.quadraticCurveTo(540, HORIZON_Y + 16, 380, HORIZON_Y + 4);
  ctx.fill();
  // đá, cỏ, vết bánh xe
  const rnd = seeded(99);
  for (let i = 0; i < 260; i++) {
    const y = lerp(HORIZON_Y + 10, H - 20, Math.pow(rnd(), 0.8));
    const x = rnd() * W;
    const s = lerp(0.5, 1.6, (y - HORIZON_Y) / (H - HORIZON_Y));
    if (rnd() < 0.55) {
      ctx.strokeStyle = x < W / 2 ? 'rgba(80,140,60,0.7)' : 'rgba(150,150,90,0.6)';
      ctx.lineWidth = 1.5 * s;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 3 * s, y);
        ctx.lineTo(x + k * 6 * s, y - 9 * s);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = `rgba(${60 + rnd() * 40},${55 + rnd() * 30},${40},0.6)`;
      ctx.beginPath();
      ctx.ellipse(x, y, 7 * s, 4 * s, 0, 0, TAU);
      ctx.fill();
    }
  }
  // tiền cảnh tối: đá lớn và lau sậy
  const f = ctx.createLinearGradient(0, 1440, 0, H);
  f.addColorStop(0, 'rgba(20,18,10,0)');
  f.addColorStop(1, 'rgba(15,12,6,0.75)');
  ctx.fillStyle = f;
  ctx.fillRect(0, 1440, W, H - 1440);
  for (const [x, y, r] of [[60, 1760, 90], [210, 1830, 70], [880, 1790, 100], [1040, 1700, 80]]) {
    ctx.fillStyle = '#3a3426';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.2, y - r * 0.25, r * 0.5, r * 0.2, -0.2, 0, TAU);
    ctx.fill();
  }
}

export function drawStatic(ctx) {
  drawSky(ctx);
  drawSea(ctx);
  drawMountains(ctx);
  drawGround(ctx);
}

// ------------------------------------------------------------------ cờ
export function flag(ctx, x, y, h, color, t, dir = 1, icon = '') {
  ctx.strokeStyle = '#5b3a1e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h);
  ctx.stroke();
  const fw = h * 0.55;
  const fh = h * 0.32;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    ctx.lineTo(x + dir * fw * k, y - h + Math.sin(t * 5 + k * 4) * 4 * k);
  }
  for (let i = 8; i >= 0; i--) {
    const k = i / 8;
    ctx.lineTo(x + dir * fw * k, y - h + fh + Math.sin(t * 5 + k * 4) * 4 * k);
  }
  ctx.closePath();
  ctx.fill();
  if (icon) {
    ctx.font = `${Math.round(fh * 0.7)}px "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x + dir * fw * 0.5, y - h + fh / 2 + 2);
  }
}

// ------------------------------------------------------------------ thành hai phe
function cracks(ctx, x, y, w, h, n, seed) {
  const rnd = seeded(seed);
  ctx.strokeStyle = 'rgba(20,15,10,0.8)';
  ctx.lineWidth = 3;
  for (let i = 0; i < n; i++) {
    let cx = x + rnd() * w;
    let cy = y + rnd() * h;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let k = 0; k < 4; k++) {
      cx += (rnd() - 0.5) * 40;
      cy += rnd() * 30;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
}

export function drawBaseNui(ctx, frac, t, hitT) {
  const x = BASE_X[0];
  const shake = hitT > 0 ? Math.sin(t * 80) * 5 * hitT : 0;
  ctx.save();
  ctx.translate(shake, 0);
  // đồi đá
  ctx.fillStyle = '#4a4436';
  ctx.beginPath();
  ctx.moveTo(-20, 1420);
  ctx.quadraticCurveTo(40, 760, 210, 800);
  ctx.lineTo(240, 1420);
  ctx.closePath();
  ctx.fill();
  // tường thành đá
  const top = 820;
  const g = ctx.createLinearGradient(0, top, 0, 1330);
  g.addColorStop(0, '#9b8f74');
  g.addColorStop(1, '#5d5442');
  ctx.fillStyle = g;
  ctx.fillRect(x - 70, top, 140, 520);
  // lỗ châu mai
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x - 70 + i * 40, top - 26, 22, 28);
  }
  // viên đá
  ctx.strokeStyle = 'rgba(40,30,20,0.35)';
  ctx.lineWidth = 2;
  for (let r = 0; r < 13; r++) {
    const yy = top + r * 40;
    ctx.beginPath();
    ctx.moveTo(x - 70, yy);
    ctx.lineTo(x + 70, yy);
    ctx.stroke();
    for (let c = 0; c < 4; c++) {
      const xx = x - 70 + c * 40 + (r % 2) * 20;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx, yy + 40);
      ctx.stroke();
    }
  }
  // cổng gỗ
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.moveTo(x + 10, 1340);
  ctx.lineTo(x + 10, 1130);
  ctx.quadraticCurveTo(x + 40, 1080, x + 70, 1130);
  ctx.lineTo(x + 70, 1340);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2e1c0d';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 15, 1160 + i * 45);
    ctx.lineTo(x + 66, 1160 + i * 45);
    ctx.stroke();
  }
  // mái lầu
  ctx.fillStyle = '#7a2e1c';
  ctx.beginPath();
  ctx.moveTo(x - 95, top - 30);
  ctx.quadraticCurveTo(x, top - 90, x + 95, top - 30);
  ctx.lineTo(x + 75, top - 40);
  ctx.quadraticCurveTo(x, top - 70, x - 75, top - 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c69c4a';
  ctx.fillRect(x - 60, top - 44, 120, 14);
  if (frac < 0.66) cracks(ctx, x - 70, top + 40, 140, 300, 4, 3);
  if (frac < 0.33) cracks(ctx, x - 70, top + 200, 140, 300, 6, 9);
  flag(ctx, x - 40, top - 70, 120, '#2e7d32', t, 1, '⛰️');
  flag(ctx, x + 50, top - 50, 90, '#ffd54a', t + 1, 1, '');
  ctx.restore();
  if (frac < 0.5) smoke(ctx, x, top + 10, t, 1 - frac * 2);
}

export function drawBaseNuoc(ctx, frac, t, hitT) {
  const x = BASE_X[1];
  const shake = hitT > 0 ? Math.sin(t * 80) * 5 * hitT : 0;
  ctx.save();
  ctx.translate(shake, 0);
  // sóng nền dưới thủy cung
  ctx.fillStyle = '#1d5d99';
  ctx.beginPath();
  ctx.moveTo(840, 1420);
  ctx.quadraticCurveTo(860, 900, 1100, 760);
  ctx.lineTo(1100, 1420);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const yy = 940 + i * 60;
    ctx.strokeStyle = `rgba(200,240,255,${0.25 + 0.05 * Math.sin(t * 2 + i)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let k = 0; k <= 10; k++) {
      const xx = 880 + k * 22;
      const yv = yy + Math.sin(t * 2.5 + k * 0.8 + i) * 6;
      if (k === 0) ctx.moveTo(xx, yv);
      else ctx.lineTo(xx, yv);
    }
    ctx.stroke();
  }
  // tường ngọc
  const top = 830;
  const g = ctx.createLinearGradient(0, top, 0, 1330);
  g.addColorStop(0, '#5fd3d0');
  g.addColorStop(1, '#14707f');
  ctx.fillStyle = g;
  ctx.fillRect(x - 70, top, 140, 510);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.beginPath();
      ctx.arc(x - 52 + c * 35 + (r % 2) * 17, top + 20 + r * 42, 14, Math.PI, 0);
      ctx.stroke();
    }
  }
  // cổng vòm vỏ sò
  ctx.fillStyle = '#0a3b5c';
  ctx.beginPath();
  ctx.moveTo(x - 70, 1340);
  ctx.lineTo(x - 70, 1130);
  ctx.quadraticCurveTo(x - 40, 1080, x - 10, 1130);
  ctx.lineTo(x - 10, 1340);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f6d58a';
  ctx.lineWidth = 4;
  ctx.stroke();
  // mái cong ngọc bích + san hô
  ctx.fillStyle = '#0f8f8a';
  ctx.beginPath();
  ctx.moveTo(x - 95, top - 20);
  ctx.quadraticCurveTo(x, top - 100, x + 95, top - 20);
  ctx.lineTo(x + 70, top - 34);
  ctx.quadraticCurveTo(x, top - 76, x - 70, top - 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6d58a';
  ctx.beginPath();
  ctx.arc(x, top - 80, 12, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ff7a8a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (const [bx, dir] of [[x - 80, -1], [x + 80, 1]]) {
    ctx.beginPath();
    ctx.moveTo(bx, top + 10);
    ctx.lineTo(bx + dir * 10, top - 30);
    ctx.lineTo(bx + dir * 24, top - 46);
    ctx.moveTo(bx + dir * 10, top - 30);
    ctx.lineTo(bx - dir * 4, top - 50);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  if (frac < 0.66) cracks(ctx, x - 70, top + 40, 140, 300, 4, 5);
  if (frac < 0.33) cracks(ctx, x - 70, top + 200, 140, 300, 6, 11);
  flag(ctx, x + 40, top - 70, 120, '#1565c0', t, -1, '🌊');
  flag(ctx, x - 50, top - 50, 90, '#7cf7ff', t + 1, -1, '');
  ctx.restore();
  if (frac < 0.5) smoke(ctx, x, top + 10, t, 1 - frac * 2);
}

function smoke(ctx, x, y, t, k) {
  for (let i = 0; i < 6; i++) {
    const p = (t * 0.4 + i / 6) % 1;
    ctx.fillStyle = `rgba(40,40,40,${0.35 * k * (1 - p)})`;
    ctx.beginPath();
    ctx.arc(x + Math.sin(i * 2 + t) * 20, y - p * 220, 20 + p * 40, 0, TAU);
    ctx.fill();
  }
}

// ------------------------------------------------------------------ nước dâng theo thế trận
// front: toạ độ x của mặt trận. Phía phải mặt trận là nước Thủy Tinh tràn lên, phía trái là đất đá Sơn Tinh.
export function drawFlood(ctx, front, t) {
  ctx.save();
  const g = ctx.createLinearGradient(front, 0, W, 0);
  g.addColorStop(0, 'rgba(60,170,255,0.30)');
  g.addColorStop(1, 'rgba(30,110,200,0.45)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(W, HORIZON_Y + 20);
  for (let y = HORIZON_Y + 20; y <= 1440; y += 20) {
    ctx.lineTo(front + Math.sin(t * 2 + y * 0.03) * 14, y);
  }
  ctx.lineTo(W, 1440);
  ctx.closePath();
  ctx.fill();
  // bọt sóng dọc mép nước
  ctx.strokeStyle = 'rgba(230,250,255,0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let y = HORIZON_Y + 20; y <= 1440; y += 20) {
    const xx = front + Math.sin(t * 2 + y * 0.03) * 14;
    if (y === HORIZON_Y + 20) ctx.moveTo(xx, y);
    else ctx.lineTo(xx, y);
  }
  ctx.stroke();
  // đất đá Sơn Tinh dâng phía trái
  const g2 = ctx.createLinearGradient(0, 0, front, 0);
  g2.addColorStop(0, 'rgba(90,160,70,0.28)');
  g2.addColorStop(1, 'rgba(90,160,70,0.06)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, HORIZON_Y + 20, front, 1440 - HORIZON_Y - 20);
  ctx.restore();
}

// ------------------------------------------------------------------ thần hiện ra (quà lớn)
export function drawGiant(ctx, team, k, t) {
  if (k <= 0) return;
  const left = team === 0;
  const cx = left ? 300 : 780;
  const by = 900;
  const s = 1.05;
  ctx.save();
  ctx.globalAlpha = clamp(k, 0, 1) * 0.92;
  // hào quang
  const glow = ctx.createRadialGradient(cx, by - 280 * s, 20, cx, by - 280 * s, 360);
  glow.addColorStop(0, left ? 'rgba(255,230,120,0.7)' : 'rgba(120,230,255,0.7)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 380, by - 660, 760, 760);
  ctx.translate(cx, by + (1 - clamp(k * 1.5, 0, 1)) * 200);
  ctx.scale(left ? s : -s, s);
  const robe = left ? '#2e7d32' : '#1565c0';
  const robe2 = left ? '#7cb342' : '#29b6f6';
  const trim = left ? '#ffd54a' : '#e0f7ff';
  // thân áo bào
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-120, 0);
  ctx.quadraticCurveTo(-100, -200, -60, -300);
  ctx.lineTo(60, -300);
  ctx.quadraticCurveTo(100, -200, 120, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = robe2;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-20, -290);
  ctx.lineTo(20, -290);
  ctx.lineTo(30, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-60, -300);
  ctx.lineTo(0, -240);
  ctx.lineTo(60, -300);
  ctx.stroke();
  // đai lưng
  ctx.fillStyle = trim;
  ctx.fillRect(-80, -170, 160, 16);
  // tay giơ cao
  const lift = Math.sin(t * 3) * 0.08;
  ctx.strokeStyle = robe;
  ctx.lineWidth = 34;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-60, -280);
  ctx.lineTo(-120, -380 - lift * 100);
  ctx.moveTo(60, -280);
  ctx.lineTo(120, -380 + lift * 100);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#f2c79b';
  for (const hx of [-120, 120]) {
    ctx.beginPath();
    ctx.arc(hx, -395 + (hx < 0 ? -lift : lift) * 100, 20, 0, TAU);
    ctx.fill();
  }
  // đầu
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -345, 48, 0, TAU);
  ctx.fill();
  // râu
  ctx.fillStyle = left ? '#3b2a1a' : '#e8f4ff';
  ctx.beginPath();
  ctx.moveTo(-34, -330);
  ctx.quadraticCurveTo(0, -250, 34, -330);
  ctx.quadraticCurveTo(0, -310, -34, -330);
  ctx.fill();
  // mắt
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(-16, -352, 6, 4, 0, 0, TAU);
  ctx.ellipse(16, -352, 6, 4, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-28, -366);
  ctx.lineTo(-6, -360);
  ctx.moveTo(28, -366);
  ctx.lineTo(6, -360);
  ctx.stroke();
  // mũ miện
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.moveTo(-50, -380);
  ctx.lineTo(-40, -430);
  ctx.lineTo(-20, -400);
  ctx.lineTo(0, -450);
  ctx.lineTo(20, -400);
  ctx.lineTo(40, -430);
  ctx.lineTo(50, -380);
  ctx.closePath();
  ctx.fill();
  if (left) {
    // nâng một khối núi trên tay
    ctx.fillStyle = '#5d7a4a';
    ctx.beginPath();
    ctx.moveTo(-170, -410);
    ctx.lineTo(-60, -560);
    ctx.lineTo(10, -470);
    ctx.lineTo(60, -520);
    ctx.lineTo(170, -410);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3e5c33';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(-120 + i * 32, -425 - (i % 3) * 12, 12, 0, TAU);
      ctx.fill();
    }
  } else {
    // đinh ba và sóng cuộn
    ctx.strokeStyle = '#f6d58a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(120, -200);
    ctx.lineTo(120, -560);
    ctx.moveTo(90, -560);
    ctx.lineTo(90, -520);
    ctx.quadraticCurveTo(120, -500, 150, -520);
    ctx.lineTo(150, -560);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,220,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(-200, 0);
    for (let i = 0; i <= 10; i++) ctx.lineTo(-200 + i * 40, -60 - Math.sin(t * 4 + i) * 25 - (i % 2) * 20);
    ctx.lineTo(200, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ voi chiến (phe Núi)
export function drawElephant(ctx, x, y, s, dir, t, hurt, name) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  const step = Math.sin(t * 6);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 70, 14, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = hurt ? '#d9a0a0' : '#8d8f96';
  // chân
  for (const [lx, ph] of [[-45, 0], [-20, 1], [25, 0], [48, 1]]) {
    ctx.fillRect(lx - 9, -40 + (ph ? step : -step) * 3, 18, 40);
  }
  // thân
  ctx.beginPath();
  ctx.ellipse(0, -70, 70, 45, 0, 0, TAU);
  ctx.fill();
  // đầu + vòi
  ctx.beginPath();
  ctx.arc(62, -88, 32, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(88, -80);
  ctx.quadraticCurveTo(110 + step * 6, -40, 96, -10);
  ctx.stroke();
  ctx.lineCap = 'butt';
  // tai
  ctx.fillStyle = '#7a7c83';
  ctx.beginPath();
  ctx.ellipse(46, -86, 18, 26, 0.3, 0, TAU);
  ctx.fill();
  // ngà
  ctx.strokeStyle = '#fff8e1';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(80, -70);
  ctx.quadraticCurveTo(104, -60, 112, -76);
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(70, -96, 4, 0, TAU);
  ctx.fill();
  // bành voi
  ctx.fillStyle = '#c62828';
  ctx.fillRect(-40, -128, 70, 18);
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(-36, -150, 62, 24);
  ctx.fillStyle = '#7a2e1c';
  ctx.beginPath();
  ctx.moveTo(-44, -150);
  ctx.quadraticCurveTo(-5, -180, 34, -150);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (name) tagText(ctx, x, y - 200 * s, name, '#4caf50');
}

// ------------------------------------------------------------------ thuồng luồng (phe Nước)
export function drawSerpent(ctx, x, y, s, dir, t, hurt, name) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 80, 14, 0, 0, TAU);
  ctx.fill();
  // vũng nước
  ctx.fillStyle = 'rgba(80,190,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, -4, 90, 18, 0, 0, TAU);
  ctx.fill();
  // thân uốn lượn
  const body = hurt ? '#d9a0b0' : '#1e88a8';
  for (let i = 8; i >= 0; i--) {
    const k = i / 8;
    const bx = -80 + k * 130;
    const by = -30 - Math.sin(t * 4 + k * 5) * 22 - k * 60;
    ctx.fillStyle = i % 2 ? body : '#26a69a';
    ctx.beginPath();
    ctx.arc(bx, by, 18 + k * 8, 0, TAU);
    ctx.fill();
  }
  // đầu
  const hy = -100 - Math.sin(t * 4 + 5) * 22;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(64, hy, 34, 24, -0.2, 0, TAU);
  ctx.fill();
  // hàm
  ctx.fillStyle = '#0d4f63';
  ctx.beginPath();
  ctx.moveTo(70, hy + 6);
  ctx.lineTo(108, hy + 4 + Math.abs(Math.sin(t * 6)) * 10);
  ctx.lineTo(70, hy + 18);
  ctx.closePath();
  ctx.fill();
  // sừng + râu
  ctx.strokeStyle = '#f6d58a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(50, hy - 18);
  ctx.lineTo(36, hy - 44);
  ctx.moveTo(62, hy - 20);
  ctx.lineTo(56, hy - 48);
  ctx.stroke();
  ctx.strokeStyle = '#bff3ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(90, hy + 2);
  ctx.quadraticCurveTo(110, hy + 30, 96, hy + 50);
  ctx.stroke();
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.arc(70, hy - 6, 5, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (name) tagText(ctx, x, y - 210 * s, name, '#29a8ff');
}

function tagText(ctx, x, y, text, color) {
  ctx.save();
  ctx.font = '700 20px "Segoe UI", system-ui, sans-serif';
  const w = ctx.measureText(text).width + 20;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  rr(ctx, x - w / 2, y - 15, w, 30, 15);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}
