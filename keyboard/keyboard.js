const FALLBACK_LAYOUT_ID = 1;

const FINGER_NAMES = Object.freeze({
  1: "left-pinky", 2: "left-ring", 3: "left-middle", 4: "left-index", 5: "left-thumb",
  6: "thumb", 7: "right-index", 8: "right-middle", 9: "right-ring", 10: "right-pinky"
});

// Source marks the trigger of every dead sequence with `key-<code>-dead`, where the
// code is the character code of the diacritic the sequence produces.
const DEAD_CHARACTERS = Object.freeze({
  acute: "´", apostrophe: "'", circumflex: "^", grave: "`", quote: '"', tilde: "~", umlaut: "¨"
});
// The combining marks the same diacritics leave behind after NFD decomposition.
const COMBINING_DEAD = Object.freeze({
  "́": "acute", "̀": "grave", "̂": "circumflex", "̃": "tilde", "̈": "umlaut"
});
// Source keeps the error highlight on the pressed key for 250 ms (`highlightErrorKey`).
export const ERROR_HIGHLIGHT_MS = 250;

function element(name, className, text) {
  const node = document.createElement(name);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function keyValue(value) {
  if (!value || typeof value !== "object") return String(value || "");
  return String(value.key || "");
}

export function keyId(value) {
  const source = String(value || "");
  if (source === " " || source === "Spacebar") return " ";
  if (source === "Enter" || source === "\u23ce") return "Enter";
  return source.length === 1 ? source.toLowerCase() : source;
}

function keyCode(value) {
  if (value && typeof value === "object" && Number.isFinite(Number(value.code))) return Number(value.code);
  const key = keyValue(value);
  return key.length === 1 ? key.charCodeAt(0) : 0;
}

function displayKey(value, letterCase) {
  const key = keyValue(value);
  return /^[a-z]$/.test(key) && letterCase === "uppercase" ? key.toUpperCase() : key;
}

function deadCharacter(value) {
  if (!value) return "";
  if (typeof value === "object" && value.dead) return DEAD_CHARACTERS[value.dead] || "";
  const key = keyValue(value);
  return Object.values(DEAD_CHARACTERS).includes(key) ? key : "";
}

function entryDeadCharacter(entry, targetDiacritic = null) {
  if (!entry || entry.other) return "";
  for (const part of [entry.main, entry.shifted, entry.alt]) {
    const dead = deadCharacter(part);
    if (dead && (!targetDiacritic || dead === targetDiacritic)) return dead;
  }
  return "";
}

function classForKey(entry) {
  const labels = keyValue(entry.main).split(" ").filter(Boolean);
  const code = keyCode(entry.main);
  const classes = ["keyboard-key", "key", "key--a", `key-${code}`];
  if (entry.shifted) classes.push("key--duo", `key-${keyCode(entry.shifted)}`);
  if (entry.other) classes.push("key--special");
  if (entry.left) classes.push("key--special-l", "left");
  if (entry.right) classes.push("key--special-r", "right");
  if (!entry.other || code === 17 || code === 18) classes.push("key--rspnsv");
  if (labels.length > 1) classes.push("key--twoWords");
  if (/^[a-z]$/i.test(keyValue(entry.main))) classes.push("key--letter");
  const dead = entryDeadCharacter(entry);
  if (dead) classes.push(`key-${dead.charCodeAt(0)}-dead`);
  return classes.join(" ");
}

function appendLabel(key, entry, letterCase) {
  if (entry.shifted) key.append(element("div", "key-label", displayKey(entry.shifted, letterCase)));
  const label = element("div", "key-label");
  const parts = displayKey(entry.main, letterCase).split(" ");
  if (parts.length > 1) parts.forEach((part, index) => label.append(element("span", `key-label--${index}`, part)));
  else label.textContent = parts[0] || "";
  key.append(label);
}

// Nguồn dùng sprite `icons.svg#settings` của họ; ở đây bánh răng là SVG nội tuyến để bàn phím
// không kéo theo cả bộ icon, và nhãn là tiếng Việt như phần còn lại của site.
const SETTINGS_ICON = '<svg class="keyboard-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
  + '<path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Zm0-5.5a2 2 0 1 0 2 2 2 2 0 0 0-2-2Z"/>'
  + '<path fill="currentColor" d="m19.4 13-.2-1 .2-1 1.5-1.2a.8.8 0 0 0 .2-1l-1.6-2.7a.8.8 0 0 0-1-.3l-1.8.7a7 7 0 0 0-1.7-1l-.3-1.9a.8.8 0 0 0-.8-.6h-3.2a.8.8 0 0 0-.8.6l-.3 2a7 7 0 0 0-1.7.9l-1.8-.7a.8.8 0 0 0-1 .3L3.5 8.8a.8.8 0 0 0 .2 1L5.2 11l-.2 1 .2 1-1.5 1.2a.8.8 0 0 0-.2 1l1.6 2.7a.8.8 0 0 0 1 .3l1.8-.7a7 7 0 0 0 1.7 1l.3 1.9a.8.8 0 0 0 .8.6h3.2a.8.8 0 0 0 .8-.6l.3-2a7 7 0 0 0 1.7-.9l1.8.7a.8.8 0 0 0 1-.3l1.6-2.7a.8.8 0 0 0-.2-1Zm-1.8 3.3-1.4-.6-.9.7a5.3 5.3 0 0 1-1.3.7l-1 .4-.3 1.5h-1.4l-.3-1.5-1-.4a5.3 5.3 0 0 1-1.3-.7l-.9-.7-1.4.6-.7-1.2 1.2-1 .1-1.1-.1-.7.1-.7-.1-1.1-1.2-1 .7-1.2 1.4.6.9-.7a5.3 5.3 0 0 1 1.3-.7l1-.4.3-1.5h1.4l.3 1.5 1 .4a5.3 5.3 0 0 1 1.3.7l.9.7 1.4-.6.7 1.2-1.2 1-.1 1.1.1.7-.1.7.1 1.1 1.2 1Z"/></svg>';

function appendSettings(board, onSettings) {
  const settings = element("div", "keyboard-link js-keyboard-settings");
  const action = element("a", "keyboard-link-action");
  action.href = "#";
  action.setAttribute("aria-label", "Cài đặt bàn phím");
  action.innerHTML = `${SETTINGS_ICON}<span class="keyboard-link-text">Cài đặt bàn phím</span>`;
  action.addEventListener("click", (event) => {
    event.preventDefault();
    onSettings(event);
  });
  settings.append(action);
  board.append(settings);
}

/**
 * The 3D renderer pulls in three.js and a 967 KB model, so it is loaded lazily and
 * only once the learner actually has hands switched on. Until it resolves - and for
 * good when it fails - the 2-D fallback hand images stay on screen and every call
 * site keeps working against this handle, which replays the latest state on arrival.
 */
function createHandsHandle(container, options) {
  const handle = {
    renderer: null,
    disposed: false,
    visible: false,
    hands: null,
    pose: null,
    guideStrength: null,
  };
  let loading = null;
  const load = () => {
    if (handle.disposed || loading) return;
    loading = import("./hands-3d.js")
      .then(({ mountTypingHands }) => {
        if (handle.disposed) return null;
        const renderer = mountTypingHands(container, options);
        handle.renderer = renderer;
        if (!renderer) return null;
        if (handle.hands) renderer.setHands(handle.hands);
        if (handle.guideStrength != null) renderer.setGuideStrength(handle.guideStrength);
        if (handle.pose) renderer.setPose(handle.pose);
        renderer.setVisible(handle.visible);
        return renderer;
      })
      .catch((error) => {
        console.warn("[hands-3d] unavailable", error);
        return null;
      });
  };
  handle.setVisible = (value) => {
    handle.visible = Boolean(value);
    if (handle.visible) load();
    handle.renderer?.setVisible(handle.visible);
  };
  handle.setHands = (value) => {
    handle.hands = value;
    handle.renderer?.setHands(value);
  };
  handle.setPose = (pose) => {
    if (pose?.wrong) return;
    handle.pose = pose;
    handle.renderer?.setPose(pose);
  };
  handle.setGuideStrength = (value) => {
    handle.guideStrength = value;
    handle.renderer?.setGuideStrength(value);
  };
  handle.destroy = () => {
    handle.disposed = true;
    handle.renderer?.destroy();
    handle.renderer = null;
  };
  return handle;
}

/**
 * `--fng-peek` is a registered custom property animated by the keyboard's colour
 * guide, so it only moves while that animation runs on the board. Sampling it on a
 * permanent rAF loop forced a style recalculation 60x a second for the whole lesson;
 * sample it during the animation and on every event that can change it instead.
 */
function bindGuideStrength(board, handle) {
  const read = () => {
    if (handle.disposed) return;
    const peek = Number.parseFloat(getComputedStyle(board).getPropertyValue("--fng-peek"));
    // Source fades the guide with --fng-peek only; doubling it tinted the meshes.
    handle.setGuideStrength(Number.isFinite(peek) ? peek : 0);
  };
  const sample = () => {
    read();
    board.__ntHandsGuideFrame = requestAnimationFrame(sample);
  };
  const start = (event) => {
    // Key elements bubble their own animations through the board; only the board's
    // own colour-guide animation moves --fng-peek.
    if (event && event.target !== board) return;
    if (board.__ntHandsGuideFrame) return;
    board.__ntHandsGuideFrame = requestAnimationFrame(sample);
  };
  const stop = (event) => {
    if (event && event.target !== board) return;
    if (board.__ntHandsGuideFrame) {
      cancelAnimationFrame(board.__ntHandsGuideFrame);
      board.__ntHandsGuideFrame = 0;
    }
    read();
  };
  board.addEventListener("animationstart", start);
  board.addEventListener("animationend", stop);
  board.addEventListener("animationcancel", stop);
  board.addEventListener("transitionend", stop);
  board.__ntHandsGuideSync = read;
  read();
  // The board is styled only once it is in the document, so re-read on the next frame.
  requestAnimationFrame(read);
  return () => {
    if (board.__ntHandsGuideFrame) {
      cancelAnimationFrame(board.__ntHandsGuideFrame);
      board.__ntHandsGuideFrame = 0;
    }
    board.__ntHandsGuideSync = null;
    board.removeEventListener("animationstart", start);
    board.removeEventListener("animationend", stop);
    board.removeEventListener("animationcancel", stop);
    board.removeEventListener("transitionend", stop);
  };
}

function appendFallbackHands(board, layout, preferences) {
  const hands = element("div", "hands js-hands nt-player-hands");
  // The legacy hand view sets these on the node, rather than in the stylesheet.
  // They deliberately extend beyond the keyboard so the full 3D scene remains visible.
  hands.style.position = "absolute";
  hands.style.left = "-100px";
  hands.style.right = "-100px";
  // Preserve the legacy wrapper geometry so the hand scene and highlight maps
  // keep the same projection relative to the keyboard.
  hands.style.height = "800px";
  hands.style.width = "unset";
  const left = document.createElement("img");
  left.className = "hand hand--left js-left-hand";
  left.alt = "";
  const right = document.createElement("img");
  right.className = "hand hand--right js-right-hand";
  right.alt = "";
  hands.append(left, right);
  board.append(hands);
  const handle = createHandsHandle(hands, { layout, animated: preferences.animatedHands });
  board.__ntHands = handle;
  const unbindGuide = bindGuideStrength(board, handle);
  const destroy = handle.destroy;
  handle.destroy = () => {
    unbindGuide();
    destroy();
  };
  handle.setHands({ leftOnly: preferences.leftHandOnly, rightOnly: preferences.rightHandOnly });
  handle.setVisible(preferences.showHands);
}

export function normalizeKeyboardLayouts(value) {
  return Array.isArray(value) ? value.filter((layout) => layout && Array.isArray(layout.structure)) : [];
}

export function selectKeyboardLayout(layouts, id = FALLBACK_LAYOUT_ID) {
  return layouts.find((layout) => Number(layout.keyboard_id) === Number(id)) ||
    layouts.find((layout) => Number(layout.keyboard_id) === FALLBACK_LAYOUT_ID) || layouts[0] || null;
}

// Source takes `event.key` verbatim; reconstructing the character from the selected
// on-screen layout mis-scored synthetic, assistive and software-keyboard input.
export function keyboardCharacterFromEvent(event) {
  const key = event.key;
  return key === "Spacebar" ? " " : key;
}

export function fingerForKey(value, layout) {
  const source = String(value || "");
  const flat = layout?.structure?.flat() || [];
  let entry = flat.find((key) => {
    const values = [key.main, key.shifted, key.alt].map(keyValue);
    return values.includes(source) || (source === " " && key.hardware === "Space");
  });
  if (!entry) {
    const lower = source.toLowerCase();
    entry = flat.find((key) => {
      const values = [key.main, key.shifted, key.alt].map(keyValue).map((candidate) => candidate.toLowerCase());
      return values.includes(lower) || (lower === " " && key.hardware === "Space");
    });
  }
  return FINGER_NAMES[entry?.finger] || "thumb";
}

export function fingerLabel(value, layout) {
  return fingerForKey(value, layout).replace("-", " ");
}

export function applyKeyboardPreferences(board, preferences) {
  board.classList.toggle("hide", !preferences.showKeyboard);
  board.classList.toggle("keyboard--letter-case-uppercase", preferences.letterCase === "uppercase");
  board.classList.toggle("keyboard--letter-case-lowercase", preferences.letterCase === "lowercase");
  board.classList.toggle("nt-player-hands-hidden", !preferences.showHands);
  board.classList.toggle("nt-player-right-hand-only", Boolean(preferences.rightHandOnly));
  board.classList.toggle("nt-player-left-hand-only", Boolean(preferences.leftHandOnly));
  board.classList.toggle("nt-player-hands-animated", Boolean(preferences.animatedHands));
  board.__ntHands?.setHands({ leftOnly: preferences.leftHandOnly, rightOnly: preferences.rightHandOnly });
  board.__ntHands?.setVisible(preferences.showHands);
  // A preference change can start or stop the colour-guide animation.
  board.__ntHandsGuideSync?.();
}

export function applyRootKeyboardPreferences(root, preferences, layout = null) {
  root.__ntKeyboardPreferences = preferences;
  root.querySelectorAll(".nt-player-keyboard").forEach((board) => {
    const previous = board.__ntKeyboardOptions?.preferences;
    const needsRebuild = (layout && Number(board.__ntKeyboardLayout?.keyboard_id) !== Number(layout.keyboard_id)) ||
      previous?.letterCase !== preferences.letterCase ||
      previous?.animatedHands !== preferences.animatedHands;
    if (needsRebuild) {
      refreshKeyboardLayout(board, { layout, preferences });
      return;
    }
    applyKeyboardPreferences(board, preferences);
  });
}

function entryList(layout) {
  return (layout?.structure || []).flat();
}

function specialIndex(entries, code, side) {
  return entries.findIndex((entry) => entry.other && keyCode(entry.main) === code && (!side || entry[side]));
}

function findDeadTrigger(entries, diacritic) {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry || entry.other) continue;
    if (deadCharacter(entry.main) === diacritic) {
      return { index: i, level: "main", modifiers: [] };
    }
    if (deadCharacter(entry.shifted) === diacritic) {
      const shiftModifier = Number(entry.finger) <= 5
        ? specialIndex(entries, 16, "right")
        : specialIndex(entries, 16, "left");
      return { index: i, level: "shifted", modifiers: [shiftModifier] };
    }
    if (deadCharacter(entry.alt) === diacritic) {
      return { index: i, level: "alt", modifiers: [specialIndex(entries, 18, "right")] };
    }
  }
  if (diacritic === "´") {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry || entry.other) continue;
      if (keyValue(entry.main) === "'" || entry.hardware === "Quote") {
        return { index: i, level: "main", modifiers: [] };
      }
    }
  }
  return null;
}

