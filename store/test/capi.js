// Kiểm tra Meta Conversions API: máy chủ gửi sự kiện cho Meta với cùng event_id như Pixel (để bỏ trùng).
// Dùng máy chủ Meta giả, không gửi gì ra ngoài. Chạy: npm test
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgcapi-'));
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');

// Meta giả: ghi lại mọi sự kiện nhận được
const got = [];
const meta = http.createServer((req, res) => {
  let b = '';
  req.on('data', c => { b += c; });
  req.on('end', () => {
    const body = JSON.parse(b || '{}');
    const u = new URL(req.url, 'http://x');
    got.push({ path: u.pathname, token: u.searchParams.get('access_token'), body });
    res.setHeader('content-type', 'application/json');
    if (u.searchParams.get('access_token') === 'SAI') { res.statusCode = 400; return res.end(JSON.stringify({ error: { message: 'Invalid OAuth access token' } })); }
    res.end(JSON.stringify({ events_received: body.data.length, fbtrace_id: 'x' }));
  });
});
await new Promise(r => meta.listen(0, '127.0.0.1', r));
const metaUrl = `http://127.0.0.1:${meta.address().port}/v21.0`;

const port = 19000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const srv = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: port, DATA_DIR: dataDir, META_GRAPH_URL: metaUrl }, stdio: 'pipe' });
const jars = { admin: '', user: '' };
let jar = 'admin';
const as = (n) => { jar = n; };
async function j(method, url, body, expectStatus, extraCookie = '') {
  const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'User-Agent': 'TestBrowser/1.0', cookie: [jars[jar], extraCookie].filter(Boolean).join('; ') }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get('set-cookie'); if (sc) jars[jar] = sc.split(';')[0];
  const json = await res.json();
  if (expectStatus) assert.equal(res.status, expectStatus, `${url}: ${JSON.stringify(json)}`);
  else assert.ok(json.ok, `${url}: ${JSON.stringify(json)}`);
  return json;
}
const wait = async (fn) => { for (let i = 0; i < 50; i++) { if (fn()) return; await new Promise(r => setTimeout(r, 50)); } };
const step = (s) => console.log('  ✓', s);
const fbp = 'fb.1.1731200000000.1234567890';

