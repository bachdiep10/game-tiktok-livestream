// Đóng gói từng game thành 1 file ZIP riêng để bán (game nào đi game đấy), có khoá bản quyền.
//
//   node tools/dong-goi-game.mjs                 → đóng gói tất cả game
//   node tools/dong-goi-game.mjs chanh-dien      → chỉ game Chánh điện
//   Tuỳ chọn: --server https://netxioviet.com   (máy chủ key, mặc định netxioviet.com)
//             --pem duong-dan/license-public.pem (nếu không có sẽ tải từ máy chủ)
//
// Kết quả: dist/ChanhDien-<phiên bản>.zip, dist/QuanBar-..., dist/TraDa-..., dist/CauCa-..., dist/RongRan-..., dist/DaiChien-....zip
// Sau đó vào Quản trị > Game > Sửa > "Tải file lên" để khách có key tải về.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GUIDE_CHANH_DIEN, GUIDE_QUAN_BAR, GUIDE_TRA_DA, GUIDE_CAU_CA, GUIDE_RONG_RAN, GUIDE_DAI_CHIEN, GUIDE_BIA_HOI, GUIDE_DAM_CUOI, GUIDE_DUOI_HINH } from '../store/lib/db.js';

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
  'tra-da': {
    name: 'Trà Đá Vỉa Hè', folder: 'TraDa', control: '/tra-da-control.html', guide: GUIDE_TRA_DA,
    files: ['run-tra-da.bat', 'mo-cua-so-tra-da.bat', 'config-tra-da.json', 'public/tra-da.html', 'public/tra-da-control.html', 'public/js/tra-da',
      'public/assets/nhac-tra-da/DAT-NHAC-VAO-DAY.txt'],
  },
  'cau-ca': {
    name: 'Bến Câu Sinh Tồn', folder: 'CauCa', control: '/cau-ca-control.html', guide: GUIDE_CAU_CA,
    files: ['run-cau-ca.bat', 'mo-cua-so-cau-ca.bat', 'config-cau-ca.json', 'public/cau-ca.html', 'public/cau-ca-control.html', 'public/js/cau-ca',
      'public/assets/nhac-cau-ca/DAT-NHAC-VAO-DAY.txt'],
  },
  'rong-ran': {
    name: 'Rồng Rắn Lên Mây', folder: 'RongRan', control: '/rong-ran-control.html', guide: GUIDE_RONG_RAN,
    files: ['run-rong-ran.bat', 'mo-cua-so-rong-ran.bat', 'config-rong-ran.json', 'public/rong-ran.html', 'public/rong-ran-control.html', 'public/js/rong-ran',
      'public/assets/nhac-rong-ran/DAT-NHAC-VAO-DAY.txt'],
  },
  'dai-chien': {
    name: 'Sơn Tinh Thủy Tinh Đại Chiến', folder: 'DaiChien', control: '/dai-chien-control.html', guide: GUIDE_DAI_CHIEN,
    files: ['run-dai-chien.bat', 'mo-cua-so-dai-chien.bat', 'config-dai-chien.json', 'public/dai-chien.html', 'public/dai-chien-control.html', 'public/js/dai-chien',
      'public/assets/nhac-dai-chien/DAT-NHAC-VAO-DAY.txt'],
  },
  'bia-hoi': {
    name: 'Bia Hơi Vỉa Hè', folder: 'BiaHoi', control: '/bia-hoi-control.html', guide: GUIDE_BIA_HOI,
    files: ['run-bia-hoi.bat', 'mo-cua-so-bia-hoi.bat', 'config-bia-hoi.json', 'public/bia-hoi.html', 'public/bia-hoi-control.html', 'public/js/bia-hoi',
      'public/assets/nhac-bia-hoi/DAT-NHAC-VAO-DAY.txt'],
  },
  'dam-cuoi': {
    name: 'Ăn Cỗ Đám Cưới', folder: 'DamCuoi', control: '/dam-cuoi-control.html', guide: GUIDE_DAM_CUOI,
    files: ['run-dam-cuoi.bat', 'mo-cua-so-dam-cuoi.bat', 'config-dam-cuoi.json', 'public/dam-cuoi.html', 'public/dam-cuoi-control.html', 'public/js/dam-cuoi',
      'public/assets/nhac-dam-cuoi/DAT-NHAC-VAO-DAY.txt'],
  },
  'duoi-hinh': {
    name: 'Đuổi Hình Bắt Chữ', folder: 'DuoiHinh', control: '/duoi-hinh-control.html', guide: GUIDE_DUOI_HINH,
    files: ['run-duoi-hinh.bat', 'mo-cua-so-duoi-hinh.bat', 'config-duoi-hinh.json', 'public/duoi-hinh.html', 'public/duoi-hinh-control.html', 'public/thu-vien-hinh.html',
      'public/js/duoi-hinh', 'public/assets/duoi-hinh', 'public/assets/nhac-duoi-hinh/DAT-NHAC-VAO-DAY.txt', 'tools/tai-hinh-duoi-hinh.mjs'],
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

// Không lấy được khoá (mất mạng) thì vẫn đóng gói: game tự tải khoá từ máy chủ qua HTTPS lần đầu kích hoạt.
const pem = await publicKey().catch((e) => { console.warn(`⚠ ${e.message}. Đóng gói không kèm khoá công khai.`); return ''; });
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
  if (pem) fs.writeFileSync(path.join(dir, 'license', 'license-public.pem'), pem);
  const guide = `${p.name.toUpperCase()} - HƯỚNG DẪN CÀI ĐẶT (bản ${VERSION})\r\n\r\n${p.guide.replace(/\n/g, '\r\n')}\r\n\r\nMua key, xem key, chuyển máy: ${SERVER}/tai-khoan.html\r\n`;
  fs.writeFileSync(path.join(dir, 'HUONG-DAN.txt'), '﻿' + guide);
  const out = path.join(dist, `${p.folder}-${VERSION}.zip`);
  zip(dir, out);
  console.log(`✓ ${p.name}: ${out} (${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
}
