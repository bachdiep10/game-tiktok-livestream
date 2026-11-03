# Website bán game + quản lý license key

Thư mục này là **một website riêng**, chạy trên máy chủ (VPS) có tên miền. Nó gồm 3 phần:

| Phần | Địa chỉ | Dùng để |
|---|---|---|
| Trang bán hàng | `/` | Giới thiệu game, video demo, 3 gói giá, hỏi đáp, mua hàng |
| Trang đơn hàng | `/don-hang.html` | Khách thanh toán, nhận key và link tải |
| Tra cứu & chuyển máy | `/tra-cuu.html` | Khách xem lại key, tự chuyển key sang máy mới |
| Quản trị | `/admin/` | Đơn hàng, key, thêm game mới, sửa giá, cài đặt |
| API cho game | `/api/license/*` | Game trên máy khách kiểm tra key |

## Chạy thử trên máy tính

Cần Node.js 20 trở lên.

```
cd store
npm install
npm start
```

Mở http://localhost:8080 (trang bán) và http://localhost:8080/admin/. Lần đầu vào trang quản trị, bạn sẽ được yêu cầu tạo mật khẩu.
Trên Windows có thể bấm đúp `chay-cua-hang.bat`.

Kiểm tra toàn bộ luồng: `npm test`.

## Việc cần làm trong trang Quản trị

1. **Cài đặt > Chuyển khoản thủ công**: nhập mã ngân hàng (MB, VCB, TCB…), số tài khoản, tên chủ tài khoản. Khách sẽ thấy mã VietQR. Bạn kiểm tra tiền rồi bấm **Đã nhận tiền** ở mục Đơn hàng → key hiện ngay cho khách.
2. **Cài đặt > PayOS** (nên dùng khi đã có tên miền): đăng ký payos.vn, tạo kênh thanh toán, dán Client ID / Api Key / Checksum Key, và đặt Webhook URL trong PayOS là `https://ten-mien-cua-ban/api/payos/webhook`. Khách trả tiền xong, key tự hiện, bạn không cần làm gì.
3. **Game**: thêm game mới, tải ảnh bìa, video demo, dán **link tải** (Google Drive…). Link tải chỉ hiện cho khách đã thanh toán.
4. **Gói giá & Hỏi đáp**: sửa giá, quyền lợi, câu hỏi.
5. **Cài đặt > Liên hệ**: Zalo, Facebook, TikTok.

## Quy định key

- Mỗi key gắn với **1 máy** (mã máy lấy từ Windows). Máy thứ 2 nhập cùng key sẽ bị từ chối.
- Khách tự chuyển máy ở trang Tra cứu (mặc định 3 lần / 30 ngày). Quá số lần thì nhắn bạn, bạn bấm **Gỡ máy** trong Quản trị.
- **Gói Combo** (3 suất): nếu cửa hàng chưa đủ 3 game, suất trống tự nhận game mới khi bạn thêm game.
- **Gói Trọn Bộ**: luôn có mọi game, kể cả game thêm sau.
- Khoá key: game của khách ngừng chạy ở lần kiểm tra kế tiếp.
- Game chạy được khi mất mạng tối đa 3 ngày (sửa trong Cài đặt).

## Đưa lên mạng (VPS)

1. Thuê VPS Linux nhỏ (1 CPU, 1GB RAM là đủ), trỏ tên miền về VPS.
2. Cài Node.js 20+, chép thư mục `store` lên, chạy `npm install --omit=dev`.
3. Chạy nền bằng `pm2 start server.js --name cua-hang` (hoặc systemd). Đổi cổng bằng biến `PORT`.
4. Đặt Nginx/Caddy phía trước để có HTTPS.
5. **Sao lưu thư mục `data/` hằng ngày.** Trong đó có toàn bộ đơn hàng, key, và khoá ký `license-private.pem`. Mất khoá này thì mọi game đã bán phải cập nhật lại.

## Nối game với máy chủ key

File `client/license-client.js` dùng trong game:

```js
import { checkLicense } from './license-client.js';
const r = await checkLicense({
  server: 'https://ten-mien-cua-ban',
  game: 'chanh-dien',              // mã game trong trang Quản trị > Game
  key,                             // key khách nhập (lần sau để trống, tự đọc từ file lưu)
  publicKeyPem,                    // copy từ Quản trị > Cài đặt > Khoá công khai
  cacheFile: 'license.json',
});
if (!r.ok) { /* hiện r.error, yêu cầu nhập key */ }
```

Bước tiếp theo là đóng gói từng game thành file .exe có ô nhập key và gọi hàm này lúc khởi động.
