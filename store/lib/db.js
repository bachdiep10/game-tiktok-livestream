// Kho dữ liệu đơn giản: một file JSON (data/db.json), ghi an toàn (ghi file tạm rồi đổi tên).
// Đủ cho vài nghìn đơn hàng. Muốn lớn hơn thì thay bằng MySQL/Postgres, giữ nguyên các hàm bên dưới.
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PLANS = [
  {
    id: 'le', name: 'Gói Lẻ', price: 89000, slots: 1, allGames: false,
    highlight: false, badge: '',
    subtitle: '1 game tự chọn, dùng trọn đời',
    features: [
      '1 game tự chọn',
      'Dùng trọn đời trên 1 máy tính',
      'Kết nối TikTok LIVE thật',
      'Hướng dẫn cài đặt bằng video',
    ],
  },
  {
    id: 'combo', name: 'Gói Combo', price: 229000, slots: 3, allGames: false,
    highlight: true, badge: 'Phổ biến nhất',
    subtitle: '3 game, rẻ hơn mua lẻ',
    features: [
      'Chọn 3 game bất kỳ',
      'Dùng trọn đời trên 1 máy tính',
      'Đổi nền, nhạc, ảnh theo kênh của bạn',
      'Cập nhật bản mới miễn phí',
      'Chưa đủ 3 game? Game mới tự vào key',
    ],
  },
  {
    id: 'tron-bo', name: 'Gói Trọn Bộ', price: 649000, slots: 0, allGames: true,
    highlight: false, badge: 'Tất cả game',
    subtitle: 'Mọi game hiện có và sau này',
    features: [
      'Tất cả game đang có',
      'Mọi game mới ra sau này',
      'Cập nhật trọn đời',
      'Hỗ trợ cài đặt qua Zalo / UltraView',
      'Ưu tiên góp ý game mới',
    ],
  },
];

export const GUIDE_CHANH_DIEN = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\ChanhDien. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập để thử. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Bấm đúp mo-cua-so-game.bat để mở cửa sổ game (Microsoft Edge, khung dọc).
7. Trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ game.
8. Muốn dùng ảnh nền, tượng Phật, nhạc riêng: sửa file config.json (xem hướng dẫn trong thư mục public/assets).
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_QUAN_BAR = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\QuanBar. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-bar.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển quán bar: bấm các nút Giả lập để thử ("❤️ x30", "🎁 Quà 30 xu" đưa người lên sân khấu). Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Nhạc: chép file MP3 của bạn vào thư mục public\\assets\\nhac-bar (phát theo thứ tự tên file, lặp lại).
7. Ảnh màn LED: chép ảnh vào public\\assets\\anh-led.
8. Bấm đúp mo-cua-so-bar.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe nhạc, bấm chuột vào cửa sổ game một lần.
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_TRA_DA = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\TraDa. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-tra-da.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập ("trà đá", "điếu cày", "chém gió"...) để thử. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Người xem bình luận: trà đá, trà chanh, điếu cày, kẹo lạc, hướng dương, chém gió, cờ tướng, đọc báo, nóng quá, dzô, tính tiền. Quà nhỏ mời kẹo lạc, quà từ 10 xu bao cả quán, quà từ 100 xu lên ghế VIP. Đủ 5 lượt chia sẻ thì đội trật tự đến dẹp quán, thả tim dồn dập (300 tim/phút) thì chó dữ xông vào, một lúc sau quán mở lại.
7. Nhạc riêng (nếu muốn): chép MP3 vào public\\assets\\nhac-tra-da. Đổi câu chào, từ khoá lệnh: sửa config-tra-da.json.
8. Bấm đúp mo-cua-so-tra-da.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

