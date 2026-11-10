// Cầu nối TikTok LIVE -> trình duyệt (OBS / TikTok LIVE Studio).
// Chạy: npm start  rồi mở http://127.0.0.1:3000/control.html
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createGate } from './license/gate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const BAR_CONFIG_PATH = path.join(__dirname, 'config-bar.json');
const TRA_DA_CONFIG_PATH = path.join(__dirname, 'config-tra-da.json');
const CAU_CA_CONFIG_PATH = path.join(__dirname, 'config-cau-ca.json');
const RONG_RAN_CONFIG_PATH = path.join(__dirname, 'config-rong-ran.json');
const DAI_CHIEN_CONFIG_PATH = path.join(__dirname, 'config-dai-chien.json');
const BIA_HOI_CONFIG_PATH = path.join(__dirname, 'config-bia-hoi.json');
const DAM_CUOI_CONFIG_PATH = path.join(__dirname, 'config-dam-cuoi.json');
const TAROT_CONFIG_PATH = path.join(__dirname, 'config-tarot.json');
const DUOI_HINH_CONFIG_PATH = path.join(__dirname, 'config-duoi-hinh.json');
const LEO_NUI_CONFIG_PATH = path.join(__dirname, 'config-leo-nui.json');
const GIEO_QUE_CONFIG_PATH = path.join(__dirname, 'config-gieo-que.json');
const LOP_HOC_CONFIG_PATH = path.join(__dirname, 'config-lop-hoc.json');
// Câu hỏi Sếp tự thêm cho game Lớp học: file riêng, KHÔNG nằm trong bản cập nhật nên cập nhật game không mất câu hỏi
const LOP_HOC_DE_THI_PATH = path.join(__dirname, 'de-thi-lop-hoc.json');

function loadConfig(file = CONFIG_PATH) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.warn(`[config] Không đọc được ${path.basename(file)}, dùng mặc định:`, err.message);
    return {};
  }
}

