/* sw.js — service worker của TypingEase (PLAN.md phase 5: "cache bài đã mở").
 *
 * Nguyên tắc: KHÔNG precache cả site. Site là GitHub Pages tĩnh, người dùng chỉ đi vài trang;
 * tải sẵn 35 file bài học cho một người mới vào là phí băng thông của họ. Thay vào đó cache
 * theo lối đi thật — trang nào đã mở, bài nào đã gõ thì lần sau không cần mạng nữa.
 *
 * Hai chiến lược:
 *   - Trang HTML (navigate): MẠNG TRƯỚC. Nội dung bài viết và lộ trình đổi theo mỗi lần deploy;
 *     phục vụ bản cache trước sẽ khiến người dùng thấy site cũ cả tuần. Mất mạng mới rơi về cache.
 *   - CSS/JS/JSON/ảnh: CACHE TRƯỚC, cập nhật nền (stale-while-revalidate). Đổi tên file không
 *     phải chuyện xảy ra giữa chừng một phiên, còn tốc độ vào bài thì thấy ngay.
 *
 * Đổi VERSION là dọn sạch cache cũ ở lần activate kế tiếp.
 */
const VERSION = 'v1';
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

const putCopy = (cacheName, request, response) => {
  if (!response || !response.ok || response.type === 'opaque') return response;
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

async function networkFirst(request) {
  try {
    return putCopy(RUNTIME, request, await fetch(request));
  } catch {
    return (await caches.match(request)) || offlinePage();
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(response => putCopy(RUNTIME, request, response))
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  // Font Google: stale-while-revalidate như tài nguyên tĩnh. Response là opaque nên không
  // lưu lại được (putCopy bỏ qua) — nhưng trình duyệt vẫn giữ trong HTTP cache, và nếu thiếu
  // thì trang rơi về font hệ thống chứ không vỡ.
  if (FONT_HOSTS.includes(url.hostname)) { event.respondWith(staleWhileRevalidate(request)); return; }
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') { event.respondWith(networkFirst(request)); return; }
  event.respondWith(staleWhileRevalidate(request));
});

// Trang gọi được để nhận bản mới ngay mà không phải đóng hết tab.
self.addEventListener('message', event => { if (event.data === 'skip-waiting') self.skipWaiting(); });
