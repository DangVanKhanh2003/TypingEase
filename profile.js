(function (global) {
  const STORAGE_KEY = 'typingease-profile-v1';
  const MAX_ATTEMPTS = 120, KEY_SAMPLE_FLOOR = 12, HEAT_SAMPLE_FLOOR = 6, WEAK_ACCURACY_LIMIT = 92, REVIEW_ACCURACY_LIMIT = 90;
  const MIN_KEYSTROKE_MS = 40, MAX_KEYSTROKE_MS = 2500, WEAK_DRILL_SPACING = 3, RECENT_WINDOW = 10, WPM_CEILING = 250, ACCURACY_BAR = 95;
  const LEVELS = [['starter', 0], ['building', 20], ['steady', 35], ['fast', 50], ['pro', 70]];
  const KINDS = ['lesson', 'weak', 'free'];

  function sanitizeAttempt(value) {
    if (!value || typeof value !== 'object') return null;
    const at = Number(value.at), wpm = Number(value.wpm), accuracy = Number(value.accuracy), seconds = Number(value.seconds);
    if (!Number.isFinite(at) || !Number.isFinite(wpm) || !Number.isFinite(accuracy)) return null;
    return {
      at, kind: KINDS.includes(value.kind) ? value.kind : 'lesson',
      lesson: Number.isInteger(value.lesson) && value.lesson >= 0 ? value.lesson : null,
      wpm: Math.min(WPM_CEILING, Math.max(0, Math.round(wpm))), accuracy: Math.min(100, Math.max(0, Math.round(accuracy))),
      seconds: Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0
    };
  }

  function sanitizeKeys(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.entries(value).reduce((keys, [key, stats]) => {
      const hits = Number(stats?.hits), misses = Number(stats?.misses), ms = Number(stats?.ms), samples = Number(stats?.samples);
      if (typeof key === 'string' && key.length === 1 && Number.isFinite(hits) && Number.isFinite(misses) && hits + misses > 0)
        keys[key] = { hits: Math.max(0, hits), misses: Math.max(0, misses), ms: Number.isFinite(ms) ? Math.max(0, ms) : 0, samples: Number.isFinite(samples) ? Math.max(0, samples) : 0 };
      return keys;
    }, {});
  }

  let state = { attempts: [], keys: {} }, dirty = false;

  function load(storage = global.localStorage) {
    try { const raw = JSON.parse(storage.getItem(STORAGE_KEY)); state = { attempts: (Array.isArray(raw?.attempts) ? raw.attempts : []).map(sanitizeAttempt).filter(Boolean).slice(-MAX_ATTEMPTS), keys: sanitizeKeys(raw?.keys) }; }
    catch { state = { attempts: [], keys: {} }; }
    dirty = false;
    return state;
  }
  function save(storage = global.localStorage) { if (!dirty) return; try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); dirty = false; } catch { /* storage blocked or full */ } }
  function reset(storage = global.localStorage) { state = { attempts: [], keys: {} }; dirty = false; try { storage.removeItem(STORAGE_KEY); } catch { /* storage blocked */ } }

  const normalizeKey = character => !character || character === '\n' || /\s/.test(character) ? '' : character.toLocaleLowerCase();

  function recordKeystroke(target, correct, elapsedMs) {
    const key = normalizeKey(target);
    if (!key) return;
    const stats = state.keys[key] ||= { hits: 0, misses: 0, ms: 0, samples: 0 };
    if (correct) stats.hits += 1; else stats.misses += 1;
    dirty = true;
    const ms = Number(elapsedMs);
    if (correct && Number.isFinite(ms) && ms >= MIN_KEYSTROKE_MS && ms <= MAX_KEYSTROKE_MS) { stats.ms += ms; stats.samples += 1; }
  }

  function recordAttempt(entry) {
    const attempt = sanitizeAttempt({ at: Date.now(), ...entry });
    if (!attempt) return null;
    state.attempts.push(attempt);
    dirty = true;
    if (state.attempts.length > MAX_ATTEMPTS) state.attempts = state.attempts.slice(-MAX_ATTEMPTS);
    save();
    return attempt;
  }

  const median = values => { if (!values.length) return 0; const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2); };
  const recentAttempts = (limit = RECENT_WINDOW) => state.attempts.slice(-limit);

  function getKeyStats() {
    return Object.entries(state.keys).map(([key, stats]) => {
      const attempts = stats.hits + stats.misses;
      return { key, attempts, misses: stats.misses, accuracy: Math.round(stats.hits / attempts * 100), meanMs: stats.samples ? Math.round(stats.ms / stats.samples) : null };
    }).sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts || a.key.localeCompare(b.key));
  }

  function getWeakKeys(limit = 3) {
    const ranked = getKeyStats().filter(item => item.accuracy < 100);
    const reliable = ranked.filter(item => item.attempts >= KEY_SAMPLE_FLOOR);
    return (reliable.length ? reliable : ranked).slice(0, limit);
  }

  function getSkill() {
    const recent = recentAttempts();
    if (!recent.length) return { level: 0, levelId: LEVELS[0][0], wpm: 0, accuracy: 0, effectiveWpm: 0, samples: 0, sessions: 0 };
    const wpm = median(recent.map(item => item.wpm)), accuracy = Math.round(recent.reduce((total, item) => total + item.accuracy, 0) / recent.length);
    const effectiveWpm = Math.round(wpm * Math.min(1, accuracy / ACCURACY_BAR) ** 2);
    let level = 0;
    LEVELS.forEach(([, floor], index) => { if (effectiveWpm >= floor) level = index; });
    return { level, levelId: LEVELS[level][0], wpm, accuracy, effectiveWpm, samples: recent.length, sessions: state.attempts.length };
  }

  function getTargets() {
    const skill = getSkill(), topFloor = LEVELS[LEVELS.length - 1][1];
    const wpm = skill.effectiveWpm >= topFloor ? Math.ceil((skill.wpm + 5) / 5) * 5 : LEVELS[Math.min(skill.level + 1, LEVELS.length - 1)][1];
    return { wpm, accuracy: Math.min(98, Math.max(90, skill.accuracy + 2)) };
  }

  const getTrend = (limit = 14) => recentAttempts(limit).map(item => ({ at: item.at, wpm: item.wpm, accuracy: item.accuracy, kind: item.kind }));
  const attemptsSince = kind => { const index = state.attempts.map(item => item.kind).lastIndexOf(kind); return index === -1 ? state.attempts.length : state.attempts.length - index - 1; };

  function recommendNext({ lessonRecords = {}, lessonCount = 0, currentIndex = 0 } = {}) {
    const lastIndex = Math.max(0, lessonCount - 1), safeCurrent = Math.min(Math.max(0, currentIndex), lastIndex);
    if (!state.attempts.length) return { mode: 'start', lesson: safeCurrent, keys: [] };
    const completed = Object.keys(lessonRecords).map(Number).filter(index => Number.isInteger(index) && index >= 0 && index < lessonCount);
    const targets = getTargets();
    const weak = getWeakKeys(3).filter(item => item.attempts >= KEY_SAMPLE_FLOOR && item.accuracy < WEAK_ACCURACY_LIMIT);
    if (weak.length && attemptsSince('weak') >= WEAK_DRILL_SPACING) return { mode: 'weak', lesson: safeCurrent, keys: weak.map(item => item.key) };
    const lastRun = state.attempts.filter(item => item.kind === 'lesson' && item.lesson === safeCurrent).pop();
    if (lastRun && lastRun.accuracy < targets.accuracy) return { mode: 'repeat', lesson: safeCurrent, keys: [] };
    const shaky = completed.filter(index => lessonRecords[index].accuracy < REVIEW_ACCURACY_LIMIT).sort((a, b) => lessonRecords[a].accuracy - lessonRecords[b].accuracy || a - b);
    if (shaky.length) return { mode: 'review', lesson: shaky[0], keys: [] };
    return { mode: 'next', lesson: Math.min((completed.length ? Math.max(...completed) : -1) + 1, lastIndex), keys: [] };
  }

  global.TypingEaseProfile = {
    STORAGE_KEY, HEAT_SAMPLE_FLOOR, KEY_SAMPLE_FLOOR,
    levels: LEVELS.map(([id, floor]) => ({ id, floor })),
    load, save, reset, recordKeystroke, recordAttempt,
    getKeyStats, getWeakKeys, getSkill, getTargets, getTrend, recommendNext,
    getState: () => state
  };
  load();
})(window);
