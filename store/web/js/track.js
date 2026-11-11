// Gửi sự kiện chuyển đổi tới Meta Pixel, TikTok Pixel, GA4 và dataLayer (cho Google Tag Manager).
// Tên sự kiện dùng chuẩn Meta; GA4/GTM nhận tên tương ứng (view_item, begin_checkout, sign_up, purchase...).
const GA = { ViewContent: 'view_item', InitiateCheckout: 'begin_checkout', CompleteRegistration: 'sign_up', Purchase: 'purchase', Contact: 'contact', Lead: 'generate_lead' };
const TT = { ViewContent: 'ViewContent', InitiateCheckout: 'InitiateCheckout', CompleteRegistration: 'CompleteRegistration', Purchase: 'Purchase', Contact: 'Contact', Lead: 'SubmitForm' };

// Sự kiện máy chủ gửi lại cho Meta (Conversions API) và TikTok (API Sự kiện). "Mua hàng" máy chủ tự gửi khi đơn được thanh toán.
const SERVER = ['ViewContent', 'InitiateCheckout', 'CompleteRegistration', 'Contact', 'Lead'];
const newId = (name) => `${name.slice(0, 3).toLowerCase()}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

function toServer(name, params, eventId) {
  try {
    const T = window.LG_TRACK || {};
    if (!((T.meta && T.capi) || (T.tiktok && T.ttapi)) || !SERVER.includes(name)) return;
    const body = JSON.stringify({ name, eventId, page: location.href, params });
    // sendBeacon vẫn gửi được khi khách chuyển trang ngay sau đó
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' })))) {
      fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true, credentials: 'same-origin' }).catch(() => {});
    }
  } catch {}
}

// TikTok: báo cho Pixel biết khách đang đăng nhập là ai (email/SĐT đã mã hoá SHA-256 ở máy chủ),
// làm trước khi gửi sự kiện để TikTok khớp đúng người xem quảng cáo.
let ttIdent = Promise.resolve();
if (typeof window !== 'undefined' && window.LG_TRACK?.tiktok) {
  ttIdent = Promise.race([
    fetch('/api/track/id', { credentials: 'same-origin' }).then(r => r.json()).then(j => { if (j.id && Object.keys(j.id).length && window.ttq) window.ttq.identify(j.id); }).catch(() => {}),
    new Promise(r => setTimeout(r, 1500)),
  ]);
}

// p: { value, currency, content_ids, content_name, content_type, num_items, order_id }
export function track(name, p = {}, eventId) {
  const params = { currency: 'VND', ...p };
  const w = window;
  // Pixel trên trình duyệt và máy chủ dùng chung event_id để Meta chỉ tính 1 lần
  eventId ||= newId(name);
  toServer(name, params, eventId);
  try { if (w.fbq) w.fbq('track', name, params, { eventID: eventId }); } catch {}
  const ttProps = {
    value: params.value, currency: params.currency, content_type: 'product',
    contents: (params.content_ids || []).map(id => ({ content_id: String(id), content_name: params.content_name, content_type: 'product', quantity: 1, price: params.value })),
    ...(params.order_id ? { order_id: String(params.order_id) } : {}),
  };
  ttIdent.then(() => { try { if (w.ttq) w.ttq.track(TT[name] || name, ttProps, { event_id: eventId }); } catch {} });
  const ga = GA[name] || name;
  const items = (params.content_ids || []).map(id => ({ item_id: String(id), item_name: params.content_name || String(id), price: params.value, quantity: 1 }));
  const ecommerce = { currency: params.currency, value: params.value, items, ...(params.order_id ? { transaction_id: String(params.order_id) } : {}) };
  try {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ ecommerce: null });
    w.dataLayer.push({ event: ga, ecommerce, lg_event: name });
    if (w.LG_TRACK?.ga4 && w.gtag) w.gtag('event', ga, ecommerce);
  } catch {}
}

// Chỉ gửi 1 lần cho mỗi khoá (VD: mỗi đơn hàng chỉ tính 1 lần mua)
export function trackOnce(key, name, p, eventId) {
  try { if (localStorage.getItem(`lg_tr_${key}`)) return; localStorage.setItem(`lg_tr_${key}`, '1'); } catch {}
  track(name, p, eventId);
}

// Tự động: xem trang game, bấm liên hệ Zalo/điện thoại/Messenger
if (typeof document !== 'undefined') {
  // Khách vào từ quảng cáo TikTok (link có ttclid): nhớ 30 ngày để máy chủ báo đơn mua khớp đúng quảng cáo
  try {
    const tc = new URLSearchParams(location.search).get('ttclid');
    if (tc && /^[\w.-]{8,500}$/.test(tc)) document.cookie = `lg_ttclid=${encodeURIComponent(tc)}; path=/; max-age=2592000; SameSite=Lax`;
  } catch {}
  const m = location.pathname.match(/^\/game\/([^/]+)/);
  if (m) {
    const name = document.querySelector('.game-detail h1')?.textContent?.trim() || m[1];
    track('ViewContent', { content_ids: [decodeURIComponent(m[1])], content_name: name, content_type: 'product' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const h = a.getAttribute('href') || '';
    if (a.hasAttribute('data-zalo') || /zalo\.me|^tel:|m\.me\/|messenger\.com/.test(h)) track('Contact', { content_name: /zalo/.test(h) || a.hasAttribute('data-zalo') ? 'zalo' : /^tel:/.test(h) ? 'phone' : 'messenger' });
  }, true);
}
