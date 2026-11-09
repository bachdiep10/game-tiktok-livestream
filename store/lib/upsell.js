// Bán thêm cho khách cũ: nâng cấp gói bù tiền chênh lệch, ưu đãi có hạn, báo game mới, email tự động + báo cáo.
const DAY = 86400000;

export const DEFAULT_TEMPLATES = {
  receipt: {
    name: 'Ngay sau thanh toán: gửi key',
    subject: '🎮 Key {goi} của bạn đã sẵn sàng',
    body: `Chào {ten},

Cảm ơn bạn đã mua {goi} tại {shop}.

Key của bạn: {key}
Game: {game}

[Tải game & xem hướng dẫn cài](/tai-khoan)

Cài xong, mở game và dán key là chạy. Key cũng luôn nằm trong mục "Tài khoản của tôi" trên web.
Cần hỗ trợ, bạn trả lời email này hoặc nhắn fanpage nhé.`,
  },
  offer: {
    name: 'Sau vài ngày: mời nâng cấp (ưu đãi có hạn)',
    subject: '{ten} ơi, thêm game cho phòng LIVE đỡ nhàm? Ưu đãi đến {han}',
    body: `Chào {ten},

Bạn đã dùng {game} được vài ngày rồi. Kênh LIVE đổi game theo ngày thì người xem quen không bị nhàm và ở lại lâu hơn.

Ưu đãi riêng cho bạn, chỉ đến {han}:
• Lên Gói Combo 3 game: chỉ bù thêm {gia_combo}
• Lên Gói Trọn Bộ ({so_game} game + mọi game mới sau này): chỉ bù thêm {gia_tronbo}

Key đang dùng giữ nguyên, không cần cài lại.

[Nâng cấp ngay](/tai-khoan?nang-cap=1)`,
  },
  reminder: {
    name: 'Nhắc trước khi hết ưu đãi',
    subject: '⏰ Ưu đãi nâng cấp của bạn hết hạn lúc {han}',
    body: `Chào {ten},

Ưu đãi nâng cấp dành riêng cho bạn sắp hết hạn ({han}):
• Gói Combo 3 game: bù thêm {gia_combo}
• Gói Trọn Bộ {so_game} game: bù thêm {gia_tronbo}

Sau thời gian này giá sẽ trở về bình thường.

[Nâng cấp trước khi hết hạn](/tai-khoan?nang-cap=1)`,
  },
  newgame: {
    name: 'Game mới: mời khách cũ mua giá riêng',
    subject: '🎉 Game mới {game_moi}: giá riêng {gia_game_moi} cho khách cũ',
    body: `Chào {ten},

{shop} vừa ra game mới: {game_moi}.

Là khách cũ, bạn được thêm game này vào key đang dùng với giá chỉ {gia_game_moi} (giá thường {gia_le}), đến {han_game_moi}.

[Xem game chạy thử](/game/{id_game_moi})
[Thêm vào key của tôi](/tai-khoan?them-game={id_game_moi})

Mẹo: Gói Trọn Bộ được nhận mọi game mới miễn phí. Bạn chỉ cần bù thêm {gia_tronbo}.`,
  },
  abandoned: {
    name: 'Khách tạo đơn nhưng chưa thanh toán',
    subject: '{ten} ơi, đơn #{ma_don} của bạn chưa hoàn tất',
    body: `Chào {ten},

Bạn đã chọn {goi_don} ({game_don}) nhưng đơn chưa được thanh toán.

Chỉ cần quét mã QR, hệ thống tự gửi key và link tải sau 1–3 phút.

[Thanh toán đơn #{ma_don}](/don-hang.html?code={ma_don}&t={token_don})

Gặp khó khăn khi chuyển khoản? Bạn trả lời email này hoặc nhắn fanpage, mình hỗ trợ ngay.`,
  },
  welcome: {
    name: 'Đăng ký chưa mua: ưu đãi đơn đầu tiên',
    subject: '🎁 {ten} ơi, quà cho đơn đầu tiên: giảm đến {giam_max} (hết hạn {han_dau})',
    body: `Chào {ten},

Cảm ơn bạn đã đăng ký tài khoản tại {shop}. Bạn chưa chọn game nào, nên mình gửi bạn ưu đãi riêng cho đơn đầu tiên, chỉ đến {han_dau}:

• Gói Lẻ 1 game: {gia_dau_le} (thường {gia_le})
• Gói Combo 3 game: {gia_dau_combo} (thường {gia_combo_goc})
• Gói Trọn Bộ {so_game} game + mọi game mới: {gia_dau_tronbo} (thường {gia_tronbo_goc})

Người xem thả tim, chia sẻ, bình luận là nhân vật chạy ngay trên màn hình, giữ chân người xem ở lại phòng LIVE lâu hơn.

[Chọn game với giá ưu đãi](/#bang-gia)
[Xem {so_game} game chạy thử](/#game)

Giá ưu đãi tự áp khi bạn đăng nhập và mua, không cần mã.`,
  },
  welcomeReminder: {
    name: 'Đăng ký chưa mua: nhắc ưu đãi sắp hết',
    subject: '⏰ Ưu đãi đơn đầu của bạn hết hạn lúc {han_dau}',
    body: `Chào {ten},

Ưu đãi đơn đầu tiên của bạn sắp hết hạn ({han_dau}):
• Gói Lẻ: {gia_dau_le}
• Gói Combo 3 game: {gia_dau_combo}
• Gói Trọn Bộ: {gia_dau_tronbo}

Sau thời gian này giá trở về bình thường.

[Mua ngay trước khi hết hạn](/#bang-gia)`,
  },
  newgameOwned: {
    name: 'Game mới: báo khách đã có sẵn trong key',
    subject: '🎉 {game_moi} đã có sẵn trong key của bạn',
    body: `Chào {ten},

{shop} vừa ra game mới: {game_moi}. Game đã được tự thêm vào key của bạn, không mất thêm phí.

[Tải {game_moi} ngay](/tai-khoan)

Chúc bạn có những phiên LIVE thật đông vui!`,
  },
};

