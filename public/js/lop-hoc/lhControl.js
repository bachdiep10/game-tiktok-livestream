import { randomUser } from '../fake.js';

const $ = (s) => document.querySelector(s);
const GAME = 'lop-hoc.html';
const statusEl = $('#status');
$('#gameUrl').textContent = `${location.origin}/${GAME}`;
$('#username').value = localStorage.getItem('tiktokUsername') || '';

const previewSound = $('#previewSound');
previewSound.checked = localStorage.getItem('lopHocPreviewSound') === '1';
function loadPreview() {
  $('#preview').src = `${GAME}?preview=1${previewSound.checked ? '' : '&sound=0'}`;
}
previewSound.addEventListener('change', () => {
  localStorage.setItem('lopHocPreviewSound', previewSound.checked ? '1' : '0');
  loadPreview();
});
loadPreview();

let ws;
const pending = [];
const PHASE = { intro: 'đầu tiết', ask: 'đang trả lời', lock: 'đếm ngược', reveal: 'xem kết quả', lessonEnd: 'tổng kết tiết' };
function connect() {
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onopen = () => {
    while (pending.length) ws.send(pending.shift());
    ws.send(JSON.stringify({ cmd: 'askState' }));
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
    if (msg.type === 'gameState' && msg.state) {
      const s = msg.state;
      $('#question').textContent = s.question || '...';
      $('#answer').textContent = s.answer || '...';
      const c = (s.counts || []).map((n, i) => `${'ABCD'[i]}: ${n}`).join(' · ');
      $('#answerInfo').textContent = `· Tiết ${s.lesson}, câu ${s.q}/${s.total} (${PHASE[s.phase] || s.phase}) · ${c} · Người xem ${s.team?.viewers ?? 0} : ${s.team?.npc ?? 0} Lớp 5A · Ngân hàng ${s.bank} câu`;
    }
    if (msg.type === 'status') {
      const s = msg.status;
      statusEl.textContent = `${s.message}${s.viewers ? ` · ${s.viewers} người xem` : ''}${s.version ? ` (bản ${s.version})` : ' (bản cũ)'}`;
      statusEl.classList.toggle('ok', Boolean(s.connected));
    }
  };
  ws.onclose = () => {
    statusEl.textContent = 'Mất kết nối máy chủ (cửa sổ đen run-lop-hoc.bat có đang chạy không?)';
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
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const CHATS = ['hay quá', 'khó thế', 'cô ơi em biết', 'lớp 5 giỏi ghê', 'haha', 'câu này dễ', 'chào cả lớp', 'em chịu'];

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
  join: () => sim({ type: 'join', user: namedUser() }),
  correct: () => sim({ type: 'simAnswer', user: namedUser(), opt: 'correct' }),
  wrong: () => sim({ type: 'simAnswer', user: namedUser(), opt: 'wrong' }),
  chat: () => sim({ type: 'chat', user: namedUser(), text: pick(CHATS) }),
  like: () => sim({ type: 'like', user: namedUser(), count: 1 + Math.floor(Math.random() * 4) }),
  like15: () => sim({ type: 'like', user: namedUser(), count: 15 }),
  follow: () => sim({ type: 'follow', user: namedUser() }),
  share: () => sim({ type: 'share', user: namedUser() }),
  gift1: () => sim({ type: 'gift', user: namedUser(), giftName: 'Hoa hồng', diamonds: 1, repeatCount: 1, coins: 1 }),
  gift100: () => sim({ type: 'gift', user: namedUser(), giftName: 'Vương miện', diamonds: 99, repeatCount: 1, coins: 99 }),
  voiceTest: () => sim({ type: 'voiceTest' }),
  skip: () => sim({ type: 'skip' }),
  pause: () => sim({ type: 'pause' }),
  newLesson: () => sim({ type: 'newLesson' }),
  reloadBank: () => sim({ type: 'reloadBank' }),
  reset: () => {
    if (confirm('Xoá hết điểm của mọi người?')) send({ cmd: 'reset' });
  },
};

document.querySelectorAll('[data-sim]').forEach((b) => b.addEventListener('click', () => actions[b.dataset.sim]()));
document.querySelectorAll('[data-ans]').forEach((b) => b.addEventListener('click', () => sim({ type: 'chat', user: namedUser(), text: b.dataset.ans })));
document.querySelectorAll('[data-bulk]').forEach((b) => {
  b.addEventListener('click', () => {
    const n = Number(b.dataset.bulk);
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const u = randomUser();
        simUsers.push(u);
        sim({ type: 'join', user: u });
      }, i * 150);
    }
  });
});
$('#btnAnswerAll').addEventListener('click', () => {
  simUsers.forEach((u, i) => setTimeout(() => sim({ type: 'chat', user: u, text: pick(['A', 'B', 'C', 'D', 'đáp án b', 'chọn c', 'a']) }), i * 120));
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
  const keys = ['join', 'correct', 'wrong', 'chat', 'like', 'follow', 'share', 'gift1'];
  const weights = [3, 6, 5, 2, 10, 0.4, 0.5, 0.3];
  const total = weights.reduce((a, b) => a + b, 0);
  const tick = () => {
    let r = Math.random() * total;
    let i = 0;
    while (r > weights[i]) r -= weights[i++];
    actions[keys[i]]();
    autoTimer = setTimeout(tick, 400 + Math.random() * 900);
  };
  tick();
});

$('#btnConnect').addEventListener('click', () => {
  const username = $('#username').value.trim();
  localStorage.setItem('tiktokUsername', username);
  send({ cmd: 'connect', username });
});
$('#btnDisconnect').addEventListener('click', () => send({ cmd: 'disconnect' }));

fetch('/lop-hoc-music.json', { cache: 'no-store' })
  .then((r) => r.json())
  .then((list) => {
    $('#musicInfo').textContent = list.length
      ? `🎵 Nhạc: ${list.length} bài trong thư mục public/assets/nhac-lop-hoc: ${list.map((f) => decodeURIComponent(f.split('/').pop())).join(', ')}`
      : '🎵 Thư mục public/assets/nhac-lop-hoc đang trống, game dùng nhạc tự tạo.';
  })
  .catch(() => {
    $('#musicInfo').textContent = '🎵 Không đọc được danh sách nhạc (máy chủ bản cũ?)';
  });
