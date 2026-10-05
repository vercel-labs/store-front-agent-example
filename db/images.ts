// Draws a placeholder image for every product in data/products.json into public/products/.
// Each one is a simple silhouette picked from the product's name and tinted with its first
// color option. Usage: npm run db:images
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";

import products from "../data/products.json" with { type: "json" };

// Color option names to hex. Add a row here when a product uses a new color.
const COLORS: Record<string, string> = {
  Black: "#2a2a2e", "Matte Black": "#2a2a2e", Charcoal: "#3b3b3f", Slate: "#5d6b78", Steel: "#8b949c",
  "Heather Grey": "#9a9a9e", White: "#f2f2f0", Cream: "#efe7d6", Natural: "#d8ccb4", Oat: "#d9c9a8",
  Tan: "#c4a77d", Sand: "#d6bf99", Khaki: "#b8a67a", Brown: "#7a4b2a", Tortoise: "#7a4b2a", Rust: "#b5542b",
  Clay: "#c0714f", Coral: "#e07a5f", Mustard: "#d9a62e", Olive: "#6b7a4b", Moss: "#5f7a52", Sage: "#9aae8c",
  Forest: "#2f5d3a", "Green Plaid": "#3f6b4a", "Plaid Green": "#3f6b4a", "Red Plaid": "#a4382e", "Plaid Red": "#a4382e",
  Navy: "#243a5e", Indigo: "#3b4a7a",
};

// Which silhouette to draw, by the first keyword found in the product name.
const SHAPES: [RegExp, keyof typeof draw][] = [
  [/jacket|shell|puffer|vest/i, "jacket"], [/hoodie/i, "hoodie"], [/sweater|fleece|base layer|flannel/i, "sweater"],
  [/tee|shirt/i, "tee"], [/shorts/i, "shorts"], [/pant/i, "pants"], [/beanie/i, "beanie"], [/cap/i, "cap"],
  [/glove/i, "gloves"], [/sock/i, "socks"], [/scarf|bandana|towel|wraps/i, "cloth"],
  [/sling|hip pack/i, "sling"], [/sleeve|wallet|notebook/i, "book"], [/duffel|toiletry|cubes/i, "duffel"],
  [/daypack|weekender/i, "backpack"], [/tote|messenger/i, "tote"], [/dry bag/i, "bottle"],
  [/bottle/i, "bottle"], [/mug/i, "mug"], [/kettle/i, "kettle"], [/candle|lantern/i, "candle"],
  [/skillet/i, "skillet"], [/dutch oven/i, "pot"], [/blanket|rug|doormat|pillow/i, "blanket"], [/apron/i, "apron"],
  [/sunglasses/i, "sunglasses"], [/belt|strap|coaster/i, "belt"], [/headlamp/i, "headlamp"], [/poles/i, "poles"],
  [/carabiner/i, "carabiner"], [/board/i, "board"], [/planter/i, "planter"],
];

