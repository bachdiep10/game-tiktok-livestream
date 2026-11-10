// Kho dữ liệu đơn giản: một file JSON (data/db.json), ghi an toàn (ghi file tạm rồi đổi tên).
// Đủ cho vài nghìn đơn hàng. Muốn lớn hơn thì thay bằng MySQL/Postgres, giữ nguyên các hàm bên dưới.
import fs from 'node:fs';
import path from 'node:path';
import { normalizeUpsell } from './upsell.js';

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

export const GUIDE_BIA_HOI = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\BiaHoi. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-bia-hoi.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập ("bia", "nem chua", "dzô"...) để thử. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Người xem bình luận: bia, nước ngọt (rót đồ uống); nem chua, lạc rang (gọi mồi); lên hát (cầm mic); chém gió (tán chuyện với người bên cạnh); bóng đá (xem bóng); nóng quá (quạt); dzô (cả bàn cụng ly); thêm két (két bia ra bàn); say rồi (mặt đỏ, chủ quán nhắc gọi xe về); phe bia hơi / phe bia chai (chọn phe kéo co); tính tiền (trả tiền ra về). Thả tim để rót bia. Quà nhỏ mời đĩa mồi, quà từ 10 xu bao cả quán, quà từ 100 xu lên ghế VIP.
7. Sự kiện tự động: đủ 5 lượt chia sẻ thì tổ tuần tra đến, khách vác ghế cầm cốc chạy rồi quay lại cụng ly; thả tim dồn dập thì chó xông vào quán; cứ khoảng 90 giây có thử thách cho cả quán.
8. Đổi tên quán, câu chào, từ khoá lệnh: sửa config-bia-hoi.json rồi bấm F5. Nhạc riêng (nếu muốn): chép MP3 vào public\\assets\\nhac-bia-hoi.
9. Bấm đúp mo-cua-so-bia-hoi.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
Lưu ý: game chỉ minh hoạ vui, không có nhãn hiệu bia thật. Đã uống rượu bia thì không lái xe.
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_DAM_CUOI = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\DamCuoi. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-dam-cuoi.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập ("chúc mừng", "hôn đi", "giữ lại"...) để thử, nút "Sang màn tiếp theo" để xem nhanh từng màn. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Người xem vào LIVE thành khách mời: đi qua cổng hoa, theo thảm đỏ vào ngồi bàn tiệc trong hội trường cưới.
7. Mỗi vòng khoảng 3 phút rưỡi, 7 màn, MC dẫn và lệnh của màn đang chạy sáng lên trên màn hình: 1. Đón khách → 2. Cô dâu chú rể tiến vào lễ đường (gõ "chúc mừng") → 3. Trao nhẫn (gõ "hôn đi", thả tim) → 4. Cắt bánh, rót tháp ly, cả rạp nâng ly (thả tim) → 5. Người yêu cũ đến giành cô dâu hoặc chú rể: "Sao em lại bỏ anh? Em phải lấy anh chứ!" (gõ "giữ lại" và thả tim để giữ) → 6. Ném hoa cưới (gõ "bắt hoa") → 7. Chụp ảnh kỷ niệm, tiễn khách (gõ "chụp ảnh"). Hết vòng lại đón khách mới.
8. Quà là phong bì mừng cưới bay vào hòm, tên người tặng lên Sổ vàng. Quà lớn thì pháo hoa, cô dâu chú rể cảm ơn và chụp ảnh chung. Tặng quà lúc người yêu cũ đang giành là giải cứu cô dâu chú rể ngay. Đủ 5 lượt chia sẻ thì bắn pháo giấy, thả tim dồn dập thì mưa tim.
9. Đổi tên cô dâu chú rể (groomName, brideName), số giây từng màn (phaseSeconds), từ khoá lệnh: sửa config-dam-cuoi.json rồi bấm F5. Nhạc riêng (nếu muốn): chép MP3 vào public\\assets\\nhac-dam-cuoi.
10. Bấm đúp mo-cua-so-dam-cuoi.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_TAROT = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\BoiTarot. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-tarot.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập (gõ "3", quà 1 xu, quà 299 xu...) để thử. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Người xem tặng quà bất kỳ để vào hàng chờ xem bói, quà càng lớn càng được xem sớm (quà từ 100 xu là VIP). Gõ 1 Công việc, 2 Tiền tài, 3 Tình duyên, 4 Học vấn để chọn chủ đề. Thả tim và chia sẻ được cộng điểm ưu tiên.
7. Mỗi lượt khoảng 45 giây: cô Nguyệt xào bài, trải 3 lá Gốc rễ, Hiện tại, Thời gian tới, đọc ý nghĩa và lời giải từng lá theo chủ đề, rồi lý giải chung. Vắng người thì bốc 1 lá cho cả phòng. Bộ bài 22 lá Ẩn Chính, có lá xuôi và lá ngược.
8. Đổi tên nhân vật, thời gian từng bước, quà nào ứng với chủ đề nào: sửa config-tarot.json rồi bấm F5. Thay ảnh nền, nhân vật, lá bài bằng ảnh riêng: chép vào public\\assets\\tarot (xem DAT-ANH-VAO-DAY.txt). Nhạc riêng: chép MP3 vào public\\assets\\nhac-tarot.
9. Bấm đúp mo-cua-so-tarot.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
Lưu ý: nội dung bói chỉ mang tính giải trí.
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_LEO_NUI = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\LeoNui. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-leo-nui.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập (thả tim, quà 1 xu, quà 299 xu, bão tuyết...) để thử, nút "Tự chạy demo" để xem cả đoàn leo. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Mỗi người xem vào LIVE là một nhà leo núi đứng ở trạm gốc 5.364 m, đua lên đỉnh Everest 8.849 m. Thả tim = leo lên (2 m mỗi tim), bình luận = 5 m, theo dõi +40 m, chia sẻ +60 m.
7. Quà = vọt lên và tăng tốc: quà nhỏ x1,5, từ 10 xu x2, từ 100 xu x3 kèm trực thăng cứu hộ chở lên. Màn hình có Top 3 độ cao, thanh độ cao bên phải có ảnh đại diện, số người xem, số tim, nhiệt độ, lời cảm ơn quà.
8. Thời tiết đổi liên tục: bão tuyết làm tim chỉ còn nửa sức (gõ "cố lên" để leo tiếp), sau bão có thể tuyết lở, ai đứng yên lâu sẽ trượt xuống. Ai lên đỉnh đầu tiên thắng vòng, tên vào Bảng vàng, rồi cả đoàn về trạm gốc chơi vòng mới.
9. Đổi số mét, mức quà, thời tiết, tiêu đề: sửa config-leo-nui.json rồi bấm F5. Ảnh riêng (nền, người leo, lều, đỉnh núi, trực thăng): chép vào public\\assets\\leo-nui (xem DAT-ANH-VAO-DAY.txt). Nhạc riêng: chép MP3 vào public\\assets\\nhac-leo-nui.
10. Bấm đúp mo-cua-so-leo-nui.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_GIEO_QUE = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\GieoQue. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-gieo-que.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm các nút Giả lập (bình luận xin xăm, chia sẻ, quà 1 / 30 / 299 xu...) để thử, nút "Tự chạy demo" để xem nhiều lượt liên tục. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối.
6. Người xem bình luận "xin xăm" và chia sẻ LIVE ít nhất 1 lần thì vào danh sách chờ. Tặng quà là vào ngay. Bảng 10 người chờ xếp theo điểm: 1 xu = 10 điểm, 1 chia sẻ = 5 điểm, 50 tim = 1 điểm. Muốn vượt lên thì chia sẻ, thả tim hoặc tặng quà thêm.
7. Tới lượt, người chơi có 10 giây gõ điều muốn xin (công danh, tài lộc, tình duyên, gia đạo, sức khỏe, thi cử, xuất hành). Ông Từ khấn, lắc ống xăm (thả tim cho lắc nhanh), rút quẻ, rồi gieo keo xin keo Thánh. Cả phòng đoán keo bằng bình luận "thánh", "âm", "dương".
8. Quẻ lấy theo bộ Quan Âm linh xăm 100 quẻ, có thơ, ý quẻ, lời giải theo đúng điều người chơi xin. Gặp Hạ quẻ, cả phòng có 15 giây tặng quà giải hạn: 10 xu lên 1 bậc, 100 xu lên Cát quẻ. Người tặng quà trong lượt của mình được lượt VIP màu vàng.
9. Đổi điểm, thời gian đếm ngược, mức quà, giọng đọc: sửa config-gieo-que.json rồi bấm F5. Ảnh riêng (nền, Ông Từ, ống xăm, tờ quẻ, keo): chép vào public\\assets\\gieo-que (xem DAT-ANH-VAO-DAY.txt). Game có sẵn nhạc nền đàn tranh, sáo trúc. Muốn nhạc riêng: chép MP3 vào public\\assets\\nhac-gieo-que. Luật chơi hiện ở đáy màn hình, sửa chữ trong mục rules của config.
10. Bấm đúp mo-cua-so-gieo-que.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
Lưu ý: nội dung quẻ chỉ mang tính giải trí.
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_DUOI_HINH = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\DuoiHinh. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-duoi-hinh.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm "Trả lời đúng", "Thả tim", "Quà"... để thử. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối. Ô "Đáp án câu đang chơi" chỉ bạn thấy, giúp bạn dẫn chương trình.
6. Mỗi câu ghép 2–4 hình thành một từ tiếng Việt, có 40 giây. Người xem gõ đáp án vào bình luận, gõ không dấu cũng được. Ai đúng trước được nhiều điểm hơn, có người đúng thì còn 10 giây cho người khác. Mỗi vòng 10 câu từ dễ đến khó, hết vòng vinh danh Top 3.
7. Thả tim: đủ 30 tim mở 1 chữ gợi ý; đủ mục tiêu tim (1.000) thì câu sau nhân đôi điểm. Quà nhỏ mở 1 chữ, quà từ 10 xu mở chữ và cộng 5 điểm, quà từ 100 xu mở một nửa số chữ và nhân đôi điểm. Theo dõi +3 điểm, chia sẻ +2 điểm.
8. Có sẵn 265 câu đố, không lặp lại cho tới khi chơi hết. Thêm câu đố riêng: mở trang thu-vien-hinh.html (có ở Bảng điều khiển) để chọn trong 1.600 hình, gõ đáp án, chép dòng hiện ra vào "cauDoThem" trong config-duoi-hinh.json rồi bấm F5. Ảnh riêng: chép vào public\\assets\\duoi-hinh\\tu-them. Nhạc riêng: chép MP3 vào public\\assets\\nhac-duoi-hinh.
9. Bấm đúp mo-cua-so-duoi-hinh.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
Hình emoji 3D: Microsoft Fluent Emoji, giấy phép MIT (xem public\\assets\\duoi-hinh\\BAN-QUYEN-HINH.txt).
Đổi máy tính: vào Tài khoản của tôi trên web, bấm "Chuyển key sang máy khác", rồi kích hoạt lại trên máy mới.`;

export const GUIDE_LOP_HOC = `1. Cài Node.js bản LTS tại nodejs.org (chỉ làm 1 lần trên mỗi máy).
2. Giải nén file vừa tải ra một thư mục, ví dụ D:\\LopHoc. Không chạy trực tiếp bên trong file ZIP.
3. Bấm đúp run-lop-hoc.bat. Lần đầu máy tự cài thư viện, mất 1–2 phút.
4. Trình duyệt mở trang Kích hoạt: dán license key của bạn rồi bấm Kích hoạt.
5. Ở Bảng điều khiển: bấm A, B, C, D, "Trả lời đúng", "Thả tim", "Chia sẻ"... để thử. Khi đang LIVE, nhập username TikTok rồi bấm Kết nối. Ô "Câu đang chơi" cho bạn xem trước đáp án đúng để dẫn chương trình.
6. Mỗi tiết học 10 câu, mỗi câu 20 giây. Người xem gõ A, B, C hoặc D vào bình luận (gõ "chọn b", "đáp án c" cũng được). Ô đáp án hiện số người chọn. Hết giờ đếm ngược 5 giây rồi lật đáp án: nhóm đúng được tuyên dương, nhóm sai bị phạt vui (phấn bay, trứng ngỗng, gà trống, sét đánh, gọi phụ huynh, mũ học lại, ô đáp án sập).
7. Lớp 5A có 6 bạn do máy điều khiển thi cùng người xem, nên LIVE ít người vẫn vui. Thả tim: đánh thức nhân vật, 15 tim trong 1 câu thì Na nhắc loại 1 đáp án sai. Chia sẻ: thẻ miễn phạt. Theo dõi: khăn quàng đỏ +5 điểm. Quà từ 99 xu: làm Lớp trưởng, nhân đôi điểm cả tiết.
8. Có sẵn hơn 300 câu (Toán, Tiếng Việt, Khoa học, Lịch sử, Địa lý, Tiếng Anh, Kiến thức chung, Đố mẹo). Thêm câu hỏi riêng: ở Bảng điều khiển bấm "Ngân hàng đề thi", gõ từng câu hoặc dán từ Excel. Câu tự thêm lưu trong file de-thi-lop-hoc.json, khi cập nhật game bản mới hãy chép file này sang thư mục mới.
9. Đổi thời gian mỗi câu, số câu mỗi tiết, điểm: sửa config-lop-hoc.json rồi bấm F5. Ảnh riêng: chép đè ảnh cùng tên trong public\\assets\\lop-hoc. Nhạc riêng: chép MP3 vào public\\assets\\nhac-lop-hoc.
10. Bấm đúp mo-cua-so-lop-hoc.bat để mở cửa sổ game, rồi trong TikTok LIVE Studio: Thêm nguồn > Chụp cửa sổ > chọn cửa sổ đó. Nếu không nghe tiếng, bấm chuột vào cửa sổ game một lần.
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
  {
    id: 'bia-hoi', name: 'Bia Hơi Vỉa Hè',
    tagline: 'Người xem ra quán bia hơi: rót bia, gọi mồi, cụng ly, xem bóng',
    description: 'Người xem vào LIVE thành khách ngồi ghế nhựa ở quán bia hơi phố đêm. Bình luận "bia", "nem chua", "lạc rang" thì chủ quán rót bia, mang mồi ra tận bàn. "dzô" để cả bàn cụng ly, "thêm két" để két bia bay ra bàn, "bóng đá" để xem trận. Chọn phe bia hơi hay bia chai rồi thả tim kéo co. Đủ chia sẻ thì tổ tuần tra đến, cả quán vác ghế chạy rồi quay lại cụng ly.',
    features: ['13 lệnh bình luận vui nhộn', 'Hai phe kéo co bằng tim và quà', 'Tổ tuần tra đến: vác ghế chạy rồi quay lại', 'Quà = bao cả quán, ghế VIP', 'Giọng chủ quán AI tiếng Việt'],
    image: '/media/bia-hoi.jpg', video: '/media/bia-hoi.mp4', download: '', version: '2.3.0',
    guide: GUIDE_BIA_HOI, guideVideo: '',
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 7, isNew: true,
  },
  {
    id: 'dam-cuoi', name: 'Ăn Cỗ Đám Cưới',
    tagline: 'Người xem làm khách mời một đám cưới trọn vẹn: chúc mừng, trao nhẫn, cắt bánh, giữ cô dâu, bắt hoa cưới',
    description: 'Người xem vào LIVE thành khách mời, đi qua cổng hoa theo thảm đỏ vào bàn tiệc trong hội trường cưới. MC dẫn 7 màn như một đám cưới thật: cô dâu chú rể tiến vào lễ đường, trao nhẫn, cắt bánh và nâng ly, người yêu cũ đến giành cô dâu hoặc chú rể, ném hoa cưới, chụp ảnh tiễn khách. Mỗi màn chỉ một lệnh rõ ràng để cả LIVE cùng gõ và thả tim. Quà là phong bì mừng cưới, tên người tặng lên Sổ vàng.',
    features: ['Hội trường tiệc cưới: sân khấu, cổng hoa, thảm đỏ, đèn chùm', 'Kịch bản 7 màn có MC dẫn, tự chạy vòng lặp', 'Chỉ 5 lệnh, lệnh của màn đang chạy sáng lên', 'Người yêu cũ giành cô dâu / chú rể: cả rạp giằng co', 'Quà = phong bì mừng cưới, Sổ vàng, pháo hoa'],
    image: '/media/dam-cuoi.jpg', video: '/media/dam-cuoi.mp4', download: '', version: '2.3.1',
    guide: GUIDE_DAM_CUOI, guideVideo: '', rev: 2,
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 8, isNew: true,
  },
  {
    id: 'tarot', name: 'Bói Bài Tarot',
    tagline: 'Người xem tặng quà để được xem bói 3 lá: công việc, tiền tài, tình duyên, học vấn',
    description: 'Phòng xem bói Tarot ngay trên LIVE: người xem tặng quà để vào hàng chờ, quà càng lớn càng được xem sớm. Gõ 1 đến 4 để chọn chủ đề Công việc, Tiền tài, Tình duyên, Học vấn. Cô Nguyệt xào bài, trải 3 lá Gốc rễ, Hiện tại, Thời gian tới, đọc ý nghĩa và lời giải từng lá bằng giọng AI, rồi lý giải chung. Có hàng chờ, lời cảm ơn quà, lá bài cho cả phòng khi vắng người.',
    features: ['Hàng chờ xếp theo giá trị quà', 'Gõ 1–4 chọn chủ đề', '22 lá Ẩn Chính, xuôi và ngược, lời giải theo từng chủ đề', 'Giọng đọc AI tiếng Việt đọc từng lá', 'Thay được ảnh nền, nhân vật, lá bài'],
    image: '/media/tarot.jpg', video: '/media/tarot.mp4', download: '', version: '2.4.0',
    guide: GUIDE_TAROT, guideVideo: '',
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 9, isNew: true,
  },
  {
    id: 'duoi-hinh', name: 'Đuổi Hình Bắt Chữ',
    tagline: 'Gameshow đoán chữ qua hình: người xem gõ đáp án, đua Top 5 Thánh soi hình',
    description: 'Mỗi câu ghép 2–4 hình emoji 3D thành một từ tiếng Việt (đàn + ong = đàn ông). Người xem gõ đáp án vào bình luận, ai đúng trước được nhiều điểm hơn, bảng xếp hạng Top 5 luôn hiện trên màn hình. Thả tim để mở chữ gợi ý, đủ mục tiêu tim thì nhân đôi điểm, quà lớn mở siêu gợi ý. Có sẵn 265 câu từ dễ đến khó và thư viện 1.600 hình để tự soạn thêm câu.',
    features: ['265 câu đố tiếng Việt có sẵn, 3 mức dễ / vừa / khó', 'Đồng hồ 40 giây, ô chữ gợi ý, MC đọc tên người đúng', 'Top 5 Thánh soi hình + tổng kết mỗi vòng', 'Thả tim mở chữ, quà = gợi ý và nhân đôi điểm', 'Thư viện 1.600 hình 3D để tự soạn câu đố'],
    image: '/media/duoi-hinh.jpg', video: '/media/duoi-hinh.mp4', download: '', version: '2.4.0',
    guide: GUIDE_DUOI_HINH, guideVideo: '',
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 10, isNew: true,
  },
  {
    id: 'leo-nui', name: 'Leo Núi Everest',
    tagline: 'Mỗi người xem một nhà leo núi, thả tim và tặng quà để đua lên đỉnh 8.849 m',
    description: 'Cuộc đua leo đỉnh Everest ngay trên LIVE: mỗi người xem là một nhà leo núi xuất phát từ trạm gốc 5.364 m. Thả tim, bình luận để leo lên, quà giúp vọt lên và tăng tốc x1,5 đến x3, quà lớn có trực thăng cứu hộ chở lên. Top 3 độ cao, thanh độ cao có ảnh đại diện, nhiệt độ, bão tuyết và tuyết lở làm cuộc đua kịch tính. Ai lên đỉnh đầu tiên thắng vòng và được ghi tên vào Bảng vàng.',
    features: ['Mỗi người xem một nhà leo núi có tên và ảnh đại diện', 'Thả tim = leo, quà = tăng tốc x1,5 / x2 / x3', 'Quà lớn gọi trực thăng chở lên', 'Bão tuyết, tuyết lở, nhiệt độ theo độ cao', 'Top 3, thanh độ cao, Bảng vàng người lên đỉnh'],
    image: '/media/leo-nui.jpg', video: '/media/leo-nui.mp4', download: '', version: '2.5.0',
    guide: GUIDE_LEO_NUI, guideVideo: '',
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 11, isNew: true,
  },
  {
    id: 'gieo-que', name: 'Gieo Quẻ Xin Xăm',
    tagline: 'Ông Từ rút quẻ Quan Âm 100 quẻ cho người xem, chia sẻ LIVE để được xin xăm',
    description: 'Ông Từ ngồi giữa sân đình rút quẻ cho từng người xem. Bình luận "xin xăm" và chia sẻ LIVE để vào bảng 10 người chờ, ai chia sẻ, thả tim, tặng quà nhiều hơn được xin trước. Tới lượt, người chơi gõ điều muốn xin, Ông Từ lắc ống xăm, gieo keo xin keo Thánh rồi đọc quẻ theo bộ Quan Âm linh xăm 100 quẻ, có lời giải đúng chủ đề người xin. Gặp Hạ quẻ, cả phòng tặng quà giải hạn.',
    features: ['100 quẻ Quan Âm linh xăm có thơ và lời giải', 'Bảng 10 người chờ xếp theo chia sẻ, tim, quà', 'Lời giải theo điều người chơi xin trong bình luận', 'Gieo keo Thánh / Âm / Dương, cả phòng cùng đoán', 'Giải hạn bằng quà, lượt VIP vàng, Bảng Phúc Đức'],
    image: '/media/gieo-que.jpg', video: '/media/gieo-que.mp4', download: '', version: '2.6.0',
    guide: GUIDE_GIEO_QUE, guideVideo: '',
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 12, isNew: true,
  },
  {
    id: 'lop-hoc', name: 'Bạn Có Giỏi Hơn Học Sinh Lớp 5?',
    tagline: 'Lớp học trắc nghiệm A B C D: người xem thi với 6 bạn lớp 5A, đúng được khen, sai bị phạt vui',
    description: 'Cô giáo đọc câu hỏi trên bảng đen, cả phòng LIVE cùng gõ A, B, C, D để trả lời. Ô đáp án hiện số người chọn, hết giờ đếm ngược 5-4-3-2-1 rồi lật đáp án. Nhóm đúng được tuyên dương, khiêng lên vai; nhóm sai bị phạt vui: phấn bay, trứng ngỗng, gà trống mổ đầu, sét đánh, gọi phụ huynh, mũ học lại. 6 bạn lớp 5A lắm trò thi cùng nên LIVE ít người vẫn vui. Có sẵn hơn 300 câu và trang tự thêm đề, dán từ Excel.',
    features: ['Hơn 300 câu tiểu học + đố mẹo, tự thêm đề từ Excel', 'Ô đáp án hiện số người chọn, đếm ngược hồi hộp', '7 màn phạt hài cho nhóm sai, tuyên dương nhóm đúng', '6 bạn lớp 5A thi cùng: Na Mọt Sách, Tí Lém, Bin Ngủ Gật...', 'Like, chia sẻ, theo dõi đều có tác dụng, không cần quà'],
    image: '/media/lop-hoc.jpg', video: '/media/lop-hoc.mp4', download: '', version: '2.9.0',
    guide: GUIDE_LOP_HOC, guideVideo: '',
    // ẩn cho tới khi quản trị tải file game lên và bật "Hiện"
    visible: false, order: 14, isNew: true,
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
  contactZalo: '', contactFacebook: '', contactTiktok: '', contactPhone: '', messengerUrl: '', zaloGroup: '',
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
  // SEO (để trống = tự tạo từ tên game và bảng giá)
  seoTitle: '', seoDescription: '', ogImage: '', googleVerification: '',
  // Đo lường quảng cáo: Google Tag Manager, Google Analytics 4, Meta (Facebook) Pixel, TikTok Pixel
  gtmId: 'GTM-NZQB5F5V', ga4Id: 'G-33XXV3JKWQ', metaPixelId: '1497281003464233', tiktokPixelId: '',
  // Meta Conversions API: máy chủ gửi sự kiện song song với Pixel (Trình quản lý sự kiện › Cài đặt › Tạo mã truy cập)
  metaCapiToken: '', metaTestEventCode: '',
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
    posts: data.posts || [],
    upsell: normalizeUpsell(data.upsell),
    bank: data.bank || { state: {}, lastRun: 0, lastError: '' },
    admin: data.admin || { passwordHash: '', salt: '' },
    secret: data.secret || '',
    seq: data.seq || 0,
    writeCount: data.writeCount || 0,
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
    // Game được viết lại (rev tăng): cập nhật nội dung giới thiệu trên web, giữ nguyên Hiện/ẩn, thứ tự và file đã tải lên
    if (def?.rev && (g.rev || 0) < def.rev) {
      for (const k of ['tagline', 'description', 'features', 'guide', 'version', 'image', 'video']) g[k] = structuredClone(def[k]);
      g.rev = def.rev;
    }
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
    try { if (this.data) this.refresh(); return fn(); } finally { clearInterval(this._beat); try { fs.rmdirSync(this.lockDir); } catch { /* bỏ qua */ } }
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
  diskWriteCount() {
    try { return JSON.parse(fs.readFileSync(this.file, 'utf8')).writeCount || 0; } catch { return -1; }
  }
  write() {
    // Chốt an toàn: file trên đĩa mới hơn bản trong bộ nhớ (tiến trình khác đã ghi mà mình chưa nạp lại)
    // thì không ghi đè, chỉ nạp lại bản mới.
    const disk = this.diskWriteCount();
    if (disk > (this.data.writeCount || 0)) {
      console.error(`[dữ liệu] pid ${process.pid}: bỏ lần ghi vì db.json trên đĩa mới hơn (đĩa ${disk}, bộ nhớ ${this.data.writeCount || 0}).`);
      this.mtime = '';
      this.refresh();
      return false;
    }
    this.data.writeCount = Math.max(disk, this.data.writeCount || 0) + 1;
    // Tên file tạm riêng cho từng tiến trình, giữ db.json.bak trước mỗi lần ghi
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 1));
    try { if (fs.existsSync(this.file)) fs.copyFileSync(this.file, this.file + '.bak'); } catch { /* bỏ qua */ }
    fs.renameSync(tmp, this.file);
    this.mtime = this.fileMtime();
  }
}
