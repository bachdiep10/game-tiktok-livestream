// Cảnh "Sơn Tinh – Thủy Tinh đại chiến": bên trái núi đá vôi, thác nước, chùa trên đỉnh và thành đá phe Núi,
// bên phải sóng cuộn, rồng nước, thủy cung pha lê và thành thác nước phe Nước, giữa là thung lũng cỏ xanh.
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
function cloudBlob(ctx, x, y, r, color = 'rgba(255,255,255,0.95)', shade = 'rgba(200,215,235,0.9)') {
  const parts = [[0, 0, 1], [-0.9, 0.25, 0.7], [0.9, 0.25, 0.75], [-0.4, -0.35, 0.75], [0.45, -0.3, 0.7], [1.6, 0.4, 0.5], [-1.6, 0.4, 0.5]];
  ctx.fillStyle = shade;
  for (const [dx, dy, k] of parts) {
    ctx.beginPath();
    ctx.arc(x + dx * r, y + dy * r + r * 0.12, r * k, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = color;
  for (const [dx, dy, k] of parts) {
    ctx.beginPath();
    ctx.arc(x + dx * r, y + dy * r, r * k * 0.92, 0, TAU);
    ctx.fill();
  }
}
function drawSky(ctx) {
  const v = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
  v.addColorStop(0, '#0f2a5c');
  v.addColorStop(0.35, '#2f6fc0');
  v.addColorStop(0.7, '#8cc8f0');
  v.addColorStop(1, '#e8f4ff');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, HORIZON_Y + 10);
  // bình minh vàng cam bên trái
  const sun = ctx.createRadialGradient(170, 470, 10, 170, 470, 520);
  sun.addColorStop(0, 'rgba(255,250,220,1)');
  sun.addColorStop(0.12, 'rgba(255,220,140,0.95)');
  sun.addColorStop(0.4, 'rgba(255,170,90,0.45)');
  sun.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 720, HORIZON_Y);
  // tia nắng
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const a = -1.2 + i * 0.28;
    ctx.fillStyle = 'rgba(255,220,150,0.05)';
    ctx.beginPath();
    ctx.moveTo(170, 470);
    ctx.lineTo(170 + Math.cos(a) * 900, 470 + Math.sin(a) * 900);
    ctx.lineTo(170 + Math.cos(a + 0.08) * 900, 470 + Math.sin(a + 0.08) * 900);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // mây trắng bồng bềnh
  cloudBlob(ctx, 120, 330, 44, 'rgba(255,236,210,0.95)', 'rgba(240,180,140,0.8)');
  cloudBlob(ctx, 420, 390, 34, 'rgba(255,245,230,0.9)', 'rgba(230,190,160,0.8)');
  cloudBlob(ctx, 960, 300, 52);
  cloudBlob(ctx, 760, 380, 36);
  cloudBlob(ctx, 1040, 470, 40);
  // mây mỏng xa
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (const [x, y, w] of [[300, 560, 160], [620, 520, 200], [860, 580, 150]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, w, 14, 0, 0, TAU);
    ctx.fill();
  }
}

