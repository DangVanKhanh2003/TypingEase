(function (global) {
  // The lesson player: /hoc/#<lessonId>/<screen>.
  //
  // One lesson is a list of screens; one screen is one of five types (PLAN.md C3). The player
  // is a small state machine — intro | typing | screen-result | lesson-result, plus loading and
  // error — driven entirely by the hash, so reload and the browser Back button both land on a
  // sensible screen without any extra bookkeeping.
  //
  // Speed is deliberately hidden while typing (PLAN.md B5): accuracy and errors only, with WPM
  // and stars revealed on the result card after each screen.
  const store = global.TypingEaseProgress;
  const profile = global.TypingEaseProfile;
  const weakKeysApi = global.TypingEaseWeakKeys;
  const telex = global.TypingEaseTelex;
  const WEAK_KEYS_STORAGE_KEY = weakKeysApi?.STORAGE_KEY || 'typingease-weak-keys-v1';
  const MOBILE_NOTE_KEY = 'typingease-player-mobile-note-v1';

  const STAR_GREAT = 98, STAR_GOOD = 94, STARS = 3;
  const DEFAULT_MIN_ACCURACY = 75, DEFAULT_BURST_SECONDS = 25;
  const MIN_KEY_MS = 40, MAX_KEY_MS = 2500, SLOW_KEY_MS = 600, SLOW_KEY_SAMPLES = 3;

  // Mã ngón trong dữ liệu bài học (`screen.finger`) → tên tiếng Việt. Bảng này thuộc về giáo
  // trình, không thuộc bàn phím: nó thắng bảng phím→ngón vì tác giả bài mới biết mình muốn
  // dạy ngón nào (ví dụ phím cách có thể là ngón cái trái hay phải tuỳ bài).
  const FINGER_NAMES = {
    LP: 'ngón út trái', LR: 'ngón áp út trái', LM: 'ngón giữa trái', LI: 'ngón trỏ trái', LT: 'ngón cái trái',
    RT: 'ngón cái phải', RI: 'ngón trỏ phải', RM: 'ngón giữa phải', RR: 'ngón áp út phải', RP: 'ngón út phải'
  };

  const T = {
    loading: 'Đang tải bài học…',
    missingTitle: 'Chưa có nội dung bài này',
    missingBody: 'Không tải được <code>{path}</code>. Nội dung bài học đang được viết — hãy thử lại sau, hoặc chọn một bài khác từ trang chủ.',
    noCurriculum: 'Chưa nạp được chỉ mục giáo trình (<code>data/curriculum.vi.js</code>).',
    fixtureNote: 'Đang dùng nội dung mẫu trong <code>hoc/_fixture/</code> — bài thật chưa có trong <code>data/lessons/vi/</code>.',
    screenOf: 'Screen {n} / {total}',
    newKey: 'PHÍM MỚI',
    pressToContinue: 'Nhấn <b>{key}</b> để tiếp tục',
    enterToContinue: 'Nhấn <b>Enter</b> để tiếp tục',
    found: 'Đúng rồi!',
    foundBody: 'Nhớ chỗ của phím <b>{key}</b> nhé — ta sẽ luyện nó ngay bây giờ.',
    accuracyLive: '{accuracy}% chính xác',
    errorsLive: '{count} lỗi',
    tokensLive: '{count} cụm',
    great: 'Xuất sắc!',
    good: 'Tốt lắm!',
    pass: 'Đạt rồi.',
    fail: 'Chưa đạt {min}% — nên làm lại screen này.',
    resultAccuracy: '{accuracy}% chính xác',
    resultWpm: '{wpm} WPM',
    resultErrors: '{count} lỗi',
    resultTokens: '{count} cụm đúng',
    slowKey: 'Phím <b>{key}</b> chậm nhất ({ms} s/lần) — cứ để ngón với tới rồi quay ngay về hàng cơ sở.',
    keepAccuracy: 'Chậm lại một nhịp thì chính xác sẽ lên — tốc độ theo sau.',
    continueEnter: 'Tiếp tục → (Enter)',
    redoScreen: 'Làm lại screen',
    redoScreenAdvised: 'Làm lại screen (khuyến nghị)',
    skipScreen: 'Bỏ qua',
    lessonDone: 'HOÀN THÀNH',
    learned: 'Bạn đã học {count} phím:',
    statWpm: 'Tốc độ',
    statAccuracy: 'Chính xác',
    statTime: 'Thời gian',
    statStars: 'Sao',
    technique: 'Kỹ thuật cần nhớ',
    weakTitle: 'Phím cần luyện thêm',
    weakButton: 'Luyện 1 phút',
    unitProgress: '{unit} · {done}/{total} bài',
    nextLesson: '▶ {title} (Enter)',
    finishAll: '▶ Về trang chủ (Enter)',
    redoLesson: '↻ Làm lại bài',
    home: 'Về trang chủ',
    noMoreTitle: 'Bạn đã đi hết nội dung hiện có',
    noMoreBody: 'Unit tiếp theo đang được viết. Trong lúc chờ, hãy luyện phím yếu hoặc thử bài kiểm tra tốc độ.',
    notReadyTitle: 'Bài này chưa có nội dung',
    notReadyBody: '<b>{title}</b> đã có trong lộ trình nhưng nội dung sẽ được viết ở giai đoạn sau. Hãy chọn một bài đã mở.',
    weakPage: 'Luyện phím yếu',
    imeNote: 'Hình như bộ gõ tiếng Việt chưa bật: bạn đang gõ ra chuỗi Telex thô. Bật Unikey hoặc EVKey ở kiểu gõ Telex, hoặc chuyển bài này sang gõ không dấu.',
    imeNoteButton: 'Gõ không dấu',
    asciiNote: 'Bài này đang ở chế độ gõ KHÔNG DẤU. Bật bộ gõ tiếng Việt rồi bấm nút bên cạnh để quay lại bản có dấu.',
    asciiNoteButton: 'Gõ có dấu',
    shiftFinger: 'ngón út tay đối diện',
    testPage: 'Kiểm tra tốc độ',
    mobileNote: 'Bài học được thiết kế cho máy tính có bàn phím — 10 ngón cần 10 phím thật. Trên điện thoại bạn vẫn gõ thử được, nhưng hãy quay lại trên máy tính để học cho đủ.',
    mobileNoteClose: 'Đã hiểu',
    tapToType: 'Chạm để gõ',
    menuTitle: 'Tạm dừng',
    menuResume: 'Tiếp tục gõ',
    menuRedo: 'Làm lại screen',
    menuSkip: 'Bỏ qua screen',
    menuExit: 'Về trang chủ',
    clock: '{seconds} s'
  };
  const fill = (template, values = {}) =>
    Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(String(value)), template);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[character]));
  const NAMED_KEY_LABELS = { shift: 'Shift', enter: 'Enter', tab: 'Tab', backspace: 'Backspace' };
  const NAMED_INTRO_KEYS = ['shift', 'enter'];
  // aa -> â, ow -> ơ … a Telex pair is a rule, not a key, so it is labelled by its result.
  const TELEX_LABELS = { aa: 'aa→â', ee: 'ee→ê', oo: 'oo→ô', dd: 'dd→đ', aw: 'aw→ă', uw: 'uw→ư', ow: 'ow→ơ' };
  const keyLabel = key => (key === ' ' ? 'Space'
    : TELEX_LABELS[key] || NAMED_KEY_LABELS[key] || String(key || '').toUpperCase());

  // --- DOM ------------------------------------------------------------------------------------
  const root = document.querySelector('#player');
  if (!root) return;
  const unitEl = root.querySelector('#pt-unit');
  const lessonEl = root.querySelector('#pt-lesson');
  const screenEl = root.querySelector('#pt-screen');
  const redoEl = root.querySelector('#pt-redo');
  const progressEl = root.querySelector('#pt-progress');
  const noteEl = root.querySelector('#player-note');
  const stageEl = root.querySelector('#stage');
  const boardEl = root.querySelector('#board');
  const liveEl = root.querySelector('#live');
  const input = root.querySelector('#player-input');
  const tapEl = root.querySelector('#tap-to-type');

  const soundEl = root.querySelector('#pt-sound');
  const handsEl = root.querySelector('#pt-hands');
  const sound = global.TypingEaseSound;

  // Bàn phím + bàn tay 3D là API của typekute, treo trên `window.NTKeyboard` bởi keyboard/boot.js.
  // `board` là phần tử bàn phím; nó chỉ có sau khi catalog layout tải xong nên mọi chỗ gọi phải
  // chịu được `null`. Tuỳ chọn (hiện bàn phím/bàn tay, một tay, kiểu chữ, bố cục) nằm trong
  // localStorage của module đó — công tắc ✋ trên thanh trên cùng chỉ là lối tắt tới `animatedHands`.
  let NT = null;
  let board = null;
  let preferences = null;

  // Điện thoại không đủ chỗ cho bài + bàn phím + tay, nên tay tắt bất kể tuỳ chọn; đổi lại, người
  // học xoay ngang máy là tay hiện lại mà không phải vào Cài đặt.
  const boardPreferences = () => ({ ...preferences, showHands: preferences.showHands && !isPhone() });

  function applyBoardPreferences() {
    if (!board) return;
    NT.applyKeyboardPreferences(board, boardPreferences());
    // Khung bài học căn sát đáy để nằm ngay trên bàn phím; ẩn bàn phím đi mà vẫn căn đáy thì cả
    // bài tụt xuống mép dưới, chừa một khoảng trống to tướng phía trên (đúng như ảnh chụp 18/09).
    root.classList.toggle('no-keyboard', !preferences.showKeyboard);
  }

  async function mountKeyboard() {
    NT = await global.NTKeyboardReady;
    if (!NT) return;
    preferences = NT.loadKeyboardPreferences();
    const layout = await NT.ready.catch(error => { console.warn('[player] bàn phím không tải được', error); return null; });
    if (!layout) return;
    const holder = document.createElement('div');
    holder.className = 'cell js-keyboard-holder well';
    board = NT.createKeyboard({
      activeKey: '',
      preferences: boardPreferences(),
      layout,
      onSettings: () => NT.openSettingsFor(board, {
        root: boardEl,
        restoreFocus: focusInput,
        onSave: (next) => { preferences = next; applyBoardPreferences(); syncToggles(); }
      })
    });
    holder.append(board);
    boardEl.replaceChildren(holder);
  }

  function syncToggles() {
    soundEl?.setAttribute('aria-pressed', String(Boolean(sound?.isOn())));
    handsEl?.setAttribute('aria-pressed', String(Boolean(preferences?.animatedHands)));
  }

  function setAnimatedHands(value) {
    if (!NT) return;
    preferences = NT.saveKeyboardPreferences({ ...preferences, animatedHands: Boolean(value) });
    // Tư thế tay đổi theo hàng phím chỉ khi `animatedHands` bật, và bản gốc dựng lại board khi
    // công tắc này đổi — `applyRootKeyboardPreferences` lo đúng việc đó.
    NT.applyRootKeyboardPreferences(boardEl, boardPreferences(), NT.layout());
    syncToggles();
  }

  soundEl?.addEventListener('click', () => { sound?.toggle(); syncToggles(); focusInput(); });
  handsEl?.addEventListener('click', () => { setAnimatedHands(!preferences?.animatedHands); focusInput(); });

  // --- viewport -------------------------------------------------------------------------------
  // Hands need room to read; a phone gets three rows of letters and no hands at all (PLAN.md B8).
  // Hai ngưỡng này phải khớp CHÍNH XÁC với player.css, nếu không sẽ có dải bề rộng mà JS và CSS
  // bất đồng: ở đúng 900px, JS từng vẽ tay trong khi CSS đã kéo padding đáy về 0 → tay biến mất.
  const wideQuery = global.matchMedia('(min-width: 901px)');
  const phoneQuery = global.matchMedia('(max-width: 620px)');
  const touchQuery = global.matchMedia('(hover: none)');
  const isPhone = () => phoneQuery.matches;

  function applyViewport() {
    applyBoardPreferences();
    root.classList.toggle('is-phone', isPhone());
    root.classList.toggle('is-touch', touchQuery.matches);
    if (tapEl) tapEl.textContent = T.tapToType;
    renderNotes();
  }

  let mobileNoteDismissed = false;
  try { mobileNoteDismissed = localStorage.getItem(MOBILE_NOTE_KEY) === '1'; } catch { mobileNoteDismissed = false; }

  // Two notices can be live at once — "this is a fixture" and "lessons want a real keyboard" —
  // so the strip is a stack of rows rather than one message that overwrites the other.
  function renderNotes() {
    if (!noteEl) return;
    const rows = [];
    if (usingFixture && state !== 'loading' && state !== 'error')
      rows.push(`<p class="player-note is-warn">${T.fixtureNote}</p>`);
    if ((isPhone() || touchQuery.matches) && !mobileNoteDismissed && state !== 'loading' && state !== 'error')
      rows.push(`<p class="player-note is-info"><span>ⓘ ${T.mobileNote}</span>`
        + `<button type="button" class="note-close" id="note-close">${T.mobileNoteClose}</button></p>`);
    if (imeNoteVisible && !asciiFallback)
      rows.push(`<p class="player-note is-warn"><span>⚠ ${T.imeNote}</span>`
        + `<button type="button" class="note-close" id="note-ascii">${T.imeNoteButton}</button></p>`);
    if (asciiFallback)
      rows.push(`<p class="player-note is-info"><span>ⓘ ${T.asciiNote}</span>`
        + `<button type="button" class="note-close" id="note-telex">${T.asciiNoteButton}</button></p>`);
    noteEl.innerHTML = rows.join('');
    noteEl.hidden = !rows.length;
    noteEl.querySelector('#note-ascii')?.addEventListener('click', () => setAsciiFallback(true));
    noteEl.querySelector('#note-telex')?.addEventListener('click', () => setAsciiFallback(false));
    noteEl.querySelector('#note-close')?.addEventListener('click', () => {
      mobileNoteDismissed = true;
      try { localStorage.setItem(MOBILE_NOTE_KEY, '1'); } catch { /* storage blocked */ }
      renderNotes();
    });
  }

  // --- curriculum -----------------------------------------------------------------------------
  let curriculum = global.TypingEaseCurriculum || null;

  const loadScript = src => new Promise((resolve, reject) => {
    const element = document.createElement('script');
    element.src = src;
    element.onload = resolve;
    element.onerror = () => reject(new Error(`cannot load ${src}`));
    document.head.append(element);
  });

  async function ensureCurriculum() {
    if (curriculum) return curriculum;
    // The real index is a <script> in the page. If it is not there yet (the content for this
    // curriculum is written separately), fall back to the development fixture so the player
    // still runs instead of showing a blank page.
    try { await loadScript('_fixture/curriculum.vi.js'); } catch { /* fixture missing too */ }
    curriculum = global.TypingEaseCurriculum || null;
    return curriculum;
  }

  const unitList = () => (Array.isArray(curriculum?.units) ? curriculum.units : []);
  const unitOf = id => unitList().find(unit =>
    (unit.groups || []).some(group => (group.lessons || []).includes(id))) || null;
  const unitLessonIds = unit => (unit?.groups || []).flatMap(group => group.lessons || []);
  // `sequence` is the authored linear order and is guaranteed to match the flattened
  // units -> groups -> lessons walk, so it wins when present.
  const orderedIds = () => (Array.isArray(curriculum?.sequence) && curriculum.sequence.length
    ? curriculum.sequence : unitList().flatMap(unitLessonIds));
  const indexEntry = id => curriculum?.lessons?.[id] || null;
  // `ready: false` means the lesson is on the roadmap but its JSON has not been written yet
  // (Unit 2-4 at the moment). Never route to one: it would only produce a 404. An id that is
  // not in the index at all (someone typed a hash by hand) is treated the same way — otherwise
  // it costs two failed fetches and two console errors before the same error card appears.
  const isReady = id => {
    const entry = indexEntry(id);
    if (entry) return entry.ready !== false;
    return !curriculum?.lessons;   // no index loaded at all: fall through to the fixture path
  };
  const indexOfLesson = id => { const at = orderedIds().indexOf(id); return at === -1 ? null : at; };
  const nextLessonId = id => {
    const all = orderedIds(), at = all.indexOf(id);
    if (at === -1) return null;
    const next = all[at + 1];
    return next && isReady(next) ? next : null;
  };
  const firstLessonId = () => curriculum?.starter?.lessonId || orderedIds().find(isReady) || 'u1-l01';

  // --- lesson loading -------------------------------------------------------------------------
  const DATA_BASE = '../data/lessons/vi/';
  const FIXTURE_BASE = './_fixture/';
  const lessonCache = new Map();

  async function fetchJson(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`${response.status} ${path}`);
    return response.json();
  }

  async function loadLesson(id) {
    if (lessonCache.has(id)) return lessonCache.get(id);
    // Ask the index first so a lesson that exists for real never triggers a fixture 404, and a
    // lesson that only exists as a fixture never triggers a data 404.
    const known = Boolean(indexEntry(id)) && !curriculum?.fixture;
    const order = known ? [DATA_BASE, FIXTURE_BASE] : [FIXTURE_BASE, DATA_BASE];
    let data = null, from = '';
    for (const base of order) {
      try { data = await fetchJson(`${base}${id}.json`); from = base; break; } catch { /* try the next */ }
    }
    const result = data ? { data: normalizeLesson(data, id), fixture: from === FIXTURE_BASE } : null;
    if (result) lessonCache.set(id, result);
    return result;
  }

  const prefetch = id => { if (id && !lessonCache.has(id)) loadLesson(id).catch(() => {}); };

  // Content lines are joined by one keystroke, and `linebreak` picks which one: "space" (the
  // default, where the line break is presentation only) or "enter", where the newline is a real
  // character of the target and only a real Enter press satisfies it (DECISIONS.md bổ sung 6).
  function buildTarget(content, linebreak) {
    const glue = linebreak === 'enter' ? '\n' : ' ';
    const lines = String(content ?? '').split('\n').map(line => line.trim()).filter(Boolean);
    let target = '';
    const breaks = new Set();
    lines.forEach((line, position) => {
      target += line;
      if (position < lines.length - 1) { breaks.add(target.length); target += glue; }
    });
    return { target, breaks };
  }

  function normalizeLesson(raw, id) {
    const screens = (Array.isArray(raw.screens) ? raw.screens : []).filter(screen => screen && typeof screen === 'object');
    return {
      id: typeof raw.id === 'string' ? raw.id : id,
      unit: raw.unit || unitOf(id)?.id || '',
      title: raw.title || indexEntry(id)?.title || id,
      summary: raw.summary || '',
      newKeys: Array.isArray(raw.newKeys) ? raw.newKeys : [],
      keysSoFar: Array.isArray(raw.keysSoFar) ? raw.keysSoFar : [],
      minAccuracy: Number.isFinite(Number(raw.minAccuracy)) ? Number(raw.minAccuracy) : DEFAULT_MIN_ACCURACY,
      estMinutes: Number(raw.estMinutes) || 0,
      inputMode: raw.inputMode === 'telex' ? 'telex' : 'ascii',
      intro: raw.intro || '',
      congrats: raw.congrats || '',
      screens
    };
  }

  // --- state ----------------------------------------------------------------------------------
  let state = 'loading';
  let lesson = null, screens = [], screenIndex = 0, usingFixture = false;
  let run = null, runLog = [], clockTimer = null, lastDailyPing = 0;
  // Telex (Unit 3): `asciiFallback` is the escape hatch of DECISIONS.md quyết định 1 — the
  // same lesson with every diacritic stripped, for a machine with no Vietnamese IME.
  let asciiFallback = false, imeNoteVisible = false, uncomposedHits = 0;

  const currentScreen = () => screens[screenIndex] || null;
  const screenSeconds = screen => Number(screen?.seconds ?? screen?.timeLimit) || 0;
  const isScored = type => type === 'standard' || type === 'burst' || type === 'test';
  const showsWpm = type => isScored(type);

  function starsFor(accuracy, minAccuracy) {
    if (!Number.isFinite(accuracy)) return 0;
    if (accuracy >= STAR_GREAT) return 3;
    if (accuracy >= STAR_GOOD) return 2;
    return accuracy >= minAccuracy ? 1 : 0;
  }

  // --- weak-key mirror ------------------------------------------------------------------------
  // Same store and same shape as script.js, so /luyen-phim-yeu/ keeps seeing mistakes made here.
  function noteWeakKey(character) {
    const key = !character || /\s/.test(character) ? '' : character.toLocaleLowerCase();
    if (!key) return;
    let records = {};
    try { records = JSON.parse(localStorage.getItem(WEAK_KEYS_STORAGE_KEY)) || {}; } catch { records = {}; }
    records[key] = (Number(records[key]) || 0) + 1;
    try { localStorage.setItem(WEAK_KEYS_STORAGE_KEY, JSON.stringify(records)); } catch { /* storage blocked */ }
  }

  // --- weak-key drill content -----------------------------------------------------------------
  // `test` screens with source:"weak-keys" build their text at runtime. TypingEaseWeakKeys now
  // takes `allowedKeys` and carries a Vietnamese word pool, so it can be trusted to stay inside
  // keysSoFar on its own — even when that set is just `j f ␣`, where it falls back to combos.
  function weakDrillContent(screen) {
    const allowed = new Set((lesson.keysSoFar.length ? lesson.keysSoFar : lesson.newKeys).map(key => String(key).toLowerCase()));
    allowed.add(' ');
    const minKeys = Math.max(1, Number(screen.minKeys) || 2);
    let records = {};
    try { records = JSON.parse(localStorage.getItem(WEAK_KEYS_STORAGE_KEY)) || {}; } catch { records = {}; }

    const fromProfile = (profile?.getWeakKeys(6) || []).map(item => item.key);
    const fromRecords = (weakKeysApi?.getTopWeakKeys(records) || []).map(([key]) => key);
    const pool = [...new Set([...fromProfile, ...fromRecords])].filter(key => allowed.has(key));
    const filler = [...allowed].filter(key => key !== ' ' && !pool.includes(key));
    while (pool.length < minKeys && filler.length) pool.push(filler.shift());
    const keys = pool.slice(0, 4);
    if (!keys.length) return String(screen.content || '');

    // 32 × 12 khớp khối lượng bài test 120 giây của u1-l09; `allowed` đã chứa dấu cách.
    const generated = weakKeysApi?.buildWeakPractice(keys, records, { allowedKeys: allowed, maxLength: 32, lines: 12 }) || '';
    if (generated) return generated;

    return String(screen.content || '');
  }

  // --- rendering: chrome ----------------------------------------------------------------------
  function renderChrome() {
    const unit = unitOf(lesson?.id) || null;
    const entry = indexEntry(lesson?.id);
    const number = unit ? unitLessonIds(unit).indexOf(lesson.id) + 1 : 0;
    unitEl.textContent = unit ? `${unit.title}${number ? ` › Bài ${number}` : ''}` : '';
    lessonEl.textContent = lesson ? lesson.title : (entry?.title || T.loading);
    screenEl.textContent = screens.length ? fill(T.screenOf, { n: screenIndex + 1, total: screens.length }) : '';
    document.title = lesson ? `${lesson.title} · TypingEase` : 'Bài học · TypingEase';
    renderProgress();
  }

  function renderProgress() {
    if (!screens.length) { progressEl.innerHTML = ''; return; }
    const record = store.getLesson(lesson.id);
    progressEl.setAttribute('aria-valuemax', String(screens.length));
    progressEl.setAttribute('aria-valuenow', String(state === 'lesson-result' ? screens.length : screenIndex));
    progressEl.innerHTML = screens.map((screen, position) => {
      const done = state === 'lesson-result' || position < screenIndex || Boolean(record?.screens[String(position)]);
      const status = state === 'lesson-result' ? 'done' : position === screenIndex ? 'current' : done ? 'done' : 'todo';
      return `<span class="seg is-${status}" title="Screen ${position + 1} · ${escapeHtml(screen.type || '')}"></span>`;
    }).join('');
  }

  // --- rendering: prompt ----------------------------------------------------------------------
  function paintPrompt() {
    const promptEl = stageEl.querySelector('#prompt-lines');
    if (!promptEl || !run) return;
    const typed = input.value;
    let html = '', word = '';
    const flush = () => { if (word) { html += `<span class="w">${word}</span>`; word = ''; } };
    [...run.target].forEach((character, position) => {
      const status = position < typed.length
        ? (run.telex && run.view ? (run.view.states[position] || 'bad') : (typed[position] === character ? 'ok' : 'bad'))
        : position === typed.length ? 'cur' : '';
      if (run.breaks.has(position)) {
        word += `<span class="ch brk ${status}">${character === '\n' ? '⏎' : '␣'}</span>`;
        flush();
        html += '<br>';
        return;
      }
      if (character === ' ') { word += `<span class="ch sp ${status}">&nbsp;</span>`; flush(); return; }
      word += `<span class="ch ${status}">${escapeHtml(character)}</span>`;
    });
    flush();
    promptEl.innerHTML = html;
    // A 60-second test is a dozen lines long. Rather than pushing the keyboard off screen, the
    // prompt is a fixed-height window that scrolls to keep the cursor line in the middle.
    const cursor = promptEl.querySelector('.ch.cur');
    if (cursor && promptEl.scrollHeight > promptEl.clientHeight + 1)
      promptEl.scrollTop = Math.max(0, cursor.offsetTop - (promptEl.clientHeight - cursor.offsetHeight) / 2);
    if (board) NT.setKeyboardState(board, nextKeyHint(typed));
  }

  // Which key the keyboard widget should light up next. In ascii that is simply the next
  // character; in telex a composed character takes two or three presses ("ầ" = a, a, f), so the
  // highlight follows the composition rather than jumping straight to the finished letter.
  function nextKeyHint(typedValue) {
    const position = typedValue.length;
    if (!run.telex || !telex) return run.target[position];
    const states = run.view?.states || [];
    if (position > 0 && states[position - 1] === 'pending') {
      const want = run.target[position - 1];
      const at = telex.steps(want).indexOf(typedValue[position - 1]);
      const keys = telex.keysFor(want);
      if (at >= 0 && keys[at + 1]) return keys[at + 1];
    }
    const want = run.target[position];
    if (!want) return want;
    const keys = telex.keysFor(want);
    return keys[0] || want;
  }

  function updateLive() {
    if (!run) { liveEl.textContent = ''; return; }
    const accuracy = run.typed ? Math.round(run.correct / run.typed * 100) : 100;
    const parts = [fill(T.accuracyLive, { accuracy }), fill(T.errorsLive, { count: run.errors })];
    if (run.type === 'burst') parts.push(fill(T.tokensLive, { count: run.tokensDone }));
    liveEl.textContent = parts.join(' · ');
  }

  function updateClock() {
    const clock = stageEl.querySelector('#clock');
    if (!clock || !run?.limit) return;
    const left = run.startedAt
      ? Math.max(0, run.limit - Math.round((Date.now() - run.startedAt) / 1000))
      : run.limit;
    clock.textContent = fill(T.clock, { seconds: left });
    clock.classList.toggle('is-low', left <= 5);
  }

  // --- screen lifecycle -----------------------------------------------------------------------
  function clearRun() {
    clearInterval(clockTimer);
    clockTimer = null;
    run = null;
    input.value = '';
    liveEl.textContent = '';
  }

  function enterScreen(position) {
    clearRun();
    screenIndex = Math.min(Math.max(0, position), Math.max(0, screens.length - 1));
    store.setCurrent(lesson.id, screenIndex + 1);
    const screen = currentScreen();
    if (!screen) { renderLessonResult(); return; }
    // Telex is Phase 4. All that exists here is the seam: the mode is resolved per screen
    // (screen overrides lesson) and published on the root, so the composition-aware matcher of
    // PLAN.md C6 can hook in without touching anything else. Until then every mode types ascii.
    root.dataset.inputMode = screen.inputMode === 'telex'
      || (screen.inputMode !== 'ascii' && lesson.inputMode === 'telex') ? 'telex' : 'ascii';
    if (screen.type === 'intro') enterIntro(screen);
    else enterTyping(screen);
    renderChrome();
    focusInput();
  }

  function enterIntro(screen) {
    state = 'intro';
    run = { type: 'intro', target: screen.key ? String(screen.key) : '', found: !screen.key, breaks: new Set() };
    renderIntro(screen);
    NT?.markKeys(board, screen.key || '');
    if (board) NT.setKeyboardState(board, screen.key || '');
  }

  function enterTyping(screen) {
    state = 'typing';
    // A telex screen is matched by TypingEaseTelex (composition-aware, error per syllable);
    // with the fallback on, the very same text is stripped of its diacritics and typed as ascii.
    const telexMode = root.dataset.inputMode === 'telex' && !!telex;
    const plain = text => (telexMode && asciiFallback && telex ? telex.toAscii(text) : text);
    const content = plain(screen.type === 'burst'
      ? ''
      : screen.source === 'weak-keys' ? weakDrillContent(screen) : String(screen.content ?? ''));
    const tokens = screen.type === 'burst'
      ? (Array.isArray(screen.tokens) && screen.tokens.length
        ? screen.tokens.map(token => plain(String(token)))
        : plain(String(screen.content || '')).split(/\s+/).filter(Boolean))
      : [];
    run = {
      type: screen.type,
      tokens, tokenIndex: 0, tokensDone: 0,
      limit: screen.type === 'burst' ? (screenSeconds(screen) || DEFAULT_BURST_SECONDS) : screenSeconds(screen),
      target: '', breaks: new Set(),
      startedAt: null, endedAt: null, seen: 0, lastKeyAt: null,
      typed: 0, correct: 0, errors: 0, keyMs: {}, timedOut: false,
      telex: telexMode && !asciiFallback, view: null, scored: []
    };
    NT?.markKeys(board, Array.isArray(screen.newKeys) && screen.newKeys.length ? screen.newKeys : (screen.newKey || ''));
    if (screen.type === 'burst') setBurstToken();
    else Object.assign(run, buildTarget(content, screen.linebreak));
    if (!run.target) { advance(); return; }
    renderTyping(screen);
    paintPrompt();
    updateLive();
    updateClock();
  }

  function setBurstToken() {
    const token = run.tokens[run.tokenIndex % run.tokens.length] || '';
    run.target = token;
    run.breaks = new Set();
    run.seen = 0;
    input.value = '';
  }

  function startRun() {
    run.startedAt = Date.now();
    if (run.limit) {
      clearInterval(clockTimer);
      clockTimer = setInterval(() => {
        updateClock();
        if (Date.now() - run.startedAt >= run.limit * 1000) { run.timedOut = true; finishTyping(); }
      }, 200);
    }
  }

  function trackKeystrokes(value) {
    const now = Date.now();
    if (value.length < run.seen) { run.seen = value.length; run.lastKeyAt = now; return; }
    const single = value.length - run.seen === 1;
    for (let position = run.seen; position < value.length; position += 1) {
      const expected = run.target[position];
      const correct = value[position] === expected;
      const elapsed = single && run.lastKeyAt ? now - run.lastKeyAt : null;
      profile?.recordKeystroke(expected, correct, elapsed);
      run.typed += 1;
      if (correct) {
        run.correct += 1;
        const key = /\s/.test(expected) ? '' : expected.toLowerCase();
        if (key && elapsed >= MIN_KEY_MS && elapsed <= MAX_KEY_MS) {
          run.keyMs[key] ||= { ms: 0, samples: 0 };
          run.keyMs[key].ms += elapsed;
          run.keyMs[key].samples += 1;
        }
      } else {
        run.errors += 1;
        noteWeakKey(expected);
      }
    }
    run.seen = value.length;
    run.lastKeyAt = now;
    if (now - lastDailyPing > 1000) { lastDailyPing = now; store.recordPracticeActivity(now); }
  }

  // Telex scoring is recomputed from the whole field on every input event rather than
  // accumulated per keystroke: the IME rewrites text that is already there ("nguyên" becomes
  // "nguyễn" when the tone key lands), so yesterday's verdict on a character is not final.
  function scoreTelex(value) {
    const view = telex.compare(value, run.target);
    run.view = view;
    run.correct = view.ok;
    run.typed = view.ok + view.bad;
    run.errors = view.badTokens;

    view.states.forEach((state, index) => {
      if (state === 'pending' || run.scored[index] === state) return;
      run.scored[index] = state;
      const expected = run.target[index];
      if (!expected || /\s/.test(expected)) return;
      const keys = telex.keysFor(expected);
      const physical = keys.length ? keys : [expected];
      physical.forEach(key => profile?.recordKeystroke(key, state === 'ok', null));
      if (state === 'bad') noteWeakKey(physical[0]);
    });

    // Three finished syllables that arrived as raw Telex ("mas" for "má") mean no IME is running.
    const typedTokens = value.split(/\s/);
    const targetTokens = run.target.split(/\s/);
    uncomposedHits = 0;
    for (let i = 0; i < typedTokens.length - 1; i += 1)
      if (telex.looksUncomposed(typedTokens[i], targetTokens[i])) uncomposedHits += 1;
    if (uncomposedHits >= 3 && !imeNoteVisible) { imeNoteVisible = true; renderNotes(); }

    const now = Date.now();
    if (now - lastDailyPing > 1000) { lastDailyPing = now; store.recordPracticeActivity(now); }
  }

  // Switch the whole lesson between "có dấu" and "không dấu" and restart the current screen.
  function setAsciiFallback(on) {
    if (asciiFallback === on) return;
    asciiFallback = on;
    imeNoteVisible = false;
    uncomposedHits = 0;
    renderNotes();
    if (state === 'typing' || state === 'screen-result') enterScreen(screenIndex);
  }

  // Feedback on the keyboard widget for the keystroke that just landed: the wanted key dips when
  // it was right, the key actually hit flashes red when it was wrong. Only a field that grew by
  // one character counts — backspace, paste and an IME rewriting earlier text say nothing about
  // a single key. In telex a character still mid-composition ("a" on the way to "ầ") is neither.
  let lastInputLength = 0;
  function reactToKeystroke(value) {
    const grew = value.length === lastInputLength + 1 || value.length === 1;
    lastInputLength = value.length;
    if (!grew || !board) return;
    const position = value.length - 1;
    const verdict = run.telex && run.view ? (run.view.states[position] || 'bad')
      : value[position] === run.target[position] ? 'ok' : 'bad';
    // Phím đầu tiên bắt đầu cho lớp màu ngón mờ dần đi, đúng như bản gốc.
    board.classList.add('nt-keyboard-peek-started');
    if (verdict === 'ok') NT.pressKey(board);
    else if (verdict === 'bad') NT.highlightErrorKey(board, value[position]);
    if (verdict !== 'pending') sound?.click(verdict);
  }

  function onInput() {
    if (state === 'intro') {
      const typed = input.value;
      input.value = '';
      if (!run.found && typed && typed.toLowerCase().includes(run.target.toLowerCase())) {
        run.found = true;
        NT?.pressKey(board);
        renderIntro(currentScreen());
      }
      return;
    }
    if (state !== 'typing' || !run) { input.value = ''; return; }
    // Ascii runs stop the field at the length of the target. A telex run leaves a little slack:
    // a typist whose IME is off produces LONGER text ("mas" for "má"), and cutting it off would
    // hide the very evidence that says the IME is off.
    const limit = run.telex ? run.target.length + 16 : run.target.length;
    if (input.value.length > limit) input.value = input.value.slice(0, limit);
    if (!run.startedAt && input.value.length) startRun();
    if (run.telex) scoreTelex(input.value); else trackKeystrokes(input.value);
    reactToKeystroke(input.value);
    if (run.type === 'burst') renderBurstToken(); else paintPrompt();
    updateLive();
    if (input.value.length < run.target.length) return;
    // A syllable still mid-composition ("ma" on the way to "má") is not a finished screen.
    if (run.telex && run.view && run.view.pending) return;
    if (run.type === 'burst') {
      const clean = run.telex && telex
        ? telex.compare(input.value, run.target).complete
        : [...input.value].every((character, position) => character === run.target[position]);
      if (clean) run.tokensDone += 1;
      run.tokenIndex += 1;
      setBurstToken();
      const tokenEl = stageEl.querySelector('#burst-token');
      if (tokenEl) { tokenEl.classList.remove('pop'); void tokenEl.offsetWidth; tokenEl.classList.add('pop'); }
      renderBurstToken();
      updateLive();
      return;
    }
    finishTyping();
  }

  function slowestKey() {
    const entries = Object.entries(run?.keyMs || {})
      .filter(([, stats]) => stats.samples >= SLOW_KEY_SAMPLES)
      .map(([key, stats]) => ({ key, mean: stats.ms / stats.samples }))
      .sort((a, b) => b.mean - a.mean);
    return entries.length && entries[0].mean >= SLOW_KEY_MS ? entries[0] : null;
  }

  function finishTyping() {
    if (state !== 'typing' || !run) return;
    clearInterval(clockTimer);
    clockTimer = null;
    run.endedAt = Date.now();
    const seconds = run.startedAt ? Math.max(1, Math.round((run.endedAt - run.startedAt) / 1000)) : 0;
    const accuracy = run.typed ? Math.round(run.correct / run.typed * 100) : 0;
    const wpm = showsWpm(run.type) && seconds ? Math.round(run.correct / 5 / (seconds / 60)) : null;
    const stars = starsFor(accuracy, lesson.minAccuracy);
    const result = {
      type: run.type, stars, maxStars: STARS, accuracy, wpm, seconds,
      errors: run.errors, tokens: run.tokensDone, slow: slowestKey()
    };
    store.recordScreen(lesson.id, screenIndex, result);
    // profile.recordAttempt only understands a numeric lesson index, so it gets the lesson's
    // position in the curriculum; the string id lives in the v3 progress store instead.
    if (isScored(run.type) && wpm != null)
      profile?.recordAttempt({
        kind: currentScreen()?.source === 'weak-keys' ? 'weak' : 'lesson',
        lesson: indexOfLesson(lesson.id), wpm, accuracy, seconds
      });
    runLog = runLog.filter(entry => entry.index !== screenIndex).concat({ index: screenIndex, ...result });
    state = 'screen-result';
    renderScreenResult(result);
    renderProgress();
  }

  // --- rendering: screens ---------------------------------------------------------------------
  // `screen.finger` is authored per screen (one of the ten codes LP LR LM LI LT / RT RI RM RR RP)
  // and wins over the key -> finger table, which cannot know which thumb the author meant.
  // One chip, one or more keys: the number row is taught two keys at a time, so a `block` screen
  // may carry `newKeys: ['4','5']` instead of a single `newKey`.
  function chipHtml(key, fingerCode) {
    const keys = (Array.isArray(key) ? key : [key]).filter(Boolean);
    if (!keys.length) return '';
    // Shift is the one key with no fixed finger: it is always the pinky of the hand that is not
    // typing the letter, so naming a side here would teach the wrong habit half the time.
    const finger = keys.length > 1 ? ''
      : keys[0] === 'shift' ? T.shiftFinger
        : (FINGER_NAMES[fingerCode] || NT?.fingerNameVi(keys[0]) || '');
    return `<p class="key-chip"><span class="chip-label">${T.newKey}</span>`
      + keys.map(one => `<b class="chip-key">${escapeHtml(keyLabel(one))}</b>`).join('')
      + (finger ? `<span class="chip-finger">${escapeHtml(finger)}</span>` : '') + '</p>';
  }

  function renderIntro(screen) {
    const key = screen.key || '';
    const body = run.found && key
      ? `<h2 class="intro-found">${T.found}</h2><p class="intro-text">${fill(T.foundBody, { key: escapeHtml(keyLabel(key)) })}</p>`
      : `<p class="intro-text">${escapeHtml(screen.text || lesson.intro || '')}</p>`;
    const hint = run.found
      ? `<p class="intro-hint">${T.enterToContinue}</p>`
      : `<p class="intro-hint">${screen.hint ? escapeHtml(screen.hint) : fill(T.pressToContinue, { key: escapeHtml(keyLabel(key)) })}</p>`;
    stageEl.className = 'player-stage is-intro';
    stageEl.innerHTML = `<section class="card intro-card">${chipHtml(key, screen.finger)}${body}${hint}</section>`;
    if (run.found) stageEl.querySelector('.intro-card').classList.add('is-found');
  }

  function renderTyping(screen) {
    const key = Array.isArray(screen.newKeys) && screen.newKeys.length
      ? screen.newKeys
      : (screen.newKey || screen.key || '');
    const clock = run.limit ? `<p class="player-clock" id="clock"></p>` : '';
    const lead = screen.text ? `<p class="screen-lead">${escapeHtml(screen.text)}</p>` : '';
    stageEl.className = `player-stage is-typing is-${screen.type}`;
    if (screen.type === 'burst') {
      stageEl.innerHTML = `${clock}${lead}<section class="card burst-card">`
        + `<p class="burst-token" id="burst-token"></p><p class="burst-next" id="burst-next"></p></section>`;
      renderBurstToken();
      return;
    }
    // `dictation` (letters | words | sentence) only changes how the text is set: wide tracking
    // for single letters, ordinary word spacing for words, a left-aligned paragraph for prose.
    const dictation = ['letters', 'words', 'sentence'].includes(screen.dictation) ? screen.dictation : '';
    stageEl.innerHTML = `${chipHtml(key, screen.finger)}${clock}${lead}`
      + `<section class="card prompt-card"><p class="prompt-lines${dictation ? ` as-${dictation}` : ''}" id="prompt-lines"></p></section>`;
  }

  function renderBurstToken() {
    const tokenEl = stageEl.querySelector('#burst-token');
    if (!tokenEl) return;
    const typed = input.value;
    tokenEl.innerHTML = [...run.target].map((character, position) => {
      const status = position < typed.length
        ? (run.telex && run.view ? (run.view.states[position] || 'bad') : (typed[position] === character ? 'ok' : 'bad'))
        : position === typed.length ? 'cur' : '';
      return `<span class="ch ${status}">${escapeHtml(character === ' ' ? '␣' : character)}</span>`;
    }).join('');
    const nextEl = stageEl.querySelector('#burst-next');
    if (nextEl) nextEl.textContent = run.tokens[(run.tokenIndex + 1) % run.tokens.length] || '';
    if (board) NT.setKeyboardState(board, nextKeyHint(typed));
  }

  function starRow(stars, max = STARS) {
    return `<p class="star-row" aria-label="${stars}/${max} sao">`
      + Array.from({ length: max }, (unused, position) =>
        `<span class="star ${position < stars ? 'is-on' : ''}">${position < stars ? '★' : '☆'}</span>`).join('')
      + '</p>';
  }

  function renderScreenResult(result) {
    const failed = result.stars === 0;
    const headline = failed
      ? fill(T.fail, { min: lesson.minAccuracy })
      : result.stars === 3 ? T.great : result.stars === 2 ? T.good : T.pass;
    const stats = [fill(T.resultAccuracy, { accuracy: result.accuracy })];
    if (result.wpm != null) stats.push(fill(T.resultWpm, { wpm: result.wpm }));
    if (result.type === 'burst') stats.push(fill(T.resultTokens, { count: result.tokens }));
    stats.push(fill(T.resultErrors, { count: result.errors }));
    const hint = result.slow
      ? fill(T.slowKey, { key: escapeHtml(keyLabel(result.slow.key)), ms: (result.slow.mean / 1000).toFixed(1).replace('.', ',') })
      : failed ? T.keepAccuracy : '';
    stageEl.className = 'player-stage is-result';
    stageEl.innerHTML = '<section class="card result-card">'
      + starRow(result.stars)
      + `<h2 class="result-headline">${headline}</h2>`
      + `<p class="result-stats">${stats.join(' · ')}</p>`
      + (hint ? `<p class="result-hint">${hint}</p>` : '')
      + '<div class="result-actions">'
      + (failed
        ? `<button class="primary-button" type="button" data-act="redo">${T.redoScreenAdvised}</button>`
          + `<button class="ghost-button" type="button" data-act="next">${T.skipScreen}</button>`
        : `<button class="primary-button" type="button" data-act="next">${T.continueEnter}</button>`
          + `<button class="ghost-button" type="button" data-act="redo">${T.redoScreen}</button>`)
      + '</div></section>';
    liveEl.textContent = '';
    if (board) NT.setKeyboardState(board, '');
    focusInput();
  }

  function renderLessonResult() {
    state = 'lesson-result';
    clearRun();
    const record = store.getLesson(lesson.id);
    const scored = runLog.filter(entry => entry.wpm != null);
    const totals = runLog.reduce((sum, entry) => ({
      seconds: sum.seconds + (entry.seconds || 0),
      typedAccuracy: sum.typedAccuracy + (entry.accuracy || 0),
      counted: sum.counted + (entry.accuracy != null ? 1 : 0)
    }), { seconds: 0, typedAccuracy: 0, counted: 0 });
    const wpm = scored.length ? Math.round(scored.reduce((sum, entry) => sum + entry.wpm, 0) / scored.length) : 0;
    const accuracy = totals.counted ? Math.round(totals.typedAccuracy / totals.counted) : 0;
    const stars = record?.stars || runLog.reduce((sum, entry) => sum + entry.stars, 0);
    const maxStars = record?.maxStars || runLog.length * STARS;
    store.completeLesson(lesson.id, { seconds: totals.seconds, wpm, accuracy });

    const unit = unitOf(lesson.id);
    if (unit) {
      const ids = unitLessonIds(unit);
      const done = ids.filter(id => store.getLesson(id)?.completedAt).length;
      if (done >= ids.length) {
        const at = unitList().findIndex(item => item.id === unit.id);
        const following = unitList()[at + 1];
        if (following) store.unlock(following.id);
      }
    }

    // keysSoFar lists physical keys AND telex tokens, and a telex lesson repeats s f r x j as
    // tone keys, so the summary is deduplicated and the tokens are shown with what they produce.
    const keys = [...new Set((lesson.keysSoFar.length ? lesson.keysSoFar : lesson.newKeys).map(String))].map(keyLabel);
    const allowed = new Set((lesson.keysSoFar.length ? lesson.keysSoFar : lesson.newKeys).map(key => String(key).toLowerCase()));
    const weak = (profile?.getWeakKeys(4) || []).filter(item => allowed.has(item.key) && item.accuracy < 100);
    const nextId = nextLessonId(lesson.id);
    const nextEntry = nextId ? indexEntry(nextId) : null;
    // Finishing a lesson moves the resume point on, so coming back to a bare /hoc/ starts the
    // next lesson rather than replaying the last screen of this one.
    if (nextId) store.setCurrent(nextId, 1);
    const unitIds = unit ? unitLessonIds(unit) : [];
    const unitDone = unitIds.filter(id => store.getLesson(id)?.completedAt).length;

    const tile = (label, value) => `<div class="stat-tile"><span>${label}</span><strong>${value}</strong></div>`;
    stageEl.className = 'player-stage is-lesson-result';
    stageEl.innerHTML = '<section class="card lesson-result-card">'
      + `<p class="lesson-done-kicker">${escapeHtml(lesson.title)} — ${T.lessonDone}</p>`
      + starRow(Math.min(STARS, Math.round(stars / Math.max(1, maxStars) * STARS)))
      + (keys.length ? `<p class="learned-keys">${fill(T.learned, { count: keys.length })} <b>${keys.map(escapeHtml).join(' ')}</b></p>` : '')
      + '<div class="stat-tiles">'
        + tile(T.statWpm, `${wpm} WPM`)
        + tile(T.statAccuracy, `${accuracy}%`)
        + tile(T.statTime, formatDuration(totals.seconds))
        + tile(T.statStars, `${stars} / ${maxStars}`)
      + '</div>'
      + (lesson.congrats ? `<p class="technique"><b>${T.technique}:</b> ${escapeHtml(lesson.congrats)}</p>` : '')
      + (weak.length
        ? `<div class="weak-block"><p class="weak-title">${T.weakTitle}</p><p class="weak-list">`
          + weak.map(item => `<span class="weak-chip"><b>${escapeHtml(keyLabel(item.key))}</b>${item.accuracy}%</span>`).join('')
          + `</p><a class="ghost-button" href="../luyen-phim-yeu/">${T.weakButton} ${weak.map(item => keyLabel(item.key)).join(', ')}</a></div>`
        : '')
      + (unit ? `<p class="unit-progress">${fill(T.unitProgress, { unit: escapeHtml(unit.title), done: unitDone, total: unitIds.length })}</p>` : '')
      + (nextId ? '' : `<p class="no-more"><b>${T.noMoreTitle}</b><br>${T.noMoreBody}</p>`)
      + '<div class="result-actions">'
      + (nextId
        ? `<button class="primary-button" type="button" data-act="next-lesson" data-lesson="${escapeHtml(nextId)}">`
          + `${fill(T.nextLesson, { title: escapeHtml(nextEntry?.title || nextId) })}</button>`
        : `<a class="primary-button" href="../">${T.finishAll}</a>`
          + `<a class="ghost-button" href="../luyen-phim-yeu/">${T.weakPage}</a>`
          + `<a class="ghost-button" href="../kiem-tra-toc-do-go/">${T.testPage}</a>`)
      + `<button class="ghost-button" type="button" data-act="redo-lesson">${T.redoLesson}</button>`
      + `<a class="ghost-button" href="../">${T.home}</a>`
      + '</div></section>';
    renderChrome();
    if (board) NT.setKeyboardState(board, '');
    NT?.markKeys(board, '');
    if (nextId) prefetch(nextId);
  }

  const formatDuration = seconds =>
    `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

  // --- navigation -----------------------------------------------------------------------------
  // Every screen change goes through the hash, and only `hashchange` acts on it. That is what
  // makes the browser Back button work: each screen is one history entry, so Back walks back
  // through the screens instead of leaving the app.
  function go(lessonId, screen) {
    const want = `${lessonId}/${screen}`;
    if (location.hash.replace(/^#/, '') === want) route();
    else location.hash = want;
  }

  function advance() {
    if (state === 'intro')
      store.recordScreen(lesson.id, screenIndex, { type: 'intro', stars: 0, maxStars: 0, accuracy: null, wpm: null, seconds: 0 });
    if (screenIndex + 1 >= screens.length) { renderLessonResult(); return; }
    go(lesson.id, screenIndex + 2);
  }

  function primaryAction() {
    if (state === 'screen-result') {
      const failed = runLog.find(entry => entry.index === screenIndex)?.stars === 0;
      if (failed) enterScreen(screenIndex); else advance();
      return;
    }
    if (state === 'lesson-result') {
      const button = stageEl.querySelector('[data-act="next-lesson"]');
      if (button) openLesson(button.dataset.lesson, 1);
      else location.href = '../';
      return;
    }
    if (state === 'intro' && run?.found) advance();
  }

  function parseHash() {
    const raw = decodeURIComponent(location.hash.replace(/^#/, '')).trim();
    if (!raw) return null;
    const [id, screen] = raw.split('/');
    if (!/^[a-z0-9-]{2,32}$/.test(id || '')) return null;
    return { lessonId: id, screen: Math.max(1, Number(screen) || 1) };
  }

  function openLesson(lessonId, screen = 1) {
    runLog = [];
    go(lessonId, screen);
  }

  async function route() {
    const target = parseHash() || store.getCurrent() || { lessonId: firstLessonId(), screen: 1 };
    // Resuming with a bare /hoc/ writes the resolved screen into the URL without adding a
    // history entry, so Back still leaves the app rather than bouncing inside it.
    if (!parseHash()) history.replaceState(null, '', `#${target.lessonId}/${target.screen}`);
    if (lesson && lesson.id === target.lessonId) {
      if (target.screen - 1 !== screenIndex || state !== 'typing') enterScreen(target.screen - 1);
      return;
    }
    if (!isReady(target.lessonId)) { renderNotReady(target.lessonId); return; }
    state = 'loading';
    stageEl.className = 'player-stage is-loading';
    stageEl.innerHTML = `<section class="card"><p class="intro-text">${T.loading}</p></section>`;
    const loaded = await loadLesson(target.lessonId);
    if (!loaded) { renderMissing(target.lessonId); return; }
    lesson = loaded.data;
    screens = lesson.screens;
    usingFixture = loaded.fixture;
    runLog = [];
    if (!screens.length) { renderMissing(target.lessonId); return; }
    enterScreen(target.screen - 1);
    renderNotes();
    prefetch(nextLessonId(lesson.id));
  }

  function renderNotReady(lessonId) {
    state = 'error';
    lesson = null;
    screens = [];
    const entry = indexEntry(lessonId);
    stageEl.className = 'player-stage is-error';
    stageEl.innerHTML = '<section class="card error-card">'
      + `<h2>${T.notReadyTitle}</h2>`
      + `<p>${fill(T.notReadyBody, { title: escapeHtml(entry?.title || lessonId) })}</p>`
      + `<p><a class="primary-button" href="#${escapeHtml(firstLessonId())}/1">${T.home === '' ? '' : 'Về bài đầu tiên'}</a>`
      + ` <a class="ghost-button" href="../">${T.home}</a></p></section>`;
    lessonEl.textContent = entry?.title || T.notReadyTitle;
    unitEl.textContent = '';
    screenEl.textContent = '';
    progressEl.innerHTML = '';
    liveEl.textContent = '';
    renderNotes();
  }

  function renderMissing(lessonId) {
    state = 'error';
    lesson = null;
    screens = [];
    stageEl.className = 'player-stage is-error';
    stageEl.innerHTML = '<section class="card error-card">'
      + `<h2>${T.missingTitle}</h2>`
      + `<p>${fill(T.missingBody, { path: `data/lessons/vi/${escapeHtml(lessonId)}.json` })}</p>`
      + (curriculum ? '' : `<p>${T.noCurriculum}</p>`)
      + `<p><a class="primary-button" href="../">${T.home}</a></p></section>`;
    lessonEl.textContent = T.missingTitle;
    unitEl.textContent = '';
    screenEl.textContent = '';
    progressEl.innerHTML = '';
    liveEl.textContent = '';
    renderNotes();
  }

  // --- pause menu -----------------------------------------------------------------------------
  function openMenu() {
    if (root.querySelector('#player-menu')) return;
    const menu = document.createElement('div');
    menu.className = 'player-menu';
    menu.id = 'player-menu';
    menu.innerHTML = `<div class="card menu-card"><h2>${T.menuTitle}</h2>`
      + `<button class="primary-button" type="button" data-menu="resume">${T.menuResume}</button>`
      + `<button class="ghost-button" type="button" data-menu="redo">${T.menuRedo}</button>`
      + `<button class="ghost-button" type="button" data-menu="skip">${T.menuSkip}</button>`
      + `<a class="ghost-button" href="../">${T.menuExit}</a></div>`;
    root.append(menu);
    menu.addEventListener('click', event => {
      const action = event.target.closest('[data-menu]')?.dataset.menu;
      if (!action && event.target !== menu) return;
      menu.remove();
      if (action === 'redo') enterScreen(screenIndex);
      if (action === 'skip') advance();
      focusInput();
    });
  }

  // --- input plumbing -------------------------------------------------------------------------
  function focusInput() {
    if (touchQuery.matches) return;
    try { input.focus({ preventScroll: true }); } catch { input.focus(); }
  }

  input.addEventListener('input', onInput);
  input.addEventListener('keydown', event => {
    // Enter is a navigation key, except on a `linebreak: "enter"` screen at the exact position
    // where the target carries a newline — there it has to reach the textarea as a character.
    if (event.key !== 'Enter') return;
    const expected = state === 'typing' && run ? run.target[input.value.length] : '';
    if (expected !== '\n') event.preventDefault();
  });
  tapEl?.addEventListener('click', () => { try { input.focus(); } catch { /* ignore */ } });
  redoEl?.addEventListener('click', () => { if (lesson) openLesson(lesson.id, 1); });

  stageEl.addEventListener('click', event => {
    const action = event.target.closest('[data-act]')?.dataset.act;
    if (action === 'next') { advance(); return; }
    if (action === 'redo') { enterScreen(screenIndex); return; }
    if (action === 'redo-lesson') { store.resetLesson(lesson.id); openLesson(lesson.id, 1); return; }
    if (action === 'next-lesson') { openLesson(event.target.closest('[data-lesson]').dataset.lesson, 1); return; }
    if (!event.target.closest('a,button')) focusInput();
  });

  document.addEventListener('keydown', event => {
    // Phím tắt phải đi kèm Alt: mọi phím trần đều là ký tự cần gõ, và Ctrl/Cmd đã thuộc về
    // trình duyệt. Alt+S / Alt+H bấm được ngay giữa lúc gõ mà không làm hỏng dòng đang dở.
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      const shortcut = String(event.key).toLowerCase();
      if (shortcut === 's') { event.preventDefault(); sound?.toggle(); syncToggles(); return; }
      if (shortcut === 'h') { event.preventDefault(); setAnimatedHands(!preferences?.animatedHands); return; }
      if (shortcut === 'r' && lesson) { event.preventDefault(); openLesson(lesson.id, 1); return; }
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    // Shift and Enter never arrive in the textarea as characters, so the intro screen that
    // teaches one waits for the key press itself instead of for typed text.
    if (state === 'intro' && run && !run.found && NAMED_INTRO_KEYS.includes(run.target)
      && String(event.key).toLowerCase() === run.target) {
      event.preventDefault();
      run.found = true;
      NT?.pressKey(board);
      renderIntro(currentScreen());
      return;
    }
    if (event.key === 'Enter') {
      if (state === 'screen-result' || state === 'lesson-result' || (state === 'intro' && run?.found)) {
        event.preventDefault();
        primaryAction();
      }
      return;
    }
    if (event.key === 'Escape' && (state === 'typing' || state === 'intro')) {
      event.preventDefault();
      openMenu();
    }
  });

  // Mỗi bàn phím giữ một WebGL context; Chrome chỉ cho 16 context một tab rồi âm thầm giết cái
  // cũ nhất. Trang này chỉ dựng một bàn phím, nhưng trả context lại khi rời trang vẫn là phép
  // lịch sự với tab kế tiếp (và với chính người học khi họ quay lại bằng nút Back).
  global.addEventListener('pagehide', () => board?.__ntHands?.destroy());
  global.addEventListener('hashchange', () => { route(); });
  wideQuery.addEventListener('change', applyViewport);
  phoneQuery.addEventListener('change', applyViewport);

  // --- boot -----------------------------------------------------------------------------------
  (async () => {
    await ensureCurriculum();
    await mountKeyboard();
    syncToggles();
    applyViewport();
    await route();
  })();

  global.TypingEasePlayer = {
    openLesson,
    getState: () => ({ state, lessonId: lesson?.id || null, screenIndex, screens: screens.length, usingFixture }),
    getRun: () => (run
      ? { type: run.type, target: run.target, typed: run.typed, correct: run.correct, errors: run.errors, found: Boolean(run.found), limit: run.limit || 0 }
      : null)
  };
})(window);
