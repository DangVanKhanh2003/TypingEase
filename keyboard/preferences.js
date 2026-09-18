/*
 * keyboard/preferences.js — kho tuỳ chọn bàn phím + hộp thoại "Cài đặt bàn phím".
 *
 * Cổng sang từ `11ty/client/player/preferences.js` của typekute. Giữ nguyên bộ trường và bộ
 * luật phụ thuộc giữa chúng (tắt bàn phím thì tắt luôn tay; chỉ-một-tay loại trừ nhau), bỏ phần
 * chia phạm vi theo "typing setup" vì site này chỉ có một ngôn ngữ học.
 *
 * Giao diện hộp thoại dùng lại `.card`, `.primary-button`, `.ghost-button` của player.css thay cho
 * bộ modal/switch trong stylesheet vendor — cùng hành vi, ít hơn 500 KB CSS.
 */
const KEY = 'typingease-keyboard-v1';
// Công tắc "bàn tay động" của bản cũ (nút ✋ trên thanh trên cùng). Người đang học đã chọn rồi thì
// giữ lựa chọn đó, đừng bắt họ tắt lại.
const LEGACY_HANDS_KEY = 'typingease-hands-v1';

export const DEFAULTS = Object.freeze({
  showKeyboard: true,
  showHands: true,
  rightHandOnly: false,
  leftHandOnly: false,
  animatedHands: true,
  letterCase: 'uppercase',
  keyboardId: 1
});

const LABELS = {
  title: 'Cài đặt bàn phím',
  showKeyboard: 'Hiện bàn phím',
  showHands: 'Hiện bàn tay',
  rightHandOnly: 'Chỉ tay phải',
  leftHandOnly: 'Chỉ tay trái',
  animatedHands: 'Bàn tay di chuyển theo phím',
  letterCase: 'Kiểu chữ trên phím',
  uppercase: 'IN HOA',
  lowercase: 'in thường',
  layout: 'Bố cục bàn phím',
  save: 'Lưu',
  cancel: 'Huỷ',
  close: 'Đóng'
};

function stored() {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(KEY) || 'null');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function legacyAnimatedHands() {
  try {
    const value = globalThis.localStorage?.getItem(LEGACY_HANDS_KEY);
    return value === null ? null : value !== 'off';
  } catch {
    return null;
  }
}

export function normalizedPreferences(source = {}) {
  const next = {
    ...DEFAULTS,
    showKeyboard: 'showKeyboard' in source ? Boolean(source.showKeyboard) : DEFAULTS.showKeyboard,
    showHands: 'showHands' in source ? Boolean(source.showHands) : DEFAULTS.showHands,
    rightHandOnly: 'rightHandOnly' in source ? Boolean(source.rightHandOnly) : DEFAULTS.rightHandOnly,
    leftHandOnly: 'leftHandOnly' in source ? Boolean(source.leftHandOnly) : DEFAULTS.leftHandOnly,
    animatedHands: 'animatedHands' in source ? Boolean(source.animatedHands) : DEFAULTS.animatedHands,
    letterCase: source.letterCase === 'lowercase' ? 'lowercase' : 'uppercase',
    keyboardId: Number.isFinite(Number(source.keyboardId)) ? Number(source.keyboardId) : DEFAULTS.keyboardId
  };
  // Hai công tắc một-tay loại trừ nhau; bản ghi hỏng không được phép bật cả hai.
  if (next.rightHandOnly && next.leftHandOnly) next.leftHandOnly = false;
  return next;
}

export function loadKeyboardPreferences() {
  const saved = stored();
  if (saved) return normalizedPreferences(saved);
  const legacy = legacyAnimatedHands();
  return legacy === null ? { ...DEFAULTS } : normalizedPreferences({ animatedHands: legacy });
}

export function saveKeyboardPreferences(next) {
  const value = normalizedPreferences(next);
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(value));
    // Bản ghi cũ đã được nuốt vào bản ghi mới; để lại nó là để hai nguồn sự thật cãi nhau.
    globalThis.localStorage?.removeItem(LEGACY_HANDS_KEY);
  } catch { /* storage bị chặn */ }
  return value;
}

function toggleRow(label, id, name, checked, { hand = '' } = {}) {
  const row = document.createElement('label');
  row.className = 'kb-settings-row';
  row.htmlFor = id;
  const text = document.createElement('span');
  text.className = 'kb-settings-label';
  text.textContent = label;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'kb-settings-switch';
  input.id = id;
  input.name = name;
  input.value = '1';
  input.checked = Boolean(checked);
  if (hand) {
    input.classList.add('js-hand-preference');
    input.dataset.hand = hand;
  }
  const knob = document.createElement('span');
  knob.className = 'kb-settings-knob';
  knob.setAttribute('aria-hidden', 'true');
  row.append(text, input, knob);
  return row;
}

function selectRow(label, id, name, options, value) {
  const row = document.createElement('label');
  row.className = 'kb-settings-row';
  row.htmlFor = id;
  const text = document.createElement('span');
  text.className = 'kb-settings-label';
  text.textContent = label;
  const select = document.createElement('select');
  select.className = 'kb-settings-select';
  select.id = id;
  select.name = name;
  for (const option of options) {
    const selected = String(option.value) === String(value);
    select.add(new Option(option.label, String(option.value), selected, selected));
  }
  row.append(text, select);
  return row;
}

