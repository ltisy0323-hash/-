/* OLIVE — 브랜드 비주얼 생성기 (SVG)
   실제 촬영 이미지가 준비되기 전까지 동일한 톤의 화보풍 비주얼을 코드로 생성합니다.
   실서비스에서는 art()/scene() 결과 대신 <img src="촬영본.jpg"> 로 교체하세요. */

let _uid = 0;
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = amt < 0 ? 0 : 255, t = Math.abs(amt);
  r = Math.round(r + (f - r) * t); g = Math.round(g + (f - g) * t); b = Math.round(b + (f - b) * t);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
const uri = svg => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
const GRAIN = `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .1  0 0 0 .22 0"/></filter>`;

const longTop = e => `M150 115L178 102Q200 128 222 102L250 115L318 150L335 340L300 346L262 200L262 ${e}L138 ${e}L138 200L100 346L65 340L82 150Z`;
const shortTop = e => `M150 115L178 102Q200 128 222 102L250 115L315 150L335 215L298 228L262 190L262 ${e}L138 ${e}L138 190L102 228L65 215L85 150Z`;

const SHAPES = {
  shirt:  { d: longTop(405), det: (d, l) => `<path d="M178 102L200 150L222 102L238 114L215 142L200 152L185 142L162 114Z" fill="${l}" stroke="${d}" stroke-opacity=".6"/><path d="M200 152V405" stroke="${d}" stroke-opacity=".6"/>${[185, 225, 265, 305, 345, 385].map(y => `<circle cx="205" cy="${y}" r="2.6" fill="${d}" opacity=".7"/>`).join('')}<path d="M67 318L102 325M333 318L298 325" stroke="${d}" stroke-opacity=".5"/>` },
  blouse: { d: longTop(395), det: (d, l) => `<path d="M178 102L200 180L222 102" fill="none" stroke="${d}" stroke-opacity=".6" stroke-width="2"/><path d="M160 230Q200 310 240 230M150 300Q200 360 250 300" fill="none" stroke="${d}" stroke-opacity=".28" stroke-width="2"/><path d="M82 150Q95 250 100 346M318 150Q305 250 300 346" fill="none" stroke="${l}" stroke-opacity=".4" stroke-width="3"/>` },
  knit:   { d: longTop(405), det: (d, l) => `<path d="M178 102Q200 128 222 102" fill="none" stroke="${l}" stroke-width="9"/>${[0, 1, 2].map(i => `<path d="M${176 + i * 24} 150q-9 18 0 36t0 36t0 36t0 36t0 36t0 36" fill="none" stroke="${d}" stroke-opacity=".38" stroke-width="3"/>`).join('')}${Array.from({ length: 14 }, (_, i) => `<path d="M${142 + i * 8.5} 385V405" stroke="${d}" stroke-opacity=".4"/>`).join('')}<path d="M66 326L101 332M334 326L299 332" stroke="${d}" stroke-opacity=".5" stroke-width="3"/>` },
  tee:    { d: shortTop(395), det: (d, l) => `<path d="M178 102Q200 130 222 102" fill="none" stroke="${l}" stroke-width="7"/><path d="M68 205L100 215M332 205L300 215" stroke="${d}" stroke-opacity=".4"/>` },
  cardigan: { d: longTop(435), det: (d, l) => `<path d="M200 118V435" stroke="${d}" stroke-opacity=".7" stroke-width="2"/><path d="M178 102L200 120L222 102" fill="none" stroke="${l}" stroke-width="8"/>${[160, 205, 250, 295, 340].map(y => `<circle cx="193" cy="${y}" r="3.4" fill="${d}" opacity=".7"/>`).join('')}<path d="M138 380h124" stroke="${d}" stroke-opacity=".3"/><rect x="146" y="330" width="42" height="46" fill="none" stroke="${d}" stroke-opacity=".4"/><rect x="212" y="330" width="42" height="46" fill="none" stroke="${d}" stroke-opacity=".4"/>` },
  jacket: { d: 'M148 105L178 92L200 125L222 92L252 105L322 140L340 370L304 376L268 190L268 410L132 410L132 190L96 376L60 370L78 140Z', det: (d, l) => `<path d="M178 92L200 250L222 92" fill="none" stroke="${d}" stroke-opacity=".6" stroke-width="2"/><path d="M200 125L200 410" stroke="${d}" stroke-opacity=".6"/><path d="M140 330h50v38h-50zM210 330h50v38h-50z" fill="none" stroke="${d}" stroke-opacity=".5"/>${[260, 320].map(y => `<circle cx="193" cy="${y}" r="3.6" fill="${d}" opacity=".7"/>`).join('')}` },
  coat:   { d: 'M148 105L178 92L200 130L222 92L252 105L322 140L340 400L304 406L268 190L280 475L120 475L132 190L96 406L60 400L78 140Z', det: (d, l) => `<path d="M178 92L200 250L222 92L236 100L208 258L200 270L192 258L164 100Z" fill="${l}" fill-opacity=".5" stroke="${d}" stroke-opacity=".6"/><path d="M200 270V475" stroke="${d}" stroke-opacity=".6"/>${[300, 350].map(y => `<circle cx="190" cy="${y}" r="4" fill="${d}" opacity=".7"/>`).join('')}<path d="M132 300h136" stroke="${d}" stroke-opacity=".25"/><path d="M150 380h38M212 380h38" stroke="${d}" stroke-opacity=".45" stroke-width="2"/>` },
  pants:  { d: 'M140 85L260 85L282 475L208 475L200 195L192 475L118 475Z', det: (d, l) => `<rect x="140" y="85" width="120" height="20" fill="${l}" fill-opacity=".35" stroke="${d}" stroke-opacity=".5"/><path d="M200 105V195" stroke="${d}" stroke-opacity=".6"/><path d="M200 105Q170 130 168 150M200 105Q230 130 232 150" fill="none" stroke="${d}" stroke-opacity=".4"/><path d="M158 120L156 475M242 120L244 475" stroke="${d}" stroke-opacity=".12"/>${[170, 230].map(x => `<rect x="${x - 3}" y="85" width="6" height="20" fill="${d}" opacity=".35"/>`).join('')}` },
  skirt:  { d: 'M148 95L252 95L318 455L82 455Z', det: (d, l) => `<rect x="148" y="95" width="104" height="18" fill="${l}" fill-opacity=".35" stroke="${d}" stroke-opacity=".5"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${156 + i * 8.8} 113L${96 + i * 20.8} 455" stroke="${d}" stroke-opacity=".28"/>`).join('')}` },
  dress:  { d: 'M165 90L180 90Q200 122 220 90L235 90L252 225L335 455L65 455L148 225Z', det: (d, l) => `<path d="M148 225Q200 238 252 225" fill="none" stroke="${d}" stroke-opacity=".6" stroke-width="2"/><path d="M200 120V225" stroke="${d}" stroke-opacity=".5"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${165 + i * 12} 232L${100 + i * 33} 455" stroke="${d}" stroke-opacity=".2"/>`).join('')}${[145, 175, 205].map(y => `<circle cx="204" cy="${y}" r="2.6" fill="${d}" opacity=".7"/>`).join('')}` },
  bag:    { d: 'M105 215L295 215L312 420L88 420Z', det: (d, l) => `<path d="M105 215L295 215" stroke="${d}" stroke-width="2" stroke-opacity=".6"/><path d="M150 215C150 120 250 120 250 215" fill="none" stroke="${d}" stroke-width="9" stroke-linecap="round"/><path d="M150 215C150 120 250 120 250 215" fill="none" stroke="${l}" stroke-width="3" stroke-linecap="round" stroke-opacity=".6"/><path d="M92 395H308" stroke="${d}" stroke-opacity=".3"/><rect x="186" y="236" width="28" height="18" fill="${l}" fill-opacity=".6" stroke="${d}" stroke-opacity=".6"/>` },
  shoe:   { d: 'M60 330Q62 285 125 280L205 272Q250 335 330 338Q356 342 350 380L60 380Z', det: (d, l) => `<path d="M60 380H350" stroke="${d}" stroke-width="12" stroke-opacity=".75"/><path d="M125 280Q150 300 200 304Q240 300 255 330" fill="none" stroke="${d}" stroke-opacity=".6" stroke-width="2"/><path d="M165 300q10 -22 40 -26" fill="none" stroke="${l}" stroke-width="5" stroke-opacity=".6"/><rect x="62" y="372" width="288" height="12" fill="${d}" opacity=".6"/>` },
  scarf:  { d: 'M125 80L275 80L285 440L115 440Z', det: (d, l) => `${[130, 170, 210, 250].map(y => `<path d="M118 ${y}H282" stroke="${l}" stroke-opacity=".55" stroke-width="10"/>`).join('')}<path d="M125 80Q200 112 275 80" fill="none" stroke="${d}" stroke-opacity=".5"/>${Array.from({ length: 20 }, (_, i) => `<path d="M${120 + i * 8} 440v22" stroke="${d}" stroke-opacity=".7" stroke-width="2"/>`).join('')}` }
};

