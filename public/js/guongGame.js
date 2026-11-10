// Gửi hình màn hình game (thu nhỏ) cho bảng điều khiển, để khung xem trước hiện Y HỆT cửa sổ game đang lên LIVE.
// Chỉ gửi khi có bảng điều khiển đang mở (bảng điều khiển hỏi "mirrorWant" mỗi 2 giây).
// Giữ game chạy khi cửa sổ game bị che / thu nhỏ / chuyển sang cửa sổ khác:
// trình duyệt dừng requestAnimationFrame khi cửa sổ bị ẩn, nên lúc đó game được "lên dây cót" bằng một Worker (~30 khung/giây).
(() => {
  if (window.top !== window.self) return;
  const nativeRaf = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const waiting = new Map(); // id -> callback
  let worker = null;
  try {
    worker = new Worker(URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 33);'], { type: 'text/javascript' })));
  } catch {
    return;
  }
  worker.onmessage = () => {
    if (!document.hidden || !waiting.size) return;
    const list = [...waiting.entries()];
    waiting.clear();
    const t = performance.now();
    for (const [id, cb] of list) {
      nativeCancel(id);
      try {
        cb(t);
      } catch (e) {
        console.error(e);
      }
    }
  };
  window.requestAnimationFrame = (cb) => {
    const id = nativeRaf((t) => {
      if (!waiting.has(id)) return;
      waiting.delete(id);
      cb(t);
    });
    waiting.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    waiting.delete(id);
    nativeCancel(id);
  };
})();

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
