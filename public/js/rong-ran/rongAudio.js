// Âm thanh sân đình: nhạc sáo trúc + trống + phách theo âm giai ngũ cung (tự tạo), tiếng gió đồng quê,
// hiệu ứng (trống, chiêng, reo hò...). Tất cả tạo bằng WebAudio, không dùng file có bản quyền.
// Có thể thay nhạc bằng MP3 riêng (thư mục public/assets/nhac-rong-ran).
let ac = null;
let master = null;
let musicBus = null;
let ambBus = null;
let enabled = true;

export function setSoundEnabled(on) {
  enabled = on;
}

function ctx() {
  if (!enabled) return null;
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0.75;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master.connect(comp).connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

export function unlockAudio() {
  ctx();
  window.speechSynthesis?.getVoices();
}

let noiseBuf = null;
function noise(a) {
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const n = a.createBufferSource();
  n.buffer = noiseBuf;
  return n;
}

function env(g, t, peak, attack, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function tone({ type = 'sine', f0, f1, t, vol = 0.2, attack = 0.005, decay = 0.2, dest }) {
  const a = ac;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + attack + decay);
  env(g, t, vol, attack, decay);
  o.connect(g).connect(dest || master);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
}

function burst({ t, dur = 0.1, vol = 0.2, type = 'bandpass', freq = 2000, q = 1, dest }) {
  const a = ac;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = a.createGain();
  env(g, t, vol, 0.004, dur);
  n.connect(f).connect(g).connect(dest || master);
  n.start(t, Math.random() * 1.5);
  n.stop(t + dur + 0.05);
}

// ------------------------------------------------------------------ nhạc sáo trúc + trống
const BPM = 100;
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;
// ngũ cung Đô: C D F G A (kiểu điệu dân ca Bắc Bộ)
const PENTA = [523.25, 587.33, 698.46, 783.99, 880.0, 1046.5, 1174.66];
// giai điệu 4 câu, mỗi câu 16 nốt móc đơn; -1 = nghỉ, số = vị trí trong PENTA
const PHRASES = [
  [3, -1, 4, 3, 2, -1, 1, 2, 3, -1, -1, -1, 2, 1, 0, -1],
  [0, -1, 1, 2, 3, -1, 2, 3, 4, -1, 5, 4, 3, -1, -1, -1],
  [5, -1, 4, 5, 6, -1, 5, 4, 3, -1, 4, 3, 2, -1, 1, -1],
  [2, -1, 3, 2, 1, -1, 0, 1, 0, -1, -1, -1, -1, -1, -1, -1],
];
const BASS = [130.81, 174.61, 196.0, 130.81];

function flute(t, f, dur, vol = 0.07) {
  // sáo trúc: sóng sin có rung (vibrato) + chút tiếng hơi
  const a = ac;
  const o = a.createOscillator();
  const vib = a.createOscillator();
  const vg = a.createGain();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f * 0.985, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
  vib.frequency.value = 5.5;
  vg.gain.setValueAtTime(0, t);
  vg.gain.linearRampToValueAtTime(f * 0.012, t + dur * 0.6);
  vib.connect(vg).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
  g.gain.setValueAtTime(vol * 0.85, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
  const o2 = a.createOscillator();
  const g2 = a.createGain();
  o2.type = 'triangle';
  o2.frequency.value = f * 2;
  g2.gain.value = 0.12;
  o2.connect(g2).connect(g);
  o.connect(g).connect(musicBus);
  burst({ t, dur: 0.08, vol: vol * 0.25, type: 'bandpass', freq: f * 3, q: 3, dest: musicBus });
  for (const x of [o, vib, o2]) {
    x.start(t);
    x.stop(t + dur + 0.2);
  }
}

function drumHit(t, vol = 0.18, dest = musicBus) {
  tone({ type: 'sine', f0: 150, f1: 55, t, vol, attack: 0.003, decay: 0.32, dest });
  burst({ t, dur: 0.06, vol: vol * 0.3, type: 'lowpass', freq: 900, dest });
}
function clapper(t, vol = 0.07, dest = musicBus) {
  // phách gỗ: tiếng tách khô
  tone({ type: 'square', f0: 1700, f1: 1100, t, vol: vol * 0.5, attack: 0.001, decay: 0.035, dest });
  burst({ t, dur: 0.025, vol, type: 'bandpass', freq: 2600, q: 4, dest });
}

function scheduleStep(step, t) {
  const stepDur = 60 / BPM / 2;
  const phrase = Math.floor(step / 16) % PHRASES.length;
  const s16 = step % 16;
  const note = PHRASES[phrase][s16];
  if (note >= 0) {
    let len = 1;
    while (s16 + len < 16 && PHRASES[phrase][s16 + len] === -1 && len < 4) len++;
    flute(t, PENTA[note], stepDur * len * 0.95);
  }
  // đàn bầu trầm giữ nhịp
  if (s16 === 0 || s16 === 8) pluckLow(t, BASS[phrase] * (s16 === 8 ? 1.5 : 1));
  // trống + phách
  if (s16 % 4 === 0) drumHit(t, s16 === 0 ? 0.16 : 0.1);
  if (s16 % 2 === 1) clapper(t, s16 % 4 === 3 ? 0.06 : 0.035);
}

function pluckLow(t, f) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  o.type = 'triangle';
  o.frequency.setValueAtTime(f, t);
  o.frequency.linearRampToValueAtTime(f * 1.03, t + 0.5);
  env(g, t, 0.08, 0.004, 1.1);
  o.connect(lp).connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + 1.2);
}

