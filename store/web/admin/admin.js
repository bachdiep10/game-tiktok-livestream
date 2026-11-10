import { $, $$, api, esc, money, moneyFull, copy, toast } from '/js/common.js';
import { renderMarkdown } from '/js/markdown.js';
import { renderUpsell } from '/admin/upsell-admin.js';

const S = { tab: 'overview', orders: [], licenses: [], games: [], config: null, filter: {} };
const fmt = (t) => t ? new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
const view = (n) => $(`[data-view="${n}"]`);

// ---------- đăng nhập ----------
async function boot() {
  const st = await api('/api/admin/status');
  $('#loginBrand').textContent = `${st.brandName} · Quản trị`;
  $('#brand').textContent = st.brandName;
  if (st.loggedIn) return start();
  $('#login').hidden = false;
  if (st.needsSetup) {
    $('#loginTitle').textContent = 'Tạo mật khẩu quản trị';
    $('#loginNote').textContent = 'Lần đầu sử dụng: đặt mật khẩu (ít nhất 8 ký tự). Hãy ghi nhớ mật khẩu này.';
    $('#pw2Wrap').hidden = false; $('#pw').autocomplete = 'new-password';
    $('#loginBtn').textContent = 'Tạo mật khẩu';
  }
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    $('#loginErr').textContent = '';
    try {
      if (st.needsSetup) {
        if ($('#pw').value !== $('#pw2').value) throw new Error('Hai mật khẩu không khớp.');
        await api('/api/admin/setup', { password: $('#pw').value });
      } else await api('/api/admin/login', { password: $('#pw').value });
      $('#login').hidden = true;
      start();
    } catch (err) { $('#loginErr').textContent = err.message; }
  };
}

async function call(url, body, method) {
  try { return await api(url, body, method); } catch (e) {
    if (/đăng nhập/.test(e.message)) location.reload();
    toast(e.message); throw e;
  }
}

function start() {
  $('#app').hidden = false;
  $$('#tabs a').forEach(a => a.onclick = () => go(a.dataset.tab));
  $('#logout').onclick = async () => { await api('/api/admin/logout', {}); location.reload(); };
  go(location.hash.slice(1) || 'overview');
  setInterval(() => { if (S.tab === 'orders' || S.tab === 'overview' || S.tab === 'bank') refresh(true); }, 20000);
}

