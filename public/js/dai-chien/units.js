// Lính hai phe kiểu chibi có viền, vẽ bằng code.
// Phe Núi (Sơn Tinh): mũ trụ đồng chỏm tua đỏ, giáp đồng trên áo xanh lá, áo choàng xanh, khiên hình núi.
// Phe Nước (Thủy Tinh): mũ bạc vây cá, giáp vảy xanh biển, áo choàng xanh đậm, khiên hình sóng.
const TAU = Math.PI * 2;
export const GENERAL_SCALE = 1.6;
const INK = '#2a1d14';
const SKIN = [['#ffe0c2', '#f2b98e'], ['#f8d1ad', '#e2a676'], ['#efc39b', '#d39463'], ['#ffe6cf', '#f0c09a']];
const HAIR = ['#2b1a12', '#1d1410', '#3a2618', '#24170f'];

const PAL = [
  { tunic: '#3fa34d', armor: '#e2ad4a', armorD: '#a8731f', cape: '#2e7d32', helm: '#e2ad4a', helmD: '#9c6a1c', plume: '#e53935', trim: '#ffe082', pants: '#5d4030', shield: '#c9963a', emblem: '#1b5e20' },
  { tunic: '#2f8de4', armor: '#d6e8f5', armorD: '#86a8c4', cape: '#1565c0', helm: '#dbe9f4', helmD: '#86a8c4', plume: '#26c6da', trim: '#7cf7ff', pants: '#283d5c', shield: '#a8cdea', emblem: '#0d47a1' },
];

function outline(ctx, w = 2.4) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.lineJoin = 'round';
  ctx.stroke();
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function steel(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#a9b8c6');
  return g;
}

