// Website bán game + máy chủ license key.
// Chạy: npm install && npm start  →  http://localhost:8080 (trang bán), /admin (quản trị)
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DB } from './lib/db.js';
import { createSeo } from './lib/seo.js';
import * as payos from './lib/payos.js';
import { parseBankEmail, findOrderCode, fetchNewMails } from './lib/bankmail.js';
import { newKey, normalizeKey, loadKeyPair, signTicket, entitledGames, fillEmptySlots, movesInWindow } from './lib/license.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
// Thư mục dữ liệu (đơn hàng, key, ảnh tải lên) phải nằm NGOÀI thư mục code để không bị xoá khi cập nhật.
// Trên Hostinger, code nằm ở .../domains/<tên miền>/hbuilds/... → dữ liệu để ở .../domains/<tên miền>/livegame-data
function defaultDataDir() {
  const env = process.env.DATA_DIR;
  if (env) return env.startsWith('~') ? path.join(os.homedir(), env.slice(1)) : env;
  const i = __dirname.indexOf(`${path.sep}hbuilds${path.sep}`);
  if (i > 0) return path.join(__dirname.slice(0, i), 'livegame-data');
  return path.join(__dirname, 'data');
}
const DATA_DIR = defaultDataDir();
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const FILES_DIR = path.join(DATA_DIR, 'files'); // file game: chỉ tải được khi đã mua
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(FILES_DIR, { recursive: true });

const db = new DB(DATA_DIR);
const D = db.data;
if (!D.secret) { D.secret = crypto.randomBytes(32).toString('hex'); db.saveNow(); }
const keys = loadKeyPair(DATA_DIR);

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
// Nhiều tiến trình cùng chạy: mỗi yêu cầu API/tải game giữ khoá dữ liệu tới khi trả lời xong
app.use(async (req, res, next) => {
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/tai-ve/')) return next();
  const release = await db.acquire();
  res.locals.release = release;
  res.on('finish', release);
  res.on('close', release);
  next();
});

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
    guideUrl: s.guideUrl, moveLimit: s.moveLimit, moveWindowDays: s.moveWindowDays, offlineDays: s.offlineDays,
    sellerName: s.sellerName, sellerEmail: s.sellerEmail, sellerAddress: s.sellerAddress, sellerTaxId: s.sellerTaxId, refundDays: s.refundDays,
  };
}

function publicGame(g) {
  const { id, name, tagline, description, features, image, video, isNew, guide, guideVideo } = g;
  return { id, name, tagline, description, features, image, video, isNew, guide, guideVideo };
}

