// Đường dẫn màn hình game + file .bat của từng game (dùng cho 2 bài hướng dẫn LIVE và nút ở từng game).
// Dùng chung cho máy chủ (lib/seo.js) và trình duyệt (common.js).
export const GUIDE_LIVE_NET = '/huong-dan/livestream-game-net-cang';
export const GUIDE_NODEJS = '/huong-dan/cai-nodejs-chay-game';

const SPECIAL = {
  'chanh-dien': { page: 'game.html', run: 'run.bat', win: 'mo-cua-so-game.bat', folder: 'ChanhDien' },
  'quan-bar': { page: 'bar.html', run: 'run-bar.bat', win: 'mo-cua-so-bar.bat', folder: 'QuanBar' },
};
const FOLDER = { 'tra-da': 'TraDa', 'cau-ca': 'CauCa', 'rong-ran': 'RongRan', 'dai-chien': 'DaiChien', 'bia-hoi': 'BiaHoi', 'dam-cuoi': 'DamCuoi', tarot: 'BoiTarot', 'duoi-hinh': 'DuoiHinh', 'leo-nui': 'LeoNui', 'gieo-que': 'GieoQue', 'lop-hoc': 'LopHoc', 'go-bom': 'GoBom' };

export function liveInfo(id) {
  const sp = SPECIAL[id];
  const page = sp ? sp.page : `${id}.html`;
  return {
    url: `http://127.0.0.1:3000/${page}`,
    control: `http://127.0.0.1:3000/${page === 'game.html' ? 'control.html' : page.replace('.html', '-control.html')}`,
    run: sp ? sp.run : `run-${id}.bat`,
    win: sp ? sp.win : `mo-cua-so-${id}.bat`,
    folder: sp ? sp.folder : (FOLDER[id] || 'TenGame'),
  };
}

// Dòng hướng dẫn cũ "Thêm nguồn > Chụp cửa sổ" đổi thành cách Liên kết (nét hơn), không cần sửa dữ liệu đã lưu
export function liveStepText(id, line) {
  if (/^\d+[.)]\s*Bấm đúp mo-cua-so[^ ]*\.bat để mở cửa sổ game[^.]*\.?\s*$/i.test(line)) {
    return line.replace(/Bấm đúp.*$/, 'Muốn xem thử game trên máy: bấm đúp ' + liveInfo(id).win + '. Khi LIVE bằng cách Liên kết (bước sau) thì đóng cửa sổ này lại để không bị lặp tiếng.');
  }
  if (!/Chụp cửa sổ/i.test(line)) return line;
  const u = liveInfo(id).url;
  return line.replace(/(Bấm đúp [^ ]+ để mở cửa sổ game[^,.]*[,.] ?(rồi )?)?(t|T)rong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ (game|đó)\.?/,
    `Trong TikTok LIVE Studio: Thêm nguồn > Liên kết > dán ${u} > bật "Độ phân giải tùy chỉnh" 1080 x 1920 và "Bật âm thanh" > Áp dụng (hình ảnh nét hơn, không viền đen).`)
    .replace(/ ?Nếu không nghe (tiếng|nhạc), bấm chuột vào cửa sổ game một lần\.?/, ' Không nghe tiếng thì mở lại nguồn Liên kết, kiểm tra đã bật "Bật âm thanh".');
}

// Tách hướng dẫn của 1 game thành 2 phần: "Cách cài đặt" và "Hướng dẫn chơi" (chỉ đổi cách hiển thị, dữ liệu giữ nguyên)
const INSTALL = [
  [/Cài Node\.js/i, '🖥️ Cài Node.js', 'node'],
  [/Giải nén/i, '📦 Giải nén game'],
  [/^Bấm đúp run[^ ]*\.bat/i, '▶️ Chạy game'],
  [/trang Kích hoạt/i, '🔑 Kích hoạt key'],
  [/^Ở Bảng điều khiển/i, '🧪 Thử game & kết nối TikTok'],
  [/Liên kết > dán|Chụp cửa sổ/i, '📺 Đưa game lên TikTok LIVE Studio', 'net'],
  [/^Đổi máy tính/i, '💻 Đổi máy tính'],
];
const CUSTOM = /sửa config|NHỮNG CHỖ BẠN TỰ ĐỔI|chép MP3|^Nhạc:|^Ảnh màn LED|^Muốn dùng ảnh/i;
const NOTE = /^(Lưu ý:|Hình emoji 3D)/i;

