// THE WORLD — 21 November 2026
// Newspaper-style image, drawn entirely in code (Node 22, stdlib only).
// 1024x1024, black on off-white newsprint, deterministic PNG output.
// 14 main stories (headline + deck) + 32 one-line briefs = 46 stories,
// all first reported on Saturday 21 November 2026.
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;
const BG: [number, number, number] = [246, 239, 221];
const INK: [number, number, number] = [20, 20, 20];

// ---------------------------------------------------------------- font ---
// Small 5x7 bitmap font. Each glyph is 7 rows of 5 bits (MSB = left pixel).
// Lowercase letters reuse the uppercase glyphs.
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
  "-": [0, 0, 0, 0x0e, 0, 0, 0],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '"': [0x0a, 0x0a, 0x0a, 0, 0, 0, 0],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
};

function glyph(ch: string): number[] {
  if (ch >= "a" && ch <= "z") ch = ch.toUpperCase();
  return FONT[ch] ?? FONT["?"];
}

// Map any non-font character to a plain ASCII equivalent first.
function sanitize(s: string): string {
  return s
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/₹/g, "Rs ")
    .replace(/•/g, "-")
    .replace(/…/g, "...");
}

// ------------------------------------------------------------- canvas -----
const img = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  img[i * 3] = BG[0];
  img[i * 3 + 1] = BG[1];
  img[i * 3 + 2] = BG[2];
}

function setPx(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPx(xx, yy, c);
  }
}

function drawGlyph(ch: string, x: number, y: number, s: number): void {
  const rows = glyph(ch);
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (rows[r] & (1 << (4 - col))) {
        fillRect(x + col * s, y + r * s, s, s, INK);
      }
    }
  }
}

function textWidth(text: string, s: number): number {
  if (text.length === 0) return 0;
  return text.length * 6 * s - s;
}

function drawText(text: string, x: number, y: number, s: number): void {
  const t = sanitize(text);
  let cx = x;
  for (const ch of t) {
    drawGlyph(ch, cx, y, s);
    cx += 6 * s;
  }
}

function drawTextCentered(text: string, y: number, s: number): void {
  drawText(text, Math.round((W - textWidth(sanitize(text), s)) / 2), y, s);
}

