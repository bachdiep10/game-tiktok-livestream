// Bến câu sinh tồn: cảnh khúc sông quê, hai bến gỗ, người câu, cá, thuyền thúng, thủy quái.
// Tất cả vẽ bằng code (canvas 2D), không dùng ảnh có bản quyền.

export const W = 1080;
export const H = 1920;
export const TAU = Math.PI * 2;
export const FAR_Y = 640; // mép bờ bên kia
export const WATER_Y = 720; // mặt nước bắt đầu
export const PIER_TOP = 800; // đầu bến gỗ
export const CHANNEL = { x0: 330, x1: 750 }; // lòng sông giữa hai bến

export const TEAM = [
  { name: 'BẾN TRÁI', short: 'Trái', color: '#ff7043', light: '#ffccbc', dark: '#bf360c' },
  { name: 'BẾN PHẢI', short: 'Phải', color: '#42a5f5', light: '#bbdefb', dark: '#0d47a1' },
];

// 32 chỗ ngồi: 2 bến × 2 hàng (sát mép nước, phía trong) × 8 tầng
export const ROWS = 8;
export const ROW_Y = (row) => 880 + row * 90;
export const SEATS = [];
for (let side = 0; side < 2; side++) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < 2; col++) {
      const dir = side === 0 ? 1 : -1;
      const xl = col === 0 ? 268 : 158;
      SEATS.push({
        side, row, col, dir,
        x: side === 0 ? xl : W - xl,
        y: ROW_Y(row),
        s: 0.98 + row * 0.045,
      });
    }
  }
}
// thứ tự ưu tiên ngồi: tầng giữa trước (dễ nhìn, không bị giao diện điện thoại che)
export const SEAT_ORDER = SEATS.map((s, i) => i).sort((a, b) => {
  const pa = Math.abs(SEATS[a].row - 2.5) + SEATS[a].col * 0.6;
  const pb = Math.abs(SEATS[b].row - 2.5) + SEATS[b].col * 0.6;
  return pa - pb;
});

export const RAFT = { x: 540, y: 1600 }; // bè tre có đống lửa

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

const lerp = (a, b, t) => a + (b - a) * t;
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `rgb(${r},${g},${bl})`;
}

// số giả ngẫu nhiên cố định để cảnh tĩnh lần nào vẽ cũng giống nhau
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ------------------------------------------------------------------ bầu trời (vẽ mỗi khung hình)
// night: 0 ngày → 1 đêm, dusk: 0..1 ánh chiều
export function drawSky(c, night, dusk, t) {
  const top = mixHex(mixHex('#7ec8f0', '#f08a5d', dusk * 0.6), '#0b1430', night);
  const mid = mixHex(mixHex('#bfe6f7', '#ffc48a', dusk), '#1c2a55', night);
  const g = c.createLinearGradient(0, 0, 0, WATER_Y);
  g.addColorStop(0, top);
  g.addColorStop(1, mid);
  c.fillStyle = g;
  c.fillRect(0, 0, W, WATER_Y);
  // mặt trời / mặt trăng
  if (night < 0.7) {
    const sy = 585 + dusk * 50;
    c.save();
    c.globalAlpha = 1 - night;
    const sg = c.createRadialGradient(820, sy, 10, 820, sy, 110);
    sg.addColorStop(0, dusk > 0.3 ? 'rgba(255,190,110,0.9)' : 'rgba(255,250,215,0.9)');
    sg.addColorStop(1, 'rgba(255,230,160,0)');
    c.fillStyle = sg;
    c.fillRect(700, sy - 110, 240, 220);
    c.fillStyle = dusk > 0.3 ? '#ffb46b' : '#fff4c9';
    c.beginPath();
    c.arc(820, sy, 34, 0, TAU);
    c.fill();
    c.restore();
  }
  if (night > 0.3) {
    c.save();
    c.globalAlpha = (night - 0.3) / 0.7;
    const r = rng(7);
    c.fillStyle = '#fff';
    for (let i = 0; i < 90; i++) {
      const x = r() * W;
      const y = r() * 600;
      const tw = 0.5 + 0.5 * Math.sin(t * 0.002 + i * 1.7);
      c.globalAlpha = ((night - 0.3) / 0.7) * (0.3 + tw * 0.7);
      c.fillRect(x, y, 2.2, 2.2);
    }
    c.globalAlpha = (night - 0.3) / 0.7;
    const mg = c.createRadialGradient(240, 520, 10, 240, 520, 130);
    mg.addColorStop(0, 'rgba(230,240,255,0.5)');
    mg.addColorStop(1, 'rgba(230,240,255,0)');
    c.fillStyle = mg;
    c.fillRect(110, 390, 260, 260);
    c.fillStyle = '#f4f1dc';
    c.beginPath();
    c.arc(240, 520, 40, 0, TAU);
    c.fill();
    c.fillStyle = mixHex('#1c2a55', '#0b1430', 0.5);
    c.beginPath();
    c.arc(258, 510, 36, 0, TAU);
    c.fill();
    c.restore();
  }
}

