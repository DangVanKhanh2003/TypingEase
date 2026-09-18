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

---

# TRẠNG THÁI CUỐI NGÀY 2026-09-14 — PHASE 4 ĐÃ XONG PHẦN NỘI DUNG

## Đã làm
- **Unit 2 (11 bài)** `u2-l01..u2-l11` — T Y, O W, C N, M V, ôn tập, Q P, B X, Z . , Enter+Shift,
  luyện phím yếu, kiểm tra 60 s. Tiếng Việt không dấu, đúng theo giáo trình.
- **Prototype Telex — ĐẠT** (điều kiện của quyết định 1). `telex-match.js` + `scripts/test-telex.js`
  (chạy: `node scripts/test-telex.js`). Kiểm cả hai lối gõ dấu (dấu ngay sau nguyên âm và dấu ở
  cuối âm tiết) trên 6 từ mẫu: không có ký tự nào bị chấm sai giữa chừng, lỗi thật vẫn bị bắt,
  phát hiện được "chưa bật bộ gõ", bản đồ phím vật lý cho heatmap đúng (ầ = a a f, đ = d d, ư = u w).
  Đã chạy thật trong Chrome: gõ qua chuỗi giá trị mà IME tạo ra cho screen `u3-l01/2` → 0 lỗi giả,
  kết thúc 100 %; gõ chuỗi Telex thô → hiện cảnh báo kèm nút "Gõ không dấu"; bấm nút thì cả bài
  chuyển sang bản không dấu và có nút quay lại. **Không phải dùng đường lùi ascii-fallback cho
  toàn Unit 3** — nó chỉ còn là lựa chọn cho máy không có bộ gõ.
- **Unit 3 (8 bài)** `u3-l01..u3-l08` — dấu sắc/huyền, hỏi/ngã/nặng, â ê ô đ, ă ư ơ, từ thông dụng,
  câu ngắn, luyện dấu hay sai, kiểm tra 60 s. Tất cả `inputMode: "telex"`.
- **Unit 4 (6 bài)** `u4-l01..u4-l06` — hàng số, ký hiệu, email/web/mật khẩu, hai bài đoạn văn,
  kiểm tra cuối 180 s.
- Tổng: **35/35 bài có nội dung, 289 screen, 15 313 ký tự**. `node scripts/validate-lessons.js` PASS.

## Thay đổi hợp đồng (cập nhật so với phần trên của file này)
1. **`linebreak: "enter"` đã có thật** trong player: `buildTarget(content, linebreak)` để `
` là ký
   tự phải gõ; Enter chỉ lọt vào textarea đúng vị trí đó; prompt hiện ⏎ thay cho ␣. Dùng ở
   `u2-l09`, `u3-l06`, `u4-l03`, `u4-l04`, `u4-l05`.
2. **Phím có tên** (`shift`, `enter`) hợp lệ trong `newKeys` và `keysSoFar`. Chữ HOA chỉ hợp lệ sau
   khi bài dạy `shift`; screen intro dạy chúng chờ đúng phím đó được nhấn (không gõ vào ô nhập).
3. **`newKeys` (số nhiều) trên screen `block`** — một screen giới thiệu nhiều phím cùng lúc, dùng cho
   hàng số (`u4-l01` dạy 4+5, 6+7, 3+8, 2+9, 1+0). Chip "PHÍM MỚI" hiện nhiều phím.
4. **Ký hiệu tầng Shift** (quyết định bổ sung 9): hợp lệ khi đã dạy `shift` + phím vật lý, theo bảng
   `SHIFT_MAP` (US layout) có trong cả validator lẫn `keyboard-widget.js`. Vì vậy `u4-l02` chỉ khai
   `newKeys: ['/', '-']`, còn `@ # : ? ! _` do các screen `shifted: true` dạy.
5. **`u3-l07` đổi từ `kind: 'weak'` (sinh runtime) sang `kind: 'review'` với nội dung viết tay**
   ("Luyện dấu hay sai"). Lý do: `weak-keys.js` chỉ sinh từ KHÔNG DẤU, mà gõ từ không dấu trong lúc
   bộ gõ Telex đang bật sẽ ra chữ sai (gõ `as` ra `á`) — một bài luyện tự đánh bẫy người học.
   `u1-l09` và `u2-l10` vẫn dùng weak-keys như cũ (Unit 1-2 không bật bộ gõ).
6. **minAccuracy**: `u3`/`u4` trong `curriculum.vi.js` hạ từ 85 xuống **80**, đúng quyết định bổ sung 4
   ("80 từ bài 5"), để chỉ mục và file bài không mâu thuẫn nhau.
7. **Tập phím telex tách riêng trong validator**: dấu thanh (s f r x j) và token tạo dấu
   (aa ee oo dd aw uw ow) chỉ tính là "đã dạy" khi một bài `inputMode: "telex"` TRƯỚC đó dạy chúng —
   học chữ cái `s` ở Unit 1 không có nghĩa là đã học dấu sắc. Nhờ vậy validator bắt được
   `u3-l02` dùng `đ` trước `u3-l03`, hay `u3-l03` dùng `ơ` trước `u3-l04` (đã xảy ra thật khi viết).