function wrap(text: string, maxChars: number): string[] {
  const words = sanitize(text).split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur === "") {
      cur = w;
    } else if (cur.length + 1 + w.length <= maxChars) {
      cur += " " + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ------------------------------------------------------------ stories -----
type Main = { h: string; d: string };
const MAINS: Main[] = [
  { h: "Missiles aimed at Riyadh shot down", d: "Coalition intercepts three Houthi missiles headed for Riyadh; third straight night of alerts. (TBS)" },
  { h: "Russia strikes Ukraine with 148 drones", d: "Three ballistic missiles and 148 drones overnight; defences down 117 by 08:00, two killed. (h.ua)" },
  { h: "6.7 quake shakes central Peru", d: "Magnitude 6.7 quake hits 9 km NE of Carhuamayo at 00:09 UTC; felt in Lima, no deaths at first. (AFP)" },
  { h: "COP31 talks run into overtime", d: "Antalya summit spills into Saturday with no deal as draft drops fossil fuels and $120bn target. (AP)" },
  { h: "AI rout wipes $4 trillion off Wall Street", d: "Nasdaq falls 5.3% on Friday, erasing its 2026 gain, as Anthropic slides and Nvidia crashes 14%. (WSJ)" },
  { h: "Iran says it downed 58th US drone", d: "IRGC says forces shot down a US MQ-9 over the Strait of Hormuz with a new air-defence system. (Press TV)" },
  { h: "Iran readies tanker convoy to test blockade", d: "More than 14 laden tankers gather at Kharg Island as Tehran prepares to test the US blockade. (Europe Says)" },
  { h: "Vietnam speeds up land seizures", d: "National Assembly lets the state take land for priority projects before compensation is approved. (Reuters)" },
  { h: "Zelensky: Crimea bridge 'will not stand'", d: "President calls the Crimean Bridge a legitimate target in an NBC interview; it moves Russian weapons. (NBC)" },
  { h: "Trump orders contractors to flag Congress probes", d: "Order tells contractors to flag Congress requests to the White House and withhold material. (Reuters)" },
  { h: "Iraqi troops enter militia stronghold", d: "Army and police enter Kataib Hezbollah's Jurf al-Sakhar base for the first time in over a decade. (NYT)" },
  { h: "Singapore, China line up 20+ deals", d: "PM Wong meets Premier Li Qiang in Beijing before Monday's council session in Singapore. (Straits Times)" },
  { h: "Archimedes' screw shrunk to one molecule", d: "Weizmann team builds one spinning helical molecule turning current into rotation; in Nature. (Jerusalem Post)" },
  { h: "Rahul century puts India on top", d: "KL Rahul hits 136 as India reach 486/4 at stumps on day three, leading New Zealand by 118. (ESPNcricinfo)" },
];

const BRIEFS: string[] = [
  "Iran effectively out of NPT, lawmaker says (TASS)",
  "Third Salvadoran soldier dies in Haiti blast (Al Jazeera)",
  "Fire at Basra power station kills four (Reuters)",
  "Italy hit by nationwide general strike (CGIL)",
  "German producer prices jump 8.1% (Destatis)",
  "Lufthansa to cut 1,000 jobs (Lufthansa)",
  "Spain frees US pro-Palestine activist on bail (court)",
  "Canada denies blame at landmark climate trial (AFP)",
  "Magnitude 5.0 aftershock hits Peru (USGS)",
  "Peru quake: one injured, homes and hospital hit (INDECI)",
  "Israeli strikes kill six in Gaza; settler attacks pass 400 (UN)",
  "Gen Z protests spread across 25 European countries (Al Jazeera)",
  "Houthis threaten Jeddah ports, warn airlines (TBS)",
  "Coalition strikes Hodeidah port and Sanaa (coalition)",
  "Austria expects migration deal with Rwanda in early 2027 (Karner)",
  "15 Arab and Muslim states back Israel sanctions (joint statement)",
  "Israeli coalition talks stall over speaker vote (Jerusalem Post)",
  "Gaza civil defence crippled: 85% of vehicles out (Al Jazeera)",
  "Bayelsa boat toll disputed: police confirm 4 dead (Daily Mirror NG)",
  "Cyclone Xavier weakens after Category 5 peak (GDACS)",
  "Iboga alkaloid recipe cracked by scientists (Nature Communications)",
  "Liver-fibrosis driver G3BP1 identified (Nature Communications)",
  "NBA: Nuggets, Lakers and Thunder win (NBA)",
  "U-17 World Cup opens with big wins (FIFA)",
  "Oregon routs Michigan State 45-7 (NCAA)",
  "South Korea's Lee heads to Ulsan (Korea Times)",
  "Ramayana crosses Rs 1,500 crore worldwide (box office)",
  "Dhanush's O.M sets record Telugu opening (box office)",
  "Anil Kapoor meets Macron in Paris (cinema)",
  "SAG-AFTRA creates healthcare task force (SAG-AFTRA)",
  "CMA Awards draw record TV audience (CMA)",
  "Pancreatic cancer pill shows promise in trial (trial)",
];

// Fit checks (logged; the layout below is sized for these limits).
const HEAD_CHARS = 39; // 472px column at scale 2 -> 12px per char
const DECK_CHARS = 39;
let fitOk = true;
MAINS.forEach((m, i) => {
  const hl = wrap(m.h, HEAD_CHARS);
  const dl = wrap(m.d, DECK_CHARS);
  if (hl.length > 2) { console.log(`WARN main ${i + 1} headline ${hl.length} lines`); fitOk = false; }
  if (dl.length > 3) { console.log(`WARN main ${i + 1} deck ${dl.length} lines`); fitOk = false; }
  if (hl.length + dl.length > 5) { console.log(`WARN main ${i + 1} total ${hl.length + dl.length} lines`); fitOk = false; }
});
BRIEFS.forEach((b, i) => {
  const t = "- " + sanitize(b);
  if (textWidth(t, 1) > 472) { console.log(`WARN brief ${i + 1} too wide: ${t.length} chars`); fitOk = false; }
});
console.log(`stories: ${MAINS.length} main + ${BRIEFS.length} briefs = ${MAINS.length + BRIEFS.length}; fitOk=${fitOk}`);

// ------------------------------------------------------------ layout -----
// Masthead
fillRect(28, 16, 968, 3, INK);
drawTextCentered("THE WORLD", 30, 8);
drawTextCentered("Saturday 21 November 2026", 98, 3);
drawTextCentered("46 stories from today - all first reported on Saturday 21 November 2026", 126, 1);
fillRect(28, 138, 968, 2, INK);
fillRect(28, 143, 968, 1, INK);

// Main stories: two columns, 7 per column, 88px slots.
const COL_X = [28, 524];
const COL_W = 472;
const SLOT_H = 88;
const MAINS_TOP = 154;
const LINE_H = 15; // scale 2: 14px glyph + 1px leading
MAINS.forEach((m, i) => {
  const col = i < 7 ? 0 : 1;
  const row = i % 7;
  const x = COL_X[col];
  let y = MAINS_TOP + row * SLOT_H;
  const hl = wrap(m.h, HEAD_CHARS);
  for (const line of hl) {
    drawText(line, x, y, 2);
    y += LINE_H;
  }
  y += 3; // gap between headline and deck
  const dl = wrap(m.d, DECK_CHARS);
  for (const line of dl) {
    drawText(line, x, y, 2);
    y += LINE_H;
  }
  // thin separator under each story except the last in its column
  if (row < 6) fillRect(x, MAINS_TOP + (row + 1) * SLOT_H - 9, COL_W, 1, [120, 110, 95]);
});

// Divider + briefs header
const BRIEFS_HEAD_Y = 786;
fillRect(28, 778, 968, 2, INK);
drawText("IN BRIEF", 28, BRIEFS_HEAD_Y, 2);
drawText("32 stories in one line each", 200, BRIEFS_HEAD_Y + 4, 1);

// Briefs: two columns x 16 rows, one line each, scale 1, 12px rows.
const BRIEFS_TOP = 812;
const BRIEF_ROW_H = 12;
BRIEFS.forEach((b, i) => {
  const col = i < 16 ? 0 : 1;
  const row = i % 16;
  drawText("- " + b, COL_X[col], BRIEFS_TOP + row * BRIEF_ROW_H, 1);
});

// Footer
fillRect(28, 1006, 968, 1, INK);
drawTextCentered("THE WORLD - 21 November 2026 - 46 stories, all first reported today - sources as credited", 1012, 1);

// ------------------------------------------------------------- PNG -------
// CRC32 (standard polynomial 0xEDB88320).
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter: none
  Buffer.from(img.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "entry.png");
fs.writeFileSync(outPath, png);
console.log(`wrote ${outPath} (${png.length} bytes, ${W}x${H})`);
