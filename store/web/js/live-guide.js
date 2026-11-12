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
