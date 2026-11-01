// Tượng Phật A Di Đà ngồi thiền trên đài sen, vẽ bằng canvas.
// Toạ độ theo khung 1080 x 1920, tâm ngang x = 540.

const CX = 540;

function gold(ctx, x0, x1, y = 0) {
  const g = ctx.createLinearGradient(x0, y, x1, y);
  g.addColorStop(0, '#6e3f08');
  g.addColorStop(0.18, '#b7791f');
  g.addColorStop(0.42, '#f3c75a');
  g.addColorStop(0.55, '#ffe49a');
  g.addColorStop(0.72, '#d9a03a');
  g.addColorStop(1, '#5e3406');
  return g;
}

// đường nếp: một nét tối + một nét sáng lệch nhẹ tạo cảm giác chạm nổi
function fold(ctx, pts, w = 3) {
  const path = (dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
    for (let i = 1; i < pts.length; i += 2) {
      ctx.quadraticCurveTo(pts[i][0] + dx, pts[i][1] + dy, pts[i + 1][0] + dx, pts[i + 1][1] + dy);
    }
  };
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,240,190,0.55)';
  ctx.lineWidth = w * 0.7;
  path(1.5, 1.5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(95,50,5,0.6)';
  ctx.lineWidth = w;
  path(0, 0);
  ctx.stroke();
}

function shadeInside(ctx, pathFn, light = [480, 470], r = 420) {
  ctx.save();
  pathFn();
  ctx.clip();
  // ánh sáng chính từ trên bên trái
  const hl = ctx.createRadialGradient(light[0], light[1], 10, light[0], light[1], r);
  hl.addColorStop(0, 'rgba(255,250,215,0.35)');
  hl.addColorStop(0.5, 'rgba(255,230,160,0.12)');
  hl.addColorStop(1, 'rgba(60,25,0,0.35)');
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, 1080, 1100);
  ctx.restore();
}

