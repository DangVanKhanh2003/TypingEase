# KẾ HOẠCH THIẾT KẾ LẠI TYPINGEASE (go10ngon)

> Deliverable: kế hoạch thi hành, chưa code. Mọi quyết định dưới đây đã CHỌN một hướng; các câu hỏi
> chưa chốt được gom ở mục cuối (tối đa 5).

---

## 0. Chẩn đoán hiện trạng (đã đọc code + screenshot thật)

| Vấn đề | Bằng chứng | Hậu quả |
|---|---|---|
| Không có điểm vào | Trang chủ đổ liên tiếp: hero → mục tiêu ngày → coach → rail 30 bài → ô gõ → bàn phím → tự do → game → bảng thành tích → benefits → explore. Trên mobile ô gõ nằm ở ~1500px. | Người mới không biết click gì; ô gõ (giá trị cốt lõi) ở dưới 4 khối. |
| Bài học = 1 khối text | `script.js:1` `lessons = [[tên, chuỗi]]`, 30 bài, mỗi bài 2 dòng nối bằng `\n`. Không intro, không phím mới, không screen, không min_accuracy. | Không có tiến trình sư phạm; bài 1 đã yêu cầu gõ `asdf jkl;` 8 phím cùng lúc. |
| Nội dung tiếng Anh | Từ bài 9 trở đi toàn từ tiếng Anh (`sad fall ask dad`, `the quick brown fox`). | Không phục vụ người gõ tiếng Việt. |
| Coach card ô trống | `coach.css` `.coach-body{grid-template-columns:1fr 190px}` — cột phải là SVG trend luôn render dù chưa có attempt (screenshot: khối xám rỗng). | Trông như lỗi. |
| Ghost hands quá mờ | `hands.js` gradient `#c6ddd2 → #ffffff → #eef6f2`, `.ghost-hand{opacity:.88}` trên nền phím trắng `#fff`/`#edf4f0`. | Không nhìn ra bàn tay, mất giá trị dạy ngón. |
| Mobile tràn ngang | Screenshot 390px: mode-switch, nút mục tiêu, card bài bị cắt bên phải. | Trải nghiệm mobile hỏng. |
| Monolith | `script.js` 590 dòng/85KB, 9 bảng chuỗi i18n rời rạc (`translations`, `siteLanguages`, `homeActionText`, `localizedUi`, `weakKeyUi`, `coachUi`, `dailyGoalUi`...), `applyLanguage()` sửa DOM bằng querySelector theo thứ tự. | Sửa một chỗ vỡ chỗ khác. |
| Tài sản tốt cần giữ | `profile.js` (per-key accuracy, level, recommendNext), `weak-keys.js`, `hands.js` (hình học tay), keyboard heat, daily goal/streak, trang test 60s có biểu đồ tiến bộ, SEO articles. | Tái sử dụng, không viết lại. |

Bài học từ typing-clone (đã đọc 33075, 33076, 33077, 33079, 33086, 33220, 33246, 33094, 33375, 33389, 319, 33093 và screenshot player):
- Mỗi bài dạy **2-3 phím mới**, 9-16 screens, xen kẽ `block` (drill phím mới) → `falling`/`keyboard-jump` (game ngắn) → `standard` (chữ/từ) → lại game → `standard`.
- Có `min_accuracy` (70 bài đầu, 80 về sau), intro/congrats mỗi bài, intro ngắn trên một số screen ("gõ dấu phẩy bằng ngón giữa phải, luôn quay về K").
- Unit chia **group** ("Starting Out / Reaching Out / The Home Stretch / Wrapping Up"), có **Review** giữa unit, **Personalized Practice** (`settings.problem_keys`), **Assessment** (`time_limit: 60`) cuối unit.
- Player là **focus mode**: chỉ topbar (← · tên bài · Screen x/y · Redo), text to, bàn phím + tay đặc, phím đích xanh. Stats ẩn khi gõ, hiện sau screen kèm sao + Continue; progress bar phân đoạn theo screen.
- Phát hiện riêng cho tiếng Việt: các phím **J F S R X W** (dạy đầu tiên ở typing.com vì là phím cơ sở) chính là **phím bỏ dấu Telex** (j nặng, f huyền, s sắc, r hỏi, x ngã, w ư/ơ/ă). Thứ tự này hợp người Việt hơn cả người Anh.

---

## A. ONBOARDING — "mở web ra biết ngay phải làm gì"

### A1. Ba hướng đã cân nhắc

| Hướng | Ưu | Nhược |
|---|---|---|
| (1) Hỏi trình độ trước (3 nút: Chưa biết / Biết chút / Đã gõ 10 ngón) | Xếp lớp được | Người mới không tự đánh giá được; thêm 1 màn hình trước khi thấy giá trị; 70% người chọn "biết chút" rồi bỏ. |
| (2) CTA đơn nhất "Bắt đầu bài 1" | Rõ | Vẫn cần click + scroll; hero hiện tại đã có nút này mà vẫn không hiệu quả vì ô gõ nằm xa. |
| (3) **Gõ thử ngay** — ô gõ là hero, phím bấm đầu tiên là hành động đầu tiên | Không cần click, không cần đọc; 5 giây đầu đã thấy phím sáng, tay di chuyển; đo được WPM để xếp lớp ngầm | Phải làm hero gõ được thật (focus, bàn phím ảo), khó hơn về kỹ thuật; cần xử lý mobile (không có bàn phím vật lý). |

**CHỌN (3) "Gõ thử ngay", kết hợp xếp lớp ngầm sau dòng gõ thử.** Lý do: sản phẩm là hành động gõ, không phải đọc; hero hiện tại là marketing copy chiếm cả viewport mà không gõ được. Mobile fallback: hero hiển thị 1 nút to "Chạm để gõ thử" (mở bàn phím ảo) — chấp nhận 1 tap.

### A2. Timeline người mới (chưa có localStorage)

| Mốc | Người dùng thấy | Người dùng làm | Hệ thống |
|---|---|---|---|
| 0-5 s | H1 ngắn "Luyện gõ 10 ngón online miễn phí" + ngay dưới là **1 dòng gõ thử** `jjj fff jjj fff jf fj` cỡ 28px, con nhấp nháy ở ký tự đầu, bàn phím thu gọn (3 hàng chữ + Space) với **J sáng** và **tay phải trỏ vào J**, dòng chỉ dẫn "Đặt hai ngón trỏ lên F và J (có gờ nổi), rồi gõ chữ đang sáng". Không có nút nào khác cạnh tranh ngoài 1 link nhỏ "Tôi đã biết gõ 10 ngón → kiểm tra 60 giây". | Đặt tay, gõ phím J | Input ẩn autofocus khi trang load (desktop). Phím sáng + ngón nhích theo từng ký tự. |
| 5-30 s | Dòng gõ thử ~20 ký tự xong trong 10-20 s. Hiện **kết quả mini** ngay tại chỗ: "✓ 100% chính xác · 18 WPM". Bên dưới đổi thành **1 CTA chính** theo kết quả (xem A3). | Nhấn Enter hoặc click CTA | Ghi attempt `kind:'taster'`. Quyết định nhánh. |
| 30-60 s | Vào **lesson player** (trang `/hoc/`), Bài 1 screen 1: intro phím J (ảnh bàn phím + ngón trỏ phải sáng, 2 câu), nút "Bắt đầu gõ" hoặc nhấn J. | Gõ screen 1 (block `jjjj jjjj`) | Sau screen: sao + Tiếp tục (Enter). Tiến độ lưu localStorage theo `lessonId/screenIndex`. |
| Phút 1-6 | Xong bài 1 (10 screens, ~5 phút) → màn hình kết quả bài, "Bài 2: D và K" + lộ trình unit 1 hiện 1/10. | Tiếp tục hoặc về trang chủ | Trang chủ giờ ở trạng thái "người quay lại". |