## Chấm điểm chế độ telex trong player
- Ba trạng thái mỗi ký tự: `ok` / `pending` (đang compose, màu vàng) / `bad`. Điểm được **tính lại từ
  đầu mỗi lần input đổi**, không cộng dồn theo phím — vì IME viết đè lên chữ đã gõ.
- **Lỗi đếm theo âm tiết** (`badTokens`), độ chính xác đếm theo ký tự.
- Ký tự còn `pending` thì screen chưa kết thúc, dù đã đủ độ dài.
- Ô nhập ở chế độ telex cho dư 16 ký tự (không cắt ngay ở độ dài đích) để còn nhận ra chuỗi Telex thô.
- 3 âm tiết thô liên tiếp → hiện cảnh báo "chưa bật bộ gõ" + nút chuyển ascii-fallback.
- Heatmap: ký tự có dấu được quy về phím vật lý (`telex.keysFor`), nên `/tien-do/` vẫn đúng phím.

## Còn lại
- **Phase 5** — `curriculum.en.js` + bài en/ja (fallback ja → en → vi), huy hiệu, service worker,
  âm click, `prefers-reduced-motion`.
- Nợ kỹ thuật cũ vẫn còn: ~45 KB bảng chuỗi 6 ngôn ngữ chết trong `script.js`; CSS chết trong
  `keyboard.css` / `style.css`; `/en/` `/ja/` vẫn hiện tên bài tiếng Việt; `/hoc/#<id-bịa>/1` báo sai.
- Chưa test trên macOS và Android Gboard (quyết định 1 yêu cầu 3 môi trường). Windows + Chrome đã
  đạt; hai môi trường kia cần người thật, và engine so khớp không phụ thuộc hệ điều hành vì nó chỉ
  đọc giá trị của ô nhập.

---

# 2026-09-14 (tối) — BÀN PHÍM + BÀN TAY THEO GIAO DIỆN TYPING.COM

Yêu cầu của user: bàn phím và hình bàn tay "giống hệt" bản typing-clone.

## Cách làm — dựng lại, KHÔNG copy tài sản của Teaching.com
- Bàn phím của typing.com là CSS thuần → chép lại **thông số** (đọc từ `app.min.745.css` trong clone):
  panel `#d9dadb` bo 20px padding 15/15/10, phím trắng bo 5px viền trên `#fff` dưới `#a9a9a9`, chữ Roboto Mono
  700 viết hoa `#4a4a4a`, phím đôi (shifted trên / main dưới, 12px), phím chức năng chữ thường canh trái/phải
  10-11px, phím cần gõ `#3295db` viền `#47a0df #3295db #2d86c5`, hàng cách 5px (10px màn cao), phím vuông tối đa 50px,
  mọi phím giãn đều với flex-basis theo `keyboards.json` (delete 74, tab 68, caps 83, enter 83, shift 108, cmd 70,
  space 336, backslash 48).
- Bàn tay của typing.com là **mô hình 3D WebGL** (`hand-default.compressed.gltf` + texture `base-1.jpg`) vẽ vào
  canvas rồi phủ `opacity:.5` + mask mờ dần + drop-shadow. Mô hình/texture là tài sản có bản quyền và site này
  public → **không copy file**. `hands.js` vẽ lại bằng SVG của mình theo cùng bố cục (ngón đặt trên hàng cơ sở,
  ngón cái trên phím cách, mờ dần ở cổ tay, ngón đang gõ nhuộm xanh `#37b3d6`), đầu ngón đo theo phím thật nên
  khớp mọi kích cỡ. Bàn tay **đứng yên** như typing.com (bỏ animation với ngón của bản cũ).

## File đổi
- `keyboard-widget.js` — markup phím mới (`.key-label`, `.key--duo`, `.key--special-l/-r`, flex-basis theo layout US),
  bỏ `reach()`; API giữ nguyên (`highlight/mark/press/layout/fingerFor/...`).
- `hands.js`, `hands.css` — hình tay mới; hook DOM giữ nguyên (`.hand-layer`, `.finger[data-finger][data-key]`,
  `.digit-press`, `.finger-glow`, `active-finger`, `pressing`) nên `taster.js` không phải đổi logic.
- `keyboard.css` — thêm khối `.kb-widget` / `.tc-board` (typing.com look). Rule `.keyboard/.key` cũ vẫn giữ cho
  heatmap `/tien-do/` và các chỗ khác.
- `player.css`, `home.css`, `taster.js` — bỏ rule kích cỡ phím cũ, board rộng 830px, chừa 210px dưới cho bàn tay;
  bàn phím hero dùng class `tc-board`.
- 6 trang HTML thêm font Roboto Mono (index, en, ja, hoc, luyen-tu-do, tien-do).

