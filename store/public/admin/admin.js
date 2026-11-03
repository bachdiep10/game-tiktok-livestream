import { $, $$, api, esc, money, moneyFull, copy, toast } from '/js/common.js';

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
  setInterval(() => { if (S.tab === 'orders' || S.tab === 'overview') refresh(true); }, 20000);
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
  if (t === 'licenses') { await loadGamesConfig(); S.licenses = (await call('/api/admin/licenses')).licenses; renderLicenses(); }
  if (t === 'games') { await loadGamesConfig(); renderGames(); }
  if (t === 'users') { S.users = (await call('/api/admin/users')).users; renderUsers(); }
  if (t === 'plans') { await loadGamesConfig(); renderPlans(); }
  if (t === 'settings') { await loadGamesConfig(); renderSettings(); }
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
    : !o.payment.payos ? `<div class="box-s"><h2>💡 Đang dùng chuyển khoản thủ công</h2><p class="note">Bạn cần tự bấm "Đã nhận tiền" cho từng đơn. Cài PayOS trong <a href="#settings" data-go="settings">Cài đặt</a> để hệ thống tự gửi key khi khách trả tiền.</p></div>` : '';
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
      <div class="box-s"><h2>Liên hệ hỗ trợ</h2><p class="note">Để trống mục nào thì mục đó không hiện.</p><div class="form-grid">
        ${f('contactZalo', 'Zalo', 'Số điện thoại hoặc link zalo.me')}${f('contactPhone', 'Số điện thoại')}
        ${f('contactFacebook', 'Facebook', 'Link fanpage')}${f('contactTiktok', 'TikTok', 'Link kênh TikTok')}
      </div></div>
      <div class="box-s"><h2>Thanh toán PayOS (tự động)</h2>
        <p class="note">Đăng ký tại payos.vn, liên kết tài khoản ngân hàng, tạo Kênh thanh toán rồi chép 3 mã vào đây. Khách trả tiền xong, hệ thống tự gửi key.
        Trong PayOS, đặt Webhook URL là <code>${esc(webhook)}</code> (cần tên miền thật, không dùng được localhost).</p><div class="form-grid">
        ${f('payosClientId', 'Client ID')}${f('payosApiKey', 'Api Key', '', 'password')}
        ${f('payosChecksumKey', 'Checksum Key', '', 'password')}${f('publicUrl', 'Địa chỉ website', 'VD: https://gamelive.vn — dùng cho link quay về sau thanh toán.')}
      </div></div>
      <div class="box-s"><h2>Chuyển khoản thủ công</h2><p class="note">Dùng khi chưa có PayOS. Khách quét mã VietQR, bạn kiểm tra tài khoản rồi bấm "Đã nhận tiền" trong mục Đơn hàng.</p><div class="form-grid">
        ${f('bankCode', 'Mã ngân hàng', 'VD: MB, VCB, TCB, ACB, VPB, BIDV')}${f('bankAccount', 'Số tài khoản')}
        ${f('bankOwner', 'Tên chủ tài khoản', 'Viết hoa không dấu', 'text', true)}
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
