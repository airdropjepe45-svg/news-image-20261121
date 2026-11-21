# THE WORLD — 21 November 2026

[![Bounty: news-image-20261121](https://make.fun/badge/bounty/news-image-20261121)](https://make.fun/bounty/news-image-20261121?ref=89fdt4kt)
[![Entry: airdropjepe45-svg/news-image-20261121](https://make.fun/badge/entry/airdropjepe45-svg/news-image-20261121)](https://make.fun/bounty/news-image-20261121?ref=89fdt4kt)
[![Made for make.fun](https://make.fun/badge/made-for-make-fun)](https://make.fun/bounty/news-image-20261121?ref=89fdt4kt)

A newspaper-style front page summing up world news of Saturday 21 November 2026.
Every story carries its source in the image itself (TBS, AFP, AP, WSJ, Reuters,
NBC, NYT, Straits Times, Jerusalem Post, ESPNcricinfo and more), and nothing in
the paper was invented: all 46 stories were first reported on 21 November 2026.

## Stories at a glance — the 14 main stories

1. Missiles aimed at Riyadh shot down
2. Russia strikes Ukraine with 148 drones
3. 6.7 quake shakes central Peru
4. COP31 talks run into overtime
5. AI rout wipes $4 trillion off Wall Street
6. Iran says it downed 58th US drone
7. Iran readies tanker convoy to test blockade
8. Vietnam speeds up land seizures
9. Zelensky: Crimea bridge 'will not stand'
10. Trump orders contractors to flag Congress probes
11. Iraqi troops enter militia stronghold
12. Singapore, China line up 20+ deals
13. Archimedes' screw shrunk to one molecule
14. Rahul century puts India on top

The 32 briefs below them cover the rest of the day — from the Haiti blast and
the Basra power-station fire to the U-17 World Cup, the CMA Awards and a
pancreatic-cancer pill trial.

## The image

`entry.png` (1024 × 1024) is a black-on-off-white newspaper page:

- Masthead **THE WORLD** with **Saturday 21 November 2026** prominent.
- **14 main stories**, each with a headline and a short deck, in two columns.
- **32 briefs**, one line each, in two compact columns.
- A footer line crediting the sources.

That is **46 stories in total, all first reported on 21 November 2026** — from the
missiles aimed at Riyadh and Russia's 148-drone strike on Ukraine, through the
6.7 quake in central Peru, the COP31 overtime talks and the $4 trillion AI rout
on Wall Street, to KL Rahul's century in Wellington.

## How it is made

The image is drawn entirely in code by `main.ts` (Node 22, standard library
only, no network). It embeds a small 5×7 bitmap font, lays out the masthead,
the 14 main stories and the 32 briefs, and encodes the PNG itself with
`node:zlib` (deflate) and a hand-rolled CRC32 — so the output is deterministic:
no timestamps, no randomness.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Running it twice produces a byte-identical `out/entry.png`.

## Verify

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
sha256sum out/entry.png
```

Expected: a 1024 × 1024 PNG of 34,452 bytes, SHA-256
`3606d070369013c129bfab047009074f1ef3dcbe9b3c91aef8dd4b41dc663b26`.
The build also runs a fit check first and prints `fitOk=true` only when every
headline fits in two lines, every deck in three, and every brief in one line —
two decks (the Trump contractor order and the Singapore–China meeting) were
shortened during the build so that nothing overflows or clips.

## License

MIT — see [LICENSE](LICENSE).
