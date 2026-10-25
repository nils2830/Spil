/* Guess the Year: Before or After? (higher/lower streak game). */
(function () {
  'use strict';
  const S = window.Spil;
  const Y = window.YearGame;
  const { h } = S;

  Y.modes.hilo = {
    name: 'Before or After?', emoji: '↕️', unit: 'streak',
    desc: 'Did it happen before or after the last event? One wrong answer ends your streak.',
    start() {
      const queue = Y.freshOrder(Y.pool());
      let qi = 0;
      let streak = 0;
      const log = [];
      let anchor = queue[qi++];
      let busy = false;

      const takeNext = () => {
        // Skip events from the exact same year, which would make the question unfair.
        for (let tries = 0; tries < queue.length; tries++) {
          const ev = queue[qi++ % queue.length];
          if (ev.year !== anchor.year && ev.id !== anchor.id) return ev;
        }
        return queue[0];
      };
      let challenger = takeNext();

      const onKey = (e) => {
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'b') document.querySelector('[data-pick="before"]')?.click();
        if (e.key === 'ArrowDown' || e.key.toLowerCase() === 'a') document.querySelector('[data-pick="after"]')?.click();
      };

      function render() {
        busy = false;
        const mystery = h('div', { class: 'mystery-year' }, '????');
        const before = h('button', { class: 'btn', 'data-pick': 'before' }, '⬆ Before');
        const after = h('button', { class: 'btn', 'data-pick': 'after' }, 'After ⬇');
        before.addEventListener('click', () => answer('before', mystery, before, after));
        after.addEventListener('click', () => answer('after', mystery, before, after));
        Y.show(
          h('div', { class: 'hud' },
            h('span', { class: 'hud-pill' }, '🔥 Streak ', h('b', null, streak)),
            h('span', { class: 'hud-pill' }, '🏅 Best ', h('b', null, Math.max(streak, S.best.get(Y.bestKey('hilo')) || 0)))
          ),
          h('div', { class: 'hilo' },
            Y.eventCard(anchor, h('div', { class: 'anchor-year' }, anchor.year)),
            h('div', { class: 'vs' }, 'VS'),
            Y.eventCard(challenger, mystery),
            h('p', { class: 'center', style: { margin: '4px 0 0', fontWeight: 800 } }, 'Did this happen before or after ' + anchor.year + '?'),
            h('div', { class: 'hilo-buttons' }, before, after),
            h('div', { class: 'hint-line' }, 'Keyboard: ↑ before · ↓ after')
          )
        );
        document.addEventListener('keydown', onKey);
        Y.cleanup = () => document.removeEventListener('keydown', onKey);
      }

      function answer(pick, mystery, before, after) {
        if (busy) return;
        busy = true;
        const truth = challenger.year < anchor.year ? 'before' : 'after';
        const ok = pick === truth;
        Y.markSeen(challenger);
        log.push({ ev: challenger, ok });
        S.countUp(mystery, challenger.year, 650, anchor.year, (n) => String(n));
        mystery.style.color = ok ? 'var(--good)' : 'var(--bad)';
        (pick === 'before' ? before : after).classList.add(ok ? 'good' : 'bad');
        const card = mystery.closest('.event-card');
        const fact = h('p', { class: 'fact', style: { marginBottom: 0 } }, h('b', null, '💡 '), challenger.fact);
        card.append(fact);
        if (ok) {
          streak++;
          S.sound.play(streak % 5 === 0 ? 'great' : 'good');
          if (streak % 10 === 0) S.confetti({ count: 80 });
          setTimeout(() => {
            anchor = challenger;
            challenger = takeNext();
            render();
          }, 1500);
        } else {
          S.sound.play('bad');
          S.vibrate(150);
          S.restartAnim(card, 'shake');
          const cont = h('button', { class: 'btn wide', style: { marginTop: '12px' } }, 'See results →');
          cont.addEventListener('click', finish);
          document.querySelector('.hilo-buttons').replaceWith(cont);
          cont.focus({ preventScroll: true });
        }
      }

      function finish() {
        const title = streak >= 20 ? 'Chronology champion' : streak >= 12 ? 'Timeline whisperer' : streak >= 6 ? 'Solid sense of order' : streak >= 3 ? 'Getting the hang of it' : 'Tripped over time';
        Y.results({
          mode: 'hilo', emoji: streak >= 12 ? '👑' : streak >= 6 ? '🔥' : '🙃', title,
          score: streak, unit: 'in a row', xp: streak * 9 + 4,
          share: 'spil. Before or After? ↕️ I got ' + streak + ' in a row!\n' + location.href.split('?')[0] + '?mode=hilo',
          recap: Y.recapList(log.slice(-10).map((l) => ({ ev: l.ev, note: l.ok ? '✓' : '✗ ended it' }))),
          celebrate: streak >= 12,
        });
      }

      render();
    },
  };
})();