/**
 * Source's `highlightKey`: resolve the character to one key plus the modifier keys the
 * learner has to hold - the opposite-hand Shift for shifted characters, AltGr for
 * alternate-graphic characters, and the dead-key trigger for composed characters.
 */
export function resolveKeyTarget(entries, character) {
  if (!character) return null;
  const byCode = (code) => {
    const index = entries.findIndex((entry) => keyCode(entry.main) === code);
    return index < 0 ? null : { index, entry: entries[index], level: "special", modifiers: [] };
  };
  if (character === "Enter" || character === "\n" || character === "\u23ce") return byCode(13);
  if (character === "Backspace") return byCode(8);
  if (character === " ") {
    const index = entries.findIndex((entry) => entry.hardware === "Space" || keyCode(entry.main) === 32);
    return index < 0 ? null : { index, entry: entries[index], level: "special", modifiers: [] };
  }
  const found = (index, level) => {
    const entry = entries[index];
    const shiftModifier = Number(entry.finger) <= 5
      ? specialIndex(entries, 16, "right")
      : specialIndex(entries, 16, "left");
    const raw = level === "shifted"
      ? [shiftModifier]
      : level === "alt"
      ? [specialIndex(entries, 18, "right")]
      : level === "altShifted"
      ? [shiftModifier, specialIndex(entries, 18, "right")]
      : [];
    return { index, entry, level, modifiers: raw.filter((value) => value >= 0) };
  };
  const usable = (entry) => !entry.other;
  let index = entries.findIndex((entry) => usable(entry) && keyValue(entry.main) === character);
  if (index >= 0) return found(index, "main");
  index = entries.findIndex((entry) => usable(entry) && keyValue(entry.shifted) === character);
  if (index >= 0) return found(index, "shifted");
  index = entries.findIndex((entry) => {
    const main = keyValue(entry.main);
    return usable(entry) && /^[a-z]$/i.test(main) && main.toLowerCase() === character.toLowerCase();
  });
  if (index >= 0) return found(index, character !== character.toLowerCase() ? "shifted" : "main");
  index = entries.findIndex((entry) => usable(entry) && keyValue(entry.alt) === character);
  if (index >= 0) return found(index, "alt");
  index = entries.findIndex((entry) => {
    const alt = keyValue(entry.alt);
    return usable(entry) && alt && alt.toUpperCase() === character && alt.toLowerCase() !== alt.toUpperCase();
  });
  if (index >= 0) return found(index, "altShifted");

  // A composed character is typed as its dead-key trigger followed by the base letter.
  const decomposed = Array.from(String(character).normalize("NFD"));
  const markIndex = decomposed.findIndex((c) => COMBINING_DEAD[c]);
  const dead = markIndex >= 0 ? COMBINING_DEAD[decomposed[markIndex]] : "";
  if (dead) {
    const diacritic = DEAD_CHARACTERS[dead];
    const trigger = findDeadTrigger(entries, diacritic);
    if (trigger) {
      const remainingBase = decomposed.filter((_, i) => i !== markIndex).join("").normalize("NFC");
      return {
        index: trigger.index,
        entry: entries[trigger.index],
        level: "dead",
        dead: remainingBase,
        deadTrigger: diacritic,
        modifiers: trigger.modifiers.filter((value) => value >= 0)
      };
    }
  }
  return null;
}