function go(tab) {
  if (!view(tab)) tab = 'overview';
  S.tab = tab;
  history.replaceState(null, '', `#${tab}`);
  $$('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  $$('[data-view]').forEach(v => { v.hidden = v.dataset.view !== tab; });
  refresh();
}

async function refresh(silent) {
  const t = S.tab;
  if (t === 'overview') await renderOverview();
  if (t === 'orders') { S.orders = (await call('/api/admin/orders')).orders; renderOrders(); }
  if (t === 'bank') { S.bank = await call('/api/admin/bank'); renderBank(); }
  if (t === 'licenses') { await loadGamesConfig(); S.licenses = (await call('/api/admin/licenses')).licenses; renderLicenses(); }
  if (t === 'games') { await loadGamesConfig(); renderGames(); }
  if (t === 'posts') { S.posts = (await call('/api/admin/posts')).posts; renderPosts(); }
  if (t === 'users') { S.users = (await call('/api/admin/users')).users; renderUsers(); }
  if (t === 'plans') { await loadGamesConfig(); renderPlans(); }
  if (t === 'settings') { await loadGamesConfig(); renderSettings(); }
  if (t === 'upsell' && !silent) { await loadGamesConfig(); await renderUpsell(view('upsell'), call, S.games, S.config.plans); }
}

async function loadGamesConfig() {
  const [g, c] = await Promise.all([call('/api/admin/games'), call('/api/admin/config')]);
  S.games = g.games; S.config = c;
}

// ---------- dialog ----------
function dialog(html, onMount) {
  $('#dlgBody').innerHTML = html;
  $('#dlg').classList.add('open');
  onMount?.($('#dlgBody'));
}
function closeDialog() { $('#dlg').classList.remove('open'); }
$('#dlg').addEventListener('click', e => { if (e.target.id === 'dlg' || e.target.hasAttribute('data-close')) closeDialog(); });

// ---------- tổng quan ----------
async function renderOverview() {
  const o = await call('/api/admin/overview');
  const orders = (await call('/api/admin/orders')).orders;
  S.orders = orders;
  updatePill();
  const warn = !o.payment.payos && !o.payment.bank
    ? `<div class="box-s" style="border-color:rgba(255,181,71,.5)"><h2>⚠️ Chưa cài thanh toán</h2><p class="note">Khách chưa mua được. Vào <a href="#settings" data-go="settings">Cài đặt</a> để nhập PayOS (tự xác nhận tiền) hoặc tài khoản ngân hàng (bạn tự xác nhận).</p></div>`
    : !o.payment.payos && !o.payment.email ? `<div class="box-s"><h2>💡 Đang dùng chuyển khoản thủ công</h2><p class="note">Bạn cần tự bấm "Đã nhận tiền" cho từng đơn. Bật đọc email ngân hàng ACB hoặc cài PayOS trong <a href="#settings" data-go="settings">Cài đặt</a> để hệ thống tự gửi key khi khách trả tiền.</p></div>` : '';
  view('overview').innerHTML = `
    <h1>Tổng quan</h1>
    ${warn}
    <div class="cards">
      <div class="stat"><span>Doanh thu hôm nay</span><b>${moneyFull(o.revenue.today)}</b></div>
      <div class="stat"><span>Doanh thu tháng này</span><b>${moneyFull(o.revenue.month)}</b></div>
      <div class="stat"><span>Tổng doanh thu</span><b>${moneyFull(o.revenue.total)}</b></div>
      <div class="stat"><span>Đơn đã thanh toán</span><b>${o.orders.paid}</b></div>
      <div class="stat"><span>Đơn chờ thanh toán</span><b>${o.orders.pending}${o.orders.claimed ? ` <small style="font-size:14px;color:var(--warn)">(${o.orders.claimed} báo đã CK)</small>` : ''}</b></div>
      <div class="stat"><span>Key đang dùng / tổng</span><b>${o.licenses.active} / ${o.licenses.total}</b></div>
    </div>
    <div class="bar"><h1 style="font-size:19px">Đơn gần đây</h1><button class="btn ghost sm" data-go="orders">Xem tất cả</button></div>
    ${ordersTable(orders.slice(0, 8))}`;
}

function updatePill() {
  const n = S.orders.filter(o => o.status === 'pending' && o.claimedAt).length;
  $('#pendingPill').hidden = !n; $('#pendingPill').textContent = n;
}

// ---------- đơn hàng ----------
function orderStatus(o) {
  if (o.status === 'pending' && o.claimedAt) return '<span class="tag-s claimed">Khách báo đã CK</span>';
  return `<span class="tag-s ${o.status}">${{ paid: 'Đã thanh toán', pending: 'Chờ thanh toán', cancelled: 'Đã huỷ' }[o.status]}</span>`;
}
function ordersTable(list) {
  if (!list.length) return '<div class="tbl-wrap"><div class="empty">Chưa có đơn hàng nào.</div></div>';
  return `<div class="tbl-wrap"><table>
    <thead><tr><th>Mã đơn</th><th>Khách</th><th>Gói</th><th>Số tiền</th><th>Trạng thái</th><th>Key</th><th></th></tr></thead>
    <tbody>${list.map(o => `<tr>
      <td><b>#${o.code}</b><div class="sub">${fmt(o.createdAt)}</div><div class="sub">ND: ${esc(o.transferContent)}</div></td>
      <td>${esc(o.customer.name)}<div class="sub">${esc(o.customer.phone)}</div><div class="sub">${esc(o.customer.email)}</div></td>
      <td>${esc(o.planName)}<div class="sub">${o.gameNames.map(esc).join(', ')}</div></td>
      <td><b>${moneyFull(o.amount)}</b>${o.paidVia ? `<div class="sub">qua ${esc(o.paidVia)}</div>` : ''}</td>
      <td>${orderStatus(o)}${o.paidAt ? `<div class="sub">${fmt(o.paidAt)}</div>` : ''}</td>
      <td>${o.licenseKey ? `<code>${esc(o.licenseKey)}</code>` : '—'}</td>
      <td><div class="acts">
        ${o.status !== 'paid' ? `<button class="ok" data-act="pay" data-code="${o.code}">✓ Đã nhận tiền</button>` : ''}
        ${o.status === 'pending' ? `<button class="bad" data-act="cancel" data-code="${o.code}">Huỷ</button>` : ''}
        <button data-act="link" data-link="${esc(o.link)}">🔗 Link đơn</button>
      </div></td></tr>`).join('')}</tbody></table></div>`;
}
function renderOrders() {
  updatePill();
  const f = S.filter.orders || { q: '', st: '' };
  const q = f.q.toLowerCase();
  const list = S.orders.filter(o => (!f.st || (f.st === 'claimed' ? o.status === 'pending' && o.claimedAt : o.status === f.st))
    && (!q || [o.code, o.customer.name, o.customer.phone, o.customer.email, o.licenseKey, o.transferContent].join(' ').toLowerCase().includes(q)));
  view('orders').innerHTML = `
    <div class="bar"><h1>Đơn hàng</h1>
      <input id="oq" placeholder="Tìm mã đơn, tên, SĐT, key…" value="${esc(f.q)}">
      <select id="ost">
        <option value="">Tất cả</option><option value="claimed">Khách báo đã CK</option>
        <option value="pending">Chờ thanh toán</option><option value="paid">Đã thanh toán</option><option value="cancelled">Đã huỷ</option>
      </select></div>
    ${ordersTable(list)}`;
  $('#ost').value = f.st;
  $('#oq').oninput = (e) => { S.filter.orders = { ...f, q: e.target.value }; renderOrdersKeepFocus(); };
  $('#ost').onchange = (e) => { S.filter.orders = { ...f, st: e.target.value }; renderOrders(); };
}
function renderOrdersKeepFocus() { const pos = $('#oq').selectionStart; renderOrders(); const i = $('#oq'); i.focus(); i.setSelectionRange(pos, pos); }

// ---------- license ----------
function renderLicenses() {
  const q = (S.filter.lic || '').toLowerCase();
  const list = S.licenses.filter(l => !q || [l.key, l.customer?.name, l.customer?.phone, l.machineName, l.orderCode, l.note].join(' ').toLowerCase().includes(q));
  view('licenses').innerHTML = `
    <div class="bar"><h1>License key</h1>
      <input id="lq" placeholder="Tìm key, tên, SĐT, máy…" value="${esc(S.filter.lic || '')}">
      <button class="btn sm" id="newKey">＋ Tạo key</button></div>
    ${list.length ? `<div class="tbl-wrap"><table>
      <thead><tr><th>Key</th><th>Gói / game</th><th>Khách</th><th>Máy đang dùng</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody>${list.map(l => `<tr>
        <td><code>${esc(l.key)}</code> <a href="#" data-copy="${esc(l.key)}">📋</a><div class="sub">${fmt(l.createdAt)}${l.orderCode ? ` · đơn #${l.orderCode}` : ''}</div>${l.note ? `<div class="sub">📝 ${esc(l.note)}</div>` : ''}</td>
        <td>${esc(l.planName)}<div class="sub">${l.allGames ? 'Tất cả game' : l.gameNames.map(esc).join(', ')}${!l.allGames && l.slots > l.games.length ? ` · còn ${l.slots - l.games.length} suất` : ''}</div></td>
        <td>${esc(l.customer?.name || '—')}<div class="sub">${esc(l.customer?.phone || '')}</div><div class="sub">${l.owner ? `👤 TK: ${esc(l.owner)}` : '<i>chưa gắn tài khoản</i>'}</div></td>
        <td>${l.machineId ? `${esc(l.machineName || 'Không tên')}<div class="sub">mã ${esc(l.machineId)} · ${fmt(l.lastSeen)}</div>` : '<span class="sub">Chưa gắn máy</span>'}
            <div class="sub">Đã chuyển máy ${l.movesRecent} lần / ${S.config.settings.moveWindowDays} ngày</div></td>
        <td><span class="tag-s ${l.status}">${l.status === 'active' ? 'Hoạt động' : 'Đã khoá'}</span></td>
        <td><div class="acts">
          ${l.machineId ? `<button data-act="reset" data-key="${esc(l.key)}" title="Gỡ key khỏi máy đang dùng để khách kích hoạt máy khác">Reset máy</button>` : ''}
          <button data-act="reissue" data-key="${esc(l.key)}" title="Tạo key mới thay key cũ (khi khách làm lộ key)">Đổi key mới</button>
          ${l.status === 'active' ? `<button class="bad" data-act="lock" data-key="${esc(l.key)}">Khoá</button>` : `<button class="ok" data-act="unlock" data-key="${esc(l.key)}">Mở khoá</button>`}
          <button data-act="editKey" data-key="${esc(l.key)}">Sửa</button>
          <button data-act="owner" data-key="${esc(l.key)}">Gắn TK</button>
          <button class="bad" data-act="delKey" data-key="${esc(l.key)}">Xoá</button>
        </div></td></tr>`).join('')}</tbody></table></div>` : '<div class="tbl-wrap"><div class="empty">Chưa có key nào.</div></div>'}`;
  $('#lq').oninput = (e) => { S.filter.lic = e.target.value; const p = e.target.selectionStart; renderLicenses(); const i = $('#lq'); i.focus(); i.setSelectionRange(p, p); };
  $('#newKey').onclick = () => keyDialog();
}

function gameChecks(selected, name = 'g') {
  return `<div class="pick">${S.games.map(g => `<label><input type="checkbox" name="${name}" value="${esc(g.id)}" ${selected.includes(g.id) ? 'checked' : ''}><img src="${esc(g.image)}" alt=""><span>${esc(g.name)}${g.visible ? '' : ' <small class="note">(đang ẩn)</small>'}</span></label>`).join('')}</div>`;
}

function keyDialog(lic) {
  const plans = S.config.plans;
  const edit = Boolean(lic);
  const cur = lic || { planId: plans[0].id, games: [], customer: {}, note: '' };
  dialog(`
    <h3>${edit ? `Sửa key <code style="color:var(--brand-2)">${esc(lic.key)}</code>` : 'Tạo key thủ công'}</h3>
    <p class="msub">${edit ? 'Đổi gói, game, thông tin khách.' : 'Dùng khi bán qua Zalo, tặng key, hoặc đền bù cho khách.'}</p>
    <form id="kf">
      <div class="form-grid">
        <div class="field"><label>Gói</label><select name="planId">${plans.map(p => `<option value="${p.id}" ${p.id === cur.planId ? 'selected' : ''}>${esc(p.name)} (${money(p.price)})</option>`).join('')}</select></div>
        ${edit ? '<div></div>' : '<div class="field"><label>Số lượng key</label><input name="count" type="number" min="1" max="100" value="1"></div>'}
        <div class="field full" id="kGames"><label>Game</label>${gameChecks(cur.games)}<small>Gói Trọn Bộ không cần chọn. Gói còn thiếu suất sẽ tự nhận game mới.</small></div>
        <div class="field"><label>Tên khách</label><input name="name" value="${esc(cur.customer?.name || '')}"></div>
        <div class="field"><label>SĐT / Zalo</label><input name="phone" value="${esc(cur.customer?.phone || '')}"><small>Khách cần SĐT này để tự chuyển máy.</small></div>
        <div class="field full"><label>Ghi chú</label><input name="note" value="${esc(cur.note || '')}"></div>
      </div>
      <button class="btn block">${edit ? 'Lưu' : 'Tạo key'}</button>
    </form>`, (el) => {
    const sel = $('select[name=planId]', el);
    const sync = () => { const p = plans.find(x => x.id === sel.value); $('#kGames', el).style.display = p.allGames ? 'none' : ''; };
    sel.onchange = sync; sync();
    $('#kf', el).onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const p = plans.find(x => x.id === fd.get('planId'));
      const games = fd.getAll('g');
      if (!p.allGames && games.length > p.slots) return toast(`${p.name} chỉ có ${p.slots} game.`);
      if (edit) {
        await call(`/api/admin/licenses/${encodeURIComponent(lic.key)}`, {
          planId: p.id, games, note: fd.get('note'), customer: { name: fd.get('name'), phone: fd.get('phone'), email: lic.customer?.email || '' },
        }, 'PATCH');
        closeDialog(); toast('Đã lưu'); refresh();
      } else {
        const r = await call('/api/admin/licenses', { planId: p.id, games, count: fd.get('count'), name: fd.get('name'), phone: fd.get('phone'), note: fd.get('note') });
        dialog(`<h3>Đã tạo ${r.keys.length} key</h3><p class="msub">Gửi key này cho khách.</p>
          <pre class="pub" style="font-size:15px;color:var(--brand-2)">${r.keys.map(esc).join('\n')}</pre>
          <button class="btn block" data-copy="${esc(r.keys.join('\n'))}">Sao chép tất cả</button>`);
        refresh();
      }
    };
  });
}

// ---------- khách hàng ----------
function renderUsers() {
  const q = (S.filter.users || '').toLowerCase();
  const list = S.users.filter(u => !q || [u.name, u.phone, u.email, ...u.keys].join(' ').toLowerCase().includes(q));
  view('users').innerHTML = `
    <div class="bar"><h1>Khách hàng</h1><input id="uq" placeholder="Tìm tên, SĐT, email, key…" value="${esc(S.filter.users || '')}"></div>
    <p class="note" style="margin-top:-6px">Khách tự đăng ký trên web. Khách quên mật khẩu thì bấm "Cấp mật khẩu mới" rồi gửi qua Zalo.</p>
    ${list.length ? `<div class="tbl-wrap"><table>
      <thead><tr><th>Khách</th><th>Đăng ký</th><th>Đơn</th><th>Đã mua</th><th>Key</th><th></th></tr></thead>
      <tbody>${list.map(u => `<tr>
        <td><b>${esc(u.name)}</b><div class="sub">${esc(u.phone)}</div><div class="sub">${esc(u.email || '')}</div></td>
        <td>${fmt(u.createdAt)}<div class="sub">Đăng nhập: ${fmt(u.lastLogin)}</div></td>
        <td>${u.orders}</td><td><b>${moneyFull(u.paid)}</b></td>
        <td>${u.keys.map(k => `<div><code>${esc(k)}</code></div>`).join('') || '—'}</td>
        <td><div class="acts"><button data-act="resetPw" data-id="${esc(u.id)}" data-name="${esc(u.name)}">Cấp mật khẩu mới</button></div></td>
      </tr>`).join('')}</tbody></table></div>` : '<div class="tbl-wrap"><div class="empty">Chưa có khách đăng ký.</div></div>'}`;
  $('#uq').oninput = (e) => { S.filter.users = e.target.value; const p = e.target.selectionStart; renderUsers(); const i = $('#uq'); i.focus(); i.setSelectionRange(p, p); };
}

// ---------- game ----------
function renderGames() {
  const g = [...S.games].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  view('games').innerHTML = `
    <div class="bar"><h1>Game</h1><button class="btn sm" id="newGame">＋ Thêm game mới</button></div>
    <p class="note" style="margin-top:-6px">Khi thêm game mới (đang hiện), các key Gói Combo còn thiếu suất sẽ tự nhận game đó. Gói Trọn Bộ luôn có mọi game.</p>
    ${g.map(x => `<div class="game-row">
      <img src="${esc(x.image)}" alt="">
      <div><h3>${esc(x.name)} ${x.isNew ? '<span class="tag-s claimed">MỚI</span>' : ''} ${x.visible ? '' : '<span class="tag-s locked">Đang ẩn</span>'}</h3>
        <div class="note">${esc(x.tagline)}</div>
        <div class="note" style="font-size:12.5px">Mã: <code>${esc(x.id)}</code> · Thứ tự ${x.order} · ${x.file ? `✓ file ${esc(x.file.name)} (${(x.file.size / 1048576).toFixed(1)} MB)` : x.download ? '✓ có link tải ngoài' : '⚠️ chưa có file game'} · bản ${esc(x.version || '?')} · ${x.video ? '✓ có video' : 'chưa có video'}</div></div>
      <div class="acts"><button data-act="editGame" data-id="${esc(x.id)}">Sửa</button>
        <button data-act="toggleGame" data-id="${esc(x.id)}">${x.visible ? 'Ẩn' : 'Hiện'}</button>
        <button class="bad" data-act="delGame" data-id="${esc(x.id)}">Xoá</button></div>
    </div>`).join('') || '<div class="empty">Chưa có game.</div>'}`;
  $('#newGame').onclick = () => gameDialog();
}

function uploader(name, label, value, accept, hint) {
  const isVid = accept.includes('video');
  return `<div class="field full"><label>${label}</label>
    <div class="upl"><input type="text" name="${name}" value="${esc(value || '')}" placeholder="Dán link, hoặc bấm Tải lên">
      <label class="btn ghost sm">Tải lên<input type="file" accept="${accept}" data-up="${name}" hidden></label></div>
    ${hint ? `<small>${hint}</small>` : ''}
    <div data-prev="${name}">${value ? (isVid ? `<video class="prev" src="${esc(value)}" muted controls></video>` : `<img class="prev" src="${esc(value)}" alt="">`) : ''}</div></div>`;
}

function gameDialog(g) {
  const edit = Boolean(g);
  const cur = g || { name: '', tagline: '', description: '', features: [], image: '', video: '', download: '', visible: true, isNew: true, order: S.games.length + 1 };
  dialog(`
    <h3>${edit ? 'Sửa game' : 'Thêm game mới'}</h3>
    <p class="msub">Thông tin hiện trên trang bán hàng.</p>
    <form id="gf">
      <div class="form-grid">
        <div class="field"><label>Tên game</label><input name="name" required value="${esc(cur.name)}"></div>
        <div class="field"><label>Mã game</label><input name="id" value="${esc(cur.id || '')}" ${edit ? 'disabled' : ''} placeholder="tự tạo từ tên"><small>Game trên máy khách dùng mã này để kiểm tra key.</small></div>
        <div class="field full"><label>Mô tả ngắn (1 dòng)</label><input name="tagline" value="${esc(cur.tagline)}"></div>
        <div class="field full"><label>Mô tả chi tiết</label><textarea name="description" rows="3">${esc(cur.description)}</textarea></div>
        <div class="field full"><label>Điểm nổi bật (mỗi dòng 1 ý)</label><textarea name="features" rows="4">${esc((cur.features || []).join('\n'))}</textarea></div>
        ${uploader('image', 'Ảnh bìa (dọc 3:4 hoặc 9:16)', cur.image, 'image/*')}
        ${uploader('video', 'Video demo (mp4 dọc, dưới 30 giây là đẹp)', cur.video, 'video/mp4,video/webm', 'Video lớn nên nén trước, hoặc dán link mp4.')}
        <div class="field full"><label>File game cho khách tải (.zip)</label>
          ${edit ? `<div class="upl"><span class="note" style="flex:1" id="fileInfo">${cur.file ? `✓ ${esc(cur.file.name)} · ${(cur.file.size / 1048576).toFixed(1)} MB · ${fmt(cur.file.uploadedAt)}` : 'Chưa có file'}</span>
            <label class="btn ghost sm">Tải file lên<input type="file" accept=".zip,.exe,.rar,.7z" id="gameFile" hidden></label></div>
            <small>File được giữ kín: chỉ khách có key của game này mới tải được, qua nút "Tải về" trong tài khoản.</small>`
          : '<small>Lưu game trước, sau đó bấm Sửa để tải file game lên.</small>'}</div>
        <div class="field"><label>Phiên bản</label><input name="version" value="${esc(cur.version || '')}" placeholder="1.0"></div>
        <div class="field"><label>Hoặc link tải ngoài (dự phòng)</label><input name="download" value="${esc(cur.download)}" placeholder="https://drive.google.com/..."></div>
        <div class="field full"><label>Hướng dẫn cài riêng cho game này (mỗi bước 1 dòng, bắt đầu bằng 1. 2. 3.)</label><textarea name="guide" rows="8">${esc(cur.guide || '')}</textarea><small>Hiện cho khách cạnh nút Tải về.</small></div>
        <div class="field full"><label>Video hướng dẫn (không bắt buộc)</label><input name="guideVideo" value="${esc(cur.guideVideo || '')}" placeholder="https://youtube.com/..."></div>
        <div class="field"><label>Thứ tự hiển thị</label><input name="order" type="number" value="${cur.order ?? 0}"></div>
        <div class="field"><label>&nbsp;</label>
          <label class="chk"><input type="checkbox" name="visible" ${cur.visible ? 'checked' : ''}> Hiện trên web</label>
          <label class="chk"><input type="checkbox" name="isNew" ${cur.isNew ? 'checked' : ''}> Gắn nhãn MỚI</label></div>
      </div>
      <button class="btn block">${edit ? 'Lưu' : 'Thêm game'}</button>
    </form>`, (el) => {
    $$('[data-up]', el).forEach(inp => inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      const field = inp.dataset.up;
      toast('Đang tải lên…');
      const res = await fetch(`/api/admin/upload?name=${encodeURIComponent(f.name)}`, { method: 'POST', body: f });
      const j = await res.json();
      if (!j.ok) return toast(j.error);
      $(`input[name=${field}]`, el).value = j.url;
      $(`[data-prev=${field}]`, el).innerHTML = field === 'video' ? `<video class="prev" src="${j.url}" muted controls></video>` : `<img class="prev" src="${j.url}" alt="">`;
      toast('Đã tải lên');
    });
    $('#gameFile', el)?.addEventListener('change', async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      $('#fileInfo', el).textContent = `Đang tải lên ${f.name}…`;
      const res = await fetch(`/api/admin/games/${encodeURIComponent(g.id)}/file?name=${encodeURIComponent(f.name)}`, { method: 'POST', body: f });
      const j = await res.json().catch(() => ({ ok: false, error: 'Lỗi tải lên (file quá lớn?)' }));
      if (!j.ok) { $('#fileInfo', el).textContent = j.error; return toast(j.error); }
      $('#fileInfo', el).textContent = `✓ ${j.file.name} · ${(j.file.size / 1048576).toFixed(1)} MB`;
      toast('Đã tải file game lên'); g.file = j.file;
    });
    $('#gf', el).onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {
        name: fd.get('name'), tagline: fd.get('tagline'), description: fd.get('description'),
        features: String(fd.get('features')).split('\n').map(s => s.trim()).filter(Boolean),
        image: fd.get('image'), video: fd.get('video'), download: fd.get('download'),
        version: fd.get('version'), guide: fd.get('guide'), guideVideo: fd.get('guideVideo'),
        order: fd.get('order'), visible: fd.get('visible') === 'on', isNew: fd.get('isNew') === 'on',
      };
      let r;
      if (edit) r = await call(`/api/admin/games/${encodeURIComponent(g.id)}`, body, 'PATCH');
      else r = await call('/api/admin/games', { ...body, id: fd.get('id') });
      closeDialog();
      toast(r.filledCombo ? `Đã lưu. ${r.filledCombo} key Combo được nhận game này.` : 'Đã lưu');
      refresh();
    };
  });
}

// ---------- tin tức ----------
const postState = (p) => p.status !== 'published' ? '<span class="tag-s locked">Nháp</span>'
  : p.publishedAt > Date.now() ? `<span class="tag-s">Hẹn ${fmt(p.publishedAt)}</span>` : '<span class="tag-s claimed">Đang hiện</span>';

function renderPosts() {
  const list = S.posts || [];
  view('posts').innerHTML = `
    <div class="bar"><h1>Tin tức</h1><button class="btn sm" id="newPost">＋ Viết bài mới</button></div>
    <p class="note" style="margin-top:-6px">Bài đã đăng hiện ở <a href="/tin-tuc" target="_blank">/tin-tuc</a>, 3 bài mới nhất hiện trên trang chủ và được đưa vào sitemap cho Google.</p>
    ${list.length ? `<div class="tbl-wrap"><table><thead><tr><th>Bài viết</th><th>Trạng thái</th><th>Ngày đăng</th><th></th></tr></thead><tbody>
      ${list.map(p => `<tr>
        <td><b>${esc(p.title)}</b><br><small class="note">/tin-tuc/${esc(p.slug)}</small></td>
        <td>${postState(p)}</td>
        <td>${p.publishedAt ? fmt(p.publishedAt) : '—'}</td>
        <td><div class="acts">
          ${p.status === 'published' ? `<a class="btn ghost sm" href="${esc(p.url)}" target="_blank">Xem</a>` : ''}
          <button data-act="editPost" data-id="${esc(p.id)}">Sửa</button>
          <button data-act="togglePost" data-id="${esc(p.id)}">${p.status === 'published' ? 'Ẩn' : 'Đăng'}</button>
          <button class="bad" data-act="delPost" data-id="${esc(p.id)}">Xoá</button>
        </div></td></tr>`).join('')}</tbody></table></div>` : '<div class="tbl-wrap"><div class="empty">Chưa có bài viết. Bấm "Viết bài mới" để bắt đầu.</div></div>'}`;
  $('#newPost').onclick = () => postDialog();
  $$('[data-act]', view('posts')).forEach(b => b.onclick = async () => {
    const p = S.posts.find(x => x.id === b.dataset.id);
    if (b.dataset.act === 'editPost') return postDialog(p);
    if (b.dataset.act === 'togglePost') {
      await call(`/api/admin/posts/${p.id}`, { status: p.status === 'published' ? 'draft' : 'published' }, 'PATCH');
      toast(p.status === 'published' ? 'Đã ẩn bài' : 'Đã đăng bài'); return refresh();
    }
    if (b.dataset.act === 'delPost') {
      if (!confirm(`Xoá hẳn bài "${p.title}"? Không khôi phục được.`)) return;
      await call(`/api/admin/posts/${p.id}`, undefined, 'DELETE'); toast('Đã xoá'); refresh();
    }
  });
}

const localDT = (t) => { if (!t) return ''; const d = new Date(t - new Date(t).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };

async function uploadFile(f) {
  toast('Đang tải ảnh lên…');
  const res = await fetch(`/api/admin/upload?name=${encodeURIComponent(f.name)}`, { method: 'POST', body: f });
  const j = await res.json().catch(() => ({ ok: false, error: 'Lỗi tải lên' }));
  if (!j.ok) { toast(j.error); throw new Error(j.error); }
  toast('Đã tải lên');
  return j.url;
}

function postDialog(p) {
  const edit = Boolean(p);
  const cur = p || { title: '', slug: '', excerpt: '', cover: '', content: '', seoTitle: '', seoDescription: '', status: 'draft', publishedAt: 0 };
  dialog(`
    <h3>${edit ? 'Sửa bài viết' : 'Viết bài mới'}</h3>
    <form id="pf">
      <div class="form-grid">
        <div class="field full"><label>Tiêu đề</label><input name="title" required maxlength="200" value="${esc(cur.title)}"></div>
        <div class="field full"><label>Nội dung</label>
          <div class="md-bar">
            <button type="button" data-md="h2" title="Tiêu đề lớn">H2</button><button type="button" data-md="h3" title="Tiêu đề nhỏ">H3</button>
            <button type="button" data-md="b" title="Chữ đậm"><b>B</b></button><button type="button" data-md="i" title="Chữ nghiêng"><i>I</i></button>
            <button type="button" data-md="ul" title="Danh sách">• Danh sách</button><button type="button" data-md="ol" title="Danh sách số">1. Danh sách</button>
            <button type="button" data-md="quote" title="Trích dẫn">❝</button><button type="button" data-md="link" title="Chèn link">🔗 Link</button>
            <label class="mdb" title="Chèn ảnh">🖼 Ảnh<input type="file" accept="image/*" id="mdImg" hidden></label>
            <button type="button" data-md="yt" title="Chèn video YouTube">▶ YouTube</button>
            <span class="grow"></span><button type="button" id="mdPrevBtn">👁 Xem trước</button>
          </div>
          <textarea name="content" id="mdText" rows="16" placeholder="Viết nội dung ở đây. Bôi đen chữ rồi bấm nút trên thanh công cụ để định dạng.">${esc(cur.content)}</textarea>
          <div class="post-body md-prev" id="mdPrev" hidden></div>
          <small>Mẹo: dòng bắt đầu bằng <code>## </code> là tiêu đề, <code>- </code> là danh sách, <code>**chữ**</code> là in đậm. Dán link YouTube thành 1 dòng riêng để chèn video.</small></div>
        ${uploader('cover', 'Ảnh bìa (ngang 16:9, VD 1200×675)', cur.cover, 'image/*', 'Để trống thì dùng ảnh đầu tiên trong bài.')}
        <div class="field full"><label>Tóm tắt (hiện ở danh sách bài và trên Google)</label><textarea name="excerpt" rows="2" maxlength="400">${esc(cur.excerpt)}</textarea><small>Để trống thì tự lấy đoạn đầu của bài.</small></div>
        <div class="field"><label>Ngày giờ đăng</label><input name="publishedAt" type="datetime-local" value="${localDT(cur.publishedAt)}"><small>Để trống = lúc bấm Đăng. Chọn ngày sau = hẹn giờ đăng.</small></div>
        <details class="field full"><summary class="note" style="cursor:pointer">Đường dẫn & SEO (không bắt buộc)</summary>
          <div class="form-grid" style="margin-top:10px">
            <div class="field full"><label>Đường dẫn</label><input name="slug" value="${esc(cur.slug)}" placeholder="tự tạo từ tiêu đề"><small>Địa chỉ bài: /tin-tuc/<b id="slugPrev">${esc(cur.slug || '…')}</b></small></div>
            <div class="field full"><label>Tiêu đề trên Google</label><input name="seoTitle" maxlength="120" value="${esc(cur.seoTitle)}" placeholder="mặc định = tiêu đề bài"></div>
            <div class="field full"><label>Mô tả trên Google</label><textarea name="seoDescription" rows="2" maxlength="300" placeholder="mặc định = tóm tắt">${esc(cur.seoDescription)}</textarea></div>
          </div></details>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn ghost" type="submit" data-st="draft" style="flex:1">Lưu nháp</button>
        <button class="btn" type="submit" data-st="published" style="flex:1">${cur.status === 'published' ? 'Lưu & cập nhật' : 'Đăng bài'}</button>
      </div>
    </form>`, (el) => {
    $('#dlg .box').style.width = 'min(900px,100%)';
    const ta = $('#mdText', el);
    const wrap = (before, after = before, ph = 'chữ') => {
      const { selectionStart: a, selectionEnd: b, value: v } = ta;
      const sel = v.slice(a, b) || ph;
      ta.setRangeText(before + sel + after, a, b, 'end');
      ta.focus(); ta.setSelectionRange(a + before.length, a + before.length + sel.length);
    };
    const linePrefix = (pre) => {
      const { selectionStart: a, selectionEnd: b, value: v } = ta;
      const start = v.lastIndexOf('\n', a - 1) + 1;
      const block = v.slice(start, b) || 'nội dung';
      const lines = block.split('\n').map((l, i) => (typeof pre === 'function' ? pre(i) : pre) + l.replace(/^(#{2,4}\s+|[-*+]\s+|\d+[.)]\s+|>\s?)/, ''));
      ta.setRangeText(lines.join('\n'), start, b, 'end'); ta.focus();
    };
    const insertBlock = (text) => {
      const a = ta.selectionStart, v = ta.value;
      const pre = a && v[a - 1] !== '\n' ? '\n\n' : '';
      ta.setRangeText(`${pre}${text}\n`, a, ta.selectionEnd, 'end'); ta.focus();
    };
    $$('[data-md]', el).forEach(b => b.onclick = () => {
      const k = b.dataset.md;
      if (k === 'b') wrap('**');
      if (k === 'i') wrap('*');
      if (k === 'h2') linePrefix('## ');
      if (k === 'h3') linePrefix('### ');
      if (k === 'ul') linePrefix('- ');
      if (k === 'ol') linePrefix(i => `${i + 1}. `);
      if (k === 'quote') linePrefix('> ');
      if (k === 'link') { const u = prompt('Dán đường link (https://...)'); if (u) wrap('[', `](${u.trim()})`, 'chữ hiện ra'); }
      if (k === 'yt') { const u = prompt('Dán link video YouTube'); if (u) insertBlock(u.trim()); }
      if (!$('#mdPrev', el).hidden) $('#mdPrev', el).innerHTML = renderMarkdown(ta.value);
    });
    $('#mdImg', el).onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const url = await uploadFile(f);
      insertBlock(`![${f.name.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '')}](${url})`);
      e.target.value = '';
    };
    $('#mdPrevBtn', el).onclick = () => {
      const pv = $('#mdPrev', el), show = pv.hidden;
      pv.hidden = !show; ta.hidden = show;
      pv.innerHTML = show ? renderMarkdown(ta.value) || '<p class="note">Chưa có nội dung.</p>' : '';
      $('#mdPrevBtn', el).textContent = show ? '✏️ Viết tiếp' : '👁 Xem trước';
    };
    $('[data-up=cover]', el).onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const url = await uploadFile(f);
      $('input[name=cover]', el).value = url;
      $('[data-prev=cover]', el).innerHTML = `<img class="prev" src="${url}" alt="">`;
    };
    const slugIn = $('input[name=slug]', el);
    $('input[name=title]', el).oninput = (e) => { if (!edit && !slugIn.dataset.touched) $('#slugPrev', el).textContent = 'tự tạo từ tiêu đề'; };
    slugIn.oninput = () => { slugIn.dataset.touched = 1; $('#slugPrev', el).textContent = slugIn.value || 'tự tạo từ tiêu đề'; };
    let status = cur.status;
    $$('button[data-st]', el).forEach(b => b.onclick = () => { status = b.dataset.st; });
    $('#pf', el).onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const dt = fd.get('publishedAt');
      const body = {
        title: fd.get('title'), slug: fd.get('slug'), excerpt: fd.get('excerpt'), cover: fd.get('cover'), content: ta.value,
        seoTitle: fd.get('seoTitle'), seoDescription: fd.get('seoDescription'),
        status, publishedAt: dt ? new Date(dt).getTime() : '',
      };
      const r = edit ? await call(`/api/admin/posts/${p.id}`, body, 'PATCH') : await call('/api/admin/posts', body);
      closeDialog();
      toast(r.post.status === 'published' ? 'Đã đăng bài' : 'Đã lưu nháp');
      refresh();
    };
  });
}

// ---------- gói giá & FAQ ----------
function renderPlans() {
  const { plans, faq } = S.config;
  view('plans').innerHTML = `
    <h1>Gói giá</h1>
    <form id="pf"><div class="plans-ed">${plans.map(p => `
      <div class="plan-ed" data-plan="${p.id}">
        <div class="field"><label>Tên gói</label><input data-k="name" value="${esc(p.name)}"></div>
        <div class="field"><label>Giá (đồng)</label><input data-k="price" type="number" step="1000" value="${p.price}"></div>
        ${p.allGames ? '<p class="note">Gói này gồm tất cả game.</p>' : `<div class="field"><label>Số game</label><input data-k="slots" type="number" min="1" value="${p.slots}"></div>`}
        <div class="field"><label>Dòng phụ</label><input data-k="subtitle" value="${esc(p.subtitle)}"></div>
        <div class="field"><label>Nhãn (VD: Phổ biến nhất)</label><input data-k="badge" value="${esc(p.badge)}"></div>
        <label class="chk"><input type="checkbox" data-k="highlight" ${p.highlight ? 'checked' : ''}> Làm nổi bật</label>
        <div class="field"><label>Quyền lợi (mỗi dòng 1 ý)</label><textarea data-k="features" rows="6">${esc(p.features.join('\n'))}</textarea></div>
      </div>`).join('')}</div>
      <button class="btn">Lưu gói giá</button></form>
    <h1 style="margin-top:36px">Hỏi đáp</h1>
    <form id="ff"><div id="faqList">${faq.map(faqRow).join('')}</div>
      <div class="bar"><button type="button" class="btn ghost sm" id="addFaq">＋ Thêm câu hỏi</button><button class="btn sm">Lưu hỏi đáp</button></div></form>`;
  $('#pf').onsubmit = async (e) => {
    e.preventDefault();
    const out = $$('[data-plan]').map(el => {
      const v = (k) => $(`[data-k=${k}]`, el);
      return {
        id: el.dataset.plan, name: v('name').value, price: v('price').value, slots: v('slots')?.value,
        subtitle: v('subtitle').value, badge: v('badge').value, highlight: v('highlight').checked,
        features: v('features').value.split('\n').map(s => s.trim()).filter(Boolean),
      };
    });
    await call('/api/admin/plans', { plans: out }, 'PUT'); toast('Đã lưu gói giá'); refresh();
  };
  $('#addFaq').onclick = () => $('#faqList').insertAdjacentHTML('beforeend', faqRow({ q: '', a: '' }));
  $('#ff').onsubmit = async (e) => {
    e.preventDefault();
    const out = $$('.faq-ed').map(r => ({ q: $('[data-q]', r).value, a: $('[data-a]', r).value }));
    await call('/api/admin/faq', { faq: out }, 'PUT'); toast('Đã lưu hỏi đáp'); refresh();
  };
}
function faqRow(f) {
  return `<div class="faq-ed"><input data-q placeholder="Câu hỏi" value="${esc(f.q)}"><textarea data-a rows="2" placeholder="Trả lời">${esc(f.a)}</textarea><div class="acts"><button type="button" class="bad" onclick="this.closest('.faq-ed').remove()">Xoá</button></div></div>`;
}


// ---------- biến động số dư ----------
const TXN_LABEL = { matched: ['Đã tự trả key', 'paid'], unmatched: ['Cần xử lý', 'pending'], manual: ['Đã xử lý tay', 'active'], ignored: ['Bỏ qua', 'cancelled'] };
function renderBank() {
  const b = S.bank;
  if ($('#bankText') && document.activeElement === $('#bankText')) return; // đang gõ thì không vẽ lại
  const status = !b.enabled ? '<span class="tag-s pending">Đang tắt</span>' : !b.ready ? '<span class="tag-s pending">Thiếu Gmail / mật khẩu ứng dụng</span>'
    : b.lastError ? `<span class="tag-s cancelled">Lỗi</span> ${esc(b.lastError)}` : '<span class="tag-s paid">Đang chạy, kiểm tra mỗi phút</span>';
  const rows = b.txns.map(t => {
    const [label, cls] = TXN_LABEL[t.status] || [t.status, ''];
    const open = t.status === 'unmatched';
    return `<tr><td>${fmt(t.receivedAt)}</td><td><b>+${moneyFull(t.amount)}</b></td><td style="max-width:320px;word-break:break-word">${esc(t.content)}</td>
      <td><span class="tag-s ${cls}">${label}</span>${t.note ? `<div class="sub">${esc(t.note)}</div>` : ''}</td>
      <td>${t.orderCode ? `#${t.orderCode}` : ''}</td>
      <td>${open ? `<button class="btn sm" data-act="bankAssign" data-id="${t.id}">Gán đơn</button> <button class="btn sm ghost" data-act="bankIgnore" data-id="${t.id}">Bỏ qua</button>` : ''}</td></tr>`;
  }).join('');
  view('bank').innerHTML = `
    <h1>Biến động số dư</h1>
    <div class="box-s"><h2>Tự xác nhận chuyển khoản</h2>
      <p class="note">Web đọc email báo số dư của ngân hàng (ACB) gửi về Gmail. Nội dung chuyển khoản có mã đơn <code>LG…</code> và đủ tiền thì tự gửi key cho khách.
      Giao dịch sai nội dung hoặc thiếu tiền nằm ở đây để bạn gán vào đơn. Cài Gmail trong <a href="#settings" data-go="settings">Cài đặt</a>.</p>
      <p>Trạng thái: ${status}${b.lastRun ? ` · lần đọc cuối ${fmt(b.lastRun)}` : ''}</p>
      <button class="btn sm" data-act="bankCheck" ${b.ready ? '' : 'disabled'}>Kiểm tra email ngay</button>
    </div>
    <div class="box-s"><h2>Thử đọc email mẫu</h2>
      <p class="note">Dán nội dung một email báo số dư để xem web đọc ra số tiền và mã đơn thế nào. Email bị sót thì bấm "Ghi nhận" để xử lý như email tự đọc (dán lại lần nữa không bị tính trùng).</p>
      <textarea id="bankText" rows="5" style="width:100%" placeholder="Dán nội dung email ACB vào đây"></textarea>
      <div class="bar" style="margin-top:8px"><button class="btn sm" data-act="bankParse">Thử đọc</button><button class="btn sm ghost" data-act="bankRecord">Ghi nhận giao dịch</button></div>
      <div id="bankParseOut" class="note"></div>
    </div>
    <div class="box-s"><h2>Giao dịch tiền vào</h2>
      ${b.txns.length ? `<div class="tbl-wrap"><table><thead><tr><th>Thời gian</th><th>Số tiền</th><th>Nội dung</th><th>Kết quả</th><th>Đơn</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="note">Chưa có giao dịch nào.</p>'}
    </div>`;
}

// ---------- cài đặt ----------
function renderSettings() {
  const s = S.config.settings;
  const f = (k, label, hint = '', type = 'text', full = false) => `<div class="field ${full ? 'full' : ''}"><label>${label}</label><input name="${k}" type="${type}" value="${esc(s[k])}">${hint ? `<small>${hint}</small>` : ''}</div>`;
  const webhook = `${(s.publicUrl || location.origin).replace(/\/$/, '')}/api/payos/webhook`;
  view('settings').innerHTML = `
    <h1>Cài đặt</h1>
    <form id="sf">
      <div class="box-s"><h2>Thương hiệu & trang chủ</h2><p class="note">Nội dung phần đầu trang bán hàng.</p><div class="form-grid">
        ${f('brandName', 'Tên thương hiệu')}${f('tagline', 'Khẩu hiệu')}
        ${f('heroEyebrow', 'Dòng nhỏ trên tiêu đề', '', 'text', true)}
        ${f('heroTitle', 'Tiêu đề lớn', '', 'text', true)}
        <div class="field full"><label>Mô tả dưới tiêu đề</label><textarea name="heroSubtitle" rows="2">${esc(s.heroSubtitle)}</textarea></div>
        ${f('heroVideo', 'Video trong khung điện thoại', 'Link mp4. Để trống sẽ dùng video của game đầu tiên.', 'text', true)}
        ${f('promo', 'Dòng khuyến mãi ở bảng giá', '', 'text', true)}
        ${f('guideUrl', 'Link hướng dẫn cài đặt', 'Video YouTube hoặc file PDF, hiện sau khi khách thanh toán.', 'text', true)}
      </div></div>
      <div class="box-s"><h2>SEO (Google, Facebook, Zalo)</h2><p class="note">Để trống thì web tự tạo tiêu đề và mô tả từ tên game và bảng giá. Nhớ điền <b>Địa chỉ website</b> ở mục PayOS (VD: https://netxioviet.com) để link trong sitemap đúng. Sơ đồ trang: <a href="/sitemap.xml" target="_blank">/sitemap.xml</a>.</p><div class="form-grid">
        ${f('seoTitle', 'Tiêu đề trang chủ trên Google', 'Khoảng 50–60 ký tự, có cụm "game TikTok LIVE".', 'text', true)}
        <div class="field full"><label>Mô tả trên Google</label><textarea name="seoDescription" rows="2">${esc(s.seoDescription)}</textarea><small>Khoảng 140–160 ký tự.</small></div>
        ${f('ogImage', 'Ảnh khi chia sẻ link (Facebook, Zalo)', 'Link ảnh 1200×630. Để trống = ảnh game đầu tiên.', 'text', true)}
        ${f('googleVerification', 'Mã xác minh Google Search Console', 'Chỉ dán phần content của thẻ google-site-verification.', 'text', true)}
      </div></div>
      <div class="box-s"><h2>Đo lường quảng cáo (Facebook, Google, TikTok)</h2><p class="note">Mã được chèn vào mọi trang khách xem (không chèn vào trang quản trị). Web tự gửi sự kiện: <b>ViewContent</b> (xem trang game), <b>InitiateCheckout</b> (mở khung mua), <b>CompleteRegistration</b> (đăng ký), <b>Purchase</b> (đơn đã thanh toán, có giá trị VND, mỗi đơn tính 1 lần), <b>Contact</b> (bấm Zalo). Trong GTM các sự kiện có tên view_item, begin_checkout, sign_up, purchase, contact. Nếu đã gắn Meta Pixel ở đây thì <b>không</b> gắn thêm Meta Pixel trong GTM, tránh đếm 2 lần. Để trống ô nào thì tắt mã đó.</p><div class="form-grid">
        ${f('gtmId', 'Google Tag Manager', 'Dạng GTM-XXXXXXX')}${f('ga4Id', 'Google Analytics 4 (tuỳ chọn)', 'Dạng G-XXXXXXXXXX. Bỏ trống nếu GA4 đã cài trong GTM.')}
        ${f('metaPixelId', 'Meta (Facebook) Pixel ID', 'Dãy số, VD 1497281003464233')}${f('tiktokPixelId', 'TikTok Pixel ID (tuỳ chọn)', 'Lấy ở TikTok Ads Manager › Events')}
      </div>
      <h3 style="margin:18px 0 6px">Meta Conversions API (máy chủ gửi sự kiện)</h3>
      <p class="note">Máy chủ gửi thẳng cho Facebook các sự kiện xem game, mở khung mua, đăng ký, liên hệ và <b>mua hàng</b> (gửi ngay khi đơn được xác nhận, kể cả khi khách đã đóng trang). Pixel và máy chủ dùng chung mã sự kiện nên Facebook chỉ tính 1 lần. Lấy mã ở <b>Trình quản lý sự kiện › chọn Pixel › Cài đặt › API Chuyển đổi › Tạo mã truy cập</b>.</p>
      <div class="form-grid">
        <div class="field full"><label>Mã truy cập Conversions API</label><input name="metaCapiToken" type="password" autocomplete="new-password" placeholder="${S.config.capiTokenSet ? '•••••••• (đã lưu, để trống = giữ nguyên)' : 'Dán mã bắt đầu bằng EAA…'}"><small>${S.config.capiTokenSet ? '✅ Đang bật.' : 'Chưa có mã: máy chủ chưa gửi sự kiện.'}${S.config.capi?.lastOk ? ` Lần gửi thành công gần nhất: ${fmt(S.config.capi.lastOk)} (${S.config.capi.sent} sự kiện từ lúc web khởi động).` : ''}${S.config.capi?.lastError ? ` <span style="color:#e5484d">Lỗi gần nhất (${fmt(S.config.capi.lastErrorAt)}): ${esc(S.config.capi.lastError)}</span>` : ''}</small></div>
        ${f('metaTestEventCode', 'Mã thử nghiệm (tuỳ chọn)', 'Chỉ điền khi kiểm tra ở tab Thử nghiệm sự kiện (VD TEST12345). Kiểm tra xong <b>xoá trống</b> để sự kiện được tính thật.')}
        <div class="field"><label>&nbsp;</label><button type="button" class="btn ghost sm" data-act="capiTest">Gửi 1 sự kiện thử</button><small>Lưu cài đặt trước rồi bấm.</small></div>
      </div></div>
      <div class="box-s"><h2>📲 Báo đơn hàng về Telegram</h2><p class="note">Mỗi khi khách đặt đơn, báo đã chuyển khoản hoặc đơn được thanh toán, web nhắn ngay về Telegram của bạn.<br><b>Cách lấy:</b> 1) Trong Telegram, mở <b>@BotFather</b>, gõ <code>/newbot</code>, đặt tên, nhận <b>mã bot</b> (dạng 123456:ABC…). 2) Mở bot vừa tạo, bấm <b>Start</b> (hoặc thêm bot vào nhóm). 3) Mở <b>@userinfobot</b> để lấy <b>chat id</b> của bạn (nhóm thì id bắt đầu bằng -100…). Nhiều người nhận: cách nhau bằng dấu phẩy.</p><div class="form-grid">
        <div class="field"><label>Mã bot (Bot token)</label><input name="telegramBotToken" type="password" autocomplete="new-password" placeholder="${S.config.telegramTokenSet ? '•••••••• (đã lưu, để trống = giữ nguyên)' : 'VD 123456789:AAH…'}"><small>${S.config.telegramTokenSet ? '✅ Đã lưu mã bot.' : 'Chưa có mã bot.'}${S.config.telegram?.lastOk ? ` Gửi được lúc ${fmt(S.config.telegram.lastOk)}.` : ''}${S.config.telegram?.lastError ? ` <span style="color:#e5484d">Lỗi gần nhất: ${esc(S.config.telegram.lastError)}</span>` : ''}</small></div>
        ${f('telegramChatId', 'Chat id người nhận', 'VD 123456789 hoặc -1001234567890 (nhóm)')}
        <div class="field"><label>Báo khi có đơn mới</label><select name="telegramNew"><option value="1" ${s.telegramNew ? 'selected' : ''}>Có</option><option value="0" ${s.telegramNew ? '' : 'selected'}>Không</option></select></div><div class="field"><label>Báo khi khách bấm "đã chuyển khoản"</label><select name="telegramClaim"><option value="1" ${s.telegramClaim ? 'selected' : ''}>Có</option><option value="0" ${s.telegramClaim ? '' : 'selected'}>Không</option></select></div><div class="field"><label>Báo khi đơn đã thanh toán</label><select name="telegramPaid"><option value="1" ${s.telegramPaid ? 'selected' : ''}>Có</option><option value="0" ${s.telegramPaid ? '' : 'selected'}>Không</option></select></div>
        <div class="field"><label>&nbsp;</label><button type="button" class="btn ghost sm" data-act="tgTest">Gửi tin nhắn thử</button><small>Lưu cài đặt trước rồi bấm.</small></div>
      </div></div>
      <div class="box-s"><h2>Liên hệ hỗ trợ</h2><p class="note">Để trống mục nào thì mục đó không hiện. Nút "Chat hỗ trợ" trên web mở fanpage; chưa có fanpage thì mở Zalo.</p><div class="form-grid">
        ${f('messengerUrl', 'Link chat fanpage (Messenger)', 'VD: https://m.me/tenfanpage. Hiện nút chat nổi ở góc màn hình và nút "Chat hỗ trợ".', 'text', true)}
        ${f('zaloGroup', 'Link nhóm Zalo hỗ trợ', 'VD: https://zalo.me/g/abcxyz. Hiện cho khách sau khi mua và ở mục Hỗ trợ.', 'text', true)}
        ${f('contactZalo', 'Zalo', 'Số điện thoại hoặc link zalo.me')}${f('contactPhone', 'Số điện thoại')}
        ${f('contactFacebook', 'Facebook', 'Link fanpage')}${f('contactTiktok', 'TikTok', 'Link kênh TikTok')}
      </div></div>
      <div class="box-s"><h2>Thông tin người bán</h2><p class="note">Hiện ở chân trang và các <a href="/chinh-sach/chinh-sach-ban-hang" target="_blank">trang chính sách</a>. Để trống mục nào thì mục đó không hiện.</p><div class="form-grid">
        ${f('sellerName', 'Tên người / đơn vị bán hàng', 'VD: Hộ kinh doanh Nguyễn Văn A')}${f('sellerTaxId', 'Mã số thuế hoặc CCCD', '')}
        ${f('sellerEmail', 'Email liên hệ')}${f('refundDays', 'Số ngày được hoàn tiền khi chưa kích hoạt key', '0 = không hoàn tiền khi đổi ý', 'number')}
        ${f('sellerAddress', 'Địa chỉ', '', 'text', true)}
      </div></div>
      <div class="box-s"><h2>Thanh toán PayOS (tự động)</h2>
        <p class="note">Đăng ký tại payos.vn, liên kết tài khoản ngân hàng, tạo Kênh thanh toán rồi chép 3 mã vào đây. Khách trả tiền xong, hệ thống tự gửi key.
        Trong PayOS, đặt Webhook URL là <code>${esc(webhook)}</code> (cần tên miền thật, không dùng được localhost).</p><div class="form-grid">
        ${f('payosClientId', 'Client ID')}${f('payosApiKey', 'Api Key', '', 'password')}
        ${f('payosChecksumKey', 'Checksum Key', '', 'password')}${f('publicUrl', 'Địa chỉ website', 'VD: https://gamelive.vn — dùng cho link quay về sau thanh toán.')}
      </div></div>
      <div class="box-s"><h2>Tài khoản nhận chuyển khoản</h2><p class="note">Khách quét mã VietQR có sẵn số tiền và nội dung <code>LG…</code>. Bật đọc email ngân hàng bên dưới để tự xác nhận, nếu không thì bạn bấm "Đã nhận tiền" trong mục Đơn hàng.</p><div class="form-grid">
        ${f('bankCode', 'Mã ngân hàng', 'VD: ACB, MB, VCB, TCB, VPB, BIDV')}${f('bankAccount', 'Số tài khoản')}
        ${f('bankOwner', 'Tên chủ tài khoản', 'Viết hoa không dấu', 'text', true)}
      </div></div>
      <div class="box-s"><h2>Tự xác nhận chuyển khoản qua email ngân hàng</h2>
        <p class="note">Bật nhận email biến động số dư của ACB về một Gmail. Trong Gmail đó: bật Xác minh 2 bước, rồi vào myaccount.google.com › Bảo mật › Mật khẩu ứng dụng để tạo mật khẩu 16 ký tự và dán vào đây.
        Web kiểm tra email mỗi phút, khách chuyển đúng nội dung <code>LG…</code> và đủ tiền là nhận key ngay. Xem kết quả ở mục <a href="#bank" data-go="bank">Biến động số dư</a>.</p><div class="form-grid">
        <div class="field"><label>Bật tự xác nhận</label><select name="imapEnabled"><option value="0" ${!s.imapEnabled ? 'selected' : ''}>Tắt</option><option value="1" ${s.imapEnabled ? 'selected' : ''}>Bật</option></select></div>
        ${f('imapUser', 'Gmail nhận email ngân hàng', 'VD: shop@gmail.com')}
        <div class="field"><label>Mật khẩu ứng dụng Gmail</label><input name="imapPass" type="password" autocomplete="new-password" placeholder="${S.config.imapPassSet ? '•••••••• (đã lưu, để trống = giữ nguyên)' : '16 ký tự'}"><small>Không phải mật khẩu Gmail thường.</small></div>
        ${f('imapFrom', 'Chỉ đọc email gửi từ', 'Mặc định acb.com.vn. Để trống = đọc mọi email.')}
        ${f('imapHost', 'Máy chủ IMAP', 'Gmail: imap.gmail.com')}${f('imapPort', 'Cổng', 'Gmail: 993', 'number')}
        ${f('imapFolder', 'Thư mục', 'Mặc định INBOX')}
      </div></div>
      <div class="box-s"><h2>Quy định key</h2><div class="form-grid">
        ${f('moveLimit', 'Số lần khách tự chuyển máy', '', 'number')}${f('moveWindowDays', 'Trong bao nhiêu ngày', '', 'number')}
        ${f('offlineDays', 'Số ngày game chạy được khi mất mạng', 'Sau thời gian này game phải kết nối lại máy chủ để kiểm tra key.', 'number')}
      </div></div>
      <button class="btn">Lưu cài đặt</button>
    </form>
    <div class="box-s" style="margin-top:24px"><h2>Đổi mật khẩu quản trị</h2>
      <form id="pwf" class="bar"><input type="password" id="npw" placeholder="Mật khẩu mới (ít nhất 8 ký tự)" autocomplete="new-password"><button class="btn sm">Đổi</button></form></div>
    <div class="box-s"><h2>Khoá công khai cho game</h2><p class="note">Đóng gói vào game để game tự kiểm tra vé kích hoạt khi mất mạng. Không cần giữ bí mật.</p>
      <pre class="pub">${esc(S.config.publicKey)}</pre></div>`;
  $('#sf').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    await call('/api/admin/settings', body, 'PUT'); toast('Đã lưu cài đặt');
    $('#brand').textContent = body.brandName;
  };
  $('#pwf').onsubmit = async (e) => {
    e.preventDefault();
    await call('/api/admin/password', { password: $('#npw').value }); $('#npw').value = ''; toast('Đã đổi mật khẩu');
  };
}