## Cạm bẫy mới
6. **Bash tool cắt lệnh dài (~>6 KB) → "unexpected EOF while looking for matching quote"**. Heredoc dài phải
   chia thành nhiều file phần rồi `cat` lại. Tool cũng gộp `\` thành `\` trong heredoc → tránh backslash
   trong chuỗi JS/Python (dùng `String.fromCharCode(92)` / `chr(92)`).
7. Chrome headless cache CSS/JS giữa các lần chạy CDP → screenshot cũ. `cdp.js` giờ luôn gọi
   `Network.setCacheDisabled`.

---

# 2026-09-16 — BÀN TAY 3D BẰNG SVG + NGÓN DI CHUYỂN (theo PLAN-ban-tay.md)

## Sửa nhận định 14/09
- Tay typing.com **không đứng yên**: cài đặt `animated_hands` mặc định bật → ngón di chuyển tới phím đích theo hàng
  (`top-row-3-left`, `bottom-row-2-right`... trong `hand-default.compressed.gltf`, 159 tư thế), tween 0,275 s, tốc độ
  thích ứng theo nhịp gõ. Chỉ khi người dùng tắt mới giữ tư thế home. Bản 14/09 làm tay tĩnh là do đọc thiếu.

## Cách làm (3 phase, chạy bằng 3 agent song song/tuần tự, mỗi agent sở hữu file riêng)
- **A — bàn phím** (`keyboard-widget.js`, `keyboard.css`, `player.js`, `taster.js`): `press()` nhún phím theo keyframe
  `keyPressDefault` gốc; `reject(ch)` nháy đỏ `keyRejected`; player/taster gọi trong `reactToKeystroke()` **trước**
  `paintPrompt()` (vì paint chuyển highlight sang phím kế). Telex: `ok`→press, `bad`→reject, `pending`→không.
  Nhãn phím chức năng giữ nhưng nhạt (#a9a9a9, 10px); typing.com ẩn hẳn.
- **B — hình tay** (`hands.js`, `hands.css`): vẫn SVG tự vẽ, không dùng tài sản Teaching.com. Ngón 2 đốt cong, gradient
  ống 5 stop + dải khớp sáng/tối dọc trục, bóng kẽ ngón (ellipse blur), `feDropShadow` từng ngón khai báo 1 lần trong
  `<defs>`, móng có shine. Lớp phủ đúng gốc: `opacity:.5` + `drop-shadow(0 -1px 1px rgba(0,0,0,.8))`. Glow: `#1fa0c8`
  đầu ngón → `#37b3d6` đặc 45% → tan 80%; `.glow-full` tô cả ngón.
- **C — chuyển động** (`hands.js`, `hands.css`, `keyboard-widget.js`): `TypingEaseHands.reach()` là hàm thuần trả
  transform: bàn tay (`.ghost-hand`) đi 35% vector, ngón đi 65% + xoay quanh gốc ≤12°; ngón đã nằm trên phím đích
  không dịch; tay kia rest. `transition: transform var(--hand-speed,.275s) cubic-bezier(.65,0,.35,1)`; `--hand-speed`
  = 0,09 + 0,36·clamp((avg−90)/610) với avg = trung bình 8 khoảng gõ gần nhất kẹp 70–1200 ms (đúng công thức gốc).
  Space → ngón cái **phải** (`FINGERS[' ']` = `RT`, `LT` vẫn hợp lệ cho `screen.finger`). Shift → ngón út tay đối
  diện tới phím Shift, `glow-full`. `create({animatedHands})` / `layout({animatedHands})`; tắt → host `.hands-static`.
  `prefers-reduced-motion` → `transition:none`.

## Kiểm định
- `scripts/e2e.js` (playwright-core + Chrome cài sẵn, không cần package.json):
  `PW=<…>/node_modules/playwright-core node scripts/e2e.js http://127.0.0.1:8765`. Server tĩnh bất kỳ phục vụ thư
  mục gốc. Mỗi test 1 context mới; `pageerror`/`console.error` làm FAIL. Bao phủ: load player, gõ đúng/sai, hết screen,
  Shift, Telex (mô phỏng IME bằng `fill`), hero, 1024/390px, reduced-motion, 5 trang không lỗi, pose ngón (Phase C).
- Sai số đầu ngón đo qua Playwright: |errX| ≤ 3,7 px trên các phím e x 5 p q /; Shift phải −5 px (phím rộng 108 px,
  vẫn trong phím).

## Cạm bẫy mới
8. **`element.dataset['is-animatingTimer']` ném DOMException** (tên có gạch nối + chữ thường không hợp lệ cho dataset).
   Lỗi này làm player chết sau đúng 1 phím vì `reactToKeystroke()` chạy trước `paintPrompt()`. Đã thay bằng
   `WeakMap` ở cả `keyboard-widget.js` và `taster.js`. Bài học: hiệu ứng phụ (press/reject) phải bọc try hoặc chạy
   **sau** logic chính; E2E bắt được ngay, screenshot tĩnh thì không.
9. Hai agent sửa song song chỉ an toàn khi **sở hữu file tách bạch**; agent Phase C phải sửa lỗi của Phase A trong
   file chung `keyboard-widget.js`, còn `taster.js` phải chờ điều phối viên sửa.

