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
import { checkLicense } from '../client/license-client.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgstore-'));
const port = 18000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const srv = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: port, DATA_DIR: dataDir }, stdio: 'pipe' });
let cookie = '';

async function j(method, url, body, expectStatus) {
  const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
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

  await j('POST', '/api/orders', { planId: 'combo', games: ['chanh-dien', 'quan-bar'], name: 'A', phone: '0912345678' }, 503);
  step('chưa cài thanh toán thì không tạo đơn');

  await j('GET', '/api/admin/overview', undefined, 401);
  await j('POST', '/api/admin/setup', { password: 'matkhau123' });
  await j('PUT', '/api/admin/settings', { bankCode: 'MB', bankAccount: '0123456789', bankOwner: 'NGUYEN VAN A' });
  step('tạo mật khẩu quản trị + cài ngân hàng');

  await j('POST', '/api/orders', { planId: 'combo', games: ['chanh-dien'], name: 'A', phone: '0912345678' }, 400);
  const ord = await j('POST', '/api/orders', { planId: 'combo', games: ['chanh-dien', 'quan-bar'], name: 'Khách A', phone: '0912 345 678', email: 'a@x.vn' });
  await j('GET', `/api/orders/${ord.code}?t=wrongtoken0000000000000`, undefined, 404);
  let o = (await j('GET', `/api/orders/${ord.code}?t=${ord.token}`)).order;
  assert.equal(o.status, 'pending'); assert.ok(o.bank.qr.includes('img.vietqr.io')); assert.equal(o.license, null);
  o = (await j('POST', `/api/orders/${ord.code}/claim?t=${ord.token}`, {})).order;
  assert.ok(o.claimedAt);
  step('tạo đơn combo, sai token bị chặn, khách báo đã chuyển khoản');

  await j('POST', `/api/admin/orders/${ord.code}/mark-paid`, {});
  o = (await j('GET', `/api/orders/${ord.code}?t=${ord.token}`)).order;
  assert.equal(o.status, 'paid'); assert.match(o.license.key, /^LG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  const key = o.license.key;
  await j('POST', `/api/admin/orders/${ord.code}/mark-paid`, {});
  assert.equal((await j('GET', '/api/admin/licenses')).licenses.length, 1);
  step(`xác nhận tiền → key ${key} (bấm 2 lần vẫn 1 key)`);

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

  const g3 = await j('POST', '/api/admin/games', { name: 'Đua Thuyền Rồng', tagline: 'test' });
  assert.equal(g3.game.id, 'dua-thuyen-rong'); assert.equal(g3.filledCombo, 1);
  const a3 = await j('POST', '/api/license/activate', { key, machineId: mB, game: 'dua-thuyen-rong' });
  assert.equal(a3.games.length, 3);
  step('thêm game thứ 3 → key combo tự nhận');

  const single = await j('POST', '/api/admin/licenses', { planId: 'le', games: ['quan-bar'], name: 'B', phone: '0988000111' });
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

  console.log('\nTẤT CẢ ĐỀU QUA ✅');
} catch (e) {
  console.error('\nLỖI ❌', e.message);
  process.exitCode = 1;
} finally {
  srv.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
