// Đọc email báo biến động số dư (ACB, hoặc ngân hàng khác) qua IMAP để tự xác nhận đơn chuyển khoản.
// Gmail: bật xác minh 2 bước rồi tạo "Mật khẩu ứng dụng", nhập vào Quản trị > Cài đặt.
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

// "1.000.000" / "1,000,000.00" / "229,000 VND" → 1000000 / 229000
export function parseVnd(s) {
  let t = String(s || '').replace(/[^\d.,]/g, '');
  if (!t) return 0;
  t = t.replace(/[.,]\d{1,2}$/, ''); // bỏ phần lẻ ",00" / ".00"
  return Number(t.replace(/[.,]/g, '')) || 0;
}

const htmlToText = (h) => String(h || '')
  .replace(/<(br|\/p|\/div|\/tr|\/li|\/h\d)[^>]*>/gi, '\n')
  .replace(/<\/t[dh]>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const NUM = '(\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)';

// Bóc số tiền + nội dung chuyển khoản từ email. Trả về { credit, amount, content } hoặc null nếu không đọc được.
export function parseBankEmail(text) {
  const t = String(text || '').replace(/\r/g, '').replace(/[ \t ]+/g, ' ');
  let amount = 0, credit = null;
  // "+229,000 VND" (dấu + là tiền vào, - là tiền ra)
  let m = t.match(new RegExp(`([+-])\\s?${NUM}\\s?(?:VND|VNĐ|đ)`, 'i'));
  if (m) { credit = m[1] === '+'; amount = parseVnd(m[2]); }
  if (!amount) {
    m = t.match(new RegExp(`(?:Ghi có|PS có|Phát sinh có|Tiền vào|Credit)[^\\d+-]{0,30}\\+?\\s?${NUM}`, 'i'));
    if (m) { credit = true; amount = parseVnd(m[1]); }
  }
  if (!amount) {
    m = t.match(new RegExp(`(?:Ghi nợ|PS nợ|Phát sinh nợ|Tiền ra|Debit)[^\\d+-]{0,30}-?\\s?${NUM}`, 'i'));
    if (m) { credit = false; amount = parseVnd(m[1]); }
  }
  if (!amount) {
    m = t.match(new RegExp(`(?:Số tiền(?: giao dịch| thay đổi)?|Amount)\\s*:?\\s*([+-])?\\s?${NUM}`, 'i'));
    if (m) { credit = m[1] !== '-'; amount = parseVnd(m[2]); }
  }
  if (!amount) return null;
  m = t.match(/(?:Nội dung(?: giao dịch| chuyển khoản)?|Diễn giải|Description|Remark|GD)\s*:?\s*([\s\S]{1,300}?)(?:\n\s*\n|Số dư|So du|Balance|Thời gian|$)/i);
  const content = (m ? m[1] : '').replace(/\s+/g, ' ').trim();
  return { credit: credit !== false, amount, content };
}

// Tìm mã đơn LG<số> trong nội dung (ngân hàng hay chèn/bỏ dấu cách, dấu chấm)
export function findOrderCode(content) {
  const flat = String(content || '').replace(/[\s.\-_]/g, '').toUpperCase();
  const m = flat.match(/LG(\d{8,14})(?!\d)/);
  return m ? Number(m[1]) : null;
}

// Lấy email mới từ hộp thư. state = { validity, uid } lưu lại giữa các lần chạy.
// Trả về { state, mails: [{ messageId, from, date, text }] }
export async function fetchNewMails(cfg, state = {}) {
  const client = new ImapFlow({
    host: cfg.host, port: Number(cfg.port) || 993, secure: true,
    auth: { user: cfg.user, pass: cfg.pass }, logger: false, socketTimeout: 60000,
  });
  const mails = [];
  await client.connect();
  try {
    const box = await client.mailboxOpen(cfg.folder || 'INBOX', { readOnly: true });
    const validity = String(box.uidValidity);
    let last = state.validity === validity ? Number(state.uid) || 0 : 0;
    let range;
    if (last) range = { uid: `${last + 1}:*` };
    else range = { since: new Date(Date.now() - 2 * 86400000) }; // lần đầu: chỉ quét 2 ngày gần nhất
    const uids = (await client.search(range, { uid: true })) || [];
    const fromFilter = String(cfg.from || '').toLowerCase().trim();
    let maxUid = last;
    for (const uid of uids.sort((a, b) => a - b)) {
      if (uid <= last) continue; // "n:*" luôn trả về ít nhất UID lớn nhất
      maxUid = Math.max(maxUid, uid);
      const msg = await client.fetchOne(String(uid), { source: true, envelope: true }, { uid: true });
      if (!msg?.source) continue;
      const from = (msg.envelope?.from || []).map(a => a.address || '').join(',').toLowerCase();
      if (fromFilter && !from.includes(fromFilter)) continue;
      const p = await simpleParser(msg.source);
      mails.push({
        messageId: p.messageId || `uid-${validity}-${uid}`, from, date: p.date ? p.date.getTime() : Date.now(),
        text: (p.text || '') + '\n' + htmlToText(p.html || ''),
      });
    }
    if (!last && !uids.length) {
      // hộp thư trống trong 2 ngày: đánh dấu từ UID hiện tại để lần sau chỉ đọc email mới
      maxUid = Math.max(0, (box.uidNext || 1) - 1);
    }
    return { state: { validity, uid: maxUid }, mails };
  } finally {
    await client.logout().catch(() => client.close());
  }
}
