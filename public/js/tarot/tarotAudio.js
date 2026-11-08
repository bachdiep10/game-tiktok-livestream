// Âm thanh phòng bói Tarot: nhạc nền huyền bí tự tạo (pad + chuông ngân + đàn hạc) và hiệu ứng
// (xào bài, lật bài, chuông gió, lấp lánh). Tạo bằng WebAudio, không dùng file có bản quyền.
// Có thể thay nhạc bằng MP3 riêng (thư mục public/assets/nhac-tarot).
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

// tiếng vang đơn giản (delay phản hồi) cho nhạc nền
let echo = null;
function echoBus() {
  if (echo) return echo;
  const d = ac.createDelay(1.5);
  d.delayTime.value = 0.42;
  const fb = ac.createGain();
  fb.gain.value = 0.38;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  d.connect(lp).connect(fb).connect(d);
  lp.connect(musicBus);
  echo = d;
  return d;
}

// ------------------------------------------------------------------ nhạc nền tự tạo
// Rê thứ - Si giáng - Fa - Đô, mỗi hợp âm 4 phách, nhịp chậm
const BPM = 64;
const CHORDS = [
  [146.83, 220.0, 293.66, 349.23],
  [116.54, 174.61, 233.08, 293.66],
  [174.61, 220.0, 261.63, 349.23],
  [130.81, 196.0, 261.63, 329.63],
];
// giai điệu ngũ cung Rê thứ (chuông ngân)
const SCALE = [587.33, 698.46, 783.99, 880.0, 1046.5, 1174.66];
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;

function pad(t, chord, dur) {
  for (const f of chord) {
    for (const det of [-5, 5]) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.012, t + dur * 0.35);
      g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
      o.connect(lp).connect(g).connect(musicBus);
      o.start(t);
      o.stop(t + dur * 1.1);
    }
  }
}
function bellNote(t, f, vol = 0.05) {
  for (const [ratio, amp] of [[1, 1], [2.76, 0.3], [5.4, 0.12]]) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = f * ratio;
    env(g, t, vol * amp, 0.005, 2.4 / ratio);
    o.connect(g);
    g.connect(musicBus);
    g.connect(echoBus());
    o.start(t);
    o.stop(t + 2.6);
  }
}
function harp(t, f, vol = 0.05) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(f * 5, t);
  lp.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.8);
  o.type = 'triangle';
  o.frequency.value = f;
  env(g, t, vol, 0.004, 1.6);
  o.connect(lp).connect(g);
  g.connect(musicBus);
  g.connect(echoBus());
  o.start(t);
  o.stop(t + 1.7);
}

function scheduleStep(step, t) {
  const beat = 60 / BPM;
  const bar = Math.floor(step / 8);
  const s8 = step % 8;
  const chord = CHORDS[bar % 4];
  if (s8 === 0) pad(t, chord, beat * 4);
  // đàn hạc rải hợp âm
  if (s8 % 2 === 0) harp(t, chord[(s8 / 2) % chord.length] * 2, 0.035);
  // chuông ngân thưa
  if ((s8 === 3 || s8 === 7) && Math.random() < 0.55) bellNote(t, SCALE[Math.floor(Math.random() * SCALE.length)], 0.03);
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

// xào bài: chuỗi tiếng giấy lách cách
export function shuffle(dur = 1.6) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const n = Math.floor(dur * 22);
  for (let i = 0; i < n; i++) burst({ t: t + i * (dur / n) + Math.random() * 0.01, dur: 0.03, vol: 0.12, freq: 3000 + Math.random() * 2000, q: 0.8 });
}

// đặt bài xuống bàn
export function deal() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 0.12, vol: 0.18, type: 'lowpass', freq: 1800 });
  tone({ type: 'sine', f0: 180, f1: 90, t, vol: 0.12, decay: 0.08 });
}

// lật bài
export function flip(reversed = false) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 0.18, vol: 0.16, type: 'highpass', freq: 2500 });
  const base = reversed ? 392 : 523.25;
  for (const [i, m] of [1, 1.25, 1.5].entries()) tone({ f0: base * m * (reversed && i === 1 ? 0.96 : 1), t: t + 0.05 + i * 0.07, vol: 0.08, decay: 0.9 });
}

// chuông gió khi có quà
export function chimes(n = 6) {
  const a = ctx();
  if (!a || !throttle('chimes', 250)) return;
  const t = a.currentTime;
  for (let i = 0; i < n; i++) {
    const f = SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.4 ? 2 : 1);
    tone({ f0: f, t: t + i * 0.09 + Math.random() * 0.04, vol: 0.07, decay: 1.4 });
  }
}

export function sparkle() {
  const a = ctx();
  if (!a || !throttle('sparkle', 120)) return;
  const t = a.currentTime;
  for (let i = 0; i < 3; i++) tone({ f0: 1800 + Math.random() * 1600, t: t + i * 0.05, vol: 0.03, decay: 0.3 });
}

// tiếng ngân lớn khi bắt đầu xem bói / quà lớn
export function gong(big = false) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const base = big ? 98 : 146.83;
  for (const [ratio, amp] of [[1, 1], [2.0, 0.5], [2.76, 0.4], [4.07, 0.2], [5.4, 0.12]]) {
    tone({ f0: base * ratio, t, vol: 0.18 * amp, attack: 0.01, decay: (big ? 5 : 3.2) / Math.sqrt(ratio) });
  }
}

export function whoosh() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
  const g = a.createGain();
  env(g, t, 0.14, 0.15, 0.4);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 0.7);
}

export function meow() {
  const a = ctx();
  if (!a || !throttle('meow', 3000)) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1200;
  f.Q.value = 2;
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(500, t);
  o.frequency.linearRampToValueAtTime(820, t + 0.15);
  o.frequency.linearRampToValueAtTime(420, t + 0.5);
  env(g, t, 0.12, 0.05, 0.5);
  o.connect(f).connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.6);
}
