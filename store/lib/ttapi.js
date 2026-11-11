// TikTok Events API (API Sự kiện): máy chủ gửi thẳng sự kiện cho TikTok, song song với TikTok Pixel trên trình duyệt.
// Hai bên dùng chung event_id nên TikTok tự bỏ trùng. Sự kiện vẫn tới TikTok khi trình duyệt chặn Pixel.
import crypto from 'node:crypto';
import { normPhone } from './capi.js';

const API = (process.env.TIKTOK_API_URL || 'https://business-api.tiktok.com/open_api/v1.3').replace(/\/$/, '');
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');
const norm = (v) => String(v ?? '').trim().toLowerCase();

// Tên sự kiện chuẩn Meta → tên chuẩn TikTok
export const TT_NAME = { ViewContent: 'ViewContent', InitiateCheckout: 'InitiateCheckout', AddPaymentInfo: 'AddPaymentInfo', CompleteRegistration: 'CompleteRegistration', Contact: 'Contact', Lead: 'SubmitForm', Purchase: 'Purchase' };

export function ttReady(s) {
  return Boolean(/^[A-Z0-9]{8,30}$/.test(String(s.tiktokPixelId || '').trim()) && String(s.tiktokApiToken || '').trim());
}

// Cookie _ttp của TikTok Pixel và mã ttclid (khách vừa bấm quảng cáo TikTok)
export function ttInfo(cookies = {}, pageUrl = '') {
  const info = {
    ttp: /^[\w.-]{8,200}$/.test(cookies._ttp || '') ? cookies._ttp : '',
    ttclid: /^[\w.-]{8,500}$/.test(cookies.lg_ttclid || '') ? cookies.lg_ttclid : '',
  };
  if (!info.ttclid && pageUrl) {
    try {
      const id = new URL(pageUrl).searchParams.get('ttclid');
      if (id && /^[\w.-]{8,500}$/.test(id)) info.ttclid = id;
    } catch {}
  }
  return info;
}

export function ttUser(info = {}, user = null) {
  const u = {};
  if (info.ip) u.ip = info.ip;
  if (info.ua) u.user_agent = info.ua;
  if (info.ttp) u.ttp = info.ttp;
  if (info.ttclid) u.ttclid = info.ttclid;
  if (user) {
    if (user.email && norm(user.email).includes('@')) u.email = sha(norm(user.email));
    const ph = normPhone(user.phone);
    if (ph) u.phone = sha(`+${ph}`); // TikTok cần dạng E.164: +84…
    if (user.id) u.external_id = sha(String(user.id));
  }
  return u;
}

// Dạng dùng cho ttq.identify trên trình duyệt
export function ttHashedId(user) {
  const u = ttUser({}, user);
  const out = {};
  if (u.email) out.email = u.email;
  if (u.phone) out.phone_number = u.phone;
  if (u.external_id) out.external_id = u.external_id;
  return out;
}

// custom: { value, currency, content_ids, content_name, content_type, num_items, order_id } (giống Meta)
export function ttBuild({ name, eventId, url, info, user, custom = {} }) {
  const props = {};
  if (Number.isFinite(Number(custom.value))) { props.value = Number(custom.value); props.currency = custom.currency || 'VND'; }
  if (Array.isArray(custom.content_ids) && custom.content_ids.length) {
    props.content_type = 'product';
    const one = custom.content_ids.length === 1 && Number.isFinite(Number(custom.value));
    props.contents = custom.content_ids.slice(0, 50).map(id => ({ content_id: String(id), content_name: custom.content_name || String(id), content_type: 'product', quantity: 1, ...(one ? { price: Number(custom.value) } : {}) }));
  }
  if (custom.order_id) props.order_id = String(custom.order_id);
  const ev = {
    event: TT_NAME[name] || name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(eventId || `srv_${crypto.randomBytes(8).toString('hex')}`),
    user: ttUser(info, user),
    properties: props,
  };
  if (url) ev.page = { url: String(url).slice(0, 1000) };
  return ev;
}

// Gửi tới TikTok. status: nơi ghi kết quả gần nhất để hiện trong trang quản trị.
export async function ttSend(s, events, status = null, { testCode } = {}) {
  if (!ttReady(s) || !events.length) return { ok: false, skipped: true };
  const body = { event_source: 'web', event_source_id: String(s.tiktokPixelId).trim(), data: events };
  const code = String(testCode ?? s.tiktokTestEventCode ?? '').trim();
  if (code) body.test_event_code = code.slice(0, 50);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(`${API}/event/track/`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'Access-Token': String(s.tiktokApiToken).trim() }, body: JSON.stringify(body), signal: ctl.signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || (j.code !== undefined && j.code !== 0)) throw new Error(j.message || `HTTP ${r.status}`);
    if (status) { status.lastOk = Date.now(); status.sent = (status.sent || 0) + events.length; status.lastEvent = events[events.length - 1].event; }
    return { ok: true, received: events.length };
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'TikTok không trả lời (quá 10 giây)' : e.message;
    if (status) { status.lastError = String(msg).slice(0, 300); status.lastErrorAt = Date.now(); status.failed = (status.failed || 0) + events.length; }
    console.error('[TikTok API]', msg);
    return { ok: false, error: msg };
  } finally { clearTimeout(timer); }
}