function garment(kind, c) {
  const id = 'g' + (++_uid), sh = SHAPES[kind] || SHAPES.shirt;
  const dark = shade(c, -.3), light = shade(c, .22);
  return `<defs><clipPath id="${id}"><path d="${sh.d}"/></clipPath></defs>
  <path d="${sh.d}" fill="${c}"/>
  <g clip-path="url(#${id})"><rect x="200" width="200" height="500" fill="#000" opacity=".07"/><rect width="400" height="500" filter="url(#grain)"/>${sh.det(dark, light)}</g>
  <path d="${sh.d}" fill="none" stroke="${dark}" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>`;
}

function branch(x, y, r, s, col = '#747A50') {
  const leaves = [[16, -45, -35], [38, -95, 30], [18, -128, -38], [48, -165, 28], [28, -196, -32], [46, -228, 6]];
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0C40 -60 60 -140 50 -235" stroke="${shade(col, -.25)}" fill="none" stroke-width="3" stroke-linecap="round"/>${leaves.map(([a, b, c]) => `<ellipse cx="${a}" cy="${b}" rx="24" ry="7.5" transform="rotate(${c} ${a} ${b})" fill="${col}"/>`).join('')}</g>`;
}

const PBG = ['#EAE2D3', '#E8DFCF', '#EDE5D7', '#E6DCC9'];
const _artCache = {};
/* 상품 이미지: 0 정면 / 1 디테일 / 2 행어 / 3 플랫레이 */
function art(p, i) {
  const key = p.id + '-' + i;
  if (_artCache[key]) return _artCache[key];
  const c0 = p.colors[0].hex, c1 = (p.colors[1] || p.colors[0]).hex;
  const hang = !['pants', 'skirt', 'bag', 'shoe', 'scarf'].includes(p.kind);
  const hSkip = p.kind === 'coat' ? 0 : 0;
  let body = '';
  if (i === 0) {
    body = `<rect width="400" height="500" fill="${PBG[p.id % 4]}"/>
      <polygon points="230,0 400,0 400,360" fill="#fff" opacity=".28"/><polygon points="300,0 400,0 400,200" fill="#fff" opacity=".22"/>
      <ellipse cx="200" cy="${p.kind === 'shoe' ? 392 : 484}" rx="${p.kind === 'shoe' ? 150 : 110}" ry="9" fill="#33342F" opacity=".12"/>
      <g transform="translate(0 ${p.kind === 'coat' || p.kind === 'cardigan' ? 6 : 0})">${garment(p.kind, c0)}</g>`;
  } else if (i === 1) {
    body = `<rect width="400" height="500" fill="#E0D5C0"/>
      <g transform="translate(-200 -150) scale(2)">${garment(p.kind, c0)}</g>
      <rect width="400" height="500" filter="url(#grain)" opacity=".4"/>`;
  } else if (i === 2) {
    body = `<rect width="400" height="500" fill="#D8CCB5"/><polygon points="0,0 170,0 0,330" fill="#fff" opacity=".18"/>
      ${hang ? `<path d="M200 56Q200 38 214 34Q228 38 224 52" fill="none" stroke="#8A715D" stroke-width="3" stroke-linecap="round"/><path d="M200 56L112 112H288Z" fill="none" stroke="#8A715D" stroke-width="3" stroke-linejoin="round"/>` : ''}
      <g transform="translate(0 ${hang ? 4 : 12})">${garment(p.kind, c1)}</g>
      <ellipse cx="200" cy="492" rx="90" ry="6" fill="#33342F" opacity=".1"/>`;
  } else {
    body = `<rect width="400" height="500" fill="#CDBFA5"/><rect y="0" width="400" height="500" filter="url(#grain)" opacity=".5"/>
      ${branch(40, 480, -10, 1.15)}${branch(370, 500, 12, .9, '#5F6A45')}
      <ellipse cx="205" cy="${p.kind === 'shoe' ? 395 : 470}" rx="120" ry="12" fill="#33342F" opacity=".14" transform="rotate(-6 200 250)"/>
      <g transform="translate(200 250) rotate(-7) scale(.8) translate(-200 -250)">${garment(p.kind, c0)}</g>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><defs>${GRAIN}</defs>${body}</svg>`;
  return (_artCache[key] = uri(svg));
}

/* ---------- 모델(일러스트) 장면 ---------- */
function figure(f) {
  const { kind = 'coat', coat, inner = '#F1EBDD', bottom = '#4A4B45', skin = '#D8B596', hair = '#4A3B31' } = f;
  const dk = shade(coat, -.25), bdk = shade(bottom, -.25);
  const arms = (col, len = 340) => `<path d="M-90 96L-${len > 330 ? 132 : 112} ${len}L-106 ${len + 8}L-66 160Z" fill="${col}"/><path d="M90 96L${len > 330 ? 132 : 112} ${len}L106 ${len + 8}L66 160Z" fill="${col}"/>`;
  const hands = `<ellipse cx="-122" cy="352" rx="13" ry="20" fill="${skin}"/><ellipse cx="122" cy="352" rx="13" ry="20" fill="${skin}"/>`;
  const shoes = (y, col) => `<ellipse cx="-47" cy="${y}" rx="34" ry="12" fill="${col}"/><ellipse cx="47" cy="${y}" rx="34" ry="12" fill="${col}"/>`;
  let s = '';
  if (kind === 'coat') {
    s += `<path d="M-98 590L-6 590L-12 840L-78 840Z" fill="${bottom}"/><path d="M98 590L6 590L12 840L78 840Z" fill="${bottom}"/>${shoes(848, '#2F302C')}
      <path d="M-14 84L0 150L14 84Z" fill="${inner}"/>
      <path d="M-92 96Q-50 78 -14 84L0 140L14 84Q50 78 92 96L114 330L128 600L-128 600L-114 330Z" fill="${coat}"/>
      <path d="M0 140V600" stroke="${dk}" stroke-width="2"/><path d="M-14 84L-34 200L0 140ZM14 84L34 200L0 140Z" fill="${dk}" opacity=".6"/>
      ${[260, 330, 400].map(y => `<circle cx="-10" cy="${y}" r="5" fill="${dk}"/>`).join('')}
      <path d="M-92 96L-134 340L-106 350L-68 170Z" fill="${coat}"/><path d="M92 96L134 340L106 350L68 170Z" fill="${coat}"/>
      <path d="M92 96L134 340L106 350L68 170Z" fill="#000" opacity=".08"/><path d="M0 140V600H128L114 330L92 96Q50 78 14 84Z" fill="#000" opacity=".07"/>${hands}`;
  } else if (kind === 'dress') {
    s += `<rect x="-62" y="690" width="40" height="150" fill="${skin}"/><rect x="22" y="690" width="40" height="150" fill="${skin}"/>${shoes(850, '#8A715D')}
      ${arms(skin)}${hands}
      <path d="M-74 94Q-40 80 -14 84L0 130L14 84Q40 80 74 94L84 250L190 700L-190 700L-84 250Z" fill="${coat}"/>
      <path d="M-84 250Q0 268 84 250" fill="none" stroke="${dk}" stroke-width="2.5"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${-70 + i * 17} 262L${-170 + i * 42} 700" stroke="${dk}" stroke-opacity=".22"/>`).join('')}
      <path d="M0 130V250M0 130L-18 84M0 130L18 84" stroke="${dk}" stroke-opacity=".5" stroke-width="2"/>
      <path d="M0 130L84 250L190 700H0Z" fill="#000" opacity=".06"/>`;
  } else { // knit + skirt
    s += `<path d="M-90 350L90 350L190 800L-190 800Z" fill="${bottom}"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${-80 + i * 14.5} 350L${-180 + i * 33} 800" stroke="${bdk}" stroke-opacity=".35"/>`).join('')}
      <rect x="-40" y="796" width="30" height="50" fill="${skin}"/><rect x="10" y="796" width="30" height="50" fill="${skin}"/>${shoes(852, '#2F302C')}
      <path d="M-92 96Q-50 78 -14 84Q0 106 14 84Q50 78 92 96L130 330L104 342L86 210L90 384L-90 384L-86 210L-104 342L-130 330Z" fill="${coat}"/>
      ${[0, 1, 2].map(i => `<path d="M${-24 + i * 24} 160q-9 18 0 36t0 36t0 36t0 36" fill="none" stroke="${dk}" stroke-opacity=".3" stroke-width="3"/>`).join('')}
      <path d="M0 84Q50 78 92 96L130 330L104 342L86 210L90 384H0Z" fill="#000" opacity=".06"/>
      <ellipse cx="-121" cy="352" rx="13" ry="20" fill="${skin}"/><ellipse cx="121" cy="352" rx="13" ry="20" fill="${skin}"/>`;
  }
  s += `<rect x="-12" y="40" width="24" height="56" fill="${skin}"/><path d="M-12 70Q0 86 12 70V96H-12Z" fill="#000" opacity=".1"/>
    <ellipse cx="0" cy="-4" rx="46" ry="58" fill="${hair}"/><circle cx="0" cy="-68" r="25" fill="${hair}"/>
    <ellipse cx="0" cy="8" rx="33" ry="44" fill="${skin}"/><path d="M-35 -4Q0 -50 35 -4Q10 -26 -35 -4Z" fill="${hair}"/>
    <path d="M-33 8Q-33 -10 0 -22" fill="none"/><path d="M0 8Q-6 22 0 26" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`;
  return s;
}

function scene(o) {
  const { w, h, wall, floor, floorH = .2, light, curtain, outdoor, hills, plant, figs = [], dark, fx = .5, fs = 1 } = o;
  const fy = h * (1 - floorH);
  let s = `<rect width="${w}" height="${h}" fill="${wall}"/>`;
  if (outdoor) {
    s += `<ellipse cx="${w * .25}" cy="${h * .9}" rx="${w * .6}" ry="${h * .34}" fill="${hills[0]}"/><ellipse cx="${w * .85}" cy="${h * .95}" rx="${w * .55}" ry="${h * .3}" fill="${hills[1]}"/><rect y="${h * .84}" width="${w}" height="${h * .16}" fill="${floor}"/>`;
    s += `<circle cx="${w * .8}" cy="${h * .2}" r="${h * .09}" fill="#fff" opacity=".45"/>`;
  } else {
    s += `<rect y="${fy}" width="${w}" height="${h - fy}" fill="${floor}"/><rect y="${fy - 5}" width="${w}" height="5" fill="#000" opacity=".06"/>`;
  }
  if (curtain) s += `<rect width="${w * .13}" height="${fy}" fill="${shade(wall, -.07)}"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${i * w * .016}" width="${w * .006}" height="${fy}" fill="#000" opacity=".05"/>`).join('')}`;
  if (light) {
    const a = dark ? .1 : .3;
    s += `<polygon points="${w * .62},0 ${w * .76},0 ${w * .98},${h} ${w * .74},${h}" fill="#fff" opacity="${a}"/><polygon points="${w * .8},0 ${w * .92},0 ${w * 1.12},${h} ${w * .94},${h}" fill="#fff" opacity="${a * .8}"/><polygon points="${w * .44},0 ${w * .5},0 ${w * .66},${h} ${w * .58},${h}" fill="#fff" opacity="${a * .6}"/>`;
  }
  if (plant) s += `<g><path d="M${w * .88 - 28} ${fy + 10}h56l-8 -86h-40z" fill="#B9A685"/>${branch(w * .88, fy - 70, -8, h / 520, '#747A50')}${branch(w * .88, fy - 70, 14, h / 640, '#5F6A45')}</g>`;
  figs.forEach(f => {
    const sc = (h / 960) * fs, cx = w * fx + (f.dx || 0) * (h / 960);
    s += `<ellipse cx="${cx}" cy="${fy + (h - fy) * .45}" rx="${190 * sc}" ry="${16 * sc}" fill="#000" opacity=".14"/><g transform="translate(${cx} ${h * .13}) scale(${sc})">${figure(f)}</g>`;
  });
  s += `<rect width="${w}" height="${h}" filter="url(#grain)" opacity=".7"/>`;
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs>${GRAIN}</defs>${s}</svg>`);
}

const HERO = [
  { src: () => scene({ w: 1600, h: 900, wall: '#E3D6BF', floor: '#C9B592', light: 1, curtain: 1, plant: 1, fx: .7, fs: .98, figs: [{ kind: 'coat', coat: '#B8977A', inner: '#F1EBDD', bottom: '#4A4B45' }] }), pos: '72% center' },
  { src: () => scene({ w: 1600, h: 900, wall: '#EEE6D3', outdoor: 1, hills: ['#8A9068', '#747A50'], floor: '#C7B78E', fx: .68, fs: .98, figs: [{ kind: 'dress', coat: '#8E9468', inner: '#8E9468', bottom: '#8E9468', hair: '#3E2F27' }] }), pos: '70% center' },
  { src: () => scene({ w: 1600, h: 900, wall: '#2F4A3B', floor: '#223629', light: 1, dark: 1, plant: 1, fx: .7, fs: .98, figs: [{ kind: 'knit', coat: '#EADFC6', inner: '#EADFC6', bottom: '#8A715D', hair: '#2F2520' }] }), pos: '72% center' }
];
