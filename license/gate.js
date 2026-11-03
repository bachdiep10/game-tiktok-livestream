// Khoá bản quyền cho game: chưa kích hoạt key thì không mở được game và không kết nối TikTok.
// Mỗi bản game có file product.json: { "game": "chanh-dien", "name": "...", "control": "/control.html", "server": "https://netxioviet.com" }
import fs from 'node:fs';
import path from 'node:path';
import { checkLicense, getMachineId } from './license-client.js';

const RECHECK_MS = 6 * 3600 * 1000;

export function createGate({ rootDir, version, onLock }) {
  const productFile = path.join(rootDir, 'product.json');
  const cacheFile = path.join(rootDir, 'license.json');
  const pemFile = path.join(rootDir, 'license', 'license-public.pem');
  const dev = process.env.GAME_DEV === '1';
  let product = null;
  try { product = JSON.parse(fs.readFileSync(productFile, 'utf8')); } catch { /* thiếu file */ }
  const server = (product?.server || 'https://netxioviet.com').replace(/\/$/, '');
  const state = { ok: dev, checking: false, error: '', info: null, lastCheck: 0 };

  async function publicKey() {
    if (fs.existsSync(pemFile)) return fs.readFileSync(pemFile, 'utf8');
    const res = await fetch(`${server}/api/license/public-key`, { signal: AbortSignal.timeout(10000) });
    const pem = await res.text();
    if (!pem.includes('BEGIN PUBLIC KEY')) throw new Error('bad key');
    fs.mkdirSync(path.dirname(pemFile), { recursive: true });
    fs.writeFileSync(pemFile, pem);
    return pem;
  }

  async function check(key) {
    if (dev) return state;
    if (!product?.game) {
      Object.assign(state, { ok: false, error: 'Bản game bị thiếu file product.json. Vui lòng tải lại game từ trang web.' });
      return state;
    }
    state.checking = true;
    try {
      let pem;
      try { pem = await publicKey(); } catch {
        Object.assign(state, { ok: false, error: 'Không kết nối được máy chủ bản quyền. Kiểm tra mạng rồi thử lại.' });
        return state;
      }
      const r = await checkLicense({ server, game: product.game, key, publicKeyPem: pem, cacheFile, version });
      const wasOk = state.ok;
      state.ok = r.ok;
      state.error = r.ok ? '' : r.error;
      state.info = r.ok ? { key: r.key, plan: r.plan, games: r.games, online: r.online, offlineUntil: r.offlineUntil || null } : null;
      state.lastCheck = Date.now();
      if (wasOk && !r.ok) onLock?.(state.error);
      return state;
    } finally {
      state.checking = false;
    }
  }

  const ready = check();
  setInterval(() => check().catch(() => {}), RECHECK_MS).unref();

  const send = (res, code, type, body, extra = {}) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra }); res.end(body); };
  const json = (res, obj) => send(res, 200, 'application/json; charset=utf-8', JSON.stringify(obj));
  const readBody = (req) => new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 10000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
  });
  const publicState = () => ({
    ok: state.ok, error: state.error, dev,
    product: { game: product?.game || '', name: product?.name || 'Game', control: product?.control || '/', server },
    key: state.info?.key ? state.info.key.replace(/^(.{8}).*(.{4})$/, '$1••••-••••-$2') : '',
    plan: state.info?.plan || '', online: state.info?.online ?? null, offlineUntil: state.info?.offlineUntil || null,
    machineId: getMachineId().slice(0, 8), version,
  });

  // Trả về true nếu yêu cầu đã được xử lý ở đây
  async function handle(req, res, pathname) {
    if (pathname === '/kich-hoat.html') {
      send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(rootDir, 'license', 'kich-hoat.html')));
      return true;
    }
    if (pathname === '/license/status') {
      await ready;
      json(res, publicState());
      return true;
    }
    if (pathname === '/license/activate' && req.method === 'POST') {
      const body = await readBody(req);
      const key = String(body.key || '').trim().toUpperCase();
      if (!key) { json(res, { ...publicState(), ok: false, error: 'Vui lòng nhập key.' }); return true; }
      try { fs.unlinkSync(cacheFile); } catch { /* chưa có */ }
      await check(key);
      json(res, publicState());
      return true;
    }
    if (pathname === '/license/recheck' && req.method === 'POST') {
      await check();
      json(res, publicState());
      return true;
    }
    await ready;
    if (!state.ok && (pathname === '/' || pathname.endsWith('.html'))) {
      send(res, 302, 'text/plain', '', { Location: '/kich-hoat.html' });
      return true;
    }
    return false;
  }

  return {
    handle,
    isOk: () => state.ok,
    error: () => state.error || 'Chưa kích hoạt bản quyền.',
    home: () => product?.control || '/control.html',
  };
}
