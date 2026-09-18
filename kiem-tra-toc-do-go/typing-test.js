const routeLanguage = /^\/ja(?:\/|$)/.test(location.pathname) ? 'ja' : (/^\/en(?:\/|$)/.test(location.pathname) ? 'en' : '');
if (routeLanguage) document.documentElement.lang = routeLanguage;
const testLanguage = routeLanguage || document.documentElement.lang;
const isEnglish = testLanguage === 'en';
const isJapanese = testLanguage === 'ja';
const passage = (isEnglish || isJapanese)
  ? 'Touch typing is a skill built through calm, consistent practice. Keep your eyes on the screen, return your fingers to the home row, and focus on each accurate keystroke. As the movements become familiar, your speed can improve naturally and reliably.'
  : 'Gõ mười ngón là một kỹ năng được xây dựng từ những lần luyện tập bình tĩnh và đều đặn. Hãy giữ mắt trên màn hình, đặt các ngón tay về hàng phím cơ sở và ưu tiên từng ký tự chính xác. Khi thao tác trở nên quen thuộc, tốc độ của bạn sẽ cải thiện một cách tự nhiên và bền vững.';
const text = (vietnamese, english) => {
  if (!isJapanese) return isEnglish ? english : vietnamese;
  if (/^-second typing test$/.test(english.replace(/^\d+/, ''))) return english.replace(/^(\d+)-second typing test$/, '$1秒タイピングテスト');
  if (english === 'Same as your previous result.') return '前回と同じ結果です。';
  if (english.startsWith('Time is up. Result:')) return english.replace(/^Time is up\. Result: (\d+) WPM, (.+?)% accuracy, (\d+) errors\.$/, '時間です。結果：$1 WPM、正確率 $2%、ミス $3 件。');
  if (english === 'Calculating your result in real time.') return '入力中の結果をリアルタイムで計算しています。';
  if (english === 'Ready when you are.') return '入力を開始してください。';
  if (english === 'Not enough data yet. Complete a few tests to see your progress.') return 'まだ十分なデータがありません。テストを完了すると、ここに進捗が表示されます。';
  if (english === 'No progress data yet.') return '進捗データはまだありません。';
  if (english === 'No data is available for this metric.') return 'この指標のデータはまだありません。';
  if (english === 'There is no suitable data to draw this chart.') return 'グラフを表示するためのデータが不足しています。';
  if (english === 'Not enough data to calculate a trend.') return '傾向を計算するためのデータが不足しています。';
  if (english === 'No change from the start of this period.') return '期間の開始時点から変化はありません。';
  if (english.includes('from your previous result')) return english.replace(/^(\+?-?\d+) WPM from your previous result\.$/, '前回より $1 WPM');
  if (english.includes('from the start of this period')) return english.replace(/^(\+?-?\d+) (.+) from the start of this period\.$/, '期間開始時より $1 $2');
  if (english.includes('tests in the last')) return english.replace(/^(\d+) tests in the last (\d+) days\. Average WPM (.+), average accuracy (.+)%\.$/, '過去 $2 日間のテストは $1 回。平均 WPM は $3、平均正確率は $4% です。');
  return english === '% Accuracy' ? '正確率' : english;
};
const HISTORY_KEY = 'typingease-speed-test-history-v1';
const durations = [15, 30, 60, 120];
const promptElement = document.querySelector('#test-prompt');
const input = document.querySelector('#typing-input');
const timeElement = document.querySelector('#time-left');
const wpmElement = document.querySelector('#wpm');
const accuracyElement = document.querySelector('#accuracy');
const errorsElement = document.querySelector('#errors');
const consistencyElement = document.querySelector('#consistency');
const messageElement = document.querySelector('#test-message');
const titleElement = document.querySelector('#test-title');
const restartButton = document.querySelector('#restart');
const durationButtons = [...document.querySelectorAll('[data-duration]')];
const resultElement = document.querySelector('#test-result');
const resultWpm = document.querySelector('#result-wpm');
const resultAccuracy = document.querySelector('#result-accuracy');
const resultErrors = document.querySelector('#result-errors');
const resultConsistency = document.querySelector('#result-consistency');
const comparisonElement = document.querySelector('#result-comparison');
const progressRangeButtons = [...document.querySelectorAll('[data-progress-range]')];
const progressMetricButtons = [...document.querySelectorAll('[data-progress-metric]')];
const progressEmpty = document.querySelector('#progress-empty');
const progressChartWrap = document.querySelector('#progress-chart-wrap');
const progressChart = document.querySelector('#progress-chart');
const progressTrend = document.querySelector('#progress-trend');
const progressSummaryText = document.querySelector('#progress-summary-text');
const progressAverageWpm = document.querySelector('#progress-average-wpm');
const progressBestWpm = document.querySelector('#progress-best-wpm');
const progressAverageAccuracy = document.querySelector('#progress-average-accuracy');
const progressTestCount = document.querySelector('#progress-test-count');
let selectedDuration = 60;
let startedAt = null;
let timer = null;
let finished = false;
let wpmSamples = [];
let lastSampleSecond = 0;
let testHistory = loadHistory();
let progressRange = 7;
let progressMetric = 'wpm';