function scheduler() {
  const stepDur = 60 / BPM / 2;
  while (nextStep < ac.currentTime + 0.15) {
    scheduleStep(stepIdx, nextStep);
    nextStep += stepDur;
    stepIdx++;
  }
}

// tiếng gió đồng quê nền
let ambNode = null;
function startAmbience(volume) {
  if (ambNode) return;
  const a = ac;
  ambBus = a.createGain();
  ambBus.gain.value = volume;
  ambBus.connect(master);
  const n = noise(a);
  n.loop = true;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  const lfo = a.createOscillator();
  const lfoG = a.createGain();
  lfo.frequency.value = 0.07;
  lfoG.gain.value = 120;
  lfo.connect(lfoG).connect(lp.frequency);
  n.connect(lp).connect(ambBus);
  n.start();
  lfo.start();
  ambNode = n;
}

let fileEl = null;
let playlist = [];
let trackIdx = 0;
let fails = 0;
let fileVolume = 0.6;
function playTrack() {
  if (!fileEl || !playlist.length) return;
  fileEl.src = playlist[trackIdx % playlist.length];
  fileEl.volume = fileVolume;
  fileEl.play().then(() => {
    fails = 0;
  }).catch((err) => {
    if (err && err.name === 'NotAllowedError') {
      musicOn = false;
      return;
    }
    if (err && err.name === 'AbortError') return;
    nextTrack(true);
  });
}
function nextTrack(failed) {
  if (failed) fails++;
  if (fails >= playlist.length) {
    console.warn('[nhạc] Không phát được bài nào, dùng nhạc sáo trúc tự tạo.');
    fileEl = null;
    playlist = [];
    startGenerated();
    return;
  }
  trackIdx = (trackIdx + 1) % playlist.length;
  playTrack();
}

function startGenerated() {
  nextStep = ac.currentTime + 0.1;
  stepIdx = 0;
  clearInterval(timer);
  timer = setInterval(scheduler, 30);
}

export function musicAudible() {
  if (fileEl) return !fileEl.paused;
  return Boolean(musicOn && ac && ac.state === 'running');
}

export function startMusic({ files = [], volume = 0.3, ambience = 0.12 } = {}) {
  if (musicOn) return;
  const a = ctx();
  if (!a) return;
  if (!musicBus) {
    musicBus = a.createGain();
    musicBus.connect(master);
  }
  musicBus.gain.value = volume;
  startAmbience(ambience);
  musicOn = true;
  if (files.length) {
    if (!fileEl) {
      playlist = files;
      fileVolume = Math.min(1, volume * 2);
      fileEl = new Audio();
      fileEl.addEventListener('ended', () => nextTrack(false));
      fileEl.addEventListener('error', () => nextTrack(true));
    }
    playTrack();
    return;
  }
  startGenerated();
}

