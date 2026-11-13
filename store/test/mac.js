// Bản cho máy Mac: tải ?os=mac (bỏ .bat, thêm .command có quyền chạy) + key kích hoạt được trên Mac (mã máy IOPlatformUUID).
// Chạy: node test/mac.js
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readZipEntries, readZipFile, buildMacZip } from '../lib/mac-pack.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lgmac-'));
const dataDir = path.join(tmp, 'data');
const port = 19000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const srv = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: port, DATA_DIR: dataDir }, stdio: 'pipe' });
const jars = { admin: '', user: '' };
let jar = 'admin';
async function j(method, url, body, expectStatus) {
  const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie: jars[jar] }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get('set-cookie'); if (sc) jars[jar] = sc.split(';')[0];
  const json = await res.json();
  if (expectStatus) assert.equal(res.status, expectStatus, `${url}: ${JSON.stringify(json)}`);
  else assert.ok(json.ok, `${url}: ${JSON.stringify(json)}`);
  return json;
}
const step = (s) => console.log('  ✓', s);

// Mô phỏng máy Mac: process.platform = darwin, lệnh ioreg trả IOPlatformUUID
const MAC_UUID = '8F3A2C1D-4B5E-4F60-9A7B-1C2D3E4F5A6B';
function onMac(script) {
  const bin = path.join(tmp, 'bin');
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(bin, 'ioreg'), `#!/bin/sh\necho '+-o J314sAP  <class IOPlatformExpertDevice>'\necho '  {'\necho '    "IOPlatformSerialNumber" = "C02XXXXXX"'\necho '    "IOPlatformUUID" = "${MAC_UUID}"'\necho '  }'\n`, { mode: 0o755 });
  const file = path.join(tmp, `mac-${Date.now()}.mjs`);
  fs.writeFileSync(file, `Object.defineProperty(process, 'platform', { value: 'darwin' });\n${script}`);
  return JSON.parse(execFileSync(process.execPath, [file], { cwd: root, env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }, encoding: 'utf8' }).trim().split('\n').pop());
}

