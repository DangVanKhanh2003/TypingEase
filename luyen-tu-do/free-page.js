(function (global) {
  // Luyện tự do — engine chuyển nguyên từ tab "Tự do" của script.js, giữ đúng hành vi:
  // dán/chọn đoạn văn → gõ lại → WPM + độ chính xác + đồng hồ, ghi attempt kind:'free' vào
  // profile và tính phút luyện vào mục tiêu ngày. Bàn phím dẫn ngón là bàn phím của typekute
  // (window.NTKeyboard, xem keyboard/boot.js) — cùng một board với trang bài học.
  const profile = global.TypingEaseProfile;
  const store = global.TypingEaseProgress;

  const sampleEl = document.querySelector('#free-sample');
  const input = document.querySelector('#free-input');
  const customText = document.querySelector('#custom-text');
  if (!sampleEl || !input || !customText) return;

  // Đoạn mẫu viết KHÔNG DẤU: gõ được ngay mà không cần bật Unikey, và khớp với nội dung
  // Unit 1-2 của giáo trình. Muốn gõ có dấu thì dán đoạn của bạn vào ô trên.
  const SAMPLES = [
    'Moi ngay danh ra muoi phut de luyen go la du de tay ban quen dan vi tri cac phim. Dieu quan trong khong phai la go nhanh ngay tu dau, ma la go dung, deu tay va khong nhin xuong ban phim.',
    'Buoi sang yen tinh la luc de tap trung nhat. Ngoi thang lung, hai ban chan dat vung tren san, hai ngon tro dat len phim F va J, roi bat dau tu nhung dong ngan truoc khi go doan dai.',
    'Do chinh xac di truoc toc do. Khi tay da nho dung duong di cua tung ngon, toc do se tu tang len ma ban khong can co gang. Con neu go nhanh nhung sai nhieu thi sua lai rat mat thoi gian.',
    'Hay giu mat tren man hinh va de moi ngon tro ve hang phim co so sau khi go. Go tot khong phai la mot cuoc dua; do la mot ky nang lon len dan theo tung ngay luyen tap co y thuc.'
  ];

  let target = '', startedAt = null, timer = null, recorded = false;
  let keyStart = null, observed = 0;

  let NT = null;
  const host = document.querySelector('#free-board');
  let board = null;
  let preferences = null;

  // Dưới 900px trang này hết chỗ cho bàn tay; tuỳ chọn của người học vẫn được giữ nguyên trong
  // kho, chỉ riêng lần hiển thị này bị tắt.
  const boardPreferences = () => ({ ...preferences, showHands: preferences.showHands && global.innerWidth >= 900 });

  async function mountKeyboard() {
    if (!host) return;
    NT = await global.NTKeyboardReady;
    if (!NT) return;
    preferences = NT.loadKeyboardPreferences();
    const layout = await NT.ready.catch(error => { console.warn('[luyện tự do] bàn phím không tải được', error); return null; });
    if (!layout) return;
    const holder = document.createElement('div');
    holder.className = 'cell js-keyboard-holder well';
    board = NT.createKeyboard({
      activeKey: '',
      preferences: boardPreferences(),
      layout,
      onSettings: () => NT.openSettingsFor(board, {
        root: host,
        restoreFocus: () => input.focus(),
        onSave: (next) => { preferences = next; NT.applyKeyboardPreferences(board, boardPreferences()); }
      })
    });
    holder.append(board);
    host.replaceChildren(holder);
    draw();
  }

  let resizeTimer = null;
  global.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (board) NT.applyKeyboardPreferences(board, boardPreferences()); }, 150);
  });
  global.addEventListener('pagehide', () => board?.__ntHands?.destroy());

  const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const pad = value => String(value).padStart(2, '0');

  function reset() {
    clearInterval(timer);
    timer = null;
    startedAt = null;
    recorded = false;
    observed = 0;
    keyStart = null;
    input.value = '';
    document.querySelector('#free-timer').textContent = '00:00';
    document.querySelector('#free-wpm').textContent = '0 WPM';
    document.querySelector('#free-accuracy').textContent = '--%';
  }

  function tick() {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    document.querySelector('#free-timer').textContent = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
  }

  // Từng ký tự mới nhập được đưa vào profile để heatmap và coach ở /tien-do/ có dữ liệu.
  function trackKeystrokes(value) {
    const now = Date.now();
    if (value.length > observed)
      for (let index = observed; index < value.length; index += 1)
        profile?.recordKeystroke(target[index], value[index] === target[index],
          value.length - observed === 1 && keyStart ? now - keyStart : null);
    observed = value.length;
    keyStart = now;
  }

  function draw() {
    const typed = input.value;
    sampleEl.innerHTML = [...target].map((char, index) => {
      const state = index < typed.length ? (typed[index] === char ? '' : 'wrong') : index === typed.length ? 'current' : '';
      return `<span class="${state}">${char === ' ' ? '&nbsp;' : escapeHtml(char)}</span>`;
    }).join('');
    const correct = [...typed].filter((char, index) => char === target[index]).length;
    const percent = typed.length ? Math.round(correct / typed.length * 100) : null;
    document.querySelector('#free-accuracy').textContent = `${percent ?? '--'}%`;
    if (startedAt) {
      const minutes = Math.max((Date.now() - startedAt) / 60000, 1 / 60);
      document.querySelector('#free-wpm').textContent = `${Math.round(correct / 5 / minutes)} WPM`;
    }
    if (board) NT.setKeyboardState(board, target[typed.length] || '');
    const feedback = document.querySelector('#free-feedback');
    if (typed === target && target) {
      clearInterval(timer);
      timer = null;
      feedback.textContent = 'Hoan thanh! Hay chon mot doan van moi de luyen tiep.';
      if (startedAt && !recorded) {
        recorded = true;
        const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        profile?.recordAttempt({ kind: 'free', lesson: null, wpm: Math.round(correct / 5 / Math.max(elapsed / 60, 1 / 60)), accuracy: percent ?? 0, seconds: elapsed });
        profile?.save();
      }
    } else if (!typed.length) {
      feedback.textContent = 'Bạn có thể dán nội dung riêng hoặc tạo đoạn ngẫu nhiên.';
    } else {
      feedback.textContent = percent === 100 ? 'Rất tốt, hãy giữ nhịp gõ đều.' : 'Có ký tự chưa đúng, hãy gõ chậm lại một chút.';
    }
  }

  function setTarget(value) {
    target = String(value || '').replace(/\s+/g, ' ').trim();
    reset();
    if (!target) {
      sampleEl.textContent = 'Hãy chọn một đoạn văn để bắt đầu luyện gõ.';
      if (board) NT.setKeyboardState(board, '');
      return;
    }
    draw();
    input.focus();
  }

  document.querySelector('#use-text').addEventListener('click', () => setTarget(customText.value));
  document.querySelector('#random-text').addEventListener('click', () => {
    const next = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    customText.value = next;
    setTarget(next);
  });

  input.addEventListener('input', () => {
    if (!target) return;
    if (input.value.length > target.length) input.value = input.value.slice(0, target.length);
    if (!startedAt && input.value) { startedAt = Date.now(); timer = setInterval(tick, 1000); }
    if (startedAt || input.value) store?.recordPracticeActivity();
    trackKeystrokes(input.value);
    if (board) {
      board.classList.add('nt-keyboard-peek-started');
      NT.pressKey(board);
    }
    draw();
  });

  global.addEventListener('pagehide', () => profile?.save());
  mountKeyboard();
})(window);
