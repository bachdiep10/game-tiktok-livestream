// Popup bán thêm: lúc chọn Gói Lẻ (mời lên Combo), khách đã mua (mời nâng cấp / game mới), hộp nâng cấp bù tiền
import { $, $$, api, esc, money, moneyFull } from '/js/common.js';

const css = `
.upx .box{width:min(480px,100%);padding-top:34px;overflow:hidden}
.upx .box:before{content:"";position:absolute;inset:0 0 auto 0;height:6px;background:linear-gradient(90deg,#ff3d7f,#ff7a59,#ffb547)}
.upx .hero{width:68px;height:68px;border-radius:22px;display:grid;place-items:center;font-size:34px;line-height:1;margin-bottom:14px;background:linear-gradient(135deg,#fff0f4,#fff6e8);box-shadow:inset 0 0 0 1px rgba(255,61,127,.15)}
.upx h3{font-size:23px;letter-spacing:-.02em}
.upx .deal:hover{border-color:rgba(255,79,109,.5)}
.upx .deal{transition:.15s}
.upx .timer{animation:upPulse 2s ease-in-out infinite}
@keyframes upPulse{50%{box-shadow:0 0 0 4px rgba(245,158,11,.15)}}
.upx ul{margin:12px 0 18px;padding:0;list-style:none}
.upx li{padding:7px 0 7px 30px;position:relative;font-size:15px}
.upx li:before{content:"✓";position:absolute;left:4px;color:#16a34a;font-weight:800}
.upx .row2{display:grid;gap:10px}
.upx .deal{display:flex;justify-content:space-between;align-items:center;gap:12px;border:2px solid var(--line);border-radius:16px;padding:14px 16px;margin:10px 0;cursor:pointer;background:#fff}
.upx .deal.on{border-color:#ff4f6d;box-shadow:0 0 0 3px rgba(255,79,109,.15)}
.upx .deal b{font-size:17px}.upx .deal small{display:block;color:var(--muted);font-size:13px;margin-top:2px}
.upx .deal .p{text-align:right;white-space:nowrap}.upx .deal .p s{color:var(--muted);font-size:13px;display:block}
.upx .deal .p strong{font-size:22px;color:#e8283a}
.upx .timer{background:#fff3e0;color:#b45309;border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px;margin:6px 0 4px;text-align:center}
.upx .pick{max-height:240px}
.upx .skip{background:none;border:0;color:var(--muted);text-decoration:underline;cursor:pointer;font:inherit;font-size:14px;margin-top:10px;width:100%}
.up-card{border:2px dashed rgba(255,79,109,.45);border-radius:16px;padding:16px;margin-top:14px;background:linear-gradient(135deg,#fff7f8,#fffaf0)}
.up-card h4{margin:0 0 4px;font-size:17px}.up-card p{margin:0 0 10px;color:var(--muted);font-size:14px}
.up-card .btns{display:flex;gap:8px;flex-wrap:wrap}
`;
if (!$('#upx-css')) document.head.insertAdjacentHTML('beforeend', `<style id="upx-css">${css}</style>`);

export const upEvent = (k) => { try { navigator.sendBeacon?.('/api/up/event', new Blob([JSON.stringify({ k })], { type: 'application/json' })) || api('/api/up/event', { k }); } catch { /* bỏ qua */ } };

// Nguồn đơn (để báo cáo): link trong email gắn ?src=email-offer
export function source(fallback) {
  const m = new URLSearchParams(location.search).get('src');
  if (m && /^email-[a-z0-9-]+$/.test(m)) sessionStorage.setItem('lg_src', m.replace('email-', 'email:'));
  return sessionStorage.getItem('lg_src') || fallback;
}

export function left(until) {
  const ms = until - Date.now();
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60;
  return h >= 24 ? `${Math.floor(h / 24)} ngày ${h % 24} giờ` : `${h} giờ ${m} phút`;
}

