#!/usr/bin/env node
/*
 * scripts/validate-lessons.js — kiểm tra nội dung giáo trình (PLAN.md C4/C5).
 * Chạy: node scripts/validate-lessons.js [--lang vi] [--quiet]
 * Không cần cài gói. Exit code 1 nếu có lỗi.
 *
 * Kiểm:
 *   1. curriculum.<lang>.js nạp được, sequence khớp cây units -> groups -> lessons.
 *   2. Mỗi bài `ready: true` có file JSON, parse được, đủ field bắt buộc của schema C4.
 *   3. screen.type nằm trong 5 loại được chọn (intro | block | standard | burst | test)
 *      và đủ field riêng của từng loại.
 *   4. keysSoFar của bài = hợp của newKeys mọi bài tính tới bài đó theo `sequence`.
 *   5. MỌI ký tự trong content/tokens của một screen phải nằm trong tập phím đã dạy
 *      TỚI THỜI ĐIỂM SCREEN ĐÓ (phím của các bài trước + phím do các screen trước
 *      trong cùng bài giới thiệu), cộng dấu cách và ký tự xuống dòng.
 *   6. Số screen trong file khớp `curriculum.lessons[id].screens`.
 *   7. Không có content rỗng; newKey của screen `block` phải xuất hiện trong content của nó;
 *      mọi phím trong lesson.newKeys phải được một screen `block` giới thiệu.
 *   8. Nhặt rác định dạng: dòng có khoảng trắng đầu/cuối, hai dấu cách liền, tab, \r.
 *   9. Chữ HOA chỉ hợp lệ sau khi bài dạy phím `shift`; screen có linebreak:"enter" chỉ hợp lệ
 *      sau khi bài dạy phím `enter` (DECISIONS.md quyết định bổ sung 6).
 *  10. Ký hiệu cần Shift (! @ # : ? _ ...) hợp lệ khi đã dạy `shift` và phím vật lý tương ứng;
 *      screen dạy chúng nên ghi `shifted: true`. Một screen `block` có thể giới thiệu NHIỀU phím
 *      cùng lúc bằng `newKeys: [...]` (dùng cho hàng số).
 *  11. Bài `inputMode: "telex"`: mỗi ký tự có dấu phải có phím chữ gốc đã dạy, token tạo dấu
 *      (aa ee oo dd aw uw ow) và phím dấu thanh (s f r x j) do chính các bài telex TRƯỚC dạy —
 *      học chữ cái s ở Unit 1 không có nghĩa là đã học dấu sắc.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
require(path.join(ROOT, 'telex-match.js'));
const TELEX = globalThis.TypingEaseTelex;
const SCREEN_TYPES = ['intro', 'block', 'standard', 'burst', 'test'];
const DICTATIONS = ['letters', 'words', 'sentence'];
const FINGERS = ['LP', 'LR', 'LM', 'LI', 'LT', 'RT', 'RI', 'RM', 'RR', 'RP'];
const INPUT_MODES = ['ascii', 'telex'];
const LINEBREAKS = ['space', 'enter'];
/* Bàn phím US: ký hiệu -> phím vật lý phải giữ Shift để gõ ra nó (DECISIONS.md bổ sung 9). */
const SHIFT_MAP = {
  '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
  '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/', '~': '`'
};
const LESSON_KINDS = ['keys', 'review', 'weak', 'test'];
const NAMED_KEYS = ['shift', 'enter', 'tab', 'backspace'];
const REQUIRED_LESSON_FIELDS = [
  'id', 'unit', 'group', 'order', 'slug', 'title', 'summary',
  'newKeys', 'keysSoFar', 'minAccuracy', 'estMinutes', 'inputMode',
  'intro', 'congrats', 'screens'
];

const args = process.argv.slice(2);
const lang = (() => {
  const i = args.indexOf('--lang');
  return i >= 0 && args[i + 1] ? args[i + 1] : 'vi';
})();
const quiet = args.includes('--quiet');

const errors = [];
const warnings = [];
const rows = [];
let where = '';

const fail = message => errors.push(`${where}${message}`);
const warn = message => warnings.push(`${where}${message}`);
const show = key => JSON.stringify(key === ' ' ? '␣' : key);
const isPlainObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const isKeyToken = value => typeof value === 'string' && (value.length === 1 || NAMED_KEYS.includes(value) || /^[a-z]{2}$/.test(value));
/* Một screen "dùng" phím nào: ký tự thường phải có mặt trong content; `shift` coi như được dùng
   khi content có chữ hoa; `enter` khi screen khai báo linebreak:"enter" (xuống dòng bằng Enter thật). */