const config = loadConfig();
const PORT = Number(process.env.PORT || config.port || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  // Bản quyền: chưa kích hoạt key thì chuyển sang trang kích hoạt
  if (await gate.handle(req, res, pathname)) return;
  if (pathname === '/') pathname = gate.home();
  if (pathname === '/tts') {
    handleTts(url, res);
    return;
  }
  if (pathname === '/anh-dai-dien') {
    handleAvatar(url, res);
    return;
  }
  if (pathname === '/config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig()));
    return;
  }
  const MUSIC_FOLDERS = { '/chanh-dien-music.json': 'nhac-chanh-dien', '/bar-music.json': 'nhac-bar', '/tra-da-music.json': 'nhac-tra-da', '/rong-ran-music.json': 'nhac-rong-ran', '/cau-ca-music.json': 'nhac-cau-ca', '/dai-chien-music.json': 'nhac-dai-chien', '/bia-hoi-music.json': 'nhac-bia-hoi', '/dam-cuoi-music.json': 'nhac-dam-cuoi', '/tarot-music.json': 'nhac-tarot', '/duoi-hinh-music.json': 'nhac-duoi-hinh', '/leo-nui-music.json': 'nhac-leo-nui', '/gieo-que-music.json': 'nhac-gieo-que', '/lop-hoc-music.json': 'nhac-lop-hoc' };
  if (MUSIC_FOLDERS[pathname]) {
    // danh sách bài hát trong thư mục nhạc của game (public/assets/nhac-bar, nhac-tra-da, nhac-rong-ran, nhac-cau-ca, nhac-dai-chien), xếp theo tên file
    const folder = MUSIC_FOLDERS[pathname];
    const dir = path.join(PUBLIC_DIR, 'assets', folder);
    let list = [];
    try {
      list = fs.readdirSync(dir)
        .filter((f) => /\.(mp3|m4a|aac|ogg|wav|webm|opus)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }))
        .map((f) => `assets/${folder}/${encodeURIComponent(f)}`);
    } catch {
      /* chưa có thư mục */
    }
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(list));
    return;
  }
  if (pathname === '/bar-led.json' || pathname.startsWith('/bar-led/')) {
    // ảnh cho màn LED quán bar: thư mục trong config-bar.json "ledFolder"
    // (đường dẫn trên máy, vd. D:\\anh-led) hoặc mặc định public/assets/anh-led
    const cfgFolder = String(loadConfig(BAR_CONFIG_PATH).ledFolder || '').trim();
    const dir = cfgFolder ? path.resolve(__dirname, cfgFolder) : path.join(PUBLIC_DIR, 'assets', 'anh-led');
    const isImg = (f) => /\.(png|jpe?g|webp|gif|bmp)$/i.test(f);
    if (pathname === '/bar-led.json') {
      let list = [];
      try {
        list = fs.readdirSync(dir)
          .filter(isImg)
          .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }))
          .map((f) => `/bar-led/${encodeURIComponent(f)}`);
      } catch {
        if (cfgFolder) console.warn(`[led] Không mở được thư mục ảnh: ${dir}`);
      }
      res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(list));
      return;
    }
    const name = path.basename(pathname.slice('/bar-led/'.length));
    if (!isImg(name)) {
      res.writeHead(404).end();
      return;
    }
    fs.readFile(path.join(dir, name), (err, data) => {
      if (err) {
        res.writeHead(404).end();
        return;
      }
      const ext = path.extname(name).toLowerCase();
      const type = { '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp' }[ext] || 'image/jpeg';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(data);
    });
    return;
  }
  if (pathname === '/tra-da-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(TRA_DA_CONFIG_PATH)));
    return;
  }
  if (pathname === '/cau-ca-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(CAU_CA_CONFIG_PATH)));
    return;
  }
  if (pathname === '/dai-chien-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(DAI_CHIEN_CONFIG_PATH)));
    return;
  }
  if (pathname === '/bia-hoi-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(BIA_HOI_CONFIG_PATH)));
    return;
  }
  if (pathname === '/dam-cuoi-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(DAM_CUOI_CONFIG_PATH)));
    return;
  }
  if (pathname === '/gieo-que-images.json') {
    // ảnh tự thiết kế cho game Gieo Quẻ (public/assets/gieo-que) -> game chỉ tải những file có thật
    let list = [];
    try {
      list = fs.readdirSync(path.join(PUBLIC_DIR, 'assets', 'gieo-que')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    } catch {
      /* chưa có thư mục */
    }
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(list));
    return;
  }
  if (pathname === '/gieo-que-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(GIEO_QUE_CONFIG_PATH)));
    return;
  }
  if (pathname === '/leo-nui-images.json') {
    // ảnh tự thiết kế cho game Leo núi (public/assets/leo-nui) -> game chỉ tải những file có thật
    let list = [];
    try {
      list = fs.readdirSync(path.join(PUBLIC_DIR, 'assets', 'leo-nui')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    } catch {
      /* chưa có thư mục */
    }
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(list));
    return;
  }
  if (pathname === '/leo-nui-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(LEO_NUI_CONFIG_PATH)));
    return;
  }
  if (pathname === '/tarot-images.json') {
    // ảnh tự thiết kế cho game Tarot (public/assets/tarot) -> game chỉ tải những file có thật
    let list = [];
    try {
      list = fs.readdirSync(path.join(PUBLIC_DIR, 'assets', 'tarot')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    } catch {
      /* chưa có thư mục */
    }
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(list));
    return;
  }
  if (pathname === '/tarot-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(TAROT_CONFIG_PATH)));
    return;
  }
  if (pathname === '/lop-hoc-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(LOP_HOC_CONFIG_PATH)));
    return;
  }
  if (pathname === '/lop-hoc-de-thi.json') {
    // ngân hàng đề thi tự thêm (trang lop-hoc-de-thi.html đọc/ghi)
    let data = { cauHoi: [], monChon: [], chiDungCauTuThem: false };
    try { data = { ...data, ...JSON.parse(fs.readFileSync(LOP_HOC_DE_THI_PATH, 'utf8')) }; } catch { /* chưa có file */ }
    if (req.method === 'POST') {
      if (!gate.isOk()) {
        res.writeHead(403, { 'Content-Type': MIME['.json'] }).end(JSON.stringify({ ok: false, error: 'Chưa kích hoạt bản quyền' }));
        return;
      }
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 5_000_000) req.destroy(); });
      req.on('end', () => {
        try {
          const j = JSON.parse(body || '{}');
          const clean = {
            cauHoi: (Array.isArray(j.cauHoi) ? j.cauHoi : []).slice(0, 5000).map((c) => ({
              cauHoi: String(c.cauHoi || '').slice(0, 400), A: String(c.A ?? '').slice(0, 200), B: String(c.B ?? '').slice(0, 200),
              C: String(c.C ?? '').slice(0, 200), D: String(c.D ?? '').slice(0, 200), dapAn: String(c.dapAn || 'A').toUpperCase().slice(0, 1),
              mon: String(c.mon || 'Tự thêm').slice(0, 60), lop: String(c.lop ?? '').slice(0, 10), doKho: Math.max(1, Math.min(3, Number(c.doKho) || 2)),
              giaiThich: String(c.giaiThich || '').slice(0, 400), meo: !!c.meo,
            })).filter((c) => c.cauHoi.trim()),
            monChon: (Array.isArray(j.monChon) ? j.monChon : []).map(String).slice(0, 100),
            chiDungCauTuThem: !!j.chiDungCauTuThem,
          };
          // giữ 1 bản sao trước khi ghi đè, phòng khi lỡ tay xoá
          try { if (fs.existsSync(LOP_HOC_DE_THI_PATH)) fs.copyFileSync(LOP_HOC_DE_THI_PATH, `${LOP_HOC_DE_THI_PATH}.bak`); } catch { /* bỏ qua */ }
          const tmp = `${LOP_HOC_DE_THI_PATH}.tmp`;
          fs.writeFileSync(tmp, JSON.stringify(clean, null, 1));
          fs.renameSync(tmp, LOP_HOC_DE_THI_PATH);
          broadcast({ type: 'reloadBank' });
          res.writeHead(200, { 'Content-Type': MIME['.json'] }).end(JSON.stringify({ ok: true, count: clean.cauHoi.length }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': MIME['.json'] }).end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
    return;
  }
  if (pathname === '/duoi-hinh-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(DUOI_HINH_CONFIG_PATH)));
    return;
  }
  if (pathname === '/rong-ran-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(RONG_RAN_CONFIG_PATH)));
    return;
  }
  if (pathname === '/bar-config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig(BAR_CONFIG_PATH)));
    return;
  }
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Không tìm thấy');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

// ---------------------------------------------------------------- Giọng đọc online
// Ưu tiên giọng AI tự nhiên của Microsoft Edge (vi-VN-HoaiMyNeural / vi-VN-NamMinhNeural),
// nếu lỗi thì dùng giọng Google Dịch. Cần Internet. Có lưu tạm để câu lặp lại không phải tải lại.
const ttsCache = new Map();
let edgeLib = null;
async function edgeTts(text, voice, rate) {
  if (!edgeLib) edgeLib = await import('msedge-tts');
  const { MsEdgeTTS, OUTPUT_FORMAT } = edgeLib;
  const tts = new MsEdgeTTS();
  await Promise.race([
    tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3),
    new Promise((_, reject) => setTimeout(() => reject(new Error('quá thời gian kết nối')), 8000)),
  ]);
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const { audioStream } = tts.toStream(safe, { rate, pitch: '+0Hz', volume: '+0%' });
  const buf = await new Promise((resolve, reject) => {
    const parts = [];
    const timer = setTimeout(() => reject(new Error('quá thời gian')), 12000);
    audioStream.on('data', (d) => parts.push(d));
    audioStream.on('close', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(parts));
    });
    audioStream.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
  try {
    tts.close();
  } catch {}
  if (!buf.length) throw new Error('không có dữ liệu');
  return buf;
}

async function googleTts(text, lang) {
  const target = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`;
  const r = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://translate.google.com/' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

let edgeWarned = false;
async function handleTts(url, res) {
  const text = String(url.searchParams.get('text') || '').slice(0, 400).trim();
  const lang = String(url.searchParams.get('lang') || 'vi').replace(/[^a-zA-Z-]/g, '') || 'vi';
  if (!text) {
    res.writeHead(400).end();
    return;
  }
  const cfg = loadConfig();
  // trang game có thể chọn giọng riêng (vd. quán bar dùng giọng nam NamMinh)
  const askVoice = String(url.searchParams.get('voice') || '');
  const voice = /^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/.test(askVoice) ? askVoice : String(cfg.ttsVoice || 'vi-VN-HoaiMyNeural');
  const rate = /^[+-]?\d{1,3}%$/.test(String(cfg.ttsRate)) ? String(cfg.ttsRate).replace(/^(\d)/, '+$1') : '-5%';
  const key = `${voice}|${rate}|${lang}|${text}`;
  try {
    let buf = ttsCache.get(key);
    if (!buf) {
      try {
        // máy chủ Microsoft thỉnh thoảng ngắt giữa chừng -> thử lại tối đa 3 lần
        for (let attempt = 1; ; attempt++) {
          try {
            buf = await edgeTts(text, voice, rate);
            break;
          } catch (e) {
            if (attempt >= 3) throw e;
            await new Promise((r) => setTimeout(r, 300 * attempt));
          }
        }
        if (edgeWarned) console.log('[tts] Giọng AI đã hoạt động.');
        edgeWarned = false;
      } catch (err) {
        if (!edgeWarned) {
          if (/Cannot find (package|module)/.test(err.message)) {
            console.warn('[tts] Chưa cài giọng AI. Hãy tắt cửa sổ này, xoá thư mục node_modules rồi chạy lại run.bat. Tạm dùng giọng Google.');
          } else console.warn('[tts] Giọng AI Edge lỗi, chuyển sang giọng Google:', err.message);
        }
        edgeWarned = true;
        buf = await googleTts(text.slice(0, 200), lang);
      }
      ttsCache.set(key, buf);
      if (ttsCache.size > 300) ttsCache.delete(ttsCache.keys().next().value);
    }
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': buf.length, 'Cache-Control': 'max-age=86400' });
    res.end(buf);
  } catch (err) {
    console.warn('[tts] Không lấy được giọng đọc online:', err.message);
    res.writeHead(502).end();
  }
}

// ---------------------------------------------------------------- WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
const VERSION = '2.9.2';
const status = { connected: false, username: '', viewers: 0, version: VERSION, message: 'Chưa kết nối TikTok' };
const gate = createGate({
  rootDir: __dirname,
  version: VERSION,
  onLock: (reason) => { disconnectTikTok().catch(() => {}); setStatus({ connected: false, message: `🔒 ${reason}` }); },
});

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}

function setStatus(patch) {
  Object.assign(status, patch);
  broadcast({ type: 'status', status });
  console.log('[status]', status.message);
}

const LOG_LABEL = { join: 'vào phòng', chat: 'bình luận', like: 'thả tim', follow: 'theo dõi', share: 'chia sẻ', gift: 'tặng quà' };
function emit(event) {
  broadcast(event);
  if (!event.simulated && LOG_LABEL[event.type]) {
    const who = event.user?.uniqueId || event.user?.name || '?';
    const extra = event.type === 'chat' ? (event.text ? `: ${event.text}` : ' (sticker)') : event.type === 'gift' ? `: ${event.giftName} x${event.repeatCount} (${event.coins} xu)` : event.type === 'like' ? ` x${event.count}` : '';
    const line = `${who} ${LOG_LABEL[event.type]}${extra}`;
    console.log(`[tiktok] ${line}`);
    broadcast({ type: 'log', text: line, time: Date.now() });
  }
}

// Âm lượng chỉnh ở bảng điều khiển (nhạc / hiệu ứng / giọng / tiếng tương tác), lưu lại cho lần sau
const AUDIO_FILE = path.join(__dirname, 'am-luong.json');
let audioSettings = null;
try { audioSettings = JSON.parse(fs.readFileSync(AUDIO_FILE, 'utf8')); } catch { /* chưa chỉnh lần nào */ }
function cleanAudio(a) {
  const n = (v, d) => Math.max(0, Math.min(150, Number.isFinite(Number(v)) ? Math.round(Number(v)) : d));
  return { music: n(a.music, 100), sfx: n(a.sfx, 100), voice: n(a.voice, 100), cues: n(a.cues, 70), mute: !!a.mute };
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', status }));
  if (audioSettings) ws.send(JSON.stringify({ type: 'audio', settings: audioSettings }));
  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!gate.isOk()) {
      ws.send(JSON.stringify({ type: 'status', status: { ...status, connected: false, message: `🔒 ${gate.error()} Mở http://127.0.0.1:${PORT}/kich-hoat.html để nhập key.` } }));
      return;
    }
    if (msg.cmd === 'connect') {
      connectTikTok(String(msg.username || '').trim());
    } else if (msg.cmd === 'disconnect') {
      disconnectTikTok();
    } else if (msg.cmd === 'sim' && msg.event) {
      // Sự kiện giả lập từ bảng điều khiển -> chuyển thẳng cho game
      emit({ ...msg.event, simulated: true });
    } else if (msg.cmd === 'reset') {
      broadcast({ type: 'reset' });
    } else if (msg.cmd === 'gameState' && msg.state && typeof msg.state === 'object') {
      // game gửi trạng thái (vd. đáp án câu hiện tại) cho bảng điều khiển
      broadcast({ type: 'gameState', state: msg.state });
    } else if (msg.cmd === 'askState') {
      broadcast({ type: 'askState' });
    } else if (msg.cmd === 'mirrorWant') {
      // bảng điều khiển muốn xem màn hình game thật -> báo cửa sổ game gửi hình
      ws.mirrorWant = Date.now();
      broadcast({ type: 'mirrorWant' });
    } else if (msg.cmd === 'mirrorFrame' && typeof msg.page === 'string') {
      const img = typeof msg.img === 'string' && msg.img.startsWith('data:image/') && msg.img.length < 1500000 ? msg.img : '';
      const data = JSON.stringify({ type: 'mirrorFrame', page: msg.page.slice(0, 100), img, error: msg.error ? String(msg.error).slice(0, 40) : '' });
      for (const client of wss.clients) {
        if (client !== ws && client.readyState === 1 && client.mirrorWant && Date.now() - client.mirrorWant < 6000 && client.bufferedAmount < 3e6) client.send(data);
      }
    } else if (msg.cmd === 'audio' && msg.settings && typeof msg.settings === 'object') {
      audioSettings = cleanAudio(msg.settings);
      try { fs.writeFileSync(AUDIO_FILE, JSON.stringify(audioSettings)); } catch { /* bỏ qua */ }
      broadcast({ type: 'audio', settings: audioSettings });
    } else if (msg.cmd === 'audioTest') {
      broadcast({ type: 'audioTest' });
    }
  });
});

