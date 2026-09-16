(function (global) {
  'use strict';
  // Telex matching for Unit 3 (PLAN.md C6, DECISIONS.md quyết định 1).
  //
  // With a Vietnamese IME on (Unikey, EVKey, macOS Vietnamese, Gboard Telex) the browser never
  // sees the keys `s f r x j w` that carry tones: the IME swallows them and rewrites the text
  // that is already in the field. Typing "mas" produces the two-character value "ma" then "má".
  // So a character-by-character comparison is still the right model — as long as it can say
  // "this character is on its way" instead of "this character is wrong".
  //
  // Three states per character:
  //   ok       exact match after NFC normalisation
  //   pending  a legal intermediate composition state of the target character ("a" for "ầ",
  //            "â" for "ầ"), inside the syllable the user is still typing
  //   bad      anything else, plus any character still pending in a syllable already finished
  //
  // Errors are counted per SYLLABLE, not per keystroke: Backspace in Unikey removes a whole
  // tone, and a tone typed late ("nguyeen" -> "nguyên" -> "nguyễn") would otherwise be scored
  // as an error on every keystroke of the rest of the word.

  const CIRCUMFLEX = '̂';   // â ê ô
  const BREVE = '̆';        // ă
  const HORN = '̛';         // ư ơ
  const SHAPES = [CIRCUMFLEX, BREVE, HORN];
  const TONE_KEYS = {
    '̀': 'f',   // huyền
    '́': 's',   // sắc
    '̃': 'x',   // ngã
    '̉': 'r',   // hỏi
    '̣': 'j'    // nặng
  };
  const D_STROKE = { 'đ': 'd', 'Đ': 'D' };

  const nfc = text => String(text == null ? '' : text).normalize('NFC');

  // base letter + which shape mark + which tone mark, from the canonical decomposition.
  function parts(character) {
    if (D_STROKE[character]) return { base: D_STROKE[character], shape: 'stroke', tone: '' };
    const nfd = String(character).normalize('NFD');
    const out = { base: nfd[0] || '', shape: '', tone: '' };
    for (const mark of nfd.slice(1)) {
      if (SHAPES.includes(mark)) out.shape = mark;
      else if (TONE_KEYS[mark]) out.tone = mark;
    }
    return out;
  }

  // The physical keys a Telex typist presses for one composed character: "ầ" -> a a f,
  // "đ" -> d d, "ư" -> u w. Used for the per-key heatmap and to spot a missing IME.
  function keysFor(character) {
    const { base, shape, tone } = parts(character);
    if (!base) return [];
    const lower = base.toLowerCase();
    const keys = [lower];
    if (shape === 'stroke') keys.push('d');
    else if (shape === CIRCUMFLEX) keys.push(lower);
    else if (shape) keys.push('w');
    if (tone) keys.push(TONE_KEYS[tone]);
    return keys;
  }

  // Every value the field legally passes through while this character is being composed:
  // "ầ" goes a -> â -> ầ. The last entry is the character itself.
  function steps(character) {
    const { base, shape, tone } = parts(character);
    if (!base) return [character];
    const list = [base];
    if (shape === 'stroke') list.push(character);
    else if (shape) list.push((base + shape).normalize('NFC'));
    if (tone) list.push(character);
    return [...new Set(list)];
  }

  const isIntermediate = (typed, target) => typed !== target && steps(target).includes(typed);

  const isBoundary = character => character === ' ' || character === '\n';

  // What the keyboard would produce for this text with no IME running: "má" -> "mas". Telex
  // accepts the tone key right after the vowel ("nguyeexn") or at the end of the syllable
  // ("nguyeenx"), so both forms are produced; the case of the base letter is kept.
  function rawTelex(text, { toneAtEnd = false } = {}) {
    let out = '', syllable = '', tones = '';
    const flush = () => { out += syllable + tones; syllable = ''; tones = ''; };
    for (const character of nfc(text)) {
      if (isBoundary(character)) { flush(); out += character; continue; }
      const keys = keysFor(character);
      if (!keys.length) { syllable += character; continue; }
      const tone = TONE_KEYS[parts(character).tone] || '';
      const upper = character !== character.toLowerCase();
      syllable += (upper ? keys[0].toUpperCase() : keys[0]) + keys.slice(1).filter(key => key !== tone).join('');
      if (tone) { if (toneAtEnd) tones += tone; else syllable += tone; }
    }
    flush();
    return out;
  }

  // Same text with every diacritic removed — the ascii-fallback prompt (DECISIONS.md 1).
  const toAscii = text => [...nfc(text)]
    .map(character => (D_STROKE[character] ? D_STROKE[character] : parts(character).base || character))
    .join('');



  // Compare what is in the field against the target.
  // `settledTo` is the end of the last finished syllable: after it, "pending" still means
  // "being typed"; before it, a character that never got its tone is simply wrong.
  function compare(typedText, targetText) {
    const typed = nfc(typedText);
    const target = nfc(targetText);
    let settledTo = 0;
    for (let i = 0; i < typed.length; i += 1) if (isBoundary(typed[i])) settledTo = i + 1;

    const states = [];
    let ok = 0, bad = 0, pending = 0;
    for (let i = 0; i < typed.length; i += 1) {
      const character = typed[i];
      const want = target[i];
      let state;
      if (want === undefined) state = 'bad';
      else if (character === want) state = 'ok';
      else if (isIntermediate(character, want)) state = i < settledTo ? 'bad' : 'pending';
      else state = 'bad';
      states.push(state);
      if (state === 'ok') ok += 1; else if (state === 'bad') bad += 1; else pending += 1;
    }

    // Per syllable: a token is wrong if it holds a single bad character.
    let tokens = 0, badTokens = 0, tokenHasBad = false, tokenLength = 0;
    const closeToken = () => {
      if (tokenLength) { tokens += 1; if (tokenHasBad) badTokens += 1; }
      tokenHasBad = false;
      tokenLength = 0;
    };
    for (let i = 0; i < typed.length; i += 1) {
      if (isBoundary(typed[i])) { closeToken(); continue; }
      tokenLength += 1;
      if (states[i] === 'bad') tokenHasBad = true;
    }
    closeToken();

    return {
      states, ok, bad, pending, tokens, badTokens,
      accuracy: ok + bad ? Math.round(ok / (ok + bad) * 100) : 100,
      complete: typed.length >= target.length && bad === 0 && pending === 0
    };
  }

  // A user with no IME running types the raw keys, so the syllable arrives as "mas" instead of
  // "má". Tell the two apart on finished syllables only — mid-composition "ma" is not evidence.
  function looksUncomposed(typedToken, targetToken) {
    const typed = nfc(typedToken);
    const target = nfc(targetToken);
    if (!typed || !target || typed === target) return false;
    const early = rawTelex(target);
    const late = rawTelex(target, { toneAtEnd: true });
    return early !== target && (typed === early || typed === late);
  }

  global.TypingEaseTelex = {
    nfc, parts, keysFor, steps, isIntermediate, rawTelex, toAscii, compare, looksUncomposed,
    TONE_KEYS, CIRCUMFLEX, BREVE, HORN
  };
})(typeof window !== 'undefined' ? window : globalThis);