function modal(html) {
  const m = document.createElement('div');
  m.className = 'modal upx open';
  m.innerHTML = `<div class="box"><button class="x" data-close>×</button>${html}</div>`;
  document.body.appendChild(m);
  document.body.style.overflow = 'hidden';
  const close = () => { m.remove(); if (!$('.modal.open')) document.body.style.overflow = ''; };
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) { close(); m.dispatchEvent(new Event('closed')); } });
  return { el: m, close };
}

// 1) Khách bấm mua Gói Lẻ: mời lên Combo. Trả về 'combo' | 'single' | null (đóng)
export function checkoutUpsell(C, single, gameId) {
  const combo = C.plans.filter(p => !p.allGames && p.slots > 1).sort((a, b) => b.slots - a.slots)[0];
  if (!C.upsell?.checkout || !combo || sessionStorage.getItem('lg_cu')) return Promise.resolve('single');
  sessionStorage.setItem('lg_cu', 1);
  const extra = combo.price - single.price;
  const n = Math.min(combo.slots, C.games.length);
  const g = C.games.find(x => x.id === gameId);
  upEvent('checkout_shown');
  return new Promise(resolve => {
    const { el, close } = modal(`
      <div class="hero">🎁</div>
      <h3>Chỉ thêm ${money(extra)} là có ${n} game!</h3>
      <p class="msub">${g ? `Bạn đang chọn <b>${esc(g.name)}</b>. ` : ''}Lên <b>${esc(combo.name)}</b> để có thêm ${n - 1} game nữa, đổi game theo ngày cho người xem không nhàm.</p>
      <ul>
        <li>${n} game tự chọn, dùng trọn đời</li>
        <li>Rẻ hơn mua lẻ ${money(single.price * combo.slots - combo.price)}</li>
        <li>Chưa đủ game? Game mới ra tự vào key</li>
      </ul>
      <div class="row2">
        <button class="btn block" data-a="combo">Lấy ${esc(combo.name)} · ${money(combo.price)}</button>
        <button class="btn ghost block" data-a="single">Không, chỉ mua 1 game · ${money(single.price)}</button>
      </div>`);
    el.addEventListener('closed', () => { upEvent('checkout_decline'); resolve(null); });
    $$('[data-a]', el).forEach(b => b.onclick = () => { close(); upEvent(b.dataset.a === 'combo' ? 'checkout_accept' : 'checkout_decline'); resolve(b.dataset.a === 'combo' ? combo.id : 'single'); });
  });
}

