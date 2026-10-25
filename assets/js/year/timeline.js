/* Guess the Year: Timeline (place each card in a growing timeline, 3 lives). */
(function () {
  'use strict';
  const S = window.Spil;
  const Y = window.YearGame;
  const { h } = S;

  const LIVES = 3;

  Y.modes.timeline = {
    name: 'Timeline', emoji: '📏', unit: 'cards',
    desc: 'Slot each event into a growing timeline. Three mistakes and it is over.',
    start() {
      const queue = Y.freshOrder(Y.pool());
      let qi = 0;
      let lives = LIVES;
      let score = 0;
      const placed = [queue[qi++]];
      let current = queue[qi++];
      const thumbs = new Map(); // keep loaded photos across re-renders
      const thumb = (ev) => {
        if (!thumbs.has(ev.id)) thumbs.set(ev.id, S.wiki.photo(ev.img, { cls: 'tl-thumb', size: 330, fallback: ev.emoji }));
        return thumbs.get(ev.id);
      };
      Y.warm(queue.slice(0, 16), 3);
      let last = null; // {id, ok}
      const log = [];
      let over = false;

      const hud = h('div', { class: 'hud' });
      const currentWrap = h('div', { class: 'tl-current' });
      const feedback = h('div');
      const list = h('div', { class: 'tl-list' });
      Y.show(hud, currentWrap, feedback, list);

      function paint() {
        hud.innerHTML = '';
        hud.append(
          h('span', { class: 'hud-pill lives', 'aria-label': lives + ' lives left' }, '❤️'.repeat(lives) + '🤍'.repeat(LIVES - lives)),
          h('span', { class: 'hud-pill' }, '📏 Placed ', h('b', null, score))
        );

        currentWrap.innerHTML = '';
        if (!over) {
          currentWrap.append(
            h('div', { class: 'kicker center', style: { marginBottom: '6px' } }, 'Where does this go?'),
            Y.eventCard(current, null, 'mini')
          );
        }

        list.innerHTML = '';
        const n = placed.length;
        for (let k = 0; k <= n; k++) {
          if (!over) {
            const label = k === 0 ? '⬆ Earlier than ' + placed[0].year : k === n ? '⬇ Later than ' + placed[n - 1].year : '↔ Between ' + placed[k - 1].year + ' and ' + placed[k].year;
            list.append(h('button', { class: 'tl-slot', onclick: () => place(k) }, label));
          }
          if (k < n) {
            const ev = placed[k];
            const cls = last && last.id === ev.id ? (last.ok ? ' new-ok' : ' new-bad') : '';
            list.append(h('div', { class: 'tl-item' + cls, 'data-id': ev.id },
              thumb(ev),
              h('span', { class: 'tl-year' }, ev.year),
              h('span', { class: 'tl-text' }, ev.text)
            ));
          }
        }
      }

      function place(k) {
        if (over) return;
        const n = placed.length;
        const okLeft = k === 0 || placed[k - 1].year <= current.year;
        const okRight = k === n || current.year <= placed[k].year;
        const ok = okLeft && okRight;
        let idx = k;
        if (!ok) {
          idx = placed.findIndex((e) => e.year > current.year);
          if (idx === -1) idx = n;
          lives--;
          S.sound.play('bad');
          S.vibrate(120);
        } else {
          score++;
          S.sound.play(score % 5 === 0 ? 'great' : 'good');
          if (score % 10 === 0) S.confetti({ count: 80 });
        }
        placed.splice(idx, 0, current);
        last = { id: current.id, ok };
        log.push({ ev: current, ok });
        Y.markSeen(current);

        feedback.innerHTML = '';
        feedback.append(h('p', { class: 'fact pop', style: { marginTop: 0 } },
          h('b', null, (ok ? '✅ ' : '❌ ') + current.year + ': '), current.fact
        ));

        if (lives <= 0) {
          over = true;
          paint();
          const btn = h('button', { class: 'btn wide', style: { marginTop: '4px' } }, 'See results →');
          btn.addEventListener('click', finish);
          feedback.append(btn);
          btn.focus({ preventScroll: true });
          window.scrollTo({ top: 0, behavior: S.reducedMotion() ? 'auto' : 'smooth' });
          return;
        }
        current = queue[qi++ % queue.length];
        S.wiki.preload(queue[qi % queue.length].img);
        paint();
        const el = list.querySelector('[data-id="' + last.id + '"]');
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.top < 220 || r.bottom > innerHeight) el.scrollIntoView({ behavior: S.reducedMotion() ? 'auto' : 'smooth', block: 'center' });
        }
      }

      function finish() {
        const title = score >= 25 ? 'Master of chronology' : score >= 15 ? 'Living timeline' : score >= 8 ? 'History buff' : score >= 4 ? 'Time apprentice' : 'Timeline tumble';
        const missed = log.filter((l) => !l.ok);
        Y.results({
          mode: 'timeline', emoji: score >= 15 ? '🏛️' : score >= 8 ? '📏' : '🌀', title,
          score, unit: score === 1 ? 'card placed' : 'cards placed', xp: score * 9 + 4,
          stats: [[placed.length, 'timeline length'], [placed[0].year + '–' + placed[placed.length - 1].year, 'span']],
          share: 'spil. Timeline 📏 I placed ' + score + ' events in a row (almost)!\n' + location.href.split('?')[0] + '?mode=timeline',
          recap: Y.recapList(missed.map((l) => ({ ev: l.ev, note: '✗ misplaced', grade: 'r' }))),
          celebrate: score >= 15,
        });
      }

      paint();
    },
  };
})();