function licenseView(l, { withDownloads = false } = {}) {
  const ids = entitledGames(l, visibleGames());
  const games = ids.map(id => D.games.find(g => g.id === id)).filter(Boolean).map(g => ({
    id: g.id, name: g.name, image: g.image,
    ...(withDownloads ? {
      download: g.file || g.download ? `/tai-ve/${g.id}` : '', version: g.version || '',
      fileSize: g.file?.size || 0, guide: g.guide || '', guideVideo: g.guideVideo || '',
    } : {}),
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
    moves: [], createdAt: now(), note: '', userId: order.userId || '',
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
    license: lic ? (v => ({ ...v, games: v.games.map(g => ({ ...g, download: g.download ? `${g.download}?code=${o.code}&t=${orderToken(o.code)}` : '' })) }))(licenseView(lic, { withDownloads: true })) : null,
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
  const user = currentUser(req);
  if (!user) return fail(res, 401, 'Vui lòng đăng nhập hoặc đăng ký tài khoản để mua.');
  const { name, phone, email } = user;
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
    transferContent: `LG${code}`, checkoutUrl: '', licenseKey: '', userId: user.id,
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

function moveMachine(lic) {
  if (lic.status !== 'active') return { error: 'Key đang bị khoá, vui lòng liên hệ hỗ trợ.' };
  if (!lic.machineId) return { message: 'Key chưa gắn máy nào, bạn có thể kích hoạt trên máy mới ngay.' };
  if (movesInWindow(lic, D.settings.moveWindowDays) >= D.settings.moveLimit) {
    return { error: `Bạn đã chuyển máy ${D.settings.moveLimit} lần trong ${D.settings.moveWindowDays} ngày. Vui lòng liên hệ hỗ trợ.` };
  }
  lic.moves = [...(lic.moves || []), now()];
  lic.machineId = ''; lic.machineName = '';
  db.save();
  return { message: 'Đã gỡ key khỏi máy cũ. Mở game trên máy mới và nhập key để kích hoạt.' };
}

app.post('/api/lookup/move', rateLimit('move', 10, 600000), (req, res) => {
  const lic = lookupLicense(req.body.query, req.body.phone);
  if (!lic) return fail(res, 404, 'Không tìm thấy key.');
  const r = moveMachine(lic);
  if (r.error) return fail(res, 403, r.error);
  res.json({ ok: true, license: licenseView(lic), message: r.message });
});

// ---------- Tài khoản khách hàng ----------
const hashUserPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64).toString('hex');
const normPhone = (p) => cleanPhone(p).replace(/\D/g, '').replace(/^84/, '0');
const findUser = (id) => D.users.find(u => u.id === id);
function findUserByLogin(login) {
  const l = String(login || '').trim().toLowerCase();
  if (!l) return null;
  if (l.includes('@')) return D.users.find(u => u.email && u.email.toLowerCase() === l) || null;
  const p = normPhone(l);
  return p.length >= 9 ? D.users.find(u => normPhone(u.phone) === p) || null : null;
}
function userSig(u, exp) { return hmac(`user:${u.id}:${exp}:${u.passHash.slice(0, 16)}`); }
function currentUser(req) {
  const c = parseCookies(req).lg_user || '';
  const [id, exp, sig] = c.split('.');
  const u = id && findUser(id);
  if (!u || !exp || Number(exp) < now() || !sig) return null;
  const expect = userSig(u, exp);
  return sig.length === expect.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect)) ? u : null;
}
const USER_DAYS = 30;
function setUserSession(req, res, u) {
  const exp = now() + USER_DAYS * 86400000;
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `lg_user=${u.id}.${exp}.${userSig(u, exp)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${USER_DAYS * 86400}${secure}`);
}
const needUser = (req, res, next) => { const u = currentUser(req); if (!u) return fail(res, 401, 'Vui lòng đăng nhập.'); req.user = u; next(); };
const userPublic = (u) => ({ id: u.id, name: u.name, phone: u.phone, email: u.email, createdAt: u.createdAt });

app.post('/api/account/register', rateLimit('register', 10, 600000), (req, res) => {
  const name = clean(req.body.name, 80);
  const phone = cleanPhone(req.body.phone);
  const email = clean(req.body.email, 120).toLowerCase();
  const pw = String(req.body.password || '');
  if (!name) return fail(res, 400, 'Vui lòng nhập họ tên.');
  if (normPhone(phone).length < 9) return fail(res, 400, 'Số điện thoại chưa đúng.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(res, 400, email ? 'Email chưa đúng.' : 'Vui lòng nhập email.');
  if (pw.length < 6) return fail(res, 400, 'Mật khẩu cần ít nhất 6 ký tự.');
  if (findUserByLogin(phone)) return fail(res, 400, 'Số điện thoại này đã có tài khoản. Hãy đăng nhập.');
  if (findUserByLogin(email)) return fail(res, 400, 'Email này đã có tài khoản. Hãy đăng nhập.');
  const salt = crypto.randomBytes(16).toString('hex');
  const u = { id: crypto.randomBytes(8).toString('hex'), name, phone, email, salt, passHash: hashUserPw(pw, salt), createdAt: now(), lastLogin: now() };
  D.users.push(u);
  db.save();
  setUserSession(req, res, u);
  res.json({ ok: true, user: userPublic(u) });
});

app.post('/api/account/login', rateLimit('ulogin', 15, 600000), (req, res) => {
  const u = findUserByLogin(req.body.login);
  const ok = u && crypto.timingSafeEqual(Buffer.from(hashUserPw(req.body.password || '', u.salt)), Buffer.from(u.passHash));
  if (!ok) return fail(res, 401, 'Sai số điện thoại/email hoặc mật khẩu.');
  u.lastLogin = now();
  db.save();
  setUserSession(req, res, u);
  res.json({ ok: true, user: userPublic(u) });
});

app.post('/api/account/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'lg_user=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/account/me', (req, res) => {
  const u = currentUser(req);
  if (!u) return res.json({ ok: true, user: null });
  const orders = D.orders.filter(o => o.userId === u.id).sort((a, b) => b.createdAt - a.createdAt).map(o => ({
    code: o.code, status: o.status, amount: o.amount, planName: findPlan(o.planId)?.name || o.planId,
    gameNames: o.games.map(id => D.games.find(g => g.id === id)?.name || id), createdAt: o.createdAt, paidAt: o.paidAt || null,
    claimedAt: o.claimedAt || null, licenseKey: o.licenseKey || '', link: `/don-hang.html?code=${o.code}&t=${orderToken(o.code)}`,
  }));
  const licenses = D.licenses.filter(l => l.userId === u.id).sort((a, b) => b.createdAt - a.createdAt).map(l => licenseView(l, { withDownloads: true }));
  res.json({ ok: true, user: userPublic(u), orders, licenses, guideUrl: D.settings.guideUrl });
});

