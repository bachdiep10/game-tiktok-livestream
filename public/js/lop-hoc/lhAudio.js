// Âm thanh game Lớp học: nhạc nền (mặc định dùng file MP3 trong public/assets/nhac-lop-hoc, nếu thiếu thì tự tạo bằng WebAudio),
// tiếng tích tắc, trống dồn khi đếm ngược, chuông đúng, và các tiếng "phạt" vui: phấn bay, trứng vỡ, gà gáy, sấm, điện thoại...
// Không dùng mẫu âm thanh có bản quyền: mọi tiếng đều tự tổng hợp.
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

// ------------------------------------------------------------------ tiếng riêng của lớp học
// trống trường "tùng tùng tùng"
export function schoolDrum(times = 3) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < times; i++) {
    const tt = t + i * 0.42;
    tone({ type: 'sine', f0: 140, f1: 55, t: tt, vol: 0.55, attack: 0.004, decay: 0.45 });
    burst({ t: tt, dur: 0.12, vol: 0.18, type: 'lowpass', freq: 600, q: 0.7 });
  }
}

// trống dồn lúc đếm ngược (dur giây), kết thúc bằng một tiếng chũm chọe
export function drumroll(dur = 4.5) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  let x = 0;
  while (x < dur) {
    const p = x / dur;
    burst({ t: t + x, dur: 0.06, vol: 0.06 + p * 0.12, type: 'bandpass', freq: 900 + p * 500, q: 0.9 });
    x += 0.07 - p * 0.03;
  }
  tone({ type: 'sine', f0: 90, f1: 40, t: t + dur, vol: 0.5, attack: 0.003, decay: 0.4 });
  burst({ t: t + dur, dur: 1.2, vol: 0.2, type: 'highpass', freq: 5000, q: 0.5 });
}

// tiếng "tách" đèn chạy qua ô đáp án
export function blip(hi = false) {
  const a = ctx();
  if (!a) return;
  tone({ type: 'square', f0: hi ? 1200 : 820, t: a.currentTime, vol: 0.05, attack: 0.002, decay: 0.06 });
}

// cả nhóm sai: "tèn tén ten"
export function wrongGroup() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  [[392, 0], [370, 0.28], [349, 0.56], [330, 0.84]].forEach(([f, d], i) => {
    tone({ type: 'sawtooth', f0: f, f1: i === 3 ? f * 0.85 : 0, t: t + d, vol: 0.07, attack: 0.01, decay: i === 3 ? 0.9 : 0.24 });
    tone({ type: 'square', f0: f / 2, t: t + d, vol: 0.04, attack: 0.01, decay: i === 3 ? 0.9 : 0.24 });
  });
}

// phấn bay "vèo" rồi "cốc"
export function chalk() {
  const a = ctx();
  if (!a || !throttle('chalk', 90)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 1800, f1: 600, t, vol: 0.05, attack: 0.01, decay: 0.25 });
  tone({ type: 'square', f0: 900, f1: 300, t: t + 0.28, vol: 0.12, attack: 0.002, decay: 0.05 });
  burst({ t: t + 0.28, dur: 0.25, vol: 0.12, freq: 3000, q: 0.6 });
}

// ô đáp án sập + tiếng trượt dài
export function crumble() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < 10; i++) burst({ t: t + i * 0.05, dur: 0.12, vol: 0.12, type: 'lowpass', freq: 500 + Math.random() * 600, q: 0.8 });
  tone({ type: 'sine', f0: 1200, f1: 150, t: t + 0.1, vol: 0.12, attack: 0.02, decay: 1.1 });
  tone({ type: 'sine', f0: 80, f1: 35, t: t + 1.1, vol: 0.5, attack: 0.003, decay: 0.4 });
}

// trứng rơi "bộp" + gà con "chiếp chiếp"
export function egg() {
  const a = ctx();
  if (!a || !throttle('egg', 120)) return;
  const t = a.currentTime;
  tone({ type: 'sine', f0: 900, f1: 300, t, vol: 0.06, attack: 0.01, decay: 0.3 });
  burst({ t: t + 0.32, dur: 0.18, vol: 0.25, type: 'lowpass', freq: 900, q: 0.8 });
  for (let i = 0; i < 4; i++) tone({ type: 'sine', f0: 3200, f1: 4200, t: t + 0.8 + i * 0.16, vol: 0.05, attack: 0.005, decay: 0.07 });
}

// gà trống gáy "ò ó o o"
export function rooster() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const seg = [[520, 700, 0, 0.18], [700, 640, 0.2, 0.18], [760, 900, 0.42, 0.25], [900, 520, 0.7, 0.55]];
  for (const [f0, f1, d, len] of seg) {
    const o = a.createOscillator();
    const o2 = a.createOscillator();
    const g = a.createGain();
    o.type = 'sawtooth';
    o2.type = 'square';
    o.frequency.setValueAtTime(f0, t + d);
    o.frequency.linearRampToValueAtTime(f1, t + d + len);
    o2.frequency.setValueAtTime(f0 * 1.5, t + d);
    o2.frequency.linearRampToValueAtTime(f1 * 1.5, t + d + len);
    const f = a.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1400;
    f.Q.value = 1.5;
    g.gain.setValueAtTime(0.0001, t + d);
    g.gain.exponentialRampToValueAtTime(0.18, t + d + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + len);
    o.connect(f);
    o2.connect(f);
    f.connect(g).connect(master);
    o.start(t + d);
    o2.start(t + d);
    o.stop(t + d + len + 0.05);
    o2.stop(t + d + len + 0.05);
  }
}

