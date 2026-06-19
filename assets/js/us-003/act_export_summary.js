(function (global) {
  'use strict';

  function actExportSummary(event) {
    if (event) event.preventDefault();
    if (!global.NotePulseStore || typeof global.NotePulseStore.exportSummary !== 'function') return false;
    global.NotePulseStore.exportSummary();
    return true;
  }

  global.actExportSummary = actExportSummary;
})(window);