export function splitGuide(g) {
  const install = [], play = [], custom = [], notes = [];
  let last = null;
  for (const raw of String(g.guide || '').split('\n')) {
    const t = raw.trim();
    if (!t) continue;
    if (/^[•\-–]\s*/.test(t) && last) { last.subs.push(t.replace(/^[•\-–]\s*/, '')); continue; }
    if (/^\d+[.)]\s*Bấm đúp mo-cua-so[^ ]*\.bat để mở cửa sổ game[^.]*\.?\s*$/i.test(t)) continue; // đã thay bằng cách Liên kết
    const line = liveStepText(g.id, t).replace(/^\d+[.)]\s*/, '');
    const hit = INSTALL.find(([re]) => re.test(line));
    const item = { text: line.replace(/^Đổi máy tính:\s*(.)/i, (m, c) => c.toUpperCase()).replace(/^NHỮNG CHỖ BẠN TỰ ĐỔI ĐƯỢC\s*\((?:xem thêm )?([^)]*)\):?\s*(.*)$/, (m, f, r) => r ? `${r.charAt(0).toUpperCase()}${r.slice(1)} (Xem thêm ${f}.)` : `Xem thêm ${f}.`), subs: [] };
    if (hit) { item.title = hit[1]; item.link = hit[2]; install.push(item); }
    else if (NOTE.test(line)) notes.push(item);
    else if (CUSTOM.test(line)) custom.push(item);
    else play.push(item);
    last = item;
  }
  return { install, play, custom, notes };
}

export function guideSplitHtml(g, esc) {
  const { install, play, custom, notes } = splitGuide(g);
  const q = `?game=${encodeURIComponent(g.id)}`;
  const art = { node: [GUIDE_NODEJS, 'Xem hướng dẫn có hình'], net: [GUIDE_LIVE_NET, 'Xem hướng dẫn có hình + LIVE nét 1080p'] };
  // In đậm phần đầu câu (trước dấu ":" hoặc câu đầu) để dễ đọc lướt
  const lead = (s) => {
    const m = s.match(/^([^:.]{3,60}):\s*(.*)$/) || s.match(/^([^.]{8,90}\.)\s+(.*)$/);
    return m ? `<b>${esc(m[1])}${s.charAt(m[1].length) === ':' ? ':' : ''}</b> ${esc(m[2])}` : esc(s);
  };
  const subs = (it) => it.subs.length ? `<ul>${it.subs.map(x => `<li>${lead(x)}</li>`).join('')}</ul>` : '';
  const steps = install.map(it => `<li><b class="gs-t">${esc(it.title)}</b><span>${esc(it.text)}${it.link ? ` <a href="${art[it.link][0]}${q}">${art[it.link][1]} ›</a>` : ''}</span>${subs(it)}</li>`).join('');
  const cards = (list) => list.map(it => `<li>${lead(it.text)}${subs(it)}</li>`).join('');
  return `<div class="gsplit">
    <div class="gs-part"><h3>Phần 1 · Cách cài đặt</h3><ol class="gs-steps">${steps}</ol></div>
    ${play.length ? `<div class="gs-part"><h3>Phần 2 · Hướng dẫn chơi</h3><ul class="gs-cards">${cards(play)}</ul>
      ${custom.length ? `<h4>⚙️ Tự đổi theo ý bạn</h4><ul class="gs-cards soft">${cards(custom)}</ul>` : ''}
      ${notes.length ? `<p class="gs-note">${notes.map(n => esc(n.text)).join('<br>')}</p>` : ''}</div>` : ''}
  </div>`;
}