### A3. Xếp lớp ngầm sau dòng gõ thử

```
taster WPM < 25 hoặc acc < 90   →  CTA: "Bắt đầu Bài 1 · J, F và dấu cách (5 phút)"   [mặc định]
taster WPM 25-45, acc ≥ 90      →  CTA: "Bắt đầu Bài 1"  + phụ: "Bạn gõ khá rồi — nhảy tới Unit 2 (mở rộng bàn phím)?"
taster WPM > 45, acc ≥ 95       →  CTA: "Kiểm tra 60 giây để xếp lớp" + phụ: "Hoặc học từ Bài 1"
```
Không hỏi câu nào. Dòng gõ thử là chính screen 2 của Bài 1 (không tạo nội dung riêng), nên nếu chọn Bài 1 thì screen đó được tính là đã xong.

### A4. Người quay lại (có localStorage)

Hero thay bằng **Continue card** (không còn copy marketing):

```
┌──────────────────────────────────────────────────────────────┐
│ TIẾP TỤC                                        🔥 3 ngày     │
│ Bài 4 · D, E và I                    screen 5/11  ▓▓▓▓░░░░░░ │
│ "Phím E — ngón giữa trái với lên"                            │
│ [ ▶ Tiếp tục (Enter) ]   Làm lại bài   Xem lộ trình          │
│ Hôm nay: 4/10 phút ▓▓▓▓░░░░░░                                │
└──────────────────────────────────────────────────────────────┘
```
- Nhấn **Enter bất kỳ đâu trên trang chủ** = Tiếp tục. Click card = Tiếp tục.
- Nếu `profile.recommendNext()` trả `weak`/`review`, hiện **1 dòng gợi ý phụ** dưới card ("Coach: phím R, U đang kéo bạn xuống — luyện 1 phút?"), không thay thế CTA chính. Lý do: người dùng luôn phải thấy "tiếp tục bài X" trước, gợi ý là thứ hai.
- Nếu đã xong toàn bộ giáo trình: card đổi thành "Duy trì phong độ" → Kiểm tra 60s / Luyện phím yếu / Luyện tự do.

---

## B. KIẾN TRÚC THÔNG TIN + GIAO DIỆN

### B1. Sơ đồ trang

Giữ nguyên mọi URL đang có trong `sitemap.xml`. Thêm 4 URL mới (vi) + bản en/ja tương ứng ở phase sau.

```
/                         Trang chủ: gõ thử (mới) | continue card (quay lại) + lộ trình rút gọn + SEO copy    [GIỮ]
/hoc/                     LESSON PLAYER (focus mode). Route bằng hash: /hoc/#u1-l01/3  (bài u1-l01, screen 3)   [MỚI]
/bai-hoc/                 Lộ trình đầy đủ: unit → group → bài, tiến độ, sao. HTML tĩnh (SEO) + JS tô tiến độ      [MỚI]
/tien-do/                 Tiến bộ: bảng thành tích, heatmap phím, biểu đồ, streak, huy hiệu                       [MỚI]
/luyen-tu-do/             Luyện tự do (dán đoạn văn / ngẫu nhiên) — chuyển từ tab "Tự do" ra trang riêng          [MỚI]
/kiem-tra-toc-do-go/      Test 15/30/60/120s (đã có) — hấp thụ luôn "Trò chơi 30s"                              [GIỮ]
/luyen-phim-yeu/          Luyện phím yếu (đã có) — trở thành entry của lesson "Luyện phím yếu" trong player       [GIỮ]
/cach-go-10-ngon/ ...     4 bài SEO vi, 4 en, 3 ja                                                                [GIỮ]
/en/, /ja/                Trang chủ bản ngữ (cùng cấu trúc) ; /en/learn/, /ja/learn/ = player                    [GIỮ + MỚI]
```

Vì sao player ở `/hoc/` chứ không ở `/`: focus mode cần bỏ header/footer/sections; trang chủ vẫn cần giữ H1, copy và internal link cho SEO. Hash route (không tạo 35 thư mục × 3 ngôn ngữ) vì nội dung drill không có giá trị SEO và không phá GitHub Pages.

### B2. Cái gì bỏ / gộp / thêm

| Bỏ | Lý do |
|---|---|
| Tab "Trò chơi" 30 giây (`.game-practice`) | Trùng với test 30s ở `/kiem-tra-toc-do-go/`; screen type `burst` trong bài đã cho cảm giác game. |
| Section `benefits#huong-dan` ("Tiến bộ từng phím bấm") | Copy marketing trùng bài `/cach-go-10-ngon/`; nav "Hướng dẫn" trỏ sang bài đó. |
| Section `keyboard-lab` độc lập | Bàn phím + tay đi vào player, ngay dưới dòng chữ. |
| `tip-card` bên phải ô gõ | Nội dung mẹo trở thành `intro` screen của bài. |
| Bảng 30 bài trên trang chủ (`results#bang-xep-hang`) | Chuyển sang `/tien-do/`. |
| `hero-visual` (card nghiêng "Bài học hôm nay 03/10") | Là mock tĩnh, thay bằng ô gõ thật. |

| Gộp | Thành |
|---|---|
| daily-goal + coach + lesson-progress | 1 **status strip** mỏng trên trang chủ người quay lại (streak · phút hôm nay · level) + continue card. Coach chi tiết sang `/tien-do/`. |
| Tự do / Trò chơi / Bài cơ bản (mode-switch) | Không còn tab. Bài cơ bản = player; Tự do = trang riêng; Trò chơi = bỏ. |
| 7 bảng chuỗi i18n trong script.js | 1 file `i18n/<lang>.json` (hoặc `ui.<lang>.js`) với key phẳng `home.continue`, `player.next`... |

| Thêm | |
|---|---|
| Lesson player nhiều screen | mục B4 |
| Màn hình kết quả screen + kết quả bài | mục B5 |
| Trang lộ trình `/bai-hoc/` | mục B6 |
| Chế độ Telex cho Unit 3 | mục C |
| Huy hiệu nhẹ (8-10 cái, rule như `achievements.json`: `{field, value, operand}`) | phase 5 |