/**
 * Hộp thoại cài đặt. `layouts` là index catalog (đã bỏ bàn phím số như bản gốc), `onSave` nhận
 * bản tuỳ chọn đã chuẩn hoá và tự lo việc dựng lại bàn phím.
 */
export function openKeyboardSettings({ root = document.body, layouts = [], onSave, restoreFocus } = {}) {
  if (document.querySelector('.kb-settings')) return;
  const current = root.__ntKeyboardPreferences || loadKeyboardPreferences();

  const overlay = document.createElement('div');
  overlay.className = 'kb-settings';
  const card = document.createElement('div');
  card.className = 'card kb-settings-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'kb-settings-title');

  const heading = document.createElement('h2');
  heading.id = 'kb-settings-title';
  heading.textContent = LABELS.title;

  const form = document.createElement('form');
  form.id = 'kb-settings-form';
  form.append(
    toggleRow(LABELS.showKeyboard, 'kb-show-keyboard', 'show_keyboard', current.showKeyboard),
    toggleRow(LABELS.showHands, 'kb-show-hands', 'show_hands', current.showHands),
    toggleRow(LABELS.rightHandOnly, 'kb-right-hand', 'right_hand_only', current.rightHandOnly, { hand: 'right' }),
    toggleRow(LABELS.leftHandOnly, 'kb-left-hand', 'left_hand_only', current.leftHandOnly, { hand: 'left' }),
    toggleRow(LABELS.animatedHands, 'kb-animated-hands', 'animated_hands', current.animatedHands),
    selectRow(LABELS.letterCase, 'kb-letter-case', 'keyboard_letter_case',
      [{ value: 'uppercase', label: LABELS.uppercase }, { value: 'lowercase', label: LABELS.lowercase }], current.letterCase),
    selectRow(LABELS.layout, 'kb-layout', 'keyboard_id',
      layouts.filter(layout => layout.type !== 'keypad')
        .map(layout => ({ value: layout.keyboard_id, label: layout.name })), current.keyboardId)
  );

  const footer = document.createElement('div');
  footer.className = 'kb-settings-footer';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'ghost-button';
  cancel.textContent = LABELS.cancel;
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'primary-button';
  submit.setAttribute('form', form.id);
  submit.textContent = LABELS.save;
  footer.append(cancel, submit);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'kb-settings-close';
  close.setAttribute('aria-label', LABELS.close);
  close.textContent = '×';

  card.append(close, heading, form, footer);
  overlay.append(card);

  // Bộ luật phụ thuộc của bản gốc: tắt bàn phím là tắt cả tay; bật lại bàn phím thì tay và
  // chuyển động bật theo, vì một bàn phím không tay là lựa chọn phải cố ý bấm mới có.
  const setDisabled = (name, disabled) => { form.elements[name].disabled = disabled; };
  const syncDependencies = (name) => {
    const showKeyboard = form.elements.show_keyboard;
    const showHands = form.elements.show_hands;
    const animatedHands = form.elements.animated_hands;
    const handPreferences = [form.elements.right_hand_only, form.elements.left_hand_only];
    if (name === 'show_keyboard') {
      if (showKeyboard.checked) {
        showHands.checked = true;
        animatedHands.checked = true;
      } else {
        showHands.checked = false;
        animatedHands.checked = false;
        handPreferences.forEach(input => { input.checked = false; });
      }
    }
    setDisabled('show_hands', !showKeyboard.checked);
    if (!showKeyboard.checked || name === 'show_hands') {
      if (showHands.checked && showKeyboard.checked) {
        animatedHands.checked = true;
      } else {
        animatedHands.checked = false;
        handPreferences.forEach(input => { input.checked = false; });
      }
    }
    const handsUnavailable = !showKeyboard.checked || !showHands.checked;
    setDisabled('animated_hands', handsUnavailable);
    handPreferences.forEach(input => { input.disabled = handsUnavailable; });
  };

  const readForm = () => {
    const next = normalizedPreferences({
      showKeyboard: form.elements.show_keyboard.checked,
      showHands: form.elements.show_hands.checked,
      rightHandOnly: form.elements.right_hand_only.checked,
      leftHandOnly: form.elements.left_hand_only.checked,
      animatedHands: form.elements.animated_hands.checked,
      letterCase: form.elements.keyboard_letter_case.value,
      keyboardId: Number(form.elements.keyboard_id?.value) || DEFAULTS.keyboardId
    });
    form.elements.right_hand_only.checked = next.rightHandOnly;
    form.elements.left_hand_only.checked = next.leftHandOnly;
    return next;
  };

  syncDependencies();
  form.addEventListener('change', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.classList.contains('js-hand-preference') && target.checked) {
      const other = target.name === 'right_hand_only' ? form.elements.left_hand_only : form.elements.right_hand_only;
      other.checked = false;
    }
    syncDependencies(target instanceof HTMLInputElement ? target.name : '');
  });

  const dismiss = () => {
    document.removeEventListener('keydown', keydown);
    overlay.remove();
    if (typeof restoreFocus === 'function') restoreFocus();
    else restoreFocus?.focus?.();
  };
  const keydown = (event) => { if (event.key === 'Escape') dismiss(); };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onSave?.(saveKeyboardPreferences(readForm()));
    dismiss();
  });
  cancel.addEventListener('click', dismiss);
  close.addEventListener('click', dismiss);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) dismiss(); });

  document.body.append(overlay);
  document.addEventListener('keydown', keydown);
  close.focus();
}
