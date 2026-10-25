/* Guess the Year: Decade Blitz (60 seconds, multiple choice, combo multiplier). */
(function () {
  'use strict';
  const S = window.Spil;
  const Y = window.YearGame;
  const { h } = S;

  const DURATION = 60;
  const PENALTY = 5;

  Y.modes.blitz = {
    name: 'Decade Blitz', emoji: '⚡', unit: 'pts',
    desc: '60 seconds. Pick the right decade. Streaks multiply your points.',
    start() {
      const era = Y.era();
      const events = Y.freshOrder(Y.pool());
      const st = { i: 0, score: 0, streak: 0, best: 0, right: 0, wrong: 0, log: [] };
      let busy = false;
      let over = false;
      let lastWhole = DURATION;

      const timeEl = h('b', null, String(DURATION));
      const scoreEl = h('b', null, '0');
      const comboEl = h('span', { class: 'combo' });
      const fill = h('div', { class: 'timer-fill' });
      const stage = h('div');

      Y.show(
        h('div', { class: 'timer-bar' }, fill),
        h('div', { class: 'hud' },
          h('span', { class: 'hud-pill' }, '⏱️ ', timeEl),
          comboEl,
          h('span', { class: 'hud-pill' }, '⭐ ', scoreEl)
        ),
        stage
      );

      const timer = S.timer(DURATION, (left, frac) => {
        fill.style.transform = 'scaleX(' + frac + ')';
        const whole = Math.ceil(left);
        timeEl.textContent = whole;
        fill.classList.toggle('low', left <= 10);
        if (whole !== lastWhole) {
          lastWhole = whole;
          if (whole <= 5 && whole > 0) S.sound.play('tick');
        }
      }, finish);

      const onKey = (e) => {
        const n = +e.key;
        if (n >= 1 && n <= 4) {
          const btn = stage.querySelectorAll('.choice')[n - 1];
          if (btn) btn.click();
        }
      };
      document.addEventListener('keydown', onKey);
      Y.cleanup = () => {
        timer.stop();
        document.removeEventListener('keydown', onKey);
      };

      const mult = () => Math.min(5, 1 + Math.floor(st.streak / 3));
      const paintCombo = () => (comboEl.textContent = mult() > 1 ? '🔥 x' + mult() : st.streak ? 'streak ' + st.streak : '');

      function options(year) {
        const d = Math.floor(year / 10) * 10;
        const lo = Math.floor(era.min / 10) * 10;
        const hi = Math.floor(era.max / 10) * 10;
        const near = [];
        for (let k = -4; k <= 4; k++) {
          const v = d + k * 10;
          if (k && v >= lo && v <= hi) near.push(v);
        }
        const closest = S.shuffle(near).sort((a, b) => Math.abs(a - d) - Math.abs(b - d)).slice(0, 5);
        return [d].concat(S.shuffle(closest).slice(0, 3)).sort((a, b) => a - b);
      }

      function ask() {
        if (over) return;
        const ev = events[st.i % events.length];
        st.i++;
        const answer = Math.floor(ev.year / 10) * 10;
        const note = h('div', { class: 'hint-line', style: { display: 'block', minHeight: '18px', fontWeight: 800 } });
        const choices = h('div', { class: 'choices' });
        options(ev.year).forEach((dec) => {
          const btn = h('button', { class: 'choice' }, dec + 's');
          btn.addEventListener('click', (e) => pick(ev, dec, answer, btn, choices, note, e));
          choices.append(btn);
        });
        stage.innerHTML = '';
        stage.append(Y.eventCard(ev), choices, note);
        busy = false;
      }

      function pick(ev, dec, answer, btn, choices, note, e) {
        if (busy || over) return;
        busy = true;
        Y.markSeen(ev);
        const rect = btn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        if (dec === answer) {
          st.streak++;
          st.best = Math.max(st.best, st.streak);
          st.right++;
          const pts = 100 * mult();
          st.score += pts;
          btn.classList.add('right');
          Y.floatScore('+' + pts, x, y);
          S.sound.play(mult() > 1 ? 'great' : 'good');
          st.log.push({ ev, ok: true });
          S.countUp(scoreEl, st.score, 300, st.score - pts);
          paintCombo();
          setTimeout(ask, 380);
        } else {
          st.streak = 0;
          st.wrong++;
          timer.add(-PENALTY);
          btn.classList.add('wrong');
          choices.querySelectorAll('.choice').forEach((b) => {
            if (b.textContent === answer + 's') b.classList.add('right');
          });
          note.textContent = 'It was ' + ev.year + '. −' + PENALTY + ' seconds';
          Y.floatScore('−' + PENALTY + 's', x, y, true);
          S.sound.play('bad');
          S.vibrate(80);
          S.restartAnim(choices, 'shake');
          st.log.push({ ev, ok: false });
          paintCombo();
          setTimeout(ask, 1100);
        }
      }

      function finish() {
        over = true;
        const title = st.score >= 3000 ? 'Lightning historian' : st.score >= 1800 ? 'Speedy scholar' : st.score >= 900 ? 'Quick thinker' : st.score >= 300 ? 'Warming up' : 'Blitzed';
        const acc = st.right + st.wrong ? Math.round((st.right / (st.right + st.wrong)) * 100) : 0;
        const missed = st.log.filter((l) => !l.ok);
        Y.results({
          mode: 'blitz', emoji: st.score >= 1800 ? '⚡' : st.score >= 600 ? '⏱️' : '🐢', title,
          score: st.score, unit: 'points', xp: st.score / 40 + st.right,
          stats: [[st.right, 'correct'], [acc + '%', 'accuracy'], [st.best, 'best streak']],
          share: 'spil. Decade Blitz ⚡ ' + st.score.toLocaleString('en-US') + ' pts · ' + st.right + ' right · best streak ' + st.best + '\n' + location.href.split('?')[0] + '?mode=blitz',
          recap: missed.length ? Y.recapList(missed.slice(-10).map((l) => ({ ev: l.ev, note: 'missed' }))) : null,
          celebrate: st.score >= 1800,
        });
      }

      ask();
    },
  };
})();
