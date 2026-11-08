import { $, $$, api, esc, money, moneyFull, applyBrand, zaloLink, me } from './common.js';
import { track } from './track.js';

let C; // catalog
let currentPlan = null;

function openModal(id) { $(id).classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(m) {
  m.classList.remove('open'); document.body.style.overflow = '';
  const v = $('video', m); if (v) v.pause();
}
$$('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m || e.target.hasAttribute('data-close')) closeModal(m); });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.open').forEach(closeModal); });

function playVideo(src) {
  const v = $('#modalVideo');
  v.src = src; openModal('#videoModal'); v.play().catch(() => {});
}

function renderHero() {
  const s = C.settings;
  $('#heroEyebrow').textContent = s.heroEyebrow;
  // Tô màu nửa sau tiêu đề
  const words = s.heroTitle.split(' ');
  const cut = Math.ceil(words.length * 0.55);
  $('#heroTitle').innerHTML = `${esc(words.slice(0, cut).join(' '))} <span class="hl">${esc(words.slice(cut).join(' '))}</span>`;
  $('#heroSub').textContent = s.heroSubtitle;
  const hv = s.heroVideo || C.games.find(g => g.video)?.video;
  if (hv) $('#heroVideo').src = hv; else $('.phone').remove();
  $('#statGames').textContent = C.games.length;
  $('#promo').textContent = s.promo;
  if (!s.promo) $('#promo').remove();
}

function renderGames() {
  const single = C.plans.find(p => p.slots === 1 && !p.allGames);
  const html = C.games.map(g => `
    <article class="game">
      <div class="thumb" data-video="${esc(g.video)}">
        <img src="${esc(g.image)}" alt="Game ${esc(g.name)} trên TikTok LIVE" loading="lazy" width="300" height="400">
        ${g.video ? '<div class="play"><span>▶</span></div>' : ''}
        ${g.isNew ? '<span class="tag">MỚI</span>' : ''}
      </div>
      <div class="body">
        <h3><a href="/game/${esc(g.id)}">${esc(g.name)}</a></h3>
        <p>${esc(g.tagline)}</p>
        <ul>${(g.features || []).slice(0, 4).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <a class="more" href="/game/${esc(g.id)}">Xem chi tiết & cách chơi →</a>
        <div class="foot">
          <span class="price">${single ? money(single.price) : ''} <small>trọn đời</small></span>
          ${single ? `<button class="btn sm" data-buy="${esc(single.id)}" data-game="${esc(g.id)}">Mua</button>` : ''}
        </div>
      </div>
    </article>`).join('');
  $('#games').innerHTML = html + `
    <article class="game soon">
      <div class="thumb"><div><b>＋</b>Game mới đang làm</div></div>
      <div class="body"><h3>Sắp ra mắt</h3><p>Gói Combo và Trọn Bộ được nhận game mới tự động vào key.</p></div>
    </article>`;
  $$('#games .thumb[data-video]').forEach(t => t.addEventListener('click', () => t.dataset.video && playVideo(t.dataset.video)));
}

function renderPlans() {
  const single = C.plans.find(p => p.slots === 1 && !p.allGames);
  $('#plans').innerHTML = C.plans.map(p => {
    let save = '';
    if (single && p.id !== single.id) {
      const n = p.allGames ? C.games.length : p.slots;
      const full = single.price * n;
      if (!p.allGames && full > p.price) save = `Tiết kiệm ${money(full - p.price)} so với mua lẻ`;
      if (p.allGames) save = 'Gồm cả game ra mắt sau này';
    }
    return `
    <div class="plan ${p.highlight ? 'hl' : ''}">
      ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      <div class="psub">${esc(p.subtitle)}</div>
      <div class="amount">${money(p.price)} <small>/ trọn đời</small></div>
      <div class="save">${esc(save)}</div>
      <ul>${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      <button class="btn ${p.highlight ? '' : 'ghost'} block" data-buy="${esc(p.id)}">Chọn ${esc(p.name)}</button>
    </div>`;
  }).join('');
}

function renderFaq() {
  $('#faq').innerHTML = C.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
}

function renderSupport() {
  const s = C.settings;
  const items = [];
  if (s.messengerUrl) items.push(`<a href="${esc(s.messengerUrl)}" target="_blank" rel="noopener"><span class="ico" style="background:#0084ff22">💬</span><span>Chat fanpage<small>Trả lời nhanh nhất</small></span></a>`);
  if (s.zaloGroup) items.push(`<a href="${esc(s.zaloGroup)}" target="_blank" rel="noopener"><span class="ico" style="background:#0068ff22">👥</span><span>Nhóm Zalo<small>Hỗ trợ & tin cập nhật</small></span></a>`);
  if (s.contactZalo) items.push(`<a href="${esc(zaloLink(s.contactZalo))}" target="_blank" rel="noopener"><span class="ico" style="background:#0068ff22">💬</span><span>Zalo<small>Hỗ trợ cài đặt</small></span></a>`);
  if (s.contactFacebook) items.push(`<a href="${esc(s.contactFacebook)}" target="_blank" rel="noopener"><span class="ico" style="background:#1877f222">📘</span><span>Facebook<small>Nhắn tin fanpage</small></span></a>`);
  if (s.contactTiktok) items.push(`<a href="${esc(s.contactTiktok)}" target="_blank" rel="noopener"><span class="ico" style="background:#ff2d5522">🎵</span><span>TikTok<small>Xem game chạy LIVE</small></span></a>`);
  if (s.contactPhone) items.push(`<a href="tel:${esc(s.contactPhone)}"><span class="ico" style="background:#2fd18b22">📞</span><span>${esc(s.contactPhone)}<small>Gọi điện</small></span></a>`);
  items.push(`<a href="/tra-cuu.html"><span class="ico" style="background:#7c5cff22">🔑</span><span>Tra cứu key<small>Xem key, chuyển máy</small></span></a>`);
  $('#support').innerHTML = items.join('');
}