export const DEFAULT_UPSELL = {
  emailsOn: 0, // công tắc tổng: tắt cho tới khi chủ shop gửi thử thành công
  popupCheckout: 1, popupAccount: 1,
  emailReceipt: 1, emailOffer: 1, emailReminder: 1, emailNewGame: 1,
  offerAfterDays: 3, offerHours: 48, comboOff: 0, allOff: 111000,
  newGamePrice: 69000, newGameDays: 3,
  // khách đã đăng ký nhưng chưa mua
  popupFirst: 1, emailWelcome: 1, emailWelcomeReminder: 1, emailAbandoned: 1,
  firstAfterHours: 24, firstHours: 72, firstOffLe: 10000, firstOffCombo: 30000, firstOffAll: 100000, abandonedAfterHours: 2,
  smtpHost: 'smtp.gmail.com', smtpPort: 465, smtpUser: '', smtpPass: '', fromName: '', replyTo: '',
  maxPerRun: 20,
};

export function normalizeUpsell(u) {
  u = u || {};
  const cfg = { ...DEFAULT_UPSELL, ...(u.cfg || {}) };
  const templates = {};
  for (const [k, def] of Object.entries(DEFAULT_TEMPLATES)) templates[k] = { ...def, ...((u.templates || {})[k] || {}), name: def.name };
  return {
    cfg, templates,
    startedAt: u.startedAt || 0,
    launches: u.launches || [],
    emails: u.emails || [],
    events: u.events || {},
    lastRun: u.lastRun || 0, lastError: u.lastError || '',
  };
}

export const EVENT_KEYS = ['checkout_shown', 'checkout_accept', 'checkout_decline', 'account_shown', 'account_click', 'account_close', 'first_shown', 'first_click', 'first_close'];
export function countEvent(up, k, n = 1) {
  if (!EVENT_KEYS.includes(k) && !/^email_/.test(k)) return;
  const day = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10); // ngày giờ Việt Nam
  up.events[day] ||= {};
  up.events[day][k] = (up.events[day][k] || 0) + n;
  const days = Object.keys(up.events).sort();
  while (days.length > 120) delete up.events[days.shift()];
}

export const fmtMoney = (n) => `${Math.round(n / 1000).toLocaleString('vi-VN')}K`;
export const fmtTime = (t) => new Date(t + 7 * 3600000).toISOString().replace(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+).*/, '$4:$5 ngày $3/$2');