### B3. Wireframe 1 — Trang chủ NGƯỜI MỚI (desktop 1280)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ TypingEase            Luyện gõ   Lộ trình   Tiến độ   Kiểm tra tốc độ    [VI ▾] │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Luyện gõ 10 ngón online miễn phí.                     (H1, 1 dòng, 40px)      │
│   Đặt hai ngón trỏ lên F và J — hai phím có gờ nổi — rồi gõ chữ đang sáng.      │
│                                                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │  j j j   f f f   j j j   f f f   j f   f j                              │    │
│   │  ▲ (ký tự hiện tại nền vàng-lime, đã gõ xanh, sai đỏ gạch)              │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │   q  w  e  r  t  y  u  i  o  p                                          │    │
│   │    a  s  d [F] g  h [J] k  l  ;         ← J sáng xanh đậm               │    │
│   │     z  x  c  v  b  n  m  ,  .                                            │    │
│   │            [      space      ]                                           │    │
│   │      ╲╲╲╲ tay trái        tay phải ╱╱╱╱   (tay đặc, ngón trỏ phải nhấc) │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│   Chính xác 100%   ·   Bạn đang ở screen 2 của Bài 1        Đã gõ 10 ngón? →   │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  LỘ TRÌNH 35 BÀI · 4 UNIT                                        Xem tất cả →   │
│  ┌ Unit 1 · Hàng phím cơ sở ──────────────────────────────────────────────┐     │
│  │ ①J F ␣  ②D K  ③S L  ④A ;  ⑤Ôn  ⑥G H  ⑦E I  ⑧R U  ⑨Phím yếu  ⑩Kiểm tra│     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│   Unit 2 · Mở rộng bàn phím (11 bài)  🔒    Unit 3 · Tiếng Việt có dấu (8) 🔒   │
├──────────────────────────────────────────────────────────────────────────────────┤
│  3 card: Cách gõ 10 ngón · Kiểm tra tốc độ · WPM là gì   (giữ nguyên, SEO)      │
│  FAQ ngắn 4 câu (SEO)                                                            │
├──────────────────────────────────────────────────────────────────────────────────┤
│  footer                                                                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```
Sau khi gõ xong dòng thử, khối kết quả mini thay chỗ dòng "Chính xác 100% · ...":
```
   ✓ 100% chính xác · 21 WPM · 14 giây
   [ ▶ Bắt đầu Bài 1 · J, F và dấu cách — 5 phút  (Enter) ]      Kiểm tra 60 giây để xếp lớp
```

### B4. Wireframe 2 — Trang chủ NGƯỜI QUAY LẠI

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ TypingEase            Luyện gõ   Lộ trình   Tiến độ   Kiểm tra tốc độ    [VI ▾] │
├──────────────────────────────────────────────────────────────────────────────────┤
│  🔥 3 ngày liên tục   ·   Hôm nay 4/10 phút ▓▓▓▓░░░░░░   ·   Trình độ: Đang lên tay│
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │ TIẾP TỤC                                                                 │  │
│   │ Bài 4 · D, E và I                              Unit 1 · screen 5 / 11    │  │
│   │ ▓▓▓▓▓░░░░░░                                                              │  │
│   │ Screen tiếp theo: "Phím E — ngón giữa trái với lên"                      │  │
│   │                                                                          │  │
│   │ [ ▶ Tiếp tục  (Enter) ]     ↻ Làm lại bài 4      Xem lộ trình →          │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│   Coach: phím R và U đang ở 84% — luyện riêng 1 phút?  [Luyện R, U]   (tuỳ chọn)│
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  UNIT 1 · Hàng phím cơ sở                                         3/10 bài ✓     │
│  ①✓★★★ ②✓★★☆ ③✓★★★ ④● ⑤ ⑥ ⑦ ⑧ ⑨ ⑩                                             │
│  Kỹ năng gần đây: 23 WPM · 94%  ·  Mục tiêu kế tiếp 35 WPM · 96%   → Tiến độ    │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Kiểm tra tốc độ 60s   ·   Luyện phím yếu   ·   Luyện tự do    (3 card nhỏ)       │
├──────────────────────────────────────────────────────────────────────────────────┤
│  3 card SEO + footer (như người mới)                                              │
└──────────────────────────────────────────────────────────────────────────────────┘
```
Không còn coach card lớn trên trang chủ → hết vấn đề ô trống. Trend SVG chỉ vẽ ở `/tien-do/` khi `trend.length >= 3`; dưới 3 điểm hiện dòng chữ "Cần thêm 2 bài nữa để vẽ biểu đồ" thay cho khung rỗng (`coach-body` chuyển `grid-template-columns:1fr` khi thiếu dữ liệu).

### B5. Wireframe 3 — LESSON PLAYER khi đang gõ (`/hoc/#u1-l04/5`)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Lộ trình      Unit 1 › Bài 4 · D, E và I      Screen 5 / 11      ↻ Làm lại  ⚙ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░  (progress phân 11 đoạn, đoạn 5 sáng)  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   PHÍM MỚI  [E]  ngón giữa trái         (chip nhỏ, chỉ hiện khi screen có newKey)│
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  eeee dddd eeee dddd                                                     │  │
│   │  eedd eedd deed deed                                                     │  │
│   │  ee dd ▌ed de ed de                     ← 3-4 dòng, mono 26px, cách 1.9  │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  `  1  2  3  4  5  6  7  8  9  0  -  =  ⌫                                 │  │
│   │  ⇥  q  w [E] r  t  y  u  i  o  p  [  ]  \      ← E sáng xanh              │  │
│   │  ⇪  a  s  d  f  g  h  j  k  l  ;  '  ⏎          ← home keys có gạch chân  │  │
│   │  ⇧  z  x  c  v  b  n  m  ,  .  /  ⇧                                       │  │
│   │        [            space            ]                                    │  │
│   │   ▒▒▒▒ tay trái (ngón giữa với lên E)      tay phải ▒▒▒▒                 │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│   97% chính xác · 2 lỗi                          (KHÔNG hiện WPM khi đang gõ)     │
└──────────────────────────────────────────────────────────────────────────────────┘
```
Quy tắc player:
- Input là `<input>` ẩn (1×1, opacity 0) luôn focus; click bất kỳ chỗ nào trong vùng chữ → focus lại. Không dùng textarea hiển thị (bỏ "Bắt đầu gõ tại đây").
- Enter = Tiếp tục ở màn kết quả; Esc = mở menu (Làm lại / Bỏ qua screen / Về lộ trình). Backspace: cho phép sửa ký tự vừa gõ (giữ hành vi hiện tại), lỗi vẫn được tính.
- Ẩn WPM khi gõ (theo typing.com) để người mới không hoảng; hiện sau screen.
- Bàn phím + tay chỉ render ≥ 900px. 600-900px: bàn phím không tay. < 600px: xem B8.
- Sửa ghost hands: (1) tay đặc, gradient `#e6d3c4 → #f5e6da` (tông da nhạt, không xanh) hoặc tông xám xanh đậm `#9fb8ab → #c9d9d0`; (2) `stroke: rgba(21,53,43,.45); stroke-width: 1.2`; (3) `.ghost-hand{opacity:.94}`; (4) nền `.keyboard` đổi `#edf4f0 → #dfe8e3`, phím `#fff` giữ, nên tay nổi trên phím; (5) phím bị tay che vẫn đọc được vì nhóm ngón có `mix-blend-mode: multiply` hoặc opacity .8 riêng phần ngón trên hàng phím. Kiểm chứng bằng screenshot 1440px so với `fn-2-lesson-start.png`.

### B6. Wireframe 4 — Kết quả sau SCREEN và sau BÀI

