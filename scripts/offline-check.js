#!/usr/bin/env node
/*
 * scripts/offline-check.js — kiểm service worker bằng cách MẤT MẠNG THẬT.
 *
 * Chạy:  PW=<thư mục>/node_modules/playwright-core node scripts/offline-check.js
 *   CHROME=<đường dẫn chrome.exe>  mặc định C:/Program Files/Google/Chrome/Application/chrome.exe
 *   PORT=<cổng>                    mặc định 8791
 *
 * Vì sao không nằm trong scripts/e2e.js: `context.setOffline(true)` VÀ `context.route(... abort)`
 * của Playwright đều KHÔNG với tới fetch do service worker phát ra (đo ngày 18/09/2026, Chromium
 * qua playwright-core 1.49) — trang vẫn tải sống nhăn qua mạng và bài kiểm "offline" xanh lè một
 * cách vô nghĩa. Cách duy nhất trung thực là tắt hẳn server, nên script này TỰ dựng server của
 * mình rồi tự giết, thay vì mượn server mà e2e.js đang dùng.
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright-core');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8791);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
};

// Bộ đếm cho phép kiểm "còn mạng thì luôn là bản mới": mỗi lần gọi trả một con số khác.
let counter = 0;

function serve() {
  const server = http.createServer((request, response) => {
    if (request.url.startsWith('/__fresh.txt')) {
      counter += 1;
      response.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
      response.end(String(counter));
      return;
    }
    let filePath = path.join(ROOT, decodeURIComponent(request.url.split('?')[0]));
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (error, body) => {
      if (error) { response.writeHead(404); response.end('not found'); return; }
      response.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
      response.end(body);
    });
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

const checks = [];
const check = (name, fn) => checks.push({ name, fn });

check('bài đã học vẫn gõ được khi mất mạng', async page => {
  await page.goto(`${BASE}/hoc/#u1-l01/2`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.TypingEasePlayer && window.TypingEasePlayer.getState().state !== 'loading', { timeout: 15000 });
  const info = await page.evaluate(() => ({
    keys: document.querySelectorAll('#board .key').length,
    lesson: document.querySelector('#pt-lesson').textContent.trim(),
    state: window.TypingEasePlayer.getState().state,
    // Nền lấy từ base.css: CSS mà không về thì trang trắng trơn, vẫn "chạy" nhưng nhìn như hỏng.
    css: getComputedStyle(document.body).backgroundColor
  }));
  assert.strictEqual(info.keys, 60, 'đủ 60 phím');
  assert.strictEqual(info.state, 'typing', 'vào thẳng màn gõ');
  assert.ok(info.lesson && info.lesson !== 'Đang tải…', `tên bài: ${info.lesson}`);
  assert.strictEqual(info.css, 'rgb(246, 250, 247)', `CSS phải về được, thấy ${info.css}`);
});

check('trang chủ vẫn mở được khi mất mạng', async page => {
  const response = await page.goto(`${BASE}/`, { waitUntil: 'load' });
  assert.strictEqual(response.status(), 200);
  assert.ok(/TypingEase/.test(await page.title()), 'title trang chủ');
  assert.ok(await page.evaluate(() => document.querySelectorAll('#roadmap .lesson-chip, #roadmap a').length > 0
    || document.querySelector('#hero-go') !== null), 'lộ trình/CTA vẫn dựng');
});

check('trang chưa từng mở ra trang offline của site', async page => {
  const response = await page.goto(`${BASE}/luyen-phim-yeu/`, { waitUntil: 'load' });
  assert.strictEqual(response.status(), 503, 'trả 503 chứ không phải 200 giả');
  assert.ok(await page.evaluate(() => Boolean(document.querySelector('#offline-note'))),
    'phải là trang "Mất mạng rồi" tự chứa, không phải khủng long của trình duyệt');
  assert.ok(await page.evaluate(() => document.querySelector('#offline-note a').getAttribute('href') === '/'),
    'có lối về trang chủ');
});

(async () => {
  const server = await serve();
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

  // 1. Hâm cache đúng như một người dùng thật: vào trang chủ, rồi học một bài.
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto(`${BASE}/hoc/#u1-l01/2`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.TypingEasePlayer && window.TypingEasePlayer.getState().state !== 'loading');
  await sleep(1500);   // stale-while-revalidate ghi cache sau khi trả lời, đừng cắt ngang
  assert.ok(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), 'service worker chưa kiểm soát trang');

  // 1b. CÒN MẠNG thì phải là bản mới. Bản v1 của sw.js cho tài nguyên tĩnh đi
  // stale-while-revalidate, nên sửa CSS xong tải lại vẫn ra bản cũ đúng một lần — đủ để người sửa
  // tưởng mình sai. Hai lần gọi cùng một URL phải ra hai giá trị khác nhau.
  const first = await page.evaluate(() => fetch('/__fresh.txt').then(response => response.text()));
  const second = await page.evaluate(() => fetch('/__fresh.txt').then(response => response.text()));
  assert.notStrictEqual(second, first, `service worker trả bản cache khi vẫn còn mạng (${first} rồi ${second})`);
  console.log(`PASS còn mạng thì luôn lấy bản mới (${first} → ${second})`);

  // 2. Mất mạng thật: server biến mất khỏi đời.
  await new Promise(resolve => server.close(resolve));
  await sleep(800);

  let failed = 0;
  for (const { name, fn } of checks) {
    const started = Date.now();
    try { await fn(page); console.log(`PASS ${name} (${Date.now() - started}ms)`); }
    catch (error) { failed += 1; console.log(`FAIL ${name}\n    ${String(error.message).split('\n').join('\n    ')}`); }
  }
  if (errors.length) { failed += 1; console.log(`FAIL lỗi JS của trang:\n    ${errors.join('\n    ')}`); }
  await browser.close();
  console.log(`
${checks.length - failed}/${checks.length} PASS khi mất mạng thật (server đã tắt) + 1 khi còn mạng`);
  process.exit(failed ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
