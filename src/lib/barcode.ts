// Pure EAN-13 / ISBN-13 barcode SVG generator — no external dependencies

const L_CODES = [
  "0001101","0011001","0010011","0111101","0100011",
  "0110001","0101111","0111011","0110111","0001011",
];
const G_CODES = [
  "0100111","0110011","0011011","0100001","0011101",
  "0111001","0000101","0010001","0001001","0010111",
];
const R_CODES = [
  "1110010","1001100","1101100","1000010","1011100",
  "1001110","1010000","1000100","1001000","1110100",
];
// Parity pattern for each possible first digit (0-9)
const PARITY = [
  "LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG",
  "LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL",
];

function computeCheckDigit(digits: number[]): number {
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

function isbnToDigits(isbn: string): number[] | null {
  const raw = isbn.replace(/[^0-9]/g, "");
  if (raw.length === 10) {
    // Convert ISBN-10 to ISBN-13 by prepending 978 and recomputing check
    const d = [9, 7, 8, ...raw.slice(0, 9).split("").map(Number)];
    d.push(computeCheckDigit(d));
    return d;
  }
  if (raw.length === 13) {
    const d = raw.split("").map(Number);
    d[12] = computeCheckDigit(d); // normalize check digit
    return d;
  }
  return null;
}

export function generateBarcodeSvg(isbn: string, opts?: { width?: number; height?: number }): string {
  const digits = isbnToDigits(isbn);
  if (!digits) return "";

  // EAN-13 barcode structure (95 data modules + 22 quiet-zone modules = 117 total)
  // Left quiet: 11 | Left guard: 3 | Left data: 42 | Center: 5 | Right data: 42 | Right guard: 3 | Right quiet: 7
  const QUIET_L = 11;
  const QUIET_R = 7;

  const bars: string[] = [];
  bars.push("1","0","1"); // left guard
  const parity = PARITY[digits[0]];
  for (let i = 0; i < 6; i++) {
    const enc = parity[i] === "L" ? L_CODES[digits[i + 1]] : G_CODES[digits[i + 1]];
    bars.push(...enc.split(""));
  }
  bars.push("0","1","0","1","0"); // center guard
  for (let i = 0; i < 6; i++) {
    bars.push(...R_CODES[digits[i + 7]].split(""));
  }
  bars.push("1","0","1"); // right guard

  const totalModules = QUIET_L + bars.length + QUIET_R; // 113

  const W = opts?.width ?? 190;
  const H = opts?.height ?? 100;
  const scale = W / totalModules;
  const barH = H * 0.72;
  const guardExtra = H * 0.05; // guard bars are taller
  const textY = H - 2;
  const fontSize = Math.max(6, 7 * scale).toFixed(1);

  // Bar rectangles
  let rects = "";
  for (let i = 0; i < bars.length; i++) {
    if (bars[i] !== "1") continue;
    const x = ((QUIET_L + i) * scale).toFixed(2);
    const w = scale.toFixed(2);
    const isGuard = i < 3 || (i >= 45 && i <= 49) || i >= 92;
    const h = (isGuard ? barH + guardExtra : barH).toFixed(2);
    rects += `<rect x="${x}" y="0" width="${w}" height="${h}" fill="#000"/>`;
  }

  // Digit labels
  let labels = "";
  // First digit (before left guard)
  labels += `<text x="${(QUIET_L * scale * 0.5).toFixed(2)}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="#000">${digits[0]}</text>`;
  // Left group (digits 1-6): each digit centered over its 7-module block
  for (let i = 0; i < 6; i++) {
    const cx = (QUIET_L + 3 + i * 7 + 3.5) * scale;
    labels += `<text x="${cx.toFixed(2)}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="#000">${digits[i + 1]}</text>`;
  }
  // Right group (digits 7-12)
  for (let i = 0; i < 6; i++) {
    const cx = (QUIET_L + 3 + 42 + 5 + i * 7 + 3.5) * scale;
    labels += `<text x="${cx.toFixed(2)}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="#000">${digits[i + 7]}</text>`;
  }

  const svgW = (totalModules * scale).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${H}" viewBox="0 0 ${svgW} ${H}">${rects}${labels}</svg>`;
}
