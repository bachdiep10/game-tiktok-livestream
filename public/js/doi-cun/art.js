// Hình vẽ game "Đội Cún Quậy": sân cỏ 4 làn đua, khúc xương vàng ở đích, 4 chú cún chibi nhìn ngang
// (Vàng chó ta, Mực chó mực, Bông phốc sóc, Lu Shiba) và đồ mặc tự vẽ (áo, kính, hào quang).
// Mũ và phụ kiện dùng ảnh emoji 3D Fluent (MIT) hoặc ảnh riêng của chủ kênh (public/assets/doi-cun).
// Bố cục khung dọc 1080x1920: 0-360 tiêu đề + đồng hồ, 360-1500 bốn làn đua (mỗi làn 285), dưới cùng bảng tin + luật chơi.
export const W = 1080;
export const H = 1920;
export const TAU = Math.PI * 2;
export const FONT = '"Segoe UI", system-ui, sans-serif';

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

export function outlined(ctx, text, x, y, { size = 40, color = '#fff', stroke = '#1d1033', lw = 8, weight = 900, align = 'center', base = 'middle', maxW } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y, maxW);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y, maxW);
}

export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Ảnh AI nền xanh lá đồng màu (#00FF00): nếu các góc là xanh lá thì xoá nền, làm mềm viền, khử ánh xanh
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
    const m = Math.max(d[i], d[i + 2]);
    const diff = d[i + 1] - m;
    if (diff > 60 && d[i + 1] > 110) d[i + 3] = 0;
    else if (diff > 18) {
      d[i + 3] = Math.round(d[i + 3] * Math.max(0, 1 - (diff - 18) / 42));
      d[i + 1] = m + Math.round(diff * 0.25);
    }
  }
  g.putImageData(data, 0, 0);
  return c;
}

// ------------------------------------------------------------------ 4 đội
export const TEAMS = [
  {
    no: 1, name: 'Vàng', breed: 'Chó ta', color: '#ffb020', dark: '#a86400',
    fur: '#e3a148', furDark: '#b8752a', belly: '#f8ddb0', ear: 'up', nose: '#3a2418', eye: '#2b1a10',
    words: ['vang', 'cun vang', 'cho vang'],
  },
  {
    no: 2, name: 'Mực', breed: 'Chó mực', color: '#3f8cff', dark: '#1c4fa8',
    fur: '#33343d', furDark: '#1d1e25', belly: '#55565f', ear: 'flop', nose: '#0d0d10', eye: '#0d0d10', lightEye: true,
    words: ['muc', 'cun muc', 'cho muc'],
  },
  {
    no: 3, name: 'Bông', breed: 'Phốc sóc', color: '#ff5fa8', dark: '#b0236a',
    fur: '#fbf6f0', furDark: '#e2d6c8', belly: '#ffffff', ear: 'fluff', nose: '#2a1d1d', eye: '#241616', fluffy: true,
    words: ['bong', 'cun bong', 'cho bong'],
  },
  {
    no: 4, name: 'Lu', breed: 'Shiba', color: '#22c47a', dark: '#0d7a48',
    fur: '#e07b33', furDark: '#b3561b', belly: '#fff3e2', ear: 'up', nose: '#2a1a12', eye: '#22140c', shiba: true,
    words: ['lu', 'cun lu', 'cho lu'],
  },
];

// ------------------------------------------------------------------ nền sân cỏ (vẽ sẵn 1 lần)
export const LANE_TOP = 360;
export const LANE_H = 285;
export const FINISH_X = 900; // vạch đích (mõm cún chạm vạch = về đích)
export const START_X = 110; // chân cún lúc xuất phát
export const BONE_X = 1010;