const NO_KEYS = Object.freeze([]);

/**
 * Highlighting runs on every keystroke, so each board keeps the flattened layout, its
 * key elements by entry index, and a per-character resolution cache. `resolveKeyTarget`
 * and `fingerForKey` then run once per distinct character instead of once per keypress,
 * and the highlight only touches the keys that actually change.
 */
function buildKeyboardIndex(board, layout) {
  const nodes = Array.from(board.querySelectorAll(".keyboard-key"));
  const nodeByEntry = [];
  for (const node of nodes) nodeByEntry[Number(node.dataset.entry)] = node;
  return {
    entries: entryList(layout),
    layout,
    nodeByEntry,
    targets: new Map(),
    fingers: new Map(),
  };
}

function keyboardIndex(board) {
  if (!(board instanceof HTMLElement)) return null;
  if (!board.__ntKeyboardIndex && board.__ntKeyboardLayout) {
    board.__ntKeyboardIndex = buildKeyboardIndex(board, board.__ntKeyboardLayout);
  }
  return board.__ntKeyboardIndex || null;
}

/** The resolved target for one character, with its key elements resolved once. */
function targetFor(index, character) {
  if (index.targets.has(character)) return index.targets.get(character);
  const target = resolveKeyTarget(index.entries, character);
  if (target) {
    target.finger = FINGER_NAMES[target.entry.finger] || "thumb";
    target.node = index.nodeByEntry[target.index] || null;
    const nodes = [target.node, ...target.modifiers.map((entry) => index.nodeByEntry[entry] || null)].filter(Boolean);
    target.nodes = nodes.length ? nodes : NO_KEYS;
  }
  index.targets.set(character, target);
  return target;
}

