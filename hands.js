(function (global) {
  // Bàn tay phủ lên bàn phím, cùng cách xử lý như lớp tay 3D của typing.com: hai bàn tay trong
  // suốt đặt trên hàng phím cơ sở, mờ dần về phía cổ tay, ngón đang gõ nhuộm xanh. typing.com
  // dựng mô hình 3D vào canvas; đây là SVG của mình, giả khối bằng gradient ống, dải sáng-tối ở
  // khớp, hõm kẽ ngón, gờ đốt bàn tay và móng.
  //
  // Hình học là tham số: đầu ngón ghim vào đúng phím cơ sở đo được trên trang, nên tay vừa với
  // mọi cỡ bàn phím. Mỗi ngón mang sẵn các móc mà widget dùng: `.finger[data-finger][data-key]`,
  // `.digit-press`, `.finger-glow`. Mọi thứ thuộc về một ngón nằm trong `.finger` của nó, mỗi bàn
  // tay là một `.ghost-hand`, nên một transform là cả cụm di chuyển (tư thế được áp kiểu đó).
  const HOME_KEYS = {
    left:  [['LP', 'a'], ['LR', 's'], ['LM', 'd'], ['LI', 'f']],
    right: [['RI', 'j'], ['RM', 'k'], ['RR', 'l'], ['RP', ';']]
  };
  // Tỉ lệ đo trên tay typing.com, tính theo đơn vị phím: dài từ đốt bàn tay tới đầu ngón (theo
  // chiều cao phím), bề ngang ngón (theo bề ngang phím).
  const DIGITS = {
    LP: { length: 1.95, width: 0.62 }, LR: { length: 2.5, width: 0.7 }, LM: { length: 2.7, width: 0.74 }, LI: { length: 2.45, width: 0.72 },
    RI: { length: 2.45, width: 0.72 }, RM: { length: 2.7, width: 0.74 }, RR: { length: 2.5, width: 0.7 }, RP: { length: 1.95, width: 0.62 },
    LT: { length: 1.7, width: 1.08 }, RT: { length: 1.7, width: 1.08 }
  };
  // Da: một bảng nhỏ để chỉnh một chỗ là cả hai tay đổi theo. Cố ý nằm ngoài tokens.css — đây là
  // màu minh hoạ, kéo về màu thương hiệu thì tay hỏng.
  const SKIN = {
    lit: '#f6d9cc', high: '#ecc4b4', mid: '#d9a695', low: '#b87f70', deep: '#94604f', edge: '#6d4235', line: '#8a5546'
  };
  const CONVERGE = 0.86;     // đốt bàn tay chụm hơn đầu ngón
  const LEAN = 0.18;         // gốc ngón lệch về phía ngón út: ngón chỉ lên và hơi chếch vào trong
  const BEND = 0.08;         // độ cong ngang của ngón về phía ngón cái (hai khớp gập nhìn từ trên)
  const SPLAY = 0.09;       // ngón út xoè ra, ngón trỏ khép vào — cộng dồn theo vị trí ngón
  const PALM_DEPTH = 1.8;    // đường đốt bàn tay -> gót bàn tay
  const WRIST_DEPTH = 2.6;   // đường đốt bàn tay -> chỗ cẳng tay ra khỏi khung
  const FOREARM_LEAN = 1.2; // cổ tay lệch ra ngoài chừng này: cẳng tay vào từ hai bên
  const WRIST_HALF = 1.0;   // nửa bề ngang cổ tay — hẹp hơn hẳn lòng bàn tay, nếu không thành khúc gỗ
  const WEB_DROP = 0.2;     // hõm kẽ ngón tụt xuống dưới đường đốt bàn tay chừng này
  const FADE_FROM = 0.7;    // đường đốt bàn tay -> chỗ bắt đầu tan
  const FADE_TO = 2.3;       // -> tan hẳn
  const THUMB_GAP = 1.15;     // đầu ngón cái cách giữa phím cách chừng này về mỗi bên

  const round = value => Math.round(value * 10) / 10;
  const at = ([x, y]) => `${round(x)} ${round(y)}`;
  const add = ([ax, ay], [bx, by]) => [ax + bx, ay + by];
  const sub = ([ax, ay], [bx, by]) => [ax - bx, ay - by];
  const scale = ([x, y], factor) => [x * factor, y * factor];
  const unit = ([x, y]) => { const length = Math.hypot(x, y) || 1; return [x / length, y / length]; };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // Cubic đi qua mọi điểm (Catmull-Rom), nối tiếp một path đang ở points[0].
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

  // Trục giữa của một ngón: gốc -> hai khớp -> đầu ngón. `bend` uốn ngang (theo bề ngang phím,
  // có dấu), `offset` đẩy cả đường sang bên.
  function spine(base, tip, bend, offset = 0) {
    const axis = unit(sub(tip, base));
    const normal = [-axis[1], axis[0]];
    const shift = amount => scale(normal, amount + offset);
    return [
      add(base, shift(0)),
      add(lerp(base, tip, 0.34), shift(bend * 0.45)),
      add(lerp(base, tip, 0.62), shift(bend * 0.85)),
      add(lerp(base, tip, 0.85), shift(bend)),
      add(tip, shift(bend * 0.72))
    ];
  }

  // Viền ngoài của một ngón quanh trục: thuôn dần từ gốc lên, đầu ngón bo tròn thành mái vòm chứ
  // không phải nửa hình tròn ghép vào — nửa hình tròn nhìn ra ngay là hình vẽ bằng ống.
  function digitOutline(points, widths) {
    const normals = points.map((point, i) => {
      const from = points[Math.max(0, i - 1)], to = points[Math.min(points.length - 1, i + 1)];
      const axis = unit(sub(to, from));
      return [-axis[1], axis[0]];
    });
    const left = points.map((point, i) => add(point, scale(normals[i], widths[i] / 2)));
    const right = points.map((point, i) => add(point, scale(normals[i], -widths[i] / 2)));
    const last = points.length - 1;
    const axis = unit(sub(points[last], points[last - 1]));
    const half = widths[last] / 2;
    // Đỉnh mái vòm nhô quá đầu trục một chút, hai bên vào bằng cubic → đầu ngón hơi bầu, không nhọn.
    const crown = add(points[last], scale(axis, half * 1.05));
    const lift = scale(axis, half * 0.72);
    return `M ${at(left[0])} ${through(left)}`
      + `C ${at(add(left[last], lift))} ${at(add(crown, scale(normals[last], half * 0.62)))} ${at(crown)} `
      + `C ${at(add(crown, scale(normals[last], -half * 0.62)))} ${at(add(right[last], lift))} ${at(right[last])} `
      + `${through(right.slice().reverse())}Z`;
  }

  // Nếp gấp mờ vắt ngang ngón ở một khớp: cung nông, KHÔNG phải chữ V (bản cũ vẽ chữ V ngay dưới
  // móng nên mỗi đầu ngón trông như đội vương miện).
  function crease(points, width, index) {
    const centre = points[index];
    const axis = unit(sub(points[Math.min(points.length - 1, index + 1)], points[index - 1] || points[index]));
    const normal = [-axis[1], axis[0]];
    const a = add(centre, scale(normal, width * 0.34)), b = add(centre, scale(normal, -width * 0.34));
    const sag = add(centre, scale(axis, -width * 0.16));
    return `M ${at(a)} Q ${at(sag)} ${at(b)}`;
  }

  // Tất cả những gì thuộc một ngón: thân có bóng đổ riêng, khối trụ, dải khớp, vệt sáng dọc,
  // nếp gấp, móng, gờ đốt bàn tay. Nằm hết trong `.finger` để một transform là cả ngón di chuyển.
  function digit({ id, homeKey, base, tip, width, bend, prefix, fadeBase = false }) {
    const points = spine(base, tip, bend);
    const widths = [width, width * 0.96, width * 0.98, width * 0.86, width * 0.72];
    const body = digitOutline(points, widths);
    const axis = unit(sub(tip, base));
    const normal = [-axis[1], axis[0]];
    // Vệt sáng dọc theo phía đón sáng, dừng trước đầu ngón.
    const spec = digitOutline(spine(base, lerp(base, tip, 0.88), bend, -width * 0.17),
      [width * 0.22, width * 0.2, width * 0.17, width * 0.14, width * 0.1]);
    const nailCentre = add(points[4], scale(axis, -width * 0.34));
    const angle = Math.atan2(axis[1], axis[0]) * 180 / Math.PI - 90;
    const mid = lerp(base, tip, 0.5);
    const across = [add(mid, scale(normal, -width / 2)), add(mid, scale(normal, width / 2))];
    const gid = `${prefix}${id}`;
    // Khối trụ: sáng lệch về một bên (nguồn sáng trên-trái), tối dần về hai mép. Năm chặng để mép
    // tối không ăn vào quá nửa ngón — bản cũ tối ngay từ 20% nên ngón nào cũng như ống nhựa.
    const defs = `<linearGradient id="tube-${gid}" gradientUnits="userSpaceOnUse" x1="${round(across[0][0])}" y1="${round(across[0][1])}" x2="${round(across[1][0])}" y2="${round(across[1][1])}">`
      + `<stop offset="0" stop-color="${SKIN.edge}" /><stop offset="0.1" stop-color="${SKIN.deep}" />`
      + `<stop offset="0.26" stop-color="${SKIN.mid}" /><stop offset="0.44" stop-color="${SKIN.lit}" />`
      + `<stop offset="0.6" stop-color="${SKIN.high}" /><stop offset="0.8" stop-color="${SKIN.low}" />`
      + `<stop offset="0.93" stop-color="${SKIN.deep}" /><stop offset="1" stop-color="${SKIN.edge}" /></linearGradient>`
      // Dọc theo ngón: dưới móng hơi tối, hai gờ khớp bắt sáng, đoạn giữa trũng, tối nhất ở chỗ
      // ngón chui vào lòng bàn tay.
      + `<linearGradient id="bands-${gid}" gradientUnits="userSpaceOnUse" x1="${round(tip[0])}" y1="${round(tip[1])}" x2="${round(base[0])}" y2="${round(base[1])}">`
      + `<stop offset="0" stop-color="#fff" stop-opacity=".14" /><stop offset="0.13" stop-color="${SKIN.deep}" stop-opacity=".16" />`
      + `<stop offset="0.24" stop-color="#fff" stop-opacity=".13" /><stop offset="0.4" stop-color="${SKIN.deep}" stop-opacity=".1" />`
      + `<stop offset="0.55" stop-color="#fff" stop-opacity=".1" /><stop offset="0.72" stop-color="${SKIN.deep}" stop-opacity=".12" />`
      + `<stop offset="0.88" stop-color="${SKIN.deep}" stop-opacity=".2" /><stop offset="1" stop-color="${SKIN.edge}" stop-opacity=".34" /></linearGradient>`
      + `<linearGradient id="spec-${gid}" gradientUnits="userSpaceOnUse" x1="${round(tip[0])}" y1="${round(tip[1])}" x2="${round(base[0])}" y2="${round(base[1])}">`
      + `<stop offset="0.06" stop-color="#fff" stop-opacity="0" /><stop offset="0.24" stop-color="#fff" stop-opacity=".34" />`
      + `<stop offset="0.72" stop-color="#fff" stop-opacity=".18" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient>`
      // Móng: hồng nhạt hơn da quanh nó, gốc móng mờ dần vào thịt.
      + `<linearGradient id="nail-${gid}" gradientUnits="userSpaceOnUse" x1="${round(points[4][0])}" y1="${round(points[4][1])}" x2="${round(points[3][0])}" y2="${round(points[3][1])}">`
      + `<stop offset="0" stop-color="#fdeee8" /><stop offset="0.5" stop-color="#f7dcd2" /><stop offset="1" stop-color="#dcab9c" /></linearGradient>`
      // Gợi xanh: đặc ở đầu ngón và khớp đầu, tan trước khi tới gốc.
      + `<linearGradient id="glow-${gid}" gradientUnits="userSpaceOnUse" x1="${round(tip[0])}" y1="${round(tip[1])}" x2="${round(base[0])}" y2="${round(base[1])}">`
      + `<stop offset="0" stop-color="#1fa0c8" /><stop offset="0.14" stop-color="#37b3d6" /><stop offset="0.45" stop-color="#37b3d6" />`
      + `<stop offset="0.8" stop-color="#37b3d6" stop-opacity="0" /></linearGradient>`
      // Ngón cái: gốc tan dần vào gò cái. Ngón cái vẽ ĐÈ lên mu bàn tay (không thì tay phải bị
      // chính lòng bàn tay che mất), nên nếu để nguyên thì lộ một mép cắt phẳng giữa bàn tay.
      + (fadeBase
        ? `<linearGradient id="fade-${gid}" gradientUnits="userSpaceOnUse" x1="${round(tip[0])}" y1="${round(tip[1])}" x2="${round(base[0])}" y2="${round(base[1])}">`
          + `<stop offset="0.55" stop-color="#fff" /><stop offset="1" stop-color="#000" /></linearGradient>`
          + `<mask id="mask-${gid}"><rect x="${round(Math.min(base[0], tip[0]) - width * 2)}" y="${round(Math.min(base[1], tip[1]) - width * 2)}"`
          + ` width="${round(Math.abs(tip[0] - base[0]) + width * 4)}" height="${round(Math.abs(tip[1] - base[1]) + width * 4)}" fill="url(#fade-${gid})" /></mask>`
        : '');
    const markup = `<g class="finger" data-finger="${id}" data-key="${homeKey}" data-kx="${round(base[0])}" data-ky="${round(base[1])}"`
      + ` data-rx="${round(tip[0])}" data-ry="${round(tip[1])}" style="transform-origin:${round(base[0])}px ${round(base[1])}px"`
      + `${fadeBase ? ` mask="url(#mask-${gid})"` : ''}>`
      + `<g class="digit-press">`
      + `<path class="hand-digit" d="${body}" fill="url(#tube-${gid})" filter="url(#digit-shadow)" />`
      + `<path class="hand-bands" d="${body}" fill="url(#bands-${gid})" />`
      + `<path class="hand-spec" d="${spec}" fill="url(#spec-${gid})" />`
      + `<path class="hand-crease" d="${crease(points, width * 0.94, 3)} ${crease(points, width, 2)}" />`
      + `<ellipse class="hand-nail" cx="${round(nailCentre[0])}" cy="${round(nailCentre[1])}" rx="${round(width * 0.25)}" ry="${round(width * 0.33)}"`
      + ` transform="rotate(${round(angle)} ${round(nailCentre[0])} ${round(nailCentre[1])})" fill="url(#nail-${gid})" />`
      + `<ellipse class="hand-nail-shine" cx="${round(nailCentre[0] - width * 0.07)}" cy="${round(nailCentre[1] - width * 0.09)}" rx="${round(width * 0.1)}" ry="${round(width * 0.07)}"`
      + ` transform="rotate(${round(angle)} ${round(nailCentre[0])} ${round(nailCentre[1])})" />`
      + `<path class="finger-glow" d="${body}" fill="url(#glow-${gid})" /></g></g>`;
    return { defs, markup, points };
  }

  function hand(side, metrics) {
    const { keyW, keyH, home, space, height } = metrics;
    const toPinky = side === 'left' ? -1 : 1, toThumb = -toPinky, prefix = side === 'left' ? 'L' : 'R';
    const tips = HOME_KEYS[side].map(([id, key]) => ({ id, homeKey: key, point: [home[key].x, home[key].y - keyH * 0.1] }));
    const centreX = tips.reduce((total, finger) => total + finger.point[0], 0) / tips.length;

    const fingers = tips.map((finger, i) => {
      const spec = DIGITS[finger.id];
      // Ngón xoè dần về phía ngón út: bàn tay thật không có bốn ngón song song.
      const order = finger.id.endsWith('P') ? 3 : finger.id.endsWith('R') ? 2 : finger.id.endsWith('M') ? 1 : 0;
      const splay = toPinky * keyW * SPLAY * order;
      const base = [centreX + (finger.point[0] - centreX) * CONVERGE + toPinky * keyW * LEAN - splay, finger.point[1] + keyH * spec.length];
      return { id: finger.id, homeKey: finger.homeKey, base, tip: finger.point, width: keyW * spec.width, bend: toThumb * keyW * BEND, prefix };
    });
    const byId = Object.fromEntries(fingers.map(finger => [finger.id, finger]));
    const index = byId[`${prefix}I`], middle = byId[`${prefix}M`], pinky = byId[`${prefix}P`];

    // Mu bàn tay. Mép trên KHÔNG phải một cung trơn: nó lượn theo từng đốt ngón và tụt xuống ở kẽ
    // ngón, nhờ đó ngón mọc ra khỏi bàn tay chứ không phải dán lên một khối bo tròn.
    const ordered = [...fingers].sort((a, b) => (a.base[0] - b.base[0]) * toPinky);   // từ phía ngón cái sang ngón út
    const top = [];
    ordered.forEach((finger, i) => {
      top.push([finger.base[0], finger.base[1] - keyH * 0.14]);
      const next = ordered[i + 1];
      if (next) top.push([(finger.base[0] + next.base[0]) / 2, Math.max(finger.base[1], next.base[1]) + keyH * WEB_DROP]);
    });
    const palmY = middle.base[1] + keyH * PALM_DEPTH;
    const wristY = Math.min(height - 1, middle.base[1] + keyH * WRIST_DEPTH);
    const wristCentre = centreX + toPinky * keyW * FOREARM_LEAN;
    const innerTop = [index.base[0] + toThumb * keyW * 0.52, index.base[1] + keyH * 0.05];
    const outerTop = [pinky.base[0] + toPinky * keyW * 0.5, pinky.base[1] + keyH * 0.1];
    const palmOuter = [pinky.base[0] + toPinky * keyW * 0.62, palmY - keyH * 0.7];
    const wristOuter = [wristCentre + toPinky * keyW * WRIST_HALF, wristY];
    const wristInner = [wristCentre + toThumb * keyW * WRIST_HALF, wristY];
    // Gò cái: chỗ phình giữa gốc ngón trỏ và cổ tay, phần dày nhất của bàn tay nhìn từ trên.
    const thenar = [index.base[0] + toThumb * keyW * 0.95, middle.base[1] + keyH * 1.35];

    const palm = `M ${at(innerTop)} ${through([innerTop, ...top, outerTop])}`
      + `C ${at([outerTop[0] + toPinky * keyW * 0.22, outerTop[1] + keyH * 0.7])} ${at([palmOuter[0] + toPinky * keyW * 0.06, palmOuter[1] - keyH * 0.7])} ${at(palmOuter)} `
      + `C ${at([palmOuter[0] - toPinky * keyW * 0.06, palmOuter[1] + keyH * 0.7])} ${at([wristOuter[0] + toPinky * keyW * 0.12, wristOuter[1] - keyH * 0.8])} ${at(wristOuter)} `
      + `L ${at(wristInner)} `
      + `C ${at([wristInner[0] - toThumb * keyW * 0.05, wristInner[1] - keyH * 0.9])} ${at([thenar[0], thenar[1] + keyH * 0.75])} ${at(thenar)} `
      + `C ${at([thenar[0] + toThumb * keyW * 0.12, thenar[1] - keyH * 0.85])} ${at([innerTop[0] + toThumb * keyW * 0.22, innerTop[1] + keyH * 0.8])} ${at(innerTop)} Z`;

    // Ngón cái mọc ra từ gò cái, chếch vào giữa phím cách, nằm hẳn dưới các ngón kia.
    const spaceMid = space.x + space.w / 2;
    const thumbTip = [spaceMid + toThumb * -keyW * THUMB_GAP, space.y + keyH * 0.08];
    // Gốc ngón cái ngay trên gò cái, không thụt xuống sâu: thụt xuống là ngón cái dài ngoẵng
    // thành ngón thứ năm nằm chéo, mà ngón cái thật thì ngắn và mập.
    const thumbBase = [thenar[0] + toPinky * keyW * 0.3, thenar[1] - keyH * 0.15];
    const thumb = digit({ id: `${prefix}T`, homeKey: ' ', base: thumbBase, tip: thumbTip, width: keyW * DIGITS[`${prefix}T`].width, bend: toPinky * keyW * 0.2, prefix, fadeBase: true });

    const drawn = fingers.map(finger => digit(finger));

    // Bóng trong kẽ ngón và gờ sáng trên mỗi đốt bàn tay.
    const webs = ordered.slice(0, -1).map((finger, i) => {
      const next = ordered[i + 1];
      const centre = [(finger.base[0] + next.base[0]) / 2, Math.max(finger.base[1], next.base[1]) + keyH * (WEB_DROP - 0.12)];
      return `<ellipse class="hand-web" cx="${round(centre[0])}" cy="${round(centre[1])}" rx="${round(keyW * 0.1)}" ry="${round(keyH * 0.22)}" filter="url(#soft-blur)" />`;
    }).join('');
    const knuckles = fingers.map(finger => `<ellipse class="hand-knuckle" cx="${round(finger.base[0])}" cy="${round(finger.base[1] + keyH * 0.12)}"`
      + ` rx="${round(finger.width * 0.36)}" ry="${round(keyH * 0.3)}" fill="url(#knuckle-${prefix})" />`).join('');
    // Gân mu bàn tay: bốn vệt sáng rất nhạt chạy từ đốt ngón về phía cổ tay. Thiếu nó thì mu bàn
    // tay là một mảng phẳng, và mảng phẳng chính là thứ làm hình trông như đồ hoạ chứ không như tay.
    const tendons = fingers.map(finger => {
      const from = [finger.base[0], finger.base[1] + keyH * 0.3];
      const to = [lerp(from, [wristCentre, wristY], 0.62)[0], from[1] + keyH * 1.35];
      return `<path class="hand-tendon" d="M ${at(from)} C ${at([from[0], from[1] + keyH * 0.5])} ${at([to[0], to[1] - keyH * 0.5])} ${at(to)}" />`;
    }).join('');

    const palmCentre = [(index.base[0] + pinky.base[0]) / 2, middle.base[1] + keyH * 1.1];
    const defs = `<radialGradient id="palm-${prefix}" gradientUnits="userSpaceOnUse" cx="${round(palmCentre[0])}" cy="${round(palmCentre[1])}" r="${round(keyW * 3.2)}">`
      + `<stop offset="0" stop-color="${SKIN.lit}" /><stop offset="0.45" stop-color="${SKIN.mid}" /><stop offset="1" stop-color="${SKIN.deep}" /></radialGradient>`
      + `<linearGradient id="palm-edge-${prefix}" gradientUnits="userSpaceOnUse" x1="${round(palmOuter[0])}" y1="0" x2="${round(thenar[0])}" y2="0">`
      + `<stop offset="0" stop-color="${SKIN.edge}" stop-opacity=".34" /><stop offset="0.26" stop-color="${SKIN.edge}" stop-opacity="0" />`
      + `<stop offset="0.78" stop-color="${SKIN.edge}" stop-opacity="0" /><stop offset="1" stop-color="${SKIN.edge}" stop-opacity=".26" /></linearGradient>`
      + `<radialGradient id="knuckle-${prefix}"><stop offset="0" stop-color="#fff" stop-opacity=".22" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>`
      + thumb.defs + drawn.map(item => item.defs).join('');

    return `<g class="ghost-hand ${side}-hand">`
      + `<defs>${defs}</defs>`
      + `<path class="hand-body" d="${palm}" fill="url(#palm-${prefix})" />`
      + `<path class="hand-body-edge" d="${palm}" fill="url(#palm-edge-${prefix})" />`
      + tendons + webs + knuckles
      + thumb.markup
      + drawn.map(item => item.markup).join('')
      + `</g>`;
  }

  function markup(metrics) {
    const width = round(metrics.width), height = round(metrics.height);
    // Độ tan đo từ đường đốt bàn tay của ngón giữa, không phải theo phần trăm khung: đặc suốt các
    // ngón và phần trên mu bàn tay, tan hết trước cổ tay.
    const knuckle = metrics.home.f.y + metrics.keyH * (DIGITS.LM.length - 0.1);
    const fadeFrom = round(knuckle + metrics.keyH * FADE_FROM);
    const fadeTo = round(Math.min(height, knuckle + metrics.keyH * FADE_TO));
    const defs = `<linearGradient id="hand-fade" gradientUnits="userSpaceOnUse" x1="0" y1="${fadeFrom}" x2="0" y2="${fadeTo}">`
      + `<stop offset="0" stop-color="#fff" /><stop offset="0.55" stop-color="#8a8a8a" /><stop offset="1" stop-color="#000" /></linearGradient>`
      + `<mask id="hand-mask"><rect x="0" y="0" width="${width}" height="${height}" fill="url(#hand-fade)" /></mask>`
      // Một filter bóng đổ dùng chung cho mọi ngón: nó tách ngón khỏi ngón bên cạnh và khỏi mu bàn
      // tay, và đó là phần lớn những gì mắt đọc thành chiều sâu.
      + `<filter id="digit-shadow" x="-40%" y="-25%" width="180%" height="160%" color-interpolation-filters="sRGB">`
      + `<feDropShadow dx="0.5" dy="1.4" stdDeviation="1.5" flood-color="#3a1c15" flood-opacity=".3" /></filter>`
      + `<filter id="soft-blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8" /></filter>`;
    return `<svg class="hand-layer" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">`
      + `<defs>${defs}</defs><g mask="url(#hand-mask)">${hand('left', metrics)}${hand('right', metrics)}</g></svg>`;
  }

  // Tư thế cho một ngón với tới phím ngoài vị trí cơ sở, theo bàn tay động của typing.com: cả bàn
  // tay trôi HAND_SHARE quãng đường, ngón đi nốt phần còn lại và xoay quanh đốt bàn tay một chút
  // (tối đa MAX_SWING độ) để chỉ đúng vào phím. Trả về transform CSS cho `.ghost-hand` và
  // `.finger`; phần dịch do chính phép xoay gây ra được trừ đi để đầu ngón rơi đúng vào `to`.
  const HAND_SHARE = 0.35;
  const MAX_SWING = 12;
  const TIP_LIFT = 0.1; // đầu ngón lúc nghỉ nằm cao hơn tâm phím chừng này (theo chiều cao phím)
  function reach({ base, tip, to, keyW, keyH }) {
    const dx = to[0] - tip[0], dy = to[1] - keyH * TIP_LIFT - tip[1];
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return { hand: '', finger: '' };
    const swing = Math.max(-MAX_SWING, Math.min(MAX_SWING, dx / keyW * 4));
    const theta = swing * Math.PI / 180;
    const vx = tip[0] - base[0], vy = tip[1] - base[1];
    // chỗ mà riêng phép xoay sẽ đưa đầu ngón tới
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