function hash(n, salt = 0) {
  const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// overlay = true: đã có ảnh nền riêng (nen.jpg), chỉ kẻ vạch làn, vạch đích và nền khu luật chơi lên trên
export function drawBackground(g, overlay = false) {
  if (overlay) {
    g.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i <= 4; i++) g.fillRect(0, LANE_TOP + i * LANE_H, W, 5);
    for (let y = LANE_TOP, r = 0; y < LANE_TOP + LANE_H * 4; y += 22, r++) {
      for (let c = 0; c < 2; c++) {
        g.fillStyle = (r + c) % 2 ? '#222' : '#fff';
        g.fillRect(FINISH_X + c * 22, y, 22, 22);
      }
    }
    return;
  }
  // trời
  const sky = g.createLinearGradient(0, 0, 0, LANE_TOP);
  sky.addColorStop(0, '#6fc6ff');
  sky.addColorStop(1, '#c9ecff');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, LANE_TOP + 20);
  // mây
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 6; i++) {
    const x = hash(i, 1) * W;
    const y = 60 + hash(i, 2) * 180;
    const s = 40 + hash(i, 3) * 40;
    g.beginPath();
    g.arc(x, y, s, 0, TAU);
    g.arc(x + s * 0.9, y + 8, s * 0.8, 0, TAU);
    g.arc(x - s * 0.9, y + 10, s * 0.7, 0, TAU);
    g.fill();
  }
  // đồi + hàng cây xa
  g.fillStyle = '#7fcf6a';
  g.beginPath();
  g.moveTo(0, LANE_TOP);
  for (let x = 0; x <= W; x += 30) g.lineTo(x, LANE_TOP - 40 - 30 * Math.sin(x / 160) - 18 * Math.sin(x / 57));
  g.lineTo(W, LANE_TOP);
  g.fill();
  for (let i = 0; i < 14; i++) {
    const x = 20 + i * 78 + hash(i, 4) * 30;
    const y = LANE_TOP - 50 - hash(i, 5) * 20;
    g.fillStyle = '#6b4a2a';
    g.fillRect(x - 5, y, 10, 34);
    g.fillStyle = i % 2 ? '#3f9e46' : '#4cae4f';
    g.beginPath();
    g.arc(x, y - 6, 30 + hash(i, 6) * 10, 0, TAU);
    g.fill();
  }
  // hàng rào gỗ
  g.fillStyle = '#fff6e3';
  for (let x = 6; x < W; x += 44) {
    roundRectPath(g, x, LANE_TOP - 62, 22, 70, 6);
    g.fill();
  }
  g.fillRect(0, LANE_TOP - 44, W, 10);
  g.fillRect(0, LANE_TOP - 18, W, 10);
  // làn cỏ
  for (let i = 0; i < 4; i++) {
    const y = LANE_TOP + i * LANE_H;
    g.fillStyle = i % 2 ? '#5cb85c' : '#66c466';
    g.fillRect(0, y, W, LANE_H);
    // sọc cỏ cắt
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < W; x += 120) g.fillRect(x, y, 60, LANE_H);
    // vạch phấn trắng
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.fillRect(0, y, W, 5);
    // chấm hoa nhỏ
    for (let k = 0; k < 10; k++) {
      const fx = hash(i * 20 + k, 7) * W;
      const fy = y + 20 + hash(i * 20 + k, 8) * (LANE_H - 40);
      g.fillStyle = ['#fff', '#ffe15c', '#ffb3d1'][k % 3];
      g.beginPath();
      g.arc(fx, fy, 4, 0, TAU);
      g.fill();
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.fillRect(0, LANE_TOP + 4 * LANE_H, W, 5);
  // vạch đích ca-rô
  const fx = FINISH_X;
  for (let y = LANE_TOP, r = 0; y < LANE_TOP + LANE_H * 4; y += 22, r++) {
    for (let c = 0; c < 2; c++) {
      g.fillStyle = (r + c) % 2 ? '#222' : '#fff';
      g.fillRect(fx + c * 22, y, 22, 22);
    }
  }
  // phần dưới (khu bảng luật)
  const low = g.createLinearGradient(0, LANE_TOP + LANE_H * 4, 0, H);
  low.addColorStop(0, '#3f8f3f');
  low.addColorStop(1, '#245a2a');
  g.fillStyle = low;
  g.fillRect(0, LANE_TOP + LANE_H * 4 + 5, W, H);
}