// ---------- mua hàng ----------
async function openBuy(planId, gameId) {
  currentPlan = C.plans.find(p => p.id === planId);
  if (!currentPlan) return;
  const { user } = await me();
  if (!user) {
    const next = `/#mua-${planId}${gameId ? `~${gameId}` : ''}`;
    location.href = `/tai-khoan.html?next=${encodeURIComponent(next)}&ly-do=mua`;
    return;
  }
  $('#buyAs').innerHTML = `Mua bằng tài khoản <b>${esc(user.name)}</b> · ${esc(user.phone)} <a href="/tai-khoan.html">Đổi</a><br><small>Key và link tải sẽ nằm trong mục <b>Tài khoản của tôi</b>.</small>`;
  const p = currentPlan;
  const need = p.allGames ? 0 : Math.min(p.slots, C.games.length);
  $('#buyTitle').textContent = `${p.name} · ${money(p.price)}`;
  $('#buySub').textContent = p.allGames
    ? `Gồm ${C.games.length} game hiện có và mọi game ra mắt sau này.`
    : need < p.slots
      ? `Hiện có ${C.games.length} game, bạn nhận tất cả. ${p.slots - need} suất còn lại tự nhận game mới khi ra mắt.`
      : `Chọn ${need} game bạn muốn dùng.`;
  $('#buyTotal').textContent = moneyFull(p.price);
  $('#buyErr').textContent = '';
  $('#pickWrap').style.display = p.allGames ? 'none' : '';
  $('#pickLabel').textContent = need === 1 ? 'Chọn 1 game' : `Chọn ${need} game`;
  const type = need === 1 ? 'radio' : 'checkbox';
  // gói nhiều game: hiện dạng lưới ô nhỏ cho đỡ phải cuộn
  $('#pick').classList.toggle('grid', need > 1);
  $('#pick').innerHTML = C.games.map((g, i) => {
    const checked = need === 1 ? (gameId ? g.id === gameId : i === 0) : (need >= C.games.length || g.id === gameId);
    return `<label><input type="${type}" name="game" value="${esc(g.id)}" ${checked ? 'checked' : ''}><img src="${esc(g.image)}" alt=""><span>${esc(g.name)}</span></label>`;
  }).join('');
  const count = () => {
    $('#pickCount').textContent = p.allGames || need <= 1 ? '' : `Đã chọn ${$$('#pick input:checked').length}/${need} game`;
  };
  if (type === 'checkbox') {
    $$('#pick input').forEach(i => i.addEventListener('change', () => {
      const on = $$('#pick input:checked');
      if (on.length > need) { i.checked = false; $('#buyErr').textContent = `Chỉ được chọn ${need} game.`; }
      else $('#buyErr').textContent = '';
      count();
    }));
  }
  count();
  openModal('#buyModal');
  track('InitiateCheckout', { value: p.price, content_ids: [p.id], content_name: p.name, content_type: 'product', num_items: p.allGames ? C.games.length : need });
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-buy]');
  if (b) openBuy(b.dataset.buy, b.dataset.game);
});

$('#buyForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#buyBtn');
  const body = {
    planId: currentPlan.id,
    games: $$('#pick input:checked').map(i => i.value),
  };
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang tạo đơn…';
  $('#buyErr').textContent = '';
  try {
    const r = await api('/api/orders', body);
    const orderUrl = `/don-hang.html?code=${r.code}&t=${r.token}`;
    try {
      const list = JSON.parse(localStorage.getItem('lg_orders') || '[]');
      list.unshift({ url: orderUrl, code: r.code, at: Date.now() });
      localStorage.setItem('lg_orders', JSON.stringify(list.slice(0, 10)));
    } catch {}
    location.href = r.checkoutUrl || orderUrl;
  } catch (err) {
    $('#buyErr').textContent = err.message;
    btn.disabled = false; btn.textContent = 'Thanh toán';
  }
});

(async () => {
  try {
    C = await applyBrand();
    renderHero(); renderGames(); renderPlans(); renderFaq(); renderSupport();
    const m = location.hash.match(/^#mua-([^~]+)(?:~(.+))?$/);
    if (m) { history.replaceState(null, '', '/#bang-gia'); openBuy(m[1], m[2]); }
  } catch (e) {
    document.querySelector('main').innerHTML = `<div class="wrap page"><div class="panel">Không tải được dữ liệu: ${esc(e.message)}</div></div>`;
  }
})();