## Còn lại
- `taster.js` có `reach()` riêng cho bàn phím hero (xoay ngón quanh khớp), không dùng `TypingEaseHands.reach()` →
  hero và player động khác nhau. Nên gộp về một đường.
- Tông da hơi nâu hơn gốc (gốc hồng-xám); ngón vẫn thiếu rút ngắn phối cảnh ở đầu ngón. Chấp nhận ở opacity .5.
- Chưa có UI cho `animatedHands` (chỉ có API).

---

# 2026-09-16 (chiều) — TRANG CHỦ MỞ THẲNG LỘ TRÌNH + BỎ HẲN EN/JA

## Quyết định của chủ site
1. **Bỏ ô gõ thử ở đầu trang chủ.** Bàn phím + bàn tay ghost ở hero bị gỡ; vào trang là thấy ngay lộ trình
   bài học để chọn. Hero rút còn `h1` + `.intro` + một nút `#hero-go` ("▶ Bắt đầu Bài 1 · Hàng phím cơ sở").
2. **Site chỉ còn tiếng Việt.** Bỏ hẳn `/en/` và `/ja/`, bỏ dropdown chọn ngôn ngữ.

## Cách làm (3 agent song song, mỗi agent sở hữu file tách bạch — theo cạm bẫy 9)
- **Trang chủ** (`index.html`, `home.css`, xoá `taster.js`): thay `#taster` bằng `#hero-start`
  (`a#hero-go` + `.hero-note`); `body.is-returning #hero-start{display:none}` giữ nguyên cơ chế hai mặt
  của hero (người mới ↔ continue card). Bỏ `keyboard.css`, `hands.css`, `hands.js`, font Roboto Mono khỏi
  trang chủ. Thu hero: `.hero{min-height:auto;padding:48px 24px 28px}`, `h1` 58→44px.
- **`script.js`**: 606→425 dòng, 62,3→27,0 KB. Xoá dứt điểm nợ kỹ thuật số 1 (bảng chuỗi 8 ngôn ngữ chết):
  mọi bảng chỉ còn khoá `vi`, các hàm `current*Ui()` trả thẳng bản vi. Xoá `homepageLocale`/
  `isLocalizedHomepage`/`isEnglishHomepage` (base luôn `./`), xoá handler `#language`, xoá `startFromTaster`.
  `applyLanguage(code)` → `applyCopy()` và **không còn ghi đè `h1`/`.intro`/`document.title`** — từ nay HTML
  là nguồn sự thật cho tiêu đề trang chủ. Enter ở trang chủ: người cũ → `goContinue()`, người mới → `#hero-go`.
- **`en/` `ja/`**: 9 trang thành trang chuyển hướng 18 dòng (`meta refresh` + `location.replace` +
  `canonical` về đích + `robots: noindex, follow`), KHÔNG xoá trắng vì URL đã nằm trong kết quả tìm kiếm.
  Ánh xạ: `/en/` `/ja/`→`/`; `*/typing-test/`→`/kiem-tra-toc-do-go/`; `*/what-is-wpm/`→`/wpm-la-gi/`;
  `/ja/touch-typing/`→`/cach-go-10-ngon/`; `/en/how-to-type-faster/`→`/cach-tang-wpm/`;
  `/en/average-typing-speed/`→`/wpm-bao-nhieu-la-nhanh/`. Xoá `en/en.css`, xoá 9 URL khỏi `sitemap.xml`.
- **hreflang**: gỡ khỏi TẤT CẢ trang (kể cả `hreflang="vi"` và `x-default` tự trỏ vào chính nó — vô nghĩa
  khi chỉ còn một ngôn ngữ). `canonical` giữ nguyên ở mọi trang.

## Kiểm định
`scripts/e2e.js` 23/23 PASS. Test 7 cũ (gõ thử ở hero) thay bằng:
- **7** trang chủ: 0 phần tử khớp `#taster/.hand-layer/.keyboard/.kb-widget/.tc-board`, 0 bộ chọn ngôn ngữ,
  `#hero-go`→`/hoc/`, rail ≥10 bài, **`#roadmap-title` nằm trọn trong màn hình đầu**, Enter → `/hoc/`.
- **7b** lặp lại phép đo trên ở 1366×768 (màn laptop phổ biến nhất).
- **11b** cả 9 URL en/ja cũ phải dừng ở đúng trang tiếng Việt, `lang="vi"`, không 404.

## Còn lại
- Phase 5 rút gọn: không còn `curriculum.en.js`/bài en/ja nữa. Còn huy hiệu, service worker, âm click.
- `hands.js`/`keyboard-widget.js` vẫn dùng ở `/hoc/`, `/luyen-tu-do/`, `/tien-do/` — không đụng tới.
- Ghi chú lịch sử trong `PLAN.md` (dòng 94, 550, 596) và các mục DECISIONS.md cũ vẫn nhắc en/ja; giữ
  nguyên làm nhật ký, mục này là trạng thái mới nhất.
