// 2 bài hướng dẫn gắn vào từng game:
//   /huong-dan/livestream-game-net-cang  : tăng độ phân giải khi LIVE (cài đặt video + nguồn Liên kết)
//   /huong-dan/cai-nodejs-chay-game      : cài Node.js và chạy game bằng CMD
// Thêm ?game=<id> để làm nổi bật đúng đường dẫn / file của game khách đã mua.
import { liveInfo, GUIDE_LIVE_NET, GUIDE_NODEJS } from '../web/js/live-guide.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IMG = '/media/huong-dan/';

const fig = (file, alt, w, h, cap) => `<figure class="hd-fig"><img src="${IMG}${file}?v=1" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;

export const LIVE_ARTICLES = {
  net: {
    path: GUIDE_LIVE_NET,
    title: 'Cách tăng độ phân giải khi livestream game trên TikTok LIVE Studio (hình nét, không viền đen)',
    short: 'LIVE nét: chỉnh độ phân giải + thêm nguồn Liên kết',
    desc: 'Hướng dẫn có hình: chỉnh chất lượng video 1080P trong TikTok LIVE Studio và thêm màn hình game bằng nguồn Liên kết 1080 x 1920 để phiên LIVE game nét, không viền đen.',
    image: `${IMG}07-dan-lien-ket-1080x1920.jpg`,
  },
  node: {
    path: GUIDE_NODEJS,
    title: 'Hướng dẫn cài Node.js và chạy game LIVE bằng CMD trên Windows (có hình từng bước)',
    short: 'Cài Node.js + chạy game bằng CMD',
    desc: 'Tải Node.js bản LTS, cài đặt từng bước, kiểm tra bằng lệnh node -v, rồi chạy game tương tác TikTok LIVE bằng file .bat hoặc lệnh CMD. Kèm cách xử lý lỗi thường gặp.',
    image: `${IMG}12-cai-nodejs-cac-buoc.jpg`,
  },
};

// Khung "game của bạn" khi mở bài từ trang game (?game=<id>)
function pickedBox(g, kind) {
  if (!g) return '';
  const i = liveInfo(g.id);
  const rows = kind === 'net'
    ? `<li>Liên kết màn hình game: <code class="hd-url">${i.url}</code> <button type="button" class="btn sm ghost" data-copy="${i.url}">Sao chép</button></li>
       <li>Độ phân giải tùy chỉnh: <b>W 1080</b>, <b>H 1920</b></li>`
    : `<li>Giải nén ra thư mục, ví dụ: <code>D:\\${esc(i.folder)}</code></li>
       <li>File chạy game: <code>${esc(i.run)}</code></li>
       <li>Liên kết màn hình game (dùng ở bài LIVE nét): <code class="hd-url">${i.url}</code></li>`;
  return `<div class="hd-pick"><b>🎮 Bạn đang xem hướng dẫn cho game ${esc(g.name)}</b><ul>${rows}</ul></div>`;
}

function linkTable(games, picked, kind) {
  const head = kind === 'net' ? '<th>Game</th><th>Liên kết dán vào LIVE Studio</th>' : '<th>Game</th><th>File chạy (bấm đúp)</th><th>Liên kết màn hình game</th>';
  return `<div class="hd-table"><table><thead><tr>${head}</tr></thead><tbody>${games.map(g => {
    const i = liveInfo(g.id);
    const on = picked && picked.id === g.id ? ' class="on"' : '';
    return kind === 'net'
      ? `<tr${on}><td><a href="/game/${esc(g.id)}">${esc(g.name)}</a></td><td><code>${i.url}</code></td></tr>`
      : `<tr${on}><td><a href="/game/${esc(g.id)}">${esc(g.name)}</a></td><td><code>${esc(i.run)}</code></td><td><code>${i.url}</code></td></tr>`;
  }).join('')}</tbody></table></div>`;
}

const otherBox = (kind, q) => {
  const o = LIVE_ARTICLES[kind === 'net' ? 'node' : 'net'];
  return `<div class="hd-next">📖 Bài tiếp theo: <a href="${o.path}${q}">${esc(o.title)}</a></div>`;
};

const copyScript = `<script>document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(!b)return;navigator.clipboard?.writeText(b.dataset.copy).then(()=>{b.textContent='Đã chép ✓';setTimeout(()=>b.textContent='Sao chép',1500)})})</script>`;

export function liveNetBody({ games, picked, help }) {
  const q = picked ? `?game=${encodeURIComponent(picked.id)}` : '';
  const ex = picked ? liveInfo(picked.id).url : 'http://127.0.0.1:3000/go-bom.html';
  return `
      <h1>${esc(LIVE_ARTICLES.net.title)}</h1>
      <p class="sub">Áp dụng cho tất cả game tương tác của cửa hàng. Làm 1 lần, LIVE Studio tự nhớ cho các buổi sau.</p>
      ${pickedBox(picked, 'net')}
      <p>Hình LIVE bị <b>mờ, nhòe chữ hoặc có 2 viền đen</b> hai bên thường do 2 nguyên nhân: chất lượng video của LIVE Studio đang để thấp (720p), và game được đưa lên bằng cách <i>chụp cửa sổ</i> nên bị co giãn. Làm đủ 2 bước dưới đây là hình sẽ nét căng.</p>

      <h2 id="buoc-1">Bước 1: Chỉnh chất lượng video lên cao nhất</h2>
      <ol>
        <li>Mở <b>TikTok LIVE Studio</b>, bấm biểu tượng <b>bánh răng ⚙ (Cài đặt)</b> ở góc trên bên phải.</li>
      </ol>
      ${fig('01-nut-cai-dat.jpg', 'Nút Cài đặt (bánh răng) góc trên bên phải TikTok LIVE Studio', 1219, 130)}
      <ol start="2">
        <li>Chọn mục <b>Video</b> ở cột bên trái.</li>
        <li>Ở dòng <b>Chất lượng video</b>, bấm vào ô chọn và chọn <b>1080P60</b> (cao nhất, 60 khung hình/giây). Máy hơi yếu thì chọn <b>1080P</b>.</li>
      </ol>
      ${fig('02-chat-luong-video.jpg', 'Cài đặt > Video > Chất lượng video chọn 1080P60', 864, 844, 'Cài đặt › Video › Chất lượng video › 1080P60 (cao nhất)')}
      <p><b>Không chắc máy mình chịu được mức nào?</b> Chọn <b>Tự động (gợi ý)</b>, hoặc bấm nút <b>Bắt đầu</b> ở dòng "Cho phép kiểm tra tốc độ tự động…". LIVE Studio sẽ đo tốc độ mạng và sức mạnh máy rồi gợi ý độ phân giải tốt nhất hiện tại.</p>
      ${fig('03-tu-dong-goi-y.jpg', 'Chọn Tự động (gợi ý) hoặc bấm Bắt đầu để LIVE Studio tự tính độ phân giải', 864, 844)}
      <p>Bảng <b>Kiểm tra hiệu năng hệ thống</b> hiện ra: chọn <b>Ưu tiên chất lượng</b> rồi bấm <b>Xác nhận</b>.</p>
      ${fig('04-kiem-tra-hieu-nang.jpg', 'Bảng Kiểm tra hiệu năng hệ thống: chọn Ưu tiên chất lượng rồi Xác nhận', 800, 618)}
      <div class="hd-note">💡 Nếu LIVE Studio báo <i>"Cài đặt video của bạn quá cao"</i> hoặc khi LIVE thấy hình bị giật, đứng hình: hạ xuống <b>1080P</b>, hoặc để <b>Tự động (gợi ý)</b>. Mạng tải lên nên từ 10 Mbps trở lên để LIVE 1080p mượt.</div>

      <h2 id="buoc-2">Bước 2: Thêm màn hình game bằng nguồn "Liên kết"</h2>
      <p>Trước tiên, chạy game như bình thường (bấm đúp file <code>run-….bat</code>, cửa sổ đen phải đang mở). Chưa cài game? Xem <a href="${GUIDE_NODEJS}${q}">bài cài Node.js và chạy game</a>.</p>
      <ol>
        <li>Trong LIVE Studio, bấm <b>Thêm nguồn</b> (cột bên trái).</li>
      </ol>
      ${fig('05-them-nguon.jpg', 'Nút Thêm nguồn trong TikTok LIVE Studio', 404, 429)}
      <ol start="2">
        <li>Chọn <b>Liên kết</b> rồi bấm <b>Thêm</b>. (Không chọn "Quay màn hình cửa sổ" nữa, cách đó làm hình mờ và có viền đen.)</li>
      </ol>
      ${fig('06-chon-lien-ket.jpg', 'Chọn nguồn Liên kết rồi bấm Thêm', 866, 848)}
      <ol start="3">
        <li>Ô <b>Liên kết</b>: dán đường dẫn màn hình game của bạn, ví dụ <code>${ex}</code> (xem bảng đường dẫn từng game ngay bên dưới).</li>
        <li>Bật <b>Bật âm thanh</b> để người xem nghe nhạc, giọng đọc của game.</li>
        <li>Bật <b>Độ phân giải tùy chỉnh</b>, gõ <b>W = 1080</b> và <b>H = 1920</b> (đúng khung dọc của game).</li>
        <li>Bấm <b>Áp dụng</b>. Khung xem trước hiện màn hình game là xong.</li>
      </ol>
      ${fig('07-dan-lien-ket-1080x1920.jpg', 'Dán liên kết game, bật âm thanh, độ phân giải tùy chỉnh 1080 x 1920, Áp dụng', 1020, 937, 'Dán liên kết › Bật âm thanh › Độ phân giải tùy chỉnh 1080 × 1920 › Áp dụng')}
      <ol start="7">
        <li>Kéo góc khung game cho <b>phủ kín</b> màn hình dọc của LIVE Studio.</li>
        <li>Muốn sửa lại sau này: rê chuột vào dòng <b>Liên kết</b> ở cột trái, bấm biểu tượng bánh răng <b>Cài đặt</b>.</li>
      </ol>
      ${fig('08-mo-lai-cai-dat-nguon.jpg', 'Bấm bánh răng cạnh nguồn Liên kết để sửa lại', 699, 165)}

      <h2 id="lien-ket-tung-game">Đường dẫn màn hình của từng game</h2>
      <p>Mỗi game có một đường dẫn riêng. Dán đúng đường dẫn của game bạn đã mua:</p>
      ${linkTable(games, picked, 'net')}

      <h2 id="luu-y">Lưu ý quan trọng</h2>
      <ul>
        <li>Cửa sổ đen (máy chủ game) của <code>run-….bat</code> phải <b>luôn mở</b>. Tắt nó thì khung Liên kết thành trang trắng / báo lỗi.</li>
        <li>Đã dùng Liên kết thì <b>không cần</b> mở cửa sổ game bằng <code>mo-cua-so-….bat</code> nữa. Nếu đang mở, hãy đóng lại để không bị lặp tiếng.</li>
        <li><b>Bảng điều khiển</b> (trang <code>…-control.html</code>) vẫn mở bằng trình duyệt như cũ để bấm <b>Kết nối</b> TikTok và giả lập.</li>
        <li>Nên bật <b>Luôn giữ trạng thái hoạt động</b> trong cài đặt nguồn Liên kết để game không bị dừng khi bạn ẩn nguồn hoặc chuyển cảnh.</li>
        <li>Khung Liên kết báo trang trắng hoặc lỗi: kiểm tra cửa sổ đen còn chạy, đã kích hoạt key, rồi bấm bánh răng của nguồn › <b>Áp dụng</b> lại để tải lại.</li>
      </ul>
      <p>Vẫn chưa được? ${help}</p>
      ${otherBox('net', q)}
      ${copyScript}`;
}

export function nodejsBody({ games, picked, help }) {
  const q = picked ? `?game=${encodeURIComponent(picked.id)}` : '';
  const i = liveInfo(picked ? picked.id : 'go-bom');
  return `
      <h1>${esc(LIVE_ARTICLES.node.title)}</h1>
      <p class="sub">Làm 1 lần trên mỗi máy tính Windows 10/11, mất khoảng 5–10 phút.</p>
      ${pickedBox(picked, 'node')}
      <p>Game tương tác chạy trên máy tính của bạn nhờ <b>Node.js</b> (phần mềm miễn phí, giống như "động cơ" để game chạy). Vì vậy bạn cần cài Node.js trước, sau đó mới chạy game.</p>

      <h2 id="tai-nodejs">Bước 1: Tải Node.js</h2>
      <ol>
        <li>Vào trang <a href="https://nodejs.org/en/download" target="_blank" rel="noopener">nodejs.org/en/download</a>.</li>
        <li>Ô phiên bản giữ bản có chữ <b>LTS</b> (bản ổn định). Hệ điều hành <b>Windows</b>, kiến trúc <b>x64</b>.</li>
        <li>Kéo xuống, bấm nút xanh <b>Windows Installer (.msi)</b> để tải file cài đặt.</li>
      </ol>
      ${fig('11-tai-nodejs.jpg', 'Trang tải Node.js: chọn bản LTS và bấm Windows Installer (.msi)', 1100, 777, 'Chọn bản LTS › bấm Windows Installer (.msi)')}

      <h2 id="cai-nodejs">Bước 2: Cài Node.js</h2>
      <ol>
        <li>Mở file <code>node-v…-x64.msi</code> vừa tải (thường nằm trong thư mục <b>Downloads / Tải xuống</b>).</li>
        <li>Bấm <b>Next</b> › tích ô <b>I accept the terms…</b> › <b>Next</b>.</li>
        <li>Các màn tiếp theo cứ giữ nguyên và bấm <b>Next</b>. Ở màn <i>Tools for Native Modules</i> <b>để trống</b> ô tích, bấm Next.</li>
        <li>Bấm <b>Install</b>. Windows hỏi "Bạn có muốn cho phép ứng dụng này thay đổi thiết bị?" thì chọn <b>Yes / Có</b>. Chờ chạy xong, bấm <b>Finish</b>.</li>
        <li><b>Khởi động lại máy tính</b> (hoặc ít nhất tắt hết cửa sổ CMD đang mở) để Windows nhận Node.js.</li>
      </ol>
      ${fig('12-cai-nodejs-cac-buoc.jpg', 'Các bước cài Node.js: Next, I accept, Next, Install, Finish', 1725, 1296)}

      <h2 id="kiem-tra">Bước 3: Kiểm tra đã cài thành công</h2>
      <ol>
        <li>Nhấn phím <b>Windows + R</b>, gõ <code>cmd</code> rồi nhấn <b>Enter</b>. Một cửa sổ đen (CMD) hiện ra.</li>
        <li>Gõ <code>node -v</code> rồi nhấn Enter. Hiện ra số phiên bản (ví dụ <code>v26.13.1</code>) là đã cài xong.</li>
        <li>Gõ thêm <code>npm -v</code> rồi Enter, cũng phải hiện ra số phiên bản.</li>
      </ol>
      ${fig('13-kiem-tra-node-v.jpg', 'Gõ node -v và npm -v trong CMD hiện số phiên bản', 1407, 494)}
      <div class="hd-note">⚠️ Nếu báo <i>'node' is not recognized…</i> (không nhận lệnh node): khởi động lại máy rồi thử lại. Vẫn báo thì cài lại Node.js theo Bước 2.</div>

      <h2 id="giai-nen">Bước 4: Giải nén game</h2>
      <ol>
        <li>Vào <a href="/tai-khoan.html">Tài khoản của tôi</a>, bấm <b>⬇ Tải về</b> ở game đã mua.</li>
        <li>Chuột phải vào file ZIP › <b>Extract All… (Giải nén tất cả)</b> › chọn thư mục, ví dụ <code>D:\\${esc(i.folder)}</code>.</li>
        <li><b>Không</b> chạy game ngay bên trong file ZIP, phải giải nén ra trước.</li>
      </ol>

      <h2 id="chay-game">Bước 5: Chạy game (cách nhanh: bấm đúp file .bat)</h2>
      <ol>
        <li>Mở thư mục vừa giải nén, <b>bấm đúp</b> file <code>${esc(i.run)}</code>${picked ? '' : ' (mỗi game có tên file riêng, xem bảng ở cuối bài)'}.</li>
        <li>Windows hiện <i>"Windows protected your PC"</i> thì bấm <b>More info › Run anyway</b>.</li>
        <li>Một <b>cửa sổ CMD màu đen</b> mở ra. <b>Lần đầu</b> nó hiện <code>Dang cai thu vien lan dau...</code> và tự tải thư viện, mất khoảng 1–2 phút (cần có mạng). Các lần sau chạy ngay.</li>
      </ol>
      ${fig('15-chay-lan-dau-cai-thu-vien.jpg', 'Cửa sổ CMD lần đầu tự cài thư viện rồi hiện đường dẫn game', 1407, 462)}
      <ol start="4">
        <li>Chạy xong, cửa sổ CMD hiện dòng <b>"… đã chạy"</b> kèm đường dẫn màn hình game và bảng điều khiển, trình duyệt tự mở trang <b>Kích hoạt</b> / <b>Bảng điều khiển</b>.</li>
      </ol>
      ${fig('16-cmd-dang-chay-that.jpg', 'Cửa sổ CMD khi game đã chạy, hiện đường dẫn màn hình game', 977, 140, 'Ảnh thật: game đã chạy, CMD hiện đường dẫn để thêm vào LIVE Studio')}
      <div class="hd-note">🔴 <b>Giữ cửa sổ CMD mở suốt buổi LIVE</b>, có thể thu nhỏ xuống thanh tác vụ. Tắt cửa sổ này là game dừng.<br>
      Đừng bấm chuột vào bên trong cửa sổ CMD: Windows sẽ "tạm dừng" để bôi đen chữ (tiêu đề có chữ <i>Select</i>) làm game đứng. Lỡ bấm thì nhấn phím <b>Esc</b> là chạy tiếp.</div>

      <h2 id="lenh-tay">Cách 2: Chạy bằng lệnh CMD (khi bấm .bat không chạy)</h2>
      <ol>
        <li>Mở thư mục game, bấm vào <b>thanh địa chỉ</b> phía trên, xóa hết chữ, gõ <code>cmd</code> rồi nhấn <b>Enter</b>. Cửa sổ CMD mở sẵn đúng thư mục game.</li>
      </ol>
      ${fig('14-mo-cmd-trong-thu-muc.jpg', 'Gõ cmd vào thanh địa chỉ thư mục game rồi nhấn Enter', 1407, 512)}
      <ol start="2">
        <li>Lần đầu, gõ <code>npm install</code> rồi Enter, chờ báo <i>added … packages</i>.</li>
        <li>Gõ <code>node server.js</code> rồi Enter để chạy game.</li>
        <li>Mở trình duyệt, vào trang bảng điều khiển <code>${i.control}</code>.</li>
      </ol>
      ${fig('17-chay-bang-lenh-tay.jpg', 'Gõ npm install rồi node server.js trong CMD', 1407, 494)}

      <h2 id="kich-hoat">Bước 6: Kích hoạt key và kết nối TikTok</h2>
      <ol>
        <li>Trang <b>Kích hoạt</b>: dán license key (dạng <code>LG-XXXX-XXXX-XXXX-XXXX</code>) › bấm <b>Kích hoạt</b>.</li>
        <li>Ở <b>Bảng điều khiển</b>: bấm các nút Giả lập để thử. Bắt đầu LIVE rồi nhập <b>username TikTok</b> (không có @) › bấm <b>Kết nối</b>.</li>
        <li>Đưa màn hình game lên LIVE cho nét: làm theo bài <a href="${GUIDE_LIVE_NET}${q}">tăng độ phân giải khi LIVE</a>.</li>
      </ol>

      <h2 id="tung-game">File chạy và đường dẫn của từng game</h2>
      ${linkTable(games, picked, 'node')}

      <h2 id="loi">Lỗi thường gặp</h2>
      <ul>
        <li><b>"'npm' / 'node' is not recognized"</b>: chưa cài Node.js hoặc chưa khởi động lại máy sau khi cài.</li>
        <li><b>"Cổng 3000 đang bị một chương trình khác dùng"</b>: bản game cũ còn chạy ngầm. Mở CMD gõ <code>taskkill /F /IM node.exe</code> rồi chạy lại file .bat.</li>
        <li><b>Lần đầu cài thư viện báo lỗi mạng</b>: kiểm tra Internet, tắt tạm VPN, rồi bấm đúp file .bat lại.</li>
        <li><b>CMD mở ra rồi tắt ngay</b>: thường do chạy bên trong file ZIP. Giải nén ra thư mục rồi chạy lại.</li>
        <li><b>Kết nối TikTok báo "Failed to retrieve Room ID"</b>: phải đang LIVE thật, tài khoản TikTok để <b>công khai</b> và người xem LIVE là <b>Mọi người</b>, gõ đúng username.</li>
        <li><b>Phần mềm diệt virus chặn</b>: cho phép (Allow) thư mục game và Node.js.</li>
      </ul>
      <p>Vẫn chưa được? ${help}</p>
      ${otherBox('node', q)}
      ${copyScript}`;
}
