// Âm thanh bến câu: nhạc sáo trúc + đàn tranh tự tạo, tiếng sông nước, chim hót / dế kêu ban đêm, mưa,
// và hiệu ứng (quăng cần, phao chìm, quay cước, cá quẫy, lửa tí tách, thủy quái gầm...).
// Tất cả tạo bằng WebAudio, không dùng file có bản quyền. Có thể thay nhạc bằng MP3 riêng
// (thư mục public/assets/nhac-cau-ca).
let ac = null;
let master = null;
let musicBus = null;
let ambBus = null;
let rainBus = null;
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

// ------------------------------------------------------------------ nhạc: sáo trúc + đàn tranh (ngũ cung)
const BPM = 66;
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;
// ngũ cung Rê: D E F# A B
const SCALE = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99, 880.0, 987.77];
const BASS = [146.83, 110.0, 123.47, 146.83, 98.0, 110.0, 146.83, 110.0];
// câu sáo (chỉ số nốt trong SCALE, -1 = nghỉ), 2 câu luân phiên
const FLUTE = [
  [5, -1, 6, 5, 3, -1, 2, 3, 5, -1, -1, -1, 6, 7, 6, 5, 3, -1, 2, -1, 0, -1, -1, -1, 2, 3, 5, 3, 2, -1, 0, -1],
  [7, -1, 8, 7, 5, -1, 6, 5, 3, -1, -1, -1, 5, 6, 5, 3, 2, -1, 3, -1, 5, -1, -1, -1, 3, 2, 0, -1, 2, -1, -1, -1],
];

function flute(t, f, dur) {
  const a = ac;
  const o = a.createOscillator();
  const vib = a.createOscillator();
  const vg = a.createGain();
  const g = a.createGain();
  const lp = a.createBiquadFilter();
  o.type = 'sine';
  o.frequency.setValueAtTime(f * 0.985, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
  vib.frequency.value = 5.2;
  vg.gain.setValueAtTime(0, t);
  vg.gain.linearRampToValueAtTime(f * 0.012, t + dur * 0.6);
  vib.connect(vg).connect(o.frequency);
  lp.type = 'lowpass';
  lp.frequency.value = 2600;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.07, t + 0.07);
  g.gain.setValueAtTime(0.06, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp).connect(g).connect(musicBus);
  // tiếng hơi thổi
  const n = noise(a);
  const nf = a.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = f * 2;
  nf.Q.value = 6;
  const ng = a.createGain();
  env(ng, t, 0.012, 0.03, Math.min(0.3, dur));
  n.connect(nf).connect(ng).connect(musicBus);
  n.start(t);
  n.stop(t + dur);
  o.start(t);
  vib.start(t);
  o.stop(t + dur + 0.05);
  vib.stop(t + dur + 0.05);
}

function zither(t, f, vol = 0.06) {
  // đàn tranh: dây gảy sáng, tắt dài, hơi nhấn luyến
  const a = ac;
  const o = a.createOscillator();
  const g = a.createGain();
  const lp = a.createBiquadFilter();
  o.type = 'triangle';
  o.frequency.setValueAtTime(f, t);
  if (Math.random() < 0.15) o.frequency.setValueAtTime(f, t + 0.25), o.frequency.linearRampToValueAtTime(f * 1.06, t + 0.45);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(f * 8, t);
  lp.frequency.exponentialRampToValueAtTime(f * 2, t + 0.8);
  env(g, t, vol, 0.003, 1.8);
  o.connect(lp).connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + 1.9);
}

function scheduleStep(step, t) {
  const stepDur = 60 / BPM / 2;
  const bar = Math.floor(step / 8);
  const s8 = step % 8;
  const phrase = FLUTE[Math.floor(step / 32) % 2];
  const idx = phrase[step % 32];
  if (idx >= 0) {
    let len = 1;
    while (len < 4 && phrase[(step + len) % 32] === -1) len++;
    flute(t, SCALE[idx], stepDur * len * 0.95);
  }
  const root = BASS[bar % BASS.length];
  if (s8 === 0) zither(t, root, 0.08);
  if (s8 === 2 || s8 === 6) zither(t, root * 1.5, 0.045);
  if (s8 === 4) zither(t, root * 2, 0.05);
  if (s8 === 7 && Math.random() < 0.4) zither(t, SCALE[Math.floor(Math.random() * 5)] , 0.03);
  // mõ gõ nhẹ giữ nhịp
  if (s8 === 0 && bar % 2 === 0) tone({ type: 'sine', f0: 900, f1: 600, t, vol: 0.025, attack: 0.002, decay: 0.06, dest: musicBus });
}

