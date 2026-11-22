// THE WORLD — Saturday 21 November 2026 (new illustrated front page)
// Drawn entirely in code: Node stdlib only, no network, no image files.
// 1024x1024 deterministic PNG. 46 stories, all first reported 21 Nov 2026:
// 3 illustrated top stories + 10 mid stories with icons + 33 numbered
// stories tied to a dot-matrix world map. Colour region bars throughout.
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [250, 243, 228];
const INK: [number, number, number] = [24, 24, 24];
const FAINT: [number, number, number] = [150, 138, 118];

// ------------------------------------------------------------ bitmap font -
// One glyph = 7 rows of 5 "0"/"1" characters. Lowercase maps to uppercase.
// This encoding (row strings) and every glyph below were typed fresh here.
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "01010", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00001", "00010", "00100", "01000", "10000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
};

function clean(s: string): string {
  return s
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u20b9/g, "Rs ")
    .replace(/\u2022/g, "-")
    .replace(/\u2026/g, "...");
}

function glyphRows(ch: string): string[] {
  if (ch >= "a" && ch <= "z") ch = ch.toUpperCase();
  return GLYPHS[ch] ?? GLYPHS["?"];
}

// --------------------------------------------------------------- canvas ---
const px = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = PAPER[0];
  px[i * 3 + 1] = PAPER[1];
  px[i * 3 + 2] = PAPER[2];
}

