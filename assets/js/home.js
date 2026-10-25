/* Home page: game wall, daily strip and profile. */
(function () {
  'use strict';
  const S = window.Spil;
  const { h, $ } = S;

  // Sprites: [emoji, x%, y%, size(px), rotate(deg)]
  const GAMES = [
    {
      id: 'year-classic', href: 'year/?mode=classic', title: 'Guess the Year', label: '19??',
      desc: 'Ten moments in history. How close can you get?', tags: ['history'],
      bg: 'linear-gradient(135deg,#ff8a5b,#ff4f81)', best: 'year:classic', unit: 'pts',
      sprites: [['🚀', 72, 30, 54, -12], ['📻', 26, 34, 42, 10], ['🎸', 52, 58, 46, 8], ['🗽', 86, 66, 40, -6]],
    },
    {
      id: 'year-timeline', href: 'year/?mode=timeline', title: 'Timeline', label: 'Timeline',
      desc: 'Slot each event into history. Three mistakes and you are out.', tags: ['history'],
      bg: 'linear-gradient(135deg,#4fb8ff,#5b5bff)', best: 'year:timeline', unit: 'cards',
      sprites: [['🏛️', 18, 32, 40, -6], ['⚙️', 40, 26, 36, 12], ['💡', 62, 34, 38, -8], ['📱', 84, 28, 38, 6]],
    },
    {
      id: 'krillion', href: 'krillion/', title: 'Krillion', label: 'Krillion', badge: 'DAILY',
      desc: 'Think of answers nobody else would. Rare answers dive deeper.', tags: ['words'],
      bg: 'linear-gradient(180deg,#1aa7c9 0%,#0b4f8a 55%,#071a3d 100%)', best: 'krillion:endless', unit: 'm',
      sprites: [['🦐', 30, 30, 50, -14], ['🐙', 74, 58, 52, 10], ['🫧', 58, 24, 30, 0], ['🐟', 20, 66, 36, 8]],
    },
    {
      id: 'noillirk', href: 'noillirk/', title: 'Noillirk', label: 'Noillirk', badge: 'DAILY',
      desc: 'Krillion, flipped. Say what everyone else says and float to the top.', tags: ['words'],
      bg: 'linear-gradient(0deg,#0b2a5c 0%,#3a7bd5 55%,#ffd36e 100%)', best: 'noillirk:endless', unit: 'm',
      sprites: [['🎈', 72, 26, 50, 10], ['🐠', 28, 62, 44, -10], ['☀️', 22, 22, 40, 0], ['👥', 80, 66, 38, 0]],
    },
    {
      id: 'year-hilo', href: 'year/?mode=hilo', title: 'Before or After?', label: 'Before?',
      desc: 'Did it happen before or after? Build the longest streak.', tags: ['history'],
      bg: 'linear-gradient(135deg,#25d07d,#0f9f8f)', best: 'year:hilo', unit: 'streak',
      sprites: [['⬆️', 26, 30, 44, 0], ['⬇️', 74, 62, 44, 0], ['📺', 72, 28, 40, 10], ['🦖', 28, 64, 42, -8]],
    },
    {
      id: 'year-blitz', href: 'year/?mode=blitz', title: 'Decade Blitz', label: 'Blitz',
      desc: '60 seconds. Pick the right decade. Combos multiply.', tags: ['history', 'speed'],
      bg: 'linear-gradient(135deg,#ffd23f,#ff8f1f)', best: 'year:blitz', unit: 'pts',
      sprites: [['⚡', 30, 32, 54, -10], ['⏱️', 72, 34, 46, 8], ['🕺', 56, 62, 42, 6], ['💾', 18, 66, 34, -8]],
    },
    {
      id: 'krillion-infinite', href: 'krillion/?mode=infinite', title: 'Krillion: Air Supply', label: 'Air Supply',
      desc: '45 seconds of air. Every answer refills it. How deep can you go?', tags: ['words', 'speed'],
      bg: 'linear-gradient(180deg,#0e7490 0%,#0c2d57 60%,#030b1f 100%)', best: 'krillion:infinite', unit: 'm',
      sprites: [['🤿', 34, 34, 50, -8], ['🦑', 74, 62, 48, 12], ['🫧', 70, 24, 28, 0], ['🫧', 58, 40, 20, 0]],
    },
    {
      id: 'noillirk-board', href: 'noillirk/?mode=board', title: 'Survey Board', label: 'Survey Board',
      desc: 'Find the top 8 answers before you strike out.', tags: ['words'],
      bg: 'linear-gradient(135deg,#ff6fb5,#a855f7)', best: 'noillirk:board', unit: 'pts',
      sprites: [['📋', 28, 34, 48, -8], ['❌', 72, 30, 34, 10], ['🏆', 70, 62, 44, -6], ['💬', 26, 66, 36, 6]],
    },
    {
      id: 'year-survival', href: 'year/?mode=survival', title: 'Time Budget', label: 'Survival',
      desc: 'You have 100 years of wrongness to spend. Spend it wisely.', tags: ['history'],
      bg: 'linear-gradient(135deg,#f0435a,#8a1c5c)', best: 'year:survival', unit: 'rounds',
      sprites: [['⏳', 30, 34, 52, -8], ['❤️', 72, 30, 38, 10], ['💀', 70, 64, 40, -6], ['📜', 26, 66, 36, 6]],
    },
    {
      id: 'year-deep', href: 'year/?mode=classic&era=deep', title: 'Deep Time', label: '1???',
      desc: 'Guess the Year, but from 1000 to 1899. Knights to steam engines.', tags: ['history'],
      bg: 'linear-gradient(135deg,#a5793b,#5b3a1a)', best: 'year:classic-deep', unit: 'pts',
      sprites: [['🏰', 30, 32, 50, -6], ['⚔️', 72, 30, 40, 12], ['🚂', 68, 62, 46, -4], ['🧭', 26, 66, 38, 8]],
    },
    {
      id: 'year-pop', href: 'year/?mode=classic&cat=culture', title: 'Pop Culture Years', label: '199?',
      desc: 'Movies, games, music and memes. When did it drop?', tags: ['history'],
      bg: 'linear-gradient(135deg,#ff6fb5,#ff9f43)', best: 'year:classic', unit: 'pts',
      sprites: [['🎮', 28, 32, 48, -10], ['🎬', 72, 30, 44, 8], ['🎧', 68, 62, 42, -6], ['🦖', 26, 64, 40, 8]],
    },
    {
      id: 'year-daily', href: 'year/?mode=daily', title: 'Daily Year', label: 'Daily', badge: 'DAILY',
      desc: 'Same five events for everyone today. Compare with friends.', tags: ['history'],
      bg: 'linear-gradient(135deg,#8f78ff,#4b2bd6)', best: 'year:daily', unit: 'pts',
      sprites: [['📅', 30, 34, 52, -8], ['🌍', 72, 32, 44, 8], ['⭐', 66, 64, 36, -6], ['🗞️', 24, 66, 36, 6]],
    },
  ];

  const DAILIES = [
    { game: 'year', href: 'year/?mode=daily', name: 'Daily Year', emoji: '📅', bg: '#ece8ff', fmt: (d) => d.score.toLocaleString('en-US') + ' pts' },
    { game: 'krillion', href: 'krillion/', name: 'Krillion', emoji: '🦐', bg: '#d9f2fb', fmt: (d) => d.score.toLocaleString('en-US') + ' m deep' },
    { game: 'noillirk', href: 'noillirk/', name: 'Noillirk', emoji: '🎈', bg: '#fff1cf', fmt: (d) => d.score.toLocaleString('en-US') + ' m up' },
  ];

  const FILTERS = [
    ['all', 'All'],
    ['history', 'History'],
    ['words', 'Word games'],
    ['speed', 'Fast'],
  ];

  let filter = 'all';

  function renderGrid() {
    const grid = $('#game-grid');
    grid.innerHTML = '';
    GAMES.filter((g) => filter === 'all' || g.tags.includes(filter)).forEach((g) => {
      const best = S.best.get(g.best);
      grid.append(
        h('a', { class: 'game', href: g.href },
          h('div', { class: 'game-thumb', style: { background: g.bg } },
            g.sprites.map(([e, x, y, size, r]) =>
              h('span', { class: 'sprite', style: { left: x + '%', top: y + '%', fontSize: size + 'px', '--r': r + 'deg' } }, e)
            ),
            g.badge ? h('span', { class: 'thumb-badge' }, g.badge) : null,
            h('span', { class: 'thumb-label' }, g.label)
          ),
          h('div', { class: 'game-meta' },
            h('div', { class: 'game-title' }, g.title),
            h('div', { class: 'game-desc' }, g.desc),
            best != null ? h('div', { class: 'game-best' }, '🏅 Best: ' + best.toLocaleString('en-US') + ' ' + g.unit) : null
          )
        )
      );
    });
  }

  function renderFilters() {
    const wrap = $('#filters');
    wrap.innerHTML = '';
    FILTERS.forEach(([id, label]) => {
      wrap.append(
        h('button', {
          class: 'chip', 'aria-pressed': String(filter === id),
          onclick: () => {
            filter = id;
            S.sound.play('click');
            renderFilters();
            renderGrid();
          },
        }, label)
      );
    });
  }

  function renderDailies() {
    const row = $('#daily-row');
    row.innerHTML = '';
    DAILIES.forEach((d) => {
      const res = S.daily.get(d.game);
      row.append(
        h('a', { class: 'daily' + (res ? ' done' : ''), href: d.href },
          h('div', { class: 'daily-emoji', style: { background: d.bg } }, d.emoji),
          h('div', null,
            h('div', { class: 'daily-name' }, d.name + ' #' + S.dayNumber()),
            h('div', { class: 'daily-state' }, res ? '✓ ' + d.fmt(res) : 'Not played yet · tap to play')
          )
        )
      );
    });
    const clock = $('#reset-clock');
    const tick = () => (clock.textContent = 'New puzzles in ' + S.untilMidnight());
    tick();
    setInterval(tick, 1000);
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
    [
      [p.xp.toLocaleString('en-US'), 'total XP'],
      [p.plays, 'games played'],
      [S.profile.streak() + ' 🔥', 'day streak'],
    ].forEach(([v, l]) => stats.append(h('div', { class: 'stat' }, h('b', null, v), h('span', null, l))));
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
    const g = S.pick(GAMES);
    location.href = g.href;
  });

  $('#reset').addEventListener('click', () => {
    if (!confirm('Reset all XP, streaks, high scores and daily results?')) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('spil:')).forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
    location.reload();
  });

  S.mountTopbar({ home: './' });
  renderFilters();
  renderGrid();
  renderDailies();
  renderProfile();
})();
