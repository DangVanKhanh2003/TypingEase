(function (global) {
  // Đăng ký service worker. Tách khỏi sw.js vì hai file chạy ở hai thế giới khác nhau: file này
  // chạy trong trang, sw.js chạy trong worker và KHÔNG thấy `window`.
  //
  // Đường dẫn '/sw.js' để nguyên tuyệt đối: phạm vi của service worker là thư mục chứa nó, đăng ký
  // '../sw.js' từ /hoc/ vẫn ra cùng file nhưng viết tuyệt đối thì đọc phát biết ngay phạm vi là
  // toàn site. Site chạy ở gốc tên miền (typingease.site) nên không có tiền tố nào phải lo.
  if (!('serviceWorker' in global.navigator)) return;
  global.addEventListener('load', () => {
    // Lỗi đăng ký (chạy bằng file://, trình duyệt chặn, tab ẩn danh) không được làm hỏng trang:
    // service worker chỉ là lớp tăng tốc, site vẫn chạy đủ khi không có nó.
    global.navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
})(window);
