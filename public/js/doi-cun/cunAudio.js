// Âm thanh game Đội Cún Quậy: nhạc nền vui nhộn tự tạo (marimba + bass nảy + vỗ tay), tiếng sủa của
// từng cún, nhảy boing, gặm xương, hộp quà rơi/mở, mặc đồ, nổi điên, Giờ Vàng, kèn chiến thắng.
// Tạo bằng WebAudio, không dùng file có bản quyền. Có thể thay nhạc bằng MP3 riêng (public/assets/nhac-doi-cun).
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
// Đô trưởng, vòng hoà âm C - Am - F - G, nhịp nhanh vui (128 BPM), marimba + bass nảy + vỗ tay + huýt sáo
let BPM = 128;
const CHORDS = [
  [130.81, 261.63, 329.63, 392.0],
  [110.0, 220.0, 261.63, 329.63],
  [87.31, 174.61, 220.0, 261.63],
  [98.0, 196.0, 246.94, 293.66],
];
// giai điệu 8 ô nhịp (mỗi ô 8 nốt móc đơn, 0 = nghỉ)
const MELODY = [
  [523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0],
  [880.0, 0, 783.99, 659.25, 0, 0, 523.25, 0],
  [698.46, 0, 659.25, 0, 587.33, 0, 523.25, 0],
  [587.33, 0, 659.25, 0, 783.99, 0, 0, 0],
  [523.25, 523.25, 659.25, 0, 783.99, 0, 1046.5, 0],
  [880.0, 0, 1046.5, 880.0, 783.99, 0, 659.25, 0],
  [698.46, 0, 880.0, 0, 783.99, 0, 698.46, 659.25],
  [587.33, 0, 493.88, 0, 523.25, 0, 0, 0],
];
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;
let hype = 0; // 0 bình thường, 1 Giờ Vàng (nhanh + rộn hơn)

export function setHype(level) {
  hype = level;
  BPM = level ? 150 : 128;
}

function marimba(t, f, vol = 0.07, dest) {
  tone({ type: 'sine', f0: f, t, vol, attack: 0.003, decay: 0.32, dest: dest || musicBus });
  tone({ type: 'sine', f0: f * 4, t, vol: vol * 0.25, attack: 0.002, decay: 0.08, dest: dest || musicBus });
}
function pluckBass(t, f, dur) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(300, t + dur);
  o.type = 'square';
  o.frequency.value = f;
  env(g, t, 0.06, 0.005, dur);
  o.connect(lp).connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function chordStab(t, chord) {
  for (const f of chord.slice(1)) tone({ type: 'triangle', f0: f, t, vol: 0.022, attack: 0.005, decay: 0.16, dest: musicBus });
}
function clap(t, vol = 0.05) {
  burst({ t, dur: 0.06, vol, type: 'bandpass', freq: 1600, q: 0.8, dest: musicBus });
  burst({ t: t + 0.012, dur: 0.05, vol: vol * 0.7, type: 'bandpass', freq: 1300, q: 0.8, dest: musicBus });
}
function kick(t) {
  tone({ type: 'sine', f0: 140, f1: 45, t, vol: 0.14, decay: 0.18, dest: musicBus });
}
function hat(t) {
  burst({ t, dur: 0.025, vol: 0.02, type: 'highpass', freq: 7000, dest: musicBus });
}
function whistle(t, f, dur) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lfo = ac.createOscillator();
  const lg = ac.createGain();
  lfo.frequency.value = 5.5;
  lg.gain.value = f * 0.012;
  lfo.connect(lg).connect(o.frequency);
  o.type = 'sine';
  o.frequency.value = f * 2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.035, t + 0.04);
  g.gain.setValueAtTime(0.035, t + dur * 0.8);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(musicBus);
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}