// ---------- nút hành động ----------
document.addEventListener('click', async (e) => {
  const c = e.target.closest('[data-copy]');
  if (c) { e.preventDefault(); return copy(c.dataset.copy); }
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); return go(g.dataset.go); }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const { act, code, key, id } = b.dataset;
  const enc = encodeURIComponent;
  if (act === 'tgTest') {
    b.disabled = true;
    try { await call('/api/admin/telegram/test', {}); toast('Đã gửi tin thử, xem Telegram của bạn'); } catch {} finally { b.disabled = false; }
    return;
  }
  if (act === 'capiTest') {
    b.disabled = true;
    try { const r = await call('/api/admin/capi/test', { testCode: $('[name=metaTestEventCode]')?.value || '' }); toast(`Facebook đã nhận ${r.received ?? 1} sự kiện thử`); } catch {} finally { b.disabled = false; }
    return;
  }
  if (act === 'bankCheck') { b.disabled = true; try { const r = await call('/api/admin/bank/check', {}); toast(r.error ? `Lỗi: ${r.error}` : `Đã đọc: ${r.added} giao dịch mới, ${r.matched} đơn tự trả key`); } finally { refresh(); } }
  if (act === 'bankParse' || act === 'bankRecord') {
    const text = $('#bankText').value.trim();
    if (!text) return toast('Dán nội dung email trước');
    if (act === 'bankRecord') {
      if (!confirm('Ghi nhận giao dịch này? Nếu khớp đơn và đủ tiền, khách sẽ nhận key ngay.')) return;
      const r = await call('/api/admin/bank/test-parse', { text, record: true });
      toast(r.txn.status === 'matched' ? `Đã trả key cho đơn #${r.txn.orderCode}` : `Đã ghi nhận: ${r.txn.note}`);
      $('#bankText').value = ''; $('#bankText').blur(); return refresh();
    }
    const r = (await call('/api/admin/bank/test-parse', { text })).result;
    $('#bankParseOut').innerHTML = !r ? '❌ Không đọc được số tiền trong email này.'
      : `${r.credit ? '✅ Tiền vào' : '⛔ Tiền ra (bỏ qua)'}: <b>${moneyFull(r.amount)}</b> · Nội dung: <code>${esc(r.content || '(trống)')}</code><br>
         ${r.orderCode ? (r.order ? `Đơn #${r.order.code}: ${moneyFull(r.order.amount)}, ${r.order.status === 'paid' ? 'đã thanh toán' : r.amount >= r.order.amount ? 'đủ tiền → sẽ tự trả key' : 'thiếu tiền'}` : `Mã đơn #${r.orderCode} không tồn tại`) : 'Không thấy mã đơn LG… trong nội dung'}`;
  }
  if (act === 'bankAssign') {
    const code = prompt('Nhập mã đơn (số sau chữ LG) để trả key cho giao dịch này:');
    if (!code) return;
    await call(`/api/admin/bank/${id}/assign`, { orderCode: code.trim() }); toast('Đã trả key cho đơn'); refresh();
  }
  if (act === 'bankIgnore' && confirm('Bỏ qua giao dịch này?')) { await call(`/api/admin/bank/${id}/ignore`, {}); refresh(); }
  if (act === 'pay' && confirm(`Xác nhận đã nhận tiền đơn #${code}? Hệ thống sẽ tạo key cho khách.`)) { await call(`/api/admin/orders/${code}/mark-paid`, {}); toast('Đã tạo key'); refresh(); }
  if (act === 'cancel' && confirm(`Huỷ đơn #${code}?`)) { await call(`/api/admin/orders/${code}/cancel`, {}); refresh(); }
  if (act === 'link') copy(location.origin + b.dataset.link);
  if (act === 'reissue' && confirm(`Đổi key ${key} thành key mới?\nKey cũ sẽ không dùng được nữa (game của khách bị khoá cho tới khi nhập key mới). Gói, game, tài khoản giữ nguyên.`)) {
    const r = await call(`/api/admin/licenses/${enc(key)}/reissue`, {});
    dialog(`<h3>Key mới</h3><p class="msub">Gửi key này cho khách. Key mới cũng hiện trong Tài khoản của khách.</p>
      <div class="keybox"><code>${esc(r.key)}</code><button class="btn sm" data-copy="${esc(r.key)}">Sao chép</button></div>
      <p class="note">Key cũ: <s>${esc(r.old)}</s></p>`);
    refresh();
  }
  if (act === 'reset' && confirm('Gỡ key khỏi máy hiện tại? Khách sẽ kích hoạt lại trên máy mới.')) { await call(`/api/admin/licenses/${enc(key)}/reset-machine`, {}); toast('Đã gỡ máy'); refresh(); }
  if (act === 'lock' && confirm('Khoá key này? Game của khách sẽ ngừng chạy.')) { await call(`/api/admin/licenses/${enc(key)}`, { status: 'locked' }, 'PATCH'); refresh(); }
  if (act === 'unlock') { await call(`/api/admin/licenses/${enc(key)}`, { status: 'active' }, 'PATCH'); refresh(); }
  if (act === 'editKey') keyDialog(S.licenses.find(l => l.key === key));
  if (act === 'owner') {
    const login = prompt('Nhập SĐT hoặc email tài khoản khách để gắn key này (để trống = bỏ gắn):');
    if (login === null) return;
    await call(`/api/admin/licenses/${enc(key)}/owner`, { login: login.trim() }, 'PATCH'); toast('Đã cập nhật'); refresh();
  }
  if (act === 'resetPw' && confirm(`Cấp mật khẩu mới cho ${b.dataset.name}? Mật khẩu cũ sẽ không dùng được nữa.`)) {
    const r = await call(`/api/admin/users/${enc(id)}/reset-password`, {});
    dialog(`<h3>Mật khẩu mới</h3><p class="msub">Gửi cho khách qua Zalo. Khách nên đổi lại sau khi đăng nhập.</p>
      <div class="keybox"><code>${esc(r.password)}</code><button class="btn sm" data-copy="${esc(r.password)}">Sao chép</button></div>`);
  }
  if (act === 'delKey' && confirm(`Xoá hẳn key ${key}? Không hoàn tác được.`)) { await call(`/api/admin/licenses/${enc(key)}`, undefined, 'DELETE'); refresh(); }
  if (act === 'editGame') gameDialog(S.games.find(x => x.id === id));
  if (act === 'toggleGame') { const x = S.games.find(y => y.id === id); const r = await call(`/api/admin/games/${enc(id)}`, { visible: !x.visible }, 'PATCH'); if (r.filledCombo) toast(`${r.filledCombo} key Combo được nhận game này`); refresh(); }
  if (act === 'delGame' && confirm('Xoá game này?')) { await call(`/api/admin/games/${enc(id)}`, undefined, 'DELETE'); refresh(); }
});

boot().catch(e => { document.body.innerHTML = `<div class="wrap page"><div class="panel">Lỗi: ${esc(e.message)}</div></div>`; });
