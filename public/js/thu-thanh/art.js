// Nhân vật Thủ thành Cổ Loa vẽ bằng code, kiểu chibi có viền.
// Lính nỏ có 10 cấp trang bị, yêu quái dân gian (Mộc tinh, Ngư tinh, Hồ tinh, Đá tinh), boss, Thánh Gióng, Rùa Vàng.
const TAU = Math.PI * 2;
const INK = '#2a1d14';
const SKIN = [['#ffe0c2', '#f2b98e'], ['#f8d1ad', '#e2a676'], ['#efc39b', '#d39463'], ['#ffe6cf', '#f0c09a']];
const HAIR = ['#2b1a12', '#1d1410', '#3a2618', '#24170f'];

function outline(ctx, w = 2.4) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.lineJoin = 'round';
  ctx.stroke();
}
function circle(ctx, x, y, r, fill, w = 2.2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (w) outline(ctx, w);
}
function ell(ctx, x, y, rx, ry, fill, w = 2.2, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (w) outline(ctx, w);
}

// Trang bị theo cấp (1..10)
export const GEAR = [
  null,
  { name: 'Nỏ tre', bow: '#d9b779', head: 'band', tunic: '#5b7d4a' },
  { name: 'Nỏ gỗ + nón lá', bow: '#8d5a2b', head: 'nonla', tunic: '#5b7d4a' },
  { name: 'Áo giáp da', bow: '#8d5a2b', head: 'nonla', tunic: '#5b7d4a', vest: '#6d4325' },
  { name: 'Nỏ đồng', bow: '#c98f3a', head: 'nonla', tunic: '#4f6f8f', vest: '#6d4325' },
  { name: 'Mũ đồng + khiên mây', bow: '#c98f3a', head: 'helm', tunic: '#4f6f8f', vest: '#6d4325', shield: true },
  { name: 'Tên lửa', bow: '#c98f3a', head: 'helm', tunic: '#8f3f3f', vest: '#6d4325', shield: true, fire: true },
  { name: 'Nỏ liên châu', bow: '#b5462f', head: 'helm', tunic: '#8f3f3f', vest: '#6d4325', shield: true, fire: true, triple: true },
  { name: 'Giáp đồng + áo choàng', bow: '#b5462f', head: 'helm', tunic: '#8f3f3f', armor: true, cape: '#c62828', shield: true, fire: true, triple: true },
  { name: 'Nỏ vàng', bow: '#f2c230', head: 'helm', tunic: '#8f3f3f', armor: true, cape: '#c62828', shield: true, fire: true, triple: true, gold: true },
  { name: 'Nỏ thần', bow: '#ffe066', head: 'gold', tunic: '#7b1fa2', armor: true, cape: '#d32f2f', shield: true, fire: true, triple: true, gold: true, aura: true },
];

