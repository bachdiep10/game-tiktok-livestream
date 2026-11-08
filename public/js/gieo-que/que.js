// Chủ đề xin xăm, mức quẻ và lời giải theo chủ đề cho game Gieo Quẻ.
// Nội dung 100 quẻ (số, tên, thơ, ý quẻ) ở que-data.js.
export { QUE } from './que-data.js';

export const GRADES = {
  thuong: { id: 'thuong', name: 'Thượng quẻ', label: 'THƯỢNG QUẺ', sub: 'Đại cát', color: '#ffd54f', glow: '#fff3b0', rank: 3 },
  tot: { id: 'tot', name: 'Cát quẻ', label: 'CÁT QUẺ', sub: 'Tốt lành', color: '#81c784', glow: '#c8f7c5', rank: 2 },
  trung: { id: 'trung', name: 'Trung bình', label: 'TRUNG BÌNH', sub: 'Bình ổn', color: '#90caf9', glow: '#d6ecff', rank: 1 },
  ha: { id: 'ha', name: 'Hạ quẻ', label: 'HẠ QUẺ', sub: 'Cần cẩn trọng', color: '#ef9a9a', glow: '#ffd6d6', rank: 0 },
};
export const GRADE_ORDER = ['ha', 'trung', 'tot', 'thuong'];

// từ khoá (đã bỏ dấu) để nhận chủ đề từ câu bình luận của người xem
export const TOPICS = [
  { id: 'cd', name: 'Công danh', color: '#ffb74d', words: ['cong danh', 'cong viec', 'su nghiep', 'viec lam', 'thang chuc', 'thang tien', 'xin viec', 'lam viec', 'cong ty', 'sep', 'cong tac'] },
  { id: 'tl', name: 'Tài lộc', color: '#ffd54f', words: ['tai loc', 'tien', 'tien bac', 'tien tai', 'buon ban', 'kinh doanh', 'lam an', 'giau', 'phat tai', 'no nan', 'tra no', 'lo de', 'xo so', 'dau tu', 'ban hang', 'loc'] },
  { id: 'td', name: 'Tình duyên', color: '#f48fb1', words: ['tinh duyen', 'tinh yeu', 'nguoi yeu', 'nhan duyen', 'ket hon', 'lay chong', 'lay vo', 'cuoi', 'crush', 'chong', 'vo', 'ny', 'yeu', 'duyen', 'hon nhan', 'ex', 'quay lai'] },
  { id: 'gd', name: 'Gia đạo', color: '#a5d6a7', words: ['gia dao', 'gia dinh', 'nha cua', 'bo me', 'cha me', 'con cai', 'vo chong', 'anh em', 'binh an', 'an lanh', 'nha cua'] },
  { id: 'sk', name: 'Sức khỏe', color: '#80deea', words: ['suc khoe', 'benh', 'om', 'khoe', 'mo', 'phau thuat', 'chua benh', 'sinh con', 'mang thai', 'bau'] },
  { id: 'tc', name: 'Thi cử', color: '#b39ddb', words: ['thi cu', 'thi', 'hoc', 'hoc hanh', 'hoc tap', 'dau', 'do dai hoc', 'tot nghiep', 'bang', 'phong van', 'thi do'] },
  { id: 'xh', name: 'Xuất hành', color: '#bcaaa4', words: ['xuat hanh', 'di xa', 'du lich', 'chuyen nha', 'nha moi', 'di lam xa', 'xuat khau lao dong', 'di nuoc ngoai', 've que', 'dong tho', 'khai truong'] },
];
export const topicById = (id) => TOPICS.find((t) => t.id === id) || null;

