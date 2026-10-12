/* Renders a jogger illustration in any colour + cut. Used as the product image
   until real photos are uploaded in the admin panel. */
(function () {
  let uid = 0;

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function mix(hex, target, amt) {
    const a = hexToRgb(hex), b = hexToRgb(target);
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * amt).toString(16).padStart(2, '0')).join('');
  }

  const CUTS = {
    cuffed: { a1: 80, a2: 128, hy: 346, cuff: 30 },
    cargo: { a1: 78, a2: 128, hy: 346, cuff: 30, cargo: true },
    slim: { a1: 88, a2: 128, hy: 350, cuff: 26 },
    open: { a1: 66, a2: 136, hy: 378, cuff: 0 },
    wide: { a1: 50, a2: 144, hy: 386, cuff: 0, wide: true },
    shorts: { a1: 54, a2: 142, hy: 214, cuff: 0, short: true },
  };

  function shading(id) {
    return `<linearGradient id="${id}h" x1="0" x2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".2" stop-color="#000" stop-opacity="0"/>
      <stop offset=".38" stop-color="#fff" stop-opacity=".12"/><stop offset=".62" stop-color="#fff" stop-opacity=".05"/>
      <stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/>
    </linearGradient>
    <radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;
  }

  // Tops (tees / tanks / shirts)
  function teeSVG(hex, opts) {
    const id = 'j' + ++uid;
    const light = luminance(hex) > 0.35;
    const seam = light ? 'rgba(40,30,20,.28)' : 'rgba(0,0,0,.45)';
    const stitch = light ? 'rgba(60,45,30,.25)' : 'rgba(255,255,255,.14)';
    const mono = light ? 'rgba(40,30,20,.35)' : 'rgba(255,255,255,.3)';
    const body = 'M104,62 Q150,92 196,62 L262,96 L240,158 L214,146 L216,362 Q150,372 84,362 L86,146 L60,158 L38,96 Z';
    return `<svg class="jogger-svg" viewBox="0 0 300 420" role="img" aria-label="${opts.label || 'Top illustration'}" xmlns="http://www.w3.org/2000/svg">
  <defs>${shading(id)}</defs>
  <ellipse cx="150" cy="384" rx="110" ry="10" fill="url(#${id}s)"/>
  <path d="${body}" fill="${hex}"/>
  <path d="${body}" fill="url(#${id}h)"/>
  <path d="M104,62 Q150,100 196,62" fill="none" stroke="${mix(hex, '#000000', 0.25)}" stroke-width="7" stroke-linecap="round"/>
  <path d="M110,70 Q150,100 190,70" fill="none" stroke="${stitch}" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M86,146 L82,110 M214,146 L218,110" stroke="${seam}" stroke-width="1.3" fill="none"/>
  <path d="M64,148 L44,104 M236,148 L256,104" stroke="${stitch}" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M88,350 Q150,360 212,350" stroke="${stitch}" stroke-width="1" stroke-dasharray="3 3" fill="none"/>
  <path d="M120,200 q30,10 60,0 M110,280 q40,12 80,0" stroke="${seam}" stroke-width="1.2" fill="none" opacity=".35"/>
  <text x="182" y="132" font-family="Cormorant, Georgia, serif" font-style="italic" font-size="17" fill="${mono}">K</text>
</svg>`;
  }

  // Sunglasses ("shades")
  function shadesSVG(hex, opts) {
    const id = 'j' + ++uid;
    const frame = hex;
    const edge = mix(hex, '#000000', 0.35);
    const lens = (x) => `<path d="M${x},176 h96 q10,0 9,12 l-6,38 q-4,26 -36,26 h-28 q-32,0 -36,-26 l-6,-38 q-1,-12 7,-12z"/>`;
    return `<svg class="jogger-svg" viewBox="0 0 300 420" role="img" aria-label="${opts.label || 'Sunglasses illustration'}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2420"/><stop offset=".55" stop-color="#0d0b0a"/><stop offset="1" stop-color="#3a2e22"/></linearGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="150" cy="300" rx="130" ry="10" fill="url(#${id}s)"/>
  <path d="M24,186 L8,196 M276,186 L292,196" stroke="${edge}" stroke-width="7" stroke-linecap="round"/>
  <g fill="${frame}" stroke="${edge}" stroke-width="2">${lens(30)}${lens(166)}</g>
  <path d="M140,190 Q150,180 160,190" fill="none" stroke="${frame}" stroke-width="8" stroke-linecap="round"/>
  <g fill="url(#${id}l)">
    <path d="M40,186 h80 q7,0 6,9 l-5,30 q-3,20 -28,20 h-26 q-25,0 -28,-20 l-5,-30 q-1,-9 6,-9z"/>
    <path d="M176,186 h80 q7,0 6,9 l-5,30 q-3,20 -28,20 h-26 q-25,0 -28,-20 l-5,-30 q-1,-9 6,-9z"/>
  </g>
  <path d="M44,190 h40 l-30,48 q-10,-6 -12,-18z M180,190 h40 l-30,48 q-10,-6 -12,-18z" fill="url(#${id}g)"/>
  <path d="M30,178 h96 M166,178 h96" stroke="#fff" stroke-opacity=".25" stroke-width="1.5"/>
</svg>`;
  }

  function joggerSVG(hex, cut, opts) {
    opts = opts || {};
    if (cut === 'tee') return teeSVG(hex, opts);
    if (cut === 'shades') return shadesSVG(hex, opts);
    const id = 'j' + ++uid;
    const c = CUTS[cut] || CUTS.cuffed;
    const { a1, a2, hy } = c;
    const light = luminance(hex) > 0.35;
    const seam = light ? 'rgba(40,30,20,.28)' : 'rgba(0,0,0,.45)';
    const stitch = light ? 'rgba(60,45,30,.25)' : 'rgba(255,255,255,.14)';
    const band = mix(hex, '#000000', light ? 0.08 : 0.18);
    const cuffFill = mix(hex, '#000000', light ? 0.06 : 0.12);
    const cord = light ? '#3a3330' : '#eee7da';
    const mono = light ? 'rgba(40,30,20,.35)' : 'rgba(255,255,255,.3)';
    const R = (x) => 300 - x;

    const body = `M58,52 L242,52 C249,112 249,196 ${R(a1)},${hy} L${R(a2)},${hy} C${R(a2) - 4},${hy - 96} 168,214 156,170 Q150,160 144,170 C132,214 ${a2 + 4},${hy - 96} ${a2},${hy} L${a1},${hy} C51,196 51,112 58,52 Z`;

    let ribs = '';
    for (let x = 58; x <= 242; x += 4.5) ribs += `M${x.toFixed(1)},22v34`;

    let cuffs = '';
    if (c.cuff) {
      const cuffPath = (o, i) => {
        const l = Math.min(o, i), r = Math.max(o, i);
        let lines = '';
        for (let x = l + 4; x < r - 2; x += 4) lines += `M${x},${hy + 2}v${c.cuff - 4}`;
        return `<path d="M${l - 1},${hy - 2} L${r + 1},${hy - 2} L${r - 1},${hy + c.cuff} Q${(l + r) / 2},${hy + c.cuff + 5} ${l + 1},${hy + c.cuff} Z" fill="${cuffFill}"/>
          <path d="${lines}" stroke="${seam}" stroke-width="1" opacity=".55"/>
          <path d="M${l - 1},${hy - 2} L${r + 1},${hy - 2}" stroke="${seam}" stroke-width="1.4"/>`;
      };
      cuffs = cuffPath(a1, a2) + cuffPath(R(a1), R(a2));
    } else {
      cuffs = `<path d="M${a1 + 1},${hy - 9} L${a2 - 1},${hy - 9} M${R(a2) + 1},${hy - 9} L${R(a1) - 1},${hy - 9}" stroke="${stitch}" stroke-width="1.2" stroke-dasharray="3 3"/>`;
    }

    const cargo = c.cargo
      ? `<g fill="${mix(hex, '#000000', light ? 0.05 : 0.1)}" stroke="${seam}" stroke-width="1.2">
          <rect x="60" y="188" width="42" height="58" rx="5"/><rect x="198" y="188" width="42" height="58" rx="5"/>
          <path d="M58,186 h46 v18 q-23,6 -46,0z M196,186 h46 v18 q-23,6 -46,0z"/>
        </g>
        <path d="M64,193 h38 M200,193 h38" stroke="${stitch}" stroke-width="1" stroke-dasharray="3 3"/>`
      : '';

    // soft fabric folds that stack above the ankle
    const folds = `<g stroke="${seam}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55">
      <path d="M${a1 + 6},${hy - 26} q${(a2 - a1) / 2},10 ${a2 - a1 - 12},-2"/>
      <path d="M${a1 + 10},${hy - 50} q${(a2 - a1) / 2},8 ${a2 - a1 - 18},0"/>
      <path d="M${R(a2) + 6},${hy - 24} q${(a2 - a1) / 2},10 ${a2 - a1 - 12},-4"/>
      <path d="M${R(a2) + 8},${hy - 48} q${(a2 - a1) / 2},8 ${a2 - a1 - 16},2"/>
      ${c.short ? '' : '<path d="M88,236 q14,8 30,4" opacity=".6"/><path d="M182,240 q16,6 30,-4" opacity=".6"/>'}
    </g>`;

    return `<svg class="jogger-svg" viewBox="0 0 300 420" role="img" aria-label="${opts.label || 'Jogger illustration'}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}h" x1="0" x2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".34"/>
      <stop offset=".16" stop-color="#000" stop-opacity=".02"/>
      <stop offset=".3" stop-color="#fff" stop-opacity=".13"/>
      <stop offset=".44" stop-color="#000" stop-opacity=".06"/>
      <stop offset=".5" stop-color="#000" stop-opacity=".32"/>
      <stop offset=".56" stop-color="#000" stop-opacity=".06"/>
      <stop offset=".7" stop-color="#fff" stop-opacity=".1"/>
      <stop offset=".84" stop-color="#000" stop-opacity=".02"/>
      <stop offset="1" stop-color="#000" stop-opacity=".34"/>
    </linearGradient>
    <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".22"/>
      <stop offset=".12" stop-color="#000" stop-opacity="0"/>
      <stop offset=".8" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".18"/>
    </linearGradient>
    <radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}c"><rect x="54" y="20" width="192" height="38" rx="8"/></clipPath>
  </defs>
  <g transform="translate(0,${c.short ? 96 : 0})">
  <ellipse cx="150" cy="${hy + (c.cuff || 0) + 14}" rx="118" ry="10" fill="url(#${id}s)"/>
  <path d="${body}" fill="${hex}"/>
  ${cargo}
  ${folds}
  <path d="${body}" fill="url(#${id}h)"/>
  <path d="${body}" fill="url(#${id}v)"/>
  ${cuffs}
  <path d="M150,58 L150,160" stroke="${seam}" stroke-width="1.4"/>
  <path d="M155,62 Q156,110 154,150" stroke="${stitch}" stroke-width="1" stroke-dasharray="3 3" fill="none"/>
  <path d="M66,62 Q86,94 92,130 M234,62 Q214,94 208,130" stroke="${seam}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M71,62 Q90,94 96,128 M229,62 Q210,94 204,128" stroke="${stitch}" stroke-width="1" stroke-dasharray="3 3" fill="none"/>
  <rect x="54" y="20" width="192" height="38" rx="8" fill="${band}"/>
  <path d="${ribs}" clip-path="url(#${id}c)" stroke="${seam}" stroke-width="1" opacity=".5"/>
  <rect x="54" y="20" width="192" height="38" rx="8" fill="url(#${id}h)"/>
  <circle cx="139" cy="46" r="3.4" fill="${seam}"/><circle cx="161" cy="46" r="3.4" fill="${seam}"/>
  <g stroke-linecap="round" fill="none">
    <path d="M139,46 C134,74 128,98 133,126" stroke="${cord}" stroke-width="3.6"/>
    <path d="M161,46 C167,76 172,100 166,132" stroke="${cord}" stroke-width="3.6"/>
    <path d="M133,126 l1,12 M166,132 l-1,12" stroke="${mix(cord, '#777777', 0.4)}" stroke-width="4.6"/>
  </g>
  ${c.wide ? `<path d="M110,60 L104,150 M190,60 L196,150" stroke="${seam}" stroke-width="1.2" opacity=".6"/>` : ''}
  <text x="212" y="112" font-family="Cormorant, Georgia, serif" font-style="italic" font-size="17" fill="${mono}">K</text>
  </g>
</svg>`;
  }

  function tint(hex, amt) {
    return mix(hex, '#f6f1ea', amt == null ? 0.82 : amt);
  }

  // Illustration styles offered in the admin product editor
  const STYLES = [
    ['cuffed', 'Jogger · cuffed'], ['open', 'Pants · open hem'], ['wide', 'Wide-leg pants'], ['cargo', 'Cargo pants'],
    ['slim', 'Slim taper'], ['shorts', 'Shorts'], ['tee', 'Top / tee / shirt'], ['shades', 'Sunglasses'],
  ];

  window.Jogger = { svg: joggerSVG, tint, luminance, mix, STYLES };
})();
