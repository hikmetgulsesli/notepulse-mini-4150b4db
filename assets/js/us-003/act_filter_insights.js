(function (global) {
  'use strict';

  function actFilterInsights(event) {
    if (event) event.preventDefault();
    if (!global.NotePulseStore) return false;
    global.NotePulseStore.setView('operations');
    return true;
  }

  global.actFilterInsights = actFilterInsights;
})(window);