// ------------------------------------------------------------------ núi non Tản Viên (trái)
function karst(ctx, x, baseY, w, h, c1, c2, rnd) {
  // núi đá vôi: vách đá xám xanh, đỉnh phủ cây
  const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, '#5f6f66');
  g.addColorStop(0.4, '#a7b3a6');
  g.addColorStop(0.7, '#86948a');
  g.addColorStop(1, '#4f5e56');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w, baseY);
  ctx.bezierCurveTo(x - w * 0.75, baseY - h * 0.55, x - w * 0.5, baseY - h * 1.02, x, baseY - h);
  ctx.bezierCurveTo(x + w * 0.5, baseY - h * 1.02, x + w * 0.75, baseY - h * 0.55, x + w, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  // vân đá dọc
  ctx.strokeStyle = 'rgba(40,55,45,0.3)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const xx = x - w * 0.8 + rnd() * w * 1.6;
    ctx.beginPath();
    ctx.moveTo(xx, baseY - h);
    ctx.bezierCurveTo(xx + 10, baseY - h * 0.6, xx - 10, baseY - h * 0.3, xx + (rnd() - 0.5) * 20, baseY);
    ctx.stroke();
  }
  // lớp cây phủ đỉnh và gờ đá
  const cap = ctx.createLinearGradient(0, baseY - h, 0, baseY - h * 0.55);
  cap.addColorStop(0, c1);
  cap.addColorStop(1, c2);
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.moveTo(x - w, baseY - h * 0.62);
  for (let i = 0; i <= 12; i++) {
    const k = i / 12;
    ctx.lineTo(x - w + k * w * 2, baseY - h * (0.6 + Math.sin(k * 9) * 0.04) - rnd() * 14);
  }
  ctx.lineTo(x + w, baseY - h * 1.1);
  ctx.lineTo(x - w, baseY - h * 1.1);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 26; i++) {
    const xx = x + (rnd() - 0.5) * w * 1.6;
    const yy = baseY - h * (0.62 + rnd() * 0.38);
    ctx.fillStyle = rnd() < 0.5 ? '#2f7a34' : '#5aa845';
    ctx.beginPath();
    ctx.arc(xx, yy, 8 + rnd() * 12, 0, TAU);
    ctx.fill();
  }
  // cây bám vách
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = '#3f8f3a';
    ctx.beginPath();
    ctx.arc(x + (rnd() - 0.5) * w * 1.4, baseY - h * rnd() * 0.5, 6 + rnd() * 8, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
function waterfall(ctx, x, y0, y1, w) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(230,248,255,0.8)');
  g.addColorStop(1, 'rgba(180,225,250,0.55)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y0);
  ctx.lineTo(x + w / 2, y0);
  ctx.lineTo(x + w * 0.7, y1);
  ctx.lineTo(x - w * 0.7, y1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * w * 0.25, y0);
    ctx.lineTo(x + i * w * 0.35, y1);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(x, y1, w * 1.4, w * 0.4, 0, 0, TAU);
  ctx.fill();
}
function pagoda(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#e9dcc0';
  ctx.fillRect(-12, -16, 24, 16);
  ctx.fillStyle = '#8b3a2b';
  for (const [yy, w] of [[-16, 22], [-34, 16]]) {
    ctx.beginPath();
    ctx.moveTo(-w, yy);
    ctx.quadraticCurveTo(0, yy - 14, w, yy);
    ctx.lineTo(w - 6, yy - 4);
    ctx.lineTo(-w + 6, yy - 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#e9dcc0';
  ctx.fillRect(-7, -32, 14, 14);
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(-1, -52, 2, 10);
  ctx.restore();
}
function drawMountains(ctx) {
  const rnd = seeded(5);
  // dãy xa mờ xanh giữa đường chân trời
  ctx.fillStyle = '#7aa7c8';
  ctx.beginPath();
  ctx.moveTo(250, HORIZON_Y);
  for (let x = 250; x <= 820; x += 30) ctx.lineTo(x, HORIZON_Y - 70 - Math.sin(x * 0.02) * 30 - rnd() * 20);
  ctx.lineTo(820, HORIZON_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5f9a6e';
  ctx.beginPath();
  ctx.moveTo(300, HORIZON_Y);
  for (let x = 300; x <= 760; x += 26) ctx.lineTo(x, HORIZON_Y - 40 - Math.sin(x * 0.03 + 1) * 22 - rnd() * 12);
  ctx.lineTo(760, HORIZON_Y);
  ctx.closePath();
  ctx.fill();
  waterfall(ctx, 560, HORIZON_Y - 64, HORIZON_Y - 10, 10);
  // núi đá vôi lớn bên trái
  karst(ctx, 470, HORIZON_Y + 20, 120, 230, '#6fae7c', '#3d6f52', rnd);
  karst(ctx, 60, HORIZON_Y + 40, 170, 330, '#7ab887', '#3a6a4c', rnd);
  karst(ctx, 230, HORIZON_Y + 30, 150, 420, '#86c08c', '#43765a', rnd);
  karst(ctx, 360, HORIZON_Y + 40, 110, 280, '#78b483', '#3b6c50', rnd);
  pagoda(ctx, 232, HORIZON_Y + 30 - 418, 1.3);
  waterfall(ctx, 170, HORIZON_Y - 270, HORIZON_Y - 40, 16);
  waterfall(ctx, 330, HORIZON_Y - 180, HORIZON_Y - 20, 12);
  // sương mây quấn chân núi
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (const [x, y, w] of [[120, HORIZON_Y - 110, 150], [330, HORIZON_Y - 60, 130], [480, HORIZON_Y - 30, 110]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, w, 20, 0, 0, TAU);
    ctx.fill();
  }
  // rừng cây chân núi
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 560;
    const y = HORIZON_Y - 10 + rnd() * 40;
    ctx.fillStyle = rnd() < 0.5 ? '#2f7a34' : '#3f9140';
    ctx.beginPath();
    ctx.arc(x, y, 12 + rnd() * 14, 0, TAU);
    ctx.fill();
  }
}

// ------------------------------------------------------------------ biển động, thủy cung, rồng nước (phải)
function crystalPalace(ctx, x, y) {
  const towers = [[-90, 120, 18], [-50, 170, 22], [0, 230, 30], [50, 170, 22], [92, 130, 18], [130, 90, 14]];
  for (const [dx, h, w] of towers) {
    const g = ctx.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, '#bff3ff');
    g.addColorStop(1, '#2a7fc9');
    ctx.fillStyle = g;
    ctx.fillRect(x + dx - w / 2, y - h, w, h);
    ctx.fillStyle = '#7fe0ff';
    ctx.beginPath();
    ctx.moveTo(x + dx - w / 2 - 4, y - h);
    ctx.lineTo(x + dx, y - h - w * 1.4);
    ctx.lineTo(x + dx + w / 2 + 4, y - h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,220,0.8)';
    for (let k = 0; k < Math.floor(h / 40); k++) ctx.fillRect(x + dx - 3, y - h + 20 + k * 36, 6, 10);
  }
  // mái cong chính
  ctx.fillStyle = '#1565c0';
  ctx.beginPath();
  ctx.moveTo(x - 70, y - 70);
  ctx.quadraticCurveTo(x, y - 110, x + 70, y - 70);
  ctx.lineTo(x + 50, y - 80);
  ctx.quadraticCurveTo(x, y - 100, x - 50, y - 80);
  ctx.closePath();
  ctx.fill();
  const glow = ctx.createRadialGradient(x, y - 120, 10, x, y - 120, 200);
  glow.addColorStop(0, 'rgba(160,240,255,0.35)');
  glow.addColorStop(1, 'rgba(160,240,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 200, y - 320, 400, 320);
}
function curlWave(ctx, x, y, w, h) {
  // con sóng cuộn: thân xanh, ngọn cuộn sang trái, bọt trắng
  const g = ctx.createLinearGradient(0, y - h, 0, y);
  g.addColorStop(0, '#6fdcff');
  g.addColorStop(0.45, '#2196e0');
  g.addColorStop(1, '#0d4f99');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.quadraticCurveTo(x - w * 0.2, y - h * 0.5, x - w * 0.12, y - h * 0.82);
  ctx.quadraticCurveTo(x + w * 0.05, y - h * 1.08, x + w * 0.2, y - h * 0.9);
  ctx.quadraticCurveTo(x + w * 0.45, y - h * 0.5, x + w / 2, y);
  ctx.closePath();
  ctx.fill();
  // lòng sóng tối
  const r = h * 0.26;
  const cx = x - w * 0.12;
  const cy = y - h * 0.62;
  ctx.fillStyle = 'rgba(8,50,110,0.55)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  // ngọn bọt cuộn
  ctx.strokeStyle = 'rgba(245,253,255,0.95)';
  ctx.lineWidth = Math.max(5, h * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, -0.2, Math.PI * 1.25, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.98, cy - r * 0.2);
  ctx.quadraticCurveTo(x + w * 0.1, y - h * 1.02, x + w * 0.3, y - h * 0.7);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = 'rgba(245,253,255,0.9)';
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * 1.25 - i * 0.18;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3 + (i % 3) * 2, 0, TAU);
    ctx.fill();
  }
}
function waterDragon(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  // cổ uốn từ sóng lên
  const g = ctx.createLinearGradient(-60, 0, 60, -160);
  g.addColorStop(0, '#2f9ad8');
  g.addColorStop(1, '#bff3ff');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-40, 60);
  ctx.bezierCurveTo(-70, -40, 0, -80, -10, -130);
  ctx.lineTo(40, -120);
  ctx.bezierCurveTo(40, -60, 10, -20, 40, 60);
  ctx.closePath();
  ctx.fill();
  // đầu rồng nhìn sang trái
  ctx.fillStyle = '#8fe3ff';
  ctx.beginPath();
  ctx.moveTo(40, -120);
  ctx.quadraticCurveTo(10, -175, -40, -170);
  ctx.lineTo(-110, -150);
  ctx.lineTo(-80, -138);
  ctx.lineTo(-110, -118);
  ctx.quadraticCurveTo(-50, -110, -10, -110);
  ctx.closePath();
  ctx.fill();
  // hàm há
  ctx.fillStyle = '#0d3c78';
  ctx.beginPath();
  ctx.moveTo(-100, -146);
  ctx.lineTo(-40, -140);
  ctx.lineTo(-100, -124);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-96 + i * 14, -146);
    ctx.lineTo(-90 + i * 14, -138);
    ctx.lineTo(-84 + i * 14, -146);
    ctx.fill();
  }
  // sừng, bờm
  ctx.strokeStyle = '#e0faff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -165);
  ctx.quadraticCurveTo(30, -200, 60, -205);
  ctx.moveTo(-14, -168);
  ctx.quadraticCurveTo(0, -210, 30, -225);
  ctx.stroke();
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(30 - i * 6, -110 + i * 26);
    ctx.lineTo(60 - i * 2, -100 + i * 26);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // mắt
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.ellipse(-30, -150, 8, 5, -0.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-32, -150, 2.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}
function drawSea(ctx) {
  const top = 600;
  const g = ctx.createLinearGradient(0, top, 0, HORIZON_Y + 30);
  g.addColorStop(0, '#2a7fc9');
  g.addColorStop(1, '#0f4f8f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(600, HORIZON_Y + 30);
  ctx.quadraticCurveTo(640, top + 60, 760, top + 20);
  ctx.lineTo(W, top);
  ctx.lineTo(W, HORIZON_Y + 30);
  ctx.closePath();
  ctx.fill();
  crystalPalace(ctx, 860, top + 40);
  curlWave(ctx, 700, 760, 200, 140);
  curlWave(ctx, 1010, 700, 220, 190);
  waterDragon(ctx, 990, 560);
  curlWave(ctx, 850, 800, 240, 150);
  curlWave(ctx, 650, 812, 140, 80);
  // bọt sóng lăn tăn
  const rnd = seeded(41);
  for (let i = 0; i < 40; i++) {
    const x = 620 + rnd() * 460;
    const y = 700 + rnd() * 110;
    ctx.strokeStyle = 'rgba(230,250,255,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 8 + rnd() * 10, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
}

// ------------------------------------------------------------------ thung lũng cỏ, đường đá
function drawGround(ctx) {
  const g = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
  g.addColorStop(0, '#9fd46a');
  g.addColorStop(0.2, '#6fb84a');
  g.addColorStop(0.55, '#4f9a36');
  g.addColorStop(1, '#2d5f22');
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);
  // bờ biển lấn vào thung lũng bên phải
  ctx.fillStyle = '#1f7fcf';
  ctx.beginPath();
  ctx.moveTo(600, HORIZON_Y);
  ctx.bezierCurveTo(700, 860, 760, 930, 900, 990);
  ctx.quadraticCurveTo(1000, 1030, W, 1040);
  ctx.lineTo(W, HORIZON_Y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,252,255,0.85)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(600, HORIZON_Y);
  ctx.bezierCurveTo(700, 860, 760, 930, 900, 990);
  ctx.quadraticCurveTo(1000, 1030, W, 1040);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,240,255,0.5)';
  ctx.lineWidth = 2;
  for (let k = 1; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(620 + k * 30, HORIZON_Y);
    ctx.bezierCurveTo(720 + k * 30, 850 + k * 4, 780 + k * 30, 915 + k * 4, 910 + k * 25, 975 - k * 8);
    ctx.stroke();
  }
  // cát ven bờ
  ctx.strokeStyle = 'rgba(240,225,170,0.6)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(585, HORIZON_Y + 4);
  ctx.bezierCurveTo(685, 868, 745, 940, 890, 1004);
  ctx.quadraticCurveTo(990, 1046, W, 1056);
  ctx.stroke();
  // hàng cây xa chân trời
  for (let i = 0; i < 40; i++) {
    const x = i * 16;
    ctx.fillStyle = i % 2 ? '#3d7f3c' : '#4c9145';
    ctx.beginPath();
    ctx.arc(x, HORIZON_Y + 4, 10 + (i * 7) % 9, Math.PI, 0);
    ctx.fill();
  }
  // sương mờ chân trời
  const haze = ctx.createLinearGradient(0, HORIZON_Y - 10, 0, HORIZON_Y + 90);
  haze.addColorStop(0, 'rgba(235,248,255,0.65)');
  haze.addColorStop(1, 'rgba(235,248,255,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, HORIZON_Y - 10, W, 100);
  // đường đá lát giữa thung lũng
  const rnd = seeded(99);
  const pathX = (t) => 520 + Math.sin(t * 5) * 60 * t - t * 40;
  ctx.fillStyle = 'rgba(200,190,160,0.35)';
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const y = lerp(HORIZON_Y + 4, 1450, t);
    const half = lerp(14, 150, t);
    if (i === 0) ctx.moveTo(pathX(t) - half, y);
    else ctx.lineTo(pathX(t) - half, y);
  }
  for (let i = 30; i >= 0; i--) {
    const t = i / 30;
    ctx.lineTo(pathX(t) + lerp(14, 150, t), lerp(HORIZON_Y + 4, 1450, t));
  }
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 120; i++) {
    const t = rnd();
    const y = lerp(HORIZON_Y + 20, 1450, t);
    const cx = pathX(t);
    const half = lerp(12, 130, t);
    const x = cx + (rnd() - 0.5) * 2 * half;
    const s = lerp(0.3, 1.5, t);
    ctx.fillStyle = rnd() < 0.5 ? '#c9c0a6' : '#b3aa90';
    ctx.beginPath();
    ctx.ellipse(x, y, 16 * s, 7 * s, (rnd() - 0.5) * 0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,60,40,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // cỏ lấm tấm, bụi cây, đá
  for (let i = 0; i < 320; i++) {
    const y = lerp(HORIZON_Y + 8, H - 10, Math.pow(rnd(), 0.9));
    const x = rnd() * W;
    const s = lerp(0.4, 1.8, (y - HORIZON_Y) / (H - HORIZON_Y));
    ctx.strokeStyle = rnd() < 0.5 ? 'rgba(160,220,100,0.8)' : 'rgba(60,130,50,0.8)';
    ctx.lineWidth = 1.5 * s;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(x + k * 3 * s, y);
      ctx.lineTo(x + k * 6 * s, y - 10 * s);
      ctx.stroke();
    }
  }
  for (const [x, y, r] of [[250, 900, 30], [820, 920, 26], [180, 1180, 40], [900, 1220, 36], [330, 1400, 34], [760, 1420, 30]]) {
    ctx.fillStyle = '#8c8a7c';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.2, y - r * 0.2, r * 0.5, r * 0.2, -0.2, 0, TAU);
    ctx.fill();
  }
  // tiền cảnh: cây dương xỉ, hoa, đá lớn
  const f = ctx.createLinearGradient(0, 1460, 0, H);
  f.addColorStop(0, 'rgba(20,50,15,0)');
  f.addColorStop(1, 'rgba(15,35,10,0.7)');
  ctx.fillStyle = f;
  ctx.fillRect(0, 1460, W, H - 1460);
  for (const [x, y, r] of [[70, 1740, 100], [240, 1840, 80], [860, 1780, 110], [1040, 1680, 90], [520, 1880, 70]]) {
    ctx.fillStyle = '#6d6b60';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.2, y - r * 0.25, r * 0.5, r * 0.2, -0.2, 0, TAU);
    ctx.fill();
  }
  for (let i = 0; i < 26; i++) {
    const x = rnd() * W;
    const y = 1500 + rnd() * 400;
    ctx.strokeStyle = '#2f7a2a';
    ctx.lineWidth = 4;
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a) * 30, y + Math.sin(a) * 40, x + Math.cos(a) * 55, y + Math.sin(a) * 50 + 20);
      ctx.stroke();
    }
  }
  const flowers = ['#ff6f91', '#ffd54a', '#ffffff', '#ff8a65', '#ba68c8'];
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W;
    const y = 1440 + rnd() * 460;
    if (x > 220 && x < 860 && y < 1600) continue;
    ctx.fillStyle = flowers[i % flowers.length];
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(x + Math.cos(k * 1.26) * 5, y + Math.sin(k * 1.26) * 5, 4, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, TAU);
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

