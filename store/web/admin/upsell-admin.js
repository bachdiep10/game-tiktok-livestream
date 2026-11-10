// Quản trị: Bán thêm (popup, email tự động, báo game mới) + báo cáo
import { $, $$, esc, money, moneyFull, toast } from '/js/common.js';

const fmt = (t) => t ? new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—';
const rate = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const pct = (a, b) => (b ? `${rate(a, b)}%` : '—');
const TYPE_LABEL = { receipt: 'Gửi key', offer: 'Mời nâng cấp', reminder: 'Nhắc hết hạn', newgame: 'Game mới (mời mua)', newgameOwned: 'Game mới (đã có)', welcome: 'Ưu đãi đơn đầu', welcomeReminder: 'Nhắc ưu đãi đơn đầu', abandoned: 'Nhắc đơn chưa trả' };
const TYPE_ICON = { receipt: '🔑', offer: '⬆️', reminder: '⏰', newgame: '🎉', newgameOwned: '🎁', welcome: '👋', welcomeReminder: '⌛', abandoned: '🧾' };
const typeOf = (k) => Object.keys(TYPE_LABEL).find(x => x.toLowerCase() === k) || k;
const SRC_LABEL = (s) => ({
  'web:mua': '🛒 Mua trực tiếp trên web', 'popup:checkout': '🎁 Popup lúc mua Gói Lẻ', 'popup:nang-cap': '⬆️ Popup nâng cấp',
  'popup:game-moi': '🎉 Popup game mới', 'account:nang-cap': '👤 Nút nâng cấp trong tài khoản', 'account:them-game': '👤 Nút thêm game trong tài khoản',
  'popup:don-dau': '👋 Popup ưu đãi đơn đầu', 'account:don-dau': '👋 Ô ưu đãi đơn đầu trong tài khoản',
}[s] || (s.startsWith('email:') ? `✉️ Email: ${TYPE_LABEL[typeOf(s.slice(6))] || s.slice(6)}` : s));