Sau screen (overlay trong vùng chữ, 1.5 giây tự hiện, chờ Enter):
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Lộ trình      Unit 1 › Bài 4 · D, E và I      Screen 5 / 11      ↻ Làm lại  ⚙ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░                                        │
├──────────────────────────────────────────────────────────────────────────────────┤
│                              ★  ★  ☆                                             │
│                     Tốt lắm! 96% chính xác · 24 WPM                              │
│              Phím E chậm nhất (0,9 s/lần) — cứ để ngón giữa với lên rồi về D.    │
│                                                                                  │
│                 [ Tiếp tục → (Enter) ]      Làm lại screen                       │
│                                                                                  │
│   (bàn phím + tay giữ nguyên bên dưới, mờ 50%)                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```
Sao: 3★ ≥ 98%, 2★ ≥ 94%, 1★ ≥ `minAccuracy` của bài; dưới `minAccuracy` → không sao, nút chính đổi thành "Làm lại screen (khuyến nghị)", vẫn cho "Bỏ qua".

Sau bài:
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Lộ trình                    Bài 4 · D, E và I — HOÀN THÀNH                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│   ★ ★ ★   Bạn đã học 9 phím: J F ␣ D K S L A ; G H E I                            │
│                                                                                  │
│   ┌ Tốc độ ───┐ ┌ Chính xác ─┐ ┌ Thời gian ─┐ ┌ Sao ──────┐                      │
│   │  23 WPM   │ │   95%      │ │  5:40      │ │ 27 / 33   │                      │
│   └───────────┘ └────────────┘ └────────────┘ └───────────┘                      │
│                                                                                  │
│   Kỹ thuật cần nhớ: E và I nằm hàng trên — ngón giữa với lên rồi LUÔN về D/K.    │
│                                                                                  │
│   Phím cần luyện thêm:  [E 88%] [I 91%]        [Luyện 1 phút E, I]               │
│                                                                                  │
│   Unit 1 ▓▓▓▓░░░░░░  4/10 bài                                                    │
│   [ ▶ Bài 5 · Ôn tập hàng cơ sở (Enter) ]     ↻ Làm lại bài 4     Về trang chủ    │
└──────────────────────────────────────────────────────────────────────────────────┘
```
Nội dung "Kỹ thuật cần nhớ" = trường `congrats` của bài. Weak keys lấy từ `profile.getWeakKeys()` lọc theo phím xuất hiện trong bài.

### B7. Wireframe 5 — Trang lộ trình `/bai-hoc/`

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ TypingEase            Luyện gõ   Lộ trình   Tiến độ   Kiểm tra tốc độ    [VI ▾] │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Lộ trình gõ 10 ngón · 35 bài · 4 unit                    Đã xong 3/35 · 8★/105  │
│  [ ▶ Tiếp tục Bài 4 ]                                                            │
├────────────────┬─────────────────────────────────────────────────────────────────┤
│ UNIT           │  UNIT 1 · HÀNG PHÍM CƠ SỞ                          3/10 · 30%   │
│ ● 1 Hàng cơ sở │  Bắt đầu                                                        │
│   2 Mở rộng 🔒 │  ┌──────────────────────────────────────────────────────────┐   │
│   3 Có dấu  🔒 │  │ ① J, F và dấu cách          10 screens · 5'   ★★★  ✓    │   │
│   4 Số & tốc độ│  │ ② D và K                    11 screens · 5'   ★★☆  ✓    │   │
│                │  │ ③ S và L                    11 screens · 5'   ★★★  ✓    │   │
│ KHÁC           │  │ ④ A và ;                    11 screens · 6'   ▶ Tiếp tục │   │
│   Luyện phím   │  │ ⑤ Ôn tập hàng cơ sở          9 screens · 5'              │   │
│   yếu          │  └──────────────────────────────────────────────────────────┘   │
│   Kiểm tra 60s │  Vươn xa                                                        │
│   Luyện tự do  │  ┌ ⑥ G và H · ⑦ E và I · ⑧ R và U ──────────────────────────┐   │
│                │  Về đích                                                        │
│                │  ┌ ⑨ Luyện phím yếu (cá nhân hoá) · ⑩ Kiểm tra Unit 1 (60s) ─┐   │
│                │                                                                 │
│                │  UNIT 2 · MỞ RỘNG BÀN PHÍM  🔒 mở khi xong ⑩ (hoặc "Mở sớm")    │
└────────────────┴─────────────────────────────────────────────────────────────────┘
```
Khoá unit là mềm: luôn có link "Mở sớm" (người biết gõ không bị ép). HTML của danh sách render tĩnh từ `curriculum.vi.js` lúc build (script nhỏ) để crawler đọc được tên bài; JS chỉ tô sao/tiến độ.

### B8. Wireframe 6 — Lesson player trên MOBILE (390px)

Thực tế: điện thoại không có bàn phím vật lý → không dạy được 10 ngón, nhưng người dùng vẫn mở link từ Google. Mục tiêu mobile: (a) không hỏng, (b) vẫn gõ được bằng bàn phím ảo, (c) hướng người dùng quay lại trên máy tính.

```
┌────────────────────────────┐
│ ←  Bài 4 · D, E và I  5/11 │
│ ▓▓▓▓▓░░░░░░                │
├────────────────────────────┤
│ ⓘ Bài học thiết kế cho bàn │
│   phím máy tính. Trên điện  │
│   thoại bạn vẫn gõ thử được.│  (1 lần, đóng được, nhớ localStorage)
├────────────────────────────┤
│ PHÍM MỚI [E] · ngón giữa   │
│ trái                       │
│                            │
│  eeee dddd                 │
│  eedd ▌eedd                │  ← 2 dòng/lần, 22px, tự cuộn
│                            │
│  ┌──────────────────────┐  │
│  │  q w [E] r t y u i o p│  │  ← chỉ 3 hàng chữ + space,
│  │   a s d f g h j k l ; │  │     không tay, cao 110px
│  │    z x c v b n m , .  │  │
│  └──────────────────────┘  │
│  96% · 1 lỗi               │
│                            │
│ [ Chạm để gõ ]             │  ← focus input ẩn, mở bàn phím ảo
│  (bàn phím ảo hệ thống      │
│   chiếm nửa dưới)          │
└────────────────────────────┘
```
- Sửa tràn ngang hiện tại: `.mode-switch`, `.daily-goal-options`, `.lesson-levels` chuyển `flex-wrap`/`grid auto-fit`; `.key-row{min-width:480px}` chỉ áp dụng ≥ 600px.
- Không autofocus trên mobile (bàn phím ảo bật ngay gây khó chịu); nút "Chạm để gõ" cố định đáy.
- `autocapitalize=off autocorrect=off spellcheck=false inputmode=text` trên input ẩn.

### B9. Hệ thống giao diện (giữ brand hiện tại)

- Màu giữ: `--green #157a55`, `--lime #c8f05a`, `--ink`, `--cream`. Thêm `--key-bg #dfe8e3`, `--hand #e9d7c8`, `--star #f4b400`, `--danger #d35757`.
- Font giữ Be Vietnam Pro + DM Mono. Cỡ chữ prompt player: 26px desktop / 22px mobile, line-height 1.9, `letter-spacing .04em`.
- Component mới: `player-topbar`, `progress-segments`, `prompt-lines`, `key-chip`, `star-row`, `result-card`, `continue-card`, `lesson-row`, `unit-card`, `status-strip`.
- CSS tách file theo trang: `style.css` (base), `home.css`, `player.css`, `curriculum.css`, `progress.css`. `keyboard.css` + `hands.css` giữ, sửa màu.

---

## C. NỘI DUNG BÀI HỌC

### C1. Nguyên tắc sư phạm (học từ typing.com, viết lại cho tiếng Việt)