try {
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/catalog'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }

  // 1) File ZIP kiểu bản Windows (có .bat)
  const pkg = path.join(tmp, 'QuanBar');
  fs.mkdirSync(path.join(pkg, 'license'), { recursive: true });
  fs.writeFileSync(path.join(pkg, 'run-bar.bat'), '@echo off\r\nnode server.js\r\n');
  fs.writeFileSync(path.join(pkg, 'mo-cua-so-bar.bat'), '@echo off\r\n');
  fs.writeFileSync(path.join(pkg, 'server.js'), 'console.log(1)\n');
  fs.writeFileSync(path.join(pkg, 'product.json'), JSON.stringify({ game: 'quan-bar', name: 'Quán Bar Sôi Động', control: '/bar-control.html', server: 'https://netxioviet.com' }));
  const winZip = path.join(tmp, 'QuanBar-2.10.0.zip');
  execFileSync('zip', ['-qr', winZip, 'QuanBar'], { cwd: tmp });

  jar = 'admin';
  await j('POST', '/api/admin/setup', { password: 'matkhau123' });
  const up = await fetch(`${base}/api/admin/games/quan-bar/file?name=QuanBar-2.10.0.zip`, { method: 'POST', headers: { cookie: jars.admin }, body: fs.readFileSync(winZip) });
  assert.ok((await up.json()).ok);
  jar = 'user';
  await j('POST', '/api/account/register', { name: 'Khách Mac', phone: '0912000111', email: 'mac@x.vn', password: 'matkhau1' });
  jar = 'admin';
  const lic = await j('POST', '/api/admin/licenses', { planId: 'le', games: ['quan-bar'], phone: '0912000111' });
  const key = lic.keys[0];
  jar = 'user';
  const me = await j('GET', '/api/account/me');
  const g = me.licenses.find(l => l.key === key).games.find(x => x.id === 'quan-bar');
  assert.equal(g.download, '/tai-ve/quan-bar');
  assert.equal(g.downloadMac, '/tai-ve/quan-bar?os=mac');
  step('tài khoản có 2 link tải: Windows /tai-ve/quan-bar và Mac ?os=mac');

  // 2) Tải bản Mac
  let r = await fetch(`${base}/tai-ve/quan-bar?os=mac`, { headers: { cookie: jars.user }, redirect: 'manual' });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-disposition'), /QuanBar-2\.10\.0-Mac\.zip/);
  const macBuf = Buffer.from(await r.arrayBuffer());
  const macFile = path.join(tmp, 'mac.zip');
  fs.writeFileSync(macFile, macBuf);
  execFileSync('unzip', ['-tq', macFile]);
  const info = execFileSync('zipinfo', [macFile], { encoding: 'utf8' });
  assert.match(info, /-rwxr-xr-x .* QuanBar\/run-bar\.command/);
  assert.match(info, /-rwxr-xr-x .* QuanBar\/mo-cua-so-bar\.command/);
  assert.match(info, /QuanBar\/HUONG-DAN-MAC\.txt/);
  assert.doesNotMatch(info, /\.bat/);
  const ent = readZipEntries(macBuf);
  const sh = readZipFile(macBuf, ent, 'QuanBar/run-bar.command').toString();
  assert.match(sh, /^#!\/bin\/bash/); assert.match(sh, /127\.0\.0\.1:3000\/bar-control\.html/); assert.doesNotMatch(sh, /\r/);
  execFileSync('bash', ['-n', '-c', sh]);
  assert.equal(readZipFile(macBuf, ent, 'QuanBar/server.js').toString(), 'console.log(1)\n');
  step('bản Mac: bỏ .bat, có run-bar.command + mo-cua-so-bar.command quyền chạy (755), HUONG-DAN-MAC.txt, file game giữ nguyên');

  r = await fetch(`${base}/tai-ve/quan-bar?os=mac`, { headers: { cookie: jars.user }, redirect: 'manual' });
  assert.equal(r.status, 200); assert.equal(Buffer.compare(Buffer.from(await r.arrayBuffer()), macBuf), 0);
  r = await fetch(`${base}/tai-ve/quan-bar?os=mac`, { redirect: 'manual' });
  assert.equal(r.status, 302);
  step('lần tải sau dùng bản đã tạo; chưa đăng nhập thì không tải được');

  // Bản Windows vẫn y nguyên
  r = await fetch(`${base}/tai-ve/quan-bar`, { headers: { cookie: jars.user } });
  assert.equal(Buffer.compare(Buffer.from(await r.arrayBuffer()), fs.readFileSync(winZip)), 0);
  step('bản Windows tải về y nguyên file đã tải lên');

  // Đổi file mới: bản Mac cũ bị xoá, tạo lại theo file mới
  jar = 'admin';
  fs.writeFileSync(path.join(pkg, 'server.js'), 'console.log(2)\n');
  execFileSync('zip', ['-qr', winZip, 'QuanBar'], { cwd: tmp });
  await fetch(`${base}/api/admin/games/quan-bar/file?name=QuanBar-2.10.1.zip`, { method: 'POST', headers: { cookie: jars.admin }, body: fs.readFileSync(winZip) });
  r = await fetch(`${base}/tai-ve/quan-bar?os=mac`, { headers: { cookie: jars.user } });
  const mac2 = Buffer.from(await r.arrayBuffer());
  assert.equal(readZipFile(mac2, readZipEntries(mac2), 'QuanBar/server.js').toString(), 'console.log(2)\n');
  assert.equal(fs.readdirSync(path.join(dataDir, 'files')).filter(f => f.includes('.mac')).length, 1);
  step('tải file game mới lên → bản Mac tự tạo lại, bản Mac cũ bị xoá');

  // ZIP tạo bằng tar của Windows (bsdtar, có data descriptor) cũng đọc được
  const tarZip = path.join(tmp, 'tar.zip');
  try {
    execFileSync('bsdtar', ['--format', 'zip', '-c', '-f', tarZip, '-C', tmp, 'QuanBar']);
    const m = buildMacZip(fs.readFileSync(tarZip));
    fs.writeFileSync(path.join(tmp, 'tar-mac.zip'), m);
    execFileSync('unzip', ['-tq', path.join(tmp, 'tar-mac.zip')]);
    step('ZIP tạo bằng tar (như trên Windows) cũng chuyển sang bản Mac được');
  } catch (e) { if (e.code !== 'ENOENT') throw e; console.log('  - bỏ qua kiểm tra bsdtar (máy không có bsdtar)'); }

  // 3) Kích hoạt key trên Mac (mô phỏng)
  const pem = await (await fetch(`${base}/api/license/public-key`)).text();
  fs.writeFileSync(path.join(tmp, 'pem'), pem);
  const macScript = `
    import fs from 'node:fs';
    import { checkLicense, getMachineId } from '${pathToFileURL(path.join(root, 'client', 'license-client.js')).href}';
    const r = await checkLicense({ server: '${base}', game: 'quan-bar', key: '${key}', publicKeyPem: fs.readFileSync('${path.join(tmp, 'pem')}', 'utf8'), cacheFile: '${path.join(tmp, 'mac-license.json')}' });
    console.log(JSON.stringify({ ok: r.ok, error: r.error || '', id: getMachineId() }));`;
  const a1 = onMac(macScript);
  assert.equal(a1.ok, true, a1.error);
  assert.equal(a1.id, crypto.createHash('sha256').update(`livegame:${MAC_UUID}`).digest('hex'));
  const a2 = onMac(macScript);
  assert.equal(a2.ok, true); assert.equal(a2.id, a1.id);
  step('key kích hoạt được trên Mac; mã máy = IOPlatformUUID (chạy lại vẫn đúng máy đó)');

  const { checkLicense } = await import('../client/license-client.js');
  const other = await checkLicense({ server: base, game: 'quan-bar', key, publicKeyPem: pem, cacheFile: path.join(tmp, 'linux.json') });
  assert.equal(other.ok, false);
  step('key đang dùng trên Mac thì máy khác bị chặn (1 key = 1 máy)');

  console.log('\nBẢN MAC: TẤT CẢ ĐỀU QUA ✅');
} catch (e) {
  console.error('\n❌', e);
  process.exitCode = 1;
} finally {
  srv.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
}
