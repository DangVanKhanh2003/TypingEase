/* =================================================================================================
   BẢNG CHUỖI CÒN LẠI CỦA TRANG CHỦ.
   Site chỉ còn MỘT ngôn ngữ: tiếng Việt. /en/ và /ja/ đã thành trang chuyển hướng, dropdown chọn
   ngôn ngữ đã gỡ — nên bảng dưới đây chỉ còn đúng khoá `vi`.
   Ngày 18/09/2026 dọn nốt di sản của engine 30 bài cũ (77 dòng): `lessons`, `lessonSecondLines`,
   `translations`, `siteLanguages`, `activeLanguage`, `homeActionText`, `weakKeyUi`, `coachUi`,
   `coachTrendHint`, `dailyGoalUi`, `rows`, `fingerMap`, `localizedLessonName` đã xoá hẳn — không
   file nào còn gọi tới (mỗi trang mới có bảng chuỗi của riêng nó), giữ lại chỉ tốn công đọc.
   Còn đúng ba thứ vì trang chủ thật sự dùng: `localizedUi`, `currentLocalizedUi`, `formatUi`.
================================================================================================= */
const localizedUi = {
  vi: { errors:'Số lỗi', notYet:'Chưa có', next:'Bài tiếp theo →', retry:'↻ Làm lại bài này', perfect:'Hoàn thành xuất sắc! Bạn có thể sang bài tiếp theo hoặc luyện lại.', accuracy:'Bạn đã hoàn thành với độ chính xác {accuracy}%. Hãy luyện lại để cải thiện nhé.', exploreTag:'Tài nguyên TypingEase', exploreTitle:'Khám phá TypingEase', explore:[['Cách gõ 10 ngón','Hướng dẫn vị trí ngón tay, hàng phím cơ sở và cách luyện gõ đúng kỹ thuật cho người mới.','Xem hướng dẫn'],['Kiểm tra tốc độ đánh máy','Làm bài typing test 60 giây để kiểm tra WPM, độ chính xác và tốc độ gõ hiện tại của bạn.','Kiểm tra ngay'],['WPM là gì?','Tìm hiểu WPM, cách tính tốc độ đánh máy và vì sao WPM nên được xem cùng độ chính xác.','Tìm hiểu WPM']], game:{tab:'Trò chơi',kicker:'THỬ THÁCH 30 GIÂY',title:'Đấu tốc độ',description:'Gõ càng đúng và nhanh, điểm thành tích càng cao.',time:'Thời gian',score:'Điểm',best:'Kỷ lục',idle:'Nhấn bắt đầu để nhận thử thách.',placeholder:'Gõ tại đây khi thử thách bắt đầu...',start:'Bắt đầu thử thách',running:'Đang thi đấu...',status:'Mỗi lượt thi kéo dài 30 giây.',focus:'Tập trung, gõ nhanh và chính xác!',finish:'Hoàn thành! Bạn đạt {score} điểm.',replay:'Chơi lại'} }
};
function currentLocalizedUi() { return localizedUi.vi; }
function formatUi(template, values) { return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template); }

/* =================================================================================================
   TRANG CHỦ (Phase 3) — engine 30 bài cũ đã ra khỏi đây.
   Trang chủ giờ chỉ còn bốn khối: hero (nút bắt đầu #hero-go HOẶC continue card) → unit đang
   học → 3 lối tắt → 3 card SEO. Hai mặt của hero do class `is-returning` trên <body> quyết định
   (renderContinueCard() bật/tắt, home.css ẩn mặt còn lại). Mọi thứ khác đã có nhà riêng:
     bài học        → /hoc/ (player, hash route)          — player.js
     lộ trình 35 bài→ /bai-hoc/                            — bai-hoc/curriculum-page.js
     thành tích     → /tien-do/ (bảng, heatmap, coach)     — tien-do/progress-page.js
     luyện tự do    → /luyen-tu-do/                        — luyen-tu-do/free-page.js
   Vì thế file này KHÔNG còn truy cập #typing-input, #free-input, #game-input, #keyboard,
   #results-body, .mode-switch, .stats, #lesson-levels... Ô gõ thử (#taster, taster.js) cũng đã
   bị xoá, nên không còn API startFromTaster. Các bảng chuỗi phía trên chỉ còn bản tiếng Việt:
   site một ngôn ngữ, không còn định tuyến /en/ · /ja/ và không còn dropdown chọn ngôn ngữ.
   Tiêu đề trang chủ (h1, .intro, document.title) do index.html quyết định — JS KHÔNG ghi đè.

   Tiến độ đọc từ `typingease-progress-v3` qua TypingEaseProgress — KHÔNG còn đọc
   `goxanh-lesson-records-v2`. Người chỉ có dữ liệu cũ được xử lý theo quyết định 5:
   một dòng "đã hoàn thành n bài ở giáo trình cũ", Unit 1-2 mở, không map từng bài.
================================================================================================= */

