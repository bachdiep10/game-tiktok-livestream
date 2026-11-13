// Thư viện kiểm tra key, nhúng vào game (server.js của game chạy trên máy khách).
//
//   import { checkLicense } from './license-client.js';
//   const r = await checkLicense({ server: 'https://ten-mien-cua-ban.vn', game: 'chanh-dien', key, publicKeyPem, cacheFile });
//   if (!r.ok) { hiện r.error và dừng game }
//
// Cách hoạt động: lấy "mã máy" (MachineGuid của Windows, băm lại), gửi key + mã máy lên máy chủ.
// Máy chủ trả về "vé" có chữ ký. Vé được lưu lại để game chạy được khi mất mạng trong vài ngày.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

export function getMachineId() {
  let raw = '';
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], { encoding: 'utf8', windowsHide: true });
      raw = (out.match(/MachineGuid\s+REG_SZ\s+([\w-]+)/i) || [])[1] || '';
    } else if (process.platform === 'darwin') {
      // Máy Mac: mã phần cứng IOPlatformUUID (không đổi khi đổi tên máy / đổi mạng)
      const bin = fs.existsSync('/usr/sbin/ioreg') ? '/usr/sbin/ioreg' : 'ioreg';
      try {
        const out = execFileSync(bin, ['-rd1', '-c', 'IOPlatformExpertDevice'], { encoding: 'utf8' });
        raw = (out.match(/"IOPlatformUUID" = "([^"]+)"/) || [])[1] || '';
      } catch { /* thử cách khác */ }
      if (!raw) raw = execFileSync('/usr/sbin/sysctl', ['-n', 'kern.uuid'], { encoding: 'utf8' }).trim();
    } else if (fs.existsSync('/etc/machine-id')) {
      raw = fs.readFileSync('/etc/machine-id', 'utf8').trim();
    }
  } catch { /* dùng phương án dự phòng */ }
  if (!raw) raw = [os.hostname(), os.cpus()[0]?.model, os.totalmem(), os.userInfo().username].join('|');
  return crypto.createHash('sha256').update(`livegame:${raw}`).digest('hex');
}

function verifyTicket(publicKeyPem, ticket) {
  const [body, sig] = String(ticket || '').split('.');
  if (!body || !sig) return null;
  try {
    const ok = crypto.verify(null, Buffer.from(body), crypto.createPublicKey(publicKeyPem), Buffer.from(sig, 'base64url'));
    return ok ? JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) : null;
  } catch { return null; }
}

function readCache(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}

export async function checkLicense({ server, game, key, publicKeyPem, cacheFile, version = '' }) {
  const machineId = getMachineId();
  const cache = readCache(cacheFile);
  key = String(key || cache.key || '').trim().toUpperCase();
  if (!key) return { ok: false, needKey: true, error: 'Chưa nhập license key.' };

  try {
    const res = await fetch(`${server.replace(/\/$/, '')}/api/license/activate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, machineId, machineName: os.hostname(), game, version }),
      signal: AbortSignal.timeout(10000),
    });
    const j = await res.json();
    if (!j.ok) {
      // Key bị từ chối: bỏ vé cũ nhưng nhớ key, để khi người bán mở khoá thì game tự chạy lại
      if (res.status !== 409 && res.status < 500) try { fs.writeFileSync(cacheFile, JSON.stringify({ key })); } catch {}
      return { ok: false, needKey: res.status === 404, error: j.error };
    }
    const t = verifyTicket(publicKeyPem, j.ticket);
    if (!t || t.machineId !== machineId) return { ok: false, error: 'Phản hồi máy chủ không hợp lệ.' };
    fs.writeFileSync(cacheFile, JSON.stringify({ key, ticket: j.ticket }));
    return { ok: true, key, games: t.games, plan: t.plan, online: true };
  } catch (e) {
    // Mất mạng: dùng vé đã lưu nếu còn hạn
    const t = verifyTicket(publicKeyPem, cache.ticket);
    if (t && t.key === key && t.machineId === machineId && Date.now() < t.exp && (!game || t.games.includes(game))) {
      return { ok: true, key, games: t.games, plan: t.plan, online: false, offlineUntil: t.exp };
    }
    return { ok: false, error: 'Không kết nối được máy chủ kiểm tra key. Kiểm tra mạng rồi thử lại.' };
  }
}
