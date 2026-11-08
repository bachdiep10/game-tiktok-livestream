// License key: tạo key, tính game được dùng, ký "vé" kích hoạt bằng Ed25519.
// Game trên máy khách giữ khoá công khai (public.pem) để kiểm tra vé, không cần bí mật nào.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ 0/O/1/I cho dễ đọc

export function newKey(prefix = 'LG') {
  const bytes = crypto.randomBytes(16);
  let s = '';
  for (let i = 0; i < 16; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}`;
}

export function normalizeKey(k) {
  return String(k || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').trim();
}

export function loadKeyPair(dir) {
  const priv = path.join(dir, 'license-private.pem');
  const pub = path.join(dir, 'license-public.pem');
  if (!fs.existsSync(priv)) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(priv, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    fs.writeFileSync(pub, publicKey.export({ type: 'spki', format: 'pem' }));
  }
  return {
    privateKey: crypto.createPrivateKey(fs.readFileSync(priv)),
    publicPem: fs.readFileSync(pub, 'utf8'),
  };
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');

export function signTicket(privateKey, payload) {
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.sign(null, Buffer.from(body), privateKey);
  return `${body}.${b64u(sig)}`;
}

export function verifyTicket(publicPem, ticket) {
  const [body, sig] = String(ticket).split('.');
  if (!body || !sig) return null;
  const ok = crypto.verify(null, Buffer.from(body), crypto.createPublicKey(publicPem), Buffer.from(sig, 'base64url'));
  if (!ok) return null;
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
}

// Danh sách game key này được chơi
export function entitledGames(license, games) {
  if (license.allGames) return games.map(g => g.id);
  return [...license.games];
}

// Khi thêm game mới: key combo còn thiếu suất thì tự nhận game mới
export function fillEmptySlots(licenses, gameId) {
  let n = 0;
  for (const l of licenses) {
    if (l.allGames || !l.slots) continue;
    if (l.games.length < l.slots && !l.games.includes(gameId)) {
      l.games.push(gameId);
      n++;
    }
  }
  return n;
}

export function movesInWindow(license, days) {
  const since = Date.now() - days * 86400000;
  return (license.moves || []).filter(t => t >= since).length;
}
