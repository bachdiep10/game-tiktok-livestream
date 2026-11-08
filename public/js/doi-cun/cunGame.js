// Game TikTok LIVE "Đội Cún Quậy": 4 đội cún (Vàng, Mực, Bông, Lu) đua tới Khúc Xương Vàng.
// Người xem comment 1-4 để vào đội. Like, comment, share, follow giúp cún chạy và mở HỘP ĐỒ RANDOM
// để mặc cho cún (mũ, kính, áo, phụ kiện; đủ 4 món cùng bộ = FULL SET). "chọc 2" = chọc cún đội 2:
// cún bị lùi nhưng thanh Cáu đầy thì cún nổi điên chạy x2. 30 giây cuối là Giờ Vàng (mọi điểm x2).
// Game KHÔNG phụ thuộc quà xu: quà (nếu có) chỉ được thêm hộp đồ.
import {
  W, H, TAU, FONT, TEAMS, LANE_TOP, LANE_H, FINISH_X, START_X, BONE_X,
  roundRectPath as rr, outlined, loadImage, chromaKey, drawBackground, drawGoldenBone, drawDog, drawHat, sparkle, starPath, heartPath,
} from './art.js';
import { ITEMS, ITEM_BY_ID, SETS, SET_BY_ID, SLOTS, SLOT_NAME, RARITY, rarityOf, rollItem } from './items.js';
import * as sfx from './cunAudio.js';
import * as voice from '../audio.js';

const params = new URLSearchParams(location.search);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SPEED = clamp(Number(params.get('speed')) || 1, 0.25, 8);
const fmt = (n) => Math.round(n).toLocaleString('vi-VN');

