# QUYẾT ĐỊNH THI HÀNH — chốt 5 câu hỏi mở của PLAN.md

Ngày 2026-09-09. Các quyết định dưới đây là **ràng buộc**; agent thực thi không cần hỏi lại.

## 1. Tiếng Việt có dấu (Unit 3) — LÀM, chỉ Telex
- Làm Unit 3 với **Telex mặc định, không có tuỳ chọn VNI** ở bản đầu.
- Bắt buộc **prototype `telex-match.js` trước** (5 âm tiết) rồi mới viết 8 bài của unit.
- Nếu prototype thất bại trên bất kỳ 2 trong 3 môi trường (Windows Unikey, macOS, Android Gboard):
  Unit 3 chạy `ascii-fallback` (không dấu) và ghi rõ hạn chế trên trang lộ trình. Không huỷ unit.
- Lý do: gõ tiếng Việt có dấu là điểm khác biệt duy nhất so với một bản clone typing.com. Rủi ro đã có đường lùi.

## 2. Tab "Trò chơi 30 giây" — BỎ. Tab "Tự do" — RA TRANG RIÊNG
- Xoá `.game-practice` khỏi trang chủ (trùng với test 30 s đã có).
- `.free-practice` chuyển sang `/luyen-tu-do/`.
- Không còn `mode-switch` trên trang chủ.
- Lý do: trang chủ phải một mục đích — đưa người mới vào bài học.

## 3. Lesson player — Ở `/hoc/` VỚI HASH ROUTE
- `/hoc/#u1-l04/5`. Không tạo 35 thư mục. Trang chủ và các bài SEO giữ nguyên URL.
- Lý do: focus mode thật, không phá SEO trang chủ.

## 4. Ngôn ngữ — RÚT DROPDOWN VỀ vi / en / ja
- Dropdown `#language` chỉ còn 3 lựa chọn. Nội dung bài học: vi đầy đủ, en/ja theo Phase 5.
- **Giữ nguyên** các bảng chuỗi zh/ru/pt/pt-BR/ar/ms trong `script.js` (không xoá code) để còn bật lại được.
- Lý do: 6 ngôn ngữ kia không có trang, không có hreflang, không có sitemap — chỉ là trang trí, và
  chọn 中文 rồi nhận bài tiếng Anh là trải nghiệm tệ hơn là không có lựa chọn đó.

## 5. Tiến độ cũ — KHÔNG MAP 1-1
- Người đã có `goxanh-lesson-records-v2`: hiện "Đã hoàn thành n bài ở giáo trình cũ", mở khoá Unit 1 + Unit 2,
  không cố map từng bài. Giữ lại record cũ trong localStorage (không xoá) để còn hiển thị ở `/tien-do/`.
- Lý do: 30 bài cũ và 35 bài mới khác nhau về cả thứ tự phím và cấu trúc screen; map giả sẽ sai.

---

# TRẠNG THÁI HIỆN TẠI (đọc trước khi làm)

## Phase 0 — XONG
- `script.js` `renderCoachTrend()`: đã sửa bug `chart.hidden` (SVGElement không có IDL `hidden`) →
  dùng `toggleAttribute` + class `has-trend` trên `#coach`.
- `coach.css`: thêm `.coach:not(.has-trend) .coach-body{grid-template-columns:1fr}` và
  `.coach-trend[hidden]{display:none}`.
- `script.js`: thêm dict `coachTrendHint` (9 ngôn ngữ); 3 trang index thêm `<p id="coach-trend-hint">`.
- `hands.js` + `hands.css`: gradient chuyển sang tông da, thêm stroke, opacity .94.
- `keyboard.css`: `.keyboard` background `#edf4f0` → `#dfe8e3`.
- **Lưu ý**: mục "mobile tràn ngang 390px" trong PLAN.md mục 0 là **chẩn đoán sai** — đó là do
  `--window-size=390` bị Chrome trên Windows kẹp lên ~500px khi chụp ảnh. Đo bằng CDP
  `Emulation.setDeviceMetricsOverride` thì `docScrollWidth === 390`, không tràn.
  `.results-table-wrap` đã có `overflow:auto` sẵn từ trước. Không cần sửa gì.

