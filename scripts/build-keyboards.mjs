#!/usr/bin/env node
/*
 * scripts/build-keyboards.mjs — cắt catalog bàn phím thành index + từng layout một.
 *
 * Nguồn: `layouts.json` của typekute (119 layout, 485 KB đã nén khoảng trắng). Nạp cả file cho
 * MỘT bàn phím là bắt người học tải 485 KB để dùng 4 KB, nên ở đây nó được cắt làm hai phần:
 *
 *   data/keyboards/index.json        ~8 KB, đủ để đổ danh sách trong hộp thoại Cài đặt
 *   data/keyboards/layouts/<id>.json ~4 KB, chỉ layout đang dùng mới được tải
 *
 * Chạy:  node scripts/build-keyboards.mjs <đường-dẫn-layouts.json>
 * Mặc định đọc `data/keyboards/layouts.json` nếu còn, nên chạy lại sau khi cập nhật nguồn.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2] || resolve(root, 'data/keyboards/layouts.json');
const outDir = resolve(root, 'data/keyboards');
const layoutDir = resolve(outDir, 'layouts');

const layouts = JSON.parse(readFileSync(source, 'utf8'))
  .filter(layout => layout && Array.isArray(layout.structure));

rmSync(layoutDir, { recursive: true, force: true });
mkdirSync(layoutDir, { recursive: true });

const write = (file, value) => writeFileSync(file, JSON.stringify(value), 'utf8');

// Index giữ đúng những trường hộp thoại cần: tên hiển thị, mã ngôn ngữ, và `type` để lọc
// bàn phím số ra khỏi danh sách chọn (bản gốc cũng lọc `type === 'keypad'`).
const index = layouts.map(({ keyboard_id: id, name, type, country, language, language_code: code, display_order: order, geometry }) => ({
  keyboard_id: id, name, type, country, language, language_code: code, display_order: order,
  ...(geometry?.physicalStandard ? { physicalStandard: geometry.physicalStandard } : {})
})).sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || String(a.name).localeCompare(String(b.name)));

write(resolve(outDir, 'index.json'), index);
for (const layout of layouts) write(resolve(layoutDir, `${layout.keyboard_id}.json`), layout);

console.log(`${layouts.length} layout → data/keyboards/layouts/, index ${index.length} mục`);
