// Cầu nối TikTok LIVE -> trình duyệt (OBS / TikTok LIVE Studio).
// Chạy: npm start  rồi mở http://127.0.0.1:3000/control.html
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (err) {
    console.warn('[config] Không đọc được config.json, dùng mặc định:', err.message);
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
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/game.html';
  if (pathname === '/config.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(loadConfig()));
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

// ---------------------------------------------------------------- WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
const status = { connected: false, username: '', viewers: 0, message: 'Chưa kết nối TikTok' };

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

function emit(event) {
  broadcast(event);
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

function normUser(user) {
  if (!user) return null;
  const uniqueId = user.uniqueId || user.displayId || '';
  const id = String(user.userId || user.id || uniqueId || '');
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
  const conn = new TikTokLiveConnection(username, { enableExtendedGiftInfo: true });
  connection = conn;
  setStatus({ connected: false, username, message: `Đang kết nối @${username}...` });

  const userEvent = (type, extra = {}) => (data) => {
    const user = normUser(data.user);
    if (user) emit({ type, user, ...extra(data) });
  };
  const none = () => ({});

  conn.on(WebcastEvent.MEMBER, userEvent('join', none));
  conn.on(WebcastEvent.CHAT, userEvent('chat', (d) => ({ text: String(d.comment || '') })));
  conn.on(WebcastEvent.FOLLOW, userEvent('follow', none));
  conn.on(WebcastEvent.SHARE, userEvent('share', none));
  conn.on(WebcastEvent.LIKE, userEvent('like', (d) => ({ count: Number(d.likeCount || 1) })));
  conn.on(WebcastEvent.GIFT, (data) => {
    const user = normUser(data.user);
    if (!user) return;
    const info = giftInfo(data);
    // Quà dạng chuỗi (giftType 1): chỉ tính khi chuỗi kết thúc để không nhân đôi.
    if (info.giftType === 1 && !info.repeatEnd) {
      emit({ type: 'giftStreak', user, ...info });
      return;
    }
    emit({ type: 'gift', user, ...info, coins: info.diamonds * info.repeatCount });
  });
  conn.on(WebcastEvent.ROOM_USER, (data) => {
    const viewers = Number(data.viewerCount || 0);
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

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  🙏 Chánh điện LIVE đã chạy');
  console.log(`  - Màn hình game (thêm vào OBS / LIVE Studio): http://127.0.0.1:${PORT}/game.html`);
  console.log(`  - Bảng điều khiển + giả lập:                   http://127.0.0.1:${PORT}/control.html`);
  console.log('');
  const startUser = process.env.TIKTOK_USERNAME || config.tiktokUsername;
  if (startUser) connectTikTok(startUser);
});