// khúc xương vàng khổng lồ dựng đứng ở đích
export function drawGoldenBone(ctx, x, y, h, t, r = h * 0.11) {
  ctx.save();
  ctx.translate(x, y);
  // hào quang
  const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, h * 0.7);
  glow.addColorStop(0, `rgba(255,230,120,${0.45 + 0.15 * Math.sin(t * 3)})`);
  glow.addColorStop(1, 'rgba(255,230,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-h * 0.7, -h * 0.7, h * 1.4, h * 1.4);
  const grad = ctx.createLinearGradient(-r * 2, 0, r * 2, 0);
  grad.addColorStop(0, '#c98a00');
  grad.addColorStop(0.45, '#ffe680');
  grad.addColorStop(1, '#d99a10');
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#7a4d00';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.rect(-r * 0.85, -h / 2 + r, r * 1.7, h - r * 2);
  for (const sy of [-1, 1]) {
    ctx.moveTo(-r * 0.8 + r, sy * (h / 2 - r));
    ctx.arc(-r * 0.8, sy * (h / 2 - r), r, 0, TAU);
    ctx.moveTo(r * 0.8 + r, sy * (h / 2 - r));
    ctx.arc(r * 0.8, sy * (h / 2 - r), r, 0, TAU);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-r * 0.85 + 3, -h / 2 + r, r * 1.7 - 6, h - r * 2);
  // lấp lánh
  for (let i = 0; i < 4; i++) {
    const a = t * 1.5 + i * 1.7;
    const sx = Math.sin(a) * r * 1.6;
    const sy = ((i / 4 + t * 0.12) % 1 - 0.5) * h;
    sparkle(ctx, sx, sy, 10 + 6 * Math.sin(a * 2), '#fff');
  }
  ctx.restore();
}

export function sparkle(ctx, x, y, s, color = '#fff') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ chú cún (nhìn ngang, quay sang phải)
// Toạ độ nội bộ: gốc = giữa chân trên mặt đất, chiều cao cún ~1 đơn vị, vẽ với scale S (px).
// pose: { run (0..1 tốc độ), phase, wag, action: 'idle'|'run'|'jump'|'bark'|'eat'|'pushup'|'dance'|'sleep'|'hit'|'angry', k (0..1 tiến độ động tác) }
export const ANCHORS = {
  hat: { x: 0.36, y: -1.0 },
  eye: { x: 0.47, y: -0.77 },
  body: { x: -0.05, y: -0.42 },
  back: { x: -0.12, y: -0.66 },
};

function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
}

function fluffBlob(ctx, x, y, rx, ry, bumps = 10) {
  ctx.beginPath();
  for (let i = 0; i <= bumps; i++) {
    const a = (i / bumps) * TAU;
    const px = x + Math.cos(a) * rx;
    const py = y + Math.sin(a) * ry;
    const br = Math.min(rx, ry) * 0.42;
    if (i === 0) ctx.moveTo(px + br, py);
    ctx.arc(px, py, br, 0, TAU);
  }
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
}

