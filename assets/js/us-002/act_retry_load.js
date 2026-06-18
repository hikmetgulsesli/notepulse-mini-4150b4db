(function (global) {
  'use strict';

  function actRetryLoad(event) {
    if (event) event.preventDefault();
    if (!global.NotePulseStore) return false;
    global.NotePulseStore.retryLoad();
    return true;
  }

  global.actRetryLoad = actRetryLoad;
})(window);