// ---------------------------------------------------------------- TikTok
let connection = null;
let reconnectTimer = null;
let wantedUsername = '';

function pickAvatar(user) {
  if (!user) return '';
  const candidates = [
    user.profilePictureUrl,
    user.profilePicture?.url?.[0],
    user.profilePicture?.urls?.[0],
    user.profilePicture?.urlList?.[0],
    user.avatarThumb?.urlList?.[0],
    user.avatarMedium?.urlList?.[0],
  ];
  return candidates.find((u) => typeof u === 'string' && u.startsWith('http')) || '';
}

// Ảnh đại diện TikTok được tải qua máy chủ game (cùng địa chỉ 127.0.0.1) để khung xem trước ở bảng điều khiển
// chiếu lại được màn hình game (trình duyệt chặn chụp canvas có ảnh từ trang khác).
const AVATAR_HOST = /(^|\.)(tiktokcdn(-[a-z]+)?\.com|ibyteimg\.com|byteimg\.com|muscdn\.com|tiktokv\.com)$/i;
const avatarCache = new Map();
function proxyAvatar(u) {
  try {
    const t = new URL(u);
    if (t.protocol === 'https:' && AVATAR_HOST.test(t.hostname)) return `/anh-dai-dien?u=${encodeURIComponent(u)}`;
  } catch { /* bỏ qua */ }
  return u;
}
async function handleAvatar(url, res) {
  const u = url.searchParams.get('u') || '';
  let t = null;
  try { t = new URL(u); } catch { /* bỏ qua */ }
  if (!t || t.protocol !== 'https:' || !AVATAR_HOST.test(t.hostname)) {
    res.writeHead(400);
    res.end();
    return;
  }
  let hit = avatarCache.get(u);
  if (!hit) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
      const type = r.headers.get('content-type') || 'image/jpeg';
      if (!r.ok || !type.startsWith('image/')) throw new Error('bad');
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 3e6) throw new Error('big');
      hit = { type, buf };
      avatarCache.set(u, hit);
      if (avatarCache.size > 500) avatarCache.delete(avatarCache.keys().next().value);
    } catch {
      // tải hộ không được thì để trình duyệt tự tải ảnh gốc như trước
      res.writeHead(302, { Location: u });
      res.end();
      return;
    }
  }
  res.writeHead(200, { 'Content-Type': hit.type, 'Cache-Control': 'max-age=86400' });
  res.end(hit.buf);
}

