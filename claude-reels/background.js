/* Reels mens Claude tænker: opens Reels when a Claude tab starts working, then closes it and jumps back to
   that Claude tab the moment it is done. State lives in storage.session because Chrome stops idle service workers;
   the short close delay runs here because timers in the hidden Claude tab only fire once a second. */
const DEFAULTS = { enabled: true, url: 'https://www.instagram.com/reels/', openIn: 'tab', closeDelay: 1 };
const EMPTY = { reelsTabId: null, ownerTabId: null };

// Messages can arrive back to back; handle them one at a time so the state never gets clobbered.
let queue = Promise.resolve();
const serial = (fn) => (queue = queue.then(fn).catch((e) => console.warn('[claude-reels]', e)));

let closeTimer = 0;
let closingFor = null; // Claude tab whose Reels is about to close

const getState = async () => (await chrome.storage.session.get({ state: EMPTY })).state;
const setState = (state) => chrome.storage.session.set({ state });
const tabExists = (id) => (id == null ? Promise.resolve(false) : chrome.tabs.get(id).then(() => true, () => false));

function cancelClose() {
  clearTimeout(closeTimer);
  closingFor = null;
}

async function start(claude) {
  cancelClose();
  const settings = await chrome.storage.sync.get(DEFAULTS);
  if (!settings.enabled) return;
  const state = await getState();
  if (await tabExists(state.reelsTabId)) {
    await setState({ ...state, ownerTabId: claude.id });
    return;
  }

  let reels;
  if (settings.openIn === 'window') {
    const win = await chrome.windows.create({ url: settings.url, type: 'popup', width: 460, height: 860, focused: true });
    reels = win.tabs[0];
  } else {
    reels = await chrome.tabs.create({
      url: settings.url,
      windowId: claude.windowId,
      index: claude.index + 1,
      openerTabId: claude.id,
      active: true,
    });
  }
  await setState({ reelsTabId: reels.id, ownerTabId: claude.id });
}

// Claude is back at work within the close delay: keep Reels open. Tells the tab whether that happened.
function resume(claude) {
  if (closingFor !== claude.id) return false;
  cancelClose();
  return true;
}

async function idle(claude) {
  const state = await getState();
  if (state.ownerTabId !== claude.id) return;
  const { closeDelay } = await chrome.storage.sync.get(DEFAULTS);
  cancelClose();
  closingFor = claude.id;
  closeTimer = setTimeout(() => serial(() => done(claude.id)), closeDelay * 1000);
}

async function done(claudeId) {
  if (closingFor !== claudeId) return;
  closingFor = null;
  const state = await getState();
  if (state.ownerTabId !== claudeId) return;
  await setState(EMPTY);
  // Reels already closed by hand: the user has moved on, so leave them where they are.
  if (!(await tabExists(state.reelsTabId))) return;

  await chrome.tabs.remove(state.reelsTabId);
  const claude = await chrome.tabs.update(claudeId, { active: true });
  await chrome.windows.update(claude.windowId, { focused: true });
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!sender.tab) return;
  if (msg.type === 'start') serial(() => start(sender.tab));
  if (msg.type === 'idle') serial(() => idle(sender.tab));
  if (msg.type === 'busy') {
    serial(() => resume(sender.tab)).then((resumed) => reply({ resumed: !!resumed }));
    return true; // reply comes asynchronously
  }
});

chrome.tabs.onRemoved.addListener((tabId) => serial(async () => {
  const state = await getState();
  if (tabId === state.reelsTabId || tabId === state.ownerTabId) {
    if (closingFor === state.ownerTabId) cancelClose();
    await setState(EMPTY);
  }
}));