let duckTimer = null;
let baseGain = null;
export function duck(ms = 4000, level = 0.4) {
  if (!ac || !musicBus) return;
  if (baseGain == null) baseGain = musicBus.gain.value;
  musicBus.gain.setTargetAtTime(baseGain * level, ac.currentTime, 0.08);
  if (fileEl) fileEl.volume = fileVolume * level;
  clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    if (ac) musicBus.gain.setTargetAtTime(baseGain, ac.currentTime, 0.4);
    if (fileEl) fileEl.volume = fileVolume;
  }, ms);
}

// ------------------------------------------------------------------ hiệu ứng
const last = {};
function throttle(name, ms) {
  const n = performance.now();
  if (last[name] && n - last[name] < ms) return false;
  last[name] = n;
  return true;
}

// đá lách cách trong cốc
export function clink() {
  const a = ctx();
  if (!a || !throttle('clink', 60)) return;
  const t = a.currentTime;
  for (let i = 0; i < 3; i++) {
    tone({ type: 'sine', f0: 2400 + Math.random() * 1600, t: t + i * 0.06 + Math.random() * 0.02, vol: 0.06, decay: 0.12 });
  }
}

// ực ực
export function gulp() {
  const a = ctx();
  if (!a || !throttle('gulp', 120)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 420, f1: 160, t, vol: 0.18, attack: 0.01, decay: 0.12 });
  tone({ type: 'sine', f0: 380, f1: 150, t: t + 0.22, vol: 0.14, attack: 0.01, decay: 0.12 });
}

// rót trà từ vòi bình
export function pour(dur = 0.7) {
  const a = ctx();
  if (!a || !throttle('pour', 150)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 3;
  f.frequency.setValueAtTime(900, t);
  f.frequency.linearRampToValueAtTime(1600, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
  g.gain.setValueAtTime(0.12, t + dur - 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + dur + 0.05);
}

// rít điếu cày: tiếng nước ục ục trong ống tre
export function bubble(dur = 1.4) {
  const a = ctx();
  if (!a || !throttle('bubble', 300)) return;
  const t = a.currentTime;
  const n = Math.floor(dur * 22);
  for (let i = 0; i < n; i++) {
    const tt = t + (i / n) * dur + Math.random() * 0.02;
    const f = 160 + Math.random() * 220 + (i / n) * 120;
    tone({ type: 'sine', f0: f, f1: f * 2.2, t: tt, vol: 0.09 + Math.random() * 0.05, attack: 0.003, decay: 0.05 });
  }
  burst({ t, dur, vol: 0.03, type: 'lowpass', freq: 500 });
}

// phả khói
export function puff() {
  const a = ctx();
  if (!a || !throttle('puff', 200)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(1800, t);
  f.frequency.exponentialRampToValueAtTime(300, t + 0.9);
  const g = a.createGain();
  env(g, t, 0.16, 0.05, 0.85);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 1);
}

// cắn kẹo lạc giòn rụm
export function crunch() {
  const a = ctx();
  if (!a || !throttle('crunch', 120)) return;
  const t = a.currentTime;
  for (let i = 0; i < 4; i++) burst({ t: t + i * 0.07 + Math.random() * 0.02, dur: 0.05, vol: 0.14, type: 'bandpass', freq: 1800 + Math.random() * 1500, q: 2 });
}

// tách hạt hướng dương
export function crack() {
  const a = ctx();
  if (!a || !throttle('crack', 90)) return;
  burst({ t: a.currentTime, dur: 0.03, vol: 0.12, type: 'highpass', freq: 3000 });
}

export function pop() {
  const a = ctx();
  if (!a || !throttle('pop', 50)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 600 + Math.random() * 300, f1: 1200, t, vol: 0.08, attack: 0.003, decay: 0.08 });
}

// gió vù vù (chém gió)
export function wind() {
  const a = ctx();
  if (!a || !throttle('wind', 400)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 4;
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(1400, t + 0.6);
  f.frequency.exponentialRampToValueAtTime(400, t + 1.2);
  const g = a.createGain();
  env(g, t, 0.14, 0.2, 1.0);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 1.3);
}

// còi xe máy "bim bim"
export function honk(far = false) {
  const a = ctx();
  if (!a || !throttle('honk', 500)) return;
  const t = a.currentTime;
  const vol = far ? 0.03 : 0.07;
  for (const [dt, d] of [[0, 0.12], [0.18, 0.2]]) {
    tone({ type: 'square', f0: 420, t: t + dt, vol, attack: 0.01, decay: d });
    tone({ type: 'square', f0: 528, t: t + dt, vol: vol * 0.8, attack: 0.01, decay: d });
  }
}

// chuông xe đạp
export function bell() {
  const a = ctx();
  if (!a || !throttle('bell', 400)) return;
  const t = a.currentTime;
  for (let i = 0; i < 2; i++) {
    tone({ type: 'sine', f0: 2100, t: t + i * 0.12, vol: 0.06, decay: 0.4 });
    tone({ type: 'sine', f0: 3150, t: t + i * 0.12, vol: 0.03, decay: 0.3 });
  }
}

// lạch cạch quân cờ
export function chessTap() {
  const a = ctx();
  if (!a || !throttle('chess', 200)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 900, f1: 500, t, vol: 0.12, attack: 0.002, decay: 0.05 });
}