const curriculum = window.TypingEaseCurriculum || null;
const store = window.TypingEaseProgress || null;
const profile = window.TypingEaseProfile || null;

// Chỉ còn một trang chủ tiếng Việt ở gốc site, nên mọi đường dẫn đều tính từ './'.
const base = './';
const TEST_URL = './kiem-tra-toc-do-go/';
const CURRICULUM_URL = `${base}bai-hoc/`;
const PROGRESS_URL = `${base}tien-do/`;
const FREE_URL = `${base}luyen-tu-do/`;
const WEAK_URL = `${base}luyen-phim-yeu/`;
const GUIDE_URL = './cach-go-10-ngon/';
const lessonUrl = (lessonId, screen) => `${base}hoc/#${lessonId}/${screen}`;
const MARK = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫'];

const homeUi = {
  vi: {
    nav: ['Luyện gõ', 'Lộ trình', 'Tiến độ', 'Kiểm tra tốc độ'],
    roadmapKicker: 'Giáo trình {total} bài · {units} unit',
    roadmapAll: 'Xem tất cả {total} bài →',
    unitTitle: 'Unit {index} · {title}',
    unitDone: '{done}/{total} bài ✓',
    railDone: '✓',
    railSoon: 'Sắp có',
    railNote: 'Nội dung các unit sau đang được viết — bài chưa mở hiện mờ và chưa bấm được.',
    teaser: 'Unit {index} · {title} ({count} bài)',
    teaserLocked: '🔒',
    shortcutsTitle: 'Luyện thêm',
    shortcuts: [
      ['Kiểm tra tốc độ', 'Đo WPM và độ chính xác trong 15 · 30 · 60 · 120 giây.'],
      ['Luyện phím yếu', 'Bài tập sinh riêng từ những phím bạn hay sai nhất.'],
      ['Luyện tự do', 'Dán đoạn văn của bạn và gõ lại theo cách bạn muốn.']
    ],
    continueKicker: 'TIẾP TỤC',
    continueName: 'Bài {n} · {title}',
    continueCount: 'Unit {unit} · screen {screen}/{screens}',
    continueGo: '▶ Tiếp tục (Enter)',
    continueRedo: '↻ Làm lại bài {n}',
    continueMap: 'Xem lộ trình',
    streak: '🔥 {days} ngày · {minutes} phút hôm nay',
    coachWeak: 'Coach: phím <b>{keys}</b> đang kéo bạn xuống — luyện riêng 1 phút?',
    legacy: 'Đã hoàn thành {n} bài ở giáo trình cũ — Unit 1 và Unit 2 đã mở cho bạn.',
    doneKicker: 'DUY TRÌ PHONG ĐỘ',
    doneName: 'Bạn đã xong hết phần đã có nội dung',
    doneCount: 'Giữ nhịp bằng bài kiểm tra, phím yếu hoặc luyện tự do.',
    doneGo: '▶ Kiểm tra tốc độ (Enter)',
    exploreKicker: 'Tài nguyên TypingEase',
    footer: 'Gõ chậm một chút, rồi bạn sẽ đi rất xa.',
    contentVi: ''
  }
};
function currentHomeUi() { return homeUi.vi; }
const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/* --- đọc giáo trình + tiến độ ------------------------------------------------------------------ */
const sequence = curriculum?.sequence || [];
const lessonInfo = lessonId => curriculum?.lessons?.[lessonId] || null;
const isReady = lessonId => Boolean(lessonInfo(lessonId)?.ready);
const unitOf = lessonId => curriculum?.units.find(unit => unit.groups.some(group => group.lessons.includes(lessonId))) || null;
const unitLessons = unit => unit.groups.flatMap(group => group.lessons);
const screensDone = lessonId => Object.keys(store?.getLesson(lessonId)?.screens || {}).length;

