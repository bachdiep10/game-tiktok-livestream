// Âm thanh game Đảo Linh Thú: nhạc nền nhiệt đới vui nhộn tự tạo (marimba + ukulele + trống bongo),
// tiếng bong bóng, nước, sét, băng, boss, rương, vàng... Tạo bằng WebAudio, không dùng file có bản quyền.
// Có thể thay nhạc bằng MP3 riêng (thư mục public/assets/nhac-dao-linh-thu).
let ac = null;
let master = null;
let musicBus = null;
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
    master.gain.value = 0.8;
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

function tone({ type = 'sine', f0, f1, t, vol = 0.2, attack = 0.005, decay = 0.3, dest }) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + attack + decay);
  env(g, t, vol, attack, decay);
  o.connect(g).connect(dest || master);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
}

function burst({ t, dur = 0.1, vol = 0.2, type = 'bandpass', freq = 2000, q = 1, dest }) {
  const n = noise(ac);
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  env(g, t, vol, 0.004, dur);
  n.connect(f).connect(g).connect(dest || master);
  n.start(t, Math.random());
  n.stop(t + dur + 0.05);
}


// ------------------------------------------------------------------ nhạc nền tự tạo
// Đô trưởng vui tươi: C - Am - F - G, nhịp 112
const BPM = 112;
const CHORDS = [
  [130.81, 261.63, 329.63, 392.0],
  [110.0, 220.0, 261.63, 329.63],
  [87.31, 174.61, 220.0, 261.63],
  [98.0, 196.0, 246.94, 293.66],
];
// giai điệu marimba: mỗi ô nhịp 8 nốt móc đơn (0 = nghỉ)
const MELODY = [
  [523.25, 0, 659.25, 783.99, 0, 659.25, 783.99, 880.0],
  [880.0, 0, 783.99, 659.25, 0, 523.25, 587.33, 0],
  [698.46, 0, 659.25, 587.33, 0, 523.25, 587.33, 659.25],
  [587.33, 0, 493.88, 587.33, 783.99, 0, 0, 0],
];
const MELODY_B = [
  [783.99, 783.99, 0, 659.25, 783.99, 0, 1046.5, 0],
  [880.0, 0, 659.25, 0, 523.25, 0, 659.25, 0],
  [698.46, 698.46, 0, 880.0, 783.99, 0, 698.46, 0],
  [783.99, 0, 698.46, 0, 587.33, 0, 493.88, 0],
];
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;

function marimba(t, f, vol = 0.07) {
  tone({ type: 'sine', f0: f, t, vol, attack: 0.003, decay: 0.35, dest: musicBus });
  tone({ type: 'sine', f0: f * 4, t, vol: vol * 0.18, attack: 0.002, decay: 0.08, dest: musicBus });
}
function uke(t, chord) {
  // gảy rải 4 dây
  chord.slice(1).concat([chord[1] * 2]).forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    o.type = 'triangle';
    o.frequency.value = f;
    env(g, t + i * 0.018, 0.028, 0.004, 0.32);
    o.connect(lp).connect(g).connect(musicBus);
    o.start(t + i * 0.018);
    o.stop(t + i * 0.018 + 0.4);
  });
}
function bassNote(t, f, dur) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.value = f;
  env(g, t, 0.11, 0.01, dur);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function bongo(t, hi) {
  tone({ type: 'sine', f0: hi ? 420 : 260, f1: hi ? 300 : 180, t, vol: 0.07, decay: 0.12, dest: musicBus });
}
function shaker(t) {
  burst({ t, dur: 0.04, vol: 0.022, type: 'highpass', freq: 6000, dest: musicBus });
}

