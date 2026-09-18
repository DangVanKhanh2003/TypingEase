/* keyboard/ready.js — một lời hứa để script cổ điển chờ module bàn phím.
 *
 * `keyboard/boot.js` là module, mà module luôn chạy SAU mọi `<script src>` thường trên trang —
 * nên player.js đọc `window.NTKeyboard` ngay lúc nó chạy thì chỉ thấy `undefined`. File này là
 * script thường, nạp sớm, và chỉ làm một việc: dựng sẵn `window.NTKeyboardReady`.
 *
 *   const NT = await window.NTKeyboardReady;   // null nếu module không nạp được
 *
 * Nếu module hỏng (trình duyệt cũ, script bị chặn, file 404) lời hứa vẫn kết thúc — bằng `null`
 * ở sự kiện `load` — để trang không treo mà chỉ mất bàn phím.
 */
(function (global) {
  global.NTKeyboardReady = new Promise(resolve => {
    if (global.NTKeyboard) { resolve(global.NTKeyboard); return; }
    global.addEventListener('ntkeyboard:loaded', () => resolve(global.NTKeyboard), { once: true });
    global.addEventListener('load', () => resolve(global.NTKeyboard || null), { once: true });
  });
})(window);