function isLessonDone(lessonId) {
  const lesson = store?.getLesson(lessonId);
  if (!lesson) return false;
  const total = lessonInfo(lessonId)?.screens || 0;
  return Boolean(lesson.completedAt) || (total > 0 && screensDone(lessonId) >= total);
}

// "Bài đang dở" = `current` của store nếu bài đó còn dở, nếu không thì bài ready đầu tiên chưa xong.
function resolveContinue() {
  if (!curriculum || !store) return null;
  const saved = store.getCurrent();
  if (saved && isReady(saved.lessonId) && !isLessonDone(saved.lessonId)) {
    const total = lessonInfo(saved.lessonId).screens || saved.screen;
    return { lessonId: saved.lessonId, screen: Math.min(Math.max(1, saved.screen), total) };
  }
  const next = sequence.find(lessonId => isReady(lessonId) && !isLessonDone(lessonId));
  return next ? { lessonId: next, screen: 1 } : null;
}

// Người quay lại phải có tiến độ THẬT. Chỉ gõ thử dòng hero rồi bỏ đi (attempt kind:'free')
// không tính — nếu tính thì lần sau họ mất luôn ô gõ thử mà chưa từng vào bài nào.
function isReturning() {
  if (!store) return false;
  const state = store.getState();
  if (state.current || Object.keys(state.lessons).length > 0 || state.legacyCompleted > 0) return true;
  return (profile?.getState().attempts || []).some(item => item.kind === 'lesson' || item.kind === 'weak');
}

/* --- continue card ----------------------------------------------------------------------------- */
let continueHref = '';

function renderContinueCard() {
  const card = document.querySelector('#continue-card');
  if (!card) return;
  const returning = isReturning();
  document.body.classList.toggle('is-returning', returning);
  card.hidden = !returning;
  if (!returning) { continueHref = ''; return; }

  const ui = currentHomeUi();
  const target = resolveContinue();
  card.querySelector('#continue-kicker').textContent = target ? ui.continueKicker : ui.doneKicker;

  if (target) {
    const info = lessonInfo(target.lessonId);
    const unit = unitOf(target.lessonId);
    const number = sequence.indexOf(target.lessonId) + 1;
    const total = info.screens || 1;
    continueHref = lessonUrl(target.lessonId, target.screen);
    card.querySelector('#continue-name').textContent = formatUi(ui.continueName, { n: number, title: info.title });
    card.querySelector('#continue-count').textContent = formatUi(ui.continueCount, {
      unit: unit ? unit.index : '?', screen: target.screen, screens: total
    });
    const track = card.querySelector('#continue-track');
    const ratio = Math.round(Math.min(1, (target.screen - 1) / total) * 100);
    track.style.setProperty('--continue-progress', `${ratio}%`);
    track.setAttribute('aria-valuenow', String(ratio));
  } else {
    continueHref = TEST_URL;
    card.querySelector('#continue-name').textContent = ui.doneName;
    card.querySelector('#continue-count').textContent = ui.doneCount;
    const track = card.querySelector('#continue-track');
    track.style.setProperty('--continue-progress', '100%');
    track.setAttribute('aria-valuenow', '100');
  }
  card.querySelector('#continue-go').textContent = target ? ui.continueGo : ui.doneGo;

  // "Làm lại bài" chỉ có nghĩa khi đã xong ít nhất một bài.
  const redo = card.querySelector('#continue-redo');
  const lastDone = sequence.filter(isLessonDone).pop();
  redo.hidden = !lastDone;
  if (lastDone) {
    redo.href = lessonUrl(lastDone, 1);
    redo.textContent = formatUi(ui.continueRedo, { n: sequence.indexOf(lastDone) + 1 });
  }
  card.querySelector('#continue-map').textContent = ui.continueMap;
  card.querySelector('#continue-map').href = CURRICULUM_URL;

  const daily = store.loadDaily();
  const dayKey = localDateKey();
  const minutesToday = Math.floor((daily.days[dayKey]?.practiceSeconds || 0) / 60);
  const streak = card.querySelector('#continue-streak');
  streak.textContent = formatUi(ui.streak, { days: daily.currentStreak, minutes: minutesToday });
  streak.hidden = daily.currentStreak === 0 && minutesToday === 0;

  // Gợi ý của coach là dòng phụ, không bao giờ thay chỗ hành động chính.
  const nudge = card.querySelector('#continue-coach');
  const weak = (profile?.getWeakKeys(3) || []).filter(item => item.attempts >= profile.KEY_SAMPLE_FLOOR && item.accuracy < 92);
  nudge.hidden = weak.length === 0;
  if (weak.length)
    nudge.innerHTML = formatUi(ui.coachWeak, { keys: escapeHtml(weak.map(item => item.key.toUpperCase()).join(', ')) });

  // Quyết định 5: chỉ nói con số của giáo trình cũ, không dựng tiến độ giả.
  const legacyEl = card.querySelector('#continue-legacy');
  const legacy = store.legacyCompleted();
  legacyEl.hidden = legacy === 0;
  if (legacy > 0) legacyEl.textContent = formatUi(ui.legacy, { n: legacy });
}

