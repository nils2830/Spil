/* Reels mens Claude tænker: runs inside claude.ai itself and reports how many answer streams are open.
   claude.ai streams each chat answer from a .../completion (or .../retry_completion) request; the stream
   ends the moment the answer is done, which is a sturdier signal than any button in the page. */
(function () {
  'use strict';
  const STREAM = /\/(retry_)?completion(\?|$)/;
  const realFetch = window.fetch;
  let active = 0;

  const emit = () => window.postMessage({ source: 'claude-reels', active }, location.origin);

  window.fetch = function (input, init) {
    const promise = realFetch.apply(this, arguments);
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input && input.url;
    if (!url || !STREAM.test(url)) return promise;

    active++;
    emit();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      active--;
      emit();
    };
    // Read our own copy of the stream to the end; the page keeps the original untouched.
    promise.then((res) => {
      if (!res.body) return finish();
      const reader = res.clone().body.getReader();
      (function pump() {
        reader.read().then(({ done }) => (done ? finish() : pump()), finish);
      })();
    }, finish);
    return promise;
  };
})();
