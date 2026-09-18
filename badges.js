(function (global) {
  // Huy hiệu (PLAN.md phase 5). Mỗi huy hiệu là một danh sách luật `{field, operand, value}`;
  // đạt đủ MỌI luật thì mở khoá. Không có trạng thái riêng nào được tính toán ở đây: các trường
  // đều suy ra từ ba nguồn đã có (TypingEaseProgress, TypingEaseProfile, mục tiêu ngày), nên
  // xoá lịch sử ở /tien-do/ là huy hiệu tự mất theo, không cần dọn thêm.
  // Thứ duy nhất được lưu là NGÀY mở khoá lần đầu — số liệu gốc không nhớ nổi mốc đó.
  const KEY = 'typingease-badges-v1';

  const OPERANDS = {
    gte: (actual, value) => actual >= value,
    lte: (actual, value) => actual <= value,
    eq: (actual, value) => actual === value
  };

  // `hint` là câu mô tả điều kiện, hiện cả khi chưa đạt — người dùng phải biết mình đang đi tới đâu.
  // `field` của luật ĐẦU TIÊN là thanh tiến trình hiển thị cho huy hiệu đó.
  const LIST = [
    { id: 'first-step', icon: '🌱', title: 'Bước đầu tiên', hint: 'Hoàn thành bài học đầu tiên.',
      rules: [{ field: 'lessons', operand: 'gte', value: 1 }] },
    { id: 'unit-1', icon: '🏁', title: 'Xong Unit 1', hint: 'Hoàn thành trọn vẹn một unit.',
      rules: [{ field: 'units', operand: 'gte', value: 1 }] },
    { id: 'stars-30', icon: '⭐', title: '30 sao', hint: 'Thu 30 sao trong giáo trình.',
      rules: [{ field: 'stars', operand: 'gte', value: 30 }] },
    { id: 'stars-90', icon: '🌟', title: '90 sao', hint: 'Thu 90 sao trong giáo trình.',
      rules: [{ field: 'stars', operand: 'gte', value: 90 }] },
    { id: 'streak-3', icon: '🔥', title: '3 ngày liên tục', hint: 'Đạt mục tiêu ngày ba hôm liền.',
      rules: [{ field: 'streak', operand: 'gte', value: 3 }] },
    { id: 'streak-7', icon: '🗓️', title: 'Trọn một tuần', hint: 'Đạt mục tiêu ngày bảy hôm liền.',
      rules: [{ field: 'streak', operand: 'gte', value: 7 }] },
    { id: 'clean-40', icon: '🚀', title: '40 WPM sạch', hint: 'Một lượt đạt 40 WPM với độ chính xác từ 95%.',
      rules: [{ field: 'cleanWpm', operand: 'gte', value: 40 }] },
    { id: 'clean-60', icon: '⚡', title: '60 WPM sạch', hint: 'Một lượt đạt 60 WPM với độ chính xác từ 95%.',
      rules: [{ field: 'cleanWpm', operand: 'gte', value: 60 }] },
    { id: 'typed-5000', icon: '⌨️', title: '5.000 phím', hint: 'Gõ tổng cộng 5.000 phím.',
      rules: [{ field: 'typed', operand: 'gte', value: 5000 }] },
    { id: 'telex', icon: '✍️', title: 'Gõ được dấu', hint: 'Hoàn thành một bài tiếng Việt có dấu (Unit 3).',
      rules: [{ field: 'telexLessons', operand: 'gte', value: 1 }] }
  ];

  // --- các trường đo được ------------------------------------------------------------------
  function collect({ store, profile, curriculum } = {}) {
    const zero = { lessons: 0, units: 0, telexLessons: 0, stars: 0, streak: 0, cleanWpm: 0, typed: 0 };
    if (!store || !profile || !curriculum) return zero;
    const sequence = curriculum.sequence || [];
    const screensDone = id => Object.keys(store.getLesson(id)?.screens || {}).length;
    const isDone = id => {
      const lesson = store.getLesson(id);
      if (!lesson) return false;
      const total = curriculum.lessons[id]?.screens || 0;
      return Boolean(lesson.completedAt) || (total > 0 && screensDone(id) >= total);
    };
    // Unit coi là xong khi mọi bài ĐÃ CÓ NỘI DUNG của nó xong — bài `ready:false` không chặn.
    const units = (curriculum.units || []).filter(unit => {
      const ids = unit.groups.flatMap(group => group.lessons).filter(id => curriculum.lessons[id]?.ready);
      return ids.length > 0 && ids.every(isDone);
    }).length;
    const attempts = profile.getState().attempts || [];
    const keys = profile.getState().keys || {};
    return {
      lessons: sequence.filter(isDone).length,
      units,
      telexLessons: sequence.filter(id => id.startsWith('u3-') && isDone(id)).length,
      stars: sequence.reduce((total, id) => total + (store.getLesson(id)?.stars || 0), 0),
      streak: store.loadDaily().bestStreak || 0,
      // "Sạch" = nhanh VÀ chính xác trong cùng một lượt; ghép max(wpm) với max(accuracy) của hai
      // lượt khác nhau sẽ tặng huy hiệu cho thứ chưa ai làm được.
      cleanWpm: Math.max(0, ...attempts.filter(item => item.accuracy >= 95).map(item => item.wpm)),
      typed: Object.values(keys).reduce((total, stats) => total + stats.hits + stats.misses, 0)
    };
  }

  // --- ngày mở khoá ------------------------------------------------------------------------
  const read = () => {
    try {
      const raw = JSON.parse(global.localStorage.getItem(KEY));
      return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    } catch { return {}; }
  };
  const write = value => { try { global.localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* storage blocked */ } };

  // Đánh giá + ghi mốc mở khoá lần đầu. Huy hiệu mất đi (xoá lịch sử) thì mốc cũng bị gỡ, nên
  // lần tới đạt lại sẽ là một mốc mới — đúng với cảm nhận của người dùng.
  function evaluate(sources = {}) {
    const fields = collect(sources);
    const earnedAt = read();
    let changed = false;
    const badges = LIST.map(badge => {
      const earned = badge.rules.every(rule => (OPERANDS[rule.operand] || OPERANDS.gte)(fields[rule.field] || 0, rule.value));
      if (earned && !earnedAt[badge.id]) { earnedAt[badge.id] = Date.now(); changed = true; }
      if (!earned && earnedAt[badge.id]) { delete earnedAt[badge.id]; changed = true; }
      const [primary] = badge.rules;
      const actual = fields[primary.field] || 0;
      return {
        ...badge, earned, at: earnedAt[badge.id] || null,
        value: actual, target: primary.value,
        percent: Math.min(100, Math.round(Math.min(actual, primary.value) / primary.value * 100))
      };
    });
    if (changed) write(earnedAt);
    return badges;
  }

  // Danh sách id đã có mốc mở khoá. Player dùng nó làm ảnh chụp "trước": huy hiệu nào `earned`
  // sau lượt gõ mà chưa nằm trong ảnh này là vừa mở — kể cả khi nó đạt từ phiên trước nhưng
  // người dùng chưa từng ghé /tien-do/ để thấy, vì lúc đó mốc cũng chưa được ghi.
  const earnedIds = () => Object.keys(read());

  global.TypingEaseBadges = { KEY, LIST, collect, evaluate, earnedIds, reset: () => write({}) };
})(window);
