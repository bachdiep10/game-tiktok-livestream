// Hình vẽ cho game Bói bài Tarot: phòng xem bói ban đêm, cô Nguyệt (người xem bói), mèo đen,
// quả cầu pha lê, nến, và bộ bài tự vẽ (mặt sau + 22 biểu tượng). Tất cả vẽ bằng canvas, không dùng ảnh ngoài.
export const W = 1080;
export const H = 1920;
import { CARDS } from './cards.js';

const TAU = Math.PI * 2;
const CARDS_INDEX = new Map(CARDS.map((card, i) => [card, i]));

// Vị trí chính trên màn hình
export const PANEL = { x: 40, y: 272, w: 1000, h: 468 };
export const READER = { x: 540, y: 862 };
export const BALL = { x: 540, y: 1024, r: 56 };
export const TABLE_Y = 1054;
export const CARD = { w: 214, h: 346, y: 1092, gap: 52 };
export const CARD_X = [W / 2 - CARD.w - CARD.gap, W / 2, W / 2 + CARD.w + CARD.gap];

export function roundRectPath(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

// số giả ngẫu nhiên ổn định (để ngôi sao, hoa văn không nhảy mỗi lần vẽ)
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function starShape(c, x, y, r, points = 5, inner = 0.45, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r * inner : r;
    const a = rot + (i * Math.PI) / points;
    c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  c.closePath();
}
function crescent(c, x, y, r, dir = 1, cut = 0.62) {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.arc(x + dir * r * 0.42, y - r * 0.12, r * cut * 1.25, 0, TAU, true);
  c.closePath();
}
export { starShape, crescent };

// ------------------------------------------------------------------ phòng (vẽ tĩnh 1 lần)
export function drawRoom(c, cfg = {}) {
  const r = seeded(7);
  // tường
  let g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#120a2a');
  g.addColorStop(0.45, '#26124a');
  g.addColorStop(1, '#14082a');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  // giấy dán tường hoa văn trăng sao mờ
  c.save();
  c.globalAlpha = 0.07;
  c.fillStyle = '#e8c766';
  for (let y = 40; y < TABLE_Y; y += 90) {
    for (let x = (y / 90) % 2 ? 45 : 0; x < W; x += 90) {
      starShape(c, x, y, 7, 4, 0.35);
      c.fill();
    }
  }
  c.restore();

  // cửa sổ vòm sau lưng cô Nguyệt
  const wx = 540;
  const wy = 470;
  const ww = 560;
  const wh = 620;
  c.save();
  c.beginPath();
  c.moveTo(wx - ww / 2, wy + wh / 2);
  c.lineTo(wx - ww / 2, wy - wh / 2 + ww / 2);
  c.arc(wx, wy - wh / 2 + ww / 2, ww / 2, Math.PI, 0);
  c.lineTo(wx + ww / 2, wy + wh / 2);
  c.closePath();
  c.save();
  c.clip();
  g = c.createLinearGradient(0, wy - wh / 2, 0, wy + wh / 2);
  g.addColorStop(0, '#0b1a4a');
  g.addColorStop(0.6, '#2a2a78');
  g.addColorStop(1, '#5a3a8a');
  c.fillStyle = g;
  c.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
  // sao
  for (let i = 0; i < 90; i++) {
    const sx = wx - ww / 2 + r() * ww;
    const sy = wy - wh / 2 + r() * wh * 0.8;
    c.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`;
    c.beginPath();
    c.arc(sx, sy, 0.8 + r() * 1.8, 0, TAU);
    c.fill();
  }
  // trăng tròn lớn
  const mg = c.createRadialGradient(wx + 120, wy - 150, 10, wx + 120, wy - 150, 200);
  mg.addColorStop(0, 'rgba(255,248,214,0.55)');
  mg.addColorStop(1, 'rgba(255,248,214,0)');
  c.fillStyle = mg;
  c.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
  c.fillStyle = '#fff4cf';
  c.beginPath();
  c.arc(wx + 120, wy - 150, 82, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(214,196,150,0.45)';
  for (const [dx, dy, rr] of [[-25, -18, 16], [20, 22, 12], [30, -30, 8], [-10, 35, 9], [-40, 15, 6]]) {
    c.beginPath();
    c.arc(wx + 120 + dx, wy - 150 + dy, rr, 0, TAU);
    c.fill();
  }
  // mái nhà phố xa
  c.fillStyle = '#120c30';
  c.beginPath();
  c.moveTo(wx - ww / 2, wy + wh / 2);
  let x = wx - ww / 2;
  while (x < wx + ww / 2) {
    const bw = 40 + r() * 70;
    const bh = 60 + r() * 120;
    c.lineTo(x, wy + wh / 2 - bh);
    c.lineTo(x + bw * 0.5, wy + wh / 2 - bh - 30);
    c.lineTo(x + bw, wy + wh / 2 - bh);
    x += bw;
  }
  c.lineTo(wx + ww / 2, wy + wh / 2);
  c.fill();
  c.fillStyle = 'rgba(255,200,90,0.8)';
  for (let i = 0; i < 16; i++) c.fillRect(wx - ww / 2 + r() * ww, wy + wh / 2 - 20 - r() * 110, 6, 8);
  c.restore();
  // khung cửa sổ gỗ
  c.lineWidth = 22;
  c.strokeStyle = '#3b2216';
  c.stroke();
  c.lineWidth = 6;
  c.strokeStyle = '#c9a24a';
  c.stroke();
  c.lineWidth = 8;
  c.strokeStyle = '#3b2216';
  c.beginPath();
  c.moveTo(wx, wy - wh / 2);
  c.lineTo(wx, wy + wh / 2);
  c.moveTo(wx - ww / 2, wy + 40);
  c.lineTo(wx + ww / 2, wy + 40);
  c.stroke();
  c.restore();

  // rèm nhung hai bên
  for (const side of [-1, 1]) {
    const cx = side < 0 ? 0 : W;
    g = c.createLinearGradient(cx, 0, cx - side * 260, 0);
    g.addColorStop(0, '#4a0f3a');
    g.addColorStop(1, '#7a1d5a');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(cx, 0);
    c.lineTo(cx - side * 250, 0);
    c.bezierCurveTo(cx - side * 200, 300, cx - side * 120, 520, cx - side * 70, 640);
    c.bezierCurveTo(cx - side * 90, 820, cx - side * 60, 980, cx - side * 40, TABLE_Y);
    c.lineTo(cx, TABLE_Y);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)';
    c.lineWidth = 3;
    for (let i = 1; i < 5; i++) {
      c.beginPath();
      c.moveTo(cx - side * i * 48, 0);
      c.bezierCurveTo(cx - side * i * 40, 300, cx - side * i * 22, 600, cx - side * i * 10, TABLE_Y);
      c.stroke();
    }
    // dây vén rèm
    c.fillStyle = '#e0b84f';
    c.beginPath();
    c.ellipse(cx - side * 72, 640, 34, 12, side * 0.3, 0, TAU);
    c.fill();
    c.beginPath();
    c.arc(cx - side * 72, 668, 9, 0, TAU);
    c.fill();
  }

  // kệ sách và lọ thuỷ tinh bên trái
  drawShelf(c, 60, 860, 250, r);
  drawShelf(c, 60, 990, 250, r);
  // kệ phải (dưới thực đơn chủ đề sẽ phủ lên một phần)
  drawShelf(c, 790, 1030, 250, r, true);

  // dây đèn sao treo trên trần
  c.strokeStyle = 'rgba(232,199,102,0.6)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 18);
  c.quadraticCurveTo(W / 2, 110, W, 18);
  c.stroke();

  // khăn trải bàn nhung
  g = c.createLinearGradient(0, TABLE_Y, 0, H);
  g.addColorStop(0, '#5a1240');
  g.addColorStop(0.3, '#3d0b2e');
  g.addColorStop(1, '#1e0518');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, TABLE_Y + 30);
  c.quadraticCurveTo(W / 2, TABLE_Y - 30, W, TABLE_Y + 30);
  c.lineTo(W, H);
  c.lineTo(0, H);
  c.closePath();
  c.fill();
  c.strokeStyle = '#d8b25a';
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(0, TABLE_Y + 30);
  c.quadraticCurveTo(W / 2, TABLE_Y - 30, W, TABLE_Y + 30);
  c.stroke();
  // vòng tròn chiêm tinh trên khăn
  c.save();
  c.globalAlpha = 0.22;
  c.strokeStyle = '#e8c766';
  c.lineWidth = 3;
  c.translate(W / 2, 1300);
  c.scale(1, 0.42);
  for (const rr of [470, 430, 300]) {
    c.beginPath();
    c.arc(0, 0, rr, 0, TAU);
    c.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    c.beginPath();
    c.moveTo(Math.cos(a) * 300, Math.sin(a) * 300);
    c.lineTo(Math.cos(a) * 430, Math.sin(a) * 430);
    c.stroke();
    c.fillStyle = '#e8c766';
    starShape(c, Math.cos(a + 0.26) * 450, Math.sin(a + 0.26) * 450, 10, 4, 0.4);
    c.fill();
  }
  c.restore();
  // hoa văn sao rải trên khăn
  c.fillStyle = 'rgba(232,199,102,0.18)';
  for (let i = 0; i < 40; i++) {
    starShape(c, r() * W, TABLE_Y + 60 + r() * (H - TABLE_Y - 60), 4 + r() * 6, 4, 0.4);
    c.fill();
  }
  // tua rua mép khăn
  c.fillStyle = '#d8b25a';
  for (let x2 = 10; x2 < W; x2 += 26) {
    const y2 = TABLE_Y + 30 - 60 * Math.sin((x2 / W) * Math.PI) * 0.5 + 6;
    c.beginPath();
    c.moveTo(x2 - 6, y2);
    c.lineTo(x2 + 6, y2);
    c.lineTo(x2, y2 + 16);
    c.closePath();
    c.fill();
  }
}

function drawShelf(c, x, y, w, r, right = false) {
  c.fillStyle = '#3b2216';
  c.fillRect(x - 10, y, w + 20, 14);
  c.fillStyle = '#5a3624';
  c.fillRect(x - 10, y, w + 20, 4);
  let px = x;
  while (px < x + w - 20) {
    const kind = Math.floor(r() * 4);
    if (kind === 0) {
      // sách
      const n = 2 + Math.floor(r() * 3);
      for (let i = 0; i < n && px < x + w - 16; i++) {
        const bw = 14 + r() * 8;
        const bh = 60 + r() * 30;
        c.fillStyle = ['#7b2d3a', '#2d4a7b', '#3a6b3e', '#7a5a2a', '#5a2d7b'][Math.floor(r() * 5)];
        c.fillRect(px, y - bh, bw, bh);
        c.fillStyle = 'rgba(232,199,102,0.7)';
        c.fillRect(px + 2, y - bh + 10, bw - 4, 3);
        c.fillRect(px + 2, y - 16, bw - 4, 3);
        px += bw + 1;
      }
      px += 8;
    } else if (kind === 1) {
      // lọ thuỷ tinh
      const jw = 34 + r() * 14;
      const jh = 46 + r() * 30;
      const col = ['#4fc3f7', '#ba68c8', '#81c784', '#ffb74d', '#f06292'][Math.floor(r() * 5)];
      c.fillStyle = 'rgba(200,220,255,0.18)';
      roundRectPath(c, px, y - jh, jw, jh, 10);
      c.fill();
      c.fillStyle = col;
      c.globalAlpha = 0.55;
      roundRectPath(c, px + 3, y - jh * 0.6, jw - 6, jh * 0.6 - 3, 8);
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = '#6d4c41';
      c.fillRect(px + jw * 0.25, y - jh - 10, jw * 0.5, 12);
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(px + 6, y - jh + 8, 4, jh - 18);
      px += jw + 12;
    } else if (kind === 2) {
      // nến nhỏ (vẽ thân, lửa vẽ động riêng)
      const ch = 30 + r() * 30;
      c.fillStyle = '#f3e5c8';
      c.fillRect(px + 4, y - ch, 16, ch);
      c.fillStyle = 'rgba(255,190,90,0.5)';
      c.beginPath();
      c.ellipse(px + 12, y - ch - 10, 6, 11, 0, 0, TAU);
      c.fill();
      c.fillStyle = '#ffe082';
      c.beginPath();
      c.ellipse(px + 12, y - ch - 8, 3, 7, 0, 0, TAU);
      c.fill();
      px += 34;
    } else {
      // quả cầu nhỏ / pha lê
      c.fillStyle = 'rgba(180,140,255,0.6)';
      c.beginPath();
      c.moveTo(px + 18, y - 54);
      c.lineTo(px + 34, y - 20);
      c.lineTo(px + 18, y);
      c.lineTo(px + 2, y - 20);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.beginPath();
      c.moveTo(px + 18, y - 54);
      c.lineTo(px + 24, y - 20);
      c.lineTo(px + 18, y);
      c.closePath();
      c.fill();
      px += 44;
    }
  }
}

// ------------------------------------------------------------------ nến trên bàn (lửa động)
export function drawCandle(c, x, y, h, t, glow = 1) {
  const fl = Math.sin(t * 0.011 + x) * 0.5 + Math.sin(t * 0.027 + x * 2) * 0.3;
  const rg = c.createRadialGradient(x, y - h - 14, 2, x, y - h - 14, 90 * glow);
  rg.addColorStop(0, 'rgba(255,200,100,0.35)');
  rg.addColorStop(1, 'rgba(255,200,100,0)');
  c.fillStyle = rg;
  c.fillRect(x - 100, y - h - 110, 200, 200);
  c.fillStyle = '#efe0c0';
  c.fillRect(x - 13, y - h, 26, h);
  c.fillStyle = '#d9c39a';
  c.fillRect(x + 5, y - h, 8, h);
  c.fillStyle = '#fff3d6';
  c.beginPath();
  c.ellipse(x - 4, y - h + 6, 4, 10, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#b8862e';
  c.beginPath();
  c.ellipse(x, y, 30, 8, 0, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(255,170,60,0.9)';
  c.beginPath();
  c.moveTo(x - 8, y - h - 4);
  c.quadraticCurveTo(x - 9 + fl * 3, y - h - 22, x + fl * 4, y - h - 34 - fl * 4);
  c.quadraticCurveTo(x + 9 + fl * 3, y - h - 20, x + 8, y - h - 4);
  c.closePath();
  c.fill();
  c.fillStyle = '#fff6c8';
  c.beginPath();
  c.ellipse(x + fl, y - h - 12, 3.5, 8, 0, 0, TAU);
  c.fill();
}

// ------------------------------------------------------------------ quả cầu pha lê
export function drawBall(c, t, power = 0) {
  const { x, y, r } = BALL;
  const p = 0.5 + 0.5 * Math.sin(t * 0.002);
  const glowR = r * (2.2 + power * 1.2 + p * 0.3);
  const rg = c.createRadialGradient(x, y, r * 0.3, x, y, glowR);
  rg.addColorStop(0, `rgba(230,150,255,${0.35 + power * 0.3})`);
  rg.addColorStop(1, 'rgba(230,150,255,0)');
  c.fillStyle = rg;
  c.beginPath();
  c.arc(x, y, glowR, 0, TAU);
  c.fill();
  // đế
  c.fillStyle = '#6b4a1e';
  c.beginPath();
  c.moveTo(x - 46, y + r + 16);
  c.lineTo(x - 30, y + r - 8);
  c.lineTo(x + 30, y + r - 8);
  c.lineTo(x + 46, y + r + 16);
  c.closePath();
  c.fill();
  c.fillStyle = '#d8b25a';
  c.fillRect(x - 46, y + r + 10, 92, 8);
  // cầu
  const bg = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  bg.addColorStop(0, '#fff2ff');
  bg.addColorStop(0.35, '#e7a6ff');
  bg.addColorStop(0.75, '#9a4fd6');
  bg.addColorStop(1, '#5a2290');
  c.fillStyle = bg;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
  // sương xoáy bên trong
  c.save();
  c.beginPath();
  c.arc(x, y, r - 3, 0, TAU);
  c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const a = t * 0.0015 * (1 + power * 2) + i * 2.1;
    c.beginPath();
    c.ellipse(x + Math.cos(a) * 8, y + Math.sin(a) * 6, r * 0.6, r * 0.25, a, 0, Math.PI * 1.3);
    c.stroke();
  }
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.75)';
  c.beginPath();
  c.ellipse(x - r * 0.38, y - r * 0.42, r * 0.18, r * 0.1, -0.6, 0, TAU);
  c.fill();
}

// ------------------------------------------------------------------ cô Nguyệt
// pose: { t, speaking, eyesOpen, handMode: 'rest'|'ball'|'shuffle'|'point', pointX, blink }
export function drawReader(c, pose) {
  const { x, y } = READER;
  const t = pose.t;
  const breathe = Math.sin(t * 0.002) * 3;
  c.save();
  c.translate(0, breathe * 0.5);

  // tóc dài phía sau
  c.fillStyle = '#1a1022';
  c.beginPath();
  c.moveTo(x - 70, y - 20);
  c.bezierCurveTo(x - 110, y + 80, x - 120, y + 160, x - 95, y + 220);
  c.lineTo(x + 95, y + 220);
  c.bezierCurveTo(x + 120, y + 160, x + 110, y + 80, x + 70, y - 20);
  c.closePath();
  c.fill();

  // áo choàng (vai + thân)
  let g = c.createLinearGradient(x, y + 60, x, y + 240);
  g.addColorStop(0, '#5b2a9a');
  g.addColorStop(1, '#2e1260');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - 40, y + 70);
  c.bezierCurveTo(x - 120, y + 80, x - 170, y + 120, x - 185, y + 240);
  c.lineTo(x + 185, y + 240);
  c.bezierCurveTo(x + 170, y + 120, x + 120, y + 80, x + 40, y + 70);
  c.closePath();
  c.fill();
  // áo dài bên trong
  c.fillStyle = '#d6b4ff';
  c.beginPath();
  c.moveTo(x - 42, y + 72);
  c.lineTo(x + 42, y + 72);
  c.lineTo(x + 60, y + 240);
  c.lineTo(x - 60, y + 240);
  c.closePath();
  c.fill();
  c.strokeStyle = '#e8c766';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x - 20, y + 74);
  c.quadraticCurveTo(x, y + 96, x + 20, y + 74);
  c.stroke();
  c.fillStyle = '#e8c766';
  for (let i = 0; i < 4; i++) {
    starShape(c, x + (i % 2 ? 22 : -22), y + 120 + i * 28, 6, 4, 0.4);
    c.fill();
  }
  // viền vàng áo choàng + sao trên áo choàng
  c.strokeStyle = '#e8c766';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x - 42, y + 72);
  c.bezierCurveTo(x - 70, y + 140, x - 70, y + 200, x - 70, y + 240);
  c.moveTo(x + 42, y + 72);
  c.bezierCurveTo(x + 70, y + 140, x + 70, y + 200, x + 70, y + 240);
  c.stroke();
  c.fillStyle = 'rgba(232,199,102,0.8)';
  for (const [dx, dy, s] of [[-120, 150, 7], [-140, 200, 5], [-95, 190, 4], [120, 150, 7], [140, 205, 5], [100, 185, 4]]) {
    starShape(c, x + dx, y + dy, s, 5, 0.45);
    c.fill();
  }

  // cổ
  c.fillStyle = '#e9bf9f';
  c.fillRect(x - 18, y + 40, 36, 36);

  // mũ trùm (phía sau đầu)
  c.fillStyle = '#4a1f86';
  c.beginPath();
  c.moveTo(x - 88, y + 70);
  c.bezierCurveTo(x - 100, y - 40, x - 70, y - 110, x, y - 112);
  c.bezierCurveTo(x + 70, y - 110, x + 100, y - 40, x + 88, y + 70);
  c.bezierCurveTo(x + 60, y + 40, x - 60, y + 40, x - 88, y + 70);
  c.fill();

  // mặt
  c.fillStyle = '#f6d3b8';
  c.beginPath();
  c.ellipse(x, y, 58, 68, 0, 0, TAU);
  c.fill();
  // tóc mái
  c.fillStyle = '#1a1022';
  c.beginPath();
  c.moveTo(x - 62, y + 10);
  c.bezierCurveTo(x - 66, y - 60, x - 20, y - 80, x + 10, y - 74);
  c.bezierCurveTo(x + 50, y - 70, x + 70, y - 40, x + 62, y + 14);
  c.bezierCurveTo(x + 50, y - 20, x + 30, y - 38, x + 6, y - 40);
  c.bezierCurveTo(x - 20, y - 30, x - 46, y - 20, x - 62, y + 10);
  c.fill();
  // tóc hai bên má
  c.beginPath();
  c.moveTo(x - 60, y - 10);
  c.quadraticCurveTo(x - 72, y + 50, x - 54, y + 96);
  c.lineTo(x - 44, y + 40);
  c.closePath();
  c.moveTo(x + 60, y - 10);
  c.quadraticCurveTo(x + 72, y + 50, x + 54, y + 96);
  c.lineTo(x + 44, y + 40);
  c.closePath();
  c.fill();
  // mũ trùm viền trước
  c.strokeStyle = '#e8c766';
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(x - 86, y + 66);
  c.bezierCurveTo(x - 98, y - 38, x - 68, y - 106, x, y - 108);
  c.bezierCurveTo(x + 68, y - 106, x + 98, y - 38, x + 86, y + 66);
  c.stroke();
  // vương miện trăng khuyết
  c.fillStyle = '#ffe08a';
  crescent(c, x, y - 92, 20, 1, 0.55);
  c.fill();
  c.fillStyle = '#9be7ff';
  c.beginPath();
  c.arc(x - 6, y - 92, 5, 0, TAU);
  c.fill();
  // dây chuyền trán
  c.strokeStyle = '#ffe08a';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - 50, y - 44);
  c.quadraticCurveTo(x, y - 28, x + 50, y - 44);
  c.stroke();
  c.fillStyle = '#ffe08a';
  c.beginPath();
  c.moveTo(x, y - 36);
  c.lineTo(x + 5, y - 28);
  c.lineTo(x, y - 20);
  c.lineTo(x - 5, y - 28);
  c.closePath();
  c.fill();

  // mắt
  const eyeY = y + 6;
  const blink = pose.blink || !pose.eyesOpen;
  for (const s of [-1, 1]) {
    const ex = x + s * 24;
    if (blink) {
      c.strokeStyle = '#2a1830';
      c.lineWidth = 3.5;
      c.beginPath();
      c.arc(ex, eyeY - 2, 11, 0.15 * Math.PI, 0.85 * Math.PI);
      c.stroke();
      // lông mi
      c.beginPath();
      c.moveTo(ex + s * 10, eyeY + 2);
      c.lineTo(ex + s * 16, eyeY - 2);
      c.stroke();
    } else {
      c.fillStyle = '#fff';
      c.beginPath();
      c.ellipse(ex, eyeY, 12, 9, 0, 0, TAU);
      c.fill();
      c.fillStyle = '#5a2d8a';
      c.beginPath();
      c.arc(ex + (pose.look || 0) * 3, eyeY + 1, 7, 0, TAU);
      c.fill();
      c.fillStyle = '#140a1e';
      c.beginPath();
      c.arc(ex + (pose.look || 0) * 3, eyeY + 1, 3.5, 0, TAU);
      c.fill();
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(ex + 2 + (pose.look || 0) * 3, eyeY - 2, 2.2, 0, TAU);
      c.fill();
      c.strokeStyle = '#2a1830';
      c.lineWidth = 3.5;
      c.beginPath();
      c.ellipse(ex, eyeY, 12, 9, 0, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
      c.beginPath();
      c.moveTo(ex + s * 11, eyeY - 3);
      c.lineTo(ex + s * 17, eyeY - 7);
      c.stroke();
    }
    // lông mày
    c.strokeStyle = '#2a1830';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(ex - 12, eyeY - 20 + (s > 0 ? 0 : 0));
    c.quadraticCurveTo(ex, eyeY - 26, ex + 12, eyeY - 21);
    c.stroke();
  }
  // má hồng
  c.fillStyle = 'rgba(255,120,140,0.28)';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.ellipse(x + s * 34, y + 30, 13, 8, 0, 0, TAU);
    c.fill();
  }
  // mũi
  c.strokeStyle = 'rgba(160,90,70,0.6)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - 1, y + 18);
  c.quadraticCurveTo(x + 4, y + 28, x - 3, y + 30);
  c.stroke();
  // miệng
  const open = pose.speaking ? Math.abs(Math.sin(t * 0.025)) * 0.8 + 0.2 : 0;
  c.fillStyle = '#c2455c';
  c.beginPath();
  if (open > 0.05) {
    c.ellipse(x, y + 46, 11, 3 + open * 7, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#7a1e30';
    c.beginPath();
    c.ellipse(x, y + 47, 7, 1 + open * 4, 0, 0, TAU);
    c.fill();
  } else {
    c.moveTo(x - 13, y + 43);
    c.quadraticCurveTo(x, y + 54, x + 13, y + 43);
    c.quadraticCurveTo(x, y + 48, x - 13, y + 43);
    c.fill();
  }
  // khuyên tai
  c.fillStyle = '#ffe08a';
  for (const s of [-1, 1]) {
    starShape(c, x + s * 56, y + 34, 6, 4, 0.4);
    c.fill();
  }
  c.restore();

  drawHands(c, pose);
}

function hand(c, hx, hy, rot = 0, flip = 1) {
  c.save();
  c.translate(hx, hy);
  c.rotate(rot);
  c.scale(flip, 1);
  c.fillStyle = '#f6d3b8';
  c.beginPath();
  c.ellipse(0, 0, 20, 15, 0, 0, TAU);
  c.fill();
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.ellipse(16, -10 + i * 7, 11, 4, 0.15, 0, TAU);
    c.fill();
  }
  c.beginPath();
  c.ellipse(-2, -14, 9, 4.5, -0.9, 0, TAU);
  c.fill();
  c.fillStyle = '#ffe08a';
  c.fillRect(-12, -10, 5, 20);
  c.restore();
}

// tay áo + bàn tay theo tư thế
export function handTargets(pose) {
  const t = pose.t;
  const { x, y, r } = BALL;
  if (pose.handMode === 'shuffle') {
    const s = Math.sin(t * 0.02);
    return [[x - 70 + s * 20, y + 40 - Math.abs(s) * 30], [x + 70 + s * 20, y + 40 - Math.abs(Math.cos(t * 0.02)) * 30]];
  }
  if (pose.handMode === 'point') {
    const px = pose.pointX ?? x;
    const L = [x - 110, y + 20];
    const R = [x + 110, y + 20];
    if (px < x - 50) return [[px + 40, CARD.y - 6 + Math.sin(t * 0.004) * 4], R];
    if (px > x + 50) return [L, [px - 40, CARD.y - 6 + Math.sin(t * 0.004) * 4]];
    return [[x - 40, CARD.y - 10], [x + 40, CARD.y - 10]];
  }
  if (pose.handMode === 'ball') {
    const wv = Math.sin(t * 0.004) * 6;
    return [[x - r - 14, y - 6 + wv], [x + r + 14, y - 6 - wv]];
  }
  return [[x - 110, y + 24], [x + 110, y + 24]];
}

function drawHands(c, pose) {
  const { x, y } = READER;
  const [L, R] = handTargets(pose);
  for (const [i, [hx, hy]] of [L, R].entries()) {
    const s = i ? 1 : -1;
    const sx = x + s * 120;
    const sy = y + 110;
    // tay áo choàng
    c.strokeStyle = '#4a1f86';
    c.lineCap = 'round';
    c.lineWidth = 46;
    c.beginPath();
    c.moveTo(sx, sy);
    c.quadraticCurveTo((sx + hx) / 2 + s * 30, (sy + hy) / 2 + 20, hx - s * 14, hy);
    c.stroke();
    c.strokeStyle = '#e8c766';
    c.lineWidth = 6;
    c.beginPath();
    const ex = hx - s * 22;
    c.moveTo(ex, hy - 20);
    c.lineTo(ex, hy + 20);
    c.stroke();
    c.lineCap = 'butt';
    hand(c, hx, hy, 0, s);
  }
}

// ------------------------------------------------------------------ mèo đen
export function drawCat(c, x, y, t, happy = 0) {
  const tail = Math.sin(t * 0.003) * 0.5;
  c.save();
  c.translate(x, y);
  c.fillStyle = '#16121c';
  // đuôi
  c.strokeStyle = '#16121c';
  c.lineWidth = 12;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(36, -10);
  c.bezierCurveTo(80, -10, 70 + tail * 30, -70, 50 + tail * 40, -90);
  c.stroke();
  c.lineCap = 'butt';
  // thân
  c.beginPath();
  c.ellipse(10, -30, 46, 36, 0, 0, TAU);
  c.fill();
  // đầu
  c.beginPath();
  c.arc(-26, -70, 30, 0, TAU);
  c.fill();
  c.beginPath();
  c.moveTo(-52, -84);
  c.lineTo(-50, -116);
  c.lineTo(-32, -96);
  c.closePath();
  c.moveTo(-20, -98);
  c.lineTo(-4, -116);
  c.lineTo(-2, -82);
  c.closePath();
  c.fill();
  c.fillStyle = '#ff9fb8';
  c.beginPath();
  c.moveTo(-48, -90);
  c.lineTo(-47, -108);
  c.lineTo(-37, -96);
  c.closePath();
  c.fill();
  // mắt vàng
  const blink = Math.sin(t * 0.0013) > 0.985 || happy > 0;
  c.fillStyle = '#ffd54f';
  for (const ex of [-38, -14]) {
    if (blink) {
      c.strokeStyle = '#ffd54f';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(ex, -70, 6, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    } else {
      c.beginPath();
      c.ellipse(ex, -70, 7, 8, 0, 0, TAU);
      c.fill();
      c.fillStyle = '#16121c';
      c.beginPath();
      c.ellipse(ex, -70, 2, 6, 0, 0, TAU);
      c.fill();
      c.fillStyle = '#ffd54f';
    }
  }
  // vòng cổ trăng
  c.fillStyle = '#ffe08a';
  crescent(c, -26, -40, 7, 1, 0.55);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------ lá bài
// ảnh lá bài tự thiết kế (public/assets/tarot/mat-sau.png, la-00.png ... la-21.png), nếu có
let backImg = null;
let faceImgs = [];
export function setCardImages(back, faces) {
  backImg = back || null;
  faceImgs = faces || [];
}

export function drawCardBack(c, x, y, w, h, t = 0, glow = 0) {
  c.save();
  if (glow > 0) {
    c.fillStyle = `rgba(255,220,130,${0.25 * glow})`;
    roundRectPath(c, x - 10, y - 10, w + 20, h + 20, 22);
    c.fill();
  }
  if (backImg) {
    roundRectPath(c, x, y, w, h, 14);
    c.clip();
    c.drawImage(backImg, x, y, w, h);
    c.restore();
    return;
  }
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#1d1a5a');
  g.addColorStop(1, '#3a1a6a');
  c.fillStyle = g;
  roundRectPath(c, x, y, w, h, 16);
  c.fill();
  c.strokeStyle = '#e8c766';
  c.lineWidth = Math.max(2, w * 0.02);
  roundRectPath(c, x + w * 0.05, y + w * 0.05, w * 0.9, h - w * 0.1, 10);
  c.stroke();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const s = w / 230;
  // vòng mặt trời / mặt trăng
  c.fillStyle = '#e8c766';
  c.strokeStyle = '#e8c766';
  c.lineWidth = 2 * s;
  c.beginPath();
  c.arc(cx, cy, 52 * s, 0, TAU);
  c.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 58 * s, cy + Math.sin(a) * 58 * s);
    c.lineTo(cx + Math.cos(a) * (i % 2 ? 70 : 82) * s, cy + Math.sin(a) * (i % 2 ? 70 : 82) * s);
    c.stroke();
  }
  crescent(c, cx, cy, 34 * s, 1, 0.6);
  c.fill();
  starShape(c, cx + 18 * s, cy - 4 * s, 9 * s, 5, 0.45);
  c.fill();
  // sao góc
  for (const [dx, dy] of [[-0.3, -0.36], [0.3, -0.36], [-0.3, 0.36], [0.3, 0.36]]) {
    starShape(c, cx + dx * w, cy + dy * h, 10 * s, 4, 0.35);
    c.fill();
  }
  c.restore();
}

// card: phần tử của CARDS; reversed: lá ngược
export function drawCardFace(c, card, x, y, w, h, { reversed = false, glow = 0 } = {}) {
  c.save();
  if (glow > 0) {
    const gg = c.createRadialGradient(x + w / 2, y + h / 2, w * 0.3, x + w / 2, y + h / 2, w * 1.1);
    gg.addColorStop(0, `rgba(255,230,150,${0.45 * glow})`);
    gg.addColorStop(1, 'rgba(255,230,150,0)');
    c.fillStyle = gg;
    c.fillRect(x - w * 0.6, y - h * 0.4, w * 2.2, h * 1.8);
  }
  c.translate(x + w / 2, y + h / 2);
  if (reversed) c.rotate(Math.PI);
  const x0 = -w / 2;
  const y0 = -h / 2;
  const s = w / 230;
  const img = faceImgs[CARDS_INDEX.get(card)];
  if (img) {
    c.save();
    roundRectPath(c, x0, y0, w, h, 14 * s);
    c.clip();
    c.drawImage(img, x0, y0, w, h);
    // dải tên ở chân lá
    const g2 = c.createLinearGradient(0, y0 + h - 76 * s, 0, y0 + h);
    g2.addColorStop(0, 'rgba(20,8,30,0)');
    g2.addColorStop(0.35, 'rgba(20,8,30,0.85)');
    g2.addColorStop(1, 'rgba(20,8,30,0.95)');
    c.fillStyle = g2;
    c.fillRect(x0, y0 + h - 76 * s, w, 76 * s);
    c.restore();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#ffe9b0';
    c.font = `700 ${21 * s}px Georgia, "Times New Roman", serif`;
    c.fillText(card.en.toUpperCase(), 0, y0 + h - 42 * s, w - 20 * s);
    c.font = `600 ${17 * s}px "Segoe UI", system-ui, sans-serif`;
    c.fillStyle = '#fff';
    c.fillText(card.vi, 0, y0 + h - 18 * s, w - 20 * s);
    c.restore();
    return;
  }
  // khung giấy
  c.fillStyle = '#f7ecd2';
  roundRectPath(c, x0, y0, w, h, 16 * s);
  c.fill();
  c.strokeStyle = '#b8862e';
  c.lineWidth = 5 * s;
  roundRectPath(c, x0 + 8 * s, y0 + 8 * s, w - 16 * s, h - 16 * s, 10 * s);
  c.stroke();
  // ô tranh
  const ix = x0 + 18 * s;
  const iy = y0 + 46 * s;
  const iw = w - 36 * s;
  const ih = h - 112 * s;
  const g = c.createLinearGradient(0, iy, 0, iy + ih);
  g.addColorStop(0, `hsl(${card.hue},55%,72%)`);
  g.addColorStop(1, `hsl(${(card.hue + 30) % 360},45%,42%)`);
  c.fillStyle = g;
  c.fillRect(ix, iy, iw, ih);
  c.save();
  c.beginPath();
  c.rect(ix, iy, iw, ih);
  c.clip();
  drawIcon(c, card.icon, 0, iy + ih / 2, iw, ih, card.hue);
  c.restore();
  c.strokeStyle = '#7a5a20';
  c.lineWidth = 2 * s;
  c.strokeRect(ix, iy, iw, ih);
  // số La Mã
  c.fillStyle = '#5a3a10';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `700 ${24 * s}px Georgia, "Times New Roman", serif`;
  c.fillText(card.n, 0, y0 + 28 * s);
  // tên
  c.font = `700 ${22 * s}px Georgia, "Times New Roman", serif`;
  c.fillText(card.en.toUpperCase(), 0, y0 + h - 44 * s, w - 26 * s);
  c.font = `600 ${18 * s}px "Segoe UI", system-ui, sans-serif`;
  c.fillStyle = '#7a4a10';
  c.fillText(card.vi, 0, y0 + h - 22 * s, w - 26 * s);
  c.restore();
}

// ------------------------------------------------------------------ 22 biểu tượng
// (cx, cy) là tâm ô tranh, (w, h) kích thước ô
function drawIcon(c, icon, cx, cy, w, h, hue) {
  const s = w / 194;
  const gold = '#ffe08a';
  const ink = '#2a1830';
  const light = 'rgba(255,255,255,0.85)';
  c.save();
  c.translate(cx, cy);
  c.scale(s, s);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const sun = (x, y, r, rays = 12) => {
    c.fillStyle = gold;
    c.strokeStyle = gold;
    c.lineWidth = 4;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * TAU;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2);
      c.lineTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6);
      c.stroke();
    }
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  };
  const hill = (y, col = 'rgba(40,20,50,0.35)') => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-120, 140);
    c.lineTo(-120, y);
    c.quadraticCurveTo(-40, y - 40, 20, y);
    c.quadraticCurveTo(70, y + 25, 120, y - 10);
    c.lineTo(120, 140);
    c.closePath();
    c.fill();
  };
  const person = (x, y, sc = 1, col = '#5b2a9a') => {
    c.save();
    c.translate(x, y);
    c.scale(sc, sc);
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-22, 60);
    c.lineTo(-14, 0);
    c.quadraticCurveTo(0, -10, 14, 0);
    c.lineTo(22, 60);
    c.closePath();
    c.fill();
    c.fillStyle = '#f6d3b8';
    c.beginPath();
    c.arc(0, -16, 14, 0, TAU);
    c.fill();
    c.restore();
  };
  switch (icon) {
    case 'fool': {
      sun(50, -70, 18);
      hill(70);
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(-120, 140);
      c.lineTo(-120, 60);
      c.lineTo(-30, 70);
      c.lineTo(-10, 140);
      c.fill();
      person(-40, 0, 1, '#e65100');
      c.strokeStyle = '#6d4c41';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(-30, -10);
      c.lineTo(10, -50);
      c.stroke();
      c.fillStyle = '#8d6e63';
      c.beginPath();
      c.arc(14, -54, 12, 0, TAU);
      c.fill();
      c.fillStyle = '#fff';
      for (const [fx, fy] of [[-60, 10], [-52, 4]]) {
        c.beginPath();
        c.arc(fx, fy, 6, 0, TAU);
        c.fill();
      }
      break;
    }
    case 'magician': {
      c.strokeStyle = gold;
      c.lineWidth = 7;
      c.beginPath();
      for (let i = 0; i <= 60; i++) {
        const a = (i / 60) * TAU;
        const d = 1 + Math.sin(a) ** 2;
        c.lineTo((36 * Math.cos(a)) / d, -80 + (36 * Math.sin(a) * Math.cos(a)) / d);
      }
      c.stroke();
      c.strokeStyle = '#fff';
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(-30, 70);
      c.lineTo(30, -20);
      c.stroke();
      c.fillStyle = gold;
      starShape(c, 34, -26, 20, 5, 0.45);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      for (const [sx, sy] of [[-50, 0], [60, 30], [-30, -40], [40, -60]]) {
        starShape(c, sx, sy, 8, 4, 0.35);
        c.fill();
      }
      break;
    }
    case 'priestess': {
      c.fillStyle = '#1b1b3a';
      c.fillRect(-80, -70, 30, 200);
      c.fillStyle = '#f0f0f0';
      c.fillRect(50, -70, 30, 200);
      c.fillStyle = ink;
      c.font = '700 22px Georgia';
      c.textAlign = 'center';
      c.fillText('B', -65, -40);
      c.fillStyle = '#333';
      c.fillText('J', 65, -40);
      c.fillStyle = '#fff8dc';
      crescent(c, 0, -10, 46, 1, 0.62);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      starShape(c, 6, 60, 10, 4, 0.35);
      c.fill();
      break;
    }
    case 'empress': {
      c.fillStyle = gold;
      c.beginPath();
      c.moveTo(-50, -30);
      c.lineTo(-50, -80);
      c.lineTo(-25, -55);
      c.lineTo(0, -95);
      c.lineTo(25, -55);
      c.lineTo(50, -80);
      c.lineTo(50, -30);
      c.closePath();
      c.fill();
      c.fillStyle = '#e53935';
      c.beginPath();
      c.arc(0, -50, 7, 0, TAU);
      c.fill();
      // bó lúa
      c.strokeStyle = '#ffcc80';
      c.lineWidth = 4;
      for (let i = -3; i <= 3; i++) {
        c.beginPath();
        c.moveTo(i * 4, 110);
        c.quadraticCurveTo(i * 10, 40, i * 22, 0);
        c.stroke();
        c.fillStyle = '#ffd54f';
        for (let k = 0; k < 4; k++) {
          c.beginPath();
          c.ellipse(i * 22 - i * 2 * k, k * 12, 5, 9, i * 0.15, 0, TAU);
          c.fill();
        }
      }
      break;
    }
    case 'emperor': {
      c.fillStyle = '#6d4c41';
      c.fillRect(-60, -30, 120, 140);
      for (let i = 0; i < 5; i++) c.fillRect(-60 + i * 26, -50, 16, 22);
      c.fillStyle = '#3e2723';
      c.beginPath();
      c.moveTo(-18, 110);
      c.lineTo(-18, 50);
      c.arc(0, 50, 18, Math.PI, 0);
      c.lineTo(18, 110);
      c.fill();
      c.fillStyle = gold;
      c.beginPath();
      c.moveTo(-30, -60);
      c.lineTo(-30, -90);
      c.lineTo(-15, -75);
      c.lineTo(0, -100);
      c.lineTo(15, -75);
      c.lineTo(30, -90);
      c.lineTo(30, -60);
      c.closePath();
      c.fill();
      break;
    }
    case 'hierophant': {
      for (const sg of [-1, 1]) {
        c.save();
        c.rotate(sg * 0.6);
        c.fillStyle = sg < 0 ? gold : '#e0e0e0';
        c.strokeStyle = c.fillStyle;
        c.lineWidth = 10;
        c.beginPath();
        c.moveTo(0, -60);
        c.lineTo(0, 70);
        c.stroke();
        c.lineWidth = 8;
        c.beginPath();
        c.arc(0, -78, 20, 0, TAU);
        c.stroke();
        c.fillRect(0, 44, 22, 8);
        c.fillRect(0, 60, 16, 8);
        c.restore();
      }
      break;
    }
    case 'lovers': {
      sun(0, -80, 16);
      const heart = (x, y, r, col) => {
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(x, y + r * 0.9);
        c.bezierCurveTo(x - r * 1.4, y, x - r * 0.9, y - r * 1.1, x, y - r * 0.4);
        c.bezierCurveTo(x + r * 0.9, y - r * 1.1, x + r * 1.4, y, x, y + r * 0.9);
        c.fill();
      };
      heart(-26, 20, 44, '#e91e63');
      heart(28, 30, 40, '#f48fb1');
      c.fillStyle = light;
      c.beginPath();
      c.ellipse(-42, 0, 8, 5, -0.6, 0, TAU);
      c.fill();
      break;
    }
    case 'chariot': {
      c.fillStyle = '#455a64';
      roundRectPath(c, -60, -30, 120, 70, 10);
      c.fill();
      c.fillStyle = gold;
      starShape(c, 0, -6, 18, 5, 0.45);
      c.fill();
      c.fillStyle = '#263238';
      for (const wx of [-50, 50]) {
        c.beginPath();
        c.arc(wx, 60, 28, 0, TAU);
        c.fill();
        c.strokeStyle = gold;
        c.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          c.beginPath();
          c.moveTo(wx, 60);
          c.lineTo(wx + Math.cos(a) * 24, 60 + Math.sin(a) * 24);
          c.stroke();
        }
      }
      c.fillStyle = '#1a237e';
      c.beginPath();
      c.moveTo(-70, -30);
      c.quadraticCurveTo(0, -100, 70, -30);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 5; i++) {
        starShape(c, -40 + i * 20, -52 + Math.abs(i - 2) * 6, 5, 5, 0.45);
        c.fill();
      }
      break;
    }
    case 'strength': {
      c.strokeStyle = gold;
      c.lineWidth = 6;
      c.beginPath();
      for (let i = 0; i <= 60; i++) {
        const a = (i / 60) * TAU;
        const d = 1 + Math.sin(a) ** 2;
        c.lineTo((30 * Math.cos(a)) / d, -92 + (30 * Math.sin(a) * Math.cos(a)) / d);
      }
      c.stroke();
      // sư tử
      c.fillStyle = '#e65100';
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        c.beginPath();
        c.arc(Math.cos(a) * 44, 20 + Math.sin(a) * 44, 20, 0, TAU);
        c.fill();
      }
      c.fillStyle = '#ffb74d';
      c.beginPath();
      c.arc(0, 20, 40, 0, TAU);
      c.fill();
      c.fillStyle = ink;
      for (const ex of [-14, 14]) {
        c.beginPath();
        c.arc(ex, 10, 4, 0, TAU);
        c.fill();
      }
      c.beginPath();
      c.moveTo(-8, 26);
      c.lineTo(8, 26);
      c.lineTo(0, 34);
      c.closePath();
      c.fill();
      c.strokeStyle = ink;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(-6, 38, 6, 0, Math.PI);
      c.arc(6, 38, 6, 0, Math.PI);
      c.stroke();
      // vòng hoa
      c.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.arc(-30 + i * 15, -18 - Math.sin((i / 4) * Math.PI) * 6, 5, 0, TAU);
        c.fill();
      }
      break;
    }
    case 'hermit': {
      c.strokeStyle = '#8d6e63';
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(-40, 120);
      c.lineTo(-40, -60);
      c.stroke();
      c.fillStyle = '#4e342e';
      c.fillRect(-4, -78, 48, 8);
      const lg = c.createRadialGradient(20, -20, 4, 20, -20, 70);
      lg.addColorStop(0, 'rgba(255,240,180,0.9)');
      lg.addColorStop(1, 'rgba(255,240,180,0)');
      c.fillStyle = lg;
      c.beginPath();
      c.arc(20, -20, 70, 0, TAU);
      c.fill();
      c.strokeStyle = '#4e342e';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(20, -70);
      c.lineTo(20, -56);
      c.stroke();
      c.fillStyle = '#5d4037';
      c.beginPath();
      c.moveTo(0, -56);
      c.lineTo(40, -56);
      c.lineTo(34, 10);
      c.lineTo(6, 10);
      c.closePath();
      c.fill();
      c.fillStyle = '#fff8c4';
      c.fillRect(8, -48, 24, 50);
      c.fillStyle = gold;
      starShape(c, 20, -24, 11, 6, 0.45);
      c.fill();
      break;
    }
    case 'wheel': {
      c.save();
      c.translate(0, 0);
      c.strokeStyle = gold;
      c.lineWidth = 8;
      c.beginPath();
      c.arc(0, 0, 70, 0, TAU);
      c.stroke();
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 0, 50, 0, TAU);
      c.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        c.beginPath();
        c.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
        c.lineTo(Math.cos(a) * 70, Math.sin(a) * 70);
        c.stroke();
      }
      c.fillStyle = gold;
      c.beginPath();
      c.arc(0, 0, 14, 0, TAU);
      c.fill();
      c.fillStyle = ink;
      c.font = '700 16px Georgia';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      ['T', 'A', 'R', 'O'].forEach((ch, i) => {
        const a = (i / 4) * TAU - Math.PI / 2 + Math.PI / 8;
        c.fillText(ch, Math.cos(a) * 60, Math.sin(a) * 60);
      });
      c.restore();
      for (const [sx, sy] of [[-75, -95], [75, -95], [-75, 95], [75, 95]]) {
        c.fillStyle = light;
        starShape(c, sx, sy, 10, 4, 0.35);
        c.fill();
      }
      break;
    }
    case 'justice': {
      c.strokeStyle = gold;
      c.fillStyle = gold;
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(0, -90);
      c.lineTo(0, 100);
      c.moveTo(-70, -50);
      c.lineTo(70, -50);
      c.moveTo(-40, 100);
      c.lineTo(40, 100);
      c.stroke();
      c.lineWidth = 2.5;
      for (const sx of [-60, 60]) {
        c.beginPath();
        c.moveTo(sx, -50);
        c.lineTo(sx - 26, 20);
        c.moveTo(sx, -50);
        c.lineTo(sx + 26, 20);
        c.stroke();
        c.beginPath();
        c.moveTo(sx - 32, 20);
        c.quadraticCurveTo(sx, 50, sx + 32, 20);
        c.closePath();
        c.fill();
      }
      c.beginPath();
      c.arc(0, -96, 10, 0, TAU);
      c.fill();
      break;
    }
    case 'hanged': {
      c.fillStyle = '#5d4037';
      c.fillRect(-80, -100, 160, 14);
      c.strokeStyle = '#bcaaa4';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, -86);
      c.lineTo(0, -54);
      c.stroke();
      c.save();
      c.translate(0, 0);
      c.rotate(Math.PI);
      person(0, -10, 1.1, '#1565c0');
      c.restore();
      const hg = c.createRadialGradient(0, 40, 4, 0, 40, 40);
      hg.addColorStop(0, 'rgba(255,240,150,0.9)');
      hg.addColorStop(1, 'rgba(255,240,150,0)');
      c.fillStyle = hg;
      c.beginPath();
      c.arc(0, 40, 40, 0, TAU);
      c.fill();
      c.fillStyle = '#f6d3b8';
      c.beginPath();
      c.arc(0, 28, 15, 0, TAU);
      c.fill();
      break;
    }
    case 'death': {
      // mặt trời lặn + bướm (biểu tượng của chuyển hoá)
      c.fillStyle = 'rgba(255,200,120,0.9)';
      c.beginPath();
      c.arc(0, 70, 50, Math.PI, 0);
      c.fill();
      c.fillStyle = 'rgba(40,20,60,0.5)';
      c.fillRect(-120, 70, 240, 80);
      const wing = (sg) => {
        c.fillStyle = '#ce93d8';
        c.beginPath();
        c.moveTo(0, -30);
        c.bezierCurveTo(sg * 70, -100, sg * 90, -20, sg * 6, -16);
        c.fill();
        c.fillStyle = '#ab47bc';
        c.beginPath();
        c.moveTo(0, -14);
        c.bezierCurveTo(sg * 60, -10, sg * 50, 40, sg * 4, 0);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.beginPath();
        c.arc(sg * 44, -52, 7, 0, TAU);
        c.fill();
      };
      wing(-1);
      wing(1);
      c.strokeStyle = ink;
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(0, -46);
      c.lineTo(0, 8);
      c.stroke();
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, -46);
      c.quadraticCurveTo(-10, -64, -16, -70);
      c.moveTo(0, -46);
      c.quadraticCurveTo(10, -64, 16, -70);
      c.stroke();
      break;
    }
    case 'temperance': {
      const cup = (x, y, rot) => {
        c.save();
        c.translate(x, y);
        c.rotate(rot);
        c.fillStyle = gold;
        c.beginPath();
        c.moveTo(-24, -30);
        c.lineTo(24, -30);
        c.lineTo(16, 16);
        c.lineTo(-16, 16);
        c.closePath();
        c.fill();
        c.fillRect(-4, 16, 8, 18);
        c.fillRect(-14, 32, 28, 6);
        c.restore();
      };
      cup(-50, -40, 0.5);
      cup(50, 40, -0.2);
      c.strokeStyle = '#4fc3f7';
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(-36, -64);
      c.bezierCurveTo(10, -90, 60, -30, 50, 8);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.lineWidth = 3;
      c.stroke();
      break;
    }
    case 'devil': {
      c.strokeStyle = '#9e9e9e';
      c.lineWidth = 7;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.ellipse(-60 + i * 40, 60 + (i % 2) * 6, 22, 13, 0, 0, TAU);
        c.stroke();
      }
      c.fillStyle = '#b71c1c';
      c.beginPath();
      c.moveTo(-50, -40);
      c.quadraticCurveTo(-60, -90, -30, -110);
      c.quadraticCurveTo(-40, -70, -20, -50);
      c.closePath();
      c.moveTo(50, -40);
      c.quadraticCurveTo(60, -90, 30, -110);
      c.quadraticCurveTo(40, -70, 20, -50);
      c.closePath();
      c.fill();
      c.fillStyle = '#4a148c';
      c.beginPath();
      c.arc(0, -30, 40, 0, TAU);
      c.fill();
      c.fillStyle = gold;
      for (const ex of [-14, 14]) {
        c.beginPath();
        c.ellipse(ex, -34, 7, 4, ex < 0 ? 0.3 : -0.3, 0, TAU);
        c.fill();
      }
      starShape(c, 0, -94, 14, 5, 0.45, Math.PI / 2);
      c.fill();
      break;
    }
    case 'tower': {
      c.fillStyle = '#8d6e63';
      c.beginPath();
      c.moveTo(-34, 120);
      c.lineTo(-26, -50);
      c.lineTo(26, -50);
      c.lineTo(34, 120);
      c.closePath();
      c.fill();
      c.fillStyle = '#ffeb3b';
      c.fillRect(-10, 0, 20, 26);
      c.fillRect(-8, 60, 16, 22);
      c.fillStyle = gold;
      c.save();
      c.translate(26, -70);
      c.rotate(0.5);
      c.beginPath();
      c.moveTo(-34, -10);
      c.lineTo(-26, -40);
      c.lineTo(-13, -22);
      c.lineTo(0, -46);
      c.lineTo(13, -22);
      c.lineTo(26, -40);
      c.lineTo(34, -10);
      c.closePath();
      c.fill();
      c.restore();
      c.fillStyle = '#fff59d';
      c.beginPath();
      c.moveTo(70, -120);
      c.lineTo(20, -60);
      c.lineTo(42, -60);
      c.lineTo(0, -10);
      c.lineTo(56, -76);
      c.lineTo(34, -76);
      c.lineTo(80, -120);
      c.closePath();
      c.fill();
      c.fillStyle = '#ff7043';
      for (const [fx, fy] of [[-50, 20], [50, 40], [-40, -20]]) {
        c.beginPath();
        c.moveTo(fx, fy);
        c.quadraticCurveTo(fx - 10, fy - 20, fx, fy - 34);
        c.quadraticCurveTo(fx + 10, fy - 20, fx, fy);
        c.fill();
      }
      break;
    }
    case 'star': {
      c.fillStyle = gold;
      starShape(c, 0, -30, 56, 8, 0.42);
      c.fill();
      c.fillStyle = '#fff';
      starShape(c, 0, -30, 26, 8, 0.42);
      c.fill();
      c.fillStyle = light;
      for (const [sx, sy] of [[-70, -90], [70, -90], [-80, 0], [80, 0], [-50, 50], [50, 50], [0, 60]]) {
        starShape(c, sx, sy, 11, 8, 0.4);
        c.fill();
      }
      c.fillStyle = 'rgba(79,195,247,0.8)';
      c.beginPath();
      c.ellipse(0, 110, 110, 22, 0, 0, TAU);
      c.fill();
      break;
    }
    case 'moon': {
      c.fillStyle = 'rgba(30,30,70,0.4)';
      c.fillRect(-80, 20, 30, 120);
      c.fillRect(50, 20, 30, 120);
      c.fillStyle = '#fff8dc';
      c.beginPath();
      c.arc(0, -40, 50, 0, TAU);
      c.fill();
      c.fillStyle = `hsl(${hue},45%,60%)`;
      c.beginPath();
      c.arc(22, -50, 44, 0, TAU);
      c.fill();
      c.fillStyle = '#5a5a7a';
      c.beginPath();
      c.arc(-26, -48, 4, 0, TAU);
      c.fill();
      c.strokeStyle = '#5a5a7a';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(-24, -24, 8, 0.2, Math.PI - 0.6);
      c.stroke();
      c.fillStyle = '#90caf9';
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.ellipse(-40 + i * 16, 30 + (i % 2) * 10, 3, 6, 0, 0, TAU);
        c.fill();
      }
      c.fillStyle = 'rgba(79,195,247,0.7)';
      c.beginPath();
      c.ellipse(0, 120, 110, 24, 0, 0, TAU);
      c.fill();
      break;
    }
    case 'sun': {
      sun(0, -20, 46, 16);
      c.fillStyle = '#ff8f00';
      for (const ex of [-14, 14]) {
        c.beginPath();
        c.arc(ex, -28, 5, 0, TAU);
        c.fill();
      }
      c.strokeStyle = '#ff8f00';
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, -16, 16, 0.2, Math.PI - 0.2);
      c.stroke();
      c.fillStyle = '#fdd835';
      for (let i = 0; i < 4; i++) {
        const fx = -66 + i * 44;
        c.strokeStyle = '#558b2f';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(fx, 130);
        c.lineTo(fx, 84);
        c.stroke();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * TAU;
          c.beginPath();
          c.ellipse(fx + Math.cos(a) * 9, 80 + Math.sin(a) * 9, 6, 3.5, a, 0, TAU);
          c.fill();
        }
        c.fillStyle = '#6d4c41';
        c.beginPath();
        c.arc(fx, 80, 5, 0, TAU);
        c.fill();
        c.fillStyle = '#fdd835';
      }
      break;
    }
    case 'judgement': {
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.beginPath();
      c.ellipse(-30, -80, 60, 22, 0, 0, TAU);
      c.ellipse(30, -86, 50, 20, 0, 0, TAU);
      c.fill();
      c.fillStyle = gold;
      c.save();
      c.rotate(0.45);
      c.beginPath();
      c.moveTo(-10, -60);
      c.lineTo(10, -60);
      c.lineTo(12, 30);
      c.lineTo(40, 70);
      c.lineTo(-40, 70);
      c.lineTo(-12, 30);
      c.closePath();
      c.fill();
      c.restore();
      c.strokeStyle = 'rgba(255,240,180,0.9)';
      c.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(-30 + i * 6, 50);
        c.lineTo(-90 + i * 26, 130);
        c.stroke();
      }
      break;
    }
    case 'world': {
      c.strokeStyle = '#43a047';
      c.lineWidth = 12;
      c.beginPath();
      c.ellipse(0, 0, 62, 92, 0, 0, TAU);
      c.stroke();
      c.fillStyle = '#81c784';
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        c.beginPath();
        c.ellipse(Math.cos(a) * 62, Math.sin(a) * 92, 9, 4, a + Math.PI / 2, 0, TAU);
        c.fill();
      }
      c.fillStyle = '#e53935';
      c.fillRect(-14, -100, 28, 10);
      c.fillRect(-14, 90, 28, 10);
      c.fillStyle = gold;
      starShape(c, 0, 0, 32, 5, 0.45);
      c.fill();
      c.fillStyle = light;
      for (const [sx, sy] of [[-84, -100], [84, -100], [-84, 100], [84, 100]]) {
        c.beginPath();
        c.arc(sx, sy, 9, 0, TAU);
        c.fill();
      }
      break;
    }
    default:
      c.fillStyle = gold;
      starShape(c, 0, 0, 50, 5, 0.45);
      c.fill();
  }
  c.restore();
}
