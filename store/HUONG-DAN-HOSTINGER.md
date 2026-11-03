# Cài website bán game lên Hostinger (gói Business)

Gói **Premium không chạy được Node.js**. Hãy dùng gói **Business** (hoặc Cloud).

## Chuẩn bị
- File `website-ban-game-hostinger.zip` (file `package.json` nằm ngay trong ZIP, không có thư mục con).
- Một tên miền đã nằm trong tài khoản Hostinger, hoặc một tên miền phụ như `game.ndvmedia.com`.

## Các bước (khoảng 10 phút)

1. Vào **hpanel.hostinger.com** > **Trang web** > ở khung **Business** bấm **＋ Tạo trang web**.
2. Chọn **Web App** (Ứng dụng web Node.js).
3. Chọn **Tải tệp lên** và kéo file `website-ban-game-hostinger.zip` vào.
4. Ở **Cài đặt build**:
   - Framework: **Express**. Nếu không có Express thì chọn **Other**.
   - Phiên bản Node: **22.x** (hoặc 20.x).
   - Entry file: `server.js`
   - Output directory (nếu bị hỏi): `public`
5. Chọn tên miền cho trang web, rồi bấm **Deploy**. Chờ build xong, khoảng 1–3 phút.
6. Mở `https://ten-mien/admin/`, **tạo mật khẩu quản trị ngay**, vì người đầu tiên mở trang này sẽ đặt mật khẩu.
7. Trong **Cài đặt** của trang quản trị:
   - **Địa chỉ website**: `https://ten-mien` (dùng cho link quay về sau thanh toán).
   - Tài khoản ngân hàng (VietQR), hoặc PayOS. Với PayOS, đặt Webhook URL là `https://ten-mien/api/payos/webhook`.
   - Zalo, Facebook, TikTok.
8. Bật **SSL** cho tên miền trong hPanel (thường được bật tự động).

## Dữ liệu được lưu ở đâu
Đơn hàng, key, ảnh tải lên được lưu ở `domains/<tên miền>/livegame-data/`, nằm **ngoài** thư mục code. Vì vậy cập nhật website (tải ZIP mới lên) không làm mất dữ liệu.

**Sao lưu:** vào **Trình quản lý tệp** của hPanel, tải thư mục `livegame-data` về máy mỗi tuần. File `license-private.pem` trong đó rất quan trọng: mất file này thì mọi game đã bán phải cập nhật lại.

## Cập nhật bản mới
Vào trang web đó > **Triển khai lại** (hoặc tải ZIP mới lên). Dữ liệu vẫn giữ nguyên.

## Gặp lỗi
- Trang báo lỗi 503 hoặc không mở được: xem **Nhật ký build/runtime** trong hPanel, chụp màn hình gửi lại.
- Nếu muốn để dữ liệu ở chỗ khác: thêm biến môi trường `DATA_DIR`, ví dụ `~/livegame-data`.
