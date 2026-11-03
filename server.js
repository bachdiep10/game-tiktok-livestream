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
  '.svg': 'image/svg+xml',
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
  if (pathname === '/config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig()));
    return;
  }
  if (pathname === '/bar-music.json') {
    // danh sách bài hát trong thư mục public/assets/nhac-bar, xếp theo tên file
    const dir = path.join(PUBLIC_DIR, 'assets', 'nhac-bar');
    let list = [];
    try {
      list = fs.readdirSync(dir)
        .filter((f) => /\.(mp3|m4a|aac|ogg|wav|webm|opus)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }))
        .map((f) => `assets/nhac-bar/${encodeURIComponent(f)}`);
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
const VERSION = '1.9.9';
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

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', status }));
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
    avatar: pickAvatar(user),
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
  if (has('bar.html')) console.log(`  🪩 Quán bar (phiên bản ${VERSION}): game  http://127.0.0.1:${PORT}/bar.html   ·  điều khiển  http://127.0.0.1:${PORT}/bar-control.html`);
  console.log('');
  const startUser = process.env.TIKTOK_USERNAME || config.tiktokUsername;
  if (startUser) connectTikTok(startUser);
});
