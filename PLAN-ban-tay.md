# Kế hoạch clone bàn phím + bàn tay theo typing.com (lập 2026-09-15)

Nguồn đối chiếu: `../typing-clone` (mirror typing.com, cacheId 745) và ảnh `Capture.PNG` (bài học, phím `a`,
tay trái ngón út xanh). Phân tích cơ chế gốc: bàn phím là HTML/CSS sinh từ `data/keyboards.json`; bàn tay là
mô hình glTF vẽ bằng three.js vào canvas (camera orthographic nhìn từ trên), 159 tư thế tĩnh, tween 0,275 s,
vệt xanh là texture chèn vào shader, rồi CSS `opacity:.5` + mask mờ 55→65% + drop-shadow.

## Hiện trạng (screenshot 1440px, `/hoc/#u1-l01/2`)
- Bàn phím: đã đúng ~95% (panel #d9dadb, phím trắng bo 5px, Roboto Mono, phím đích #3295db, tỉ lệ phím theo
  keyboards.json). Thiếu: nhún phím khi gõ đúng, nháy đỏ khi gõ sai.
- Bàn tay: đúng bố cục (ngón trên hàng cơ sở, mờ dần cổ tay, ngón xanh) nhưng nhìn "phẳng": ngón thẳng như ống,
  không khớp, không bóng giữa các ngón, ngón cái quá to và thẳng, lòng bàn tay không có khối. Đây là khoảng cách chính.
- Sửa lại một nhận định trong DECISIONS.md 14/09: tay typing.com KHÔNG đứng yên. Cài đặt `animated_hands` mặc định
  bật → ngón di chuyển tới phím đích theo hàng (`top-row-3-left`, `bottom-row-2-right`...), chỉ khi tắt mới giữ
  tư thế home. Muốn giống hệt thì phải có chuyển động.

## Quyết định nền
- **Không copy** `hand-default.compressed.gltf`, `base-1.jpg`, `highlight-*.png` (tài sản Teaching.com, site public).
  Giữ quyết định 14/09. Tái tạo cái nhìn 3D bằng SVG của mình; ở opacity .5 trên nền phím, SVG có shading tốt
  đủ để không phân biệt được.
- Phương án dự phòng nếu chấp nhận rủi ro bản quyền: three.js + file glTF của họ (~1 MB) + giải mã định dạng nén
  riêng (`Ql()` trong app.745.js). Chi phí ~2 ngày, thêm 600 KB JS, và không kiểm soát được nguồn. Không khuyến nghị.
- Giữ nguyên API `TypingEaseKeyboard` (`highlight/mark/press/layout/fingerFor`) và hook DOM
  (`.hand-layer`, `.finger[data-finger][data-key]`, `.digit-press`, `.finger-glow`) để `player.js`, `taster.js` không đổi logic.

## Phase A — Bàn phím: 2 hiệu ứng còn thiếu (½ buổi)
| # | Việc | Thông số gốc |
|---|------|--------------|
| A1 | `press()` nhún phím đích | keyframe `keyPressDefault` .25s: 50% → nền #2d86c5, `border-bottom-width:0`, `translateY(1px)` |
| A2 | `reject(char)` nháy đỏ phím gõ sai | keyframe `keyRejected` .25s: 0-50% nền #ce3e44 viền #d35157/#ce3e44/#b9383d chữ trắng → về trắng |
| A3 | Gọi từ player/taster | gõ đúng → `press()`; `lastKeyError` → `reject(kýTựĐãGõ)` |
| A4 | Nhãn phím chức năng | typing.com **ẩn** nhãn (label `display:none`). Ta giữ nhãn cho người mới nhưng đổi màu #a9a9a9, 10px. Đổi ý thì 1 dòng CSS. |
| A5 | Bóng panel (chỉ hero) | `.keyboard--shadow{box-shadow:0 10px 30px rgba(0,0,0,.3)}` — tuỳ chọn |

Files: `keyboard-widget.js`, `keyboard.css`, `player.js`, `taster.js`.

## Phase B — Vẽ lại bàn tay cho ra "khối 3D" (2 buổi) — phần chính
Tỉ lệ đo từ Capture.PNG (đơn vị = 1 phím 50px):
- Bàn tay rộng ở khớp ≈ 4,6 phím; ngón giữa dài đầu-gốc ≈ 3,3 hàng; ngón út ≈ 2,3; ngón hơi cong về phía
  bàn phím (2 đốt, gập 8–12° ở mỗi khớp), đầu ngón elip 0,9 × 1,1 phím.
- Ngón cái gập vào 40–45°, gốc từ mé trong lòng bàn tay, đầu ngón cái tay trái nằm ở 1/3 trái phím cách, tay phải ở 1/3 phải.
- Cổ tay rộng ≈ 2,7 phím, lệch ra ngoài 1 phím (cánh tay đi vào từ hai bên).
- Mask mờ: đặc đến ~55% chiều cao lớp tay, tan hết ở ~65% (họ tính trên canvas 800px → ta tính từ đường khớp gốc ngón, như hiện tại).

