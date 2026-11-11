// Kiểm tra TikTok API Sự kiện: máy chủ gửi sự kiện cho TikTok với cùng event_id như TikTok Pixel (để bỏ trùng),
// kèm email/SĐT/mã khách đã mã hoá. Dùng máy chủ TikTok giả, không gửi gì ra ngoài. Chạy: npm test
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgtt-'));
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');

const got = [];
const tt = http.createServer((req, res) => {
  let b = '';
  req.on('data', c => { b += c; });
  req.on('end', () => {
    got.push({ path: req.url, token: req.headers['access-token'], body: JSON.parse(b || '{}') });
    res.setHeader('content-type', 'application/json');
    if (req.headers['access-token'] === 'SAI') return res.end(JSON.stringify({ code: 40001, message: 'Access token is incorrect or has been revoked.' }));
    res.end(JSON.stringify({ code: 0, message: 'OK' }));
  });
});
await new Promise(r => tt.listen(0, '127.0.0.1', r));
const ttUrl = `http://127.0.0.1:${tt.address().port}/open_api/v1.3`;

const port = 20000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const srv = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: port, DATA_DIR: dataDir, TIKTOK_API_URL: ttUrl, META_GRAPH_URL: 'http://127.0.0.1:9/x' }, stdio: 'pipe' });
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
const ttp = 'abcDEF123456789.tt.1';
const PIXEL = 'DTESTPIXEL0000000001';

