// Khung xem trước ở bảng điều khiển: chiếu lại Y HỆT cửa sổ game đang mở (cùng câu, cùng đồng hồ, cùng người chơi).
// Chưa mở cửa sổ game thì vẫn chạy bản xem trước riêng như cũ.
(() => {
  const ifr = document.getElementById('preview');
  if (!ifr) return;
  const box = ifr.parentElement;
  if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
  const img = document.createElement('img');
  img.alt = 'Màn hình game đang lên LIVE';
  Object.assign(img.style, { position: 'absolute', display: 'none', objectFit: 'contain', background: '#000', zIndex: 2 });
  const badge = document.createElement('div');
  Object.assign(badge.style, {
    position: 'absolute', display: 'none', zIndex: 3, padding: '4px 10px', borderRadius: '999px', font: '700 12px system-ui, sans-serif',
    background: 'rgba(198,40,40,.92)', color: '#fff', pointerEvents: 'none', boxShadow: '0 2px 6px rgba(0,0,0,.4)',
  });
  badge.textContent = '🔴 Đang chiếu y hệt cửa sổ game LIVE';
  const note = document.createElement('p');
  note.className = 'hint';
  note.style.margin = '6px 0 0';
  box.insertBefore(img, ifr.nextSibling);
  box.insertBefore(badge, img.nextSibling);
  ifr.insertAdjacentElement('afterend', note);
  box.appendChild(note);
  // các dòng ghi chú cũ "khung xem trước có câu đố riêng..." không còn đúng khi đang chiếu
  const oldHints = [...box.querySelectorAll('.hint')].filter((p) => p !== note && /riêng|khác cửa sổ/i.test(p.textContent));

  const expectPage = () => {
    const src = savedSrc || ifr.getAttribute('src') || '';
    try {
      const p = new URL(src, location.href).pathname;
      if (p && !p.endsWith('blank')) return p;
    } catch { /* bỏ qua */ }
    return location.pathname.replace('-control', '').replace(/\/control\.html$/, '/game.html');
  };
  let savedSrc = '';
  let mirroring = false;
  let lastFrame = 0;
  let blocked = false;
  function place() {
    Object.assign(img.style, { left: `${ifr.offsetLeft}px`, top: `${ifr.offsetTop}px`, width: `${ifr.offsetWidth}px`, height: `${ifr.offsetHeight}px` });
    const r = getComputedStyle(ifr).borderRadius;
    if (r) img.style.borderRadius = r;
    Object.assign(badge.style, { left: `${ifr.offsetLeft + 8}px`, top: `${ifr.offsetTop + 8}px` });
  }
  function setNote() {
    note.textContent = mirroring
      ? '✅ Khung này đang chiếu đúng cửa sổ game thật (không phát tiếng). Tiếng chỉ phát ở cửa sổ game.'
      : blocked
        ? 'Cửa sổ game đang mở nhưng không chiếu được hình (ảnh đại diện từ trang khác). Khung này đang chạy bản xem trước riêng.'
        : 'Chưa thấy cửa sổ game: khung này đang chạy bản xem trước riêng. Mở cửa sổ game thì khung sẽ tự chiếu y hệt.';
    for (const p of oldHints) p.style.display = mirroring ? 'none' : '';
  }
  function startMirror() {
    if (mirroring) return;
    mirroring = true;
    savedSrc = ifr.getAttribute('src') || '';
    ifr.src = 'about:blank'; // tắt bản xem trước riêng cho nhẹ máy và khỏi phát tiếng đôi
    ifr.style.visibility = 'hidden';
    img.style.display = 'block';
    badge.style.display = 'block';
    place();
    setNote();
  }
  function stopMirror() {
    if (!mirroring) return;
    mirroring = false;
    img.style.display = 'none';
    badge.style.display = 'none';
    ifr.style.visibility = '';
    if (savedSrc && (ifr.getAttribute('src') || 'about:blank') === 'about:blank') ifr.src = savedSrc;
    savedSrc = '';
    setNote();
  }
  // bảng điều khiển đổi src (vd. bật/tắt tiếng xem trước) lúc đang chiếu: nhớ lại rồi tắt tiếp
  new MutationObserver(() => {
    const s = ifr.getAttribute('src') || '';
    if (mirroring && s !== 'about:blank') {
      savedSrc = s;
      ifr.src = 'about:blank';
    }
  }).observe(ifr, { attributes: true, attributeFilter: ['src'] });

  let ws = null;
  function connect() {
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
    ws.onopen = () => ws.send(JSON.stringify({ cmd: 'mirrorWant' }));
    ws.onmessage = (e) => {
      if (typeof e.data !== 'string' || e.data.indexOf('"mirrorFrame"') < 0) return;
      let m;
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      if (m.type !== 'mirrorFrame' || m.page !== expectPage()) return;
      if (m.error || !m.img) {
        blocked = true;
        stopMirror();
        setNote();
        return;
      }
      blocked = false;
      lastFrame = Date.now();
      img.src = m.img;
      startMirror();
    };
    ws.onclose = () => setTimeout(connect, 2000);
    ws.onerror = () => {};
  }
  connect();
  setInterval(() => {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ cmd: 'mirrorWant' }));
    if (mirroring && Date.now() - lastFrame > 4000) stopMirror(); // cửa sổ game đã đóng
  }, 2000);
  window.addEventListener('resize', place);
  setInterval(place, 1000);
  setNote();
})();
