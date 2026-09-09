(function (global) {
  // Ghost hands drawn over the keyboard. Finger tips are pinned to the real home-row keys
  // measured in the page, so they stay on target whatever the keyboard is scaled to.
  // Palm, thumb and fingers are opaque siblings inside one group: the group carries the
  // transparency, so the overlaps merge into a single silhouette instead of showing seams.
  const HOME_KEYS = {
    left:  [['LP','a'], ['LR','s'], ['LM','d'], ['LI','f']],
    right: [['RI','j'], ['RM','k'], ['RR','l'], ['RP',';']]
  };
  const KNUCKLE_DROP = 3.2;    // knuckle line, in key heights below the home row
  const PALM_DROP = 4.3;       // heel of the palm
  const WRIST_DROP = 5.9;      // where the forearm leaves the frame
  const CONVERGE = 0.9;        // how far the knuckles pull in towards the palm centre

  const round = value => Math.round(value * 10) / 10;
  const at = ([x, y]) => `${round(x)} ${round(y)}`;
  const add = ([ax, ay], [bx, by]) => [ax + bx, ay + by];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const scale = ([x, y], factor) => [x * factor, y * factor];
  const unit = ([x, y]) => { const length = Math.hypot(x, y) || 1; return [x / length, y / length]; };

  // A digit: tapered from its base to a rounded tip, with a slight outward bow.
  function digitPath(base, tip, baseWidth, tipWidth, bow) {
    const axis = unit([tip[0] - base[0], tip[1] - base[1]]);
    const normal = [-axis[1], axis[0]];
    const left = add(base, scale(normal, baseWidth / 2)), right = add(base, scale(normal, -baseWidth / 2));
    const tipLeft = add(tip, scale(normal, tipWidth / 2)), tipRight = add(tip, scale(normal, -tipWidth / 2));
    return `M ${at(left)} Q ${at(add(mid(left, tipLeft), scale(normal, bow)))} ${at(tipLeft)} `
      + `A ${round(tipWidth / 2)} ${round(tipWidth / 2)} 0 0 1 ${at(tipRight)} `
      + `Q ${at(add(mid(right, tipRight), scale(normal, -bow)))} ${at(right)} Z`;
  }

  function hand(side, metrics) {
    const { keyW, keyH, home, space, height } = metrics;
    const toPinky = side === 'left' ? -1 : 1, toThumb = -toPinky, prefix = side === 'left' ? 'L' : 'R';
    const tips = HOME_KEYS[side].map(([id, key]) => ({ id, homeKey: key, point: [home[key].x, home[key].y - keyH * 0.04] }));
    const centreX = tips.reduce((total, finger) => total + finger.point[0], 0) / tips.length + toThumb * keyW * 0.15;
    const knuckleY = home.f.y + keyH * KNUCKLE_DROP;
    const palmY = home.f.y + keyH * PALM_DROP;
    const wristY = Math.min(height - 1, home.f.y + keyH * WRIST_DROP);

    const fingers = tips.map(finger => {
      const base = [centreX + (finger.point[0] - centreX) * CONVERGE, knuckleY];
      return { id: finger.id, homeKey: finger.homeKey, base, point: finger.point, width: keyW * 0.98,
        d: digitPath(base, finger.point, keyW * 0.98, keyW * 0.8, keyW * 0.05) };
    });

    const outerX = (side === 'left' ? fingers[0] : fingers[3]).base[0] + toPinky * keyW * 0.55;
    const innerX = (side === 'left' ? fingers[3] : fingers[0]).base[0] + toThumb * keyW * 0.55;
    const palmOuter = centreX + toPinky * keyW * 1.9, palmInner = centreX + toThumb * keyW * 2.05;
    const wristOuter = centreX + toPinky * keyW * 1.15, wristInner = centreX + toThumb * keyW * 0.95;
    const palm = `M ${at([outerX, knuckleY - keyH * 0.5])} `
      + `C ${at([outerX + toPinky * keyW * 0.55, knuckleY + keyH * 0.5])} ${at([palmOuter, palmY - keyH * 1.5])} ${at([palmOuter, palmY - keyH * 0.2])} `
      + `C ${at([palmOuter, palmY + keyH * 0.9])} ${at([wristOuter, wristY - keyH * 1.4])} ${at([wristOuter, wristY])} `
      + `L ${at([wristInner, wristY])} `
      + `C ${at([wristInner, wristY - keyH * 1.5])} ${at([palmInner, palmY + keyH * 0.8])} ${at([palmInner, palmY - keyH * 0.4])} `
      + `C ${at([palmInner, palmY - keyH * 1.9])} ${at([innerX + toThumb * keyW * 0.55, knuckleY + keyH * 0.5])} ${at([innerX, knuckleY - keyH * 0.5])} Z`;

    // The thumb grows out of the thenar mass, so its base sits well inside the palm.
    const thumbBase = [centreX + toThumb * keyW * 1.5, palmY - keyH * 0.05];
    const reach = centreX + toThumb * keyW * 2.15;
    const thumbTip = [Math.min(Math.max(reach, space.x + space.w * 0.12), space.x + space.w * 0.88), space.y + keyH * 0.05];
    const thumb = digitPath(thumbBase, thumbTip, keyW * 1.05, keyW * 0.86, toPinky * keyW * 0.08);

    // A digit carries its own body, nail and highlight so a transform moves the whole thing.
    const digit = (id, homeKey, path, gradient, base, tip, nailWidth) => {
      const axis = unit([tip[0] - base[0], tip[1] - base[1]]);
      const nailCentre = add(tip, scale(axis, -nailWidth * 0.62));
      const angle = Math.atan2(axis[1], axis[0]) * 180 / Math.PI - 90;
      return `<g class="finger" data-finger="${id}" data-key="${homeKey}" data-kx="${round(base[0])}" data-ky="${round(base[1])}"`
        + ` data-rx="${round(tip[0])}" data-ry="${round(tip[1])}" style="transform-origin:${round(base[0])}px ${round(base[1])}px">`
        + `<g class="digit-press">`
        + `<path class="hand-digit" d="${path}" fill="url(#${gradient})" />`
        + `<ellipse class="hand-nail" cx="${round(nailCentre[0])}" cy="${round(nailCentre[1])}" rx="${round(nailWidth * 0.34)}" ry="${round(nailWidth * 0.42)}"`
        + ` transform="rotate(${round(angle)} ${round(nailCentre[0])} ${round(nailCentre[1])})" />`
        + `<path class="finger-glow" d="${path}" /></g></g>`;
    };

    const tube = (id, centre, width) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${round(centre - width / 2)}" y1="0" x2="${round(centre + width / 2)}" y2="0">`
      + `<stop offset="0" stop-color="#d09a76" /><stop offset="0.3" stop-color="#fbe4d3" />`
      + `<stop offset="0.68" stop-color="#f1cdb5" /><stop offset="1" stop-color="#c98d68" /></linearGradient>`;
    const gradients = fingers.map((finger, index) => tube(`tube-${prefix}${index}`, finger.base[0], finger.width)).join('')
      + tube(`tube-${prefix}T`, thumbBase[0], keyW * 1.05);

    return `<g class="ghost-hand ${side}-hand">`
      + `<defs>${gradients}</defs>`
      + digit(`${prefix}T`, ' ', thumb, `tube-${prefix}T`, thumbBase, thumbTip, keyW * 0.8)
      + `<path class="hand-body" d="${palm}" />`
      + fingers.map((finger, index) => digit(finger.id, finger.homeKey, finger.d, `tube-${prefix}${index}`, finger.base, finger.point, keyW * 0.7)).join('')
      + `</g>`;
  }

  function markup(metrics) {
    const width = round(metrics.width), height = round(metrics.height);
    const top = round(metrics.home.f.y), bottom = round(metrics.height);
    // The fade must be measured from the home row down to where the forearm leaves the frame,
    // not as a fraction of the container: a taller container (a full 5-row keyboard) would
    // otherwise start dissolving the hands right at the fingertips.
    const defs = `<linearGradient id="hand-fade" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${bottom}">`
      + `<stop offset="0.62" stop-color="#fff" /><stop offset="1" stop-color="#000" /></linearGradient>`
      + `<mask id="hand-mask"><rect x="0" y="0" width="${width}" height="${height}" fill="url(#hand-fade)" /></mask>`
      + `<linearGradient id="hand-volume" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${bottom}">`
      + `<stop offset="0" stop-color="#fce7d8" /><stop offset="0.5" stop-color="#f3d2bb" />`
      + `<stop offset="1" stop-color="#dcab88" /></linearGradient>`;
    return `<svg class="hand-layer" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">`
      + `<defs>${defs}</defs><g mask="url(#hand-mask)">${hand('left', metrics)}${hand('right', metrics)}</g></svg>`;
  }

  global.TypingEaseHands = { markup, HOME_KEYS };
})(window);
