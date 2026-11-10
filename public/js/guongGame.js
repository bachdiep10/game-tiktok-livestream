// Gửi hình màn hình game (thu nhỏ) cho bảng điều khiển, để khung xem trước hiện Y HỆT cửa sổ game đang lên LIVE.
// Chỉ gửi khi có bảng điều khiển đang mở (bảng điều khiển hỏi "mirrorWant" mỗi 2 giây).
(() => {
  if (window.top !== window.self) return; // khung xem trước trong bảng điều khiển: không gửi
  const qs = new URLSearchParams(location.search);
  if (qs.get('preview') === '1' || qs.get('mirror') === '0') return;
  const page = location.pathname;
  const WIDTH = 480;
  const FPS = 8;
  const off = document.createElement('canvas');
  let wantUntil = 0;
  let ws = null;
  let blocked = false;
  function connect() {
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
    ws.onmessage = (e) => {
      if (typeof e.data !== 'string' || e.data.indexOf('"mirrorWant"') < 0) return;
      wantUntil = Date.now() + 5000;
    };
    ws.onclose = () => setTimeout(connect, 2000);
    ws.onerror = () => {};
  }
  connect();
  setInterval(() => {
    if (Date.now() > wantUntil || !ws || ws.readyState !== 1 || ws.bufferedAmount > 2e6) return;
    const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    if (!c || !c.width || !c.height) return;
    if (blocked) {
      ws.send(JSON.stringify({ cmd: 'mirrorFrame', page, error: 'blocked' }));
      return;
    }
    const h = Math.round((c.height * WIDTH) / c.width);
    if (off.width !== WIDTH || off.height !== h) {
      off.width = WIDTH;
      off.height = h;
    }
    try {
      off.getContext('2d').drawImage(c, 0, 0, WIDTH, h);
      ws.send(JSON.stringify({ cmd: 'mirrorFrame', page, img: off.toDataURL('image/jpeg', 0.72) }));
    } catch {
      // canvas có ảnh từ trang khác nên trình duyệt không cho chụp: bảng điều khiển sẽ dùng khung xem trước riêng
      blocked = true;
    }
  }, 1000 / FPS);
})();
