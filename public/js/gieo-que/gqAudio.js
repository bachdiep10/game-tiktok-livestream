// Âm thanh sân miếu Gieo Quẻ: nhạc nền tự tạo (đàn tranh rải ngũ cung, sáo trúc ngân, mõ nhẹ) và hiệu ứng
// (lắc ống xăm, que rơi, gieo keo, chuông chùa, mõ, pháo hoa, sấm gió). Tạo bằng WebAudio, không dùng file có bản quyền.
// Có thể thay nhạc bằng MP3 riêng (thư mục public/assets/nhac-gieo-que).
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
// ngũ cung Việt (Rê - Mi - Sol - La - Si) cho đàn tranh, nhịp chậm thong thả
const BPM = 70;
const PENTA = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0];
const BASS = [146.83, 196.0, 220.0, 146.83];
// câu nhạc đàn tranh (chỉ số trong PENTA, -1 = nghỉ), 16 bước mỗi câu
const PHRASES = [
  [5, -1, 4, 3, 2, -1, 3, -1, 4, 5, 7, -1, 5, -1, -1, -1],
  [2, 3, 5, -1, 4, 3, 2, -1, 0, -1, 2, 3, 2, -1, -1, -1],
  [7, -1, 6, 5, 4, -1, 5, 6, 5, -1, 3, -1, 4, 3, -1, -1],
  [0, 2, 3, -1, 5, -1, 4, 3, 2, -1, 1, -1, 0, -1, -1, -1],
];
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;

// tiếng đàn tranh: dây gảy, có láy nhấn nhẹ (vibrato trễ)
function zither(t, f, vol = 0.07, bend = false) {
  const o = ac.createOscillator();
  const o2 = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(f * 7, t);
  lp.frequency.exponentialRampToValueAtTime(f * 1.6, t + 1.2);
  o.type = 'sawtooth';
  o2.type = 'triangle';
  o.frequency.setValueAtTime(f, t);
  o2.frequency.setValueAtTime(f * 2, t);
  if (bend) {
    o.frequency.setValueAtTime(f, t + 0.25);
    o.frequency.linearRampToValueAtTime(f * 1.06, t + 0.45);
    o.frequency.linearRampToValueAtTime(f, t + 0.7);
  }
  const lfo = ac.createOscillator();
  const lg = ac.createGain();
  lfo.frequency.value = 5.5;
  lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(f * 0.012, t + 0.6);
  lfo.connect(lg).connect(o.frequency);
  env(g, t, vol, 0.003, 1.8);
  const g2 = ac.createGain();
  g2.gain.value = 0.25;
  o.connect(lp);
  o2.connect(g2).connect(lp);
  lp.connect(g);
  g.connect(musicBus);
  g.connect(echoBus());
  for (const x of [o, o2, lfo]) {
    x.start(t);
    x.stop(t + 2);
  }
}
// sáo trúc ngân dài
function flute(t, f, dur, vol = 0.03) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lfo = ac.createOscillator();
  const lg = ac.createGain();
  o.type = 'sine';
  o.frequency.value = f;
  lfo.frequency.value = 4.8;
  lg.gain.value = f * 0.008;
  lfo.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const n = noise(ac);
  const nf = ac.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = f * 2;
  nf.Q.value = 4;
  const ng = ac.createGain();
  ng.gain.value = 0.15;
  n.connect(nf).connect(ng).connect(g);
  o.connect(g);
  g.connect(musicBus);
  g.connect(echoBus());
  for (const x of [o, lfo]) {
    x.start(t);
    x.stop(t + dur + 0.05);
  }
  n.start(t, Math.random());
  n.stop(t + dur + 0.05);
}
function softMo(t) {
  tone({ type: 'sine', f0: 820, f1: 700, t, vol: 0.05, decay: 0.12, dest: musicBus });
}

