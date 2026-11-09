// Âm lượng chung + tiếng tương tác cho mọi game (nạp TRƯỚC script game, dạng script thường).
// - Chia âm thanh thành 3 nhóm: nhạc nền (file trong assets/nhac-*), giọng đọc (/tts, giọng máy), hiệu ứng (WebAudio).
// - Nhận mức âm lượng từ bảng điều khiển qua máy chủ (lệnh "audio"), nhớ lại trong máy.
// - Phát tiếng ngắn dễ nhận ra khi người xem thả tim, bình luận, chia sẻ, theo dõi, tặng quà.
// - Trình duyệt chặn tiếng thì hiện nhắc "Bấm vào đây để bật âm thanh".
(function () {
  if (window.__amLuong) return;
  const params = new URLSearchParams(location.search);
  const silent = params.get('sound') === '0';
  const KEY = 'amLuongGame';
  const DEF = { music: 100, sfx: 100, voice: 100, cues: 70, mute: false };
  let S = { ...DEF };
  try { S = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* bỏ qua */ }

  const lv = (k) => (S.mute || silent ? 0 : Math.max(0, Math.min(150, Number(S[k]) || 0)) / 100);

  // ------------------------------------------------ hiệu ứng WebAudio: chèn một nút âm lượng trước loa
  const origConnect = AudioNode.prototype.connect;
  const origDisconnect = AudioNode.prototype.disconnect;
  const buses = new Map();
  const contexts = new Set();
  function bus(ctx) {
    let g = buses.get(ctx);
    if (!g) {
      g = ctx.createGain();
      g.gain.value = lv('sfx');
      origConnect.call(g, ctx.destination);
      buses.set(ctx, g);
      contexts.add(ctx);
    }
    return g;
  }
  AudioNode.prototype.connect = function (target, ...rest) {
    if (target instanceof AudioDestinationNode && !this.__amLuongBus) {
      return origConnect.call(this, bus(target.context), ...rest);
    }
    return origConnect.call(this, target, ...rest);
  };
  AudioNode.prototype.disconnect = function (target, ...rest) {
    if (target instanceof AudioDestinationNode && buses.has(target.context)) {
      try { return origDisconnect.call(this, buses.get(target.context), ...rest); } catch { return undefined; }
    }
    return origDisconnect.call(this, target, ...rest);
  };

  // ------------------------------------------------ nhạc nền + giọng đọc dạng <audio>
  const volDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume');
  const wanted = new WeakMap();
  const media = new Set();
  const kindOf = (el) => {
    const src = String(el.currentSrc || el.src || '');
    if (/\/tts\?/.test(src)) return 'voice';
    if (/assets\/nhac-|music|nhac/i.test(src)) return 'music';
    return 'sfx';
  };
  function apply(el) {
    const w = wanted.has(el) ? wanted.get(el) : 1;
    try { volDesc.set.call(el, Math.max(0, Math.min(1, w * lv(kindOf(el))))); } catch { /* bỏ qua */ }
  }
  Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
    configurable: true,
    get() { return wanted.has(this) ? wanted.get(this) : volDesc.get.call(this); },
    set(v) {
      wanted.set(this, Number(v));
      media.add(new WeakRef(this));
      apply(this);
    },
  });
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    media.add(new WeakRef(this));
    apply(this);
    const p = origPlay.call(this);
    if (p && p.catch) p.catch((e) => { if (e && e.name === 'NotAllowedError') showUnlock(); });
    return p;
  };
  if (window.speechSynthesis) {
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => {
      try { u.volume = Math.min(1, (u.volume ?? 1) * lv('voice')); } catch { /* bỏ qua */ }
      return speak(u);
    };
  }

  function applyAll() {
    for (const [ctx, g] of buses) {
      try { g.gain.setTargetAtTime(lv('sfx'), ctx.currentTime, 0.05); } catch { g.gain.value = lv('sfx'); }
    }
    for (const ref of media) {
      const el = ref.deref();
      if (el) apply(el);
      else media.delete(ref);
    }
  }

  // ------------------------------------------------ tiếng tương tác
  let cx = null;
  let cueOut = null;
  function cueCtx() {
    if (silent) return null;
    if (!cx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      cx = new AC();
      cueOut = cx.createGain();
      cueOut.__amLuongBus = true;
      cueOut.gain.value = lv('cues') * 0.9;
      origConnect.call(cueOut, cx.destination);
    }
    if (cx.state === 'suspended') cx.resume().catch(() => {});
    return cx;
  }
  function tone(f, t, dur, { type = 'sine', vol = 0.3, to = 0, attack = 0.004 } = {}) {
    const o = cx.createOscillator();
    const g = cx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    origConnect.call(o, g);
    origConnect.call(g, cueOut);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function whoosh(t, dur = 0.28, vol = 0.18) {
    const n = Math.floor(cx.sampleRate * dur);
    const buf = cx.createBuffer(1, n, cx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = cx.createBufferSource();
    s.buffer = buf;
    const f = cx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 2;
    f.frequency.setValueAtTime(600, t);
    f.frequency.exponentialRampToValueAtTime(5000, t + dur);
    const g = cx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    origConnect.call(s, f);
    origConnect.call(f, g);
    origConnect.call(g, cueOut);
    s.start(t);
  }
  const PENTA = [1568, 1760, 1976, 2349, 2637, 3136];
  let likeIdx = 0;
  const last = {};
  const gap = { like: 0.16, chat: 0.12, gift: 0.25, share: 0.35, follow: 0.5 };
  const CUES = {
    like() { // "ting" nhẹ, mỗi tim một nốt ngũ cung nối nhau nghe vui tai
      const t = cx.currentTime;
      const f = PENTA[likeIdx++ % PENTA.length];
      tone(f, t, 0.18, { vol: 0.16 });
      tone(f * 2, t, 0.08, { vol: 0.05 });
    },
    chat() { // "bụp" bong bóng
      const t = cx.currentTime;
      tone(420, t, 0.09, { vol: 0.2, to: 900 });
    },
    share() { // "vút" + "ting ting"
      const t = cx.currentTime;
      whoosh(t, 0.25, 0.2);
      tone(1976, t + 0.22, 0.25, { vol: 0.22, type: 'triangle' });
      tone(2637, t + 0.34, 0.35, { vol: 0.22, type: 'triangle' });
    },
    follow() { // "tèn ten"
      const t = cx.currentTime;
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.09, i === 3 ? 0.45 : 0.16, { vol: 0.2, type: 'triangle' }));
    },
    gift() { // tiếng xu leng keng
      const t = cx.currentTime;
      tone(2637, t, 0.2, { vol: 0.16, type: 'square' });
      tone(3520, t + 0.07, 0.3, { vol: 0.14, type: 'square' });
    },
  };
  function cue(kind) {
    if (lv('cues') <= 0 || !CUES[kind]) return;
    if (!cueCtx()) return;
    const now = cx.currentTime;
    if (last[kind] && now - last[kind] < gap[kind]) return;
    last[kind] = now;
    try { CUES[kind](); } catch { /* bỏ qua */ }
  }
  function testCues() {
    ['like', 'like', 'like', 'chat', 'share', 'follow', 'gift'].forEach((k, i) => setTimeout(() => { last[k] = 0; cue(k); }, i * 600));
  }

  // ------------------------------------------------ nhắc bật âm thanh
  let unlockEl = null;
  function showUnlock() {
    if (silent || unlockEl || /\/bar\.html/.test(location.pathname)) return;
    unlockEl = document.createElement('div');
    unlockEl.textContent = '🔇 Bấm vào đây để bật âm thanh';
    unlockEl.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99999;background:rgba(0,0,0,.78);color:#fff;font:600 18px system-ui,sans-serif;padding:10px 18px;border-radius:999px;border:2px solid #ffd54f;cursor:pointer;';
    (document.body || document.documentElement).appendChild(unlockEl);
  }
  function unlock() {
    for (const ctx of contexts) if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    cueCtx();
    if (unlockEl) { unlockEl.remove(); unlockEl = null; }
  }
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  setTimeout(() => {
    if (silent) return;
    const c = cueCtx();
    if (c && c.state !== 'running') setTimeout(() => { if (cx.state !== 'running') showUnlock(); }, 600);
  }, 2500);

  // ------------------------------------------------ nhận lệnh từ bảng điều khiển
  function set(next) {
    S = { ...DEF, ...next };
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* bỏ qua */ }
    if (cueOut) cueOut.gain.value = lv('cues') * 0.9;
    applyAll();
  }
  const CUE_OF = { like: 'like', chat: 'chat', share: 'share', follow: 'follow', gift: 'gift', subscribe: 'follow' };
  function connect() {
    if (location.protocol === 'file:') return;
    let ws;
    try { ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`); } catch { return; }
    ws.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.type === 'audio' && m.settings) set(m.settings);
      else if (m.type === 'audioTest') testCues();
      else if (CUE_OF[m.type]) cue(CUE_OF[m.type]);
    };
    ws.onclose = () => setTimeout(connect, 2500);
  }
  connect();
  window.__amLuong = { get: () => ({ ...S }), set, cue, testCues };
})();
