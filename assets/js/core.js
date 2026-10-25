/* Spil core: shared helpers used by every page (no build step, no dependencies). */
(function () {
  'use strict';
  const S = (window.Spil = {});

  // ---------- DOM ----------
  S.$ = (sel, el = document) => el.querySelector(sel);
  S.$$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  // h('div', {class: 'x', onclick: fn}, 'text', child, [more])
  S.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'style' && typeof v === 'object') {
          for (const p in v) p.startsWith('--') ? el.style.setProperty(p, v[p]) : (el.style[p] = v[p]);
        }
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    (function add(list) {
      list.forEach((kid) => {
        if (kid == null || kid === false) return;
        if (Array.isArray(kid)) add(kid);
        else el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
      });
    })(kids);
    return el;
  };

  S.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  S.param = (name) => new URLSearchParams(location.search).get(name);
  S.reducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Storage (never throws; private windows may block it) ----------
  const NS = 'spil:';
  S.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(NS + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, val) {
      try {
        localStorage.setItem(NS + key, JSON.stringify(val));
      } catch (e) { /* storage unavailable */ }
    },
  };

  // ---------- Seeded randomness (daily challenges are identical for everyone) ----------
  S.seed = function (str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
  S.rng = function (seed) {
    let a = typeof seed === 'string' ? S.seed(seed) : seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  S.shuffle = function (arr, rand = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  S.pick = (arr, rand = Math.random) => arr[Math.floor(rand() * arr.length)];
  S.clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  // ---------- Dates ----------
  const fmtDay = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  S.today = () => fmtDay(new Date());
  S.yesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return fmtDay(d);
  };
  S.dayNumber = () => {
    const start = new Date(2026, 0, 1);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((now - start) / 86400000) + 1;
  };
  S.untilMidnight = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const s = Math.max(0, Math.floor((next - now) / 1000));
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return hh + 'h ' + String(mm).padStart(2, '0') + 'm ' + String(ss).padStart(2, '0') + 's';
  };

  // ---------- Sound (tiny WebAudio synth, nothing to download) ----------
  let actx = null;
  function tone(freq, start, dur, type, vol, slideTo) {
    const t = actx.currentTime + start;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.14, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
  // [freq, start, duration, wave, volume, slideTo]
  const SOUNDS = {
    pop: [[620, 0, 0.07, 'triangle', 0.12]],
    click: [[900, 0, 0.03, 'square', 0.04]],
    tick: [[1250, 0, 0.025, 'square', 0.035]],
    good: [[523, 0, 0.1], [659, 0.08, 0.1], [784, 0.16, 0.2]],
    great: [[523, 0, 0.08], [659, 0.07, 0.08], [784, 0.14, 0.08], [1047, 0.21, 0.35]],
    meh: [[440, 0, 0.12], [392, 0.11, 0.2]],
    bad: [[220, 0, 0.16, 'sawtooth', 0.07], [150, 0.13, 0.28, 'sawtooth', 0.07]],
    bubble: [[260, 0, 0.12, 'sine', 0.12, 720]],
    sink: [[700, 0, 0.35, 'sine', 0.1, 180]],
    rise: [[220, 0, 0.35, 'sine', 0.1, 880]],
    win: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.16], [784, 0.52, 0.1], [1047, 0.62, 0.45]],
  };
  S.sound = {
    get muted() {
      return S.store.get('muted', false);
    },
    toggle() {
      S.store.set('muted', !this.muted);
      return this.muted;
    },
    play(name) {
      if (this.muted || !SOUNDS[name]) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        SOUNDS[name].forEach((n) => tone(...n));
      } catch (e) { /* audio unsupported */ }
    },
  };
  S.vibrate = (p) => {
    try {
      if (!S.sound.muted && navigator.vibrate) navigator.vibrate(p);
    } catch (e) { /* ignore */ }
  };

  // ---------- Confetti ----------
  S.confetti = function (opts = {}) {
    if (S.reducedMotion()) return;
    const canvas = S.h('canvas', { class: 'confetti-canvas' });
    document.body.append(canvas);
    const c = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = (canvas.width = innerWidth * dpr);
    const H = (canvas.height = innerHeight * dpr);
    const colors = opts.colors || ['#ff4d6d', '#ffb020', '#22c55e', '#3b82f6', '#a855f7', '#06b6d4', '#f97316'];
    const n = opts.count || 140;
    const parts = [];
    for (let i = 0; i < n; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.25,
        y: H * (opts.y || 0.4),
        vx: (Math.random() - 0.5) * 18 * dpr,
        vy: (-Math.random() * 15 - 5) * dpr,
        s: (5 + Math.random() * 7) * dpr,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.35,
        col: colors[i % colors.length],
        round: Math.random() < 0.3,
      });
    }
    let frame = 0;
    (function loop() {
      c.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.38 * dpr;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.r);
        c.fillStyle = p.col;
        if (p.round) {
          c.beginPath();
          c.arc(0, 0, p.s / 2.4, 0, 6.283);
          c.fill();
        } else c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        c.restore();
      }
      if (++frame < 200) requestAnimationFrame(loop);
      else canvas.remove();
    })();
  };

  // ---------- Toasts & share ----------
  S.toast = function (msg, ms = 2400) {
    let wrap = S.$('.toasts');
    if (!wrap) {
      wrap = S.h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
      document.body.append(wrap);
    }
    const t = S.h('div', { class: 'toast' }, msg);
    wrap.append(t);
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 350);
    }, ms);
  };

  S.share = async function (text) {
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      S.toast('📋 Result copied, paste it anywhere!');
    } catch (e) {
      window.prompt('Copy your result:', text);
    }
  };

  // ---------- Profile, XP & streaks (shared across all games) ----------
  const TITLES = ['Fresh Fish', 'Curious Cat', 'Trivia Tadpole', 'Quiz Kid', 'Know-it-some', 'Brainiac', 'Time Traveler', 'Deep Diver', 'Oracle', 'Walking Wikipedia', 'Living Legend'];
  S.profile = {
    get() {
      return S.store.get('profile', { xp: 0, plays: 0, streak: 0, lastDay: null });
    },
    level(xp) {
      let lvl = 1, need = 120, rest = xp;
      while (rest >= need) {
        rest -= need;
        lvl++;
        need = 120 + (lvl - 1) * 60;
      }
      return { level: lvl, into: rest, need, title: TITLES[Math.min(lvl - 1, TITLES.length - 1)] };
    },
    streak() {
      const p = this.get();
      return p.lastDay === S.today() || p.lastDay === S.yesterday() ? p.streak : 0;
    },
    addXP(n) {
      const p = this.get();
      const before = this.level(p.xp).level;
      p.xp += Math.max(0, Math.round(n));
      p.plays++;
      const today = S.today();
      if (p.lastDay !== today) {
        p.streak = p.lastDay === S.yesterday() ? p.streak + 1 : 1;
        p.lastDay = today;
      }
      S.store.set('profile', p);
      const after = this.level(p.xp);
      S.renderXP();
      if (after.level > before) {
        setTimeout(() => {
          S.toast('⬆️ Level ' + after.level + '! You are now a ' + after.title + '.', 3500);
          S.sound.play('win');
        }, 1100);
      }
      return after;
    },
  };

  // ---------- Bests & dailies ----------
  S.best = {
    get(key) {
      return S.store.get('best:' + key, null);
    },
    submit(key, score) {
      const prev = this.get(key);
      const isNew = prev == null || score > prev;
      if (isNew) S.store.set('best:' + key, score);
      return { isNew: isNew && prev != null && score > 0, prev };
    },
  };
  S.daily = {
    get(game) {
      const d = S.store.get('daily:' + game, null);
      return d && d.day === S.today() ? d : null;
    },
    set(game, data) {
      S.store.set('daily:' + game, Object.assign({ day: S.today() }, data));
    },
  };

  // ---------- Text matching for typed answers ----------
  S.norm = (s) =>
    String(s)
      .toLowerCase()
      .replace(/æ/g, 'ae').replace(/[øœ]/g, 'o').replace(/ß/g, 'ss').replace(/ł/g, 'l').replace(/ð/g, 'd').replace(/þ/g, 'th')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/&/g, ' and ').replace(/\+/g, 'plus').replace(/#/g, 'sharp')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\b(the|a|an)\b/g, ' ')
      .replace(/\s+/g, '');

  S.lev = function (a, b, max) {
    if (a === b) return 0;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  };

  // answers: ['Name|alias|alias', ...] -> match(input) returns {i, name} or null
  S.makeMatcher = function (answers) {
    const exact = new Map();
    answers.forEach((raw, i) => {
      const parts = raw.split('|');
      const entry = { i, name: parts[0] };
      parts.forEach((p) => {
        const k = S.norm(p);
        if (k && !exact.has(k)) exact.set(k, entry);
      });
    });
    return function match(input) {
      const k = S.norm(input);
      if (!k) return null;
      if (exact.has(k)) return exact.get(k);
      const variants = [k.replace(/ies$/, 'y'), k.replace(/es$/, ''), k.replace(/s$/, ''), k + 's', k + 'es'];
      for (const v of variants) if (exact.has(v)) return exact.get(v);
      if (k.length < 5) return null;
      const tol = k.length >= 9 ? 2 : 1;
      let best = null, bestD = tol + 1;
      for (const [key, entry] of exact) {
        if (key.length < 5 || Math.abs(key.length - k.length) > tol) continue;
        const d = S.lev(k, key, tol);
        if (d < bestD) {
          bestD = d;
          best = entry;
        }
      }
      return best;
    };
  };

  // ---------- Animation helpers ----------
  S.countUp = function (el, to, ms = 700, from = 0, fmt) {
    const f = fmt || ((n) => n.toLocaleString('en-US'));
    if (S.reducedMotion()) {
      el.textContent = f(to);
      return;
    }
    const t0 = performance.now();
    (function step(t) {
      const p = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = f(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  };
  S.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  S.restartAnim = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  // Countdown timer: onTick(secondsLeft, fractionLeft), onEnd()
  S.timer = function (seconds, onTick, onEnd) {
    let end = performance.now() + seconds * 1000;
    let total = seconds * 1000;
    let done = false;
    const id = setInterval(() => {
      if (done) return;
      const rem = Math.max(0, end - performance.now());
      if (onTick) onTick(rem / 1000, rem / total);
      if (rem <= 0) {
        done = true;
        clearInterval(id);
        if (onEnd) onEnd();
      }
    }, 50);
    return {
      stop() {
        done = true;
        clearInterval(id);
      },
      add(sec, cap) {
        const now = performance.now();
        end = Math.max(now, end + sec * 1000);
        if (cap) end = Math.min(end, now + cap * 1000);
        total = Math.max(total, end - now);
      },
      get left() {
        return Math.max(0, end - performance.now()) / 1000;
      },
    };
  };

  // ---------- Top bar (logo, level chip, sound toggle) ----------
  S.renderXP = function () {
    const chip = S.$('.xp-chip');
    if (!chip) return;
    const p = S.profile.get();
    const L = S.profile.level(p.xp);
    S.$('.xp-level', chip).textContent = 'Lv ' + L.level;
    S.$('.xp-fill', chip).style.width = Math.round((L.into / L.need) * 100) + '%';
    chip.title = L.title + ' · ' + L.into + ' / ' + L.need + ' XP to next level';
    const st = S.$('.xp-streak', chip);
    const streak = S.profile.streak();
    st.textContent = streak > 0 ? '🔥' + streak : '';
    st.hidden = streak <= 0;
  };

  S.mountTopbar = function (opts = {}) {
    const host = S.$('#topbar');
    if (!host) return;
    const home = opts.home || './';
    const soundBtn = S.h('button', { class: 'icon-btn', 'aria-label': 'Toggle sound', title: 'Sound on/off' });
    const paint = () => (soundBtn.textContent = S.sound.muted ? '🔇' : '🔊');
    paint();
    soundBtn.addEventListener('click', () => {
      S.sound.toggle();
      paint();
      S.sound.play('pop');
    });
    host.className = 'topbar';
    host.append(
      S.h('a', { class: 'logo', href: home }, opts.back ? S.h('span', { class: 'logo-back' }, '←') : null, S.h('span', { class: 'logo-word' }, 'spil'), S.h('span', { class: 'logo-dot' }, '.')),
      opts.title ? S.h('div', { class: 'topbar-title' }, opts.title) : S.h('div', { class: 'topbar-title' }),
      S.h('div', { class: 'topbar-right' },
        S.h('a', { class: 'xp-chip', href: home + '#profile' },
          S.h('span', { class: 'xp-streak' }),
          S.h('span', { class: 'xp-level' }),
          S.h('span', { class: 'xp-bar' }, S.h('span', { class: 'xp-fill' }))
        ),
        soundBtn
      )
    );
    S.renderXP();
  };
})();
