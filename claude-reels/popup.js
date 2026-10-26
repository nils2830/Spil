/* Reels mens Claude tænker: settings and a live status for the active tab. */
(function () {
  'use strict';
  const DEFAULTS = {
    enabled: true, openDelay: 3, closeDelay: 1, openIn: 'tab',
    url: 'https://www.instagram.com/reels/', stopSelector: '',
  };
  const $ = (id) => document.getElementById(id);

  // ---------- Settings ----------
  chrome.storage.sync.get(DEFAULTS).then((s) => {
    $('enabled').checked = s.enabled;
    $('openDelay').value = s.openDelay;
    $('closeDelay').value = s.closeDelay;
    $('url').value = s.url;
    $('stopSelector').value = s.stopSelector;
    document.querySelector(`input[name=openIn][value=${s.openIn}]`).checked = true;
  });

  const num = (el, fallback) => {
    const v = parseFloat(el.value);
    return Number.isFinite(v) && v >= 0 ? v : fallback;
  };
  function save() {
    chrome.storage.sync.set({
      enabled: $('enabled').checked,
      openDelay: num($('openDelay'), DEFAULTS.openDelay),
      closeDelay: num($('closeDelay'), DEFAULTS.closeDelay),
      openIn: document.querySelector('input[name=openIn]:checked').value,
      url: $('url').value.trim() || DEFAULTS.url,
      stopSelector: $('stopSelector').value.trim(),
    });
  }
  document.querySelectorAll('input').forEach((el) => el.addEventListener('change', save));

  // ---------- Live status ----------
  function show(kind, text) {
    $('status').className = 'status ' + kind;
    $('status-text').textContent = text;
  }

  async function refresh() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.startsWith('https://claude.ai/')) {
      return show('', 'Åbn en Claude-fane for at se status.');
    }
    chrome.tabs.sendMessage(tab.id, { type: 'status' }).then(
      (s) => {
        if (!s.busy) return show('idle', 'Claude er klar.');
        const how = s.stream ? 'svar-stream' : 'stop-knap';
        show('busy', `Claude arbejder (set via ${how}).`);
      },
      () => show('', 'Genindlæs Claude-fanen én gang, så udvidelsen kan følge med.'),
    );
  }
  refresh();
  setInterval(refresh, 1000);
})();
