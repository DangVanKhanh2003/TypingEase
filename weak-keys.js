(function (global) {
  const STORAGE_KEY = 'typingease-weak-keys-v1';

  const MAX_LINE_LENGTH = 80;      // giữ nguyên ngân sách ký tự của bản cũ
  const MIN_WEAK_RATIO = 0.55;     // tỷ lệ ký tự phím yếu tối thiểu trong bài
  const DRILL_SPACING = 3;         // cứ 3 từ thì chèn 1 cụm drill (xem WEAK_DRILL_SPACING trong profile.js)
  const MAX_DRILL_KEYS = 3;        // số phím tối đa dùng để dựng cụm drill

  // Bộ từ tiếng Việt KHÔNG DẤU (DECISIONS.md: nội dung Unit 1-2 viết không dấu).
  // Đã duyệt tay từng từ: chỉ giữ từ có nghĩa, đọc lên nhận ra được, và bỏ mọi từ mà khi
  // mất dấu có thể đọc thành nghĩa thô/nhạy cảm (ví dụ đã loại: ia, dai, cu, bu, vu, mu, lon,
  // ngu, duc, dit, cut, dut, hut, buoi, buom, chim, dam, hiep, vai, ruou).
  // Nhóm đầu cố tình chỉ dùng các phím của Unit 1 (a d e f g h i j k l r s u) để khi lọc theo
  // `allowedKeys` hẹp vẫn còn đủ từ dùng; nhóm sau phủ phần còn lại của bàn phím.
  const WORD_POOL = [
    // — chỉ dùng phím Unit 1 —
    'ai', 'la', 'le', 'ke', 'ha', 'he', 'hu', 'da', 'de', 'du', 'di',
    'ga', 'sa', 'se', 'su', 'ra', 're', 'ru',
    'khi', 'kha', 'khe', 'khu', 'gia', 'giu', 'gui', 'kia', 'dia', 'hue',
    'hai', 'sai', 'lai', 'gai', 'khai', 'giai',
    'sau', 'lau', 'rau', 'dau', 'gau', 'khau', 'giau',
    'dua', 'sua', 'lua', 'rua', 'hua', 'khua',
    'diu', 'keu', 'deu', 'leu', 'reu', 'hieu', 'dieu', 'lieu', 'kieu', 'sieu',
    // — phần còn lại của bàn phím —
    'an', 'ao', 'anh', 'em', 'me', 'cha', 'chi', 'chu', 'bac', 'ba', 'ong',
    'con', 'chau', 'nha', 'que', 'lang', 'pho', 'san', 'vuon', 'cua',
    'ban', 'ghe', 'bang', 'phan', 'sach', 'vo', 'but', 'giay', 'bai', 'lop',
    'hoc', 'doc', 'viet', 'nghe', 'noi', 'nhin', 'lam', 'thu', 'thuc', 'day',
    'sinh', 'thay', 'truong', 'kinh', 'tin', 'tinh', 'hinh', 'minh',
    'mua', 'nang', 'gio', 'may', 'troi', 'sao', 'trang', 'bien', 'nui',
    'rung', 'song', 'hoa', 'cay', 'qua', 'la', 'dat', 'nuoc', 'lua',
    'ca', 'meo', 'heo', 'trau', 'vit', 'bo', 'ong', 'cho',
    'com', 'banh', 'canh', 'thit', 'muoi', 'duong', 'tra', 'kem', 'keo', 'chua',
    'sang', 'trua', 'chieu', 'toi', 'dem', 'hom', 'mai', 'ngay', 'tuan',
    'thang', 'nam', 'gio', 'phut', 'mot', 'hai', 'ba', 'bon', 'sau', 'bay', 'tam', 'chin',
    'di', 'den', 've', 'vao', 'len', 'xuong', 'ngoi', 'dung', 'chay', 'nhay', 'hat',
    'vui', 'buon', 'yeu', 'thuong', 'thich', 'biet', 'nho', 'quen', 'mong', 'hon',
    'tot', 'xau', 'moi', 'to', 'cao', 'thap', 'ngan', 'rong', 'hep', 'nhanh', 'cham',
    'kho', 'de', 'manh', 'lanh', 'xanh', 'hong', 'den', 'mat', 'tay', 'chan',
    'nguoi', 'nhieu', 'luon', 'nen', 'phai', 'quan', 'phim', 'phong', 'chuot',
    'dong', 'duoi', 'goi', 'gan', 'cam', 'tuoi', 'uong', 'voi', 'xe', 'ho',
    'khong', 'cuoi', 'thoi', 'trai', 'ngon', 'sua', 'mo', 'ta'
  ];

  function sanitizeRecords(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.entries(value).reduce((records, [key, count]) => {
      const numericCount = Number(count);
      if (typeof key === 'string' && key.length === 1 && Number.isFinite(numericCount) && numericCount > 0) records[key.toLocaleLowerCase()] = numericCount;
      return records;
    }, {});
  }

  function loadRecords(storage = global.localStorage) {
    try { return sanitizeRecords(JSON.parse(storage.getItem(STORAGE_KEY))); } catch { return {}; }
  }

  function getTopWeakKeys(source = {}) {
    return Object.entries(sanitizeRecords(source)).sort(([keyA, countA], [keyB, countB]) => countB - countA || keyA.localeCompare(keyB)).slice(0, 3);
  }

  // Nhận diện "danh sách phím": mảng, Set, hay bất cứ thứ gì iterable trừ chuỗi.
  // Không dùng `instanceof Set` vì Set tạo trong realm khác (iframe, vm) sẽ trượt.
  function isKeyList(value) {
    return Array.isArray(value) || (Boolean(value) && typeof value !== 'string' && typeof value[Symbol.iterator] === 'function');
  }

  // Tham số thứ 3 nhận cả mảng/Set (coi là allowedKeys) và object options, để chỗ gọi nào cũng gọn.
  function normalizeOptions(value) {
    if (isKeyList(value)) return { allowedKeys: value };
    return value && typeof value === 'object' ? value : {};
  }

  // Trả về Set ký tự cho phép (luôn có dấu cách), hoặc null nghĩa là "không giới hạn".
  function toAllowedSet(value) {
    if (!value) return null;
    const list = isKeyList(value) ? [...value] : [];
    const allowed = new Set();
    list.forEach(item => {
      const key = String(item).toLocaleLowerCase();
      if (key.length === 1 && !/\s/.test(key)) allowed.add(key);
    });
    if (!allowed.size) return null;
    allowed.add(' ');
    return allowed;
  }

  // Các cụm drill thuần phím yếu: "eee", "rrr", "ere", "rer", "eer", "err"…
  // Phím sai nhiều thì có mặt trong nhiều cụm hơn (weighted), không trộn ngẫu nhiên.
  function buildDrillChunks(keys, weightOf) {
    const chunks = [];
    const add = chunk => { if (chunk && !chunks.includes(chunk)) chunks.push(chunk); };
    const top = Math.max(...keys.map(weightOf), 1);
    const weighted = keys.flatMap(key => Array(Math.max(1, Math.round(weightOf(key) / top * 3))).fill(key));
    keys.forEach(key => add(key.repeat(3)));
    weighted.forEach((key, index) => {
      const next = weighted[(index + 1) % weighted.length];
      if (key === next) { add(key.repeat(2)); add(key.repeat(4)); return; }
      add(`${key}${next}${key}`);
      add(`${next}${key}${next}`);
      add(`${key}${key}${next}`);
      add(`${next}${next}${key}`);
    });
    return chunks;
  }

  function typedCharacters(text) {
    return [...text].filter(character => !/\s/.test(character));
  }

  function weakRatio(text, weakSet) {
    const typed = typedCharacters(text);
    return typed.length ? typed.filter(character => weakSet.has(character)).length / typed.length : 0;
  }

  // Xếp token thành `lines` dòng, mỗi dòng không quá `perLine` ký tự.
  function packLines(tokens, perLine, lines) {
    const rows = [];
    let current = '';
    for (const token of tokens) {
      if (!current) { current = token; continue; }
      if (current.length + 1 + token.length <= perLine) { current += ` ${token}`; continue; }
      rows.push(current);
      current = token;
      if (rows.length >= lines) break;
    }
    if (rows.length < lines && current) rows.push(current);
    return rows.slice(0, lines).join('\n');
  }

  function assemble(chunks, words, spacing, perLine, lines) {
    const budget = (perLine + 1) * lines;
    const tokens = [];
    let length = 0, chunkIndex = 0, wordIndex = 0;
    const push = token => { tokens.push(token); length += token.length + 1; };
    push(chunks[0]);
    for (let guard = 0; guard < 200 && length < budget; guard += 1) {
      if (words.length) for (let step = 0; step < spacing && length < budget; step += 1) { push(words[wordIndex % words.length]); wordIndex += 1; }
      chunkIndex += 1;
      push(chunks[chunkIndex % chunks.length]);
    }
    return packLines(tokens, perLine, lines);
  }

  /**
   * buildWeakPractice(keys, source, options)
   *   keys    — mảng ký tự phím yếu cần luyện.
   *   source  — bản ghi số lỗi ({ e: 7, r: 3 }) để cân trọng số.
   *   options — mảng/Set ký tự cho phép, HOẶC object:
   *               allowedKeys: mảng|Set ký tự được phép xuất hiện (dấu cách luôn được thêm).
   *                            Không truyền = không giới hạn (hành vi cũ).
   *               maxLength:   số ký tự tối đa mỗi dòng (mặc định 80).
   *               lines:       số dòng, phân cách bằng '\n' (mặc định 1).
   * Trả về chuỗi chỉ gồm các ký tự được phép; khi tập phím quá hẹp để ghép từ,
   * trả về drill tổ hợp chữ ("jjj fff jfj fjf") thay vì rỗng.
   */
  function buildWeakPractice(keys, source = {}, options = {}) {
    const settings = normalizeOptions(options);
    const allowed = toAllowedSet(settings.allowedKeys);
    const perLine = Math.max(12, Number(settings.maxLength) || MAX_LINE_LENGTH);
    const lines = Math.max(1, Math.round(Number(settings.lines) || 1));

    const requested = [...new Set((Array.isArray(keys) ? keys : [])
      .map(key => (typeof key === 'string' ? key.toLocaleLowerCase() : ''))
      .filter(key => key.length === 1 && !/\s/.test(key)))];
    if (!requested.length) return '';

    const records = sanitizeRecords(source);
    const weakKeys = allowed ? requested.filter(key => allowed.has(key)) : requested;
    const weakSet = new Set(weakKeys);
    const weightOf = key => Math.max(1, Number(records[key]) || 1);

    // Phím yếu nằm ngoài tập cho phép thì không thể sinh ra; lúc đó lấy chính các phím
    // được phép làm phím luyện, để không trả về rỗng.
    const drillKeys = weakKeys.slice(0, MAX_DRILL_KEYS);
    if (allowed) {
      const spare = [...allowed]
        .filter(key => key !== ' ' && !drillKeys.includes(key))
        .sort((a, b) => (Number(records[b]) || 0) - (Number(records[a]) || 0));
      const target = weakKeys.length ? 2 : MAX_DRILL_KEYS;
      while (drillKeys.length < target && spare.length) drillKeys.push(spare.shift());
    }
    if (!drillKeys.length) return '';
    if (!weakSet.size) drillKeys.forEach(key => weakSet.add(key));

    const chunks = buildDrillChunks(drillKeys, weightOf);
    const scoreOf = word => [...word].reduce((score, character) => score + (weakSet.has(character) ? weightOf(character) : 0), 0);
    const hitsOf = word => [...word].filter(character => weakSet.has(character)).length;
    const words = [...new Set(WORD_POOL)]
      .filter(word => (!allowed || [...word].every(character => allowed.has(character))) && hitsOf(word) > 0)
      .sort((a, b) => hitsOf(b) / b.length - hitsOf(a) / a.length || scoreOf(b) - scoreOf(a) || a.length - b.length || a.localeCompare(b));

    for (const spacing of [DRILL_SPACING, 1, 0]) {
      const text = assemble(chunks, spacing ? words : [], spacing, perLine, lines).trim();
      if (text && weakRatio(text, weakSet) >= MIN_WEAK_RATIO) return text;
      if (!spacing) return text;
    }
    return '';
  }

  global.TypingEaseWeakKeys = { STORAGE_KEY, loadRecords, getTopWeakKeys, buildWeakPractice };
})(typeof window !== 'undefined' ? window : globalThis);
