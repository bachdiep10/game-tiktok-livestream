// Âm thanh quán trà đá: nhạc guitar mộc tự tạo + tiếng phố (xe cộ) + hiệu ứng (đá lách cách, rít điếu cày...).
// Tất cả tạo bằng WebAudio, không dùng file có bản quyền. Có thể thay nhạc bằng MP3 riêng
// (thư mục public/assets/nhac-tra-da).
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

// ------------------------------------------------------------------ nhạc guitar mộc
const BPM = 84;
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;
// C - Am - F - G (âm giai Đô trưởng), mỗi hợp âm 2 ô nhịp
const CHORDS = [
  [130.81, 196.0, 261.63, 329.63, 392.0],
  [110.0, 164.81, 220.0, 261.63, 329.63],
  [87.31, 174.61, 220.0, 261.63, 349.23],
  [98.0, 146.83, 196.0, 246.94, 293.66],
];
const PICK = [0, 2, 3, 4, 1, 3, 2, 4];
const MELODY = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];

function pluck(t, f, vol = 0.09) {
  // dây đàn: sóng tam giác tắt nhanh qua lọc thấp
  const a = ac;
  const o = a.createOscillator();
  const o2 = a.createOscillator();
  const g = a.createGain();
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(f * 6, t);
  lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.6);
  o.type = 'triangle';
  o2.type = 'sawtooth';
  o.frequency.value = f;
  o2.frequency.value = f * 1.002;
  const g2 = a.createGain();
  g2.gain.value = 0.25;
  env(g, t, vol, 0.004, 1.4);
  o.connect(lp);
  o2.connect(g2).connect(lp);
  lp.connect(g).connect(musicBus);
  o.start(t);
  o2.start(t);
  o.stop(t + 1.5);
  o2.stop(t + 1.5);
}

function scheduleStep(step, t) {
  const bar = Math.floor(step / 8);
  const chord = CHORDS[Math.floor(bar / 2) % 4];
  const s8 = step % 8;
  pluck(t, chord[PICK[s8]], s8 === 0 ? 0.11 : 0.07);
  // giai điệu thưa
  if (s8 === 0 && bar % 2 === 1) pluck(t, MELODY[(bar * 3) % MELODY.length], 0.05);
  if (s8 === 4 && bar % 4 === 3) pluck(t, MELODY[(bar * 5 + 2) % MELODY.length], 0.045);
  // tiếng gõ nhẹ
  if (s8 === 2 || s8 === 6) burst({ t, dur: 0.05, vol: 0.025, type: 'highpass', freq: 6000, dest: musicBus });
}

function scheduler() {
  const stepDur = 60 / BPM / 2;
  while (nextStep < ac.currentTime + 0.15) {
    scheduleStep(stepIdx, nextStep);
    nextStep += stepDur;
    stepIdx++;
  }
}

// tiếng phố nền: ù ù xe cộ ở xa
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
  lp.frequency.value = 380;
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
    console.warn('[nhạc] Không phát được bài nào, dùng nhạc tự tạo.');
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
  for (let i = 0; i < 6; i++) setTimeout(clink, 100 + i * 90);
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
