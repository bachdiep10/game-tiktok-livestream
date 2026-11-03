// Dùng chung cho các trang bán hàng
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const money = (n) => `${Math.round(n / 1000).toLocaleString('vi-VN')}K`;
export const moneyFull = (n) => `${Number(n).toLocaleString('vi-VN')}đ`;
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function api(url, body, method) {
  const opt = body !== undefined
    ? { method: method || 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: method || 'GET' };
  const res = await fetch(url, opt);
  let json;
  try { json = await res.json(); } catch { json = { ok: false, error: 'Lỗi kết nối máy chủ.' }; }
  if (!json.ok) throw new Error(json.error || 'Có lỗi xảy ra.');
  return json;
}

export function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

export async function copy(text) {
  try { await navigator.clipboard.writeText(text); } catch {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }
  toast('Đã sao chép');
}

let catalogPromise;
export function catalog() {
  catalogPromise ||= api('/api/catalog');
  return catalogPromise;
}

// Điền tên thương hiệu + liên hệ vào header/footer
export async function applyBrand() {
  const c = await catalog();
  const s = c.settings;
  $$('[data-brand]').forEach(el => { el.textContent = s.brandName; });
  $$('[data-tagline]').forEach(el => { el.textContent = s.tagline; });
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const zalo = $('[data-zalo]');
  if (zalo) { if (s.contactZalo) zalo.href = zaloLink(s.contactZalo); else zalo.remove(); }
  if (!document.title.includes(s.brandName)) document.title = `${document.title} · ${s.brandName}`;
  return c;
}

export function zaloLink(v) {
  return /^https?:/.test(v) ? v : `https://zalo.me/${String(v).replace(/\D/g, '')}`;
}