try {
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/catalog'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }

  as('admin');
  await j('POST', '/api/admin/setup', { password: 'matkhau123' });
  await j('PUT', '/api/admin/settings', { bankCode: 'MB', bankAccount: '0123456789', bankOwner: 'NGUYEN VAN A' });
  as('user');
  await j('POST', '/api/track', { name: 'InitiateCheckout', eventId: 'ini_abc_123456', params: { value: 89000 } });
  await new Promise(r => setTimeout(r, 200));
  assert.equal(got.length, 0);
  let html = await (await fetch(base + '/')).text();
  assert.match(html, /"capi":false/);
  step('chưa có mã truy cập: không gửi gì cho Meta');

  as('admin');
  await j('PUT', '/api/admin/settings', { metaCapiToken: 'EAAtoken123' });
  const cfg = await j('GET', '/api/admin/config');
  assert.equal(cfg.settings.metaCapiToken, ''); assert.equal(cfg.capiTokenSet, true);
  await j('PUT', '/api/admin/settings', { metaCapiToken: '' });
  html = await (await fetch(base + '/')).text();
  assert.match(html, /"capi":true/);
  step('lưu mã truy cập (ẩn khi xem lại, để trống = giữ nguyên), trang khách bật gửi máy chủ');

  as('user');
  await j('POST', '/api/account/register', { name: 'Nguyễn Văn An', phone: '0912 345 678', email: 'An@X.vn', password: 'matkhau1' });
  await j('POST', '/api/track', { name: 'InitiateCheckout', eventId: 'ini_abc_123456', page: 'https://netxioviet.com/?fbclid=AbCdEf123456', params: { value: 89000, content_ids: ['le'], content_name: 'Gói Lẻ', num_items: 1, evil: 'x' } }, undefined, `_fbp=${fbp}`);
  await j('POST', '/api/track', { name: 'Purchase', eventId: 'order_1', params: { value: 1 } });
  await j('POST', '/api/track', { name: 'InitiateCheckout', eventId: 'x' });
  await wait(() => got.length >= 1);
  await new Promise(r => setTimeout(r, 200));
  assert.equal(got.length, 1, 'Purchase giả từ trình duyệt và event_id sai phải bị bỏ');
  let e = got[0];
  assert.equal(e.path, '/v21.0/1497281003464233/events'); assert.equal(e.token, 'EAAtoken123');
  let ev = e.body.data[0];
  assert.equal(ev.event_name, 'InitiateCheckout'); assert.equal(ev.event_id, 'ini_abc_123456'); assert.equal(ev.action_source, 'website');
  assert.equal(ev.event_source_url, 'https://netxioviet.com/?fbclid=AbCdEf123456');
  assert.deepEqual(ev.custom_data, { value: 89000, currency: 'VND', content_ids: ['le'], content_name: 'Gói Lẻ', num_items: 1 });
  assert.equal(ev.user_data.fbp, fbp); assert.match(ev.user_data.fbc, /^fb\.1\.\d+\.AbCdEf123456$/);
  assert.equal(ev.user_data.client_user_agent, 'TestBrowser/1.0'); assert.ok(ev.user_data.client_ip_address);
  assert.deepEqual(ev.user_data.em, [sha('an@x.vn')]); assert.deepEqual(ev.user_data.ph, [sha('84912345678')]);
  assert.deepEqual(ev.user_data.fn, [sha('an')]); assert.deepEqual(ev.user_data.ln, [sha('nguyễn')]);
  step('InitiateCheckout gửi qua máy chủ: cùng event_id, có fbp/fbc, IP, trình duyệt, email/SĐT mã hoá; chặn Purchase giả');

  got.length = 0;
  const ord = await j('POST', '/api/orders', { planId: 'le', games: ['chanh-dien'], page: 'https://netxioviet.com/#bang-gia' }, undefined, `_fbp=${fbp}`);
  as('admin');
  await j('POST', `/api/admin/orders/${ord.code}/mark-paid`, {});
  await wait(() => got.length >= 1);
  ev = got[0].body.data[0];
  assert.equal(ev.event_name, 'Purchase'); assert.equal(ev.event_id, `order_${ord.code}`);
  assert.equal(ev.custom_data.value, 89000); assert.equal(ev.custom_data.currency, 'VND'); assert.equal(ev.custom_data.order_id, String(ord.code));
  assert.equal(ev.user_data.fbp, fbp); assert.deepEqual(ev.user_data.em, [sha('an@x.vn')]);
  assert.equal(ev.event_source_url, 'https://netxioviet.com/#bang-gia');
  await j('POST', `/api/admin/orders/${ord.code}/mark-paid`, {});
  as('user');
  await j('GET', `/api/orders/${ord.code}?t=${ord.token}`);
  await new Promise(r => setTimeout(r, 200));
  assert.equal(got.length, 1);
  step(`đơn được xác nhận → máy chủ gửi Purchase order_${ord.code} đúng 1 lần (khớp event_id của Pixel)`);

  as('admin');
  got.length = 0;
  const t = await j('POST', '/api/admin/capi/test', { testCode: 'TEST123' });
  assert.equal(t.received, 1); assert.equal(got[0].body.test_event_code, 'TEST123');
  await j('PUT', '/api/admin/settings', { metaCapiToken: 'SAI' });
  const bad = await j('POST', '/api/admin/capi/test', {}, 400);
  assert.match(bad.error, /Invalid OAuth/);
  assert.match((await j('GET', '/api/admin/config')).capi.lastError, /Invalid OAuth/);
  step('nút Gửi thử trong quản trị: báo nhận thành công / báo lỗi mã sai');

  console.log('\nCAPI: TẤT CẢ ĐỀU QUA ✅');
} catch (err) {
  console.error('\nLỖI ❌', err.message);
  process.exitCode = 1;
} finally {
  srv.kill(); meta.close();
  await new Promise(r => setTimeout(r, 300)); fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5 });
}
