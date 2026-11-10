// Kiểm tra báo đơn về Telegram (máy chủ Telegram giả): đơn mới, khách báo chuyển khoản, đã thanh toán, gửi thử, mã bot không lộ.
// Chạy: node test/telegram.js
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgtg-'));
const port = 20000 + Math.floor(Math.random() * 500);
const tgPort = port + 700;
const base = `http://127.0.0.1:${port}`;
const step = (s) => console.log('  ✓', s);

const msgs = [];
const tg = http.createServer((req, res) => {
  let b = '';
  req.on('data', d => { b += d; });
  req.on('end', () => {
    const m = req.url.match(/^\/bot([^/]+)\/sendMessage$/);
    const body = JSON.parse(b || '{}');
    if (!m || m[1] !== '123:ABC') { res.writeHead(401); return res.end(JSON.stringify({ ok: false, description: 'Unauthorized' })); }
    msgs.push(body);
    res.end(JSON.stringify({ ok: true }));
  });
});
await new Promise(r => tg.listen(tgPort, '127.0.0.1', r));

const srv = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: port, DATA_DIR: dataDir, TELEGRAM_API: `http://127.0.0.1:${tgPort}` }, stdio: 'pipe' });
let errOut = ''; srv.stderr.on('data', d => { errOut += d; });
const jars = {}; let jar = 'admin';
const as = (n) => { jar = n; };
async function j(method, url, body, expect) {
  const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie: jars[jar] || '' }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get('set-cookie'); if (sc) jars[jar] = sc.split(';')[0];
  const json = await res.json();
  if (expect) assert.equal(res.status, expect, `${url}: ${JSON.stringify(json)}`); else assert.ok(json.ok, `${url}: ${JSON.stringify(json)}`);
  return json;
}
const wait = async (n) => { for (let i = 0; i < 50 && msgs.length < n; i++) await new Promise(r => setTimeout(r, 50)); };

try {
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/catalog'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  as('admin');
  await j('POST', '/api/admin/setup', { password: 'matkhau123' });
  await j('PUT', '/api/admin/settings', { bankCode: 'MB', bankAccount: '0123', bankOwner: 'A', publicUrl: 'https://shop.vn' });
  await j('POST', '/api/admin/telegram/test', {}, 400);
  // chưa cấu hình: đặt đơn không gửi gì
  as('u'); await j('POST', '/api/account/register', { name: 'Trần <Khách>', phone: '0901000009', email: 'k@x.vn', password: 'abcdef' });
  await j('POST', '/api/orders', { planId: 'le', games: ['chanh-dien'] });
  await new Promise(r => setTimeout(r, 300));
  assert.equal(msgs.length, 0);
  step('chưa nhập mã bot: không gửi, nút gửi thử báo cần cấu hình');

  as('admin');
  await j('PUT', '/api/admin/settings', { telegramBotToken: '123:ABC', telegramChatId: '111, -100222' });
  const cfg = await j('GET', '/api/admin/config');
  assert.equal(cfg.settings.telegramBotToken, ''); assert.equal(cfg.telegramTokenSet, true);
  await j('POST', '/api/admin/telegram/test', {});
  await wait(2);
  assert.deepEqual(msgs.map(m => m.chat_id), ['111', '-100222']); assert.match(msgs[0].text, /Thử báo đơn/);
  step('lưu mã bot (không trả lại ra trang), gửi thử tới 2 người nhận');

  msgs.length = 0;
  as('u');
  const o = await j('POST', '/api/orders', { planId: 'le', games: ['chanh-dien'], source: 'popup:checkout' });
  await wait(2);
  let t = msgs[0].text;
  assert.match(t, /ĐƠN MỚI<\/b> #\d+/); assert.match(t, /Trần &lt;Khách&gt;/); assert.match(t, /0901000009/); assert.match(t, /89\.000đ/); assert.match(t, /Chánh Điện/); assert.match(t, /popup:checkout/); assert.match(t, /shop\.vn\/admin/);
  assert.equal(msgs[0].parse_mode, 'HTML');
  step('đơn mới: báo tên, SĐT, gói, game, số tiền, nguồn, link quản trị');

  msgs.length = 0;
  await j('POST', `/api/orders/${o.code}/claim?t=${o.token}`, {});
  await j('POST', `/api/orders/${o.code}/claim?t=${o.token}`, {});
  await wait(2); await new Promise(r => setTimeout(r, 200));
  assert.equal(msgs.length, 2); // 2 người nhận, bấm 2 lần chỉ báo 1 lần
  assert.match(msgs[0].text, /BÁO ĐÃ CHUYỂN KHOẢN/);
  msgs.length = 0;
  as('admin'); await j('POST', `/api/admin/orders/${o.code}/mark-paid`, {});
  await wait(2);
  assert.match(msgs[0].text, /ĐÃ THANH TOÁN/); assert.match(msgs[0].text, /LG-/);
  step('khách báo chuyển khoản (chỉ 1 lần) và đơn đã thanh toán kèm key');

  msgs.length = 0;
  await j('PUT', '/api/admin/settings', { telegramNew: 0 });
  as('u'); await j('POST', '/api/orders', { planId: 'le', games: ['chanh-dien'] });
  await new Promise(r => setTimeout(r, 300));
  assert.equal(msgs.length, 0);
  as('admin');
  await j('PUT', '/api/admin/settings', { telegramBotToken: 'sai' });
  await j('POST', '/api/admin/telegram/test', {}, 400);
  const cfg2 = await j('GET', '/api/admin/config');
  assert.ok(!JSON.stringify(cfg2).includes('123:ABC'));
  step('tắt "báo đơn mới" thì không báo; mã bot sai báo lỗi rõ ràng');

  console.log('\nTELEGRAM: TẤT CẢ ĐỀU QUA ✅');
} catch (e) {
  console.error('\n❌', e.message, '\n', errOut.slice(-2000));
  process.exitCode = 1;
} finally {
  srv.kill(); tg.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