- `activeLanguage`, `siteLanguages`, `translations`, `coachTrendHint` còn tên trong `script.js` nhưng
  không còn ai đọc — dọn nốt khi tiện.

---

# 2026-09-16/17 — MỘT BỘ TOKEN CHO TOÀN BỘ CSS (ghi bù ngày 18/09)

Ba commit `97764b0` → `caff911` → `1fa2ef9` làm xong trước khi mục này được viết; chi tiết số liệu
nằm trong chính thông điệp commit, đây là phần quyết định.

## Vì sao
CSS đã thành ba tầng chồng nhau: `style.css` của landing page cũ, `keyboard.css` vá lên nó, rồi CSS
từng trang phủ lên trên. `keyboard.css` chỉ nạp ở 4/11 trang → nửa site chạy trên nền CHƯA vá, và đó
là lý do thật sự của việc "mỗi trang trông hơi khác nhau" — không phải do thiếu chăm chút từng trang.

## Quyết định
1. **`tokens.css` là nguồn duy nhất của màu, bo góc, bóng, cỡ chữ.** Quy ước cứng: không trang nào
   được khai báo màu mới — thiếu thì thêm token. 193 mã màu → 89, và phần còn lại đều có nghĩa
   (bảng phím mượn của typing.com, tông da bàn tay, thang nhiệt heatmap, màu cảnh báo).
2. **`style.css` chết hẳn**, phần còn sống chuyển sang `base.css` viết mỗi rule một dòng.
3. **Ba ngưỡng đáp ứng cho cả site: 620px, 900px, 901px.** Các cặp lệch một pixel (900/899, 600/599)
   là nguồn của lỗi "ở đúng 900px bàn tay bị cắt" — JS vẽ tay từ 900px trong khi CSS đã bỏ padding
   đáy từ 899px.
4. **Gộp file cùng khai báo một selector**: `coach.css` → `tien-do/progress.css`, `test-upgrade.css`
   → `test.css`. Đọc một file phải đủ biết khối đó trông thế nào.

## Còn lại
- Vài màu literal vẫn nằm trong `tien-do/progress.css` (`#4c6b5f`, `#e5f5df`, `#8ba396`) tuy token
  tương ứng (`--ink-soft`, `--surface-active`, `--muted-soft`) đã có. Đổi nốt khi động vào file.

---

# 2026-09-18 — PHASE 5: HUY HIỆU, SERVICE WORKER, ÂM CLICK, DỌN `script.js`

Phase 5 theo PLAN.md, đã trừ phần en/ja (bỏ từ 16/09). Bốn việc, không việc nào đụng vào engine gõ.

## 1. Huy hiệu (`badges.js` → `/tien-do/`)
- 10 huy hiệu, luật `{field, operand, value}` đúng như PLAN.md: bài đầu tiên · xong một unit ·
  30 sao · 90 sao · 3 ngày · 7 ngày · 40 WPM sạch · 60 WPM sạch · 5.000 phím · gõ được dấu.
- **Không có kho dữ liệu riêng.** `evaluate()` đọc lại chính ba nguồn mà trang tiến độ đang hiện
  (TypingEaseProgress, TypingEaseProfile, mục tiêu ngày) rồi so với bảng luật, nên huy hiệu không
  bao giờ lệch với con số ngay bên cạnh nó. Thứ duy nhất được lưu (`typingease-badges-v1`) là NGÀY
  mở khoá lần đầu — số liệu gốc không nhớ nổi mốc đó.
- **"40 WPM sạch" đo trên MỘT lượt**: max(wpm) của các lượt có accuracy ≥ 95, chứ không ghép
  max(wpm) của lượt này với max(accuracy) của lượt kia — ghép thế là tặng huy hiệu cho việc chưa ai
  làm được.
- **Huy hiệu chưa đạt vẫn hiện đủ tên + điều kiện + thanh tiến trình** ("60 / 90"). Giấu đi thành
  "???" chỉ gây tò mò đúng một lần rồi thành bực.
- Nút "Xoá lịch sử" nay xoá luôn `typingease-daily-goal-v1`. Trước đây nó chừa streak lại, mà hộp
  xác nhận thì viết "Xoá toàn bộ tiến độ và thành tích trên thiết bị này" — và huy hiệu chuỗi ngày
  sẽ đứng trơ một mình sau khi mọi thứ khác biến mất.

## 2. Service worker (`sw.js` + `sw-register.js`, nạp ở cả 11 trang)
- **Không precache cả site.** Site tĩnh, người dùng chỉ đi vài trang; tải sẵn 35 file bài cho người
  mới vào là tiêu băng thông của họ. PRECACHE đúng 9 file đủ mở trang chủ + vào học.
