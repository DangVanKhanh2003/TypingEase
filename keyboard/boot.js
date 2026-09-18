/*
 * keyboard/boot.js — cầu nối giữa module bàn phím (ESM) và các script cổ điển của site.
 *
 * player.js, free-page.js, progress-page.js đều là `<script src>` thường, không phải module, nên
 * chúng không `import` được. File này là module duy nhất mỗi trang nạp; nó tải catalog + layout
 * đang chọn rồi treo API của typekute lên `window.NTKeyboard`:
 *
 *   await NTKeyboard.ready              // catalog + layout mặc định đã sẵn sàng
 *   NTKeyboard.createKeyboard({...})    // dựng bàn phím, trả về phần tử board
 *   NTKeyboard.setKeyboardState(board, ký_tự)
 *   NTKeyboard.highlightErrorKey(board, ký_tự_đã_gõ_sai)
 *   NTKeyboard.applyKeyboardPreferences(board, prefs)
 *
 * Module script chạy sau khi parse xong HTML nhưng TRƯỚC `DOMContentLoaded`, còn các script cổ
 * điển chạy trong lúc parse — nên `window.NTKeyboard` luôn tồn tại trước khi handler
 * DOMContentLoaded của player.js chạy, và `ready` là thứ để chờ dữ liệu.
 *
 * Hai hàm KHÔNG có trong bản gốc: `pressKey` (nhún phím khi gõ đúng — nguồn có sẵn keyframe
 * `keyPressDefault` nhưng player của họ không gọi) và `markKeys` (đánh dấu "phím mới" của bài
 * học). Chúng được đặt ở đây, ngoài `keyboard.js`, để file port giữ nguyên bản gốc.
 */
import {
  ERROR_HIGHLIGHT_MS,
  applyKeyboardPreferences,
  applyRootKeyboardPreferences,
  createKeyboard,
  fingerForKey,
  fingerLabel,
  highlightErrorKey,
  keyElementFor,
  keyId,
  keyboardCharacterFromEvent,
  refreshKeyboardLayout,
  resolveKeyTarget,
  setKeyboardState
} from './keyboard.js';
import { DEFAULTS, loadKeyboardPreferences, openKeyboardSettings, saveKeyboardPreferences } from './preferences.js';

const CATALOG_URL = '/data/keyboards/index.json';
const LAYOUT_URL = id => `/data/keyboards/layouts/${Number(id)}.json`;
// Nhún phím dài đúng bằng keyframe `keyPressDefault` của nguồn.
const PRESS_MS = 250;

const VI_FINGERS = {
  'left-pinky': 'ngón út trái', 'left-ring': 'ngón áp út trái', 'left-middle': 'ngón giữa trái',
  'left-index': 'ngón trỏ trái', 'left-thumb': 'ngón cái trái', thumb: 'ngón cái',
  'right-index': 'ngón trỏ phải', 'right-middle': 'ngón giữa phải', 'right-ring': 'ngón áp út phải',
  'right-pinky': 'ngón út phải'
};

let catalog = [];
const layoutCache = new Map();
let currentLayout = null;
let preferences = loadKeyboardPreferences();

async function fetchJson(url) {
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return response.json();
}

/** Layout theo id, tải một lần rồi giữ trong bộ nhớ; id lạ rơi về US Standard. */
async function layoutById(id) {
  const wanted = Number.isFinite(Number(id)) ? Number(id) : DEFAULTS.keyboardId;
  const known = catalog.some(entry => Number(entry.keyboard_id) === wanted) ? wanted : DEFAULTS.keyboardId;
  if (layoutCache.has(known)) return layoutCache.get(known);
  const pending = fetchJson(LAYOUT_URL(known)).catch(async (error) => {
    if (known === DEFAULTS.keyboardId) throw error;
    console.warn('[keyboard] không tải được layout', known, error);
    return layoutById(DEFAULTS.keyboardId);
  });
  layoutCache.set(known, pending);
  const layout = await pending;
  layoutCache.set(known, layout);
  return layout;
}

const ready = (async () => {
  catalog = await fetchJson(CATALOG_URL).catch((error) => {
    console.warn('[keyboard] không tải được catalog', error);
    return [{ keyboard_id: DEFAULTS.keyboardId, name: 'United States Standard', type: 'qwerty' }];
  });
  currentLayout = await layoutById(preferences.keyboardId);
  return currentLayout;
})();

/** Phím vừa gõ đúng nhún xuống: lặp lại một animation một-lần thì phải gỡ class rồi ép reflow. */
function pressKey(board, character) {
  if (!(board instanceof HTMLElement)) return;
  const key = character === undefined
    ? (board.__ntActiveKeys || [])[0]
    : keyElementFor(board, character);
  if (!key) return;
  key.classList.remove('is-animating');
  void key.getBoundingClientRect();
  key.classList.add('is-animating');
  window.clearTimeout(key.__ntPressTimer);
  key.__ntPressTimer = window.setTimeout(() => {
    key.classList.remove('is-animating');
    key.__ntPressTimer = undefined;
  }, PRESS_MS);
}

/** "Phím mới" của một screen: một ký tự, hoặc vài ký tự cho bài dạy hai phím một lúc. */
function markKeys(board, characters) {
  if (!(board instanceof HTMLElement)) return;
  board.querySelectorAll('.is-new').forEach(key => key.classList.remove('is-new'));
  const wanted = (Array.isArray(characters) ? characters : [characters]).filter(value => value !== '' && value != null);
  for (const character of wanted) keyElementFor(board, character)?.classList.add('is-new');
}

/** Mở hộp thoại cài đặt cho một board và áp kết quả lên mọi bàn phím trong `root`. */
function openSettingsFor(board, { root = document.body, restoreFocus, onSave } = {}) {
  openKeyboardSettings({
    root,
    layouts: catalog,
    restoreFocus,
    onSave: async (next) => {
      preferences = next;
      currentLayout = await layoutById(next.keyboardId);
      applyRootKeyboardPreferences(root, next, currentLayout);
      onSave?.(next, currentLayout);
    }
  });
  return board;
}

window.NTKeyboard = {
  ready,
  // API của typekute, nguyên tên
  createKeyboard,
  setKeyboardState,
  highlightErrorKey,
  keyElementFor,
  applyKeyboardPreferences,
  applyRootKeyboardPreferences,
  refreshKeyboardLayout,
  resolveKeyTarget,
  keyboardCharacterFromEvent,
  fingerForKey,
  fingerLabel,
  keyId,
  ERROR_HIGHLIGHT_MS,
  // tuỳ chọn
  loadKeyboardPreferences,
  saveKeyboardPreferences,
  openKeyboardSettings,
  openSettingsFor,
  DEFAULTS,
  // catalog đã cắt nhỏ
  catalog: () => catalog,
  layoutById,
  layout: () => currentLayout,
  preferences: () => preferences,
  setPreferences: (next) => { preferences = next; return preferences; },
  // thêm cho player của site này
  pressKey,
  markKeys,
  fingerNameVi: (character, layout = currentLayout) => VI_FINGERS[fingerForKey(character, layout)] || '',
  fingerNameViOf: (name) => VI_FINGERS[String(name || '').replace(/ /g, '-')] || ''
};

window.dispatchEvent(new CustomEvent('ntkeyboard:loaded'));