// ------------------------------------------------------------------ bờ bên kia (vẽ sẵn 1 lần)
export function drawFarBank(c) {
  const r = rng(11);
  // đồi xa
  c.fillStyle = '#7fa88f';
  c.beginPath();
  c.moveTo(0, 600);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, 560 + Math.sin(x * 0.006) * 30 + Math.sin(x * 0.017) * 12);
  c.lineTo(W, FAR_Y + 10);
  c.lineTo(0, FAR_Y + 10);
  c.fill();
  c.fillStyle = '#6a9a78';
  c.beginPath();
  c.moveTo(0, 620);
  for (let x = 0; x <= W; x += 30) c.lineTo(x, 598 + Math.sin(x * 0.011 + 2) * 18);
  c.lineTo(W, FAR_Y + 10);
  c.lineTo(0, FAR_Y + 10);
  c.fill();
  // nhà mái ngói đỏ
  const houses = [[120, 0.9], [360, 1], [600, 0.85], [700, 1.05], [940, 0.95]];
  for (const [hx, hs] of houses) {
    const w = 90 * hs;
    const h = 46 * hs;
    const by = FAR_Y + 4;
    c.fillStyle = '#efe3c8';
    c.fillRect(hx - w / 2, by - h, w, h);
    c.fillStyle = '#b5482f';
    c.beginPath();
    c.moveTo(hx - w / 2 - 10, by - h);
    c.lineTo(hx - w / 2 + 14, by - h - 30 * hs);
    c.lineTo(hx + w / 2 - 14, by - h - 30 * hs);
    c.lineTo(hx + w / 2 + 10, by - h);
    c.fill();
    c.fillStyle = '#6d4c41';
    c.fillRect(hx - 9 * hs, by - 30 * hs, 18 * hs, 30 * hs);
    c.fillStyle = '#4e6e8e';
    c.fillRect(hx - w / 2 + 8, by - h + 12, 14 * hs, 12 * hs);
    c.fillRect(hx + w / 2 - 22 * hs, by - h + 12, 14 * hs, 12 * hs);
  }
  // lũy tre
  for (let i = 0; i < 26; i++) {
    const bx = r() * W;
    const bh = 70 + r() * 60;
    const lean = (r() - 0.5) * 30;
    c.strokeStyle = '#5c7f3a';
    c.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.moveTo(bx + k * 4, FAR_Y + 8);
      c.quadraticCurveTo(bx + k * 4 + lean * 0.3, FAR_Y - bh * 0.6, bx + k * 5 + lean, FAR_Y - bh);
      c.stroke();
    }
    for (let k = 0; k < 7; k++) {
      c.fillStyle = k % 2 ? '#4f8a3a' : '#3f7530';
      c.beginPath();
      c.ellipse(bx + lean * 0.8 + (r() - 0.5) * 50, FAR_Y - bh + r() * 50, 26 + r() * 14, 12 + r() * 6, (r() - 0.5) * 0.8, 0, TAU);
      c.fill();
    }
  }
  // cây đa lớn bên phải
  c.fillStyle = '#5d4037';
  c.fillRect(1000, FAR_Y - 90, 22, 100);
  for (let k = 0; k < 9; k++) {
    c.fillStyle = k % 2 ? '#2f6b2f' : '#3d7d35';
    c.beginPath();
    c.arc(960 + r() * 110, FAR_Y - 130 + r() * 70, 38 + r() * 18, 0, TAU);
    c.fill();
  }
  // dải cỏ bờ
  c.fillStyle = '#6b8f3a';
  c.fillRect(0, FAR_Y, W, WATER_Y - FAR_Y);
  c.fillStyle = '#8a6a3c';
  c.fillRect(0, WATER_Y - 18, W, 18);
  for (let x = 0; x < W; x += 6) {
    c.strokeStyle = r() < 0.5 ? '#557a2c' : '#7aa346';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, WATER_Y - 14);
    c.lineTo(x + (r() - 0.5) * 6, WATER_Y - 30 - r() * 22);
    c.stroke();
  }
}

// ------------------------------------------------------------------ mặt nước (mỗi khung hình)
export function drawWater(c, t, night, rain) {
  const g = c.createLinearGradient(0, WATER_Y, 0, H);
  g.addColorStop(0, mixHex('#7cbfc9', '#1d3350', night));
  g.addColorStop(0.35, mixHex('#3f8d9c', '#14263f', night));
  g.addColorStop(1, mixHex('#24606e', '#0b1729', night));
  c.fillStyle = g;
  c.fillRect(0, WATER_Y, W, H - WATER_Y);
  // bóng bờ bên kia
  c.fillStyle = `rgba(40,70,40,${0.25 * (1 - night)})`;
  c.fillRect(0, WATER_Y, W, 40);
  // gợn sóng chạy ngang
  c.save();
  c.lineCap = 'round';
  const r = rng(3);
  for (let i = 0; i < 70; i++) {
    const baseY = WATER_Y + 20 + r() * (H - WATER_Y);
    const depth = (baseY - WATER_Y) / (H - WATER_Y);
    const speed = 8 + r() * 14;
    const len = 20 + depth * 50 + r() * 20;
    const x = ((r() * W + t * 0.001 * speed) % (W + 120)) - 60;
    const a = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(t * 0.0015 + i));
    c.strokeStyle = night > 0.5 ? `rgba(160,190,255,${a * 0.6})` : `rgba(235,250,255,${a})`;
    c.lineWidth = 1.5 + depth * 2;
    c.beginPath();
    c.moveTo(x, baseY);
    c.quadraticCurveTo(x + len / 2, baseY - 3, x + len, baseY);
    c.stroke();
  }
  // vệt sáng mặt trời / trăng
  const sx = night > 0.5 ? 240 : 820;
  for (let i = 0; i < 14; i++) {
    const y = WATER_Y + 10 + i * 14;
    const w = 30 + Math.sin(t * 0.003 + i) * 14 + i * 3;
    c.fillStyle = night > 0.5 ? 'rgba(230,240,255,0.18)' : 'rgba(255,248,210,0.22)';
    c.fillRect(sx - w / 2 + Math.sin(t * 0.002 + i * 2) * 8, y, w, 3);
  }
  // mưa: chấm tròn trên mặt nước
  if (rain > 0) {
    const n = Math.floor(rain * 30);
    for (let i = 0; i < n; i++) {
      const k = (t * 0.003 + i * 0.37) % 1;
      const rx = ((i * 197.3) % W);
      const ry = WATER_Y + 30 + ((i * 331.7 + Math.floor(t * 0.003 + i * 0.37) * 97) % (H - WATER_Y - 30));
      c.strokeStyle = `rgba(220,235,255,${(1 - k) * 0.5 * rain})`;
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(rx, ry, 4 + k * 16, (4 + k * 16) * 0.35, 0, 0, TAU);
      c.stroke();
    }
  }
  c.restore();
}

