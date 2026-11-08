// Mã đo lường quảng cáo (GTM, GA4, Meta Pixel, TikTok Pixel), chèn vào <head> của các trang khách xem.
// Mã nào để trống thì không chèn. Sự kiện (xem game, bắt đầu mua, đăng ký, mua hàng) gửi từ /js/track.js.
const ok = (v, re) => (re.test(String(v || '').trim()) ? String(v).trim() : '');

export function trackingIds(s) {
  return {
    gtm: ok(s.gtmId, /^GTM-[A-Z0-9]{4,12}$/),
    ga4: ok(s.ga4Id, /^G-[A-Z0-9]{4,15}$/),
    meta: ok(s.metaPixelId, /^\d{8,20}$/),
    tiktok: ok(s.tiktokPixelId, /^[A-Z0-9]{8,30}$/),
  };
}

export function trackingHead(s) {
  const id = trackingIds(s);
  const out = [];
  out.push(`<script>window.dataLayer=window.dataLayer||[];window.LG_TRACK=${JSON.stringify(id)};</script>`);
  if (id.gtm) out.push(`<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id.gtm}');</script>`);
  if (id.ga4) out.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${id.ga4}"></script>
<script>function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id.ga4}');</script>`);
  if (id.meta) out.push(`<!-- Meta Pixel -->
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id.meta}');fbq('track','PageView');</script>`);
  if (id.tiktok) out.push(`<!-- TikTok Pixel -->
<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${id.tiktok}');ttq.page();}(window,document,'ttq');</script>`);
  out.push('<script type="module" src="/js/track.js"></script>');
  return out.join('\n');
}

export function trackingBody(s) {
  const id = trackingIds(s);
  const out = [];
  if (id.gtm) out.push(`<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id.gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`);
  if (id.meta) out.push(`<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${id.meta}&ev=PageView&noscript=1"></noscript>`);
  return out.join('\n');
}

// Chèn vào một trang HTML hoàn chỉnh (không đụng trang quản trị)
export function injectTracking(html, s) {
  if (html.includes('window.LG_TRACK')) return html;
  const body = trackingBody(s);
  return html
    .replace('</head>', `${trackingHead(s)}\n</head>`)
    .replace(/<body([^>]*)>/, (m) => (body ? `${m}\n${body}` : m));
}
