// Báo đơn hàng về Telegram qua bot (Bot API sendMessage). Không cần cài thêm thư viện.
// Biến môi trường TELEGRAM_API chỉ dùng khi chạy kiểm tra tự động (máy chủ giả).
const API = () => (process.env.TELEGRAM_API || 'https://api.telegram.org').replace(/\/$/, '');

export const telegramStatus = { sent: 0, failed: 0, lastOk: 0, lastError: '', lastErrorAt: 0 };

export const escTg = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function telegramReady(s) {
  return Boolean(s.telegramBotToken && s.telegramChatId);
}

// Gửi 1 tin; nhiều chat id cách nhau bằng dấu phẩy. Trả về { ok, error }
export async function sendTelegram(s, text) {
  if (!telegramReady(s)) return { ok: false, error: 'Chưa nhập mã bot hoặc chat id.' };
  const ids = String(s.telegramChatId).split(/[,\s]+/).filter(Boolean);
  let error = '';
  for (const chat_id of ids) {
    try {
      const ctl = AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined;
      const r = await fetch(`${API()}/bot${s.telegramBotToken}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl,
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) throw new Error(j.description || `HTTP ${r.status}`);
    } catch (e) {
      error = String(e.message || e).replace(s.telegramBotToken, '***').slice(0, 200);
    }
  }
  if (error) { telegramStatus.failed++; telegramStatus.lastError = error; telegramStatus.lastErrorAt = Date.now(); return { ok: false, error }; }
  telegramStatus.sent++; telegramStatus.lastOk = Date.now();
  return { ok: true };
}