// bèo, lục bình, sen ở lòng sông (vẽ sẵn)
export function drawWaterDecor(c) {
  const r = rng(21);
  const clumps = [[60, 760], [1010, 770], [470, 760], [620, 770], [520, 1820], [700, 1760], [380, 1780]];
  for (const [x, y] of clumps) {
    for (let k = 0; k < 6; k++) {
      const px = x + (r() - 0.5) * 70;
      const py = y + (r() - 0.5) * 20;
      c.fillStyle = k % 2 ? '#3f8a3a' : '#2f7a33';
      c.beginPath();
      c.ellipse(px, py, 16 + r() * 8, 7 + r() * 3, 0, 0.3, TAU - 0.1);
      c.lineTo(px, py);
      c.fill();
      if (r() < 0.3) {
        c.fillStyle = '#c792ea';
        c.beginPath();
        c.arc(px + 4, py - 8, 6, 0, TAU);
        c.fill();
        c.fillStyle = '#fff59d';
        c.beginPath();
        c.arc(px + 4, py - 8, 2, 0, TAU);
        c.fill();
      }
    }
  }
}

// ------------------------------------------------------------------ hai bến gỗ (vẽ sẵn)
export function drawPiers(c) {
  for (let side = 0; side < 2; side++) {
    c.save();
    if (side === 1) {
      c.translate(W, 0);
      c.scale(-1, 1);
    }
    const x0 = 40;
    const x1 = 300;
    // cọc dưới nước
    for (let y = PIER_TOP + 30; y < H; y += 90) {
      for (const px of [x0 + 10, x1 - 8]) {
        c.fillStyle = '#4e342e';
        c.fillRect(px - 7, y, 14, 46);
        c.strokeStyle = 'rgba(255,255,255,0.3)';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(px, y + 46, 16, 5, 0, 0, TAU);
        c.stroke();
      }
    }
    // bóng bến trên mặt nước
    c.fillStyle = 'rgba(0,20,30,0.25)';
    c.fillRect(x1, PIER_TOP + 20, 26, H - PIER_TOP);
    // mặt sàn ván
    const dg = c.createLinearGradient(x0, 0, x1, 0);
    dg.addColorStop(0, '#9c6b3a');
    dg.addColorStop(1, '#b98450');
    c.fillStyle = dg;
    c.fillRect(x0, PIER_TOP, x1 - x0, H - PIER_TOP);
    const r = rng(40 + side);
    for (let y = PIER_TOP; y < H; y += 22) {
      c.fillStyle = 'rgba(60,35,15,0.45)';
      c.fillRect(x0, y, x1 - x0, 2);
      c.fillStyle = `rgba(255,230,190,${0.05 + r() * 0.08})`;
      c.fillRect(x0, y + 3, x1 - x0, 4);
      // vân gỗ, đinh
      c.fillStyle = 'rgba(40,20,10,0.5)';
      c.fillRect(x0 + 14, y + 10, 3, 3);
      c.fillRect(x1 - 18, y + 10, 3, 3);
      if (r() < 0.4) {
        c.strokeStyle = 'rgba(80,45,20,0.35)';
        c.lineWidth = 1;
        c.beginPath();
        const vx = x0 + 40 + r() * 150;
        c.moveTo(vx, y + 8);
        c.lineTo(vx + 40, y + 9);
        c.stroke();
      }
    }
    // mép ván phía nước
    c.fillStyle = '#6d4426';
    c.fillRect(x1 - 6, PIER_TOP, 10, H - PIER_TOP);
    c.fillRect(x0 - 4, PIER_TOP, 8, H - PIER_TOP);
    // đầu bến
    c.fillStyle = '#7a4b28';
    c.fillRect(x0 - 4, PIER_TOP - 8, x1 - x0 + 8, 14);
    // dây thừng lan can phía ngoài
    c.strokeStyle = '#d8c08a';
    c.lineWidth = 3;
    for (let y = PIER_TOP; y < H - 76; y += 152) {
      c.beginPath();
      c.moveTo(x0, y);
      c.quadraticCurveTo(x0 + 6, y + 76, x0, y + 152);
      c.stroke();
    }
    c.restore();
  }
}

// biển tên bến, cột đèn dầu (vẽ mỗi khung để đổi màu đội và ánh đèn đêm)
export function drawPierSigns(c, night, score, leading) {
  for (let side = 0; side < 2; side++) {
    const tm = TEAM[side];
    const cx = side === 0 ? 170 : W - 170;
    const y = PIER_TOP - 70;
    c.save();
    c.fillStyle = '#5d3a1a';
    c.fillRect(cx - 70, y + 40, 8, 40);
    c.fillRect(cx + 62, y + 40, 8, 40);
    roundRectPath(c, cx - 96, y - 6, 192, 54, 10);
    c.fillStyle = tm.dark;
    c.fill();
    c.strokeStyle = leading === side ? '#ffe082' : '#3e2412';
    c.lineWidth = leading === side ? 5 : 3;
    c.stroke();
    c.fillStyle = '#fff';
    c.font = '900 30px "Segoe UI", system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(tm.name, cx, y + 21);
    c.restore();
  }
}

export function drawLanterns(c, night, t) {
  for (let side = 0; side < 2; side++) {
    for (const row of [1, 4, 7]) {
      const x = side === 0 ? 52 : W - 52;
      const y = ROW_Y(row) - 60;
      c.fillStyle = '#4e342e';
      c.fillRect(x - 3, y, 6, 60);
      c.fillStyle = '#2b1d16';
      c.fillRect(x - 10, y - 26, 20, 26);
      const on = night > 0.25;
      c.fillStyle = on ? '#ffd166' : '#a1887f';
      c.fillRect(x - 7, y - 22, 14, 18);
      if (on) {
        const a = Math.min(1, (night - 0.25) * 2) * (0.85 + 0.15 * Math.sin(t * 0.01 + row));
        c.save();
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(x, y - 14, 4, x, y - 14, 120);
        g.addColorStop(0, `rgba(255,200,100,${0.45 * a})`);
        g.addColorStop(1, 'rgba(255,160,60,0)');
        c.fillStyle = g;
        c.fillRect(x - 120, y - 134, 240, 240);
        c.restore();
      }
    }
  }
}

