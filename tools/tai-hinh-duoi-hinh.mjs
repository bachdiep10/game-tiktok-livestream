// Tải sẵn các hình emoji 3D (Microsoft Fluent Emoji, giấy phép MIT) cho game Đuổi hình bắt chữ.
//   node tools/tai-hinh-duoi-hinh.mjs          → tải hình cho mọi câu đố trong public/js/duoi-hinh/cauDo.js
//   node tools/tai-hinh-duoi-hinh.mjs --tat-ca → tải cả thư viện (~1.600 hình, ~40 MB)
// Hình lưu ở public/assets/duoi-hinh/hinh/<mã>.png. Hình nào đã có thì bỏ qua.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/duoi-hinh/thu-vien.json'), 'utf8'));
const OUT = path.join(ROOT, 'public/assets/duoi-hinh/hinh');
const { CAU_DO, HINH_GIAO_DIEN } = await import(pathToFileURL(path.join(ROOT, 'public/js/duoi-hinh/cauDo.js')));
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config-duoi-hinh.json'), 'utf8'));

export const codeOf = (e) => Array.from(e.replace(/️/g, '')).map((c) => c.codePointAt(0).toString(16)).join('-');
const byCode = new Map(LIB.hinh.map(([glyph, , , p]) => [codeOf(glyph), p]));

const want = new Set();
if (process.argv.includes('--tat-ca')) for (const [glyph] of LIB.hinh) want.add(codeOf(glyph));
for (const e of HINH_GIAO_DIEN) want.add(codeOf(e));
for (const [h] of CAU_DO) for (const e of h.split(/\s+/)) want.add(codeOf(e));
for (const c of cfg.cauDoThem || []) for (const e of c.hinh || []) if (!/\.(png|jpe?g|webp|gif)$/i.test(e)) want.add(codeOf(e));

fs.mkdirSync(OUT, { recursive: true });
let ok = 0, skip = 0;
const missing = [];
for (const code of want) {
  const file = path.join(OUT, `${code}.png`);
  if (fs.existsSync(file)) { skip++; continue; }
  const p = byCode.get(code);
  if (!p) { missing.push(code); continue; }
  const url = LIB.goc + p.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(url);
  if (!res.ok) { missing.push(`${code} (HTTP ${res.status})`); continue; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  ok++;
}
console.log(`✓ Tải mới ${ok} hình, có sẵn ${skip} hình.${missing.length ? ` Không có trong thư viện: ${missing.join(', ')}` : ''}`);