function scheduleStep(step, t) {
  const beat = 60 / BPM;
  const phrase = PHRASES[Math.floor(step / 16) % PHRASES.length];
  const s = step % 16;
  if (s === 0) {
    zither(t, BASS[Math.floor(step / 16) % BASS.length], 0.05);
    if (Math.random() < 0.6) flute(t + beat, PENTA[5 + Math.floor(Math.random() * 3)], beat * 6, 0.022);
  }
  const k = phrase[s];
  if (k >= 0) zither(t, PENTA[k], 0.055, Math.random() < 0.25);
  if (s % 8 === 4) softMo(t);
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

// lắc ống xăm: chuỗi tiếng que tre va nhau lách cách (gọi liên tục khi đang lắc)
export function rattle(intensity = 1) {
  const a = ctx();
  if (!a || !throttle('rattle', 70)) return;
  const t = a.currentTime;
  const n = 2 + Math.round(intensity * 3);
  for (let i = 0; i < n; i++) {
    const tt = t + Math.random() * 0.06;
    tone({ type: 'triangle', f0: 1400 + Math.random() * 1400, f1: 900, t: tt, vol: 0.05 + 0.03 * intensity, decay: 0.04 });
    burst({ t: tt, dur: 0.02, vol: 0.05, freq: 3500, q: 2 });
  }
}
// que xăm bật ra rơi xuống
export function stickOut() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone({ type: 'triangle', f0: 900, f1: 1800, t, vol: 0.1, decay: 0.25 });
  for (let i = 0; i < 3; i++) tone({ type: 'triangle', f0: 1200 - i * 200, t: t + 0.35 + i * 0.09, vol: 0.12 / (i + 1), decay: 0.06 });
}
// tung keo
export function toss() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.4;
  f.frequency.setValueAtTime(500, t);
  f.frequency.exponentialRampToValueAtTime(2600, t + 0.4);
  const g = a.createGain();
  env(g, t, 0.12, 0.1, 0.35);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 0.6);
}
// keo rơi xuống nền gạch: cạch cạch
export function keoLand() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (const [i, d] of [0, 0.11, 0.19, 0.26].entries()) {
    tone({ type: 'square', f0: 420 - i * 30, f1: 200, t: t + d, vol: 0.09 / (i + 1), decay: 0.05 });
    burst({ t: t + d, dur: 0.03, vol: 0.12 / (i + 1), type: 'lowpass', freq: 1400 });
  }
}
// chuông chùa lớn (thánh keo / quẻ tốt)
export function bigBell(big = false) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const base = big ? 98 : 130.81;
  for (const [ratio, amp] of [[1, 1], [2.0, 0.55], [2.76, 0.4], [4.07, 0.22], [5.4, 0.12]]) {
    tone({ f0: base * ratio, t, vol: 0.2 * amp, attack: 0.008, decay: (big ? 6 : 4) / Math.sqrt(ratio) });
  }
}
// mõ gỗ
export function mo(n = 1) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < n; i++) {
    tone({ type: 'sine', f0: 760, f1: 620, t: t + i * 0.32, vol: 0.2, decay: 0.12 });
    tone({ type: 'triangle', f0: 1520, f1: 1200, t: t + i * 0.32, vol: 0.05, decay: 0.06 });
  }
}
export function chimes(n = 6) {
  const a = ctx();
  if (!a || !throttle('chimes', 250)) return;
  const t = a.currentTime;
  for (let i = 0; i < n; i++) {
    const f = PENTA[Math.floor(Math.random() * PENTA.length)] * 2;
    tone({ f0: f, t: t + i * 0.09 + Math.random() * 0.04, vol: 0.06, decay: 1.3 });
  }
}
export function sparkle() {
  const a = ctx();
  if (!a || !throttle('sparkle', 120)) return;
  const t = a.currentTime;
  for (let i = 0; i < 3; i++) tone({ f0: 1800 + Math.random() * 1600, t: t + i * 0.05, vol: 0.025, decay: 0.3 });
}
// thua keo (âm / dương): tiếng trầm buồn ngắn
export function sad() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone({ type: 'triangle', f0: 392, f1: 370, t, vol: 0.1, decay: 0.35 });
  tone({ type: 'triangle', f0: 330, f1: 294, t: t + 0.3, vol: 0.1, decay: 0.6 });
}
// pháo hoa
export function firework() {
  const a = ctx();
  if (!a || !throttle('firework', 180)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 300, f1: 1400, t, vol: 0.04, attack: 0.02, decay: 0.5 });
  burst({ t: t + 0.55, dur: 0.5, vol: 0.22, type: 'lowpass', freq: 900 });
  for (let i = 0; i < 8; i++) burst({ t: t + 0.65 + Math.random() * 0.5, dur: 0.03, vol: 0.06, freq: 4000 + Math.random() * 3000, q: 3 });
}
// sấm + gió khi giải hạn
export function thunder() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 1.8, vol: 0.32, type: 'lowpass', freq: 220 });
  burst({ t: t + 0.05, dur: 0.25, vol: 0.2, type: 'lowpass', freq: 1200 });
}
export function wind(dur = 3) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 0.7;
  f.frequency.setValueAtTime(300, t);
  f.frequency.linearRampToValueAtTime(700, t + dur / 2);
  f.frequency.linearRampToValueAtTime(350, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.1, t + dur * 0.4);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + dur + 0.1);
}
// tiền vàng rơi (lộc trời)
export function coins(n = 10) {
  const a = ctx();
  if (!a || !throttle('coins', 400)) return;
  const t = a.currentTime;
  for (let i = 0; i < n; i++) {
    const tt = t + i * 0.07 + Math.random() * 0.05;
    tone({ type: 'square', f0: 2200 + Math.random() * 800, t: tt, vol: 0.025, decay: 0.08 });
    tone({ f0: 3300 + Math.random() * 600, t: tt + 0.02, vol: 0.02, decay: 0.2 });
  }
}
// tiếng tick đếm ngược
export function tick(high = false) {
  const a = ctx();
  if (!a) return;
  tone({ type: 'sine', f0: high ? 1320 : 880, t: a.currentTime, vol: 0.06, decay: 0.06 });
}