// ------------------------------------------------------------------ bè tre và đống lửa
export function drawRaft(c, t, fire, night) {
  const { x, y } = RAFT;
  const bob = Math.sin(t * 0.0018) * 3;
  c.save();
  c.translate(x, y + bob);
  c.fillStyle = 'rgba(0,20,30,0.3)';
  c.beginPath();
  c.ellipse(0, 22, 130, 18, 0, 0, TAU);
  c.fill();
  for (let i = 0; i < 9; i++) {
    const yy = -40 + i * 9;
    c.fillStyle = i % 2 ? '#c9b26a' : '#b59d55';
    roundRectPath(c, -120, yy, 240, 10, 5);
    c.fill();
  }
  c.strokeStyle = '#7a6a3a';
  c.lineWidth = 3;
  for (const bx of [-90, 0, 90]) {
    c.beginPath();
    c.moveTo(bx, -42);
    c.lineTo(bx, 42);
    c.stroke();
  }
  // lều nhỏ
  c.fillStyle = '#6d8f4e';
  c.beginPath();
  c.moveTo(-110, 0);
  c.lineTo(-62, -70);
  c.lineTo(-14, 0);
  c.fill();
  c.fillStyle = '#4e6e35';
  c.beginPath();
  c.moveTo(-62, -70);
  c.lineTo(-50, 0);
  c.lineTo(-74, 0);
  c.fill();
  // nồi, củi
  c.fillStyle = '#5d4037';
  for (let i = 0; i < 4; i++) {
    c.save();
    c.translate(48, -6);
    c.rotate(i * 0.8);
    c.fillRect(-26, -4, 52, 8);
    c.restore();
  }
  if (fire > 0) {
    const f = Math.min(1, fire);
    for (let i = 0; i < 5; i++) {
      const fl = Math.sin(t * 0.02 + i * 1.7) * 6;
      c.fillStyle = i % 2 ? '#ffb300' : '#ff6f00';
      c.beginPath();
      c.moveTo(48 - 18 + i * 9, -6);
      c.quadraticCurveTo(48 - 22 + i * 9 + fl, -40 * f - i % 3 * 8, 48 - 14 + i * 9 + fl * 0.5, -60 * f - (i % 2) * 10);
      c.quadraticCurveTo(48 - 6 + i * 9, -30 * f, 48 - 9 + i * 9, -6);
      c.fill();
    }
    c.fillStyle = '#fff59d';
    c.beginPath();
    c.ellipse(48, -16, 9, 16 * f, 0, 0, TAU);
    c.fill();
  } else {
    c.fillStyle = 'rgba(200,200,200,0.4)';
    c.beginPath();
    c.arc(48 + Math.sin(t * 0.003) * 6, -30 - ((t * 0.02) % 30), 8, 0, TAU);
    c.fill();
  }
  c.restore();
}

export function drawFireGlow(c, t, fire, night) {
  if (fire <= 0) return;
  const a = (0.25 + night * 0.5) * (0.85 + 0.15 * Math.sin(t * 0.03));
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(RAFT.x + 48, RAFT.y - 20, 10, RAFT.x + 48, RAFT.y - 20, 360);
  g.addColorStop(0, `rgba(255,170,70,${a})`);
  g.addColorStop(1, 'rgba(255,120,40,0)');
  c.fillStyle = g;
  c.fillRect(RAFT.x - 320, RAFT.y - 380, 740, 740);
  c.restore();
}

// ------------------------------------------------------------------ người câu (nhìn nghiêng)
const SKINS = ['#f6d3b3', '#efc19b', '#e0a87e', '#c98d62', '#f3c9a5', '#d9a07a'];
const HAIRS = ['#1d1410', '#2b1d16', '#3b2a20', '#5a3d2b', '#1a1a1a', '#8a8a8a'];
const SHIRTS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#fb8c00', '#8e24aa', '#00897b', '#f5f5f5', '#6d4c41', '#3949ab', '#ec407a', '#26a69a', '#78909c', '#5d8a3a'];
const PANTS = ['#37474f', '#1565c0', '#4e342e', '#2e7d32', '#263238', '#5d4037', '#212121'];
const HATS = ['non', 'non', 'non', 'bucket', 'cap', 'none', 'non', 'bucket'];
const HAT_COLORS = ['#e8d49a', '#e8d49a', '#6b8e23', '#c62828', '#1565c0', '#f5f5f5', '#795548'];