function goContinue() {
  if (continueHref) { location.href = continueHref; return; }
  const target = resolveContinue();
  location.href = target ? lessonUrl(target.lessonId, target.screen) : `${base}hoc/`;
}

/* --- rail: unit đang học ------------------------------------------------------------------------ */
function renderRail() {
  const rail = document.querySelector('#unit-rail');
  if (!rail || !curriculum) return;
  const ui = currentHomeUi();
  const target = resolveContinue();
  const unit = (target && unitOf(target.lessonId)) || curriculum.units[0];
  const ids = unitLessons(unit);
  const done = ids.filter(isLessonDone).length;

  document.querySelector('#roadmap-kicker').innerHTML =
    `<i></i> ${escapeHtml(formatUi(ui.roadmapKicker, { total: sequence.length, units: curriculum.units.length }))}`;
  document.querySelector('#roadmap-title').textContent = formatUi(ui.unitTitle, { index: unit.index, title: unit.title });
  document.querySelector('#roadmap-summary').textContent = unit.summary;
  document.querySelector('#roadmap-count').textContent = formatUi(ui.unitDone, { done, total: ids.length });
  const all = document.querySelector('#roadmap-all');
  all.textContent = formatUi(ui.roadmapAll, { total: sequence.length });
  all.href = CURRICULUM_URL;

  rail.innerHTML = ids.map((lessonId, index) => {
    const info = lessonInfo(lessonId);
    if (!info) return '';
    const lessonDone = isLessonDone(lessonId);
    const active = Boolean(target && target.lessonId === lessonId);
    const label = `<b>${MARK[index] || index + 1}</b><span>${escapeHtml(info.title)}</span>`;
    // Bài chưa có nội dung không được là link: /hoc/ chỉ hiện "chưa mở", dẫn vào đó là dẫn vào
    // chỗ trống. Nó vẫn phải NHÌN THẤY được để người dùng biết lộ trình đi tới đâu.
    if (!info.ready)
      return `<span class="rail-chip is-soon" aria-disabled="true">${label}<em>${escapeHtml(ui.railSoon)}</em></span>`;
    const state = active ? '▶' : lessonDone ? ui.railDone : '';
    const screen = active ? target.screen : 1;
    return `<a class="rail-chip${lessonDone ? ' is-done' : ''}${active ? ' is-current' : ''}"`
      + ` href="${lessonUrl(lessonId, screen)}">${label}<em>${escapeHtml(state)}</em></a>`;
  }).join('');

  const note = document.querySelector('#rail-note');
  const soon = ids.filter(lessonId => !isReady(lessonId)).length;
  const extra = ui.contentVi ? ` ${ui.contentVi}` : '';
  note.hidden = soon === 0 && !ui.contentVi;
  note.textContent = `${soon ? ui.railNote : ''}${extra}`.trim();

  const teasers = document.querySelector('#unit-teasers');
  teasers.innerHTML = curriculum.units.filter(other => other.id !== unit.id).map(other => {
    const count = unitLessons(other).length;
    const locked = !store?.isUnlocked(other.id);
    return `<li><a href="${CURRICULUM_URL}#${other.id}">`
      + `${escapeHtml(formatUi(ui.teaser, { index: other.index, title: other.title, count }))}`
      + `${locked ? ` ${ui.teaserLocked}` : ''}</a></li>`;
  }).join('');
}

