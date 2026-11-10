// Kiểm tra bán thêm: nâng cấp bù tiền (giữ key), ưu đãi có hạn, email tự động (máy chủ SMTP giả), báo game mới, đếm mở/bấm, báo cáo.
// Chạy: node test/upsell.js
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgup-'));
const port = 19000 + Math.floor(Math.random() * 500);
const smtpPort = port + 600;
const base = `http://127.0.0.1:${port}`;
const step = (s) => console.log('  ✓', s);

// --- máy chủ SMTP giả ---
const mails = [];
const envFrom = [];
const smtp = net.createServer(sock => {
  let buf = '', data = false, msg = '', auth = 0;
  sock.write('220 fake\r\n');
  sock.on('data', d => {
    buf += d.toString();
    while (true) {
      if (data) {
        const i = buf.indexOf('\r\n.\r\n');
        if (i < 0) return;
        msg = buf.slice(0, i); buf = buf.slice(i + 5); data = false; mails.push(msg); sock.write('250 ok\r\n'); continue;
      }
      const i = buf.indexOf('\r\n');
      if (i < 0) return;
      const line = buf.slice(0, i); buf = buf.slice(i + 2);
      if (auth === 1) { auth = 2; sock.write('334 UGFzc3dvcmQ6\r\n'); continue; }
      if (auth === 2) { auth = 0; sock.write(Buffer.from(line, 'base64').toString() === 'apppass' ? '235 ok\r\n' : '535 bad\r\n'); continue; }
      if (/^EHLO/.test(line)) sock.write('250-fake\r\n250 AUTH LOGIN\r\n');
      else if (line === 'AUTH LOGIN') { auth = 1; sock.write('334 VXNlcm5hbWU6\r\n'); }
      else if (/^(MAIL|RCPT)/.test(line)) { if (/^MAIL FROM:/.test(line)) envFrom.push(line.slice(10)); sock.write('250 ok\r\n'); }
      else if (line === 'DATA') { data = true; sock.write('354 go\r\n'); }
      else if (line === 'QUIT') { sock.write('221 bye\r\n'); sock.end(); }
      else sock.write('500 ?\r\n');
    }
  });
});
await new Promise(r => smtp.listen(smtpPort, '127.0.0.1', r));
const decode = (m) => {
  const head = m.split('\r\n\r\n')[0];
  assert.ok(m.split('\r\n').every(l => l.length <= 998), 'dòng quá dài');
  assert.match(head, /^From: "?[^@<>]*"? ?<[^@]+@[^>]+>$|^From: [^\s@]+@\S+$/m, 'From sai cú pháp');
  const subj = (head.replace(/\r\n[ \t]/g, ' ').match(/^Subject: (.*)$/m) || [])[1] || '';
  const s = subj.replace(/\?= =\?/g, '?==?').replace(/=\?UTF-8\?B\?([^?]+)\?=/g, (x, b) => Buffer.from(b, 'base64').toString('binary')).replace(/[\s\S]*/, t => Buffer.from(t, 'binary').toString('utf8'));
  const parts = [...m.matchAll(/Content-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+?)\r\n--/g)].map(x => Buffer.from(x[1].replace(/\s/g, ''), 'base64').toString());
  return { subject: s, to: (m.match(/^To: <?([^>\r\n]*)>?$/m) || [])[1], text: parts[0] || '', html: parts[1] || '' };
};

const srv = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: port, DATA_DIR: dataDir }, stdio: 'pipe' });
let errOut = ''; srv.stderr.on('data', d => { errOut += d; });
const jars = {};
let jar = 'admin';
const as = (n) => { jar = n; };
async function j(method, url, body, expect) {
  const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie: jars[jar] || '' }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get('set-cookie'); if (sc) jars[jar] = sc.split(';')[0];
  const json = await res.json();
  if (expect) assert.equal(res.status, expect, `${url}: ${JSON.stringify(json)}`); else assert.ok(json.ok, `${url}: ${JSON.stringify(json)}`);
  return json;
}
// sửa thẳng db.json (giả lập thời gian trôi): tăng writeCount để máy chủ nạp lại
function editDb(fn) {
  const f = path.join(dataDir, 'db.json');
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  fn(d); d.writeCount += 5;
  fs.writeFileSync(f, JSON.stringify(d));
}
async function buy(user, planId, games) {
  as(user);
  const o = await j('POST', '/api/orders', { planId, games, source: 'popup:checkout' });
  as('admin');
  await j('POST', `/api/admin/orders/${o.code}/mark-paid`, {});
  as(user);
  return (await j('GET', `/api/orders/${o.code}?t=${o.token}`)).order.license.key;
}