function hashStr(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function lookFor(id) {
  let h = hashStr(id);
  const take = (arr) => {
    const v = arr[h % arr.length];
    h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0;
    return v;
  };
  const hat = take(HATS);
  return {
    skin: take(SKINS),
    hair: take(HAIRS),
    shirt: take(SHIRTS),
    pants: take(PANTS),
    hat,
    hatColor: hat === 'non' ? '#e8d49a' : take(HAT_COLORS),
    longHair: h % 3 === 0,
    beard: h % 8 === 0,
    towel: h % 5 === 0,
  };
}

export function crowdLook(i) {
  const l = lookFor(`crowd-${i}`);
  return { ...l, shirt: ['#9e9a90', '#8f9a9a', '#a39686', '#949aa8'][i % 4], pants: '#5a5a5a', faded: true };
}

// Vẽ người ngồi câu. (0,0) = chỗ ngồi trên mép ván, mặt hướng sang phải (dir = 1).
// pose: sit | cast | reel | show | sleep | eat | cheer. Trả về vị trí tay (gốc cần) theo toạ độ thế giới.
export function drawFisher(c, p) {
  const { x, y, s, dir, look, pose = 'sit', t = 0, col = 0 } = p;
  const k = p.k ?? 0; // tiến trình động tác 0..1
  c.save();
  c.translate(x, y);
  c.scale(s * dir, s);
  if (look.faded) c.globalAlpha = 0.82;
  const breathe = Math.sin(t * 0.003 + (p.phase || 0)) * 1.2;
  const sleep = pose === 'sleep';
  const lean = sleep ? 0.25 : pose === 'reel' ? -0.18 : pose === 'cheer' ? -0.1 : 0;
  // bóng
  c.fillStyle = 'rgba(30,15,5,0.25)';
  c.beginPath();
  c.ellipse(4, 2, 30, 7, 0, 0, TAU);
  c.fill();
  // ghế đẩu cho hàng trong
  if (col === 1) {
    c.fillStyle = '#5d4037';
    c.fillRect(-14, -12, 28, 8);
    c.fillRect(-12, -4, 4, 8);
    c.fillRect(8, -4, 4, 8);
  }
  const hipY = col === 1 ? -14 : -4;
  // chân
  c.strokeStyle = look.pants;
  c.lineCap = 'round';
  c.lineWidth = 11;
  const swing = col === 0 ? Math.sin(t * 0.004 + (p.phase || 0)) * 4 : 0;
  c.beginPath();
  c.moveTo(-2, hipY);
  c.lineTo(20, hipY + 1);
  c.lineTo(col === 0 ? 26 + swing : 24, col === 0 ? hipY + 26 : hipY + 18);
  c.stroke();
  c.fillStyle = look.skin;
  c.beginPath();
  c.ellipse(col === 0 ? 28 + swing : 27, col === 0 ? hipY + 30 : hipY + 20, 6, 4, 0, 0, TAU);
  c.fill();
  // thân
  c.save();
  c.translate(0, hipY);
  c.rotate(lean);
  c.fillStyle = look.shirt;
  roundRectPath(c, -13, -40 + breathe, 26, 42 - breathe, 10);
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.12)';
  roundRectPath(c, -13, -40 + breathe, 9, 42 - breathe, 6);
  c.fill();
  if (look.towel) {
    c.fillStyle = '#fafafa';
    c.fillRect(-12, -38 + breathe, 24, 5);
  }
  // đầu
  const hx = 3;
  const hy = -56 + breathe + (sleep ? 6 : 0);
  const headTilt = sleep ? 0.35 : pose === 'eat' ? 0.12 : pose === 'cheer' ? -0.15 : 0;
  c.save();
  c.translate(hx, hy);
  c.rotate(headTilt);
  c.fillStyle = look.hair;
  c.beginPath();
  c.arc(-3, -2, 17, 0, TAU);
  c.fill();
  if (look.longHair) {
    c.fillRect(-19, -2, 12, 24);
  }
  c.fillStyle = look.skin;
  c.beginPath();
  c.arc(1, 1, 15.5, 0, TAU);
  c.fill();
  // tai
  c.beginPath();
  c.arc(-5, 2, 4, 0, TAU);
  c.fill();
  // mắt
  c.fillStyle = '#1a1a1a';
  if (sleep || p.eyesClosed) {
    c.strokeStyle = '#1a1a1a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(6, 0);
    c.lineTo(12, 1);
    c.stroke();
  } else if (pose === 'cheer' || pose === 'show') {
    c.strokeStyle = '#1a1a1a';
    c.lineWidth = 2.4;
    c.beginPath();
    c.arc(9, 1, 3.4, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
  } else {
    c.beginPath();
    c.ellipse(9, -1, 2.4, 3.2, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#fff';
    c.fillRect(9.4, -3, 1.2, 1.2);
  }
  // má hồng
  c.fillStyle = 'rgba(255,120,120,0.35)';
  c.beginPath();
  c.arc(9, 7, 3.5, 0, TAU);
  c.fill();
  // miệng
  c.strokeStyle = '#7a3b2e';
  c.lineWidth = 2;
  c.beginPath();
  if (pose === 'eat') {
    const chew = Math.abs(Math.sin(t * 0.02));
    c.fillStyle = '#7a3b2e';
    c.ellipse(13, 9, 2.5, 1 + chew * 2.5, 0, 0, TAU);
    c.fill();
  } else if (pose === 'cheer' || pose === 'show' || p.happy) {
    c.arc(11, 7, 3.5, 0.1, Math.PI - 0.3);
    c.stroke();
  } else if (sleep) {
    c.arc(12, 9, 1.8, 0, TAU);
    c.stroke();
  } else {
    c.moveTo(9, 9);
    c.lineTo(14, 8);
    c.stroke();
  }
  if (look.beard) {
    c.fillStyle = 'rgba(40,30,20,0.55)';
    c.beginPath();
    c.arc(8, 12, 6, 0, Math.PI);
    c.fill();
  }
  // mũ
  drawHat(c, look, p.bow);
  c.restore();
  // tay cầm cần
  const sh = { x: 4, y: -30 + breathe };
  let hand = { x: 22, y: -22 };
  if (pose === 'cast') hand = { x: 6 + k * 18, y: -48 + k * 26 };
  if (pose === 'reel') hand = { x: 16, y: -38 };
  if (pose === 'sleep') hand = { x: 20, y: -10 };
  if (pose === 'eat') hand = { x: 18, y: -46 };
  if (pose === 'show') hand = { x: 20, y: -60 };
  if (pose === 'cheer') hand = { x: 10, y: -66 };
  c.strokeStyle = look.shirt;
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(sh.x, sh.y);
  c.lineTo(hand.x, hand.y);
  c.stroke();
  c.fillStyle = look.skin;
  c.beginPath();
  c.arc(hand.x, hand.y, 5, 0, TAU);
  c.fill();
  c.restore();
  c.restore();
  // toạ độ thế giới của tay
  const ca = Math.cos(lean);
  const sa = Math.sin(lean);
  const lx = hand.x * ca - hand.y * sa;
  const ly = hand.x * sa + hand.y * ca + hipY;
  return { x: x + lx * s * dir, y: y + ly * s, headX: x + 3 * s * dir, headY: y + (hipY - 56) * s };
}

function drawHat(c, look, bow) {
  if (look.hat === 'non') {
    c.fillStyle = look.hatColor;
    c.beginPath();
    c.moveTo(-26, -6);
    c.lineTo(1, -36);
    c.lineTo(28, -6);
    c.quadraticCurveTo(1, -1, -26, -6);
    c.fill();
    c.strokeStyle = 'rgba(120,90,40,0.5)';
    c.lineWidth = 1.2;
    for (let i = 1; i < 4; i++) {
      c.beginPath();
      c.moveTo(-26 + i * 6.7, -6 - i * 7.5);
      c.lineTo(28 - i * 6.7, -6 - i * 7.5);
      c.stroke();
    }
    if (bow) {
      c.fillStyle = '#e91e63';
      c.beginPath();
      c.moveTo(1, -12);
      c.lineTo(-10, -20);
      c.lineTo(-10, -4);
      c.closePath();
      c.moveTo(1, -12);
      c.lineTo(12, -20);
      c.lineTo(12, -4);
      c.closePath();
      c.fill();
      c.beginPath();
      c.arc(1, -12, 3.5, 0, TAU);
      c.fill();
    }
  } else if (look.hat === 'bucket') {
    c.fillStyle = look.hatColor;
    c.beginPath();
    c.ellipse(1, -8, 24, 6, 0, 0, TAU);
    c.fill();
    roundRectPath(c, -14, -24, 30, 18, 8);
    c.fill();
    if (bow) {
      c.fillStyle = '#e91e63';
      c.beginPath();
      c.arc(14, -18, 5, 0, TAU);
      c.fill();
    }
  } else if (look.hat === 'cap') {
    c.fillStyle = look.hatColor;
    c.beginPath();
    c.arc(0, -6, 16, Math.PI, 0);
    c.fill();
    c.fillRect(8, -8, 18, 5);
    if (bow) {
      c.fillStyle = '#e91e63';
      c.beginPath();
      c.arc(-4, -18, 5, 0, TAU);
      c.fill();
    }
  } else if (bow) {
    c.fillStyle = '#e91e63';
    c.beginPath();
    c.arc(-6, -14, 5, 0, TAU);
    c.fill();
  }
}

// ------------------------------------------------------------------ cá
// len = chiều dài thân (px). Vẽ đầu hướng sang phải.
export const FISH_ART = {
  ro: { body: '#7c8f5a', belly: '#c9cf9b', fin: '#5e6e3e', h: 0.42, spiny: true },
  diec: { body: '#b8c2c8', belly: '#eef2f4', fin: '#8f9aa1', h: 0.48 },
  bong: { body: '#8d6e4c', belly: '#d7c3a0', fin: '#6d5236', h: 0.3, spots: '#5a4028' },
  chep: { body: '#c9902e', belly: '#f3d58a', fin: '#a8681e', h: 0.4, scales: true, whisker: true },
  me: { body: '#a7b4bd', belly: '#e3e9ec', fin: '#7d8a93', h: 0.42, bighead: true },
  tram: { body: '#6f7a3d', belly: '#c8c58f', fin: '#525b28', h: 0.3, scales: true },
  loc: { body: '#3d4a3a', belly: '#b9b58c', fin: '#2b3428', h: 0.26, stripes: '#22291f' },
  tre: { body: '#4b4f55', belly: '#a2a6ab', fin: '#35383c', h: 0.26, whisker: true, long: true },
  luon: { body: '#7a5a22', belly: '#d9b04a', fin: '#5a4016', h: 0.12, eel: true },
  chepvang: { body: '#ffb300', belly: '#fff176', fin: '#ff6f00', h: 0.4, scales: true, whisker: true, glow: '#ffe082' },
  trekhong: { body: '#3a3f47', belly: '#8d939b', fin: '#272a30', h: 0.3, whisker: true, long: true, glow: '#b3e5fc' },
};

export function drawFish(c, kind, x, y, len, angle = 0, t = 0) {
  const a = FISH_ART[kind] || FISH_ART.ro;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  const h = len * a.h;
  const wig = Math.sin(t * 0.03) * 0.25;
  if (a.glow) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(0, 0, len * 0.1, 0, 0, len * 0.9);
    g.addColorStop(0, `${a.glow}aa`);
    g.addColorStop(1, `${a.glow}00`);
    c.fillStyle = g;
    c.fillRect(-len, -len, len * 2, len * 2);
    c.restore();
  }
  if (a.eel) {
    c.strokeStyle = a.body;
    c.lineWidth = h;
    c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i <= 12; i++) {
      const px = len / 2 - (i / 12) * len;
      const py = Math.sin(i * 0.8 + t * 0.02) * h * 1.2;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.stroke();
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(len / 2 - h * 0.5, -h * 0.15, h * 0.18, 0, TAU);
    c.fill();
    c.restore();
    return;
  }
  // đuôi
  c.fillStyle = a.fin;
  c.save();
  c.translate(-len * 0.42, 0);
  c.rotate(wig);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-len * 0.24, -h * 0.65);
  c.quadraticCurveTo(-len * 0.16, 0, -len * 0.24, h * 0.65);
  c.closePath();
  c.fill();
  c.restore();
  // vây lưng
  c.beginPath();
  if (a.spiny) {
    for (let i = 0; i < 6; i++) {
      const px = -len * 0.2 + i * len * 0.08;
      c.moveTo(px, -h * 0.4);
      c.lineTo(px + len * 0.02, -h * 0.75);
      c.lineTo(px + len * 0.07, -h * 0.4);
    }
  } else {
    c.moveTo(-len * 0.2, -h * 0.4);
    c.quadraticCurveTo(-len * 0.02, -h * 0.85, len * 0.12, -h * 0.42);
  }
  c.fill();
  // thân
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, a.body);
  g.addColorStop(0.55, a.body);
  g.addColorStop(1, a.belly);
  c.fillStyle = g;
  c.beginPath();
  if (a.long) c.ellipse(0, 0, len * 0.46, h / 2, 0, 0, TAU);
  else {
    c.moveTo(len * 0.5, 0);
    c.bezierCurveTo(len * 0.35, -h * 0.62, -len * 0.3, -h * 0.55, -len * 0.44, 0);
    c.bezierCurveTo(-len * 0.3, h * 0.55, len * 0.35, h * 0.62, len * 0.5, 0);
  }
  c.fill();
  if (a.scales) {
    c.strokeStyle = 'rgba(90,50,10,0.3)';
    c.lineWidth = Math.max(1, len * 0.012);
    for (let i = 0; i < 6; i++) {
      for (let j = -1; j <= 1; j++) {
        c.beginPath();
        c.arc(-len * 0.25 + i * len * 0.09, j * h * 0.22, len * 0.045, -1.2, 1.2);
        c.stroke();
      }
    }
  }
  if (a.stripes) {
    c.fillStyle = a.stripes;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.ellipse(-len * 0.25 + i * len * 0.12, -h * 0.05, len * 0.04, h * 0.32, 0.3, 0, TAU);
      c.fill();
    }
  }
  if (a.spots) {
    c.fillStyle = a.spots;
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.arc(-len * 0.25 + i * len * 0.1, ((i % 2) - 0.5) * h * 0.3, len * 0.025, 0, TAU);
      c.fill();
    }
  }
  // vây bụng
  c.fillStyle = a.fin;
  c.beginPath();
  c.moveTo(len * 0.1, h * 0.3);
  c.lineTo(-len * 0.02, h * 0.62);
  c.lineTo(-len * 0.08, h * 0.32);
  c.fill();
  // mang
  c.strokeStyle = 'rgba(0,0,0,0.25)';
  c.lineWidth = Math.max(1, len * 0.015);
  c.beginPath();
  c.arc(len * 0.22, 0, h * 0.42, -1.1, 1.1);
  c.stroke();
  // mắt
  const ex = len * (a.bighead ? 0.33 : 0.36);
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(ex, -h * 0.12, Math.max(2, h * 0.14), 0, TAU);
  c.fill();
  c.fillStyle = '#111';
  c.beginPath();
  c.arc(ex + h * 0.03, -h * 0.12, Math.max(1.2, h * 0.08), 0, TAU);
  c.fill();
  if (a.whisker) {
    c.strokeStyle = a.fin;
    c.lineWidth = Math.max(1, len * 0.015);
    c.beginPath();
    c.moveTo(len * 0.48, h * 0.05);
    c.quadraticCurveTo(len * 0.6, h * 0.3, len * 0.58, h * 0.6);
    c.moveTo(len * 0.47, h * 0.1);
    c.quadraticCurveTo(len * 0.52, h * 0.5, len * 0.44, h * 0.7);
    c.stroke();
  }
  c.restore();
}

