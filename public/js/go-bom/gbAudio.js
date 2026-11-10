// Âm thanh game Gỡ bom cứu Boss: nhạc nền hồi hộp tự tạo (nhanh dần khi bom sắp nổ) hoặc file MP3 trong public/assets/nhac-go-bom,
// tiếng bíp đồng hồ bom, kéo cắt dây, tia lửa, nổ, reo hò, tim đập... Mọi tiếng đều tự tổng hợp, không dùng mẫu có bản quyền.
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

// ------------------------------------------------------------------ nhạc nền tự tạo: nhạc hồi hộp, tension 0..1 làm nhạc nhanh và dồn dập hơn
let tension = 0;
export function setTension(v) {
  tension = Math.max(0, Math.min(1, v));
}
const BASS = [55.0, 55.0, 58.27, 51.91];
const STAB = [[220.0, 261.63, 329.63], [220.0, 261.63, 329.63], [233.08, 277.18, 349.23], [207.65, 246.94, 311.13]];
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;
function scheduleStep(step, t) {
  const bar = Math.floor(step / 16) % 4;
  const s = step % 16;
  if (s % 2 === 0) tone({ type: 'sawtooth', f0: BASS[bar], t, vol: 0.13, attack: 0.005, decay: 0.12, dest: musicBus });
  if (s === 0 || s === 8) tone({ type: 'sine', f0: 110, f1: 40, t, vol: 0.4, attack: 0.003, decay: 0.2, dest: musicBus });
  if (tension > 0.4 && (s === 4 || s === 12)) tone({ type: 'sine', f0: 110, f1: 40, t, vol: 0.3, attack: 0.003, decay: 0.15, dest: musicBus });
  if (s === 4 || s === 12) burst({ t, dur: 0.1, vol: 0.09, freq: 1600, q: 0.8, dest: musicBus });
  if (s % 2 === 1 || tension > 0.6) burst({ t, dur: 0.03, vol: 0.035 + tension * 0.03, type: 'highpass', freq: 7500, dest: musicBus });
  if (s === 0) for (const f of STAB[bar]) tone({ type: 'square', f0: f, t, vol: 0.02, attack: 0.005, decay: 0.5, dest: musicBus });
  if (s === 10 && bar % 2 === 1) tone({ type: 'triangle', f0: STAB[bar][2] * 2, f1: STAB[bar][2] * 1.9, t, vol: 0.05, attack: 0.01, decay: 0.4, dest: musicBus });
}
function scheduler() {
  const bpm = 104 + tension * 52;
  const stepDur = 60 / bpm / 4;
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

// tiếng bíp của đồng hồ bom (urgent = cao và gấp hơn)
export function beep(urgent = false) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone({ type: 'square', f0: urgent ? 1760 : 1320, t, vol: urgent ? 0.07 : 0.045, attack: 0.002, decay: urgent ? 0.07 : 0.05 });
}

// kéo cắt dây "xoẹt tách"
export function snip() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 0.06, vol: 0.25, type: 'highpass', freq: 3000, q: 0.7 });
  burst({ t: t + 0.07, dur: 0.04, vol: 0.3, type: 'bandpass', freq: 4500, q: 2 });
  tone({ type: 'square', f0: 2400, f1: 900, t: t + 0.07, vol: 0.05, attack: 0.002, decay: 0.05 });
}

// tia lửa điện lách tách
export function spark() {
  const a = ctx();
  if (!a || !throttle('spark', 80)) return;
  const t = a.currentTime;
  for (let i = 0; i < 6; i++) burst({ t: t + Math.random() * 0.35, dur: 0.02, vol: 0.12 + Math.random() * 0.1, type: 'highpass', freq: 4000 + Math.random() * 3000, q: 0.5 });
}

// cắt đúng: "ting" + thở phào
export function correct() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  [783.99, 987.77, 1318.51].forEach((f, i) => {
    tone({ type: 'sine', f0: f, t: t + i * 0.08, vol: 0.2, attack: 0.004, decay: 0.45 });
    tone({ type: 'triangle', f0: f * 2, t: t + i * 0.08, vol: 0.05, attack: 0.004, decay: 0.3 });
  });
}

// cắt sai: còi báo động "bíp bíp" + rè
export function wrong() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < 3; i++) tone({ type: 'sawtooth', f0: 880, f1: 440, t: t + i * 0.22, vol: 0.1, attack: 0.005, decay: 0.18 });
  burst({ t, dur: 0.5, vol: 0.12, type: 'bandpass', freq: 300, q: 2 });
}

