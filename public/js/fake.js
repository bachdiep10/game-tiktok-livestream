// Dữ liệu giả để chạy thử không cần LIVE thật
const FIRST = ['Minh', 'Lan', 'Hùng', 'Thảo', 'Tuấn', 'Ngọc', 'Phúc', 'Hạnh', 'Khang', 'Vy', 'An', 'Bảo', 'Trang', 'Duy', 'Mai', 'Quân', 'Linh', 'Tâm', 'Hiếu', 'Nhi'];
const LAST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Huỳnh'];
const NICK = ['bé', 'cô', 'anh', 'chị', '', '', ''];
const CHATS = [
  'Nam mô A Di Đà Phật',
  'nam mo a di da phat',
  'Nam mô',
  'A Di Đà Phật 🙏',
  'Cầu cho gia đình bình an',
  'Cầu cho mẹ mau khỏe',
  'Tịnh tâm tịnh tâm',
  'Con xin thành tâm sám hối',
  'Cầu thi tốt',
  'Chúc mọi người an lạc',
  'Xin chào cả nhà',
  'Hôm nay nghe kinh thấy nhẹ lòng',
  'Mong công việc thuận lợi',
  '🙏🙏🙏',
];
const GIFTS = [
  { giftName: 'Hoa hồng', diamonds: 1 },
  { giftName: 'Hoa hồng', diamonds: 1 },
  { giftName: 'Kẹo bông', diamonds: 1 },
  { giftName: 'Nến thơm', diamonds: 5 },
  { giftName: 'Bánh Donut', diamonds: 30 },
  { giftName: 'Mũ hoa', diamonds: 99 },
  { giftName: 'Đèn hoa đăng', diamonds: 199 },
  { giftName: 'Thiên nga', diamonds: 699 },
];

let seq = 0;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function randomUser() {
  seq++;
  const name = Math.random() < 0.5
    ? `${pick(NICK)} ${pick(FIRST)}`.trim()
    : `${pick(LAST)} ${pick(FIRST)}${Math.random() < 0.3 ? ` ${Math.floor(Math.random() * 99)}` : ''}`;
  return { id: `sim-${Date.now().toString(36)}-${seq}`, uniqueId: `user${seq}`, name, avatar: '' };
}

export function randomChat() {
  return pick(CHATS);
}

export function randomGift(minCoins = 0) {
  const pool = GIFTS.filter((g) => g.diamonds >= minCoins);
  const g = pick(pool.length ? pool : GIFTS);
  const repeatCount = g.diamonds < 10 ? 1 + Math.floor(Math.random() * 5) : 1;
  return { ...g, repeatCount, coins: g.diamonds * repeatCount };
}

export { GIFTS };
