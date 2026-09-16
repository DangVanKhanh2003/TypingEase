(function (global) {
  // The hero taster: the first thing a new visitor meets. One short line, a compact keyboard
  // and the ghost hands, wired to its own tiny engine so the lesson engine in script.js stays
  // untouched. The first keystroke is the first action — no click, no reading required.
  const host = document.querySelector('#taster');
  if (!host) return;
  // script.js has already decided which hero to show. A returning visitor gets the continue card,
  // so there is nothing to build here — and nothing should steal their focus.
  if (document.body.classList.contains('is-returning')) return;

  // The line is the starter screen of the first lesson, so it comes from the curriculum index
  // rather than being written twice (data/curriculum.vi.js → starter.content).
  const LINE = global.TypingEaseCurriculum?.starter?.content || 'jjj fff jjj fff jf fj';
  // /en/ and /ja/ keep their own speed-test page.
  const LOCALIZED = /(?:^|\/)(?:en|ja)(?:\/|$)/.test(location.pathname);
  const TEST_URL = LOCALIZED ? './typing-test/' : './kiem-tra-toc-do-go/';
  const LESSON_FALLBACK_URL = LOCALIZED ? '../hoc/' : './hoc/';
  const ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l',';'],
    ['z','x','c','v','b','n','m',',','.'],
    [' ']
  ];
  const FINGER = {q:'LP',a:'LP',z:'LP',w:'LR',s:'LR',x:'LR',e:'LM',d:'LM',c:'LM',r:'LI',f:'LI',v:'LI',t:'LI',g:'LI',b:'LI',
    y:'RI',h:'RI',n:'RI',u:'RI',j:'RI',m:'RI',i:'RM',k:'RM',',':'RM',o:'RR',l:'RR','.':'RR',p:'RP',';':'RP','/':'RP',' ':'LT'};

  const STRINGS = {
    vi: { guide: 'Đặt hai ngón trỏ lên <b>F</b> và <b>J</b> — hai phím có gờ nổi — rồi gõ chữ đang sáng.',
      guideTouch: 'Thử gõ dòng dưới đây. Gõ 10 ngón cần bàn phím máy tính — hãy mở lại trang này trên máy để học đầy đủ.',
      tap: 'Chạm để gõ thử', skip: 'Tôi đã biết gõ 10 ngón →', progress: 'Chính xác {accuracy}%',
      done: '✓ {accuracy}% chính xác · {wpm} WPM · {seconds} giây', again: '↻ Gõ lại',
      ctaBeginner: '▶ Bắt đầu Bài 1 · Hàng phím cơ sở', ctaMid: '▶ Bắt đầu Bài 1',
      ctaFast: '▶ Kiểm tra 60 giây để xếp lớp', hintMid: 'Bạn gõ khá rồi — có thể bỏ qua vài bài đầu.',
      hintFast: 'Hoặc học lại từ Bài 1.', enter: '(Enter)' },
    en: { guide: 'Rest your index fingers on <b>F</b> and <b>J</b> — the two keys with bumps — then type the highlighted letter.',
      guideTouch: 'Give the line below a try. Touch typing needs a real keyboard — open this page on a computer to learn it properly.',
      tap: 'Tap to try typing', skip: 'I already touch type →', progress: '{accuracy}% accurate',
      done: '✓ {accuracy}% accurate · {wpm} WPM · {seconds}s', again: '↻ Type it again',
      ctaBeginner: '▶ Start Lesson 1 · Home row', ctaMid: '▶ Start Lesson 1',
      ctaFast: '▶ Take the 60-second test', hintMid: 'You type well already — you can skip the first lessons.',
      hintFast: 'Or start from Lesson 1.', enter: '(Enter)' },
    ja: { guide: '<b>F</b> と <b>J</b>（突起のあるキー）に人差し指を置き、光っている文字を打ちましょう。',
      guideTouch: '下の行を打ってみましょう。タッチタイピングには物理キーボードが必要なので、できればパソコンで開いてください。',
      tap: 'タップして入力', skip: 'すでにタッチタイピングできます →', progress: '正確率 {accuracy}%',
      done: '✓ 正確率 {accuracy}% · {wpm} WPM · {seconds} 秒', again: '↻ もう一度',
      ctaBeginner: '▶ レッスン 1 を始める · ホームポジション', ctaMid: '▶ レッスン 1 を始める',
      ctaFast: '▶ 60秒テストでレベル判定', hintMid: 'すでに上手です — 最初の数レッスンは飛ばせます。',
      hintFast: 'またはレッスン 1 から。', enter: '(Enter)' }
  };
  const FALLBACK = { zh: 'en', ru: 'en', pt: 'en', 'pt-BR': 'en', ar: 'en', ms: 'en' };
  let language = document.documentElement.lang || 'vi';
  const strings = () => STRINGS[language] || STRINGS[FALLBACK[language] || 'en'];
  const format = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

  host.innerHTML = '<p class="taster-guide" id="taster-guide"></p>'
    + '<p class="taster-line" id="taster-line" aria-label="Dòng gõ thử"></p>'
    + '<label class="sr-only" for="taster-input">Gõ dòng trên</label>'
    + '<textarea class="taster-input" id="taster-input" rows="1" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>'
    + '<div class="taster-board keyboard-demo" id="taster-board"><div class="keyboard tc-board" id="taster-keyboard"></div></div>'
    + `<button class="taster-tap" id="taster-tap" type="button"></button>`
    + '<div class="taster-foot"><p class="taster-status" id="taster-status"></p>'
    + `<a class="taster-skip" id="taster-skip" href="${TEST_URL}"></a></div>`
    + '<div class="taster-done" id="taster-done" hidden><p class="taster-result" id="taster-result"></p>'
    + '<div class="taster-cta"><button class="primary-button" id="taster-cta" type="button"></button>'
    + '<button class="taster-again" id="taster-again" type="button"></button></div>'
    + '<p class="taster-hint" id="taster-hint"></p></div>';

  const board = host.querySelector('#taster-board'), keyboard = host.querySelector('#taster-keyboard');
  const lineEl = host.querySelector('#taster-line'), input = host.querySelector('#taster-input');
  const statusEl = host.querySelector('#taster-status'), doneEl = host.querySelector('#taster-done');
  const resultEl = host.querySelector('#taster-result'), ctaEl = host.querySelector('#taster-cta');
  const hintEl = host.querySelector('#taster-hint'), againEl = host.querySelector('#taster-again');
  const guideEl = host.querySelector('#taster-guide'), skipEl = host.querySelector('#taster-skip');
  const tapEl = host.querySelector('#taster-tap');

  ROWS.forEach(row => {
    const line = document.createElement('div');
    line.className = 'key-row';
    row.forEach(label => {
      const key = document.createElement('span');
      key.className = `key${label === ' ' ? ' space' : ''}${label === 'f' || label === 'j' ? ' home' : ''}`;
      key.dataset.tkey = label;
      key.style.flex = label === ' ' ? '1 1 336px' : '1 1 50px';
      const text = document.createElement('span');
      text.className = 'key-label';
      text.textContent = label === ' ' ? '' : label;
      key.append(text);
      line.append(key);
    });
    keyboard.append(line);
  });

  let startedAt = null, finished = false, tier = 'beginner', points = new Map();

  function keyBox(origin, key) {
    const element = keyboard.querySelector(`.key[data-tkey="${key}"]`);
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { x: box.left + box.width / 2 - origin.left, y: box.top + box.height / 2 - origin.top, w: box.width, h: box.height };
  }

  function drawHands() {
    if (!global.TypingEaseHands) return;
    const origin = board.getBoundingClientRect(), home = {};
    for (const key of ['a','s','d','f','j','k','l',';']) { const found = keyBox(origin, key); if (!found) return; home[key] = found; }
    const space = keyBox(origin, ' ');
    if (!space || !origin.width) return;
    board.querySelector('.hand-layer')?.remove();
    board.insertAdjacentHTML('beforeend', global.TypingEaseHands.markup({
      width: origin.width, height: origin.height, keyW: home.f.w, keyH: home.f.h, home,
      space: { x: space.x - space.w / 2, y: space.y, w: space.w }
    }));
    points = new Map();
    keyboard.querySelectorAll('.key[data-tkey]').forEach(key => {
      const box = key.getBoundingClientRect();
      points.set(key.dataset.tkey, [box.left + box.width / 2 - origin.left, box.top + box.height / 2 - origin.top]);
    });
    highlight(LINE[input.value.length]);
  }

  // Swing the active finger round its knuckle, the same trick the lesson keyboard uses.
  function reach(target) {
    const point = points.get(target);
    board.querySelectorAll('.hand-layer .finger').forEach(group => {
      const knuckle = [Number(group.dataset.kx), Number(group.dataset.ky)];
      const rest = [Number(group.dataset.rx), Number(group.dataset.ry)];
      const resting = !point || target === group.dataset.key || !group.classList.contains('active-finger');
      if (resting || !Number.isFinite(rest[0])) { group.style.transform = ''; return; }
      const restAngle = Math.atan2(rest[1] - knuckle[1], rest[0] - knuckle[0]);
      const reachAngle = Math.atan2(point[1] - knuckle[1], point[0] - knuckle[0]);
      const stretch = Math.hypot(point[0] - knuckle[0], point[1] - knuckle[1]) - Math.hypot(rest[0] - knuckle[0], rest[1] - knuckle[1]);
      group.style.transform = `translate(${(Math.cos(reachAngle) * stretch).toFixed(1)}px, ${(Math.sin(reachAngle) * stretch).toFixed(1)}px)`
        + ` rotate(${((reachAngle - restAngle) * 180 / Math.PI).toFixed(1)}deg)`;
    });
  }

  function highlight(char) {
    const target = (char || '').toLowerCase();
    board.querySelectorAll('.active-key,.active-finger').forEach(el => el.classList.remove('active-key','active-finger'));
    if (!target) { reach(''); return; }
    keyboard.querySelector(`.key[data-tkey="${target}"]`)?.classList.add('active-key');
    const finger = FINGER[target];
    if (finger) board.querySelector(`[data-finger="${finger}"]`)?.classList.add('active-finger');
    reach(target);
  }

  // Re-run a one-shot CSS animation: drop the class, force a reflow, add it back, clear it later.
  // Timers live in a WeakMap: a dataset key such as `is-animatingTimer` is rejected by the
  // browser (hyphen followed by a lower-case letter), which would throw on every correct key.
  const pulseTimers = new WeakMap();
  function pulse(element, className, ms) {
    if (!element) return;
    element.classList.remove(className);
    void element.getBoundingClientRect();
    element.classList.add(className);
    const timers = pulseTimers.get(element) || {};
    clearTimeout(timers[className]);
    timers[className] = setTimeout(() => element.classList.remove(className), ms);
    pulseTimers.set(element, timers);
  }

  // Right key: the wanted key dips and the finger on it jabs down. Wrong key: the key that was
  // actually hit flashes red (typing.com's keyPressDefault / keyRejected).
  function press() {
    pulse(keyboard.querySelector('.key.active-key'), 'is-animating', 250);
    pulse(board.querySelector('.hand-layer .finger.active-finger'), 'pressing', 240);
  }
  function reject(char) {
    const id = (char || '').toLowerCase();
    if (!id) return;
    pulse(keyboard.querySelector(`.key[data-tkey="${id}"]`), 'is-wrong', 250);
  }
  let lastInputLength = 0;
  function reactToKeystroke(typed) {
    const grew = typed.length === lastInputLength + 1 || typed.length === 1;
    lastInputLength = typed.length;
    if (!grew) return;
    const position = typed.length - 1;
    if (typed[position] === LINE[position]) press(); else reject(typed[position]);
  }

  function paint() {
    const typed = input.value;
    lineEl.innerHTML = [...LINE].map((char, index) => {
      const state = index < typed.length ? (typed[index] === char ? 'ok' : 'wrong') : index === typed.length ? 'current' : '';
      return `<span class="${state}">${char === ' ' ? '&nbsp;' : char}</span>`;
    }).join('');
    highlight(LINE[typed.length]);
  }

  function grade() {
    const typed = input.value;
    const correct = [...typed].filter((char, index) => char === LINE[index]).length;
    const accuracy = typed.length ? Math.round(correct / typed.length * 100) : 100;
    const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const wpm = Math.max(1, Math.round(correct / 5 / (seconds / 60)));
    return { accuracy, seconds, wpm };
  }

  function finish() {
    finished = true;
    const { accuracy, seconds, wpm } = grade();
    tier = wpm > 45 && accuracy >= 95 ? 'fast' : wpm >= 25 && accuracy >= 90 ? 'mid' : 'beginner';
    const s = strings();
    resultEl.textContent = format(s.done, { accuracy, wpm, seconds });
    ctaEl.textContent = `${tier === 'fast' ? s.ctaFast : tier === 'mid' ? s.ctaMid : s.ctaBeginner}  ${s.enter}`;
    hintEl.textContent = tier === 'fast' ? s.hintFast : tier === 'mid' ? s.hintMid : '';
    hintEl.hidden = tier === 'beginner';
    againEl.textContent = s.again;
    doneEl.hidden = false;
    host.classList.add('is-finished');
    input.blur();
    global.TypingEaseProfile?.recordAttempt({ kind: 'free', lesson: null, wpm, accuracy, seconds });
  }

  // CTA sau khi gõ xong. Người gõ nhanh đi thẳng sang bài kiểm tra để xếp lớp; còn lại vào
  // player. Dòng vừa gõ CHÍNH LÀ một screen của bài đầu tiên, nên script.js ghi công screen đó
  // rồi mở đúng screen kế tiếp (/hoc/#u1-l01/7) — không bắt gõ lại từ đầu.
  function act() {
    if (tier === 'fast') { location.href = TEST_URL; return; }
    const home = global.TypingEaseHome;
    if (home?.startFromTaster) { home.startFromTaster(grade()); return; }
    location.href = LESSON_FALLBACK_URL;
  }

  function restart() {
    finished = false;
    startedAt = null;
    input.value = '';
    doneEl.hidden = true;
    host.classList.remove('is-finished');
    paint();
    input.focus();
  }

  function localize() {
    const s = strings();
    guideEl.innerHTML = (host.classList.contains('is-touch') && s.guideTouch) || s.guide;
    skipEl.textContent = s.skip;
    tapEl.textContent = s.tap;
    if (!finished) statusEl.textContent = '';
    else { const { accuracy } = grade(); statusEl.textContent = format(s.progress, { accuracy }); }
  }

  input.addEventListener('input', () => {
    if (finished) { input.value = input.value.slice(0, LINE.length); return; }
    if (!startedAt && input.value.length) startedAt = Date.now();
    if (input.value.length > LINE.length) input.value = input.value.slice(0, LINE.length);
    // Judge the keystroke before repainting: paint() moves the highlight on to the next key, and
    // the dip belongs to the key that was just typed.
    reactToKeystroke(input.value);
    paint();
    const { accuracy } = grade();
    statusEl.textContent = input.value.length ? format(strings().progress, { accuracy }) : '';
    if (input.value.length >= LINE.length) finish();
  });
  input.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault(); });
  ctaEl.addEventListener('click', act);
  againEl.addEventListener('click', restart);
  tapEl.addEventListener('click', () => input.focus());
  host.addEventListener('click', event => { if (!finished && !event.target.closest('a,button')) input.focus(); });
  document.addEventListener('typingease:language', event => { language = event.detail.language; localize(); });
  // Once the line is done the CTA carries an "(Enter)" label, so Enter has to actually work.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!finished || !host.classList.contains('is-finished')) return;
    const active = document.activeElement;
    if (active && active !== document.body && active.closest('input,select,a,button')) return;
    event.preventDefault();
    act();
  });

  let resizeTimer = null;
  global.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawHands, 120); });

  // A touch device has no physical keyboard to rest fingers on, so ask for the tap instead of
  // stealing focus and shoving the on-screen keyboard over the page on load.
  const touchOnly = global.matchMedia?.('(hover: none)').matches;
  host.classList.toggle('is-touch', !!touchOnly);
  localize();  // runs after is-touch so the guide picks the touch wording
  paint();
  drawHands();
  if (!touchOnly) input.focus({ preventScroll: true });

  global.TypingEaseTaster = { restart, tier: () => tier, act };
})(window);