function scheduler() {
  const stepDur = 60 / BPM / 2;
  while (nextStep < ac.currentTime + 0.15) {
    scheduleStep(stepIdx, nextStep);
    nextStep += stepDur;
    stepIdx++;
  }
}

// ------------------------------------------------------------------ tiếng sông nước + chim / dế + mưa
let ambNode = null;
let night = 0;
let rain = 0;
let rainGain = null;
function startAmbience(volume) {
  if (ambNode) return;
  const a = ac;
  ambBus = a.createGain();
  ambBus.gain.value = volume;
  ambBus.connect(master);
  const n = noise(a);
  n.loop = true;
  const bp = a.createBiquadFilter();
  bp.type = 'lowpass';
  bp.frequency.value = 650;
  const lfo = a.createOscillator();
  const lfoG = a.createGain();
  lfo.frequency.value = 0.11;
  lfoG.gain.value = 220;
  lfo.connect(lfoG).connect(bp.frequency);
  n.connect(bp).connect(ambBus);
  n.start();
  lfo.start();
  ambNode = n;
  // mưa: tiếng ào lớp riêng
  rainBus = a.createGain();
  rainBus.gain.value = 0;
  rainBus.connect(master);
  const rn = noise(a);
  rn.loop = true;
  const rf = a.createBiquadFilter();
  rf.type = 'highpass';
  rf.frequency.value = 1200;
  rn.connect(rf).connect(rainBus);
  rn.start();
  rainGain = rainBus;
  setInterval(critters, 700);
}

function critters() {
  if (!ac || !ambBus || ac.state !== 'running') return;
  const t = ac.currentTime;
  if (night > 0.5) {
    // dế kêu
    if (Math.random() < 0.7) {
      for (let i = 0; i < 4; i++) tone({ type: 'sine', f0: 4200 + Math.random() * 300, t: t + i * 0.05, vol: 0.012, attack: 0.004, decay: 0.03, dest: ambBus });
    }
    if (Math.random() < 0.05) {
      // ếch ộp
      for (let i = 0; i < 2; i++) tone({ type: 'square', f0: 180, f1: 120, t: t + i * 0.25, vol: 0.02, attack: 0.01, decay: 0.12, dest: ambBus });
    }
  } else if (Math.random() < 0.18) {
    // chim hót
    const base = 2200 + Math.random() * 1400;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) tone({ type: 'sine', f0: base, f1: base * (1.2 + Math.random() * 0.4), t: t + i * 0.13, vol: 0.02, attack: 0.01, decay: 0.08, dest: ambBus });
  }
}

export function setEnvironment(n, r) {
  night = n;
  if (rain !== r && rainGain && ac) {
    rainGain.gain.setTargetAtTime(r * 0.12, ac.currentTime, 0.8);
  }
  rain = r;
}

// ------------------------------------------------------------------ nhạc file riêng hoặc nhạc tự tạo
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

// vút cần
export function cast() {
  const a = ctx();
  if (!a || !throttle('cast', 90)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 2;
  f.frequency.setValueAtTime(3500, t);
  f.frequency.exponentialRampToValueAtTime(800, t + 0.3);
  const g = a.createGain();
  env(g, t, 0.06, 0.03, 0.28);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 0.4);
  // tiếng cước rít
  for (let i = 0; i < 6; i++) tone({ type: 'square', f0: 2600 + i * 40, t: t + 0.05 + i * 0.025, vol: 0.008, attack: 0.002, decay: 0.015 });
}

// tõm (mồi rơi xuống nước)
export function plop(vol = 1) {
  const a = ctx();
  if (!a || !throttle('plop', 70)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 900, f1: 220, t, vol: 0.09 * vol, attack: 0.003, decay: 0.12 });
  burst({ t, dur: 0.08, vol: 0.04 * vol, type: 'lowpass', freq: 1200 });
}

// phao chìm: cá cắn câu
export function bite() {
  const a = ctx();
  if (!a || !throttle('bite', 120)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 320, f1: 680, t, vol: 0.1, attack: 0.005, decay: 0.09 });
  tone({ type: 'sine', f0: 360, f1: 760, t: t + 0.12, vol: 0.08, attack: 0.005, decay: 0.09 });
}