// Âm click — cùng công tắc với player và trang luyện tự do (`typingease-sound-v1`).
// Chỉ kêu khi ô nhập dài ra; xoá lùi thì im.
const sound = window.TypingEaseSound;
const soundToggle = document.querySelector('#sound-toggle');
let heardLength = 0;
const syncSound = () => soundToggle?.setAttribute('aria-pressed', String(Boolean(sound?.isOn())));
soundToggle?.addEventListener('click', () => { sound?.toggle(); syncSound(); input.focus(); });
document.addEventListener('keydown', event => {
  if (event.altKey && !event.ctrlKey && !event.metaKey && String(event.key).toLowerCase() === 's') {
    event.preventDefault(); sound?.toggle(); syncSound();
  }
});
syncSound();
function clickFor(value) {
  const index = value.length - 1;
  if (index >= 0 && value.length > heardLength) sound?.click(value[index] === passage[index] ? 'ok' : 'bad');
  heardLength = value.length;
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(saved) ? saved.filter(item => item && durations.includes(item.duration) && Number.isFinite(item.wpm)).slice(-15) : [];
  } catch {
    return [];
  }
}

function saveHistory(record) {
  testHistory = [...testHistory, record].slice(-15);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(testHistory)); } catch { /* Storage can be unavailable in private browsing. */ }
  renderProgress();
}

function renderPrompt() {
  const typed = input.value;
  promptElement.innerHTML = [...passage].map((character, index) => {
    const state = index < typed.length ? (typed[index] === character ? '' : 'wrong') : index === typed.length ? 'current' : '';
    return `<span class="${state}">${character === ' ' ? '&nbsp;' : character}</span>`;
  }).join('');
}

function calculateMetrics(now = Date.now()) {
  const typed = input.value;
  const correct = [...typed].filter((character, index) => character === passage[index]).length;
  const errors = Math.max(0, typed.length - correct);
  const elapsedMinutes = startedAt ? Math.max((now - startedAt) / 60000, 1 / 60) : 0;
  const wpm = elapsedMinutes ? Math.round((typed.length / 5) / elapsedMinutes) : 0;
  const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : null;
  return { wpm: Number.isFinite(wpm) ? wpm : 0, accuracy: Number.isFinite(accuracy) ? accuracy : null, errors };
}

function calculateConsistency() {
  if (wpmSamples.length < 2) return null;
  const mean = wpmSamples.reduce((total, value) => total + value, 0) / wpmSamples.length;
  if (!Number.isFinite(mean) || mean <= 0) return null;
  const variance = wpmSamples.reduce((total, value) => total + (value - mean) ** 2, 0) / wpmSamples.length;
  const deviation = Math.sqrt(variance);
  const score = Math.round(Math.max(0, Math.min(100, 100 - (deviation / mean) * 100)));
  return Number.isFinite(score) ? score : null;
}