1. Mỗi bài 2 phím mới (typing.com dạy 3; ta chọn 2 để bài ngắn ~5 phút, phù hợp mục tiêu 10 phút/ngày). Bài ôn và bài kiểm tra không có phím mới.
2. Thứ tự phím theo **ngón đối xứng** (dạy cùng ngón hai tay: D-K, S-L, E-I, R-U...) để cơ tay nhớ nhanh, đồng thời **ưu tiên phím Telex** (j f s r x) và phím tần suất cao tiếng Việt (n h t c g a i o u e m).
3. Trình tự screen trong bài dạy phím: `intro(phím 1) → block(phím 1) → intro(phím 2) → block(phím 2) → burst → block(kết hợp) → standard(chữ) → burst → standard(từ không dấu) → standard(từ + tất cả phím đã học)`.
4. Có review sau mỗi 4 bài, personalized practice (phím yếu) và assessment (60 s) cuối unit.
5. Nội dung từ/câu: **tiếng Việt không dấu** trong Unit 1-2 (vì mới học ≤ 20 phím, chưa có phím dấu); **tiếng Việt có dấu (Telex)** từ Unit 3; số/ký hiệu/đoạn văn Unit 4. Không dùng từ tiếng Anh trừ loanword quen (wifi, zalo, email, web).
6. Mọi text tự viết. Không lấy content của Teaching.com.

### C2. Cây giáo trình: 4 unit · 35 bài

**Unit 1 — Hàng phím cơ sở** (10 bài, ~50 phút, minAccuracy 75 → 80)

| # | id | Tên bài | Phím mới | Group | Screens | Ví dụ nội dung tự viết |
|---|---|---|---|---|---|---|
| 1 | u1-l01 | J, F và dấu cách | j f ␣ | Bắt đầu | 10 | `jjjj ffff` · `jf fj jjf ffj` |
| 2 | u1-l02 | D và K | d k | Bắt đầu | 11 | `dk kd` · `jdk fkd` · "kd dj fk" |
| 3 | u1-l03 | S và L | s l | Bắt đầu | 11 | `sl ls` · `sad lad` · "la sa da" |
| 4 | u1-l04 | A và ; | a ; | Bắt đầu | 11 | `a; ;a` · "la da sa ka;" · "as la; sa la;" |
| 5 | u1-l05 | Ôn tập hàng cơ sở | — | Bắt đầu | 8 | tất cả `asdf jkl;` · "la da sa; ka la" |
| 6 | u1-l06 | G và H | g h | Vươn xa | 11 | `fg gf jh hj` · "ga ha la da" · "sa ha; ga la" |
| 7 | u1-l07 | E và I | e i | Vươn xa | 11 | `de ed ki ik` · "hai lai kia de he si" |
| 8 | u1-l08 | R và U | r u | Vươn xa | 11 | `fr rf ju uj` · "ra ru sau dau lau hu" |
| 9 | u1-l09 | Luyện phím yếu | (cá nhân) | Về đích | 1 (120 s) | sinh từ `profile.getWeakKeys()` trong tập phím đã học |
| 10 | u1-l10 | Kiểm tra Unit 1 | — | Về đích | 1 (60 s) | "hai dua sau ra khe da; la kia hu..." |

**Unit 2 — Mở rộng bàn phím** (11 bài, minAccuracy 80)

| # | id | Tên bài | Phím mới | Group | Screens | Ví dụ |
|---|---|---|---|---|---|---|
| 11 | u2-l01 | T và Y | t y | Bắt đầu | 11 | "ta tu tay hay say tre the thu" |
| 12 | u2-l02 | O và W | o w | Bắt đầu | 11 | "to so do toi doi hoi soi kho" · w: "web wifi" + giới thiệu w = ơ/ư/ă sau này |
| 13 | u2-l03 | C và N | c n | Bắt đầu | 12 | "con can nan cau nha nho canh sach cach" |
| 14 | u2-l04 | M và V | m v | Bắt đầu | 11 | "me ma mua vui ve va voi mot nam tam" |
| 15 | u2-l05 | Ôn tập 20 phím | — | Bắt đầu | 8 | câu không dấu: "toi di hoc luc sau gio sang" |
| 16 | u2-l06 | Q và P | q p | Vươn xa | 11 | "qua quen quan phai phim phong phut tap" |
| 17 | u2-l07 | B và X | b x | Vươn xa | 11 | "ba bo biet ban bay xa xe xin xong xanh" |
| 18 | u2-l08 | Z, dấu chấm và phẩy | z . , | Vươn xa | 11 | "zalo, zoom. pizza, zero." · "toi den, ban di." |
| 19 | u2-l09 | Enter và Shift (viết hoa) | ⏎ ⇧ | Vươn xa | 9 | "Ha Noi. Sai Gon.⏎Toi ten la Nam." |
| 20 | u2-l10 | Luyện phím yếu | (cá nhân) | Về đích | 1 | — |
| 21 | u2-l11 | Kiểm tra Unit 2 | — | Về đích | 1 (60 s) | đoạn không dấu 60-80 từ |

**Unit 3 — Gõ tiếng Việt có dấu (Telex)** (8 bài, minAccuracy 85). Cần chế độ so khớp IME (xem C6). Người dùng VNI có thể chuyển sang bảng gợi ý VNI (chỉ khác text hint, không khác nội dung).

| # | id | Tên bài | Phím mới (Telex) | Screens | Ví dụ |
|---|---|---|---|---|---|
| 22 | u3-l01 | Dấu sắc và huyền | s f | 10 | "ma má mà" · "cá, cà, là, lá, nhà, nhá" |
| 23 | u3-l02 | Dấu hỏi, ngã, nặng | r x j | 10 | "mả mã mạ" · "cả, cũ, cụ, nhỏ, ngã, học" |
| 24 | u3-l03 | Â Ê Ô và Đ | aa ee oo dd | 10 | "cân, đêm, cô, đi, đến, một" |
| 25 | u3-l04 | Ă Ư Ơ | aw uw ow (w) | 10 | "ăn, tư, ơn, mưa, người, ướt" |
| 26 | u3-l05 | Từ thông dụng tiếng Việt | — | 9 | 100 từ tần suất cao: "của, và, là, có, được, không, người, một..." |
| 27 | u3-l06 | Câu ngắn | — | 8 | "Hôm nay trời đẹp. Tôi đi bộ ra công viên." |
| 28 | u3-l07 | Luyện phím yếu | (cá nhân) | 1 | — |
| 29 | u3-l08 | Kiểm tra Unit 3 | — | 1 (60 s) | đoạn có dấu 60-80 từ |

**Unit 4 — Số, ký hiệu và tốc độ** (6 bài, minAccuracy 85)

| # | id | Tên bài | Phím mới | Screens | Ví dụ |
|---|---|---|---|---|---|
| 30 | u4-l01 | Số 1-5 và 6-0 | 1-0 | 12 | "a1 s2 d3 f4 f5 · j6 j7 k8 l9 ;0" · "ngày 15 tháng 8 năm 2025" |
| 31 | u4-l02 | Ký hiệu thường gặp | @ # / - _ : ? ! | 10 | "email@vi.vn · 08:30 · 100% · Sao vậy?" |
| 32 | u4-l03 | Email, web và mật khẩu | (kết hợp) | 8 | "lienhe@typingease.site · https://typingease.site/hoc/" |
| 33 | u4-l04 | Đoạn văn và tốc độ 1 | — | 7 | đoạn 80-120 từ có dấu, đời sống |
| 34 | u4-l05 | Đoạn văn và tốc độ 2 | — | 7 | đoạn 120-150 từ, có số + dấu câu |
| 35 | u4-l06 | Tổng kết và Kiểm tra cuối | — | 1 (180 s) | đoạn 250 từ |