// tim đập thình thịch (những giây cuối)
export function heartbeat() {
  const a = ctx();
  if (!a || !throttle('heart', 400)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 70, f1: 45, t, vol: 0.5, attack: 0.005, decay: 0.12 });
  tone({ type: 'sine', f0: 62, f1: 40, t: t + 0.18, vol: 0.4, attack: 0.005, decay: 0.14 });
}

// NỔ to: chớp + ầm + vang
export function boom() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 0.12, vol: 0.6, type: 'highpass', freq: 1500, q: 0.4 });
  burst({ t, dur: 2.6, vol: 0.7, type: 'lowpass', freq: 380, q: 0.5 });
  burst({ t: t + 0.1, dur: 1.6, vol: 0.25, type: 'bandpass', freq: 900, q: 0.4 });
  tone({ type: 'sine', f0: 90, f1: 25, t, vol: 0.8, attack: 0.005, decay: 1.8 });
  tone({ type: 'sawtooth', f0: 60, f1: 30, t, vol: 0.15, attack: 0.005, decay: 1.0 });
  for (let i = 0; i < 10; i++) burst({ t: t + 0.4 + Math.random() * 1.4, dur: 0.05, vol: 0.06, freq: 2500 + Math.random() * 2000, q: 2 });
}

// tiếng ho khục khặc sau khi nổ
export function cough() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  [0, 0.28, 0.5].forEach((d) => burst({ t: t + d, dur: 0.14, vol: 0.18, type: 'bandpass', freq: 700, q: 1.5 }));
}

// trống dồn lúc chuẩn bị cắt
export function drumroll(dur = 2) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  let x = 0;
  while (x < dur) {
    const p = x / dur;
    burst({ t: t + x, dur: 0.06, vol: 0.06 + p * 0.12, type: 'bandpass', freq: 900 + p * 500, q: 0.9 });
    x += 0.07 - p * 0.03;
  }
}

// cứu được boss: kèn + reo hò
export function fanfare() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const seq = [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.4]];
  for (const [f, d] of seq) {
    tone({ type: 'sawtooth', f0: f, t: t + d, vol: 0.06, attack: 0.01, decay: d === 0.4 ? 0.9 : 0.14 });
    tone({ type: 'square', f0: f / 2, t: t + d, vol: 0.04, attack: 0.01, decay: d === 0.4 ? 0.9 : 0.14 });
  }
  cheer(1.8);
}
export function cheer(dur = 1.4) {
  const a = ctx();
  if (!a || !throttle('cheer', 600)) return;
  const t = a.currentTime;
  for (let i = 0; i < 28; i++) burst({ t: t + Math.random() * dur, dur: 0.05, vol: 0.08 + Math.random() * 0.08, freq: 1500 + Math.random() * 2000, q: 1.5 });
}

// cộng giây (thả tim): "bling" nhỏ
export function plus() {
  const a = ctx();
  if (!a || !throttle('plus', 90)) return;
  tone({ type: 'sine', f0: 880, f1: 1320, t: a.currentTime, vol: 0.07, attack: 0.003, decay: 0.1 });
}
// đốt giây: "xèo"
export function burn() {
  const a = ctx();
  if (!a || !throttle('burn', 150)) return;
  const t = a.currentTime;
  burst({ t, dur: 0.5, vol: 0.2, type: 'highpass', freq: 2500, q: 0.6 });
  tone({ type: 'sawtooth', f0: 300, f1: 120, t, vol: 0.06, attack: 0.01, decay: 0.35 });
}
// đóng băng đồng hồ
export function freeze() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < 8; i++) tone({ type: 'sine', f0: 2000 + i * 180, t: t + i * 0.04, vol: 0.05, attack: 0.003, decay: 0.25 });
}
// bật đèn pin "tách"
export function click() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 0.025, vol: 0.3, freq: 2500, q: 2 });
  tone({ type: 'sine', f0: 1500, t, vol: 0.05, attack: 0.002, decay: 0.08 });
}
// boss mới bị đẩy vào: "vút"
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
}
export function pop() {
  const a = ctx();
  if (!a || !throttle('pop', 50)) return;
  tone({ type: 'sine', f0: 500 + Math.random() * 300, f1: 1100, t: a.currentTime, vol: 0.07, attack: 0.003, decay: 0.08 });
}
// tiếng cười gian của Tiến sĩ Nổ "hơ hơ hơ"
export function evilLaugh() {
  const a = ctx();
  if (!a || !throttle('laugh', 1500)) return;
  const t = a.currentTime;
  for (let i = 0; i < 4; i++) tone({ type: 'sawtooth', f0: 180 - i * 12, f1: 140 - i * 12, t: t + i * 0.18, vol: 0.07, attack: 0.01, decay: 0.14 });
}