// ------------------------------------------------------------------ cấu hình
const DEFAULTS = {
  title: 'ĐỘI CÚN QUẬY',
  hostName: 'MC',
  finishMeters: 600,
  roundSeconds: 180,
  goldenSeconds: 30,
  goldenMult: 2,
  underdogMult: 1.5,
  celebrateSeconds: 16,
  likePoints: 1,
  chatPoints: 3,
  actionPoints: 6,
  sharePoints: 30,
  followPoints: 20,
  actionCooldownSeconds: 5,
  switchTeamSeconds: 30,
  chocPush: 10,
  chocAnger: 12,
  angerMax: 100,
  rageSeconds: 10,
  rageMult: 2,
  rageAutoSpeed: 8,
  likesPerBox: 30,
  roomBoxLikes: 500,
  sharesForLegend: 5,
  boxOdds: { thuong: 80, hiem: 18, huyenthoai: 2 },
  shareOdds: { thuong: 0, hiem: 85, huyenthoai: 15 },
  giftOdds: { thuong: 0, hiem: 70, huyenthoai: 30 },
  giftLegendCoins: 100,
  giftPoints: 15,
  fullSetSeconds: 15,
  fullSetMult: 2,
  fullSetAutoSpeed: 4,
  sleepSeconds: 25,
  dogSize: 185,
  showRules: true,
  rules: [
    'Comment 1 · 2 · 3 · 4 để vào đội Vàng · Mực · Bông · Lu',
    'Thả tim: cún chạy · {likesPerBox} tim = 1 HỘP ĐỒ RANDOM',
    'SHARE = hộp đồ xịn (Hiếm trở lên) · {sharesForLegend} share = Huyền thoại',
    '"chọc 2" = chọc cún đội 2 (coi chừng nó nổi điên!)',
    'Gõ nhảy · sủa · ăn · hít đất · lắc để cún làm trò',
  ],
  sound: true,
  music: true,
  musicFiles: [],
  musicVolume: 0.3,
  voice: true,
  voiceEngine: 'auto',
  ttsVoice: 'vi-VN-HoaiMyNeural',
  voiceGapSeconds: 5,
  narration: true,
  narrationSeconds: 35,
  imageFolder: 'assets/doi-cun',
  messages: {
    join: ['{name} vào đội {team}', 'Chào {name}, chào mừng tới đội cún {team}', '{name} theo phe {team} rồi nha'],
    autoJoin: ['{name} được xếp vào đội {team}. Muốn đổi đội thì comment số 1 đến 4 nhé'],
    box: ['{name} mở hộp được {item} cho cún {team}', '{team} được {name} mặc cho {item}'],
    rare: ['Ồ, đồ hiếm! {name} mặc {item} cho cún {team}', '{name} share và mở được {item} hạng hiếm cho {team}'],
    legend: ['Trời ơi! Đồ huyền thoại! {name} mặc {item} cho cún {team}', 'Huyền thoại! {item} đã thuộc về cún {team}, cảm ơn {name}'],
    fullSet: ['Cún {team} mặc đủ bộ {set}! Full set, chạy nhanh gấp đôi', 'Full set {set}! Cún {team} biến hình rồi'],
    choc: ['{name} chọc cún {target}', 'Ơ kìa, {name} đang chọc cún {target}', 'Cún {target} bị {name} chọc rồi'],
    rage: ['Cún {team} nổi điên rồi! Chạy nhanh gấp đôi, ai bảo chọc nó', 'Cẩn thận! Cún {team} bị chọc nhiều quá nên nổi khùng rồi'],
    golden: ['Giờ vàng! Ba mươi giây cuối, mọi điểm nhân đôi. Thả tim và share thật nhiều nào', 'Giờ vàng bắt đầu! Đội về bét được chạy thêm một phẩy năm lần, lật kèo đi'],
    share: ['Cảm ơn {name} đã share, tặng hộp đồ xịn cho cún {team}'],
    shareLegend: ['{name} share đủ {n} lần, được hộp huyền thoại cho cún {team}. Cảm ơn bạn nhiều'],
    follow: ['Cảm ơn {name} đã follow, tặng một hộp đồ cho cún {team}'],
    gift: ['Cảm ơn {name} đã tặng {gift}, cún {team} được hộp đồ xịn'],
    rain: ['Cả phòng đã thả đủ {n} tim! Mưa hộp quà, đội nào cũng có quà'],
    leader: ['Cún {team} đang dẫn đầu, còn {left} mét nữa là tới khúc xương', 'Đội {team} đang dẫn trước, các đội khác cố lên'],
    win: ['Đội {team} thắng rồi! Cún {team} được gặm khúc xương vàng', 'Chúc mừng đội {team}! Cún {team} về đích đầu tiên'],
    mvp: ['Người góp công nhiều nhất là {name}. Nhà tạo mẫu của vòng này là {stylist}'],
    round: ['Vòng mới bắt đầu! Cởi hết đồ, mặc lại từ đầu nào. Comment 1 đến 4 để chọn đội', 'Vòng {round} bắt đầu! Thả tim để mở hộp đồ cho cún đội mình'],
    wake: ['Cún {team} ngủ gật rồi, đội {team} đâu, thả tim đánh thức nó dậy đi'],
    reminder: [
      'Comment số 1, 2, 3 hoặc 4 để vào đội cún Vàng, Mực, Bông hoặc Lu',
      'Cứ {likesPerBox} tim là được một hộp đồ random để mặc cho cún đội mình',
      'Share live được hộp đồ xịn, share đủ {sharesForLegend} lần được đồ huyền thoại',
      'Gõ chọc rồi số đội để chọc cún đội khác, nhưng chọc nhiều nó nổi điên đấy',
      'Mặc đủ bốn món cùng một bộ thì cún được full set, chạy nhanh gấp đôi',
      'Gõ nhảy, sủa, ăn, hít đất hoặc lắc để cún đội mình làm trò',
    ],
  },
};
let config = structuredClone(DEFAULTS);
const lastLine = {};
function line(kind, vars = {}) {
  const list = config.messages[kind] || DEFAULTS.messages[kind] || [''];
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastLine[kind]) i = (i + 1) % list.length;
  lastLine[kind] = i;
  return fill(list[i], vars);
}
function fill(s, vars = {}) {
  return String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? config[k] ?? '');
}
function norm(s) {
  return ` ${String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}
function truncate(s, n) {
  const a = Array.from(String(s || ''));
  return a.length > n ? `${a.slice(0, n - 1).join('')}…` : a.join('');
}

// ------------------------------------------------------------------ canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;
function fit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = `${W * s}px`;
  canvas.style.height = `${H * s}px`;
}
window.addEventListener('resize', fit);
fit();
const bgCanvas = document.createElement('canvas');
const IMG = { bg: null, box: null, bone: null, items: {}, gift: null, trophy: null, paw: null };

const avatarCache = new Map();
function getAvatar(url) {
  if (!url) return null;
  let img = avatarCache.get(url);
  if (!img) {
    img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.src = url;
    avatarCache.set(url, img);
    if (avatarCache.size > 500) avatarCache.delete(avatarCache.keys().next().value);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}
function drawAvatar(x, y, r, user, color, ring = '#fff', ringW = 3) {
  const img = getAvatar(user?.avatar);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  if (img) {
    ctx.save();
    ctx.clip();
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(r * 1.05)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Array.from(user?.name || '?')[0].toUpperCase(), x, y + 1);
  }
  ctx.lineWidth = ringW;
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
function pill(x, y, w, h, fillC, stroke = null, lw = 3) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fillC;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

// ------------------------------------------------------------------ trạng thái
let now = 0;
let gameTime = 0;
let round = 1;
let roundStart = 0;
let golden = false;
let celebrate = null; // { t0, team, mvp, stylist }
let totalLikes = 0;
let roomBoxAt = 0;
let lastVoice = -1e9;
let lastNarr = 0;
let lastLeaderTalk = 0;
let shake = 0;
const users = new Map();
const floats = [];
const particles = [];
const feed = [];
let bigBanner = null; // { text, sub, color, t0, until }
let wins = [0, 0, 0, 0];
try {
  const w = JSON.parse(localStorage.getItem('doiCunWins') || '[]');
  if (Array.isArray(w) && w.length === 4) wins = w.map((x) => Number(x) || 0);
} catch {
  /* bỏ qua */
}

function laneY(i) {
  return LANE_TOP + i * LANE_H;
}
function newTeam(def, i) {
  return {
    def, i, pos: 0, target: 0, speed: 0, phase: Math.random() * TAU,
    anger: 0, rageUntil: 0, fullUntil: 0, fullSet: null,
    outfit: { hat: null, glasses: null, shirt: null, acc: null },
    action: null, lastGain: 0, sleeping: false, wakeTalk: 0,
    boxQueue: [], box: null, label: null, flash: 0,
  };
}
const teams = TEAMS.map(newTeam);

function membersOf(i) {
  let n = 0;
  for (const u of users.values()) if (u.team === i) n++;
  return n;
}

function say(text, priority = 1) {
  if (!text) return;
  const gap = Math.max(2, Number(config.voiceGapSeconds) || 5) * 1000;
  if (priority < 2 && now - lastVoice < gap) return;
  lastVoice = now;
  voice.speak(text, priority);
}
function addFeed(text, color = '#fff', icon = null) {
  feed.unshift({ text, color, icon, t0: now });
  if (feed.length > 3) feed.length = 3;
}
function addFloat(team, text, color = '#fff') {
  if (floats.length > 50) floats.shift();
  floats.push({ team: team.i, text, color, t0: now, dx: rand(-40, 40) });
}
function banner(text, sub, color, ms = 2600) {
  bigBanner = { text, sub, color, t0: now, until: now + ms };
}

function getUser(user) {
  if (!user?.id) return null;
  let u = users.get(user.id);
  if (!u) {
    u = { id: user.id, name: user.name || 'Bạn', avatar: user.avatar || '', team: -1, points: 0, items: 0, likeBank: 0, shares: 0, lastAction: -1e9, lastChat: -1e9, lastSwitch: -1e9 };
    users.set(user.id, u);
    if (users.size > 3000) users.delete(users.keys().next().value);
  } else {
    if (user.name) u.name = user.name;
    if (user.avatar) u.avatar = user.avatar;
  }
  return u;
}

function joinTeam(u, i, auto = false) {
  if (u.team === i) return false;
  if (u.team >= 0 && now - u.lastSwitch < config.switchTeamSeconds * 1000) return false;
  u.team = i;
  u.lastSwitch = now;
  const team = teams[i];
  team.label = { user: u, text: auto ? 'vào đội' : '🙋 vào đội', until: now + 2500 };
  if (!auto) say(line('join', { name: u.name, team: team.def.name }), 0);
  return true;
}
// người chưa chọn đội: xếp vào đội ít người nhất
function ensureTeam(u) {
  if (u.team >= 0) return teams[u.team];
  let best = [];
  let min = Infinity;
  for (let i = 0; i < 4; i++) {
    const m = membersOf(i);
    if (m < min) {
      min = m;
      best = [i];
    } else if (m === min) best.push(i);
  }
  const i = pick(best);
  joinTeam(u, i, true);
  say(line('autoJoin', { name: u.name, team: teams[i].def.name }), 0);
  return teams[i];
}

function lastPlace() {
  let worst = teams[0];
  for (const t of teams) if (t.target < worst.target) worst = t;
  return worst;
}
function leader() {
  let best = teams[0];
  for (const t of teams) if (t.target > best.target) best = t;
  return best;
}
function itemBonus(team) {
  let b = 0;
  for (const s of SLOTS) if (team.outfit[s]) b += RARITY[rarityOf(team.outfit[s].item)].bonus;
  return b;
}
function multOf(team) {
  let m = 1 + itemBonus(team);
  if (now < team.fullUntil) m *= config.fullSetMult;
  if (now < team.rageUntil) m *= config.rageMult;
  if (golden) {
    m *= config.goldenMult;
    if (lastPlace() === team) m *= config.underdogMult;
  }
  return m;
}
function gain(team, pts, u) {
  if (celebrate || !team) return 0;
  const m = pts * multOf(team);
  team.target = Math.min(config.finishMeters, team.target + m);
  team.lastGain = now;
  if (team.sleeping) {
    team.sleeping = false;
    setAction(team, 'jump');
  }
  if (u) {
    u.points += m;
    team.label = { user: u, text: `+${fmt(m)}`, until: now + 2200 };
  }
  return m;
}
function setAction(team, name) {
  const DUR = { jump: 700, bark: 900, eat: 1500, pushup: 1600, dance: 2000, hit: 700 };
  team.action = { name, t0: now, dur: DUR[name] || 1000 };
  if (name === 'jump') sfx.boing();
  if (name === 'bark') {
    sfx.bark(team.i, 2);
    addFloat(team, 'GÂU GÂU!', '#fff');
  }
  if (name === 'eat') sfx.chomp();
  if (name === 'pushup') sfx.huff();
  if (name === 'dance') sfx.whoosh();
}

// ------------------------------------------------------------------ hộp đồ
function queueBox(team, u, odds, source, forceRarity = null) {
  if (celebrate) return;
  const item = forceRarity ? rollItem({ [forceRarity]: 1 }) : rollItem(odds);
  team.boxQueue.push({ item, user: u, source });
  if (team.boxQueue.length > 12) team.boxQueue.splice(0, team.boxQueue.length - 12);
}
function startNextBox(team) {
  if (team.box || !team.boxQueue.length) return;
  const b = team.boxQueue.shift();
  const fast = team.boxQueue.length >= 2;
  team.box = { ...b, t0: now, dur: fast ? 1300 : 2300, opened: false };
  sfx.boxDrop();
}
function updateBox(team) {
  const b = team.box;
  if (!b) return startNextBox(team);
  const k = (now - b.t0) / b.dur;
  if (!b.opened && k >= 0.5) {
    b.opened = true;
    const rarity = rarityOf(b.item);
    sfx.boxOpen(rarity);
    for (let i = 0; i < (rarity === 'huyenthoai' ? 60 : rarity === 'hiem' ? 30 : 14); i++) spawnSpark(boxPos(team, 0.5), RARITY[rarity].color);
  }
  if (k >= 1) {
    equip(team, b.item, b.user, b.source);
    team.box = null;
  }
}
function boxPos(team, k) {
  const d = dogXY(team);
  const S = config.dogSize;
  const groundY = d.y - S * 0.31;
  const top = laneY(team.i) - 40;
  const y = k < 0.3 ? top + (groundY - top) * (k / 0.3) ** 2 : groundY;
  return { x: Math.min(FINISH_X - S * 0.35, d.x + S * 0.95), y };
}
function equip(team, item, u, source) {
  team.outfit[item.slot] = { item, by: u };
  if (u) u.items++;
  const rarity = rarityOf(item);
  const R = RARITY[rarity];
  const who = u ? u.name : source || 'Cả phòng';
  sfx.equip();
  addFeed(`🎁 ${truncate(who, 14)} mặc cho ${team.def.name}: ${item.name}`, R.color, item);
  addFloat(team, `${item.name}`, R.color);
  const vars = { name: who, item: item.name, team: team.def.name };
  if (rarity === 'huyenthoai') {
    banner('✨ HUYỀN THOẠI ✨', `${truncate(who, 16)} mặc ${item.name} cho cún ${team.def.name}`, R.color, 3000);
    say(line('legend', vars), 2);
    shake = Math.max(shake, 0.4);
  } else if (rarity === 'hiem') say(line('rare', vars), 1);
  else say(line('box', vars), 0);
  // đủ 4 món cùng bộ?
  const sets = SLOTS.map((s) => team.outfit[s]?.item.set);
  if (sets.every((s) => s && s === sets[0]) && team.fullSet !== sets[0]) {
    const set = SET_BY_ID[sets[0]];
    team.fullSet = set.id;
    team.fullUntil = now + config.fullSetSeconds * 1000;
    setAction(team, 'dance');
    sfx.fullSet();
    banner(`FULL SET ${set.name.toUpperCase()}!`, `Cún ${team.def.name} chạy x${config.fullSetMult} trong ${config.fullSetSeconds} giây`, team.def.color, 3200);
    say(line('fullSet', { team: team.def.name, set: set.name }), 2);
    for (let i = 0; i < 50; i++) spawnSpark(dogCenter(team), pick([team.def.color, '#ffd34d', '#fff']));
  } else if (!sets.every((s) => s && s === sets[0])) team.fullSet = null;
}

// ------------------------------------------------------------------ sự kiện TikTok
const ACTIONS = [
  { words: ['hit dat', 'chong day', 'pushup', 'tap gym'], action: 'pushup' },
  { words: ['nhay mua', 'lac', 'lac lu', 'quay', 'dance', 'mua'], action: 'dance' },
  { words: ['nhay', 'bat nhay', 'jump'], action: 'jump' },
  { words: ['sua', 'gau', 'gau gau', 'bark'], action: 'bark' },
  { words: ['an', 'gam', 'gam xuong', 'an xuong', 'eat'], action: 'eat' },
];
function teamFromText(n) {
  const m = n.match(/^ (?:doi |team |vao |chon |phe )?([1-4]) $/);
  if (m) return Number(m[1]) - 1;
  for (let i = 0; i < 4; i++) {
    for (const w of TEAMS[i].words) if (n === ` ${w} ` || n === ` doi ${w} ` || n === ` team ${w} `) return i;
  }
  return -1;
}
function chocTarget(n, own) {
  const m = n.match(/ choc (?:doi |cun |cho )?([1-4]) /);
  if (m) return Number(m[1]) - 1;
  for (let i = 0; i < 4; i++) for (const w of TEAMS[i].words) if (n.includes(` choc ${w} `) || n.includes(` choc cun ${w} `)) return i;
  // không nói đội nào: chọc đội đang dẫn đầu (không phải đội mình)
  const others = teams.filter((t) => t.i !== own).sort((a, b) => b.target - a.target);
  return others[0]?.i ?? -1;
}

function handleEvent(ev) {
  if (!ev || !ev.type) return;
  switch (ev.type) {
    case 'status':
      return;
    case 'reset':
      users.clear();
      wins = [0, 0, 0, 0];
      localStorage.setItem('doiCunWins', JSON.stringify(wins));
      newRound(false);
      return;
    case 'voiceTest':
      say('Xin chào, chào mừng các bạn tới Đội Cún Quậy. Comment số một đến bốn để chọn đội nhé', 2);
      return;
    case 'golden':
      roundStart = now - (config.roundSeconds - config.goldenSeconds) * 1000 - 200;
      return;
    case 'finishTest': {
      const t = leader();
      t.target = config.finishMeters;
      return;
    }
    case 'rageTest': {
      const t = teams[ev.team ?? Math.floor(Math.random() * 4)];
      t.anger = config.angerMax - 1;
      choc(null, t, true);
      return;
    }
    case 'fullsetTest': {
      const t = teams[ev.team ?? Math.floor(Math.random() * 4)];
      const set = SET_BY_ID[ev.set] || pick(SETS);
      for (const it of ITEMS.filter((x) => x.set === set.id)) t.boxQueue.push({ item: it, user: null, source: 'Thử' });
      return;
    }
  }
  const raw = ev.user;
  if (!raw?.id) return;
  const u = getUser(raw);
  switch (ev.type) {
    case 'join':
      return;
    case 'chat': {
      const n = norm(ev.text);
      const ti = teamFromText(n);
      if (ti >= 0) {
        if (joinTeam(u, ti)) {
          const t = teams[ti];
          setAction(t, 'jump');
          gain(t, config.chatPoints, u);
        }
        return;
      }
      const team = ensureTeam(u);
      const ready = now - u.lastAction > config.actionCooldownSeconds * 1000;
      if (n.includes(' choc ')) {
        if (!ready) return;
        u.lastAction = now;
        const target = teams[chocTarget(n, team.i)];
        if (target && target !== team) choc(u, target);
        return;
      }
      const act = ACTIONS.find((a) => a.words.some((w) => n.includes(` ${w} `)));
      if (act && ready) {
        u.lastAction = now;
        if (!team.action || team.action.name !== 'dance' || now > team.fullUntil) setAction(team, act.action);
        const m = gain(team, config.actionPoints, u);
        if (m) addFloat(team, `+${fmt(m)}`, '#fff3a0');
        return;
      }
      if (now - u.lastChat > config.actionCooldownSeconds * 1000) {
        u.lastChat = now;
        const m = gain(team, config.chatPoints, u);
        if (m) addFloat(team, `+${fmt(m)}`, '#e8f6ff');
      }
      return;
    }
    case 'like': {
      const team = ensureTeam(u);
      const c = Math.max(1, Number(ev.count) || 1);
      totalLikes += c;
      gain(team, c * config.likePoints, u);
      sfx.pop();
      if (Math.random() < 0.5) spawnHeart(team);
      u.likeBank += c;
      let boxes = 0;
      while (u.likeBank >= config.likesPerBox && boxes < 3) {
        u.likeBank -= config.likesPerBox;
        queueBox(team, u, config.boxOdds, 'tim');
        boxes++;
      }
      if (u.likeBank >= config.likesPerBox) u.likeBank = u.likeBank % config.likesPerBox;
      // mưa hộp quà cho cả phòng
      while (totalLikes - roomBoxAt >= config.roomBoxLikes) {
        roomBoxAt += config.roomBoxLikes;
        for (const t of teams) queueBox(t, null, config.boxOdds, 'Cả phòng');
        banner('🎁 MƯA HỘP QUÀ 🎁', `Cả phòng đã thả ${fmt(roomBoxAt)} tim · mỗi đội 1 hộp`, '#ff7ab8', 3000);
        say(line('rain', { n: fmt(roomBoxAt) }), 2);
      }
      return;
    }
    case 'share': {
      const team = ensureTeam(u);
      u.shares++;
      gain(team, config.sharePoints, u);
      const legend = config.sharesForLegend > 0 && u.shares % config.sharesForLegend === 0;
      if (legend) {
        queueBox(team, u, null, 'share', 'huyenthoai');
        say(line('shareLegend', { name: u.name, team: team.def.name, n: config.sharesForLegend }), 2);
      } else {
        queueBox(team, u, config.shareOdds, 'share');
        say(line('share', { name: u.name, team: team.def.name }), 1);
      }
      addFeed(`🔁 ${truncate(u.name, 14)} share live (${u.shares}/${config.sharesForLegend})`, '#9be7ff');
      return;
    }
    case 'follow': {
      const team = ensureTeam(u);
      gain(team, config.followPoints, u);
      queueBox(team, u, config.boxOdds, 'follow');
      setAction(team, 'jump');
      say(line('follow', { name: u.name, team: team.def.name }), 1);
      addFeed(`⭐ ${truncate(u.name, 14)} follow kênh`, '#ffd34d');
      return;
    }
    case 'gift': {
      const team = ensureTeam(u);
      const coins = Math.max(1, Number(ev.coins) || Number(ev.diamonds) * (Number(ev.repeatCount) || 1) || 1);
      gain(team, config.giftPoints, u);
      queueBox(team, u, config.giftOdds, 'quà', coins >= config.giftLegendCoins ? 'huyenthoai' : null);
      say(line('gift', { name: u.name, gift: ev.giftName || 'quà', team: team.def.name }), 1);
      return;
    }
  }
}

function choc(u, target, force = false) {
  if (celebrate) return;
  if (now < target.rageUntil && !force) {
    addFloat(target, 'Đang nổi điên!', '#ff5a5a');
    return;
  }
  target.target = Math.max(0, target.target - config.chocPush);
  target.anger = Math.min(config.angerMax, target.anger + config.chocAnger);
  setAction(target, 'hit');
  sfx.bonk();
  addFloat(target, `-${config.chocPush} 😣`, '#ffb0b0');
  if (u) {
    const own = teams[u.team];
    if (own) setAction(own, 'bark');
    addFeed(`👉 ${truncate(u.name, 14)} chọc cún ${target.def.name}`, '#ffb0b0');
    say(line('choc', { name: u.name, target: target.def.name }), 0);
  }
  if (target.anger >= config.angerMax) {
    target.anger = 0;
    target.rageUntil = now + config.rageSeconds * 1000;
    sfx.growl();
    setTimeout(() => sfx.bark(target.i, 3, 1.4), 400);
    shake = Math.max(shake, 0.8);
    banner(`🔥 CÚN ${target.def.name.toUpperCase()} NỔI ĐIÊN! 🔥`, `Chạy x${config.rageMult} trong ${config.rageSeconds} giây`, '#ff4d4d', 2800);
    say(line('rage', { team: target.def.name }), 2);
  }
}

function spawnSpark(p, color) {
  if (particles.length > 500) return;
  particles.push({ x: p.x, y: p.y, vx: rand(-320, 320), vy: rand(-520, -80), g: 900, life: rand(0.6, 1.3), t: 0, color, size: rand(4, 10), kind: 'spark' });
}
function spawnHeart(team) {
  if (particles.length > 500) return;
  const d = dogCenter(team);
  particles.push({ x: d.x + rand(-40, 40), y: d.y - 40, vx: rand(-40, 40), vy: rand(-160, -90), g: 0, life: 1.2, t: 0, color: pick(['#ff4d6d', '#ff7aa8', '#ff2d55']), size: rand(14, 22), kind: 'heart' });
}
function confetti() {
  for (let i = 0; i < 6; i++) {
    if (particles.length > 600) return;
    particles.push({ x: rand(0, W), y: -20, vx: rand(-60, 60), vy: rand(150, 300), g: 60, life: 5, t: 0, color: pick(['#ff4d6d', '#ffd34d', '#3f8cff', '#22c47a', '#ff7ab8', '#fff']), size: rand(8, 14), kind: 'confetti', rot: rand(0, TAU) });
  }
}

// ------------------------------------------------------------------ vòng chơi
function newRound(announce = true) {
  if (announce) round++;
  else round = 1;
  roundStart = now;
  golden = false;
  sfx.setHype(0);
  celebrate = null;
  totalLikes = 0;
  roomBoxAt = 0;
  for (let i = 0; i < 4; i++) {
    const t = teams[i];
    Object.assign(t, newTeam(t.def, i));
    t.lastGain = now;
  }
  for (const u of users.values()) {
    u.points = 0;
    u.items = 0;
    u.shares = 0;
  }
  if (announce) {
    say(line('round', { round }), 2);
    banner(`VÒNG ${round}`, 'Cởi hết đồ · mặc lại từ đầu!', '#ffd34d', 2500);
  }
}
function finishRound(team) {
  if (celebrate) return;
  wins[team.i]++;
  try {
    localStorage.setItem('doiCunWins', JSON.stringify(wins));
  } catch {
    /* bỏ qua */
  }
  const members = [...users.values()].filter((u) => u.team === team.i && u.points > 0).sort((a, b) => b.points - a.points).slice(0, 3);
  const stylist = [...users.values()].filter((u) => u.items > 0).sort((a, b) => b.items - a.items)[0] || null;
  celebrate = { t0: now, team, mvp: members, stylist };
  golden = false;
  sfx.setHype(0);
  for (const t of teams) {
    t.rageUntil = 0;
    t.fullUntil = 0;
    t.boxQueue.length = 0;
  }
  team.target = Math.max(team.target, team.pos);
  setAction(team, 'eat');
  sfx.fanfare();
  say(line('win', { team: team.def.name }), 2);
  if (members[0]) setTimeout(() => say(line('mvp', { name: members[0].name, stylist: stylist ? stylist.name : 'chưa có ai' }), 2), 4500);
}

function update(dt) {
  const elapsed = (now - roundStart) / 1000;
  if (!celebrate) {
    const left = config.roundSeconds - elapsed;
    if (!golden && left <= config.goldenSeconds) {
      golden = true;
      sfx.setHype(1);
      sfx.referee();
      banner('⏰ GIỜ VÀNG ⏰', `${config.goldenSeconds} giây cuối · mọi điểm x${config.goldenMult} · đội bét x${config.underdogMult}`, '#ffd34d', 3200);
      say(line('golden'), 2);
    }
    if (golden && left > 0 && left <= 10 && Math.floor(left + dt) !== Math.floor(left)) sfx.tick(left < 4);
    if (left <= 0) finishRound(leader());
  } else if (now - celebrate.t0 > config.celebrateSeconds * 1000) newRound(true);

  for (const t of teams) {
    if (!celebrate) {
      if (now < t.rageUntil) t.target = Math.min(config.finishMeters, t.target + config.rageAutoSpeed * dt);
      if (now < t.fullUntil) t.target = Math.min(config.finishMeters, t.target + config.fullSetAutoSpeed * dt);
    }
    const prev = t.pos;
    const diff = t.target - t.pos;
    t.pos += diff * Math.min(1, dt * 3.5);
    if (Math.abs(diff) < 0.05) t.pos = t.target;
    t.speed = (t.pos - prev) / Math.max(dt, 1e-3);
    t.phase += dt * (8 + Math.min(20, Math.abs(t.speed) * 0.6));
    if (t.action && now - t.action.t0 > t.action.dur) {
      t.action = null;
      if (now < t.fullUntil) setAction(t, 'dance');
    }
    const sleepy = !celebrate && now - t.lastGain > config.sleepSeconds * 1000 && now > t.rageUntil;
    if (sleepy && !t.sleeping) t.sleeping = true;
    if (t.sleeping && membersOf(t.i) > 0 && now - t.wakeTalk > 60000 && now - lastVoice > 15000) {
      t.wakeTalk = now;
      say(line('wake', { team: t.def.name }), 0);
    }
    updateBox(t);
    if (!celebrate && t.pos >= config.finishMeters - 0.5) finishRound(t);
  }
  // nói ai dẫn đầu
  if (!celebrate && now - lastLeaderTalk > 45000 && now - lastVoice > 8000) {
    const l = leader();
    if (l.target > 30) {
      lastLeaderTalk = now;
      say(line('leader', { team: l.def.name, left: fmt(config.finishMeters - l.target) }), 0);
    }
  }
  if (config.narration && now - lastNarr > config.narrationSeconds * 1000 && now - lastVoice > 10000) {
    lastNarr = now;
    say(line('reminder'), 0);
  }
  for (const p of particles) {
    p.t += dt;
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.rot != null) p.rot += dt * 5;
  }
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].t > particles[i].life) particles.splice(i, 1);
  for (let i = floats.length - 1; i >= 0; i--) if (now - floats[i].t0 > 1600) floats.splice(i, 1);
  if (celebrate) confetti();
  shake = Math.max(0, shake - dt * 1.2);
}

// ------------------------------------------------------------------ vẽ
function dogXY(team) {
  const S = config.dogSize;
  const frac = clamp(team.pos / config.finishMeters, 0, 1);
  const x = START_X + frac * (FINISH_X - 0.74 * S - START_X);
  const y = laneY(team.i) + LANE_H - 22;
  return { x, y };
}
function dogCenter(team) {
  const d = dogXY(team);
  return { x: d.x + config.dogSize * 0.15, y: d.y - config.dogSize * 0.6 };
}
function poseOf(team) {
  const a = team.action;
  let action = a ? a.name : team.sleeping ? 'sleep' : 'idle';
  if (celebrate && celebrate.team === team && !a) action = 'dance';
  const k = a ? clamp((now - a.t0) / a.dur, 0, 1) : (gameTime % 2) / 2;
  return { time: gameTime + team.i * 0.7, run: action === 'sleep' ? 0 : clamp(Math.abs(team.speed) / 18, 0, 1), phase: team.phase, action, k, angry: now < team.rageUntil };
}
function outfitOf(team) {
  const o = {};
  for (const s of SLOTS) if (team.outfit[s]) o[s] = team.outfit[s].item;
  return o;
}
function drawOneDog(team, x, y, S, pose) {
  const outfit = outfitOf(team);
  // hào quang full set / nổi điên
  if (now < team.fullUntil || now < team.rageUntil) {
    const rage = now < team.rageUntil;
    const g = ctx.createRadialGradient(x + S * 0.1, y - S * 0.55, 10, x + S * 0.1, y - S * 0.55, S * 0.9);
    g.addColorStop(0, rage ? 'rgba(255,70,40,0.55)' : 'rgba(255,230,120,0.6)');
    g.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - S, y - S * 1.6, S * 2.2, S * 1.8);
    if (rage) {
      // vệt lửa phía sau
      for (let i = 0; i < 5; i++) {
        const fx = x - S * (0.55 + i * 0.12) + Math.sin(gameTime * 20 + i) * 6;
        const fy = y - S * (0.2 + (i % 3) * 0.18);
        ctx.fillStyle = i % 2 ? 'rgba(255,120,30,0.7)' : 'rgba(255,220,60,0.7)';
        ctx.beginPath();
        ctx.ellipse(fx, fy, S * 0.12, S * 0.06, 0, 0, TAU);
        ctx.fill();
      }
    }
  }
  const info = drawDog(ctx, team.def, x, y, S, pose, outfit, IMG.items);
  if (outfit.hat) drawHat(ctx, outfit.hat, IMG.items, info.headTop, S, gameTime, info.rot + info.headRot);
  if (pose.action === 'sleep') {
    for (let i = 0; i < 3; i++) {
      const k = (gameTime * 0.5 + i / 3) % 1;
      outlined(ctx, 'z', x + S * 0.55 + k * 40, y - S * 0.85 - k * 70, { size: 24 + k * 20, color: '#fff', lw: 5, stroke: '#20305a' });
    }
  }
  if (pose.angry) {
    // hơi nước bốc trên đầu
    for (let i = 0; i < 2; i++) {
      const k = (gameTime * 1.8 + i * 0.5) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`;
      ctx.beginPath();
      ctx.arc(info.headTop.x + (i ? 30 : -30), info.headTop.y - 10 - k * 50, 10 + k * 14, 0, TAU);
      ctx.fill();
    }
  }
  return info;
}

