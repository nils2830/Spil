/* Reels mens Claude tænker: watches a claude.ai tab and tells the background when Claude starts and stops working.
   Two signals, either one means "busy":
   1. an open answer stream (reported by net-hook.js; covers the normal chat),
   2. a visible stop/interrupt button (covers Claude Code on the web and anything the stream check misses).
   Chrome runs timers in hidden tabs at most once a second, and this tab is hidden while Reels plays, so the
   close delay lives in the background and the end of an answer is reported straight from the event that saw it. */
(function () {
  'use strict';
  const DEFAULTS = { openDelay: 3, stopSelector: '' };
  const STOP_NAME = /^(stop|interrupt|afbryd)(\s|$)/i;
  const NOT_STOP = /record|dictat|voice|listen|shar|audio|video|play/i;

  let settings = { ...DEFAULTS };
  let netActive = 0;
  let busy = false;         // what the page shows right now
  let started = false;      // the background has opened Reels for this tab (or is about to close it)
  let stopButton = null;    // the stop button last seen, so its removal is noticed without waiting for a timer
  let openTimer = 0;
  let checkTimer = 0;

  // ---------- Signals ----------
  const visible = (el) => el.getClientRects().length > 0;

  function findStopButton() {
    if (settings.stopSelector) {
      try {
        const custom = Array.from(document.querySelectorAll(settings.stopSelector)).find(visible);
        if (custom) return custom;
      } catch (e) { /* invalid selector typed in the popup */ }
    }
    return Array.from(document.querySelectorAll('button')).find((btn) => {
      const name = (btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.textContent || '').trim();
      return name.length < 40 && STOP_NAME.test(name) && !NOT_STOP.test(name) && visible(btn);
    }) || null;
  }

  // ---------- Talking to the background ----------
  function send(type) {
    try {
      return chrome.runtime.sendMessage({ type }).catch(() => null);
    } catch (e) {
      return Promise.resolve(null); // the extension was reloaded; this tab needs a refresh
    }
  }

  // ---------- State ----------
  function armOpen() {
    clearTimeout(openTimer);
    // Only when the user is looking at this tab: a Claude that wakes up on its own must not pop Reels up.
    if (document.visibilityState !== 'visible') return;
    openTimer = setTimeout(() => {
      if (!busy || document.visibilityState !== 'visible') return;
      started = true;
      send('start');
    }, settings.openDelay * 1000);
  }

  function update() {
    stopButton = findStopButton();
    const now = netActive > 0 || !!stopButton;
    if (now === busy) return;
    busy = now;

    if (busy) {
      if (!started) return armOpen();
      // Working again right after finishing: keep Reels if the background has not closed it yet.
      send('busy').then((r) => {
        if (r && r.resumed) return;
        started = false;
        if (busy) armOpen();
      });
    } else {
      clearTimeout(openTimer); // a quick answer: never bother opening Reels
      if (started) send('idle');
    }
  }

  function scheduleCheck() {
    if (!checkTimer) checkTimer = setTimeout(() => { checkTimer = 0; update(); }, 100);
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || e.data.source !== 'claude-reels') return;
    netActive = e.data.active;
    update();
  });

  new MutationObserver(() => {
    // While Reels is open this tab is hidden and its timers lag, so the end of an answer, and Claude
    // picking up again before Reels closes, are handled right away instead of on the next timer.
    if ((stopButton && !stopButton.isConnected) || (started && !busy && document.hidden)) update();
    else scheduleCheck();
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title', 'class', 'style', 'hidden', 'disabled'],
  });
  document.addEventListener('visibilitychange', scheduleCheck);

  // ---------- Settings and status for the popup ----------
  function loadSettings() {
    chrome.storage.sync.get(DEFAULTS).then((s) => { settings = s; scheduleCheck(); });
  }
  loadSettings();
  chrome.storage.onChanged.addListener((changes, area) => { if (area === 'sync') loadSettings(); });

  chrome.runtime.onMessage.addListener((msg, sender, reply) => {
    if (msg.type === 'status') reply({ busy, started, stream: netActive > 0, button: !!findStopButton() });
  });

  update();
})();