function telexTokens(character) {
  if (!TELEX) return null;
  const { base, shape, tone } = TELEX.parts(character);
  if (!base) return null;
  const lower = base.toLowerCase();
  let shapeToken = '';
  if (shape === 'stroke') shapeToken = 'dd';
  else if (shape === TELEX.CIRCUMFLEX) shapeToken = lower + lower;
  else if (shape) shapeToken = lower + 'w';
  return { base: lower, upper: base !== lower, shape: shapeToken, tone: TELEX.TONE_KEYS[tone] || '' };
}

function usesKey(screen, key, telexMode) {
  const content = typeof screen.content === 'string' ? screen.content : '';
  if (key === 'shift') return /\p{Lu}/u.test(content);
  if (key === 'enter') return screen.linebreak === 'enter' && content.includes('\n');
  if (telexMode && [...content].some(character => {
    const need = telexTokens(character);
    return !!need && (need.shape === key || need.tone === key);
  })) return true;
  return content.includes(key);
}

/* ---------- 1. curriculum ---------- */

function loadCurriculum() {
  const file = path.join(ROOT, 'data', `curriculum.${lang}.js`);
  if (!fs.existsSync(file)) {
    fail(`thiếu file chỉ mục ${path.relative(ROOT, file)}`);
    return null;
  }
  const source = fs.readFileSync(file, 'utf8');
  const sandbox = {};
  try {
    new Function('window', source)(sandbox);
  } catch (error) {
    fail(`không nạp được ${path.relative(ROOT, file)}: ${error.message}`);
    return null;
  }
  const curriculum = sandbox.TypingEaseCurriculum;
  if (!isPlainObject(curriculum)) {
    fail(`${path.relative(ROOT, file)} không gán window.TypingEaseCurriculum thành object`);
    return null;
  }
  return curriculum;
}

function checkCurriculumShape(curriculum) {
  where = 'curriculum: ';
  if (curriculum.lang !== lang) fail(`lang = ${show(curriculum.lang)}, đợi ${show(lang)}`);
  if (!Array.isArray(curriculum.units) || !curriculum.units.length) fail('units phải là mảng không rỗng');
  if (!isPlainObject(curriculum.lessons)) fail('lessons phải là object');
  if (!Array.isArray(curriculum.sequence) || !curriculum.sequence.length) fail('sequence phải là mảng không rỗng');
  if (errors.length) return [];

  const flat = [];
  const unitOf = new Map();
  const groupsOf = new Map();
  for (const unit of curriculum.units) {
    if (!unit || typeof unit.id !== 'string') { fail('mỗi unit phải có id dạng string'); continue; }
    if (typeof unit.title !== 'string' || !unit.title.trim()) fail(`unit ${unit.id} thiếu title`);
    if (!Array.isArray(unit.groups) || !unit.groups.length) { fail(`unit ${unit.id} thiếu groups`); continue; }
    groupsOf.set(unit.id, unit.groups.map(group => group && group.id));
    for (const group of unit.groups) {
      if (!group || typeof group.id !== 'string') { fail(`unit ${unit.id} có group thiếu id`); continue; }
      if (!Array.isArray(group.lessons) || !group.lessons.length) { fail(`group ${unit.id}/${group.id} thiếu lessons`); continue; }
      for (const id of group.lessons) {
        flat.push(id);
        unitOf.set(id, { unit: unit.id, group: group.id });
      }
    }
  }

  if (flat.join(',') !== curriculum.sequence.join(',')) {
    fail('sequence KHÔNG khớp thứ tự phẳng units -> groups -> lessons');
    fail(`  cây:      ${flat.join(' ')}`);
    fail(`  sequence: ${curriculum.sequence.join(' ')}`);
  }

  const seen = new Set();
  for (const id of curriculum.sequence) {
    if (seen.has(id)) fail(`id trùng trong sequence: ${id}`);
    seen.add(id);
    const entry = curriculum.lessons[id];
    if (!isPlainObject(entry)) { fail(`lessons[${id}] không tồn tại trong chỉ mục`); continue; }
    where = `curriculum ${id}: `;
    if (typeof entry.title !== 'string' || !entry.title.trim()) fail('thiếu title');
    if (!Array.isArray(entry.newKeys)) fail('newKeys phải là mảng');
    else entry.newKeys.filter(key => !isKeyToken(key)).forEach(key => fail(`newKeys có phần tử không hợp lệ ${show(key)}`));
    if (!Number.isInteger(entry.screens) || entry.screens < 1) fail('screens phải là số nguyên >= 1');
    if (!Number.isFinite(entry.estMinutes) || entry.estMinutes <= 0) fail('estMinutes phải là số > 0');
    if (!LESSON_KINDS.includes(entry.kind)) fail(`kind = ${show(entry.kind)}, phải thuộc ${LESSON_KINDS.join(' | ')}`);
    if (entry.inputMode !== undefined && !INPUT_MODES.includes(entry.inputMode)) fail(`inputMode = ${show(entry.inputMode)} không hợp lệ`);
    where = 'curriculum: ';
  }
  for (const id of Object.keys(curriculum.lessons)) {
    if (!seen.has(id)) fail(`lessons[${id}] không có trong sequence (bài mồ côi)`);
  }

  where = 'curriculum starter: ';
  const starter = curriculum.starter;
  if (!isPlainObject(starter)) fail('thiếu starter (dòng gõ thử của trang chủ)');
  else {
    if (!curriculum.lessons[starter.lessonId]) fail(`lessonId ${show(starter.lessonId)} không có trong chỉ mục`);
    if (!Number.isInteger(starter.screen) || starter.screen < 1) fail('screen phải là số nguyên >= 1 (đánh số từ 1)');
    if (typeof starter.content !== 'string' || !starter.content.trim()) fail('content rỗng');
  }
  where = '';
  return { order: curriculum.sequence.slice(), unitOf, groupsOf };
}