const CSS = `
.ux{--g1:#ff3d7f;--g2:#ff9f43;--ink:#16132b}
.ux .head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;margin-bottom:22px}
.ux .head h1{margin:0 0 6px}.ux .head p{margin:0;color:var(--muted);max-width:620px}
.ux .state{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:999px;font-weight:700;font-size:14px;background:#fff;border:1px solid var(--line);box-shadow:var(--card-shadow)}
.ux .dot{width:10px;height:10px;border-radius:50%;background:#c7c4d6}.ux .dot.on{background:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.15)}
.ux .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:14px}
.ux .kpi{position:relative;overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px 18px 16px;box-shadow:var(--card-shadow)}
.ux .kpi:before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:var(--c,linear-gradient(90deg,var(--g1),var(--g2)))}
.ux .kpi .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:20px;background:var(--bgc,#fff0f4);margin-bottom:10px}
.ux .kpi span{display:block;color:var(--muted);font-size:13px;font-weight:600}
.ux .kpi b{display:block;font-size:28px;letter-spacing:-.03em;margin-top:2px;color:var(--ink)}
.ux .kpi small{color:var(--muted);font-size:12.5px}
.ux .funnels{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:24px}
.ux .card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:var(--card-shadow)}
.ux .card h2{font-size:17px;margin:0 0 4px;display:flex;align-items:center;gap:8px}.ux .card .sub{color:var(--muted);font-size:13.5px;margin:0 0 14px}
.ux .fun{display:grid;gap:10px;margin-top:10px}
.ux .fun .r{display:grid;grid-template-columns:120px 1fr 56px;align-items:center;gap:10px;font-size:13.5px}
.ux .track{height:12px;border-radius:99px;background:var(--soft);overflow:hidden}.ux .track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--g1),var(--g2))}
.ux .track.b i{background:linear-gradient(90deg,#6a4cf5,#4aa8ff)}.ux .track.g i{background:linear-gradient(90deg,#10b981,#34d399)}
.ux .fun .n{text-align:right;font-weight:700}
.ux .grid2{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-bottom:24px}
@media(max-width:1000px){.ux .grid2{grid-template-columns:1fr}}
.ux .chart{display:flex;align-items:flex-end;gap:6px;height:170px;padding:22px 0 26px;position:relative}
.ux .chart .col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;position:relative}
.ux .chart .bar{width:100%;max-width:34px;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,var(--g1),var(--g2));min-height:3px}
.ux .chart .bar.z{background:var(--soft-2)}
.ux .chart .v{font-size:10.5px;font-weight:700;color:var(--ink);margin-bottom:4px;white-space:nowrap}
.ux .chart .d{position:absolute;bottom:-22px;font-size:10.5px;color:var(--muted)}
.ux .src{display:grid;gap:12px}.ux .src .r{display:grid;gap:5px}.ux .src .t{display:flex;justify-content:space-between;font-size:14px}.ux .src .t b{white-space:nowrap}
.ux .tbl{width:100%;border-collapse:separate;border-spacing:0}.ux .tbl th{background:transparent;border-bottom:1px solid var(--line)}
.ux .tbl td{vertical-align:middle}.ux .mini{display:flex;align-items:center;gap:8px}.ux .mini .track{width:90px;height:8px}
.ux .flow{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:6px}
@media(max-width:1200px){.ux .flow{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}}
.ux .kplans{display:grid;gap:4px;margin-top:6px}.ux .kplans div{display:flex;justify-content:space-between;font-size:14px}.ux .kplans b{font-size:18px;display:inline;margin:0}
.ux .step{position:relative;border:1px solid var(--line);border-radius:16px;padding:16px;background:linear-gradient(180deg,#fff,#fbfaff)}
.ux .step .num{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;background:linear-gradient(135deg,var(--g1),var(--g2));margin-bottom:10px;box-shadow:0 6px 16px rgba(255,61,127,.25)}
.ux .step b{display:block;font-size:14.5px;margin-bottom:4px}.ux .step p{margin:0 0 12px;color:var(--muted);font-size:13px;line-height:1.45}
.ux .sw{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:13.5px;font-weight:600;user-select:none}
.ux .sw input{display:none}.ux .sw i{width:44px;height:24px;border-radius:99px;background:#d6d3e4;position:relative;transition:.2s;flex:none}
.ux .sw i:after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:.2s}
.ux .sw input:checked+i{background:linear-gradient(90deg,#10b981,#22c55e)}.ux .sw input:checked+i:after{left:23px}
.ux .master{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;border-radius:18px;padding:18px 20px;margin-bottom:14px;background:linear-gradient(120deg,#16132b,#3b2a7a);color:#fff}
.ux .master p{margin:4px 0 0;color:#cfc9ee;font-size:13.5px;max-width:640px}.ux .master .sw{color:#fff;font-size:15px}
.ux .fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:4px 16px}
.ux .money{position:relative}.ux .money input{padding-right:44px}.ux .money:after{content:attr(data-u);position:absolute;right:12px;bottom:12px;color:var(--muted);font-size:13px}
.ux .tpl{border:1px solid var(--line);border-radius:14px;margin-top:10px;overflow:hidden;background:#fff}
.ux .tpl summary{cursor:pointer;list-style:none;padding:14px 16px;font-weight:700;display:flex;align-items:center;gap:10px}
.ux .tpl summary::-webkit-details-marker{display:none}.ux .tpl summary:after{content:"›";margin-left:auto;font-size:20px;color:var(--muted);transition:.2s}
.ux .tpl[open] summary:after{transform:rotate(90deg)}.ux .tpl[open] summary{border-bottom:1px solid var(--line);background:var(--soft)}
.ux .tpl .in{padding:14px 16px}.ux .tpl textarea{width:100%;font:inherit;font-size:14px;min-height:230px;line-height:1.5}
.ux .tpl .acts2{display:flex;gap:8px;flex-wrap:wrap}
.ux .chips code{display:inline-block;background:var(--soft);border-radius:6px;padding:1px 6px;margin:2px 2px;font-size:12.5px;color:var(--accent)}
.ux .chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:12.5px;font-weight:700;background:var(--soft);white-space:nowrap}
.ux .chip.ok{background:#e7f8ef;color:#0f7a4b}.ux .chip.bad{background:#fde8eb;color:#c42a3c}.ux .chip.v{background:#efeaff;color:#5b3fd8}.ux .chip.o{background:#fff3e0;color:#b45309}
.ux .savebar{position:sticky;bottom:0;z-index:5;display:flex;justify-content:flex-end;gap:10px;align-items:center;padding:14px 0;background:linear-gradient(180deg,rgba(246,246,251,0),var(--bg) 40%)}
.ux .sec{margin-bottom:14px}
.ux .flow.f3{grid-template-columns:repeat(3,1fr)}@media(max-width:1000px){.ux .flow.f3{grid-template-columns:1fr}}
.ux .step.alt .num{background:linear-gradient(135deg,#6a4cf5,#4aa8ff);box-shadow:0 6px 16px rgba(106,76,245,.25)}
.ux .empty2{color:var(--muted);text-align:center;padding:22px;font-size:14px}
`;

