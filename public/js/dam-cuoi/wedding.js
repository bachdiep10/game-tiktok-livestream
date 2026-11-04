// Cảnh "Ăn cỗ đám cưới": bên trong rạp cưới. Trần vải trắng đỏ, đèn chùm, sân khấu phông Song Hỷ,
// thảm đỏ giữa lối đi, bàn tròn trải khăn có mâm cỗ, ghế bọc nơ, cổng hoa ở lối vào.
// Tất cả vẽ bằng code, không dùng ảnh của bên thứ ba.
export const SCENE = { groom: 'Minh', bride: 'Lan' };
export function setNames(groom, bride) {
  if (groom) SCENE.groom = String(groom).slice(0, 12);
  if (bride) SCENE.bride = String(bride).slice(0, 12);
}
export const W = 1080;
export const H = 1920;
export const GROUND_Y = 960; // mép trước sân khấu
export const STAGE_Y = 955; // mặt sân khấu (chân người đứng trên sân khấu)
export const CURB_Y = 1720; // khách đi lại không xuống quá vạch này
export const ROAD_Y = 1760;
export const FOOT_Y = 1790; // dải chú thích phía dưới
export const AISLE_X = 540; // thảm đỏ giữa rạp
export const GATE = { x: 540, y: 1760 }; // cổng hoa, khách vào ra ở đây
const TAU = Math.PI * 2;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// tỉ lệ nhân vật theo độ sâu (xa nhỏ, gần to)
export function scaleAtY(y) {
  return lerp(0.6, 1.06, clamp((y - 940) / (1640 - 940), 0, 1));
}

// ------------------------------------------------------------------ chỗ ngồi
// Mỗi bàn tròn có 2 ghế hai bên. Toạ độ là điểm chân (mặt đất) của nhân vật.
const STOOL_COLORS = ['#e53935', '#ec407a', '#e53935', '#ec407a'];
export const TABLES = [];
export const SEATS = [];
function addTable(x, y) {
  const s = scaleAtY(y);
  const t = { id: TABLES.length, x, y: y - 6 * s, s, seats: [] };
  TABLES.push(t);
  for (const side of [-1, 1]) {
    const seat = { id: SEATS.length, x: x + side * 66 * s, y, s, table: t.id, side, color: STOOL_COLORS[(SEATS.length * 3) % STOOL_COLORS.length] };
    SEATS.push(seat);
    t.seats.push(seat.id);
  }
}
for (const y of [1085, 1215, 1350, 1490, 1630]) {
  for (const x of [125, 365, 715, 955]) addTable(x, y);
}

// mâm chủ hôn (cho người tặng quà lớn): ngay dưới sân khấu bên trái
export const VIP = { x: 230, y: 1000, s: scaleAtY(1000) * 1.12 };
// bục MC ở sân khấu bên phải, bánh cưới bên trái, tháp ly bên phải
export const STALL = { x: 800, y: STAGE_Y + 8, ownerX: 800, jugX: 900, jarX: 175, pipeX: 905 };
export const OWNER_MOUTH = { x: 800, y: 800 };
export const JUG_TAP = { x: 870, y: 905 }; // đồ uống bay ra từ quầy tháp ly
export const COUPLE_HOME = { groom: { x: 500, y: STAGE_Y }, bride: { x: 590, y: STAGE_Y } };
export const GIFT_BOX = { x: 70, y: 990 }; // thùng mừng cưới bên trái sân khấu

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

