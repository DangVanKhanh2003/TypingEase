#!/usr/bin/env node
/*
 * scripts/draw-hands.js — sinh `assets/hands/{left,right}.svg` và ghi khối HAND_PHOTOS trong
 * `hands.js`. Chạy: `node scripts/draw-hands.js` (Node thuần, không cần gì thêm).
 *
 * Bàn tay kiểu HÌNH VẼ NÉT, theo đúng mẫu chủ site gửi ngày 19/09: chỉ có đường viền, bên trong
 * rỗng, nên chữ trên phím vẫn đọc được xuyên qua bàn tay. Đó là lý do kiểu này thắng hẳn bàn tay
 * tô màu: một bàn tay đặc, dù vẽ khéo đến đâu, cũng che mất đúng những phím mà người học đang cần
 * nhìn; và vẽ khối cho ra hình người thì khó, còn vẽ nét thì chỉ cần đường đi đúng.
 *
 * Mỗi ngón là một dải chạy từ đầu ngón (nằm trên phím cơ sở) xuôi về cổ tay, thu hẹp dần. Các dải
 * CẮT NHAU trong lòng bàn tay và mọi đường đều để nguyên — mẫu vẽ cũng vậy, và nhờ thế không phải
 * dựng mu bàn tay, thứ đã làm hỏng cả hai lần vẽ trước.
 *
 * Đáy để MỞ: bàn tay chạy ra khỏi khung, còn `hands.css` lo phần tan dần ở cổ tay.
 *
 * Toạ độ theo đơn vị phím: KEY = 100px, bốn đầu ngón cách nhau đúng một phím. hands.js chỉ cần
 * bốn đầu ngón ấy để khớp cả bàn tay vào bàn phím thật, nên đổi số ở đây không phá gì.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const OUT = path.join(ROOT, 'assets', 'hands');

const KEY = 100;
const W = 486, H = 424;
const TIP_Y = 40;            // hàng đầu ngón
const INK = '#26332f';       // mực: xanh đen trung tính, không phải đen tuyền — đen gắt trên nền sáng
const STROKE = 3.6;          // ở cỡ hiển thị thường gặp (phím ~52px) thành nét ~1,9px

// Bàn tay TRÁI. `tip` là đầu ngón (trên phím cơ sở), `tail` là chỗ ngón chìm vào lòng bàn tay.
// Ngón DỪNG ở quãng cổ tay chứ không chạy hết khung: kéo dài hơn nữa thì bốn ngón hai bàn tay
// thành một mạng nhện phủ kín nửa dưới bàn phím — đã thử, rất rối.
const DIGITS = [
  { id: 'LP', tip: [50, TIP_Y],  tail: [206, 306], halfTip: 26, halfTail: 29, bow: -0.06 },
  { id: 'LR', tip: [150, TIP_Y], tail: [234, 322], halfTip: 28, halfTail: 31, bow: -0.035 },
  { id: 'LM', tip: [250, TIP_Y], tail: [260, 330], halfTip: 29, halfTail: 32, bow: 0 },
  { id: 'LI', tip: [350, TIP_Y], tail: [288, 320], halfTip: 28, halfTail: 31, bow: 0.05 }
];
// Ngón cái chìa NGANG vào giữa, đầu ngón nằm trên phím cách — hai hàng dưới hàng cơ sở.
const THUMB = { id: 'LT', tip: [438, 282], tail: [330, 374], halfTip: 24, halfTail: 32, bow: -0.07 };
// Hai mép bàn tay chạy liền vào cổ tay: bên ngón út và bên gò cái. Chúng khép bàn tay lại mà
// không phải vẽ mu bàn tay — thứ đã làm hỏng cả hai lần vẽ tô màu trước đó. Đuôi chạy quá đáy
// khung; phần tan dần ở cổ tay là việc của mask trong hands.css.
const EDGES = [
  [[24, 206], [100, 294], [148, 356], [160, 424]],
  [[384, 294], [350, 330], [324, 376], [314, 424]]
];

const r1 = value => Math.round(value * 10) / 10;
const at = point => `${r1(point[0])} ${r1(point[1])}`;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const unit = a => { const n = Math.hypot(a[0], a[1]) || 1; return [a[0] / n, a[1] / n]; };

// Đường cong trơn đi qua mọi điểm (Catmull-Rom → cubic), nối tiếp vào path đang dở.
function through(points, move) {
  if (points.length < 2) return '';
  const get = i => points[Math.max(0, Math.min(points.length - 1, i))];
  let d = move ? `M ${at(points[0])}` : ` L ${at(points[0])}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const c1 = add(get(i), mul(sub(get(i + 1), get(i - 1)), 1 / 6));
    const c2 = sub(get(i + 1), mul(sub(get(i + 2), get(i)), 1 / 6));
    d += ` C ${at(c1)} ${at(c2)} ${at(get(i + 1))}`;
  }
  return d;
}

// Một ngón: men theo mép trái từ gốc lên đầu, vòng qua đầu ngón bằng nửa đường tròn, rồi xuống
// mép phải. Đáy để mở.
function digitPath({ tip, tail, halfTip, halfTail, bow }) {
  const axis = unit(sub(tip, tail));
  const normal = [-axis[1], axis[0]];
  const length = Math.hypot(tip[0] - tail[0], tip[1] - tail[1]);
  const steps = 5;
  const spine = [], widths = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;                       // 0 ở gốc, 1 ở đầu ngón
    const centre = lerp(tail, tip, t);
    spine.push(add(centre, mul(normal, Math.sin(t * Math.PI) * bow * length)));
    // Ngón phình nhẹ ở quãng giữa rồi thon lại: ngón người không thuôn đều một mạch.
    widths.push(halfTail + (halfTip - halfTail) * t + Math.sin(t * Math.PI) * 2.5);
  }
  const left = spine.map((point, i) => add(point, mul(normal, widths[i])));
  const right = spine.map((point, i) => add(point, mul(normal, -widths[i])));
  const cap = `A ${r1(halfTip)} ${r1(halfTip)} 0 0 1 ${at(right[right.length - 1])}`;
  return `${through(left, true)} ${cap}${through(right.slice().reverse(), false)}`;
}

function handSvg() {
  const paths = [...DIGITS, THUMB].map(digit => `<path d="${digitPath(digit)}"/>`).join('');
  const edges = EDGES.map(points => `<path d="${through(points, true)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
    + `<g fill="none" stroke="${INK}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">`
    + edges + paths
    + `</g></svg>`;
}

const left = handSvg();
// Tay phải là ảnh gương: người ta đối xứng, nên chỉ phải chỉnh một bàn tay.
const right = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
  + `<g transform="translate(${W} 0) scale(-1 1)">`
  + left.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  + `</g></svg>`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'left.svg'), left);
fs.writeFileSync(path.join(OUT, 'right.svg'), right);

const tips = { left: {}, right: {} };
[...DIGITS, THUMB].forEach(digit => {
  tips.left[digit.id] = [r1(digit.tip[0]), r1(digit.tip[1])];
  tips.right[digit.id.replace(/^L/, 'R')] = [r1(W - digit.tip[0]), r1(digit.tip[1])];
});

const order = { left: ['LP', 'LR', 'LM', 'LI', 'LT'], right: ['RI', 'RM', 'RR', 'RP', 'RT'] };
const lines = ['  const PHOTOS = {'];
for (const side of ['left', 'right']) {
  const entries = order[side].map(code => `${code}: [${tips[side][code][0]}, ${tips[side][code][1]}]`).join(', ');
  lines.push(`    ${side}: { src: '/assets/hands/${side}.svg', width: ${W}, height: ${H},`);
  lines.push(`      tips: { ${entries} } }${side === 'left' ? ',' : ''}`);
}
lines.push('  };');

const handsPath = path.join(ROOT, 'hands.js');
const raw = fs.readFileSync(handsPath, 'utf8');
const crlf = raw.includes('\r\n');
const text = raw.replace(/\r\n/g, '\n');
const pattern = /(\/\/ >>> HAND_PHOTOS[^\n]*\n)[\s\S]*?(\n  \/\/ <<< HAND_PHOTOS)/;
if (!pattern.test(text)) throw new Error('không thấy khối HAND_PHOTOS trong hands.js');
const next = text.replace(pattern, (match, head, tail) => head + lines.join('\n') + tail);
fs.writeFileSync(handsPath, crlf ? next.replace(/\n/g, '\r\n') : next);

for (const side of ['left', 'right'])
  console.log(`${side}: ${W}x${H}, ${Math.round(fs.statSync(path.join(OUT, `${side}.svg`)).size / 1024 * 10) / 10} KB`);
console.log('Đã cập nhật khối HAND_PHOTOS trong hands.js');