function fingerFor(index, value) {
  const key = String(value ?? "");
  if (index.fingers.has(key)) return index.fingers.get(key);
  const finger = fingerForKey(value, index.layout);
  index.fingers.set(key, finger);
  return finger;
}

/** The key element a character is typed on, used to line falling letters up with it. */
export function keyElementFor(board, character) {
  const text = character === "\n" ? "Enter" : String(character ?? "");
  const index = keyboardIndex(board);
  if (index) return targetFor(index, text)?.node || null;
  const target = resolveKeyTarget(entryList(board?.__ntKeyboardLayout), text);
  return target ? board.querySelector(`.keyboard-key[data-entry="${target.index}"]`) : null;
}

export function setKeyboardState(board, activeKey, deadKeyPending = false) {
  const index = keyboardIndex(board);
  let charToHighlight = activeKey === "\n" ? "Enter" : String(activeKey ?? "");
  if (deadKeyPending && index) {
    const originalTarget = targetFor(index, charToHighlight);
    if (originalTarget?.level === "dead" && originalTarget.dead) {
      charToHighlight = originalTarget.dead;
    }
  }
  const target = index ? targetFor(index, charToHighlight) : null;
  const next = target ? target.nodes : NO_KEYS;
  const previous = board.__ntActiveKeys || NO_KEYS;
  // Only the keys that change are touched; toggling all ~80 nodes per keystroke
  // invalidated their style on every press.
  for (const node of previous) if (!next.includes(node)) node.classList.remove("is-active");
  for (const node of next) node.classList.add("is-active");
  board.__ntActiveKeys = next;
  board.__ntAwaitingDead = deadKeyPending ? "" : (target?.level === "dead" ? target.dead : "");
  const finger = target ? target.finger : (index ? fingerFor(index, charToHighlight) : fingerForKey(charToHighlight, board.__ntKeyboardLayout));
  if (board.dataset.finger !== finger) board.dataset.finger = finger;
  if (board.__ntKeyboardOptions) board.__ntKeyboardOptions.activeKey = activeKey;
  board.__ntHands?.setPose({ key: charToHighlight, finger, wrong: false });
}