// ------------------------------------------------------------------ rạp cưới (nền tĩnh)
function ceiling(ctx) {
  // trần rạp: vải trắng xếp nếp, dải vải đỏ võng xuống, viền vàng
  const g = ctx.createLinearGradient(0, 0, 0, 520);
  g.addColorStop(0, '#fbf3ea');
  g.addColorStop(1, '#f1e0cf');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 520);
  ctx.strokeStyle = 'rgba(180,140,110,0.18)';
  ctx.lineWidth = 3;
  for (let i = -10; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(540, -40);
    ctx.lineTo(540 + i * 120, 520);
    ctx.stroke();
  }
  for (let k = 0; k < 3; k++) {
    const y = 90 + k * 140;
    ctx.fillStyle = k % 2 ? '#c62828' : '#d81b60';
    for (let i = 0; i < 6; i++) {
      const x0 = i * 180;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.quadraticCurveTo(x0 + 90, y + 70, x0 + 180, y);
      ctx.quadraticCurveTo(x0 + 90, y + 40, x0, y);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd54f';
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath();
      ctx.arc(i * 180, y, 9, 0, TAU);
      ctx.fill();
    }
  }
}

function backWall(ctx) {
  // vách rạp phía sau: rèm trắng xếp nếp, dải đèn rèm sáng ấm
  const top = 500;
  const g = ctx.createLinearGradient(0, top, 0, STAGE_Y);
  g.addColorStop(0, '#fff8f0');
  g.addColorStop(1, '#f6e3d6');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, STAGE_Y - top);
  for (let x = 0; x < W; x += 36) {
    ctx.fillStyle = (x / 36) % 2 ? 'rgba(255,255,255,0.6)' : 'rgba(190,150,130,0.16)';
    ctx.fillRect(x, top, 18, STAGE_Y - top);
  }
  const rnd = seeded(5);
  for (let x = 30; x < W; x += 46) {
    for (let y = top + 20; y < 900; y += 34) {
      ctx.fillStyle = `rgba(255,214,120,${0.35 + rnd() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x + Math.sin(y * 0.05) * 4, y, 2.6, 0, TAU);
      ctx.fill();
    }
  }
  // rèm đỏ vén hai bên
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 0 : W;
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.moveTo(x0, top - 10);
    ctx.lineTo(x0 - side * -150, top - 10);
    ctx.quadraticCurveTo(x0 - side * -40, 700, x0 - side * -90, STAGE_Y);
    ctx.lineTo(x0, STAGE_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.ellipse(x0 - side * -62, 720, 16, 8, 0, 0, TAU);
    ctx.fill();
  }
}

function stagePlatform(ctx) {
  // sân khấu gỗ trải thảm hồng, bậc lên ở giữa
  ctx.fillStyle = '#f8bbd0';
  ctx.fillRect(110, STAGE_Y - 70, 860, 70);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(110, STAGE_Y - 70, 860, 6);
  // chân tường hai bên sân khấu (tránh hở nền đen)
  ctx.fillStyle = '#d7c2a8';
  ctx.fillRect(0, STAGE_Y - 2, W, 30);
  ctx.fillStyle = '#ad1457';
  ctx.fillRect(100, STAGE_Y, 880, 26);
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(100, STAGE_Y, 880, 4);
  // diềm hoa trước sân khấu
  const rnd = seeded(12);
  for (let x = 110; x < 970; x += 22) {
    ctx.fillStyle = ['#fff', '#f8bbd0', '#ff80ab', '#ffe082'][Math.floor(rnd() * 4)];
    ctx.beginPath();
    ctx.arc(x, STAGE_Y + 30 + rnd() * 6, 9, 0, TAU);
    ctx.fill();
  }
  // bậc lên
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = i ? '#c2185b' : '#d81b60';
    ctx.fillRect(470 - i * 10, STAGE_Y + 26 + i * 14, 140 + i * 20, 16);
  }
}

function floor(ctx) {
  // sàn rạp lát gạch hoa văn, thảm đỏ giữa lối đi
  const top = STAGE_Y + 26;
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, '#e9d6c0');
  g.addColorStop(1, '#f3e3cf');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, H - top);
  ctx.strokeStyle = 'rgba(160,120,80,0.18)';
  ctx.lineWidth = 2;
  const vpX = W / 2;
  const vpY = 420;
  for (let c = -14; c <= 14; c++) {
    ctx.beginPath();
    ctx.moveTo(vpX + c * 90 * ((top - vpY) / (1300 - vpY)), top);
    ctx.lineTo(vpX + c * 90 * ((H - vpY) / (1300 - vpY)), H);
    ctx.stroke();
  }
  let y = top;
  while (y < H) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    y += 52 * scaleAtY(y) + 6;
  }
  // thảm đỏ
  const wTop = 70;
  const wBot = 150;
  ctx.fillStyle = '#b71c1c';
  ctx.beginPath();
  ctx.moveTo(AISLE_X - wTop, top);
  ctx.lineTo(AISLE_X + wTop, top);
  ctx.lineTo(AISLE_X + wBot, H);
  ctx.lineTo(AISLE_X - wBot, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(AISLE_X - wTop + 8, top);
  ctx.lineTo(AISLE_X - wBot + 12, H);
  ctx.moveTo(AISLE_X + wTop - 8, top);
  ctx.lineTo(AISLE_X + wBot - 12, H);
  ctx.stroke();
  // cánh hoa rải trên thảm
  const rnd = seeded(77);
  for (let i = 0; i < 60; i++) {
    const yy = top + rnd() * (H - top);
    const half = lerp(wTop, wBot, (yy - top) / (H - top)) - 16;
    ctx.fillStyle = rnd() < 0.5 ? '#ff80ab' : '#fff';
    ctx.beginPath();
    ctx.ellipse(AISLE_X + (rnd() * 2 - 1) * half, yy, 5, 3, rnd() * 3, 0, TAU);
    ctx.fill();
  }
  // cột hoa dọc lối đi
  for (const yy of [1150, 1420, 1690]) {
    for (const side of [-1, 1]) {
      const s = scaleAtY(yy);
      const half = lerp(wTop, wBot, (yy - top) / (H - top));
      flowerStand(ctx, AISLE_X + side * (half + 22 * s), yy, s * 0.9);
    }
  }
}

function flowerStand(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e0c48a';
  ctx.fillRect(-4, -110, 8, 110);
  ctx.fillRect(-16, -6, 32, 6);
  const rnd = seeded(Math.floor(x * 7 + y));
  for (let i = 0; i < 14; i++) {
    const a = rnd() * TAU;
    const r = rnd() * 22;
    ctx.fillStyle = ['#fff', '#f8bbd0', '#ff4081', '#ffe082'][i % 4];
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, -124 + Math.sin(a) * r * 0.7, 8, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#66bb6a';
  ctx.beginPath();
  ctx.ellipse(-18, -112, 10, 4, -0.5, 0, TAU);
  ctx.ellipse(18, -112, 10, 4, 0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function giftBox(ctx) {
  // thùng mừng cưới trên bàn nhỏ
  const { x, y } = GIFT_BOX;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 56, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  rr(ctx, x - 50, y - 64, 100, 64, 6);
  ctx.fill();
  ctx.fillStyle = '#d32f2f';
  ctx.fillRect(x - 50, y - 64, 100, 10);
  ctx.fillStyle = '#c62828';
  rr(ctx, x - 36, y - 136, 72, 72, 8);
  ctx.fill();
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x - 20, y - 128, 40, 6);
  ctx.fillStyle = '#ffd54f';
  ctx.font = '900 14px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MỪNG', x, y - 96);
  ctx.fillText('CƯỚI', x, y - 78);
  ctx.restore();
}

function gateArch(ctx) {
  // cổng hoa ở lối vào (phía dưới)
  const y = 1900;
  ctx.save();
  for (const side of [-1, 1]) {
    const x = AISLE_X + side * 230;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 14, 1700, 28, y - 1700);
    const rnd = seeded(side > 0 ? 3 : 4);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = ['#fff', '#f8bbd0', '#ff4081', '#ffe082'][i % 4];
      ctx.beginPath();
      ctx.arc(x + (rnd() - 0.5) * 40, 1700 + rnd() * 200, 10 + rnd() * 6, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawStatic(ctx, flags = {}) {
  ctx.save();
  ceiling(ctx);
  backWall(ctx);
  stagePlatform(ctx);
  floor(ctx);
  giftBox(ctx);
  if (flags.showHouses !== false) gateArch(ctx);
  ctx.restore();
}

export function drawCanopy(ctx, t = 0) {
  // đèn chùm pha lê lấp lánh + dây đèn võng dưới trần
  ctx.save();
  for (const [cx, cy, sc] of [[200, 470, 0.8], [540, 440, 1], [880, 470, 0.8]]) {
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cy - 60 * sc);
    ctx.stroke();
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160 * sc);
    glow.addColorStop(0, 'rgba(255,236,170,0.45)');
    glow.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 160 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8c547';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20 * sc, 70 * sc, 14 * sc, 0, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI;
      const px = cx - 70 * sc + i * 14 * sc;
      const len = (26 + Math.sin(a) * 34) * sc;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, cy - 14 * sc);
      ctx.lineTo(px, cy - 14 * sc + len);
      ctx.stroke();
      const tw = Math.sin(t * 0.006 + i * 1.7 + cx) > 0.6;
      ctx.fillStyle = tw ? '#ffffff' : 'rgba(200,230,255,0.9)';
      ctx.beginPath();
      ctx.arc(px, cy - 14 * sc + len, (tw ? 5 : 3.5) * sc, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(cx - 48 * sc + i * 24 * sc, cy - 32 * sc, 6 * sc, 0, TAU);
      ctx.fill();
    }
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
  // đĩa xôi gấc và nem rán
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-26, -50, 11, 4, 0, 0, TAU);
  ctx.ellipse(26, -50, 11, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.ellipse(-26, -53, 7, 4.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c77b30';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(21 + i * 5, -53, 2.4, 4, 0.4, 0, TAU);
    ctx.fill();
  }
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
  const bg = ctx.createLinearGradient(0, 535, 0, 885);
  bg.addColorStop(0, '#d81b60');
  bg.addColorStop(1, '#ad1457');
  ctx.fillStyle = bg;
  rr(ctx, cx - 300, 535, 600, 350, 16);
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
    const py = 870 + Math.sin(a) * ry + (rnd() - 0.5) * 24;
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
  ctx.arc(cx, 628, 60, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c62828';
  ctx.font = '900 82px "Segoe UI", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('囍', cx, 632);
  // tên
  ctx.fillStyle = '#fff';
  ctx.font = '900 50px "Segoe UI", system-ui, sans-serif';
  ctx.strokeStyle = 'rgba(120,0,40,0.8)';
  ctx.lineWidth = 7;
  const nm = `${SCENE.groom} & ${SCENE.bride}`;
  ctx.strokeText(nm, cx, 716);
  ctx.fillText(nm, cx, 716);
  ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('TRĂM NĂM HẠNH PHÚC', cx, 750);
  // đèn LED chạy quanh viền
  for (let i = 0; i < 28; i++) {
    const on = Math.sin(t * 0.004 + i * 0.7) > 0;
    ctx.fillStyle = on ? '#fff59d' : '#8d6e63';
    const px = cx - 290 + (i / 27) * 580;
    ctx.beginPath();
    ctx.arc(px, 547, 4.5, 0, TAU);
    ctx.fill();
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


// bánh cưới nhiều tầng trên sân khấu. cut: đã cắt bánh
export function drawCake(ctx, cut = false, t = 0) {
  const x = STALL.jarX;
  let y = STAGE_Y - 6;
  ctx.save();
  // bàn nhỏ
  ctx.fillStyle = '#fff';
  rr(ctx, x - 62, y - 50, 124, 50, 6);
  ctx.fill();
  ctx.fillStyle = '#f8bbd0';
  ctx.fillRect(x - 62, y - 50, 124, 8);
  y -= 50;
  const tiers = [[96, 36], [72, 32], [50, 28]];
  tiers.forEach(([w, h], i) => {
    ctx.fillStyle = i % 2 ? '#fde4ec' : '#fffaf5';
    rr(ctx, x - w / 2, y - h, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,120,150,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f48fb1';
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(x - w / 2 + 8 + k * ((w - 16) / 4), y - h + 4, 3.5, 0, TAU);
      ctx.fill();
    }
    y -= h;
  });
  // hai nhân vật nhỏ trên đỉnh bánh
  ctx.fillStyle = '#212121';
  rr(ctx, x - 12, y - 26, 10, 22, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 26);
  ctx.lineTo(x + 10, y - 26);
  ctx.lineTo(x + 15, y);
  ctx.lineTo(x - 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6d3b3';
  ctx.beginPath();
  ctx.arc(x - 7, y - 31, 5, 0, TAU);
  ctx.arc(x + 6, y - 31, 5, 0, TAU);
  ctx.fill();
  if (cut) {
    // miếng bánh đã cắt + dao nơ đỏ
    ctx.fillStyle = 'rgba(120,60,40,0.55)';
    ctx.beginPath();
    ctx.moveTo(x + 14, STAGE_Y - 56);
    ctx.lineTo(x + 46, STAGE_Y - 56);
    ctx.lineTo(x + 46, STAGE_Y - 86);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cfd8dc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 50, STAGE_Y - 120);
    ctx.lineTo(x + 20, STAGE_Y - 62);
    ctx.stroke();
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(x + 52, STAGE_Y - 124, 6, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// tháp ly champagne: fill 0..1 là mức rót (từ trên xuống)
export function drawChampagne(ctx, fill = 0, t = 0) {
  const x = STALL.pipeX;
  const y = STAGE_Y - 6;
  ctx.save();
  ctx.fillStyle = '#fff';
  rr(ctx, x - 58, y - 46, 116, 46, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(x - 58, y - 46, 116, 6);
  const rows = 4;
  let n = 0;
  const total = 10;
  for (let r = rows - 1; r >= 0; r--) {
    const cnt = rows - r;
    for (let c = 0; c < cnt; c++) {
      const px = x + (c - (cnt - 1) / 2) * 26;
      const py = y - 46 - (rows - 1 - r) * 0;
      const gy = y - 46 - (r) * 24;
      const lvl = clamp(fill * total - (total - 1 - n), 0, 1);
      n++;
      // ly
      ctx.fillStyle = `rgba(255,214,90,${0.25 + 0.65 * lvl})`;
      ctx.beginPath();
      ctx.moveTo(px - 11, gy - 20);
      ctx.lineTo(px + 11, gy - 20);
      ctx.lineTo(px, gy - 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, gy - 4);
      ctx.lineTo(px, gy);
      ctx.stroke();
      if (lvl > 0.9 && Math.sin(t * 0.01 + n) > 0.7) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px + 4, gy - 16, 1.6, 0, TAU);
        ctx.fill();
      }
      void py;
    }
  }
  ctx.restore();
}

export function drawStallFront(ctx) {
  // bục MC bằng gỗ có chữ song hỷ
  const x = STALL.ownerX;
  const y = STAGE_Y + 6;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y, 46, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8d5a2b';
  ctx.beginPath();
  ctx.moveTo(x - 36, y - 92);
  ctx.lineTo(x + 36, y - 92);
  ctx.lineTo(x + 28, y);
  ctx.lineTo(x - 28, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a86b33';
  rr(ctx, x - 44, y - 104, 88, 16, 4);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(x, y - 52, 18, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c62828';
  ctx.font = '900 24px "Segoe UI", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('囍', x, y - 50);
  // micro trên bục
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 104);
  ctx.lineTo(x - 22, y - 132);
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - 24, y - 136, 6, 0, TAU);
  ctx.fill();
  ctx.restore();
}
