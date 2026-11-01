// Nhân vật DJ (vẽ bằng code, phong cách giống các nhân vật khác):
// tóc vàng bob, yếm ánh kim (hologram), tai nghe, đứng sau bàn DJ trên sân khấu.
// Thêm bản chân dung lớn trên màn LED phía sau sân khấu.
import { roundRectPath } from './dancer.js';

const TAU = Math.PI * 2;
const SKIN = '#f8dcc8';
const HAIR = '#f1d79a';
const HAIR_DARK = '#c9a865';

function holo(ctx, x0, y0, x1, y1, t) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const h = (t * 40) % 360;
  g.addColorStop(0, `hsl(${h + 260},90%,72%)`);
  g.addColorStop(0.35, `hsl(${h + 200},95%,78%)`);
  g.addColorStop(0.6, `hsl(${h + 300},90%,75%)`);
  g.addColorStop(1, `hsl(${h + 180},95%,70%)`);
  return g;
}

function line(ctx, pts, w, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}

// đầu DJ, tâm (0,0), bán kính r=15 (đơn vị nhân vật)
function drawHead(ctx, t, lookDown) {
  const r = 15;
  // tóc phía sau: bob ngang cằm
  ctx.fillStyle = HAIR_DARK;
  ctx.beginPath();
  ctx.moveTo(-r - 4, -4);
  ctx.quadraticCurveTo(-r - 6, 14, -r - 2, 17);
  ctx.lineTo(r + 2, 17);
  ctx.quadraticCurveTo(r + 6, 14, r + 4, -4);
  ctx.closePath();
  ctx.fill();
  // cổ + mặt
  ctx.fillStyle = SKIN;
  ctx.fillRect(-4, 10, 8, 10);
  ctx.beginPath();
  ctx.ellipse(0, 1, r - 1, r, 0, 0, TAU);
  ctx.fill();
  // mắt nhìn xuống bàn DJ
  ctx.strokeStyle = '#3a2620';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  const ey = lookDown ? 2 : 0;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * 5.5, ey, 3, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // mi
    ctx.beginPath();
    ctx.moveTo(sx * 8.4, ey + 0.8);
    ctx.lineTo(sx * 9.8, ey - 0.6);
    ctx.stroke();
  }
  // má hồng, môi
  ctx.fillStyle = 'rgba(255,120,140,0.35)';
  ctx.beginPath();
  ctx.arc(-8.5, 6, 3, 0, TAU);
  ctx.arc(8.5, 6, 3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e0505f';
  ctx.beginPath();
  ctx.ellipse(0, 9.5, 2.6, 1.5, 0, 0, TAU);
  ctx.fill();
  // tóc phía trước: rẽ ngôi giữa, hai mái phủ hai bên
  ctx.fillStyle = HAIR;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -r - 1);
    ctx.quadraticCurveTo(sx * (r + 4), -r + 1, sx * (r + 3), 4);
    ctx.lineTo(sx * (r + 2), 17);
    ctx.lineTo(sx * (r - 3), 17);
    ctx.quadraticCurveTo(sx * (r - 5), 2, sx * 3, -r + 4);
    ctx.closePath();
    ctx.fill();
  }
  // ánh tóc
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -2, r - 1, -2.4, -1.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -2, r - 1, -1.2, -0.75);
  ctx.stroke();
  // tai nghe đeo một bên
  ctx.strokeStyle = '#1d1d26';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -1, r + 3, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.fillStyle = '#1d1d26';
  roundRectPath(ctx, r - 1, -6, 7, 13, 3);
  ctx.fill();
  ctx.fillStyle = `hsl(${(t * 60) % 360},100%,65%)`;
  ctx.fillRect(r + 1, -3, 3, 7);
}

// thân trên: yếm ánh kim + áo lưới bạc
function drawTorso(ctx, t) {
  ctx.fillStyle = '#d9dbe6';
  roundRectPath(ctx, -13, -36, 26, 40, 9);
  ctx.fill();
  ctx.fillStyle = holo(ctx, -13, -30, 13, 6, t);
  roundRectPath(ctx, -12, -24, 24, 30, 6);
  ctx.fill();
  // túi yếm
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.2;
  roundRectPath(ctx, -7, -16, 14, 10, 2);
  ctx.stroke();
  // dây đeo
  ctx.strokeStyle = holo(ctx, -10, -36, 10, -20, t + 2);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-9, -24);
  ctx.lineTo(-7, -37);
  ctx.moveTo(9, -24);
  ctx.lineTo(7, -37);
  ctx.stroke();
  ctx.fillStyle = '#b0b4c4';
  ctx.beginPath();
  ctx.arc(-9, -24, 1.8, 0, TAU);
  ctx.arc(9, -24, 1.8, 0, TAU);
  ctx.fill();
  // vệt sáng
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(-10, -22);
  ctx.lineTo(-4, -22);
  ctx.lineTo(-11, 2);
  ctx.closePath();
  ctx.fill();
}