## Phase 1 — ĐANG LÀM, đã có `taster.js`
`taster.js` (mới, đã viết xong) là widget "gõ thử" cho hero: tự chứa engine nhỏ, dòng
`jjj fff jjj fff jf fj`, bàn phím thu gọn 4 hàng (`data-tkey`, KHÔNG dùng `data-key` để tránh
xung đột với `highlightGuide()` của `script.js`), ghost hands qua `TypingEaseHands.markup`,
tự chấm điểm và xếp lớp 3 bậc theo PLAN.md mục A3. Nó cần:
- `window.TypingEaseHome.openLesson(0)` — chưa tồn tại, phải export từ `script.js`.
- event `typingease:language` với `detail.language` — chưa tồn tại, phải dispatch trong `applyLanguage()`.
- `home.css` — chưa có.
- markup `<div id="taster"></div>` trong hero của cả 3 trang index — chưa có.

---

# CẠM BẪY ĐÃ GẶP (đừng lặp lại)

1. **`element.hidden` trên phần tử SVG không hoạt động.** `hidden` là IDL của `HTMLElement`;
   `SVGElement` không có. Gán `svg.hidden = true` chỉ tạo expando JS. Và cả `[hidden]` của UA
   stylesheet cũng không áp cho SVG → phải tự viết `selector[hidden]{display:none}` trong CSS.
2. **Chụp ảnh headless bằng `--window-size=390` là sai** — Chrome trên Windows kẹp bề rộng cửa sổ
   lên ~500px, ảnh bị cắt chứ trang không tràn. Muốn đo mobile thật thì dùng CDP
   `Emulation.setDeviceMetricsOverride`. Có script mẫu tại
   `%TEMP%\claude\C--Users-KHAI-Desktop-shopify-go10ngon\<session>\scratchpad\probe2.js`
   (node, không cần cài gói: dùng `fetch` + `WebSocket` sẵn của Node 24).
   Khởi động Chrome kèm `--remote-debugging-port=9222`.
3. **`applyLanguage()` trong `script.js` gán DOM theo THỨ TỰ selector**:
   `document.querySelectorAll('.eyebrow')[0]` và `[1]`, `document.querySelector('.intro')`,
   `document.querySelectorAll('.mode-switch button')[0..1]`, `.stats div span` theo index.
   Thêm phần tử mang các class đó vào TRƯỚC vị trí cũ sẽ làm lệch index và vỡ i18n.
   Khi thêm markup mới, **tránh dùng lại các class đó** hoặc phải cập nhật `applyLanguage()`.
4. **`highlightGuide()`, `reachForKey()`, `pressActiveFinger()` query toàn document**
   (`.key[data-key=...]`, `.hand-layer .finger`, `.active-key,.active-finger`). Thêm bàn phím
   hoặc hand layer thứ hai vào trang sẽ bị chúng can thiệp. Giải pháp đang dùng: bàn phím hero
   dùng `data-tkey` và tự highlight trong phạm vi `#taster-board`. Nếu cần, hãy **scope** các
   query đó về `.keyboard-demo` của bài học.
5. Sửa file bằng script Python có `assert count == 1` cho từng phép thay thế — các file CSS ở đây
   là một dòng rất dài, `sed` rất dễ thay sai chỗ.

# QUY TẮC CHUNG CHO MỌI AGENT

- Static site, vanilla JS, không thêm framework, không thêm bước build, không thêm dependency.
- Giữ nguyên mọi URL đang có + `sitemap.xml` + `hreflang` + `canonical`. Không phá SEO.
- **Không copy nội dung của typing.com** (bản quyền Teaching.com). Chỉ học cấu trúc. Text tự viết.
- Tiếng Việt là ngôn ngữ chính. Nội dung Unit 1-2 dùng tiếng Việt **không dấu** (đúng theo giáo trình).
- Server dev đang chạy: `http://127.0.0.1:8080` (python -m http.server tại thư mục project).
- Kiểm chứng bằng Chrome headless thật + xem ảnh, không chỉ đọc code. `console` phải sạch lỗi.
- KHÔNG commit, KHÔNG push. Để lại working tree cho user xem.