// Every silhouette sits in an 800 by 800 box, centered around (400, 420), drawn in `c`.
const draw = {
  jacket: (c: string) =>
    `<path d="M260 240 L340 190 Q400 150 460 190 L540 240 L610 340 L540 380 L540 630 Q400 650 260 630 L260 380 L190 340 Z" fill="${c}"/>
     <path d="M400 230 V630" stroke="rgba(255,255,255,0.35)" stroke-width="10"/>
     <path d="M340 190 Q400 290 460 190" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="14"/>`,
  hoodie: (c: string) =>
    `<path d="M260 250 L340 200 Q400 120 460 200 L540 250 L610 350 L540 390 L540 630 Q400 650 260 630 L260 390 L190 350 Z" fill="${c}"/>
     <path d="M340 200 Q400 260 460 200 Q450 300 400 320 Q350 300 340 200 Z" fill="rgba(0,0,0,0.22)"/>
     <rect x="320" y="470" width="160" height="90" rx="20" fill="rgba(0,0,0,0.15)"/>`,
  sweater: (c: string) =>
    `<path d="M260 250 L350 200 Q400 240 450 200 L540 250 L620 360 L545 400 L545 630 Q400 650 255 630 L255 400 L180 360 Z" fill="${c}"/>
     <path d="M350 200 Q400 235 450 200" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="14"/>
     <rect x="255" y="600" width="290" height="30" fill="rgba(0,0,0,0.15)"/>`,
  tee: (c: string) =>
    `<path d="M270 240 L350 200 Q400 240 450 200 L530 240 L590 320 L520 360 L520 620 Q400 640 280 620 L280 360 L210 320 Z" fill="${c}"/>
     <path d="M350 200 Q400 240 450 200" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="14"/>`,
  shorts: (c: string) =>
    `<path d="M270 260 H530 L560 520 H420 L400 420 L380 520 H240 Z" fill="${c}"/>
     <rect x="270" y="260" width="260" height="40" fill="rgba(0,0,0,0.2)"/>`,
  pants: (c: string) =>
    `<path d="M290 200 H510 L535 660 H430 L400 380 L370 660 H265 Z" fill="${c}"/>
     <rect x="290" y="200" width="220" height="34" fill="rgba(0,0,0,0.2)"/>`,
  beanie: (c: string) =>
    `<path d="M240 520 Q240 260 400 260 Q560 260 560 520 Z" fill="${c}"/>
     <rect x="225" y="500" width="350" height="110" rx="30" fill="${c}"/>
     <path d="M260 530 H540 M260 575 H540" stroke="rgba(0,0,0,0.18)" stroke-width="10"/>
     <circle cx="400" cy="250" r="34" fill="${c}"/>`,
  cap: (c: string) =>
    `<path d="M250 470 Q250 260 400 260 Q550 260 550 470 Z" fill="${c}"/>
     <path d="M250 470 Q450 440 640 490 Q640 530 560 520 L250 500 Z" fill="${c}"/>
     <path d="M400 260 V470" stroke="rgba(0,0,0,0.18)" stroke-width="10"/>`,
  gloves: (c: string) =>
    `<path d="M300 420 Q300 300 400 300 Q500 300 500 420 V560 Q500 620 440 620 H360 Q300 620 300 560 Z" fill="${c}"/>
     <path d="M300 440 Q230 420 240 500 Q250 560 300 540 Z" fill="${c}"/>
     <path d="M330 300 Q345 230 360 300 M385 290 Q400 215 415 290 M440 300 Q455 230 470 300" stroke="${c}" stroke-width="42" stroke-linecap="round" fill="none"/>`,
  socks: (c: string) =>
    `<path d="M330 200 H470 V450 Q560 500 540 600 Q500 660 420 640 L290 560 Q260 500 330 460 Z" fill="${c}"/>
     <rect x="330" y="200" width="140" height="50" fill="rgba(0,0,0,0.2)"/>
     <path d="M300 540 Q380 540 440 600" stroke="rgba(255,255,255,0.3)" stroke-width="14" fill="none"/>`,
  cloth: (c: string) =>
    `<path d="M220 330 Q400 270 580 330 L560 600 Q400 660 240 600 Z" fill="${c}"/>
     <path d="M250 400 Q400 350 550 400 M245 470 Q400 420 555 470 M240 540 Q400 490 560 540" stroke="rgba(0,0,0,0.18)" stroke-width="12" fill="none"/>`,
  backpack: (c: string) =>
    `<rect x="245" y="250" width="310" height="390" rx="70" fill="${c}"/>
     <path d="M320 300 Q400 170 480 300" stroke="${c}" stroke-width="28" fill="none" stroke-linecap="round"/>
     <rect x="290" y="450" width="220" height="150" rx="30" fill="rgba(0,0,0,0.2)"/>
     <path d="M280 390 H520" stroke="rgba(255,255,255,0.3)" stroke-width="14"/>`,
  tote: (c: string) =>
    `<path d="M230 330 H570 L540 640 H260 Z" fill="${c}"/>
     <path d="M300 330 Q300 180 400 180 Q500 180 500 330" stroke="${c}" stroke-width="24" fill="none" stroke-linecap="round"/>
     <path d="M260 420 H540" stroke="rgba(0,0,0,0.18)" stroke-width="12"/>`,
  duffel: (c: string) =>
    `<rect x="170" y="340" width="460" height="260" rx="130" fill="${c}"/>
     <path d="M330 340 Q330 230 400 230 Q470 230 470 340" stroke="${c}" stroke-width="24" fill="none" stroke-linecap="round"/>
     <path d="M250 470 H550" stroke="rgba(255,255,255,0.3)" stroke-width="14"/>`,
  sling: (c: string) =>
    `<rect x="230" y="400" width="340" height="190" rx="95" fill="${c}"/>
     <path d="M280 420 Q300 250 520 240" stroke="${c}" stroke-width="26" fill="none" stroke-linecap="round"/>
     <rect x="300" y="470" width="200" height="40" rx="20" fill="rgba(0,0,0,0.2)"/>`,
  book: (c: string) =>
    `<rect x="260" y="230" width="280" height="380" rx="20" fill="${c}"/>
     <rect x="260" y="230" width="36" height="380" rx="8" fill="rgba(0,0,0,0.25)"/>
     <rect x="470" y="230" width="30" height="380" fill="rgba(0,0,0,0.15)"/>`,
  bottle: (c: string) =>
    `<rect x="300" y="250" width="200" height="400" rx="60" fill="${c}"/>
     <rect x="340" y="170" width="120" height="90" rx="24" fill="${c}"/>
     <rect x="325" y="400" width="150" height="110" rx="16" fill="rgba(255,255,255,0.3)"/>`,
  mug: (c: string) =>
    `<rect x="255" y="270" width="270" height="310" rx="40" fill="${c}"/>
     <path d="M525 340 Q640 340 640 425 Q640 510 525 510" stroke="${c}" stroke-width="30" fill="none" stroke-linecap="round"/>
     <rect x="290" y="300" width="200" height="22" rx="11" fill="rgba(255,255,255,0.3)"/>`,
  kettle: (c: string) =>
    `<path d="M240 620 Q220 360 400 360 Q580 360 560 620 Z" fill="${c}"/>
     <path d="M560 460 L660 400 L650 440 L570 520 Z" fill="${c}"/>
     <path d="M300 360 Q400 220 500 360" stroke="${c}" stroke-width="26" fill="none" stroke-linecap="round"/>
     <circle cx="400" cy="360" r="40" fill="rgba(0,0,0,0.2)"/>`,
  candle: (c: string) =>
    `<rect x="280" y="330" width="240" height="300" rx="30" fill="${c}"/>
     <rect x="280" y="330" width="240" height="40" fill="rgba(0,0,0,0.18)"/>
     <path d="M400 300 V260" stroke="#3b3b3f" stroke-width="8"/>
     <path d="M400 190 Q440 240 400 275 Q360 240 400 190 Z" fill="#f0b64a"/>`,
  skillet: (c: string) =>
    `<circle cx="360" cy="440" r="190" fill="${c}"/>
     <circle cx="360" cy="440" r="140" fill="rgba(0,0,0,0.2)"/>
     <path d="M540 430 H690" stroke="${c}" stroke-width="44" stroke-linecap="round"/>`,
  pot: (c: string) =>
    `<rect x="230" y="360" width="340" height="260" rx="40" fill="${c}"/>
     <rect x="200" y="330" width="400" height="40" rx="20" fill="${c}"/>
     <circle cx="400" cy="320" r="26" fill="${c}"/>
     <path d="M170 450 H230 M570 450 H630" stroke="${c}" stroke-width="36" stroke-linecap="round"/>`,
  blanket: (c: string) =>
    `<rect x="220" y="470" width="360" height="120" rx="40" fill="${c}"/>
     <rect x="240" y="370" width="320" height="120" rx="40" fill="${c}" stroke="rgba(0,0,0,0.15)" stroke-width="6"/>
     <rect x="260" y="270" width="280" height="120" rx="40" fill="${c}" stroke="rgba(0,0,0,0.15)" stroke-width="6"/>
     <path d="M300 320 H500 M280 420 H520 M260 520 H540" stroke="rgba(255,255,255,0.3)" stroke-width="12"/>`,
  apron: (c: string) =>
    `<path d="M310 300 H490 L540 640 H260 Z" fill="${c}"/>
     <path d="M310 300 Q400 180 490 300" stroke="${c}" stroke-width="20" fill="none"/>
     <rect x="330" y="480" width="140" height="90" rx="14" fill="rgba(0,0,0,0.18)"/>`,
  sunglasses: (c: string) =>
    `<ellipse cx="290" cy="430" rx="120" ry="95" fill="${c}"/>
     <ellipse cx="510" cy="430" rx="120" ry="95" fill="${c}"/>
     <path d="M410 420 Q400 390 390 420" stroke="${c}" stroke-width="18" fill="none"/>
     <path d="M170 400 L110 380 M630 400 L690 380" stroke="${c}" stroke-width="18" stroke-linecap="round"/>
     <ellipse cx="260" cy="400" rx="40" ry="20" fill="rgba(255,255,255,0.3)"/>`,
  belt: (c: string) =>
    `<circle cx="400" cy="430" r="190" fill="none" stroke="${c}" stroke-width="60"/>
     <circle cx="400" cy="430" r="120" fill="none" stroke="${c}" stroke-width="40"/>
     <rect x="370" y="210" width="60" height="70" rx="10" fill="#c9b27c"/>`,
  headlamp: (c: string) =>
    `<path d="M200 430 Q400 300 600 430" stroke="${c}" stroke-width="50" fill="none" stroke-linecap="round"/>
     <rect x="310" y="330" width="180" height="140" rx="30" fill="${c}"/>
     <circle cx="400" cy="400" r="40" fill="#f0e4a8"/>`,
  poles: (c: string) =>
    `<path d="M330 180 V640 M470 180 V640" stroke="${c}" stroke-width="22" stroke-linecap="round"/>
     <rect x="305" y="180" width="50" height="110" rx="20" fill="#c4a77d"/>
     <rect x="445" y="180" width="50" height="110" rx="20" fill="#c4a77d"/>
     <path d="M280 560 H380 M420 560 H520" stroke="${c}" stroke-width="14"/>`,
  carabiner: (c: string) =>
    `<path d="M310 260 Q290 230 330 220 L470 220 Q510 230 500 270 L500 560 Q500 620 440 620 L360 620 Q300 620 300 560 Z" fill="none" stroke="${c}" stroke-width="40" stroke-linejoin="round"/>
     <path d="M500 330 L500 520" stroke="rgba(255,255,255,0.35)" stroke-width="16"/>`,
  board: (c: string) =>
    `<rect x="240" y="260" width="320" height="400" rx="40" fill="${c}"/>
     <circle cx="400" cy="320" r="22" fill="rgba(0,0,0,0.3)"/>
     <path d="M280 420 H520 M280 480 H520 M280 540 H520" stroke="rgba(0,0,0,0.12)" stroke-width="10"/>`,
  planter: (c: string) =>
    `<path d="M260 380 H540 L510 640 H290 Z" fill="${c}"/>
     <rect x="240" y="350" width="320" height="40" rx="12" fill="${c}"/>
     <path d="M400 350 V240 M400 300 Q330 240 320 190 M400 290 Q470 230 490 180" stroke="#5f7a52" stroke-width="18" fill="none" stroke-linecap="round"/>`,
};

