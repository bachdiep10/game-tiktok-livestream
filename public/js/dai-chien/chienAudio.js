// Âm thanh chiến trường Sơn Tinh – Thủy Tinh: nhạc trống trận + kèn sừng theo ngũ cung (tự tạo bằng WebAudio,
// không dùng file có bản quyền), tiếng gió, hiệu ứng gươm giáo, tên bay, đá lở, sóng nước, voi rống...
// Có thể thay nhạc bằng MP3 riêng (thư mục public/assets/nhac-dai-chien).
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
const BPM = 112;
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;
let intensity = 0; // 0..1: trận càng căng trống càng dồn
export function setIntensity(v) {
  intensity = Math.max(0, Math.min(1, v));
}
// ngũ cung Rê: D F G A C (âm hưởng hùng tráng)
const PENTA = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46];
const PHRASES = [
  [0, -1, -1, 2, 3, -1, 2, -1, 0, -1, 1, 2, 0, -1, -1, -1],
  [3, -1, 4, 3, 2, -1, 3, -1, 4, -1, 5, -1, 4, 3, 2, -1],
  [5, -1, 4, -1, 3, 4, 5, -1, 6, -1, 5, 4, 3, -1, -1, -1],
  [2, -1, 3, 2, 1, -1, 0, -1, 1, 0, -1, -1, 0, -1, -1, -1],
];
const BASS = [73.42, 98.0, 87.31, 73.42];

function horn(t, f, dur, vol = 0.06) {
  // kèn sừng: răng cưa qua lọc thấp, mở dần
  const a = ac;
  const o = a.createOscillator();
  const o2 = a.createOscillator();
  const lp = a.createBiquadFilter();
  const g = a.createGain();
  o.type = 'sawtooth';
  o2.type = 'sawtooth';
  o.frequency.setValueAtTime(f * 0.97, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
  o2.frequency.value = f * 1.005;
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(500, t);
  lp.frequency.linearRampToValueAtTime(1600, t + Math.min(0.3, dur));
  lp.Q.value = 2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
  g.gain.setValueAtTime(vol * 0.8, t + dur * 0.75);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
  o.connect(lp);
  o2.connect(lp);
  lp.connect(g).connect(musicBus);
  for (const x of [o, o2]) {
    x.start(t);
    x.stop(t + dur + 0.15);
  }
}

function drumHit(t, vol = 0.18, dest = musicBus, low = 1) {
  tone({ type: 'sine', f0: 140 * low, f1: 45 * low, t, vol, attack: 0.003, decay: 0.38, dest });
  burst({ t, dur: 0.07, vol: vol * 0.35, type: 'lowpass', freq: 800, dest });
}
function rim(t, vol = 0.05, dest = musicBus) {
  tone({ type: 'square', f0: 900, f1: 600, t, vol: vol * 0.5, attack: 0.001, decay: 0.04, dest });
  burst({ t, dur: 0.03, vol, type: 'bandpass', freq: 2200, q: 3, dest });
}

function scheduleStep(step, t) {
  const stepDur = 60 / BPM / 2;
  const phrase = Math.floor(step / 16) % PHRASES.length;
  const s16 = step % 16;
  const note = PHRASES[phrase][s16];
  if (note >= 0) {
    let len = 1;
    while (s16 + len < 16 && PHRASES[phrase][s16 + len] === -1 && len < 4) len++;
    horn(t, PENTA[note], stepDur * len * 0.95);
  }
  if (s16 === 0 || s16 === 8) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.value = BASS[phrase];
    env(g, t, 0.1, 0.01, 0.9);
    o.connect(g).connect(musicBus);
    o.start(t);
    o.stop(t + 1);
  }
  // trống trận: tùng... tùng tùng, càng căng càng dồn
  if (s16 % 4 === 0) drumHit(t, s16 === 0 ? 0.2 : 0.13);
  if (s16 === 6 || s16 === 14) drumHit(t, 0.1, musicBus, 1.2);
  if (intensity > 0.4 && s16 % 2 === 1) drumHit(t, 0.05 + intensity * 0.05, musicBus, 1.5);
  if (s16 % 2 === 1) rim(t, s16 % 4 === 3 ? 0.04 : 0.02);
}

function scheduler() {
  const stepDur = 60 / BPM / 2;
  while (nextStep < ac.currentTime + 0.15) {
    scheduleStep(stepIdx, nextStep);
    nextStep += stepDur;
    stepIdx++;
  }
}

// tiếng gió chiến trường nền
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
    console.warn('[nhạc] Không phát được bài nào, dùng nhạc trống trận tự tạo.');
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


