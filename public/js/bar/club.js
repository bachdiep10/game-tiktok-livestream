// Cảnh quán bar: tường, màn LED, sân khấu VIP, loa, sàn nhảy LED, đèn laser, quả cầu disco.
import { roundRectPath } from './dancer.js';

export const W = 1080;
export const H = 1920;
const TAU = Math.PI * 2;

// sàn nhảy (hình thang phối cảnh)
export const FLOOR = { top: 790, bottom: 1700, topL: 110, topR: 970, botL: -70, botR: 1150 };
// sân khấu VIP phía trên
export const STAGE = { x: 540, y: 612, rx: 300, ry: 46, front: 70 };
export const LED = { x: 170, y: 205, w: 740, h: 350 };

export function floorPoint(u, v) {
  const y = FLOOR.top + (FLOOR.bottom - FLOOR.top) * v;
  const l = FLOOR.topL + (FLOOR.botL - FLOOR.topL) * v;
  const r = FLOOR.topR + (FLOOR.botR - FLOOR.topR) * v;
  return [l + (r - l) * u, y];
}

export function scaleAtY(y) {
  const v = (y - FLOOR.top) / (FLOOR.bottom - FLOOR.top);
  return 0.92 + Math.max(0, Math.min(1, v)) * 0.55;
}

// ------------------------------------------------------------------ nền tĩnh (vẽ một lần)
export function drawStatic(b) {
  // tường
  const wall = b.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#07020f');
  wall.addColorStop(0.35, '#140527');
  wall.addColorStop(0.42, '#1b0733');
  wall.addColorStop(1, '#05010a');
  b.fillStyle = wall;
  b.fillRect(0, 0, W, H);

  // ô cách âm trên tường
  b.strokeStyle = 'rgba(140,90,255,0.07)';
  b.lineWidth = 2;
  for (let y = 180; y < FLOOR.top; y += 46) {
    for (let x = (y / 46) % 2 ? 0 : 23; x < W; x += 46) {
      b.beginPath();
      b.moveTo(x, y);
      b.lineTo(x + 23, y + 23);
      b.lineTo(x, y + 46);
      b.stroke();
    }
  }

  // khung màn LED
  b.fillStyle = '#05030a';
  roundRectPath(b, LED.x - 14, LED.y - 14, LED.w + 28, LED.h + 28, 16);
  b.fill();
  b.strokeStyle = '#2a1d44';
  b.lineWidth = 4;
  b.stroke();

  // loa hai bên
  for (const sx of [28, W - 168]) {
    b.fillStyle = '#0d0a14';
    roundRectPath(b, sx, 330, 140, 340, 12);
    b.fill();
    b.strokeStyle = '#2b2240';
    b.lineWidth = 3;
    b.stroke();
  }

  // sân khấu: mặt trước
  const st = STAGE;
  const front = b.createLinearGradient(0, st.y, 0, st.y + st.front + st.ry);
  front.addColorStop(0, '#1a1030');
  front.addColorStop(1, '#07040e');
  b.fillStyle = front;
  b.beginPath();
  b.ellipse(st.x, st.y + st.front, st.rx, st.ry, 0, 0, Math.PI);
  b.lineTo(st.x - st.rx, st.y);
  b.ellipse(st.x, st.y, st.rx, st.ry, 0, Math.PI, 0, true);
  b.closePath();
  b.fill();

  // sàn nhảy nền
  const f = FLOOR;
  b.fillStyle = '#08040f';
  b.beginPath();
  b.moveTo(f.topL, f.top);
  b.lineTo(f.topR, f.top);
  b.lineTo(f.botR, f.bottom);
  b.lineTo(f.botL, f.bottom);
  b.closePath();
  b.fill();
  // dải dưới cùng (bảng xếp hạng)
  const fg = b.createLinearGradient(0, 1700, 0, H);
  fg.addColorStop(0, '#0b0418');
  fg.addColorStop(1, '#030107');
  b.fillStyle = fg;
  b.fillRect(0, 1700, W, H - 1700);
}

// ------------------------------------------------------------------ phần chuyển động
const FLOOR_COLS = 8;
const FLOOR_ROWS = 9;

export function hsl(h, s = 100, l = 60, a = 1) {
  return `hsla(${h % 360},${s}%,${l}%,${a})`;
}