/* ---------- 2..8. từng bài ---------- */

function collectTypedText(screen) {
  const parts = [];
  if (typeof screen.content === 'string') parts.push({ field: 'content', value: screen.content });
  if (Array.isArray(screen.tokens)) screen.tokens.forEach((token, i) => {
    if (typeof token === 'string') parts.push({ field: `tokens[${i}]`, value: token });
  });
  return parts;
}

function checkFormatting(label, value) {
  if (value.includes('\r')) fail(`${label}: có ký tự \\r`);
  if (value.includes('\t')) fail(`${label}: có ký tự tab`);
  if (value.includes('  ')) fail(`${label}: có hai dấu cách liền nhau`);
  value.split('\n').forEach((line, i) => {
    if (line !== line.trim()) fail(`${label}: dòng ${i + 1} có khoảng trắng ở đầu hoặc cuối (${JSON.stringify(line)})`);
    if (!line.trim()) fail(`${label}: dòng ${i + 1} rỗng`);
  });
}

function checkScreen(screen, index, allowed, lessonNewKeys, context) {
  const telexMode = !!context && context.telexMode;
  const allowedTelex = (context && context.allowedTelex) || new Set();
  const label = `screen ${index + 1} (${screen && screen.type})`;
  if (!isPlainObject(screen)) { fail(`screen ${index + 1} không phải object`); return; }
  if (!SCREEN_TYPES.includes(screen.type)) {
    fail(`${label}: type không hợp lệ, phải thuộc ${SCREEN_TYPES.join(' | ')}`);
    return;
  }

  /* phím do chính screen này giới thiệu được phép xuất hiện ngay trong screen này */
  const introduced = [];
  if (screen.type === 'intro' && typeof screen.key === 'string') introduced.push(screen.key);
  if (typeof screen.newKey === 'string') introduced.push(screen.newKey);
  if (Array.isArray(screen.newKeys)) screen.newKeys.filter(key => typeof key === 'string').forEach(key => introduced.push(key));
  /* Phím có tên (shift, enter) cũng vào `allowed`: chúng không phải ký tự, mà là điều kiện để
     chữ hoa và xuống dòng bằng Enter được coi là hợp lệ. */
  introduced.forEach(key => { allowed.add(key); allowedTelex.add(key); });

  switch (screen.type) {
    case 'intro':
      if (typeof screen.key !== 'string' || !screen.key.length) fail(`${label}: thiếu key`);
      if (!FINGERS.includes(screen.finger)) fail(`${label}: finger = ${show(screen.finger)}, phải thuộc ${FINGERS.join(' ')}`);
      if (typeof screen.text !== 'string' || screen.text.trim().length < 20) fail(`${label}: text phải là câu hướng dẫn (>= 20 ký tự)`);
      if (screen.content !== undefined) fail(`${label}: screen intro không nên có content`);
      break;
    case 'block':
      if (typeof screen.content !== 'string' || !screen.content.trim()) fail(`${label}: content rỗng`);
      if (screen.newKeys !== undefined) {
        if (!Array.isArray(screen.newKeys) || !screen.newKeys.length) fail(`${label}: newKeys phải là mảng không rỗng`);
        else screen.newKeys.forEach(key => {
          if (!isKeyToken(key)) fail(`${label}: newKeys có phần tử không hợp lệ ${show(key)}`);
          else if (!usesKey(screen, key, telexMode)) fail(`${label}: newKeys ${show(key)} không được dùng trong content`);
        });
      }
      if (screen.newKey !== undefined) {
        if (typeof screen.newKey !== 'string' || !screen.newKey.length) fail(`${label}: newKey không hợp lệ`);
        else if (!usesKey(screen, screen.newKey, telexMode)) fail(`${label}: newKey ${show(screen.newKey)} không được dùng trong content`);
      }
      break;
    case 'standard':
      if (typeof screen.content !== 'string' || !screen.content.trim()) fail(`${label}: content rỗng`);
      if (!DICTATIONS.includes(screen.dictation)) fail(`${label}: dictation = ${show(screen.dictation)}, phải thuộc ${DICTATIONS.join(' | ')}`);
      break;
    case 'burst':
      if (!Number.isFinite(screen.seconds) || screen.seconds < 10 || screen.seconds > 60) fail(`${label}: seconds phải là số 10..60`);
      if (!Array.isArray(screen.tokens) || screen.tokens.length < 4) fail(`${label}: tokens phải là mảng >= 4 phần tử`);
      else screen.tokens.forEach((token, i) => {
        if (typeof token !== 'string' || !token.length) fail(`${label}: tokens[${i}] rỗng`);
        else if (/\s/.test(token)) fail(`${label}: tokens[${i}] = ${show(token)} chứa khoảng trắng (burst hiện từng cụm liền)`);
      });
      if (screen.content !== undefined) fail(`${label}: burst dùng tokens, không dùng content`);
      break;
    case 'test':
      if (!Number.isFinite(screen.seconds) || screen.seconds < 15) fail(`${label}: seconds phải là số >= 15`);
      if (screen.source !== undefined) {
        if (screen.source !== 'weak-keys') fail(`${label}: source = ${show(screen.source)}, chỉ hỗ trợ "weak-keys"`);
        if (screen.content !== undefined) fail(`${label}: screen sinh runtime không được hardcode content`);
        if (screen.minKeys !== undefined && (!Number.isInteger(screen.minKeys) || screen.minKeys < 1)) fail(`${label}: minKeys phải là số nguyên >= 1`);
      } else if (typeof screen.content !== 'string' || !screen.content.trim()) {
        fail(`${label}: cần content hoặc source: "weak-keys"`);
      }
      break;
  }

  if (screen.shifted !== undefined && typeof screen.shifted !== 'boolean') fail(`${label}: shifted phải là true/false`);

  if (screen.linebreak !== undefined) {
    if (!LINEBREAKS.includes(screen.linebreak)) fail(`${label}: linebreak = ${show(screen.linebreak)}, phải thuộc ${LINEBREAKS.join(' | ')}`);
    else if (screen.linebreak === 'enter') {
      if (screen.type === 'burst') fail(`${label}: burst hiện từng cụm liền, không có xuống dòng`);
      if (!allowed.has('enter')) fail(`${label}: linebreak "enter" nhưng phím Enter chưa được dạy tới đây`);
      if (typeof screen.content !== 'string' || !screen.content.includes('\n')) fail(`${label}: linebreak "enter" nhưng content chỉ có một dòng`);
    }
  }

  if (screen.text !== undefined && (typeof screen.text !== 'string' || !screen.text.trim())) fail(`${label}: text rỗng`);
  if (screen.hint !== undefined && (typeof screen.hint !== 'string' || !screen.hint.trim())) fail(`${label}: hint rỗng`);

  /* RÀNG BUỘC LÕI: ký tự phải nằm trong tập phím đã dạy tới thời điểm này */
  for (const part of collectTypedText(screen)) {
    checkFormatting(`${label} ${part.field}`, part.value);
    const unknown = new Map();
    const unknownTelex = new Map();
    for (const character of part.value) {
      if (character === '\n' || character === ' ') continue;
      if (allowed.has(character)) continue;
      /* Chữ HOA hợp lệ khi bài đã dạy cả Shift lẫn phím chữ thường tương ứng. */
      const lower = character.toLowerCase();
      if (lower !== character && allowed.has('shift') && allowed.has(lower)) continue;
      /* Ký hiệu ở tầng Shift: hợp lệ khi đã dạy Shift và phím vật lý nằm dưới nó. */
      const physical = SHIFT_MAP[character];
      if (physical && allowed.has('shift') && allowed.has(physical)) continue;
      const need = telexMode ? telexTokens(character) : null;
      if (need) {
        const missing = [];
        if (!allowed.has(need.base)) missing.push(`phím ${need.base}`);
        if (need.upper && !allowed.has('shift')) missing.push('shift');
        if (need.shape && !allowedTelex.has(need.shape)) missing.push(`telex ${need.shape}`);
        if (need.tone && !allowedTelex.has(need.tone)) missing.push(`dấu ${need.tone}`);
        if (!missing.length) continue;
        unknownTelex.set(character, missing.join(' + '));
        continue;
      }
      unknown.set(character, (unknown.get(character) || 0) + 1);
    }
    if (unknown.size) {
      const listing = [...unknown.entries()].map(([character, count]) => `${show(character)} x${count}`).join(', ');
      fail(`${label} ${part.field}: dùng phím CHƯA DẠY: ${listing}`);
      fail(`    phím được phép tới đây: ${[...allowed].map(k => (k === ' ' ? '␣' : k)).sort().join(' ')}`);
    }
    if (unknownTelex.size) {
      const listing = [...unknownTelex.entries()].map(([character, missing]) => `${show(character)} (thiếu ${missing})`).join(', ');
      fail(`${label} ${part.field}: ký tự có dấu CHƯA ĐỦ ĐIỀU KIỆN: ${listing}`);
      fail(`    telex đã dạy tới đây: ${[...allowedTelex].sort().join(' ') || '(chưa có)'}`);
    }
  }

  introduced.forEach(key => lessonNewKeys.introducedBy.set(key, screen.type));
}

