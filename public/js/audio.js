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

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return voices.find((v) => /vi[-_]VN/i.test(v.lang)) || voices.find((v) => /^vi/i.test(v.lang)) || null;
}

// priority: 2 = quà lớn (luôn đọc), 1 = follow/quà, 0 = chào hỏi (bỏ nếu hàng đợi dài)
export function speak(text, priority = 0) {
  if (!voiceEnabled || !enabled || !window.speechSynthesis) return;
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
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = 'vi-VN';
  u.rate = 1.0;
  u.pitch = 1.0;
  speaking = true;
  const done = () => {
    speaking = false;
    setTimeout(pump, 150);
  };
  u.onend = done;
  u.onerror = done;
  window.speechSynthesis.speak(u);
  // phòng trường hợp trình duyệt không gọi onend
  setTimeout(() => speaking && done(), 12000);
}