const DEFAULT_GAMES = [
  {
    id: 'chanh-dien', name: 'Chánh Điện Lễ Phật',
    tagline: 'Người xem vào LIVE thành Phật tử quỳ lạy trong chánh điện',
    description: 'Mỗi người xem vào LIVE có một nhân vật mang tên mình quỳ trước tượng Phật. Thả tim thì nhân vật lạy, gõ mõ. Bình luận "Nam mô A Di Đà Phật" để lễ Phật. Tặng quà thì hoa sen nở, chuông chùa ngân, có giọng đọc cảm ơn.',
    features: ['Nhân vật mang tên người xem', 'Thả tim = lạy Phật + tiếng mõ', 'Quà = hoa sen, chuông, đài sen', 'Giọng đọc AI tiếng Việt', 'Nhạc thiền tự tạo'],
    image: '/media/chanh-dien.jpg', video: '/media/chanh-dien.mp4', download: '', version: '1.9.9',
    guide: GUIDE_CHANH_DIEN, guideVideo: '',
    visible: true, order: 1, isNew: false,
  },
  {
    id: 'quan-bar', name: 'Quán Bar Sôi Động',
    tagline: 'Người xem rơi xuống sàn nhảy, đua lên sân khấu VIP',
    description: 'Người xem vào LIVE rơi xuống sàn nhảy LED. Thả tim, bình luận, chia sẻ để tích điểm lên sân khấu VIP. Quà lớn kích hoạt "BÙNG NỔ" cả quán. Có DJ, bảng xếp hạng, MC đọc tên.',
    features: ['Sàn nhảy LED + sân khấu VIP', 'Tích điểm lên sân khấu', 'Thanh "BÙNG NỔ" khi nhiều quà', 'Màn LED chạy ảnh của bạn', 'Phát nhạc của bạn'],
    image: '/media/quan-bar.jpg', video: '/media/quan-bar.mp4', download: '', version: '1.9.9',
    guide: GUIDE_QUAN_BAR, guideVideo: '',
    visible: true, order: 2, isNew: true,
  },
  {
    id: 'tra-da', name: 'Trà Đá Vỉa Hè',
    tagline: 'Người xem ra quán trà đá: gọi trà, rít điếu cày, chém gió',
    description: 'Người xem vào LIVE thành khách ngồi ghế nhựa ở quán trà đá vỉa hè. Bình luận "trà đá", "điếu cày", "kẹo lạc" thì cô chủ quán mang ra tận nơi. Bình luận "chém gió" để tán chuyện với người bên cạnh, "cờ tướng" để làm một ván. Quà bao cả quán một chầu, quà lớn được ngồi ghế VIP.',
    features: ['11 lệnh bình luận vui nhộn', 'Chém gió, đánh cờ với người bên cạnh', 'Quà = bao cả quán, ghế VIP', 'Giọng cô chủ quán AI tiếng Việt', 'Nhạc guitar + tiếng phố tự tạo'],
    image: '/media/tra-da.jpg', video: '/media/tra-da.mp4', download: '', version: '2.0.1',
    guide: GUIDE_TRA_DA, guideVideo: '',
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 3, isNew: true,
  },
];

const DEFAULT_FAQ = [
  { q: 'Tôi không biết lập trình có dùng được không?', a: 'Được. Bạn chỉ cần tải về, bấm đúp file chạy, nhập key và tên kênh TikTok. Có video hướng dẫn từng bước.' },
  { q: 'Nên chọn gói nào?', a: 'Nếu mới thử, chọn Gói Lẻ. Nếu muốn đổi game theo ngày để LIVE không bị nhàm, Gói Combo là lựa chọn hời nhất. Nếu muốn có mọi game mới, chọn Gói Trọn Bộ.' },
  { q: 'Một key dùng được mấy máy?', a: 'Mỗi key chạy trên 1 máy tính tại một thời điểm. Đổi máy mới thì vào mục "Tra cứu & chuyển máy" để tự chuyển key sang máy mới.' },
  { q: 'Sau khi thanh toán tôi nhận game thế nào?', a: 'Thanh toán xong, key và link tải game hiện ngay, đồng thời được lưu trong mục Tài khoản của tôi. Đăng nhập bất cứ lúc nào để xem lại, tải lại game hoặc chuyển máy.' },
  { q: 'Máy tính cần cấu hình thế nào?', a: 'Windows 10/11, chip từ Core i3, RAM 8GB, có mạng ổn định. Dùng kèm TikTok LIVE Studio hoặc OBS.' },
  { q: 'Game có làm tài khoản TikTok bị khoá không?', a: 'Game chỉ đọc bình luận, tim, quà từ phiên LIVE của bạn để hiển thị, không đăng nhập hay thao tác thay bạn.' },
];

