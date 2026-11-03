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
  me().then(r => {
    $$('[data-account]').forEach(el => { el.textContent = r.user ? `👤 ${r.user.name.split(' ').slice(-1)[0]}` : 'Đăng nhập'; });
  }).catch(() => {});
  if (!document.title.includes(s.brandName)) document.title = `${document.title} · ${s.brandName}`;
  return c;
}

export function zaloLink(v) {
  return /^https?:/.test(v) ? v : `https://zalo.me/${String(v).replace(/\D/g, '')}`;
}

// Danh sách game kèm nút tải + hướng dẫn riêng của từng game
export function gameList(games, { canDownload = true } = {}) {
  const size = (b) => b ? ` · ${(b / 1048576).toFixed(1)} MB` : '';
  return `<div class="dl">${games.map(g => `
    <div class="dl-item">
      <div class="dl-row">
        <img src="${esc(g.image)}" alt="">
        <span class="grow"><b>${esc(g.name)}</b><br><small class="note">${g.download ? `Bản ${esc(g.version || 'mới nhất')}${size(g.fileSize)}` : 'Link tải sẽ được gửi qua Zalo'}</small></span>
        ${g.download && canDownload ? `<a class="btn sm" href="${esc(g.download)}">⬇ Tải về</a>` : ''}
      </div>
      ${g.guide || g.guideVideo ? `<details class="guide"><summary>📖 Hướng dẫn cài ${esc(g.name)}</summary>
        ${g.guideVideo ? `<p><a href="${esc(g.guideVideo)}" target="_blank" rel="noopener">▶ Xem video hướng dẫn</a></p>` : ''}
        ${g.guide ? `<ol>${g.guide.split('\n').map(l => l.trim()).filter(Boolean).map(l => /^\d+[.)]\s*/.test(l) ? `<li>${esc(l.replace(/^\d+[.)]\s*/, ''))}</li>` : `</ol><p>${esc(l)}</p><ol>`).join('')}</ol>` : ''}
      </details>` : ''}
    </div>`).join('')}</div>`;
}

let mePromise;
export function me(refresh) {
  if (refresh || !mePromise) mePromise = api('/api/account/me');
  return mePromise;
}