// rác vớt được
export function drawJunk(c, kind, x, y, size, angle = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  const s = size / 60;
  c.scale(s, s);
  if (kind === 'dep') {
    c.fillStyle = '#29b6f6';
    roundRectPath(c, -30, -11, 60, 22, 11);
    c.fill();
    c.strokeStyle = '#e53935';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(12, -10);
    c.lineTo(-4, 0);
    c.lineTo(12, 10);
    c.stroke();
  } else if (kind === 'ung') {
    c.fillStyle = '#2e7d32';
    c.fillRect(-12, -30, 22, 42);
    roundRectPath(c, -12, 4, 42, 18, 8);
    c.fill();
    c.fillStyle = '#1b5e20';
    c.fillRect(-12, 16, 42, 6);
  } else {
    c.fillStyle = 'rgba(160,220,200,0.85)';
    roundRectPath(c, -26, -10, 44, 20, 8);
    c.fill();
    c.fillRect(16, -5, 14, 10);
    c.fillStyle = '#1e88e5';
    c.fillRect(28, -6, 6, 12);
  }
  c.restore();
}

// ------------------------------------------------------------------ thuyền thúng
export function drawBasketBoat(c, x, y, s, t, rower) {
  c.save();
  c.translate(x, y + Math.sin(t * 0.004) * 3);
  c.scale(s, s);
  c.fillStyle = 'rgba(0,20,30,0.3)';
  c.beginPath();
  c.ellipse(0, 20, 70, 14, 0, 0, TAU);
  c.fill();
  // lòng thúng
  c.fillStyle = '#5d4a2a';
  c.beginPath();
  c.ellipse(0, -2, 64, 20, 0, 0, TAU);
  c.fill();
  // thân thúng đan tre
  c.fillStyle = '#a07c3c';
  c.beginPath();
  c.ellipse(0, 0, 64, 20, 0, 0, Math.PI);
  c.lineTo(-58, 18);
  c.quadraticCurveTo(0, 46, 58, 18);
  c.fill();
  c.strokeStyle = 'rgba(70,45,15,0.6)';
  c.lineWidth = 1.5;
  for (let i = -5; i <= 5; i++) {
    c.beginPath();
    c.moveTo(i * 11, 4);
    c.lineTo(i * 10, 32 - Math.abs(i) * 2);
    c.stroke();
  }
  c.strokeStyle = '#6d4c22';
  c.lineWidth = 5;
  c.beginPath();
  c.ellipse(0, 0, 64, 20, 0, 0, Math.PI);
  c.stroke();
  c.restore();
  if (rower) rower(x, y - 6 * s);
}

