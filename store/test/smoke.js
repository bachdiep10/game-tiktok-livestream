// Kiểm tra nhanh toàn bộ luồng: tạo đơn → xác nhận → key → kích hoạt 1 máy → chặn máy 2 → chuyển máy.
// Chạy: npm test
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { verifyWebhook } from '../lib/payos.js';
import { parseBankEmail, findOrderCode, parseVnd } from '../lib/bankmail.js';
import { checkLicense } from '../client/license-client.js';
import { DB } from '../lib/db.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgstore-'));
const port = 18000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const srv = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: port, DATA_DIR: dataDir }, stdio: 'pipe' });
const jars = { admin: '', user: '', other: '' };
let jar = 'admin';
const as = (name) => { jar = name; };

async function j(method, url, body, expectStatus) {
  const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie: jars[jar] }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get('set-cookie'); if (sc) jars[jar] = sc.split(';')[0];
  const json = await res.json();
  if (expectStatus) assert.equal(res.status, expectStatus, `${url}: ${JSON.stringify(json)}`);
  else assert.ok(json.ok, `${url}: ${JSON.stringify(json)}`);
  return json;
}
const step = (s) => console.log('  ✓', s);

try {
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/catalog'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }

  const cat = await j('GET', '/api/catalog');
  assert.equal(cat.plans.length, 3); assert.equal(cat.games.length, 2);
  step('catalog: 3 gói, 2 game');

  as('user');
  await j('POST', '/api/orders', { planId: 'combo', games: ['chanh-dien', 'quan-bar'] }, 401);
  await j('POST', '/api/account/register', { name: 'Khách A', phone: '0912 345 678', email: 'a@x.vn', password: '123' }, 400);
  const reg = await j('POST', '/api/account/register', { name: 'Khách A', phone: '0912 345 678', email: 'a@x.vn', password: 'matkhau1' });
  assert.equal(reg.user.name, 'Khách A');
  as('other');
  await j('POST', '/api/account/register', { name: 'Giả mạo', phone: '+84912345678', password: 'abcdef' }, 400);
  await j('POST', '/api/account/login', { login: '0912345678', password: 'sai' }, 401);
  await j('POST', '/api/account/register', { name: 'Khách B', phone: '0977000111', password: 'abcdef' }, 400);
  await j('POST', '/api/account/register', { name: 'Khách B', phone: '0977000111', email: 'b@x.vn', password: 'abcdef' });
  as('user');
  await j('POST', '/api/orders', { planId: 'combo', games: ['chanh-dien', 'quan-bar'] }, 503);
  step('chưa đăng nhập không mua được; đăng ký tài khoản (bắt buộc email); SĐT trùng bị chặn; chưa cài thanh toán thì không tạo đơn');
  as('admin');

  await j('GET', '/api/admin/overview', undefined, 401);
  await j('POST', '/api/admin/setup', { password: 'matkhau123' });
  await j('PUT', '/api/admin/settings', { bankCode: 'MB', bankAccount: '0123456789', bankOwner: 'NGUYEN VAN A' });
  step('tạo mật khẩu quản trị + cài ngân hàng');

  as('user');
  await j('POST', '/api/orders', { planId: 'combo', games: ['chanh-dien'] }, 400);
  const ord = await j('POST', '/api/orders', { planId: 'combo', games: ['chanh-dien', 'quan-bar'] });
  await j('GET', `/api/orders/${ord.code}?t=wrongtoken0000000000000`, undefined, 404);
  let o = (await j('GET', `/api/orders/${ord.code}?t=${ord.token}`)).order;
  assert.equal(o.status, 'pending'); assert.ok(o.bank.qr.includes('img.vietqr.io')); assert.equal(o.license, null);
  o = (await j('POST', `/api/orders/${ord.code}/claim?t=${ord.token}`, {})).order;
  assert.ok(o.claimedAt);
  step('tạo đơn combo, sai token bị chặn, khách báo đã chuyển khoản');
  as('admin');

  await j('POST', `/api/admin/orders/${ord.code}/mark-paid`, {});
  o = (await j('GET', `/api/orders/${ord.code}?t=${ord.token}`)).order;
  assert.equal(o.status, 'paid'); assert.match(o.license.key, /^LG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  const key = o.license.key;
  await j('POST', `/api/admin/orders/${ord.code}/mark-paid`, {});
  assert.equal((await j('GET', '/api/admin/licenses')).licenses.length, 1);
  step(`xác nhận tiền → key ${key} (bấm 2 lần vẫn 1 key)`);
  as('user');
  let meU = await j('GET', '/api/account/me');
  assert.equal(meU.licenses.length, 1); assert.equal(meU.licenses[0].key, key); assert.equal(meU.orders[0].status, 'paid');
  as('other');
  assert.equal((await j('GET', '/api/account/me')).licenses.length, 0);
  await j('POST', '/api/account/move', { key }, 404);
  await j('POST', '/api/account/claim', { key, phone: '0977000111' }, 404);
  step('key hiện trong "Tài khoản của tôi"; tài khoản khác không thấy, không chuyển máy được, không nhận key được');
  as('admin');

  const mA = crypto.randomBytes(32).toString('hex'), mB = crypto.randomBytes(32).toString('hex');
  const a1 = await j('POST', '/api/license/activate', { key, machineId: mA, machineName: 'PC-A', game: 'chanh-dien' });
  assert.ok(a1.ticket); assert.deepEqual(a1.games.sort(), ['chanh-dien', 'quan-bar']);
  await j('POST', '/api/license/activate', { key: key.toLowerCase(), machineId: mA, game: 'quan-bar' });
  const b1 = await j('POST', '/api/license/activate', { key, machineId: mB, machineName: 'PC-B' }, 409);
  assert.equal(b1.code, 'IN_USE'); assert.match(b1.error, /PC-A/);
  await j('POST', '/api/license/activate', { key: 'LG-AAAA-BBBB-CCCC-DDDD', machineId: mB }, 404);
  step('máy A kích hoạt được, máy B bị chặn, key giả bị từ chối');

  await j('POST', '/api/lookup', { query: key, phone: '0999999999' }, 404);
  const lk = await j('POST', '/api/lookup', { query: String(ord.code), phone: '+84912345678' });
  assert.equal(lk.license.machineName, 'PC-A'); assert.equal(lk.license.movesLeft, 3);
  const mv = await j('POST', '/api/lookup/move', { query: key, phone: '0912345678' });
  assert.equal(mv.license.movesLeft, 2);
  await j('POST', '/api/license/activate', { key, machineId: mB, machineName: 'PC-B' });
  await j('POST', '/api/license/activate', { key, machineId: mA }, 409);
  step('khách tự tra cứu bằng mã đơn + SĐT, chuyển máy sang B, máy A bị chặn');
  as('user');
  const mvAcc = await j('POST', '/api/account/move', { key });
  assert.match(mvAcc.message, /Đã gỡ/);
  await j('POST', '/api/license/activate', { key, machineId: mB, machineName: 'PC-B' });
  step('chuyển máy ngay trong tài khoản');
  as('admin');

  const g3 = await j('POST', '/api/admin/games', { name: 'Đua Thuyền Rồng', tagline: 'test' });
  assert.equal(g3.game.id, 'dua-thuyen-rong'); assert.equal(g3.filledCombo, 1);
  const a3 = await j('POST', '/api/license/activate', { key, machineId: mB, game: 'dua-thuyen-rong' });
  assert.equal(a3.games.length, 3);
  step('thêm game thứ 3 → key combo tự nhận');

  const single = await j('POST', '/api/admin/licenses', { planId: 'le', games: ['quan-bar'], name: 'B', phone: '0988000111' });
  as('user');
  await j('POST', '/api/account/claim', { key: single.keys[0], phone: '0988000111' });
  assert.equal((await j('GET', '/api/account/me')).licenses.length, 2);
  as('other');
  await j('POST', '/api/account/claim', { key: single.keys[0], phone: '0988000111' }, 403);
  as('admin');
  const users = (await j('GET', '/api/admin/users')).users;
  assert.equal(users.length, 2);
  const ua = users.find(u => u.phone.includes('345'));
  const np = (await j('POST', `/api/admin/users/${ua.id}/reset-password`, {})).password;
  as('user');
  await j('GET', '/api/account/me').then(r => assert.equal(r.user, null));
  await j('POST', '/api/account/login', { login: 'A@X.VN', password: np });
  step('thêm key cũ vào tài khoản (cần SĐT lúc mua); admin cấp lại mật khẩu, phiên cũ bị đăng xuất');
  as('admin');
  await j('POST', '/api/license/activate', { key: single.keys[0], machineId: mA, game: 'chanh-dien' }, 403);
  await j('POST', '/api/admin/games', { name: 'Game Bốn' });
  assert.deepEqual((await j('POST', '/api/license/activate', { key: single.keys[0], machineId: mA })).games, ['quan-bar']);
  const all = await j('POST', '/api/admin/licenses', { planId: 'tron-bo' });
  assert.equal((await j('POST', '/api/license/activate', { key: all.keys[0], machineId: mA })).games.length, 4);
  step('gói lẻ chỉ 1 game, gói trọn bộ có mọi game');

  await j('PATCH', `/api/admin/licenses/${key}`, { status: 'locked' });
  await j('POST', '/api/license/activate', { key, machineId: mB }, 403);
  await j('PATCH', `/api/admin/licenses/${key}`, { status: 'active' });
  step('khoá key → game bị chặn; mở lại được');

  // File game riêng tư + tải theo quyền
  const up = await fetch(base + '/api/admin/games/quan-bar/file?name=QuanBar-1.9.9.zip', { method: 'POST', headers: { cookie: jars.admin }, body: Buffer.from('PK-fake-zip-quan-bar') });
  assert.ok((await up.json()).ok);
  const dl = async (url, who) => fetch(base + url, { headers: { cookie: jars[who] || '' }, redirect: 'manual' });
  let r = await dl('/tai-ve/quan-bar', 'user');
  assert.equal(r.status, 200); assert.equal(await r.text(), 'PK-fake-zip-quan-bar');
  assert.match(r.headers.get('content-disposition'), /QuanBar-1\.9\.9\.zip/);
  r = await dl('/tai-ve/quan-bar', 'other'); assert.equal(r.status, 302);
  r = await dl('/tai-ve/quan-bar', 'nobody'); assert.equal(r.status, 302);
  r = await dl(`/tai-ve/quan-bar?code=${ord.code}&t=${ord.token}`, 'nobody'); assert.equal(r.status, 200);
  r = await dl(`/tai-ve/quan-bar?code=${ord.code}&t=000000000000000000000000`, 'nobody'); assert.equal(r.status, 302);
  as('user');
  const meG = await j('GET', '/api/account/me');
  const gBar = meG.licenses.find(l => l.key === key).games.find(g => g.id === 'quan-bar');
  assert.equal(gBar.download, '/tai-ve/quan-bar'); assert.match(gBar.guide, /run-bar\.bat/);
  as('admin');
  step('file game giữ kín: chỉ người có key mới tải được (tài khoản hoặc link đơn); có hướng dẫn riêng từng game');

  const ri = await j('POST', `/api/admin/licenses/${key}/reissue`, {});
  await j('POST', '/api/license/activate', { key, machineId: mB }, 404);
  await j('POST', '/api/license/activate', { key: ri.key, machineId: mA });
  as('user');
  assert.ok((await j('GET', '/api/account/me')).licenses.some(l => l.key === ri.key));
  assert.equal((await j('GET', `/api/orders/${ord.code}?t=${ord.token}`)).order.license.key, ri.key);
  as('admin');
  step('đổi key mới: key cũ hết hiệu lực, key mới dùng được, khách thấy key mới');

  const pub = await (await fetch(base + '/api/license/public-key')).text();
  const cacheFile = path.join(dataDir, 'client-cache.json');
  const k3 = await j('POST', '/api/admin/licenses', { planId: 'le', games: ['chanh-dien'], phone: '0911222333' });
  const c1 = await checkLicense({ server: base, game: 'chanh-dien', key: k3.keys[0], publicKeyPem: pub, cacheFile });
  assert.ok(c1.ok && c1.online, JSON.stringify(c1));
  const c2 = await checkLicense({ server: 'http://127.0.0.1:1', game: 'chanh-dien', publicKeyPem: pub, cacheFile });
  assert.ok(c2.ok && !c2.online, JSON.stringify(c2));
  const c3 = await checkLicense({ server: 'http://127.0.0.1:1', game: 'quan-bar', publicKeyPem: pub, cacheFile });
  assert.ok(!c3.ok);
  step('thư viện game: kích hoạt online, chạy offline bằng vé đã lưu');

  // Chữ ký webhook PayOS (ví dụ tính tay)
  const s = { payosChecksumKey: 'ck' };
  const data = { orderCode: 123, amount: 229000, description: 'LG123', accountNumber: '1', reference: 'x', transactionDateTime: '2026-11-03 10:00:00', currency: 'VND', paymentLinkId: 'p', code: '00', desc: 'success', counterAccountBankId: '', counterAccountBankName: '', counterAccountName: '', counterAccountNumber: '', virtualAccountName: '', virtualAccountNumber: '' };
  const str = Object.keys(data).sort().map(k => `${k}=${data[k]}`).join('&');
  const signature = crypto.createHmac('sha256', 'ck').update(str).digest('hex');
  assert.ok(verifyWebhook(s, { data, signature }));
  assert.ok(!verifyWebhook(s, { data: { ...data, amount: 1 }, signature }));
  step('xác minh chữ ký webhook PayOS');

  await j('POST', '/api/payos/webhook', { data: {}, signature: 'x' });
  step('webhook giả không làm gì');


  // Email biến động số dư ACB
  assert.equal(parseVnd('1.000.000'), 1000000); assert.equal(parseVnd('229,000.00'), 229000);
  const acb = (amt, nd) => `ACB xin trân trọng thông báo tài khoản 12345678 của Quý khách đã thay đổi số dư như sau:\nSố tiền thay đổi: ${amt} VND\nSố dư hiện tại: 5,000,000.00 VND\nNội dung giao dịch: ${nd}\nThời gian: 03/11/2026 21:00`;
  let pe = parseBankEmail(acb('+229,000.00', 'NGUYEN VAN A chuyen tien LG 1762 1800 0001 FT2611'));
  assert.deepEqual([pe.credit, pe.amount], [true, 229000]); assert.equal(findOrderCode(pe.content), 176218000001);
  assert.equal(parseBankEmail(acb('-50,000.00', 'rut tien')).credit, false);
  assert.equal(parseBankEmail('<p>Ghi có: <b>+89.000 VND</b></p><p>Diễn giải: MBVCB.123.LG176218000099.abc</p>'.replace(/<[^>]+>/g, '\n')).amount, 89000);
  assert.equal(findOrderCode('MBVCB.123.LG176218000099.abc'), 176218000099);
  assert.equal(findOrderCode('thanh toan don hang'), null);
  as('user');
  const ord2 = await j('POST', '/api/orders', { planId: 'le', games: ['chanh-dien'] });
  as('admin');
  let tp = (await j('POST', '/api/admin/bank/test-parse', { text: acb('+89,000.00', `KHACH A LG${ord2.code}`) })).result;
  assert.equal(tp.order.code, ord2.code);
  const short = await j('POST', '/api/admin/bank/test-parse', { text: acb('+50,000.00', `KHACH A LG${ord2.code}`), record: true });
  assert.equal(short.txn.status, 'unmatched'); assert.match(short.txn.note, /Thiếu tiền/);
  const okTx = await j('POST', '/api/admin/bank/test-parse', { text: acb('+89,000.00', `KHACH A LG ${ord2.code}`), record: true });
  assert.equal(okTx.txn.status, 'matched');
  await j('POST', '/api/admin/bank/test-parse', { text: acb('+89,000.00', `KHACH A LG ${ord2.code}`), record: true }, 400);
  as('user');
  let o2 = (await j('GET', `/api/orders/${ord2.code}?t=${ord2.token}`)).order;
  assert.equal(o2.status, 'paid'); assert.ok(o2.license.key);
  as('admin');
  const wrong = await j('POST', '/api/admin/bank/test-parse', { text: acb('+229,000.00', 'chuyen tien mua game'), record: true });
  assert.equal(wrong.txn.status, 'unmatched');
  as('user');
  const ord3 = await j('POST', '/api/orders', { planId: 'le', games: ['quan-bar'] });
  as('admin');
  await j('POST', `/api/admin/bank/${wrong.txn.id}/assign`, { orderCode: ord3.code });
  await j('POST', `/api/admin/bank/${wrong.txn.id}/assign`, { orderCode: ord3.code }, 400);
  const bl = await j('GET', '/api/admin/bank');
  assert.equal(bl.txns.find(t => t.id === wrong.txn.id).status, 'manual');
  assert.equal(bl.ready, false);
  await j('POST', '/api/admin/bank/check', {}, 400);
  await j('PUT', '/api/admin/settings', { imapUser: 'shop@gmail.com', imapPass: 'abcd efgh ijkl mnop' });
  let cfg = await j('GET', '/api/admin/config');
  assert.equal(cfg.settings.imapPass, ''); assert.equal(cfg.imapPassSet, true);
  await j('PUT', '/api/admin/settings', { imapPass: '' });
  assert.equal((await j('GET', '/api/admin/config')).imapPassSet, true);
  step('email biến động số dư ACB: đủ tiền tự trả key, thiếu tiền/sai nội dung chờ admin, không cộng trùng; mật khẩu Gmail không lộ ra');

  // SEO: nội dung có sẵn trong HTML, game ẩn không có trang, sitemap/robots
  const page = async (u) => { const r = await fetch(base + u); return { status: r.status, html: await r.text(), headers: r.headers }; };
  const home = await page('/');
  assert.match(home.html, /<link rel="canonical"/); assert.match(home.html, /og:image/); assert.match(home.html, /"@type":"FAQPage"/);
  assert.match(home.html, /<a href="\/game\/chanh-dien">Chánh Điện Lễ Phật<\/a>/);
  assert.equal((await page('/game/quan-bar')).status, 200);
  assert.equal((await page('/game/tra-da')).status, 404);
  const sm = (await page('/sitemap.xml')).html;
  assert.match(sm, /\/game\/quan-bar</); assert.doesNotMatch(sm, /tra-da/); assert.match(sm, /\/chinh-sach\/bao-mat</);
  assert.match((await page('/robots.txt')).html, /Disallow: \/admin/);
  assert.equal((await page('/tai-khoan.html')).headers.get('x-robots-tag'), 'noindex, nofollow');
  step('SEO: trang chủ có sẵn game + FAQ + thẻ meta; trang /game/<id> chỉ cho game đang bán; sitemap, robots, noindex trang riêng');

  {
    // Tin tức: nháp không hiện, đăng thì hiện ở /tin-tuc, bài riêng, trang chủ, sitemap; nội dung được lọc an toàn
    as('admin');
    const draft = (await j('POST', '/api/admin/posts', { title: 'Mẹo tăng tim khi LIVE Đám cưới', content: '## Mở đầu\nĐoạn **đậm** và [link](https://netxioviet.com).\n\n- ý 1\n- ý 2\n\n<script>alert(1)</script>\n[xấu](javascript:alert(1))\n![ảnh](/uploads/a.jpg)' })).post;
    assert.equal(draft.slug, 'meo-tang-tim-khi-live-dam-cuoi'); assert.equal(draft.status, 'draft');
    assert.equal((await page(`/tin-tuc/${draft.slug}`)).status, 404);
    const pub = (await j('PATCH', `/api/admin/posts/${draft.id}`, { status: 'published' })).post;
    assert.ok(pub.publishedAt);
    const art = await page(`/tin-tuc/${pub.slug}`);
    assert.equal(art.status, 200);
    assert.match(art.html, /<h1>Mẹo tăng tim khi LIVE Đám cưới<\/h1>/); assert.match(art.html, /<h2>Mở đầu<\/h2>/); assert.match(art.html, /<strong>đậm<\/strong>/);
    assert.match(art.html, /<li>ý 1<\/li>/); assert.match(art.html, /"@type":"BlogPosting"/); assert.match(art.html, /og:image" content="[^"]*\/uploads\/a\.jpg/);
    assert.doesNotMatch(art.html, /<script>alert/); assert.doesNotMatch(art.html, /href="javascript:/);
    assert.match((await page('/tin-tuc')).html, new RegExp(`/tin-tuc/${pub.slug}`));
    assert.match((await page('/')).html, /Bài viết mới/);
    assert.match((await page('/sitemap.xml')).html, new RegExp(`/tin-tuc/${pub.slug}<`));
    const dup = (await j('POST', '/api/admin/posts', { title: 'Mẹo tăng tim khi LIVE Đám cưới', status: 'published', publishedAt: Date.now() + 86400000 })).post;
    assert.equal(dup.slug, 'meo-tang-tim-khi-live-dam-cuoi-2');
    assert.equal((await page(`/tin-tuc/${dup.slug}`)).status, 404); // hẹn giờ: chưa tới giờ đăng
    await j('DELETE', `/api/admin/posts/${dup.id}`);
    as('user'); await j('GET', '/api/admin/posts', undefined, 401); as('admin');
    assert.match((await page('/')).html, /href="\/favicon\.ico"/);
    step('tin tức: nháp ẩn, đăng hiện ở /tin-tuc + trang chủ + sitemap, hẹn giờ, chống mã độc; favicon');
  }

  {
    // Tiến trình cũ (dữ liệu cũ trong bộ nhớ) không được ghi đè thay đổi của tiến trình mới
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgdb-'));
    const oldP = new DB(dir), newP = new DB(dir);
    const rel = await newP.acquire(); newP.data.games.find(g => g.id === 'dam-cuoi').visible = true; newP.save(); rel();
    oldP.saveNow();
    assert.equal(new DB(dir).data.games.find(g => g.id === 'dam-cuoi').visible, true);
    const rel2 = await newP.acquire(); newP.data.games.find(g => g.id === 'bia-hoi').visible = true; newP.save(); rel2();
    const err = console.error; console.error = () => {}; oldP.write(); console.error = err;
    assert.equal(new DB(dir).data.games.find(g => g.id === 'bia-hoi').visible, true);
    fs.rmSync(dir, { recursive: true, force: true });
    step('nhiều tiến trình: tiến trình cũ không ghi đè dữ liệu mới (kể cả khi bị tắt)');
  }

  console.log('\nTẤT CẢ ĐỀU QUA ✅');
} catch (e) {
  console.error('\nLỖI ❌', e.message);
  process.exitCode = 1;
} finally {
  srv.kill();
  await new Promise(r => setTimeout(r, 300)); fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5 });
}
