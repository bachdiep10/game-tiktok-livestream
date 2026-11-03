// Website bán game + máy chủ license key.
// Chạy: npm install && npm start  →  http://localhost:8080 (trang bán), /admin (quản trị)
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DB } from './lib/db.js';
import * as payos from './lib/payos.js';
import { newKey, normalizeKey, loadKeyPair, signTicket, entitledGames, fillEmptySlots, movesInWindow } from './lib/license.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DB(DATA_DIR);
const D = db.data;
if (!D.secret) { D.secret = crypto.randomBytes(32).toString('hex'); db.saveNow(); }
const keys = loadKeyPair(DATA_DIR);

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));

// ---------- tiện ích ----------
const hmac = (data) => crypto.createHmac('sha256', D.secret).update(String(data)).digest('hex');
const orderToken = (code) => hmac(`order:${code}`).slice(0, 24);
const now = () => Date.now();
const fail = (res, status, message) => res.status(status).json({ ok: false, error: message });
const clean = (s, max = 200) => String(s ?? '').trim().slice(0, max);
const cleanPhone = (s) => String(s ?? '').replace(/[^0-9+]/g, '').slice(0, 15);
const visibleGames = () => D.games.filter(g => g.visible).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const findPlan = (id) => D.plans.find(p => p.id === id);
const findLicense = (k) => D.licenses.find(l => l.key === normalizeKey(k));
const findOrder = (code) => D.orders.find(o => String(o.code) === String(code));
const baseUrl = (req) => (D.settings.publicUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

// Giới hạn số lần gọi theo IP (chống dò key / dò mật khẩu)
const buckets = new Map();
function rateLimit(name, max, windowMs) {
  return (req, res, next) => {
    const k = `${name}:${req.ip}`;
    const t = now();
    const b = buckets.get(k) || { n: 0, reset: t + windowMs };
    if (t > b.reset) { b.n = 0; b.reset = t + windowMs; }
    b.n++;
    buckets.set(k, b);
    if (b.n > max) return fail(res, 429, 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.');
    next();
  };
}
setInterval(() => { const t = now(); for (const [k, b] of buckets) if (t > b.reset) buckets.delete(k); }, 60000).unref();

function publicSettings() {
  const s = D.settings;
  return {
    brandName: s.brandName, tagline: s.tagline, heroEyebrow: s.heroEyebrow, heroTitle: s.heroTitle,
    heroSubtitle: s.heroSubtitle, heroVideo: s.heroVideo, promo: s.promo,
    contactZalo: s.contactZalo, contactFacebook: s.contactFacebook, contactTiktok: s.contactTiktok, contactPhone: s.contactPhone,
    guideUrl: s.guideUrl, moveLimit: s.moveLimit, moveWindowDays: s.moveWindowDays,
  };
}

function publicGame(g) {
  const { id, name, tagline, description, features, image, video, isNew } = g;
  return { id, name, tagline, description, features, image, video, isNew };
}

function licenseView(l, { withDownloads = false } = {}) {
  const ids = entitledGames(l, visibleGames());
  const games = ids.map(id => D.games.find(g => g.id === id)).filter(Boolean).map(g => ({
    id: g.id, name: g.name, image: g.image, ...(withDownloads ? { download: g.download || '' } : {}),
  }));
  const plan = findPlan(l.planId);
  return {
    key: l.key, planId: l.planId, planName: plan?.name || l.planId, status: l.status,
    games, slots: l.slots, allGames: l.allGames,
    machineName: l.machineName || '', activatedAt: l.activatedAt || null, lastSeen: l.lastSeen || null,
    movesLeft: Math.max(0, D.settings.moveLimit - movesInWindow(l, D.settings.moveWindowDays)),
  };
}

// Tạo license cho đơn đã thanh toán (gọi nhiều lần vẫn chỉ tạo 1 key)
function fulfill(order, via) {
  if (order.status === 'paid' && order.licenseKey) return order;
  const plan = findPlan(order.planId);
  let key;
  do key = newKey(); while (findLicense(key));
  const lic = {
    key, planId: order.planId, slots: plan?.slots ?? order.games.length, allGames: Boolean(plan?.allGames),
    games: [...order.games], status: 'active', orderCode: order.code,
    customer: { ...order.customer }, machineId: '', machineName: '', activatedAt: null, lastSeen: null,
    moves: [], createdAt: now(), note: '',
  };
  // Combo khi cửa hàng chưa đủ game: tự thêm game có sẵn mà khách chưa chọn
  if (!lic.allGames && lic.slots > lic.games.length) {
    for (const g of visibleGames()) {
      if (lic.games.length >= lic.slots) break;
      if (!lic.games.includes(g.id)) lic.games.push(g.id);
    }
  }
  D.licenses.push(lic);
  order.status = 'paid';
  order.paidAt = now();
  order.paidVia = via;
  order.licenseKey = key;
  db.save();
  console.log(`[đơn ${order.code}] đã thanh toán (${via}) → key ${key}`);
  return order;
}

function orderView(o) {
  const plan = findPlan(o.planId);
  const lic = o.licenseKey ? findLicense(o.licenseKey) : null;
  const s = D.settings;
  const bank = s.bankCode && s.bankAccount ? {
    bankCode: s.bankCode, account: s.bankAccount, owner: s.bankOwner, content: o.transferContent,
    qr: `https://img.vietqr.io/image/${encodeURIComponent(s.bankCode)}-${encodeURIComponent(s.bankAccount)}-compact2.png?amount=${o.amount}&addInfo=${encodeURIComponent(o.transferContent)}&accountName=${encodeURIComponent(s.bankOwner || '')}`,
  } : null;
  return {
    code: o.code, status: o.status, amount: o.amount, planName: plan?.name || o.planId,
    gameNames: o.games.map(id => D.games.find(g => g.id === id)?.name || id),
    customer: { name: o.customer.name }, createdAt: o.createdAt, paidAt: o.paidAt || null,
    checkoutUrl: o.status === 'pending' ? (o.checkoutUrl || '') : '',
    bank: o.status === 'pending' ? bank : null,
    claimedAt: o.claimedAt || null,
    license: lic ? licenseView(lic, { withDownloads: true }) : null,
    guideUrl: s.guideUrl,
  };
}

// ---------- API công khai ----------
app.get('/api/catalog', (req, res) => {
  res.json({
    ok: true, settings: publicSettings(), plans: D.plans, games: visibleGames().map(publicGame), faq: D.faq,
    payment: { payos: payos.isConfigured(D.settings), bank: Boolean(D.settings.bankCode && D.settings.bankAccount) },
  });
});

app.post('/api/orders', rateLimit('order', 20, 600000), async (req, res) => {
  const plan = findPlan(req.body.planId);
  if (!plan) return fail(res, 400, 'Gói không hợp lệ.');
  const name = clean(req.body.name, 80);
  const phone = cleanPhone(req.body.phone);
  const email = clean(req.body.email, 120);
  if (!name) return fail(res, 400, 'Vui lòng nhập họ tên.');
  if (phone.replace(/\D/g, '').length < 9) return fail(res, 400, 'Số điện thoại / Zalo chưa đúng.');
  const avail = visibleGames().map(g => g.id);
  let games = [];
  if (!plan.allGames) {
    games = [...new Set((req.body.games || []).map(String))].filter(id => avail.includes(id));
    const need = Math.min(plan.slots, avail.length);
    if (games.length !== need) return fail(res, 400, `Vui lòng chọn đúng ${need} game.`);
  }
  if (!payos.isConfigured(D.settings) && !(D.settings.bankCode && D.settings.bankAccount)) {
    return fail(res, 503, 'Cửa hàng chưa cài phương thức thanh toán. Vui lòng liên hệ qua Zalo.');
  }
  let code;
  do code = Math.floor(now() / 1000) * 100 + crypto.randomInt(100); while (findOrder(code));
  const order = {
    code, planId: plan.id, games, amount: plan.price,
    customer: { name, phone, email }, status: 'pending', createdAt: now(),
    transferContent: `LG${code}`, checkoutUrl: '', licenseKey: '',
  };
  const token = orderToken(code);
  if (payos.isConfigured(D.settings)) {
    try {
      const back = `${baseUrl(req)}/don-hang.html?code=${code}&t=${token}`;
      const link = await payos.createPaymentLink(D.settings, {
        orderCode: code, amount: plan.price, description: `LG${code}`.slice(0, 25),
        returnUrl: back, cancelUrl: back, buyerName: name, buyerPhone: phone, buyerEmail: email,
      });
      order.checkoutUrl = link.checkoutUrl;
    } catch (e) {
      console.error(e.message);
      if (!(D.settings.bankCode && D.settings.bankAccount)) return fail(res, 502, 'Không tạo được link thanh toán, vui lòng thử lại.');
    }
  }
  D.orders.push(order);
  db.save();
  res.json({ ok: true, code, token, checkoutUrl: order.checkoutUrl });
});

function authOrder(req, res) {
  const o = findOrder(req.params.code);
  const t = String(req.query.t || '');
  if (!o || t.length !== 24 || !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(orderToken(o.code)))) {
    fail(res, 404, 'Không tìm thấy đơn hàng.');
    return null;
  }
  return o;
}

app.get('/api/orders/:code', rateLimit('orderview', 120, 60000), async (req, res) => {
  const o = authOrder(req, res);
  if (!o) return;
  if (o.status === 'pending' && payos.isConfigured(D.settings) && o.checkoutUrl) {
    try {
      const st = await payos.getPaymentStatus(D.settings, o.code);
      if (st.status === 'PAID' && Number(st.amountPaid ?? st.amount) >= o.amount) fulfill(o, 'payos');
    } catch (e) { /* bỏ qua, lần sau hỏi lại */ }
  }
  res.json({ ok: true, order: orderView(o) });
});

app.post('/api/orders/:code/claim', rateLimit('claim', 10, 600000), (req, res) => {
  const o = authOrder(req, res);
  if (!o) return;
  if (o.status === 'pending' && !o.claimedAt) { o.claimedAt = now(); db.save(); }
  res.json({ ok: true, order: orderView(o) });
});

// PayOS gọi về khi khách trả tiền xong
app.post('/api/payos/webhook', (req, res) => {
  if (!payos.isConfigured(D.settings) || !payos.verifyWebhook(D.settings, req.body)) {
    return res.json({ ok: true }); // PayOS gửi thử khi lưu URL webhook; luôn trả 200
  }
  const d = req.body.data;
  const o = findOrder(d.orderCode);
  if (o && req.body.code === '00' && Number(d.amount) >= o.amount) fulfill(o, 'payos');
  res.json({ ok: true });
});

// Khách tra cứu key: nhập key (hoặc mã đơn) + số điện thoại đã mua
function lookupLicense(query, phone) {
  const q = clean(query, 60);
  const p = cleanPhone(phone).replace(/\D/g, '');
  if (!q || p.length < 9) return null;
  let lic = findLicense(q);
  if (!lic) { const o = findOrder(q.replace(/\D/g, '')); if (o?.licenseKey) lic = findLicense(o.licenseKey); }
  if (!lic) return null;
  const lp = String(lic.customer?.phone || '').replace(/\D/g, '');
  return lp && lp.slice(-9) === p.slice(-9) ? lic : null;
}

app.post('/api/lookup', rateLimit('lookup', 15, 600000), (req, res) => {
  const lic = lookupLicense(req.body.query, req.body.phone);
  if (!lic) return fail(res, 404, 'Không tìm thấy. Kiểm tra lại key/mã đơn và số điện thoại đã dùng khi mua.');
  res.json({ ok: true, license: licenseView(lic, { withDownloads: true }) });
});

app.post('/api/lookup/move', rateLimit('move', 10, 600000), (req, res) => {
  const lic = lookupLicense(req.body.query, req.body.phone);
  if (!lic) return fail(res, 404, 'Không tìm thấy key.');
  if (lic.status !== 'active') return fail(res, 403, 'Key đang bị khoá, vui lòng liên hệ hỗ trợ.');
  if (!lic.machineId) return res.json({ ok: true, license: licenseView(lic), message: 'Key chưa gắn máy nào, bạn có thể kích hoạt trên máy mới ngay.' });
  if (movesInWindow(lic, D.settings.moveWindowDays) >= D.settings.moveLimit) {
    return fail(res, 403, `Bạn đã chuyển máy ${D.settings.moveLimit} lần trong ${D.settings.moveWindowDays} ngày. Vui lòng liên hệ hỗ trợ.`);
  }
  lic.moves = [...(lic.moves || []), now()];
  lic.machineId = ''; lic.machineName = '';
  db.save();
  res.json({ ok: true, license: licenseView(lic), message: 'Đã gỡ key khỏi máy cũ. Mở game trên máy mới và nhập key để kích hoạt.' });
});

// ---------- API cho game trên máy khách ----------
app.get('/api/license/public-key', (req, res) => res.type('text/plain').send(keys.publicPem));

app.post('/api/license/activate', rateLimit('activate', 60, 600000), (req, res) => {
  const lic = findLicense(req.body.key);
  const machineId = clean(req.body.machineId, 128);
  const game = clean(req.body.game, 60);
  if (!lic) return fail(res, 404, 'Key không tồn tại.');
  if (!/^[a-f0-9]{32,128}$/i.test(machineId)) return fail(res, 400, 'Mã máy không hợp lệ.');
  if (lic.status !== 'active') return fail(res, 403, 'Key đã bị khoá. Vui lòng liên hệ người bán.');
  const games = entitledGames(lic, visibleGames());
  if (game && !games.includes(game)) return fail(res, 403, 'Key này không bao gồm game này.');
  if (lic.machineId && lic.machineId !== machineId) {
    return res.status(409).json({
      ok: false, code: 'IN_USE',
      error: `Key đang dùng trên máy "${lic.machineName || 'khác'}". Vào trang web > Tra cứu & chuyển máy để chuyển sang máy này.`,
    });
  }
  if (!lic.machineId) {
    lic.machineId = machineId;
    lic.machineName = clean(req.body.machineName, 60);
    lic.activatedAt = now();
  }
  lic.lastSeen = now();
  lic.lastVersion = clean(req.body.version, 20);
  db.save();
  const ticket = signTicket(keys.privateKey, {
    key: lic.key, machineId, games, plan: lic.planId,
    iat: now(), exp: now() + D.settings.offlineDays * 86400000,
  });
  res.json({ ok: true, ticket, games, plan: lic.planId });
});

app.post('/api/license/release', rateLimit('release', 20, 600000), (req, res) => {
  const lic = findLicense(req.body.key);
  const machineId = clean(req.body.machineId, 128);
  if (!lic || !machineId || lic.machineId !== machineId) return fail(res, 404, 'Key không gắn với máy này.');
  lic.machineId = ''; lic.machineName = '';
  db.save();
  res.json({ ok: true });
});

// ---------- Quản trị ----------
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64).toString('hex');
const SESSION_HOURS = 12;

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function isAdmin(req) {
  const c = parseCookies(req).lg_admin || '';
  const [exp, ver, sig] = c.split('.');
  if (!exp || !sig || Number(exp) < now()) return false;
  const expect = hmac(`admin:${exp}:${ver}:${D.admin.passwordHash}`);
  return sig.length === expect.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
}
function setSession(req, res) {
  const exp = now() + SESSION_HOURS * 3600000;
  const ver = crypto.randomBytes(6).toString('hex');
  const sig = hmac(`admin:${exp}:${ver}:${D.admin.passwordHash}`);
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `lg_admin=${exp}.${ver}.${sig}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}${secure}`);
}
const needAdmin = (req, res, next) => (isAdmin(req) ? next() : fail(res, 401, 'Chưa đăng nhập.'));

