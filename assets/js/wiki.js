/* Real photos from Wikipedia/Wikimedia Commons, fetched in the visitor's browser.
   Only free-licensed lead images are used (the PageImages API returns free images by default),
   each photo links to its file page with author and license. Requests are batched and cached. */
(function () {
  'use strict';
  const S = window.Spil;
  const { h } = S;
  const API = 'https://en.wikipedia.org/w/api.php';
  const CACHE_KEY = 'wiki:v1';
  const TTL = 21 * 864e5;
  const cache = S.store.get(CACHE_KEY, {});
  let saveTimer = null;

  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const keys = Object.keys(cache);
      if (keys.length > 1200) keys.sort((a, b) => cache[a][2] - cache[b][2]).slice(0, keys.length - 900).forEach((k) => delete cache[k]);
      S.store.set(CACHE_KEY, cache);
    }, 500);
  };
  const fresh = (e) => e && Date.now() - e[2] < TTL;
  const fromCache = (e) => (e[0] ? { src: e[0], file: e[1] } : null);

  function api(params) {
    const qs = new URLSearchParams(Object.assign({ format: 'json', formatversion: '2', origin: '*' }, params));
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 7000);
    return fetch(API + '?' + qs, { signal: ctl ? ctl.signal : undefined })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .finally(() => clearTimeout(timer));
  }

  // Resolve requested titles through normalisation + redirects to the returned page objects.
  function pagesByRequest(data, titles) {
    const q = data.query || {};
    const norm = {};
    (q.normalized || []).forEach((n) => (norm[n.from] = n.to));
    const redir = {};
    (q.redirects || []).forEach((r) => (redir[r.from] = r.to));
    const byTitle = {};
    (q.pages || []).forEach((p) => (byTitle[p.title] = p));
    const out = {};
    titles.forEach((t) => {
      let f = norm[t] || t;
      f = redir[f] || f;
      out[t] = byTitle[f] || null;
    });
    return out;
  }

  // ---------- Batched title lookups (max 50 titles per request) ----------
  const waiting = new Map();
  let flushTimer = null;

  function lookup(title) {
    const e = cache['t:' + title];
    if (fresh(e)) return Promise.resolve(fromCache(e));
    return new Promise((resolve) => {
      if (!waiting.has(title)) waiting.set(title, []);
      waiting.get(title).push(resolve);
      if (!flushTimer) flushTimer = setTimeout(flush, 0);
    });
  }

  function flush() {
    flushTimer = null;
    const batch = new Map(waiting);
    waiting.clear();
    const titles = [...batch.keys()];
    for (let i = 0; i < titles.length; i += 50) {
      const chunk = titles.slice(i, i + 50);
      const done = (t, img) => (batch.get(t) || []).forEach((r) => r(img));
      api({ action: 'query', prop: 'pageimages', piprop: 'thumbnail|name', pithumbsize: '960', pilimit: '50', redirects: '1', titles: chunk.join('|') })
        .then((data) => {
          const pages = pagesByRequest(data, chunk);
          chunk.forEach((t) => {
            const p = pages[t];
            const img = p && p.thumbnail ? { src: p.thumbnail.source, file: p.pageimage || '' } : null;
            cache['t:' + t] = [img ? img.src : '', img ? img.file : '', Date.now()];
            done(t, img);
          });
          save();
        })
        .catch(() => chunk.forEach((t) => done(t, null)));
    }
  }

  // "A|B|C" -> first title that has a free lead image
  function first(titles) {
    const list = String(titles || '').split('|').map((t) => t.trim()).filter(Boolean);
    if (!list.length) return Promise.resolve(null);
    return Promise.all(list.map(lookup)).then((imgs) => imgs.find(Boolean) || null);
  }

  // ---------- Search (for typed answers), max 4 at a time ----------
  let active = 0;
  const queue = [];
  const runQueued = () => {
    while (active < 4 && queue.length) {
      const job = queue.shift();
      active++;
      job().finally(() => {
        active--;
        runQueued();
      });
    }
  };

  function search(query, mustContain) {
    const key = 's:' + query.toLowerCase();
    const e = cache[key];
    if (fresh(e)) return Promise.resolve(fromCache(e));
    return new Promise((resolve) => {
      queue.push(() =>
        api({ action: 'query', generator: 'search', gsrsearch: query, gsrlimit: '3', gsrnamespace: '0', prop: 'pageimages', piprop: 'thumbnail|name', pithumbsize: '960' })
          .then((data) => {
            const pages = ((data.query || {}).pages || []).slice().sort((a, b) => (a.index || 0) - (b.index || 0));
            let pick = pages[0] && pages[0].thumbnail ? pages[0] : null;
            if (!pick && mustContain) {
              const want = S.norm(mustContain);
              pick = pages.find((p) => p.thumbnail && S.norm(p.title).includes(want)) || null;
            }
            const img = pick ? { src: pick.thumbnail.source, file: pick.pageimage || '' } : null;
            cache[key] = [img ? img.src : '', img ? img.file : '', Date.now()];
            save();
            resolve(img);
          })
          .catch(() => resolve(null))
      );
      runQueued();
    });
  }

  // ---------- Credits (author + license), batched ----------
  const creditWaiting = new Map();
  let creditTimer = null;
  function credit(file) {
    const e = cache['c:' + file];
    if (fresh(e)) return Promise.resolve({ artist: e[0], license: e[1] });
    return new Promise((resolve) => {
      if (!creditWaiting.has(file)) creditWaiting.set(file, []);
      creditWaiting.get(file).push(resolve);
      if (!creditTimer) creditTimer = setTimeout(flushCredits, 250);
    });
  }
  const strip = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  };
  function flushCredits() {
    creditTimer = null;
    const batch = new Map(creditWaiting);
    creditWaiting.clear();
    const files = [...batch.keys()];
    for (let i = 0; i < files.length; i += 50) {
      const chunk = files.slice(i, i + 50);
      const titles = chunk.map((f) => 'File:' + f.replace(/_/g, ' '));
      api({ action: 'query', prop: 'imageinfo', iiprop: 'extmetadata', iiextmetadatafilter: 'Artist|LicenseShortName', titles: titles.join('|') })
        .then((data) => {
          const pages = pagesByRequest(data, titles);
          chunk.forEach((f, j) => {
            const p = pages[titles[j]];
            const meta = p && p.imageinfo && p.imageinfo[0] && p.imageinfo[0].extmetadata ? p.imageinfo[0].extmetadata : {};
            const artist = strip(meta.Artist && meta.Artist.value).slice(0, 60);
            const license = strip(meta.LicenseShortName && meta.LicenseShortName.value);
            cache['c:' + f] = [artist, license, Date.now()];
            (batch.get(f) || []).forEach((r) => r({ artist, license }));
          });
          save();
        })
        .catch(() => chunk.forEach((f) => (batch.get(f) || []).forEach((r) => r({ artist: '', license: '' }))));
    }
  }

  // Wikimedia serves thumbnails at any width; stick to standard steps so they are cached at the edge.
  function sized(src, w) {
    if (!src || src.indexOf('/thumb/') < 0) return src;
    return src.replace(/\/(\d+)px-([^/]+)$/, (m, px, rest) => (+px > w ? '/' + w + 'px-' + rest : m));
  }

  const filePage = (file) => 'https://en.wikipedia.org/wiki/File:' + encodeURIComponent(file.replace(/ /g, '_'));

  /* Returns a <div class="ph"> that fills itself with a photo.
     opts: {size, cls, alt, credit:true, query, mustContain, fallback:node} */
  function photo(titles, opts = {}) {
    const el = h('div', { class: 'ph ' + (opts.cls || '') }, opts.fallback ? h('div', { class: 'ph-fallback' }, opts.fallback) : null);
    const p = opts.query ? search(opts.query, opts.mustContain) : first(titles);
    p.then((img) => {
      if (!img) {
        el.classList.add('ph-none');
        return;
      }
      const im = new Image();
      im.alt = opts.alt || '';
      im.decoding = 'async';
      im.draggable = false;
      im.onload = () => el.classList.add('ph-ready');
      im.onerror = () => {
        el.classList.add('ph-none');
        im.remove();
      };
      im.src = sized(img.src, opts.size || 960);
      el.append(im);
      if (opts.credit && img.file) {
        const a = h('a', { class: 'ph-credit', href: filePage(img.file), target: '_blank', rel: 'noopener', title: 'Photo source and license', onclick: (e) => e.stopPropagation() }, '📷 Wikimedia Commons');
        el.append(a);
        credit(img.file).then((c) => {
          const parts = [c.artist, c.license].filter(Boolean);
          if (parts.length) a.textContent = '📷 ' + parts.join(' · ');
        });
      }
    });
    return el;
  }

  // Warm the browser cache for upcoming images.
  function preload(titles, size) {
    return first(titles).then((img) => {
      if (img) {
        const im = new Image();
        im.src = sized(img.src, size || 960);
      }
      return img;
    });
  }

  S.wiki = { first, search, credit, sized, photo, preload };
})();