function checkLesson(id, entry, taught, place, telexTaught) {
  const relative = path.join('data', 'lessons', lang, `${id}.json`);
  const file = path.join(ROOT, relative);
  where = `${id}: `;
  if (!fs.existsSync(file)) { fail(`thiếu file ${relative} (chỉ mục ghi ready: true)`); return; }

  let lesson;
  try {
    lesson = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`JSON không parse được: ${error.message}`);
    /* Vẫn cộng phím theo chỉ mục để các bài sau không báo lỗi dây chuyền vô nghĩa. */
    (entry.newKeys || []).filter(key => typeof key === 'string' && key.length === 1).forEach(key => taught.add(key));
    return;
  }

  for (const field of REQUIRED_LESSON_FIELDS) {
    if (lesson[field] === undefined) fail(`thiếu field bắt buộc "${field}"`);
  }
  if (lesson.id !== id) fail(`field id = ${show(lesson.id)} nhưng tên file là ${id}.json`);
  if (place && lesson.unit !== place.unit) fail(`unit = ${show(lesson.unit)}, chỉ mục xếp bài này vào ${show(place.unit)}`);
  if (place && lesson.group !== place.group) fail(`group = ${show(lesson.group)}, chỉ mục xếp bài này vào group ${show(place.group)}`);
  if (typeof lesson.slug !== 'string' || !/^[a-z0-9-]+$/.test(lesson.slug || '')) fail(`slug ${show(lesson.slug)} phải là chữ thường, số và dấu gạch ngang`);
  if (lesson.title !== entry.title) fail(`title ${show(lesson.title)} khác chỉ mục ${show(entry.title)}`);
  if (!Number.isInteger(lesson.order) || lesson.order < 1) fail('order phải là số nguyên >= 1');
  if (typeof lesson.summary !== 'string' || lesson.summary.trim().length < 10) fail('summary quá ngắn');
  if (typeof lesson.intro !== 'string' || lesson.intro.trim().length < 30) fail('intro của bài phải là 1-3 câu (>= 30 ký tự)');
  if (typeof lesson.congrats !== 'string' || lesson.congrats.trim().length < 30) fail('congrats phải là 1-2 câu có mẹo kỹ thuật (>= 30 ký tự)');
  if (!Number.isFinite(lesson.minAccuracy) || lesson.minAccuracy < 50 || lesson.minAccuracy > 100) fail('minAccuracy phải là số 50..100');
  if (!Number.isFinite(lesson.estMinutes) || lesson.estMinutes <= 0) fail('estMinutes phải là số > 0');
  if (!INPUT_MODES.includes(lesson.inputMode)) fail(`inputMode = ${show(lesson.inputMode)}, phải thuộc ${INPUT_MODES.join(' | ')}`);
  if (lesson.estMinutes !== entry.estMinutes) warn(`estMinutes = ${lesson.estMinutes} khác chỉ mục (${entry.estMinutes})`);

  if (!Array.isArray(lesson.newKeys)) fail('newKeys phải là mảng');
  if (!Array.isArray(lesson.keysSoFar)) fail('keysSoFar phải là mảng');
  if (!Array.isArray(lesson.screens) || !lesson.screens.length) { fail('screens phải là mảng không rỗng'); return; }

  const newKeys = Array.isArray(lesson.newKeys) ? lesson.newKeys : [];
  newKeys.filter(key => !isKeyToken(key)).forEach(key => fail(`newKeys có phần tử không hợp lệ ${show(key)} (1 ký tự, hoặc ${NAMED_KEYS.join('/')}, hoặc cặp chữ Telex)`));
  if (newKeys.join(',') !== (entry.newKeys || []).join(',')) fail(`newKeys ${JSON.stringify(newKeys)} khác chỉ mục ${JSON.stringify(entry.newKeys)}`);

  /* 4. keysSoFar phải bằng tập luỹ tiến */
  newKeys.forEach(key => taught.add(key));
  const expected = [...taught].sort();
  const declared = [...new Set(Array.isArray(lesson.keysSoFar) ? lesson.keysSoFar : [])].sort();
  if (expected.join('|') !== declared.join('|')) {
    fail('keysSoFar KHÔNG bằng tập phím luỹ tiến theo sequence');
    fail(`  khai báo: ${declared.map(k => (k === ' ' ? '␣' : k)).join(' ')}`);
    fail(`  đợi:      ${expected.map(k => (k === ' ' ? '␣' : k)).join(' ')}`);
  }

  /* 6. số screen khớp chỉ mục */
  if (lesson.screens.length !== entry.screens) fail(`có ${lesson.screens.length} screen nhưng chỉ mục ghi ${entry.screens}`);

  /* 5. tập phím cho phép: các bài TRƯỚC + phím do các screen trước trong bài này giới thiệu.
     Bài telex có thêm một tập riêng: dấu thanh và token tạo dấu chỉ tính là "đã dạy" khi một bài
     telex trước đó dạy chúng — chứ không phải vì chữ cái s, f, w đã có từ Unit 1. */
  const telexMode = lesson.inputMode === 'telex';
  if (telexMode) newKeys.forEach(key => telexTaught.add(key));
  const allowed = new Set([...taught].filter(key => !newKeys.includes(key)));
  allowed.add(' ');
  const allowedTelex = new Set([...telexTaught].filter(key => !newKeys.includes(key)));
  const lessonNewKeys = { introducedBy: new Map() };
  lesson.screens.forEach((screen, index) => checkScreen(screen, index, allowed, lessonNewKeys, { telexMode, allowedTelex }));

  /* 7. mọi newKeys của bài phải được một screen block giới thiệu */
  for (const key of newKeys) {
    const by = lessonNewKeys.introducedBy.get(key);
    if (!by) fail(`newKey ${show(key)} không có screen nào giới thiệu (cần một screen block với newKey đó)`);
    else if (by !== 'block') fail(`newKey ${show(key)} chỉ được giới thiệu ở screen "${by}", cần thêm một screen block có newKey ${show(key)}`);
  }

  const chars = lesson.screens.reduce((total, screen) => total + collectTypedText(screen)
    .reduce((sum, part) => sum + part.value.replace(/\n/g, '').length, 0), 0);
  rows.push({
    id,
    title: lesson.title,
    newKeys: newKeys.length ? newKeys.map(k => (k === ' ' ? '␣' : k)).join(' ') : '—',
    screens: lesson.screens.length,
    chars,
    types: [...new Set(lesson.screens.map(screen => screen.type))].join(', ')
  });
  where = '';
}