function setPercent(element, value) { element.innerHTML = `${value ?? '--'}<small>%</small>`; }

function updateMetrics(now = Date.now()) {
  const metrics = calculateMetrics(now);
  wpmElement.textContent = metrics.wpm;
  setPercent(accuracyElement, metrics.accuracy);
  errorsElement.textContent = metrics.errors;
  setPercent(consistencyElement, calculateConsistency());
  return metrics;
}

function collectWpmSample(now = Date.now()) {
  if (!startedAt) return;
  const elapsedSeconds = Math.floor((now - startedAt) / 1000);
  if (elapsedSeconds < 1 || elapsedSeconds === lastSampleSecond) return;
  lastSampleSecond = elapsedSeconds;
  wpmSamples.push(calculateMetrics(now).wpm);
}

function updateDurationUi() {
  const running = Boolean(startedAt && !finished);
  titleElement.textContent = text(`Test tốc độ gõ ${selectedDuration} giây`, `${selectedDuration}-second typing test`);
  durationButtons.forEach(button => {
    const selected = Number(button.dataset.duration) === selectedDuration;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.disabled = running;
  });
}

function showResult(metrics, consistency) {
  resultWpm.textContent = `${metrics.wpm} WPM`;
  resultAccuracy.textContent = `${metrics.accuracy ?? '--'}%`;
  resultErrors.textContent = String(metrics.errors);
  resultConsistency.textContent = `${consistency ?? '--'}%`;
  const previous = [...testHistory].reverse().find(item => item.duration === selectedDuration);
  if (previous) {
    const difference = metrics.wpm - previous.wpm;
    comparisonElement.textContent = difference === 0 ? text('Bằng kết quả lần trước.', 'Same as your previous result.') : text(`${difference > 0 ? '+' : ''}${difference} WPM so với lần trước`, `${difference > 0 ? '+' : ''}${difference} WPM from your previous result`);
    comparisonElement.hidden = false;
  } else {
    comparisonElement.hidden = true;
  }
  resultElement.hidden = false;
}

function endTest() {
  if (finished) return;
  const now = Date.now();
  collectWpmSample(now);
  const metrics = updateMetrics(now);
  const consistency = calculateConsistency();
  clearInterval(timer);
  finished = true;
  input.disabled = true;
  showResult(metrics, consistency);
  saveHistory({ duration: selectedDuration, wpm: metrics.wpm, accuracy: metrics.accuracy, errors: metrics.errors, consistency, timestamp: Date.now() });
  messageElement.textContent = text(`Đã hết ${selectedDuration} giây. Kết quả: ${metrics.wpm} WPM, ${metrics.accuracy ?? '--'}% chính xác, ${metrics.errors} lỗi.`, `Time is up. Result: ${metrics.wpm} WPM, ${metrics.accuracy ?? '--'}% accuracy, ${metrics.errors} errors.`);
  updateDurationUi();
}

function tick() {
  if (!startedAt || finished) return;
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - startedAt) / 1000);
  timeElement.textContent = Math.max(selectedDuration - elapsedSeconds, 0);
  collectWpmSample(now);
  updateMetrics(now);
  if (elapsedSeconds >= selectedDuration) endTest();
}

function beginTest() {
  if (startedAt || finished || !input.value) return;
  startedAt = Date.now();
  messageElement.textContent = text('Đang tính kết quả theo thời gian thực.', 'Calculating your result in real time.');
  updateDurationUi();
  timer = setInterval(tick, 250);
}

function resetTest(focus = true) {
  clearInterval(timer);
  startedAt = null;
  finished = false;
  wpmSamples = [];
  lastSampleSecond = 0;
  input.disabled = false;
  input.value = '';
  timeElement.textContent = String(selectedDuration);
  wpmElement.textContent = '0';
  setPercent(accuracyElement, null);
  errorsElement.textContent = '0';
  setPercent(consistencyElement, null);
  resultElement.hidden = true;
  comparisonElement.hidden = true;
  messageElement.textContent = text('Sẵn sàng khi bạn muốn.', 'Ready when you are.');
  updateDurationUi();
  renderPrompt();
  if (focus) input.focus();
}

