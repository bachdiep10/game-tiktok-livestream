import { randomUser, randomChat, randomGift } from './fake.js';

const $ = (s) => document.querySelector(s);
const statusEl = $('#status');
const gameUrl = `${location.origin}/game.html`;
$('#gameUrl').textContent = gameUrl;
$('#username').value = localStorage.getItem('tiktokUsername') || '';

// khung xem trước: có thể bật/tắt tiếng (mặc định bật)
const previewSound = $('#previewSound');
previewSound.checked = localStorage.getItem('previewSound') !== '0';
function loadPreview() {
  $('#preview').src = previewSound.checked ? 'game.html' : 'game.html?sound=0';
}
previewSound.addEventListener('change', () => {
  localStorage.setItem('previewSound', previewSound.checked ? '1' : '0');
  loadPreview();
});
loadPreview();

let ws;
const queue = [];
function connect() {
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onopen = () => {
    while (queue.length) ws.send(queue.shift());
  };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'status') {
      const s = msg.status;
      statusEl.textContent = `${s.message}${s.viewers ? ` · ${s.viewers} người xem` : ''}`;
      statusEl.classList.toggle('ok', Boolean(s.connected));
    }
  };
  ws.onclose = () => {
    statusEl.textContent = 'Mất kết nối máy chủ (server.js có đang chạy không?)';
    statusEl.classList.remove('ok');
    setTimeout(connect, 2000);
  };
}
connect();

function send(obj) {
  const data = JSON.stringify(obj);
  if (ws && ws.readyState === 1) ws.send(data);
  else queue.push(data);
}

// Giữ danh sách người xem giả để các sự kiện sau rơi vào người đã có
const simUsers = [];
function namedUser() {
  const name = $('#simName').value.trim();
  if (name) {
    let u = simUsers.find((x) => x.name === name);
    if (!u) {
      u = { ...randomUser(), name };
      simUsers.push(u);
    }
    return u;
  }
  if (simUsers.length && Math.random() < 0.7) return simUsers[Math.floor(Math.random() * simUsers.length)];
  const u = randomUser();
  simUsers.push(u);
  return u;
}

function sim(event) {
  send({ cmd: 'sim', event });
}

const actions = {
  join: () => {
    const name = $('#simName').value.trim();
    const u = name ? namedUser() : randomUser();
    if (!name) simUsers.push(u);
    sim({ type: 'join', user: u });
  },
  chatBow: () => sim({ type: 'chat', user: namedUser(), text: 'Nam mô A Di Đà Phật' }),
  chat: () => sim({ type: 'chat', user: namedUser(), text: randomChat() }),
  like: () => sim({ type: 'like', user: namedUser(), count: 1 + Math.floor(Math.random() * 5) }),
  follow: () => sim({ type: 'follow', user: namedUser() }),
  share: () => sim({ type: 'share', user: namedUser() }),
  voiceTest: () => sim({ type: 'voiceTest' }),
  gift1: () => sim({ type: 'gift', user: namedUser(), giftName: 'Hoa hồng', diamonds: 1, repeatCount: 1, coins: 1 }),
  gift10: () => sim({ type: 'gift', user: namedUser(), giftName: 'Bánh Donut', diamonds: 30, repeatCount: 1, coins: 30 }),
  gift100: () => sim({ type: 'gift', user: namedUser(), giftName: 'Đèn hoa đăng', diamonds: 199, repeatCount: 1, coins: 199 }),
};

document.querySelectorAll('[data-sim]').forEach((b) => {
  b.addEventListener('click', () => actions[b.dataset.sim]());
});

document.querySelectorAll('[data-bulk]').forEach((b) => {
  b.addEventListener('click', () => {
    const n = Number(b.dataset.bulk);
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const u = randomUser();
        simUsers.push(u);
        sim({ type: 'join', user: u });
      }, i * 60);
    }
  });
});

$('#btnGiftStorm').addEventListener('click', () => {
  for (let i = 0; i < 20; i++) {
    setTimeout(() => sim({ type: 'gift', user: namedUser(), ...randomGift() }), i * 250);
  }
});

$('#btnLikeStorm').addEventListener('click', () => {
  for (let i = 0; i < 100; i++) {
    setTimeout(() => sim({ type: 'like', user: namedUser(), count: 1 + Math.floor(Math.random() * 3) }), i * 40);
  }
});

$('#btnChat').addEventListener('click', () => {
  const text = $('#customChat').value.trim();
  if (!text) return;
  sim({ type: 'chat', user: namedUser(), text });
  $('#customChat').value = '';
});
$('#customChat').addEventListener('keydown', (e) => e.key === 'Enter' && $('#btnChat').click());

let autoTimer = null;
$('#btnAuto').addEventListener('click', (e) => {
  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
    e.target.textContent = '▶ Tự chạy demo';
    e.target.classList.remove('on');
    return;
  }
  e.target.textContent = '⏸ Dừng demo';
  e.target.classList.add('on');
  const keys = ['join', 'join', 'chat', 'chatBow', 'like', 'like', 'like', 'follow', 'gift1', 'gift1', 'gift10', 'gift100'];
  const weights = [6, 6, 8, 6, 10, 10, 10, 2, 3, 3, 1, 0.3];
  const total = weights.reduce((a, b) => a + b, 0);
  const tick = () => {
    let r = Math.random() * total;
    let i = 0;
    while (r > weights[i]) r -= weights[i++];
    actions[keys[i]]();
    autoTimer = setTimeout(tick, 250 + Math.random() * 600);
  };
  tick();
});

$('#btnReset').addEventListener('click', () => {
  simUsers.length = 0;
  send({ cmd: 'reset' });
});

$('#btnConnect').addEventListener('click', () => {
  const username = $('#username').value.trim();
  localStorage.setItem('tiktokUsername', username);
  send({ cmd: 'connect', username });
});
$('#btnDisconnect').addEventListener('click', () => send({ cmd: 'disconnect' }));