Tổng: 35 bài, ~330 screens. So với 30 bài × 2 dòng hiện tại.

### C3. Screen type: chọn 5, bỏ 10

| Chọn | Là gì | Vì sao đáng làm |
|---|---|---|
| `intro` | Không gõ (hoặc gõ đúng 1 phím để qua). Hiện bàn phím với phím mới sáng + ngón tương ứng nhấc, 1-2 câu hướng dẫn, ảnh/animation tay. Thay cho video của typing.com. | Rẻ nhất mà dạy được "phím này ngón nào". Là chỗ chứa mẹo (thay tip-card). |
| `block` | Drill ngắn 2-4 dòng phím mới, chỉ tính chính xác, không WPM, không sao tốc độ. | Hình thành phản xạ ngón; typing.com dùng 285 lần. |
| `standard` | Chữ/từ/câu 2-4 dòng, tính WPM + accuracy + sao. Có `dictation: letters|words|sentence` để chỉnh cách ngắt dòng. | Loại lõi, 11k lần ở typing.com. |
| `burst` | Thay `falling` + `keyboard-jump`: hiện từng token ngắn (2-5 ký tự) lần lượt, đồng hồ 20-30 s, đếm token đúng, hiệu ứng nảy. Không canvas, không asset game. | Giữ "nhịp game" giữa bài để đỡ nhàm mà không phải làm game thật; chạy tốt trên mobile và với IME. |
| `test` | Có `timeLimit` (60/120/180 s), 1 screen, ghi WPM/accuracy vào profile `kind:'test'`. Dùng cho Kiểm tra unit và Luyện phím yếu (`source:'weak-keys'` sinh nội dung runtime). | Assessment + personalized practice là 2 thứ làm giáo trình "đầy đủ". Tái dùng engine của `/kiem-tra-toc-do-go/`. |

| Bỏ | Vì sao |
|---|---|
| `falling`, `keyboard-jump` | Game thật cần canvas/physics/asset/âm thanh; mobile và IME Telex đều vỡ. `burst` cho 70% giá trị với 10% công. |
| `vocab` (từ + ảnh) | Cần bộ ảnh; giá trị thấp cho người lớn. |
| `qa`, `computer-app-*`, `coding`, `ai-prompt`, `prereader-typing`, `scripted`, `adventure` | Ngoài phạm vi "luyện gõ 10 ngón"; nhiều loại cần server. |
| `written-prompt`, `fill-in-blank` | Viết tự do không chấm được offline; không đo WPM đáng tin. Nếu muốn, "Luyện tự do" đã cho dán văn bản. |
| `single-key` | Gộp vào `intro` (gõ 1 phím để qua). |

### C4. Schema JSON một bài

```jsonc
// data/lessons/vi/u1-l01.json
{
  "id": "u1-l01",                 // duy nhất, cũng là key lưu tiến độ
  "unit": "u1",
  "group": "bat-dau",             // khớp curriculum.groups
  "order": 1,                     // thứ tự trong unit
  "slug": "j-f-va-dau-cach",      // dùng cho hash + heading
  "title": "J, F và dấu cách",
  "summary": "Hai phím có gờ nổi giúp bạn đặt tay mà không cần nhìn.",
  "newKeys": ["j", "f", " "],     // phím mới của bài (hiển thị chip, tô bàn phím)
  "keysSoFar": ["j", "f", " "],   // tập phím được phép xuất hiện (dùng để validate nội dung + sinh weak drill)
  "minAccuracy": 75,              // dưới mức này screen không được sao, gợi ý làm lại
  "estMinutes": 5,
  "inputMode": "ascii",           // "ascii" | "telex"  (Unit 3+ dùng telex, xem C6)
  "intro": "Chào mừng! Bài đầu tiên chỉ có hai phím và dấu cách. Chậm mà đúng là được.",
  "congrats": "Kỹ thuật cần nhớ: gõ dấu cách bằng ngón cái thuận; hai gờ nổi trên F và J là điểm tựa để tay quay về đúng chỗ mà không nhìn xuống.",
  "screens": [
    { "type": "intro", "key": "j", "finger": "RI",
      "text": "Phím J — ngón trỏ tay PHẢI. Sờ thử: J có một gờ nổi nhỏ. Đặt ngón trỏ phải lên đó, các ngón còn lại nằm trên K L ;.",
      "hint": "Nhấn J để tiếp tục" },
    { "type": "block", "newKey": "j", "content": "jjjj jjjj\njjjj jjjj" },
    { "type": "intro", "key": "f", "finger": "LI",
      "text": "Phím F — ngón trỏ tay TRÁI, cũng có gờ nổi. Hai ngón trỏ đặt lên F và J là tư thế xuất phát của gõ 10 ngón.",
      "hint": "Nhấn F để tiếp tục" },
    { "type": "block", "newKey": "f", "content": "ffff ffff\nffjj ffjj\njjff jjff" },
    { "type": "burst", "seconds": 20, "tokens": ["j", "f", "jj", "ff", "jf", "fj", "jjf", "ffj"],
      "text": "Gõ nhanh từng cụm xuất hiện. Mắt nhìn màn hình, không nhìn tay." },
    { "type": "intro", "key": " ", "finger": "RT",
      "text": "Dấu cách — gõ bằng ngón CÁI. Dùng ngón cái của tay nào bạn thấy thuận, và giữ nguyên thói quen đó." },
    { "type": "block", "newKey": " ", "content": "j j j j\nf f f f\njj ff jj ff" },
    { "type": "standard", "dictation": "letters", "content": "jjf jjf fjj fjj\njf fj jj ff jjff\nfjf jfj ffj jjf" },
    { "type": "burst", "seconds": 25, "tokens": ["jf", "fj", "jjf", "ffj", "jfj", "fjf", "jjff", "ffjj"] },
    { "type": "standard", "dictation": "letters", "content": "fjfj jfjf ffjj jjff\njjfjff ffjfjj fjfjfj\nfj jf jjf ffj jf fj" }
  ]
}
```

Kiểu screen khác (trích):
```jsonc
{ "type": "standard", "dictation": "words", "content": "con can nan cau nha nho\ncanh sach cach noi an nen",
  "text": "Từ tiếng Việt viết không dấu — chỉ dùng các phím bạn đã học." }

{ "type": "standard", "inputMode": "telex", "content": "má mà cá cà là lá\nnhà nhá",
  "hintKeys": { "má": "m a s", "mà": "m a f" } }         // hint chỉ hiện ở 2 screen đầu Unit 3

{ "type": "test", "seconds": 60, "content": "hai dua sau ra khe da ...", "text": "Bạn có 60 giây. Chỉ di chuyển ngón cần gõ, các ngón khác ở hàng cơ sở." }

{ "type": "test", "seconds": 120, "source": "weak-keys", "minKeys": 2,
  "text": "Bài này sinh từ những phím bạn hay sai nhất." }   // nội dung do weak-keys.js sinh lúc chạy, giới hạn trong keysSoFar
```

