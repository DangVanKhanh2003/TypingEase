(function (global) {
  // Keyboard + hands widget, styled after typing.com's lesson keyboard (keyboard.css, the
  // `.kb-widget` block): grey panel, white keys with the shifted symbol printed above the main
  // one, lower-case captions on the modifier keys, the wanted key in blue, translucent hands
  // (hands.js) resting on the home row.
  //
  // Every query here is scoped to the widget's own root and the keys carry `data-pkey` instead
  // of `data-key`: script.js's highlightGuide()/reachForKey()/pressActiveFinger() query the whole
  // document for `.key[data-key]` and `.hand-layer .finger`, and a second keyboard using the
  // same hooks would be yanked around by them (DECISIONS.md pitfall 4).
  //
  // Row entries: 'q' (one label), ['1', '!'] (main + shifted, optional width), or
  // { id, label, width, side } for a modifier key. Widths are typing.com's US layout on a 50px
  // key (keyboards.json: delete 74, tab 68, caps 83, enter 83, shift 108, ctrl/alt 50, cmd 70,
  // space 336, backslash 48); every key grows equally, so they only fix the proportions.
  const BS = String.fromCharCode(92);
  const NL = String.fromCharCode(10);
  const FULL_ROWS = [
    [['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'],
      ['-', '_'], ['=', '+'], { id: 'back', label: 'delete ⌫', width: 74, side: 'r' }],
    [{ id: 'tab', label: 'tab ⇆', width: 68, side: 'l' }, 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', ['[', '{'], [']', '}'], [BS, '|', 48]],
    [{ id: 'caps', label: 'caps lock ⇪', width: 83, side: 'l' }, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', [';', ':'], ['\'', '"'],
      { id: 'enter', label: 'enter ⏎', width: 83, side: 'r' }],
    [{ id: 'shift', label: 'shift ⇧', width: 108, side: 'l' }, 'z', 'x', 'c', 'v', 'b', 'n', 'm', [',', '<'], ['.', '>'], ['/', '?'],
      { id: 'shift', label: '⇧ shift', width: 108, side: 'r' }],
    [{ id: 'ctrl', label: 'ctrl', width: 50, side: 'l' }, { id: 'alt', label: 'alt', width: 50, side: 'l' }, { id: 'cmd', label: 'cmd', width: 70, side: 'l' },
      { id: ' ', label: '', width: 336 },
      { id: 'cmd', label: 'cmd', width: 70, side: 'r' }, { id: 'alt', label: 'alt', width: 50, side: 'r' }, { id: 'ctrl', label: 'ctrl', width: 50, side: 'r' }]
  ];
  // Phones get letters and a space bar only: three rows and no hands (PLAN.md B8).
  const COMPACT_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
    [{ id: ' ', label: '', width: 336 }]
  ];
  const HOME_ROW = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];
  const FINGERS = {
    q: 'LP', a: 'LP', z: 'LP', '1': 'LP', '`': 'LP', tab: 'LP', caps: 'LP', shift: 'LP',
    w: 'LR', s: 'LR', x: 'LR', '2': 'LR',
    e: 'LM', d: 'LM', c: 'LM', '3': 'LM',
    r: 'LI', f: 'LI', v: 'LI', t: 'LI', g: 'LI', b: 'LI', '4': 'LI', '5': 'LI',
    y: 'RI', h: 'RI', n: 'RI', u: 'RI', j: 'RI', m: 'RI', '6': 'RI', '7': 'RI',
    i: 'RM', k: 'RM', ',': 'RM', '8': 'RM',
    o: 'RR', l: 'RR', '.': 'RR', '9': 'RR',
    p: 'RP', ';': 'RP', '/': 'RP', '\'': 'RP', '0': 'RP', '-': 'RP', '=': 'RP',
    '[': 'RP', ']': 'RP', enter: 'RP', back: 'RP',
    // Space is the right thumb, as on typing.com (fingerId `space` -> right hand). `LT` stays a
    // valid code for lesson data that names the left thumb in `screen.finger`.
    ' ': 'RT'
  };
  FINGERS[BS] = 'RP';
  // The ten finger codes, in the order hands.js draws them: LP sits on `a`, LR on `s`, and so on
  // out to RP on `;`. Lesson data uses exactly these codes in `screen.finger`.
  const FINGER_NAMES = {
    LP: 'ngón út trái', LR: 'ngón áp út trái', LM: 'ngón giữa trái', LI: 'ngón trỏ trái', LT: 'ngón cái trái',
    RT: 'ngón cái phải', RI: 'ngón trỏ phải', RM: 'ngón giữa phải', RR: 'ngón áp út phải', RP: 'ngón út phải'
  };
  // US layout: the symbol printed on the upper half of a key, and the key it sits on.
  const SHIFT_MAP = {
    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
    '_': '-', '+': '=', '{': '[', '}': ']', ':': ';', '"': '\'', '<': ',', '>': '.', '?': '/', '~': '`'
  };
  SHIFT_MAP['|'] = BS;

  const normalize = character => {
    if (character === NL) return 'enter';
    if (character === ' ') return ' ';
    if (SHIFT_MAP[character]) return SHIFT_MAP[character];
    return typeof character === 'string' && character ? character.toLowerCase() : '';
  };
  // Attribute selector for a key id; only the backslash needs escaping inside the quotes.
  const selectorFor = id => `.key[data-pkey="${id === BS ? BS + BS : id}"]`;

  // Adaptive hand speed, typing.com's numbers: the gap between highlight requests is clamped to
  // 70–1200 ms, averaged over the last 8, and mapped onto a 0.09–0.45 s transition.
  const SPEED_SAMPLES = 8, GAP_MIN = 70, GAP_MAX = 1200, SPEED_DEFAULT = 0.275;
  const speedFor = averageGap => 0.09 + 0.36 * Math.min(1, Math.max(0, (averageGap - 90) / 610));

  function create({ host, compact = false, hands = true, animatedHands = true } = {}) {
    if (!host) return null;
    let showHands = hands, isCompact = compact, animated = animatedHands, target = '', lastCharacter = '', resizeTimer = null;
    let keySize = { w: 50, h: 50 }, lastHighlightAt = null;
    const gaps = [];

    host.classList.add('keyboard-demo', 'kb-widget');
    host.innerHTML = '<div class="keyboard kb-keys"></div>';
    const keys = host.querySelector('.kb-keys');

    const label = text => {
      const element = document.createElement('span');
      element.className = 'key-label';
      element.textContent = text;
      return element;
    };

    function build() {
      keys.innerHTML = '';
      (isCompact ? COMPACT_ROWS : FULL_ROWS).forEach(row => {
        const line = document.createElement('div');
        line.className = 'key-row';
        row.forEach(entry => {
          const spec = typeof entry === 'string' ? { id: entry, main: entry, width: 50 }
            : Array.isArray(entry) ? { id: entry[0], main: entry[0], shifted: entry[1], width: entry[2] || 50 }
              : { id: entry.id, caption: entry.label, width: entry.width, side: entry.side, special: true };
          const key = document.createElement('span');
          key.className = 'key'
            + (spec.special ? ' key--special' + (spec.side ? ` key--special-${spec.side}` : '') : '')
            + (spec.shifted ? ' key--duo' : '')
            + (spec.id === ' ' ? ' space' : '')
            + (spec.width !== 50 ? ' wide' : '')
            + (spec.id === 'f' || spec.id === 'j' ? ' home' : '');
          key.dataset.pkey = spec.id;
          key.style.flex = `1 1 ${spec.width}px`;
          if (spec.special) key.append(label(spec.caption));
          else if (spec.shifted) key.append(label(spec.shifted), label(spec.main));
          else key.append(label(spec.main));
          line.append(key);
        });
        keys.append(line);
      });
    }

    function box(origin, key) {
      const element = keys.querySelector(selectorFor(key));
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top, w: rect.width, h: rect.height };
    }

    // The hands are drawn resting on the home row and redrawn from the measured key boxes
    // whenever the layout changes; poseHands() then moves the working digit with a transform.
    function drawHands() {
      host.querySelector('.hand-layer')?.remove();
      const origin = host.getBoundingClientRect();
      if (!origin.width || !showHands || !global.TypingEaseHands) return;
      const home = {};
      for (const key of HOME_ROW) {
        const found = box(origin, key);
        if (!found) return;
        home[key] = found;
      }
      const space = box(origin, ' ');
      if (!space) return;
      keySize = { w: home.f.w, h: home.f.h };
      host.insertAdjacentHTML('beforeend', global.TypingEaseHands.markup({
        width: origin.width, height: origin.height, keyW: home.f.w, keyH: home.f.h, home,
        space: { x: space.x - space.w / 2, y: space.y, w: space.w }
      }));
    }

    // An uppercase letter or a shifted symbol also needs Shift, and it is the Shift of the OTHER
    // hand: the hand that types the character cannot hold the modifier at the same time.
    function markShift(character) {
      keys.querySelectorAll('.active-mod').forEach(element => element.classList.remove('active-mod'));
      const upper = typeof character === 'string' && character.length === 1
        && (!!SHIFT_MAP[character]
          || (character !== character.toLowerCase() && character === character.toUpperCase()));
      if (!upper) return;
      const shifts = keys.querySelectorAll(selectorFor('shift'));
      if (!shifts.length) return;
      const onLeft = (FINGERS[normalize(character)] || '').startsWith('L');
      const shift = shifts[onLeft && shifts.length > 1 ? shifts.length - 1 : 0];
      shift.classList.add('active-mod');
      // The pinky of the hand that is not typing the character holds Shift.
      return { element: shift, finger: onLeft ? 'RP' : 'LP' };
    }

    // Move the hands into position for the current target (typing.com's animated_hands): the
    // working digit reaches its key and the hand drifts after it, the other hand rests. Only
    // `style.transform` changes; the SVG is not rebuilt. A move list entry is a finger code and
    // the key element it should sit on.
    function poseHands(moves) {
      const layer = host.querySelector('.hand-layer');
      if (!layer) return;
      layer.querySelectorAll('.finger, .ghost-hand').forEach(element => { element.style.transform = ''; });
      if (!animated || !global.TypingEaseHands?.reach) return;
      const origin = host.getBoundingClientRect();
      moves.forEach(({ finger, element }) => {
        const group = layer.querySelector(`.finger[data-finger="${finger}"]`);
        if (!group || !element) return;
        // a digit already resting on its key (home row, thumb on Space) stays put
        if (group.dataset.key === element.dataset.pkey) return;
        const rect = element.getBoundingClientRect();
        const to = [rect.left + rect.width / 2 - origin.left, rect.top + rect.height / 2 - origin.top];
        const pose = global.TypingEaseHands.reach({
          base: [Number(group.dataset.kx), Number(group.dataset.ky)],
          tip: [Number(group.dataset.rx), Number(group.dataset.ry)],
          to, keyW: keySize.w, keyH: keySize.h
        });
        group.style.transform = pose.finger;
        const hand = group.closest('.ghost-hand');
        if (hand) hand.style.transform = pose.hand;
      });
    }

    // Each highlight request is a keystroke's worth of progress: measure the gap between them and
    // shorten the hand transition as the typist speeds up.
    function recordPace() {
      const now = performance.now();
      if (lastHighlightAt !== null) {
        const gap = now - lastHighlightAt;
        if (Number.isFinite(gap) && gap > 0) {
          gaps.push(Math.min(GAP_MAX, Math.max(GAP_MIN, gap)));
          if (gaps.length > SPEED_SAMPLES) gaps.shift();
        }
      }
      lastHighlightAt = now;
      const speed = gaps.length ? speedFor(gaps.reduce((total, gap) => total + gap, 0) / gaps.length) : SPEED_DEFAULT;
      host.style.setProperty('--hand-speed', `${speed.toFixed(3)}s`);
    }

    // `paced` is false when the same target is re-applied after a redraw (resize, layout change).
    function apply(character, paced) {
      lastCharacter = character;
      target = normalize(character);
      host.querySelectorAll('.active-key,.active-finger').forEach(element => element.classList.remove('active-key', 'active-finger', 'glow-full'));
      const shift = markShift(character);
      if (!target) { poseHands([]); return; }
      if (paced) recordPace();
      const keyElement = keys.querySelector(selectorFor(target));
      keyElement?.classList.add('active-key');
      const finger = FINGERS[target];
      const moves = [];
      if (finger) {
        host.querySelector(`[data-finger="${finger}"]`)?.classList.add('active-finger');
        moves.push({ finger, element: keyElement });
      }
      if (shift) {
        host.querySelector(`[data-finger="${shift.finger}"]`)?.classList.add('active-finger', 'glow-full');
        moves.push(shift);
      }
      poseHands(moves);
    }

    function highlight(character) { apply(character, true); }

    // Mark one key — or a group of them, for a lesson that teaches the number row two keys at a
    // time — without lighting a finger; this is what the "new key" chip points at.
    function mark(character) {
      const wanted = (Array.isArray(character) ? character : [character]).map(normalize).filter(Boolean);
      keys.querySelectorAll('.is-new').forEach(element => element.classList.remove('is-new'));
      wanted.forEach(key => keys.querySelector(selectorFor(key))?.classList.add('is-new'));
    }

    // Re-run a one-shot CSS animation on an element: drop the class, force a reflow so the
    // browser notices, add it back, and clear it once the animation has finished.
    // Timers live in a WeakMap: a dataset key such as `is-animatingTimer` is rejected by the
    // browser (hyphen followed by a lower-case letter) and would throw on every keystroke.
    const pulseTimers = new WeakMap();
    function pulse(element, className, ms) {
      if (!element) return;
      element.classList.remove(className);
      void element.getBoundingClientRect();
      element.classList.add(className);
      const timers = pulseTimers.get(element) || {};
      clearTimeout(timers[className]);
      timers[className] = setTimeout(() => element.classList.remove(className), ms);
      pulseTimers.set(element, timers);
    }

    // A key was struck correctly: the wanted key dips (typing.com's keyPressDefault) and the
    // finger on it makes a short downward jab.
    function press() {
      pulse(keys.querySelector('.key.active-key'), 'is-animating', 250);
      // the typing digit, not the pinky holding Shift
      pulse(host.querySelector('.hand-layer .finger.active-finger:not(.glow-full)'), 'pressing', 240);
    }

    // A wrong key was struck: flash the key that was actually hit red (typing.com's keyRejected).
    // Characters with no key on this layout (accented letters, control keys) are ignored.
    function reject(character) {
      const id = normalize(character);
      if (!id) return;
      pulse(keys.querySelector(selectorFor(id)), 'is-wrong', 250);
    }

    function layout({ compact: nextCompact = isCompact, hands: nextHands = showHands, animatedHands: nextAnimated = animated } = {}) {
      const rebuild = nextCompact !== isCompact;
      isCompact = nextCompact;
      showHands = nextHands;
      animated = nextAnimated;
      host.classList.toggle('is-compact', isCompact);
      host.classList.toggle('no-hands', !showHands);
      host.classList.toggle('hands-static', !animated);
      if (rebuild) build();
      drawHands();
      apply(lastCharacter, false);
    }

    build();
    layout({ compact: isCompact, hands: showHands, animatedHands: animated });

    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { drawHands(); apply(lastCharacter, false); }, 120); };
    global.addEventListener('resize', onResize);

    return {
      host, highlight, mark, press, reject, layout,
      destroy: () => { global.removeEventListener('resize', onResize); host.innerHTML = ''; },
      fingerFor: character => FINGERS[normalize(character)] || '',
      fingerName: character => FINGER_NAMES[FINGERS[normalize(character)]] || '',
      nameOfFinger: code => FINGER_NAMES[code] || ''
    };
  }

  global.TypingEaseKeyboard = { create, FINGERS, FINGER_NAMES, FULL_ROWS, COMPACT_ROWS, SHIFT_MAP };
})(window);