function localDay(timestamp) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getProgressRecords() {
  const today = localDay(Date.now());
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (progressRange - 1)).getTime();
  return testHistory.filter(record => Number.isFinite(record.timestamp) && record.timestamp >= cutoff && Number.isFinite(record.wpm));
}

function groupProgressByDay(records) {
  const groups = new Map();
  records.forEach(record => {
    const day = localDay(record.timestamp);
    if (!day) return;
    const key = day.getTime();
    const group = groups.get(key) || { day, wpm: [], accuracy: [], count: 0 };
    group.wpm.push(record.wpm);
    if (Number.isFinite(record.accuracy)) group.accuracy.push(record.accuracy);
    group.count += 1;
    groups.set(key, group);
  });
  return [...groups.values()].sort((a, b) => a.day - b.day).map(group => ({
    ...group,
    averageWpm: group.wpm.reduce((total, value) => total + value, 0) / group.wpm.length,
    averageAccuracy: group.accuracy.length ? group.accuracy.reduce((total, value) => total + value, 0) / group.accuracy.length : null
  }));
}

function formatProgressDate(date) { return date.toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit' }); }

function renderProgressChart(groups) {
  const values = groups.map(group => progressMetric === 'wpm' ? group.averageWpm : group.averageAccuracy).filter(Number.isFinite);
  const width = 640, height = 220, left = 48, right = 18, top = 20, bottom = 38;
  const minValue = progressMetric === 'accuracy' ? 0 : Math.max(0, Math.floor(Math.min(...values) - 10));
  const maxValue = progressMetric === 'accuracy' ? 100 : Math.ceil(Math.max(...values) + 10);
  const valueRange = Math.max(1, maxValue - minValue);
  const chartWidth = width - left - right, chartHeight = height - top - bottom;
  const x = index => groups.length === 1 ? left + chartWidth / 2 : left + index * chartWidth / (groups.length - 1);
  const y = value => top + (maxValue - value) / valueRange * chartHeight;
  const path = groups.map((group, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(progressMetric === 'wpm' ? group.averageWpm : group.averageAccuracy).toFixed(1)}`).join(' ');
  const grid = [0, .5, 1].map(step => { const value = Math.round(maxValue - step * valueRange); const lineY = top + step * chartHeight; return `<line class="grid" x1="${left}" y1="${lineY}" x2="${width - right}" y2="${lineY}"/><text class="axis-label" x="8" y="${lineY + 4}">${value}${progressMetric === 'accuracy' ? '%' : ''}</text>`; }).join('');
  const labels = groups.map((group, index) => (groups.length <= 6 || index === 0 || index === groups.length - 1 || index % Math.ceil(groups.length / 4) === 0) ? `<text class="axis-label" text-anchor="middle" x="${x(index)}" y="${height - 13}">${formatProgressDate(group.day)}</text>` : '').join('');
  const points = groups.map((group, index) => { const value = progressMetric === 'wpm' ? group.averageWpm : group.averageAccuracy; return `<circle class="point" cx="${x(index)}" cy="${y(value)}" r="4"><title>${formatProgressDate(group.day)}: ${Math.round(value)}${progressMetric === 'accuracy' ? '%' : ' WPM'}</title></circle>`; }).join('');
  progressChart.innerHTML = `${grid}<path class="line" d="${path}"/>${points}${labels}`;
  progressChart.setAttribute('aria-label', text(`${progressMetric === 'wpm' ? 'WPM' : 'Accuracy'} theo thời gian`, `${progressMetric === 'wpm' ? 'WPM' : 'Accuracy'} over time`));
}

function renderProgress() {
  const records = getProgressRecords();
  const groups = groupProgressByDay(records);
  const chartGroups = groups.filter(group => Number.isFinite(progressMetric === 'wpm' ? group.averageWpm : group.averageAccuracy));
  progressEmpty.textContent = text('Chưa có đủ dữ liệu. Hãy hoàn thành vài bài kiểm tra để xem tiến bộ của bạn.', 'Not enough data yet. Complete a few tests to see your progress.');
  const accuracyRecords = records.filter(record => Number.isFinite(record.accuracy));
  const averageWpm = records.length ? Math.round(records.reduce((total, record) => total + record.wpm, 0) / records.length) : null;
  const bestWpm = records.length ? Math.max(...records.map(record => record.wpm)) : null;
  const averageAccuracy = accuracyRecords.length ? Math.round(accuracyRecords.reduce((total, record) => total + record.accuracy, 0) / accuracyRecords.length) : null;
  progressAverageWpm.textContent = averageWpm ?? '--';
  progressBestWpm.textContent = bestWpm ?? '--';
  progressAverageAccuracy.textContent = `${averageAccuracy ?? '--'}%`;
  progressTestCount.textContent = String(records.length);
  progressRangeButtons.forEach(button => { const selected = Number(button.dataset.progressRange) === progressRange; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
  progressMetricButtons.forEach(button => { const selected = button.dataset.progressMetric === progressMetric; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
  if (!records.length) {
    progressEmpty.hidden = false;
    progressChartWrap.hidden = true;
    progressTrend.textContent = '';
    progressSummaryText.textContent = text('Chưa có dữ liệu tiến bộ.', 'No progress data yet.');
    return;
  }
  if (!chartGroups.length) {
    progressEmpty.hidden = false;
    progressChartWrap.hidden = true;
    progressTrend.textContent = text('Chưa có dữ liệu cho chỉ số này.', 'No data is available for this metric.');
    progressSummaryText.textContent = text('Chưa có dữ liệu phù hợp để vẽ biểu đồ.', 'There is no suitable data to draw this chart.');
    return;
  }
  progressEmpty.hidden = true;
  progressChartWrap.hidden = false;
  renderProgressChart(chartGroups);
  const measure = progressMetric === 'wpm' ? 'WPM' : text('% Accuracy', '% Accuracy');
  if (chartGroups.length < 2) {
    progressTrend.className = 'progress-trend';
    progressTrend.textContent = text('Chưa đủ dữ liệu để tính xu hướng.', 'Not enough data to calculate a trend.');
  } else {
    const first = progressMetric === 'wpm' ? chartGroups[0].averageWpm : chartGroups[0].averageAccuracy;
    const last = progressMetric === 'wpm' ? chartGroups.at(-1).averageWpm : chartGroups.at(-1).averageAccuracy;
    const change = Math.round(last - first);
    progressTrend.className = `progress-trend ${change > 0 ? 'positive' : change < 0 ? 'negative' : ''}`;
    progressTrend.textContent = change === 0 ? text('Không thay đổi so với đầu kỳ.', 'No change from the start of this period.') : text(`${change > 0 ? '+' : ''}${change} ${measure} so với đầu kỳ.`, `${change > 0 ? '+' : ''}${change} ${measure} from the start of this period.`);
  }
  progressSummaryText.textContent = text(`${records.length} bài test trong ${progressRange} ngày. WPM trung bình ${averageWpm ?? '--'}, Accuracy trung bình ${averageAccuracy ?? '--'}%.`, `${records.length} tests in the last ${progressRange} days. Average WPM ${averageWpm ?? '--'}, average accuracy ${averageAccuracy ?? '--'}%.`);
}

durationButtons.forEach(button => button.addEventListener('click', () => {
  if (startedAt && !finished) return;
  selectedDuration = Number(button.dataset.duration);
  resetTest(false);
}));
input.addEventListener('input', () => {
  if (!finished) clickFor(input.value);
  beginTest();
  renderPrompt();
  updateMetrics();
});
restartButton.addEventListener('click', () => resetTest());
progressRangeButtons.forEach(button => button.addEventListener('click', () => { progressRange = Number(button.dataset.progressRange); renderProgress(); }));
progressMetricButtons.forEach(button => button.addEventListener('click', () => { progressMetric = button.dataset.progressMetric; renderProgress(); }));
resetTest(false);
renderProgress();