const DEFAULT_SETTINGS = {
  brandName: 'LiveGame Việt',
  tagline: 'Game tương tác cho TikTok LIVE',
  heroEyebrow: 'Kéo người xem ở lại - Tăng tim, tăng quà',
  heroTitle: 'Biến phiên LIVE thành trò chơi mà người xem cùng tham gia',
  heroSubtitle: 'Người xem vào LIVE là có nhân vật mang tên mình. Thả tim, bình luận, tặng quà đều hiện lên màn hình. Cài trên máy tính, chạy cùng TikTok LIVE Studio.',
  heroVideo: '/media/quan-bar.mp4',
  promo: 'Gói Combo rẻ hơn mua lẻ 3 game. Game mới ra hằng tháng.',
  contactZalo: '', contactFacebook: '', contactTiktok: '', contactPhone: '',
  // Chuyển khoản thủ công (dùng khi chưa cài PayOS): mã ngân hàng theo VietQR, ví dụ "MB", "VCB", "TCB"
  bankCode: '', bankAccount: '', bankOwner: '',
  // PayOS: lấy ở my.payos.vn > Kênh thanh toán
  payosClientId: '', payosApiKey: '', payosChecksumKey: '',
  publicUrl: '',
  moveLimit: 3, moveWindowDays: 30,
  offlineDays: 3,
  guideUrl: '',
};

export class DB {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'db.json');
    fs.mkdirSync(dir, { recursive: true });
    let data = {};
    if (fs.existsSync(this.file)) data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    this.data = {
      settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
      plans: data.plans || structuredClone(DEFAULT_PLANS),
      games: data.games || structuredClone(DEFAULT_GAMES).map(g => ({ ...g, createdAt: Date.now() })),
      faq: data.faq || structuredClone(DEFAULT_FAQ),
      orders: data.orders || [],
      licenses: data.licenses || [],
      users: data.users || [],
      admin: data.admin || { passwordHash: '', salt: '' },
      secret: data.secret || '',
      seq: data.seq || 0,
      seededGames: data.seededGames || (data.games ? data.games.map(g => g.id) : DEFAULT_GAMES.map(g => g.id)),
    };
    // Game mặc định mới ra (vd. Trà Đá Vỉa Hè) được thêm sẵn ở trạng thái ẩn vào dữ liệu cũ.
    // Quản trị tải file game lên rồi bật "Hiện" là key combo còn suất tự nhận game.
    // Game đã từng thêm rồi bị xoá thì không thêm lại.
    for (const def of DEFAULT_GAMES) {
      if (this.data.seededGames.includes(def.id)) continue;
      this.data.seededGames.push(def.id);
      if (this.data.games.some(g => g.id === def.id)) continue;
      this.data.games.push({ ...structuredClone(def), visible: false, createdAt: Date.now() });
    }
    // Bổ sung hướng dẫn mặc định cho game có sẵn (dữ liệu tạo từ bản cũ)
    for (const g of this.data.games) {
      const def = DEFAULT_GAMES.find(d => d.id === g.id);
      if (def && g.guide === undefined) { g.guide = def.guide; g.version = g.version || def.version; g.guideVideo = g.guideVideo || ''; }
    }
    this._timer = null;
    this.saveNow();
  }
  save() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.saveNow(), 200);
  }
  saveNow() {
    clearTimeout(this._timer);
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 1));
    fs.renameSync(tmp, this.file);
  }
}
