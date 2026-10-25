/* Guess the Year: slider modes (Classic, Daily, Time Budget). */
(function () {
  'use strict';
  const S = window.Spil;
  const Y = window.YearGame;
  const { h } = S;

  const VERDICTS = [
    [0, '🎯 Bullseye!', 'g'],
    [2, '🔥 So close!', 'g'],
    [5, '👏 Great guess!', 'y'],
    [10, '👍 Not bad', 'y'],
    [25, '🤔 A bit off', 'o'],
    [Infinity, '😬 Way off', 'r'],
  ];
  function verdict(diff, era) {
    const k = era.scale / 7; // stretch thresholds for wider eras
    for (const [max, text, cls] of VERDICTS) if (diff <= Math.round(max * k)) return { text, cls };
    return { text: '😬 Way off', cls: 'r' };
  }

  // Generic slider game. cfg: {mode, era, events[], total, hud(state), afterRound(state, res) -> bool continue, finish(state)}
  function runGuess(cfg) {
    const st = { i: 0, score: 0, results: [], budget: cfg.budget };
    nextRound();

    function nextRound() {
      if (cfg.total && st.i >= cfg.total) return cfg.finish(st);
      round(cfg.events[st.i % cfg.events.length]);
    }

    function round(ev) {
      st.revealed = false;
      const era = cfg.era;
      let value = Math.round((era.min + era.max) / 2);
      let typed = '';
      let typedTimer = null;
      let locked = false;

      const out = h('output', { class: 'year-out', 'aria-live': 'polite' }, String(value));
      const range = h('input', { class: 'year-range', type: 'range', min: era.min, max: era.max, step: 1, value, 'aria-label': 'Year' });
      const lockBtn = h('button', { class: 'btn wide' }, 'Lock in ' + value);
      const set = (v, sound) => {
        value = S.clamp(Math.round(v), era.min, era.max);
        range.value = value;
        out.textContent = value;
        lockBtn.textContent = 'Lock in ' + value;
        if (sound) S.sound.play('tick');
      };
      range.addEventListener('input', () => set(+range.value));
      const nudge = (d, label) => h('button', { class: 'nudge', 'aria-label': (d > 0 ? 'Plus ' : 'Minus ') + Math.abs(d), onclick: () => set(value + d, true) }, label);
      const mid = Math.round((era.min + era.max) / 2);

      const picker = h('div', { class: 'picker card' },
        h('div', { class: 'year-row' }, nudge(-10, '−10'), nudge(-1, '−1'), out, nudge(1, '+1'), nudge(10, '+10')),
        range,
        h('div', { class: 'range-labels' }, h('span', null, era.min), h('span', null, mid), h('span', null, era.max)),
        lockBtn,
        h('div', { class: 'hint-line' }, 'Tip: type a year on your keyboard, use ← → (Shift = ±10), Enter to lock in')
      );
      const area = h('div', null, picker);
      Y.show(cfg.hud(st), Y.eventCard(ev), area);

      const onKey = (e) => {
        if (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
        if (e.key === 'Enter') {
          e.preventDefault();
          const btn = area.querySelector('.btn');
          if (btn) btn.click();
          return;
        }
        if (locked) return;
        if (/^\d$/.test(e.key)) {
          typed = (typed + e.key).slice(-4);
          out.textContent = typed.padEnd(4, '_');
          clearTimeout(typedTimer);
          if (typed.length === 4) {
            set(+typed, true);
            typed = '';
          } else typedTimer = setTimeout(() => { typed = ''; out.textContent = value; }, 1600);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          if (document.activeElement === range) return; // native slider handles it
          e.preventDefault();
          set(value + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 10 : 1), true);
        }
      };
      document.addEventListener('keydown', onKey);
      Y.cleanup = () => document.removeEventListener('keydown', onKey);

      lockBtn.addEventListener('click', () => {
        if (locked) return;
        locked = true;
        reveal(ev, value, area);
      });
    }

    function reveal(ev, guess, area) {
      const era = cfg.era;
      const diff = Math.abs(guess - ev.year);
      const pts = Y.points(diff, era.scale);
      const v = verdict(diff, era);
      const res = { ev, guess, diff, pts, grade: Y.grade(pts) };
      st.results.push(res);
      st.revealed = true;
      st.score += pts;
      st.i++;
      Y.markSeen(ev);
      const keepGoing = cfg.afterRound ? cfg.afterRound(st, res) : true;

      // Zoomed number line around guess + answer
      const span = Math.max(16, diff * 2.4);
      const c = (guess + ev.year) / 2;
      const lo = c - span / 2;
      const pos = (y) => ((y - lo) / span) * 100 + '%';
      const you = h('div', { class: 'line-mark you', style: { left: '50%' } }, h('span', null, 'You · ' + guess), h('span', { class: 'pin' }));
      const ans = h('div', { class: 'line-mark ans', style: { left: '50%' } }, h('span', null, ev.year + ' ✓'), h('span', { class: 'pin' }));
      const gap = h('div', { class: 'line-gap', style: { left: '50%', width: '0' } });
      const ptsEl = h('div', { class: 'points' }, '+0');
      const nextBtn = h('button', { class: 'btn wide' }, keepGoing && !(cfg.total && st.i >= cfg.total) ? 'Next event →' : 'See results →');

      const panel = h('div', { class: 'reveal card' },
        h('div', { class: 'verdict ' + v.cls }, v.text),
        h('div', { class: 'line-wrap' }, h('div', { class: 'line-track' }), gap, you, ans),
        h('div', { class: 'reveal-years' }, diff === 0 ? 'Exactly ' + ev.year + '!' : diff + (diff === 1 ? ' year ' : ' years ') + (guess < ev.year ? 'too early' : 'too late')),
        cfg.budget != null ? null : ptsEl,
        cfg.revealExtra ? cfg.revealExtra(st, res) : null,
        h('p', { class: 'fact' }, h('b', null, '💡 '), ev.fact),
        nextBtn
      );
      area.innerHTML = '';
      area.append(panel);
      const hud = document.querySelector('.hud-wrap');
      if (hud) hud.replaceWith(cfg.hud(st));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        you.style.left = pos(guess);
        ans.style.left = pos(ev.year);
        const a = Math.min(guess, ev.year), b = Math.max(guess, ev.year);
        gap.style.left = pos(a);
        gap.style.width = ((b - a) / span) * 100 + '%';
      }));
      S.countUp(ptsEl, pts, 800, 0, (n) => '+' + n.toLocaleString('en-US'));

      if (diff === 0) {
        S.sound.play('great');
        S.confetti({ count: 90 });
        S.vibrate([30, 40, 30]);
      } else S.sound.play({ g: 'good', y: 'good', o: 'meh', r: 'bad' }[res.grade]);
      if (res.grade === 'r') S.vibrate(120);

      panel.scrollIntoView({ behavior: S.reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
      nextBtn.focus({ preventScroll: true });
      nextBtn.addEventListener('click', () => {
        S.sound.play('pop');
        if (keepGoing) nextRound();
        else cfg.finish(st);
      }, { once: true });
    }
  }

  // ---------- HUDs ----------
  function roundHud(total) {
    return (st) => {
      const dots = h('div', { class: 'progress-dots', 'aria-hidden': 'true' });
      for (let i = 0; i < total; i++) {
        const r = st.results[i];
        dots.append(h('i', { class: r ? r.grade : i === st.i && !st.revealed ? 'now' : '' }));
      }
      return h('div', { class: 'hud-wrap' },
        h('div', { class: 'hud' },
          h('span', { class: 'hud-pill' }, 'Round ', h('b', null, Math.min(st.revealed ? st.i : st.i + 1, total) + '/' + total)),
          dots,
          h('span', { class: 'hud-pill' }, '⭐ ', h('b', null, st.score.toLocaleString('en-US')))
        )
      );
    };
  }

  function rankFor(frac) {
    if (frac >= 0.9) return ['🧙', 'Time Lord'];
    if (frac >= 0.75) return ['🎓', 'Historian'];
    if (frac >= 0.55) return ['🧳', 'Time Tourist'];
    if (frac >= 0.35) return ['📅', 'Calendar Casual'];
    if (frac >= 0.15) return ['🌀', 'Lost in Time'];
    return ['🦕', 'Fresh out of the Stone Age'];
  }

  function shareGrid(results) {
    return results.map((r) => Y.GRADE_EMOJI[r.grade]).join('');
  }

  const recapRows = (results) => results.map((r) => ({ ev: r.ev, note: r.diff === 0 ? 'exact!' : 'you: ' + r.guess }));

  // ---------- Classic ----------
  Y.modes.classic = {
    name: 'Classic', emoji: '🕰️', unit: 'pts',
    desc: '10 events. Slide to the year. The closer you get, the more points.',
    start() {
      const total = 10;
      const era = Y.era();
      runGuess({
        mode: 'classic', era, total,
        events: Y.freshOrder(Y.pool()).slice(0, total),
        hud: roundHud(total),
        finish(st) {
          const frac = st.score / (total * 1000);
          const [emoji, title] = rankFor(frac);
          const avg = Math.round(st.results.reduce((n, r) => n + r.diff, 0) / total);
          Y.results({
            mode: 'classic', emoji, title, score: st.score, unit: 'out of ' + (total * 1000).toLocaleString('en-US'),
            xp: st.score / 100,
            stats: [[st.results.filter((r) => r.diff === 0).length, 'bullseyes'], [avg + ' yrs', 'average miss'], [Math.round(frac * 100) + '%', 'accuracy']],
            extra: h('div', { class: 'emoji-grid' }, shareGrid(st.results)),
            share: 'spil. Guess the Year 🕰️ ' + st.score.toLocaleString('en-US') + '/' + (total * 1000).toLocaleString('en-US') + '\n' + shareGrid(st.results) + '\n' + location.href.split('?')[0],
            recap: Y.recapList(recapRows(st.results)),
            celebrate: frac >= 0.75,
          });
        },
      });
    },
  };

  // ---------- Daily ----------
  Y.modes.daily = {
    name: 'Daily Five', emoji: '📅', unit: 'pts',
    desc: 'Same 5 events for everyone today. Share your score.',
    start() {
      const done = S.daily.get('year');
      if (done) return dailyDone(done);
      const total = 5;
      const rand = S.rng('year-daily:' + S.today());
      const events = S.shuffle(Y.pool({ era: 'modern', cat: 'all' }), rand).slice(0, total);
      runGuess({
        mode: 'daily', era: Y.ERAS.modern, total, events,
        hud: roundHud(total),
        finish(st) {
          const grid = shareGrid(st.results);
          const share = 'spil. Daily Year #' + S.dayNumber() + ' 📅\n' + grid + ' ' + st.score.toLocaleString('en-US') + '/5,000\n' + location.href.split('?')[0] + '?mode=daily';
          S.daily.set('year', { score: st.score, grid, share, recap: st.results.map((r) => [r.ev.id, r.guess]) });
          const [emoji, title] = rankFor(st.score / 5000);
          Y.results({
            mode: 'daily', bestKey: 'year:daily', emoji, title, score: st.score, unit: 'out of 5,000',
            xp: st.score / 40 + 15,
            extra: h('div', { class: 'emoji-grid' }, grid),
            subtitle: 'Come back tomorrow for five new events.',
            share, againLabel: '🕰️ Play Classic',
            recap: Y.recapList(recapRows(st.results)),
            celebrate: st.score >= 4000,
            again: () => Y.go('classic'),
          });
        },
      });
    },
  };

  function dailyDone(done) {
    const countdown = h('div', { class: 'countdown' });
    const tick = () => (countdown.textContent = 'Next Daily Five in ' + S.untilMidnight());
    tick();
    const id = setInterval(tick, 1000);
    const rows = (done.recap || []).map(([id, guess]) => {
      const ev = Y.EVENTS[id];
      return ev ? { ev, note: 'you: ' + guess } : null;
    }).filter(Boolean);
    Y.show(h('div', { class: 'results card' },
      h('div', { class: 'rank-emoji' }, '✅'),
      h('div', null, h('div', { class: 'kicker' }, 'Daily Five #' + S.dayNumber()), h('h2', { class: 'result-title' }, 'You already played today')),
      h('div', null, h('div', { class: 'big-score' }, done.score.toLocaleString('en-US')), h('div', { class: 'muted', style: { fontWeight: 800 } }, 'out of 5,000')),
      h('div', { class: 'emoji-grid' }, done.grid),
      countdown,
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onclick: () => Y.go('classic') }, '🕰️ Play Classic'),
        h('button', { class: 'btn ghost', onclick: () => S.share(done.share) }, '📤 Share'),
        h('button', { class: 'btn ghost', onclick: () => Y.menu() }, '☰ Modes')
      ),
      rows.length ? h('div', null, h('div', { class: 'kicker', style: { marginBottom: '8px' } }, 'Today\'s events'), Y.recapList(rows)) : null
    ));
    Y.cleanup = () => clearInterval(id);
  }

  // ---------- Time Budget (survival) ----------
  const BUDGETS = { modern: 100, deep: 300, all: 250 };
  Y.modes.survival = {
    name: 'Time Budget', emoji: '⏳', unit: 'rounds',
    desc: 'You get 100 years of wrongness. Every miss costs years. Exact guesses refund 10.',
    start() {
      const era = Y.era();
      const max = BUDGETS[Y.settings.era];
      let survived = 0;
      runGuess({
        mode: 'survival', era, budget: max,
        events: Y.freshOrder(Y.pool()),
        hud(st) {
          const pct = Math.max(0, st.budget) / max;
          return h('div', { class: 'hud-wrap' },
            h('div', { class: 'hud' },
              h('span', { class: 'hud-pill' }, 'Survived ', h('b', null, survived)),
              h('span', { class: 'hud-pill' }, '⏳ ', h('b', null, Math.max(0, st.budget) + ' yrs'))
            ),
            h('div', { class: 'budget' },
              h('div', { class: 'budget-bar' }, h('div', { class: 'budget-fill', style: { width: pct * 100 + '%', backgroundPosition: (1 - pct) * 100 + '% 0' } })),
              h('div', { class: 'budget-label' }, h('span', null, 'Years left to spend'), h('span', null, Math.max(0, st.budget) + ' / ' + max))
            )
          );
        },
        afterRound(st, res) {
          if (res.diff === 0) st.budget = Math.min(max, st.budget + 10);
          else st.budget -= res.diff;
          if (st.budget >= 0) survived++;
          return st.budget > 0;
        },
        revealExtra(st, res) {
          return h('div', { class: 'points', style: { color: res.diff === 0 ? 'var(--good)' : 'var(--bad)' } },
            res.diff === 0 ? '+10 years' : '−' + res.diff + (res.diff === 1 ? ' year' : ' years'));
        },
        finish(st) {
          const exact = st.results.filter((r) => r.diff === 0).length;
          const title = survived >= 25 ? 'Unstoppable chrononaut' : survived >= 15 ? 'Seasoned time traveler' : survived >= 8 ? 'Decent sense of time' : survived >= 4 ? 'The budget ran dry' : 'Bankrupt in record time';
          Y.results({
            mode: 'survival', emoji: survived >= 15 ? '🏆' : survived >= 8 ? '⏳' : '💸', title,
            score: survived, unit: survived === 1 ? 'round survived' : 'rounds survived', xp: survived * 9,
            stats: [[exact, 'bullseyes'], [Math.round(st.results.reduce((n, r) => n + r.diff, 0) / st.results.length) + ' yrs', 'average miss']],
            share: 'spil. Time Budget ⏳ I survived ' + survived + ' rounds with ' + max + ' years of wrongness.\n' + shareGrid(st.results.slice(0, 30)) + '\n' + location.href.split('?')[0] + '?mode=survival',
            recap: Y.recapList(recapRows(st.results).slice(-12)),
            celebrate: survived >= 15,
          });
        },
      });
    },
  };
})();
