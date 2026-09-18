#!/usr/bin/env node
/*
 * scripts/e2e.js — kiểm thử đầu-cuối cho player, trang chủ và các trang phụ bằng playwright-core.
 *
 * Chạy (server tĩnh phải đang phục vụ thư mục gốc của repo, ví dụ `npx http-server -p 8765 -s .`):
 *   PW=<thư mục>/node_modules/playwright-core node scripts/e2e.js [baseUrl]
 * Tuỳ chọn:
 *   CHROME=<đường dẫn chrome.exe>   mặc định C:/Program Files/Google/Chrome/Application/chrome.exe
 *   E2E_OUT=<thư mục>               nơi lưu screenshot khi FAIL (mặc định <tmp>/typingease-e2e)
 *   ONLY=<chuỗi>                    chỉ chạy test có tên chứa chuỗi này
 *
 * Không có framework: mỗi test là `async (page, ctx) => {}` dùng assert của Node. Mỗi test chạy trong
 * một browser context mới (localStorage trống) nên tiến độ của test này không đổi hero của test kia.
 * Mọi `pageerror` và `console.error` của trang làm test FAIL.
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright-core');

const BASE = (process.argv[2] || 'http://127.0.0.1:8765').replace(/\/$/, '');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = process.env.E2E_OUT || path.join(os.tmpdir(), 'typingease-e2e');
const ONLY = process.env.ONLY || '';
const DESKTOP = { width: 1440, height: 1000 };

// --- helpers -----------------------------------------------------------------------------------
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Bảng phím -> ngón của keyboard-widget.js, chép lại để test không phụ thuộc vào chính module đang test.
const FINGERS = {
  q: 'LP', a: 'LP', z: 'LP', w: 'LR', s: 'LR', x: 'LR', e: 'LM', d: 'LM', c: 'LM',
  r: 'LI', f: 'LI', v: 'LI', t: 'LI', g: 'LI', b: 'LI', y: 'RI', h: 'RI', n: 'RI', u: 'RI', j: 'RI', m: 'RI',
  i: 'RM', k: 'RM', ',': 'RM', o: 'RR', l: 'RR', '.': 'RR', p: 'RP', ';': 'RP', '/': 'RP', ' ': 'LT'
};

// Ghi lại mọi class được THÊM vào phím / ngón trong `root`, kèm mốc thời gian, để bắt được các
// class chỉ sống 250 ms (is-animating, is-wrong, pressing) mà một lần đọc DOM có thể bỏ lỡ.
async function watchClasses(page, rootSelector) {
  await page.evaluate(selector => {
    const root = document.querySelector(selector);
    window.__e2e = { added: [], inputAt: null };
    // pulse() gỡ rồi gắn lại class trong cùng một tick, nên một lô records có thể chứa nhiều lần
    // đổi của cùng một phím. Giá trị SAU record N là oldValue của record N+1 (cùng target), hoặc
    // className hiện tại với record cuối — nhờ đó mỗi lần thêm class đều được đếm.
    const split = value => new Set(String(value || '').split(/\s+/).filter(Boolean));
    const observer = new MutationObserver(records => {
      const at = performance.now();
      records.forEach((record, index) => {
        const element = record.target;
        const next = records.slice(index + 1).find(other => other.target === element);
        const before = split(record.oldValue);
        const after = next ? split(next.oldValue) : new Set(element.classList);
        for (const name of after) {
          if (!before.has(name)) {
            window.__e2e.added.push({
              className: name, at,
              key: element.dataset.pkey ?? element.dataset.tkey ?? null,
              finger: element.dataset.finger ?? null
            });
          }
        }
      });
    });
    observer.observe(root, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class'] });
    document.addEventListener('input', () => { window.__e2e.inputAt = performance.now(); }, true);
  }, rootSelector);
}
const addedClasses = page => page.evaluate(() => window.__e2e);

const boardState = (page, board = '#board') => page.evaluate(selector => {
  const root = document.querySelector(selector);
  const attr = element => element?.dataset.pkey ?? element?.dataset.tkey ?? null;
  return {
    keys: root.querySelectorAll('.key').length,
    fingers: root.querySelectorAll('.hand-layer .finger').length,
    handLayer: Boolean(root.querySelector('.hand-layer')),
    activeKey: attr(root.querySelector('.key.active-key')),
    activeMod: [...root.querySelectorAll('.key.active-mod')].map(element => `${attr(element)}:${element.className.includes('key--special-l') ? 'l' : element.className.includes('key--special-r') ? 'r' : '?'}`),
    activeFinger: root.querySelector('.finger.active-finger')?.dataset.finger ?? null,
    hasNumberRow: Boolean(root.querySelector('.key[data-pkey="1"], .key[data-tkey="1"]'))
  };
}, board);

const playerState = page => page.evaluate(() => ({
  ...window.TypingEasePlayer.getState(),
  run: window.TypingEasePlayer.getRun(),
  live: document.querySelector('#live').textContent,
  screenLabel: document.querySelector('#pt-screen').textContent,
  hash: location.hash,
  focused: document.activeElement && document.activeElement.id,
  value: document.querySelector('#player-input').value
}));

const lessonJson = async (page, id) => {
  const response = await page.request.get(`${BASE}/data/lessons/vi/${id}.json`);
  assert.ok(response.ok(), `không tải được bài ${id}`);
  return response.json();
};
// Cùng cách nối dòng của player.buildTarget: "space" (mặc định) hoặc "enter".
const targetOf = screen => String(screen.content).split('\n').map(line => line.trim()).filter(Boolean)
  .join(screen.linebreak === 'enter' ? '\n' : ' ');

async function openPlayer(page, hash) {
  await page.goto(`${BASE}/hoc/#${hash}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.TypingEasePlayer && !['loading'].includes(window.TypingEasePlayer.getState().state));
  await sleep(150);   // drawHands chạy sau layout; chờ một nhịp cho .hand-layer
}

// --- tests -------------------------------------------------------------------------------------
const tests = [];
const test = (name, options, fn) => tests.push(typeof options === 'function' ? { name, fn: options, options: {} } : { name, fn, options });

test('1 player load: 60 phím, 10 ngón, phím + ngón đầu screen', async page => {
  await openPlayer(page, 'u1-l01/2');
  const lesson = await lessonJson(page, 'u1-l01');
  const first = targetOf(lesson.screens[1])[0];
  const board = await boardState(page);
  const state = await playerState(page);
  assert.strictEqual(state.state, 'typing');
  assert.strictEqual(state.screenLabel, 'Screen 2 / 10');
  assert.strictEqual(board.keys, 60, 'số phím');
  assert.strictEqual(board.fingers, 10, 'số ngón');
  assert.strictEqual(board.activeKey, first, 'phím active = ký tự đầu');
  assert.strictEqual(board.activeFinger, FINGERS[first], 'ngón active theo bảng FINGERS');
  assert.strictEqual(state.focused, 'player-input', 'ô nhập tự focus');
});

test('2 gõ đúng: phím nhún (is-animating ≤150ms), highlight + ngón chuyển', async page => {
  await openPlayer(page, 'u1-l01/6');   // "jjj fff jjj fff jf fj": ký tự thứ 4 là dấu cách, thứ 5 là f
  await watchClasses(page, '#board');
  await page.keyboard.type('jjj', { delay: 30 });
  await sleep(60);
  let added = await addedClasses(page);
  const presses = added.added.filter(entry => entry.className === 'is-animating');
  assert.ok(presses.length >= 3, `is-animating xuất hiện ${presses.length} lần, cần ≥3`);
  assert.ok(presses.every(entry => entry.key === 'j'), 'phím nhún là phím vừa gõ (j)');
  const last = presses[presses.length - 1];
  assert.ok(added.inputAt !== null && last.at - added.inputAt <= 150, `nhún sau input ${Math.round(last.at - added.inputAt)}ms`);
  assert.ok(added.added.some(entry => entry.className === 'pressing' && entry.finger === 'RI'), 'ngón trỏ phải nhún (pressing)');
  let board = await boardState(page);
  assert.strictEqual(board.activeKey, ' ', 'sau jjj highlight sang dấu cách');
  // Dấu cách là ngón cái; tay nào tuỳ bản widget (typing.com dùng ngón cái phải, PLAN-ban-tay C4).
  assert.ok(/^[LR]T$/.test(board.activeFinger), `ngón cái, thấy ${board.activeFinger}`);
  await page.keyboard.type(' ');
  await sleep(40);
  board = await boardState(page);
  assert.strictEqual(board.activeKey, 'f');
  assert.strictEqual(board.activeFinger, 'LI');
  added = await addedClasses(page);
  assert.ok(!added.added.some(entry => entry.className === 'is-wrong'), 'không có phím nào nháy đỏ');
  const state = await playerState(page);
  assert.strictEqual(state.run.errors, 0);
  assert.strictEqual(state.value, 'jjj ');
});

test('3 gõ sai: phím sai nháy đỏ, lỗi tăng, highlight đứng yên', async page => {
  await openPlayer(page, 'u1-l01/2');   // toàn j
  await watchClasses(page, '#board');
  await page.keyboard.type('k');
  await sleep(60);
  const added = await addedClasses(page);
  const wrong = added.added.filter(entry => entry.className === 'is-wrong');
  assert.strictEqual(wrong.length, 1, 'is-wrong đúng 1 lần');
  assert.strictEqual(wrong[0].key, 'k', 'nháy đỏ trên phím K vừa gõ');
  assert.ok(!added.added.some(entry => entry.className === 'is-animating'), 'phím đích không nhún khi gõ sai');
  const state = await playerState(page);
  assert.strictEqual(state.run.errors, 1, 'bộ đếm lỗi');
  assert.ok(/1 lỗi/.test(state.live), `live: ${state.live}`);
  // Ký tự sai vẫn chiếm chỗ (như typing.com), nên highlight đi tiếp tới ký tự kế — vẫn là j.
  const board = await boardState(page);
  assert.strictEqual(board.activeKey, 'j');
  assert.strictEqual(board.activeFinger, 'RI');
  await sleep(300);
  const after = await page.evaluate(() => document.querySelectorAll('#board .key.is-wrong').length);
  assert.strictEqual(after, 0, 'is-wrong tự gỡ sau 250ms');
});

test('4 hết screen: bảng kết quả, Enter sang screen kế', async page => {
  await openPlayer(page, 'u1-l01/2');
  const lesson = await lessonJson(page, 'u1-l01');
  const target = targetOf(lesson.screens[1]);
  await page.keyboard.type(target, { delay: 15 });
  await page.waitForFunction(() => window.TypingEasePlayer.getState().state === 'screen-result');
  assert.ok(await page.locator('#stage .result-card').isVisible(), 'result card');
  const stars = await page.locator('#stage .star.is-on').count();
  assert.strictEqual(stars, 3, '100% chính xác → 3 sao');
  assert.ok(/100% chính xác/.test(await page.locator('#stage .result-stats').textContent()));
  assert.strictEqual(await boardState(page).then(board => board.activeKey), null, 'không phím nào sáng ở bảng kết quả');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash === '#u1-l01/3');
  await page.waitForFunction(() => window.TypingEasePlayer.getState().state === 'intro');
  const state = await playerState(page);
  assert.strictEqual(state.screenLabel, 'Screen 3 / 10');
  assert.strictEqual(state.screenIndex, 2);
  // Thanh tiến độ ghi nhận screen 2 đã xong.
  const segs = await page.evaluate(() => [...document.querySelectorAll('#pt-progress .seg')].map(seg => seg.className.replace('seg ', '')));
  assert.strictEqual(segs[1], 'is-done');
  assert.strictEqual(segs[2], 'is-current');
});

test('5 shift: chữ hoa sáng Shift tay đối diện (active-mod)', async page => {
  await openPlayer(page, 'u2-l09/2');   // "Aa Ss Dd Ff\nJj Kk Ll Hh…"
  let board = await boardState(page);
  assert.strictEqual(board.activeKey, 'a', 'A → phím a sáng');
  assert.strictEqual(board.activeFinger, 'LP');
  assert.deepStrictEqual(board.activeMod, ['shift:r'], 'chữ A (tay trái) → Shift PHẢI');
  await page.keyboard.type('Aa ');
  await sleep(40);
  board = await boardState(page);
  assert.strictEqual(board.activeKey, 's');
  await page.keyboard.type('Ss Dd Ff ');
  await sleep(40);
  board = await boardState(page);
  assert.strictEqual(board.activeKey, 'j', 'J → phím j');
  assert.deepStrictEqual(board.activeMod, ['shift:l'], 'chữ J (tay phải) → Shift TRÁI');
  await page.keyboard.type('J');
  await sleep(40);
  board = await boardState(page);
  assert.deepStrictEqual(board.activeMod, [], 'chữ thường không cần Shift');
  const state = await playerState(page);
  assert.strictEqual(state.run.errors, 0);
});

test('6 telex: ký tự đang compose là pending, không nháy đỏ, highlight theo phím dấu', async page => {
  await openPlayer(page, 'u3-l01/2');   // "má cá bá lá…", inputMode telex
  assert.strictEqual(await page.evaluate(() => document.querySelector('#player').dataset.inputMode), 'telex');
  await watchClasses(page, '#board');
  const input = page.locator('#player-input');
  // Mô phỏng IME Telex: giá trị ô nhập đi qua m → ma → má (phím s bị IME nuốt, chỉ đổi chữ).
  await page.keyboard.type('m');
  await sleep(30);
  let board = await boardState(page);
  assert.strictEqual(board.activeKey, 'a', 'sau m → a');
  await input.fill('ma');
  await sleep(30);
  let states = await page.evaluate(() => [...document.querySelectorAll('#prompt-lines .ch')].slice(0, 3).map(el => el.className));
  assert.ok(/\bok\b/.test(states[0]), `m: ${states[0]}`);
  assert.ok(/\bpending\b/.test(states[1]), `a đang compose phải pending: ${states[1]}`);
  board = await boardState(page);
  assert.strictEqual(board.activeKey, 's', 'đang compose á → highlight phím dấu sắc S');
  assert.strictEqual(board.activeFinger, 'LR');
  await input.fill('má');
  await sleep(30);
  states = await page.evaluate(() => [...document.querySelectorAll('#prompt-lines .ch')].slice(0, 3).map(el => el.className));
  assert.ok(/\bok\b/.test(states[1]), `á sau khi compose xong phải ok: ${states[1]}`);
  board = await boardState(page);
  assert.strictEqual(board.activeKey, ' ', 'xong má → dấu cách');
  const added = await addedClasses(page);
  assert.ok(!added.added.some(entry => entry.className === 'is-wrong'), 'không có is-wrong trong lúc compose');
  const state = await playerState(page);
  assert.strictEqual(state.run.errors, 0, 'không lỗi');
  // Gõ sai thật trong telex vẫn báo lỗi theo âm tiết.
  await input.fill('má x');
  await sleep(30);
  const bad = await page.evaluate(() => [...document.querySelectorAll('#prompt-lines .ch')][3].className);
  assert.ok(/\bbad\b/.test(bad), `x thay cho c phải bad: ${bad}`);
});

// Trang chủ không còn ô gõ thử: vào trang là thấy ngay lộ trình để chọn bài. Test này canh đúng
// hai điều dễ vỡ khi ai đó thêm lại thứ gì vào hero — bàn phím/bàn tay quay lại, và lộ trình bị
// đẩy xuống dưới màn hình đầu.
const homeShape = page => page.evaluate(() => {
  const rect = document.querySelector('#roadmap-title').getBoundingClientRect();
  const start = document.querySelector('#hero-start');
  return {
    returning: document.body.classList.contains('is-returning'),
    widgets: document.querySelectorAll('#taster, .taster-line, .hand-layer, .keyboard, .kb-widget, .tc-board').length,
    languagePickers: document.querySelectorAll('#language, .language-select').length,
    startVisible: Boolean(start && start.offsetParent !== null),
    startHref: document.querySelector('#hero-go')?.getAttribute('href') ?? null,
    railItems: document.querySelectorAll('#unit-rail a, #unit-rail button').length,
    teasers: document.querySelectorAll('#unit-teasers li').length,
    roadmapTop: rect.top,
    roadmapBottom: rect.bottom,
    viewport: innerHeight
  };
});

test('7 trang chủ: không còn bàn phím/bàn tay, lộ trình hiện ngay', async page => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#unit-rail a, #unit-rail button');
  const home = await homeShape(page);
  assert.ok(!home.returning, 'khách mới không phải is-returning');
  assert.strictEqual(home.widgets, 0, `hero còn ${home.widgets} widget bàn phím/bàn tay`);
  assert.strictEqual(home.languagePickers, 0, 'không còn bộ chọn ngôn ngữ');
  assert.ok(home.startVisible, '#hero-start hiện cho khách mới');
  assert.ok(/hoc\/?$/.test(home.startHref || ''), `#hero-go trỏ vào player: ${home.startHref}`);
  assert.ok(home.railItems >= 10, `rail có ${home.railItems} bài, cần ≥10`);
  assert.ok(home.teasers >= 1, 'còn teaser của các unit sau');
  assert.ok(home.roadmapBottom <= home.viewport, `lộ trình phải lọt màn hình đầu: bottom ${Math.round(home.roadmapBottom)} > ${home.viewport}`);

  // Khách mới gõ Enter ở trang chủ → vào thẳng bài học, không cần tìm nút.
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/hoc\//, { timeout: 4000 });
});

test('7b trang chủ 1366x768: lộ trình vẫn lọt màn hình đầu', { viewport: { width: 1366, height: 768 } }, async page => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#unit-rail a, #unit-rail button');
  const home = await homeShape(page);
  assert.strictEqual(home.widgets, 0);
  assert.ok(home.roadmapTop < home.viewport, `tiêu đề lộ trình phải thấy được: top ${Math.round(home.roadmapTop)} ≥ ${home.viewport}`);
});

test('8a responsive 1024: bàn phím đầy đủ + tay', { viewport: { width: 1024, height: 900 } }, async page => {
  await openPlayer(page, 'u1-l01/2');
  const board = await boardState(page);
  assert.strictEqual(board.keys, 60);
  assert.ok(board.hasNumberRow, 'còn hàng số');
  // player.js: tay hiện khi (min-width: 900px) → 1024 vẫn có tay.
  assert.ok(board.handLayer && board.fingers === 10, 'tay hiện ở 1024px');
  const classes = await page.evaluate(() => document.querySelector('#board').className);
  assert.ok(!/no-hands|is-compact/.test(classes), classes);
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  assert.ok(fits, 'không tràn ngang');
});

test('8b responsive 390 (phone): compact, không hàng số, không tay', { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true }, async page => {
  await openPlayer(page, 'u1-l01/2');
  const board = await boardState(page);
  assert.ok(!board.hasNumberRow, 'không có hàng số');
  assert.ok(board.keys < 60 && board.keys >= 20, `bàn phím compact (${board.keys} phím)`);
  assert.ok(!board.handLayer, 'không có .hand-layer');
  const classes = await page.evaluate(() => document.querySelector('#board').className);
  assert.ok(/is-compact/.test(classes) && /no-hands/.test(classes), classes);
  assert.strictEqual(board.activeKey, 'j', 'phím đích vẫn sáng');
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  assert.ok(fits, 'không tràn ngang');
});

test('9 reduced motion: highlight vẫn chạy, không lỗi', { reducedMotion: 'reduce' }, async page => {
  await openPlayer(page, 'u1-l01/6');
  assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
  await watchClasses(page, '#board');
  await page.keyboard.type('jjj ', { delay: 20 });
  await sleep(50);
  const board = await boardState(page);
  assert.strictEqual(board.activeKey, 'f');
  assert.strictEqual(board.activeFinger, 'LI');
  const added = await addedClasses(page);
  assert.ok(added.added.some(entry => entry.className === 'is-animating'), 'class vẫn gắn (CSS tắt animation)');
  const anim = await page.evaluate(() => {
    const key = document.querySelector('#board .key.active-key');
    key.classList.add('is-animating');
    const name = getComputedStyle(key).animationName;
    key.classList.remove('is-animating');
    return name;
  });
  assert.strictEqual(anim, 'none', `animation phải tắt khi reduced-motion, thấy "${anim}"`);
});

// --- chuyển động ngón (PLAN-ban-tay Phase C) --------------------------------------------------
// Tư thế là `style.transform` trên `.finger` và `.ghost-hand`, chuyển bằng CSS transition
// (--hand-speed, mặc định .275s) nên đo vị trí móng sau khi transition kết thúc.
const SETTLE_MS = 700;
const poseState = (page, board = '#board') => page.evaluate(selector => {
  const root = document.querySelector(selector);
  const origin = root.getBoundingClientRect();
  const box = element => { const r = element.getBoundingClientRect(); return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height, cx: r.left + r.width / 2 - origin.left, cy: r.top + r.height / 2 - origin.top }; };
  const fingers = {};
  root.querySelectorAll('.hand-layer .finger').forEach(group => {
    const nail = group.querySelector('.hand-nail');
    fingers[group.dataset.finger] = {
      key: group.dataset.key, transform: group.style.transform || '',
      active: group.classList.contains('active-finger'), full: group.classList.contains('glow-full'),
      nail: nail ? box(nail) : null
    };
  });
  const hands = {};
  root.querySelectorAll('.hand-layer .ghost-hand').forEach(hand => { hands[hand.classList.contains('left-hand') ? 'left' : 'right'] = hand.style.transform || ''; });
  const keyBox = id => { const element = root.querySelector(`.key[data-pkey="${id}"]`); return element ? box(element) : null; };
  const shifts = [...root.querySelectorAll('.key[data-pkey="shift"]')].map(box);
  return {
    fingers, hands, speed: root.style.getPropertyValue('--hand-speed').trim(),
    hostClass: root.className,
    keys: { e: keyBox('e'), a: keyBox('a'), shiftLeft: shifts[0] || null, shiftRight: shifts[shifts.length - 1] || null }
  };
}, board);
// Tâm móng nằm trong phím: ±8px theo X; theo Y móng nằm dưới đầu ngón nên cho lệch tới +14px.
function assertNailOn(nail, key, label) {
  assert.ok(nail && key, `${label}: thiếu móng hoặc phím`);
  assert.ok(nail.cx >= key.x - 8 && nail.cx <= key.x + key.w + 8, `${label}: móng X ${nail.cx.toFixed(0)} ngoài phím [${key.x.toFixed(0)}, ${(key.x + key.w).toFixed(0)}]`);
  assert.ok(nail.cy >= key.y - 8 && nail.cy <= key.y + key.h + 14, `${label}: móng Y ${nail.cy.toFixed(0)} ngoài phím [${key.y.toFixed(0)}, ${(key.y + key.h).toFixed(0)}]`);
}

test('11 pose: ngón giữa trái với lên E rồi về D', async page => {
  await openPlayer(page, 'u1-l07/2');   // "eeee dddd…": e hàng trên, d hàng cơ sở — cùng ngón LM
  await sleep(SETTLE_MS);
  let pose = await poseState(page);
  const lm = pose.fingers.LM;
  assert.ok(lm.active, 'LM active');
  assert.notStrictEqual(lm.transform, '', 'LM có transform khi với lên E');
  assertNailOn(lm.nail, pose.keys.e, 'LM trên E');
  assert.notStrictEqual(pose.hands.left, '', 'bàn tay trái dịch theo');
  assert.strictEqual(pose.hands.right, '', 'bàn tay phải đứng yên');
  for (const code of ['RI', 'RM', 'RR', 'RP', 'RT']) assert.strictEqual(pose.fingers[code].transform, '', `${code} không transform`);
  await page.keyboard.type('eeee ', { delay: 20 });   // phím kế là d: hàng cơ sở của chính LM
  await sleep(SETTLE_MS);
  pose = await poseState(page);
  assert.strictEqual(await boardState(page).then(board => board.activeKey), 'd');
  assert.ok(pose.fingers.LM.active);
  assert.strictEqual(pose.fingers.LM.transform, '', 'về D thì transform rỗng lại');
  assert.strictEqual(pose.hands.left, '', 'bàn tay trái về chỗ');
});

test('12 pose Shift: chữ A → ngón út phải glow-full tới Shift phải', async page => {
  await openPlayer(page, 'u2-l09/2');   // "Aa Ss…"
  await sleep(SETTLE_MS);
  const pose = await poseState(page);
  const rp = pose.fingers.RP, lp = pose.fingers.LP;
  assert.ok(rp.active && rp.full, 'RP active + glow-full');
  assert.notStrictEqual(rp.transform, '', 'RP di chuyển');
  assertNailOn(rp.nail, pose.keys.shiftRight, 'RP trên Shift phải');
  assert.notStrictEqual(pose.hands.right, '', 'bàn tay phải dịch theo');
  assert.ok(lp.active && !lp.full, 'LP active, không glow-full');
  assert.strictEqual(lp.transform, '', 'LP đã nằm trên A nên không transform');
  assertNailOn(lp.nail, pose.keys.a, 'LP trên A');
  assert.strictEqual(pose.hands.left, '', 'bàn tay trái đứng yên');
  const active = Object.entries(pose.fingers).filter(([, finger]) => finger.active).map(([code]) => code).sort();
  assert.deepStrictEqual(active, ['LP', 'RP']);
});

test('13 pose Space: ngón cái phải active, không transform, tay trái nghỉ', async page => {
  await openPlayer(page, 'u1-l01/6');   // "jjj fff…"
  await page.keyboard.type('jjj', { delay: 20 });
  await sleep(SETTLE_MS);
  assert.strictEqual(await boardState(page).then(board => board.activeKey), ' ');
  const pose = await poseState(page);
  assert.ok(pose.fingers.RT.active, 'RT active');
  assert.strictEqual(pose.fingers.RT.key, ' ', 'ngón cái phải nghỉ trên Space');
  assert.strictEqual(pose.fingers.RT.transform, '', 'không transform');
  for (const code of ['LP', 'LR', 'LM', 'LI', 'LT']) assert.ok(!pose.fingers[code].active, `${code} không active`);
  assert.strictEqual(pose.hands.left, '');
  assert.strictEqual(pose.hands.right, '');
});

test('14 tốc độ thích ứng: --hand-speed giảm khi gõ nhanh', async page => {
  await openPlayer(page, 'u1-l01/8');   // standard "jjf jjf fjj fjj…"
  const before = (await poseState(page)).speed;
  assert.ok(before === '' || parseFloat(before) === 0.275, `ban đầu "${before}"`);
  const lesson = await lessonJson(page, 'u1-l01');
  await page.keyboard.type(targetOf(lesson.screens[7]).slice(0, 8), { delay: 120 });
  await sleep(50);
  const after = parseFloat((await poseState(page)).speed);
  assert.ok(Number.isFinite(after), 'có giá trị');
  assert.ok(after < 0.275 && after >= 0.09, `--hand-speed = ${after}s, cần trong [0.09, 0.275)`);
  assert.strictEqual((await playerState(page)).run.errors, 0);
});

test('15 hands-static: animatedHands:false → active-finger nhưng không transform', async page => {
  await openPlayer(page, 'u1-l01/2');
  const result = await page.evaluate(() => {
    const host = document.createElement('div');
    host.style.width = '830px';
    document.body.append(host);
    const widget = window.TypingEaseKeyboard.create({ host, hands: true, animatedHands: false });
    widget.highlight('e');
    const lm = host.querySelector('.finger[data-finger="LM"]');
    const out = {
      hostClass: host.className, active: lm.classList.contains('active-finger'), transform: lm.style.transform || '',
      computed: getComputedStyle(lm).transform, hand: host.querySelector('.ghost-hand.left-hand').style.transform || '',
      activeKey: host.querySelector('.key.active-key')?.dataset.pkey
    };
    // layout() vẽ lại SVG nên phải truy vấn lại ngón sau mỗi lần gọi.
    const finger = () => host.querySelector('.finger[data-finger="LM"]');
    widget.layout({ animatedHands: true });
    widget.highlight('e');
    out.afterOn = finger().style.transform || '';
    widget.layout({ animatedHands: false });
    out.afterOffClass = host.className;
    out.afterOff = finger().style.transform || '';
    widget.destroy();
    host.remove();
    return out;
  });
  assert.ok(/hands-static/.test(result.hostClass), result.hostClass);
  assert.ok(result.active, 'LM active');
  assert.strictEqual(result.activeKey, 'e');
  assert.strictEqual(result.transform, '', 'không style.transform');
  assert.strictEqual(result.hand, '');
  assert.ok(result.computed === 'none' || result.computed === '', `computed transform: ${result.computed}`);
  assert.notStrictEqual(result.afterOn, '', 'bật animatedHands lại thì có pose');
  assert.ok(/hands-static/.test(result.afterOffClass));
  assert.strictEqual(result.afterOff, '', 'tắt lại thì pose bị xoá');
});

test('16 resize 1440→1024→1440 giữ pose, không lỗi JS', async page => {
  await openPlayer(page, 'u2-l09/2');   // RP đang với tới Shift phải
  await sleep(SETTLE_MS);
  const first = await poseState(page);
  assert.notStrictEqual(first.fingers.RP.transform, '');
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await sleep(300 + SETTLE_MS);   // debounce 120ms + transition
    const pose = await poseState(page);
    assert.ok(pose.fingers.RP.active && pose.fingers.RP.full, `${width}: RP vẫn active glow-full`);
    assert.notStrictEqual(pose.fingers.RP.transform, '', `${width}: pose được áp lại`);
    assertNailOn(pose.fingers.RP.nail, pose.keys.shiftRight, `${width}: RP trên Shift phải`);
    assert.strictEqual(Object.keys(pose.fingers).length, 10, `${width}: vẫn 10 ngón`);
    assert.strictEqual(await boardState(page).then(board => board.activeKey), 'a');
  }
});

for (const route of ['/tien-do/', '/luyen-tu-do/', '/bai-hoc/', '/kiem-tra-toc-do-go/', '/luyen-phim-yeu/']) {
  test(`10 ${route} load không lỗi JS`, async page => {
    const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    assert.ok(response.ok(), `HTTP ${response.status()}`);
    await sleep(300);
    const title = await page.title();
    assert.ok(title && !/404/.test(title), `title: ${title}`);
  });
}

// Bản tiếng Anh/Nhật đã bỏ, nhưng 9 URL cũ còn nằm trong kết quả tìm kiếm nên mỗi cái phải đưa
// người dùng sang trang tiếng Việt tương ứng chứ không rơi vào 404.
const REDIRECTS = {
  '/en/': '/',
  '/ja/': '/',
  '/en/typing-test/': '/kiem-tra-toc-do-go/',
  '/ja/typing-test/': '/kiem-tra-toc-do-go/',
  '/en/what-is-wpm/': '/wpm-la-gi/',
  '/ja/what-is-wpm/': '/wpm-la-gi/',
  '/ja/touch-typing/': '/cach-go-10-ngon/',
  '/en/how-to-type-faster/': '/cach-tang-wpm/',
  '/en/average-typing-speed/': '/wpm-bao-nhieu-la-nhanh/'
};
test('11b URL en/ja cũ chuyển hướng về bản tiếng Việt', async page => {
  for (const [from, to] of Object.entries(REDIRECTS)) {
    const response = await page.goto(`${BASE}${from}`, { waitUntil: 'networkidle' });
    assert.ok(response.ok(), `${from}: HTTP ${response.status()}`);
    await page.waitForURL(url => new URL(url).pathname === to, { timeout: 4000 })
      .catch(() => { throw new Error(`${from} → ${new URL(page.url()).pathname}, cần ${to}`); });
    const title = await page.title();
    assert.ok(title && !/404/.test(title), `${to}: title ${title}`);
    assert.strictEqual(await page.evaluate(() => document.documentElement.lang), 'vi', `${to}: lang=vi`);
  }
});

// Huy hiệu: gieo sẵn tiến độ vào localStorage rồi nạp lại trang — huy hiệu phải khớp đúng số liệu
// mà chính trang đó đang hiện, và huy hiệu chưa đạt phải nói rõ còn thiếu bao nhiêu.
const BADGE_SEED = () => {
  const lessons = {};
  ['u1-l01', 'u1-l02', 'u1-l03', 'u1-l04', 'u1-l05', 'u1-l06', 'u1-l07', 'u1-l08', 'u1-l09', 'u1-l10']
    .forEach(id => { lessons[id] = { screens: { 0: { stars: 3, maxStars: 3 }, 1: { stars: 3, maxStars: 3 } }, stars: 6, maxStars: 6, bestWpm: 44, bestAccuracy: 96, seconds: 200, attempts: 1, completedAt: Date.now() }; });
  localStorage.setItem('typingease-progress-v3', JSON.stringify({ version: 3, current: null, lessons, unlocked: ['u1', 'u2'], legacyCompleted: 0, migratedAt: Date.now() }));
  localStorage.setItem('typingease-daily-goal-v1', JSON.stringify({ goalMinutes: 10, days: {}, currentStreak: 4, bestStreak: 4, lastCompletedDate: '' }));
  localStorage.setItem('typingease-profile-v1', JSON.stringify({
    attempts: [{ at: Date.now(), kind: 'lesson', lesson: 1, wpm: 44, accuracy: 96, seconds: 60 }],
    keys: { a: { hits: 3000, misses: 60, ms: 0, samples: 0 } }
  }));
};

test('17 huy hiệu: rỗng thì 0/10, có tiến độ thì mở đúng 5 cái', async page => {
  await page.goto(`${BASE}/tien-do/`, { waitUntil: 'networkidle' });
  const empty = await page.evaluate(() => ({
    count: document.querySelector('#badges-count').textContent.trim(),
    cards: document.querySelectorAll('.badge').length,
    earned: document.querySelectorAll('.badge.is-earned').length,
    store: localStorage.getItem('typingease-badges-v1')
  }));
  assert.strictEqual(empty.cards, 10, 'số huy hiệu');
  assert.strictEqual(empty.earned, 0, 'chưa gõ gì thì chưa mở cái nào');
  assert.strictEqual(empty.count, '0 / 10');
  assert.strictEqual(empty.store, null, 'không đạt thì không ghi mốc nào vào localStorage');

  await page.evaluate(BADGE_SEED);
  await page.reload({ waitUntil: 'networkidle' });
  const full = await page.evaluate(() => ({
    count: document.querySelector('#badges-count').textContent.trim(),
    earned: [...document.querySelectorAll('.badge.is-earned')].map(el => el.dataset.badge),
    locked: [...document.querySelectorAll('.badge:not(.is-earned)')].map(el => ({
      id: el.dataset.badge, meta: el.querySelector('.badge-meta').textContent.trim(),
      track: Boolean(el.querySelector('.badge-track'))
    })),
    store: Object.keys(JSON.parse(localStorage.getItem('typingease-badges-v1') || '{}'))
  }));
  assert.deepStrictEqual(full.earned, ['first-step', 'unit-1', 'stars-30', 'streak-3', 'clean-40'], 'huy hiệu mở');
  assert.strictEqual(full.count, '5 / 10');
  assert.deepStrictEqual(full.store.sort(), [...full.earned].sort(), 'mốc mở khoá ghi đúng những cái đã đạt');
  assert.ok(full.locked.every(item => item.track), 'huy hiệu chưa đạt có thanh tiến trình');
  const stars90 = full.locked.find(item => item.id === 'stars-90');
  assert.strictEqual(stars90.meta, '60 / 90', 'chưa đạt thì hiện số hiện tại / mốc');

  // Xoá lịch sử là huy hiệu mất theo, không còn cái nào "mồ côi".
  page.once('dialog', dialog => dialog.accept());
  await page.click('#clear-results');
  await sleep(120);
  const cleared = await page.evaluate(() => ({
    earned: document.querySelectorAll('.badge.is-earned').length,
    store: JSON.parse(localStorage.getItem('typingease-badges-v1') || '{}')
  }));
  assert.strictEqual(cleared.earned, 0, 'xoá lịch sử → không còn huy hiệu nào');
  assert.deepStrictEqual(cleared.store, {}, 'mốc mở khoá cũng bị dọn');
});

test('18 công tắc: âm click tắt sẵn, bàn tay bật sẵn, Alt+S/Alt+H đổi và nhớ', async page => {
  await openPlayer(page, 'u1-l01/2');
  const toggles = () => page.evaluate(() => ({
    sound: document.querySelector('#pt-sound').getAttribute('aria-pressed'),
    hands: document.querySelector('#pt-hands').getAttribute('aria-pressed'),
    stored: [localStorage.getItem('typingease-sound-v1'), localStorage.getItem('typingease-hands-v1')],
    static: document.querySelector('#board').classList.contains('hands-static')
  }));
  const start = await toggles();
  assert.strictEqual(start.sound, 'false', 'âm click PHẢI tắt mặc định');
  assert.strictEqual(start.hands, 'true', 'bàn tay động bật mặc định');
  assert.deepStrictEqual(start.stored, [null, null], 'chưa động vào thì không ghi gì');

  await page.click('#pt-sound');
  await page.click('#pt-hands');
  const clicked = await toggles();
  assert.deepStrictEqual([clicked.sound, clicked.hands], ['true', 'false'], 'bấm nút đổi trạng thái');
  assert.deepStrictEqual(clicked.stored, ['on', 'off'], 'ghi vào localStorage');
  assert.strictEqual(clicked.static, true, 'tắt tay động → board có .hands-static');

  await page.keyboard.press('Alt+s');
  await page.keyboard.press('Alt+h');
  const afterAlt = await toggles();
  assert.deepStrictEqual([afterAlt.sound, afterAlt.hands], ['false', 'true'], 'Alt+S / Alt+H đảo lại');
  assert.strictEqual(afterAlt.static, false);

  // Với âm BẬT, vòng gõ phải sống sót: cạm bẫy 8 (hiệu ứng phụ ném lỗi làm player chết sau 1 phím).
  await page.keyboard.press('Alt+s');
  await page.click('.player-stage');
  const target = await page.evaluate(() => window.TypingEasePlayer.getRun().target);
  await page.keyboard.type(target.slice(0, 6), { delay: 30 });
  const run = await page.evaluate(() => window.TypingEasePlayer.getRun());
  assert.strictEqual(run.typed, 6, 'gõ 6 phím với âm bật vẫn đếm đủ 6');
  assert.strictEqual(run.errors, 0, 'và không sinh lỗi');

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.TypingEasePlayer && window.TypingEasePlayer.getState().state !== 'loading');
  const reloaded = await toggles();
  assert.deepStrictEqual([reloaded.sound, reloaded.hands], ['true', 'true'], 'công tắc nhớ qua lần nạp sau');
});

// Service worker: ở đây chỉ kiểm được phần ĐO ĐƯỢC — đăng ký, kiểm soát trang, và cache đúng
// những thứ người dùng vừa đi qua. Phần "mất mạng thì sao" nằm ở scripts/offline-check.js, vì
// `context.setOffline(true)` và `context.route(... abort)` đều KHÔNG với tới fetch của service
// worker (đo 18/09/2026): trang vẫn tải sống nhăn và bài kiểm xanh một cách vô nghĩa.
test('19 service worker: kiểm soát trang và cache đúng lối đi của người dùng', async page => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await openPlayer(page, 'u1-l01/2');
  await sleep(700);   // chờ stale-while-revalidate ghi xong
  assert.ok(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), 'service worker phải kiểm soát trang');

  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls = [];
    for (const name of names) urls.push(...(await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname));
    return { names, urls };
  });
  assert.ok(cached.names.some(name => name.startsWith('typingease-shell-')), `tên cache: ${cached.names.join(', ')}`);
  for (const must of ['/', '/hoc/', '/data/lessons/vi/u1-l01.json', '/player.js', '/base.css'])
    assert.ok(cached.urls.includes(must), `thiếu ${must} trong cache: ${cached.urls.join(' ')}`);
  // Bài KẾ TIẾP cũng được player prefetch — mở bài 2 khi mất mạng vẫn chạy.
  assert.ok(cached.urls.includes('/data/lessons/vi/u1-l02.json'), 'bài kế tiếp chưa được cache');
  // Trang chưa ai mở thì không được tự chui vào cache: cache đi theo lối đi thật, không đoán trước.
  assert.ok(!cached.urls.includes('/luyen-phim-yeu/'), 'trang chưa mở mà đã nằm trong cache');

  const html = await page.evaluate(async () => (await (await caches.match('/hoc/')).text()));
  assert.ok(/id="player"/.test(html) && /player\.js/.test(html), 'bản cache của /hoc/ phải là trang thật');
});

// --- runner ------------------------------------------------------------------------------------
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const started = Date.now();
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const results = [];
  for (const { name, fn, options } of tests) {
    if (ONLY && !name.includes(ONLY)) continue;
    const context = await browser.newContext({ viewport: DESKTOP, ...options });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const text = message.text();
      // Font/CDN ngoài không tải được khi offline không phải lỗi của trang.
      if (/fonts\.g(oogleapis|static)\.com|net::ERR_(INTERNET_DISCONNECTED|NAME_NOT_RESOLVED)/.test(text)) return;
      errors.push(`console.error: ${text.slice(0, 200)}`);
    });
    const t0 = Date.now();
    let failure = null;
    try {
      await fn(page, context);
      if (errors.length) throw new Error(`lỗi JS của trang:\n    ${errors.join('\n    ')}`);
    } catch (error) {
      failure = error;
      // Một assertion hỏng thường là hậu quả của lỗi JS xảy ra trước đó: in kèm để khỏi phải đoán.
      if (errors.length && !/lỗi JS của trang/.test(error.message))
        failure.message += `\n  (lỗi JS của trang cùng lúc: ${errors.join(' | ')})`;
      const file = path.join(OUT, `fail-${name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}.png`);
      try { await page.screenshot({ path: file, fullPage: true }); failure.screenshot = file; } catch { /* trang đã đóng */ }
    }
    await context.close();
    const ms = Date.now() - t0;
    results.push({ name, ok: !failure, ms, failure });
    if (failure) {
      console.log(`FAIL ${name} (${ms}ms)\n    ${String(failure.message || failure).split('\n').join('\n    ')}`
        + (failure.screenshot ? `\n    screenshot: ${failure.screenshot}` : ''));
    } else console.log(`PASS ${name} (${ms}ms)`);
  }
  await browser.close();
  const failed = results.filter(result => !result.ok).length;
  console.log(`\n${results.length - failed}/${results.length} PASS · ${((Date.now() - started) / 1000).toFixed(1)}s`);
  process.exit(failed ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