try {
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/catalog'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }

  as('admin');
  await j('POST', '/api/admin/setup', { password: 'matkhau123' });
  await j('PUT', '/api/admin/settings', { bankCode: 'MB', bankAccount: '0123456789', bankOwner: 'NGUYEN VAN A', tiktokPixelId: PIXEL });
  as('user');
  await j('POST', '/api/track', { name: 'InitiateCheckout', eventId: 'ini_abc_123456', params: { value: 89000 } });
  await new Promise(r => setTimeout(r, 200));
  assert.equal(got.length, 0);
  let html = await (await fetch(base + '/')).text();
  assert.match(html, /"ttapi":false/); assert.match(html, new RegExp(`ttq.load\\('${PIXEL}'\\)`));
  step('có Pixel nhưng chưa có mã truy cập: không gửi gì cho TikTok');

  as('admin');
  await j('PUT', '/api/admin/settings', { tiktokApiToken: ' tok123abc ' });
  const cfg = await j('GET', '/api/admin/config');
  assert.equal(cfg.settings.tiktokApiToken, ''); assert.equal(cfg.ttTokenSet, true);
  await j('PUT', '/api/admin/settings', { tiktokApiToken: '' });
  assert.equal((await j('GET', '/api/admin/config')).ttTokenSet, true);
  html = await (await fetch(base + '/')).text();
  assert.match(html, /"ttapi":true/);
  step('lưu mã truy cập (ẩn khi xem lại, để trống = giữ nguyên), trang khách bật gửi máy chủ');

  as('user');
  assert.equal((await j('GET', '/api/track/id')).id, undefined);
  await j('POST', '/api/account/register', { name: 'Nguyễn Văn An', phone: '0912 345 678', email: 'An@X.vn', password: 'matkhau1' });
  const me = await j('GET', '/api/track/id');
  assert.equal(me.id.email, sha('an@x.vn')); assert.equal(me.id.phone_number, sha('+84912345678')); assert.ok(me.id.external_id);
  assert.ok(!JSON.stringify(me).includes('an@x.vn') && !JSON.stringify(me).includes('0912'));
  step('trình duyệt lấy email/SĐT/mã khách đã mã hoá cho ttq.identify (không lộ dữ liệu gốc)');

  await j('POST', '/api/track', { name: 'InitiateCheckout', eventId: 'ini_abc_123456', page: 'https://netxioviet.com/?ttclid=E.C.P.abcdef123456', params: { value: 89000, content_ids: ['le'], content_name: 'Gói Lẻ', num_items: 1 } }, undefined, `_ttp=${ttp}`);
  await j('POST', '/api/track', { name: 'Purchase', eventId: 'order_1', params: { value: 1 } });
  await wait(() => got.length >= 1);
  await new Promise(r => setTimeout(r, 200));
  assert.equal(got.length, 1, 'Purchase giả từ trình duyệt phải bị bỏ');
  let e = got[0];
  assert.equal(e.path, '/open_api/v1.3/event/track/'); assert.equal(e.token, 'tok123abc');
  assert.equal(e.body.event_source, 'web'); assert.equal(e.body.event_source_id, PIXEL);
  let ev = e.body.data[0];
  assert.equal(ev.event, 'InitiateCheckout'); assert.equal(ev.event_id, 'ini_abc_123456');
  assert.equal(ev.page.url, 'https://netxioviet.com/?ttclid=E.C.P.abcdef123456');
  assert.equal(ev.properties.value, 89000); assert.equal(ev.properties.currency, 'VND');
  assert.deepEqual(ev.properties.contents, [{ content_id: 'le', content_name: 'Gói Lẻ', content_type: 'product', quantity: 1, price: 89000 }]);
  assert.equal(ev.user.ttp, ttp); assert.equal(ev.user.ttclid, 'E.C.P.abcdef123456');
  assert.equal(ev.user.email, sha('an@x.vn')); assert.equal(ev.user.phone, sha('+84912345678')); assert.ok(ev.user.external_id);
  assert.equal(ev.user.user_agent, 'TestBrowser/1.0'); assert.ok(ev.user.ip);
  step('InitiateCheckout qua máy chủ: cùng event_id, giá trị VND, gói, ttp/ttclid, IP, trình duyệt, email/SĐT mã hoá');

  got.length = 0;
  const ord = await j('POST', '/api/orders', { planId: 'le', games: ['chanh-dien'], page: 'https://netxioviet.com/#bang-gia' }, undefined, `_ttp=${ttp}; lg_ttclid=E.C.P.quangcao999`);
  as('admin');
  await j('POST', `/api/admin/orders/${ord.code}/mark-paid`, {});
  await wait(() => got.length >= 1);
  ev = got[0].body.data[0];
  assert.equal(ev.event, 'Purchase'); assert.equal(ev.event_id, `order_${ord.code}`);
  assert.equal(ev.properties.value, 89000); assert.equal(ev.properties.currency, 'VND'); assert.equal(ev.properties.order_id, String(ord.code));
  assert.equal(ev.properties.contents[0].content_id, 'le');
  assert.equal(ev.user.ttp, ttp); assert.equal(ev.user.ttclid, 'E.C.P.quangcao999'); assert.equal(ev.user.email, sha('an@x.vn')); assert.equal(ev.user.phone, sha('+84912345678'));
  await j('POST', `/api/admin/orders/${ord.code}/mark-paid`, {});
  await new Promise(r => setTimeout(r, 200));
  assert.equal(got.length, 1);
  step(`đơn được xác nhận → máy chủ gửi Purchase order_${ord.code} đúng 1 lần, có giá trị, mã đơn, email/SĐT mã hoá, mã quảng cáo ttclid`);

  got.length = 0;
  await j('POST', '/api/admin/ttapi/test', { testCode: 'TEST777' });
  assert.equal(got[0].body.test_event_code, 'TEST777');
  await j('PUT', '/api/admin/settings', { tiktokApiToken: 'SAI' });
  const bad = await j('POST', '/api/admin/ttapi/test', {}, 400);
  assert.match(bad.error, /incorrect/);
  assert.match((await j('GET', '/api/admin/config')).tt.lastError, /incorrect/);
  step('nút Gửi thử trong quản trị: báo nhận thành công / báo lỗi mã sai');

  console.log('\nTIKTOK API: TẤT CẢ ĐỀU QUA ✅');
} catch (err) {
  console.error('\nLỖI ❌', err.message);
  process.exitCode = 1;
} finally {
  srv.kill(); tt.close();
  await new Promise(r => setTimeout(r, 300)); fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5 });
}
