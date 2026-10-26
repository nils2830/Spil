# spil.

A neal.fun-style collection of quick, replayable browser games. Pure HTML, CSS and JavaScript: no build step, no dependencies, no server. It runs straight from GitHub Pages.

## Games

| Game | What you do |
| --- | --- |
| **Guess the Year: Classic** | 10 events. Slide to the year; the closer you are, the more points (max 1,000 per event). |
| **Daily Five** | The same 5 events for everyone today, with a shareable emoji result. |
| **Timeline** | Slot each event into a growing timeline. Three mistakes and you are out. |
| **Before or After?** | Higher/lower with history. Keep the streak alive. |
| **Decade Blitz** | 60 seconds, pick the right decade, combos multiply your points. |
| **Time Budget** | You have 100 years of wrongness to spend. Every miss costs years. |
| **Deep Time / Pop Culture Years** | Guess the Year for 1000–1899, or only movies, games and music. |
| **Krillion** | Name the answer nobody else would. Rare answers dive deeper (Daily, Endless, Air Supply). |
| **Noillirk** | Krillion flipped. Name what everyone would say and float up to the surface (Daily, Endless, Survey Board). |

Extras that keep it entertaining: real photos on every card, XP and levels shared across all games, daily streaks, personal bests, confetti, sound effects (mutable), keyboard shortcuts and share buttons. Every Guess the Year event comes with a fun fact, and Krillion teaches real ocean depth zones (with photos of the creatures that live there) on the way down.

## Photos

Photos are loaded live in the visitor's browser from the [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page) and [Wikimedia Commons](https://commons.wikimedia.org/). Only free-licensed lead images are used (the [PageImages](https://www.mediawiki.org/wiki/Extension:PageImages) API returns free images by default), and each big photo shows its author and license with a link to the file page. Lookups are batched and cached in the browser for three weeks. If Wikipedia can't be reached, the games fall back to emoji artwork and keep working.

## Put it online with GitHub Pages

1. Merge this branch into `main` (or skip this and pick this branch in step 3).
2. On GitHub, open the repository and go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose the branch (`main`) and the folder **/ (root)**, then click **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/Spil/`.

The `.nojekyll` file tells GitHub Pages to serve the files as they are. All links are relative, so the site works under the `/Spil/` sub-path or on a custom domain.

## Run it locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project layout

```
index.html                 Home page (game wall, dailies, profile)
year/index.html            Guess the Year (all six modes)
krillion/index.html        Krillion
noillirk/index.html        Noillirk
assets/css/                base.css (shared), home.css, year.css, dive.css
assets/js/core.js          Shared helpers: storage, seeded RNG, sound, confetti, XP, answer matching
assets/js/year/            Guess the Year modes
assets/js/dive-*.js        Krillion/Noillirk engine and modes
assets/js/data/events-*.js Historical events: [event, year, category, emoji, fun fact]
assets/js/data/prompts-*.js Krillion/Noillirk prompts with answers ordered from most to least common
assets/js/data/prompt-meta.js Header photo + search hint per prompt (used to find a photo of each answer)
assets/js/wiki.js          Photo loader: Wikipedia/Commons lookups, search, credits, caching
claude-reels/              Separate Chrome extension, see below
```

## Adding content

- **New event:** add a line to one of the `events-*.js` files: `['Something happens', 1999, 'culture', '🎉', 'A fun fact.', "Wikipedia article|Fallback article"]`. Categories are `history`, `science`, `culture` and `sports`. The last field lists Wikipedia article titles; the first one with a free lead image is used as the photo.
- **New prompt:** add an object to one of the `prompts-*.js` files. Order answers from most to least common; aliases go after `|`, for example `'United Kingdom|uk|britain'`. Optional `no` entries explain common wrong answers (for example spiders in "Name an insect").

Progress is saved in the visitor's browser (`localStorage`) only.

## Extra: Reels mens Claude tænker

`claude-reels/` is a small, separate Chrome extension (not part of the website): it opens Instagram Reels while Claude on claude.ai is working and closes it again, back on the Claude tab, the moment Claude is done. Install steps and settings are in [claude-reels/README.md](claude-reels/README.md) (Danish).
