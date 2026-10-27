# The Skyfools

Independent café concept, researched against The Lovefools in Bandra. React 19, Vite, Tailwind CSS 4 and Motion for React.

## Run

`npm install`, then `npm run dev`. Production: `npm run build`.

## Content

- Edit `src/data.js` for the 15 researched menu names, public listing prices, source links and review summaries.
- All 300 original JPEG frames from the latest supplied archive are retained unchanged in `public/frames`, numbered 001–300.
- The canvas follows scroll position directly, draws the nearest loaded frame, preloads adjacent frames, and keeps a bounded decoded-image cache. It uses contain scaling to preserve the complete 16:9 frame, including letterboxing on portrait screens.
- Reduced motion disables automatic carousel/review motion and uses a still hero.
- Native dialog provides focus trapping, Escape dismissal and restored focus; backdrop clicks also close it.
- Menu imagery now uses licensed real photography, clearly labelled illustrative and not actual Lovefools dishes. Photo metadata and licensing links live in src/photos.js. Gallery and story use clearly labelled supplied concept artwork. No unlicensed restaurant photos or official branding are reproduced.
- Prices are directory list prices researched 24 October 2026, not confirmed live dine-in quotes. Recipe/allergen details are unavailable. Opening hours conflict across sources; the visit section directs visitors to call.
- Source links and full research/asset disclosures are available in the website footer and item dialogs.

## Validation

Production build passed. Browser checks covered scroll frame movement, desktop layout, menu filtering, product modal opening, Escape dismissal, gallery lightbox and a 390px-wide responsive layout. Map and outgoing third-party destinations remain dependent on external services.

## Revised experience
The hero uses a 1100svh desktop / 950svh mobile scroll journey, revealing the left-aligned name only after frame 300. The last 12% holds the final frame. Canvas playback renders at device-pixel resolution (capped at 2.5× on mobile), uses the sharp frame whenever available, and falls back to a nearby sprite sheet during a fast seek. Mobile sharp frames are 1440×810 WebP copies of the supplied original JPGs; mobile sprite tiles are 480×270. Only nearby sheets load, and decoded mobile caches are bounded to 7 sheets and 12 sharp frames for memory control. Desktop sharp frames use the original 1920×1080 JPGs. Run `python scripts/import-walkthrough.py path/to/frames.zip`, then `python scripts/optimize-frames.py --mobile`, `python scripts/build-sprites.py`, and `python scripts/build-sprites.py --mobile` to regenerate the hero assets. Fifteen distinct sourced review summaries move in an accessible, pausable horizontal carousel.

