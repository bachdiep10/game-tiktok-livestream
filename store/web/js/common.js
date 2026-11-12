import { liveStepText, GUIDE_LIVE_NET, GUIDE_NODEJS } from './live-guide.js';
import { footerHtml } from '/js/policies.js';
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
  const chat = supportLink(s);
  const zalo = $('[data-zalo]');
  if (zalo) { if (chat) { zalo.href = chat; zalo.textContent = '💬 Chat hỗ trợ'; } else zalo.remove(); }
  if (chat && !$('.chat-fab') && !location.pathname.startsWith('/admin')) {
    document.body.insertAdjacentHTML('beforeend', `<a class="chat-fab" href="${esc(chat)}" target="_blank" rel="noopener" data-zalo aria-label="Chat hỗ trợ"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="#fff" d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.15.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.53-.04.91.25 1.88.38 2.91.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm6 7.46-2.94 4.66a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66a1.5 1.5 0 0 1 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z"/></svg><span>Chat hỗ trợ</span></a>`);
  }
  fillSupport();
  mobileMenu();
  me().then(r => {
    $$('[data-account]').forEach(el => { el.textContent = r.user ? `👤 ${r.user.name.split(' ').slice(-1)[0]}` : 'Đăng nhập'; });
    if (r.user && !location.pathname.startsWith('/admin')) offerBell(r, c);
  }).catch(() => {});
  $$('footer .wrap').forEach(el => { if (!el.querySelector('.foot-links')) el.insertAdjacentHTML('beforeend', footerHtml(s)); });
  if (!document.title.includes(s.brandName)) document.title = `${document.title} · ${s.brandName}`;
  return c;
}

// Chuông ưu đãi trên thanh menu: khách bấm để mở lại popup ưu đãi đã nhận
function offerBell(d, c) {
  const o = d.offers || {};
  const live = (u) => u && u > Date.now();
  const n = (live(d.firstOffer?.until) ? 1 : 0) + (o.newGames || []).filter(g => live(g.until)).length
    + (o.licenses || []).filter(l => live(l.combo?.until) || live(l.all?.until)).length;
  const any = n || (o.licenses || []).length;
  const acc = $('[data-account]');
  if (!any || !acc || $('[data-bell]')) return;
  acc.insertAdjacentHTML('beforebegin', `<button type="button" class="bell" data-bell aria-label="Ưu đãi của bạn" title="Ưu đãi của bạn"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-1.6 1.6A.8.8 0 0 0 4 19h16a.8.8 0 0 0 .6-1.4Z"/></svg>${n ? `<i>${n}</i>` : ''}</button>`);
  $('[data-bell]').onclick = async () => {
    const up = await import('/js/upsell.js');
    up.showOffers(d, c);
  };
}

// Nút menu ☰ trên điện thoại: mở danh sách đủ các mục như bản máy tính
function mobileMenu() {
  const wrap = $('header.top .wrap');
  const nav = wrap && $('.nav', wrap);
  if (!nav || $('.menu-btn', wrap)) return;
  wrap.insertAdjacentHTML('beforeend', '<button type="button" class="menu-btn" aria-label="Mở menu" aria-expanded="false"><span></span><span></span><span></span></button><div class="mnav" hidden></div>');
  const btn = $('.menu-btn', wrap), panel = $('.mnav', wrap);
  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('on'); };
  btn.onclick = (e) => {
    e.stopPropagation();
    if (!panel.hidden) return close();
    // dựng lại mỗi lần mở để có tên tài khoản, link chat mới nhất
    panel.innerHTML = $$('a', nav).map(a => {
      const c = a.cloneNode(true);
      c.removeAttribute('class'); c.removeAttribute('style');
      if (a.classList.contains('btn')) c.className = 'mn-cta';
      return c.outerHTML;
    }).join('');
    panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); btn.classList.add('on');
  };
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (innerWidth > 760) close(); });
}

// Kênh chat hỗ trợ chính: fanpage (Messenger), không có thì Facebook, cuối cùng là Zalo
export function supportLink(s) {
  if (s.messengerUrl) return s.messengerUrl;
  if (s.contactFacebook) return s.contactFacebook;
  return s.contactZalo ? zaloLink(s.contactZalo) : '';
}

// Ô hỗ trợ sau khi mua: chat fanpage + nhóm Zalo
export function supportBox(s) {
  const chat = s.messengerUrl || s.contactFacebook;
  const items = [
    chat && `<a class="btn sm" href="${esc(chat)}" target="_blank" rel="noopener" data-zalo>💬 Chat với fanpage</a>`,
    s.zaloGroup && `<a class="btn sm zalo" href="${esc(s.zaloGroup)}" target="_blank" rel="noopener" data-zalo>👥 Vào nhóm Zalo hỗ trợ</a>`,
  ].filter(Boolean);
  if (!items.length) return '';
  return `<div class="support-box"><div><b>Cần hỗ trợ cài đặt?</b><small>Nhắn fanpage hoặc vào nhóm Zalo để được hướng dẫn và nhận tin cập nhật game.</small></div><div class="sb-btns">${items.join('')}</div></div>`;
}
function fillSupport() {
  catalog().then(c => { $$('[data-support-box]').forEach(el => { if (!el.dataset.done) { el.innerHTML = supportBox(c.settings); el.dataset.done = 1; } }); }).catch(() => {});
}

export function zaloLink(v) {
  return /^https?:/.test(v) ? v : `https://zalo.me/${String(v).replace(/\D/g, '')}`;
}

// Danh sách game kèm nút tải + hướng dẫn riêng của từng game
export function gameList(games, { canDownload = true } = {}) {
  if (canDownload) setTimeout(fillSupport, 0);
  const size = (b) => b ? ` · ${(b / 1048576).toFixed(1)} MB` : '';
  return `<div class="dl">${games.map(g => `
    <div class="dl-item">
      <div class="dl-row">
        <img src="${esc(g.image)}" alt="">
        <span class="grow"><b>${esc(g.name)}</b><br><small class="note">${g.download ? `Bản ${esc(g.version || 'mới nhất')}${size(g.fileSize)}` : 'Link tải sẽ được gửi qua Zalo'}</small></span>
        ${g.download && canDownload ? `<a class="btn sm" href="${esc(g.download)}">⬇ Tải về</a>` : ''}
      </div>
      <div class="hd-links sm"><a href="${GUIDE_NODEJS}?game=${encodeURIComponent(g.id)}">🖥️ Cài Node.js &amp; chạy game bằng CMD</a><a href="${GUIDE_LIVE_NET}?game=${encodeURIComponent(g.id)}">📺 LIVE nét 1080p (nguồn Liên kết)</a></div>
      ${g.guide || g.guideVideo ? `<details class="guide"><summary>📖 Hướng dẫn cài ${esc(g.name)}</summary>
        ${g.guideVideo ? `<p><a href="${esc(g.guideVideo)}" target="_blank" rel="noopener">▶ Xem video hướng dẫn</a></p>` : ''}
        ${g.guide ? `<ol>${g.guide.split('\n').map(l => liveStepText(g.id, l.trim())).filter(Boolean).map(l => /^\d+[.)]\s*/.test(l) ? `<li>${esc(l.replace(/^\d+[.)]\s*/, ''))}</li>` : `</ol><p>${esc(l)}</p><ol>`).join('')}</ol>` : ''}
      </details>` : ''}
    </div>`).join('')}</div>${canDownload ? '<div data-support-box></div>' : ''}`;
}

let mePromise;
export function me(refresh) {
  if (refresh || !mePromise) mePromise = api('/api/account/me');
  return mePromise;
}
