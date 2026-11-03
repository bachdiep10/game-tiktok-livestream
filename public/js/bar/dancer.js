// Nhân vật nhảy vẽ hoàn toàn bằng code (không dùng hình ảnh bên ngoài).
// Khung xương đơn giản: hông, thân, 2 tay, 2 chân, đầu. Mỗi điệu nhảy là một hàm tạo tư thế theo nhịp.

const TAU = Math.PI * 2;

export function hashStr(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SKIN = ['#f6d3b3', '#eec19a', '#e0a97f', '#c98c62', '#a8704a', '#f3cfae'];
const HAIR = ['#1b1210', '#2b1a12', '#3d2516', '#6b4425', '#141414', '#d9b25a', '#ff4fa3', '#4fd2ff', '#b36bff', '#f2f2f2'];
const TOPS = ['#ff2e88', '#22d3ee', '#a3e635', '#facc15', '#f97316', '#8b5cf6', '#ef4444', '#ffffff', '#111827', '#14b8a6', '#ec4899', '#3b82f6'];
const PANTS = ['#1f2937', '#111827', '#1e3a8a', '#3f3f46', '#e5e7eb', '#7c2d12', '#312e81', '#0f172a'];
const GLOW = ['#ff2bd6', '#2bf3ff', '#9dff2b', '#ffe12b', '#ff6a2b', '#b12bff'];
const HAIR_STYLES = ['short', 'long', 'bun', 'spiky', 'cap', 'afro', 'side', 'pony'];

// Ngoại hình cố định theo ID người xem (vào lại vẫn giống)
export function lookFor(id) {
  const r = rng(hashStr(id));
  const pick = (a) => a[Math.floor(r() * a.length)];
  return {
    skin: pick(SKIN),
    hair: pick(HAIR),
    hairStyle: pick(HAIR_STYLES),
    top: pick(TOPS),
    top2: pick(TOPS),
    jacket: r() < 0.35,
    pants: pick(PANTS),
    skirt: r() < 0.18,
    shoes: r() < 0.5 ? '#f5f5f5' : '#111',
    glasses: r() < 0.3,
    headphones: r() < 0.15,
    glowstick: r() < 0.35 ? pick(GLOW) : null,
    glow: pick(GLOW),
    style: Math.floor(r() * DANCES.length),
    tempo: r() < 0.25 ? 0.5 : 1,
    phase: r() * 4,
  };
}

// Người nhảy không tên (lấp chỗ trống): bóng tối, viền neon
export function shadowLook(seed) {
  const l = lookFor(`crowd-${seed}`);
  return {
    ...l,
    skin: '#2a1f45',
    hair: '#1a1330',
    top: '#2d2350',
    top2: '#2d2350',
    pants: '#1d1736',
    shoes: '#140f26',
    glasses: false,
    shadow: true,
  };
}

// ------------------------------------------------------------------ tư thế
const UP = Math.PI; // tay giơ thẳng lên
const s = Math.sin;
const c = Math.cos;
const beatPulse = (t) => Math.pow(Math.max(0, c(t * TAU)), 2); // 1 đúng nhịp, 0 giữa nhịp

function base() {
  return {
    jump: 0,
    lean: 0,
    head: 0,
    spin: 1,
    arms: [{ a: 0.25, b: 0.4 }, { a: 0.25, b: 0.4 }],
    legs: [{ a: 0.08, b: 0 }, { a: 0.08, b: 0 }],
  };
}

export const DANCES = [
  // 0. nhún + đấm tay lên trời
  (t, e) => {
    const p = base();
    const k = beatPulse(t);
    p.legs[0].b = p.legs[1].b = 0.25 + 0.45 * k * e;
    p.legs[0].a = p.legs[1].a = 0.15 + 0.1 * k;
    const alt = Math.floor(t) % 2;
    p.arms[alt] = { a: UP - 0.25 - 0.35 * k, b: -0.2 - 0.6 * k };
    p.arms[1 - alt] = { a: 0.5, b: 1.6 };
    p.head = 0.15 * s(t * TAU);
    return p;
  },
  // 1. hai tay vẫy qua lại trên đầu
  (t, e) => {
    const p = base();
    const sw = s(t * Math.PI);
    p.lean = 0.12 * sw * e;
    p.arms[0] = { a: UP - 0.5 - 0.35 * sw, b: -0.3 };
    p.arms[1] = { a: UP - 0.5 + 0.35 * sw, b: -0.3 };
    p.legs[0].b = p.legs[1].b = 0.2 + 0.25 * beatPulse(t);
    p.head = -0.15 * sw;
    return p;
  },
  // 2. shuffle: đá chân luân phiên
  (t, e) => {
    const p = base();
    const ph = t * TAU;
    const kick = s(ph);
    p.legs[0] = { a: 0.1 + Math.max(0, kick) * 0.7 * e, b: Math.max(0, kick) * 0.6 };
    p.legs[1] = { a: 0.1 + Math.max(0, -kick) * 0.7 * e, b: Math.max(0, -kick) * 0.6 };
    p.arms[0] = { a: 0.6 + 0.5 * kick, b: 1.2 };
    p.arms[1] = { a: 0.6 - 0.5 * kick, b: 1.2 };
    p.jump = 4 * Math.abs(s(ph)) * e;
    p.lean = 0.08 * kick;
    return p;
  },
  // 3. robot: tay gập góc đổi mỗi nửa nhịp
  (t, e) => {
    const p = base();
    const step = Math.floor(t * 2) % 4;
    const poses = [
      [{ a: 1.57, b: 1.57 }, { a: 0.2, b: 0 }],
      [{ a: 0.2, b: 0 }, { a: 1.57, b: 1.57 }],
      [{ a: 1.57, b: -1.57 }, { a: 1.57, b: 1.57 }],
      [{ a: 1.57, b: 0 }, { a: 1.57, b: 0 }],
    ];
    p.arms = poses[step].map((x) => ({ ...x }));
    p.head = [0.2, -0.2, 0, 0.1][step];
    p.legs[0].b = p.legs[1].b = 0.15 + 0.2 * beatPulse(t * 2) * e;
    return p;
  },
  // 4. nhảy tưng tưng, tay giơ cao
  (t, e) => {
    const p = base();
    const ph = (t / 2) % 1;
    const air = Math.max(0, s(ph * TAU));
    p.jump = 26 * air * e;
    p.legs[0].b = p.legs[1].b = 0.9 * (1 - air) * beatPulse(t);
    p.legs[0].a = p.legs[1].a = 0.12 + 0.25 * air;
    p.arms[0] = { a: UP - 0.35 - 0.3 * (1 - air), b: -0.2 };
    p.arms[1] = { a: UP - 0.35 - 0.3 * (1 - air), b: -0.2 };
    return p;
  },
  // 5. disco: một tay chỉ lên trời rồi kéo chéo xuống
  (t, e) => {
    const p = base();
    const ph = t % 2;
    const up = ph < 1;
    p.arms[1] = up ? { a: UP - 0.5, b: -0.05 } : { a: -0.6, b: 0.1 };
    p.arms[0] = { a: 0.35, b: 1.3 };
    p.lean = up ? -0.12 : 0.12;
    p.head = up ? -0.2 : 0.2;
    p.legs[0] = { a: up ? 0.35 : 0.1, b: up ? 0.3 : 0 };
    p.legs[1].b = 0.25 * beatPulse(t) * e;
    return p;
  },
  // 6. xoay người, dang tay
  (t, e) => {
    const p = base();
    p.spin = c(t * Math.PI * 0.5);
    p.arms[0] = { a: 1.4 + 0.2 * s(t * TAU), b: 0.2 };
    p.arms[1] = { a: 1.4 - 0.2 * s(t * TAU), b: 0.2 };
    p.legs[0].b = p.legs[1].b = 0.2 + 0.3 * beatPulse(t) * e;
    return p;
  },
  // 7. lắc vai, tay đung đưa trước ngực
  (t, e) => {
    const p = base();
    const sw = s(t * TAU);
    p.lean = 0.1 * sw;
    p.arms[0] = { a: 0.9 + 0.4 * sw, b: 1.9 };
    p.arms[1] = { a: 0.9 - 0.4 * sw, b: 1.9 };
    p.legs[0] = { a: 0.2, b: 0.3 + 0.3 * Math.max(0, sw) * e };
    p.legs[1] = { a: 0.2, b: 0.3 + 0.3 * Math.max(0, -sw) * e };
    p.head = 0.2 * sw;
    return p;
  },
];

// tư thế đặc biệt
export function fallPose(t) {
  const p = base();
  p.arms[0] = { a: UP - 0.6 + 0.2 * s(t * 20), b: -0.3 };
  p.arms[1] = { a: UP - 0.6 - 0.2 * s(t * 20), b: -0.3 };
  p.legs[0] = { a: 0.3, b: 0.9 };
  p.legs[1] = { a: 0.2, b: 0.5 };
  return p;
}

export function landPose(k) {
  // k: 1 lúc vừa chạm đất -> 0
  const p = base();
  p.legs[0] = { a: 0.45, b: 1.5 * k };
  p.legs[1] = { a: 0.45, b: 1.5 * k };
  p.arms[0] = { a: 1.6 + 0.6 * (1 - k), b: 0.2 };
  p.arms[1] = { a: 1.6 + 0.6 * (1 - k), b: 0.2 };
  return p;
}

export function cheerPose(t) {
  const p = DANCES[4](t, 1.2);
  p.arms[0] = { a: UP - 0.4, b: -0.1 };
  p.arms[1] = { a: UP - 0.4, b: -0.1 };
  return p;
}

export function wavePose(t) {
  const p = base();
  p.arms[1] = { a: UP - 0.6, b: -0.5 + 0.5 * s(t * 12) };
  return p;
}

// ------------------------------------------------------------------ vẽ
const THIGH = 23;
const SHIN = 23;
const TORSO = 36;
const UPPER = 18;
const FORE = 17;
const HEAD_R = 15;

function limbEnd(x, y, side, a, len) {
  return [x + side * Math.sin(a) * len, y + Math.cos(a) * len];
}

function line(ctx, pts, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}

/**
 * Vẽ nhân vật, chân chạm đất tại (x, y), tỉ lệ sc.
 * Trả về toạ độ đỉnh đầu (để đặt tên / bong bóng chat).
 */
export function drawDancer(ctx, look, pose, x, y, sc, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc * (pose.spin < 0 ? -1 : 1) * Math.max(0.35, Math.abs(pose.spin)), sc);
  if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // tính chiều cao hông để bàn chân chạm đất
  const legDrop = pose.legs.map((l) => THIGH * Math.cos(l.a) + SHIN * Math.cos(l.a - l.b));
  const hipY = -Math.max(...legDrop) - pose.jump;

  // bóng dưới chân
  if (!opts.noShadow) {
    ctx.fillStyle = `rgba(0,0,0,${0.35 * Math.max(0.2, 1 - pose.jump / 60)})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 5, 0, 0, TAU);
    ctx.fill();
  }

  // chân
  const hips = [-6, 6];
  const feet = [];
  pose.legs.forEach((l, i) => {
    const side = i === 0 ? -1 : 1;
    const hx = hips[i];
    const knee = limbEnd(hx, hipY, side, l.a, THIGH);
    const foot = limbEnd(knee[0], knee[1], side, l.a - l.b, SHIN);
    feet.push(foot);
    line(ctx, [[hx, hipY], knee, foot], 10, look.pants);
    ctx.fillStyle = look.shoes;
    ctx.beginPath();
    ctx.ellipse(foot[0] + side * 3, foot[1] - 1, 7, 4, 0, 0, TAU);
    ctx.fill();
  });

  // thân (nghiêng quanh hông)
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(pose.lean);
  const shY = -TORSO;
  if (look.skirt) {
    ctx.fillStyle = look.pants;
    ctx.beginPath();
    ctx.moveTo(-11, -4);
    ctx.lineTo(11, -4);
    ctx.lineTo(16, 12);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = look.top;
  roundRectPath(ctx, -13, shY - 2, 26, TORSO + 4, 9);
  ctx.fill();
  if (look.jacket) {
    ctx.fillStyle = look.top2;
    ctx.fillRect(-4, shY + 2, 8, TORSO - 4);
  } else if (!look.shadow) {
    // hoạ tiết áo phản quang
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-13, shY + 14, 26, 4);
  }

  // đầu
  ctx.save();
  ctx.translate(0, shY - HEAD_R + 1);
  ctx.rotate(pose.head);
  drawHead(ctx, look);
  ctx.restore();

  // tay
  const hands = [];
  pose.arms.forEach((a, i) => {
    const side = i === 0 ? -1 : 1;
    const sx = side * 12;
    const sy = shY + 4;
    const elbow = limbEnd(sx, sy, side, a.a, UPPER);
    const hand = limbEnd(elbow[0], elbow[1], side, a.a + a.b, FORE);
    hands.push(hand);
    line(ctx, [[sx, sy], elbow], 8, look.top);
    line(ctx, [elbow, hand], 7, look.jacket ? look.top : look.skin);
    ctx.fillStyle = look.skin;
    ctx.beginPath();
    ctx.arc(hand[0], hand[1], 4.5, 0, TAU);
    ctx.fill();
    if (look.glowstick && i === 1) {
      const ang = a.a + a.b;
      const tip = limbEnd(hand[0], hand[1], side, ang, 16);
      ctx.save();
      ctx.shadowColor = look.glowstick;
      ctx.shadowBlur = 14;
      line(ctx, [hand, tip], 4, look.glowstick);
      ctx.restore();
    }
  });
  ctx.restore();

  // viền neon cho người nhảy không tên
  ctx.restore();
  return { headY: y + (hipY - TORSO - HEAD_R * 2 - 4) * sc };
}

function drawHead(ctx, look) {
  const r = HEAD_R;
  const hs = look.hairStyle;
  ctx.fillStyle = look.hair;
  // tóc phía sau đầu
  if (hs === 'long') {
    roundRectPath(ctx, -r - 2, -r + 2, r * 2 + 4, r * 2 + 6, 8);
    ctx.fill();
  } else if (hs === 'afro') {
    ctx.beginPath();
    ctx.arc(0, -3, r + 7, 0, TAU);
    ctx.fill();
  } else if (hs === 'pony') {
    ctx.beginPath();
    ctx.ellipse(r + 2, 2, 5, 12, -0.4, 0, TAU);
    ctx.fill();
  }
  // mặt
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  // tóc phía trên
  ctx.fillStyle = look.hair;
  ctx.beginPath();
  if (hs === 'spiky') {
    ctx.moveTo(-r, -2);
    for (let i = 0; i <= 6; i++) {
      const xx = -r + (i * 2 * r) / 6;
      ctx.lineTo(xx, i % 2 ? -r - 9 : -r + 2);
    }
    ctx.lineTo(r, -2);
    ctx.arc(0, 0, r, 0, Math.PI, true);
  } else if (hs === 'cap') {
    ctx.arc(0, -2, r + 1, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = look.top2;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, -3, 13, 3.5, 0, 0, TAU);
  } else if (hs === 'side') {
    ctx.arc(0, -1, r + 1, Math.PI, 0);
    ctx.lineTo(r + 1, -2);
    ctx.quadraticCurveTo(-2, -4, -r + 2, 6);
    ctx.closePath();
  } else {
    ctx.arc(0, -1, r + 1, Math.PI * 1.02, -0.02);
    ctx.quadraticCurveTo(r * 0.3, -r * 0.35, -r * 0.2, -r * 0.45);
    ctx.quadraticCurveTo(-r * 0.7, -r * 0.3, -r - 1, -1);
    ctx.closePath();
  }
  ctx.fill();
  if (hs === 'bun') {
    ctx.beginPath();
    ctx.arc(0, -r - 4, 7, 0, TAU);
    ctx.fill();
  }
  if (look.shadow) return;
  // mắt / kính
  if (look.glasses) {
    ctx.fillStyle = '#0b0b12';
    roundRectPath(ctx, -11, -4, 22, 7, 3);
    ctx.fill();
    ctx.fillStyle = look.glow;
    ctx.fillRect(-9, -3, 5, 1.5);
    ctx.fillRect(3, -3, 5, 1.5);
  } else {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-5, -1, 2, 0, TAU);
    ctx.arc(5, -1, 2, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#7a2b2b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 5, 4.5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,110,130,0.35)';
  ctx.beginPath();
  ctx.arc(-9, 4, 3, 0, TAU);
  ctx.arc(9, 4, 3, 0, TAU);
  ctx.fill();
  if (look.headphones) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -1, r + 2, Math.PI * 1.05, -0.05);
    ctx.stroke();
    ctx.fillStyle = look.glow;
    roundRectPath(ctx, -r - 5, -5, 6, 12, 3);
    ctx.fill();
    roundRectPath(ctx, r - 1, -5, 6, 12, 3);
    ctx.fill();
  }
}

export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
