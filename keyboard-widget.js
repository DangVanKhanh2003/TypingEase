(function (global) {
  // A self-contained keyboard + ghost-hands widget.
  //
  // The geometry and the finger-reach maths are the ones script.js uses for the homepage
  // keyboard; the difference is that every query here is scoped to the widget's own root and
  // the keys carry `data-pkey` instead of `data-key`. That matters because script.js's
  // highlightGuide()/reachForKey()/pressActiveFinger() query the whole document for
  // `.key[data-key]` and `.hand-layer .finger` — a second keyboard using the same hooks would
  // be yanked around by them (DECISIONS.md pitfall 4). With `data-pkey` this widget can sit on
  // any page, next to any other keyboard, without either one interfering.
  const FULL_ROWS = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Back'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'Enter'],
    ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Alt', ' ', 'Alt', 'Ctrl']
  ];
  // Phones get letters and a space bar only: three rows and no hands (PLAN.md B8).
  const COMPACT_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
    [' ']
  ];
  const HOME_ROW = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];
  const FINGERS = {
    q: 'LP', a: 'LP', z: 'LP', '1': 'LP', tab: 'LP', caps: 'LP', shift: 'LP',
    w: 'LR', s: 'LR', x: 'LR', '2': 'LR',
    e: 'LM', d: 'LM', c: 'LM', '3': 'LM',
    r: 'LI', f: 'LI', v: 'LI', t: 'LI', g: 'LI', b: 'LI', '4': 'LI', '5': 'LI',
    y: 'RI', h: 'RI', n: 'RI', u: 'RI', j: 'RI', m: 'RI', '6': 'RI', '7': 'RI',
    i: 'RM', k: 'RM', ',': 'RM', '8': 'RM',
    o: 'RR', l: 'RR', '.': 'RR', '9': 'RR',
    p: 'RP', ';': 'RP', '/': 'RP', '\'': 'RP', '0': 'RP', '-': 'RP', '=': 'RP',
    '[': 'RP', ']': 'RP', '\\': 'RP', enter: 'RP', back: 'RP',
    ' ': 'LT'
  };
  // The ten finger codes, in the order hands.js draws them: LP sits on `a`, LR on `s`, and so on
  // out to RP on `;`. Lesson data uses exactly these codes in `screen.finger`.
  const FINGER_NAMES = {
    LP: 'ngón út trái', LR: 'ngón áp út trái', LM: 'ngón giữa trái', LI: 'ngón trỏ trái', LT: 'ngón cái trái',
    RT: 'ngón cái phải', RI: 'ngón trỏ phải', RM: 'ngón giữa phải', RR: 'ngón áp út phải', RP: 'ngón út phải'
  };

  const KEY_LABELS = { ' ': 'Space', Back: '⌫', Tab: '⇥', Caps: '⇪', Enter: '⏎', Shift: '⇧' };

  const normalize = character => {
    if (character === '\n') return 'enter';
    if (character === ' ') return ' ';
    return typeof character === 'string' && character ? character.toLowerCase() : '';
  };

  function create({ host, compact = false, hands = true } = {}) {
    if (!host) return null;
    let showHands = hands, isCompact = compact, points = new Map(), resizeTimer = null, target = '';

    host.classList.add('keyboard-demo', 'kb-widget');
    host.innerHTML = '<div class="keyboard kb-keys"></div>';
    const keys = host.querySelector('.kb-keys');

    function build() {
      keys.innerHTML = '';
      (isCompact ? COMPACT_ROWS : FULL_ROWS).forEach(row => {
        const line = document.createElement('div');
        line.className = 'key-row';
        row.forEach(label => {
          const key = document.createElement('span');
          const id = label.length > 1 ? label.toLowerCase() : label;
          key.className = 'key'
            + (label.length > 1 ? ' wide' : '')
            + (label === ' ' ? ' space' : '')
            + (label === 'f' || label === 'j' ? ' home' : '');
          key.dataset.pkey = id;
          key.textContent = KEY_LABELS[label] || label;
          line.append(key);
        });
        keys.append(line);
      });
    }

    function box(origin, key) {
      const element = keys.querySelector(`.key[data-pkey="${key === '\\' ? '\\\\' : key}"]`);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top, w: rect.width, h: rect.height };
    }

    function cachePoints(origin) {
      points = new Map();
      keys.querySelectorAll('.key[data-pkey]').forEach(key => {
        const rect = key.getBoundingClientRect();
        points.set(key.dataset.pkey, [rect.left + rect.width / 2 - origin.left, rect.top + rect.height / 2 - origin.top]);
      });
    }

    function drawHands() {
      host.querySelector('.hand-layer')?.remove();
      const origin = host.getBoundingClientRect();
      if (!origin.width) return;
      cachePoints(origin);
      if (!showHands || !global.TypingEaseHands) return;
      const home = {};
      for (const key of HOME_ROW) {
        const found = box(origin, key);
        if (!found) return;
        home[key] = found;
      }
      const space = box(origin, ' ');
      if (!space) return;
      host.insertAdjacentHTML('beforeend', global.TypingEaseHands.markup({
        width: origin.width, height: origin.height, keyW: home.f.w, keyH: home.f.h, home,
        space: { x: space.x - space.w / 2, y: space.y, w: space.w }
      }));
      cachePoints(origin);
    }

    // Swing the active finger round its knuckle and stretch it just far enough to reach the key.
    function reach(key) {
      const point = points.get(key);
      host.querySelectorAll('.hand-layer .finger').forEach(group => {
        const knuckle = [Number(group.dataset.kx), Number(group.dataset.ky)];
        const rest = [Number(group.dataset.rx), Number(group.dataset.ry)];
        const resting = !point || key === group.dataset.key || !group.classList.contains('active-finger');
        if (resting || !Number.isFinite(rest[0])) { group.style.transform = ''; return; }
        const restAngle = Math.atan2(rest[1] - knuckle[1], rest[0] - knuckle[0]);
        const reachAngle = Math.atan2(point[1] - knuckle[1], point[0] - knuckle[0]);
        const stretch = Math.hypot(point[0] - knuckle[0], point[1] - knuckle[1])
          - Math.hypot(rest[0] - knuckle[0], rest[1] - knuckle[1]);
        group.style.transform = `translate(${(Math.cos(reachAngle) * stretch).toFixed(1)}px, ${(Math.sin(reachAngle) * stretch).toFixed(1)}px)`
          + ` rotate(${((reachAngle - restAngle) * 180 / Math.PI).toFixed(1)}deg)`;
      });
    }

    function highlight(character) {
      target = normalize(character);
      host.querySelectorAll('.active-key,.active-finger').forEach(element => element.classList.remove('active-key', 'active-finger'));
      if (!target) { reach(''); return; }
      const matched = keys.querySelector(`.key[data-pkey="${target === '\\' ? '\\\\' : target}"]`);
      if (matched) matched.classList.add('active-key');
      const finger = FINGERS[target];
      if (finger) host.querySelector(`[data-finger="${finger}"]`)?.classList.add('active-finger');
      reach(target);
    }

    // Mark a key without moving a finger to it — used by the "new key" chip on intro screens.
    function mark(character) {
      const key = normalize(character);
      keys.querySelectorAll('.is-new').forEach(element => element.classList.remove('is-new'));
      if (!key) return;
      keys.querySelector(`.key[data-pkey="${key === '\\' ? '\\\\' : key}"]`)?.classList.add('is-new');
    }

    // A short dip on the finger that just struck a key.
    function press() {
      const group = host.querySelector('.hand-layer .finger.active-finger');
      if (!group) return;
      group.classList.remove('pressing');
      void group.getBoundingClientRect();
      group.classList.add('pressing');
      clearTimeout(Number(group.dataset.pressTimer));
      group.dataset.pressTimer = String(setTimeout(() => group.classList.remove('pressing'), 240));
    }

    function layout({ compact: nextCompact = isCompact, hands: nextHands = showHands } = {}) {
      const rebuild = nextCompact !== isCompact;
      isCompact = nextCompact;
      showHands = nextHands;
      host.classList.toggle('is-compact', isCompact);
      host.classList.toggle('no-hands', !showHands);
      if (rebuild) build();
      drawHands();
      highlight(target);
    }

    build();
    layout({ compact: isCompact, hands: showHands });

    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { drawHands(); highlight(target); }, 120); };
    global.addEventListener('resize', onResize);

    return {
      host, highlight, mark, press, layout,
      destroy: () => { global.removeEventListener('resize', onResize); host.innerHTML = ''; },
      fingerFor: character => FINGERS[normalize(character)] || '',
      fingerName: character => FINGER_NAMES[FINGERS[normalize(character)]] || '',
      nameOfFinger: code => FINGER_NAMES[code] || ''
    };
  }

  global.TypingEaseKeyboard = { create, FINGERS, FINGER_NAMES, FULL_ROWS, COMPACT_ROWS };
})(window);
