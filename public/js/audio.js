// Âm thanh tổng hợp bằng WebAudio (không dùng file âm thanh bên ngoài)
// + giọng đọc tiếng Việt bằng Web Speech API nếu máy có giọng vi-VN.

let ac = null;
let master = null;
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
    master.gain.value = 0.6;
    master.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

// Mở khoá âm thanh sau cú click đầu tiên (trình duyệt thường chặn tự phát)
export function unlockAudio() {
  ctx();
  window.speechSynthesis?.getVoices();
}

// Chuông chùa: nhiều hoạ âm không điều hoà, tắt dần
export function bell(base = 196, gain = 0.5, duration = 5) {
  const a = ctx();
  if (!a) return;
  const now = a.currentTime;
  const partials = [
    [0.5, 0.35],
    [1, 1],
    [2.0, 0.5],
    [2.76, 0.45],
    [4.07, 0.25],
    [5.4, 0.18],
    [8.93, 0.08],
  ];
  for (const [ratio, amp] of partials) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.value = base * ratio;
    o.detune.value = (Math.random() - 0.5) * 6;
    const d = duration / Math.sqrt(ratio);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain * amp * 0.3, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + d + 0.1);
  }
}

// Tiếng chuông nhỏ (khánh) cho quà nhỏ
export function chime() {
  bell(880, 0.25, 2.2);
}

// Tiếng mõ gỗ
let lastMo = 0;
export function woodfish() {
  const a = ctx();
  if (!a) return;
  if (a.currentTime - lastMo < 0.18) return;
  lastMo = a.currentTime;
  const now = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  const f = a.createBiquadFilter();
  o.type = 'triangle';
  o.frequency.setValueAtTime(620, now);
  o.frequency.exponentialRampToValueAtTime(380, now + 0.12);
  f.type = 'bandpass';
  f.frequency.value = 700;
  f.Q.value = 3;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.6, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  o.connect(f).connect(g).connect(master);
  o.start(now);
  o.stop(now + 0.2);
}

// Âm "pop" nhẹ khi có người vào
export function pop() {
  const a = ctx();
  if (!a) return;
  const now = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(520, now);
  o.frequency.exponentialRampToValueAtTime(1040, now + 0.08);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  o.connect(g).connect(master);
  o.start(now);
  o.stop(now + 0.2);
}

// ------------------------------------------------------------- Giọng đọc
let voiceEnabled = true;
const speechQueue = [];
let speaking = false;

export function setVoiceEnabled(on) {
  voiceEnabled = on;
  if (!on) {
    speechQueue.length = 0;
    window.speechSynthesis?.cancel();
  }
}

// Giọng mong muốn (config.ttsVoice), ví dụ vi-VN-HoaiMyNeural -> tìm "HoaiMy" trong tên giọng của trình duyệt
let preferredVoice = 'HoaiMy';
export function setPreferredVoice(name) {
  const m = String(name || '').match(/vi-VN-([A-Za-z]+?)(Neural)?$/);
  if (m) preferredVoice = m[1];
}
function viVoices() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return voices.filter((v) => /^vi([-_]|$)/i.test(v.lang));
}
// giọng AI tự nhiên có sẵn trong trình duyệt Microsoft Edge ("Microsoft HoaiMy Online (Natural)")
function naturalVoice() {
  const list = viVoices().filter((v) => /natural|online/i.test(v.name));
  return list.find((v) => v.name.includes(preferredVoice)) || list[0] || null;
}
function pickVoice() {
  const list = viVoices();
  return naturalVoice() || list.find((v) => v.name.includes(preferredVoice)) || list[0] || null;
}

// priority: 2 = quà lớn (luôn đọc), 1 = follow/quà, 0 = chào hỏi (bỏ nếu hàng đợi dài)
// Chọn bộ đọc: 'auto' = giọng tiếng Việt của máy nếu có, không thì giọng online qua máy chủ;
// 'system' = chỉ giọng của máy; 'online' = luôn dùng giọng online.
let voiceEngine = 'auto';
let onSpeakStart = null;
export function setVoiceEngine(e) {
  voiceEngine = e || 'auto';
}
export function setOnSpeakStart(fn) {
  onSpeakStart = fn;
}

// 'auto': ưu tiên giọng AI online (tự nhiên hơn), lỗi mạng thì dùng giọng của máy.
let onlineFails = 0;
function useSystemVoice() {
  if (voiceEngine === 'online') return false;
  if (voiceEngine === 'system') return Boolean(window.speechSynthesis);
  // trình duyệt Edge có sẵn giọng AI tự nhiên -> dùng luôn, không cần máy chủ
  if (naturalVoice()) return true;
  // online lỗi liên tiếp nhiều lần -> tạm dùng giọng máy (nếu có)
  return onlineFails >= 3 && Boolean(window.speechSynthesis && pickVoice());
}

// cắt câu dài thành các đoạn vừa phải
function chunks(text, max = 300) {
  const parts = [];
  for (const sentence of text.split(/(?<=[.!?,])\s+/)) {
    if (!parts.length || (parts[parts.length - 1] + ' ' + sentence).length > max) parts.push(sentence);
    else parts[parts.length - 1] += ` ${sentence}`;
  }
  return parts.map((p) => p.slice(0, max));
}

