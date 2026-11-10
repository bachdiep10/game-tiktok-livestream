# Soạn nhạc nền cho các game bằng máy (tự tổng hợp từng nốt, không dùng mẫu nhạc của ai -> không vướng bản quyền).
# Dùng: python3 tools/soan-nhac.py [game ...]   (cần numpy, scipy, ffmpeg)
# Ra file public/assets/nhac-<game>/<ten>.mp3 (riêng chánh điện: public/assets/nhac-chanh-dien/).
import os
import subprocess
import sys

import numpy as np
from scipy.signal import fftconvolve, lfilter

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ nhạc cụ
def adsr(n, a=0.01, d=0.1, s=0.7, r=0.1):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((dur - t) / max(r, 1e-4), 0, 1)
    return e * rel


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    return lfilter([1 - a], [1, -a], x)


def highpass(x, fc):
    return x - lowpass(x, fc)


def pluck(f, dur, bright=1.0, decay=1.2, harm=10):
    """Dây gảy (đàn tranh, guitar, harp): các hoạ âm tắt nhanh dần."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, harm + 1):
        if f * k > SR / 2.2:
            break
        amp = (1 / k ** (1.6 / bright)) * (1 if k % 2 else 0.75)
        x += amp * np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k)) * np.exp(-t * (1 / decay) * (1 + 0.7 * k))
    x *= np.minimum(1, t / 0.003)
    return x * 0.6


def tranh(f, dur, bend=0.0):
    """Đàn tranh: gảy sáng + nhấn rung (vibrato) ở đuôi nốt, có thể vuốt cao độ."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.25) * 3, 0, 1)
    glide = 1 + bend * np.clip(t / 0.12, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib * glide) / SR
    x = np.zeros(n)
    for k, a in enumerate([1, 0.55, 0.35, 0.22, 0.12, 0.08, 0.05], start=1):
        x += a * np.sin(k * ph) * np.exp(-t * (0.9 + 0.8 * k))
    return x * np.minimum(1, t / 0.002) * 0.55


def flute(f, dur, breath=0.08, vib=0.008):
    """Sáo trúc: hơi thổi + rung nhẹ."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    v = 1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.15) * 4, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * v) / SR
    x = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.07 * np.sin(3 * ph)
    nz = lowpass(highpass(np.random.randn(n), 1200), 5000) * breath
    return (x + nz) * adsr(n, 0.07, 0.3, 0.8, min(0.15, dur / 3)) * 0.45


def bau(f, dur):
    """Đàn bầu (gần đúng): âm hoạ âm trong trẻo, uốn cao độ lên rồi xuống."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    bend = 1 + 0.03 * np.sin(np.pi * np.clip(t / dur, 0, 1)) + 0.005 * np.sin(2 * np.pi * 6 * t)
    ph = 2 * np.pi * np.cumsum(f * bend) / SR
    x = np.sin(ph) + 0.25 * np.sin(2 * ph)
    return x * adsr(n, 0.01, 0.6, 0.5, 0.2) * 0.4


def saw(f, dur, detune=0.0, voices=1):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for v in range(voices):
        d = 1 + detune * (v - (voices - 1) / 2)
        ph = (f * d * t + np.random.rand()) % 1
        x += 2 * ph - 1
    return x / voices


