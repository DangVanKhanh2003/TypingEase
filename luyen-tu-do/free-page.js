(function (global) {
  // Luyện tự do — engine chuyển nguyên từ tab "Tự do" của script.js, giữ đúng hành vi:
  // dán/chọn đoạn văn → gõ lại → WPM + độ chính xác + đồng hồ, ghi attempt kind:'free' vào
  // profile và tính phút luyện vào mục tiêu ngày. Bàn phím dẫn ngón dùng keyboard-widget
  // (`data-pkey`) nên không đụng vào bất cứ bàn phím nào khác trên site.
  const profile = global.TypingEaseProfile;
  const store = global.TypingEaseProgress;
  const sound = global.TypingEaseSound;

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

  // Âm click dùng chung công tắc với player (`typingease-sound-v1`): bật ở một nơi là bật khắp
  // site. Chỉ kêu khi ô nhập DÀI RA — xoá lùi thì im, vì tiếng "sai" lúc sửa lỗi chỉ thêm bực.
  const soundEl = document.querySelector('#sound-toggle');
  const syncSound = () => soundEl?.setAttribute('aria-pressed', String(Boolean(sound?.isOn())));
  soundEl?.addEventListener('click', () => { sound?.toggle(); syncSound(); input.focus(); });
  document.addEventListener('keydown', event => {
    if (event.altKey && !event.ctrlKey && !event.metaKey && String(event.key).toLowerCase() === 's') {
      event.preventDefault(); sound?.toggle(); syncSound();
    }
  });
  syncSound();
  function clickFor(value) {
    const index = value.length - 1;
    if (index < 0 || value.length <= observed) return;
    sound?.click(value[index] === target[index] ? 'ok' : 'bad');
  }

  const board = document.querySelector('#free-board');
  const keyboard = board && global.TypingEaseKeyboard
    ? global.TypingEaseKeyboard.create({ host: board, compact: global.innerWidth < 700, hands: global.innerWidth >= 900 })
    : null;
  let resizeTimer = null;
  global.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => keyboard?.layout({ compact: global.innerWidth < 700, hands: global.innerWidth >= 900 }), 150);
  });

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
    keyboard?.highlight(target[typed.length] || '');
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
      keyboard?.highlight('');
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
    clickFor(input.value);   // trước trackKeystrokes: nó cập nhật `observed`
    trackKeystrokes(input.value);
    keyboard?.press();
    draw();
  });

  global.addEventListener('pagehide', () => profile?.save());
  keyboard?.highlight('');
})(window);
