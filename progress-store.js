(function (global) {
  // Lesson progress for the 35-lesson curriculum, keyed by string lesson id ("u1-l04").
  // Separate from the old `goxanh-lesson-records-v2` (30 lessons, numeric index): the two
  // curricula do not line up lesson-for-lesson, so the old store is read once for a headline
  // count and an unlock, then left exactly where it is (see DECISIONS.md decision 5).
  const KEY = 'typingease-progress-v3';
  const LEGACY_KEY = 'goxanh-lesson-records-v2';
  const DAILY_KEY = 'typingease-daily-goal-v1';
  const DAILY_IDLE_MS = 45000, DAILY_HISTORY_DAYS = 90, GOAL_CHOICES = [5, 10, 15, 20];
  const STARS_PER_SCREEN = 3;

  const isId = value => typeof value === 'string' && /^[a-z0-9-]{2,32}$/.test(value);
  const clampInt = (value, min, max, fallback = min) => {
    const number = Math.round(Number(value));
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  };
  const read = (storage, key) => { try { return JSON.parse(storage.getItem(key)); } catch { return null; } };

  function sanitizeScreen(value) {
    if (!value || typeof value !== 'object') return null;
    return {
      stars: clampInt(value.stars, 0, STARS_PER_SCREEN, 0),
      maxStars: clampInt(value.maxStars, 0, STARS_PER_SCREEN, STARS_PER_SCREEN),
      wpm: value.wpm == null || !Number.isFinite(Number(value.wpm)) ? null : clampInt(value.wpm, 0, 400, 0),
      accuracy: value.accuracy == null || !Number.isFinite(Number(value.accuracy)) ? null : clampInt(value.accuracy, 0, 100, 0),
      seconds: clampInt(value.seconds, 0, 60 * 60, 0),
      type: typeof value.type === 'string' ? value.type.slice(0, 16) : '',
      at: clampInt(value.at, 0, Number.MAX_SAFE_INTEGER, 0)
    };
  }

  function sanitizeLesson(value) {
    if (!value || typeof value !== 'object') return null;
    const screens = {};
    if (value.screens && typeof value.screens === 'object')
      Object.entries(value.screens).forEach(([index, screen]) => {
        const clean = sanitizeScreen(screen);
        if (clean && /^\d{1,3}$/.test(index)) screens[index] = clean;
      });
    return {
      screens,
      stars: clampInt(value.stars, 0, 999, 0),
      maxStars: clampInt(value.maxStars, 0, 999, 0),
      bestWpm: clampInt(value.bestWpm, 0, 400, 0),
      bestAccuracy: clampInt(value.bestAccuracy, 0, 100, 0),
      seconds: clampInt(value.seconds, 0, 60 * 60 * 10, 0),
      attempts: clampInt(value.attempts, 0, 9999, 0),
      completedAt: value.completedAt ? clampInt(value.completedAt, 0, Number.MAX_SAFE_INTEGER, 0) : null
    };
  }

  function blank() {
    return { version: 3, current: null, lessons: {}, unlocked: ['u1'], legacyCompleted: 0, migratedAt: null };
  }

  function sanitizeState(raw) {
    const state = blank();
    if (!raw || typeof raw !== 'object') return state;
    if (raw.current && isId(raw.current.lessonId))
      state.current = { lessonId: raw.current.lessonId, screen: clampInt(raw.current.screen, 1, 999, 1) };
    if (raw.lessons && typeof raw.lessons === 'object')
      Object.entries(raw.lessons).forEach(([id, lesson]) => {
        const clean = sanitizeLesson(lesson);
        if (clean && isId(id)) state.lessons[id] = clean;
      });
    const unlocked = (Array.isArray(raw.unlocked) ? raw.unlocked : []).filter(isId);
    state.unlocked = [...new Set(['u1', ...unlocked])];
    state.legacyCompleted = clampInt(raw.legacyCompleted, 0, 999, 0);
    state.migratedAt = raw.migratedAt ? clampInt(raw.migratedAt, 0, Number.MAX_SAFE_INTEGER, 0) : null;
    return state;
  }

  let state = blank(), storageRef = null;

  const storage = () => storageRef || (storageRef = global.localStorage);

  function save() {
    try { storage().setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked or full */ }
  }

  // The old curriculum had 30 lessons under numeric keys. We keep the record where it is and
  // only carry across two facts: how many lessons the visitor finished, and the fact that a
  // returning visitor should not be walled out of the first two units.
  function migrate() {
    const legacy = read(storage(), LEGACY_KEY);
    const done = legacy && typeof legacy === 'object' && !Array.isArray(legacy)
      ? Object.keys(legacy).filter(key => /^\d{1,2}$/.test(key) && Number(key) < 30).length : 0;
    state.legacyCompleted = done;
    state.migratedAt = Date.now();
    if (done > 0) state.unlocked = [...new Set([...state.unlocked, 'u1', 'u2'])];
    save();
    return done;
  }

  function load() {
    const raw = read(storage(), KEY);
    state = sanitizeState(raw);
    if (!raw) migrate();
    return state;
  }

  const getLesson = lessonId => state.lessons[lessonId] || null;

  function ensureLesson(lessonId) {
    return state.lessons[lessonId] ||= sanitizeLesson({});
  }

  function setCurrent(lessonId, screen) {
    if (!isId(lessonId)) return;
    state.current = { lessonId, screen: clampInt(screen, 1, 999, 1) };
    save();
  }

  const getCurrent = () => (state.current ? { ...state.current } : null);

  // One screen finished. `index` is zero-based; the best result for that screen wins so a
  // replay can only improve the tally.
  function recordScreen(lessonId, index, result = {}) {
    const lesson = ensureLesson(lessonId);
    const key = String(clampInt(index, 0, 999, 0));
    const next = sanitizeScreen({ ...result, at: Date.now() });
    const previous = lesson.screens[key];
    lesson.screens[key] = previous && previous.stars > next.stars
      ? { ...next, stars: previous.stars, maxStars: Math.max(previous.maxStars, next.maxStars) }
      : next;
    const screens = Object.values(lesson.screens);
    lesson.stars = screens.reduce((total, screen) => total + screen.stars, 0);
    lesson.maxStars = screens.reduce((total, screen) => total + screen.maxStars, 0);
    lesson.bestWpm = Math.max(lesson.bestWpm, next.wpm || 0);
    lesson.bestAccuracy = Math.max(lesson.bestAccuracy, next.accuracy || 0);
    save();
    return lesson.screens[key];
  }

  function completeLesson(lessonId, { seconds = 0, wpm = 0, accuracy = 0 } = {}) {
    const lesson = ensureLesson(lessonId);
    lesson.attempts += 1;
    lesson.completedAt = Date.now();
    lesson.seconds = clampInt(seconds, 0, 60 * 60 * 10, 0);
    lesson.bestWpm = Math.max(lesson.bestWpm, clampInt(wpm, 0, 400, 0));
    lesson.bestAccuracy = Math.max(lesson.bestAccuracy, clampInt(accuracy, 0, 100, 0));
    save();
    return lesson;
  }

  function resetLesson(lessonId) {
    delete state.lessons[lessonId];
    save();
  }

  const isUnlocked = unitId => state.unlocked.includes(unitId);
  function unlock(unitId) {
    if (!isId(unitId) || state.unlocked.includes(unitId)) return;
    state.unlocked.push(unitId);
    save();
  }

  function reset() {
    state = blank();
    try { storage().removeItem(KEY); } catch { /* storage blocked */ }
    migrate();
  }

  // --- daily goal, shared with the homepage -------------------------------------------------
  // Same key and same shape as script.js so a lesson done in the player still feeds the
  // streak and the "minutes today" strip on the homepage.
  const dateKey = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dayBefore = key => {
    const [year, month, day] = key.split('-').map(Number);
    return dateKey(new Date(year, month - 1, day - 1));
  };

  function loadDaily() {
    const raw = read(storage(), DAILY_KEY) || {};
    return {
      goalMinutes: GOAL_CHOICES.includes(raw.goalMinutes) ? raw.goalMinutes : 10,
      days: raw.days && typeof raw.days === 'object' ? raw.days : {},
      currentStreak: Number(raw.currentStreak) || 0,
      bestStreak: Number(raw.bestStreak) || 0,
      lastCompletedDate: typeof raw.lastCompletedDate === 'string' ? raw.lastCompletedDate : ''
    };
  }

  let lastActivityAt = null;

  function recordPracticeActivity(now = Date.now()) {
    const daily = loadDaily(), key = dateKey(new Date(now));
    daily.days[key] ||= { practiceSeconds: 0, goalCompleted: false };
    if (lastActivityAt && now - lastActivityAt <= DAILY_IDLE_MS)
      daily.days[key].practiceSeconds += (now - lastActivityAt) / 1000;
    lastActivityAt = now;
    const day = daily.days[key];
    if (day && !day.goalCompleted && day.practiceSeconds >= daily.goalMinutes * 60) {
      day.goalCompleted = true;
      if (daily.lastCompletedDate !== key) {
        daily.currentStreak = daily.lastCompletedDate === dayBefore(key) ? daily.currentStreak + 1 : 1;
        daily.lastCompletedDate = key;
        daily.bestStreak = Math.max(daily.bestStreak, daily.currentStreak);
      }
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DAILY_HISTORY_DAYS);
    const cutoffKey = dateKey(cutoff);
    Object.keys(daily.days).forEach(day => { if (day < cutoffKey) delete daily.days[day]; });
    try { storage().setItem(DAILY_KEY, JSON.stringify(daily)); } catch { /* storage blocked */ }
    return daily;
  }

  global.TypingEaseProgress = {
    KEY, LEGACY_KEY, STARS_PER_SCREEN,
    load, save, reset,
    getState: () => state,
    getCurrent, setCurrent,
    getLesson, recordScreen, completeLesson, resetLesson,
    isUnlocked, unlock,
    legacyCompleted: () => state.legacyCompleted,
    loadDaily, recordPracticeActivity
  };
  load();
})(window);
