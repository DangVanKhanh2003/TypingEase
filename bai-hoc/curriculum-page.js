(function (global) {
  // Trang lộ trình: HTML của 35 bài đã có sẵn (sinh bằng generate.mjs), script này chỉ PHỦ
  // trạng thái lên — bài đã xong, sao, bài đang dở, tiến độ unit, khoá mềm. Nếu localStorage
  // trống thì trang vẫn đọc được nguyên vẹn, đó là lý do danh sách không dựng bằng JS.
  const curriculum = global.TypingEaseCurriculum;
  const store = global.TypingEaseProgress;
  if (!curriculum || !store) return;

  const sequence = curriculum.sequence || [];
  const entry = id => curriculum.lessons[id] || null;
  const isReady = id => Boolean(entry(id)?.ready);
  const stars = (won, max) => (max > 0 ? '★'.repeat(Math.min(3, Math.round(won / max * 3))) : '');

  function screensDone(id) {
    const lesson = store.getLesson(id);
    return lesson ? Object.keys(lesson.screens).length : 0;
  }

  const isDone = id => {
    const lesson = store.getLesson(id);
    if (!lesson) return false;
    const total = entry(id)?.screens || 0;
    return Boolean(lesson.completedAt) || (total > 0 && screensDone(id) >= total);
  };

  // Bài "đang dở" ưu tiên `current` của store; nếu chưa có thì là bài ready đầu tiên chưa xong.
  function resolveCurrent() {
    const saved = store.getCurrent();
    if (saved && entry(saved.lessonId) && !isDone(saved.lessonId))
      return { lessonId: saved.lessonId, screen: saved.screen };
    const next = sequence.find(id => isReady(id) && !isDone(id));
    return next ? { lessonId: next, screen: 1 } : null;
  }

  const current = resolveCurrent();
  const doneIds = sequence.filter(isDone);

  // --- đầu trang -------------------------------------------------------------------------------
  const totalStars = sequence.reduce((total, id) => total + (store.getLesson(id)?.stars || 0), 0);
  const maxStars = sequence.reduce((total, id) => total + (store.getLesson(id)?.maxStars || 0), 0);
  const countEl = document.querySelector('#cur-count');
  if (countEl)
    countEl.textContent = `Đã xong ${doneIds.length}/${sequence.length} bài`
      + (maxStars > 0 ? ` · ${totalStars}★/${maxStars}` : '');

  const legacy = store.legacyCompleted();
  const legacyEl = document.querySelector('#cur-legacy');
  if (legacyEl && legacy > 0) {
    // Quyết định 5: không map 1-1 sang giáo trình mới, chỉ nói thẳng con số.
    legacyEl.textContent = `Đã hoàn thành ${legacy} bài ở giáo trình cũ — Unit 1 và Unit 2 đã mở cho bạn.`;
    legacyEl.hidden = false;
  }

  const cta = document.querySelector('#cur-continue');
  if (cta && current) {
    const number = sequence.indexOf(current.lessonId) + 1;
    // "Tiếp tục" khi đã có bất kỳ dấu vết nào — kể cả một screen giữa bài chưa xong. Chỉ người
    // hoàn toàn mới mới thấy "Bắt đầu".
    const started = doneIds.length > 0 || current.screen > 1 || screensDone(current.lessonId) > 0;
    cta.href = `../hoc/#${current.lessonId}/${current.screen}`;
    cta.innerHTML = `${started ? '▶ Tiếp tục' : '▶ Bắt đầu'} Bài ${number} · ${escapeHtml(entry(current.lessonId).title)} <span>→</span>`;
  } else if (cta && !current) {
    cta.href = '../luyen-phim-yeu/';
    cta.innerHTML = 'Bạn đã xong hết phần có nội dung — luyện phím yếu <span>→</span>';
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // --- từng bài --------------------------------------------------------------------------------
  document.querySelectorAll('.lesson-row[data-lesson]').forEach(row => {
    const id = row.dataset.lesson;
    const lesson = store.getLesson(id);
    const starsEl = row.querySelector('[data-stars]');
    const stateEl = row.querySelector('[data-state]');
    const done = isDone(id);
    row.classList.toggle('is-done', done);
    const active = Boolean(current && current.lessonId === id);
    row.classList.toggle('is-current', active);
    if (starsEl && lesson && lesson.maxStars > 0) starsEl.textContent = stars(lesson.stars, lesson.maxStars);
    if (!stateEl) return;
    if (!isReady(id)) return;                    // giữ nhãn "Sắp có" của HTML tĩnh
    if (active) {
      const total = entry(id)?.screens || 0;
      stateEl.textContent = current.screen > 1 && total > 1
        ? `▶ Tiếp tục · screen ${current.screen}/${total}`
        : '▶ Bắt đầu';
      const link = row.querySelector('a');
      if (link) link.href = `../hoc/#${id}/${current.screen}`;
    } else if (done) {
      stateEl.textContent = '✓ Đã xong';
    } else {
      stateEl.textContent = '';
    }
  });

  // --- từng unit -------------------------------------------------------------------------------
  curriculum.units.forEach(unit => {
    const ids = unit.groups.flatMap(group => group.lessons);
    const card = document.querySelector(`.unit-card[data-unit="${unit.id}"]`);
    const done = ids.filter(isDone).length;
    const ratio = ids.length ? Math.round(done / ids.length * 100) : 0;
    const side = document.querySelector(`[data-side-count="${unit.id}"]`);
    if (side) side.textContent = `${done}/${ids.length}`;
    if (!card) return;
    const count = card.querySelector('[data-unit-count]');
    if (count) count.textContent = `${done}/${ids.length}`;
    const track = card.querySelector('[data-unit-track]');
    if (track) track.style.setProperty('--unit-progress', `${ratio}%`);
    const unlocked = store.isUnlocked(unit.id);
    card.classList.toggle('is-locked', !unlocked);
    const lock = card.querySelector('[data-lock]');
    if (lock) lock.textContent = unlocked ? 'Đã mở' : `Mở sau khi xong Bài ${sequence.indexOf(unit.unlockAfter) + 1}`;
    // Khoá unit là khoá MỀM (DECISIONS.md): người biết gõ luôn mở sớm được, không ai bị chặn.
    // Nhưng chỉ mời mở sớm khi trong unit đã có ít nhất một bài gõ được — mở một unit rỗng
    // thì cũng chẳng vào được bài nào.
    const hasContent = ids.some(isReady);
    if (!unlocked && hasContent && !card.querySelector('.unit-open')) {
      const wrap = document.createElement('p');
      wrap.className = 'unit-open';
      wrap.innerHTML = '<button type="button">Mở sớm unit này</button>';
      wrap.querySelector('button').addEventListener('click', () => {
        store.unlock(unit.id);
        location.reload();
      });
      card.querySelector('[data-unit-track]')?.after(wrap);
    }
  });
})(window);