function normUser(user, fallbackId = '') {
  if (!user) return null;
  const real = (v) => (v && String(v) !== '0' ? String(v) : '');
  const uniqueId = user.uniqueId || user.displayId || user.specialId || '';
  // Một số sự kiện (nhất là "người vào") thiếu userId -> dùng các trường khác thay thế
  const id = real(user.userId) || real(user.id) || real(fallbackId) || real(user.secUid) || uniqueId || real(user.nickname);
  if (!id) return null;
  return {
    id,
    uniqueId,
    name: user.nickname || uniqueId || 'Phật tử',
    avatar: proxyAvatar(pickAvatar(user)),
  };
}

// Lần lượt thử từng tên trường vì thư viện đổi cấu trúc giữa các phiên bản.
function giftInfo(data) {
  const d = data.giftDetails || {};
  const g = data.gift || {};
  return {
    giftId: String(data.giftId || g.id || ''),
    giftName: d.giftName || g.name || data.giftName || 'Quà',
    diamonds: Number(d.diamondCount ?? g.diamondCount ?? data.diamondCount ?? 1) || 1,
    giftType: Number(d.giftType ?? g.type ?? data.giftType ?? 0),
    repeatCount: Number(data.repeatCount || 1),
    repeatEnd: Boolean(data.repeatEnd),
    image: d.giftImage?.url?.[0] || g.image?.urlList?.[0] || '',
  };
}

