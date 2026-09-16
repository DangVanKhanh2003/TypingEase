#!/usr/bin/env node
/*
 * scripts/test-telex.js — prototype gate cho Telex (DECISIONS.md quyết định 1).
 * Chạy: node scripts/test-telex.js
 *
 * Không có IME thật trong node, nên bài test dựng lại ĐÚNG chuỗi giá trị mà ô nhập đi qua khi
 * một bộ gõ Telex (Unikey / EVKey / macOS / Gboard) đang bật, theo hai lối gõ dấu:
 *   - dấu ngay sau nguyên âm:  m -> ma -> má
 *   - dấu ở cuối âm tiết:      nguye -> nguyê -> nguyên -> nguyễn
 * Yêu cầu: trong suốt quá trình đó KHÔNG được có ký tự nào bị chấm là sai, và khi gõ xong thì
 * compare().complete phải đúng.
 */
'use strict';
require('../telex-match.js');
const TELEX = globalThis.TypingEaseTelex;

const WORDS = ['má', 'nguyễn', 'đường', 'tiếng Việt', 'cửa sổ', 'học sinh chăm chỉ'];
let failures = 0;
const check = (label, condition, detail = '') => {
  if (!condition) { failures += 1; console.log(`  x ${label}${detail ? ` — ${detail}` : ''}`); }
  else console.log(`  . ${label}`);
};

/* Giá trị ô nhập khi gõ dấu ngay sau nguyên âm. */
function valuesEarlyTone(target) {
  const values = [];
  let prefix = '';
  for (const character of target) {
    for (const step of TELEX.steps(character)) values.push(prefix + step);
    prefix += character;
  }
  return values;
}

/* Giá trị ô nhập khi gõ hết âm tiết rồi mới bỏ dấu. */
function valuesLateTone(target) {
  const values = [];
  const tokens = target.split(/(\s+)/);
  let done = '';
  for (const token of tokens) {
    if (!token.trim()) { done += token; values.push(done); continue; }
    const noTone = [...token].map(character => {
      const { base, shape } = TELEX.parts(character);
      if (shape === 'stroke') return character;
      return shape ? (base + shape).normalize('NFC') : base;
    });
    let built = '';
    for (const character of noTone) { built += character; values.push(done + built); }
    [...token].forEach((character, index) => {
      if (character === noTone[index]) return;
      built = built.slice(0, index) + character + built.slice(index + 1);
      values.push(done + built);
    });
    done += token;
  }
  return values;
}

console.log('\n1. Gõ qua bộ gõ Telex — không được có ký tự nào bị chấm SAI giữa chừng\n');
for (const word of WORDS) {
  for (const [style, values] of [['dấu sớm', valuesEarlyTone(word)], ['dấu cuối', valuesLateTone(word)]]) {
    const badStep = values.find(value => TELEX.compare(value, word).bad > 0);
    check(`${JSON.stringify(word)} (${style})`, !badStep, badStep ? `giá trị ${JSON.stringify(badStep)} bị chấm sai` : '');
  }
  check(`${JSON.stringify(word)} gõ xong -> complete`, TELEX.compare(word, word).complete);
}

console.log('\n2. Lỗi thật vẫn phải bị bắt\n');
check('"mà" khác "má"', TELEX.compare('mà', 'má').bad === 1);
check('"nguyễm" khác "nguyễn"', TELEX.compare('nguyễm', 'nguyễn').bad === 1);
check('thiếu dấu ở âm tiết ĐÃ xong là lỗi', TELEX.compare('ma ', 'má ').bad === 1);
check('thiếu dấu ở âm tiết ĐANG gõ thì chưa là lỗi', TELEX.compare('ma', 'má').pending === 1 && TELEX.compare('ma', 'má').bad === 0);
check('đếm lỗi theo âm tiết (cả hai âm tiết đã xong)', TELEX.compare('chao ban ', 'chào bạn ').badTokens === 2);
check('âm tiết cuối chưa xong thì chưa tính lỗi', TELEX.compare('chao ban', 'chào bạn').badTokens === 1);
check('một âm tiết sai nhiều ký tự vẫn là 1 lỗi', TELEX.compare('xxào bạn', 'chào bạn').badTokens === 1);

console.log('\n3. Chưa bật bộ gõ\n');
check('"mas" -> chưa bật bộ gõ', TELEX.looksUncomposed('mas', 'má'));
check('"nguyeenx" -> chưa bật bộ gõ', TELEX.looksUncomposed('nguyeenx', 'nguyễn'));
check('"dduwowngf" -> chưa bật bộ gõ', TELEX.looksUncomposed('dduwowngf', 'đường'));
check('gõ đúng thì KHÔNG báo nhầm', !TELEX.looksUncomposed('má', 'má'));
check('từ không dấu thì KHÔNG báo nhầm', !TELEX.looksUncomposed('ban', 'ban'));

console.log('\n4. Bản đồ phím vật lý (heatmap) và ascii-fallback\n');
check('ầ -> a a f', TELEX.keysFor('ầ').join('') === 'aaf');
check('đ -> d d', TELEX.keysFor('đ').join('') === 'dd');
check('ư -> u w', TELEX.keysFor('ư').join('') === 'uw');
check('ắ -> a w s', TELEX.keysFor('ắ').join('') === 'aws');
check('toAscii bỏ hết dấu', TELEX.toAscii('Học sinh chăm chỉ, đường xa') === 'Hoc sinh cham chi, duong xa');

console.log(`\nKẾT QUẢ: ${failures ? `FAIL (${failures} lỗi)` : 'PASS'}\n`);
process.exit(failures ? 1 : 0);