// Số tiền khách đã trả cho key (gồm cả các lần nâng cấp); key tạo tay thì tính theo giá gói
export function paidForLicense(D, lic) {
  const sum = D.orders.filter(o => o.status === 'paid' && (o.licenseKey === lic.key || o.upgradeKey === lic.key)).reduce((s, o) => s + o.amount, 0);
  if (sum > 0) return sum;
  return D.plans.find(p => p.id === lic.planId)?.price || 0;
}

const comboPlan = (D) => D.plans.filter(p => !p.allGames && p.slots > 1).sort((a, b) => b.slots - a.slots)[0];
const allPlan = (D) => D.plans.find(p => p.allGames);
const singlePlan = (D) => D.plans.find(p => !p.allGames && p.slots === 1);

// Cửa sổ ưu đãi của key: bắt đầu khi khách đủ số ngày (đặt lần đầu lúc gửi email hoặc khách mở web)
export function offerWindow(up, lic, t = Date.now(), start = false) {
  const cfg = up.cfg;
  const base = Math.max(lic.createdAt || 0, up.startedAt || 0);
  if (!lic.offerStart && start && t >= (lic.createdAt || 0) + cfg.offerAfterDays * DAY) lic.offerStart = t;
  if (!lic.offerStart) return { active: false, until: 0, base };
  const until = lic.offerStart + cfg.offerHours * 3600000;
  return { active: t < until, until, base };
}

// Giá nâng cấp hiện tại cho 1 key. Trả về null nếu không nâng được.
export function upgradeQuote(D, up, lic, target, t = Date.now()) {
  if (!lic || lic.status !== 'active' || lic.allGames) return null;
  const paid = paidForLicense(D, lic);
  const w = offerWindow(up, lic, t);
  const visible = D.games.filter(g => g.visible).length;
  if (target === 'combo') {
    const p = comboPlan(D);
    if (!p || lic.slots >= p.slots) return null;
    const full = Math.max(0, p.price - paid);
    const off = w.active ? Math.min(up.cfg.comboOff, full) : 0;
    return { target, plan: p, full, price: Math.max(10000, full - off), off, until: w.active ? w.until : 0, need: Math.max(0, Math.min(p.slots, visible) - lic.games.length) };
  }
  if (target === 'all') {
    const p = allPlan(D);
    if (!p) return null;
    const full = Math.max(0, p.price - paid);
    const off = w.active ? Math.min(up.cfg.allOff, full) : 0;
    return { target, plan: p, full, price: Math.max(10000, full - off), off, until: w.active ? w.until : 0, need: 0 };
  }
  return null;
}

// Game mới đang trong thời gian giá riêng cho khách cũ
export function activeLaunches(D, up, t = Date.now()) {
  return up.launches.filter(l => t < l.at + up.cfg.newGameDays * DAY && D.games.some(g => g.id === l.gameId && g.visible));
}

// Mọi ưu đãi của 1 khách (dùng cho popup, trang tài khoản, email)
export function offersFor(D, up, user, t = Date.now(), { start = false } = {}) {
  const lics = D.licenses.filter(l => l.userId === user.id && l.status === 'active');
  if (!lics.length) return { licenses: [], newGames: [], hasAll: false };
  const hasAll = lics.some(l => l.allGames);
  const out = [];
  if (!hasAll) {
    for (const l of lics) {
      offerWindow(up, l, t, start);
      const combo = upgradeQuote(D, up, l, 'combo', t);
      const all = upgradeQuote(D, up, l, 'all', t);
      if (combo || all) out.push({ key: l.key, planName: D.plans.find(p => p.id === l.planId)?.name || l.planId, games: l.games, slots: l.slots, combo: combo && pub(combo), all: all && pub(all) });
    }
  }
  const owned = new Set(lics.flatMap(l => l.allGames ? D.games.map(g => g.id) : l.games));
  const newGames = hasAll ? [] : activeLaunches(D, up, t).filter(l => !owned.has(l.gameId)).map(l => {
    const g = D.games.find(x => x.id === l.gameId);
    return { id: g.id, name: g.name, image: g.image, price: up.cfg.newGamePrice, until: l.at + up.cfg.newGameDays * DAY };
  });
  return { licenses: out, newGames, hasAll };
}
const pub = (q) => ({ planId: q.plan.id, planName: q.plan.name, price: q.price, full: q.full, off: q.off, until: q.until, need: q.need, slots: q.plan.slots, allGames: Boolean(q.plan.allGames) });

