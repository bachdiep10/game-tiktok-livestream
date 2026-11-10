import { randomUser } from '../fake.js';

const $ = (s) => document.querySelector(s);
const GAME = 'go-bom.html';
const statusEl = $('#status');
$('#gameUrl').textContent = `${location.origin}/${GAME}`;
$('#username').value = localStorage.getItem('tiktokUsername') || '';

const previewSound = $('#previewSound');
previewSound.checked = localStorage.getItem('goBomPreviewSound') === '1';
function loadPreview() {
  $('#preview').src = `${GAME}?preview=1${previewSound.checked ? '' : '&sound=0'}`;
}
previewSound.addEventListener('change', () => {
  localStorage.setItem('goBomPreviewSound', previewSound.checked ? '1' : '0');
  loadPreview();
});
loadPreview();

let ws;
const pending = [];
const PHASE = { enter: 'boss mới vào', vote: 'đang bỏ phiếu', suspense: 'sắp cắt', cutAnim: 'vừa cắt', saved: 'đã cứu', boom: 'vừa nổ' };
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
      $('#answer').textContent = s.answer || '...';
      $('#levelNow').textContent = `Đang chơi: ${s.boss ? 'BOM TRÙM' : 'cấp ' + s.level}${s.levelMode === 'co-dinh' ? ' (cố định)' : ' (tự động)'}.`;
      syncLevel(s);
      const c = (s.counts || []).map((n, i) => `${'ABCDE'[i]}: ${n}`).join(' · ');
      $('#answerInfo').textContent = `Bom số ${s.bomb}${s.boss ? ' (TRÙM)' : ''} · ${s.hostage} · cọc ${s.stage}/${s.wires} · còn ${s.left}s · sai ${s.wrongs} · ${PHASE[s.phase] || s.phase} · phiếu ${c} · đã cứu ${s.saved}, nổ ${s.exploded}`;
    }
    if (msg.type === 'status') {
      const s = msg.status;
      statusEl.textContent = `${s.message}${s.viewers ? ` · ${s.viewers} người xem` : ''}${s.version ? ` (bản ${s.version})` : ' (bản cũ)'}`;
      statusEl.classList.toggle('ok', Boolean(s.connected));
    }
  };
  ws.onclose = () => {
    statusEl.textContent = 'Mất kết nối máy chủ (cửa sổ đen run-go-bom.bat có đang chạy không?)';
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
const CHATS = ['hồi hộp quá', 'cứu boss đi', 'dây xanh hay đỏ', 'haha', 'sắp nổ rồi', 'dễ mà', 'chào cả nhà', 'run tay quá'];

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
  correct: () => sim({ type: 'simVote', user: namedUser(), opt: 'correct' }),
  wrong: () => sim({ type: 'simVote', user: namedUser(), opt: 'wrong' }),
  burn: () => sim({ type: 'chat', user: namedUser(), text: 'đốt' }),
  chat: () => sim({ type: 'chat', user: namedUser(), text: pick(CHATS) }),
  like: () => sim({ type: 'like', user: namedUser(), count: 1 + Math.floor(Math.random() * 4) }),
  like15: () => sim({ type: 'like', user: namedUser(), count: 15 }),
  follow: () => sim({ type: 'follow', user: namedUser() }),
  share: () => sim({ type: 'share', user: namedUser() }),
  gift1: () => sim({ type: 'gift', user: namedUser(), giftName: 'Hoa hồng', diamonds: 1, repeatCount: 1, coins: 1 }),
  gift100: () => sim({ type: 'gift', user: namedUser(), giftName: 'Vương miện', diamonds: 99, repeatCount: 1, coins: 99 }),
  nextBomb: () => sim({ type: 'nextBomb' }),
  testBoom: () => sim({ type: 'testBoom' }),
  testSave: () => sim({ type: 'testSave' }),
  voiceTest: () => sim({ type: 'voiceTest' }),
  skip: () => sim({ type: 'skip' }),
  pause: () => sim({ type: 'pause' }),
  reset: () => {
    if (confirm('Xoá hết điểm và số boss đã cứu?')) sim({ type: 'reset' });
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
$('#btnVoteAll').addEventListener('click', () => {
  simUsers.forEach((u, i) => setTimeout(() => sim({ type: 'chat', user: u, text: pick(['A', 'B', 'C', 'D', 'cắt b', 'chọn c', 'a', 'đốt']) }), i * 120));
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
  const keys = ['join', 'correct', 'wrong', 'chat', 'like', 'follow', 'share', 'gift1', 'burn'];
  const weights = [3, 6, 3.5, 2, 10, 0.4, 0.5, 0.2, 0.5];
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

fetch('/go-bom-music.json', { cache: 'no-store' })
  .then((r) => r.json())
  .then((list) => {
    $('#musicInfo').textContent = list.length
      ? `🎵 Nhạc: ${list.length} bài trong thư mục public/assets/nhac-go-bom: ${list.map((f) => decodeURIComponent(f.split('/').pop())).join(', ')}`
      : '🎵 Thư mục public/assets/nhac-go-bom đang trống, game dùng nhạc hồi hộp tự tạo (nhanh dần khi bom sắp nổ).';
  })
  .catch(() => {
    $('#musicInfo').textContent = '🎵 Không đọc được danh sách nhạc (máy chủ bản cũ?)';
  });

// ---- Độ khó: người phát LIVE chọn tự động hoặc cố định cấp 1–8 ----
const levelSel = $('#levelSel');
levelSel.value = localStorage.getItem('goBomLevel') || '0';
function levelEvent(now) {
  const v = Number(levelSel.value) || 0;
  return { type: 'setLevel', auto: v === 0, level: v || undefined, now };
}
levelSel.addEventListener('change', () => {
  localStorage.setItem('goBomLevel', levelSel.value);
  sim(levelEvent(false));
});
$('#btnLevel').addEventListener('click', () => {
  localStorage.setItem('goBomLevel', levelSel.value);
  sim(levelEvent(true));
});
// cửa sổ game mở lại (hoặc mở ở trình duyệt khác) thì gửi lại lựa chọn đã lưu
let lastLevelSync = 0;
function syncLevel(s) {
  const v = Number(levelSel.value) || 0;
  const want = v === 0 ? 'tu-dong' : 'co-dinh';
  const ok = s.levelMode === want && (v === 0 || s.boss || s.level === v);
  if (ok || Date.now() - lastLevelSync < 5000) return;
  lastLevelSync = Date.now();
  sim(levelEvent(false));
}
