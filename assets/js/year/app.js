/* Guess the Year: shared state, menu, event pools and results screen. */
(function () {
  'use strict';
  const S = window.Spil;
  const { h, $ } = S;
  const Y = (window.YearGame = { modes: {} });

  const THIS_YEAR = new Date().getFullYear();
  Y.EVENTS = window.SPIL_EVENTS.map(([text, year, cat, emoji, fact, img], id) => ({ id, text, year, cat, emoji, fact, img }));
  Y.CATS = [
    ['all', 'Everything', '🌍'],
    ['history', 'History', '🏛️'],
    ['science', 'Science & Tech', '🔬'],
    ['culture', 'Pop Culture', '🎬'],
    ['sports', 'Sports', '🏆'],
  ];
  Y.CAT_NAME = { history: 'History', science: 'Science & Tech', culture: 'Pop Culture', sports: 'Sports' };
  // `scale` controls how forgiving scoring is: wider eras are harder, so they forgive more.
  Y.ERAS = {
    modern: { min: 1900, max: THIS_YEAR, label: '1900 to today', scale: 7 },
    deep: { min: 1000, max: 1899, label: '1000 to 1899', scale: 22 },
    all: { min: 1000, max: THIS_YEAR, label: 'All of history', scale: 18 },
  };

  Y.settings = {
    cat: S.store.get('year:cat', 'all'),
    era: S.param('era') || S.store.get('year:era', 'modern'),
  };
  if (!Y.ERAS[Y.settings.era]) Y.settings.era = 'modern';
  const catParam = S.param('cat');
  if (catParam && Y.CAT_NAME[catParam]) Y.settings.cat = catParam;

  Y.era = () => Y.ERAS[Y.settings.era];

  // Events matching the current era + category. Falls back to "everything" in the era if too few.
  Y.pool = function (opts = {}) {
    const era = opts.era ? Y.ERAS[opts.era] : Y.era();
    const cat = opts.cat || Y.settings.cat;
    const inEra = Y.EVENTS.filter((e) => e.year >= era.min && e.year <= era.max);
    const byCat = cat === 'all' ? inEra : inEra.filter((e) => e.cat === cat);
    return byCat.length >= (opts.min || 12) ? byCat : inEra;
  };

  // Never show the same event twice in a short while, across games.
  const RECENT_KEY = 'year:recent';
  Y.freshOrder = function (pool) {
    const recent = new Set(S.store.get(RECENT_KEY, []));
    const shuffled = S.shuffle(pool);
    return shuffled.filter((e) => !recent.has(e.id)).concat(shuffled.filter((e) => recent.has(e.id)));
  };
  Y.markSeen = function (ev) {
    const recent = S.store.get(RECENT_KEY, []).filter((id) => id !== ev.id);
    recent.push(ev.id);
    S.store.set(RECENT_KEY, recent.slice(-140));
  };

  // Scoring for guessing modes.
  Y.points = (diff, scale) => (diff === 0 ? 1000 : Math.round(1000 * Math.exp(-diff / scale)));
  Y.grade = function (pts) {
    if (pts >= 750) return 'g';
    if (pts >= 400) return 'y';
    if (pts >= 100) return 'o';
    return 'r';
  };
  Y.GRADE_EMOJI = { g: '🟩', y: '🟨', o: '🟧', r: '🟥' };

  Y.main = () => $('#main');
  Y.show = function (...nodes) {
    const main = Y.main();
    if (Y.cleanup) {
      Y.cleanup();
      Y.cleanup = null;
    }
    main.innerHTML = '';
    const screen = h('div', { class: 'screen' }, nodes);
    main.append(screen);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    return screen;
  };

  // Full-bleed photo card. size: '' | 'compact' | 'mini'
  Y.eventCard = function (ev, extra, size) {
    return h('div', { class: 'event-card cat-' + ev.cat + (size ? ' ' + size : '') },
      S.wiki.photo(ev.img, { credit: true, alt: ev.text, fallback: ev.emoji }),
      h('div', { class: 'ev-shade' }),
      h('div', { class: 'ev-top' }, h('span', { class: 'ev-cat' }, ev.emoji + ' ' + Y.CAT_NAME[ev.cat])),
      h('div', { class: 'ev-body' }, h('h2', { class: 'ev-text' }, ev.text), extra || null)
    );
  };

  // Rubber-stamp the real year onto a photo card.
  Y.stamp = function (card, text, grade) {
    const old = card.querySelector('.stamp');
    if (old) old.remove();
    card.append(h('div', { class: 'stamp ' + (grade || '') }, text));
    S.restartAnim(card, 'thud');
  };

  // Look up photos for upcoming events in one batched request and warm the first images.
  Y.warm = function (events, count = 2) {
    events.forEach((ev, i) => (i < count ? S.wiki.preload(ev.img) : S.wiki.first(ev.img)));
  };

  Y.go = function (mode) {
    const url = new URL(location.href);
    url.searchParams.set('mode', mode);
    if (Y.settings.era !== 'modern') url.searchParams.set('era', Y.settings.era);
    else url.searchParams.delete('era');
    history.replaceState(null, '', url);
    Y.modes[mode].start();
  };

  Y.bestKey = (mode) => 'year:' + mode + (Y.settings.era !== 'modern' && mode !== 'daily' ? '-' + Y.settings.era : '');

  // ---------- Menu ----------
  const MODE_LIST = ['classic', 'daily', 'timeline', 'hilo', 'blitz', 'survival'];
  const MODE_IMG = {
    classic: 'Apollo 11',
    daily: 'Times Square|Newspaper',
    timeline: 'Prague astronomical clock',
    hilo: 'Fall of the Berlin Wall',
    blitz: 'Lightning',
    survival: 'Hourglass',
  };
  const DEEP_IMG = { classic: 'Bayeux Tapestry', timeline: 'Gutenberg Bible', hilo: 'Battle of Waterloo', blitz: 'Great Fire of London', survival: 'Black Death' };

  Y.menu = function () {
    history.replaceState(null, '', location.pathname);
    const catChips = h('div', { class: 'chips' });
    const paintCats = () => {
      catChips.innerHTML = '';
      Y.CATS.forEach(([id, label, emoji]) =>
        catChips.append(h('button', {
          class: 'chip', 'aria-pressed': String(Y.settings.cat === id),
          onclick: () => {
            Y.settings.cat = id;
            S.store.set('year:cat', id);
            S.sound.play('click');
            paintCats();
          },
        }, emoji + ' ' + label))
      );
    };
    paintCats();

    const eraToggle = h('div', { class: 'era-toggle', role: 'group', 'aria-label': 'Era' });
    const grid = h('div', { class: 'mode-grid' });
    const paintEra = () => {
      eraToggle.innerHTML = '';
      Object.entries(Y.ERAS).forEach(([id, era]) =>
        eraToggle.append(h('button', {
          'aria-pressed': String(Y.settings.era === id),
          onclick: () => {
            Y.settings.era = id;
            S.store.set('year:era', id);
            S.sound.play('click');
            paintEra();
            paintModes();
          },
        }, era.label))
      );
    };
    const paintModes = () => {
      grid.innerHTML = '';
      MODE_LIST.forEach((id) => {
        const m = Y.modes[id];
        const best = S.best.get(Y.bestKey(id));
        const daily = id === 'daily' ? S.daily.get('year') : null;
        const img = (Y.settings.era === 'deep' && DEEP_IMG[id]) || MODE_IMG[id];
        grid.append(h('button', { class: 'mode-card', onclick: () => Y.go(id) },
          S.wiki.photo(img, { alt: '' }),
          id === 'daily' ? h('span', { class: 'badge' + (daily ? ' done' : '') }, daily ? '✓ DONE' : 'NEW TODAY') : null,
          h('div', { class: 'mode-emoji' }, m.emoji),
          h('div', { class: 'mode-name' }, m.name),
          h('div', { class: 'mode-desc' }, m.desc),
          best != null ? h('div', { class: 'mode-best' }, '🏅 BEST ' + best.toLocaleString('en-US') + ' ' + m.unit) : null
        ));
      });
    };
    paintEra();
    paintModes();

    // Film strip of random real photos with their years
    const strip = S.shuffle(Y.EVENTS.filter((e) => e.year >= 1900)).slice(0, 10);
    // Two copies so the CSS marquee loops seamlessly.
    const frames = strip.concat(strip).map((e) => h('div', { class: 'film-frame' }, S.wiki.photo(e.img, { size: 330, fallback: e.emoji }), h('span', null, e.year)));
    const film = h('div', { class: 'filmstrip', 'aria-hidden': 'true' }, h('div', { class: 'film-track' }, frames));

    Y.show(
      h('div', { class: 'menu-head' },
        h('h1', null, h('span', { class: 'grad-text' }, 'Guess the Year')),
        h('p', null, 'Real photos, real moments. From moon landings to Mario: how well do you really know when things happened?')
      ),
      film,
      h('div', { class: 'menu-section' }, h('span', { class: 'kicker' }, 'Pick a mode'), grid),
      h('div', { class: 'menu-section center' }, h('span', { class: 'kicker' }, 'Era'), eraToggle),
      h('div', { class: 'menu-section' }, h('span', { class: 'kicker' }, 'Topics'), catChips),
      h('p', { class: 'footer-note' }, Y.EVENTS.length + ' events and counting. Every answer comes with a fun fact.')
    );
  };

  // ---------- Results ----------
  // opts: {emoji, title, subtitle, score, unit, mode, xp, stats:[[v,l]], recap: node, share: string, extra: node}
  Y.results = function (opts) {
    const scoreEl = h('div', { class: 'big-score' }, '0');
    const key = opts.bestKey || Y.bestKey(opts.mode);
    const { isNew, prev } = S.best.submit(key, opts.score);
    S.profile.addXP(opts.xp);

    const again = h('button', { class: 'btn', onclick: () => (opts.again ? opts.again() : Y.modes[opts.mode].start()) }, opts.againLabel || '↻ Play again');
    const card = h('div', { class: 'results card' },
      h('div', { class: 'rank-emoji pop' }, opts.emoji),
      h('div', null,
        h('div', { class: 'kicker' }, Y.modes[opts.mode].name + (Y.settings.era !== 'modern' && opts.mode !== 'daily' ? ' · ' + Y.era().label : '')),
        h('h2', { class: 'result-title' }, opts.title)
      ),
      h('div', null, scoreEl, h('div', { class: 'muted', style: { fontWeight: 800 } }, opts.unit)),
      isNew ? h('div', null, h('span', { class: 'new-best' }, '🏅 New personal best!')) : prev != null ? h('div', { class: 'muted' }, 'Personal best: ' + Math.max(prev, opts.score).toLocaleString('en-US')) : null,
      opts.subtitle ? h('p', { class: 'muted', style: { margin: 0, fontWeight: 700 } }, opts.subtitle) : null,
      opts.stats ? h('div', { class: 'stat-row' }, opts.stats.map(([v, l]) => h('div', { class: 'stat' }, h('b', null, v), h('span', null, l)))) : null,
      opts.extra || null,
      h('div', { class: 'stat-row' }, h('div', { class: 'stat' }, h('b', null, '+' + Math.round(opts.xp)), h('span', null, 'XP earned'))),
      h('div', { class: 'btn-row' },
        again,
        opts.share ? h('button', { class: 'btn ghost', onclick: () => S.share(opts.share) }, '📤 Share') : null,
        h('button', { class: 'btn ghost', onclick: () => Y.menu() }, '☰ Modes')
      ),
      opts.recap ? h('div', null, h('div', { class: 'kicker', style: { marginBottom: '8px' } }, 'Recap · learn something'), opts.recap) : null
    );
    Y.show(card);
    S.countUp(scoreEl, opts.score, 1100);
    if (isNew || opts.celebrate) {
      setTimeout(() => S.confetti(), 300);
      S.sound.play('win');
    } else S.sound.play('good');
    setTimeout(() => again.focus({ preventScroll: true }), 50);
  };

  // Photo mosaic recap. rows: [{ev, note, grade}]
  Y.recapList = function (rows) {
    return h('div', { class: 'mosaic' }, rows.map((r) =>
      h('div', { class: 'tile', title: r.ev.fact },
        S.wiki.photo(r.ev.img, { size: 500, fallback: r.ev.emoji }),
        r.note ? h('span', { class: 'tile-note ' + (r.grade || '') }, r.note) : null,
        h('div', { class: 'tile-year' }, r.ev.year),
        h('div', { class: 'tile-text' }, r.ev.text)
      )
    ));
  };

  Y.floatScore = function (text, x, y, minus) {
    const el = h('div', { class: 'float-score' + (minus ? ' minus' : ''), style: { left: x + 'px', top: y + 'px' } }, text);
    document.body.append(el);
    setTimeout(() => el.remove(), 950);
  };

  Y.boot = function () {
    S.mountTopbar({ home: '../', back: true, title: 'Guess the Year' });
    const mode = S.param('mode');
    if (mode && Y.modes[mode]) Y.modes[mode].start();
    else Y.menu();
  };
})();