- **Mọi thứ đi mạng trước, cache chỉ là lưới đỡ khi mạng đứt** (sửa chiều cùng ngày, `sw.js` v2).
  Bản v1 cho CSS/JS đi cache-trước-cập-nhật-nền để vào bài nhanh hơn; cái giá là MỘT lần nạp thấy
  bản cũ sau mỗi lần deploy. Ngay chiều hôm đó nó đánh lừa đúng chủ site: sửa `base.css` xong, tải
  lại, vẫn thấy giao diện cũ và tưởng code sai. Người dùng thật cũng gặp đúng cảnh ấy, chỉ khác là
  họ không có cách nào để nghi ngờ. Tệ hơn: HTML mạng-trước ghép với CSS cache-trước nghĩa là trang
  MỚI có thể dính CSS CŨ. Tốc độ gần như không mất: `fetch()` trong service worker vẫn đi qua HTTP
  cache của trình duyệt nên lần thứ hai thường chỉ là một cú 304.
  Ngoại lệ duy nhất là font Google — URL bất biến nên cache trước, và lưu cả response opaque để
  trang offline còn đúng font.
- **Trang chưa từng mở mà mất mạng → trang offline tự chứa (503)**, KHÔNG phục vụ bản cache của
  trang chủ dưới URL đó: trang chủ dùng đường dẫn tương đối nên đặt nó ở `/luyen-phim-yeu/` là mọi
  liên kết lệch một cấp, vừa vỡ giao diện vừa nói dối người dùng về chỗ họ đang đứng.
- Đổi `VERSION` trong `sw.js` là dọn sạch cache cũ ở lần activate kế tiếp.

## 3. Âm click + phím tắt (`sound.js`, `player.js`, `hoc/index.html`)
- **Mặc định TẮT.** Người học mở site ở lớp, ở quán, ở văn phòng.
- WebAudio tổng hợp tại chỗ, không `<audio src>`: một cú click dài 30 ms mà tải file thì vừa thêm
  request vừa trễ so với phím bấm. Đúng/sai là hai xung khác nhau (cao-gọn / trầm-đục).
- Hai công tắc trong topbar player: 🔊 âm click, ✋ bàn tay động — đóng luôn nợ "chưa có UI cho
  `animatedHands`". Cả hai nhớ qua localStorage; mặc định của mỗi cái nằm ở phía ít làm phiền hơn
  (âm tắt, tay động bật như typing.com).
- **Phím tắt phải đi kèm Alt**: mọi phím trần đều là ký tự cần gõ, Ctrl/Cmd thuộc về trình duyệt.
  Alt+S âm · Alt+H tay · Alt+R làm lại bài.

## 4. Dọn `script.js` (−77 dòng)
Xoá hẳn di sản engine 30 bài cũ: `lessons`, `lessonSecondLines`, `translations`, `siteLanguages`,
`activeLanguage`, `homeActionText`, `weakKeyUi`, `coachUi`, `coachTrendHint`, `dailyGoalUi`, `rows`,
`fingerMap`, `localizedLessonName`. Không file nào còn gọi tới (mỗi trang mới có bảng chuỗi riêng).
Còn đúng `localizedUi`, `currentLocalizedUi`, `formatUi` vì trang chủ thật sự dùng.

## 5. Nav của topbar về chính giữa (chiều 18/09)
`.topbar` từ `flex + space-between` sang lưới `1fr auto 1fr`. Với space-between, vị trí nav phụ
thuộc việc trang đó có nút CTA bên phải hay không — trang chủ không có nên nav dạt hẳn sang phải,
lệch hẳn so với các trang khác.
**Cột phải đặt TƯỜNG MINH, không dựa vào thứ tự.** Topbar có ba hình dạng (logo+nav, logo+nav+CTA,
logo+`← Trang chủ`); lưới xếp theo thứ tự nên phần tử thứ hai rơi vào cột giữa — đúng cho nav, sai
cho link `← Trang chủ` của 6 trang, và nó đã bị kéo vào giữa đúng một lần trước khi có test 20.
Dưới 900px nav ẩn, topbar quay lại flex để nút CTA về sát mép phải.

## Kiểm định
- `scripts/e2e.js` **27/27 PASS** (23 cũ + 4 mới: huy hiệu, công tắc, service worker, topbar).
  `PW=<…>/node_modules/playwright-core node scripts/e2e.js http://127.0.0.1:8765`
- `scripts/offline-check.js` **3/3 + 1 PASS** — script MỚI, tự dựng server rồi tự giết để mất mạng thật:
  bài đã học vẫn gõ được (60 phím, CSS về đủ), trang chủ vẫn mở, trang chưa mở ra đúng trang 503.
- `scripts/validate-lessons.js` PASS (289 screen, 15.311 ký tự) — không đụng nội dung, chạy cho chắc.
- Huy hiệu đo ở 390px và 820px: 0 px tràn ngang.

## Cạm bẫy mới
10. **`context.setOffline(true)` VÀ `context.route(..., route.abort())` của Playwright đều KHÔNG với
    tới fetch do service worker phát ra** (Chromium + playwright-core 1.49, đo 18/09/2026). Trang
    vẫn tải sống nhăn qua mạng và bài kiểm "offline" xanh lè một cách vô nghĩa — bản đầu của test 19
    "PASS" đúng theo kiểu đó. Cách trung thực duy nhất là **tắt hẳn server**, nên phần offline tách
    ra `scripts/offline-check.js` (nó sở hữu server của chính nó). Đừng gộp lại vào e2e.js.
