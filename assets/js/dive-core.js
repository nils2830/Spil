/* Krillion & Noillirk engine: prompt data, scoring, ocean scene, menu and results. */
(function () {
  'use strict';
  const S = window.Spil;
  const { h, $ } = S;
  const D = (window.Dive = { modes: {} });

  D.THEMES = [
    ['all', 'Everything', '🌍'],
    ['geo', 'Geography', '🗺️'],
    ['nature', 'Nature', '🐾'],
    ['food', 'Food & Drink', '🍕'],
    ['pop', 'Pop Culture', '🎮'],
    ['science', 'Science', '🔬'],
    ['life', 'Everyday Life', '🏠'],
  ];
  D.THEME_NAME = Object.fromEntries(D.THEMES.map(([id, name]) => [id, name]));

  // Answers are listed from most to least common. Duplicates are dropped and a matcher is built per prompt.
  D.PROMPTS = window.SPIL_PROMPTS.map((p, id) => {
    const seen = new Set();
    const answers = [];
    p.a.forEach((raw) => {
      const k = S.norm(raw.split('|')[0]);
      if (!seen.has(k)) {
        seen.add(k);
        answers.push(raw);
      }
    });
    const no = {};
    Object.entries(p.no || {}).forEach(([k, v]) => (no[S.norm(k)] = v));
    return { id, q: p.q, theme: p.theme, answers, names: answers.map((a) => a.split('|')[0]), match: S.makeMatcher(answers), no };
  });

  // ---------- Scoring ----------
  const DOWN_TIERS = [
    { name: 'Plankton', pts: 10, emoji: '🦠', color: '#9be7ff', upTo: 0.12, air: 3 },
    { name: 'Schooler', pts: 30, emoji: '🐟', color: '#5cc8ff', upTo: 0.3, air: 5 },
    { name: 'Rare', pts: 60, emoji: '🐠', color: '#a5b4fc', upTo: 0.55, air: 7 },
    { name: 'Deep Cut', pts: 85, emoji: '🐙', color: '#d8a8ff', upTo: 0.8, air: 9 },
    { name: 'One in a Krillion', pts: 100, emoji: '🦐', color: '#ff8fcf', upTo: 1.01, air: 12 },
  ];
  const UP_TIERS = [
    { name: 'Hive Mind', emoji: '🧠', color: '#ffd76a', maxRank: 0 },
    { name: 'Crowd Pleaser', emoji: '🎉', color: '#ffc94d', maxRank: 2 },
    { name: 'Mainstream', emoji: '🌊', color: '#8fd3ff', maxRank: 9 },
    { name: 'Off the Path', emoji: '🐚', color: '#c7b8ff', maxRank: 19 },
    { name: 'Lone Wolf', emoji: '🐺', color: '#ff9aa8', maxRank: Infinity },
  ];
  const UP_POINTS = [100, 85, 72, 61, 52, 44, 37, 31, 26, 22];

  D.GAMES = {
    krillion: {
      id: 'krillion', name: 'Krillion', logo: ['Kril', 'lion'], dir: 'down', diver: '🤿',
      seconds: 25, rounds: 7, start: 0,
      tag: 'Name the answer nobody else would think of. The rarer it is, the deeper you dive.',
      goal: '🦐 Go rare: obscure answers dive deeper',
      tiers: DOWN_TIERS,
      score(rank, n) {
        const p = rank / n;
        const tier = rank < 2 ? DOWN_TIERS[0] : DOWN_TIERS.find((t) => p < t.upTo);
        return { pts: tier.pts, tier };
      },
      sister: { href: '../noillirk/', name: 'Noillirk', text: 'Krillion backwards: say the most obvious answer and float to the surface.' },
    },
    noillirk: {
      id: 'noillirk', name: 'Noillirk', logo: ['Noil', 'lirk'], dir: 'up', diver: '🎈',
      seconds: 20, rounds: 7, start: 7000,
      tag: 'Krillion, flipped. Think like everyone else: the most common answer floats you up from the deep.',
      goal: '👥 Go obvious: think like the crowd',
      tiers: UP_TIERS,
      score(rank) {
        const pts = rank < UP_POINTS.length ? UP_POINTS[rank] : rank < 20 ? 12 : rank < 40 ? 6 : 2;
        const tier = UP_TIERS.find((t) => rank <= t.maxRank);
        return { pts, tier };
      },
      sister: { href: '../krillion/', name: 'Krillion', text: 'The original dive: the rarer your answer, the deeper you go.' },
    },
  };

  // ---------- Ocean zones (real oceanography, a little learning on the way down) ----------
  D.ZONES = [
    { min: 0, name: 'Sunlight Zone', fact: 'Sunlight reaches down to about 200 m. Almost all ocean plants and algae live here.' },
    { min: 200, name: 'Twilight Zone', fact: 'Light fades fast below 200 m. Many animals here make their own light: bioluminescence.' },
    { min: 1000, name: 'Midnight Zone', fact: 'Below 1,000 m it is pitch black, and the water pressure is over 100 times what you feel at the surface.' },
    { min: 4000, name: 'Abyssal Zone', fact: 'From 4,000 m, near-freezing water covers the abyssal plains, which make up most of the ocean floor.' },
    { min: 6000, name: 'Hadal Zone', fact: 'Below 6,000 m are the deep trenches. The deepest point, Challenger Deep, is nearly 11,000 m down.' },
  ];
  D.zoneAt = (depth) => D.ZONES.filter((z) => depth >= z.min).pop();

  D.fmtM = (m) => Math.round(m).toLocaleString('en-US') + ' m';

  // ---------- Scene ----------
  D.buildScene = function (game) {
    const ocean = h('div', { class: 'ocean', 'aria-hidden': 'true' },
      h('div', { class: 'ocean-mid' }),
      h('div', { class: 'ocean-light' }),
      game.dir === 'up' ? h('div', { class: 'ocean-sky' }) : null,
      h('div', { class: 'rays' })
    );
    for (let i = 0; i < 14; i++) {
      const size = 6 + Math.random() * 18;
      ocean.append(h('span', {
        class: 'bubble',
        style: { left: Math.random() * 100 + '%', width: size + 'px', height: size + 'px', animationDuration: 8 + Math.random() * 12 + 's', animationDelay: -Math.random() * 20 + 's', '--drift': (Math.random() - 0.5) * 80 + 'px' },
      }));
    }
    const glows = h('div', { class: 'glows' });
    for (let i = 0; i < 18; i++) {
      glows.append(h('span', { class: 'glow', style: { left: Math.random() * 100 + '%', top: 20 + Math.random() * 75 + '%', animationDelay: -Math.random() * 3 + 's' } }));
    }
    ocean.append(glows);
    document.body.prepend(ocean);

    const fill = h('div', { class: 'gauge-fill' });
    const diver = h('div', { class: 'gauge-diver' }, game.diver);
    const ticks = h('div');
    const gauge = h('div', { class: 'gauge', 'aria-hidden': 'true' }, h('div', { class: 'gauge-track' }, fill), ticks, diver);
    document.body.append(gauge);
    D.scene = { ocean, fill, diver, ticks, max: 0, game };
    D.setGaugeMax(7000);
    D.setDepth(game.start);
  };

  D.setGaugeMax = function (max) {
    const sc = D.scene;
    if (!sc || sc.max === max) return;
    sc.max = max;
    sc.ticks.innerHTML = '';
    const step = max > 9000 ? 2000 : 1000;
    for (let m = 0; m <= max; m += step) sc.ticks.append(h('span', { class: 'gauge-tick', style: { top: (m / max) * 100 + '%' } }, m.toLocaleString('en-US') + ' m'));
  };

  // depth: metres below the surface
  D.setDepth = function (depth) {
    const sc = D.scene;
    if (!sc) return;
    if (sc.game.dir === 'down' && depth > sc.max - 500) D.setGaugeMax(Math.ceil((depth + 1500) / 1000) * 1000);
    const frac = S.clamp(depth / sc.max, 0, 1);
    sc.diver.style.top = frac * 100 + '%';
    if (sc.game.dir === 'down') {
      sc.fill.style.top = '0';
      sc.fill.style.height = frac * 100 + '%';
    } else {
      sc.fill.style.top = frac * 100 + '%';
      sc.fill.style.height = (1 - frac) * 100 + '%';
    }
    const q = (sel) => sc.ocean.querySelector(sel);
    q('.ocean-light').style.opacity = S.clamp(1 - depth / 1100, 0, 1);
    q('.ocean-mid').style.opacity = S.clamp(1 - (depth - 900) / 3200, 0, 1);
    q('.rays').style.opacity = S.clamp(1 - depth / 500, 0, 1);
    const sky = q('.ocean-sky');
    if (sky) sky.style.opacity = S.clamp(1 - depth / 250, 0, 1);
    q('.glows').style.opacity = S.clamp((depth - 500) / 1500, 0, 1);
  };

  // ---------- Prompt selection ----------
  D.pickPrompts = function (count, opts = {}) {
    let pool = D.PROMPTS;
    if (opts.theme && opts.theme !== 'all') pool = pool.filter((p) => p.theme === opts.theme);
    if (opts.seed) return S.shuffle(D.PROMPTS, S.rng(opts.seed)).slice(0, count);
    const key = 'dive:recent';
    const recent = new Set(S.store.get(key, []));
    const shuffled = S.shuffle(pool);
    const order = shuffled.filter((p) => !recent.has(p.id)).concat(shuffled.filter((p) => recent.has(p.id)));
    const picked = [];
    while (picked.length < count) picked.push(order[picked.length % order.length]);
    S.store.set(key, S.store.get(key, []).concat(picked.map((p) => p.id)).slice(-30));
    return picked;
  };

  // ---------- Shared prompt card with typed answers ----------
  // opts: {game, prompt, seconds, label, used:Set, onValid(match), onTimeout(), extraButtons:[node]}
  D.promptCard = function (opts) {
    const { prompt } = opts;
    const input = h('input', { class: 'answer-input', type: 'text', placeholder: 'Type an answer…', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'go', 'aria-label': 'Your answer' });
    const go = h('button', { class: 'btn', type: 'submit' }, 'Go');
    const note = h('div', { class: 'input-note', 'aria-live': 'polite' });
    const fill = opts.seconds ? h('div', { class: 'ptimer-fill' }) : null;
    const secs = h('b');
    let done = false;
    let timer = null;

    const form = h('form', { class: 'answer-row', onsubmit: (e) => { e.preventDefault(); submit(); } }, input, go);
    const card = h('div', { class: 'prompt-card card' },
      h('div', { class: 'prompt-theme' }, (opts.label ? opts.label + ' · ' : '') + D.THEME_NAME[prompt.theme]),
      h('h2', { class: 'prompt-q' }, prompt.q),
      h('div', { class: 'prompt-goal' }, opts.game.goal),
      fill ? h('div', { class: 'ptimer' }, fill) : null,
      form,
      note,
      opts.extraButtons ? h('div', { class: 'btn-row', style: { marginTop: '10px' } }, opts.extraButtons) : null
    );

    function flash(msg, info) {
      note.textContent = msg;
      note.className = 'input-note' + (info ? ' info' : '');
      S.restartAnim(form, 'shake');
      S.sound.play('meh');
      input.select();
    }

    function submit() {
      if (done) return;
      const text = input.value.trim();
      if (!text) return input.focus();
      const nk = S.norm(text);
      if (prompt.no[nk]) return flash('🙅 ' + prompt.no[nk], true);
      const m = prompt.match(text);
      if (!m) return flash('🤔 “' + text + '” is not on our list. Try another!');
      if (opts.used && opts.used.has(m.i)) return flash('🔁 You already said ' + m.name + '!', true);
      note.textContent = '';
      note.className = 'input-note';
      const keep = opts.onValid(m, text);
      if (keep === 'keep') {
        input.value = '';
        input.focus();
        return;
      }
      api.lock();
    }

    if (opts.seconds) {
      let lastWhole = opts.seconds;
      timer = S.timer(opts.seconds, (left, frac) => {
        fill.style.transform = 'scaleX(' + frac + ')';
        fill.classList.toggle('low', left <= 5);
        secs.textContent = Math.ceil(left);
        const whole = Math.ceil(left);
        if (whole !== lastWhole) {
          lastWhole = whole;
          if (whole <= 5 && whole > 0) S.sound.play('tick');
        }
      }, () => {
        if (done) return;
        api.lock();
        opts.onTimeout && opts.onTimeout();
      });
    }

    const api = {
      el: card, input, note, secs,
      lock() {
        done = true;
        input.disabled = true;
        go.disabled = true;
        if (timer) timer.stop();
      },
      stop() {
        if (timer) timer.stop();
      },
      focus() {
        setTimeout(() => input.focus({ preventScroll: true }), 60);
      },
      get left() {
        return timer ? timer.left : 0;
      },
    };
    return api;
  };

  // ---------- Screens ----------
  D.main = () => $('#main');
  D.show = function (...nodes) {
    if (D.cleanup) {
      D.cleanup();
      D.cleanup = null;
    }
    const main = D.main();
    main.innerHTML = '';
    main.append(h('div', { class: 'screen' }, nodes));
    window.scrollTo(0, 0);
  };

  D.go = function (mode) {
    const url = new URL(location.href);
    url.searchParams.set('mode', mode);
    history.replaceState(null, '', url);
    D.modes[mode].start();
  };

  D.menu = function () {
    const g = D.game;
    history.replaceState(null, '', location.pathname);
    D.setDepth(g.start);
    const themeKey = g.id + ':theme';
    let theme = S.store.get(themeKey, 'all');
    const chips = h('div', { class: 'chips' });
    const paintChips = () => {
      chips.innerHTML = '';
      D.THEMES.forEach(([id, name, emoji]) => chips.append(h('button', {
        class: 'chip', 'aria-pressed': String(theme === id),
        onclick: () => { theme = id; S.store.set(themeKey, id); S.sound.play('click'); paintChips(); },
      }, emoji + ' ' + name)));
    };
    paintChips();

    const grid = h('div', { class: 'mode-grid' });
    g.modeList.forEach((id) => {
      const m = D.modes[id];
      const best = m.bestKey ? S.best.get(m.bestKey) : null;
      const daily = id === 'daily' ? S.daily.get(g.id) : null;
      grid.append(h('button', { class: 'mode-card', onclick: () => D.go(id) },
        id === 'daily' ? h('span', { class: 'badge' + (daily ? ' done' : '') }, daily ? '✓ DONE' : 'NEW TODAY') : null,
        h('div', { class: 'mode-emoji' }, m.emoji),
        h('div', { class: 'mode-name' }, m.name + (id === 'daily' ? ' #' + S.dayNumber() : '')),
        h('div', { class: 'mode-desc' }, m.desc),
        daily ? h('div', { class: 'mode-best' }, 'TODAY: ' + D.fmtM(daily.score)) : best != null ? h('div', { class: 'mode-best' }, '🏅 BEST ' + best.toLocaleString('en-US') + ' ' + m.unit) : null
      ));
    });

    const legend = h('div', { class: 'tier-legend' });
    if (g.dir === 'down') {
      g.tiers.forEach((t) => legend.append(h('div', { class: 'tier-row', style: { '--tier': t.color } },
        h('span', { class: 't-emoji' }, t.emoji), h('span', { class: 't-name' }, t.name), h('span', { class: 't-pts' }, t.pts + ' pts · ' + t.pts * 10 + ' m'))));
    } else {
      [['🧠', 'Hive Mind', 'The #1 answer', '100 pts'], ['🎉', 'Crowd Pleaser', '#2 to #3', '85 / 72 pts'], ['🌊', 'Mainstream', '#4 to #10', '61 to 22 pts'], ['🐚', 'Off the Path', '#11 to #20', '12 pts'], ['🐺', 'Lone Wolf', 'Everything rarer', '6 or 2 pts']]
        .forEach(([e, n, d, p]) => legend.append(h('div', { class: 'tier-row' }, h('span', { class: 't-emoji' }, e), h('span', { class: 't-name' }, n, h('small', { class: 'muted', style: { display: 'block', fontWeight: 700 } }, d)), h('span', { class: 't-pts' }, p))));
    }

    const how = g.dir === 'down'
      ? [['✍️', 'Each round gives you a prompt like “Name a fruit”. Type one answer before time runs out.'], ['🦐', 'Common answers barely get you wet. Rare but valid answers send you deep: up to 100 points.'], ['📏', 'Every point is 10 m. Seven perfect answers reach 7,000 m, deep in the Hadal Zone.']]
      : [['✍️', 'Each round gives you a prompt like “Name a fruit”. Type one answer before time runs out.'], ['👥', 'Guess what most people would say. The #1 answer scores 100 points; weird answers score almost nothing.'], ['🎈', 'You start 7,000 m down. Every point floats you 10 m up. Seven perfect answers break the surface!']];

    D.show(
      h('div', { class: 'dive-hero' },
        h('div', { class: 'dive-logo' }, g.logo[0], h('span', { class: 'accent' }, g.logo[1])),
        h('p', { class: 'dive-tag' }, g.tag)
      ),
      h('div', { class: 'how card' }, how.map(([e, t]) => h('div', { class: 'how-step' }, h('span', null, e), h('span', null, t)))),
      grid,
      h('h3', { class: 'section-title' }, 'Theme for Endless & practice'),
      chips,
      h('h3', { class: 'section-title' }, g.dir === 'down' ? 'Rarity tiers' : 'Scoring'),
      legend,
      h('a', { class: 'mode-card', href: g.sister.href, style: { marginTop: '26px', textDecoration: 'none' } },
        h('div', { class: 'mode-name' }, 'Try ' + g.sister.name + ' →'),
        h('div', { class: 'mode-desc' }, g.sister.text)
      ),
      h('p', { class: 'footer-note' }, D.PROMPTS.length + ' prompts · ' + D.PROMPTS.reduce((n, p) => n + p.answers.length, 0).toLocaleString('en-US') + ' accepted answers. Popularity is our best estimate of what most people say.')
    );
  };

  D.theme = () => S.store.get(D.game.id + ':theme', 'all');

  // opts: {mode, emoji, title, score, unitLabel, bestKey, xp, stats, grid, share, recap, again, againLabel, extra, celebrate}
  D.results = function (opts) {
    const scoreEl = h('div', { class: 'big-score' }, '0');
    const res = opts.bestKey ? S.best.submit(opts.bestKey, opts.score) : { isNew: false, prev: null };
    S.profile.addXP(opts.xp);
    const again = h('button', { class: 'btn', onclick: () => (opts.again ? opts.again() : D.modes[opts.mode].start()) }, opts.againLabel || '↻ Dive again');
    D.show(h('div', { class: 'dive-results card' },
      h('div', { class: 'rank-emoji pop' }, opts.emoji),
      h('div', null, h('div', { class: 'kicker' }, D.game.name + ' · ' + D.modes[opts.mode].name), h('h2', { class: 'result-title' }, opts.title)),
      h('div', null, scoreEl, h('div', { class: 'muted', style: { fontWeight: 800 } }, opts.unitLabel)),
      res.isNew ? h('div', null, h('span', { class: 'new-best' }, '🏅 New personal best!')) : null,
      opts.grid ? h('div', { class: 'emoji-grid' }, opts.grid) : null,
      opts.extra || null,
      opts.stats ? h('div', { class: 'stat-row' }, opts.stats.map(([v, l]) => h('div', { class: 'stat' }, h('b', null, v), h('span', null, l)))) : null,
      h('div', { class: 'stat-row' }, h('div', { class: 'stat' }, h('b', null, '+' + Math.round(opts.xp)), h('span', null, 'XP earned'))),
      h('div', { class: 'btn-row' },
        again,
        opts.share ? h('button', { class: 'btn ghost', onclick: () => S.share(opts.share) }, '📤 Share') : null,
        h('button', { class: 'btn ghost', onclick: () => D.menu() }, '☰ Menu')
      ),
      opts.recap ? h('div', null, h('div', { class: 'kicker', style: { marginBottom: '8px' } }, 'Your answers'), opts.recap) : null
    ));
    S.countUp(scoreEl, opts.score, 1200, 0, opts.fmt);
    if (res.isNew || opts.celebrate) {
      setTimeout(() => S.confetti(), 300);
      S.sound.play('win');
    } else S.sound.play('good');
  };

  D.recapList = function (rows) {
    return h('div', { class: 'answers-recap' }, rows.map((r) => h('div', { class: 'ar' },
      h('span', { style: { fontSize: '22px' } }, r.emoji),
      h('span', { class: 'ar-q' }, r.q, h('small', null, r.answer)),
      h('span', { class: 'ar-pts' }, r.pts)
    )));
  };

  D.boot = function (gameId) {
    D.game = D.GAMES[gameId];
    D.game.modeList = gameId === 'krillion' ? ['daily', 'endless', 'infinite'] : ['daily', 'endless', 'board'];
    document.body.classList.add('dive-page', gameId);
    S.mountTopbar({ home: '../', back: true, title: D.game.name });
    D.buildScene(D.game);
    const mode = S.param('mode');
    if (mode && D.game.modeList.includes(mode)) D.modes[mode].start();
    else D.menu();
  };
})();
