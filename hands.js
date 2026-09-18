(function (global) {
  // Bàn tay phủ lên bàn phím — bản ẢNH (từ 19/09/2026). Bản trước là SVG tự vẽ có ngón di chuyển
  // theo phím; chủ site muốn tay nhìn như ảnh chụp thật (kiểu hình minh hoạ "tay đặt lên bàn
  // phím, kẻ đường từ ngón tới phím"), và ảnh thật thì không tách được từng ngón để cử động. Nên
  // đổi mô hình: hai ảnh tay ĐỨNG YÊN đặt đúng hàng phím cơ sở, ngón phụ trách sáng lên ở đầu
  // ngón, và một ĐƯỜNG KẺ từ đầu ngón tới phím đích khi phím đích không phải phím cơ sở của ngón.
  //
  // Hình học vẫn là tham số: vị trí ảnh được TÍNH mỗi lần vẽ bằng phép đồng dạng (co giãn + xoay
  // nhẹ + dịch) khớp bốn đầu ngón trong ảnh vào bốn phím cơ sở đo được trên trang, nên tay vừa
  // với mọi cỡ bàn phím. Mỗi ngón vẫn mang móc mà keyboard-widget dùng: `.finger[data-finger]
  // [data-key][data-rx][data-ry]`, `.finger-glow`, `.finger-line`.
  //
  // Ảnh + toạ độ đầu ngón nằm trong khối HAND_PHOTOS bên dưới, do `scripts/hand-photo.py` ghi.
  // Ảnh hiện tại là ẢNH GIỮ CHỖ render từ bàn tay SVG cũ (commit 2477dbf); thay bằng ảnh chụp
  // thật theo hướng dẫn trong script đó.

  // >>> HAND_PHOTOS — scripts/hand-photo.py ghi lại khối này, đừng sửa tay
  const PHOTOS = {
    left: { src: '/assets/hands/left.svg', width: 486, height: 424,
      tips: { LP: [50, 40], LR: [150, 40], LM: [250, 40], LI: [350, 40], LT: [438, 282] } },
    right: { src: '/assets/hands/right.svg', width: 486, height: 424,
      tips: { RI: [136, 40], RM: [236, 40], RR: [336, 40], RP: [436, 40], RT: [48, 282] } }
  };
  // <<< HAND_PHOTOS

  const HOME_KEYS = {
    left:  [['LP', 'a'], ['LR', 's'], ['LM', 'd'], ['LI', 'f']],
    right: [['RI', 'j'], ['RM', 'k'], ['RR', 'l'], ['RP', ';']]
  };
  const THUMBS = { left: 'LT', right: 'RT' };
  const TIP_LIFT = 0.1;   // đầu ngón lúc nghỉ nằm cao hơn tâm phím chừng này (theo chiều cao phím)
  const MAX_TILT = 8;     // độ xoay tối đa của ảnh — quá số này là ảnh chụp lệch, không phải bàn phím lệch

  const round = value => Math.round(value * 10) / 10;

  // Phép đồng dạng bình phương tối thiểu (Umeyama, không lật) đưa `from` (toạ độ ảnh) vào `to`
  // (toạ độ bàn phím). Bốn đầu ngón nằm gần một hàng nên góc xoay do sai lệch nhỏ quyết định —
  // kẹp trong ±MAX_TILT rồi tính lại tỉ lệ + dịch với góc đã kẹp.
  function fit(from, to) {
    const n = from.length;
    const mean = points => points.reduce(([sx, sy], [x, y]) => [sx + x / n, sy + y / n], [0, 0]);
    const [fx, fy] = mean(from), [tx, ty] = mean(to);
    let a = 0, b = 0, norm = 0;
    for (let i = 0; i < n; i += 1) {
      const x = from[i][0] - fx, y = from[i][1] - fy, u = to[i][0] - tx, v = to[i][1] - ty;
      a += x * u + y * v;
      b += x * v - y * u;
      norm += x * x + y * y;
    }
    let theta = Math.atan2(b, a);
    const limit = MAX_TILT * Math.PI / 180;
    theta = Math.max(-limit, Math.min(limit, theta));
    const cos = Math.cos(theta), sin = Math.sin(theta);
    // tỉ lệ tối ưu với góc đã cố định: s = Σ (R·p)·q / Σ |p|²
    let dot = 0;
    for (let i = 0; i < n; i += 1) {
      const x = from[i][0] - fx, y = from[i][1] - fy, u = to[i][0] - tx, v = to[i][1] - ty;
      dot += (cos * x - sin * y) * u + (sin * x + cos * y) * v;
    }
    const s = norm ? dot / norm : 1;
    const dx = tx - s * (cos * fx - sin * fy), dy = ty - s * (sin * fx + cos * fy);
    return { s, theta, dx, dy, cos, sin };
  }
  const place = (t, [x, y]) => [t.s * (t.cos * x - t.sin * y) + t.dx, t.s * (t.sin * x + t.cos * y) + t.dy];

  function hand(side, metrics) {
    const photo = PHOTOS[side];
    if (!photo) return { img: '', fingers: '' };
    const pairs = HOME_KEYS[side].filter(([code]) => photo.tips[code]);
    const from = pairs.map(([code]) => photo.tips[code]);
    const to = pairs.map(([, key]) => [metrics.home[key].x, metrics.home[key].y - metrics.keyH * TIP_LIFT]);
    const t = fit(from, to);
    const style = `width:${photo.width}px;height:${photo.height}px;`
      + `transform:translate(${round(t.dx)}px,${round(t.dy)}px) rotate(${round(t.theta * 180 / Math.PI)}deg) scale(${Math.round(t.s * 1000) / 1000})`;
    const img = `<img class="hand-photo hand-photo--${side}" src="${photo.src}" alt="" draggable="false" style="${style}">`;
    const keyOf = Object.fromEntries(HOME_KEYS[side]);
    keyOf[THUMBS[side]] = ' ';
    const glowR = round(metrics.keyW * 0.42), dotR = round(metrics.keyW * 0.11);
    const fingers = Object.entries(photo.tips).map(([code, tip]) => {
      const [x, y] = place(t, tip).map(round);
      return `<g class="finger" data-finger="${code}" data-key="${keyOf[code] || ''}" data-rx="${x}" data-ry="${y}">`
        + `<circle class="finger-glow" cx="${x}" cy="${y}" r="${glowR}" />`
        + `<line class="finger-line" x1="${x}" y1="${y}" x2="${x}" y2="${y}" />`
        + `<circle class="finger-dot" cx="${x}" cy="${y}" r="${dotR}" /></g>`;
    }).join('');
    return { img, fingers };
  }

  function markup(metrics) {
    const width = round(metrics.width), height = round(metrics.height);
    const left = hand('left', metrics), right = hand('right', metrics);
    // Tan dần về phía cổ tay: đặc tới hết hàng phím cách, tan hết ở đáy lớp (phần padding-bottom
    // mà hands.css chừa cho lòng bàn tay).
    const fadeFrom = round(Math.min(height, metrics.space.y + metrics.keyH * 0.9));
    return `<div class="hand-layer" aria-hidden="true" style="--hand-fade-from:${fadeFrom}px">`
      + left.img + right.img
      + `<svg class="hand-pointers" viewBox="0 0 ${width} ${height}" focusable="false">${left.fingers}${right.fingers}</svg>`
      + `</div>`;
  }

  global.TypingEaseHands = { markup, fit, PHOTOS, HOME_KEYS, THUMBS, MAX_TILT };
})(window);
