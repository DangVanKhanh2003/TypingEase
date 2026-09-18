(function (global) {
  // Đăng ký service worker. Tách khỏi sw.js vì hai file chạy ở hai thế giới khác nhau: file này
  // chạy trong trang, sw.js chạy trong worker và KHÔNG thấy `window`.
  //
  // Đường dẫn '/sw.js' để nguyên tuyệt đối: phạm vi của service worker là thư mục chứa nó, đăng ký
  // '../sw.js' từ /hoc/ vẫn ra cùng file nhưng viết tuyệt đối thì đọc phát biết ngay phạm vi là
  // toàn site. Site chạy ở gốc tên miền (typingease.site) nên không có tiền tố nào phải lo.
  //
  // Thanh "có bản mới": sw.js đi mạng-trước, nên trang vừa NẠP đã là bản mới rồi — bản mới của
  // chính service worker được tìm thấy ngay lúc nạp thì không có gì để báo, báo là báo láo (và
  // sau mỗi lần deploy, MỌI người vào site sẽ thấy một thanh vô nghĩa). Chỉ đáng báo khi tab đã
  // mở lâu, người dùng quay lại, và trong lúc đó đã có deploy: khi ấy JS đang chạy trong tab là
  // bản cũ thật. Trình duyệt không tự kiểm tra lại sw.js cho tab đang mở, nên ta tự gọi `update()`
  // mỗi lần tab hiện trở lại, cách nhau ít nhất 15 phút.
  if (!('serviceWorker' in global.navigator)) return;
  const GRACE_MS = 10000;           // cập nhật tìm thấy trong 10 s đầu = kiểm tra lúc nạp, bỏ qua
  const RECHECK_MS = 15 * 60000;
  const loadedAt = Date.now();
  let lastCheck = loadedAt, bar = null;

  function showBar() {
    if (bar || !global.document.body) return;
    const doc = global.document;
    bar = doc.createElement('div');
    bar.className = 'update-bar';
    bar.id = 'update-bar';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>TypingEase có bản mới.</span>'
      + '<button type="button" class="is-primary" data-act="reload">Tải lại</button>'
      + '<button type="button" data-act="later">Để sau</button>';
    bar.addEventListener('click', event => {
      const act = event.target.closest('button')?.dataset.act;
      if (act === 'reload') global.location.reload();
      if (act === 'later') { bar.remove(); bar = null; }
    });
    doc.body.appendChild(bar);
  }

  global.addEventListener('load', () => {
    // Lỗi đăng ký (chạy bằng file://, trình duyệt chặn, tab ẩn danh) không được làm hỏng trang:
    // service worker chỉ là lớp tăng tốc, site vẫn chạy đủ khi không có nó.
    global.navigator.serviceWorker.register('/sw.js').then(registration => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        // Lần cài đầu (chưa có controller) không phải "bản mới" — đó là bản đầu tiên.
        if (!worker || !global.navigator.serviceWorker.controller) return;
        if (Date.now() - loadedAt < GRACE_MS) return;
        // sw.js tự skipWaiting ở install nên bản mới đi thẳng tới `activated`.
        worker.addEventListener('statechange', () => { if (worker.state === 'activated') showBar(); });
      });
      global.document.addEventListener('visibilitychange', () => {
        if (global.document.visibilityState !== 'visible' || Date.now() - lastCheck < RECHECK_MS) return;
        lastCheck = Date.now();
        registration.update().catch(() => {});
      });
    }).catch(() => {});
  });

  // Cho e2e và cho ai muốn xem thanh trông thế nào mà không cần deploy: `TypingEaseUpdate.show()`.
  global.TypingEaseUpdate = { show: showBar, hide: () => { bar?.remove(); bar = null; } };
})(window);