export async function renderUpsell(view, call, games, plans) {
  const d = await call('/api/admin/upsell');
  const r = d.report, c = d.cfg, ev = r.events;
  const sentAll = r.emails.reduce((s, e) => s + e.sent, 0);
  const openAll = r.emails.reduce((s, e) => s + e.opened, 0);
  const clickAll = r.emails.reduce((s, e) => s + e.clicked, 0);
  const sw = (k, label) => `<label class="sw"><input type="checkbox" name="${k}" ${c[k] ? 'checked' : ''}><i></i>${label}</label>`;
  const num = (k, label, hint = '', unit = '') => `<div class="field"><label>${label}${unit ? ` <span style="color:var(--muted);font-weight:500">(${unit})</span>` : ''}</label><input name="${k}" type="number" min="0" value="${esc(c[k])}">${hint ? `<small>${hint}</small>` : ''}</div>`;
  const txt = (k, label, hint = '', type = 'text') => `<div class="field"><label>${label}</label><input name="${k}" type="${type}" value="${type === 'password' ? '' : esc(c[k])}" ${type === 'password' ? `placeholder="${d.smtpPassSet ? '•••••••• (đã lưu)' : (d.usesBankMail ? 'Để trống = dùng mật khẩu Gmail ngân hàng' : 'Nhập mật khẩu')}"` : ''}>${hint ? `<small>${hint}</small>` : ''}</div>`;
  const single = plans.find(p => !p.allGames && p.slots === 1);
  const combo = plans.filter(p => !p.allGames && p.slots > 1).sort((a, b) => b.slots - a.slots)[0];
  const maxDay = Math.max(1, ...r.days.map(x => x.upgradeRevenue));
  const srcs = Object.entries(r.bySource).sort((a, b) => b[1].revenue - a[1].revenue);
  const maxSrc = Math.max(1, ...srcs.map(([, v]) => v.revenue));
  const f = r.first || {};
  const offs = plans.map(p => [p, p.allGames ? c.firstOffAll : p.slots > 1 ? c.firstOffCombo : c.firstOffLe]);
  const offTxt = offs.filter(([, o]) => o > 0).map(([p, o]) => `${esc(p.name)} ${money(Math.max(10000, p.price - Math.min(o, p.price)))}`).join(' · ');
  const funnel = (label, a, b, cls = '') => `<div class="r"><span>${label}</span><div class="track ${cls}"><i style="width:${b ? Math.max(2, rate(a, b)) : 0}%"></i></div><span class="n">${a}/${b}</span></div>`;

  view.innerHTML = `<style>${CSS}</style><div class="ux">
    <div class="head">
      <div><h1>📈 Bán thêm & kéo khách mua</h1><p>Popup và email tự động: mời khách cũ nâng cấp (chỉ trả tiền chênh lệch, giữ nguyên key), báo game mới, tặng ưu đãi đơn đầu cho khách đăng ký chưa mua.</p></div>
      <div class="state"><span class="dot ${c.emailsOn ? 'on' : ''}"></span>Email tự động: ${c.emailsOn ? 'Đang bật' : 'Đang tắt'}</div>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="ic">💰</div><span>Doanh thu bán thêm</span><b>${moneyFull(r.upgrades.revenue)}</b><small>${r.upgrades.orders} đơn nâng cấp / thêm game${r.pending ? ` · ${r.pending} đang chờ trả tiền` : ''}</small></div>
      <div class="kpi" style="--c:linear-gradient(90deg,#6a4cf5,#4aa8ff);--bgc:#efeaff"><div class="ic">👥</div><span>Khách đã nâng cấp</span><b>${r.upgrades.customers}<small style="font-size:16px"> / ${r.upgrades.buyers} khách</small></b><small>Tỉ lệ ${r.upgrades.buyers ? `${Math.min(100, rate(r.upgrades.customers, r.upgrades.buyers))}%` : '—'}</small></div>
      <div class="kpi" style="--c:linear-gradient(90deg,#10b981,#34d399);--bgc:#e7f8ef"><div class="ic">✉️</div><span>Email đã gửi</span><b>${sentAll}</b><small>Mở ${pct(openAll, sentAll)} · Bấm ${pct(clickAll, sentAll)}</small></div>
      <div class="kpi" style="--c:linear-gradient(90deg,#ff9f43,#ffd23f);--bgc:#fff3e0"><div class="ic">🛒</div><span>Đơn mới theo gói</span><div class="kplans">${plans.map(p => `<div><span>${esc(p.name)}</span><b>${r.byPlan[p.id] || 0}</b></div>`).join('')}</div></div>
    </div>

    <div class="card sec" style="background:linear-gradient(120deg,#f5f1ff,#fff7fb)"><h2>👋 Khách đã đăng ký nhưng chưa mua</h2><p class="sub">Ưu đãi đơn đầu tiên có hạn + email nhắc đơn chưa thanh toán</p>
      <div class="kpis" style="margin:0">
        <div class="kpi" style="--c:linear-gradient(90deg,#6a4cf5,#4aa8ff);--bgc:#efeaff"><div class="ic">🧑‍💻</div><span>Chưa mua lần nào</span><b>${f.nonBuyers || 0}</b><small>${f.withEmail || 0} khách có email nhận được</small></div>
        <div class="kpi" style="--c:linear-gradient(90deg,#ff9f43,#ffd23f);--bgc:#fff3e0"><div class="ic">🎁</div><span>Đã nhận ưu đãi đơn đầu</span><b>${f.offered || 0}</b><small>Popup: hiện ${ev.first_shown || 0} · bấm ${ev.first_click || 0}</small></div>
        <div class="kpi" style="--c:linear-gradient(90deg,#10b981,#34d399);--bgc:#e7f8ef"><div class="ic">💰</div><span>Mua nhờ ưu đãi đơn đầu</span><b>${f.orders || 0}</b><small>${moneyFull(f.revenue || 0)}</small></div>
        <div class="kpi"><div class="ic">🧾</div><span>Đơn chưa thanh toán (7 ngày)</span><b>${f.abandoned || 0}</b><small>${f.recovered || 0} đơn trả tiền sau email nhắc</small></div>
      </div></div>

    <div class="funnels">
      <div class="card"><h2>🎁 Popup lúc mua Gói Lẻ</h2><p class="sub">Khách bấm Gói Lẻ → được mời lên ${esc(combo?.name || 'Combo')}</p>
        <div class="fun">${funnel('Hiện popup', ev.checkout_shown || 0, ev.checkout_shown || 0)}${funnel('Lấy Combo', ev.checkout_accept || 0, ev.checkout_shown || 0, 'g')}${funnel('Vẫn mua lẻ', ev.checkout_decline || 0, ev.checkout_shown || 0, 'b')}</div></div>
      <div class="card"><h2>⬆️ Popup cho khách đã mua</h2><p class="sub">Hiện ở trang chủ và Tài khoản, tối đa 1 lần/ngày</p>
        <div class="fun">${funnel('Hiện popup', ev.account_shown || 0, ev.account_shown || 0)}${funnel('Bấm xem gói', ev.account_click || 0, ev.account_shown || 0, 'g')}${funnel('Đóng', ev.account_close || 0, ev.account_shown || 0, 'b')}</div></div>
      <div class="card"><h2>👋 Popup ưu đãi đơn đầu</h2><p class="sub">Khách đăng ký chưa mua, tối đa 1 lần/ngày</p>
        <div class="fun">${funnel('Hiện popup', ev.first_shown || 0, ev.first_shown || 0)}${funnel('Bấm chọn gói', ev.first_click || 0, ev.first_shown || 0, 'g')}${funnel('Đóng', ev.first_close || 0, ev.first_shown || 0, 'b')}</div></div>
    </div>

    <div class="grid2">
      <div class="card"><h2>📊 Doanh thu bán thêm 14 ngày</h2>
        <div class="chart">${r.days.map(x => `<div class="col" title="${x.day}: ${moneyFull(x.upgradeRevenue)} (${x.upgrades} đơn)">${x.upgradeRevenue ? `<span class="v">${money(x.upgradeRevenue)}</span>` : ''}<div class="bar ${x.upgradeRevenue ? '' : 'z'}" style="height:${Math.max(3, Math.round((x.upgradeRevenue / maxDay) * 100))}%"></div><span class="d">${x.day.slice(8)}/${x.day.slice(5, 7)}</span></div>`).join('')}</div>
      </div>
      <div class="card"><h2>🧭 Tiền về từ đâu</h2><p class="sub">Tất cả đơn đã trả, theo nguồn</p>
        <div class="src">${srcs.map(([k, v]) => `<div class="r"><div class="t"><span>${esc(SRC_LABEL(k))}</span><b>${moneyFull(v.revenue)} <small style="color:var(--muted);font-weight:500">· ${v.orders} đơn</small></b></div><div class="track"><i style="width:${Math.max(2, rate(v.revenue, maxSrc))}%"></i></div></div>`).join('') || '<div class="empty2">Chưa có đơn.</div>'}</div>
      </div>
    </div>

    <div class="card sec"><h2>✉️ Hiệu quả từng email</h2><p class="sub">Tỉ lệ mở là ước tính (một số hộp thư chặn ảnh). ${r.optOut} khách đã huỷ nhận email giới thiệu.</p>
      <table class="tbl"><thead><tr><th>Email</th><th>Đã gửi</th><th>Lỗi</th><th>Mở</th><th>Bấm link</th></tr></thead><tbody>
      ${r.emails.map(e => `<tr><td>${TYPE_ICON[e.type] || ''} ${esc(e.name)}</td><td><b>${e.sent}</b></td><td>${e.failed ? `<span class="chip bad">${e.failed}</span>` : '0'}</td>
        <td><div class="mini"><div class="track g"><i style="width:${rate(e.opened, e.sent)}%"></i></div>${pct(e.opened, e.sent)}</div></td>
        <td><div class="mini"><div class="track"><i style="width:${rate(e.clicked, e.sent)}%"></i></div>${pct(e.clicked, e.sent)}</div></td></tr>`).join('')}
      </tbody></table></div>

    <form id="upf">
      <div class="master">
        <div><b style="font-size:17px">📧 Gửi email tự động</b><p>Bật sau khi "Gửi thử" thấy email về. Lúc bật, khách mua từ ${c.offerAfterDays} ngày trước trở lên nhận ngay email mời nâng cấp${c.emailWelcome ? `, ${f.withEmail || 0} khách đăng ký chưa mua nhận email ưu đãi đơn đầu` : ''}; email gửi key chỉ áp dụng cho đơn mới.</p></div>
        ${sw('emailsOn', c.emailsOn ? 'Đang bật' : 'Đang tắt')}
      </div>

      <div class="card sec"><h2>🗺️ Kịch bản tự động</h2><p class="sub">Bật/tắt từng bước ngay trên thẻ.</p>
        <div class="flow">
          <div class="step"><div class="num">1</div><b>Lúc chọn Gói Lẻ</b><p>Popup "Chỉ thêm ${single && combo ? money(combo.price - single.price) : '…'} là có ${combo?.slots || 3} game".</p>${sw('popupCheckout', 'Popup')}</div>
          <div class="step"><div class="num">2</div><b>Ngay khi thanh toán</b><p>Email gửi key, link tải và hướng dẫn cài.</p>${sw('emailReceipt', 'Email')}</div>
          <div class="step"><div class="num">3</div><b>Sau ${c.offerAfterDays} ngày</b><p>Mời nâng cấp, giảm thêm ${money(c.comboOff)} Combo / ${money(c.allOff)} Trọn Bộ trong ${c.offerHours} giờ.</p>${sw('emailOffer', 'Email')} &nbsp; ${sw('popupAccount', 'Popup')}</div>
          <div class="step"><div class="num">4</div><b>Còn 12 giờ</b><p>Email nhắc ưu đãi sắp hết hạn.</p>${sw('emailReminder', 'Email')}</div>
          <div class="step"><div class="num">5</div><b>Bật "Hiện" game mới</b><p>Khách cũ thêm game vào key giá ${money(c.newGamePrice)} trong ${c.newGameDays} ngày. Khách Trọn Bộ nhận "đã có sẵn".</p>${sw('emailNewGame', 'Email')}</div>
        </div>
      </div>

      <div class="card sec"><h2>👋 Kịch bản cho khách đăng ký chưa mua</h2><p class="sub">Ưu đãi chỉ áp cho đơn đầu tiên, tự giảm giá khi khách đăng nhập và mua, không cần mã. Hiện tại: ${offTxt || 'chưa đặt mức giảm'}.</p>
        <div class="flow f3">
          <div class="step alt"><div class="num">1</div><b>Tạo đơn mà chưa trả tiền</b><p>Sau ${c.abandonedAfterHours} giờ: email nhắc kèm nút mở lại đúng đơn để quét QR.</p>${sw('emailAbandoned', 'Email')}</div>
          <div class="step alt"><div class="num">2</div><b>Đăng ký ${c.firstAfterHours} giờ chưa mua</b><p>Email + popup tặng giá đơn đầu, hạn ${c.firstHours} giờ tính từ lúc khách nhận.</p>${sw('emailWelcome', 'Email')} &nbsp; ${sw('popupFirst', 'Popup')}</div>
          <div class="step alt"><div class="num">3</div><b>Ưu đãi còn 12 giờ</b><p>Email nhắc sắp hết hạn, sau đó giá trở về bình thường.</p>${sw('emailWelcomeReminder', 'Email')}</div>
        </div>
        <div class="fg" style="margin-top:14px">
          ${num('firstOffLe', 'Đơn đầu: giảm Gói Lẻ', '', 'đ')}${num('firstOffCombo', 'Đơn đầu: giảm Gói Combo', '', 'đ')}${num('firstOffAll', 'Đơn đầu: giảm Trọn Bộ', '0 = không giảm gói đó', 'đ')}
          ${num('firstAfterHours', 'Tặng ưu đãi sau khi đăng ký', '', 'giờ')}${num('firstHours', 'Ưu đãi đơn đầu kéo dài', '', 'giờ')}${num('abandonedAfterHours', 'Nhắc đơn chưa trả sau', '', 'giờ')}
        </div>
      </div>

      <div class="card sec"><h2>🏷️ Giá ưu đãi</h2><p class="sub">Giá nâng cấp thường = giá gói mới − số tiền khách đã trả cho key đó.</p><div class="fg">
        ${num('offerAfterDays', 'Mời nâng cấp sau', 'Tính từ lúc mua', 'ngày')}${num('offerHours', 'Ưu đãi kéo dài', '', 'giờ')}
        ${num('comboOff', 'Giảm thêm khi lên Combo', '0 = không giảm', 'đ')}${num('allOff', 'Giảm thêm khi lên Trọn Bộ', 'VD 111000: 560K còn 449K', 'đ')}
        ${num('newGamePrice', 'Giá game mới cho khách cũ', '', 'đ')}${num('newGameDays', 'Giá riêng game mới trong', '', 'ngày')}
      </div></div>

      <div class="card sec"><h2>📮 Máy chủ gửi email</h2><p class="sub">Dùng <b>Gmail</b> (mật khẩu ứng dụng 16 ký tự) hoặc <b>Amazon SES</b> (ít vào spam hơn, rẻ). Để trống tên đăng nhập thì dùng luôn Gmail ngân hàng${d.bankMail ? ` (<b>${esc(d.bankMail)}</b>)` : ''}. Web gửi tối đa ${c.maxPerRun} email mỗi 2 phút.</p>
        <p style="margin:0 0 8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn ghost sm" data-preset="gmail">Điền sẵn Gmail</button><button type="button" class="btn ghost sm" data-preset="ses">Điền sẵn Amazon SES (Singapore)</button></p>
        <div class="fg">
          ${txt('smtpHost', 'Máy chủ SMTP', 'Gmail: smtp.gmail.com · SES: email-smtp.ap-southeast-1.amazonaws.com')}${num('smtpPort', 'Cổng', '465 (hoặc 587)')}
          ${txt('smtpUser', 'Tên đăng nhập SMTP', 'Gmail: địa chỉ Gmail · SES: mã AKIA… trong SMTP credentials')}${txt('smtpPass', 'Mật khẩu SMTP', 'Gmail: mật khẩu ứng dụng · SES: SMTP password', 'password')}
          ${txt('fromEmail', 'Email người gửi', 'Bắt buộc với SES, VD hotro@netxioviet.com. Để trống = tên đăng nhập (Gmail)')}${txt('fromName', 'Tên người gửi', 'Để trống = tên thương hiệu')}
          ${txt('replyTo', 'Khách trả lời về email', 'Để trống = email người bán')}
        </div>
        <p style="margin:6px 0 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center">${r.smtpReady ? '<span class="chip ok">✓ Đã có tài khoản gửi</span>' : '<span class="chip bad">Chưa có tài khoản gửi</span>'}<span class="chip">Lần chạy gần nhất: ${fmt(r.lastRun)}</span>${r.lastError ? `<span class="chip bad" title="${esc(r.lastError)}">Lỗi: ${esc(r.lastError.slice(0, 90))}</span>` : ''}</p>
      </div>

      <div class="card sec"><h2>📝 Nội dung email</h2>
        <p class="sub chips">Biến: ${['ten', 'shop', 'goi', 'key', 'game', 'so_game', 'gia_le', 'gia_combo', 'gia_tronbo', 'han', 'game_moi', 'gia_game_moi', 'han_game_moi', 'id_game_moi', 'han_dau', 'giam_max', 'gia_dau_le', 'gia_dau_combo', 'gia_dau_tronbo', 'gia_combo_goc', 'gia_tronbo_goc', 'ma_don', 'goi_don', 'game_don'].map(v => `<code>{${v}}</code>`).join('')}<br>Dòng <code>[Chữ trên nút](/duong-dan)</code> thành nút bấm. Dòng có biến trống tự ẩn (VD khách đã là Combo thì dòng {gia_combo} không hiện).</p>
        ${Object.entries(d.templates).map(([k, t]) => `<details class="tpl" data-tpl="${k}"><summary><span>${TYPE_ICON[k] || '✉️'}</span>${esc(t.name)}</summary><div class="in">
          <div class="field"><label>Tiêu đề</label><input data-f="subject" value="${esc(t.subject)}"></div>
          <div class="field"><label>Nội dung</label><textarea data-f="body">${esc(t.body)}</textarea></div>
          <div class="acts2"><button type="button" class="btn ghost sm" data-prev="${k}">👁 Xem trước</button><button type="button" class="btn ghost sm" data-test="${k}">✉️ Gửi thử</button><button type="button" class="btn ghost sm" data-reset="${k}">↺ Về mẫu gốc</button></div>
        </div></details>`).join('')}
      </div>
      <div class="savebar"><span class="note">Nhớ lưu trước khi gửi thử.</span><button class="btn">💾 Lưu cài đặt bán thêm</button></div>
    </form>

    <div class="card sec"><h2>🎉 Báo game mới</h2><p class="sub">Bật "Hiện" một game mới trong mục Game là tự báo. Muốn báo lại game đã có thì chọn ở đây.</p>
      <div class="bar" style="justify-content:flex-start;gap:8px"><select id="upGame">${games.filter(g => g.visible).map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('')}</select><button class="btn sm" id="upLaunch">Báo game mới</button><button class="btn ghost sm" id="upRun">Gửi email đang chờ ngay</button></div>
      ${r.launches.length ? `<table class="tbl"><thead><tr><th>Game</th><th>Bắt đầu</th><th>Đã báo</th></tr></thead><tbody>${r.launches.map(l => `<tr><td>${esc(l.name)}</td><td>${fmt(l.at)}</td><td><span class="chip v">${l.sent} khách</span></td></tr>`).join('')}</tbody></table>` : ''}
    </div>

    <div class="card sec"><h2>🕘 Email gần đây</h2>
      ${r.recent.length ? `<table class="tbl"><thead><tr><th>Lúc</th><th>Khách</th><th>Email</th><th>Kết quả</th></tr></thead><tbody>
      ${r.recent.map(e => `<tr><td style="white-space:nowrap">${fmt(e.sentAt)}</td><td><b>${esc(e.name)}</b><br><small class="note">${esc(e.to)}</small></td><td>${TYPE_ICON[e.type] || ''} ${esc(TYPE_LABEL[e.type] || e.type)}<br><small class="note">${esc(e.subject)}</small></td>
        <td style="white-space:nowrap">${e.status === 'sent' ? '<span class="chip ok">✓ Đã gửi</span>' : e.status === 'error' ? `<span class="chip bad" title="${esc(e.error)}">✕ Lỗi</span>` : '<span class="chip o">Đang gửi</span>'} ${e.openedAt ? '<span class="chip v">👁 Mở</span>' : ''} ${e.clickedAt ? `<span class="chip o">👆 Bấm ${e.clicks}</span>` : ''}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty2">Chưa gửi email nào.</div>'}
    </div></div>`;

  $$('.sw input[name=emailsOn]', view).forEach(i => i.addEventListener('change', () => { i.parentElement.lastChild.textContent = i.checked ? 'Đang bật' : 'Đang tắt'; }));

  const form = $('#upf', view);
  const PRESETS = { gmail: { smtpHost: 'smtp.gmail.com', smtpPort: 465, fromEmail: '' }, ses: { smtpHost: 'email-smtp.ap-southeast-1.amazonaws.com', smtpPort: 465 } };
  $$('[data-preset]', view).forEach(b => b.onclick = () => {
    for (const [k, v] of Object.entries(PRESETS[b.dataset.preset])) if (form.elements[k]) form.elements[k].value = v;
    toast(b.dataset.preset === 'ses' ? 'Đã điền máy chủ SES. Nhập tên đăng nhập, mật khẩu SMTP, email người gửi rồi bấm Lưu.' : 'Đã điền Gmail. Bấm Lưu.');
  });
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
