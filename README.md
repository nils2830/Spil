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

Extras that keep it entertaining: XP and levels shared across all games, daily streaks, personal bests, confetti, sound effects (mutable), keyboard shortcuts and share buttons. Every Guess the Year event comes with a fun fact, and Krillion teaches real ocean depth zones on the way down.

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
```

## Adding content

- **New event:** add a line to one of the `events-*.js` files: `['Something happens', 1999, 'culture', '🎉', 'A fun fact.']`. Categories are `history`, `science`, `culture` and `sports`.
- **New prompt:** add an object to one of the `prompts-*.js` files. Order answers from most to least common; aliases go after `|`, for example `'United Kingdom|uk|britain'`. Optional `no` entries explain common wrong answers (for example spiders in "Name an insect").

Progress is saved in the visitor's browser (`localStorage`) only.