/* ---------- chạy ---------- */

const curriculum = loadCurriculum();
let plan = null;
if (curriculum) plan = checkCurriculumShape(curriculum);

if (plan && plan.order) {
  const taught = new Set();
  const telexTaught = new Set();
  for (const id of plan.order) {
    const entry = curriculum.lessons[id];
    if (!isPlainObject(entry)) continue;
    if (entry.ready === false) {
      /* Bài chưa có nội dung: vẫn cộng phím vào tập luỹ tiến để bài sau tính đúng. */
      (entry.newKeys || []).filter(key => typeof key === 'string' && key.length === 1).forEach(key => taught.add(key));
      if (entry.inputMode === 'telex') (entry.newKeys || []).forEach(key => telexTaught.add(key));
      const orphan = path.join(ROOT, 'data', 'lessons', lang, `${id}.json`);
      if (fs.existsSync(orphan)) {
        where = `${id}: `;
        fail(`có file JSON nhưng chỉ mục ghi ready: false — sửa curriculum.${lang}.js thành ready: true`);
        where = '';
      }
      continue;
    }
    checkLesson(id, entry, taught, plan.unitOf.get(id), telexTaught);
  }
}

/* starter phải trùng đúng content của screen nó trỏ tới (PLAN.md A3: screen đó được tính là đã xong) */
if (curriculum && isPlainObject(curriculum.starter)) {
  const starter = curriculum.starter;
  const file = path.join(ROOT, 'data', 'lessons', lang, `${starter.lessonId}.json`);
  if (fs.existsSync(file)) {
    where = 'curriculum starter: ';
    try {
      const screen = (JSON.parse(fs.readFileSync(file, 'utf8')).screens || [])[starter.screen - 1];
      if (!screen) fail(`bài ${starter.lessonId} không có screen thứ ${starter.screen}`);
      else if (screen.content !== starter.content) {
        fail(`content không trùng screen ${starter.screen} của ${starter.lessonId}`);
        fail(`  starter: ${JSON.stringify(starter.content)}`);
        fail(`  screen:  ${JSON.stringify(screen.content)}`);
      }
    } catch { /* lỗi parse đã báo ở trên */ }
    where = '';
  }
}