// lời giải theo chủ đề và mức quẻ (mỗi ô vài câu để không lặp)
export const READ = {
  cd: {
    thuong: ['Công danh rộng mở, có người trên nâng đỡ. Việc đang làm sẽ được ghi nhận, có thể thăng tiến.', 'Đúng thời cơ để nhận việc lớn hoặc xin vị trí mới. Cứ mạnh dạn mà làm.', 'Sự nghiệp lên như diều gặp gió, đề xuất của bạn dễ được chấp thuận.'],
    tot: ['Công việc thuận lợi, chịu khó thêm một chút sẽ thấy kết quả.', 'Có cơ hội mới đến từ người quen. Làm tốt việc trước mắt là sẽ được để ý.', 'Đồng nghiệp hỗ trợ, công việc trôi chảy, sếp hài lòng.'],
    trung: ['Công việc bình ổn, chưa nên nhảy việc. Tích lũy thêm kinh nghiệm rồi hãy tính.', 'Có chút trắc trở nhỏ nhưng không đáng lo. Làm chậm mà chắc.', 'Chưa phải lúc bứt phá, giữ vững vị trí là tốt rồi.'],
    ha: ['Công việc dễ gặp thị phi, nói ít làm nhiều. Chưa nên đổi việc lúc này.', 'Có người cạnh tranh không lành mạnh, cẩn thận giấy tờ, hợp đồng.', 'Việc dễ bị trì hoãn, đừng nóng vội mà hỏng việc.'],
  },
  tl: {
    thuong: ['Tài lộc dồi dào, làm ăn có lãi, tiền vào như nước. Có thể có lộc bất ngờ.', 'Buôn bán hanh thông, đầu tư đúng chỗ sẽ sinh lời tốt.', 'Tiền bạc sung túc, nợ cũ đòi được, lộc mới gõ cửa.'],
    tot: ['Tiền bạc đủ đầy, có khoản thu thêm. Chi tiêu hợp lý là dư dả.', 'Làm ăn có lời, khách hàng tìm tới. Giữ uy tín là giữ lộc.', 'Có quý nhân mang lộc tới, nhưng đừng tham làm lớn quá sức.'],
    trung: ['Tiền vào tiền ra cân bằng, chưa nên vay mượn làm lớn.', 'Tài lộc bình thường, chịu khó tích góp sẽ có của để dành.', 'Có lộc nhỏ, đừng mạo hiểm với những khoản lớn lúc này.'],
    ha: ['Dễ hao tài, cẩn thận cho vay mượn và các lời mời đầu tư hấp dẫn.', 'Tiền bạc dễ thất thoát, giữ chặt túi, đừng ham lợi trước mắt.', 'Chưa nên ký kết, mua bán lớn. Tiết kiệm qua mùa này đã.'],
  },
  td: {
    thuong: ['Duyên lành đã tới, người ấy cũng đang hướng về bạn. Hợp để tỏ tình hoặc tính chuyện trăm năm.', 'Tình cảm mặn nồng, gia đình hai bên ủng hộ. Rất tốt cho cưới hỏi.', 'Người độc thân sắp gặp người hợp ý, người có đôi thì càng thêm gắn bó.'],
    tot: ['Tình duyên thuận lợi, chân thành sẽ được đáp lại.', 'Có người để ý bạn đó. Mở lòng ra một chút là thấy ngay.', 'Hai người hiểu nhau hơn, giận hờn nhỏ sẽ qua nhanh.'],
    trung: ['Tình cảm cần thêm thời gian vun đắp, đừng vội vàng.', 'Duyên chưa chín, cứ thoải mái làm quen, đừng ép.', 'Hai người cần nói chuyện thẳng thắn hơn để hiểu nhau.'],
    ha: ['Tình cảm dễ có hiểu lầm, bớt nghi ngờ, bớt nóng giận.', 'Người ấy chưa thật lòng, hãy tỉnh táo trước lời ngọt ngào.', 'Chuyện cũ chưa nên quay lại. Thương mình trước đã.'],
  },
  gd: {
    thuong: ['Gia đạo hưng vượng, trên thuận dưới hòa, nhà có tin vui.', 'Cả nhà bình an, con cháu hiếu thảo, có thể có hỷ sự.', 'Nhà cửa yên ấm, làm gì cũng được người nhà ủng hộ.'],
    tot: ['Gia đình êm ấm, có chuyện vui nhỏ. Hợp sửa sang nhà cửa.', 'Người nhà quan tâm nhau, mâu thuẫn cũ được hóa giải.', 'Gia đạo yên ổn, dành thời gian cho bố mẹ sẽ thêm phúc.'],
    trung: ['Gia đình bình thường, có vài chuyện nhỏ cần nhường nhịn.', 'Trong nhà nên bàn bạc nhiều hơn, đừng giữ trong lòng.', 'Yên ổn nhưng cần quan tâm sức khỏe người lớn tuổi.'],
    ha: ['Trong nhà dễ to tiếng, một câu nhịn chín câu lành.', 'Cẩn thận chuyện tiền bạc giữa người thân, rõ ràng thì êm.', 'Gia đạo có chút xáo trộn, làm việc thiện và nói lời hay để giữ yên ấm.'],
  },
  sk: {
    thuong: ['Sức khỏe dồi dào, bệnh cũ thuyên giảm, tinh thần phấn chấn.', 'Gặp thầy giỏi thuốc hay, chữa bệnh mau khỏi.', 'Thân khỏe tâm an, làm việc gì cũng có sức.'],
    tot: ['Sức khỏe tốt, chỉ cần ăn ngủ điều độ.', 'Bệnh nhẹ mau qua, cứ yên tâm điều trị.', 'Tinh thần vui vẻ là thuốc quý, sức khỏe ổn định.'],
    trung: ['Sức khỏe tạm ổn, nhưng nên nghỉ ngơi nhiều hơn.', 'Để ý dạ dày và giấc ngủ, đừng thức khuya.', 'Nên đi khám định kỳ cho yên tâm.'],
    ha: ['Cẩn thận va chạm, đi đường chậm lại. Có bệnh nên đi khám sớm.', 'Sức khỏe hơi yếu, đừng làm quá sức, giữ ấm cơ thể.', 'Bớt lo nghĩ, bớt rượu bia. Nghe lời bác sĩ là qua.'],
  },
  tc: {
    thuong: ['Thi cử đỗ đạt cao, đề trúng phần mình giỏi. Bảng vàng có tên.', 'Học hành tấn tới, phỏng vấn hay thi tuyển đều thuận.', 'Văn chương sáng sủa, công sức ôn luyện được đền đáp xứng đáng.'],
    tot: ['Thi cử thuận lợi, ôn kỹ phần cơ bản là đỗ.', 'Có thầy cô, bạn bè giúp đỡ, học đâu nhớ đó.', 'Kết quả tốt nếu giữ bình tĩnh trong phòng thi.'],
    trung: ['Kết quả vừa sức, cần chăm hơn nữa mới mong điểm cao.', 'Đừng chủ quan, ôn lại phần còn yếu.', 'Đỗ nhưng chưa như ý, cố thêm sẽ khá hơn.'],
    ha: ['Học hành dễ xao nhãng, bỏ điện thoại xuống mà ôn bài.', 'Dễ sơ suất, đọc kỹ đề, kiểm tra lại bài.', 'Chưa tới lúc, chuẩn bị kỹ hơn rồi hẵng thi.'],
  },
  xh: {
    thuong: ['Xuất hành đại cát, đi xa gặp may, làm ăn nơi xa có lộc.', 'Chuyển nhà, khai trương đều tốt, có quý nhân phương xa giúp.', 'Đi đâu cũng thuận buồm xuôi gió, về có tin vui.'],
    tot: ['Đi xa bình an, công việc ở xa thuận lợi.', 'Hợp đi du lịch, gặp gỡ bạn bè, mở rộng quan hệ.', 'Chuyển chỗ ở hay chỗ làm đều ổn.'],
    trung: ['Đi được nhưng nên chuẩn bị kỹ, xem lại giấy tờ.', 'Chuyến đi có chút trễ hẹn, đi sớm cho thong thả.', 'Chưa cần đi xa, việc gần nhà cũng có kết quả.'],
    ha: ['Chưa nên đi xa, nếu đi phải cẩn thận đồ đạc và giấy tờ.', 'Hoãn chuyển nhà, khai trương sang dịp khác tốt hơn.', 'Đường xa dễ trắc trở, đi đứng cẩn thận, tránh đi đêm.'],
  },
};

export const LUCKY_COLORS = ['đỏ', 'vàng', 'xanh lá', 'trắng', 'tím', 'hồng', 'xanh dương', 'cam'];
export const DIRECTIONS = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Tây Nam', 'Đông Bắc', 'Tây Bắc'];