function stoneWall(ctx, x0, top, w, bottom, c1, c2, seed) {
  const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  g.addColorStop(0, c2);
  g.addColorStop(0.5, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(x0, top, w, bottom - top);
  // lỗ châu mai
  for (let i = 0; i < 5; i++) ctx.fillRect(x0 + i * (w / 4.5), top - 30, w / 9, 32);
  const rnd = seeded(seed);
  ctx.strokeStyle = 'rgba(40,35,25,0.35)';
  ctx.lineWidth = 2;
  for (let r = 0; (top + r * 34) < bottom; r++) {
    const yy = top + r * 34;
    ctx.beginPath();
    ctx.moveTo(x0, yy);
    ctx.lineTo(x0 + w, yy);
    ctx.stroke();
    for (let c = 0; c < 5; c++) {
      const xx = x0 + c * (w / 4) + (r % 2) * (w / 8);
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx, yy + 34);
      ctx.stroke();
      if (rnd() < 0.2) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(xx + 2, yy + 2, w / 4 - 4, 30);
      }
    }
  }
}
function vines(ctx, x, top, bottom, seed) {
  const rnd = seeded(seed);
  for (let i = 0; i < 40; i++) {
    const y = lerp(top, bottom, rnd());
    const xx = x + (rnd() - 0.5) * 30;
    ctx.fillStyle = rnd() < 0.5 ? '#3f8f3a' : '#5fae48';
    ctx.beginPath();
    ctx.ellipse(xx, y, 8, 5, rnd() * 3, 0, TAU);
    ctx.fill();
    if (rnd() < 0.15) {
      ctx.fillStyle = rnd() < 0.5 ? '#ff6f91' : '#fff';
      ctx.beginPath();
      ctx.arc(xx + 4, y - 3, 3, 0, TAU);
      ctx.fill();
    }
  }
}
function mountainEmblem(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#e0b84a';
  ctx.lineWidth = 6 * s;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-34 * s, 20 * s);
  ctx.lineTo(-10 * s, -18 * s);
  ctx.lineTo(4 * s, 2 * s);
  ctx.lineTo(16 * s, -10 * s);
  ctx.lineTo(36 * s, 20 * s);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-20 * s, 20 * s);
  ctx.lineTo(-10 * s, 4 * s);
  ctx.lineTo(0, 20 * s);
  ctx.stroke();
  ctx.restore();
}
function waveEmblem(ctx, x, y, s, color = '#e0faff') {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6 * s;
  ctx.lineCap = 'round';
  for (const dy of [-10, 6]) {
    ctx.beginPath();
    ctx.moveTo(-34 * s, (dy + 14) * s);
    ctx.bezierCurveTo(-20 * s, (dy - 14) * s, 10 * s, (dy - 18) * s, 22 * s, (dy - 2) * s);
    ctx.bezierCurveTo(14 * s, (dy - 8) * s, 2 * s, (dy - 2) * s, 8 * s, (dy + 8) * s);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBaseNui(ctx, frac, t, hitT) {
  const x = BASE_X[0];
  const shake = hitT > 0 ? Math.sin(t * 80) * 5 * hitT : 0;
  ctx.save();
  ctx.translate(shake, 0);
  const top = 800;
  const bottom = 1360;
  // chân đồi đá
  ctx.fillStyle = '#5d6b4a';
  ctx.beginPath();
  ctx.moveTo(-20, 1440);
  ctx.quadraticCurveTo(0, 1300, 240, 1330);
  ctx.lineTo(260, 1440);
  ctx.closePath();
  ctx.fill();
  stoneWall(ctx, x - 80, top, 170, bottom, '#b5aa8c', '#7e7559', 3);
  // tháp canh
  stoneWall(ctx, x - 96, top - 120, 90, top + 10, '#c2b796', '#8a8063', 7);
  mountainEmblem(ctx, x + 6, top + 140, 1.25);
  // cổng gỗ vòm + đèn lồng
  ctx.fillStyle = '#4a3420';
  ctx.beginPath();
  ctx.moveTo(x + 10, bottom);
  ctx.lineTo(x + 10, 1180);
  ctx.quadraticCurveTo(x + 45, 1120, x + 82, 1180);
  ctx.lineTo(x + 82, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a5530';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 16 + i * 17, 1170, 12, bottom - 1172);
  ctx.strokeStyle = '#2e1c0d';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 14, 1210, 64, 4);
  ctx.strokeRect(x + 14, 1290, 64, 4);
  const lamp = 0.75 + Math.sin(t * 3) * 0.15;
  const lg = ctx.createRadialGradient(x - 14, 1170, 2, x - 14, 1170, 60);
  lg.addColorStop(0, `rgba(255,200,90,${0.6 * lamp})`);
  lg.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(x - 80, 1110, 130, 120);
  ctx.fillStyle = '#ffb74d';
  rr(ctx, x - 22, 1158, 16, 24, 6);
  ctx.fill();
  vines(ctx, x - 80, top, bottom, 4);
  vines(ctx, x + 88, top + 200, bottom, 9);
  if (frac < 0.66) cracks(ctx, x - 70, top + 40, 150, 300, 4, 3);
  if (frac < 0.33) cracks(ctx, x - 70, top + 200, 150, 300, 6, 9);
  flag(ctx, x - 60, top - 140, 150, '#f6c431', t, 1, '⛰️');
  ctx.restore();
  if (frac < 0.5) smoke(ctx, x, top + 10, t, 1 - frac * 2);
}

export function drawBaseNuoc(ctx, frac, t, hitT) {
  const x = BASE_X[1];
  const shake = hitT > 0 ? Math.sin(t * 80) * 5 * hitT : 0;
  ctx.save();
  ctx.translate(shake, 0);
  const top = 800;
  const bottom = 1360;
  // hồ nước dưới chân thành
  ctx.fillStyle = '#1f78c8';
  ctx.beginPath();
  ctx.moveTo(820, 1440);
  ctx.quadraticCurveTo(840, 1300, 1100, 1290);
  ctx.lineTo(1100, 1440);
  ctx.closePath();
  ctx.fill();
  stoneWall(ctx, x - 90, top, 170, bottom, '#a9b4bf', '#6f7d8a', 5);
  stoneWall(ctx, x + 6, top - 120, 90, top + 10, '#b8c3cc', '#7c8a96', 11);
  // thác nước đổ xuống mặt thành
  const wg = ctx.createLinearGradient(0, top, 0, bottom);
  wg.addColorStop(0, 'rgba(170,235,255,0.95)');
  wg.addColorStop(1, 'rgba(60,170,240,0.9)');
  ctx.fillStyle = wg;
  ctx.fillRect(x - 70, top - 10, 130, bottom - top - 160);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const xx = x - 64 + i * 15;
    const off = ((t * 220 + i * 37) % 80);
    ctx.beginPath();
    ctx.moveTo(xx, top - 10 + off);
    ctx.lineTo(xx, top + 120 + off);
    ctx.moveTo(xx, top + 200 + off);
    ctx.lineTo(xx, top + 300 + off);
    ctx.stroke();
  }
  waveEmblem(ctx, x - 6, top + 130, 1.3);
  // cổng vòm phát sáng
  ctx.fillStyle = '#0a2e55';
  ctx.beginPath();
  ctx.moveTo(x - 76, bottom);
  ctx.lineTo(x - 76, 1180);
  ctx.quadraticCurveTo(x - 40, 1120, x - 4, 1180);
  ctx.lineTo(x - 4, bottom);
  ctx.closePath();
  ctx.fill();
  const gg = ctx.createLinearGradient(0, 1150, 0, bottom);
  gg.addColorStop(0, `rgba(130,230,255,${0.55 + Math.sin(t * 2) * 0.15})`);
  gg.addColorStop(1, 'rgba(130,230,255,0.1)');
  ctx.fillStyle = gg;
  ctx.fill();
  ctx.strokeStyle = '#f6d58a';
  ctx.lineWidth = 5;
  ctx.stroke();
  // bọt nước chân thác
  ctx.fillStyle = 'rgba(240,252,255,0.85)';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(x - 64 + i * 20, bottom - 160 + Math.sin(t * 6 + i) * 4, 10, 0, TAU);
    ctx.fill();
  }
  if (frac < 0.66) cracks(ctx, x - 90, top + 40, 150, 300, 4, 5);
  if (frac < 0.33) cracks(ctx, x - 90, top + 200, 150, 300, 6, 11);
  flag(ctx, x + 60, top - 140, 150, '#1565c0', t, -1, '🌊');
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
  g.addColorStop(0, 'rgba(60,170,255,0.16)');
  g.addColorStop(1, 'rgba(30,110,200,0.24)');
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
  ctx.strokeStyle = 'rgba(230,250,255,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let y = HORIZON_Y + 20; y <= 1440; y += 20) {
    const xx = front + Math.sin(t * 2 + y * 0.03) * 14;
    if (y === HORIZON_Y + 20) ctx.moveTo(xx, y);
    else ctx.lineTo(xx, y);
  }
  ctx.stroke();
  // đất đá Sơn Tinh dâng phía trái
  const g2 = ctx.createLinearGradient(0, 0, front, 0);
  g2.addColorStop(0, 'rgba(120,200,80,0.10)');
  g2.addColorStop(1, 'rgba(120,200,80,0.02)');
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