async function connectTikTok(username) {
  username = username.replace(/^@/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@/, '').split(/[/?]/)[0];
  if (!username) {
    setStatus({ message: 'Hãy nhập tên TikTok (username) của kênh đang LIVE' });
    return;
  }
  await disconnectTikTok(true);
  wantedUsername = username;

  let lib;
  try {
    lib = await import('tiktok-live-connector');
  } catch (err) {
    setStatus({ message: 'Thiếu thư viện tiktok-live-connector. Chạy: npm install' });
    return;
  }
  const { TikTokLiveConnection, WebcastEvent, ControlEvent } = lib;
  const conn = new TikTokLiveConnection(username, {
    // Không bật enableExtendedGiftInfo: tuỳ chọn đó gọi dịch vụ ký trả phí (Euler Business)
    enableExtendedGiftInfo: false,
    // Khoá API Euler Stream (miễn phí tại eulerstream.com) giúp nới giới hạn kết nối
    ...(loadConfig().eulerApiKey ? { signApiKey: loadConfig().eulerApiKey } : {}),
  });
  connection = conn;
  setStatus({ connected: false, username, message: `Đang kết nối @${username}...` });

  const userEvent = (type, extra = {}) => (data) => {
    const user = normUser(data.user, data.userId);
    if (user) emit({ type, user, ...extra(data) });
    else console.log(`[tiktok] Bỏ qua sự kiện ${type}: không có thông tin người dùng`);
  };
  const none = () => ({});

  conn.on(WebcastEvent.MEMBER, userEvent('join', none));
  // bản mới của thư viện dùng trường "content", bản cũ dùng "comment"
  conn.on(WebcastEvent.CHAT, userEvent('chat', (d) => ({ text: String(d.content ?? d.comment ?? '') })));
  // sticker / biểu tượng cảm xúc: vẫn tạo nhân vật, không hiện chữ
  if (WebcastEvent.EMOTE) conn.on(WebcastEvent.EMOTE, userEvent('chat', () => ({ text: '' })));
  conn.on(WebcastEvent.FOLLOW, userEvent('follow', none));
  conn.on(WebcastEvent.SHARE, userEvent('share', none));
  conn.on(WebcastEvent.LIKE, userEvent('like', (d) => ({ count: Number(d.count ?? d.likeCount ?? 1) || 1 })));
  // Quà dạng chuỗi (combo, giftType 1): TikTok gửi nhiều sự kiện với repeatCount tăng dần
  // rồi một sự kiện kết thúc. Chỉ tính một lần khi combo kết thúc; nếu sự kiện kết thúc
  // bị mất thì tự chốt sau 4 giây không có cập nhật.
  const streaks = new Map(); // key -> { timer, last }
  const finished = new Map(); // key -> thời điểm đã chốt (chống tính trùng)
  const finalizeGift = (key, user, info) => {
    const st = streaks.get(key);
    if (st) clearTimeout(st.timer);
    streaks.delete(key);
    if (finished.has(key)) return;
    finished.set(key, Date.now());
    for (const [k, t] of finished) if (Date.now() - t > 120000) finished.delete(k);
    emit({ type: 'gift', user, ...info, coins: info.diamonds * info.repeatCount });
  };
  conn.on(WebcastEvent.GIFT, (data) => {
    const user = normUser(data.user, data.userId);
    if (!user) return;
    const info = giftInfo(data);
    const key = `${user.id}|${info.giftId}|${data.groupId || data.logId || ''}`;
    if (info.giftType === 1 && !info.repeatEnd) {
      emit({ type: 'giftStreak', user, ...info });
      const st = streaks.get(key) || {};
      clearTimeout(st.timer);
      st.timer = setTimeout(() => finalizeGift(key, user, info), 4000);
      streaks.set(key, st);
      return;
    }
    if (info.giftType === 1) {
      finalizeGift(key, user, info);
      return;
    }
    emit({ type: 'gift', user, ...info, coins: info.diamonds * info.repeatCount });
  });
  conn.on(WebcastEvent.ROOM_USER, (data) => {
    const viewers = Number(data.viewerCount || data.totalUser || data.total || 0);
    if (viewers) setStatus({ viewers, message: status.message });
  });
  conn.on(WebcastEvent.STREAM_END, () => {
    setStatus({ connected: false, message: 'Buổi LIVE đã kết thúc' });
    wantedUsername = '';
  });
  conn.on(ControlEvent.DISCONNECTED, () => {
    if (connection !== conn) return;
    setStatus({ connected: false, message: 'Mất kết nối, thử lại sau 10 giây...' });
    scheduleReconnect();
  });
  conn.on(ControlEvent.ERROR, (err) => {
    console.warn('[tiktok] lỗi:', err?.message || err);
  });

  try {
    const state = await conn.connect();
    if (connection !== conn) return;
    setStatus({ connected: true, message: `Đã kết nối @${username} (room ${state.roomId})` });
  } catch (err) {
    if (connection !== conn) return;
    const reason = err?.message || String(err);
    setStatus({ connected: false, message: `Không kết nối được @${username}: ${reason}. Kênh có đang LIVE không?` });
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  if (!wantedUsername) return;
  const name = wantedUsername;
  reconnectTimer = setTimeout(() => {
    if (wantedUsername === name) connectTikTok(name);
  }, 10_000);
}

async function disconnectTikTok(silent = false) {
  clearTimeout(reconnectTimer);
  wantedUsername = '';
  const conn = connection;
  connection = null;
  if (conn) {
    try {
      await conn.disconnect();
    } catch {
      /* bỏ qua */
    }
  }
  if (!silent) setStatus({ connected: false, message: 'Đã ngắt kết nối TikTok' });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error(`  ❌ Cổng ${PORT} đang bị một chương trình khác dùng (thường là bản game cũ vẫn đang chạy ngầm).`);
    console.error('  Mở Task Manager, tắt hết "Node.js JavaScript Runtime", hoặc chạy lệnh: taskkill /F /IM node.exe');
    console.error('');
  } else {
    console.error(err);
  }
  process.exitCode = 1;
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log(`  🔑 Bản quyền: http://127.0.0.1:${PORT}/kich-hoat.html`);
  const has = (f) => fs.existsSync(path.join(PUBLIC_DIR, f));
  if (has('game.html')) {
    console.log(`  🙏 Chánh điện LIVE đã chạy (phiên bản ${VERSION})`);
    console.log(`  - Màn hình game (thêm vào OBS / LIVE Studio): http://127.0.0.1:${PORT}/game.html`);
    console.log(`  - Bảng điều khiển + giả lập:                   http://127.0.0.1:${PORT}/control.html`);
  }
  if (has('tra-da.html')) console.log(`  🧋 Trà đá vỉa hè (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/tra-da.html   ·  điều khiển  http://127.0.0.1:${PORT}/tra-da-control.html`);
  if (has('cau-ca.html')) console.log(`  🎣 Bến câu sinh tồn (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/cau-ca.html   ·  điều khiển  http://127.0.0.1:${PORT}/cau-ca-control.html`);
  if (has('rong-ran.html')) console.log(`  🐉 Rồng rắn lên mây (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/rong-ran.html   ·  điều khiển  http://127.0.0.1:${PORT}/rong-ran-control.html`);
  if (has('dai-chien.html')) console.log(`  ⚔️  Sơn Tinh Thủy Tinh đại chiến (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/dai-chien.html   ·  điều khiển  http://127.0.0.1:${PORT}/dai-chien-control.html`);
  if (has('bia-hoi.html')) console.log(`  🍺 Bia hơi vỉa hè (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/bia-hoi.html   ·  điều khiển  http://127.0.0.1:${PORT}/bia-hoi-control.html`);
  if (has('dam-cuoi.html')) console.log(`  💒 Ăn cỗ đám cưới (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/dam-cuoi.html   ·  điều khiển  http://127.0.0.1:${PORT}/dam-cuoi-control.html`);
  if (has('leo-nui.html')) console.log(`  🏔️  Leo núi Everest (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/leo-nui.html   ·  điều khiển  http://127.0.0.1:${PORT}/leo-nui-control.html`);
  if (has('gieo-que.html')) console.log(`  🎋 Gieo quẻ xin xăm (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/gieo-que.html   ·  điều khiển  http://127.0.0.1:${PORT}/gieo-que-control.html`);
  if (has('tarot.html')) console.log(`  🔮 Bói bài Tarot (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/tarot.html   ·  điều khiển  http://127.0.0.1:${PORT}/tarot-control.html`);
  if (has('duoi-hinh.html')) console.log(`  🧩 Đuổi hình bắt chữ (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/duoi-hinh.html   ·  điều khiển  http://127.0.0.1:${PORT}/duoi-hinh-control.html`);
  if (has('lop-hoc.html')) console.log(`  🏫 Bạn có giỏi hơn học sinh lớp 5? (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/lop-hoc.html   ·  điều khiển  http://127.0.0.1:${PORT}/lop-hoc-control.html`);
  if (has('bar.html')) console.log(`  🪩 Quán bar (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/bar.html   ·  điều khiển  http://127.0.0.1:${PORT}/bar-control.html`);
  console.log('');
  const startUser = process.env.TIKTOK_USERNAME || config.tiktokUsername;
  if (startUser) connectTikTok(startUser);
});
