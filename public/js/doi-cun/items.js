// Tủ đồ của game "Đội Cún Quậy": 6 bộ x 4 món (mũ, kính, áo, phụ kiện) = 24 món, chia 3 hạng.
// Mũ và phụ kiện là ảnh (emoji 3D Fluent có sẵn, hoặc ảnh riêng do-<id>.png trong public/assets/doi-cun).
// Kính và áo vẽ bằng code (khít với dáng cún).
export const RARITY = {
  thuong: { name: 'Thường', color: '#c7cdd6', glow: '#ffffff', bonus: 0.05 },
  hiem: { name: 'Hiếm', color: '#4fb3ff', glow: '#9fd8ff', bonus: 0.1 },
  huyenthoai: { name: 'Huyền thoại', color: '#ffc928', glow: '#fff1a0', bonus: 0.2 },
};

export const SLOTS = ['hat', 'glasses', 'shirt', 'acc'];
export const SLOT_NAME = { hat: 'Mũ', glasses: 'Kính', shirt: 'Áo', acc: 'Phụ kiện' };

export const SETS = [
  { id: 'di-bien', name: 'Đi biển', rarity: 'thuong', dance: 'Điệu nhảy bãi biển' },
  { id: 'tot-nghiep', name: 'Tốt nghiệp', rarity: 'thuong', dance: 'Điệu nhảy thủ khoa' },
  { id: 'ngoi-sao', name: 'Ngôi sao', rarity: 'hiem', dance: 'Điệu nhảy idol' },
  { id: 'ao-thuat', name: 'Ảo thuật gia', rarity: 'hiem', dance: 'Điệu nhảy phép thuật' },
  { id: 'nha-vua', name: 'Nhà vua', rarity: 'huyenthoai', dance: 'Điệu nhảy hoàng gia' },
  { id: 'thien-than', name: 'Thiên thần', rarity: 'huyenthoai', dance: 'Điệu nhảy thiên thần' },
];

// pos của phụ kiện: toạ độ nội bộ của cún (chiều cao cún = 1), s = kích thước, r = xoay, layer: body | behind
export const ITEMS = [
  // Đi biển
  { id: 'mu-coi', set: 'di-bien', slot: 'hat', name: 'Mũ cói', icon: 'fluent/womans_hat.png', size: 0.62, lift: 0.72, tilt: 0.15 },
  { id: 'kinh-ram', set: 'di-bien', slot: 'glasses', name: 'Kính râm', style: 'round-sun' },
  { id: 'ao-hoa', set: 'di-bien', slot: 'shirt', name: 'Áo hoa', style: 'hawaii' },
  { id: 'phao-boi', set: 'di-bien', slot: 'acc', name: 'Phao bơi', icon: 'fluent/ring_buoy.png', layer: 'body', pos: { x: -0.08, y: -0.42, s: 0.5, r: 0 } },
  // Tốt nghiệp
  { id: 'mu-cu-nhan', set: 'tot-nghiep', slot: 'hat', name: 'Mũ cử nhân', icon: 'fluent/graduation_cap.png', size: 0.55, lift: 0.72, tilt: 0.1 },
  { id: 'kinh-can', set: 'tot-nghiep', slot: 'glasses', name: 'Kính cận', style: 'square' },
  { id: 'ao-cu-nhan', set: 'tot-nghiep', slot: 'shirt', name: 'Áo cử nhân', style: 'gown' },
  { id: 'bang-khen', set: 'tot-nghiep', slot: 'acc', name: 'Bằng khen', icon: 'fluent/scroll.png', layer: 'body', pos: { x: -0.2, y: -0.7, s: 0.34, r: -0.5 } },
  // Ngôi sao
  { id: 'tai-nghe', set: 'ngoi-sao', slot: 'hat', name: 'Tai nghe DJ', icon: 'fluent/headphone.png', size: 0.62, lift: 0.6, tilt: 0 },
  { id: 'kinh-sao', set: 'ngoi-sao', slot: 'glasses', name: 'Kính ngôi sao', style: 'star' },
  { id: 'ao-da', set: 'ngoi-sao', slot: 'shirt', name: 'Áo khoác da', style: 'jacket' },
  { id: 'micro-vang', set: 'ngoi-sao', slot: 'acc', name: 'Micro vàng', icon: 'fluent/microphone.png', layer: 'body', pos: { x: 0.5, y: -0.4, s: 0.3, r: 0.5 }, wiggle: true },
  // Ảo thuật gia
  { id: 'mu-ao-thuat', set: 'ao-thuat', slot: 'hat', name: 'Mũ ảo thuật', icon: 'fluent/top_hat.png', size: 0.55, lift: 0.8, tilt: 0.2 },
  { id: 'mat-na', set: 'ao-thuat', slot: 'glasses', name: 'Mặt nạ dạ hội', style: 'mask' },
  { id: 'ao-duoi-tom', set: 'ao-thuat', slot: 'shirt', name: 'Áo đuôi tôm', style: 'tux' },
  { id: 'dua-phep', set: 'ao-thuat', slot: 'acc', name: 'Đũa phép', icon: 'fluent/magic_wand.png', layer: 'body', pos: { x: 0.5, y: -0.38, s: 0.32, r: 0.2 }, wiggle: true },
  // Nhà vua
  { id: 'vuong-mien', set: 'nha-vua', slot: 'hat', name: 'Vương miện', icon: 'fluent/crown.png', size: 0.5, lift: 0.8, tilt: 0.12 },
  { id: 'kinh-vang', set: 'nha-vua', slot: 'glasses', name: 'Kính vàng', style: 'gold' },
  { id: 'ao-choang', set: 'nha-vua', slot: 'shirt', name: 'Áo choàng vua', style: 'cape' },
  { id: 'ngoc-quy', set: 'nha-vua', slot: 'acc', name: 'Ngọc quý', icon: 'fluent/gem_stone.png', layer: 'body', pos: { x: 0.33, y: -0.4, s: 0.2, r: 0 } },
  // Thiên thần
  { id: 'hao-quang', set: 'thien-than', slot: 'hat', name: 'Vòng hào quang', style: 'halo', tilt: 0 },
  { id: 'kinh-tim', set: 'thien-than', slot: 'glasses', name: 'Kính trái tim', style: 'heart' },
  { id: 'ao-thien-than', set: 'thien-than', slot: 'shirt', name: 'Áo thiên thần', style: 'angel' },
  { id: 'doi-canh', set: 'thien-than', slot: 'acc', name: 'Đôi cánh', icon: 'fluent/wing.png', layer: 'behind', pos: { x: -0.18, y: -0.78, s: 0.6, r: -0.35, flip: true }, wiggle: true },
];

export const SET_BY_ID = Object.fromEntries(SETS.map((s) => [s.id, s]));
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const rarityOf = (item) => SET_BY_ID[item.set].rarity;

// bốc 1 món theo tỉ lệ hạng { thuong: 80, hiem: 18, huyenthoai: 2 }
export function rollItem(odds) {
  const entries = Object.entries(odds || {}).filter(([k, v]) => RARITY[k] && v > 0);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  let rarity = 'thuong';
  if (total > 0) {
    let r = Math.random() * total;
    for (const [k, v] of entries) {
      if ((r -= v) <= 0) {
        rarity = k;
        break;
      }
    }
  }
  const pool = ITEMS.filter((i) => rarityOf(i) === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}
