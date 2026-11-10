// Meta Conversions API (API Chuyển đổi): máy chủ gửi thẳng sự kiện cho Meta, song song với Pixel trên trình duyệt.
// Hai bên dùng chung event_id nên Meta tự bỏ trùng, chỉ tính 1 lần. Sự kiện vẫn tới Meta khi trình duyệt chặn Pixel.
import crypto from 'node:crypto';

const API = (process.env.META_GRAPH_URL || 'https://graph.facebook.com/v21.0').replace(/\/$/, '');
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');
const norm = (v) => String(v ?? '').trim().toLowerCase();

// Số điện thoại VN: bỏ ký tự lạ, 0xxxxxxxxx → 84xxxxxxxxx (Meta cần mã quốc gia)
export function normPhone(p) {
  let d = String(p ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) d = `84${d.slice(1)}`;
  return d;
}

export function capiReady(s) {
  return Boolean(/^\d{8,20}$/.test(String(s.metaPixelId || '').trim()) && String(s.metaCapiToken || '').trim());
}

// Lấy thông tin nhận diện của khách từ yêu cầu web (IP, trình duyệt, cookie _fbp/_fbc của Pixel)
export function requestInfo(req, cookies = {}, pageUrl = '') {
  const info = {
    ip: String(req.ip || '').replace(/^::ffff:/, ''),
    ua: String(req.get('user-agent') || '').slice(0, 500),
    fbp: /^fb\.\d\.\d+\.\d+$/.test(cookies._fbp || '') ? cookies._fbp : '',
    fbc: /^fb\.\d\.\d+\..+$/.test(cookies._fbc || '') ? String(cookies._fbc).slice(0, 500) : '',
  };
  // Khách vừa bấm quảng cáo (link có fbclid) mà Pixel chưa kịp ghi cookie _fbc
  if (!info.fbc && pageUrl) {
    try {
      const id = new URL(pageUrl).searchParams.get('fbclid');
      if (id && /^[\w-]{10,500}$/.test(id)) info.fbc = `fb.1.${Date.now()}.${id}`;
    } catch {}
  }
  return info;
}

export function userData(info = {}, user = null) {
  const u = {};
  if (info.ip) u.client_ip_address = info.ip;
  if (info.ua) u.client_user_agent = info.ua;
  if (info.fbp) u.fbp = info.fbp;
  if (info.fbc) u.fbc = info.fbc;
  if (user) {
    if (user.email && norm(user.email).includes('@')) u.em = [sha(norm(user.email))];
    const ph = normPhone(user.phone);
    if (ph) u.ph = [sha(ph)];
    const name = norm(user.name).split(/\s+/).filter(Boolean);
    // Tên người Việt: họ đứng đầu, tên đứng cuối
    if (name.length) u.fn = [sha(name[name.length - 1])];
    if (name.length > 1) u.ln = [sha(name[0])];
    if (user.id) u.external_id = [sha(String(user.id))];
    u.country = [sha('vn')];
  }
  return u;
}

export function buildEvent({ name, eventId, url, info, user, custom }) {
  const ev = {
    event_name: name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(eventId || `srv_${crypto.randomBytes(8).toString('hex')}`),
    action_source: 'website',
    user_data: userData(info, user),
  };
  if (url) ev.event_source_url = String(url).slice(0, 1000);
  if (custom && Object.keys(custom).length) ev.custom_data = custom;
  return ev;
}

// Gửi tới Meta. status: nơi ghi kết quả gần nhất để hiện trong trang quản trị.
export async function sendEvents(s, events, status = null, { testCode } = {}) {
  if (!capiReady(s) || !events.length) return { ok: false, skipped: true };
  const body = { data: events };
  const code = String(testCode ?? s.metaTestEventCode ?? '').trim();
  if (code) body.test_event_code = code.slice(0, 50);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(`${API}/${String(s.metaPixelId).trim()}/events?access_token=${encodeURIComponent(String(s.metaCapiToken).trim())}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
    if (status) { status.lastOk = Date.now(); status.sent = (status.sent || 0) + events.length; status.lastEvent = events[events.length - 1].event_name; }
    return { ok: true, received: j.events_received, fbtrace: j.fbtrace_id };
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'Meta không trả lời (quá 10 giây)' : e.message;
    if (status) { status.lastError = msg.slice(0, 300); status.lastErrorAt = Date.now(); status.failed = (status.failed || 0) + events.length; }
    console.error('[CAPI]', msg);
    return { ok: false, error: msg };
  } finally { clearTimeout(timer); }
}

// Dữ liệu sự kiện từ trình duyệt: chỉ giữ các trường hợp lệ
export function cleanCustom(p = {}) {
  const c = {};
  const v = Number(p.value);
  if (Number.isFinite(v) && v >= 0 && v < 1e10) { c.value = Math.round(v); c.currency = 'VND'; }
  if (Array.isArray(p.content_ids)) c.content_ids = p.content_ids.slice(0, 50).map(x => String(x).slice(0, 80));
  for (const k of ['content_name', 'content_type']) if (p[k]) c[k] = String(p[k]).slice(0, 150);
  const n = Number(p.num_items);
  if (Number.isInteger(n) && n > 0 && n < 1000) c.num_items = n;
  return c;
}