// Mix a hex color toward white (positive amount) or black (negative), 0 to 1.
function mix(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const channel = (v: number) => Math.round(v + (target - v) * Math.abs(amount)).toString(16).padStart(2, "0");
  return `#${channel(n >> 16)}${channel((n >> 8) & 255)}${channel(n & 255)}`;
}

// A pale background for dark colors; a muted darker one for cream and white, so they stay visible.
function background(hex: string): [string, string] {
  const n = parseInt(hex.slice(1), 16);
  const brightness = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return brightness > 0.72 ? [mix(hex, -0.25), mix(hex, -0.42)] : [mix(hex, 0.82), mix(hex, 0.6)];
}

function svg(name: string, color: string): string {
  const shape = SHAPES.find(([pattern]) => pattern.test(name))?.[1];
  if (!shape) throw new Error(`No silhouette matches "${name}". Add a row to SHAPES.`);
  const [inner, outer] = background(color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${inner}"/>
      <stop offset="100%" stop-color="${outer}"/>
    </radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <ellipse cx="400" cy="660" rx="230" ry="26" fill="rgba(0,0,0,0.12)"/>
  ${draw[shape](color)}
</svg>
`;
}

const dir = "public/products";
mkdirSync(dir, { recursive: true });
for (const file of readdirSync(dir)) unlinkSync(`${dir}/${file}`);

for (const product of products) {
  const colorName = product.options.Color?.[0] ?? "Natural";
  const color = COLORS[colorName];
  if (!color) throw new Error(`No hex for color "${colorName}" on ${product.slug}. Add it to COLORS.`);
  writeFileSync(`${dir}/${product.slug}.svg`, svg(product.name, color));
}
console.log(`Drew ${products.length} images into ${dir}/.`);