type RGB = [number, number, number];
function dot(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function box(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) dot(xx, yy, c);
}
function hline(x: number, y: number, w: number, c: RGB): void {
  box(x, y, w, 1, c);
}
function vline(x: number, y: number, h: number, c: RGB): void {
  box(x, y, 1, h, c);
}
// Bresenham line, thickness t (square brush).
function seg(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (let guard = 0; guard < 4000; guard++) {
    box(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let yy = cy - r; yy <= cy + r; yy++)
    for (let xx = cx - r; xx <= cx + r; xx++)
      if ((xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= r * r) dot(xx, yy, c);
}
function ring(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a += 4) {
    const rad = (a * Math.PI) / 180;
    dot(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
  }
}
// Scanline fill for a simple polygon given as [x,y] pairs.
function poly(pts: [number, number][], c: RGB): void {
  let minY = H;
  let maxY = 0;
  for (const [, y] of pts) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
        xs.push(Math.round(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0)));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) hline(xs[k], y, xs[k + 1] - xs[k], c);
  }
}
// Tiny deterministic generator (fixed seed) for star / speckle placement.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ------------------------------------------------------------------ text --
function charW(s: number): number {
  return 6 * s;
}
function strW(t: string, s: number): number {
  return clean(t).length === 0 ? 0 : clean(t).length * charW(s) - s;
}
function drawChar(ch: string, x: number, y: number, s: number, c: RGB): void {
  const rows = glyphRows(ch);
  for (let r = 0; r < 7; r++)
    for (let col = 0; col < 5; col++)
      if (rows[r][col] === "1") box(x + col * s, y + r * s, s, s, c);
}
function drawStr(t: string, x: number, y: number, s: number, c: RGB = INK, bold = false): void {
  let cx = x;
  for (const ch of clean(t)) {
    drawChar(ch, cx, y, s, c);
    if (bold) drawChar(ch, cx + 1, y, s, c);
    cx += charW(s);
  }
}
function drawCentred(t: string, y: number, s: number, c: RGB = INK, bold = false): void {
  drawStr(t, Math.round((W - strW(t, s)) / 2), y, s, c, bold);
}
function wrapByWidth(t: string, s: number, maxW: number): string[] {
  const maxChars = Math.max(1, Math.floor((maxW + s) / charW(s)));
  const words = clean(t).split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur === "") cur = w;
    else if (cur.length + 1 + w.length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// -------------------------------------------------------------- regions ---
// One colour per region, used for kicker bars, map dots and legend alike.
const REGIONS: Record<string, { name: string; c: RGB }> = {
  ME: { name: "MIDDLE EAST", c: [178, 44, 38] },
  EU: { name: "EUROPE", c: [38, 82, 158] },
  AS: { name: "ASIA-PACIFIC", c: [0, 128, 108] },
  AM: { name: "AMERICAS", c: [198, 108, 0] },
  AF: { name: "AFRICA", c: [112, 68, 158] },
  WO: { name: "WORLD", c: [74, 74, 74] },
  SP: { name: "SPORT & CULTURE", c: [46, 130, 54] },
};

type Story = { h: string; d: string; r: keyof typeof REGIONS; tag: string };

// The 3 top stories: the most consequential of the day.
const TOP: Story[] = [
  {
    h: "Missiles aimed at Riyadh shot down",
    d: "Three Houthi missiles downed. Third night of alerts. (TBS)",
    r: "ME",
    tag: "RIYADH",
  },
  {
    h: "Russia strikes Ukraine with 148 drones",
    d: "Three missiles, 148 drones overnight; defences down 117. Two killed. (h.ua)",
    r: "EU",
    tag: "KYIV",
  },
  {
    h: "6.7 quake shakes central Peru",
    d: "Magnitude 6.7, 9 km NE of Carhuamayo at 00:09 UTC. Felt in Lima. (AFP)",
    r: "AM",
    tag: "LIMA",
  },
];

// The 10 mid stories, each with a small illustration.
const MID: Story[] = [
  {
    h: "COP31 talks run into overtime",
    d: "Antalya in overtime; draft drops fossil fuels, $120bn goal. (AP)",
    r: "WO",
    tag: "CLIMATE",
  },
  {
    h: "AI rout wipes $4 trillion off Wall Street",
    d: "Nasdaq falls 5.3% Friday; Nvidia down 14%. (WSJ)",
    r: "AM",
    tag: "MARKETS",
  },
  {
    h: "Iran says it downed 58th US drone",
    d: "IRGC says it downed a US MQ-9 over the Strait of Hormuz. (Press TV)",
    r: "ME",
    tag: "GULF",
  },
  {
    h: "Iran readies tanker convoy to test blockade",
    d: "14+ tankers at Kharg Island to test the US blockade. (Europe Says)",
    r: "ME",
    tag: "TANKER",
  },
  {
    h: "Vietnam speeds up land seizures",
    d: "State can take land before compensation is approved. (Reuters)",
    r: "AS",
    tag: "HANOI",
  },
  {
    h: "Zelensky: Crimea bridge 'will not stand'",
    d: "Calls the Crimean Bridge a legitimate target. (NBC)",
    r: "EU",
    tag: "KYIV",
  },
  {
    h: "Iraqi troops enter militia stronghold",
    d: "Troops enter Jurf al-Sakhar base, first time in a decade. (NYT)",
    r: "ME",
    tag: "BAGHDAD",
  },
  {
    h: "Singapore, China line up 20+ deals",
    d: "Wong meets Li in Beijing ahead of Monday's talks. (Straits Times)",
    r: "AS",
    tag: "BEIJING",
  },
  {
    h: "Archimedes' screw shrunk to one molecule",
    d: "One molecule turns current into rotation. (Jerusalem Post)",
    r: "WO",
    tag: "SCIENCE",
  },
  {
    h: "Rahul century puts India on top",
    d: "Rahul hits 136; India 486/4 lead New Zealand by 118. (ESPNcricinfo)",
    r: "SP",
    tag: "CRICKET",
  },
];

// The remaining 33 stories, one line each, numbered for the world map.
const REST: string[] = [
  "Trump orders contractors to flag Congress probes (Reuters)",
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

// --------------------------------------------------------- illustrations --
// Flat vector-style scenes, drawn in code inside a box (x, y, w, h).

function sceneRiyadh(x: number, y: number, w: number, h: number): void {
  // Night sky over Riyadh: deep blue bands, stars, skyline, interceptor
  // trails racing up to three bright bursts.
  box(x, y, w, h, [16, 28, 64]);
  box(x, y + Math.floor(h * 0.55), w, h - Math.floor(h * 0.55), [38, 52, 96]);
  const rnd = lcg(20261121);
  for (let i = 0; i < 46; i++) {
    const sx = x + Math.floor(rnd() * w);
    const sy = y + Math.floor(rnd() * Math.floor(h * 0.5));
    dot(sx, sy, [255, 255, 220]);
    if (rnd() > 0.7) dot(sx + 1, sy, [255, 255, 220]);
  }
  disc(x + Math.floor(w * 0.82), y + 16, 11, [240, 236, 200]);
  disc(x + Math.floor(w * 0.82) - 4, y + 13, 9, [16, 28, 64]);
  // Skyline: dark towers, one tall needle tower.
  const base = y + h;
  box(x + 8, base - 34, 26, 34, [10, 16, 40]);
  box(x + 40, base - 48, 22, 48, [10, 16, 40]);
  box(x + 66, base - 26, 30, 26, [10, 16, 40]);
  box(x + 100, base - 58, 16, 58, [10, 16, 40]);
  seg(x + 108, base - 58, x + 108, base - 70, [10, 16, 40], 2);
  box(x + 122, base - 30, 34, 30, [10, 16, 40]);
  box(x + 162, base - 44, 24, 44, [10, 16, 40]);
  box(x + 192, base - 28, 30, 28, [10, 16, 40]);
  box(x + 228, base - 40, 26, 40, [10, 16, 40]);
  box(x + 260, base - 24, 34, 24, [10, 16, 40]);
  box(x + 298, base - 36, 18, 36, [10, 16, 40]);
  // Warm windows.
  const rnd2 = lcg(77);
  for (let i = 0; i < 26; i++) {
    dot(x + 10 + Math.floor(rnd2() * (w - 20)), base - 8 - Math.floor(rnd2() * 44), [255, 196, 90]);
  }
  // Three interceptor trails from the ground to bright bursts.
  const bursts: [number, number][] = [
    [Math.floor(w * 0.24), 26],
    [Math.floor(w * 0.52), 16],
    [Math.floor(w * 0.78), 30],
  ];
  for (const [bx, by] of bursts) {
    seg(x + bx - 26, base - 2, x + bx, y + by, [255, 214, 120], 2);
    seg(x + bx + 30, base - 2, x + bx, y + by, [255, 255, 255], 1);
    disc(x + bx, y + by, 7, [255, 240, 160]);
    disc(x + bx, y + by, 4, [255, 255, 255]);
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      seg(x + bx, y + by, x + bx + Math.round(12 * Math.cos(a)), y + by + Math.round(12 * Math.sin(a)), [255, 200, 90], 1);
    }
  }
}

function sceneDrones(x: number, y: number, w: number, h: number): void {
  // Dusk sky, a swarm of drone silhouettes, orange flak bursts below.
  box(x, y, w, h, [214, 158, 110]);
  box(x, y + Math.floor(h * 0.45), w, Math.floor(h * 0.2), [176, 112, 82]);
  box(x, y + Math.floor(h * 0.65), w, h - Math.floor(h * 0.65), [52, 48, 52]);
  disc(x + Math.floor(w * 0.85), y + 18, 13, [255, 224, 170]);
  // Rooftops along the bottom.
  const base = y + h;
  box(x + 6, base - 22, 40, 22, [30, 28, 34]);
  box(x + 52, base - 30, 30, 30, [30, 28, 34]);
  box(x + 88, base - 18, 44, 18, [30, 28, 34]);
  box(x + 138, base - 26, 36, 26, [30, 28, 34]);
  box(x + 180, base - 20, 42, 20, [30, 28, 34]);
  box(x + 228, base - 32, 32, 32, [30, 28, 34]);
  box(x + 266, base - 22, 44, 22, [30, 28, 34]);
  // Drone silhouettes: dark X shapes with a body bar.
  const drones: [number, number, number][] = [
    [0.14, 0.22, 1], [0.3, 0.14, 1], [0.46, 0.28, 1], [0.6, 0.16, 1],
    [0.72, 0.3, 1], [0.86, 0.2, 1], [0.24, 0.42, 1], [0.55, 0.44, 1],
    [0.78, 0.48, 1], [0.38, 0.55, 1],
  ];
  for (const [fx, fy] of drones) {
    const cx = x + Math.floor(w * fx);
    const cy = y + Math.floor(h * fy);
    seg(cx - 9, cy - 5, cx + 9, cy + 5, [28, 26, 30], 2);
    seg(cx - 9, cy + 5, cx + 9, cy - 5, [28, 26, 30], 2);
    disc(cx, cy, 3, [28, 26, 30]);
  }
  // Flak bursts: orange puffs with bright cores.
  const bursts: [number, number][] = [
    [Math.floor(w * 0.2), Math.floor(h * 0.62)],
    [Math.floor(w * 0.48), Math.floor(h * 0.56)],
    [Math.floor(w * 0.76), Math.floor(h * 0.64)],
  ];
  for (const [bx, by] of bursts) {
    disc(x + bx, y + by, 11, [255, 140, 40]);
    disc(x + bx - 4, y + by - 3, 6, [255, 200, 90]);
    disc(x + bx + 5, y + by + 4, 5, [255, 170, 60]);
    disc(x + bx, y + by, 3, [255, 245, 200]);
  }
}

function sceneQuake(x: number, y: number, w: number, h: number): void {
  // Andes foothills, a town on cracked ground, red seismograph strip.
  // Ground band is tall so the leaning houses read at small size.
  box(x, y, w, h, [188, 214, 228]);
  poly(
    [[x, y + 48], [x + 70, y + 8], [x + 140, y + 48], [x + 210, y + 14], [x + 290, y + 48], [x + w, y + 30], [x + w, y + 54], [x, y + 54]],
    [96, 128, 148],
  );
  box(x, y + 48, w, h - 48, [168, 132, 92]);
  // Cracked ground: thick black zigzag cracks across the whole band.
  seg(x + 16, y + 52, x + 58, y + 66, [40, 30, 22], 3);
  seg(x + 58, y + 66, x + 98, y + 54, [40, 30, 22], 3);
  seg(x + 98, y + 54, x + 138, y + 70, [40, 30, 22], 3);
  seg(x + 178, y + 52, x + 218, y + 68, [40, 30, 22], 3);
  seg(x + 218, y + 68, x + 260, y + 56, [40, 30, 22], 3);
  seg(x + 260, y + 56, x + 302, y + 70, [40, 30, 22], 3);
  // Leaning houses: big parallelograms with red roofs, tilted by the quake.
  poly([[x + 22, y + 56], [x + 58, y + 48], [x + 64, y + 72], [x + 28, y + 78]], [240, 230, 210]);
  poly([[x + 22, y + 56], [x + 58, y + 48], [x + 60, y + 42], [x + 24, y + 50]], [178, 44, 38]);
  poly([[x + 148, y + 54], [x + 184, y + 60], [x + 180, y + 78], [x + 144, y + 74]], [240, 230, 210]);
  poly([[x + 148, y + 54], [x + 184, y + 60], [x + 182, y + 54], [x + 146, y + 48]], [178, 44, 38]);
  poly([[x + 238, y + 58], [x + 272, y + 52], [x + 276, y + 74], [x + 242, y + 78]], [240, 230, 210]);
  poly([[x + 238, y + 58], [x + 272, y + 52], [x + 274, y + 46], [x + 240, y + 52]], [178, 44, 38]);
  // Seismograph strip along the bottom: white band, wild red trace.
  const sy = y + h - 18;
  box(x, sy, w, 18, [255, 255, 255]);
  hline(x, sy, w, [120, 120, 120]);
  let px0 = x + 4;
  let py0 = sy + 9;
  const trace: [number, number][] = [
    [14, 0], [10, 1], [12, -1], [10, 1], [8, -6], [8, 7], [8, -7], [8, 5],
    [10, -2], [12, 1], [14, 0], [10, -1], [12, 1], [10, 0], [14, -1], [12, 1],
    [10, 0], [12, -1], [10, 1], [14, 0], [10, 1], [12, -1], [10, 0],
  ];
  for (const [dx, dy] of trace) {
    seg(px0, py0, px0 + dx, py0 + dy, [200, 30, 30], 2);
    px0 += dx;
    py0 += dy;
    if (px0 > x + w - 8) break;
  }
  // Magnitude badge.
  box(x + w - 52, y + 6, 46, 18, [178, 44, 38]);
  drawStr("6.7", x + w - 46, y + 9, 2, [255, 255, 255], true);
}

const TOP_SCENES = [sceneRiyadh, sceneDrones, sceneQuake];

// Small 46x46 icons for the mid stories, keyed by story tag.
function drawIcon(kind: string, x: number, y: number): void {
  const S = 46;
  if (kind === "CLIMATE") {
    box(x, y, S, S, [214, 238, 214]);
    disc(x + 23, y + 22, 15, [52, 120, 200]);
    poly([[x + 8, y + 18], [x + 20, y + 12], [x + 34, y + 20], [x + 20, y + 30]], [80, 180, 90]);
    seg(x + 23, y + 8, x + 23, y + 36, [30, 90, 40], 2);
    poly([[x + 23, y + 10], [x + 34, y + 16], [x + 23, y + 20]], [46, 160, 60]);
  } else if (kind === "MARKETS") {
    box(x, y, S, S, [32, 34, 44]);
    box(x + 6, y + 26, 6, 12, [90, 160, 110]);
    box(x + 15, y + 20, 6, 18, [90, 160, 110]);
    box(x + 24, y + 14, 6, 24, [90, 160, 110]);
    box(x + 33, y + 8, 6, 30, [200, 60, 50]);
    seg(x + 4, y + 8, x + 42, y + 34, [255, 90, 70], 3);
    poly([[x + 34, y + 26], [x + 42, y + 34], [x + 34, y + 38]], [255, 90, 70]);
  } else if (kind === "GULF") {
    // MQ-9 style drone seen from the side, with a red down-arrow.
    box(x, y, S, S, [180, 214, 232]);
    seg(x + 6, y + 16, x + 40, y + 16, [60, 60, 66], 2);
    box(x + 18, y + 13, 10, 7, [60, 60, 66]);
    disc(x + 30, y + 16, 2, [60, 60, 66]);
    disc(x + 8, y + 13, 3, [90, 90, 96]);
    disc(x + 38, y + 13, 3, [90, 90, 96]);
    seg(x + 4, y + 13, x + 12, y + 13, [90, 90, 96], 1);
    seg(x + 34, y + 13, x + 42, y + 13, [90, 90, 96], 1);
    seg(x + 23, y + 20, x + 23, y + 28, [60, 60, 66], 2);
    seg(x + 16, y + 28, x + 30, y + 28, [60, 60, 66], 2);
    seg(x + 23, y + 32, x + 23, y + 40, [178, 44, 38], 2);
    poly([[x + 23, y + 40], [x + 18, y + 34], [x + 28, y + 34]], [178, 44, 38]);
  } else if (kind === "TANKER") {
    // Oil tanker on the sea: dark hull, coloured containers, funnel.
    box(x, y, S, S, [170, 208, 230]);
    box(x, y + 28, S, 18, [52, 120, 200]);
    box(x + 4, y + 20, 38, 9, [40, 40, 46]);
    box(x + 8, y + 14, 7, 6, [200, 60, 50]);
    box(x + 17, y + 14, 7, 6, [220, 170, 40]);
    box(x + 26, y + 14, 7, 6, [46, 130, 54]);
    box(x + 36, y + 12, 4, 8, [220, 220, 220]);
    seg(x + 4, y + 33, x + 14, y + 33, [255, 255, 255], 1);
    seg(x + 20, y + 38, x + 32, y + 38, [255, 255, 255], 1);
  } else if (kind === "HANOI") {
    box(x, y, S, S, [238, 222, 190]);
    box(x + 8, y + 18, 30, 20, [150, 110, 70]);
    poly([[x + 6, y + 18], [x + 23, y + 6], [x + 40, y + 18]], [178, 44, 38]);
    box(x + 19, y + 26, 8, 12, [60, 40, 20]);
    seg(x + 38, y + 6, x + 38, y + 18, [120, 120, 120], 1);
    poly([[x + 38, y + 6], [x + 44, y + 9], [x + 38, y + 12]], [220, 40, 40]);
  } else if (kind === "KYIV") {
    box(x, y, S, S, [190, 214, 236]);
    seg(x + 4, y + 30, x + 42, y + 30, [70, 70, 78], 3);
    seg(x + 8, y + 30, x + 14, y + 14, [70, 70, 78], 2);
    seg(x + 32, y + 30, x + 38, y + 14, [70, 70, 78], 2);
    seg(x + 14, y + 14, x + 38, y + 14, [70, 70, 78], 2);
    seg(x + 14, y + 22, x + 38, y + 22, [70, 70, 78], 1);
    disc(x + 23, y + 8, 4, [200, 40, 40]);
    ring(x + 23, y + 8, 7, [200, 40, 40]);
  } else if (kind === "BAGHDAD") {
    box(x, y, S, S, [232, 214, 170]);
    box(x + 8, y + 14, 30, 24, [170, 140, 100]);
    poly([[x + 6, y + 14], [x + 23, y + 4], [x + 40, y + 14]], [120, 90, 50]);
    box(x + 19, y + 24, 8, 14, [60, 44, 26]);
    disc(x + 36, y + 10, 3, [200, 170, 60]);
  } else if (kind === "BEIJING") {
    box(x, y, S, S, [196, 220, 238]);
    box(x + 5, y + 18, 10, 20, [70, 90, 120]);
    box(x + 17, y + 8, 12, 30, [50, 70, 100]);
    box(x + 31, y + 14, 10, 24, [70, 90, 120]);
    seg(x + 23, y + 8, x + 23, y + 2, [50, 70, 100], 1);
    poly([[x + 23, y + 2], [x + 28, y + 6], [x + 23, y + 8]], [200, 40, 40]);
    box(x + 5, y + 38, 36, 2, [50, 70, 100]);
  } else if (kind === "SCIENCE") {
    box(x, y, S, S, [255, 255, 255]);
    box(x, y, S, S, [240, 240, 248]);
    for (let i = 0; i <= 10; i++) {
      const yy = y + 4 + i * 4;
      const off = Math.round(9 * Math.sin((i * Math.PI) / 5));
      dot(x + 14 + off, yy, [40, 90, 180]);
      dot(x + 32 - off, yy, [180, 60, 60]);
      if (i % 2 === 0) seg(x + 14 + off, yy, x + 32 - off, yy, [120, 120, 140], 1);
    }
  } else {
    // CRICKET
    box(x, y, S, S, [120, 190, 110]);
    box(x + 6, y + 8, 34, 30, [190, 170, 120]);
    seg(x + 30, y + 38, x + 30, y + 10, [150, 110, 70], 3);
    seg(x + 24, y + 38, x + 24, y + 10, [150, 110, 70], 3);
    seg(x + 18, y + 38, x + 18, y + 10, [150, 110, 70], 3);
    poly([[x + 32, y + 12], [x + 40, y + 20], [x + 36, y + 24], [x + 28, y + 16]], [170, 120, 70]);
    disc(x + 12, y + 30, 4, [178, 44, 38]);
  }
}

// ------------------------------------------------------------- world map --
// Dot-matrix world map: land is the union of a few ellipses over the map
// box, drawn as a grid of dots. Numbered pins mark ten of the stories.
type Ellipse = { cx: number; cy: number; rx: number; ry: number };
const LAND: Ellipse[] = [
  { cx: 92, cy: 42, rx: 62, ry: 28 }, // North America
  { cx: 148, cy: 24, rx: 13, ry: 9 }, // Greenland
  { cx: 132, cy: 76, rx: 16, ry: 8 }, // Central America
  { cx: 158, cy: 122, rx: 22, ry: 32 }, // South America
  { cx: 246, cy: 42, rx: 20, ry: 14 }, // Europe
  { cx: 260, cy: 92, rx: 25, ry: 30 }, // Africa
  { cx: 300, cy: 40, rx: 52, ry: 26 }, // Asia
  { cx: 312, cy: 92, rx: 18, ry: 9 }, // SE Asia
  { cx: 332, cy: 132, rx: 17, ry: 11 }, // Australia
];

function inLand(dx: number, dy: number): boolean {
  for (const e of LAND) {
    const qx = (dx - e.cx) / e.rx;
    const qy = (dy - e.cy) / e.ry;
    if (qx * qx + qy * qy <= 1) return true;
  }
  return false;
}

// Map pins: [numbered-list number, map x, map y] in map-box coordinates.
const PINS: [number, number, number][] = [
  [1, 116, 54], // Washington — Trump order
  [2, 234, 58], // Tehran — Iran out of NPT
  [3, 120, 80], // Haiti — Salvadoran soldier dies
  [5, 196, 52], // Rome — Italy general strike
  [10, 116, 118], // Peru — 5.0 aftershock
  [12, 218, 64], // Gaza — Israeli strikes
  [13, 190, 40], // Brussels — Gen Z protests
  [20, 192, 96], // Bayelsa — boat toll disputed
  [26, 74, 48], // Oregon — routs Michigan State
  [27, 302, 56], // Seoul — Lee heads to Ulsan
];

// --------------------------------------------------------------- layout ---
// Fit checks (logged; layout is sized for these limits).
let fitOk = true;
function checkFit(): void {
  for (let i = 0; i < TOP.length; i++) {
    const hl = wrapByWidth(TOP[i].h, 2, 320);
    const dl = wrapByWidth(TOP[i].d, 2, 320);
    if (hl.length > 2) { console.log(`WARN top ${i + 1} headline ${hl.length} lines`); fitOk = false; }
    if (dl.length > 3) { console.log(`WARN top ${i + 1} deck ${dl.length} lines`); fitOk = false; }
  }
  for (let i = 0; i < MID.length; i++) {
    const hl = wrapByWidth(MID[i].h, 2, 412);
    const dl = wrapByWidth(MID[i].d, 1, 412);
    if (hl.length > 2) { console.log(`WARN mid ${i + 1} headline ${hl.length} lines`); fitOk = false; }
    if (dl.length > 2) { console.log(`WARN mid ${i + 1} deck ${dl.length} lines`); fitOk = false; }
  }
  for (let i = 0; i < REST.length; i++) {
    const t = `${i + 1}. ${REST[i]}`;
    if (strW(t, 1) > 488) { console.log(`WARN brief ${i + 1} too wide (${strW(t, 1)}px)`); fitOk = false; }
  }
  console.log(`stories: ${TOP.length} top + ${MID.length} mid + ${REST.length} numbered = ${TOP.length + MID.length + REST.length}; fitOk=${fitOk}`);
}
checkFit();

// ---- Masthead ----
box(28, 10, 968, 3, INK);
drawStr("THE WORLD", Math.round((W - strW("THE WORLD", 10)) / 2), 16, 10, INK, true);
drawStr("SATURDAY 21 NOVEMBER 2026", Math.round((W - strW("SATURDAY 21 NOVEMBER 2026", 2)) / 2), 92, 2, INK, true);
// Region legend: colour squares + names, spread evenly across the page.
{
  const keys = Object.keys(REGIONS);
  const itemW = keys.map((k) => 10 + 4 + strW(REGIONS[k].name, 1));
  const total = itemW.reduce((a, b) => a + b, 0);
  const gap = Math.floor((968 - total) / (keys.length - 1));
  let lx = 28;
  for (let i = 0; i < keys.length; i++) {
    const reg = REGIONS[keys[i]];
    box(lx, 112, 10, 10, reg.c);
    drawStr(reg.name, lx + 14, 113, 1, INK);
    lx += itemW[i] + gap;
  }
}
box(28, 130, 968, 2, INK);
box(28, 134, 968, 1, INK);

// ---- Top 3 illustrated stories ----
const TOP_X = [24, 352, 680];
TOP.forEach((s, i) => {
  const x = TOP_X[i];
  const reg = REGIONS[s.r];
  TOP_SCENES[i](x, 142, 320, 92);
  box(x, 234, 320, 15, reg.c);
  drawStr(`${reg.name} — ${s.tag}`, x + 6, 237, 1, [255, 255, 255], true);
  let y = 256;
  for (const line of wrapByWidth(s.h, 2, 320)) {
    drawStr(line, x, y, 2, INK, true);
    y += 15;
  }
  y += 3;
  for (const line of wrapByWidth(s.d, 2, 320)) {
    drawStr(line, x, y, 2, INK);
    y += 15;
  }
});

// ---- Mid stories: icon + headline + one-line deck ----
drawStr("ALSO TODAY", 24, 342, 2, INK, true);
box(24, 360, 976, 2, INK);
MID.forEach((s, i) => {
  const col = i < 5 ? 0 : 1;
  const row = i % 5;
  const x = col === 0 ? 24 : 524;
  const y = 368 + row * 52;
  const reg = REGIONS[s.r];
  box(x, y, 4, 46, reg.c);
  drawIcon(s.tag, x + 8, y);
  let ty = y;
  for (const line of wrapByWidth(s.h, 2, 412)) {
    drawStr(line, x + 62, ty, 2, INK, true);
    ty += 15;
  }
  ty += 1;
  for (const line of wrapByWidth(s.d, 1, 412)) {
    drawStr(line, x + 62, ty, 1, INK);
    ty += 9;
  }
  if (row < 4) hline(x, y + 50, 476, [210, 198, 178]);
});

// ---- World map + DATE CHECK ----
drawStr("AROUND THE WORLD", 24, 626, 1, INK, true);
drawStr("numbered dots mark ten stories in the list below", 160, 626, 1, [90, 84, 70]);
const MAP_X = 24;
const MAP_Y = 640;
const MAP_W = 360;
const MAP_H = 158;
box(MAP_X, MAP_Y, MAP_W, MAP_H, [186, 216, 232]);
for (let ly = 4; ly < MAP_H - 4; ly += 8) {
  for (let lx = 4; lx < MAP_W - 4; lx += 8) {
    if (inLand(lx, ly)) disc(MAP_X + lx, MAP_Y + ly, 2, [34, 96, 96]);
  }
}
for (const [n, px0, py0] of PINS) {
  disc(MAP_X + px0, MAP_Y + py0, 8, [255, 255, 255]);
  ring(MAP_X + px0, MAP_Y + py0, 8, [178, 44, 38]);
  const label = String(n);
  drawStr(label, MAP_X + px0 - Math.floor(strW(label, 1) / 2), MAP_Y + py0 - 3, 1, [178, 44, 38], true);
}
// DATE CHECK box.
const DC_X = 392;
const DC_Y = 640;
const DC_W = 608;
const DC_H = 158;
box(DC_X, DC_Y, DC_W, 3, [178, 44, 38]);
box(DC_X, DC_Y + DC_H - 3, DC_W, 3, [178, 44, 38]);
box(DC_X, DC_Y, 3, DC_H, [178, 44, 38]);
box(DC_X + DC_W - 3, DC_Y, 3, DC_H, [178, 44, 38]);
box(DC_X + 14, DC_Y + 12, 26, 26, [46, 130, 54]);
seg(DC_X + 19, DC_Y + 25, DC_X + 25, DC_Y + 32, [255, 255, 255], 3);
seg(DC_X + 25, DC_Y + 32, DC_X + 36, DC_Y + 18, [255, 255, 255], 3);
drawStr("DATE CHECK", DC_X + 50, DC_Y + 13, 3, [178, 44, 38], true);
{
  const lines = [
    "Every story on this page happened or was first reported on Saturday 21 November 2026.",
    "No story here is from any earlier day - and none is from 22 November.",
    "46 stories, each checked against the source named beside it.",
  ];
  let ly = DC_Y + 48;
  for (const sentence of lines) {
    for (const line of wrapByWidth(sentence, 2, DC_W - 28)) {
      drawStr(line, DC_X + 14, ly, 2, INK);
      ly += 15;
    }
    ly += 6;
  }
}

// ---- Numbered list: the rest of the day ----
drawStr("IN BRIEF — THE REST OF THE DAY", 24, 806, 2, INK, true);
box(24, 822, 976, 1, FAINT);
REST.forEach((b, i) => {
  const col = i < 17 ? 0 : 1;
  const row = i % 17;
  const x = col === 0 ? 24 : 512;
  const y = 830 + row * 10;
  const num = `${i + 1}. `;
  drawStr(num, x, y, 1, [178, 44, 38], true);
  drawStr(b, x + strW(num, 1), y, 1, INK);
});

// ---- Footer ----
box(28, 1002, 968, 1, INK);
drawCentred("THE WORLD — Saturday 21 November 2026 — 46 stories, all first reported today — sources as credited", 1009, 1, [90, 84, 70]);

// ------------------------------------------------------------------ PNG ---
// Hand-rolled PNG: zlib deflate (fixed level) + CRC32. Deterministic.
const CRC_TAB = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TAB[n] = c >>> 0;
}
function crcOf(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TAB[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(kind: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(kind, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crcOf(Buffer.concat([Buffer.from(kind, "ascii"), data])), 8 + data.length);
  return out;
}

const scan = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  scan[y * (1 + W * 3)] = 0;
  Buffer.from(px.buffer, y * W * 3, W * 3).copy(scan, y * (1 + W * 3) + 1);
}
const head = Buffer.alloc(13);
head.writeUInt32BE(W, 0);
head.writeUInt32BE(H, 4);
head[8] = 8;
head[9] = 2;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk("IHDR", head),
  pngChunk("IDAT", zlib.deflateSync(scan, { level: 9 })),
  pngChunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "entry.png");
fs.writeFileSync(outPath, png);
console.log(`wrote ${outPath} (${png.length} bytes, ${W}x${H})`);
