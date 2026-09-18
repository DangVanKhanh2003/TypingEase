#!/usr/bin/env node
/*
 * scripts/render-hands.js — biến `scripts/draw-hands.html` thành `assets/hands/{left,right}.webp`
 * và cập nhật khối HAND_PHOTOS trong `hands.js`.
 *
 * Chạy (cần playwright-core như scripts/e2e.js; repo không giữ dependency nào):
 *   PW=<thư mục>/node_modules/playwright-core node scripts/render-hands.js
 * Tuỳ chọn:
 *   CHROME=<đường dẫn chrome.exe>   mặc định C:/Program Files/Google/Chrome/Application/chrome.exe
 *
 * Ảnh chụp với `omitBackground` nên nền trong suốt; sau đó cắt sát mép đặc (bbox theo kênh alpha)
 * và trừ đi phần cắt khỏi toạ độ đầu ngón, vì hands.js đo đầu ngón theo góc trên-trái của FILE.
 *
 * Khi chủ site có ảnh chụp tay thật, dùng `scripts/hand-photo.py` thay cho cả hai file này.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright-core');

const ROOT = path.dirname(__dirname);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.join(ROOT, 'assets', 'hands');
const SOURCE = path.join(ROOT, 'scripts', 'draw-hands.html');
// WebP có kênh trong suốt và nhỏ hơn PNG chừng năm lần với loại hình nhiều dải chuyển màu như
// bàn tay (292 KB → 55 KB mỗi bàn). Trình duyệt nào chạy nổi site này cũng đọc được WebP.
const FORMAT = 'webp', QUALITY = 0.92;

// Cắt sát mép đặc: đọc PNG bằng chính trình duyệt (canvas) thay vì thêm một thư viện ảnh.
const CROP = `(dataUrl, alphaFloor, type, quality) => new Promise(resolve => {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (data[(y * canvas.width + x) * 4 + 3] > alphaFloor) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) { resolve(null); return; }
    const width = maxX - minX + 1, height = maxY - minY + 1;
    const out = document.createElement('canvas');
    out.width = width; out.height = height;
    out.getContext('2d').drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
    resolve({ x: minX, y: minY, width, height, dataUrl: out.toDataURL(type, quality) });
  };
  image.src = dataUrl;
})`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 })).newPage();
  await page.goto('file:///' + SOURCE.replace(/\\/g, '/'), { waitUntil: 'load' });
  // Trang xem có nền tối và mỗi bàn tay nằm trên một ô carô; ảnh chụp theo vùng của SVG lấy cả
  // hai thứ đó. `omitBackground` CHỈ có tác dụng khi trang không tự đặt nền, nên phải tắt cả nền
  // của <body> lẫn nền ô carô — nếu không kênh alpha đặc kín 255 và phép cắt sát mép vô dụng.
  await page.addStyleTag({ content: 'html,body{background:transparent!important}.plate{background:none!important}' });
  const info = await page.evaluate(() => window.HAND_EXPORT);
  const photos = {};
  for (const side of ['left', 'right']) {
    const shot = await page.locator(`#${side}`).screenshot({ omitBackground: true });
    const cropped = await page.evaluate(([fn, dataUrl, format, quality]) => eval(fn)(dataUrl, 8, format, quality),
      [CROP, 'data:image/png;base64,' + shot.toString('base64'), `image/${FORMAT}`, QUALITY]);
    if (!cropped) throw new Error(`${side}: ảnh rỗng`);
    fs.writeFileSync(path.join(OUT, `${side}.${FORMAT}`), Buffer.from(cropped.dataUrl.split(',')[1], 'base64'));
    const tips = {};
    for (const [code, [x, y]] of Object.entries(info.tips[side]))
      tips[code] = [Math.round((x - cropped.x) * 10) / 10, Math.round((y - cropped.y) * 10) / 10];
    photos[side] = { width: cropped.width, height: cropped.height, tips };
    const kb = Math.round(fs.statSync(path.join(OUT, `${side}.${FORMAT}`)).size / 1024);
    console.log(`${side}: ${cropped.width}x${cropped.height}, ${kb} KB, cắt (${cropped.x}, ${cropped.y})`);
  }
  await browser.close();

  const order = { left: ['LP', 'LR', 'LM', 'LI', 'LT'], right: ['RI', 'RM', 'RR', 'RP', 'RT'] };
  const lines = ['  const PHOTOS = {'];
  for (const side of ['left', 'right']) {
    const photo = photos[side];
    const entries = order[side].map(code => `${code}: [${photo.tips[code][0]}, ${photo.tips[code][1]}]`).join(', ');
    lines.push(`    ${side}: { src: '/assets/hands/${side}.${FORMAT}', width: ${photo.width}, height: ${photo.height},`);
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
  console.log('Đã cập nhật khối HAND_PHOTOS trong hands.js');
})().catch(error => { console.error(error); process.exit(1); });
