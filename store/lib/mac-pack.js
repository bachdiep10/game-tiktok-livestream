// Bản game cho máy Mac: lấy file ZIP Windows đã tải lên, bỏ các file .bat,
// thêm file bấm đúp .command (có quyền chạy) + HUONG-DAN-MAC.txt.
// Không cần tải thêm file nào lên web: máy chủ tự tạo bản Mac từ bản Windows (lưu tạm để lần sau tải nhanh).
// Dùng chung cho máy chủ cửa hàng (/tai-ve/<id>?os=mac) và tools/dong-goi-game.mjs.
import zlib from 'node:zlib';
import { liveInfo, GUIDE_MAC } from '../web/js/live-guide.js';

export const MAC_PACK_REV = 1; // tăng số này khi đổi nội dung file .command để máy chủ tạo lại bản Mac

// ---------- nội dung file chạy ----------
const safe = (s) => String(s || '').replace(/["'`$\\]/g, '');

export function macRunScript({ name, control, port = 3000 }) {
  name = safe(name); control = safe(control);
  return `#!/bin/bash
# ${name} - bấm đúp file này để chạy game trên máy Mac.
# Lần đầu macOS có thể chặn: vào Cài đặt hệ thống > Quyền riêng tư & Bảo mật > bấm "Vẫn mở".
cd "$(dirname "$0")" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.volta/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
printf '\\033]0;${name} - GIU CUA SO NAY MO\\007'
clear
echo "=========================================="
echo "  ${name}"
echo "  Giữ cửa sổ này mở suốt buổi LIVE."
echo "=========================================="
pause_exit() { echo; read -n1 -r -s -p "Nhấn phím bất kỳ để đóng cửa sổ..."; echo; exit "\${1:-1}"; }

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "❌ Máy chưa cài Node.js."
  echo "   Đang mở trang tải: chọn bản LTS, bấm 'macOS Installer (.pkg)', cài xong bấm đúp lại file này."
  open "https://nodejs.org/en/download"
  pause_exit 1
fi
major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$major" -lt 20 ]; then
  echo "❌ Node.js trên máy đã cũ ($(node -v)). Cần bản 20 trở lên: tải bản LTS mới ở nodejs.org."
  open "https://nodejs.org/en/download"
  pause_exit 1
fi

# Bỏ đánh dấu "tải từ Internet" cho cả thư mục game, để macOS không hỏi lại các lần sau
xattr -dr com.apple.quarantine . 2>/dev/null

# Tắt bản game cũ còn chạy ngầm trên cổng ${port}
old=$(lsof -ti tcp:${port} -sTCP:LISTEN 2>/dev/null)
if [ -n "$old" ]; then kill $old 2>/dev/null; sleep 1; fi

if [ ! -d node_modules/msedge-tts ] || [ ! -d node_modules/tiktok-live-connector ]; then
  echo
  echo "Đang cài thư viện lần đầu (1-2 phút, cần có mạng)..."
  if ! npm install --no-audit --no-fund; then
    echo "❌ Cài thư viện bị lỗi. Kiểm tra mạng Internet, tắt VPN rồi bấm đúp lại file này."
    pause_exit 1
  fi
fi

(sleep 2; open "http://127.0.0.1:${port}${control}") &
node server.js
echo
echo "Game đã dừng."
pause_exit 0
`;
}

export function macWindowScript({ name, page, folder, port = 3000 }) {
  name = safe(name); page = safe(page); folder = safe(folder).replace(/[^\w-]/g, '') || 'Game';
  const url = `http://127.0.0.1:${port}/${page}`;
  return `#!/bin/bash
# Mở màn hình game ${name} trong một cửa sổ riêng, khung dọc, không có thanh địa chỉ.
# Chỉ cần khi muốn xem thử hoặc dùng "Chụp cửa sổ". LIVE bằng OBS thì dùng nguồn Trình duyệt (Browser) với ${url}
URL="${url}"
PROFILE="$HOME/Library/Application Support/${folder}Live"
FLAGS=(--user-data-dir="$PROFILE" --no-first-run --new-window --app="$URL" --window-size=608,1110 --autoplay-policy=no-user-gesture-required --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows)
for app in "Google Chrome" "Microsoft Edge" "Brave Browser" "Chromium"; do
  if open -Ra "$app" 2>/dev/null; then open -na "$app" --args "\${FLAGS[@]}"; exit 0; fi
done
open "$URL"
`;
}

export function macGuideText({ name, run, win, page, control, server = 'https://netxioviet.com' }) {
  const t = `${name.toUpperCase()} - CHẠY TRÊN MÁY MAC

1. Cài Node.js (1 lần): vào nodejs.org/en/download, chọn bản LTS, bấm "macOS Installer (.pkg)", mở file vừa tải và bấm Tiếp tục đến hết.
2. Giải nén file ZIP (bấm đúp file ZIP), kéo thư mục game ra chỗ dễ tìm, ví dụ thư mục Tài liệu (Documents).
3. Bấm đúp ${run}.
   - Nếu macOS báo "không thể mở" / "Apple không thể kiểm tra": bấm Xong, vào Cài đặt hệ thống > Quyền riêng tư & Bảo mật, kéo xuống bấm "Vẫn mở" (Open Anyway), nhập mật khẩu máy, rồi bấm "Mở".
   - macOS 14 trở về trước: có thể chuột phải (Control + bấm) vào file > Mở > Mở.
   - Cách dự phòng: mở Terminal, gõ chữ  bash  và một dấu cách, kéo file ${run} vào cửa sổ Terminal, nhấn Enter.
4. Lần đầu cửa sổ Terminal tự cài thư viện 1-2 phút. Xong thì trình duyệt mở trang Kích hoạt: dán key > Kích hoạt.
5. Giữ cửa sổ Terminal mở suốt buổi LIVE (có thể thu nhỏ). Đóng nó là game dừng.
6. Bảng điều khiển: http://127.0.0.1:3000${control}  (nhập username TikTok > Kết nối)
7. Màn hình game để đưa lên LIVE: http://127.0.0.1:3000/${page}
   TikTok LIVE Studio KHÔNG có bản cho Mac. Trên Mac, LIVE bằng OBS Studio (miễn phí) + khoá phát trực tiếp (stream key) của TikTok:
   OBS > Nguồn > + > Trình duyệt (Browser) > dán đường dẫn trên, Rộng 1080, Cao 1920, tích "Điều khiển âm thanh qua OBS".
   Muốn xem thử màn hình game trong cửa sổ riêng: bấm đúp ${win}.

Hướng dẫn có hình: ${server}${GUIDE_MAC}
Mua key, xem key, chuyển máy: ${server}/tai-khoan.html
`;
  return t;
}

// ---------- đọc / ghi ZIP (không cần thư viện ngoài) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function dosTime(d = new Date()) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2)),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export function readZipEntries(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('File ZIP hỏng (không thấy mục lục).');
  const count = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (count === 0xFFFF || cdOffset === 0xFFFFFFFF) throw new Error('ZIP64 chưa hỗ trợ.');
  const entries = [];
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('File ZIP hỏng (mục lục sai).');
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    const flags = buf.readUInt16LE(p + 8);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString(flags & 0x800 ? 'utf8' : 'latin1');
    entries.push({
      name, flags, method: buf.readUInt16LE(p + 10), compSize: buf.readUInt32LE(p + 20), size: buf.readUInt32LE(p + 24),
      localOffset: buf.readUInt32LE(p + 42), central: buf.subarray(p, p + 46 + nameLen + extraLen + commentLen),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function localRecord(buf, e) {
  const o = e.localOffset;
  if (buf.readUInt32LE(o) !== 0x04034b50) throw new Error(`File ZIP hỏng ở ${e.name}`);
  const start = o + 30 + buf.readUInt16LE(o + 26) + buf.readUInt16LE(o + 28);
  let end = start + e.compSize;
  if (e.flags & 0x8) end += buf.readUInt32LE(end) === 0x08074b50 ? 16 : 12;
  return { record: buf.subarray(o, end), dataStart: start };
}

export function readZipFile(buf, entries, name) {
  const e = entries.find(x => x.name === name);
  if (!e) return null;
  const { dataStart } = localRecord(buf, e);
  const raw = buf.subarray(dataStart, dataStart + e.compSize);
  return e.method === 0 ? Buffer.from(raw) : e.method === 8 ? zlib.inflateRawSync(raw) : null;
}

function newEntry(name, data, mode) {
  const nameBuf = Buffer.from(name, 'utf8');
  const comp = zlib.deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const { time, date } = dosTime();
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(8, 8);
  local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12); local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE((3 << 8) | 20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x800, 8);
  central.writeUInt16LE(8, 10); central.writeUInt16LE(time, 12); central.writeUInt16LE(date, 14); central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(comp.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(((0o100000 | mode) << 16) >>> 0, 38);
  return { record: Buffer.concat([local, nameBuf, comp]), central: Buffer.concat([central, nameBuf]) };
}

// Ghép ZIP mới: giữ các mục cũ (trừ mục bị bỏ), thêm mục mới
function writeZip(buf, keep, added) {
  const parts = [], centrals = [];
  let offset = 0;
  for (const e of keep) {
    const { record } = localRecord(buf, e);
    const c = Buffer.from(e.central);
    c.writeUInt32LE(offset, 42);
    parts.push(record); centrals.push(c); offset += record.length;
  }
  for (const a of added) {
    const c = Buffer.from(a.central);
    c.writeUInt32LE(offset, 42);
    parts.push(a.record); centrals.push(c); offset += a.record.length;
  }
  const cd = Buffer.concat(centrals);
  const n = keep.length + added.length;
  if (n > 0xFFFF || offset + cd.length > 0xFFFFFFFF) throw new Error('ZIP quá lớn.');
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(n, 8); eocd.writeUInt16LE(n, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, eocd]);
}

// Từ ZIP Windows (Buffer) tạo ZIP cho Mac (Buffer)
export function buildMacZip(winZip, { gameId, name } = {}) {
  const entries = readZipEntries(winZip);
  const files = entries.filter(e => !e.name.endsWith('/'));
  // Thư mục gốc chung (vd. "GoBom/") nếu mọi file đều nằm trong 1 thư mục
  const first = files[0]?.name.split('/')[0];
  const root = first && files.every(e => e.name.startsWith(`${first}/`)) ? `${first}/` : '';
  let product = {};
  try { product = JSON.parse(readZipFile(winZip, entries, `${root}product.json`)?.toString('utf8') || '{}'); } catch { /* không có */ }
  const id = product.game || gameId || '';
  const info = liveInfo(id);
  const page = info.url.replace(/^.*:3000\//, '');
  const control = product.control || info.control.replace(/^.*:3000/, '');
  const title = product.name || name || 'Game LIVE';
  const run = info.run.replace(/\.bat$/i, '.command');
  const win = info.win.replace(/\.bat$/i, '.command');
  const skip = new Set([`${root}${run}`, `${root}${win}`, `${root}HUONG-DAN-MAC.txt`]);
  const keep = entries.filter(e => !/\.bat$/i.test(e.name) && !skip.has(e.name));
  const added = [
    newEntry(`${root}${run}`, Buffer.from(macRunScript({ name: title, control })), 0o755),
    newEntry(`${root}${win}`, Buffer.from(macWindowScript({ name: title, page, folder: info.folder })), 0o755),
    newEntry(`${root}HUONG-DAN-MAC.txt`, Buffer.from(macGuideText({ name: title, run, win, page, control, server: product.server || undefined })), 0o644),
  ];
  return writeZip(winZip, keep, added);
}

export const macFileName = (name) => String(name || 'game.zip').replace(/(\.zip)?$/i, '-Mac.zip');
