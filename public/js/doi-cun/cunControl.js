import { randomUser, randomGift } from '../fake.js';

const $ = (s) => document.querySelector(s);
const GAME = 'doi-cun.html';
const statusEl = $('#status');
$('#gameUrl').textContent = `${location.origin}/${GAME}`;
$('#username').value = localStorage.getItem('tiktokUsername') || '';

const previewSound = $('#previewSound');
previewSound.checked = localStorage.getItem('doiCunPreviewSound') !== '0';
function loadPreview() {
  $('#preview').src = previewSound.checked ? GAME : `${GAME}?sound=0`;
}
previewSound.addEventListener('change', () => {
  localStorage.setItem('doiCunPreviewSound', previewSound.checked ? '1' : '0');
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
    statusEl.textContent = 'Mất kết nối máy chủ (cửa sổ đen run-doi-cun.bat có đang chạy không?)';
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

const CHATS = ['xin chào cả nhà', 'cún dễ thương quá', 'cố lên', 'đội mình đâu rồi', 'haha', 'chạy đi', 'đẹp quá', 'hay quá'];
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
  if (simUsers.length && Math.random() < 0.8) return pick(simUsers);
  const u = randomUser();
  simUsers.push(u);
  return u;
}
const say = (text, user = namedUser()) => sim({ type: 'chat', user, text });

const actions = {
  like: () => sim({ type: 'like', user: namedUser(), count: 5 + Math.floor(Math.random() * 11) }),
  like30: () => sim({ type: 'like', user: namedUser(), count: 30 }),
  share: () => sim({ type: 'share', user: namedUser() }),
  follow: () => sim({ type: 'follow', user: namedUser() }),
  chat: () => say(pick(CHATS)),
  choc: () => say(`chọc ${1 + Math.floor(Math.random() * 4)}`),
  gift: () => sim({ type: 'gift', user: namedUser(), giftName: 'Hoa hồng', diamonds: 1, repeatCount: 1, coins: 1 }),
  voiceTest: () => sim({ type: 'voiceTest' }),
  rageTest: () => sim({ type: 'rageTest' }),
  fullsetTest: () => sim({ type: 'fullsetTest' }),
  golden: () => sim({ type: 'golden' }),
  finishTest: () => sim({ type: 'finishTest' }),
};

document.querySelectorAll('[data-sim]').forEach((b) => b.addEventListener('click', () => actions[b.dataset.sim]()));
document.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => say(b.dataset.say)));
document.querySelectorAll('[data-team]').forEach((b) => b.addEventListener('click', () => say(b.dataset.team)));
document.querySelectorAll('[data-bulk]').forEach((b) => {
  b.addEventListener('click', () => {
    const n = Number(b.dataset.bulk);
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const u = randomUser();
        simUsers.push(u);
        say(String(1 + Math.floor(Math.random() * 4)), u);
      }, i * 100);
    }
  });
});
$('#btnLikeStorm').addEventListener('click', () => {
  for (let i = 0; i < 30; i++) setTimeout(() => sim({ type: 'like', user: namedUser(), count: 10 }), i * 60);
});
$('#btnShareStorm').addEventListener('click', () => {
  const u = namedUser();
  for (let i = 0; i < 5; i++) setTimeout(() => sim({ type: 'share', user: u }), i * 400);
});
$('#btnChat').addEventListener('click', () => {
  const text = $('#customChat').value.trim();
  if (!text) return;
  say(text);
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
  const keys = ['team', 'like', 'chat', 'act', 'choc', 'share', 'follow'];
  const weights = [3, 30, 3, 4, 2, 1, 0.4];
  const total = weights.reduce((a, b) => a + b, 0);
  const tick = () => {
    let r = Math.random() * total;
    let i = 0;
    while (r > weights[i]) r -= weights[i++];
    const k = keys[i];
    if (k === 'team') {
      const u = randomUser();
      simUsers.push(u);
      say(String(1 + Math.floor(Math.random() * 4)), u);
    } else if (k === 'act') say(pick(['nhảy', 'sủa', 'ăn', 'hít đất', 'lắc']));
    else actions[k]();
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

// cho biết game tìm thấy bao nhiêu bài trong thư mục nhạc
fetch('/doi-cun-music.json', { cache: 'no-store' })
  .then((r) => r.json())
  .then((list) => {
    $('#musicInfo').textContent = list.length
      ? `🎵 Nhạc: ${list.length} bài trong thư mục public/assets/nhac-doi-cun: ${list.map((f) => decodeURIComponent(f.split('/').pop())).join(', ')}`
      : '🎵 Thư mục public/assets/nhac-doi-cun đang trống, game dùng nhạc vui nhộn tự tạo.';
  })
  .catch(() => {
    $('#musicInfo').textContent = '🎵 Không đọc được danh sách nhạc (máy chủ bản cũ?)';
  });
