// Chuyển nội dung bài viết (Markdown đơn giản) sang HTML an toàn.
// Dùng chung cho máy chủ (trang /tin-tuc) và khung xem trước trong Quản trị.
// Hỗ trợ: ## tiêu đề, ### tiêu đề nhỏ, đoạn văn, - danh sách, 1. danh sách số, > trích dẫn,
// **đậm**, *nghiêng*, [chữ](link), ![mô tả](ảnh), video YouTube (dán link riêng 1 dòng), --- đường kẻ.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// chỉ nhận link http(s), link nội bộ /..., #..., mailto:, tel:
const safeUrl = (u) => {
  u = String(u || '').trim();
  return /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i.test(u) ? u : '';
};

function inline(text) {
  let s = esc(text);
  // ảnh trước link
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'));
    return u ? `<img src="${esc(u)}" alt="${alt}" loading="lazy">` : m;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'));
    if (!u) return label;
    const ext = /^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${esc(u)}"${ext}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s;
}

const youtubeId = (line) => {
  const m = line.trim().match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})\S*$/);
  return m ? m[1] : '';
};

export function renderMarkdown(src) {
  const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null; // { tag, items }
  const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const flush = () => { flushPara(); flushList(); };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flush(); continue; }
    if ((m = line.match(/^(#{2,4})\s+(.+)/))) { flush(); const n = Math.min(4, m[1].length); out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flush(); out.push('<hr>'); continue; }
    if ((m = line.match(/^>\s?(.*)/))) { flush(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    const yt = youtubeId(line);
    if (yt) { flush(); out.push(`<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="Video YouTube" loading="lazy" allowfullscreen></iframe></div>`); continue; }
    if ((m = line.match(/^\s*[-*+]\s+(.+)/))) { flushPara(); if (list?.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.+)/))) { flushPara(); if (list?.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    flushList();
    para.push(line.trim());
  }
  flush();
  return out.join('\n');
}

// Đoạn tóm tắt chữ thuần (cho mô tả, thẻ meta)
export function plainText(src, max = 200) {
  const t = String(src || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,4}\s+|^>\s?|^\s*[-*+]\s+|^\s*\d+[.)]\s+/gm, '')
    .replace(/\*\*|\*/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

// Ảnh đầu tiên trong bài (dùng làm ảnh bìa khi chưa chọn)
export function firstImage(src) {
  const m = String(src || '').match(/!\[[^\]]*\]\(([^)\s]+)\)/);
  return m ? safeUrl(m[1]) : '';
}