// mổ "cốc"
export function peck() {
  const a = ctx();
  if (!a || !throttle('peck', 70)) return;
  tone({ type: 'square', f0: 1500, f1: 700, t: a.currentTime, vol: 0.1, attack: 0.002, decay: 0.04 });
}

// sấm sét
export function thunder() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  burst({ t, dur: 0.15, vol: 0.4, type: 'highpass', freq: 2500, q: 0.5 });
  burst({ t: t + 0.05, dur: 1.8, vol: 0.45, type: 'lowpass', freq: 260, q: 0.6 });
  tone({ type: 'sine', f0: 60, f1: 30, t: t + 0.05, vol: 0.4, attack: 0.01, decay: 1.4 });
}

// điện thoại đổ chuông "reng reng"
export function phone(times = 2) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let r = 0; r < times; r++) {
    for (let i = 0; i < 14; i++) {
      const tt = t + r * 1.1 + i * 0.05;
      tone({ type: 'square', f0: i % 2 ? 1300 : 1100, t: tt, vol: 0.05, attack: 0.002, decay: 0.045 });
    }
  }
}

// mũ giấy rơi "bụp" + kèn trượt
export function boing() {
  const a = ctx();
  if (!a || !throttle('boing', 90)) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(520, t + 0.08);
  o.frequency.exponentialRampToValueAtTime(140, t + 0.4);
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.5);
}

// cô giáo khóc / cả lớp "ồồồ"
export function ooh() {
  const a = ctx();
  if (!a || !throttle('ooh', 800)) return;
  const t = a.currentTime;
  for (let v = 0; v < 6; v++) {
    const f0 = 180 + v * 37;
    tone({ type: 'triangle', f0, f1: f0 * 0.82, t: t + v * 0.03, vol: 0.05, attack: 0.15, decay: 1.1 });
  }
}

// tiếng mưa rào
export function rain(dur = 3) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < dur * 30; i++) burst({ t: t + Math.random() * dur, dur: 0.03, vol: 0.03 + Math.random() * 0.04, type: 'highpass', freq: 4000 + Math.random() * 3000, q: 0.7 });
}

// kính Na vỡ "xoảng"
export function glass() {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < 9; i++) tone({ type: 'sine', f0: 2500 + Math.random() * 3500, t: t + Math.random() * 0.25, vol: 0.06, attack: 0.002, decay: 0.3 });
  burst({ t, dur: 0.3, vol: 0.18, type: 'highpass', freq: 6000, q: 0.7 });
}

// ô dù bật ra (thẻ miễn phạt)
export function umbrella() {
  const a = ctx();
  if (!a || !throttle('umbrella', 200)) return;
  const t = a.currentTime;
  burst({ t, dur: 0.12, vol: 0.18, freq: 1200, q: 1 });
  tone({ type: 'sine', f0: 400, f1: 1200, t, vol: 0.1, attack: 0.005, decay: 0.15 });
}

// "bụp" biến hình: khói + tiếng trượt lên
export function poof() {
  const a = ctx();
  if (!a || !throttle('poof', 120)) return;
  const t = a.currentTime;
  burst({ t, dur: 0.22, vol: 0.22, type: 'lowpass', freq: 900, q: 0.7 });
  tone({ type: 'sine', f0: 300, f1: 1400, t: t + 0.04, vol: 0.12, attack: 0.005, decay: 0.22 });
  tone({ type: 'triangle', f0: 1800, f1: 2400, t: t + 0.2, vol: 0.05, attack: 0.003, decay: 0.15 });
}

// tiếng khóc "hu hu" (giai điệu trượt xuống, rung rung)
export function sob() {
  const a = ctx();
  if (!a || !throttle('sob', 600)) return;
  const t = a.currentTime;
  [0, 0.42].forEach((d, i) => {
    const o = a.createOscillator();
    const g = a.createGain();
    const lfo = a.createOscillator();
    const lg = a.createGain();
    o.type = 'triangle';
    const f = i ? 440 : 520;
    o.frequency.setValueAtTime(f, t + d);
    o.frequency.exponentialRampToValueAtTime(f * 0.72, t + d + 0.38);
    lfo.frequency.value = 11;
    lg.gain.value = 18;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t + d);
    g.gain.exponentialRampToValueAtTime(0.13, t + d + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.4);
    o.connect(g).connect(master);
    o.start(t + d);
    lfo.start(t + d);
    o.stop(t + d + 0.42);
    lfo.stop(t + d + 0.42);
  });
}