// Thêm key mua trước đó (hoặc người bán gửi qua Zalo) vào tài khoản: cần key + SĐT lúc mua
app.post('/api/account/claim', rateLimit('claim-key', 15, 600000), needUser, (req, res) => {
  const lic = lookupLicense(req.body.key, req.body.phone);
  if (!lic) return fail(res, 404, 'Không tìm thấy key, hoặc số điện thoại không khớp với lúc mua.');
  if (lic.userId && lic.userId !== req.user.id) return fail(res, 403, 'Key này đã thuộc tài khoản khác. Vui lòng liên hệ hỗ trợ.');
  lic.userId = req.user.id;
  if (lic.orderCode) { const o = findOrder(lic.orderCode); if (o && !o.userId) o.userId = req.user.id; }
  db.save();
  res.json({ ok: true });
});

app.post('/api/account/move', rateLimit('move', 10, 600000), needUser, (req, res) => {
  const lic = findLicense(req.body.key);
  if (!lic || lic.userId !== req.user.id) return fail(res, 404, 'Không tìm thấy key trong tài khoản.');
  const r = moveMachine(lic);
  if (r.error) return fail(res, 403, r.error);
  res.json({ ok: true, message: r.message });
});

app.post('/api/account/profile', needUser, (req, res) => {
  const u = req.user;
  const b = req.body;
  if (b.name !== undefined) u.name = clean(b.name, 80) || u.name;
  if (b.email !== undefined) {
    const email = clean(b.email, 120).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(res, 400, email ? 'Email chưa đúng.' : 'Vui lòng nhập email.');
    const other = email && findUserByLogin(email);
    if (other && other.id !== u.id) return fail(res, 400, 'Email đã dùng cho tài khoản khác.');
    u.email = email;
  }
  if (b.newPassword) {
    if (!crypto.timingSafeEqual(Buffer.from(hashUserPw(b.oldPassword || '', u.salt)), Buffer.from(u.passHash))) return fail(res, 400, 'Mật khẩu cũ không đúng.');
    if (String(b.newPassword).length < 6) return fail(res, 400, 'Mật khẩu mới cần ít nhất 6 ký tự.');
    u.salt = crypto.randomBytes(16).toString('hex');
    u.passHash = hashUserPw(b.newPassword, u.salt);
    setUserSession(req, res, u);
  }
  db.save();
  res.json({ ok: true, user: userPublic(u) });
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
    payment: { payos: payos.isConfigured(D.settings), bank: Boolean(D.settings.bankCode && D.settings.bankAccount), email: imapReady() },
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

// ---------- Tự xác nhận chuyển khoản qua email biến động số dư ----------
const imapReady = () => Boolean(D.settings.imapEnabled && D.settings.imapUser && D.settings.imapPass);

// Ghi 1 giao dịch tiền vào; khớp mã đơn LG<số> và đủ tiền thì tự trả key. Trả về bản ghi (hoặc null nếu trùng).
function recordBankTxn({ messageId, amount, content, receivedAt, source = 'email' }) {
  if (messageId && D.bankTxns.some(t => t.messageId === messageId)) return null;
  const t = {
    id: (D.bankTxns.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1,
    messageId: messageId || '', source, amount, content: clean(content, 300),
    orderCode: null, status: 'unmatched', note: '', receivedAt: receivedAt || now(), createdAt: now(),
  };
  const code = findOrderCode(content);
  const o = code && findOrder(code);
  if (!code) t.note = 'Không thấy mã đơn trong nội dung';
  else if (!o) t.note = `Không có đơn #${code}`;
  else {
    t.orderCode = o.code;
    if (o.status === 'paid') t.note = 'Đơn này đã thanh toán trước đó';
    else if (amount < o.amount) t.note = `Thiếu tiền: đơn ${o.amount.toLocaleString('vi-VN')}đ`;
    else {
      if (o.status === 'cancelled') o.status = 'pending';
      fulfill(o, 'bank');
      t.status = 'matched';
    }
  }
  D.bankTxns.push(t);
  if (D.bankTxns.length > 2000) D.bankTxns.splice(0, D.bankTxns.length - 2000);
  db.save();
  console.log(`[ngân hàng] +${amount} "${t.content}" → ${t.status}${t.note ? ` (${t.note})` : ''}`);
  return t;
}

let bankBusy = false;
async function checkBankEmails() {
  if (bankBusy || !imapReady()) return { skipped: true };
  bankBusy = true;
  let release = null;
  db.refresh();
  const s = D.settings;
  let added = 0, matched = 0;
  try {
    const r = await fetchNewMails({ host: s.imapHost, port: s.imapPort, user: s.imapUser, pass: s.imapPass, folder: s.imapFolder, from: s.imapFrom }, D.bank.state);
    release = await db.acquire(); // khoá dữ liệu trong lúc ghi giao dịch (đã nạp lại bản mới nhất)
    for (const m of r.mails) {
      const p = parseBankEmail(m.text);
      if (!p || !p.credit) continue;
      const t = recordBankTxn({ messageId: m.messageId, amount: p.amount, content: p.content, receivedAt: m.date });
      if (t) { added++; if (t.status === 'matched') matched++; }
    }
    D.bank.state = r.state;
    D.bank.lastError = '';
  } catch (e) {
    D.bank.lastError = String(e.responseText || e.message || e).slice(0, 300);
    console.error('[ngân hàng] lỗi đọc email:', D.bank.lastError);
  } finally {
    if (!release) { release = await db.acquire(); }
    D.bank.lastRun = now();
    db.save();
    release();
    bankBusy = false;
  }
  return { added, matched, error: D.bank.lastError };
}
setInterval(() => { checkBankEmails().catch(() => {}); }, 60000).unref();
setTimeout(() => { checkBankEmails().catch(() => {}); }, 5000).unref();

app.get('/api/admin/bank', (req, res) => {
  const list = [...D.bankTxns].sort((a, b) => b.receivedAt - a.receivedAt).slice(0, 300);
  res.json({ ok: true, txns: list, enabled: Boolean(D.settings.imapEnabled), ready: imapReady(), lastRun: D.bank.lastRun, lastError: D.bank.lastError });
});

app.post('/api/admin/bank/check', async (req, res) => {
  if (!imapReady()) return fail(res, 400, 'Chưa bật hoặc chưa nhập đủ Gmail và mật khẩu ứng dụng trong Cài đặt.');
  res.locals.release(); // nhả khoá: việc đọc email tự khoá khi ghi
  while (bankBusy) await new Promise(r => setTimeout(r, 300));
  res.json({ ok: true, ...(await checkBankEmails()) });
});

app.post('/api/admin/bank/test-parse', (req, res) => {
  const p = parseBankEmail(String(req.body.text || '').slice(0, 20000));
  if (!p) return res.json({ ok: true, result: null });
  const code = findOrderCode(p.content);
  // "Ghi nhận": dùng khi email bị sót, admin dán email vào để xử lý như email tự đọc (dán lại lần 2 không cộng trùng)
  if (req.body.record) {
    if (!p.credit) return fail(res, 400, 'Đây là giao dịch tiền ra, không ghi nhận.');
    const id = 'paste-' + crypto.createHash('sha256').update(String(req.body.text)).digest('hex').slice(0, 24);
    const t = recordBankTxn({ messageId: id, amount: p.amount, content: p.content, source: 'paste' });
    if (!t) return fail(res, 400, 'Email này đã ghi nhận rồi.');
    return res.json({ ok: true, txn: t });
  }
  const o = code && findOrder(code);
  res.json({ ok: true, result: { ...p, orderCode: code, order: o ? { code: o.code, amount: o.amount, status: o.status } : null } });
});

// Giao dịch sai nội dung: admin chọn đơn để trả key
app.post('/api/admin/bank/:id/assign', (req, res) => {
  const t = D.bankTxns.find(x => x.id === Number(req.params.id));
  if (!t) return fail(res, 404, 'Không có giao dịch.');
  if (t.status === 'matched' || t.status === 'manual') return fail(res, 400, 'Giao dịch này đã xử lý.');
  const o = findOrder(String(req.body.orderCode || '').replace(/\D/g, ''));
  if (!o) return fail(res, 404, 'Không tìm thấy đơn.');
  if (o.status === 'cancelled') o.status = 'pending';
  fulfill(o, 'bank-manual');
  Object.assign(t, { status: 'manual', orderCode: o.code, note: `Admin gán vào đơn #${o.code}` });
  db.save();
  res.json({ ok: true });
});

app.post('/api/admin/bank/:id/ignore', (req, res) => {
  const t = D.bankTxns.find(x => x.id === Number(req.params.id));
  if (!t) return fail(res, 404, 'Không có giao dịch.');
  if (t.status === 'matched' || t.status === 'manual') return fail(res, 400, 'Giao dịch này đã xử lý.');
  t.status = 'ignored';
  db.save();
  res.json({ ok: true });
});

app.get('/api/admin/licenses', (req, res) => {
  const list = [...D.licenses].sort((a, b) => b.createdAt - a.createdAt).map(l => ({
    ...l, machineId: l.machineId ? `${l.machineId.slice(0, 8)}…` : '',
    planName: findPlan(l.planId)?.name || l.planId,
    gameNames: entitledGames(l, visibleGames()).map(id => D.games.find(g => g.id === id)?.name || id),
    movesRecent: movesInWindow(l, D.settings.moveWindowDays),
    owner: l.userId ? (u => u ? `${u.name} · ${u.phone}` : '')(findUser(l.userId)) : '',
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
      userId: (req.body.phone && findUserByLogin(req.body.phone)?.id) || '',
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

// Đổi key mới (khi khách làm lộ key): key cũ hết dùng được, quyền lợi giữ nguyên
app.post('/api/admin/licenses/:key/reissue', (req, res) => {
  const lic = findLicense(req.params.key);
  if (!lic) return fail(res, 404, 'Không có key.');
  let key;
  do key = newKey(); while (findLicense(key));
  const old = lic.key;
  lic.key = key;
  lic.machineId = ''; lic.machineName = '';
  lic.replaced = [...(lic.replaced || []), { key: old, at: now() }];
  for (const o of D.orders) if (o.licenseKey === old) o.licenseKey = key;
  db.save();
  res.json({ ok: true, key, old });
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
  for (const f of ['name', 'tagline', 'image', 'video', 'download', 'guideVideo', 'version']) if (b[f] !== undefined) g[f] = clean(b[f], f === 'name' ? 80 : 500);
  if (b.guide !== undefined) g.guide = clean(b.guide, 8000);
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

app.post('/api/admin/games/:id/file', express.raw({ type: () => true, limit: '500mb' }), (req, res) => {
  const g = D.games.find(x => x.id === req.params.id);
  if (!g) return fail(res, 404, 'Không có game.');
  const ext = path.extname(String(req.query.name || '')).toLowerCase();
  if (!['.zip', '.exe', '.rar', '.7z'].includes(ext)) return fail(res, 400, 'Chỉ nhận file .zip, .exe, .rar, .7z');
  if (!req.body?.length) return fail(res, 400, 'File rỗng.');
  const stored = `${g.id}-${Date.now().toString(36)}${ext}`;
  fs.writeFileSync(path.join(FILES_DIR, stored), req.body);
  if (g.file?.stored) try { fs.unlinkSync(path.join(FILES_DIR, g.file.stored)); } catch { /* đã xoá */ }
  g.file = { stored, name: path.basename(String(req.query.name)).slice(0, 120), size: req.body.length, uploadedAt: now() };
  db.save();
  res.json({ ok: true, file: g.file });
});

app.delete('/api/admin/games/:id/file', (req, res) => {
  const g = D.games.find(x => x.id === req.params.id);
  if (!g?.file) return fail(res, 404, 'Không có file.');
  try { fs.unlinkSync(path.join(FILES_DIR, g.file.stored)); } catch { /* đã xoá */ }
  delete g.file;
  db.save();
  res.json({ ok: true });
});

app.delete('/api/admin/games/:id', (req, res) => {
  const i = D.games.findIndex(x => x.id === req.params.id);
  if (i < 0) return fail(res, 404, 'Không có game.');
  if (D.licenses.some(l => l.games.includes(req.params.id))) return fail(res, 400, 'Đã có key dùng game này. Hãy ẩn game thay vì xoá.');
  D.games.splice(i, 1);
  db.save();
  res.json({ ok: true });
});

app.get('/api/admin/users', (req, res) => {
  const list = [...D.users].sort((a, b) => b.createdAt - a.createdAt).map(u => ({
    ...userPublic(u), lastLogin: u.lastLogin,
    orders: D.orders.filter(o => o.userId === u.id).length,
    paid: D.orders.filter(o => o.userId === u.id && o.status === 'paid').reduce((s, o) => s + o.amount, 0),
    keys: D.licenses.filter(l => l.userId === u.id).map(l => l.key),
  }));
  res.json({ ok: true, users: list });
});

app.post('/api/admin/users/:id/reset-password', (req, res) => {
  const u = findUser(req.params.id);
  if (!u) return fail(res, 404, 'Không có khách này.');
  const pw = crypto.randomBytes(4).toString('hex');
  u.salt = crypto.randomBytes(16).toString('hex');
  u.passHash = hashUserPw(pw, u.salt);
  db.save();
  res.json({ ok: true, password: pw });
});

app.patch('/api/admin/licenses/:key/owner', (req, res) => {
  const lic = findLicense(req.params.key);
  if (!lic) return fail(res, 404, 'Không có key.');
  const u = req.body.login ? findUserByLogin(req.body.login) : null;
  if (req.body.login && !u) return fail(res, 404, 'Không tìm thấy tài khoản với SĐT/email này.');
  lic.userId = u ? u.id : '';
  db.save();
  res.json({ ok: true });
});

app.get('/api/admin/config', (req, res) => {
  res.json({ ok: true, settings: { ...D.settings, imapPass: '' }, imapPassSet: Boolean(D.settings.imapPass), plans: D.plans, faq: D.faq, publicKey: keys.publicPem });
});

app.put('/api/admin/settings', (req, res) => {
  const b = req.body || {};
  // Đổi Gmail/thư mục thì đọc lại từ đầu (2 ngày gần nhất)
  if ((b.imapUser !== undefined && clean(b.imapUser, 1000) !== D.settings.imapUser) || (b.imapFolder !== undefined && clean(b.imapFolder, 1000) !== D.settings.imapFolder)) D.bank.state = {};
  for (const [k, v] of Object.entries(b)) {
    if (!(k in D.settings)) continue;
    if (k === 'imapPass') { if (String(v).trim()) D.settings.imapPass = String(v).replace(/\s+/g, '').slice(0, 200); continue; }
    D.settings[k] = typeof D.settings[k] === 'number' ? Math.max(0, Number(v) || 0) : clean(v, 1000);
  }
  db.save();
  res.json({ ok: true, settings: { ...D.settings, imapPass: '' } });
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
app.post('/api/admin/upload', express.raw({ type: () => true, limit: '80mb' }), (req, res) => {
  const ext = path.extname(String(req.query.name || '')).toLowerCase();
  if (!UPLOAD_TYPES[ext]) return fail(res, 400, 'Chỉ nhận ảnh (jpg, png, webp, gif) hoặc video (mp4, webm).');
  if (!req.body?.length) return fail(res, 400, 'File rỗng.');
  const name = `${Date.now().toString(36)}-${slug(path.basename(String(req.query.name), ext)) || 'file'}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), req.body);
  res.json({ ok: true, url: `/uploads/${name}` });
});

app.use('/api', (req, res) => fail(res, 404, 'Không có API này.'));

// ---------- file tĩnh ----------
// Tải game: chỉ khi tài khoản (hoặc link đơn hàng) có key còn hoạt động gồm game đó
app.get('/tai-ve/:id', (req, res) => {
  const g = D.games.find(x => x.id === req.params.id);
  if (!g) return res.status(404).send('Không có game này.');
  const owns = (l) => l && l.status === 'active' && entitledGames(l, visibleGames()).includes(g.id);
  let allowed = false;
  const u = currentUser(req);
  if (u) allowed = D.licenses.some(l => l.userId === u.id && owns(l));
  if (!allowed && req.query.code && req.query.t) {
    const o = findOrder(req.query.code);
    const t = String(req.query.t);
    if (o && t.length === 24 && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(orderToken(o.code)))) allowed = owns(o.licenseKey && findLicense(o.licenseKey));
  }
  if (!allowed) return res.redirect(`/tai-khoan.html?next=${encodeURIComponent(req.originalUrl)}`);
  if (g.file?.stored && fs.existsSync(path.join(FILES_DIR, g.file.stored))) {
    return res.download(path.join(FILES_DIR, g.file.stored), g.file.name || `${g.id}.zip`);
  }
  if (g.download) return res.redirect(g.download);
  res.status(404).send('Game chưa có file tải. Vui lòng liên hệ người bán qua Zalo.');
});

// ---------- SEO: trang có sẵn nội dung + thẻ meta cho Google, Facebook, Zalo ----------
const seo = createSeo({ publicDir: path.join(__dirname, 'public'), getData: () => { db.refresh(); return D; }, baseUrl });
const sendHtml = (res, html) => res.type('html').set('Cache-Control', 'public, max-age=60').send(html);
app.get(['/', '/index.html', '/index'], (req, res) => sendHtml(res, seo.home(req)));
app.get('/game/:id', (req, res, next) => { const html = seo.gamePage(req, req.params.id); if (!html) return next(); sendHtml(res, html); });
app.get(['/huong-dan', '/huong-dan.html'], (req, res) => sendHtml(res, seo.guidePage(req)));
app.get(['/tra-cuu', '/tra-cuu.html'], (req, res) => sendHtml(res, seo.lookupPage(req)));
app.get('/robots.txt', (req, res) => res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(seo.robots(req)));
app.get('/sitemap.xml', (req, res) => res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(seo.sitemap(req)));
// Trang riêng tư: không cho Google lập chỉ mục
app.use((req, res, next) => { if (/^\/(tai-khoan|don-hang|admin)(\.html|\/|$)/.test(req.path)) res.set('X-Robots-Tag', 'noindex, nofollow'); next(); });

// Trang chính sách: /chinh-sach/<tên trang>
app.get(['/chinh-sach', '/chinh-sach/:slug'], (req, res) => sendHtml(res, seo.policyPage(req, req.params.slug)));
app.get('/chinh-sach.html', (req, res) => res.redirect(301, '/chinh-sach/chinh-sach-ban-hang'));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use('/media', express.static(path.join(__dirname, 'public', 'media'), { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use((req, res) => res.status(404).type('html').send('<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Không tìm thấy trang</title><body style="font-family:sans-serif;text-align:center;padding:60px"><h1>Không tìm thấy trang</h1><p><a href="/">Về trang chủ</a></p></body></html>'));

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api')) return fail(res, err.status || 500, err.type === 'entity.too.large' ? 'File quá lớn.' : 'Lỗi máy chủ.');
  res.status(500).send('Lỗi máy chủ');
});

app.listen(PORT, () => {
  console.log(`\n  Dữ liệu:   ${DATA_DIR}`);
  console.log(`  Cửa hàng:  http://localhost:${PORT}`);
  console.log(`  Quản trị:  http://localhost:${PORT}/admin/`);
  if (!D.admin.passwordHash) console.log('  Lần đầu vào trang quản trị sẽ được yêu cầu tạo mật khẩu.');
  if (!payos.isConfigured(D.settings) && !D.settings.bankCode) console.log('  Chưa cài thanh toán: vào Quản trị > Cài đặt để nhập PayOS hoặc tài khoản ngân hàng.\n');
});

// Mọi thay đổi đã được ghi ngay khi xử lý yêu cầu. Khi tắt KHÔNG ghi lại: tiến trình cũ bị Hostinger tắt
// có thể đang giữ dữ liệu cũ trong bộ nhớ, ghi lại sẽ đè mất thay đổi của tiến trình khác.
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
