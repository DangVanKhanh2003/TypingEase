(function (global) {
  // Âm click khi gõ (PLAN.md phase 5). MẶC ĐỊNH TẮT: người học thường mở site ở lớp, ở quán,
  // ở văn phòng — tự dưng phát ra tiếng là một cách rất nhanh để họ đóng tab.
  //
  // Dùng WebAudio chứ không phải <audio src>: một cú click dài 30 ms, tải file cho nó thì vừa
  // thêm một request vừa trễ mất mấy chục mili giây so với phím bấm. Tổng hợp tại chỗ thì đúng
  // bằng lúc phím chạm đáy.
  const KEY = 'typingease-sound-v1';
  // Mỗi tiếng là một xung ngắn: cao và gọn khi đúng, trầm và đục khi sai — phân biệt được mà
  // không cần nhìn màn hình. Gain để thấp vì âm ngắn nghe bao giờ cũng to hơn con số của nó.
  const VOICES = {
    ok: { type: 'triangle', from: 1180, to: 760, gain: 0.05, seconds: 0.035 },
    bad: { type: 'square', from: 220, to: 150, gain: 0.045, seconds: 0.08 }
  };

  const read = () => { try { return global.localStorage.getItem(KEY) === 'on'; } catch { return false; } };
  let enabled = read(), context = null;

  // AudioContext chỉ được tạo sau một cử chỉ của người dùng (bấm nút bật âm), nếu không Chrome
  // sinh ra nó ở trạng thái suspended rồi cảnh báo ra console.
  function audio() {
    const Ctor = global.AudioContext || global.webkitAudioContext;
    if (!Ctor) return null;
    if (!context) { try { context = new Ctor(); } catch { return null; } }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function play(voice) {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = voice.type;
    oscillator.frequency.setValueAtTime(voice.from, now);
    oscillator.frequency.exponentialRampToValueAtTime(voice.to, now + voice.seconds);
    // Vào gần như tức thì rồi tắt dần: bỏ đoạn vào là nghe "bụp", bỏ đoạn tắt là nghe "tạch".
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(voice.gain, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + voice.seconds);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + voice.seconds + 0.01);
  }

  // Mọi lời gọi từ vòng gõ đều đi qua đây và không bao giờ ném: cạm bẫy 8 trong DECISIONS.md —
  // một hiệu ứng phụ ném lỗi giữa `reactToKeystroke()` là player chết đứng sau đúng một phím.
  function click(verdict) {
    if (!enabled) return;
    try { play(VOICES[verdict] || VOICES.ok); } catch { /* thiết bị không có audio, cứ gõ tiếp */ }
  }

  function set(value) {
    enabled = Boolean(value);
    try { global.localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* storage blocked */ }
    if (enabled) click('ok');   // nghe thử ngay: bật mà im lặng thì không ai biết đã bật chưa
    return enabled;
  }

  global.TypingEaseSound = { KEY, isOn: () => enabled, set, toggle: () => set(!enabled), click };
})(window);