export function drawFloor(ctx, beat, hue, intensity, mode) {
  const pulse = Math.pow(Math.max(0, Math.cos((beat % 1) * TAU)), 3);
  for (let j = 0; j < FLOOR_ROWS; j++) {
    for (let i = 0; i < FLOOR_COLS; i++) {
      const [x0, y0] = floorPoint(i / FLOOR_COLS, j / FLOOR_ROWS);
      const [x1] = floorPoint((i + 1) / FLOOR_COLS, j / FLOOR_ROWS);
      const [x2, y2] = floorPoint((i + 1) / FLOOR_COLS, (j + 1) / FLOOR_ROWS);
      const [x3] = floorPoint(i / FLOOR_COLS, (j + 1) / FLOOR_ROWS);
      let on;
      const b = Math.floor(beat);
      if (mode === 0) on = (i + j + b) % 3 === 0;
      else if (mode === 1) on = Math.abs(i - 3.5) + Math.abs(j - 4) < ((b % 6) + 1) * 1.2 && Math.abs(i - 3.5) + Math.abs(j - 4) > (b % 6) * 1.2 - 1;
      else if (mode === 2) on = (i * 7 + j * 13 + b * 5) % 4 === 0;
      else on = j === b % FLOOR_ROWS || i === b % FLOOR_COLS;
      const h = hue + i * 18 + j * 12;
      const a = on ? 0.32 + 0.4 * pulse * intensity : 0.07;
      ctx.fillStyle = hsl(h, 100, on ? 58 : 40, a);
      ctx.beginPath();
      ctx.moveTo(x0 + 2, y0 + 2);
      ctx.lineTo(x1 - 2, y0 + 2);
      ctx.lineTo(x2 - 2, y2 - 2);
      ctx.lineTo(x3 + 2, y2 - 2);
      ctx.closePath();
      ctx.fill();
    }
  }
  // viền neon sàn
  ctx.save();
  ctx.strokeStyle = hsl(hue + 180, 100, 65, 0.8);
  ctx.shadowColor = hsl(hue + 180, 100, 60);
  ctx.shadowBlur = 18;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(FLOOR.topL, FLOOR.top);
  ctx.lineTo(FLOOR.topR, FLOOR.top);
  ctx.stroke();
  ctx.restore();
}

export function drawStageTop(ctx, beat, hue, occupied) {
  const st = STAGE;
  const pulse = Math.pow(Math.max(0, Math.cos((beat % 1) * TAU)), 2);
  // mặt sân khấu
  const g = ctx.createRadialGradient(st.x, st.y, 10, st.x, st.y, st.rx);
  g.addColorStop(0, occupied ? 'rgba(255,240,255,0.55)' : 'rgba(120,80,200,0.35)');
  g.addColorStop(1, 'rgba(40,20,80,0.9)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(st.x, st.y, st.rx, st.ry, 0, 0, TAU);
  ctx.fill();
  // vòng đèn quanh mép
  ctx.save();
  ctx.shadowBlur = 20;
  for (const [dy, hh] of [[0, hue], [st.front, hue + 120]]) {
    ctx.strokeStyle = hsl(hh, 100, 62, 0.65 + 0.35 * pulse);
    ctx.shadowColor = hsl(hh, 100, 60);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(st.x, st.y + dy, st.rx, st.ry, 0, dy ? 0 : 0, dy ? Math.PI : TAU);
    ctx.stroke();
  }
  // bóng đèn nhỏ ở mặt trước
  for (let k = 0; k < 22; k++) {
    const a = (k / 21) * Math.PI;
    const x = st.x + Math.cos(a) * st.rx * 0.98;
    const y = st.y + st.front * 0.55 + Math.sin(a) * st.ry;
    const on = (k + Math.floor(beat * 2)) % 3 === 0;
    ctx.fillStyle = on ? hsl(hue + k * 15, 100, 75) : 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(x, y, on ? 4 : 3, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // chữ VIP mặt trước sân khấu
  ctx.save();
  ctx.font = '900 30px system-ui, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = hsl(hue + 300, 100, 60);
  ctx.shadowBlur = 16;
  ctx.fillText('★ VIP STAGE ★', st.x, st.y + st.front + 18);
  ctx.restore();
}

export function drawSpeakers(ctx, beat, hue) {
  const k = Math.pow(Math.max(0, Math.cos((beat % 1) * TAU)), 4);
  for (const sx of [28, W - 168]) {
    for (const [cy, r] of [[420, 46], [560, 56], [640, 18]]) {
      const cx = sx + 70;
      ctx.fillStyle = '#16121f';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6, 0, TAU);
      ctx.fill();
      const rr = r * (1 + 0.07 * k);
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, rr);
      g.addColorStop(0, '#3a3450');
      g.addColorStop(0.5, '#0c0a12');
      g.addColorStop(0.92, '#26203a');
      g.addColorStop(1, hsl(hue, 100, 60, 0.6 + 0.4 * k));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, TAU);
      ctx.fill();
    }
  }
}

