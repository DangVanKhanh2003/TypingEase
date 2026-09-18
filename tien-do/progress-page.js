(function (global) {
  // Trang tiến độ: mọi thứ trước đây chen chúc trên trang chủ (bảng thành tích, heatmap phím,
  // coach + biểu đồ, streak, mục tiêu ngày) sống ở đây. Dữ liệu đến từ ba chỗ:
  //   - TypingEaseProgress  : tiến độ 35 bài (typingease-progress-v3) + mục tiêu ngày
  //   - TypingEaseProfile   : per-key accuracy, level, trend, gợi ý
  //   - TypingEaseCurriculum: tên bài, số screen
  const store = global.TypingEaseProgress;
  const profile = global.TypingEaseProfile;
  const curriculum = global.TypingEaseCurriculum;
  if (!store || !profile || !curriculum) return;

  const sequence = curriculum.sequence || [];
  const entry = id => curriculum.lessons[id] || null;
  const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const LEVELS = ['Mới bắt đầu', 'Đang lên tay', 'Ổn định', 'Nhanh', 'Thành thạo'];
  const DAILY_KEY = 'typingease-daily-goal-v1';

  const screensDone = id => Object.keys(store.getLesson(id)?.screens || {}).length;
  const isDone = id => {
    const lesson = store.getLesson(id);
    if (!lesson) return false;
    const total = entry(id)?.screens || 0;
    return Boolean(lesson.completedAt) || (total > 0 && screensDone(id) >= total);
  };
  const unitOf = id => curriculum.units.find(unit => unit.groups.some(group => group.lessons.includes(id)));

  // --- tổng quan -------------------------------------------------------------------------------
  function renderSummary() {
    const done = sequence.filter(isDone).length;
    const stars = sequence.reduce((total, id) => total + (store.getLesson(id)?.stars || 0), 0);
    const maxStars = sequence.reduce((total, id) => total + (store.getLesson(id)?.maxStars || 0), 0);
    const bestWpm = Math.max(0, ...sequence.map(id => store.getLesson(id)?.bestWpm || 0));
    const bestAccuracy = Math.max(0, ...sequence.map(id => store.getLesson(id)?.bestAccuracy || 0));
    document.querySelector('#sum-lessons').textContent = `${done} / ${sequence.length}`;
    document.querySelector('#sum-stars').textContent = maxStars ? `${stars} / ${maxStars}` : '0';
    document.querySelector('#sum-wpm').textContent = `${bestWpm} WPM`;
    document.querySelector('#sum-accuracy').textContent = bestAccuracy ? `${bestAccuracy}%` : '--%';

    const legacy = store.legacyCompleted();
    const legacyEl = document.querySelector('#prog-legacy');
    // Quyết định 5: 30 bài cũ và 35 bài mới không map 1-1, nên chỉ giữ con số.
    legacyEl.hidden = legacy === 0;
    if (legacy > 0)
      legacyEl.textContent = `Đã hoàn thành ${legacy} bài ở giáo trình cũ. Giáo trình mới có cấu trúc khác`
        + ' nên tiến độ không chuyển sang từng bài được — bù lại Unit 1 và Unit 2 đã mở sẵn cho bạn.';
  }

  // --- bảng 35 bài -----------------------------------------------------------------------------
  function renderTable() {
    const body = document.querySelector('#results-body');
    body.innerHTML = sequence.map((id, index) => {
      const info = entry(id);
      if (!info) return '';
      const lesson = store.getLesson(id);
      const unit = unitOf(id);
      const total = info.screens || 0;
      const doneScreens = screensDone(id);
      const stars = lesson && lesson.maxStars > 0 ? '★'.repeat(Math.min(3, Math.round(lesson.stars / lesson.maxStars * 3))) : '';
      const cell = value => (value ? `<td>${value}</td>` : '<td class="empty">--</td>');
      return `<tr class="${info.ready ? '' : 'is-soon'}">`
        + `<td><span class="rt-lesson">${String(index + 1).padStart(2, '0')} · ${escapeHtml(info.title)}</span>`
        + `<span class="rt-unit">Unit ${unit ? unit.index : '?'}${info.ready ? '' : ' · sắp có'}</span></td>`
        + cell(doneScreens ? `${doneScreens}/${total}` : '')
        + (stars ? `<td class="rt-stars">${stars}</td>` : '<td class="empty">--</td>')
        + cell(lesson?.bestWpm ? `${lesson.bestWpm} WPM` : '')
        + cell(lesson?.bestAccuracy ? `${lesson.bestAccuracy}%` : '')
        + '</tr>';
    }).join('');
  }

  // --- coach -----------------------------------------------------------------------------------
  function renderTrend(trend) {
    const chart = document.querySelector('#coach-trend');
    const hint = document.querySelector('#coach-trend-hint');
    const enough = trend.length >= 2;
    // SVGElement không có IDL `hidden`, phải đặt/bỏ attribute bằng tay (DECISIONS.md cạm bẫy 1).
    chart.toggleAttribute('hidden', !enough);
    document.querySelector('#coach').classList.toggle('has-trend', enough);
    hint.hidden = enough;
    hint.textContent = enough ? '' : `Cần thêm ${2 - trend.length} bài nữa để vẽ biểu đồ tiến bộ.`;
    if (!enough) { chart.innerHTML = ''; return; }
    const values = trend.map(item => item.wpm);
    const highest = Math.max(...values), lowest = Math.min(...values), span = Math.max(1, highest - lowest);
    const points = values.map((value, index) => [8 + index * (184 / (values.length - 1)), 44 - (value - lowest) / span * 32]);
    const [lastX, lastY] = points[points.length - 1];
    chart.innerHTML = '<line x1="8" y1="45" x2="192" y2="45" stroke="#e4efe9" />'
      + `<polyline points="${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" />`
      + `<circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3" />`;
  }

  function renderCoach() {
    const skill = profile.getSkill(), targets = profile.getTargets();
    document.querySelector('#coach-level').textContent = LEVELS[skill.level] || LEVELS[0];
    document.querySelector('#strip-level').textContent = `Trình độ: ${LEVELS[skill.level] || LEVELS[0]}`;
    document.querySelector('#coach-stats').innerHTML = [
      ['WPM gần đây', skill.samples ? String(skill.wpm) : '--'],
      ['Chính xác', skill.samples ? `${skill.accuracy}%` : '--'],
      ['Lượt luyện', String(skill.sessions)]
    ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('');
    document.querySelector('#coach-target').innerHTML = skill.samples
      ? `Mục tiêu kế tiếp: <b>${targets.wpm}</b> WPM · <b>${targets.accuracy}</b>% chính xác` : '';
    const weak = profile.getWeakKeys(3).filter(item => item.attempts >= profile.KEY_SAMPLE_FLOOR);
    document.querySelector('#coach-keys').innerHTML = weak
      .map(item => `<span class="coach-key"><b>${escapeHtml(item.key.toUpperCase())}</b>`
        + `<span>${item.accuracy}%${item.meanMs ? ` · ${item.meanMs}ms` : ''}</span></span>`).join('');

    const advice = document.querySelector('#coach-advice'), action = document.querySelector('#coach-action');
    if (!skill.samples) {
      advice.textContent = 'Hãy gõ một bài để hệ thống hiểu trình độ của bạn.';
      action.textContent = 'Bắt đầu bài đầu tiên →';
      action.href = `../hoc/#${sequence[0]}/1`;
    } else if (weak.length) {
      advice.textContent = `Phím ${weak.map(item => item.key.toUpperCase()).join(', ')} đang kéo bạn xuống — luyện riêng một phút sẽ đỡ hơn nhiều.`;
      action.textContent = `Luyện phím ${weak.map(item => item.key.toUpperCase()).join(', ')} →`;
      action.href = '../luyen-phim-yeu/';
    } else {
      const current = store.getCurrent();
      const nextId = current && entry(current.lessonId) && !isDone(current.lessonId)
        ? current.lessonId : sequence.find(id => entry(id)?.ready && !isDone(id));
      advice.textContent = 'Bạn đang tiến đều — cứ giữ nhịp mỗi ngày một bài.';
      if (nextId) {
        const screen = current && current.lessonId === nextId ? current.screen : 1;
        action.textContent = `Học bài ${sequence.indexOf(nextId) + 1} · ${entry(nextId).title} →`;
        action.href = `../hoc/#${nextId}/${screen}`;
      } else {
        action.textContent = 'Kiểm tra tốc độ →';
        action.href = '../kiem-tra-toc-do-go/';
      }
    }
    renderTrend(profile.getTrend(14));
  }

  // --- heatmap ---------------------------------------------------------------------------------
  // Bàn phím của typekute (window.NTKeyboard). Trang này KHÔNG bật bàn tay: tay che đúng những
  // phím mà người xem đang muốn đọc màu, và KHÔNG có lớp nhá màu ngón — màu ở đây là độ chính
  // xác, hai thứ màu chồng lên nhau thì không đọc được cái nào.
  let NT = null;
  let board = null;
  let heatPending = null;

  function mountHeatKeyboard() {
    if (heatPending) return heatPending;
    const host = document.querySelector('#heat-board');
    if (!host) return null;
    heatPending = global.NTKeyboardReady.then(api => {
      NT = api;
      if (!NT) throw new Error('module bàn phím không nạp được');
      return NT.ready;
    }).then(layout => {
      const holder = document.createElement('div');
      holder.className = 'cell js-keyboard-holder well';
      board = NT.createKeyboard({
        activeKey: '',
        preferences: { ...NT.loadKeyboardPreferences(), showHands: false, showKeyboard: true },
        layout,
        onSettings: () => NT.openSettingsFor(board, {
          root: host,
          // Người học có thể bật bàn tay trong Cài đặt; trang này vẫn giữ tay tắt (xem ghi chú
          // ở trên), lựa chọn của họ có hiệu lực ở /hoc/ và /luyen-tu-do/.
          onSave: (next) => { NT.applyKeyboardPreferences(board, { ...next, showHands: false }); renderHeat(); }
        })
      });
      holder.append(board);
      host.replaceChildren(holder);
      renderHeat();
    }).catch(error => { console.warn('[tiến độ] bàn phím không tải được', error); });
    return heatPending;
  }

  function renderHeat() {
    if (!board) { mountHeatKeyboard(); return; }
    const stats = profile.getKeyStats();
    let measured = false;
    board.querySelectorAll('.key[data-heat]').forEach(key => { delete key.dataset.heat; key.removeAttribute('title'); });
    stats.forEach(stat => {
      if (stat.attempts < profile.HEAT_SAMPLE_FLOOR) return;
      const key = NT.keyElementFor(board, stat.key);
      if (!key) return;
      key.dataset.heat = stat.accuracy >= 97 ? 'strong' : stat.accuracy >= 90 ? 'fair' : 'weak';
      key.title = `${stat.accuracy}%${stat.meanMs ? ` · ${stat.meanMs}ms` : ''}`;
      measured = true;
    });
    const legend = document.querySelector('#heat-legend');
    legend.hidden = !measured;
    legend.innerHTML = measured
      ? '<span>Độ chính xác từng phím</span>'
        + [['strong', 'Chắc'], ['fair', 'Chập chờn'], ['weak', 'Cần luyện']]
          .map(([level, label]) => `<span><i data-heat="${level}"></i>${label}</span>`).join('')
      : '';
    document.querySelector('#heat-empty').hidden = measured;
  }

  // --- huy hiệu --------------------------------------------------------------------------------
  // Huy hiệu không có kho riêng: `badges.evaluate()` đọc lại chính ba nguồn ở trên rồi so với
  // bảng luật trong badges.js, nên nó luôn khớp với các con số hiện trên trang này.
  const formatNumber = value => value.toLocaleString('vi-VN');
  const formatDate = at => {
    const date = new Date(at);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  function renderBadges() {
    const badges = global.TypingEaseBadges;
    const grid = document.querySelector('#badge-grid');
    if (!badges || !grid) return;
    const list = badges.evaluate({ store, profile, curriculum });
    document.querySelector('#badges-count').textContent = `${list.filter(item => item.earned).length} / ${list.length}`;
    grid.innerHTML = list.map(badge => {
      const meta = badge.earned
        ? `<span class="badge-meta">Mở khoá ${badge.at ? formatDate(badge.at) : 'rồi'}</span>`
        : `<span class="badge-track" style="--badge-progress:${badge.percent}%"><i></i></span>`
          + `<span class="badge-meta">${formatNumber(badge.value)} / ${formatNumber(badge.target)}</span>`;
      return `<li class="badge${badge.earned ? ' is-earned' : ''}" data-badge="${escapeHtml(badge.id)}">`
        + `<span class="badge-icon" aria-hidden="true">${badge.icon}</span>`
        + `<span class="badge-body"><b>${escapeHtml(badge.title)}</b>`
        + `<span class="badge-hint">${escapeHtml(badge.hint)}</span>${meta}</span></li>`;
    }).join('');
  }

  // --- mục tiêu ngày ---------------------------------------------------------------------------
  function renderDaily() {
    const daily = store.loadDaily();
    const key = new Date();
    const dayKey = `${key.getFullYear()}-${String(key.getMonth() + 1).padStart(2, '0')}-${String(key.getDate()).padStart(2, '0')}`;
    const day = daily.days[dayKey] || { practiceSeconds: 0 };
    const minutes = Math.floor(day.practiceSeconds / 60);
    const ratio = Math.min(100, day.practiceSeconds / (daily.goalMinutes * 60) * 100);
    document.querySelector('#daily-goal-title').textContent = `${minutes} / ${daily.goalMinutes} phút`;
    document.querySelector('#daily-goal-status').textContent = `🔥 ${daily.currentStreak} ngày liên tục`;
    document.querySelector('#daily-best-streak').textContent = `Kỷ lục: ${daily.bestStreak} ngày`;
    const track = document.querySelector('#daily-progress');
    track.style.setProperty('--daily-progress', `${ratio}%`);
    track.setAttribute('aria-valuemax', String(daily.goalMinutes));
    track.setAttribute('aria-valuenow', String(Math.min(daily.goalMinutes, minutes)));
    document.querySelectorAll('[data-daily-goal]').forEach(button => {
      const selected = Number(button.dataset.dailyGoal) === daily.goalMinutes;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelector('#strip-streak').textContent = `🔥 ${daily.currentStreak} ngày liên tục`;
    document.querySelector('#strip-today').textContent = `Hôm nay ${minutes} phút`;
  }

  document.querySelectorAll('[data-daily-goal]').forEach(button => button.addEventListener('click', () => {
    const daily = store.loadDaily();
    daily.goalMinutes = Number(button.dataset.dailyGoal);
    try { localStorage.setItem(DAILY_KEY, JSON.stringify(daily)); } catch { /* storage blocked */ }
    renderDaily();
  }));

  document.querySelector('#clear-results').addEventListener('click', () => {
    if (!confirm('Xoá toàn bộ tiến độ và thành tích trên thiết bị này?')) return;
    store.reset();
    profile.reset();
    // Streak và mục tiêu ngày cũng là "thành tích trên thiết bị này" — giữ lại chúng sau khi
    // người dùng bấm xoá sẽ để lại huy hiệu chuỗi ngày đứng trơ một mình, không còn gì đỡ.
    try { localStorage.removeItem(store.LEGACY_KEY); localStorage.removeItem(DAILY_KEY); } catch { /* storage blocked */ }
    renderSummary(); renderTable(); renderCoach(); renderHeat(); renderDaily(); renderBadges();
  });

  let resizeTimer = null;
  global.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderHeat();
    }, 150);
  });
  global.addEventListener('pagehide', () => profile.save());

  renderSummary();
  renderTable();
  renderCoach();
  renderHeat();
  renderDaily();
  renderBadges();
})(window);
