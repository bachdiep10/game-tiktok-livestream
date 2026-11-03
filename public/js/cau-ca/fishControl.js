import { randomUser, randomGift } from '../fake.js';

const $ = (s) => document.querySelector(s);
const GAME = 'cau-ca.html';
const statusEl = $('#status');
$('#gameUrl').textContent = `${location.origin}/${GAME}`;
$('#username').value = localStorage.getItem('tiktokUsername') || '';

const previewSound = $('#previewSound');
previewSound.checked = localStorage.getItem('cauCaPreviewSound') !== '0';
function loadPreview() {
  $('#preview').src = previewSound.checked ? GAME : `${GAME}?sound=0`;
}
previewSound.addEventListener('change', () => {
  localStorage.setItem('cauCaPreviewSound', previewSound.checked ? '1' : '0');
  loadPreview();
});
loadPreview();

let ws;
const pending = [];
function connect() {
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onopen = () => {
    while (pending.length) ws.send(pending.shift());
  };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'log') {
      const ul = $('#eventLog');
      if (ul.querySelector('.hint')) ul.innerHTML = '';
      const li = document.createElement('li');
      li.innerHTML = `<time>${new Date(msg.time).toLocaleTimeString('vi-VN')}</time>`;
      li.append(document.createTextNode(msg.text));
      ul.prepend(li);
      while (ul.children.length > 50) ul.lastChild.remove();
    }
    if (msg.type === 'status') {
      const s = msg.status;
      statusEl.textContent = `${s.message}${s.viewers ? ` · ${s.viewers} người xem` : ''}${s.version ? ` (bản ${s.version})` : ' (bản cũ)'}`;
      statusEl.classList.toggle('ok', Boolean(s.connected));
    }
  };
  ws.onclose = () => {
    statusEl.textContent = 'Mất kết nối máy chủ (cửa sổ đen run-cau-ca.bat có đang chạy không?)';
    statusEl.classList.remove('ok');
    setTimeout(connect, 2000);
  };
}
connect();

function send(obj) {
  const data = JSON.stringify(obj);
  if (ws && ws.readyState === 1) ws.send(data);
  else pending.push(data);
}
const sim = (event) => send({ cmd: 'sim', event });

const CHATS = ['chào cả bến', 'hôm nay cá cắn không', 'câu được con nào chưa', 'bến trái cố lên', 'bến phải vô địch', 'xin chào cả nhà', 'vui quá', 'nhớ hồi nhỏ đi câu ghê'];
const CMDS = ['1', '1', '1', '2', '2', '3', '4', '5', '1', 'câu chép', 'cá lóc', '6', '7', 'trái', 'phải'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

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
  if (simUsers.length && Math.random() < 0.75) return pick(simUsers);
  const u = randomUser();
  simUsers.push(u);
  return u;
}

const actions = {
  join: () => {
    const name = $('#simName').value.trim();
    const u = name ? namedUser() : randomUser();
    if (!name) simUsers.push(u);
    sim({ type: 'join', user: u });
  },
  cmd: () => sim({ type: 'chat', user: namedUser(), text: pick(CMDS) }),
  chat: () => sim({ type: 'chat', user: namedUser(), text: pick(CHATS) }),
  like: () => sim({ type: 'like', user: namedUser(), count: 1 + Math.floor(Math.random() * 5) }),
  follow: () => sim({ type: 'follow', user: namedUser() }),
  share: () => sim({ type: 'share', user: namedUser() }),
  voiceTest: () => sim({ type: 'voiceTest' }),
  monster: () => sim({ type: 'monster' }),
  rain: () => sim({ type: 'rain' }),
  skipTime: () => sim({ type: 'skipTime' }),
  goal: () => sim({ type: 'goal' }),
  endRound: () => sim({ type: 'endRound' }),
  starve: () => sim({ type: 'starve' }),
  gift1: () => sim({ type: 'gift', user: namedUser(), giftName: 'Hoa hồng', diamonds: 1, repeatCount: 1, coins: 1 }),
  gift10: () => sim({ type: 'gift', user: namedUser(), giftName: 'Bánh Donut', diamonds: 30, repeatCount: 1, coins: 30 }),
  gift100: () => sim({ type: 'gift', user: namedUser(), giftName: 'Pháo hoa', diamonds: 299, repeatCount: 1, coins: 299 }),
};

document.querySelectorAll('[data-sim]').forEach((b) => b.addEventListener('click', () => actions[b.dataset.sim]()));
document.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => sim({ type: 'chat', user: namedUser(), text: b.dataset.cmd })));
document.querySelectorAll('[data-bulk]').forEach((b) => {
  b.addEventListener('click', () => {
    const n = Number(b.dataset.bulk);
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const u = randomUser();
        simUsers.push(u);
        sim({ type: 'join', user: u });
      }, i * 120);
    }
  });
});
$('#btnGiftStorm').addEventListener('click', () => {
  for (let i = 0; i < 10; i++) setTimeout(() => sim({ type: 'gift', user: namedUser(), ...randomGift() }), i * 500);
});
$('#btnLikeStorm').addEventListener('click', () => {
  for (let i = 0; i < 50; i++) setTimeout(() => sim({ type: 'like', user: namedUser(), count: 3 }), i * 40);
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
  const keys = ['join', 'chat', 'cmd', 'like', 'follow', 'share', 'gift1', 'gift10', 'gift100'];
  const weights = [6, 3, 12, 25, 1, 1.2, 1.5, 0.4, 0.08];
  const total = weights.reduce((a, b) => a + b, 0);
  const tick = () => {
    let r = Math.random() * total;
    let i = 0;
    while (r > weights[i]) r -= weights[i++];
    actions[keys[i]]();
    autoTimer = setTimeout(tick, 300 + Math.random() * 700);
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

// cho biết game tìm thấy bao nhiêu bài trong thư mục nhạc
fetch('/cau-ca-music.json', { cache: 'no-store' })
  .then((r) => r.json())
  .then((list) => {
    $('#musicInfo').textContent = list.length
      ? `🎵 Nhạc: ${list.length} bài trong thư mục public/assets/nhac-cau-ca: ${list.map((f) => decodeURIComponent(f.split('/').pop())).join(', ')}`
      : '🎵 Thư mục public/assets/nhac-cau-ca đang trống, game dùng nhạc sáo trúc tự tạo.';
  })
  .catch(() => {
    $('#musicInfo').textContent = '🎵 Không đọc được danh sách nhạc (máy chủ bản cũ?)';
  });
