# THE WORLD — 21 November 2026

[![make.fun · news-image-20261121](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/airdropjepe45-svg/news-image-20261121/rank.svg)](https://make.fun/bounty/news-image-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/airdropjepe45-svg/news-image-20261121/reward.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)

A newspaper-style front page summing up world news of Saturday 21 November 2026.
Every story carries its source in the image itself (TBS, AFP, AP, WSJ, Reuters,
NBC, NYT, Straits Times, Jerusalem Post, ESPNcricinfo and more), and nothing in
the paper was invented: all 46 stories were first reported on 21 November 2026.

## Stories at a glance — the 3 top stories

1. Missiles aimed at Riyadh shot down
2. Russia strikes Ukraine with 148 drones
3. 6.7 quake shakes central Peru

Then 10 mid stories with small illustrations — COP31 overtime, the $4 trillion
AI rout, the two Iran items, Vietnam land seizures, Zelensky on the Crimea
bridge, Iraqi troops in Jurf al-Sakhar, Singapore–China deals, the
one-molecule Archimedes' screw and KL Rahul's century — and 33 numbered
stories in the list at the foot of the page, ten of them pinned on the
world map.

## The image

`entry.png` (1024 × 1024) is an illustrated newspaper front page in colour:

- Masthead **THE WORLD** with **Saturday 21 November 2026** prominent, and
  a colour legend for the seven regions (Middle East, Europe, Asia-Pacific,
  Americas, Africa, World, Sport & Culture).
- **3 illustrated top stories** with flat vector-style scenes drawn in code:
  night sky and interceptor bursts over Riyadh, a drone swarm over Kyiv,
  cracked ground and a seismograph trace for the Peru quake.
- **10 mid stories**, each with a small icon, a headline and a one-line deck.
- **A dot-matrix world map** with ten numbered pins, and a numbered list
  carrying the remaining **33 stories**, one line each.
- A **DATE CHECK** box stating that every story on the page happened or was
  first reported on Saturday 21 November 2026, and none is from any earlier
  day or from 22 November.
- A footer line crediting the sources.

That is **46 stories in total, all first reported on 21 November 2026** — from the
missiles aimed at Riyadh and Russia's 148-drone strike on Ukraine, through the
6.7 quake in central Peru, the COP31 overtime talks and the $4 trillion AI rout
on Wall Street, to KL Rahul's century in Wellington.

## How it is made

The image is drawn entirely in code by `main.ts` (Node 22, standard library
only, no network). It embeds a small 5×7 bitmap font, draws the masthead, the
three illustrated scenes, the mid-story icons, the dot-matrix world map (land
as a union of ellipses) and the DATE CHECK box, and encodes the PNG itself
with `node:zlib` (deflate) and a hand-rolled CRC32 — so the output is
deterministic: no timestamps, no randomness.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Running it twice produces a byte-identical `out/entry.png`.

## Verify

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
sha256sum out/entry.png
```

Expected: a 1024 × 1024 PNG of 39,823 bytes, SHA-256
`0f01e6948e8b3aaff8df7ede38f0cbaf11884a19b4224ee8ccdfb241052bfdba`.
The build also runs a fit check first and prints `fitOk=true` only when every
top headline fits in two lines, every top deck in three, every mid headline
in two, every mid deck in one line, and every numbered story in one line —
several mid decks were shortened during the build so that nothing overflows
or clips. The Peru scene was reworked after a visual check (taller ground
band, bigger leaning houses, thicker cracks), and the tanker story got its
own ship icon instead of sharing the drone icon.

## License

MIT — see [LICENSE](LICENSE).