export function paper() {
  const a = ctx();
  if (!a || !throttle('paper', 400)) return;
  burst({ t: a.currentTime, dur: 0.25, vol: 0.06, type: 'highpass', freq: 2500 });
}

export function coins() {
  const a = ctx();
  if (!a || !throttle('coins', 120)) return;
  const t = a.currentTime;
  for (let i = 0; i < 5; i++) tone({ type: 'triangle', f0: 1800 + Math.random() * 1400, t: t + i * 0.05, vol: 0.05, decay: 0.2 });
}

export function sparkle() {
  const a = ctx();
  if (!a || !throttle('sparkle', 100)) return;
  const t = a.currentTime;
  [1318, 1568, 2093, 2637].forEach((f, i) => tone({ type: 'sine', f0: f, t: t + i * 0.06, vol: 0.05, decay: 0.35 }));
}

// cả quán hô "dzô" + vỗ tay
export function cheer() {
  const a = ctx();
  if (!a || !throttle('cheer', 800)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1200;
  f.Q.value = 0.6;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 1.9);
  for (let i = 0; i < 14; i++) burst({ t: t + 0.1 + Math.random() * 1.3, dur: 0.03, vol: 0.08, type: 'bandpass', freq: 1500 + Math.random() * 1000 });
  for (let i = 0; i < 8; i++) clapper(t + 0.1 + i * 0.12, 0.08, master);
}

export function fanfare() {
  const a = ctx();
  if (!a || !throttle('fanfare', 1000)) return;
  const t = a.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    tone({ type: 'triangle', f0: f, t: t + i * 0.12, vol: 0.12, attack: 0.01, decay: i === 3 ? 0.9 : 0.25 });
    tone({ type: 'square', f0: f / 2, t: t + i * 0.12, vol: 0.03, attack: 0.01, decay: i === 3 ? 0.8 : 0.2 });
  });
}

export function whoosh() {
  const a = ctx();
  if (!a || !throttle('whoosh', 120)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.5;
  f.frequency.setValueAtTime(600, t);
  f.frequency.exponentialRampToValueAtTime(3000, t + 0.25);
  const g = a.createGain();
  env(g, t, 0.08, 0.05, 0.22);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 0.35);
}

// còi tuýt tuýt
export function whistle() {
  const a = ctx();
  if (!a || !throttle('whistle', 600)) return;
  const t = a.currentTime;
  for (const [dt, d] of [[0, 0.25], [0.35, 0.6]]) {
    const o = a.createOscillator();
    const lfo = a.createOscillator();
    const lg = a.createGain();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.value = 2900;
    lfo.frequency.value = 38;
    lg.gain.value = 160;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t + dt);
    g.gain.exponentialRampToValueAtTime(0.14, t + dt + 0.02);
    g.gain.setValueAtTime(0.14, t + dt + d - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dt + d);
    o.connect(g).connect(master);
    o.start(t + dt);
    lfo.start(t + dt);
    o.stop(t + dt + d + 0.05);
    lfo.stop(t + dt + d + 0.05);
  }
}