// ------------------------------------------------------------------ thuyền rồng (phần thưởng mục tiêu chung)
export function drawDragonBoat(c, x, y, t) {
  c.save();
  c.translate(x, y);
  c.fillStyle = 'rgba(0,20,30,0.3)';
  c.beginPath();
  c.ellipse(0, 26, 260, 18, 0, 0, TAU);
  c.fill();
  // thân
  c.fillStyle = '#c62828';
  c.beginPath();
  c.moveTo(-240, -4);
  c.quadraticCurveTo(0, 50, 220, -4);
  c.lineTo(-240, -4);
  c.fill();
  c.fillStyle = '#ffd54f';
  c.fillRect(-230, -8, 450, 8);
  for (let i = 0; i < 8; i++) {
    c.fillStyle = i % 2 ? '#2e7d32' : '#ffd54f';
    c.beginPath();
    c.arc(-180 + i * 50, 10, 7, 0, TAU);
    c.fill();
  }
  // đầu rồng
  c.fillStyle = '#c62828';
  c.beginPath();
  c.moveTo(210, -2);
  c.quadraticCurveTo(250, -70, 280, -90);
  c.quadraticCurveTo(300, -80, 296, -60);
  c.quadraticCurveTo(270, -40, 236, 0);
  c.fill();
  c.fillStyle = '#ffd54f';
  c.beginPath();
  c.moveTo(280, -90);
  c.lineTo(262, -118);
  c.lineTo(290, -96);
  c.lineTo(300, -120);
  c.lineTo(298, -82);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(286, -76, 5, 0, TAU);
  c.fill();
  c.fillStyle = '#000';
  c.beginPath();
  c.arc(287, -76, 2.5, 0, TAU);
  c.fill();
  // đuôi rồng
  c.fillStyle = '#c62828';
  c.beginPath();
  c.moveTo(-236, -2);
  c.quadraticCurveTo(-270, -40, -250, -70);
  c.quadraticCurveTo(-240, -40, -214, -4);
  c.fill();
  // người chèo
  for (let i = 0; i < 7; i++) {
    const px = -170 + i * 55;
    const ph = Math.sin(t * 0.012 + i * 0.6);
    c.fillStyle = i % 2 ? '#fdd835' : '#fff';
    roundRectPath(c, px - 8, -40, 16, 30, 6);
    c.fill();
    c.fillStyle = '#f0c49a';
    c.beginPath();
    c.arc(px, -48, 9, 0, TAU);
    c.fill();
    c.fillStyle = '#c62828';
    c.fillRect(px - 9, -58, 18, 5);
    c.strokeStyle = '#6d4c41';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(px, -28);
    c.lineTo(px - 24 + ph * 18, 30);
    c.stroke();
  }
  // trống
  c.fillStyle = '#8d6e63';
  c.beginPath();
  c.ellipse(170, -20, 16, 20, 0, 0, TAU);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------ thủy quái (cá trê khổng lồ nửa rồng)
// rise 0..1 trồi lên, hurt 0..1 nháy đỏ, pull: lắc lư khi bị kéo
export function drawMonster(c, x, y, rise, t, hurt = 0, pull = 0) {
  if (rise <= 0) return;
  c.save();
  c.translate(x + Math.sin(t * 0.004) * 10 + pull * Math.sin(t * 0.05) * 8, y + (1 - rise) * 260);
  // nước xoáy quanh
  c.strokeStyle = 'rgba(220,240,255,0.5)';
  c.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const r = 140 + i * 40 + ((t * 0.05) % 40);
    c.beginPath();
    c.ellipse(0, 120, r, r * 0.22, 0, 0, TAU);
    c.stroke();
  }
  // cổ / thân
  const body = hurt > 0 ? mixHex('#2f4f3a', '#d32f2f', hurt) : '#2f4f3a';
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-120, 130);
  c.quadraticCurveTo(-140, -20, -60, -120);
  c.quadraticCurveTo(0, -170, 70, -120);
  c.quadraticCurveTo(150, -20, 120, 130);
  c.closePath();
  c.fill();
  // vây lưng gai
  c.fillStyle = '#1e3326';
  for (let i = 0; i < 6; i++) {
    const a = -2.6 + i * 0.32;
    const px = Math.cos(a) * 120;
    const py = Math.sin(a) * 120 - 40;
    c.beginPath();
    c.moveTo(px - 14, py + 8);
    c.lineTo(px * 1.2, py * 1.2 - 20);
    c.lineTo(px + 14, py + 8);
    c.fill();
  }
  // bụng sáng
  c.fillStyle = '#8fae7a';
  c.beginPath();
  c.ellipse(0, 40, 70, 80, 0, 0, TAU);
  c.fill();
  // miệng
  const open = 0.5 + 0.5 * Math.sin(t * 0.006);
  c.fillStyle = '#3b0d0d';
  c.beginPath();
  c.ellipse(0, -20, 70, 12 + open * 26, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#fff';
  for (let i = -3; i <= 3; i++) {
    c.beginPath();
    c.moveTo(i * 18 - 7, -26 - open * 18);
    c.lineTo(i * 18, -10 - open * 10);
    c.lineTo(i * 18 + 7, -26 - open * 18);
    c.fill();
  }
  // râu dài
  c.strokeStyle = '#1e3326';
  c.lineWidth = 7;
  c.lineCap = 'round';
  for (const sd of [-1, 1]) {
    c.beginPath();
    c.moveTo(sd * 60, -30);
    c.bezierCurveTo(sd * 150, -40 + Math.sin(t * 0.004) * 20, sd * 190, 30, sd * 230, 10 + Math.sin(t * 0.005 + sd) * 30);
    c.stroke();
  }
  // mắt phát sáng
  for (const sd of [-1, 1]) {
    c.fillStyle = '#ffeb3b';
    c.beginPath();
    c.ellipse(sd * 46, -84, 20, 15, sd * 0.3, 0, TAU);
    c.fill();
    c.fillStyle = '#b71c1c';
    c.beginPath();
    c.ellipse(sd * 46, -84, 5, 12, 0, 0, TAU);
    c.fill();
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(sd * 46, -84, 2, sd * 46, -84, 50);
    g.addColorStop(0, 'rgba(255,235,59,0.5)');
    g.addColorStop(1, 'rgba(255,235,59,0)');
    c.fillStyle = g;
    c.fillRect(sd * 46 - 50, -134, 100, 100);
    c.restore();
  }
  c.restore();
}

export { mixHex, lerp };