Việc:
| # | Việc | Cách làm trong SVG |
|---|------|--------------------|
| B1 | Hình học ngón 2 đốt | `digitPath` nhận thêm góc gập ở khớp; đường viền bằng cubic Bézier; đầu ngón bo tròn thật (arc) |
| B2 | Shading khối | mỗi ngón: gradient ngang 4 stop (đã có) + `radialGradient` sáng ở khớp giữa; lòng bàn tay `radialGradient` sáng giữa tối mép |
| B3 | Bóng giữa các ngón | path tối (#5a322c, opacity .35) rộng 1,5px ở kẽ ngón, `filter: feGaussianBlur stdDeviation 1.2` |
| B4 | Ngón nổi trên phím | `feDropShadow dy=1 stdDeviation=1 flood-opacity .35` cho từng ngón (không cho cả tay, tránh chồng bóng) |
| B5 | Móng | elip có highlight trắng mờ ở mép trên, viền #7a4a43 .8px |
| B6 | Lớp phủ như gốc | `.hand-layer{opacity:.5; filter:drop-shadow(0 -1px 1px rgba(0,0,0,.8)) drop-shadow(0 0 1px rgba(0,0,0,.5))}` |
| B7 | Vệt xanh | gradient từ đầu ngón: 0–45% #37b3d6 đặc, tan hết ở 80% (giống `highlight-index.png`); bản `-full` (cả ngón) dùng khi ngón út giữ Shift |
| B8 | Kiểm chứng | screenshot 1440px chồng 50% lên Capture.PNG; lặp cho tới khi viền ngón/ngón cái trùng ±4px |

Files: `hands.js` (viết lại phần hình học + defs), `hands.css`.

## Phase C — Chuyển động tư thế như `animated_hands` (1 buổi)
| # | Việc | Theo gốc |
|---|------|----------|
| C1 | Tính tư thế từ phím đích | `getFingerIds`: tay = cột ≤6 trái, ngược lại phải; hàng ∈ {num, top, home, bottom}; ngón theo bảng `FINGERS` |
| C2 | Di chuyển | ngón đích: đầu ngón tới tâm phím (translate + xoay nhẹ quanh gốc ngón); các ngón còn lại cùng tay dịch 35% vector đó (cả bàn tay nhích theo); tay kia về rest |
| C3 | Tween | 0,275 s, ease cubic in-out; **tốc độ thích ứng**: đo khoảng cách giữa các lần `highlight` (kẹp 70–1200 ms, trung bình 8 lần) → duration = 0,09 + 0,36·clamp((avg−90)/610, 0, 1) |
| C4 | Space | ngón cái tay phải xanh, tay trái rest (gốc dùng fingerId `space` → tay phải) |
| C5 | Shift / ký tự hoa | ngón út tay đối diện tới phím Shift, highlight `-full`; ngón gõ ký tự vẫn di chuyển |
| C6 | Tuỳ chọn | setting "Tay chuyển động" (mặc định bật) → khi tắt giữ tư thế home như bây giờ; `prefers-reduced-motion` → nhảy thẳng, không tween |

Cách hiện thực: giữ SVG tĩnh, gán `transform` cho `.finger` (đã có `transform-origin` ở gốc ngón) và cho `<g class="ghost-hand">`;
dùng CSS `transition: transform var(--hand-speed)` với `--hand-speed` cập nhật theo C3. Không dựng lại SVG mỗi phím.

Files: `hands.js` (hàm `pose(fingerId)`), `keyboard-widget.js` (`highlight` gọi pose, đo nhịp gõ), `hands.css`.

## Phase D — Tuỳ chọn, làm sau
- D1 Layout data-driven: chuyển `FULL_ROWS` sang `{main, shifted, finger, width}` như keyboards.json để một bảng nuôi cả phím lẫn ngón. Chỉ cần khi thêm layout ngoài US.
- D2 Chế độ một tay (`right_hand_only`/`left_hand_only`) như gốc: tay còn lại phủ cả bàn phím, cần bộ tư thế riêng. Bỏ qua trừ khi có nhu cầu tiếp cận.
- D3 Bàn phím số (10key). Không có trong giáo trình → bỏ.

## Thứ tự & tiêu chí xong
1. A → B → C. Mỗi phase kết thúc bằng screenshot `/hoc/#u1-l01/2` và `/` ở 1440 và 1024 px, không tay ở <900 px (PLAN.md).
2. Xong khi: đặt screenshot cạnh Capture.PNG, người không biết trước không chỉ ra được đâu là bản nào ở cỡ hiển thị thật.
3. Ghi lại vào DECISIONS.md: sửa mục "tay đứng yên" (14/09) và thêm mục tốc độ thích ứng.

## Cạm bẫy đã biết
- Bash tool cắt lệnh dài >6 KB; heredoc có backslash bị gộp → viết `hands.js` theo từng phần (DECISIONS.md cạm bẫy 6).
- Chrome headless cache CSS/JS → thêm query `?v=` hoặc tắt cache khi chụp (cạm bẫy 7).
- `feGaussianBlur`/`feDropShadow` trên nhiều path có thể tốn khi resize liên tục → chỉ vẽ lại khi kích cỡ phím đổi, pose chỉ đổi transform.