// lính nỏ đứng trên tường. x,y = chân. o: { level, look, aim (rad, 0 = thẳng lên), shotT, general, hurtT, filler }
export function drawArcher(ctx, x, y, s, o, t) {
  const lv = Math.max(1, Math.min(10, o.level || 1));
  const g = GEAR[lv];
  const look = o.look || 0;
  const [skin, skinD] = SKIN[look % SKIN.length];
  const hair = HAIR[look % HAIR.length];
  const bob = Math.sin(t * 3 + look) * 1.2;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (g.aura) {
    const a = 0.45 + Math.sin(t * 4) * 0.15;
    const ag = ctx.createRadialGradient(0, -34, 6, 0, -34, 52);
    ag.addColorStop(0, `rgba(255,230,120,${a})`);
    ag.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = ag;
    ctx.fillRect(-56, -90, 112, 100);
  }
  // bóng
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 5, 0, 0, TAU);
  ctx.fill();
  ctx.translate(0, bob);
  // áo choàng
  if (g.cape) {
    ctx.beginPath();
    ctx.moveTo(-11, -30);
    ctx.quadraticCurveTo(-18 + Math.sin(t * 3) * 2, -8, -15, -2);
    ctx.lineTo(15, -2);
    ctx.quadraticCurveTo(18, -8, 11, -30);
    ctx.closePath();
    ctx.fillStyle = g.cape;
    ctx.fill();
    outline(ctx, 2);
  }
  // khiên mây đeo lưng
  if (g.shield) {
    circle(ctx, 13, -22, 10, '#c9a061', 2);
    ctx.strokeStyle = 'rgba(90,60,20,0.7)';
    ctx.lineWidth = 1.2;
    for (const r of [4, 7]) {
      ctx.beginPath();
      ctx.arc(13, -22, r, 0, TAU);
      ctx.stroke();
    }
  }
  // chân
  ctx.fillStyle = '#3e2c1f';
  ctx.fillRect(-8, -10, 6, 10);
  ctx.fillRect(2, -10, 6, 10);
  // thân
  ctx.beginPath();
  ctx.moveTo(-12, -9);
  ctx.quadraticCurveTo(-13, -30, -9, -33);
  ctx.lineTo(9, -33);
  ctx.quadraticCurveTo(13, -30, 12, -9);
  ctx.closePath();
  ctx.fillStyle = g.tunic;
  ctx.fill();
  outline(ctx, 2.2);
  if (g.vest && !g.armor) {
    ctx.fillStyle = g.vest;
    ctx.fillRect(-8, -31, 16, 18);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -31, 16, 18);
  }
  if (g.armor) {
    ctx.fillStyle = g.gold ? '#e8b839' : '#c98f3a';
    ctx.beginPath();
    ctx.moveTo(-10, -32);
    ctx.lineTo(10, -32);
    ctx.lineTo(9, -14);
    ctx.lineTo(-9, -14);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.8);
    ctx.strokeStyle = 'rgba(90,50,10,0.6)';
    ctx.lineWidth = 1.2;
    for (let k = -27; k < -15; k += 4) {
      ctx.beginPath();
      ctx.moveTo(-8, k);
      ctx.lineTo(8, k);
      ctx.stroke();
    }
  }
  // thắt lưng
  ctx.fillStyle = '#c62828';
  ctx.fillRect(-11, -13, 22, 4);
  // đầu
  const hy = -46;
  circle(ctx, 0, hy, 15, skin, 2.4);
  ctx.fillStyle = skinD;
  ctx.beginPath();
  ctx.arc(0, hy + 2, 13, 0.2, Math.PI - 0.2);
  ctx.fill();
  // tóc
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(0, hy - 2, 15, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  // mắt
  const blink = Math.sin(t * 1.3 + look * 2) > 0.97;
  ctx.fillStyle = INK;
  if (blink) {
    ctx.fillRect(-7, hy + 1, 5, 1.6);
    ctx.fillRect(2, hy + 1, 5, 1.6);
  } else {
    circle(ctx, -4.5, hy + 1, 2.3, INK, 0);
    circle(ctx, 4.5, hy + 1, 2.3, INK, 0);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-5.2, hy - 0.4, 1.2, 1.2);
    ctx.fillRect(3.8, hy - 0.4, 1.2, 1.2);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (o.hurtT && t - o.hurtT < 0.5) ctx.arc(0, hy + 9, 2.5, Math.PI, 0);
  else ctx.arc(0, hy + 6, 3, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,120,0.45)';
  ctx.beginPath();
  ctx.arc(-8, hy + 5, 2.6, 0, TAU);
  ctx.arc(8, hy + 5, 2.6, 0, TAU);
  ctx.fill();
  // mũ theo cấp
  if (g.head === 'band') {
    ctx.fillStyle = '#c62828';
    ctx.fillRect(-15, hy - 9, 30, 5);
    ctx.beginPath();
    ctx.moveTo(13, hy - 8);
    ctx.lineTo(20, hy - 2 + Math.sin(t * 5) * 2);
    ctx.lineTo(17, hy - 10);
    ctx.fill();
  } else if (g.head === 'nonla') {
    ctx.beginPath();
    ctx.moveTo(-22, hy - 6);
    ctx.lineTo(0, hy - 26);
    ctx.lineTo(22, hy - 6);
    ctx.quadraticCurveTo(0, hy - 2, -22, hy - 6);
    ctx.fillStyle = '#e9d69a';
    ctx.fill();
    outline(ctx, 2);
    ctx.strokeStyle = 'rgba(140,110,50,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-11, hy - 10);
    ctx.lineTo(11, hy - 10);
    ctx.moveTo(-17, hy - 7);
    ctx.lineTo(17, hy - 7);
    ctx.stroke();
  } else {
    const gold = g.head === 'gold';
    ctx.beginPath();
    ctx.arc(0, hy - 4, 16, Math.PI, 0);
    ctx.lineTo(16, hy - 2);
    ctx.lineTo(-16, hy - 2);
    ctx.closePath();
    ctx.fillStyle = gold ? '#f6c937' : '#c98f3a';
    ctx.fill();
    outline(ctx, 2);
    ctx.fillStyle = gold ? '#fff2a8' : '#e8b860';
    ctx.fillRect(-16, hy - 5, 32, 3);
    // chỏm tua
    ctx.beginPath();
    ctx.moveTo(0, hy - 19);
    ctx.quadraticCurveTo(gold ? 10 : 6, hy - 34 + Math.sin(t * 5) * 2, gold ? 14 : 8, hy - 28);
    ctx.lineWidth = gold ? 6 : 4;
    ctx.strokeStyle = '#e53935';
    ctx.stroke();
  }
  // vương miện tướng (follow)
  if (o.general) {
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.moveTo(-9, hy - 22);
    ctx.lineTo(-9, hy - 32);
    ctx.lineTo(-4, hy - 26);
    ctx.lineTo(0, hy - 35);
    ctx.lineTo(4, hy - 26);
    ctx.lineTo(9, hy - 32);
    ctx.lineTo(9, hy - 22);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.6);
  }
  // nỏ giơ lên, xoay theo hướng bắn
  const recoil = o.shotT ? Math.max(0, 1 - (t - o.shotT) * 6) : 0;
  ctx.save();
  ctx.translate(0, -26 + recoil * 3);
  ctx.rotate(o.aim || 0);
  // tay
  ctx.fillStyle = skin;
  circle(ctx, -7, -6, 4, skin, 1.6);
  circle(ctx, 7, -6, 4, skin, 1.6);
  // thân nỏ
  ctx.fillStyle = g.bow;
  ctx.fillRect(-3, -30, 6, 26);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(-3, -30, 6, 26);
  // cánh nỏ
  const wing = g.triple ? 22 : 17;
  ctx.beginPath();
  ctx.moveTo(-wing, -20);
  ctx.quadraticCurveTo(0, -36, wing, -20);
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = g.bow;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-wing, -20);
  ctx.lineTo(0, -16 + recoil * -4);
  ctx.lineTo(wing, -20);
  ctx.stroke();
  // mũi tên
  const bolts = g.triple ? [-6, 0, 6] : [0];
  if (recoil < 0.5) {
    for (const bx of bolts) {
      ctx.strokeStyle = '#5d4030';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, -16);
      ctx.lineTo(bx, -40);
      ctx.stroke();
      if (g.fire) {
        const fl = 4 + Math.sin(t * 20 + bx) * 1.5;
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.ellipse(bx, -43, 3, fl, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.ellipse(bx, -42, 1.5, fl * 0.5, 0, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = '#cfd8dc';
        ctx.beginPath();
        ctx.moveTo(bx - 3, -40);
        ctx.lineTo(bx, -46);
        ctx.lineTo(bx + 3, -40);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  ctx.restore();
}

// ------------------------------------------------------------------ yêu quái
// kind: moc | ngu | ho | da. s = tỉ lệ. hurt = 0..1 nháy trắng. boss = có vương miện, tails = số đuôi cáo
export function drawMonster(ctx, kind, x, y, s, t, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const walk = Math.sin(t * 7 + (o.seed || 0)) * 3;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 7, 0, 0, TAU);
  ctx.fill();
  if (o.boss) {
    const ag = ctx.createRadialGradient(0, -34, 8, 0, -34, 70);
    ag.addColorStop(0, 'rgba(180,40,255,0.35)');
    ag.addColorStop(1, 'rgba(180,40,255,0)');
    ctx.fillStyle = ag;
    ctx.fillRect(-70, -110, 140, 120);
  }
  if (kind === 'moc') drawMoc(ctx, t, walk);
  else if (kind === 'ngu') drawNgu(ctx, t, walk);
  else if (kind === 'ho') drawHo(ctx, t, walk, o.tails || 1);
  else drawDa(ctx, t, walk);
  if (o.burnT && o.burnT > t) {
    for (let i = 0; i < 3; i++) {
      const fx = -10 + i * 10;
      const fy = -30 - ((t * 60 + i * 13) % 26);
      ctx.fillStyle = 'rgba(255,152,0,0.85)';
      ctx.beginPath();
      ctx.ellipse(fx, fy, 4, 7, 0, 0, TAU);
      ctx.fill();
    }
  }
  if (o.hurt > 0) {
    // nháy sáng khi trúng tên (không dùng ctx.filter vì rất nặng máy)
    ctx.globalAlpha = o.hurt * 0.55;
    ctx.fillStyle = '#fffde7';
    ctx.beginPath();
    ctx.ellipse(0, -32, 22, 30, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (o.boss) {
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    const cy = kind === 'da' ? -66 : kind === 'moc' ? -78 : -64;
    ctx.moveTo(-14, cy);
    ctx.lineTo(-14, cy - 14);
    ctx.lineTo(-6, cy - 6);
    ctx.lineTo(0, cy - 18);
    ctx.lineTo(6, cy - 6);
    ctx.lineTo(14, cy - 14);
    ctx.lineTo(14, cy);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 2);
  }
  ctx.restore();
}

function eyes(ctx, y, gap, color = '#ff3d00') {
  // mắt phát sáng (vẽ quầng mờ thay cho shadowBlur để nhẹ máy)
  for (const s of [-1, 1]) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(s * gap, y, 7, 5.5, s * 0.3, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(s * gap, y, 4, 3, s * 0.3, 0, TAU);
    ctx.fill();
  }
}

function drawMoc(ctx, t, walk) {
  // rễ chân
  ctx.strokeStyle = '#4e3420';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -10);
  ctx.lineTo(-16, 0 + walk * 0.5);
  ctx.moveTo(8, -10);
  ctx.lineTo(16, 0 - walk * 0.5);
  ctx.stroke();
  // thân cây
  ctx.beginPath();
  ctx.moveTo(-14, -8);
  ctx.quadraticCurveTo(-18, -40, -10, -52);
  ctx.lineTo(10, -52);
  ctx.quadraticCurveTo(18, -40, 14, -8);
  ctx.closePath();
  ctx.fillStyle = '#6d4c2f';
  ctx.fill();
  outline(ctx, 2.4);
  ctx.strokeStyle = 'rgba(40,25,10,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, -14);
  ctx.lineTo(-4, -40);
  ctx.moveTo(6, -12);
  ctx.lineTo(5, -36);
  ctx.stroke();
  // tay cành
  ctx.strokeStyle = '#4e3420';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-12, -36);
  ctx.lineTo(-26, -44 + walk);
  ctx.lineTo(-30, -52 + walk);
  ctx.moveTo(12, -36);
  ctx.lineTo(26, -44 - walk);
  ctx.lineTo(31, -50 - walk);
  ctx.stroke();
  // tán lá
  ctx.fillStyle = '#2e6b34';
  ctx.beginPath();
  ctx.arc(0, -62, 20, 0, TAU);
  ctx.arc(-16, -54, 13, 0, TAU);
  ctx.arc(16, -54, 13, 0, TAU);
  ctx.fill();
  outline(ctx, 2.2);
  ctx.fillStyle = '#1b2e14';
  ctx.beginPath();
  ctx.ellipse(0, -32, 7, 4, 0, 0, TAU);
  ctx.fill();
  eyes(ctx, -42, 6, '#c6ff00');
}

function drawNgu(ctx, t, walk) {
  // vây chân
  ctx.fillStyle = '#1e88a8';
  ctx.beginPath();
  ctx.ellipse(-9, -3, 8, 4, -0.3 + walk * 0.05, 0, TAU);
  ctx.ellipse(9, -3, 8, 4, 0.3 - walk * 0.05, 0, TAU);
  ctx.fill();
  outline(ctx, 1.8);
  // thân cá đứng
  ell(ctx, 0, -28, 17, 25, '#3fb0d0', 2.4);
  ctx.fillStyle = '#bdf0ff';
  ctx.beginPath();
  ctx.ellipse(0, -22, 10, 16, 0, 0, TAU);
  ctx.fill();
  // vảy
  ctx.strokeStyle = 'rgba(20,90,120,0.55)';
  ctx.lineWidth = 1.2;
  for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) {
    ctx.beginPath();
    ctx.arc(c * 8, -38 + r * 8, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // vây lưng
  ctx.fillStyle = '#ef6c00';
  ctx.beginPath();
  ctx.moveTo(-6, -52);
  ctx.lineTo(0, -64 + walk * 0.4);
  ctx.lineTo(8, -50);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.8);
  // vây tay
  ctx.fillStyle = '#ef6c00';
  ctx.beginPath();
  ctx.ellipse(-19, -28, 8, 4, 0.8 + walk * 0.1, 0, TAU);
  ctx.ellipse(19, -28, 8, 4, -0.8 - walk * 0.1, 0, TAU);
  ctx.fill();
  // miệng to
  ctx.fillStyle = '#7a1020';
  ctx.beginPath();
  ctx.ellipse(0, -30, 8, 4 + Math.abs(walk) * 0.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (let k = -6; k <= 6; k += 4) {
    ctx.beginPath();
    ctx.moveTo(k - 1.5, -33);
    ctx.lineTo(k, -30);
    ctx.lineTo(k + 1.5, -33);
    ctx.fill();
  }
  eyes(ctx, -42, 8, '#ffea00');
}

function drawHo(ctx, t, walk, tails) {
  // đuôi (1 hoặc 9)
  const n = Math.max(1, tails);
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? 0.6 : -1.1 + (i / (n - 1)) * 2.2;
    ctx.save();
    ctx.translate(0, -18);
    ctx.rotate(a + Math.sin(t * 3 + i) * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, -26, 8, 24, 0, 0, TAU);
    ctx.fillStyle = '#ef7d22';
    ctx.fill();
    outline(ctx, 2);
    ctx.fillStyle = '#fff3e0';
    ctx.beginPath();
    ctx.ellipse(0, -44, 5, 7, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // chân
  ctx.fillStyle = '#c45a14';
  ctx.fillRect(-9, -12, 6, 12 + walk * 0.3);
  ctx.fillRect(3, -12, 6, 12 - walk * 0.3);
  // thân
  ell(ctx, 0, -24, 13, 16, '#f08a2c', 2.2);
  ctx.fillStyle = '#fff3e0';
  ctx.beginPath();
  ctx.ellipse(0, -21, 7, 10, 0, 0, TAU);
  ctx.fill();
  // đầu cáo
  ctx.beginPath();
  ctx.moveTo(-15, -44);
  ctx.lineTo(-13, -62);
  ctx.lineTo(-5, -50);
  ctx.lineTo(5, -50);
  ctx.lineTo(13, -62);
  ctx.lineTo(15, -44);
  ctx.quadraticCurveTo(10, -32, 0, -30);
  ctx.quadraticCurveTo(-10, -32, -15, -44);
  ctx.closePath();
  ctx.fillStyle = '#f08a2c';
  ctx.fill();
  outline(ctx, 2.2);
  ctx.fillStyle = '#fff3e0';
  ctx.beginPath();
  ctx.moveTo(-8, -38);
  ctx.quadraticCurveTo(0, -28, 8, -38);
  ctx.quadraticCurveTo(0, -34, -8, -38);
  ctx.fill();
  circle(ctx, 0, -34, 2.2, INK, 0);
  eyes(ctx, -44, 6, '#e040fb');
}

function drawDa(ctx, t, walk) {
  ctx.fillStyle = '#6f6a62';
  ell(ctx, -10, -6, 8, 6, '#6f6a62', 2);
  ell(ctx, 10, -6, 8, 6, '#6f6a62', 2);
  ctx.beginPath();
  ctx.moveTo(-22, -12);
  ctx.lineTo(-18, -46);
  ctx.lineTo(-4, -56);
  ctx.lineTo(14, -52);
  ctx.lineTo(22, -30);
  ctx.lineTo(18, -10);
  ctx.closePath();
  ctx.fillStyle = '#8d877c';
  ctx.fill();
  outline(ctx, 2.6);
  ctx.strokeStyle = 'rgba(40,40,40,0.5)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, -20);
  ctx.lineTo(-2, -30);
  ctx.lineTo(8, -24);
  ctx.moveTo(4, -46);
  ctx.lineTo(10, -38);
  ctx.stroke();
  // tay đá
  ell(ctx, -26, -30 + walk, 9, 8, '#7c766c', 2);
  ell(ctx, 26, -30 - walk, 9, 8, '#7c766c', 2);
  // rêu
  ctx.fillStyle = '#6a8f3a';
  ctx.beginPath();
  ctx.ellipse(-6, -52, 10, 4, -0.2, 0, TAU);
  ctx.fill();
  eyes(ctx, -38, 7, '#ff6d00');
}

// ------------------------------------------------------------------ Thánh Gióng cưỡi ngựa sắt (dir = 1 chạy sang phải)
export function drawGiong(ctx, x, y, s, dir, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  // lửa ngựa phun
  for (let i = 0; i < 6; i++) {
    const fx = -60 - i * 16 - ((t * 200) % 16);
    ctx.fillStyle = `rgba(255,${120 + i * 20},0,${0.8 - i * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(fx, -34 + Math.sin(t * 20 + i) * 4, 14 - i, 8 - i * 0.8, 0, 0, TAU);
    ctx.fill();
  }
  const gallop = Math.sin(t * 18);
  // chân ngựa
  ctx.strokeStyle = '#37474f';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, -24);
  ctx.lineTo(-34 + gallop * 10, 0);
  ctx.moveTo(-14, -24);
  ctx.lineTo(-10 - gallop * 10, 0);
  ctx.moveTo(18, -24);
  ctx.lineTo(26 + gallop * 10, 0);
  ctx.moveTo(30, -24);
  ctx.lineTo(36 - gallop * 10, 0);
  ctx.stroke();
  // thân ngựa sắt
  ell(ctx, 2, -36, 42, 18, '#546e7a', 2.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -44);
  ctx.lineTo(30, -44);
  ctx.stroke();
  // cổ + đầu
  ctx.beginPath();
  ctx.moveTo(30, -46);
  ctx.lineTo(52, -74);
  ctx.lineTo(66, -70);
  ctx.lineTo(62, -60);
  ctx.lineTo(44, -40);
  ctx.closePath();
  ctx.fillStyle = '#546e7a';
  ctx.fill();
  outline(ctx, 2.4);
  ctx.fillStyle = '#ff5722';
  ctx.beginPath();
  ctx.arc(58, -70, 3, 0, TAU);
  ctx.fill();
  // bờm lửa
  ctx.fillStyle = '#ff9800';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(36 + i * 6, -62 + i * -3, 4, 9 + Math.sin(t * 25 + i) * 3, -0.6, 0, TAU);
    ctx.fill();
  }
  // người cưỡi
  ell(ctx, -2, -66, 11, 15, '#c62828', 2.2);
  circle(ctx, -2, -90, 12, '#ffe0c2', 2.2);
  ctx.fillStyle = '#1d1410';
  ctx.beginPath();
  ctx.arc(-2, -93, 12, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  circle(ctx, 2, -90, 1.8, INK, 0);
  // áo giáp sắt
  ctx.fillStyle = '#90a4ae';
  ctx.fillRect(-10, -74, 16, 10);
  // gậy tre (bụi tre quật)
  ctx.save();
  ctx.translate(6, -76);
  ctx.rotate(-0.9 + Math.sin(t * 9) * 0.5);
  ctx.fillStyle = '#7cb342';
  ctx.fillRect(-3, -64, 6, 70);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(-3, -64, 6, 70);
  ctx.fillStyle = '#558b2f';
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.ellipse(6, -60 + k * 10, 8, 3, 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

// Rùa Vàng nổi lên, k = 0..1 độ hiện
export function drawKimQuy(ctx, x, y, s, t, k = 1) {
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(x, y);
  ctx.scale(s, s);
  const glow = ctx.createRadialGradient(0, -40, 10, 0, -40, 180);
  glow.addColorStop(0, 'rgba(255,240,150,0.85)');
  glow.addColorStop(1, 'rgba(255,220,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-180, -220, 360, 360);
  // chân
  for (const [fx, fy] of [[-62, -6], [62, -6], [-50, -50], [50, -50]]) ell(ctx, fx, fy, 16, 10, '#c9a227', 2.4);
  // đầu
  ell(ctx, 0, -100, 22, 26, '#d8b430', 2.6);
  circle(ctx, -8, -106, 3.5, INK, 0);
  circle(ctx, 8, -106, 3.5, INK, 0);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -96, 6, 0.3, Math.PI - 0.3);
  ctx.stroke();
  // mai
  ell(ctx, 0, -32, 70, 50, '#f2c230', 3);
  ctx.strokeStyle = '#a07a12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const px = Math.cos(a) * 24;
    const py = -32 + Math.sin(a) * 17;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
    ctx.moveTo(px, py);
    ctx.lineTo(Math.cos(a) * 60, -32 + Math.sin(a) * 42);
    ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * TAU;
    const px = Math.cos(a) * 24;
    const py = -32 + Math.sin(a) * 17;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // vuốt thần (móng rùa làm lẫy nỏ) lấp lánh
  ctx.fillStyle = `rgba(255,255,255,${0.6 + Math.sin(t * 8) * 0.4})`;
  ctx.beginPath();
  ctx.arc(0, -32, 7, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// dân làng chạy nạn
export function drawVillager(ctx, x, y, s, t, look = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const step = Math.sin(t * 9 + look) * 3;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3e2c1f';
  ctx.fillRect(-6, -10, 4, 10 + step * 0.3);
  ctx.fillRect(2, -10, 4, 10 - step * 0.3);
  ell(ctx, 0, -18, 9, 11, ['#8d6e63', '#a1887f', '#6d4c41'][look % 3], 2);
  circle(ctx, 0, -34, 9, SKIN[look % 4][0], 2);
  ctx.beginPath();
  ctx.moveTo(-14, -36);
  ctx.lineTo(0, -48);
  ctx.lineTo(14, -36);
  ctx.closePath();
  ctx.fillStyle = '#e9d69a';
  ctx.fill();
  outline(ctx, 1.6);
  // gánh
  if (look % 2 === 0) {
    ctx.strokeStyle = '#6d4c2f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, -26);
    ctx.lineTo(18, -26);
    ctx.stroke();
    ell(ctx, -18, -18, 6, 6, '#c9a061', 1.4);
    ell(ctx, 18, -18, 6, 6, '#c9a061', 1.4);
  }
  ctx.restore();
}

// máy bắn đá trên tường (chia sẻ). fireT = lúc vừa bắn
export function drawCatapult(ctx, x, y, s, t, fireT = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#6d4c2f';
  ctx.fillRect(-26, -16, 52, 12);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(-26, -16, 52, 12);
  circle(ctx, -18, -4, 7, '#4e3420', 2);
  circle(ctx, 18, -4, 7, '#4e3420', 2);
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(-4, -40, 8, 26);
  const k = fireT ? Math.min(1, (t - fireT) * 3) : 1;
  const ang = -0.2 - (1 - k) * 1.2 + k * 0.0;
  ctx.save();
  ctx.translate(0, -36);
  ctx.rotate(ang - 0.9);
  ctx.fillStyle = '#8d5a2b';
  ctx.fillRect(-3, -42, 6, 50);
  ctx.strokeRect(-3, -42, 6, 50);
  if (k >= 1) circle(ctx, 0, -44, 7, '#8d877c', 2);
  ctx.restore();
  ctx.restore();
}
