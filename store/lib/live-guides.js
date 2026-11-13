// 2 bài hướng dẫn gắn vào từng game:
//   /huong-dan/livestream-game-net-cang  : tăng độ phân giải khi LIVE (cài đặt video + nguồn Liên kết)
//   /huong-dan/cai-nodejs-chay-game      : cài Node.js và chạy game bằng CMD
//   /huong-dan/choi-game-livestream-tren-mac : chạy game trên máy Mac + LIVE TikTok bằng OBS
// Thêm ?game=<id> để làm nổi bật đúng đường dẫn / file của game khách đã mua.
import { liveInfo, GUIDE_LIVE_NET, GUIDE_NODEJS, GUIDE_MAC } from '../web/js/live-guide.js';

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
  mac: {
    path: GUIDE_MAC,
    title: 'Hướng dẫn chơi game livestream TikTok trên máy Mac (macOS): chạy game + LIVE bằng OBS',
    short: 'Máy Mac: chạy game + LIVE bằng OBS',
    desc: 'Chạy game tương tác TikTok LIVE trên MacBook, iMac, Mac mini: cài Node.js, bấm đúp file .command, kích hoạt key, rồi LIVE lên TikTok bằng OBS Studio và stream key vì TikTok LIVE Studio chưa có bản cho Mac.',
    image: `${IMG}21-mac-file-command.jpg`,
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

// ---------- Bài cho máy Mac ----------
function macTable(games, picked) {
  return `<div class="hd-table"><table><thead><tr><th>Game</th><th>File chạy trên Mac (bấm đúp)</th><th>Màn hình game (dán vào OBS)</th></tr></thead><tbody>${games.map(g => {
    const i = liveInfo(g.id);
    const on = picked && picked.id === g.id ? ' class="on"' : '';
    return `<tr${on}><td><a href="/game/${esc(g.id)}">${esc(g.name)}</a></td><td><code>${esc(i.macRun)}</code></td><td><code>${i.url}</code></td></tr>`;
  }).join('')}</tbody></table></div>`;
}

export function macBody({ games, picked, help }) {
  const q = picked ? `?game=${encodeURIComponent(picked.id)}` : '';
  const i = liveInfo(picked ? picked.id : 'go-bom');
  const pick = picked ? `<div class="hd-pick"><b>🎮 Bạn đang xem hướng dẫn cho game ${esc(picked.name)}</b><ul>
      <li>File chạy trên Mac: <code>${esc(i.macRun)}</code></li>
      <li>Màn hình game (dán vào OBS): <code class="hd-url">${i.url}</code> <button type="button" class="btn sm ghost" data-copy="${i.url}">Sao chép</button></li>
      <li>Bảng điều khiển: <code>${i.control}</code></li></ul></div>` : '';
  return `
      <h1>${esc(LIVE_ARTICLES.mac.title)}</h1>
      <p class="sub">Dùng cho MacBook, iMac, Mac mini chạy macOS 13 trở lên (chip Apple M1/M2/M3/M4 hoặc chip Intel). Làm lần đầu khoảng 15 phút.</p>
      ${pick}
      <p>Game của cửa hàng chạy được trên cả <b>Windows</b> và <b>Mac</b>, dùng chung <b>1 license key</b>. Khác biệt duy nhất: trên Mac bạn tải <b>bản cho Mac</b> (file chạy đuôi <code>.command</code> thay cho <code>.bat</code>), và vì <b>TikTok LIVE Studio chưa có bản cho Mac</b> nên khi LIVE bạn dùng phần mềm miễn phí <b>OBS Studio</b> kèm <b>khoá phát trực tiếp (stream key)</b> của TikTok.</p>
      <div class="hd-note">⚠️ <b>Đọc trước khi mua cho máy Mac:</b> TikTok chỉ cấp <b>stream key</b> cho tài khoản đã được mở LIVE trên máy tính (thường cần từ 18 tuổi, đủ người theo dõi, không vi phạm). Hãy kiểm tra trước ở <a href="#stream-key">Bước 6</a>. Chưa có stream key thì vẫn chạy và thử game trên Mac được, nhưng để LIVE bạn cần một máy Windows có TikTok LIVE Studio (xem <a href="${GUIDE_NODEJS}${q}">bài cho Windows</a>).</div>

      <h2 id="nodejs">Bước 1: Cài Node.js cho Mac (1 lần)</h2>
      <ol>
        <li>Vào <a href="https://nodejs.org/en/download" target="_blank" rel="noopener">nodejs.org/en/download</a>, giữ bản có chữ <b>LTS</b>, hệ điều hành <b>macOS</b>.</li>
        <li>Bấm nút <b>macOS Installer (.pkg)</b> để tải file cài (một file cho cả chip Apple và chip Intel).</li>
        <li>Mở file <code>node-v…pkg</code> trong thư mục <b>Tải về (Downloads)</b> › bấm <b>Tiếp tục</b> › <b>Đồng ý</b> › <b>Cài đặt</b>, nhập mật khẩu máy Mac › <b>Đóng</b>.</li>
      </ol>
      <div class="hd-note">💡 Kiểm tra: mở ứng dụng <b>Terminal</b> (bấm <b>⌘ + Space</b>, gõ <i>Terminal</i>, Enter), gõ <code>node -v</code> rồi Enter. Hiện ra số phiên bản (ví dụ <code>v24.11.0</code>) là đã cài xong. Nếu quên bước này, file chạy game sẽ tự mở trang tải Node.js cho bạn.</div>

      <h2 id="tai-game">Bước 2: Tải bản cho Mac và giải nén</h2>
      <ol>
        <li>Vào <a href="/tai-khoan.html">Tài khoản của tôi</a>, ở game đã mua bấm nút đen <b>⬇ Tải cho Mac</b> (nút hồng <i>Tải cho Windows</i> là bản cho máy Windows).</li>
        <li>Mở thư mục <b>Tải về</b>, <b>bấm đúp</b> file <code>${esc(i.folder)}-…-Mac.zip</code>. Mac tự giải nén ra thư mục <code>${esc(i.folder)}</code>.</li>
        <li>Kéo thư mục <code>${esc(i.folder)}</code> sang chỗ dễ tìm, ví dụ thư mục <b>Tài liệu (Documents)</b>.</li>
      </ol>
      ${fig('21-mac-file-command.jpg', 'Thư mục game trên Mac có file chạy đuôi .command', 1200, 700, 'Minh hoạ: thư mục game bản Mac, bấm đúp file đuôi .command để chạy')}

      <h2 id="chay-game">Bước 3: Bấm đúp file .command để chạy game</h2>
      <ol>
        <li>Trong thư mục game, <b>bấm đúp</b> file <code>${esc(i.macRun)}</code>${picked ? '' : ' (mỗi game có tên file riêng, xem bảng cuối bài)'}.</li>
        <li><b>Lần đầu</b> macOS thường chặn vì file tải từ Internet: hiện bảng <i>"Không thể mở … vì Apple không thể kiểm tra phần mềm độc hại"</i>. Bấm <b>Xong</b>, rồi làm tiếp bước 3 bên dưới.</li>
        <li>Mở <b>Cài đặt hệ thống › Quyền riêng tư &amp; Bảo mật</b>, kéo xuống phần <b>Bảo mật</b>, thấy dòng tên file game › bấm <b>Vẫn mở</b> (Open Anyway), nhập mật khẩu máy, rồi bấm <b>Mở</b>. Chỉ làm 1 lần, các lần sau bấm đúp là chạy.</li>
      </ol>
      ${fig('22-mac-van-mo.jpg', 'Cài đặt hệ thống, Quyền riêng tư và Bảo mật, bấm Vẫn mở', 1200, 760, 'Minh hoạ: Cài đặt hệ thống › Quyền riêng tư & Bảo mật › Vẫn mở')}
      <ol start="4">
        <li>Cửa sổ <b>Terminal</b> mở ra. Lần đầu nó hiện <code>Đang cài thư viện lần đầu…</code> và tự tải thư viện 1–2 phút (cần mạng). Xong thì trình duyệt tự mở trang <b>Kích hoạt</b> / <b>Bảng điều khiển</b>.</li>
      </ol>
      <div class="hd-note">🔴 <b>Giữ cửa sổ Terminal mở suốt buổi LIVE</b> (có thể thu nhỏ). Đóng nó là game dừng. Muốn tắt game: bấm vào cửa sổ Terminal rồi nhấn <b>Control + C</b>.<br>
      macOS 14 (Sonoma) trở về trước còn cách nhanh: giữ phím <b>Control</b> + bấm vào file › <b>Mở</b> › <b>Mở</b>.</div>
      <p><b>Cách dự phòng</b> (khi bấm đúp không chạy): mở <b>Terminal</b>, gõ chữ <code>bash</code> và <b>một dấu cách</b>, kéo file <code>${esc(i.macRun)}</code> thả vào cửa sổ Terminal, nhấn <b>Enter</b>.</p>

      <h2 id="kich-hoat">Bước 4: Kích hoạt key</h2>
      <ol>
        <li>Trang <b>Kích hoạt</b> (<code>http://127.0.0.1:3000/kich-hoat.html</code>): dán license key dạng <code>LG-XXXX-XXXX-XXXX-XXXX</code> › bấm <b>Kích hoạt</b>.</li>
        <li><b>1 key chạy trên 1 máy</b> tại một thời điểm, Windows hay Mac đều được. Key đang dùng ở máy Windows mà muốn chuyển sang Mac: vào <a href="/tai-khoan.html">Tài khoản</a> hoặc <a href="/tra-cuu.html">Tra cứu key</a> › <b>Chuyển máy</b>, rồi kích hoạt lại trên Mac.</li>
      </ol>

      <h2 id="obs">Bước 5: Cài OBS Studio và thêm màn hình game</h2>
      <ol>
        <li>Tải OBS Studio miễn phí ở <a href="https://obsproject.com/download" target="_blank" rel="noopener">obsproject.com/download</a>, chọn <b>macOS</b> (bản <i>Apple Silicon</i> cho máy chip M, bản <i>Intel</i> cho máy cũ). Mở file .dmg, kéo OBS vào thư mục <b>Ứng dụng</b>.</li>
        <li>Mở OBS, cho phép quyền <b>Micro</b> nếu bạn muốn nói khi LIVE. Bấm <b>Cài đặt (Settings) › Video</b>: <b>Độ phân giải nền</b> và <b>Độ phân giải đầu ra</b> đều gõ <code>1080x1920</code> (khung dọc), <b>FPS</b> chọn <b>30</b> › <b>OK</b>.</li>
        <li>Ở ô <b>Nguồn (Sources)</b> bấm <b>+</b> › chọn <b>Trình duyệt (Browser)</b> › đặt tên "Game" › <b>OK</b>.</li>
        <li>Ô <b>URL</b> dán <code>${i.url}</code>. <b>Chiều rộng</b> <code>1080</code>, <b>Chiều cao</b> <code>1920</code>. Tích <b>Điều khiển âm thanh qua OBS</b> (Control audio via OBS) để người xem nghe nhạc, giọng đọc của game. <b>Không</b> tích "Tắt nguồn khi không hiển thị" › <b>OK</b>.</li>
      </ol>
      ${fig('23-obs-nguon-trinh-duyet.jpg', 'OBS nguồn Trình duyệt: dán đường dẫn game, 1080 x 1920, điều khiển âm thanh qua OBS', 1200, 820, 'Minh hoạ: OBS › Nguồn › Trình duyệt › dán đường dẫn game, 1080 × 1920')}
      <div class="hd-note">💡 Nguồn Trình duyệt cho hình <b>nét căng, không viền đen</b> và lấy luôn tiếng game, không cần mở cửa sổ game riêng. Muốn xem thử game trong cửa sổ riêng thì bấm đúp <code>${esc(i.macWin)}</code> (cần Google Chrome hoặc Microsoft Edge). Khi LIVE bằng OBS thì đóng cửa sổ đó để không bị lặp tiếng.</div>

      <h2 id="stream-key">Bước 6: Lấy stream key TikTok và LIVE bằng OBS</h2>
      <ol>
        <li>Trên Mac, mở trình duyệt, đăng nhập <a href="https://www.tiktok.com" target="_blank" rel="noopener">tiktok.com</a>, vào trang <a href="https://livecenter.tiktok.com/producer" target="_blank" rel="noopener">TikTok LIVE Producer</a> (hoặc bấm <b>LIVE</b> trên tiktok.com).</li>
        <li>Chọn chủ đề, đặt tiêu đề phiên LIVE. Trang hiện <b>URL máy chủ (Server URL)</b> và <b>Khoá phát trực tiếp (Stream Key)</b>. Không thấy 2 ô này nghĩa là tài khoản <b>chưa được TikTok cấp quyền</b> LIVE bằng phần mềm (xem lưu ý đầu bài).</li>
        <li>Trong OBS: <b>Cài đặt › Phát trực tiếp (Stream)</b> › <b>Dịch vụ: Tùy chỉnh (Custom)</b> › dán <b>Server URL</b> vào ô <b>Máy chủ</b>, dán <b>Stream Key</b> vào ô <b>Khoá luồng</b> › <b>OK</b>.</li>
        <li><b>Cài đặt › Đầu ra (Output)</b>: Tốc độ bit video <code>4000–6000 Kbps</code>, Bộ mã hoá <b>Apple VT H264 (phần cứng)</b>. Mạng yếu thì hạ xuống 3000.</li>
        <li>Bấm <b>Bắt đầu phát trực tiếp</b> trong OBS, sau đó quay lại trang TikTok bấm <b>Phát trực tiếp / Go LIVE</b>.</li>
      </ol>
      ${fig('24-obs-stream-key.jpg', 'OBS Cài đặt Phát trực tiếp: dịch vụ Tùy chỉnh, dán Server URL và Stream Key của TikTok', 1200, 700, 'Minh hoạ: OBS › Cài đặt › Phát trực tiếp › Tùy chỉnh › dán Server URL + Stream Key')}
      <div class="hd-note">🔑 Stream key của TikTok <b>thường đổi sau mỗi phiên LIVE</b>. Mỗi lần LIVE mới hãy chép lại key mới từ trang TikTok vào OBS. Không gửi stream key cho người khác.</div>

      <h2 id="ket-noi">Bước 7: Kết nối game với phiên LIVE</h2>
      <ol>
        <li>Khi đã LIVE, mở <b>Bảng điều khiển</b> của game: <code>${i.control}</code>.</li>
        <li>Nhập <b>username TikTok</b> (không có @) › bấm <b>Kết nối</b>. Người xem thả tim, bình luận, chia sẻ, tặng quà là game phản ứng ngay trên OBS.</li>
        <li>Chưa LIVE thì dùng các nút <b>Giả lập</b> trong Bảng điều khiển để thử game trước.</li>
      </ol>

      <h2 id="tung-game">File chạy và đường dẫn của từng game (bản Mac)</h2>
      ${macTable(games, picked)}

      <h2 id="loi">Lỗi thường gặp trên Mac</h2>
      <ul>
        <li><b>Bấm đúp mở ra trình soạn thảo / không chạy</b>: bạn đang dùng bản Windows. Tải lại bằng nút <b>⬇ Tải cho Mac</b>, hoặc dùng cách dự phòng <code>bash</code> + kéo file ở Bước 3.</li>
        <li><b>"Không thể mở" và không thấy nút Vẫn mở</b>: bấm đúp file 1 lần nữa, rồi mở lại <b>Quyền riêng tư &amp; Bảo mật</b> ngay sau đó (nút chỉ hiện trong khoảng 1 giờ sau lần bị chặn).</li>
        <li><b>"permission denied"</b>: mở Terminal, gõ <code>chmod +x </code> (có dấu cách), kéo file .command vào, Enter, rồi bấm đúp lại.</li>
        <li><b>"node: command not found"</b>: chưa cài Node.js (Bước 1), hoặc cài xong chưa đóng hết cửa sổ Terminal cũ.</li>
        <li><b>"Cổng 3000 đang bị chương trình khác dùng"</b>: file chạy đã tự tắt bản cũ; nếu vẫn báo, khởi động lại máy Mac rồi chạy lại.</li>
        <li><b>OBS không có tiếng game</b>: mở lại nguồn Trình duyệt, tích <b>Điều khiển âm thanh qua OBS</b>; kiểm tra thanh âm lượng nguồn "Game" trong ô <b>Bộ trộn âm thanh</b>.</li>
        <li><b>Khung OBS trắng / báo lỗi</b>: cửa sổ Terminal đã bị đóng hoặc chưa kích hoạt key. Chạy lại file .command, rồi bấm chuột phải nguồn "Game" › <b>Làm mới</b>.</li>
        <li><b>Kết nối TikTok báo "Failed to retrieve Room ID"</b>: phải đang LIVE thật, tài khoản TikTok để <b>công khai</b>, gõ đúng username.</li>
      </ul>
      <p>Vẫn chưa được? ${help}</p>
      <div class="hd-next">📖 Dùng máy Windows? Xem <a href="${GUIDE_NODEJS}${q}">${esc(LIVE_ARTICLES.node.title)}</a></div>
      ${copyScript}`;
}
