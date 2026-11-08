// Âm thanh game Leo núi: nhạc nền phiêu lưu tự tạo (dây trầm + kèn đồng + trống trận nhẹ), gió núi,
// tiếng bước trên tuyết, tăng tốc, trực thăng, kèn chiến thắng. Tạo bằng WebAudio, không dùng file có bản quyền.
// Có thể thay nhạc bằng MP3 riêng (thư mục public/assets/nhac-leo-nui).
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
// Rê thứ - Si giáng - Fa - Đô (hành khúc phiêu lưu), nhịp vừa
const BPM = 88;
const CHORDS = [
  [73.42, 146.83, 220.0, 293.66, 349.23],
  [58.27, 116.54, 174.61, 233.08, 293.66],
  [87.31, 174.61, 220.0, 261.63, 349.23],
  [65.41, 130.81, 196.0, 261.63, 329.63],
];
// giai điệu kèn: mỗi ô nhịp 8 nốt móc đơn (0 = nghỉ)
const MELODY = [
  [587.33, 0, 0, 659.25, 698.46, 0, 659.25, 587.33],
  [466.16, 0, 0, 0, 523.25, 0, 587.33, 0],
  [523.25, 0, 0, 587.33, 698.46, 0, 880.0, 0],
  [783.99, 0, 698.46, 0, 659.25, 0, 0, 0],
];
let musicOn = false;
let timer = null;
let nextStep = 0;
let stepIdx = 0;

function strings(t, chord, dur) {
  for (const f of chord.slice(1)) {
    for (const det of [-7, 7]) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1300;
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.011, t + dur * 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.02);
      o.connect(lp).connect(g).connect(musicBus);
      o.start(t);
      o.stop(t + dur * 1.05);
    }
  }
}
function bass(t, f, dur) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.value = f;
  env(g, t, 0.09, 0.01, dur);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function horn(t, f, dur) {
  const o = ac.createOscillator();
  const o2 = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(700, t);
  lp.frequency.linearRampToValueAtTime(2200, t + 0.12);
  o.type = 'sawtooth';
  o2.type = 'square';
  o.frequency.value = f;
  o2.frequency.value = f / 2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.03, t + 0.06);
  g.gain.setValueAtTime(0.03, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(lp);
  o2.connect(lp);
  lp.connect(g);
  g.connect(musicBus);
  g.connect(echoBus());
  o.start(t);
  o2.start(t);
  o.stop(t + dur + 0.05);
  o2.stop(t + dur + 0.05);
}
function drum(t, big) {
  tone({ type: 'sine', f0: big ? 110 : 80, f1: 40, t, vol: big ? 0.16 : 0.1, decay: 0.3, dest: musicBus });
  if (big) burst({ t, dur: 0.12, vol: 0.05, type: 'lowpass', freq: 900, dest: musicBus });
}