// 2) Hộp nâng cấp: chọn gói đích, chọn thêm game (Combo), tạo đơn bù tiền
export async function upgradeDialog(d, C, { key, target, gameId, src } = {}) {
  const o = d.offers || {};
  if (target === 'addgame') {
    const ng = (o.newGames || []).find(x => x.id === gameId) || (o.newGames || [])[0];
    if (!ng) return alert('Ưu đãi game mới đã hết hạn hoặc bạn đã có game này.');
    const single = C.plans.find(p => !p.allGames && p.slots === 1);
    const { el } = modal(`
      <div class="hero">🎉</div>
      <h3>Thêm ${esc(ng.name)} vào key</h3>
      <p class="msub">Giá riêng cho khách cũ, còn <b>${left(ng.until)}</b>.</p>
      <div class="deal on"><span><b>${esc(ng.name)}</b><small>Thêm vào key đang dùng, không cần key mới</small></span><span class="p">${single ? `<s>${money(single.price)}</s>` : ''}<strong>${money(ng.price)}</strong></span></div>
      <div class="err" id="upErr"></div>
      <button class="btn block" id="upGo">Thanh toán ${moneyFull(ng.price)}</button>`);
    $('#upGo', el).onclick = () => createOrder(el, { target: 'addgame', gameId: ng.id, source: src || source('account:them-game') });
    return;
  }
  const lic = (o.licenses || []).find(l => l.key === key) || (o.licenses || [])[0];
  if (!lic) return alert('Key của bạn đã ở gói cao nhất.');
  const opts = [lic.combo, lic.all].filter(Boolean);
  let pick = opts.find(x => (target === 'all' ? x.allGames : !x.allGames)) || opts[opts.length - 1];
  const owned = new Set(lic.games);
  const until = opts.find(x => x.until)?.until;
  const { el } = modal(`
    <div class="hero">⬆️</div>
    <h3>Nâng cấp key</h3>
    <p class="msub">Đang dùng: <b>${esc(lic.planName)}</b>. Chỉ trả phần chênh lệch, key giữ nguyên, không cần cài lại.</p>
    ${until ? `<div class="timer">⏰ Giá ưu đãi còn ${left(until)}</div>` : ''}
    ${opts.map((x, i) => `<div class="deal" data-i="${i}"><span><b>${esc(x.planName)}</b><small>${x.allGames ? `Tất cả ${C.games.length} game + mọi game mới` : `${x.slots} game, chọn thêm ${x.need} game`}</small></span>
      <span class="p">${x.off ? `<s>${money(x.full)}</s>` : ''}<strong>+${money(x.price)}</strong></span></div>`).join('')}
    <div class="field" id="upPickWrap"><label id="upPickLabel"></label><div class="pick grid" id="upPick"></div></div>
    <div class="err" id="upErr"></div>
    <button class="btn block" id="upGo"></button>`);
  const draw = () => {
    $$('.deal', el).forEach(x => x.classList.toggle('on', opts[x.dataset.i] === pick));
    const need = pick.allGames ? 0 : pick.need;
    $('#upPickWrap', el).style.display = need ? '' : 'none';
    $('#upPickLabel', el).textContent = `Chọn thêm ${need} game`;
    $('#upPick', el).innerHTML = C.games.filter(g => !owned.has(g.id)).map(g => `<label><input type="checkbox" value="${esc(g.id)}"><img src="${esc(g.image)}" alt=""><span>${esc(g.name)}</span></label>`).join('');
    $$('#upPick input', el).forEach(i => i.onchange = () => { if ($$('#upPick input:checked', el).length > need) { i.checked = false; $('#upErr', el).textContent = `Chỉ chọn ${need} game.`; } else $('#upErr', el).textContent = ''; });
    $('#upGo', el).textContent = `Thanh toán ${moneyFull(pick.price)}`;
  };
  $$('.deal', el).forEach(x => x.onclick = () => { pick = opts[x.dataset.i]; draw(); });
  draw();
  $('#upGo', el).onclick = () => createOrder(el, { target: pick.allGames ? 'all' : 'combo', key: lic.key, games: $$('#upPick input:checked', el).map(i => i.value), source: src || source('account:nang-cap') });
}

async function createOrder(el, body) {
  const btn = $('#upGo', el);
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang tạo đơn…';
  try {
    const r = await api('/api/account/upgrade', body);
    location.href = r.checkoutUrl || `/don-hang.html?code=${r.code}&t=${r.token}`;
  } catch (e) { $('#upErr', el).textContent = e.message; btn.disabled = false; btn.textContent = 'Thử lại'; }
}

