(function (global) {
  'use strict';

  function actExportSummary(event) {
    if (event) event.preventDefault();
    if (!global.NotePulseStore) return false;
    global.NotePulseStore.exportSummary();
    return true;
  }

  global.actExportSummary = actExportSummary;
})(window);
