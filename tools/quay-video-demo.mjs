// Quay video demo CÓ TIẾNG cho trang bán game: chạy server (GAME_DEV=1), bấm "Tự chạy demo"
// ở trang điều khiển, ghi canvas + toàn bộ âm thanh WebAudio/<audio> của trang game.
// Dùng: node tools/quay-video-demo.mjs <thư-mục-ra> [game ...]
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.cwd(), '/opt/node-tools/node_modules', '/opt/node22/lib/node_modules'] }));

const GAMES = {
  'chanh-dien': { page: 'game.html', control: 'control.html', sec: 25 },
  'quan-bar': { page: 'bar.html', control: 'bar-control.html', sec: 25 },
  'tra-da': { page: 'tra-da.html', control: 'tra-da-control.html', sec: 30 },
  'cau-ca': { page: 'cau-ca.html', control: 'cau-ca-control.html', sec: 30 },
  'rong-ran': { page: 'rong-ran.html', control: 'rong-ran-control.html', sec: 30 },
  'dai-chien': { page: 'dai-chien.html', control: 'dai-chien-control.html', sec: 30 },
  'bia-hoi': { page: 'bia-hoi.html', control: 'bia-hoi-control.html', sec: 30 },
  'dam-cuoi': { page: 'dam-cuoi.html', control: 'dam-cuoi-control.html', sec: 45 },
  'tarot': { page: 'tarot.html', control: 'tarot-control.html', sec: 45 },
  'duoi-hinh': { page: 'duoi-hinh.html', control: 'duoi-hinh-control.html', sec: 40 },
  'leo-nui': { page: 'leo-nui.html', control: 'leo-nui-control.html', sec: 40 },
  'lop-hoc': { page: 'lop-hoc.html', control: 'lop-hoc-control.html', sec: 55 },
  'go-bom': { page: 'go-bom.html', control: 'go-bom-control.html', sec: 92, script: async () => {
    // kịch bản demo cố định: cứu được 1 boss (có cắt sai 1 lần), boss sau cắt sai 3 lần thì nổ
    const G = window.__goBom;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const names = ['Tuấn', 'Hoa', 'Nam Béo', 'Linh', 'Minh', 'Lan', 'Quân', 'Thảo', 'Hùng', 'Vy'];
    const U = (i) => ({ id: `demo${i}`, name: names[i % names.length] });
    const ev = (e) => G.handleEvent(e);
    const pickVotes = async (ok, bad, from = 0) => {
      const list = [...Array(ok).fill('correct'), ...Array(bad).fill('wrong')].sort(() => Math.random() - 0.5);
      for (let i = 0; i < list.length; i++) { ev({ type: 'simVote', user: U(from + i), opt: list[i] }); await sleep(450); }
    };
    // chờ tới lượt bỏ phiếu MỚI (khác bom / cọc / số lần sai so với lượt trước)
    let lastKey = '';
    const keyOf = (st) => `${st.bombNo}-${st.stage}-${st.wrongs}`;
    const nextVote = async (max = 40000) => {
      const t = Date.now();
      while (Date.now() - t < max) {
        const st = G.state();
        if (st.phase === 'vote' && keyOf(st) !== lastKey) { lastKey = keyOf(st); return; }
        await sleep(100);
      }
    };
    const cut = async (ms = 800) => { await sleep(ms); if (G.state().phase === 'vote') ev({ type: 'skip' }); };
    await nextVote();
    ev({ type: 'join', user: U(9) });
    await sleep(3500); // bảng mạch tối, boss kêu thả tim
    for (let i = 0; i < 4; i++) { ev({ type: 'like', user: U(i), count: 10 }); await sleep(300); }
    // người xem thả tim đều đều cho đèn sáng
    setInterval(() => ev({ type: 'like', user: U(Math.floor(Math.random() * 10)), count: 3 + Math.floor(Math.random() * 4) }), 1300);
    await pickVotes(3, 1);
    ev({ type: 'chat', user: U(8), text: 'đốt' });
    await sleep(1800);
    ev({ type: 'share', user: U(5) });
    await sleep(1200);
    await pickVotes(1, 0, 6);
    await cut(1500);
    await nextVote();
    await pickVotes(1, 5);
    await cut(1500);
    await nextVote();
    ev({ type: 'follow', user: U(3) });
    await pickVotes(5, 1);
    await cut(1200);
    await nextVote();
    await pickVotes(6, 0, 2);
    await cut(800);
    await nextVote();
    G.setLeft(40);
    for (let i = 0; i < 3; i++) { ev({ type: 'like', user: U(i + 4), count: 5 }); await sleep(300); }
    await pickVotes(1, 5);
    await cut(800);
    await nextVote();
    ev({ type: 'chat', user: U(7), text: 'đốt' });
    await pickVotes(2, 4, 3);
    await cut(800);
    await nextVote();
    G.setLeft(12);
    await sleep(2500);
    await pickVotes(1, 4, 1);
    await cut(800);
  } },
};
const outDir = path.resolve(process.argv[2] || 'video-demo');
const pick = process.argv.slice(3);
const list = pick.length ? pick : Object.keys(GAMES);
const PORT = 3999;
const BASE = `http://127.0.0.1:${PORT}`;
fs.mkdirSync(outDir, { recursive: true });