---

# QUYẾT ĐỊNH BỔ SUNG — chốt các khoảng trống schema (sau khi Phase 1 + Phase 2 xong)

Agent nội dung và agent player đều báo về cùng một số chỗ mơ hồ trong `PLAN.md` §C3/§C4.
Chốt như sau, **ràng buộc**:

1. **Tên field: dùng camelCase của §C4** (`type`, `newKey`, `keysSoFar`, `minAccuracy`, `seconds`).
   Bỏ hẳn cách gọi snake_case (`screen_type`, `new_key`, `time_limit`) — nó chỉ là di sản từ typing.com.
2. **Thời lượng: dùng `seconds`.** Không dùng `timeLimit`. Player hiện chấp nhận cả hai; dữ liệu chỉ ghi `seconds`.
3. **`screen` đánh số từ 1** ở mọi nơi hiển thị và ở hash route (`#u1-l04/5`), 0-based chỉ tồn tại bên trong
   `progress-store.js`. Ai gọi `recordScreen()` phải tự trừ 1.
4. **`minAccuracy`: 70 cho bài 1-4, 80 từ bài 5.** Bỏ con số 75 trong §C2/§C4.
5. **Bộ mã ngón (10 mã)**: `LP LR LM LI LT` / `RT RI RM RR RP`. `screen.finger` thắng `fingerMap` của
   `script.js` khi hai bên khác nhau (ví dụ dấu cách: dữ liệu ghi `RT`, `script.js` ghi `LT` — cả hai đều là
   "ngón cái", ưu tiên `screen.finger`).
6. **Xuống dòng cần Enter thật**: thêm field `linebreak` cho screen, giá trị `"space"` (mặc định, `\n` chỉ là
   ngắt dòng hiển thị và gõ bằng một dấu cách) hoặc `"enter"` (phải gõ Enter thật). Bắt buộc dùng
   `linebreak:"enter"` cho bài `u2-l09` (Enter/Shift). Validator phải kiểm field này.
7. **`kind:'test'` KHÔNG thêm vào `profile.js`.** Giữ `KINDS = ['lesson','weak','free']`; bài kiểm tra ghi
   `kind:'lesson'`, bài phím yếu ghi `kind:'weak'`. Không có logic nào phụ thuộc vào việc phân biệt `test`,
   nên đừng nới hợp đồng chỉ để cho đẹp.
8. **`dictation`** chỉ dùng cho typography (letters → giãn chữ, sentence → canh trái). Việc ngắt dòng do
   `\n` + `linebreak` quyết định, không do `dictation`.
9. **Ký hiệu cần Shift (Unit 4)**: `newKeys` phải ghi **phím vật lý không Shift** (ví dụ `-` cho `_`, `;` cho `:`,
   `/` cho `?`, `1` cho `!`), và thêm `shifted: true` cho screen đó, để chip "phím mới" sáng đúng phím.
10. **`weak-keys.js` phải nhận `allowedKeys`** và có bộ từ tiếng Việt — đang được sửa song song.
    Cho tới khi xong, player tự sinh drill và validate lại theo `keysSoFar` (đúng như nó đang làm).

## Khoảng trống tích hợp còn lại (Phase 3 phải xử lý)
Trang chủ hiện vẫn chạy **engine 30 bài cũ** trong `script.js`; `/hoc/` chạy **giáo trình 35 bài mới**.
Hai thứ chưa nối. Cụ thể:
- CTA của taster gọi `TypingEaseHome.openLesson(0)` → mở engine cũ ngay trên trang chủ, phải đổi thành
  điều hướng sang `/hoc/#u1-l01/7` và ghi công screen gõ thử qua
  `TypingEaseProgress.recordScreen('u1-l01', curriculum.starter.screen - 1, ...)`.
- Continue card đọc `goxanh-lesson-records-v2` (30 bài cũ), phải đọc `typingease-progress-v3`.
- Rail "Lộ trình 10 ngón" trên trang chủ vẫn là 30 bài cũ, phải đổi sang cây unit mới.