function drawLane(team) {
  const y0 = laneY(team.i);
  const S = config.dogSize;
  const d = dogXY(team);
  const def = team.def;
  // dải nhãn đội
  pill(12, y0 + 10, 186, 46, def.color, '#fff', 3);
  outlined(ctx, `${def.no}`, 38, y0 + 34, { size: 34, color: '#fff', stroke: def.dark, lw: 6 });
  outlined(ctx, def.name.toUpperCase(), 118, y0 + 34, { size: 28, color: '#fff', stroke: def.dark, lw: 6 });
  pill(206, y0 + 14, 92, 38, 'rgba(0,0,0,0.35)');
  outlined(ctx, `👥 ${membersOf(team.i)}`, 252, y0 + 34, { size: 22, color: '#fff', lw: 0, stroke: 'transparent' });
  // thanh Cáu
  const ax = 308;
  pill(ax, y0 + 14, 170, 38, 'rgba(0,0,0,0.35)');
  const rage = now < team.rageUntil;
  const ak = rage ? (team.rageUntil - now) / (config.rageSeconds * 1000) : team.anger / config.angerMax;
  if (ak > 0) {
    rr(ctx, ax + 52, y0 + 22, 110 * ak, 22, 11);
    ctx.fillStyle = rage ? '#ff3b30' : ak > 0.7 ? '#ff7a30' : '#ffb340';
    ctx.fill();
  }
  rr(ctx, ax + 52, y0 + 22, 110, 22, 11);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.stroke();
  outlined(ctx, rage ? '🔥' : '😠', ax + 26, y0 + 34, { size: 24, lw: 0, stroke: 'transparent' });
  // 4 ô đồ
  const sx = 490;
  SLOTS.forEach((s, j) => {
    const it = team.outfit[s]?.item;
    const bx = sx + j * 46;
    rr(ctx, bx, y0 + 12, 40, 40, 9);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = it ? RARITY[rarityOf(it)].color : 'rgba(255,255,255,0.35)';
    ctx.stroke();
    if (it) drawItemIcon(it, bx + 20, y0 + 32, 32);
    else outlined(ctx, { hat: '🎩', glasses: '👓', shirt: '👕', acc: '🎀' }[s], bx + 20, y0 + 33, { size: 20, lw: 0, stroke: 'transparent', color: 'rgba(255,255,255,0.5)' });
  });
  // số mét còn lại
  const left = Math.max(0, config.finishMeters - team.pos);
  outlined(ctx, `${fmt(team.pos)} m`, 760, y0 + 34, { size: 26, color: '#fff', stroke: '#1a4d1a', lw: 6, align: 'center' });
  if (now < team.fullUntil) outlined(ctx, `FULL SET x${config.fullSetMult}`, 760, y0 + 70, { size: 22, color: '#ffd34d', stroke: '#5a3a00', lw: 5 });
  else if (left < config.finishMeters * 0.15 && !celebrate) outlined(ctx, 'SẮP VỀ ĐÍCH!', 760, y0 + 70, { size: 22, color: '#fff3a0', stroke: '#5a3a00', lw: 5 });
  // vệt chạy
  if (Math.abs(team.speed) > 6) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const ly = d.y - S * (0.25 + i * 0.18);
      ctx.beginPath();
      ctx.moveTo(d.x - S * 0.55 - i * 12, ly);
      ctx.lineTo(d.x - S * 0.55 - 60 - i * 12, ly);
      ctx.stroke();
    }
  }
  const pose = poseOf(team);
  drawOneDog(team, d.x, d.y, S, pose);
  // nhãn người vừa giúp
  if (team.label && now < team.label.until) {
    const lu = team.label.user;
    const a = clamp((team.label.until - now) / 400, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    const lx = clamp(d.x + S * 0.1, 160, 820);
    const ly = y0 + 84;
    ctx.font = `800 22px ${FONT}`;
    const name = truncate(lu.name, 14);
    const tw = ctx.measureText(`${name} ${team.label.text}`).width + 70;
    pill(lx - tw / 2, ly - 20, tw, 40, 'rgba(0,0,0,0.6)', def.color, 2);
    drawAvatar(lx - tw / 2 + 22, ly, 16, lu, def.color, '#fff', 2);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${name} ${team.label.text}`, lx - tw / 2 + 46, ly + 1);
    ctx.restore();
  }
  // hộp quà đang rơi/mở
  if (team.box) drawBox(team);
}

function drawItemIcon(item, x, y, s) {
  const img = IMG.items[item.id];
  if (img) {
    ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
    return;
  }
  // kính / áo / hào quang: biểu tượng tự vẽ
  ctx.save();
  ctx.translate(x, y);
  const k = s / 40;
  ctx.scale(k, k);
  if (item.slot === 'glasses') {
    const col = { 'round-sun': '#222', square: '#7a4a22', star: '#ff4fae', mask: '#6b2bb3', gold: '#e0b000', heart: '#e0193c' }[item.style] || '#333';
    ctx.fillStyle = col;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    if (item.style === 'star') {
      starPath(ctx, -9, 0, 9, 4);
      ctx.fill();
      starPath(ctx, 9, 0, 9, 4);
      ctx.fill();
    } else if (item.style === 'heart') {
      heartPath(ctx, -9, 1, 9);
      ctx.fill();
      heartPath(ctx, 9, 1, 9);
      ctx.fill();
    } else if (item.style === 'mask') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-7, 0, 3, 0, TAU);
      ctx.arc(7, 0, 3, 0, TAU);
      ctx.fill();
    } else if (item.style === 'square') {
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.strokeRect(-16, -6, 13, 11);
      ctx.strokeRect(3, -6, 13, 11);
    } else {
      ctx.beginPath();
      ctx.arc(-8, 0, 7, 0, TAU);
      ctx.arc(8, 0, 7, 0, TAU);
      ctx.fill();
    }
  } else if (item.slot === 'shirt') {
    const col = { hawaii: '#25a9e8', gown: '#1f1b2e', jacket: '#2a2a2a', tux: '#6b2fb3', cape: '#c3122f', angel: '#fdfcf6' }[item.style] || '#e33';
    ctx.fillStyle = col;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(-18, -8);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-10, -3);
    ctx.lineTo(-10, 15);
    ctx.lineTo(10, 15);
    ctx.lineTo(10, -3);
    ctx.lineTo(14, 0);
    ctx.lineTo(18, -8);
    ctx.lineTo(8, -14);
    ctx.quadraticCurveTo(0, -8, -8, -14);
    ctx.fill();
    ctx.stroke();
    if (item.style === 'hawaii') {
      ctx.fillStyle = '#ff6fae';
      ctx.beginPath();
      ctx.arc(-3, 2, 3, 0, TAU);
      ctx.arc(5, 8, 3, 0, TAU);
      ctx.fill();
    } else if (item.style === 'angel') sparkle(ctx, 0, 3, 6, '#ffcf33');
    else if (item.style === 'cape' || item.style === 'gown') {
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(-2, -8, 4, 22);
    }
  } else if (item.style === 'halo') {
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 7, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBox(team) {
  const b = team.box;
  const k = clamp((now - b.t0) / b.dur, 0, 1);
  const rarity = rarityOf(b.item);
  const R = RARITY[rarity];
  const S = config.dogSize;
  if (k < 0.5) {
    const p = boxPos(team, k);
    const wob = k > 0.3 ? Math.sin((k - 0.3) * 80) * 0.18 : 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(wob);
    const s = S * 0.62;
    if (k > 0.3) {
      ctx.shadowColor = R.glow;
      ctx.shadowBlur = 30;
    }
    if (IMG.box) ctx.drawImage(IMG.box, -s / 2, -s / 2, s, s);
    else {
      ctx.fillStyle = '#ff5f8f';
      ctx.fillRect(-s / 2, -s / 2, s, s);
    }
    ctx.restore();
    if (b.user) outlined(ctx, truncate(b.user.name, 12), p.x, p.y - s * 0.75, { size: 20, color: '#fff', lw: 5 });
  } else {
    // món đồ bay ra khỏi hộp rồi bay vào cún
    const p0 = boxPos(team, 0.5);
    const d = dogCenter(team);
    const f = clamp((k - 0.5) / 0.5, 0, 1);
    const hold = Math.min(1, f / 0.55);
    const fly = clamp((f - 0.55) / 0.45, 0, 1);
    const x = p0.x + (d.x - p0.x) * fly;
    const y = p0.y - 70 * hold + (d.y - (p0.y - 70)) * fly;
    const s = 70 + 40 * hold - 50 * fly;
    ctx.save();
    // tia sáng sau món đồ
    ctx.translate(x, y);
    ctx.rotate(gameTime * 2);
    ctx.globalAlpha = 0.8 * (1 - fly);
    ctx.fillStyle = R.glow;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(TAU / 8);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -s * 1.1);
      ctx.lineTo(10, -s * 1.1);
      ctx.fill();
    }
    ctx.restore();
    drawItemIcon(b.item, x, y, s);
    if (fly < 0.3) {
      ctx.save();
      ctx.globalAlpha = 1 - fly / 0.3;
      outlined(ctx, b.item.name, x, y - s * 0.85, { size: 26, color: R.color, lw: 6 });
      outlined(ctx, R.name.toUpperCase(), x, y + s * 0.8, { size: 20, color: '#fff', stroke: rarity === 'huyenthoai' ? '#7a4d00' : '#14304d', lw: 5 });
      ctx.restore();
    }
  }
}

function drawFloats() {
  for (const f of floats) {
    const k = (now - f.t0) / 1600;
    const d = dogCenter(teams[f.team]);
    ctx.save();
    ctx.globalAlpha = 1 - k * k;
    outlined(ctx, f.text, d.x + f.dx, d.y - 60 - k * 90, { size: 30, color: f.color, lw: 6 });
    ctx.restore();
  }
}
function drawParticles() {
  for (const p of particles) {
    const a = 1 - p.t / p.life;
    ctx.save();
    ctx.globalAlpha = clamp(a * 1.5, 0, 1);
    if (p.kind === 'heart') {
      heartPath(ctx, p.x, p.y, p.size);
      ctx.fillStyle = p.color;
      ctx.fill();
    } else if (p.kind === 'confetti') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else sparkle(ctx, p.x, p.y, p.size, p.color);
    ctx.restore();
  }
}

function drawHud() {
  // tiêu đề
  ctx.save();
  const title = config.title || DEFAULTS.title;
  outlined(ctx, title, W / 2, 70, { size: 76, color: '#ffe14d', stroke: '#7a2e00', lw: 14 });
  if (IMG.paw) {
    ctx.drawImage(IMG.paw, 60, 30, 76, 76);
    ctx.drawImage(IMG.paw, W - 136, 30, 76, 76);
  }
  // vòng + đồng hồ
  const elapsed = (now - roundStart) / 1000;
  const left = Math.max(0, Math.ceil(config.roundSeconds - elapsed));
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  pill(W / 2 - 160, 122, 320, 84, golden ? '#ffcf1f' : 'rgba(20,40,80,0.8)', '#fff', 4);
  outlined(ctx, celebrate ? 'KẾT THÚC' : `${mm}:${ss}`, W / 2, 166, { size: celebrate ? 46 : 58, color: golden ? '#7a2e00' : '#fff', stroke: golden ? '#fff6c0' : '#0a1a33', lw: 8 });
  pill(40, 138, 170, 54, 'rgba(20,40,80,0.8)', '#fff', 3);
  outlined(ctx, `VÒNG ${round}`, 125, 166, { size: 30, color: '#fff', lw: 6, stroke: '#0a1a33' });
  // tiến độ mưa hộp quà
  const rk = clamp((totalLikes - roomBoxAt) / config.roomBoxLikes, 0, 1);
  pill(W - 250, 138, 210, 54, 'rgba(20,40,80,0.8)', '#ff7ab8', 3);
  rr(ctx, W - 244, 144, 198 * rk, 42, 21);
  ctx.fillStyle = 'rgba(255,90,160,0.75)';
  ctx.fill();
  outlined(ctx, `❤️ ${fmt(totalLikes - roomBoxAt)}/${fmt(config.roomBoxLikes)}`, W - 145, 166, { size: 24, color: '#fff', lw: 5, stroke: '#4a0a2a' });
  outlined(ctx, 'mưa hộp quà', W - 145, 208, { size: 18, color: '#ffd1e6', lw: 4, stroke: '#4a0a2a' });
  // số trận thắng mỗi đội
  const wy = 262;
  const cw = 240;
  TEAMS.forEach((def, i) => {
    const x = W / 2 + (i - 1.5) * (cw + 8);
    pill(x - cw / 2, wy - 26, cw, 52, 'rgba(255,255,255,0.88)', def.color, 4);
    outlined(ctx, `${def.no}. ${def.name}`, x - 30, wy + 1, { size: 26, color: def.dark, lw: 0, stroke: 'transparent' });
    outlined(ctx, `🏆 ${wins[i]}`, x + 66, wy + 1, { size: 24, color: '#7a4d00', lw: 0, stroke: 'transparent' });
  });
  if (golden && !celebrate) {
    const p = 1 + 0.05 * Math.sin(gameTime * 10);
    ctx.save();
    ctx.translate(W / 2, 318);
    ctx.scale(p, p);
    pill(-300, -22, 600, 44, '#ff3b30', '#ffe14d', 3);
    outlined(ctx, `⏰ GIỜ VÀNG · ĐIỂM x${config.goldenMult} · ĐỘI BÉT x${config.underdogMult}`, 0, 1, { size: 24, color: '#fff', lw: 5, stroke: '#6a0000' });
    ctx.restore();
  }
  ctx.restore();
}

function drawBottom() {
  const y0 = LANE_TOP + LANE_H * 4 + 14;
  // bảng tin
  feed.forEach((f, i) => {
    const y = y0 + 22 + i * 46;
    const a = clamp(1 - (now - f.t0 - 15000) / 2000, 0, 1);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a * (i === 0 ? 1 : 0.85);
    ctx.font = `800 26px ${FONT}`;
    const tw = Math.min(W - 60, ctx.measureText(f.text).width + 40);
    pill(30, y - 21, tw, 42, 'rgba(0,0,0,0.5)', f.color, 2);
    ctx.fillStyle = f.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.text, 50, y + 1, W - 100);
    ctx.restore();
  });
  if (config.showRules === false) return;
  const rules = (Array.isArray(config.rules) ? config.rules : DEFAULTS.rules).slice(0, 6);
  const rh = 34 + rules.length * 36;
  const ry = H - rh - 24;
  rr(ctx, 24, ry, W - 48, rh, 22);
  ctx.fillStyle = 'rgba(10,30,15,0.78)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffe14d';
  ctx.stroke();
  pill(W / 2 - 110, ry - 20, 220, 40, '#ffe14d', '#7a2e00', 3);
  outlined(ctx, 'LUẬT CHƠI', W / 2, ry + 1, { size: 24, color: '#7a2e00', lw: 0, stroke: 'transparent' });
  rules.forEach((r, i) => {
    ctx.font = `700 26px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`• ${fill(r)}`, 48, ry + 40 + i * 36, W - 96);
  });
}