Chỉ mục giáo trình (nạp ở trang chủ và `/bai-hoc/`, nhỏ ~8 KB):
```jsonc
// data/curriculum.vi.js  →  window.TypingEaseCurriculum = {...}
{
  "lang": "vi",
  "units": [
    { "id": "u1", "title": "Hàng phím cơ sở", "summary": "8 phím hàng giữa, G H, E I, R U",
      "groups": [
        { "id": "bat-dau", "title": "Bắt đầu",  "lessons": ["u1-l01","u1-l02","u1-l03","u1-l04","u1-l05"] },
        { "id": "vuon-xa", "title": "Vươn xa",  "lessons": ["u1-l06","u1-l07","u1-l08"] },
        { "id": "ve-dich", "title": "Về đích",  "lessons": ["u1-l09","u1-l10"] }
      ] }
  ],
  "lessons": {
    "u1-l01": { "title": "J, F và dấu cách", "newKeys": ["j","f"," "], "screens": 10, "estMinutes": 5, "kind": "keys" },
    "u1-l09": { "title": "Luyện phím yếu", "kind": "weak", "screens": 1 },
    "u1-l10": { "title": "Kiểm tra Unit 1", "kind": "test", "screens": 1, "seconds": 60 }
  },
  "starter": { "lessonId": "u1-l01", "screen": 3, "content": "jjj fff jjj fff jf fj" }   // dòng gõ thử ở trang chủ, không cần fetch
}
```

Tiến độ (localStorage mới `typingease-progress-v3`):
```jsonc
{ "current": { "lessonId": "u1-l04", "screen": 5 },
  "lessons": { "u1-l01": { "stars": 27, "maxStars": 30, "bestWpm": 21, "bestAccuracy": 98, "completedAt": 1757000000000, "attempts": 2 } },
  "unlocked": ["u1", "u2"] }
```
Migration: `goxanh-lesson-records-v2` (index 0-29) → nếu có ≥ 1 record, đánh dấu `u1` đã mở và ghi `legacyCompleted: n` để trang tiến độ hiển thị "Đã hoàn thành n bài ở giáo trình cũ". `profile.js` giữ nguyên (attempt.lesson đổi từ số sang string id — `sanitizeAttempt` nới kiểu).

### C5. Inline trong script.js hay JSON riêng?

**CHỌN: tách JSON, fetch theo bài; chỉ mục giáo trình là file JS nhỏ nạp bằng `<script>`; dòng gõ thử inline trong chỉ mục.**

| Tiêu chí | Inline vào script.js | JSON riêng + fetch |
|---|---|---|
| Kích thước | 330 screens × 3 ngôn ngữ ≈ 350-450 KB text đè lên script.js 85 KB → mọi trang tải hết dù chỉ cần 1 bài | Trang chủ tải 8 KB chỉ mục; mỗi bài 3-6 KB khi mở |
| SEO | Không lợi: Google không index drill `jjff`; ngược lại nhồi text vô nghĩa vào JS không giúp gì | Không hại; tên bài vẫn có trong HTML tĩnh `/bai-hoc/` |
| Static/GitHub Pages | OK | OK — same-origin fetch, không CORS; chỉ vỡ khi mở `file://` (ghi rõ trong README: chạy `python -m http.server`) |
| Sửa nội dung | Phải đụng code, dễ vỡ dấu nháy | Sửa JSON, có script validate (`keysSoFar` ⊇ ký tự trong content) |
| i18n | 3 bản sao trong 1 file | `data/lessons/{vi,en,ja}/` độc lập |
| Offline sau lần đầu | Có | Thêm 1 dòng `Cache-Control` không kiểm soát được trên Pages, nhưng browser cache mặc định đủ; có thể thêm service worker ở phase sau |

Rủi ro fetch chậm → prefetch bài kế tiếp khi vào màn kết quả bài; hiện skeleton 1 dòng khi chờ.

### C6. Tiếng Việt có dấu (Telex) — cách engine so khớp

Vấn đề: người dùng gõ `mas` qua Unikey/IME hệ thống → trình duyệt nhận sự kiện composition và `input.value` đổi thành `má`. So sánh ký tự-từng-ký-tự với prompt như hiện tại vẫn đúng **nếu** so sánh trên chuỗi đã compose và chuẩn hoá NFC, chấp nhận trạng thái trung gian.

Quy tắc engine (`inputMode: "telex"`):
1. `prompt.normalize('NFC')`, `input.value.normalize('NFC')` trước khi so.
2. Ký tự đang compose (sự kiện `compositionstart..end`, hoặc ký tự cuối chưa khớp nhưng là tiền tố hợp lệ: `ma` khi đích là `má`) hiển thị trạng thái "đang gõ" (vàng), **không tính lỗi** cho tới khi có dấu cách hoặc ký tự tiếp theo.
3. Lỗi tính theo **âm tiết** (token giữa dấu cách) chứ không theo keystroke, vì Backspace trong Unikey xoá cả dấu. WPM tính theo ký tự đích đã hoàn thành / 5.
4. Per-key stats cho profile: map ký tự có dấu về phím vật lý bằng bảng Telex nghịch (`á → a,s`, `ầ → a,a,f`, `đ → d,d`) để heatmap vẫn đúng phím.
5. Người dùng chưa bật bộ gõ: sau 3 âm tiết sai liên tiếp kiểu `mas` (đúng chuỗi Telex thô) → toast "Bạn chưa bật bộ gõ tiếng Việt (Unikey/EVKey → Telex). Hoặc chọn *Gõ không dấu* để tiếp tục." với nút chuyển `inputMode` sang ascii-fallback (prompt bỏ dấu tự động bằng NFD strip).

Đây là phần kỹ thuật rủi ro nhất → nằm ở Phase 4, có prototype riêng trước khi viết nội dung Unit 3.

### C7. i18n nội dung bài

- Chuỗi UI: 1 file `i18n/ui.<lang>.js` (giữ 9 ngôn ngữ đang có, key phẳng). `applyLanguage()` đổi sang `data-i18n="player.next"` thay cho querySelector theo thứ tự.
- Nội dung bài: `data/lessons/<lang>/<id>.json`, `data/curriculum.<lang>.js`. Cùng `id` giữa ngôn ngữ để tiến độ chuyển ngôn ngữ không mất (u1-l01 của en dạy cùng phím j f).
- **vi**: đầy đủ 35 bài (theo bảng C2).
- **en**: Unit 1-2 cùng cấu trúc phím, từ tiếng Anh tự viết; Unit 3 thay bằng "Common words & sentences" (không Telex); Unit 4 giống.
- **ja**: người Nhật gõ romaji nên Unit 1-2 dùng chung content **en** (chỉ dịch UI + intro text); Unit 3-4 để sau. Fallback chain trong loader: `ja → en → vi`.
- 6 ngôn ngữ còn lại trong dropdown (zh ru pt pt-BR ar ms): chỉ UI, nội dung fallback en. Cân nhắc rút dropdown còn vi/en/ja (câu hỏi mở 4).

---

## D. KẾ HOẠCH THI HÀNH

Khối lượng: S ≈ nửa ngày, M ≈ 1-2 ngày, L ≈ 3-5 ngày, XL ≈ 1-2 tuần (một người).

### Phase 0 — Vá nhanh, ship trong ngày (S)
Mục tiêu: hết 3 lỗi nhìn thấy ngay, không đổi kiến trúc.
- `coach.css`: `.coach:not(.has-data) .coach-body{grid-template-columns:1fr}`; `renderCoach()` thêm class `has-data` khi `skill.samples>0`; trend < 3 điểm → text "Cần thêm N bài để vẽ biểu đồ".
- `hands.js/hands.css`: đổi gradient sang tông da, thêm stroke, opacity .94; `keyboard.css` `.keyboard{background:#dfe8e3}`.
- Mobile overflow: `.mode-switch,.daily-goal-options{flex-wrap:wrap}`, `.key-row{min-width:0}` dưới 600px, `overflow-x:hidden` trên `main`.
- File: `coach.css`, `hands.js`, `hands.css`, `keyboard.css`, `script.js` (5 dòng).
- Rủi ro: gần như không. Kiểm chứng: screenshot 1440/390 trước-sau; ô trống biến mất; tay nhìn rõ trên nền trắng.