def square(f, dur, duty=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.where((f * t) % 1 < duty, 1.0, -1.0)


def pad(f, dur, cutoff=1800):
    n = int(dur * SR)
    x = saw(f, dur, 0.008, 3) + 0.5 * saw(f * 2, dur, 0.006, 2)
    return lowpass(lowpass(x, cutoff), cutoff) * adsr(n, min(0.6, dur / 3), 0.5, 0.85, min(0.6, dur / 3)) * 0.22


def strings(f, dur, cutoff=2500):
    n = int(dur * SR)
    t = np.arange(n) / SR
    v = 1 + 0.004 * np.sin(2 * np.pi * 5 * t)
    ph = np.cumsum(f * v) / SR
    x = sum((2 * ((ph * (1 + 0.003 * k) + 0.3 * k) % 1) - 1) for k in range(3)) / 3
    return lowpass(x, cutoff) * adsr(n, 0.04, 0.2, 0.8, 0.08) * 0.3


def brass(f, dur, cutoff=2600):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = saw(f, dur, 0.004, 2)
    env = adsr(n, 0.03, 0.15, 0.75, 0.06)
    # bộ lọc mở theo đường bao -> tiếng kèn
    lo = lowpass(x, cutoff * 0.35)
    hi = lowpass(x, cutoff)
    m = np.clip(env * 1.2, 0, 1)
    return (lo * (1 - m) + hi * m) * env * 0.35


def piano(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k, a in enumerate([1, 0.5, 0.3, 0.18, 0.1, 0.06], start=1):
        x += a * np.sin(2 * np.pi * f * k * (1 + 0.0007 * k * k) * t) * np.exp(-t * (0.8 + 0.6 * k))
    return x * np.minimum(1, t / 0.004) * adsr(n, 0.001, 9, 1, 0.08) * 0.4


def bell(f, dur, decay=2.5):
    """Chuông / celesta: hoạ âm lệch (không nguyên)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for r, a, d in [(1, 1, 1), (2.76, 0.5, 0.6), (5.4, 0.3, 0.35), (8.93, 0.15, 0.2), (0.5, 0.3, 1.4)]:
        x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (decay * d))
    return x * np.minimum(1, t / 0.002) * 0.35


def marimba(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 5) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 14)
    return x * np.minimum(1, t / 0.002) * 0.6


def bass(f, dur, kind='sine'):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if kind == 'saw':
        x = lowpass(saw(f, dur), 700)
    else:
        x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
        x = np.tanh(x * 1.5)
    return x * adsr(n, 0.005, 0.25, 0.7, 0.05) * 0.55


def kick(g=1.0):
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * g


def snare(g=1.0):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    nz = highpass(np.random.randn(n), 1500) * np.exp(-t * 22)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    return (nz * 0.6 + tone * 0.5) * g


def clap(g=1.0):
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for o in (0, 0.011, 0.022):
        env += (t >= o) * np.exp(-np.clip(t - o, 0, None) * 60)
    env += np.exp(-t * 14) * 0.4
    return lowpass(highpass(np.random.randn(n), 900), 6000) * env * 0.5 * g


def hat(g=1.0, open_=False):
    n = int((0.3 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    return highpass(np.random.randn(n), 7000) * np.exp(-t * (9 if open_ else 60)) * 0.35 * g


def shaker(g=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    return highpass(np.random.randn(n), 4500) * np.sin(np.pi * t / 0.09) * 0.18 * g


def tom(f=110, g=1.0):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    fr = f * (1 + 0.5 * np.exp(-t * 20))
    return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 6) + lowpass(np.random.randn(n), 900) * np.exp(-t * 30) * 0.3) * g


def taiko(g=1.0):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    fr = 62 * (1 + 0.6 * np.exp(-t * 15))
    body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 3.5)
    skin = lowpass(np.random.randn(n), 600) * np.exp(-t * 18) * 0.6
    return (body + skin) * g


def woodblock(f=900, g=1.0):
    """Mõ / phách."""
    n = int(0.15 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.7 * t)) * np.exp(-t * 45) * 0.5 * g


def gong(g=1.0):
    n = int(5 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for r, a in [(1, 1), (1.47, 0.6), (2.09, 0.45), (2.56, 0.3), (3.1, 0.2)]:
        x += a * np.sin(2 * np.pi * 98 * r * t + 3 * np.sin(2 * np.pi * 2 * t))
    return x * np.exp(-t * 0.9) * np.minimum(1, t / 0.01) * 0.25 * g


def riser(dur, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = highpass(np.random.randn(n), 2000) * (t / dur) ** 2
    return nz * 0.25 * g


def crash(g=1.0):
    n = int(1.8 * SR)
    t = np.arange(n) / SR
    return highpass(np.random.randn(n), 5000) * np.exp(-t * 2.2) * 0.3 * g


# ------------------------------------------------------------------ bàn trộn
class Mix:
    def __init__(self, seconds):
        self.n = int(seconds * SR)
        self.dry = np.zeros((self.n, 2))
        self.wet = np.zeros((self.n, 2))
        self.duck = None

    def add(self, sig, t, pan=0.5, gain=1.0, rev=0.2):
        i = int(t * SR)
        if i >= self.n or i < 0:
            return
        j = min(self.n, i + len(sig))
        s = sig[: j - i] * gain
        l, r = np.cos(pan * np.pi / 2), np.sin(pan * np.pi / 2)
        self.dry[i:j, 0] += s * l * 1.41
        self.dry[i:j, 1] += s * r * 1.41
        if rev:
            self.wet[i:j, 0] += s * l * rev
            self.wet[i:j, 1] += s * r * rev

    def render(self, room=1.8, sidechain=None):
        ir_n = int(room * SR)
        t = np.arange(ir_n) / SR
        out = self.dry.copy()
        for c in range(2):
            ir = np.random.randn(ir_n) * np.exp(-t * 6.9 / room)
            ir = lowpass(ir, 5000)
            ir /= np.sqrt(np.sum(ir ** 2))
            out[:, c] += fftconvolve(self.wet[:, c], ir)[: self.n] * 0.9
        if sidechain is not None:
            out *= sidechain[:, None]
        # nối vòng: phần đuôi đè lên đầu để phát lặp không hụt
        tail = int(1.5 * SR)
        out[:tail] *= np.linspace(0, 1, tail)[:, None] ** 0.5
        out[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 0.5
        out = np.tanh(out / (np.max(np.abs(out)) + 1e-9) * 1.3) * 0.9
        return out


def save(out, name):
    import tempfile
    path = os.path.join(ROOT, 'public', 'assets', name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.raw', delete=False) as f:
        f.write((out * 32767).astype('<i2').tobytes())
        raw = f.name
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', raw,
                    '-af', 'loudnorm=I=-15:TP=-1.5:LRA=9', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '160k', path], check=True)
    os.unlink(raw)
    print('xong', path)


def sidechain_curve(n, beat, depth=0.55, start=0.0):
    t = np.arange(n) / SR
    ph = ((t - start) % beat) / beat
    return 1 - depth * np.exp(-ph * 9)


def melody_from(rng, scale, length, start=4, leap=2):
    """Giai điệu đi bậc trong thang âm, có lặp lại motif."""
    idx = start
    out = []
    for _ in range(length):
        step = rng.choice([-2, -1, -1, 0, 1, 1, 2] + ([-leap, leap] if leap > 2 else []))
        idx = int(np.clip(idx + step, 0, len(scale) - 1))
        out.append(scale[idx])
    return out


def scale_notes(root, steps, octaves=3):
    notes = []
    for o in range(octaves):
        for s in steps:
            notes.append(root + 12 * o + s)
    return notes


PENT_MAJ = [0, 2, 4, 7, 9]
PENT_MIN = [0, 3, 5, 7, 10]
MAJ = [0, 2, 4, 5, 7, 9, 11]
MIN = [0, 2, 3, 5, 7, 8, 10]
HMIN = [0, 2, 3, 5, 7, 8, 11]


def triad(root, minor=False):
    return [root, root + (3 if minor else 4), root + 7]


# ------------------------------------------------------------------ từng bài
def chanh_dien():
    """Thiền: đàn tranh, sáo trúc, mõ, chuông, nền ngân."""
    rng = np.random.default_rng(11)
    bpm = 62
    b = 60 / bpm
    bars = 40
    m = Mix(bars * 4 * b + 4)
    sc = scale_notes(62, PENT_MAJ)  # Rê ngũ cung
    drones = [50, 50, 45, 47]
    for bar in range(bars):
        t0 = bar * 4 * b
        d = drones[(bar // 2) % 4]
        if bar % 2 == 0:
            m.add(pad(midi(d), 8 * b, 900), t0, 0.5, 0.55, 0.5)
            m.add(pad(midi(d + 7), 8 * b, 900), t0, 0.5, 0.35, 0.5)
        # mõ đều mỗi phách, chuông mỗi 4 ô nhịp
        for k in range(4):
            m.add(woodblock(620, 0.7 if k == 0 else 0.45), t0 + k * b, 0.55, 0.5, 0.15)
        if bar % 4 == 0:
            m.add(bell(midi(74), 6, 3.5), t0, 0.5, 0.4, 0.6)
        # đàn tranh: chuỗi gảy rải + nhấn
        if bar >= 2:
            notes = melody_from(rng, sc[3:12], 6, 3)
            times = [0, 1, 1.5, 2, 3, 3.5]
            for nt, tt in zip(notes, times):
                if rng.random() < 0.85:
                    m.add(tranh(midi(nt), 2.5, bend=0.0 if rng.random() < 0.8 else 0.06), t0 + tt * b, 0.35, 0.55, 0.45)
            if bar % 8 == 7:  # vuốt dây
                for k, nt in enumerate(sc[4:12]):
                    m.add(tranh(midi(nt), 1.6), t0 + 3 * b + k * 0.06, 0.3, 0.35, 0.5)
        # sáo vào ở đoạn giữa
        if 12 <= bar < 32 and bar % 2 == 0:
            ph = melody_from(rng, sc[5:13], 3, 3)
            durs = [1.5, 2.5, 4]
            tt = 0
            for nt, du in zip(ph, durs):
                m.add(flute(midi(nt), du * b), t0 + tt * b, 0.65, 0.5, 0.6)
                tt += du
    return m.render(room=3.2)


def quan_bar():
    """EDM house 124 BPM: trống 4/4, bass lệch phách, hợp âm pad nén, arp sáng, đoạn dồn và drop."""
    rng = np.random.default_rng(22)
    bpm = 124
    b = 60 / bpm
    prog = [(57, True), (53, False), (48, False), (55, False)]  # Am F C G
    bars = 64
    m = Mix(bars * 4 * b + 2)
    lead_motif = [0, 2, 4, 2, 7, 4, 2, 0]
    for bar in range(bars):
        t0 = bar * 4 * b
        sec = bar // 16  # 0 intro, 1 build, 2 drop, 3 break/drop2
        root, mn = prog[bar % 4]
        ch = triad(root, mn)
        build = sec == 1 and bar % 16 >= 12
        drop = sec in (2, 3) and not (sec == 3 and bar % 16 < 4)
        for k in range(4):
            if not (build and bar % 16 == 15 and k >= 2):
                m.add(kick(1.0), t0 + k * b, 0.5, 0.9, 0)
            m.add(hat(0.8 if drop else 0.5, open_=True), t0 + (k + 0.5) * b, 0.6, 0.4, 0.05)
            if sec > 0:
                for s in (0.25, 0.75):
                    m.add(hat(0.4), t0 + (k + s) * b, 0.4, 0.3, 0)
            if k in (1, 3) and sec > 0:
                m.add(clap(1.0), t0 + k * b, 0.5, 0.6, 0.25)
        if build:
            for k in range(8 if bar % 16 < 14 else 16):
                step = 4 / (8 if bar % 16 < 14 else 16)
                m.add(snare(0.5 + 0.03 * k), t0 + k * step * b, 0.5, 0.45, 0.3)
            if bar % 16 == 12:
                m.add(riser(4 * 4 * b), t0, 0.5, 0.7, 0.4)
        if bar % 16 == 0 and bar > 0:
            m.add(crash(1.0), t0, 0.5, 0.7, 0.3)
        # bass lệch phách
        for k in range(4):
            m.add(bass(midi(root - 24), 0.4 * b, 'saw'), t0 + (k + 0.5) * b, 0.5, 0.8 if sec else 0.5, 0)
        # pad
        for nt in ch:
            m.add(pad(midi(nt), 4 * b, 2600 if drop else 1400), t0, 0.5, 0.45, 0.4)
        # arp
        if sec >= 1:
            for k in range(16):
                nt = ch[k % 3] + 12 + (12 if k % 8 >= 6 else 0)
                m.add(pluck(midi(nt), 0.3, 1.6, 0.25), t0 + k * b / 4, 0.3 + 0.4 * (k % 2), 0.28, 0.3)
        # lead ở drop
        if drop:
            for k, st in enumerate(lead_motif):
                sc = scale_notes(69, MIN)
                nt = sc[(MIN.index(0) + st) % len(sc)] + (12 if bar % 2 else 0)
                m.add(saw(midi(nt), 0.45 * b, 0.01, 3) * adsr(int(0.45 * b * SR), 0.005, 0.1, 0.6, 0.05) * 0.18,
                      t0 + k * b / 2, 0.5, 0.6, 0.35)
    sc = sidechain_curve(m.n, b)
    return m.render(room=1.6, sidechain=sc)


def tra_da():
    """Lofi guitar mộc: gảy hợp âm rải, trống nhẹ có swing, bass ấm, tiếng phố rè rè."""
    rng = np.random.default_rng(33)
    bpm = 84
    b = 60 / bpm
    prog = [[50, 57, 62, 65, 69], [55, 62, 67, 71], [52, 59, 64, 67, 71], [57, 64, 69, 73]]  # Dm7 G7 Em7 A
    prog = [[50, 57, 60, 65, 69], [55, 59, 62, 65, 71], [48, 55, 60, 64, 67], [45, 52, 57, 60, 64]]  # Dm9 G13 Cmaj A m
    bars = 48
    m = Mix(bars * 4 * b + 2)
    sw = 0.08
    sc = scale_notes(62, PENT_MIN)
    for bar in range(bars):
        t0 = bar * 4 * b
        ch = prog[bar % 4]
        # guitar gảy rải
        pattern = [0, 1, 2, 3, 1, 2, 3, 2]
        for k, p in enumerate(pattern):
            nt = ch[min(p + (1 if p else 0), len(ch) - 1)] if p else ch[0]
            tt = k * 0.5 + (sw if k % 2 else 0)
            m.add(pluck(midi(nt), 1.4, 1.1, 0.9), t0 + tt * b, 0.4 + 0.1 * (k % 3), 0.5, 0.3)
        # trống
        if bar >= 2:
            m.add(kick(0.7), t0, 0.5, 0.65, 0)
            m.add(kick(0.5), t0 + (2.5 + sw) * b, 0.5, 0.6, 0)
            m.add(snare(0.5), t0 + b, 0.5, 0.45, 0.25)
            m.add(snare(0.5), t0 + 3 * b, 0.5, 0.45, 0.25)
            for k in range(8):
                m.add(hat(0.4 if k % 2 else 0.6), t0 + (k * 0.5 + (sw if k % 2 else 0)) * b, 0.62, 0.35, 0)
        m.add(bass(midi(ch[0] - 12), 1.8 * b), t0, 0.5, 0.6, 0)
        m.add(bass(midi(ch[0] - 12), 1.2 * b), t0 + (2.5 + sw) * b, 0.5, 0.5, 0)
        # câu giai điệu điện piano
        if 8 <= bar < 40 and bar % 4 in (0, 1):
            notes = melody_from(rng, sc[3:11], 4, 3)
            for k, nt in enumerate(notes):
                m.add(piano(midi(nt), 1.2 * b), t0 + (k + (sw if k % 2 else 0)) * b, 0.6, 0.35, 0.4)
    out = m.render(room=1.4)
    # tiếng phố + rè đĩa than
    n = len(out)
    t = np.arange(n) / SR
    street = lowpass(np.random.randn(n), 400) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 9) ** 2) * 0.05
    crackle = (np.random.rand(n) > 0.9993) * np.random.randn(n) * 0.25
    out += np.stack([street + crackle, street + crackle], 1) * 0.6
    return np.clip(out, -1, 1)


def cau_ca():
    """Sông nước chiều quê: sáo trúc, đàn bầu, đàn tranh rải, tiếng nước."""
    rng = np.random.default_rng(44)
    bpm = 72
    b = 60 / bpm
    bars = 36
    m = Mix(bars * 4 * b + 3)
    sc = scale_notes(57, PENT_MIN)  # La ngũ cung thứ
    roots = [45, 43, 41, 43]
    for bar in range(bars):
        t0 = bar * 4 * b
        r = roots[(bar // 2) % 4]
        if bar % 2 == 0:
            m.add(pad(midi(r), 8 * b, 800), t0, 0.5, 0.45, 0.5)
            m.add(pad(midi(r + 7), 8 * b, 800), t0, 0.5, 0.3, 0.5)
        for k in range(4):
            nt = [r + 12, r + 19, r + 24, r + 19][k]
            m.add(tranh(midi(nt), 1.8), t0 + k * b, 0.3, 0.3, 0.4)
        if bar >= 2:
            m.add(woodblock(780, 0.35), t0, 0.7, 0.4, 0.2)
            m.add(woodblock(980, 0.25), t0 + 2.5 * b, 0.7, 0.4, 0.2)
        if 4 <= bar < 20 and bar % 2 == 0:
            ph = melody_from(rng, sc[5:13], 4, 3)
            tt = 0
            for nt, du in zip(ph, [1, 1, 2, 4]):
                m.add(flute(midi(nt), du * b), t0 + tt * b, 0.62, 0.55, 0.55)
                tt += du
        if 20 <= bar < 32 and bar % 2 == 0:
            ph = melody_from(rng, sc[3:11], 3, 3)
            tt = 0
            for nt, du in zip(ph, [2, 2, 4]):
                m.add(bau(midi(nt), du * b), t0 + tt * b, 0.6, 0.6, 0.5)
                tt += du
    out = m.render(room=2.6)
    n = len(out)
    t = np.arange(n) / SR
    water = lowpass(highpass(np.random.randn(n), 300), 1600) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 5.3)) * 0.035
    out += np.stack([water, np.roll(water, 900)], 1)
    return np.clip(out, -1, 1)


def rong_ran():
    """Đồng dao vui: sáo + mộc cầm (marimba), trống cơm, phách, vỗ tay."""
    rng = np.random.default_rng(55)
    bpm = 118
    b = 60 / bpm
    bars = 48
    m = Mix(bars * 4 * b + 2)
    sc = scale_notes(67, PENT_MAJ)  # Sol ngũ cung
    prog = [55, 60, 55, 62]
    motif = [0, 0, 1, 2, 2, 1, 0, -1]
    for bar in range(bars):
        t0 = bar * 4 * b
        r = prog[bar % 4]
        m.add(bass(midi(r - 12), b * 0.9), t0, 0.5, 0.55, 0)
        m.add(bass(midi(r - 5), b * 0.9), t0 + 2 * b, 0.5, 0.5, 0)
        for k in range(4):
            m.add(tom(150 if k % 2 == 0 else 200, 0.6), t0 + k * b, 0.45, 0.45, 0.15)
            m.add(woodblock(1100, 0.5), t0 + (k + 0.5) * b, 0.7, 0.4, 0.1)
            if k in (1, 3) and bar >= 4:
                m.add(clap(0.8), t0 + k * b, 0.5, 0.45, 0.2)
        # mộc cầm đệm
        for k in range(8):
            nt = [r, r + 4, r + 7, r + 12][k % 4] + 12
            m.add(marimba(midi(nt), 0.4), t0 + k * b / 2, 0.35, 0.3, 0.2)
        # sáo hát giai điệu đồng dao (lặp motif, mỗi 2 ô nhịp đổi đuôi)
        if bar >= 4 and not (24 <= bar < 28):
            base = 5 + (bar % 2) * 2
            for k, st in enumerate(motif):
                idx = int(np.clip(base + st + (rng.integers(-1, 2) if k >= 6 else 0), 0, len(sc) - 1))
                m.add(flute(midi(sc[idx]), 0.48 * b, 0.05), t0 + k * b / 2, 0.6, 0.45, 0.35)
    return m.render(room=1.3)


def dai_chien():
    """Trận chiến: trống taiko, dây nhanh, kèn đồng hùng tráng, cồng chiêng."""
    rng = np.random.default_rng(66)
    bpm = 104
    b = 60 / bpm
    bars = 48
    m = Mix(bars * 4 * b + 4)
    prog = [(50, True), (46, False), (48, False), (45, False)]  # Dm Bb C A
    sc = scale_notes(62, HMIN)
    for bar in range(bars):
        t0 = bar * 4 * b
        r, mn = prog[(bar // 2) % 4]
        ch = triad(r, mn)
        sec = bar // 12
        # taiko
        pat = [0, 1.5, 2, 3, 3.5] if sec else [0, 2]
        for p in pat:
            m.add(taiko(1.0 if p in (0, 2) else 0.6), t0 + p * b, 0.5, 0.8, 0.35)
        if sec >= 1:
            for k in range(8):
                m.add(snare(0.25), t0 + k * b / 2, 0.55, 0.3, 0.2)
        if bar % 12 == 0:
            m.add(gong(1.0), t0, 0.5, 0.55, 0.5)
        # dây ostinato
        for k in range(16 if sec else 8):
            step = 4 / (16 if sec else 8)
            nt = ch[0] + (12 if k % 4 == 2 else 0) - 12 + (ch[1] - ch[0] if k % 4 == 3 else 0)
            m.add(strings(midi(nt), step * b * 0.95, 2200), t0 + k * step * b, 0.4, 0.55, 0.3)
        m.add(bass(midi(r - 24), 4 * b, 'saw'), t0, 0.5, 0.5, 0)
        # kèn đồng chủ đề
        if sec >= 1 and bar % 4 in (0, 1, 2):
            ph = [(0, 1.5), (2, 0.5), (4, 1), (3, 1)] if bar % 2 == 0 else [(4, 1.5), (5, 0.5), (4, 1), (2, 1)]
            base = 7
            tt = 0
            for st, du in ph:
                m.add(brass(midi(sc[base + st]), du * b), t0 + tt * b, 0.55, 0.55, 0.45)
                m.add(brass(midi(sc[base + st] - 12), du * b), t0 + tt * b, 0.45, 0.4, 0.45)
                tt += du
        else:
            for nt in ch:
                m.add(brass(midi(nt), 3.5 * b, 1500), t0, 0.5, 0.3, 0.45)
    return m.render(room=2.4)


def bia_hoi():
    """Nhậu vui: polka/ska, bass um-pa, kèn đồng nhảy, vỗ tay 'dô dô'."""
    rng = np.random.default_rng(77)
    bpm = 132
    b = 60 / bpm
    bars = 64
    m = Mix(bars * 4 * b + 2)
    prog = [(60, False), (55, False), (57, True), (53, False), (60, False), (55, False), (53, False), (55, False)]
    sc = scale_notes(60, MAJ)
    motif = [(4, 0.5), (4, 0.5), (5, 0.5), (7, 1), (5, 0.5), (4, 0.5), (2, 0.5)]
    for bar in range(bars):
        t0 = bar * 4 * b
        r, mn = prog[bar % 8]
        ch = triad(r, mn)
        for k in range(4):
            m.add(kick(0.8), t0 + k * b, 0.5, 0.55 if k % 2 == 0 else 0.35, 0)
            m.add(bass(midi(r - 24 + (7 if k % 2 else 0)), 0.7 * b), t0 + k * b, 0.5, 0.6, 0)
            for nt in ch:
                m.add(piano(midi(nt + 12), 0.35 * b), t0 + (k + 0.5) * b, 0.4, 0.22, 0.2)
            m.add(hat(0.6), t0 + (k + 0.5) * b, 0.65, 0.35, 0)
            if k in (1, 3):
                m.add(snare(0.6), t0 + k * b, 0.5, 0.4, 0.2)
        if bar % 8 in (3, 7):
            m.add(clap(1), t0 + 2 * b, 0.4, 0.6, 0.3)
            m.add(clap(1), t0 + 3 * b, 0.6, 0.6, 0.3)
        if bar >= 4 and not (32 <= bar < 36):
            tt = 0
            shift = 0 if bar % 4 < 2 else -2
            for st, du in motif:
                nt = sc[int(np.clip(st + shift + 7, 0, len(sc) - 1))]
                m.add(brass(midi(nt), du * b * 0.9, 3200), t0 + tt * b, 0.55, 0.5, 0.3)
                tt += du
    return m.render(room=1.3)


def dam_cuoi():
    """Tiệc cưới rộn ràng: piano, chuông, dây, trống pop, giai điệu trưởng sáng."""
    rng = np.random.default_rng(88)
    bpm = 112
    b = 60 / bpm
    bars = 56
    m = Mix(bars * 4 * b + 3)
    prog = [(62, False), (57, False), (59, True), (55, False)]  # D A Bm G
    sc = scale_notes(62, MAJ)
    theme = [(4, 1), (2, 0.5), (4, 0.5), (5, 1), (4, 1), (2, 1.5), (0, 0.5), (1, 1), (2, 1)]
    for bar in range(bars):
        t0 = bar * 4 * b
        r, mn = prog[bar % 4]
        ch = triad(r, mn)
        for k in range(8):
            nt = [ch[0], ch[1], ch[2], ch[1] + 12][k % 4]
            m.add(piano(midi(nt), 0.9), t0 + k * b / 2, 0.4, 0.38, 0.3)
        m.add(bass(midi(r - 24), 1.8 * b), t0, 0.5, 0.55, 0)
        m.add(bass(midi(r - 24 + 7), 1.8 * b), t0 + 2 * b, 0.5, 0.5, 0)
        for nt in ch:
            m.add(strings(midi(nt), 4 * b, 2000), t0, 0.5, 0.18, 0.5)
        if bar >= 4:
            for k in range(4):
                m.add(kick(0.7), t0 + k * b, 0.5, 0.45, 0)
                if k in (1, 3):
                    m.add(snare(0.6), t0 + k * b, 0.5, 0.45, 0.25)
                m.add(hat(0.5), t0 + (k + 0.5) * b, 0.65, 0.3, 0)
        if bar % 8 == 0:
            for k, nt in enumerate([86, 83, 81, 78]):
                m.add(bell(midi(nt), 2.5, 1.5), t0 + k * b / 2, 0.5 + (0.2 if k % 2 else -0.2), 0.35, 0.5)
        if bar >= 8 and bar % 4 in (0, 2):
            tt = 0
            hi = 7 if bar % 8 < 4 else 9
            for st, du in theme[:5] if bar % 4 == 0 else theme[5:]:
                nt = sc[int(np.clip(hi + st, 0, len(sc) - 1))]
                m.add(flute(midi(nt), du * b, 0.03, 0.005), t0 + tt * b, 0.55, 0.5, 0.45)
                m.add(bell(midi(nt + 12), 1.0, 0.6), t0 + tt * b, 0.6, 0.12, 0.4)
                tt += du
    return m.render(room=1.9)


def tarot():
    """Huyền bí: pad tối, hộp nhạc/celesta rải, chuông gió, trống trầm thưa."""
    rng = np.random.default_rng(99)
    bpm = 66
    b = 60 / bpm
    bars = 36
    m = Mix(bars * 4 * b + 5)
    prog = [(57, True), (53, False), (52, False), (57, True), (50, True), (53, False), (52, False), (52, False)]
    sc = scale_notes(69, HMIN)
    for bar in range(bars):
        t0 = bar * 4 * b
        r, mn = prog[bar % 8]
        ch = triad(r, mn) if bar % 8 != 7 else [52, 56, 59]
        for nt in ch:
            m.add(pad(midi(nt - 12), 4 * b + 1, 1100), t0, 0.5, 0.45, 0.7)
        m.add(bass(midi(r - 24), 4 * b), t0, 0.5, 0.35, 0.1)
        if bar >= 2:
            for k in range(8):
                nt = [ch[0], ch[1], ch[2], ch[1]][k % 4] + 12 + (12 if k >= 4 else 0)
                m.add(bell(midi(nt), 1.8, 0.8), t0 + k * b / 2, 0.3 + 0.4 * (k % 2), 0.25, 0.6)
        if bar % 4 == 0 and bar >= 4:
            m.add(taiko(0.5), t0, 0.5, 0.45, 0.6)
            m.add(taiko(0.35), t0 + 2.5 * b, 0.5, 0.4, 0.6)
        if bar % 8 == 4:
            for k in range(10):
                m.add(bell(midi(sc[14 - k]), 2.5, 1.2), t0 + 2 * b + k * 0.07, rng.random(), 0.12, 0.8)
        if 12 <= bar < 28 and bar % 2 == 0:
            ph = melody_from(rng, sc[4:12], 3, 4)
            tt = 0
            for nt, du in zip(ph, [2, 2, 4]):
                m.add(flute(midi(nt), du * b, 0.12, 0.012), t0 + tt * b, 0.5, 0.35, 0.8)
                tt += du
    return m.render(room=4.0)


def duoi_hinh():
    """Gameshow vui nhộn: synth sáng, bass nảy, vỗ tay, giai điệu trưởng nhanh."""
    rng = np.random.default_rng(111)
    bpm = 128
    b = 60 / bpm
    bars = 48
    m = Mix(bars * 4 * b + 2)
    prog = [(60, False), (57, True), (65, False), (67, False)]  # C Am F G
    sc = scale_notes(72, MAJ)
    for bar in range(bars):
        t0 = bar * 4 * b
        r, mn = prog[bar % 4]
        ch = triad(r, mn)
        for k in range(4):
            m.add(kick(0.85), t0 + k * b, 0.5, 0.7, 0)
            m.add(hat(0.6, open_=k % 2 == 1), t0 + (k + 0.5) * b, 0.65, 0.35, 0)
            if k in (1, 3):
                m.add(clap(1.0), t0 + k * b, 0.5, 0.55, 0.2)
        for k in range(8):
            m.add(bass(midi(r - 24 + (12 if k % 2 else 0)), 0.45 * b, 'saw'), t0 + k * b / 2, 0.5, 0.55, 0)
        for k in range(4):
            for nt in ch:
                sq = square(midi(nt + 12), 0.3 * b, 0.25)
                m.add(lowpass(sq, 3000) * adsr(len(sq), 0.003, 0.08, 0.3, 0.03) * 0.1, t0 + (k + 0.5) * b, 0.45, 0.6, 0.15)
        if bar >= 4 and not (24 <= bar < 26):
            ph = melody_from(rng, sc[0:10], 8, 4, leap=3)
            if bar % 2 == 1:
                ph = ph[:6] + [sc[4], sc[7]]
            for k, nt in enumerate(ph):
                m.add(marimba(midi(nt), 0.5), t0 + k * b / 2, 0.55, 0.55, 0.25)
                sq = square(midi(nt), 0.4 * b, 0.5)
                m.add(lowpass(sq, 2500) * adsr(len(sq), 0.005, 0.1, 0.5, 0.05) * 0.08, t0 + k * b / 2, 0.6, 0.6, 0.2)
        if bar % 8 == 7:
            m.add(riser(4 * b, 0.7), t0, 0.5, 0.6, 0.3)
        if bar % 8 == 0 and bar:
            m.add(crash(0.8), t0, 0.5, 0.6, 0.2)
    return m.render(room=1.2)


def leo_nui():
    """Phiêu lưu: dây chạy dồn, trống tom, kèn chủ đề anh hùng, mở rộng dần."""
    rng = np.random.default_rng(122)
    bpm = 112
    b = 60 / bpm
    bars = 48
    m = Mix(bars * 4 * b + 3)
    prog = [(57, True), (53, False), (48, False), (55, False)]
    sc = scale_notes(57, MIN)
    theme = [(0, 1), (4, 1), (7, 1.5), (6, 0.5), (4, 1), (2, 1), (4, 2)]
    for bar in range(bars):
        t0 = bar * 4 * b
        r, mn = prog[bar % 4]
        ch = triad(r, mn)
        sec = bar // 12
        for k in range(16):
            nt = [ch[0], ch[0], ch[1], ch[0], ch[2], ch[0], ch[1], ch[2]][k % 8] - 12
            m.add(strings(midi(nt), b / 4 * 0.9, 2800), t0 + k * b / 4, 0.4, 0.42, 0.25)
        m.add(bass(midi(r - 24), 4 * b, 'saw'), t0, 0.5, 0.55, 0)
        for k in range(4):
            m.add(kick(0.8), t0 + k * b, 0.5, 0.55 if sec else 0.35, 0)
            if sec >= 1:
                m.add(tom(120 if k % 2 else 90, 0.7), t0 + (k + 0.5) * b, 0.4 + 0.2 * (k % 2), 0.5, 0.3)
            if k in (1, 3) and sec >= 1:
                m.add(snare(0.6), t0 + k * b, 0.5, 0.45, 0.25)
        if bar % 12 == 0 and bar:
            m.add(crash(1.0), t0, 0.5, 0.6, 0.3)
        if sec >= 1 and bar % 2 == 0:
            tt = 0
            for st, du in theme:
                if tt >= 8:
                    break
                nt = sc[int(np.clip(7 + st, 0, len(sc) - 1))]
                m.add(brass(midi(nt), du * b), t0 + tt * b, 0.55, 0.5, 0.4)
                if sec >= 2:
                    m.add(strings(midi(nt + 12), du * b, 3500), t0 + tt * b, 0.6, 0.25, 0.4)
                tt += du
        for nt in ch:
            m.add(pad(midi(nt), 4 * b, 1500), t0, 0.5, 0.3, 0.4)
    return m.render(room=2.2)


def lop_hoc():
    """Lớp học vui: mộc cầm (xylophone) nảy, dây gảy kiểu pizzicato, bass đi bộ, trống nhẹ, chuông trường."""
    rng = np.random.default_rng(144)
    bpm = 116
    b = 60 / bpm
    bars = 48
    m = Mix(bars * 4 * b + 2)
    prog = [(65, False), (62, True), (70, False), (72, False)]  # F Dm Bb C
    sc = scale_notes(65, MAJ)
    hook = [(4, 0.5), (4, 0.5), (5, 0.5), (7, 0.5), (7, 0.5), (5, 0.5), (4, 0.5), (2, 0.5)]
    hook2 = [(0, 0.5), (0, 0.5), (2, 0.5), (4, 0.5), (4, 0.75), (2, 0.25), (2, 1)]
    for bar in range(bars):
        t0 = bar * 4 * b
        r, mn = prog[bar % 4]
        ch = triad(r, mn)
        for k in range(4):
            nt = [r - 24, r - 24 + 7, r - 24 + 12, r - 24 + 7][k]
            m.add(bass(midi(nt), 0.8 * b), t0 + k * b, 0.5, 0.5, 0)
        for k in range(8):
            nt = [ch[0], ch[2], ch[1], ch[2]][k % 4]
            m.add(pluck(midi(nt), 0.35, 0.7, 6), t0 + k * b / 2, 0.35 + 0.3 * (k % 2), 0.28, 0.2)
        if bar >= 2:
            for k in range(4):
                m.add(kick(0.55), t0 + k * b, 0.5, 0.4, 0)
                if k in (1, 3):
                    m.add(snare(0.35), t0 + k * b, 0.5, 0.3, 0.2)
                m.add(woodblock(1100 if k % 2 else 800, 0.5), t0 + (k + 0.5) * b, 0.3 + 0.4 * (k % 2), 0.25, 0.1)
                m.add(shaker(0.4), t0 + (k + 0.25) * b, 0.7, 0.2, 0)
        if bar >= 4 and not (28 <= bar < 30):
            ph = hook if bar % 2 == 0 else hook2
            hi = 7 if (bar // 8) % 2 == 0 else 9
            tt = 0
            for st, du in ph:
                nt = sc[int(np.clip(hi + st, 0, len(sc) - 1))]
                m.add(marimba(midi(nt), 0.6), t0 + tt * b, 0.55, 0.6, 0.25)
                m.add(bell(midi(nt + 12), 0.8, 0.5), t0 + tt * b, 0.6, 0.1, 0.3)
                tt += du
        if bar % 16 == 0:
            for k, nt in enumerate([77, 81, 84, 89]):
                m.add(bell(midi(nt), 2.0, 1.2), t0 + k * b / 2, 0.5, 0.3, 0.4)
        if bar % 8 == 7:
            m.add(riser(4 * b, 0.4), t0, 0.5, 0.35, 0.3)
    return m.render(room=1.4)


SONGS = {
    'chanh-dien': (chanh_dien, 'nhac-chanh-dien/thien-tinh-tam.mp3'),
    'quan-bar': (quan_bar, 'nhac-bar/dem-bung-no.mp3'),
    'tra-da': (tra_da, 'nhac-tra-da/chieu-via-he.mp3'),
    'cau-ca': (cau_ca, 'nhac-cau-ca/ben-song-que.mp3'),
    'rong-ran': (rong_ran, 'nhac-rong-ran/dong-dao-vui.mp3'),
    'dai-chien': (dai_chien, 'nhac-dai-chien/tran-chien-hung-trang.mp3'),
    'bia-hoi': (bia_hoi, 'nhac-bia-hoi/mot-hai-ba-do.mp3'),
    'dam-cuoi': (dam_cuoi, 'nhac-dam-cuoi/ngay-vui-tram-nam.mp3'),
    'tarot': (tarot, 'nhac-tarot/la-bai-huyen-bi.mp3'),
    'duoi-hinh': (duoi_hinh, 'nhac-duoi-hinh/gameshow-vui-ve.mp3'),
    'leo-nui': (leo_nui, 'nhac-leo-nui/chinh-phuc-dinh-cao.mp3'),
    'lop-hoc': (lop_hoc, 'nhac-lop-hoc/gio-hoc-vui.mp3'),
}

if __name__ == '__main__':
    pick = sys.argv[1:] or list(SONGS)
    for g in pick:
        fn, name = SONGS[g]
        np.random.seed(sum(map(ord, g)))
        save(fn(), name)