// Ưu đãi đơn đầu tiên cho khách đã đăng ký nhưng chưa mua: giá giảm theo gói, có hạn
export function hasPaid(D, user) {
  return D.orders.some(o => o.userId === user.id && o.status === 'paid') || D.licenses.some(l => l.userId === user.id);
}
export function firstOffer(D, up, user, t = Date.now(), { start = false } = {}) {
  if (!user || hasPaid(D, user)) return null;
  const c = up.cfg;
  if (!user.firstStart && start && t >= (user.createdAt || 0) + c.firstAfterHours * 3600000) user.firstStart = t;
  if (!user.firstStart) return null;
  const until = user.firstStart + c.firstHours * 3600000;
  if (t >= until) return null;
  const prices = {};
  for (const p of D.plans) {
    const off = p.allGames ? c.firstOffAll : p.slots > 1 ? c.firstOffCombo : c.firstOffLe;
    prices[p.id] = { full: p.price, price: Math.max(10000, p.price - Math.min(off, p.price)), off: Math.min(off, p.price) };
  }
  if (!Object.values(prices).some(x => x.off > 0)) return null;
  return { until, prices };
}

// ---------- email ----------
const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Điền biến {ten}… ; dòng nào có biến trống (vd. khách đã là Combo nên không có {gia_combo}) thì bỏ dòng đó
export function fillTemplate(tpl, vars) {
  const sub = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? (vars[k] ?? '') : m));
  const body = tpl.body.split('\n').filter(line => {
    const keys = [...line.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
    return keys.every(k => !(k in vars) || (vars[k] !== '' && vars[k] != null));
  }).map(sub).join('\n');
  return { subject: sub(tpl.subject), body };
}

// Văn bản → HTML: dòng "[Chữ](/link)" thành nút bấm, link qua bộ đếm click
export function renderEmail({ body, brand, logo, base, track, unsubscribe, footer }) {
  const linkOf = (href) => track(href);
  const lines = body.split('\n');
  let html = '';
  let text = '';
  for (const raw of lines) {
    const line = raw.trimEnd();
    const btn = line.trim().match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (btn) {
      html += `<p style="margin:18px 0"><a href="${escHtml(linkOf(btn[2]))}" style="display:inline-block;background:#e8283a;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px">${escHtml(btn[1])}</a></p>`;
      text += `${btn[1]}: ${base}${btn[2]}\n`;
      continue;
    }
    if (!line.trim()) { html += '<div style="height:10px"></div>'; text += '\n'; continue; }
    const inl = escHtml(line).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, h) => `<a href="${escHtml(linkOf(h))}" style="color:#0e3d7a">${t}</a>`);
    html += `<p style="margin:0 0 6px;line-height:1.55">${inl}</p>`;
    text += `${line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `$1 (${base}$2)`)}\n`;
  }
  const page = `<!doctype html><html><body style="margin:0;background:#f2f4f8;font-family:Arial,Helvetica,sans-serif;color:#1d2433;font-size:15px">
<div style="max-width:560px;margin:0 auto;padding:24px 14px">
<div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
<div style="padding:18px 24px;border-bottom:1px solid #eef0f4">${logo ? `<img src="${escHtml(logo)}" alt="${escHtml(brand)}" height="40" style="height:40px">` : `<b style="font-size:20px">${escHtml(brand)}</b>`}</div>
<div style="padding:22px 24px">${html}</div></div>
<p style="font-size:12px;color:#8a93a6;text-align:center;margin:16px 0 0;line-height:1.5">${footer ? `${escHtml(footer)}<br>` : ''}Bạn nhận email này vì có tài khoản tại ${escHtml(brand)}. <a href="${escHtml(unsubscribe)}" style="color:#8a93a6">Không nhận email giới thiệu nữa</a></p>
</div>${track.pixel ? `<img src="${escHtml(track.pixel)}" width="1" height="1" alt="" style="display:block">` : ''}</body></html>`;
  text += `\n—\nKhông nhận email giới thiệu nữa: ${unsubscribe}\n`;
  return { html: page, text };
}