app.get('/api/admin/status', (req, res) => {
  res.json({ ok: true, needsSetup: !D.admin.passwordHash, loggedIn: isAdmin(req), brandName: D.settings.brandName });
});

app.post('/api/admin/setup', rateLimit('login', 10, 600000), (req, res) => {
  if (D.admin.passwordHash) return fail(res, 403, 'Đã có mật khẩu.');
  const pw = String(req.body.password || '');
  if (pw.length < 8) return fail(res, 400, 'Mật khẩu cần ít nhất 8 ký tự.');
  D.admin.salt = crypto.randomBytes(16).toString('hex');
  D.admin.passwordHash = hashPw(pw, D.admin.salt);
  db.saveNow();
  setSession(req, res);
  res.json({ ok: true });
});

app.post('/api/admin/login', rateLimit('login', 10, 600000), (req, res) => {
  if (!D.admin.passwordHash) return fail(res, 400, 'Chưa tạo mật khẩu.');
  const h = hashPw(req.body.password || '', D.admin.salt);
  if (!crypto.timingSafeEqual(Buffer.from(h), Buffer.from(D.admin.passwordHash))) return fail(res, 401, 'Sai mật khẩu.');
  setSession(req, res);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'lg_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.use('/api/admin', (req, res, next) => (['/status', '/setup', '/login', '/logout'].includes(req.path) ? next() : needAdmin(req, res, next)));

app.post('/api/admin/password', (req, res) => {
  const pw = String(req.body.password || '');
  if (pw.length < 8) return fail(res, 400, 'Mật khẩu cần ít nhất 8 ký tự.');
  D.admin.salt = crypto.randomBytes(16).toString('hex');
  D.admin.passwordHash = hashPw(pw, D.admin.salt);
  db.saveNow();
  setSession(req, res);
  res.json({ ok: true });
});

app.get('/api/admin/overview', (req, res) => {
  const paid = D.orders.filter(o => o.status === 'paid');
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(dayStart); monthStart.setDate(1);
  const sum = (arr) => arr.reduce((s, o) => s + o.amount, 0);
  const byPlan = {};
  for (const o of paid) byPlan[o.planId] = (byPlan[o.planId] || 0) + 1;
  res.json({
    ok: true,
    revenue: { total: sum(paid), today: sum(paid.filter(o => o.paidAt >= dayStart)), month: sum(paid.filter(o => o.paidAt >= monthStart)) },
    orders: { paid: paid.length, pending: D.orders.filter(o => o.status === 'pending').length, claimed: D.orders.filter(o => o.status === 'pending' && o.claimedAt).length },
    licenses: { total: D.licenses.length, active: D.licenses.filter(l => l.machineId).length, locked: D.licenses.filter(l => l.status !== 'active').length },
    byPlan,
    payment: { payos: payos.isConfigured(D.settings), bank: Boolean(D.settings.bankCode && D.settings.bankAccount) },
  });
});

app.get('/api/admin/orders', (req, res) => {
  const list = [...D.orders].sort((a, b) => b.createdAt - a.createdAt).map(o => ({
    ...o, planName: findPlan(o.planId)?.name || o.planId,
    gameNames: o.games.map(id => D.games.find(g => g.id === id)?.name || id),
    link: `/don-hang.html?code=${o.code}&t=${orderToken(o.code)}`,
  }));
  res.json({ ok: true, orders: list });
});

app.post('/api/admin/orders/:code/mark-paid', (req, res) => {
  const o = findOrder(req.params.code);
  if (!o) return fail(res, 404, 'Không có đơn.');
  if (o.status === 'cancelled') o.status = 'pending';
  fulfill(o, 'admin');
  res.json({ ok: true, order: o });
});

app.post('/api/admin/orders/:code/cancel', (req, res) => {
  const o = findOrder(req.params.code);
  if (!o) return fail(res, 404, 'Không có đơn.');
  if (o.status === 'paid') return fail(res, 400, 'Đơn đã thanh toán; muốn thu hồi thì khoá key.');
  o.status = 'cancelled';
  db.save();
  res.json({ ok: true });
});

app.get('/api/admin/licenses', (req, res) => {
  const list = [...D.licenses].sort((a, b) => b.createdAt - a.createdAt).map(l => ({
    ...l, machineId: l.machineId ? `${l.machineId.slice(0, 8)}…` : '',
    planName: findPlan(l.planId)?.name || l.planId,
    gameNames: entitledGames(l, visibleGames()).map(id => D.games.find(g => g.id === id)?.name || id),
    movesRecent: movesInWindow(l, D.settings.moveWindowDays),
  }));
  res.json({ ok: true, licenses: list });
});

app.post('/api/admin/licenses', (req, res) => {
  const plan = findPlan(req.body.planId);
  if (!plan) return fail(res, 400, 'Chọn gói.');
  const count = Math.min(100, Math.max(1, Number(req.body.count) || 1));
  const games = plan.allGames ? [] : [...new Set(req.body.games || [])].filter(id => D.games.some(g => g.id === id)).slice(0, plan.slots);
  const created = [];
  for (let i = 0; i < count; i++) {
    let key;
    do key = newKey(); while (findLicense(key));
    const lic = {
      key, planId: plan.id, slots: plan.slots, allGames: Boolean(plan.allGames), games: [...games],
      status: 'active', orderCode: null,
      customer: { name: clean(req.body.name, 80), phone: cleanPhone(req.body.phone), email: clean(req.body.email, 120) },
      machineId: '', machineName: '', activatedAt: null, lastSeen: null, moves: [], createdAt: now(),
      note: clean(req.body.note, 300) || 'Tạo tay',
    };
    D.licenses.push(lic);
    created.push(key);
  }
  db.save();
  res.json({ ok: true, keys: created });
});

app.patch('/api/admin/licenses/:key', (req, res) => {
  const lic = findLicense(req.params.key);
  if (!lic) return fail(res, 404, 'Không có key.');
  const b = req.body;
  if (b.status && ['active', 'locked'].includes(b.status)) lic.status = b.status;
  if (b.note !== undefined) lic.note = clean(b.note, 300);
  if (b.customer) lic.customer = { name: clean(b.customer.name, 80), phone: cleanPhone(b.customer.phone), email: clean(b.customer.email, 120) };
  if (Array.isArray(b.games) && !lic.allGames) lic.games = [...new Set(b.games)].filter(id => D.games.some(g => g.id === id));
  if (b.planId && findPlan(b.planId)) {
    const p = findPlan(b.planId);
    lic.planId = p.id; lic.slots = p.slots; lic.allGames = Boolean(p.allGames);
  }
  db.save();
  res.json({ ok: true });
});

app.post('/api/admin/licenses/:key/reset-machine', (req, res) => {
  const lic = findLicense(req.params.key);
  if (!lic) return fail(res, 404, 'Không có key.');
  lic.machineId = ''; lic.machineName = '';
  db.save();
  res.json({ ok: true });
});

app.delete('/api/admin/licenses/:key', (req, res) => {
  const i = D.licenses.findIndex(l => l.key === normalizeKey(req.params.key));
  if (i < 0) return fail(res, 404, 'Không có key.');
  D.licenses.splice(i, 1);
  db.save();
  res.json({ ok: true });
});

const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

function applyGame(g, b) {
  for (const f of ['name', 'tagline', 'image', 'video', 'download']) if (b[f] !== undefined) g[f] = clean(b[f], f === 'name' ? 80 : 500);
  if (b.description !== undefined) g.description = clean(b.description, 2000);
  if (Array.isArray(b.features)) g.features = b.features.map(x => clean(x, 120)).filter(Boolean).slice(0, 10);
  if (b.visible !== undefined) g.visible = Boolean(b.visible);
  if (b.isNew !== undefined) g.isNew = Boolean(b.isNew);
  if (b.order !== undefined) g.order = Number(b.order) || 0;
}

app.get('/api/admin/games', (req, res) => res.json({ ok: true, games: D.games }));

app.post('/api/admin/games', (req, res) => {
  const id = slug(req.body.id || req.body.name);
  if (!id) return fail(res, 400, 'Nhập tên game.');
  if (D.games.some(g => g.id === id)) return fail(res, 400, `Mã game "${id}" đã có.`);
  const g = { id, name: '', tagline: '', description: '', features: [], image: '', video: '', download: '', visible: true, isNew: true, order: D.games.length + 1, createdAt: now() };
  applyGame(g, req.body);
  D.games.push(g);
  const filled = g.visible ? fillEmptySlots(D.licenses, g.id) : 0;
  db.save();
  res.json({ ok: true, game: g, filledCombo: filled });
});

app.patch('/api/admin/games/:id', (req, res) => {
  const g = D.games.find(x => x.id === req.params.id);
  if (!g) return fail(res, 404, 'Không có game.');
  const wasVisible = g.visible;
  applyGame(g, req.body);
  const filled = !wasVisible && g.visible ? fillEmptySlots(D.licenses, g.id) : 0;
  db.save();
  res.json({ ok: true, game: g, filledCombo: filled });
});

app.delete('/api/admin/games/:id', (req, res) => {
  const i = D.games.findIndex(x => x.id === req.params.id);
  if (i < 0) return fail(res, 404, 'Không có game.');
  if (D.licenses.some(l => l.games.includes(req.params.id))) return fail(res, 400, 'Đã có key dùng game này. Hãy ẩn game thay vì xoá.');
  D.games.splice(i, 1);
  db.save();
  res.json({ ok: true });
});

app.get('/api/admin/config', (req, res) => {
  res.json({ ok: true, settings: D.settings, plans: D.plans, faq: D.faq, publicKey: keys.publicPem });
});

app.put('/api/admin/settings', (req, res) => {
  const b = req.body || {};
  for (const [k, v] of Object.entries(b)) {
    if (!(k in D.settings)) continue;
    D.settings[k] = typeof D.settings[k] === 'number' ? Math.max(0, Number(v) || 0) : clean(v, 1000);
  }
  db.save();
  res.json({ ok: true, settings: D.settings });
});

app.put('/api/admin/plans', (req, res) => {
  const plans = Array.isArray(req.body.plans) ? req.body.plans : null;
  if (!plans) return fail(res, 400, 'Dữ liệu sai.');
  for (const p of plans) {
    const cur = findPlan(p.id);
    if (!cur) continue;
    cur.name = clean(p.name, 60) || cur.name;
    cur.price = Math.max(1000, Math.round(Number(p.price) || cur.price));
    cur.subtitle = clean(p.subtitle, 120);
    cur.badge = clean(p.badge, 40);
    cur.highlight = Boolean(p.highlight);
    if (!cur.allGames) cur.slots = Math.max(1, Math.min(50, Number(p.slots) || cur.slots));
    if (Array.isArray(p.features)) cur.features = p.features.map(x => clean(x, 120)).filter(Boolean).slice(0, 10);
  }
  db.save();
  res.json({ ok: true, plans: D.plans });
});

app.put('/api/admin/faq', (req, res) => {
  if (!Array.isArray(req.body.faq)) return fail(res, 400, 'Dữ liệu sai.');
  D.faq = req.body.faq.map(x => ({ q: clean(x.q, 200), a: clean(x.a, 2000) })).filter(x => x.q && x.a).slice(0, 30);
  db.save();
  res.json({ ok: true, faq: D.faq });
});

const UPLOAD_TYPES = { '.jpg': 1, '.jpeg': 1, '.png': 1, '.webp': 1, '.gif': 1, '.mp4': 1, '.webm': 1 };
app.post('/api/admin/upload', express.raw({ type: '*/*', limit: '80mb' }), (req, res) => {
  const ext = path.extname(String(req.query.name || '')).toLowerCase();
  if (!UPLOAD_TYPES[ext]) return fail(res, 400, 'Chỉ nhận ảnh (jpg, png, webp, gif) hoặc video (mp4, webm).');
  if (!req.body?.length) return fail(res, 400, 'File rỗng.');
  const name = `${Date.now().toString(36)}-${slug(path.basename(String(req.query.name), ext)) || 'file'}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), req.body);
  res.json({ ok: true, url: `/uploads/${name}` });
});

app.use('/api', (req, res) => fail(res, 404, 'Không có API này.'));

// ---------- file tĩnh ----------
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api')) return fail(res, err.status || 500, err.type === 'entity.too.large' ? 'File quá lớn.' : 'Lỗi máy chủ.');
  res.status(500).send('Lỗi máy chủ');
});

app.listen(PORT, () => {
  console.log(`\n  Cửa hàng:  http://localhost:${PORT}`);
  console.log(`  Quản trị:  http://localhost:${PORT}/admin/`);
  if (!D.admin.passwordHash) console.log('  Lần đầu vào trang quản trị sẽ được yêu cầu tạo mật khẩu.');
  if (!payos.isConfigured(D.settings) && !D.settings.bankCode) console.log('  Chưa cài thanh toán: vào Quản trị > Cài đặt để nhập PayOS hoặc tài khoản ngân hàng.\n');
});

process.on('SIGINT', () => { db.saveNow(); process.exit(0); });
process.on('SIGTERM', () => { db.saveNow(); process.exit(0); });
