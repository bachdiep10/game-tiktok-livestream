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

export const GUIDE_CAU_CA = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\CauCa. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-cau-ca.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập ("1" giun, "2" cơm nắm, thủy quái...) để thử. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Người xem gõ số để câu: 1 giun (rô, diếc), 2 cơm nắm (chép, mè), 3 ngô (trắm cỏ), 4 tôm (cá lóc), 5 mồi tanh (trê, lươn), 6 nướng cá ăn hồi sức, 7 đốt lửa sưởi đêm. Gõ "trái" hoặc "phải" để chọn bến thi đấu. Thả tim cho cá cắn nhanh, chia sẻ để con cá tới to gấp đôi. Quà nhỏ thả thính cả bến, quà từ 10 xu quăng lưới chia cá, quà từ 100 xu gọi thủy quái. Thủy quái tự lên mỗi 10 phút, cả live thả tim để kéo.
7. Nhạc riêng (nếu muốn): chép MP3 vào public\\assets\\nhac-cau-ca. Đổi thời gian trận đấu, loại cá, từ khoá lệnh: sửa config-cau-ca.json.
8. Bấm đúp mo-cua-so-cau-ca.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_RONG_RAN = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\RongRan. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-rong-ran.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập ("rồng rắn", "khúc đuôi", "Đuổi bắt ngay"...) để thử. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Người xem vào LIVE là nắm vai nhau nối thành đuôi rồng. Mỗi ván rồng dạo sân, hỏi thầy thuốc, rồi thầy thuốc đuổi bắt khúc đuôi: thả tim càng nhiều rồng chạy càng nhanh. Bình luận: rồng rắn, lúc lắc, chạy mau, bảo vệ, xin lửa, khúc đầu, khúc giữa, khúc đuôi, chuộc. Quà nhỏ có bùa hộ mệnh, quà từ 10 xu làm thầy thuốc trượt ngã, quà từ 100 xu làm đầu rồng và cả rồng bay lên mây.
7. Nhạc riêng (nếu muốn): chép MP3 vào public\\assets\\nhac-rong-ran. Đổi thời gian ván, tốc độ, câu thoại: sửa config-rong-ran.json.
8. Bấm đúp mo-cua-so-rong-ran.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_DAI_CHIEN = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\DaiChien. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-dai-chien.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập ("1" theo Sơn Tinh, "2" theo Thủy Tinh, quà 299 xu...) để thử. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Người xem gõ 1 = theo Sơn Tinh (phe Núi), gõ 2 = theo Thủy Tinh (phe Nước), ai không chọn vào phe ít người. Mỗi người có một chiến binh mang tên mình. Trang bị: gõ 3 cung tên, 4 kiếm, 5 giáo. Gõ 6 khiên, 7 hồi máu, 8 đánh trống, đủ khí thế thì cả phe tổng tấn công. Cứ 10 tim là 1 lính rơi xuống trận. Theo dõi được phong tướng (nhân vật to hẳn lên). Chia sẻ: Sơn Tinh gọi voi chiến, Thủy Tinh gọi rắn biển. Quà nhỏ: Sơn Tinh gọi đại bàng, Thủy Tinh gọi rùa thần. Quà từ 10 xu gọi voi chúa hoặc rắn biển khổng lồ, quà từ 100 xu thì Sơn Tinh hoặc Thủy Tinh hiện thân. Phá được thành địch, hoặc hết giờ thành còn nhiều máu hơn thì thắng.
7. Nhạc riêng (nếu muốn): chép MP3 vào public\\assets\\nhac-dai-chien. Đổi thời gian ván, máu thành, số tim ra lính: sửa config-dai-chien.json.
8. Bấm đúp mo-cua-so-dai-chien.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
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
  {
    id: 'cau-ca', name: 'Bến Câu Sinh Tồn',
    tagline: 'Người xem ngồi câu cá, hai bến thi nhau, cả live kéo thủy quái',
    description: 'Người xem vào LIVE thành người ngồi câu trên hai bến gỗ. Gõ số 1 đến 5 để chọn mồi, mồi nào ra cá nấy. Thả tim cho cá cắn nhanh, chia sẻ để cá to gấp đôi. Thể lực tụt dần nên phải nướng cá ăn, đốt lửa sưởi ban đêm. Hai bến thi nhau ai câu nặng hơn, mỗi 10 phút thủy quái nổi lên để cả live cùng thả tim kéo.',
    features: ['Gõ số 1–7 dễ chơi trên điện thoại', 'Đấu 2 bến mỗi 5 phút', 'Thủy quái: cả live thả tim kéo', 'Ngày đêm, mưa, sinh tồn', 'Nhạc sáo trúc tự tạo + giọng AI'],
    image: '/media/cau-ca.jpg', video: '/media/cau-ca.mp4', download: '', version: '2.1.0',
    guide: GUIDE_CAU_CA, guideVideo: '',
    visible: false, order: 4, isNew: true,
  },
  {
    id: 'rong-ran', name: 'Rồng Rắn Lên Mây',
    tagline: 'Người xem nối đuôi thành rồng, chạy trốn ông thầy thuốc',
    description: 'Trò chơi dân gian ở sân đình: người xem vào LIVE là nắm vai nhau nối thành đuôi rồng. Mỗi ván rồng hát "Rồng rắn lên mây", hỏi thầy thuốc xin khúc đầu, khúc giữa, khúc đuôi, rồi thầy thuốc đuổi bắt khúc đuôi. Thả tim để rồng chạy nhanh, tặng quà để có bùa hộ mệnh, làm đầu rồng và bay lên mây.',
    features: ['Ván chơi tự chạy, có đuổi bắt hồi hộp', 'Thả tim = rồng chạy nhanh', 'Quà = bùa hộ mệnh, đầu rồng, rồng vàng bay lên mây', 'Giọng đọc AI tiếng Việt', 'Nhạc sáo trúc + trống hội tự tạo'],
    image: '/media/rong-ran.jpg', video: '/media/rong-ran.mp4', download: '', version: '2.1.0',
    guide: GUIDE_RONG_RAN, guideVideo: '',
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 5, isNew: true,
  },
  {
    id: 'dai-chien', name: 'Sơn Tinh Thủy Tinh Đại Chiến',
    tagline: 'Người xem chia hai phe Núi và Nước, thả tim thả lính, tặng quà gọi thần',
    description: 'Trận chiến hai phe ngay trên LIVE: người xem gõ 1 theo Sơn Tinh, gõ 2 theo Thủy Tinh và có một chiến binh mang tên mình. Gõ số để cầm cung tên, kiếm, giáo, dựng khiên, hồi máu, đánh trống. Thả tim là thả lính từ trời xuống, chia sẻ gọi voi chiến hoặc rắn biển, quà gọi đại bàng, rùa thần, quà lớn thì Sơn Tinh hoặc Thủy Tinh hiện thân. Phá thành địch để thắng, cuối ván vinh danh mãnh tướng.',
    features: ['Hai phe đối đầu, ván 4 phút tự chạy', 'Gõ số 1–8 ra lệnh dễ trên điện thoại', 'Cung tên, kiếm, giáo, phong tướng', 'Chia sẻ = voi / rắn biển, quà = đại bàng, rùa, thần hiện thân', 'Nhạc trống trận tự tạo + giọng MC AI'],
    image: '/media/dai-chien.jpg', video: '/media/dai-chien.mp4', download: '', version: '2.2.0',
    guide: GUIDE_DAI_CHIEN, guideVideo: '',
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 6, isNew: true,
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
  // Thông tin người bán (hiện ở chân trang và các trang chính sách)
  sellerName: '', sellerEmail: '', sellerAddress: '', sellerTaxId: '', refundDays: 7,
  // Chuyển khoản thủ công (dùng khi chưa cài PayOS): mã ngân hàng theo VietQR, ví dụ "MB", "VCB", "TCB"
  bankCode: '', bankAccount: '', bankOwner: '',
  // PayOS: lấy ở my.payos.vn > Kênh thanh toán
  payosClientId: '', payosApiKey: '', payosChecksumKey: '',
  // Tự xác nhận chuyển khoản bằng email biến động số dư (ACB...) qua IMAP
  imapEnabled: 0, imapHost: 'imap.gmail.com', imapPort: 993, imapUser: '', imapPass: '', imapFolder: 'INBOX', imapFrom: 'acb.com.vn',
  publicUrl: '',
  moveLimit: 3, moveWindowDays: 30,
  offlineDays: 3,
  guideUrl: '',
};