function drawBanner() {
  if (!bigBanner || now > bigBanner.until) return;
  const b = bigBanner;
  const k = (now - b.t0) / (b.until - b.t0);
  const s = k < 0.12 ? 0.6 + (k / 0.12) * 0.4 : 1;
  const a = k > 0.85 ? (1 - k) / 0.15 : 1;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(W / 2, 880);
  ctx.scale(s, s);
  rr(ctx, -470, -90, 940, 180, 40);
  ctx.fillStyle = 'rgba(20,10,40,0.82)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = b.color;
  ctx.stroke();
  outlined(ctx, b.text, 0, -28, { size: 62, color: b.color, lw: 10, maxW: 900 });
  outlined(ctx, b.sub || '', 0, 46, { size: 30, color: '#fff', lw: 6, maxW: 900 });
  ctx.restore();
}

function drawCelebration() {
  if (!celebrate) return;
  const tt = (now - celebrate.t0) / 1000;
  if (tt < 2.2) return; // cún gặm xương ở vạch đích trước
  const team = celebrate.team;
  const def = team.def;
  const a = clamp((tt - 2.2) / 0.5, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(10,5,25,0.78)';
  ctx.fillRect(0, 0, W, H);
  // tia sáng
  ctx.save();
  ctx.translate(W / 2, 900);
  ctx.rotate(gameTime * 0.4);
  for (let i = 0; i < 14; i++) {
    ctx.rotate(TAU / 14);
    ctx.fillStyle = i % 2 ? 'rgba(255,220,90,0.16)' : 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-90, -1100);
    ctx.lineTo(90, -1100);
    ctx.fill();
  }
  ctx.restore();
  outlined(ctx, '🏆 VÔ ĐỊCH 🏆', W / 2, 330, { size: 70, color: '#ffe14d', stroke: '#7a2e00', lw: 12 });
  outlined(ctx, `ĐỘI ${def.no} · CÚN ${def.name.toUpperCase()}`, W / 2, 420, { size: 64, color: def.color, stroke: '#fff', lw: 10 });
  outlined(ctx, 'được gặm Khúc Xương Vàng!', W / 2, 490, { size: 36, color: '#fff', lw: 7 });
  // cún thắng to giữa màn hình
  const S = 380;
  const pose = { time: gameTime, run: 0, phase: 0, action: 'dance', k: (gameTime % 2) / 2 };
  if (IMG.bone) ctx.drawImage(IMG.bone, W / 2 + 120, 840, 200, 200);
  drawOneDog(team, W / 2 - 60, 1180, S, pose);
  // MVP
  const list = celebrate.mvp;
  outlined(ctx, list.length ? 'NGƯỜI GÓP CÔNG NHIỀU NHẤT' : 'Cảm ơn cả phòng đã chơi!', W / 2, 1270, { size: 34, color: '#ffe14d', lw: 7 });
  list.forEach((u, i) => {
    const y = 1340 + i * 76;
    pill(W / 2 - 330, y - 32, 660, 64, i === 0 ? 'rgba(255,210,60,0.9)' : 'rgba(255,255,255,0.18)', '#fff', 2);
    outlined(ctx, ['🥇', '🥈', '🥉'][i], W / 2 - 290, y + 1, { size: 36, lw: 0, stroke: 'transparent' });
    drawAvatar(W / 2 - 225, y, 25, u, def.color, '#fff', 3);
    ctx.font = `800 32px ${FONT}`;
    ctx.fillStyle = i === 0 ? '#4a2a00' : '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(truncate(u.name, 18), W / 2 - 185, y + 1);
    ctx.textAlign = 'right';
    ctx.fillText(`${fmt(u.points)} điểm`, W / 2 + 310, y + 1);
  });
  const st = celebrate.stylist;
  if (st) {
    const y = 1340 + Math.max(1, list.length) * 76 + 30;
    outlined(ctx, `👗 NHÀ TẠO MẪU: ${truncate(st.name, 18)} (${st.items} món)`, W / 2, y, { size: 32, color: '#ff9bd0', lw: 7 });
  }
  const nextIn = Math.max(0, Math.ceil(config.celebrateSeconds - tt));
  outlined(ctx, `Vòng mới sau ${nextIn} giây · comment 1-4 để chọn đội`, W / 2, H - 120, { size: 30, color: '#fff', lw: 6 });
  ctx.restore();
}