/**
 * Source's `highlightErrorKey`: the key the learner actually pressed flashes red for
 * 250 ms while the expected key keeps its `is-active` hint.
 */
export function highlightErrorKey(board, pressedKey) {
  const index = keyboardIndex(board);
  if (!index) return;
  const target = targetFor(index, pressedKey === "\n" ? "Enter" : String(pressedKey ?? ""));
  const key = target?.node;
  if (!key) return;
  key.classList.add("is-wrong");
  window.clearTimeout(key.__ntErrorTimer);
  key.__ntErrorTimer = window.setTimeout(() => {
    key.classList.remove("is-wrong");
    key.__ntErrorTimer = undefined;
  }, ERROR_HIGHLIGHT_MS);
}

export function refreshKeyboardLayout(board, { layout, preferences }) {
  if (!(board instanceof HTMLElement) || !layout) return board;
  const options = board.__ntKeyboardOptions || {};
  const next = createKeyboard({ ...options, layout, preferences, activeKey: options.activeKey });
  board.__ntHands?.destroy();
  board.className = next.className;
  board.replaceChildren(...Array.from(next.childNodes));
  board.__ntKeyboardLayout = next.__ntKeyboardLayout;
  board.__ntKeyboardOptions = next.__ntKeyboardOptions;
  board.__ntHands = next.__ntHands;
  // `replaceChildren` moves the rebuilt key elements onto this board, so the index
  // built against them stays valid; the old active set points at discarded nodes.
  board.__ntKeyboardIndex = next.__ntKeyboardIndex;
  board.__ntActiveKeys = next.__ntActiveKeys;
  board.dataset.finger = next.dataset.finger;
  return board;
}