// Lấy khối JSON hoàn chỉnh đầu tiên trong chuỗi (bỏ phần rác dính phía sau)
function firstJsonObject(text) {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

// Đọc db.json; nếu file hỏng (vd. 2 tiến trình cùng ghi khi khởi động lại) thì giữ bản hỏng làm bản sao
// rồi cứu phần JSON hoàn chỉnh, hoặc dùng bản dự phòng db.json.bak. Không bao giờ ghi đè dữ liệu mà không giữ bản sao.
function loadJsonSafe(file) {
  const text = fs.readFileSync(file, 'utf8');
  try { return JSON.parse(text); } catch (e) {
    const copy = `${file}.hong-${Date.now()}`;
    fs.copyFileSync(file, copy);
    console.error(`[dữ liệu] db.json bị hỏng (${e.message}). Đã giữ bản sao: ${copy}`);
    const candidates = [];
    const head = firstJsonObject(text);
    if (head) candidates.push(['phần đầu của db.json', head]);
    if (fs.existsSync(file + '.bak')) candidates.push(['db.json.bak', fs.readFileSync(file + '.bak', 'utf8')]);
    for (const [name, t] of candidates) {
      try {
        const data = JSON.parse(t);
        if (data && typeof data === 'object' && (data.settings || data.orders || data.admin)) {
          console.error(`[dữ liệu] Đã khôi phục từ ${name}.`);
          return data;
        }
      } catch { /* thử nguồn tiếp theo */ }
    }
    throw new Error(`db.json bị hỏng và không tự khôi phục được. Bản sao ở ${copy}`);
  }
}

function normalize(data) {
  const d = {
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
    plans: data.plans || structuredClone(DEFAULT_PLANS),
    games: data.games || structuredClone(DEFAULT_GAMES).map(g => ({ ...g, createdAt: Date.now() })),
    faq: data.faq || structuredClone(DEFAULT_FAQ),
    orders: data.orders || [],
    licenses: data.licenses || [],
    users: data.users || [],
    bankTxns: data.bankTxns || [],
    bank: data.bank || { state: {}, lastRun: 0, lastError: '' },
    admin: data.admin || { passwordHash: '', salt: '' },
    secret: data.secret || '',
    seq: data.seq || 0,
    seededGames: data.seededGames || (data.games ? data.games.map(g => g.id) : DEFAULT_GAMES.map(g => g.id)),
  };
  // Game mặc định mới ra (vd. Trà Đá Vỉa Hè) được thêm sẵn ở trạng thái ẩn vào dữ liệu cũ.
  // Quản trị tải file game lên rồi bật "Hiện" là key combo còn suất tự nhận game.
  // Game đã từng thêm rồi bị xoá thì không thêm lại.
  for (const def of DEFAULT_GAMES) {
    if (d.seededGames.includes(def.id)) continue;
    d.seededGames.push(def.id);
    if (d.games.some(g => g.id === def.id)) continue;
    d.games.push({ ...structuredClone(def), visible: false, createdAt: Date.now() });
  }
  // Bổ sung hướng dẫn mặc định cho game có sẵn (dữ liệu tạo từ bản cũ)
  for (const g of d.games) {
    const def = DEFAULT_GAMES.find(x => x.id === g.id);
    if (def && g.guide === undefined) { g.guide = def.guide; g.version = g.version || def.version; g.guideVideo = g.guideVideo || ''; }
  }
  return d;
}

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Dữ liệu dùng chung giữa nhiều tiến trình Node (Hostinger có thể chạy vài tiến trình cùng lúc hoặc chồng nhau khi
// triển khai lại). Mỗi yêu cầu giữ khoá (giữa các tiến trình) trong lúc xử lý: nạp lại file nếu tiến trình khác vừa ghi,
// sửa dữ liệu, ghi ngay, rồi nhả khoá. Nhờ vậy hai tiến trình không ghi đè mất dữ liệu của nhau.
export class DB {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'db.json');
    this.lockDir = this.file + '.lock';
    fs.mkdirSync(dir, { recursive: true });
    this.mtime = '';
    this.held = false;
    this._queue = Promise.resolve();
    this.withLockSync(() => {
      const data = fs.existsSync(this.file) ? loadJsonSafe(this.file) : {};
      this.data = normalize(data);
      this.write();
    });
  }
  _tryLock() {
    try { fs.mkdirSync(this.lockDir); return true; } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // khoá bỏ quên (tiến trình chết giữa chừng) quá 15 giây thì gỡ
      try { if (Date.now() - fs.statSync(this.lockDir).mtimeMs > 15000) fs.rmdirSync(this.lockDir); } catch { /* bỏ qua */ }
      return false;
    }
  }
  _unlock() {
    clearInterval(this._beat);
    this.held = false;
    try { fs.rmdirSync(this.lockDir); } catch { /* đã bị gỡ */ }
  }
  _hold() {
    this.held = true;
    // giữ khoá lâu (vd. tải file game lên) thì làm mới thời gian để tiến trình khác không coi là bỏ quên
    this._beat = setInterval(() => { const t = new Date(); try { fs.utimesSync(this.lockDir, t, t); } catch { /* bỏ qua */ } }, 3000);
    this._beat.unref?.();
    this.refresh();
  }
  // Khoá bất đồng bộ: trong 1 tiến trình xếp hàng lần lượt, giữa các tiến trình dùng thư mục khoá. Trả về hàm nhả khoá.
  acquire() {
    let release;
    const mine = new Promise(r => { release = r; });
    const prev = this._queue;
    this._queue = prev.then(() => mine);
    return prev.then(async () => {
      for (let i = 0; !this._tryLock(); i++) {
        if (i > 500) break; // chờ tối đa ~10 giây rồi vẫn làm, tránh treo web
        await new Promise(r => setTimeout(r, 20));
      }
      this._hold();
      let done = false;
      return () => { if (done) return; done = true; this._unlock(); release(); };
    });
  }
  withLockSync(fn) {
    const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    for (let i = 0; !this._tryLock() && i < 500; i++) sleep(20);
    try { return fn(); } finally { clearInterval(this._beat); try { fs.rmdirSync(this.lockDir); } catch { /* bỏ qua */ } }
  }
  fileMtime() { try { const st = fs.statSync(this.file); return `${st.mtimeMs}:${st.size}:${st.ino}`; } catch { return ''; } }
  // Tiến trình khác đã ghi thì nạp lại (giữ nguyên đối tượng this.data)
  refresh() {
    const m = this.fileMtime();
    if (!m || m === this.mtime) return false;
    try {
      const fresh = normalize(JSON.parse(fs.readFileSync(this.file, 'utf8')));
      for (const k of Object.keys(this.data)) if (!(k in fresh)) delete this.data[k];
      Object.assign(this.data, fresh);
      this.mtime = m;
      return true;
    } catch { return false; }
  }
  save() { this.saveNow(); }
  saveNow() {
    if (this.held) return this.write();
    this.withLockSync(() => this.write());
  }
  write() {
    // Tên file tạm riêng cho từng tiến trình, giữ db.json.bak trước mỗi lần ghi
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 1));
    try { if (fs.existsSync(this.file)) fs.copyFileSync(this.file, this.file + '.bak'); } catch { /* bỏ qua */ }
    fs.renameSync(tmp, this.file);
    this.mtime = this.fileMtime();
  }
}
