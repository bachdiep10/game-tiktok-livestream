// Nhân vật Phật tử mặc áo tràng, nhìn từ phía sau (quay về tượng Phật).
// Vẽ có khối: ánh sáng chiếu từ phía trên bên phải (cửa sổ), bóng đổ xuống bồ đoàn.

export const ROBES = [
  // [sáng, chính, tối]
  ['#a9b1bd', '#7c8797', '#4b5464'], // lam xám
  ['#aeb3bb', '#83888f', '#54585f'], // xám tro
  ['#9dadc0', '#6e7f95', '#435166'], // lam
  ['#b1b6bf', '#878e99', '#5a606b'],
  ['#b39675', '#866a4d', '#584430'], // nâu
  ['#ded8cc', '#b3ac9f', '#817a6e'], // trắng ngà
];
export const SKINS = ['#efc6a0', '#e6b78e', '#f3cfae', '#d9a77e'];
export const HAIRS = ['short', 'bun', 'bald', 'long', 'short', 'bun'];
const HAIR_COLORS = ['#1f1814', '#2b211b', '#171210', '#3a2a20'];
const TIES = ['#b23a3a', '#6d4c9f', '#c98a2b', '#2f6f8f'];

const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

export function lookFor(hash) {
  return {
    robe: ROBES[[0, 0, 1, 2, 3, 0, 1, 4, 5, 2][hash % 10]],
    skin: SKINS[(hash >> 3) % SKINS.length],
    hair: HAIRS[(hash >> 5) % HAIRS.length],
    hairColor: HAIR_COLORS[(hash >> 8) % HAIR_COLORS.length],
    tie: TIES[(hash >> 10) % TIES.length],
  };
}

function robeFill(ctx, x, topY, y, half, robe) {
  const g = ctx.createRadialGradient(x + half * 0.45, topY + (y - topY) * 0.25, 2, x, topY + (y - topY) * 0.55, (y - topY) * 1.25 + half);
  g.addColorStop(0, robe[0]);
  g.addColorStop(0.45, robe[1]);
  g.addColorStop(1, robe[2]);
  return g;
}

// Vẽ đầu nhìn từ phía sau
function drawHead(ctx, c, x, hy, r, s) {
  const look = c.look;
  // tai
  ctx.fillStyle = look.skin;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * r * 0.96, hy + r * 0.12, r * 0.2, r * 0.3, side * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // gáy
  ctx.fillStyle = look.skin;
  ctx.fillRect(x - r * 0.42, hy + r * 0.5, r * 0.84, r * 0.6);

  const skinG = ctx.createRadialGradient(x + r * 0.35, hy - r * 0.4, r * 0.1, x, hy, r * 1.15);
  skinG.addColorStop(0, '#fff1e0');
  skinG.addColorStop(0.35, look.skin);
  skinG.addColorStop(1, '#a8714a');
  const hairG = ctx.createRadialGradient(x + r * 0.35, hy - r * 0.45, r * 0.05, x, hy, r * 1.15);
  hairG.addColorStop(0, '#6b5446');
  hairG.addColorStop(0.3, look.hairColor);
  hairG.addColorStop(1, '#0a0705');

  if (look.hair === 'long') {
    // tóc dài xoã xuống lưng
    ctx.fillStyle = hairG;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.95, hy);
    ctx.quadraticCurveTo(x - r * 1.05, hy + r * 1.8, x - r * 0.55, hy + r * 2.4);
    ctx.lineTo(x + r * 0.55, hy + r * 2.4);
    ctx.quadraticCurveTo(x + r * 1.05, hy + r * 1.8, x + r * 0.95, hy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, hy, r, 0, Math.PI * 2);
  ctx.fillStyle = look.hair === 'bald' ? skinG : hairG;
  ctx.fill();

  if (look.hair === 'bald') {
    // đầu cạo: chút bóng tóc mờ và điểm sáng
    ctx.fillStyle = 'rgba(70,50,40,0.18)';
    ctx.beginPath();
    ctx.arc(x, hy + r * 0.05, r * 0.95, Math.PI * 0.1, Math.PI * 0.9);
    ctx.fill();
  } else if (look.hair === 'short') {
    // đường chân tóc ở gáy
    ctx.fillStyle = look.skin;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, hy + r * 0.98);
    ctx.quadraticCurveTo(x, hy + r * 0.72, x + r * 0.45, hy + r * 0.98);
    ctx.lineTo(x + r * 0.45, hy + r * 1.2);
    ctx.lineTo(x - r * 0.45, hy + r * 1.2);
    ctx.fill();
    // ngọn tóc xoáy
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath();
    ctx.arc(x + r * 0.1, hy - r * 0.25, r * 0.28, 0, Math.PI * 1.5);
    ctx.stroke();
  } else if (look.hair === 'bun') {
    // búi tóc + dây buộc
    ctx.fillStyle = hairG;
    ctx.beginPath();
    ctx.arc(x, hy - r * 0.55, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = look.tie;
    ctx.lineWidth = Math.max(1.5, r * 0.16);
    ctx.beginPath();
    ctx.arc(x, hy - r * 0.55, r * 0.5, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    // các đường chải tóc hướng lên búi
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = Math.max(1, r * 0.06);
    for (const dx of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(x + dx * r * 1.4, hy + r * 0.8);
      ctx.quadraticCurveTo(x + dx * r * 0.9, hy, x + dx * r * 0.3, hy - r * 0.3);
      ctx.stroke();
    }
  }
  // điểm sáng viền phải
  ctx.strokeStyle = 'rgba(255,240,210,0.45)';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, hy, r * 0.9, -Math.PI * 0.45, -Math.PI * 0.05);
  ctx.stroke();
}