function scheduleStep(step, t) {
  const beat = 60 / BPM;
  const bar = Math.floor(step / 8);
  const s8 = step % 8;
  const chord = CHORDS[bar % 4];
  if (s8 % 2 === 0) kick(t);
  if (s8 === 2 || s8 === 6) clap(t);
  if (s8 % 2 === 1 || hype) hat(t);
  pluckBass(t, chord[0] * (s8 % 4 === 2 ? 2 : 1), beat * 0.4);
  if (s8 === 1 || s8 === 3 || s8 === 5 || s8 === 7) chordStab(t, chord);
  const phrase = Math.floor(bar / 8) % 2;
  const f = MELODY[bar % 8][s8];
  if (f) {
    if (phrase === 0) marimba(t, f);
    else whistle(t, f / 2, beat * 0.45);
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
  if (!a || !throttle('pop', 90)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 700 + Math.random() * 300, f1: 1400, t, vol: 0.05, decay: 0.12 });
}

// tiếng sủa: mỗi cún một cao độ (Bông cao chói, Mực trầm)
const BARK_PITCH = [1, 0.75, 1.45, 1.1];
export function bark(team = 0, times = 2, loud = 1) {
  const a = ctx();
  if (!a || !throttle(`bark${team}`, 250)) return;
  const p = BARK_PITCH[team] || 1;
  for (let i = 0; i < times; i++) {
    const t = a.currentTime + i * 0.22;
    tone({ type: 'sawtooth', f0: 520 * p, f1: 260 * p, t, vol: 0.09 * loud, attack: 0.01, decay: 0.13 });
    tone({ type: 'square', f0: 300 * p, f1: 160 * p, t, vol: 0.05 * loud, attack: 0.01, decay: 0.12 });
    burst({ t, dur: 0.08, vol: 0.06 * loud, type: 'bandpass', freq: 1100 * p, q: 1.5 });
  }
}
export function boing() {
  const a = ctx();
  if (!a || !throttle('boing', 150)) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  const lfo = a.createOscillator();
  const lg = a.createGain();
  lfo.frequency.value = 18;
  lg.gain.value = 40;
  lfo.connect(lg).connect(o.frequency);
  o.type = 'triangle';
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(520, t + 0.35);
  env(g, t, 0.12, 0.01, 0.4);
  o.connect(g).connect(master);
  o.start(t);
  lfo.start(t);
  o.stop(t + 0.45);
  lfo.stop(t + 0.45);
}
export function chomp() {
  const a = ctx();
  if (!a || !throttle('chomp', 200)) return;
  const t = a.currentTime;
  for (let i = 0; i < 3; i++) burst({ t: t + i * 0.13, dur: 0.06, vol: 0.12, type: 'lowpass', freq: 900, q: 2 });
}
export function huff() {
  const a = ctx();
  if (!a || !throttle('huff', 200)) return;
  const t = a.currentTime;
  for (let i = 0; i < 4; i++) burst({ t: t + i * 0.25, dur: 0.12, vol: 0.06, type: 'bandpass', freq: 700, q: 0.7 });
}
export function whoosh() {
  const a = ctx();
  if (!a || !throttle('whoosh', 250)) return;
  const t = a.currentTime;
  burst({ t, dur: 0.35, vol: 0.09, type: 'bandpass', freq: 1200, q: 0.6 });
}
export function bonk() {
  const a = ctx();
  if (!a || !throttle('bonk', 120)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 380, f1: 120, t, vol: 0.14, decay: 0.15 });
  tone({ type: 'square', f0: 900, f1: 500, t, vol: 0.03, decay: 0.06 });
}
// hộp quà rơi xuống đất
export function boxDrop() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 1400, f1: 300, t, vol: 0.05, attack: 0.01, decay: 0.35 });
  tone({ type: 'sine', f0: 120, f1: 60, t: t + 0.36, vol: 0.18, decay: 0.15 });
  burst({ t: t + 0.36, dur: 0.08, vol: 0.06, type: 'lowpass', freq: 600 });
}
// mở hộp: càng hiếm càng nhiều nốt
export function boxOpen(rarity = 'thuong') {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 0.12, vol: 0.1, type: 'highpass', freq: 2500 });
  const notes = rarity === 'huyenthoai' ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568] : rarity === 'hiem' ? [659.25, 783.99, 987.77, 1318.5] : [783.99, 1046.5];
  notes.forEach((f, i) => {
    tone({ type: 'triangle', f0: f, t: t + 0.05 + i * 0.07, vol: 0.07, decay: 0.4 });
    tone({ type: 'sine', f0: f * 2, t: t + 0.05 + i * 0.07, vol: 0.025, decay: 0.3 });
  });
  if (rarity === 'huyenthoai') {
    for (let i = 0; i < 12; i++) tone({ type: 'sine', f0: 1800 + Math.random() * 2400, t: t + 0.4 + i * 0.05, vol: 0.02, decay: 0.2 });
  }
}
export function equip() {
  const a = ctx();
  if (!a || !throttle('equip', 120)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 900, f1: 1800, t, vol: 0.05, decay: 0.15 });
  tone({ type: 'sine', f0: 1350, f1: 2700, t: t + 0.06, vol: 0.04, decay: 0.15 });
}
export function growl() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  const lfo = a.createOscillator();
  const lg = a.createGain();
  lfo.frequency.value = 28;
  lg.gain.value = 25;
  lfo.connect(lg).connect(o.frequency);
  o.type = 'sawtooth';
  o.frequency.value = 95;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.3);
  g.gain.linearRampToValueAtTime(0.0001, t + 1.2);
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 600;
  o.connect(lp).connect(g).connect(master);
  o.start(t);
  lfo.start(t);
  o.stop(t + 1.3);
  lfo.stop(t + 1.3);
}
export function fullSet() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => {
    tone({ type: 'square', f0: f, t: t + i * 0.09, vol: 0.035, decay: 0.2 });
    tone({ type: 'triangle', f0: f, t: t + i * 0.09, vol: 0.06, decay: 0.3 });
  });
}
// còi trọng tài báo Giờ Vàng
export function referee() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (const [d, len] of [[0, 0.18], [0.25, 0.18], [0.5, 0.6]]) {
    const o = a.createOscillator();
    const g = a.createGain();
    const lfo = a.createOscillator();
    const lg = a.createGain();
    lfo.frequency.value = 40;
    lg.gain.value = 120;
    lfo.connect(lg).connect(o.frequency);
    o.type = 'sine';
    o.frequency.value = 2900;
    g.gain.setValueAtTime(0.0001, t + d);
    g.gain.linearRampToValueAtTime(0.06, t + d + 0.02);
    g.gain.setValueAtTime(0.06, t + d + len - 0.03);
    g.gain.linearRampToValueAtTime(0.0001, t + d + len);
    o.connect(g).connect(master);
    o.start(t + d);
    lfo.start(t + d);
    o.stop(t + d + len + 0.05);
    lfo.stop(t + d + len + 0.05);
  }
}
export function tick(high = false) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone({ type: 'square', f0: high ? 1320 : 880, t, vol: 0.04, decay: 0.08 });
}
export function fanfare() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const seq = [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.36], [783.99, 0.6], [1046.5, 0.72], [1318.5, 1.0]];
  for (const [f, d] of seq) {
    tone({ type: 'sawtooth', f0: f, t: t + d, vol: 0.045, attack: 0.02, decay: d >= 1 ? 1.4 : 0.3 });
    tone({ type: 'triangle', f0: f / 2, t: t + d, vol: 0.06, attack: 0.02, decay: d >= 1 ? 1.4 : 0.3 });
  }
  for (let i = 0; i < 10; i++) clapFx(t + 1 + i * 0.11);
}
function clapFx(t) {
  burst({ t, dur: 0.05, vol: 0.06, type: 'bandpass', freq: 1500 + Math.random() * 500, q: 0.8 });
}