// 3) Popup tự hiện cho khách đã mua (trang chủ, trang tài khoản): tối đa 1 lần/ngày cho mỗi ưu đãi
export function autoOfferPopup(d, C) {
  const o = d.offers;
  if (!d.upsell?.account || !o) return;
  const ng = (o.newGames || [])[0];
  const lic = (o.licenses || [])[0];
  if (!ng && !lic) return;
  const id = ng ? `ng_${ng.id}` : `up_${lic.key}_${lic.all?.until || lic.combo?.until || 0}`;
  const seen = JSON.parse(localStorage.getItem('lg_up_seen') || '{}');
  if (seen[id] && Date.now() - seen[id] < 86400000) return;
  seen[id] = Date.now();
  localStorage.setItem('lg_up_seen', JSON.stringify(seen));
  upEvent('account_shown');
  let html;
  if (ng) {
    html = `<div class="hero">🎉</div><h3>Game mới: ${esc(ng.name)}</h3>
      ${ng.image ? `<img src="${esc(ng.image)}" alt="" style="width:100%;border-radius:14px;max-height:220px;object-fit:cover;margin:6px 0 10px">` : ''}
      <p class="msub">Khách cũ được thêm vào key với giá riêng <b>${money(ng.price)}</b>, còn ${left(ng.until)}.</p>
      <div class="row2"><button class="btn block" data-a="addgame">Thêm vào key · ${money(ng.price)}</button>
      <a class="btn ghost block" href="/game/${esc(ng.id)}">Xem game chạy thử</a></div>`;
  } else {
    const best = lic.all || lic.combo;
    const timed = [lic.combo, lic.all].find(x => x && x.until);
    html = `<div class="hero">${timed ? '⏰' : '⬆️'}</div><h3>${timed ? 'Ưu đãi nâng cấp dành riêng cho bạn' : 'Thêm game cho phòng LIVE đỡ nhàm'}</h3>
      <p class="msub">Bạn đang dùng <b>${esc(lic.planName)}</b>. Nâng cấp chỉ trả phần chênh lệch, key giữ nguyên.</p>
      ${timed ? `<div class="timer">Còn ${left(timed.until)}</div>` : ''}
      ${lic.combo ? `<div class="deal" data-a="combo"><span><b>${esc(lic.combo.planName)}</b><small>${lic.combo.slots} game, đổi game theo ngày</small></span><span class="p">${lic.combo.off ? `<s>${money(lic.combo.full)}</s>` : ''}<strong>+${money(lic.combo.price)}</strong></span></div>` : ''}
      ${lic.all ? `<div class="deal ${best === lic.all ? 'on' : ''}" data-a="all"><span><b>${esc(lic.all.planName)}</b><small>Tất cả ${C.games.length} game + mọi game mới</small></span><span class="p">${lic.all.off ? `<s>${money(lic.all.full)}</s>` : ''}<strong>+${money(lic.all.price)}</strong></span></div>` : ''}
      <p class="note" style="font-size:13px;margin:4px 0 0">Bấm vào gói để xem chi tiết và thanh toán.</p>`;
  }
  const { el, close } = modal(html);
  el.addEventListener('closed', () => upEvent('account_close'));
  $$('[data-a]', el).forEach(b => b.onclick = () => {
    close(); upEvent('account_click');
    const a = b.dataset.a;
    upgradeDialog(d, C, a === 'addgame' ? { target: 'addgame', gameId: ng.id, src: source('popup:game-moi') } : { key: lic.key, target: a, src: source('popup:nang-cap') });
  });
}

// 4) Ô nâng cấp luôn hiện trong trang tài khoản
export function offerCards(d) {
  const o = d.offers;
  if (!o) return '';
  const out = [];
  for (const ng of o.newGames || []) out.push(`<div class="up-card"><h4>🎉 Game mới: ${esc(ng.name)}</h4><p>Giá riêng cho khách cũ ${money(ng.price)}, còn ${left(ng.until)}.</p>
    <div class="btns"><button class="btn sm" data-up="addgame" data-game="${esc(ng.id)}">Thêm vào key · ${money(ng.price)}</button><a class="btn ghost sm" href="/game/${esc(ng.id)}">Xem game</a></div></div>`);
  for (const l of o.licenses || []) {
    const timed = [l.combo, l.all].find(x => x && x.until);
    out.push(`<div class="up-card"><h4>⬆️ Nâng cấp key ${esc(l.key.slice(-9))}</h4><p>Chỉ trả phần chênh lệch, key giữ nguyên.${timed ? ` <b style="color:#b45309">Giá ưu đãi còn ${left(timed.until)}.</b>` : ''}</p>
      <div class="btns">${l.combo ? `<button class="btn sm ${l.all ? 'ghost' : ''}" data-up="combo" data-key="${esc(l.key)}">${esc(l.combo.planName)} · +${money(l.combo.price)}</button>` : ''}
      ${l.all ? `<button class="btn sm" data-up="all" data-key="${esc(l.key)}">${esc(l.all.planName)} · +${money(l.all.price)}</button>` : ''}</div></div>`);
  }
  return out.join('');
}
export function bindOfferCards(d, C) {
  $$('[data-up]').forEach(b => b.onclick = () => upgradeDialog(d, C, { key: b.dataset.key, target: b.dataset.up, gameId: b.dataset.game }));
}

