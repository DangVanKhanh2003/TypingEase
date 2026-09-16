(function (global) {
  // Hands drawn over the keyboard, styled after the lesson player of typing.com: two
  // translucent hands resting on the home row, fading out towards the wrist, with the working
  // finger tinted blue. typing.com renders a 3D model into a canvas; this is our own SVG that
  // fakes the volume (cylindrical shading, joint bands, seam shadows, knuckles, nails) and gets
  // the same treatment (opacity, fade, shadow) in hands.css.
  //
  // Geometry is parametric. Fingertips are pinned to the home-row keys measured on the page, so
  // the hands fit whatever size the keyboard renders at, and each finger group carries the hooks
  // the widgets use: `.finger[data-finger][data-key]`, `.digit-press`, `.finger-glow`. Everything
  // that belongs to a digit lives inside its `.finger`, and each hand is one `.ghost-hand` group,
  // so a transform on either moves the whole thing (poses are applied that way).
  const HOME_KEYS = {
    left:  [['LP', 'a'], ['LR', 's'], ['LM', 'd'], ['LI', 'f']],
    right: [['RI', 'j'], ['RM', 'k'], ['RR', 'l'], ['RP', ';']]
  };
  // Proportions measured on typing.com's hands (Capture.PNG), in key units: knuckle-to-tip
  // length in key heights, digit width in key widths.
  const DIGITS = {
    LP: { length: 2.3, width: 0.88 }, LR: { length: 3.05, width: 0.97 }, LM: { length: 3.3, width: 1.0 }, LI: { length: 3.0, width: 1.02 },
    RI: { length: 3.0, width: 1.02 }, RM: { length: 3.3, width: 1.0 }, RR: { length: 3.05, width: 0.97 }, RP: { length: 2.3, width: 0.88 },
    LT: { length: 1.9, width: 1.24 }, RT: { length: 1.9, width: 1.24 }
  };
  const CONVERGE = 0.82;     // knuckles sit closer together than the fingertips
  const LEAN = 0.2;          // finger bases shift this far towards the pinky: fingers point up and slightly inward
  const BEND = 0.09;         // in-plane bow of a digit towards the thumb, in key widths (two bent joints seen from above)
  const PALM_DEPTH = 2.6;    // knuckle line -> heel of the palm, in key heights
  const WRIST_DEPTH = 3.9;   // knuckle line -> where the forearm leaves the frame
  const FOREARM_LEAN = 1.6;  // the wrist sits this far outward (key widths): arms come in from the sides
  const WRIST_HALF = 1.5;    // half the wrist width, in key widths
  const FADE_FROM = 1.1;     // knuckle line -> where the hand starts to dissolve (key heights)
  const FADE_TO = 3.6;       // knuckle line -> fully gone
  const THUMB_GAP = 1.0;     // thumb tips sit this far either side of the middle of the space bar

  const round = value => Math.round(value * 10) / 10;
  const at = ([x, y]) => `${round(x)} ${round(y)}`;
  const add = ([ax, ay], [bx, by]) => [ax + bx, ay + by];
  const sub = ([ax, ay], [bx, by]) => [ax - bx, ay - by];
  const scale = ([x, y], factor) => [x * factor, y * factor];
  const unit = ([x, y]) => { const length = Math.hypot(x, y) || 1; return [x / length, y / length]; };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // Cubic segments through every point (Catmull-Rom), continuing a path that is already at points[0].
  function through(points) {
    let d = '';
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C ${at(c1)} ${at(c2)} ${at(p2)} `;
    }
    return d;
  }

  // Centreline of a digit with two bent joints: base -> proximal joint -> distal joint -> tip.
  // `bend` bows the joints sideways (in key widths, signed), `offset` shifts the whole line.
  function spine(base, tip, bend, offset = 0) {
    const axis = unit(sub(tip, base));
    const normal = [-axis[1], axis[0]];
    const shift = amount => scale(normal, amount + offset);
    return [add(base, shift(0)), add(lerp(base, tip, 0.46), shift(bend * 0.7)), add(lerp(base, tip, 0.76), shift(bend)), add(tip, shift(bend * 0.55))];
  }

  // Outline of a digit around its spine: widths taper from the base to the pad, rounded tip.
  function digitPath(points, widths) {
    const normals = points.map((point, i) => {
      const from = points[Math.max(0, i - 1)], to = points[Math.min(points.length - 1, i + 1)];
      const axis = unit(sub(to, from));
      return [-axis[1], axis[0]];
    });
    const left = points.map((point, i) => add(point, scale(normals[i], widths[i] / 2)));
    const right = points.map((point, i) => add(point, scale(normals[i], -widths[i] / 2)));
    const last = points.length - 1, r = round(widths[last] / 2);
    return `M ${at(left[0])} ${through(left)}A ${r} ${r} 0 0 1 ${at(right[last])} ${through(right.slice().reverse())}Z`;
  }

  // A faint crease across a digit at one of its joints.
  function crease(points, width, along) {
    const centre = lerp(points[1], points[2], along);
    const axis = unit(sub(points[2], points[1]));
    const normal = [-axis[1], axis[0]];
    const a = add(centre, scale(normal, width * 0.36)), b = add(centre, scale(normal, -width * 0.36));
    return `M ${at(a)} Q ${at(add(centre, scale(axis, -width * 0.1)))} ${at(b)}`;
  }

  // Everything for one digit: body with its own shadow, shading bands along the joints, a
  // specular strip, creases, nail, highlight. All inside `.finger` so a transform moves it whole.
  function digit({ id, homeKey, base, tip, width, bend, prefix }) {
    const points = spine(base, tip, bend);
    const widths = [width, width * 0.97, width * 0.93, width * 0.86];
    const body = digitPath(points, widths);
    const axis = unit(sub(tip, base));
    const normal = [-axis[1], axis[0]];
    // Thin highlight strip along the lit side, stopping short of the pad.
    const spec = digitPath(spine(base, lerp(base, tip, 0.9), bend, -width * 0.16), [width * 0.26, width * 0.24, width * 0.2, width * 0.14]);
    const nailCentre = add(points[3], scale(axis, -width * 0.3));
    const angle = Math.atan2(axis[1], axis[0]) * 180 / Math.PI - 90;
    const mid = lerp(base, tip, 0.5);
    const across = [add(mid, scale(normal, -width / 2)), add(mid, scale(normal, width / 2))];
    const gid = `${prefix}${id}`;
    const defs = `<linearGradient id="tube-${gid}" gradientUnits="userSpaceOnUse" x1="${round(across[0][0])}" y1="${round(across[0][1])}" x2="${round(across[1][0])}" y2="${round(across[1][1])}">`
      + `<stop offset="0" stop-color="#62403a" /><stop offset="0.2" stop-color="#a4746b" /><stop offset="0.46" stop-color="#bc8b80" />`
      + `<stop offset="0.74" stop-color="#a07369" /><stop offset="1" stop-color="#583731" /></linearGradient>`
      // Shading along the digit, seen from above a bent finger: the crease under the nail is
      // dark, the two joint ridges catch the light, the segments between them sit lower, and it
      // is darkest where it disappears into the palm.
      + `<linearGradient id="bands-${gid}" gradientUnits="userSpaceOnUse" x1="${round(tip[0])}" y1="${round(tip[1])}" x2="${round(base[0])}" y2="${round(base[1])}">`
      + `<stop offset="0" stop-color="#fff" stop-opacity=".1" /><stop offset="0.1" stop-color="#5a322c" stop-opacity="0" />`
      + `<stop offset="0.2" stop-color="#5a322c" stop-opacity=".22" /><stop offset="0.3" stop-color="#fff" stop-opacity=".14" />`
      + `<stop offset="0.42" stop-color="#5a322c" stop-opacity=".12" /><stop offset="0.54" stop-color="#fff" stop-opacity=".12" />`
      + `<stop offset="0.66" stop-color="#5a322c" stop-opacity=".1" /><stop offset="0.86" stop-color="#5a322c" stop-opacity=".14" />`
      + `<stop offset="1" stop-color="#3f231f" stop-opacity=".42" /></linearGradient>`
      + `<linearGradient id="spec-${gid}" gradientUnits="userSpaceOnUse" x1="${round(tip[0])}" y1="${round(tip[1])}" x2="${round(base[0])}" y2="${round(base[1])}">`
      + `<stop offset="0.08" stop-color="#fff" stop-opacity="0" /><stop offset="0.2" stop-color="#fff" stop-opacity=".3" />`
      + `<stop offset="0.7" stop-color="#fff" stop-opacity=".2" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient>`
      // The blue cue: solid over the pad and first joint, gone by 80% of the digit.
      + `<linearGradient id="glow-${gid}" gradientUnits="userSpaceOnUse" x1="${round(tip[0])}" y1="${round(tip[1])}" x2="${round(base[0])}" y2="${round(base[1])}">`
      + `<stop offset="0" stop-color="#1fa0c8" /><stop offset="0.14" stop-color="#37b3d6" /><stop offset="0.45" stop-color="#37b3d6" />`
      + `<stop offset="0.8" stop-color="#37b3d6" stop-opacity="0" /></linearGradient>`;
    const markup = `<g class="finger" data-finger="${id}" data-key="${homeKey}" data-kx="${round(base[0])}" data-ky="${round(base[1])}"`
      + ` data-rx="${round(tip[0])}" data-ry="${round(tip[1])}" style="transform-origin:${round(base[0])}px ${round(base[1])}px">`
      + `<g class="digit-press">`
      + `<path class="hand-digit" d="${body}" fill="url(#tube-${gid})" filter="url(#digit-shadow)" />`
      + `<path class="hand-bands" d="${body}" fill="url(#bands-${gid})" />`
      + `<path class="hand-spec" d="${spec}" fill="url(#spec-${gid})" />`
      + `<path class="hand-crease" d="${crease(points, width, 0.02)} ${crease(points, width * 0.92, 1)}" />`
      + `<ellipse class="hand-nail" cx="${round(nailCentre[0])}" cy="${round(nailCentre[1])}" rx="${round(width * 0.27)}" ry="${round(width * 0.31)}"`
      + ` transform="rotate(${round(angle)} ${round(nailCentre[0])} ${round(nailCentre[1])})" />`
      + `<ellipse class="hand-nail-shine" cx="${round(nailCentre[0] - width * 0.06)}" cy="${round(nailCentre[1] - width * 0.08)}" rx="${round(width * 0.12)}" ry="${round(width * 0.09)}"`
      + ` transform="rotate(${round(angle)} ${round(nailCentre[0])} ${round(nailCentre[1])})" />`
      + `<path class="finger-glow" d="${body}" fill="url(#glow-${gid})" /></g></g>`;
    return { defs, markup, points };
  }

  function hand(side, metrics) {
    const { keyW, keyH, home, space, height } = metrics;
    const toPinky = side === 'left' ? -1 : 1, toThumb = -toPinky, prefix = side === 'left' ? 'L' : 'R';
    const tips = HOME_KEYS[side].map(([id, key]) => ({ id, homeKey: key, point: [home[key].x, home[key].y - keyH * 0.1] }));
    const centreX = tips.reduce((total, finger) => total + finger.point[0], 0) / tips.length;

    const fingers = tips.map(finger => {
      const spec = DIGITS[finger.id];
      const base = [centreX + (finger.point[0] - centreX) * CONVERGE + toPinky * keyW * LEAN, finger.point[1] + keyH * spec.length];
      return { id: finger.id, homeKey: finger.homeKey, base, tip: finger.point, width: keyW * spec.width, bend: toThumb * keyW * BEND, prefix };
    });
    const byId = Object.fromEntries(fingers.map(finger => [finger.id, finger]));
    const index = byId[`${prefix}I`], middle = byId[`${prefix}M`], pinky = byId[`${prefix}P`];

    // Palm: knuckle arc under the finger bases, heel of the hand, forearm leaving the frame on
    // the outside; the inner edge bulges where the thumb grows out of it.
    const palmY = middle.base[1] + keyH * PALM_DEPTH;
    const wristY = Math.min(height - 1, middle.base[1] + keyH * WRIST_DEPTH);
    const wristCentre = centreX + toPinky * keyW * FOREARM_LEAN;
    const outerTop = [pinky.base[0] + toPinky * keyW * 0.55, pinky.base[1] - keyH * 0.2];
    const innerTop = [index.base[0] + toThumb * keyW * 0.5, index.base[1] - keyH * 0.3];
    const palmOuter = [pinky.base[0] + toPinky * keyW * 0.7, palmY - keyH * 0.8];
    const palmInner = [index.base[0] + toThumb * keyW * 0.85, palmY - keyH * 0.5];
    const wristOuter = [wristCentre + toPinky * keyW * WRIST_HALF, wristY];
    const wristInner = [wristCentre + toThumb * keyW * WRIST_HALF, wristY];
    const knuckleY = (index.base[1] + pinky.base[1]) / 2 - keyH * 0.2;

    const palm = `M ${at(innerTop)} `
      + `C ${at([innerTop[0] + (outerTop[0] - innerTop[0]) * 0.3, knuckleY])} ${at([innerTop[0] + (outerTop[0] - innerTop[0]) * 0.7, knuckleY])} ${at(outerTop)} `
      + `C ${at([outerTop[0] + toPinky * keyW * 0.2, outerTop[1] + keyH * 0.9])} ${at([palmOuter[0] + toPinky * keyW * 0.1, palmOuter[1] - keyH * 1.0])} ${at(palmOuter)} `
      + `C ${at([palmOuter[0] - toPinky * keyW * 0.05, palmOuter[1] + keyH * 0.9])} ${at([wristOuter[0], wristOuter[1] - keyH * 1.0])} ${at(wristOuter)} `
      + `L ${at(wristInner)} `
      + `C ${at([wristInner[0], wristInner[1] - keyH * 1.2])} ${at([palmInner[0], palmInner[1] + keyH * 1.0])} ${at(palmInner)} `
      + `C ${at([palmInner[0], palmInner[1] - keyH * 1.0])} ${at([innerTop[0] + toThumb * keyW * 0.15, innerTop[1] + keyH * 0.9])} ${at(innerTop)} Z`;

    // The thumb comes out from under the inner side of the palm and angles in towards the
    // middle of the space bar, tucked well below the fingers.
    const spaceMid = space.x + space.w / 2;
    const thumbTip = [spaceMid + toThumb * -keyW * THUMB_GAP, space.y + keyH * 0.05];
    const thumbBase = [index.base[0] - toThumb * keyW * 0.15, index.base[1] + keyH * 1.3];
    const thumb = digit({ id: `${prefix}T`, homeKey: ' ', base: thumbBase, tip: thumbTip, width: keyW * DIGITS[`${prefix}T`].width, bend: toPinky * keyW * 0.16, prefix });

    const drawn = fingers.map(finger => digit(finger));

    // Shadow in the webbing between neighbouring fingers, and a soft bump on every knuckle.
    const webs = fingers.slice(0, -1).map((finger, i) => {
      const next = fingers[i + 1];
      const centre = [(finger.base[0] + next.base[0]) / 2, (finger.base[1] + next.base[1]) / 2 - keyH * 0.05];
      return `<ellipse class="hand-web" cx="${round(centre[0])}" cy="${round(centre[1])}" rx="${round(keyW * 0.2)}" ry="${round(keyH * 0.4)}" filter="url(#soft-blur)" />`;
    }).join('');
    const knuckles = fingers.map(finger => `<ellipse class="hand-knuckle" cx="${round(finger.base[0])}" cy="${round(finger.base[1] + keyH * 0.05)}"`
      + ` rx="${round(finger.width * 0.34)}" ry="${round(keyH * 0.26)}" fill="url(#knuckle-${prefix})" />`).join('');

    const palmCentre = [(index.base[0] + pinky.base[0]) / 2, middle.base[1] + keyH * 1.3];
    const defs = `<radialGradient id="palm-${prefix}" gradientUnits="userSpaceOnUse" cx="${round(palmCentre[0])}" cy="${round(palmCentre[1])}" r="${round(keyW * 3.4)}">`
      + `<stop offset="0" stop-color="#bc8b80" /><stop offset="0.5" stop-color="#a5746b" /><stop offset="1" stop-color="#704a44" /></radialGradient>`
      + `<linearGradient id="palm-edge-${prefix}" gradientUnits="userSpaceOnUse" x1="${round(palmOuter[0])}" y1="0" x2="${round(palmInner[0])}" y2="0">`
      + `<stop offset="0" stop-color="#4a2823" stop-opacity=".3" /><stop offset="0.3" stop-color="#4a2823" stop-opacity="0" />`
      + `<stop offset="0.82" stop-color="#4a2823" stop-opacity="0" /><stop offset="1" stop-color="#4a2823" stop-opacity=".22" /></linearGradient>`
      + `<radialGradient id="knuckle-${prefix}"><stop offset="0" stop-color="#fff" stop-opacity=".16" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>`
      + thumb.defs + drawn.map(item => item.defs).join('');

    return `<g class="ghost-hand ${side}-hand">`
      + `<defs>${defs}</defs>`
      + thumb.markup
      + `<path class="hand-body" d="${palm}" fill="url(#palm-${prefix})" />`
      + `<path class="hand-body-edge" d="${palm}" fill="url(#palm-edge-${prefix})" />`
      + webs + knuckles
      + drawn.map(item => item.markup).join('')
      + `</g>`;
  }

  function markup(metrics) {
    const width = round(metrics.width), height = round(metrics.height);
    // The fade is measured from the knuckle line of the middle finger, not as a fraction of the
    // container: solid across the fingers and the upper palm, gone before the wrist.
    const knuckle = metrics.home.f.y + metrics.keyH * (DIGITS.LM.length - 0.1);
    const fadeFrom = round(knuckle + metrics.keyH * FADE_FROM);
    const fadeTo = round(Math.min(height, knuckle + metrics.keyH * FADE_TO));
    const defs = `<linearGradient id="hand-fade" gradientUnits="userSpaceOnUse" x1="0" y1="${fadeFrom}" x2="0" y2="${fadeTo}">`
      + `<stop offset="0" stop-color="#fff" /><stop offset="1" stop-color="#000" /></linearGradient>`
      + `<mask id="hand-mask"><rect x="0" y="0" width="${width}" height="${height}" fill="url(#hand-fade)" /></mask>`
      // One shadow filter shared by every digit: it separates a finger from its neighbours and
      // from the palm, which is most of what reads as depth.
      + `<filter id="digit-shadow" x="-40%" y="-25%" width="180%" height="160%" color-interpolation-filters="sRGB">`
      + `<feDropShadow dx="0.6" dy="1.6" stdDeviation="1.4" flood-color="#2a1410" flood-opacity=".5" /></filter>`
      + `<filter id="soft-blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6" /></filter>`;
    return `<svg class="hand-layer" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">`
      + `<defs>${defs}</defs><g mask="url(#hand-mask)">${hand('left', metrics)}${hand('right', metrics)}</g></svg>`;
  }

  // Pose for one digit reaching a key off its home position, after typing.com's animated hands:
  // the whole hand drifts HAND_SHARE of the way, the digit covers the rest and swings a little
  // round its knuckle (capped at MAX_SWING degrees) so it points at the key. Returns CSS
  // transforms for the `.ghost-hand` group and the `.finger` group; the rotation's own
  // displacement of the tip is subtracted from the translate so the tip lands exactly on `to`.
  const HAND_SHARE = 0.35;
  const MAX_SWING = 12;
  const TIP_LIFT = 0.1; // the resting tip sits this far above the key centre (key heights)
  function reach({ base, tip, to, keyW, keyH }) {
    const dx = to[0] - tip[0], dy = to[1] - keyH * TIP_LIFT - tip[1];
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return { hand: '', finger: '' };
    const swing = Math.max(-MAX_SWING, Math.min(MAX_SWING, dx / keyW * 4));
    const theta = swing * Math.PI / 180;
    const vx = tip[0] - base[0], vy = tip[1] - base[1];
    // where the rotation alone would carry the tip
    const rx = vx * Math.cos(theta) - vy * Math.sin(theta) - vx;
    const ry = vx * Math.sin(theta) + vy * Math.cos(theta) - vy;
    const handX = dx * HAND_SHARE, handY = dy * HAND_SHARE;
    const fingerX = dx - handX - rx, fingerY = dy - handY - ry;
    return {
      hand: `translate(${round(handX)}px, ${round(handY)}px)`,
      finger: `translate(${round(fingerX)}px, ${round(fingerY)}px) rotate(${round(swing)}deg)`
    };
  }

  global.TypingEaseHands = { markup, reach, HOME_KEYS, DIGITS, HAND_SHARE, MAX_SWING };
})(window);