/* file lạc trong data/lessons/<lang>/ */
const lessonDir = path.join(ROOT, 'data', 'lessons', lang);
if (fs.existsSync(lessonDir)) {
  for (const name of fs.readdirSync(lessonDir)) {
    if (!name.endsWith('.json')) continue;
    const id = name.slice(0, -5);
    if (!curriculum || !curriculum.lessons || !curriculum.lessons[id]) fail(`file lạc data/lessons/${lang}/${name}: id không có trong chỉ mục`);
  }
}

/* ---------- báo cáo ---------- */

function table(list) {
  const head = ['Bài', 'Tên bài', 'Phím mới', 'Screen', 'Ký tự', 'screen_type dùng'];
  const body = list.map(row => [row.id, row.title, row.newKeys, String(row.screens), String(row.chars), row.types]);
  const widths = head.map((cell, i) => Math.max(cell.length, ...body.map(row => [...row[i]].length)));
  const line = cells => '  ' + cells.map((cell, i) => cell + ' '.repeat(widths[i] - [...cell].length)).join('  ');
  const out = [line(head), '  ' + widths.map(width => '-'.repeat(width)).join('  ')];
  body.forEach(row => out.push(line(row)));
  return out.join('\n');
}

if (!quiet && rows.length) {
  console.log(`\nGiáo trình ${lang} — ${rows.length} bài có nội dung\n`);
  console.log(table(rows));
  const totalScreens = rows.reduce((sum, row) => sum + row.screens, 0);
  const totalChars = rows.reduce((sum, row) => sum + row.chars, 0);
  console.log(`\n  Tổng: ${totalScreens} screen, ${totalChars} ký tự gõ.`);
}

if (warnings.length) {
  console.log(`\nCẢNH BÁO (${warnings.length}):`);
  warnings.forEach(message => console.log(`  ! ${message}`));
}

if (errors.length) {
  console.log(`\nLỖI (${errors.length}):`);
  errors.forEach(message => console.log(`  x ${message}`));
  console.log('\nKẾT QUẢ: FAIL\n');
  process.exit(1);
}

console.log('\nKẾT QUẢ: PASS — không có lỗi.\n');
