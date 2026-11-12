// SEO: máy chủ điền sẵn thẻ meta, Open Graph, dữ liệu có cấu trúc (JSON-LD) và nội dung chính vào HTML
// để Google, Facebook, Zalo đọc được ngay mà không cần chạy JavaScript.
// Trang vẫn dùng site.js như cũ: JS chỉ vẽ lại đúng nội dung đã có sẵn.
import fs from 'node:fs';
import path from 'node:path';
import { renderMarkdown, plainText, firstImage } from '../web/js/markdown.js';
import { GUIDE_LIVE_NET, GUIDE_NODEJS, guideSplitHtml } from '../web/js/live-guide.js';
import { LIVE_ARTICLES, liveNetBody, nodejsBody } from './live-guides.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `${Math.round(n / 1000).toLocaleString('vi-VN')}K`;
const moneyFull = (n) => `${Number(n).toLocaleString('vi-VN')}đ`;
const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`; };
// JSON trong <script> không được chứa "</script>"
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

export const POLICY_PAGES = [
  { slug: 'chinh-sach-ban-hang', title: 'Chính sách bán hàng', desc: 'Chính sách bán hàng game tương tác TikTok LIVE: gói mua, license key 1 máy, cập nhật và hỗ trợ cài đặt.' },
  { slug: 'thanh-toan-giao-hang', title: 'Thanh toán & giao hàng', desc: 'Thanh toán bằng QR ngân hàng, nhận license key và link tải game tự động sau 1–3 phút.' },
  { slug: 'doi-tra-hoan-tien', title: 'Đổi trả & hoàn tiền', desc: 'Điều kiện đổi trả và hoàn tiền khi mua game tương tác TikTok LIVE.' },
  { slug: 'bao-mat', title: 'Chính sách quyền riêng tư', desc: 'Cách cửa hàng thu thập, sử dụng và bảo vệ thông tin của khách hàng.' },
  { slug: 'dieu-khoan', title: 'Điều khoản sử dụng & bản quyền', desc: 'Điều khoản sử dụng game và license key, quyền sở hữu trí tuệ.' },
];

// Bài viết đang hiện: đã đăng và tới giờ đăng (hẹn giờ đăng thì chờ tới lúc đó)
export const publishedPosts = (D) => (D.posts || [])
  .filter(p => p.status === 'published' && (p.publishedAt || 0) <= Date.now())
  .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
const postCover = (p) => p.cover || firstImage(p.content) || '';
const postExcerpt = (p, n = 180) => p.excerpt || plainText(p.content, n);
const viDate = (t) => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

const PRIVATE_PAGES = ['/tai-khoan', '/don-hang', '/admin'];

export function createSeo({ publicDir, getData, baseUrl }) {
  const tpl = new Map();
  const read = (file) => {
    // đọc lại khi file thay đổi (deploy mới) nhưng không đọc đĩa mỗi lần
    const p = path.join(publicDir, file);
    const m = fs.statSync(p).mtimeMs;
    const c = tpl.get(p);
    if (c && c.m === m) return c.html;
    const html = fs.readFileSync(p, 'utf8');
    tpl.set(p, { m, html });
    return html;
  };

  const site = (req) => {
    const D = getData();
    const s = D.settings;
    const base = baseUrl(req);
    const games = D.games.filter(g => g.visible).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const single = D.plans.find(p => p.slots === 1 && !p.allGames);
    const abs = (u) => (!u ? '' : /^https?:/.test(u) ? u : `${base}${u.startsWith('/') ? '' : '/'}${u}`);
    const posts = publishedPosts(D);
    return { D, s, base, games, single, abs, posts };
  };

  const sameAs = (s) => [s.contactFacebook, s.contactTiktok].filter(u => /^https?:/.test(u || ''));

  function orgLd(ctx) {
    const { s, base } = ctx;
    return {
      '@type': 'Organization', '@id': `${base}/#org`, name: s.brandName, url: `${base}/`,
      logo: `${base}/media/icon-512.png`,
      ...(s.sellerEmail ? { email: s.sellerEmail } : {}),
      ...(s.contactPhone ? { telephone: s.contactPhone } : {}),
      ...(sameAs(s).length ? { sameAs: sameAs(s) } : {}),
    };
  }

  function productLd(ctx, g) {
    const { s, base, single, abs, D } = ctx;
    const prices = D.plans.map(p => p.price);
    return {
      '@type': 'Product', '@id': `${base}/game/${g.id}#product`, name: `Game ${g.name} cho TikTok LIVE`,
      description: cut(g.description || g.tagline, 500), image: [abs(g.image)].filter(Boolean),
      url: `${base}/game/${g.id}`, category: 'Phần mềm game tương tác livestream',
      brand: { '@type': 'Brand', name: s.brandName },
      offers: single
        ? { '@type': 'Offer', price: single.price, priceCurrency: 'VND', availability: 'https://schema.org/InStock', url: `${base}/game/${g.id}`, seller: { '@id': `${base}/#org` } }
        : { '@type': 'AggregateOffer', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), priceCurrency: 'VND', offerCount: prices.length },
    };
  }

  // Thẻ trong <head>: title, mô tả, canonical, Open Graph, Twitter, xác minh Google
  function headTags(ctx, { title, desc, url, image, type = 'website', robots, extra = '' }) {
    const { s } = ctx;
    const img = image || ctx.abs(s.ogImage) || ctx.abs(ctx.games[0]?.image);
    return [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(desc)}">`,
      `<link rel="canonical" href="${esc(url)}">`,
      robots ? `<meta name="robots" content="${robots}">` : '<meta name="robots" content="index,follow,max-image-preview:large">',
      '<meta name="theme-color" content="#0f0b1e">',
      `<meta property="og:site_name" content="${esc(s.brandName)}">`,
      '<meta property="og:locale" content="vi_VN">',
      `<meta property="og:type" content="${type}">`,
      `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(desc)}">`,
      `<meta property="og:url" content="${esc(url)}">`,
      img ? `<meta property="og:image" content="${esc(img)}">` : '',
      img ? `<meta property="og:image:alt" content="${esc(title)}">` : '',
      `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`,
      `<meta name="twitter:title" content="${esc(title)}">`,
      `<meta name="twitter:description" content="${esc(desc)}">`,
      img ? `<meta name="twitter:image" content="${esc(img)}">` : '',
      s.googleVerification ? `<meta name="google-site-verification" content="${esc(s.googleVerification)}">` : '',
      extra,
    ].filter(Boolean).join('\n  ');
  }

  // Thay <title> cũ + mô tả cũ bằng bộ thẻ mới
  const withHead = (html, tags) => html
    .replace(/\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace(/\s*<meta name="robots"[^>]*>/, '')
    .replace('</head>', `  ${tags}\n</head>`);

  const pageTitle = (t, s) => (t.includes(s.brandName) ? t : `${t} | ${s.brandName}`);

  // ---------- trang chủ ----------
  function gameCards(ctx) {
    const { games, single } = ctx;
    return games.map(g => `
    <article class="game">
      <div class="thumb" data-video="${esc(g.video)}">
        <img src="${esc(g.image)}" alt="Game ${esc(g.name)} trên TikTok LIVE" loading="lazy" width="300" height="400">
        ${g.video ? '<div class="play"><span>▶</span></div>' : ''}
        ${g.isNew ? '<span class="tag">MỚI</span>' : ''}
      </div>
      <div class="body">
        <h3><a href="/game/${esc(g.id)}">${esc(g.name)}</a></h3>
        <p>${esc(g.tagline)}</p>
        <ul>${(g.features || []).slice(0, 4).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <a class="more" href="/game/${esc(g.id)}">Xem chi tiết & cách chơi →</a>
        <div class="foot">
          <span class="price">${single ? money(single.price) : ''} <small>trọn đời</small></span>
          ${single ? `<button class="btn sm" data-buy="${esc(single.id)}" data-game="${esc(g.id)}">Mua</button>` : ''}
        </div>
      </div>
    </article>`).join('');
  }

  function planCards(ctx) {
    const { D } = ctx;
    return D.plans.map(p => `
    <div class="plan ${p.highlight ? 'hl' : ''}">
      ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      <div class="psub">${esc(p.subtitle)}</div>
      <div class="amount">${money(p.price)} <small>/ trọn đời</small></div>
      <ul>${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    </div>`).join('');
  }

  function home(req) {
    const ctx = site(req);
    const { s, base, games, D } = ctx;
    const names = games.map(g => g.name).join(', ');
    const title = s.seoTitle || `Game tương tác TikTok LIVE: ${games.length} game Việt, kéo tim, tăng quà | ${s.brandName}`;
    const desc = s.seoDescription || cut(`Mua game tương tác cho TikTok LIVE: ${names}. Người xem có nhân vật mang tên mình, thả tim, bình luận, tặng quà hiện lên màn hình. Từ ${ctx.single ? moneyFull(ctx.single.price) : ''}, 1 key dùng trọn đời, cài 5 phút.`, 160);
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        orgLd(ctx),
        { '@type': 'WebSite', '@id': `${base}/#site`, url: `${base}/`, name: s.brandName, inLanguage: 'vi-VN', publisher: { '@id': `${base}/#org` } },
        { '@type': 'ItemList', name: 'Game tương tác TikTok LIVE', itemListElement: games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}/game/${g.id}`, name: g.name })) },
        ...games.map(g => productLd(ctx, g)),
        ...(D.faq.length ? [{ '@type': 'FAQPage', mainEntity: D.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
      ],
    };
    const words = String(s.heroTitle || '').split(' ');
    const k = Math.ceil(words.length * 0.55);
    const hv = s.heroVideo || games.find(g => g.video)?.video || '';
    let html = withHead(read('index.html'), headTags(ctx, { title, desc, url: `${base}/`, extra: ld(graph) }));
    html = html
      .replace('<span id="heroEyebrow"></span>', `<span id="heroEyebrow">${esc(s.heroEyebrow)}</span>`)
      .replace('<h1 id="heroTitle"></h1>', `<h1 id="heroTitle">${esc(words.slice(0, k).join(' '))} <span class="hl">${esc(words.slice(k).join(' '))}</span></h1>`)
      .replace('<p class="sub" id="heroSub"></p>', `<p class="sub" id="heroSub">${esc(s.heroSubtitle)}</p>`)
      .replace(/<b id="statGames">\d*<\/b>/, `<b id="statGames">${games.length}</b>`)
      .replace('<span class="promo" id="promo"></span>', s.promo ? `<span class="promo" id="promo">${esc(s.promo)}</span>` : '<span class="promo" id="promo"></span>')
      .replace('<div class="games" id="games"></div>', `<div class="games" id="games">${gameCards(ctx)}</div>`)
      .replace('<div class="plans" id="plans"></div>', `<div class="plans" id="plans">${planCards(ctx)}</div>`)
      .replace('<div class="faq" id="faq"></div>', `<div class="faq" id="faq">${D.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`)
      .replace('<span class="sr" data-brand>LiveGame</span>', `<span class="sr" data-brand>${esc(s.brandName)}</span>`);
    if (ctx.posts.length) html = html.replace('<!-- tin-moi -->', `<section id="tin-tuc">
      <div class="wrap">
        <div class="sec-head"><div><div class="kicker">Tin tức</div><h2>Bài viết mới</h2></div><a class="more" href="/tin-tuc">Xem tất cả →</a></div>
        <div class="posts">${postCards(ctx.posts.slice(0, 3))}</div>
      </div>
    </section>`);
    if (hv) html = html.replace('<video id="heroVideo"', `<video id="heroVideo" src="${esc(hv)}" aria-label="Video game chạy trên TikTok LIVE"`);
    return html;
  }

  // ---------- trang từng game: /game/<id> ----------
  function guideHtml(g) {
    if (!g.guide) return '';
    return guideSplitHtml(g, esc);
  }

  function gamePage(req, id) {
    const ctx = site(req);
    const { s, base, games, single, D, abs } = ctx;
    const g = games.find(x => x.id === id);
    if (!g) return null;
    const url = `${base}/game/${g.id}`;
    const title = `Game ${g.name} cho TikTok LIVE | ${s.brandName}`;
    const desc = cut(`${g.tagline}. ${g.description}`, 160);
    const others = games.filter(x => x.id !== g.id);
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        orgLd(ctx),
        productLd(ctx, g),
        ...(g.video ? [{ '@type': 'VideoObject', name: `Video game ${g.name} chạy trên TikTok LIVE`, description: cut(g.tagline, 200), thumbnailUrl: [abs(g.image)], contentUrl: abs(g.video), uploadDate: new Date(g.createdAt || Date.now()).toISOString() }] : []),
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Game', item: `${base}/#game` },
          { '@type': 'ListItem', position: 3, name: g.name, item: url },
        ] },
      ],
    };
    const buy = single ? `/#mua-${single.id}~${g.id}` : '/#bang-gia';
    const body = `
  <main class="page">
    <div class="wrap">
      <nav class="crumbs" aria-label="breadcrumb"><a href="/">Trang chủ</a> › <a href="/#game">Game</a> › <span>${esc(g.name)}</span></nav>
      <article class="game-detail">
        <div class="gd-media">
          ${g.video ? `<video controls playsinline preload="metadata" poster="${esc(g.image)}" src="${esc(g.video)}" aria-label="Video game ${esc(g.name)}"></video>` : `<img src="${esc(g.image)}" alt="Game ${esc(g.name)} trên TikTok LIVE">`}
        </div>
        <div class="gd-info panel">
          <span class="kicker">Game tương tác TikTok LIVE</span>
          <h1>${esc(g.name)}</h1>
          <p class="sub">${esc(g.tagline)}</p>
          <p>${esc(g.description)}</p>
          ${(g.features || []).length ? `<h2>Tính năng nổi bật</h2><ul>${g.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
          <div class="gd-buy">
            ${single ? `<div class="amount">${moneyFull(single.price)} <small>/ trọn đời, 1 key = 1 máy</small></div>` : ''}
            <a class="btn" href="${buy}">Mua ${esc(g.name)}</a>
            <a class="btn ghost" href="/#bang-gia">Xem gói Combo tiết kiệm</a>
          </div>
        </div>
      </article>
      ${g.guide ? `<section class="panel policy" id="cach-cai-dat" style="margin-top:24px;scroll-margin-top:80px"><h2>Cách cài đặt và chơi ${esc(g.name)}</h2>${liveLinks(g)}${guideHtml(g)}<p>Xem thêm <a href="/huong-dan.html">hướng dẫn cài đặt chung</a>.</p></section>` : ''}
      ${others.length ? `<section style="margin-top:32px"><h2>Game khác</h2><div class="games">${gameCards({ ...ctx, games: others })}</div></section>` : ''}
    </div>
  </main>`;
    let html = read('index.html');
    html = withHead(html, headTags(ctx, { title, desc, url, image: abs(g.image), type: 'product', extra: ld(graph) }));
    // giữ header/footer của trang chủ, thay phần thân bằng trang game
    html = html.replace(/<main>[\s\S]*<\/main>/, body)
      .replace(/<!-- video demo -->[\s\S]*?<\/body>/, '<script type="module">import { applyBrand } from \'/js/common.js\'; applyBrand();</script>\n</body>')
      .replace(/href="#(game|bang-gia|hoi-dap)"/g, 'href="/#$1"')
      .replace('<span class="sr" data-brand>LiveGame</span>', `<span class="sr" data-brand>${esc(s.brandName)}</span>`);
    return html;
  }

  // 2 bài hướng dẫn LIVE gắn vào từng game
  function liveLinks(g) {
    const q = `?game=${encodeURIComponent(g.id)}`;
    return `<div class="hd-links"><a class="btn sm" href="${GUIDE_NODEJS}${q}">🖥️ Bước 1: Cài Node.js &amp; chạy game bằng CMD</a><a class="btn sm" href="${GUIDE_LIVE_NET}${q}">📺 Bước 2: LIVE nét 1080p (thêm nguồn Liên kết)</a></div>`;
  }
  function liveArticle(req, kind) {
    const ctx = site(req);
    const { s, base, games } = ctx;
    const a = LIVE_ARTICLES[kind];
    const picked = games.find(g => g.id === String(req.query?.game || '')) || null;
    const sup = s.messengerUrl || s.contactFacebook || (s.contactZalo ? (/^https?:/.test(s.contactZalo) ? s.contactZalo : `https://zalo.me/${String(s.contactZalo).replace(/\D/g, '')}`) : '');
    const help = [sup && `<a href="${esc(sup)}" target="_blank" rel="noopener">nhắn fanpage hỗ trợ</a>`, s.zaloGroup && `<a href="${esc(s.zaloGroup)}" target="_blank" rel="noopener">vào nhóm Zalo hỗ trợ</a>`].filter(Boolean).join(' hoặc ') || 'nhắn Zalo hỗ trợ';
    const url = `${base}${a.path}`;
    const graph = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'HowTo', name: a.title, description: a.desc, image: `${base}${a.image}`, inLanguage: 'vi' },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: 'Hướng dẫn', item: `${base}/huong-dan.html` },
        { '@type': 'ListItem', position: 3, name: a.short, item: url },
      ] },
    ] };
    const inner = (kind === 'net' ? liveNetBody : nodejsBody)({ games, picked, help: `${help.charAt(0).toUpperCase()}${help.slice(1)} kèm ảnh chụp màn hình.` });
    const body = `
  <main class="page">
    <div class="wrap">
      <nav class="crumbs" aria-label="breadcrumb"><a href="/">Trang chủ</a> › <a href="/huong-dan.html">Hướng dẫn</a> › <span>${esc(a.short)}</span></nav>
      <article class="panel policy hd-article">${inner}</article>
    </div>
  </main>`;
    return shell(ctx, { title: pageTitle(a.title, s), desc: a.desc, url, image: `${base}${a.image}`, type: 'article', extra: ld(graph) }, body);
  }
  const liveNetPage = (req) => liveArticle(req, 'net');
  const nodejsPage = (req) => liveArticle(req, 'node');

  // Giữ header/footer của trang chủ, thay phần thân
  function shell(ctx, head, body) {
    return withHead(read('index.html'), headTags(ctx, head))
      .replace(/<main>[\s\S]*<\/main>/, body)
      .replace(/<!-- video demo -->[\s\S]*?<\/body>/, '<script type="module">import { applyBrand } from \'/js/common.js\'; applyBrand();</script>\n</body>')
      .replace(/href="#(game|bang-gia|hoi-dap)"/g, 'href="/#$1"')
      .replace('<span class="sr" data-brand>LiveGame</span>', `<span class="sr" data-brand>${esc(ctx.s.brandName)}</span>`);
  }

  function postCards(list) {
    return list.map(p => {
      const cover = postCover(p);
      return `
    <article class="post-card">
      <a class="pc-img" href="/tin-tuc/${esc(p.slug)}">${cover ? `<img src="${esc(cover)}" alt="${esc(p.title)}" loading="lazy">` : '<span class="pc-ph"><img src="/media/icon-192.png" alt=""></span>'}</a>
      <div class="pc-body">
        <time datetime="${new Date(p.publishedAt).toISOString()}">${viDate(p.publishedAt)}</time>
        <h3><a href="/tin-tuc/${esc(p.slug)}">${esc(p.title)}</a></h3>
        <p>${esc(postExcerpt(p, 150))}</p>
      </div>
    </article>`;
    }).join('');
  }

  // ---------- tin tức: /tin-tuc và /tin-tuc/<slug> ----------
  const PER_PAGE = 12;
  function newsList(req) {
    const ctx = site(req);
    const { s, base, posts } = ctx;
    const pages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
    const page = Math.min(pages, Math.max(1, parseInt(req.query.trang, 10) || 1));
    const list = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const url = `${base}/tin-tuc${page > 1 ? `?trang=${page}` : ''}`;
    const link = (n) => `/tin-tuc${n > 1 ? `?trang=${n}` : ''}`;
    const body = `
  <main class="page">
    <div class="wrap">
      <nav class="crumbs" aria-label="breadcrumb"><a href="/">Trang chủ</a> › <span>Tin tức</span></nav>
      <div class="sec-head"><div><div class="kicker">Tin tức</div><h1>Tin tức & mẹo LIVE</h1><p>Cập nhật game mới, mẹo tăng tương tác và kinh nghiệm livestream TikTok.</p></div></div>
      ${list.length ? `<div class="posts">${postCards(list)}</div>` : '<div class="panel"><p class="note">Chưa có bài viết nào.</p></div>'}
      ${pages > 1 ? `<nav class="pager">${page > 1 ? `<a class="btn ghost sm" href="${link(page - 1)}" rel="prev">← Trang trước</a>` : ''}<span>Trang ${page}/${pages}</span>${page < pages ? `<a class="btn ghost sm" href="${link(page + 1)}" rel="next">Trang sau →</a>` : ''}</nav>` : ''}
    </div>
  </main>`;
    const graph = { '@context': 'https://schema.org', '@graph': [orgLd(ctx), { '@type': 'Blog', '@id': `${base}/tin-tuc#blog`, name: `Tin tức ${s.brandName}`, url: `${base}/tin-tuc`, inLanguage: 'vi-VN', publisher: { '@id': `${base}/#org` },
      blogPost: list.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${base}/tin-tuc/${p.slug}`, datePublished: new Date(p.publishedAt).toISOString() })) }] };
    return shell(ctx, { title: pageTitle(page > 1 ? `Tin tức (trang ${page})` : 'Tin tức & mẹo livestream TikTok', s), desc: 'Tin tức, mẹo tăng tương tác và kinh nghiệm livestream TikTok với game tương tác.', url, image: `${base}/media/og-logo.jpg`, extra: ld(graph) }, body);
  }

  function newsPost(req, slugName) {
    const ctx = site(req);
    const { s, base, posts, abs } = ctx;
    const p = posts.find(x => x.slug === slugName);
    if (!p) return null;
    const url = `${base}/tin-tuc/${p.slug}`;
    const cover = postCover(p);
    const desc = p.seoDescription || postExcerpt(p, 160);
    const others = posts.filter(x => x.id !== p.id).slice(0, 3);
    const graph = { '@context': 'https://schema.org', '@graph': [orgLd(ctx),
      { '@type': 'BlogPosting', '@id': `${url}#post`, headline: p.title, description: desc, url, mainEntityOfPage: url, inLanguage: 'vi-VN',
        datePublished: new Date(p.publishedAt).toISOString(), dateModified: new Date(p.updatedAt || p.publishedAt).toISOString(),
        ...(cover ? { image: [abs(cover)] } : {}), author: { '@id': `${base}/#org` }, publisher: { '@id': `${base}/#org` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: 'Tin tức', item: `${base}/tin-tuc` },
        { '@type': 'ListItem', position: 3, name: p.title, item: url },
      ] }] };
    const body = `
  <main class="page">
    <div class="wrap">
      <nav class="crumbs" aria-label="breadcrumb"><a href="/">Trang chủ</a> › <a href="/tin-tuc">Tin tức</a> › <span>${esc(p.title)}</span></nav>
      <article class="panel policy post">
        <h1>${esc(p.title)}</h1>
        <p class="post-meta"><time datetime="${new Date(p.publishedAt).toISOString()}">${viDate(p.publishedAt)}</time> · ${esc(s.brandName)}</p>
        ${p.cover ? `<img class="post-cover" src="${esc(p.cover)}" alt="${esc(p.title)}">` : ''}
        <div class="post-body">${renderMarkdown(p.content)}</div>
        <div class="post-cta"><b>Muốn LIVE có game tương tác như vậy?</b> <a class="btn sm" href="/#game">Xem các game</a></div>
      </article>
      ${others.length ? `<section style="margin-top:32px"><h2>Bài viết khác</h2><div class="posts">${postCards(others)}</div></section>` : ''}
    </div>
  </main>`;
    return shell(ctx, { title: pageTitle(p.seoTitle || p.title, s), desc, url, image: cover ? abs(cover) : `${base}/media/og-logo.jpg`, type: 'article',
      extra: `<meta property="article:published_time" content="${new Date(p.publishedAt).toISOString()}">\n  ${ld(graph)}` }, body);
  }

  // ---------- các trang tĩnh khác: chỉ cần thẻ head ----------
  function simplePage(req, file, { title, desc, canonical, robots }) {
    const ctx = site(req);
    const html = read(file);
    return withHead(html, headTags(ctx, { title: pageTitle(title, ctx.s), desc, url: `${ctx.base}${canonical}`, robots }))
      .replace('<span class="sr" data-brand>LiveGame</span>', `<span class="sr" data-brand>${esc(ctx.s.brandName)}</span>`);
  }

  function guidePage(req) {
    const ctx = site(req);
    return simplePage(req, 'huong-dan.html', {
      title: 'Hướng dẫn cài đặt & sử dụng game TikTok LIVE',
      desc: 'Hướng dẫn từng bước: mua và nhận key, cài game trên Windows, kích hoạt, thêm cửa sổ game vào TikTok LIVE Studio hoặc OBS, đổi máy, xử lý lỗi.',
      canonical: '/huong-dan.html',
    }).replace('</head>', `  ${ld({ '@context': 'https://schema.org', '@type': 'HowTo', name: 'Cài game tương tác cho TikTok LIVE', inLanguage: 'vi-VN', step: [
      { '@type': 'HowToStep', name: 'Mua và nhận key', text: 'Đăng ký tài khoản, chọn gói, quét mã QR ngân hàng. Key và link tải hiện trong Tài khoản của tôi.', url: `${ctx.base}/huong-dan.html#mua` },
      { '@type': 'HowToStep', name: 'Chuẩn bị máy tính', text: 'Windows 10/11, Node.js bản LTS, Microsoft Edge, TikTok LIVE Studio.', url: `${ctx.base}/huong-dan.html#chuan-bi` },
      { '@type': 'HowToStep', name: 'Cài game và kích hoạt key', text: 'Giải nén file ZIP, chạy file run….bat, dán license key để kích hoạt.', url: `${ctx.base}/huong-dan.html#cai-dat` },
      { '@type': 'HowToStep', name: 'Dùng khi LIVE', text: 'Trong TikTok LIVE Studio chọn Thêm nguồn › Liên kết, dán đường dẫn màn hình game, độ phân giải tùy chỉnh 1080 x 1920.', url: `${ctx.base}/huong-dan.html#live` },
    ] })}\n</head>`);
  }

  function policyPage(req, slug) {
    const p = POLICY_PAGES.find(x => x.slug === slug) || POLICY_PAGES[0];
    return simplePage(req, 'chinh-sach.html', { title: p.title, desc: p.desc, canonical: `/chinh-sach/${p.slug}` });
  }

  function lookupPage(req) {
    return simplePage(req, 'tra-cuu.html', {
      title: 'Tra cứu license key & chuyển máy',
      desc: 'Tra cứu license key game TikTok LIVE, xem game trong key và tự chuyển key sang máy tính mới.',
      canonical: '/tra-cuu.html',
    });
  }

  function robots(req) {
    const base = baseUrl(req);
    return [
      'User-agent: *',
      'Allow: /',
      ...PRIVATE_PAGES.map(p => `Disallow: ${p}`),
      'Disallow: /api/',
      'Disallow: /tai-ve/',
      '',
      `Sitemap: ${base}/sitemap.xml`,
      '',
    ].join('\n');
  }

  function sitemap(req) {
    const { base, games, posts } = site(req);
    const day = (t) => new Date(t || Date.now()).toISOString().slice(0, 10);
    const latest = Math.max(0, ...games.map(g => g.updatedAt || g.createdAt || 0)) || Date.now();
    const urls = [
      { loc: `${base}/`, lastmod: day(latest), priority: '1.0', changefreq: 'weekly' },
      ...games.map(g => ({ loc: `${base}/game/${g.id}`, lastmod: day(g.updatedAt || g.createdAt), priority: '0.9', changefreq: 'monthly', image: g.image })),
      { loc: `${base}/huong-dan.html`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${base}${GUIDE_NODEJS}`, priority: '0.6', changefreq: 'monthly' },
      { loc: `${base}${GUIDE_LIVE_NET}`, priority: '0.6', changefreq: 'monthly' },
      { loc: `${base}/tin-tuc`, lastmod: posts[0] ? day(posts[0].updatedAt || posts[0].publishedAt) : undefined, priority: '0.6', changefreq: 'weekly' },
      ...posts.map(p => ({ loc: `${base}/tin-tuc/${p.slug}`, lastmod: day(p.updatedAt || p.publishedAt), priority: '0.6', changefreq: 'monthly', image: postCover(p) || undefined })),
      { loc: `${base}/tra-cuu.html`, priority: '0.4', changefreq: 'yearly' },
      ...POLICY_PAGES.map(p => ({ loc: `${base}/chinh-sach/${p.slug}`, priority: '0.3', changefreq: 'yearly' })),
    ];
    const abs = (u) => (/^https?:/.test(u) ? u : `${base}${u}`);
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${u.image ? `<image:image><image:loc>${esc(abs(u.image))}</image:loc></image:image>` : ''}</url>`).join('\n')}
</urlset>
`;
  }

  return { home, gamePage, guidePage, liveNetPage, nodejsPage, policyPage, lookupPage, robots, sitemap, newsList, newsPost };
}
