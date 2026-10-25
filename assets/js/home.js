/* Home page: hero teaser, fact ticker, dailies, featured banner, game wall and profile. */
(function () {
  'use strict';
  const S = window.Spil;
  const { h, $ } = S;

  // img: Wikipedia titles for the card photo. tint: overlay colours that give each game its identity.
  const GAMES = [
    {
      href: 'year/?mode=classic', title: 'Guess the Year', label: 'Guess the Year', emoji: '🕰️', img: 'Apollo 11',
      desc: 'A real photo, a moment in history. How close can you get to the year?', tags: ['history'],
      tint: 'rgba(120, 20, 60, 0.92)', tint2: 'rgba(255, 93, 143, 0.35)', g: 'linear-gradient(135deg,#ff8a5b,#ff4f81)', best: 'year:classic', unit: 'pts',
    },
    {
      href: 'krillion/', title: 'Krillion', label: 'Krillion', emoji: '🦐', badge: 'DAILY', img: 'Antarctic krill|Krill',
      desc: 'Name the answer nobody else would. Rare answers dive deeper.', tags: ['words'],
      tint: 'rgba(3, 30, 70, 0.95)', tint2: 'rgba(30, 167, 201, 0.35)', g: 'linear-gradient(180deg,#1aa7c9,#071a3d)', best: 'krillion:endless', unit: 'm', glow: 'rgba(30, 167, 201, 0.45)',
    },
    {
      href: 'noillirk/', title: 'Noillirk', label: 'Noillirk', emoji: '🎈', badge: 'DAILY', img: 'Hot air balloon',
      desc: 'Krillion, flipped. Say what everyone says and float to the surface.', tags: ['words'],
      tint: 'rgba(60, 30, 0, 0.9)', tint2: 'rgba(255, 205, 60, 0.35)', g: 'linear-gradient(0deg,#0b2a5c,#ffd36e)', best: 'noillirk:endless', unit: 'm', glow: 'rgba(255, 205, 60, 0.4)',
    },
    {
      href: 'year/?mode=timeline', title: 'Timeline', label: 'Timeline', emoji: '📏', img: 'Prague astronomical clock',
      desc: 'Slot each photo into a growing timeline. Three mistakes and you are out.', tags: ['history'],
      tint: 'rgba(15, 30, 110, 0.92)', tint2: 'rgba(79, 184, 255, 0.35)', g: 'linear-gradient(135deg,#4fb8ff,#5b5bff)', best: 'year:timeline', unit: 'cards',
    },
    {
      href: 'year/?mode=hilo', title: 'Before or After?', label: 'Before or After?', emoji: '↕️', img: 'Fall of the Berlin Wall',
      desc: 'Did it happen before or after? Build the longest streak.', tags: ['history'],
      tint: 'rgba(0, 70, 55, 0.92)', tint2: 'rgba(37, 208, 125, 0.35)', g: 'linear-gradient(135deg,#25d07d,#0f9f8f)', best: 'year:hilo', unit: 'streak',
    },
    {
      href: 'year/?mode=blitz', title: 'Decade Blitz', label: 'Blitz', emoji: '⚡', img: 'Lightning',
      desc: '60 seconds. Pick the right decade. Combos multiply.', tags: ['history', 'speed'],
      tint: 'rgba(110, 50, 0, 0.92)', tint2: 'rgba(255, 210, 63, 0.4)', g: 'linear-gradient(135deg,#ffd23f,#ff8f1f)', best: 'year:blitz', unit: 'pts', glow: 'rgba(255, 176, 32, 0.45)',
    },
    {
      href: 'krillion/?mode=infinite', title: 'Krillion: Air Supply', label: 'Air Supply', emoji: '🫧', img: 'Scuba diving',
      desc: '45 seconds of air. Every answer refills it. How deep can you go?', tags: ['words', 'speed'],
      tint: 'rgba(2, 20, 50, 0.95)', tint2: 'rgba(14, 116, 144, 0.4)', g: 'linear-gradient(180deg,#0e7490,#030b1f)', best: 'krillion:infinite', unit: 'm', glow: 'rgba(30, 167, 201, 0.45)',
    },
    {
      href: 'noillirk/?mode=board', title: 'Survey Board', label: 'Survey Board', emoji: '📋', img: 'Crowd|Audience',
      desc: 'Find the top 8 answers before you strike out.', tags: ['words'],
      tint: 'rgba(70, 10, 80, 0.92)', tint2: 'rgba(255, 111, 181, 0.4)', g: 'linear-gradient(135deg,#ff6fb5,#a855f7)', best: 'noillirk:board', unit: 'pts',
    },
    {
      href: 'year/?mode=survival', title: 'Time Budget', label: 'Time Budget', emoji: '⏳', img: 'Hourglass',
      desc: 'You have 100 years of wrongness to spend. Spend it wisely.', tags: ['history'],
      tint: 'rgba(90, 10, 40, 0.92)', tint2: 'rgba(240, 67, 90, 0.4)', g: 'linear-gradient(135deg,#f0435a,#8a1c5c)', best: 'year:survival', unit: 'rounds',
    },
    {
      href: 'year/?mode=classic&era=deep', title: 'Deep Time', label: 'Deep Time', emoji: '🏰', img: 'Bayeux Tapestry',
      desc: 'Guess the Year from 1000 to 1899. Knights to steam engines.', tags: ['history'],
      tint: 'rgba(60, 35, 10, 0.94)', tint2: 'rgba(165, 121, 59, 0.4)', g: 'linear-gradient(135deg,#a5793b,#5b3a1a)', best: 'year:classic-deep', unit: 'pts',
    },
    {
      href: 'year/?mode=classic&cat=culture', title: 'Pop Culture Years', label: 'Pop Culture', emoji: '🎮', img: 'Jukebox',
      desc: 'Movies, games, music and memes. When did it drop?', tags: ['history'],
      tint: 'rgba(80, 10, 60, 0.92)', tint2: 'rgba(255, 159, 67, 0.4)', g: 'linear-gradient(135deg,#ff6fb5,#ff9f43)', best: 'year:classic', unit: 'pts',
    },
    {
      href: 'year/?mode=daily', title: 'Daily Five', label: 'Daily Five', emoji: '📅', badge: 'DAILY', img: 'Newspaper',
      desc: 'The same five photos for everyone today. Compare with friends.', tags: ['history'],
      tint: 'rgba(40, 15, 110, 0.92)', tint2: 'rgba(143, 120, 255, 0.4)', g: 'linear-gradient(135deg,#8f78ff,#4b2bd6)', best: 'year:daily', unit: 'pts',
    },
  ];

  const DAILIES = [
    { game: 'year', href: 'year/?mode=daily', name: 'Daily Five', emoji: '📅', img: 'Times Square|Newspaper', tint: 'rgba(40, 15, 110, 0.95)', fmt: (d) => d.score.toLocaleString('en-US') + ' pts' },
    { game: 'krillion', href: 'krillion/', name: 'Krillion', emoji: '🦐', img: 'Antarctic krill|Krill', tint: 'rgba(3, 30, 70, 0.96)', fmt: (d) => d.score.toLocaleString('en-US') + ' m deep' },
    { game: 'noillirk', href: 'noillirk/', name: 'Noillirk', emoji: '🎈', img: 'Hot air balloon', tint: 'rgba(70, 35, 0, 0.94)', fmt: (d) => d.score.toLocaleString('en-US') + ' m climbed' },
  ];

  const FILTERS = [['all', 'All'], ['history', 'History'], ['words', 'Word games'], ['speed', 'Fast']];
  let filter = 'all';

  const EVENTS = (window.SPIL_EVENTS || []).map(([text, year, cat, emoji, fact, img]) => ({ text, year, cat, emoji, fact, img }));

  // ---------- Hero polaroids: a 3-second mini game ----------
  function renderHero() {
    const stack = $('#hero-stack');
    const famous = EVENTS.filter((e) => e.year >= 1900 && e.img);
    S.shuffle(famous).slice(0, 3).forEach((ev) => {
      const yearTag = h('span', { class: 'pol-year' }, '????');
      const hint = h('div', { class: 'pol-hint' }, 'Tap to reveal the year');
      let shown = false;
      const card = h('button', { class: 'polaroid', type: 'button' },
        S.wiki.photo(ev.img, { alt: ev.text, fallback: ev.emoji }),
        yearTag,
        h('div', { class: 'pol-caption' }, ev.text),
        hint
      );
      card.addEventListener('click', () => {
        if (shown) {
          location.href = 'year/?mode=classic';
          return;
        }
        shown = true;
        yearTag.textContent = ev.year;
        yearTag.classList.add('revealed');
        hint.textContent = 'Think you can beat that? Tap to play →';
        S.sound.play('good');
      });
      stack.append(card);
    });
  }

  function renderTicker() {
    const facts = S.shuffle(EVENTS).slice(0, 14);
    const items = facts.map((e) => h('span', null, e.emoji + ' ', h('b', null, e.year + ': '), e.fact));
    const track = $('#ticker');
    track.append(...items, ...items.map((n) => n.cloneNode(true)));
  }

  function renderDailies() {
    const row = $('#daily-row');
    row.innerHTML = '';
    DAILIES.forEach((d) => {
      const res = S.daily.get(d.game);
      row.append(
        h('a', { class: 'daily' + (res ? ' done' : ''), href: d.href, style: { '--tint': d.tint } },
          S.wiki.photo(d.img, { size: 960 }),
          h('span', { class: 'daily-emoji' }, d.emoji),
          h('span', { class: 'daily-status' }, res ? '✓ DONE' : 'NEW TODAY'),
          h('div', { class: 'daily-name' }, d.name),
          h('div', { class: 'daily-state' }, res ? 'You scored ' + d.fmt(res) : 'Not played yet. Same puzzle for everyone.')
        )
      );
    });
    $('#day-no').textContent = '#' + S.dayNumber();
    const clock = $('#reset-clock');
    const tick = () => (clock.textContent = '⏱ New puzzles in ' + S.untilMidnight());
    tick();
    setInterval(tick, 1000);
    const firstOpen = DAILIES.find((d) => !S.daily.get(d.game));
    const btn = $('#play-daily');
    if (firstOpen) {
      btn.href = firstOpen.href;
      btn.textContent = '▶ Play today\'s ' + firstOpen.name;
    } else {
      btn.href = 'year/?mode=classic';
      btn.textContent = '▶ Play Guess the Year';
    }
  }

  function renderFeatured() {
    $('#featured').append(
      S.wiki.photo('Humpback whale|Blue whale', { size: 1280 }),
      h('div', { class: 'featured-copy' },
        h('span', { class: 'featured-kicker' }, '🦐 Featured'),
        h('h2', null, 'How deep can your brain dive?'),
        h('p', null, 'In Krillion the obvious answer keeps you in the shallows. Think of something nobody else would, and sink all the way to the Hadal Zone.'),
        h('div', { class: 'featured-tiers' }, ['🦠 Plankton', '🐟 Schooler', '🐠 Rare', '🐙 Deep Cut', '🦐 One in a Krillion'].map((t) => h('span', null, t))),
        h('div', { class: 'btn-row', style: { justifyContent: 'flex-start' } },
          h('a', { class: 'btn pink', href: 'krillion/' }, '🤿 Dive in'),
          h('a', { class: 'btn ghost', href: 'noillirk/' }, '🎈 Try Noillirk')
        )
      )
    );
  }

  function tilt(card) {
    const thumb = $('.game-thumb', card);
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = thumb.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      thumb.style.setProperty('--ry', x * 10 + 'deg');
      thumb.style.setProperty('--rx', -y * 10 + 'deg');
    });
    card.addEventListener('pointerleave', () => {
      thumb.style.setProperty('--ry', '0deg');
      thumb.style.setProperty('--rx', '0deg');
    });
  }

  function renderGrid() {
    const grid = $('#game-grid');
    grid.innerHTML = '';
    GAMES.filter((g) => filter === 'all' || g.tags.includes(filter)).forEach((g) => {
      const best = S.best.get(g.best);
      const card = h('a', { class: 'game', href: g.href },
        h('div', { class: 'game-thumb', style: { '--tint': g.tint, '--tint-2': g.tint2, '--g': g.g, '--glow': g.glow || null } },
          S.wiki.photo(g.img, { alt: '' }),
          h('span', { class: 'sticker' }, g.emoji),
          g.badge ? h('span', { class: 'thumb-badge' }, g.badge) : null,
          h('span', { class: 'thumb-label' }, g.label),
          h('span', { class: 'play-btn', 'aria-hidden': 'true' }, '▶')
        ),
        h('div', { class: 'game-meta' },
          h('div', { class: 'game-title' }, g.title),
          h('div', { class: 'game-desc' }, g.desc),
          best != null ? h('div', { class: 'game-best' }, '🏅 Best: ' + best.toLocaleString('en-US') + ' ' + g.unit) : null
        )
      );
      tilt(card);
      grid.append(card);
    });
  }

  function renderFilters() {
    const wrap = $('#filters');
    wrap.innerHTML = '';
    FILTERS.forEach(([id, label]) => {
      wrap.append(h('button', {
        class: 'chip', 'aria-pressed': String(filter === id),
        onclick: () => {
          filter = id;
          S.sound.play('click');
          renderFilters();
          renderGrid();
        },
      }, label));
    });
  }

  const BEST_LABELS = [
    ['year:classic', 'Guess the Year', 'pts'],
    ['year:classic-deep', 'Deep Time', 'pts'],
    ['year:timeline', 'Timeline', 'cards'],
    ['year:hilo', 'Before or After', 'streak'],
    ['year:blitz', 'Decade Blitz', 'pts'],
    ['year:survival', 'Time Budget', 'rounds'],
    ['krillion:endless', 'Krillion dive', 'm'],
    ['krillion:infinite', 'Air Supply', 'm'],
    ['noillirk:endless', 'Noillirk climb', 'm'],
    ['noillirk:board', 'Survey Board', 'pts'],
  ];
  const AVATARS = ['🐟', '🐱', '🐸', '🧒', '🤓', '🧠', '🕰️', '🤿', '🔮', '📚', '👑'];

  function renderProfile() {
    const p = S.profile.get();
    const L = S.profile.level(p.xp);
    $('#avatar').textContent = AVATARS[Math.min(L.level - 1, AVATARS.length - 1)];
    $('#p-title').textContent = L.title;
    $('#p-level').textContent = 'Level ' + L.level;
    requestAnimationFrame(() => ($('#p-fill').style.width = Math.round((L.into / L.need) * 100) + '%'));
    $('#p-xp').textContent = L.into + ' / ' + L.need + ' XP to level ' + (L.level + 1);
    const stats = $('#p-stats');
    stats.innerHTML = '';
    [[p.xp.toLocaleString('en-US'), 'total XP'], [p.plays, 'games played'], [S.profile.streak() + ' 🔥', 'day streak']]
      .forEach(([v, l]) => stats.append(h('div', { class: 'stat' }, h('b', null, v), h('span', null, l))));
    const list = $('#p-bests');
    list.innerHTML = '';
    BEST_LABELS.forEach(([key, label, unit]) => {
      const b = S.best.get(key);
      if (b != null) list.append(h('div', { class: 'best-item' }, h('span', null, label), h('b', null, b.toLocaleString('en-US') + ' ' + unit)));
    });
    if (!list.children.length) list.append(h('div', { class: 'muted center', style: { gridColumn: '1/-1' } }, 'Play a game to start collecting high scores.'));
  }

  $('#surprise').addEventListener('click', () => {
    S.sound.play('pop');
    location.href = S.pick(GAMES).href;
  });

  $('#reset').addEventListener('click', () => {
    if (!confirm('Reset all XP, streaks, high scores and daily results?')) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('spil:') && k !== 'spil:wiki:v1').forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
    location.reload();
  });

  S.mountTopbar({ home: './' });
  renderHero();
  renderTicker();
  renderDailies();
  renderFeatured();
  renderFilters();
  renderGrid();
  renderProfile();
})();
