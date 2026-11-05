// Nội dung các trang chính sách. Thông tin người bán lấy từ Quản trị > Cài đặt > Thông tin người bán.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const POLICIES = [
  { slug: 'chinh-sach-ban-hang', title: 'Chính sách bán hàng' },
  { slug: 'thanh-toan-giao-hang', title: 'Thanh toán & giao hàng' },
  { slug: 'doi-tra-hoan-tien', title: 'Đổi trả & hoàn tiền' },
  { slug: 'bao-mat', title: 'Chính sách quyền riêng tư' },
  { slug: 'dieu-khoan', title: 'Điều khoản sử dụng & bản quyền' },
];

const money = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;

export function sellerBlock(s, site) {
  const rows = [
    ['Đơn vị bán hàng', s.sellerName || s.brandName],
    ['Mã số thuế / CCCD', s.sellerTaxId],
    ['Địa chỉ', s.sellerAddress],
    ['Email', s.sellerEmail],
    ['Điện thoại / Zalo', s.contactPhone || s.contactZalo],
    ['Fanpage', s.messengerUrl || s.contactFacebook],
    ['Nhóm Zalo hỗ trợ', s.zaloGroup],
    ['Website', site],
  ].filter(r => r[1]);
  return `<ul>${rows.map(([k, v]) => `<li><b>${k}:</b> ${esc(v)}</li>`).join('')}</ul>`;
}