function speakSystem(text, done) {
  if (!window.speechSynthesis) return done();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = 'vi-VN';
  u.rate = 1.0;
  u.pitch = 1.0;
  u.onend = done;
  u.onerror = done;
  window.speechSynthesis.speak(u);
}

function speakOnline(text, done) {
  const list = chunks(text);
  let first = true;
  const next = () => {
    const part = list.shift();
    if (!part) return done();
    const audio = new Audio(`/tts?text=${encodeURIComponent(part)}`);
    audio.volume = 1;
    audio.onended = () => {
      onlineFails = 0;
      first = false;
      next();
    };
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      onlineFails++;
      // câu đầu lỗi -> đọc cả câu bằng giọng máy (chế độ auto)
      if (first && voiceEngine === 'auto' && window.speechSynthesis && pickVoice()) {
        list.length = 0;
        speakSystem(text, done);
      } else next();
      first = false;
    };
    audio.onerror = fail;
    audio.play().catch(fail);
  };
  next();
}

export function speak(text, priority = 0) {
  if (!voiceEnabled || !enabled) return;
  if (priority === 0 && speechQueue.length >= 2) return;
  if (speechQueue.length >= 6) {
    const idx = speechQueue.findIndex((s) => s.priority < priority);
    if (idx === -1) return;
    speechQueue.splice(idx, 1);
  }
  speechQueue.push({ text, priority });
  speechQueue.sort((x, y) => y.priority - x.priority);
  pump();
}

function pump() {
  if (speaking || !speechQueue.length) return;
  const { text } = speechQueue.shift();
  speaking = true;
  if (onSpeakStart) onSpeakStart(text);
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    speaking = false;
    setTimeout(pump, 150);
  };
  // phòng trường hợp trình duyệt không báo đọc xong
  setTimeout(done, 25000);
  if (useSystemVoice()) speakSystem(text, done);
  else speakOnline(text, done);
}

// ------------------------------------------------------------- Nhạc nền
// Nhạc thiền tự tạo: tiếng nền trầm + giai điệu ngũ cung chậm + khánh nhẹ.
// Hoặc phát file nhạc riêng (config.musicFile) nếu có.
let music = null;

export function startMusic({ file = '', volume = 0.25 } = {}) {
  if (music) return;
  if (file) {
    const el = new Audio(file);
    el.loop = true;
    el.volume = Math.max(0, Math.min(1, volume));
    music = { el };
    const tryPlay = () => el.play().catch(() => {});
    tryPlay();
    window.addEventListener('pointerdown', tryPlay, { once: true });
    return;
  }
  const a = ctx();
  if (!a) return;
  const out = a.createGain();
  out.gain.value = volume;
  // tiếng vang đơn giản bằng delay có phản hồi
  const delay = a.createDelay(2);
  delay.delayTime.value = 0.55;
  const fb = a.createGain();
  fb.gain.value = 0.45;
  const wet = a.createGain();
  wet.gain.value = 0.5;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  delay.connect(fb).connect(lp).connect(delay);
  lp.connect(wet).connect(out);
  out.connect(master);

  // nền trầm (Rê + La), thở chậm
  const drones = [];
  for (const [f, g] of [[73.42, 0.22], [110, 0.14], [146.83, 0.07]]) {
    for (const det of [-4, 4]) {
      const o = a.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = det;
      const gg = a.createGain();
      gg.gain.value = g * 0.5;
      const f2 = a.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = 500;
      o.connect(f2).connect(gg).connect(out);
      o.start();
      drones.push(o);
    }
  }
  const lfo = a.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = a.createGain();
  lfoGain.gain.value = volume * 0.25;
  lfo.connect(lfoGain).connect(out.gain);
  lfo.start();

  // giai điệu ngũ cung (Rê - Mi - Fa# - La - Si)
  const scale = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25];
  let idx = 3;
  let beat = 0;
  const flute = (freq, dur) => {
    const now = a.currentTime;
    const o = a.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const vib = a.createOscillator();
    vib.frequency.value = 5;
    const vg = a.createGain();
    vg.gain.value = freq * 0.006;
    vib.connect(vg).connect(o.frequency);
    const o2 = a.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = freq * 2;
    const g2 = a.createGain();
    g2.gain.value = 0.15;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + 0.35);
    g.gain.setValueAtTime(0.16, now + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o2.connect(g2).connect(g);
    o.connect(g);
    g.connect(out);
    g.connect(delay);
    for (const x of [o, o2, vib]) {
      x.start(now);
      x.stop(now + dur + 0.1);
    }
  };
  const step = () => {
    if (!music) return;
    beat++;
    const r = Math.random();
    if (r < 0.75) {
      idx = Math.max(0, Math.min(scale.length - 1, idx + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      flute(scale[idx], 1.6 + Math.random() * 1.6);
    }
    if (beat % 8 === 0) bell(587.33, 0.12, 4);
    music.timer = setTimeout(step, 1400 + Math.random() * 1400);
  };
  music = { out, drones, lfo, timer: setTimeout(step, 1500) };
}

export function stopMusic() {
  if (!music) return;
  if (music.el) music.el.pause();
  clearTimeout(music.timer);
  music.drones?.forEach((o) => o.stop());
  music.lfo?.stop();
  music.out?.disconnect();
  music = null;
}