/* --- lối tắt ----------------------------------------------------------------------------------- */
function renderShortcuts() {
  const ui = currentHomeUi();
  const title = document.querySelector('#shortcuts-title');
  if (title) title.textContent = ui.shortcutsTitle;
  [['#sc-test', TEST_URL], ['#sc-weak', WEAK_URL], ['#sc-free', FREE_URL]].forEach(([selector, href], index) => {
    const card = document.querySelector(selector);
    if (!card) return;
    card.href = href;
    const [name, text] = ui.shortcuts[index];
    card.querySelector('.sc-title').textContent = name;
    card.querySelector('.sc-text').textContent = text;
  });
}

/* --- đổ chuỗi cho phần còn lại của trang -------------------------------------------------------- */
// Không còn một selector theo THỨ TỰ nào ở đây (DECISIONS.md cạm bẫy 3): mọi phần tử được gọi
// bằng id hoặc bằng vòng lặp trên chính danh sách của nó, nên thêm/bớt markup không làm lệch chuỗi.
// LƯU Ý: h1, .intro và document.title KHÔNG được đụng tới — index.html là nguồn sự thật cho chúng.
function applyCopy() {
  const ui = currentHomeUi();

  const navLinks = [...document.querySelectorAll('.topbar nav a')];
  navLinks.forEach((link, index) => { if (ui.nav[index]) link.textContent = ui.nav[index]; });

  const exploreKicker = document.querySelector('#explore-kicker');
  if (exploreKicker) exploreKicker.innerHTML = `<i></i> ${escapeHtml(ui.exploreKicker)}`;
  const exploreTitle = document.querySelector('#explore-title');
  const localized = currentLocalizedUi();
  if (exploreTitle && localized.exploreTitle) exploreTitle.textContent = localized.exploreTitle;
  document.querySelectorAll('.explore-card').forEach((card, index) => {
    const copy = localized.explore?.[index];
    if (!copy) return;
    const [title, description, cta] = copy;
    card.querySelector('h3').textContent = title;
    card.querySelector('p').textContent = description;
    card.querySelector('span').childNodes[0].nodeValue = `${cta} `;
  });
  const footerNote = document.querySelector('footer p');
  if (footerNote) footerNote.textContent = ui.footer;

  renderShortcuts();
  renderContinueCard();
  renderRail();
}

/* --- điều hướng ------------------------------------------------------------------------------- */
// #bang-xep-hang và #huong-dan từng là section trên trang chủ và vẫn được link từ ngoài.
// Chúng không còn tồn tại ở đây, nên chuyển tiếp sang nhà mới thay vì để người dùng rơi vào khoảng trắng.
const LEGACY_HASH = { '#bang-xep-hang': () => PROGRESS_URL, '#huong-dan': () => GUIDE_URL, '#thanh-tich': () => PROGRESS_URL };
function followLegacyHash() {
  const resolve = LEGACY_HASH[location.hash];
  if (resolve) location.replace(resolve());
}
window.addEventListener('hashchange', followLegacyHash);

const continueCard = document.querySelector('#continue-card');
if (continueCard) {
  continueCard.querySelector('#continue-go').addEventListener('click', event => { event.stopPropagation(); goContinue(); });
  continueCard.addEventListener('click', event => { if (!event.target.closest('a,button')) goContinue(); });
}

// Enter ở bất kỳ đâu trên trang chủ = đi tiếp, trừ khi người dùng đang ở trong một ô nhập.
// Người cũ (continue card đang hiện) → tiếp tục bài đang học; người mới (card ẩn) → nút #hero-go.
document.addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  const heroGo = document.querySelector('#hero-go');
  const returning = continueCard && !continueCard.hidden;
  if (!returning && !heroGo) return;
  const active = document.activeElement;
  if (active && (active.isContentEditable || active.closest('input,textarea,select,a,button'))) return;
  event.preventDefault();
  if (returning) goContinue();
  else location.href = heroGo.href;
});

window.TypingEaseHome = {
  goContinue,
  continueTarget: resolveContinue,
  curriculumUrl: () => CURRICULUM_URL,
  testUrl: () => TEST_URL,
  lessonCount: () => sequence.length
};

/* --- boot -------------------------------------------------------------------------------------- */
followLegacyHash();
// Site chỉ còn tiếng Việt: không đọc localStorage, không dò locale trong URL, không dropdown.
// applyCopy() đổ chuỗi cho nav/khối khám phá/footer rồi vẽ lối tắt, continue card và rail.
applyCopy();
window.addEventListener('pagehide', () => profile?.save());