// ------------------------------------------------------------------ rắn biển (phe Nước)
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

function tagText(ctx, x, y, text, color, size = 20) {
  ctx.save();
  ctx.font = `700 ${size}px "Segoe UI", system-ui, sans-serif`;
  const w = ctx.measureText(text).width + 20;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  rr(ctx, x - w / 2, y - size * 0.75, w, size * 1.5, size * 0.75);
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

// ------------------------------------------------------------------ đại bàng (phe Núi, quà nhỏ)
// gy: mặt đất (vẽ bóng), alt: độ cao đang bay
export function drawEagle(ctx, x, gy, alt, s, dir, t, hurt, name) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, gy, 26 * s, 6 * s, 0, 0, TAU);
  ctx.fill();
  ctx.translate(x, gy - alt);
  ctx.scale(s * dir, s);
  const flap = Math.sin(t * 12);
  ctx.fillStyle = hurt ? '#e8a090' : '#6d4a2a';
  // cánh
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-20, side * (24 + flap * 18), -54, side * (16 + flap * 26));
    ctx.lineTo(-40, side * (6 + flap * 10));
    ctx.lineTo(-30, side * (10 + flap * 14));
    ctx.lineTo(-18, side * 2);
    ctx.closePath();
    ctx.fill();
  }
  // thân
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 10, 0, 0, TAU);
  ctx.fill();
  // đuôi
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(-40, -8);
  ctx.lineTo(-40, 8);
  ctx.closePath();
  ctx.fill();
  // đầu trắng
  ctx.fillStyle = '#f5f0e6';
  ctx.beginPath();
  ctx.arc(24, -4, 9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffb300';
  ctx.beginPath();
  ctx.moveTo(31, -6);
  ctx.lineTo(42, -1);
  ctx.lineTo(31, 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(26, -6, 2, 0, TAU);
  ctx.fill();
  // móng vuốt
  ctx.strokeStyle = '#ffb300';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(4, 8);
  ctx.lineTo(8, 16);
  ctx.moveTo(-4, 8);
  ctx.lineTo(-2, 16);
  ctx.stroke();
  ctx.restore();
  if (name) tagText(ctx, x, gy - alt - 40 * s, name, '#4caf50', 16);
}

// ------------------------------------------------------------------ rùa thần (phe Nước, quà nhỏ)
export function drawTurtle(ctx, x, y, s, dir, t, hurt, name) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 42, 9, 0, 0, TAU);
  ctx.fill();
  const step = Math.sin(t * 5);
  ctx.fillStyle = hurt ? '#e8a0a0' : '#7cb87a';
  // chân
  for (const [lx, ph] of [[-22, 1], [-8, -1], [14, 1], [26, -1]]) {
    ctx.beginPath();
    ctx.ellipse(lx + ph * step * 3, -5, 7, 6, 0, 0, TAU);
    ctx.fill();
  }
  // đầu
  ctx.beginPath();
  ctx.ellipse(42, -18 + step, 12, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(47, -21 + step, 2.2, 0, TAU);
  ctx.fill();
  // mai
  const g = ctx.createLinearGradient(0, -50, 0, -8);
  g.addColorStop(0, '#2e8b7a');
  g.addColorStop(1, '#14524a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-38, -8);
  ctx.quadraticCurveTo(-34, -50, 0, -52);
  ctx.quadraticCurveTo(34, -50, 38, -8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f6d58a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, -14);
  ctx.lineTo(-8, -36);
  ctx.lineTo(8, -36);
  ctx.lineTo(12, -14);
  ctx.moveTo(-8, -36);
  ctx.lineTo(-24, -28);
  ctx.moveTo(8, -36);
  ctx.lineTo(24, -28);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(-8, -38, 14, 6, -0.3, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (name) tagText(ctx, x, y - 70 * s, name, '#29a8ff', 16);
}