11. **Service worker không chạy trong `launchPersistentContext` headless** (`serviceWorker.ready`
    treo vô hạn, `controller` = null) trong khi `chromium.launch()` + `newContext()` thì chạy bình
    thường. Muốn kiểm service worker thì dùng context thường.
12. **Cache-trước cho CSS/JS là cái bẫy tự đặt cho chính mình** — xem mục service worker ở trên.
    Đã bỏ (v2 đi mạng trước). Bài học rộng hơn: một chiến lược cache mà người sửa code không nhận
    ra là nó đang bật thì sẽ có ngày làm mất cả buổi để đi tìm một lỗi không tồn tại.
    `scripts/offline-check.js` nay có một phép đo giữ điều đó: hai lần gọi cùng một URL khi còn
    mạng phải ra hai giá trị khác nhau.
    Máy nào đã dính bản v1: tải lại một lần nữa là xong, hoặc Ctrl+Shift+R.
13. **`glob.glob()` trên Windows trả về đường dẫn có `\`**, nên `'/' in path` luôn False → script vá
    HTML đã chèn `src="sw-register.js"` (thiếu `../`) vào 3 trang con và chúng 404. E2E bắt được
    ngay ở test 10. Chuẩn hoá `p.replace(os.sep, '/')` trước khi kiểm tra đường dẫn.

## Còn lại
- Huy hiệu chỉ hiện ở `/tien-do/`; chưa có thông báo "vừa mở khoá" ngay trong player.
- Âm click chỉ có ở player `/hoc/`; `/luyen-tu-do/` và `/kiem-tra-toc-do-go/` chưa gọi `sound.click()`.
- `sw.js` chưa có thông báo "đã có bản mới, tải lại?" — mới chỉ có `postMessage('skip-waiting')`.
- Tông da bàn tay vẫn hơi nâu hơn gốc (từ 16/09, chưa động tới).

---

# 2026-09-18 (chiều) — Thay bàn phím + bàn tay bằng bản port từ typekute

Yêu cầu: **xoá toàn bộ bàn phím và bàn tay của dự án, thay bằng `cell js-keyboard-holder well` của
typekute** (bản clone typing.com nằm ở `../typekute`). Ba lựa chọn được chốt trước khi viết code:
copy đầy đủ stack 3D, lấy cả catalog 119 bố cục kèm nút Cài đặt, và **đổi hẳn sang API của
typekute** thay vì giữ vỏ `TypingEaseKeyboard` cũ.

## Đảo một quyết định cũ — và vì sao
`PLAN-ban-tay.md` (15/09) ghi: **không copy** `hand-default.compressed.gltf`, `base-1.jpg`,
`highlight-*.png` vì là tài sản của Teaching.com, và tự vẽ lại bàn tay bằng SVG. Quyết định đó nay
bị đảo theo yêu cầu của chủ dự án: các file trên đã được copy vào `assets/hands-3d/`, kèm
`three.module.min.js` + GLTFLoader + SkeletonUtils + BufferGeometryUtils vào `vendor/three/`.
Rủi ro bản quyền vẫn nguyên như mô tả cũ; nó chỉ được **chấp nhận**, không biến mất. Bản SVG tự vẽ
(`hands.js`, `hands.css`) đã bị xoá, muốn quay lại thì lấy từ git.

## Đã xoá
`keyboard-widget.js`, `hands.js`, `keyboard.css`, `hands.css` — cùng với chúng là mô hình DOM cũ
(`.key[data-pkey]`, `.hand-layer .finger[data-finger]`, `.ghost-hand`, `active-key`,
`active-finger`, `glow-full`, `--hand-speed`) và bản bàn phím compact cho điện thoại.

## Đã thêm
- `keyboard/keyboard.js` — port gần như nguyên văn `11ty/client/player/keyboard.js` của typekute:
  dựng DOM từ layout, `data-entry` làm định danh phím, `resolveKeyTarget` (shift/AltGr/phím chết),
  index + cache cho mỗi board, `highlightErrorKey` 250 ms. Chỉ đổi: liên kết Cài đặt dùng SVG nội
  tuyến thay cho sprite của họ, và nhãn tiếng Việt.
- `keyboard/hands-3d.js`, `hands-pose-map.js`, `gltf-unpack.js` — port, chỉ sửa đường dẫn import và
  đường dẫn asset. Thêm một đoạn: `prefers-reduced-motion` thì tay nhảy thẳng tư thế, không tween.
- `keyboard/preferences.js` — kho tuỳ chọn + hộp thoại Cài đặt, dựng lại bằng `.card` của player.css
  thay cho bộ modal/switch trong stylesheet vendor (giữ nguyên bộ luật phụ thuộc giữa các công tắc).
  Bản ghi cũ `typingease-hands-v1` được nuốt vào `typingease-keyboard-v1` ở lần đọc đầu tiên.
- `keyboard/keyboard.css` — lọc từ 745 KB CSS vendor xuống còn phần bàn phím + lớp tay, cộng khối
  `finger-theme` (5 màu ngón, `--fk` theo `key-<mã ký tự>`, nhá màu 2 giây qua `@property --fng-peek`).
- `keyboard/ready.js` + `keyboard/boot.js` — cầu nối: module chạy sau mọi `<script src>` thường nên
  player.js không thể đọc `window.NTKeyboard` ngay; `ready.js` dựng sẵn một lời hứa để chờ.
- `data/keyboards/` — catalog cắt nhỏ: `index.json` (16 KB, để đổ danh sách) + `layouts/<id>.json`
  (~4 KB mỗi bố cục). Nguồn 485 KB nạp một lần cho MỘT bàn phím là phí; `scripts/build-keyboards.mjs`
  cắt lại khi cần cập nhật.

## Ba trang dùng nó, ba kiểu khác nhau
| Trang | Bàn tay | Nhá màu ngón | Ghi chú |
|---|---|---|---|
| `/hoc/` | có (tắt ở ≤620px) | có | công tắc ✋ = `animatedHands` |
| `/luyen-tu-do/` | có (≥900px) | có | |
| `/tien-do/` | không | không | heatmap tự tô màu theo độ chính xác; hai lớp màu chồng nhau thì không đọc được lớp nào |

## Lệch có chủ ý so với bản gốc
- **Bỏ vòng viền quanh phím đích.** Bản gốc kẻ `0 0 0 2px var(--fk-line)` cho dễ thấy giữa lúc nhá
  màu; chủ dự án thấy rối mắt đúng ở chỗ phải nhìn nhất. Giữ lại bóng đổ + màu đậm hơn hàng xóm.
- **Chip "phím mới"** (`is-new`) không có trong bản gốc — họ dạy phím mới bằng màn hình riêng. Ở đây
  là một mảng màu ngón nhạt, không viền.
- **`pressKey`** (nhún phím khi gõ đúng): keyframe `keyPressDefault` có sẵn trong CSS vendor nhưng
  player của họ không gọi; player ở đây có gọi nên hàm này nằm ở `boot.js`, ngoài file port.
- **Bàn tay không với tới Shift.** Bản cũ cho ngón út tay kia chạy tới phím Shift; bảng tư thế của
  typekute chỉ có tư thế cho phím đích, nên giờ chỉ bàn phím chỉ ra Shift nào phải giữ.
- **Tắt "Hiện bàn phím" không được nuốt luôn nút Cài đặt.** Bản gốc cho cả board `display:none`, mà
  liên kết Cài đặt lại nằm BÊN TRONG board — người học tự khoá mình ra ngoài, không còn cách nào bật
  bàn phím trở lại trừ khi xoá localStorage. Ở đây `.keyboard.hide` chỉ giấu hàng phím và lớp tay,
  còn liên kết về dạng viên thuốc căn giữa (chính hình dạng mà lớp `.keyboard-link--hidden` của
  stylesheet vendor mô tả). Test 17b canh đúng điều này: ẩn → liên kết vẫn đo được bề rộng → bấm vào
  đó bật lại được 60 phím.

## Kiểm định
- `scripts/e2e.js` **29/29 PASS** (`PW=<…>/playwright-core CHROME=<…> node scripts/e2e.js http://127.0.0.1:8765`).
  Năm phép kiểm về tay viết lại: tư thế không còn DOM để đo nên chúng đọc `board.dataset.finger`,
  `board.__ntHands.pose` và gọi thẳng `resolveHandSlots` của bảng tư thế; thêm test 17 cho hộp thoại
  Cài đặt (đổi bố cục sang British (PC) rồi dựng lại board).