// quay cước lạch xạch
export function reel(dur = 0.8) {
  const a = ctx();
  if (!a || !throttle('reel', 200)) return;
  const t = a.currentTime;
  const n = Math.floor(dur * 26);
  for (let i = 0; i < n; i++) tone({ type: 'square', f0: 1500 + Math.random() * 300, t: t + i * (dur / n), vol: 0.018, attack: 0.001, decay: 0.012 });
}

// cá quẫy nước, ào lên khỏi mặt nước
export function splash(big = false) {
  const a = ctx();
  if (!a || !throttle('splash', 100)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 0.8;
  f.frequency.setValueAtTime(big ? 900 : 1800, t);
  f.frequency.exponentialRampToValueAtTime(big ? 300 : 700, t + 0.5);
  const g = a.createGain();
  env(g, t, big ? 0.22 : 0.1, 0.01, big ? 0.8 : 0.35);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 1);
  for (let i = 0; i < (big ? 8 : 3); i++) tone({ type: 'sine', f0: 600 + Math.random() * 800, f1: 300, t: t + 0.1 + Math.random() * 0.4, vol: 0.03, attack: 0.003, decay: 0.06 });
}

// nhạc báo câu được cá: to thì kéo dài hơn
export function caught(level = 0) {
  const a = ctx();
  if (!a || !throttle('caught', 150)) return;
  const t = a.currentTime;
  const notes = level >= 2 ? [587.33, 739.99, 880, 1174.66, 1479.98] : level === 1 ? [587.33, 739.99, 880, 1174.66] : [880, 1174.66];
  notes.forEach((f, i) => tone({ type: 'triangle', f0: f, t: t + i * 0.08, vol: 0.07, attack: 0.005, decay: i === notes.length - 1 ? 0.6 : 0.15 }));
}

export function junk() {
  const a = ctx();
  if (!a || !throttle('junk', 300)) return;
  const t = a.currentTime;
  // "tèn tén" hụt hẫng
  tone({ type: 'triangle', f0: 392, f1: 370, t, vol: 0.08, decay: 0.25 });
  tone({ type: 'triangle', f0: 349, f1: 311, t: t + 0.28, vol: 0.08, decay: 0.5 });
}

export function legendary() {
  const a = ctx();
  if (!a || !throttle('legend', 1500)) return;
  const t = a.currentTime;
  [587.33, 739.99, 880, 1174.66, 880, 1174.66, 1479.98].forEach((f, i) => {
    tone({ type: 'triangle', f0: f, t: t + i * 0.13, vol: 0.12, attack: 0.01, decay: i === 6 ? 1.2 : 0.25 });
    tone({ type: 'sine', f0: f * 2, t: t + i * 0.13, vol: 0.03, attack: 0.01, decay: 0.3 });
  });
  // chiêng
  tone({ type: 'sine', f0: 110, f1: 104, t, vol: 0.2, attack: 0.01, decay: 3 });
  tone({ type: 'sine', f0: 263, f1: 258, t, vol: 0.06, attack: 0.01, decay: 2.4 });
}

export function crunch() {
  const a = ctx();
  if (!a || !throttle('crunch', 150)) return;
  const t = a.currentTime;
  for (let i = 0; i < 4; i++) burst({ t: t + i * 0.09 + Math.random() * 0.02, dur: 0.05, vol: 0.1, type: 'bandpass', freq: 1500 + Math.random() * 1200, q: 2 });
}

// lửa bùng lên + tí tách
export function fire() {
  const a = ctx();
  if (!a || !throttle('fire', 600)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(2500, t + 0.3);
  const g = a.createGain();
  env(g, t, 0.14, 0.15, 0.9);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 1.2);
  for (let i = 0; i < 10; i++) burst({ t: t + 0.2 + Math.random() * 1.4, dur: 0.02, vol: 0.06, type: 'highpass', freq: 3000 });
}

export function sizzle() {
  const a = ctx();
  if (!a || !throttle('sizzle', 800)) return;
  const t = a.currentTime;
  burst({ t, dur: 0.9, vol: 0.05, type: 'highpass', freq: 4000 });
}

export function snore() {
  const a = ctx();
  if (!a || !throttle('snore', 2500)) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(70, t);
  o.frequency.linearRampToValueAtTime(95, t + 0.6);
  f.type = 'lowpass';
  f.frequency.value = 500;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.04, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  o.connect(f).connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.9);
}