// gâu gâu
export function bark() {
  const a = ctx();
  if (!a || !throttle('bark', 280)) return;
  const t = a.currentTime;
  for (const dt of [0, 0.22]) {
    tone({ type: 'sawtooth', f0: 520, f1: 260, t: t + dt, vol: 0.12, attack: 0.01, decay: 0.12 });
    burst({ t: t + dt, dur: 0.1, vol: 0.08, type: 'bandpass', freq: 900, q: 2 });
  }
}

// cả quán nháo nhào bỏ chạy
export function panic() {
  const a = ctx();
  if (!a || !throttle('panic', 1500)) return;
  const t = a.currentTime;
  for (let i = 0; i < 6; i++) {
    const tt = t + i * 0.18 + Math.random() * 0.1;
    const f = 500 + Math.random() * 400;
    tone({ type: 'triangle', f0: f, f1: f * 1.6, t: tt, vol: 0.05, attack: 0.03, decay: 0.25 });
  }
  for (let i = 0; i < 10; i++) burst({ t: t + Math.random() * 1.2, dur: 0.05, vol: 0.07, type: 'bandpass', freq: 600 + Math.random() * 800 });
}

// tiếng ghế nhựa va vào nhau
export function clack() {
  const a = ctx();
  if (!a || !throttle('clack', 70)) return;
  const t = a.currentTime;
  tone({ type: 'square', f0: 300 + Math.random() * 200, f1: 150, t, vol: 0.05, attack: 0.002, decay: 0.06 });
}

export function engine(dur = 2) {
  const a = ctx();
  if (!a || !throttle('engine', 1000)) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(48, t);
  o.frequency.linearRampToValueAtTime(70, t + dur * 0.5);
  o.frequency.linearRampToValueAtTime(45, t + dur);
  f.type = 'lowpass';
  f.frequency.value = 300;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// trống hội: tùng tùng
export function drum(n = 2) {
  const a = ctx();
  if (!a || !throttle('drum', 150)) return;
  const t = a.currentTime;
  for (let i = 0; i < n; i++) drumHit(t + i * 0.16, 0.28, master);
}

// chiêng: boong
export function gong() {
  const a = ctx();
  if (!a || !throttle('gong', 800)) return;
  const t = a.currentTime;
  for (const [f, v] of [[196, 0.16], [293.7, 0.07], [415, 0.05], [587, 0.03]]) {
    tone({ type: 'sine', f0: f * 1.02, f1: f, t, vol: v, attack: 0.01, decay: 3.2 });
  }
  burst({ t, dur: 0.12, vol: 0.08, type: 'lowpass', freq: 1200 });
}

// phách gõ một tiếng
export function clap() {
  const a = ctx();
  if (!a || !throttle('clap', 60)) return;
  clapper(a.currentTime, 0.1, master);
}

// bắt được: bốp
export function bonk() {
  const a = ctx();
  if (!a || !throttle('bonk', 200)) return;
  const t = a.currentTime;
  tone({ type: 'square', f0: 420, f1: 90, t, vol: 0.12, attack: 0.002, decay: 0.18 });
  burst({ t, dur: 0.08, vol: 0.12, type: 'lowpass', freq: 1500 });
  tone({ type: 'sine', f0: 900, f1: 1400, t: t + 0.18, vol: 0.05, attack: 0.01, decay: 0.3 });
}

// trượt chân ngã: tuột... bịch
export function slip() {
  const a = ctx();
  if (!a || !throttle('slip', 500)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 1200, f1: 200, t, vol: 0.08, attack: 0.01, decay: 0.45 });
  drumHit(t + 0.5, 0.25, master);
}

// rồng bay: tiếng vút lên cao
export function rise() {
  const a = ctx();
  if (!a || !throttle('rise', 1500)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 2;
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(4000, t + 2.2);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 2.7);
  PENTA.forEach((fr, i) => tone({ type: 'sine', f0: fr, t: t + 0.3 + i * 0.14, vol: 0.06, decay: 0.6 }));
}
