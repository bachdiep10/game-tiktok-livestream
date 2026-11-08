// Âm thanh game Đuổi hình bắt chữ: nhạc nền vui kiểu gameshow (tự tạo bằng WebAudio, không dùng file có bản quyền),
// tiếng tích tắc đồng hồ, chuông trả lời đúng, mở chữ, kèn chiến thắng.
// Có thể thay nhạc nền bằng MP3 riêng (thư mục public/assets/nhac-duoi-hinh).
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

function tone({ type = 'sine', f0, f1, t, vol = 0.2, attack = 0.005, decay = 0.2, dest }) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + attack + decay);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
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
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(dest || master);
  n.start(t);
  n.stop(t + dur + 0.05);
}

// ------------------------------------------------------------------ nhạc nền tự tạo
// Vòng hợp âm C - Am - F - G, nhịp 112, đàn bass + hợp âm nảy + trống nhẹ.
const BPM = 112;
const CHORDS = [
  [261.63, 329.63, 392.0],
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [196.0, 246.94, 293.66],
];
const BASS = [65.41, 55.0, 87.31, 98.0];
const MELODY = [
  [0, 659.25], [3, 587.33], [4, 523.25], [6, 587.33], [8, 659.25], [11, 783.99], [12, 659.25],
  [16, 523.25], [19, 587.33], [20, 659.25], [24, 523.25], [27, 440.0],
  [32, 440.0], [35, 523.25], [36, 587.33], [40, 698.46], [43, 659.25], [44, 587.33],
  [48, 587.33], [51, 659.25], [52, 783.99], [56, 880.0], [60, 783.99],
];
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;

function scheduleStep(step, t) {
  const bar = Math.floor(step / 16) % 4;
  const s = step % 16;
  const chord = CHORDS[bar];
  if (s % 4 === 0) tone({ type: 'triangle', f0: BASS[bar], t, vol: 0.32, attack: 0.01, decay: 0.32, dest: musicBus });
  if (s % 4 === 2) tone({ type: 'triangle', f0: BASS[bar] * 2, t, vol: 0.14, attack: 0.01, decay: 0.18, dest: musicBus });
  if (s === 2 || s === 6 || s === 10 || s === 14) for (const f of chord) tone({ type: 'square', f0: f, t, vol: 0.022, attack: 0.005, decay: 0.12, dest: musicBus });
  if (s % 8 === 4) burst({ t, dur: 0.12, vol: 0.12, freq: 1800, q: 0.7, dest: musicBus });
  if (s % 2 === 0) burst({ t, dur: 0.04, vol: 0.05, type: 'highpass', freq: 7000, dest: musicBus });
  if (s === 0) tone({ type: 'sine', f0: 120, f1: 45, t, vol: 0.3, attack: 0.003, decay: 0.16, dest: musicBus });
  const m = MELODY.find(([pos]) => pos === step % 64);
  if (m) tone({ type: 'sine', f0: m[1], t, vol: 0.07, attack: 0.01, decay: 0.3, dest: musicBus });
}

function scheduler() {
  const stepDur = 60 / BPM / 4;
  while (nextStep < ac.currentTime + 0.15) {
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
  timer = setInterval(scheduler, 30);
}

export function musicAudible() {
  if (fileEl) return !fileEl.paused;
  return Boolean(musicOn && ac && ac.state === 'running');
}

export function startMusic({ files = [], volume = 0.25 } = {}) {
  if (musicOn) return;
  const a = ctx();
  if (!a) return;
  if (!musicBus) {
    musicBus = a.createGain();
    musicBus.connect(master);
  }
  musicBus.gain.value = volume;
  musicOn = true;
  if (volume <= 0) return;
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
export function duck(ms = 4000, level = 0.35) {
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

// tích tắc 5 giây cuối
export function tick(urgent = false) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone({ type: 'square', f0: urgent ? 1400 : 1000, t, vol: 0.08, attack: 0.002, decay: 0.05 });
  burst({ t, dur: 0.03, vol: 0.12, freq: 3500, q: 3 });
}

// trả lời đúng: "ting ting"
export function correct(first = false) {
  const a = ctx();
  if (!a || !throttle('correct', 120)) return;
  const t = a.currentTime;
  const notes = first ? [783.99, 987.77, 1318.51] : [987.77, 1318.51];
  notes.forEach((f, i) => {
    tone({ type: 'sine', f0: f, t: t + i * 0.08, vol: 0.2, attack: 0.004, decay: 0.45 });
    tone({ type: 'triangle', f0: f * 2, t: t + i * 0.08, vol: 0.05, attack: 0.004, decay: 0.3 });
  });
}

// gần đúng
export function almost() {
  const a = ctx();
  if (!a || !throttle('almost', 400)) return;
  const t = a.currentTime;
  tone({ type: 'triangle', f0: 520, f1: 600, t, vol: 0.1, attack: 0.01, decay: 0.15 });
}

// mở một chữ
export function reveal() {
  const a = ctx();
  if (!a || !throttle('reveal', 60)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 660, f1: 1320, t, vol: 0.14, attack: 0.005, decay: 0.18 });
  burst({ t, dur: 0.18, vol: 0.06, freq: 5000, q: 1 });
}

// câu hỏi mới: tiếng "whoosh" + gõ
export function whoosh() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(4000, t + 0.35);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 0.5);
  tone({ type: 'sine', f0: 180, f1: 60, t: t + 0.32, vol: 0.35, attack: 0.003, decay: 0.2 });
}

// hết giờ
export function timeUp() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone({ type: 'sawtooth', f0: 330, f1: 220, t, vol: 0.08, attack: 0.01, decay: 0.5 });
  tone({ type: 'square', f0: 165, t, vol: 0.05, attack: 0.01, decay: 0.5 });
}

// kèn chiến thắng
export function fanfare() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const seq = [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.4]];
  for (const [f, d] of seq) {
    tone({ type: 'sawtooth', f0: f, t: t + d, vol: 0.06, attack: 0.01, decay: d === 0.4 ? 0.9 : 0.14 });
    tone({ type: 'square', f0: f / 2, t: t + d, vol: 0.04, attack: 0.01, decay: d === 0.4 ? 0.9 : 0.14 });
  }
  cheer(1.6);
}

// tiếng reo + vỗ tay
export function cheer(dur = 1.4) {
  const a = ctx();
  if (!a || !throttle('cheer', 600)) return;
  const t = a.currentTime;
  for (let i = 0; i < 28; i++) burst({ t: t + Math.random() * dur, dur: 0.05, vol: 0.08 + Math.random() * 0.08, freq: 1500 + Math.random() * 2000, q: 1.5 });
}

export function sparkle() {
  const a = ctx();
  if (!a || !throttle('sparkle', 150)) return;
  const t = a.currentTime;
  for (let i = 0; i < 6; i++) tone({ type: 'sine', f0: 1500 + Math.random() * 1500, t: t + i * 0.05, vol: 0.05, attack: 0.003, decay: 0.2 });
}

export function pop() {
  const a = ctx();
  if (!a || !throttle('pop', 50)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 500 + Math.random() * 300, f1: 1100, t, vol: 0.07, attack: 0.003, decay: 0.08 });
}