export function drawDiscoBall(ctx, x, y, r, t, hue) {
  ctx.save();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, y - r);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.clip();
  ctx.fillStyle = '#6b6f80';
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  const n = 8;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n * 2; i++) {
      const lon = ((i / (n * 2)) * TAU + t) % TAU;
      if (Math.cos(lon) < 0) continue;
      const lat = (j / n - 0.5) * Math.PI;
      const px = x + Math.sin(lon) * Math.cos(lat) * r;
      const py = y + Math.sin(lat) * r;
      const bright = (i * 7 + j * 3 + Math.floor(t * 6)) % 5 === 0;
      ctx.fillStyle = bright ? hsl(hue + i * 20, 100, 85) : `rgba(255,255,255,${0.2 + 0.4 * Math.cos(lon)})`;
      ctx.fillRect(px - 3, py - 3, 6 * Math.cos(lon) + 1, 6);
    }
  }
  ctx.restore();
}

// đèn laser quét từ hai góc sân khấu xuống sàn
export function drawLasers(ctx, t, hue, strength) {
  if (strength <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const sources = [[LED.x - 10, LED.y + 10], [LED.x + LED.w + 10, LED.y + 10]];
  sources.forEach(([sx, sy], si) => {
    for (let k = 0; k < 5; k++) {
      const ang = Math.PI / 2 + Math.sin(t * 0.9 + k * 0.5 + si * 2) * 0.75 + (si ? 0.25 : -0.25);
      const len = 1700;
      const ex = sx + Math.cos(ang) * len;
      const ey = sy + Math.sin(ang) * len;
      ctx.strokeStyle = hsl(hue + (si ? 120 : 300) + k * 8, 100, 60, 0.22 * strength);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.35 * strength})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });
  ctx.restore();
}

// đèn rọi di chuyển trên sàn
export function drawSpotlights(ctx, t, hue) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 4; k++) {
    const u = 0.5 + 0.42 * Math.sin(t * (0.35 + k * 0.07) + k * 1.7);
    const v = 0.5 + 0.45 * Math.sin(t * (0.27 + k * 0.05) + k * 2.3);
    const [fx, fy] = floorPoint(u, v);
    const sx = 180 + k * 240;
    const col = hsl(hue + k * 90, 100, 60, 0.09);
    const g = ctx.createLinearGradient(sx, 0, fx, fy);
    g.addColorStop(0, hsl(hue + k * 90, 100, 70, 0.0));
    g.addColorStop(1, col);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx - 10, 170);
    ctx.lineTo(sx + 10, 170);
    ctx.lineTo(fx + 95, fy);
    ctx.lineTo(fx - 95, fy);
    ctx.closePath();
    ctx.fill();
    const rg = ctx.createRadialGradient(fx, fy, 5, fx, fy, 100);
    rg.addColorStop(0, hsl(hue + k * 90, 100, 70, 0.35));
    rg.addColorStop(1, hsl(hue + k * 90, 100, 60, 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 100, 30, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// khói sân khấu
export function drawFog(ctx, t) {
  ctx.save();
  for (let k = 0; k < 6; k++) {
    const x = ((k * 230 + t * (12 + k * 3)) % 1400) - 160;
    const y = 1580 - (k % 3) * 300 + Math.sin(t * 0.3 + k) * 30;
    const r = 260;
    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, 'rgba(190,170,255,0.07)');
    g.addColorStop(1, 'rgba(190,170,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}