let audioBlocked = false;
let last = 0;
function frame(t) {
  const dtReal = Math.min(0.05, (t - last) / 1000 || 0);
  last = t;
  const dt = dtReal * SPEED;
  now += dt * 1000;
  gameTime += dt;
  update(dt);
  ctx.save();
  if (shake > 0) ctx.translate(Math.sin(now / 23) * 14 * shake, Math.cos(now / 29) * 9 * shake);
  ctx.drawImage(bgCanvas, 0, 0);
  drawGoldenBone(ctx, BONE_X, LANE_TOP + LANE_H * 2, LANE_H * 4 - 70, gameTime, 36);
  for (const team of teams) drawLane(team);
  drawFloats();
  drawParticles();
  ctx.restore();
  drawHud();
  drawBottom();
  drawBanner();
  drawCelebration();
  if (celebrate) drawParticles();
  if (audioBlocked) {
    pill(W / 2 - 260, 1460, 520, 70, 'rgba(0,0,0,0.75)', '#ffd34d');
    outlined(ctx, '🔇 Bấm vào game để bật tiếng', W / 2, 1496, { size: 30, color: '#ffd34d', lw: 0, stroke: 'transparent' });
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ kết nối
function connectWs() {
  if (location.protocol === 'file:') return;
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onmessage = (e) => {
    try {
      handleEvent(JSON.parse(e.data));
    } catch (err) {
      console.warn(err);
    }
  };
  ws.onclose = () => setTimeout(connectWs, 2000);
}

async function boot() {
  try {
    const res = await fetch('/doi-cun-config.json', { cache: 'no-store' });
    if (res.ok) config = { ...structuredClone(DEFAULTS), ...(await res.json()) };
  } catch {
    /* chạy không có máy chủ */
  }
  config.messages = { ...DEFAULTS.messages, ...(config.messages || {}) };
  const dir = String(config.imageFolder || 'assets/doi-cun').replace(/\/$/, '');
  let have = null;
  try {
    const r = await fetch('/doi-cun-images.json', { cache: 'no-store' });
    if (r.ok && dir === 'assets/doi-cun') have = new Set((await r.json()).map((f) => f.toLowerCase()));
  } catch {
    /* không có máy chủ */
  }
  // ảnh riêng (nếu có, nền xanh #00FF00 tự xoá), không có thì dùng ảnh emoji có sẵn
  const own = async (...names) => {
    for (const n of names) {
      if (have && !have.has(n.toLowerCase())) continue;
      const img = await loadImage(`${dir}/${n}`);
      if (img) return /\.jpe?g$/i.test(n) ? img : chromaKey(img);
    }
    return null;
  };
  const useOwn = params.get('img') !== '0';
  IMG.bg = useOwn ? await own('nen.jpg', 'nen.png') : null;
  bgCanvas.width = W;
  bgCanvas.height = H;
  const bgx = bgCanvas.getContext('2d');
  if (IMG.bg) bgx.drawImage(IMG.bg, 0, 0, W, H);
  drawBackground(bgx, Boolean(IMG.bg));
  IMG.box = (useOwn && (await own('hop-qua.png', 'hop-qua.webp'))) || (await loadImage(`${dir}/fluent/wrapped_gift.png`));
  IMG.bone = (useOwn && (await own('xuong-vang.png'))) || (await loadImage(`${dir}/fluent/bone.png`));
  IMG.paw = await loadImage(`${dir}/fluent/paw_prints.png`);
  await Promise.all(ITEMS.map(async (it) => {
    let img = useOwn ? await own(`do-${it.id}.png`, `do-${it.id}.webp`) : null;
    if (!img && it.icon) img = await loadImage(`${dir}/${it.icon}`);
    if (img) IMG.items[it.id] = img;
  }));
  if (params.get('sound') === '0') config.sound = false;
  if (params.get('voice') === '0') config.voice = false;
  if (params.get('music') === '0') config.music = false;
  sfx.setSoundEnabled(config.sound !== false);
  voice.setSoundEnabled(config.sound !== false);
  voice.setVoiceEnabled(config.voice !== false);
  voice.setVoiceEngine(params.get('engine') || config.voiceEngine);
  voice.setPreferredVoice(config.ttsVoice);
  voice.setOnSpeakStart((text) => sfx.duck(Math.min(12000, 900 + String(text).length * 70)));
  let files = Array.isArray(config.musicFiles) ? config.musicFiles.filter(Boolean) : [];
  try {
    const r = await fetch('/doi-cun-music.json', { cache: 'no-store' });
    if (r.ok) files = [...(await r.json()), ...files];
  } catch {
    /* không có máy chủ */
  }
  const startAudio = () => {
    if (config.sound === false || config.music === false) return;
    sfx.startMusic({ files, volume: Number(config.musicVolume ?? 0.3) });
  };
  startAudio();
  window.addEventListener('pointerdown', () => {
    sfx.unlockAudio();
    voice.unlockAudio();
    startAudio();
  });
  setInterval(() => {
    audioBlocked = config.sound !== false && config.music !== false && !sfx.musicAudible();
    if (audioBlocked) {
      sfx.unlockAudio();
      startAudio();
    }
  }, 3000);
  newRound(false);
  connectWs();
  requestAnimationFrame((t) => {
    last = t;
    requestAnimationFrame(frame);
  });
}

window.__doiCun = {
  handleEvent,
  config: () => config,
  teams,
  users,
  state: () => ({
    round, golden, celebrate: Boolean(celebrate), winner: celebrate?.team.def.name, likes: totalLikes,
    left: Math.round(config.roundSeconds - (now - roundStart) / 1000),
    teams: teams.map((t) => ({
      name: t.def.name, pos: Math.round(t.pos), members: membersOf(t.i), anger: t.anger, rage: now < t.rageUntil,
      full: now < t.fullUntil, outfit: SLOTS.map((s) => t.outfit[s]?.item.name || '-').join(','), queue: t.boxQueue.length,
    })),
  }),
  dress: (ti, setId) => {
    for (const it of ITEMS.filter((x) => x.set === setId)) teams[ti].outfit[it.slot] = { item: it, by: null };
  },
};
boot();