function drawWeapon(ctx, o, c, swing, t) {
  const nui = o.team === 0;
  if (o.white) {
    ctx.strokeStyle = '#6d4c2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, -44);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.lineTo(26, -38 + Math.sin(t * 8) * 3);
    ctx.lineTo(0, -28);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.6);
    return;
  }
  if (o.weapon === 'bow') {
    ctx.beginPath();
    ctx.arc(-4, 0, 26, -1.25, 1.25);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = nui ? '#8d5a2b' : '#4f86b8';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    const pull = swing * 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-4 + 26 * Math.cos(-1.25), 26 * Math.sin(-1.25));
    ctx.lineTo(-10 - pull, 0);
    ctx.lineTo(-4 + 26 * Math.cos(1.25), 26 * Math.sin(1.25));
    ctx.stroke();
    if (swing < 0.6) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-12 - pull, 0);
      ctx.lineTo(28, 0);
      ctx.stroke();
      ctx.strokeStyle = '#e8d3a8';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#dfe5ea';
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(26, -4);
      ctx.lineTo(26, 4);
      ctx.closePath();
      ctx.fill();
      outline(ctx, 1.2);
      ctx.fillStyle = c.plume;
      ctx.fillRect(-14 - pull, -3, 6, 6);
    }
    return;
  }
  if (o.weapon === 'sword') {
    ctx.fillStyle = '#5b3a1e';
    rrect(ctx, -4, -4, 10, 8, 2);
    ctx.fill();
    outline(ctx, 1.5);
    ctx.fillStyle = c.trim;
    rrect(ctx, 5, -9, 5, 18, 2);
    ctx.fill();
    outline(ctx, 1.5);
    ctx.fillStyle = steel(ctx, -5, 5);
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(44, -3);
    ctx.lineTo(52, 0);
    ctx.lineTo(44, 4);
    ctx.lineTo(10, 4);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.6);
    if (swing > 0.2) {
      ctx.strokeStyle = `rgba(255,255,255,${swing * 0.7})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 50, -1.2, 0.6);
      ctx.stroke();
    }
    return;
  }
  // giáo (Núi) / đinh ba (Nước)
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(48, 0);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = nui ? '#9a6a3a' : '#d9c27a';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  if (nui) {
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(44, -2);
    ctx.lineTo(38, 9);
    ctx.lineTo(48, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = steel(ctx, -6, 6);
    ctx.beginPath();
    ctx.moveTo(46, -6);
    ctx.lineTo(66, 0);
    ctx.lineTo(46, 6);
    ctx.quadraticCurveTo(50, 0, 46, -6);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.6);
  } else {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(48, -9);
    ctx.lineTo(48, 9);
    ctx.moveTo(48, -9);
    ctx.lineTo(62, -9);
    ctx.moveTo(48, 0);
    ctx.lineTo(66, 0);
    ctx.moveTo(48, 9);
    ctx.lineTo(62, 9);
    ctx.stroke();
    ctx.strokeStyle = '#e8f4ff';
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }
}

function drawShield(ctx, c, team) {
  const g = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, c.shield);
  g.addColorStop(1, team === 0 ? '#7a5520' : '#5f87a8');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, TAU);
  ctx.fill();
  outline(ctx, 2.2);
  ctx.strokeStyle = c.emblem;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (team === 0) {
    ctx.moveTo(-7, 5);
    ctx.lineTo(-2, -5);
    ctx.lineTo(1, 0);
    ctx.lineTo(4, -3);
    ctx.lineTo(8, 5);
  } else {
    ctx.moveTo(-8, 3);
    ctx.quadraticCurveTo(-3, -7, 4, -3);
    ctx.quadraticCurveTo(1, -1, 4, 3);
  }
  ctx.stroke();
}

// o: { team, dir, weapon, walk, atk (0..1), hurt, general, mini, shield, dead (0..1), cheer, white, skin, healGlow, buff, onWater }
export function drawSoldier(ctx, x, y, s, o, t) {
  const team = o.team;
  const c = PAL[team];
  const dir = o.dir || 1;
  const sc = s * (o.mini ? 0.78 : o.general ? GENERAL_SCALE : 1) * 1.15;
  const skin = SKIN[o.skin || 0];
  ctx.save();
  ctx.translate(x, y);
  // bóng / gợn nước dưới chân
  if (o.onWater) {
    ctx.strokeStyle = 'rgba(230,250,255,0.75)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.8 + i * 0.5) % 1;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath();
      ctx.ellipse(0, 0, (14 + k * 16) * sc, (4 + k * 4) * sc, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 * sc, 5 * sc, 0, 0, TAU);
    ctx.fill();
  }
  if (o.dead) {
    ctx.globalAlpha = Math.max(0, 1 - o.dead * 0.85);
    ctx.rotate(-dir * Math.min(1, o.dead * 2) * 1.35);
  }
  ctx.scale(sc * dir, sc);
  const walk = o.walk || 0;
  const leg = Math.sin(walk) * 5;
  const bob = Math.abs(Math.sin(walk)) * 1.5;
  const jump = o.cheer ? Math.abs(Math.sin(t * 12)) * 7 : 0;
  ctx.translate(0, -bob - jump);
  const hurt = o.hurt > 0;
  const swing = o.atk > 0 ? Math.sin(o.atk * Math.PI) : 0;

  // áo choàng
  if (!o.mini) {
    const flap = Math.sin(t * 5 + (o.skin || 0)) * 3;
    ctx.fillStyle = o.general ? (team === 0 ? '#c62828' : '#6a1b9a') : c.cape;
    ctx.beginPath();
    ctx.moveTo(-4, -44);
    ctx.quadraticCurveTo(-20 - flap, -26, -18 - flap, -6);
    ctx.lineTo(-6, -10);
    ctx.lineTo(4, -42);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 2);
    if (o.general) {
      ctx.strokeStyle = '#ffd54a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18 - flap, -7);
      ctx.lineTo(-7, -11);
      ctx.stroke();
    }
  }
  const hasShield = !o.white && o.weapon !== 'bow';
  // chân
  for (const [lx, ph] of [[-5, 1], [5, -1]]) {
    const off = leg * ph;
    ctx.fillStyle = c.pants;
    rrect(ctx, lx - 4 + off * 0.4, -22, 8, 16, 3);
    ctx.fill();
    outline(ctx, 2);
    ctx.fillStyle = '#3b2a1e';
    rrect(ctx, lx - 5 + off * 0.6, -8, 11, 8, 3);
    ctx.fill();
    outline(ctx, 2);
  }
  // thân áo + giáp ngực
  ctx.fillStyle = hurt ? '#ff8a80' : c.tunic;
  ctx.beginPath();
  ctx.moveTo(-12, -18);
  ctx.quadraticCurveTo(-14, -34, -10, -46);
  ctx.lineTo(10, -46);
  ctx.quadraticCurveTo(14, -34, 12, -18);
  ctx.closePath();
  ctx.fill();
  outline(ctx);
  const ag = ctx.createLinearGradient(-10, -46, 10, -26);
  ag.addColorStop(0, '#ffffff');
  ag.addColorStop(0.2, hurt ? '#ffb3a8' : c.armor);
  ag.addColorStop(1, hurt ? '#e57373' : c.armorD);
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.moveTo(-9, -44);
  ctx.lineTo(9, -44);
  ctx.lineTo(10, -28);
  ctx.quadraticCurveTo(0, -24, -10, -28);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.8);
  if (team === 1) {
    ctx.strokeStyle = 'rgba(40,80,120,0.55)';
    ctx.lineWidth = 1.2;
    for (let r = 0; r < 3; r++) {
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(-5 + k * 5 + (r % 2) * 2.5, -40 + r * 5, 2.6, 0, Math.PI);
        ctx.stroke();
      }
    }
  } else {
    ctx.fillStyle = '#8d5a1a';
    for (const [rx, ry] of [[-5, -40], [5, -40], [-5, -33], [5, -33]]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 1.3, 0, TAU);
      ctx.fill();
    }
  }
  // đai lưng
  ctx.fillStyle = team === 0 ? '#c62828' : '#00acc1';
  rrect(ctx, -12, -24, 24, 5, 2);
  ctx.fill();
  outline(ctx, 1.6);
  ctx.fillStyle = c.trim;
  ctx.fillRect(-2, -24, 4, 5);
  // tay sau cầm khiên
  if (hasShield) {
    ctx.save();
    ctx.translate(-9, -32 + (o.cheer ? -4 : 0));
    drawShield(ctx, c, team);
    ctx.restore();
  }
  // đầu
  ctx.save();
  ctx.translate(1, -60);
  ctx.fillStyle = HAIR[o.skin || 0];
  ctx.beginPath();
  ctx.arc(-3, 2, 17, 0, TAU);
  ctx.fill();
  const fg = ctx.createRadialGradient(4, -2, 4, 2, 2, 18);
  fg.addColorStop(0, skin[0]);
  fg.addColorStop(1, skin[1]);
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.ellipse(2, 2, 15, 15.5, 0, 0, TAU);
  ctx.fill();
  outline(ctx, 2.4);
  ctx.fillStyle = skin[1];
  ctx.beginPath();
  ctx.ellipse(-10, 4, 3.5, 4.5, 0, 0, TAU);
  ctx.fill();
  outline(ctx, 1.6);
  // mắt to long lanh
  const blink = o.dead || Math.sin(t * 0.9 + (o.skin || 0) * 7) > 0.985;
  for (const ex of [3, 11]) {
    if (blink) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      if (o.dead) {
        ctx.moveTo(ex - 2.5, 0);
        ctx.lineTo(ex + 2.5, 5);
        ctx.moveTo(ex + 2.5, 0);
        ctx.lineTo(ex - 2.5, 5);
      } else {
        ctx.moveTo(ex - 3, 3);
        ctx.lineTo(ex + 3, 3);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(ex, 3, 3.2, 4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = team === 0 ? '#3b2412' : '#12304f';
      ctx.beginPath();
      ctx.ellipse(ex + 0.8, 3.6, 2.3, 3.1, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex + 1.6, 2.2, 1, 0, TAU);
      ctx.fill();
    }
  }
  const angry = o.atk > 0 || o.cheer;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, angry ? -3 : -4);
  ctx.lineTo(6, angry ? -1.5 : -4.5);
  ctx.moveTo(9, angry ? -1.5 : -4.5);
  ctx.lineTo(14, angry ? -3 : -4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,120,0.35)';
  ctx.beginPath();
  ctx.ellipse(1, 9, 3, 1.8, 0, 0, TAU);
  ctx.ellipse(14, 9, 2.5, 1.6, 0, 0, TAU);
  ctx.fill();
  if (angry) {
    ctx.fillStyle = '#7a1f1f';
    ctx.beginPath();
    ctx.ellipse(8, 11, 2.6, 2, 0, 0, TAU);
    ctx.fill();
  } else {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(8, 9, 2.4, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // mũ trụ
  const hg = ctx.createLinearGradient(0, -16, 0, 0);
  hg.addColorStop(0, '#ffffff');
  hg.addColorStop(0.3, o.general ? '#ffd54a' : c.helm);
  hg.addColorStop(1, o.general ? '#c79100' : c.helmD);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(-15, -2);
  ctx.quadraticCurveTo(-14, -18, 2, -18);
  ctx.quadraticCurveTo(18, -18, 18, -2);
  ctx.lineTo(13, -3);
  ctx.quadraticCurveTo(2, -8, -9, -3);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 2.2);
  ctx.fillStyle = c.trim;
  rrect(ctx, -15, -5, 33, 4, 2);
  ctx.fill();
  outline(ctx, 1.4);
  if (team === 0) {
    ctx.fillStyle = c.plume;
    ctx.beginPath();
    ctx.moveTo(2, -18);
    ctx.quadraticCurveTo(-8 - Math.sin(t * 6) * 2, -30, -14, -22);
    ctx.quadraticCurveTo(-6, -24, 0, -16);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.6);
    ctx.fillStyle = c.trim;
    ctx.beginPath();
    ctx.arc(2, -19, 3, 0, TAU);
    ctx.fill();
    outline(ctx, 1.4);
  } else {
    ctx.fillStyle = c.plume;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.quadraticCurveTo(-4, -32, 12, -26);
    ctx.quadraticCurveTo(6, -22, 10, -16);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, -16, 2.6, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // tay trước cầm vũ khí
  const armA = o.weapon === 'bow' ? 0.05 - swing * 0.2 : 0.35 - swing * 0.9;
  ctx.save();
  ctx.translate(7, -36);
  ctx.rotate(armA + (o.cheer ? -1.3 : 0));
  ctx.fillStyle = c.tunic;
  rrect(ctx, -3, -3, 16, 7, 3);
  ctx.fill();
  outline(ctx, 1.8);
  ctx.fillStyle = skin[0];
  ctx.beginPath();
  ctx.arc(15, 0.5, 4, 0, TAU);
  ctx.fill();
  outline(ctx, 1.6);
  ctx.translate(15, 0.5);
  ctx.rotate(o.weapon === 'bow' ? -0.1 : -0.75 + swing * 0.9);
  drawWeapon(ctx, o, c, swing, t);
  ctx.restore();
  // giáp vai
  ctx.fillStyle = c.armor;
  ctx.beginPath();
  ctx.ellipse(7, -38, 5, 3.5, 0.3, 0, TAU);
  ctx.fill();
  outline(ctx, 1.6);
  ctx.restore();

  // khiên phép / hồi máu / khí thế
  if (o.shield && !o.dead) {
    ctx.save();
    ctx.strokeStyle = team === 0 ? 'rgba(255,213,74,0.95)' : 'rgba(124,247,255,0.95)';
    ctx.fillStyle = team === 0 ? 'rgba(255,213,74,0.16)' : 'rgba(124,247,255,0.16)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y - 40 * sc, 30 * sc, 46 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (o.healGlow > 0) {
    ctx.save();
    ctx.globalAlpha = o.healGlow;
    ctx.fillStyle = '#7dff8a';
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 3;
    ctx.font = `900 ${Math.round(20 * sc)}px sans-serif`;
    ctx.textAlign = 'center';
    const hy = y - 92 * sc - (1 - o.healGlow) * 20;
    ctx.strokeText('✚', x + 14 * sc, hy);
    ctx.fillText('✚', x + 14 * sc, hy);
    ctx.restore();
  }
  if (o.buff && !o.dead) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,120,40,0.6)';
    for (let i = 0; i < 3; i++) {
      const k = (t * 2 + i / 3) % 1;
      ctx.beginPath();
      ctx.arc(x + (i - 1) * 9 * sc, y - k * 60 * sc, (6 - k * 4) * sc, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
