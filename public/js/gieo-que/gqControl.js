import { randomUser, randomGift } from '../fake.js';

const $ = (s) => document.querySelector(s);
const GAME = 'gieo-que.html';
const statusEl = $('#status');
$('#gameUrl').textContent = `${location.origin}/${GAME}`;
$('#username').value = localStorage.getItem('tiktokUsername') || '';

const previewSound = $('#previewSound');
previewSound.checked = localStorage.getItem('gieoQuePreviewSound') !== '0';
function loadPreview() {
  $('#preview').src = previewSound.checked ? GAME : `${GAME}?sound=0`;
}
previewSound.addEventListener('change', () => {
  localStorage.setItem('gieoQuePreviewSound', previewSound.checked ? '1' : '0');
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
    statusEl.textContent = 'Mất kết nối máy chủ (cửa sổ đen run-gieo-que.bat có đang chạy không?)';
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

const CHATS = ['hay quá', 'linh ghê', 'xin chào cả nhà', 'ông từ hiền quá', 'mình cũng muốn xin', 'tin quá', 'thả tim nè'];
const CMDS = ['xin xăm tình duyên', 'xin quẻ công việc năm nay', 'xin xăm cho con thi đỗ', 'xin quẻ tài lộc', 'xin xăm sức khỏe cho mẹ', 'xin quẻ gia đạo', 'xin xăm có nên chuyển nhà không', 'xin xăm'];
const WISHES = ['xin cho con thi đỗ đại học', 'năm nay có lấy được chồng không', 'làm ăn có phát tài không ạ', 'xin cho mẹ mau khỏe', 'có nên đổi việc không', 'người yêu cũ có quay lại không', 'xin cho gia đình bình an'];
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
  nextPhase: () => sim({ type: 'nextPhase' }),
  gift1: () => sim({ type: 'gift', user: namedUser(), giftName: 'Hoa hồng', diamonds: 1, repeatCount: 1, coins: 1 }),
  gift20: () => sim({ type: 'gift', user: namedUser(), giftName: 'Bánh Donut', diamonds: 30, repeatCount: 1, coins: 30 }),
  gift100: () => sim({ type: 'gift', user: namedUser(), giftName: 'Pháo hoa', diamonds: 299, repeatCount: 1, coins: 299 }),
  wish: () => {
    // lấy tên người đang tới lượt từ khung xem trước
    let name = '';
    try {
      name = $('#preview').contentWindow.__gq.state().user || '';
    } catch {
      /* khung xem trước chưa sẵn sàng */
    }
    const u = simUsers.find((x) => x.name === name) || namedUser();
    sim({ type: 'chat', user: u, text: pick(WISHES) });
  },
  guess: () => {
    for (let i = 0; i < 6; i++) setTimeout(() => sim({ type: 'chat', user: namedUser(), text: pick(['thánh', 'thánh', 'âm', 'dương']) }), i * 150);
  },
  giaiHan: () => sim({ type: 'gift', user: namedUser(), giftName: 'Kem', diamonds: 20, repeatCount: 1, coins: 20 }),
  fullTest: () => {
    const u = namedUser();
    sim({ type: 'chat', user: u, text: pick(CMDS) });
    setTimeout(() => sim({ type: 'share', user: u }), 400);
  },
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
$('#btnShareStorm').addEventListener('click', () => {
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const u = randomUser();
      simUsers.push(u);
      sim({ type: 'chat', user: u, text: pick(CMDS) });
      setTimeout(() => sim({ type: 'share', user: u }), 300);
    }, i * 500);
  }
});
$('#btnGiftStorm').addEventListener('click', () => {
  for (let i = 0; i < 8; i++) setTimeout(() => sim({ type: 'gift', user: namedUser(), ...randomGift() }), i * 500);
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
  const keys = ['join', 'chat', 'cmd', 'like', 'follow', 'share', 'gift1', 'gift20', 'gift100', 'guess', 'wish'];
  const weights = [6, 4, 3, 22, 1, 2.5, 0.8, 0.3, 0.05, 1, 0.6];
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
fetch('/gieo-que-music.json', { cache: 'no-store' })
  .then((r) => r.json())
  .then((list) => {
    $('#musicInfo').textContent = list.length
      ? `🎵 Nhạc: ${list.length} bài trong thư mục public/assets/nhac-gieo-que: ${list.map((f) => decodeURIComponent(f.split('/').pop())).join(', ')}`
      : '🎵 Thư mục public/assets/nhac-gieo-que đang trống, game dùng nhạc đàn tranh tự tạo.';
  })
  .catch(() => {
    $('#musicInfo').textContent = '🎵 Không đọc được danh sách nhạc (máy chủ bản cũ?)';
  });