// Trả về toạ độ đỉnh đầu để vẽ thẻ tên phía trên
export function drawCharacter(ctx, c, s, pose, now) {
  const { x, y } = c;
  const look = c.look;
  const k = ease(c.kneelT);
  const { bow, raise } = pose;
  const walking = c.state === 'walk';
  const breath = Math.sin(c.breath) * 1.1 * s * k;
  const sway = walking ? Math.sin(c.walkPhase) * 3.5 * s : 0;
  const bob = walking ? Math.abs(Math.sin(c.walkPhase)) * 3 * s : 0;

  const bodyH = lerp(96, 58, k) * s * (1 - 0.45 * bow) + breath;
  const hemHalf = (lerp(22, 37, k) + 5 * bow) * s;
  const shoulderHalf = (lerp(21, 23, k) + 6 * bow) * s;
  const topY = y - bodyH - bob;
  const headR = 17 * s;
  const headY = topY - headR * 0.72 + bow * 20 * s;
  const [light, base, dark] = look.robe;

  // bóng đổ
  ctx.fillStyle = 'rgba(20,8,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(x - 4 * s, y + 5 * s, hemHalf + 10 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // khi lạy sát đất: tay vươn ra trước, đầu cúi thấp sau lưng
  if (bow > 0.05) {
    ctx.strokeStyle = dark;
    ctx.lineCap = 'round';
    ctx.lineWidth = 10 * s;
    const reach = topY - 16 * s * bow;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * shoulderHalf * 0.75, topY + 10 * s);
      ctx.quadraticCurveTo(x + side * (shoulderHalf + 4 * s), topY - 4 * s * bow, x + side * 11 * s, reach);
      ctx.stroke();
    }
    ctx.fillStyle = look.skin;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + side * 10 * s, reach - 4 * s, 4.5 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (bow > 0.45) drawHead(ctx, c, x + sway * 0.3, headY, headR * (1 - 0.1 * bow), s);

  // thân áo tràng
  ctx.beginPath();
  ctx.moveTo(x - hemHalf + sway, y + 1 * s);
  ctx.bezierCurveTo(
    x - hemHalf - 4 * s, y - bodyH * 0.3,
    x - shoulderHalf - 7 * s, topY + bodyH * 0.38,
    x - shoulderHalf, topY + 8 * s,
  );
  ctx.quadraticCurveTo(x - shoulderHalf * 0.6, topY - 1 * s, x, topY - 1 * s);
  ctx.quadraticCurveTo(x + shoulderHalf * 0.6, topY - 1 * s, x + shoulderHalf, topY + 8 * s);
  ctx.bezierCurveTo(
    x + shoulderHalf + 7 * s, topY + bodyH * 0.38,
    x + hemHalf + 4 * s, y - bodyH * 0.3,
    x + hemHalf + sway, y + 1 * s,
  );
  ctx.quadraticCurveTo(x, y + 8 * s, x - hemHalf + sway, y + 1 * s);
  ctx.closePath();
  ctx.fillStyle = robeFill(ctx, x, topY, y, hemHalf, look.robe);
  ctx.fill();
  // ánh nến vàng ấm hắt lên áo + mép trái tối
  const warm = ctx.createLinearGradient(x - hemHalf, 0, x + hemHalf, 0);
  warm.addColorStop(0, 'rgba(40,15,0,0.22)');
  warm.addColorStop(0.5, 'rgba(255,190,100,0.06)');
  warm.addColorStop(1, 'rgba(255,185,90,0.28)');
  ctx.fillStyle = warm;
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,20,30,0.35)';
  ctx.lineWidth = 1.2 * s;
  ctx.stroke();

  // ống tay áo hai bên (tay đặt phía trước)
  if (!walking && raise < 0.1 && bow < 0.1) {
    for (const side of [-1, 1]) {
      const sx = x + side * (shoulderHalf + 1.5 * s);
      const sy = topY + bodyH * 0.5;
      const g = ctx.createLinearGradient(sx - 8 * s, 0, sx + 8 * s, 0);
      g.addColorStop(0, side > 0 ? base : dark);
      g.addColorStop(1, side > 0 ? light : base);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 8.5 * s, bodyH * 0.36, side * -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(20,20,30,0.3)';
      ctx.lineWidth = 1 * s;
      ctx.stroke();
    }
  }

  // nếp áo: đường may giữa lưng, nếp gấp gần vạt
  ctx.strokeStyle = 'rgba(30,35,45,0.35)';
  ctx.lineWidth = 1.4 * s;
  ctx.beginPath();
  ctx.moveTo(x, topY + 4 * s);
  ctx.lineTo(x + sway * 0.5, y - 2 * s);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,35,45,0.22)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * hemHalf * 0.55, y - bodyH * 0.4);
    ctx.quadraticCurveTo(x + side * hemHalf * 0.7, y - bodyH * 0.15, x + side * hemHalf * 0.6, y);
    ctx.stroke();
  }
  // vai được nắng chiếu
  ctx.strokeStyle = 'rgba(255,245,225,0.35)';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(x + 3 * s, topY + 1 * s);
  ctx.quadraticCurveTo(x + shoulderHalf * 0.7, topY + 1 * s, x + shoulderHalf, topY + 9 * s);
  ctx.stroke();
  // cổ áo
  ctx.strokeStyle = dark;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.ellipse(x, topY + 1 * s, 8 * s, 3.5 * s, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();

  // chân
  if (walking) {
    ctx.fillStyle = '#3b2b22';
    const step = Math.sin(c.walkPhase) * 6 * s;
    ctx.beginPath();
    ctx.ellipse(x - 7 * s + step, y + 1 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 7 * s - step, y + 1 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (k > 0.5) {
    ctx.fillStyle = look.skin;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + side * 10 * s, y + 3 * s, 6.5 * s, 3.5 * s, side * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,100,70,0.5)';
      ctx.beginPath();
      ctx.ellipse(x + side * 13 * s, y + 3.5 * s, 2.5 * s, 2 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = look.skin;
    }
  }

  // chắp tay giơ lên vái
  if (raise > 0.05) {
    ctx.strokeStyle = base;
    ctx.lineCap = 'round';
    ctx.lineWidth = 9 * s;
    const handY = topY - (4 + 30 * raise) * s;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * shoulderHalf * 0.9, topY + 9 * s);
      ctx.quadraticCurveTo(x + side * (shoulderHalf + 9 * s), topY - 6 * s * raise, x + side * 3 * s, handY + 4 * s);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,245,225,0.3)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(x + shoulderHalf * 0.9, topY + 7 * s);
    ctx.quadraticCurveTo(x + shoulderHalf + 9 * s, topY - 8 * s * raise, x + 3 * s, handY + 2 * s);
    ctx.stroke();
    ctx.fillStyle = look.skin;
    ctx.beginPath();
    ctx.ellipse(x, handY - 4 * s, 4.5 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (bow <= 0.45) drawHead(ctx, c, x + sway * 0.3, headY, headR, s);
  return headY - headR - (look.hair === 'bun' ? headR * 0.6 : 0);
}
