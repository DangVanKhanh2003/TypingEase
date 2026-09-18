// Source-derived hand pose table from app.745.js (`Au`). The source computes
// the generic IDs from keyboard row/column, then uses the single-hand IDs when
// a learner has restricted the display to one hand.
const FULL_HIGHLIGHTS = {
  left: ['index', 'index', 'middle', 'ring', 'pinky', 'pinky', 'pinky'],
  right: ['index', 'index', 'middle', 'ring', 'pinky', 'pinky', 'pinky'],
};

function record(map, id, pose, highlight, full) {
  map[id] = { pose };
  if (highlight) map[id].highlight = highlight;
  if (full) map[id].full = true;
}

function addFullRow(map, side, row, count, poseIndex, { full = false } = {}) {
  for (let index = 1; index <= count; index += 1) {
    const pose = poseIndex[index - 1];
    record(
      map,
      `${side}-${row}-row-${index}`,
      pose === 'default' ? `default-${side}` : `${row}-row-${pose}-${side}`,
      FULL_HIGHLIGHTS[side][Math.min(index - 1, FULL_HIGHLIGHTS[side].length - 1)],
      full,
    );
  }
}

function highlightForSingle(side, row, token) {
  const left = {
    home: { return: 'index', a: 'pinky', s: 'pinky', d: 'pinky', f: 'pinky', g: 'ring', h: 'middle', j: 'index', k: 'index', l: 'index', semicolon: 'index', comma: 'index' },
    top: { q: 'pinky', w: 'pinky', e: 'pinky', r: 'pinky', t: 'ring', y: 'middle', u: 'index', i: 'index', o: 'index', p: 'index', 'bracket-l': 'index', 'bracket-r': 'index', slash: 'index' },
    bottom: { z: 'pinky', x: 'pinky', c: 'pinky', v: 'pinky', b: 'ring', n: 'middle', m: 'index', comma: 'index', period: 'index', slash: 'index' },
    num: { tilde: 'pinky', 1: 'pinky', 2: 'pinky', 3: 'pinky', 4: 'pinky', 5: 'ring', 6: 'middle', 7: 'index', 8: 'index', 9: 'index', 0: 'index', dash: 'index', equals: 'index' },
  };
  const right = {
    home: { return: 'pinky', a: 'index', s: 'index', d: 'index', f: 'index', g: 'middle', h: 'ring', j: 'pinky', k: 'pinky', l: 'pinky', semicolon: 'pinky', comma: 'pinky' },
    top: { q: 'index', w: 'index', e: 'index', r: 'index', t: 'middle', y: 'ring', u: 'pinky', i: 'pinky', o: 'pinky', p: 'pinky', 'bracket-l': 'pinky', 'bracket-r': 'pinky', slash: 'pinky' },
    bottom: { z: 'index', x: 'index', c: 'index', v: 'index', b: 'middle', n: 'ring', m: 'pinky', comma: 'pinky', period: 'pinky', slash: 'pinky' },
    num: { tilde: 'index', 1: 'index', 2: 'index', 3: 'index', 4: 'index', 5: 'middle', 6: 'ring', 7: 'pinky', 8: 'pinky', 9: 'pinky', 0: 'pinky', dash: 'pinky', equals: 'pinky' },
  };
  return (side === 'left' ? left : right)[row]?.[token] || null;
}

function addSingleRow(map, side, row, entries, { spaceRow = row, full = false } = {}) {
  const sourceRow = row === 'num' ? 'number' : row;
  record(map, `single-${side}-${spaceRow}-row-space`, `single-default-${side}`, 'thumb', full);
  for (const [key, pose] of entries) {
    record(
      map,
      `single-${side}-${row}-row-${key}`,
      `single-${row}-row-${pose}-${side}`,
      highlightForSingle(side, row, pose),
      full,
    );
  }
}