### Phase 1 — Onboarding trên trang chủ hiện tại (M)
Mục tiêu: người mới gõ được trong 5 giây; người quay lại thấy "Tiếp tục" ngay. Chưa cần player mới.
- `index.html`: hero → khối gõ thử (dùng `lessons[0]` dòng 1 hiện có tạm), bàn phím thu gọn + tay chuyển lên hero; ẩn `hero-visual`. Thêm continue card; ẩn hero khi có `goxanh-lesson-records-v2`/profile attempts.
- `script.js`: `renderHome()` chọn trạng thái new/returning; Enter toàn trang = tiếp tục; xếp lớp ngầm theo taster.
- Di chuyển daily-goal + coach xuống dưới ô gõ (chưa bỏ).
- File: `index.html`, `en/index.html`, `ja/index.html`, `script.js`, `style.css`, `home.css` (mới).
- Rủi ro: autofocus tranh với `#language` select; SEO hero text đổi (giữ H1 và 1 đoạn mô tả). Kiểm chứng: mở ẩn danh → gõ J ngay không click; xoá localStorage giả lập 2 trạng thái; Lighthouse mobile không có overflow.

### Phase 2 — Data model + Lesson player + Unit 1 nội dung (L)
Mục tiêu: `/hoc/#u1-l01` chạy đủ 5 screen type với 10 bài Unit 1 tiếng Việt.
- Mới: `data/curriculum.vi.js`, `data/lessons/vi/u1-l01..l10.json`, `hoc/index.html`, `player.js` (engine: load → screen state machine `intro|typing|screen-result|lesson-result` → progress v3), `player.css`, `progress-store.js` (v3 + migration), `scripts/validate-lessons.js` (node: content ⊆ keysSoFar, đếm screens khớp chỉ mục).
- Tái dùng: `profile.js` (nới `lesson` sang string), `weak-keys.js` (nhận `allowedKeys`), `hands.js`, bàn phím từ `script.js` tách ra `keyboard.js`.
- Trang chủ: CTA và continue card trỏ sang `/hoc/`; dòng gõ thử dùng `curriculum.starter`.
- Rủi ro: tách `script.js` monolith — làm theo cách "thêm file mới, script.js cũ chỉ còn trang chủ"; hash route và nút Back của trình duyệt; focus input ẩn trên Safari. Kiểm chứng: đi hết 10 bài không lỗi console; reload giữa bài quay lại đúng screen; validate script pass; test thủ công Chrome/Firefox/Safari + Android Chrome.

### Phase 3 — Kiến trúc trang: `/bai-hoc/`, `/tien-do/`, `/luyen-tu-do/`, dọn trang chủ (M)
Mục tiêu: trang chủ chỉ còn 4 khối (gõ thử/continue · unit hiện tại · 3 lối tắt · SEO); mọi thứ khác có nhà riêng.
- Mới: `bai-hoc/index.html` (+ script build tĩnh từ curriculum), `tien-do/index.html` (chuyển results table, heatmap, coach trend, streak sang), `luyen-tu-do/index.html` (chuyển free-practice).
- Xoá khỏi `index.html`: tabs, game-practice, free-practice, keyboard-lab, benefits, results table. Nav đổi: Luyện gõ · Lộ trình · Tiến độ · Kiểm tra tốc độ.
- `sitemap.xml` thêm 4 URL; canonical/hreflang cho trang mới; internal link từ 4 bài SEO sang `/bai-hoc/`.
- Rủi ro: mất internal link tới `#bang-xep-hang`, `#huong-dan` (giữ anchor redirect bằng JS `location.hash` → trang mới). Kiểm chứng: crawl link nội bộ không 404; Search Console không báo lỗi sau deploy.

### Phase 4 — Nội dung Unit 2-4 + Telex mode (XL)
Mục tiêu: đủ 35 bài; Unit 3 gõ tiếng Việt có dấu.
- Prototype `telex-match.js` trước (1-2 ngày) với 5 âm tiết; test trên Windows Unikey, macOS bộ gõ hệ thống, Android Gboard Telex.
- Viết 25 bài JSON còn lại theo bảng C2; validate; đọc lại bằng mắt từng bài (từ không dấu dễ vô nghĩa/nhạy cảm → duyệt tay).
- Kiểm tra unit dùng engine `test` (chia sẻ với `/kiem-tra-toc-do-go/typing-test.js`).
- Rủi ro: IME khác nhau giữa hệ điều hành; nếu prototype thất bại → Unit 3 tạm chạy `ascii-fallback` (bỏ dấu) và ghi câu hỏi mở 1. Kiểm chứng: 3 người thật gõ Unit 3 trên 3 OS; tỷ lệ "toast chưa bật bộ gõ" < 10%.

### Phase 5 — en/ja, huy hiệu, hoàn thiện (M)
- `data/lessons/en/` Unit 1-2 (+ chỉ mục), `/en/learn/`, `/ja/learn/` với fallback en.
- 8-10 huy hiệu theo rule `{field, value, operand}` (stars ≥ 30, days ≥ 3, wpm ≥ 40 với acc ≥ 95, typed ≥ 5000...) hiển thị ở `/tien-do/`.
- Âm click nhẹ (tắt mặc định), phím tắt, prefers-reduced-motion, service worker cache bài đã mở.
- Rút dropdown ngôn ngữ về những ngôn ngữ có nội dung (nếu chốt câu hỏi 4).

Thứ tự ship: **P0 → P1** (người dùng thấy khác biệt ngay, 2-3 ngày) → **P2** (giá trị lõi) → P3 → P4 → P5. P2 và P3 có thể song song nếu 2 người.

---

## E. CÂU HỎI CẦN USER CHỐT TRƯỚC KHI CODE (tối đa 5)

1. **Tiếng Việt có dấu**: đồng ý làm Unit 3 theo Telex với engine so khớp IME (rủi ro kỹ thuật, Phase 4), hay giáo trình chỉ dừng ở tiếng Việt không dấu + số/ký hiệu? Nếu có, mặc định Telex hay cho chọn Telex/VNI ngay từ đầu?
2. **Bỏ tab "Trò chơi 30 giây"** và tab "Tự do" khỏi trang chủ (chuyển Tự do sang `/luyen-tu-do/`, Trò chơi gộp vào test 30 s) — chấp nhận không?
3. **Player ở URL riêng `/hoc/`** (khuyến nghị, focus mode, không phá SEO trang chủ) hay bắt buộc mọi thứ vẫn trên `/`?
4. **Phạm vi ngôn ngữ**: chỉ vi + en + ja có nội dung bài, rút dropdown 9 ngôn ngữ về 3 (giữ file chuỗi cũ trong repo)? Hay giữ 9 ngôn ngữ UI với nội dung fallback en?
5. **Tiến độ cũ**: 30 bài cũ không map 1-1 sang 35 bài mới. Chấp nhận hiển thị "đã hoàn thành n bài giáo trình cũ" + mở khoá Unit 1-2 cho người đã có record, và không cố map từng bài?