export function pop() {
  const a = ctx();
  if (!a || !throttle('pop', 50)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 600 + Math.random() * 300, f1: 1200, t, vol: 0.07, attack: 0.003, decay: 0.08 });
}

export function sparkle() {
  const a = ctx();
  if (!a || !throttle('sparkle', 100)) return;
  const t = a.currentTime;
  [1174.66, 1479.98, 1760, 2349.32].forEach((f, i) => tone({ type: 'sine', f0: f, t: t + i * 0.06, vol: 0.05, decay: 0.35 }));
}

export function coins() {
  const a = ctx();
  if (!a || !throttle('coins', 120)) return;
  const t = a.currentTime;
  for (let i = 0; i < 5; i++) tone({ type: 'triangle', f0: 1800 + Math.random() * 1400, t: t + i * 0.05, vol: 0.05, decay: 0.2 });
}

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
  for (let i = 0; i < 16; i++) burst({ t: t + 0.1 + Math.random() * 1.3, dur: 0.03, vol: 0.08, type: 'bandpass', freq: 1500 + Math.random() * 1000 });
}

export function fanfare() {
  const a = ctx();
  if (!a || !throttle('fanfare', 1000)) return;
  const t = a.currentTime;
  [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
    tone({ type: 'triangle', f0: f, t: t + i * 0.12, vol: 0.12, attack: 0.01, decay: i === 3 ? 0.9 : 0.25 });
    tone({ type: 'square', f0: f / 2, t: t + i * 0.12, vol: 0.03, attack: 0.01, decay: i === 3 ? 0.8 : 0.2 });
  });
}

// chiêng báo hết trận
export function gong() {
  const a = ctx();
  if (!a || !throttle('gong', 1500)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 98, f1: 94, t, vol: 0.25, attack: 0.01, decay: 3.5 });
  tone({ type: 'sine', f0: 233, f1: 228, t, vol: 0.08, attack: 0.01, decay: 2.8 });
  tone({ type: 'sine', f0: 411, f1: 405, t, vol: 0.04, attack: 0.01, decay: 2 });
  burst({ t, dur: 0.15, vol: 0.06, type: 'bandpass', freq: 800 });
}

// trống thuyền rồng
export function drum(n = 8) {
  const a = ctx();
  if (!a || !throttle('drum', 2000)) return;
  const t = a.currentTime;
  for (let i = 0; i < n; i++) tone({ type: 'sine', f0: 120, f1: 55, t: t + i * 0.42, vol: 0.2, attack: 0.003, decay: 0.25 });
}

// mái chèo khua nước
export function oar() {
  const a = ctx();
  if (!a || !throttle('oar', 500)) return;
  burst({ t: a.currentTime, dur: 0.3, vol: 0.05, type: 'bandpass', freq: 700, q: 1.2 });
}

// thủy quái gầm
export function roar() {
  const a = ctx();
  if (!a || !throttle('roar', 1500)) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const o2 = a.createOscillator();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  o.type = 'sawtooth';
  o2.type = 'sawtooth';
  o.frequency.setValueAtTime(60, t);
  o.frequency.linearRampToValueAtTime(95, t + 0.6);
  o.frequency.linearRampToValueAtTime(48, t + 1.8);
  o2.frequency.setValueAtTime(63, t);
  o2.frequency.linearRampToValueAtTime(90, t + 0.7);
  o2.frequency.linearRampToValueAtTime(45, t + 1.8);
  f.type = 'lowpass';
  f.frequency.value = 420;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.28, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
  o.connect(f);
  o2.connect(f);
  f.connect(g).connect(master);
  o.start(t);
  o2.start(t);
  o.stop(t + 2.1);
  o2.stop(t + 2.1);
  burst({ t, dur: 1.6, vol: 0.12, type: 'lowpass', freq: 300 });
}

export function thunder() {
  const a = ctx();
  if (!a || !throttle('thunder', 3000)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(900, t);
  f.frequency.exponentialRampToValueAtTime(90, t + 2.5);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 3.1);
}

// tiếng kéo (giằng co thủy quái)
export function tug() {
  const a = ctx();
  if (!a || !throttle('tug', 140)) return;
  const t = a.currentTime;
  tone({ type: 'triangle', f0: 180 + Math.random() * 60, f1: 120, t, vol: 0.06, attack: 0.005, decay: 0.08 });
}
