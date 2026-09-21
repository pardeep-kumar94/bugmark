// Generates Chrome Web Store listing assets (flat, no-alpha PNGs) from the brand.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = '/Users/pardeepkumar/work/bugmark/web/public/downloads/store-assets';
mkdirSync(OUT, { recursive: true });

// Brand
const INK = '#1D1D1F', PAPER = '#F5F5F7', PAPER3 = '#FBFBFD';
const ACCENT = '#0071E3', MUTED = '#6E6E73', LINE = '#DEDEE3', WHITE = '#FFFFFF';
const FONT = 'Helvetica, Arial, sans-serif';

// Reusable logo tile (bug in viewfinder) at a given x,y,size
function logo(x, y, s) {
  const k = s / 128;
  return `<g transform="translate(${x},${y}) scale(${k})">
    <rect width="128" height="128" rx="28" fill="${INK}"/>
    <g stroke="${ACCENT}" stroke-width="6.5" stroke-linecap="round" fill="none">
      <path d="M34 44 V38 A4 4 0 0 1 38 34 H44"/><path d="M94 44 V38 A4 4 0 0 0 90 34 H84"/>
      <path d="M34 84 V90 A4 4 0 0 0 38 94 H44"/><path d="M94 84 V90 A4 4 0 0 1 90 94 H84"/>
    </g>
    <g fill="${WHITE}">
      <g stroke="${WHITE}" stroke-width="4" stroke-linecap="round">
        <path d="M50 56 L40 50"/><path d="M50 64 L38 64"/><path d="M50 72 L40 79"/>
        <path d="M78 56 L88 50"/><path d="M78 64 L90 64"/><path d="M78 72 L88 79"/>
      </g>
      <g stroke="${WHITE}" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M58 44 L53 36"/><path d="M70 44 L75 36"/>
      </g>
      <circle cx="64" cy="46" r="7"/>
      <rect x="51" y="50" width="26" height="34" rx="13"/>
      <rect x="61.5" y="52" width="5" height="30" rx="2.5" fill="${ACCENT}"/>
    </g>
  </g>`;
}

function chip(x, y, w, label) {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="44" rx="22" fill="${WHITE}" stroke="${LINE}"/>
    <circle cx="${x + 26}" cy="${y + 22}" r="5" fill="${ACCENT}"/>
    <text x="${x + 44}" y="${y + 29}" font-family="${FONT}" font-size="20" fill="${INK}">${label}</text>
  </g>`;
}

async function render(name, w, h, inner, bg = PAPER) {
  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${bg}"/>${inner}</svg>`;
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(w, h)                         // exact store dimensions
    .flatten({ background: bg })          // kill alpha → 24-bit
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${name}.png`);
  console.log('✓', name, `${w}x${h}`);
}

const FEATURES = ['Annotated screenshots', 'Screen recording', 'Console &amp; network logs', 'One-click GitHub issues'];

// ── Marquee 1400x560 ──────────────────────────────────────────────
await render('marquee-1400x560', 1400, 560, `
  <rect x="0" y="0" width="14" height="560" fill="${ACCENT}"/>
  ${logo(110, 150, 260)}
  <text x="440" y="230" font-family="${FONT}" font-size="88" font-weight="800" fill="${INK}">Bugmark</text>
  <text x="443" y="292" font-family="${FONT}" font-size="34" fill="${MUTED}">Report bugs your developers can actually fix.</text>
  ${chip(443, 340, 300, FEATURES[0])}${chip(763, 340, 260, FEATURES[1])}
  ${chip(443, 400, 330, FEATURES[2])}${chip(793, 400, 320, FEATURES[3])}
`);

// ── Small promo tile 440x280 ──────────────────────────────────────
await render('small-440x280', 440, 280, `
  ${logo(150, 40, 140)}
  <text x="220" y="215" text-anchor="middle" font-family="${FONT}" font-size="46" font-weight="800" fill="${INK}">Bugmark</text>
  <text x="220" y="248" text-anchor="middle" font-family="${FONT}" font-size="19" fill="${MUTED}">Bug reporting for the web</text>
`, PAPER3);

// ── Screenshot 1 (hero) 1280x800 ──────────────────────────────────
await render('screenshot-1-hero', 1280, 800, `
  ${logo(540, 150, 200)}
  <text x="640" y="430" text-anchor="middle" font-family="${FONT}" font-size="72" font-weight="800" fill="${INK}">Bugmark</text>
  <text x="640" y="490" text-anchor="middle" font-family="${FONT}" font-size="32" fill="${MUTED}">Capture, annotate, and file bugs in one click.</text>
  <rect x="490" y="545" width="300" height="60" rx="30" fill="${ACCENT}"/>
  <text x="640" y="584" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="700" fill="${WHITE}">Add to Chrome — Free</text>
`);

// ── Screenshot 2 (features) 1280x800 ──────────────────────────────
await render('screenshot-2-features', 1280, 800, `
  ${logo(90, 80, 120)}
  <text x="230" y="135" font-family="${FONT}" font-size="52" font-weight="800" fill="${INK}">Everything in the report</text>
  <text x="230" y="180" font-family="${FONT}" font-size="26" fill="${MUTED}">No more "it works on my machine."</text>
  ${FEATURES.map((f, i) => `
    <g transform="translate(160, ${280 + i * 110})">
      <rect x="0" y="0" width="960" height="86" rx="18" fill="${WHITE}" stroke="${LINE}"/>
      <circle cx="52" cy="43" r="10" fill="${ACCENT}"/>
      <text x="96" y="52" font-family="${FONT}" font-size="30" font-weight="600" fill="${INK}">${f}</text>
    </g>`).join('')}
`, PAPER3);