/**
 * DJ đứng sau bàn, (x, y) là mặt sàn sân khấu nơi DJ đứng.
 * mode: 'mix' (đang chỉnh nhạc), 'hype' (giơ hai tay khi bùng nổ)
 */
export function drawStageDJ(ctx, x, y, sc, beat, t, mode = 'mix') {
  const pulse = Math.pow(Math.max(0, Math.cos((beat % 1) * TAU)), 2);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const bob = 3 * pulse;
  const hipY = -48 + bob;
  // chân (phần lớn bị bàn che)
  line(ctx, [[-6, hipY], [-7, -2]], 10, '#2b2a3a');
  line(ctx, [[6, hipY], [7, -2]], 10, '#2b2a3a');
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(0.04 * Math.sin(beat * Math.PI));
  drawTorso(ctx, t);
  // tay
  const shY = -32;
  let hands;
  if (mode === 'hype') {
    const w = 0.25 * Math.sin(beat * Math.PI);
    hands = [[-22 - 6 * w, -78], [22 - 6 * w, -78]];
  } else {
    // tay trái xoay đĩa, tay phải vặn núm luân phiên theo nhịp
    const scr = Math.sin(beat * Math.PI * 2) * 5;
    const knob = Math.floor(beat) % 4;
    hands = [[-26 + scr, 4], [knob === 3 ? 18 : 10 + knob * 3, 2 - (knob === 3 ? 14 * pulse : 0)]];
  }
  hands.forEach((h, i) => {
    const sx = i === 0 ? -12 : 12;
    const ex = (sx * 1.5 + h[0]) / 2 + (i === 0 ? -4 : 4);
    const ey = (shY + h[1]) / 2 + (mode === 'hype' ? 0 : 6);
    line(ctx, [[sx, shY + 3], [ex, ey]], 7, SKIN);
    line(ctx, [[ex, ey], h], 6, SKIN);
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.arc(h[0], h[1], 4, 0, TAU);
    ctx.fill();
  });
  ctx.translate(0, -36 - 15);
  ctx.rotate(mode === 'hype' ? -0.1 * Math.sin(beat * Math.PI) : 0.12 + 0.06 * pulse);
  drawHead(ctx, t, mode !== 'hype');
  ctx.restore();
  ctx.restore();
}

// bàn DJ: hai mâm đĩa + bàn mixer, phía trước có chữ DJ phát sáng
export function drawBooth(ctx, x, y, sc, beat, t, hue) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  const w = 120;
  // mặt bàn
  ctx.fillStyle = '#1b1828';
  roundRectPath(ctx, -w / 2, -58, w, 10, 3);
  ctx.fill();
  // mâm đĩa
  for (const dx of [-36, 36]) {
    ctx.fillStyle = '#0b0a12';
    ctx.beginPath();
    ctx.ellipse(dx, -54, 17, 5.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `hsla(${hue + (dx > 0 ? 120 : 0)},100%,65%,0.9)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const a = t * 6 + dx;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(dx + Math.cos(a) * 12, -54 + Math.sin(a) * 4, 1.6, 0, TAU);
    ctx.fill();
  }
  // mixer
  for (let i = 0; i < 6; i++) {
    const on = (i + Math.floor(beat * 2)) % 3 === 0;
    ctx.fillStyle = on ? `hsl(${hue + i * 40},100%,65%)` : '#3a364d';
    ctx.beginPath();
    ctx.arc(-10 + (i % 3) * 10, -56 + Math.floor(i / 3) * 4, 1.8, 0, TAU);
    ctx.fill();
  }
  // thân bàn
  const g = ctx.createLinearGradient(0, -48, 0, 0);
  g.addColorStop(0, '#2a2140');
  g.addColorStop(1, '#0d0918');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -48);
  ctx.lineTo(w / 2, -48);
  ctx.lineTo(w / 2 - 8, 0);
  ctx.lineTo(-w / 2 + 8, 0);
  ctx.closePath();
  ctx.fill();
  // dải đèn + chữ DJ
  const pulse = Math.pow(Math.max(0, Math.cos((beat % 1) * TAU)), 2);
  ctx.shadowBlur = 14;
  ctx.shadowColor = `hsl(${hue + 300},100%,60%)`;
  ctx.strokeStyle = `hsla(${hue + 300},100%,65%,${0.6 + 0.4 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '900 22px system-ui, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DJ', 0, -24);
  ctx.restore();
}

// Chân dung DJ lớn trên màn LED (bán thân), viền neon
export function drawDJPortrait(ctx, x, y, sc, beat, t, hue, mode = 'mix') {
  ctx.save();
  ctx.shadowColor = `hsl(${hue + 200},100%,60%)`;
  ctx.shadowBlur = 25;
  ctx.globalAlpha = 0.95;
  drawStageDJ(ctx, x, y, sc, beat, t, mode);
  ctx.restore();
}