function haloAndMandorla(ctx) {
  // vầng sáng thân hình ngọn lửa
  ctx.save();
  const m = new Path2D();
  m.moveTo(CX, 150);
  m.bezierCurveTo(CX + 120, 240, CX + 330, 330, CX + 330, 600);
  m.bezierCurveTo(CX + 330, 760, CX + 260, 840, CX + 240, 860);
  m.lineTo(CX - 240, 860);
  m.bezierCurveTo(CX - 260, 840, CX - 330, 760, CX - 330, 600);
  m.bezierCurveTo(CX - 330, 330, CX - 120, 240, CX, 150);
  const mg = ctx.createRadialGradient(CX, 560, 40, CX, 560, 380);
  mg.addColorStop(0, 'rgba(214,120,40,0.95)');
  mg.addColorStop(0.55, 'rgba(150,55,15,0.95)');
  mg.addColorStop(1, 'rgba(90,25,8,0.95)');
  ctx.fillStyle = mg;
  ctx.fill(m);
  ctx.clip(m);
  ctx.translate(CX, 560);
  for (let i = 0; i < 72; i++) {
    ctx.rotate((Math.PI * 2) / 72);
    ctx.fillStyle = i % 2 ? 'rgba(255,215,120,0.18)' : 'rgba(60,15,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.lineTo(22, 520);
    ctx.lineTo(-22, 520);
    ctx.fill();
  }
  ctx.restore();
  // viền lửa
  ctx.save();
  ctx.strokeStyle = '#f7d27a';
  ctx.lineWidth = 6;
  ctx.stroke(m);
  ctx.strokeStyle = 'rgba(120,55,5,0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 10]);
  ctx.lineDashOffset = 0;
  ctx.scale(1, 1);
  ctx.stroke(m);
  ctx.restore();

  // vầng hào quang sau đầu
  const hg = ctx.createRadialGradient(CX, 395, 20, CX, 395, 128);
  hg.addColorStop(0, 'rgba(255,252,230,1)');
  hg.addColorStop(0.7, 'rgba(255,220,130,0.95)');
  hg.addColorStop(1, 'rgba(210,140,40,0.95)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(CX, 395, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a8650f';
  ctx.lineWidth = 3;
  for (const r of [128, 112]) {
    ctx.beginPath();
    ctx.arc(CX, 395, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // vòng cánh sen nhỏ trên viền hào quang
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    ctx.save();
    ctx.translate(CX + Math.cos(a) * 120, 395 + Math.sin(a) * 120);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = '#ffe7a3';
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.quadraticCurveTo(6, 0, 0, -8);
    ctx.quadraticCurveTo(-6, 0, 0, 7);
    ctx.fill();
    ctx.restore();
  }
}

function lotusThrone(ctx) {
  // bệ
  ctx.fillStyle = gold(ctx, CX - 270, CX + 270);
  ctx.beginPath();
  ctx.ellipse(CX, 895, 250, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(CX - 250, 870, 500, 26);
  ctx.beginPath();
  ctx.ellipse(CX, 870, 250, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  const row = (y, n, w, h, base, offset = 0) => {
    for (let i = 0; i < n; i++) {
      const px = CX - w / 2 + (i + 0.5 + offset) * (w / n);
      const pw = (w / n) * 0.66;
      const g = ctx.createLinearGradient(px, y - h, px, y);
      g.addColorStop(0, '#fff3f7');
      g.addColorStop(0.35, base);
      g.addColorStop(1, '#8e1f45');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(px - pw, y);
      ctx.bezierCurveTo(px - pw * 1.05, y - h * 0.55, px - pw * 0.35, y - h * 0.9, px, y - h);
      ctx.bezierCurveTo(px + pw * 0.35, y - h * 0.9, px + pw * 1.05, y - h * 0.55, px + pw, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f2c35f';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // gân cánh
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, y - 4);
      ctx.lineTo(px, y - h * 0.8);
      ctx.stroke();
    }
  };
  row(872, 10, 520, 70, '#e25b86', 0);
  row(848, 9, 470, 74, '#ef7aa0', 0);
  row(822, 8, 420, 70, '#f6a0bd', 0);
}

function bodyPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(CX - 30, 462);
  ctx.bezierCurveTo(CX - 60, 492, CX - 112, 494, CX - 140, 515); // vai trái
  ctx.bezierCurveTo(CX - 168, 535, CX - 172, 580, CX - 170, 620); // bắp tay
  ctx.bezierCurveTo(CX - 168, 665, CX - 176, 700, CX - 196, 728); // khuỷu
  ctx.bezierCurveTo(CX - 230, 745, CX - 248, 772, CX - 236, 800); // gối trái
  ctx.bezierCurveTo(CX - 200, 830, CX - 80, 836, CX, 834);
  ctx.bezierCurveTo(CX + 80, 836, CX + 200, 830, CX + 236, 800); // gối phải
  ctx.bezierCurveTo(CX + 248, 772, CX + 230, 745, CX + 196, 728);
  ctx.bezierCurveTo(CX + 176, 700, CX + 168, 665, CX + 170, 620);
  ctx.bezierCurveTo(CX + 172, 580, CX + 168, 535, CX + 140, 515); // vai phải
  ctx.bezierCurveTo(CX + 112, 494, CX + 60, 492, CX + 30, 462);
  ctx.closePath();
}

function drawBody(ctx) {
  ctx.fillStyle = gold(ctx, CX - 250, CX + 250);
  bodyPath(ctx);
  ctx.fill();
  shadeInside(ctx, () => bodyPath(ctx), [470, 520], 400);

  // tay trong (tách cánh tay khỏi thân)
  fold(ctx, [[CX - 120, 548], [CX - 132, 640], [CX - 108, 700]], 3.5);
  fold(ctx, [[CX + 120, 548], [CX + 132, 640], [CX + 108, 700]], 3.5);
  // ngực
  fold(ctx, [[CX - 70, 560], [CX - 40, 578], [CX - 8, 566]], 2);
  fold(ctx, [[CX + 70, 560], [CX + 40, 578], [CX + 8, 566]], 2);

  // vạt cà sa chéo từ vai trái xuống eo phải, có đường viền
  ctx.save();
  bodyPath(ctx);
  ctx.clip();
  ctx.fillStyle = 'rgba(150,85,10,0.18)';
  ctx.beginPath();
  ctx.moveTo(CX - 150, 500);
  ctx.bezierCurveTo(CX - 60, 520, CX + 20, 600, CX + 150, 700);
  ctx.lineTo(CX + 200, 760);
  ctx.lineTo(CX - 220, 760);
  ctx.lineTo(CX - 220, 500);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,236,170,0.9)';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(CX - 128, 505);
  ctx.bezierCurveTo(CX - 50, 525, CX + 30, 605, CX + 150, 705);
  ctx.stroke();
  fold(ctx, [[CX - 128, 512], [CX - 46, 535], [CX + 146, 714]], 3);
  // nếp áo trên thân trái
  fold(ctx, [[CX - 150, 560], [CX - 110, 620], [CX - 60, 650]], 2.5);
  fold(ctx, [[CX - 158, 610], [CX - 120, 670], [CX - 50, 690]], 2.5);
  // nếp tay áo rủ
  fold(ctx, [[CX - 168, 660], [CX - 190, 720], [CX - 150, 745]], 2.5);
  fold(ctx, [[CX + 168, 660], [CX + 190, 720], [CX + 150, 745]], 2.5);

  // chân xếp kiết già: đùi phải gác lên trên
  ctx.fillStyle = gold(ctx, CX - 250, CX + 250, 780);
  ctx.beginPath();
  ctx.moveTo(CX + 230, 790);
  ctx.bezierCurveTo(CX + 150, 760, CX - 60, 755, CX - 180, 772);
  ctx.bezierCurveTo(CX - 230, 782, CX - 238, 812, CX - 200, 822);
  ctx.bezierCurveTo(CX - 80, 830, CX + 120, 828, CX + 232, 806);
  ctx.closePath();
  ctx.fill();
  fold(ctx, [[CX + 228, 792], [CX + 40, 762], [CX - 180, 774]], 3);
  for (let i = 0; i < 3; i++) {
    fold(ctx, [[CX - 150 + i * 20, 790 + i * 9], [CX, 800 + i * 10], [CX + 160 - i * 20, 792 + i * 8]], 2);
  }
  // lòng bàn chân ngửa
  for (const [fx, fy, rot] of [[CX - 150, 786, -0.25], [CX + 152, 784, 0.25]]) {
    const fg = ctx.createRadialGradient(fx - 6, fy - 4, 2, fx, fy, 34);
    fg.addColorStop(0, '#ffeeb5');
    fg.addColorStop(1, '#c48a2c');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 34, 13, rot, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,60,8,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // tay ấn thiền định: hai bàn tay chồng lên nhau, ngón cái chạm nhau
  const hy = 742;
  const handG = ctx.createRadialGradient(CX - 20, hy - 14, 4, CX, hy, 100);
  handG.addColorStop(0, '#fff0b8');
  handG.addColorStop(0.6, '#e2ad48');
  handG.addColorStop(1, '#9a6014');
  ctx.fillStyle = handG;
  ctx.beginPath();
  ctx.moveTo(CX - 92, hy + 6);
  ctx.bezierCurveTo(CX - 80, hy - 22, CX + 80, hy - 22, CX + 92, hy + 6);
  ctx.bezierCurveTo(CX + 70, hy + 28, CX - 70, hy + 28, CX - 92, hy + 6);
  ctx.fill();
  // ngón cái tạo hình ô-van
  ctx.strokeStyle = 'rgba(110,60,8,0.65)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(CX - 42, hy - 6);
  ctx.bezierCurveTo(CX - 30, hy - 30, CX + 30, hy - 30, CX + 42, hy - 6);
  ctx.stroke();
  ctx.fillStyle = handG;
  ctx.beginPath();
  ctx.moveTo(CX - 44, hy - 4);
  ctx.bezierCurveTo(CX - 30, hy - 32, CX + 30, hy - 32, CX + 44, hy - 4);
  ctx.bezierCurveTo(CX + 30, hy - 22, CX - 30, hy - 22, CX - 44, hy - 4);
  ctx.fill();
  ctx.stroke();
  for (let i = -3; i <= 3; i++) {
    fold(ctx, [[CX + i * 18, hy + 2], [CX + i * 19, hy + 12], [CX + i * 20, hy + 18]], 1.4);
  }
}

function headPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(CX, 324);
  ctx.bezierCurveTo(CX + 44, 324, CX + 64, 356, CX + 64, 398);
  ctx.bezierCurveTo(CX + 64, 438, CX + 50, 466, CX + 28, 480);
  ctx.bezierCurveTo(CX + 14, 488, CX - 14, 488, CX - 28, 480);
  ctx.bezierCurveTo(CX - 50, 466, CX - 64, 438, CX - 64, 398);
  ctx.bezierCurveTo(CX - 64, 356, CX - 44, 324, CX, 324);
  ctx.closePath();
}

function drawHead(ctx) {
  // cổ với ba ngấn
  ctx.fillStyle = gold(ctx, CX - 40, CX + 40);
  ctx.beginPath();
  ctx.moveTo(CX - 34, 462);
  ctx.lineTo(CX - 38, 505);
  ctx.quadraticCurveTo(CX, 515, CX + 38, 505);
  ctx.lineTo(CX + 34, 462);
  ctx.closePath();
  ctx.fill();
  for (const y of [490, 502]) fold(ctx, [[CX - 30, y], [CX, y + 7], [CX + 30, y]], 2);

  // tai dài, dái tai trĩu
  for (const s of [-1, 1]) {
    ctx.fillStyle = gold(ctx, CX - 90, CX + 90, 420);
    ctx.beginPath();
    ctx.moveTo(CX + s * 60, 384);
    ctx.bezierCurveTo(CX + s * 80, 376, CX + s * 84, 410, CX + s * 78, 440);
    ctx.bezierCurveTo(CX + s * 76, 470, CX + s * 78, 492, CX + s * 66, 496);
    ctx.bezierCurveTo(CX + s * 56, 496, CX + s * 56, 470, CX + s * 58, 440);
    ctx.closePath();
    ctx.fill();
    fold(ctx, [[CX + s * 66, 396], [CX + s * 74, 420], [CX + s * 66, 450]], 2);
  }

  // khuôn mặt
  ctx.fillStyle = gold(ctx, CX - 70, CX + 70, 400);
  headPath(ctx);
  ctx.fill();
  shadeInside(ctx, () => headPath(ctx), [520, 400], 110);

  // tóc xoắn ốc
  const hairClip = () => {
    ctx.beginPath();
    ctx.moveTo(CX - 66, 392);
    ctx.bezierCurveTo(CX - 50, 366, CX - 26, 360, CX, 362);
    ctx.bezierCurveTo(CX + 26, 360, CX + 50, 366, CX + 66, 392);
    ctx.lineTo(CX + 70, 300);
    ctx.lineTo(CX - 70, 300);
    ctx.closePath();
  };
  ctx.save();
  headPath(ctx);
  ctx.clip();
  hairClip();
  ctx.clip();
  ctx.fillStyle = '#7d4a0c';
  ctx.fillRect(CX - 70, 300, 140, 100);
  for (let y = 326, r = 0; y < 400; y += 9, r++) {
    for (let x = -70 + (r % 2) * 4.5; x <= 70; x += 9) curl(ctx, CX + x, y);
  }
  ctx.restore();
  // nhục kế
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(CX, 318, 38, 30, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#7d4a0c';
  ctx.fill();
  ctx.clip();
  for (let y = 290, r = 0; y < 350; y += 9, r++) {
    for (let x = -40 + (r % 2) * 4.5; x <= 40; x += 9) curl(ctx, CX + x, y);
  }
  ctx.restore();
  // châu báu trên đỉnh
  const jg = ctx.createRadialGradient(CX - 3, 282, 1, CX, 286, 12);
  jg.addColorStop(0, '#fff6d0');
  jg.addColorStop(1, '#d9862a');
  ctx.fillStyle = jg;
  ctx.beginPath();
  ctx.moveTo(CX, 266);
  ctx.quadraticCurveTo(CX + 12, 284, CX, 294);
  ctx.quadraticCurveTo(CX - 12, 284, CX, 266);
  ctx.fill();

  // nét mặt
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    // lông mày cong dài nối sống mũi
    fold(ctx, [[CX + s * 6, 396], [CX + s * 26, 380], [CX + s * 52, 392]], 2.4);
    // mí mắt khép hờ nhìn xuống
    ctx.fillStyle = 'rgba(140,80,10,0.18)';
    ctx.beginPath();
    ctx.moveTo(CX + s * 14, 410);
    ctx.quadraticCurveTo(CX + s * 30, 398, CX + s * 48, 410);
    ctx.quadraticCurveTo(CX + s * 30, 416, CX + s * 14, 410);
    ctx.fill();
    ctx.strokeStyle = 'rgba(85,42,4,0.9)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(CX + s * 14, 411);
    ctx.quadraticCurveTo(CX + s * 31, 420, CX + s * 49, 410);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,190,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CX + s * 18, 417);
    ctx.quadraticCurveTo(CX + s * 31, 423, CX + s * 45, 416);
    ctx.stroke();
  }
  // sống mũi + cánh mũi
  ctx.strokeStyle = 'rgba(110,60,8,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CX - 4, 400);
  ctx.quadraticCurveTo(CX - 7, 425, CX - 10, 438);
  ctx.stroke();
  fold(ctx, [[CX - 14, 440], [CX, 448], [CX + 14, 440]], 2.2);
  // môi
  ctx.fillStyle = 'rgba(150,80,15,0.55)';
  ctx.beginPath();
  ctx.moveTo(CX - 17, 460);
  ctx.quadraticCurveTo(CX - 8, 455, CX, 458);
  ctx.quadraticCurveTo(CX + 8, 455, CX + 17, 460);
  ctx.quadraticCurveTo(CX, 466, CX - 17, 460);
  ctx.fill();
  fold(ctx, [[CX - 18, 460], [CX, 465], [CX + 18, 460]], 1.8);
  ctx.strokeStyle = 'rgba(110,60,8,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CX - 10, 472);
  ctx.quadraticCurveTo(CX, 476, CX + 10, 472);
  ctx.stroke();
  // bạch hào
  const ug = ctx.createRadialGradient(CX - 1, 394, 0.5, CX, 395, 5);
  ug.addColorStop(0, '#ffffff');
  ug.addColorStop(1, '#e8a640');
  ctx.fillStyle = ug;
  ctx.beginPath();
  ctx.arc(CX, 395, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function curl(ctx, x, y) {
  ctx.fillStyle = '#9a5f12';
  ctx.beginPath();
  ctx.arc(x, y, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e9b44f';
  ctx.beginPath();
  ctx.arc(x - 1.2, y - 1.4, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,245,200,0.9)';
  ctx.beginPath();
  ctx.arc(x - 1.8, y - 2, 1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBuddha(ctx, customImage = null) {
  // ánh sáng toả rộng phía sau
  const glow = ctx.createRadialGradient(CX, 470, 40, CX, 520, 420);
  glow.addColorStop(0, 'rgba(255,220,150,0.55)');
  glow.addColorStop(0.5, 'rgba(230,150,50,0.25)');
  glow.addColorStop(1, 'rgba(120,50,10,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(CX - 440, 80, 880, 880);

  if (customImage) {
    // ảnh tượng do người dùng cung cấp: đặt vừa vùng 600 x 720 phía trên bàn thờ
    const boxW = 620;
    const boxH = 740;
    const s = Math.min(boxW / customImage.width, boxH / customImage.height);
    const w = customImage.width * s;
    const h = customImage.height * s;
    ctx.drawImage(customImage, CX - w / 2, 905 - h, w, h);
    return;
  }

  haloAndMandorla(ctx);
  lotusThrone(ctx);
  drawBody(ctx);
  drawHead(ctx);
}