- `scripts/offline-check.js` **3/3 + 1 PASS** — bài đã học vẫn gõ được khi tắt server.
- Chụp ở 1440px và 390px, cả ba trang: không tràn ngang, `cell js-keyboard-holder well` đúng như tên.

## Cạm bẫy mới
14. **WebGL trong headless cần cờ riêng.** Không có `--use-gl=angle --use-angle=swiftshader
    --enable-unsafe-swiftshader` thì `mountTypingHands` ném lỗi, lớp tay im lặng rơi về ảnh 2D rỗng,
    và mọi phép kiểm về tay xanh một cách vô nghĩa. Cờ đã đặt trong `scripts/e2e.js`.
15. **Module script chạy sau mọi script thường**, kể cả script khai báo `const NT = window.NTKeyboard`
    ở thân IIFE. Đó là lý do có `keyboard/ready.js`; đừng gộp nó vào `boot.js`.
16. **Mỗi bàn phím giữ một WebGL context** và Chrome chỉ cho 16 context mỗi tab rồi âm thầm giết cái
    cũ nhất (tay biến mất giữa bài). `hands-3d.js` gọi `forceContextLoss()` khi huỷ; player gọi
    `board.__ntHands.destroy()` ở `pagehide`. Đừng dựng bàn phím mới cho mỗi screen.