function scheduleStep(step, t) {
  const beat = 60 / BPM;
  const bar = Math.floor(step / 8);
  const s8 = step % 8;
  const chord = CHORDS[bar % 4];
  if (s8 === 0 || s8 === 4) bassNote(t, chord[0], beat * 0.9);
  if (s8 === 3 || s8 === 7) bassNote(t, chord[0] * 1.5, beat * 0.4);
  if (s8 === 2 || s8 === 6) uke(t, chord);
  if (s8 === 0 || s8 === 3 || s8 === 5) bongo(t, s8 !== 0);
  shaker(t);
  const mel = Math.floor(bar / 4) % 2 === 0 ? MELODY : MELODY_B;
  const f = mel[bar % 4][s8];
  if (f) {
    marimba(t, f);
    marimba(t + 0.22, f, 0.02);
  }
}

function scheduler() {
  const stepDur = 60 / BPM / 2;
  while (nextStep < ac.currentTime + 0.2) {
    scheduleStep(stepIdx, nextStep);
    nextStep += stepDur;
    stepIdx++;
  }
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
  timer = setInterval(scheduler, 40);
}

export function musicAudible() {
  if (fileEl) return !fileEl.paused;
  return Boolean(musicOn && ac && ac.state === 'running');
}

export function startMusic({ files = [], volume = 0.35 } = {}) {
  if (musicOn) return;
  const a = ctx();
  if (!a) return;
  if (!musicBus) {
    musicBus = a.createGain();
    musicBus.connect(master);
  }
  musicBus.gain.value = volume;
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
export function duck(ms = 4000, level = 0.45) {
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
  const now = performance.now();
  if (last[name] && now - last[name] < ms) return false;
  last[name] = now;
  return true;
}

export function pop() {
  const a = ctx();
  if (!a || !throttle('pop', 70)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 600 + Math.random() * 400, f1: 1500, t, vol: 0.05, decay: 0.1 });
}

// bong bóng nước khi tắm
export function bubbles() {
  const a = ctx();
  if (!a || !throttle('bubbles', 250)) return;
  const t = a.currentTime;
  for (let i = 0; i < 6; i++) tone({ type: 'sine', f0: 400 + Math.random() * 500, f1: 1200 + Math.random() * 600, t: t + i * 0.06, vol: 0.04, decay: 0.08 });
  burst({ t, dur: 0.5, vol: 0.05, type: 'highpass', freq: 3000 });
}

export function splash() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 0.6, vol: 0.25, type: 'lowpass', freq: 1400, q: 0.5 });
  burst({ t: t + 0.05, dur: 0.4, vol: 0.12, type: 'highpass', freq: 2500 });
}

export function boing() {
  const a = ctx();
  if (!a || !throttle('boing', 200)) return;
  const t = a.currentTime;
  tone({ type: 'triangle', f0: 180, f1: 520, t, vol: 0.12, attack: 0.01, decay: 0.25 });
}

// gỗ: tiếng búa gõ
export function knock() {
  const a = ctx();
  if (!a || !throttle('knock', 120)) return;
  const t = a.currentTime;
  tone({ type: 'square', f0: 220, f1: 120, t, vol: 0.05, decay: 0.06 });
  burst({ t, dur: 0.05, vol: 0.12, type: 'bandpass', freq: 900, q: 3 });
}

export function coin() {
  const a = ctx();
  if (!a || !throttle('coin', 80)) return;
  const t = a.currentTime;
  tone({ type: 'square', f0: 987.77, t, vol: 0.035, decay: 0.08 });
  tone({ type: 'square', f0: 1318.5, t: t + 0.07, vol: 0.035, decay: 0.25 });
}

export function plop() {
  const a = ctx();
  if (!a || !throttle('plop', 120)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 320, f1: 70, t, vol: 0.22, decay: 0.2 });
  burst({ t, dur: 0.1, vol: 0.08, type: 'lowpass', freq: 600 });
}

