# Session card art

Generated at build time, saved as files, served static from `/art/`. The site never calls the image service.

Source: Azure gpt-image-2, 1024x1024 PNG, downscaled to WebP (quality 82) at 512px and 256px. All picks read at 120px (see `qa/mock-home/`).

| file | size | bytes |
|---|---|---|
| session-birthday-256.webp | 256x256 | 5266 |
| session-birthday-512.webp | 512x512 | 15456 |
| session-coin-streak-256.webp | 256x256 | 4546 |
| session-coin-streak-512.webp | 512x512 | 11366 |
| session-positive-test-256.webp | 256x256 | 7962 |
| session-positive-test-512.webp | 512x512 | 19860 |

Use the 256px file for cards up to ~128px CSS wide, the 512px one above that. Decorative: `alt=""`.

## Prompts

### session-birthday

A small calendar month drawn as a grid of about thirty round dots in pencil grey (one dot per day, no numbers). Two of the dots are filled solid navy ink and joined by one smooth curved navy line; a soft marker-yellow highlighter swash sits behind that connecting line. Flat minimal notebook illustration on off-white paper (#fbf8f1) with a very faint light grey graph-paper grid. Palette strictly limited to: dark navy ink (#1b2340) for solid lines and filled shapes, medium warm pencil grey (#85827a) for dashed or light outlines, and ONE bright marker yellow (#ffd84d) highlight used like a highlighter pen. Bold simple shapes with thick clean strokes so it reads as a tiny icon at 120 pixels. Lots of empty white space, centered, square composition, the subject fills about 70 percent of the frame. Absolutely no text, no letters, no numbers, no words, no logos, no people, no faces, no hands, no gradients, no orange, no purple, no glossy 3D, no drop shadows.

### session-coin-streak

Two staggered horizontal rows of large flat round coins, seven coins per row, spanning the full width of the frame. Most coins are simple thick pencil-grey circle outlines. In the top row, a run of four consecutive coins is filled solid navy ink with a small white star on each, and a wide marker-yellow highlighter band sits behind exactly those four coins. Flat minimal notebook illustration on off-white paper (#fbf8f1) with a very faint light grey graph-paper grid. Palette strictly limited to: dark navy ink (#1b2340) for solid lines and filled shapes, medium warm pencil grey (#85827a) for dashed or light outlines, and ONE bright marker yellow (#ffd84d) highlight used like a highlighter pen. Bold simple shapes with thick clean strokes so it reads as a tiny icon at 120 pixels. Lots of empty white space, centered, square composition, the subject fills about 70 percent of the frame. Absolutely no text, no letters, no numbers, no words, no logos, no people, no faces, no hands, no gradients, no orange, no purple, no glossy 3D, no drop shadows.

### session-positive-test

A square grid of thirty-six large round dots in six rows of six (a crowd), drawn as thick hollow pencil-grey circles, spanning most of the frame. In the bottom left corner, two adjacent dots are filled solid navy ink and a thick marker-yellow highlighter blob sits behind just those two dots. Flat minimal notebook illustration on off-white paper (#fbf8f1) with a very faint light grey graph-paper grid. Palette strictly limited to: dark navy ink (#1b2340) for solid lines and filled shapes, medium warm pencil grey (#85827a) for dashed or light outlines, and ONE bright marker yellow (#ffd84d) highlight used like a highlighter pen. Bold simple shapes with thick clean strokes so it reads as a tiny icon at 120 pixels. Lots of empty white space, centered, square composition, the subject fills about 70 percent of the frame. Absolutely no text, no letters, no numbers, no words, no logos, no people, no faces, no hands, no gradients, no orange, no purple, no glossy 3D, no drop shadows.

## Generation log (this pass)

5 images: one first pass per session, then one retry each for coin streak and positive test (first passes had shapes too thin to read at 120px: 6 coins in a thin row, ~80 tiny dots). Birthday first pass kept.
