// Nhạc sàn + hiệu ứng âm thanh tự tạo bằng WebAudio (không dùng bản nhạc có bản quyền).
// Có thể thay bằng file nhạc riêng qua config-bar.json -> musicFile.

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
    master.gain.value = 0.7;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -12;
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
    noiseBuf = a.createBuffer(1, a.sampleRate * 1.5, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const n = a.createBufferSource();
  n.buffer = noiseBuf;
  return n;
}

function env(a, g, t, peak, attack, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

// ------------------------------------------------------------------ nhạc sàn
export let BPM = 124;
let musicOn = false;
let musicStart = 0;
let nextStep = 0;
let stepIdx = 0;
let timer = null;
let fileEl = null;
let drop = false; // đoạn cao trào (bão tim / quà lớn)
let filterNode = null;

// vòng hợp âm Am - F - C - G (tần số nốt gốc của bass)
const ROOTS = [55, 43.65, 65.41, 49];
const CHORDS = [
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [261.63, 329.63, 392],
  [196, 246.94, 293.66],
];
const ARP = [0, 1, 2, 1, 2, 0, 1, 2];

function kick(t) {
  const a = ac;
  const o = a.createOscillator();
  const g = a.createGain();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  env(a, g, t, 0.9, 0.003, 0.28);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + 0.35);
}

function hat(t, open, vol = 0.12) {
  const a = ac;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 7000;
  const g = a.createGain();
  env(a, g, t, vol, 0.002, open ? 0.18 : 0.04);
  n.connect(f).connect(g).connect(musicBus);
  n.start(t, Math.random());
  n.stop(t + 0.25);
}

function clap(t) {
  const a = ac;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1500;
  f.Q.value = 0.8;
  const g = a.createGain();
  env(a, g, t, 0.35, 0.004, 0.16);
  n.connect(f).connect(g).connect(musicBus);
  n.start(t, Math.random());
  n.stop(t + 0.25);
}

function bass(t, freq, len) {
  const a = ac;
  const o = a.createOscillator();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  o.type = 'sawtooth';
  o.frequency.value = freq;
  f.type = 'lowpass';
  f.frequency.setValueAtTime(drop ? 900 : 500, t);
  f.frequency.exponentialRampToValueAtTime(140, t + len);
  env(a, g, t, 0.32, 0.005, len);
  o.connect(f).connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + len + 0.05);
}

function stab(t, notes, vol = 0.07, len = 0.22) {
  const a = ac;
  for (const fr of notes) {
    for (const det of [-8, 8]) {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'sawtooth';
      o.frequency.value = fr;
      o.detune.value = det;
      env(a, g, t, vol, 0.006, len);
      o.connect(g).connect(filterNode);
      o.start(t);
      o.stop(t + len + 0.05);
    }
  }
}

function pluck(t, freq) {
  const a = ac;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'square';
  o.frequency.value = freq;
  env(a, g, t, 0.05, 0.003, 0.12);
  o.connect(g).connect(filterNode);
  o.start(t);
  o.stop(t + 0.2);
}

function scheduleStep(step, t) {
  const bar = Math.floor(step / 16) % 4;
  const s16 = step % 16;
  if (s16 % 4 === 0) kick(t);
  if (s16 === 4 || s16 === 12) clap(t);
  if (s16 % 4 === 2) hat(t, true, 0.1);
  else hat(t, false, drop ? 0.07 : 0.04);
  if (s16 % 4 === 2) bass(t, ROOTS[bar], 0.16);
  if (s16 === 14 && drop) bass(t, ROOTS[bar] * 2, 0.1);
  if ([0, 3, 6, 10].includes(s16)) stab(t, CHORDS[bar], s16 === 0 ? 0.06 : 0.04);
  if (drop) pluck(t, CHORDS[bar][ARP[s16 % 8]] * 2);
}

function scheduler() {
  const stepDur = 60 / BPM / 4;
  while (nextStep < ac.currentTime + 0.12) {
    scheduleStep(stepIdx, nextStep);
    nextStep += stepDur;
    stepIdx++;
  }
}

// Danh sách bài hát: phát lần lượt, hết bài cuối thì quay lại bài đầu.
// Bài nào lỗi (sai tên, hỏng file) thì bỏ qua; nếu mọi bài đều lỗi thì dùng nhạc tự tạo.
let playlist = [];
let trackIdx = 0;
let trackFails = 0;
let fileVolume = 0.7;
let attempt = 0;
function playTrack() {
  if (!playlist.length || !fileEl) return;
  const my = ++attempt; // mỗi lần thử chỉ được tính lỗi một lần
  const src = playlist[trackIdx % playlist.length];
  fileEl.dataset.attempt = String(my);
  fileEl.src = src;
  fileEl.volume = fileVolume;
  fileEl.play().then(() => {
    trackFails = 0;
    blocked = false;
  }).catch((err) => {
    if (my !== attempt) return;
    if (err && err.name === 'NotAllowedError') {
      // trình duyệt chặn tự phát: chờ cú click / thử lại sau
      blocked = true;
      musicOn = false;
      return;
    }
    if (err && err.name === 'AbortError') return;
    console.warn('[nhạc] Không phát được', decodeURIComponent(src), err?.message || err);
    attempt++;
    nextTrack(true);
  });
}
let blocked = false;
// nhạc có đang thực sự phát ra không (để báo lên màn hình khi bị chặn)
export function musicAudible() {
  if (fileEl) return !fileEl.paused;
  return Boolean(musicOn && ac && ac.state === 'running');
}
function nextTrack(failed = false) {
  if (failed) trackFails++;
  if (trackFails >= playlist.length) {
    console.warn('[nhạc] Không phát được bài nào trong danh sách, dùng nhạc tự tạo.');
    fileEl = null;
    playlist = [];
    startGenerated();
    return;
  }
  trackIdx = (trackIdx + 1) % playlist.length;
  playTrack();
}
export function currentTrack() {
  if (!fileEl || !playlist.length) return '';
  return decodeURIComponent(playlist[trackIdx % playlist.length].split('/').pop()).replace(/\.[a-z0-9]+$/i, '');
}