// vẽ cún: trả về toạ độ màn hình các điểm neo để gắn mũ / phụ kiện
export function drawDog(ctx, team, x, y, S, pose, outfit = {}, imgs = {}) {
  const t = pose.time || 0;
  const act = pose.action || 'idle';
  const k = pose.k || 0;
  let bodyY = 0;
  let rot = 0;
  let headRot = 0;
  let headDX = 0;
  let headDY = 0;
  let squash = 1;
  let legSwing = 0;
  let mouthOpen = 0;
  let eyesClosed = false;
  let lying = 0;
  const run = Math.min(1, pose.run || 0);
  const ph = pose.phase || 0;
  if (run > 0.05) {
    legSwing = Math.sin(ph) * 0.55 * run;
    bodyY = -Math.abs(Math.sin(ph)) * 0.06 * run;
    rot = -0.04 * run;
  } else {
    bodyY = Math.sin(t * 2.2) * 0.008;
  }
  if (act === 'jump') {
    const j = Math.sin(Math.min(1, k) * Math.PI);
    bodyY = -j * 0.75;
    rot = -0.25 * Math.cos(k * Math.PI);
    legSwing = 0.5;
    squash = k < 0.1 || k > 0.9 ? 0.92 : 1.04;
  } else if (act === 'bark') {
    headDX = 0.06 * Math.sin(Math.min(1, k * 3) * Math.PI);
    headRot = -0.15 * Math.sin(Math.min(1, k * 3) * Math.PI);
    mouthOpen = Math.max(0, Math.sin(k * Math.PI * 6));
  } else if (act === 'eat') {
    headRot = 0.55 * Math.sin(Math.min(1, k * 1.5) * Math.PI * 0.5 + 0.0001);
    headDY = 0.18 * Math.min(1, k * 4) * (k < 0.85 ? 1 : (1 - k) / 0.15);
    headDX = 0.05;
    mouthOpen = Math.abs(Math.sin(k * Math.PI * 10)) * 0.6;
  } else if (act === 'pushup') {
    const p = Math.abs(Math.sin(k * Math.PI * 4));
    bodyY = 0.12 * p;
    rot = 0.1 * p;
    squash = 1 - 0.05 * p;
  } else if (act === 'dance') {
    rot = Math.sin(k * Math.PI * 8) * 0.22;
    bodyY = -Math.abs(Math.sin(k * Math.PI * 8)) * 0.18;
    headRot = Math.sin(k * Math.PI * 8 + 1) * 0.2;
    legSwing = Math.sin(k * Math.PI * 16) * 0.4;
    mouthOpen = 0.4;
  } else if (act === 'sleep') {
    lying = 1;
    eyesClosed = true;
    bodyY = 0.16 + Math.sin(t * 1.6) * 0.01;
    headRot = 0.25;
    headDY = 0.12;
  } else if (act === 'hit') {
    rot = Math.sin(k * Math.PI * 10) * 0.12 * (1 - k);
    headRot = -0.2;
    eyesClosed = true;
  }
  const angry = pose.angry;
  if (angry) {
    rot += Math.sin(t * 40) * 0.015;
    mouthOpen = Math.max(mouthOpen, 0.3);
  }
  const wag = Math.sin(t * (angry ? 30 : 14) + ph) * (act === 'sleep' ? 0.1 : 0.5);

  ctx.save();
  ctx.translate(x, y);
  // bóng
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  const sh = 1 - Math.min(0.5, -bodyY);
  ellipse(ctx, 0, 0, S * 0.5 * sh, S * 0.07 * sh);
  ctx.fill();
  ctx.scale(S, S * squash);
  ctx.translate(0, bodyY);
  ctx.rotate(rot);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const OUT = 0.022;
  const ink = 'rgba(40,20,10,0.9)';

  // áo choàng / cánh vẽ phía sau thân
  const shirt = outfit.shirt;
  const acc = outfit.acc;
  if (shirt?.style === 'cape') drawCape(ctx, t, run);
  if (acc && acc.layer === 'behind') drawAccessory(ctx, acc, imgs, t, true);

  // đuôi
  ctx.save();
  ctx.translate(-0.43, -0.5 + lying * 0.1);
  ctx.rotate(-0.9 + wag * 0.6);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 0.16 + OUT * 2;
  if (team.fluffy || team.shiba) {
    ctx.fillStyle = team.fur;
    fluffBlob(ctx, 0.02, -0.15, 0.1, 0.13, 7);
    ctx.lineWidth = OUT * 2;
    ctx.stroke();
    ctx.fill();
    if (team.shiba) {
      ctx.fillStyle = team.belly;
      ellipse(ctx, 0.04, -0.12, 0.05, 0.07);
      ctx.fill();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-0.05, -0.18, 0.06, -0.3);
    ctx.stroke();
    ctx.strokeStyle = team.fur;
    ctx.lineWidth = 0.12;
    ctx.stroke();
  }
  ctx.restore();

  // chân (2 chân xa vẽ tối hơn)
  const legs = [
    { x: -0.3, far: true, s: 1 },
    { x: 0.16, far: true, s: -1 },
    { x: -0.22, far: false, s: -1 },
    { x: 0.24, far: false, s: 1 },
  ];
  for (const L of legs) {
    ctx.save();
    ctx.translate(L.x, -0.3);
    let a = legSwing * L.s;
    if (act === 'pushup' && L.x > 0) a = -0.4;
    if (lying) a = L.x > 0 ? -1.3 : 1.3;
    ctx.rotate(a);
    ctx.fillStyle = L.far ? team.furDark : team.fur;
    ctx.strokeStyle = ink;
    ctx.lineWidth = OUT * 2;
    roundRectPath(ctx, -0.055, 0, 0.11, 0.3 - lying * 0.08, 0.05);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = team.shiba || team.fluffy ? team.belly : L.far ? team.furDark : team.fur;
    ellipse(ctx, 0.015, 0.28 - lying * 0.08, 0.075, 0.045);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // thân
  ctx.strokeStyle = ink;
  ctx.lineWidth = OUT * 2;
  ctx.fillStyle = team.fur;
  if (team.fluffy) fluffBlob(ctx, -0.05, -0.43, 0.4, 0.25, 12);
  else ellipse(ctx, -0.05, -0.42, 0.42, 0.25);
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = team.belly;
  ellipse(ctx, 0.02, -0.32, 0.28, 0.11);
  ctx.fill();
  if (shirt) drawShirt(ctx, shirt, team, t);
  // vòng cổ màu đội
  ctx.save();
  ctx.translate(0.25, -0.55);
  ctx.rotate(-0.7);
  ctx.fillStyle = team.color;
  ctx.strokeStyle = ink;
  roundRectPath(ctx, -0.17, -0.035, 0.34, 0.07, 0.03);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#ffd34d';
  ctx.strokeStyle = ink;
  ellipse(ctx, 0.33, -0.47, 0.05, 0.05);
  ctx.fill();
  ctx.stroke();
  if (acc && acc.layer === 'body') drawAccessory(ctx, acc, imgs, t, false);

  // đầu
  ctx.save();
  ctx.translate(0.36 + headDX, -0.72 + headDY + lying * 0.12);
  ctx.rotate(headRot);
  // tai sau
  drawEar(ctx, team, -0.13, -0.2, true, t, act);
  ctx.fillStyle = team.fur;
  ctx.strokeStyle = ink;
  ctx.lineWidth = OUT * 2;
  if (team.fluffy) fluffBlob(ctx, 0, 0, 0.3, 0.28, 12);
  else ellipse(ctx, 0, 0, 0.3, 0.28);
  ctx.stroke();
  ctx.fill();
  // mõm
  ctx.fillStyle = team.shiba || team.fluffy ? team.belly : team.ear === 'flop' ? '#4a4b55' : team.belly;
  ellipse(ctx, 0.24, 0.08, 0.16, 0.12);
  ctx.fill();
  ctx.stroke();
  if (team.shiba) {
    ctx.fillStyle = team.belly;
    ellipse(ctx, 0.08, 0.14, 0.16, 0.1);
    ctx.fill();
  }
  // miệng
  ctx.strokeStyle = ink;
  ctx.lineWidth = OUT * 1.6;
  if (mouthOpen > 0.05) {
    ctx.fillStyle = '#7a1f2b';
    ellipse(ctx, 0.27, 0.17, 0.08, 0.04 + mouthOpen * 0.06);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff7a8a';
    ellipse(ctx, 0.27, 0.2 + mouthOpen * 0.03, 0.05, 0.025);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0.18, 0.15);
    ctx.quadraticCurveTo(0.23, 0.2, 0.28, 0.15);
    ctx.quadraticCurveTo(0.33, 0.2, 0.37, 0.14);
    ctx.stroke();
  }
  // mũi
  ctx.fillStyle = team.nose;
  ellipse(ctx, 0.38, 0.03, 0.05, 0.04);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, 0.37, 0.015, 0.015, 0.01);
  ctx.fill();
  // mắt
  const ex = 0.11;
  const ey = -0.05;
  if (eyesClosed) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = OUT * 1.8;
    ctx.beginPath();
    ctx.arc(ex, ey, 0.05, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    ctx.fillStyle = team.lightEye ? '#fff' : 'rgba(255,255,255,0)';
    if (team.lightEye) {
      ellipse(ctx, ex, ey, 0.07, 0.08);
      ctx.fill();
    }
    ctx.fillStyle = team.eye;
    ellipse(ctx, ex + 0.01, ey, 0.05, 0.065);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ellipse(ctx, ex + 0.025, ey - 0.025, 0.018, 0.022);
    ctx.fill();
  }
  if (angry) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = OUT * 2.2;
    ctx.beginPath();
    ctx.moveTo(ex - 0.07, ey - 0.13);
    ctx.lineTo(ex + 0.07, ey - 0.07);
    ctx.stroke();
  }
  // má hồng
  ctx.fillStyle = 'rgba(255,110,130,0.35)';
  ellipse(ctx, 0.05, 0.1, 0.05, 0.03);
  ctx.fill();
  // tai trước
  drawEar(ctx, team, 0.0, -0.22, false, t, act);
  if (outfit.glasses) drawGlasses(ctx, outfit.glasses, ex, ey, t);
  ctx.restore();

  // điểm neo mũ / phụ kiện (toạ độ màn hình)
  const m = ctx.getTransform();
  const headTop = m.transformPoint(new DOMPoint(0.36 + headDX + Math.sin(headRot) * 0.25, -0.72 + headDY + lying * 0.12 - Math.cos(headRot) * 0.25));
  ctx.restore();
  return { headTop: { x: headTop.x, y: headTop.y }, rot, headRot };
}

