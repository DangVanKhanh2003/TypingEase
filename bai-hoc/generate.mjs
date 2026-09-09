/* bai-hoc/generate.mjs — sinh lại bai-hoc/index.html tĩnh từ data/curriculum.vi.js.
   Chạy:  node bai-hoc/generate.mjs        (từ thư mục gốc project)

   Vì sao cần script: trang lộ trình là trang CÓ giá trị SEO, nên tên 35 bài phải nằm sẵn
   trong HTML cho crawler đọc (PLAN.md B7). JS của trang chỉ phủ thêm tiến độ/sao/trạng thái.
   Khi `data/curriculum.vi.js` đổi (Phase 4 bật `ready: true`, sửa tên bài) thì chạy lại script
   này rồi commit HTML mới. Không có bước build nào khác trong repo — đây là script tay.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = fs.readFileSync(path.join(root, 'data', 'curriculum.vi.js'), 'utf8');
const scope = { window: {} };
new Function('window', source)(scope.window);
const curriculum = scope.window.TypingEaseCurriculum;

const esc = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫'];
const KIND_LABEL = { keys: '', review: 'Ôn tập', weak: 'Cá nhân hoá', test: 'Kiểm tra' };

const order = new Map(curriculum.sequence.map((id, index) => [id, index + 1]));

function lessonRow(id, indexInUnit) {
  const entry = curriculum.lessons[id];
  const number = order.get(id) || 0;
  const meta = entry.kind === 'test' || entry.kind === 'weak'
    ? `${entry.seconds ? `${entry.seconds} giây` : `${entry.screens} screen`} · ${entry.estMinutes}'`
    : `${entry.screens} screen · ${entry.estMinutes}'`;
  const tag = KIND_LABEL[entry.kind];
  const inner = `<span class="lr-mark">${CIRCLED[indexInUnit] || number}</span>`
    + `<span class="lr-body"><span class="lr-title">${esc(entry.title)}</span>`
    + `<span class="lr-meta">Bài ${number} · ${esc(meta)}${tag ? ` · ${esc(tag)}` : ''}</span></span>`
    + `<span class="lr-stars" data-stars aria-hidden="true"></span>`
    + `<span class="lr-state" data-state>${entry.ready ? '' : 'Sắp có'}</span>`;
  // Bài chưa có nội dung (`ready: false`) không được là link — player sẽ báo "chưa mở" chứ
  // không 404, nhưng dẫn người dùng vào đó vẫn là dẫn vào chỗ trống.
  return entry.ready
    ? `<li class="lesson-row" data-lesson="${esc(id)}"><a href="../hoc/#${esc(id)}/1">${inner}</a></li>`
    : `<li class="lesson-row is-soon" data-lesson="${esc(id)}"><span class="lr-link" aria-disabled="true">${inner}</span></li>`;
}

function unitCard(unit) {
  const ids = unit.groups.flatMap(group => group.lessons);
  let cursor = -1;
  const groups = unit.groups.map(group => {
    const rows = group.lessons.map(id => { cursor += 1; return lessonRow(id, cursor); }).join('');
    return `<h3 class="group-title">${esc(group.title)}</h3><ol class="lesson-rows">${rows}</ol>`;
  }).join('');
  const readyCount = ids.filter(id => curriculum.lessons[id].ready).length;
  return `<article class="unit-card" id="${esc(unit.id)}" data-unit="${esc(unit.id)}">
          <header class="unit-head">
            <div>
              <p class="unit-kicker">Unit ${unit.index}${unit.locked ? ' · <span class="unit-lock" data-lock>Chưa mở</span>' : ''}</p>
              <h2>${esc(unit.title)}</h2>
              <p class="unit-summary">${esc(unit.summary)}</p>
            </div>
            <div class="unit-score">
              <b data-unit-count>0/${ids.length}</b>
              <span>bài đã xong</span>
            </div>
          </header>
          <div class="unit-track" data-unit-track><i></i></div>
          <p class="unit-note" data-unit-note${readyCount === ids.length ? ' hidden' : ''}>${readyCount === 0
            ? 'Nội dung unit này đang được viết — bạn sẽ thấy bài mở dần.'
            : `Đã có nội dung cho ${readyCount}/${ids.length} bài; phần còn lại đang được viết.`}</p>
          ${groups}
        </article>`;
}

const sideLinks = curriculum.units.map(unit => {
  const ids = unit.groups.flatMap(group => group.lessons);
  return `<li><a href="#${esc(unit.id)}"><span class="side-name"><b>Unit ${unit.index}</b>`
    + `<span>${esc(unit.title)}</span></span>`
    + `<em data-side-count="${esc(unit.id)}">0/${ids.length}</em></a></li>`;
}).join('');

const totalLessons = curriculum.sequence.length;
const totalUnits = curriculum.units.length;

const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lộ trình luyện gõ 10 ngón · ${totalLessons} bài | TypingEase</title>
    <meta name="description" content="Lộ trình luyện gõ 10 ngón đầy đủ: ${totalUnits} unit, ${totalLessons} bài từ hàng phím cơ sở đến tiếng Việt có dấu, số và ký hiệu. Xem tiến độ từng bài và học tiếp ngay." />
    <link rel="canonical" href="https://typingease.site/bai-hoc/" />
    <link rel="alternate" hreflang="vi" href="https://typingease.site/bai-hoc/" />
    <link rel="alternate" hreflang="x-default" href="https://typingease.site/bai-hoc/" />
    <meta name="robots" content="index, follow" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48x48.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../style.css" />
    <link rel="stylesheet" href="../keyboard.css" />
    <link rel="stylesheet" href="curriculum.css" />
    <!-- Danh sách bài dưới đây được sinh bằng bai-hoc/generate.mjs từ data/curriculum.vi.js.
         Sửa nội dung ở curriculum.vi.js rồi chạy lại script, đừng sửa tay hai chỗ. -->
  </head>
  <body class="curriculum-page">
    <header class="topbar">
      <a class="brand" href="../">Typing<span>Ease</span></a>
      <nav aria-label="Điều hướng chính">
        <a href="../">Luyện gõ</a>
        <a class="active" href="./">Lộ trình</a>
        <a href="../tien-do/">Tiến độ</a>
        <a href="../kiem-tra-toc-do-go/">Kiểm tra tốc độ</a>
      </nav>
      <div class="header-actions"><a class="secondary-button" href="../hoc/">Vào học <span>→</span></a></div>
    </header>

    <main class="curriculum">
      <section class="cur-head">
        <p class="eyebrow"><i></i> Giáo trình TypingEase</p>
        <h1>Lộ trình gõ 10 ngón · ${totalLessons} bài · ${totalUnits} unit</h1>
        <p class="cur-intro">Từ hai phím có gờ nổi đến đoạn văn tiếng Việt có dấu. Mỗi bài dạy hai phím mới,
          chia thành nhiều screen ngắn, xen kẽ drill và bài gõ nhanh — khoảng năm phút một bài.</p>
        <div class="cur-status">
          <p class="cur-count" id="cur-count">Đã xong 0/${totalLessons} bài</p>
          <p class="cur-legacy" id="cur-legacy" hidden></p>
        </div>
        <p class="cur-cta"><a class="primary-button" id="cur-continue" href="../hoc/#${esc(curriculum.sequence[0])}/1">▶ Bắt đầu Bài 1 <span>→</span></a></p>
      </section>

      <div class="cur-layout">
        <aside class="cur-side" aria-label="Danh sách unit">
          <p class="side-kicker">Unit</p>
          <ul class="side-units">${sideLinks}</ul>
          <p class="side-kicker">Khác</p>
          <ul class="side-other">
            <li><a href="../luyen-phim-yeu/">Luyện phím yếu</a></li>
            <li><a href="../kiem-tra-toc-do-go/">Kiểm tra tốc độ</a></li>
            <li><a href="../luyen-tu-do/">Luyện tự do</a></li>
            <li><a href="../tien-do/">Tiến độ của bạn</a></li>
          </ul>
        </aside>

        <div class="cur-main">
${curriculum.units.map(unitCard).join('\n')}
        </div>
      </div>

      <section class="explore" aria-labelledby="cur-explore-title">
        <div class="explore-heading">
          <p class="eyebrow"><i></i> Đọc thêm</p>
          <h2 id="cur-explore-title">Trước khi bắt đầu</h2>
        </div>
        <div class="explore-grid">
          <a class="explore-card" href="../cach-go-10-ngon/">
            <h3>Cách gõ 10 ngón</h3>
            <p>Vị trí ngón tay trên hàng phím cơ sở, tư thế ngồi và những lỗi thường gặp của người mới.</p>
            <span>Xem hướng dẫn <b aria-hidden="true">→</b></span>
          </a>
          <a class="explore-card" href="../cach-tang-wpm/">
            <h3>Cách tăng WPM</h3>
            <p>Vì sao độ chính xác đi trước tốc độ, và cách luyện để WPM tăng mà không sinh tật.</p>
            <span>Đọc tiếp <b aria-hidden="true">→</b></span>
          </a>
          <a class="explore-card" href="../kiem-tra-toc-do-go/">
            <h3>Kiểm tra tốc độ gõ</h3>
            <p>Đo WPM và độ chính xác trong 15 · 30 · 60 · 120 giây để biết mình đang ở đâu.</p>
            <span>Kiểm tra ngay <b aria-hidden="true">→</b></span>
          </a>
        </div>
      </section>
    </main>

    <footer>
      <a class="brand" href="../">Typing<span>Ease</span></a>
      <nav class="footer-links" aria-label="Tài nguyên TypingEase">
        <a href="../bai-hoc/">Lộ trình</a><a href="../tien-do/">Tiến độ</a><a href="../luyen-tu-do/">Luyện tự do</a><a href="../cach-go-10-ngon/">Cách gõ 10 ngón</a>
      </nav>
      <p>Gõ chậm một chút, rồi bạn sẽ đi rất xa.</p>
      <span>© 2024 TypingEase</span>
    </footer>

    <script src="../data/curriculum.vi.js"></script>
    <script src="../progress-store.js"></script>
    <script src="curriculum-page.js"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(here, 'index.html'), html);
console.log(`bai-hoc/index.html: ${totalUnits} unit, ${totalLessons} bài`);