function startGenerated() {
  musicStart = ac.currentTime + 0.1;
  nextStep = musicStart;
  stepIdx = 0;
  clearInterval(timer);
  timer = setInterval(scheduler, 25);
}

export function startMusic({ file = '', files = [], volume = 0.35, bpm = 124 } = {}) {
  if (musicOn) return;
  const a = ctx();
  if (!a) return;
  BPM = bpm || 124;
  if (!musicBus) {
    musicBus = a.createGain();
    musicBus.connect(master);
    filterNode = a.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 2200;
    filterNode.connect(musicBus);
  }
  musicBus.gain.value = volume;
  musicOn = true;
  const list = [...(files || []), ...(file ? [file] : [])].filter(Boolean);
  if (list.length) {
    if (!fileEl) {
      playlist = list;
      fileVolume = Math.min(1, volume * 2);
      fileEl = new Audio();
      fileEl.preload = 'auto';
      fileEl.addEventListener('ended', () => nextTrack(false));
      fileEl.addEventListener('error', () => {
        if (fileEl && fileEl.dataset.attempt !== String(attempt)) return;
        console.warn('[nhạc] File lỗi, bỏ qua:', decodeURIComponent(fileEl?.src || ''));
        attempt++;
        nextTrack(true);
      });
    }
    musicStart = a.currentTime;
    playTrack();
    return;
  }
  startGenerated();
}

export function musicPlaying() {
  return musicOn && ac && ac.state === 'running';
}

// nhịp hiện tại (số thực, tính bằng phách) để hình ảnh nhún theo nhạc
const pageStart = performance.now();
export function beatNow() {
  if (musicOn && ac && ac.state === 'running' && !fileEl) {
    return Math.max(0, ac.currentTime - musicStart) * (BPM / 60);
  }
  return ((performance.now() - pageStart) / 1000) * (BPM / 60);
}

export function setDrop(on) {
  drop = on;
  if (filterNode && ac) filterNode.frequency.setTargetAtTime(on ? 6000 : 2200, ac.currentTime, 0.3);
}

// ------------------------------------------------------------------ hiệu ứng
function sweepNoise({ from, to, dur, vol = 0.3, type = 'bandpass', q = 1.5 }) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(master);
  n.start(t, Math.random() * 0.3);
  n.stop(t + dur + 0.05);
}

let lastWhoosh = 0;
export function whoosh() {
  const a = ctx();
  if (!a || a.currentTime - lastWhoosh < 0.12) return;
  lastWhoosh = a.currentTime;
  sweepNoise({ from: 3000, to: 300, dur: 0.7, vol: 0.18 });
}

let lastThud = 0;
export function thud(big = false) {
  const a = ctx();
  if (!a || a.currentTime - lastThud < 0.08) return;
  lastThud = a.currentTime;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.frequency.setValueAtTime(big ? 120 : 180, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
  env(a, g, t, big ? 0.8 : 0.4, 0.004, 0.3);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.4);
}

let lastPop = 0;
export function pop() {
  const a = ctx();
  if (!a || a.currentTime - lastPop < 0.06) return;
  lastPop = a.currentTime;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(500 + Math.random() * 400, t);
  o.frequency.exponentialRampToValueAtTime(1400, t + 0.06);
  env(a, g, t, 0.15, 0.003, 0.09);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.12);
}

export function sparkle() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  [1318.5, 1568, 1975.5, 2637].forEach((fr, i) => {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'triangle';
    o.frequency.value = fr;
    env(a, g, t + i * 0.06, 0.12, 0.004, 0.35);
    o.connect(g).connect(master);
    o.start(t + i * 0.06);
    o.stop(t + i * 0.06 + 0.4);
  });
}

export function horn() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (const [st, dur] of [[0, 0.16], [0.2, 0.16], [0.4, 0.7]]) {
    for (const fr of [466, 470, 233]) {
      const o = a.createOscillator();
      const g = a.createGain();
      const f = a.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2500;
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(fr, t + st);
      o.frequency.linearRampToValueAtTime(fr * 0.94, t + st + dur);
      g.gain.setValueAtTime(0.0001, t + st);
      g.gain.exponentialRampToValueAtTime(0.09, t + st + 0.02);
      g.gain.setValueAtTime(0.09, t + st + dur - 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + st + dur);
      o.connect(f).connect(g).connect(master);
      o.start(t + st);
      o.stop(t + st + dur + 0.05);
    }
  }
}

export function laser() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(1800, t);
  o.frequency.exponentialRampToValueAtTime(120, t + 0.35);
  env(a, g, t, 0.06, 0.003, 0.35);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.4);
}

export function riser(dur = 2) {
  sweepNoise({ from: 300, to: 8000, dur, vol: 0.25, q: 3 });
}

export function cheer() {
  sweepNoise({ from: 900, to: 1400, dur: 2.2, vol: 0.22, q: 0.4 });
}

export function boom() {
  const a = ctx();
  if (!a) return;
  thud(true);
  sweepNoise({ from: 1200, to: 80, dur: 1.2, vol: 0.35, type: 'lowpass', q: 0.5 });
}