export function zap() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 0.5, vol: 0.35, type: 'highpass', freq: 1800 });
  tone({ type: 'sawtooth', f0: 1200, f1: 60, t, vol: 0.12, decay: 0.6 });
  for (let i = 0; i < 8; i++) tone({ type: 'square', f0: 80 + Math.random() * 300, t: t + 0.05 + i * 0.04, vol: 0.04, decay: 0.04 });
  burst({ t: t + 0.25, dur: 1.4, vol: 0.3, type: 'lowpass', freq: 180 });
}

export function freeze() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  [2093, 2637, 3136, 2349, 2793].forEach((f, i) => tone({ type: 'sine', f0: f, t: t + i * 0.06, vol: 0.05, decay: 0.5 }));
  burst({ t, dur: 0.8, vol: 0.12, type: 'highpass', freq: 5000 });
}

export function crack() {
  const a = ctx();
  if (!a || !throttle('crack', 60)) return;
  const t = a.currentTime;
  burst({ t, dur: 0.06, vol: 0.18, type: 'highpass', freq: 3000 });
}

export function roar() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 600;
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(90, t);
  o.frequency.linearRampToValueAtTime(140, t + 0.4);
  o.frequency.linearRampToValueAtTime(60, t + 1.6);
  env(g, t, 0.3, 0.1, 1.6);
  o.connect(lp).connect(g).connect(master);
  o.start(t);
  o.stop(t + 1.8);
  burst({ t, dur: 1.5, vol: 0.2, type: 'lowpass', freq: 400 });
}

export function hit() {
  const a = ctx();
  if (!a || !throttle('hit', 70)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 160, f1: 50, t, vol: 0.2, decay: 0.14 });
  burst({ t, dur: 0.07, vol: 0.12, type: 'bandpass', freq: 1500 });
}

export function chest() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone({ type: 'sawtooth', f0: 200, f1: 120, t, vol: 0.04, decay: 0.2 });
  [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => tone({ type: 'triangle', f0: f, t: t + 0.15 + i * 0.06, vol: 0.06, decay: 0.4 }));
  for (let i = 0; i < 6; i++) coinAt(t + 0.4 + i * 0.08);
}
function coinAt(t) {
  tone({ type: 'square', f0: 1318.5 + Math.random() * 300, t, vol: 0.02, decay: 0.12 });
}

export function thud() {
  const a = ctx();
  if (!a || !throttle('thud', 150)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 120, f1: 40, t, vol: 0.25, decay: 0.25 });
}

export function fanfare() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const seq = [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.36], [783.99, 0.6], [1046.5, 0.75]];
  for (const [f, d] of seq) {
    tone({ type: 'square', f0: f, t: t + d, vol: 0.04, attack: 0.01, decay: d >= 0.75 ? 1.2 : 0.2 });
    tone({ type: 'triangle', f0: f / 2, t: t + d, vol: 0.06, attack: 0.01, decay: d >= 0.75 ? 1.2 : 0.2 });
  }
}

export function sad() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  [[392, 0], [369.99, 0.3], [349.23, 0.6], [329.63, 0.9]].forEach(([f, d]) => tone({ type: 'triangle', f0: f, f1: d === 0.9 ? f * 0.8 : 0, t: t + d, vol: 0.08, decay: d === 0.9 ? 1 : 0.28 }));
}

export function alarm() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < 4; i++) {
    tone({ type: 'square', f0: 880, t: t + i * 0.3, vol: 0.05, decay: 0.12 });
    tone({ type: 'square', f0: 660, t: t + i * 0.3 + 0.15, vol: 0.05, decay: 0.12 });
  }
}

export function whoosh() {
  const a = ctx();
  if (!a || !throttle('whoosh', 200)) return;
  const t = a.currentTime;
  burst({ t, dur: 0.35, vol: 0.1, type: 'bandpass', freq: 1200, q: 0.6 });
}

export function tick() {
  const a = ctx();
  if (!a || !throttle('tick', 300)) return;
  tone({ type: 'square', f0: 1500, t: a.currentTime, vol: 0.03, decay: 0.03 });
}
