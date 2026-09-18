/* sw.js — service worker của TypingEase (PLAN.md phase 5: "cache bài đã mở").
 *
 * Nguyên tắc: KHÔNG precache cả site. Site là GitHub Pages tĩnh, người dùng chỉ đi vài trang;
 * tải sẵn 35 file bài học cho một người mới vào là phí băng thông của họ. Thay vào đó cache
 * theo lối đi thật — trang nào đã mở, bài nào đã gõ thì lần sau không cần mạng nữa.
 *
 * MỌI THỨ CÙNG MỘT NHÀ: mạng trước, cache chỉ là lưới đỡ khi mạng đứt.
 *
 * Bản đầu (v1, sáng 18/09) cho CSS/JS đi cache-trước-cập-nhật-nền để vào bài nhanh hơn. Đổi lấy
 * tốc độ đó là MỘT lần nạp thấy bản cũ sau mỗi lần deploy — và ngay chiều hôm đó nó đánh lừa
 * đúng chủ site: sửa `base.css` xong, tải lại, vẫn thấy giao diện cũ và tưởng code sai. Người
 * dùng thật cũng gặp đúng cảnh đó sau mỗi lần deploy, chỉ là họ không biết để mà nghi ngờ. Tệ hơn,
 * HTML đi mạng-trước còn CSS đi cache-trước nghĩa là trang MỚI có thể ghép với CSS CŨ.
 * Còn tốc độ thì gần như không mất gì: `fetch()` trong service worker vẫn đi qua HTTP cache của
 * trình duyệt, nên "mạng trước" ở lần thứ hai thường chỉ là một cú 304.
 *
 * Ngoại lệ duy nhất: font Google. URL của chúng bất biến (băm nội dung trong tên file) nên
 * cache-trước là đúng, và nhờ lưu cả response opaque mà trang offline vẫn còn đúng font.
 *
 * Đổi VERSION là dọn sạch cache cũ ở lần activate kế tiếp. v3: bàn phím/bàn tay thay bằng bản
 * port từ typekute — keyboard-widget.js, hands.js, keyboard.css, hands.css không còn tồn tại, nên
 * quét sạch cache v2 để không ai còn giữ chúng.
 *
 * Bàn tay 3D (three.js ~690 KB, model 967 KB, texture) KHÔNG nằm trong PRECACHE: chúng chỉ tải
 * khi người học thật sự bật bàn tay, và cache lối-đi-thật ở dưới sẽ giữ lại sau lần đầu.
 */
const VERSION = 'v3';
const SHELL = `typingease-shell-${VERSION}`;
const RUNTIME = `typingease-runtime-${VERSION}`;

// Đủ để mở trang chủ và vào học khi offline ngay từ lần thứ hai, không hơn.
const PRECACHE = [
  '/', '/tokens.css', '/base.css', '/home.css', '/script.js',
  '/profile.js', '/progress-store.js', '/data/curriculum.vi.js', '/favicon.ico'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  // addAll() hỏng cả lô nếu một URL 404 — thêm từng cái để một file đổi tên không làm chết
  // service worker của mọi người.
  event.waitUntil(caches.open(SHELL)
    .then(cache => Promise.all(PRECACHE.map(url => cache.add(url).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  const keep = [SHELL, RUNTIME];
  event.waitUntil(caches.keys()
    .then(names => Promise.all(names.filter(name => !keep.includes(name)).map(name => caches.delete(name))))
    .then(() => self.clients.claim()));
});

// `allowOpaque` chỉ bật cho font: response cross-origin no-cors không đọc được status (luôn là 0),
// lưu bừa là có ngày cache lại đúng một trang lỗi. Với font thì đánh đổi đó đáng, vì URL bất biến.
const putCopy = (cacheName, request, response, { allowOpaque = false } = {}) => {
  if (!response) return response;
  if (!(response.ok || (allowOpaque && response.type === 'opaque'))) return response;
  const copy = response.clone();
  caches.open(cacheName).then(cache => cache.put(request, copy)).catch(() => {});
  return response;
};

// Trang chưa từng mở mà lại mất mạng: KHÔNG phục vụ bản cache của trang chủ dưới URL đó.
// Trang chủ dùng đường dẫn tương đối ('tokens.css'), đặt nó ở /luyen-phim-yeu/ là mọi liên kết
// lệch một cấp — vừa vỡ giao diện vừa nói dối người dùng về việc họ đang đứng ở đâu. Một trang
// offline tự chứa thì thành thật hơn và không phụ thuộc file nào.
const OFFLINE_HTML = '<!doctype html><html lang="vi"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Không có mạng | TypingEase</title>'
  + '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6faf7;'
  + 'color:#15352b;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center}'
  + 'main{max-width:420px;padding:32px 24px}h1{margin:0 0 12px;font-size:24px;letter-spacing:-.5px}'
  + 'p{margin:0 0 20px;color:#6e8179;font-size:14px}a{display:inline-block;padding:11px 18px;'
  + 'border-radius:6px;background:#157a55;color:#fff;font-size:13px;font-weight:700;text-decoration:none}</style>'
  + '</head><body><main id="offline-note"><h1>Mất mạng rồi</h1>'
  + '<p>Trang này bạn chưa mở lần nào nên máy chưa giữ được bản nào. Những bài đã học thì vẫn gõ được bình thường.</p>'
  + '<a href="/">Về trang chủ</a></main></body></html>';

const offlinePage = () => new Response(OFFLINE_HTML, {
  status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
});

async function networkFirst(request, { navigate = false } = {}) {
  try {
    return putCopy(RUNTIME, request, await fetch(request));
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return navigate ? offlinePage() : Response.error();
  }
}

// Chỉ dành cho font: lấy bản đã lưu nếu có, không thì tải và lưu lại (kể cả response opaque).
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    return putCopy(RUNTIME, request, await fetch(request), { allowOpaque: true });
  } catch { return Response.error(); }
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  if (FONT_HOSTS.includes(url.hostname)) { event.respondWith(cacheFirst(request)); return; }
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(request, { navigate: request.mode === 'navigate' }));
});

// Trang gọi được để nhận bản mới ngay mà không phải đóng hết tab.
self.addEventListener('message', event => { if (event.data === 'skip-waiting') self.skipWaiting(); });