function createPoseMap() {
  const map = {};
  record(map, 'space', 'default-right', 'thumb');
  record(map, 'left-resting-hand', 'default-left');
  record(map, 'right-resting-hand', 'default-right');
  record(map, 'right-option', 'option-right', 'pinky');

  addFullRow(map, 'left', 'home', 7, [1, 2, 3, 4, 5, 7, 5], { full: true });
  addFullRow(map, 'left', 'bottom', 7, [1, 2, 3, 4, 5, 7, 5], { full: true });
  addFullRow(map, 'left', 'top', 7, [1, 2, 3, 4, 5, 7, 5]);
  // The number row is asymmetrical in the source mapping. Keep its IDs and
  // clips literal rather than folding it into the visual-row helper above.
  [
    [1, 2, 'index'],
    [2, 2, 'index'],
    [3, 3, 'index'],
    [4, 4, 'middle'],
    [5, 5, 'ring'],
    [6, 6, 'pinky'],
    [7, 7, 'pinky'],
  ].forEach(([id, pose, highlight]) => record(map, `left-num-row-${id}`, `num-row-${pose}-left`, highlight));
  addFullRow(map, 'right', 'home', 7, [1, 2, 3, 4, 'default', 6, 7], { full: true });
  addFullRow(map, 'right', 'bottom', 7, [1, 2, 3, 4, 5, 7, 5], { full: true });
  addFullRow(map, 'right', 'top', 8, [1, 2, 3, 4, 5, 6, 7, 8]);
  [
    [0, 0, 'index'],
    [1, 2, 'index'],
    [2, 3, 'middle'],
    [3, 4, 'ring'],
    [4, 5, 'pinky'],
    [5, 6, 'pinky'],
    [6, 7, 'pinky'],
  ].forEach(([id, pose, highlight]) => record(map, `right-num-row-${id}`, `num-row-${pose}-right`, highlight));

  const home = [['return', 'return'], ['a', 'a'], ['s', 's'], ['d', 'd'], ['f', 'f'], ['g', 'g'], ['h', 'h'], ['j', 'j'], ['k', 'k'], ['l', 'l'], [';', 'semicolon'], ['id-6', 'comma']];
  const top = [['q', 'q'], ['w', 'w'], ['e', 'e'], ['r', 'r'], ['t', 't'], ['y', 'y'], ['u', 'u'], ['i', 'i'], ['o', 'o'], ['p', 'p'], ['id-6', 'bracket-l'], ['id-7', 'bracket-r'], ['id-8', 'slash']];
  const bottom = [['z', 'z'], ['x', 'x'], ['c', 'c'], ['v', 'v'], ['b', 'b'], ['n', 'n'], ['m', 'm'], [',', 'comma'], ['.', 'period'], ['id-5', 'slash']];
  const rightNum = [['tilde', 'tilde'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['0', '0'], ['-', 'dash'], ['=', 'equals']];
  const leftNum = [...rightNum.slice(0, -1), ['equals', 'equals']];
  for (const side of ['left', 'right']) {
    record(map, `single-${side}-home-rest`, `single-default-${side}`);
    addSingleRow(map, side, 'home', home);
    addSingleRow(map, side, 'top', top);
    addSingleRow(map, side, 'bottom', bottom, { full: true });
    addSingleRow(map, side, 'num', side === 'left' ? leftNum : rightNum, { spaceRow: 'number' });
  }
  return Object.freeze(map);
}

export const POSE_MAP = createPoseMap();

function entryValue(value) {
  return typeof value === 'object' && value ? String(value.key || '') : String(value || '');
}

function normalizedKey(value) {
  if (value === 'Enter' || value === '\n' || value === '\u23ce') return 'enter';
  if (value === 'Backspace' || value === 'Delete') return 'backspace';
  return String(value || '').toLowerCase();
}

function findLayoutEntry(layout, key) {
  const expected = normalizedKey(key);
  const rows = layout?.structure || [];
  // A glyph can appear both as a normal key and as a shifted/AltGr form on a
  // different physical key (notably in phonetic Hebrew). Prefer its direct
  // key so an unmodified typing prompt always receives the matching hand.
  // Modifier-specific callers should pass the hardware code in a later input
  // event contract; until then we must never let a shifted duplicate shadow a
  // direct key merely because it appears earlier in the visual rows.
  for (const property of ['main', 'shifted', 'alt', 'hidden']) {
    for (const [row, entries] of rows.entries()) {
      for (const [index, entry] of entries.entries()) {
        if (normalizedKey(entryValue(entry[property])) === expected) return { entry, row, column: index + 1 };
      }
    }
  }
  for (const [row, entries] of rows.entries()) {
    for (const [index, entry] of entries.entries()) {
      if ((expected === 'enter' && entry.hardware === 'Enter') || (expected === 'backspace' && entry.hardware === 'Backspace') || (expected === ' ' && entry.hardware === 'Space')) return { entry, row, column: index + 1 };
    }
  }
  return null;
}

function rowName(row) {
  return ['num', 'top', 'home', 'bottom', 'opt'][row] || null;
}

function sideForColumn(row, column) {
  return column <= (row === 0 ? 5 : 6) ? 'left' : 'right';
}

// A layout's touch-typing assignment is authoritative.  Most legacy maps look
// like US QWERTY at the centre of a row, but several correctly assign the
// physical "6" (and equivalent letters) to the left index finger.  Deriving
// the hand from a visual column made those maps light up the opposite hand.
function sideForFinger(finger) {
  const value = Number(finger);
  if (value >= 1 && value <= 5) return 'left';
  if (value >= 7 && value <= 10) return 'right';
  return null;
}

/**
 * Resolve a pressed character to the active layout's authoritative assignment.
 * Row/column remain only pose coordinates; the hand itself always follows the
 * layout's explicit `finger` value when it has one.
 */
export function resolveLayoutKeyAssignment(layout, key) {
  const found = findLayoutEntry(layout, key);
  if (!found) return null;
  const column = sourceColumn(found.row, found.column - 1);
  return {
    ...found,
    column,
    side: sideForFinger(found.entry.finger) || sideForColumn(found.row, column),
  };
}

function sourceColumn(row, index) {
  // `setupKeyStructures` shifts the standard number row left one column when
  // it reaches the key labelled 1. The hand IDs use that adjusted column.
  return row === 0 ? index : index + 1;
}

function genericFingerId(row, column, side, animated = true) {
  const name = rowName(row);
  if (!name) return null;
  let index = side === 'right' ? column - 6 : 7 - column;
  // Some national touch maps intentionally carry an index finger one key
  // beyond the US midpoint (for example Turkish F `ç`). The source atlas has
  // no zero-index left-hand clip; position 1 is its furthest inward index
  // reach and is the accurate existing pose for that assignment. Right number
  // row deliberately keeps its zero-index clip for the physical `6` key.
  if (side === 'left' && index < 1) index = 1;
  if (index < 0) return null;
  const poseRow = animated ? name : 'home';
  const poseIndex = animated ? index : Math.max(2, Math.min(5, index));
  const id = `${side}-${poseRow}-row-${poseIndex}`;
  // The source pose atlas was authored for the existing hand model, not every
  // conceivable cross-over assignment. Do not manufacture a pose outside it.
  return POSE_MAP[id] ? id : null;
}

function singleToken(found) {
  const value = entryValue(found.entry.main);
  if (found.entry.hardware === 'Enter') return 'return';
  if (found.entry.hardware === 'Space') return 'space';
  if (found.row === 0) {
    if (value === '`') return 'tilde';
    if (value === '-') return '-';
    if (value === '=') return 'equals';
    return value;
  }
  if (found.row === 1) return ({ '[': 'id-6', ']': 'id-7', '\\': 'id-8' })[value] || value;
  if (found.row === 2) return value === ';' ? ';' : value;
  if (found.row === 3) return value === '/' ? 'id-5' : value;
  return value;
}

function singlePoseId(side, found) {
  const name = rowName(found.row);
  if (!name) return null;
  const token = singleToken(found);
  if (token === 'space') return `single-${side}-${name === 'num' ? 'number' : name}-row-space`;
  const suffix = side === 'left' && name === 'num' && token === 'equals' ? 'equals' : token;
  return `single-${side}-${name}-row-${suffix}`;
}

function restSlot(side) {
  const id = `${side}-resting-hand`;
  return { fingerId: id, imageName: id, entry: POSE_MAP[id] };
}

export function resolveHandSlots({ layout, key, side, dominantHand, animated = true } = {}) {
  const assignment = resolveLayoutKeyAssignment(layout, key);
  if (!assignment) return { left: restSlot('left'), right: restSlot('right') };
  const found = assignment;
  if (found.entry.hardware === 'Space') {
    if (dominantHand) {
      const id = dominantHand === 'left' ? 'single-left-bottom-row-space' : 'single-right-home-row-space';
      return { left: dominantHand === 'left' ? { fingerId: 'space', imageName: id, entry: POSE_MAP[id] } : null, right: dominantHand === 'right' ? { fingerId: 'space', imageName: id, entry: POSE_MAP[id] } : null };
    }
    return { left: restSlot('left'), right: { fingerId: 'space', imageName: 'space', entry: POSE_MAP.space } };
  }
  const activeSide = side || found.side;
  if (dominantHand) {
    const imageName = singlePoseId(dominantHand, found);
    const entry = POSE_MAP[imageName] || POSE_MAP[`single-${dominantHand}-home-rest`];
    const fingerId = genericFingerId(found.row, found.column, activeSide, animated) || `${activeSide}-resting-hand`;
    const slot = { fingerId, imageName, entry };
    return { left: dominantHand === 'left' ? slot : null, right: dominantHand === 'right' ? slot : null };
  }
  const fingerId = genericFingerId(found.row, found.column, activeSide, animated) || `${activeSide}-resting-hand`;
  const entry = POSE_MAP[fingerId] || POSE_MAP[`${activeSide}-resting-hand`];
  const slot = { fingerId, imageName: fingerId, entry };
  return activeSide === 'left' ? { left: slot, right: restSlot('right') } : { left: restSlot('left'), right: slot };
}