// gươm giáo chạm nhau: keng
export function clash() {
  const a = ctx();
  if (!a || !throttle('clash', 90)) return;
  const t = a.currentTime;
  const f = 1800 + Math.random() * 1400;
  tone({ type: 'square', f0: f, f1: f * 0.8, t, vol: 0.035, attack: 0.001, decay: 0.12 });
  tone({ type: 'sine', f0: f * 1.5, t, vol: 0.03, attack: 0.001, decay: 0.25 });
  burst({ t, dur: 0.04, vol: 0.05, type: 'highpass', freq: 3000 });
}
// đánh trúng: bụp
export function hit() {
  const a = ctx();
  if (!a || !throttle('hit', 70)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 220, f1: 80, t, vol: 0.07, attack: 0.002, decay: 0.1 });
  burst({ t, dur: 0.05, vol: 0.05, type: 'lowpass', freq: 1200 });
}
// tên bay: vút
export function arrow() {
  const a = ctx();
  if (!a || !throttle('arrow', 80)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 4;
  f.frequency.setValueAtTime(4000, t);
  f.frequency.exponentialRampToValueAtTime(1500, t + 0.25);
  const g = a.createGain();
  env(g, t, 0.06, 0.01, 0.25);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 0.3);
}
// nước bắn: tõm
export function splash(big = false) {
  const a = ctx();
  if (!a || !throttle('splash', 90)) return;
  const t = a.currentTime;
  burst({ t, dur: big ? 0.9 : 0.25, vol: big ? 0.16 : 0.07, type: 'lowpass', freq: big ? 900 : 2200 });
  tone({ type: 'sine', f0: big ? 300 : 700, f1: big ? 120 : 1400, t, vol: 0.05, attack: 0.005, decay: 0.15 });
}
// đá lở: ầm ầm
export function rumble(dur = 1.4, vol = 0.22) {
  const a = ctx();
  if (!a || !throttle('rumble', 300)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 220;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + dur + 0.05);
  tone({ type: 'sine', f0: 60, f1: 32, t, vol: vol * 0.8, attack: 0.01, decay: dur });
}
// sóng lớn: ào ào
export function wave(dur = 2.4) {
  const a = ctx();
  if (!a || !throttle('wave', 500)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 0.7;
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(1400, t + dur * 0.4);
  f.frequency.exponentialRampToValueAtTime(400, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.2, t + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + dur + 0.05);
}
// rơi xuống đất: bịch
export function thud() {
  const a = ctx();
  if (!a || !throttle('thud', 60)) return;
  drumHit(a.currentTime, 0.12, master, 0.8);
}
// voi rống
export function trumpet() {
  const a = ctx();
  if (!a || !throttle('trumpet', 800)) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  const lp = a.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(380, t);
  o.frequency.linearRampToValueAtTime(620, t + 0.25);
  o.frequency.linearRampToValueAtTime(480, t + 0.9);
  lp.type = 'bandpass';
  lp.frequency.value = 1200;
  lp.Q.value = 1.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
  o.connect(lp).connect(g).connect(master);
  o.start(t);
  o.stop(t + 1.05);
}
// rắn biển gầm
export function roar() {
  const a = ctx();
  if (!a || !throttle('roar', 800)) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(90, t);
  o.frequency.linearRampToValueAtTime(140, t + 0.3);
  o.frequency.linearRampToValueAtTime(70, t + 1.1);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.14, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 1.25);
  burst({ t, dur: 1.0, vol: 0.06, type: 'bandpass', freq: 500, q: 1 });
}
export function pop() {
  const a = ctx();
  if (!a || !throttle('pop', 40)) return;
  tone({ type: 'sine', f0: 600 + Math.random() * 300, f1: 1200, t: a.currentTime, vol: 0.035, attack: 0.002, decay: 0.08 });
}
export function sparkle() {
  const a = ctx();
  if (!a || !throttle('sparkle', 100)) return;
  const t = a.currentTime;
  [1174.66, 1396.9, 1760, 2349.3].forEach((f, i) => tone({ type: 'sine', f0: f, t: t + i * 0.06, vol: 0.05, decay: 0.35 }));
}
// tù và báo hiệu: uuu
export function warHorn() {
  const a = ctx();
  if (!a || !throttle('warHorn', 1500)) return;
  const t = a.currentTime;
  for (const [f, v] of [[146.8, 0.12], [220, 0.05]]) {
    const o = a.createOscillator();
    const lp = a.createBiquadFilter();
    const g = a.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f * 0.92, t);
    o.frequency.linearRampToValueAtTime(f, t + 0.3);
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.25);
    g.gain.setValueAtTime(v, t + 1.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    o.connect(lp).connect(g).connect(master);
    o.start(t);
    o.stop(t + 2.05);
  }
}
// dồn trống: tùng tùng tùng tùng
export function drumRoll(n = 6) {
  const a = ctx();
  if (!a || !throttle('drumRoll', 600)) return;
  const t = a.currentTime;
  for (let i = 0; i < n; i++) drumHit(t + i * 0.11, 0.2 + (i / n) * 0.1, master);
}
export function gong() {
  const a = ctx();
  if (!a || !throttle('gong', 800)) return;
  const t = a.currentTime;
  for (const [f, v] of [[174.6, 0.16], [261.6, 0.07], [370, 0.05], [523, 0.03]]) {
    tone({ type: 'sine', f0: f * 1.02, f1: f, t, vol: v, attack: 0.01, decay: 3.4 });
  }
  burst({ t, dur: 0.12, vol: 0.08, type: 'lowpass', freq: 1200 });
}
// cả quân reo hò
export function cheer() {
  const a = ctx();
  if (!a || !throttle('cheer', 800)) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1000;
  f.Q.value = 0.6;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.13, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 2.1);
  for (let i = 0; i < 8; i++) drumHit(t + i * 0.14, 0.12, master);
}
export function heal() {
  const a = ctx();
  if (!a || !throttle('heal', 300)) return;
  const t = a.currentTime;
  [587.33, 880, 1174.66].forEach((f, i) => tone({ type: 'sine', f0: f, t: t + i * 0.08, vol: 0.05, decay: 0.5 }));
}
export function shield() {
  const a = ctx();
  if (!a || !throttle('shield', 200)) return;
  const t = a.currentTime;
  tone({ type: 'triangle', f0: 400, f1: 900, t, vol: 0.06, attack: 0.01, decay: 0.3 });
}