function drawEar(ctx, team, x, y, back, t, act) {
  ctx.save();
  ctx.translate(x, y);
  const flap = act === 'jump' || act === 'dance' ? Math.sin(t * 20) * 0.2 : 0;
  ctx.strokeStyle = 'rgba(40,20,10,0.9)';
  ctx.lineWidth = 0.044;
  ctx.fillStyle = back ? team.furDark : team.fur;
  if (team.ear === 'up') {
    ctx.rotate(-0.15 + flap);
    ctx.beginPath();
    ctx.moveTo(-0.1, 0.06);
    ctx.quadraticCurveTo(-0.06, -0.2, 0.02, -0.24);
    ctx.quadraticCurveTo(0.1, -0.12, 0.1, 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (!back) {
      ctx.fillStyle = '#f7b7a3';
      ctx.beginPath();
      ctx.moveTo(-0.05, 0.03);
      ctx.quadraticCurveTo(-0.03, -0.12, 0.02, -0.16);
      ctx.quadraticCurveTo(0.06, -0.08, 0.05, 0.03);
      ctx.closePath();
      ctx.fill();
    }
  } else if (team.ear === 'flop') {
    ctx.rotate(0.35 + flap);
    roundRectPath(ctx, -0.07, -0.02, 0.15, 0.3, 0.07);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.rotate(-0.1 + flap);
    fluffBlob(ctx, 0, -0.08, 0.09, 0.1, 7);
    ctx.stroke();
    ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ đồ mặc tự vẽ
function drawShirt(ctx, shirt, team, t) {
  const style = shirt.style;
  if (style === 'cape') {
    // cổ lông trắng chấm đen
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(40,20,10,0.9)';
    ctx.lineWidth = 0.03;
    fluffBlob(ctx, 0.2, -0.58, 0.16, 0.07, 8);
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = '#222';
    for (let i = 0; i < 4; i++) {
      ellipse(ctx, 0.1 + i * 0.07, -0.58 + (i % 2) * 0.03, 0.012, 0.018);
      ctx.fill();
    }
    return;
  }
  ctx.save();
  ellipse(ctx, -0.05, -0.42, 0.42, 0.25);
  ctx.clip();
  const base = { hawaii: '#25a9e8', gown: '#1f1b2e', jacket: '#232323', tux: '#6b2fb3', angel: '#fdfcf6' }[style] || shirt.color || '#e33';
  ctx.fillStyle = base;
  ctx.fillRect(-0.32, -0.7, 0.66, 0.42);
  if (style === 'hawaii') {
    for (let i = 0; i < 9; i++) {
      const fx = -0.28 + (i % 3) * 0.22 + (Math.floor(i / 3) % 2) * 0.1;
      const fy = -0.62 + Math.floor(i / 3) * 0.12;
      ctx.fillStyle = i % 2 ? '#ff6fae' : '#ffe14d';
      for (let p = 0; p < 5; p++) {
        ellipse(ctx, fx + Math.cos((p / 5) * TAU) * 0.03, fy + Math.sin((p / 5) * TAU) * 0.03, 0.025, 0.025);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ellipse(ctx, fx, fy, 0.015, 0.015);
      ctx.fill();
    }
  } else if (style === 'gown') {
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(0.18, -0.7, 0.05, 0.42);
    ctx.fillStyle = '#c0182c';
    ctx.fillRect(0.12, -0.7, 0.05, 0.42);
  } else if (style === 'jacket') {
    ctx.fillStyle = '#ffcc33';
    ctx.fillRect(0.2, -0.7, 0.02, 0.42);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#d9d9d9';
      ellipse(ctx, -0.25 + i * 0.1, -0.6, 0.014, 0.014);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(-0.32, -0.66, 0.66, 0.04);
  } else if (style === 'tux') {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0.12, -0.7);
    ctx.lineTo(0.34, -0.7);
    ctx.lineTo(0.34, -0.3);
    ctx.lineTo(0.2, -0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd34d';
    for (let i = 0; i < 3; i++) {
      ellipse(ctx, 0.25, -0.58 + i * 0.08, 0.012, 0.012);
      ctx.fill();
    }
  } else if (style === 'angel') {
    for (let i = 0; i < 7; i++) {
      const sx = -0.26 + (i % 4) * 0.16 + (i > 3 ? 0.08 : 0);
      const sy = -0.6 + (i > 3 ? 0.13 : 0);
      sparkle(ctx, sx, sy, 0.035 + 0.01 * Math.sin(t * 4 + i), '#ffcf33');
    }
  }
  // gấu áo
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-0.32, -0.3, 0.66, 0.03);
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,20,10,0.9)';
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.moveTo(-0.3, -0.3);
  ctx.lineTo(0.33, -0.3);
  ctx.stroke();
  if (style === 'tux') {
    // nơ cổ
    ctx.fillStyle = '#d11f3a';
    ctx.beginPath();
    ctx.moveTo(0.3, -0.56);
    ctx.lineTo(0.22, -0.6);
    ctx.lineTo(0.22, -0.52);
    ctx.closePath();
    ctx.moveTo(0.3, -0.56);
    ctx.lineTo(0.38, -0.6);
    ctx.lineTo(0.38, -0.52);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCape(ctx, t, run) {
  const flow = Math.sin(t * 6) * 0.04 + run * 0.12;
  ctx.save();
  ctx.fillStyle = '#c3122f';
  ctx.strokeStyle = 'rgba(40,20,10,0.9)';
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.moveTo(0.22, -0.62);
  ctx.quadraticCurveTo(-0.2, -0.75 - flow, -0.62 - flow, -0.5 + flow);
  ctx.quadraticCurveTo(-0.55, -0.25, -0.4, -0.2);
  ctx.quadraticCurveTo(-0.1, -0.35, 0.2, -0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.moveTo(-0.62 - flow, -0.5 + flow);
  ctx.quadraticCurveTo(-0.55, -0.25, -0.4, -0.2);
  ctx.lineTo(-0.42, -0.24);
  ctx.quadraticCurveTo(-0.55, -0.3, -0.6 - flow, -0.5 + flow);
  ctx.fill();
  ctx.restore();
}

function drawGlasses(ctx, g, ex, ey, t) {
  const style = g.style;
  ctx.save();
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 0.022;
  const lens = (fill, stroke) => {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.fill();
    ctx.stroke();
  };
  // càng kính về phía tai + sống kính về phía mõm
  const arms = (color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.024;
    ctx.beginPath();
    ctx.moveTo(ex - 0.08, ey - 0.01);
    ctx.lineTo(ex - 0.2, ey - 0.04);
    ctx.moveTo(ex + 0.08, ey - 0.01);
    ctx.lineTo(ex + 0.17, ey + 0.0);
    ctx.stroke();
  };
  if (style === 'round-sun') {
    arms('#1b1b1b');
    ellipse(ctx, ex + 0.01, ey, 0.09, 0.085);
    lens('rgba(20,20,30,0.92)', '#1b1b1b');
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipse(ctx, ex - 0.02, ey - 0.03, 0.025, 0.015, -0.5);
    ctx.fill();
  } else if (style === 'square') {
    arms('#6b3b1b');
    roundRectPath(ctx, ex - 0.08, ey - 0.07, 0.17, 0.13, 0.02);
    lens('rgba(200,235,255,0.25)', '#6b3b1b');
  } else if (style === 'star') {
    arms('#ff3fa4');
    starPath(ctx, ex + 0.01, ey, 0.11, 0.05, 5);
    lens('rgba(255,90,180,0.85)', '#ffcf33');
  } else if (style === 'mask') {
    ctx.fillStyle = '#5b1fa0';
    ctx.strokeStyle = '#ffd34d';
    ctx.beginPath();
    ctx.moveTo(ex - 0.18, ey - 0.02);
    ctx.quadraticCurveTo(ex - 0.05, ey - 0.15, ex + 0.17, ey - 0.06);
    ctx.quadraticCurveTo(ex + 0.12, ey + 0.08, ex - 0.04, ey + 0.07);
    ctx.quadraticCurveTo(ex - 0.12, ey + 0.06, ex - 0.18, ey - 0.02);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#111';
    ellipse(ctx, ex + 0.01, ey - 0.005, 0.04, 0.03);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ellipse(ctx, ex + 0.02, ey - 0.012, 0.012, 0.012);
    ctx.fill();
  } else if (style === 'gold') {
    arms('#d9a400');
    ellipse(ctx, ex + 0.01, ey, 0.09, 0.085);
    lens('rgba(255,210,80,0.5)', '#d9a400');
    ctx.lineWidth = 0.012;
    ctx.strokeStyle = '#fff3a0';
    ctx.stroke();
    sparkle(ctx, ex + 0.06, ey - 0.06, 0.03 + 0.015 * Math.sin(t * 6), '#fff');
  } else if (style === 'heart') {
    arms('#e0193c');
    heartPath(ctx, ex + 0.01, ey + 0.01, 0.11);
    lens('rgba(255,40,80,0.85)', '#9d0a24');
  }
  ctx.restore();
}

export function starPath(ctx, x, y, r1, r2, n = 5) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = -Math.PI / 2 + (i / (n * 2)) * TAU;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}
export function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.5);
  ctx.bezierCurveTo(x - s * 1.1, y - s * 0.1, x - s * 0.5, y - s * 0.9, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.9, x + s * 1.1, y - s * 0.1, x, y + s * 0.5);
  ctx.closePath();
}

// phụ kiện (ảnh emoji/ảnh riêng) gắn trên thân, toạ độ nội bộ của cún
function drawAccessory(ctx, acc, imgs, t) {
  const img = imgs[acc.id];
  const p = acc.pos || { x: -0.1, y: -0.66, s: 0.4, r: 0 };
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((p.r || 0) + (acc.wiggle ? Math.sin(t * 5) * 0.08 : 0));
  if (p.flip) ctx.scale(-1, 1);
  if (img) ctx.drawImage(img, -p.s / 2, -p.s / 2, p.s, p.s);
  ctx.restore();
}

// mũ: ảnh emoji/ảnh riêng đặt trên đỉnh đầu (toạ độ màn hình), hoặc vòng hào quang tự vẽ
export function drawHat(ctx, hat, imgs, anchor, S, t, headRot = 0) {
  if (!hat) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(anchor.x, anchor.y);
  ctx.rotate(headRot + (hat.tilt ?? 0.18));
  if (hat.style === 'halo') {
    const y = -S * 0.16 + Math.sin(t * 3) * S * 0.02;
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = S * 0.05;
    ctx.shadowColor = '#fff3a0';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(0, y, S * 0.2, S * 0.06, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const img = imgs[hat.id];
  const s = S * (hat.size || 0.5);
  if (img) ctx.drawImage(img, -s / 2, -s * (hat.lift ?? 0.78), s, s);
  ctx.restore();
}