function scheduleStep(step, t) {
  const beat = 60 / BPM;
  const bar = Math.floor(step / 8);
  const s8 = step % 8;
  const chord = CHORDS[bar % 4];
  if (s8 === 0) strings(t, chord, beat * 4);
  if (s8 % 2 === 0) bass(t, chord[0] * (s8 === 4 ? 2 : 1), beat * 0.9);
  if (s8 === 0 || s8 === 3 || s8 === 4 || s8 === 6) drum(t, s8 === 0 || s8 === 4);
  // kèn chỉ chơi ở nửa sau mỗi vòng 8 ô nhịp cho đỡ đơn điệu
  if (Math.floor(bar / 4) % 2 === 1) {
    const f = MELODY[bar % 4][s8];
    if (f) horn(t, f, beat * (MELODY[bar % 4][s8 + 1] === 0 ? 1.4 : 0.5));
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

// ------------------------------------------------------------------ gió núi (luôn chạy, mạnh lên khi bão)
let windGain = null;
let windFilter = null;
export function startWind() {
  const a = ctx();
  if (!a || windGain) return;
  const n = noise(a);
  n.loop = true;
  windFilter = a.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 500;
  windFilter.Q.value = 0.7;
  windGain = a.createGain();
  windGain.gain.value = 0.02;
  const lfo = a.createOscillator();
  const lfoG = a.createGain();
  lfo.frequency.value = 0.13;
  lfoG.gain.value = 220;
  lfo.connect(lfoG).connect(windFilter.frequency);
  n.connect(windFilter).connect(windGain).connect(master);
  n.start();
  lfo.start();
}
// level: 0 = lặng, 1 = gió thường, 2 = bão tuyết
export function setWind(level) {
  if (!ac || !windGain) return;
  const v = [0.008, 0.022, 0.09][level] ?? 0.022;
  windGain.gain.setTargetAtTime(v, ac.currentTime, 1.2);
  windFilter.frequency.setTargetAtTime(level === 2 ? 900 : 500, ac.currentTime, 1.2);
}

// bước chân lạo xạo trên tuyết
export function crunch() {
  const a = ctx();
  if (!a || !throttle('crunch', 140)) return;
  const t = a.currentTime;
  burst({ t, dur: 0.07, vol: 0.06, type: 'bandpass', freq: 1500 + Math.random() * 1500, q: 0.9 });
  burst({ t: t + 0.03, dur: 0.05, vol: 0.04, type: 'highpass', freq: 3500 });
}

export function pop() {
  const a = ctx();
  if (!a || !throttle('pop', 90)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 700 + Math.random() * 300, f1: 1400, t, vol: 0.05, decay: 0.12 });
}

// tăng tốc khi có quà
export function boost(level = 1) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.4;
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(3500, t + 0.6);
  const g = a.createGain();
  env(g, t, 0.16, 0.2, 0.5);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 0.8);
  const notes = level >= 3 ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : level === 2 ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 783.99, 987.77];
  notes.forEach((fr, i) => tone({ type: 'triangle', f0: fr, t: t + 0.08 + i * 0.07, vol: 0.07, decay: 0.35 }));
}

// trực thăng: tiếng cánh quạt đập đều trong vài giây
export function helicopter(sec = 4) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const rate = 11;
  for (let i = 0; i < sec * rate; i++) {
    const tt = t + i / rate;
    const k = Math.min(1, i / 8, (sec * rate - i) / 10);
    burst({ t: tt, dur: 0.06, vol: 0.13 * k, type: 'lowpass', freq: 380, q: 1 });
  }
  tone({ type: 'sawtooth', f0: 95, t, vol: 0.02, attack: 0.5, decay: sec });
}

// tới trại: hai nốt kèn ngắn
export function camp() {
  const a = ctx();
  if (!a || !throttle('camp', 800)) return;
  const t = a.currentTime;
  [587.33, 880].forEach((f, i) => tone({ type: 'triangle', f0: f, t: t + i * 0.16, vol: 0.09, attack: 0.02, decay: 0.45 }));
}

// lên đỉnh: kèn chiến thắng
export function fanfare() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const seq = [[523.25, 0], [523.25, 0.15], [523.25, 0.3], [698.46, 0.45], [880, 0.9], [783.99, 1.2], [1046.5, 1.5]];
  for (const [f, d] of seq) {
    tone({ type: 'sawtooth', f0: f, t: t + d, vol: 0.05, attack: 0.02, decay: d >= 1.5 ? 1.6 : 0.4 });
    tone({ type: 'triangle', f0: f / 2, t: t + d, vol: 0.06, attack: 0.02, decay: d >= 1.5 ? 1.6 : 0.4 });
  }
  for (let i = 0; i < 6; i++) tone({ type: 'sine', f0: 60, f1: 40, t: t + 1.5 + i * 0.12, vol: 0.12, decay: 0.25 });
}

// tuyết lở: tiếng ầm trầm kéo dài
export function rumble() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const n = noise(a);
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 220;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + 4.1);
}

export function whoosh() {
  const a = ctx();
  if (!a || !throttle('whoosh', 300)) return;
  const t = a.currentTime;
  burst({ t, dur: 0.4, vol: 0.1, type: 'bandpass', freq: 1200, q: 0.6 });
}