try {
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/catalog'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  as('admin');
  await j('POST', '/api/admin/setup', { password: 'matkhau123' });
  await j('PUT', '/api/admin/settings', { bankCode: 'MB', bankAccount: '0123', bankOwner: 'A', brandName: 'NetXio' });
  const cat = await j('GET', '/api/catalog');
  assert.equal(cat.upsell.checkout, true);
  const games = (await j('GET', '/api/admin/games')).games;
  const hidden = games.filter(g => !g.visible);
  await j('PATCH', `/api/admin/games/${hidden[0].id}`, { visible: true }); // 3 game đang bán
  const upd = await j('GET', '/api/admin/upsell');
  assert.equal(upd.report.launches.length, 1); // bật hiện = tự tạo đợt game mới
  step('popup lúc mua bật sẵn; bật "Hiện" game là tạo đợt báo game mới');

  as('u1'); await j('POST', '/api/account/register', { name: 'Trần Văn Một', phone: '0901000001', email: 'mot@x.vn', password: 'abcdef' });
  as('u2'); await j('POST', '/api/account/register', { name: 'Lê Hai', phone: '0901000002', email: 'hai@x.vn', password: 'abcdef' });
  const k1 = await buy('u1', 'le', ['chanh-dien']);
  let me1 = await j('GET', '/api/account/me');
  const off = me1.offers.licenses[0];
  assert.equal(off.combo.price, 140000); assert.equal(off.all.price, 560000); assert.equal(off.all.until, 0); assert.equal(off.combo.need, 2);
  step('khách Gói Lẻ: lên Combo bù 140K, lên Trọn Bộ bù 560K (chưa tới ngày ưu đãi)');

  // bật email; giả lập key u1 mua 4 ngày trước
  as('admin');
  await j('PUT', '/api/admin/upsell', { cfg: { emailsOn: 1, smtpHost: '127.0.0.1', smtpPort: smtpPort, smtpUser: 'shop@x.vn', smtpPass: 'sai' } });
  let r = await j('POST', '/api/admin/upsell/run', {});
  editDb(d => { const l = d.licenses.find(x => x.key === k1); l.createdAt -= 4 * 86400000; });
  r = await j('POST', '/api/admin/upsell/run', {});
  assert.match(r.error, /mật khẩu/); assert.equal(mails.length, 0);
  assert.equal((await j('GET', '/api/admin/upsell')).report.recent.length, 0);
  step('sai mật khẩu Gmail: không gửi, không đánh dấu, báo lỗi');

  await j('PUT', '/api/admin/upsell', { cfg: { smtpPass: 'app pass' } });
  r = await j('POST', '/api/admin/upsell/run', {});
  assert.equal(r.sent, 1, JSON.stringify(r));
  let m = decode(mails[0]);
  assert.equal(m.to, 'mot@x.vn'); assert.match(m.subject, /Một ơi/); assert.match(m.text, /bù thêm 140K/); assert.match(m.text, /bù thêm 449K/);
  assert.match(m.html, /\/e\/o\/\d+\.[0-9a-f]+\.gif/); assert.match(m.text, /huy-email/);
  r = await j('POST', '/api/admin/upsell/run', {});
  assert.equal(r.sent, 0); assert.equal(mails.length, 1);
  step('email mời nâng cấp: giảm 111K cho Trọn Bộ (560K → 449K), có ảnh đếm mở + link huỷ; chạy lại không gửi trùng');

  as('u1'); me1 = await j('GET', '/api/account/me');
  assert.equal(me1.offers.licenses[0].all.price, 449000); assert.ok(me1.offers.licenses[0].all.until > Date.now());
  // mở + bấm link trong email
  const pix = m.html.match(/\/e\/o\/[^"]+/)[0];
  await fetch(base + pix);
  const click = m.html.match(/\/e\/c\/[^"]+/)[0].replace(/&amp;/g, '&');
  const cr = await fetch(base + click, { redirect: 'manual' });
  assert.equal(cr.status, 302); assert.equal(cr.headers.get('location'), '/tai-khoan?nang-cap=1&src=email-offer');
  const bad = await fetch(base + click.replace(/\.[0-9a-f]+\?/, '.0000000000000000?'), { redirect: 'manual' });
  assert.equal(bad.status, 302);
  step('web hiện đúng giá ưu đãi 449K + hạn; đếm mở/bấm, link giả không được tính');

  await j('POST', '/api/account/upgrade', { key: k1, target: 'combo', games: ['quan-bar'] }, 400);
  const up1 = await j('POST', '/api/account/upgrade', { key: k1, target: 'all', source: 'email:offer' });
  let ov = (await j('GET', `/api/orders/${up1.code}?t=${up1.token}`)).order;
  assert.equal(ov.amount, 449000); assert.equal(ov.planName, 'Nâng cấp lên Gói Trọn Bộ'); assert.ok(ov.bank.qr.includes('amount=449000'));
  as('admin'); await j('POST', `/api/admin/orders/${up1.code}/mark-paid`, {});
  as('u1'); me1 = await j('GET', '/api/account/me');
  assert.equal(me1.licenses.length, 1); assert.equal(me1.licenses[0].key, k1); assert.equal(me1.licenses[0].allGames, true);
  assert.equal(me1.offers.licenses.length, 0);
  step('nâng lên Trọn Bộ: đơn 449K, trả tiền xong cùng key có mọi game, hết ưu đãi');

  // khách 2: Gói Lẻ, rồi ra game mới
  const k2 = await buy('u2', 'le', ['quan-bar']);
  as('admin');
  await j('PATCH', `/api/admin/games/${hidden[1].id}`, { visible: true });
  r = await j('POST', '/api/admin/upsell/run', {});
  const got = mails.slice(1).map(decode);
  const toHai = got.filter(x => x.to === 'hai@x.vn');
  assert.ok(toHai.some(x => /Key Gói Lẻ/.test(x.subject)), 'email gửi key');
  assert.ok(toHai.some(x => /Game mới .*69K/.test(x.subject)), 'email game mới');
  assert.ok(got.some(x => x.to === 'mot@x.vn' && /đã có sẵn/.test(x.subject)), 'Trọn Bộ: đã có sẵn');
  assert.ok(got.some(x => x.to === 'mot@x.vn' && /Key Gói Trọn Bộ/.test(x.subject)), 'email sau nâng cấp');
  step('đơn mới nhận email gửi key; game mới: khách lẻ được mời 69K, khách Trọn Bộ được báo "đã có sẵn"');

  as('u2');
  const me2 = await j('GET', '/api/account/me');
  assert.equal(me2.offers.newGames.find(g => g.id === hidden[1].id).price, 69000);
  const ag = await j('POST', '/api/account/upgrade', { target: 'addgame', gameId: hidden[1].id });
  as('admin'); await j('POST', `/api/admin/orders/${ag.code}/mark-paid`, {});
  as('u2');
  const lic2 = (await j('GET', '/api/account/me')).licenses[0];
  assert.equal(lic2.key, k2); assert.deepEqual(lic2.games.map(g => g.id).sort(), ['quan-bar', hidden[1].id].sort());
  const combo2 = (await j('GET', '/api/account/me')).offers.licenses[0].combo;
  assert.equal(combo2.price, 229000 - 89000 - 69000); assert.equal(combo2.need, 1);
  step('thêm game mới vào key 69K; giá lên Combo trừ đúng số đã trả (229 − 89 − 69 = 71K)');

  await j('POST', '/api/up/event', { k: 'checkout_shown' }); await j('POST', '/api/up/event', { k: 'checkout_accept' }); await j('POST', '/api/up/event', { k: 'hack' });
  as('admin');
  const rep = (await j('GET', '/api/admin/upsell')).report;
  assert.equal(rep.upgrades.orders, 2); assert.equal(rep.upgrades.revenue, 449000 + 69000); assert.equal(rep.upgrades.customers, 2);
  assert.equal(rep.events.checkout_shown, 1); assert.equal(rep.events.checkout_accept, 1); assert.equal(rep.events.hack, undefined);
  const offerRow = rep.emails.find(e => e.type === 'offer');
  assert.equal(offerRow.sent, 1); assert.equal(offerRow.opened, 1); assert.equal(offerRow.clicked, 1);
  assert.equal(rep.bySource['email:offer'].revenue, 449000); assert.equal(rep.bySource['popup:checkout'].orders, 2);
  step('báo cáo: doanh thu nâng cấp, nguồn đơn, popup, email gửi/mở/bấm');

  // ----- khách đăng ký nhưng chưa mua -----
  as('u3'); await j('POST', '/api/account/register', { name: 'Phạm Ba', phone: '0901000003', email: 'ba@x.vn', password: 'abcdef' });
  assert.equal((await j('GET', '/api/account/me')).firstOffer, null); // mới đăng ký: chưa có ưu đãi
  as('u4'); await j('POST', '/api/account/register', { name: 'Võ Bốn', phone: '0901000004', email: 'bon@x.vn', password: 'abcdef' });
  const o4 = await j('POST', '/api/orders', { planId: 'combo', games: (await j('GET', '/api/catalog')).games.slice(0, 3).map(g => g.id) });
  assert.equal((await j('GET', `/api/orders/${o4.code}?t=${o4.token}`)).order.amount, 229000);
  editDb(d => {
    for (const u of d.users) if (u.email === 'ba@x.vn' || u.email === 'bon@x.vn') u.createdAt -= 25 * 3600000;
    d.orders.find(o => o.code === o4.code).createdAt -= 3 * 3600000;
  });
  as('admin');
  let n0 = mails.length;
  r = await j('POST', '/api/admin/upsell/run', {});
  let fresh = mails.slice(n0).map(decode);
  const wBa = fresh.find(x => x.to === 'ba@x.vn');
  assert.ok(wBa, 'email ưu đãi đơn đầu'); assert.match(wBa.subject, /giảm đến 100K/);
  assert.doesNotMatch(wBa.text, /Gói Lẻ/); assert.match(wBa.text, /199K/); assert.match(wBa.text, /549K/); assert.match(wBa.text, /thường 229K/);
  const aBon = fresh.filter(x => x.to === 'bon@x.vn');
  assert.equal(aBon.length, 1); assert.match(aBon[0].subject, new RegExp(`#${o4.code}`));
  assert.match(decodeURIComponent(aBon[0].html), new RegExp(`don-hang\\.html\\?code=${o4.code}&t=${o4.token}`));
  n0 = mails.length;
  r = await j('POST', '/api/admin/upsell/run', {});
  assert.equal(mails.length, n0, 'không gửi dồn email ngay sau email nhắc đơn');
  step('đăng ký 1 ngày chưa mua: email ưu đãi đơn đầu (Gói Lẻ giữ 89K; Combo 199K, Trọn Bộ 549K); tạo đơn chưa trả: email nhắc kèm link đơn, không gửi dồn');

  as('u3');
  const me3 = await j('GET', '/api/account/me');
  assert.equal(me3.firstOffer.prices.le.price, 89000); assert.equal(me3.firstOffer.prices.combo.price, 199000); assert.ok(me3.upsell.first);
  assert.ok(me3.firstOffer.until > Date.now() + 70 * 3600000);
  const o3 = await j('POST', '/api/orders', { planId: 'combo', games: (await j('GET', '/api/catalog')).games.slice(0, 3).map(g => g.id), source: 'popup:don-dau' });
  const ov3 = (await j('GET', `/api/orders/${o3.code}?t=${o3.token}`)).order;
  assert.equal(ov3.amount, 199000); assert.ok(ov3.bank.qr.includes('amount=199000'));
  as('admin'); await j('POST', `/api/admin/orders/${o3.code}/mark-paid`, {});
  as('u3');
  const me3b = await j('GET', '/api/account/me');
  assert.equal(me3b.firstOffer, null); assert.equal(me3b.licenses.length, 1);
  step('khách mua với giá đơn đầu: đơn Combo 199K (QR đúng số tiền); mua xong hết ưu đãi');

  // khách 4: ưu đãi còn 7 giờ → email nhắc; ưu đãi hết hạn thì giá trở lại bình thường
  editDb(d => {
    const u = d.users.find(x => x.email === 'bon@x.vn');
    u.mailedWelcome = Date.now() - 65 * 3600000; u.firstStart = Date.now() - 65 * 3600000;
    for (const o of d.orders) if (o.mailedAbandoned) o.mailedAbandoned -= 25 * 3600000;
  });
  as('admin');
  n0 = mails.length;
  await j('POST', '/api/admin/upsell/run', {});
  fresh = mails.slice(n0).map(decode).filter(x => x.to === 'bon@x.vn');
  assert.equal(fresh.length, 1, JSON.stringify(fresh.map(x => x.subject))); assert.match(fresh[0].subject, /hết hạn/); assert.match(fresh[0].text, /199K/);
  editDb(d => { d.users.find(x => x.email === 'bon@x.vn').firstStart -= 8 * 3600000; });
  as('u4');
  assert.equal((await j('GET', '/api/account/me')).firstOffer, null);
  const o4b = await j('POST', '/api/orders', { planId: 'le', games: ['chanh-dien'] });
  assert.equal((await j('GET', `/api/orders/${o4b.code}?t=${o4b.token}`)).order.amount, 89000);
  step('ưu đãi còn 7 giờ: email nhắc sắp hết hạn; hết hạn thì giá về bình thường');

  as('admin');
  const rep2 = (await j('GET', '/api/admin/upsell')).report;
  assert.equal(rep2.first.orders, 1); assert.equal(rep2.first.revenue, 199000); assert.equal(rep2.first.nonBuyers, 1); assert.equal(rep2.first.offered, 2);
  assert.equal(rep2.bySource['popup:don-dau'].revenue, 199000);
  assert.equal(rep2.emails.find(e => e.type === 'welcome').sent, 1); assert.equal(rep2.emails.find(e => e.type === 'abandoned').sent, 1);
  const prev2 = await j('POST', '/api/admin/upsell/preview', { type: 'welcome' });
  assert.match(prev2.subject, /giảm đến 100K/); assert.doesNotMatch(prev2.html, /\{gia_dau/);
  step('báo cáo khách chưa mua: đơn nhờ ưu đãi, doanh thu, nguồn popup:don-dau; xem trước email ưu đãi đơn đầu');

  // huỷ nhận email
  const unsub = decode(mails[0]).text.match(/huy-email\?u=(\w+)&s=(\w+)/);
  const ur = await fetch(`${base}/huy-email?u=${unsub[1]}&s=${unsub[2]}`);
  assert.match(await ur.text(), /Đã huỷ/);
  assert.equal((await j('GET', '/api/admin/upsell')).report.optOut, 1);
  const prev = await j('POST', '/api/admin/upsell/preview', { type: 'offer', template: { subject: 'Chào {ten}', body: 'Combo {gia_combo}\n[Nút](/tai-khoan)' } });
  assert.equal(prev.subject, 'Chào An'); assert.match(prev.html, /Nút<\/a>/);
  step('huỷ nhận email bằng link; xem trước mẫu email');

  // Amazon SES: tên đăng nhập là mã AKIA…, địa chỉ người gửi nằm ở ô riêng
  as('admin');
  await j('PUT', '/api/admin/upsell', { cfg: { smtpUser: 'AKIAFAKEKEY123', fromEmail: '' } });
  let tr = await j('POST', '/api/admin/upsell/test', { to: 'thu@x.vn', type: 'offer' }, 400);
  assert.match(tr.error || '', /Email người gửi/);
  await j('PUT', '/api/admin/upsell', { cfg: { fromEmail: 'hotro@netxioviet.com', fromName: 'NetXio Việt' } });
  const nMail = mails.length;
  tr = await j('POST', '/api/admin/upsell/test', { to: 'thu@x.vn', type: 'offer' });
  assert.ok(tr.ok, JSON.stringify(tr)); assert.equal(mails.length, nMail + 1);
  assert.match(mails.at(-1), /^From: =\?UTF-8\?B\?[^\r\n]+\?= <hotro@netxioviet\.com>$/m);
  assert.match(mails.at(-1), /^Message-ID: <[0-9a-f]+@netxioviet\.com>$/m);
  assert.equal(envFrom.at(-1), '<hotro@netxioviet.com>');
  await j('PUT', '/api/admin/upsell', { cfg: { smtpUser: '', fromEmail: '' }, smtpPassClear: true });
  const up2 = await j('GET', '/api/admin/upsell');
  assert.equal(up2.smtpPassSet, false); assert.equal(up2.cfg.fromEmail, '');
  step('Amazon SES: thiếu email người gửi thì báo lỗi; có thì From + MAIL FROM dùng hotro@netxioviet.com; nút quay lại Gmail ngân hàng xoá mật khẩu SMTP');

  console.log('\nBÁN THÊM: TẤT CẢ ĐỀU QUA ✅');
} catch (e) {
  console.error('\n❌', e.message, '\n', errOut.slice(-2000));
  process.exitCode = 1;
} finally {
  srv.kill(); smtp.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
