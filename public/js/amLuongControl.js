// Khung "Âm thanh" cho mọi trang điều khiển: chỉnh nhạc nền / hiệu ứng / giọng đọc / tiếng tương tác, tắt hết tiếng.
// Gửi lệnh "audio" lên máy chủ -> máy chủ lưu (am-luong.json) và báo cho cửa sổ game.
(function () {
  const ROWS = [
    ['music', '🎵 Nhạc nền'],
    ['sfx', '💥 Hiệu ứng game'],
    ['voice', '🗣️ Giọng đọc'],
    ['cues', '❤️ Tiếng tim / bình luận / share / follow'],
  ];
  let S = { music: 100, sfx: 100, voice: 100, cues: 70, mute: false };
  let ws = null;

  const box = document.createElement('div');
  box.className = 'am-luong';
  box.innerHTML = `
    <style>
      .am-luong { margin: 12px 0; padding: 10px 12px; border: 1px solid rgba(255,255,255,.18); border-radius: 10px; background: rgba(0,0,0,.18); }
      .am-luong h2 { margin: 0 0 8px; }
      .am-luong .r { display: grid; grid-template-columns: 1fr 2fr 48px; gap: 8px; align-items: center; margin: 4px 0; font-size: 14px; }
      .am-luong input[type=range] { width: 100%; padding: 0; background: none; border: 0; }
      .am-luong .b { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
      .am-luong button.muted { background: #c62828; border-color: #ef5350; }
    </style>
    <h2>🔊 Âm thanh</h2>
    ${ROWS.map(([k, label]) => `<div class="r"><span>${label}</span><input type="range" min="0" max="150" step="5" data-k="${k}"><b data-v="${k}"></b></div>`).join('')}
    <div class="b">
      <button type="button" data-act="mute">🔇 Tắt hết tiếng</button>
      <button type="button" data-act="test">🔔 Nghe thử tiếng tương tác</button>
      <button type="button" data-act="reset">↺ Mặc định</button>
    </div>
    <p class="hint">Chỉnh ở đây, cửa sổ game đổi ngay. Nếu game không có tiếng: bấm chuột một lần vào cửa sổ game.</p>`;

  function render() {
    for (const [k] of ROWS) {
      box.querySelector(`[data-k="${k}"]`).value = S[k];
      box.querySelector(`[data-v="${k}"]`).textContent = `${S[k]}%`;
    }
    const m = box.querySelector('[data-act="mute"]');
    m.textContent = S.mute ? '🔈 Bật lại tiếng' : '🔇 Tắt hết tiếng';
    m.classList.toggle('muted', !!S.mute);
  }
  function send(obj) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  }
  let t = null;
  function push() {
    render();
    clearTimeout(t);
    t = setTimeout(() => send({ cmd: 'audio', settings: S }), 80);
  }
  box.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    S[k] = Number(e.target.value);
    push();
  });
  box.addEventListener('click', (e) => {
    const a = e.target.dataset.act;
    if (a === 'mute') { S.mute = !S.mute; push(); }
    if (a === 'test') send({ cmd: 'audioTest' });
    if (a === 'reset') { S = { music: 100, sfx: 100, voice: 100, cues: 70, mute: false }; push(); }
  });

  function mount() {
    const st = document.getElementById('status');
    if (st && st.parentNode) st.parentNode.insertBefore(box, st.nextSibling);
    else (document.querySelector('main') || document.body).prepend(box);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  function connect() {
    if (location.protocol === 'file:') return;
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
    ws.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data);
        if (m.type === 'audio' && m.settings) { S = { ...S, ...m.settings }; render(); }
      } catch { /* bỏ qua */ }
    };
    ws.onclose = () => setTimeout(connect, 2500);
  }
  connect();
})();