---

# TRẠNG THÁI CUỐI NGÀY 2026-09-09 — ĐỌC MỤC NÀY TRƯỚC KHI TIẾP TỤC

## Đã xong (đã kiểm chứng bằng Chrome thật, console sạch)
- **Phase 0** — vá coach card (bug `hidden` trên SVG), ghost hands tông da.
- **Phase 1** — hero "gõ thử" (`taster.js` + `home.css`), continue card, Enter-để-tiếp-tục,
  dropdown rút về vi/en/ja. `index.html` 20,5 KB → 8,1 KB.
- **Phase 2** — giáo trình Unit 1: `data/curriculum.vi.js` (cây 35 bài) +
  `data/lessons/vi/u1-l01..l10.json` (87 screen) + `scripts/validate-lessons.js` (PASS).
  Player `/hoc/` (`player.js`, `player.css`, `progress-store.js`, `keyboard-widget.js`,
  `hoc/index.html`) chạy đủ 5 screen type, hash route `#u1-l01/7`.
- **Phase 3** — nối trang chủ với player; tạo `/bai-hoc/`, `/tien-do/`, `/luyen-tu-do/`;
  dọn trang chủ (bỏ mode-switch, game, engine cũ, bảng thành tích, benefits).
  `script.js` 91 KB → 63 KB, engine cũ đã tách khỏi trang chủ hoàn toàn.
- **Ngoài kế hoạch** — `weak-keys.js` viết lại: 34 từ tiếng Anh → 220 từ tiếng Việt không dấu,
  thêm tham số `allowedKeys`. Sửa bug `&nbsp;` ở `/luyen-phim-yeu/` làm đo sai độ chính xác
  (gõ đúng vẫn bị tính 79%).

## Còn lại
- **Phase 4 (lớn nhất)** — 25 bài Unit 2-4 + prototype `telex-match.js`.
  Bắt buộc prototype Telex TRƯỚC khi viết 8 bài Unit 3 (quyết định số 1). Nhớ field
  `linebreak:"enter"` cho `u2-l09` (quyết định bổ sung số 6) và `shifted:true` cho ký hiệu Unit 4
  (số 9). Chạy `node scripts/validate-lessons.js` sau mỗi bài.
- **Phase 5** — `curriculum.en.js` + bài en/ja, huy hiệu, service worker.

## Nợ kỹ thuật nên dọn sớm
1. **~45 KB bảng chuỗi 6 ngôn ngữ chết trong `script.js`** (zh/ru/pt/pt-BR/ar/ms) — giữ lại theo
   quyết định số 4, nhưng dropdown chỉ còn 3 ngôn ngữ nên chúng không bao giờ được dùng.
2. **CSS chết**: trong `keyboard.css` (`.game-*`, `.lesson-path`, `.level`, `.toggle-lessons`,
   `.lesson-result`, `.tip-card`, `.stats`, `.prompt`, `#typing-input`) và `style.css`
   (`.hero-visual`, `.visual-card`, `.circle`, `.mode-switch`, `.practice-grid`, `.typing-card`,
   `.benefits`, `.trust-row`) — không còn markup nào dùng.
3. `/en/` `/ja/` hiện tên bài tiếng Việt kèm ghi chú — chờ Phase 5.
4. `/hoc/#<id-bịa>/1` hiện câu "id đã có trong lộ trình", sai với id không tồn tại.
5. `data/curriculum.vi.js` có `starter.hint` nhưng `taster.js` vẫn hardcode chuỗi riêng — trùng nguồn.

## Cách chạy lại
```
cd C:\Users\KHAI\Desktop\shopify\go10ngon
python -m http.server 8080          # rồi mở http://127.0.0.1:8080
node scripts/validate-lessons.js    # kiểm dữ liệu bài học
node bai-hoc/generate.mjs           # sinh lại /bai-hoc/ sau khi sửa curriculum
```
Đo mobile phải dùng CDP `Emulation.setDeviceMetricsOverride`, KHÔNG `--window-size` (cạm bẫy 2).
