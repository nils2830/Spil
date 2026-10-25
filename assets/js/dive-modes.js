/* Krillion & Noillirk modes: Daily, Endless, Air Supply (Krillion) and Survey Board (Noillirk). */
(function () {
  'use strict';
  const S = window.Spil;
  const D = window.Dive;
  const { h } = S;

  const metres = (pts) => pts * 10;
  const depthOf = (score) => (D.game.dir === 'down' ? metres(score) : D.game.start - metres(score));

  function rankTitle(m) {
    if (D.game.dir === 'down') {
      if (m >= 6000) return ['🦐', 'Hadal legend'];
      if (m >= 4500) return ['🐙', 'Abyssal explorer'];
      if (m >= 3000) return ['🐠', 'Midnight diver'];
      if (m >= 1500) return ['🐟', 'Twilight swimmer'];
      if (m >= 500) return ['🤿', 'Snorkeler'];
      return ['🩴', 'Paddling in the shallows'];
    }
    if (m >= 7000) return ['🌞', 'You broke the surface!'];
    if (m >= 5600) return ['🧠', 'Certified hive mind'];
    if (m >= 4200) return ['🏄', 'Crowd surfer'];
    if (m >= 2800) return ['🙂', 'Refreshingly normal'];
    if (m >= 1400) return ['🦑', 'Delightfully odd'];
    return ['👽', 'Wonderfully weird'];
  }

  function enterToContinue(btn) {
    let armed = false;
    setTimeout(() => (armed = true), 350);
    const onKey = (e) => {
      if (e.key === 'Enter' && armed) {
        e.preventDefault();
        btn.click();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }

  function zoneRow(prevDepth, depth) {
    const before = D.zoneAt(prevDepth);
    const after = D.zoneAt(depth);
    if (before === after) return null;
    return h('div', { class: 'suggest-row zone-row' },
      S.wiki.photo(after.img, { cls: 'zone-photo', size: 500, credit: true, fallback: '🐙' }),
      h('div', null, h('span', { class: 'kicker' }, '📍 Now entering the ' + after.name), after.fact)
    );
  }

  function boardGrid(prompt, count, opts = {}) {
    const g = h('div', { class: 'board' });
    for (let i = 0; i < count; i++) {
      const pts = opts.points ? opts.points(i) : null;
      g.append(h('div', { class: 'board-slot found' + (opts.mine === i ? ' mine' : ''), style: { animationDelay: i * 60 + 'ms' } },
        h('span', { class: 'b-rank' }, i + 1),
        D.answerPhoto(prompt, prompt.names[i], { cls: 'b-thumb', fallback: '' }),
        h('span', { class: 'b-name' }, prompt.names[i]),
        pts != null ? h('span', { class: 'b-pts' }, pts) : null
      ));
    }
    return g;
  }

  function feedbackPanel(prompt, m, res, prevDepth, depth, isLast, onNext) {
    const g = D.game;
    const n = prompt.answers.length;
    const rows = [];
    if (g.dir === 'down') {
      const rareStart = Math.ceil(n * 0.8);
      const rare = S.shuffle(prompt.names.slice(rareStart).filter((_, i) => !m || i + rareStart !== m.i)).slice(0, 5);
      rows.push(h('div', { class: 'suggest-row' }, h('span', { class: 'kicker' }, '🦐 One-in-a-krillion answers you could try next time'),
        h('div', { class: 'pic-list' }, rare.slice(0, 4).map((r) => h('div', { class: 'pic' }, D.answerPhoto(prompt, r, { cls: 'pic-photo', fallback: '🦐' }), h('span', null, r))))));
      rows.push(h('div', { class: 'suggest-row' }, h('span', { class: 'kicker' }, '🦠 What most people say'), h('div', { class: 'pill-list' }, prompt.names.slice(0, 4).map((r) => h('span', null, r)))));
    } else {
      rows.push(h('div', { class: 'suggest-row' }, h('span', { class: 'kicker' }, '📋 The top 10 answers'), boardGrid(prompt, Math.min(10, n), { mine: m ? m.i : -1, points: (i) => g.score(i).pts })));
    }
    const z = zoneRow(prevDepth, depth);
    if (z) rows.unshift(z);

    const badge = m
      ? h('div', { class: 'tier-badge', style: { '--tier': res.tier.color } },
        h('div', { class: 'answer-hero' }, D.answerPhoto(prompt, m.name, { cls: 'answer-photo', size: 500, credit: true, fallback: res.tier.emoji }), h('span', { class: 'answer-tier' }, res.tier.emoji)),
        h('div', { class: 'tb-name' }, res.tier.name))
      : h('div', { class: 'tier-badge' }, h('div', { class: 'tb-emoji' }, '⏰'), h('div', { class: 'tb-name', style: { color: '#ff9aa8' } }, 'Time’s up!'));
    const pts = h('div', { class: 'fb-points' }, '+0');
    const next = h('button', { class: 'btn wide', style: { marginTop: '16px' } }, isLast ? 'See results →' : g.dir === 'down' ? 'Dive deeper →' : 'Float up →');
    const panel = h('div', { class: 'feedback card' },
      badge,
      m ? h('div', { class: 'fb-answer' }, '“' + m.name + '” · ranked #' + (m.i + 1) + ' of ' + n + ' by popularity') : null,
      pts,
      h('div', { class: 'fb-meters' }, res.pts ? (g.dir === 'down' ? '⬇ ' + D.fmtM(metres(res.pts)) + ' deeper' : '⬆ ' + D.fmtM(metres(res.pts)) + ' closer to the surface') : 'You stayed where you were'),
      h('div', { class: 'suggest' }, rows),
      next
    );
    S.countUp(pts, res.pts, 700, 0, (v) => '+' + v);
    const off = enterToContinue(next);
    next.addEventListener('click', () => {
      off();
      S.sound.play('pop');
      onNext();
    }, { once: true });
    setTimeout(() => next.focus({ preventScroll: true }), 50);
    return { panel, off };
  }

  function playResultSound(res) {
    if (!res.tier) return S.sound.play('bad');
    const top = D.game.dir === 'down' ? res.pts >= 85 : res.pts >= 72;
    const good = D.game.dir === 'down' ? res.pts >= 30 : res.pts >= 31;
    S.sound.play(D.game.dir === 'down' ? 'sink' : 'rise');
    setTimeout(() => S.sound.play(top ? 'great' : good ? 'good' : 'meh'), 250);
    if (top) S.confetti({ count: 70, colors: D.game.dir === 'down' ? ['#ff8fcf', '#a5b4fc', '#7dd3fc', '#ffffff'] : ['#ffd76a', '#ffb36b', '#ffffff', '#8fd3ff'] });
  }

  // ---------- 7-round run (Daily + Endless) ----------
  function runRounds({ mode, prompts, label, onFinish }) {
    const g = D.game;
    const st = { i: 0, score: 0, log: [] };
    D.setDepth(depthOf(0));
    next();

    function next() {
      if (st.i >= prompts.length) return onFinish(st);
      const prompt = prompts[st.i];
      const depth = depthOf(st.score);
      const card = D.promptCard({
        game: g, prompt, seconds: g.seconds, label,
        onValid: (m) => resolve(prompt, m, card, fbArea),
        onTimeout: () => resolve(prompt, null, card, fbArea),
      });
      const fbArea = h('div');
      D.show(
        h('div', { class: 'dive-hud' },
          h('span', { class: 'hud-pill' }, 'Round ', h('b', null, st.i + 1 + '/' + prompts.length)),
          h('span', { class: 'hud-pill' }, g.dir === 'down' ? '⬇ ' : '⬆ ', h('b', null, D.fmtM(metres(st.score))))
        ),
        h('div', { class: 'zone-name' }, '📍 ' + D.zoneAt(depth).name + ' · ' + D.fmtM(depth) + ' below the surface'),
        card.el,
        fbArea
      );
      card.focus();
      D.cleanup = () => card.stop();
    }

    function resolve(prompt, m, card, fbArea) {
      const res = m ? g.score(m.i, prompt.answers.length) : { pts: 0, tier: null };
      const prevDepth = depthOf(st.score);
      st.score += res.pts;
      st.log.push({ prompt, m, res });
      st.i++;
      const depth = depthOf(st.score);
      D.setDepth(depth);
      playResultSound(res);
      const fb = feedbackPanel(prompt, m, res, prevDepth, depth, st.i >= prompts.length, next);
      fbArea.append(fb.panel);
      D.cleanup = () => { card.stop(); fb.off(); };
      setTimeout(() => fb.panel.scrollIntoView({ behavior: S.reducedMotion() ? 'auto' : 'smooth', block: 'start' }), 120);
    }
  }

  const recapRows = (log) => log.map((l) => ({
    emoji: l.res.tier ? l.res.tier.emoji : '⏰',
    pid: l.prompt.id,
    name: l.m ? l.m.name : null,
    q: l.prompt.q,
    answer: l.m ? l.m.name + ' · #' + (l.m.i + 1) + ' of ' + l.prompt.answers.length : 'No answer',
    pts: '+' + l.res.pts,
  }));
  const gridOf = (log) => log.map((l) => (l.res.tier ? l.res.tier.emoji : '⏰')).join('');

  // ---------- Daily ----------
  D.modes.daily = {
    name: 'Daily Dive', emoji: '📅', unit: 'm',
    desc: 'Seven prompts, the same for everyone today. One shot.',
    start() {
      const g = D.game;
      const done = S.daily.get(g.id);
      if (done) return dailyDone(done);
      const prompts = D.pickPrompts(g.rounds, { seed: g.id + '-daily:' + S.today() });
      runRounds({
        mode: 'daily', prompts, label: 'Daily #' + S.dayNumber(),
        onFinish(st) {
          const m = metres(st.score);
          const grid = gridOf(st.log);
          const share = 'spil. ' + g.name + ' #' + S.dayNumber() + ' ' + (g.dir === 'down' ? '🦐' : '🎈') + '\n' + grid + '\n' + (g.dir === 'down' ? D.fmtM(m) + ' deep' : D.fmtM(m) + ' climbed') + '\n' + location.href.split('?')[0];
          S.daily.set(g.id, { score: m, grid, share, recap: recapRows(st.log) });
          const [emoji, title] = rankTitle(m);
          D.results({
            mode: 'daily', bestKey: g.id + ':daily', emoji, title, score: m,
            unitLabel: g.dir === 'down' ? 'metres deep' : 'metres climbed',
            fmt: (v) => v.toLocaleString('en-US'), xp: st.score / 8 + 15, grid, share,
            recap: D.recapList(recapRows(st.log)),
            againLabel: '♾️ Play Endless', again: () => D.go('endless'),
            celebrate: m >= (g.dir === 'down' ? 4500 : 5600),
          });
        },
      });
    },
  };

  function dailyDone(done) {
    const g = D.game;
    D.setDepth(depthOf(done.score / 10));
    const countdown = h('div', { class: 'countdown' });
    const tick = () => (countdown.textContent = 'Next Daily Dive in ' + S.untilMidnight());
    tick();
    const id = setInterval(tick, 1000);
    D.show(h('div', { class: 'dive-results card' },
      h('div', { class: 'rank-emoji' }, '✅'),
      h('div', null, h('div', { class: 'kicker' }, g.name + ' #' + S.dayNumber()), h('h2', { class: 'result-title' }, 'You already dove today')),
      h('div', null, h('div', { class: 'big-score' }, done.score.toLocaleString('en-US')), h('div', { class: 'muted', style: { fontWeight: 800 } }, g.dir === 'down' ? 'metres deep' : 'metres climbed')),
      h('div', { class: 'emoji-grid' }, done.grid),
      countdown,
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onclick: () => D.go('endless') }, '♾️ Play Endless'),
        h('button', { class: 'btn ghost', onclick: () => S.share(done.share) }, '📤 Share'),
        h('button', { class: 'btn ghost', onclick: () => D.menu() }, '☰ Menu')
      ),
      done.recap ? h('div', null, h('div', { class: 'kicker', style: { marginBottom: '8px' } }, 'Your answers'), D.recapList(done.recap)) : null
    ));
    D.cleanup = () => clearInterval(id);
  }

  // ---------- Endless ----------
  D.modes.endless = {
    name: 'Endless', emoji: '♾️', unit: 'm',
    desc: 'Unlimited seven-prompt runs. Pick a theme below and chase your record.',
    get bestKey() {
      return D.game.id + ':endless';
    },
    start() {
      const g = D.game;
      const theme = D.theme();
      runRounds({
        mode: 'endless', prompts: D.pickPrompts(g.rounds, { theme }), label: null,
        onFinish(st) {
          const m = metres(st.score);
          const [emoji, title] = rankTitle(m);
          const grid = gridOf(st.log);
          D.results({
            mode: 'endless', bestKey: g.id + ':endless', emoji, title, score: m,
            unitLabel: g.dir === 'down' ? 'metres deep' : 'metres climbed',
            fmt: (v) => v.toLocaleString('en-US'), xp: st.score / 8 + 6, grid,
            share: 'spil. ' + g.name + ' ' + (g.dir === 'down' ? '🦐' : '🎈') + ' ' + D.fmtM(m) + (g.dir === 'down' ? ' deep' : ' climbed') + '\n' + grid + '\n' + location.href.split('?')[0],
            recap: D.recapList(recapRows(st.log)),
            celebrate: m >= (g.dir === 'down' ? 4500 : 5600),
          });
        },
      });
    },
  };

  // ---------- Krillion: Air Supply ----------
  const AIR = 45;
  const SKIP_COST = 4;
  D.modes.infinite = {
    name: 'Air Supply', emoji: '🫧', unit: 'm', bestKey: 'krillion:infinite',
    desc: '45 seconds of air. Each answer refills it, and rarer answers refill more. How deep can you go?',
    start() {
      const g = D.game;
      const prompts = D.pickPrompts(D.PROMPTS.length, { theme: D.theme() });
      const st = { i: 0, score: 0, log: [], deepest: 0 };
      let over = false;
      let passedChallenger = false;
      D.setDepth(0);

      const airFill = h('div', { class: 'ptimer-fill' });
      const airSecs = h('b', null, String(AIR));
      const depthEl = h('b', null, '0 m');
      const zoneEl = h('div', { class: 'zone-name' });
      const banner = h('div', { style: { minHeight: '64px', display: 'grid', placeItems: 'center' } });
      const cardHost = h('div');
      D.show(
        h('div', { class: 'dive-hud' },
          h('span', { class: 'hud-pill' }, '🫧 Air ', airSecs),
          h('span', { class: 'hud-pill' }, '⬇ ', depthEl)
        ),
        h('div', { class: 'ptimer', style: { height: '14px' } }, airFill),
        zoneEl,
        banner,
        cardHost
      );

      let lastWhole = AIR;
      const air = S.timer(AIR, (left) => {
        airFill.style.transform = 'scaleX(' + Math.min(1, left / AIR) + ')';
        airFill.classList.toggle('low', left <= 8);
        const whole = Math.ceil(left);
        airSecs.textContent = whole + 's';
        if (whole !== lastWhole) {
          lastWhole = whole;
          if (whole <= 5 && whole > 0) S.sound.play('tick');
        }
      }, finish);

      let card = null;
      D.cleanup = () => { air.stop(); if (card) card.stop(); };

      function paintDepth() {
        const d = metres(st.score);
        depthEl.textContent = D.fmtM(d);
        zoneEl.textContent = '📍 ' + D.zoneAt(d).name;
        D.setDepth(d);
      }

      function showBanner(nodes, cls) {
        banner.innerHTML = '';
        banner.append(h('div', { class: 'tier-badge ' + (cls || ''), style: { flexDirection: 'row', gap: '10px' } }, nodes));
      }

      function nextPrompt() {
        if (over) return;
        const prompt = prompts[st.i % prompts.length];
        st.i++;
        const skip = h('button', { class: 'btn ghost small', type: 'button' }, '⏭ Skip (−' + SKIP_COST + 's air)');
        card = D.promptCard({
          game: g, prompt, label: 'Prompt ' + st.i,
          extraButtons: [skip],
          onValid: (m) => {
            const res = g.score(m.i, prompt.answers.length);
            const prev = metres(st.score);
            st.score += res.pts;
            st.log.push({ prompt, m, res });
            air.add(res.tier.air, AIR);
            const now = metres(st.score);
            paintDepth();
            S.sound.play(res.pts >= 85 ? 'great' : res.pts >= 30 ? 'good' : 'bubble');
            showBanner([
              D.answerPhoto(prompt, m.name, { cls: 'banner-photo', fallback: res.tier.emoji }),
              h('span', null, h('span', { class: 'tb-name', style: { fontSize: '22px', color: res.tier.color, display: 'block' } }, res.tier.name + ' +' + res.pts), h('span', { class: 'muted', style: { fontWeight: 800, fontSize: '13px' } }, '“' + m.name + '” · +' + res.tier.air + 's air')),
            ]);
            const z0 = D.zoneAt(prev), z1 = D.zoneAt(now);
            if (z0 !== z1) S.toast('📍 ' + z1.name + ': ' + z1.fact, 4200);
            if (!passedChallenger && now >= 10935) {
              passedChallenger = true;
              S.toast('🏆 You passed Challenger Deep (10,935 m), the deepest known point on Earth!', 4500);
              S.confetti();
            }
            setTimeout(nextPrompt, 30);
          },
        });
        skip.addEventListener('click', () => {
          air.add(-SKIP_COST);
          S.sound.play('pop');
          st.log.push({ prompt, m: null, res: { pts: 0, tier: null } });
          card.lock();
          nextPrompt();
        });
        cardHost.innerHTML = '';
        cardHost.append(card.el);
        card.focus();
      }

      function finish() {
        if (over) return;
        over = true;
        if (card) card.lock();
        const m = metres(st.score);
        const answered = st.log.filter((l) => l.m);
        const krill = answered.filter((l) => l.res.pts === 100).length;
        const [emoji, title] = rankTitle(m);
        S.sound.play('bubble');
        D.results({
          mode: 'infinite', bestKey: 'krillion:infinite', emoji, title: 'Out of air! ' + title, score: m,
          unitLabel: 'metres deep', fmt: (v) => v.toLocaleString('en-US'), xp: st.score / 10 + answered.length * 2,
          stats: [[answered.length, 'answers'], [krill, 'one in a krillion'], [st.log.length - answered.length, 'skipped']],
          share: 'spil. Krillion Air Supply 🫧 ' + D.fmtM(m) + ' deep on one breath (' + answered.length + ' answers)\n' + location.href.split('?')[0] + '?mode=infinite',
          recap: answered.length ? D.recapList(recapRows(answered.slice(-12))) : null,
          celebrate: m >= 6000,
        });
      }

      paintDepth();
      nextPrompt();
    },
  };

  // ---------- Noillirk: Survey Board ----------
  const BOARD_PTS = [100, 80, 65, 52, 42, 34, 27, 21];
  const BOARD_SECONDS = 50;
  const BOARDS = 3;
  const STRIKES = 3;
  D.modes.board = {
    name: 'Survey Board', emoji: '📋', unit: 'pts', bestKey: 'noillirk:board',
    desc: 'Find the top 8 answers on the board. Three answers that are not on it and the board closes.',
    start() {
      const g = D.game;
      const prompts = D.pickPrompts(BOARDS, { theme: D.theme() });
      const st = { b: 0, total: 0, found: 0, log: [] };
      D.setDepth(g.start);
      board();

      function board() {
        if (st.b >= BOARDS) return finish();
        const prompt = prompts[st.b];
        st.b++;
        const found = new Set();
        const used = new Set();
        let strikes = 0;
        let boardPts = 0;
        let closed = false;

        const totalEl = h('b', null, st.total.toLocaleString('en-US'));
        const strikesEl = h('div', { class: 'strikes center', 'aria-label': 'Strikes' });
        const paintStrikes = () => {
          strikesEl.innerHTML = '';
          for (let i = 0; i < STRIKES; i++) strikesEl.append(h('span', { class: i < strikes ? '' : 'off' }, '❌'));
        };
        paintStrikes();
        const slots = [];
        const grid = h('div', { class: 'board' });
        for (let i = 0; i < 8; i++) {
          const nameEl = h('span', { class: 'b-name' }, prompt.names[i]);
          const slot = h('div', { class: 'board-slot hidden' }, h('span', { class: 'b-rank' }, i + 1), D.answerPhoto(prompt, prompt.names[i], { cls: 'b-thumb', fallback: '' }), nameEl, h('span', { class: 'b-pts' }, BOARD_PTS[i]));
          slots.push(slot);
          grid.append(slot);
        }
        const after = h('div');

        const card = D.promptCard({
          game: g, prompt, seconds: BOARD_SECONDS, label: 'Board ' + st.b + '/' + BOARDS, used,
          onValid(m) {
            used.add(m.i);
            if (m.i < 8) {
              found.add(m.i);
              boardPts += BOARD_PTS[m.i];
              st.total += BOARD_PTS[m.i];
              st.found++;
              slots[m.i].className = 'board-slot found';
              S.countUp(totalEl, st.total, 400, st.total - BOARD_PTS[m.i]);
              S.sound.play(m.i < 3 ? 'great' : 'good');
              D.setDepth(Math.max(0, g.start - st.total * 6));
              if (found.size === 8) {
                st.total += 50;
                boardPts += 50;
                S.toast('🧹 Board cleared! +50 bonus');
                S.confetti();
                close('cleared');
                return;
              }
              return 'keep';
            }
            strikes++;
            paintStrikes();
            const x = h('div', { class: 'big-x', 'aria-hidden': 'true' }, '❌');
            document.body.append(x);
            setTimeout(() => x.remove(), 850);
            S.sound.play('bad');
            S.vibrate(150);
            card.note.textContent = '“' + m.name + '” is a real answer (#' + (m.i + 1) + '), but it is not in the top 8.';
            card.note.className = 'input-note';
            if (strikes >= STRIKES) {
              close('struck');
              return;
            }
            return 'keep';
          },
          onTimeout: () => close('time'),
        });

        function close(why) {
          if (closed) return;
          closed = true;
          card.lock();
          slots.forEach((s, i) => { if (!found.has(i)) setTimeout(() => (s.className = 'board-slot missed'), i * 90); });
          st.log.push({ prompt, found: found.size, pts: boardPts });
          const msg = why === 'cleared' ? '🧹 Perfect board!' : why === 'struck' ? '❌❌❌ Three strikes!' : '⏰ Time’s up!';
          const btn = h('button', { class: 'btn wide', style: { marginTop: '14px' } }, st.b >= BOARDS ? 'See results →' : 'Next board →');
          after.append(h('div', { class: 'feedback card', style: { padding: '16px' } },
            h('div', { class: 'tb-name', style: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 } }, msg),
            h('div', { class: 'fb-meters' }, 'You found ' + found.size + ' of 8 for ' + boardPts + ' points'),
            btn
          ));
          const off = enterToContinue(btn);
          D.cleanup = () => { card.stop(); off(); };
          btn.addEventListener('click', () => { off(); S.sound.play('pop'); board(); }, { once: true });
          setTimeout(() => btn.focus({ preventScroll: true }), 50);
        }

        D.show(
          h('div', { class: 'dive-hud' },
            h('span', { class: 'hud-pill' }, '📋 Board ', h('b', null, st.b + '/' + BOARDS)),
            h('span', { class: 'hud-pill' }, '⭐ ', totalEl)
          ),
          card.el,
          strikesEl,
          grid,
          after
        );
        card.focus();
        D.cleanup = () => card.stop();
      }

      function finish() {
        const max = BOARDS * (BOARD_PTS.reduce((a, b) => a + b, 0) + 50);
        const frac = st.total / max;
        const [emoji, title] = frac >= 0.8 ? ['🏆', 'Survey superstar'] : frac >= 0.6 ? ['🧠', 'Reads minds for a living'] : frac >= 0.4 ? ['📋', 'Good crowd instincts'] : frac >= 0.2 ? ['🤷', 'Marching to your own beat'] : ['👽', 'Not from around here'];
        D.results({
          mode: 'board', bestKey: 'noillirk:board', emoji, title, score: st.total,
          unitLabel: 'points out of ' + max.toLocaleString('en-US'), xp: st.total / 12 + st.found,
          stats: [[st.found + '/' + BOARDS * 8, 'answers found'], [Math.round(frac * 100) + '%', 'of max']],
          share: 'spil. Noillirk Survey Board 📋 ' + st.total + ' pts · found ' + st.found + '/' + BOARDS * 8 + ' top answers\n' + location.href.split('?')[0] + '?mode=board',
          recap: D.recapList(st.log.map((l) => ({ emoji: l.found === 8 ? '🧹' : l.found >= 5 ? '📋' : '🤏', pid: l.prompt.id, name: l.prompt.names[0], q: l.prompt.q, answer: 'Found ' + l.found + ' of 8', pts: '+' + l.pts }))),
          celebrate: frac >= 0.6,
        });
      }
    },
  };
})();