export function policyHtml(slug, { settings: s, plans = [] }) {
  const site = location.host;
  const brand = esc(s.brandName);
  const seller = esc(s.sellerName || s.brandName);
  const contact = [(s.messengerUrl || s.contactFacebook) && 'nhắn tin fanpage', s.zaloGroup && 'nhóm Zalo hỗ trợ', s.contactZalo && `Zalo ${esc(s.contactZalo)}`, s.contactPhone && `điện thoại ${esc(s.contactPhone)}`, s.sellerEmail && `email ${esc(s.sellerEmail)}`].filter(Boolean).join(', ') || 'các kênh hỗ trợ ở chân trang';
  const days = Number(s.refundDays) || 0;
  const planList = plans.length ? `<ul>${plans.map(p => `<li><b>${esc(p.name)}</b> – ${money(p.price)}: ${p.allGames ? 'tất cả game hiện có và game ra sau này' : `${p.slots} game`}, dùng trọn đời.</li>`).join('')}</ul>` : '';

  const pages = {
    'chinh-sach-ban-hang': `
      <p>Chính sách này áp dụng cho mọi đơn hàng mua tại website <b>${esc(site)}</b> do <b>${seller}</b> quản lý.</p>
      <h2>1. Sản phẩm</h2>
      <p>${brand} bán bản quyền sử dụng các phần mềm trò chơi tương tác dành cho phiên phát trực tiếp TikTok LIVE, chạy trên máy tính Windows. Sản phẩm là hàng hoá số: khách nhận <b>license key</b> và <b>link tải phần mềm</b>, không có hàng hoá vật lý.</p>
      <h2>2. Gói bán và giá</h2>
      ${planList}
      <p>Giá đã gồm mọi chi phí, không thu thêm phí kích hoạt. Giá có thể thay đổi theo từng thời điểm, nhưng đơn đã thanh toán giữ nguyên quyền lợi lúc mua.</p>
      <p>Với gói nhiều game, nếu cửa hàng chưa đủ số game của gói thì key tự nhận game mới khi game đó ra mắt, cho tới khi đủ số game.</p>
      <h2>3. Thời hạn sử dụng</h2>
      <p>Các gói là bản quyền <b>trọn đời</b>: dùng không giới hạn thời gian, kèm các bản cập nhật sửa lỗi của game đã mua, miễn là cửa hàng còn hoạt động và key không vi phạm <a href="/chinh-sach/dieu-khoan">Điều khoản sử dụng</a>.</p>
      <h2>4. Mỗi key dùng trên 1 máy</h2>
      <p>Mỗi key chỉ chạy trên <b>một máy tính tại một thời điểm</b>. Khách tự chuyển key sang máy khác được ${s.moveLimit} lần trong ${s.moveWindowDays} ngày, ngay trong trang <a href="/tai-khoan.html">Tài khoản của tôi</a>.</p>
      <h2>5. Đặt hàng</h2>
      <p>Khách đăng ký tài khoản (bắt buộc số điện thoại và email), chọn gói và game, rồi thanh toán theo hướng dẫn ở trang <a href="/chinh-sach/thanh-toan-giao-hang">Thanh toán & giao hàng</a>.</p>
      <h2>6. Hỗ trợ</h2>
      <p>Hỗ trợ cài đặt và sử dụng qua ${contact}. Gói Trọn Bộ được hỗ trợ cài đặt trực tiếp khi cần.</p>`,

    'thanh-toan-giao-hang': `
      <h2>1. Hình thức thanh toán</h2>
      <p>Thanh toán bằng <b>chuyển khoản ngân hàng</b> qua mã VietQR hiện trong trang đơn hàng (mã QR đã có sẵn số tiền và nội dung). Cửa hàng không thu tiền mặt và không nhận thanh toán qua người trung gian.</p>
      <p>Khi chuyển khoản, vui lòng giữ nguyên <b>nội dung chuyển khoản</b> (dạng <code>LG…</code>) để hệ thống tự nhận ra đơn hàng. Chuyển sai nội dung hoặc thiếu tiền thì đơn được xử lý thủ công, có thể chậm hơn. Hãy liên hệ ${contact} kèm ảnh giao dịch.</p>
      <h2>2. Giao hàng</h2>
      <p>Sản phẩm được giao <b>trực tuyến</b>, không giao hàng tận nơi:</p>
      <ul>
        <li>Thanh toán đúng nội dung và đủ tiền: license key được tạo tự động, thường trong vòng 1–3 phút.</li>
        <li>Key và link tải game hiện ở trang đơn hàng và trong <a href="/tai-khoan.html">Tài khoản của tôi</a>, kèm hướng dẫn cài đặt riêng của từng game.</li>
        <li>Trường hợp cần xác nhận thủ công: chậm nhất 24 giờ.</li>
      </ul>
      <p>Phí giao hàng: <b>0đ</b>.</p>
      <h2>3. Kiểm tra sau khi nhận</h2>
      <p>Khách tải game, nhập key trên máy tính để kích hoạt. Nếu không kích hoạt được, vui lòng liên hệ ${contact} để được hỗ trợ trước khi yêu cầu hoàn tiền.</p>`,

    'doi-tra-hoan-tien': `
      <p>Vì sản phẩm là phần mềm (hàng hoá số) được giao ngay sau khi thanh toán, chính sách đổi trả áp dụng như sau.</p>
      <h2>1. Trường hợp được hoàn tiền</h2>
      <ul>
        ${days ? `<li>Trong <b>${days} ngày</b> kể từ khi thanh toán, key <b>chưa được kích hoạt</b> trên máy nào: hoàn 100% nếu khách đổi ý.</li>` : ''}
        <li>Game không chạy được trên máy đáp ứng cấu hình tối thiểu (Windows 10/11 64-bit) và đội hỗ trợ không khắc phục được: hoàn 100%.</li>
        <li>Khách bị trừ tiền 2 lần cho cùng một đơn, hoặc chuyển thừa tiền: hoàn phần chuyển thừa.</li>
      </ul>
      <h2>2. Trường hợp không hoàn tiền</h2>
      <ul>
        <li>Key đã kích hoạt và game chạy bình thường${days ? `, hoặc đã quá ${days} ngày kể từ khi thanh toán` : ''}.</li>
        <li>Key bị khoá do vi phạm <a href="/chinh-sach/dieu-khoan">Điều khoản sử dụng</a> (chia sẻ, bán lại, bẻ khoá…).</li>
        <li>Lý do từ phía nền tảng TikTok (thay đổi chính sách, khoá tài khoản LIVE của khách…) nằm ngoài phạm vi sản phẩm.</li>
      </ul>
      <h2>3. Đổi game</h2>
      <p>Với gói Lẻ hoặc Combo, key chưa kích hoạt được đổi sang game khác cùng giá trong ${days || 7} ngày đầu, miễn phí.</p>
      <h2>4. Cách yêu cầu</h2>
      <p>Liên hệ ${contact}, gửi mã đơn hàng, license key và lý do. Yêu cầu hợp lệ được xử lý trong 3 ngày làm việc. Tiền hoàn về đúng tài khoản ngân hàng đã chuyển, và key của đơn bị thu hồi.</p>`,

    'bao-mat': `
      <p>${seller} tôn trọng và bảo vệ thông tin cá nhân của khách hàng theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.</p>
      <h2>1. Thông tin thu thập</h2>
      <ul>
        <li><b>Khi đăng ký tài khoản:</b> họ tên, số điện thoại, email, mật khẩu (chỉ lưu dạng mã hoá, cửa hàng không đọc được).</li>
        <li><b>Khi mua hàng:</b> gói, game đã chọn, số tiền, thời gian và nội dung chuyển khoản.</li>
        <li><b>Khi kích hoạt game:</b> mã nhận dạng máy tính (đã băm, không thể đảo ngược), tên máy tính, phiên bản game, thời điểm kiểm tra key gần nhất.</li>
      </ul>
      <p>Cửa hàng <b>không</b> thu thập nội dung phiên LIVE, tài khoản hay mật khẩu TikTok, và không đọc tệp tin trên máy tính của khách.</p>
      <h2>2. Mục đích sử dụng</h2>
      <ul>
        <li>Xác nhận thanh toán, giao key và link tải.</li>
        <li>Kiểm tra bản quyền (mỗi key một máy), hỗ trợ chuyển máy.</li>
        <li>Liên hệ hỗ trợ kỹ thuật, thông báo cập nhật game.</li>
      </ul>
      <h2>3. Chia sẻ thông tin</h2>
      <p>Cửa hàng không bán hay trao đổi thông tin cá nhân của khách. Thông tin chỉ được cung cấp cho cơ quan nhà nước có thẩm quyền khi có yêu cầu theo quy định pháp luật.</p>
      <h2>4. Lưu trữ và bảo mật</h2>
      <p>Dữ liệu lưu trên máy chủ tại nhà cung cấp hosting, truyền qua kết nối mã hoá HTTPS. Thông tin được lưu trong thời gian tài khoản còn sử dụng và tối đa 5 năm sau giao dịch cuối cùng để phục vụ đối soát.</p>
      <h2>5. Quyền của khách hàng</h2>
      <p>Khách có thể xem, sửa thông tin trong <a href="/tai-khoan.html">Tài khoản của tôi</a>, hoặc yêu cầu xoá tài khoản qua ${contact}. Khi xoá tài khoản, key đã mua sẽ không còn được hỗ trợ chuyển máy qua tài khoản.</p>
      <h2>6. Cookie</h2>
      <p>Website chỉ dùng cookie cần thiết để giữ đăng nhập, không dùng cookie quảng cáo hay theo dõi của bên thứ ba.</p>`,

    'dieu-khoan': `
      <p>Khi mua và sử dụng sản phẩm của ${brand}, khách hàng đồng ý với các điều khoản dưới đây.</p>
      <h2>1. Quyền sử dụng</h2>
      <p>Khách được cấp quyền sử dụng phần mềm (không phải quyền sở hữu mã nguồn) cho mục đích phát LIVE của chính mình, kể cả phát LIVE có thu nhập (quà tặng, bán hàng).</p>
      <h2>2. Giới hạn của license key</h2>
      <ul>
        <li>Mỗi key chạy trên <b>1 máy tính tại một thời điểm</b>.</li>
        <li>Tự chuyển key sang máy khác tối đa ${s.moveLimit} lần trong ${s.moveWindowDays} ngày. Cần thêm thì liên hệ hỗ trợ.</li>
        <li>Game cần kết nối Internet để kiểm tra key; khi mất mạng vẫn chạy được tối đa ${s.offlineDays || 3} ngày.</li>
      </ul>
      <h2>3. Hành vi bị cấm</h2>
      <ul>
        <li>Chia sẻ, cho mượn, bán lại hoặc cho thuê key và file game.</li>
        <li>Bẻ khoá, dịch ngược, chỉnh sửa để vượt qua kiểm tra bản quyền.</li>
        <li>Đăng tải lại file game lên mạng, nhóm chat hay kho chia sẻ.</li>
        <li>Dùng game để phát nội dung vi phạm pháp luật hoặc tiêu chuẩn cộng đồng của TikTok.</li>
      </ul>
      <p>Vi phạm có thể dẫn tới khoá key mà không hoàn tiền.</p>
      <h2>4. Nội dung của khách</h2>
      <p>Ảnh, nhạc, video khách tự thêm vào game (ảnh LED, nhạc nền…) do khách tự chịu trách nhiệm về bản quyền. Game không kèm nhạc có bản quyền của bên thứ ba.</p>
      <h2>5. Giới hạn trách nhiệm</h2>
      <p>Game kết nối TikTok LIVE qua dữ liệu công khai của phiên LIVE. ${seller} không chịu trách nhiệm khi TikTok thay đổi hệ thống làm game tạm thời không nhận được bình luận, quà; khi đó cửa hàng sẽ cập nhật bản sửa lỗi sớm nhất có thể. Cửa hàng không liên kết với TikTok hay ByteDance.</p>
      <h2>6. Thay đổi điều khoản</h2>
      <p>Điều khoản có thể được cập nhật và đăng tại trang này. Quyền lợi của đơn đã mua không bị giảm bởi thay đổi sau ngày mua.</p>`,
  };
  return pages[slug] || null;
}

// Link chính sách + thông tin người bán ở chân trang (mọi trang)
export function footerHtml(s) {
  const info = [s.sellerName, s.sellerTaxId && `MST/CCCD: ${s.sellerTaxId}`, s.sellerAddress, s.sellerEmail, s.contactPhone].filter(Boolean).map(esc).join(' · ');
  return `<nav class="foot-links"><a href="/huong-dan.html">Hướng dẫn cài đặt</a><a href="/tin-tuc">Tin tức</a>${POLICIES.map(p => `<a href="/chinh-sach/${p.slug}">${p.title}</a>`).join('')}</nav>${info ? `<div class="foot-info">${info}</div>` : ''}`;
}
