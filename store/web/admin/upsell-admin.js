// Quản trị: Bán thêm (popup, email tự động, báo game mới) + báo cáo
import { $, $$, esc, money, moneyFull, toast } from '/js/common.js';

const fmt = (t) => t ? new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—';
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const TYPE_LABEL = { receipt: 'Gửi key', offer: 'Mời nâng cấp', reminder: 'Nhắc hết hạn', newgame: 'Game mới (mời mua)', newgameOwned: 'Game mới (đã có)' };
const SRC_LABEL = (s) => ({
  'web:mua': 'Mua trực tiếp trên web', 'popup:checkout': 'Popup lúc mua Gói Lẻ', 'popup:nang-cap': 'Popup nâng cấp',
  'popup:game-moi': 'Popup game mới', 'account:nang-cap': 'Nút nâng cấp trong tài khoản', 'account:them-game': 'Nút thêm game trong tài khoản',
}[s] || (s.startsWith('email:') ? `Email: ${TYPE_LABEL[s.slice(6)] || TYPE_LABEL[Object.keys(TYPE_LABEL).find(k => k.toLowerCase() === s.slice(6))] || s.slice(6)}` : s));

export async function renderUpsell(view, call, games, plans) {
  const d = await call('/api/admin/upsell');
  const r = d.report, c = d.cfg, ev = r.events;
  const sentAll = r.emails.reduce((s, e) => s + e.sent, 0);
  const tog = (k, label, hint = '') => `<label class="up-tog"><input type="checkbox" name="${k}" ${c[k] ? 'checked' : ''}><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ''}</span></label>`;
  const num = (k, label, hint = '') => `<div class="field"><label>${label}</label><input name="${k}" type="number" min="0" value="${esc(c[k])}">${hint ? `<small>${hint}</small>` : ''}</div>`;
  const txt = (k, label, hint = '', type = 'text') => `<div class="field"><label>${label}</label><input name="${k}" type="${type}" value="${type === 'password' ? '' : esc(c[k])}" ${type === 'password' ? `placeholder="${d.smtpPassSet ? '•••••••• (đã lưu)' : (d.usesBankMail ? 'Để trống = dùng mật khẩu Gmail ngân hàng' : '16 ký tự')}"` : ''}>${hint ? `<small>${hint}</small>` : ''}</div>`;
  const single = plans.find(p => !p.allGames && p.slots === 1);
  const days = r.days;
  const maxDay = Math.max(1, ...days.map(x => x.upgradeRevenue));

  view.innerHTML = `
    <style>
      .up-tog{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer}
      .up-tog input{width:20px;height:20px;margin-top:2px;flex:none}.up-tog small{display:block;color:var(--muted);font-weight:400}
      .up-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0 16px}
      .up-tbl td,.up-tbl th{padding:8px 10px;text-align:left;border-bottom:1px solid var(--line);font-size:14px}
      .up-tbl th{color:var(--muted);font-weight:600;font-size:13px}
      .up-bars{display:flex;gap:4px;align-items:flex-end;height:110px;padding:8px 0}
      .up-bars div{flex:1;background:linear-gradient(180deg,#ff6b81,#ff9f43);border-radius:6px 6px 0 0;min-height:2px;position:relative}
      .up-bars span{position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-size:10px;color:var(--muted);white-space:nowrap}
      .up-tpl summary{cursor:pointer;font-weight:700;padding:10px 0}
      .up-tpl textarea{width:100%;font:inherit;font-size:14px;min-height:220px}
      .up-ok{color:#16a34a;font-weight:700}.up-bad{color:#dc2626;font-weight:700}
      .up-flow{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:10px}
      .up-flow div{background:var(--soft);border-radius:14px;padding:14px;font-size:14px}.up-flow b{display:block;margin-bottom:4px}
    </style>
    <h1>Bán thêm cho khách cũ</h1>
    <p class="note" style="margin-top:-6px">Popup và email tự động mời khách Gói Lẻ nâng cấp (chỉ trả tiền chênh lệch, giữ nguyên key), và báo game mới cho khách cũ.</p>

    <div class="cards">
      <div class="stat"><span>Doanh thu nâng cấp + thêm game</span><b>${moneyFull(r.upgrades.revenue)}</b></div>
      <div class="stat"><span>Đơn nâng cấp đã trả</span><b>${r.upgrades.orders}${r.pending ? ` <small style="font-size:14px;color:var(--warn)">(${r.pending} chờ)</small>` : ''}</b></div>
      <div class="stat"><span>Khách đã nâng cấp / khách đã mua</span><b>${r.upgrades.customers} / ${r.upgrades.buyers}</b></div>
      <div class="stat"><span>Email đã gửi · mở · bấm</span><b>${sentAll} · ${pct(r.emails.reduce((s, e) => s + e.opened, 0), sentAll)} · ${pct(r.emails.reduce((s, e) => s + e.clicked, 0), sentAll)}</b></div>
      <div class="stat"><span>Popup lúc mua: hiện → lên Combo</span><b>${ev.checkout_shown || 0} → ${ev.checkout_accept || 0} <small style="font-size:14px">(${pct(ev.checkout_accept || 0, ev.checkout_shown || 0)})</small></b></div>
      <div class="stat"><span>Popup khách cũ: hiện → bấm</span><b>${ev.account_shown || 0} → ${ev.account_click || 0} <small style="font-size:14px">(${pct(ev.account_click || 0, ev.account_shown || 0)})</small></b></div>
    </div>

    <div class="box-s"><h2>Doanh thu nâng cấp 14 ngày</h2>
      <div class="up-bars">${days.map(x => `<div title="${x.day}: ${moneyFull(x.upgradeRevenue)} (${x.upgrades} đơn)" style="height:${Math.round((x.upgradeRevenue / maxDay) * 100)}%"><span>${x.day.slice(8)}/${x.day.slice(5, 7)}</span></div>`).join('')}</div>
      <div style="height:18px"></div>
      <p class="note">Đơn mới theo gói (không tính nâng cấp): ${plans.map(p => `${esc(p.name)} <b>${r.byPlan[p.id] || 0}</b>`).join(' · ')}</p>
    </div>

    <div class="box-s"><h2>Doanh thu theo nguồn</h2>
      <div class="tbl-wrap"><table class="up-tbl"><thead><tr><th>Nguồn</th><th>Đơn đã trả</th><th>Doanh thu</th></tr></thead><tbody>
      ${Object.entries(r.bySource).sort((a, b) => b[1].revenue - a[1].revenue).map(([k, v]) => `<tr><td>${esc(SRC_LABEL(k))}</td><td>${v.orders}</td><td>${moneyFull(v.revenue)}</td></tr>`).join('') || '<tr><td colspan="3">Chưa có đơn.</td></tr>'}
      </tbody></table></div></div>

    <div class="box-s"><h2>Hiệu quả từng email</h2>
      <div class="tbl-wrap"><table class="up-tbl"><thead><tr><th>Email</th><th>Đã gửi</th><th>Lỗi</th><th>Mở</th><th>Bấm link</th></tr></thead><tbody>
      ${r.emails.map(e => `<tr><td>${esc(e.name)}</td><td>${e.sent}</td><td>${e.failed}</td><td>${e.opened} (${pct(e.opened, e.sent)})</td><td>${e.clicked} (${pct(e.clicked, e.sent)})</td></tr>`).join('')}
      </tbody></table></div>
      <p class="note">Tỉ lệ mở chỉ là ước tính: một số hộp thư chặn ảnh nên không đếm được. ${r.optOut} khách đã huỷ nhận email giới thiệu.</p></div>

    <form id="upf">
      <div class="box-s"><h2>Kịch bản tự động</h2>
        <div class="up-flow">
          <div><b>① Lúc chọn Gói Lẻ</b>Popup: "Chỉ thêm ${single ? money(plans.find(p => !p.allGames && p.slots > 1)?.price - single.price) : '…'} là có 3 game" → Lấy Combo hoặc vẫn mua 1 game.</div>
          <div><b>② Ngay khi thanh toán</b>Email gửi key + link tải + hướng dẫn cài.</div>
          <div><b>③ Sau ${c.offerAfterDays} ngày</b>Email + popup trên web: mời nâng cấp, giảm thêm ${money(c.comboOff)} (Combo) / ${money(c.allOff)} (Trọn Bộ) trong ${c.offerHours} giờ.</div>
          <div><b>④ Còn 12 giờ</b>Email nhắc ưu đãi sắp hết hạn.</div>
          <div><b>⑤ Bật "Hiện" game mới</b>Email + popup: khách cũ thêm game vào key giá ${money(c.newGamePrice)} trong ${c.newGameDays} ngày. Khách Trọn Bộ/Combo còn suất nhận email "đã có sẵn".</div>
          <div><b>Luôn có</b>Ô "Nâng cấp key" trong Tài khoản của tôi, giá chênh lệch theo bảng giá hiện tại.</div>
        </div>
      </div>

      <div class="box-s"><h2>Bật / tắt</h2>
        ${tog('emailsOn', '📧 Gửi email tự động (công tắc tổng)', `Bật sau khi bấm "Gửi thử" thấy email về. Lúc bật, khách mua từ ${c.offerAfterDays} ngày trước trở lên sẽ nhận ngay email mời nâng cấp; email gửi key chỉ áp dụng cho đơn mới.`)}
        <div class="up-grid">
          <div>${tog('popupCheckout', 'Popup mời lên Combo lúc mua Gói Lẻ')}${tog('popupAccount', 'Popup ưu đãi cho khách đã mua', 'Hiện ở trang chủ và Tài khoản, tối đa 1 lần/ngày')}</div>
          <div>${tog('emailReceipt', 'Email ② gửi key')}${tog('emailOffer', 'Email ③ mời nâng cấp')}${tog('emailReminder', 'Email ④ nhắc hết hạn')}${tog('emailNewGame', 'Email ⑤ báo game mới')}</div>
        </div>
      </div>

      <div class="box-s"><h2>Giá ưu đãi</h2><div class="form-grid">
        ${num('offerAfterDays', 'Mời nâng cấp sau (ngày)', 'Tính từ lúc mua')}${num('offerHours', 'Ưu đãi kéo dài (giờ)')}
        ${num('comboOff', 'Giảm thêm khi lên Combo (đồng)', 'Giá thường = giá Combo − số khách đã trả. 0 = không giảm')}${num('allOff', 'Giảm thêm khi lên Trọn Bộ (đồng)', 'VD 111000: 560K còn 449K')}
        ${num('newGamePrice', 'Giá game mới cho khách cũ (đồng)')}${num('newGameDays', 'Giá riêng game mới trong (ngày)')}
      </div></div>

      <div class="box-s"><h2>Gmail gửi đi</h2>
        <p class="note">Dùng Gmail + mật khẩu ứng dụng 16 ký tự (giống phần đọc email ngân hàng). Để trống thì dùng luôn Gmail ngân hàng${d.bankMail ? ` (<b>${esc(d.bankMail)}</b>)` : ''}. Gmail thường gửi được khoảng 500 email/ngày, web gửi tối đa ${c.maxPerRun} email mỗi 2 phút.</p>
        <div class="form-grid">
          ${txt('smtpUser', 'Gmail gửi', 'VD: netxioviet@gmail.com')}${txt('smtpPass', 'Mật khẩu ứng dụng', '', 'password')}
          ${txt('fromName', 'Tên người gửi', 'Để trống = tên thương hiệu')}${txt('replyTo', 'Khách trả lời về email', 'Để trống = email người bán')}
        </div>
        <p>Trạng thái: ${r.smtpReady ? '<span class="up-ok">Đã có Gmail gửi</span>' : '<span class="up-bad">Chưa có Gmail gửi</span>'} · Lần chạy gần nhất: ${fmt(r.lastRun)}${r.lastError ? ` · <span class="up-bad">Lỗi: ${esc(r.lastError)}</span>` : ''}</p>
      </div>

      <div class="box-s"><h2>Nội dung email</h2>
        <p class="note">Biến: {ten} {shop} {goi} {key} {game} {so_game} {gia_le} {gia_combo} {gia_tronbo} {han} {game_moi} {gia_game_moi} {han_game_moi} {id_game_moi}. Dòng <code>[Chữ trên nút](/duong-dan)</code> thành nút bấm. Dòng có biến trống (VD khách đã là Combo thì không có {gia_combo}) tự ẩn.</p>
        ${Object.entries(d.templates).map(([k, t]) => `<details class="up-tpl" data-tpl="${k}"><summary>${esc(t.name)}</summary>
          <div class="field"><label>Tiêu đề</label><input data-f="subject" value="${esc(t.subject)}"></div>
          <div class="field"><label>Nội dung</label><textarea data-f="body">${esc(t.body)}</textarea></div>
          <div class="bar" style="justify-content:flex-start;gap:8px"><button type="button" class="btn ghost sm" data-prev="${k}">👁 Xem trước</button><button type="button" class="btn ghost sm" data-test="${k}">✉️ Gửi thử</button><button type="button" class="btn ghost sm" data-reset="${k}">↺ Về mẫu gốc</button></div>
        </details>`).join('')}
      </div>
      <button class="btn">Lưu cài đặt bán thêm</button>
    </form>

    <div class="box-s" style="margin-top:24px"><h2>Báo game mới</h2>
      <p class="note">Bật "Hiện" một game mới trong mục Game là tự báo. Muốn báo lại game đã có thì chọn ở đây.</p>
      <div class="bar" style="justify-content:flex-start;gap:8px"><select id="upGame">${games.filter(g => g.visible).map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('')}</select><button class="btn sm" id="upLaunch">Báo game mới</button><button class="btn ghost sm" id="upRun">Gửi email đang chờ ngay</button></div>
      ${r.launches.length ? `<div class="tbl-wrap"><table class="up-tbl"><thead><tr><th>Game</th><th>Bắt đầu</th><th>Đã báo</th></tr></thead><tbody>${r.launches.map(l => `<tr><td>${esc(l.name)}</td><td>${fmt(l.at)}</td><td>${l.sent} khách</td></tr>`).join('')}</tbody></table></div>` : ''}
    </div>

    <div class="box-s"><h2>Email gần đây</h2>
      ${r.recent.length ? `<div class="tbl-wrap"><table class="up-tbl"><thead><tr><th>Lúc</th><th>Khách</th><th>Email</th><th>Kết quả</th></tr></thead><tbody>
      ${r.recent.map(e => `<tr><td>${fmt(e.sentAt)}</td><td>${esc(e.name)}<br><small class="note">${esc(e.to)}</small></td><td>${esc(TYPE_LABEL[e.type] || e.type)}<br><small class="note">${esc(e.subject)}</small></td>
        <td>${e.status === 'sent' ? '✅ Đã gửi' : e.status === 'error' ? `<span class="up-bad" title="${esc(e.error)}">❌ Lỗi</span>` : '⏳'}${e.openedAt ? ' · 👁 Mở' : ''}${e.clickedAt ? ` · 👆 Bấm ${e.clicks}` : ''}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="note">Chưa gửi email nào.</p>'}
    </div>`;

  const form = $('#upf', view);
  const templatesBody = () => Object.fromEntries($$('[data-tpl]', view).map(el => [el.dataset.tpl, { subject: $('[data-f=subject]', el).value, body: $('[data-f=body]', el).value }]));
  const cfgBody = () => {
    const out = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      out[el.name] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value;
    }
    return out;
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    await call('/api/admin/upsell', { cfg: cfgBody(), templates: templatesBody() }, 'PUT');
    toast('Đã lưu');
    renderUpsell(view, call, games, plans);
  };
  $$('[data-prev]', view).forEach(b => b.onclick = async () => {
    const k = b.dataset.prev;
    const r2 = await call('/api/admin/upsell/preview', { type: k, template: templatesBody()[k] });
    const w = window.open('', '_blank', 'width=640,height=800');
    if (w) { w.document.write(r2.html); w.document.title = r2.subject; } else toast('Trình duyệt chặn cửa sổ xem trước');
  });
  $$('[data-test]', view).forEach(b => b.onclick = async () => {
    const to = prompt('Gửi thử tới email (lưu cài đặt trước nếu vừa sửa Gmail/nội dung):', localStorage.getItem('lg_test_to') || '');
    if (!to) return;
    localStorage.setItem('lg_test_to', to);
    b.disabled = true;
    try { await call('/api/admin/upsell/test', { to, type: b.dataset.test }); toast(`Đã gửi tới ${to}. Xem hộp thư (cả mục Quảng cáo/Spam).`); } finally { b.disabled = false; }
  });
  $$('[data-reset]', view).forEach(b => b.onclick = async () => {
    if (!confirm('Đưa mẫu email này về nội dung gốc?')) return;
    await call('/api/admin/upsell', { templates: { [b.dataset.reset]: { reset: true } } }, 'PUT');
    renderUpsell(view, call, games, plans);
  });
  $('#upLaunch', view).onclick = async () => {
    const id = $('#upGame', view).value;
    if (!id || !confirm('Báo game này là game mới cho khách cũ (email + popup)?')) return;
    await call('/api/admin/upsell/launch', { gameId: id });
    toast('Đã tạo đợt báo game mới'); renderUpsell(view, call, games, plans);
  };
  $('#upRun', view).onclick = async () => {
    const r2 = await call('/api/admin/upsell/run', {});
    toast(r2.error ? `Lỗi: ${r2.error}` : r2.skipped ? 'Chưa bật hoặc chưa có Gmail gửi' : `Đã gửi ${r2.sent || 0} email${r2.failed ? `, lỗi ${r2.failed}` : ''}`);
    renderUpsell(view, call, games, plans);
  };
}