export function createKeyboard({ activeKey, preferences, layout, falling = false, onSettings }) {
  const board = element("div", "nt-player-keyboard keyboard keyboard--a keyboard--c keyboard--full keyboard--hands");
  const isKeypad = layout?.type === "keypad";
  board.classList.toggle("keyboard--numpad", isKeypad);
  board.classList.toggle("is-falling", falling);
  board.classList.toggle("keyboard--hasSettings", !isKeypad);
  board.__ntKeyboardLayout = layout;
  board.__ntKeyboardOptions = { activeKey, preferences, layout, falling, onSettings };
  board.setAttribute("aria-label", isKeypad ? "Bàn phím số trên màn hình" : "Bàn phím trên màn hình");
  if (!isKeypad) appendSettings(board, onSettings);
  if (falling) board.append(element("div", "keyboard-overlay"));
  let entryIndex = 0;
  for (const rowData of layout?.structure || []) {
    const row = element("div", "keyboard-row");
    for (const entry of rowData) {
      const key = element("div", classForKey(entry));
      // The flattened structure index is the stable identity `highlightKey` resolves to;
      // several layouts omit `hardware`, so it cannot be used as the key identity.
      key.dataset.entry = String(entryIndex);
      entryIndex += 1;
      key.dataset.values = [keyValue(entry.main), keyValue(entry.shifted), keyValue(entry.alt), entry.hardware === "Space" ? " " : ""].filter(Boolean).join("\u0001");
      if (entry.width) key.style.flexBasis = `${entry.width}px`;
      appendLabel(key, entry, preferences.letterCase);
      row.append(key);
    }
    board.append(row);
  }
  board.__ntKeyboardIndex = buildKeyboardIndex(board, layout);
  if (!isKeypad) appendFallbackHands(board, layout, preferences);
  applyKeyboardPreferences(board, preferences);
  setKeyboardState(board, activeKey);
  return board;
}