// Gắn vào trang game trước khi chạy: chuyển mọi âm thanh sang một luồng ghi.
const TAP = () => {
  const REC = new AudioContext();
  const recDest = REC.createMediaStreamDestination();
  window.__recAudio = recDest.stream;
  const tapped = new WeakMap();
  const tapCtx = (ctx) => {
    if (ctx === REC || tapped.has(ctx)) return tapped.get(ctx);
    const d = ctx.createMediaStreamDestination();
    tapped.set(ctx, d);
    try { REC.createMediaStreamSource(d.stream).connect(recDest); } catch (e) { console.warn('tap', e); }
    return d;
  };
  const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (target, ...rest) {
    const r = orig.call(this, target, ...rest);
    if (target instanceof AudioDestinationNode && this.context !== REC) orig.call(this, tapCtx(this.context));
    return r;
  };
  const media = new WeakSet();
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (!media.has(this)) {
      media.add(this);
      try {
        const s = REC.createMediaElementSource(this);
        s.connect(REC.destination);
        s.connect(recDest);
      } catch (e) { console.warn('media tap', e); }
    }
    REC.resume();
    return play.call(this);
  };
};

const server = spawn(process.execPath, ['server.js'], { env: { ...process.env, GAME_DEV: '1', PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', ...(process.env.REC_ARGS ? process.env.REC_ARGS.split(' ') : [])] });
try {
  for (const id of list) {
    const g = GAMES[id];
    // hình: Playwright tự quay màn hình trang game (mượt ~25 hình/giây); tiếng: ghi riêng trong trang rồi ghép
    const vidDir = fs.mkdtempSync(path.join(outDir, 'tmp-'));
    const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, recordVideo: { dir: vidDir, size: { width: 540, height: 960 } } });
    // trang điều khiển ở ngữ cảnh riêng -> chạy ở tiến trình riêng, không giành máy với trang game
    const ctxC = await browser.newContext({ viewport: { width: 900, height: 900 } });
    const game = await ctx.newPage();
    const t0 = Date.now();
    await game.addInitScript(TAP);
    await game.goto(`${BASE}/${g.page}`);
    await game.waitForTimeout(2500);
    await game.mouse.click(270, 480);
    const control = await ctxC.newPage();
    // không cho khung xem trước của trang điều khiển chạy thêm một bản game
    await control.route(`${BASE}/${g.page}*`, (r) => r.fulfill({ body: '', contentType: 'text/html' }));
    await control.goto(`${BASE}/${g.control}`);
    await control.waitForTimeout(1000);
    await control.locator('#btnReset').click().catch(() => {});
    await control.waitForTimeout(500);
    const bulk = control.locator('[data-bulk]').first();
    if (await bulk.count()) await bulk.click();
    if (g.script) game.evaluate(g.script).catch((e) => console.warn('kịch bản demo:', e.message));
    else await control.locator('#btnAuto').click();
    await game.waitForTimeout(g.script ? 3000 : 6000);
    const { b64, start } = await game.evaluate(async (sec) => {
      const rec = new MediaRecorder(window.__recAudio, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      const done = new Promise((r) => (rec.onstop = r));
      rec.start(1000);
      const start = Date.now();
      await new Promise((r) => setTimeout(r, sec * 1000));
      rec.stop();
      await done;
      const buf = await new Blob(chunks).arrayBuffer();
      let s = '';
      const u = new Uint8Array(buf);
      for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
      return { b64: btoa(s), start };
    }, g.sec);
    if (!g.script) await control.locator('#btnAuto').click().catch(() => {});
    const vid = await game.video().path();
    await ctx.close();
    await ctxC.close();
    const audio = path.join(outDir, `${id}.webm`);
    fs.writeFileSync(audio, Buffer.from(b64, 'base64'));
    const offset = Math.max(0, (start - t0) / 1000);
    const mp4 = path.join(outDir, `${id}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', offset.toFixed(3), '-i', vid, '-i', audio, '-map', '0:v', '-map', '1:a', '-t', String(g.sec),
      '-vf', 'fps=25', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-maxrate', '800k', '-bufsize', '1600k', '-pix_fmt', 'yuv420p',
      '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', '-movflags', '+faststart', mp4]);
    fs.rmSync(vidDir, { recursive: true, force: true });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '8', '-i', mp4, '-frames:v', '1', '-q:v', '3', path.join(outDir, `${id}.jpg`)]);
    console.log('xong', id);
  }
} finally {
  await browser.close();
  server.kill();
}
