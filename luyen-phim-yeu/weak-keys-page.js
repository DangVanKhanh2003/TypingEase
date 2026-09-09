(() => {
  const tools = window.TypingEaseWeakKeys;
  const empty = document.querySelector('#weak-empty'), data = document.querySelector('#weak-data'), drillBox = document.querySelector('#weak-drill');
  const status = document.querySelector('#weak-status'), keyList = document.querySelector('#weak-key-list'), startButton = document.querySelector('#start-weak-drill');
  const prompt = document.querySelector('#weak-prompt'), input = document.querySelector('#weak-input'), feedback = document.querySelector('#weak-feedback');
  const liveMetrics = document.querySelector('#weak-live-metrics'), result = document.querySelector('#weak-result'), resultMetrics = document.querySelector('#weak-result-metrics');
  let records = {}, topKeys = [], drill = '', startedAt = null, completed = false, timerId = null;
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[character]);
  const seconds = () => startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) : 0;
  const formatTime = value => `${String(Math.floor(value / 60)).padStart(2,'0')}:${String(value % 60).padStart(2,'0')}`;
  const metrics = () => {
    const typed = input.value, correct = [...typed].filter((character, index) => character === drill[index]).length, elapsed = seconds();
    return { correct, errors: Math.max(0, typed.length - correct), elapsed, wpm: elapsed ? Math.round((correct / 5) / (elapsed / 60)) : 0, accuracy: typed.length ? Math.round(correct / typed.length * 100) : 0 };
  };
  const metricsHtml = value => [['WPM', value.wpm], ['Chính xác', `${value.accuracy}%`], ['Lỗi', value.errors], ['Thời gian', formatTime(value.elapsed)]].map(([label, number]) => `<div class="weak-metric"><span>${label}</span><b>${number}</b></div>`).join('');
  function drawPrompt() {
    const typed = input.value;
    prompt.innerHTML = [...drill].map((character, index) => {
      const state = index < typed.length ? (typed[index] === character ? 'correct' : 'incorrect') : (index === typed.length ? 'current' : '');
      // Dấu cách giữ nguyên (CSS đã có white-space:pre-wrap); dùng &nbsp; sẽ khiến chữ hiển thị
      // khác chữ cần gõ và chặn ngắt dòng ở khoảng trắng.
      return `<span class="${state}">${escapeHtml(character)}</span>`;
    }).join('');
  }
  function renderStates() {
    records = tools.loadRecords(); topKeys = tools.getTopWeakKeys(records);
    const hasKeys = topKeys.length > 0;
    empty.hidden = hasKeys; data.hidden = !hasKeys; drillBox.hidden = true; result.hidden = true;
    if (!hasKeys) { status.textContent = 'Chưa có dữ liệu phím yếu hợp lệ trên thiết bị này.'; return; }
    keyList.innerHTML = topKeys.map(([key, count]) => `<span class="weak-key"><b>${escapeHtml(key.toUpperCase())}</b><span>${count} lỗi</span></span>`).join('');
    status.textContent = 'Bài luyện sẽ ưu tiên các phím có nhiều lỗi hơn.';
  }
  function startDrill() {
    records = tools.loadRecords(); topKeys = tools.getTopWeakKeys(records);
    if (!topKeys.length) { renderStates(); return; }
    drill = tools.buildWeakPractice(topKeys.map(([key]) => key), records);
    startedAt = null; completed = false; clearInterval(timerId); input.value = ''; data.hidden = true; drillBox.hidden = false; result.hidden = true;
    liveMetrics.innerHTML = metricsHtml(metrics()); feedback.textContent = 'Bắt đầu gõ để xem WPM, độ chính xác và số lỗi.'; drawPrompt(); input.focus();
  }
  function finish() {
    if (completed) return;
    completed = true; clearInterval(timerId); input.disabled = true;
    const value = metrics(); resultMetrics.innerHTML = metricsHtml(value); result.hidden = false;
    feedback.textContent = `Hoàn thành: ${value.accuracy}% chính xác trong ${formatTime(value.elapsed)}.`; status.textContent = 'Kết quả được tính từ bài luyện vừa hoàn thành.';
  }
  input.addEventListener('input', () => {
    if (completed) return;
    if (!startedAt && input.value) { startedAt = Date.now(); timerId = setInterval(() => { liveMetrics.innerHTML = metricsHtml(metrics()); }, 1000); }
    drawPrompt(); const value = metrics(); liveMetrics.innerHTML = metricsHtml(value);
    feedback.textContent = value.errors ? `Bạn đang có ${value.errors} ký tự chưa khớp. Tiếp tục đến hết bài để xem kết quả.` : 'Nhịp gõ đang chính xác.';
    if (input.value.length >= drill.length) finish();
  });
  document.querySelector('#retry-weak-drill').addEventListener('click', () => { input.disabled = false; startDrill(); });
  startButton.addEventListener('click', startDrill);
  renderStates();
})();
