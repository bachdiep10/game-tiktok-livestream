// Đóng gói từng game thành 1 file ZIP riêng để bán (game nào đi game đấy), có khoá bản quyền.
//
//   node tools/dong-goi-game.mjs                 → đóng gói cả 2 game
//   node tools/dong-goi-game.mjs chanh-dien      → chỉ game Chánh điện
//   Tuỳ chọn: --server https://netxioviet.com   (máy chủ key, mặc định netxioviet.com)
//             --pem duong-dan/license-public.pem (nếu không có sẽ tải từ máy chủ)
//
// Kết quả: dist/ChanhDien-<phiên bản>.zip, dist/QuanBar-<phiên bản>.zip
// Sau đó vào Quản trị > Game > Sửa > "Tải file lên" để khách có key tải về.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GUIDE_CHANH_DIEN, GUIDE_QUAN_BAR } from '../store/lib/db.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const SERVER = opt('server', 'https://netxioviet.com').replace(/\/$/, '');
const only = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const VERSION = (fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').match(/const VERSION = '([^']+)'/) || [])[1] || '1.0';

const COMMON = ['server.js', 'package.json', 'package-lock.json', 'config.json', 'public/css', 'public/js/audio.js', 'public/js/fake.js',
  'license/gate.js', 'license/license-client.js', 'license/kich-hoat.html'];

const PRODUCTS = {
  'chanh-dien': {
    name: 'Chánh Điện Lễ Phật', folder: 'ChanhDien', control: '/control.html', guide: GUIDE_CHANH_DIEN,
    files: ['run.bat', 'mo-cua-so-game.bat', 'public/game.html', 'public/control.html',
      'public/js/game.js', 'public/js/scene.js', 'public/js/buddha.js', 'public/js/characterArt.js', 'public/js/control.js',
      'public/assets/chanh-dien.jpg', 'public/assets/README.txt'],
    patch: { 'public/control.html': [/ <a href="bar-control.html"[^>]*>[^<]*<\/a>/, ''] },
  },
  'quan-bar': {
    name: 'Quán Bar Sôi Động', folder: 'QuanBar', control: '/bar-control.html', guide: GUIDE_QUAN_BAR,
    files: ['run-bar.bat', 'mo-cua-so-bar.bat', 'config-bar.json', 'public/bar.html', 'public/bar-control.html', 'public/js/bar',
      'public/assets/nhac-bar/DAT-NHAC-VAO-DAY.txt', 'public/assets/anh-led/DAT-ANH-VAO-DAY.txt'],
    patch: { 'public/bar-control.html': [/ <a href="control.html"[^>]*>[^<]*<\/a>/, ''] },
  },
};

async function publicKey() {
  const p = opt('pem');
  if (p) return fs.readFileSync(p, 'utf8');
  const res = await fetch(`${SERVER}/api/license/public-key`);
  const pem = await res.text();
  if (!pem.includes('BEGIN PUBLIC KEY')) throw new Error(`Không lấy được khoá công khai từ ${SERVER}`);
  return pem;
}

function copy(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) copy(path.join(src, f), path.join(dst, f)); }
  else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
}

function zip(dir, out) {
  fs.rmSync(out, { force: true });
  if (process.platform === 'win32') {
    // tar có sẵn trên Windows 10/11, tạo ZIP chuẩn (đường dẫn dùng "/"), khác Compress-Archive của PowerShell 5
    execFileSync('tar', ['-a', '-c', '-f', out, '-C', path.dirname(dir), path.basename(dir)], { stdio: 'inherit' });
  } else {
    execFileSync('zip', ['-qr', out, path.basename(dir)], { cwd: path.dirname(dir), stdio: 'inherit' });
  }
}

const pem = await publicKey();
const dist = path.join(ROOT, 'dist');
fs.mkdirSync(dist, { recursive: true });

for (const [id, p] of Object.entries(PRODUCTS)) {
  if (only.length && !only.includes(id)) continue;
  const dir = path.join(dist, p.folder);
  fs.rmSync(dir, { recursive: true, force: true });
  for (const f of [...COMMON, ...p.files]) copy(path.join(ROOT, f), path.join(dir, f));
  for (const [f, [re, by]] of Object.entries(p.patch || {})) {
    const fp = path.join(dir, f);
    fs.writeFileSync(fp, fs.readFileSync(fp, 'utf8').replace(re, by));
  }
  fs.writeFileSync(path.join(dir, 'product.json'), JSON.stringify({ game: id, name: p.name, control: p.control, server: SERVER, version: VERSION }, null, 2));
  fs.writeFileSync(path.join(dir, 'license', 'license-public.pem'), pem);
  const guide = `${p.name.toUpperCase()} - HƯỚNG DẪN CÀI ĐẶT (bản ${VERSION})\r\n\r\n${p.guide.replace(/\n/g, '\r\n')}\r\n\r\nMua key, xem key, chuyển máy: ${SERVER}/tai-khoan.html\r\n`;
  fs.writeFileSync(path.join(dir, 'HUONG-DAN.txt'), '﻿' + guide);
  const out = path.join(dist, `${p.folder}-${VERSION}.zip`);
  zip(dir, out);
  console.log(`✓ ${p.name}: ${out} (${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
}