// 5) Ưu đãi đơn đầu tiên cho khách đã đăng ký nhưng chưa mua: giá giảm tự áp, có hạn
export function applyFirst(C, fo) {
  if (!fo) return false;
  for (const p of C.plans) {
    const x = fo.prices[p.id];
    if (!x) continue;
    p.full = x.full; p.price = x.price;
  }
  C.firstUntil = fo.until;
  return true;
}

function firstDeals(C, fo) {
  return C.plans.filter(p => fo.prices[p.id]?.off > 0).map(p => {
    const x = fo.prices[p.id];
    const sub = p.allGames ? `Tất cả ${C.games.length} game + mọi game mới` : p.slots > 1 ? `${p.slots} game tự chọn` : '1 game tự chọn';
    return `<div class="deal ${p.highlight ? 'on' : ''}" data-plan="${esc(p.id)}"><span><b>${esc(p.name)}</b><small>${sub} · giảm ${money(x.off)}</small></span><span class="p"><s>${money(x.full)}</s><strong>${money(x.price)}</strong></span></div>`;
  }).join('');
}

// Popup tự hiện (trang chủ, trang tài khoản), tối đa 1 lần/ngày. onPick(planId, src) để mua ngay
export function firstOfferPopup(d, C, onPick) {
  const fo = d.firstOffer;
  if (!d.upsell?.first || !fo || fo.until <= Date.now()) return false;
  const seen = Number(localStorage.getItem('lg_first_seen') || 0);
  if (Date.now() - seen < 86400000) return false;
  localStorage.setItem('lg_first_seen', Date.now());
  upEvent('first_shown');
  const { el, close } = modal(`
    <div class="hero">🎁</div>
    <h3>Quà cho đơn đầu tiên của bạn</h3>
    <p class="msub">Cảm ơn bạn đã đăng ký. Giá dưới đây chỉ dành cho đơn đầu tiên, tự áp khi bạn mua, không cần mã.</p>
    <div class="timer" data-left>⏰ Còn ${left(fo.until)}</div>
    ${firstDeals(C, fo)}
    <p class="note" style="font-size:13px;margin:6px 0 0">Bấm vào gói để chọn game và thanh toán.</p>`);
  const tick = setInterval(() => { const s = left(fo.until); if (!s || !el.isConnected) return clearInterval(tick); $('[data-left]', el).textContent = `⏰ Còn ${s}`; }, 30000);
  el.addEventListener('closed', () => upEvent('first_close'));
  $$('[data-plan]', el).forEach(b => b.onclick = () => {
    close(); upEvent('first_click');
    if (onPick) onPick(b.dataset.plan, 'popup:don-dau');
    else { sessionStorage.setItem('lg_src', 'popup:don-dau'); location.href = `/#mua-${b.dataset.plan}`; }
  });
  return true;
}

// Ô ưu đãi đơn đầu trong trang tài khoản
export function firstCard(d, C) {
  const fo = d.firstOffer;
  if (!fo || fo.until <= Date.now() || !C) return '';
  const btns = C.plans.filter(p => fo.prices[p.id]?.off > 0).map(p => `<a class="btn sm ${p.allGames ? '' : 'ghost'}" href="/#mua-${esc(p.id)}" data-first>${esc(p.name)} · <s style="opacity:.6">${money(fo.prices[p.id].full)}</s> ${money(fo.prices[p.id].price)}</a>`).join('');
  return `<div class="up-card" style="margin-bottom:14px"><h4>🎁 Ưu đãi đơn đầu tiên của bạn</h4><p>Giá giảm tự áp khi mua, không cần mã. <b style="color:#b45309">Còn ${left(fo.until)}.</b></p><div class="btns">${btns}</div></div>`;
}
export function bindFirstCard() {
  $$('[data-first]').forEach(a => a.addEventListener('click', () => { sessionStorage.setItem('lg_src', 'account:don-dau'); upEvent('first_click'); }));
}
