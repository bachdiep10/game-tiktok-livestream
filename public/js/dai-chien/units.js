// Lính hai phe kiểu chibi, vẽ bằng code.
// Phe Núi (Sơn Tinh): áo nâu lục, nón đồng có chỏm lá, giáo + khiên mây.
// Phe Nước (Thủy Tinh): áo vảy cá xanh, mũ vây cá, đinh ba.
const TAU = Math.PI * 2;

const SKIN = ['#f2c79b', '#e8b48a', '#d9a276', '#f6d2ae'];
export const GENERAL_SCALE = 1.6;

// o: { team, dir, weapon ('spear' | 'sword' | 'bow'), walk, atk (0..1), hurt (0..1), general, mini, shield, dead (0..1), cheer, white, skin, healGlow, buff }
export function drawSoldier(ctx, x, y, s, o, t) {
  const nui = o.team === 0;
  const dir = o.dir || 1;
  const sc = s * (o.mini ? 0.72 : o.general ? GENERAL_SCALE : 1);
  ctx.save();
  ctx.translate(x, y);
  // bóng
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 18 * sc, 5 * sc, 0, 0, TAU);
  ctx.fill();
  if (o.dead) {
    ctx.globalAlpha = Math.max(0, 1 - o.dead * 0.8);
    ctx.rotate(-dir * Math.min(1, o.dead * 2) * 1.35);
  }
  ctx.scale(sc * dir, sc);
  const walk = o.walk || 0;
  const leg = Math.sin(walk) * 6;
  const bob = Math.abs(Math.sin(walk)) * 2;
  const jump = o.cheer ? Math.abs(Math.sin(t * 12)) * 8 : 0;
  ctx.translate(0, -bob - jump);
  const tunic = nui ? '#3f9b3a' : '#2a7fc9';
  const tunic2 = nui ? '#c8a04a' : '#1a5a99';
  const metal = nui ? '#2f7d32' : '#cfe3f2';
  const hurt = o.hurt > 0;
  // áo choàng tướng
  if (o.general) {
    ctx.fillStyle = nui ? '#c62828' : '#6a1b9a';
    ctx.beginPath();
    ctx.moveTo(-6, -40);
    ctx.quadraticCurveTo(-24 - Math.sin(t * 6) * 3, -20, -20, 0);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();
  }
  // chân
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -16);
  ctx.lineTo(-4 + leg, -2);
  ctx.moveTo(5, -16);
  ctx.lineTo(5 - leg, -2);
  ctx.stroke();
  // thân áo
  ctx.fillStyle = hurt ? '#ff8a80' : tunic;
  ctx.beginPath();
  ctx.moveTo(-11, -14);
  ctx.lineTo(-9, -40);
  ctx.lineTo(9, -40);
  ctx.lineTo(12, -14);
  ctx.closePath();
  ctx.fill();
  if (!nui) {
    // vảy cá
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.beginPath();
        ctx.arc(-6 + c * 6 + (r % 2) * 3, -34 + r * 7, 3, 0, Math.PI);
        ctx.stroke();
      }
    }
  } else {
    ctx.fillStyle = tunic2;
    ctx.fillRect(-10, -26, 21, 4);
  }
  // tay + vũ khí
  const swing = o.atk > 0 ? Math.sin(o.atk * Math.PI) : 0;
  const armA = -0.4 - swing * 1.6;
  ctx.save();
  ctx.translate(6, -34);
  ctx.rotate(armA + (o.cheer ? -1.4 : 0));
  ctx.strokeStyle = SKIN[o.skin || 0];
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(12, 6);
  ctx.stroke();
  if (o.white) {
    // cờ trắng đầu hàng
    ctx.strokeStyle = '#6d4c2a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(12, 14);
    ctx.lineTo(12, -30);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(12, -30);
    ctx.lineTo(32, -26 + Math.sin(t * 8) * 2);
    ctx.lineTo(12, -18);
    ctx.closePath();
    ctx.fill();
  } else if (o.weapon === 'bow') {
    // cung tên
    ctx.strokeStyle = '#7a5530';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(14, 6, 16, -1.3, 1.3);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(14 + 16 * Math.cos(-1.3), 6 + 16 * Math.sin(-1.3));
    ctx.lineTo(14 - swing * 6, 6);
    ctx.lineTo(14 + 16 * Math.cos(1.3), 6 + 16 * Math.sin(1.3));
    ctx.stroke();
    if (swing < 0.5) {
      ctx.strokeStyle = '#5b3a1e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.lineTo(36, 6);
      ctx.stroke();
      ctx.fillStyle = nui ? '#ffd54a' : '#7cf7ff';
      ctx.fillRect(6, 4, 5, 4);
    }
  } else if (o.weapon === 'sword') {
    // kiếm
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(9, 3, 7, 6);
    ctx.fillStyle = nui ? '#c58b3a' : '#d9c27a';
    ctx.fillRect(14, 0, 4, 12);
    ctx.fillStyle = '#e8eef5';
    ctx.beginPath();
    ctx.moveTo(18, 3);
    ctx.lineTo(42, 0);
    ctx.lineTo(46, 6);
    ctx.lineTo(18, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,140,160,0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (nui) {
    // giáo
    ctx.strokeStyle = '#7a5530';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, 14);
    ctx.lineTo(40, -12);
    ctx.stroke();
    ctx.fillStyle = '#dfe5ea';
    ctx.beginPath();
    ctx.moveTo(40, -12);
    ctx.lineTo(54, -22);
    ctx.lineTo(44, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c62828';
    ctx.fillRect(36, -12, 4, 6);
  } else {
    // giáo đinh ba
    ctx.strokeStyle = '#d9c27a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, 14);
    ctx.lineTo(40, -12);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(37, -16);
    ctx.lineTo(50, -24);
    ctx.moveTo(40, -12);
    ctx.lineTo(54, -16);
    ctx.moveTo(42, -8);
    ctx.lineTo(54, -6);
    ctx.moveTo(37, -16);
    ctx.lineTo(42, -8);
    ctx.stroke();
  }
  ctx.restore();
  // khiên (tay trước)
  if (!o.white && o.weapon !== 'bow' && (nui || o.weapon === 'sword')) {
    ctx.fillStyle = nui ? '#a0763c' : '#3d8de0';
    ctx.beginPath();
    ctx.arc(-9, -26, 9, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#5b3a1e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-9, -26, 4, 0, TAU);
    ctx.stroke();
  }
  // đầu
  ctx.fillStyle = SKIN[o.skin || 0];
  ctx.beginPath();
  ctx.arc(1, -50, 11, 0, TAU);
  ctx.fill();
  // mắt
  ctx.fillStyle = '#222';
  if (o.dead) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(3, -53);
    ctx.lineTo(7, -49);
    ctx.moveTo(7, -53);
    ctx.lineTo(3, -49);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(5, -51, 1.8, 0, TAU);
    ctx.fill();
    // lông mày giận dữ khi đánh
    if (o.atk > 0 || o.cheer) {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(1, -56);
      ctx.lineTo(8, -54);
      ctx.stroke();
    }
    ctx.beginPath();
    if (o.cheer || o.atk > 0) ctx.arc(6, -45, 2.4, 0, Math.PI);
    else ctx.arc(6, -46, 1.2, 0, Math.PI);
    ctx.fill();
  }
  // mũ
  if (nui) {
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.arc(1, -53, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-12, -54, 26, 3);
    // chỏm lá
    ctx.fillStyle = o.general ? '#ffd54a' : '#7cb342';
    ctx.beginPath();
    ctx.ellipse(-2, -68, 4, 9, -0.5, 0, TAU);
    ctx.fill();
  } else {
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.arc(1, -53, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // vây cá
    ctx.fillStyle = o.general ? '#ffd54a' : '#26c6da';
    ctx.beginPath();
    ctx.moveTo(-8, -62);
    ctx.quadraticCurveTo(-4, -78, 8, -72);
    ctx.lineTo(6, -64);
    ctx.closePath();
    ctx.fill();
  }
  if (o.general) {
    // cờ lệnh sau lưng
    ctx.strokeStyle = '#5b3a1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -30);
    ctx.lineTo(-12, -84);
    ctx.stroke();
    ctx.fillStyle = nui ? '#ffd54a' : '#7cf7ff';
    ctx.beginPath();
    ctx.moveTo(-12, -84);
    ctx.lineTo(-28, -80 + Math.sin(t * 6) * 2);
    ctx.lineTo(-12, -72);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // khiên phép / hồi máu / khí thế
  if (o.shield && !o.dead) {
    ctx.save();
    ctx.strokeStyle = nui ? 'rgba(255,213,74,0.9)' : 'rgba(124,247,255,0.9)';
    ctx.fillStyle = nui ? 'rgba(255,213,74,0.16)' : 'rgba(124,247,255,0.16)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y - 34 * sc, 26 * sc, 40 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (o.healGlow > 0) {
    ctx.save();
    ctx.globalAlpha = o.healGlow;
    ctx.fillStyle = '#7dff8a';
    ctx.font = `bold ${Math.round(18 * sc)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✚', x + 12 * sc, y - 70 * sc - (1 - o.healGlow) * 20);
    ctx.restore();
  }
  if (o.buff && !o.dead) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,120,40,0.55)';
    for (let i = 0; i < 3; i++) {
      const k = (t * 2 + i / 3) % 1;
      ctx.beginPath();
      ctx.arc(x + (i - 1) * 8 * sc, y - k * 50 * sc, (5 - k * 4) * sc, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
